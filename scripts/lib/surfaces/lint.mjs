import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { createRequire } from "node:module";
import { collectVueFiles, prepareLintDir, totalBytes } from "../fixtures.mjs";
import { measureVariants, resolveBin, runCommand, timedAsync, timedSync } from "../timing.mjs";
import { applyFileCoverageGate, countCoveredFiles, plantForCoverage } from "../work-gate.mjs";
import { runEslintWorkers } from "../lint-eslint-workers.mjs";
import { lintCliCommand } from "../lint-row-specs.mjs";
import { applyLintValidityGates, runLintValidityChildren } from "../lint-validity-gates.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const cpuCount = os.cpus().length;

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

function isWinShell(bin) {
  return process.platform === "win32" && bin.endsWith(".cmd");
}

/**
 * Lint surface: eslint-plugin-vue vs Vize lint (1T + default threads).
 * Verter: native lint API if present; otherwise skipped.
 */
export async function runLintSurface(fixtureDir, options) {
  // See compile.mjs: `options.files` carries a caller-supplied (possibly nested)
  // corpus, which is how the real-world orchestrator feeds cloned projects in.
  const files = options.files ?? collectVueFiles(fixtureDir, options.fileLimit);
  const bytes = totalBytes(fixtureDir, files);

  // Lint against an isolated copy holding exactly the measured subset.
  //
  // Previously eslint received an explicit .vue list while `vize lint .` walked
  // the whole fixture directory — so with --lint-file-limit set they silently
  // linted different corpora. Copying the subset makes the file set identical
  // no matter how each tool discovers its inputs.
  const lintDir = prepareLintDir(fixtureDir, files, options.workRoot, `n${files.length}`);
  const filePaths = files.map((f) => join(lintDir, f));

  const variants = [];
  let eslintPath = null;
  try {
    eslintPath = require.resolve("eslint", { paths: [rootDir] });
  } catch {
    eslintPath = null;
  }
  const eslintBin = tryResolveBin("eslint");

  if (eslintPath) {
    const { ESLint } = await import("eslint");
    variants.push({
      id: "eslint-plugin-vue-1t",
      label: "eslint-plugin-vue (1T)",
      package: "eslint-plugin-vue",
      threading: "1t",
      invocation: "in-process",
      notes: "ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles",
      measure: () =>
        timedAsync(async () => {
          const eslint = new ESLint({
            overrideConfigFile: join(lintDir, "eslint.config.mjs"),
            cwd: lintDir,
          });
          await eslint.lintFiles(filePaths);
        }),
    });
    variants.push({
      id: "eslint-plugin-vue-workers",
      label: `eslint-plugin-vue (${Math.min(cpuCount, files.length)} workers)`,
      package: "eslint-plugin-vue",
      threading: "workers",
      invocation: "in-process",
      notes: "ESLint worker_threads fan-out (one ESLint instance per worker)",
      measure: () => timedAsync(() => runEslintWorkers(lintDir, files, eslintPath)),
    });
  } else {
    variants.push({
      id: "eslint-plugin-vue",
      label: "eslint-plugin-vue",
      package: "eslint-plugin-vue",
      notes: "eslint not installed",
      skip: true,
    });
  }

  // ESLint also runs as a CLI so the CLI table has a non-native reference point.
  // It is the only tool here with both a library and a binary entry point, so it
  // is the bridge between the two comparison classes.
  if (eslintBin) {
    variants.push({
      id: "eslint-plugin-vue-cli",
      label: "eslint-plugin-vue (CLI)",
      package: "eslint-plugin-vue",
      threading: "1t",
      invocation: "cli",
      notes:
        "eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs",
      measure: () => {
        const command = lintCliCommand("eslint-plugin-vue-cli");
        const { ms } = runCommand(eslintBin, command.args, {
          cwd: lintDir,
          allowNonZeroExit: true,
          env: command.env,
          shell: isWinShell(eslintBin),
        });
        return ms;
      },
    });
  }

  const vize = tryResolveBin("vize");
  if (vize) {
    variants.push({
      id: "vize-lint-1t",
      label: "Vize lint (1T)",
      package: "vize",
      threading: "1t",
      invocation: "cli",
      notes: "vize lint . with RAYON_NUM_THREADS=1; diagnostics are not suppressed",
      measure: () => {
        const command = lintCliCommand("vize-lint-1t");
        const { ms } = runCommand(vize, command.args, {
          cwd: lintDir,
          allowNonZeroExit: true,
          env: command.env,
          shell: process.platform === "win32" && vize.endsWith(".cmd"),
        });
        return ms;
      },
    });
    variants.push({
      id: "vize-lint-max",
      label: "Vize lint (default threads)",
      package: "vize",
      threading: "default",
      invocation: "cli",
      notes: "vize lint . using default Rayon pool; diagnostics are not suppressed",
      measure: () => {
        const command = lintCliCommand("vize-lint-max");
        const { ms } = runCommand(vize, command.args, {
          cwd: lintDir,
          allowNonZeroExit: true,
          env: command.env,
          shell: process.platform === "win32" && vize.endsWith(".cmd"),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "vize-lint",
      label: "Vize lint",
      package: "vize",
      notes: "vize binary not found",
      skip: true,
    });
  }

  // Biome. Split 1T/max exactly like Vize: Biome parallelises with Rayon and
  // honours RAYON_NUM_THREADS (measured ~4.3x spread over 1000 SFCs), so a
  // single row would fold thread count into the linter comparison.
  const biome = tryResolveBin("biome");
  if (biome) {
    variants.push({
      id: "biome-lint-1t",
      label: "Biome lint (1T)",
      package: "@biomejs/biome",
      threading: "1t",
      invocation: "cli",
      notes: "biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules",
      measure: () => {
        const command = lintCliCommand("biome-lint-1t");
        const { ms } = runCommand(biome, command.args, {
          cwd: lintDir,
          allowNonZeroExit: true,
          env: command.env,
          shell: isWinShell(biome),
        });
        return ms;
      },
    });
    variants.push({
      id: "biome-lint-max",
      label: "Biome lint (default threads)",
      package: "@biomejs/biome",
      threading: "default",
      invocation: "cli",
      notes: "biome lint . using its undocumented default pool size · script block only",
      measure: () => {
        const command = lintCliCommand("biome-lint-max");
        const { ms } = runCommand(biome, command.args, {
          cwd: lintDir,
          allowNonZeroExit: true,
          env: command.env,
          shell: isWinShell(biome),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "biome-lint",
      label: "Biome lint",
      package: "@biomejs/biome",
      notes: "biome binary not found",
      skip: true,
    });
  }

  // Oxlint. Split 1T/max like Vize and Biome — it exposes an explicit
  // `--threads` flag (measured ~1.8x spread over 1000 SFCs), so thread count is
  // a row property here rather than something folded into the linter gap.
  const oxlint = tryResolveBin("oxlint");
  if (oxlint) {
    variants.push({
      id: "oxlint-1t",
      label: "Oxlint (1T)",
      package: "oxlint",
      threading: "1t",
      invocation: "cli",
      notes:
        "oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules",
      measure: () => {
        const command = lintCliCommand("oxlint-1t");
        const { ms } = runCommand(oxlint, command.args, {
          cwd: lintDir,
          allowNonZeroExit: true,
          env: command.env,
          shell: isWinShell(oxlint),
        });
        return ms;
      },
    });
    variants.push({
      id: "oxlint-max",
      label: "Oxlint (default threads)",
      package: "oxlint",
      threading: "default",
      invocation: "cli",
      notes: "oxlint . on its default thread pool, vue plugin enabled · script block only",
      measure: () => {
        const command = lintCliCommand("oxlint-max");
        const { ms } = runCommand(oxlint, command.args, {
          cwd: lintDir,
          allowNonZeroExit: true,
          env: command.env,
          shell: isWinShell(oxlint),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "oxlint",
      label: "Oxlint",
      package: "oxlint",
      notes: "oxlint binary not found",
      skip: true,
    });
  }

  // Verter: try native host lint if available
  let verterNative = null;
  try {
    verterNative = require(require.resolve("@verter/native", { paths: [rootDir] }));
  } catch {
    verterNative = null;
  }

  if (verterNative?.VerterHost) {
    const { VerterHost } = verterNative;
    const sources = files.map((f) => ({
      path: join(lintDir, f).replace(/\\/g, "/"),
      source: require("node:fs").readFileSync(join(lintDir, f), "utf8"),
    }));
    variants.push({
      id: "verter-lint-host",
      label: "Verter host lint",
      package: "@verter/native",
      threading: "host",
      invocation: "in-process",
      notes: "VerterHost.upsert + lint(canonicalId) for each file (if API available)",
      measure: () =>
        timedSync(() => {
          const host = new VerterHost({ devMode: false });
          for (const f of sources) {
            if (typeof host.upsert === "function") {
              host.upsert({
                inputId: f.path,
                canonicalId: f.path,
                source: f.source,
                fileKind: "vue",
              });
            }
            if (typeof host.lint === "function") {
              host.lint(f.path);
            } else {
              throw new Error("VerterHost.lint not available");
            }
          }
        }),
    });
  } else {
    variants.push({
      id: "verter-lint",
      label: "Verter lint",
      package: "@verter/native",
      notes: "No VerterHost lint path loaded",
      skip: true,
    });
  }

  const inProcessIds = new Set([
    "eslint-plugin-vue-1t",
    "eslint-plugin-vue-workers",
    "verter-lint-host",
  ]);
  const cliIds = new Set([
    "eslint-plugin-vue-cli",
    "vize-lint-1t",
    "vize-lint-max",
    "biome-lint-1t",
    "biome-lint-max",
    "oxlint-1t",
    "oxlint-max",
  ]);
  for (const variant of variants) {
    if (inProcessIds.has(variant.id)) {
      variant.comparisonClass = "lint-in-process-api";
      variant.comparisonClassLabel = "Vue SFC lint — in-process APIs";
      variant.baseline = variant.id === "eslint-plugin-vue-1t";
      variant.baselineLabel = "eslint-plugin-vue in-process reference";
    } else if (cliIds.has(variant.id)) {
      variant.comparisonClass = "lint-cli";
      variant.comparisonClassLabel = "Vue SFC lint — fresh CLI process";
      variant.baseline = variant.id === "eslint-plugin-vue-cli";
      variant.baselineLabel = "eslint-plugin-vue CLI reference";
    }
  }

  const results = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });

  // Everything below is validation and deliberately follows every timing.
  // File-coverage census, untimed, one pass per directory-WALK tool: a plant
  // dir where every corpus file carries a guaranteed-reportable issue, each
  // tool run once with its timed invocation (enumeration-only flag changes
  // below, disclosed), and coverage counted as the distinct corpus files the
  // tool names. Explicit-list rows (the eslint API rows, VerterHost) are
  // handed exactly the corpus by construction and are annotated as such
  // instead of probed. Walk tools were probed live before this existed:
  // eslint and oxlint name all 50/50 nested files; vize covers the corpus plus
  // eslint.config.mjs; biome checks the corpus plus the three config files —
  // extras are disclosed, skipped corpus files unrank.
  const coverage = new Map();
  {
    const { readFileSync, writeFileSync } = require("node:fs");
    const coverageDir = prepareLintDir(
      fixtureDir,
      files,
      options.workRoot,
      `n${files.length}-coverage`,
    );
    for (const f of files) {
      const p = join(coverageDir, f);
      writeFileSync(p, plantForCoverage(readFileSync(p, "utf8")));
    }
    const walkCensus = (ids, bin, args, { env = {} } = {}) => {
      if (!bin) return;
      try {
        const r = runCommand(bin, args, {
          cwd: coverageDir,
          allowNonZeroExit: true,
          shell: isWinShell(bin),
          env,
        });
        const { covered } = countCoveredFiles(`${r.stdout ?? ""}\n${r.stderr ?? ""}`, files, {
          absPrefix: coverageDir,
        });
        for (const id of ids) coverage.set(id, { covered, corpus: files.length });
      } catch (error) {
        for (const id of ids)
          coverage.set(id, {
            covered: null,
            corpus: files.length,
            error: String(error?.message ?? error),
          });
      }
    };
    // eslint CLI: the JSON reporter prints every linted file (absolute paths),
    // problems or none — presence in the report IS coverage.
    walkCensus(["eslint-plugin-vue-cli"], eslintBin, [".", "--format", "json"]);
    // Vize's exact timed command emits attributable diagnostics; only the
    // thread environment differs between these two census passes.
    walkCensus(["vize-lint-1t"], vize, lintCliCommand("vize-lint-1t").args, {
      env: lintCliCommand("vize-lint-1t").env,
    });
    walkCensus(["vize-lint-max"], vize, lintCliCommand("vize-lint-max").args);
    // biome: the default reporter caps diagnostics well below corpus size;
    // lifted for the census ONLY.
    walkCensus(["biome-lint-1t"], biome, ["lint", ".", "--max-diagnostics=none"], {
      env: lintCliCommand("biome-lint-1t").env,
    });
    walkCensus(["biome-lint-max"], biome, ["lint", ".", "--max-diagnostics=none"]);
    walkCensus(["oxlint-1t"], oxlint, lintCliCommand("oxlint-1t").args);
    walkCensus(["oxlint-max"], oxlint, lintCliCommand("oxlint-max").args);
    for (const id of ["eslint-plugin-vue-1t", "eslint-plugin-vue-workers", "verter-lint-host"]) {
      coverage.set(id, { covered: files.length, corpus: files.length, byConstruction: true });
    }
  }

  applyFileCoverageGate(results, coverage, { verb: "named", what: "planted corpus files" });
  const lintSemantics = runLintValidityChildren({
    configRoot: lintDir,
    entrypoints: results.filter((row) => row.status !== "skipped").map((row) => row.id),
  });
  applyLintValidityGates(results, lintSemantics);

  // Fix label typo if any
  for (const r of results) {
    if (r.label === "Vory lint (1T)") r.label = "Vize lint (1T)";
  }

  return {
    id: "lint",
    label: "Lint",
    files: files.length,
    bytes,
    methodology: [
      "Every tool lints an identical isolated copy of the corpus (work/lint/…). That tools see the SAME FILES is enforced, not assumed: an untimed post-timing FILE-COVERAGE census plants a guaranteed-reportable issue in every corpus file and runs each directory-walk tool once — a ranked tool that fails to name every corpus file is measured but UNRANKED. Explicit-list invocations (the eslint API rows, VerterHost) are handed exactly the corpus by construction and say so. Census-only reporter changes (eslint JSON, biome unlimited diagnostics) alter what is printed, never what is linted; Vize and Oxlint use their exact timed commands and thread settings. A walk tool that also lints a config file beside the corpus is disclosed, not gated.",
      "Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxlint; oxfmt 0.63+ on the format surface) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in and walk zero files. A real project root has the boundary; the marker changes no tool's invocation.",
      "In-process APIs and fresh CLI processes are separate comparison tables because a CLI pays process startup and config loading on every run while an in-process API amortises them. eslint-plugin-vue runs in both modes and is the explicit reference denominator in each table.",
      "Ranking is split into explicit in-process-API and fresh-CLI comparison classes. eslint-plugin-vue is the declared denominator in both; ratios never compare Verter's in-process host with native CLI startup or let the fastest candidate redefine the reference.",
      "No single invocation mode covers every tool — vize lint is CLI-only, VerterHost.lint is in-process-only — which is why the mode is on the row instead of one mode being dropped.",
      "eslint-plugin-vue uses flat recommended config generated with fixtures.",
      "Vize, Biome and Oxlint each get separate 1T and default-thread rows — a thread-count gap is not a linter gap. The benchmark does not rename an undocumented default pool size as 'all cores'.",
      `VUE TEMPLATE-LINT SEMANTIC GATE (untimed, post-timing): suite ${lintSemantics.suiteVersion} runs ${lintSemantics.plantCount} dirty/clean differential plants through every exact row separately, including main-thread/worker/CLI ESLint, thread-limited/default native CLIs, and fresh VerterHost. A pass must name the planted file, overlap its line, identify the rule or narrow concept, and disappear for the clean twin. Exit status or an unrelated diagnostic never passes. Every result and suite hash is retained in validation.lintSemantics; FAIL/UNKNOWN is measured but UNRANKED.`,
      "Oxlint runs with its vue plugin ON (.oxlintrc.json travels with the corpus and with the gate plant). The exact pinned row still misses every mandatory Vue template diagnostic plant, so it remains contextual/unranked; no hard-coded rule-count claim is carried across package upgrades.",
      "Oxlint ships no standalone executable — it is a NAPI addon loaded into a Node process — so its per-run startup is Node's, while vize and biome launch a native binary. All three pay startup every run; it is not the same constant.",
      "Biome's script-only view also produces false positives on this corpus: variables declared in <script setup> and used only in <template> are reported as unused. Oxlint avoids that by disabling no-unused-vars for .vue entirely — it reports neither the false positive nor a genuinely unused declaration. Neither tool's diagnostics are comparable to the Vue-aware linters'.",
      "Allow non-zero exit (style diagnostics do not abort timing).",
      "Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.",
      "Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.",
    ],
    variants: results,
    validation: { lintSemantics },
  };
}
