import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  freshChildOrder,
  measureCompileFreshChildVariants,
} from "../../scripts/lib/compile-cold-runs.mjs";
import { compilerFreshChildPackageSelection } from "../../scripts/lib/compile-cold-child.mjs";

const stub = join(
  dirname(fileURLToPath(import.meta.url)),
  "compile-cold-stub.mjs",
);

test("Compiler Fresh child records one first-workload sample per row and requested run", () => {
  const result = measureCompileFreshChildVariants(
    [
      { id: "a", measure() {} },
      { id: "b", measure() {} },
      { id: "skipped", skip: true },
    ],
    { runs: 3, payload: {}, childScript: stub },
  );

  assert.deepEqual(result.byId.get("a").freshChildRuns, [10, 11, 12]);
  assert.equal(result.byId.get("a").freshChildMedianMs, 11);
  assert.equal(result.byId.get("a").freshChildMinMs, 10);
  assert.equal(result.byId.get("a").freshChildStddevMs, 1);
  assert.equal(result.byId.get("a").freshChildCvPct, 9.1);
  assert.deepEqual(result.byId.get("b").freshChildRuns, [20, 21, 22]);
  assert.equal(result.byId.get("b").freshChildMedianMs, 21);
  assert.equal(result.byId.has("skipped"), false);
  assert.equal(
    result.byId.get("a").freshChildProcessModel,
    "fresh-child-first-timed-row-workload",
  );
  assert.deepEqual(result.byId.get("a").freshChildMetaSamples[0], {
    adapterOptionsHash: "options-a",
    inputCount: 2,
  });
  assert.deepEqual(result.executedOrder, [
    ["a", "b"],
    ["b", "a"],
    ["b", "a"],
  ]);
});

test("a failed fresh child never fabricates a median or retries deterministically", () => {
  const result = measureCompileFreshChildVariants([{ id: "a", measure() {} }], {
    runs: 4,
    payload: { failId: "a" },
    childScript: stub,
  });

  assert.equal(result.byId.get("a").freshChildMedianMs, undefined);
  assert.deepEqual(result.byId.get("a").freshChildRuns, []);
  assert.match(result.byId.get("a").freshChildError, /planted failure/);
  assert.deepEqual(result.executedOrder, [["a"], [], [], []]);
});

test("paired order balances positions when runs are fewer than rows", () => {
  const rows = ["a", "b", "c", "d"];
  const first = freshChildOrder(rows, 0);
  const second = freshChildOrder(rows, 1);
  for (const row of rows) {
    assert.equal(first.indexOf(row) + second.indexOf(row), rows.length - 1);
  }
});

test("a fresh child loads only the package owned by its exact row", () => {
  assert.deepEqual(
    compilerFreshChildPackageSelection("vize-raw-render-batch-vdom", "vdom"),
    {
      vue35: false,
      vue36: false,
      vize: true,
      verter: false,
      fervid: false,
    },
  );
  assert.deepEqual(
    compilerFreshChildPackageSelection("verter-raw-render-vdom", "vdom"),
    {
      vue35: false,
      vue36: false,
      vize: false,
      verter: true,
      fervid: false,
    },
  );
  assert.equal(
    compilerFreshChildPackageSelection(
      "vue-reference-raw-render-vapor",
      "vapor",
    ).vue36,
    true,
  );
  assert.equal(
    compilerFreshChildPackageSelection("vue-reference-raw-render-vdom", "vdom")
      .vue35,
    true,
  );
});
