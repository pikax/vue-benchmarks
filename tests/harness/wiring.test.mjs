/**
 * Wiring guard for scripts/**\/*.mjs.
 *
 * Regression guard for the class of bug where a module calls `measureVariants`
 * while importing `measureVariantsAlternating`: the import links fine, the
 * module loads fine, and the ReferenceError only lands mid-benchmark. A plain
 * `import()` cannot see it, so the free-identifier check below uses the
 * TypeScript parser (already a devDependency) to resolve every bare name.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import { collectMjsFiles, makeTempDir, removeDir, repoRoot } from "./helpers.mjs";

const require = createRequire(import.meta.url);

let ts = null;
try {
  ts = require("typescript");
} catch {
  ts = null;
}

/**
 * Globals that exist at runtime but are not declared by lib.esnext.d.ts.
 * @types/node is deliberately NOT a dependency of this repo (see writeTsconfig),
 * so the ambient Node surface has to be listed here instead.
 */
const AMBIENT_GLOBALS = new Set([
  "AbortController",
  "AbortSignal",
  "Buffer",
  "TextDecoder",
  "TextEncoder",
  "URL",
  "URLSearchParams",
  "__dirname",
  "__filename",
  "clearImmediate",
  "clearInterval",
  "clearTimeout",
  "console",
  "exports",
  "fetch",
  "global",
  "module",
  "performance",
  "process",
  "queueMicrotask",
  "require",
  "setImmediate",
  "setInterval",
  "setTimeout",
  "structuredClone",
]);

const MISSING_EXPORT_CODES = new Set([2305, 2306, 2613, 2614, 2724]);

function analyse(files) {
  const program = ts.createProgram(files, {
    allowJs: true,
    checkJs: true,
    noEmit: true,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ["lib.esnext.d.ts"],
    skipLibCheck: true,
  });

  const undeclared = [];
  const missingExports = [];
  const brokenRelativeImports = [];

  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    const file = diagnostic.file ? relative(repoRoot, diagnostic.file.fileName) : "?";
    const line = diagnostic.file
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1
      : 0;
    const where = `${file}:${line}`;

    if (diagnostic.code === 2304) {
      const name = /Cannot find name '([^']+)'/.exec(message)?.[1];
      if (!name || AMBIENT_GLOBALS.has(name)) continue;
      undeclared.push(`${where} — ${message}`);
      continue;
    }

    if (MISSING_EXPORT_CODES.has(diagnostic.code)) {
      missingExports.push(`${where} — ${message}`);
      continue;
    }

    if (diagnostic.code === 2307) {
      // Bare specifiers (node:*, npm packages) cannot resolve without @types;
      // only a broken RELATIVE path is a real wiring bug.
      const specifier = /Cannot find module '([^']+)'/.exec(message)?.[1] ?? "";
      if (specifier.startsWith(".")) brokenRelativeImports.push(`${where} — ${message}`);
    }
  }

  return { undeclared, missingExports, brokenRelativeImports };
}

const HARNESS_FILES = [
  ...collectMjsFiles(join(repoRoot, "scripts")),
  ...collectMjsFiles(join(repoRoot, "tests", "harness")),
];

/** One program build shared by the three assertions below. */
let harnessAnalysisCache = null;
function analyseHarness() {
  harnessAnalysisCache ??= analyse(HARNESS_FILES);
  return harnessAnalysisCache;
}

/** compile -> runCompileSurface, jsx-compile -> runJsxCompileSurface, ... */
function expectedSurfaceExport(file) {
  const pascal = basename(file, ".mjs")
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
  return `run${pascal}Surface`;
}

describe("module loading", () => {
  test("every scripts/lib module imports cleanly", async () => {
    const files = collectMjsFiles(join(repoRoot, "scripts", "lib"));
    assert.ok(files.length > 5, "expected to find the harness library modules");

    for (const file of files) {
      // A named import of something the target does not export is a link-time
      // SyntaxError, so this alone catches renamed/removed exports.
      await assert.doesNotReject(
        () => import(pathToFileURL(file).href),
        `${relative(repoRoot, file)} failed to import`,
      );
    }
  });

  test("every surface module exports its run*Surface entry point", async () => {
    const files = collectMjsFiles(join(repoRoot, "scripts", "lib", "surfaces"));
    assert.ok(files.length >= 7, `expected all surfaces, found ${files.length}`);

    for (const file of files) {
      const namespace = await import(pathToFileURL(file).href);
      const expected = expectedSurfaceExport(file);
      assert.equal(
        typeof namespace[expected],
        "function",
        `${relative(repoRoot, file)} must export ${expected}, got [${Object.keys(namespace)}]`,
      );
    }
  });
});

describe("static wiring check", () => {
  test("the checker itself detects a call to an unimported binding", (t) => {
    if (!ts) return t.skip("typescript is not installed");

    // Positive control: without this, a broken checker would pass everything.
    const dir = makeTempDir("wiring-control-");
    try {
      writeFileSync(
        join(dir, "dep.mjs"),
        "export function measureVariants() { return 1; }\nexport const measureVariantsAlternating = measureVariants;\n",
      );
      writeFileSync(
        join(dir, "caller.mjs"),
        'import { measureVariantsAlternating } from "./dep.mjs";\nexport function go() { return measureVariants([]); }\nexport const alias = measureVariantsAlternating;\n',
      );
      writeFileSync(join(dir, "bad-import.mjs"), 'import { neverExported } from "./dep.mjs";\nexport const x = neverExported;\n');
      writeFileSync(join(dir, "bad-path.mjs"), 'import { nope } from "./does-not-exist.mjs";\nexport const y = nope;\n');

      const result = analyse([
        join(dir, "dep.mjs"),
        join(dir, "caller.mjs"),
        join(dir, "bad-import.mjs"),
        join(dir, "bad-path.mjs"),
      ]);

      assert.ok(
        result.undeclared.some((f) => f.includes("measureVariants")),
        `expected an undeclared-name finding, got ${JSON.stringify(result.undeclared)}`,
      );
      assert.ok(
        result.missingExports.some((f) => f.includes("neverExported")),
        `expected a missing-export finding, got ${JSON.stringify(result.missingExports)}`,
      );
      assert.ok(
        result.brokenRelativeImports.some((f) => f.includes("does-not-exist.mjs")),
        `expected a broken relative import finding, got ${JSON.stringify(result.brokenRelativeImports)}`,
      );
    } finally {
      removeDir(dir);
    }
  });

  test("no module calls an identifier it never imported or declared", (t) => {
    if (!ts) return t.skip("typescript is not installed");

    const { undeclared } = analyseHarness();

    assert.deepEqual(undeclared, [], `undeclared identifiers:\n${undeclared.join("\n")}`);
  });

  test("no module imports a binding its target does not export", (t) => {
    if (!ts) return t.skip("typescript is not installed");

    const { missingExports } = analyseHarness();

    assert.deepEqual(missingExports, [], `missing exports:\n${missingExports.join("\n")}`);
  });

  test("every relative import path resolves", (t) => {
    if (!ts) return t.skip("typescript is not installed");

    const { brokenRelativeImports } = analyseHarness();

    assert.deepEqual(brokenRelativeImports, [], `broken relative imports:\n${brokenRelativeImports.join("\n")}`);
  });
});

describe("surface invariants", () => {
  const surfaceSources = () =>
    collectMjsFiles(join(repoRoot, "scripts", "lib", "surfaces")).map((file) => ({
      name: relative(repoRoot, file),
      source: readFileSync(file, "utf8"),
    }));

  test("every surface measures through measureVariants — the rotating measurer", () => {
    for (const { name, source } of surfaceSources()) {
      assert.match(source, /^import \{[^}]*\bmeasureVariants\b/ms, `${name} does not import measureVariants`);
      assert.match(source, /await measureVariants\(/, `${name} does not call measureVariants`);
    }
  });

  test("no surface uses the deprecated measureVariantsAlternating alias", () => {
    // Importing the old name while calling the new one is exactly how a plain
    // ReferenceError shipped into the middle of a benchmark run.
    for (const { name, source } of surfaceSources()) {
      assert.ok(
        !source.includes("measureVariantsAlternating"),
        `${name} still references the deprecated measureVariantsAlternating`,
      );
    }
  });

  test("no surface hard-codes a warmup count or a runs count", () => {
    // Run parameters must come from options so `--warmups 0` still clamps to 1.
    // ONE named exception: a surface whose gate/preflight already executes every
    // cell untimed on the identical code path may declare that pass as its
    // discarded warmup — but only via the GATE_IS_THE_WARM_PASS constant (never
    // a bare 0), and only if the surface SAYS SO in its methodology, so the
    // justification travels with the number.
    for (const { name, source } of surfaceSources()) {
      assert.doesNotMatch(source, /warmups:\s*\d/, `${name} hard-codes a warmup count`);
      assert.doesNotMatch(source, /\bruns:\s*\d/, `${name} hard-codes a run count`);
      if (source.includes("GATE_IS_THE_WARM_PASS")) {
        assert.match(
          source,
          /DISCARDED WARM PASS/,
          `${name} uses GATE_IS_THE_WARM_PASS without disclosing the warm pass in its methodology`,
        );
      }
    }
  });

  test("gated surfaces route their gate through applyWorkGate", () => {
    for (const { name, source } of surfaceSources()) {
      if (!/work-gate\.mjs/.test(source)) continue;
      assert.match(source, /applyWorkGate\(/, `${name} imports the work gate but never applies it`);
    }
  });

  test("the typecheck surface requires script, template and corpus plants", () => {
    const source = readFileSync(join(repoRoot, "scripts", "lib", "surfaces", "typecheck.mjs"), "utf8");

    assert.match(source, /typecheckGateDetail\(/, "the two-plant gate must stay wired up");
    assert.match(source, /corpusGateFor\(/, "the full-corpus re-check must stay wired up");
    assert.match(source, /prepareCorpusPlant\(checkDir\)/, "the corpus plant must be built from the timed project");
    assert.match(source, /detail\.ok && corpus/, "both gate stages must be required to rank a tool");
  });
});

describe("bench entry point", () => {
  const benchSource = () => readFileSync(join(repoRoot, "scripts", "bench.mjs"), "utf8");

  test("every surface module is wired into an orchestrator", () => {
    // There are two orchestrators, not one. `bench.mjs` runs the generated
    // fixtures; `bench-real-world.mjs` runs pinned third-party checkouts and
    // owns the surfaces that only make sense there (a bundler needs a real app,
    // and the generated corpus is a flat directory of components with no entry).
    //
    // The point of this test is unchanged: a surface module that no orchestrator
    // calls is dead code that still looks maintained. Which orchestrator claims
    // it is not the assertion — being claimed by one of them is.
    const orchestrators = ["bench.mjs", "bench-real-world.mjs"].map((f) =>
      readFileSync(join(repoRoot, "scripts", f), "utf8"),
    );
    const surfaces = collectMjsFiles(join(repoRoot, "scripts", "lib", "surfaces"));

    for (const file of surfaces) {
      const expected = expectedSurfaceExport(file);
      assert.ok(
        orchestrators.some((source) => source.includes(expected)),
        `no orchestrator references ${expected} — scripts/bench.mjs and scripts/bench-real-world.mjs were both checked`,
      );
    }
  });

  test("bench.mjs clamps --warmups through effectiveWarmups rather than trusting the CLI", () => {
    const source = benchSource();

    assert.match(source, /import \{ effectiveWarmups \} from "\.\/lib\/timing\.mjs";/);
    assert.match(source, /effectiveWarmups\(args\.warmups\)/, "the CLI value must be clamped before use");
    assert.match(source, /warmups,\s*$/m, "the clamped value must be what reaches the surfaces");
  });

  test("--help documents the ranking rules the code actually enforces", () => {
    const source = benchSource();

    assert.match(source, /no cold metric/i, "--help must state that there is no cold column");
    assert.match(source, /--warmups 0 is clamped to 1/, "--help must state the warmup clamp");
    assert.match(source, /Median of measured runs/i, "--help must state the primary metric");
  });
});
