import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { isDeepStrictEqual } from "node:util";

const require = createRequire(import.meta.url);
const ts = require("typescript");

export const FORMAT_VALIDITY_SUITE_VERSION = "2026-08-20.1";

export const FORMAT_VALIDITY_PLANTS = Object.freeze([
  {
    id: "template-behaviour",
    coverage: ["v-if", "v-for", "key", "v-model", "events", "class-style", "expressions"],
    source: `<script setup lang="ts">
import {ref,computed} from 'vue'
const ok=ref(true)
const query=ref(' x ')
const rows=ref([{id:1,label:'one'},{id:2,label:'two'}])
const upper=computed(()=>query.value.toUpperCase())
function toggle(){ok.value=!ok.value}
</script>
<template>
 <section :class="{active:ok}" :style="{opacity:ok?1:0.5}">
  <input v-model.trim="query" @keyup.enter.stop="toggle" >
  <p v-if="ok">{{ upper }}</p>
  <ul><li v-for="(row,index) in rows" :key="row.id" :data-index="index">{{row.label}}</li></ul>
 </section>
</template>
`,
  },
  {
    id: "descriptor-attributes",
    coverage: ["script-setup", "generic", "scoped", "module", "preprocessor", "custom-block"],
    source: `<script setup lang="ts" generic="T extends { id: number }">
const props=defineProps<{items:T[]}>()
</script>
<template><ol><li v-for="item in props.items" :key="item.id">{{ item.id }}</li></ol></template>
<style scoped module="theme" lang="scss">
.root { color:v-bind('props.items.length > 0 ? "red" : "blue"'); }
.root :deep(.child) { font-weight:bold; }
.root :slotted(span) { opacity:.8; }
:global(body) .root { margin:0; }
</style>
<docs lang="md" kind="plant">FORMAT_CUSTOM_BLOCK_MARKER</docs>
`,
    mustPreserve: ["v-bind(", ":deep(", ":slotted(", ":global(", "FORMAT_CUSTOM_BLOCK_MARKER"],
  },
  {
    id: "comments-and-svg",
    coverage: ["comments", "svg", "dynamic-attributes", "event-modifiers"],
    source: `<script setup>
// FORMAT_SCRIPT_COMMENT
const colour='red'
</script>
<template>
 <!-- FORMAT_TEMPLATE_COMMENT -->
 <svg viewBox="0 0 10 10" @click.once="()=>0"><circle :fill="colour" cx="5" cy="5" r="4" /></svg>
</template>
<style>
/* FORMAT_STYLE_COMMENT */
svg{display:block}
</style>
`,
    mustPreserve: ["FORMAT_SCRIPT_COMMENT", "FORMAT_TEMPLATE_COMMENT", "FORMAT_STYLE_COMMENT"],
  },
]);

export const FORMAT_VALIDITY_SUITE_HASH = createHash("sha256")
  .update(
    JSON.stringify(
      FORMAT_VALIDITY_PLANTS.map(({ id, coverage, source, mustPreserve = [] }) => ({
        id,
        coverage,
        source,
        mustPreserve,
      })),
    ),
  )
  .digest("hex");

function attrsOf(block) {
  return Object.fromEntries(
    Object.entries(block?.attrs ?? {})
      .map(([key, value]) => [key, value === true ? true : String(value)])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

export function descriptorProjection(descriptor) {
  const block = (value) => (value ? { type: value.type, attrs: attrsOf(value) } : null);
  return {
    template: block(descriptor.template),
    script: block(descriptor.script),
    scriptSetup: block(descriptor.scriptSetup),
    styles: descriptor.styles.map(block),
    customBlocks: descriptor.customBlocks.map(block),
  };
}

function tsProjection(source, scriptKind = ts.ScriptKind.TS) {
  const file = ts.createSourceFile("Plant.ts", source, ts.ScriptTarget.Latest, true, scriptKind);
  const visit = (node) => {
    let value;
    if (ts.isIdentifier(node)) value = node.text;
    else if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) value = node.text;
    const children = [];
    ts.forEachChild(node, (child) => {
      children.push(visit(child));
    });
    return value === undefined ? [node.kind, children] : [node.kind, value, children];
  };
  return visit(file);
}

function expressionProjection(source) {
  return tsProjection(`const __plant = (${source})`, ts.ScriptKind.TSX);
}

function templateProjectionNode(node) {
  if (!node || typeof node !== "object") return null;
  if (node.type === 0)
    return [0, (node.children ?? []).map(templateProjectionNode).filter(Boolean)];
  if (node.type === 1) {
    return [
      1,
      node.tag,
      node.tagType,
      (node.props ?? []).map((prop) => {
        if (prop.type === 6) return [6, prop.name, prop.value?.content ?? null];
        if (prop.type === 7) {
          return [
            7,
            prop.name,
            prop.arg?.content ?? null,
            prop.arg?.isStatic ?? null,
            prop.exp?.content ? expressionProjection(prop.exp.content) : null,
            (prop.modifiers ?? []).map((modifier) => modifier?.content ?? String(modifier)),
          ];
        }
        return [prop.type];
      }),
      (node.children ?? []).map(templateProjectionNode).filter(Boolean),
    ];
  }
  if (node.type === 2) {
    const content = node.content.replaceAll(/\s+/g, " ").trim();
    return content ? [2, content] : null;
  }
  if (node.type === 3) return [3, node.content.trim()];
  if (node.type === 5) return [5, expressionProjection(node.content.content)];
  return [node.type, (node.children ?? []).map(templateProjectionNode).filter(Boolean)];
}

export function semanticProjection(descriptor) {
  const script = [descriptor.script, descriptor.scriptSetup]
    .filter(Boolean)
    .map((block) =>
      tsProjection(
        block.content,
        /\btsx\b/i.test(block.lang ?? "") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      ),
    );
  return {
    template: descriptor.template?.ast ? templateProjectionNode(descriptor.template.ast) : null,
    script,
  };
}

export function judgeFormattedPlant({ plant, original, first, second, parse }) {
  const failures = [];
  const parseOne = (source, phase) => {
    const parsed = parse(source, { filename: `${plant.id}.vue` });
    if (parsed.errors?.length) {
      failures.push(
        `${phase} parse: ${parsed.errors.map((error) => error?.message ?? String(error)).join("; ")}`,
      );
    }
    return parsed.descriptor;
  };
  const before = parseOne(original, "original");
  const after = parseOne(first, "formatted");
  if (first !== second) failures.push("second exact formatter pass was not idempotent");
  if (!isDeepStrictEqual(descriptorProjection(before), descriptorProjection(after))) {
    failures.push("SFC block/attribute/custom-block projection changed");
  }
  const beforeSemantic = semanticProjection(before);
  const afterSemantic = semanticProjection(after);
  if (!isDeepStrictEqual(beforeSemantic.template, afterSemantic.template)) {
    failures.push("template semantic AST projection changed");
  }
  if (!isDeepStrictEqual(beforeSemantic.script, afterSemantic.script)) {
    failures.push("script semantic AST projection changed");
  }
  for (const marker of plant.mustPreserve ?? []) {
    if (!first.includes(marker))
      failures.push(`missing preserved construct ${JSON.stringify(marker)}`);
  }
  const beforeTemplate = before.template?.content ?? null;
  const afterTemplate = after.template?.content ?? null;
  if (beforeTemplate === null || afterTemplate === null || beforeTemplate === afterTemplate) {
    failures.push("messy template block was not rewritten");
  }
  return { ok: failures.length === 0, failures };
}
