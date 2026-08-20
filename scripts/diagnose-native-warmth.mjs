import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

import { VerterHost } from "@verter/native";
import { compileSfcBatchWithResults } from "@vizejs/native";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = join(root, "fixtures", "200");
const files = readdirSync(fixtureDir)
  .filter((name) => name.endsWith(".vue"))
  .sort()
  .map((name) => {
    const path = join(fixtureDir, name).replace(/\\/g, "/");
    return { path, source: readFileSync(path, "utf8") };
  });

const vizeInputs = files.map(({ path, source }) => ({ path, source }));
const verterInputs = files.map(({ path, source }) => ({
  canonicalId: path,
  source,
  requestedMode: "stateless",
}));
const renderProfile = {
  isProduction: true,
  customElement: false,
  ssr: false,
  forceJs: false,
  forceVapor: false,
  sourceMap: false,
  hmrStrategy: "none",
  runtimeModuleName: "vue",
};

function time(call) {
  const start = performance.now();
  const value = call();
  return { ms: performance.now() - start, value };
}

function summarizeVerter(label, timed) {
  const results = timed.value;
  const failed = results.filter((result) => result.errors?.length);
  if (failed.length) throw new Error(`${label}: ${failed[0].errors[0]}`);
  return {
    label,
    ms: Number(timed.ms.toFixed(3)),
    files: results.length,
    cacheHits: results.filter((result) => result.cacheHit).length,
    actualModes: [...new Set(results.map((result) => result.actualMode))],
    codeBytes: results.reduce((sum, result) => sum + (result.code?.length ?? 0), 0),
  };
}

function runtimeRender(host, inputs, defaultMode = "stateless") {
  return time(() =>
    host.compileMany(inputs, {
      target: "runtime-render",
      defaultMode,
      priority: "interactive",
      compileProfile: renderProfile,
    }),
  );
}

function hostBacked(host, inputs) {
  return time(() =>
    host.compileMany(inputs, {
      target: "host-backed",
      defaultMode: "session",
      priority: "interactive",
    }),
  );
}

function runVizeOnce() {
  const timed = time(() =>
    compileSfcBatchWithResults(vizeInputs, {
      vapor: false,
      isTs: true,
      includeSourceMap: false,
      templateHoistStatic: true,
      templateCacheHandlers: true,
    }),
  );
  const results = timed.value.results ?? timed.value.items ?? [];
  const failedRows = results.filter((result) => result?.errors?.length);
  if (
    timed.value.failedCount ||
    timed.value.errors?.length ||
    failedRows.length ||
    results.length !== files.length
  ) {
    throw new Error(
      `Vize batch invalid: failedCount=${timed.value.failedCount ?? 0}, topLevelErrors=${timed.value.errors?.length ?? 0}, perFileErrors=${failedRows.length}, results=${results.length}/${files.length}`,
    );
  }
  return {
    ms: Number(timed.ms.toFixed(3)),
    nativeReportedMs: Number(timed.value.timeMs.toFixed(3)),
    files: results.length,
    codeBytes: results.reduce((sum, result) => sum + (result.code?.length ?? 0), 0),
  };
}

if (process.argv.includes("--vize-child")) {
  process.stdout.write(`${JSON.stringify({ calls: [runVizeOnce(), runVizeOnce()] })}\n`);
  process.exit(0);
}

const verter = [];

for (let i = 1; i <= 2; i += 1) {
  // Match the benchmark: host construction is outside the timed region.
  const host = new VerterHost({ devMode: false, analysisLevel: "full" });
  verter.push(
    summarizeVerter(`fresh runtime/stateless run ${i}`, runtimeRender(host, verterInputs)),
  );
}

const persistent = new VerterHost({ devMode: false, analysisLevel: "full" });
verter.push(
  summarizeVerter("persistent runtime/stateless first", runtimeRender(persistent, verterInputs)),
);
verter.push(
  summarizeVerter(
    "persistent runtime/stateless identical second",
    runtimeRender(persistent, verterInputs),
  ),
);
const oneChanged = verterInputs.map((input, index) =>
  index === 0 ? { ...input, source: `${input.source}\n` } : input,
);
verter.push(
  summarizeVerter(
    "persistent runtime/stateless one changed",
    runtimeRender(persistent, oneChanged),
  ),
);
verter.push(
  summarizeVerter(
    "persistent runtime/stateless changed-set identical",
    runtimeRender(persistent, oneChanged),
  ),
);

const runtimeSessionHost = new VerterHost({
  devMode: false,
  analysisLevel: "full",
});
const runtimeSessionInputs = verterInputs.map((input) => ({
  ...input,
  requestedMode: "session",
}));
verter.push(
  summarizeVerter(
    "runtime-render requested session first",
    runtimeRender(runtimeSessionHost, runtimeSessionInputs, "session"),
  ),
);
verter.push(
  summarizeVerter(
    "runtime-render requested session second",
    runtimeRender(runtimeSessionHost, runtimeSessionInputs, "session"),
  ),
);

const hostBackedSessionHost = new VerterHost({
  devMode: false,
  analysisLevel: "full",
});
verter.push(
  summarizeVerter(
    "host-backed requested session first",
    hostBacked(hostBackedSessionHost, runtimeSessionInputs),
  ),
);
verter.push(
  summarizeVerter(
    "host-backed requested session second",
    hostBacked(hostBackedSessionHost, runtimeSessionInputs),
  ),
);

const vizeSameProcess = [runVizeOnce(), runVizeOnce(), runVizeOnce()];
const vizeFreshChildren = [];
for (let i = 0; i < 3; i += 1) {
  const wallStart = performance.now();
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--vize-child"], {
    cwd: root,
    encoding: "utf8",
  });
  const wallMs = performance.now() - wallStart;
  if (child.status !== 0) throw new Error(child.stderr || `child exited ${child.status}`);
  vizeFreshChildren.push({
    ...JSON.parse(child.stdout),
    processWallMs: Number(wallMs.toFixed(3)),
  });
}

console.log(
  JSON.stringify(
    {
      node: process.version,
      fixtureCount: files.length,
      verter,
      vizeSameProcess,
      vizeFreshChildren,
    },
    null,
    2,
  ),
);
