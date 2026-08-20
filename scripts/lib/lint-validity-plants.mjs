import { createHash } from "node:crypto";

export const LINT_VALIDITY_SUITE_VERSION = "2026-08-20.1";

function pair(id, coverage, dirtyLine, dirty, clean, concepts, rules) {
  return { id, coverage, dirtyLine, dirty, clean, concepts, rules };
}

export const LINT_VALIDITY_PLANTS = Object.freeze([
  pair(
    "v-html",
    ["template-rule", "unsafe-html"],
    6,
    `<script setup>\nconst html = '<b>x</b>'\n</script>\n<template>\n  <!-- lint plant -->\n  <div v-html="html"></div>\n</template>\n`,
    `<script setup>\nconst html = '<b>x</b>'\n</script>\n<template>\n  <!-- clean twin -->\n  <div>{{ html }}</div>\n</template>\n`,
    ["v-html"],
    ["vue/no-v-html", "no-v-html"],
  ),
  pair(
    "v-for-key",
    ["template-rule", "keyed-list"],
    5,
    `<script setup>\nconst rows = [{ id: 1 }]\n</script>\n<template>\n  <p v-for="row in rows">{{ row.id }}</p>\n</template>\n`,
    `<script setup>\nconst rows = [{ id: 1 }]\n</script>\n<template>\n  <p v-for="row in rows" :key="row.id">{{ row.id }}</p>\n</template>\n`,
    ["v-for key", "elements in iteration expect to have 'v-bind:key'"],
    ["vue/require-v-for-key", "require-v-for-key"],
  ),
  pair(
    "duplicate-attributes",
    ["template-rule", "attribute-analysis"],
    2,
    `<template>\n  <button type="button" type="submit">go</button>\n</template>\n`,
    `<template>\n  <button type="submit">go</button>\n</template>\n`,
    ["duplicate attribute", "duplicate attributes"],
    ["vue/no-duplicate-attributes", "no-duplicate-attributes"],
  ),
  pair(
    "dupe-else-if",
    ["template-rule", "control-flow-analysis"],
    4,
    `<script setup>\nconst kind = 'a'\n</script>\n<template><p v-if="kind === 'a'">a</p><p v-else-if="kind === 'a'">again</p></template>\n`,
    `<script setup>\nconst kind = 'a'\n</script>\n<template><p v-if="kind === 'a'">a</p><p v-else-if="kind === 'b'">b</p></template>\n`,
    ["duplicate condition", "duplicate of a condition", "branch can never execute"],
    ["vue/no-dupe-v-else-if", "no-dupe-v-else-if"],
  ),
  pair(
    "textarea-mustache",
    ["template-rule", "form-control-semantics"],
    5,
    `<script setup>\nconst msg = 'hello'\n</script>\n<template>\n  <textarea>{{ msg }}</textarea>\n</template>\n`,
    `<script setup>\nconst msg = 'hello'\n</script>\n<template>\n  <textarea v-model="msg"></textarea>\n</template>\n`,
    ["textarea mustache", "mustache interpolation inside textarea", "unexpected mustache in"],
    ["vue/no-textarea-mustache", "no-textarea-mustache"],
  ),
  pair(
    "v-if-with-v-for",
    ["template-rule", "directive-interaction"],
    6,
    `<script setup>\nconst items = [{ id: 1, ok: true }]\n</script>\n<template>\n  <ul>\n    <li v-for="item in items" v-if="item.ok" :key="item.id">{{ item.id }}</li>\n  </ul>\n</template>\n`,
    `<script setup>\nconst items = [{ id: 1, ok: true }]\n</script>\n<template>\n  <ul>\n    <li v-for="item in items.filter(row => row.ok)" :key="item.id">{{ item.id }}</li>\n  </ul>\n</template>\n`,
    ["v-if with v-for", "v-if on the same element as v-for", "v-if' on the same element as 'v-for"],
    ["vue/no-use-v-if-with-v-for", "no-use-v-if-with-v-for"],
  ),
  pair(
    "require-component-is",
    ["template-rule", "dynamic-component"],
    3,
    `<template>\n  <div>\n    <component />\n  </div>\n</template>\n`,
    `<template>\n  <div>\n    <component :is="'span'" />\n  </div>\n</template>\n`,
    ["component requires", "component> elements require", ":is binding"],
    ["vue/require-component-is", "require-component-is"],
  ),
  pair(
    "mutating-props",
    ["script-rule", "macro-binding-analysis"],
    5,
    `<script setup>\nconst props = defineProps({ count: { type: Number, default: 0 } })\nfunction bump() {\n  // plant\n  props.count += 1\n}\n</script>\n<template><button @click="bump">{{ props.count }}</button></template>\n`,
    `<script setup>\nconst props = defineProps({ count: { type: Number, default: 0 } })\nlet local = props.count\nfunction bump() {\n  // clean twin\n  local += 1\n}\n</script>\n<template><button @click="bump">{{ local }}</button></template>\n`,
    ["mutating prop", "mutation of prop", "prop mutation"],
    ["vue/no-mutating-props", "no-mutating-props"],
  ),
  pair(
    "deprecated-slot-attribute",
    ["template-rule", "slot-syntax"],
    8,
    `<script setup>\nconst MyPanel = {}\n</script>\n<template>\n  <MyPanel>\n    <!-- plant -->\n    <span\n      slot="header">h</span>\n  </MyPanel>\n</template>\n`,
    `<script setup>\nconst MyPanel = {}\n</script>\n<template>\n  <MyPanel>\n    <!-- clean twin -->\n    <template\n      #header><span>h</span></template>\n  </MyPanel>\n</template>\n`,
    ["deprecated slot", "slot attribute is deprecated", "'slot' attribute is deprecated"],
    ["vue/no-deprecated-slot-attribute", "no-deprecated-slot-attribute"],
  ),
  pair(
    "v-text-on-component",
    ["template-rule", "component-directive"],
    5,
    `<script setup>\nconst MyBox = {}\nconst msg = 'text'\n</script>\n<template><MyBox v-text="msg" /></template>\n`,
    `<script setup>\nconst MyBox = {}\nconst msg = 'text'\n</script>\n<template><MyBox>{{ msg }}</MyBox></template>\n`,
    ["v-text cannot be used on component", "v-text' cannot be used on component"],
    ["vue/no-v-text-v-html-on-component", "no-v-text-v-html-on-component"],
  ),
]);

export const LINT_VALIDITY_SUITE_HASH = createHash("sha256")
  .update(JSON.stringify(LINT_VALIDITY_PLANTS))
  .digest("hex");

function norm(value) {
  return String(value ?? "").toLowerCase();
}

function lineMatchesText(text, line) {
  const patterns = [
    new RegExp(`(?:^|[^0-9])${line}[:：]\\d+`, "m"),
    new RegExp(`(?:line|at)\\s*${line}(?:[^0-9]|$)`, "i"),
    new RegExp(`\\b${line}\\s*[│|]`, "m"),
  ];
  return patterns.some((pattern) => pattern.test(text));
}

export function diagnosticMatchesPlant(diagnostic, plant, filename = "Plant.vue") {
  const file = norm(diagnostic.file ?? diagnostic.filePath).replaceAll("\\", "/");
  const rule = norm(diagnostic.rule ?? diagnostic.ruleId ?? diagnostic.code);
  const message = norm(diagnostic.message);
  const raw = norm(diagnostic.raw).replaceAll("\\", "/");
  const expectedFile = norm(filename).replaceAll("\\", "/");
  const attributed = file.endsWith(expectedFile) || raw.includes(expectedFile);
  const line = Number(diagnostic.line);
  const ranged =
    line === plant.dirtyLine || (!Number.isFinite(line) && lineMatchesText(raw, plant.dirtyLine));
  const evidence = message || raw;
  const concept =
    plant.rules.some((value) => rule.includes(norm(value))) ||
    plant.rules.some((value) => evidence.includes(norm(value))) ||
    plant.concepts.some((value) => evidence.includes(norm(value)));
  return attributed && ranged && concept;
}

export function judgeLintPair(plant, dirtyDiagnostics, cleanDiagnostics, filename = "Plant.vue") {
  const dirtyMatches = dirtyDiagnostics.filter((diagnostic) =>
    diagnosticMatchesPlant(diagnostic, plant, filename),
  );
  const cleanMatches = cleanDiagnostics.filter((diagnostic) =>
    diagnosticMatchesPlant(diagnostic, plant, filename),
  );
  const failures = [];
  if (dirtyMatches.length === 0)
    failures.push("dirty twin had no file+line+rule/concept-attributed diagnostic");
  if (cleanMatches.length > 0) failures.push("clean twin retained the planted diagnostic");
  const evidence = (diagnostic) => ({
    file: diagnostic.file ?? diagnostic.filePath ?? null,
    line: diagnostic.line ?? null,
    rule: diagnostic.rule ?? diagnostic.ruleId ?? diagnostic.code ?? null,
    message: String(diagnostic.message ?? diagnostic.raw ?? "")
      .replaceAll(/\s+/g, " ")
      .slice(0, 500),
  });
  return {
    ok: failures.length === 0,
    failures,
    dirtyMatches: dirtyMatches.length,
    cleanMatches: cleanMatches.length,
    dirtyEvidence: dirtyMatches.slice(0, 2).map(evidence),
    cleanEvidence: cleanMatches.slice(0, 2).map(evidence),
  };
}
