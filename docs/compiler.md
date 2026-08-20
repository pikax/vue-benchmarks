# Compiler

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-08-19T18:37:25.414Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`94f6696`](https://github.com/pikax/vue-benchmarks/commit/94f6696b1c7b6f54928678126b9831febd70b4ff)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/32287835178
- **Source:** `results/benchmarks/bench-Linux-200-bench.json`

## Results

Ranked on the **median of measured runs**. Warm series follow ≥1 discarded warmup and are the Compiler surface's primary ordering and ranking metric. Compiler additionally publishes a separately sampled **Fresh child** column: the first timed row workload after excluded process startup, imports and adapter setup. It is not called Cold and its ratio/noise gate never substitutes for Warm. Every table sorts fastest-first and every ratio column is **vs fastest** — the fastest ranked row is the 1.00x denominator; no tool is pinned as a reference. One table per surface unless that surface declares explicit work-equivalence classes; engine, invocation and threading are row properties, not implicit table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three warm samples is bracketed as TOO NOISY TO RANK, no tool exempted (a two-run spread has no third sample to adjudicate, so it is flagged, not bracketed). Per-row detail is under **Notes** below each table.

> **Peak RSS** on a timing row is the tool's peak resident set: measured in the timed session where the runner samples it (LSP servers, real-world CLIs), otherwise injected from the isolated memory probe below — the probe runs each tool in its own process, separate from timing.

2026-08-20 · `fixtures/200` (200 files) · win32/x64 · source `bench-win32-200.json`

> ⚠ **Local run — not the published Linux CI series** (win32/x64 · **dirty worktree** — not attributable to a single commit). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

### Compiler

Files: **200** · Bytes: **285,701**

**Vue-anchored apples-to-apples compiler results.** Each target/environment/source-map cell contains two candidate-comparison subsections: Raw SFC compilation gives Vue, Vize batch and Verter first-admission the same revised style-free SFC strings; SFC compilation with CSS gives the style-capable entrypoints the same revised style-bearing SFCs and counts both generated JS and CSS. Every measured row publishes Fresh child and Warm separately when both samplers succeed. Ratios never cross these subsections and always use the official Vue workload as 1.00x. A failed semantic gate leaves both measured times visible but unranked.

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

##### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vdom-production-sourcemap-off-o-01u4qka-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-win32-200-compile-vdom-production-sourcemap-off-o-01u4qka.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (1T) | 224.3 ms | 217.5 ms | 7.2 ms | 3.2% | 1.00x | **143.6 ms** | 139.2 ms | 6.1 ms | 4.2% | 1.00x | 735,261 | 1.4k files/s | 64.2 MB |
| @vue/compiler-sfc 3.6 (1T) | 227.0 ms | 212.3 ms | 19.3 ms | 8.5% | 1.01x | **161.5 ms** | 149.1 ms | 15.2 ms | 9.4% | 1.12x | 735,261 | 1.2k files/s | 63.0 MB |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vdom-production-sourcemap-off-r-0ihxvva-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-win32-200-compile-vdom-production-sourcemap-off-r-0ihxvva.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | 235.8 ms | 215.6 ms | 10.0 ms | 4.2% | 1.00x | **146.1 ms** | 135.0 ms | 7.4 ms | 5.1% | 1.00x | 735,061 | 1.4k files/s | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (10.5 ms) | (9.4 ms) | (2.0 ms) | (18.6%) | not ranked | (7.4 ms) | (5.9 ms) | (4.1 ms) | (55.5%) | not ranked | (617,550) | – | (21.4 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (44.9 ms) | (41.0 ms) | (6.9 ms) | (15.3%) | not ranked | (36.4 ms) | (29.5 ms) | (7.8 ms) | (21.4%) | not ranked | (528,623) | – | (67.1 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vdom-production-sourcemap-off-s-1eae7dp-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-win32-200-compile-vdom-production-sourcemap-off-s-1eae7dp.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | 267.2 ms | 243.2 ms | 11.9 ms | 4.5% | 1.00x | **171.0 ms** | 158.5 ms | 11.2 ms | 6.5% | 1.00x | 769,363 | 1.2k files/s | 103.8 MB |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (39.3 ms) | (37.9 ms) | (1.2 ms) | (3.0%) | not ranked | (47.1 ms) | (41.8 ms) | (2.4 ms) | (5.1%) | not ranked | (650,832) | – | (16.7 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (11.9 ms) | (9.7 ms) | (1.8 ms) | (15.3%) | not ranked | (9.3 ms) | (7.1 ms) | (1.5 ms) | (16.6%) | not ranked | (650,832) | – | (21.6 MB) |
| fervid compileSync (1T) ⚠ | (33.5 ms) | (33.4 ms) | (1.2 ms) | (3.6%) | not ranked | (39.1 ms) | (37.6 ms) | (2.4 ms) | (6.1%) | not ranked | (884,932) | – | (15.9 MB) |
| fervid compileAsync (4-thread libuv pool) ⚠ | (12.0 ms) | (10.3 ms) | (1.1 ms) | (8.9%) | not ranked | (13.0 ms) | (12.3 ms) | (1.8 ms) | (13.6%) | not ranked | (884,932) | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (53.0 ms) | (40.6 ms) | (8.9 ms) | (16.7%) | not ranked | (39.0 ms) | (36.9 ms) | (2.2 ms) | (5.7%) | not ranked | (589,604) | – | (68.6 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Fresh child (first timed row workload): 223.2 ms, 217.5 ms, 233.1 ms, 234.6 ms, 224.3 ms · Warm: 152.1 ms, 139.2 ms, 150.6 ms, 143.6 ms, 139.5 ms
- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 241.5 ms, 212.3 ms, 227.0 ms, 213.3 ms, 257.7 ms · Warm: 189.7 ms, 161.5 ms, 157.9 ms, 165.7 ms, 149.1 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Fresh child (first timed row workload): 238.1 ms, 235.8 ms, 223.1 ms, 236.6 ms, 215.6 ms · Warm: 151.7 ms, 146.1 ms, 135.0 ms, 151.7 ms, 139.9 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 9.4 ms, 14.4 ms, 10.5 ms, 10.2 ms, 11.7 ms · Warm: 5.9 ms, 7.0 ms, 7.4 ms, 16.1 ms, 10.4 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 57.2 ms, 42.7 ms, 44.9 ms, 52.4 ms, 41.0 ms · Warm: 46.9 ms, 46.2 ms, 36.4 ms, 33.3 ms, 29.5 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 274.4 ms, 267.7 ms, 265.1 ms, 243.2 ms, 267.2 ms · Warm: 158.5 ms, 181.7 ms, 171.0 ms, 184.8 ms, 164.2 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 39.9 ms, 39.3 ms, 40.7 ms, 37.9 ms, 38.1 ms · Warm: 47.2 ms, 45.7 ms, 41.8 ms, 47.1 ms, 47.6 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 14.5 ms, 12.5 ms, 9.7 ms, 10.6 ms, 11.9 ms · Warm: 9.3 ms, 7.4 ms, 7.1 ms, 10.5 ms, 10.1 ms
- **fervid compileSync (1T)**: Fresh child (first timed row workload): 33.4 ms, 36.2 ms, 33.4 ms, 33.8 ms, 33.5 ms · Warm: 39.1 ms, 37.6 ms, 39.9 ms, 43.6 ms, 38.0 ms
- **fervid compileAsync (4-thread libuv pool)**: Fresh child (first timed row workload): 12.0 ms, 13.2 ms, 10.3 ms, 12.1 ms, 11.2 ms · Warm: 14.4 ms, 12.3 ms, 16.4 ms, 13.0 ms, 12.3 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 53.0 ms, 55.4 ms, 40.6 ms, 62.0 ms, 43.1 ms · Warm: 42.9 ms, 38.6 ms, 40.1 ms, 39.0 ms, 36.9 ms

</details>

#### VDOM · development · sourcemap off

Target: `vdom` · Environment: `development` · Source map: `off`

##### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vdom-development-sourcemap-off--1r7hpiw-dark.svg">
  <img alt="Compiler — VDOM · development · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-win32-200-compile-vdom-development-sourcemap-off--1r7hpiw.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (1T) | 230.8 ms | 214.8 ms | 12.5 ms | 5.4% | 1.00x | **128.0 ms** | 119.6 ms | 10.2 ms | 8.0% | 1.00x | 721,735 | 1.6k files/s |
| @vue/compiler-sfc 3.6 (1T) | 234.2 ms | 205.5 ms | 19.4 ms | 8.3% | 1.01x | **148.5 ms** | 142.8 ms | 17.6 ms | 11.9% ⚠ | 1.16x | 721,735 | 1.3k files/s |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=false, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=false, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vdom-development-sourcemap-off--1g1prb0-dark.svg">
  <img alt="Compiler — VDOM · development · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-win32-200-compile-vdom-development-sourcemap-off--1g1prb0.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | 240.8 ms | 221.2 ms | 15.6 ms | 6.5% | 1.00x | **137.5 ms** | 125.7 ms | 8.1 ms | 5.9% | 1.00x | 721,535 | 1.5k files/s |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (10.9 ms) | (9.4 ms) | (1.4 ms) | (12.5%) | not ranked | (12.3 ms) | (10.5 ms) | (2.4 ms) | (19.2%) | not ranked | (616,270) | – |
| Verter compileMany (first-admission stateless raw render) ⚠ | (46.5 ms) | (42.8 ms) | (5.7 ms) | (12.2%) | not ranked | (33.6 ms) | (29.1 ms) | (5.7 ms) | (16.8%) | not ranked | (687,721) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=false. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/31 passed) — object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-only-sfc [module-load]: compiled module has no default export; +1 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=false, forceJs=false, sourceMap=false, hmr=vite, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (24/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +4 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vdom-development-sourcemap-off--06jinej-dark.svg">
  <img alt="Compiler — VDOM · development · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-win32-200-compile-vdom-development-sourcemap-off--06jinej.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | 260.1 ms | 234.5 ms | 13.0 ms | 5.0% | 1.00x | **152.1 ms** | 146.3 ms | 4.1 ms | 2.7% | 1.00x | 755,837 | 1.3k files/s |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (37.6 ms) | (36.3 ms) | (0.8 ms) | (2.3%) | not ranked | (41.9 ms) | (40.3 ms) | (1.9 ms) | (4.6%) | not ranked | (649,552) | – |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (10.7 ms) | (10.1 ms) | (1.1 ms) | (10.4%) | not ranked | (12.0 ms) | (10.7 ms) | (3.2 ms) | (26.8%) | not ranked | (649,552) | – |
| fervid compileSync (1T) ⚠ | (33.7 ms) | (33.5 ms) | (0.6 ms) | (1.9%) | not ranked | (39.0 ms) | (35.4 ms) | (2.6 ms) | (6.7%) | not ranked | (895,319) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (12.2 ms) | (11.4 ms) | (0.6 ms) | (4.9%) | not ranked | (13.8 ms) | (11.7 ms) | (1.7 ms) | (12.1%) | not ranked | (895,319) | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (52.6 ms) | (47.2 ms) | (8.8 ms) | (16.7%) | not ranked | (37.1 ms) | (29.4 ms) | (10.9 ms) | (29.5%) | not ranked | (749,102) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=false. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/31 passed) — object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-only-sfc [module-load]: compiled module has no default export; +1 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/31 passed) — object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-only-sfc [module-load]: compiled module has no default export; +1 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=false, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (41:97)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (19/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +9 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=false, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (41:97)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (19/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +9 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=false, isProduction=false, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (24/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +4 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Fresh child (first timed row workload): 245.2 ms, 230.8 ms, 217.5 ms, 214.8 ms, 234.5 ms · Warm: 129.9 ms, 128.0 ms, 127.6 ms, 119.6 ms, 147.3 ms
- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 234.2 ms, 246.0 ms, 232.9 ms, 257.8 ms, 205.5 ms · Warm: 155.1 ms, 148.5 ms, 142.8 ms, 185.6 ms, 144.4 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Fresh child (first timed row workload): 221.2 ms, 224.9 ms, 256.3 ms, 251.5 ms, 240.8 ms · Warm: 132.3 ms, 125.7 ms, 137.5 ms, 140.9 ms, 146.8 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 11.7 ms, 9.4 ms, 9.6 ms, 12.6 ms, 10.9 ms · Warm: 10.5 ms, 10.5 ms, 12.3 ms, 15.1 ms, 15.4 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 51.5 ms, 56.1 ms, 43.3 ms, 42.8 ms, 46.5 ms · Warm: 29.1 ms, 33.6 ms, 29.9 ms, 40.2 ms, 41.2 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 234.5 ms, 260.1 ms, 255.6 ms, 265.1 ms, 266.9 ms · Warm: 152.1 ms, 146.3 ms, 151.9 ms, 152.3 ms, 158.1 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 38.1 ms, 36.3 ms, 37.6 ms, 37.6 ms, 38.6 ms · Warm: 41.9 ms, 41.0 ms, 44.5 ms, 40.3 ms, 44.3 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 11.1 ms, 10.7 ms, 10.3 ms, 12.9 ms, 10.1 ms · Warm: 10.7 ms, 11.8 ms, 12.0 ms, 15.8 ms, 18.3 ms
- **fervid compileSync (1T)**: Fresh child (first timed row workload): 33.5 ms, 33.7 ms, 34.3 ms, 35.1 ms, 33.7 ms · Warm: 39.0 ms, 41.4 ms, 35.4 ms, 39.2 ms, 35.4 ms
- **fervid compileAsync (4-thread libuv pool)**: Fresh child (first timed row workload): 11.4 ms, 12.2 ms, 12.7 ms, 12.9 ms, 11.9 ms · Warm: 13.8 ms, 13.3 ms, 14.5 ms, 16.3 ms, 11.7 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 52.6 ms, 69.4 ms, 55.9 ms, 49.4 ms, 47.2 ms · Warm: 29.4 ms, 37.1 ms, 32.4 ms, 38.0 ms, 57.4 ms

</details>

#### VAPOR · production · sourcemap off

Target: `vapor` · Environment: `production` · Source map: `off`

##### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vapor-production-sourcemap-off--1ghmb5o-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-win32-200-compile-vapor-production-sourcemap-off--1ghmb5o.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – | – |
| @vue/compiler-sfc 3.6 (1T) ⚠ | (369.7 ms) | (338.2 ms) | (18.9 ms) | (5.1%) | not ranked | (269.2 ms) | (253.1 ms) | (34.5 ms) | (12.8%) | not ranked | (711,809) | – | (72.0 MB) |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **@vue/compiler-sfc 3.6 (1T) ⚠**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=true, sourceMap=false ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vapor-production-sourcemap-off--0t37urc-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-win32-200-compile-vapor-production-sourcemap-off--0t37urc.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠ | (392.2 ms) | (378.3 ms) | (31.7 ms) | (8.1%) | not ranked | (270.9 ms) | (234.6 ms) | (16.7 ms) | (6.2%) | not ranked | (711,609) | – | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (12.7 ms) | (11.1 ms) | (0.8 ms) | (6.5%) | not ranked | (5.2 ms) | (4.5 ms) | (1.2 ms) | (22.8%) | not ranked | (751,416) | – | (20.9 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (46.7 ms) | (43.9 ms) | (3.5 ms) | (7.4%) | not ranked | (34.5 ms) | (32.7 ms) | (2.6 ms) | (7.5%) | not ranked | (564,944) | – | (65.8 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/31 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; define-emits-payload [runtime]: _setText is not defined; native-v-model-modifiers [runtime]: _setText is not defined; +24 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vapor-production-sourcemap-off--1ej6q9r-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-win32-200-compile-vapor-production-sourcemap-off--1ej6q9r.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠ | (421.8 ms) | (399.0 ms) | (22.0 ms) | (5.2%) | not ranked | (300.2 ms) | (270.9 ms) | (22.7 ms) | (7.5%) | not ranked | (791,235) | – | (114.7 MB) |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (42.9 ms) | (42.1 ms) | (0.8 ms) | (1.9%) | not ranked | (41.3 ms) | (39.5 ms) | (4.5 ms) | (11.0%) | not ranked | (795,274) | – | (15.4 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (13.9 ms) | (12.4 ms) | (1.5 ms) | (10.7%) | not ranked | (5.8 ms) | (5.1 ms) | (1.3 ms) | (22.3%) | not ranked | (795,274) | – | (20.4 MB) |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (50.0 ms) | (44.4 ms) | (4.9 ms) | (9.7%) | not ranked | (43.9 ms) | (39.3 ms) | (4.0 ms) | (9.1%) | not ranked | (625,925) | – | (68.7 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5. ⚠ STYLE CORRECTNESS GATE NOT RUN for @fervid/napi; a render+CSS result without the 16-plant CSS semantics suite is not ranked.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/31 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; define-emits-payload [runtime]: _setText is not defined; native-v-model-modifiers [runtime]: _setText is not defined; +24 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 387.4 ms, 375.5 ms, 356.5 ms, 369.7 ms, 338.2 ms · Warm: 294.4 ms, 264.4 ms, 269.2 ms, 339.6 ms, 253.1 ms
- **Vue compiler-sfc 3.6 reference (raw render, 1T)**: Fresh child (first timed row workload): 401.0 ms, 383.0 ms, 392.2 ms, 456.8 ms, 378.3 ms · Warm: 252.4 ms, 270.9 ms, 272.5 ms, 271.5 ms, 234.6 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 12.9 ms, 11.1 ms, 12.7 ms, 11.8 ms, 13.0 ms · Warm: 4.5 ms, 5.2 ms, 6.5 ms, 7.1 ms, 4.6 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 51.8 ms, 45.8 ms, 51.2 ms, 46.7 ms, 43.9 ms · Warm: 32.7 ms, 33.9 ms, 39.4 ms, 34.5 ms, 36.2 ms
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 409.9 ms, 455.7 ms, 434.0 ms, 399.0 ms, 421.8 ms · Warm: 270.9 ms, 330.4 ms, 300.2 ms, 309.8 ms, 286.2 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 42.1 ms, 42.7 ms, 44.3 ms, 42.9 ms, 43.0 ms · Warm: 39.5 ms, 50.8 ms, 40.8 ms, 41.3 ms, 42.2 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 13.9 ms, 15.1 ms, 13.0 ms, 12.4 ms, 16.0 ms · Warm: 7.7 ms, 5.1 ms, 7.6 ms, 5.8 ms, 5.1 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 44.4 ms, 46.4 ms, 53.8 ms, 56.0 ms, 50.0 ms · Warm: 45.0 ms, 43.9 ms, 49.8 ms, 41.2 ms, 39.3 ms

</details>

#### VAPOR · development · sourcemap off

Target: `vapor` · Environment: `development` · Source map: `off`

##### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vapor-development-sourcemap-off-0knd04u-dark.svg">
  <img alt="Compiler — VAPOR · development · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-win32-200-compile-vapor-development-sourcemap-off-0knd04u.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – |
| @vue/compiler-sfc 3.6 (1T) ⚠ | (374.6 ms) | (359.6 ms) | (29.6 ms) | (7.9%) | not ranked | (249.4 ms) | (222.0 ms) | (30.2 ms) | (12.1%) | not ranked | (713,547) | – |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **@vue/compiler-sfc 3.6 (1T) ⚠**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=false, sourceMap=false ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vapor-development-sourcemap-off-0cp21w2-dark.svg">
  <img alt="Compiler — VAPOR · development · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-win32-200-compile-vapor-development-sourcemap-off-0cp21w2.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠ | (395.2 ms) | (331.2 ms) | (37.0 ms) | (9.4%) | not ranked | (233.1 ms) | (211.8 ms) | (35.5 ms) | (15.2%) | not ranked | (713,347) | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (12.8 ms) | (11.3 ms) | (2.3 ms) | (18.3%) | not ranked | (5.4 ms) | (4.0 ms) | (1.4 ms) | (26.0%) | not ranked | (751,416) | – |
| Verter compileMany (first-admission stateless raw render) ⚠ | (45.4 ms) | (36.5 ms) | (8.8 ms) | (19.5%) | not ranked | (51.7 ms) | (48.5 ms) | (10.5 ms) | (20.3%) | not ranked | (597,282) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=false. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=true, isProduction=false, forceJs=false, sourceMap=false, hmr=vite, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/31 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; define-emits-payload [runtime]: _setText is not defined; native-v-model-modifiers [runtime]: _setText is not defined; +24 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-compile-vapor-development-sourcemap-off-03xaqwx-dark.svg">
  <img alt="Compiler — VAPOR · development · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-win32-200-compile-vapor-development-sourcemap-off-03xaqwx.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠ | (429.0 ms) | (401.0 ms) | (60.2 ms) | (14.0%) | not ranked | (291.5 ms) | (244.8 ms) | (24.3 ms) | (8.4%) | not ranked | (792,973) | – |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (41.6 ms) | (39.9 ms) | (3.0 ms) | (7.3%) | not ranked | (44.9 ms) | (39.4 ms) | (4.1 ms) | (9.0%) | not ranked | (795,274) | – |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (12.3 ms) | (11.0 ms) | (1.1 ms) | (9.2%) | not ranked | (5.1 ms) | (4.8 ms) | (0.6 ms) | (11.6%) | not ranked | (795,274) | – |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (47.2 ms) | (40.5 ms) | (6.1 ms) | (12.9%) | not ranked | (55.8 ms) | (52.9 ms) | (9.8 ms) | (17.6%) | not ranked | (658,263) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=false. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=true, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5. ⚠ STYLE CORRECTNESS GATE NOT RUN for @fervid/napi; a render+CSS result without the 16-plant CSS semantics suite is not ranked.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=true, isProduction=false, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/31 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; define-emits-payload [runtime]: _setText is not defined; native-v-model-modifiers [runtime]: _setText is not defined; +24 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 433.6 ms, 359.6 ms, 374.6 ms, 366.6 ms, 392.2 ms · Warm: 288.1 ms, 222.0 ms, 249.4 ms, 291.1 ms, 241.3 ms
- **Vue compiler-sfc 3.6 reference (raw render, 1T)**: Fresh child (first timed row workload): 428.4 ms, 395.2 ms, 331.2 ms, 388.0 ms, 412.6 ms · Warm: 233.1 ms, 211.8 ms, 216.3 ms, 293.8 ms, 269.3 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 12.8 ms, 14.0 ms, 11.7 ms, 17.1 ms, 11.3 ms · Warm: 5.4 ms, 4.3 ms, 4.0 ms, 7.5 ms, 5.9 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 48.1 ms, 36.5 ms, 58.2 ms, 45.4 ms, 37.5 ms · Warm: 48.5 ms, 49.5 ms, 52.4 ms, 73.7 ms, 51.7 ms
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 482.9 ms, 401.0 ms, 429.0 ms, 542.0 ms, 403.7 ms · Warm: 250.5 ms, 244.8 ms, 291.5 ms, 292.2 ms, 292.2 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 45.6 ms, 46.8 ms, 39.9 ms, 41.6 ms, 41.1 ms · Warm: 39.4 ms, 42.5 ms, 44.9 ms, 50.1 ms, 46.6 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 12.3 ms, 12.6 ms, 11.0 ms, 14.0 ms, 11.6 ms · Warm: 5.1 ms, 4.8 ms, 5.0 ms, 5.9 ms, 6.1 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 54.9 ms, 55.0 ms, 40.5 ms, 47.0 ms, 47.2 ms · Warm: 53.7 ms, 63.9 ms, 55.8 ms, 76.2 ms, 52.9 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=unique: 200/200 unique content SHAs. The exact compileSfcBatchWithResults path measured here does not have Vize's stats-only batch API's duplicate-body grouping, so duplicate bodies are disclosed for corpus representativeness rather than described as output-cache hits.
- Ratio columns are vs fastest — the fastest ranked row in each comparison class is the 1.00x denominator; no tool is pinned as a reference. Vue 3.5 anchors VDOM; Vue 3.6 anchors Vapor because 3.5 has no Vapor backend.
- Rows are split into explicit work-equivalence classes and ratios never cross those boundaries: official Vue-version context; Raw SFC compilation; and SFC compilation with CSS. The old unmatched Verter retained-host re-render row is not in the ranked surface; it remains available through diagnose:compile-warmth.
- The RAW RENDER class compares Vue, Vize and Verter on byte-identical, intentionally style-free SFC strings. &lt;style> blocks are removed from ALL three outside the timer by the class definition. This class measures SFC parse + script/template parse and analysis + render codegen, not CSS.
- Every raw-class cell/pass injects a distinct fixed-width semantically neutral comment into every present script and template block. This prevents Vue cross-cell source-cache contamination and previous whole-output reuse; all candidates in a cell receive the exact same revised strings. Revision and input-object construction happen outside the timer.
- Official Vue-version context rows use a separate fixed-width source namespace from the candidate raw class. This prevents the context row and Vue candidate baseline from lending each other same-compiler parse/template cache entries while preserving byte-identical Vue/Vize/Verter inputs inside the candidate class.
- The ranked raw Verter row creates a fresh workspace-backed host/project outside every timed pass, then measures first source admission through compileMany. requestedMode=stateless is explicit and cacheHit is asserted zero. Process/native-library state may remain warm, but no populated-host parsed, semantic, dependency-graph or output state crosses timed passes.
- The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one processStyle call per block. Generated JS and CSS bytes are both counted.
- TIMED STYLE CORPUS CENSUS: 177/200 files contain 177 style block(s): scoped=177, CSS Modules=0, v-bind=0, preprocessors=0, external src=0. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.
- STYLE CORRECTNESS GATE (untimed, mandatory for style ranking): suite 2026-08-20.1 (0878259fbadc) runs 16 independent plants covering ordinary and compound scoped selectors; :deep(), :slotted(), :global(), :is() and :where() semantics; selectors nested in @media/@supports; scoped keyframe declaration/reference consistency; multiple and quoted v-bind() expression linkage; and CSS Modules mapping. Checks assert semantic relationships, never whole generated-CSS equality. Vize compileSfc and one real multi-input compileSfcBatchWithResults call have separate verdicts; Verter uses one fresh-host multi-input compileMany followed by serial processStyle; fervid sync and async are checked separately. Any failure is measured but UNRANKED and self-clears after a fixed upgrade. Plants execute after timing so they cannot pre-warm measured entrypoints; manifest metadata is retained in validation.styleCorrectnessManifest.
- SASS/SCSS CAPABILITY AUDIT (untimed, diagnostic): suite 2026-08-20.2 (e302bbad5972) runs 8 independent lang=scss/lang=sass plants for variables, mixins/nesting, scoped selectors, :deep() inside @media, v-bind linkage and CSS Modules. validation.stylePreprocessors keeps two non-interchangeable verdicts: exactEntrypoints says whether the measured compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call; sharedSassAdapter first runs the pinned sass dependency once per plant and then tests only each compiler's downstream Vue-style transform. Harness preprocessing can never turn an unsupported exact API into PASS. These diagnostic plants do not gate the separately defined timed inline-plain-CSS class.
- RUNTIME SEMANTIC GATE (untimed, mandatory): suite 2026-08-20.2 runs 31 independent valid-SFC plants against observable DOM/events/updates/public-instance behaviour, never generated-text equality. It certifies Vue's composed non-inline API, Vize single and real multi-input batch, fresh-host stateless multi-input Verter compileMany, and fervid sync/async separately with the exact target/env/map flags. Each API runs in an isolated child after all timings; every outcome and the manifest hash are retained in validation.compileSemantics. FAIL, crash, timeout, missing verdict and UNKNOWN are measured but UNRANKED. Vapor output is executed with Vue's pinned, version-matched 3.6 compiler/runtime and shipped createVaporApp path; each Vapor entrypoint receives its own PASS/FAIL verdict, while unsupported backends remain UNKNOWN individually. VDOM evidence is never borrowed.
- Scheduling is not disguised as equal: Vue's reference and Vize compileSfc loop are 1T; Vize's with-results API compiles inside the process-global Rayon pool; Verter compileMany uses its host pool but public processStyle is synchronous and is called serially; fervid async uses libuv. Each row says so.
- Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.
- The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.
- ⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested from every compiler in a cell (Vue and Vize single-file: sourceMap; Vize batch: includeSourceMap; Verter: compileProfile.sourceMap/processStyle sourcemap; fervid: FervidJsCompilerOptions.sourceMap). Raw render requires a JS map. Style-inclusive rows emit two artifacts and therefore require both JS and CSS maps. Timed paths assert returned bytes whenever the installed capability exists. Current executable presence probe: Vize single JS=YES/CSS=NO, Vize batch JS=YES/CSS=NO, Verter runtime-render JS=NO/processStyle CSS=NO, fervid JS=YES/CSS=NO. Presence is not mapping correctness: all map-on timings remain UNRANKED until planted script/template/CSS positions are traced back to the correct input coordinates.
- TypeScript handling is ONE benchmark standard for the whole cell: PASSTHROUGH, requested identically from every compiler (Vue and fervid preserve annotations by their API behaviour; Vize via isTs:true; Verter via forceJs:false). The report describes the exact benchmark call rather than inferring behaviour from a separate Vite integration.
- Verter analysisLevel=full for every timed and validation call. The default benchmark setting is full; VERTER_ANALYSIS_LEVEL remains an explicit diagnostic override, and every Verter row prints the effective value so a tuned run cannot masquerade as the default. devMode follows the cell's isProduction value.
- Production vs development uses each tool's real semantic knobs: Vue isProd (hoistStatic + cacheHandlers); Vize templateHoistStatic + templateCacheHandlers; Verter isProduction + hmrStrategy; fervid isProduction.
- VIZE MODE CAPABILITY AUDIT (untimed): VDOM compileSfc=YES, VDOM compileSfcBatchWithResults=YES; Vapor compileSfc output changes=NO, Vapor batch output changes=NO. "NO" for the Vapor observation is not itself a failure: the current Vapor backend does not use these VDOM transforms. A VDOM row whose options stop affecting output is automatically unranked.
- VERTER API CAPABILITY AUDIT (untimed): runtime-render emits compiled CSS=NO. The style adapter composes runtime-render + processStyle only while runtime-render returns no CSS; if an upgrade starts emitting CSS, that row is automatically unranked pending adapter revalidation so CSS cannot be charged twice.
- fervid and Vize's full-SFC APIs, Vue's composed compiler-sfc reference, and Verter's composed render+processStyle path are classified in the style-inclusive class because each timed row emits both JS and CSS. API composition and scheduling differences remain explicit row properties.
- fervid may emit the non-fatal HTML-strictness diagnostic NonVoidHtmlElementStartTagWithTrailingSolidus on self-closing non-void tags accepted by Vue. Only that complete diagnostic code is tolerated, and only with generated output; every other fervid diagnostic fails the timed row. The exact tolerated count is captured from each run.
- fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).
- fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=4), which is a fixed default of 4 rather than core count. It is reported, not tuned.
- Threading remains a row property inside a work-equivalence class. It never changes the reference: Vue stays the denominator even where a native batch is faster.
- Codegen validity gate: every compiler's output is parsed (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.
- The gate runs ONCE PER (target × environment) cell, with that cell's flags. It previously ran once on vdom/production and stamped the verdict onto the Vapor and development cells it had never exercised — Vapor is a different codegen backend and development mode emits different code, so a pass on one is not evidence about the other. Source maps are not a gate dimension: a map is emitted beside the code and cannot change whether the code parses.
- The gate builds each tool's compiler handle inside its own try, so a constructor that throws cannot destroy every row for the corpus. Missing or unmeasured mandatory validity is UNKNOWN and unranked.
- @vue/compiler-sfc, Vize and Verter are held to ONE error policy in the timed path: any non-empty top-level or per-file `errors` array fails the measure. fervid's sole exception is the exact NonVoidHtmlElementStartTagWithTrailingSolidus diagnostic code when code was still generated; all other diagnostics fail.
- Tool order uses a paired forward/reverse schedule for fresh-child samples, discarded warmups and measured warm runs. A complete pair balances row positions even when the requested run count is smaller than the number of rows; the executed order is retained in JSON.
- FRESH CHILD is the median first timed row workload across new child processes, one child per row and sample. Among benchmarked compiler packages, each child loads only the selected row's; shared harness dependencies are still imported. Child startup, package import, shared-input materialisation and Verter host/workspace construction are outside the timer. Imports and setup may already change V8/native/thread/allocator state; the OS page/filesystem caches are not flushed. It is therefore not a Cold metric and Fresh-child minus Warm must not be interpreted as pure initialization overhead. WARM is the primary ranking: the median shared-benchmark-process series after >= 1 discarded pass. Both series have independent distribution/noise statistics and separate Vue ratios.

</details>

### JSX compile

Files: **200** · Bytes: **38,804**

##### Vue JSX Vapor transform

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-jsx-compile-vue-jsx-vapor-transform-dark.svg">
  <img alt="JSX compile — Vue JSX Vapor transform" src="charts/compiler-bench-win32-200-jsx-compile-vue-jsx-vapor-transform.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (vapor) ⚠ | (2.6 ms) | (2.4 ms) | – | – | not ranked | (96,804) | – |
| vue-jsx-vapor/api ⚠ | (2.9 ms) | (2.6 ms) | – | – | not ranked | (96,804) | – |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (vapor) ⚠**: Rust/Oxc transform; default vapor mode (see vuejs/vue-jsx-vapor). Same unique .jsx corpus as other JSX rows. ⚠ JSX RUNTIME SEMANTIC VALIDITY UNKNOWN (0/8 passed) — static-element-attributes [not-run]: Exact Vapor runtime mounting is not available with the benchmark's Vue 3.5 runtime; VDOM evidence and code-shape regexes are not borrowed; interpolation-and-prop-update [not-run]: Exact Vapor runtime mounting is not available with the benchmark's Vue 3.5 runtime; VDOM evidence and code-shape regexes are not borrowed.
- **vue-jsx-vapor/api ⚠**: transformVueJsxVapor() public API (vapor default). ⚠ JSX RUNTIME SEMANTIC VALIDITY UNKNOWN (0/8 passed) — static-element-attributes [not-run]: Exact Vapor runtime mounting is not available with the benchmark's Vue 3.5 runtime; VDOM evidence and code-shape regexes are not borrowed; interpolation-and-prop-update [not-run]: Exact Vapor runtime mounting is not available with the benchmark's Vue 3.5 runtime; VDOM evidence and code-shape regexes are not borrowed. ⚠ COMPARISON REFERENCE INVALID: the Vue baseline for this JSX target did not pass mandatory validation.

</details>

##### Vue JSX VDOM transform

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-jsx-compile-vue-jsx-vdom-transform-dark.svg">
  <img alt="JSX compile — Vue JSX VDOM transform" src="charts/compiler-bench-win32-200-jsx-compile-vue-jsx-vdom-transform.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | **2.0 ms** | 1.9 ms | 0.2 ms | 12.1% ⚠ | 1.00x | 94,084 | 101.0k files/s |
| @vue/babel-plugin-jsx (Babel VDOM) | **80.0 ms** | 52.3 ms | 20.4 ms | 25.5% ⚠ | 40.40x | 57,284 | 2.5k files/s |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: Rust/Oxc transform with interop: true (VDOM createElementBlock path). ✓ JSX RUNTIME SEMANTIC VALIDITY: 8/8 observable-behaviour plants passed through transform(source, { interop: true }).
- **@vue/babel-plugin-jsx (Babel VDOM)**: Official Babel Vue JSX plugin (createVNode). Reference VDOM JSX path; not Vapor. ✓ JSX RUNTIME SEMANTIC VALIDITY: 8/8 observable-behaviour plants passed through @babel/core transformSync(source, { plugins: [@vue/babel-plugin-jsx], sourceMaps:false, babelrc:false, configFile:false }).

</details>

<details><summary>Methodology</summary>

- Surface is JSX/TSX transform throughput — independent of SFC (.vue) compile.
- Corpus: fixtures/jsx-N unique .jsx files (generate.mjs --with-jsx).
- vue-jsx-vapor: https://github.com/vuejs/vue-jsx-vapor — Vapor Mode of Vue JSX (Oxc/Rust compiler-rs).
- compiler-rs vapor vs interop:true (VDOM) are different codegen targets.
- VDOM and Vapor are separate comparison classes. @vue/babel-plugin-jsx is the Vue VDOM baseline; compiler-rs is the lower-level Vue Vapor baseline for the Vapor API wrapper.
- Each measured row reports generated code bytes. Empty string output is rejected for object and string native return shapes; byte counts are informational and never a correctness threshold.
- POST-TIMING SEMANTIC GATE: suite 2026-08-20.1 (8 plants) executes the Babel VDOM and compiler-rs interop VDOM outputs against Vue using each row's exact transform call. It observes DOM, props, updates, keyed lists, fragments, spreads, component props and events; generated text is never compared. compiler-rs's emitted virtual VDOM id is resolved to @vue-jsx-vapor/runtime's shipped VDOM helper. Each entrypoint runs in an isolated child after timing. FAIL, crash, missing verdict and UNKNOWN are measured but UNRANKED, and a failed Vue baseline invalidates its comparison class.
- Vapor compiler-rs and vue-jsx-vapor/api timings are currently UNKNOWN/unranked: the benchmark's Vue 3.5 runtime cannot execute their Vue 3.6 Vapor output, and neither VDOM behaviour nor generated-code regexes are borrowed as correctness evidence.
- Do not compare JSX ms to SFC compile ms; different language and pipeline.
- Tool order is ROTATED on every warmup and measured run (not merely alternated), so no tool keeps a fixed position in the sequence.

Raw runs:

- **@vue-jsx-vapor/compiler-rs (vapor)**: 3.0 ms, 2.6 ms, 3.0 ms, 2.6 ms, 2.4 ms
- **vue-jsx-vapor/api**: 4.0 ms, 3.7 ms, 2.9 ms, 2.8 ms, 2.6 ms
- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: 2.4 ms, 2.2 ms, 2.0 ms, 1.9 ms, 1.9 ms
- **@vue/babel-plugin-jsx (Babel VDOM)**: 100.8 ms, 89.5 ms, 80.0 ms, 52.3 ms, 58.9 ms

</details>

### compiler-win32-current

2026-08-20 · `fixtures/200` (200 files) · win32/x64 · source `compiler-win32-current.json`

> ⚠ **Local run — not the published Linux CI series** (win32/x64 · **dirty worktree** — not attributable to a single commit). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

#### Compiler

Files: **200** · Bytes: **285,701**

**Vue-anchored apples-to-apples compiler results.** Each target/environment/source-map cell contains two candidate-comparison subsections: Raw SFC compilation gives Vue, Vize batch and Verter first-admission the same revised style-free SFC strings; SFC compilation with CSS gives the style-capable entrypoints the same revised style-bearing SFCs and counts both generated JS and CSS. Every measured row publishes Fresh child and Warm separately when both samplers succeed. Ratios never cross these subsections and always use the official Vue workload as 1.00x. A failed semantic gate leaves both measured times visible but unranked.

##### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

###### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-compiler-win32-current-compile-vdom-production-sourcema-1wz4s00-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-compiler-win32-current-compile-vdom-production-sourcema-1wz4s00.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (1T) | 222.5 ms | 204.3 ms | 10.2 ms | 4.6% | 1.00x | **146.7 ms** | 138.7 ms | 5.6 ms | 3.8% | 1.00x | 735,261 | 1.4k files/s | 64.2 MB |
| @vue/compiler-sfc 3.6 (1T) | 244.6 ms | 200.4 ms | 23.0 ms | 9.4% | 1.10x | **169.3 ms** | 163.4 ms | 6.8 ms | 4.0% | 1.15x | 735,261 | 1.2k files/s | 63.0 MB |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

###### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-compiler-win32-current-compile-vdom-production-sourcema-14iqg7o-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-compiler-win32-current-compile-vdom-production-sourcema-14iqg7o.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | 226.3 ms | 216.2 ms | 12.2 ms | 5.4% | 1.00x | **145.2 ms** | 144.3 ms | 9.7 ms | 6.7% | 1.00x | 735,061 | 1.4k files/s | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (11.3 ms) | (10.3 ms) | (1.2 ms) | (10.9%) | not ranked | (10.0 ms) | (5.4 ms) | (2.6 ms) | (25.6%) | not ranked | (617,550) | – | (21.4 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (53.6 ms) | (44.4 ms) | (7.3 ms) | (13.6%) | not ranked | (37.8 ms) | (34.5 ms) | (6.2 ms) | (16.4%) | not ranked | (528,623) | – | (67.1 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

###### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-compiler-win32-current-compile-vdom-production-sourcema-01s3jc3-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-compiler-win32-current-compile-vdom-production-sourcema-01s3jc3.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | 233.5 ms | 231.3 ms | 20.6 ms | 8.8% | 1.00x | **168.3 ms** | 155.8 ms | 10.5 ms | 6.3% | 1.00x | 769,363 | 1.2k files/s | 103.8 MB |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (38.2 ms) | (37.8 ms) | (2.3 ms) | (6.1%) | not ranked | (51.0 ms) | (48.3 ms) | (1.9 ms) | (3.7%) | not ranked | (650,832) | – | (16.7 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (10.9 ms) | (10.3 ms) | (1.0 ms) | (9.2%) | not ranked | (9.9 ms) | (6.2 ms) | (2.6 ms) | (26.4%) | not ranked | (650,832) | – | (21.6 MB) |
| fervid compileSync (1T) ⚠ | (33.6 ms) | (33.0 ms) | (1.2 ms) | (3.6%) | not ranked | (45.4 ms) | (43.7 ms) | (1.9 ms) | (4.1%) | not ranked | (884,932) | – | (15.9 MB) |
| fervid compileAsync (4-thread libuv pool) ⚠ | (11.8 ms) | (11.3 ms) | (0.4 ms) | (3.5%) | not ranked | (12.9 ms) | (11.2 ms) | (8.0 ms) | (61.8%) | not ranked | (884,932) | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (47.1 ms) | (44.3 ms) | (2.6 ms) | (5.6%) | not ranked | (39.7 ms) | (32.3 ms) | (8.1 ms) | (20.3%) | not ranked | (589,604) | – | (68.6 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Fresh child (first timed row workload): 222.5 ms, 232.1 ms, 221.3 ms, 204.3 ms, 224.4 ms · Warm: 147.6 ms, 141.0 ms, 152.8 ms, 138.7 ms, 146.7 ms
- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 244.7 ms, 205.5 ms, 244.9 ms, 200.4 ms, 244.6 ms · Warm: 169.3 ms, 163.4 ms, 163.7 ms, 175.1 ms, 178.7 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Fresh child (first timed row workload): 226.3 ms, 245.1 ms, 242.4 ms, 225.9 ms, 216.2 ms · Warm: 145.1 ms, 144.3 ms, 145.7 ms, 145.2 ms, 166.7 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 11.5 ms, 10.3 ms, 11.1 ms, 11.3 ms, 13.6 ms · Warm: 5.4 ms, 10.7 ms, 7.7 ms, 11.8 ms, 10.0 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 44.4 ms, 51.9 ms, 57.3 ms, 53.6 ms, 64.3 ms · Warm: 46.4 ms, 37.8 ms, 47.7 ms, 34.5 ms, 35.7 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 231.3 ms, 262.3 ms, 233.2 ms, 233.5 ms, 276.1 ms · Warm: 185.1 ms, 155.8 ms, 167.2 ms, 168.3 ms, 171.5 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 43.3 ms, 38.0 ms, 37.8 ms, 38.8 ms, 38.2 ms · Warm: 48.3 ms, 49.0 ms, 51.0 ms, 52.2 ms, 52.7 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 12.9 ms, 10.7 ms, 10.9 ms, 11.5 ms, 10.3 ms · Warm: 6.2 ms, 8.2 ms, 9.9 ms, 12.3 ms, 12.1 ms
- **fervid compileSync (1T)**: Fresh child (first timed row workload): 34.8 ms, 33.4 ms, 33.6 ms, 33.0 ms, 36.0 ms · Warm: 46.3 ms, 44.5 ms, 45.4 ms, 48.5 ms, 43.7 ms
- **fervid compileAsync (4-thread libuv pool)**: Fresh child (first timed row workload): 11.3 ms, 12.3 ms, 11.7 ms, 12.1 ms, 11.8 ms · Warm: 11.2 ms, 25.5 ms, 12.9 ms, 27.6 ms, 12.2 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 44.3 ms, 45.6 ms, 47.1 ms, 51.3 ms, 47.1 ms · Warm: 39.7 ms, 32.3 ms, 48.4 ms, 36.0 ms, 51.2 ms

</details>

##### VAPOR · production · sourcemap off

Target: `vapor` · Environment: `production` · Source map: `off`

###### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-compiler-win32-current-compile-vapor-production-sourcem-1cmlrp6-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-compiler-win32-current-compile-vapor-production-sourcem-1cmlrp6.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – | – |
| @vue/compiler-sfc 3.6 (1T) ⚠ | (396.8 ms) | (341.9 ms) | (30.6 ms) | (7.7%) | not ranked | (288.8 ms) | (264.7 ms) | (16.7 ms) | (5.8%) | not ranked | (711,809) | – | (72.0 MB) |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **@vue/compiler-sfc 3.6 (1T) ⚠**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=true, sourceMap=false ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

###### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-compiler-win32-current-compile-vapor-production-sourcem-0vuxtau-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-compiler-win32-current-compile-vapor-production-sourcem-0vuxtau.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠ | (361.7 ms) | (337.7 ms) | (21.3 ms) | (5.9%) | not ranked | (277.3 ms) | (269.9 ms) | (11.3 ms) | (4.1%) | not ranked | (711,609) | – | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (12.5 ms) | (12.2 ms) | (0.7 ms) | (5.3%) | not ranked | (4.9 ms) | (4.4 ms) | (1.3 ms) | (26.0%) | not ranked | (751,416) | – | (20.9 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (45.9 ms) | (39.8 ms) | (4.5 ms) | (9.9%) | not ranked | (41.2 ms) | (34.5 ms) | (5.3 ms) | (12.8%) | not ranked | (564,944) | – | (65.8 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/31 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; define-emits-payload [runtime]: _setText is not defined; native-v-model-modifiers [runtime]: _setText is not defined; +24 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

###### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-compiler-win32-current-compile-vapor-production-sourcem-1mlxqsd-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-compiler-win32-current-compile-vapor-production-sourcem-1mlxqsd.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠ | (426.9 ms) | (379.2 ms) | (34.3 ms) | (8.0%) | not ranked | (335.2 ms) | (298.7 ms) | (27.5 ms) | (8.2%) | not ranked | (791,235) | – | (114.7 MB) |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (41.9 ms) | (40.2 ms) | (2.3 ms) | (5.5%) | not ranked | (52.8 ms) | (49.8 ms) | (1.6 ms) | (3.0%) | not ranked | (795,274) | – | (15.4 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (13.2 ms) | (12.2 ms) | (0.7 ms) | (5.2%) | not ranked | (5.5 ms) | (5.0 ms) | (1.2 ms) | (22.7%) | not ranked | (795,274) | – | (20.4 MB) |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (51.2 ms) | (43.3 ms) | (11.5 ms) | (22.5%) | not ranked | (46.0 ms) | (37.8 ms) | (5.2 ms) | (11.4%) | not ranked | (625,925) | – | (68.7 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5. ⚠ STYLE CORRECTNESS GATE NOT RUN for @fervid/napi; a render+CSS result without the 16-plant CSS semantics suite is not ranked.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/31 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; define-emits-payload [runtime]: _setText is not defined; native-v-model-modifiers [runtime]: _setText is not defined; +24 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 341.9 ms, 412.6 ms, 405.7 ms, 396.8 ms, 361.0 ms · Warm: 299.8 ms, 264.7 ms, 297.8 ms, 288.8 ms, 267.2 ms
- **Vue compiler-sfc 3.6 reference (raw render, 1T)**: Fresh child (first timed row workload): 370.0 ms, 361.7 ms, 337.7 ms, 349.3 ms, 393.7 ms · Warm: 299.0 ms, 277.3 ms, 282.8 ms, 269.9 ms, 274.3 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 12.2 ms, 12.7 ms, 12.5 ms, 13.8 ms, 12.3 ms · Warm: 4.9 ms, 4.9 ms, 7.6 ms, 5.7 ms, 4.4 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 45.9 ms, 48.9 ms, 39.8 ms, 50.7 ms, 42.2 ms · Warm: 36.2 ms, 34.5 ms, 41.2 ms, 47.6 ms, 42.5 ms
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 465.2 ms, 392.1 ms, 379.2 ms, 433.2 ms, 426.9 ms · Warm: 353.2 ms, 302.9 ms, 335.2 ms, 357.6 ms, 298.7 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 41.9 ms, 41.6 ms, 40.2 ms, 43.9 ms, 46.1 ms · Warm: 52.8 ms, 52.5 ms, 49.8 ms, 54.0 ms, 53.2 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 12.2 ms, 13.9 ms, 12.9 ms, 13.7 ms, 13.2 ms · Warm: 5.5 ms, 5.0 ms, 5.4 ms, 8.1 ms, 5.7 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 54.3 ms, 43.3 ms, 51.2 ms, 51.0 ms, 74.1 ms · Warm: 37.8 ms, 46.0 ms, 43.6 ms, 51.3 ms, 49.0 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=unique: 200/200 unique content SHAs. The exact compileSfcBatchWithResults path measured here does not have Vize's stats-only batch API's duplicate-body grouping, so duplicate bodies are disclosed for corpus representativeness rather than described as output-cache hits.
- Ratio columns are vs fastest — the fastest ranked row in each comparison class is the 1.00x denominator; no tool is pinned as a reference. Vue 3.5 anchors VDOM; Vue 3.6 anchors Vapor because 3.5 has no Vapor backend.
- Rows are split into explicit work-equivalence classes and ratios never cross those boundaries: official Vue-version context; Raw SFC compilation; and SFC compilation with CSS. The old unmatched Verter retained-host re-render row is not in the ranked surface; it remains available through diagnose:compile-warmth.
- The RAW RENDER class compares Vue, Vize and Verter on byte-identical, intentionally style-free SFC strings. &lt;style> blocks are removed from ALL three outside the timer by the class definition. This class measures SFC parse + script/template parse and analysis + render codegen, not CSS.
- Every raw-class cell/pass injects a distinct fixed-width semantically neutral comment into every present script and template block. This prevents Vue cross-cell source-cache contamination and previous whole-output reuse; all candidates in a cell receive the exact same revised strings. Revision and input-object construction happen outside the timer.
- Official Vue-version context rows use a separate fixed-width source namespace from the candidate raw class. This prevents the context row and Vue candidate baseline from lending each other same-compiler parse/template cache entries while preserving byte-identical Vue/Vize/Verter inputs inside the candidate class.
- The ranked raw Verter row creates a fresh workspace-backed host/project outside every timed pass, then measures first source admission through compileMany. requestedMode=stateless is explicit and cacheHit is asserted zero. Process/native-library state may remain warm, but no populated-host parsed, semantic, dependency-graph or output state crosses timed passes.
- The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one processStyle call per block. Generated JS and CSS bytes are both counted.
- TIMED STYLE CORPUS CENSUS: 177/200 files contain 177 style block(s): scoped=177, CSS Modules=0, v-bind=0, preprocessors=0, external src=0. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.
- STYLE CORRECTNESS GATE (untimed, mandatory for style ranking): suite 2026-08-20.1 (0878259fbadc) runs 16 independent plants covering ordinary and compound scoped selectors; :deep(), :slotted(), :global(), :is() and :where() semantics; selectors nested in @media/@supports; scoped keyframe declaration/reference consistency; multiple and quoted v-bind() expression linkage; and CSS Modules mapping. Checks assert semantic relationships, never whole generated-CSS equality. Vize compileSfc and one real multi-input compileSfcBatchWithResults call have separate verdicts; Verter uses one fresh-host multi-input compileMany followed by serial processStyle; fervid sync and async are checked separately. Any failure is measured but UNRANKED and self-clears after a fixed upgrade. Plants execute after timing so they cannot pre-warm measured entrypoints; manifest metadata is retained in validation.styleCorrectnessManifest.
- SASS/SCSS CAPABILITY AUDIT (untimed, diagnostic): suite 2026-08-20.2 (e302bbad5972) runs 8 independent lang=scss/lang=sass plants for variables, mixins/nesting, scoped selectors, :deep() inside @media, v-bind linkage and CSS Modules. validation.stylePreprocessors keeps two non-interchangeable verdicts: exactEntrypoints says whether the measured compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call; sharedSassAdapter first runs the pinned sass dependency once per plant and then tests only each compiler's downstream Vue-style transform. Harness preprocessing can never turn an unsupported exact API into PASS. These diagnostic plants do not gate the separately defined timed inline-plain-CSS class.
- RUNTIME SEMANTIC GATE (untimed, mandatory): suite 2026-08-20.2 runs 31 independent valid-SFC plants against observable DOM/events/updates/public-instance behaviour, never generated-text equality. It certifies Vue's composed non-inline API, Vize single and real multi-input batch, fresh-host stateless multi-input Verter compileMany, and fervid sync/async separately with the exact target/env/map flags. Each API runs in an isolated child after all timings; every outcome and the manifest hash are retained in validation.compileSemantics. FAIL, crash, timeout, missing verdict and UNKNOWN are measured but UNRANKED. Vapor output is executed with Vue's pinned, version-matched 3.6 compiler/runtime and shipped createVaporApp path; each Vapor entrypoint receives its own PASS/FAIL verdict, while unsupported backends remain UNKNOWN individually. VDOM evidence is never borrowed.
- Scheduling is not disguised as equal: Vue's reference and Vize compileSfc loop are 1T; Vize's with-results API compiles inside the process-global Rayon pool; Verter compileMany uses its host pool but public processStyle is synchronous and is called serially; fervid async uses libuv. Each row says so.
- Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.
- The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.
- ⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested from every compiler in a cell (Vue and Vize single-file: sourceMap; Vize batch: includeSourceMap; Verter: compileProfile.sourceMap/processStyle sourcemap; fervid: FervidJsCompilerOptions.sourceMap). Raw render requires a JS map. Style-inclusive rows emit two artifacts and therefore require both JS and CSS maps. Timed paths assert returned bytes whenever the installed capability exists. Current executable presence probe: Vize single JS=YES/CSS=NO, Vize batch JS=YES/CSS=NO, Verter runtime-render JS=NO/processStyle CSS=NO, fervid JS=YES/CSS=NO. Presence is not mapping correctness: all map-on timings remain UNRANKED until planted script/template/CSS positions are traced back to the correct input coordinates.
- TypeScript handling is ONE benchmark standard for the whole cell: PASSTHROUGH, requested identically from every compiler (Vue and fervid preserve annotations by their API behaviour; Vize via isTs:true; Verter via forceJs:false). The report describes the exact benchmark call rather than inferring behaviour from a separate Vite integration.
- Verter analysisLevel=full for every timed and validation call. The default benchmark setting is full; VERTER_ANALYSIS_LEVEL remains an explicit diagnostic override, and every Verter row prints the effective value so a tuned run cannot masquerade as the default. devMode follows the cell's isProduction value.
- Production vs development uses each tool's real semantic knobs: Vue isProd (hoistStatic + cacheHandlers); Vize templateHoistStatic + templateCacheHandlers; Verter isProduction + hmrStrategy; fervid isProduction.
- VIZE MODE CAPABILITY AUDIT (untimed): VDOM compileSfc=YES, VDOM compileSfcBatchWithResults=YES; Vapor compileSfc output changes=NO, Vapor batch output changes=NO. "NO" for the Vapor observation is not itself a failure: the current Vapor backend does not use these VDOM transforms. A VDOM row whose options stop affecting output is automatically unranked.
- VERTER API CAPABILITY AUDIT (untimed): runtime-render emits compiled CSS=NO. The style adapter composes runtime-render + processStyle only while runtime-render returns no CSS; if an upgrade starts emitting CSS, that row is automatically unranked pending adapter revalidation so CSS cannot be charged twice.
- fervid and Vize's full-SFC APIs, Vue's composed compiler-sfc reference, and Verter's composed render+processStyle path are classified in the style-inclusive class because each timed row emits both JS and CSS. API composition and scheduling differences remain explicit row properties.
- fervid may emit the non-fatal HTML-strictness diagnostic NonVoidHtmlElementStartTagWithTrailingSolidus on self-closing non-void tags accepted by Vue. Only that complete diagnostic code is tolerated, and only with generated output; every other fervid diagnostic fails the timed row. The exact tolerated count is captured from each run.
- fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).
- fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=4), which is a fixed default of 4 rather than core count. It is reported, not tuned.
- Threading remains a row property inside a work-equivalence class. It never changes the reference: Vue stays the denominator even where a native batch is faster.
- Codegen validity gate: every compiler's output is parsed (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.
- The gate runs ONCE PER (target × environment) cell, with that cell's flags. It previously ran once on vdom/production and stamped the verdict onto the Vapor and development cells it had never exercised — Vapor is a different codegen backend and development mode emits different code, so a pass on one is not evidence about the other. Source maps are not a gate dimension: a map is emitted beside the code and cannot change whether the code parses.
- The gate builds each tool's compiler handle inside its own try, so a constructor that throws cannot destroy every row for the corpus. Missing or unmeasured mandatory validity is UNKNOWN and unranked.
- @vue/compiler-sfc, Vize and Verter are held to ONE error policy in the timed path: any non-empty top-level or per-file `errors` array fails the measure. fervid's sole exception is the exact NonVoidHtmlElementStartTagWithTrailingSolidus diagnostic code when code was still generated; all other diagnostics fail.
- Tool order uses a paired forward/reverse schedule for fresh-child samples, discarded warmups and measured warm runs. A complete pair balances row positions even when the requested run count is smaller than the number of rows; the executed order is retained in JSON.
- FRESH CHILD is the median first timed row workload across new child processes, one child per row and sample. Among benchmarked compiler packages, each child loads only the selected row's; shared harness dependencies are still imported. Child startup, package import, shared-input materialisation and Verter host/workspace construction are outside the timer. Imports and setup may already change V8/native/thread/allocator state; the OS page/filesystem caches are not flushed. It is therefore not a Cold metric and Fresh-child minus Warm must not be interpreted as pure initialization overhead. WARM is the primary ranking: the median shared-benchmark-process series after >= 1 discarded pass. Both series have independent distribution/noise statistics and separate Vue ratios.

</details>

### bench-win32-200-fair-validation

2026-08-20 · `fixtures/200` (200 files) · win32/x64 · source `bench-win32-200-fair-validation.json`

> ⚠ **Local run — not the published Linux CI series** (win32/x64). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

#### Compiler

Files: **200** · Bytes: **285,701**

**Vue-anchored apples-to-apples compiler results.** Each target/environment/source-map cell contains two candidate-comparison subsections: Raw SFC compilation gives Vue, Vize batch and Verter first-admission the same revised style-free SFC strings; SFC compilation with CSS gives the style-capable entrypoints the same revised style-bearing SFCs and counts both generated JS and CSS. Every row publishes fresh-process API Cold and same-process Warm separately. Ratios never cross these subsections and always use the official Vue workload as 1.00x. A failed semantic gate leaves both measured times visible but unranked.

##### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

###### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-fair-validation-compile-vdom-production-0rpjbw3-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-win32-200-fair-validation-compile-vdom-production-0rpjbw3.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.6 (1T) | **253.1 ms** | 1.00x | **197.2 ms** | 185.9 ms | 12.4 ms | 6.3% | 1.15x | 735,261 | 1.0k files/s | 63.0 MB |
| @vue/compiler-sfc 3.5 (1T) | **302.1 ms** | 1.19x | **171.6 ms** | 162.9 ms | 15.4 ms | 9.0% | 1.00x | 735,261 | 1.2k files/s | 64.2 MB |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

###### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-fair-validation-compile-vdom-production-0e4ap8b-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-win32-200-fair-validation-compile-vdom-production-0e4ap8b.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | **290.5 ms** | 1.00x | **170.8 ms** | 160.0 ms | 13.4 ms | 7.9% | 1.00x | 735,061 | 1.2k files/s | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (14.9 ms) | not ranked | (7.8 ms) | (7.6 ms) | – | – | not ranked | (617,550) | – | (21.4 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (64.1 ms) | not ranked | (46.3 ms) | (30.8 ms) | – | – | not ranked | (528,623) | – | (67.1 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Rayon's process-global pool stays warm; ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Process/native-library and any process-global state can remain warm; no host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

###### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-fair-validation-compile-vdom-production-19ntf6w-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-win32-200-fair-validation-compile-vdom-production-19ntf6w.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | **296.6 ms** | 1.00x | **191.9 ms** | 187.2 ms | 25.4 ms | 13.2% ⚠ | 1.00x | 769,363 | 1.0k files/s | 103.8 MB |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (43.1 ms) | not ranked | (59.1 ms) | (58.5 ms) | – | – | not ranked | (650,832) | – | (16.7 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (15.2 ms) | not ranked | (9.3 ms) | (8.2 ms) | – | – | not ranked | (650,832) | – | (21.6 MB) |
| fervid compileSync (1T) ⚠ | (35.0 ms) | not ranked | (51.0 ms) | (49.8 ms) | – | – | not ranked | (884,932) | – | (15.9 MB) |
| fervid compileAsync (4-thread libuv pool) ⚠ | (11.9 ms) | not ranked | (14.0 ms) | (13.5 ms) | – | – | not ranked | (884,932) | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (58.1 ms) | not ranked | (47.6 ms) | (36.8 ms) | – | – | not ranked | (589,604) | – | (68.6 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Rayon's process-global pool stays warm (threads omitted); input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Cold: 352.0 ms, 299.0 ms, 253.1 ms, 219.9 ms, 223.0 ms · Warm: 202.5 ms, 185.9 ms, 194.2 ms, 219.3 ms, 197.2 ms
- **@vue/compiler-sfc 3.5 (1T)**: Cold: 297.8 ms, 360.7 ms, 314.2 ms, 253.2 ms, 302.1 ms · Warm: 177.3 ms, 202.4 ms, 162.9 ms, 171.6 ms, 167.8 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Cold: 305.5 ms, 276.6 ms, 357.6 ms, 237.3 ms, 290.5 ms · Warm: 195.4 ms, 160.0 ms, 171.2 ms, 170.8 ms, 166.8 ms
- **Vize compileSfcBatchWithResults (raw render)**: Cold: 16.6 ms, 14.9 ms, 11.9 ms, 18.1 ms, 14.7 ms · Warm: 7.8 ms, 7.8 ms, 7.9 ms, 7.6 ms, 7.9 ms
- **Verter compileMany (first-admission stateless raw render)**: Cold: 58.5 ms, 65.2 ms, 66.0 ms, 64.1 ms, 52.4 ms · Warm: 53.8 ms, 47.2 ms, 35.2 ms, 46.3 ms, 30.8 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Cold: 359.3 ms, 276.4 ms, 288.0 ms, 296.6 ms, 298.6 ms · Warm: 218.6 ms, 246.4 ms, 191.9 ms, 187.2 ms, 190.7 ms
- **Vize compileSfc loop (full SFC, 1T)**: Cold: 49.1 ms, 44.8 ms, 41.8 ms, 40.5 ms, 43.1 ms · Warm: 59.1 ms, 59.1 ms, 63.5 ms, 58.5 ms, 59.5 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Cold: 17.0 ms, 12.3 ms, 14.0 ms, 15.2 ms, 16.5 ms · Warm: 8.2 ms, 10.4 ms, 10.6 ms, 9.2 ms, 9.3 ms
- **fervid compileSync (1T)**: Cold: 38.0 ms, 35.0 ms, 34.8 ms, 34.0 ms, 38.6 ms · Warm: 53.4 ms, 50.9 ms, 49.8 ms, 51.0 ms, 52.4 ms
- **fervid compileAsync (4-thread libuv pool)**: Cold: 11.6 ms, 11.8 ms, 11.9 ms, 13.1 ms, 13.3 ms · Warm: 20.8 ms, 16.1 ms, 14.0 ms, 13.5 ms, 13.9 ms
- **Verter compileMany + processStyle (render + CSS)**: Cold: 58.1 ms, 69.0 ms, 59.2 ms, 57.7 ms, 50.2 ms · Warm: 64.4 ms, 47.6 ms, 53.5 ms, 37.9 ms, 36.8 ms

</details>

##### VAPOR · production · sourcemap off

Target: `vapor` · Environment: `production` · Source map: `off`

###### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-fair-validation-compile-vapor-productio-05c8enb-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-win32-200-fair-validation-compile-vapor-productio-05c8enb.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – |
| @vue/compiler-sfc 3.6 (1T) ⚠ | (404.5 ms) | not ranked | (360.2 ms) | (325.7 ms) | – | – | not ranked | (711,809) | – | (72.0 MB) |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **@vue/compiler-sfc 3.6 (1T) ⚠**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=true, sourceMap=false ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

###### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-fair-validation-compile-vapor-productio-03rylkn-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-win32-200-fair-validation-compile-vapor-productio-03rylkn.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠ | (413.4 ms) | not ranked | (387.2 ms) | (323.7 ms) | – | – | not ranked | (711,609) | – | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (14.0 ms) | not ranked | (5.9 ms) | (5.1 ms) | – | – | not ranked | (751,416) | – | (20.9 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (45.7 ms) | not ranked | (45.8 ms) | (39.5 ms) | – | – | not ranked | (564,944) | – | (65.8 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Rayon's process-global pool stays warm; ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Process/native-library and any process-global state can remain warm; no host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/31 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; define-emits-payload [runtime]: _setText is not defined; native-v-model-modifiers [runtime]: _setText is not defined; +24 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

###### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-200-fair-validation-compile-vapor-productio-0p1ffcc-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-win32-200-fair-validation-compile-vapor-productio-0p1ffcc.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠ | (467.5 ms) | not ranked | (387.6 ms) | (345.1 ms) | – | – | not ranked | (791,235) | – | (114.7 MB) |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (42.5 ms) | not ranked | (57.9 ms) | (52.0 ms) | – | – | not ranked | (795,274) | – | (15.4 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (14.7 ms) | not ranked | (6.0 ms) | (5.6 ms) | – | – | not ranked | (795,274) | – | (20.4 MB) |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (60.2 ms) | not ranked | (56.1 ms) | (39.5 ms) | – | – | not ranked | (625,925) | – | (68.7 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Rayon's process-global pool stays warm (threads omitted); input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5. ⚠ STYLE CORRECTNESS GATE NOT RUN for @fervid/napi; a render+CSS result without the 16-plant CSS semantics suite is not ranked.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/31 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; define-emits-payload [runtime]: _setText is not defined; native-v-model-modifiers [runtime]: _setText is not defined; +24 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Cold: 389.5 ms, 404.5 ms, 395.5 ms, 514.3 ms, 418.7 ms · Warm: 362.4 ms, 325.7 ms, 350.7 ms, 395.6 ms, 360.2 ms
- **Vue compiler-sfc 3.6 reference (raw render, 1T)**: Cold: 504.8 ms, 396.6 ms, 550.3 ms, 413.4 ms, 405.5 ms · Warm: 343.5 ms, 323.7 ms, 391.8 ms, 387.2 ms, 410.0 ms
- **Vize compileSfcBatchWithResults (raw render)**: Cold: 13.7 ms, 14.0 ms, 14.4 ms, 13.1 ms, 15.3 ms · Warm: 5.1 ms, 7.7 ms, 5.9 ms, 7.4 ms, 5.4 ms
- **Verter compileMany (first-admission stateless raw render)**: Cold: 45.7 ms, 44.8 ms, 43.6 ms, 55.1 ms, 50.4 ms · Warm: 45.8 ms, 43.0 ms, 39.5 ms, 56.9 ms, 57.5 ms
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T)**: Cold: 474.6 ms, 441.9 ms, 467.5 ms, 450.2 ms, 582.6 ms · Warm: 387.6 ms, 345.1 ms, 385.7 ms, 415.5 ms, 427.8 ms
- **Vize compileSfc loop (full SFC, 1T)**: Cold: 42.5 ms, 42.3 ms, 41.1 ms, 46.9 ms, 48.2 ms · Warm: 57.9 ms, 52.0 ms, 59.8 ms, 70.6 ms, 53.9 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Cold: 14.1 ms, 20.7 ms, 26.1 ms, 13.5 ms, 14.7 ms · Warm: 5.6 ms, 5.7 ms, 6.0 ms, 9.1 ms, 14.7 ms
- **Verter compileMany + processStyle (render + CSS)**: Cold: 50.4 ms, 74.3 ms, 60.2 ms, 71.7 ms, 59.4 ms · Warm: 39.5 ms, 47.3 ms, 58.9 ms, 57.2 ms, 56.1 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=unique: 200/200 unique content SHAs. The exact compileSfcBatchWithResults path measured here does not have Vize's stats-only batch API's duplicate-body grouping, so duplicate bodies are disclosed for corpus representativeness rather than described as output-cache hits.
- Ratio columns are vs fastest — the fastest ranked row in each comparison class is the 1.00x denominator; no tool is pinned as a reference. Vue 3.5 anchors VDOM; Vue 3.6 anchors Vapor because 3.5 has no Vapor backend.
- Rows are split into explicit work-equivalence classes and ratios never cross those boundaries: official Vue-version context; Raw SFC compilation; and SFC compilation with CSS. The old unmatched Verter retained-host re-render row is not in the ranked surface; it remains available through diagnose:compile-warmth.
- The RAW RENDER class compares Vue, Vize and Verter on byte-identical, intentionally style-free SFC strings. &lt;style> blocks are removed from ALL three outside the timer by the class definition. This class measures SFC parse + script/template parse and analysis + render codegen, not CSS.
- Every raw-class cell/pass injects a distinct fixed-width semantically neutral comment into every present script and template block. This prevents Vue cross-cell source-cache contamination and previous whole-output reuse; all candidates in a cell receive the exact same revised strings. Revision and input-object construction happen outside the timer.
- Official Vue-version context rows use a separate fixed-width source namespace from the candidate raw class. This prevents the context row and Vue candidate baseline from lending each other same-compiler parse/template cache entries while preserving byte-identical Vue/Vize/Verter inputs inside the candidate class.
- The ranked raw Verter row creates a fresh workspace-backed host/project outside every timed pass, then measures first source admission through compileMany. requestedMode=stateless is explicit and cacheHit is asserted zero. Process/native-library state may remain warm, but no populated-host parsed, semantic, dependency-graph or output state crosses timed passes.
- The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one processStyle call per block. Generated JS and CSS bytes are both counted.
- TIMED STYLE CORPUS CENSUS: 177/200 files contain 177 style block(s): scoped=177, CSS Modules=0, v-bind=0, preprocessors=0, external src=0. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.
- STYLE CORRECTNESS GATE (untimed, mandatory for style ranking): suite 2026-08-20.1 (0878259fbadc) runs 16 independent plants covering ordinary and compound scoped selectors; :deep(), :slotted(), :global(), :is() and :where() semantics; selectors nested in @media/@supports; scoped keyframe declaration/reference consistency; multiple and quoted v-bind() expression linkage; and CSS Modules mapping. Checks assert semantic relationships, never whole generated-CSS equality. Vize compileSfc and one real multi-input compileSfcBatchWithResults call have separate verdicts; Verter uses one fresh-host multi-input compileMany followed by serial processStyle; fervid sync and async are checked separately. Any failure is measured but UNRANKED and self-clears after a fixed upgrade. Plants execute after timing so they cannot pre-warm measured entrypoints; manifest metadata is retained in validation.styleCorrectnessManifest.
- SASS/SCSS CAPABILITY AUDIT (untimed, diagnostic): suite 2026-08-20.2 (e302bbad5972) runs 8 independent lang=scss/lang=sass plants for variables, mixins/nesting, scoped selectors, :deep() inside @media, v-bind linkage and CSS Modules. validation.stylePreprocessors keeps two non-interchangeable verdicts: exactEntrypoints says whether the measured compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call; sharedSassAdapter first runs the pinned sass dependency once per plant and then tests only each compiler's downstream Vue-style transform. Harness preprocessing can never turn an unsupported exact API into PASS. These diagnostic plants do not gate the separately defined timed inline-plain-CSS class.
- RUNTIME SEMANTIC GATE (untimed, mandatory): suite 2026-08-20.2 runs 31 independent valid-SFC plants against observable DOM/events/updates/public-instance behaviour, never generated-text equality. It certifies Vue's composed non-inline API, Vize single and real multi-input batch, fresh-host stateless multi-input Verter compileMany, and fervid sync/async separately with the exact target/env/map flags. Each API runs in an isolated child after all timings; every outcome and the manifest hash are retained in validation.compileSemantics. FAIL, crash, timeout, missing verdict and UNKNOWN are measured but UNRANKED. Vapor output is executed with Vue's pinned, version-matched 3.6 compiler/runtime and shipped createVaporApp path; each Vapor entrypoint receives its own PASS/FAIL verdict, while unsupported backends remain UNKNOWN individually. VDOM evidence is never borrowed.
- Scheduling is not disguised as equal: Vue's reference and Vize compileSfc loop are 1T; Vize's with-results API compiles inside the process-global Rayon pool; Verter compileMany uses its host pool but public processStyle is synchronous and is called serially; fervid async uses libuv. Each row says so.
- Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.
- The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.
- ⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested from every compiler in a cell (Vue and Vize single-file: sourceMap; Vize batch: includeSourceMap; Verter: compileProfile.sourceMap/processStyle sourcemap; fervid: FervidJsCompilerOptions.sourceMap). Raw render requires a JS map. Style-inclusive rows emit two artifacts and therefore require both JS and CSS maps. Timed paths assert returned bytes whenever the installed capability exists. Current executable presence probe: Vize single JS=YES/CSS=NO, Vize batch JS=YES/CSS=NO, Verter runtime-render JS=NO/processStyle CSS=NO, fervid JS=YES/CSS=NO. Presence is not mapping correctness: all map-on timings remain UNRANKED until planted script/template/CSS positions are traced back to the correct input coordinates.
- TypeScript handling is ONE benchmark standard for the whole cell: PASSTHROUGH, requested identically from every compiler (Vue and fervid preserve annotations by their API behaviour; Vize via isTs:true; Verter via forceJs:false). The report describes the exact benchmark call rather than inferring behaviour from a separate Vite integration.
- Verter analysisLevel=full for every timed and validation call. The default benchmark setting is full; VERTER_ANALYSIS_LEVEL remains an explicit diagnostic override, and every Verter row prints the effective value so a tuned run cannot masquerade as the default. devMode follows the cell's isProduction value.
- Production vs development uses each tool's real semantic knobs: Vue isProd (hoistStatic + cacheHandlers); Vize templateHoistStatic + templateCacheHandlers; Verter isProduction + hmrStrategy; fervid isProduction.
- VIZE MODE CAPABILITY AUDIT (untimed): VDOM compileSfc=YES, VDOM compileSfcBatchWithResults=YES; Vapor compileSfc output changes=NO, Vapor batch output changes=NO. "NO" for the Vapor observation is not itself a failure: the current Vapor backend does not use these VDOM transforms. A VDOM row whose options stop affecting output is automatically unranked.
- VERTER API CAPABILITY AUDIT (untimed): runtime-render emits compiled CSS=NO. The style adapter composes runtime-render + processStyle only while runtime-render returns no CSS; if an upgrade starts emitting CSS, that row is automatically unranked pending adapter revalidation so CSS cannot be charged twice.
- fervid and Vize's full-SFC APIs, Vue's composed compiler-sfc reference, and Verter's composed render+processStyle path are classified in the style-inclusive class because each timed row emits both JS and CSS. API composition and scheduling differences remain explicit row properties.
- fervid may emit the non-fatal HTML-strictness diagnostic NonVoidHtmlElementStartTagWithTrailingSolidus on self-closing non-void tags accepted by Vue. Only that complete diagnostic code is tolerated, and only with generated output; every other fervid diagnostic fails the timed row. The exact tolerated count is captured from each run.
- fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).
- fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=4), which is a fixed default of 4 rather than core count. It is reported, not tuned.
- Threading remains a row property inside a work-equivalence class. It never changes the reference: Vue stays the denominator even where a native batch is faster.
- Codegen validity gate: every compiler's output is parsed (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.
- The gate runs ONCE PER (target × environment) cell, with that cell's flags. It previously ran once on vdom/production and stamped the verdict onto the Vapor and development cells it had never exercised — Vapor is a different codegen backend and development mode emits different code, so a pass on one is not evidence about the other. Source maps are not a gate dimension: a map is emitted beside the code and cannot change whether the code parses.
- The gate builds each tool's compiler handle inside its own try, so a constructor that throws cannot destroy every row for the corpus. Missing or unmeasured mandatory validity is UNKNOWN and unranked.
- @vue/compiler-sfc, Vize and Verter are held to ONE error policy in the timed path: any non-empty top-level or per-file `errors` array fails the measure. fervid's sole exception is the exact NonVoidHtmlElementStartTagWithTrailingSolidus diagnostic code when code was still generated; all other diagnostics fail.
- Tool order is rotated on every fresh-process cold sample, discarded warmup and measured warm run; no tool is pinned to first position.
- COLD is the median first exact timed API call across fresh child processes, one child per row and sample. Child startup, package import, shared-input materialisation and Verter host/workspace construction are outside the timer, matching the warm call's setup boundary. Process-local V8/native initialization, Rayon/libuv thread initialization and allocator growth can be charged; OS page/filesystem caches are not flushed and are not claimed cold. WARM is the median same-process measured series after >= 1 discarded warmup. Cold and warm ratios are separate current/Vue comparisons, so values below 1.00x are faster than the Vue reference.

</details>

### compiler-section-win32

2026-08-20 · `fixtures/20` (20 files) · win32/x64 · source `compiler-section-win32.json`

> ⚠ **Local run — not the published Linux CI series** (win32/x64). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

#### Compiler

Files: **20** · Bytes: **26,401**

**Vue-anchored apples-to-apples compiler results.** Each target/environment/source-map cell contains two candidate-comparison subsections: Raw SFC compilation gives Vue, Vize batch and Verter first-admission the same revised style-free SFC strings; SFC compilation with CSS gives the style-capable entrypoints the same revised style-bearing SFCs and counts both generated JS and CSS. Ratios never cross these subsections and always use the official Vue workload as 1.00x. A failed semantic gate leaves the measured time visible but unranked.

##### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

###### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-compiler-section-win32-compile-vdom-production-sourcema-0saxhsy-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-compiler-section-win32-compile-vdom-production-sourcema-0saxhsy.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.6 (1T) | **16.9 ms** | 16.9 ms | n/a | n/a | 1.00x | 68,781 | 1.2k files/s | 63.0 MB |
| @vue/compiler-sfc 3.5 (1T) | **20.5 ms** | 20.5 ms | n/a | n/a | 1.22x | 68,781 | 975 files/s | 64.2 MB |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

###### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-compiler-section-win32-compile-vdom-production-sourcema-1h9asum-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-compiler-section-win32-compile-vdom-production-sourcema-1h9asum.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | **13.1 ms** | 13.1 ms | n/a | n/a | 1.00x | 68,761 | 1.5k files/s | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (1.1 ms) | (1.1 ms) | – | – | not ranked | (57,370) | – | (21.4 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (4.1 ms) | (4.1 ms) | – | – | not ranked | (49,123) | – | (67.1 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Rayon's process-global pool stays warm; ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Process/native-library and any process-global state can remain warm; no host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

###### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-compiler-section-win32-compile-vdom-production-sourcema-1w263fp-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-compiler-section-win32-compile-vdom-production-sourcema-1w263fp.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | **21.2 ms** | 21.2 ms | n/a | n/a | 1.00x | 72,043 | 942 files/s | 103.8 MB |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (3.9 ms) | (3.9 ms) | – | – | not ranked | (60,552) | – | (16.7 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (1.5 ms) | (1.5 ms) | – | – | not ranked | (60,552) | – | (21.6 MB) |
| fervid compileSync (1T) ⚠ | (3.9 ms) | (3.9 ms) | – | – | not ranked | (82,143) | – | (15.9 MB) |
| fervid compileAsync (4-thread libuv pool) ⚠ | (1.4 ms) | (1.4 ms) | – | – | not ranked | (82,143) | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (5.3 ms) | (5.3 ms) | – | – | not ranked | (54,947) | – | (68.6 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Rayon's process-global pool stays warm (threads omitted); input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 2/20 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 2/20 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: 16.9 ms
- **@vue/compiler-sfc 3.5 (1T)**: 20.5 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: 13.1 ms
- **Vize compileSfcBatchWithResults (raw render)**: 1.1 ms
- **Verter compileMany (first-admission stateless raw render)**: 4.1 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: 21.2 ms
- **Vize compileSfc loop (full SFC, 1T)**: 3.9 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: 1.5 ms
- **fervid compileSync (1T)**: 3.9 ms
- **fervid compileAsync (4-thread libuv pool)**: 1.4 ms
- **Verter compileMany + processStyle (render + CSS)**: 5.3 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=unique: 20/20 unique content SHAs. The exact compileSfcBatchWithResults path measured here does not have Vize's stats-only batch API's duplicate-body grouping, so duplicate bodies are disclosed for corpus representativeness rather than described as output-cache hits.
- Ratio columns are vs fastest — the fastest ranked row in each comparison class is the 1.00x denominator; no tool is pinned as a reference. Vue 3.5 anchors VDOM; Vue 3.6 anchors Vapor because 3.5 has no Vapor backend.
- Rows are split into explicit work-equivalence classes and ratios never cross those boundaries: official Vue-version context; Raw SFC compilation; and SFC compilation with CSS. The old unmatched Verter retained-host re-render row is not in the ranked surface; it remains available through diagnose:compile-warmth.
- The RAW RENDER class compares Vue, Vize and Verter on byte-identical, intentionally style-free SFC strings. &lt;style> blocks are removed from ALL three outside the timer by the class definition. This class measures SFC parse + script/template parse and analysis + render codegen, not CSS.
- Every raw-class cell/pass injects a distinct fixed-width semantically neutral comment into every present script and template block. This prevents Vue cross-cell source-cache contamination and previous whole-output reuse; all candidates in a cell receive the exact same revised strings. Revision and input-object construction happen outside the timer.
- Official Vue-version context rows use a separate fixed-width source namespace from the candidate raw class. This prevents the context row and Vue candidate baseline from lending each other same-compiler parse/template cache entries while preserving byte-identical Vue/Vize/Verter inputs inside the candidate class.
- The ranked raw Verter row creates a fresh workspace-backed host/project outside every timed pass, then measures first source admission through compileMany. requestedMode=stateless is explicit and cacheHit is asserted zero. Process/native-library state may remain warm, but no populated-host parsed, semantic, dependency-graph or output state crosses timed passes.
- The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one processStyle call per block. Generated JS and CSS bytes are both counted.
- TIMED STYLE CORPUS CENSUS: 17/20 files contain 17 style block(s): scoped=17, CSS Modules=0, v-bind=0, preprocessors=0, external src=0. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.
- STYLE CORRECTNESS GATE (untimed, mandatory for style ranking): suite 2026-08-20.1 (0878259fbadc) runs 16 independent plants covering ordinary and compound scoped selectors; :deep(), :slotted(), :global(), :is() and :where() semantics; selectors nested in @media/@supports; scoped keyframe declaration/reference consistency; multiple and quoted v-bind() expression linkage; and CSS Modules mapping. Checks assert semantic relationships, never whole generated-CSS equality. Vize compileSfc and one real multi-input compileSfcBatchWithResults call have separate verdicts; Verter uses one fresh-host multi-input compileMany followed by serial processStyle; fervid sync and async are checked separately. Any failure is measured but UNRANKED and self-clears after a fixed upgrade. Plants execute after timing so they cannot pre-warm measured entrypoints; manifest metadata is retained in validation.styleCorrectnessManifest.
- SASS/SCSS CAPABILITY AUDIT (untimed, diagnostic): suite 2026-08-20.2 (e302bbad5972) runs 8 independent lang=scss/lang=sass plants for variables, mixins/nesting, scoped selectors, :deep() inside @media, v-bind linkage and CSS Modules. validation.stylePreprocessors keeps two non-interchangeable verdicts: exactEntrypoints says whether the measured compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call; sharedSassAdapter first runs the pinned sass dependency once per plant and then tests only each compiler's downstream Vue-style transform. Harness preprocessing can never turn an unsupported exact API into PASS. These diagnostic plants do not gate the separately defined timed inline-plain-CSS class.
- RUNTIME SEMANTIC GATE (untimed, mandatory): suite 2026-08-20.2 runs 31 independent valid-SFC plants against observable DOM/events/updates/public-instance behaviour, never generated-text equality. It certifies Vue's composed non-inline API, Vize single and real multi-input batch, fresh-host stateless multi-input Verter compileMany, and fervid sync/async separately with the exact target/env/map flags. Each API runs in an isolated child after all timings; every outcome and the manifest hash are retained in validation.compileSemantics. FAIL, crash, timeout, missing verdict and UNKNOWN are measured but UNRANKED. Vapor output is executed with Vue's pinned, version-matched 3.6 compiler/runtime and shipped createVaporApp path; each Vapor entrypoint receives its own PASS/FAIL verdict, while unsupported backends remain UNKNOWN individually. VDOM evidence is never borrowed.
- Scheduling is not disguised as equal: Vue's reference and Vize compileSfc loop are 1T; Vize's with-results API compiles inside the process-global Rayon pool; Verter compileMany uses its host pool but public processStyle is synchronous and is called serially; fervid async uses libuv. Each row says so.
- Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.
- The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.
- ⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested from every compiler in a cell (Vue and Vize single-file: sourceMap; Vize batch: includeSourceMap; Verter: compileProfile.sourceMap/processStyle sourcemap; fervid: FervidJsCompilerOptions.sourceMap). Raw render requires a JS map. Style-inclusive rows emit two artifacts and therefore require both JS and CSS maps. Timed paths assert returned bytes whenever the installed capability exists. Current executable presence probe: Vize single JS=YES/CSS=NO, Vize batch JS=YES/CSS=NO, Verter runtime-render JS=NO/processStyle CSS=NO, fervid JS=YES/CSS=NO. Presence is not mapping correctness: all map-on timings remain UNRANKED until planted script/template/CSS positions are traced back to the correct input coordinates.
- TypeScript handling is ONE benchmark standard for the whole cell: PASSTHROUGH, requested identically from every compiler (Vue and fervid preserve annotations by their API behaviour; Vize via isTs:true; Verter via forceJs:false). The report describes the exact benchmark call rather than inferring behaviour from a separate Vite integration.
- Verter analysisLevel=full for every timed and validation call. The default benchmark setting is full; VERTER_ANALYSIS_LEVEL remains an explicit diagnostic override, and every Verter row prints the effective value so a tuned run cannot masquerade as the default. devMode follows the cell's isProduction value.
- Production vs development uses each tool's real semantic knobs: Vue isProd (hoistStatic + cacheHandlers); Vize templateHoistStatic + templateCacheHandlers; Verter isProduction + hmrStrategy; fervid isProduction.
- VIZE MODE CAPABILITY AUDIT (untimed): VDOM compileSfc=YES, VDOM compileSfcBatchWithResults=YES; Vapor compileSfc output changes=NO, Vapor batch output changes=NO. "NO" for the Vapor observation is not itself a failure: the current Vapor backend does not use these VDOM transforms. A VDOM row whose options stop affecting output is automatically unranked.
- VERTER API CAPABILITY AUDIT (untimed): runtime-render emits compiled CSS=NO. The style adapter composes runtime-render + processStyle only while runtime-render returns no CSS; if an upgrade starts emitting CSS, that row is automatically unranked pending adapter revalidation so CSS cannot be charged twice.
- fervid and Vize's full-SFC APIs, Vue's composed compiler-sfc reference, and Verter's composed render+processStyle path are classified in the style-inclusive class because each timed row emits both JS and CSS. API composition and scheduling differences remain explicit row properties.
- fervid may emit the non-fatal HTML-strictness diagnostic NonVoidHtmlElementStartTagWithTrailingSolidus on self-closing non-void tags accepted by Vue. Only that complete diagnostic code is tolerated, and only with generated output; every other fervid diagnostic fails the timed row. The exact tolerated count is captured from each run.
- fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).
- fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=4), which is a fixed default of 4 rather than core count. It is reported, not tuned.
- Threading remains a row property inside a work-equivalence class. It never changes the reference: Vue stays the denominator even where a native batch is faster.
- Codegen validity gate: every compiler's output is parsed (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.
- The gate runs ONCE PER (target × environment) cell, with that cell's flags. It previously ran once on vdom/production and stamped the verdict onto the Vapor and development cells it had never exercised — Vapor is a different codegen backend and development mode emits different code, so a pass on one is not evidence about the other. Source maps are not a gate dimension: a map is emitted beside the code and cannot change whether the code parses.
- The gate builds each tool's compiler handle inside its own try, so a constructor that throws cannot destroy every row for the corpus. Missing or unmeasured mandatory validity is UNKNOWN and unranked.
- @vue/compiler-sfc, Vize and Verter are held to ONE error policy in the timed path: any non-empty top-level or per-file `errors` array fails the measure. fervid's sole exception is the exact NonVoidHtmlElementStartTagWithTrailingSolidus diagnostic code when code was still generated; all other diagnostics fail.
- Tool order is rotated on every warmup and measured run; no tool is pinned to first position.
- Ranking metric is the median of measured runs, all taken after >= 1 discarded warmup. No cold column. Candidate ratios are current/Vue, so values below 1.00x are faster than the Vue reference.

</details>

### bench-win32-20

2026-08-20 · `fixtures/20` (20 files) · win32/x64 · source `bench-win32-20.json`

> ⚠ **Local run — not the published Linux CI series** (win32/x64). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

#### SFC compile (unique contents)

Files: **20** · Bytes: **26,401**

Compile results are **grouped by target × environment × source map**, then by comparison class.

##### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

###### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-20-compile-vdom-production-sourcemap-off-of-0bxrd6u-dark.svg">
  <img alt="SFC compile (unique contents) — VDOM · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-win32-20-compile-vdom-production-sourcemap-off-of-0bxrd6u.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (1T) | **15.1 ms** | 15.1 ms | n/a | n/a | 1.00x | 68,781 | 1.3k files/s | 64.2 MB |
| @vue/compiler-sfc 3.6 (1T) | **16.9 ms** | 16.9 ms | n/a | n/a | 1.12x | 68,781 | 1.2k files/s | 63.0 MB |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

###### Raw render — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-20-compile-vdom-production-sourcemap-off-ra-0uj8r4o-dark.svg">
  <img alt="SFC compile (unique contents) — VDOM · production · sourcemap off — Raw render — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-win32-20-compile-vdom-production-sourcemap-off-ra-0uj8r4o.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | **14.1 ms** | 14.1 ms | n/a | n/a | 1.00x | 68,761 | 1.4k files/s | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | (57,370) | – | (21.4 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (4.2 ms) | (4.2 ms) | – | – | not ranked | (49,123) | – | (67.1 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Rayon's process-global pool stays warm; ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Process/native-library and any process-global state can remain warm; no host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

###### SFC render + CSS — every script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-20-compile-vdom-production-sourcemap-off-sf-0ozxcj9-dark.svg">
  <img alt="SFC compile (unique contents) — VDOM · production · sourcemap off — SFC render + CSS — every script, template and style changed" src="charts/compiler-bench-win32-20-compile-vdom-production-sourcemap-off-sf-0ozxcj9.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | **21.7 ms** | 21.7 ms | n/a | n/a | 1.00x | 72,043 | 920 files/s | 103.8 MB |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (4.0 ms) | (4.0 ms) | – | – | not ranked | (60,552) | – | (16.7 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (1.4 ms) | (1.4 ms) | – | – | not ranked | (60,552) | – | (21.6 MB) |
| fervid compileSync (1T) ⚠ | (3.8 ms) | (3.8 ms) | – | – | not ranked | (82,143) | – | (15.9 MB) |
| fervid compileAsync (4-thread libuv pool) ⚠ | (1.5 ms) | (1.5 ms) | – | – | not ranked | (82,143) | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (4.5 ms) | (4.5 ms) | – | – | not ranked | (54,947) | – | (68.6 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Rayon's process-global pool stays warm (threads omitted); input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 2/20 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 2/20 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: 15.1 ms
- **@vue/compiler-sfc 3.6 (1T)**: 16.9 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: 14.1 ms
- **Vize compileSfcBatchWithResults (raw render)**: 1.0 ms
- **Verter compileMany (first-admission stateless raw render)**: 4.2 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: 21.7 ms
- **Vize compileSfc loop (full SFC, 1T)**: 4.0 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: 1.4 ms
- **fervid compileSync (1T)**: 3.8 ms
- **fervid compileAsync (4-thread libuv pool)**: 1.5 ms
- **Verter compileMany + processStyle (render + CSS)**: 4.5 ms

</details>

##### VAPOR · production · sourcemap off

Target: `vapor` · Environment: `production` · Source map: `off`

###### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-20-compile-vapor-production-sourcemap-off-o-166kkv4-dark.svg">
  <img alt="SFC compile (unique contents) — VAPOR · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-win32-20-compile-vapor-production-sourcemap-off-o-166kkv4.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – | – |
| @vue/compiler-sfc 3.6 (1T) ⚠ | (26.6 ms) | (26.6 ms) | – | – | not ranked | (66,489) | – | (72.0 MB) |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **@vue/compiler-sfc 3.6 (1T) ⚠**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=true, sourceMap=false ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

###### Raw render — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-20-compile-vapor-production-sourcemap-off-r-18mtevq-dark.svg">
  <img alt="SFC compile (unique contents) — VAPOR · production · sourcemap off — Raw render — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-win32-20-compile-vapor-production-sourcemap-off-r-18mtevq.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠ | (24.1 ms) | (24.1 ms) | – | – | not ranked | (66,469) | – | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (1.3 ms) | (1.3 ms) | – | – | not ranked | (70,616) | – | (20.9 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (5.3 ms) | (5.3 ms) | – | – | not ranked | (52,884) | – | (65.8 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Rayon's process-global pool stays warm; ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Process/native-library and any process-global state can remain warm; no host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/31 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; define-emits-payload [runtime]: _setText is not defined; native-v-model-modifiers [runtime]: _setText is not defined; +24 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

###### SFC render + CSS — every script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-win32-20-compile-vapor-production-sourcemap-off-s-1tte4kn-dark.svg">
  <img alt="SFC compile (unique contents) — VAPOR · production · sourcemap off — SFC render + CSS — every script, template and style changed" src="charts/compiler-bench-win32-20-compile-vapor-production-sourcemap-off-s-1tte4kn.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠ | (27.9 ms) | (27.9 ms) | – | – | not ranked | (73,915) | – | (114.7 MB) |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (4.0 ms) | (4.0 ms) | – | – | not ranked | (74,774) | – | (15.4 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (1.6 ms) | (1.6 ms) | – | – | not ranked | (74,774) | – | (20.4 MB) |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (5.3 ms) | (5.3 ms) | – | – | not ranked | (58,708) | – | (68.7 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (28/31 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Rayon's process-global pool stays warm (threads omitted); input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (22/31 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5. ⚠ STYLE CORRECTNESS GATE NOT RUN for @fervid/napi; a render+CSS result without the 16-plant CSS semantics suite is not ranked.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/31 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; define-emits-payload [runtime]: _setText is not defined; native-v-model-modifiers [runtime]: _setText is not defined; +24 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: 26.6 ms
- **Vue compiler-sfc 3.6 reference (raw render, 1T)**: 24.1 ms
- **Vize compileSfcBatchWithResults (raw render)**: 1.3 ms
- **Verter compileMany (first-admission stateless raw render)**: 5.3 ms
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T)**: 27.9 ms
- **Vize compileSfc loop (full SFC, 1T)**: 4.0 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: 1.6 ms
- **Verter compileMany + processStyle (render + CSS)**: 5.3 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=unique: 20/20 unique content SHAs. The exact compileSfcBatchWithResults path measured here does not have Vize's stats-only batch API's duplicate-body grouping, so duplicate bodies are disclosed for corpus representativeness rather than described as output-cache hits.
- Ratio columns are vs fastest — the fastest ranked row in each comparison class is the 1.00x denominator; no tool is pinned as a reference. Vue 3.5 anchors VDOM; Vue 3.6 anchors Vapor because 3.5 has no Vapor backend.
- Rows are split into explicit work-equivalence classes and ratios never cross those boundaries: official Vue-version context; raw render; and SFC render + CSS. The old unmatched Verter retained-host re-render row is not in the ranked surface; it remains available through diagnose:compile-warmth.
- The RAW RENDER class compares Vue, Vize and Verter on byte-identical, intentionally style-free SFC strings. &lt;style> blocks are removed from ALL three outside the timer by the class definition. This class measures SFC parse + script/template parse and analysis + render codegen, not CSS.
- Every raw-class cell/pass injects a distinct fixed-width semantically neutral comment into every present script and template block. This prevents Vue cross-cell source-cache contamination and previous whole-output reuse; all candidates in a cell receive the exact same revised strings. Revision and input-object construction happen outside the timer.
- Official Vue-version context rows use a separate fixed-width source namespace from the candidate raw class. This prevents the context row and Vue candidate baseline from lending each other same-compiler parse/template cache entries while preserving byte-identical Vue/Vize/Verter inputs inside the candidate class.
- The ranked raw Verter row creates a fresh workspace-backed host/project outside every timed pass, then measures first source admission through compileMany. requestedMode=stateless is explicit and cacheHit is asserted zero. Process/native-library state may remain warm, but no populated-host parsed, semantic, dependency-graph or output state crosses timed passes.
- The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one processStyle call per block. Generated JS and CSS bytes are both counted.
- TIMED STYLE CORPUS CENSUS: 17/20 files contain 17 style block(s): scoped=17, CSS Modules=0, v-bind=0, preprocessors=0, external src=0. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.
- STYLE CORRECTNESS GATE (untimed, mandatory for style ranking): suite 2026-08-20.1 (0878259fbadc) runs 16 independent plants covering ordinary and compound scoped selectors; :deep(), :slotted(), :global(), :is() and :where() semantics; selectors nested in @media/@supports; scoped keyframe declaration/reference consistency; multiple and quoted v-bind() expression linkage; and CSS Modules mapping. Checks assert semantic relationships, never whole generated-CSS equality. Vize compileSfc and one real multi-input compileSfcBatchWithResults call have separate verdicts; Verter uses one fresh-host multi-input compileMany followed by serial processStyle; fervid sync and async are checked separately. Any failure is measured but UNRANKED and self-clears after a fixed upgrade. Plants execute after timing so they cannot pre-warm measured entrypoints; manifest metadata is retained in validation.styleCorrectnessManifest.
- SASS/SCSS CAPABILITY AUDIT (untimed, diagnostic): suite 2026-08-20.2 (e302bbad5972) runs 8 independent lang=scss/lang=sass plants for variables, mixins/nesting, scoped selectors, :deep() inside @media, v-bind linkage and CSS Modules. validation.stylePreprocessors keeps two non-interchangeable verdicts: exactEntrypoints says whether the measured compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call; sharedSassAdapter first runs the pinned sass dependency once per plant and then tests only each compiler's downstream Vue-style transform. Harness preprocessing can never turn an unsupported exact API into PASS. These diagnostic plants do not gate the separately defined timed inline-plain-CSS class.
- RUNTIME SEMANTIC GATE (untimed, mandatory): suite 2026-08-20.2 runs 31 independent valid-SFC plants against observable DOM/events/updates/public-instance behaviour, never generated-text equality. It certifies Vue's composed non-inline API, Vize single and real multi-input batch, fresh-host stateless multi-input Verter compileMany, and fervid sync/async separately with the exact target/env/map flags. Each API runs in an isolated child after all timings; every outcome and the manifest hash are retained in validation.compileSemantics. FAIL, crash, timeout, missing verdict and UNKNOWN are measured but UNRANKED. Vapor output is executed with Vue's pinned, version-matched 3.6 compiler/runtime and shipped createVaporApp path; each Vapor entrypoint receives its own PASS/FAIL verdict, while unsupported backends remain UNKNOWN individually. VDOM evidence is never borrowed.
- Scheduling is not disguised as equal: Vue's reference and Vize compileSfc loop are 1T; Vize's with-results API compiles inside the process-global Rayon pool; Verter compileMany uses its host pool but public processStyle is synchronous and is called serially; fervid async uses libuv. Each row says so.
- Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.
- The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.
- ⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested from every compiler in a cell (Vue and Vize single-file: sourceMap; Vize batch: includeSourceMap; Verter: compileProfile.sourceMap/processStyle sourcemap; fervid: FervidJsCompilerOptions.sourceMap). Raw render requires a JS map. Style-inclusive rows emit two artifacts and therefore require both JS and CSS maps. Timed paths assert returned bytes whenever the installed capability exists. Current executable presence probe: Vize single JS=YES/CSS=NO, Vize batch JS=YES/CSS=NO, Verter runtime-render JS=NO/processStyle CSS=NO, fervid JS=YES/CSS=NO. Presence is not mapping correctness: all map-on timings remain UNRANKED until planted script/template/CSS positions are traced back to the correct input coordinates.
- TypeScript handling is ONE benchmark standard for the whole cell: PASSTHROUGH, requested identically from every compiler (Vue and fervid preserve annotations by their API behaviour; Vize via isTs:true; Verter via forceJs:false). The report describes the exact benchmark call rather than inferring behaviour from a separate Vite integration.
- Verter analysisLevel=full for every timed and validation call. The default benchmark setting is full; VERTER_ANALYSIS_LEVEL remains an explicit diagnostic override, and every Verter row prints the effective value so a tuned run cannot masquerade as the default. devMode follows the cell's isProduction value.
- Production vs development uses each tool's real semantic knobs: Vue isProd (hoistStatic + cacheHandlers); Vize templateHoistStatic + templateCacheHandlers; Verter isProduction + hmrStrategy; fervid isProduction.
- VIZE MODE CAPABILITY AUDIT (untimed): VDOM compileSfc=YES, VDOM compileSfcBatchWithResults=YES; Vapor compileSfc output changes=NO, Vapor batch output changes=NO. "NO" for the Vapor observation is not itself a failure: the current Vapor backend does not use these VDOM transforms. A VDOM row whose options stop affecting output is automatically unranked.
- VERTER API CAPABILITY AUDIT (untimed): runtime-render emits compiled CSS=NO. The style adapter composes runtime-render + processStyle only while runtime-render returns no CSS; if an upgrade starts emitting CSS, that row is automatically unranked pending adapter revalidation so CSS cannot be charged twice.
- fervid and Vize's full-SFC APIs, Vue's composed compiler-sfc reference, and Verter's composed render+processStyle path are classified in the style-inclusive class because each timed row emits both JS and CSS. API composition and scheduling differences remain explicit row properties.
- fervid may emit the non-fatal HTML-strictness diagnostic NonVoidHtmlElementStartTagWithTrailingSolidus on self-closing non-void tags accepted by Vue. Only that complete diagnostic code is tolerated, and only with generated output; every other fervid diagnostic fails the timed row. The exact tolerated count is captured from each run.
- fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).
- fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=4), which is a fixed default of 4 rather than core count. It is reported, not tuned.
- Threading remains a row property inside a work-equivalence class. It never changes the reference: Vue stays the denominator even where a native batch is faster.
- Codegen validity gate: every compiler's output is parsed (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.
- The gate runs ONCE PER (target × environment) cell, with that cell's flags. It previously ran once on vdom/production and stamped the verdict onto the Vapor and development cells it had never exercised — Vapor is a different codegen backend and development mode emits different code, so a pass on one is not evidence about the other. Source maps are not a gate dimension: a map is emitted beside the code and cannot change whether the code parses.
- The gate builds each tool's compiler handle inside its own try, so a constructor that throws cannot destroy every row for the corpus. Missing or unmeasured mandatory validity is UNKNOWN and unranked.
- @vue/compiler-sfc, Vize and Verter are held to ONE error policy in the timed path: any non-empty top-level or per-file `errors` array fails the measure. fervid's sole exception is the exact NonVoidHtmlElementStartTagWithTrailingSolidus diagnostic code when code was still generated; all other diagnostics fail.
- Tool order is rotated on every warmup and measured run; no tool is pinned to first position.
- Ranking metric is the median of measured runs, all taken after >= 1 discarded warmup. No cold column. Candidate ratios are current/Vue, so values below 1.00x are faster than the Vue reference.

</details>

### bench-Linux-200-bench

2026-08-19 · `fixtures/200` (200 files) · linux/x64 · source `bench-Linux-200-bench.json`

#### SFC compile (unique contents)

Files: **200** · Bytes: **285,701**

Compile results are **grouped by target × environment × source map**, then by comparison class.

##### VDOM · production · sourcemap off

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vdom-production-sourcemap-off-dark.svg">
  <img alt="SFC compile (unique contents) — VDOM · production · sourcemap off" src="charts/compiler-bench-linux-200-bench-compile-vdom-production-sourcemap-off.svg">
</picture>

Target: `vdom` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **21.5 ms** | 20.9 ms | 0.4 ms | 2.1% | 1.00x | 609,596 | 9.3k files/s | 18.2 MB |
| Verter compileMany (session cache) | **22.5 ms** | 16.8 ms | 4.8 ms | 21.2% ⚠ | 1.04x | 548,989 | 8.9k files/s | – |
| Vize native loop (1T) | **58.2 ms** | 57.8 ms | 0.3 ms | 0.6% | 2.70x | 609,596 | 3.4k files/s | 16.7 MB |
| Verter compileMany (stateless) | **125.3 ms** | 121.3 ms | 3.7 ms | 2.9% | 5.82x | 548,989 | 1.6k files/s | 38.0 MB |
| @vue/compiler-sfc 3.6 (1T) | **179.4 ms** | 174.4 ms | 6.1 ms | 3.4% | 8.34x | 670,030 | 1.1k files/s | 63.0 MB |
| @vue/compiler-sfc 3.5 (1T) | **181.1 ms** | 171.2 ms | 8.5 ms | 4.7% | 8.42x | 670,030 | 1.1k files/s | 64.2 MB |
| fervid compileSync (1T) ⚠ | (57.6 ms) | (57.0 ms) | – | – | not ranked | (775,738) | – | (15.9 MB) |
| fervid compileAsync (4-thread libuv pool) ⚠ | (27.8 ms) | (26.9 ms) | – | – | not ranked | (775,738) | – | – |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent workspace-backed host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, isTs=true (TS passthrough — the cell's uniform standard; ⓘ Vize's own Vite plugin omits this flag, so a drop-in Vite user gets Vize STRIPPING types on every lang="ts" file — more work than benchmarked here), sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=true, forceJs=false (TS passthrough — the cell's uniform standard, and Verter's own Vite path), sourceMap=false, hmr=none, mode=stateless, analysis=full (the drop-in default — Verter's official plugin sets none, which means full), multi-thread host pool, workspace-backed host (project root as workspace — documented compileMany usage, same provision the fs bridge gives @vue/compiler-sfc) cacheHits≈0
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. ⚠ also compiles &lt;style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles &lt;style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 21.7 ms, 20.9 ms, 21.2 ms, 21.5 ms, 22.0 ms
- **Verter compileMany (session cache)**: 20.2 ms, 16.8 ms, 22.5 ms, 27.6 ms, 27.8 ms
- **Vize native loop (1T)**: 58.7 ms, 58.2 ms, 57.8 ms, 58.0 ms, 58.2 ms
- **Verter compileMany (stateless)**: 127.1 ms, 121.3 ms, 125.3 ms, 131.2 ms, 124.2 ms
- **@vue/compiler-sfc 3.6 (1T)**: 180.9 ms, 179.4 ms, 174.4 ms, 175.6 ms, 189.9 ms
- **@vue/compiler-sfc 3.5 (1T)**: 195.0 ms, 179.3 ms, 181.8 ms, 171.2 ms, 181.1 ms
- **fervid compileSync (1T)**: 57.8 ms, 57.4 ms, 57.0 ms, 57.7 ms, 57.6 ms
- **fervid compileAsync (4-thread libuv pool)**: 27.5 ms, 28.2 ms, 27.8 ms, 27.9 ms, 26.9 ms

</details>

##### VDOM · development · sourcemap off

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vdom-development-sourcemap-off-dark.svg">
  <img alt="SFC compile (unique contents) — VDOM · development · sourcemap off" src="charts/compiler-bench-linux-200-bench-compile-vdom-development-sourcemap-off.svg">
</picture>

Target: `vdom` · Environment: `development` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **26.8 ms** | 22.7 ms | 1.9 ms | 7.1% | 1.00x | 609,596 | 7.5k files/s |
| Verter compileMany (session cache) | **32.7 ms** | 23.8 ms | 5.6 ms | 17.0% ⚠ | 1.22x | 671,880 | 6.1k files/s |
| Vize native loop (1T) | **58.6 ms** | 58.3 ms | 1.5 ms | 2.5% | 2.19x | 609,596 | 3.4k files/s |
| Verter compileMany (stateless) | **133.1 ms** | 124.2 ms | 5.6 ms | 4.2% | 4.97x | 671,880 | 1.5k files/s |
| @vue/compiler-sfc 3.6 (1T) | **158.7 ms** | 152.5 ms | 8.9 ms | 5.6% | 5.93x | 656,372 | 1.3k files/s |
| @vue/compiler-sfc 3.5 (1T) | **168.0 ms** | 156.6 ms | 12.6 ms | 7.5% | 6.28x | 656,372 | 1.2k files/s |
| fervid compileSync (1T) ⚠ | (58.4 ms) | (58.1 ms) | – | – | not ranked | (787,866) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (33.5 ms) | (30.2 ms) | – | – | not ranked | (787,866) | – |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=false, sourceMap=false, mode=session, analysis=full — persistent workspace-backed host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **Vize native loop (1T)**: compileSfc vapor=false, isTs=true (TS passthrough — the cell's uniform standard; ⓘ Vize's own Vite plugin omits this flag, so a drop-in Vite user gets Vize STRIPPING types on every lang="ts" file — more work than benchmarked here), sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=false, forceJs=false (TS passthrough — the cell's uniform standard, and Verter's own Vite path), sourceMap=false, hmr=vite, mode=stateless, analysis=full (the drop-in default — Verter's official plugin sets none, which means full), multi-thread host pool, workspace-backed host (project root as workspace — documented compileMany usage, same provision the fs bridge gives @vue/compiler-sfc) cacheHits≈0
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=false, sourceMap=false
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=false, sourceMap=false, single-threaded
- **fervid compileSync (1T) ⚠**: compileSync isProduction=false, sourceMap=false, single-threaded. ⚠ also compiles &lt;style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (41:97)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=false, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles &lt;style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (41:97)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 22.7 ms, 27.4 ms, 26.9 ms, 26.8 ms, 26.6 ms
- **Verter compileMany (session cache)**: 33.8 ms, 37.2 ms, 23.8 ms, 32.7 ms, 26.2 ms
- **Vize native loop (1T)**: 61.2 ms, 58.6 ms, 58.5 ms, 61.0 ms, 58.3 ms
- **Verter compileMany (stateless)**: 136.9 ms, 134.7 ms, 124.2 ms, 125.8 ms, 133.1 ms
- **@vue/compiler-sfc 3.6 (1T)**: 167.6 ms, 158.7 ms, 152.5 ms, 174.2 ms, 156.3 ms
- **@vue/compiler-sfc 3.5 (1T)**: 168.0 ms, 185.4 ms, 167.9 ms, 185.7 ms, 156.6 ms
- **fervid compileSync (1T)**: 59.5 ms, 59.2 ms, 58.4 ms, 58.1 ms, 58.3 ms
- **fervid compileAsync (4-thread libuv pool)**: 30.2 ms, 35.2 ms, 30.7 ms, 35.2 ms, 33.5 ms

</details>

##### VAPOR · production · sourcemap off

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcemap-off-dark.svg">
  <img alt="SFC compile (unique contents) — VAPOR · production · sourcemap off" src="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcemap-off.svg">
</picture>

Target: `vapor` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter compileMany (session cache) | **21.3 ms** | 18.4 ms | 1.9 ms | 8.9% | 1.00x | 585,310 | 9.4k files/s | – |
| Vize native batch (max threads) | **22.2 ms** | 21.6 ms | 0.8 ms | 3.4% | 1.04x | 754,214 | 9.0k files/s | 17.6 MB |
| Vize native loop (1T) | **61.0 ms** | 60.5 ms | 0.3 ms | 0.5% | 2.86x | 754,214 | 3.3k files/s | 15.4 MB |
| Verter compileMany (stateless) | **127.4 ms** | 120.5 ms | 3.4 ms | 2.7% | 5.98x | 585,310 | 1.6k files/s | 37.9 MB |
| @vue/compiler-sfc 3.6 (1T) | **347.2 ms** | 325.6 ms | 14.2 ms | 4.1% | 16.29x | 681,563 | 576 files/s | 72.0 MB |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – | – |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – | – |

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

- **Verter compileMany (session cache)**: 21.3 ms, 22.9 ms, 20.8 ms, 23.0 ms, 18.4 ms
- **Vize native batch (max threads)**: 22.3 ms, 21.9 ms, 23.6 ms, 22.2 ms, 21.6 ms
- **Vize native loop (1T)**: 61.3 ms, 60.5 ms, 60.7 ms, 61.0 ms, 61.0 ms
- **Verter compileMany (stateless)**: 120.5 ms, 124.8 ms, 129.4 ms, 127.7 ms, 127.4 ms
- **@vue/compiler-sfc 3.6 (1T)**: 350.6 ms, 362.1 ms, 334.7 ms, 325.6 ms, 347.2 ms

</details>

##### VAPOR · development · sourcemap off

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcemap-off-dark.svg">
  <img alt="SFC compile (unique contents) — VAPOR · development · sourcemap off" src="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcemap-off.svg">
</picture>

Target: `vapor` · Environment: `development` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter compileMany (session cache) | **21.7 ms** | 17.6 ms | 4.4 ms | 20.2% ⚠ | 1.00x | 621,048 | 9.2k files/s |
| Vize native batch (max threads) | **22.3 ms** | 21.8 ms | 0.3 ms | 1.2% | 1.03x | 754,214 | 9.0k files/s |
| Vize native loop (1T) | **61.2 ms** | 60.5 ms | 0.8 ms | 1.4% | 2.82x | 754,214 | 3.3k files/s |
| Verter compileMany (stateless) | **126.5 ms** | 124.2 ms | 3.8 ms | 3.0% | 5.83x | 621,048 | 1.6k files/s |
| @vue/compiler-sfc 3.6 (1T) | **298.5 ms** | 290.8 ms | 7.4 ms | 2.5% | 13.76x | 683,301 | 670 files/s |
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

- **Verter compileMany (session cache)**: 17.6 ms, 24.3 ms, 28.6 ms, 19.2 ms, 21.7 ms
- **Vize native batch (max threads)**: 22.0 ms, 22.3 ms, 22.5 ms, 22.4 ms, 21.8 ms
- **Vize native loop (1T)**: 61.6 ms, 62.7 ms, 60.5 ms, 61.0 ms, 61.2 ms
- **Verter compileMany (stateless)**: 124.2 ms, 126.5 ms, 133.8 ms, 129.0 ms, 125.4 ms
- **@vue/compiler-sfc 3.6 (1T)**: 307.3 ms, 296.6 ms, 298.5 ms, 308.4 ms, 290.8 ms

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
- ⚠ fervid compiles &lt;style> blocks inside compileSync — every other row measures parse + script + template only. fervid's rows do strictly more work per file than the rows they are ranked against; there is no option to disable it.
- ⚠ fervid emits non-fatal HTML-strictness diagnostics (NonVoidHtmlElementStartTagWithTrailingSolidus) on self-closing non-void tags such as &lt;div /> and &lt;MyComp />, which Vue's SFC parser accepts — 44 of them on the 200-file corpus. Verified on this corpus: codegen is still complete and correct for those files, so fervid is gated on codegen actually being produced for every file — the same gate every other compiler here gets — rather than on diagnostic silence. Per-run diagnostic totals are captured in the JSON report's meta samples.
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

#### JSX compile

Files: **200** · Bytes: **38,804**

###### VAPOR — ranked alone

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-jsx-compile-vapor-ranked-alone-dark.svg">
  <img alt="JSX compile — VAPOR — ranked alone" src="charts/compiler-bench-linux-200-bench-jsx-compile-vapor-ranked-alone.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (vapor) | **4.3 ms** | 4.1 ms | 0.7 ms | 15.2% ⚠ | 1.00x | n/a | 46.3k files/s |
| vue-jsx-vapor/api | **5.0 ms** | 5.0 ms | 0.1 ms | 1.7% | 1.16x | n/a | 39.9k files/s |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (vapor)**: Rust/Oxc transform; default vapor mode (see vuejs/vue-jsx-vapor). Same unique .jsx corpus as other JSX rows.
- **vue-jsx-vapor/api**: transformVueJsxVapor() public API (vapor default).

</details>

###### VDOM — ranked alone

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-jsx-compile-vdom-ranked-alone-dark.svg">
  <img alt="JSX compile — VDOM — ranked alone" src="charts/compiler-bench-linux-200-bench-jsx-compile-vdom-ranked-alone.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | **3.5 ms** | 3.5 ms | 0.3 ms | 8.1% | 1.00x | n/a | 56.6k files/s |
| @vue/babel-plugin-jsx (Babel VDOM) | **118.9 ms** | 111.7 ms | 12.4 ms | 10.4% ⚠ | 33.65x | n/a | 1.7k files/s |

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

- **@vue-jsx-vapor/compiler-rs (vapor)**: 4.4 ms, 4.3 ms, 5.7 ms, 4.3 ms, 4.1 ms
- **vue-jsx-vapor/api**: 5.0 ms, 5.2 ms, 5.0 ms, 5.0 ms, 5.1 ms
- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: 3.5 ms, 4.1 ms, 3.5 ms, 3.8 ms, 3.5 ms
- **@vue/babel-plugin-jsx (Babel VDOM)**: 138.4 ms, 138.5 ms, 118.9 ms, 118.7 ms, 111.7 ms

</details>

## Single-file compile (size ladder)

2026-08-19 · win32/x64 · source `compile-single-win32.json`

> ⚠ **Local run — not the published Linux CI series** (win32/x64). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

- Size ladder fixtures: tiny → small → medium → large → xlarge (see fixtures/compile-single/).
- Every compiler receives the same STYLE-FREE render corpus by definition of this raw-render microbenchmark; style removal happens before timing.
- Each cell and iteration uses fixed-width, semantically neutral comments in every present template and script block, preventing cross-cell whole-source reuse while preserving identical candidate inputs.
- Verter gets a fresh workspace-backed host/project in tinybench beforeEach; the timed compileMany call measures first source admission. requestedMode=stateless, analysisLevel=full and cacheHit=false are asserted.
- Vize receives the same per-iteration revised source as Vue and Verter, so a prior generated artifact cannot satisfy a measured call even if a future release adds caching.
- Source maps are disabled for every tool in this microbenchmark; map generation is a separate bulk-matrix dimension.
- First call is not a fresh-process cold metric: modules are loaded and Verter host/project construction is excluded; use diagnose:compile-warmth for fresh-child comparisons.
- Mean ranked ascending (lower latency better) within each fixture × target.
- Default: 20 warmup + 100 measured iterations (Verter apple-to-apple style).
- Host/session/identical-source experiments are intentionally excluded; use diagnose:compile-warmth for those diagnostics.
- Vue 3.5 omitted from vapor suites. Not comparable to bulk fixtures/N throughput.

### tiny — 80 bytes · vdom · production

| Tool | First call | Mean | ops/s | Samples | RME |
| --- | ---: | ---: | ---: | ---: | ---: |
| Vize compileSfc (style-free render) | 0.6 ms | **0.012 ms** | 84,567 | 82986 | ±0.4% |
| @vue/compiler-sfc 3.5 | 2.4 ms | **0.037 ms** | 31,643 | 27197 | ±2.6% |
| @vue/compiler-sfc 3.6 | 3.2 ms | **0.039 ms** | 30,305 | 25927 | ±2.8% |
| Verter runtime-render (first-admission stateless raw render) | 1.7 ms | **3.770 ms** | 304 | 267 | ±4.5% |

## Repeated-input study

A study, not a ranking: identical file bodies probe output-cache behaviour. Source: `results/benchmarks/bench-Linux-200-repeated-cache-demo.json`.

#### SFC compile (⚠ 199 duplicate bodies — content-hash caches may inflate throughput)

Files: **200** · Bytes: **46,600**

Compile results are **grouped by target × environment × source map**, then by comparison class.

##### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native batch (max threads) | **7.3 ms** | 7.3 ms | 0.1 ms | 1.0% | 1.00x | 107,800 | 27.4k files/s | 18.2 MB |
| Verter compileMany (session cache) | **9.5 ms** | 9.4 ms | 0.2 ms | 2.2% | 1.30x | 140,600 | 21.0k files/s | – |
| fervid compileAsync (4-thread libuv pool) | **9.7 ms** | 8.5 ms | 1.8 ms | 18.6% ⚠ | 1.33x | 120,600 | 20.5k files/s | – |
| fervid compileSync (1T) | **12.1 ms** | 12.0 ms | 0.1 ms | 0.7% | 1.65x | 120,600 | 16.5k files/s | 15.9 MB |
| Vize native loop (1T) | **21.0 ms** | 20.7 ms | 0.4 ms | 1.7% | 2.87x | 107,800 | 9.5k files/s | 16.7 MB |
| @vue/compiler-sfc 3.5 (1T) | **53.2 ms** | 52.8 ms | 0.6 ms | 1.1% | 7.28x | 153,800 | 3.8k files/s | 64.2 MB |
| @vue/compiler-sfc 3.6 (1T) | **54.9 ms** | 54.4 ms | 0.7 ms | 1.3% | 7.51x | 153,800 | 3.6k files/s | 63.0 MB |
| Verter compileMany (stateless) | **106.9 ms** | 104.1 ms | 4.0 ms | 3.7% | 14.63x | 140,600 | 1.9k files/s | 38.0 MB |

<details><summary>Notes</summary>

- **Vize native batch (max threads)**: compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.
- **Verter compileMany (session cache)**: runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent workspace-backed host, cacheHits reported; not comparable to the cache-free batch rows cacheHits≈0
- **fervid compileAsync (4-thread libuv pool)**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). ⚠ also compiles &lt;style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence.
- **fervid compileSync (1T)**: compileSync isProduction=true, sourceMap=false, single-threaded. ⚠ also compiles &lt;style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence.
- **Vize native loop (1T)**: compileSfc vapor=false, isTs=true (TS passthrough — the cell's uniform standard; ⓘ Vize's own Vite plugin omits this flag, so a drop-in Vite user gets Vize STRIPPING types on every lang="ts" file — more work than benchmarked here), sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.
- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false
- **Verter compileMany (stateless)**: runtime-render forceVapor=false, isProduction=true, forceJs=false (TS passthrough — the cell's uniform standard, and Verter's own Vite path), sourceMap=false, hmr=none, mode=stateless, analysis=full (the drop-in default — Verter's official plugin sets none, which means full), multi-thread host pool, workspace-backed host (project root as workspace — documented compileMany usage, same provision the fs bridge gives @vue/compiler-sfc) cacheHits≈0

</details>

<details><summary>Raw runs</summary>

- **Vize native batch (max threads)**: 7.3 ms, 7.4 ms
- **Verter compileMany (session cache)**: 9.7 ms, 9.4 ms
- **fervid compileAsync (4-thread libuv pool)**: 11.0 ms, 8.5 ms
- **fervid compileSync (1T)**: 12.0 ms, 12.2 ms
- **Vize native loop (1T)**: 20.7 ms, 21.2 ms
- **@vue/compiler-sfc 3.5 (1T)**: 53.7 ms, 52.8 ms
- **@vue/compiler-sfc 3.6 (1T)**: 54.4 ms, 55.4 ms
- **Verter compileMany (stateless)**: 109.8 ms, 104.1 ms

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
- ⚠ fervid compiles &lt;style> blocks inside compileSync — every other row measures parse + script + template only. fervid's rows do strictly more work per file than the rows they are ranked against; there is no option to disable it.
- ⚠ fervid emits non-fatal HTML-strictness diagnostics (NonVoidHtmlElementStartTagWithTrailingSolidus) on self-closing non-void tags such as &lt;div /> and &lt;MyComp />, which Vue's SFC parser accepts — 44 of them on the 200-file corpus. Verified on this corpus: codegen is still complete and correct for those files, so fervid is gated on codegen actually being produced for every file — the same gate every other compiler here gets — rather than on diagnostic silence. Per-run diagnostic totals are captured in the JSON report's meta samples.
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

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

> ⚠ **Local run — not the published Linux CI series** (win32/x64). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

pass **174** · fail **25** · warn **0** · skip **0**

| Case | vue-3.5 | vue-3.6 | vize | fervid | verter | compiler-rs-vapor | compiler-rs-vdom | babel-vue-jsx | vue-jsx-vapor-api |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `component-props` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `component-props (runtime)` | – | – | – | – | – | – | – | ✓ | – |
| `component-slot-children` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `component-slot-children (runtime)` | – | – | – | – | – | – | – | ✓ | – |
| `conditional` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `conditional (runtime)` | – | – | – | – | – | – | – | ✓ | – |
| `counter-click` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `css-v-bind` | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – |
| `custom-directive` | ✓ | ✓ | **✗** | **✗** | **✗** | – | – | – | – |
| `define-model-modifiers` | ✓ | ✓ | ✓ | ✓ | **✗** | – | – | – | – |
| `dynamic-arg` | ✓ | ✓ | **✗** | **✗** | **✗** | – | – | – | – |
| `dynamic-component-is` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – |
| `dynamic-slot-name` | ✓ | ✓ | **✗** | **✗** | ✓ | – | – | – | – |
| `event-handler` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `event-handler (runtime)` | – | – | – | – | – | – | – | ✓ | – |
| `event-modifiers` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – |
| `fragment` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `fragment (runtime)` | – | – | – | – | – | – | – | ✓ | – |
| `inherit-attrs-false` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `inherit-attrs-true` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `interp-text` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `keep-alive` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – |
| `list-map` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `list-map (runtime)` | – | – | – | – | – | – | – | ✓ | – |
| `props-echo` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `slot-default` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `slot-fallback` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – |
| `spread-props` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `spread-props (runtime)` | – | – | – | – | – | – | – | ✓ | – |
| `static-div` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `static-div (runtime)` | – | – | – | – | – | – | – | ✓ | – |
| `teleport` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `template-ref` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `v-bind-object` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – |
| `v-for-list` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – |
| `v-for-template-destructure` | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – |
| `v-if-false` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `v-if-true` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `v-memo` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `v-model-choice` | ✓ | ✓ | ✓ | ✓ | **✗** | – | – | – | – |
| `v-model-component` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `v-model-modifiers` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `v-model-native-input` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `v-once` | ✓ | ✓ | **✗** | ✓ | **✗** | – | – | – | – |
| `v-pre` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| `v-show` | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – |
| `v-show-directive` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `v-show-directive (runtime)` | – | – | – | – | – | – | – | ✓ | – |
| `v-text-v-html` | ✓ | ✓ | ✓ | ✓ | **✗** | – | – | – | – |

<details><summary>Failure detail</summary>

- `v-for-list` · **fervid** — Invalid destructuring assignment target
- `slot-fallback` · **fervid** — fallback is not a function
- `dynamic-component-is` · **fervid** — &lt;component :is> did not render initial component
- `v-once` · **vize** — Unexpected token '-'
- `v-once` · **verter** — expected text "0", got "1"
- `v-text-v-html` · **verter** — expected text "compiled", got ""
- `keep-alive` · **fervid** — Unable to get [data-testid=count] within: &lt;div class="keep-alive-host">   &lt;component is="[object Object]">&lt;/component>&lt;button type="button" data-testid="toggle">t&lt;/button> &lt;/div>
- `custom-directive` · **vize** — directive updated hook did not receive the new value
- `custom-directive` · **fervid** — directive updated hook did not receive the new value
- `custom-directive` · **verter** — directive value not delivered: data-hit=undefined
- `dynamic-slot-name` · **vize** — expected text "dyn-1", got "none"
- `dynamic-slot-name` · **fervid** — expected text "none", got "dyn-1"
- `event-modifiers` · **fervid** — expected text "0", got "1"
- `css-v-bind` · **fervid** — &lt;style> v-bind() did not inject useCssVars into setup()
- `css-v-bind` · **verter** — useCssVars key "--a91785dd-themeColor" is already "--"-prefixed; the runtime prepends "--", so the style var resolves to "----a91785dd-themeColor" and cannot match the emitted CSS
- `v-show` · **fervid** — v-show false must set display:none (element must stay in the DOM)
- `v-show` · **verter** — v-show false must set display:none (element must stay in the DOM)
- `define-model-modifiers` · **verter** — Cannot convert undefined or null to object
- `v-bind-object` · **fervid** — v-bind object attrs not applied: data-x=undefined, title=undefined
- `dynamic-arg` · **vize** — :[attrName] initial attr missing: data-a=undefined
- `dynamic-arg` · **fervid** — expected text "1", got "0"
- `dynamic-arg` · **verter** — expected text "1", got "0"
- `v-for-template-destructure` · **fervid** — Invalid destructuring assignment target
- `v-for-template-destructure` · **verter** — keyed &lt;template v-for> recreated the row instead of moving it (marker lost)
- `v-model-choice` · **verter** — expected text "a", got ""

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

### memory-linux-100

2026-08-19 · `fixtures/200` · source `memory-linux-100.json`

#### compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native loop (1T) vapor-prod | 15.16 / 15.16 / 15.16 | 0.94 / 0.94 / 0.94 | 31 | 111.7 | 27 | 3 |
| fervid compileSync (1T) vdom-prod | 15.93 / 15.93 / 15.93 | 0.77 / 0.77 / 0.77 | 30 | 111.8 | 28 | 3 |
| Vize native loop (1T) vdom-prod | 16.65 / 16.65 / 16.65 | 0.87 / 0.87 / 0.87 | 28 | 111.6 | 26 | 3 |
| Vize native batch vapor-prod | 17.43 / 17.43 / 17.43 | 0.84 / 0.84 / 0.84 | n/a | n/a | 14 | 3 |
| Vize native batch vdom-prod | 18.11 / 18.11 / 18.11 | 0.77 / 0.77 / 0.77 | n/a | n/a | 12 | 3 |
| Verter compileMany (stateless) vapor-prod | 37.71 / 37.71 / 37.71 | 0.83 / 0.83 / 0.83 | 89 | 142.1 | 61 | 3 |
| Verter compileMany (stateless) vdom-prod | 37.84 / 37.84 / 37.84 | 0.82 / 0.82 / 0.82 | 87 | 142.2 | 59 | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 60.83 / 62.65 / 61.74 | 32.40 / 32.40 / 32.40 | 777 | 207.2 | 375 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 62.34 / 62.87 / 62.66 | 30.60 / 30.60 / 30.60 | 770 | 209.1 | 368 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod | 70.91 / 71.75 / 71.33 | 38.93 / 38.93 / 38.93 | 1056 | 206.8 | 517 | 3 |

<details><summary>Notes</summary>

- **Vize native loop (1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **fervid compileSync (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize native loop (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize native batch vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize native batch vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany (stateless) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany (stateless) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.6 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.5 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.6 vapor (1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

#### jsx-compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | 10.66 / 10.66 / 10.66 | 0.36 / 0.36 / 0.36 | n/a | n/a | 5 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) | 10.82 / 10.82 / 10.82 | 0.35 / 0.35 / 0.35 | n/a | n/a | 5 | 3 |
| @vue/babel-plugin-jsx | 67.89 / 67.89 / 67.89 | 24.59 / 24.59 / 24.59 | 643 | 178.2 | 361 | 3 |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (interop VDOM)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue-jsx-vapor/compiler-rs (vapor)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/babel-plugin-jsx** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### compiler-memory-win32-current

2026-08-20 · `fixtures/200` · source `compiler-memory-win32-current.json`

> ⚠ **Local run — not the published Linux CI series** (unknown platform). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| fervid compileSync (1T) vdom-prod | 3.38 / 3.38 / 3.38 | 1.22 / 1.22 / 1.22 | n/a | n/a | 41 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vapor-prod | 4.63 / 4.97 / 4.80 | 1.64 / 1.64 / 1.64 | 62 | 106.3 | 51 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod | 7.42 / 7.48 / 7.42 | 1.52 / 1.52 / 1.52 | 47 | 91.3 | 51 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod | 16.73 / 20.31 / 18.39 | 1.83 / 1.83 / 1.83 | n/a | n/a | 20 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod | 16.52 / 20.03 / 18.28 | 1.77 / 1.77 / 1.77 | n/a | n/a | 19 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod | 19.31 / 21.11 / 20.33 | 1.62 / 1.62 / 1.62 | n/a | n/a | 22 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod | 19.26 / 20.93 / 20.09 | 1.70 / 1.70 / 1.70 | n/a | n/a | 18 | 3 |
| Verter compileMany (stateless raw render) vapor-prod | 65.07 / 65.07 / 65.07 | 1.32 / 1.32 / 1.32 | 344 | 591.2 | 64 | 3 |
| Verter compileMany (stateless raw render) vdom-prod | 66.58 / 66.58 / 66.58 | 1.29 / 1.29 / 1.29 | 374 | 551.3 | 68 | 3 |
| Verter compileMany + processStyle (render + CSS) vdom-prod | 68.32 / 68.32 / 68.32 | 1.54 / 1.54 / 1.54 | 204 | 304.5 | 67 | 3 |
| Verter compileMany + processStyle (render + CSS) vapor-prod | 68.56 / 68.56 / 68.56 | 1.56 / 1.56 / 1.56 | 265 | 394.9 | 66 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 96.60 / 97.52 / 97.17 | 56.50 / 56.50 / 56.50 | 798 | 194.0 | 411 | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 96.76 / 97.65 / 97.20 | 56.06 / 56.06 / 56.06 | 844 | 194.2 | 404 | 3 |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 103.17 / 103.49 / 103.31 | 47.45 / 47.45 / 47.45 | 875 | 201.5 | 434 | 3 |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod | 112.38 / 112.79 / 112.56 | 71.38 / 71.38 / 71.38 | 1062 | 179.7 | 591 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod | 114.78 / 114.78 / 114.78 | 66.07 / 66.07 / 66.07 | 937 | 180.3 | 520 | 3 |

<details><summary>Notes</summary>

- **fervid compileSync (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfc loop (render + CSS, 1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany (stateless raw render) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany (stateless raw render) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany + processStyle (render + CSS) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany + processStyle (render + CSS) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.5 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.6 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.6 vapor (1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### memory-win32-20

2026-08-19 · `fixtures/20` · source `memory-win32-20.json`

> ⚠ **Local run — not the published Linux CI series** (unknown platform). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| fervid compileSync (1T) vdom-prod | 2.84 / 2.84 / 2.84 | 0.30 / 0.30 / 0.30 | n/a | n/a | 10 | 1 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod | 3.81 / 3.81 / 3.81 | 0.51 / 0.51 / 0.51 | n/a | n/a | 13 | 1 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod | 9.20 / 9.20 / 9.20 | 0.49 / 0.49 / 0.49 | n/a | n/a | 12 | 1 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod | 10.19 / 10.19 / 10.19 | 0.48 / 0.48 / 0.48 | n/a | n/a | 13 | 1 |
| Verter compileMany (fresh host, stateless raw style-free render) vdom-prod | 18.94 / 18.94 / 18.94 | 0.53 / 0.53 / 0.53 | n/a | n/a | 23 | 1 |
| Verter compileMany + processStyle (render + CSS) vdom-prod | 19.64 / 19.64 / 19.64 | 1.09 / 1.09 / 1.09 | n/a | n/a | 26 | 1 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 24.69 / 30.87 / 27.78 | 14.56 / 14.56 / 14.56 | 359 | 193.8 | 185 | 1 |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 28.54 / 33.32 / 30.93 | 15.07 / 15.07 / 15.07 | 235 | 142.9 | 165 | 1 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 28.11 / 34.33 / 31.22 | 18.63 / 18.63 / 18.63 | 203 | 141.6 | 143 | 1 |

<details><summary>Notes</summary>

- **fervid compileSync (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany (fresh host, stateless raw style-free render) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany + processStyle (render + CSS) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.6 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.5 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### memory-win32-50

2026-07-26 · `fixtures/50` · source `memory-win32-50.json`

> ⚠ **Local run — not the published Linux CI series** (unknown platform). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native loop (1T) vdom-prod | 4.75 / 4.75 / 4.75 | 0.62 / 0.62 / 0.62 | n/a | n/a | 13 | 3 |
| Vize native batch vdom-prod | 12.34 / 12.34 / 12.34 | 0.57 / 0.57 / 0.57 | n/a | n/a | 10 | 3 |
| Verter compileMany (stateless) vdom-prod | 28.17 / 28.17 / 28.17 | 0.66 / 0.66 / 0.66 | n/a | n/a | 31 | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 31.35 / 31.35 / 31.35 | 15.54 / 15.54 / 15.54 | 265 | 163.8 | 166 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 31.95 / 31.95 / 31.95 | 16.06 / 16.06 / 16.06 | 313 | 174.4 | 179 | 3 |

<details><summary>Notes</summary>

- **Vize native loop (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize native batch vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany (stateless) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.6 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.5 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

## Tool versions

<details><summary>Every pinned package in this run</summary>

| Package | Version |
| --- | --- |
| node | v22.23.2 |
| vue | 3.5.41 |
| @vue/compiler-sfc | 3.5.41 |
| @vue/compiler-sfc-36 | 3.6.0-rc.4 |
| vize | 0.350.2 |
| @vizejs/native | 0.350.2 |
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
| oxfmt | 0.64.0 |
| oxlint | 1.79.0 |
| eslint-plugin-vue | 10.10.0 |
| @biomejs/biome | 2.5.9 |
| typescript | 6.0.3 |
| cli:vize | 0.350.2 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.64.0 |
| cli:oxlint | 1.79.0 |
| cli:biome | 2.5.9 |
| vue-jsx-vapor | 3.2.21 |
| @vue-jsx-vapor/compiler-rs | 3.2.21 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

</details>
