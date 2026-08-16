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

> Auto-updated 2026-08-16 from the **Benchmark** workflow (rolldown-style: measure on CI → commit README on `main` with `[skip ci]`).
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
| Vize native batch (max threads) | **22.8 ms** | 19.6 ms | 2.4 ms | 10.4% ⚠ | 1.00x | 609,596 | 8.8k files/s |
| Verter compileMany (session cache) | **24.6 ms** | 20.7 ms | 3.3 ms | 13.2% ⚠ | 1.08x | 548,989 | 8.1k files/s |
| Vize native loop (1T) | **55.9 ms** | 54.6 ms | 0.7 ms | 1.3% | 2.45x | 609,596 | 3.6k files/s |
| Verter compileMany (stateless) | **124.3 ms** | 118.8 ms | 4.2 ms | 3.4% | 5.45x | 548,989 | 1.6k files/s |
| @vue/compiler-sfc 3.5 (1T) | **177.9 ms** | 173.3 ms | 8.6 ms | 4.8% | 7.79x | 670,030 | 1.1k files/s |
| @vue/compiler-sfc 3.6 (1T) | **182.2 ms** | 179.5 ms | 5.8 ms | 3.2% | 7.98x | 670,030 | 1.1k files/s |
| fervid compileSync (1T) ⚠ | (57.4 ms) | (56.4 ms) | – | – | not ranked | (775,738) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (26.2 ms) | (25.4 ms) | – | – | not ranked | (775,738) | – |

#### VDOM · development · sourcemap off

Target: `vdom` · Environment: `development` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **24.3 ms** | 18.6 ms | 2.5 ms | 10.4% ⚠ | 1.00x | 609,596 | 8.2k files/s |
| Verter compileMany (session cache) | **25.9 ms** | 17.8 ms | 6.1 ms | 23.5% ⚠ | 1.07x | 671,880 | 7.7k files/s |
| Vize native loop (1T) | **55.2 ms** | 54.0 ms | 1.5 ms | 2.7% | 2.28x | 609,596 | 3.6k files/s |
| Verter compileMany (stateless) | **126.0 ms** | 117.2 ms | 7.6 ms | 6.0% | 5.20x | 671,880 | 1.6k files/s |
| @vue/compiler-sfc 3.6 (1T) | **167.1 ms** | 152.8 ms | 8.8 ms | 5.3% | 6.89x | 656,372 | 1.2k files/s |
| @vue/compiler-sfc 3.5 (1T) | **168.7 ms** | 151.7 ms | 8.7 ms | 5.2% | 6.96x | 656,372 | 1.2k files/s |
| fervid compileSync (1T) ⚠ | (57.1 ms) | (56.9 ms) | – | – | not ranked | (787,866) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (31.1 ms) | (25.0 ms) | – | – | not ranked | (787,866) | – |

#### VAPOR · production · sourcemap off

Target: `vapor` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter compileMany (session cache) | **19.1 ms** | 18.2 ms | 4.5 ms | 23.3% ⚠ | 1.00x | 585,310 | 10.5k files/s |
| Vize native batch (max threads) | **20.1 ms** | 19.6 ms | 0.6 ms | 2.8% | 1.05x | 754,214 | 9.9k files/s |
| Vize native loop (1T) | **57.2 ms** | 56.8 ms | 1.5 ms | 2.6% | 2.99x | 754,214 | 3.5k files/s |
| Verter compileMany (stateless) | **120.5 ms** | 117.1 ms | 4.5 ms | 3.8% | 6.30x | 585,310 | 1.7k files/s |
| @vue/compiler-sfc 3.6 (1T) | **300.3 ms** | 282.7 ms | 11.4 ms | 3.8% | 15.69x | 681,563 | 666 files/s |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – |

#### VAPOR · development · sourcemap off

Target: `vapor` · Environment: `development` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter compileMany (session cache) | **19.5 ms** | 17.5 ms | 3.6 ms | 18.4% ⚠ | 1.00x | 621,048 | 10.2k files/s |
| Vize native batch (max threads) | **20.2 ms** | 19.7 ms | 0.4 ms | 2.1% | 1.03x | 754,214 | 9.9k files/s |
| Vize native loop (1T) | **57.0 ms** | 56.6 ms | 1.1 ms | 1.9% | 2.92x | 754,214 | 3.5k files/s |
| Verter compileMany (stateless) | **120.2 ms** | 119.2 ms | 2.6 ms | 2.1% | 6.16x | 621,048 | 1.7k files/s |
| @vue/compiler-sfc 3.6 (1T) | **280.0 ms** | 273.9 ms | 42.3 ms | 15.1% ⚠ | 14.34x | 683,301 | 714 files/s |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – |

### JSX compile

Files: **200** · Bytes: **38,804**

##### VAPOR — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (vapor) | **3.1 ms** | 2.8 ms | 0.2 ms | 5.3% | 1.00x | n/a | 64.4k files/s |
| vue-jsx-vapor/api | **3.4 ms** | 3.3 ms | 0.1 ms | 2.4% | 1.09x | n/a | 58.9k files/s |

##### VDOM — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | **2.5 ms** | 2.5 ms | 0.1 ms | 4.4% | 1.00x | n/a | 79.0k files/s |
| @vue/babel-plugin-jsx (Babel VDOM) | **117.0 ms** | 115.3 ms | 8.5 ms | 7.3% | 46.24x | n/a | 1.7k files/s |

### Typecheck

Files: **200** · Bytes: **285,701**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | **1.09 s** | 1.07 s | 16.1 ms | 1.5% | 1.00x | 420 | 183 files/s |
| Golar (lint+check) | **1.57 s** | 1.53 s | 24.5 ms | 1.6% | 1.43x | 0 | 128 files/s |
| Golar typecheck | **1.58 s** | 1.55 s | 18.3 ms | 1.2% | 1.45x | 0 | 126 files/s |
| Vize | **1.64 s** | 1.62 s | 22.0 ms | 1.3% | 1.50x | 0 | 122 files/s |
| vue-tsc (N) | **2.27 s** | 2.25 s | 15.1 ms | 0.7% | 2.08x | 0 | 88 files/s |
| vue-tsc (JS) | **4.85 s** | 4.78 s | 44.2 ms | 0.9% | 4.44x | 0 | 41 files/s |

### Format

Files: **200** · Bytes: **285,701**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **125.9 ms** | 120.6 ms | 2.7 ms | 2.1% | 1.00x | n/a | 1.6k files/s |
| Oxfmt | **3.15 s** | 3.14 s | 48.5 ms | 1.5% | 25.05x | n/a | 63 files/s |
| Prettier | **3.66 s** | 3.59 s | 40.6 ms | 1.1% | 29.07x | n/a | 55 files/s |
| Biome format ⚠ | (119.2 ms) | (118.1 ms) | – | – | not ranked | – | – |

### Lint

Files: **200** · Bytes: **285,701**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **82.8 ms** | 81.2 ms | 1.7 ms | 2.1% | 1.00x | n/a | 2.4k files/s |
| Vize lint (1T) | **101.8 ms** | 98.5 ms | 8.9 ms | 8.8% | 1.23x | n/a | 2.0k files/s |
| Verter host lint | **149.7 ms** | 147.0 ms | 2.1 ms | 1.4% | 1.81x | n/a | 1.3k files/s |
| eslint-plugin-vue (1T) | **1.66 s** | 1.61 s | 94.1 ms | 5.7% | 20.10x | n/a | 120 files/s |
| eslint-plugin-vue (CLI) | **3.06 s** | 3.06 s | 13.5 ms | 0.4% | 37.03x | n/a | 65 files/s |
| eslint-plugin-vue (4 workers) | **3.44 s** | 3.36 s | 51.7 ms | 1.5% | 41.62x | n/a | 58 files/s |
| Biome lint (1T) ⚠ | (364.9 ms) | (361.1 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (186.9 ms) | (180.7 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (81.0 ms) | (77.7 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (79.2 ms) | (72.9 ms) | – | – | not ranked | – | – |

### Component-meta

Files: **100** · Bytes: **142,771**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Meta members | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | **464.5 ms** | 459.8 ms | 17.3 ms | 3.7% | 1.00x | 88 | 215 files/s |
| vue-component-meta | **922.9 ms** | 889.3 ms | 243.8 ms | 26.4% ⚠ | 1.99x | 1,343 | 108 files/s |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

### LSP (editor language server)

Files: **1** · Bytes: **745**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **281.9 ms** | 273.2 ms | 6.5 ms | 2.3% | 1.00x | 113 ⚠ | 4 files/s |
| Volar (N) | **414.5 ms** | 411.2 ms | 2.0 ms | 0.5% | 1.47x | 114 ⚠ | 2 files/s |
| Vize | **430.0 ms** | 424.9 ms | 5.8 ms | 1.3% | 1.53x | 341 | 2 files/s |
| Volar (JS) | **1.13 s** | 1.10 s | 17.5 ms | 1.6% | 4.00x | 114 ⚠ | 1 files/s |



#### Ubuntu/Linux · cache-demo (not ranking)

<!-- source: bench-Linux-200-repeated-cache-demo.md -->

> 📄 **[Full details →](docs/results/bench-Linux-200-repeated-cache-demo.md)** — methodology, per-row notes and raw runs (3 collapsed block(s) moved out of this page).



### SFC compile (⚠ 199 duplicate bodies — content-hash caches may inflate throughput)

Files: **200** · Bytes: **46,600**

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **6.8 ms** | 6.7 ms | 0.1 ms | 1.3% | 1.00x | 107,800 | 29.5k files/s |
| fervid compileAsync (4-thread libuv pool) | **8.3 ms** | 8.0 ms | 0.4 ms | 4.5% | 1.22x | 120,600 | 24.1k files/s |
| fervid compileSync (1T) | **8.8 ms** | 8.7 ms | 0.1 ms | 0.6% | 1.29x | 120,600 | 22.8k files/s |
| Verter compileMany (session cache) | **9.9 ms** | 9.0 ms | 1.4 ms | 13.7% ⚠ | 1.47x | 140,600 | 20.1k files/s |
| Vize native loop (1T) | **16.0 ms** | 15.9 ms | 0.1 ms | 0.4% | 2.35x | 107,800 | 12.5k files/s |
| @vue/compiler-sfc 3.5 (1T) | **48.4 ms** | 47.4 ms | 1.3 ms | 2.8% | 7.13x | 153,800 | 4.1k files/s |
| @vue/compiler-sfc 3.6 (1T) | **52.1 ms** | 51.5 ms | 0.8 ms | 1.6% | 7.67x | 153,800 | 3.8k files/s |
| Verter compileMany (stateless) | **104.1 ms** | 97.8 ms | 8.9 ms | 8.6% | 15.34x | 140,600 | 1.9k files/s |



<!-- BENCHMARK_RESULTS_END -->

## IDE operation results

Per-operation editor benchmarks from the `ide` job (`scripts/ide-bench.mjs`). Ranked **per operation**, never pooled — `didOpen→diagnostics` and `foldingRange` differ by orders of magnitude and answer unrelated questions. Not comparable to the timing tables above: different job, different load profile.

Servers here are Volar, **Volar on the TNB/tsgo tsdk**, Vize and Verter. Three caveats apply to these tables specifically:

- **`Volar (TNB / tsgo tsdk)` errors resolving an auto-import completion** — `Debug Failure. False expression. at getCompletionEntryCodeActionsAndSourceDisplay`. Stock Volar resolves the same item. [Details](docs/methodology.md#caveat-the-tnb-engine-swap-fails-an-ide-completion-resolve-operation).
- **Vize may answer with its tsgo backend absent**, with no error in the LSP traffic. [Details](docs/methodology.md#caveat-vizes-type-checking-backend-sometimes-never-starts-and-the-row-still-answers).
- **Both Volar rows are two processes**, charged the slower half on every operation; Vize and Verter are one. [Details](docs/methodology.md#caveat-volars-lsp-memory-row-is-not-the-whole-of-volar-but-the-lsp-timing-row-is).

<!-- IDE_RESULTS_START -->

> Auto-updated 2026-08-16 from the **Benchmark** workflow (`ide` job — per-operation editor benchmarks).
> Ranked **per operation**, never pooled: `didOpen→diagnostics` and `foldingRange` answer unrelated questions.
> Same-VM rule holds within the job; these numbers are not comparable to the timing tables above.

<!-- notes: notes-ide.md -->

> 📖 **[How to read these tables →](docs/results/notes-ide.md)** — ranking rules, standing notes and the tools legend shared by every block in this section.

#### Ubuntu/Linux · ide ops

<!-- source: ide-Linux.md -->

> 📄 **[Full details →](docs/results/ide-Linux.md)** — methodology, per-row notes and raw runs (79 collapsed block(s) moved out of this page).

## IDE operation results

- **Generated:** 2026-08-16T09:15:20.140Z
- **Runner:** linux/x64 · Node v22.23.2
- **Runs / warmups:** 3 / 1

### IDE · background

Files: **1** · Bytes: **0**

#### Semantic tokens (full)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 0.6 ms | 0.0 ms | 5.3% | 1.00x | 15 | n/a |
| Volar (N) | **359.6 ms** | 335.6 ms | 17.3 ms | 4.9% | 625.51x | 48 | n/a |
| Volar (JS) | **808.4 ms** | 787.5 ms | 56.5 ms | 6.8% | 1406.27x | 48 | n/a |
| Verter ⚠ | (33.7 ms) | (32.2 ms) | – | – | not ranked | – | – |

#### Semantic tokens (delta after edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (1.1 ms) | (0.9 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | – | – |

#### Document symbols (outline)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.5 ms** | 0.5 ms | 0.1 ms | 11.4% ⚠ | 1.00x | 12 | n/a |
| Volar (N) | **17.0 ms** | 16.8 ms | 0.2 ms | 1.3% | 31.71x | 25 | n/a |
| Volar (JS) | **17.5 ms** | 16.6 ms | 3.5 ms | 18.4% ⚠ | 32.49x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (2) | – |

#### Document highlight (caret move)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 5.9% | 1.00x | 4 | n/a |
| Volar (JS) | **18.6 ms** | 18.3 ms | 0.5 ms | 2.5% | 76.50x | 5 | n/a |
| Volar (N) | **30.7 ms** | 30.0 ms | 0.7 ms | 2.3% | 126.19x | 5 | n/a |
| Verter ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | (4) | – |

#### Inlay hints (document range)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 3.2% | 1.00x | 2 | n/a |
| Volar (JS) | **74.0 ms** | 71.9 ms | 1.5 ms | 2.1% | 167.98x | 14 | n/a |
| Volar (N) | **176.5 ms** | 174.8 ms | 6.8 ms | 3.8% | 400.56x | 14 | n/a |
| Verter ⚠ | (0.6 ms) | (0.4 ms) | – | – | not ranked | – | – |

#### Folding ranges

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 5.9% | 1.00x | 9 | n/a |
| Verter | **0.5 ms** | 0.3 ms | 0.1 ms | 21.2% ⚠ | 2.02x | 7 | n/a |
| Volar (N) | **6.6 ms** | 6.4 ms | 1.4 ms | 19.7% ⚠ | 29.02x | 13 | n/a |
| Volar (JS) | **123.5 ms** | 119.8 ms | 3.1 ms | 2.5% | 544.11x | 13 | n/a |

### IDE · completion

Files: **1** · Bytes: **0**

#### Completion: script member

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.8 ms | 0.1 ms | 9.1% | 1.00x | 3 | n/a |
| Vize | **1.0 ms** | 1.0 ms | 0.0 ms | 2.7% | 1.27x | 3 | n/a |
| Volar (N) | **1.8 ms** | 1.8 ms | 0.2 ms | 9.3% | 2.27x | 3 | n/a |
| Volar (JS) ⚠ | (4.3 ms) | (3.9 ms) | – | – | not ranked | (3) | – |

#### Completion: component tag &lt;Ch

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **35.8 ms** | 34.8 ms | 10.6 ms | 25.5% ⚠ | 1.00x | 1,193 | n/a |
| Volar (N) | **37.8 ms** | 37.0 ms | 0.5 ms | 1.3% | 1.06x | 192 | n/a |
| Volar (JS) | **41.7 ms** | 39.8 ms | 3.5 ms | 8.2% | 1.16x | 192 | n/a |
| Vize ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | (42) | – |

#### Completion: prop name &lt;C :

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.8 ms** | 1.5 ms | 0.2 ms | 13.2% ⚠ | 1.00x | 16 | n/a |
| Volar (N) | **40.1 ms** | 39.5 ms | 0.3 ms | 0.8% | 22.06x | 26 | n/a |
| Volar (JS) ⚠ | (27.3 ms) | (18.9 ms) | – | – | not ranked | (26) | – |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (4) | – |

#### Completion: event name &lt;C @

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **7.4 ms** | 7.2 ms | 0.2 ms | 2.4% | 1.00x | 25 | n/a |
| Volar (JS) ⚠ | (134.8 ms) | (15.0 ms) | – | – | not ranked | (25) | – |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (12) | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

#### Completion: directive v-

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 2.6% | 1.00x | 15 | n/a |
| Volar (N) | **16.4 ms** | 16.3 ms | 1.1 ms | 6.7% | 43.47x | 498 | n/a |
| Volar (JS) | **26.5 ms** | 23.8 ms | 2.6 ms | 9.9% | 70.24x | 498 | n/a |
| Verter ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (3) | – |

#### Completion: slot name &lt;template #

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 0.3 ms | 0.0 ms | 10.4% ⚠ | 1.00x | 2 | n/a |
| Vize | **0.6 ms** | 0.5 ms | 0.1 ms | 11.0% ⚠ | 1.72x | 30 | n/a |
| Volar (N) | **14.9 ms** | 13.7 ms | 0.8 ms | 5.4% | 42.81x | 500 | n/a |
| Volar (JS) | **15.5 ms** | 14.8 ms | 1.4 ms | 8.8% | 44.45x | 500 | n/a |

#### Completion: auto-import

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **38.2 ms** | 31.7 ms | 4.3 ms | 11.8% ⚠ | 1.00x | 1,077 | n/a |
| Volar (N) | **48.7 ms** | 32.2 ms | 11.8 ms | 26.0% ⚠ | 1.28x | 1,073 | n/a |
| Vize ⚠ | (92.7 ms) | (90.6 ms) | – | – | not ranked | (1,103) | – |
| Verter ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (9) | – |

#### Resolve: auto-import edit

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **49.7 ms** | 48.2 ms | 2.8 ms | 5.6% | 1.00x | 241 | n/a |
| Volar (N) | **162.8 ms** | 160.3 ms | 3.9 ms | 2.4% | 3.28x | 241 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

#### Resolve: script member detail

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.1 ms** | 2.8 ms | 0.4 ms | 11.3% ⚠ | 1.00x | 25 | n/a |
| Verter | **4.3 ms** | 4.2 ms | 0.4 ms | 9.0% | 1.40x | 25 | n/a |
| Volar (N) | **8.2 ms** | 8.0 ms | 0.8 ms | 9.1% | 2.63x | 25 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

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
| Vize | **149.9 ms** | 144.9 ms | 9.5 ms | 6.2% | 1.00x | 1 | n/a |
| Volar (JS) | **412.1 ms** | 407.4 ms | 5.6 ms | 1.4% | 2.75x | 1 | n/a |
| Volar (N) | **461.1 ms** | 451.1 ms | 9.8 ms | 2.1% | 3.08x | 1 | n/a |
| Verter | **506.2 ms** | 495.2 ms | 6.7 ms | 1.3% | 3.38x | 1 | n/a |

#### Edit fixes it -> diagnostic clears

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **145.9 ms** | 143.1 ms | 5.4 ms | 3.6% | 1.00x | 0 | n/a |
| Volar (N) | **382.1 ms** | 380.0 ms | 1.4 ms | 0.4% | 2.62x | 0 | n/a |
| Volar (JS) | **465.4 ms** | 460.7 ms | 5.7 ms | 1.2% | 3.19x | 0 | n/a |
| Verter | **661.5 ms** | 657.1 ms | 16.6 ms | 2.5% | 4.53x | 0 | n/a |

#### Hover after retype -> NEW type

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.2 ms** | 15.8 ms | 0.7 ms | 4.5% | 1.00x | 47 | n/a |
| Volar (JS) | **53.2 ms** | 51.9 ms | 1.0 ms | 2.0% | 3.30x | 47 | n/a |
| Verter | **86.6 ms** | 82.9 ms | 5.0 ms | 5.8% | 5.36x | 40 | n/a |
| Vize | **233.3 ms** | 209.8 ms | 13.7 ms | 6.1% | 14.44x | 40 | n/a |

#### ... same hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.2 ms** | 15.8 ms | 0.7 ms | 4.5% | 1.00x | 1 | n/a |
| Volar (JS) | **53.2 ms** | 51.9 ms | 1.0 ms | 2.0% | 3.30x | 1 | n/a |
| Verter | **86.6 ms** | 82.9 ms | 5.0 ms | 5.8% | 5.36x | 1 | n/a |
| Vize | **233.3 ms** | 209.8 ms | 13.7 ms | 6.1% | 14.44x | 1 | n/a |

#### Steady state: edits 1-5 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **15.3 ms** | 14.9 ms | 0.3 ms | 1.9% | 1.00x | n/a | n/a |
| Volar (JS) | **42.1 ms** | 40.4 ms | 1.4 ms | 3.4% | 2.75x | n/a | n/a |
| Verter | **56.2 ms** | 50.5 ms | 3.4 ms | 6.3% | 3.67x | n/a | n/a |
| Vize | **175.2 ms** | 168.2 ms | 5.8 ms | 3.3% | 11.44x | n/a | n/a |

#### Steady state: edits 6-10 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **14.9 ms** | 14.9 ms | 0.0 ms | 0.1% | 1.00x | 0 | n/a |
| Volar (JS) | **33.9 ms** | 32.9 ms | 1.4 ms | 4.0% | 2.27x | -9 | n/a |
| Verter | **58.4 ms** | 48.1 ms | 6.2 ms | 11.3% ⚠ | 3.92x | -8 | n/a |
| Vize | **171.2 ms** | 168.7 ms | 5.8 ms | 3.3% | 11.48x | -0 | n/a |

#### Child prop retype -> Parent diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **304.5 ms** | 297.7 ms | 28.0 ms | 8.8% | 1.00x | 1 | n/a |
| Volar (JS) | **378.2 ms** | 376.2 ms | 1.7 ms | 0.4% | 1.24x | 1 | n/a |
| Volar (N) | **383.6 ms** | 383.2 ms | 0.3 ms | 0.1% | 1.26x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

#### Child prop retype -> Parent hover

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **64.2 ms** | 63.3 ms | 6.1 ms | 9.0% | 1.00x | 42 | n/a |
| Volar (JS) | **106.2 ms** | 104.5 ms | 5.6 ms | 5.1% | 1.65x | 42 | n/a |
| Vize | **338.8 ms** | 333.2 ms | 8.1 ms | 2.4% | 5.28x | 42 | n/a |
| Verter ⚠ | (4.7 ms) | (4.5 ms) | – | – | not ranked | (42) | – |

#### ... Parent hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **64.2 ms** | 63.3 ms | 6.1 ms | 9.0% | 1.00x | 1 | n/a |
| Volar (JS) | **106.2 ms** | 104.5 ms | 5.6 ms | 5.1% | 1.65x | 1 | n/a |
| Vize | **338.8 ms** | 333.2 ms | 8.1 ms | 2.4% | 5.28x | 1 | n/a |
| Verter | **499.6 ms** | 460.2 ms | 25.8 ms | 5.3% | 7.78x | 3 | n/a |

### IDE · navigation

Files: **1** · Bytes: **0**

#### Definition: &lt;ChildCard/> tag

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 0.3 ms | 0.1 ms | 19.6% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **28.3 ms** | 26.0 ms | 3.4 ms | 11.8% ⚠ | 80.80x | 1 | n/a |
| Volar (JS) | **215.2 ms** | 206.9 ms | 7.0 ms | 3.3% | 615.58x | 1 | n/a |
| Verter ⚠ | (0.7 ms) | (0.5 ms) | – | – | not ranked | (1) | – |

#### Definition: imported fn (script)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **4.2 ms** | 4.1 ms | 0.1 ms | 2.3% | 1.00x | 1 | n/a |
| Volar (N) | **5.9 ms** | 5.7 ms | 0.7 ms | 10.8% ⚠ | 1.40x | 1 | n/a |
| Volar (JS) | **6.8 ms** | 6.6 ms | 2.5 ms | 30.4% ⚠ | 1.63x | 1 | n/a |
| Verter ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | (1) | – |

#### Type definition: typed binding

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **21.7 ms** | 20.5 ms | 2.9 ms | 12.8% ⚠ | 1.00x | 1 | n/a |
| Verter | **35.6 ms** | 30.9 ms | 6.3 ms | 17.3% ⚠ | 1.64x | 1 | n/a |
| Volar (N) | **67.3 ms** | 44.8 ms | 18.6 ms | 28.8% ⚠ | 3.10x | 1 | n/a |
| Vize ⚠ | (0.3 ms) | (0.2 ms) | – | – | not ranked | – | – |

#### References: prop -> parent template

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **78.4 ms** | 63.4 ms | 19.1 ms | 23.6% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **123.1 ms** | 122.8 ms | 1.7 ms | 1.4% | 1.57x | 4 | n/a |
| Vize ⚠ | (7.2 ms) | (6.9 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (103.8 ms) | (86.9 ms) | – | – | not ranked | (3) | – |

#### Prepare rename: prop

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.7 ms** | 1.7 ms | 0.0 ms | 2.4% | 1.00x | n/a | n/a |
| Volar (JS) | **5.7 ms** | 5.2 ms | 0.4 ms | 7.4% | 3.34x | n/a | n/a |
| Volar (N) ⚠ | (4.4 ms) | (4.2 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | – | – |

#### Rename prop (cross-file edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.1 ms** | 3.0 ms | 0.3 ms | 7.9% | 1.00x | 4 | n/a |
| Volar (N) | **4.0 ms** | 3.6 ms | 0.4 ms | 9.8% | 1.31x | 4 | n/a |
| Vize ⚠ | (5.4 ms) | (5.4 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (1.3 ms) | (1.3 ms) | – | – | not ranked | (3) | – |

#### Code action at diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **34.8 ms** | 33.7 ms | 1.8 ms | 5.1% | 1.00x | 2 | n/a |
| Volar (N) | **736.3 ms** | 728.8 ms | 6.9 ms | 0.9% | 21.17x | 2 | n/a |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.7 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

#### Signature help after `(`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **17.0 ms** | 16.5 ms | 0.7 ms | 4.1% | 1.00x | 1 | n/a |
| Volar (N) | **23.0 ms** | 22.4 ms | 0.4 ms | 1.9% | 1.35x | 1 | n/a |
| Vize | **248.3 ms** | 230.3 ms | 16.1 ms | 6.5% | 14.58x | 1 | n/a |
| Verter ⚠ | (5.1 ms) | (5.0 ms) | – | – | not ranked | (0) | – |

#### Format unformatted SFC

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **66.0 ms** | 65.0 ms | 1.7 ms | 2.6% | 1.00x | 1 | n/a |
| Volar (N) | **129.7 ms** | 127.7 ms | 2.1 ms | 1.6% | 1.97x | 1 | n/a |
| Vize ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

### IDE · smoke

Files: **1** · Bytes: **0**

#### Hover (script setup)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **7.3 ms** | 6.9 ms | 0.3 ms | 3.8% | 1.00x | 317 | n/a |
| Volar (JS) | **184.8 ms** | 179.6 ms | 3.4 ms | 1.9% | 25.44x | 90 | n/a |
| Volar (N) ⚠ | (14.2 ms) | (4.0 ms) | – | – | not ranked | (90) | – |
| Verter ⚠ | (29.2 ms) | (0.7 ms) | – | – | not ranked | (89) | – |

#### Hover (template interpolation)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.8 ms** | 1.7 ms | 0.0 ms | 1.9% | 1.00x | 38 | n/a |
| Volar (N) | **5.3 ms** | 5.2 ms | 1.6 ms | 25.7% ⚠ | 2.94x | 43 | n/a |
| Volar (JS) | **36.2 ms** | 33.5 ms | 2.1 ms | 5.9% | 20.21x | 43 | n/a |
| Verter ⚠ | (1.2 ms) | (0.9 ms) | – | – | not ranked | (74) | – |

### IDE · Typing loop (composite)

Files: **1** · Bytes: **0**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **384.2 ms** | 384.2 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (JS) | **469.7 ms** | 469.7 ms | n/a | n/a | 1.22x | n/a | n/a |
| Volar (N) | **479.0 ms** | 479.0 ms | n/a | n/a | 1.25x | n/a | n/a |
| Verter | **593.6 ms** | 593.6 ms | n/a | n/a | 1.54x | n/a | n/a |



#### Ubuntu/Linux · ide ops

<!-- source: ide-scale-Linux.md -->

> 📄 **[Full details →](docs/results/ide-scale-Linux.md)** — methodology, per-row notes and raw runs (31 collapsed block(s) moved out of this page).

## IDE operation results

- **Generated:** 2026-08-16T09:14:33.058Z
- **Runner:** linux/x64 · Node v22.23.2
- **Runs / warmups:** 3 / 1

### IDE · scale

Files: **1** · Bytes: **0**

#### Time-to-usable @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **390.5 ms** | 388.3 ms | 14.9 ms | 3.8% | 1.00x | 21 | n/a |
| Volar (N) | **993.4 ms** | 976.5 ms | 17.0 ms | 1.7% | 2.54x | 21 | n/a |
| Volar (JS) | **1.57 s** | 1.55 s | 17.5 ms | 1.1% | 4.03x | 21 | n/a |
| Verter ⚠ | (317.4 ms) | (187.3 ms) | – | – | not ranked | (21) | – |

#### Completion @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.1 ms | 15.9% ⚠ | 1.00x | 7 | n/a |
| Verter | **136.6 ms** | 112.0 ms | 15.5 ms | 11.9% ⚠ | 273.87x | 7 | n/a |
| Volar (N) | **146.0 ms** | 127.0 ms | 11.2 ms | 8.0% | 292.74x | 276 | n/a |
| Volar (JS) | **180.4 ms** | 172.1 ms | 5.5 ms | 3.1% | 361.77x | 276 | n/a |

#### References @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **137.6 ms** | 136.6 ms | 3.2 ms | 2.3% | 1.00x | 22 | n/a |
| Volar (JS) | **254.3 ms** | 251.0 ms | 7.1 ms | 2.8% | 1.85x | 22 | n/a |
| Vize ⚠ | (7.3 ms) | (7.1 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (35.1 ms) | (0.6 ms) | – | – | not ranked | (0) | – |

#### Hover warm @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.6 ms** | 0.6 ms | 0.0 ms | 7.3% | 1.00x | 130 | n/a |
| Volar (N) | **1.4 ms** | 1.4 ms | 0.1 ms | 6.9% | 2.35x | 131 | n/a |
| Volar (JS) | **1.7 ms** | 1.6 ms | 0.4 ms | 19.9% ⚠ | 2.76x | 131 | n/a |
| Vize ⚠ | (2.2 ms) | (2.1 ms) | – | – | not ranked | (358) | – |

#### Time-to-usable @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **287.7 ms** | 265.9 ms | 24.0 ms | 8.3% | 1.00x | 101 | n/a |
| Vize | **403.9 ms** | 403.2 ms | 5.9 ms | 1.4% | 1.40x | 101 | n/a |
| Volar (N) | **1.15 s** | 1.12 s | 16.0 ms | 1.4% | 4.00x | 101 | n/a |
| Volar (JS) | **1.75 s** | 1.74 s | 16.1 ms | 0.9% | 6.10x | 101 | n/a |

#### Completion @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.2 ms | 36.7% ⚠ | 1.00x | 7 | n/a |
| Verter | **117.0 ms** | 116.8 ms | 14.1 ms | 11.3% ⚠ | 243.26x | 7 | n/a |
| Volar (N) | **135.7 ms** | 130.0 ms | 8.2 ms | 5.9% | 282.19x | 356 | n/a |
| Volar (JS) | **182.2 ms** | 162.3 ms | 13.3 ms | 7.5% | 378.92x | 356 | n/a |

#### References @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **565.3 ms** | 563.8 ms | 7.3 ms | 1.3% | 1.00x | 102 | n/a |
| Volar (JS) | **948.4 ms** | 927.3 ms | 31.5 ms | 3.3% | 1.68x | 102 | n/a |
| Vize ⚠ | (7.1 ms) | (6.9 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (32.9 ms) | (27.4 ms) | – | – | not ranked | (0) | – |

#### Hover warm @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.7 ms** | 0.6 ms | 0.2 ms | 21.3% ⚠ | 1.00x | 130 | n/a |
| Volar (N) | **1.6 ms** | 1.5 ms | 0.1 ms | 5.1% | 2.24x | 131 | n/a |
| Vize | **2.2 ms** | 2.1 ms | 1.4 ms | 48.6% ⚠ | 3.09x | 358 | n/a |
| Volar (JS) ⚠ | (1.9 ms) | (1.6 ms) | – | – | not ranked | (131) | – |

#### Time-to-usable @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **259.4 ms** | 209.5 ms | 122.4 ms | 40.3% ⚠ | 1.00x | 501 | n/a |
| Vize | **393.0 ms** | 388.4 ms | 9.5 ms | 2.4% | 1.51x | 501 | n/a |
| Volar (N) | **1.79 s** | 1.76 s | 21.8 ms | 1.2% | 6.91x | 501 | n/a |
| Volar (JS) | **2.65 s** | 2.65 s | 18.7 ms | 0.7% | 10.21x | 501 | n/a |

#### Completion @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.1 ms | 17.2% ⚠ | 1.00x | 7 | n/a |
| Verter | **146.4 ms** | 140.4 ms | 46.7 ms | 27.4% ⚠ | 297.56x | 7 | n/a |
| Volar (N) | **193.2 ms** | 192.2 ms | 3.2 ms | 1.6% | 392.63x | 756 | n/a |
| Volar (JS) | **242.4 ms** | 199.7 ms | 25.1 ms | 11.0% ⚠ | 492.74x | 756 | n/a |

#### References @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **9.27 s** | 9.13 s | 104.1 ms | 1.1% | 1.00x | 502 | n/a |
| Volar (JS) | **13.71 s** | 13.07 s | 698.0 ms | 5.1% | 1.48x | 502 | n/a |
| Vize ⚠ | (7.3 ms) | (6.7 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (29.8 ms) | (26.6 ms) | – | – | not ranked | (0) | – |

#### Hover warm @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.3 ms** | 0.7 ms | 0.3 ms | 28.4% ⚠ | 1.00x | 130 | n/a |
| Volar (JS) | **1.4 ms** | 1.3 ms | 0.7 ms | 39.5% ⚠ | 1.05x | 131 | n/a |
| Vize | **2.1 ms** | 1.9 ms | 0.5 ms | 21.9% ⚠ | 1.61x | 358 | n/a |
| Volar (N) | **3.4 ms** | 3.1 ms | 0.2 ms | 5.1% | 2.65x | 131 | n/a |

#### Scale × time-to-usable 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.71 | – |
| Volar (N) | – | – | – | – | – | 1.77 | – |
| Vize | – | – | – | – | – | 0.95 | – |
| Verter | – | – | – | – | – | 1.39 | – |

#### Scale × completion 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.11 | – |
| Volar (N) | – | – | – | – | – | 1.35 | – |
| Vize | – | – | – | – | – | 0.99 | – |
| Verter | – | – | – | – | – | 1.04 | – |

#### Scale × references 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 52.07 | – |
| Volar (N) | – | – | – | – | – | 67.4 | – |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter ⚠ | – | – | – | – | not ranked | – | – |

#### Scale × hover warm 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.1 | – |
| Volar (N) | – | – | – | – | – | 2.4 | – |
| Vize | – | – | – | – | – | 1.31 | – |
| Verter | – | – | – | – | – | 2.19 | – |

### IDE · Typing loop (composite)

Files: **1** · Bytes: **0**

> ⏭ **All 4 cells in this group were skipped — no measurements.** ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not… Per-row wording: [full report](docs/results/ide-scale-Linux.md).



<!-- IDE_RESULTS_END -->

## Real-world project results

Toolchain surfaces run against pinned checkouts of popular open-source Vue projects instead of generated fixtures. Published by the **Benchmark (real-world)** workflow, which runs **one job per project** so every tool measured against a given project shares one machine.

**Read these tables within a corpus, never across one.** The corpora differ in size and in kind, and the difference is larger than it looks: of the "big Vue UI libraries", Naive UI, Vuetify and Ant Design Vue contain essentially **no library SFCs at all** — their components are `.tsx`/render functions, and their `.vue` files are documentation demos. Those are real, non-trivial Vue and worth measuring; they are just not the same thing as PrimeVue's 279 published component SFCs or Hoppscotch's application source. Every table states which kind it holds.

The generated `fixtures/N` corpus remains the primary ranking corpus — it is content-unique by construction and carries planted bugs, which is what makes the work gates possible. Real-world corpora exist to catch what a designed corpus cannot: constructs nobody thought to generate.

<!-- REAL_WORLD_RESULTS_START -->

> Auto-updated 2026-08-16 from the **Benchmark (real-world)** workflow — one job per project, every surface and every tool inside it.
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
| Vize native batch (max threads) | **55.7 ms** | 55.1 ms | 0.6 ms | 1.2% | 1.00x | 1,783,439 | 12.5k files/s |
| Verter compileMany (session cache) | **61.9 ms** | 46.8 ms | 8.9 ms | 14.4% ⚠ | 1.11x | 1,617,120 | 11.2k files/s |
| Vize native loop (1T) | **153.4 ms** | 153.0 ms | 0.5 ms | 0.3% | 2.75x | 1,783,439 | 4.5k files/s |
| @vue/compiler-sfc 3.5 (1T) | **383.0 ms** | 365.0 ms | 30.7 ms | 8.0% | 6.88x | 1,951,784 | 1.8k files/s |
| @vue/compiler-sfc 3.6 (1T) | **395.6 ms** | 378.6 ms | 37.7 ms | 9.5% | 7.10x | 1,951,784 | 1.8k files/s |
| Verter compileMany (stateless) | **855.3 ms** | 815.4 ms | 41.9 ms | 4.9% | 15.36x | 1,617,120 | 813 files/s |

## Format

Files: **695** · Bytes: **920,155**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **241.3 ms** | 235.9 ms | 11.3 ms | 4.7% | 1.00x | n/a | 2.9k files/s |
| Oxfmt | **4.38 s** | 4.28 s | 46.0 ms | 1.1% | 18.16x | n/a | 159 files/s |
| Prettier | **6.47 s** | 6.22 s | 200.5 ms | 3.1% | 26.81x | n/a | 107 files/s |
| Biome format ⚠ | (165.1 ms) | (163.2 ms) | – | – | not ranked | – | – |

## Lint

Files: **695** · Bytes: **920,155**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **95.9 ms** | 90.6 ms | 2.4 ms | 2.5% | 1.00x | n/a | 7.3k files/s |
| Vize lint (1T) | **147.1 ms** | 143.5 ms | 6.9 ms | 4.7% | 1.53x | n/a | 4.7k files/s |
| Verter host lint | **523.7 ms** | 513.9 ms | 5.2 ms | 1.0% | 5.46x | n/a | 1.3k files/s |
| eslint-plugin-vue (1T) | **3.75 s** | 3.63 s | 334.8 ms | 8.9% | 39.07x | n/a | 186 files/s |
| eslint-plugin-vue (4 workers) | **5.23 s** | 5.13 s | 132.5 ms | 2.5% | 54.61x | n/a | 133 files/s |
| eslint-plugin-vue (CLI) | **5.59 s** | 5.45 s | 114.6 ms | 2.1% | 58.30x | n/a | 124 files/s |
| Biome lint (1T) ⚠ | (817.3 ms) | (810.4 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (338.7 ms) | (337.0 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (92.6 ms) | (91.0 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (74.3 ms) | (73.5 ms) | – | – | not ranked | – | – |

## Bundle (production build) — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

### Vite 8 (Rolldown) — Vue integrations compared

> ❌ **All 4 cells in this group failed — no measurements.** ([full report](docs/results/real-world-Linux-ant-design-vue.md))
> - **Vite 8 (Rolldown) × @vitejs/plugin-vue ❌**: Build failed with 6 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/config-provider/demo/direction.vue?vue&type=style&index=0&sco…
> - **Vite 8 (Rolldown) × unplugin-vue ❌**: Build failed with 6 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/modal/demo/fullscreen.vue?vue&type=style&index=0&lang.less
> - **Vite 8 (Rolldown) × @vizejs/vite-plugin ❌**: Build failed with 6 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/modal/demo/fullscreen.vue?vue=&type=style&index=0&lang=less.l…
> - **Vite 8 (Rolldown) × @verter/unplugin ❌**: Build failed with 6 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/grid/demo/flex.vue?vue&type=style&index=0&lang.less

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 98 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-ant-design-vue.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × @verter/unplugin | **1.52 s** | 1.48 s | 47.0 ms | 3.1% | 1.00x | 4,419,919 | 458 files/s |
| Rspack × unplugin-vue | **1.97 s** | 1.96 s | 12.4 ms | 0.6% | 1.30x | 4,691,498 | 353 files/s |
| Rspack × vue-loader | **2.36 s** | 2.27 s | 124.5 ms | 5.3% | 1.55x | 6,303,083 | 295 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × @verter/unplugin | **2.46 s** | 2.34 s | 177.3 ms | 7.2% | 1.00x | 5,512,482 | 282 files/s |
| webpack 5 × vue-loader | **2.66 s** | 2.59 s | 107.0 ms | 4.0% | 1.08x | 9,745,465 | 261 files/s |
| webpack 5 × unplugin-vue | **3.43 s** | 3.22 s | 291.8 ms | 8.5% | 1.39x | 7,283,567 | 203 files/s |
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
| Vite 8 (Rolldown) × @verter/unplugin | **91.4 ms** | 88.0 ms | 4.8 ms | 5.3% | 1.00x | n/a | 7.6k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **92.9 ms** | 86.5 ms | 9.0 ms | 9.7% | 1.02x | n/a | 7.5k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **103.8 ms** | 92.3 ms | 16.2 ms | 15.6% ⚠ | 1.14x | n/a | 6.7k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **160.1 ms** | 158.9 ms | 1.6 ms | 1.0% | 1.75x | n/a | 4.3k files/s |

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
| Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠ | (5.3 ms) | (5.0 ms) | – | – | not ranked | (8,890) | – |
| Vite 8 (Rolldown) × unplugin-vue ⚠ | (5.6 ms) | (5.4 ms) | – | – | not ranked | (8,892) | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
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
| vue-component-meta ⚠ | (6.37 s) | (5.76 s) | – | – | not ranked | (695) | – |
| @verter/component-meta ⚠ | (2.67 s) | (2.61 s) | – | – | not ranked | (695) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — ant-design-vue:demos

Files: **1** · Bytes: **528**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (8.74 s) | (8.69 s) | – | – | not ranked | (0) | – |
| Volar (N) ⚠ | (6.13 s) | (6.09 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (1.33 s) | (1.27 s) | – | – | not ranked | (0) | – |
| Vize ⚠ | (1.35 s) | (1.35 s) | – | – | not ranked | (1) | – |

### hover on `top`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (2.4 ms) | (2.2 ms) | – | – | not ranked | (48) | – |
| Volar (N) ⚠ | (45.5 ms) | (27.7 ms) | – | – | not ranked | (48) | – |
| Verter ⚠ | (0.9 ms) | (0.9 ms) | – | – | not ranked | (48) | – |
| Vize ⚠ | (2.1 ms) | (2.1 ms) | – | – | not ranked | (276) | – |



# element-plus

<!-- source: real-world-Linux-element-plus.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-element-plus.md)** — methodology, per-row notes and raw runs (41 collapsed block(s) moved out of this page).



## Methodology notes

- ⚠ HARNESS GAP — 1 surface run(s) threw and produced NO rows. These are failures of this harness on this machine, not results about any tool, and nothing should be inferred about the tools that would have been measured: project-typecheck on element-plus:components (undefined)

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
| @vue/compiler-sfc 3.5 (1T) | **363.9 ms** | 340.7 ms | 24.0 ms | 6.6% | 1.00x | 1,184,607 | 445 files/s |
| @vue/compiler-sfc 3.6 (1T) | **547.8 ms** | 514.9 ms | 37.0 ms | 6.8% | 1.51x | 1,184,607 | 296 files/s |
| Vize native loop (1T) ⚠ | (124.5 ms) | (121.7 ms) | – | – | not ranked | (1,121,855) | – |
| Vize native batch (max threads) ⚠ | (42.0 ms) | (40.8 ms) | – | – | not ranked | (1,121,855) | – |
| Verter compileMany (stateless) ⚠ | (1.93 s) | (1.37 s) | – | – | not ranked | (970,791) | – |
| Verter compileMany (session cache) ⚠ | (68.6 ms) | (61.7 ms) | – | – | not ranked | (970,791) | – |

## Format

Files: **162** · Bytes: **765,295**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **131.4 ms** | 130.6 ms | 7.9 ms | 6.0% | 1.00x | n/a | 1.2k files/s |
| Oxfmt | **3.16 s** | 3.10 s | 45.4 ms | 1.4% | 24.08x | n/a | 51 files/s |
| Prettier | **5.05 s** | 4.93 s | 57.4 ms | 1.1% | 38.42x | n/a | 32 files/s |
| Biome format ⚠ | (162.5 ms) | (160.3 ms) | – | – | not ranked | – | – |

## Lint

Files: **162** · Bytes: **765,295**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | **293.4 ms** | 287.8 ms | 3.5 ms | 1.2% | 1.00x | n/a | 552 files/s |
| eslint-plugin-vue (1T) | **2.40 s** | 2.34 s | 424.8 ms | 17.7% ⚠ | 8.17x | n/a | 68 files/s |
| eslint-plugin-vue (CLI) | **4.48 s** | 4.46 s | 49.9 ms | 1.1% | 15.28x | n/a | 36 files/s |
| eslint-plugin-vue (4 workers) | **4.79 s** | 4.75 s | 46.3 ms | 1.0% | 16.33x | n/a | 34 files/s |
| Vize lint (1T) ⚠ | (112.0 ms) | (108.9 ms) | – | – | not ranked | – | – |
| Vize lint (max threads) ⚠ | (81.0 ms) | (79.8 ms) | – | – | not ranked | – | – |
| Biome lint (1T) ⚠ | (616.7 ms) | (609.7 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (277.8 ms) | (276.3 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (92.1 ms) | (87.5 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (73.3 ms) | (72.3 ms) | – | – | not ranked | – | – |

## Bundle (production build) — element-plus:components

Files: **149** · Bytes: **765,295**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **497.7 ms** | 477.3 ms | 28.8 ms | 5.8% | 1.00x | 756,590 | 299 files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **566.6 ms** | 463.0 ms | 146.5 ms | 25.9% ⚠ | 1.14x | 756,853 | 263 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **857.8 ms** | 844.5 ms | 18.8 ms | 2.2% | 1.72x | 759,426 | 174 files/s |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rolldown (no Vite) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × unplugin-vue | **795.4 ms** | 737.2 ms | 82.3 ms | 10.3% ⚠ | 1.00x | 749,946 | 187 files/s |
| Rolldown (no Vite) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × vue-loader | **344.9 ms** | 335.9 ms | 12.7 ms | 3.7% | 1.00x | 2,117,560 | 432 files/s |
| Rspack × @vizejs/rspack-plugin | **412.6 ms** | 407.6 ms | 6.9 ms | 1.7% | 1.20x | 1,732,650 | 361 files/s |
| Rspack × unplugin-vue | **830.2 ms** | 783.7 ms | 65.8 ms | 7.9% | 2.41x | 1,677,280 | 179 files/s |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader | **623.5 ms** | 600.5 ms | 32.5 ms | 5.2% | 1.00x | 2,947,430 | 239 files/s |
| webpack 5 × unplugin-vue | **1.12 s** | 1.08 s | 55.5 ms | 5.0% | 1.79x | 2,300,148 | 134 files/s |
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
| Vite 8 (Rolldown) × @verter/unplugin | **22.6 ms** | 21.7 ms | 1.2 ms | 5.3% | 1.00x | n/a | 6.6k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **26.0 ms** | 24.5 ms | 2.1 ms | 8.1% | 1.15x | n/a | 5.7k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **26.2 ms** | 23.7 ms | 3.5 ms | 13.3% ⚠ | 1.16x | n/a | 5.7k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **51.1 ms** | 46.7 ms | 6.1 ms | 12.0% ⚠ | 2.26x | n/a | 2.9k files/s |

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
| Vite 8 (Rolldown) × unplugin-vue | **7.8 ms** | 7.1 ms | 0.6 ms | 8.0% | 1.00x | 30,250 | 19.2k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **7.8 ms** | 7.1 ms | 0.5 ms | 6.2% | 1.01x | 30,248 | 19.0k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-element-plus.md).

## Project test suite — element-plus:components

Files: **162** · Bytes: **765,295**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests passed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| element-plus — project's own toolchain (baseline) | **142.00 s** | 142.00 s | n/a | n/a | 1.00x | 2,533 | 1 files/s |
| element-plus — unplugin-vue | **142.83 s** | 142.83 s | n/a | n/a | 1.01x | 2,533 | 1 files/s |
| element-plus — @vizejs/vite-plugin ⚠ | (206.02 s) | (206.02 s) | – | – | not ranked | (2,047) | – |
| element-plus — @verter/unplugin ⚠ | (97.51 s) | (97.51 s) | – | – | not ranked | (527) | – |

## Project build (own config) — element-plus:components

Files: **162** · Bytes: **765,295**

## Project component-meta (own tsconfig) — element-plus:components

Files: **162** · Bytes: **765,295**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | **6.79 s** | 5.74 s | 681.6 ms | 10.0% | 1.00x | 162 | 24 files/s |
| @verter/component-meta ⚠ | (2.75 s) | (2.67 s) | – | – | not ranked | (160) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — element-plus:components

Files: **1** · Bytes: **4,568**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.32 s** | 1.28 s | 64.5 ms | 4.9% | 1.00x | 1 | 1 files/s |
| Volar (JS) ⚠ | (5.18 s) | (5.14 s) | – | – | not ranked | (0) | – |
| Volar (N) ⚠ | (3.66 s) | (3.64 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (463.6 ms) | (461.9 ms) | – | – | not ranked | (0) | – |

### hover on `COMPONENT_NAME`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.1 ms** | 1.0 ms | 0.2 ms | 21.0% ⚠ | 1.00x | 49 | 907 files/s |
| Volar (N) | **20.8 ms** | 17.5 ms | 1.5 ms | 7.1% | 18.91x | 49 | 48 files/s |
| Vize | **47.6 ms** | 44.6 ms | 1.8 ms | 3.8% | 43.27x | 277 | 21 files/s |
| Volar (JS) ⚠ | (2.4 ms) | (2.3 ms) | – | – | not ranked | (49) | – |



# hoppscotch

<!-- source: real-world-Linux-hoppscotch.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-hoppscotch.md)** — methodology, per-row notes and raw runs (46 collapsed block(s) moved out of this page).



## SFC compile (unique contents)

Files: **293** · Bytes: **1,978,501**

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **82.8 ms** | 81.7 ms | 0.9 ms | 1.0% | 1.00x | 2,758,160 | 3.5k files/s |
| Vize native loop (1T) | **227.9 ms** | 225.2 ms | 2.4 ms | 1.1% | 2.75x | 2,758,160 | 1.3k files/s |
| @vue/compiler-sfc 3.5 (1T) | **548.8 ms** | 530.4 ms | 12.8 ms | 2.3% | 6.62x | 3,009,515 | 534 files/s |
| @vue/compiler-sfc 3.6 (1T) | **553.6 ms** | 512.9 ms | 37.0 ms | 6.7% | 6.68x | 3,009,515 | 529 files/s |
| fervid compileSync (1T) ⚠ | (236.3 ms) | (233.4 ms) | – | – | not ranked | (3,662,436) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (111.6 ms) | (108.9 ms) | – | – | not ranked | (3,662,436) | – |
| Verter compileMany (stateless) ⚠ | (318.8 ms) | (307.7 ms) | – | – | not ranked | (2,406,414) | – |
| Verter compileMany (session cache) ⚠ | (100.9 ms) | (86.9 ms) | – | – | not ranked | (2,406,414) | – |

## Format

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **203.6 ms** | 193.6 ms | 13.3 ms | 6.5% | 1.00x | n/a | 1.4k files/s |
| Oxfmt | **5.84 s** | 5.74 s | 98.7 ms | 1.7% | 28.70x | n/a | 50 files/s |
| Prettier | **9.09 s** | 9.08 s | 25.6 ms | 0.3% | 44.64x | n/a | 32 files/s |
| Biome format ⚠ | (268.2 ms) | (267.1 ms) | – | – | not ranked | – | – |

## Lint

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **100.1 ms** | 99.9 ms | 0.8 ms | 0.8% | 1.00x | n/a | 2.9k files/s |
| Vize lint (1T) | **167.1 ms** | 164.2 ms | 3.3 ms | 2.0% | 1.67x | n/a | 1.8k files/s |
| Verter host lint | **747.0 ms** | 743.7 ms | 11.5 ms | 1.5% | 7.46x | n/a | 392 files/s |
| eslint-plugin-vue (1T) | **5.68 s** | 5.53 s | 318.5 ms | 5.6% | 56.79x | n/a | 52 files/s |
| eslint-plugin-vue (CLI) | **7.48 s** | 7.45 s | 144.2 ms | 1.9% | 74.77x | n/a | 39 files/s |
| eslint-plugin-vue (4 workers) | **7.57 s** | 7.41 s | 142.0 ms | 1.9% | 75.70x | n/a | 39 files/s |
| Biome lint (1T) ⚠ | (1.11 s) | (1.10 s) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (489.2 ms) | (478.2 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (108.7 ms) | (104.8 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (83.0 ms) | (77.3 ms) | – | – | not ranked | – | – |

## Bundle (production build) — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **1.29 s** | 1.24 s | 65.5 ms | 5.1% | 1.00x | 2,219,416 | 228 files/s |
| Vite 8 (Rolldown) × unplugin-vue | **1.37 s** | 1.34 s | 37.3 ms | 2.7% | 1.06x | 2,218,853 | 214 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **3.07 s** | 3.05 s | 29.6 ms | 1.0% | 2.38x | 2,092,607 | 96 files/s |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 41 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-hoppscotch.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × vue-loader | **2.08 s** | 1.83 s | 350.3 ms | 16.9% ⚠ | 1.00x | 5,819,454 | 141 files/s |
| Rspack × unplugin-vue | **2.43 s** | 2.42 s | 14.0 ms | 0.6% | 1.17x | 5,038,187 | 120 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader | **2.71 s** | 2.59 s | 168.3 ms | 6.2% | 1.00x | 7,534,046 | 108 files/s |
| webpack 5 × unplugin-vue | **3.25 s** | 3.20 s | 65.1 ms | 2.0% | 1.20x | 6,482,038 | 90 files/s |
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
| Vite 8 (Rolldown) × @verter/unplugin | **37.9 ms** | 36.9 ms | 1.5 ms | 4.0% | 1.00x | n/a | 7.7k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **42.0 ms** | 37.7 ms | 6.0 ms | 14.4% ⚠ | 1.11x | n/a | 7.0k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **45.3 ms** | 40.8 ms | 6.4 ms | 14.0% ⚠ | 1.20x | n/a | 6.5k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **84.0 ms** | 81.9 ms | 3.0 ms | 3.5% | 2.22x | n/a | 3.5k files/s |

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
| Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠ | (8.9 ms) | (7.3 ms) | – | – | not ranked | (31,959) | – |
| Vite 8 (Rolldown) × unplugin-vue ⚠ | (12.0 ms) | (9.2 ms) | – | – | not ranked | (31,961) | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (2.7 ms) | (2.5 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-hoppscotch.md).

## Project test suite — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests passed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @hoppscotch/common — @verter/unplugin | **24.71 s** | 24.71 s | n/a | n/a | 1.00x | 414 | 12 files/s |
| @hoppscotch/common — project's own toolchain (baseline) | **24.89 s** | 24.89 s | n/a | n/a | 1.01x | 414 | 12 files/s |
| @hoppscotch/common — @vizejs/vite-plugin | **24.99 s** | 24.99 s | n/a | n/a | 1.01x | 414 | 12 files/s |
| @hoppscotch/common — unplugin-vue | **25.10 s** | 25.10 s | n/a | n/a | 1.02x | 414 | 12 files/s |

## Project build (own config) — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| hoppscotch-agent — @vizejs/vite-plugin | **1.68 s** | 1.63 s | 25.1 ms | 1.5% | 1.00x | 256,120 | 2 files/s |
| hoppscotch-agent — unplugin-vue | **1.70 s** | 1.66 s | 25.0 ms | 1.5% | 1.01x | 256,155 | 2 files/s |
| hoppscotch-agent — project's own toolchain (baseline) | **1.73 s** | 1.68 s | 24.0 ms | 1.4% | 1.03x | 256,155 | 2 files/s |
| hoppscotch-agent — @verter/unplugin | **1.82 s** | 1.73 s | 47.3 ms | 2.6% | 1.08x | 258,124 | 2 files/s |

## Project typecheck (own tsconfig) — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | **1.65 s** | 1.63 s | 27.0 ms | 1.6% | 1.00x | 705 | 34 files/s |
| Vize | **2.72 s** | 2.70 s | 22.8 ms | 0.8% | 1.65x | 92 | 21 files/s |
| vue-tsc (JS) | **6.55 s** | 6.54 s | 12.8 ms | 0.2% | 3.97x | 89 | 9 files/s |
| vue-tsc (N) ⚠ | (1.81 s) | (1.79 s) | – | – | not ranked | (1) | – |
| Golar typecheck ⏭ | skipped | – | – | – | – | – | – |

## Project component-meta (own tsconfig) — hoppscotch:common

Files: **293** · Bytes: **1,978,501**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | **6.68 s** | 5.83 s | 496.7 ms | 7.4% | 1.00x | 293 | 44 files/s |
| @verter/component-meta ⚠ | (3.13 s) | (3.06 s) | – | – | not ranked | (283) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — hoppscotch:common

Files: **1** · Bytes: **1,506**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **5.25 s** | 5.23 s | 47.6 ms | 0.9% | 1.00x | 1 | 0 files/s |
| Volar (JS) ⚠ | (8.42 s) | (8.38 s) | – | – | not ranked | (0) | – |
| Volar (N) ⚠ | (4.86 s) | (4.81 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (1.37 s) | (68.8 ms) | – | – | not ranked | (0) | – |

### hover on `errorInfo`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **2.9 ms** | 2.6 ms | 0.4 ms | 12.5% ⚠ | 1.00x | 168 | 342 files/s |
| Volar (N) | **13.4 ms** | 11.9 ms | 3.3 ms | 24.4% ⚠ | 4.62x | 152 | 75 files/s |
| Vize | **104.5 ms** | 103.7 ms | 0.6 ms | 0.6% | 36.03x | 396 | 10 files/s |
| Verter ⚠ | (1.6 ms) | (0.8 ms) | – | – | not ranked | (165) | – |



# naive-ui

<!-- source: real-world-Linux-naive-ui.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-naive-ui.md)** — methodology, per-row notes and raw runs (45 collapsed block(s) moved out of this page).



## SFC compile (⚠ 2 duplicate bodies — content-hash caches may inflate throughput)

Files: **1,682** · Bytes: **1,751,750**

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter compileMany (session cache) | **121.1 ms** | 116.0 ms | 3.3 ms | 2.7% | 1.00x | 3,452,696 | 13.9k files/s |
| Vize native batch (max threads) | **121.9 ms** | 121.0 ms | 5.5 ms | 4.5% | 1.01x | 3,747,593 | 13.8k files/s |
| Vize native loop (1T) | **340.8 ms** | 339.4 ms | 5.1 ms | 1.5% | 2.81x | 3,747,593 | 4.9k files/s |
| @vue/compiler-sfc 3.5 (1T) | **639.2 ms** | 632.4 ms | 23.6 ms | 3.7% | 5.28x | 4,153,090 | 2.6k files/s |
| @vue/compiler-sfc 3.6 (1T) | **692.8 ms** | 682.3 ms | 25.2 ms | 3.6% | 5.72x | 4,153,090 | 2.4k files/s |
| Verter compileMany (stateless) | **3.87 s** | 3.84 s | 50.8 ms | 1.3% | 31.96x | 3,452,696 | 435 files/s |
| fervid compileSync (1T) ⚠ | (264.0 ms) | (263.7 ms) | – | – | not ranked | (5,367,958) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (134.5 ms) | (132.0 ms) | – | – | not ranked | (5,367,958) | – |

## Format

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **492.1 ms** | 473.3 ms | 33.9 ms | 6.9% | 1.00x | n/a | 3.4k files/s |
| Oxfmt | **6.43 s** | 6.38 s | 50.1 ms | 0.8% | 13.08x | n/a | 261 files/s |
| Prettier | **11.36 s** | 11.30 s | 36.5 ms | 0.3% | 23.09x | n/a | 148 files/s |
| Biome format ⚠ | (339.4 ms) | (338.6 ms) | – | – | not ranked | – | – |

## Lint

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **133.2 ms** | 131.7 ms | 0.8 ms | 0.6% | 1.00x | n/a | 12.6k files/s |
| Vize lint (1T) | **234.2 ms** | 230.8 ms | 12.4 ms | 5.3% | 1.76x | n/a | 7.2k files/s |
| Verter host lint | **1.12 s** | 1.10 s | 11.0 ms | 1.0% | 8.40x | n/a | 1.5k files/s |
| eslint-plugin-vue (1T) | **6.89 s** | 6.78 s | 390.1 ms | 5.7% | 51.72x | n/a | 244 files/s |
| eslint-plugin-vue (4 workers) | **8.13 s** | 8.08 s | 45.5 ms | 0.6% | 61.01x | n/a | 207 files/s |
| eslint-plugin-vue (CLI) | **9.04 s** | 8.98 s | 81.4 ms | 0.9% | 67.88x | n/a | 186 files/s |
| Biome lint (1T) ⚠ | (1.77 s) | (1.76 s) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (692.6 ms) | (688.9 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (126.8 ms) | (122.4 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (88.0 ms) | (85.5 ms) | – | – | not ranked | – | – |

## Bundle (production build) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **2.81 s** | 2.66 s | 210.4 ms | 7.5% | 1.00x | 3,006,141 | 599 files/s |
| Vite 8 (Rolldown) × unplugin-vue | **2.99 s** | 2.95 s | 55.9 ms | 1.9% | 1.07x | 2,999,866 | 562 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **3.57 s** | 3.35 s | 305.8 ms | 8.6% | 1.27x | 2,890,036 | 472 files/s |
| Vite 8 (Rolldown) × @verter/unplugin | **4.19 s** | 3.95 s | 340.4 ms | 8.1% | 1.49x | 3,310,547 | 401 files/s |

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 120 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-naive-ui.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × unplugin-vue | **4.20 s** | 3.96 s | 329.0 ms | 7.8% | 1.00x | 9,965,394 | 401 files/s |
| Rspack × vue-loader | **4.96 s** | 4.76 s | 281.9 ms | 5.7% | 1.18x | 13,727,292 | 339 files/s |
| Rspack × @verter/unplugin | **257.66 s** | 256.04 s | 2.30 s | 0.9% | 61.39x | 9,284,079 | 7 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × @verter/unplugin | **5.57 s** | 5.57 s | 7.5 ms | 0.1% | 1.00x | 11,803,088 | 302 files/s |
| webpack 5 × vue-loader | **7.31 s** | 6.67 s | 906.3 ms | 12.4% ⚠ | 1.31x | 21,574,013 | 230 files/s |
| webpack 5 × unplugin-vue | **8.98 s** | 8.94 s | 56.2 ms | 0.6% | 1.61x | 15,359,135 | 187 files/s |
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
| Vite 8 (Rolldown) × @verter/unplugin | **212.9 ms** | 184.3 ms | 40.4 ms | 19.0% ⚠ | 1.00x | n/a | 7.9k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **222.8 ms** | 210.6 ms | 17.2 ms | 7.7% | 1.05x | n/a | 7.5k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **228.0 ms** | 210.6 ms | 24.7 ms | 10.8% ⚠ | 1.07x | n/a | 7.4k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **382.6 ms** | 380.1 ms | 3.5 ms | 0.9% | 1.80x | n/a | 4.4k files/s |

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
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **5.3 ms** | 5.3 ms | 1.2 ms | 23.0% ⚠ | 1.00x | 14,548 | 319.0k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **5.6 ms** | 5.3 ms | 1.1 ms | 19.6% ⚠ | 1.05x | 14,550 | 302.6k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-naive-ui.md).

## Project test suite — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests passed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| naive-ui — project's own toolchain (baseline) ⚠ | (281.04 s) | (281.04 s) | – | – | not ranked | (1,007) | – |
| naive-ui — unplugin-vue ⚠ | (281.57 s) | (281.57 s) | – | – | not ranked | (1,007) | – |
| naive-ui — @vizejs/vite-plugin ⚠ | (282.95 s) | (282.95 s) | – | – | not ranked | (1,007) | – |
| naive-ui — @verter/unplugin ⚠ | (282.00 s) | (282.00 s) | – | – | not ranked | (1,007) | – |

## Project build (own config) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

## Project typecheck (own tsconfig) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (JS) ⚠ | (51.25 s) | (51.02 s) | – | – | not ranked | (63) | – |
| vue-tsc (N) ⚠ | (43.30 s) | (11.86 s) | – | – | not ranked | (63) | – |
| verter-tsc ⚠ | (10.68 s) | (10.64 s) | – | – | not ranked | (5,546) | – |
| Vize ⚠ | (18.41 s) | (18.40 s) | – | – | not ranked | (50) | – |
| Golar typecheck ⏭ | skipped | – | – | – | – | – | – |

## Project component-meta (own tsconfig) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta ⚠ | (9.68 s) | (9.34 s) | – | – | not ranked | (1,682) | – |
| @verter/component-meta ⚠ | (9.40 s) | (9.30 s) | – | – | not ranked | (1,682) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — naive-ui:demos

Files: **1** · Bytes: **1,272**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (11.29 s) | (11.21 s) | – | – | not ranked | (0) | – |
| Volar (N) ⚠ | (8.75 s) | (8.67 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (1.54 s) | (1.48 s) | – | – | not ranked | (2) | – |
| Vize ⚠ | (1.44 s) | (1.40 s) | – | – | not ranked | (2) | – |

### hover on `containerRef`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (2.9 ms) | (2.6 ms) | – | – | not ranked | (91) | – |
| Volar (N) ⚠ | (43.2 ms) | (31.8 ms) | – | – | not ranked | (91) | – |
| Verter ⚠ | (1.2 ms) | (1.1 ms) | – | – | not ranked | (91) | – |
| Vize ⚠ | (2.1 ms) | (2.0 ms) | – | – | not ranked | (91) | – |



# nuxt-ui

<!-- source: real-world-Linux-nuxt-ui.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-nuxt-ui.md)** — methodology, per-row notes and raw runs (45 collapsed block(s) moved out of this page).



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
| Vize native loop (1T) ⚠ | (207.8 ms) | (205.4 ms) | – | – | not ranked | (1,579,168) | – |
| Vize native batch (max threads) ⚠ | (70.6 ms) | (70.0 ms) | – | – | not ranked | (1,579,168) | – |
| Verter compileMany (stateless) ⚠ | (3.90 s) | (2.61 s) | – | – | not ranked | (1,298,926) | – |
| Verter compileMany (session cache) ⚠ | (1.72 s) | (1.44 s) | – | – | not ranked | (1,298,926) | – |

## Format

Files: **187** · Bytes: **1,014,900**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **139.5 ms** | 137.8 ms | 1.3 ms | 0.9% | 1.00x | n/a | 1.3k files/s |
| Prettier ⚠ | (5.94 s) | (5.84 s) | – | – | not ranked | – | – |
| Oxfmt ⚠ | (3.91 s) | (3.81 s) | – | – | not ranked | – | – |
| Biome format ⚠ | (108.8 ms) | (108.3 ms) | – | – | not ranked | – | – |

## Lint

Files: **187** · Bytes: **1,014,900**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **83.0 ms** | 82.0 ms | 1.0 ms | 1.2% | 1.00x | n/a | 2.3k files/s |
| Vize lint (1T) | **125.3 ms** | 122.2 ms | 4.6 ms | 3.7% | 1.51x | n/a | 1.5k files/s |
| Verter host lint | **381.6 ms** | 374.6 ms | 5.4 ms | 1.4% | 4.60x | n/a | 490 files/s |
| eslint-plugin-vue (1T) | **3.99 s** | 3.73 s | 570.3 ms | 14.3% ⚠ | 48.12x | n/a | 47 files/s |
| eslint-plugin-vue (CLI) | **5.95 s** | 5.72 s | 162.2 ms | 2.7% | 71.68x | n/a | 31 files/s |
| eslint-plugin-vue (4 workers) | **6.07 s** | 5.98 s | 70.3 ms | 1.2% | 73.22x | n/a | 31 files/s |
| Biome lint (1T) ⚠ | (338.3 ms) | (337.1 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (169.9 ms) | (167.8 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (94.7 ms) | (93.4 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (72.2 ms) | (69.4 ms) | – | – | not ranked | – | – |

## Bundle (production build) — nuxt-ui:runtime

Files: **76** · Bytes: **1,014,900**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **201.8 ms** | 199.3 ms | 3.5 ms | 1.7% | 1.00x | 158,125 | 377 files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **205.4 ms** | 203.3 ms | 3.0 ms | 1.5% | 1.02x | 158,148 | 370 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ❌ | error | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 1 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-nuxt-ui.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × vue-loader | **140.8 ms** | 139.9 ms | 1.3 ms | 0.9% | 1.00x | 634,903 | 540 files/s |
| Rspack × unplugin-vue | **316.0 ms** | 311.8 ms | 6.0 ms | 1.9% | 2.24x | 459,780 | 240 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader | **247.8 ms** | 227.1 ms | 29.4 ms | 11.8% ⚠ | 1.00x | 980,464 | 307 files/s |
| webpack 5 × unplugin-vue | **448.5 ms** | 441.0 ms | 10.6 ms | 2.4% | 1.81x | 726,632 | 169 files/s |
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
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **18.8 ms** | 16.4 ms | 3.4 ms | 18.3% ⚠ | 1.00x | n/a | 4.0k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **19.6 ms** | 19.3 ms | 0.3 ms | 1.7% | 1.04x | n/a | 3.9k files/s |
| Vite 8 (Rolldown) × @verter/unplugin | **25.0 ms** | 14.9 ms | 14.3 ms | 57.0% ⚠ | 1.33x | n/a | 3.0k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **37.6 ms** | 32.6 ms | 7.0 ms | 18.7% ⚠ | 2.00x | n/a | 2.0k files/s |

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
| Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠ | (9.3 ms) | (8.7 ms) | – | – | not ranked | (27,736) | – |
| Vite 8 (Rolldown) × unplugin-vue ⚠ | (8.1 ms) | (7.7 ms) | – | – | not ranked | (27,738) | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.8 ms) | (0.7 ms) | – | – | not ranked | (0) | – |

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
| vue-tsc (N) | **15.45 s** | 15.40 s | 65.8 ms | 0.4% | 1.00x | 2,386 | 47 files/s |
| Vize | **35.28 s** | 35.08 s | 280.5 ms | 0.8% | 2.28x | 2,334 | 20 files/s |
| vue-tsc (JS) | **48.55 s** | 48.53 s | 28.3 ms | 0.1% | 3.14x | 2,371 | 15 files/s |
| verter-tsc ⚠ | (7.28 s) | (7.08 s) | – | – | not ranked | (0) | – |
| Golar typecheck ⏭ | skipped | – | – | – | – | – | – |

## Project component-meta (own tsconfig) — nuxt-ui:runtime

Files: **187** · Bytes: **1,014,900**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | **7.26 s** | 6.29 s | 508.7 ms | 7.0% | 1.00x | 187 | 26 files/s |
| @verter/component-meta | **8.58 s** | 8.44 s | 105.2 ms | 1.2% | 1.18x | 187 | 22 files/s |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — nuxt-ui:runtime

Files: **1** · Bytes: **6,276**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **2.42 s** | 2.39 s | 35.2 ms | 1.5% | 1.00x | 14 | 0 files/s |
| Volar (JS) ⚠ | (7.42 s) | (7.40 s) | – | – | not ranked | (0) | – |
| Volar (N) ⚠ | (3.52 s) | (3.47 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (533.1 ms) | (475.1 ms) | – | – | not ranked | (0) | – |

### hover on `_props`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **18.5 ms** | 12.2 ms | 6.7 ms | 36.2% ⚠ | 1.00x | 217 | 54 files/s |
| Vize | **43.5 ms** | 42.3 ms | 2.3 ms | 5.3% | 2.35x | 369 | 23 files/s |
| Verter | **129.4 ms** | 118.0 ms | 49.3 ms | 38.1% ⚠ | 6.99x | 591 | 8 files/s |
| Volar (JS) ⚠ | (7.4 ms) | (4.4 ms) | – | – | not ranked | (813) | – |



# primevue

<!-- source: real-world-Linux-primevue.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-primevue.md)** — methodology, per-row notes and raw runs (45 collapsed block(s) moved out of this page).



## SFC compile (unique contents)

Files: **279** · Bytes: **1,721,906**

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **36.8 ms** | 34.8 ms | 2.1 ms | 5.7% | 1.00x | 2,080,839 | 7.6k files/s |
| Vize native loop (1T) | **88.0 ms** | 86.8 ms | 1.2 ms | 1.3% | 2.39x | 2,080,839 | 3.2k files/s |
| @vue/compiler-sfc 3.6 (1T) | **273.7 ms** | 265.3 ms | 5.4 ms | 2.0% | 7.45x | 2,122,162 | 1.0k files/s |
| @vue/compiler-sfc 3.5 (1T) | **274.8 ms** | 267.2 ms | 7.2 ms | 2.6% | 7.48x | 2,122,162 | 1.0k files/s |
| fervid compileSync (1T) ⚠ | (169.0 ms) | (168.3 ms) | – | – | not ranked | (2,206,275) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (84.9 ms) | (83.7 ms) | – | – | not ranked | (2,206,275) | – |
| Verter compileMany (stateless) ⚠ | (227.3 ms) | (217.9 ms) | – | – | not ranked | (1,908,249) | – |
| Verter compileMany (session cache) ⚠ | (37.0 ms) | (35.3 ms) | – | – | not ranked | (1,908,249) | – |

## Format

Files: **279** · Bytes: **1,721,906**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **158.3 ms** | 153.5 ms | 12.1 ms | 7.6% | 1.00x | n/a | 1.8k files/s |
| Oxfmt | **4.41 s** | 4.35 s | 29.5 ms | 0.7% | 27.88x | n/a | 63 files/s |
| Prettier | **6.10 s** | 6.06 s | 36.3 ms | 0.6% | 38.55x | n/a | 46 files/s |
| Biome format ⚠ | (275.5 ms) | (275.0 ms) | – | – | not ranked | – | – |

## Lint

Files: **279** · Bytes: **1,721,906**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | **358.8 ms** | 353.3 ms | 2.7 ms | 0.7% | 1.00x | n/a | 778 files/s |
| eslint-plugin-vue (1T) | **5.34 s** | 5.25 s | 415.7 ms | 7.8% | 14.89x | n/a | 52 files/s |
| eslint-plugin-vue (4 workers) | **6.37 s** | 6.33 s | 96.5 ms | 1.5% | 17.75x | n/a | 44 files/s |
| eslint-plugin-vue (CLI) | **6.50 s** | 6.34 s | 87.6 ms | 1.3% | 18.12x | n/a | 43 files/s |
| Vize lint (1T) ⚠ | (119.8 ms) | (115.2 ms) | – | – | not ranked | – | – |
| Vize lint (max threads) ⚠ | (80.5 ms) | (78.2 ms) | – | – | not ranked | – | – |
| Biome lint (1T) ⚠ | (884.8 ms) | (882.9 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (428.0 ms) | (425.7 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (106.4 ms) | (102.9 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (82.6 ms) | (77.6 ms) | – | – | not ranked | – | – |

## Bundle (production build) — primevue:components

Files: **279** · Bytes: **1,721,906**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **620.1 ms** | 603.3 ms | 23.8 ms | 3.8% | 1.00x | 1,549,653 | 450 files/s |
| Vite 8 (Rolldown) × unplugin-vue | **637.3 ms** | 628.3 ms | 12.7 ms | 2.0% | 1.03x | 1,547,758 | 438 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **1.34 s** | 1.32 s | 25.8 ms | 1.9% | 2.15x | 1,528,263 | 209 files/s |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rolldown (no Vite) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × unplugin-vue | **949.0 ms** | 938.9 ms | 14.3 ms | 1.5% | 1.00x | 1,573,783 | 294 files/s |
| Rolldown (no Vite) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × @vizejs/rspack-plugin | **475.9 ms** | 469.3 ms | 9.3 ms | 2.0% | 1.00x | 2,945,824 | 586 files/s |
| Rspack × unplugin-vue | **938.7 ms** | 920.6 ms | 25.5 ms | 2.7% | 1.97x | 2,973,931 | 297 files/s |
| Rspack × vue-loader | **1.04 s** | 1.01 s | 43.5 ms | 4.2% | 2.18x | 4,183,226 | 269 files/s |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × unplugin-vue | **1.35 s** | 1.27 s | 117.0 ms | 8.7% | 1.00x | 3,298,643 | 207 files/s |
| webpack 5 × vue-loader | **1.59 s** | 1.33 s | 364.9 ms | 23.0% ⚠ | 1.18x | 6,029,254 | 176 files/s |
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
| Vite 8 (Rolldown) × @verter/unplugin | **33.2 ms** | 30.2 ms | 4.3 ms | 13.1% ⚠ | 1.00x | n/a | 8.4k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **33.6 ms** | 33.5 ms | 0.1 ms | 0.3% | 1.01x | n/a | 8.3k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **35.5 ms** | 29.0 ms | 9.2 ms | 25.8% ⚠ | 1.07x | n/a | 7.9k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **109.7 ms** | 68.6 ms | 58.1 ms | 53.0% ⚠ | 3.30x | n/a | 2.5k files/s |

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
| Vite 8 (Rolldown) × unplugin-vue | **6.6 ms** | 5.9 ms | 1.1 ms | 17.3% ⚠ | 1.00x | 55,317 | 42.4k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠ | (6.3 ms) | (6.0 ms) | – | – | not ranked | (55,315) | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-primevue.md).

## Project test suite — primevue:components

Files: **279** · Bytes: **1,721,906**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests passed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| primevue — unplugin-vue | **38.13 s** | 38.13 s | n/a | n/a | 1.00x | 403 | 7 files/s |
| primevue — project's own toolchain (baseline) | **38.51 s** | 38.51 s | n/a | n/a | 1.01x | 403 | 7 files/s |
| primevue — @vizejs/vite-plugin ⚠ | (27.80 s) | (27.80 s) | – | – | not ranked | (6) | – |
| primevue — @verter/unplugin ⚠ | (34.39 s) | (34.39 s) | – | – | not ranked | (252) | – |

## Project build (own config) — primevue:components

Files: **279** · Bytes: **1,721,906**

## Project typecheck (own tsconfig) — primevue:components

Files: **279** · Bytes: **1,721,906**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (N) | **17.24 s** | 16.87 s | 527.7 ms | 3.1% | 1.00x | 1,665 | 36 files/s |
| vue-tsc (JS) | **31.69 s** | 31.52 s | 241.8 ms | 0.8% | 1.84x | 1,683 | 20 files/s |
| verter-tsc ⚠ | (2.91 s) | (2.88 s) | – | – | not ranked | (0) | – |
| Vize ⚠ | (565.01 s) | (562.51 s) | – | – | not ranked | (0) | – |
| Golar typecheck ⏭ | skipped | – | – | – | – | – | – |

## Project component-meta (own tsconfig) — primevue:components

Files: **279** · Bytes: **1,721,906**

## Project LSP (project as workspace) — primevue:components

Files: **1** · Bytes: **6,562**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **367.9 ms** | 66.5 ms | 170.8 ms | 46.4% ⚠ | 1.00x | 1 | 3 files/s |
| Vize | **887.6 ms** | 880.1 ms | 7.3 ms | 0.8% | 2.41x | 69 | 1 files/s |
| Volar (JS) ⚠ | (2.05 s) | (2.04 s) | – | – | not ranked | (0) | – |
| Volar (N) ⚠ | (847.7 ms) | (810.5 ms) | – | – | not ranked | (0) | – |

### hover on `active`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **5.0 ms** | 2.3 ms | 2.3 ms | 46.1% ⚠ | 1.00x | 35 | 202 files/s |
| Volar (N) | **7.2 ms** | 6.7 ms | 0.5 ms | 7.2% | 1.44x | 35 | 140 files/s |
| Vize | **12.9 ms** | 12.7 ms | 0.4 ms | 3.1% | 2.58x | 263 | 77 files/s |
| Verter ⚠ | (3.6 ms) | (3.4 ms) | – | – | not ranked | (0) | – |



# quasar

<!-- source: real-world-Linux-quasar.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-quasar.md)** — methodology, per-row notes and raw runs (41 collapsed block(s) moved out of this page).



## SFC compile (unique contents)

Files: **252** · Bytes: **1,565,611**

### VDOM · production · sourcemap off

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter compileMany (session cache) | **46.5 ms** | 43.3 ms | 2.0 ms | 4.3% | 1.00x | 2,349,481 | 5.4k files/s |
| Vize native batch (max threads) | **55.4 ms** | 54.3 ms | 1.6 ms | 2.9% | 1.19x | 3,481,835 | 4.6k files/s |
| Vize native loop (1T) | **134.2 ms** | 133.3 ms | 0.8 ms | 0.6% | 2.89x | 3,481,835 | 1.9k files/s |
| Verter compileMany (stateless) | **208.9 ms** | 198.7 ms | 6.2 ms | 3.0% | 4.50x | 2,349,481 | 1.2k files/s |
| @vue/compiler-sfc 3.5 (1T) | **337.8 ms** | 326.6 ms | 62.0 ms | 18.3% ⚠ | 7.27x | 3,573,111 | 746 files/s |
| @vue/compiler-sfc 3.6 (1T) | **348.5 ms** | 327.3 ms | 18.2 ms | 5.2% | 7.50x | 3,573,111 | 723 files/s |
| fervid compileSync (1T) ⚠ | (152.1 ms) | (151.4 ms) | – | – | not ranked | (5,189,721) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (70.3 ms) | (68.6 ms) | – | – | not ranked | (5,189,721) | – |

## Format

Files: **252** · Bytes: **1,565,611**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **135.4 ms** | 131.9 ms | 41.3 ms | 30.5% ⚠ | 1.00x | n/a | 1.9k files/s |
| Oxfmt | **5.56 s** | 5.48 s | 97.8 ms | 1.8% | 41.11x | n/a | 45 files/s |
| Prettier | **6.16 s** | 6.04 s | 58.9 ms | 1.0% | 45.47x | n/a | 41 files/s |
| Biome format ⚠ | (119.2 ms) | (118.5 ms) | – | – | not ranked | – | – |

## Lint

Files: **252** · Bytes: **1,565,611**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **83.4 ms** | 81.7 ms | 2.1 ms | 2.5% | 1.00x | n/a | 3.0k files/s |
| Vize lint (1T) | **134.1 ms** | 130.2 ms | 5.4 ms | 4.0% | 1.61x | n/a | 1.9k files/s |
| Verter host lint | **484.0 ms** | 479.4 ms | 5.0 ms | 1.0% | 5.80x | n/a | 521 files/s |
| eslint-plugin-vue (1T) | **3.40 s** | 3.14 s | 425.6 ms | 12.5% ⚠ | 40.71x | n/a | 74 files/s |
| eslint-plugin-vue (CLI) | **4.90 s** | 4.82 s | 75.4 ms | 1.5% | 58.71x | n/a | 51 files/s |
| eslint-plugin-vue (4 workers) | **5.47 s** | 5.27 s | 104.2 ms | 1.9% | 65.58x | n/a | 46 files/s |
| Biome lint (1T) ⚠ | (399.1 ms) | (383.4 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (186.6 ms) | (176.9 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (68.1 ms) | (64.3 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (59.1 ms) | (55.9 ms) | – | – | not ranked | – | – |

## Bundle (production build) — quasar:playground

Files: **252** · Bytes: **1,565,611**

### Vite 8 (Rolldown) — Vue integrations compared

> ❌ **All 4 cells in this group failed — no measurements.** ([full report](docs/results/real-world-Linux-quasar.md))
> - **Vite 8 (Rolldown) × @vitejs/plugin-vue ❌**: Build failed with 11 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src/App.vue?vue&type=style&index=0&lang.sass
> - **Vite 8 (Rolldown) × unplugin-vue ❌**: Build failed with 11 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src/App.vue?vue&type=style&index=0&lang.sass
> - **Vite 8 (Rolldown) × @vizejs/vite-plugin ❌**: Build failed with 11 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src/App.vue?vue=&type=style&index=0&lang=sass.sass
> - **Vite 8 (Rolldown) × @verter/unplugin ❌**: Build failed with 11 errors: [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src/pages/components/list-expansion-item.vue?vue&type=style&index=0&…

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 61 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-quasar.md).

### Rspack — Vue integrations compared

> ❌ **All 4 cells in this group failed — no measurements.** ([full report](docs/results/real-world-Linux-quasar.md))
> - **Rspack × vue-loader ❌**: × Module not found: Can't resolve '../../lang/' in '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src' ╭─[8:25] 6 │ __name: 'App',
> - **Rspack × unplugin-vue ❌**: × Module not found: Can't resolve '../../lang/' in '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src' ╭─[8:25] 6 │ __name: 'App',
> - **Rspack × @vizejs/rspack-plugin ❌**: × Module Error (from /home/runner/work/vue-benchmarks/vue-benchmarks/node_modules/.pnpm/@vizejs+rspack-plugin@0.347.7_@rspack+core@2.1.10/node_modules/@vizejs/rspack-plugin/dist/loader/scope-loader.mjs): │ [vize] CSS pa…
> - **Rspack × @verter/unplugin ❌**: × Module not found: Can't resolve '../../lang/' in '/home/runner/work/vue-benchmarks/vue-benchmarks/work-real/quasar/bundle/quasar-playground/ui/playground/src' ╭─[9:25] 7 │ __name: 'App',

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
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **30.0 ms** | 24.4 ms | 7.9 ms | 26.4% ⚠ | 1.00x | n/a | 8.4k files/s |
| Vite 8 (Rolldown) × @verter/unplugin | **44.4 ms** | 23.4 ms | 29.7 ms | 66.9% ⚠ | 1.48x | n/a | 5.7k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **50.0 ms** | 28.4 ms | 30.5 ms | 61.0% ⚠ | 1.67x | n/a | 5.0k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **60.4 ms** | 56.3 ms | 5.8 ms | 9.6% | 2.01x | n/a | 4.2k files/s |

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
| Vite 8 (Rolldown) × unplugin-vue | **7.6 ms** | 7.0 ms | 2.9 ms | 38.2% ⚠ | 1.00x | 38,268 | 33.1k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠ | (6.5 ms) | (6.2 ms) | – | – | not ranked | (38,266) | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-quasar.md).

## Project test suite — quasar:playground

Files: **252** · Bytes: **1,565,611**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests passed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| quasar.dev — project's own toolchain (baseline) | **2.98 s** | 2.98 s | n/a | n/a | 1.00x | 226 | 85 files/s |
| quasar.dev — unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| quasar.dev — @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| quasar.dev — @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

## Project build (own config) — quasar:playground

Files: **252** · Bytes: **1,565,611**

## Project typecheck (own tsconfig) — quasar:playground

Files: **252** · Bytes: **1,565,611**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (N) | **1.76 s** | 1.74 s | 15.4 ms | 0.9% | 1.00x | 0 | 145 files/s |
| Vize | **2.16 s** | 2.15 s | 17.4 ms | 0.8% | 1.23x | 0 | 118 files/s |
| vue-tsc (JS) | **8.00 s** | 8.00 s | 5.4 ms | 0.1% | 4.55x | 0 | 32 files/s |
| verter-tsc ⚠ | (322.0 ms) | (317.5 ms) | – | – | not ranked | (11) | – |
| Golar typecheck ⏭ | skipped | – | – | – | – | – | – |

## Project component-meta (own tsconfig) — quasar:playground

Files: **252** · Bytes: **1,565,611**

## Project LSP (project as workspace) — quasar:playground

Files: **1** · Bytes: **4,806**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **309.9 ms** | 269.6 ms | 62.0 ms | 20.0% ⚠ | 1.00x | 3 | 3 files/s |
| Vize | **449.0 ms** | 395.2 ms | 29.8 ms | 6.6% | 1.45x | 10 | 2 files/s |
| Volar (JS) ⚠ | (5.14 s) | (5.10 s) | – | – | not ranked | (0) | – |
| Volar (N) ⚠ | (3.74 s) | (3.72 s) | – | – | not ranked | (0) | – |

### hover on `langList`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **8.3 ms** | 5.2 ms | 1.8 ms | 22.1% ⚠ | 1.00x | 37 | 120 files/s |
| Volar (JS) ⚠ | (2.0 ms) | (2.0 ms) | – | – | not ranked | (37) | – |
| Verter ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (37) | – |
| Vize ⚠ | (3.7 ms) | (3.2 ms) | – | – | not ranked | (265) | – |



# vue-vben-admin

<!-- source: real-world-Linux-vue-vben-admin.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-vue-vben-admin.md)** — methodology, per-row notes and raw runs (41 collapsed block(s) moved out of this page).



## Methodology notes

- ⚠ HARNESS GAP — 1 surface run(s) threw and produced NO rows. These are failures of this harness on this machine, not results about any tool, and nothing should be inferred about the tools that would have been measured: compile on vue-vben-admin:core-ui (undefined)

## Format

Files: **330** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **398.7 ms** | 233.1 ms | 140.4 ms | 35.2% ⚠ | 1.00x | n/a | 828 files/s |
| Oxfmt | **2.51 s** | 2.47 s | 48.1 ms | 1.9% | 6.30x | n/a | 131 files/s |
| Prettier | **3.54 s** | 3.51 s | 28.4 ms | 0.8% | 8.88x | n/a | 93 files/s |
| Biome format ⚠ | (104.1 ms) | (100.3 ms) | – | – | not ranked | – | – |

## Lint

Files: **330** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | **348.1 ms** | 345.6 ms | 10.0 ms | 2.9% | 1.00x | n/a | 948 files/s |
| eslint-plugin-vue (1T) | **1.81 s** | 1.78 s | 119.1 ms | 6.6% | 5.21x | n/a | 182 files/s |
| eslint-plugin-vue (4 workers) | **3.17 s** | 3.15 s | 41.3 ms | 1.3% | 9.11x | n/a | 104 files/s |
| eslint-plugin-vue (CLI) | **3.20 s** | 3.17 s | 37.5 ms | 1.2% | 9.20x | n/a | 103 files/s |
| Vize lint (1T) ⚠ | (79.6 ms) | (78.4 ms) | – | – | not ranked | – | – |
| Vize lint (max threads) ⚠ | (64.1 ms) | (59.5 ms) | – | – | not ranked | – | – |
| Biome lint (1T) ⚠ | (463.2 ms) | (459.8 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (196.8 ms) | (196.2 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (66.4 ms) | (62.1 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (59.0 ms) | (57.8 ms) | – | – | not ranked | – | – |

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
| Rspack × vue-loader | **348.4 ms** | 289.6 ms | 83.2 ms | 23.9% ⚠ | 1.00x | 2,321,761 | 594 files/s |
| Rspack × unplugin-vue | **674.5 ms** | 669.5 ms | 7.1 ms | 1.1% | 1.94x | 1,781,622 | 307 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader | **551.8 ms** | 502.4 ms | 69.8 ms | 12.7% ⚠ | 1.00x | 3,302,016 | 375 files/s |
| webpack 5 × unplugin-vue | **995.5 ms** | 979.4 ms | 22.7 ms | 2.3% | 1.80x | 2,550,208 | 208 files/s |
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
| Vite 8 (Rolldown) × @verter/unplugin | **16.8 ms** | 16.3 ms | 0.7 ms | 4.0% | 1.00x | n/a | 12.3k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **17.9 ms** | 17.7 ms | 0.1 ms | 0.8% | 1.06x | n/a | 11.6k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **21.3 ms** | 18.8 ms | 3.5 ms | 16.6% ⚠ | 1.26x | n/a | 9.7k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **44.1 ms** | 38.1 ms | 8.4 ms | 19.1% ⚠ | 2.62x | n/a | 4.7k files/s |

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
| Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠ | (14.9 ms) | (11.7 ms) | – | – | not ranked | (63,065) | – |
| Vite 8 (Rolldown) × unplugin-vue ⚠ | (14.3 ms) | (13.3 ms) | – | – | not ranked | (63,067) | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (1.1 ms) | (0.7 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vue-vben-admin.md).

## Project test suite — vue-vben-admin:core-ui

Files: **330** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests passed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vben-admin-monorepo — project's own toolchain (baseline) | **6.54 s** | 6.54 s | n/a | n/a | 1.00x | 308 | 50 files/s |
| vben-admin-monorepo — unplugin-vue | **6.57 s** | 6.57 s | n/a | n/a | 1.00x | 308 | 50 files/s |
| vben-admin-monorepo — @verter/unplugin | **6.76 s** | 6.76 s | n/a | n/a | 1.03x | 308 | 49 files/s |
| vben-admin-monorepo — @vizejs/vite-plugin | **28.37 s** | 28.37 s | n/a | n/a | 4.34x | 308 | 12 files/s |

## Project build (own config) — vue-vben-admin:core-ui

Files: **330** · Bytes: **933,224**

## Project typecheck (own tsconfig) — vue-vben-admin:core-ui

Files: **330** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (N) | **7.09 s** | 6.94 s | 209.8 ms | 3.0% | 1.00x | 0 | 18 files/s |
| vue-tsc (JS) | **14.07 s** | 13.92 s | 208.3 ms | 1.5% | 1.98x | 0 | 9 files/s |
| verter-tsc ⚠ | (2.53 s) | (2.49 s) | – | – | not ranked | (156) | – |
| Vize ⚠ | (198.80 s) | (198.12 s) | – | – | not ranked | (20) | – |
| Golar typecheck ⏭ | skipped | – | – | – | – | – | – |

## Project component-meta (own tsconfig) — vue-vben-admin:core-ui

Files: **70** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | **489.8 ms** | 483.1 ms | 13.7 ms | 2.8% | 1.00x | 70 | 143 files/s |
| vue-component-meta | **1.66 s** | 1.63 s | 181.0 ms | 10.9% ⚠ | 3.38x | 70 | 42 files/s |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — vue-vben-admin:core-ui

Files: **1** · Bytes: **5,190**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **4.04 s** | 3.94 s | 88.5 ms | 2.2% | 1.00x | 4 | 0 files/s |
| Volar (JS) ⚠ | (2.81 s) | (2.57 s) | – | – | not ranked | (0) | – |
| Volar (N) ⚠ | (1.65 s) | (1.60 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (387.9 ms) | (379.7 ms) | – | – | not ranked | (0) | – |

### hover on `props`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.6 ms** | 3.3 ms | 1.5 ms | 42.8% ⚠ | 1.00x | 621 | 278 files/s |
| Volar (N) | **5.6 ms** | 5.1 ms | 1.2 ms | 20.6% ⚠ | 1.56x | 234 | 178 files/s |
| Verter | **46.7 ms** | 39.3 ms | 7.0 ms | 15.0% ⚠ | 12.97x | 618 | 21 files/s |
| Vize ⚠ | (153.0 ms) | (146.2 ms) | – | – | not ranked | (447) | – |



# vuetify

<!-- source: real-world-Linux-vuetify.md -->

> 📄 **[Full details →](docs/results/real-world-Linux-vuetify.md)** — methodology, per-row notes and raw runs (45 collapsed block(s) moved out of this page).



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
| Vize native batch (max threads) | **102.7 ms** | 101.9 ms | 3.1 ms | 3.0% | 1.00x | 4,143,182 | 12.1k files/s |
| Vize native loop (1T) | **292.5 ms** | 290.2 ms | 2.4 ms | 0.8% | 2.85x | 4,143,182 | 4.3k files/s |
| @vue/compiler-sfc 3.5 (1T) | **795.6 ms** | 758.3 ms | 27.4 ms | 3.4% | 7.75x | 4,396,000 | 1.6k files/s |
| @vue/compiler-sfc 3.6 (1T) | **830.5 ms** | 749.7 ms | 39.0 ms | 4.7% | 8.09x | 4,396,000 | 1.5k files/s |
| Verter compileMany (stateless) ⚠ | (2.41 s) | (2.36 s) | – | – | not ranked | (3,308,945) | – |
| Verter compileMany (session cache) ⚠ | (96.3 ms) | (92.2 ms) | – | – | not ranked | (3,308,945) | – |

## Format

Files: **1,246** · Bytes: **2,032,022**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **401.3 ms** | 393.0 ms | 15.0 ms | 3.7% | 1.00x | n/a | 3.1k files/s |
| Oxfmt | **6.47 s** | 6.41 s | 107.6 ms | 1.7% | 16.12x | n/a | 193 files/s |
| Prettier | **9.99 s** | 9.75 s | 171.0 ms | 1.7% | 24.90x | n/a | 125 files/s |
| Biome format ⚠ | (270.2 ms) | (267.7 ms) | – | – | not ranked | – | – |

## Lint

Files: **1,246** · Bytes: **2,032,022**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **129.7 ms** | 126.8 ms | 1.8 ms | 1.4% | 1.00x | n/a | 9.6k files/s |
| Vize lint (1T) | **240.7 ms** | 238.5 ms | 4.2 ms | 1.8% | 1.86x | n/a | 5.2k files/s |
| Verter host lint | **701.9 ms** | 691.5 ms | 11.0 ms | 1.6% | 5.41x | n/a | 1.8k files/s |
| eslint-plugin-vue (1T) | **7.72 s** | 7.49 s | 156.5 ms | 2.0% | 59.50x | n/a | 161 files/s |
| eslint-plugin-vue (4 workers) | **8.34 s** | 8.28 s | 93.1 ms | 1.1% | 64.25x | n/a | 149 files/s |
| eslint-plugin-vue (CLI) | **9.12 s** | 8.83 s | 256.7 ms | 2.8% | 70.32x | n/a | 137 files/s |
| Biome lint (1T) ⚠ | (1.30 s) | (1.30 s) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (530.6 ms) | (527.5 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (123.9 ms) | (118.4 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (87.2 ms) | (82.5 ms) | – | – | not ranked | – | – |

## Bundle (production build) — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **1.81 s** | 1.81 s | 9.6 ms | 0.5% | 1.00x | 3,313,636 | 688 files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **1.91 s** | 1.75 s | 220.2 ms | 11.5% ⚠ | 1.05x | 3,319,011 | 653 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **2.49 s** | 2.39 s | 137.1 ms | 5.5% | 1.37x | 3,174,196 | 501 files/s |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### Rolldown (no Vite) — Vue integrations compared

> ⏭ **All 2 cells in this group were skipped — no measurements.** this corpus carries 78 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. Per-row wording: [full report](docs/results/real-world-Linux-vuetify.md).

### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × unplugin-vue | **3.21 s** | 3.18 s | 48.2 ms | 1.5% | 1.00x | 8,532,156 | 388 files/s |
| Rspack × vue-loader | **4.11 s** | 3.87 s | 346.5 ms | 8.4% | 1.28x | 12,130,642 | 303 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × unplugin-vue | **4.16 s** | 4.00 s | 229.2 ms | 5.5% | 1.00x | 9,858,560 | 300 files/s |
| webpack 5 × vue-loader | **5.60 s** | 5.19 s | 574.1 ms | 10.3% ⚠ | 1.35x | 17,765,615 | 223 files/s |
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
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **147.7 ms** | 115.4 ms | 45.7 ms | 30.9% ⚠ | 1.00x | n/a | 8.4k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **159.6 ms** | 147.2 ms | 17.5 ms | 11.0% ⚠ | 1.08x | n/a | 7.8k files/s |
| Vite 8 (Rolldown) × @verter/unplugin | **167.0 ms** | 151.2 ms | 22.4 ms | 13.4% ⚠ | 1.13x | n/a | 7.5k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **263.7 ms** | 254.3 ms | 13.2 ms | 5.0% | 1.78x | n/a | 4.7k files/s |

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
| Vite 8 (Rolldown) × unplugin-vue | **8.0 ms** | 7.9 ms | 0.3 ms | 4.2% | 1.00x | 19,857 | 154.8k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠ | (9.5 ms) | (7.2 ms) | – | – | not ranked | (19,855) | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (1.2 ms) | (1.2 ms) | – | – | not ranked | (0) | – |

#### WEBPACK — ranked alone

> ⏭ **All 4 cells in this group were skipped — no measurements.** webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Per-row wording: [full report](docs/results/real-world-Linux-vuetify.md).

## Project test suite — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests passed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vuetify — project's own toolchain (baseline) | **41.81 s** | 41.81 s | n/a | n/a | 1.00x | 807 | 30 files/s |
| vuetify — @verter/unplugin | **42.24 s** | 42.24 s | n/a | n/a | 1.01x | 807 | 29 files/s |
| vuetify — unplugin-vue | **42.38 s** | 42.38 s | n/a | n/a | 1.01x | 807 | 29 files/s |
| vuetify — @vizejs/vite-plugin | **42.48 s** | 42.48 s | n/a | n/a | 1.02x | 807 | 29 files/s |

## Project build (own config) — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

## Project typecheck (own tsconfig) — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | **5.17 s** | 5.12 s | 71.4 ms | 1.4% | 1.00x | 13,593 | 241 files/s |
| vue-tsc (N) | **12.56 s** | 12.53 s | 44.8 ms | 0.4% | 2.43x | 21 | 99 files/s |
| Vize | **13.39 s** | 13.30 s | 127.3 ms | 1.0% | 2.59x | 30 | 93 files/s |
| vue-tsc (JS) | **31.01 s** | 30.88 s | 183.4 ms | 0.6% | 6.00x | 21 | 40 files/s |
| Golar typecheck ⏭ | skipped | – | – | – | – | – | – |

## Project component-meta (own tsconfig) — vuetify:docs

Files: **1,246** · Bytes: **2,032,022**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | **8.35 s** | 7.03 s | 693.4 ms | 8.3% | 1.00x | 1,246 | 149 files/s |
| @verter/component-meta ⚠ | (6.24 s) | (6.07 s) | – | – | not ranked | (1,246) | – |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

## Project LSP (project as workspace) — vuetify:docs

Files: **1** · Bytes: **3,428**

### didOpen → diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **900.1 ms** | 873.5 ms | 25.7 ms | 2.9% | 1.00x | 3 | 1 files/s |
| Volar (JS) ⚠ | (11.01 s) | (10.78 s) | – | – | not ranked | (0) | – |
| Volar (N) ⚠ | (6.45 s) | (6.30 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (669.4 ms) | (644.3 ms) | – | – | not ranked | (0) | – |

### hover on `user`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.5 ms** | 1.5 ms | 0.1 ms | 6.2% | 1.00x | 5,027 | 657 files/s |
| Vize | **5.0 ms** | 4.7 ms | 0.2 ms | 3.9% | 3.33x | 261 | 199 files/s |
| Volar (JS) | **12.0 ms** | 8.1 ms | 2.3 ms | 19.5% ⚠ | 8.00x | 5,035 | 83 files/s |
| Volar (N) | **50.9 ms** | 32.7 ms | 23.4 ms | 46.0% ⚠ | 33.93x | 3,244 | 20 files/s |



<!-- REAL_WORLD_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports: [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
