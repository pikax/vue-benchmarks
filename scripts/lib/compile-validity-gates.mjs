/** Parent-side launcher for process-isolated compile semantic plants. */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMPILE_VALIDITY_PLANTS,
  COMPILE_VALIDITY_SUITE_HASH,
  COMPILE_VALIDITY_SUITE_VERSION,
  unknownCompileValidityResults,
} from "./compile-validity-plants.mjs";

// Kept local so importing the parent helper does not import the child module's
// jsdom/runtime dependencies into the benchmark process.
export const COMPILE_VALIDITY_JSON_PREFIX = "@@COMPILE_VALIDITY_JSON@@";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const childFile = join(dirname(fileURLToPath(import.meta.url)), "compile-validity-child.mjs");

export const COMPILE_VALIDITY_ENTRYPOINTS = Object.freeze([
  "vue-3.5",
  "vue-3.6",
  "vize-single",
  "vize-batch",
  "verter-compile-many",
  "fervid-sync",
  "fervid-async",
]);

function syntheticResult(entrypoint, target, env, sourceMap, status, detail) {
  const results = COMPILE_VALIDITY_PLANTS.map((plant) => ({
    id: plant.id,
    coverage: plant.coverage,
    status,
    phase: status === "UNKNOWN" ? "not-run" : "child",
    detail,
  }));
  return {
    schemaVersion: 1,
    suiteVersion: COMPILE_VALIDITY_SUITE_VERSION,
    suiteHash: COMPILE_VALIDITY_SUITE_HASH,
    entrypoint,
    label: entrypoint,
    exactPath: "child process did not return its path metadata",
    target,
    env,
    sourceMap,
    status,
    reason: detail,
    plantCount: results.length,
    passed: 0,
    failed: status === "FAIL" ? results.length : 0,
    unknown: status === "UNKNOWN" ? results.length : 0,
    results,
  };
}

function parseChildPayload(stdout) {
  const text = String(stdout ?? "");
  const start = text.lastIndexOf(COMPILE_VALIDITY_JSON_PREFIX);
  if (start < 0) throw new Error("validity child emitted no JSON marker");
  const payload = text.slice(start + COMPILE_VALIDITY_JSON_PREFIX.length).split(/\r?\n/, 1)[0];
  return JSON.parse(payload);
}

/**
 * Run each requested entry point in its own process.
 *
 * Call this after timed measurements. Even if a package initializes global
 * state, threads, or an allocator, that state dies with its validity child and
 * cannot warm a benchmark row. A crash/abort is a FAIL, not an unavailable
 * result. Missing APIs are reported by the live child as UNKNOWN.
 */
export function runCompileValidityChildren({
  target = "vdom",
  env = "production",
  sourceMap = false,
  entrypoints = COMPILE_VALIDITY_ENTRYPOINTS,
  timeoutMs = 120_000,
  spawn = spawnSync,
} = {}) {
  const requested = [...new Set(entrypoints)];
  const results = {};

  for (const entrypoint of requested) {
    if (!COMPILE_VALIDITY_ENTRYPOINTS.includes(entrypoint)) {
      results[entrypoint] = syntheticResult(
        entrypoint,
        target,
        env,
        sourceMap,
        "UNKNOWN",
        "entrypoint is not registered",
      );
      continue;
    }
    const child = spawn(
      process.execPath,
      [
        childFile,
        "--entrypoint",
        entrypoint,
        "--target",
        target,
        "--env",
        env,
        "--source-map",
        String(Boolean(sourceMap)),
      ],
      {
        cwd: rootDir,
        encoding: "utf8",
        timeout: timeoutMs,
        maxBuffer: 32 * 1024 * 1024,
        windowsHide: true,
      },
    );

    try {
      if (child.error) throw child.error;
      if (child.status !== 0) {
        throw new Error(
          `child exited ${child.status ?? "without a status"}${child.signal ? ` (${child.signal})` : ""}: ${String(
            child.stderr ?? "",
          )
            .trim()
            .slice(0, 800)}`,
        );
      }
      results[entrypoint] = parseChildPayload(child.stdout);
    } catch (error) {
      results[entrypoint] = syntheticResult(
        entrypoint,
        target,
        env,
        sourceMap,
        "FAIL",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  return summarize(target, env, sourceMap, results);
}

export function compileValidityConfigKey({ target, env, sourceMap = false }) {
  return `${target}/${env}/source-map-${sourceMap ? "on" : "off"}`;
}

/** Run each unique selected matrix cell and retain every exact-entrypoint result. */
export function runCompileValidityMatrix(configurations, options = {}) {
  const unique = new Map(
    configurations.map((configuration) => [
      compileValidityConfigKey(configuration),
      { ...configuration, sourceMap: Boolean(configuration.sourceMap) },
    ]),
  );
  const matrix = {};
  for (const [key, configuration] of unique) {
    const suite = runCompileValidityChildren({ ...configuration, ...options });
    matrix[key] = {
      configuration,
      status: suite.status,
      entrypoints: suite.results,
    };
  }
  return {
    schemaVersion: 1,
    suiteVersion: COMPILE_VALIDITY_SUITE_VERSION,
    suiteHash: COMPILE_VALIDITY_SUITE_HASH,
    plantCount: COMPILE_VALIDITY_PLANTS.length,
    plantIds: COMPILE_VALIDITY_PLANTS.map((plant) => plant.id),
    matrix,
  };
}

function summarize(target, env, sourceMap, results) {
  const values = Object.values(results);
  return {
    schemaVersion: 1,
    suiteVersion: COMPILE_VALIDITY_SUITE_VERSION,
    suiteHash: COMPILE_VALIDITY_SUITE_HASH,
    target,
    env,
    sourceMap,
    plantCount: COMPILE_VALIDITY_PLANTS.length,
    status: values.some((result) => result.status === "FAIL")
      ? "FAIL"
      : values.some((result) => result.status === "UNKNOWN")
        ? "UNKNOWN"
        : "PASS",
    allPass: values.length > 0 && values.every((result) => result.status === "PASS"),
    results,
  };
}

export function unknownCompileValiditySuite(reason) {
  return unknownCompileValidityResults(reason);
}
