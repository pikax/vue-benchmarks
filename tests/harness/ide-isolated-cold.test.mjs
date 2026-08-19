/**
 * Isolated-cold sessions: a later timedColdWarm in one LSP session is not
 * cold — caches are already filled. Suites declare those ops; the runner
 * re-spawns so Cold is the first request after didOpen.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  isolatedColdIds,
  mergeIsolatedOps,
  shouldMeasure,
} from "../../scripts/lib/ide-ops/context.mjs";
import { SUITE as SMOKE, pairHoverOps } from "../../scripts/lib/ide-ops/suites/smoke.mjs";
import { SUITE as NAV } from "../../scripts/lib/ide-ops/suites/navigation.mjs";

describe("shouldMeasure", () => {
  test("defaults to measuring every id", () => {
    assert.equal(shouldMeasure({}, "hover-template"), true);
    assert.equal(shouldMeasure(undefined, "x"), true);
  });

  test("only restricts to that id", () => {
    assert.equal(shouldMeasure({ only: "hover-template" }, "hover-template"), true);
    assert.equal(shouldMeasure({ only: "hover-template" }, "hover-script"), false);
  });

  test("skipOpIds drops listed ids unless only is set", () => {
    assert.equal(shouldMeasure({ skipOpIds: ["hover-template"] }, "hover-template"), false);
    assert.equal(shouldMeasure({ skipOpIds: ["hover-template"] }, "hover-script"), true);
    assert.equal(
      shouldMeasure({ only: "hover-template", skipOpIds: ["hover-template"] }, "hover-template"),
      true,
    );
  });
});

describe("mergeIsolatedOps", () => {
  test("splices isolated op after its predecessor", () => {
    const full = [{ id: "a" }, { id: "c" }];
    const extra = [[{ id: "b", coldMs: 900 }]];
    const out = mergeIsolatedOps(full, extra, [{ id: "b", after: "a" }]);
    assert.deepEqual(
      out.map((o) => o.id),
      ["a", "b", "c"],
    );
    assert.equal(out[1].coldMs, 900);
  });

  test("runs pairOps after merge so a failed isolated probe unranks the pair", () => {
    const full = [{ id: "hover-script", valid: true }];
    const extra = [[{ id: "hover-template", valid: false, reason: "leaked" }]];
    const out = mergeIsolatedOps(
      full,
      extra,
      [{ id: "hover-template", after: "hover-script" }],
      pairHoverOps,
    );
    assert.equal(out[0].valid, false);
    assert.match(out[0].reason, /paired probe failed/);
    assert.equal(out[1].valid, false);
  });
});

describe("suites declare isolated cold ops", () => {
  test("smoke isolates template hover", () => {
    assert.deepEqual(isolatedColdIds(SMOKE.isolatedColdOps), ["hover-template"]);
  });

  test("navigation isolates imported-fn definition", () => {
    assert.deepEqual(isolatedColdIds(NAV.isolatedColdOps), ["def-imported-symbol"]);
  });
});

const HOVER = { contents: { kind: "markdown", value: "marker: string" } };

async function measureSmoke(opts = {}) {
  return SMOKE.measure({
    ask: async () => HOVER,
    openDoc() {},
    ws: {
      file: "Smoke.vue",
      source: "",
      scriptProbe: { line: 0, character: 0 },
      templateProbe: { line: 0, character: 0 },
    },
    pathToFileUri: (f) => `file://${f}`,
    ...opts,
  });
}

describe("smoke.measure respects only / skipOpIds", () => {
  test("times both probes by default", async () => {
    const ops = await measureSmoke();
    assert.deepEqual(
      ops.map((o) => o.id),
      ["hover-script", "hover-template"],
    );
  });

  test("only=hover-template times that probe alone (true cold session)", async () => {
    const ops = await measureSmoke({ only: "hover-template" });
    assert.deepEqual(
      ops.map((o) => o.id),
      ["hover-template"],
    );
    assert.equal(typeof ops[0].coldMs, "number");
  });

  test("skipOpIds drops the isolated probe from the full session", async () => {
    const ops = await measureSmoke({ skipOpIds: ["hover-template"] });
    assert.deepEqual(
      ops.map((o) => o.id),
      ["hover-script"],
    );
  });
});
