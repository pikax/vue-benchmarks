import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { format } from "prettier";
import { checkMetaTypeFacts } from "../confirm/lib/meta-type-facts.mjs";
import {
  STYLE_FEATURE_CASES,
  assertStyleFeature,
  compileVueStyleFeature,
} from "../../scripts/lib/style-feature-gates.mjs";
import {
  FORMAT_VALIDITY_PLANTS,
  judgeFormattedPlant,
} from "../../scripts/lib/format-validity-plants.mjs";
import { cssProjection } from "../../scripts/lib/css-semantics.mjs";
import { COMPILE_VALIDITY_PLANTS } from "../../scripts/lib/compile-validity-plants.mjs";
import { JSX_VALIDITY_PLANTS } from "../../scripts/lib/jsx-validity-plants.mjs";
import { applyCompileSemanticGates } from "../../scripts/lib/surfaces/compile.mjs";
import { compileValidityConfigKey } from "../../scripts/lib/compile-validity-gates.mjs";
import { ensureDom } from "../confirm/lib/dom.mjs";
import { loadCompiledComponent } from "../confirm/lib/compile-to-component.mjs";

const require = createRequire(import.meta.url);
const compiler = require("@vue/compiler-sfc");

test("metadata facts require all payload fields, parameter positions and optionality", () => {
  const facts = {
    parameters: [{ type: "number" }, { properties: { shift: { type: "boolean" } } }],
  };
  assert.deepEqual(checkMetaTypeFacts("[id: number, meta: { shift: boolean }]", facts), []);
  assert.deepEqual(checkMetaTypeFacts("(id: number, meta: { shift: boolean }) => void", facts), []);
  for (const bad of [
    "[id: number]",
    "[id: number, meta: { shift: string }]",
    "[meta: { shift: boolean }, id: number]",
    "[id: number, meta: { shift?: boolean }]",
    "[id: number, meta: any]",
    "any",
  ]) {
    assert.ok(checkMetaTypeFacts(bad, facts).length, bad);
  }
  const optional = { parameters: [{ type: "boolean", optional: true }] };
  assert.deepEqual(checkMetaTypeFacts("[value?: boolean | undefined]", optional), []);
  assert.ok(checkMetaTypeFacts("[value: boolean | undefined]", optional).length);
  assert.ok(
    checkMetaTypeFacts("{ open: string }", { properties: { open: { type: "boolean" } } }).length,
  );
});

test("all official Vue style plants satisfy selector and declaration oracles", async () => {
  for (const plant of STYLE_FEATURE_CASES)
    assertStyleFeature(plant.id, await compileVueStyleFeature(compiler, plant));
});

test("CSS oracle rejects value changes, dropped/reordered blocks, cascade and wrapper mutations", async () => {
  const simple = STYLE_FEATURE_CASES.find((plant) => plant.id === "scoped");
  const scoped = await compileVueStyleFeature(compiler, simple);
  assert.throws(
    () => assertStyleFeature(simple.id, { ...scoped, css: scoped.css.replace("red", "blue") }),
    /declarations/,
  );
  const plant = STYLE_FEATURE_CASES.find((plant) => plant.id === "multiple-style-blocks");
  const good = await compileVueStyleFeature(compiler, plant);
  const cut = good.css.indexOf(".tail");
  for (const css of [
    good.css.slice(0, cut),
    good.css.slice(cut) + good.css.slice(0, cut),
    good.css.replace("!important", ""),
    good.css.replace("color:red;", ""),
    good.css.replace("min-width:1px", "min-width:2px"),
  ]) {
    assert.throws(
      () => assertStyleFeature(plant.id, { ...good, css }),
      /declarations|style blocks/,
    );
  }
  assert.notDeepEqual(cssProjection('.a{content:"a  b"}'), cssProjection('.a{content:"a b"}'));
  assert.notDeepEqual(cssProjection(".a .b{color:red}"), cssProjection(".a.b{color:red}"));
});

test("formatter oracle rejects CSS, JSON and opaque payload mutations after a valid format", async () => {
  const plant = FORMAT_VALIDITY_PLANTS.find(
    (plant) => plant.id === "css-and-custom-block-semantics",
  );
  const formatted = await format(plant.source, { parser: "vue" });
  for (const mutate of [
    (s) => s.replace("color: red", "color: green"),
    (s) => s.replace(/<style>[\s\S]*?<\/style>/, ""),
    (s) => s.replace("min-width: 1px", "min-width: 2px"),
    (s) => s.replace("keep  two spaces", "keep two spaces"),
    (s) => s.replace('"count": 2', '"count": 3'),
    (s) => s.replace('"one", "two"', '"two", "one"'),
    (s) => s.replace("KEEP  OPAQUE", "KEEP OPAQUE"),
  ]) {
    const first = mutate(formatted);
    assert.notEqual(first, formatted, "mutation control must change the formatter result");
    assert.equal(
      judgeFormattedPlant({
        plant,
        original: plant.source,
        first,
        second: first,
        parse: compiler.parse,
      }).ok,
      false,
    );
  }
});

async function assertRuntime(plant, code) {
  ensureDom();
  const { mount } = await import("@vue/test-utils");
  const loaded = await loadCompiledComponent(code, plant.id);
  try {
    await plant.assert({ mount, component: loaded.component });
  } finally {
    loaded.cleanup();
  }
}

test("reactive destructure shadowing detects a local parameter rewritten to the outer prop", async () => {
  const plant = COMPILE_VALIDITY_PLANTS.find(
    (plant) => plant.id === "reactive-props-destructure-shadowing",
  );
  const compile = (source) =>
    compiler.compileScript(compiler.parse(source).descriptor, {
      id: "shadow",
      inlineTemplate: true,
    }).content;
  await assertRuntime(plant, compile(plant.source));
  const bad = plant.source.replace(
    "function local(label) { return label }",
    "function local(label) { return 'outer' }",
  );
  assert.notEqual(bad, plant.source);
  await assert.rejects(assertRuntime(plant, compile(bad)), /shadow|parameter/);
});

test("JSX collision probe rejects losing spread data or later explicit handlers", async () => {
  const plant = JSX_VALIDITY_PLANTS.find(
    (plant) => plant.id === "spread-collisions-update-removal",
  );
  const babel = require("@babel/core");
  const plugin = require("@vue/babel-plugin-jsx");
  const compile = (source) =>
    babel.transformSync(source, {
      filename: "Plant.jsx",
      plugins: [plugin.default ?? plugin],
      configFile: false,
      babelrc: false,
    }).code;
  for (const bad of [
    plant.source.replace("{...props.rest}", ""),
    plant.source.replace("onClick={props.after}", ""),
  ]) {
    assert.notEqual(bad, plant.source);
    await assert.rejects(assertRuntime(plant, compile(bad)));
  }
});

test("map-on ranking requires exact workload evidence and preserves independent failures", () => {
  const configuration = { target: "vdom", env: "production", sourceMap: true };
  const key = compileValidityConfigKey(configuration);
  const semantics = {
    matrix: {
      [key]: {
        entrypoints: { "vue-3.5": { status: "PASS", passed: 1, plantCount: 1, exactPath: "test" } },
      },
    },
  };
  const makeRow = (comparisonClass) => ({
    id: "vue",
    package: "@vue/compiler-sfc",
    comparisonClass,
    status: "ok",
    notes: "",
    baseline: true,
  });
  const maps = {
    matrix: {
      [key]: {
        entrypoints: {
          "vue-3.5": { workloads: { raw: { status: "PASS", passed: 2, plantCount: 2 } } },
        },
      },
    },
  };
  const raw = makeRow("raw-render-batch"),
    styles = makeRow("sfc-with-style");
  applyCompileSemanticGates([raw, styles], semantics, configuration, maps);
  assert.equal(raw.status, "ok");
  assert.equal(styles.status, "unranked");
  const failed = { ...makeRow("raw-render-batch"), status: "unranked", unranked: true };
  applyCompileSemanticGates([failed], semantics, configuration, maps);
  assert.equal(failed.status, "unranked");
});

test("confirmation runs shared new runtime/format/lint/style probes", () => {
  const source = (suite) =>
    readFileSync(new URL(`../confirm/suites/${suite}.mjs`, import.meta.url), "utf8");
  assert.match(source("format"), /FORMAT_VALIDITY_PLANTS\.map/);
  assert.match(source("format"), /judgeFormattedPlant/);
  assert.match(source("compile"), /plant\.confirmation/);
  assert.match(source("compile"), /confirmStyleFeatures/);
  assert.match(source("jsx-compile"), /runtimeOnly/);
  assert.match(source("lint"), /mutating-props-shadowing/);
});
