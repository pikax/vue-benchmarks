# Vue Toolchain Benchmarks

Throughput benchmarks for the Vue toolchain, measured on one Linux CI runner per run and published below. Layout and CI pattern follow [rolldown/benchmarks](https://github.com/rolldown/benchmarks): measure on CI, commit the tables back to this file.

## What is compared

| Surface | Tools |
| --- | --- |
| **SFC compile** (vdom/vapor × prod/dev) | `@vue/compiler-sfc` 3.5 & 3.6 · Vize (`@vizejs/native`) · Verter (`@verter/native`) · [fervid](https://github.com/phoenix-ru/fervid) (`@fervid/napi`, vdom only — currently unranked, see below) |
| **JSX compile** | vue-jsx-vapor (Rust + API) · `@vue/babel-plugin-jsx` |
| **Typecheck** | `vue-tsc` (JS engine and TNB/tsgo) · golar · Vize · `verter-tsc` |
| **Format** | Prettier · Oxfmt · Vize · [Biome](https://biomejs.dev) (`@biomejs/biome`, `<script>` block only — unranked, see below) |
| **Lint** | eslint-plugin-vue · Vize · Verter · Biome · [Oxlint](https://oxc.rs) (`oxlint`) (last two: `<script>` block only — unranked, see below) |
| **Component-meta** | vue-component-meta · Verter · (Vize: skipped, no public API) |
| **LSP + IDE operations** | Volar (JS engine and TNB/tsgo tsdk) · Vize · Verter |
| **Memory / CPU** | all of the above, sampled separately — published in [MEMORY.md](./MEMORY.md) |

## How to read the tables

- Ranked on the **median of measured runs**, all warmed (≥1 discarded pass; no cold column). Min / stddev / CV% ride along; CV% > 10 is flagged ⚠ — noise, not a result.
- **One table per surface** (only vapor/vdom codegen targets stay separate — different jobs). Engine, invocation and threading are row properties: **(JS)** marks the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's Go rewrite as much as the tool), and the row's label/notes say CLI vs in-process and the thread mode — compare like with like.
- Name markers: **⚠** failed a validation gate (time in brackets, unranked) · **❌** error · **⏭** skipped/not installed.
- Per-row detail lives in the collapsible **Notes** under each table; each surface has a **Tools** legend saying what actually ran.
- A tool that misses a planted bug, or that does materially less work than the tools beside it, is **measured but unranked** — speed without the work is not a result. Biome is the clearest case: it treats `.vue` as a host for an embedded `<script>` and has no template support, so on **format** it returns the template and style blocks byte-identical, and on **lint** it never examines `<template>` (missing the planted `vue/no-v-html`, and reporting template-only variable uses as unused). Its times are shown in brackets and excluded from ranking; on 50 SFCs it formatted in 226 ms against Vize's 231 ms, so unranking it changes who tops the table.
- **Oxlint is unranked on lint for the same reason, with its `vue` plugin switched on** — that is the part worth checking before dismissing the verdict. The plugin adds 31 rules to oxlint's stock 111, and all 31 read `<script>` (prop casing, `defineEmits` style, lifecycle-after-`await`); template syntax is never parsed, so the plant is missed with all 142 rules active. Unlike Biome it produces no false positives, because it disables `no-unused-vars` for `.vue` entirely — and so misses genuinely unused declarations too.

Everything else — corpus design, work gates, comparison classes, caveats, CI layout, local runs — is in **[docs/methodology.md](docs/methodology.md)**.

## Quick start

```bash
corepack enable && pnpm install   # Node 22+, pnpm 10
pnpm generate                     # fixtures
pnpm bench                        # full local bench (5 runs, 1 warmup)
```

Published numbers are **Linux only**; local runs are for comparison on your own box, never against the tables below. More commands and flags: [docs/methodology.md](docs/methodology.md#quick-start).

## Reference results

**Before reading the tables — five known caveats that the numbers alone will not tell you:**

| Caveat | Effect on the tables |
| --- | --- |
| [`verter-tsc` is the only checker not silent on a clean corpus](docs/methodology.md#caveat-verter-tsc-is-the-only-checker-that-is-not-silent-on-a-clean-corpus) | It emits 442 diagnostics on 200 files (every other ranked checker: 0) and ranks 1st in its class on the smaller corpus. Passes the work gate; not bracketed. |
| [Vize's tsgo/Corsa backend sometimes never starts](docs/methodology.md#caveat-vizes-type-checking-backend-sometimes-never-starts-and-the-row-still-answers) | Non-deterministic. When it fires, the row was measured with the type-checking backend absent. Look for `⚠ BACKEND FALLBACK` in Notes. |
| [Volar's memory excludes its tsserver half; its timing includes it](docs/methodology.md#caveat-volars-lsp-memory-row-is-not-the-whole-of-volar-but-the-lsp-timing-row-is) | Volar's memory row covers one of its two processes; its latency rows include both. Vize and Verter are single-process, so their rows cover the whole tool. |
| [The TNB engine swap fails an IDE completion resolve](docs/methodology.md#caveat-the-tnb-engine-swap-fails-an-ide-completion-resolve-operation) | TNB passes the typecheck work gate. On the IDE surface, resolving an auto-import completion item errors in the tsgo half. |
| [fervid is measured but unranked — 11% of its output for this corpus is not valid JavaScript](docs/methodology.md#caveat-fervid-is-measured-but-unranked--11-of-its-output-for-this-corpus-is-not-valid-javascript) | `@fervid/napi` 0.4.1 emits doubly-parenthesised arrow params for multi-binding `v-for` (`((item, index)) =>`), so 22/200 timed fixtures compile to unparseable JS. Its compile times are shown in brackets, unranked. Vue 3.5/3.6, Vize and Verter all emit parseable output for 200/200. Re-checked every run — a fixed release clears the bracket automatically. |

Four surfaces (`jsx-compile`, `format`, `lint`, `component-meta`) also have [no artifact census](docs/methodology.md#artifact-column--fast-vs-did-less) — their rankings are provisional.

<!-- BENCHMARK_RESULTS_START -->

> Auto-updated 2026-07-29 from the **Benchmark** workflow (rolldown-style: measure on CI → commit README on `main` with `[skip ci]`).
> Numbers are reference-only; re-run on your hardware for local relevance.
> Every measured run is warmed (>= 1 discarded pass); the ranking metric is the median. There is no cold column.

#### Ubuntu/Linux · bench

<!-- source: bench-Linux-200-bench.md -->

## Benchmark Results

- **Generated:** 2026-07-29T15:07:21.031Z
- **Fixture:** `fixtures/200` (200 SFCs)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor
- **Node:** v22.23.1
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/30463877627

### Tool versions

| Package | Version |
| --- | --- |
| vue | 3.5.40 |
| @vue/compiler-sfc | 3.5.40 |
| @vue/compiler-sfc-36 | 3.6.0-rc.2 |
| vize | 0.302.0 |
| @vizejs/native | 0.302.0 |
| @verter/native | 0.0.1-beta.3 |
| @fervid/napi | 0.4.1 |
| verter-tsc | 0.0.1-beta.3 |
| @verter/component-meta | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| verter-mcp | 0.0.1-beta.3 |
| @vue/language-server | 3.3.8 |
| @vue/typescript-plugin | 3.3.8 |
| typescript-language-server | 5.3.0 |
| vue-tsc | 3.3.8 |
| vue-component-meta | 3.3.8 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.6 |
| oxfmt | 0.61.0 |
| oxlint | 1.76.0 |
| @biomejs/biome | 2.5.6 |
| typescript | 6.0.3 |
| cli:vize | 0.302.0 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.61.0 |
| cli:oxlint | 1.76.0 |
| cli:biome | 2.5.6 |
| vue-jsx-vapor | 3.2.19 |
| @vue-jsx-vapor/compiler-rs | 3.2.19 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

### Methodology notes

- Primary ranking metric is the **median of measured runs**. Every measured run is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1).
- There is **no cold column**. An unwarmed first run costs a JS compiler ~3.2x its steady state and a native compiler nothing, so ranking on it measures V8 warmup rather than the tool.
- Min / stddev / CV% are reported per row. CV% > 10 is flagged ⚠ — treat that row as noisy (thermal drift or a contended runner), not as a result.
- Status is a marker on the tool NAME, not a column: ⚠ failed a validation gate (time in brackets, unranked) · ❌ error · ⏭ skipped. Per-row detail is in the collapsible **Notes** under each table, and each surface carries a **Tools** legend naming what actually ran.
- Each surface is ONE table. Engine, invocation and threading are row properties, not table splits: a CLI pays process startup on every run (~85ms measured for one native CLI) while an in-process API amortises it, and a thread pool is not a single thread — the row's label and notes say which mode it ran, so compare like with like.
- Rows tagged **(JS)** run the JavaScript TypeScript compiler, untagged typecheck/LSP rows run native tsgo. A cross-engine ratio measures TypeScript's Go rewrite as much as the Vue layer on top of it.
- Surfaces are independent: compile ms is not comparable to jsx-compile/typecheck/lint/format ms.
- jsx-compile uses fixtures/jsx-N (.jsx); SFC compile uses fixtures/N (.vue).
- Compile matrix cells (VDOM/Vapor × production/development × sourcemap on/off) are independent.
- Source map is an explicit, independent dimension applied identically to every compiler — it is never folded into the production/development flag for some tools and not others.
- Primary compile corpus is unique file contents (fixtures/N).
- Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.
- Tool order is **rotated** on every warmup and measured run, so no tool is pinned to the expensive first slot.
- CI does not drop OS page cache; later tools in a job may share a warmer file cache.
- Typecheck/lint/format tools that fail a work gate are unranked (skipped). Typecheck gates require both a script-level and a template-level diagnostic, and are re-verified against the full timed corpus. Lint gates require the planted vue/no-v-html. The format gate requires the tool to actually rewrite the <template> block, so a script-only formatter is not ranked against whole-SFC formatters.
- Compile measures assert non-empty codegen where applicable.
- Vue official compiler is 1T only (worker_threads variants removed).
- LSP: every server resolves from its installed npm package and is skipped when absent — no local-build or working-copy discovery, so each row names a version.
- verter-tsc needs stable tsgo (typescript@7.0.x via typescript-go); harness sets VERTER_TSGO_BIN.
- Diagnostic/format identity across tools is not required for throughput rows.

### SFC compile (unique contents)

Files: **200** · Bytes: **285,701**

Compile results are **grouped by target × environment × source map**, then by comparison class.

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **21.0 ms** | 17.2 ms | 1.9 ms | 9.1% | 1.00x | 609,596 | 9.5k files/s |
| Verter compileMany (session cache) | **26.6 ms** | 22.1 ms | 3.6 ms | 13.7% ⚠ | 1.27x | 541,003 | 7.5k files/s |
| Vize native loop (1T) | **47.6 ms** | 47.5 ms | 0.4 ms | 0.9% | 2.27x | 609,596 | 4.2k files/s |
| Verter compileMany (stateless) | **130.2 ms** | 120.7 ms | 7.2 ms | 5.5% | 6.21x | 541,003 | 1.5k files/s |
| @vue/compiler-sfc 3.5 (1T) | **187.1 ms** | 166.8 ms | 10.6 ms | 5.7% | 8.92x | 670,030 | 1.1k files/s |
| @vue/compiler-sfc 3.6 (1T) | **188.4 ms** | 185.5 ms | 6.1 ms | 3.3% | 8.98x | 670,030 | 1.1k files/s |
| fervid compileSync (1T) ⚠ | (56.9 ms) | (56.6 ms) | – | – | not ranked | (764,880) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (30.4 ms) | (25.4 ms) | – | – | not ranked | (764,880) | – |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, hmr=none, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 17.2 ms, 18.9 ms, 21.6 ms, 21.4 ms, 21.0 ms
- **Verter compileMany (session cache)**: 30.5 ms, 22.1 ms, 26.6 ms, 23.9 ms, 29.8 ms
- **Vize native loop (1T)**: 48.5 ms, 47.6 ms, 47.6 ms, 48.1 ms, 47.5 ms
- **Verter compileMany (stateless)**: 125.1 ms, 120.7 ms, 133.7 ms, 139.0 ms, 130.2 ms
- **@vue/compiler-sfc 3.5 (1T)**: 189.4 ms, 187.1 ms, 186.3 ms, 166.8 ms, 194.5 ms
- **@vue/compiler-sfc 3.6 (1T)**: 189.4 ms, 185.5 ms, 188.4 ms, 186.6 ms, 200.8 ms
- **fervid compileSync (1T)**: 57.4 ms, 56.6 ms, 56.9 ms, 56.8 ms, 57.1 ms
- **fervid compileAsync (4-thread libuv pool)**: 25.8 ms, 25.4 ms, 32.8 ms, 30.4 ms, 30.5 ms

</details>

#### VDOM · development · sourcemap off

Target: `vdom` · Environment: `development` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **16.9 ms** | 16.0 ms | 2.0 ms | 12.1% ⚠ | 1.00x | 609,596 | 11.8k files/s |
| Verter compileMany (session cache) | **27.5 ms** | 18.7 ms | 8.5 ms | 30.9% ⚠ | 1.63x | 663,894 | 7.3k files/s |
| Vize native loop (1T) | **47.9 ms** | 47.6 ms | 1.4 ms | 3.0% | 2.84x | 609,596 | 4.2k files/s |
| Verter compileMany (stateless) | **120.1 ms** | 117.8 ms | 9.7 ms | 8.1% | 7.10x | 663,894 | 1.7k files/s |
| @vue/compiler-sfc 3.5 (1T) | **160.0 ms** | 157.8 ms | 7.1 ms | 4.4% | 9.46x | 656,372 | 1.3k files/s |
| @vue/compiler-sfc 3.6 (1T) | **173.9 ms** | 168.8 ms | 3.0 ms | 1.7% | 10.29x | 656,372 | 1.2k files/s |
| fervid compileSync (1T) ⚠ | (57.1 ms) | (57.1 ms) | – | – | not ranked | (777,008) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (26.9 ms) | (22.9 ms) | – | – | not ranked | (777,008) | – |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=false, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=false, sourceMap=false, hmr=vite, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=false, sourceMap=false, single-threaded
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=false, sourceMap=false
- **fervid compileSync (1T) ⚠**: compileSync isProduction=false, sourceMap=false, single-threaded. ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=false, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 21.2 ms, 16.0 ms, 16.9 ms, 17.4 ms, 16.7 ms
- **Verter compileMany (session cache)**: 41.3 ms, 22.9 ms, 27.5 ms, 28.7 ms, 18.7 ms
- **Vize native loop (1T)**: 48.0 ms, 47.6 ms, 47.8 ms, 47.9 ms, 51.0 ms
- **Verter compileMany (stateless)**: 131.7 ms, 117.8 ms, 118.6 ms, 139.7 ms, 120.1 ms
- **@vue/compiler-sfc 3.5 (1T)**: 175.0 ms, 158.8 ms, 160.0 ms, 165.3 ms, 157.8 ms
- **@vue/compiler-sfc 3.6 (1T)**: 175.6 ms, 176.5 ms, 172.8 ms, 168.8 ms, 173.9 ms
- **fervid compileSync (1T)**: 57.1 ms, 57.3 ms, 57.3 ms, 57.1 ms, 57.1 ms
- **fervid compileAsync (4-thread libuv pool)**: 28.7 ms, 26.9 ms, 25.9 ms, 46.6 ms, 22.9 ms

</details>

#### VAPOR · production · sourcemap off

Target: `vapor` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **17.2 ms** | 16.1 ms | 1.1 ms | 6.3% | 1.00x | 754,214 | 11.6k files/s |
| Verter compileMany (session cache) | **21.6 ms** | 17.7 ms | 2.5 ms | 11.5% ⚠ | 1.26x | 577,324 | 9.3k files/s |
| Vize native loop (1T) | **48.1 ms** | 47.6 ms | 0.3 ms | 0.6% | 2.80x | 754,214 | 4.2k files/s |
| Verter compileMany (stateless) | **123.3 ms** | 115.6 ms | 4.2 ms | 3.4% | 7.18x | 577,324 | 1.6k files/s |
| @vue/compiler-sfc 3.6 (1T) | **304.1 ms** | 290.4 ms | 20.5 ms | 6.7% | 17.72x | 690,938 | 658 files/s |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=true, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=true, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=true, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=true, isProduction=true, sourceMap=false, hmr=none, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=true, sourceMap=false
- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 18.3 ms, 16.1 ms, 18.7 ms, 16.6 ms, 17.2 ms
- **Verter compileMany (session cache)**: 24.2 ms, 17.7 ms, 22.9 ms, 20.3 ms, 21.6 ms
- **Vize native loop (1T)**: 48.3 ms, 47.9 ms, 48.2 ms, 48.1 ms, 47.6 ms
- **Verter compileMany (stateless)**: 115.6 ms, 123.3 ms, 120.2 ms, 123.3 ms, 126.7 ms
- **@vue/compiler-sfc 3.6 (1T)**: 342.5 ms, 311.7 ms, 304.1 ms, 295.6 ms, 290.4 ms

</details>

#### VAPOR · development · sourcemap off

Target: `vapor` · Environment: `development` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **16.5 ms** | 16.1 ms | 1.0 ms | 6.2% | 1.00x | 754,214 | 12.1k files/s |
| Verter compileMany (session cache) | **21.4 ms** | 19.2 ms | 3.2 ms | 15.1% ⚠ | 1.30x | 613,062 | 9.3k files/s |
| Vize native loop (1T) | **47.9 ms** | 47.3 ms | 0.3 ms | 0.7% | 2.90x | 754,214 | 4.2k files/s |
| Verter compileMany (stateless) | **128.8 ms** | 127.2 ms | 1.3 ms | 1.0% | 7.80x | 613,062 | 1.6k files/s |
| @vue/compiler-sfc 3.6 (1T) | **280.8 ms** | 276.5 ms | 8.5 ms | 3.0% | 17.01x | 692,676 | 712 files/s |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=true, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=true, isProduction=false, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=true, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=true, isProduction=false, sourceMap=false, hmr=vite, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=false, sourceMap=false
- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 16.1 ms, 16.5 ms, 18.6 ms, 16.7 ms, 16.2 ms
- **Verter compileMany (session cache)**: 19.2 ms, 25.8 ms, 19.3 ms, 25.5 ms, 21.4 ms
- **Vize native loop (1T)**: 47.6 ms, 47.3 ms, 47.9 ms, 48.0 ms, 48.1 ms
- **Verter compileMany (stateless)**: 127.2 ms, 128.8 ms, 128.8 ms, 130.4 ms, 127.3 ms
- **@vue/compiler-sfc 3.6 (1T)**: 295.3 ms, 280.8 ms, 276.8 ms, 276.5 ms, 290.4 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=unique: 200/200 unique content SHAs. Vize content-hash caches treat identical bodies as free — primary rankings must use unique fixtures (fixtures/N), not fixtures/N-repeated.
- Same in-memory Vue SFC corpus for every variant (compiler flags differ; sources do not).
- Work measured: parse SFC + compile script (if any) + compile template (if any).
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested identically from every compiler in a cell (Vue: parse+compileScript+codegen sourceMap; Vize: compileSfc sourceMap; Verter: compileProfile sourceMap; fervid: FervidJsCompilerOptions sourceMap). It is not folded into the prod/dev flag for some tools and not others.
- Production vs development uses each tool's real semantic knobs only: Vue isProd (hoistStatic + cacheHandlers); Verter isProduction + hmrStrategy; fervid isProduction.
- ⚠ Vize exposes no isProduction on compileSfc, so its production and development rows perform identical work. Stated rather than substituted with a different knob.
- ⚠ fervid compiles <style> blocks inside compileSync — every other row measures parse + script + template only. fervid's rows do strictly more work per file than the rows they are ranked against; there is no option to disable it.
- ⚠ fervid emits non-fatal HTML-strictness diagnostics (NonVoidHtmlElementStartTagWithTrailingSolidus) on self-closing non-void tags such as <div /> and <MyComp />, which Vue's SFC parser accepts — 44 of them on the 200-file corpus. Verified on this corpus: codegen is still complete and correct for those files, so fervid is gated on codegen actually being produced for every file — the same gate every other compiler here gets — rather than on diagnostic silence. Per-run diagnostic totals are captured in the JSON report's meta samples.
- fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).
- fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=4), which is a fixed default of 4 rather than core count. Where the Vize/Verter batch rows scale with cores, that row does not — it is reported, not tuned, because the pool width is fixed before the harness starts.
- 1T / batch / batch-cached rows share the table; the mode is in the row label. A batch pool amortises across a thread pool and a cached session reuses prior analysis, so read same-mode rows against each other.
- Verter session mode keeps a persistent host across warmups and runs, so it is ranked as `batch-cached`, apart from cache-free batch rows.
- Codegen validity gate: every compiler's output is parsed once (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.
- Tool order is rotated on every warmup and measured run; no tool is pinned to first position.
- Ranking metric is the median of measured runs, all taken after >= 1 discarded warmup. No cold column.

</details>

### JSX compile

Files: **200** · Bytes: **38,804**

##### VAPOR — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (vapor) | **3.2 ms** | 3.1 ms | 0.9 ms | 28.3% ⚠ | 1.00x | n/a | 62.2k files/s |
| vue-jsx-vapor/api | **3.5 ms** | 3.5 ms | 4.7 ms | 135.3% ⚠ | 1.09x | n/a | 57.1k files/s |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (vapor)**: Rust/Oxc transform; default vapor mode (see vuejs/vue-jsx-vapor). Same unique .jsx corpus as other JSX rows.
- **vue-jsx-vapor/api**: transformVueJsxVapor() public API (vapor default).

</details>

##### VDOM — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | **2.9 ms** | 2.6 ms | 1.2 ms | 42.8% ⚠ | 1.00x | n/a | 70.0k files/s |
| @vue/babel-plugin-jsx (Babel VDOM) | **135.2 ms** | 106.2 ms | 14.6 ms | 10.8% ⚠ | 47.34x | n/a | 1.5k files/s |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: Rust/Oxc transform with interop: true (VDOM createElementBlock path).
- **@vue/babel-plugin-jsx (Babel VDOM)**: Official Babel Vue JSX plugin (createVNode). Reference VDOM JSX path; not Vapor.

</details>

<details><summary>Methodology</summary>

- Surface is JSX/TSX transform throughput — independent of SFC (.vue) compile.
- Corpus: fixtures/jsx-N unique .jsx files (generate.mjs --with-jsx).
- vue-jsx-vapor: https://github.com/vuejs/vue-jsx-vapor — Vapor Mode of Vue JSX (Oxc/Rust compiler-rs).
- compiler-rs vapor vs interop:true (VDOM) are different codegen targets.
- @vue/babel-plugin-jsx is the classic Babel VDOM JSX path (comparison baseline).
- Do not compare JSX ms to SFC compile ms; different language and pipeline.
- Tool order is ROTATED on every warmup and measured run (not merely alternated), so no tool keeps a fixed position in the sequence.

Raw runs:

- **@vue-jsx-vapor/compiler-rs (vapor)**: 3.1 ms, 3.1 ms, 3.2 ms, 4.8 ms, 4.8 ms
- **vue-jsx-vapor/api**: 3.5 ms, 3.5 ms, 3.5 ms, 14.3 ms, 4.4 ms
- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: 2.6 ms, 2.9 ms, 2.6 ms, 5.3 ms, 4.3 ms
- **@vue/babel-plugin-jsx (Babel VDOM)**: 139.1 ms, 141.8 ms, 123.6 ms, 135.2 ms, 106.2 ms

</details>

### Typecheck

Files: **200** · Bytes: **285,701**

Tools:

- **vue-tsc (JS)** — the official Vue Language Tools CLI — vue-tsc --noEmit -p tsconfig.json, stock JavaScript TypeScript engine.
- **vue-tsc (N)** — the same vue-tsc with typescript aliased to typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Golar typecheck** — golar typecheck — typescript-go with the @golar/vue plugin, pure typecheck.
- **Golar (lint+check)** — golar default mode — lint then typecheck in one pass, not a pure typecheck.
- **Vize** — vize check --tsconfig tsconfig.json (native, Corsa when available).
- **verter-tsc** — verter-tsc --noEmit -p tsconfig.json from the published npm package; runs stable tsgo.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **461.3 ms** | 454.2 ms | 4.5 ms | 1.0% | 1.00x | 0 | 434 files/s |
| verter-tsc | **1.09 s** | 1.07 s | 29.0 ms | 2.6% | 2.37x | 420 | 183 files/s |
| Golar typecheck | **1.58 s** | 1.57 s | 21.7 ms | 1.4% | 3.43x | 0 | 126 files/s |
| Golar (lint+check) | **1.61 s** | 1.55 s | 26.8 ms | 1.7% | 3.49x | 0 | 124 files/s |
| vue-tsc (N) | **2.33 s** | 2.30 s | 23.4 ms | 1.0% | 5.06x | 0 | 86 files/s |
| vue-tsc (JS) | **4.80 s** | 4.72 s | 52.0 ms | 1.1% | 10.41x | 0 | 42 files/s |

<details><summary>Notes</summary>

- **Vize**: vize check . --tsconfig tsconfig.json (native + Corsa when available) | engine: tsgo 7.0.0-dev.20260602.1 (nightly) | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **verter-tsc**: verter-tsc --noEmit -p tsconfig.json · tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **Golar typecheck**: golar typecheck (typescript-go + @golar/vue plugin) | engine: typescript-go 7.0.2 | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **Golar (lint+check)**: golar default mode runs lint then typecheck — not a pure typecheck | engine: typescript-go 7.0.2 | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **vue-tsc (N)**: vue-tsc 3.3.8 with typescript aliased to typescript-native-bridge 6.0.3-bridge.6.tsgo.7.0.2 (TS API 6.0.3 on tsgo 7.0.2, in-process NAPI/FFI) | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **vue-tsc (JS)**: Official Vue Language Tools CLI: vue-tsc --noEmit -p tsconfig.json | engine: TypeScript 6.0.3 (JS) | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓

</details>

<details><summary>Methodology</summary>

- Same on-disk fixture directory and tsconfig for every tool.
- Default check file limit is smaller than compile corpus (typecheck cost scales steeply).
- Each measurement is a full CLI process invocation — every tool here is a CLI, so process startup is paid by all of them equally.
- Warm runs still benefit from OS page cache of source files and node_modules.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.
- Work gate has three parts, all required to be ranked: (1) a script-only planted error, (2) a template-only planted error with strictTemplates — proving the tool actually typechecks templates and does not just run tsc over extracted script blocks, and (3) the same planted bug re-detected in the FULL timed corpus under the timed tsconfig, proving the tool does not degrade at scale.
- Per-tool gate results are shown in Notes as script/template/corpus ✓✗.
- verter-tsc requires stable tsgo (typescript@7.0.x / typescript-go); set via VERTER_TSGO_BIN.
- Two engines are measured in ONE table: rows tagged (JS) run the JavaScript TypeScript compiler, untagged rows run native tsgo. `vue-tsc (JS)` and `vue-tsc (N)` are the SAME vue-tsc and the same Vue layer differing only in engine, so the pair isolates how much of any speed gap is TypeScript's Go rewrite rather than the Vue tooling on top of it — and a cross-engine ratio should be read as exactly that.
- The TNB row lives in envs/tnb as a standalone install, never a root `typescript` override, so the engine swap cannot leak into component-meta, lint or LSP surfaces; it must also print its activation banner or it is unranked.
- Diagnostic equivalence is NOT asserted — this is a throughput benchmark, not a correctness suite.
- golar default mode includes linting; golar typecheck is pure typecheck.
- Allow non-zero exit codes: generated fixtures may surface tool-specific diagnostics.

Raw runs:

- **Vize**: 454.2 ms, 466.1 ms, 458.3 ms, 462.4 ms, 461.3 ms
- **verter-tsc**: 1.09 s, 1.14 s, 1.13 s, 1.09 s, 1.07 s
- **Golar typecheck**: 1.63 s, 1.58 s, 1.58 s, 1.57 s, 1.58 s
- **Golar (lint+check)**: 1.61 s, 1.62 s, 1.62 s, 1.60 s, 1.55 s
- **vue-tsc (N)**: 2.33 s, 2.35 s, 2.36 s, 2.32 s, 2.30 s
- **vue-tsc (JS)**: 4.80 s, 4.83 s, 4.81 s, 4.73 s, 4.72 s

</details>

### Format

Files: **200** · Bytes: **285,701**

Tools:

- **Prettier** — prettier --write over a fresh corpus copy; built-in Vue SFC support, single-threaded by design.
- **Oxfmt** — oxfmt --write — Oxc's Vue-capable formatter, multi-threaded.
- **Vize** — vize fmt --write.
- **Biome format** — biome format --write — multi-threaded, but formats the <script> block only; template and style come back byte-identical, so it is unranked on the format surface.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **115.4 ms** | 113.9 ms | 1.3 ms | 1.1% | 1.00x | n/a | 1.7k files/s |
| Oxfmt | **3.09 s** | 3.03 s | 84.3 ms | 2.7% | 26.81x | n/a | 65 files/s |
| Prettier | **3.93 s** | 3.87 s | 58.8 ms | 1.5% | 34.07x | n/a | 51 files/s |
| Biome format ⚠ | (116.3 ms) | (115.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded
- **Oxfmt**: oxfmt --write (Vue-capable Oxc formatter; fresh copy each run) · multi-threaded (self-reports its thread count) — a gap against single-threaded Prettier is partly thread count, not formatter speed
- **Prettier**: prettier --write *.vue (fresh copy each run) · single-threaded by design
- **Biome format ⚠**: biome format --write . (fresh copy each run) · multi-threaded (Rayon; honours RAYON_NUM_THREADS) · formats the <script> block ONLY — template and style are returned byte-identical | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking

</details>

<details><summary>Methodology</summary>

- Each invocation receives a fresh copy of the same Vue SFC corpus (formatters rewrite files).
- .prettierrc.json and biome.json are copied into every work copy so each tool's config actually resolves (config left in the fixture root is not on the work dir's lookup path). Both configs set the same indent, width, quote, semicolon and trailing-comma choices.
- All four formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.
- Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.
- Template-rewrite work gate: each formatter is run against a messy SFC and must actually change the <template> block, or it is measured but unranked. Biome fails this gate — it formats the <script> block and returns template and style byte-identical, so its wall clock is not comparable to a whole-SFC formatter's.
- Prettier, Oxfmt, and Vize format the whole SFC; Biome covers the script block only. Rule/option parity is not guaranteed for any of them.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize**: 115.4 ms, 115.1 ms, 117.3 ms, 116.1 ms, 113.9 ms
- **Oxfmt**: 3.05 s, 3.09 s, 3.17 s, 3.23 s, 3.03 s
- **Prettier**: 3.87 s, 3.90 s, 3.93 s, 4.01 s, 3.97 s
- **Biome format**: 116.8 ms, 115.3 ms, 117.2 ms, 116.3 ms, 115.5 ms

</details>

### Lint

Files: **200** · Bytes: **285,701**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Biome lint (max threads)** — biome lint on all cores — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — script block only. The plugin's 31 Vue rules all read <script>; <template> is never parsed, so the planted vue/no-v-html is missed; unranked.
- **Oxlint (max threads)** — oxlint on all cores with its vue plugin enabled — script block only, misses the planted vue/no-v-html; unranked.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **74.4 ms** | 71.9 ms | 3.5 ms | 4.7% | 1.00x | n/a | 2.7k files/s |
| Vize lint (1T) | **93.0 ms** | 90.7 ms | 3.5 ms | 3.8% | 1.25x | n/a | 2.1k files/s |
| Verter host lint | **146.6 ms** | 143.3 ms | 2.2 ms | 1.5% | 1.97x | n/a | 1.4k files/s |
| eslint-plugin-vue (1T) | **1.71 s** | 1.58 s | 128.2 ms | 7.5% | 22.95x | n/a | 117 files/s |
| eslint-plugin-vue (CLI) | **3.04 s** | 2.99 s | 83.8 ms | 2.8% | 40.90x | n/a | 66 files/s |
| eslint-plugin-vue (4 workers) | **3.45 s** | 3.37 s | 73.5 ms | 2.1% | 46.34x | n/a | 58 files/s |
| Biome lint (1T) ⚠ | (373.6 ms) | (369.4 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (187.4 ms) | (186.8 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (80.6 ms) | (76.7 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (73.8 ms) | (69.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize lint (max threads)**: vize lint . using default Rayon pool (all cores)
- **Vize lint (1T)**: vize lint . with RAYON_NUM_THREADS=1
- **Verter host lint**: VerterHost.upsert + lint(canonicalId) for each file (if API available)
- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles
- **eslint-plugin-vue (CLI)**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs
- **eslint-plugin-vue (4 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker)
- **Biome lint (1T) ⚠**: biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Biome lint (max threads) ⚠**: biome lint . using the default Rayon pool (all cores) · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Oxlint (1T) ⚠**: oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Oxlint (max threads) ⚠**: oxlint . on the default thread pool (all cores), vue plugin enabled · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking

</details>

<details><summary>Methodology</summary>

- Every tool lints an identical isolated copy of the corpus (work/lint/…), so tools that take an explicit file list and tools that walk a directory see exactly the same files.
- In-process and CLI rows share the table; the row label says which mode ran. A CLI pays process startup on every run (~85ms measured for a native CLI); an in-process API pays it once — read same-mode rows against each other. eslint runs in BOTH modes and is the reference point between them.
- No single invocation mode covers every tool — vize lint is CLI-only, VerterHost.lint is in-process-only — which is why the mode is on the row instead of one mode being dropped.
- eslint-plugin-vue uses flat recommended config generated with fixtures.
- Vize, Biome and Oxlint each get separate 1T and max-threads rows — a thread-count gap is not a linter gap.
- Planted-bug work gate: each tool must report vue/no-v-html (or equivalent) or is unranked. Biome and Oxlint both fail it — each lints the <script> block only and has no template rules, so nothing in <template> is examined.
- Oxlint runs with its vue plugin ON (.oxlintrc.json travels with the corpus and with the gate plant): 31 extra rules over its stock 111, all of them <script> rules for SFC option/macro shape. Template syntax is still never parsed, which is why the plant is missed with the plugin's full rule set active.
- Oxlint ships no standalone executable — it is a NAPI addon loaded into a Node process — so its per-run startup is Node's, while vize and biome launch a native binary. All three pay startup every run; it is not the same constant.
- Biome's script-only view also produces false positives on this corpus: variables declared in <script setup> and used only in <template> are reported as unused. Oxlint avoids that by disabling no-unused-vars for .vue entirely — it reports neither the false positive nor a genuinely unused declaration. Neither tool's diagnostics are comparable to the Vue-aware linters'.
- Allow non-zero exit (style diagnostics do not abort timing).
- Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize lint (max threads)**: 71.9 ms, 72.4 ms, 74.4 ms, 75.2 ms, 80.6 ms
- **Vize lint (1T)**: 91.7 ms, 90.7 ms, 93.0 ms, 98.6 ms, 97.3 ms
- **Verter host lint**: 143.3 ms, 146.0 ms, 146.6 ms, 147.2 ms, 149.3 ms
- **eslint-plugin-vue (1T)**: 1.89 s, 1.69 s, 1.58 s, 1.86 s, 1.71 s
- **eslint-plugin-vue (CLI)**: 3.00 s, 2.99 s, 3.04 s, 3.20 s, 3.05 s
- **eslint-plugin-vue (4 workers)**: 3.45 s, 3.37 s, 3.45 s, 3.58 s, 3.45 s
- **Biome lint (1T)**: 373.6 ms, 371.3 ms, 369.4 ms, 379.0 ms, 381.9 ms
- **Biome lint (max threads)**: 187.0 ms, 187.4 ms, 186.8 ms, 188.1 ms, 193.4 ms
- **Oxlint (1T)**: 80.6 ms, 85.7 ms, 77.2 ms, 76.7 ms, 81.4 ms
- **Oxlint (max threads)**: 69.0 ms, 73.8 ms, 75.4 ms, 72.0 ms, 74.8 ms

</details>

### Component-meta

Files: **100** · Bytes: **142,771**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Meta members | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | **465.4 ms** | 449.9 ms | 12.5 ms | 2.7% | 1.00x | 88 | 215 files/s |
| vue-component-meta | **960.6 ms** | 898.1 ms | 167.9 ms | 17.5% ⚠ | 2.06x | 1,343 | 104 files/s |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **@verter/component-meta**: openComponentMetaSession(root, tsconfig) + getComponentMeta for each .vue file
- **vue-component-meta**: createChecker(tsconfig) + getComponentMeta for each .vue file
- **Vize component-meta ⏭**: No dedicated public component-meta API found on vize/@vizejs/native (declaration emit is a different surface and is not substituted).

</details>

<details><summary>Methodology</summary>

- Extract component public API metadata (props/events/slots where supported).
- Same subset of .vue files for every available tool.
- Schema depth and TypeScript program options may differ by tool — timings are throughput, not equivalence.
- Every tool is driven through its own published entry point. No payload is hand-decoded, and no row is measured through an API it does not ship.
- Each row reports the meta members it materialised. The counts are NOT equivalent between tools and no threshold is applied to them: on this corpus most generated SFCs declare no macros, and the tools differ on whether a component with no declared API still has implicit members. Read the member counts alongside the times rather than treating the ratio as like-for-like.
- Tool order is ROTATED on every warmup and measured run (not merely alternated), so no tool keeps a fixed position in the sequence.
- Tools without a real component-meta API are reported as skipped (no substitute workload).

Raw runs:

- **@verter/component-meta**: 451.0 ms, 449.9 ms, 474.7 ms, 465.4 ms, 476.0 ms
- **vue-component-meta**: 1.28 s, 1.15 s, 960.6 ms, 913.4 ms, 898.1 ms

</details>

### LSP (editor language server)

Files: **1** · Bytes: **745**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **276.9 ms** | 270.7 ms | 6.8 ms | 2.5% | 1.00x | 113 ⚠ | 4 files/s |
| Vize | **359.5 ms** | 350.7 ms | 10.0 ms | 2.8% | 1.30x | 412 | 3 files/s |
| Volar (N) | **1.05 s** | 1.05 s | 19.2 ms | 1.8% | 3.79x | 114 ⚠ | 1 files/s |
| Volar (JS) | **1.11 s** | 1.09 s | 20.7 ms | 1.9% | 4.01x | 114 ⚠ | 1 files/s |

<details><summary>Notes</summary>

- **Verter**: verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | init=5ms · ready=32ms · open→hover=277ms · hoverCold=1ms · hoverWarm=1ms · completion=1ms · definition=1ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) | ⚠ produced 27% of the largest artifact in this class — speed is not comparable
- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.1/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. | engine: tsgo 7.0.0-dev.20260602.1 (nightly) | init=33ms · ready=n/a · open→hover=371ms · hoverCold=6ms · hoverWarm=2ms · completion=1ms · definition=2ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (N)**: Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.6.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 | init=547ms · ready=n/a · open→hover=1091ms · hoverCold=3ms · hoverWarm=3ms · completion=18ms · definition=10ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) | ⚠ produced 28% of the largest artifact in this class — speed is not comparable
- **Volar (JS)**: Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. | engine: TypeScript 6.0.3 (JS) | init=549ms · ready=n/a · open→hover=1098ms · hoverCold=52ms · hoverWarm=2ms · completion=23ms · definition=5ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) | ⚠ produced 28% of the largest artifact in this class — speed is not comparable

</details>

<details><summary>Methodology</summary>

- Apples-to-apples: identical workspace, LspTarget.vue, UTF-16 hover position on `const benchMarker`.
- Hover content is gated in TWO places, both required to be ranked: the `<script setup>` position (must return a TypeScript type) and the `{{ benchMarker }}` TEMPLATE position (must return the auto-unwrapped `string`). The template probe is the Vue-specific one — a server can satisfy the script probe by proxying to a TypeScript server, but resolving a ref's unwrapped type inside an interpolation requires actually modelling the template, which is the job a Vue language server exists to do. A payload naming the symbol with no type, or returning the `Ref<...>` script type, fails.
- The template probe runs OUTSIDE every timed window, so it gates ranking without changing what the latency column measures.
- Each measured run starts a fresh language-server process (tool process cold).
- Volar is measured as the two-process product it is in v3: @vue/language-server has no in-process TypeScript language service, so the harness also starts typescript-language-server with @vue/typescript-plugin, syncs the same .vue buffer to both, and asks both for every feature in parallel — Volar is charged the slower half plus both processes' startup and project load. This is the same wiring VS Code and Neovim implement; without it the Vue server returns null for a <script setup> hover by design.
- Primary ranking column uses didOpen→hover latency (first semantic response after open), taken as the median over warmed runs — each run still starts a fresh server process, so per-process project load is measured every time.
- Hover retry budget is identical for every server (6 attempts, 60s each, same backoff). Retry sleeps fall inside the timed open→hover window, so an asymmetric budget would silently subsidise whichever server got the larger one.
- A fixed 50ms yield after didOpen is inside the timed window for every server alike — it is an additive constant, so it compresses ratios slightly but cannot reorder them.
- Phase breakdown in Notes: initialize, ready (n/a if no server signal), open→hover, hover cold, hover warm median(5), completion, definition.
- workspaceReady is OBSERVED, never waited for. A vendor ready notification (e.g. $/verter/ready) is recorded from session start as a diagnostic and never enters a ranked column — the harness does not pause on it. It previously did, which moved one server's workspace load OUT of the ranked open→hover window while every other server's stayed inside it. Missing signal = n/a, not 0.
- Readiness is established identically for every server and INSIDE the ranked window, via the shared didOpen→hover retry loop — the same content-gated approach the ide-ops suites use. Whoever needs project-load time pays for it in the metric.
- Rows share one table across TypeScript engines, tagged by the same resolver the typecheck surface uses: Volar (JS) runs the JavaScript TypeScript compiler, while Volar (N), Vize and Verter all run native tsgo. A cross-engine ratio measures TypeScript's Go rewrite as much as the Vue layer under test — the (JS) tag is there so you compare like with like.
- Process host (native executable vs Node) is NOT a comparison-class axis here — there is no native Volar and no Node-hosted Verter, so splitting on it would leave every table with one row. It is printed on the row instead.
- Vize is launched from the standalone native server the VS Code extension downloads (version-matched, discovered under VS Code globalStorage, or pinned with VIZE_LSP_BIN) — that is the process the shipped product runs. Where no native server exists, e.g. CI, the npm package's Node entry is used and the row says so, because the Node bootstrap it adds (~35ms/spawn, inside initialize) is not part of the product.
- Completion/definition are best-effort extras; null/n/a does not mean the tool is slower — capability may differ.
- typescript-native-bridge (TNB) is a drop-in typescript package for CLI/tsserver — NOT a Vue LSP in its own right. It appears here only as Volar's TypeScript engine: the `Volar (TNB / tsgo tsdk)` row is the same Volar binary with TNB supplying the tsserver half, so the pair isolates the TS engine from the Vue layer.
- Verter resolves from the installed `verter-lsp` package only; skipped when it is absent.
- VS Code extension host overhead is NOT measured — only the language server stdio protocol.
- Server order is rotated on every warmup and measured run; no server is pinned to first position.

Raw runs:

- **Verter**: 270.7 ms, 276.9 ms, 284.7 ms, 287.7 ms, 276.8 ms
- **Vize**: 375.0 ms, 358.7 ms, 350.7 ms, 359.5 ms, 371.4 ms
- **Volar (N)**: 1.05 s, 1.05 s, 1.05 s, 1.05 s, 1.09 s
- **Volar (JS)**: 1.14 s, 1.11 s, 1.09 s, 1.13 s, 1.10 s

</details>

#### Ubuntu/Linux · cache-demo (not ranking)

<!-- source: bench-Linux-200-repeated-cache-demo.md -->

## Benchmark Results

- **Generated:** 2026-07-29T15:07:25.753Z
- **Fixture:** `fixtures/200-repeated` (200 SFCs)
- **Runs / warmups:** 2 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor
- **Node:** v22.23.1
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/30463877627

### Tool versions

| Package | Version |
| --- | --- |
| vue | 3.5.40 |
| @vue/compiler-sfc | 3.5.40 |
| @vue/compiler-sfc-36 | 3.6.0-rc.2 |
| vize | 0.302.0 |
| @vizejs/native | 0.302.0 |
| @verter/native | 0.0.1-beta.3 |
| @fervid/napi | 0.4.1 |
| verter-tsc | 0.0.1-beta.3 |
| @verter/component-meta | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| verter-mcp | 0.0.1-beta.3 |
| @vue/language-server | 3.3.8 |
| @vue/typescript-plugin | 3.3.8 |
| typescript-language-server | 5.3.0 |
| vue-tsc | 3.3.8 |
| vue-component-meta | 3.3.8 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.6 |
| oxfmt | 0.61.0 |
| oxlint | 1.76.0 |
| @biomejs/biome | 2.5.6 |
| typescript | 6.0.3 |
| cli:vize | 0.302.0 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.61.0 |
| cli:oxlint | 1.76.0 |
| cli:biome | 2.5.6 |
| vue-jsx-vapor | 3.2.19 |
| @vue-jsx-vapor/compiler-rs | 3.2.19 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

### Methodology notes

- Primary ranking metric is the **median of measured runs**. Every measured run is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1).
- There is **no cold column**. An unwarmed first run costs a JS compiler ~3.2x its steady state and a native compiler nothing, so ranking on it measures V8 warmup rather than the tool.
- Min / stddev / CV% are reported per row. CV% > 10 is flagged ⚠ — treat that row as noisy (thermal drift or a contended runner), not as a result.
- Status is a marker on the tool NAME, not a column: ⚠ failed a validation gate (time in brackets, unranked) · ❌ error · ⏭ skipped. Per-row detail is in the collapsible **Notes** under each table, and each surface carries a **Tools** legend naming what actually ran.
- Each surface is ONE table. Engine, invocation and threading are row properties, not table splits: a CLI pays process startup on every run (~85ms measured for one native CLI) while an in-process API amortises it, and a thread pool is not a single thread — the row's label and notes say which mode it ran, so compare like with like.
- Rows tagged **(JS)** run the JavaScript TypeScript compiler, untagged typecheck/LSP rows run native tsgo. A cross-engine ratio measures TypeScript's Go rewrite as much as the Vue layer on top of it.
- Surfaces are independent: compile ms is not comparable to jsx-compile/typecheck/lint/format ms.
- jsx-compile uses fixtures/jsx-N (.jsx); SFC compile uses fixtures/N (.vue).
- Compile matrix cells (VDOM/Vapor × production/development × sourcemap on/off) are independent.
- Source map is an explicit, independent dimension applied identically to every compiler — it is never folded into the production/development flag for some tools and not others.
- Primary compile corpus is unique file contents (fixtures/N).
- Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.
- Tool order is **rotated** on every warmup and measured run, so no tool is pinned to the expensive first slot.
- CI does not drop OS page cache; later tools in a job may share a warmer file cache.
- Typecheck/lint/format tools that fail a work gate are unranked (skipped). Typecheck gates require both a script-level and a template-level diagnostic, and are re-verified against the full timed corpus. Lint gates require the planted vue/no-v-html. The format gate requires the tool to actually rewrite the <template> block, so a script-only formatter is not ranked against whole-SFC formatters.
- Compile measures assert non-empty codegen where applicable.
- Vue official compiler is 1T only (worker_threads variants removed).
- LSP: every server resolves from its installed npm package and is skipped when absent — no local-build or working-copy discovery, so each row names a version.
- verter-tsc needs stable tsgo (typescript@7.0.x via typescript-go); harness sets VERTER_TSGO_BIN.
- Diagnostic/format identity across tools is not required for throughput rows.

### SFC compile (⚠ 199 duplicate bodies — content-hash caches may inflate throughput)

Files: **200** · Bytes: **46,600**

Compile results are **grouped by target × environment × source map**, then by comparison class.

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **5.4 ms** | 5.3 ms | 0.2 ms | 2.8% | 1.00x | 107,800 | 37.1k files/s |
| Verter compileMany (session cache) | **8.6 ms** | 7.0 ms | 2.2 ms | 25.6% ⚠ | 1.59x | 140,600 | 23.4k files/s |
| fervid compileSync (1T) | **8.6 ms** | 8.6 ms | 0.1 ms | 0.7% | 1.60x | 106,600 | 23.2k files/s |
| fervid compileAsync (4-thread libuv pool) | **9.6 ms** | 9.0 ms | 0.9 ms | 9.0% | 1.78x | 106,600 | 20.8k files/s |
| Vize native loop (1T) | **13.8 ms** | 13.7 ms | 0.1 ms | 0.4% | 2.55x | 107,800 | 14.5k files/s |
| @vue/compiler-sfc 3.6 (1T) | **50.4 ms** | 49.6 ms | 1.2 ms | 2.3% | 9.35x | 153,800 | 4.0k files/s |
| @vue/compiler-sfc 3.5 (1T) | **52.3 ms** | 52.1 ms | 0.3 ms | 0.5% | 9.71x | 153,800 | 3.8k files/s |
| Verter compileMany (stateless) | **106.3 ms** | 105.9 ms | 0.6 ms | 0.5% | 19.72x | 140,600 | 1.9k files/s |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **fervid compileSync (1T)**: compileSync isProduction=true, sourceMap=false, single-threaded. ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence.
- **fervid compileAsync (4-thread libuv pool)**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence.
- **Vize native loop (1T)**: compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, hmr=none, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 5.3 ms, 5.5 ms
- **Verter compileMany (session cache)**: 10.1 ms, 7.0 ms
- **fervid compileSync (1T)**: 8.7 ms, 8.6 ms
- **fervid compileAsync (4-thread libuv pool)**: 9.0 ms, 10.2 ms
- **Vize native loop (1T)**: 13.7 ms, 13.8 ms
- **@vue/compiler-sfc 3.6 (1T)**: 51.2 ms, 49.6 ms
- **@vue/compiler-sfc 3.5 (1T)**: 52.5 ms, 52.1 ms
- **Verter compileMany (stateless)**: 105.9 ms, 106.7 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=repeated: 1/200 unique content SHAs. Vize content-hash caches treat identical bodies as free — primary rankings must use unique fixtures (fixtures/N), not fixtures/N-repeated.
- Same in-memory Vue SFC corpus for every variant (compiler flags differ; sources do not).
- Work measured: parse SFC + compile script (if any) + compile template (if any).
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested identically from every compiler in a cell (Vue: parse+compileScript+codegen sourceMap; Vize: compileSfc sourceMap; Verter: compileProfile sourceMap; fervid: FervidJsCompilerOptions sourceMap). It is not folded into the prod/dev flag for some tools and not others.
- Production vs development uses each tool's real semantic knobs only: Vue isProd (hoistStatic + cacheHandlers); Verter isProduction + hmrStrategy; fervid isProduction.
- ⚠ Vize exposes no isProduction on compileSfc, so its production and development rows perform identical work. Stated rather than substituted with a different knob.
- ⚠ fervid compiles <style> blocks inside compileSync — every other row measures parse + script + template only. fervid's rows do strictly more work per file than the rows they are ranked against; there is no option to disable it.
- ⚠ fervid emits non-fatal HTML-strictness diagnostics (NonVoidHtmlElementStartTagWithTrailingSolidus) on self-closing non-void tags such as <div /> and <MyComp />, which Vue's SFC parser accepts — 44 of them on the 200-file corpus. Verified on this corpus: codegen is still complete and correct for those files, so fervid is gated on codegen actually being produced for every file — the same gate every other compiler here gets — rather than on diagnostic silence. Per-run diagnostic totals are captured in the JSON report's meta samples.
- fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).
- fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=4), which is a fixed default of 4 rather than core count. Where the Vize/Verter batch rows scale with cores, that row does not — it is reported, not tuned, because the pool width is fixed before the harness starts.
- 1T / batch / batch-cached rows share the table; the mode is in the row label. A batch pool amortises across a thread pool and a cached session reuses prior analysis, so read same-mode rows against each other.
- Verter session mode keeps a persistent host across warmups and runs, so it is ranked as `batch-cached`, apart from cache-free batch rows.
- Codegen validity gate: every compiler's output is parsed once (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.
- Tool order is rotated on every warmup and measured run; no tool is pinned to first position.
- Ranking metric is the median of measured runs, all taken after >= 1 discarded warmup. No cold column.

</details>

<!-- BENCHMARK_RESULTS_END -->

## IDE operation results

Per-operation editor benchmarks from the `ide` job (`scripts/ide-bench.mjs`). Ranked **per operation**, never pooled — `didOpen→diagnostics` and `foldingRange` differ by orders of magnitude and answer unrelated questions. Not comparable to the timing tables above: different job, different load profile.

Servers here are Volar, **Volar on the TNB/tsgo tsdk**, Vize and Verter. Three caveats apply to these tables specifically:

- **`Volar (TNB / tsgo tsdk)` errors resolving an auto-import completion** — `Debug Failure. False expression. at getCompletionEntryCodeActionsAndSourceDisplay`. Stock Volar resolves the same item. [Details](docs/methodology.md#caveat-the-tnb-engine-swap-fails-an-ide-completion-resolve-operation).
- **Vize may answer with its tsgo backend absent**, with no error in the LSP traffic. [Details](docs/methodology.md#caveat-vizes-type-checking-backend-sometimes-never-starts-and-the-row-still-answers).
- **Both Volar rows are two processes**, charged the slower half on every operation; Vize and Verter are one. [Details](docs/methodology.md#caveat-volars-lsp-memory-row-is-not-the-whole-of-volar-but-the-lsp-timing-row-is).

<!-- IDE_RESULTS_START -->

> Auto-updated 2026-07-29 from the **Benchmark** workflow (`ide` job — per-operation editor benchmarks).
> Ranked **per operation**, never pooled: `didOpen→diagnostics` and `foldingRange` answer unrelated questions.
> Same-VM rule holds within the job; these numbers are not comparable to the timing tables above.

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Ubuntu/Linux · ide ops

<!-- source: ide-scale-Linux.md -->

## IDE operation results

- **Generated:** 2026-07-29T15:06:26.619Z
- **Runner:** linux/x64 · Node v22.23.1
- **Runs / warmups:** 1 / 1

### IDE · scale

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### Time-to-usable @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **223.6 ms** | 223.6 ms | n/a | n/a | 1.00x | 21 | n/a |
| Vize | **363.6 ms** | 363.6 ms | n/a | n/a | 1.63x | 21 | n/a |
| Volar (N) | **1.90 s** | 1.90 s | n/a | n/a | 8.49x | 21 | n/a |
| Volar (JS) | **1.90 s** | 1.90 s | n/a | n/a | 8.50x | 21 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 223.6 ms
- **Vize**: 363.6 ms
- **Volar (N)**: 1.90 s
- **Volar (JS)**: 1.90 s

</details>

#### Completion @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.0 ms** | 1.0 ms | n/a | n/a | 1.00x | 7 | n/a |
| Verter | **166.6 ms** | 166.6 ms | n/a | n/a | 172.53x | 7 | n/a |
| Volar (JS) | **223.4 ms** | 223.4 ms | n/a | n/a | 231.32x | 276 | n/a |
| Volar (N) | **446.8 ms** | 446.8 ms | n/a | n/a | 462.71x | 276 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.0 ms
- **Verter**: 166.6 ms
- **Volar (JS)**: 223.4 ms
- **Volar (N)**: 446.8 ms

</details>

#### References @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **480.6 ms** | 480.6 ms | n/a | n/a | 1.00x | 22 | n/a |
| Volar (N) | **623.3 ms** | 623.3 ms | n/a | n/a | 1.30x | 22 | n/a |
| Vize ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (41.8 ms) | (41.8 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — all 2 references are in a single file — no cross-file search happened | Sample: "2 refs / 1 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 480.6 ms
- **Volar (N)**: 623.3 ms
- **Vize**: 0.6 ms
- **Verter**: 41.8 ms

</details>

#### Hover warm @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **1.2 ms** | 1.2 ms | n/a | n/a | 1.00x | 131 | n/a |
| Volar (N) | **1.5 ms** | 1.5 ms | n/a | n/a | 1.25x | 131 | n/a |
| Vize | **1.8 ms** | 1.8 ms | n/a | n/a | 1.51x | 429 | n/a |
| Verter | **2.2 ms** | 2.2 ms | n/a | n/a | 1.79x | 130 | n/a |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.2 ms
- **Volar (N)**: 1.5 ms
- **Vize**: 1.8 ms
- **Verter**: 2.2 ms

</details>

#### Time-to-usable @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **291.6 ms** | 291.6 ms | n/a | n/a | 1.00x | 101 | n/a |
| Vize | **418.7 ms** | 418.7 ms | n/a | n/a | 1.44x | 101 | n/a |
| Volar (JS) | **2.16 s** | 2.16 s | n/a | n/a | 7.41x | 101 | n/a |
| Volar (N) | **2.27 s** | 2.27 s | n/a | n/a | 7.78x | 101 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Verter**: 291.6 ms
- **Vize**: 418.7 ms
- **Volar (JS)**: 2.16 s
- **Volar (N)**: 2.27 s

</details>

#### Completion @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.2 ms** | 1.2 ms | n/a | n/a | 1.00x | 7 | n/a |
| Volar (JS) | **222.0 ms** | 222.0 ms | n/a | n/a | 188.16x | 356 | n/a |
| Verter | **305.8 ms** | 305.8 ms | n/a | n/a | 259.13x | 7 | n/a |
| Volar (N) | **477.6 ms** | 477.6 ms | n/a | n/a | 404.76x | 356 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.2 ms
- **Volar (JS)**: 222.0 ms
- **Verter**: 305.8 ms
- **Volar (N)**: 477.6 ms

</details>

#### References @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **1.23 s** | 1.23 s | n/a | n/a | 1.00x | 102 | n/a |
| Volar (N) | **2.80 s** | 2.80 s | n/a | n/a | 2.28x | 102 | n/a |
| Vize ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (58.5 ms) | (58.5 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — all 2 references are in a single file — no cross-file search happened | Sample: "2 refs / 1 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.23 s
- **Volar (N)**: 2.80 s
- **Vize**: 0.7 ms
- **Verter**: 58.5 ms

</details>

#### Hover warm @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.8 ms | n/a | n/a | 1.00x | 130 | n/a |
| Volar (JS) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.62x | 131 | n/a |
| Volar (N) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.66x | 131 | n/a |
| Vize | **2.0 ms** | 2.0 ms | n/a | n/a | 2.50x | 429 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.8 ms
- **Volar (JS)**: 1.3 ms
- **Volar (N)**: 1.3 ms
- **Vize**: 2.0 ms

</details>

#### Time-to-usable @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **418.0 ms** | 418.0 ms | n/a | n/a | 1.00x | 501 | n/a |
| Verter | **598.9 ms** | 598.9 ms | n/a | n/a | 1.43x | 501 | n/a |
| Volar (JS) | **3.05 s** | 3.05 s | n/a | n/a | 7.30x | 501 | n/a |
| Volar (N) | **3.61 s** | 3.61 s | n/a | n/a | 8.63x | 501 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 418.0 ms
- **Verter**: 598.9 ms
- **Volar (JS)**: 3.05 s
- **Volar (N)**: 3.61 s

</details>

#### Completion @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.1 ms** | 1.1 ms | n/a | n/a | 1.00x | 7 | n/a |
| Verter | **192.7 ms** | 192.7 ms | n/a | n/a | 174.29x | 7 | n/a |
| Volar (JS) | **286.0 ms** | 286.0 ms | n/a | n/a | 258.62x | 756 | n/a |
| Volar (N) | **647.4 ms** | 647.4 ms | n/a | n/a | 585.38x | 756 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.1 ms
- **Verter**: 192.7 ms
- **Volar (JS)**: 286.0 ms
- **Volar (N)**: 647.4 ms

</details>

#### References @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **16.35 s** | 16.35 s | n/a | n/a | 1.00x | 502 | n/a |
| Volar (N) | **51.27 s** | 51.27 s | n/a | n/a | 3.14x | 502 | n/a |
| Vize ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — all 2 references are in a single file — no cross-file search happened | Sample: "2 refs / 1 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 16.35 s
- **Volar (N)**: 51.27 s
- **Vize**: 0.6 ms
- **Verter**: 1.0 ms

</details>

#### Hover warm @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.0 ms** | 1.0 ms | n/a | n/a | 1.00x | 130 | n/a |
| Volar (JS) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.22x | 131 | n/a |
| Volar (N) | **1.4 ms** | 1.4 ms | n/a | n/a | 1.39x | 131 | n/a |
| Vize | **1.8 ms** | 1.8 ms | n/a | n/a | 1.78x | 429 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 1.0 ms
- **Volar (JS)**: 1.3 ms
- **Volar (N)**: 1.4 ms
- **Vize**: 1.8 ms

</details>

#### Scale × time-to-usable 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.6 | – |
| Volar (N) | – | – | – | – | – | 1.9 | – |
| Vize | – | – | – | – | – | 1.15 | – |
| Verter | – | – | – | – | – | 2.68 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.6 (1901.3 ms → 3051.1 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.9 (1897.5 ms → 3607.8 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | scale factor ×1.15 (363.6 ms → 418.0 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | scale factor ×2.68 (223.6 ms → 598.9 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × completion 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.28 | – |
| Volar (N) | – | – | – | – | – | 1.45 | – |
| Vize | – | – | – | – | – | 1.15 | – |
| Verter | – | – | – | – | – | 1.16 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.28 (223.4 ms → 286.0 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.45 (446.8 ms → 647.4 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | scale factor ×1.15 (1.0 ms → 1.1 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | scale factor ×1.16 (166.6 ms → 192.7 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × references 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 34.01 | – |
| Volar (N) | – | – | – | – | – | 82.25 | – |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×34.01 (480.6 ms → 16347.7 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×82.25 (623.3 ms → 51270.6 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × hover warm 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.04 | – |
| Volar (N) | – | – | – | – | – | 0.94 | – |
| Vize | – | – | – | – | – | 1 | – |
| Verter | – | – | – | – | – | 0.48 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.04 (1.2 ms → 1.3 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×0.94 (1.5 ms → 1.4 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | scale factor ×1 (1.8 ms → 1.8 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | scale factor ×0.48 (2.2 ms → 1.0 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows whose value is a RATIO (`Scale × …`) have an empty median by design: the measurement is a factor, not a duration, and it is printed in the artifact column with the pair it came from. A ratio row is never given an invented time so that it can be ranked.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Typing loop (composite)

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⏭ | skipped | – | – | – | – | – | – |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |
| Vize ⏭ | skipped | – | – | – | – | – | – |
| Verter ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⏭**: ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server.
- **Volar (N) ⏭**: ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server.
- **Vize ⏭**: ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server.
- **Verter ⏭**: ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server.

</details>

<details><summary>Methodology</summary>

- Sum of three medians: edit-loop/diagnostics-error + edit-loop/hover-after-edit + completion/completion-script-member.
- Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.
- A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.
- Servers that failed a component are shown in brackets with the failing part named.
- Composites share one table across TypeScript engines with (JS)-tagged rows, exactly as the per-operation tables do — a JS-engine composite against a tsgo composite is an engine comparison, not a server comparison.

Raw runs:


</details>

<!-- IDE_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports: [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
