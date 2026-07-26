import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import os from "node:os";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { collectVueFiles, totalBytes } from "../fixtures.mjs";
import {
  measureVariantsAlternating,
  resolveBin,
  runCommand,
  timedAsync,
  timedSync,
} from "../timing.mjs";
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
  const files = collectVueFiles(fixtureDir, options.fileLimit);
  const bytes = totalBytes(fixtureDir, files);
  const filePaths = files.map((f) => join(fixtureDir, f));

  // Ensure eslint config exists (generator writes it; older fixtures may lack it)
  if (!existsSync(join(fixtureDir, "eslint.config.mjs"))) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(
      join(fixtureDir, "eslint.config.mjs"),
      `import pluginVue from "eslint-plugin-vue";
export default [
  ...pluginVue.configs["flat/recommended"],
  { files: ["**/*.vue"], rules: { "vue/multi-word-component-names": "off" } },
];
`,
    );
  }

  const variants = [];
  let eslintPath = null;
  try {
    eslintPath = require.resolve("eslint", { paths: [rootDir] });
  } catch {
    eslintPath = null;
  }

  if (eslintPath) {
    const { ESLint } = await import("eslint");
    variants.push({
      id: "eslint-plugin-vue-1t",
      label: "eslint-plugin-vue (1T)",
      package: "eslint-plugin-vue",
      threading: "1t",
      notes: "ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles",
      measure: () =>
        timedAsync(async () => {
          const eslint = new ESLint({
            overrideConfigFile: join(fixtureDir, "eslint.config.mjs"),
            cwd: fixtureDir,
          });
          await eslint.lintFiles(filePaths);
        }),
    });
    variants.push({
      id: "eslint-plugin-vue-workers",
      label: `eslint-plugin-vue (${Math.min(cpuCount, files.length)} workers)`,
      package: "eslint-plugin-vue",
      threading: "workers",
      notes: "ESLint worker_threads fan-out (one ESLint instance per worker)",
      measure: () => timedAsync(() => runEslintWorkers(fixtureDir, files, eslintPath)),
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

  const vize = tryResolveBin("vize");
  if (vize) {
    variants.push({
      id: "vize-lint-1t",
      label: "Vize lint (1T)",
      package: "vize",
      threading: "1t",
      notes: "vize lint . with RAYON_NUM_THREADS=1",
      measure: () => {
        const { ms } = runCommand(vize, ["lint", ".", "--quiet"], {
          cwd: fixtureDir,
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
      notes: "vize lint . using default Rayon pool (all cores)",
      measure: () => {
        const { ms } = runCommand(vize, ["lint", ".", "--quiet"], {
          cwd: fixtureDir,
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
      path: join(fixtureDir, f).replace(/\\/g, "/"),
      source: require("node:fs").readFileSync(join(fixtureDir, f), "utf8"),
    }));
    variants.push({
      id: "verter-lint-host",
      label: "Verter host lint",
      package: "@verter/native",
      threading: "host",
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
      if (v.id === "eslint-plugin-vue-1t" || v.id === "eslint-plugin-vue-workers") {
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

  const results = await measureVariantsAlternating(variants, {
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
      "Same on-disk Vue SFC corpus for every tool.",
      "eslint-plugin-vue uses flat recommended config generated with fixtures.",
      "Vize lint 1T vs max threads reported separately — compare within class.",
      "Planted-bug work gate: each tool must report vue/no-v-html (or equivalent) or is unranked.",
      "Allow non-zero exit (style diagnostics do not abort timing).",
      "Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.",
      "Measured runs alternate variant order each iteration to reduce order bias.",
    ],
    variants: results,
  };
}
