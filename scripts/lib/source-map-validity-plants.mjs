import { createHash } from "node:crypto";

export const SOURCE_MAP_SUITE_VERSION = "2026-09-12.2";
const body = `<script setup lang="ts">
/* 🧪 */ const mapScriptToken = 7;
</script>
<template><p title="🧪">{{ Math.max(mapScriptToken, 0) }}</p></template>
`;
const styles = `<style scoped>
/* 🧪 */ .mapTarget { color: red; }
</style>
<style>
/* 🧪 */ .mapTail { padding: 7px; }
</style>
`;
export const SOURCE_MAP_PLANTS = Object.freeze(
  ["lf", "crlf"].flatMap((ending) =>
    [false, true].map((withStyles) => ({
      id: `${ending}-${withStyles ? "styles" : "raw"}`,
      workload: withStyles ? "styles" : "raw",
      source: (body + (withStyles ? styles : "")).replaceAll(
        "\n",
        ending === "crlf" ? "\r\n" : "\n",
      ),
      anchors: [
        { id: "script", generatedToken: "mapScriptToken", selector: "declaration" },
        { id: "template", generatedToken: "Math", selector: "identifier" },
        ...(withStyles
          ? [
              { id: "css-0", generatedToken: "color", selector: "declaration", styleIndex: 0 },
              { id: "css-1", generatedToken: "padding", selector: "declaration", styleIndex: 1 },
            ]
          : []),
      ],
    })),
  ),
);
export const SOURCE_MAP_SUITE_HASH = createHash("sha256")
  .update(JSON.stringify(SOURCE_MAP_PLANTS))
  .digest("hex");
