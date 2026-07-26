import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";
import { delimiter, dirname, join, parse } from "node:path";
import { existsSync } from "node:fs";

export function median(values) {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mean(values) {
  if (values.length === 0) return Number.NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function formatMs(ms) {
  if (!Number.isFinite(ms)) return "n/a";
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  return `${ms.toFixed(1)} ms`;
}

export function formatSpeedup(baselineMs, candidateMs) {
  if (!Number.isFinite(baselineMs) || !Number.isFinite(candidateMs) || candidateMs <= 0) {
    return "n/a";
  }
  return `${(baselineMs / candidateMs).toFixed(2)}x`;
}

export function formatThroughput(files, ms) {
  if (!Number.isFinite(ms) || ms <= 0 || !Number.isFinite(files)) return "n/a";
  const perSec = (files / ms) * 1000;
  if (perSec >= 1000) return `${(perSec / 1000).toFixed(1)}k files/s`;
  return `${perSec.toFixed(0)} files/s`;
}

export function timedSync(fn) {
  const start = performance.now();
  const extra = fn() ?? {};
  const ms = performance.now() - start;
  return { ms, ...extra };
}

export async function timedAsync(fn) {
  const start = performance.now();
  const extra = (await fn()) ?? {};
  const ms = performance.now() - start;
  return { ms, ...extra };
}

/**
 * Measure a single variant: warmups then runs.
 * Returns cold / warm / median stats. measure() may return number or { ms, ...meta }.
 */
export async function measureSeries(measure, { runs = 3, warmups = 1 } = {}) {
  for (let i = 0; i < warmups; i++) {
    await measure({ phase: "warmup", iteration: i });
  }

  const all = [];
  const metas = [];
  for (let i = 0; i < runs; i++) {
    const out = await measure({ phase: "measure", iteration: i });
    if (typeof out === "number") {
      all.push(Number(out.toFixed(3)));
    } else {
      all.push(Number(out.ms.toFixed(3)));
      if (out.meta) metas.push(out.meta);
    }
  }

  const coldMs = all[0] ?? Number.NaN;
  const warmRuns = all.length > 1 ? all.slice(1) : all;
  const result = {
    runs: all,
    coldMs,
    warmMedianMs: Number(median(warmRuns).toFixed(3)),
    warmMeanMs: Number(mean(warmRuns).toFixed(3)),
    warmStddevMs: Number(stddev(warmRuns).toFixed(3)),
    overallMedianMs: Number(median(all).toFixed(3)),
  };
  if (metas.length) result.metaSamples = metas;
  return result;
}

/**
 * Measure a list of variants with alternating order each measured iteration
 * (reduces systematic order bias — Vize-style).
 *
 * Warmups: each variant once in forward order.
 * Measured: iteration i uses forward order when i even, reverse when i odd.
 */
export async function measureVariantsAlternating(
  variants,
  { runs = 3, warmups = 1, fileCount } = {},
) {
  const active = variants.filter((v) => !v.skip);
  const skipped = variants.filter((v) => v.skip);

  for (let w = 0; w < warmups; w++) {
    for (const v of active) {
      try {
        await v.measure({ phase: "warmup", iteration: w });
      } catch (error) {
        // Warmup failures must not abort the suite; mark for measured phase.
        v._error = error instanceof Error ? error.message : String(error);
      }
    }
  }

  const runsById = new Map(active.map((v) => [v.id, []]));
  const metaById = new Map(active.map((v) => [v.id, []]));

  for (let i = 0; i < runs; i++) {
    const ordered = i % 2 === 0 ? active : [...active].reverse();
    for (const v of ordered) {
      try {
        const out = await v.measure({ phase: "measure", iteration: i });
        if (typeof out === "number") {
          runsById.get(v.id).push(Number(out.toFixed(3)));
        } else {
          runsById.get(v.id).push(Number(out.ms.toFixed(3)));
          const { ms: _ms, meta, ...rest } = out;
          const payload = meta ?? (Object.keys(rest).length ? rest : null);
          if (payload) metaById.get(v.id).push(payload);
        }
      } catch (error) {
        // Record as error later via sentinel — store NaN and attach error
        runsById.get(v.id).push(Number.NaN);
        v._error = error instanceof Error ? error.message : String(error);
      }
    }
  }

  const results = [];
  for (const v of variants) {
    if (v.skip) {
      results.push({
        id: v.id,
        label: v.label,
        package: v.package,
        target: v.target,
        env: v.env,
        threading: v.threading,
        notes: v.notes,
        status: "skipped",
        files: fileCount,
        throughput: "n/a",
      });
      continue;
    }
    if (v._error) {
      results.push({
        id: v.id,
        label: v.label,
        package: v.package,
        target: v.target,
        env: v.env,
        threading: v.threading,
        notes: v.notes,
        status: "error",
        files: fileCount,
        error: v._error,
        throughput: "n/a",
      });
      continue;
    }
    const all = runsById.get(v.id) ?? [];
    if (all.some((x) => !Number.isFinite(x))) {
      results.push({
        id: v.id,
        label: v.label,
        package: v.package,
        target: v.target,
        env: v.env,
        threading: v.threading,
        notes: v.notes,
        status: "error",
        files: fileCount,
        error: v._error ?? "measurement failed",
        throughput: "n/a",
      });
      continue;
    }
    const coldMs = all[0] ?? Number.NaN;
    const warmRuns = all.length > 1 ? all.slice(1) : all;
    const metas = metaById.get(v.id) ?? [];
    const series = {
      runs: all,
      coldMs,
      warmMedianMs: Number(median(warmRuns).toFixed(3)),
      warmMeanMs: Number(mean(warmRuns).toFixed(3)),
      warmStddevMs: Number(stddev(warmRuns).toFixed(3)),
      overallMedianMs: Number(median(all).toFixed(3)),
    };
    if (metas.length) {
      series.metaSamples = metas;
      // Aggregate common cache stats if present
      const hits = metas.map((m) => m.cacheHits).filter((x) => Number.isFinite(x));
      if (hits.length) {
        series.cacheHitsMedian = Number(median(hits).toFixed(0));
        series.cacheHitsLast = hits[hits.length - 1];
      }
    }
    results.push({
      id: v.id,
      label: v.label,
      package: v.package,
      target: v.target,
      env: v.env,
      threading: v.threading,
      notes: v.notes,
      status: "ok",
      files: fileCount,
      ...series,
      throughput: formatThroughput(fileCount, series.overallMedianMs),
    });
  }
  return results;
}

export function pathWithNodeBins(cwd) {
  const dirs = [];
  let current = cwd;
  const root = parse(current).root;
  while (true) {
    const candidate = join(current, "node_modules", ".bin");
    if (existsSync(candidate)) dirs.push(candidate);
    if (current === root) break;
    current = dirname(current);
  }
  return [...dirs.reverse(), process.env.PATH ?? ""].join(delimiter);
}

export function runCommand(binary, args, options = {}) {
  const start = performance.now();
  const result = spawnSync(binary, args, {
    cwd: options.cwd,
    env: {
      ...process.env,
      NO_COLOR: "1",
      FORCE_COLOR: "0",
      PATH: pathWithNodeBins(options.cwd ?? process.cwd()),
      ...(options.env ?? {}),
    },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: options.shell ?? false,
  });
  const elapsedMs = performance.now() - start;

  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowNonZeroExit) {
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
    throw new Error(
      `${binary} ${args.join(" ")} exited with ${result.status}\n${output.slice(0, 4000)}`,
    );
  }
  return {
    ms: elapsedMs,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function resolveBin(name, fromDir = process.cwd()) {
  const suffixes = process.platform === "win32" ? [".cmd", ".ps1", ""] : [""];
  let current = fromDir;
  const root = parse(current).root;
  while (true) {
    for (const suffix of suffixes) {
      const candidate = join(current, "node_modules", ".bin", `${name}${suffix}`);
      if (existsSync(candidate)) return candidate;
    }
    if (current === root) break;
    current = dirname(current);
  }
  throw new Error(`Could not resolve bin: ${name}`);
}
