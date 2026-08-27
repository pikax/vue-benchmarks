# Real-world: naive-ui

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../../results/benchmarks/) and [`results/real_world/`](../../results/real_world/) by `pnpm docs`. Do not edit by hand.

**naive-ui:demos** — [`tusen-ai/naive-ui`](https://github.com/tusen-ai/naive-ui) v2.44.0 @ `a3e05c11db` · 1682 files · **no lockfile** (unranked corpus)

- **Generated:** 2026-08-27T11:42:52.004Z
- **Fixture:** `fixtures/real` (1682 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`abafafd`](https://github.com/pikax/vue-benchmarks/commit/abafafd07c14f26c07f1d0ed9da818102fdc97e1)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/33062222081

Ranked on the **median of measured runs**. Warm series follow ≥1 discarded warmup and are the primary ordering and ranking metric wherever both series exist. Compiler and Component-meta additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup and package imports. It is not called Cold and its ratio/noise gate never substitutes for Warm. What else the child excludes differs by surface and each surface states it in its own methodology — Compiler builds its compiler host outside the timer, Component-meta builds its checker/session inside it, because its warm timer does too. Every table sorts fastest-first and every ratio column is **vs fastest** — the fastest ranked row is the 1.00x denominator; no tool is pinned as a reference. One table per surface unless that surface declares explicit work-equivalence classes; engine, invocation and threading are row properties, not implicit table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three warm samples is bracketed as TOO NOISY TO RANK, no tool exempted (a two-run spread has no third sample to adjudicate, so it is flagged, not bracketed). Per-row detail is under **Notes** below each table.

> Corpora are pinned checkouts of third-party open-source Vue projects; sources are unmodified and every page names its ref and resolved commit SHA.
> **Rank within a corpus, never across it.** The corpora differ in size and in kind — library source, application source and documentation demos are not the same code.
> **⚠ unranked** is a gate, not a verdict on the official toolchain. A project shipping **no lockfile** at the pinned ref cannot be installed frozen, so every row on that corpus is unranked equally — including vue-tsc.

### Compiler

Files: **1,682** · Bytes: **1,751,750**

**Vue-anchored apples-to-apples compiler results.** Each target/environment/source-map cell contains two candidate-comparison subsections: Raw SFC compilation gives Vue, Vize batch and Verter first-admission the same revised style-free SFC strings; SFC compilation with CSS gives the style-capable entrypoints the same revised style-bearing SFCs and counts both generated JS and CSS. Every measured row publishes Fresh child and Warm separately when both samplers succeed. Ratios never cross these subsections and always use the official Vue workload as 1.00x. A failed semantic gate leaves both measured times visible but unranked.

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

##### Official render pipeline — parse + script + template

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.5 (1T) | 1.39 s | 1.38 s | 6.9 ms | 0.5% | 1.00x | **751.4 ms** | 718.1 ms | 33.5 ms | 4.5% | 1.00x | 4,662,260 | 2.2k files/s |
| @vue/compiler-sfc 3.6 (1T) | 1.43 s | 1.42 s | 11.1 ms | 0.8% | 1.03x | **869.7 ms** | 810.9 ms | 95.9 ms | 11.0% ⚠ | 1.16x | 4,662,260 | 1.9k files/s |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **@vue/compiler-sfc 3.6 (1T)**: Official 3.6 VDOM, isProd=true, sourceMap=false ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.

</details>

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (raw render, 1T) | 1.38 s | 1.37 s | 9.6 ms | 0.7% | 1.00x | **730.7 ms** | 718.9 ms | 36.8 ms | 5.0% | 1.00x | 4,660,578 | 2.3k files/s |
| Vize compileSfcBatchWithResults (raw render) ⚠ | (162.3 ms) | (159.0 ms) | (2.2 ms) | (1.4%) | not ranked | (136.6 ms) | (133.2 ms) | (5.9 ms) | (4.3%) | not ranked | (4,091,517) | – |
| Verter compileMany (first-admission stateless raw render) ⚠ | (4.37 s) | (4.27 s) | (65.0 ms) | (1.5%) | not ranked | (4.21 s) | (4.18 s) | (38.3 ms) | (0.9%) | not ranked | (3,479,010) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, sourceMap=false, isProd=true. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfcBatchWithResults (raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Verter compileMany (first-admission stateless raw render) ⚠**: CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, hmr=none, requestedMode=stateless, analysis=full. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

##### SFC compilation with CSS — script, template and style changed

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Generated JS + CSS bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) | 1.41 s | 1.41 s | 6.0 ms | 0.4% | 1.00x | **771.5 ms** | 730.8 ms | 201.8 ms | 26.2% ⚠ | 1.00x | 4,692,774 | 2.2k files/s |
| Vize compileSfc loop (full SFC, 1T) ⚠ | (433.0 ms) | (432.8 ms) | (2.0 ms) | (0.5%) | not ranked | (412.4 ms) | (407.1 ms) | (2.9 ms) | (0.7%) | not ranked | (4,120,411) | – |
| Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠ | (164.2 ms) | (163.0 ms) | (2.1 ms) | (1.3%) | not ranked | (144.1 ms) | (136.1 ms) | (15.2 ms) | (10.5%) | not ranked | (4,120,411) | – |
| fervid compileSync (1T) ❌ | error | – | – | – | – | – | – | – | – | – | – | – |
| fervid compileAsync (4-thread libuv pool) ❌ | error | – | – | – | – | – | – | – | – | – | – | – |
| Verter compileMany + processStyle (render + CSS) ⚠ | (4.37 s) | (4.32 s) | (79.3 ms) | (1.8%) | not ranked | (4.19 s) | (3.98 s) | (147.8 ms) | (3.5%) | not ranked | (3,526,584) | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, sourceMap=false, isProd=true. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed. ✓ STYLE CORRECTNESS GATE: all 16 independent CSS semantics plants passed. ✓ RUNTIME SEMANTIC VALIDITY: 31/31 independent observable-behaviour plants passed through parse → compileScript(inlineTemplate=false) → compileTemplate.
- **Vize compileSfc loop (full SFC, 1T) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, sourceMap=false. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch) ⚠**: CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=false, isTs=true, templateHoistStatic=true, templateCacheHandlers=true, includeSourceMap=false; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking. ⚠ FAILED STYLE CORRECTNESS GATE — [slotted] slotted: slotted target must receive the [data-v-…-s] attribute selector; [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-quoted] v-bind-quoted: margin-left was not rewritten to a CSS variable. All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (26/31 passed) — runtime-props-defaults-reactivity [runtime]: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events [runtime]: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; +2 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.
- **fervid compileSync (1T) ❌**: fervid compile returned an unexpected diagnostic: SfcParse(ParseError { kind: DirectiveSyntaxArgument, span: 700..725 })
- **fervid compileAsync (4-thread libuv pool) ❌**: fervid compile returned an unexpected diagnostic: SfcParse(ParseError { kind: DirectiveSyntaxArgument, span: 700..725 })
- **Verter compileMany + processStyle (render + CSS) ⚠**: CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=false, isProduction=true, forceJs=false, sourceMap=false, requestedMode=stateless, analysis=full. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero. ⚠ FAILED STYLE CORRECTNESS GATE — [deep] deep: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant; [v-bind] v-bind: JS registers "--927b501a-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--927b501a-color); [global-mixed-local] global-mixed-local: local selector fragments or a scope constraint leaked into Vue's global selector; [slotted-compound] slotted-compound: the slotted scope attribute was not attached to the final compound target; [is-selector-list] is-selector-list: the complete :is() selector list was not preserved; [where-selector-list] where-selector-list: the complete :where() selector list was not preserved; [scoped-keyframes] scoped-keyframes: scoped keyframe name was not rewritten; [v-bind-multiple] v-bind-multiple: JS registers "--7d8c9d6c-color" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--7d8c9d6c-color); [v-bind-quoted] v-bind-quoted: JS registers "--ac901a1e-theme_gap" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--ac901a1e-theme_gap). All 16 independent CSS semantics plants are mandatory; measured but UNRANKED. ⚠ RUNTIME SEMANTIC VALIDITY FAIL (23/31 passed) — svg-namespace-reactivity [runtime]: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal [runtime]: initial dynamic event: expected "1", got "0"; template-refs-v-for-update [runtime]: itemElements.value.map is not a function; +5 more (all retained in JSON). Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.

</details>

<details><summary>Raw runs</summary>

- **@vue/compiler-sfc 3.5 (1T)**: Fresh child (first timed row workload): 1.39 s, 1.39 s, 1.38 s, 1.38 s, 1.39 s · Warm: 807.3 ms, 751.4 ms, 743.4 ms, 718.1 ms, 772.0 ms
- **@vue/compiler-sfc 3.6 (1T)**: Fresh child (first timed row workload): 1.45 s, 1.43 s, 1.42 s, 1.43 s, 1.42 s · Warm: 899.0 ms, 1.05 s, 821.8 ms, 810.9 ms, 869.7 ms
- **Vue compiler-sfc 3.5 reference (raw render, 1T)**: Fresh child (first timed row workload): 1.37 s, 1.38 s, 1.37 s, 1.38 s, 1.40 s · Warm: 718.9 ms, 805.0 ms, 763.7 ms, 730.7 ms, 720.1 ms
- **Vize compileSfcBatchWithResults (raw render)**: Fresh child (first timed row workload): 162.3 ms, 163.6 ms, 161.6 ms, 159.0 ms, 165.0 ms · Warm: 141.4 ms, 148.4 ms, 133.2 ms, 136.4 ms, 136.6 ms
- **Verter compileMany (first-admission stateless raw render)**: Fresh child (first timed row workload): 4.37 s, 4.45 s, 4.35 s, 4.38 s, 4.27 s · Warm: 4.21 s, 4.21 s, 4.20 s, 4.28 s, 4.18 s
- **Vue compiler-sfc 3.5 reference (render + CSS, 1T)**: Fresh child (first timed row workload): 1.42 s, 1.41 s, 1.41 s, 1.41 s, 1.41 s · Warm: 730.8 ms, 1.21 s, 816.1 ms, 771.5 ms, 748.2 ms
- **Vize compileSfc loop (full SFC, 1T)**: Fresh child (first timed row workload): 437.1 ms, 432.8 ms, 435.5 ms, 433.0 ms, 432.8 ms · Warm: 408.7 ms, 413.6 ms, 412.4 ms, 407.1 ms, 413.3 ms
- **Vize compileSfcBatchWithResults (render + CSS, Rayon batch)**: Fresh child (first timed row workload): 163.8 ms, 166.6 ms, 163.0 ms, 164.2 ms, 168.0 ms · Warm: 145.4 ms, 174.7 ms, 136.1 ms, 141.6 ms, 144.1 ms
- **Verter compileMany + processStyle (render + CSS)**: Fresh child (first timed row workload): 4.32 s, 4.32 s, 4.51 s, 4.41 s, 4.37 s · Warm: 4.37 s, 4.30 s, 4.19 s, 4.17 s, 3.98 s

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=non-unique: 1680/1682 unique content SHAs. The exact compileSfcBatchWithResults path measured here does not have Vize's stats-only batch API's duplicate-body grouping, so duplicate bodies are disclosed for corpus representativeness rather than described as output-cache hits.
- Ratio columns are vs fastest — the fastest ranked row in each comparison class is the 1.00x denominator; no tool is pinned as a reference. The official Vue workload competes on the same terms and its row is labelled: Vue 3.5 provides the VDOM workload; Vue 3.6 the Vapor one because 3.5 has no Vapor backend.
- Rows are split into explicit work-equivalence classes and ratios never cross those boundaries: official Vue-version context; Raw SFC compilation; and SFC compilation with CSS. The old unmatched Verter retained-host re-render row is not in the ranked surface; it remains available through diagnose:compile-warmth.
- The RAW RENDER class compares Vue, Vize and Verter on byte-identical, intentionally style-free SFC strings. &lt;style> blocks are removed from ALL three outside the timer by the class definition. This class measures SFC parse + script/template parse and analysis + render codegen, not CSS.
- Every raw-class cell/pass injects a distinct fixed-width semantically neutral comment into every present script and template block. This prevents Vue cross-cell source-cache contamination and previous whole-output reuse; all candidates in a cell receive the exact same revised strings. Revision and input-object construction happen outside the timer.
- Official Vue-version context rows use a separate fixed-width source namespace from the candidate raw class. This prevents the context row and Vue candidate baseline from lending each other same-compiler parse/template cache entries while preserving byte-identical Vue/Vize/Verter inputs inside the candidate class.
- The ranked raw Verter row creates a fresh workspace-backed host/project outside every timed pass, then measures first source admission through compileMany. requestedMode=stateless is explicit and cacheHit is asserted zero. Process/native-library state may remain warm, but no populated-host parsed, semantic, dependency-graph or output state crosses timed passes.
- The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one processStyle call per block. Generated JS and CSS bytes are both counted.
- TIMED STYLE CORPUS CENSUS: 120/1682 files contain 120 style block(s): scoped=0, CSS Modules=0, v-bind=0, preprocessors=0, external src=0. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.
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

### Format

Files: **1,682** · Bytes: **1,751,750**

Tools:

- **Prettier** — prettier --write over a fresh corpus copy; built-in Vue SFC support, single-threaded by design.
- **Oxfmt** — oxfmt --write — Oxc's Vue-capable formatter, multi-threaded.
- **Vize** — vize fmt --write.
- **Biome format** — biome format --write — multi-threaded; the exact pinned row rewrites none of the planted .vue corpus and is unranked on the full-SFC format surface.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **522.4 ms** | 515.7 ms | 42.4 ms | 8.1% | 1.00x | n/a | 3.2k files/s |
| Oxfmt | **6.44 s** | 6.43 s | 15.6 ms | 0.2% | 12.33x | n/a | 261 files/s |
| Prettier | **11.47 s** | 11.42 s | 56.5 ms | 0.5% | 21.96x | n/a | 147 files/s |
| Biome format ⚠ | (328.6 ms) | (327.7 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded | ⓘ file coverage verified: rewrote 1682/1682 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Oxfmt**: oxfmt --write (fresh copy each run) · pinned 0.65.0 routes a full .vue file through its bundled Prettier formatFile callback in worker threads; the native binding orchestrates the call, but Vue parsing/printing is the bundled Prettier path. Re-audit this package path after upgrades. | ⓘ file coverage verified: rewrote 1682/1682 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Prettier**: prettier --write **/*.vue (fresh copy each run) · single-threaded by design | ⓘ file coverage verified: rewrote 1682/1682 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Biome format ⚠**: biome format --write . (fresh copy each run) · multi-threaded (Rayon; honours RAYON_NUM_THREADS) · exact pinned row currently rewrites none of the planted .vue corpus | ⚠ FAILED FILE-COVERAGE GATE — rewrote 0 of 1682 planted corpus files. A tool covering fewer files finishes sooner; that is a different job, not a faster one. Measured but UNRANKED. | ⚠ FORMAT SEMANTIC VALIDITY FAIL — template-behaviour: messy template block was not rewritten; descriptor-attributes: messy template block was not rewritten. Full per-plant evidence is retained in validation.formatSemantics.

</details>

<details><summary>Methodology</summary>

- Each invocation receives a fresh copy of the same Vue SFC corpus (formatters rewrite files).
- Prettier is the explicit established-reference denominator for the full-Vue-SFC CLI comparison class. A faster candidate never silently becomes the baseline.
- .prettierrc.json and biome.json are written only into disposable work copies; the input fixture or checked-out real-world project is never overwritten. Both configs set the same indent, width, quote, semicolon and trailing-comma choices.
- All four formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.
- Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.
- Oxfmt 0.65.0 is a hybrid native/JS package. Its shipped native binding delegates a full .vue file to the bundled JS formatFile callback, whose implementation calls bundled Prettier with parser=vue; worker orchestration remains oxfmt's. Its output is byte-identical to Prettier on the work-gate probe. This is pinned-version evidence and must be re-audited after an oxfmt upgrade rather than assumed forever.
- Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxfmt 0.63+) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in, see zero files, and get unranked for walking reasons rather than formatting ones. A real project root has the boundary; the marker changes no tool's invocation.
- FORMAT SEMANTIC GATE (untimed, post-timing): suite 2026-08-20.1 runs 3 nested plants twice through each row's exact directory/glob command and shared configs. Every plant must remain parseable and idempotent; preserve SFC block attrs/custom blocks and template/script AST meaning; preserve scoped/module/v-bind/deep/slotted/global CSS constructs; and actually rewrite the messy template. Generated output is never compared between tools. Every outcome and the suite hash are retained in validation.formatSemantics.
- FILE-COVERAGE GATE, untimed, per tool with its exact timed invocation: every corpus file is planted with a mess (trailing spaces, stacked blank lines) that any formatter under the shared configs must undo, and files rewritten are counted by byte comparison — the same method for every tool. A ranked tool that rewrites fewer than every corpus file is measured but UNRANKED: tools walking different file sets are not doing the same job, however similar the clock looks. A walk-invoked tool that also rewrites a config file is disclosed, not gated (one extra tiny file is noise; skipping corpus files is not).
- Prettier, Oxfmt, and Vize format the whole SFC. On the pinned Biome, `biome format --write .` reports .vue files as formatted but applies NO fixes to any block of them (probed: 0 of 50 planted files rewritten, 'No fixes applied') — its bracketed time is a walk-and-parse, which both gates say on the row. Rule/option parity is not guaranteed for any tool.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize**: 515.7 ms, 522.4 ms, 539.4 ms, 616.9 ms, 519.7 ms
- **Oxfmt**: 6.44 s, 6.43 s, 6.46 s, 6.44 s, 6.47 s
- **Prettier**: 11.42 s, 11.47 s, 11.50 s, 11.56 s, 11.44 s
- **Biome format**: 330.9 ms, 327.7 ms, 331.1 ms, 328.6 ms, 327.9 ms

</details>

### Lint

Files: **1,682** · Bytes: **1,751,750**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Biome lint (default threads)** — biome lint with its default pool size — script block only. No template rules, so it misses the planted Vue template rules and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — the exact pinned row is script-block-only on the planted Vue template capabilities and remains unranked.
- **Oxlint (default threads)** — oxlint with its default pool size and vue plugin enabled — script block only, so it misses the planted Vue template rules; unranked.

##### Vue SFC lint — fresh CLI process

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (default threads) | **204.6 ms** | 202.3 ms | 1.5 ms | 0.7% | 1.00x | n/a | 8.2k files/s |
| Vize lint (1T) | **304.9 ms** | 302.9 ms | 2.3 ms | 0.8% | 1.49x | n/a | 5.5k files/s |
| eslint-plugin-vue (CLI) | **9.11 s** | 9.04 s | 120.4 ms | 1.3% | 44.55x | n/a | 185 files/s |
| Biome lint (1T) ⚠ | (1.75 s) | (1.74 s) | – | – | not ranked | – | – |
| Biome lint (default threads) ⚠ | (685.9 ms) | (680.2 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (121.6 ms) | (117.5 ms) | – | – | not ranked | – | – |
| Oxlint (default threads) ⚠ | (91.0 ms) | (84.5 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize lint (default threads)**: vize lint . using default Rayon pool; diagnostics are not suppressed | ⓘ file coverage verified: named 1682/1682 planted corpus files. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Vize lint (1T)**: vize lint . with RAYON_NUM_THREADS=1; diagnostics are not suppressed | ⓘ file coverage verified: named 1682/1682 planted corpus files. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **eslint-plugin-vue (CLI)**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs | ⓘ file coverage verified: named 1682/1682 planted corpus files. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Biome lint (1T) ⚠**: biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules | ⓘ file coverage verified: named 1682/1682 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Biome lint (default threads) ⚠**: biome lint . using its undocumented default pool size · script block only | ⓘ file coverage verified: named 1682/1682 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Oxlint (1T) ⚠**: oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules | ⓘ file coverage verified: named 1682/1682 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Oxlint (default threads) ⚠**: oxlint . on its default thread pool, vue plugin enabled · script block only | ⓘ file coverage verified: named 1682/1682 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.

</details>

##### Vue SFC lint — in-process APIs

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-vue (1T) | **7.54 s** | 6.57 s | 633.4 ms | 8.4% | 1.00x | n/a | 223 files/s |
| eslint-plugin-vue (4 workers) | **8.07 s** | 8.02 s | 197.3 ms | 2.4% | 1.07x | n/a | 208 files/s |
| Verter host lint ⚠ | (1.10 s) | (1.09 s) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles | ⓘ file coverage by construction: this invocation is handed the 1682 corpus files as an explicit list, not a directory walk. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **eslint-plugin-vue (4 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker) | ⓘ file coverage by construction: this invocation is handed the 1682 corpus files as an explicit list, not a directory walk. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Verter host lint ⚠**: VerterHost.upsert + lint(canonicalId) for each file (if API available) | ⓘ file coverage by construction: this invocation is handed the 1682 corpus files as an explicit list, not a directory walk. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — duplicate-attributes: dirty twin had no file+line+rule/concept-attributed diagnostic; require-component-is: clean twin retained the planted diagnostic. Rows missing any mandatory planted capability remain contextual/unranked; all results are retained in validation.lintSemantics.

</details>

<details><summary>Methodology</summary>

- Every tool lints an identical isolated copy of the corpus (work/lint/…). That tools see the SAME FILES is enforced, not assumed: an untimed post-timing FILE-COVERAGE census plants a guaranteed-reportable issue in every corpus file and runs each directory-walk tool once — a ranked tool that fails to name every corpus file is measured but UNRANKED. Explicit-list invocations (the eslint API rows, VerterHost) are handed exactly the corpus by construction and say so. Census-only reporter changes (eslint JSON, biome unlimited diagnostics) alter what is printed, never what is linted; Vize and Oxlint use their exact timed commands and thread settings. A walk tool that also lints a config file beside the corpus is disclosed, not gated.
- Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxlint; oxfmt 0.63+ on the format surface) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in and walk zero files. A real project root has the boundary; the marker changes no tool's invocation.
- In-process APIs and fresh CLI processes are separate comparison tables because a CLI pays process startup and config loading on every run while an in-process API amortises them. eslint-plugin-vue runs in both modes and is the explicit reference denominator in each table.
- Ranking is split into explicit in-process-API and fresh-CLI comparison classes. eslint-plugin-vue is the declared denominator in both; ratios never compare Verter's in-process host with native CLI startup or let the fastest candidate redefine the reference.
- No single invocation mode covers every tool — vize lint is CLI-only, VerterHost.lint is in-process-only — which is why the mode is on the row instead of one mode being dropped.
- eslint-plugin-vue uses flat recommended config generated with fixtures.
- Vize, Biome and Oxlint each get separate 1T and default-thread rows — a thread-count gap is not a linter gap. The benchmark does not rename an undocumented default pool size as 'all cores'.
- VUE TEMPLATE-LINT SEMANTIC GATE (untimed, post-timing): suite 2026-08-20.1 runs 10 dirty/clean differential plants through every exact row separately, including main-thread/worker/CLI ESLint, thread-limited/default native CLIs, and fresh VerterHost. A pass must name the planted file, overlap its line, identify the rule or narrow concept, and disappear for the clean twin. Exit status or an unrelated diagnostic never passes. Every result and suite hash is retained in validation.lintSemantics; FAIL/UNKNOWN is measured but UNRANKED.
- Oxlint runs with its vue plugin ON (.oxlintrc.json travels with the corpus and with the gate plant). The exact pinned row still misses every mandatory Vue template diagnostic plant, so it remains contextual/unranked; no hard-coded rule-count claim is carried across package upgrades.
- Oxlint ships no standalone executable — it is a NAPI addon loaded into a Node process — so its per-run startup is Node's, while vize and biome launch a native binary. All three pay startup every run; it is not the same constant.
- Biome's script-only view also produces false positives on this corpus: variables declared in &lt;script setup> and used only in &lt;template> are reported as unused. Oxlint avoids that by disabling no-unused-vars for .vue entirely — it reports neither the false positive nor a genuinely unused declaration. Neither tool's diagnostics are comparable to the Vue-aware linters'.
- Allow non-zero exit (style diagnostics do not abort timing).
- Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize lint (default threads)**: 202.3 ms, 205.4 ms, 202.4 ms, 204.6 ms, 205.0 ms
- **Vize lint (1T)**: 302.9 ms, 304.9 ms, 308.0 ms, 307.9 ms, 304.2 ms
- **eslint-plugin-vue (CLI)**: 9.28 s, 9.11 s, 9.04 s, 9.06 s, 9.29 s
- **Biome lint (1T)**: 1.75 s, 1.75 s, 1.77 s, 1.74 s, 1.75 s
- **Biome lint (default threads)**: 700.2 ms, 680.2 ms, 684.8 ms, 685.9 ms, 691.6 ms
- **Oxlint (1T)**: 140.1 ms, 121.6 ms, 117.5 ms, 127.6 ms, 120.1 ms
- **Oxlint (default threads)**: 96.4 ms, 84.5 ms, 88.6 ms, 92.7 ms, 91.0 ms
- **eslint-plugin-vue (1T)**: 6.57 s, 7.54 s, 6.58 s, 7.69 s, 7.90 s
- **eslint-plugin-vue (4 workers)**: 8.02 s, 8.50 s, 8.06 s, 8.07 s, 8.10 s
- **Verter host lint**: 1.19 s, 1.11 s, 1.10 s, 1.09 s, 1.10 s

</details>

### Bundle (production build) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

Grouped by **bundler**, ranked within each group by Vue integration. Rows from different bundlers are never ranked against each other: read **across a row** (same bundler, different integration) for the Vue layer, and **down a column** (same integration, different bundler) for bundler architecture — the second is context, not a verdict.

#### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **2.69 s** | 2.68 s | 3.1 ms | 0.1% | 1.00x | 3,006,141 | 626 files/s |
| Vite 8 (Rolldown) × unplugin-vue | **3.00 s** | 2.97 s | 38.0 ms | 1.3% | 1.12x | 2,999,866 | 561 files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **4.08 s** | 3.83 s | 342.4 ms | 8.4% | 1.52x | 3,231,557 | 413 files/s |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (4.21 s) | (3.96 s) | – | – | not ranked | (3,310,547) | – |

<details><summary>Notes</summary>

- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: lazy per-module transform · compiled 1682/1682 corpus SFCs · 120 style sub-requests · 3,006,141 output bytes | The official Vite Vue plugin — the reference implementation for this surface. | Vite 8 bundles with Rolldown (depends on rolldown ~1.1). | ✓ BUNDLE STRUCTURAL VALIDITY: exact-cell SFC canary preserved render text, dynamic/event-bearing module structure, scoped CSS and v-bind() CSS-variable linkage.
- **Vite 8 (Rolldown) × unplugin-vue**: lazy per-module transform · compiled 1682/1682 corpus SFCs · 120 style sub-requests · 2,999,866 output bytes | Bundler-agnostic build of the official @vue/compiler-sfc pipeline. | Vite 8 bundles with Rolldown (depends on rolldown ~1.1). | ✓ BUNDLE STRUCTURAL VALIDITY: exact-cell SFC canary preserved render text, dynamic/event-bearing module structure, scoped CSS and v-bind() CSS-variable linkage.
- **Vite 8 (Rolldown) × @vizejs/vite-plugin**: eager native batch pre-compile · compiled 1682/1682 corpus SFCs · 122 style sub-requests · 3,231,557 output bytes | Different strategy: compiles the whole corpus in a native batch when the plugin initialises, then serves each module from that result, handing the bundler `.vue.ts` sidecars rather than `.vue` ids. The pre-pass is inside the timed region, so the total is comparable to the lazy rows; what is not comparable is per-module cost, since this row front-loads what the others spread out. | Vite 8 bundles with Rolldown (depends on rolldown ~1.1). | ✓ BUNDLE STRUCTURAL VALIDITY: exact-cell SFC canary preserved render text, dynamic/event-bearing module structure, scoped CSS and v-bind() CSS-variable linkage.
- **Vite 8 (Rolldown) × @verter/unplugin ⚠**: lazy per-module transform · compiled 1682/1682 corpus SFCs · 122 style sub-requests · 3,310,547 output bytes | Verter's universal bundler plugin (unplugin; vite entry point). | Vite 8 bundles with Rolldown (depends on rolldown ~1.1). | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking.

</details>

<details><summary>Raw runs</summary>

- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: 2.68 s, 2.69 s
- **Vite 8 (Rolldown) × unplugin-vue**: 2.97 s, 3.02 s
- **Vite 8 (Rolldown) × @vizejs/vite-plugin**: 3.83 s, 4.32 s
- **Vite 8 (Rolldown) × @verter/unplugin**: 3.96 s, 4.46 s

</details>

#### Rolldown (no Vite) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rolldown (no Vite) × unplugin-vue ⏭**: ⏭ NOT MEASURED — this corpus carries 120 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. A failure here would be the pairing's, not unplugin-vue's. The Vite 8 group bundles the same corpus with the same Rolldown engine under Vite's CSS handling.
- **Rolldown (no Vite) × @verter/unplugin ⏭**: ⏭ NOT MEASURED — this corpus carries 120 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. A failure here would be the pairing's, not @verter/unplugin's. The Vite 8 group bundles the same corpus with the same Rolldown engine under Vite's CSS handling.

</details>

#### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × vue-loader ⚠ | (5.11 s) | (4.88 s) | – | – | not ranked | (13,727,292) | – |
| Rspack × unplugin-vue ⚠ | (4.25 s) | (4.04 s) | – | – | not ranked | (9,965,394) | – |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ⚠ | (257.68 s) | (256.88 s) | – | – | not ranked | (9,284,079) | – |

<details><summary>Notes</summary>

- **Rspack × vue-loader ⚠**: loader chain · compiled 1682/1682 corpus SFCs · 120 style sub-requests · 13,727,292 output bytes | The official webpack Vue integration — a loader rule plus VueLoaderPlugin. The reference implementation for this family. | Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank.
- **Rspack × unplugin-vue ⚠**: lazy per-module transform · compiled 1682/1682 corpus SFCs · 120 style sub-requests · 9,965,394 output bytes | Official compiler pipeline as an unplugin, so the same code path the Vite rows use. | Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank. | ⚠ COMPARISON REFERENCE UNAVAILABLE/INVALID: Rspack's Vue reference row did not produce a valid ranked result, so candidate timings remain visible but no ratio in this class may rank.
- **Rspack × @vizejs/rspack-plugin ❌**:   × ESModulesLinkingError: export 'default' (imported as 'C8') was not found in './src/alert/demos/enUS/marquee.demo.vue' (possible exports: render)       ╭─[1684:59]  1682 │ import C1681 from "./src/watermark/demos/zhCN/multiline.demo.vue"
- **Rspack × @verter/unplugin ⚠**: lazy per-module transform · compiled 1682/1682 corpus SFCs · 122 style sub-requests · 9,284,079 output bytes | Verter's universal bundler plugin (unplugin; webpack/rspack entry point). | Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank. | ⚠ COMPARISON REFERENCE UNAVAILABLE/INVALID: Rspack's Vue reference row did not produce a valid ranked result, so candidate timings remain visible but no ratio in this class may rank.

</details>

<details><summary>Raw runs</summary>

- **Rspack × vue-loader**: 4.88 s, 5.34 s
- **Rspack × unplugin-vue**: 4.04 s, 4.45 s
- **Rspack × @verter/unplugin**: 258.48 s, 256.88 s

</details>

#### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader ⚠ | (7.44 s) | (6.66 s) | – | – | not ranked | (21,574,013) | – |
| webpack 5 × unplugin-vue ⚠ | (9.08 s) | (8.91 s) | – | – | not ranked | (15,359,135) | – |
| webpack 5 × @verter/unplugin ⚠ | (5.77 s) | (5.61 s) | – | – | not ranked | (11,803,088) | – |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **webpack 5 × vue-loader ⚠**: loader chain · compiled 1682/1682 corpus SFCs · 120 style sub-requests · 21,574,013 output bytes | The official webpack Vue integration — a loader rule plus VueLoaderPlugin. The reference implementation for this family. | The reference webpack implementation. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank.
- **webpack 5 × unplugin-vue ⚠**: lazy per-module transform · compiled 1682/1682 corpus SFCs · 120 style sub-requests · 15,359,135 output bytes | Official compiler pipeline as an unplugin, so the same code path the Vite rows use. | The reference webpack implementation. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank. | ⚠ COMPARISON REFERENCE UNAVAILABLE/INVALID: webpack 5's Vue reference row did not produce a valid ranked result, so candidate timings remain visible but no ratio in this class may rank.
- **webpack 5 × @verter/unplugin ⚠**: lazy per-module transform · compiled 1682/1682 corpus SFCs · 122 style sub-requests · 11,803,088 output bytes | Verter's universal bundler plugin (unplugin; webpack/rspack entry point). | The reference webpack implementation. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank. | ⚠ COMPARISON REFERENCE UNAVAILABLE/INVALID: webpack 5's Vue reference row did not produce a valid ranked result, so candidate timings remain visible but no ratio in this class may rank.
- **webpack 5 × @vizejs/rspack-plugin ⏭**: @vizejs/rspack-plugin publishes no webpack entry point

</details>

<details><summary>Raw runs</summary>

- **webpack 5 × vue-loader**: 8.22 s, 6.66 s
- **webpack 5 × unplugin-vue**: 9.26 s, 8.91 s
- **webpack 5 × @verter/unplugin**: 5.61 s, 5.92 s

</details>

<details><summary>Methodology</summary>

- Corpus: naive-ui:demos @ a3e05c11 — 1682 SFCs, docs-demo, MIT. Sources are third-party and unmodified.
- The staged copy carries the corpus SFCs' RELATIVE import closure (750 extra source files) so @vue/compiler-sfc can resolve imported prop types from disk, exactly as it can in the real checkout. Closure files exist for the COMPILER only: the bundler-facing resolvers externalise them, so the module graph is still exactly the corpus.
- Every cell builds the SAME generated entry over the SAME corpus. Each project's own build config is deliberately NOT used: it measures that project's chunking, asset and prerender choices far more than the Vue toolchain, and it cannot be held constant while the bundler is swapped.
- Module graph = the corpus. Any specifier that does not resolve to a real file outside node_modules is marked EXTERNAL and left in the output — so no cell is credited for resolving less or charged for a dependency another happened to have on disk. Implemented per bundler family (Rollup-shaped `resolveId` vs webpack `externals`) against the same rule.
- ⚠ One DISCLOSED per-integration graph-edge difference in the webpack family: a sibling-SFC import written inside an unplugin VIRTUAL module is deliberately externalised (webpack cannot re-base its resolver for a virtual issuer, so keeping it internal fails the build from the wrong directory), while vue-loader's real-path modules keep the same edge internal. The component named by the edge is still compiled exactly once in every cell — it enters through the generated entry — so the work difference is the edge itself, not the compilation.
- Externalising rather than stubbing is deliberate: an ESM stub cannot satisfy named imports, so a stubbing harness silently drops a different set of modules per bundler.
- SFC CUSTOM BLOCKS (&lt;markdown>, &lt;playground-*>, &lt;i18n>, …) are consumed by an inert harness-side sink in every cell — the generated shell drops each project's own build config and with it whatever plugin consumed those blocks, so without the sink the bundler's JS parser fails on prose and the census rule attributes a harness gap to the integration. Style blocks have their own handling per family; script and template always go to the integration under test.
- Vite 7 (Rollup) is an OPT-IN study, not part of the default matrix — enable with BENCH_BUNDLERS=vite8,vite7,rolldown,rspack,webpack. Vite 8 is the current release; the 7-vs-8 comparison measures Rollup vs Rolldown under Vite and does not change any integration's standing within a group.
- No minification and no tree-shaking/side-effect elimination in any cell. Minifying folds a second, bundler-specific tool into the number; dead-code elimination would reward a bundler for discarding corpus modules.
- BUNDLE STRUCTURAL VALIDITY PLANT (suite 2026-08-20.1, sha256 a9e142313871): after every timing has finished, each exact bundler × integration cell builds a separate one-SFC canary with static/dynamic render content, an event handler, scoped CSS and v-bind()-backed CSS. The gate checks relational markers in the emitted module/CSS — including agreement between the generated CSS-variable declaration and its var() use without prescribing the generated name — and a one-SFC transform census; it never compares whole output. This proves structural integration work, not browser runtime behaviour (project-test remains that oracle). FAIL/UNKNOWN is measured but UNRANKED, and a failed reference invalidates its whole bundler comparison class. Running last means the canary cannot pre-warm measured plugins or native libraries.
- Corpus-compile gate: one untimed build per cell counts how many corpus SFCs were compiled. A cell reaching fewer than the best cell FOR THE SAME BUNDLER — the same key the tables are grouped and ranked by — is measured but UNRANKED. The count is keyed on the source SFC, not the intermediate module id, because integrations rename them (Vize hands the bundler `.vue.ts` sidecars).
- Where a bundler has only ONE surviving cell, the peer anchor is that cell itself, so it is gated against the CORPUS instead: a lone cell that compiled part of the corpus is unranked, because nothing shows whether the rest is unreachable here or was skipped by that integration. A lone cell that did clear the corpus is ranked and labelled as the only row that ran, so its 1.00x is not read as beating a reference implementation that is absent.
- Where every surviving cell reached the same count and that count is below the corpus, the rows are ranked and the shortfall is disclosed: it is common to every cell, so it is treated as unreachable code in this corpus rather than as a fault of any integration.
- A cell whose build FAILED is classified on the transform census the driver recorded before it threw, never on the wording of the error. Corpus SFCs compiled and then a failure is ❌ attributable to the integration; zero corpus SFCs compiled is ⏭ NOT MEASURED, because a gap in this harness's wiring for that pair and a plugin that throws at init are indistinguishable from here — so no number and no verdict is published either way. The previous test looked for `?vue` in the error text, a sub-request shape only vue-loader emits, which meant the other integrations' codegen bugs were excused as harness gaps.
- Vize's plugin pre-compiles the whole corpus in a native batch at plugin-init and serves modules from that cache; the unplugin/loader rows compile lazily per module. The pre-pass is inside the timed region, so the totals are comparable; per-module cost is not. Every row's notes name its strategy — no row is excused on the strength of its strategy.
- No tool is exempt and none is given the benefit of the doubt. @vitejs/plugin-vue (Vite family) and vue-loader (webpack family) are the BASELINES, not the favourites: they are the reference each group is read against, and they are gated, bracketed and failed on exactly the same terms as everything else — the codegen gate has bracketed the official compiler on this corpus before now. Vize and Verter are under heavy development and are expected to fail cases; a failure is reported with its module and its diagnostic, and neither softened nor editorialised.
- Bundler families are not comparable line-for-line. A webpack build and a Rollup build of the same corpus differ in module runtime, chunk graph and output format as well as in Vue plugin, which is why they are separate groups.
- EXPRESSION dynamic imports (template-literal `import()`) whose static prefix does not resolve in the staged app are non-fatal in every family: the Rollup family externalises the unresolved specifier, and the webpack family ignores exactly those corpus-derived prefixes via IgnorePlugin — the one mechanism that reaches ContextModules, which never consult the externals callback (criticality parser flags only demote the warning, not the resolution error). A prefix that DOES resolve is never ignored, so a real missing module still fails. Before this was equalised, one such import in vuetify's docs failed the ENTIRE webpack family — its own baseline included — while the Vite cells passed, publishing an environment gap as six tool verdicts.
- Vite 8 IS the Rolldown migration (it depends on rolldown ~1.1); the standalone rolldown-vite package is deprecated in its favour. Vite 7 (Rollup) vs Vite 8 (Rolldown) is therefore the honest engine axis, and the bare Rolldown group shows what Vite's own pipeline costs on top of the same bundler.
- The corpus is copied into a work directory; the checked-out third-party repository is never written to.
- The DISCARDED WARM PASS is the corpus-compile gate build: every cell is built once, untimed, on the identical code path before any timing, which warms much of what a dedicated warmup would (module and OS caches; JIT tiering continues to settle over subsequent executions). The gate runs in fixed cell order — and so does measured run 0, which makes the gate-to-first-measure distance IDENTICAL for every cell; later runs rotate. Run 0 is each cell's second-ever execution and may carry a small residual that JS-implemented integrations feel more than native ones; at two measured runs the median averages it. Measured-run count is unchanged.
- Ranking metric is the median of measured runs.
- Measured runs capped at 2 for this surface (requested 5; per-surface runtime budget, 2026-07-30). Set BENCH_UNIFORM_RUNS=1 for equal run counts everywhere.

</details>

### HMR / dev server — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

Two independent measurements. Cold start is paid once per session; HMR turnaround is paid on every save. Do not compare a row across the two tables.

#### Dev server cold start

##### ROLLDOWN — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rolldown (no Vite) × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **Rolldown (no Vite) × unplugin-vue ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **Rolldown (no Vite) × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **Rolldown (no Vite) × @verter/unplugin ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

##### RSPACK — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rspack × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rspack × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Rspack × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rspack × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **Rspack × unplugin-vue ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **Rspack × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **Rspack × @verter/unplugin ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

##### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @verter/unplugin | **205.4 ms** | 168.5 ms | 52.2 ms | 25.4% ⚠ | 1.00x | n/a | 8.2k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **228.3 ms** | 224.8 ms | 5.0 ms | 2.2% | 1.11x | n/a | 7.4k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **277.6 ms** | 236.0 ms | 58.7 ms | 21.2% ⚠ | 1.35x | n/a | 6.1k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **403.6 ms** | 387.0 ms | 23.5 ms | 5.8% | 1.97x | n/a | 4.2k files/s |

<details><summary>Notes</summary>

- **Vite 8 (Rolldown) × @verter/unplugin**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 1682-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · lazy per-module transform
- **Vite 8 (Rolldown) × unplugin-vue**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 1682-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · lazy per-module transform
- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 1682-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · lazy per-module transform
- **Vite 8 (Rolldown) × @vizejs/vite-plugin**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 1682-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · eager native batch pre-compile

</details>

##### WEBPACK — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **webpack 5 × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **webpack 5 × unplugin-vue ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **webpack 5 × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **webpack 5 × @verter/unplugin ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

<details><summary>Raw runs</summary>

- **Vite 8 (Rolldown) × @verter/unplugin**: 168.5 ms, 242.3 ms
- **Vite 8 (Rolldown) × unplugin-vue**: 224.8 ms, 231.8 ms
- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: 319.1 ms, 236.0 ms
- **Vite 8 (Rolldown) × @vizejs/vite-plugin**: 387.0 ms, 420.3 ms

</details>

#### HMR update turnaround

##### ROLLDOWN — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rolldown (no Vite) × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **Rolldown (no Vite) × unplugin-vue ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **Rolldown (no Vite) × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **Rolldown (no Vite) × @verter/unplugin ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

##### RSPACK — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rspack × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rspack × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Rspack × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rspack × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **Rspack × unplugin-vue ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **Rspack × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **Rspack × @verter/unplugin ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

##### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **5.7 ms** | 5.3 ms | 1.0 ms | 17.9% ⚠ | 1.00x | 14,862 | 293.8k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **5.7 ms** | 5.5 ms | 0.2 ms | 4.1% | 1.00x | 14,864 | 292.7k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.8 ms) | (0.7 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: edit &lt;template> of src/affix/demos/enUS/basic.demo.vue and src/affix/demos/enUS/position.demo.vue → update · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | measured region: change announced → update message → updated module fetched over HTTP | revision plant verified in /src/affix/demos/enUS/basic.demo.vue
- **Vite 8 (Rolldown) × unplugin-vue**: edit &lt;template> of src/affix/demos/enUS/basic.demo.vue and src/affix/demos/enUS/position.demo.vue → update · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | measured region: change announced → update message → updated module fetched over HTTP | revision plant verified in /src/affix/demos/enUS/basic.demo.vue
- **Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — no HMR message (headless probe limitation, not a tool result) exceeded 30000 ms. This is the harness declining to publish a number, not a statement about @vizejs/vite-plugin. The dev cold-start row for this cell is published regardless: that measurement succeeded, and discarding it would hide a working result behind a probe limitation.
- **Vite 8 (Rolldown) × @verter/unplugin ⚠**: edit &lt;template> of src/affix/demos/enUS/basic.demo.vue and src/affix/demos/enUS/position.demo.vue → full-reload · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | ⚠ FULL RELOAD, not a hot update — the server discarded the module instead of patching it, which is much less work. Measured but UNRANKED. | ⚠ FAILED REVISION PLANT — src/affix/demos/enUS/basic.demo.vue fetched an update that did not contain its exact changed revision (full-reload carries no updated module). Resource/timing figures remain visible, but stale output is not ranked as a fast update.

</details>

##### WEBPACK — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **webpack 5 × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **webpack 5 × unplugin-vue ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **webpack 5 × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **webpack 5 × @verter/unplugin ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

<details><summary>Raw runs</summary>

- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: 7.3 ms, 5.6 ms, 7.4 ms, 5.7 ms, 5.3 ms
- **Vite 8 (Rolldown) × unplugin-vue**: 6.1 ms, 5.8 ms, 5.7 ms, 5.7 ms, 5.5 ms
- **Vite 8 (Rolldown) × @verter/unplugin**: 0.8 ms, 0.8 ms, 0.8 ms, 0.7 ms, 0.8 ms

</details>

<details><summary>Methodology</summary>

- Corpus: naive-ui:demos @ a3e05c11 — 1682 SFCs, third-party and unmodified.
- The staged copy carries the corpus SFCs' relative import closure (750 extra source files) for @vue/compiler-sfc's type resolution; the resolver still externalises them, so the module graph is exactly the corpus.
- HMR probes: a fixed-width hidden element carrying a unique revision token is inserted inside the &lt;template> block of src/affix/demos/enUS/basic.demo.vue and then src/affix/demos/enUS/position.demo.vue — genuine template changes, one round trip per probe per run, ms = the mean. The token must appear in the announced transformed module or that SFC's own template submodule; a missing/stale revision is measured but UNRANKED. A &lt;script setup> edit would make Vue issue a full page reload instead of a hot update — a different and cheaper server path.
- The change is written to disk and then handed to the watcher directly. Waiting for chokidar would fold the OS file-watch debounce (platform-dependent, unrelated to any tool here) into every row.
- HMR turnaround is measured from the change being announced to the updated module being fetched over HTTP — the same two steps a browser performs. The WebSocket-notification half is reported separately in the run metadata, because a plugin can be quick to decide what changed and slow to recompile it.
- Revision validation runs AFTER the ranked clock stops. If the announced module is only a facade, the harness follows only that changed SFC's own template-module edges; architecture-dependent validation requests never lengthen the published update time. Generated output is not compared byte-for-byte — only the exact per-edit token is required.
- A cell whose edit produces a full reload rather than an update is measured but UNRANKED: discarding a module is much less work than patching one.
- Dev cold start is createServer + listen + transformRequest of the generated entry, so it includes the plugin's initialisation. Vize pre-compiles the whole corpus at plugin-init, so its cold-start row carries work the lazy plugins defer to first request — that is the real trade-off, and it is why both tables exist.
- Dependency pre-bundling is disabled (optimizeDeps.noDiscovery). Everything outside the corpus is external, so there is nothing to pre-bundle, and leaving discovery on would time a dependency scan this app does not have.
- Vite-family only. Webpack and Rspack implement HMR with a different protocol and a different unit of work (an incremental chunk, not a re-transformed module); those rows are absent rather than approximated.
- Vite 7 (Rollup) is an OPT-IN study, not part of the default matrix — enable with BENCH_BUNDLERS=vite8,vite7. Its known limitation here (the headless probe receives no HMR message from most plugins on Vite 7) is documented on the probe branch.
- SFC custom blocks are consumed by the same inert harness-side sink the bundle surface uses, so a dev server asked for a &lt;markdown> or &lt;playground-*> block the shell has no consumer for does not fail the probe against the Vue plugin.
- There is no browser executing the app, so no client-side `import.meta.hot.accept` handler is ever registered. Whether the server still announces an update in that state varies by Vite major AND plugin — observed: all four plugins answer on Vite 8; on Vite 7 some answer only with a full reload and some not at all. Rows where nothing arrived are marked ⏭ NOT MEASURED and are a limitation of this headless probe — they are not evidence that a plugin lacks HMR support.
- The two tables are gated INDEPENDENTLY. An HMR probe that produces no update does not remove that cell's dev-cold-start row: the server started and the entry transformed, which is the whole of what cold start measures. Previously one probe limitation deleted both rows, which on Vite 7 removed three plugins' cold-start numbers and left the fourth ranked against nothing.
- Where the baseline (@vitejs/plugin-vue) is not ranked in a bundler's table, every surviving row in that table says so: the vs-fastest column then compares challengers with each other only, and its 1.00x must not be read as beating the reference implementation.
- Dev cold start: each measured run starts a FRESH server — that row's question is what a cold session costs, so no run may inherit another's module graph. The DISCARDED WARM PASS is the gate probe, which already started a server and transformed the entry for every surviving cell on the identical code path. The probe runs in fixed cell order and so does measured run 0, so probe-to-first-measure distance is identical per cell; later runs rotate. Run 0 is each cell's second in-process execution and may carry a small JIT residual JS plugins feel more than native ones; the median over measured runs absorbs it.
- HMR turnaround: ONE WARM server per row, shared across warmup and measured runs. Real HMR only happens against a long-lived server; the per-run restart this replaced re-paid a corpus-scale startup to measure a milliseconds-long round trip (~31 of naive-ui's 89 sweep minutes were that ceremony). Each round trip edits from the pristine source with a unique marker and restores the file, so no run compounds another's edit.
- Run counts differ by table, deliberately: dev cold start ran 2 measured run(s) per cell (each is a corpus-scale server start — what the per-surface run cap protects), while the update table ran 5 measured run(s) per row (each is 2 millisecond-scale round trip(s) against the row's warm server, where a 2-run median left one contaminated round trip as half the number). BENCH_UNIFORM_RUNS=1 forces both tables to the caller's run count.
- The session's FIRST save is discarded: one untimed round trip per probe runs at session open, because a module transform alone does not warm the edit→update→fetch path and the first edit of a session costs a lazy plugin 100-900 ms it never pays again. Publishing that in a 2-run median made half of every lazy plugin's number a one-time cost the eager plugin had paid untimed at init — first-save cost is a cold-start question, and this table answers the every-save question.
- Measured runs capped at 2 for this surface (requested 5; per-surface runtime budget, 2026-07-30). Rows here carry 2 or 5 measured sample(s): a table may run MORE than the cap where its per-run cost is milliseconds — the surface's own methodology says which table and why. Set BENCH_UNIFORM_RUNS=1 for equal run counts everywhere.

</details>

### Project test suite — naive-ui:demos

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../charts/real-world-naive-ui-project-test-dark.svg">
  <img alt="Project test suite — naive-ui:demos" src="../charts/real-world-naive-ui-project-test.svg">
</picture>

Files: **1,682** · Bytes: **1,751,750**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests passed | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| naive-ui — project's own toolchain (baseline) ⚠ | (318.93 s) | (318.93 s) | – | – | not ranked | (1,007) | – | (1634.3 MB) |
| naive-ui — unplugin-vue ⚠ | (319.41 s) | (319.41 s) | – | – | not ranked | (1,007) | – | (1694.0 MB) |
| naive-ui — @vizejs/vite-plugin ⚠ | (322.11 s) | (322.11 s) | – | – | not ranked | (1,007) | – | (1649.2 MB) |
| naive-ui — @verter/unplugin ⚠ | (318.80 s) | (318.80 s) | – | – | not ranked | (1,007) | – | (1633.4 MB) |

<details><summary>Notes</summary>

- **naive-ui — project's own toolchain (baseline) ⚠**: the project's own toolchain, unmodified (baseline) · package . · script "test": vitest run · config vite.config.mts | ⓘ 1 of 189 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it. | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **naive-ui — unplugin-vue ⚠**: a generated config that imports the project's real config and replaces only the Vue plugin · extends vite.config.mts · resolved with ConfigEnv {command:'serve', mode:'test'}, matching how vitest resolves it for the baseline · Same official @vue/compiler-sfc as the baseline, different plugin wrapper — a gap to baseline is wrapper cost, not compiler cost. · ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction | ⓘ 1 of 189 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⚠ 1 test(s) FAILED under this toolchain (the project's own toolchain also fails 1) — a correctness finding about unplugin-vue. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it. | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **naive-ui — @vizejs/vite-plugin ⚠**: a generated config that imports the project's real config and replaces only the Vue plugin · extends vite.config.mts · resolved with ConfigEnv {command:'serve', mode:'test'}, matching how vitest resolves it for the baseline · Vize's native compiler, substituted for the project's Vue plugin. · ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction | ⓘ 1 of 189 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⚠ 1 test(s) FAILED under this toolchain (the project's own toolchain also fails 1) — a correctness finding about @vizejs/vite-plugin. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it. | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **naive-ui — @verter/unplugin ⚠**: a generated config that imports the project's real config and replaces only the Vue plugin · extends vite.config.mts · resolved with ConfigEnv {command:'serve', mode:'test'}, matching how vitest resolves it for the baseline · Verter's universal bundler plugin, substituted for the project's Vue plugin. · ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction | ⓘ 1 of 189 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⚠ 1 test(s) FAILED under this toolchain (the project's own toolchain also fails 1) — a correctness finding about @verter/unplugin. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it. | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

<details><summary>Methodology</summary>

- Target: naive-ui (.) at v2.44.0 / a3e05c11 — the project's own Vitest suite, unmodified test code.
- This surface EXECUTES compiled components rather than only bundling them, so it catches codegen that parses correctly and behaves wrongly — a class of defect no build surface can reach. It is also the only surface that answers whether a challenger would actually work in a real project.
- The first row is the project's suite run completely unmodified. That is the BASELINE — the reference the others are read against — and its pass/fail census is published exactly like every challenger's. If the project's own suite fails on this machine, the row says so.
- Swap mechanism is stated per row. Preferred: a generated config that imports the project's real config and replaces only the Vue plugin. The generated config replaces ONLY the plugin named 'vite:vue', at that plugin's own index in the array, and throws if it cannot find it — adding a second Vue plugin beside the original would have both compiling every SFC and report a number that means nothing, and hoisting the replacement to the front would change which other plugins see an .vue file first.
- KNOWN INEQUALITY, published on every override row: ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction. The direction of the resulting error is not measured, so it is not claimed to cancel out.
- The project's config is resolved with the same ConfigEnv vitest uses ({command:'serve', mode:'test'}). A function-form config branches on it, so resolving it as build/production — as an earlier revision did — gave the challengers a different plugin list and different aliases from the baseline while the table claimed one variable changed.
- Fallback, used only where a target has no importable config: resolution-hook override: the timed process runs with NODE_OPTIONS=--import pointing at a Node resolve hook that redirects every import of @vitejs/plugin-vue (and its subpaths) to the challenger's module, so a config generated at runtime picks the challenger up without being imported or edited. ⚠ NOT EQUAL WORK, in the opposite direction to the override mechanism: the project's own vue({...}) options DO reach the challenger here, and a challenger that does not understand plugin-vue's option shape may fail on the options rather than on the SFCs — an option-shape mismatch and a real incompatibility are hard to tell apart from the outside, and this surface does not tell them apart. The redirect is verified by a marker the hook writes; a row whose redirect never fired is ⏭ NOT MEASURED, never published, because a silent no-op would publish the baseline's number under the challenger's name.
- Alias-verification gate: an alias row is ⏭ NOT MEASURED unless the resolution hook recorded a redirect on EVERY measured run. A hook that matched nothing leaves the project running its own @vitejs/plugin-vue, and the run would be published under a challenger's name with nothing in the output to distinguish it — the worst failure available on this surface, and the only one that cannot be spotted after the fact.
- The census is read from the LAST summary block vitest prints, and the file and test lines are always taken from the SAME block. A run can print more than one (a reporter list naming `default` twice, a merged blob report), and the label lines are matched anchored at the start of a line — the previous parser matched each label anywhere in the output with `\s` able to span newlines, so it could pair a file count from one block with a test count from another and publish a census that describes no single run.
- The file census publishes files FAILED as well as the total, because the total alone is misleading. On Hoppscotch's `hoppscotch-common` vitest prints `Test Files 31 failed | 31 passed (62)`: half its 62 spec files never collect, because `@hoppscotch/data` is built by a postinstall that `pnpm fetch:real-world` skips. That is a property of the corpus on this machine and it hits the baseline too, so it is stated on every row rather than only where a challenger loses tests.
- Test-count gate: a challenger that PASSES fewer tests than the baseline is UNRANKED, as is one that FAILS more tests than the baseline (a pass-count tie does not clear extra failures — a toolchain can change what the suite collects), one that produced no test census at all, or one that exited non-zero having passed nothing. A suite that fails to collect — or collects and then fails — is faster, and rewarding that would invert the measurement. Passes and failures, not collections, are the gated quantities, and passes is the same number the artifact column publishes.
- Failing tests are reported as a correctness finding about the tool. The timing of a row that passed fewer tests than the baseline is bracketed and excluded from ranking by the gate above; the failure count is published next to it so the reader sees both.
- vitest is invoked directly rather than through the project's npm script, because --config must reach vitest itself; the script that was bypassed is named in the baseline row's notes.
- This is the ONE real-world surface that writes into the checkout — running a project's own suite means running inside it. One namespaced config file per challenger is written and removed in a finally; the clone is pinned, so residue from a hard kill clears with `pnpm fetch:real-world --force`.
- Vitest starts a fresh process per run, so no run inherits another's transform cache. Tool order is rotated on every warmup and measured run.
- Measured runs capped at 1 for this surface (requested 5; per-surface runtime budget, 2026-07-30). project-test is a correctness surface — its timing is INDICATIVE, not a ranking a median-of-5 would sharpen.
- ⚠ naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

Raw runs:

- **naive-ui — project's own toolchain (baseline)**: 318.93 s
- **naive-ui — unplugin-vue**: 319.41 s
- **naive-ui — @vizejs/vite-plugin**: 322.11 s
- **naive-ui — @verter/unplugin**: 318.80 s

</details>

### Project build (own config) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

<details><summary>Methodology</summary>

- No build target in naive-ui could build with its OWN toolchain in this environment, so there is no baseline to compare anything against and no rows are published.
- Candidate naive-ui (., 1707 SFCs) was REJECTED before measurement: own build exited 1 with 0 output files — - For the "manualChunks". Invalid type: Expected Function but received Object.. No challenger rows are emitted for a target whose own build fails — that would report a broken target as three tool failures.
- A common cause is code generation: several projects import files produced by a `postinstall` script, and `pnpm fetch:real-world` installs with `--ignore-scripts` because postinstall scripts in this set download browsers and build native modules that no surface here uses. Such a package is not "easy and reliable" to build, which is the bar this surface holds itself to.
- ⚠ naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

Raw runs:

</details>

### Project typecheck (own tsconfig) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

Tools:

- **vue-tsc (JS)** — the official Vue Language Tools CLI — vue-tsc --noEmit -p tsconfig.json, stock JavaScript TypeScript engine.
- **vue-tsc (N)** — the same vue-tsc with typescript aliased to typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **verter-tsc** — verter-tsc --noEmit -p tsconfig.json from the published npm package; runs stable tsgo.
- **Vize** — vize check --tsconfig tsconfig.json (native, Corsa when available).
- **Golar typecheck** — golar typecheck — typescript-go with the @golar/vue plugin, pure typecheck.

Grouped by **TypeScript engine**, ranked within each group. The JS engine and native tsgo are never ranked against each other: that ratio measures TypeScript's own Go rewrite at least as much as the Vue tooling on top of it. Read WITHIN a group for the Vue layer, and across groups only as context on the rewrite.

#### JavaScript TypeScript engine — ranked alone

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../charts/real-world-naive-ui-project-typecheck-javascript-typescript-engi-1wmidkd-dark.svg">
  <img alt="Project typecheck (own tsconfig) — naive-ui:demos — JavaScript TypeScript engine — ranked alone" src="../charts/real-world-naive-ui-project-typecheck-javascript-typescript-engi-1wmidkd.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (JS) ⚠ | (50.98 s) | (50.69 s) | – | – | not ranked | (63) | – | (2514.9 MB) |

<details><summary>Notes</summary>

- **vue-tsc (JS) ⚠**: BASELINE · vue-tsc --noEmit -p tsconfig.json · the official Vue Language Tools CLI on the stock JavaScript TypeScript compiler | post-timing entrypoint plants: script=✓ template-prop=✓ template-event=✓ | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

<details><summary>Raw runs</summary>

- **vue-tsc (JS)**: 51.28 s, 50.69 s

</details>

#### Native tsgo engines — ranked together

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../charts/real-world-naive-ui-project-typecheck-native-tsgo-engines-ranked-07r7wwv-dark.svg">
  <img alt="Project typecheck (own tsconfig) — naive-ui:demos — Native tsgo engines — ranked together" src="../charts/real-world-naive-ui-project-typecheck-native-tsgo-engines-ranked-07r7wwv.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (N) ⚠ | (44.85 s) | (12.29 s) | – | – | not ranked | (63) | – | (2991.9 MB) |
| verter-tsc ⚠ | (11.37 s) | (11.28 s) | – | – | not ranked | (5,546) | – | (1359.3 MB) |
| Vize ⚠ | (20.08 s) | (19.77 s) | – | – | not ranked | (48) | – | (3295.9 MB) |
| Golar typecheck ⏭ | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **vue-tsc (N) ⚠**: Same vue-tsc 3.3.11 with typescript aliased to typescript-native-bridge 6.0.3-bridge.15.tsgo.7.0.2 (TS API 6.0.3 on tsgo 7.0.2, in-process NAPI/FFI) — exactly one variable against the (JS) row: the TypeScript engine. | post-timing entrypoint plants: script=✓ template-prop=✓ template-event=✓ | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **verter-tsc ⚠**: verter-tsc --noEmit -p tsconfig.json | ⓘ reported 5546 diagnostics against the baseline's 63. Diagnostic equivalence is NOT asserted by this surface; a checker may legitimately be stricter. Read the counts, not just the times. | post-timing entrypoint plants: script=✓ template-prop=✓ template-event=✓ | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **Vize ⚠**: vize check --tsconfig tsconfig.json (no path pattern, so the file set comes from the tsconfig's include/exclude/files — the closest analogue of the -p invocation the other rows use) · ⚠ NOT ASSERTED EQUAL: Vize builds its own virtual project from that tsconfig rather than a TypeScript program, so which files end up checked may still differ; the diagnostic census below is what would expose a materially smaller set. | post-timing entrypoint plants: script=✓ template-prop=✓ template-event=✓ | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **Golar typecheck ⏭**: ⏭ NOT MEASURED — golar is not yet wired into the project-typecheck surface (its own-tsconfig invocation and diagnostic census have not been validated against real projects). A harness omission, not a verdict about golar; it ranks on the generated-corpus typecheck surface.

</details>

<details><summary>Raw runs</summary>

- **vue-tsc (N)**: 77.42 s, 12.29 s
- **verter-tsc**: 11.45 s, 11.28 s
- **Vize**: 20.39 s, 19.77 s

</details>

<details><summary>Methodology</summary>

- Target: naive-ui (.) — 1707 SFCs, checked with the project's OWN tsconfig.json and its own installed dependencies.
- Corpus pin: v2.44.0 @ a3e05c11, committed 2026-03-08 (tag-only), pinned 2026-07-29. Pins are updated by hand only.
- The target was pre-flighted: the baseline typechecked it untimed first, and it is measured only because that produced diagnostics across more than one file (or exited clean). A target the baseline merely aborts on publishes no rows at all — a fast abort is indistinguishable from a fast pass on a wall-clock table, and every other row would be gated against it.
- Every checker gets the same directory, the same tsconfig and the same non-zero-exit policy. Real projects have pre-existing type errors at their pinned release; a checker is not penalised for reporting them, and no row is forgiven a diagnostic another row is failed for.
- Rows are grouped and tagged by ENGINE. `vue-tsc` tagged **(JS)** runs the stock JavaScript TypeScript compiler; `vue-tsc (N)` is the SAME vue-tsc with typescript aliased to typescript-native-bridge (tsgo in-process). The pair isolates the engine, so a JS-vs-native gap should be read as TypeScript's own Go rewrite first and the Vue layer second — and because that gap is not a Vue-tooling result, the two engines are ranked in separate tables rather than one.
- Program-construction gate: every measured run of every row — the baseline's included — must either exit 0 or report diagnostics spanning at least two files. A checker that aborts while building the program returns one diagnostic very fast without checking anything, and a row that did that on any measured run is UNRANKED.
- TNB activation gate: the native row is UNRANKED unless the bridge printed its activation banner on EVERY measured run. A bridge that silently fell back to the JavaScript checker would still be labelled native, which is the mislabel the gates exist to prevent.
- Diagnostic-census gate: a checker reporting under half the baseline's diagnostics is UNRANKED — it may be skipping files or not checking templates, and doing less finishes sooner. When the baseline reports ZERO diagnostics and exits clean, the ratio test cannot fire, so the gate instead requires the row to exit 0 as well: reporting nothing while failing is not a clean pass. Reporting materially MORE is annotated, not gated: stricter is legitimate, but the reader needs to know the rows are not answering the same question.
- Diagnostic counts are read with one shared set of line patterns covering every output shape on this surface (tsc plain, tsc pretty, and Vize's heading-plus-indented-`error:line:col [TSxxxx]` layout). A per-tool parser is how one tool's formatting ends up flattering it — and under-counting is not neutral here, because the census gate would unrank the tool the harness failed to read.
- Vize is invoked with no path pattern so its file set comes from the tsconfig's include/exclude/files, which is the closest analogue of the `-p tsconfig.json` the other three rows use. It still builds its own virtual project rather than a TypeScript program, so identical file sets are NOT asserted; the diagnostic census is what would expose a materially smaller one.
- Diagnostic EQUIVALENCE is not asserted. This is a throughput surface with a work census, not a correctness suite; the counts are published so a suspicious row is visible rather than inferred.
- POST-TIMING ENTRYPOINT CAPABILITY PLANTS (suite 2026-08-20.1, sha256 d5523c21e8bd): each exact CLI row must independently report a script assignment error, a native-template prop mismatch, and a template event-handler mismatch. FAIL is measured but UNRANKED, and a failed native vue-tsc reference invalidates the native comparison class. These plants certify the entrypoint/configuration, not equivalence of diagnostics on the third-party project; that remains UNKNOWN and the project census is retained separately. Running last prevents the plant processes from warming executable/source/dependency pages for measured calls.
- Each measured run is a fresh CLI process, so every row pays process startup equally and none inherits another's incremental cache. Tool order is rotated on every warmup and measured run.
- The checkout is never written to by this surface — it only reads.
- Measured runs capped at 2 for this surface (requested 5; per-surface runtime budget, 2026-07-30). Set BENCH_UNIFORM_RUNS=1 for equal run counts everywhere.
- ⚠ naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

### Project component-meta (own tsconfig) — naive-ui:demos

Files: **1,682** · Bytes: **1,751,750**

##### Project component public-API metadata

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta ⚠ | (9.42 s) | (8.78 s) | – | – | not ranked | (1,682) | – |
| @verter/component-meta ⚠ | (9.24 s) | (9.21 s) | – | – | not ranked | (1,682) | – |

<details><summary>Notes</summary>

- **vue-component-meta ⚠**: BASELINE · createChecker(tsconfig.json) + getComponentMeta for each of 1682 corpus SFCs under ., using the project's own tsconfig and installed dependencies ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props.value: missing; options-api-component: events.increment: missing; events.reset: missing. | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **@verter/component-meta ⚠**: openComponentMetaSession({root: ., tsconfig: tsconfig.json}) + getComponentMeta for the same 1682 corpus SFCs | ⚠ FAILED PROP-COVERAGE GATE — reported ZERO props for 6 of the 6 components that DECLARE props in their source and that the baseline also found props on (e.g. src/data-table/demos/enUS/switchable-editable.demo.vue, src/data-table/demos/zhCN/switchable-editable.demo.vue, src/dropdown/demos/enUS/option-props.demo.vue). Returning an empty API is the trivial way to be fast on this surface. Measured but UNRANKED. | ⓘ reported 0 props+events+slots against the baseline's 20184 across the same 1682 components. Member counts are NOT asserted equivalent: the tools differ on whether inherited and implicit surface belongs to a component's public API. The gated quantities are components resolved and per-component prop coverage. ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props-destructure: props.count: expected hasDefault; props.verbose: expected hasDefault. ⚠ COMPARISON REFERENCE INVALID: the official Vue component-meta baseline did not pass mandatory validation. | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

##### PROJECT-COMPONENT-META — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vize component-meta ⏭**: No component-meta API found on @vizejs/native in this install (loaded successfully, but exports no extractComponentMeta()). Declaration emit is a different job and is NOT substituted for metadata extraction.

</details>

<details><summary>Methodology</summary>

- Target: naive-ui (.) — 1682 corpus SFCs, read with the project's OWN tsconfig.json and its own installed dependencies.
- Corpus pin: v2.44.0 @ a3e05c11, committed 2026-03-08 (tag-only), pinned 2026-07-29.
- The component set is the RESOLVED CORPUS restricted to the target package, not a private walk — so `--file-limit` and its truncation disclosure apply here exactly as they do to every other real-world surface. A private walk would quietly measure a different file set from the one the corpus line names.
- Both tools are given the same absolute file list, the same tsconfig and the same directory, and each is driven through its own published entry point. No payload is hand-decoded and no row is measured through an API it does not ship.
- POST-TIMING ENTRYPOINT-CAPABILITY GATE: suite 2026-08-20.2 runs 29 known generated cases through the same createChecker/getComponentMeta and openComponentMetaSession/getComponentMeta lifecycles in isolated children. It never reads or writes the third-party checkout and cannot warm its timed programs. A failure or UNKNOWN exact entrypoint is measured but UNRANKED; a failed Vue reference invalidates the class. This gate proves only that the published API handles the planted language features, not that this project's metadata is semantically equivalent.
- The target was pre-flighted: the baseline built a checker and extracted from a bounded sample untimed first, and the target is measured only because that resolved components AND found declared props on some of them. A target the baseline cannot read publishes no rows at all — every other row would be gated against a reference that did no work.
- Metadata census gate: a row that resolved metadata for fewer components than the baseline is UNRANKED, and so is a row that resolved none at all — including the baseline's own row, which is gated identically. Returning `{}` is the fastest thing a metadata extractor can do.
- Prop-coverage gate: a row reporting ZERO props for any component the baseline found props on is UNRANKED. This is the gate that catches a fast, empty answer hiding behind a healthy-looking component count.
- Member totals (props+events+slots) are published but NEVER gated. The tools disagree about what belongs to a component's public API — vue-component-meta reports inherited and implicit surface, Verter reports the declared API — and gating on that would brand a tool for a schema definition rather than for doing less work. The per-component prop coverage above is the part that is not a schema disagreement.
- PROJECT METADATA EQUIVALENCE remains UNKNOWN and is not asserted: the generated capability plants do not supply an oracle for the third-party components, and nobody has written down their complete correct public APIs. This is a throughput surface with a project coverage census plus a separate entrypoint-capability gate.
- Each measured run constructs a fresh checker/session and Verter's pooled engine is evicted afterwards, so no run inherits another's warm program. Tool order is rotated on every warmup and measured run.
- The checkout is never written to by this surface — it only reads.
- ⚠ naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

Raw runs:

- **vue-component-meta**: 9.88 s, 9.52 s, 8.78 s, 8.92 s, 9.42 s
- **@verter/component-meta**: 9.21 s, 9.24 s, 9.96 s, 9.22 s, 9.37 s

</details>

### Project LSP (project as workspace) — naive-ui:demos

Files: **1** · Bytes: **1,272**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).

Hover is ranked per TypeScript engine; diagnostics is observational and always unranked. The operations differ by orders of magnitude and answer unrelated questions, a ratio across engines measures TypeScript's Go rewrite as much as the Vue layer, and the diagnostics products are unequal (Volar Vue-only LSP publication versus native combined Vue+TypeScript publication) with no known-correct answer in third-party source.

#### didOpen → diagnostics — JavaScript TypeScript engine, observational only

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (11.21 s) | (11.13 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: BASELINE · official Vue language server v3 in hybrid (two-process) mode — the only mode v3 has. The measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver bridge. Both processes' startup and project load of the real project are inside the timings. HOVER asks both halves in parallel and charges the slower; DIAGNOSTICS times the first publication for the document from either half (which may be an empty preliminary — the count it carried and the first NON-EMPTY publication are both published). · operation: didOpen → diagnostics · workspace ., document src/affix/demos/enUS/basic.demo.vue | ⚠ FAILED DIAGNOSTIC-CONTENT GATE — published 0 diagnostics for a document verter-lsp published 2 for. Answering "nothing to report" fast is not the same job as answering. Measured but UNRANKED. (Diagnostic EQUIVALENCE is not asserted; the counts are published so a suspicious row is visible.) | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking. | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 11.25 s, 11.21 s, 11.27 s, 11.14 s, 11.13 s

</details>

#### didOpen → diagnostics — native tsgo engines, observational only

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) ⚠ | (8.43 s) | (8.29 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (1.62 s) | (1.52 s) | – | – | not ranked | (2) | – |
| Vize ⚠ | (20.1 ms) | (20.0 ms) | – | – | not ranked | (2) | – |

<details><summary>Notes</summary>

- **Volar (N) ⚠**: Identical to the Volar row except the TypeScript half runs on typescript-native-bridge (tsgo): same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.15.tsgo.7.0.2 tsdk. Exactly one variable against the baseline — the TypeScript engine — which is why the two are ranked in separate tables. · operation: didOpen → diagnostics · workspace ., document src/affix/demos/enUS/basic.demo.vue | ⚠ FAILED DIAGNOSTIC-CONTENT GATE — published 0 diagnostics for a document verter-lsp published 2 for. Answering "nothing to report" fast is not the same job as answering. Measured but UNRANKED. (Diagnostic EQUIVALENCE is not asserted; the counts are published so a suspicious row is visible.) | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking. | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **Verter ⚠**: verter-lsp stdio, the native server from the published npm package, given the project directory as its workspace root. $/verter/ready is not waited for — its workspace load is inside the measured window like every other server's. · operation: didOpen → diagnostics · workspace ., document src/affix/demos/enUS/basic.demo.vue | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking. | ⚠ VUE REFERENCE UNAVAILABLE/INVALID — this operation × engine class has no valid official Vue reference, so candidate timing remains visible but cannot rank. | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **Vize ⚠**: vize lsp --stdio, launched from the npm package's NODE entry, because no version-matched native server was found; that costs ~35ms of Node bootstrap per spawn. Same workspace, file and position as every other row. · operation: didOpen → diagnostics · workspace ., document src/affix/demos/enUS/basic.demo.vue | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking. | ⚠ VUE REFERENCE UNAVAILABLE/INVALID — this operation × engine class has no valid official Vue reference, so candidate timing remains visible but cannot rank. | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 8.52 s, 8.52 s, 8.29 s, 8.39 s, 8.43 s
- **Verter**: 1.64 s, 1.61 s, 1.99 s, 1.62 s, 1.52 s
- **Vize**: 20.2 ms, 20.1 ms, 20.0 ms, 20.6 ms, 20.1 ms

</details>

#### hover on `containerRef` — JavaScript TypeScript engine, ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (6.2 ms) | (3.0 ms) | – | – | not ranked | (91) | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: BASELINE · official Vue language server v3 in hybrid (two-process) mode — the only mode v3 has. The measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver bridge. Both processes' startup and project load of the real project are inside the timings. HOVER asks both halves in parallel and charges the slower; DIAGNOSTICS times the first publication for the document from either half (which may be an empty preliminary — the count it carried and the first NON-EMPTY publication are both published). · operation: hover on `containerRef` · workspace ., document src/affix/demos/enUS/basic.demo.vue | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 3.2 ms, 6.2 ms, 258.4 ms, 3.0 ms, 252.4 ms

</details>

#### hover on `containerRef` — native tsgo engines, ranked together

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) ⚠ | (32.0 ms) | (30.3 ms) | – | – | not ranked | (91) | – |
| Verter ⚠ | (1.4 ms) | (1.3 ms) | – | – | not ranked | (91) | – |
| Vize ⚠ | (2.0 ms) | (1.9 ms) | – | – | not ranked | (91) | – |

<details><summary>Notes</summary>

- **Volar (N) ⚠**: Identical to the Volar row except the TypeScript half runs on typescript-native-bridge (tsgo): same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.15.tsgo.7.0.2 tsdk. Exactly one variable against the baseline — the TypeScript engine — which is why the two are ranked in separate tables. · operation: hover on `containerRef` · workspace ., document src/affix/demos/enUS/basic.demo.vue | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **Verter ⚠**: verter-lsp stdio, the native server from the published npm package, given the project directory as its workspace root. $/verter/ready is not waited for — its workspace load is inside the measured window like every other server's. · operation: hover on `containerRef` · workspace ., document src/affix/demos/enUS/basic.demo.vue | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **Vize ⚠**: vize lsp --stdio, launched from the npm package's NODE entry, because no version-matched native server was found; that costs ~35ms of Node bootstrap per spawn. Same workspace, file and position as every other row. · operation: hover on `containerRef` · workspace ., document src/affix/demos/enUS/basic.demo.vue | ⚠ UNRANKED — NO LOCKFILE: naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 32.0 ms, 33.8 ms, 31.5 ms, 44.4 ms, 30.3 ms
- **Verter**: 1.3 ms, 1.3 ms, 2.2 ms, 1.6 ms, 1.4 ms
- **Vize**: 1.9 ms, 2.1 ms, 1.9 ms, 2.0 ms, 2.0 ms

</details>

<details><summary>Methodology</summary>

- Workspace root: naive-ui (.) — the project's own directory, its own tsconfig.json and its own installed dependencies, with 1707 SFCs beneath it. Nothing is copied out and nothing is written in.
- Operation budget: 210 s, scaled by corpus size (+30 s per 500 SFCs past the first 500, capped at 300 s) and IDENTICAL for every server — a flat budget sized on small corpora turned "slow but real project load" into "the server never answered" on large ones, a harness budget in tool-verdict clothing.
- Every row runs a dedicated, discarded warmup session before its measured sessions. (The baseline preflight was considered as a substitute warm pass and rejected: it warms the shared workspace files for every server, but only the baseline's own binaries and tsdk — a per-server asymmetry a warm pass must not have.)
- Diagnostics rows time the FIRST publication for the opened document, which can be an empty preliminary; the count it carried and the first NON-EMPTY publication (time and count) are all published, and the diagnostic-content gate anchors on the maximum ANY ranked row reported across all samples so one racy empty message cannot disarm it.
- Document: src/affix/demos/enUS/basic.demo.vue. Hover position: line 9, character 6 — the identifier `containerRef`, chosen by an untimed BASELINE pre-flight because it is a position the reference server actually answers at.
- Corpus pin: v2.44.0 @ a3e05c11, committed 2026-03-08 (tag-only), pinned 2026-07-29.
- Two operations, each measured in its OWN fresh server session: `didOpen → diagnostics` (cold — the server must load the real project before it can say anything) and `hover` (warm, median of 3, document already open). Sharing one session between them would credit the hover row with a project load the diagnostics row already paid for.
- Volar is measured as the two-process product it is in v3: @vue/language-server has no in-process TypeScript language service, so typescript-language-server with @vue/typescript-plugin is started too, the same .vue buffer is synced to both, and each feature is asked of both in parallel with the SLOWER half charged. Both processes' startup and project load are inside the timings.
- Rows are grouped by TypeScript ENGINE as well as by operation. `Volar (JS)` runs the stock JavaScript TypeScript compiler; `Volar (TNB / tsgo tsdk)` is the SAME Volar with its tsserver half on typescript-native-bridge. The pair isolates the engine, and because a JS-vs-native gap is not a Vue-tooling result the two are ranked in separate tables rather than one.
- HOVER CONTENT GATE: a row is UNRANKED unless it returned a non-empty hover on EVERY measured run, at the single position the baseline answered at untimed. An empty or absent answer is not a fast answer.
- DIAGNOSTIC CONTENT GATE: a run that never published diagnostics for the opened document is an ❌ error, not a fast row — there is no latency to report. The anchor is the maximum ANY ranked row published (not the baseline alone: Volar v3 routes most TypeScript diagnostics over its tsserver half, and where that half is silent a baseline-only anchor never fires, ranking 0-diagnostic rows first against peers publishing dozens). Where any server published at least one diagnostic, a row publishing none on every run is UNRANKED — baseline included; the note names the anchoring server. Where every server published an empty list, the gate cannot fire and each row says so rather than rendering as though it had passed.
- ⚠ DIAGNOSTICS IS OBSERVATIONAL/UNRANKED. `textDocument/publishDiagnostics` from the Volar rows carries what the VUE server computes; Volar v3 delegates TypeScript to a separate tsserver that speaks the tsserver protocol rather than LSP, so TypeScript diagnostics reach a real editor through the extension and are NOT in this notification. A single-process server publishes Vue and TypeScript diagnostics together. Those are unequal products, and this third-party document has no planted known-correct diagnostic set. Times and counts are retained to expose behaviour, but no ratio is published. Hover does not have this product asymmetry: both Volar halves are asked and the slower is charged.
- ⚠ CORRECTNESS OF THE CONTENT IS NOT ASSERTED. These are third-party sources with no planted marker, so nobody has written down what the right hover text or the right diagnostic set is for them. This surface establishes that a server ANSWERED where the reference server answered, and nothing more. Content correctness is gated on the generated corpus (`lsp`), against a symbol whose type is known.
- The retry budget and per-request timeout are identical for every server, and retry sleeps fall inside the measured window — an asymmetric budget would silently subsidise whichever server got the larger one. Readiness is established the same way for every server, by retrying the operation until it answers, so whoever needs project-load time pays for it in the metric.
- A degraded type backend is detected from stderr and reported on any row, ranked or not (Vize logs a failed Corsa spawn, Verter logs verter-only mode). It is reported rather than used to fail a row on its own: the content gates decide ranking, and this is the explanation for the number in either direction.
- Each measured run starts a fresh server process, so per-process project load is paid every time and no run inherits another's cache. Server order is rotated on every warmup and measured run.
- VS Code extension-host overhead is NOT measured — only the language-server stdio protocol.
- ⚠ naive-ui ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>
