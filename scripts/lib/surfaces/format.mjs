import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { collectVueFiles, prepareFormatCopy, totalBytes } from "../fixtures.mjs";
import { measureVariants, resolveBin, runCommand } from "../timing.mjs";
import { applyFileCoverageGate, dirtyForCoverage } from "../work-gate.mjs";
import { formatConfigFiles, formatRowCommand } from "../format-row-specs.mjs";
import { applyFormatValidityGates, runFormatValidityChildren } from "../format-validity-gates.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

/**
 * Format surface.
 * Destructive tools always receive a fresh copy of the corpus per invocation.
 * Prefer --check/--write consistently; we use write on a throwaway copy so tools
 * do equivalent full-format work (not early-exit check optimizations only).
 */
export async function runFormatSurface(fixtureDir, options) {
  // See compile.mjs: `options.files` carries a caller-supplied (possibly nested)
  // corpus, which is how the real-world orchestrator feeds cloned projects in.
  const files = options.files ?? collectVueFiles(fixtureDir, options.fileLimit);
  const bytes = totalBytes(fixtureDir, files);
  const workRoot = options.workRoot;

  const prettier = tryResolveBin("prettier");
  const oxfmt = tryResolveBin("oxfmt");
  const vize = tryResolveBin("vize");
  const biome = tryResolveBin("biome");

  let invocation = 0;
  const nextCopy = (label) => {
    const cwd = prepareFormatCopy(fixtureDir, files, workRoot, label, ++invocation);
    // Never overwrite a generated fixture or a checked-out real-world project.
    // The benchmark's parity configs belong only to the disposable work copy.
    for (const [name, content] of Object.entries(formatConfigFiles())) {
      writeFileSync(join(cwd, name), content);
    }
    return cwd;
  };

  const variants = [];

  if (prettier) {
    variants.push({
      id: "prettier",
      label: "Prettier",
      package: "prettier",
      threading: "1t",
      invocation: "cli",
      notes: "prettier --write **/*.vue (fresh copy each run) · single-threaded by design",
      measure: () => {
        const cwd = nextCopy("prettier");
        // RECURSIVE glob. `*.vue` matched nothing on nested real-world corpora,
        // so Prettier's ~80 ms "win" on every project was CLI boot + "no files
        // matched" with the non-zero exit swallowed below — ranked 1.00x for
        // doing zero work (2026-07-30 audit, finding 1). The format work gate
        // now plants its probe in a NESTED directory so a non-recursive
        // invocation of any tool fails the gate instead of topping the table.
        const { args } = formatRowCommand("prettier");
        const { ms } = runCommand(prettier, args, {
          cwd,
          // Consistent with the other formatters: a non-zero exit from a
          // style diagnostic must not fail one tool while the others are
          // allowed to exit non-zero freely.
          allowNonZeroExit: true,
          shell: process.platform === "win32" && prettier.endsWith(".cmd"),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "prettier",
      label: "Prettier",
      package: "prettier",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (oxfmt) {
    variants.push({
      id: "oxfmt",
      label: "Oxfmt",
      package: "oxfmt",
      threading: "max",
      invocation: "cli",
      notes:
        "oxfmt --write (fresh copy each run) · pinned 0.64.0 routes a full .vue file through its bundled Prettier formatFile callback in worker threads; the native binding orchestrates the call, but Vue parsing/printing is the bundled Prettier path. Re-audit this package path after upgrades.",
      measure: () => {
        const cwd = nextCopy("oxfmt");
        // oxfmt accepts paths; try write mode flags used by oxfmt CLI
        const { args } = formatRowCommand("oxfmt");
        const { ms } = runCommand(oxfmt, args, {
          cwd,
          allowNonZeroExit: true,
          shell: process.platform === "win32" && oxfmt.endsWith(".cmd"),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "oxfmt",
      label: "Oxfmt",
      package: "oxfmt",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (vize) {
    variants.push({
      id: "vize-fmt",
      label: "Vize fmt",
      package: "vize",
      threading: "unknown",
      invocation: "cli",
      notes:
        "vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded",
      measure: () => {
        const cwd = nextCopy("vize-fmt");
        const { args } = formatRowCommand("vize-fmt");
        const { ms } = runCommand(vize, args, {
          cwd,
          allowNonZeroExit: true,
          shell: process.platform === "win32" && vize.endsWith(".cmd"),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "vize-fmt",
      label: "Vize fmt",
      package: "vize",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (biome) {
    variants.push({
      id: "biome-fmt",
      label: "Biome format",
      package: "@biomejs/biome",
      threading: "max",
      invocation: "cli",
      notes:
        "biome format --write . (fresh copy each run) · multi-threaded (Rayon; honours RAYON_NUM_THREADS) · exact pinned row currently rewrites none of the planted .vue corpus",
      measure: () => {
        const cwd = nextCopy("biome-fmt");
        const { args } = formatRowCommand("biome-fmt");
        const { ms } = runCommand(biome, args, {
          cwd,
          allowNonZeroExit: true,
          shell: process.platform === "win32" && biome.endsWith(".cmd"),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "biome-fmt",
      label: "Biome format",
      package: "@biomejs/biome",
      notes: "Binary not found",
      skip: true,
    });
  }

  for (const variant of variants) {
    variant.comparisonClass = "format-full-vue-sfc-cli";
    variant.comparisonClassLabel = "Full Vue SFC formatting — CLI";
    variant.baseline = variant.id === "prettier";
    variant.baselineLabel = "Prettier established Vue SFC reference";
  }

  // File-coverage census, untimed, one pass per tool with its EXACT timed
  // invocation: every corpus file is planted with a mess any formatter under
  // the shared configs must undo, and "files rewritten" is counted by byte
  // comparison — the same method for every tool, no per-tool output parsing.
  // Probed live (fixtures/50 in a nested layout): prettier, oxfmt and vize
  // rewrite 50/50; biome rewrites 0/50 ("Formatted 53 files … No fixes
  // applied") while also walking the two config files. Walk-invoked tools
  // touching a config file is disclosed, not gated — one or two extra tiny
  // files is noise; SKIPPING corpus files is the fault class that put a
  // zero-work row at 1.00x, and that is what the gate below catches.
  const coverage = new Map();
  const coverageCensus = (id, bin, args, { shell = false } = {}) => {
    try {
      const cwd = nextCopy(`coverage-${id}`);
      const planted = new Map();
      for (const f of files) {
        const p = join(cwd, f);
        const dirtied = dirtyForCoverage(readFileSync(p, "utf8"));
        writeFileSync(p, dirtied);
        planted.set(f, dirtied);
      }
      const cfgNames = [".prettierrc.json", "biome.json"];
      const cfgBefore = new Map(
        cfgNames.map((n) => [
          n,
          existsSync(join(cwd, n)) ? readFileSync(join(cwd, n), "utf8") : null,
        ]),
      );
      runCommand(bin, args, { cwd, allowNonZeroExit: true, shell });
      let covered = 0;
      for (const f of files) {
        if (readFileSync(join(cwd, f), "utf8") !== planted.get(f)) covered++;
      }
      const extras = cfgNames.filter(
        (n) => cfgBefore.get(n) !== null && readFileSync(join(cwd, n), "utf8") !== cfgBefore.get(n),
      );
      coverage.set(id, { covered, corpus: files.length, extras });
    } catch (error) {
      coverage.set(id, {
        covered: null,
        corpus: files.length,
        extras: [],
        error: String(error?.message ?? error),
      });
    }
  };
  const results = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });

  // Validation is deliberately post-timing. These extra process launches may
  // warm executable pages and the OS file cache, so they must never precede a
  // reported sample.
  if (prettier)
    coverageCensus("prettier", prettier, formatRowCommand("prettier").args, {
      shell: process.platform === "win32" && prettier.endsWith(".cmd"),
    });
  if (oxfmt)
    coverageCensus("oxfmt", oxfmt, formatRowCommand("oxfmt").args, {
      shell: process.platform === "win32" && oxfmt.endsWith(".cmd"),
    });
  if (vize)
    coverageCensus("vize-fmt", vize, formatRowCommand("vize-fmt").args, {
      shell: process.platform === "win32" && vize.endsWith(".cmd"),
    });
  if (biome)
    coverageCensus("biome-fmt", biome, formatRowCommand("biome-fmt").args, {
      shell: process.platform === "win32" && biome.endsWith(".cmd"),
    });

  applyFileCoverageGate(results, coverage, {
    verb: "rewrote",
    what: "planted corpus files",
  });
  const formatSemantics = runFormatValidityChildren({
    entrypoints: results.filter((row) => row.status !== "skipped").map((row) => row.id),
  });
  applyFormatValidityGates(results, formatSemantics);

  return {
    id: "format",
    label: "Format",
    files: files.length,
    bytes,
    methodology: [
      "Each invocation receives a fresh copy of the same Vue SFC corpus (formatters rewrite files).",
      "Prettier is the explicit established-reference denominator for the full-Vue-SFC CLI comparison class. A faster candidate never silently becomes the baseline.",
      ".prettierrc.json and biome.json are written only into disposable work copies; the input fixture or checked-out real-world project is never overwritten. Both configs set the same indent, width, quote, semicolon and trailing-comma choices.",
      "All four formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.",
      "Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.",
      "Oxfmt 0.64.0 is a hybrid native/JS package. Its shipped native binding delegates a full .vue file to the bundled JS formatFile callback, whose implementation calls bundled Prettier with parser=vue; worker orchestration remains oxfmt's. Its output is byte-identical to Prettier on the work-gate probe. This is pinned-version evidence and must be re-audited after an oxfmt upgrade rather than assumed forever.",
      "Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxfmt 0.63+) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in, see zero files, and get unranked for walking reasons rather than formatting ones. A real project root has the boundary; the marker changes no tool's invocation.",
      `FORMAT SEMANTIC GATE (untimed, post-timing): suite ${formatSemantics.suiteVersion} runs ${formatSemantics.plantCount} nested plants twice through each row's exact directory/glob command and shared configs. Every plant must remain parseable and idempotent; preserve SFC block attrs/custom blocks and template/script AST meaning; preserve scoped/module/v-bind/deep/slotted/global CSS constructs; and actually rewrite the messy template. Generated output is never compared between tools. Every outcome and the suite hash are retained in validation.formatSemantics.`,
      "FILE-COVERAGE GATE, untimed, per tool with its exact timed invocation: every corpus file is planted with a mess (trailing spaces, stacked blank lines) that any formatter under the shared configs must undo, and files rewritten are counted by byte comparison — the same method for every tool. A ranked tool that rewrites fewer than every corpus file is measured but UNRANKED: tools walking different file sets are not doing the same job, however similar the clock looks. A walk-invoked tool that also rewrites a config file is disclosed, not gated (one extra tiny file is noise; skipping corpus files is not).",
      "Prettier, Oxfmt, and Vize format the whole SFC. On the pinned Biome, `biome format --write .` reports .vue files as formatted but applies NO fixes to any block of them (probed: 0 of 50 planted files rewritten, 'No fixes applied') — its bracketed time is a walk-and-parse, which both gates say on the row. Rule/option parity is not guaranteed for any tool.",
      "Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.",
    ],
    variants: results,
    validation: { formatSemantics },
  };
}
