/**
 * Typecheck surface: the artifact census, and the plant's dependency resolution.
 *
 * Two defects lived here, both of which made a tool look better than it was:
 *
 *   1. countDiagnostics() only understood tsc's `file(line,col): severity`
 *      shape, so `vize check` — which prints `error:LINE:COL [TSxxxx]` wrapped
 *      in ANSI colour — censused as 0 diagnostics while emitting 40 real
 *      TS2322s. The artifact column is the mechanism that tells "fast" from
 *      "did less", and a 0 there is indistinguishable from "stopped analysing".
 *
 *   2. prepareTypecheckPlant() built plant projects that could only resolve
 *      `vue` by walking up into the repo's node_modules, so a `--work` root
 *      outside the repo silently disabled template typechecking and unranked
 *      five of six tools with the wrong reason.
 *
 * Every sample string below is COPIED FROM A REAL RUN against a corpus with a
 * known number of planted errors (20 files x 2 script-level TS2322 = 40, plus a
 * nested-type corpus whose single diagnostic spans three lines). They are
 * verbatim, ANSI codes included, so a future format change fails here loudly
 * instead of silently zeroing a column.
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

import { countDiagnostics } from "../../scripts/lib/surfaces/typecheck.mjs";
import { prepareTypecheckPlant } from "../../scripts/lib/work-gate.mjs";
import { makeTempDir, removeDir, repoRoot } from "./helpers.mjs";

const ESC = "\u001B";

// ---------------------------------------------------------------------------
// Captured samples. Two planted errors per file unless noted.
// ---------------------------------------------------------------------------

/** vue-tsc --noEmit -p tsconfig.json (stdout, CRLF). */
const VUE_TSC = [
  "Planted000.vue(3,7): error TS2322: Type 'string' is not assignable to type 'number'.",
  "Planted000.vue(5,7): error TS2322: Type 'number' is not assignable to type 'string'.",
  "",
].join("\r\n");

/** golar typecheck (stdout) — same tsc shape behind a config preamble. */
const GOLAR = [
  "Using config from ./golar.config.ts...",
  "Planted000.vue(3,7): error TS2322: Type 'string' is not assignable to type 'number'.",
  "Planted000.vue(5,7): error TS2322: Type 'number' is not assignable to type 'string'.",
  "",
].join("\n");

/** verter-tsc (stdout) — absolute POSIX paths; the count lands on stderr. */
const VERTER_STDOUT = [
  "D:/work/n20/Comp00000.vue(83,7): error TS2322: Type 'string' is not assignable to type 'number'.",
  "D:/work/n20/Comp00000.vue(85,7): error TS2322: Type 'number' is not assignable to type 'string'.",
  "",
].join("\n");
const VERTER_STDERR = "verter-tsc: checking 20 .vue file(s)...\nFound 40 error(s) in 20 file(s).\n";

/**
 * vize check . --tsconfig tsconfig.json (stdout).
 *
 * Severity-first, indented under an underlined filename heading, and coloured
 * even though runCommand exports NO_COLOR=1 and FORCE_COLOR=0. No `(line,col):`
 * anywhere — this is the output the old counter scored 0 on.
 */
const VIZE = [
  "",
  `${ESC}[4mD:\\work\\n20\\Comp00000.vue${ESC}[0m`,
  `  ${ESC}[31merror:83:7 [TS2322] Type 'string' is not assignable to type 'number'.${ESC}[0m`,
  `  ${ESC}[31merror:85:7 [TS2322] Type 'number' is not assignable to type 'string'.${ESC}[0m`,
  "",
  `${ESC}[31m\u2717${ESC}[0m Type checked 22 files in 176.70ms (collect: 7.62ms, gen: 7.89ms, corsa: 128.74ms)`,
  `  ${ESC}[31m40 error(s)${ESC}[0m`,
  "",
].join("\n");

/**
 * The tsc "pretty" layout, emitted by golar and by vue-tsc (TNB) whenever
 * colour is on. Different separator (` - `), positions as `:line:col`, and a
 * code frame underneath that must not be counted.
 */
const TSC_PRETTY = [
  `${ESC}[96mPlanted000.vue${ESC}[0m:${ESC}[93m3${ESC}[0m:${ESC}[93m7${ESC}[0m - ${ESC}[91merror${ESC}[0m${ESC}[90m TS2322: ${ESC}[0mType 'string' is not assignable to type 'number'.`,
  "",
  `${ESC}[7m3${ESC}[0m const a0: number = "not-a-number"`,
  `${ESC}[7m ${ESC}[0m ${ESC}[91m      ~~${ESC}[0m`,
  "",
  `${ESC}[96mPlanted000.vue${ESC}[0m:${ESC}[93m5${ESC}[0m:${ESC}[93m7${ESC}[0m - ${ESC}[91merror${ESC}[0m${ESC}[90m TS2322: ${ESC}[0mType 'number' is not assignable to type 'string'.`,
  "",
  `${ESC}[7m5${ESC}[0m const b0: string = 12345`,
  `${ESC}[7m ${ESC}[0m ${ESC}[91m      ~~${ESC}[0m`,
  "",
].join("\n");

/** ONE diagnostic. TypeScript indents the continuation lines. */
const TSC_MULTILINE = [
  "Deep000.vue(5,7): error TS2322: Type '{ nested: { deeper: { deepest: string; }; }; }' is not assignable to type 'Want0'.",
  "  The types of 'nested.deeper.deepest' are incompatible between these types.",
  "    Type 'string' is not assignable to type 'number'.",
  "",
].join("\n");

/**
 * ONE diagnostic. vize does NOT indent its continuation lines — they sit at
 * column 0 inside the same colour run, and the last of them is a sentence that
 * a loose counter reads as a diagnostic of its own.
 */
const VIZE_MULTILINE = [
  "",
  `${ESC}[4mD:\\work\\multiline\\Deep000.vue${ESC}[0m`,
  `  ${ESC}[31merror:5:7 [TS2322] Type '{ nested: { deeper: { deepest: string; }; }; }' is not assignable to type 'Want0'.`,
  "The types of 'nested.deeper.deepest' are incompatible between these types.",
  `Type 'string' is not assignable to type 'number'.${ESC}[0m`,
  "",
].join("\n");

describe("countDiagnostics — every checker's real output shape", () => {
  test("vue-tsc / golar / verter-tsc: tsc plain `file(line,col): error TSxxxx`", () => {
    assert.equal(countDiagnostics(VUE_TSC, ""), 2, "vue-tsc (CRLF)");
    assert.equal(countDiagnostics(GOLAR, ""), 2, "golar, past its config preamble");
    assert.equal(countDiagnostics(VERTER_STDOUT, VERTER_STDERR), 2, "verter-tsc, absolute paths");
  });

  test("vize: `error:LINE:COL [TSxxxx]`, coloured, with no (line,col) anywhere", () => {
    assert.equal(countDiagnostics(VIZE, ""), 2);
  });

  test("REGRESSION: the previous counter scored that exact vize output 0", () => {
    // The shipped pattern, verbatim. It is the reason vize censused 0
    // diagnostics on a corpus where it had just reported 40 real TS2322s —
    // which reads identically to "this tool silently stopped analysing".
    const previous = (text) => (text.match(/^.*\(\d+,\d+\):\s*(error|warning)/gim) ?? []).length;

    assert.equal(previous(VIZE), 0, "documents the bug being fixed");
    assert.equal(countDiagnostics(VIZE, ""), 2, "and that it is fixed");
  });

  test("tsc pretty (`file:line:col - error`): counted, code frames are not", () => {
    // The tsc family switches to this layout on colour, not on a flag the
    // harness controls, and the old pattern scored the whole run 0.
    assert.equal(countDiagnostics(TSC_PRETTY, ""), 2);
  });

  test("a diagnostic spanning multiple lines counts ONCE, in either dialect", () => {
    assert.equal(countDiagnostics(TSC_MULTILINE, ""), 1, "tsc indents its continuation lines");
    assert.equal(countDiagnostics(VIZE_MULTILINE, ""), 1, "vize does not indent its continuation lines");
  });

  test("ANSI colour never changes the count", () => {
    const strip = (s) => s.replace(/\u001B\[[0-9;]*m/g, "");

    assert.equal(countDiagnostics(VIZE, ""), countDiagnostics(strip(VIZE), ""));
    assert.equal(countDiagnostics(TSC_PRETTY, ""), countDiagnostics(strip(TSC_PRETTY), ""));
  });

  test("an OSC-8 hyperlinked filename still counts exactly once", () => {
    const link = `${ESC}]8;;file:///d:/work/Comp.vue${ESC}\\Comp.vue${ESC}]8;;${ESC}\\`;
    assert.equal(countDiagnostics(`${link}(3,7): error TS2322: nope.`, ""), 1);
  });

  test("summary lines, progress chatter and prose are NOT diagnostics", () => {
    const noise = [
      "Using config from ./golar.config.ts...",
      "verter-tsc: checking 20 .vue file(s)...",
      "Found 0 errors.",
      "Found 40 error(s) in 20 file(s).",
      "  40 error(s)",
      "\u2717 Type checked 22 files in 160.17ms (collect: 9.64ms, gen: 5.32ms, corsa: 124.22ms)",
      "Building Corsa virtual project for 22 files under D:\\work\\n20...",
      "Running Corsa diagnostics for 22 files...",
      "  The types of 'nested.deeper.deepest' are incompatible between these types.",
      "    Type 'string' is not assignable to type 'number'.",
      '3 const a0: number = "not-a-number"',
      "See docs/handling-errors.md for the error taxonomy.",
      "Timings are medians of 5 warmed runs (3,5): errors are not expected here.",
      "",
    ].join("\n");

    assert.equal(countDiagnostics(noise, ""), 0);
  });

  test("empty output is 0, not NaN", () => {
    assert.equal(countDiagnostics(), 0);
    assert.equal(countDiagnostics("", ""), 0);
    assert.equal(countDiagnostics("\n\n\n", "\n"), 0);
  });

  test("stdout and stderr are both censused, and neither is double-counted", () => {
    assert.equal(countDiagnostics(VUE_TSC, VUE_TSC), 4);
    assert.equal(countDiagnostics("", VUE_TSC), 2, "a tool that reports on stderr still counts");
  });
});

// ---------------------------------------------------------------------------
// Plant dependency resolution
// ---------------------------------------------------------------------------

const REPO_VUE = join(repoRoot, "node_modules", "vue");

/** Resolve the plant's `vue` the way TypeScript would, via compilerOptions.paths. */
function vueViaTsconfigPaths(dir) {
  const tsconfig = JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8"));
  const entry = tsconfig.compilerOptions?.paths?.vue?.[0];
  return entry ? resolve(dir, entry) : null;
}

describe("prepareTypecheckPlant — `vue` resolves wherever --work points", () => {
  /** A work root that is NOT under the repo (os.tmpdir is often another volume). */
  let outsideRoot;
  let outsidePlant;
  /** The control: a work root inside the repo, which always worked. */
  let insideRoot;
  let insidePlant;

  before(() => {
    outsideRoot = mkdtempSync(join(tmpdir(), "vb-plant-outside-"));
    outsidePlant = prepareTypecheckPlant(outsideRoot);
    insideRoot = makeTempDir("plant-inside-");
    insidePlant = prepareTypecheckPlant(insideRoot);
  });

  after(() => {
    outsidePlant?.cleanup();
    insidePlant?.cleanup();
    removeDir(insideRoot);
    rmSync(outsideRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  });

  const projectsOf = (plant) => [
    plant.scriptDir,
    plant.templateDir,
    plant.templatePropDir,
    plant.templateEventDir,
  ];

  test("the plant root really is outside the repo (otherwise this suite proves nothing)", () => {
    assert.ok(
      !resolve(outsidePlant.root).toLowerCase().startsWith(resolve(repoRoot).toLowerCase()),
      `${outsidePlant.root} must not be under ${repoRoot}`,
    );
  });

  test("every plant project pins compilerOptions.paths.vue at the repo's vue", () => {
    // Without this, `vue` does not resolve, strictTemplates checks nothing, and
    // both template plants go undetected — which the gate reports as the
    // confidently wrong "does not typecheck templates".
    for (const plant of [outsidePlant, insidePlant]) {
      for (const dir of projectsOf(plant)) {
        const resolved = vueViaTsconfigPaths(dir);
        assert.ok(resolved, `${basename(dir)}/tsconfig.json has no compilerOptions.paths.vue`);
        assert.ok(existsSync(join(resolved, "package.json")), `paths.vue does not resolve: ${resolved}`);
        assert.equal(resolved, REPO_VUE, `${basename(dir)} points at the wrong vue`);
      }
    }
  });

  test("the plant ROOT carries the node_modules link, never a plant project", () => {
    // Both Node and TypeScript walk up, so the projects still find it — while
    // directory-walking checkers (`vize check .`) enumerating inputs under the
    // project dir cannot wander into the whole dependency store.
    for (const plant of [outsidePlant, insidePlant]) {
      if (!plant.linkedNodeModules) continue;
      assert.ok(existsSync(join(plant.root, "node_modules")), "the root link is missing");
      for (const dir of projectsOf(plant)) {
        assert.ok(
          !existsSync(join(dir, "node_modules")),
          `${basename(dir)} must not hold its own node_modules`,
        );
      }
    }
  });

  test("Node resolves `vue` from an OUTSIDE plant project by ordinary walk-up", (t) => {
    if (!outsidePlant.linkedNodeModules) {
      return t.skip("node_modules could not be linked on this host; paths.vue is the fallback");
    }
    const require = createRequire(join(outsidePlant.templatePropDir, "noop.js"));
    assert.equal(
      realpathSync(require.resolve("vue/package.json")),
      realpathSync(join(REPO_VUE, "package.json")),
    );
  });

  test("an OUTSIDE plant is scaffolded exactly like an INSIDE one", () => {
    for (const dir of projectsOf(outsidePlant)) {
      for (const file of ["Bad.vue", "tsconfig.json", "env.d.ts", "package.json", "golar.config.ts"]) {
        assert.ok(existsSync(join(dir, file)), `${basename(dir)}/${file} missing`);
      }
      const tsconfig = JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8"));
      assert.equal(tsconfig.vueCompilerOptions?.strictTemplates, true, `${basename(dir)} lost strictTemplates`);
    }
  });

  test("cleanup unlinks the node_modules link and NEVER deletes through it", () => {
    // The whole reason a junction is safe here. If rmSync recursed through it,
    // cleaning up a plant would wipe the repo's dependency tree.
    const before = readdirSync(join(repoRoot, "node_modules")).length;
    assert.ok(before > 0, "the repo has no node_modules to protect");

    const scratchRoot = mkdtempSync(join(tmpdir(), "vb-plant-cleanup-"));
    try {
      const plant = prepareTypecheckPlant(scratchRoot);
      const link = join(plant.root, "node_modules");
      if (plant.linkedNodeModules) assert.ok(existsSync(link));

      plant.cleanup();

      assert.ok(!existsSync(plant.root), "cleanup must remove the plant");
      assert.ok(existsSync(join(REPO_VUE, "package.json")), "the repo's vue must survive cleanup");
      assert.equal(
        readdirSync(join(repoRoot, "node_modules")).length,
        before,
        "cleanup deleted through the link into the repo's node_modules",
      );
    } finally {
      rmSync(scratchRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    }
  });
});
