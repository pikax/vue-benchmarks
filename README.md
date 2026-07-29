# Vue Toolchain Benchmarks

Throughput benchmarks for the Vue toolchain, measured on one Linux CI runner per run and published below. Layout and CI pattern follow [rolldown/benchmarks](https://github.com/rolldown/benchmarks): measure on CI, commit the tables back to this file.

## What is compared

| Surface | Tools |
| --- | --- |
| **SFC compile** (vdom/vapor × prod/dev) | `@vue/compiler-sfc` 3.5 & 3.6 · Vize (`@vizejs/native`) · Verter (`@verter/native`) · [fervid](https://github.com/phoenix-ru/fervid) (`@fervid/napi`, vdom only — currently unranked, see below) |
| **JSX compile** | vue-jsx-vapor (Rust + API) · `@vue/babel-plugin-jsx` |
| **Typecheck** | `vue-tsc` (JS engine and TNB/tsgo) · golar · Vize · `verter-tsc` |
| **Format** | Prettier · Oxfmt · Vize |
| **Lint** | eslint-plugin-vue · Vize · Verter |
| **Component-meta** | vue-component-meta · Verter · (Vize: skipped, no public API) |
| **LSP + IDE operations** | Volar (JS engine and TNB/tsgo tsdk) · Vize · Verter |
| **Memory / CPU** | all of the above, sampled separately — published in [MEMORY.md](./MEMORY.md) |

## How to read the tables

- Ranked on the **median of measured runs**, all warmed (≥1 discarded pass; no cold column). Min / stddev / CV% ride along; CV% > 10 is flagged ⚠ — noise, not a result.
- **One table per surface** (only vapor/vdom codegen targets stay separate — different jobs). Engine, invocation and threading are row properties: **(JS)** marks the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's Go rewrite as much as the tool), and the row's label/notes say CLI vs in-process and the thread mode — compare like with like.
- Name markers: **⚠** failed a validation gate (time in brackets, unranked) · **❌** error · **⏭** skipped/not installed.
- Per-row detail lives in the collapsible **Notes** under each table; each surface has a **Tools** legend saying what actually ran.
- A tool that misses a planted bug is **measured but unranked** — speed without the work is not a result.

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

> Auto-updated 2026-07-27 from the **Benchmark** workflow (rolldown-style: measure on CI → commit README on `main` with `[skip ci]`).
> Numbers are reference-only; re-run on your hardware for local relevance.
> Every measured run is warmed (>= 1 discarded pass); the ranking metric is the median. There is no cold column.

#### Ubuntu/Linux · bench

<!-- source: bench-Linux-200-bench.md -->

## Benchmark Results

- **Generated:** 2026-07-27T17:27:43.471Z
- **Fixture:** `fixtures/200` (200 SFCs)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
- **Node:** v22.23.1
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/30288994570

### Tool versions

| Package | Version |
| --- | --- |
| vue | 3.5.40 |
| @vue/compiler-sfc | 3.5.40 |
| @vue/compiler-sfc-36 | 3.6.0-rc.2 |
| vize | 0.291.0 |
| @vizejs/native | 0.291.0 |
| @verter/native | 0.0.1-beta.3 |
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
| typescript | 5.9.3 |
| cli:vize | 0.291.0 |
| cli:vue-tsc | 5.9.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.61.0 |
| vue-jsx-vapor | 3.2.19 |
| @vue-jsx-vapor/compiler-rs | 3.2.19 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

### Methodology notes

- Primary ranking metric is the **median of measured runs**. Every measured run is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1).
- There is **no cold column**. An unwarmed first run costs a JS compiler ~3.2x its steady state and a native compiler nothing, so ranking on it measures V8 warmup rather than the tool.
- Min / stddev / CV% are reported per row. CV% > 10 is flagged ⚠ — treat that row as noisy (thermal drift or a contended runner), not as a result.
- Each surface is ONE table. Engine, invocation and threading are row properties, not table splits: a CLI pays process startup on every run (~85ms measured for one native CLI) while an in-process API amortises it, and a thread pool is not a single thread — the row's label and notes say which mode it ran, so compare like with like.
- Surfaces are independent: compile ms is not comparable to jsx-compile/typecheck/lint/format ms.
- jsx-compile uses fixtures/jsx-N (.jsx); SFC compile uses fixtures/N (.vue).
- Compile matrix cells (VDOM/Vapor × production/development × sourcemap on/off) are independent.
- Source map is an explicit, independent dimension applied identically to every compiler — it is never folded into the production/development flag for some tools and not others.
- Primary compile corpus is unique file contents (fixtures/N).
- Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.
- Tool order is **rotated** on every warmup and measured run, so no tool is pinned to the expensive first slot.
- CI does not drop OS page cache; later tools in a job may share a warmer file cache.
- Typecheck/lint tools that fail a planted-bug work gate are unranked (skipped). Typecheck gates require both a script-level and a template-level diagnostic, and are re-verified against the full timed corpus.
- Compile measures assert non-empty codegen where applicable.
- Vue official compiler is 1T only (worker_threads variants removed).
- LSP: every server resolves from its installed npm package and is skipped when absent — no local-build or working-copy discovery, so each row names a version.
- verter-tsc needs stable tsgo (typescript@7.0.x via typescript-go); harness sets VERTER_TSGO_BIN.
- Diagnostic/format identity across tools is not required for throughput rows.

### SFC compile (unique contents)

Files: **200** · Bytes: **285,701**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Compile results are **grouped by target × environment × source map**, then by comparison class.

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **16.4 ms** | 16.0 ms | 0.5 ms | 3.0% | 1.00x | 609,596 | 12.2k files/s |
| Verter compileMany (session cache) | **22.3 ms** | 21.5 ms | 1.4 ms | 6.4% | 1.36x | 541,003 | 9.0k files/s |
| Vize native loop (1T) | **43.1 ms** | 43.1 ms | 0.3 ms | 0.8% | 2.63x | 609,596 | 4.6k files/s |
| Verter compileMany (stateless) | **129.4 ms** | 127.9 ms | 2.2 ms | 1.7% | 7.89x | 541,003 | 1.5k files/s |
| @vue/compiler-sfc 3.5 (1T) | **157.0 ms** | 144.3 ms | 9.6 ms | 6.1% | 9.58x | 670,030 | 1.3k files/s |
| @vue/compiler-sfc 3.6 (1T) | **166.7 ms** | 156.2 ms | 5.3 ms | 3.2% | 10.18x | 670,030 | 1.2k files/s |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, hmr=none, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 17.3 ms, 16.3 ms, 16.7 ms, 16.4 ms, 16.0 ms
- **Verter compileMany (session cache)**: 21.7 ms, 24.9 ms, 22.3 ms, 21.5 ms, 23.6 ms
- **Vize native loop (1T)**: 43.1 ms, 43.1 ms, 43.1 ms, 43.6 ms, 43.8 ms
- **Verter compileMany (stateless)**: 131.6 ms, 133.1 ms, 129.4 ms, 127.9 ms, 128.3 ms
- **@vue/compiler-sfc 3.5 (1T)**: 168.1 ms, 164.2 ms, 157.0 ms, 151.5 ms, 144.3 ms
- **@vue/compiler-sfc 3.6 (1T)**: 166.7 ms, 166.9 ms, 158.2 ms, 156.2 ms, 166.8 ms

</details>

#### VDOM · development · sourcemap off

Target: `vdom` · Environment: `development` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **16.5 ms** | 16.0 ms | 1.0 ms | 6.3% | 1.00x | 609,596 | 12.2k files/s |
| Verter compileMany (session cache) | **26.4 ms** | 20.6 ms | 2.8 ms | 10.6% ⚠ | 1.60x | 663,894 | 7.6k files/s |
| Vize native loop (1T) | **43.9 ms** | 43.5 ms | 0.5 ms | 1.1% | 2.67x | 609,596 | 4.6k files/s |
| Verter compileMany (stateless) | **134.0 ms** | 130.7 ms | 2.9 ms | 2.2% | 8.14x | 663,894 | 1.5k files/s |
| @vue/compiler-sfc 3.5 (1T) | **138.5 ms** | 136.4 ms | 5.5 ms | 4.0% | 8.42x | 656,372 | 1.4k files/s |
| @vue/compiler-sfc 3.6 (1T) | **144.1 ms** | 136.0 ms | 10.5 ms | 7.3% | 8.76x | 656,372 | 1.4k files/s |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=false, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=false, sourceMap=false, hmr=vite, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=false, sourceMap=false, single-threaded
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=false, sourceMap=false

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 18.6 ms, 16.0 ms, 16.5 ms, 16.4 ms, 16.5 ms
- **Verter compileMany (session cache)**: 27.3 ms, 24.1 ms, 26.4 ms, 26.9 ms, 20.6 ms
- **Vize native loop (1T)**: 43.5 ms, 44.0 ms, 44.8 ms, 43.9 ms, 43.8 ms
- **Verter compileMany (stateless)**: 135.6 ms, 131.8 ms, 137.9 ms, 130.7 ms, 134.0 ms
- **@vue/compiler-sfc 3.5 (1T)**: 149.9 ms, 139.9 ms, 138.5 ms, 136.4 ms, 137.1 ms
- **@vue/compiler-sfc 3.6 (1T)**: 161.6 ms, 149.1 ms, 136.8 ms, 144.1 ms, 136.0 ms

</details>

#### VAPOR · production · sourcemap off

Target: `vapor` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **20.9 ms** | 16.8 ms | 2.4 ms | 11.6% ⚠ | 1.00x | 754,148 | 9.6k files/s |
| Verter compileMany (session cache) | **24.7 ms** | 18.0 ms | 4.2 ms | 16.9% ⚠ | 1.18x | 577,324 | 8.1k files/s |
| Vize native loop (1T) | **45.7 ms** | 44.1 ms | 1.1 ms | 2.3% | 2.19x | 754,148 | 4.4k files/s |
| Verter compileMany (stateless) | **142.4 ms** | 135.4 ms | 6.3 ms | 4.4% | 6.81x | 577,324 | 1.4k files/s |
| @vue/compiler-sfc 3.6 (1T) | **332.2 ms** | 279.7 ms | 34.8 ms | 10.5% ⚠ | 15.89x | 690,938 | 602 files/s |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=true, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=true, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=true, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=true, isProduction=true, sourceMap=false, hmr=none, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=true, sourceMap=false
- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 17.0 ms, 16.8 ms, 20.9 ms, 21.5 ms, 21.5 ms
- **Verter compileMany (session cache)**: 18.0 ms, 24.7 ms, 29.1 ms, 27.1 ms, 23.9 ms
- **Vize native loop (1T)**: 45.8 ms, 44.1 ms, 45.7 ms, 45.2 ms, 47.1 ms
- **Verter compileMany (stateless)**: 135.4 ms, 138.1 ms, 142.4 ms, 148.3 ms, 149.9 ms
- **@vue/compiler-sfc 3.6 (1T)**: 332.2 ms, 339.6 ms, 371.2 ms, 305.5 ms, 279.7 ms

</details>

#### VAPOR · development · sourcemap off

Target: `vapor` · Environment: `development` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **17.3 ms** | 16.5 ms | 3.1 ms | 17.6% ⚠ | 1.00x | 754,148 | 11.5k files/s |
| Verter compileMany (session cache) | **22.0 ms** | 18.3 ms | 5.7 ms | 25.8% ⚠ | 1.27x | 613,062 | 9.1k files/s |
| Vize native loop (1T) | **44.7 ms** | 44.3 ms | 1.1 ms | 2.6% | 2.58x | 754,148 | 4.5k files/s |
| Verter compileMany (stateless) | **145.7 ms** | 139.7 ms | 11.5 ms | 7.9% | 8.40x | 613,062 | 1.4k files/s |
| @vue/compiler-sfc 3.6 (1T) | **273.2 ms** | 268.7 ms | 17.0 ms | 6.2% | 15.75x | 692,676 | 732 files/s |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=true, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=true, isProduction=false, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=true, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=true, isProduction=false, sourceMap=false, hmr=vite, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=false, sourceMap=false
- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 22.8 ms, 21.9 ms, 16.5 ms, 17.3 ms, 16.6 ms
- **Verter compileMany (session cache)**: 23.3 ms, 33.1 ms, 18.3 ms, 20.9 ms, 22.0 ms
- **Vize native loop (1T)**: 45.0 ms, 47.2 ms, 44.3 ms, 44.7 ms, 44.7 ms
- **Verter compileMany (stateless)**: 168.1 ms, 152.0 ms, 139.7 ms, 141.2 ms, 145.7 ms
- **@vue/compiler-sfc 3.6 (1T)**: 309.8 ms, 273.2 ms, 270.1 ms, 278.7 ms, 268.7 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=unique: 200/200 unique content SHAs. Vize content-hash caches treat identical bodies as free — primary rankings must use unique fixtures (fixtures/N), not fixtures/N-repeated.
- Same in-memory Vue SFC corpus for every variant (compiler flags differ; sources do not).
- Work measured: parse SFC + compile script (if any) + compile template (if any).
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested identically from every compiler in a cell (Vue: parse+compileScript+codegen sourceMap; Vize: compileSfc sourceMap; Verter: compileProfile sourceMap). It is not folded into the prod/dev flag for some tools and not others.
- Production vs development uses each tool's real semantic knobs only: Vue isProd (hoistStatic + cacheHandlers); Verter isProduction + hmrStrategy.
- ⚠ Vize exposes no isProduction on compileSfc, so its production and development rows perform identical work. Stated rather than substituted with a different knob.
- Vue 3.5 has no Vapor path → skipped for vapor cells (not run as VDOM).
- 1T / batch / batch-cached rows share the table; the mode is in the row label. A batch pool amortises across a thread pool and a cached session reuses prior analysis, so read same-mode rows against each other.
- Verter session mode keeps a persistent host across warmups and runs, so it is ranked as `batch-cached`, apart from cache-free batch rows.
- Tool order is rotated on every warmup and measured run; no tool is pinned to first position.
- Ranking metric is the median of measured runs, all taken after >= 1 discarded warmup. No cold column.

</details>

### JSX compile

Files: **200** · Bytes: **38,804**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

##### VAPOR — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (vapor) | **3.6 ms** | 3.6 ms | 0.3 ms | 8.7% | 1.00x | n/a | 55.3k files/s |
| vue-jsx-vapor/api | **4.4 ms** | 4.3 ms | 0.1 ms | 2.5% | 1.21x | n/a | 45.7k files/s |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (vapor)**: Rust/Oxc transform; default vapor mode (see vuejs/vue-jsx-vapor). Same unique .jsx corpus as other JSX rows.
- **vue-jsx-vapor/api**: transformVueJsxVapor() public API (vapor default).

</details>

##### VDOM — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | **3.1 ms** | 3.1 ms | 0.1 ms | 2.2% | 1.00x | n/a | 63.9k files/s |
| @vue/babel-plugin-jsx (Babel VDOM) | **132.4 ms** | 112.5 ms | 11.8 ms | 8.9% | 42.33x | n/a | 1.5k files/s |

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

- **@vue-jsx-vapor/compiler-rs (vapor)**: 3.6 ms, 3.6 ms, 3.6 ms, 4.3 ms, 3.8 ms
- **vue-jsx-vapor/api**: 4.3 ms, 4.4 ms, 4.3 ms, 4.6 ms, 4.4 ms
- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: 3.1 ms, 3.2 ms, 3.1 ms, 3.3 ms, 3.1 ms
- **@vue/babel-plugin-jsx (Babel VDOM)**: 136.4 ms, 132.4 ms, 116.2 ms, 137.8 ms, 112.5 ms

</details>

### Typecheck

Files: **200** · Bytes: **285,701**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Tools:

- **vue-tsc (JS)** — the official Vue Language Tools CLI — vue-tsc --noEmit -p tsconfig.json, stock JavaScript TypeScript engine.
- **vue-tsc (N)** — the same vue-tsc with typescript aliased to typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Golar typecheck** — golar typecheck — typescript-go with the @golar/vue plugin, pure typecheck.
- **Golar (lint+check)** — golar default mode — lint then typecheck in one pass, not a pure typecheck.
- **Vize** — vize check --tsconfig tsconfig.json (native, Corsa when available).
- **verter-tsc** — verter-tsc --noEmit -p tsconfig.json from the published npm package; runs stable tsgo.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | **1.06 s** | 1.05 s | 30.2 ms | 2.8% | 1.00x | 420 | 188 files/s |
| Golar (lint+check) | **1.53 s** | 1.51 s | 10.5 ms | 0.7% | 1.44x | 0 | 130 files/s |
| Golar typecheck | **1.56 s** | 1.55 s | 9.4 ms | 0.6% | 1.47x | 0 | 128 files/s |
| vue-tsc (N) | **2.21 s** | 2.06 s | 76.2 ms | 3.4% | 2.08x | 0 | 90 files/s |
| vue-tsc (JS) | **4.69 s** | 4.68 s | 11.0 ms | 0.2% | 4.40x | 0 | 43 files/s |
| Vize ⚠ | (421.2 ms) | (411.1 ms) | – | – | not ranked | (22) | – |

<details><summary>Notes</summary>

- **verter-tsc**: verter-tsc --noEmit -p tsconfig.json · tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **Golar (lint+check)**: golar default mode runs lint then typecheck — not a pure typecheck | engine: typescript-go 7.0.2 | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **Golar typecheck**: golar typecheck (typescript-go + @golar/vue plugin) | engine: typescript-go 7.0.2 | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **vue-tsc (N)**: vue-tsc 3.3.8 with typescript aliased to typescript-native-bridge 6.0.3-bridge.6.tsgo.7.0.2 (TS API 6.0.3 on tsgo 7.0.2, in-process NAPI/FFI) | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **vue-tsc (JS)**: Official Vue Language Tools CLI: vue-tsc --noEmit -p tsconfig.json | engine: TypeScript 5.9.3 (JS) | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **Vize ⚠**: vize check . --tsconfig tsconfig.json (native + Corsa when available) | engine: tsgo 7.0.0-dev.20260602.1 (nightly) | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | gate: script=✓ tmpl-prop=✗ tmpl-event=✓ corpus=✗ (missed template prop-type plant (:disabled string→boolean))

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

- **verter-tsc**: 1.06 s, 1.05 s, 1.05 s, 1.12 s, 1.06 s
- **Golar (lint+check)**: 1.52 s, 1.54 s, 1.51 s, 1.54 s, 1.53 s
- **Golar typecheck**: 1.56 s, 1.56 s, 1.57 s, 1.57 s, 1.55 s
- **vue-tsc (N)**: 2.26 s, 2.21 s, 2.22 s, 2.21 s, 2.06 s
- **vue-tsc (JS)**: 4.70 s, 4.70 s, 4.68 s, 4.68 s, 4.69 s
- **Vize**: 411.1 ms, 440.3 ms, 421.2 ms, 418.8 ms, 423.0 ms

</details>

### Format

Files: **200** · Bytes: **285,701**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Tools:

- **Prettier** — prettier --write over a fresh corpus copy; built-in Vue SFC support, single-threaded by design.
- **Oxfmt** — oxfmt --write — Oxc's Vue-capable formatter, multi-threaded.
- **Vize** — vize fmt --write.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **96.3 ms** | 94.7 ms | 1.4 ms | 1.4% | 1.00x | n/a | 2.1k files/s |
| Oxfmt | **2.99 s** | 2.92 s | 39.6 ms | 1.3% | 31.01x | n/a | 67 files/s |
| Prettier | **3.77 s** | 3.76 s | 16.0 ms | 0.4% | 39.12x | n/a | 53 files/s |

<details><summary>Notes</summary>

- **Vize**: vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded
- **Oxfmt**: oxfmt --write (Vue-capable Oxc formatter; fresh copy each run) · multi-threaded (self-reports its thread count) — a gap against single-threaded Prettier is partly thread count, not formatter speed
- **Prettier**: prettier --write *.vue (fresh copy each run) · single-threaded by design

</details>

<details><summary>Methodology</summary>

- Each invocation receives a fresh copy of the same Vue SFC corpus (formatters rewrite files).
- .prettierrc.json is copied into every work copy so Prettier's config actually resolves (config left in the fixture root is not on the work dir's lookup path).
- All three formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.
- Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.
- Prettier, Oxfmt, and Vize all claim Vue SFC support; rule/option parity is not guaranteed.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize**: 96.9 ms, 96.3 ms, 98.4 ms, 95.7 ms, 94.7 ms
- **Oxfmt**: 2.94 s, 2.92 s, 2.99 s, 3.00 s, 3.02 s
- **Prettier**: 3.76 s, 3.79 s, 3.76 s, 3.79 s, 3.77 s

</details>

### Lint

Files: **200** · Bytes: **285,701**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **58.8 ms** | 56.0 ms | 2.4 ms | 4.1% | 1.00x | n/a | 3.4k files/s |
| Vize lint (1T) | **76.5 ms** | 76.3 ms | 2.0 ms | 2.7% | 1.30x | n/a | 2.6k files/s |
| Verter host lint | **160.6 ms** | 151.4 ms | 4.4 ms | 2.8% | 2.73x | n/a | 1.2k files/s |
| eslint-plugin-vue (1T) | **1.62 s** | 1.51 s | 84.5 ms | 5.2% | 27.54x | n/a | 123 files/s |
| eslint-plugin-vue (CLI) | **2.86 s** | 2.86 s | 13.8 ms | 0.5% | 48.67x | n/a | 70 files/s |
| eslint-plugin-vue (4 workers) | **3.32 s** | 3.28 s | 42.4 ms | 1.3% | 56.33x | n/a | 60 files/s |

<details><summary>Notes</summary>

- **Vize lint (max threads)**: vize lint . using default Rayon pool (all cores)
- **Vize lint (1T)**: vize lint . with RAYON_NUM_THREADS=1
- **Verter host lint**: VerterHost.upsert + lint(canonicalId) for each file (if API available)
- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles
- **eslint-plugin-vue (CLI)**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs
- **eslint-plugin-vue (4 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker)

</details>

<details><summary>Methodology</summary>

- Every tool lints an identical isolated copy of the corpus (work/lint/…), so tools that take an explicit file list and tools that walk a directory see exactly the same files.
- In-process and CLI rows share the table; the row label says which mode ran. A CLI pays process startup on every run (~85ms measured for a native CLI); an in-process API pays it once — read same-mode rows against each other. eslint runs in BOTH modes and is the reference point between them.
- No single invocation mode covers every tool — vize lint is CLI-only, VerterHost.lint is in-process-only — which is why the mode is on the row instead of one mode being dropped.
- eslint-plugin-vue uses flat recommended config generated with fixtures.
- Vize lint 1T and max-threads are separate rows — a thread-count gap is not a linter gap.
- Planted-bug work gate: each tool must report vue/no-v-html (or equivalent) or is unranked.
- Allow non-zero exit (style diagnostics do not abort timing).
- Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize lint (max threads)**: 56.0 ms, 58.6 ms, 58.8 ms, 59.7 ms, 62.7 ms
- **Vize lint (1T)**: 76.5 ms, 76.4 ms, 76.3 ms, 81.0 ms, 77.2 ms
- **Verter host lint**: 160.6 ms, 151.4 ms, 161.6 ms, 162.5 ms, 159.0 ms
- **eslint-plugin-vue (1T)**: 1.73 s, 1.66 s, 1.58 s, 1.62 s, 1.51 s
- **eslint-plugin-vue (CLI)**: 2.89 s, 2.86 s, 2.86 s, 2.88 s, 2.86 s
- **eslint-plugin-vue (4 workers)**: 3.28 s, 3.40 s, 3.32 s, 3.32 s, 3.31 s

</details>

### Component-meta

Files: **100** · Bytes: **142,771**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Meta members | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | **526.0 ms** | 507.9 ms | 12.7 ms | 2.4% | 1.00x | 88 | 190 files/s |
| vue-component-meta | **925.0 ms** | 893.3 ms | 176.0 ms | 19.0% ⚠ | 1.76x | 1,343 | 108 files/s |
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

- **@verter/component-meta**: 521.6 ms, 507.9 ms, 526.0 ms, 532.8 ms, 541.9 ms
- **vue-component-meta**: 1.31 s, 981.9 ms, 925.0 ms, 897.2 ms, 893.3 ms

</details>

### LSP (editor language server)

Files: **1** · Bytes: **745**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **337.1 ms** | 273.8 ms | 34.0 ms | 10.1% ⚠ | 1.00x | 113 | 3 files/s |
| Volar (N) | **1.03 s** | 1.01 s | 10.9 ms | 1.1% | 3.04x | 114 | 1 files/s |
| Volar (JS) | **1.07 s** | 1.07 s | 6.3 ms | 0.6% | 3.19x | 114 | 1 files/s |
| Vize ⚠ | (220.4 ms) | (179.8 ms) | – | – | not ranked | (473) | – |

<details><summary>Notes</summary>

- **Verter**: verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | init=4ms · ready=27ms · open→hover=346ms · hoverCold=17ms · hoverWarm=1ms · completion=1ms · definition=2ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (N)**: Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.6.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 | init=498ms · ready=n/a · open→hover=1025ms · hoverCold=3ms · hoverWarm=3ms · completion=23ms · definition=5ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (JS)**: Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. | engine: TypeScript 5.9.3 (JS) | init=555ms · ready=n/a · open→hover=1073ms · hoverCold=37ms · hoverWarm=3ms · completion=18ms · definition=9ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Vize ⚠**: vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.1/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. | engine: tsgo 7.0.0-dev.20260602.1 (nightly) | init=31ms · ready=n/a · open→hover=180ms · hoverCold=1ms · hoverWarm=2ms · completion=1ms · definition=1ms | ⚠ FAILED VALIDATION (template hover) — template hover returned Ref<...> — that is the <script setup> type leaking into template context; refs auto-unwrap inside {{ }}, so the correct answer is `string`. Sample: "**benchMarker**\n\n_Template binding from script_\n\n```typescript\nbenchMarker: Ref<string>\n```\n\nReactive reference created "

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

- **Verter**: 362.6 ms, 320.6 ms, 337.1 ms, 273.8 ms, 346.3 ms
- **Volar (N)**: 1.03 s, 1.02 s, 1.01 s, 1.04 s, 1.03 s
- **Volar (JS)**: 1.09 s, 1.08 s, 1.07 s, 1.07 s, 1.07 s
- **Vize**: 232.5 ms, 222.2 ms, 220.4 ms, 214.3 ms, 179.8 ms

</details>

#### Ubuntu/Linux · cache-demo (not ranking)

<!-- source: bench-Linux-200-repeated-cache-demo.md -->

## Benchmark Results

- **Generated:** 2026-07-27T17:27:45.412Z
- **Fixture:** `fixtures/200-repeated` (200 SFCs)
- **Runs / warmups:** 2 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
- **Node:** v22.23.1
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/30288994570

### Tool versions

| Package | Version |
| --- | --- |
| vue | 3.5.40 |
| @vue/compiler-sfc | 3.5.40 |
| @vue/compiler-sfc-36 | 3.6.0-rc.2 |
| vize | 0.291.0 |
| @vizejs/native | 0.291.0 |
| @verter/native | 0.0.1-beta.3 |
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
| typescript | 5.9.3 |
| cli:vize | 0.291.0 |
| cli:vue-tsc | 5.9.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.61.0 |
| vue-jsx-vapor | 3.2.19 |
| @vue-jsx-vapor/compiler-rs | 3.2.19 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

### Methodology notes

- Primary ranking metric is the **median of measured runs**. Every measured run is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1).
- There is **no cold column**. An unwarmed first run costs a JS compiler ~3.2x its steady state and a native compiler nothing, so ranking on it measures V8 warmup rather than the tool.
- Min / stddev / CV% are reported per row. CV% > 10 is flagged ⚠ — treat that row as noisy (thermal drift or a contended runner), not as a result.
- Each surface is ONE table. Engine, invocation and threading are row properties, not table splits: a CLI pays process startup on every run (~85ms measured for one native CLI) while an in-process API amortises it, and a thread pool is not a single thread — the row's label and notes say which mode it ran, so compare like with like.
- Surfaces are independent: compile ms is not comparable to jsx-compile/typecheck/lint/format ms.
- jsx-compile uses fixtures/jsx-N (.jsx); SFC compile uses fixtures/N (.vue).
- Compile matrix cells (VDOM/Vapor × production/development × sourcemap on/off) are independent.
- Source map is an explicit, independent dimension applied identically to every compiler — it is never folded into the production/development flag for some tools and not others.
- Primary compile corpus is unique file contents (fixtures/N).
- Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.
- Tool order is **rotated** on every warmup and measured run, so no tool is pinned to the expensive first slot.
- CI does not drop OS page cache; later tools in a job may share a warmer file cache.
- Typecheck/lint tools that fail a planted-bug work gate are unranked (skipped). Typecheck gates require both a script-level and a template-level diagnostic, and are re-verified against the full timed corpus.
- Compile measures assert non-empty codegen where applicable.
- Vue official compiler is 1T only (worker_threads variants removed).
- LSP: every server resolves from its installed npm package and is skipped when absent — no local-build or working-copy discovery, so each row names a version.
- verter-tsc needs stable tsgo (typescript@7.0.x via typescript-go); harness sets VERTER_TSGO_BIN.
- Diagnostic/format identity across tools is not required for throughput rows.

### SFC compile (⚠ 199 duplicate bodies — content-hash caches may inflate throughput)

Files: **200** · Bytes: **46,600**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Compile results are **grouped by target × environment × source map**, then by comparison class.

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **4.7 ms** | 4.3 ms | 0.5 ms | 11.6% ⚠ | 1.00x | 107,800 | 42.2k files/s |
| Verter compileMany (session cache) | **8.9 ms** | 8.1 ms | 1.2 ms | 12.9% ⚠ | 1.89x | 140,600 | 22.4k files/s |
| Vize native loop (1T) | **12.7 ms** | 12.6 ms | 0.2 ms | 1.2% | 2.68x | 107,800 | 15.8k files/s |
| @vue/compiler-sfc 3.5 (1T) | **46.9 ms** | 43.9 ms | 4.3 ms | 9.1% | 9.91x | 153,800 | 4.3k files/s |
| @vue/compiler-sfc 3.6 (1T) | **54.1 ms** | 48.0 ms | 8.6 ms | 15.9% ⚠ | 11.42x | 153,800 | 3.7k files/s |
| Verter compileMany (stateless) | **111.5 ms** | 110.2 ms | 1.8 ms | 1.6% | 23.55x | 140,600 | 1.8k files/s |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, hmr=none, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 5.1 ms, 4.3 ms
- **Verter compileMany (session cache)**: 9.7 ms, 8.1 ms
- **Vize native loop (1T)**: 12.8 ms, 12.6 ms
- **@vue/compiler-sfc 3.5 (1T)**: 49.9 ms, 43.9 ms
- **@vue/compiler-sfc 3.6 (1T)**: 48.0 ms, 60.2 ms
- **Verter compileMany (stateless)**: 112.8 ms, 110.2 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=repeated: 1/200 unique content SHAs. Vize content-hash caches treat identical bodies as free — primary rankings must use unique fixtures (fixtures/N), not fixtures/N-repeated.
- Same in-memory Vue SFC corpus for every variant (compiler flags differ; sources do not).
- Work measured: parse SFC + compile script (if any) + compile template (if any).
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested identically from every compiler in a cell (Vue: parse+compileScript+codegen sourceMap; Vize: compileSfc sourceMap; Verter: compileProfile sourceMap). It is not folded into the prod/dev flag for some tools and not others.
- Production vs development uses each tool's real semantic knobs only: Vue isProd (hoistStatic + cacheHandlers); Verter isProduction + hmrStrategy.
- ⚠ Vize exposes no isProduction on compileSfc, so its production and development rows perform identical work. Stated rather than substituted with a different knob.
- Vue 3.5 has no Vapor path → skipped for vapor cells (not run as VDOM).
- 1T / batch / batch-cached rows share the table; the mode is in the row label. A batch pool amortises across a thread pool and a cached session reuses prior analysis, so read same-mode rows against each other.
- Verter session mode keeps a persistent host across warmups and runs, so it is ranked as `batch-cached`, apart from cache-free batch rows.
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

> Auto-updated 2026-07-27 from the **Benchmark** workflow (`ide` job — per-operation editor benchmarks).
> Ranked **per operation**, never pooled: `didOpen→diagnostics` and `foldingRange` answer unrelated questions.
> Same-VM rule holds within the job; these numbers are not comparable to the timing tables above.

#### Ubuntu/Linux · ide ops

<!-- source: ide-Linux.md -->

## IDE operation results

- **Generated:** 2026-07-27T17:29:16.508Z
- **Runner:** linux/x64 · Node v22.23.1
- **Runs / warmups:** 3 / 1

### IDE · background

Files: **1** · Bytes: **0**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Semantic tokens (full)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.0 ms | 5.2% | 1.00x | 15 | n/a |
| Volar (N) | **634.6 ms** | 632.6 ms | 8.9 ms | 1.4% | 1228.95x | 48 | n/a |
| Volar (JS) | **754.0 ms** | 724.1 ms | 25.0 ms | 3.3% | 1460.08x | 48 | n/a |
| Verter ⚠ | (124.6 ms) | (37.4 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no tokens at all for this document | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.5 ms, 0.6 ms
- **Volar (N)**: 632.6 ms, 634.6 ms, 649.0 ms
- **Volar (JS)**: 773.9 ms, 724.1 ms, 754.0 ms
- **Verter**: 124.6 ms, 363.4 ms, 37.4 ms

</details>

#### Semantic tokens (delta after edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (1.1 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.7 ms) | (0.4 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1785173034867", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: TypeScript 5.9.3 (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1785173044387", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.0 ms, 1.1 ms, 1.0 ms
- **Volar (N)**: 1.1 ms, 1.1 ms, 1.0 ms
- **Vize**: 0.6 ms, 0.5 ms, 0.4 ms
- **Verter**: 0.7 ms, 1.1 ms, 0.4 ms

</details>

#### Document symbols (outline)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.6 ms** | 0.4 ms | 0.5 ms | 66.8% ⚠ | 1.00x | 12 | n/a |
| Volar (N) | **16.7 ms** | 16.6 ms | 3.6 ms | 19.2% ⚠ | 29.43x | 25 | n/a |
| Volar (JS) | **17.8 ms** | 17.5 ms | 2.8 ms | 14.6% ⚠ | 31.42x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (2) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — outline is missing 7/7 script symbols: heading, nextLabel, threshold, entries, visibleEntries, formatEntry, addEntry | Sample: "2 symbols: template, script setup" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.6 ms, 1.4 ms, 0.4 ms
- **Volar (N)**: 16.7 ms, 16.6 ms, 22.9 ms
- **Volar (JS)**: 17.5 ms, 17.8 ms, 22.5 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Document highlight (caret move)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 0.3 ms | 0.1 ms | 17.9% ⚠ | 1.00x | 4 | n/a |
| Verter | **0.4 ms** | 0.3 ms | 1.9 ms | 133.0% ⚠ | 1.46x | 4 | n/a |
| Volar (JS) | **17.9 ms** | 16.4 ms | 3.0 ms | 16.0% ⚠ | 69.67x | 5 | n/a |
| Volar (N) | **28.4 ms** | 28.2 ms | 0.5 ms | 1.9% | 110.32x | 5 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Verter**: 0.4 ms, 3.6 ms, 0.3 ms
- **Volar (JS)**: 22.2 ms, 17.9 ms, 16.4 ms
- **Volar (N)**: 28.2 ms, 29.2 ms, 28.4 ms

</details>

#### Inlay hints (document range)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 0.5 ms | 0.0 ms | 6.5% | 1.00x | 2 | n/a |
| Volar (JS) | **68.1 ms** | 67.2 ms | 12.2 ms | 16.4% ⚠ | 118.15x | 14 | n/a |
| Volar (N) | **138.7 ms** | 130.3 ms | 4.9 ms | 3.6% | 240.68x | 14 | n/a |
| Verter ⚠ | (0.3 ms) | (0.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.6 ms, 0.5 ms
- **Volar (JS)**: 88.8 ms, 68.1 ms, 67.2 ms
- **Volar (N)**: 138.7 ms, 130.3 ms, 138.8 ms
- **Verter**: 0.3 ms, 4.4 ms, 0.2 ms

</details>

#### Folding ranges

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 23.6% ⚠ | 1.00x | 2 | n/a |
| Verter | **0.3 ms** | 0.2 ms | 0.1 ms | 26.3% ⚠ | 1.64x | 7 | n/a |
| Volar (N) | **21.6 ms** | 21.4 ms | 1.4 ms | 6.3% | 110.44x | 13 | n/a |
| Volar (JS) | **102.8 ms** | 9.0 ms | 58.9 ms | 77.0% ⚠ | 526.07x | 13 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.3 ms, 0.4 ms, 0.2 ms
- **Volar (N)**: 23.9 ms, 21.6 ms, 21.4 ms
- **Volar (JS)**: 102.8 ms, 9.0 ms, 117.6 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · completion

Files: **1** · Bytes: **0**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Completion: script member

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.9 ms** | 0.8 ms | 0.1 ms | 8.4% | 1.00x | 3 | n/a |
| Volar (N) | **3.0 ms** | 2.6 ms | 0.3 ms | 10.2% ⚠ | 3.54x | 3 | n/a |
| Volar (JS) | **5.4 ms** | 2.9 ms | 19.7 ms | 127.3% ⚠ | 6.28x | 3 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — no `quaver` member of the local object in 0 items | Sample: "(empty list)" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.9 ms, 0.9 ms, 0.8 ms
- **Volar (N)**: 2.6 ms, 3.0 ms, 3.2 ms
- **Volar (JS)**: 38.2 ms, 5.4 ms, 2.9 ms
- **Vize**: 0.4 ms, 0.3 ms, 0.3 ms

</details>

#### Completion: component tag <Ch

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **34.3 ms** | 32.2 ms | 1.3 ms | 3.9% | 1.00x | 1,193 | n/a |
| Volar (JS) | **44.2 ms** | 36.9 ms | 38.3 ms | 61.3% ⚠ | 1.29x | 192 | n/a |
| Volar (N) | **60.6 ms** | 59.7 ms | 0.5 ms | 0.9% | 1.76x | 192 | n/a |
| Vize ⚠ | (0.8 ms) | (0.8 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — no `ChildCard` component tag in 42 items | Sample: "[v-if, v-else-if, v-else, v-for, v-on, v-bind, v-model, v-slot, v-show, v-pre, v-once, v-memo, …+30]" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 32.2 ms, 34.7 ms, 34.3 ms
- **Volar (JS)**: 44.2 ms, 36.9 ms, 106.6 ms
- **Volar (N)**: 60.8 ms, 60.6 ms, 59.7 ms
- **Vize**: 0.8 ms, 0.9 ms, 0.8 ms

</details>

#### Completion: prop name <C :

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.0 ms | 7.7% | 1.00x | 4 | n/a |
| Verter | **1.7 ms** | 1.5 ms | 0.7 ms | 32.8% ⚠ | 3.37x | 16 | n/a |
| Volar (N) | **15.2 ms** | 14.8 ms | 0.3 ms | 2.3% | 30.50x | 26 | n/a |
| Volar (JS) | **81.1 ms** | 7.9 ms | 50.9 ms | 78.4% ⚠ | 163.18x | 26 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.6 ms, 0.5 ms
- **Verter**: 2.7 ms, 1.5 ms, 1.7 ms
- **Volar (N)**: 15.5 ms, 15.2 ms, 14.8 ms
- **Volar (JS)**: 105.8 ms, 81.1 ms, 7.9 ms

</details>

#### Completion: event name <C @

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **7.9 ms** | 7.7 ms | 0.3 ms | 4.0% | 1.00x | 25 | n/a |
| Volar (JS) | **9.4 ms** | 8.6 ms | 0.7 ms | 7.2% | 1.19x | 25 | n/a |
| Vize ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | (12) | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — no `quench` declared emit in 12 items | Sample: "[v-on, @, @click, @input, @change, @submit, @keydown, @keyup, @focus, @blur, @mouseenter, @mouseleave]" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 8.3 ms, 7.7 ms, 7.9 ms
- **Volar (JS)**: 9.4 ms, 9.9 ms, 8.6 ms
- **Vize**: 0.5 ms, 0.5 ms, 0.5 ms
- **Verter**: 0.4 ms, 0.3 ms, 0.3 ms

</details>

#### Completion: directive v-

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 0.6 ms | 0.4 ms | 45.3% ⚠ | 1.00x | 15 | n/a |
| Volar (N) | **16.2 ms** | 15.9 ms | 0.3 ms | 2.0% | 28.04x | 498 | n/a |
| Volar (JS) | **25.1 ms** | 22.1 ms | 31.0 ms | 74.8% ⚠ | 43.42x | 498 | n/a |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `v-if` directive in 3 items | Sample: "[style scoped, style, i18n]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.6 ms, 1.2 ms
- **Volar (N)**: 16.5 ms, 15.9 ms, 16.2 ms
- **Volar (JS)**: 77.3 ms, 22.1 ms, 25.1 ms
- **Verter**: 0.5 ms, 0.4 ms, 0.3 ms

</details>

#### Completion: slot name <template #

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 0.3 ms | 0.0 ms | 0.7% | 1.00x | 2 | n/a |
| Vize | **0.9 ms** | 0.8 ms | 0.1 ms | 13.4% ⚠ | 2.83x | 30 | n/a |
| Volar (N) | **14.4 ms** | 13.7 ms | 1.0 ms | 6.8% | 45.64x | 500 | n/a |
| Volar (JS) | **14.7 ms** | 14.2 ms | 2.1 ms | 13.2% ⚠ | 46.30x | 500 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms
- **Vize**: 0.9 ms, 0.8 ms, 1.0 ms
- **Volar (N)**: 15.7 ms, 14.4 ms, 13.7 ms
- **Volar (JS)**: 14.7 ms, 18.0 ms, 14.2 ms

</details>

#### Completion: auto-import

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **30.5 ms** | 29.1 ms | 1.9 ms | 6.1% | 1.00x | 1,018 | n/a |
| Volar (N) | **53.7 ms** | 52.7 ms | 1.4 ms | 2.5% | 1.76x | 1,077 | n/a |
| Vize ⚠ | (0.8 ms) | (0.8 ms) | – | – | not ranked | (44) | – |
| Verter ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import | Sample: "offered: \"computed\" kind=3 detail=\"function computed<T>(getter: () => T): ComputedRef<T>\" ; \"import computed\" kind=9 detail=\"Import computed from Vue\" insertTex" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 30.5 ms, 32.8 ms, 29.1 ms
- **Volar (N)**: 53.7 ms, 55.4 ms, 52.7 ms
- **Vize**: 0.8 ms, 0.8 ms, 0.8 ms
- **Verter**: 0.4 ms, 0.4 ms, 0.4 ms

</details>

#### Resolve: auto-import edit

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **23.9 ms** | 23.3 ms | 0.6 ms | 2.4% | 1.00x | 241 | n/a |
| Volar (JS) | **38.3 ms** | 36.0 ms | 1.5 ms | 4.0% | 1.60x | 241 | n/a |
| Vize ⚠ | (0.3 ms) | (0.2 ms) | – | – | not ranked | (223) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` | Sample: "\"computed\" kind=3 detail=\"function computed<T>(getter: () => T): ComputedRef<T>\"" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 23.3 ms, 23.9 ms, 24.4 ms
- **Volar (JS)**: 36.0 ms, 38.3 ms, 38.8 ms
- **Vize**: 0.3 ms, 0.2 ms, 0.4 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **2.1 ms** | 2.0 ms | 0.1 ms | 6.1% | 1.00x | 25 | n/a |
| Volar (JS) | **2.4 ms** | 2.4 ms | 0.0 ms | 1.2% | 1.16x | 25 | n/a |
| Verter | **4.5 ms** | 4.2 ms | 0.2 ms | 3.6% | 2.13x | 25 | n/a |
| Vize ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — script member completion offered no `quaver` item to resolve (0 items) | Sample: "(empty list)" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 2.0 ms, 2.3 ms, 2.1 ms
- **Volar (JS)**: 2.4 ms, 2.5 ms, 2.4 ms
- **Verter**: 4.5 ms, 4.5 ms, 4.2 ms
- **Vize**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · edit-loop

Files: **1** · Bytes: **0**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### didOpen -> first diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 0 | – |
| Volar (N) | – | – | – | – | – | 0 | – |
| Vize | – | – | – | – | – | 0 | – |
| Verter | – | – | – | – | – | 0 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 1.15 s, min 1.14 s, CV 0.6%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 1.12 s, min 1.11 s, CV 1.2%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | NOT RANKED (informational) — measured 208.5 ms, min 200.5 ms, CV 4.6%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | NOT RANKED (informational) — measured 312.4 ms, min 311.8 ms, CV 0.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.15 s, 1.15 s, 1.14 s
- **Volar (N)**: 1.13 s, 1.11 s, 1.12 s
- **Vize**: 200.5 ms, 208.5 ms, 219.5 ms
- **Verter**: 312.5 ms, 311.8 ms, 312.4 ms

</details>

#### Edit plants type error -> reported

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **150.3 ms** | 125.2 ms | 15.1 ms | 10.6% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **375.2 ms** | 374.0 ms | 1.5 ms | 0.4% | 2.50x | 1 | n/a |
| Volar (N) | **393.7 ms** | 391.8 ms | 1.4 ms | 0.4% | 2.62x | 1 | n/a |
| Verter | **483.7 ms** | 482.1 ms | 7.4 ms | 1.5% | 3.22x | 1 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 152.3 ms, 125.2 ms, 150.3 ms
- **Volar (JS)**: 376.9 ms, 375.2 ms, 374.0 ms
- **Volar (N)**: 391.8 ms, 393.7 ms, 394.6 ms
- **Verter**: 482.1 ms, 483.7 ms, 495.6 ms

</details>

#### Edit fixes it -> diagnostic clears

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **127.6 ms** | 126.6 ms | 2.5 ms | 2.0% | 1.00x | 0 | n/a |
| Volar (N) | **392.7 ms** | 392.3 ms | 0.3 ms | 0.1% | 3.08x | 0 | n/a |
| Volar (JS) | **456.9 ms** | 453.7 ms | 3.2 ms | 0.7% | 3.58x | 0 | n/a |
| Verter | **503.7 ms** | 500.4 ms | 9.6 ms | 1.9% | 3.95x | 0 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 131.3 ms, 127.6 ms, 126.6 ms
- **Volar (N)**: 392.7 ms, 392.8 ms, 392.3 ms
- **Volar (JS)**: 456.9 ms, 453.7 ms, 460.2 ms
- **Verter**: 503.7 ms, 500.4 ms, 518.5 ms

</details>

#### Hover after retype -> NEW type

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **35.8 ms** | 34.7 ms | 1.7 ms | 4.6% | 1.00x | 47 | n/a |
| Volar (JS) | **52.0 ms** | 48.4 ms | 2.6 ms | 5.0% | 1.45x | 47 | n/a |
| Verter | **52.4 ms** | 51.2 ms | 2.1 ms | 4.0% | 1.46x | 40 | n/a |
| Vize | **132.4 ms** | 128.4 ms | 3.8 ms | 2.9% | 3.70x | 320 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 34.7 ms, 38.0 ms, 35.8 ms
- **Volar (JS)**: 52.0 ms, 48.4 ms, 53.4 ms
- **Verter**: 51.2 ms, 55.3 ms, 52.4 ms
- **Vize**: 128.4 ms, 132.4 ms, 136.1 ms

</details>

#### ... same hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **35.8 ms** | 34.7 ms | 1.7 ms | 4.6% | 1.00x | 1 | n/a |
| Volar (JS) | **52.0 ms** | 48.4 ms | 2.6 ms | 5.0% | 1.45x | 1 | n/a |
| Verter | **52.4 ms** | 51.2 ms | 2.1 ms | 4.0% | 1.46x | 1 | n/a |
| Vize | **132.4 ms** | 128.4 ms | 3.8 ms | 2.9% | 3.70x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 34.7 ms, 38.0 ms, 35.8 ms
- **Volar (JS)**: 52.0 ms, 48.4 ms, 53.4 ms
- **Verter**: 51.2 ms, 55.3 ms, 52.4 ms
- **Vize**: 128.4 ms, 132.4 ms, 136.1 ms

</details>

#### Steady state: edits 1-5 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **32.8 ms** | 28.4 ms | 9.7 ms | 26.9% ⚠ | 1.00x | n/a | n/a |
| Volar (JS) | **36.4 ms** | 34.8 ms | 1.4 ms | 3.7% | 1.11x | n/a | n/a |
| Volar (N) | **39.7 ms** | 38.4 ms | 1.0 ms | 2.6% | 1.21x | n/a | n/a |
| Vize ⚠ | (201.0 ms) | (190.9 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — edit #1: hover does not mention `probeValue` at all — payload begins "<<hover request failed: vize: textDocument/hover timed out a" | Sample: "<<hover request failed: vize: textDocument/hover timed out after 8000ms>>" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 47.0 ms, 28.4 ms, 32.8 ms
- **Volar (JS)**: 37.5 ms, 34.8 ms, 36.4 ms
- **Volar (N)**: 38.4 ms, 40.3 ms, 39.7 ms
- **Vize**: 190.9 ms, 8.01 s, 201.0 ms

</details>

#### Steady state: edits 6-10 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **30.8 ms** | 30.7 ms | 2.6 ms | 8.1% | 1.00x | -3 | n/a |
| Volar (JS) | **31.8 ms** | 31.4 ms | 1.0 ms | 3.1% | 1.03x | -6 | n/a |
| Verter | **32.5 ms** | 27.6 ms | 3.1 ms | 10.0% | 1.05x | -19 | n/a |
| Vize ⚠ | (228.1 ms) | (221.9 ms) | – | – | not ranked | (31) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — edit #6: hover does not mention `probeValue` at all — payload begins "<<hover request failed: vize: textDocument/hover timed out a" | Sample: "<<hover request failed: vize: textDocument/hover timed out after 8000ms>>" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 35.3 ms, 30.8 ms, 30.7 ms
- **Volar (JS)**: 31.4 ms, 31.8 ms, 33.3 ms
- **Verter**: 27.6 ms, 33.5 ms, 32.5 ms
- **Vize**: 221.9 ms, 8.01 s, 228.1 ms

</details>

#### Child prop retype -> Parent diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **377.4 ms** | 375.2 ms | 4.3 ms | 1.1% | 1.00x | 1 | n/a |
| Volar (N) | **393.6 ms** | 386.9 ms | 4.1 ms | 1.0% | 1.04x | 1 | n/a |
| Vize ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 1 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 377.4 ms, 375.2 ms, 383.5 ms
- **Volar (N)**: 386.9 ms, 394.3 ms, 393.6 ms
- **Vize**: 4.00 s, 8.00 s, 4.00 s
- **Verter**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Child prop retype -> Parent hover

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **57.3 ms** | 53.5 ms | 6.8 ms | 11.4% ⚠ | 1.00x | 42 | n/a |
| Volar (JS) | **97.4 ms** | 94.8 ms | 1.6 ms | 1.6% | 1.70x | 42 | n/a |
| Vize ⚠ | (135.7 ms) | (127.5 ms) | – | – | not ranked | (239) | – |
| Verter ⚠ | (4.6 ms) | (4.6 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; never caught up) | Sample: "**label**\n\n_Component prop_\n\n```typescript\nlabel: string\n```\n\n**Requirement**\n\nRequired\n\n**Example**\n\n```vue\n<Child label=\"...\" />\n<Child :label=\"value\" />\n```\n" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 431ms) | Sample: "```typescript\n(property) label: string\n```" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 53.5 ms, 57.3 ms, 66.6 ms
- **Volar (JS)**: 97.6 ms, 97.4 ms, 94.8 ms
- **Vize**: 135.7 ms, 8.00 s, 127.5 ms
- **Verter**: 4.6 ms, 4.9 ms, 4.6 ms

</details>

#### ... Parent hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **57.3 ms** | 53.5 ms | 6.8 ms | 11.4% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **97.4 ms** | 94.8 ms | 1.6 ms | 1.6% | 1.70x | 1 | n/a |
| Verter | **432.6 ms** | 430.5 ms | 6.7 ms | 1.5% | 7.56x | 3 | n/a |
| Vize ⚠ | (3.16 s) | (3.16 s) | – | – | not ranked | (16) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — hover never reported `label: number` within 3000ms across 16 attempts — STALE: still reports `label: string` after the edit changed it to `number` | Sample: "**label**\n\n_Component prop_\n\n```typescript\nlabel: string\n```\n\n**Requirement**\n\nRequired\n\n**Example**\n\n```vue\n<Child label=\"...\" />\n<Child :label=\"value\" />\n```\n" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 53.5 ms, 57.3 ms, 66.6 ms
- **Volar (JS)**: 97.6 ms, 97.4 ms, 94.8 ms
- **Verter**: 430.5 ms, 443.0 ms, 432.6 ms
- **Vize**: 3.16 s, 8.00 s, 3.16 s

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- `didOpen -> first diagnostics` is MEASURED BUT NOT RANKED: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. Its median column is empty by design; the measured time is in the row's note and under Raw runs.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · navigation

Files: **1** · Bytes: **0**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Definition: <ChildCard/> tag

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.9 ms** | 0.5 ms | 1.2 ms | 86.4% ⚠ | 1.00x | 1 | n/a |
| Vize | **1.8 ms** | 1.7 ms | 0.1 ms | 3.1% | 1.92x | 1 | n/a |
| Volar (N) | **8.8 ms** | 8.6 ms | 0.3 ms | 3.3% | 9.43x | 1 | n/a |
| Volar (JS) | **190.9 ms** | 183.5 ms | 7.3 ms | 3.8% | 205.18x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.5 ms, 2.8 ms, 0.9 ms
- **Vize**: 1.8 ms, 1.7 ms, 1.8 ms
- **Volar (N)**: 8.6 ms, 8.8 ms, 9.2 ms
- **Volar (JS)**: 183.5 ms, 190.9 ms, 198.1 ms

</details>

#### Definition: imported fn (script)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 0.3 ms | 0.1 ms | 16.6% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **6.8 ms** | 6.8 ms | 0.0 ms | 0.7% | 16.42x | 1 | n/a |
| Volar (N) | **36.1 ms** | 23.4 ms | 8.1 ms | 24.7% ⚠ | 87.58x | 1 | n/a |
| Vize ⚠ | (1.6 ms) | (1.6 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — definition stayed inside Parent.vue — never crossed into helpers.ts | Sample: "parent.vue@8:9" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.4 ms, 0.4 ms
- **Volar (JS)**: 6.8 ms, 6.8 ms, 6.8 ms
- **Volar (N)**: 23.4 ms, 36.1 ms, 38.4 ms
- **Vize**: 5.2 ms, 1.6 ms, 1.6 ms

</details>

#### Type definition: typed binding

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **6.7 ms** | 5.6 ms | 3.2 ms | 39.8% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **16.1 ms** | 15.9 ms | 5.0 ms | 26.6% ⚠ | 2.39x | 1 | n/a |
| Verter | **23.4 ms** | 20.2 ms | 6.8 ms | 26.6% ⚠ | 3.47x | 1 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/typeDefinition: {"code":-32601,"message":"Method not found"} | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 5.6 ms, 11.5 ms, 6.7 ms
- **Volar (JS)**: 24.7 ms, 15.9 ms, 16.1 ms
- **Verter**: 33.3 ms, 20.2 ms, 23.4 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### References: prop -> parent template

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **117.1 ms** | 113.3 ms | 4.2 ms | 3.6% | 1.00x | 4 | n/a |
| Volar (N) | **338.8 ms** | 338.1 ms | 2.0 ms | 0.6% | 2.89x | 4 | n/a |
| Vize ⚠ | (1.4 ms) | (1.0 ms) | – | – | not ranked | (3) | – |
| Verter ⚠ | (97.9 ms) | (79.8 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@2:11 childcard.vue@12:2 childcard.vue@16:38" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 113.3 ms, 121.7 ms, 117.1 ms
- **Volar (N)**: 341.8 ms, 338.1 ms, 338.8 ms
- **Vize**: 1.4 ms, 1.5 ms, 1.0 ms
- **Verter**: 97.9 ms, 79.8 ms, 110.4 ms

</details>

#### Prepare rename: prop

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.3 ms | 0.0 ms | 12.6% ⚠ | 1.00x | n/a | n/a |
| Volar (JS) | **5.1 ms** | 5.1 ms | 0.3 ms | 5.1% | 13.94x | n/a | n/a |
| Volar (N) | **6.1 ms** | 6.0 ms | 0.5 ms | 7.4% | 16.67x | n/a | n/a |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.4 ms, 0.3 ms
- **Volar (JS)**: 5.6 ms, 5.1 ms, 5.1 ms
- **Volar (N)**: 6.1 ms, 6.9 ms, 6.0 ms
- **Verter**: 0.7 ms, 0.3 ms, 0.4 ms

</details>

#### Rename prop (cross-file edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.1 ms** | 3.0 ms | 0.1 ms | 3.5% | 1.00x | 4 | n/a |
| Volar (N) | **4.3 ms** | 3.9 ms | 0.3 ms | 6.8% | 1.39x | 4 | n/a |
| Vize ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (3) | – |
| Verter ⚠ | (1.4 ms) | (1.3 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:3 :: []" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:3 :: []" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 3.2 ms, 3.1 ms, 3.0 ms
- **Volar (N)**: 4.5 ms, 4.3 ms, 3.9 ms
- **Vize**: 0.4 ms, 2.8 ms, 0.3 ms
- **Verter**: 1.4 ms, 1.3 ms, 1.4 ms

</details>

#### Code action at diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **33.7 ms** | 32.1 ms | 2.7 ms | 7.8% | 1.00x | 2 | n/a |
| Volar (N) | **75.7 ms** | 71.8 ms | 14.5 ms | 17.7% ⚠ | 2.24x | 2 | n/a |
| Vize ⚠ | (0.6 ms) | (0.5 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.6 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 37.4 ms, 32.1 ms, 33.7 ms
- **Volar (N)**: 98.7 ms, 75.7 ms, 71.8 ms
- **Vize**: 2.8 ms, 0.6 ms, 0.5 ms
- **Verter**: 0.6 ms, 0.8 ms, 0.5 ms

</details>

#### Signature help after `(`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **15.4 ms** | 15.3 ms | 0.1 ms | 0.9% | 1.00x | 1 | n/a |
| Volar (N) | **30.6 ms** | 30.3 ms | 0.2 ms | 0.6% | 1.98x | 1 | n/a |
| Vize ⚠ | (221.7 ms) | (219.2 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (5.3 ms) | (5.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/signatureHelp: {"code":-32601,"message":"Method not found"} | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 15.4 ms, 15.6 ms, 15.3 ms
- **Volar (N)**: 30.6 ms, 30.3 ms, 30.6 ms
- **Vize**: 244.5 ms, 219.2 ms, 221.7 ms
- **Verter**: 5.8 ms, 5.2 ms, 5.3 ms

</details>

#### Format unformatted SFC

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 0.6 ms | 0.3 ms | 35.6% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **60.0 ms** | 59.6 ms | 2.2 ms | 3.7% | 97.51x | 1 | n/a |
| Volar (JS) | **61.8 ms** | 59.5 ms | 1.4 ms | 2.3% | 100.50x | 1 | n/a |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 1.1 ms, 0.6 ms
- **Volar (N)**: 59.6 ms, 63.7 ms, 60.0 ms
- **Volar (JS)**: 59.5 ms, 61.8 ms, 62.0 ms
- **Verter**: 0.2 ms, 0.3 ms, 0.2 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · smoke

Files: **1** · Bytes: **0**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Hover (script setup)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **248.6 ms** | 238.2 ms | 6.1 ms | 2.5% | 1.00x | 89 | n/a |
| Volar (JS) | **1.10 s** | 1.09 s | 10.9 ms | 1.0% | 4.41x | 90 | n/a |
| Volar (N) | **1.11 s** | 1.09 s | 16.5 ms | 1.5% | 4.45x | 90 | n/a |
| Vize ⚠ | (217.1 ms) | (212.6 ms) | – | – | not ranked | (458) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — unranked because the paired probe failed (hover-template) — a hover that is right in one context and wrong in the other is not a comparable measurement | Sample: "**marker**\n\n_Script binding_\n\n```typescript\nmarker: Ref<string>\n```\n\nReactive reference created with `ref()`. Access `.value` in script, auto-unwrapped in templ" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 238.2 ms, 248.8 ms, 248.6 ms
- **Volar (JS)**: 1.10 s, 1.09 s, 1.11 s
- **Volar (N)**: 1.11 s, 1.09 s, 1.12 s
- **Vize**: 212.6 ms, 218.9 ms, 217.1 ms

</details>

#### Hover (template interpolation)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.1 ms** | 1.0 ms | 0.1 ms | 9.2% | 1.00x | 74 | n/a |
| Volar (N) | **10.8 ms** | 10.4 ms | 1.1 ms | 10.2% ⚠ | 10.17x | 43 | n/a |
| Volar (JS) | **195.1 ms** | 194.7 ms | 0.6 ms | 0.3% | 183.44x | 43 | n/a |
| Vize ⚠ | (0.8 ms) | (0.7 ms) | – | – | not ranked | (344) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — returned Ref<...> — script type leaked into template context | Sample: "**marker**\n\n_Template binding from script_\n\n```typescript\nmarker: Ref<string>\n```\n\nReactive reference created with `ref()`. Access `.value` in script, auto-unwr" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 1.2 ms, 1.1 ms, 1.0 ms
- **Volar (N)**: 10.8 ms, 10.4 ms, 12.6 ms
- **Volar (JS)**: 195.9 ms, 194.7 ms, 195.1 ms
- **Vize**: 0.7 ms, 0.8 ms, 0.8 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Typing loop (composite)

Files: **1** · Bytes: **0**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **432.5 ms** | 432.5 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (JS) | **432.6 ms** | 432.6 ms | n/a | n/a | 1.00x | n/a | n/a |
| Verter | **536.9 ms** | 536.9 ms | n/a | n/a | 1.24x | n/a | n/a |
| Vize ⚠ | (283.0 ms) | (283.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: all components verified · edit → diagnostic=394ms · hover after edit=36ms · completion=3ms
- **Volar (JS)**: all components verified · edit → diagnostic=375ms · hover after edit=52ms · completion=5ms
- **Verter**: all components verified · edit → diagnostic=484ms · hover after edit=52ms · completion=1ms
- **Vize ⚠**: ⚠ FAILED VALIDATION — 1 of 3 components failed their gate (completion); the sum is shown for reference only. edit → diagnostic=150ms · hover after edit=132ms · completion=0ms ✗

</details>

<details><summary>Methodology</summary>

- Sum of three medians: edit-loop/diagnostics-error + edit-loop/hover-after-edit + completion/completion-script-member.
- Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.
- A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.
- Servers that failed a component are shown in brackets with the failing part named.
- Composites share one table across TypeScript engines with (JS)-tagged rows, exactly as the per-operation tables do — a JS-engine composite against a tsgo composite is an engine comparison, not a server comparison.

Raw runs:


</details>

#### Ubuntu/Linux · ide ops

<!-- source: ide-scale-Linux.md -->

## IDE operation results

- **Generated:** 2026-07-27T17:27:59.790Z
- **Runner:** linux/x64 · Node v22.23.1
- **Runs / warmups:** 1 / 1

### IDE · scale

Files: **1** · Bytes: **0**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Time-to-usable @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **234.2 ms** | 234.2 ms | n/a | n/a | 1.00x | 21 | n/a |
| Volar (N) | **1.88 s** | 1.88 s | n/a | n/a | 8.02x | 21 | n/a |
| Volar (JS) | **1.95 s** | 1.95 s | n/a | n/a | 8.34x | 21 | n/a |
| Vize ⚠ | (30.06 s) | (30.06 s) | – | – | not ranked | (21) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — no correct hover within 30000 ms (197 attempts): scaleProbeTally is not a number — sharedCount() from ./shared did not resolve, so this type was guessed, not computed | Sample: "**scaleProbeTally**\n\n_Script binding_\n\n```typescript\nscaleProbeTally: Ref<string>\n```\n\nReactive reference created with `ref()`. Access `.value` in script, auto-" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 234.2 ms
- **Volar (N)**: 1.88 s
- **Volar (JS)**: 1.95 s
- **Vize**: 30.06 s

</details>

#### Completion @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.4 ms** | 1.4 ms | n/a | n/a | 1.00x | 7 | n/a |
| Verter | **138.0 ms** | 138.0 ms | n/a | n/a | 101.20x | 7 | n/a |
| Volar (JS) | **209.3 ms** | 209.3 ms | n/a | n/a | 153.50x | 276 | n/a |
| Volar (N) | **420.3 ms** | 420.3 ms | n/a | n/a | 308.16x | 276 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.4 ms
- **Verter**: 138.0 ms
- **Volar (JS)**: 209.3 ms
- **Volar (N)**: 420.3 ms

</details>

#### References @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **453.1 ms** | 453.1 ms | n/a | n/a | 1.00x | 22 | n/a |
| Volar (N) | **623.7 ms** | 623.7 ms | n/a | n/a | 1.38x | 22 | n/a |
| Vize ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (38.3 ms) | (38.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — all 3 references are in a single file — no cross-file search happened | Sample: "3 refs / 1 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — no reference provider replied | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 453.1 ms
- **Volar (N)**: 623.7 ms
- **Vize**: 0.7 ms
- **Verter**: 38.3 ms

</details>

#### Hover warm @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.8 ms | n/a | n/a | 1.00x | 130 | n/a |
| Volar (N) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.73x | 131 | n/a |
| Volar (JS) | **1.5 ms** | 1.5 ms | n/a | n/a | 1.92x | 131 | n/a |
| Vize ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (485) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — 5/5 repeats failed the gate — scaleProbeTally is not a number — sharedCount() from ./shared did not resolve, so this type was guessed, not computed | Sample: "**scaleProbeTally**\n\n_Script binding_\n\n```typescript\nscaleProbeTally: Ref<string>\n```\n\nReactive reference created with `ref()`. Access `.value` in script, auto-" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.8 ms
- **Volar (N)**: 1.3 ms
- **Volar (JS)**: 1.5 ms
- **Vize**: 0.7 ms

</details>

#### Time-to-usable @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **345.6 ms** | 345.6 ms | n/a | n/a | 1.00x | 101 | n/a |
| Volar (JS) | **2.16 s** | 2.16 s | n/a | n/a | 6.25x | 101 | n/a |
| Volar (N) | **2.17 s** | 2.17 s | n/a | n/a | 6.28x | 101 | n/a |
| Vize ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 100. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 345.6 ms
- **Volar (JS)**: 2.16 s
- **Volar (N)**: 2.17 s

</details>

#### Completion @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **135.2 ms** | 135.2 ms | n/a | n/a | 1.00x | 7 | n/a |
| Volar (JS) | **226.1 ms** | 226.1 ms | n/a | n/a | 1.67x | 356 | n/a |
| Volar (N) | **466.6 ms** | 466.6 ms | n/a | n/a | 3.45x | 356 | n/a |
| Vize ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 100. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 135.2 ms
- **Volar (JS)**: 226.1 ms
- **Volar (N)**: 466.6 ms

</details>

#### References @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **1.22 s** | 1.22 s | n/a | n/a | 1.00x | 102 | n/a |
| Volar (N) | **2.77 s** | 2.77 s | n/a | n/a | 2.27x | 102 | n/a |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 100. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — no reference provider replied | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.22 s
- **Volar (N)**: 2.77 s
- **Verter**: 0.6 ms

</details>

#### Hover warm @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.8 ms | n/a | n/a | 1.00x | 130 | n/a |
| Volar (JS) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.67x | 131 | n/a |
| Volar (N) | **1.4 ms** | 1.4 ms | n/a | n/a | 1.76x | 131 | n/a |
| Vize ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 100. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.8 ms
- **Volar (JS)**: 1.3 ms
- **Volar (N)**: 1.4 ms

</details>

#### Time-to-usable @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **395.4 ms** | 395.4 ms | n/a | n/a | 1.00x | 501 | n/a |
| Volar (JS) | **3.09 s** | 3.09 s | n/a | n/a | 7.81x | 501 | n/a |
| Volar (N) | **3.59 s** | 3.59 s | n/a | n/a | 9.07x | 501 | n/a |
| Vize ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 500. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 395.4 ms
- **Volar (JS)**: 3.09 s
- **Volar (N)**: 3.59 s

</details>

#### Completion @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **137.8 ms** | 137.8 ms | n/a | n/a | 1.00x | 7 | n/a |
| Volar (JS) | **249.0 ms** | 249.0 ms | n/a | n/a | 1.81x | 756 | n/a |
| Volar (N) | **665.3 ms** | 665.3 ms | n/a | n/a | 4.83x | 756 | n/a |
| Vize ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 500. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 137.8 ms
- **Volar (JS)**: 249.0 ms
- **Volar (N)**: 665.3 ms

</details>

#### References @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **15.37 s** | 15.37 s | n/a | n/a | 1.00x | 502 | n/a |
| Volar (N) | **51.13 s** | 51.13 s | n/a | n/a | 3.33x | 502 | n/a |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 500. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — no reference provider replied | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 15.37 s
- **Volar (N)**: 51.13 s
- **Verter**: 0.7 ms

</details>

#### Hover warm @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.0 ms** | 1.0 ms | n/a | n/a | 1.00x | 130 | n/a |
| Volar (N) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.37x | 131 | n/a |
| Volar (JS) | **1.5 ms** | 1.5 ms | n/a | n/a | 1.51x | 131 | n/a |
| Vize ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 5.9.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 500. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 1.0 ms
- **Volar (N)**: 1.3 ms
- **Volar (JS)**: 1.5 ms

</details>

#### Scale × time-to-usable 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.58 | – |
| Volar (N) | – | – | – | – | – | 1.91 | – |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter | – | – | – | – | – | 1.69 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.58 (1952.2 ms → 3089.7 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.91 (1878.2 ms → 3587.5 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see usable@20) | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | scale factor ×1.69 (234.2 ms → 395.4 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × completion 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.19 | – |
| Volar (N) | – | – | – | – | – | 1.58 | – |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter | – | – | – | – | – | 1 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.19 (209.3 ms → 249.0 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.58 (420.3 ms → 665.3 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 500 files (see completion@500) | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | scale factor ×1 (138.0 ms → 137.8 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × references 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 33.93 | – |
| Volar (N) | – | – | – | – | – | 81.98 | – |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×33.93 (453.1 ms → 15372.9 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | scale factor ×81.98 (623.7 ms → 51131.8 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × hover warm 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1 | – |
| Volar (N) | – | – | – | – | – | 1.01 | – |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter | – | – | – | – | – | 1.27 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1 (1.5 ms → 1.5 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 5.9.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.01 (1.3 ms → 1.3 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see hover-warm@20) | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | scale factor ×1.27 (0.8 ms → 1.0 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows whose value is a RATIO (`Scale × …`) have an empty median by design: the measurement is a factor, not a duration, and it is printed in the artifact column with the pair it came from. A ratio row is never given an invented time so that it can be ranked.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Typing loop (composite)

Files: **1** · Bytes: **0**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.

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
