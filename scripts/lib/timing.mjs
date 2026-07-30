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

/**
 * Sample standard deviation, or `null` when there is nothing to disperse.
 *
 * Fewer than two samples has NO measured spread — that is undefined, not zero.
 * Returning 0 made every row of a 1-run artifact print `0.0 ms / 0.0%`, and the
 * report legend flags `CV > 10%` as noisy, so an UNMEASURED series rendered as
 * the most reproducible result in the table. `null` propagates through
 * `summarize()` into `stddevMs`/`cvPct` and every renderer prints `n/a`.
 */
export function stddev(values) {
  if (values.length < 2) return null;
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

/** Minimum warmup passes. Cold (unwarmed) runs are never reported as a ranking metric. */
export const MIN_WARMUPS = 1;

/**
 * Every tool gets at least one discarded warmup pass before measurement.
 *
 * Rationale: a JS compiler pays a large one-off JIT cost on its first pass
 * (measured ~3.2x its own steady state) while a native/NAPI tool pays none.
 * Ranking on an unwarmed first run therefore measures V8 warmup, not the tool.
 */
export function effectiveWarmups(warmups) {
  const n = Number.isFinite(warmups) ? warmups : MIN_WARMUPS;
  return Math.max(MIN_WARMUPS, n);
}

/**
 * Warmup count for a table whose DISCARDED WARM PASS is the surface's own
 * untimed gate or preflight execution.
 *
 * Some surfaces already execute every cell once, untimed, before any timing —
 * the bundle corpus-compile gate builds each cell, the hmr gate probe starts
 * each cell's server, the LSP preflight loads the same workspace and document.
 * Those passes run the identical code path a dedicated warmup would, so a
 * warmup on top repeated seconds-to-minutes of work per cell purely to warm
 * caches that were already warm.
 *
 * The NAME is load-bearing: the wiring test forbids bare numeric warmup
 * literals in surfaces, so a gate-as-warmup site must import this constant —
 * and the same test requires any surface using it to say "DISCARDED WARM PASS"
 * in its methodology, which keeps the justification attached to the number.
 *
 * DELIBERATELY NOT the number 0. A numeric zero is indistinguishable from CLI
 * `--warmups 0`, which effectiveWarmups MUST clamp to 1 — and did, which made
 * the first version of this constant inert: the warmup it claimed to remove
 * still ran while three methodology strings said it did not. A sentinel the
 * clamp cannot see is the only shape that can carry the intent through.
 */
export const GATE_IS_THE_WARM_PASS = "gate-is-the-warm-pass";

/** Summary stats over measured runs. Primary metric is the median. */
function summarize(all) {
  const med = median(all);
  const sd = stddev(all);
  return {
    runs: all,
    medianMs: Number(med.toFixed(3)),
    minMs: Number(Math.min(...all).toFixed(3)),
    maxMs: Number(Math.max(...all).toFixed(3)),
    meanMs: Number(mean(all).toFixed(3)),
    // `null`, never 0, for a single measured run — see stddev(). A number here
    // is a claim about reproducibility, and with one sample there is none to
    // make.
    stddevMs: sd === null ? null : Number(sd.toFixed(3)),
    // Coefficient of variation — noise guard. High CV => thermal drift or a noisy box.
    // Undefined without a spread to divide, for the same reason.
    cvPct: sd === null ? null : med > 0 ? Number(((sd / med) * 100).toFixed(1)) : 0,
  };
}

/**
 * Rotate so each variant occupies a different position on each measured run.
 * Deterministic (reproducible) and, over runs >= variants, position-balanced.
 * Forward/reverse alternation only ever produces two orderings and leaves the
 * first run in fixed declaration order.
 */
function rotate(list, by) {
  if (list.length === 0) return list;
  const k = ((by % list.length) + list.length) % list.length;
  return [...list.slice(k), ...list.slice(0, k)];
}

/**
 * Measure a single variant: warmups (>= 1, discarded) then runs.
 * measure() may return number or { ms, ...meta }.
 */
export async function measureSeries(measure, { runs = 3, warmups = 1 } = {}) {
  const w = effectiveWarmups(warmups);
  for (let i = 0; i < w; i++) {
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

  const result = summarize(all);
  if (metas.length) result.metaSamples = metas;
  return result;
}

/**
 * Measure a list of variants, rotating tool order on every measured run.
 *
 * Warmups (>= 1, always discarded) are rotated too, so no tool is pinned to
 * first position — first position is the most expensive slot on a cold box.
 * Ranking metric is the median of the measured runs; there is no cold column.
 */
export async function measureVariants(
  variants,
  { runs = 3, warmups = 1, fileCount } = {},
) {
  const active = variants.filter((v) => !v.skip);
  // The sentinel is checked BEFORE the clamp, because it must never be
  // expressible as a number: numeric 0 is CLI `--warmups 0` and clamps to 1.
  const warmupPasses = warmups === GATE_IS_THE_WARM_PASS ? 0 : effectiveWarmups(warmups);

  for (let w = 0; w < warmupPasses; w++) {
    for (const v of rotate(active, w)) {
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
    // Rotate by run index: over runs >= variants every tool visits every slot.
    const ordered = rotate(active, i);
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

  const baseRow = (v) => ({
    id: v.id,
    label: v.label,
    package: v.package,
    target: v.target,
    env: v.env,
    sourceMap: v.sourceMap,
    threading: v.threading,
    invocation: v.invocation,
    artifactPolarity: v.artifactPolarity,
    // Underlying engine (e.g. tsc-js vs tsgo). Part of the comparison class.
    engine: v.engine,
    // What the surface counts as "work produced" (e.g. "code bytes",
    // "diagnostics"). Rendered as a column so a fast row with a tiny artifact
    // count is obvious.
    artifactLabel: v.artifactLabel,
    notes: v.notes,
    files: fileCount,
  });

  const results = [];
  for (const v of variants) {
    if (v.skip) {
      results.push({ ...baseRow(v), status: "skipped", throughput: "n/a" });
      continue;
    }
    if (v._error) {
      results.push({
        ...baseRow(v),
        status: "error",
        error: v._error,
        throughput: "n/a",
      });
      continue;
    }
    const all = runsById.get(v.id) ?? [];
    if (all.length === 0 || all.some((x) => !Number.isFinite(x))) {
      results.push({
        ...baseRow(v),
        status: "error",
        error: v._error ?? "measurement failed",
        throughput: "n/a",
      });
      continue;
    }
    const metas = metaById.get(v.id) ?? [];
    const series = summarize(all);
    if (metas.length) {
      series.metaSamples = metas;
      // Aggregate common cache stats if present
      const hits = metas.map((m) => m.cacheHits).filter((x) => Number.isFinite(x));
      if (hits.length) {
        series.cacheHitsMedian = Number(median(hits).toFixed(0));
        series.cacheHitsLast = hits[hits.length - 1];
      }
      // Artifact census: how much did this tool actually PRODUCE?
      //
      // Timing alone cannot tell "fast" from "did less". A tool that skips
      // v-for codegen, drops v-text, fails to parse a third of the corpus, or
      // emits no source map is quicker for reasons that have nothing to do
      // with being a better implementation. Every surface reports a
      // countable artifact so a suspiciously fast row is visible in the table
      // instead of being taken at face value.
      const artifacts = metas.map((m) => m.artifact).filter((x) => Number.isFinite(x));
      if (artifacts.length) {
        series.artifactMedian = Number(median(artifacts).toFixed(0));
      }
    }
    results.push({
      ...baseRow(v),
      // "unranked" = measured, but failed a validation gate. Its timing is
      // reported for context and excluded from every ranking comparison.
      status: v.unranked ? "unranked" : "ok",
      ...series,
      warmupPasses,
      throughput: v.unranked ? "n/a" : formatThroughput(fileCount, series.medianMs),
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
