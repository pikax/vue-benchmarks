import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, compileScript } from "@vue/compiler-sfc";
import { encodedMap, TraceMap } from "@jridgewell/trace-mapping";
import { judgeSourceMapArtifact } from "../../scripts/lib/source-map-validity-oracle.mjs";
import { nativeArtifacts, runSourceMapValidityChild } from "../../scripts/lib/source-map-validity-child.mjs";

test("native map capture uses emitted CSS when styles contains parsed input descriptors", () => {
  const result = {
    code: "export default {}", map: "js-map", css: ".target[data-v-test]{color:red}", cssMap: "css-map",
    styles: [{ content: ".target{color:red}", scoped: true, index: 0 }],
  };
  assert.deepEqual(nativeArtifacts(result), [
    { kind: "js", code: result.code, map: "js-map" },
    { kind: "css", code: result.css, map: "css-map" },
  ]);
  const { css, cssMap, ...withoutOutput } = result;
  assert.deepEqual(nativeArtifacts(withoutOutput), [{ kind: "js", code: result.code, map: "js-map" }]);
});

test("native map capture preserves separate emitted style artifacts and their maps", () => {
  const styles = [{ code: ".a{color:red}", map: "first-map" }, { code: ".b{padding:0}", sourceMap: "second-map" }];
  assert.deepEqual(nativeArtifacts({ code: "export default {}", styles, css: "unused aggregate" }).slice(1), [
    { kind: "css", styleIndex: 0, code: styles[0].code, map: "first-map" },
    { kind: "css", styleIndex: 1, code: styles[1].code, map: "second-map" },
  ]);
});

const source = '<script setup>\r\n/* 🧪 */ const mapScriptToken = 7\r\n</script>\r\n<template>{{ Math.max(mapScriptToken, 0) }}</template>\r\n<style>/* 🧪 */ .mapTarget { color: red; }</style>\r\n';
const code = 'const mapScriptToken = 7;\nfunction render() { return Math.max(mapScriptToken, 0) }\n/* 🧪 */ .mapTarget { color: red; }';
const filename = "/probe/maps/Plant.vue";
function position(text, offset) {
  const lines = text.slice(0, offset).split("\n");
  return [lines.length - 1, lines.at(-1).length];
}
function fixture() {
  const anchors = ["mapScriptToken", "Math", "color"].map((token) => ({
    id: token, generatedToken: token, generatedOffset: code.indexOf(token), originalOffset: source.indexOf(token),
  }));
  const map = { version: 3, sources: ["Plant.vue"], sourcesContent: [source], names: [], mappings: [[], [], []] };
  for (const anchor of anchors) {
    const [line, column] = position(code, anchor.generatedOffset);
    const [originalLine, originalColumn] = position(source, anchor.originalOffset);
    map.mappings[line].push([column, 0, originalLine, originalColumn]);
  }
  return { code, source, filename, anchors, map };
}
const judge = (value) => judgeSourceMapArtifact(value);

test("source map oracle accepts exact decoded, encoded JSON and indexed maps with CRLF/emoji", () => {
  const value = fixture();
  const encoded = encodedMap(new TraceMap(value.map));
  for (const map of [value.map, JSON.stringify(encoded), { version: 3, sections: [{ offset: { line: 0, column: 0 }, map: encoded }] }]) {
    const result = judge({ ...value, map });
    assert.equal(result.ok, true, result.failures.join("; "));
    assert.equal(result.traces.length, 3);
    assert.equal(result.traces[0].original.column, 15); // 🧪 is two UTF-16 units.
  }
});

test("official Vue compileScript map traces a selected declaration to the complete SFC", () => {
  for (const inputFilename of [filename, "D:/probe/maps/Plant.vue"]) {
    const descriptor = parse(source, { filename: inputFilename, sourceMap: true }).descriptor;
    const compiled = compileScript(descriptor, { id: "source-map-probe", sourceMap: true });
    const result = judge({
      code: compiled.content, map: compiled.map, source, filename: inputFilename,
      anchors: [{ id: "script-declaration", generatedToken: "mapScriptToken", generatedOffset: compiled.content.indexOf("mapScriptToken"), originalOffset: source.indexOf("mapScriptToken") }],
    });
    assert.equal(result.ok, true, result.failures.join("; "));
  }
});

test("the exact Vue 3.5 capture pipeline maps script, same-line template and both styles for LF/CRLF", async () => {
  const result = await runSourceMapValidityChild({ entrypoint: "vue-3.5", target: "vdom", env: "production" });
  assert.deepEqual(result.results.map((plant) => plant.id), ["lf-raw", "crlf-raw", "lf-styles", "crlf-styles"]);
  for (const plant of result.results) {
    assert.equal(plant.status, "PASS", `${plant.id}: ${plant.failures.join("; ")}`);
    assert.equal(plant.traces.length, plant.workload === "styles" ? 4 : 2);
  }
});

test("wrong source files, same-basename neighbours and stale/full-block content fail", () => {
  for (const change of [
    (map) => { map.sources[0] = "Other.vue"; },
    (map) => { map.sources[0] = "../other/Plant.vue"; },
    (map) => { map.sourcesContent[0] = source.replace("= 7", "= 8"); },
    (map) => { map.sourcesContent[0] = source.replaceAll("\r\n", "\n"); },
    (map) => { map.sourcesContent[0] = source.slice(source.indexOf("/* 🧪 */"), source.indexOf("</script>")); },
    (map) => { delete map.sourcesContent; },
  ]) {
    const value = fixture();
    change(value.map);
    assert.equal(judge(value).ok, false);
  }
});

test("off-by-one original lines/columns and shifted generated segments fail", () => {
  for (const change of [
    (map) => { map.mappings[0][0][2]++; },
    (map) => { map.mappings[0][0][3]++; },
    (map) => { map.mappings[0][0][3] += 2; }, // UTF-8 byte count instead of UTF-16.
    (map) => { map.mappings[0][0][0]--; }, // GLB fallback must not hide a stale segment.
    (map) => { map.mappings[0][0][0]++; },
    (map) => { map.mappings[0] = []; },
  ]) {
    const value = fixture();
    change(value.map);
    const result = judge(value);
    assert.equal(result.ok, false);
    assert.equal(result.traces[0].ok, false);
    assert.equal(result.traces[1].ok, true); // A bad anchor cannot hide later evidence.
  }
});

test("repeated tokens require an explicit occurrence, and a good occurrence cannot hide a bad one", () => {
  const value = fixture();
  delete value.anchors[0].generatedOffset;
  assert.match(judge(value).failures[0], /ambiguous/);
  value.anchors[0].generatedOffset = code.indexOf("mapScriptToken");
  assert.equal(judge(value).ok, true);
  value.anchors[0].generatedOffset = code.lastIndexOf("mapScriptToken");
  assert.equal(judge(value).ok, false);
});

test("Windows URI spellings and sourceRoot resolve without weakening POSIX source identity", () => {
  const value = fixture();
  value.filename = "D:\\probe\\maps\\Plant.vue";
  value.map.sources = ["file:///d%3A/probe/maps/Plant.vue"];
  assert.equal(judge(value).ok, true);
  value.map.sources = ["Plant.vue"];
  value.map.sourceRoot = "./";
  assert.equal(judge(value).ok, true);
  const posix = fixture();
  posix.map.sources = ["plant.vue"];
  assert.equal(judge(posix).ok, false);
});

test("missing maps/tokens, malformed anchors and empty suites cannot pass", () => {
  for (const map of [null, {}, "bad json", { version: 3, sources: [] }]) {
    assert.equal(judge({ ...fixture(), map }).ok, false);
  }
  assert.equal(judge({ ...fixture(), anchors: [] }).ok, false);
  assert.equal(judge({ ...fixture(), code: "" }).ok, false);
  for (const change of [
    (anchor) => { anchor.generatedToken = "absentToken"; },
    (anchor) => { anchor.generatedOffset = -1; },
    (anchor) => { anchor.generatedOffset++; },
    (anchor) => { anchor.originalOffset = source.length + 1; },
    (anchor) => { anchor.originalOffset = 1.5; },
  ]) {
    const value = fixture();
    change(value.anchors[0]);
    assert.equal(judge(value).ok, false);
  }
});
