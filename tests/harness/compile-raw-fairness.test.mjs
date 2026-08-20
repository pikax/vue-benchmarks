import { describe, test } from "node:test";
import assert from "node:assert/strict";
import * as compiler from "@vue/compiler-sfc";
import * as compiler36 from "@vue/compiler-sfc-36";
import * as vizeNative from "@vizejs/native";
import * as verterNative from "@verter/native";
import * as fervidNative from "@fervid/napi";

import {
  applyCodegenGates,
  applyCompileSemanticGates,
  applyStyleCorrectnessGates,
  compileCellSourceSalts,
  computeStyleCorrectnessGates,
  materializeStyleSfcCorpus,
  materializeRawRenderCorpus,
  prepareStyleSfcCorpus,
  prepareRawRenderCorpus,
  STYLE_FEATURE_CASES,
} from "../../scripts/lib/surfaces/compile.mjs";
import {
  applySingleCompileValidity,
  uniquifySfc,
} from "../../scripts/bench-compile-single.mjs";
import {
  assertOnlyAllowedFervidDiagnostics,
  isAllowedFervidDiagnostic,
} from "../../scripts/lib/fervid-diagnostics.mjs";
import { assertStyleFeature } from "../../scripts/lib/style-feature-gates.mjs";

describe("compile raw render comparison corpus", () => {
  const files = [
    {
      path: "/fixture/Comp.vue",
      filename: "Comp.vue",
      source: `<template><div>{{ value }}</div></template>
<script setup lang="ts">const value: string = "ok"</script>
<style scoped>.x { color: red }</style>`,
    },
  ];

  test("removes styles from both compiler inputs and revises script/template every pass", () => {
    const prepared = prepareRawRenderCorpus(files, compiler);
    assert.equal(prepared.length, 1);
    assert.ok(!prepared[0].source.includes("<style"));

    const warm = materializeRawRenderCorpus(prepared, {
      phase: "warmup",
      iteration: 0,
    });
    const first = materializeRawRenderCorpus(prepared, {
      phase: "measure",
      iteration: 0,
    });
    const second = materializeRawRenderCorpus(prepared, {
      phase: "measure",
      iteration: 1,
    });

    assert.notEqual(warm[0].source, first[0].source);
    assert.notEqual(first[0].source, second[0].source);
    assert.equal(
      warm[0].source.length,
      first[0].source.length,
      "revisions stay fixed-width",
    );
    assert.equal(
      first[0].source.length,
      second[0].source.length,
      "work size cannot drift by run",
    );
    assert.match(
      first[0].source,
      /<template><!--vue-bench-raw:00000000:m0000000000-->/,
    );
    assert.match(
      first[0].source,
      /<script setup lang="ts">\/\*vue-bench-raw:00000000:m0000000000\*\//,
    );
    assert.ok(!first[0].source.includes("<style"));
  });

  test("does not mutate the prepared source or prior pass objects", () => {
    const prepared = prepareRawRenderCorpus(files, compiler);
    const before = prepared[0].source;
    const first = materializeRawRenderCorpus(prepared, {
      phase: "measure",
      iteration: 0,
    });
    materializeRawRenderCorpus(prepared, { phase: "measure", iteration: 1 });

    assert.equal(prepared[0].source, before);
    assert.match(first[0].source, /m0000000000/);
    assert.ok(!first[0].source.includes("m0000000001"));
  });

  test("fresh-child samples use a distinct fixed-width revision namespace", () => {
    const prepared = prepareRawRenderCorpus(files, compiler);
    const fresh = materializeRawRenderCorpus(prepared, {
      phase: "fresh-child",
      iteration: 2,
    });
    const warm = materializeRawRenderCorpus(prepared, {
      phase: "warmup",
      iteration: 2,
    });
    const measured = materializeRawRenderCorpus(prepared, {
      phase: "measure",
      iteration: 2,
    });

    assert.match(fresh[0].source, /:f0000000002/);
    assert.match(warm[0].source, /:w0000000002/);
    assert.match(measured[0].source, /:m0000000002/);
    assert.equal(fresh[0].source.length, warm[0].source.length);
    assert.equal(warm[0].source.length, measured[0].source.length);
    assert.notEqual(fresh[0].source, measured[0].source);
  });

  test("compile-single keeps failed and Vapor-unknown validity visible but unranked", () => {
    const suites = [
      {
        target: "vdom",
        env: "production",
        firstCalls: [
          { tool: "Vue", id: "vue-3.5" },
          { tool: "Vize", id: "vize" },
        ],
        rows: [
          { tool: "Vue", status: "ok", notes: "" },
          { tool: "Vize", status: "ok", notes: "" },
        ],
      },
      {
        target: "vapor",
        env: "production",
        firstCalls: [{ tool: "Vue Vapor", id: "vue-3.6" }],
        rows: [{ tool: "Vue Vapor", status: "ok", notes: "" }],
      },
    ];
    const gate = (status) => ({
      status,
      passed: status === "PASS" ? 19 : 0,
      plantCount: 19,
    });
    applySingleCompileValidity(suites, {
      matrix: {
        "vdom/production/source-map-off": {
          entrypoints: { "vue-3.5": gate("PASS"), "vize-single": gate("FAIL") },
        },
        "vapor/production/source-map-off": {
          entrypoints: { "vue-3.6": gate("UNKNOWN") },
        },
      },
    });
    assert.equal(suites[0].rows[0].unranked, undefined);
    assert.equal(suites[0].rows[1].unranked, true);
    assert.match(suites[0].rows[1].notes, /vize-single validity is FAIL/);
    assert.equal(suites[1].rows[0].unranked, true);
    assert.match(
      suites[1].rows[0].notes,
      /official vue-3\.6 reference validity is UNKNOWN/,
    );
  });

  test("cell salt prevents cross-cell source-cache reuse without changing length", () => {
    const prepared = prepareRawRenderCorpus(files, compiler);
    const vdom = materializeRawRenderCorpus(prepared, {
      phase: "measure",
      iteration: 0,
      cellSalt: "11111111",
    });
    const vapor = materializeRawRenderCorpus(prepared, {
      phase: "measure",
      iteration: 0,
      cellSalt: "22222222",
    });
    assert.notEqual(vdom[0].source, vapor[0].source);
    assert.equal(vdom[0].source.length, vapor[0].source.length);
  });

  test("official context and candidate raw use isolated namespaces while candidates match", () => {
    const prepared = prepareRawRenderCorpus(files, compiler);
    const salts = compileCellSourceSalts("vdom-prod-smoff");
    assert.equal(salts.officialContext.length, 8);
    assert.equal(salts.candidateRaw.length, 8);
    assert.notEqual(salts.officialContext, salts.candidateRaw);

    const pass = { phase: "measure", iteration: 0 };
    const official = materializeRawRenderCorpus(prepared, {
      ...pass,
      cellSalt: salts.officialContext,
    });
    const candidate = materializeRawRenderCorpus(prepared, {
      ...pass,
      cellSalt: salts.candidateRaw,
    });
    const vueInputs = candidate.map((file) => ({ source: file.source }));
    const vizeInputs = candidate.map((file) => ({ source: file.source }));
    const verterInputs = candidate.map((file) => ({ source: file.source }));

    assert.notEqual(official[0].source, candidate[0].source);
    assert.equal(official[0].source.length, candidate[0].source.length);
    assert.deepEqual(
      vueInputs.map((input) => input.source),
      vizeInputs.map((input) => input.source),
    );
    assert.deepEqual(
      vizeInputs.map((input) => input.source),
      verterInputs.map((input) => input.source),
      "Vue/Vize/Verter candidate rows must receive byte-identical bodies",
    );
  });

  test("single-file revisions touch the outer template and every script block", () => {
    const source = `<template><div><template v-if="ok">nested</template></div></template>
<script>export default {}</script>
<script setup>const ok = true</script>`;
    const first = uniquifySfc(source, 1);
    const second = uniquifySfc(source, 2);

    assert.notEqual(first, second);
    assert.equal(
      first.length,
      second.length,
      "fixed-width revisions keep work size stable",
    );
    assert.equal(
      first.match(/\/\*bench-n:00000000-0000000001\*\//g)?.length,
      2,
    );
    assert.match(
      first,
      /nested<\/template><\/div><!--bench-n:00000000-0000000001-->/,
    );
    assert.doesNotMatch(
      first,
      /nested<!--bench-n:/,
      "nested template content is unchanged",
    );
  });
});

describe("compile validity gate policy", () => {
  test("missing and unmeasured mandatory codegen gates cannot rank", () => {
    const missing = [{ id: "candidate", package: "candidate", notes: "" }];
    applyCodegenGates(missing, {});
    assert.equal(missing[0].unranked, true);
    assert.match(missing[0].notes, /VALIDITY UNKNOWN/);

    const unmeasured = [{ id: "candidate", package: "candidate", notes: "" }];
    applyCodegenGates(unmeasured, {
      candidate: { ok: false, unmeasured: true, firstError: "probe timed out" },
    });
    assert.equal(unmeasured[0].unranked, true);
    assert.match(unmeasured[0].notes, /probe timed out/);
  });

  test("a post-timing style failure preserves time but changes status and throughput", () => {
    const rows = [
      {
        id: "vize-full-sfc-batch-vdom-production-smoff",
        package: "@vizejs/native",
        comparisonClass: "sfc-with-style",
        notes: "",
        status: "ok",
        throughput: "123 files/s",
        medianMs: 1.25,
      },
    ];
    applyStyleCorrectnessGates(rows, {
      "@vizejs/native:compileSfcBatchWithResults": {
        ok: false,
        error: "slotted selector is wrong",
      },
    });
    assert.equal(rows[0].status, "unranked");
    assert.equal(rows[0].throughput, "n/a");
    assert.equal(rows[0].medianMs, 1.25, "diagnostic timing remains visible");
  });

  test("a failed Vue semantic denominator invalidates candidate ratios", () => {
    const rows = [
      {
        id: "vue-reference-raw-render-vdom-production-smoff",
        package: "@vue/compiler-sfc",
        comparisonClass: "raw-render-batch",
        baseline: true,
        notes: "",
        status: "ok",
        throughput: "10 files/s",
      },
      {
        id: "vize-raw-render-batch-vdom-production-smoff",
        package: "@vizejs/native",
        comparisonClass: "raw-render-batch",
        notes: "",
        status: "ok",
        throughput: "20 files/s",
      },
    ];
    const vueFailure = {
      status: "FAIL",
      passed: 1,
      plantCount: 2,
      results: [
        { id: "good", status: "PASS", phase: "runtime" },
        { id: "bad", status: "FAIL", phase: "runtime", detail: "wrong DOM" },
      ],
    };
    const candidatePass = {
      status: "PASS",
      passed: 2,
      plantCount: 2,
      exactPath: "one real batch call",
      results: [],
    };
    applyCompileSemanticGates(
      rows,
      {
        matrix: {
          "vdom/production/source-map-off": {
            entrypoints: {
              "vue-3.5": vueFailure,
              "vize-batch": candidatePass,
            },
          },
        },
      },
      { target: "vdom", env: "production", sourceMap: false },
    );

    assert.equal(rows[0].status, "unranked");
    assert.equal(rows[1].status, "unranked");
    assert.match(rows[1].notes, /COMPARISON REFERENCE INVALID/);
  });

  test("map presence cannot rank before planted mapping traces exist", () => {
    const rows = [
      {
        id: "vue-reference-raw-render-vdom-production-smon",
        package: "@vue/compiler-sfc",
        comparisonClass: "raw-render-batch",
        baseline: true,
        notes: "",
        status: "ok",
        throughput: "10 files/s",
      },
    ];
    applyCompileSemanticGates(
      rows,
      {
        matrix: {
          "vdom/production/source-map-on": {
            entrypoints: {
              "vue-3.5": {
                status: "PASS",
                passed: 1,
                plantCount: 1,
                exactPath: "composed Vue path",
                results: [{ id: "runtime", status: "PASS" }],
              },
            },
          },
        },
      },
      { target: "vdom", env: "production", sourceMap: true },
    );
    assert.equal(rows[0].status, "unranked");
    assert.match(rows[0].notes, /SOURCE-MAP MAPPING VALIDITY UNKNOWN/);
  });
});

describe("compile style-inclusive comparison corpus", () => {
  const files = [
    {
      path: "/fixture/Styled.vue",
      filename: "Styled.vue",
      source: `<template><div class="x">{{ color }}</div></template>
<script setup>const color = "red"</script>
<style scoped>.x { color: v-bind(color) }</style>`,
    },
  ];

  test("changes template, script and exact CSS task on every fixed-width pass", () => {
    const prepared = prepareStyleSfcCorpus(files, compiler);
    const first = materializeStyleSfcCorpus(prepared, {
      phase: "measure",
      iteration: 0,
    });
    const second = materializeStyleSfcCorpus(prepared, {
      phase: "measure",
      iteration: 1,
    });

    assert.notEqual(first[0].source, second[0].source);
    assert.equal(first[0].source.length, second[0].source.length);
    assert.match(
      first[0].source,
      /<!--vue-bench-style:00000000:m0000000000-->/,
    );
    assert.equal(
      first[0].source.match(/\/\*vue-bench-style:00000000:m0000000000\*\//g)
        ?.length,
      1,
      "script receives a revision comment",
    );
    assert.match(
      first[0].styles[0].content,
      /^\.vue-bench-style-[a-f0-9]{8}-0\{--vue-bench-revision:00000000:m0000000000\}/,
    );
    assert.ok(first[0].styles[0].sentinel);
    assert.ok(first[0].source.includes(first[0].styles[0].content));
    assert.equal(first[0].styles[0].scoped, true);
    assert.match(first[0].styles[0].content, /v-bind\(color\)/);
  });

  test("mandatory feature probes cover independent selector, at-rule, keyframe, v-bind and CSS Modules semantics", () => {
    assert.deepEqual(
      STYLE_FEATURE_CASES.map((feature) => feature.id),
      [
        "scoped",
        "deep",
        "slotted",
        "global",
        "v-bind",
        "css-modules",
        "global-mixed-local",
        "deep-compound",
        "slotted-compound",
        "is-selector-list",
        "where-selector-list",
        "media-scoped",
        "supports-scoped",
        "scoped-keyframes",
        "v-bind-multiple",
        "v-bind-quoted",
      ],
    );
  });

  test("selector plants require Vue-equivalent deep, slotted and global rewrites", () => {
    assert.doesNotThrow(() =>
      assertStyleFeature("deep", {
        css: ".deep-host[data-v-abc12345] .deep-target{color:red}",
      }),
    );
    assert.doesNotThrow(() =>
      assertStyleFeature("slotted", {
        css: ".slot-target[data-v-abc12345-s]{color:red}",
      }),
    );
    assert.doesNotThrow(() =>
      assertStyleFeature("global", { css: ".global-target{color:red}" }),
    );

    assert.throws(
      () =>
        assertStyleFeature("deep", {
          css: ".deep-host [data-v-abc12345] .deep-target{color:red}",
        }),
      /scope attribute must remain on \.deep-host/,
    );
    assert.throws(
      () =>
        assertStyleFeature("slotted", {
          css: ".slot-target[data-v-abc12345]-s{color:red}",
        }),
      /\[data-v-…-s\]/,
    );
    assert.throws(
      () =>
        assertStyleFeature("global", {
          css: ".global-target[data-v-abc12345]{color:red}",
        }),
      /incorrectly constrained/,
    );
    assert.throws(
      () =>
        assertStyleFeature("global", {
          css: ":global(.global-target)[data-v-abc12345]{color:red}",
        }),
      /pseudo-selector was left/,
    );
  });

  test("compound global, deep and slotted plants validate selector meaning without formatting equality", () => {
    assert.doesNotThrow(() =>
      assertStyleFeature("global-mixed-local", {
        css: ".global-parent.active>.global-child:hover { color: red }",
      }),
    );
    assert.doesNotThrow(() =>
      assertStyleFeature("deep-compound", {
        css: ".outer > .deep-host.active[data-v-abc12345]   .deep-target.child>.deep-leaf:hover{color:red}",
      }),
    );
    assert.doesNotThrow(() =>
      assertStyleFeature("slotted-compound", {
        css: ".slot-host .slot-target.active > .slot-child[data-v-abc12345-s]:hover{color:red}",
      }),
    );

    assert.throws(
      () =>
        assertStyleFeature("global-mixed-local", {
          css: ".local-host[data-v-abc12345] .global-parent.active>.global-child:hover{color:red}",
        }),
      /local selector fragments or a scope constraint leaked/,
    );
    assert.throws(
      () =>
        assertStyleFeature("deep-compound", {
          css: ".outer > .deep-host.active[data-v-abc12345] .deep-target.child > .deep-leaf:hover[data-v-abc12345]{color:red}",
        }),
      /inside :deep\(\) was incorrectly scope-constrained/,
    );
    assert.throws(
      () =>
        assertStyleFeature("slotted-compound", {
          css: ".slot-host .slot-target.active > .slot-child[data-v-abc12345-s]:hover[data-v-abc12345]{color:red}",
        }),
      /ordinary scope attribute leaked/,
    );
  });

  test(":is() and :where() plants preserve selector lists and scope only the host", () => {
    assert.doesNotThrow(() =>
      assertStyleFeature("is-selector-list", {
        css: ".is-host[data-v-abc12345]:is(.alpha,.beta:hover){color:red}",
      }),
    );
    assert.doesNotThrow(() =>
      assertStyleFeature("where-selector-list", {
        css: ".where-host[data-v-abc12345]:where(.gamma, .delta:hover){color:red}",
      }),
    );
    assert.throws(
      () =>
        assertStyleFeature("is-selector-list", {
          css: ".is-host:is(.alpha[data-v-abc12345],.beta[data-v-abc12345]:hover){color:red}",
        }),
      /scope attribute was not attached outside/,
    );
    assert.throws(
      () =>
        assertStyleFeature("where-selector-list", {
          css: ".where-host[data-v-abc12345]:where(.gamma){color:red}",
        }),
      /complete :where\(\) selector list was not preserved/,
    );
  });

  test("nested at-rule plants require both the wrapper and scoped selector semantics", () => {
    assert.doesNotThrow(() =>
      assertStyleFeature("media-scoped", {
        css: "@media(min-width:1px){.media-target[data-v-abc12345]:hover{color:red}}",
      }),
    );
    assert.doesNotThrow(() =>
      assertStyleFeature("supports-scoped", {
        css: "@supports (display:grid){.supports-target>.supports-child[data-v-abc12345]{display:grid}}",
      }),
    );
    assert.throws(
      () =>
        assertStyleFeature("media-scoped", {
          css: ".media-target[data-v-abc12345]:hover{color:red}",
        }),
      /@media wrapper was not emitted/,
    );
    assert.throws(
      () =>
        assertStyleFeature("supports-scoped", {
          css: "@supports(display:grid){.supports-target>.supports-child{display:grid}}",
        }),
      /nested in @supports was not scope-rewritten/,
    );
  });

  test("scoped keyframe plant checks declaration/reference consistency, not the generated suffix", () => {
    assert.doesNotThrow(() =>
      assertStyleFeature("scoped-keyframes", {
        css: "@keyframes fade-any-hash{from{opacity:0}to{opacity:1}}.animated[data-v-abc12345]{animation:fade-any-hash 1s ease;animation-name:fade-any-hash}",
      }),
    );
    assert.throws(
      () =>
        assertStyleFeature("scoped-keyframes", {
          css: "@keyframes fade-any-hash{from{opacity:0}to{opacity:1}}.animated[data-v-abc12345]{animation:fade 1s ease;animation-name:fade-any-hash}",
        }),
      /animation shorthand does not reference/,
    );
  });

  test("multiple and quoted v-bind plants verify distinct CSS variables and their JS expressions", () => {
    assert.doesNotThrow(() =>
      assertStyleFeature("v-bind-multiple", {
        css: ".multi{color:var(--color-hash);border-color:var(--border-hash)}",
        js: '_useCssVars(() => ({ "color-hash": (color), "border-hash": (borderColor) }))',
      }),
    );
    assert.doesNotThrow(() =>
      assertStyleFeature("v-bind-quoted", {
        css: ".quoted{margin-left:var(--gap-hash);font-family:var(--family-hash)}",
        js: '_useCssVars(() => ({ "gap-hash": (_ctx.theme.gap), "family-hash": (_ctx.theme.family) }))',
      }),
    );
    assert.throws(
      () =>
        assertStyleFeature("v-bind-multiple", {
          css: ".multi{color:var(--same-hash);border-color:var(--same-hash)}",
          js: '_useCssVars(() => ({ "same-hash": (color) }))',
        }),
      /borderColor|collapsed/,
    );
    assert.throws(
      () =>
        assertStyleFeature("v-bind-quoted", {
          css: ".quoted{margin-left:var(--gap-hash);font-family:var(--family-hash)}",
          js: '_useCssVars(() => ({ "gap-hash": (_ctx.theme.family), "family-hash": (_ctx.theme.gap) }))',
        }),
      /was not registered from theme\.gap/,
    );
  });

  test("installed gates evaluate every feature independently and require all to pass", async () => {
    const gates = await computeStyleCorrectnessGates({
      compiler35: compiler,
      compiler36,
      vizeNative,
      verterNative,
      fervidNative,
      makeVerterHost: (config) => new verterNative.VerterHost(config),
    });

    const required = STYLE_FEATURE_CASES.map((feature) => feature.id);
    for (const name of ["@vue/compiler-sfc", "@vue/compiler-sfc-36"]) {
      assert.equal(
        gates[name]?.ok,
        true,
        `${name}: ${gates[name]?.error ?? "failed"}`,
      );
      assert.deepEqual(gates[name].passed, required);
      assert.deepEqual(gates[name].failures, []);
    }

    for (const name of [
      "@vizejs/native:compileSfc",
      "@vizejs/native:compileSfcBatchWithResults",
      "@verter/native",
      "@fervid/napi:compileSync",
      "@fervid/napi:compileAsync",
    ]) {
      const gate = gates[name];
      assert.ok(gate, `${name}: gate missing`);
      const covered = [
        ...gate.passed,
        ...gate.failures.map((failure) => failure.id),
      ];
      assert.deepEqual(
        covered.sort(),
        [...required].sort(),
        `${name}: every mandatory plant must run even after an earlier failure`,
      );
      assert.equal(
        gate.ok,
        gate.failures.length === 0,
        `${name}: validity must require every feature plant to pass`,
      );
    }
  });
});

describe("fervid diagnostic exception", () => {
  const allowed = {
    message:
      "SfcParse(ParseError { kind: InvalidHtml(NonVoidHtmlElementStartTagWithTrailingSolidus), span: 11..18 })",
  };

  test("accepts only the complete known HTML-strictness code", () => {
    assert.equal(isAllowedFervidDiagnostic(allowed), true);
    assert.equal(
      assertOnlyAllowedFervidDiagnostics({ errors: [allowed] }, "probe"),
      1,
    );
    assert.equal(
      isAllowedFervidDiagnostic({
        message:
          "another error mentioning NonVoidHtmlElementStartTagWithTrailingSolidus",
      }),
      false,
    );
    assert.throws(
      () =>
        assertOnlyAllowedFervidDiagnostics(
          { errors: [{ message: "UnsupportedCssModule" }] },
          "probe",
        ),
      /UnsupportedCssModule/,
    );
  });
});
