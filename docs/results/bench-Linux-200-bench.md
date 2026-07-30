# Ubuntu/Linux · bench

> Full report for `bench-Linux-200-bench.md` — every collapsed block (methodology, gate notes, raw runs) that the
> [README](../../README.md) summary tables link here for. Auto-generated; do not edit.

## Benchmark Results

- **Generated:** 2026-07-29T15:57:12.387Z
- **Fixture:** `fixtures/200` (200 SFCs)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · INTEL(R) XEON(R) PLATINUM 8573C
- **Node:** v22.23.1
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/30467977779

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
- Typecheck/lint/format tools that fail a work gate are unranked (skipped). Typecheck gates require both a script-level and a template-level diagnostic, and are re-verified against the full timed corpus. Lint gates require the planted vue/no-v-html. The format gate requires the tool to actually rewrite the &lt;template> block, so a script-only formatter is not ranked against whole-SFC formatters.
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
| Vize native batch (max threads) | **20.6 ms** | 19.3 ms | 1.3 ms | 6.5% | 1.00x | 609,596 | 9.7k files/s |
| Verter compileMany (session cache) | **30.8 ms** | 29.3 ms | 4.6 ms | 15.0% ⚠ | 1.49x | 541,003 | 6.5k files/s |
| Vize native loop (1T) | **46.8 ms** | 41.3 ms | 3.1 ms | 6.6% | 2.27x | 609,596 | 4.3k files/s |
| Verter compileMany (stateless) | **141.6 ms** | 138.8 ms | 4.6 ms | 3.2% | 6.86x | 541,003 | 1.4k files/s |
| @vue/compiler-sfc 3.5 (1T) | **187.5 ms** | 181.1 ms | 8.3 ms | 4.4% | 9.08x | 670,030 | 1.1k files/s |
| @vue/compiler-sfc 3.6 (1T) | **196.5 ms** | 187.7 ms | 15.3 ms | 7.8% | 9.52x | 670,030 | 1.0k files/s |
| fervid compileSync (1T) ⚠ | (47.4 ms) | (46.5 ms) | – | – | not ranked | (764,880) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (29.9 ms) | (26.2 ms) | – | – | not ranked | (764,880) | – |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, hmr=none, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. ⚠ also compiles &lt;style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles &lt;style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 19.3 ms, 22.8 ms, 20.6 ms, 21.1 ms, 19.9 ms
- **Verter compileMany (session cache)**: 40.5 ms, 32.7 ms, 30.8 ms, 29.6 ms, 29.3 ms
- **Vize native loop (1T)**: 46.8 ms, 46.8 ms, 47.2 ms, 41.3 ms, 41.3 ms
- **Verter compileMany (stateless)**: 138.8 ms, 149.9 ms, 141.6 ms, 139.9 ms, 145.6 ms
- **@vue/compiler-sfc 3.5 (1T)**: 187.5 ms, 201.8 ms, 186.5 ms, 181.1 ms, 196.3 ms
- **@vue/compiler-sfc 3.6 (1T)**: 206.9 ms, 196.5 ms, 187.7 ms, 188.3 ms, 224.3 ms
- **fervid compileSync (1T)**: 48.1 ms, 52.7 ms, 47.4 ms, 46.5 ms, 46.6 ms
- **fervid compileAsync (4-thread libuv pool)**: 29.9 ms, 30.9 ms, 26.2 ms, 29.1 ms, 31.1 ms

</details>

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

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=false, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=false, sourceMap=false, hmr=vite, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=false, sourceMap=false, single-threaded
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=false, sourceMap=false
- **fervid compileSync (1T) ⚠**: compileSync isProduction=false, sourceMap=false, single-threaded. ⚠ also compiles &lt;style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=false, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles &lt;style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 16.4 ms, 15.6 ms, 16.0 ms, 16.5 ms, 15.8 ms
- **Verter compileMany (session cache)**: 33.1 ms, 20.3 ms, 23.9 ms, 27.3 ms, 27.2 ms
- **Vize native loop (1T)**: 40.5 ms, 43.6 ms, 41.6 ms, 42.7 ms, 43.1 ms
- **Verter compileMany (stateless)**: 141.7 ms, 130.7 ms, 129.4 ms, 131.6 ms, 127.7 ms
- **@vue/compiler-sfc 3.5 (1T)**: 162.7 ms, 165.5 ms, 156.8 ms, 152.7 ms, 152.0 ms
- **@vue/compiler-sfc 3.6 (1T)**: 164.3 ms, 164.8 ms, 166.4 ms, 155.1 ms, 155.9 ms
- **fervid compileSync (1T)**: 45.6 ms, 46.1 ms, 46.0 ms, 46.5 ms, 46.7 ms
- **fervid compileAsync (4-thread libuv pool)**: 47.9 ms, 24.1 ms, 26.0 ms, 27.0 ms, 24.3 ms

</details>

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

- **Vize native batch (max threads)**: 16.9 ms, 17.2 ms, 19.0 ms, 17.7 ms, 17.2 ms
- **Verter compileMany (session cache)**: 22.4 ms, 18.5 ms, 24.5 ms, 31.2 ms, 19.1 ms
- **Vize native loop (1T)**: 44.6 ms, 43.8 ms, 43.8 ms, 43.8 ms, 43.4 ms
- **Verter compileMany (stateless)**: 128.2 ms, 126.5 ms, 130.4 ms, 131.8 ms, 131.0 ms
- **@vue/compiler-sfc 3.6 (1T)**: 333.9 ms, 301.5 ms, 302.7 ms, 293.2 ms, 307.9 ms

</details>

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

- **Vize native batch (max threads)**: 16.7 ms, 16.7 ms, 17.0 ms, 16.6 ms, 16.9 ms
- **Verter compileMany (session cache)**: 24.4 ms, 23.3 ms, 16.3 ms, 22.6 ms, 23.0 ms
- **Vize native loop (1T)**: 44.0 ms, 45.9 ms, 45.2 ms, 43.9 ms, 44.2 ms
- **Verter compileMany (stateless)**: 131.3 ms, 133.6 ms, 136.4 ms, 133.7 ms, 134.9 ms
- **@vue/compiler-sfc 3.6 (1T)**: 287.8 ms, 284.3 ms, 280.7 ms, 273.0 ms, 277.6 ms

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
- ⚠ fervid compiles &lt;style> blocks inside compileSync — every other row measures parse + script + template only. fervid's rows do strictly more work per file than the rows they are ranked against; there is no option to disable it.
- ⚠ fervid emits non-fatal HTML-strictness diagnostics (NonVoidHtmlElementStartTagWithTrailingSolidus) on self-closing non-void tags such as &lt;div /> and &lt;MyComp />, which Vue's SFC parser accepts — 44 of them on the 200-file corpus. Verified on this corpus: codegen is still complete and correct for those files, so fervid is gated on codegen actually being produced for every file — the same gate every other compiler here gets — rather than on diagnostic silence. Per-run diagnostic totals are captured in the JSON report's meta samples.
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
| @vue-jsx-vapor/compiler-rs (vapor) | **3.0 ms** | 2.6 ms | 0.2 ms | 7.9% | 1.00x | n/a | 66.0k files/s |
| vue-jsx-vapor/api | **3.2 ms** | 3.1 ms | 0.1 ms | 2.6% | 1.06x | n/a | 62.5k files/s |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (vapor)**: Rust/Oxc transform; default vapor mode (see vuejs/vue-jsx-vapor). Same unique .jsx corpus as other JSX rows.
- **vue-jsx-vapor/api**: transformVueJsxVapor() public API (vapor default).

</details>

##### VDOM — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | **2.3 ms** | 2.2 ms | 0.3 ms | 12.1% ⚠ | 1.00x | n/a | 86.0k files/s |
| @vue/babel-plugin-jsx (Babel VDOM) | **129.2 ms** | 114.5 ms | 16.8 ms | 13.0% ⚠ | 55.57x | n/a | 1.5k files/s |

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

- **@vue-jsx-vapor/compiler-rs (vapor)**: 3.2 ms, 3.0 ms, 3.2 ms, 2.9 ms, 2.6 ms
- **vue-jsx-vapor/api**: 3.3 ms, 3.3 ms, 3.2 ms, 3.1 ms, 3.2 ms
- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: 2.3 ms, 2.6 ms, 2.2 ms, 2.2 ms, 2.9 ms
- **@vue/babel-plugin-jsx (Babel VDOM)**: 154.5 ms, 150.9 ms, 129.2 ms, 128.0 ms, 114.5 ms

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
| Vize | **414.9 ms** | 410.4 ms | 16.2 ms | 3.9% | 1.00x | 0 | 482 files/s |
| verter-tsc | **1.03 s** | 1.01 s | 11.7 ms | 1.1% | 2.48x | 420 | 195 files/s |
| Golar typecheck | **1.48 s** | 1.46 s | 11.1 ms | 0.7% | 3.57x | 0 | 135 files/s |
| Golar (lint+check) | **1.49 s** | 1.48 s | 10.1 ms | 0.7% | 3.59x | 0 | 134 files/s |
| vue-tsc (N) | **2.18 s** | 2.16 s | 16.6 ms | 0.8% | 5.26x | 0 | 92 files/s |
| vue-tsc (JS) | **4.49 s** | 4.47 s | 21.6 ms | 0.5% | 10.83x | 0 | 44 files/s |

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

- **Vize**: 419.4 ms, 410.4 ms, 414.9 ms, 411.0 ms, 449.3 ms
- **verter-tsc**: 1.03 s, 1.03 s, 1.04 s, 1.03 s, 1.01 s
- **Golar typecheck**: 1.47 s, 1.48 s, 1.46 s, 1.49 s, 1.48 s
- **Golar (lint+check)**: 1.48 s, 1.49 s, 1.49 s, 1.50 s, 1.51 s
- **vue-tsc (N)**: 2.19 s, 2.16 s, 2.18 s, 2.20 s, 2.16 s
- **vue-tsc (JS)**: 4.47 s, 4.49 s, 4.48 s, 4.53 s, 4.49 s

</details>

### Format

Files: **200** · Bytes: **285,701**

Tools:

- **Prettier** — prettier --write over a fresh corpus copy; built-in Vue SFC support, single-threaded by design.
- **Oxfmt** — oxfmt --write — Oxc's Vue-capable formatter, multi-threaded.
- **Vize** — vize fmt --write.
- **Biome format** — biome format --write — multi-threaded, but formats the &lt;script> block only; template and style come back byte-identical, so it is unranked on the format surface.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **127.3 ms** | 125.0 ms | 10.5 ms | 8.2% | 1.00x | n/a | 1.6k files/s |
| Oxfmt | **3.04 s** | 3.00 s | 37.2 ms | 1.2% | 23.89x | n/a | 66 files/s |
| Prettier | **3.74 s** | 3.66 s | 38.4 ms | 1.0% | 29.38x | n/a | 53 files/s |
| Biome format ⚠ | (106.3 ms) | (104.8 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded
- **Oxfmt**: oxfmt --write (Vue-capable Oxc formatter; fresh copy each run) · multi-threaded (self-reports its thread count) — a gap against single-threaded Prettier is partly thread count, not formatter speed
- **Prettier**: prettier --write *.vue (fresh copy each run) · single-threaded by design
- **Biome format ⚠**: biome format --write . (fresh copy each run) · multi-threaded (Rayon; honours RAYON_NUM_THREADS) · formats the &lt;script> block ONLY — template and style are returned byte-identical | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking

</details>

<details><summary>Methodology</summary>

- Each invocation receives a fresh copy of the same Vue SFC corpus (formatters rewrite files).
- .prettierrc.json and biome.json are copied into every work copy so each tool's config actually resolves (config left in the fixture root is not on the work dir's lookup path). Both configs set the same indent, width, quote, semicolon and trailing-comma choices.
- All four formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.
- Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.
- Template-rewrite work gate: each formatter is run against a messy SFC and must actually change the &lt;template> block, or it is measured but unranked. Biome fails this gate — it formats the &lt;script> block and returns template and style byte-identical, so its wall clock is not comparable to a whole-SFC formatter's.
- Prettier, Oxfmt, and Vize format the whole SFC; Biome covers the script block only. Rule/option parity is not guaranteed for any of them.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize**: 146.7 ms, 125.0 ms, 127.3 ms, 126.2 ms, 143.6 ms
- **Oxfmt**: 3.06 s, 3.00 s, 3.04 s, 3.00 s, 3.09 s
- **Prettier**: 3.76 s, 3.74 s, 3.71 s, 3.75 s, 3.66 s
- **Biome format**: 107.4 ms, 104.8 ms, 106.3 ms, 106.8 ms, 104.9 ms

</details>

### Lint

Files: **200** · Bytes: **285,701**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Biome lint (max threads)** — biome lint on all cores — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — script block only. The plugin's 31 Vue rules all read &lt;script>; &lt;template> is never parsed, so the planted vue/no-v-html is missed; unranked.
- **Oxlint (max threads)** — oxlint on all cores with its vue plugin enabled — script block only, misses the planted vue/no-v-html; unranked.

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
- Planted-bug work gate: each tool must report vue/no-v-html (or equivalent) or is unranked. Biome and Oxlint both fail it — each lints the &lt;script> block only and has no template rules, so nothing in &lt;template> is examined.
- Oxlint runs with its vue plugin ON (.oxlintrc.json travels with the corpus and with the gate plant): 31 extra rules over its stock 111, all of them &lt;script> rules for SFC option/macro shape. Template syntax is still never parsed, which is why the plant is missed with the plugin's full rule set active.
- Oxlint ships no standalone executable — it is a NAPI addon loaded into a Node process — so its per-run startup is Node's, while vize and biome launch a native binary. All three pay startup every run; it is not the same constant.
- Biome's script-only view also produces false positives on this corpus: variables declared in &lt;script setup> and used only in &lt;template> are reported as unused. Oxlint avoids that by disabling no-unused-vars for .vue entirely — it reports neither the false positive nor a genuinely unused declaration. Neither tool's diagnostics are comparable to the Vue-aware linters'.
- Allow non-zero exit (style diagnostics do not abort timing).
- Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize lint (max threads)**: 62.7 ms, 62.9 ms, 63.8 ms, 61.4 ms, 67.3 ms
- **Vize lint (1T)**: 79.0 ms, 77.1 ms, 75.4 ms, 81.4 ms, 77.4 ms
- **Verter host lint**: 161.2 ms, 153.2 ms, 158.7 ms, 151.1 ms, 154.4 ms
- **eslint-plugin-vue (1T)**: 1.81 s, 1.68 s, 1.59 s, 1.69 s, 1.55 s
- **eslint-plugin-vue (CLI)**: 2.80 s, 2.84 s, 2.84 s, 2.84 s, 2.89 s
- **eslint-plugin-vue (4 workers)**: 3.26 s, 3.30 s, 3.27 s, 3.27 s, 3.29 s
- **Biome lint (1T)**: 331.1 ms, 329.5 ms, 330.1 ms, 337.9 ms, 341.7 ms
- **Biome lint (max threads)**: 169.2 ms, 168.7 ms, 168.6 ms, 167.3 ms, 168.8 ms
- **Oxlint (1T)**: 69.4 ms, 66.8 ms, 66.7 ms, 67.8 ms, 71.6 ms
- **Oxlint (max threads)**: 67.8 ms, 59.8 ms, 63.0 ms, 64.0 ms, 70.2 ms

</details>

### Component-meta

Files: **100** · Bytes: **142,771**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Meta members | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | **513.2 ms** | 497.9 ms | 16.4 ms | 3.2% | 1.00x | 88 | 195 files/s |
| vue-component-meta | **927.6 ms** | 845.0 ms | 174.4 ms | 18.8% ⚠ | 1.81x | 1,343 | 108 files/s |
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

- **@verter/component-meta**: 513.2 ms, 497.9 ms, 541.7 ms, 512.2 ms, 525.0 ms
- **vue-component-meta**: 1.25 s, 1.11 s, 927.6 ms, 879.2 ms, 845.0 ms

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
| Verter | **295.3 ms** | 286.8 ms | 10.7 ms | 3.6% | 1.00x | 113 ⚠ | 3 files/s |
| Vize | **362.4 ms** | 358.6 ms | 5.3 ms | 1.5% | 1.23x | 412 | 3 files/s |
| Volar (N) | **992.9 ms** | 979.4 ms | 8.6 ms | 0.9% | 3.36x | 114 ⚠ | 1 files/s |
| Volar (JS) | **1.02 s** | 1.01 s | 50.2 ms | 4.9% | 3.46x | 114 ⚠ | 1 files/s |

<details><summary>Notes</summary>

- **Verter**: verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | init=4ms · ready=26ms · open→hover=314ms · hoverCold=12ms · hoverWarm=1ms · completion=1ms · definition=1ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) | ⚠ produced 27% of the largest artifact in this class — speed is not comparable
- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.1/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. | engine: tsgo 7.0.0-dev.20260602.1 (nightly) | init=37ms · ready=n/a · open→hover=362ms · hoverCold=7ms · hoverWarm=3ms · completion=1ms · definition=2ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (N)**: Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.6.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 | init=490ms · ready=n/a · open→hover=993ms · hoverCold=4ms · hoverWarm=3ms · completion=20ms · definition=6ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) | ⚠ produced 28% of the largest artifact in this class — speed is not comparable
- **Volar (JS)**: Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. | engine: TypeScript 6.0.3 (JS) | init=484ms · ready=n/a · open→hover=1020ms · hoverCold=37ms · hoverWarm=3ms · completion=18ms · definition=9ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) | ⚠ produced 28% of the largest artifact in this class — speed is not comparable

</details>

<details><summary>Methodology</summary>

- Apples-to-apples: identical workspace, LspTarget.vue, UTF-16 hover position on `const benchMarker`.
- Hover content is gated in TWO places, both required to be ranked: the `<script setup>` position (must return a TypeScript type) and the `{{ benchMarker }}` TEMPLATE position (must return the auto-unwrapped `string`). The template probe is the Vue-specific one — a server can satisfy the script probe by proxying to a TypeScript server, but resolving a ref's unwrapped type inside an interpolation requires actually modelling the template, which is the job a Vue language server exists to do. A payload naming the symbol with no type, or returning the `Ref<...>` script type, fails.
- The template probe runs OUTSIDE every timed window, so it gates ranking without changing what the latency column measures.
- Each measured run starts a fresh language-server process (tool process cold).
- Volar is measured as the two-process product it is in v3: @vue/language-server has no in-process TypeScript language service, so the harness also starts typescript-language-server with @vue/typescript-plugin, syncs the same .vue buffer to both, and asks both for every feature in parallel — Volar is charged the slower half plus both processes' startup and project load. This is the same wiring VS Code and Neovim implement; without it the Vue server returns null for a &lt;script setup> hover by design.
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

- **Verter**: 289.7 ms, 295.3 ms, 286.8 ms, 299.4 ms, 314.0 ms
- **Vize**: 368.9 ms, 358.6 ms, 358.9 ms, 369.4 ms, 362.4 ms
- **Volar (N)**: 992.9 ms, 985.3 ms, 979.4 ms, 1.00 s, 993.2 ms
- **Volar (JS)**: 1.13 s, 1.01 s, 1.01 s, 1.03 s, 1.02 s

</details>
