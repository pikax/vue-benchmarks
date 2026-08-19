## Benchmark Results

- **Generated:** 2026-08-16T09:16:12.927Z
- **Fixture:** `fixtures/200-repeated` (200 SFCs)
- **Runs / warmups:** 2 / 1
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

### SFC compile (⚠ 199 duplicate bodies — content-hash caches may inflate throughput)

Files: **200** · Bytes: **46,600**

Compile results are **grouped by target × environment × source map**, then by comparison class.

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

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **fervid compileAsync (4-thread libuv pool)**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence.
- **fervid compileSync (1T)**: compileSync isProduction=true, sourceMap=false, single-threaded. ⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent workspace-backed host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, isTs=true (TS passthrough — the cell's uniform standard; ⓘ Vize's own Vite plugin omits this flag, so a drop-in Vite user gets Vize STRIPPING types on every lang="ts" file — more work than benchmarked here), sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=true, forceJs=false (TS passthrough — the cell's uniform standard, and Verter's own Vite path), sourceMap=false, hmr=none, mode=stateless, analysis=full (the drop-in default — Verter's official plugin sets none, which means full), multi-thread host pool, workspace-backed host (project root as workspace — documented compileMany usage, same provision the fs bridge gives @vue/compiler-sfc) cacheHits≈0

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 6.7 ms, 6.8 ms
- **fervid compileAsync (4-thread libuv pool)**: 8.5 ms, 8.0 ms
- **fervid compileSync (1T)**: 8.7 ms, 8.8 ms
- **Verter compileMany (session cache)**: 10.9 ms, 9.0 ms
- **Vize native loop (1T)**: 15.9 ms, 16.0 ms
- **@vue/compiler-sfc 3.5 (1T)**: 47.4 ms, 49.3 ms
- **@vue/compiler-sfc 3.6 (1T)**: 52.6 ms, 51.5 ms
- **Verter compileMany (stateless)**: 110.4 ms, 97.8 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=repeated: 1/200 unique content SHAs. Vize content-hash caches treat identical bodies as free — primary rankings must use unique fixtures (fixtures/N), not fixtures/N-repeated.
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

