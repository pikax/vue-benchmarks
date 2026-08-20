/**
 * Guards for the component-meta CONCURRENT (stress) class.
 *
 * The class exists to answer "what does this corpus cost when every request is
 * in flight at once", and three things have to hold for that answer to be
 * readable: it must never share a ratio with the sequential class, the official
 * Vue row must carry the disclosure that a synchronous API cannot overlap
 * anything, and each row must be gated through the entry point it actually
 * calls rather than inheriting a quieter row's verdict.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  applyComponentMetaValidityGates,
  COMPONENT_META_ALL_ENTRYPOINTS,
  COMPONENT_META_CONCURRENT_ENTRYPOINTS,
  COMPONENT_META_VALIDITY_ENTRYPOINTS,
  runComponentMetaValidityChildren,
} from "../../scripts/lib/component-meta-validity-gates.mjs";
import {
  buildComponentMetaVariants,
  componentMetaFreshChildPackageSelection,
} from "../../scripts/lib/surfaces/component-meta.mjs";

const unavailable = { error: "not selected in this fresh child" };

/** Enough of each package's shape for row construction; nothing is called. */
function fakePackages({ batch = true } = {}) {
  class ComponentMetaSession {
    getComponentMeta() {}
  }
  if (batch) ComponentMetaSession.prototype.getComponentMetaBatch = () => {};
  return {
    vueMeta: { mod: { createChecker: () => ({ getComponentMeta: () => ({}) }) } },
    verterMetaPkg: {
      mod: {
        openComponentMetaSession: () => {},
        evictComponentMetaSession: () => {},
        ComponentMetaSession,
      },
    },
    vizeNative: unavailable,
  };
}

function build(options) {
  return buildComponentMetaVariants({
    metaDir: "/tmp/meta",
    files: ["A.vue", "B.vue"],
    ...fakePackages(options),
  });
}

test("the concurrent class is separate from the sequential one and states how each row is issued", () => {
  const byId = new Map(build().map((v) => [v.id, v]));

  assert.equal(byId.get("vue-component-meta").comparisonClass, "component-public-api");
  assert.equal(byId.get("verter-component-meta").comparisonClass, "component-public-api");

  const concurrent = [
    "vue-component-meta-concurrent",
    "verter-component-meta-concurrent",
    "verter-component-meta-batch",
  ];
  for (const id of concurrent) {
    const row = byId.get(id);
    assert.ok(row, `${id} missing`);
    assert.equal(row.comparisonClass, "component-public-api-concurrent");
    // Ratios never cross a class boundary, so a shared class id between the
    // sequential and concurrent rows is the one thing that would silently
    // rank a batch call against a one-at-a-time loop.
    assert.notEqual(row.comparisonClass, byId.get("verter-component-meta").comparisonClass);
    assert.ok(row.threading, `${id} must state its threading model`);
    assert.ok(row.invocation, `${id} must state how it is invoked`);
    assert.equal(row.artifactLabel, "Meta members");
  }

  // Each concurrent row is gated through the entry point it calls.
  assert.deepEqual(
    concurrent.map((id) => byId.get(id).validityEntrypoint),
    COMPONENT_META_CONCURRENT_ENTRYPOINTS.slice(),
  );
  // The sequential rows keep the default (verdict looked up by row id).
  assert.equal(byId.get("vue-component-meta").validityEntrypoint, undefined);
});

test("the official Vue concurrent row discloses that a synchronous API cannot overlap", () => {
  const row = build().find((v) => v.id === "vue-component-meta-concurrent");
  // Without this the row reads as a parallel measurement of the official tool,
  // and the ratio beside it reads as a parallel-throughput claim.
  assert.match(row.notes, /SYNCHRONOUS/);
  assert.match(row.notes, /never as a parallel result/);
  assert.equal(row.baseline, true, "the class needs its own official reference");
});

test("the batch row appears only when the installed package ships the batch method", () => {
  const withBatch = build({ batch: true }).map((v) => v.id);
  const withoutBatch = build({ batch: false }).map((v) => v.id);

  assert.ok(withBatch.includes("verter-component-meta-batch"));
  // No hand-rolled substitute: a row measured through an API the package does
  // not export is not that package's number.
  assert.ok(!withoutBatch.includes("verter-component-meta-batch"));
  assert.ok(withoutBatch.includes("verter-component-meta-concurrent"));
});

test("a fresh child still loads exactly one package for a concurrent row", () => {
  assert.deepEqual(componentMetaFreshChildPackageSelection("vue-component-meta-concurrent"), {
    vueComponentMeta: true,
    verterComponentMeta: false,
    vizeNative: false,
  });
  for (const id of ["verter-component-meta-concurrent", "verter-component-meta-batch"]) {
    assert.deepEqual(componentMetaFreshChildPackageSelection(id), {
      vueComponentMeta: false,
      verterComponentMeta: true,
      vizeNative: false,
    });
  }
});

test("the plant runner spawns exactly the entry points it was asked for", () => {
  const calls = [];
  const spawn = (_node, args) => {
    calls.push(args[args.indexOf("--entrypoint") + 1]);
    return { status: 1, signal: null, stdout: "", stderr: "child not run in this test" };
  };

  runComponentMetaValidityChildren({ spawn });
  // Default stays the two scalar entry points, so project-component-meta does
  // not spawn three children whose verdicts nothing reads.
  assert.deepEqual(calls, COMPONENT_META_VALIDITY_ENTRYPOINTS.slice());

  calls.length = 0;
  runComponentMetaValidityChildren({ spawn, entrypoints: COMPONENT_META_ALL_ENTRYPOINTS });
  assert.deepEqual(calls, COMPONENT_META_ALL_ENTRYPOINTS.slice());
  assert.equal(COMPONENT_META_ALL_ENTRYPOINTS.length, 5);
});

test("a row's verdict comes from the entry point it names, not from its id", () => {
  const rows = [
    {
      id: "verter-component-meta-batch",
      validityEntrypoint: "verter-component-meta-batch",
      comparisonClass: "component-public-api-concurrent",
      status: "ok",
      throughput: "2 files/s",
      notes: "batch",
    },
    {
      id: "verter-component-meta-unwired",
      comparisonClass: "component-public-api-concurrent",
      status: "ok",
      throughput: "2 files/s",
      notes: "unwired",
    },
  ];
  applyComponentMetaValidityGates(rows, {
    results: {
      "verter-component-meta-batch": {
        status: "PASS",
        passed: 29,
        plantCount: 29,
        exactPath: "one getComponentMetaBatch call",
        results: [],
      },
    },
  });

  assert.equal(rows[0].status, "ok");
  assert.match(rows[0].notes, /one getComponentMetaBatch call/);
  // A row naming no entry point that ran is UNKNOWN, never quietly credited
  // with the nearest available verdict.
  assert.equal(rows[1].status, "unranked");
  assert.match(rows[1].notes, /UNKNOWN/);
});

test("a failed reference invalidates its own class and leaves the other one alone", () => {
  const rows = [
    {
      id: "vue-component-meta",
      comparisonClass: "component-public-api",
      baseline: true,
      status: "ok",
      throughput: "1 files/s",
      notes: "vue seq",
    },
    {
      id: "verter-component-meta",
      comparisonClass: "component-public-api",
      status: "ok",
      throughput: "2 files/s",
      notes: "verter seq",
    },
    {
      id: "vue-component-meta-concurrent",
      validityEntrypoint: "vue-component-meta-concurrent",
      comparisonClass: "component-public-api-concurrent",
      baseline: true,
      status: "ok",
      throughput: "3 files/s",
      notes: "vue conc",
    },
    {
      id: "verter-component-meta-concurrent",
      validityEntrypoint: "verter-component-meta-concurrent",
      comparisonClass: "component-public-api-concurrent",
      status: "ok",
      throughput: "4 files/s",
      notes: "verter conc",
    },
  ];
  const pass = { status: "PASS", passed: 29, plantCount: 29, exactPath: "disk", results: [] };
  applyComponentMetaValidityGates(rows, {
    results: {
      // The sequential reference fails; every concurrent entry point passes.
      "vue-component-meta": {
        status: "FAIL",
        passed: 27,
        plantCount: 29,
        results: [{ id: "external-props-import", status: "FAIL", detail: "props.name: missing" }],
      },
      "verter-component-meta": pass,
      "vue-component-meta-concurrent": pass,
      "verter-component-meta-concurrent": pass,
    },
  });

  assert.equal(rows[0].status, "unranked", "the failing reference is unranked by its own gate");
  assert.equal(rows[1].status, "unranked", "its class loses its denominator");
  assert.match(rows[1].notes, /COMPARISON REFERENCE INVALID/);
  // The concurrent class has its own reference and it passed. A ratio that
  // never crossed the class boundary cannot have been invalidated by a row on
  // the other side of it.
  assert.equal(rows[2].status, "ok");
  assert.equal(rows[3].status, "ok");
  assert.doesNotMatch(rows[3].notes, /COMPARISON REFERENCE INVALID/);
});
