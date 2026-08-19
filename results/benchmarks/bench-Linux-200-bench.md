## Benchmark Results

- **Generated:** 2026-08-16T09:16:08.702Z
- **Fixture:** `fixtures/200` (200 SFCs)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor
- **Node:** v22.23.2
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/31938354532

### Tool versions

| Package | Version |
| --- | --- |
| vue | 3.5.41 |
| @vue/compiler-sfc | 3.5.41 |
| @vue/compiler-sfc-36 | 3.6.0-rc.4 |
| vize | 0.347.7 |
| @vizejs/native | 0.347.7 |
| @verter/native | 0.0.1-beta.3 |
| @fervid/napi | 0.4.1 |
| verter-tsc | 0.0.1-beta.3 |
| @verter/component-meta | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| verter-mcp | 0.0.1-beta.3 |
| @vue/language-server | 3.3.10 |
| @vue/typescript-plugin | 3.3.10 |
| typescript-language-server | 5.3.0 |
| vue-tsc | 3.3.10 |
| vue-component-meta | 3.3.10 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.6 |
| oxfmt | 0.63.0 |
| oxlint | 1.78.0 |
| @biomejs/biome | 2.5.8 |
| typescript | 6.0.3 |
| cli:vize | 0.347.7 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.63.0 |
| cli:oxlint | 1.78.0 |
| cli:biome | 2.5.8 |
| vue-jsx-vapor | 3.2.21 |
| @vue-jsx-vapor/compiler-rs | 3.2.21 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

### Methodology notes

- Primary ranking metric is the **median of measured runs**. Every measured run is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1).
- There is **no cold column**. An unwarmed first run costs a JS compiler ~3.2x its steady state and a native compiler nothing, so ranking on it measures V8 warmup rather than the tool.
- Min / stddev / CV% are reported per row. CV% > 10 is flagged ⚠ — treat that row as noisy (thermal drift or a contended runner), not as a result. Above CV 50% a row with at least three samples is TOO NOISY TO RANK: bracketed and excluded exactly like a gate failure, baseline included — an unstable series buys more shots at a lucky median, so ranking it rewards instability. A two-run row is never bracketed by the ceiling (its stddev is |a−b|/√2 and there is no third sample to adjudicate); it keeps the ⚠ flag.
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
| Vize native batch (max threads) | **22.8 ms** | 19.6 ms | 2.4 ms | 10.4% ⚠ | 1.00x | 609,596 | 8.8k files/s |
| Verter compileMany (session cache) | **24.6 ms** | 20.7 ms | 3.3 ms | 13.2% ⚠ | 1.08x | 548,989 | 8.1k files/s |
| Vize native loop (1T) | **55.9 ms** | 54.6 ms | 0.7 ms | 1.3% | 2.45x | 609,596 | 3.6k files/s |
| Verter compileMany (stateless) | **124.3 ms** | 118.8 ms | 4.2 ms | 3.4% | 5.45x | 548,989 | 1.6k files/s |
| @vue/compiler-sfc 3.5 (1T) | **177.9 ms** | 173.3 ms | 8.6 ms | 4.8% | 7.79x | 670,030 | 1.1k files/s |
| @vue/compiler-sfc 3.6 (1T) | **182.2 ms** | 179.5 ms | 5.8 ms | 3.2% | 7.98x | 670,030 | 1.1k files/s |
| fervid compileSync (1T) ⚠ | (57.4 ms) | (56.4 ms) | – | – | not ranked | (775,738) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (26.2 ms) | (25.4 ms) | – | – | not ranked | (775,738) | – |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent workspace-backed host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, isTs=true (TS passthrough — the cell's uniform standard; ⓘ Vize's own Vite plugin omits this flag, so a drop-in Vite user gets Vize STRIPPING types on every lang="ts" file — more work than benchmarked here), sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=true, forceJs=false (TS passthrough — the cell's uniform standard, and Verter's own Vite path), sourceMap=false, hmr=none, mode=stateless, analysis=full (the drop-in default — Verter's official plugin sets none, which means full), multi-thread host pool, workspace-backed host (project root as workspace — documented compileMany usage, same provision the fs bridge gives @vue/compiler-sfc) cacheHits≈0
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 25.0 ms, 22.8 ms, 20.2 ms, 24.1 ms, 19.6 ms
- **Verter compileMany (session cache)**: 26.8 ms, 29.0 ms, 20.7 ms, 22.7 ms, 24.6 ms
- **Vize native loop (1T)**: 55.9 ms, 56.6 ms, 55.9 ms, 56.2 ms, 54.6 ms
- **Verter compileMany (stateless)**: 130.2 ms, 124.4 ms, 124.3 ms, 118.8 ms, 121.5 ms
- **@vue/compiler-sfc 3.5 (1T)**: 180.5 ms, 176.3 ms, 177.9 ms, 173.3 ms, 195.3 ms
- **@vue/compiler-sfc 3.6 (1T)**: 183.9 ms, 182.2 ms, 179.5 ms, 180.3 ms, 194.0 ms
- **fervid compileSync (1T)**: 59.0 ms, 57.4 ms, 56.4 ms, 56.7 ms, 58.5 ms
- **fervid compileAsync (4-thread libuv pool)**: 26.1 ms, 26.2 ms, 25.4 ms, 30.4 ms, 28.7 ms

</details>

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

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=false, sourceMap=false, mode=session, analysis=full — persistent workspace-backed host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, isTs=true (TS passthrough — the cell's uniform standard; ⓘ Vize's own Vite plugin omits this flag, so a drop-in Vite user gets Vize STRIPPING types on every lang="ts" file — more work than benchmarked here), sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=false, forceJs=false (TS passthrough — the cell's uniform standard, and Verter's own Vite path), sourceMap=false, hmr=vite, mode=stateless, analysis=full (the drop-in default — Verter's official plugin sets none, which means full), multi-thread host pool, workspace-backed host (project root as workspace — documented compileMany usage, same provision the fs bridge gives @vue/compiler-sfc) cacheHits≈0
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=false, sourceMap=false
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=false, sourceMap=false, single-threaded
- **fervid compileSync (1T) ⚠**: compileSync isProduction=false, sourceMap=false, single-threaded. ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (41:97)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=false, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (41:97)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 24.5 ms, 24.3 ms, 21.9 ms, 24.3 ms, 18.6 ms
- **Verter compileMany (session cache)**: 25.9 ms, 28.8 ms, 24.8 ms, 34.6 ms, 17.8 ms
- **Vize native loop (1T)**: 54.0 ms, 57.9 ms, 55.2 ms, 55.9 ms, 54.6 ms
- **Verter compileMany (stateless)**: 122.6 ms, 136.5 ms, 126.0 ms, 132.2 ms, 117.2 ms
- **@vue/compiler-sfc 3.6 (1T)**: 175.7 ms, 167.1 ms, 171.8 ms, 163.7 ms, 152.8 ms
- **@vue/compiler-sfc 3.5 (1T)**: 168.7 ms, 171.9 ms, 170.6 ms, 158.9 ms, 151.7 ms
- **fervid compileSync (1T)**: 56.9 ms, 57.4 ms, 57.0 ms, 57.1 ms, 57.1 ms
- **fervid compileAsync (4-thread libuv pool)**: 31.1 ms, 30.5 ms, 38.3 ms, 72.6 ms, 25.0 ms

</details>

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

<details><summary>Notes</summary>

- **Verter compileMany (session cache)**: runtime-render forceVapor=true, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent workspace-backed host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=true, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Vize native loop (1T)**: compileSfc vapor=true, isTs=true (TS passthrough — the cell's uniform standard; ⓘ Vize's own Vite plugin omits this flag, so a drop-in Vite user gets Vize STRIPPING types on every lang="ts" file — more work than benchmarked here), sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=true, isProduction=true, forceJs=false (TS passthrough — the cell's uniform standard, and Verter's own Vite path), sourceMap=false, hmr=none, mode=stateless, analysis=full (the drop-in default — Verter's official plugin sets none, which means full), multi-thread host pool, workspace-backed host (project root as workspace — documented compileMany usage, same provision the fs bridge gives @vue/compiler-sfc) cacheHits≈0
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=true, sourceMap=false
- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5.

</details>

<details><summary>Raw runs</summary>

- **Verter compileMany (session cache)**: 19.1 ms, 24.6 ms, 18.3 ms, 28.0 ms, 18.2 ms
- **Vize native batch (max threads)**: 20.1 ms, 19.6 ms, 20.2 ms, 21.0 ms, 19.6 ms
- **Vize native loop (1T)**: 60.1 ms, 56.8 ms, 56.8 ms, 58.6 ms, 57.2 ms
- **Verter compileMany (stateless)**: 117.1 ms, 127.0 ms, 117.1 ms, 120.5 ms, 125.1 ms
- **@vue/compiler-sfc 3.6 (1T)**: 307.9 ms, 312.3 ms, 300.3 ms, 282.7 ms, 297.5 ms

</details>

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

<details><summary>Notes</summary>

- **Verter compileMany (session cache)**: runtime-render forceVapor=true, isProduction=false, sourceMap=false, mode=session, analysis=full — persistent workspace-backed host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=true, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Vize native loop (1T)**: compileSfc vapor=true, isTs=true (TS passthrough — the cell's uniform standard; ⓘ Vize's own Vite plugin omits this flag, so a drop-in Vite user gets Vize STRIPPING types on every lang="ts" file — more work than benchmarked here), sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=true, isProduction=false, forceJs=false (TS passthrough — the cell's uniform standard, and Verter's own Vite path), sourceMap=false, hmr=vite, mode=stateless, analysis=full (the drop-in default — Verter's official plugin sets none, which means full), multi-thread host pool, workspace-backed host (project root as workspace — documented compileMany usage, same provision the fs bridge gives @vue/compiler-sfc) cacheHits≈0
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=false, sourceMap=false
- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5.

</details>

<details><summary>Raw runs</summary>

- **Verter compileMany (session cache)**: 18.8 ms, 19.5 ms, 23.3 ms, 17.5 ms, 26.2 ms
- **Vize native batch (max threads)**: 20.7 ms, 20.2 ms, 19.7 ms, 20.1 ms, 20.7 ms
- **Vize native loop (1T)**: 57.0 ms, 56.6 ms, 57.1 ms, 56.8 ms, 59.2 ms
- **Verter compileMany (stateless)**: 119.5 ms, 120.2 ms, 125.4 ms, 119.2 ms, 121.8 ms
- **@vue/compiler-sfc 3.6 (1T)**: 290.8 ms, 280.0 ms, 373.1 ms, 273.9 ms, 274.3 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=unique: 200/200 unique content SHAs. Vize content-hash caches treat identical bodies as free — primary rankings must use unique fixtures (fixtures/N), not fixtures/N-repeated.
- Same in-memory Vue SFC corpus for every variant (compiler flags differ; sources do not).
- Work measured: parse SFC + compile script (if any) + compile template (if any).
- Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.
- The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.
- ⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested identically from every compiler in a cell (Vue: parse+compileScript+codegen sourceMap; Vize: compileSfc sourceMap; Verter: compileProfile sourceMap; fervid: FervidJsCompilerOptions sourceMap). It is not folded into the prod/dev flag for some tools and not others.
- TypeScript handling is ONE standard for the whole cell: PASSTHROUGH, requested identically from every compiler (Vue and fervid pass annotations through by design; Vize via isTs:true; Verter via forceJs:false, which is also its own Vite path). Two official-integration deviations are disclosed rather than silently mirrored: Vize's own Vite plugin omits isTs and therefore STRIPS types for drop-in users (more work than benchmarked here), and an earlier harness revision set Verter's forceJs:true, charging one challenger transpile work no peer row paid — the flag also selects which Verter codegen path the validity gate judges.
- Verter's analysisLevel is the DROP-IN DEFAULT (full — its official plugin sets none, which means full). 'essential' emits byte-identical output ~6% faster and is available via VERTER_ANALYSIS_LEVEL for study, but a tuned default would be a gift no other tool gets a tuning pass for. Whatever level runs is printed on every Verter row. Verter's devMode follows isProduction here; its official plugin hardcodes devMode:true — a minor deviation, stated.
- Production vs development uses each tool's real semantic knobs only: Vue isProd (hoistStatic + cacheHandlers); Verter isProduction + hmrStrategy; fervid isProduction.
- ⚠ Vize exposes no isProduction on compileSfc, so its production and development rows perform identical work. Stated rather than substituted with a different knob.
- ⚠ fervid compiles <style> blocks inside compileSync — every other row measures parse + script + template only. fervid's rows do strictly more work per file than the rows they are ranked against; there is no option to disable it.
- ⚠ fervid emits non-fatal HTML-strictness diagnostics (NonVoidHtmlElementStartTagWithTrailingSolidus) on self-closing non-void tags such as <div /> and <MyComp />, which Vue's SFC parser accepts — 44 of them on the 200-file corpus. Verified on this corpus: codegen is still complete and correct for those files, so fervid is gated on codegen actually being produced for every file — the same gate every other compiler here gets — rather than on diagnostic silence. Per-run diagnostic totals are captured in the JSON report's meta samples.
- fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).
- fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=4), which is a fixed default of 4 rather than core count. Where the Vize/Verter batch rows scale with cores, that row does not — it is reported, not tuned, because the pool width is fixed before the harness starts.
- 1T / batch / batch-cached rows share the table; the mode is in the row label. A batch pool amortises across a thread pool and a cached session reuses prior analysis, so read same-mode rows against each other.
- Verter session mode keeps a persistent host across warmups and runs, so it is ranked as `batch-cached`, apart from cache-free batch rows.
- Codegen validity gate: every compiler's output is parsed (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.
- The gate runs ONCE PER (target × environment) cell, with that cell's flags. It previously ran once on vdom/production and stamped the verdict onto the Vapor and development cells it had never exercised — Vapor is a different codegen backend and development mode emits different code, so a pass on one is not evidence about the other. Source maps are not a gate dimension: a map is emitted beside the code and cannot change whether the code parses.
- The gate builds each tool's compiler handle inside its own try, so a constructor that throws costs that one tool a `GATE NOT RUN` annotation instead of destroying every row for the corpus.
- @vue/compiler-sfc, Vize and Verter are held to ONE error policy in the timed path: a non-empty `errors` array fails the measure. Vue returns parse and template errors in an array instead of throwing, and discarding them — as an earlier revision did — billed a file Vue could not parse as cheap successful work while the same failure in a challenger produced ❌. fervid is the documented exception and is gated on codegen produced for every file, because its diagnostics include non-fatal HTML strictness warnings Vue's parser does not raise.
- Tool order is rotated on every warmup and measured run; no tool is pinned to first position.
- Ranking metric is the median of measured runs, all taken after >= 1 discarded warmup. No cold column.

</details>

### JSX compile

Files: **200** · Bytes: **38,804**

##### VAPOR — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (vapor) | **3.1 ms** | 2.8 ms | 0.2 ms | 5.3% | 1.00x | n/a | 64.4k files/s |
| vue-jsx-vapor/api | **3.4 ms** | 3.3 ms | 0.1 ms | 2.4% | 1.09x | n/a | 58.9k files/s |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (vapor)**: Rust/Oxc transform; default vapor mode (see vuejs/vue-jsx-vapor). Same unique .jsx corpus as other JSX rows.
- **vue-jsx-vapor/api**: transformVueJsxVapor() public API (vapor default).

</details>

##### VDOM — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | **2.5 ms** | 2.5 ms | 0.1 ms | 4.4% | 1.00x | n/a | 79.0k files/s |
| @vue/babel-plugin-jsx (Babel VDOM) | **117.0 ms** | 115.3 ms | 8.5 ms | 7.3% | 46.24x | n/a | 1.7k files/s |

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

- **@vue-jsx-vapor/compiler-rs (vapor)**: 3.2 ms, 3.1 ms, 3.1 ms, 3.1 ms, 2.8 ms
- **vue-jsx-vapor/api**: 3.5 ms, 3.5 ms, 3.3 ms, 3.4 ms, 3.3 ms
- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: 2.5 ms, 2.8 ms, 2.5 ms, 2.5 ms, 2.6 ms
- **@vue/babel-plugin-jsx (Babel VDOM)**: 134.2 ms, 127.4 ms, 115.4 ms, 117.0 ms, 115.3 ms

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
| verter-tsc | **1.09 s** | 1.07 s | 16.1 ms | 1.5% | 1.00x | 420 | 183 files/s |
| Golar (lint+check) | **1.57 s** | 1.53 s | 24.5 ms | 1.6% | 1.43x | 0 | 128 files/s |
| Golar typecheck | **1.58 s** | 1.55 s | 18.3 ms | 1.2% | 1.45x | 0 | 126 files/s |
| Vize | **1.64 s** | 1.62 s | 22.0 ms | 1.3% | 1.50x | 0 | 122 files/s |
| vue-tsc (N) | **2.27 s** | 2.25 s | 15.1 ms | 0.7% | 2.08x | 0 | 88 files/s |
| vue-tsc (JS) | **4.85 s** | 4.78 s | 44.2 ms | 0.9% | 4.44x | 0 | 41 files/s |

<details><summary>Notes</summary>

- **verter-tsc**: verter-tsc --noEmit -p tsconfig.json · tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **Golar (lint+check)**: golar default mode runs lint then typecheck — not a pure typecheck | engine: typescript-go 7.0.2 | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **Golar typecheck**: golar typecheck (typescript-go + @golar/vue plugin) | engine: typescript-go 7.0.2 | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **Vize**: vize check . --tsconfig tsconfig.json (native + Corsa when available) | engine: tsgo 7.0.0-dev.20260603.1 (nightly) | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
- **vue-tsc (N)**: vue-tsc 3.3.10 with typescript aliased to typescript-native-bridge 6.0.3-bridge.13.tsgo.7.0.2 (TS API 6.0.3 on tsgo 7.0.2, in-process NAPI/FFI) | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2 | gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓
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

- **verter-tsc**: 1.12 s, 1.07 s, 1.08 s, 1.09 s, 1.09 s
- **Golar (lint+check)**: 1.53 s, 1.55 s, 1.57 s, 1.60 s, 1.58 s
- **Golar typecheck**: 1.59 s, 1.58 s, 1.55 s, 1.60 s, 1.58 s
- **Vize**: 1.64 s, 1.68 s, 1.65 s, 1.63 s, 1.62 s
- **vue-tsc (N)**: 2.28 s, 2.26 s, 2.25 s, 2.27 s, 2.29 s
- **vue-tsc (JS)**: 4.78 s, 4.85 s, 4.84 s, 4.90 s, 4.88 s

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
| Vize | **125.9 ms** | 120.6 ms | 2.7 ms | 2.1% | 1.00x | n/a | 1.6k files/s |
| Oxfmt | **3.15 s** | 3.14 s | 48.5 ms | 1.5% | 25.05x | n/a | 63 files/s |
| Prettier | **3.66 s** | 3.59 s | 40.6 ms | 1.1% | 29.07x | n/a | 55 files/s |
| Biome format ⚠ | (119.2 ms) | (118.1 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded | ⓘ file coverage verified: rewrote 200/200 planted corpus files.
- **Oxfmt**: oxfmt --write (fresh copy each run) · .vue files route through oxfmt's BUNDLED PRETTIER fallback in worker threads, not the Rust core (its dist ships Prettier and exposes Prettier's Vue options) — read this row as Prettier-with-workers until oxfmt formats SFCs natively | ⓘ file coverage verified: rewrote 200/200 planted corpus files.
- **Prettier**: prettier --write **/*.vue (fresh copy each run) · single-threaded by design | ⓘ file coverage verified: rewrote 200/200 planted corpus files.
- **Biome format ⚠**: biome format --write . (fresh copy each run) · multi-threaded (Rayon; honours RAYON_NUM_THREADS) · formats the <script> block ONLY — template and style are returned byte-identical | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file-coverage census: rewrote 0 of 200 planted corpus files.

</details>

<details><summary>Methodology</summary>

- Each invocation receives a fresh copy of the same Vue SFC corpus (formatters rewrite files).
- .prettierrc.json and biome.json are copied into every work copy so each tool's config actually resolves (config left in the fixture root is not on the work dir's lookup path). Both configs set the same indent, width, quote, semicolon and trailing-comma choices.
- All four formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.
- Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.
- Oxfmt's .vue path is NOT its Rust core: oxfmt (verified through 0.63) bundles Prettier and routes SFCs through it in worker threads — which is also why its output is byte-identical to Prettier's. Its row measures that pipeline, disclosed in its label notes; Vize is currently the only ranked formatter compiling SFCs natively.
- Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxfmt 0.63+) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in, see zero files, and get unranked for walking reasons rather than formatting ones. A real project root has the boundary; the marker changes no tool's invocation.
- The template-rewrite gate probe lives in a NESTED directory, so a tool invoked non-recursively fails the gate rather than being ranked on an empty match (this exact fault put Prettier at 1.00x on every nested corpus while formatting zero files).
- Template-rewrite work gate: each formatter is run against a messy SFC and must actually change the <template> block, or it is measured but unranked.
- FILE-COVERAGE GATE, untimed, per tool with its exact timed invocation: every corpus file is planted with a mess (trailing spaces, stacked blank lines) that any formatter under the shared configs must undo, and files rewritten are counted by byte comparison — the same method for every tool. A ranked tool that rewrites fewer than every corpus file is measured but UNRANKED: tools walking different file sets are not doing the same job, however similar the clock looks. A walk-invoked tool that also rewrites a config file is disclosed, not gated (one extra tiny file is noise; skipping corpus files is not).
- Prettier, Oxfmt, and Vize format the whole SFC. On the pinned Biome, `biome format --write .` reports .vue files as formatted but applies NO fixes to any block of them (probed: 0 of 50 planted files rewritten, 'No fixes applied') — its bracketed time is a walk-and-parse, which both gates say on the row. Rule/option parity is not guaranteed for any tool.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize**: 126.3 ms, 120.6 ms, 124.2 ms, 125.9 ms, 127.4 ms
- **Oxfmt**: 3.26 s, 3.18 s, 3.15 s, 3.15 s, 3.14 s
- **Prettier**: 3.69 s, 3.64 s, 3.66 s, 3.69 s, 3.59 s
- **Biome format**: 120.4 ms, 119.1 ms, 119.2 ms, 118.1 ms, 123.0 ms

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

<details><summary>Notes</summary>

- **Vize lint (max threads)**: vize lint . using default Rayon pool (all cores) | ⓘ file coverage verified: named 200/200 planted corpus files.
- **Vize lint (1T)**: vize lint . with RAYON_NUM_THREADS=1 | ⓘ file coverage verified: named 200/200 planted corpus files.
- **Verter host lint**: VerterHost.upsert + lint(canonicalId) for each file (if API available) | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk.
- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk.
- **eslint-plugin-vue (CLI)**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs | ⓘ file coverage verified: named 200/200 planted corpus files.
- **eslint-plugin-vue (4 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker) | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk.
- **Biome lint (1T) ⚠**: biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 200/200 planted corpus files.
- **Biome lint (max threads) ⚠**: biome lint . using the default Rayon pool (all cores) · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 200/200 planted corpus files.
- **Oxlint (1T) ⚠**: oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 200/200 planted corpus files.
- **Oxlint (max threads) ⚠**: oxlint . on the default thread pool (all cores), vue plugin enabled · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 200/200 planted corpus files.

</details>

<details><summary>Methodology</summary>

- Every tool lints an identical isolated copy of the corpus (work/lint/…). That tools see the SAME FILES is enforced, not assumed: an untimed FILE-COVERAGE census plants a guaranteed-reportable issue in every corpus file (`debugger` in script, `v-html` in template) and runs each directory-walk tool once — a ranked tool that fails to name every corpus file is measured but UNRANKED. Explicit-list invocations (the eslint API rows, VerterHost) are handed exactly the corpus by construction and say so. Census-only output changes (vize without --quiet, biome --max-diagnostics=none) alter what is printed, never what is linted; a walk tool that also lints a config file beside the corpus is disclosed, not gated.
- Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxlint; oxfmt 0.63+ on the format surface) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in and walk zero files. A real project root has the boundary; the marker changes no tool's invocation.
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

- **Vize lint (max threads)**: 81.2 ms, 81.6 ms, 84.6 ms, 85.0 ms, 82.8 ms
- **Vize lint (1T)**: 98.5 ms, 102.4 ms, 101.8 ms, 120.7 ms, 101.7 ms
- **Verter host lint**: 147.0 ms, 149.6 ms, 152.8 ms, 150.3 ms, 149.7 ms
- **eslint-plugin-vue (1T)**: 1.84 s, 1.75 s, 1.61 s, 1.64 s, 1.66 s
- **eslint-plugin-vue (CLI)**: 3.06 s, 3.06 s, 3.09 s, 3.06 s, 3.09 s
- **eslint-plugin-vue (4 workers)**: 3.36 s, 3.47 s, 3.41 s, 3.50 s, 3.44 s
- **Biome lint (1T)**: 367.8 ms, 361.1 ms, 373.2 ms, 364.7 ms, 364.9 ms
- **Biome lint (max threads)**: 180.7 ms, 186.9 ms, 188.0 ms, 184.1 ms, 189.6 ms
- **Oxlint (1T)**: 81.9 ms, 79.5 ms, 81.0 ms, 83.1 ms, 77.7 ms
- **Oxlint (max threads)**: 73.8 ms, 79.9 ms, 72.9 ms, 81.9 ms, 79.2 ms

</details>

### Component-meta

Files: **100** · Bytes: **142,771**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Meta members | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | **464.5 ms** | 459.8 ms | 17.3 ms | 3.7% | 1.00x | 88 | 215 files/s |
| vue-component-meta | **922.9 ms** | 889.3 ms | 243.8 ms | 26.4% ⚠ | 1.99x | 1,343 | 108 files/s |
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

- **@verter/component-meta**: 459.8 ms, 461.1 ms, 464.5 ms, 481.4 ms, 500.3 ms
- **vue-component-meta**: 1.46 s, 954.9 ms, 902.7 ms, 922.9 ms, 889.3 ms

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
| Verter | **281.9 ms** | 273.2 ms | 6.5 ms | 2.3% | 1.00x | 113 ⚠ | 4 files/s |
| Volar (N) | **414.5 ms** | 411.2 ms | 2.0 ms | 0.5% | 1.47x | 114 ⚠ | 2 files/s |
| Vize | **430.0 ms** | 424.9 ms | 5.8 ms | 1.3% | 1.53x | 341 | 2 files/s |
| Volar (JS) | **1.13 s** | 1.10 s | 17.5 ms | 1.6% | 4.00x | 114 ⚠ | 1 files/s |

<details><summary>Notes</summary>

- **Verter**: verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | init=5ms · ready=36ms · open→hover=291ms · hoverCold=1ms · hoverWarm=1ms · completion=1ms · definition=1ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) | ⚠ produced 33% of the largest artifact in this class — speed is not comparable
- **Volar (N)**: Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.13.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2 | init=549ms · ready=n/a · open→hover=415ms · hoverCold=17ms · hoverWarm=2ms · completion=6ms · definition=4ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) | ⚠ produced 33% of the largest artifact in this class — speed is not comparable
- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.2/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. | engine: tsgo 7.0.0-dev.20260603.1 (nightly) | init=41ms · ready=n/a · open→hover=437ms · hoverCold=12ms · hoverWarm=3ms · completion=7ms · definition=3ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (JS)**: Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. | engine: TypeScript 6.0.3 (JS) | init=554ms · ready=n/a · open→hover=1097ms · hoverCold=8ms · hoverWarm=2ms · completion=18ms · definition=4ms | hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) | ⚠ produced 33% of the largest artifact in this class — speed is not comparable

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

- **Verter**: 283.6 ms, 278.3 ms, 281.9 ms, 273.2 ms, 290.8 ms
- **Volar (N)**: 412.1 ms, 414.5 ms, 415.7 ms, 411.2 ms, 415.1 ms
- **Vize**: 425.8 ms, 437.1 ms, 424.9 ms, 430.0 ms, 436.7 ms
- **Volar (JS)**: 1.13 s, 1.12 s, 1.14 s, 1.13 s, 1.10 s

</details>

