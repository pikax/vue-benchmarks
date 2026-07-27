/**
 * Measurement contract: scripts/lib/timing.mjs
 *
 * These tests never time real work — every `measure()` is a fake that returns a
 * canned number, so the assertions are about protocol (warmups, rotation, row
 * shape, statistics) and are independent of machine speed.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  MIN_WARMUPS,
  effectiveWarmups,
  formatMs,
  formatThroughput,
  mean,
  measureSeries,
  measureVariants,
  median,
  stddev,
} from "../../scripts/lib/timing.mjs";
import { renderSurfaceMarkdown } from "../../scripts/lib/report.mjs";

/**
 * Variants whose measure() records the exact call order.
 * `value(id, phase, iteration)` decides the returned ms.
 */
function recordingVariants(ids, { value = () => 1, extra = {} } = {}) {
  const calls = [];
  const variants = ids.map((id) => ({
    id,
    label: id.toUpperCase(),
    ...extra,
    measure: ({ phase, iteration }) => {
      calls.push({ id, phase, iteration });
      return value(id, phase, iteration);
    },
  }));
  return { variants, calls };
}

/** Call order per pass, e.g. [["a","b","c"], ["b","c","a"], ...]. */
function orderPerPass(calls, phase) {
  const byIteration = new Map();
  for (const call of calls) {
    if (call.phase !== phase) continue;
    if (!byIteration.has(call.iteration)) byIteration.set(call.iteration, []);
    byIteration.get(call.iteration).push(call.id);
  }
  return [...byIteration.entries()].sort((a, b) => a[0] - b[0]).map(([, ids]) => ids);
}

/** With N variants over N passes, each variant must visit each slot once. */
function assertEveryPositionVisitedOnce(orders, ids, what) {
  assert.equal(orders.length, ids.length, `${what}: need ${ids.length} passes to cover ${ids.length} positions`);
  for (const order of orders) {
    assert.deepEqual([...order].sort(), [...ids].sort(), `${what}: every pass must run every variant once`);
  }
  const allPositions = ids.map((_, i) => i);
  for (const id of ids) {
    const visited = orders.map((order) => order.indexOf(id)).sort((a, b) => a - b);
    assert.deepEqual(visited, allPositions, `${what}: variant ${id} did not occupy every position exactly once`);
  }
}

describe("effectiveWarmups — warmup is mandatory by design", () => {
  test("0 warmups is clamped to 1", () => {
    assert.equal(effectiveWarmups(0), 1);
    assert.equal(MIN_WARMUPS, 1);
  });

  test("an unspecified warmup count is still at least one pass", () => {
    assert.ok(effectiveWarmups(undefined) >= 1);
    assert.ok(effectiveWarmups(null) >= 1);
    assert.ok(effectiveWarmups(Number.NaN) >= 1);
    assert.ok(effectiveWarmups(-4) >= 1);
  });

  test("an explicit count is passed through", () => {
    assert.equal(effectiveWarmups(3), 3);
    assert.equal(effectiveWarmups(9), 9);
  });
});

describe("measureVariants — warmups", () => {
  test("runs at least one warmup pass per variant even when warmups: 0", async () => {
    const { variants, calls } = recordingVariants(["a", "b"], {
      value: (_id, phase) => (phase === "warmup" ? 999 : 7),
    });

    const rows = await measureVariants(variants, { runs: 3, warmups: 0 });

    const warmupCalls = calls.filter((c) => c.phase === "warmup");
    assert.equal(warmupCalls.length, 2, "one warmup pass x two variants");
    for (const row of rows) {
      assert.equal(row.warmupPasses, 1);
      assert.deepEqual(row.runs, [7, 7, 7], "warmup timings must never appear in runs");
      assert.equal(row.medianMs, 7);
    }
  });

  test("warmup results are discarded, not folded into the series", async () => {
    const { variants } = recordingVariants(["a"], {
      value: (_id, phase, i) => (phase === "warmup" ? 1000 + i : 10),
    });

    const [row] = await measureVariants(variants, { runs: 4, warmups: 2 });

    assert.equal(row.warmupPasses, 2);
    assert.deepEqual(row.runs, [10, 10, 10, 10]);
    assert.equal(row.maxMs, 10, "a 1000ms warmup must not become the max");
  });
});

describe("measureVariants — order rotation", () => {
  test("over N measured runs each of N variants occupies each position exactly once", async () => {
    const ids = ["a", "b", "c"];
    const { variants, calls } = recordingVariants(ids);

    await measureVariants(variants, { runs: 3, warmups: 1 });

    assertEveryPositionVisitedOnce(orderPerPass(calls, "measure"), ids, "measured runs");
  });

  test("warmups are rotated too — no tool is pinned to the cold first slot", async () => {
    const ids = ["a", "b", "c"];
    const { variants, calls } = recordingVariants(ids);

    await measureVariants(variants, { runs: 1, warmups: 3 });

    assertEveryPositionVisitedOnce(orderPerPass(calls, "warmup"), ids, "warmup passes");
  });

  test("rotation skips inactive variants without disturbing the cycle", async () => {
    const ids = ["a", "b", "c"];
    const { variants, calls } = recordingVariants(ids);
    variants.splice(1, 0, { id: "skipped", label: "S", skip: true, measure: () => 1 });

    await measureVariants(variants, { runs: 3, warmups: 1 });

    assertEveryPositionVisitedOnce(orderPerPass(calls, "measure"), ids, "measured runs with a skip");
  });
});

describe("measureVariants — result row shape", () => {
  const REQUIRED = ["medianMs", "minMs", "maxMs", "meanMs", "stddevMs", "cvPct", "runs", "warmupPasses"];

  test("ok rows expose every summary statistic", async () => {
    const { variants } = recordingVariants(["a"], { value: () => 5 });

    const [row] = await measureVariants(variants, { runs: 3, warmups: 1, fileCount: 20 });

    assert.equal(row.status, "ok");
    for (const key of REQUIRED) {
      assert.ok(key in row, `missing ${key} on result row`);
    }
    assert.ok(Array.isArray(row.runs));
    assert.equal(row.files, 20);
    assert.equal(row.throughput, formatThroughput(20, row.medianMs));
  });

  test("no cold metric is reported — regression guard, the cold column was removed", async () => {
    const { variants } = recordingVariants(["a"], { value: () => 5 });

    const [row] = await measureVariants(variants, { runs: 3, warmups: 1 });

    assert.ok(!("coldMs" in row), "coldMs must not come back");
    assert.ok(!("warmMedianMs" in row), "warmMedianMs must not come back");
    assert.ok(!/cold/i.test(JSON.stringify(row)), `result row leaked a cold metric: ${JSON.stringify(row)}`);
  });

  test("summary statistics and CV% are correct for a known series", async () => {
    const series = [10, 20, 30];
    const { variants } = recordingVariants(["a"], {
      value: (_id, _phase, i) => series[i],
    });

    const [row] = await measureVariants(variants, { runs: 3, warmups: 1 });

    assert.deepEqual(row.runs, [10, 20, 30]);
    assert.equal(row.medianMs, 20);
    assert.equal(row.minMs, 10);
    assert.equal(row.maxMs, 30);
    assert.equal(row.meanMs, 20);
    // sample stddev of [10,20,30] = sqrt((100+0+100)/2) = 10
    assert.equal(row.stddevMs, 10);
    // cv = stddev / median * 100 = 10 / 20 * 100
    assert.equal(row.cvPct, 50);
  });

  test("a perfectly stable series has CV% 0", async () => {
    const { variants } = recordingVariants(["a"], { value: () => 12 });

    const [row] = await measureVariants(variants, { runs: 5, warmups: 1 });

    assert.equal(row.stddevMs, 0);
    assert.equal(row.cvPct, 0);
  });

  /**
   * A ONE-RUN artifact has no measured spread. Reporting 0 made every row print
   * `0.0 ms / 0.0%`, and the published legend flags `CV > 10%` as noisy — so the
   * least-evidenced row in the report rendered as the most reproducible one.
   */
  test("a single measured run reports null dispersion, never 0", async () => {
    const { variants } = recordingVariants(["a"], { value: () => 12 });

    const [row] = await measureVariants(variants, { runs: 1, warmups: 1 });

    assert.equal(row.runs.length, 1);
    assert.equal(row.medianMs, 12, "the median is still a real measurement");
    assert.equal(row.stddevMs, null, "stddev of one sample must be null, not 0");
    assert.equal(row.cvPct, null, "CV% of one sample must be null, not 0");
  });

  test("null dispersion renders as n/a, not as 0.0 ms / 0.0%", async () => {
    const { variants } = recordingVariants(["a"], { value: () => 12 });
    const [row] = await measureVariants(variants, { runs: 1, warmups: 1 });

    const md = renderSurfaceMarkdown({
      id: "one-run",
      label: "One run",
      files: 1,
      bytes: 1,
      variants: [row],
      methodology: [],
    });

    const cells = md
      .split("\n")
      .find((l) => /^\| .*\| \*\*[\d.]+ (ms|s)\*\* \|/.test(l) || /^\|[^|]+\| \*\*[\d.]+ (ms|s)\*\*/.test(l))
      .split("|")
      .map((c) => c.trim());
    // | Tool | Median | Min | Stddev | CV% | ...
    assert.equal(cells[4], "n/a", `stddev cell should be n/a, got ${cells[4]}`);
    assert.equal(cells[5], "n/a", `CV% cell should be n/a, got ${cells[5]}`);
    assert.ok(!/0\.0 ms \| 0\.0%/.test(md), "must not print a fabricated 0.0 ms / 0.0% pair");
  });
});

/**
 * `medianMs` is the number the whole report is sorted on and the number every
 * published claim is made from. The series here is deliberately outlier-skewed
 * so that median, mean, min, max and midrange are all DIFFERENT — a symmetric
 * series like [10,20,30] cannot tell them apart, so swapping the ranking
 * statistic would go unnoticed.
 *
 *   [10, 11, 12, 13, 154]  →  median 12 · mean 40 · min 10 · max 154 · mid 82
 */
describe("measureVariants — the ranking metric is the median of measured runs", () => {
  const SKEWED = [10, 11, 12, 13, 154];

  function skewedVariant(ids = ["a"], { warmupMs = 1000 } = {}) {
    return recordingVariants(ids, {
      value: (_id, phase, i) => (phase === "warmup" ? warmupMs : SKEWED[i]),
    });
  }

  test("medianMs is the median — not the mean, min, max or midrange", async () => {
    const { variants } = skewedVariant();

    const [row] = await measureVariants(variants, { runs: SKEWED.length, warmups: 1 });

    assert.deepEqual(row.runs, SKEWED);
    assert.equal(row.medianMs, 12, "ranking metric must be the median");
    // Every other candidate statistic over this series, spelled out so that
    // swapping the metric for any of them fails here rather than silently
    // re-ordering every table in the report.
    assert.equal(row.meanMs, 40);
    assert.equal(row.minMs, 10);
    assert.equal(row.maxMs, 154);
    for (const [what, value] of Object.entries({
      mean: row.meanMs,
      min: row.minMs,
      max: row.maxMs,
      midrange: (row.minMs + row.maxMs) / 2,
    })) {
      assert.notEqual(row.medianMs, value, `medianMs must not equal the ${what} for this series`);
    }
  });

  test("an outlier moves the mean past a rival but must not move the ranking", async () => {
    // Ranked on the median, `spiky` is the faster tool (10 vs 20). Ranked on
    // the mean, `steady` wins (20 vs 30) — one slow run would have flipped the
    // published ordering of two tools.
    const variants = [
      { id: "spiky", label: "Spiky", measure: ({ phase, iteration }) => (phase === "warmup" ? 1000 : [10, 10, 10, 10, 110][iteration]) },
      { id: "steady", label: "Steady", measure: () => 20 },
    ];

    const rows = await measureVariants(variants, { runs: 5, warmups: 1 });
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

    assert.equal(byId.spiky.medianMs, 10);
    assert.equal(byId.steady.medianMs, 20);
    assert.ok(byId.spiky.medianMs < byId.steady.medianMs, "median ranks spiky first");
    // The same two rows ranked on the mean give the opposite answer.
    assert.equal(byId.spiky.meanMs, 30);
    assert.equal(byId.steady.meanMs, 20);
    assert.ok(byId.steady.meanMs < byId.spiky.meanMs, "mean would rank steady first");
  });

  test("the ranking metric is taken over MEASURED runs only — warmups cannot move it", async () => {
    // Four 1000ms warmups against five measured runs. Folded in, they would be
    // the majority of the series and drag the median from 12 to 154.
    const { variants, calls } = skewedVariant(["a"], { warmupMs: 1000 });

    const [row] = await measureVariants(variants, { runs: SKEWED.length, warmups: 4 });

    assert.equal(calls.filter((c) => c.phase === "warmup").length, 4);
    assert.equal(row.warmupPasses, 4);
    assert.deepEqual(row.runs, SKEWED, "warmup timings must never enter the series");
    assert.equal(row.runs.length, SKEWED.length, "the series is exactly the measured runs");
    assert.equal(row.medianMs, 12, "median of the measured runs");
    assert.notEqual(row.medianMs, 154, "median of warmups+runs — warmups were folded in");
    assert.equal(row.meanMs, 40, "mean of the measured runs");
    assert.equal(row.maxMs, 154, "a 1000ms warmup is not the max");
  });

  test("CV% is stddev over the MEDIAN, not over the mean", async () => {
    const { variants } = skewedVariant();

    const [row] = await measureVariants(variants, { runs: SKEWED.length, warmups: 1 });

    assert.equal(row.stddevMs, 63.738);
    assert.equal(row.cvPct, 531.1, "63.738 / 12 * 100");
    assert.notEqual(row.cvPct, 159.3, "63.738 / 40 * 100 — CV% was taken over the mean");
  });

  test("throughput is derived from the median, not from any other statistic", async () => {
    const { variants } = skewedVariant();

    const [row] = await measureVariants(variants, { runs: SKEWED.length, warmups: 1, fileCount: 120 });

    assert.equal(row.throughput, formatThroughput(120, 12));
    assert.equal(row.throughput, "10.0k files/s");
    assert.notEqual(row.throughput, formatThroughput(120, row.meanMs));
  });
});

describe("measureVariants — failure handling", () => {
  test("a variant whose measure() throws becomes an error row, not a fast row", async () => {
    const variants = [
      { id: "ok", label: "OK", measure: () => 5 },
      {
        id: "boom",
        label: "Boom",
        measure: ({ phase }) => {
          if (phase === "measure") throw new Error("kaboom");
          return 1;
        },
      },
    ];

    const rows = await measureVariants(variants, { runs: 2, warmups: 1 });
    const boom = rows.find((r) => r.id === "boom");

    assert.equal(boom.status, "error");
    assert.match(boom.error, /kaboom/);
    assert.equal(boom.medianMs, undefined, "an error row must carry no ranking metric");
    assert.equal(boom.runs, undefined);
    assert.equal(boom.throughput, "n/a");
    assert.equal(rows.find((r) => r.id === "ok").status, "ok");
  });

  test("a warmup failure fails the variant closed rather than silently ranking it", async () => {
    const variants = [
      {
        id: "warmup-boom",
        label: "WarmupBoom",
        measure: ({ phase }) => {
          if (phase === "warmup") throw new Error("cold start failed");
          return 5;
        },
      },
    ];

    const [row] = await measureVariants(variants, { runs: 2, warmups: 1 });

    assert.equal(row.status, "error");
    assert.match(row.error, /cold start failed/);
  });

  test("a skip:true variant is skipped, never measured, never ranked", async () => {
    let called = 0;
    const variants = [
      {
        id: "s",
        label: "S",
        skip: true,
        notes: "Binary not found",
        measure: () => {
          called += 1;
          return 1;
        },
      },
    ];

    const [row] = await measureVariants(variants, { runs: 3, warmups: 2 });

    assert.equal(called, 0, "a skipped variant must not be invoked at all");
    assert.equal(row.status, "skipped");
    assert.equal(row.medianMs, undefined);
    assert.equal(row.throughput, "n/a");
    assert.equal(row.notes, "Binary not found");
  });
});

describe("measureVariants — baseRow metadata", () => {
  const META = {
    package: "vize",
    target: "vapor",
    env: "production",
    sourceMap: true,
    threading: "batch",
    invocation: "cli",
    notes: "some note",
  };

  test("classification metadata is propagated onto ok rows", async () => {
    const { variants } = recordingVariants(["a"], { value: () => 3, extra: META });

    const [row] = await measureVariants(variants, { runs: 2, warmups: 1, fileCount: 4 });

    for (const [key, value] of Object.entries(META)) {
      assert.equal(row[key], value, `baseRow dropped ${key}`);
    }
    assert.equal(row.files, 4);
  });

  test("classification metadata survives on skipped and error rows too", async () => {
    const variants = [
      { id: "skip", label: "Skip", skip: true, ...META },
      {
        id: "err",
        label: "Err",
        ...META,
        measure: () => {
          throw new Error("nope");
        },
      },
    ];

    const rows = await measureVariants(variants, { runs: 2, warmups: 1 });

    for (const row of rows) {
      for (const [key, value] of Object.entries(META)) {
        // notes on the error row is untouched by measureVariants
        assert.equal(row[key], value, `${row.status} row dropped ${key}`);
      }
    }
  });
});

describe("measureSeries", () => {
  test("warmups are discarded and only measured runs are summarised", async () => {
    const calls = [];
    const result = await measureSeries(
      ({ phase, iteration }) => {
        calls.push(phase);
        return phase === "warmup" ? 500 : 10 * (iteration + 1);
      },
      { runs: 3, warmups: 0 },
    );

    assert.equal(calls.filter((p) => p === "warmup").length, 1, "warmups: 0 is clamped to 1");
    assert.deepEqual(result.runs, [10, 20, 30]);
    assert.equal(result.medianMs, 20);
    assert.ok(!("coldMs" in result));
  });

  test("meta payloads are collected from measure() objects", async () => {
    const result = await measureSeries(({ iteration }) => ({ ms: 5, meta: { cacheHits: iteration } }), {
      runs: 2,
      warmups: 1,
    });

    assert.deepEqual(result.metaSamples, [{ cacheHits: 0 }, { cacheHits: 1 }]);
  });
});

describe("statistics primitives", () => {
  test("median handles odd and even lengths", () => {
    assert.equal(median([3, 1, 2]), 2);
    assert.equal(median([4, 1, 2, 3]), 2.5);
    assert.ok(Number.isNaN(median([])));
  });

  test("mean and stddev match the textbook sample formulas", () => {
    assert.equal(mean([2, 4, 6]), 4);
    assert.equal(stddev([2, 4, 6]), 2);
    assert.equal(stddev([5]), null, "a single sample has no MEASURED spread — that is null, not 0");
    assert.equal(stddev([]), null, "no samples, no spread");
  });

  test("formatMs and formatThroughput degrade to n/a rather than NaN text", () => {
    assert.equal(formatMs(Number.NaN), "n/a");
    assert.equal(formatMs(1500), "1.50 s");
    assert.equal(formatMs(12.34), "12.3 ms");
    assert.equal(formatThroughput(10, 0), "n/a");
    assert.equal(formatThroughput(10, 1000), "10 files/s");
  });
});
