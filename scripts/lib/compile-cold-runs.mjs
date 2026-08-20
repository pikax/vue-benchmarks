import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mean, median, stddev } from "./timing.mjs";

const childPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "compile-cold-child.mjs",
);

function rotate(list, by) {
  if (!list.length) return list;
  const offset = ((by % list.length) + list.length) % list.length;
  return [...list.slice(offset), ...list.slice(0, offset)];
}

/**
 * A paired forward/reverse schedule balances position over any complete pair
 * of samples. Plain rotation needs `runs >= rows` before every row has occupied
 * every position; the common 2-run diagnostic otherwise favours the rows near
 * the end of declaration order on both samples.
 */
export function freshChildOrder(list, iteration) {
  const pair = Math.floor(iteration / 2);
  const base = rotate(list, pair);
  return iteration % 2 === 0 ? base : [...base].reverse();
}

function summarize(values, prefix) {
  const med = median(values);
  const sd = stddev(values);
  return {
    [`${prefix}Runs`]: values,
    [`${prefix}MedianMs`]: Number(med.toFixed(3)),
    [`${prefix}MinMs`]: Number(Math.min(...values).toFixed(3)),
    [`${prefix}MeanMs`]: Number(mean(values).toFixed(3)),
    [`${prefix}StddevMs`]: sd === null ? null : Number(sd.toFixed(3)),
    [`${prefix}CvPct`]:
      sd === null ? null : med > 0 ? Number(((sd / med) * 100).toFixed(1)) : 0,
  };
}

function childFailure(probe, outputPath) {
  let detail = "";
  if (existsSync(outputPath)) {
    try {
      detail = JSON.parse(readFileSync(outputPath, "utf8"))?.error ?? "";
    } catch {
      detail = "";
    }
  }
  if (!detail) {
    detail = String(
      probe.stderr || probe.stdout || probe.error?.message || "",
    ).trim();
  }
  if (probe.signal)
    return `fresh child killed by ${probe.signal}${detail ? `: ${detail}` : ""}`;
  return `fresh child exited ${probe.status}${detail ? `: ${detail}` : ""}`;
}

/**
 * Measure one first timed row workload per fresh child process and row.
 *
 * The child imports the packages and builds the same row adapter before its
 * internal timer starts. Node process startup, module loading, input
 * materialisation and compiler-host construction are therefore excluded, just
 * like setup around the warm timed call. Process-local V8/native/thread-pool and
 * allocator state may already have been changed by imports and adapter setup.
 * OS page/filesystem caches are not flushed. This is intentionally named by
 * its observable boundary rather than implying a wholly cold process.
 */
export function measureCompileFreshChildVariants(
  variants,
  { runs = 3, payload, timeoutMs = 300_000, childScript = childPath } = {},
) {
  const active = variants.filter((variant) => !variant.skip);
  const count = Math.max(1, Math.trunc(Number(runs) || 1));
  const values = new Map(active.map((variant) => [variant.id, []]));
  const metadata = new Map(active.map((variant) => [variant.id, []]));
  const errors = new Map();
  const failed = new Set();
  const executedOrder = [];
  const dir = mkdtempSync(join(tmpdir(), "vue-bench-compile-fresh-child-"));
  const payloadPath = join(dir, "payload.json");

  try {
    writeFileSync(payloadPath, JSON.stringify(payload));
    for (let iteration = 0; iteration < count; iteration++) {
      const executed = [];
      for (const variant of freshChildOrder(active, iteration)) {
        // A deterministic adapter/package failure will repeat in every new
        // child. Preserve the first evidence and do not burn the remainder of
        // a long benchmark retrying the same doomed row.
        if (failed.has(variant.id)) continue;
        executed.push(variant.id);
        const outputPath = join(
          dir,
          `${iteration}-${variant.id.replace(/[^a-z0-9_.-]+/gi, "-")}.json`,
        );
        const probe = spawnSync(
          process.execPath,
          [childScript, payloadPath, variant.id, String(iteration), outputPath],
          {
            cwd: process.cwd(),
            encoding: "utf8",
            timeout: timeoutMs,
            maxBuffer: 32 * 1024 * 1024,
          },
        );
        if (probe.status !== 0 || !existsSync(outputPath)) {
          errors.set(variant.id, childFailure(probe, outputPath));
          failed.add(variant.id);
          continue;
        }
        try {
          const result = JSON.parse(readFileSync(outputPath, "utf8"));
          if (!Number.isFinite(result.ms))
            throw new Error("child returned no finite duration");
          values.get(variant.id).push(Number(result.ms.toFixed(3)));
          if (result.meta && typeof result.meta === "object") {
            metadata.get(variant.id).push(result.meta);
          }
        } catch (error) {
          errors.set(
            variant.id,
            `invalid fresh-child result: ${error instanceof Error ? error.message : String(error)}`,
          );
          failed.add(variant.id);
        }
      }
      executedOrder.push(executed);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  const byId = new Map(
    active.map((variant) => {
      const freshChildRuns = values.get(variant.id) ?? [];
      const complete = freshChildRuns.length === count;
      return [
        variant.id,
        complete
          ? {
              ...summarize(freshChildRuns, "freshChild"),
              freshChildMetaSamples: metadata.get(variant.id),
              freshChildProcessModel: "fresh-child-first-timed-row-workload",
            }
          : {
              freshChildRuns,
              freshChildMetaSamples: metadata.get(variant.id),
              freshChildError:
                errors.get(variant.id) ??
                `recorded ${freshChildRuns.length}/${count} fresh-child samples`,
            },
      ];
    }),
  );
  return { byId, executedOrder };
}

// Kept only for import compatibility with pre-overhaul diagnostics. New code
// and JSON use the exact fresh-child terminology above.
export const measureCompileColdVariants = measureCompileFreshChildVariants;
