import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  JSX_VALIDITY_PLANTS,
  JSX_VALIDITY_SUITE_HASH,
  JSX_VALIDITY_SUITE_VERSION,
} from "../../scripts/lib/jsx-validity-plants.mjs";
import {
  applyJsxValidityGates,
  JSX_VALIDITY_ENTRYPOINTS,
  JSX_VALIDITY_JSON_PREFIX,
  runJsxValidityChildren,
} from "../../scripts/lib/jsx-validity-gates.mjs";
import {
  COMPONENT_META_VALIDITY_PLANTS,
  COMPONENT_META_VALIDITY_SUITE_HASH,
  COMPONENT_META_VALIDITY_SUITE_VERSION,
  scoreComponentMetaPlant,
} from "../../scripts/lib/component-meta-validity-plants.mjs";
import {
  applyComponentMetaValidityGates,
  COMPONENT_META_VALIDITY_ENTRYPOINTS,
  COMPONENT_META_VALIDITY_JSON_PREFIX,
  runComponentMetaValidityChildren,
} from "../../scripts/lib/component-meta-validity-gates.mjs";

test("JSX runtime plants are revisioned, unique and behavioural", () => {
  assert.match(JSX_VALIDITY_SUITE_VERSION, /^\d{4}-\d{2}-\d{2}\.\d+$/);
  assert.match(JSX_VALIDITY_SUITE_HASH, /^[a-f0-9]{64}$/);
  assert.ok(JSX_VALIDITY_PLANTS.length >= 8);
  assert.equal(
    new Set(JSX_VALIDITY_PLANTS.map((plant) => plant.id)).size,
    JSX_VALIDITY_PLANTS.length,
  );
  for (const plant of JSX_VALIDITY_PLANTS) {
    assert.equal(typeof plant.source, "string");
    assert.equal(typeof plant.assert, "function");
    assert.ok(plant.coverage.length > 0);
  }
});

test("JSX child runner retains exact-entrypoint PASS/UNKNOWN results", () => {
  const calls = [];
  const report = runJsxValidityChildren({
    spawn(_node, args) {
      const entrypoint = args[args.indexOf("--entrypoint") + 1];
      calls.push(entrypoint);
      const status = entrypoint.includes("vapor") ? "UNKNOWN" : "PASS";
      const payload = {
        entrypoint,
        status,
        plantCount: 1,
        passed: status === "PASS" ? 1 : 0,
        failed: 0,
        unknown: status === "UNKNOWN" ? 1 : 0,
        exactPath: `exact ${entrypoint}`,
        results: [{ id: "plant", status, phase: status === "PASS" ? "runtime" : "not-run" }],
      };
      return {
        status: 0,
        signal: null,
        stdout: `${JSX_VALIDITY_JSON_PREFIX}${JSON.stringify(payload)}\n`,
        stderr: "",
      };
    },
  });
  assert.deepEqual(calls, ["compiler-rs-vdom", "babel-vdom"]);
  assert.equal(report.results["compiler-rs-vdom"].status, "PASS");
  assert.equal(report.results["compiler-rs-vapor"].status, "UNKNOWN");
});

test("JSX UNKNOWN rows are unranked and a failed baseline invalidates its class", () => {
  const rows = [
    {
      id: "vue-babel-plugin-jsx",
      status: "ok",
      throughput: "1 files/s",
      comparisonClass: "jsx-vdom",
      baseline: true,
      notes: "baseline",
    },
    {
      id: "vue-jsx-vapor-rs-vdom",
      status: "ok",
      throughput: "2 files/s",
      comparisonClass: "jsx-vdom",
      notes: "candidate",
    },
  ];
  applyJsxValidityGates(rows, {
    results: {
      "babel-vdom": {
        status: "FAIL",
        plantCount: 1,
        passed: 0,
        results: [{ id: "event", status: "FAIL", phase: "runtime", detail: "wrong" }],
      },
      "compiler-rs-vdom": {
        status: "PASS",
        plantCount: 1,
        passed: 1,
        exactPath: "transform interop",
        results: [{ id: "event", status: "PASS", phase: "runtime" }],
      },
    },
  });
  assert.equal(rows[0].status, "unranked");
  assert.equal(rows[1].status, "unranked");
  assert.match(rows[1].notes, /COMPARISON REFERENCE INVALID/);
});

test("component-meta manifest is the twenty-nine disk-backed cases", () => {
  assert.match(COMPONENT_META_VALIDITY_SUITE_VERSION, /^\d{4}-\d{2}-\d{2}\.\d+$/);
  assert.match(COMPONENT_META_VALIDITY_SUITE_HASH, /^[a-f0-9]{64}$/);
  assert.equal(COMPONENT_META_VALIDITY_PLANTS.length, 29);
  assert.equal(
    new Set(COMPONENT_META_VALIDITY_PLANTS.map((plant) => plant.id)).size,
    COMPONENT_META_VALIDITY_PLANTS.length,
  );
  assert.ok(COMPONENT_META_VALIDITY_PLANTS.every((plant) => plant.source.includes("<template>")));
  assert.ok(COMPONENT_META_VALIDITY_PLANTS.every((plant) => plant.coverage.length > 0));
});

test("component-meta scorer checks named facts but never total member count", () => {
  const base = COMPONENT_META_VALIDITY_PLANTS.find((plant) => plant.id === "basic-props");
  const plant = { ...base, expect: { ...base.expect, minProps: 999 } };
  const score = scoreComponentMetaPlant(
    {
      props: [
        { name: "title", type: "string", required: true },
        { name: "count", type: "number", required: true },
      ],
      events: [],
      slots: [],
      exposed: [],
      source: "neutral",
    },
    plant,
  );
  assert.equal(score.ok, true);
});

test("component-meta child runner retains outcomes and baseline failures unrank candidates", () => {
  const calls = [];
  const report = runComponentMetaValidityChildren({
    spawn(_node, args) {
      const entrypoint = args[args.indexOf("--entrypoint") + 1];
      calls.push(entrypoint);
      const status = entrypoint === "vue-component-meta" ? "FAIL" : "PASS";
      const payload = {
        entrypoint,
        status,
        plantCount: 1,
        passed: status === "PASS" ? 1 : 0,
        failed: status === "FAIL" ? 1 : 0,
        unknown: 0,
        exactPath: `disk ${entrypoint}`,
        results: [
          {
            id: "basic-props",
            status,
            phase: "metadata",
            ...(status === "FAIL" ? { detail: "missing prop" } : {}),
          },
        ],
      };
      return {
        status: 0,
        signal: null,
        stdout: `${COMPONENT_META_VALIDITY_JSON_PREFIX}${JSON.stringify(payload)}\n`,
        stderr: "",
      };
    },
  });
  assert.deepEqual(calls, COMPONENT_META_VALIDITY_ENTRYPOINTS);

  const rows = [
    {
      id: "vue-component-meta",
      status: "ok",
      throughput: "1 files/s",
      baseline: true,
      notes: "vue",
    },
    {
      id: "verter-component-meta",
      status: "ok",
      throughput: "2 files/s",
      notes: "verter",
    },
  ];
  applyComponentMetaValidityGates(rows, report);
  assert.equal(rows[0].status, "unranked");
  assert.equal(rows[1].status, "unranked");
  assert.match(rows[1].notes, /official Vue.*did not pass/);
});

test("generated and project capability plants are wired strictly after timing", () => {
  const jsx = readFileSync(
    new URL("../../scripts/lib/surfaces/jsx-compile.mjs", import.meta.url),
    "utf8",
  );
  const generatedMeta = readFileSync(
    new URL("../../scripts/lib/surfaces/component-meta.mjs", import.meta.url),
    "utf8",
  );
  const projectMeta = readFileSync(
    new URL("../../scripts/lib/surfaces/project-component-meta.mjs", import.meta.url),
    "utf8",
  );
  assert.ok(jsx.indexOf("await measureVariants(") < jsx.indexOf("runJsxValidityChildren()"));
  assert.ok(
    generatedMeta.indexOf("await measureVariants(") <
      generatedMeta.indexOf("runComponentMetaValidityChildren("),
  );
  assert.ok(
    projectMeta.indexOf("await measureVariants(") <
      projectMeta.indexOf("runComponentMetaValidityChildren("),
  );
  assert.match(projectMeta, /PROJECT METADATA EQUIVALENCE remains UNKNOWN/);
  assert.match(projectMeta, /never reads or writes the third-party checkout/);
});
