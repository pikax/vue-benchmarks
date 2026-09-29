# Compiler

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-09-29T12:56:26.892Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · INTEL(R) XEON(R) PLATINUM 8573C · 15.6 GB · Node v22.23.2
- **Commit:** [`8a88482`](https://github.com/pikax/vue-benchmarks/commit/8a8848276c52956d7e54e262e5846e41fc922288)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/36570273148
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
| @vue/compiler-sfc 3.5 (1T) | 477.2 ms | 467.1 ms | 25.1 ms | 5.3% | 1.00x | **239.1 ms** | 203.9 ms | 23.1 ms | 9.7% | 1.00x | 735,261 | 836 files/s | 63.8 MB |
| @vue/compiler-sfc 3.6 (1T) | 485.7 ms | 483.0 ms | 23.3 ms | 4.8% | 1.02x | **264.7 ms** | 250.9 ms | 12.4 ms | 4.7% | 1.11x | 735,261 | 755 files/s | 63.5 MB |

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
| Vue compiler-sfc 3.5 reference (raw render, 1T) | 472.2 ms | 463.9 ms | 45.0 ms | 9.5% | 1.00x | **238.0 ms** | 212.7 ms | 12.9 ms | 5.4% | 1.00x | 735,061 | 840 files/s | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (25.5 ms) | (25.3 ms) | (0.3 ms) | (1.3%) | not ranked | (24.1 ms) | (23.3 ms) | (0.6 ms) | (2.3%) | not ranked | (674,448) | – | (21.6 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (140.0 ms) | (136.7 ms) | (2.7 ms) | (1.9%) | not ranked | (134.2 ms) | (127.6 ms) | (5.8 ms) | (4.3%) | not ranked | (537,073) | – | (45.3 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +4 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vdom-production-sourcemap-13l0zgz-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-linux-200-bench-compile-vdom-production-sourcemap-13l0zgz.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | 557.8 ms | 552.6 ms | 9.4 ms | 1.7% | 1.00x | **292.4 ms** | 262.3 ms | 23.5 ms | 8.0% | 1.00x | 769,363 | 684 files/s | 65.5 MB |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (72.6 ms) | (71.5 ms) | (1.9 ms) | (2.7%) | not ranked | (72.3 ms) | (71.2 ms) | (1.1 ms) | (1.5%) | not ranked | (707,730) | – | (19.2 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (27.3 ms) | (27.0 ms) | (0.6 ms) | (2.2%) | not ranked | (25.5 ms) | (24.4 ms) | (1.6 ms) | (6.2%) | not ranked | (707,730) | – | (21.6 MB) |
| fervid compileSync (1T) ⚠ | (52.5 ms) | (52.4 ms) | (0.2 ms) | (0.5%) | not ranked | (49.9 ms) | (49.5 ms) | (0.4 ms) | (0.8%) | not ranked | (886,876) | – | (15.8 MB) |
| fervid compileAsync (4-thread libuv pool) ⚠ | (26.4 ms) | (25.8 ms) | (0.4 ms) | (1.6%) | not ranked | (37.4 ms) | (22.3 ms) | (12.1 ms) | (32.4%) | not ranked | (886,876) | – | – |
| Verter compileMany + transformVueStyle (render + CSS) ⚠ | (129.3 ms) | (123.7 ms) | (7.9 ms) | (6.1%) | not ranked | (115.5 ms) | (109.1 ms) | (4.0 ms) | (3.5%) | not ranked | (598,941) | – | (47.6 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (65:100)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + transformVueStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public transformVueStyle call per style block; forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. transformVueStyle is synchronous and called serially on the JS thread; a non-empty refusals list fails the pass. cacheHit must stay zero. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +4 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Fresh child (first timed row workload): 528.4 ms, 477.2 ms, 467.1 ms, 469.9 ms, 479.7 ms · Warm: 252.2 ms, 239.1 ms, 231.0 ms, 264.9 ms, 203.9 ms
- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 537.0 ms, 483.0 ms, 486.0 ms, 484.9 ms, 485.7 ms · Warm: 282.0 ms, 271.1 ms, 264.7 ms, 250.9 ms, 255.8 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Fresh child (first timed row workload): 570.9 ms, 477.9 ms, 469.7 ms, 463.9 ms, 472.2 ms · Warm: 243.1 ms, 238.1 ms, 238.0 ms, 221.4 ms, 212.7 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 25.6 ms, 25.4 ms, 25.3 ms, 25.5 ms, 26.1 ms · Warm: 23.3 ms, 24.8 ms, 23.7 ms, 24.2 ms, 24.1 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 140.0 ms, 138.1 ms, 136.7 ms, 143.8 ms, 140.2 ms · Warm: 141.8 ms, 139.7 ms, 131.4 ms, 127.6 ms, 134.2 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 575.4 ms, 557.8 ms, 552.7 ms, 552.6 ms, 562.4 ms · Warm: 322.3 ms, 307.9 ms, 292.4 ms, 279.4 ms, 262.3 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 76.5 ms, 72.6 ms, 72.1 ms, 71.5 ms, 72.7 ms · Warm: 71.2 ms, 72.3 ms, 71.7 ms, 72.4 ms, 74.2 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 27.9 ms, 28.5 ms, 27.3 ms, 27.0 ms, 27.2 ms · Warm: 25.8 ms, 24.4 ms, 28.4 ms, 24.8 ms, 25.5 ms
- **fervid compileSync (1T)**: Fresh child (first timed row workload): 52.4 ms, 52.9 ms, 52.4 ms, 52.5 ms, 52.8 ms · Warm: 49.9 ms, 49.7 ms, 49.5 ms, 50.0 ms, 50.6 ms
- **fervid compileAsync (4-thread libuv pool)**: Fresh child (first timed row workload): 25.8 ms, 26.6 ms, 26.4 ms, 26.1 ms, 26.9 ms · Warm: 37.4 ms, 22.3 ms, 56.1 ms, 35.3 ms, 40.8 ms
- **Verter compileMany + transformVueStyle (render + CSS)**: Fresh child (first timed row workload): 141.0 ms, 123.7 ms, 128.4 ms, 141.1 ms, 129.3 ms · Warm: 115.5 ms, 109.1 ms, 120.4 ms, 116.0 ms, 115.5 ms

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
| @vue/compiler-sfc 3.5 (1T) | 471.9 ms | 462.9 ms | 6.4 ms | 1.4% | 1.00x | **213.5 ms** | 208.7 ms | 7.1 ms | 3.3% | 1.00x | 721,735 | 937 files/s |
| @vue/compiler-sfc 3.6 (1T) | 487.2 ms | 481.2 ms | 3.4 ms | 0.7% | 1.03x | **241.6 ms** | 238.7 ms | 5.0 ms | 2.1% | 1.13x | 721,735 | 828 files/s |

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
| Vue compiler-sfc 3.5 reference (raw render, 1T) | 471.3 ms | 463.5 ms | 4.4 ms | 0.9% | 1.00x | **213.7 ms** | 210.0 ms | 32.6 ms | 15.3% ⚠ | 1.00x | 721,535 | 936 files/s |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (24.5 ms) | (24.2 ms) | (0.2 ms) | (1.0%) | not ranked | (23.0 ms) | (22.8 ms) | (0.6 ms) | (2.7%) | not ranked | (668,636) | – |
| Verter compileMany (first-admission stateless raw render) ⚠ | (151.3 ms) | (145.5 ms) | (4.3 ms) | (2.8%) | not ranked | (132.1 ms) | (130.0 ms) | (6.1 ms) | (4.6%) | not ranked | (699,665) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=false. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-only-sfc [module-load]: compiled module has no default export. Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=false, forceJs=false, sourceMap=false, hmr=vite, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +4 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vdom-development-sourcema-15udlyl-dark.svg">
  <img alt="Compiler — VDOM · development · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-linux-200-bench-compile-vdom-development-sourcema-15udlyl.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | 568.0 ms | 556.4 ms | 6.5 ms | 1.1% | 1.00x | **262.3 ms** | 257.1 ms | 4.6 ms | 1.7% | 1.00x | 755,837 | 763 files/s |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (69.0 ms) | (68.6 ms) | (0.4 ms) | (0.5%) | not ranked | (69.6 ms) | (67.9 ms) | (1.5 ms) | (2.1%) | not ranked | (701,918) | – |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (26.2 ms) | (26.0 ms) | (0.4 ms) | (1.4%) | not ranked | (24.1 ms) | (23.9 ms) | (0.3 ms) | (1.2%) | not ranked | (701,918) | – |
| fervid compileSync (1T) ⚠ | (53.6 ms) | (53.0 ms) | (0.5 ms) | (1.0%) | not ranked | (51.9 ms) | (51.1 ms) | (1.7 ms) | (3.2%) | not ranked | (897,281) | – |
| fervid compileAsync (4-thread libuv pool) ⚠ | (26.4 ms) | (26.3 ms) | (0.2 ms) | (0.8%) | not ranked | (29.6 ms) | (22.8 ms) | (13.7 ms) | (46.3%) | not ranked | (897,281) | – |
| Verter compileMany + transformVueStyle (render + CSS) ⚠ | (135.1 ms) | (126.3 ms) | (6.7 ms) | (4.9%) | not ranked | (124.3 ms) | (123.4 ms) | (5.5 ms) | (4.5%) | not ranked | (761,933) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=false. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-only-sfc [module-load]: compiled module has no default export. Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-only-sfc [module-load]: compiled module has no default export. Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=false, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (41:97)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +9 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=false, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ FAILED CODEGEN VALIDITY GATE — 22/200 files compiled to output that is not parseable JavaScript/TypeScript (first: Comp00008.vue: Invalid parenthesized assignment pattern. (41:97)). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (21/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +9 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + transformVueStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public transformVueStyle call per style block; forceVapor=false, isProduction=false, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. transformVueStyle is synchronous and called serially on the JS thread; a non-empty refusals list fails the pass. cacheHit must stay zero. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +4 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Fresh child (first timed row workload): 462.9 ms, 471.9 ms, 472.2 ms, 467.8 ms, 480.2 ms · Warm: 227.0 ms, 208.7 ms, 213.5 ms, 215.0 ms, 210.9 ms
- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 487.8 ms, 486.6 ms, 490.5 ms, 481.2 ms, 487.2 ms · Warm: 241.6 ms, 238.7 ms, 239.0 ms, 250.7 ms, 244.5 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Fresh child (first timed row workload): 471.3 ms, 471.1 ms, 474.8 ms, 463.5 ms, 473.4 ms · Warm: 220.1 ms, 213.7 ms, 211.7 ms, 286.3 ms, 210.0 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 24.2 ms, 24.5 ms, 24.8 ms, 24.3 ms, 24.6 ms · Warm: 23.0 ms, 23.3 ms, 22.8 ms, 24.4 ms, 23.0 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 157.2 ms, 151.3 ms, 153.7 ms, 145.5 ms, 150.3 ms · Warm: 135.9 ms, 130.0 ms, 144.6 ms, 132.1 ms, 130.1 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 572.0 ms, 559.9 ms, 568.4 ms, 556.4 ms, 568.0 ms · Warm: 262.9 ms, 262.3 ms, 257.1 ms, 268.4 ms, 257.7 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 68.8 ms, 69.1 ms, 68.6 ms, 69.5 ms, 69.0 ms · Warm: 69.6 ms, 67.9 ms, 68.1 ms, 71.2 ms, 70.6 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 26.0 ms, 26.8 ms, 26.8 ms, 26.0 ms, 26.2 ms · Warm: 24.7 ms, 24.2 ms, 24.1 ms, 23.9 ms, 24.1 ms
- **fervid compileSync (1T)**: Fresh child (first timed row workload): 53.0 ms, 53.6 ms, 54.2 ms, 53.1 ms, 54.0 ms · Warm: 55.3 ms, 51.7 ms, 51.9 ms, 52.5 ms, 51.1 ms
- **fervid compileAsync (4-thread libuv pool)**: Fresh child (first timed row workload): 26.4 ms, 26.7 ms, 26.3 ms, 26.8 ms, 26.4 ms · Warm: 29.5 ms, 22.8 ms, 57.9 ms, 29.6 ms, 39.9 ms
- **Verter compileMany + transformVueStyle (render + CSS)**: Fresh child (first timed row workload): 126.3 ms, 143.6 ms, 140.8 ms, 134.7 ms, 135.1 ms · Warm: 123.4 ms, 136.7 ms, 124.3 ms, 124.1 ms, 126.5 ms

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
| @vue/compiler-sfc 3.6 (1T) ⚠ | (772.8 ms) | (759.7 ms) | (10.3 ms) | (1.3%) | not ranked | (401.9 ms) | (399.6 ms) | (52.1 ms) | (13.0%) | not ranked | (711,809) | – | (71.4 MB) |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **@vue/compiler-sfc 3.6 (1T) ⚠**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=true, sourceMap=false ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: directive mounted binding: expected "first|status|true|true", got undefined; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcema-1hc66bq-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcema-1hc66bq.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠ | (768.6 ms) | (762.1 ms) | (14.2 ms) | (1.9%) | not ranked | (412.8 ms) | (396.3 ms) | (9.9 ms) | (2.4%) | not ranked | (711,609) | – | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (27.2 ms) | (27.1 ms) | (0.1 ms) | (0.5%) | not ranked | (25.5 ms) | (24.5 ms) | (0.6 ms) | (2.5%) | not ranked | (749,895) | – | (23.8 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (146.5 ms) | (135.7 ms) | (6.0 ms) | (4.1%) | not ranked | (144.4 ms) | (118.8 ms) | (13.1 ms) | (9.1%) | not ranked | (658,478) | – | (46.1 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: directive mounted binding: expected "first|status|true|true", got undefined; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; template-refs-v-for-update [runtime]: initial v-for template refs: expected "a,b", got ""; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (18/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; +12 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcema-1r4mje5-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-linux-200-bench-compile-vapor-production-sourcema-1r4mje5.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠ | (902.4 ms) | (899.5 ms) | (2.8 ms) | (0.3%) | not ranked | (473.4 ms) | (462.0 ms) | (16.2 ms) | (3.4%) | not ranked | (791,235) | – | (78.6 MB) |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (80.3 ms) | (76.6 ms) | (1.9 ms) | (2.4%) | not ranked | (77.0 ms) | (76.2 ms) | (1.6 ms) | (2.1%) | not ranked | (831,801) | – | (20.4 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (28.8 ms) | (28.6 ms) | (0.3 ms) | (1.0%) | not ranked | (27.0 ms) | (26.6 ms) | (1.0 ms) | (3.7%) | not ranked | (831,801) | – | (23.9 MB) |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – | – |
| Verter compileMany + transformVueStyle (render + CSS) ⚠ | (135.1 ms) | (130.7 ms) | (2.6 ms) | (1.9%) | not ranked | (130.0 ms) | (122.5 ms) | (6.8 ms) | (5.2%) | not ranked | (720,346) | – | (48.5 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: directive mounted binding: expected "first|status|true|true", got undefined; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; template-refs-v-for-update [runtime]: initial v-for template refs: expected "a,b", got ""; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; template-refs-v-for-update [runtime]: initial v-for template refs: expected "a,b", got ""; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5. ⚠ STYLE CORRECTNESS GATE NOT RUN for @fervid/napi; a render+CSS result without the 17-plant CSS semantics suite is not ranked.
- **Verter compileMany + transformVueStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public transformVueStyle call per style block; forceVapor=true, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. transformVueStyle is synchronous and called serially on the JS thread; a non-empty refusals list fails the pass. cacheHit must stay zero. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (18/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; +12 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 788.0 ms, 778.4 ms, 759.7 ms, 772.2 ms, 772.8 ms · Warm: 428.7 ms, 401.9 ms, 520.8 ms, 399.6 ms, 400.4 ms
- **Vue compiler-sfc 3.6 reference (raw render, 1T)**: Fresh child (first timed row workload): 793.4 ms, 768.6 ms, 785.9 ms, 762.9 ms, 762.1 ms · Warm: 412.8 ms, 398.9 ms, 396.3 ms, 416.9 ms, 416.4 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 27.4 ms, 27.2 ms, 27.2 ms, 27.1 ms, 27.1 ms · Warm: 24.5 ms, 25.5 ms, 26.2 ms, 25.6 ms, 25.0 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 147.3 ms, 142.5 ms, 146.5 ms, 135.7 ms, 151.7 ms · Warm: 118.8 ms, 138.7 ms, 149.9 ms, 144.4 ms, 151.0 ms
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 906.5 ms, 899.5 ms, 902.4 ms, 899.8 ms, 902.7 ms · Warm: 499.3 ms, 486.9 ms, 462.0 ms, 473.4 ms, 462.3 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 79.8 ms, 81.7 ms, 76.6 ms, 80.8 ms, 80.3 ms · Warm: 78.1 ms, 77.0 ms, 80.2 ms, 76.5 ms, 76.2 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 29.3 ms, 29.2 ms, 28.6 ms, 28.7 ms, 28.8 ms · Warm: 26.6 ms, 29.0 ms, 27.2 ms, 26.6 ms, 27.0 ms
- **Verter compileMany + transformVueStyle (render + CSS)**: Fresh child (first timed row workload): 136.6 ms, 136.9 ms, 132.9 ms, 130.7 ms, 135.1 ms · Warm: 129.8 ms, 122.5 ms, 141.5 ms, 130.0 ms, 130.8 ms

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
| @vue/compiler-sfc 3.6 (1T) ⚠ | (772.7 ms) | (757.2 ms) | (9.8 ms) | (1.3%) | not ranked | (386.8 ms) | (380.7 ms) | (23.3 ms) | (6.0%) | not ranked | (713,547) | – |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (vapor) ⏭**: Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.
- **@vue/compiler-sfc 3.6 (1T) ⚠**: Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=false, sourceMap=false ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: directive mounted binding: expected "first|status|true|true", got undefined; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcem-0d57nho-dark.svg">
  <img alt="Compiler — VAPOR · development · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcem-0d57nho.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠ | (770.5 ms) | (756.4 ms) | (15.0 ms) | (1.9%) | not ranked | (384.2 ms) | (373.9 ms) | (9.4 ms) | (2.5%) | not ranked | (713,347) | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (26.9 ms) | (26.4 ms) | (1.1 ms) | (4.3%) | not ranked | (25.0 ms) | (24.8 ms) | (0.5 ms) | (2.0%) | not ranked | (749,895) | – |
| Verter compileMany (first-admission stateless raw render) ⚠ | (147.8 ms) | (144.1 ms) | (7.0 ms) | (4.7%) | not ranked | (151.1 ms) | (134.3 ms) | (8.6 ms) | (5.7%) | not ranked | (709,726) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (raw render, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=false. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: directive mounted binding: expected "first|status|true|true", got undefined; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; template-refs-v-for-update [runtime]: initial v-for template refs: expected "a,b", got ""; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=true, isProduction=false, forceJs=false, sourceMap=false, hmr=vite, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (18/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; +12 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

##### SFC compilation with CSS — script, template and style changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcem-1s4kyiz-dark.svg">
  <img alt="Compiler — VAPOR · development · sourcemap off — SFC compilation with CSS — script, template and style changed" src="charts/compiler-bench-linux-200-bench-compile-vapor-development-sourcem-1s4kyiz.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠ | (899.7 ms) | (888.0 ms) | (5.4 ms) | (0.6%) | not ranked | (433.7 ms) | (427.3 ms) | (6.1 ms) | (1.4%) | not ranked | (792,973) | – |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (80.4 ms) | (76.7 ms) | (2.1 ms) | (2.6%) | not ranked | (78.4 ms) | (77.3 ms) | (0.6 ms) | (0.8%) | not ranked | (831,801) | – |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (28.8 ms) | (28.5 ms) | (0.3 ms) | (1.2%) | not ranked | (27.0 ms) | (25.8 ms) | (1.0 ms) | (3.6%) | not ranked | (831,801) | – |
| fervid (vapor) ⏭ | skipped | – | – | – | – | – | – | – | – | – | – | – |
| Verter compileMany + transformVueStyle (render + CSS) ⚠ | (130.7 ms) | (125.9 ms) | (6.0 ms) | (4.6%) | not ranked | (140.5 ms) | (132.7 ms) | (7.1 ms) | (5.1%) | not ranked | (771,594) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) ⚠**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=false. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (30/33 passed) — dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers [runtime]: directive mounted binding: expected "first|status|true|true", got undefined; v-memo-dependency-gating [runtime]: memoized subtree skipped: expected "0", got "1". Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=true, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; template-refs-v-for-update [runtime]: initial v-for template refs: expected "a,b", got ""; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=true, isTs=true, templateHoistStatic=false, templateCacheHandlers=false, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — template-ref-define-expose [runtime]: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal [runtime]: _ctx.currentHandler is not a function; template-refs-v-for-update [runtime]: initial v-for template refs: expected "a,b", got ""; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.
- **fervid (vapor) ⏭**: fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5. ⚠ STYLE CORRECTNESS GATE NOT RUN for @fervid/napi; a render+CSS result without the 17-plant CSS semantics suite is not ranked.
- **Verter compileMany + transformVueStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public transformVueStyle call per style block; forceVapor=true, isProduction=false, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. transformVueStyle is synchronous and called serially on the JS thread; a non-empty refusals list fails the pass. cacheHit must stay zero. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (18/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; +12 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics. ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 783.5 ms, 777.2 ms, 757.2 ms, 772.7 ms, 769.7 ms · Warm: 395.4 ms, 382.9 ms, 386.8 ms, 436.9 ms, 380.7 ms
- **Vue compiler-sfc 3.6 reference (raw render, 1T)**: Fresh child (first timed row workload): 771.6 ms, 770.5 ms, 796.4 ms, 756.4 ms, 764.4 ms · Warm: 396.4 ms, 384.2 ms, 381.6 ms, 394.9 ms, 373.9 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 27.3 ms, 26.5 ms, 26.4 ms, 26.9 ms, 29.2 ms · Warm: 26.0 ms, 24.9 ms, 24.8 ms, 25.5 ms, 25.0 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 144.7 ms, 144.1 ms, 159.3 ms, 156.6 ms, 147.8 ms · Warm: 151.1 ms, 134.3 ms, 154.0 ms, 153.8 ms, 142.5 ms
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 888.0 ms, 899.9 ms, 901.3 ms, 895.4 ms, 899.7 ms · Warm: 442.0 ms, 427.3 ms, 428.8 ms, 437.3 ms, 433.7 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 80.9 ms, 76.7 ms, 81.0 ms, 80.4 ms, 77.2 ms · Warm: 78.4 ms, 78.8 ms, 77.3 ms, 78.7 ms, 78.0 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 29.4 ms, 28.9 ms, 28.6 ms, 28.8 ms, 28.5 ms · Warm: 28.3 ms, 25.8 ms, 27.0 ms, 26.3 ms, 27.2 ms
- **Verter compileMany + transformVueStyle (render + CSS)**: Fresh child (first timed row workload): 125.9 ms, 130.7 ms, 129.3 ms, 138.2 ms, 140.0 ms · Warm: 140.5 ms, 132.8 ms, 132.7 ms, 147.0 ms, 147.1 ms

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
- The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one public style-transform call per block. Generated JS and CSS bytes are both counted.
- TIMED STYLE CORPUS CENSUS: 177/200 files contain 177 style block(s): scoped=177, CSS Modules=0, v-bind=0, preprocessors=0, external src=0. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.
- STYLE CORRECTNESS GATE (untimed, mandatory for style ranking): suite 2026-09-12.3 (dc4ba0a462e6) runs 17 independent plants covering ordinary and compound scoped selectors; :deep(), :slotted(), :global(), :is() and :where() semantics; selectors nested in @media/@supports; scoped keyframe declaration/reference consistency; multiple and quoted v-bind() expression linkage; and CSS Modules mapping. Checks assert semantic relationships, never whole generated-CSS equality. Vize compileSfc and one real multi-input compileSfcBatchWithResults call have separate verdicts; Verter uses one fresh-host multi-input compileMany followed by serial transformVueStyle; fervid sync and async are checked separately. Any failure is measured but UNRANKED and self-clears after a fixed upgrade. Plants execute after timing so they cannot pre-warm measured entrypoints; manifest metadata is retained in validation.styleCorrectnessManifest.
- SASS/SCSS CAPABILITY AUDIT (untimed, diagnostic): suite 2026-08-20.2 (e302bbad5972) runs 8 independent lang=scss/lang=sass plants for variables, mixins/nesting, scoped selectors, :deep() inside @media, v-bind linkage and CSS Modules. validation.stylePreprocessors keeps two non-interchangeable verdicts: exactEntrypoints says whether the measured compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call; sharedSassAdapter first runs the pinned sass dependency once per plant and then tests only each compiler's downstream Vue-style transform. Harness preprocessing can never turn an unsupported exact API into PASS. These diagnostic plants do not gate the separately defined timed inline-plain-CSS class.
- RUNTIME SEMANTIC GATE (untimed, mandatory): suite 2026-09-12.2 runs 33 independent valid-SFC plants against observable DOM/events/updates/public-instance behaviour, never generated-text equality. It certifies Vue's composed non-inline API, Vize single and real multi-input batch, fresh-host stateless multi-input Verter compileMany, and fervid sync/async separately with the exact target/env/map flags. Each API runs in an isolated child after all timings; every outcome and the manifest hash are retained in validation.compileSemantics. FAIL, crash, timeout, missing verdict and UNKNOWN are measured but UNRANKED. Vapor output is executed with Vue's pinned, version-matched 3.6 compiler/runtime and shipped createVaporApp path; each Vapor entrypoint receives its own PASS/FAIL verdict, while unsupported backends remain UNKNOWN individually. VDOM evidence is never borrowed.
- Scheduling is not disguised as equal: Vue's reference and Vize compileSfc loop are 1T; Vize's with-results API compiles inside the process-global Rayon pool; Verter compileMany uses its host pool but its public style transform is synchronous and is called serially; fervid async uses libuv. Each row says so.
- Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.
- The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.
- ⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested from every compiler in a cell (Vue and Vize single-file: sourceMap; Vize batch: includeSourceMap; Verter: compileProfile.sourceMap/transformVueStyle sourcemap; fervid: FervidJsCompilerOptions.sourceMap). Raw render requires a JS map. Style-inclusive rows emit two artifacts and therefore require both JS and CSS maps. Timed paths assert returned bytes whenever the installed capability exists. Current executable presence probe: Vize single JS=YES/CSS=NO, Vize batch JS=YES/CSS=NO, Verter runtime-render JS=YES/transformVueStyle CSS=YES, fervid JS=YES/CSS=NO. Presence is not mapping correctness: a separate post-timing child traces selected script/template/CSS AST positions to the exact filename, full SFC content and UTF-16 coordinates for LF and CRLF plants. Each exact entrypoint and raw/style workload needs its own PASS in validation.sourceMaps; missing, failed or unknown evidence keeps that row UNRANKED. Vue template maps are translated to full SFC coordinates inside its timed composed adapter, including the first-line block column.
- TypeScript handling is ONE benchmark standard for the whole cell: PASSTHROUGH, requested identically from every compiler (Vue and fervid preserve annotations by their API behaviour; Vize via isTs:true; Verter via forceJs:false). The report describes the exact benchmark call rather than inferring behaviour from a separate Vite integration.
- Verter analysisLevel=full for every timed and validation call. The default benchmark setting is full; VERTER_ANALYSIS_LEVEL remains an explicit diagnostic override, and every Verter row prints the effective value so a tuned run cannot masquerade as the default. devMode follows the cell's isProduction value.
- Production vs development uses each tool's real semantic knobs: Vue isProd (hoistStatic + cacheHandlers); Vize templateHoistStatic + templateCacheHandlers; Verter isProduction + hmrStrategy; fervid isProduction.
- VIZE MODE CAPABILITY AUDIT (untimed): VDOM compileSfc=YES, VDOM compileSfcBatchWithResults=YES; Vapor compileSfc output changes=NO, Vapor batch output changes=NO. "NO" for the Vapor observation is not itself a failure: the current Vapor backend does not use these VDOM transforms. A VDOM row whose options stop affecting output is automatically unranked.
- VERTER API CAPABILITY AUDIT (untimed): runtime-render emits compiled CSS=NO. The style adapter composes runtime-render + transformVueStyle only while runtime-render returns no CSS; if an upgrade starts emitting CSS, that row is automatically unranked pending adapter revalidation so CSS cannot be charged twice.
- fervid and Vize's full-SFC APIs, Vue's composed compiler-sfc reference, and Verter's composed render + style-transform path are classified in the style-inclusive class because each timed row emits both JS and CSS. API composition and scheduling differences remain explicit row properties.
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
| @vue-jsx-vapor/compiler-rs (vapor) ⚠ | (3.1 ms) | (2.6 ms) | – | – | not ranked | (96,924) | – |
| vue-jsx-vapor/api ⚠ | (3.3 ms) | (2.9 ms) | – | – | not ranked | (96,924) | – |

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
| @vue-jsx-vapor/compiler-rs (interop VDOM) | **2.4 ms** | 2.2 ms | 0.6 ms | 25.1% ⚠ | 1.00x | 94,084 | 84.1k files/s |
| @vue/babel-plugin-jsx (Babel VDOM) | **144.9 ms** | 131.6 ms | 10.0 ms | 6.9% | 60.94x | 57,284 | 1.4k files/s |

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

- **@vue-jsx-vapor/compiler-rs (vapor)**: 3.2 ms, 3.1 ms, 4.7 ms, 3.1 ms, 2.6 ms
- **vue-jsx-vapor/api**: 3.3 ms, 3.3 ms, 3.7 ms, 3.8 ms, 2.9 ms
- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: 2.4 ms, 2.7 ms, 3.7 ms, 2.2 ms, 2.2 ms
- **@vue/babel-plugin-jsx (Babel VDOM)**: 144.9 ms, 149.3 ms, 135.3 ms, 156.0 ms, 131.6 ms

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
| @vue/compiler-sfc 3.5 (1T) | 114.7 ms | 114.0 ms | 1.0 ms | 0.9% | 1.00x | **48.5 ms** | 46.7 ms | 2.6 ms | 5.3% | 1.00x | 214,800 | 4.1k files/s | 63.8 MB |
| @vue/compiler-sfc 3.6 (1T) | 122.2 ms | 120.3 ms | 2.6 ms | 2.2% | 1.07x | **58.5 ms** | 46.5 ms | 17.0 ms | 29.1% ⚠ | 1.21x | 214,800 | 3.4k files/s | 63.5 MB |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

###### Raw SFC compilation — identical changed inputs; no output-cache reuse

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | 117.0 ms | 116.7 ms | 0.4 ms | 0.3% | 1.00x | **41.9 ms** | 41.9 ms | 0.0 ms | 0.1% | 1.00x | 214,600 | 4.8k files/s | – |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (6.6 ms) | (6.5 ms) | (0.1 ms) | (2.1%) | not ranked | (5.4 ms) | (5.1 ms) | (0.4 ms) | (6.9%) | not ranked | (157,200) | – | (21.6 MB) |
| Verter compileMany (first-admission stateless raw render) ⚠ | (54.6 ms) | (49.4 ms) | (7.2 ms) | (13.3%) | not ranked | (56.5 ms) | (53.3 ms) | (4.5 ms) | (8.0%) | not ranked | (119,200) | – | (45.3 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +4 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

###### SFC compilation with CSS — script, template and style changed

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | 193.2 ms | 192.6 ms | 0.7 ms | 0.4% | 1.00x | **110.8 ms** | 104.5 ms | 9.0 ms | 8.1% | 1.00x | 242,000 | 1.8k files/s | 65.5 MB |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (15.9 ms) | (15.6 ms) | (0.5 ms) | (2.9%) | not ranked | (14.5 ms) | (14.5 ms) | (0.0 ms) | (0.0%) | not ranked | (183,800) | – | (19.2 MB) |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (7.5 ms) | (7.4 ms) | (0.1 ms) | (1.7%) | not ranked | (6.0 ms) | (5.8 ms) | (0.2 ms) | (3.5%) | not ranked | (183,800) | – | (21.6 MB) |
| fervid compileSync (1T) ⚠ | (10.6 ms) | (10.6 ms) | (0.0 ms) | (0.1%) | not ranked | (10.1 ms) | (10.0 ms) | (0.0 ms) | (0.4%) | not ranked | (199,361) | – | (15.8 MB) |
| fervid compileAsync (4-thread libuv pool) ⚠ | (8.9 ms) | (8.5 ms) | (0.5 ms) | (5.9%) | not ranked | (15.8 ms) | (15.8 ms) | (0.1 ms) | (0.5%) | not ranked | (199,361) | – | – |
| Verter compileMany + transformVueStyle (render + CSS) ⚠ | (51.2 ms) | (50.0 ms) | (1.6 ms) | (3.1%) | not ranked | (51.7 ms) | (50.9 ms) | (1.2 ms) | (2.4%) | not ranked | (179,600) | – | (47.6 MB) |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 33/33 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [multiple-style-blocks] multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (27/33 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing [runtime]: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"; +3 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ⚠**: compileSync isProduction=true, sourceMap=false, single-threaded. Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileAsync (4-thread libuv pool) ⚠**: compileAsync isProduction=true, sourceMap=false, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=4, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than 4 cores this row is thread-capped below the batch rows beside it). Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (&lt;div />, &lt;MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence. ⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: artifact. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: :slotted() pseudo-selector was left in generated CSS; [global] global: :global() pseudo-selector was left in generated CSS; [v-bind] v-bind: v-bind() was not rewritten to a CSS variable; [css-modules] css-modules: class mapping was not generated or does not match emitted CSS; [global-mixed-local] global-mixed-local: :global() pseudo-selector was left in generated CSS; [slotted-compound] slotted-compound: :slotted() pseudo-selector was left in generated CSS; [is-selector-list] is-selector-list: the scope attribute was not attached outside :is(); [where-selector-list] where-selector-list: the scope attribute was not attached outside :where(); [media-scoped] media-scoped: selector nested in @media was not scope-rewritten; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: v-bind() was not rewritten to a CSS variable; [v-bind-quoted] v-bind-quoted: v-bind() was not rewritten to a CSS variable. All 17 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/33 passed) — object-dynamic-bindings-events [runtime]: initial v-bind object: expected "first", got undefined; scoped-slot-props [runtime]: value is not defined; event-modifier-semantics [runtime]: event modifiers: expected "0|2|1|1", got "0|2|2|1"; +7 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany + transformVueStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public transformVueStyle call per style block; forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. transformVueStyle is synchronous and called serially on the JS thread; a non-empty refusals list fails the pass. cacheHit must stay zero. ✓ STYLE CORRECTNESS GATE: all 17 independent CSS semantics plants passed. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/33 passed) — reactive-props-destructure-shadowing [runtime]: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default [runtime]: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +4 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Fresh child (first timed row workload): 114.0 ms, 115.4 ms · Warm: 50.3 ms, 46.7 ms
- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 120.3 ms, 124.1 ms · Warm: 70.6 ms, 46.5 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Fresh child (first timed row workload): 117.3 ms, 116.7 ms · Warm: 42.0 ms, 41.9 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 6.7 ms, 6.5 ms · Warm: 5.1 ms, 5.6 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 49.4 ms, 59.7 ms · Warm: 53.3 ms, 59.7 ms
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 192.6 ms, 193.7 ms · Warm: 117.2 ms, 104.5 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 15.6 ms, 16.3 ms · Warm: 14.5 ms, 14.5 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 7.4 ms, 7.5 ms · Warm: 6.1 ms, 5.8 ms
- **fervid compileSync (1T)**: Fresh child (first timed row workload): 10.6 ms, 10.6 ms · Warm: 10.1 ms, 10.0 ms
- **fervid compileAsync (4-thread libuv pool)**: Fresh child (first timed row workload): 9.2 ms, 8.5 ms · Warm: 15.8 ms, 15.9 ms
- **Verter compileMany + transformVueStyle (render + CSS)**: Fresh child (first timed row workload): 52.3 ms, 50.0 ms · Warm: 52.6 ms, 50.9 ms

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
- The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one public style-transform call per block. Generated JS and CSS bytes are both counted.
- TIMED STYLE CORPUS CENSUS: 200/200 files contain 200 style block(s): scoped=200, CSS Modules=0, v-bind=0, preprocessors=0, external src=0. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.
- STYLE CORRECTNESS GATE (untimed, mandatory for style ranking): suite 2026-09-12.3 (dc4ba0a462e6) runs 17 independent plants covering ordinary and compound scoped selectors; :deep(), :slotted(), :global(), :is() and :where() semantics; selectors nested in @media/@supports; scoped keyframe declaration/reference consistency; multiple and quoted v-bind() expression linkage; and CSS Modules mapping. Checks assert semantic relationships, never whole generated-CSS equality. Vize compileSfc and one real multi-input compileSfcBatchWithResults call have separate verdicts; Verter uses one fresh-host multi-input compileMany followed by serial transformVueStyle; fervid sync and async are checked separately. Any failure is measured but UNRANKED and self-clears after a fixed upgrade. Plants execute after timing so they cannot pre-warm measured entrypoints; manifest metadata is retained in validation.styleCorrectnessManifest.
- SASS/SCSS CAPABILITY AUDIT (untimed, diagnostic): suite 2026-08-20.2 (e302bbad5972) runs 8 independent lang=scss/lang=sass plants for variables, mixins/nesting, scoped selectors, :deep() inside @media, v-bind linkage and CSS Modules. validation.stylePreprocessors keeps two non-interchangeable verdicts: exactEntrypoints says whether the measured compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call; sharedSassAdapter first runs the pinned sass dependency once per plant and then tests only each compiler's downstream Vue-style transform. Harness preprocessing can never turn an unsupported exact API into PASS. These diagnostic plants do not gate the separately defined timed inline-plain-CSS class.
- RUNTIME SEMANTIC GATE (untimed, mandatory): suite 2026-09-12.2 runs 33 independent valid-SFC plants against observable DOM/events/updates/public-instance behaviour, never generated-text equality. It certifies Vue's composed non-inline API, Vize single and real multi-input batch, fresh-host stateless multi-input Verter compileMany, and fervid sync/async separately with the exact target/env/map flags. Each API runs in an isolated child after all timings; every outcome and the manifest hash are retained in validation.compileSemantics. FAIL, crash, timeout, missing verdict and UNKNOWN are measured but UNRANKED. Vapor output is executed with Vue's pinned, version-matched 3.6 compiler/runtime and shipped createVaporApp path; each Vapor entrypoint receives its own PASS/FAIL verdict, while unsupported backends remain UNKNOWN individually. VDOM evidence is never borrowed.
- Scheduling is not disguised as equal: Vue's reference and Vize compileSfc loop are 1T; Vize's with-results API compiles inside the process-global Rayon pool; Verter compileMany uses its host pool but its public style transform is synchronous and is called serially; fervid async uses libuv. Each row says so.
- Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.
- The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.
- ⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested from every compiler in a cell (Vue and Vize single-file: sourceMap; Vize batch: includeSourceMap; Verter: compileProfile.sourceMap/transformVueStyle sourcemap; fervid: FervidJsCompilerOptions.sourceMap). Raw render requires a JS map. Style-inclusive rows emit two artifacts and therefore require both JS and CSS maps. Timed paths assert returned bytes whenever the installed capability exists. Current executable presence probe: Vize single JS=YES/CSS=NO, Vize batch JS=YES/CSS=NO, Verter runtime-render JS=YES/transformVueStyle CSS=YES, fervid JS=YES/CSS=NO. Presence is not mapping correctness: a separate post-timing child traces selected script/template/CSS AST positions to the exact filename, full SFC content and UTF-16 coordinates for LF and CRLF plants. Each exact entrypoint and raw/style workload needs its own PASS in validation.sourceMaps; missing, failed or unknown evidence keeps that row UNRANKED. Vue template maps are translated to full SFC coordinates inside its timed composed adapter, including the first-line block column.
- TypeScript handling is ONE benchmark standard for the whole cell: PASSTHROUGH, requested identically from every compiler (Vue and fervid preserve annotations by their API behaviour; Vize via isTs:true; Verter via forceJs:false). The report describes the exact benchmark call rather than inferring behaviour from a separate Vite integration.
- Verter analysisLevel=full for every timed and validation call. The default benchmark setting is full; VERTER_ANALYSIS_LEVEL remains an explicit diagnostic override, and every Verter row prints the effective value so a tuned run cannot masquerade as the default. devMode follows the cell's isProduction value.
- Production vs development uses each tool's real semantic knobs: Vue isProd (hoistStatic + cacheHandlers); Vize templateHoistStatic + templateCacheHandlers; Verter isProduction + hmrStrategy; fervid isProduction.
- VIZE MODE CAPABILITY AUDIT (untimed): VDOM compileSfc=YES, VDOM compileSfcBatchWithResults=YES; Vapor compileSfc output changes=NO, Vapor batch output changes=NO. "NO" for the Vapor observation is not itself a failure: the current Vapor backend does not use these VDOM transforms. A VDOM row whose options stop affecting output is automatically unranked.
- VERTER API CAPABILITY AUDIT (untimed): runtime-render emits compiled CSS=NO. The style adapter composes runtime-render + transformVueStyle only while runtime-render returns no CSS; if an upgrade starts emitting CSS, that row is automatically unranked pending adapter revalidation so CSS cannot be charged twice.
- fervid and Vize's full-SFC APIs, Vue's composed compiler-sfc reference, and Verter's composed render + style-transform path are classified in the style-inclusive class because each timed row emits both JS and CSS. API composition and scheduling differences remain explicit row properties.
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

pass **314** · fail **108** · warn **0** · skip **26**

| Case | vue-3.5 | vue-3.6 | vize | fervid | verter | @vue/compiler-sfc | @vue/compiler-sfc-36 | @vizejs/native:compileSfcBatchWithResults | @vizejs/native:compileSfc | @verter/native | @fervid/napi:compileSync | @fervid/napi:compileAsync | vize-single | vize-batch | verter-compile-many | fervid-sync | fervid-async | compiler-rs-vapor | compiler-rs-vdom | babel-vue-jsx | vue-jsx-vapor-api |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `component-props` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `component-props (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `component-slot-children` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `component-slot-children (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `conditional` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `conditional (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `counter-click` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `css-v-bind` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
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
| `source-map-vapor-development-crlf-raw` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | ✓ | ○ | ○ | – | – | – | – |
| `source-map-vapor-development-crlf-styles` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vapor-development-lf-raw` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | ✓ | ○ | ○ | – | – | – | – |
| `source-map-vapor-development-lf-styles` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vapor-production-crlf-raw` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | ✓ | ○ | ○ | – | – | – | – |
| `source-map-vapor-production-crlf-styles` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | **✗** | ○ | ○ | – | – | – | – |
| `source-map-vapor-production-lf-raw` | ○ | ✓ | – | – | – | – | – | – | – | – | – | – | **✗** | **✗** | ✓ | ○ | ○ | – | – | – | – |
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
| `style-deep` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – |
| `style-deep-compound` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – |
| `style-global` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-global-mixed-local` | – | – | – | – | – | ✓ | ✓ | **✗** | **✗** | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-is-selector-list` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-media-scoped` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-multiple-style-blocks` | – | – | – | – | – | ✓ | ✓ | **✗** | **✗** | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – |
| `style-scoped` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – |
| `style-scoped-keyframes` | – | – | – | – | – | ✓ | ✓ | **✗** | **✗** | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-slotted` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-slotted-compound` | – | – | – | – | – | ✓ | ✓ | **✗** | **✗** | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-supports-scoped` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – |
| `style-v-bind` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-v-bind-multiple` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-v-bind-quoted` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `style-where-selector-list` | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – |
| `teleport` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `template-ref` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-bind-object` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-for-list` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-for-template-destructure` | ✓ | ✓ | ✓ | **✗** | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-if-false` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-if-true` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-memo` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-model-choice` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-model-component` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-model-modifiers` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-model-native-input` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-once` | ✓ | ✓ | ✓ | ✓ | **✗** | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-pre` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-show` | ✓ | ✓ | ✓ | **✗** | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| `v-show-directive` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| `v-show-directive (runtime)` | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✓ | ✓ | – |
| `v-text-v-html` | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |

<details><summary>Failure detail</summary>

- `v-for-list` · **fervid** — Invalid destructuring assignment target
- `slot-fallback` · **fervid** — fallback is not a function
- `dynamic-component-is` · **fervid** — &lt;component :is> did not render initial component
- `v-once` · **verter** — expected text "0", got "1"
- `keep-alive` · **fervid** — Unable to get [data-testid=count] within: &lt;div class="keep-alive-host">   &lt;component is="[object Object]">&lt;/component>&lt;button type="button" data-testid="toggle">t&lt;/button> &lt;/div>
- `custom-directive` · **fervid** — directive updated hook did not receive the new value
- `custom-directive` · **verter** — directive value not delivered: data-hit=undefined
- `dynamic-slot-name` · **fervid** — expected text "none", got "dyn-1"
- `event-modifiers` · **fervid** — expected text "0", got "1"
- `css-v-bind` · **fervid** — &lt;style> v-bind() did not inject useCssVars into setup()
- `v-show` · **fervid** — v-show false must set display:none (element must stay in the DOM)
- `define-model-modifiers` · **verter** — Cannot convert undefined or null to object
- `v-bind-object` · **fervid** — v-bind object attrs not applied: data-x=undefined, title=undefined
- `dynamic-arg` · **vize** — :[attrName] initial attr missing: data-a=undefined
- `dynamic-arg` · **fervid** — expected text "1", got "0"
- `dynamic-arg` · **verter** — expected text "1", got "0"
- `v-for-template-destructure` · **fervid** — Invalid destructuring assignment target
- `v-for-template-destructure` · **verter** — keyed &lt;template v-for> recreated the row instead of moving it (marker lost)
- `reactive-props-destructure-shadowing` · **vize** — shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"
- `reactive-props-destructure-shadowing` · **verter** — lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"
- `style-multiple-style-blocks` · **@vizejs/native:compileSfcBatchWithResults** — multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics
- `style-global-mixed-local` · **@vizejs/native:compileSfcBatchWithResults** — global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector
- `style-slotted-compound` · **@vizejs/native:compileSfcBatchWithResults** — slotted-compound: the slotted scope attribute was not attached to the final compound target
- `style-scoped-keyframes` · **@vizejs/native:compileSfcBatchWithResults** — scoped-keyframes: scoped keyframe name was not rewritten
- `style-multiple-style-blocks` · **@vizejs/native:compileSfc** — multiple-style-blocks: scoped and unscoped style blocks must retain their separate selector semantics
- `style-global-mixed-local` · **@vizejs/native:compileSfc** — global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector
- `style-slotted-compound` · **@vizejs/native:compileSfc** — slotted-compound: the slotted scope attribute was not attached to the final compound target
- `style-scoped-keyframes` · **@vizejs/native:compileSfc** — scoped-keyframes: scoped keyframe name was not rewritten
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
- `source-map-vdom-production-lf-raw` · **vize-single** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-production-crlf-raw` · **vize-single** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-production-lf-styles` · **vize-single** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-styles` · **vize-single** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-lf-raw` · **vize-batch** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-production-crlf-raw` · **vize-batch** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-production-lf-styles` · **vize-batch** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-styles` · **vize-batch** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-lf-raw` · **verter-compile-many** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-production-crlf-raw` · **verter-compile-many** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-production-lf-styles` · **verter-compile-many** — template: template: no mapping segment starts at the selected generated token; css-0: css-0: no mapping segment starts at the selected generated token; css-1: css-1: sourcesContent does not equal the complete original SFC
- `source-map-vdom-production-crlf-styles` · **verter-compile-many** — template: template: no mapping segment starts at the selected generated token; css-0: css-0: no mapping segment starts at the selected generated token; css-1: css-1: sourcesContent does not equal the complete original SFC
- `source-map-vdom-production-crlf-raw` · **fervid-sync** — script: script: mapped to 2:14; expected 2:15
- `source-map-vdom-production-lf-styles` · **fervid-sync** — css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-styles` · **fervid-sync** — script: script: mapped to 2:14; expected 2:15; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-raw` · **fervid-async** — script: script: mapped to 2:14; expected 2:15
- `source-map-vdom-production-lf-styles` · **fervid-async** — css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-production-crlf-styles` · **fervid-async** — script: script: mapped to 2:14; expected 2:15; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-lf-raw` · **vize-single** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-development-crlf-raw` · **vize-single** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-development-lf-styles` · **vize-single** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-styles` · **vize-single** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-lf-raw` · **vize-batch** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-development-crlf-raw` · **vize-batch** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-development-lf-styles` · **vize-batch** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-styles` · **vize-batch** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-lf-raw` · **verter-compile-many** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-development-crlf-raw` · **verter-compile-many** — template: template: no mapping segment starts at the selected generated token
- `source-map-vdom-development-lf-styles` · **verter-compile-many** — template: template: no mapping segment starts at the selected generated token; css-0: css-0: no mapping segment starts at the selected generated token; css-1: css-1: sourcesContent does not equal the complete original SFC
- `source-map-vdom-development-crlf-styles` · **verter-compile-many** — template: template: no mapping segment starts at the selected generated token; css-0: css-0: no mapping segment starts at the selected generated token; css-1: css-1: sourcesContent does not equal the complete original SFC
- `source-map-vdom-development-crlf-raw` · **fervid-sync** — script: script: mapped to 2:14; expected 2:15
- `source-map-vdom-development-lf-styles` · **fervid-sync** — css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-styles` · **fervid-sync** — script: script: mapped to 2:14; expected 2:15; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-raw` · **fervid-async** — script: script: mapped to 2:14; expected 2:15
- `source-map-vdom-development-lf-styles` · **fervid-async** — css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vdom-development-crlf-styles` · **fervid-async** — script: script: mapped to 2:14; expected 2:15; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-lf-raw` · **vize-single** — template: template: no mapping segment starts at the selected generated token
- `source-map-vapor-production-crlf-raw` · **vize-single** — template: template: no mapping segment starts at the selected generated token
- `source-map-vapor-production-lf-styles` · **vize-single** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-crlf-styles` · **vize-single** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-lf-raw` · **vize-batch** — template: template: no mapping segment starts at the selected generated token
- `source-map-vapor-production-crlf-raw` · **vize-batch** — template: template: no mapping segment starts at the selected generated token
- `source-map-vapor-production-lf-styles` · **vize-batch** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-crlf-styles` · **vize-batch** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-production-lf-styles` · **verter-compile-many** — css-0: css-0: no mapping segment starts at the selected generated token; css-1: css-1: sourcesContent does not equal the complete original SFC
- `source-map-vapor-production-crlf-styles` · **verter-compile-many** — css-0: css-0: no mapping segment starts at the selected generated token; css-1: css-1: sourcesContent does not equal the complete original SFC
- `source-map-vapor-development-lf-raw` · **vize-single** — template: template: no mapping segment starts at the selected generated token
- `source-map-vapor-development-crlf-raw` · **vize-single** — template: template: no mapping segment starts at the selected generated token
- `source-map-vapor-development-lf-styles` · **vize-single** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-development-crlf-styles` · **vize-single** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-development-lf-raw` · **vize-batch** — template: template: no mapping segment starts at the selected generated token
- `source-map-vapor-development-crlf-raw` · **vize-batch** — template: template: no mapping segment starts at the selected generated token
- `source-map-vapor-development-lf-styles` · **vize-batch** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-development-crlf-styles` · **vize-batch** — template: template: no mapping segment starts at the selected generated token; css-0: missing or invalid version-3 source map; css-1: missing or invalid version-3 source map
- `source-map-vapor-development-lf-styles` · **verter-compile-many** — css-0: css-0: no mapping segment starts at the selected generated token; css-1: css-1: sourcesContent does not equal the complete original SFC
- `source-map-vapor-development-crlf-styles` · **verter-compile-many** — css-0: css-0: no mapping segment starts at the selected generated token; css-1: css-1: sourcesContent does not equal the complete original SFC

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

### compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| fervid compileSync (1T) vdom-prod | 15.79 / 15.79 / 15.79 | 0.84 / 0.84 / 0.84 | 42 | 108.2 | 39 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod | 19.10 / 19.10 / 19.10 | 0.97 / 0.97 / 0.97 | 47 | 107.1 | 44 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vapor-prod | 20.31 / 20.31 / 20.31 | 1.02 / 1.02 / 1.02 | 50 | 107.2 | 46 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod | 21.48 / 21.48 / 21.48 | 0.83 / 0.83 / 0.83 | 58 | 276.9 | 21 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod | 21.58 / 21.58 / 21.58 | 0.86 / 0.86 / 0.86 | 64 | 309.2 | 20 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod | 23.52 / 23.52 / 23.52 | 0.86 / 0.86 / 0.86 | 63 | 298.5 | 20 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod | 23.72 / 23.72 / 23.72 | 0.93 / 0.93 / 0.93 | 66 | 312.8 | 21 | 3 |
| Verter compileMany (stateless raw render) vdom-prod | 45.21 / 45.21 / 45.21 | 0.82 / 0.82 / 0.82 | 157 | 193.9 | 84 | 3 |
| Verter compileMany (stateless raw render) vapor-prod | 45.95 / 45.95 / 45.95 | 0.88 / 0.88 / 0.88 | 165 | 184.7 | 89 | 3 |
| Verter compileMany + style transform (render + CSS) vdom-prod | 47.37 / 47.37 / 47.37 | 1.03 / 1.03 / 1.03 | 172 | 209.9 | 82 | 3 |
| Verter compileMany + style transform (render + CSS) vapor-prod | 48.25 / 48.25 / 48.25 | 1.09 / 1.09 / 1.09 | 175 | 203.5 | 86 | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 60.64 / 62.54 / 61.57 | 20.17 / 20.17 / 20.17 | 1037 | 196.0 | 535 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 61.16 / 62.87 / 62.01 | 19.76 / 19.76 / 19.76 | 1041 | 196.5 | 530 | 3 |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 63.58 / 65.38 / 64.17 | 31.81 / 31.81 / 31.81 | 1126 | 196.4 | 576 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod | 70.81 / 70.81 / 70.81 | 40.20 / 40.20 / 40.20 | 1440 | 194.0 | 744 | 3 |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod | 77.89 / 77.89 / 77.89 | 42.71 / 42.71 / 42.71 | 1533 | 193.8 | 791 | 3 |

<details><summary>Notes</summary>

- **fervid compileSync (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfc loop (render + CSS, 1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany (stateless raw render) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany (stateless raw render) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany + style transform (render + CSS) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Verter compileMany + style transform (render + CSS) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.6 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.5 (1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@vue/compiler-sfc 3.6 vapor (1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### jsx-compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | 11.01 / 11.01 / 11.01 | 0.35 / 0.35 / 0.35 | n/a | n/a | 7 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) | 11.41 / 11.41 / 11.41 | 0.35 / 0.35 / 0.35 | n/a | n/a | 7 | 3 |
| @vue/babel-plugin-jsx | 75.79 / 75.92 / 75.86 | 32.89 / 32.89 / 32.89 | 849 | 171.5 | 487 | 3 |

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
| vue | 3.5.43 |
| vue-36 | 3.6.0-rc.9 |
| @vue/compiler-sfc | 3.5.43 |
| @vue/compiler-sfc-36 | 3.6.0-rc.9 |
| vize | 0.429.1 |
| @vizejs/native | 0.429.1 |
| @verter/native | 0.0.1-beta.6 |
| @fervid/napi | 0.4.1 |
| verter-tsc | 0.0.1-beta.6 |
| @verter/component-meta | 0.0.1-beta.6 |
| verter-lsp | 0.0.1-beta.6 |
| verter-mcp | 0.0.1-beta.6 |
| @vue/language-server | 3.3.11 |
| @vue/typescript-plugin | 3.3.11 |
| typescript-language-server | 6.0.1 |
| vue-tsc | 3.3.11 |
| vue-component-meta | 3.3.11 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.9 |
| oxfmt | 0.71.0 |
| oxlint | 1.86.0 |
| eslint-plugin-vue | 10.11.1 |
| @biomejs/biome | 2.5.14 |
| typescript | 6.0.3 |
| cli:vize | 0.429.1 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.6 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.9 |
| cli:oxfmt | 0.71.0 |
| cli:oxlint | 1.86.0 |
| cli:biome | 2.5.14 |
| vue-jsx-vapor | 3.2.25 |
| @vue-jsx-vapor/compiler-rs | 3.2.25 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.6 |

</details>
