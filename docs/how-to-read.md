# How to read the tables

Conventions shared by every results table in the [README](../README.md). Each generated results
section also links its own "how to read" notes for rules specific to that section.

- Ranked on the **median of measured runs**, all warmed (≥1 discarded pass; no cold column). Min / stddev / CV% ride along; CV% > 10 is flagged ⚠ — noise, not a result.
- **One table per surface** (only vapor/vdom codegen targets stay separate — different jobs). Engine, invocation and threading are row properties: **(JS)** marks the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's Go rewrite as much as the tool), and the row's label/notes say CLI vs in-process and the thread mode — compare like with like.
- Name markers: **⚠** failed a validation gate (time in brackets, unranked) · **❌** error · **⏭** skipped/not installed.
- Per-row detail lives in each artifact's **full report** under [`results/`](results/) (linked from every summary block); each surface has a **Tools** legend saying what actually ran.
- A tool that misses a planted bug, or that does materially less work than the tools beside it, is **measured but unranked** — speed without the work is not a result. Biome is the clearest case: it treats `.vue` as a host for an embedded `<script>` and has no template support, so on **format** it returns the template and style blocks byte-identical, and on **lint** it never examines `<template>` (missing the planted `vue/no-v-html`, and reporting template-only variable uses as unused). Its times are shown in brackets and excluded from ranking; on 50 SFCs it formatted in 226 ms against Vize's 231 ms, so unranking it changes who tops the table.
- **Oxlint is unranked on lint for the same reason, with its `vue` plugin switched on** — that is the part worth checking before dismissing the verdict. The plugin adds 31 rules to oxlint's stock 111, and all 31 read `<script>` (prop casing, `defineEmits` style, lifecycle-after-`await`); template syntax is never parsed, so the plant is missed with all 142 rules active. Unlike Biome it produces no false positives, because it disables `no-unused-vars` for `.vue` entirely — and so misses genuinely unused declarations too.

Everything else — corpus design, work gates, comparison classes, caveats, CI layout, local runs — is in **[methodology.md](methodology.md)**.
