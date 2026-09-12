# Compiler

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-09-12T11:01:27.224Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`d4906cb`](https://github.com/pikax/vue-benchmarks/commit/d4906cbe77791d01e3e55b298b0bff7476ea561a)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/34689529541
- **Source:** `results/benchmarks/bench-Linux-200-bench.json`

## Results

Ranked on the **median of measured runs**. Warm series follow ≥1 discarded warmup and are the primary ordering and ranking metric wherever both series exist. Compiler and Component-meta additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup and package imports. It is not called Cold and its ratio/noise gate never substitutes for Warm. What else the child excludes differs by surface and each surface states it in its own methodology — Compiler builds its compiler host outside the timer, Component-meta builds its checker/session inside it, because its warm timer does too. Every table sorts fastest-first and every ratio column is **vs fastest** — the fastest ranked row is the 1.00x denominator; no tool is pinned as a reference. One table per surface unless that surface declares explicit work-equivalence classes; engine, invocation and threading are row properties, not implicit table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three warm samples is bracketed as TOO NOISY TO RANK, no tool exempted (a two-run spread has no third sample to adjudicate, so it is flagged, not bracketed). Per-row detail is under **Notes** below each table.

> **Peak RSS** on a timing row is the tool's peak resident set: measured in the timed session where the runner samples it (LSP servers, real-world CLIs), otherwise injected from the isolated memory probe below — the probe runs each tool in its own process, separate from timing.

### Compiler

Files: **200** · Bytes: **285,701**

**Vue-anchored apples-to-apples compiler results.** Each target/environment/source-map cell contains two candidate-comparison subsections: Raw SFC compilation gives Vue, Vize batch and Verter first-admission the same revised style-free SFC strings; SFC compilation with CSS gives the style-capable entrypoints the same revised style-bearing SFCs and counts both generated JS and CSS. Every measured row publishes Fresh child and Warm separately when both samplers succeed. Ratios never cross these subsections and always use the official Vue workload as 1.00x. A failed semantic gate leaves both measured times visible but unranked.

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

##### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vdom-production-sourcemap-0pklqxc-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-linux-200-bench-compile-vdom-production-sourcemap-0pklqxc.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (1T) | 545.2 ms | 540.0 ms | 61.0 ms | 11.2% ⚠ | 1.00x | **239.8 ms** | 215.0 ms | 17.3 ms | 7.2% | 1.00x | 735,261 | 834 files/s | 63.6 MB |
| @vue/compiler-sfc 3.6 (1T) | 547.9 ms | 538.1 ms | 12.3 ms | 2.2% | 1.00x | **268.3 ms** | 258.9 ms | 20.4 ms | 7.6% | 1.12x | 735,261 | 745 files/s | 62.9 MB |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vdom-production-sourcemap-0eptotg-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-linux-200-bench-compile-vdom-production-sourcemap-0eptotg.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | 542.6 ms | 539.0 ms | 5.2 ms | 1.0% | 1.00x | **242.0 ms** | 231.4 ms | 8.7 ms | 3.6% | 1.00x | 735,061 | 827 files/s | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (24.7 ms) | (24.3 ms) | (0.8 ms) | (3.3%) | not ranked | (22.7 ms) | (22.3 ms) | (0.4 ms) | (1.6%) | not ranked | (673,914) | – | (18.4 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (124.7 ms) | (121.3 ms) | (3.2 ms) | (2.6%) | not ranked | (117.0 ms) | (115.6 ms) | (3.6 ms) | (3.1%) | not ranked | (528,623) | – | (36.2 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vdom-production-sourcemap-13l0zgz-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-linux-200-bench-compile-vdom-production-sourcemap-13l0zgz.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | 634.3 ms | 630.3 ms | 6.5 ms | 1.0% | 1.00x | **285.5 ms** | 277.4 ms | 17.0 ms | 6.0% | 1.00x | 769,363 | 701 files/s | 66.0 MB |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (68.4 ms) | (68.2 ms) | (0.2 ms) | (0.3%) | not ranked | (66.6 ms) | (65.6 ms) | (0.4 ms) | (0.7%) | not ranked | (707,196) | – | (16.3 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (25.6 ms) | (25.5 ms) | (0.7 ms) | (2.8%) | not ranked | (23.6 ms) | (23.5 ms) | (0.2 ms) | (0.6%) | not ranked | (707,196) | – | (18.6 MB) |
| fervid compileSync (1T) ⚠ | (63.7 ms) | (63.4 ms) | (0.4 ms) | (0.7%) | not ranked | (61.5 ms) | (60.8 ms) | (1.5 ms) | (2.4%) | not ranked | (886,876) | – | (15.9 MB) |
| fervid compileAsync (4-thread libuv pool) ⚠ | (27.5 ms) | (27.0 ms) | (1.1 ms) | (4.1%) | not ranked | (27.6 ms) | (27.2 ms) | (0.6 ms) | (2.0%) | not ranked | (886,876) | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (135.5 ms) | (124.1 ms) | (6.7 ms) | (5.0%) | not ranked | (124.3 ms) | (121.7 ms) | (2.1 ms) | (1.7%) | not ranked | (592,613) | – | (38.1 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Fresh child (first timed row workload): 682.1 ms, 540.0 ms, 545.2 ms, 557.6 ms, 543.5 ms · Warm: 260.2 ms, 249.0 ms, 239.8 ms, 230.3 ms, 215.0 ms
- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 547.9 ms, 538.1 ms, 548.1 ms, 544.6 ms, 570.6 ms · Warm: 303.0 ms, 268.3 ms, 260.7 ms, 294.8 ms, 258.9 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Fresh child (first timed row workload): 550.3 ms, 542.6 ms, 540.0 ms, 548.8 ms, 539.0 ms · Warm: 254.0 ms, 242.0 ms, 243.8 ms, 235.4 ms, 231.4 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 24.7 ms, 24.5 ms, 26.3 ms, 24.3 ms, 25.4 ms · Warm: 22.5 ms, 23.0 ms, 22.7 ms, 23.2 ms, 22.3 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 130.1 ms, 124.7 ms, 126.6 ms, 124.2 ms, 121.3 ms · Warm: 117.4 ms, 124.4 ms, 115.6 ms, 117.0 ms, 116.0 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 634.3 ms, 630.3 ms, 630.7 ms, 646.0 ms, 638.7 ms · Warm: 316.6 ms, 302.2 ms, 285.5 ms, 278.1 ms, 277.4 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 68.2 ms, 68.6 ms, 68.4 ms, 68.2 ms, 68.5 ms · Warm: 66.7 ms, 66.5 ms, 66.6 ms, 65.6 ms, 66.6 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 25.5 ms, 25.5 ms, 25.6 ms, 25.7 ms, 27.1 ms · Warm: 23.6 ms, 23.6 ms, 23.5 ms, 23.5 ms, 23.9 ms
- **fervid compileSync (1T)**: Fresh child (first timed row workload): 63.7 ms, 64.4 ms, 63.5 ms, 63.8 ms, 63.4 ms · Warm: 61.5 ms, 61.5 ms, 64.6 ms, 60.8 ms, 61.6 ms
- **fervid compileAsync (4-thread libuv pool)**: Fresh child (first timed row workload): 27.0 ms, 27.5 ms, 27.5 ms, 29.4 ms, 29.3 ms · Warm: 28.2 ms, 28.6 ms, 27.6 ms, 27.5 ms, 27.2 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 124.1 ms, 137.9 ms, 140.6 ms, 135.5 ms, 129.3 ms · Warm: 126.9 ms, 124.3 ms, 121.7 ms, 125.8 ms, 123.0 ms

</details>

#### VDOM · development · sourcemap off

Target: `vdom` · Environment: `development` · Source map: `off`

##### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vdom-development-sourcema-0qe4p0q-dark.svg">
  <img alt="Compiler — VDOM · development · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-linux-200-bench-compile-vdom-development-sourcema-0qe4p0q.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (1T) | 531.4 ms | 516.3 ms | 10.8 ms | 2.0% | 1.00x | **209.0 ms** | 205.2 ms | 3.3 ms | 1.6% | 1.00x | 721,735 | 957 files/s |
| @vue/compiler-sfc 3.6 (1T) | 548.0 ms | 532.0 ms | 7.7 ms | 1.4% | 1.03x | **235.0 ms** | 231.0 ms | 5.4 ms | 2.3% | 1.12x | 721,735 | 851 files/s |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=false, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=false, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vdom-development-sourcema-0nmx41y-dark.svg">
  <img alt="Compiler — VDOM · development · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-linux-200-bench-compile-vdom-development-sourcema-0nmx41y.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | 533.2 ms | 526.1 ms | 3.6 ms | 0.7% | 1.00x | **214.5 ms** | 206.1 ms | 6.2 ms | 2.9% | 1.00x | 721,535 | 932 files/s |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (24.2 ms) | (24.0 ms) | (0.2 ms) | (0.7%) | not ranked | (22.5 ms) | (22.0 ms) | (0.2 ms) | (1.1%) | not ranked | (668,102) | – |
| Verter compileMany (first-admission stateless raw render) ⚠ | (126.2 ms) | (121.9 ms) | (3.2 ms) | (2.5%) | not ranked | (116.1 ms) | (113.6 ms) | (2.8 ms) | (2.4%) | not ranked | (691,121) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=false. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-only-sfc [module-load]: compiled module has no default export. Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=false, forceJs=false, sourceMap=false, hmr=vite, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (24/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vdom-development-sourcema-15udlyl-dark.svg">
  <img alt="Compiler — VDOM · development · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-linux-200-bench-compile-vdom-development-sourcema-15udlyl.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | 611.0 ms | 600.1 ms | 6.4 ms | 1.1% | 1.00x | **258.5 ms** | 246.8 ms | 18.3 ms | 7.1% | 1.00x | 755,837 | 774 files/s |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (68.4 ms) | (68.0 ms) | (0.3 ms) | (0.4%) | not ranked | (65.9 ms) | (65.3 ms) | (0.3 ms) | (0.5%) | not ranked | (701,384) | – |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (25.5 ms) | (25.4 ms) | (0.1 ms) | (0.3%) | not ranked | (23.6 ms) | (23.1 ms) | (0.3 ms) | (1.2%) | not ranked | (701,384) | – |
| fervid compileSync (1T) ⚠ | (64.4 ms) | (64.1 ms) | (0.3 ms) | (0.5%) | not ranked | (62.4 ms) | (62.0 ms) | (0.3 ms) | (0.6%) | not ranked | (897,281) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (27.6 ms) | (27.3 ms) | (1.4 ms) | (5.2%) | not ranked | (28.4 ms) | (27.4 ms) | (1.3 ms) | (4.6%) | not ranked | (897,281) | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (134.7 ms) | (130.3 ms) | (3.1 ms) | (2.3%) | not ranked | (128.3 ms) | (124.4 ms) | (2.0 ms) | (1.5%) | not ranked | (755,511) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=false. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-only-sfc [module-load]: compiled module has no default export. Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-only-sfc [module-load]: compiled module has no default export. Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=false, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (41:97)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +9 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=false, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (41:97)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +9 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=false, isProduction=false, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (24/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Fresh child (first timed row workload): 523.2 ms, 531.4 ms, 538.2 ms, 516.3 ms, 542.9 ms · Warm: 214.2 ms, 205.2 ms, 210.5 ms, 209.0 ms, 208.7 ms
- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 546.5 ms, 532.0 ms, 548.1 ms, 551.9 ms, 548.0 ms · Warm: 236.4 ms, 235.0 ms, 231.0 ms, 234.2 ms, 245.4 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Fresh child (first timed row workload): 533.2 ms, 526.1 ms, 533.4 ms, 533.1 ms, 535.8 ms · Warm: 214.5 ms, 212.9 ms, 206.1 ms, 221.8 ms, 220.0 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 24.1 ms, 24.0 ms, 24.2 ms, 24.3 ms, 24.5 ms · Warm: 22.3 ms, 22.6 ms, 22.0 ms, 22.6 ms, 22.5 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 121.9 ms, 130.8 ms, 126.5 ms, 126.2 ms, 125.8 ms · Warm: 116.1 ms, 113.6 ms, 120.1 ms, 117.6 ms, 113.6 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 611.0 ms, 612.9 ms, 609.9 ms, 617.6 ms, 600.1 ms · Warm: 254.7 ms, 258.5 ms, 246.8 ms, 259.9 ms, 294.2 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 68.4 ms, 68.5 ms, 68.9 ms, 68.0 ms, 68.3 ms · Warm: 66.1 ms, 65.6 ms, 65.9 ms, 65.3 ms, 65.9 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 25.7 ms, 25.4 ms, 25.5 ms, 25.6 ms, 25.5 ms · Warm: 23.4 ms, 23.6 ms, 23.8 ms, 23.1 ms, 23.8 ms
- **fervid compileSync (1T)**: Fresh child (first timed row workload): 64.6 ms, 64.4 ms, 64.1 ms, 64.3 ms, 64.9 ms · Warm: 62.6 ms, 62.7 ms, 62.0 ms, 62.0 ms, 62.4 ms
- **fervid compileAsync (4-thread libuv pool)**: Fresh child (first timed row workload): 29.8 ms, 27.3 ms, 27.6 ms, 27.5 ms, 30.3 ms · Warm: 28.4 ms, 30.8 ms, 27.4 ms, 27.9 ms, 28.8 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 135.9 ms, 130.3 ms, 130.9 ms, 137.2 ms, 134.7 ms · Warm: 128.9 ms, 124.4 ms, 125.9 ms, 128.6 ms, 128.3 ms

</details>

#### VAPOR · production · sourcemap off

Target: `vapor` · Environment: `production` · Source map: `off`

##### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcema-1srejxm-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcema-1srejxm.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – | – |
| @vue/compiler-sfc 3.6 (1T) ⚠ | (895.3 ms) | (869.9 ms) | (15.9 ms) | (1.8%) | not ranked | (419.4 ms) | (417.7 ms) | (51.1 ms) | (12.2%) | not ranked | (711,809) | – | (73.7 MB) |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **@vue/compiler-sfc 3.6 (1T) ⚠**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=true, sourceMap=false ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcema-1hc66bq-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcema-1hc66bq.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠ | (892.7 ms) | (878.8 ms) | (9.1 ms) | (1.0%) | not ranked | (410.9 ms) | (408.4 ms) | (12.9 ms) | (3.1%) | not ranked | (711,609) | – | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (24.3 ms) | (23.9 ms) | (0.5 ms) | (1.9%) | not ranked | (23.0 ms) | (22.1 ms) | (0.5 ms) | (2.3%) | not ranked | (751,196) | – | (18.7 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (123.5 ms) | (121.0 ms) | (3.8 ms) | (3.1%) | not ranked | (117.8 ms) | (114.0 ms) | (2.4 ms) | (2.1%) | not ranked | (564,944) | – | (35.9 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (24/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; reactive-props-destructure-shadowing [runtime]: _setText is not defined; reactive-props-destructure-alias-default [runtime]: _setText is not defined; +26 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcema-1r4mje5-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcema-1r4mje5.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠ | (992.4 ms) | (969.7 ms) | (12.2 ms) | (1.2%) | not ranked | (481.6 ms) | (467.8 ms) | (9.6 ms) | (2.0%) | not ranked | (791,235) | – | (78.9 MB) |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (69.2 ms) | (68.8 ms) | (3.8 ms) | (5.4%) | not ranked | (66.7 ms) | (66.5 ms) | (0.3 ms) | (0.4%) | not ranked | (795,054) | – | (16.1 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (25.6 ms) | (25.5 ms) | (0.1 ms) | (0.5%) | not ranked | (23.5 ms) | (23.3 ms) | (0.1 ms) | (0.6%) | not ranked | (795,054) | – | (18.7 MB) |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (132.3 ms) | (129.3 ms) | (3.3 ms) | (2.5%) | not ranked | (126.6 ms) | (121.0 ms) | (3.1 ms) | (2.4%) | not ranked | (628,934) | – | (38.2 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (24/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (24/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5. ⚠ STYLE CORRECTNESS GATE NOT RUN for @fervid/napi; a render+CSS result without the 17-plant CSS semantics suite is not ranked.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; reactive-props-destructure-shadowing [runtime]: _setText is not defined; reactive-props-destructure-alias-default [runtime]: _setText is not defined; +26 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 895.3 ms, 906.0 ms, 880.3 ms, 869.9 ms, 905.6 ms · Warm: 434.5 ms, 417.7 ms, 535.6 ms, 419.4 ms, 417.9 ms
- **Vue compiler-sfc 3.6 reference (raw render, 1T)**: Fresh child (first timed row workload): 897.8 ms, 892.7 ms, 897.6 ms, 878.8 ms, 881.2 ms · Warm: 435.3 ms, 410.3 ms, 410.9 ms, 431.3 ms, 408.4 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 23.9 ms, 24.3 ms, 24.4 ms, 24.1 ms, 25.1 ms · Warm: 22.1 ms, 23.0 ms, 23.5 ms, 23.0 ms, 22.5 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 123.5 ms, 129.3 ms, 128.3 ms, 121.0 ms, 121.9 ms · Warm: 114.0 ms, 116.7 ms, 118.4 ms, 117.8 ms, 120.7 ms
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 996.9 ms, 980.2 ms, 998.0 ms, 969.7 ms, 992.4 ms · Warm: 492.9 ms, 481.6 ms, 477.0 ms, 486.8 ms, 467.8 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 68.8 ms, 68.8 ms, 69.2 ms, 69.2 ms, 77.4 ms · Warm: 66.9 ms, 66.7 ms, 67.1 ms, 66.6 ms, 66.5 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 25.6 ms, 25.5 ms, 25.6 ms, 25.8 ms, 25.7 ms · Warm: 23.7 ms, 23.3 ms, 23.5 ms, 23.5 ms, 23.6 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 134.5 ms, 132.0 ms, 138.1 ms, 132.3 ms, 129.3 ms · Warm: 128.0 ms, 121.0 ms, 124.5 ms, 126.6 ms, 128.7 ms

</details>

#### VAPOR · development · sourcemap off

Target: `vapor` · Environment: `development` · Source map: `off`

##### Official render pipeline — parse + script + template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcem-1u3kpns-dark.svg">
  <img alt="Compiler — VAPOR · development · sourcemap off — Official render pipeline — parse + script + template" src="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcem-1u3kpns.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – |
| @vue/compiler-sfc 3.6 (1T) ⚠ | (876.9 ms) | (863.0 ms) | (21.8 ms) | (2.5%) | not ranked | (414.8 ms) | (404.4 ms) | (18.8 ms) | (4.5%) | not ranked | (713,547) | – |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **@vue/compiler-sfc 3.6 (1T) ⚠**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=false, sourceMap=false ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcem-0d57nho-dark.svg">
  <img alt="Compiler — VAPOR · development · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcem-0d57nho.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠ | (892.6 ms) | (885.5 ms) | (4.0 ms) | (0.5%) | not ranked | (415.0 ms) | (409.2 ms) | (7.8 ms) | (1.9%) | not ranked | (713,347) | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (24.1 ms) | (24.0 ms) | (0.3 ms) | (1.4%) | not ranked | (23.0 ms) | (23.0 ms) | (1.4 ms) | (6.1%) | not ranked | (751,196) | – |
| Verter compileMany (first-admission stateless raw render) ⚠ | (126.2 ms) | (118.2 ms) | (4.5 ms) | (3.6%) | not ranked | (129.0 ms) | (127.6 ms) | (2.2 ms) | (1.7%) | not ranked | (600,682) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=false. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (24/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=true, isProduction=false, forceJs=false, sourceMap=false, hmr=vite, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; reactive-props-destructure-shadowing [runtime]: _setText is not defined; reactive-props-destructure-alias-default [runtime]: _setText is not defined; +26 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcem-1s4kyiz-dark.svg">
  <img alt="Compiler — VAPOR · development · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcem-1s4kyiz.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠ | (987.5 ms) | (967.0 ms) | (15.8 ms) | (1.6%) | not ranked | (459.0 ms) | (457.2 ms) | (7.5 ms) | (1.6%) | not ranked | (792,973) | – |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (69.0 ms) | (68.8 ms) | (0.2 ms) | (0.3%) | not ranked | (68.1 ms) | (66.9 ms) | (1.8 ms) | (2.6%) | not ranked | (795,054) | – |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (25.7 ms) | (25.6 ms) | (0.5 ms) | (1.8%) | not ranked | (24.0 ms) | (23.7 ms) | (0.3 ms) | (1.1%) | not ranked | (795,054) | – |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (133.1 ms) | (132.2 ms) | (1.1 ms) | (0.9%) | not ranked | (135.4 ms) | (128.5 ms) | (5.5 ms) | (4.0%) | not ranked | (664,672) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=false. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: dir is not a function; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=true, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (24/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (24/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: old dynamic listener was not removed: expected "1", got "2"; +6 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5. ⚠ STYLE CORRECTNESS GATE NOT RUN for @fervid/napi; a render+CSS result without the 17-plant CSS semantics suite is not ranked.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=true, isProduction=false, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 passed) — runtime-props-defaults-reactivity [runtime]: _setText is not defined; reactive-props-destructure-shadowing [runtime]: _setText is not defined; reactive-props-destructure-alias-default [runtime]: _setText is not defined; +26 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 880.5 ms, 876.9 ms, 873.9 ms, 863.0 ms, 920.1 ms · Warm: 432.3 ms, 413.7 ms, 404.4 ms, 451.8 ms, 414.8 ms
- **Vue compiler-sfc 3.6 reference (raw render, 1T)**: Fresh child (first timed row workload): 893.6 ms, 896.3 ms, 890.5 ms, 885.5 ms, 892.6 ms · Warm: 422.5 ms, 412.0 ms, 415.0 ms, 428.0 ms, 409.2 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 24.1 ms, 24.0 ms, 24.6 ms, 24.7 ms, 24.0 ms · Warm: 23.8 ms, 23.0 ms, 23.0 ms, 26.3 ms, 23.0 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 126.2 ms, 120.2 ms, 127.4 ms, 128.1 ms, 118.2 ms · Warm: 128.5 ms, 127.6 ms, 129.0 ms, 131.0 ms, 133.1 ms
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 1.00 s, 987.5 ms, 967.0 ms, 999.8 ms, 970.7 ms · Warm: 465.7 ms, 459.0 ms, 458.6 ms, 475.3 ms, 457.2 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 69.0 ms, 68.8 ms, 69.0 ms, 69.3 ms, 68.8 ms · Warm: 70.0 ms, 67.7 ms, 66.9 ms, 71.2 ms, 68.1 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 25.6 ms, 25.7 ms, 26.7 ms, 25.7 ms, 25.9 ms · Warm: 24.1 ms, 23.7 ms, 24.3 ms, 23.8 ms, 24.0 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 133.1 ms, 132.2 ms, 132.3 ms, 134.1 ms, 134.8 ms · Warm: 128.5 ms, 132.7 ms, 135.9 ms, 135.4 ms, 143.5 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=unique: 200/200 unique content SHAs. The exact compileSfcBatchWithResults path measured here does not have Vize's stats-only batch API's duplicate-body grouping, so duplicate bodies are disclosed for corpus representativeness rather than described as output-cache hits.
- Ratio columns are vs fastest — the fastest ranked row in each comparison class is the 1.00x denominator; no tool is pinned as a reference. The official Vue workload competes on the same terms and its row is labelled: Vue 3.5 provides the VDOM workload; Vue 3.6 the Vapor one because 3.5 has no Vapor backend.
- Rows are split into explicit work-equivalence classes and ratios never cross those boundaries: official Vue-version context; Raw SFC compilation; and SFC compilation with CSS. The old unmatched Verter retained-host re-render row is not in the ranked surface; it remains available through diagnose:compile-warmth.
- The RAW RENDER class compares Vue, Vize and Verter on byte-identical, intentionally style-free SFC strings. &lt;style> blocks are removed from ALL three outside the timer by the class definition. This class measures SFC parse + script/template parse and analysis + render codegen, not CSS.
- Every raw-class cell/pass injects a distinct fixed-width semantically neutral comment into every present script and template block. This prevents Vue cross-cell source-cache contamination and previous whole-output reuse; all candidates in a cell receive the exact same revised strings. Revision and input-object construction happen outside the timer.
- Official Vue-version context rows use a separate fixed-width source namespace from the candidate raw class. This prevents the context row and Vue candidate baseline from lending each other same-compiler parse/template cache entries while preserving byte-identical Vue/Vize/Verter inputs inside the candidate class.
- The ranked raw Verter row creates a fresh workspace-backed host/project outside every timed pass, then measures first source admission through compileMany. requestedMode=stateless is explicit and cacheHit is asserted zero. Process/native-library state may remain warm, but no populated-host parsed, semantic, dependency-graph or output state crosses timed passes.
- The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one processStyle call per block. Generated JS and CSS bytes are both counted.
- TIMED STYLE CORPUS CENSUS: 177/200 files contain 177 style block(s): scoped=177, CSS Modules=0, v-bind=0, preprocessors=0, external src=0. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.
- STYLE CORRECTNESS GATE (untimed, mandatory for style ranking): suite 2026-09-12.3 (dc4ba0a462e6) runs 17 independent plants covering ordinary and compound scoped selectors; :deep(), :slotted(), :global(), :is() and :where() semantics; selectors nested in @media/@supports; scoped keyframe declaration/reference consistency; multiple and quoted v-bind() expression linkage; and CSS Modules mapping. Checks assert semantic relationships, never whole generated-CSS equality. Vize compileSfc and one real multi-input compileSfcBatchWithResults call have separate verdicts; Verter uses one fresh-host multi-input compileMany followed by serial processStyle; fervid sync and async are checked separately. Any failure is measured but UNRANKED and self-clears after a fixed upgrade. Plants execute after timing so they cannot pre-warm measured entrypoints; manifest metadata is retained in validation.styleCorrectnessManifest.
- SASS/SCSS CAPABILITY AUDIT (untimed, diagnostic): suite 2026-08-20.2 (e302bbad5972) runs 8 independent lang=scss/lang=sass plants for variables, mixins/nesting, scoped selectors, :deep() inside @media, v-bind linkage and CSS Modules. validation.stylePreprocessors keeps two non-interchangeable verdicts: exactEntrypoints says whether the measured compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call; sharedSassAdapter first runs the pinned sass dependency once per plant and then tests only each compiler's downstream Vue-style transform. Harness preprocessing can never turn an unsupported exact API into PASS. These diagnostic plants do not gate the separately defined timed inline-plain-CSS class.
- RUNTIME SEMANTIC GATE (untimed, mandatory): suite 2026-09-12.2 runs 33 independent valid-SFC plants against observable DOM/events/updates/public-instance behaviour, never generated-text equality. It certifies Vue's composed non-inline API, Vize single and real multi-input batch, fresh-host stateless multi-input Verter compileMany, and fervid sync/async separately with the exact target/env/map flags. Each API runs in an isolated child after all timings; every outcome and the manifest hash are retained in validation.compileSemantics. FAIL, crash, timeout, missing verdict and UNKNOWN are measured but UNRANKED. Vapor output is executed with Vue's pinned, version-matched 3.6 compiler/runtime and shipped createVaporApp path; each Vapor entrypoint receives its own PASS/FAIL verdict, while unsupported backends remain UNKNOWN individually. VDOM evidence is never borrowed.
- Scheduling is not disguised as equal: Vue's reference and Vize compileSfc loop are 1T; Vize's with-results API compiles inside the process-global Rayon pool; Verter compileMany uses its host pool but public processStyle is synchronous and is called serially; fervid async uses libuv. Each row says so.
- Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.
- The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.
- ⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested from every compiler in a cell (Vue and Vize single-file: sourceMap; Vize batch: includeSourceMap; Verter: compileProfile.sourceMap/processStyle sourcemap; fervid: FervidJsCompilerOptions.sourceMap). Raw render requires a JS map. Style-inclusive rows emit two artifacts and therefore require both JS and CSS maps. Timed paths assert returned bytes whenever the installed capability exists. Current executable presence probe: Vize single JS=YES/CSS=NO, Vize batch JS=YES/CSS=NO, Verter runtime-render JS=NO/processStyle CSS=NO, fervid JS=YES/CSS=NO. Presence is not mapping correctness: a separate post-timing child traces selected script/template/CSS AST positions to the exact filename, full SFC content and UTF-16 coordinates for LF and CRLF plants. Each exact entrypoint and raw/style workload needs its own PASS in validation.sourceMaps; missing, failed or unknown evidence keeps that row UNRANKED. Vue template maps are translated to full SFC coordinates inside its timed composed adapter, including the first-line block column.
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
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-jsx-compile-vue-jsx-vapor-transform-dark.svg">
  <img alt="JSX compile — Vue JSX Vapor transform" src="charts/compiler-bench-linux-200-bench-jsx-compile-vue-jsx-vapor-transform.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (vapor) ⚠ | (4.8 ms) | (4.2 ms) | – | – | not ranked | (96,924) | – |
| vue-jsx-vapor/api ⚠ | (5.7 ms) | (5.5 ms) | – | – | not ranked | (96,924) | – |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (vapor) ⚠**: Rust/Oxc transform; default vapor mode (see vuejs/vue-jsx-vapor). Same unique .jsx corpus as other JSX rows. ⚠ JSX RUNTIME SEMANTIC VALIDITY UNKNOWN (0/10 passed) — static-element-attributes [not-run]: Exact Vapor runtime mounting is not available with the benchmark's Vue 3.5 runtime; VDOM evidence and code-shape regexes are not borrowed; interpolation-and-prop-update [not-run]: Exact Vapor runtime mounting is not available with the benchmark's Vue 3.5 runtime; VDOM evidence and code-shape regexes are not borrowed.
- **vue-jsx-vapor/api ⚠**: transformVueJsxVapor() public API (vapor default). ⚠ JSX RUNTIME SEMANTIC VALIDITY UNKNOWN (0/10 passed) — static-element-attributes [not-run]: Exact Vapor runtime mounting is not available with the benchmark's Vue 3.5 runtime; VDOM evidence and code-shape regexes are not borrowed; interpolation-and-prop-update [not-run]: Exact Vapor runtime mounting is not available with the benchmark's Vue 3.5 runtime; VDOM evidence and code-shape regexes are not borrowed. ⚠ COMPARISON REFERENCE INVALID: the Vue baseline for this JSX target did not pass mandatory validation.

</details>

##### Vue JSX VDOM transform

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-jsx-compile-vue-jsx-vdom-transform-dark.svg">
  <img alt="JSX compile — Vue JSX VDOM transform" src="charts/compiler-bench-linux-200-bench-jsx-compile-vue-jsx-vdom-transform.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | **4.1 ms** | 3.7 ms | 0.6 ms | 15.0% ⚠ | 1.00x | 94,084 | 48.9k files/s |
| @vue/babel-plugin-jsx (Babel VDOM) | **139.7 ms** | 120.2 ms | 22.2 ms | 15.9% ⚠ | 34.16x | 57,284 | 1.4k files/s |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: Rust/Oxc transform with interop: true (VDOM createElementBlock path). ✓ JSX RUNTIME SEMANTIC VALIDITY: 10/10 observable-behaviour plants passed through transform(source, { interop: true }).
- **@vue/babel-plugin-jsx (Babel VDOM)**: Official Babel Vue JSX plugin (createVNode). Reference VDOM JSX path; not Vapor. ✓ JSX RUNTIME SEMANTIC VALIDITY: 10/10 observable-behaviour plants passed through @babel/core transformSync(source, { plugins: [@vue/babel-plugin-jsx], sourceMaps:false, babelrc:false, configFile:false }).

</details>

<details><summary>Methodology</summary>

- Surface is JSX/TSX transform throughput — independent of SFC (.vue) compile.
- Corpus: fixtures/jsx-N unique .jsx files (generate.mjs --with-jsx).
- vue-jsx-vapor: https://github.com/vuejs/vue-jsx-vapor — Vapor Mode of Vue JSX (Oxc/Rust compiler-rs).
- compiler-rs vapor vs interop:true (VDOM) are different codegen targets.
- VDOM and Vapor are separate comparison classes. @vue/babel-plugin-jsx is the Vue VDOM baseline; compiler-rs is the lower-level Vue Vapor baseline for the Vapor API wrapper.
- Each measured row reports generated code bytes. Empty string output is rejected for object and string native return shapes; byte counts are informational and never a correctness threshold.
- POST-TIMING SEMANTIC GATE: suite 2026-09-12.2 (10 plants) executes the Babel VDOM and compiler-rs interop VDOM outputs against Vue using each row's exact transform call. It observes DOM, props, updates, keyed lists, fragments, spreads, component props and events; generated text is never compared. compiler-rs's emitted virtual VDOM id is resolved to @vue-jsx-vapor/runtime's shipped VDOM helper. Each entrypoint runs in an isolated child after timing. FAIL, crash, missing verdict and UNKNOWN are measured but UNRANKED, and a failed Vue baseline invalidates its comparison class.
- Vapor compiler-rs and vue-jsx-vapor/api timings are currently UNKNOWN/unranked: the benchmark's Vue 3.5 runtime cannot execute their Vue 3.6 Vapor output, and neither VDOM behaviour nor generated-code regexes are borrowed as correctness evidence.
- Do not compare JSX ms to SFC compile ms; different language and pipeline.
- Tool order is ROTATED on every warmup and measured run (not merely alternated), so no tool keeps a fixed position in the sequence.

Raw runs:

- **@vue-jsx-vapor/compiler-rs (vapor)**: 5.3 ms, 4.8 ms, 7.7 ms, 4.8 ms, 4.2 ms
- **vue-jsx-vapor/api**: 5.8 ms, 5.7 ms, 5.5 ms, 5.7 ms, 5.5 ms
- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: 4.1 ms, 5.2 ms, 4.6 ms, 3.8 ms, 3.7 ms
- **@vue/babel-plugin-jsx (Babel VDOM)**: 139.7 ms, 149.5 ms, 174.2 ms, 122.2 ms, 120.2 ms

</details>

## Repeated-input study

A study, not a ranking: identical file bodies probe output-cache behaviour. Source: `results/benchmarks/bench-Linux-200-repeated-input-study.json`.

#### Compiler

Files: **200** · Bytes: **46,600**

**Vue-anchored apples-to-apples compiler results.** Each target/environment/source-map cell contains two candidate-comparison subsections: Raw SFC compilation gives Vue, Vize batch and Verter first-admission the same revised style-free SFC strings; SFC compilation with CSS gives the style-capable entrypoints the same revised style-bearing SFCs and counts both generated JS and CSS. Every measured row publishes Fresh child and Warm separately when both samplers succeed. Ratios never cross these subsections and always use the official Vue workload as 1.00x. A failed semantic gate leaves both measured times visible but unranked.

##### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

###### Official render pipeline — parse + script + template

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (1T) | 127.2 ms | 127.1 ms | 0.1 ms | 0.1% | 1.00x | **58.5 ms** | 53.8 ms | 6.6 ms | 11.3% ⚠ | 1.00x | 214,800 | 3.4k files/s | 63.6 MB |
| @vue/compiler-sfc 3.6 (1T) | 132.3 ms | 131.1 ms | 1.7 ms | 1.3% | 1.04x | **71.6 ms** | 61.2 ms | 14.6 ms | 20.4% ⚠ | 1.22x | 214,800 | 2.8k files/s | 62.9 MB |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

###### Raw SFC compilation — identical changed inputs; no output-cache reuse

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | 126.4 ms | 122.2 ms | 6.0 ms | 4.7% | 1.00x | **58.4 ms** | 56.8 ms | 2.3 ms | 3.9% | 1.00x | 214,600 | 3.4k files/s | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (8.3 ms) | (8.3 ms) | (0.0 ms) | (0.5%) | not ranked | (7.3 ms) | (7.2 ms) | (0.1 ms) | (1.5%) | not ranked | (156,600) | – | (18.4 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (107.8 ms) | (107.6 ms) | (0.2 ms) | (0.2%) | not ranked | (100.5 ms) | (98.8 ms) | (2.4 ms) | (2.4%) | not ranked | (114,800) | – | (36.2 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

###### SFC compilation with CSS — script, template and style changed

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | 197.4 ms | 194.5 ms | 4.1 ms | 2.1% | 1.00x | **112.2 ms** | 111.4 ms | 1.2 ms | 1.0% | 1.00x | 242,000 | 1.8k files/s | 66.0 MB |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (26.7 ms) | (26.5 ms) | (0.3 ms) | (1.1%) | not ranked | (24.9 ms) | (24.5 ms) | (0.5 ms) | (1.9%) | not ranked | (183,200) | – | (16.3 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (9.5 ms) | (9.5 ms) | (0.1 ms) | (0.7%) | not ranked | (8.2 ms) | (7.9 ms) | (0.4 ms) | (4.9%) | not ranked | (183,200) | – | (18.6 MB) |
| fervid compileSync (1T) ⚠ | (17.1 ms) | (17.0 ms) | (0.2 ms) | (1.0%) | not ranked | (16.3 ms) | (16.3 ms) | (0.0 ms) | (0.0%) | not ranked | (199,361) | – | (15.9 MB) |
| fervid compileAsync (4-thread libuv pool) ⚠ | (8.1 ms) | (7.1 ms) | (1.4 ms) | (16.7%) | not ranked | (8.4 ms) | (7.0 ms) | (2.0 ms) | (24.2%) | not ranked | (199,361) | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (114.7 ms) | (112.0 ms) | (3.9 ms) | (3.4%) | not ranked | (107.3 ms) | (106.2 ms) | (1.5 ms) | (1.4%) | not ranked | (176,800) | – | (38.1 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Fresh child (first timed row workload): 127.1 ms, 127.2 ms · Warm: 63.2 ms, 53.8 ms
- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 133.5 ms, 131.1 ms · Warm: 81.9 ms, 61.2 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Fresh child (first timed row workload): 122.2 ms, 130.6 ms · Warm: 56.8 ms, 60.1 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 8.3 ms, 8.3 ms · Warm: 7.2 ms, 7.4 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 107.9 ms, 107.6 ms · Warm: 102.2 ms, 98.8 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 194.5 ms, 200.3 ms · Warm: 113.0 ms, 111.4 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 26.5 ms, 26.9 ms · Warm: 25.2 ms, 24.5 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 9.6 ms, 9.5 ms · Warm: 8.4 ms, 7.9 ms
- **fervid compileSync (1T)**: Fresh child (first timed row workload): 17.0 ms, 17.2 ms · Warm: 16.3 ms, 16.3 ms
- **fervid compileAsync (4-thread libuv pool)**: Fresh child (first timed row workload): 7.1 ms, 9.1 ms · Warm: 9.8 ms, 7.0 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 112.0 ms, 117.5 ms · Warm: 108.4 ms, 106.2 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=repeated: 1/200 unique content SHAs. The exact compileSfcBatchWithResults path measured here does not have Vize's stats-only batch API's duplicate-body grouping, so duplicate bodies are disclosed for corpus representativeness rather than described as output-cache hits.
- Ratio columns are vs fastest — the fastest ranked row in each comparison class is the 1.00x denominator; no tool is pinned as a reference. The official Vue workload competes on the same terms and its row is labelled: Vue 3.5 provides the VDOM workload; Vue 3.6 the Vapor one because 3.5 has no Vapor backend.
- Rows are split into explicit work-equivalence classes and ratios never cross those boundaries: official Vue-version context; Raw SFC compilation; and SFC compilation with CSS. The old unmatched Verter retained-host re-render row is not in the ranked surface; it remains available through diagnose:compile-warmth.
- The RAW RENDER class compares Vue, Vize and Verter on byte-identical, intentionally style-free SFC strings. &lt;style> blocks are removed from ALL three outside the timer by the class definition. This class measures SFC parse + script/template parse and analysis + render codegen, not CSS.
- Every raw-class cell/pass injects a distinct fixed-width semantically neutral comment into every present script and template block. This prevents Vue cross-cell source-cache contamination and previous whole-output reuse; all candidates in a cell receive the exact same revised strings. Revision and input-object construction happen outside the timer.
- Official Vue-version context rows use a separate fixed-width source namespace from the candidate raw class. This prevents the context row and Vue candidate baseline from lending each other same-compiler parse/template cache entries while preserving byte-identical Vue/Vize/Verter inputs inside the candidate class.
- The ranked raw Verter row creates a fresh workspace-backed host/project outside every timed pass, then measures first source admission through compileMany. requestedMode=stateless is explicit and cacheHit is asserted zero. Process/native-library state may remain warm, but no populated-host parsed, semantic, dependency-graph or output state crosses timed passes.
- The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one processStyle call per block. Generated JS and CSS bytes are both counted.
- TIMED STYLE CORPUS CENSUS: 200/200 files contain 200 style block(s): scoped=200, CSS Modules=0, v-bind=0, preprocessors=0, external src=0. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.
- STYLE CORRECTNESS GATE (untimed, mandatory for style ranking): suite 2026-09-12.3 (dc4ba0a462e6) runs 17 independent plants covering ordinary and compound scoped selectors; :deep(), :slotted(), :global(), :is() and :where() semantics; selectors nested in @media/@supports; scoped keyframe declaration/reference consistency; multiple and quoted v-bind() expression linkage; and CSS Modules mapping. Checks assert semantic relationships, never whole generated-CSS equality. Vize compileSfc and one real multi-input compileSfcBatchWithResults call have separate verdicts; Verter uses one fresh-host multi-input compileMany followed by serial processStyle; fervid sync and async are checked separately. Any failure is measured but UNRANKED and self-clears after a fixed upgrade. Plants execute after timing so they cannot pre-warm measured entrypoints; manifest metadata is retained in validation.styleCorrectnessManifest.
- SASS/SCSS CAPABILITY AUDIT (untimed, diagnostic): suite 2026-08-20.2 (e302bbad5972) runs 8 independent lang=scss/lang=sass plants for variables, mixins/nesting, scoped selectors, :deep() inside @media, v-bind linkage and CSS Modules. validation.stylePreprocessors keeps two non-interchangeable verdicts: exactEntrypoints says whether the measured compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call; sharedSassAdapter first runs the pinned sass dependency once per plant and then tests only each compiler's downstream Vue-style transform. Harness preprocessing can never turn an unsupported exact API into PASS. These diagnostic plants do not gate the separately defined timed inline-plain-CSS class.
- RUNTIME SEMANTIC GATE (untimed, mandatory): suite 2026-09-12.2 runs 33 independent valid-SFC plants against observable DOM/events/updates/public-instance behaviour, never generated-text equality. It certifies Vue's composed non-inline API, Vize single and real multi-input batch, fresh-host stateless multi-input Verter compileMany, and fervid sync/async separately with the exact target/env/map flags. Each API runs in an isolated child after all timings; every outcome and the manifest hash are retained in validation.compileSemantics. FAIL, crash, timeout, missing verdict and UNKNOWN are measured but UNRANKED. Vapor output is executed with Vue's pinned, version-matched 3.6 compiler/runtime and shipped createVaporApp path; each Vapor entrypoint receives its own PASS/FAIL verdict, while unsupported backends remain UNKNOWN individually. VDOM evidence is never borrowed.
- Scheduling is not disguised as equal: Vue's reference and Vize compileSfc loop are 1T; Vize's with-results API compiles inside the process-global Rayon pool; Verter compileMany uses its host pool but public processStyle is synchronous and is called serially; fervid async uses libuv. Each row says so.
- Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.
- The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.
- ⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested from every compiler in a cell (Vue and Vize single-file: sourceMap; Vize batch: includeSourceMap; Verter: compileProfile.sourceMap/processStyle sourcemap; fervid: FervidJsCompilerOptions.sourceMap). Raw render requires a JS map. Style-inclusive rows emit two artifacts and therefore require both JS and CSS maps. Timed paths assert returned bytes whenever the installed capability exists. Current executable presence probe: Vize single JS=YES/CSS=NO, Vize batch JS=YES/CSS=NO, Verter runtime-render JS=NO/processStyle CSS=NO, fervid JS=YES/CSS=NO. Presence is not mapping correctness: a separate post-timing child traces selected script/template/CSS AST positions to the exact filename, full SFC content and UTF-16 coordinates for LF and CRLF plants. Each exact entrypoint and raw/style workload needs its own PASS in validation.sourceMaps; missing, failed or unknown evidence keeps that row UNRANKED. Vue template maps are translated to full SFC coordinates inside its timed composed adapter, including the first-line block column.
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

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

pass **293** · fail **129** · warn **0** · skip **26**

| Case | vue-3.5 | vue-3.6 | vize | fervid | verter | @vue/compiler-sfc | @vue/compiler-sfc-36 | @vizejs/native:compileSfcBatchWithResults | @vizejs/native:compileSfc | @verter/native | @fervid/napi:compileSync | @fervid/napi:compileAsync | vize-single | vize-batch | verter-compile-many | fervid-sync | fervid-async | compiler-rs-vapor | compiler-rs-vdom | babel-vue-jsx | vue-jsx-vapor-api |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `component-props` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `component-props (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `component-slot-children` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `component-slot-children (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `conditional` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `conditional (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `counter-click` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `css-v-bind` | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `custom-directive` | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `define-model-modifiers` | ✓ | ✓ | ✓ | ✓ | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `dynamic-arg` | ✓ | ✓ | **✗** | **✗** | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `dynamic-component-is` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `dynamic-slot-name` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `event-handler` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `event-handler (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `event-modifiers` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `fragment` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `fragment (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `inherit-attrs-false` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `inherit-attrs-true` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `interp-text` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `keep-alive` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `list-map` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `list-map (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `props-echo` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `reactive-props-destructure-shadowing` | ✓ | ✓ | **✗** | ✓ | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `slot-default` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `slot-fallback` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `source-map-vapor-development-crlf-raw` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vapor-development-crlf-styles` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vapor-development-lf-raw` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vapor-development-lf-styles` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vapor-production-crlf-raw` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vapor-production-crlf-styles` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vapor-production-lf-raw` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vapor-production-lf-styles` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vdom-development-crlf-raw` | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | **✗** | **✗** | – | – | – | – |
| `source-map-vdom-development-crlf-styles` | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | **✗** | **✗** | – | – | – | – |
| `source-map-vdom-development-lf-raw` | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ✓ | ✓ | – | – | – | – |
| `source-map-vdom-development-lf-styles` | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | **✗** | **✗** | – | – | – | – |
| `source-map-vdom-production-crlf-raw` | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | **✗** | **✗** | – | – | – | – |
| `source-map-vdom-production-crlf-styles` | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | **✗** | **✗** | – | – | – | – |
| `source-map-vdom-production-lf-raw` | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ✓ | ✓ | – | – | – | – |
| `source-map-vdom-production-lf-styles` | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | **✗** | **✗** | – | – | – | – |
| `spread-collisions-update-removal` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ○ | – | – | ○ |
| `spread-collisions-update-removal (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `spread-props` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `spread-props (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `static-div` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `static-div (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `style-css-modules` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-deep` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | ✓ | – | – | – | – | – | – | – | – | – |
| `style-deep-compound` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – |
| `style-global` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-global-mixed-local` | – | – | – | – | – | ✓ | ✓ | **✗** | **✗** | **✗** | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-is-selector-list` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-media-scoped` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-multiple-style-blocks` | – | – | – | – | – | ✓ | ✓ | **✗** | **✗** | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – |
| `style-scoped` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – |
| `style-scoped-keyframes` | – | – | – | – | – | ✓ | ✓ | **✗** | **✗** | **✗** | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-slotted` | – | – | – | – | – | ✓ | ✓ | **✗** | **✗** | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-slotted-compound` | – | – | – | – | – | ✓ | ✓ | **✗** | **✗** | **✗** | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-supports-scoped` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – |
| `style-v-bind` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-v-bind-multiple` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-v-bind-quoted` | – | – | – | – | – | ✓ | ✓ | **✗** | **✗** | **✗** | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-where-selector-list` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `teleport` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `template-ref` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-bind-object` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-for-list` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-for-template-destructure` | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-if-false` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-if-true` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-memo` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-model-choice` | ✓ | ✓ | ✓ | ✓ | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-model-component` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-model-modifiers` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-model-native-input` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-once` | ✓ | ✓ | ✓ | ✓ | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-pre` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-show` | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-show-directive` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `v-show-directive (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `v-text-v-html` | ✓ | ✓ | ✓ | ✓ | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |

<details><summary>Failure detail</summary>

- `v-for-list` · **fervid** — Invalid destructuring assignment target
- `slot-fallback` · **fervid** — fallback is not a function
- `dynamic-component-is` · **fervid** — &lt;component :is> did not render initial component
- `v-once` · **verter** — expected text "0", got "1"
- `v-text-v-html` · **verter** — expected text "compiled", got ""
- `keep-alive` · **fervid** — Unable to get [data-testid=count] within: &lt;div class="keep-alive-host">   &lt;component is="[object Object]">&lt;/component>&lt;button type="button" data-testid="toggle">t&lt;/button> &lt;/div>
- `custom-directive` · **fervid** — directive updated hook did not receive the new value
- `custom-directive` · **verter** — directive value not delivered: data-hit=undefined
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
- `reactive-props-destructure-shadowing` · **vize** — shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"
- `reactive-props-destructure-shadowing` · **verter** — lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"
- `style-multiple-style-blocks` · **@vizejs/native:compileSfcBatchWithResults** — multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics
- `style-slotted` · **@vizejs/native:compileSfcBatchWithResults** — slotted: slotted target must receive the [data-v-…-s] attribute selector
- `style-global-mixed-local` · **@vizejs/native:compileSfcBatchWithResults** — global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector
- `style-slotted-compound` · **@vizejs/native:compileSfcBatchWithResults** — slotted-compound: the slotted scope attribute was not attached to the final compound target
- `style-scoped-keyframes` · **@vizejs/native:compileSfcBatchWithResults** — scoped-keyframes: scoped keyframe name was not rewritten
- `style-v-bind-quoted` · **@vizejs/native:compileSfcBatchWithResults** — v-bind-quoted: margin-left was not rewritten to a CSS variable
- `style-multiple-style-blocks` · **@vizejs/native:compileSfc** — multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics
- `style-slotted` · **@vizejs/native:compileSfc** — slotted: slotted target must receive the [data-v-…-s] attribute selector
- `style-global-mixed-local` · **@vizejs/native:compileSfc** — global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector
- `style-slotted-compound` · **@vizejs/native:compileSfc** — slotted-compound: the slotted scope attribute was not attached to the final compound target
- `style-scoped-keyframes` · **@vizejs/native:compileSfc** — scoped-keyframes: scoped keyframe name was not rewritten
- `style-v-bind-quoted` · **@vizejs/native:compileSfc** — v-bind-quoted: margin-left was not rewritten to a CSS variable
- `style-deep` · **@verter/native** — deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant
- `style-v-bind` · **@verter/native** — v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color)
- `style-global-mixed-local` · **@verter/native** — global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector
- `style-slotted-compound` · **@verter/native** — slotted-compound: the slotted scope attribute was not attached to the final compound target
- `style-is-selector-list` · **@verter/native** — is-selector-list: the complete :is() selector list was not preserved
- `style-where-selector-list` · **@verter/native** — where-selector-list: the complete :where() selector list was not preserved
- `style-scoped-keyframes` · **@verter/native** — scoped-keyframes: scoped keyframe name was not rewritten
- `style-v-bind-multiple` · **@verter/native** — v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color)
- `style-v-bind-quoted` · **@verter/native** — v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap)
- `style-slotted` · **@fervid/napi:compileSync** — slotted: :slotted() pseudo-selector was left in generated CSS
- `style-global` · **@fervid/napi:compileSync** — global: :global() pseudo-selector was left in generated CSS
- `style-v-bind` · **@fervid/napi:compileSync** — v-bind: v-bind() was not rewritten to a CSS variable
- `style-css-modules` · **@fervid/napi:compileSync** — css-modules: class mapping was not generated or does not match emitted CSS
- `style-global-mixed-local` · **@fervid/napi:compileSync** — global-mixed-local: :global() pseudo-selector was left in generated CSS
- `style-slotted-compound` · **@fervid/napi:compileSync** — slotted-compound: :slotted() pseudo-selector was left in generated CSS
- `style-is-selector-list` · **@fervid/napi:compileSync** — is-selector-list: the scope attribute was not attached outside :is()
- `style-where-selector-list` · **@fervid/napi:compileSync** — where-selector-list: the scope attribute was not attached outside :where()
- `style-media-scoped` · **@fervid/napi:compileSync** — media-scoped: selector nested in @media was not scope-rewritten
- `style-scoped-keyframes` · **@fervid/napi:compileSync** — scoped-keyframes: scoped keyframe name was not rewritten
- `style-v-bind-multiple` · **@fervid/napi:compileSync** — v-bind-multiple: v-bind() was not rewritten to a CSS variable
- `style-v-bind-quoted` · **@fervid/napi:compileSync** — v-bind-quoted: v-bind() was not rewritten to a CSS variable
- `style-slotted` · **@fervid/napi:compileAsync** — slotted: :slotted() pseudo-selector was left in generated CSS
- `style-global` · **@fervid/napi:compileAsync** — global: :global() pseudo-selector was left in generated CSS
- `style-v-bind` · **@fervid/napi:compileAsync** — v-bind: v-bind() was not rewritten to a CSS variable
- `style-css-modules` · **@fervid/napi:compileAsync** — css-modules: class mapping was not generated or does not match emitted CSS
- `style-global-mixed-local` · **@fervid/napi:compileAsync** — global-mixed-local: :global() pseudo-selector was left in generated CSS
- `style-slotted-compound` · **@fervid/napi:compileAsync** — slotted-compound: :slotted() pseudo-selector was left in generated CSS
- `style-is-selector-list` · **@fervid/napi:compileAsync** — is-selector-list: the scope attribute was not attached outside :is()
- `style-where-selector-list` · **@fervid/napi:compileAsync** — where-selector-list: the scope attribute was not attached outside :where()
- `style-media-scoped` · **@fervid/napi:compileAsync** — media-scoped: selector nested in @media was not scope-rewritten
- `style-scoped-keyframes` · **@fervid/napi:compileAsync** — scoped-keyframes: scoped keyframe name was not rewritten
- `style-v-bind-multiple` · **@fervid/napi:compileAsync** — v-bind-multiple: v-bind() was not rewritten to a CSS variable
- `style-v-bind-quoted` · **@fervid/napi:compileAsync** — v-bind-quoted: v-bind() was not rewritten to a CSS variable
- `source-map-vdom-production-lf-raw` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-raw` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-production-lf-styles` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-styles` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-lf-raw` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-raw` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-production-lf-styles` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-styles` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-lf-raw` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-raw` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-production-lf-styles` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-styles` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-raw` · **fervid-sync** — script: script: mapped to 2:14; expected 2:15
- `source-map-vdom-production-lf-styles` · **fervid-sync** — css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-styles` · **fervid-sync** — script: script: mapped to 2:14; expected 2:15; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-raw` · **fervid-async** — script: script: mapped to 2:14; expected 2:15
- `source-map-vdom-production-lf-styles` · **fervid-async** — css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-styles` · **fervid-async** — script: script: mapped to 2:14; expected 2:15; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-lf-raw` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-raw` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-development-lf-styles` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-styles` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-lf-raw` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-raw` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-development-lf-styles` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-styles` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-lf-raw` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-raw` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vdom-development-lf-styles` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-styles` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-raw` · **fervid-sync** — script: script: mapped to 2:14; expected 2:15
- `source-map-vdom-development-lf-styles` · **fervid-sync** — css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-styles` · **fervid-sync** — script: script: mapped to 2:14; expected 2:15; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-raw` · **fervid-async** — script: script: mapped to 2:14; expected 2:15
- `source-map-vdom-development-lf-styles` · **fervid-async** — css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-styles` · **fervid-async** — script: script: mapped to 2:14; expected 2:15; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-lf-raw` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-production-crlf-raw` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-production-lf-styles` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-crlf-styles` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-lf-raw` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-production-crlf-raw` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-production-lf-styles` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-crlf-styles` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-lf-raw` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-production-crlf-raw` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-production-lf-styles` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-crlf-styles` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-development-lf-raw` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-development-crlf-raw` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-development-lf-styles` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-development-crlf-styles` · **vize-single** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-development-lf-raw` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-development-crlf-raw` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-development-lf-styles` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-development-crlf-styles` · **vize-batch** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-development-lf-raw` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-development-crlf-raw` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map
- `source-map-vapor-development-lf-styles` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-development-crlf-styles` · **verter-compile-many** — script: missing or invalid version-3 source map; template: missing or invalid version-3 source map; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

### compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| fervid compileSync (1T) vdom-prod | 15.83 / 15.83 / 15.83 | 0.83 / 0.83 / 0.83 | 43 | 107.6 | 41 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vapor-prod | 16.06 / 16.06 / 16.06 | 0.98 / 0.98 / 0.98 | 42 | 108.4 | 39 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod | 16.24 / 16.24 / 16.24 | 0.93 / 0.93 / 0.93 | 42 | 108.1 | 39 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod | 18.12 / 18.12 / 18.12 | 0.81 / 0.81 / 0.81 | n/a | n/a | 18 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod | 18.11 / 18.11 / 18.11 | 0.84 / 0.84 / 0.84 | n/a | n/a | 19 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod | 18.50 / 18.50 / 18.50 | 0.89 / 0.89 / 0.89 | n/a | n/a | 19 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod | 18.62 / 18.62 / 18.62 | 0.85 / 0.85 / 0.85 | n/a | n/a | 18 | 3 |
| Verter compileMany (stateless raw render) vapor-prod | 35.83 / 35.83 / 35.83 | 0.82 / 0.82 / 0.82 | 101 | 151.0 | 66 | 3 |
| Verter compileMany (stateless raw render) vdom-prod | 35.85 / 35.85 / 35.85 | 0.80 / 0.80 / 0.80 | 103 | 156.0 | 66 | 3 |
| Verter compileMany + processStyle (render + CSS) vdom-prod | 38.01 / 38.01 / 38.01 | 1.00 / 1.00 / 1.00 | 113 | 165.9 | 68 | 3 |
| Verter compileMany + processStyle (render + CSS) vapor-prod | 38.18 / 38.18 / 38.18 | 1.02 / 1.02 / 1.02 | 109 | 158.5 | 69 | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 61.12 / 61.81 / 61.81 | 21.61 / 21.61 / 21.61 | 1056 | 194.6 | 538 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 63.28 / 63.34 / 63.28 | 20.10 / 20.10 / 20.10 | 1025 | 199.1 | 515 | 3 |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 64.30 / 65.88 / 65.14 | 31.79 / 31.79 / 31.79 | 1131 | 193.4 | 588 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod | 72.00 / 72.00 / 72.00 | 39.68 / 39.68 / 39.68 | 1409 | 194.6 | 728 | 3 |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod | 77.05 / 78.15 / 77.29 | 42.35 / 42.35 / 42.35 | 1540 | 195.9 | 786 | 3 |

<details><summary>Notes</summary>

- **fervid compileSync (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfc loop (render + CSS, 1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany (stateless raw render) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany (stateless raw render) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany + processStyle (render + CSS) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany + processStyle (render + CSS) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.6 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.5 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.6 vapor (1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### jsx-compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | 10.64 / 10.64 / 10.64 | 0.35 / 0.35 / 0.35 | n/a | n/a | 7 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) | 10.76 / 10.76 / 10.76 | 0.35 / 0.35 / 0.35 | n/a | n/a | 6 | 3 |
| @vue/babel-plugin-jsx | 65.18 / 65.18 / 65.18 | 32.63 / 32.63 / 32.63 | 789 | 172.4 | 454 | 3 |

<details><summary>Notes</summary>

- **@vue-jsx-vapor/compiler-rs (interop VDOM)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue-jsx-vapor/compiler-rs (vapor)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/babel-plugin-jsx** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

## Tool versions

<details><summary>Every pinned package in this run</summary>

| Package | Version |
| --- | --- |
| node | v22.23.2 |
| vue | 3.5.42 |
| vue-36 | 3.6.0-rc.8 |
| @vue/compiler-sfc | 3.5.42 |
| @vue/compiler-sfc-36 | 3.6.0-rc.8 |
| vize | 0.421.0 |
| @vizejs/native | 0.421.0 |
| @verter/native | 0.0.1-beta.3 |
| @fervid/napi | 0.4.1 |
| verter-tsc | 0.0.1-beta.3 |
| @verter/component-meta | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| verter-mcp | 0.0.1-beta.3 |
| @vue/language-server | 3.3.11 |
| @vue/typescript-plugin | 3.3.11 |
| typescript-language-server | 6.0.0 |
| vue-tsc | 3.3.11 |
| vue-component-meta | 3.3.11 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.6 |
| oxfmt | 0.67.0 |
| oxlint | 1.82.0 |
| eslint-plugin-vue | 10.11.0 |
| @biomejs/biome | 2.5.13 |
| typescript | 6.0.3 |
| cli:vize | 0.421.0 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.67.0 |
| cli:oxlint | 1.82.0 |
| cli:biome | 2.5.13 |
| vue-jsx-vapor | 3.2.23 |
| @vue-jsx-vapor/compiler-rs | 3.2.23 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.5 |

</details>
