import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import * as compiler from "@vue/compiler-sfc";
import { format } from "prettier";
import { transformSync } from "@babel/core";
import jsxPlugin from "@vue/babel-plugin-jsx";
import { COMPILE_VALIDITY_PLANTS } from "../../scripts/lib/compile-validity-plants.mjs";
import { JSX_VALIDITY_PLANTS } from "../../scripts/lib/jsx-validity-plants.mjs";
import {
  FORMAT_VALIDITY_PLANTS,
  judgeFormattedPlant,
} from "../../scripts/lib/format-validity-plants.mjs";
import { LINT_VALIDITY_PLANTS, judgeLintPair } from "../../scripts/lib/lint-validity-plants.mjs";
import { fileMatches } from "../confirm/lib/diagnostics.mjs";
import { scoreComponentMeta } from "../confirm/lib/component-meta-score.mjs";
import { normalizeVolarComponentMeta } from "../confirm/lib/component-meta-extract.mjs";
import { hoverMentionsType, createDiagStore } from "../confirm/suites/lsp.mjs";
import { pathToFileURL } from "node:url";
import { findAllExpected } from "../../scripts/lib/ide-ops/suites/completion.mjs";
import { ensureDom } from "../confirm/lib/dom.mjs";
import { loadCompiledComponent } from "../confirm/lib/compile-to-component.mjs";
import { preparePlantRoot } from "../../scripts/lib/component-meta-validity-child.mjs";
import { COMPONENT_META_VALIDITY_PLANTS } from "../../scripts/lib/component-meta-validity-plants.mjs";

test("metadata staging includes imported type files and the manifest fingerprints them", () => {
  const plant = COMPONENT_META_VALIDITY_PLANTS.find((p) => p.id === "external-props-import");
  const support = plant.supportFiles.find((file) => file.file === "types.ts");
  assert.ok(support?.source.includes("BaseFieldProps"));
  const staged = preparePlantRoot("harness-support-files");
  try {
    assert.equal(readFileSync(join(staged.workDir, plant.id, "types.ts"), "utf8"), support.source);
    assert.equal(staged.files.length, COMPONENT_META_VALIDITY_PLANTS.length);
    const config = JSON.parse(readFileSync(join(staged.workDir, "tsconfig.json"), "utf8"));
    assert.ok(config.include.some((file) => file.replaceAll("\\", "/") === `${plant.id}/types.ts`));
  } finally {
    rmSync(staged.cleanupRoot, { recursive: true, force: true });
  }
});

test("diagnostic attribution requires a complete path segment", () => {
  for (const path of ["App.vue", "/x/App.vue", "C:\\x\\App.vue"]) {
    assert.equal(fileMatches(path, "App.vue"), true);
  }
  for (const path of ["OtherApp.vue", "/x/OtherApp.vue", "/x/App.vue.ts"]) {
    assert.equal(fileMatches(path, "App.vue"), false);
  }
  const plant = LINT_VALIDITY_PLANTS[0];
  const diag = {
    file: "OtherPlant.vue",
    line: plant.dirtyLine,
    rule: plant.rules[0],
    raw: "Plant.vue",
  };
  assert.equal(judgeLintPair(plant, [diag], []).ok, false);
  const valid = { ...diag, file: "Plant.vue" };
  assert.equal(judgeLintPair(plant, [valid], []).ok, true);
  assert.equal(judgeLintPair(plant, [valid], [{ ...valid, line: plant.dirtyLine + 2 }]).ok, false);
  assert.equal(
    judgeLintPair(plant, [{ raw: `OtherPlant.vue:${plant.dirtyLine}:1 ${plant.rules[0]}` }], []).ok,
    false,
  );
  assert.equal(
    judgeLintPair(plant, [{ raw: `/x/Plant.vue:${plant.dirtyLine}:1 ${plant.rules[0]}` }], []).ok,
    true,
  );
});

test("metadata flags must be reported when the tool claims that capability", () => {
  for (const required of [true, false]) {
    for (const hasDefault of [true, false]) {
      const expect = { props: [{ name: "title", required, hasDefault }] };
      const tool = { capabilities: ["props", "required", "defaults"] };
      const score = (prop) =>
        scoreComponentMeta({ props: [{ name: "title", ...prop }] }, expect, tool);
      assert.equal(score({ required, hasDefault }).ok, true);
      assert.equal(score({ hasDefault }).ok, false);
      assert.equal(score({ required }).ok, false);
      assert.equal(score({ required: !required, hasDefault }).ok, false);
      assert.equal(score({ required, hasDefault: !hasDefault }).ok, false);
    }
  }
  const meta = normalizeVolarComponentMeta({ props: [{ name: "title", type: "string" }] }, "test");
  assert.equal(meta.props[0].required, undefined, "missing requiredness must not become optional");
  assert.equal(
    scoreComponentMeta(
      meta,
      { props: [{ name: "title", required: false }] },
      { capabilities: ["*"] },
    ).ok,
    false,
  );
  assert.equal(
    scoreComponentMeta(
      meta,
      { props: [{ name: "title", required: false }] },
      { capabilities: ["props"] },
    ).ok,
    true,
  );
});

test("confirmation hover requires the planted binding's correct type", () => {
  for (const text of [
    '```typescript\nconst greeting: "confirm-lsp"\n```',
    "(property) greeting: string",
    "greeting: 'confirm-lsp'",
  ])
    assert.equal(hoverMentionsType(text), true, text);
  for (const text of [
    "",
    "A string greeting",
    "other: string",
    "greeting: number",
    "greeting: Ref<string>",
    "greeting: string | number",
    "greeting: string[]",
    'Description: "confirm-lsp"',
    'greeting: "other"',
    "greeting: stringish",
  ])
    assert.equal(hoverMentionsType(text), false, text);
});

test("LSP diagnostics clear only on a real report and reject stale document versions", () => {
  const file = join(process.cwd(), "App.vue");
  const uri = pathToFileURL(file).href;
  const store = createDiagStore(file);
  const dirty = [{ message: "plantedBadProp is unknown" }];
  store.ingestPull("pull", { kind: "full", items: dirty });
  store.advanceVersion(2);
  for (const response of [null, undefined, {}, { kind: "unchanged" }]) {
    store.ingestPull("pull", response);
    assert.deepEqual(store.merged(), dirty);
  }
  store.ingestPull("pull", { kind: "full", items: [] });
  assert.deepEqual(store.merged(), []);
  store.onPublish("server", { uri, version: 2, diagnostics: dirty });
  store.onPublish("server", { uri, version: 1, diagnostics: [] });
  store.onPublish("server", { uri, version: 2 });
  assert.deepEqual(store.merged(), dirty);
  store.onPublish("server", { uri, version: 2, diagnostics: [] });
  assert.deepEqual(store.merged(), []);
  // Versionless push reports remain supported by the protocol.
  store.onPublish("server", { uri, diagnostics: dirty });
  assert.deepEqual(store.merged(), dirty);
});

test("confirmation completion accepts exact decorated names and text edits, not substrings", () => {
  const items = [
    { label: "epilogueText" },
    { label: ":epilogue-text" },
    { label: "prop", textEdit: { newText: 'epilogue-text="$1"' } },
    { label: "notEpilogueText" },
    { label: "epilogueTextExtra" },
  ];
  assert.deepEqual(findAllExpected(items, ["epilogueText"]), items.slice(0, 3));
});

test("Prettier preserves every format plant under the stricter projection", async () => {
  for (const plant of FORMAT_VALIDITY_PLANTS) {
    const first = await format(plant.source, { parser: "vue" });
    const second = await format(first, { parser: "vue" });
    const result = judgeFormattedPlant({
      plant,
      original: plant.source,
      first,
      second,
      parse: compiler.parse,
    });
    assert.equal(result.ok, true, `${plant.id}: ${result.failures.join("; ")}`);
  }
});

test("format gate rejects lost pre/inline spaces and changed regexp patterns or flags", async () => {
  const plant = FORMAT_VALIDITY_PLANTS.find((p) => p.id === "significant-whitespace-and-regexp");
  const mutations = [
    plant.source.replace("  alpha\n    beta  ", "alpha beta"),
    plant.source.replace("</span> <span>", "</span><span>"),
    plant.source.replace("/alpha+/gi", "/beta+/gi"),
    plant.source.replace("/alpha+/gi", "/alpha+/g"),
  ];
  for (const source of mutations) {
    const first = await format(source, { parser: "vue" });
    const second = await format(first, { parser: "vue" });
    const result = judgeFormattedPlant({
      plant,
      original: plant.source,
      first,
      second,
      parse: compiler.parse,
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.failures.some((f) => f.includes("semantic AST")),
      result.failures.join("; "),
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

function compileSfc(source, options = {}) {
  const { descriptor, errors } = compiler.parse(source);
  assert.deepEqual(errors, []);
  return compiler.compileScript(descriptor, {
    id: "probe-regression",
    inlineTemplate: true,
    ...options,
  }).content;
}

function compileJsx(source) {
  return transformSync(source, {
    filename: "Plant.jsx",
    plugins: [jsxPlugin],
    configFile: false,
    babelrc: false,
  }).code;
}

test("a synchronous runtime assertion failure still unmounts the component", async () => {
  for (const plant of [
    JSX_VALIDITY_PLANTS.find((p) => p.id === "static-element-attributes"),
    COMPILE_VALIDITY_PLANTS.find((p) => p.id === "template-only-sfc"),
  ]) {
    let unmounted = 0;
    const mount = () => ({
      get() {
        throw new Error("planted assertion failure");
      },
      unmount() {
        unmounted++;
      },
    });
    await assert.rejects(plant.assert({ mount, component: {} }), /planted assertion failure/);
    assert.equal(unmounted, 1, plant.id);
  }
});

test("SFC and JSX keyed probes reject compilers that discard keys", async () => {
  const sfc = COMPILE_VALIDITY_PLANTS.find((p) => p.id === "keyed-list-reorder");
  await assertRuntime(sfc, compileSfc(sfc.source));
  await assert.rejects(
    assertRuntime(sfc, compileSfc(sfc.source.replace(':key="id"', ""))),
    /DOM identity/,
  );
  const jsx = JSX_VALIDITY_PLANTS.find((p) => p.id === "keyed-list-map");
  await assertRuntime(jsx, compileJsx(jsx.source));
  await assert.rejects(
    assertRuntime(jsx, compileJsx(jsx.source.replace("key={item.id}", ""))),
    /DOM identity/,
  );
});

test("reactive destructure probe rejects snapshot destructuring", async () => {
  const plant = COMPILE_VALIDITY_PLANTS.find(
    (p) => p.id === "reactive-props-destructure-alias-default",
  );
  await assertRuntime(plant, compileSfc(plant.source));
  await assert.rejects(
    assertRuntime(plant, compileSfc(plant.source, { propsDestructure: false })),
    /aliased prop and computed update/,
  );
});

test("Babel passes all JSX runtime probes including handler replacement and removal", async () => {
  for (const plant of JSX_VALIDITY_PLANTS) await assertRuntime(plant, compileJsx(plant.source));
});
