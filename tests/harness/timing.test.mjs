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
    assert.equal(stddev([5]), 0, "a single sample has no spread");
  });

  test("formatMs and formatThroughput degrade to n/a rather than NaN text", () => {
    assert.equal(formatMs(Number.NaN), "n/a");
    assert.equal(formatMs(1500), "1.50 s");
    assert.equal(formatMs(12.34), "12.3 ms");
    assert.equal(formatThroughput(10, 0), "n/a");
    assert.equal(formatThroughput(10, 1000), "10 files/s");
  });
});
