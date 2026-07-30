# Vue Toolchain Benchmarks

Throughput benchmarks for the Vue toolchain, measured on one Linux CI runner per run and published below. Layout and CI pattern follow [rolldown/benchmarks](https://github.com/rolldown/benchmarks): measure on CI, commit the tables back to this file. This page carries the **summary tables only** — each table links its full report (methodology, per-row notes, raw runs, and the environment it ran on) in [`docs/results/`](docs/results/).

<!-- RESULTS_INDEX_START -->

**Results index** — summary tables below; every entry links its FULL report (methodology, per-row notes, raw runs, environment) in [`docs/results/`](docs/results/):

- **[Reference results](#reference-results)** — [how to read](docs/results/notes-benchmark.md) · [bench](docs/results/bench-Linux-200-bench.md) · [cache-demo (not ranking)](docs/results/bench-Linux-200-repeated-cache-demo.md)
- **[IDE operation results](#ide-operation-results)** — [how to read](docs/results/notes-ide.md) · [ide ops](docs/results/ide-Linux.md) · [ide-scale](docs/results/ide-scale-Linux.md)
- **[Real-world project results](#real-world-project-results)** — [how to read](docs/results/notes-real-world.md) · [ant-design-vue](docs/results/real-world-Linux-ant-design-vue.md) · [element-plus](docs/results/real-world-Linux-element-plus.md) · [hoppscotch](docs/results/real-world-Linux-hoppscotch.md) · [naive-ui](docs/results/real-world-Linux-naive-ui.md) · [nuxt-ui](docs/results/real-world-Linux-nuxt-ui.md) · [primevue](docs/results/real-world-Linux-primevue.md) · [quasar](docs/results/real-world-Linux-quasar.md) · [vue-vben-admin](docs/results/real-world-Linux-vue-vben-admin.md) · [vuetify](docs/results/real-world-Linux-vuetify.md)

<!-- RESULTS_INDEX_END -->

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
| **Bundle** (equal-terms build) | Vite 8 (Rolldown) · Vite 7 (Rollup) · Rolldown · Rspack · webpack 5, each × its available Vue integrations |
| **HMR + dev server** | the same Vite-family cells: dev cold start and hot-update turnaround |
| **Project build** (own config) | a real project's own `vite build`, baseline vs `unplugin-vue` · `@vizejs/vite-plugin` · `@verter/unplugin` |
| **Project test** (own suite) | a real project's own Vitest suite, same four |
| **Project typecheck** (own tsconfig) | a real project checked in place: `vue-tsc` on the JS engine (baseline) and on TNB/tsgo · `verter-tsc` · Vize — engines ranked in separate tables |
| **Project component-meta** (own tsconfig) | a real project's components read in place: `vue-component-meta` (baseline) · `@verter/component-meta` — gated on components resolved and on per-component prop coverage |
| **Project LSP** (project as workspace) | a real project as the editor workspace: Volar (JS engine and TNB/tsgo tsdk) · Verter · Vize — ranked per operation (`didOpen → diagnostics`, `hover`) and per engine |
| **Memory / CPU** | all of the above, sampled separately — published in [MEMORY.md](./MEMORY.md) |

The last six rows run against **real open-source Vue projects** (Element Plus, Naive UI, Vuetify, PrimeVue, Quasar, Ant Design Vue, Hoppscotch, Vue Vben Admin, Nuxt UI) at pinned refs, alongside `compile`, `format` and `lint`. See [Real-world corpora](docs/methodology.md#real-world-corpora) — and note that they are ranked *within* a corpus, never across, that a corpus above `--file-limit` is truncated to an alphabetical prefix and says so, and that a project shipping no lockfile has its checkout-dependent surfaces unranked because the dependency set is not reproducible.

## How to read the tables

📖 **[How to read the tables →](docs/how-to-read.md)** — the ranking metric (median of warmed runs), the ⚠/❌/⏭ name markers, and why a fast tool can be *measured but unranked* (Biome, Oxlint). Corpus design, work gates, comparison classes, caveats: **[docs/methodology.md](docs/methodology.md)**.

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

> Auto-updated 2026-07-30 from the **Benchmark** workflow (rolldown-style: measure on CI → commit README on `main` with `[skip ci]`).
> Numbers are reference-only; re-run on your hardware for local relevance.
> Every measured run is warmed (>= 1 discarded pass); the ranking metric is the median. There is no cold column.

<!-- notes: notes-benchmark.md -->

> 📖 **[How to read these tables →](docs/results/notes-benchmark.md)** — ranking rules, standing notes and the tools legend shared by every block in this section.

#### Ubuntu/Linux · bench

<!-- source: bench-Linux-200-bench.md -->

> 📄 **[Full details →](docs/results/bench-Linux-200-bench.md)** — methodology, per-row notes and raw runs (22 collapsed block(s) moved out of this page).



### SFC compile (unique contents)

Files: **200** · Bytes: **285,701**

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **20.6 ms** | 19.3 ms | 1.3 ms | 6.5% | 1.00x | 609,596 | 9.7k files/s |
| Verter compileMany (session cache) | **30.8 ms** | 29.3 ms | 4.6 ms | 15.0% ⚠ | 1.49x | 541,003 | 6.5k files/s |
| Vize native loop (1T) | **46.8 ms** | 41.3 ms | 3.1 ms | 6.6% | 2.27x | 609,596 | 4.3k files/s |
| Verter compileMany (stateless) | **141.6 ms** | 138.8 ms | 4.6 ms | 3.2% | 6.86x | 541,003 | 1.4k files/s |
| @vue/compiler-sfc 3.5 (1T) | **187.5 ms** | 181.1 ms | 8.3 ms | 4.4% | 9.08x | 670,030 | 1.1k files/s |
| @vue/compiler-sfc 3.6 (1T) | **196.5 ms** | 187.7 ms | 15.3 ms | 7.8% | 9.52x | 670,030 | 1.0k files/s |
| fervid compileSync (1T) ⚠ | (47.4 ms) | (46.5 ms) | – | – | not ranked | (764,880) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (29.9 ms) | (26.2 ms) | – | – | not ranked | (764,880) | – |

#### VDOM · development · sourcemap off

Target: `vdom` · Environment: `development` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **16.0 ms** | 15.6 ms | 0.4 ms | 2.4% | 1.00x | 609,596 | 12.5k files/s |
| Verter compileMany (session cache) | **27.2 ms** | 20.3 ms | 4.7 ms | 17.4% ⚠ | 1.69x | 663,894 | 7.4k files/s |
| Vize native loop (1T) | **42.7 ms** | 40.5 ms | 1.2 ms | 2.9% | 2.66x | 609,596 | 4.7k files/s |
| Verter compileMany (stateless) | **130.7 ms** | 127.7 ms | 5.5 ms | 4.2% | 8.15x | 663,894 | 1.5k files/s |
| @vue/compiler-sfc 3.5 (1T) | **156.8 ms** | 152.0 ms | 6.0 ms | 3.8% | 9.78x | 656,372 | 1.3k files/s |
| @vue/compiler-sfc 3.6 (1T) | **164.3 ms** | 155.1 ms | 5.3 ms | 3.3% | 10.24x | 656,372 | 1.2k files/s |
| fervid compileSync (1T) ⚠ | (46.1 ms) | (45.6 ms) | – | – | not ranked | (777,008) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (26.0 ms) | (24.1 ms) | – | – | not ranked | (777,008) | – |

#### VAPOR · production · sourcemap off

Target: `vapor` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **17.2 ms** | 16.9 ms | 0.8 ms | 4.9% | 1.00x | 754,214 | 11.6k files/s |
| Verter compileMany (session cache) | **22.4 ms** | 18.5 ms | 5.1 ms | 22.9% ⚠ | 1.30x | 577,324 | 8.9k files/s |
| Vize native loop (1T) | **43.8 ms** | 43.4 ms | 0.4 ms | 1.0% | 2.55x | 754,214 | 4.6k files/s |
| Verter compileMany (stateless) | **130.4 ms** | 126.5 ms | 2.2 ms | 1.7% | 7.59x | 577,324 | 1.5k files/s |
| @vue/compiler-sfc 3.6 (1T) | **302.7 ms** | 293.2 ms | 15.5 ms | 5.1% | 17.61x | 690,938 | 661 files/s |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – |

#### VAPOR · development · sourcemap off

Target: `vapor` · Environment: `development` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **16.7 ms** | 16.6 ms | 0.2 ms | 1.1% | 1.00x | 754,214 | 12.0k files/s |
| Verter compileMany (session cache) | **23.0 ms** | 16.3 ms | 3.2 ms | 13.9% ⚠ | 1.38x | 613,062 | 8.7k files/s |
| Vize native loop (1T) | **44.2 ms** | 43.9 ms | 0.9 ms | 1.9% | 2.64x | 754,214 | 4.5k files/s |
| Verter compileMany (stateless) | **133.7 ms** | 131.3 ms | 1.9 ms | 1.4% | 8.00x | 613,062 | 1.5k files/s |
| @vue/compiler-sfc 3.6 (1T) | **280.7 ms** | 273.0 ms | 5.7 ms | 2.0% | 16.79x | 692,676 | 713 files/s |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – |

### JSX compile

Files: **200** · Bytes: **38,804**

##### VAPOR — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (vapor) | **3.0 ms** | 2.6 ms | 0.2 ms | 7.9% | 1.00x | n/a | 66.0k files/s |
| vue-jsx-vapor/api | **3.2 ms** | 3.1 ms | 0.1 ms | 2.6% | 1.06x | n/a | 62.5k files/s |

##### VDOM — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | **2.3 ms** | 2.2 ms | 0.3 ms | 12.1% ⚠ | 1.00x | n/a | 86.0k files/s |
| @vue/babel-plugin-jsx (Babel VDOM) | **129.2 ms** | 114.5 ms | 16.8 ms | 13.0% ⚠ | 55.57x | n/a | 1.5k files/s |

### Typecheck

Files: **200** · Bytes: **285,701**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **414.9 ms** | 410.4 ms | 16.2 ms | 3.9% | 1.00x | 0 | 482 files/s |
| verter-tsc | **1.03 s** | 1.01 s | 11.7 ms | 1.1% | 2.48x | 420 | 195 files/s |
| Golar typecheck | **1.48 s** | 1.46 s | 11.1 ms | 0.7% | 3.57x | 0 | 135 files/s |
| Golar (lint+check) | **1.49 s** | 1.48 s | 10.1 ms | 0.7% | 3.59x | 0 | 134 files/s |
| vue-tsc (N) | **2.18 s** | 2.16 s | 16.6 ms | 0.8% | 5.26x | 0 | 92 files/s |
| vue-tsc (JS) | **4.49 s** | 4.47 s | 21.6 ms | 0.5% | 10.83x | 0 | 44 files/s |

### Format

Files: **200** · Bytes: **285,701**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **127.3 ms** | 125.0 ms | 10.5 ms | 8.2% | 1.00x | n/a | 1.6k files/s |
| Oxfmt | **3.04 s** | 3.00 s | 37.2 ms | 1.2% | 23.89x | n/a | 66 files/s |
| Prettier | **3.74 s** | 3.66 s | 38.4 ms | 1.0% | 29.38x | n/a | 53 files/s |
| Biome format ⚠ | (106.3 ms) | (104.8 ms) | – | – | not ranked | – | – |

### Lint

Files: **200** · Bytes: **285,701**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **62.9 ms** | 61.4 ms | 2.2 ms | 3.5% | 1.00x | n/a | 3.2k files/s |
| Vize lint (1T) | **77.4 ms** | 75.4 ms | 2.3 ms | 2.9% | 1.23x | n/a | 2.6k files/s |
| Verter host lint | **154.4 ms** | 151.1 ms | 4.1 ms | 2.7% | 2.46x | n/a | 1.3k files/s |
| eslint-plugin-vue (1T) | **1.68 s** | 1.55 s | 101.8 ms | 6.0% | 26.77x | n/a | 119 files/s |
| eslint-plugin-vue (CLI) | **2.84 s** | 2.80 s | 34.0 ms | 1.2% | 45.15x | n/a | 70 files/s |
| eslint-plugin-vue (4 workers) | **3.27 s** | 3.26 s | 14.8 ms | 0.5% | 52.04x | n/a | 61 files/s |
| Biome lint (1T) ⚠ | (331.1 ms) | (329.5 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (168.7 ms) | (167.3 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (67.8 ms) | (66.7 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (64.0 ms) | (59.8 ms) | – | – | not ranked | – | – |

### Component-meta

Files: **100** · Bytes: **142,771**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Meta members | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | **513.2 ms** | 497.9 ms | 16.4 ms | 3.2% | 1.00x | 88 | 195 files/s |
| vue-component-meta | **927.6 ms** | 845.0 ms | 174.4 ms | 18.8% ⚠ | 1.81x | 1,343 | 108 files/s |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

### LSP (editor language server)

Files: **1** · Bytes: **745**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **295.3 ms** | 286.8 ms | 10.7 ms | 3.6% | 1.00x | 113 ⚠ | 3 files/s |
| Vize | **362.4 ms** | 358.6 ms | 5.3 ms | 1.5% | 1.23x | 412 | 3 files/s |
| Volar (N) | **992.9 ms** | 979.4 ms | 8.6 ms | 0.9% | 3.36x | 114 ⚠ | 1 files/s |
| Volar (JS) | **1.02 s** | 1.01 s | 50.2 ms | 4.9% | 3.46x | 114 ⚠ | 1 files/s |



#### Ubuntu/Linux · cache-demo (not ranking)

<!-- source: bench-Linux-200-repeated-cache-demo.md -->

> 📄 **[Full details →](docs/results/bench-Linux-200-repeated-cache-demo.md)** — methodology, per-row notes and raw runs (3 collapsed block(s) moved out of this page).



### SFC compile (⚠ 199 duplicate bodies — content-hash caches may inflate throughput)

Files: **200** · Bytes: **46,600**

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **4.1 ms** | 4.0 ms | 0.2 ms | 4.1% | 1.00x | 107,800 | 48.2k files/s |
| fervid compileSync (1T) | **6.7 ms** | 6.6 ms | 0.0 ms | 0.5% | 1.61x | 106,600 | 30.0k files/s |
| Verter compileMany (session cache) | **8.7 ms** | 8.1 ms | 0.8 ms | 9.6% | 2.10x | 140,600 | 23.0k files/s |
| fervid compileAsync (4-thread libuv pool) | **9.8 ms** | 9.1 ms | 1.1 ms | 11.1% ⚠ | 2.37x | 106,600 | 20.3k files/s |
| Vize native loop (1T) | **10.3 ms** | 10.1 ms | 0.2 ms | 2.1% | 2.48x | 107,800 | 19.5k files/s |
| @vue/compiler-sfc 3.6 (1T) | **39.5 ms** | 36.7 ms | 3.9 ms | 9.9% | 9.52x | 153,800 | 5.1k files/s |
| @vue/compiler-sfc 3.5 (1T) | **39.5 ms** | 37.4 ms | 3.1 ms | 7.8% | 9.54x | 153,800 | 5.1k files/s |
| Verter compileMany (stateless) | **112.1 ms** | 108.6 ms | 5.0 ms | 4.4% | 27.05x | 140,600 | 1.8k files/s |



<!-- BENCHMARK_RESULTS_END -->

## IDE operation results

Per-operation editor benchmarks from the `ide` job (`scripts/ide-bench.mjs`). Ranked **per operation**, never pooled — `didOpen→diagnostics` and `foldingRange` differ by orders of magnitude and answer unrelated questions. Not comparable to the timing tables above: different job, different load profile.

Servers here are Volar, **Volar on the TNB/tsgo tsdk**, Vize and Verter. Three caveats apply to these tables specifically:

- **`Volar (TNB / tsgo tsdk)` errors resolving an auto-import completion** — `Debug Failure. False expression. at getCompletionEntryCodeActionsAndSourceDisplay`. Stock Volar resolves the same item. [Details](docs/methodology.md#caveat-the-tnb-engine-swap-fails-an-ide-completion-resolve-operation).
- **Vize may answer with its tsgo backend absent**, with no error in the LSP traffic. [Details](docs/methodology.md#caveat-vizes-type-checking-backend-sometimes-never-starts-and-the-row-still-answers).
- **Both Volar rows are two processes**, charged the slower half on every operation; Vize and Verter are one. [Details](docs/methodology.md#caveat-volars-lsp-memory-row-is-not-the-whole-of-volar-but-the-lsp-timing-row-is).

<!-- IDE_RESULTS_START -->

> Auto-updated 2026-07-30 from the **Benchmark** workflow (`ide` job — per-operation editor benchmarks).
> Ranked **per operation**, never pooled: `didOpen→diagnostics` and `foldingRange` answer unrelated questions.
> Same-VM rule holds within the job; these numbers are not comparable to the timing tables above.

<!-- notes: notes-ide.md -->

> 📖 **[How to read these tables →](docs/results/notes-ide.md)** — ranking rules, standing notes and the tools legend shared by every block in this section.

#### Ubuntu/Linux · ide ops

<!-- source: ide-Linux.md -->

> 📄 **[Full details →](docs/results/ide-Linux.md)** — methodology, per-row notes and raw runs (79 collapsed block(s) moved out of this page).

## IDE operation results

- **Generated:** 2026-07-29T16:07:26.544Z
- **Runner:** linux/x64 · Node v22.23.1
- **Runs / warmups:** 3 / 1

### IDE · background

Files: **1** · Bytes: **0**

#### Semantic tokens (full)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 0.6 ms | 0.0 ms | 1.9% | 1.00x | 15 | n/a |
| Volar (N) | **642.1 ms** | 639.7 ms | 12.7 ms | 2.0% | 1092.98x | 48 | n/a |
| Volar (JS) | **736.8 ms** | 729.2 ms | 28.9 ms | 3.9% | 1254.20x | 48 | n/a |
| Verter ⚠ | (31.4 ms) | (26.6 ms) | – | – | not ranked | – | – |

#### Semantic tokens (delta after edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (1.1 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | – | – |

#### Document symbols (outline)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 0.4 ms | 0.0 ms | 7.3% | 1.00x | 12 | n/a |
| Volar (N) | **16.8 ms** | 16.6 ms | 0.2 ms | 1.0% | 42.81x | 25 | n/a |
| Volar (JS) | **17.4 ms** | 17.2 ms | 1.6 ms | 9.0% | 44.27x | 25 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (2) | – |

#### Document highlight (caret move)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 6.0% | 1.00x | 4 | n/a |
| Verter | **0.3 ms** | 0.2 ms | 0.0 ms | 15.7% ⚠ | 1.28x | 4 | n/a |
| Volar (JS) | **17.5 ms** | 17.4 ms | 0.2 ms | 0.9% | 83.38x | 5 | n/a |
| Volar (N) | **29.7 ms** | 29.5 ms | 1.3 ms | 4.2% | 141.52x | 5 | n/a |

#### Inlay hints (document range)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 2.5% | 1.00x | 2 | n/a |
| Volar (JS) | **68.3 ms** | 68.1 ms | 0.4 ms | 0.6% | 152.99x | 14 | n/a |
| Volar (N) | **140.0 ms** | 134.9 ms | 3.6 ms | 2.6% | 313.41x | 14 | n/a |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | – | – |

#### Folding ranges

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 14.2% ⚠ | 1.00x | 2 | n/a |
| Verter | **0.3 ms** | 0.2 ms | 0.1 ms | 20.4% ⚠ | 1.52x | 7 | n/a |
| Volar (JS) | **10.0 ms** | 9.3 ms | 3.3 ms | 28.6% ⚠ | 56.65x | 13 | n/a |
| Volar (N) | **21.0 ms** | 20.5 ms | 0.5 ms | 2.4% | 119.39x | 13 | n/a |

### IDE · completion

Files: **1** · Bytes: **0**

#### Completion: script member

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.8 ms | 0.0 ms | 4.7% | 1.00x | 3 | n/a |
| Volar (N) | **3.0 ms** | 2.7 ms | 0.4 ms | 13.6% ⚠ | 3.59x | 3 | n/a |
| Volar (JS) | **38.9 ms** | 3.1 ms | 20.7 ms | 76.6% ⚠ | 46.12x | 3 | n/a |
| Vize ⚠ | (5.01 s) | (5.01 s) | – | – | not ranked | – | – |

#### Completion: component tag &lt;Ch

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **33.7 ms** | 32.5 ms | 9.6 ms | 25.0% ⚠ | 1.00x | 1,193 | n/a |
| Volar (JS) | **42.1 ms** | 40.6 ms | 2.4 ms | 5.6% | 1.25x | 192 | n/a |
| Volar (N) | **65.6 ms** | 58.9 ms | 4.3 ms | 6.8% | 1.95x | 192 | n/a |
| Vize ⚠ | (5.01 s) | (5.00 s) | – | – | not ranked | – | – |

#### Completion: prop name &lt;C :

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **5.2 ms** | 1.7 ms | 2.0 ms | 50.5% ⚠ | 1.00x | 16 | n/a |
| Volar (N) | **17.0 ms** | 14.2 ms | 2.0 ms | 12.0% ⚠ | 3.30x | 26 | n/a |
| Volar (JS) | **118.0 ms** | 108.3 ms | 26.3 ms | 20.5% ⚠ | 22.90x | 26 | n/a |
| Vize ⚠ | (5.01 s) | (5.01 s) | – | – | not ranked | – | – |

#### Completion: event name &lt;C @

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **8.2 ms** | 7.8 ms | 0.4 ms | 5.3% | 1.00x | 25 | n/a |
| Volar (JS) | **10.8 ms** | 10.7 ms | 30.8 ms | 108.1% ⚠ | 1.32x | 25 | n/a |
| Vize ⚠ | (5.01 s) | (5.01 s) | – | – | not ranked | – | – |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

#### Completion: directive v-

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.7 ms** | 15.7 ms | 0.9 ms | 5.5% | 1.00x | 498 | n/a |
| Volar (JS) | **28.2 ms** | 25.1 ms | 2.5 ms | 9.1% | 1.68x | 498 | n/a |
| Vize ⚠ | (5.00 s) | (5.00 s) | – | – | not ranked | – | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (3) | – |

#### Completion: slot name &lt;template #

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 0.3 ms | 0.2 ms | 49.1% ⚠ | 1.00x | 2 | n/a |
| Volar (N) | **14.6 ms** | 14.3 ms | 0.8 ms | 5.6% | 50.64x | 500 | n/a |
| Volar (JS) | **71.2 ms** | 15.2 ms | 43.5 ms | 69.7% ⚠ | 247.14x | 500 | n/a |
| Vize ⚠ | (5.01 s) | (5.00 s) | – | – | not ranked | – | – |

#### Completion: auto-import

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **31.7 ms** | 29.3 ms | 4.7 ms | 14.1% ⚠ | 1.00x | 1,077 | n/a |
| Volar (N) | **52.8 ms** | 52.3 ms | 3.1 ms | 5.8% | 1.67x | 1,077 | n/a |
| Vize ⚠ | (5.01 s) | (5.01 s) | – | – | not ranked | – | – |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (9) | – |

#### Resolve: auto-import edit

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **24.4 ms** | 24.0 ms | 0.3 ms | 1.0% | 1.00x | 241 | n/a |
| Volar (JS) | **39.9 ms** | 35.6 ms | 6.1 ms | 14.8% ⚠ | 1.64x | 241 | n/a |
| Vize ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

#### Resolve: script member detail

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **2.4 ms** | 2.2 ms | 0.1 ms | 4.2% | 1.00x | 25 | n/a |
| Volar (JS) | **2.7 ms** | 2.5 ms | 0.6 ms | 19.2% ⚠ | 1.14x | 25 | n/a |
| Verter | **4.3 ms** | 4.3 ms | 0.5 ms | 11.2% ⚠ | 1.83x | 25 | n/a |
| Vize ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

### IDE · edit-loop

Files: **1** · Bytes: **0**

#### didOpen -> first diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 0 | – |
| Volar (N) | – | – | – | – | – | 0 | – |
| Vize | – | – | – | – | – | 0 | – |
| Verter | – | – | – | – | – | 0 | – |

#### Edit plants type error -> reported

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **129.9 ms** | 80.7 ms | 30.9 ms | 26.6% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **381.3 ms** | 377.8 ms | 2.2 ms | 0.6% | 2.93x | 1 | n/a |
| Volar (N) | **394.4 ms** | 393.5 ms | 1.0 ms | 0.3% | 3.04x | 1 | n/a |
| Verter | **498.4 ms** | 480.7 ms | 11.5 ms | 2.3% | 3.84x | 1 | n/a |

#### Edit fixes it -> diagnostic clears

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **141.3 ms** | 90.1 ms | 31.3 ms | 24.8% ⚠ | 1.00x | 0 | n/a |
| Volar (N) | **393.6 ms** | 392.9 ms | 9.2 ms | 2.3% | 2.79x | 0 | n/a |
| Verter | **429.9 ms** | 417.0 ms | 69.5 ms | 15.0% ⚠ | 3.04x | 0 | n/a |
| Volar (JS) | **459.5 ms** | 456.9 ms | 1.8 ms | 0.4% | 3.25x | 0 | n/a |

#### Hover after retype -> NEW type

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **35.4 ms** | 35.2 ms | 0.8 ms | 2.1% | 1.00x | 47 | n/a |
| Volar (JS) | **51.3 ms** | 50.6 ms | 3.3 ms | 6.3% | 1.45x | 47 | n/a |
| Verter | **53.2 ms** | 50.6 ms | 4.3 ms | 8.0% | 1.50x | 40 | n/a |
| Vize | **138.4 ms** | 96.4 ms | 24.5 ms | 19.6% ⚠ | 3.91x | 111 | n/a |

#### ... same hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **35.4 ms** | 35.2 ms | 0.8 ms | 2.1% | 1.00x | 1 | n/a |
| Volar (JS) | **51.3 ms** | 50.6 ms | 3.3 ms | 6.3% | 1.45x | 1 | n/a |
| Verter | **53.2 ms** | 50.6 ms | 4.3 ms | 8.0% | 1.50x | 1 | n/a |
| Vize | **138.4 ms** | 96.4 ms | 24.5 ms | 19.6% ⚠ | 3.91x | 1 | n/a |

#### Steady state: edits 1-5 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **32.5 ms** | 31.6 ms | 15.8 ms | 38.4% ⚠ | 1.00x | n/a | n/a |
| Volar (N) | **37.5 ms** | 37.5 ms | 1.2 ms | 3.1% | 1.15x | n/a | n/a |
| Volar (JS) | **39.7 ms** | 39.2 ms | 1.1 ms | 2.7% | 1.22x | n/a | n/a |
| Vize | **139.4 ms** | 136.9 ms | 3.6 ms | 2.5% | 4.29x | n/a | n/a |

#### Steady state: edits 6-10 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **32.5 ms** | 30.9 ms | 0.9 ms | 2.9% | 1.00x | -5 | n/a |
| Verter | **32.7 ms** | 27.6 ms | 4.1 ms | 12.8% ⚠ | 1.01x | -24 | n/a |
| Volar (JS) | **33.3 ms** | 32.8 ms | 0.3 ms | 1.0% | 1.03x | -6 | n/a |
| Vize | **139.4 ms** | 138.4 ms | 0.6 ms | 0.5% | 4.29x | -4 | n/a |

#### Child prop retype -> Parent diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **224.7 ms** | 215.5 ms | 29.5 ms | 12.5% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **377.9 ms** | 376.1 ms | 1.1 ms | 0.3% | 1.68x | 1 | n/a |
| Volar (N) | **378.2 ms** | 378.0 ms | 0.7 ms | 0.2% | 1.68x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

#### Child prop retype -> Parent hover

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **58.4 ms** | 57.5 ms | 8.5 ms | 13.5% ⚠ | 1.00x | 42 | n/a |
| Volar (JS) | **104.2 ms** | 103.3 ms | 1.7 ms | 1.7% | 1.79x | 42 | n/a |
| Vize ⚠ | (224.7 ms) | (221.3 ms) | – | – | not ranked | (113) | – |
| Verter ⚠ | (4.8 ms) | (4.6 ms) | – | – | not ranked | (42) | – |

#### ... Parent hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **58.4 ms** | 57.5 ms | 8.5 ms | 13.5% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **104.2 ms** | 103.3 ms | 1.7 ms | 1.7% | 1.79x | 1 | n/a |
| Verter | **433.8 ms** | 432.0 ms | 83.6 ms | 17.4% ⚠ | 7.43x | 3 | n/a |
| Vize ⚠ | (3.07 s) | (3.07 s) | – | – | not ranked | (15) | – |

### IDE · navigation

Files: **1** · Bytes: **0**

#### Definition: &lt;ChildCard/> tag

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.6 ms | 0.3 ms | 32.8% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **9.0 ms** | 8.9 ms | 0.3 ms | 3.2% | 10.70x | 1 | n/a |
| Volar (JS) | **195.3 ms** | 185.5 ms | 9.1 ms | 4.7% | 232.19x | 1 | n/a |
| Vize ⚠ | (3.4 ms) | (3.3 ms) | – | – | not ranked | – | – |

#### Definition: imported fn (script)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 0.4 ms | 0.0 ms | 3.8% | 1.00x | 1 | n/a |
| Volar (JS) | **7.0 ms** | 6.7 ms | 0.3 ms | 4.0% | 17.37x | 1 | n/a |
| Volar (N) | **25.7 ms** | 24.6 ms | 5.6 ms | 19.9% ⚠ | 63.56x | 1 | n/a |
| Vize ⚠ | (2.8 ms) | (2.7 ms) | – | – | not ranked | – | – |

#### Type definition: typed binding

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **6.0 ms** | 5.6 ms | 2.4 ms | 32.9% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **19.6 ms** | 19.1 ms | 4.0 ms | 18.7% ⚠ | 3.25x | 1 | n/a |
| Verter | **19.6 ms** | 3.7 ms | 10.2 ms | 66.5% ⚠ | 3.25x | 1 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | – | – |

#### References: prop -> parent template

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **116.2 ms** | 113.2 ms | 8.1 ms | 6.8% | 1.00x | 4 | n/a |
| Volar (N) | **354.3 ms** | 349.7 ms | 8.5 ms | 2.4% | 3.05x | 4 | n/a |
| Vize ⚠ | (0.7 ms) | (0.6 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (98.4 ms) | (72.8 ms) | – | – | not ranked | (3) | – |

#### Prepare rename: prop

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **6.2 ms** | 5.0 ms | 1.3 ms | 21.2% ⚠ | 1.00x | n/a | n/a |
| Volar (N) | **6.7 ms** | 6.4 ms | 0.2 ms | 3.3% | 1.07x | n/a | n/a |
| Vize ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | – | – |

#### Rename prop (cross-file edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.5 ms** | 3.0 ms | 0.4 ms | 11.4% ⚠ | 1.00x | 4 | n/a |
| Volar (N) | **4.6 ms** | 4.3 ms | 0.3 ms | 6.7% | 1.32x | 4 | n/a |
| Vize ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (1.3 ms) | (1.2 ms) | – | – | not ranked | (3) | – |

#### Code action at diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **32.1 ms** | 31.7 ms | 2.4 ms | 7.2% | 1.00x | 2 | n/a |
| Volar (N) | **77.1 ms** | 76.8 ms | 12.4 ms | 14.7% ⚠ | 2.40x | 2 | n/a |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.7 ms) | (0.6 ms) | – | – | not ranked | (0) | – |

#### Signature help after `(`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **16.2 ms** | 15.7 ms | 0.4 ms | 2.5% | 1.00x | 1 | n/a |
| Volar (N) | **32.6 ms** | 31.5 ms | 0.7 ms | 2.2% | 2.01x | 1 | n/a |
| Vize ⚠ | (146.4 ms) | (140.3 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (6.1 ms) | (4.9 ms) | – | – | not ranked | (0) | – |

#### Format unformatted SFC

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **62.3 ms** | 61.7 ms | 2.4 ms | 3.8% | 1.00x | 1 | n/a |
| Volar (N) | **63.4 ms** | 61.0 ms | 3.9 ms | 6.1% | 1.02x | 1 | n/a |
| Vize ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

### IDE · smoke

Files: **1** · Bytes: **0**

#### Hover (script setup)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **251.1 ms** | 222.1 ms | 22.8 ms | 9.2% | 1.00x | 89 | n/a |
| Vize | **304.6 ms** | 261.3 ms | 28.4 ms | 9.7% | 1.21x | 388 | n/a |
| Volar (JS) | **1.07 s** | 1.06 s | 11.0 ms | 1.0% | 4.27x | 90 | n/a |
| Volar (N) | **1.10 s** | 1.09 s | 7.4 ms | 0.7% | 4.38x | 90 | n/a |

#### Hover (template interpolation)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.4 ms** | 1.0 ms | 0.6 ms | 36.8% ⚠ | 1.00x | 74 | n/a |
| Vize | **4.9 ms** | 4.7 ms | 0.2 ms | 4.0% | 3.58x | 107 | n/a |
| Volar (N) | **10.9 ms** | 10.7 ms | 0.1 ms | 1.3% | 7.99x | 43 | n/a |
| Volar (JS) | **199.8 ms** | 199.1 ms | 2.4 ms | 1.2% | 145.89x | 43 | n/a |

### IDE · Typing loop (composite)

Files: **1** · Bytes: **0**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **432.8 ms** | 432.8 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (JS) | **471.5 ms** | 471.5 ms | n/a | n/a | 1.09x | n/a | n/a |
| Verter | **552.4 ms** | 552.4 ms | n/a | n/a | 1.28x | n/a | n/a |
| Vize ⚠ | (5.27 s) | (5.27 s) | – | – | not ranked | – | – |



#### Ubuntu/Linux · ide ops

<!-- source: ide-scale-Linux.md -->

> 📄 **[Full details →](docs/results/ide-scale-Linux.md)** — methodology, per-row notes and raw runs (31 collapsed block(s) moved out of this page).

## IDE operation results

- **Generated:** 2026-07-29T15:56:04.487Z
- **Runner:** linux/x64 · Node v22.23.1
- **Runs / warmups:** 1 / 1

### IDE · scale

Files: **1** · Bytes: **0**

#### Time-to-usable @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **231.1 ms** | 231.1 ms | n/a | n/a | 1.00x | 21 | n/a |
| Vize | **383.1 ms** | 383.1 ms | n/a | n/a | 1.66x | 21 | n/a |
| Volar (N) | **1.83 s** | 1.83 s | n/a | n/a | 7.93x | 21 | n/a |
| Volar (JS) | **1.95 s** | 1.95 s | n/a | n/a | 8.42x | 21 | n/a |

#### Completion @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.1 ms** | 1.1 ms | n/a | n/a | 1.00x | 7 | n/a |
| Verter | **167.4 ms** | 167.4 ms | n/a | n/a | 154.13x | 7 | n/a |
| Volar (JS) | **209.5 ms** | 209.5 ms | n/a | n/a | 192.89x | 276 | n/a |
| Volar (N) | **404.9 ms** | 404.9 ms | n/a | n/a | 372.79x | 276 | n/a |

#### References @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **453.7 ms** | 453.7 ms | n/a | n/a | 1.00x | 22 | n/a |
| Volar (N) | **556.2 ms** | 556.2 ms | n/a | n/a | 1.23x | 22 | n/a |
| Vize ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (32.4 ms) | (32.4 ms) | – | – | not ranked | (0) | – |

#### Hover warm @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.00x | 131 | n/a |
| Volar (JS) | **1.4 ms** | 1.4 ms | n/a | n/a | 1.07x | 131 | n/a |
| Vize | **1.9 ms** | 1.9 ms | n/a | n/a | 1.48x | 429 | n/a |
| Verter | **2.8 ms** | 2.8 ms | n/a | n/a | 2.13x | 130 | n/a |

#### Time-to-usable @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **324.3 ms** | 324.3 ms | n/a | n/a | 1.00x | 101 | n/a |
| Vize | **381.7 ms** | 381.7 ms | n/a | n/a | 1.18x | 101 | n/a |
| Volar (JS) | **2.11 s** | 2.11 s | n/a | n/a | 6.51x | 101 | n/a |
| Volar (N) | **2.12 s** | 2.12 s | n/a | n/a | 6.52x | 101 | n/a |

#### Completion @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.2 ms** | 1.2 ms | n/a | n/a | 1.00x | 7 | n/a |
| Volar (JS) | **222.4 ms** | 222.4 ms | n/a | n/a | 185.44x | 356 | n/a |
| Verter | **249.1 ms** | 249.1 ms | n/a | n/a | 207.73x | 7 | n/a |
| Volar (N) | **429.8 ms** | 429.8 ms | n/a | n/a | 358.39x | 356 | n/a |

#### References @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **1.29 s** | 1.29 s | n/a | n/a | 1.00x | 102 | n/a |
| Volar (N) | **2.14 s** | 2.14 s | n/a | n/a | 1.66x | 102 | n/a |
| Vize ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (62.8 ms) | (62.8 ms) | – | – | not ranked | (0) | – |

#### Hover warm @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.00x | 131 | n/a |
| Volar (JS) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.00x | 131 | n/a |
| Verter | **1.6 ms** | 1.6 ms | n/a | n/a | 1.21x | 130 | n/a |
| Vize | **1.8 ms** | 1.8 ms | n/a | n/a | 1.40x | 429 | n/a |

#### Time-to-usable @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **382.7 ms** | 382.7 ms | n/a | n/a | 1.00x | 501 | n/a |
| Verter | **454.8 ms** | 454.8 ms | n/a | n/a | 1.19x | 501 | n/a |
| Volar (JS) | **3.07 s** | 3.07 s | n/a | n/a | 8.02x | 501 | n/a |
| Volar (N) | **3.52 s** | 3.52 s | n/a | n/a | 9.20x | 501 | n/a |

#### Completion @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.1 ms** | 1.1 ms | n/a | n/a | 1.00x | 7 | n/a |
| Verter | **140.9 ms** | 140.9 ms | n/a | n/a | 129.46x | 7 | n/a |
| Volar (JS) | **244.1 ms** | 244.1 ms | n/a | n/a | 224.30x | 756 | n/a |
| Volar (N) | **603.3 ms** | 603.3 ms | n/a | n/a | 554.45x | 756 | n/a |

#### References @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **17.65 s** | 17.65 s | n/a | n/a | 1.00x | 502 | n/a |
| Volar (N) | **38.91 s** | 38.91 s | n/a | n/a | 2.21x | 502 | n/a |
| Vize ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | (0) | – |

#### Hover warm @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.8 ms | n/a | n/a | 1.00x | 130 | n/a |
| Volar (JS) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.52x | 131 | n/a |
| Volar (N) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.57x | 131 | n/a |
| Vize | **1.9 ms** | 1.9 ms | n/a | n/a | 2.22x | 429 | n/a |

#### Scale × time-to-usable 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.58 | – |
| Volar (N) | – | – | – | – | – | 1.92 | – |
| Vize | – | – | – | – | – | 1 | – |
| Verter | – | – | – | – | – | 1.97 | – |

#### Scale × completion 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.16 | – |
| Volar (N) | – | – | – | – | – | 1.49 | – |
| Vize | – | – | – | – | – | 1 | – |
| Verter | – | – | – | – | – | 0.84 | – |

#### Scale × references 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 38.89 | – |
| Volar (N) | – | – | – | – | – | 69.96 | – |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter ⚠ | – | – | – | – | not ranked | – | – |

#### Scale × hover warm 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 0.93 | – |
| Volar (N) | – | – | – | – | – | 1.02 | – |
| Vize | – | – | – | – | – | 0.98 | – |
| Verter | – | – | – | – | – | 0.31 | – |

### IDE · Typing loop (composite)

Files: **1** · Bytes: **0**

> ⏭ **All 4 cells in this group were skipped — no measurements.** ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not… Per-row wording: [full report](docs/results/ide-scale-Linux.md).



<!-- IDE_RESULTS_END -->

## Real-world project results

Toolchain surfaces run against pinned checkouts of popular open-source Vue projects instead of generated fixtures. Published by the **Benchmark (real-world)** workflow, which runs **one job per project** so every tool measured against a given project shares one machine.

**Read these tables within a corpus, never across one.** The corpora differ in size and in kind, and the difference is larger than it looks: of the "big Vue UI libraries", Naive UI, Vuetify and Ant Design Vue contain essentially **no library SFCs at all** — their components are `.tsx`/render functions, and their `.vue` files are documentation demos. Those are real, non-trivial Vue and worth measuring; they are just not the same thing as PrimeVue's 279 published component SFCs or Hoppscotch's application source. Every table states which kind it holds.

The generated `fixtures/N` corpus remains the primary ranking corpus — it is content-unique by construction and carries planted bugs, which is what makes the work gates possible. Real-world corpora exist to catch what a designed corpus cannot: constructs nobody thought to generate.

<!-- REAL_WORLD_RESULTS_START -->

> Auto-updated 2026-07-30 from the **Benchmark (real-world)** workflow — one job per project, every surface and every tool inside it.
> Corpora are pinned checkouts of third-party open-source Vue projects. Sources are unmodified; every table names its ref and resolved commit SHA.
> **Rank within a corpus, never across it.** The corpora differ in size and in kind — library source, application source, and documentation demos are not the same code.
> The generated `fixtures/N` corpus remains the primary ranking corpus; these tables exist to catch what a designed corpus cannot.

<!-- notes: notes-real-world.md -->

> 📖 **[How to read these tables →](docs/results/notes-real-world.md)** — ranking rules, standing notes and the tools legend shared by every block in this section.

# ant-design-vue

<!-- source: real-world-Linux-ant-design-vue.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-ant-design-vue.md)** — methodology, per-row notes and raw runs (39 collapsed block(s) moved out of this page).



## SFC compile (unique contents)

Files: **695** · Bytes: **920,155**

> **Did not run — excluded from every table below.**
>
> - **fervid** (`@fervid/napi`) — aborted the benchmark process: killed by signal SIGABRT while compiling fixtures/real/ant-design-vue/components/carousel/demo/customPaging.vue — thread '&lt;unnamed>' panicked at crates/fervid_css/src/css/transform.rs:176:17.
>
> _Why an aborted tool is excluded rather than bracketed, and the full per-tool detail: [full report](docs/results/real-world-Linux-ant-design-vue.md)._

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **48.6 ms** | 48.3 ms | 1.0 ms | 2.1% | 1.00x | 1,783,539 | 14.3k files/s |
| Verter compileMany (session cache) | **60.3 ms** | 52.9 ms | 4.8 ms | 7.9% | 1.24x | 1,617,120 | 11.5k files/s |
| Vize native loop (1T) | **138.5 ms** | 135.2 ms | 2.4 ms | 1.7% | 2.85x | 1,783,539 | 5.0k files/s |
| @vue/compiler-sfc 3.5 (1T) | **400.2 ms** | 372.6 ms | 21.9 ms | 5.5% | 8.24x | 1,951,784 | 1.7k files/s |
| @vue/compiler-sfc 3.6 (1T) | **412.5 ms** | 399.2 ms | 18.0 ms | 4.4% | 8.49x | 1,951,784 | 1.7k files/s |
| Verter compileMany (stateless) | **849.1 ms** | 812.5 ms | 38.0 ms | 4.5% | 17.49x | 1,617,120 | 819 files/s |

## Format

Files: **695** · Bytes: **920,155**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | **83.1 ms** | 82.0 ms | 3.2 ms | 3.8% | 1.00x | n/a | 8.4k files/s |
| Vize | **260.4 ms** | 254.2 ms | 16.0 ms | 6.1% | 3.13x | n/a | 2.7k files/s |
| Oxfmt | **4.31 s** | 4.24 s | 78.3 ms | 1.8% | 51.86x | n/a | 161 files/s |
| Biome format ⚠ | (167.9 ms) | (164.6 ms) | – | – | not ranked | – | – |

## Lint

Files: **695** · Bytes: **920,155**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **93.4 ms** | 86.6 ms | 3.4 ms | 3.6% | 1.00x | n/a | 7.4k files/s |
| Vize lint (1T) | **145.5 ms** | 143.5 ms | 14.5 ms | 10.0% | 1.56x | n/a | 4.8k files/s |
| Verter host lint | **539.1 ms** | 525.5 ms | 7.0 ms | 1.3% | 5.77x | n/a | 1.3k files/s |
| eslint-plugin-vue (1T) | **4.01 s** | 3.56 s | 420.3 ms | 10.5% ⚠ | 42.99x | n/a | 173 files/s |
| eslint-plugin-vue (4 workers) | **5.42 s** | 5.25 s | 77.6 ms | 1.4% | 58.05x | n/a | 128 files/s |
| eslint-plugin-vue (CLI) | **5.65 s** | 5.56 s | 85.8 ms | 1.5% | 60.47x | n/a | 123 files/s |
| Biome lint (1T) ⚠ | (852.0 ms) | (819.5 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (359.3 ms) | (349.9 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (95.9 ms) | (90.9 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (75.4 ms) | (72.2 ms) | – | – | not ranked | – | – |

## Bundle (production build) — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

### Vite 8 (Rolldown) — Vue integrations compared

> ❌ **All 4 cells in this group failed — no measurements.** ([full report](docs/results/real-world-Linux-ant-design-vue.md))
> - **Vite 8 (Rolldown) × @vitejs/plugin-vue ❌**: Build failed with 6 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/modal/demo/fullscreen.vue?vue&type=style&index=0&lang.less
> - **Vite 8 (Rolldown) × unplugin-vue ❌**: Build failed with 6 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/modal/demo/fullscreen.vue?vue&type=style&index=0&lang.less
> - **Vite 8 (Rolldown) × @vizejs/vite-plugin ❌**: Build failed with 6 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/config-provider/demo/direction.vue?vue=&type=style&index=0&sc…
> - **Vite 8 (Rolldown) × @verter/unplugin ❌**: Build failed with 6 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/grid/demo/flex.vue?vue&type=style&index=0&lang.less

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 98 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-ant-design-vue.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × @verter/unplugin | **1.55 s** | 1.53 s | 36.6 ms | 2.4% | 1.00x | 4,419,919 | 447 files/s |
| Rspack × unplugin-vue | **1.98 s** | 1.95 s | 52.9 ms | 2.7% | 1.28x | 4,691,498 | 350 files/s |
| Rspack × vue-loader | **2.40 s** | 2.25 s | 202.8 ms | 8.5% | 1.54x | 6,303,083 | 290 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × @verter/unplugin | **2.48 s** | 2.45 s | 51.0 ms | 2.1% | 1.00x | 5,512,482 | 280 files/s |
| webpack 5 × vue-loader | **2.73 s** | 2.72 s | 15.0 ms | 0.5% | 1.10x | 9,757,721 | 255 files/s |
| webpack 5 × unplugin-vue | **3.65 s** | 3.21 s | 630.1 ms | 17.2% ⚠ | 1.47x | 7,283,567 | 190 files/s |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

## HMR / dev server — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

### Dev server cold start

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-ant-design-vue.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-ant-design-vue.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @verter/unplugin | **71.9 ms** | 66.8 ms | 7.2 ms | 10.1% ⚠ | 1.00x | n/a | 9.7k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **87.4 ms** | 82.6 ms | 6.8 ms | 7.8% | 1.21x | n/a | 8.0k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **92.0 ms** | 86.4 ms | 8.0 ms | 8.7% | 1.28x | n/a | 7.6k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **227.1 ms** | 220.7 ms | 9.1 ms | 4.0% | 3.16x | n/a | 3.1k files/s |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-ant-design-vue.md).

### HMR update turnaround

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-ant-design-vue.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-ant-design-vue.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **7.9 ms** | 7.3 ms | 0.8 ms | 10.4% ⚠ | 1.00x | 15,440 | 88.5k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **74.3 ms** | 5.5 ms | 97.2 ms | 130.9% ⚠ | 9.46x | 8,796 | 9.4k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **470.6 ms** | 5.5 ms | 657.7 ms | 139.8% ⚠ | 59.93x | 8,794 | 1.5k files/s |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-ant-design-vue.md).

## Project test suite — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

## Project build (own config) — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

## Project typecheck (own tsconfig) — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

## Project component-meta (own tsconfig) — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta ⚠ | (6.58 s) | (5.80 s) | – | – | not ranked | (695) | – |
| @verter/component-meta ⚠ | (2.54 s) | (2.50 s) | – | – | not ranked | (695) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — ant-design-vue:demos

Files: **1** · Bytes: **528**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (9.19 s) | (8.58 s) | – | – | not ranked | (0) | – |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |
| Verter ⚠ | (1.77 s) | (1.28 s) | – | – | not ranked | (0) | – |
| Vize ⚠ | (1.26 s) | (1.19 s) | – | – | not ranked | (1) | – |

### hover on `top`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (2.4 ms) | (2.4 ms) | – | – | not ranked | (48) | – |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |
| Verter ⚠ | (1.2 ms) | (1.0 ms) | – | – | not ranked | (48) | – |
| Vize ⚠ | (2.3 ms) | (2.0 ms) | – | – | not ranked | (347) | – |



# element-plus

<!-- source: real-world-Linux-element-plus.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-element-plus.md)** — methodology, per-row notes and raw runs (47 collapsed block(s) moved out of this page).



## SFC compile (unique contents)

Files: **162** · Bytes: **765,295**

> **Did not run — excluded from every table below.**
>
> - **fervid** (`@fervid/napi`) — aborted the benchmark process: killed by signal SIGABRT while compiling fixtures/real/element-plus/packages/components/countdown/src/countdown.vue — thread '&lt;unnamed>' panicked at crates/fervid_codegen/src/components/mod.rs:463:13.
>
> _Why an aborted tool is excluded rather than bracketed, and the full per-tool detail: [full report](docs/results/real-world-Linux-element-plus.md)._

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (1T) | **332.7 ms** | 324.2 ms | 20.6 ms | 6.2% | 1.00x | 1,184,607 | 487 files/s |
| @vue/compiler-sfc 3.6 (1T) | **497.9 ms** | 454.9 ms | 60.4 ms | 12.1% ⚠ | 1.50x | 1,184,607 | 325 files/s |
| Vize native loop (1T) ⚠ | (100.6 ms) | (99.3 ms) | – | – | not ranked | (1,121,922) | – |
| Vize native batch (max threads) ⚠ | (35.4 ms) | (35.3 ms) | – | – | not ranked | (1,121,922) | – |
| Verter compileMany (stateless) ⚠ | (1.00 s) | (593.7 ms) | – | – | not ranked | (970,791) | – |
| Verter compileMany (session cache) ⚠ | (69.1 ms) | (68.1 ms) | – | – | not ranked | (970,791) | – |

## Format

Files: **162** · Bytes: **765,295**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | **73.4 ms** | 72.5 ms | 1.3 ms | 1.8% | 1.00x | n/a | 2.2k files/s |
| Vize | **194.8 ms** | 122.7 ms | 236.9 ms | 121.6% ⚠ | 2.66x | n/a | 832 files/s |
| Oxfmt | **2.80 s** | 2.76 s | 38.4 ms | 1.4% | 38.15x | n/a | 58 files/s |
| Biome format ⚠ | (155.4 ms) | (152.3 ms) | – | – | not ranked | – | – |

## Lint

Files: **162** · Bytes: **765,295**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **67.0 ms** | 63.8 ms | 3.6 ms | 5.3% | 1.00x | n/a | 2.4k files/s |
| Vize lint (1T) | **95.7 ms** | 94.6 ms | 13.2 ms | 13.8% ⚠ | 1.43x | n/a | 1.7k files/s |
| Verter host lint | **295.9 ms** | 294.4 ms | 1.6 ms | 0.5% | 4.42x | n/a | 547 files/s |
| eslint-plugin-vue (1T) | **1.91 s** | 1.87 s | 334.0 ms | 17.5% ⚠ | 28.56x | n/a | 85 files/s |
| eslint-plugin-vue (CLI) | **3.78 s** | 3.71 s | 46.4 ms | 1.2% | 56.41x | n/a | 43 files/s |
| eslint-plugin-vue (4 workers) | **4.14 s** | 4.12 s | 67.0 ms | 1.6% | 61.77x | n/a | 39 files/s |
| Biome lint (1T) ⚠ | (597.4 ms) | (591.8 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (264.9 ms) | (264.6 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (85.1 ms) | (78.3 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (64.7 ms) | (63.7 ms) | – | – | not ranked | – | – |

## Bundle (production build) — element-plus:components

Files: **149** · Bytes: **765,295**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **433.5 ms** | 428.0 ms | 7.7 ms | 1.8% | 1.00x | 756,095 | 344 files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **449.7 ms** | 407.0 ms | 60.4 ms | 13.4% ⚠ | 1.04x | 756,358 | 331 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **655.6 ms** | 646.2 ms | 13.2 ms | 2.0% | 1.51x | 759,200 | 227 files/s |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rolldown (no Vite) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × unplugin-vue | **685.6 ms** | 683.6 ms | 2.7 ms | 0.4% | 1.00x | 749,946 | 217 files/s |
| Rolldown (no Vite) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × vue-loader | **275.8 ms** | 274.6 ms | 1.7 ms | 0.6% | 1.00x | 2,117,560 | 540 files/s |
| Rspack × @vizejs/rspack-plugin | **345.5 ms** | 344.5 ms | 1.3 ms | 0.4% | 1.25x | 1,732,456 | 431 files/s |
| Rspack × unplugin-vue | **715.5 ms** | 710.4 ms | 7.3 ms | 1.0% | 2.59x | 1,676,630 | 208 files/s |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader | **509.1 ms** | 496.3 ms | 18.1 ms | 3.6% | 1.00x | 2,950,150 | 293 files/s |
| webpack 5 × unplugin-vue | **1.05 s** | 937.0 ms | 161.1 ms | 15.3% ⚠ | 2.06x | 2,300,148 | 142 files/s |
| webpack 5 × @verter/unplugin ❌ | error | – | – | – | – | – | – |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

## HMR / dev server — element-plus:components

Files: **149** · Bytes: **765,295**

### Dev server cold start

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-element-plus.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-element-plus.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **18.0 ms** | 13.8 ms | 6.0 ms | 33.3% ⚠ | 1.00x | n/a | 8.3k files/s |
| Vite 8 (Rolldown) × @verter/unplugin | **18.2 ms** | 17.7 ms | 0.6 ms | 3.5% | 1.01x | n/a | 8.2k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **18.9 ms** | 18.1 ms | 1.0 ms | 5.5% | 1.05x | n/a | 7.9k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **79.6 ms** | 79.2 ms | 0.6 ms | 0.7% | 4.43x | n/a | 1.9k files/s |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-element-plus.md).

### HMR update turnaround

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-element-plus.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-element-plus.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **7.7 ms** | 7.1 ms | 0.8 ms | 9.9% | 1.00x | 30,058 | 19.4k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **7.7 ms** | 7.1 ms | 0.9 ms | 11.5% ⚠ | 1.00x | 30,056 | 19.4k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **10.4 ms** | 9.6 ms | 1.2 ms | 11.5% ⚠ | 1.36x | 41,587 | 14.3k files/s |
| Vite 8 (Rolldown) × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-element-plus.md).

## Project test suite — element-plus:components

Files: **162** · Bytes: **765,295**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests executed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| element-plus — project's own toolchain (baseline) | **116.57 s** | 116.57 s | n/a | n/a | 1.00x | 2,533 | 1 files/s |
| element-plus — unplugin-vue | **117.46 s** | 117.46 s | n/a | n/a | 1.01x | 2,533 | 1 files/s |
| element-plus — @vizejs/vite-plugin ⚠ | (177.51 s) | (177.51 s) | – | – | not ranked | (2,047) | – |
| element-plus — @verter/unplugin ⚠ | (80.20 s) | (80.20 s) | – | – | not ranked | (527) | – |

## Project build (own config) — element-plus:components

Files: **162** · Bytes: **765,295**

## Project typecheck (own tsconfig) — element-plus:components

Files: **162** · Bytes: **765,295**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | **3.55 s** | 3.54 s | 20.9 ms | 0.6% | 1.00x | 1,645 | 219 files/s |
| vue-tsc (JS) | **24.45 s** | 24.17 s | 396.9 ms | 1.6% | 6.89x | 82 | 32 files/s |
| vue-tsc (N) ⏭ | skipped | – | – | – | – | – | – |
| Vize ⚠ | (2.15 s) | (2.09 s) | – | – | not ranked | (5) | – |

## Project component-meta (own tsconfig) — element-plus:components

Files: **162** · Bytes: **765,295**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | **4.91 s** | 4.52 s | 497.7 ms | 10.1% ⚠ | 1.00x | 162 | 33 files/s |
| @verter/component-meta ⚠ | (2.48 s) | (2.41 s) | – | – | not ranked | (160) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — element-plus:components

Files: **1** · Bytes: **4,568**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **389.8 ms** | 320.4 ms | 134.6 ms | 34.5% ⚠ | 1.00x | 1 | 3 files/s |
| Verter | **419.4 ms** | 414.1 ms | 64.6 ms | 15.4% ⚠ | 1.08x | 0 | 2 files/s |
| Volar (JS) | **3.88 s** | 3.86 s | 13.8 ms | 0.4% | 9.95x | 0 | 0 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |

### hover on `COMPONENT_NAME`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.3 ms** | 1.2 ms | 0.1 ms | 6.0% | 1.00x | 49 | 790 files/s |
| Volar (JS) | **2.1 ms** | 1.9 ms | 0.9 ms | 41.1% ⚠ | 1.62x | 49 | 469 files/s |
| Vize | **7.2 ms** | 4.2 ms | 11.0 ms | 154.0% ⚠ | 5.54x | 348 | 140 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |



# hoppscotch

<!-- source: real-world-Linux-hoppscotch.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-hoppscotch.md)** — methodology, per-row notes and raw runs (47 collapsed block(s) moved out of this page).



## SFC compile (unique contents)

Files: **293** · Bytes: **1,978,501**

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **74.7 ms** | 73.9 ms | 0.6 ms | 0.8% | 1.00x | 2,758,214 | 3.9k files/s |
| Vize native loop (1T) | **201.5 ms** | 201.1 ms | 0.7 ms | 0.3% | 2.70x | 2,758,214 | 1.5k files/s |
| @vue/compiler-sfc 3.5 (1T) | **527.8 ms** | 481.5 ms | 33.8 ms | 6.4% | 7.06x | 3,009,528 | 555 files/s |
| @vue/compiler-sfc 3.6 (1T) | **528.7 ms** | 491.5 ms | 28.1 ms | 5.3% | 7.08x | 3,009,528 | 554 files/s |
| fervid compileSync (1T) ⚠ | (230.5 ms) | (229.8 ms) | – | – | not ranked | (3,662,436) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (105.3 ms) | (105.0 ms) | – | – | not ranked | (3,662,436) | – |
| Verter compileMany (stateless) ⚠ | (318.6 ms) | (312.8 ms) | – | – | not ranked | (2,406,414) | – |
| Verter compileMany (session cache) ⚠ | (98.6 ms) | (89.0 ms) | – | – | not ranked | (2,406,414) | – |

## Format

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | **80.7 ms** | 79.5 ms | 1.0 ms | 1.3% | 1.00x | n/a | 3.6k files/s |
| Vize | **188.6 ms** | 186.6 ms | 1.8 ms | 1.0% | 2.34x | n/a | 1.6k files/s |
| Oxfmt | **5.75 s** | 5.67 s | 56.3 ms | 1.0% | 71.28x | n/a | 51 files/s |
| Biome format ⚠ | (270.0 ms) | (269.4 ms) | – | – | not ranked | – | – |

## Lint

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **94.3 ms** | 91.6 ms | 2.0 ms | 2.2% | 1.00x | n/a | 3.1k files/s |
| Vize lint (1T) | **162.5 ms** | 159.1 ms | 3.5 ms | 2.2% | 1.72x | n/a | 1.8k files/s |
| Verter host lint | **743.1 ms** | 740.9 ms | 3.6 ms | 0.5% | 7.88x | n/a | 394 files/s |
| eslint-plugin-vue (1T) | **5.32 s** | 5.28 s | 505.6 ms | 9.5% | 56.38x | n/a | 55 files/s |
| eslint-plugin-vue (4 workers) | **7.53 s** | 7.37 s | 84.6 ms | 1.1% | 79.79x | n/a | 39 files/s |
| eslint-plugin-vue (CLI) | **7.60 s** | 7.40 s | 113.6 ms | 1.5% | 80.53x | n/a | 39 files/s |
| Biome lint (1T) ⚠ | (1.11 s) | (1.10 s) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (498.4 ms) | (488.3 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (106.5 ms) | (105.3 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (79.7 ms) | (75.3 ms) | – | – | not ranked | – | – |

## Bundle (production build) — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **1.23 s** | 1.19 s | 69.9 ms | 5.7% | 1.00x | 2,217,328 | 237 files/s |
| Vite 8 (Rolldown) × unplugin-vue | **1.32 s** | 1.31 s | 11.8 ms | 0.9% | 1.07x | 2,216,765 | 222 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **3.09 s** | 3.08 s | 16.3 ms | 0.5% | 2.51x | 2,090,719 | 95 files/s |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 41 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-hoppscotch.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × vue-loader | **2.14 s** | 1.91 s | 338.1 ms | 15.8% ⚠ | 1.00x | 5,819,414 | 137 files/s |
| Rspack × unplugin-vue | **2.34 s** | 2.25 s | 128.1 ms | 5.5% | 1.09x | 5,037,823 | 125 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader | **2.65 s** | 2.50 s | 214.4 ms | 8.1% | 1.00x | 7,538,730 | 110 files/s |
| webpack 5 × unplugin-vue | **3.05 s** | 3.01 s | 66.1 ms | 2.2% | 1.15x | 6,481,986 | 96 files/s |
| webpack 5 × @verter/unplugin ❌ | error | – | – | – | – | – | – |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

## HMR / dev server — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

### Dev server cold start

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-hoppscotch.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-hoppscotch.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @verter/unplugin | **40.1 ms** | 38.5 ms | 2.2 ms | 5.5% | 1.00x | n/a | 7.3k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **41.7 ms** | 40.9 ms | 1.0 ms | 2.4% | 1.04x | n/a | 7.0k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **42.6 ms** | 37.3 ms | 7.5 ms | 17.6% ⚠ | 1.06x | n/a | 6.9k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **178.0 ms** | 172.5 ms | 7.7 ms | 4.3% | 4.44x | n/a | 1.6k files/s |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-hoppscotch.md).

### HMR update turnaround

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-hoppscotch.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-hoppscotch.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **31.7 ms** | 12.0 ms | 27.9 ms | 88.0% ⚠ | 1.00x | 11,946 ⚠ | 9.2k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **64.6 ms** | 9.7 ms | 77.6 ms | 120.2% ⚠ | 2.04x | 31,877 | 4.5k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **153.4 ms** | 6.5 ms | 207.6 ms | 135.4% ⚠ | 4.83x | 31,875 | 1.9k files/s |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (1.8 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-hoppscotch.md).

## Project test suite — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests executed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @hoppscotch/common — @verter/unplugin | **24.81 s** | 24.81 s | n/a | n/a | 1.00x | 414 | 12 files/s |
| @hoppscotch/common — project's own toolchain (baseline) | **24.87 s** | 24.87 s | n/a | n/a | 1.00x | 414 | 12 files/s |
| @hoppscotch/common — unplugin-vue | **24.90 s** | 24.90 s | n/a | n/a | 1.00x | 414 | 12 files/s |
| @hoppscotch/common — @vizejs/vite-plugin | **25.13 s** | 25.13 s | n/a | n/a | 1.01x | 414 | 12 files/s |

## Project build (own config) — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| hoppscotch-agent — unplugin-vue | **1.67 s** | 1.64 s | 28.3 ms | 1.7% | 1.00x | 257,695 | 2 files/s |
| hoppscotch-agent — @vizejs/vite-plugin | **1.67 s** | 1.64 s | 23.3 ms | 1.4% | 1.00x | 257,660 | 2 files/s |
| hoppscotch-agent — project's own toolchain (baseline) | **1.73 s** | 1.70 s | 26.3 ms | 1.5% | 1.04x | 257,695 | 2 files/s |
| hoppscotch-agent — @verter/unplugin | **1.76 s** | 1.72 s | 28.4 ms | 1.6% | 1.05x | 259,664 | 2 files/s |

## Project typecheck (own tsconfig) — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | **660.8 ms** | 646.0 ms | 21.0 ms | 3.2% | 1.00x | 58 | 17 files/s |
| vue-tsc (JS) | **2.93 s** | 2.91 s | 24.7 ms | 0.8% | 4.43x | 16 | 4 files/s |
| vue-tsc (N) ⏭ | skipped | – | – | – | – | – | – |
| Vize ⚠ | (342.2 ms) | (341.8 ms) | – | – | not ranked | (1) | – |

## Project component-meta (own tsconfig) — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | **6.23 s** | 5.61 s | 414.8 ms | 6.7% | 1.00x | 293 | 47 files/s |
| @verter/component-meta ⚠ | (3.02 s) | (2.96 s) | – | – | not ranked | (283) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — hoppscotch:common

Files: **1** · Bytes: **1,506**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.20 s** | 1.17 s | 101.7 ms | 8.5% | 1.00x | 2 | 1 files/s |
| Verter | **1.40 s** | 379.2 ms | 530.1 ms | 37.9% ⚠ | 1.17x | 0 | 1 files/s |
| Volar (JS) | **8.54 s** | 8.43 s | 71.5 ms | 0.8% | 7.12x | 0 | 0 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |

### hover on `errorInfo`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.0 ms** | 2.6 ms | 1.4 ms | 48.6% ⚠ | 1.00x | 168 | 337 files/s |
| Verter | **5.3 ms** | 0.8 ms | 134.2 ms | 2515.5% ⚠ | 1.77x | 165 | 187 files/s |
| Vize | **18.7 ms** | 17.3 ms | 3.8 ms | 20.2% ⚠ | 6.23x | 337 | 53 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |



# naive-ui

<!-- source: real-world-Linux-naive-ui.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-naive-ui.md)** — methodology, per-row notes and raw runs (46 collapsed block(s) moved out of this page).



## SFC compile (⚠ 2 duplicate bodies — content-hash caches may inflate throughput)

Files: **1,682** · Bytes: **1,751,750**

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **101.5 ms** | 98.9 ms | 3.6 ms | 3.5% | 1.00x | 3,747,866 | 16.6k files/s |
| Verter compileMany (session cache) | **113.3 ms** | 109.0 ms | 5.6 ms | 5.0% | 1.12x | 3,452,696 | 14.8k files/s |
| Vize native loop (1T) | **288.1 ms** | 281.1 ms | 4.7 ms | 1.6% | 2.84x | 3,747,866 | 5.8k files/s |
| @vue/compiler-sfc 3.5 (1T) | **631.0 ms** | 589.5 ms | 28.1 ms | 4.5% | 6.21x | 4,153,090 | 2.7k files/s |
| @vue/compiler-sfc 3.6 (1T) | **655.7 ms** | 637.8 ms | 29.8 ms | 4.5% | 6.46x | 4,153,090 | 2.6k files/s |
| Verter compileMany (stateless) | **5.04 s** | 4.66 s | 258.4 ms | 5.1% | 49.67x | 3,452,696 | 334 files/s |
| fervid compileSync (1T) ⚠ | (249.1 ms) | (248.4 ms) | – | – | not ranked | (5,367,958) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (139.0 ms) | (125.1 ms) | – | – | not ranked | (5,367,958) | – |

## Format

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | **85.4 ms** | 83.3 ms | 1.0 ms | 1.2% | 1.00x | n/a | 19.7k files/s |
| Vize | **464.2 ms** | 451.1 ms | 20.5 ms | 4.4% | 5.43x | n/a | 3.6k files/s |
| Oxfmt | **6.38 s** | 6.32 s | 46.6 ms | 0.7% | 74.69x | n/a | 264 files/s |
| Biome format ⚠ | (345.2 ms) | (340.6 ms) | – | – | not ranked | – | – |

## Lint

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **124.3 ms** | 123.7 ms | 1.0 ms | 0.8% | 1.00x | n/a | 13.5k files/s |
| Vize lint (1T) | **210.8 ms** | 209.1 ms | 12.6 ms | 6.0% | 1.70x | n/a | 8.0k files/s |
| Verter host lint | **1.09 s** | 1.08 s | 13.6 ms | 1.3% | 8.75x | n/a | 1.5k files/s |
| eslint-plugin-vue (1T) | **6.64 s** | 6.58 s | 514.0 ms | 7.7% | 53.42x | n/a | 253 files/s |
| eslint-plugin-vue (4 workers) | **7.91 s** | 7.76 s | 121.1 ms | 1.5% | 63.60x | n/a | 213 files/s |
| eslint-plugin-vue (CLI) | **9.00 s** | 8.88 s | 92.3 ms | 1.0% | 72.37x | n/a | 187 files/s |
| Biome lint (1T) ⚠ | (1.87 s) | (1.86 s) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (720.3 ms) | (719.4 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (124.8 ms) | (117.1 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (89.0 ms) | (87.8 ms) | – | – | not ranked | – | – |

## Bundle (production build) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **2.40 s** | 2.34 s | 75.8 ms | 3.2% | 1.00x | 2,999,844 | 702 files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **2.42 s** | 2.41 s | 15.3 ms | 0.6% | 1.01x | 3,006,119 | 694 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **3.39 s** | 3.20 s | 260.0 ms | 7.7% | 1.41x | 2,891,090 | 497 files/s |
| Vite 8 (Rolldown) × @verter/unplugin | **4.02 s** | 3.79 s | 331.3 ms | 8.2% | 1.68x | 3,310,533 | 418 files/s |

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 120 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-naive-ui.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × unplugin-vue | **4.07 s** | 3.94 s | 181.3 ms | 4.5% | 1.00x | 9,965,394 | 413 files/s |
| Rspack × vue-loader | **4.78 s** | 4.65 s | 189.4 ms | 4.0% | 1.17x | 13,727,292 | 352 files/s |
| Rspack × @verter/unplugin | **253.63 s** | 253.05 s | 816.9 ms | 0.3% | 62.31x | 9,284,079 | 7 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × @verter/unplugin | **5.87 s** | 5.45 s | 599.3 ms | 10.2% ⚠ | 1.00x | 11,803,088 | 286 files/s |
| webpack 5 × vue-loader | **7.43 s** | 6.67 s | 1.07 s | 14.4% ⚠ | 1.26x | 21,601,229 | 226 files/s |
| webpack 5 × unplugin-vue | **9.34 s** | 9.17 s | 242.3 ms | 2.6% | 1.59x | 15,359,135 | 180 files/s |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

## HMR / dev server — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

### Dev server cold start

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-naive-ui.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-naive-ui.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @verter/unplugin | **176.3 ms** | 175.3 ms | 1.3 ms | 0.8% | 1.00x | n/a | 9.5k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **179.3 ms** | 175.1 ms | 6.0 ms | 3.4% | 1.02x | n/a | 9.4k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **191.9 ms** | 179.3 ms | 17.7 ms | 9.2% | 1.09x | n/a | 8.8k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **436.4 ms** | 431.0 ms | 7.7 ms | 1.8% | 2.48x | n/a | 3.9k files/s |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-naive-ui.md).

### HMR update turnaround

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-naive-ui.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-naive-ui.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **5.6 ms** | 5.6 ms | 0.0 ms | 0.2% | 1.00x | 14,230 | 301.2k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **8.1 ms** | 6.6 ms | 2.1 ms | 25.7% ⚠ | 1.45x | 24,386 | 207.6k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **14.7 ms** | 5.7 ms | 12.7 ms | 86.5% ⚠ | 2.63x | 14,228 | 114.5k files/s |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-naive-ui.md).

## Project test suite — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests executed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| naive-ui — project's own toolchain (baseline) ⚠ | (275.08 s) | (275.08 s) | – | – | not ranked | (1,007) | – |
| naive-ui — unplugin-vue ⚠ | (273.85 s) | (273.85 s) | – | – | not ranked | (1,007) | – |
| naive-ui — @vizejs/vite-plugin ⚠ | (275.47 s) | (275.47 s) | – | – | not ranked | (1,007) | – |
| naive-ui — @verter/unplugin ⚠ | (274.47 s) | (274.47 s) | – | – | not ranked | (1,007) | – |

## Project build (own config) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

## Project typecheck (own tsconfig) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (JS) ⚠ | (11.06 s) | (11.01 s) | – | – | not ranked | (63) | – |
| vue-tsc (N) ⏭ | skipped | – | – | – | – | – | – |
| verter-tsc ⚠ | (10.06 s) | (10.04 s) | – | – | not ranked | (5,546) | – |
| Vize ⚠ | (7.92 s) | (7.90 s) | – | – | not ranked | (65) | – |

## Project component-meta (own tsconfig) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta ⚠ | (9.74 s) | (8.65 s) | – | – | not ranked | (1,682) | – |
| @verter/component-meta ⚠ | (10.59 s) | (10.10 s) | – | – | not ranked | (1,682) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — naive-ui:demos

Files: **1** · Bytes: **1,272**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (10.97 s) | (10.87 s) | – | – | not ranked | (0) | – |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |
| Verter ⚠ | (1.84 s) | (1.42 s) | – | – | not ranked | (2) | – |
| Vize ⚠ | (1.25 s) | (1.22 s) | – | – | not ranked | (2) | – |

### hover on `containerRef`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (3.1 ms) | (2.9 ms) | – | – | not ranked | (91) | – |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |
| Verter ⚠ | (1.2 ms) | (1.1 ms) | – | – | not ranked | (91) | – |
| Vize ⚠ | (2.0 ms) | (2.0 ms) | – | – | not ranked | (162) | – |



# nuxt-ui

<!-- source: real-world-Linux-nuxt-ui.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-nuxt-ui.md)** — methodology, per-row notes and raw runs (46 collapsed block(s) moved out of this page).



## SFC compile (unique contents)

Files: **187** · Bytes: **1,014,900**

> **Did not run — excluded from every table below.**
>
> - **fervid** (`@fervid/napi`) — aborted the benchmark process: killed by signal SIGABRT while compiling fixtures/real/nuxt-ui/src/runtime/components/BlogPosts.vue — thread '&lt;unnamed>' panicked at crates/fervid_codegen/src/components/mod.rs:463:13.
>
> _Why an aborted tool is excluded rather than bracketed, and the full per-tool detail: [full report](docs/results/real-world-Linux-nuxt-ui.md)._

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (1T) ❌ | error | – | – | – | – | – | – |
| @vue/compiler-sfc 3.6 (1T) ❌ | error | – | – | – | – | – | – |
| Vize native loop (1T) ⚠ | (167.1 ms) | (166.0 ms) | – | – | not ranked | (1,559,478) | – |
| Vize native batch (max threads) ⚠ | (53.9 ms) | (51.3 ms) | – | – | not ranked | (1,559,478) | – |
| Verter compileMany (stateless) ⚠ | (6.02 s) | (3.94 s) | – | – | not ranked | (1,298,926) | – |
| Verter compileMany (session cache) ⚠ | (1.62 s) | (1.45 s) | – | – | not ranked | (1,298,926) | – |

## Format

Files: **187** · Bytes: **1,014,900**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | **85.1 ms** | 84.4 ms | 5.2 ms | 6.1% | 1.00x | n/a | 2.2k files/s |
| Vize | **132.9 ms** | 130.6 ms | 4.3 ms | 3.2% | 1.56x | n/a | 1.4k files/s |
| Oxfmt | **3.80 s** | 3.75 s | 28.3 ms | 0.7% | 44.71x | n/a | 49 files/s |
| Biome format ⚠ | (114.1 ms) | (110.9 ms) | – | – | not ranked | – | – |

## Lint

Files: **187** · Bytes: **1,014,900**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **81.0 ms** | 80.4 ms | 1.5 ms | 1.9% | 1.00x | n/a | 2.3k files/s |
| Vize lint (1T) | **126.5 ms** | 122.8 ms | 6.2 ms | 4.9% | 1.56x | n/a | 1.5k files/s |
| Verter host lint | **375.7 ms** | 370.9 ms | 4.7 ms | 1.3% | 4.64x | n/a | 498 files/s |
| eslint-plugin-vue (1T) | **4.12 s** | 3.78 s | 516.5 ms | 12.5% ⚠ | 50.82x | n/a | 45 files/s |
| eslint-plugin-vue (CLI) | **5.89 s** | 5.76 s | 89.4 ms | 1.5% | 72.74x | n/a | 32 files/s |
| eslint-plugin-vue (4 workers) | **5.98 s** | 5.92 s | 53.4 ms | 0.9% | 73.82x | n/a | 31 files/s |
| Biome lint (1T) ⚠ | (365.0 ms) | (364.4 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (187.2 ms) | (183.6 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (95.3 ms) | (93.7 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (78.8 ms) | (74.6 ms) | – | – | not ranked | – | – |

## Bundle (production build) — nuxt-ui:runtime

Files: **76** · Bytes: **1,014,900**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **185.8 ms** | 182.6 ms | 4.4 ms | 2.4% | 1.00x | 158,097 | 409 files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **191.1 ms** | 190.4 ms | 1.0 ms | 0.5% | 1.03x | 158,120 | 398 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ❌ | error | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 1 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-nuxt-ui.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × vue-loader | **137.1 ms** | 133.9 ms | 4.4 ms | 3.2% | 1.00x | 634,903 | 555 files/s |
| Rspack × unplugin-vue | **330.6 ms** | 323.1 ms | 10.6 ms | 3.2% | 2.41x | 459,780 | 230 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader | **245.5 ms** | 237.4 ms | 11.4 ms | 4.7% | 1.00x | 981,680 | 310 files/s |
| webpack 5 × unplugin-vue | **483.2 ms** | 470.9 ms | 17.4 ms | 3.6% | 1.97x | 726,632 | 157 files/s |
| webpack 5 × @verter/unplugin ❌ | error | – | – | – | – | – | – |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

## HMR / dev server — nuxt-ui:runtime

Files: **76** · Bytes: **1,014,900**

### Dev server cold start

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-nuxt-ui.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-nuxt-ui.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @verter/unplugin | **12.2 ms** | 12.0 ms | 0.3 ms | 2.3% | 1.00x | n/a | 6.2k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **12.5 ms** | 12.2 ms | 0.4 ms | 3.0% | 1.02x | n/a | 6.1k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **15.5 ms** | 13.7 ms | 2.5 ms | 16.4% ⚠ | 1.26x | n/a | 4.9k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **101.8 ms** | 98.7 ms | 4.4 ms | 4.3% | 8.32x | n/a | 747 files/s |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-nuxt-ui.md).

### HMR update turnaround

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-nuxt-ui.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-nuxt-ui.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **9.5 ms** | 9.3 ms | 0.2 ms | 2.5% | 1.00x | 27,566 | 8.0k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **26.7 ms** | 10.5 ms | 22.9 ms | 86.0% ⚠ | 2.81x | 35,974 | 2.8k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **28.7 ms** | 9.1 ms | 27.7 ms | 96.6% ⚠ | 3.02x | 27,564 | 2.7k files/s |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (1.0 ms) | (0.6 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-nuxt-ui.md).

## Project test suite — nuxt-ui:runtime

Files: **187** · Bytes: **1,014,900**

> ❌ **All 4 cells in this group failed — no measurements.** vitest produced no summary (exit 1): ▲ [WARNING] Cannot find base config file "./.nuxt/tsconfig.json" [tsconfig.json] Per-row wording: [full report](docs/results/real-world-Linux-nuxt-ui.md).

## Project build (own config) — nuxt-ui:runtime

Files: **187** · Bytes: **1,014,900**

## Project typecheck (own tsconfig) — nuxt-ui:runtime

Files: **187** · Bytes: **1,014,900**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **13.77 s** | 13.40 s | 515.1 ms | 3.7% | 1.00x | 2,893 | 52 files/s |
| vue-tsc (JS) | **53.04 s** | 51.98 s | 1.49 s | 2.8% | 3.85x | 2,371 | 14 files/s |
| vue-tsc (N) ⏭ | skipped | – | – | – | – | – | – |
| verter-tsc ⚠ | (7.14 s) | (7.05 s) | – | – | not ranked | (0) | – |

## Project component-meta (own tsconfig) — nuxt-ui:runtime

Files: **187** · Bytes: **1,014,900**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | **7.79 s** | 7.32 s | 349.2 ms | 4.5% | 1.00x | 187 | 24 files/s |
| @verter/component-meta | **8.83 s** | 8.72 s | 153.6 ms | 1.7% | 1.13x | 187 | 21 files/s |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — nuxt-ui:runtime

Files: **1** · Bytes: **6,276**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **552.9 ms** | 470.0 ms | 42.6 ms | 7.7% | 1.00x | 0 | 2 files/s |
| Vize | **1.34 s** | 1.24 s | 152.9 ms | 11.4% ⚠ | 2.42x | 23 | 1 files/s |
| Volar (JS) | **7.57 s** | 7.43 s | 98.0 ms | 1.3% | 13.69x | 0 | 0 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |

### hover on `_props`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **8.0 ms** | 3.2 ms | 137.6 ms | 1719.5% ⚠ | 1.00x | 813 | 125 files/s |
| Verter | **168.2 ms** | 133.0 ms | 25.4 ms | 15.1% ⚠ | 21.02x | 591 | 6 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |
| Vize ⚠ | (12.8 ms) | (12.6 ms) | – | – | not ranked | (0) | – |



# primevue

<!-- source: real-world-Linux-primevue.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-primevue.md)** — methodology, per-row notes and raw runs (47 collapsed block(s) moved out of this page).



## SFC compile (unique contents)

Files: **279** · Bytes: **1,721,906**

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **31.7 ms** | 31.0 ms | 0.6 ms | 1.9% | 1.00x | 2,080,956 | 8.8k files/s |
| Vize native loop (1T) | **79.8 ms** | 78.1 ms | 1.3 ms | 1.6% | 2.52x | 2,080,956 | 3.5k files/s |
| @vue/compiler-sfc 3.5 (1T) | **271.4 ms** | 257.4 ms | 12.9 ms | 4.8% | 8.57x | 2,122,162 | 1.0k files/s |
| @vue/compiler-sfc 3.6 (1T) | **276.0 ms** | 258.2 ms | 10.9 ms | 3.9% | 8.72x | 2,122,162 | 1.0k files/s |
| fervid compileSync (1T) ⚠ | (189.7 ms) | (188.4 ms) | – | – | not ranked | (2,206,275) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (86.3 ms) | (85.0 ms) | – | – | not ranked | (2,206,275) | – |
| Verter compileMany (stateless) ⚠ | (222.2 ms) | (214.7 ms) | – | – | not ranked | (1,908,249) | – |
| Verter compileMany (session cache) ⚠ | (32.8 ms) | (26.9 ms) | – | – | not ranked | (1,908,249) | – |

## Format

Files: **279** · Bytes: **1,721,906**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | **85.4 ms** | 84.1 ms | 0.8 ms | 0.9% | 1.00x | n/a | 3.3k files/s |
| Vize | **195.2 ms** | 189.0 ms | 3.6 ms | 1.9% | 2.28x | n/a | 1.4k files/s |
| Oxfmt | **4.66 s** | 4.52 s | 98.7 ms | 2.1% | 54.56x | n/a | 60 files/s |
| Biome format ⚠ | (291.4 ms) | (289.5 ms) | – | – | not ranked | – | – |

## Lint

Files: **279** · Bytes: **1,721,906**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **86.1 ms** | 84.4 ms | 1.0 ms | 1.2% | 1.00x | n/a | 3.2k files/s |
| Vize lint (1T) | **133.1 ms** | 131.0 ms | 22.6 ms | 17.0% ⚠ | 1.55x | n/a | 2.1k files/s |
| Verter host lint | **368.3 ms** | 359.4 ms | 8.5 ms | 2.3% | 4.28x | n/a | 757 files/s |
| eslint-plugin-vue (1T) | **5.36 s** | 4.36 s | 539.8 ms | 10.1% ⚠ | 62.20x | n/a | 52 files/s |
| eslint-plugin-vue (4 workers) | **6.68 s** | 6.60 s | 162.6 ms | 2.4% | 77.54x | n/a | 42 files/s |
| eslint-plugin-vue (CLI) | **6.68 s** | 6.59 s | 107.3 ms | 1.6% | 77.57x | n/a | 42 files/s |
| Biome lint (1T) ⚠ | (988.8 ms) | (983.1 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (455.9 ms) | (449.3 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (117.8 ms) | (113.8 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (86.5 ms) | (85.0 ms) | – | – | not ranked | – | – |

## Bundle (production build) — primevue:components

Files: **279** · Bytes: **1,721,906**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **579.2 ms** | 575.3 ms | 5.5 ms | 0.9% | 1.00x | 1,549,544 | 482 files/s |
| Vite 8 (Rolldown) × unplugin-vue | **777.6 ms** | 621.1 ms | 221.3 ms | 28.5% ⚠ | 1.34x | 1,547,649 | 359 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **1.50 s** | 1.47 s | 30.1 ms | 2.0% | 2.58x | 1,528,314 | 187 files/s |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rolldown (no Vite) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × unplugin-vue | **904.1 ms** | 900.5 ms | 5.2 ms | 0.6% | 1.00x | 1,573,783 | 309 files/s |
| Rolldown (no Vite) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × @vizejs/rspack-plugin | **493.7 ms** | 482.8 ms | 15.4 ms | 3.1% | 1.00x | 2,946,153 | 565 files/s |
| Rspack × unplugin-vue | **892.5 ms** | 880.5 ms | 17.0 ms | 1.9% | 1.81x | 2,973,931 | 313 files/s |
| Rspack × vue-loader | **1.06 s** | 1.03 s | 55.0 ms | 5.2% | 2.16x | 4,183,226 | 262 files/s |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × unplugin-vue | **1.16 s** | 1.12 s | 54.8 ms | 4.7% | 1.00x | 3,298,643 | 241 files/s |
| webpack 5 × vue-loader | **1.39 s** | 1.34 s | 71.6 ms | 5.1% | 1.20x | 6,036,230 | 200 files/s |
| webpack 5 × @verter/unplugin ❌ | error | – | – | – | – | – | – |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

## HMR / dev server — primevue:components

Files: **279** · Bytes: **1,721,906**

### Dev server cold start

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-primevue.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-primevue.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **38.1 ms** | 36.8 ms | 1.8 ms | 4.8% | 1.00x | n/a | 7.3k files/s |
| Vite 8 (Rolldown) × @verter/unplugin | **43.5 ms** | 38.6 ms | 6.9 ms | 15.9% ⚠ | 1.14x | n/a | 6.4k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **45.6 ms** | 42.5 ms | 4.3 ms | 9.4% | 1.20x | n/a | 6.1k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **108.5 ms** | 103.6 ms | 6.9 ms | 6.4% | 2.85x | n/a | 2.6k files/s |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-primevue.md).

### HMR update turnaround

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-primevue.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-primevue.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **9.7 ms** | 9.0 ms | 1.0 ms | 10.5% ⚠ | 1.00x | 55,317 | 28.8k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **11.3 ms** | 10.8 ms | 0.8 ms | 6.9% | 1.17x | 41,784 | 24.6k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **73.0 ms** | 6.6 ms | 93.8 ms | 128.6% ⚠ | 7.54x | 55,315 | 3.8k files/s |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-primevue.md).

## Project test suite — primevue:components

Files: **279** · Bytes: **1,721,906**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests executed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| primevue — project's own toolchain (baseline) | **42.23 s** | 42.23 s | n/a | n/a | 1.00x | 403 | 7 files/s |
| primevue — unplugin-vue | **42.79 s** | 42.79 s | n/a | n/a | 1.01x | 403 | 7 files/s |
| primevue — @vizejs/vite-plugin ⚠ | (31.43 s) | (31.43 s) | – | – | not ranked | (6) | – |
| primevue — @verter/unplugin ⚠ | (37.90 s) | (37.90 s) | – | – | not ranked | (252) | – |

## Project build (own config) — primevue:components

Files: **279** · Bytes: **1,721,906**

## Project typecheck (own tsconfig) — primevue:components

Files: **279** · Bytes: **1,721,906**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (JS) | **32.04 s** | 30.91 s | 1.60 s | 5.0% | 1.00x | 1,683 | 20 files/s |
| vue-tsc (N) ⏭ | skipped | – | – | – | – | – | – |
| verter-tsc ⚠ | (3.30 s) | (3.27 s) | – | – | not ranked | (0) | – |
| Vize ⚠ | (8.33 s) | (8.28 s) | – | – | not ranked | (386) | – |

## Project component-meta (own tsconfig) — primevue:components

Files: **279** · Bytes: **1,721,906**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | **41.78 s** | 41.69 s | 1.01 s | 2.4% | 1.00x | 279 | 7 files/s |
| @verter/component-meta ⚠ | (1.32 s) | (1.26 s) | – | – | not ranked | (279) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — primevue:components

Files: **1** · Bytes: **6,562**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **36.5 ms** | 31.3 ms | 140.4 ms | 384.6% ⚠ | 1.00x | 0 | 27 files/s |
| Vize | **543.4 ms** | 467.6 ms | 111.2 ms | 20.5% ⚠ | 14.89x | 62 | 2 files/s |
| Volar (JS) | **2.23 s** | 2.21 s | 17.6 ms | 0.8% | 61.10x | 0 | 0 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |

### hover on `active`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.5 ms** | 2.9 ms | 0.6 ms | 16.6% ⚠ | 1.00x | 35 | 287 files/s |
| Vize | **5.1 ms** | 4.7 ms | 0.3 ms | 6.6% | 1.46x | 334 | 197 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |
| Verter ⚠ | (1.4 ms) | (1.3 ms) | – | – | not ranked | (0) | – |



# quasar

<!-- source: real-world-Linux-quasar.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-quasar.md)** — methodology, per-row notes and raw runs (43 collapsed block(s) moved out of this page).



## SFC compile (unique contents)

Files: **252** · Bytes: **1,565,611**

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter compileMany (session cache) | **48.4 ms** | 47.2 ms | 3.8 ms | 7.9% | 1.00x | 2,349,481 | 5.2k files/s |
| Vize native batch (max threads) | **49.6 ms** | 49.3 ms | 1.8 ms | 3.7% | 1.02x | 3,482,422 | 5.1k files/s |
| Vize native loop (1T) | **119.5 ms** | 117.1 ms | 1.2 ms | 1.0% | 2.47x | 3,482,422 | 2.1k files/s |
| Verter compileMany (stateless) | **215.9 ms** | 206.3 ms | 7.7 ms | 3.6% | 4.46x | 2,349,481 | 1.2k files/s |
| @vue/compiler-sfc 3.5 (1T) | **402.0 ms** | 397.5 ms | 4.8 ms | 1.2% | 8.31x | 3,572,282 | 627 files/s |
| @vue/compiler-sfc 3.6 (1T) | **409.6 ms** | 402.8 ms | 8.3 ms | 2.0% | 8.46x | 3,572,282 | 615 files/s |
| fervid compileSync (1T) ⚠ | (160.4 ms) | (157.1 ms) | – | – | not ranked | (5,189,721) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (71.4 ms) | (70.4 ms) | – | – | not ranked | (5,189,721) | – |

## Format

Files: **252** · Bytes: **1,565,611**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | **79.3 ms** | 76.5 ms | 3.0 ms | 3.7% | 1.00x | n/a | 3.2k files/s |
| Vize | **170.7 ms** | 160.9 ms | 32.5 ms | 19.0% ⚠ | 2.15x | n/a | 1.5k files/s |
| Oxfmt | **5.97 s** | 5.78 s | 202.2 ms | 3.4% | 75.32x | n/a | 42 files/s |
| Biome format ⚠ | (130.7 ms) | (128.5 ms) | – | – | not ranked | – | – |

## Lint

Files: **252** · Bytes: **1,565,611**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **87.1 ms** | 85.3 ms | 1.2 ms | 1.4% | 1.00x | n/a | 2.9k files/s |
| Vize lint (1T) | **138.6 ms** | 135.2 ms | 4.6 ms | 3.3% | 1.59x | n/a | 1.8k files/s |
| Verter host lint | **503.0 ms** | 497.1 ms | 3.6 ms | 0.7% | 5.78x | n/a | 501 files/s |
| eslint-plugin-vue (1T) | **3.55 s** | 3.46 s | 365.8 ms | 10.3% ⚠ | 40.80x | n/a | 71 files/s |
| eslint-plugin-vue (CLI) | **5.53 s** | 5.43 s | 65.9 ms | 1.2% | 63.50x | n/a | 46 files/s |
| eslint-plugin-vue (4 workers) | **5.79 s** | 5.75 s | 30.8 ms | 0.5% | 66.52x | n/a | 44 files/s |
| Biome lint (1T) ⚠ | (423.9 ms) | (417.7 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (200.8 ms) | (199.4 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (79.9 ms) | (68.4 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (65.8 ms) | (61.3 ms) | – | – | not ranked | – | – |

## Bundle (production build) — quasar:playground

Files: **252** · Bytes: **1,565,611**

### Vite 8 (Rolldown) — Vue integrations compared

> ❌ **All 4 cells in this group failed — no measurements.** ([full report](docs/results/real-world-Linux-quasar.md))
> - **Vite 8 (Rolldown) × @vitejs/plugin-vue ❌**: Build failed with 11 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src/pages/components/list-item.vue?vue&type=style&index=0&lang.sass
> - **Vite 8 (Rolldown) × unplugin-vue ❌**: Build failed with 11 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src/pages/components/list-expansion-item.vue?vue&type=style&index=0&…
> - **Vite 8 (Rolldown) × @vizejs/vite-plugin ❌**: Build failed with 11 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src/App.vue?vue=&type=style&index=0&lang=sass.sass
> - **Vite 8 (Rolldown) × @verter/unplugin ❌**: Build failed with 11 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src/pages/components/list-expansion-item.vue?vue&type=style&index=0&…

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 61 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-quasar.md).

### Rspack — Vue integrations compared

> ❌ **All 4 cells in this group failed — no measurements.** ([full report](docs/results/real-world-Linux-quasar.md))
> - **Rspack × vue-loader ❌**: × Module not found: Can't resolve '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/lang/' in '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-p…
> - **Rspack × unplugin-vue ❌**: × Module not found: Can't resolve '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/lang/' in '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-p…
> - **Rspack × @vizejs/rspack-plugin ❌**: × Module Error (from /home/runner/work/vue-benchmarks/vue-benchmarks/node_modules/.pnpm/@vizejs+rspack-plugin@0.302.0_@rspack+core@2.1.7/node_modules/@vizejs/rspack-plugin/dist/loader/scope-loader.mjs): │ [vize] CSS par…
> - **Rspack × @verter/unplugin ❌**: × Module not found: Can't resolve '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/lang/' in '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-p…

### webpack 5 — Vue integrations compared

> ❌ **All 4 cells in this group produced no measurement (❌ error / ⏭ skipped) — no measurements.** ([full report](docs/results/real-world-Linux-quasar.md))
> - **webpack 5 × vue-loader ❌**: Module not found: Error: Can't resolve '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/lang/' in '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/qua…
> - **webpack 5 × unplugin-vue ❌**: Module not found: Error: Can't resolve '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/lang/' in '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/qua…
> - **webpack 5 × @verter/unplugin ❌**: Module not found: Error: Can't resolve '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/lang/' in '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/qua…
> - **webpack 5 × @vizejs/rspack-plugin ⏭**: @vizejs/rspack-plugin publishes no webpack entry point

## HMR / dev server — quasar:playground

Files: **252** · Bytes: **1,565,611**

### Dev server cold start

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-quasar.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-quasar.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @verter/unplugin | **25.4 ms** | 25.3 ms | 0.1 ms | 0.5% | 1.00x | n/a | 9.9k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **29.3 ms** | 26.6 ms | 3.7 ms | 12.7% ⚠ | 1.15x | n/a | 8.6k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **29.5 ms** | 26.7 ms | 3.9 ms | 13.4% ⚠ | 1.16x | n/a | 8.5k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **109.4 ms** | 109.0 ms | 0.6 ms | 0.6% | 4.30x | n/a | 2.3k files/s |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-quasar.md).

### HMR update turnaround

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-quasar.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-quasar.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **9.0 ms** | 8.3 ms | 1.0 ms | 11.7% ⚠ | 1.00x | 38,268 | 28.0k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **12.3 ms** | 8.7 ms | 5.0 ms | 40.8% ⚠ | 1.37x | 22,758 | 20.5k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **14.5 ms** | 7.6 ms | 9.8 ms | 67.5% ⚠ | 1.61x | 38,266 | 17.4k files/s |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-quasar.md).

## Project test suite — quasar:playground

Files: **252** · Bytes: **1,565,611**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests executed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| quasar.dev — project's own toolchain (baseline) | **3.22 s** | 3.22 s | n/a | n/a | 1.00x | 226 | 78 files/s |
| quasar.dev — unplugin-vue ❌ | error | – | – | – | – | – | – |
| quasar.dev — @vizejs/vite-plugin ❌ | error | – | – | – | – | – | – |
| quasar.dev — @verter/unplugin ❌ | error | – | – | – | – | – | – |

## Project build (own config) — quasar:playground

Files: **252** · Bytes: **1,565,611**

## Project typecheck (own tsconfig) — quasar:playground

Files: **252** · Bytes: **1,565,611**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **152.8 ms** | 150.9 ms | 2.6 ms | 1.7% | 1.00x | 0 | 1.7k files/s |
| vue-tsc (JS) | **8.66 s** | 8.63 s | 36.5 ms | 0.4% | 56.68x | 0 | 29 files/s |
| vue-tsc (N) ⏭ | skipped | – | – | – | – | – | – |
| verter-tsc ⚠ | (351.8 ms) | (348.9 ms) | – | – | not ranked | (11) | – |

## Project component-meta (own tsconfig) — quasar:playground

Files: **252** · Bytes: **1,565,611**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | **29.42 s** | 28.76 s | 373.6 ms | 1.3% | 1.00x | 252 | 9 files/s |
| @verter/component-meta ⚠ | (2.46 s) | (2.44 s) | – | – | not ranked | (252) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — quasar:playground

Files: **1** · Bytes: **4,806**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **398.6 ms** | 52.3 ms | 172.9 ms | 43.4% ⚠ | 1.00x | 3 | 3 files/s |
| Vize | **451.1 ms** | 426.3 ms | 62.5 ms | 13.9% ⚠ | 1.13x | 15 | 2 files/s |
| Volar (JS) | **5.87 s** | 5.84 s | 43.1 ms | 0.7% | 14.73x | 0 | 0 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |

### hover on `langList`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **2.5 ms** | 2.3 ms | 0.6 ms | 23.3% ⚠ | 1.00x | 37 | 400 files/s |
| Vize | **3.2 ms** | 3.1 ms | 0.2 ms | 5.7% | 1.28x | 336 | 316 files/s |
| Verter | **3.2 ms** | 0.7 ms | 8.7 ms | 269.5% ⚠ | 1.28x | 37 | 309 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |



# vue-vben-admin

<!-- source: real-world-Linux-vue-vben-admin.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-vue-vben-admin.md)** — methodology, per-row notes and raw runs (42 collapsed block(s) moved out of this page).



## Methodology notes

- ⚠ HARNESS GAP — 1 surface run(s) threw and produced NO rows. These are failures of this harness on this machine, not results about any tool, and nothing should be inferred about the tools that would have been measured: compile on vue-vben-admin:core-ui (undefined)

## Format

Files: **330** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | **52.9 ms** | 49.7 ms | 2.3 ms | 4.4% | 1.00x | n/a | 6.2k files/s |
| Vize | **771.5 ms** | 238.9 ms | 395.2 ms | 51.2% ⚠ | 14.59x | n/a | 428 files/s |
| Oxfmt | **2.31 s** | 2.23 s | 45.7 ms | 2.0% | 43.75x | n/a | 143 files/s |
| Biome format ⚠ | (96.1 ms) | (90.5 ms) | – | – | not ranked | – | – |

## Lint

Files: **330** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **57.9 ms** | 54.4 ms | 1.6 ms | 2.8% | 1.00x | n/a | 5.7k files/s |
| Vize lint (1T) | **79.7 ms** | 73.3 ms | 5.5 ms | 7.0% | 1.38x | n/a | 4.1k files/s |
| Verter host lint | **284.1 ms** | 268.1 ms | 11.4 ms | 4.0% | 4.91x | n/a | 1.2k files/s |
| eslint-plugin-vue (1T) | **1.56 s** | 1.42 s | 102.3 ms | 6.6% | 26.86x | n/a | 212 files/s |
| eslint-plugin-vue (CLI) | **2.78 s** | 2.69 s | 153.6 ms | 5.5% | 48.00x | n/a | 119 files/s |
| eslint-plugin-vue (4 workers) | **2.95 s** | 2.92 s | 82.2 ms | 2.8% | 50.96x | n/a | 112 files/s |
| Biome lint (1T) ⚠ | (463.1 ms) | (442.5 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (191.0 ms) | (185.5 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (62.2 ms) | (59.3 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (54.0 ms) | (50.0 ms) | – | – | not ranked | – | – |

## Bundle (production build) — vue-vben-admin:core-ui

Files: **207** · Bytes: **933,224**

### Vite 8 (Rolldown) — Vue integrations compared

> ❌ **All 4 cells in this group failed — no measurements.** ([full report](docs/results/real-world-Linux-vue-vben-admin.md))
> - **Vite 8 (Rolldown) × @vitejs/plugin-vue ❌**: Build failed with 1 error: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/effects/common-ui/src/components/json-viewer/index.vue?vue&typ…
> - **Vite 8 (Rolldown) × unplugin-vue ❌**: Build failed with 1 error: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/effects/common-ui/src/components/json-viewer/index.vue?vue&typ…
> - **Vite 8 (Rolldown) × @vizejs/vite-plugin ❌**: Build failed with 1 error: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/effects/common-ui/src/components/json-viewer/index.vue?vue=&ty…
> - **Vite 8 (Rolldown) × @verter/unplugin ❌**: Build failed with 15 errors: [plugin vite:vue] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/@core/ui-kit/shadcn-ui/src/components/count-to-animator/coun…

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 29 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-vue-vben-admin.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × vue-loader | **205.9 ms** | 197.8 ms | 11.4 ms | 5.6% | 1.00x | 2,321,761 | 1.0k files/s |
| Rspack × unplugin-vue | **584.8 ms** | 510.1 ms | 105.7 ms | 18.1% ⚠ | 2.84x | 1,781,622 | 354 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader | **441.5 ms** | 403.7 ms | 53.3 ms | 12.1% ⚠ | 1.00x | 3,305,328 | 469 files/s |
| webpack 5 × unplugin-vue | **749.3 ms** | 733.9 ms | 21.7 ms | 2.9% | 1.70x | 2,550,208 | 276 files/s |
| webpack 5 × @verter/unplugin ❌ | error | – | – | – | – | – | – |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

## HMR / dev server — vue-vben-admin:core-ui

Files: **207** · Bytes: **933,224**

### Dev server cold start

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vue-vben-admin.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vue-vben-admin.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @verter/unplugin | **15.1 ms** | 13.1 ms | 2.7 ms | 18.2% ⚠ | 1.00x | n/a | 13.7k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **15.2 ms** | 14.5 ms | 1.0 ms | 6.6% | 1.01x | n/a | 13.6k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **15.8 ms** | 14.7 ms | 1.5 ms | 9.7% | 1.05x | n/a | 13.1k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **61.5 ms** | 59.2 ms | 3.2 ms | 5.3% | 4.08x | n/a | 3.4k files/s |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vue-vben-admin.md).

### HMR update turnaround

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vue-vben-admin.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vue-vben-admin.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **13.4 ms** | 13.2 ms | 0.3 ms | 2.4% | 1.00x | 79,363 | 15.4k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **37.5 ms** | 14.2 ms | 32.9 ms | 87.9% ⚠ | 2.79x | 62,309 | 5.5k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **80.3 ms** | 12.4 ms | 96.1 ms | 119.6% ⚠ | 5.98x | 62,311 | 2.6k files/s |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vue-vben-admin.md).

## Project test suite — vue-vben-admin:core-ui

Files: **330** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests executed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vben-admin-monorepo — unplugin-vue | **6.22 s** | 6.22 s | n/a | n/a | 1.00x | 308 | 53 files/s |
| vben-admin-monorepo — project's own toolchain (baseline) | **6.25 s** | 6.25 s | n/a | n/a | 1.00x | 308 | 53 files/s |
| vben-admin-monorepo — @verter/unplugin | **6.69 s** | 6.69 s | n/a | n/a | 1.07x | 308 | 49 files/s |
| vben-admin-monorepo — @vizejs/vite-plugin | **49.91 s** | 49.91 s | n/a | n/a | 8.02x | 308 | 7 files/s |

## Project build (own config) — vue-vben-admin:core-ui

Files: **330** · Bytes: **933,224**

## Project typecheck (own tsconfig) — vue-vben-admin:core-ui

Files: **330** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (JS) | **13.34 s** | 13.33 s | 26.2 ms | 0.2% | 1.00x | 0 | 9 files/s |
| vue-tsc (N) ⏭ | skipped | – | – | – | – | – | – |
| verter-tsc ⚠ | (2.33 s) | (2.33 s) | – | – | not ranked | (156) | – |
| Vize ⚠ | (2.65 s) | (2.64 s) | – | – | not ranked | (4) | – |

## Project component-meta (own tsconfig) — vue-vben-admin:core-ui

Files: **70** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | **452.5 ms** | 439.6 ms | 9.3 ms | 2.1% | 1.00x | 70 | 155 files/s |
| vue-component-meta | **1.79 s** | 1.74 s | 142.0 ms | 8.0% | 3.95x | 70 | 39 files/s |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — vue-vben-admin:core-ui

Files: **1** · Bytes: **5,190**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **548.7 ms** | 398.4 ms | 242.6 ms | 44.2% ⚠ | 1.00x | 0 | 2 files/s |
| Vize | **554.7 ms** | 550.2 ms | 47.2 ms | 8.5% | 1.01x | 4 | 2 files/s |
| Volar (JS) | **2.63 s** | 2.59 s | 49.7 ms | 1.9% | 4.79x | 0 | 0 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |

### hover on `props`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.5 ms** | 2.9 ms | 2.0 ms | 58.8% ⚠ | 1.00x | 621 | 288 files/s |
| Verter | **51.2 ms** | 41.8 ms | 10.3 ms | 20.1% ⚠ | 14.63x | 618 | 20 files/s |
| Vize | **71.0 ms** | 67.6 ms | 5.0 ms | 7.0% | 20.29x | 518 | 14 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |



# vuetify

<!-- source: real-world-Linux-vuetify.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-vuetify.md)** — methodology, per-row notes and raw runs (46 collapsed block(s) moved out of this page).



## SFC compile (⚠ 1 duplicate bodies — content-hash caches may inflate throughput)

Files: **1,246** · Bytes: **2,032,022**

> **Did not run — excluded from every table below.**
>
> - **fervid** (`@fervid/napi`) — aborted the benchmark process: killed by signal SIGABRT while compiling fixtures/real/vuetify/packages/docs/src/examples/v-data-table/prop-sort-icon.vue — thread '&lt;unnamed>' panicked at crates/fervid_css/src/css/transform.rs:176:17.
>
> _Why an aborted tool is excluded rather than bracketed, and the full per-tool detail: [full report](docs/results/real-world-Linux-vuetify.md)._

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **87.0 ms** | 86.0 ms | 2.0 ms | 2.3% | 1.00x | 4,149,584 | 14.3k files/s |
| Vize native loop (1T) | **246.6 ms** | 245.3 ms | 1.8 ms | 0.7% | 2.83x | 4,149,584 | 5.1k files/s |
| @vue/compiler-sfc 3.5 (1T) | **778.1 ms** | 730.7 ms | 34.9 ms | 4.5% | 8.94x | 4,395,984 | 1.6k files/s |
| @vue/compiler-sfc 3.6 (1T) | **780.3 ms** | 732.9 ms | 31.2 ms | 4.0% | 8.97x | 4,395,984 | 1.6k files/s |
| Verter compileMany (stateless) ⚠ | (2.32 s) | (2.26 s) | – | – | not ranked | (3,308,945) | – |
| Verter compileMany (session cache) ⚠ | (102.6 ms) | (88.5 ms) | – | – | not ranked | (3,308,945) | – |

## Format

Files: **1,246** · Bytes: **2,032,022**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | **79.8 ms** | 79.3 ms | 1.3 ms | 1.6% | 1.00x | n/a | 15.6k files/s |
| Vize | **384.1 ms** | 376.3 ms | 16.7 ms | 4.3% | 4.81x | n/a | 3.2k files/s |
| Oxfmt | **6.33 s** | 6.24 s | 68.7 ms | 1.1% | 79.34x | n/a | 197 files/s |
| Biome format ⚠ | (273.2 ms) | (272.7 ms) | – | – | not ranked | – | – |

## Lint

Files: **1,246** · Bytes: **2,032,022**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **124.2 ms** | 120.7 ms | 1.8 ms | 1.5% | 1.00x | n/a | 10.0k files/s |
| Vize lint (1T) | **235.7 ms** | 231.1 ms | 5.0 ms | 2.1% | 1.90x | n/a | 5.3k files/s |
| Verter host lint | **704.1 ms** | 698.1 ms | 5.7 ms | 0.8% | 5.67x | n/a | 1.8k files/s |
| eslint-plugin-vue (1T) | **7.06 s** | 6.90 s | 335.4 ms | 4.8% | 56.81x | n/a | 177 files/s |
| eslint-plugin-vue (4 workers) | **8.25 s** | 8.20 s | 66.1 ms | 0.8% | 66.43x | n/a | 151 files/s |
| eslint-plugin-vue (CLI) | **8.97 s** | 8.83 s | 90.2 ms | 1.0% | 72.22x | n/a | 139 files/s |
| Biome lint (1T) ⚠ | (1.32 s) | (1.30 s) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (536.5 ms) | (531.0 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (124.4 ms) | (116.3 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (87.2 ms) | (84.7 ms) | – | – | not ranked | – | – |

## Bundle (production build) — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **1.72 s** | 1.69 s | 47.3 ms | 2.8% | 1.00x | 3,318,895 | 725 files/s |
| Vite 8 (Rolldown) × unplugin-vue | **1.77 s** | 1.75 s | 23.9 ms | 1.4% | 1.03x | 3,313,520 | 706 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **2.40 s** | 2.39 s | 14.0 ms | 0.6% | 1.40x | 3,174,305 | 520 files/s |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 78 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-vuetify.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × unplugin-vue | **3.02 s** | 2.95 s | 97.0 ms | 3.2% | 1.00x | 8,532,199 | 413 files/s |
| Rspack × vue-loader | **3.87 s** | 3.80 s | 105.3 ms | 2.7% | 1.28x | 12,130,685 | 322 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × unplugin-vue | **3.93 s** | 3.78 s | 213.4 ms | 5.4% | 1.00x | 9,858,508 | 317 files/s |
| webpack 5 × vue-loader | **4.89 s** | 4.60 s | 409.1 ms | 8.4% | 1.24x | 17,785,875 | 255 files/s |
| webpack 5 × @verter/unplugin ❌ | error | – | – | – | – | – | – |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

## HMR / dev server — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

### Dev server cold start

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vuetify.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vuetify.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **134.6 ms** | 129.9 ms | 6.6 ms | 4.9% | 1.00x | n/a | 9.3k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **148.7 ms** | 109.6 ms | 55.2 ms | 37.2% ⚠ | 1.10x | n/a | 8.4k files/s |
| Vite 8 (Rolldown) × @verter/unplugin | **158.7 ms** | 153.7 ms | 7.0 ms | 4.4% | 1.18x | n/a | 7.9k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **345.4 ms** | 341.3 ms | 5.8 ms | 1.7% | 2.57x | n/a | 3.6k files/s |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vuetify.md).

### HMR update turnaround

#### ROLLDOWN — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vuetify.md).

#### RSPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vuetify.md).

#### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **8.5 ms** | 5.9 ms | 3.6 ms | 42.3% ⚠ | 1.00x | 2,213 ⚠ | 147.4k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **9.3 ms** | 9.0 ms | 0.4 ms | 4.6% | 1.11x | 19,817 | 133.3k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **46.7 ms** | 7.7 ms | 55.1 ms | 118.2% ⚠ | 5.52x | 19,815 | 26.7k files/s |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.6 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vuetify.md).

## Project test suite — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests executed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vuetify — @verter/unplugin | **41.45 s** | 41.45 s | n/a | n/a | 1.00x | 807 | 30 files/s |
| vuetify — project's own toolchain (baseline) | **41.53 s** | 41.53 s | n/a | n/a | 1.00x | 807 | 30 files/s |
| vuetify — @vizejs/vite-plugin | **41.80 s** | 41.80 s | n/a | n/a | 1.01x | 807 | 30 files/s |
| vuetify — unplugin-vue | **42.04 s** | 42.04 s | n/a | n/a | 1.01x | 807 | 30 files/s |

## Project build (own config) — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

## Project typecheck (own tsconfig) — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **4.05 s** | 3.99 s | 92.5 ms | 2.3% | 1.00x | 25 | 307 files/s |
| verter-tsc | **5.07 s** | 5.06 s | 20.9 ms | 0.4% | 1.25x | 13,593 | 246 files/s |
| vue-tsc (JS) | **29.45 s** | 29.41 s | 65.8 ms | 0.2% | 7.27x | 21 | 42 files/s |
| vue-tsc (N) ⏭ | skipped | – | – | – | – | – | – |

## Project component-meta (own tsconfig) — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | **8.46 s** | 7.15 s | 595.0 ms | 7.0% | 1.00x | 1,246 | 147 files/s |
| @verter/component-meta ⚠ | (6.00 s) | (5.98 s) | – | – | not ranked | (1,246) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — vuetify:docs

Files: **1** · Bytes: **3,428**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **777.3 ms** | 689.5 ms | 164.8 ms | 21.2% ⚠ | 1.00x | 2 | 1 files/s |
| Verter | **934.6 ms** | 642.1 ms | 134.5 ms | 14.4% ⚠ | 1.20x | 0 | 1 files/s |
| Volar (JS) | **10.70 s** | 10.64 s | 35.1 ms | 0.3% | 13.77x | 0 | 0 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |

### hover on `user`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.5 ms** | 1.4 ms | 0.1 ms | 7.1% | 1.00x | 5,027 | 687 files/s |
| Vize | **2.1 ms** | 2.0 ms | 2.7 ms | 127.4% ⚠ | 1.40x | 332 | 479 files/s |
| Volar (JS) | **8.4 ms** | 7.8 ms | 51.2 ms | 609.5% ⚠ | 5.60x | 5,035 | 119 files/s |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |



<!-- REAL_WORLD_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports: [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
