import { describe, test } from "node:test";
import assert from "node:assert/strict";

import * as compiler35 from "@vue/compiler-sfc";
import * as compiler36 from "@vue/compiler-sfc-36";
import * as fervidNative from "@fervid/napi";
import * as verterNative from "@verter/native";
import * as vizeNative from "@vizejs/native";

import {
  STYLE_PREPROCESSOR_CASES,
  STYLE_PREPROCESSOR_SUITE_HASH,
  assertStylePreprocessorPlant,
  computeStylePreprocessorGates,
  normalizeStylePreprocessorBatchRows,
  preprocessStylePlant,
} from "../../scripts/lib/style-preprocessor-gates.mjs";

async function officialDownstreamArtifacts(plant) {
  const preprocessed = preprocessStylePlant(plant);
  const filename = `/style-preprocessor-gate/${plant.id}.vue`;
  const parsed = compiler35.parse(preprocessed.source, { filename });
  assert.deepEqual(parsed.errors, []);
  const style = parsed.descriptor.styles[0];
  const styleResult = await compiler35.compileStyleAsync({
    source: style.content,
    filename,
    id: "data-v-abc12345",
    scoped: style.scoped,
    isProd: true,
    ...(style.module ? { modules: true } : {}),
  });
  assert.deepEqual(styleResult.errors, []);
  const code =
    parsed.descriptor.script || parsed.descriptor.scriptSetup
      ? compiler35.compileScript(parsed.descriptor, {
          id: "abc12345",
          inlineTemplate: false,
          isProd: true,
        }).content
      : "";
  return { css: styleResult.code, code, modules: styleResult.modules ?? null };
}

describe("Sass/SCSS compiler validity plants", () => {
  test("manifest covers both syntaxes and independent Vue-style features", () => {
    assert.match(STYLE_PREPROCESSOR_SUITE_HASH, /^[a-f0-9]{64}$/);
    assert.equal(STYLE_PREPROCESSOR_CASES.length, 8);
    for (const lang of ["scss", "sass"]) {
      const plants = STYLE_PREPROCESSOR_CASES.filter((plant) => plant.lang === lang);
      assert.deepEqual(
        new Set(plants.map((plant) => plant.oracle)),
        new Set(["nesting-mixin-scoped", "deep-media-scoped", "v-bind-scoped", "css-modules"]),
      );
      assert.ok(plants.every((plant) => plant.source.includes(`lang="${lang}"`)));
    }
  });

  test("the shared pinned Sass pass removes authored preprocessor syntax", () => {
    for (const plant of STYLE_PREPROCESSOR_CASES) {
      const result = preprocessStylePlant(plant);
      assert.ok(result.css.length > 0, plant.id);
      assert.ok(!result.source.includes(`lang="${plant.lang}"`), plant.id);
      assert.doesNotMatch(result.css, /\$[a-z_-][a-z0-9_-]*\s*:/i, plant.id);
      assert.doesNotMatch(result.css, /@mixin|@include/i, plant.id);
    }
  });

  test("relational oracles reject raw Sass, missing scope and mismatched modules", () => {
    const nested = STYLE_PREPROCESSOR_CASES.find(
      (plant) => plant.id === "scss-nesting-mixin-scoped",
    );
    assert.throws(
      () => assertStylePreprocessorPlant(nested, { css: nested.style }),
      /Sass variable declaration/,
    );
    assert.throws(
      () =>
        assertStylePreprocessorPlant(nested, {
          css: ".pre-scss-host { padding: 7px } .pre-scss-host > .pre-scss-child { color: red }",
        }),
      /scope-rewritten/,
    );

    const modules = STYLE_PREPROCESSOR_CASES.find((plant) => plant.id === "scss-css-modules");
    assert.throws(
      () =>
        assertStylePreprocessorPlant(modules, {
          css: ".foo_deadbeef { color: #040506 }",
          modules: { foo: "foo_different" },
        }),
      /does not match emitted CSS/,
    );
  });

  test("v-bind oracle rejects expressions found only in CSS-variable keys", () => {
    const plant = STYLE_PREPROCESSOR_CASES.find(
      (candidate) => candidate.id === "scss-v-bind-scoped",
    );
    assert.throws(
      () =>
        assertStylePreprocessorPlant(plant, {
          css: String.raw`.pre-scss-bind > .bind-target[data-v-abc]{color:var(--abc-tone);margin-left:var(--abc-theme\.gap)}`,
          js: `_useCssVars(() => ({ "abc-tone": wrong, "abc-theme.gap": nope }))`,
        }),
      /was not registered from tone/,
    );
  });

  test("CSS Modules oracle rejects malformed colors and missing nested hover work", () => {
    const plant = STYLE_PREPROCESSOR_CASES.find((candidate) => candidate.id === "scss-css-modules");
    assert.throws(
      () =>
        assertStylePreprocessorPlant(plant, {
          css: ".foo_hash{color:4,5,6 garbage}",
          modules: { foo: "foo_hash" },
        }),
      /did not preserve color/,
    );
    assert.throws(
      () =>
        assertStylePreprocessorPlant(plant, {
          css: ".foo_hash{color:rgb(4,5,6)}",
          modules: { foo: "foo_hash" },
        }),
      /nested :hover selector rule was not emitted/,
    );
  });

  test("deep/media oracle requires plant-specific width, hover, and declaration", () => {
    const plant = STYLE_PREPROCESSOR_CASES.find(
      (candidate) => candidate.id === "scss-deep-media-scoped",
    );
    assert.throws(
      () =>
        assertStylePreprocessorPlant(plant, {
          css: "@media (min-width:2px){.pre-scss-deep[data-v-abc]:hover .pre-scss-external{color:red}}",
        }),
      /did not resolve inside @media/,
    );
    assert.throws(
      () =>
        assertStylePreprocessorPlant(plant, {
          css: "@media (min-width:1px){.pre-scss-deep[data-v-abc]:hover .pre-scss-external{}}",
        }),
      /did not preserve color/,
    );
    assert.throws(
      () =>
        assertStylePreprocessorPlant(plant, {
          css: "@media (min-width:1px){.pre-scss-deep[data-v-abc] .pre-scss-external{color:red}}",
        }),
      /:hover was not preserved/,
    );
  });

  test("nesting/mixin oracle requires the nested child declaration", () => {
    const plant = STYLE_PREPROCESSOR_CASES.find(
      (candidate) => candidate.id === "scss-nesting-mixin-scoped",
    );
    assert.throws(
      () =>
        assertStylePreprocessorPlant(plant, {
          css: ".pre-scss-host[data-v-abc]{padding:7px}.pre-scss-host > .pre-scss-child[data-v-abc]{}",
        }),
      /did not preserve border-color/,
    );
  });

  test("batch normalization rejects aggregate, nested, and attribution failures", () => {
    const inputs = [{ path: "/a.vue" }, { path: "/b.vue" }];
    assert.throws(
      () => normalizeStylePreprocessorBatchRows({ failedCount: 1, results: [{}, {}] }, inputs),
      /failed 1\/2/,
    );
    assert.throws(
      () =>
        normalizeStylePreprocessorBatchRows(
          { errors: ["aggregate error"], results: [{}, {}] },
          inputs,
        ),
      /top-level errors: aggregate error/,
    );
    assert.throws(
      () =>
        normalizeStylePreprocessorBatchRows(
          { results: [{ path: "/b.vue" }, { path: "/a.vue" }] },
          inputs,
        ),
      /path mismatch/,
    );
    assert.throws(
      () =>
        normalizeStylePreprocessorBatchRows(
          {
            results: [
              { path: "/a.vue", result: { errors: ["nested failure"] } },
              { path: "/b.vue" },
            ],
          },
          inputs,
        ),
      /nested result 0 returned errors: nested failure/,
    );
    assert.deepEqual(
      normalizeStylePreprocessorBatchRows(
        {
          items: [
            { path: "/a.vue", result: { css: "a" } },
            { path: "/b.vue", result: { css: "b" } },
          ],
        },
        inputs,
      ).map((row) => row.css),
      ["a", "b"],
    );
  });

  test("an upgraded authored-language API self-clears from FAIL to PASS per plant", async () => {
    const artifacts = new Map();
    for (const plant of STYLE_PREPROCESSOR_CASES) {
      artifacts.set(plant.id, await officialDownstreamArtifacts(plant));
    }
    const upgradedVize = {
      compileSfc(_source, options) {
        const id = options.filename
          .split("/")
          .at(-1)
          .replace(/\.vue$/, "");
        return artifacts.get(id);
      },
    };
    const gates = await computeStylePreprocessorGates({
      compiler35,
      compiler36: null,
      vizeNative: upgradedVize,
      verterNative: { error: "not part of this test" },
      fervidNative: { error: "not part of this test" },
      makeVerterHost: () => {
        throw new Error("not part of this test");
      },
    });
    const exact = gates.exactEntrypoints["@vizejs/native:compileSfc"];
    assert.equal(exact.status, "PASS");
    assert.deepEqual(exact.passed.sort(), STYLE_PREPROCESSOR_CASES.map(({ id }) => id).sort());
  });

  test("installed entrypoints report exact preprocessing separately from downstream adapters", async () => {
    const gates = await computeStylePreprocessorGates({
      compiler35,
      compiler36,
      vizeNative,
      verterNative,
      fervidNative,
      makeVerterHost: (config) => new verterNative.VerterHost(config),
    });
    const required = STYLE_PREPROCESSOR_CASES.map((plant) => plant.id).sort();

    for (const layer of [gates.exactEntrypoints, gates.sharedSassAdapter]) {
      for (const gate of Object.values(layer)) {
        assert.equal(gate.plantCount, required.length);
        assert.deepEqual(
          gate.results.map((result) => result.id).sort(),
          required,
          `${gate.exactPath}: every plant must receive a verdict`,
        );
        assert.ok(["PASS", "FAIL", "UNKNOWN"].includes(gate.status));
      }
    }

    // compiler-sfc directly accepts SCSS and orchestrates the installed Sass
    // package on the exact compileStyleAsync path. The indented-Sass outcome
    // remains per-plant so a future Vue fix self-clears here.
    for (const name of ["@vue/compiler-sfc", "@vue/compiler-sfc-36"]) {
      const exact = gates.exactEntrypoints[name];
      assert.ok(
        STYLE_PREPROCESSOR_CASES.filter((plant) => plant.lang === "scss").every((plant) =>
          exact.passed.includes(plant.id),
        ),
        `${name}: exact SCSS plants must pass`,
      );
      assert.equal(gates.sharedSassAdapter[name].status, "PASS");
    }

    // The installed standalone native type surfaces expose no Sass option.
    // This is a proved unsupported capability (FAIL), not semantic UNKNOWN and
    // not a PASS borrowed from the shared external adapter.
    for (const name of [
      "@vizejs/native:compileSfc",
      "@vizejs/native:compileSfcBatchWithResults",
      "@verter/native",
      "@fervid/napi:compileSync",
      "@fervid/napi:compileAsync",
    ]) {
      assert.equal(gates.exactEntrypoints[name]?.status, "FAIL", name);
      assert.equal(gates.exactEntrypoints[name]?.passed.length, 0, name);
    }
  });
});
