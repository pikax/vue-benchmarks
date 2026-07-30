import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import os from "node:os";
import { createRequire } from "node:module";
import { collectVueFiles, prepareLintDir, totalBytes } from "../fixtures.mjs";
import { measureVariants, resolveBin, runCommand, timedAsync, timedSync } from "../timing.mjs";
import {
  applyWorkGate,
  cliReportsPlantedIssue,
  eslintReportsPlant,
  prepareLintPlant,
} from "../work-gate.mjs";

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

async function runEslintWorkers(cwd, files, eslintPath) {
  const workerCount = Math.min(cpuCount, files.length);
  const chunkSize = Math.ceil(files.length / workerCount);
  const configFile = join(cwd, "eslint.config.mjs");
  const workerCode = `
    const { parentPort, workerData } = require("worker_threads");
    const { ESLint } = require(workerData.eslintPath);
    (async () => {
      const eslint = new ESLint({
        overrideConfigFile: workerData.configFile,
        cwd: workerData.cwd,
      });
      await eslint.lintFiles(workerData.files);
      parentPort.postMessage("done");
    })().catch((error) => {
      parentPort.postMessage({ error: error && error.stack ? error.stack : String(error) });
    });
  `;

  const workers = [];
  for (let i = 0; i < workerCount; i++) {
    const chunk = files
      .slice(i * chunkSize, Math.min((i + 1) * chunkSize, files.length))
      .map((f) => join(cwd, f));
    if (chunk.length === 0) continue;
    const worker = new Worker(workerCode, {
      eval: true,
      workerData: {
        cwd,
        configFile,
        files: chunk,
        eslintPath,
      },
    });
    workers.push(
      new Promise((resolve, reject) => {
        worker.on("message", (msg) => {
          if (msg && msg.error) reject(new Error(msg.error));
          else resolve(msg);
        });
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) reject(new Error(`eslint worker exit ${code}`));
        });
      }),
    );
  }
  await Promise.all(workers);
}

/**
 * Lint surface: eslint-plugin-vue vs Vize lint (1T + max threads).
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
      notes: "eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs",
      measure: () => {
        const { ms } = runCommand(eslintBin, ["."], {
          cwd: lintDir,
          allowNonZeroExit: true,
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
      notes: "vize lint . with RAYON_NUM_THREADS=1",
      measure: () => {
        const { ms } = runCommand(vize, ["lint", ".", "--quiet"], {
          cwd: lintDir,
          allowNonZeroExit: true,
          env: { RAYON_NUM_THREADS: "1" },
          shell: process.platform === "win32" && vize.endsWith(".cmd"),
        });
        return ms;
      },
    });
    variants.push({
      id: "vize-lint-max",
      label: "Vize lint (max threads)",
      package: "vize",
      threading: "max",
      invocation: "cli",
      notes: "vize lint . using default Rayon pool (all cores)",
      measure: () => {
        const { ms } = runCommand(vize, ["lint", ".", "--quiet"], {
          cwd: lintDir,
          allowNonZeroExit: true,
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
        const { ms } = runCommand(biome, ["lint", "."], {
          cwd: lintDir,
          allowNonZeroExit: true,
          env: { RAYON_NUM_THREADS: "1" },
          shell: isWinShell(biome),
        });
        return ms;
      },
    });
    variants.push({
      id: "biome-lint-max",
      label: "Biome lint (max threads)",
      package: "@biomejs/biome",
      threading: "max",
      invocation: "cli",
      notes: "biome lint . using the default Rayon pool (all cores) · script block only",
      measure: () => {
        const { ms } = runCommand(biome, ["lint", "."], {
          cwd: lintDir,
          allowNonZeroExit: true,
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
        const { ms } = runCommand(oxlint, [".", "--threads=1"], {
          cwd: lintDir,
          allowNonZeroExit: true,
          shell: isWinShell(oxlint),
        });
        return ms;
      },
    });
    variants.push({
      id: "oxlint-max",
      label: "Oxlint (max threads)",
      package: "oxlint",
      threading: "max",
      invocation: "cli",
      notes:
        "oxlint . on the default thread pool (all cores), vue plugin enabled · script block only",
      measure: () => {
        const { ms } = runCommand(oxlint, ["."], {
          cwd: lintDir,
          allowNonZeroExit: true,
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

  // Work gate: tools must flag planted v-html (or equivalent) or are unranked.
  const plant = prepareLintPlant(options.workRoot ?? join(rootDir, "work"));
  try {
    const eslintOk = eslintPath ? await eslintReportsPlant(plant, eslintPath) : false;
    applyWorkGate(variants, (v) => {
      if (
        v.id === "eslint-plugin-vue-1t" ||
        v.id === "eslint-plugin-vue-workers" ||
        v.id === "eslint-plugin-vue-cli"
      ) {
        return eslintOk;
      }
      if (v.id === "vize-lint-1t" || v.id === "vize-lint-max") {
        if (!vize) return false;
        return cliReportsPlantedIssue({
          bin: vize,
          args: ["lint", "Dirty.vue"],
          cwd: plant.dir,
          shell: isWinShell(vize),
          expectErrors: true,
        });
      }
      if (v.id === "biome-lint-1t" || v.id === "biome-lint-max") {
        if (!biome) return false;
        return cliReportsPlantedIssue({
          bin: biome,
          args: ["lint", "Dirty.vue"],
          cwd: plant.dir,
          shell: isWinShell(biome),
          expectErrors: true,
        });
      }
      if (v.id === "oxlint-1t" || v.id === "oxlint-max") {
        if (!oxlint) return false;
        return cliReportsPlantedIssue({
          bin: oxlint,
          args: ["Dirty.vue"],
          cwd: plant.dir,
          shell: isWinShell(oxlint),
          expectErrors: true,
        });
      }
      if (v.id === "verter-lint-host" && verterNative?.VerterHost) {
        try {
          const host = new verterNative.VerterHost({ devMode: false });
          const path = plant.dirtyFile.replace(/\\/g, "/");
          const source = require("node:fs").readFileSync(plant.dirtyFile, "utf8");
          if (typeof host.upsert === "function") {
            host.upsert({
              inputId: path,
              canonicalId: path,
              source,
              fileKind: "vue",
            });
          }
          if (typeof host.lint !== "function") return false;
          const diags = host.lint(path);
          const n = Array.isArray(diags)
            ? diags.length
            : (diags?.diagnostics?.length ?? diags?.length ?? 0);
          return n > 0;
        } catch {
          return false;
        }
      }
      return true;
    });
  } finally {
    plant.cleanup();
  }

  const results = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });

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
      "Every tool lints an identical isolated copy of the corpus (work/lint/…), so tools that take an explicit file list and tools that walk a directory see exactly the same files.",
      "In-process and CLI rows share the table; the row label says which mode ran. A CLI pays process startup on every run (~85ms measured for a native CLI); an in-process API pays it once — read same-mode rows against each other. eslint runs in BOTH modes and is the reference point between them.",
      "No single invocation mode covers every tool — vize lint is CLI-only, VerterHost.lint is in-process-only — which is why the mode is on the row instead of one mode being dropped.",
      "eslint-plugin-vue uses flat recommended config generated with fixtures.",
      "Vize, Biome and Oxlint each get separate 1T and max-threads rows — a thread-count gap is not a linter gap.",
      "Planted-bug work gate: each tool must report vue/no-v-html (or equivalent) or is unranked. Biome and Oxlint both fail it — each lints the <script> block only and has no template rules, so nothing in <template> is examined.",
      "Oxlint runs with its vue plugin ON (.oxlintrc.json travels with the corpus and with the gate plant): 31 extra rules over its stock 111, all of them <script> rules for SFC option/macro shape. Template syntax is still never parsed, which is why the plant is missed with the plugin's full rule set active.",
      "Oxlint ships no standalone executable — it is a NAPI addon loaded into a Node process — so its per-run startup is Node's, while vize and biome launch a native binary. All three pay startup every run; it is not the same constant.",
      "Biome's script-only view also produces false positives on this corpus: variables declared in <script setup> and used only in <template> are reported as unused. Oxlint avoids that by disabling no-unused-vars for .vue entirely — it reports neither the false positive nor a genuinely unused declaration. Neither tool's diagnostics are comparable to the Vue-aware linters'.",
      "Allow non-zero exit (style diagnostics do not abort timing).",
      "Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.",
      "Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.",
    ],
    variants: results,
  };
}
