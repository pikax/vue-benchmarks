import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMPILE_VALIDITY_ENTRYPOINTS,
  compileValidityConfigKey,
} from "./compile-validity-gates.mjs";
import {
  SOURCE_MAP_PLANTS,
  SOURCE_MAP_SUITE_VERSION,
  SOURCE_MAP_SUITE_HASH,
} from "./source-map-validity-plants.mjs";

const childFile = join(dirname(fileURLToPath(import.meta.url)), "source-map-validity-child.mjs");
const PREFIX = "@@SOURCE_MAP_VALIDITY_JSON@@";

export function runSourceMapValidityMatrix(
  configurations,
  { entrypoints = COMPILE_VALIDITY_ENTRYPOINTS, timeoutMs = 60_000 } = {},
) {
  const matrix = {};
  for (const configuration of configurations) {
    if (!configuration.sourceMap) continue;
    const key = compileValidityConfigKey(configuration);
    if (matrix[key]) continue;
    const results = {};
    for (const entrypoint of entrypoints) {
      let payload;
      try {
        const child = spawnSync(
          process.execPath,
          [
            childFile,
            "--entrypoint",
            entrypoint,
            "--target",
            configuration.target,
            "--env",
            configuration.env,
          ],
          { encoding: "utf8", windowsHide: true, timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 },
        );
        if (child.error) throw child.error;
        const start = String(child.stdout).lastIndexOf(PREFIX);
        if (child.status !== 0 || start < 0)
          throw new Error(
            `source-map child exited ${child.status}: ${String(child.stderr).slice(0, 800)}`,
          );
        payload = JSON.parse(child.stdout.slice(start + PREFIX.length).split(/\r?\n/, 1)[0]);
        if (
          payload.entrypoint !== entrypoint ||
          payload.target !== configuration.target ||
          payload.env !== configuration.env ||
          payload.suiteHash !== SOURCE_MAP_SUITE_HASH ||
          payload.results?.length !== SOURCE_MAP_PLANTS.length ||
          SOURCE_MAP_PLANTS.some(
            (plant) =>
              payload.results.filter(
                (result) => result.id === plant.id && result.workload === plant.workload,
              ).length !== 1,
          )
        )
          throw new Error("source-map child returned mismatched manifest/configuration");
      } catch (error) {
        payload = {
          entrypoint,
          results: SOURCE_MAP_PLANTS.map((plant) => ({
            id: plant.id,
            workload: plant.workload,
            status: "FAIL",
            failures: [error.message],
          })),
        };
      }
      const workloads = {};
      for (const workload of ["raw", "styles"]) {
        const plants = payload.results.filter((result) => result.workload === workload);
        workloads[workload] = {
          status: plants.every((result) => result.status === "PASS")
            ? "PASS"
            : plants.some((result) => result.status === "FAIL")
              ? "FAIL"
              : "UNKNOWN",
          passed: plants.filter((result) => result.status === "PASS").length,
          plantCount: plants.length,
          results: plants,
        };
      }
      results[entrypoint] = { ...payload, workloads };
    }
    matrix[key] = { configuration, entrypoints: results };
  }
  return {
    suiteVersion: SOURCE_MAP_SUITE_VERSION,
    suiteHash: SOURCE_MAP_SUITE_HASH,
    plantIds: SOURCE_MAP_PLANTS.map((plant) => plant.id),
    matrix,
  };
}

export function sourceMapVerdict(validity, configuration, entrypoint, workload) {
  return validity?.matrix?.[compileValidityConfigKey(configuration)]?.entrypoints?.[entrypoint]
    ?.workloads?.[workload];
}
