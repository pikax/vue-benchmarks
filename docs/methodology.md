# Methodology — what is compared, and how

> Companion to the [README](../README.md), which keeps only the short version and the published tables. Everything here is the detail: corpus design, comparison classes, work gates, caveats, CI layout, and how to run the suite locally.

**Requirements:** Node.js 22+, pnpm 10 (`corepack enable`).

## Project contract

The suite deliberately publishes two complementary kinds of evidence:

- **Performance evidence:** compare equivalent work against the surface's
  declared official or established reference. Vue's official compiler is the
  SFC-compile denominator; a faster candidate never replaces it as the baseline.
- **Compatibility-gap evidence:** run executable feature, coverage, output and
  semantic checks that help tool maintainers find work their implementation
  omits or handles differently. A failed row remains visible with its reason, but
  is excluded from the speed ranking until it performs the required work.

Neither channel is secondary. Hiding an incorrect result loses useful maintainer
feedback; ranking it as a speed result rewards doing less. Gates are based on the
installed behavior and are re-run after upgrades, so findings are reproducible
and self-clearing rather than permanent claims about a project.

| Rule of thumb        | Detail                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sort                 | Tables sort by median measured time; every row also shows what it **produced**                                                                                                                                                                                 |
| Surfaces             | Independent — do not compare compile ms to typecheck/lint/format ms                                                                                                                                                                                            |
| Missing tools        | Reported as `skipped` (missing API/binary); not replaced with another job                                                                                                                                                                                      |
| Warmup               | **Mandatory for Warm** — every warm measured series follows ≥1 discarded pass (`--warmups 0` is clamped to 1). Compiler separately samples the first timed row workload in fresh children                                                                      |
| Compile corpus       | Primary: unique file contents (`fixtures/N`). `fixtures/N-repeated` is a non-ranking repeated-input study                                                                                                                                                      |
| Diagnostics / format | Generated surfaces use feature-specific semantic plants; complete output text and diagnostic sets are not required to match                                                                                                                                    |
| Comparison classes   | One table unless a surface declares materially different work classes. Compiler splits official Vue context, Raw SFC compilation, and SFC compilation with CSS. Every candidate class is anchored to Vue; engine, invocation and threading stay row properties |
| Ranking              | Warm median of measured runs. Compiler also publishes a separately sampled Vue-anchored **Fresh child** comparison; other throughput surfaces remain warm-only                                                                                                 |
| Noise                | Every row carries min / stddev / **CV%**; CV > 10% is flagged ⚠ and should not be read as a result                                                                                                                                                             |
| Work gates           | A tool that misses a planted bug is **measured but unranked** — time shown in (brackets) with the reason                                                                                                                                                       |

### Upgrade audit rule

Benchmark labels and old prose are not capability evidence. Reports are tied to
the package versions printed in their tool table, and superseded results in
git history remain historical even after dependencies move. After any tool
upgrade, re-run the executable checks before carrying a limitation forward:

```bash
pnpm audit:compiler-capabilities  # prod/dev response, maps, runtime CSS, style features
pnpm audit:compiler-validity      # exact-entrypoint runtime semantics; full per-plant results
pnpm confirm                     # runtime semantic cases; known failures are tripwires
pnpm test:harness                # benchmark gates, labels, reporting and wiring
```

Compiler capability results are embedded in the benchmark JSON under
`validation.compileCapabilities`, `validation.styleCorrectness` plus its
versioned `validation.styleCorrectnessManifest`, the separate
`validation.stylePreprocessors` capability audit, and
`validation.compileSemantics`. Map, style, and semantic
limitations therefore self-clear or reclassify rows from observed behavior, not
from a version string. `tests/confirm/known-failures.json` works in the opposite
direction: if an upgrade fixes a listed failure, the confirmation run fails and
forces that obsolete note to be removed instead of silently preserving it.

### What each validity result proves

The suite does not use one vague "correct output" check for every job. Each
surface gets the strongest implementation-neutral oracle the repository can
honestly provide. Whole generated files are never compared byte-for-byte.

| Surface                            | Mandatory evidence used for ranking                                                                                                                                                                                                         | Deliberate limit                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Generated Compiler output          | 31 mounted runtime-behaviour plants through VDOM and supported Vapor entrypoints; style rows also pass 16 independent CSS relationship plants; 8 Sass/SCSS plants separately audit exact preprocessing and a shared-Sass downstream adapter | Source-map coordinate correctness remains **UNKNOWN**                                    |
| JSX compile                        | 8 mounted VDOM behaviour plants through each exact transform entrypoint                                                                                                                                                                     | Vapor execution remains **UNKNOWN**, so those rows stay visible but unranked             |
| Generated typecheck                | Independent script, native-template prop, template-event and full-corpus diagnostic plants                                                                                                                                                  | Complete diagnostic-set equivalence is not asserted                                      |
| Format                             | Three nested exact-command plants for parseability, idempotence and SFC/template/script/style semantic preservation, plus full-corpus rewrite coverage                                                                                      | No per-timed-run artifact census yet                                                     |
| Lint                               | Ten dirty/clean differential rule plants through every exact row, plus file coverage                                                                                                                                                        | Rule-set equivalence is not asserted; no per-timed-run artifact census yet               |
| Generated component-meta           | 11 named public-API plants scored by one schema-neutral oracle                                                                                                                                                                              | Total member counts are informational because the public schemas differ                  |
| Generated LSP / IDE                | Known script and template hover targets plus operation-specific generated probes                                                                                                                                                            | A successful operation does not certify unrelated editor features                        |
| Bundle                             | A post-timing one-SFC structural canary and corpus transform census                                                                                                                                                                         | It proves integration/code emission, not browser runtime behaviour                       |
| HMR                                | A fixed-width hidden revision plant must appear in the announced updated SFC graph                                                                                                                                                          | No browser executes the client-side HMR accept path                                      |
| Project test                       | The pinned project's own unmodified test suite and passed-test census                                                                                                                                                                       | No synthetic plant is injected into an upstream test suite                               |
| Project build                      | Project baseline, output census and integration/redirect checks                                                                                                                                                                             | Application runtime equivalence remains **UNKNOWN** without project tests                |
| Project typecheck / component-meta | Project coverage/census plus isolated exact-entrypoint capability plants                                                                                                                                                                    | Correct answers for every third-party source remain **UNKNOWN**                          |
| Project LSP                        | Reference-selected hover position and answer/diagnostic availability                                                                                                                                                                        | Third-party hover correctness is **UNKNOWN**; diagnostics are observational and unranked |
| Memory                             | The timing surface's workload/validity gate is retained or rerun after sampling                                                                                                                                                             | Resource figures do not create a new semantic correctness claim                          |

Known generated plants run after all timings, normally in isolated children, so
they cannot initialize native libraries, pools, allocators or compiler state for
the measurements they qualify. Third-party projects are not rewritten to make
them resemble the generated corpus: their own tests and sources remain a
separate, complementary kind of evidence. A missing, failed or `UNKNOWN`
reference never promotes the fastest surviving candidate to an implicit
baseline; affected times remain visible but unranked.

## What is compared

### Compilers — SFC

Compile is a **matrix**, not one table — three independent dimensions:

| Dimension      | Values                  | Meaning                                                                                                                                                              |
| -------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Target**     | vdom, vapor             | Classic VDOM render functions vs direct DOM codegen                                                                                                                  |
| **Env**        | production, development | Semantic prod/dev knobs only (`isProd`, HMR strategy)                                                                                                                |
| **Source map** | off (default), on       | Vize uses `sourceMap` (single) / `includeSourceMap` (batch); every native entry is capability-probed and unranked only when the installed build omits requested maps |

Source map is a **separate dimension on purpose**. It used to be folded into `env`, which meant that inside one ranked table "production" told Vue to do _more_ work (`hoistStatic` + `cacheHandlers`, maps still on) and told the native tools to do _less_ (maps off).

It defaults to **off**; `on` is available explicitly. Returned map bytes are checked rather than inferred from the option:

| Compiler                              | `sourceMap: true` on the benchmarked entry point                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@vue/compiler-sfc`                   | raw rows assert JS maps; style rows pass the parsed style map as `inMap` and assert JS + CSS maps |
| Vize `compileSfc`                     | probed separately for generated-JS `map` and a CSS map                                            |
| Vize `compileSfcBatchWithResults`     | probed separately for per-file JS `map` with **`includeSourceMap`** and a CSS map                 |
| Verter `compileMany` + `processStyle` | runtime-render and style maps are probed separately; only the work-equivalent row may rank        |
| fervid `compileSync` / `compileAsync` | generated-JS and compiled-style map capabilities are probed separately                            |

These are executable artifact-presence checks, not package-version allowlists. The report records the observed YES/NO result for the installed build. Raw render emits only JS, while a style-inclusive row emits JS and CSS and must return both maps. Returning a JS map while omitting CSS mapping is not equivalent to Vue's composed baseline. Presence alone does not prove correct mappings, however: the harness does not yet trace planted script/template/CSS tokens back to their source filename, block and coordinates. Therefore every source-map-on timing is currently visible but unranked as **mapping validity UNKNOWN**, including Vue. This avoids favouring a tool merely because it returned non-empty map JSON; a future trace oracle will clear rows automatically from observed behaviour.

Within each matrix cell, ratios are split into explicit work-equivalence classes:

- **Official render pipeline:** Vue 3.5/3.6 context only. Its fixed-width source namespace is distinct from the candidate raw class, so the context row cannot pre-populate the same compiler's candidate-baseline parse/template caches.
- **Raw render:** Vue's official parse + script + template pipeline is the explicit reference. Vue, Vize and Verter receive the exact same style-free SFC strings. Every cell and pass injects a different fixed-width comment into every script/template block, preventing cross-cell source-cache hits and previous whole-output reuse. Verter gets a fresh workspace-backed host/project for every pass (constructed outside timing), explicitly requests stateless mode, and asserts zero `cacheHit` results. Vize's standalone batch source path performs per-call parse/compile/codegen and exposes no generated-output cache; no claim is made about finer-grained undocumented reuse.
- **SFC compilation with CSS:** Vue's official composed `parse + compileScript + compileTemplate + compileStyle` pipeline is the explicit reference. Every script, template and style block changes on every pass. Vize uses `compileSfc` or the exact `compileSfcBatchWithResults` API; Verter uses `compileMany` plus one public `processStyle` call per block. JS and CSS bytes are both counted.

Vue—not the fastest candidate—is the denominator in both candidate classes. A native result faster than Vue prints below `1.00x`; it does not redefine the baseline. The unmatched identical-source Verter warm-host re-render was removed from the ranked surface and remains available through `pnpm diagnose:compile-warmth`.

Styles are removed outside the raw-class timer for all three tools by definition of that class. The separate style class adds CSS work back symmetrically. An untimed capability probe also watches whether Verter `runtime-render` begins returning CSS; if it does, the composed `runtime-render + processStyle` adapter is unranked pending revalidation so an upgrade cannot silently charge CSS twice.

The timed style corpus carries an exact feature census in every report. The direct comparison accepts inline plain CSS only. A separate untimed, mandatory suite currently runs **16 independent CSS semantics plants**: ordinary and compound scoping; `:deep()`, `:slotted()` and mixed `:global()` placement; `:is()`/`:where()` selector lists; selectors nested in `@media`/`@supports`; scoped keyframe declaration/reference agreement; multiple and quoted `v-bind()` expression linkage; and CSS Modules mapping consistency. The assertions accept formatting, hash and helper-name differences and never compare complete generated CSS. Every plant is evaluated independently, so an earlier failure cannot hide later gaps. Vize's batch probe sends all plants through one real multi-input `compileSfcBatchWithResults` call; Verter uses one fresh-host multi-input `compileMany` followed by the same serial `processStyle` composition as its timed row; fervid sync and async entrypoints are checked separately. A tool must pass all plants to rank in the style class; failed timings remain visible for maintainer diagnosis. CSS Modules on the split public APIs is a mapping contract check, not a claim that this standalone benchmark reproduces plugin-layer injection. Installed-behavior findings are live results, not permanent allowlists: a fixed upgrade clears each finding automatically.

Sass is not smuggled into that plain-CSS claim. A separate post-timing diagnostic suite runs eight independent plants—four `lang="scss"` and four indented `lang="sass"`—covering variables, mixins and nesting, scoped selectors, `:deep()` under a variable-driven media query, multiple `v-bind()` expressions and CSS Modules. It records two deliberately non-interchangeable layers. `exactEntrypoints` asks whether the exact compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call: Vue is exercised through `compileStyleAsync({ preprocessLang })`, while an API proven to expose no Sass option and to return/delegate raw Sass is `FAIL/unsupported`, not `UNKNOWN`. `sharedSassAdapter` runs the pinned `sass` package with equivalent expanded-output/quiet-dependency options and feeds the resulting byte-identical plain CSS to each public downstream style path. A PASS in that second layer proves only post-preprocessor Vue scoping, CSS-variable and module transformation; it does not prove full runtime `$style` injection and can never be credited as exact-API preprocessing. Neither diagnostic layer changes ranking in the separately defined inline-plain-CSS timing class. Full version, hash, Sass version, per-plant outcomes and observed unsupported-path evidence are retained in `validation.stylePreprocessors`.

The raw and style rows also receive a mandatory **runtime semantic plant gate** after timing. Suite revision `2026-08-20.2` contains 31 independent valid-SFC cases covering props/defaults/reactive updates, emits and payloads, native and component models, dynamic/object bindings and events, scoped and dynamic slots, SVG namespace/update semantics, template refs and `defineExpose`, event modifiers, keyed lists, conditional branches, dynamic components, custom directives, class/style normalization, form controls, `v-once`, `v-memo`, `v-show`, `v-text`, `v-html`, Teleport, KeepAlive, Suspense, `v-pre`, named `defineModel` modifiers, and template-only/classic/combined script forms. The oracle mounts each result and checks observable DOM, event, public-instance and update behaviour; generated JS is never compared with Vue's generated text.

That gate certifies exact entrypoints and flags: Vue's composed non-inline `parse + compileScript + compileTemplate`, Vize `compileSfc`, one real multi-input `compileSfcBatchWithResults`, one fresh-host stateless multi-input Verter `compileMany` with `forceJs:false`, and fervid sync/async separately. Every API runs in its own child process **after all measurements**, so the plant suite cannot populate compiler caches, initialize threads, grow allocators or JIT code in the benchmark process before timing. Crashes, timeouts, missing verdicts, failures and `UNKNOWN` all keep the measured time visible but unranked. All per-plant outcomes plus a stable manifest hash are retained in benchmark JSON. Known-failure suppressions used by `pnpm confirm` never turn a live benchmark-gate failure into a pass.

VDOM and Vapor production/development compiler cells are certified separately. Vapor modules are executed against the pinned `vue-36` runtime whose package version must exactly match `@vue/compiler-sfc-36`. The child loads that release's shipped development `vue.runtime-with-vapor.esm-browser.js`, routes generated `vue` imports to the same module instance, mounts through `createVaporApp`, and enables Vue's own `vaporInteropPlugin` for plants that intentionally contain local VDOM components. The development runtime is deliberate for both compiler environments: the benchmarked Vue workload compiles script and template as separate non-inline modules, and Vue's production runtime assumes the production integration has already inlined a script-setup template; using it would test a different assembly and turn setup refs into raw objects. `isProd` still varies on the exact compiler calls, while the semantic harness runtime stays fixed just as the VDOM harness runtime does. Supported Vue 3.6, Vize and Verter Vapor entrypoints therefore receive observed PASS/FAIL outcomes rather than borrowing VDOM evidence. A backend that does not exist (for example Vue 3.5 or fervid Vapor) remains individually `UNKNOWN`; it does not turn supported entrypoints into `UNKNOWN`. A failed official Vue Vapor plant invalidates the denominator and leaves every affected timing visible but unranked, exactly like a failed candidate plant.

The pinned `3.6.0-rc.4` baseline currently passes 28/31 Vapor plants. Its three failures are retained dynamic-event invocation after a computed handler becomes `null`, object-form custom-directive handling (`dir is not a function`), and ignored `v-memo` update gating. The event and memo behaviours were independently reproduced through the official inline-template Vapor compile path, so they are not artifacts of the benchmark's non-inline module composition; the runtime's custom-directive implementation explicitly expects a callable Vapor directive while the planted standard Vue directive is object-form. These are live installed-version observations, not permanent exclusions or labels: an upgrade that fixes them changes the gate result automatically.

| Tool                                           | Package                 | VDOM | Vapor                              | Prod / Dev knobs                                |
| ---------------------------------------------- | ----------------------- | ---- | ---------------------------------- | ----------------------------------------------- |
| Vue Official 3.5.x                             | `@vue/compiler-sfc`     | yes  | **no** (skipped — no Vapor path)   | `isProd`                                        |
| Vue Official 3.6.x                             | `@vue/compiler-sfc@3.6` | yes  | yes (`vapor: true` / vapor script) | `isProd`                                        |
| Vize                                           | `@vizejs/native`        | yes  | yes (`vapor`)                      | `templateHoistStatic` + `templateCacheHandlers` |
| Verter                                         | `@verter/native`        | yes  | yes (`forceVapor`)                 | `isProduction` + `hmrStrategy`                  |
| [fervid](https://github.com/phoenix-ru/fervid) | `@fervid/napi`          | yes  | **no** (skipped — no Vapor path)   | `isProduction`                                  |

Vize does not expose a single `isProduction` property on these standalone APIs, but the installed native binding accepts the same two production template behaviours its Vite integration passes. The benchmark sets both explicitly for `compileSfc` and `compileSfcBatchWithResults`. An untimed probe requires them to change VDOM output before those rows may rank. Their effect on Vapor is reported separately and is not treated as a VDOM capability failure.

#### Caveat: fervid is measured but validity-gated on every run

[fervid](https://github.com/phoenix-ru/fervid) (`@fervid/napi` 0.4.1) is an all-in-one Vue SFC compiler in Rust. It is wired into the Compiler surface only — it has no JSX, typecheck, format, lint, component-meta or LSP surface, so it appears nowhere else — and VDOM only, so vapor cells report it `skipped` rather than substituting VDOM, exactly as Vue 3.5 is treated.

Its rows are measured and pass through the same [codegen validity gate](#codegen-validity-gate) as every compiler. With the currently pinned `@fervid/napi` 0.4.1 and published 200-file corpus, the generated report records 22 outputs that do not parse, so those rows are bracketed and excluded from ranking. The count is derived by each run rather than used as a hard-coded gate.

The cause is multi-binding `v-for`. For `v-for="(label, i) in labels"` fervid emits doubly-parenthesised arrow parameters:

```js
_renderList(__props.items, ((item, index)) => /* … */)
//                         ^^^^^^^^^^^^^^^  not valid JavaScript
```

Single-binding `v-for="item in items"` is unaffected in that pinned release. The rule is not fervid-specific: every compiler's output is parsed in every selected target/environment cell, and the report contains the current per-package totals.

The independent confirmation suite (`pnpm confirm:compile`, runtime behaviour under `@vue/test-utils`) currently has 24 cases per compiler. fervid passes 15 of 24; all nine failures are recorded in `tests/confirm/known-failures.json` with root causes. This count is separate from the benchmark's 19 exact-entrypoint semantic plants above:

| Case                   | Root cause                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `v-for-list`           | doubly-parenthesised arrow params — the gate failure above                                                |
| `slot-fallback`        | fallback passed to `_renderSlot` as an array, not the thunk Vue calls                                     |
| `dynamic-component-is` | `<component :is>` compiled as a literal component named `component` instead of `_resolveDynamicComponent` |
| `keep-alive`           | same `<component :is>` cause, inside `<KeepAlive>`                                                        |
| `custom-directive`     | directive bound correctly, but the `512 /* NEED_PATCH */` flag is omitted so `updated` never fires        |
| `dynamic-slot-name`    | plain computed slot key instead of `_createSlots` + `1024 /* DYNAMIC_SLOTS */`                            |
| `event-modifiers`      | `@keyup.enter` compiled with `_withModifiers` instead of `_withKeys`, so the key guard is a no-op         |
| `css-v-bind`           | `__scopeId` set but no `useCssVars()` emitted, so `<style> v-bind()` never resolves                       |
| `v-show`               | `_vShow` bound but `512 /* NEED_PATCH */` omitted, so toggling never updates `display`                    |

Two further properties of the fervid rows are stated on every row rather than folded into the number:

- **It compiles basic scoped and deep styles.** `compileSync` returns CSS for them, so it is measured in the SFC compilation with CSS class. Its current row is additionally unranked by the style correctness gate because `:slotted()`, `:global()` and `v-bind()` remain untransformed and no CSS Modules mapping is exposed.
- **Its pinned build returns a JS source map, but no CSS map beside its compiled styles.** That is enough for a render-only artifact, not for the style-inclusive source-map-on class, which requires both outputs to be mapped. The executable capability audit controls the row and can clear this after an upgrade.

A third observation is _not_ held against it: the pinned build reports non-fatal `NonVoidHtmlElementStartTagWithTrailingSolidus` diagnostics for self-closing non-void tags (`<div />`, `<MyComp />`) that Vue's SFC parser accepts. Codegen completeness is checked separately; the current count is stored per run in the JSON report rather than frozen into this methodology.

**Every part of this is re-derived on each run.** The gate re-parses fervid's output each benchmark and the confirmation suite fails the build if a listed failure starts passing, so a later fervid release that fixes the `v-for` codegen clears the bracket and enters the ranking with no change to this repository.

#### Codegen validity gate

The compile surface ranks on bytes per millisecond, and nothing used to check that those bytes parsed. A compiler emitting syntactically broken output for part of the corpus is doing less work than one that is not, and would out-rank it on exactly that basis.

So before any timing, each compiler's output for the whole corpus is parsed. TypeScript syntax is permitted (the corpus is 110/200 `lang="ts"` and `compileScript` passes annotations through for a downstream transpiler); only genuine syntax errors count. A tool that fails is **measured but unranked**, with the failing count and first error in its row notes — the compile-surface analogue of the typecheck and lint work gates.

**The gate runs once per (target × environment) cell, with that cell's flags.** It used to run once on vdom/production and stamp the verdict onto the Vapor and development cells it had never exercised — but Vapor is a different codegen backend and development mode emits different code (HMR wiring, no hoisting), so a pass on one is not evidence about the other. In the direction that matters, a tool whose Vapor output does not parse kept a ranked Vapor row on the strength of its VDOM output. Source maps are _not_ a gate dimension: a map is emitted beside the code and cannot change whether the code parses.

Each tool's compiler handle is constructed **inside** the gate's own try, so a throwing constructor cannot destroy every row for the corpus — which is what happened when `new VerterHost(…)` and `new Compiler(…)` sat outside it. A missing or unmeasured mandatory gate is now `UNKNOWN` and unranked, not annotated while still receiving a ranking.

**One error policy for `@vue/compiler-sfc`, Vize and Verter in the timed path:** a non-empty top-level or per-file `errors` array fails the measure. Vue returns parse and template errors in an array rather than throwing; Vize batch can report failures both at batch and per-result level, and both are checked. fervid's only exception is the complete `NonVoidHtmlElementStartTagWithTrailingSolidus` diagnostic code when code was still produced. Every other fervid diagnostic fails; this is not substring-based or blanket diagnostic tolerance.

**Modes on the row:** Vue official compiler is **1T only** (worker_threads variants removed). Threading remains a row property, and every candidate ratio remains anchored to the matching Vue reference. Ranked Verter rows are fresh-host first-admission compiles. Verter's persistent identical-source behavior is a warm-host stateless re-render, not a session-cache hit; it lives only in the diagnostic command.

**Single-file microbench** (tinybench size ladder under `fixtures/compile-single/`):

```bash
pnpm bench:compile:single
# tiny → small → medium → large → xlarge; 20 warmup + 100 iters
# Each iteration changes fixed-width comments in every script/template block
# options: --files tiny,medium --targets vdom
# host/session/identical-source studies: pnpm diagnose:compile-warmth
```

Results: `results/compile-single-<platform>.md`. Not comparable to bulk corpus throughput.

### Compilers — JSX ([vue-jsx-vapor](https://github.com/vuejs/vue-jsx-vapor))

Separate surface: **`jsx-compile`**. Inputs are unique `.jsx` files (`fixtures/jsx-N`), not SFCs. Do not compare JSX transform ms to SFC compile ms.

| Tool                     | Package                                      | Modes                                    |
| ------------------------ | -------------------------------------------- | ---------------------------------------- |
| vue-jsx-vapor (Rust/Oxc) | `@vue-jsx-vapor/compiler-rs`                 | vapor (default) · VDOM (`interop: true`) |
| vue-jsx-vapor API        | `vue-jsx-vapor/api` (`transformVueJsxVapor`) | vapor default                            |
| Classic Vue JSX          | `@vue/babel-plugin-jsx` + `@babel/core`      | VDOM (`createVNode`)                     |

Also available from the monorepo (not ranked as a separate LSP here): Vite/Webpack/Rollup plugins, `@vue-jsx-vapor/eslint`, and Volar/ts-macro integration — see [upstream docs](https://jsx-vapor.netlify.app/).

```bash
pnpm generate                 # also writes fixtures/jsx-N
pnpm bench:jsx-compile
pnpm confirm:jsx-compile
```

### Fixtures and repeated-input studies

| Path                    | Contents                                            | Use for ranking?                   |
| ----------------------- | --------------------------------------------------- | ---------------------------------- |
| `fixtures/{N}`          | Diverse templates, **every body unique** (uniquify) | **Yes — primary** (SFC)            |
| `fixtures/{N}-vapor`    | Unique + `<script setup vapor>`                     | Optional vapor authoring           |
| `fixtures/{N}-repeated` | **Identical body**, different filenames             | **No** — repeated-input study only |
| `fixtures/jsx-{N}`      | Unique `.jsx` components                            | **Yes** for `jsx-compile` only     |

Default compile applies **compiler flags** (VDOM/Vapor × prod/dev) on the unique corpus.

CI also runs a non-ranking compile pass on `fixtures/{N}-repeated` so repeated-input effects stay visible. This is a corpus-shape study, not a cache benchmark: Vize's exact `compileSfcBatchWithResults` path does **not** use the stats-only `compileSfcBatch` API's duplicate-body grouping and does not return generated output from a prior call.

### Typecheckers

| Tool          | Package                    | Command / API                                 | TypeScript engine                                         |
| ------------- | -------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Vue TSC       | `vue-tsc`                  | `vue-tsc --noEmit -p tsconfig.json`           | **TypeScript 6.0 (JS)**                                   |
| Vue TSC (TNB) | `typescript-native-bridge` | same command, `envs/tnb` install              | tsgo **stable** 7.0.2 (in-process NAPI/FFI)               |
| Golar         | `golar` + `@golar/vue`     | `golar typecheck` (+ default mode separately) | typescript-go (native)                                    |
| Vize          | `vize`                     | `vize check . --tsconfig …`                   | tsgo **nightly** (`@typescript/native-preview` 7.0.0-dev) |
| Verter        | `verter-tsc`               | `verter-tsc --noEmit -p tsconfig.json`        | tsgo **stable** 7.0.2                                     |

#### Engines share one table, tagged (JS) — and why the tag matters

Most of these run the **native Go TypeScript engine**; stock `vue-tsc` runs the **JavaScript** one. A cross-engine ratio mostly measures TypeScript's own Go rewrite, not the Vue layer under test. The engines used to get separate tables for that reason; they now share one table with the JS-engine rows tagged **(JS)** on the name — compact, but the caveat is unchanged: compare like with like, and read a JS-vs-native gap as an engine measurement first.

**`vue-tsc (N)` (TNB / tsgo) holds the Vue layer fixed and changes only the engine.** It is the _same_ `vue-tsc`, the same `@vue/language-core`, the same template checking — with `typescript` aliased to [typescript-native-bridge](https://github.com/johnsoncodehk/typescript-native-bridge), whose checker is tsgo in-process. One variable changes, so the pair isolates the engine from the Vue layer.

Illustrative decomposition. **Local `fixtures/50` on win32, 50 files, 5 measured runs after a warmup; CV 1.5–3.1% on every ranked row.** Published numbers come from Linux CI — these are indicative of the _shape_, not a published ranking.

Measured medians:

| Tool                   | Engine                |       Median |   CV |                                Diagnostics |
| ---------------------- | --------------------- | -----------: | ---: | -----------------------------------------: |
| `vue-tsc`              | TypeScript 5.9.3 (JS) |       1.35 s | 2.6% |                                          0 |
| golar typecheck        | tsgo 7.0.2            |     564.1 ms | 3.1% |                                          0 |
| `vue-tsc` (TNB / tsgo) | tsgo 7.0.2            |     696.6 ms | 1.5% |                                          0 |
| `verter-tsc`           | tsgo 7.0.2            |     760.5 ms | 2.0% |                                      105 ⚠ |
| Vize check             | tsgo nightly          | _(132.8 ms)_ |    — | _(0)_ — unranked, failed the template gate |

| Comparison                                                        | Gap                                      | What differs between the two rows                                                 |
| ----------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| `vue-tsc` (JS) vs `vue-tsc` (TNB) — **same tool, engine swapped** | **1.94×**                                | The TypeScript engine only; the Vue layer is identical in both rows               |
| `vue-tsc` (TNB) vs `verter-tsc` (**same engine, both validated**) | **1.09×** (`vue-tsc` (TNB) median lower) | The Vue layer only; the engine is identical in both rows                          |
| `vue-tsc` (TNB) vs golar (**same engine, both validated**)        | 1.23× (golar median lower)               | The Vue layer only; the engine is identical in both rows                          |
| Vize (unranked) vs `vue-tsc` (JS)                                 | 10.2×                                    | Engine and Vue layer both differ, and the Vize row did not pass the template gate |

Read together: the 1.94× between the two `vue-tsc` rows is attributable to the engine swap alone, and between same-engine, both-validated rows the measured gaps on this corpus are 1.09× and 1.23×. A single cross-engine ratio multiplies the two factors together, which is why the (JS) tag exists and why a cross-engine comparison should be read as an engine measurement first.

> ⚠ An earlier revision of this table published **~2%** from a **single** unreplicated run at a 20-file limit. That figure was corrected: the run it was taken from showed 1.20×, in the opposite direction to the 1.09× that the replicated 5-run measurement at 50 files above gives. Single-run typecheck numbers on this corpus move by more than the gaps being reported, so they are not treated as results. Note also that `verter-tsc` is the only row emitting diagnostics on this corpus — 105 of them, referring to its own virtual code — so its output on this run was not the same as that of the rows above it.

Stock JS-engine `vue-tsc` is **kept** as a row, because it is what ships today.

TNB lives in [`envs/tnb`](../envs/tnb/README.md) as a standalone project, never a root `typescript` override — an override would swap the engine under component-meta, lint and LSP at the same time. It must also print its activation banner on the work-gate run, or the row is unranked: a silent fallback to the JS checker would leave the row labelled native while running JS.

Note also that Vize ships a tsgo **nightly** while `verter-tsc` requires stable and rejects nightlies. Both are ranked in the same engine class, and every row prints its exact engine build.

Default typecheck file limit is **200** (or smaller if the fixture is smaller) — typecheck cost scales steeply vs pure compile.

**Post-timing work gate — every stage required to be ranked.** Results appear per row as `gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓`. The suite is versioned and hashed in benchmark JSON, and runs only after all timing so its extra processes cannot warm executable, fixture or dependency pages for measured calls:

| Stage          | What it plants                                            | What it proves                                                    |
| -------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| **script**     | Type error in `<script setup>` only                       | The tool typechecks script blocks at all                          |
| **tmpl-prop**  | Clean script; `:disabled` string→boolean in template only | It checks native-element **prop types** in templates              |
| **tmpl-event** | Clean script; `@click` number→function in template only   | It checks **event handler** types in templates                    |
| **corpus**     | Same bug planted into the **full timed corpus**           | It still finds it at scale, under the tsconfig the timed runs use |

The two template capabilities are **separate single-error projects on purpose**. A combined plant carrying both errors let a checker pass on the strength of whichever half it supported: under the combined plant, one checker reported the `@click` mismatch, did not report `:disabled`, passed the gate, and was ranked at ~10× the speed of `vue-tsc`. Split into two projects, the same checker fails the `tmpl-prop` stage and its time is bracketed.

The diagnostic must **name the planted file**. Without that, an unrelated project-level failure (a config import that will not resolve, say) reads as a pass and the gate silently stops gating.

#### Caveat: `verter-tsc` is the only checker that is not silent on a clean corpus

⚠ The benchmark corpus is generated and clean, so **0 diagnostics is the correct answer**, and it is the answer `vue-tsc`, `vue-tsc (TNB / tsgo)`, `golar typecheck` and `golar default` all give. `verter-tsc` does not.

Measured locally (win32, the same runs the tables above are produced from — `results/` is gitignored, so these are not yet the published CI figures):

| Corpus                                   | `verter-tsc` diagnostics | Every other ranked checker | `verter-tsc` rank in its class |
| ---------------------------------------- | -----------------------: | -------------------------: | ------------------------------ |
| 200 files (`fixtures/200`)               |                  **442** |                          0 | 3rd (2.20× golar's median)     |
| 20 files (`fixtures/50`, check limit 20) |                   **42** |                          0 | **1st**                        |

On the smaller corpus, the row ranked 1st in its class is also the only one emitting diagnostics, at roughly two per file. Ranking is by median time and is not adjusted for diagnostic count.

The diagnostics refer to Verter's own virtual code rather than to the source under test. The confirmation suite records this independently in [`tests/confirm/known-failures.json`](../tests/confirm/known-failures.json): on a **clean** generic `<script setup>` component `verter-tsc` emits three diagnostics — `___VERTER___Attrs requires 1 type argument`, `___VERTER___attributes is not generic`, and `Cannot find name 'items'` — against a fixture that contains no planted error.

Two consequences for how the tables read:

- **The work gate does not test for this.** It asks whether the planted bug was found, not whether anything else was reported. `verter-tsc` passes all four stages (`script`, `tmpl-prop`, `tmpl-event`, `corpus`) and is ranked on that basis.
- **The artifact column does not flag it either.** Diagnostics carry _informational_ polarity, because on a clean corpus a higher count is not more work — so no ⚠ fires on the count, on any row. The count is recorded in this note instead of by an automatic flag.

Emitting diagnostics is not a gate failure, so the row is not bracketed. The condition on reading its time: the rows in this class did not produce equivalent output — one emitted 442 diagnostics on 200 files, the others emitted 0.

**Verter + tsgo:** `verter-tsc` requires the TypeScript **7 native** engine (stable `>=7.0.2,<7.1.0`), not the JS-engine `typescript` and not nightly `@typescript/native-preview`. This repo pins:

| Package                                  | Role                         |
| ---------------------------------------- | ---------------------------- |
| `typescript@6.0.x`                       | vue-tsc / vue-component-meta |
| `typescript-go` (`npm:typescript@7.0.2`) | Verter tsgo engine           |

The harness sets `VERTER_TSGO_BIN` to the platform native binary (`tsc.exe` / `tsc` under `@typescript/typescript-<platform>`). Override with `VERTER_TSGO_BIN=/path/to/tsgo` if needed.

### Formatters

| Tool     | Package          | Notes                                                                                         |
| -------- | ---------------- | --------------------------------------------------------------------------------------------- |
| Prettier | `prettier`       | Built-in Vue SFC support                                                                      |
| Oxfmt    | `oxfmt`          | 0.64.0 hybrid: native orchestration, bundled Prettier `formatFile(parser=vue)` for whole SFCs |
| Vize     | `vize`           | `vize fmt --write`                                                                            |
| Biome    | `@biomejs/biome` | `biome format --write`; exact pinned row rewrites no planted `.vue` files; unranked           |

Each format run uses a **fresh copy** of the corpus (write is destructive).

The pinned oxfmt 0.64.0 package was re-audited from its shipped code: the native
binding receives callback functions from `dist/index.js` / `dist/cli-worker.js`,
and a whole `.vue` file reaches `formatFile` in `dist/apis-*.js`, which calls the
bundled Prettier formatter with `parser=vue`. Worker scheduling and native
orchestration are still oxfmt's, so this is described as a hybrid pipeline—not
as either a pure Rust Vue formatter or a plain `prettier` CLI alias. This claim
is version-scoped and should be re-probed on the next oxfmt upgrade.

`.prettierrc.json` and `biome.json` travel with every copy — both tools resolve
config by walking up from the file, and the work dir is not under the fixture
dir. The two configs set the same indent, line width, quote style, semicolon
and trailing-comma choices, so neither is doing more rewriting than the other
because of style settings alone.

Every work copy and gate plant also carries an empty `.git` directory as a
**repo-boundary marker**. Walk tools that honour ancestor `.gitignore` rules
(oxfmt 0.63+; oxlint on the lint surface) otherwise inherit _this_ repository's
exclusion of the `work/` dir the copies live in and walk zero files — observed
live on oxfmt 0.63, which exited "all matched files may have been excluded by
ignore rules" and rewrote 0 planted files, where 0.61 (no ancestor-ignore
handling yet) was ranked. A real project root has the boundary; the marker
changes no tool's invocation.

**Exact-row semantic and coverage gates.** After every timing has completed,
each formatter's exact directory/glob command runs twice over three nested SFC
plants. A ranked row must parse, be idempotent, preserve block attributes and
custom blocks, preserve template/script AST meaning and CSS constructs
(`scoped`, modules, `v-bind`, `:deep`, `:slotted`, `:global`), and actually
rewrite the messy template. A separate full-corpus census counts files changed
by byte comparison. Generated output is never compared between tools.

Prettier, Oxfmt and Vize pass the current planted suite. The pinned Biome row
fails because its exact command rewrites none of the planted `.vue` files. The
gate reports that observed behavior; it does not preserve an older
"script-only formatter" explanation across upgrades.

This gate is why Biome is bracketed rather than ranked. It is not a small
difference in the ranking — on 50 SFCs Biome finished in **226 ms** against
Vize's 231 ms, so without the gate the fastest row in the table would have
belonged to the one tool doing a fraction of the work.

### Linters

| Tool              | Package                        | Invocation             | Notes                                                         |
| ----------------- | ------------------------------ | ---------------------- | ------------------------------------------------------------- |
| eslint-plugin-vue | `eslint` + `eslint-plugin-vue` | in-process **and** CLI | 1T + worker fan-out, plus a CLI row                           |
| Vize              | `vize lint`                    | CLI only               | 1T (`RAYON_NUM_THREADS=1`) + default threads                  |
| Verter            | `@verter/native`               | in-process only        | `VerterHost.lint` when available                              |
| Biome             | `@biomejs/biome`               | CLI only               | 1T + default threads; script-only on planted Vue capabilities |
| Oxlint            | `oxlint`                       | CLI only               | 1T (`--threads=1`) + default threads; same limitation         |

**In-process APIs and fresh CLI processes are separate comparison classes and
separate tables.** A CLI pays process startup and config loading on every run;
an in-process API amortises them. `eslint-plugin-vue` is measured both ways and
is the explicit reference denominator in each class. Vize remains CLI-only and
`VerterHost.lint` in-process-only, so no ratio crosses that invocation boundary.

All tools lint an identical isolated copy of the corpus under `work/lint/`, so a tool that takes an explicit file list and a tool that walks a directory see exactly the same files.

Rule sets are **not** identical. Throughput is ranked only after an exact-row,
post-timing suite of ten dirty/clean differential plants. A pass must attribute
the expected rule or narrow concept to the unique planted file and line, and the
clean twin must clear it. Arbitrary non-zero exit or an unrelated diagnostic is
never accepted. Full per-plant outcomes are stored in
`validation.lintSemantics`; any missing mandatory capability is visible but
unranked.

**Biome is unranked on this surface too.** It lints the `<script>` block and has
no template rules, so it never examines `<template>` and misses all mandatory
planted Vue template capabilities. The same blind spot produces false positives on this corpus in
the other direction: a variable declared in `<script setup>` and used only in
the template is reported as `noUnusedVariables`. Its diagnostics are therefore
not comparable to the Vue-aware linters' in either direction, which is what the
gate records. Biome does honour `RAYON_NUM_THREADS`, so it gets separate 1T and
default-thread rows; the default pool size is not relabelled "max threads."

**Oxlint is unranked for the same reason**, and it is the case worth being
careful about, because oxlint ships a `vue` plugin and the obvious objection to
its verdict is that the plugin was never switched on. It is switched on. An
`.oxlintrc.json` travels with the lint corpus **and with the gate plant**, so
the gate certifies exactly the configuration that is timed:

```json
{ "plugins": ["unicorn", "typescript", "oxc", "vue"] }
```

The exact pinned row misses every mandatory template diagnostic plant even with
that plugin configuration active, so it remains contextual/unranked. The suite
records observed diagnostics instead of carrying a hard-coded rule-count claim
across package upgrades.

Where oxlint differs from Biome is in how it handles the blind spot. Biome
reports template-only variable uses as unused; oxlint disables `no-unused-vars`
for `.vue` outright, so it reports neither the false positive **nor** a variable
that is genuinely unused in both blocks (verified: `-D no-unused-vars` on an SFC
with a dead `const` is silent). That is the better failure mode, but it is still
a rule the other linters run and oxlint does not. It exposes `--threads`, so it
gets separate 1T and default-thread rows like Vize and Biome.

One thing to keep in mind when reading oxlint's bracketed time against Vize's
and Biome's: **oxlint ships no standalone executable.** It is a NAPI addon
(`@oxlint/binding-<platform>`) loaded into a Node process, so its per-run
startup is Node's, while `vize` and `biome` launch a native binary. The
methodology's "a CLI pays process startup on every run" applies to all three,
but it is not the same constant for all three. The memory row is labelled
accordingly.

### Component-meta

| Tool               | Package                  | Notes                                                                                                                                                                    |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| vue-component-meta | `vue-component-meta`     | Official `createChecker` + `getComponentMeta`                                                                                                                            |
| Verter             | `@verter/component-meta` | Published `openComponentMetaSession` + `getComponentMeta` API. The earlier native-host workaround was removed when 0.0.1-beta.3 began shipping its `dist/` entry points. |
| Vize               | —                        | No dedicated public component-meta API on `vize` / `@vizejs/native`; row is `skipped` (declaration emit is a different job).                                             |

Every available row publishes **two independent series**: a fresh-child sample
(one new process per sample, building its checker or session for the first time
inside the timer) and the warm median that remains the ranking metric. See
[Component-meta's boundary is not the Compiler's](#component-metas-boundary-is-not-the-compilers)
for what the child excludes and why this surface keeps host construction inside
the timer.

### LSP (language servers)

Harness shape: init → didOpen → hover cold/warm (same workspace, file, and position for every server).

| Tool       | How we start it                | Notes                                                                                                                                                                                                                                  |
| ---------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Volar**  | `@vue/language-server --stdio` | Official Vue LS; `typescript.tsdk` = workspace `typescript/lib`                                                                                                                                                                        |
| **Vize**   | `vize lsp --stdio`             | Prefers the standalone native server its VS Code extension ships (auto-discovered from VS Code globalStorage, version-matched); falls back to the npm package's Node entry. Override with `VIZE_LSP_BIN`. The row says which was used. |
| **Verter** | `verter-lsp` binary            | Optional: set `VERTER_LSP_BIN` if not auto-discovered                                                                                                                                                                                  |

**Phases (in notes):** initialize · workspace ready (`n/a` if no signal) · **didOpen→hover** (primary ranking) · hover cold · hover warm median(5) · completion · definition.

**Retry budget is identical for every server** (6 attempts × 60 s, same backoff). It used to be 6 attempts for Volar and 2 for everyone else — and because the backoff sleeps sit _inside_ the timed `didOpen→hover` window, that handed Volar up to ~3 s of billable sleep the other servers could not incur, while hiding slow project spin-up. A server that needs the retries now pays for them.

#### Hover content is gated at two positions

Latency is only comparable if every server answered the same question correctly, so hover **content** is validated at two positions in the same file. Both must pass to be ranked:

| Position                                | Correct answer             | What it proves                           |
| --------------------------------------- | -------------------------- | ---------------------------------------- |
| `const benchMarker` in `<script setup>` | some form of `Ref<string>` | the server returns real TypeScript types |
| `{{ benchMarker }}` in the **template** | `string`                   | the server actually models the template  |

The template probe is the discriminating one. Vue **auto-unwraps refs in templates**, so the same symbol is `Ref<string>` in script and `string` three lines up in the interpolation. The script probe can be satisfied by proxying to a TypeScript server; the template probe cannot, so only a server that models the template returns the unwrapped type.

Measured, same workspace and position: two servers return the unwrapped `string`. One returns `benchMarker: Ref<string>` — the script type — accompanied by prose stating that refs are "auto-unwrapped in template". Its measured latency is the lowest of the three; it is **measured and shown in brackets, but not ranked**.

`Ref<...>` is rejected rather than accepted here, and the match is against the annotation (`benchMarker: string`) rather than a loose `string`, so that prose mentioning the word cannot pass. The probe runs **outside every timed window**, so it gates ranking without changing what the latency column measures.

Regression fixtures for all three real payloads live in [`tests/harness/lsp-hover-gate.test.mjs`](../tests/harness/lsp-hover-gate.test.mjs) — the first version of this gate wrongly failed a _correct_ server whose doc comment ran into its type signature (`let benchMarker: stringStable hover target…`), which has no word boundary after `string`.

#### Caveat: Vize's type-checking backend sometimes never starts, and the row still answers

⚠ Vize drives tsgo out-of-process as "Corsa". When that session fails to spawn, it logs to stderr and **falls back to its own semantic analysis**. The LSP traffic does not show it: the server initializes, answers every request, and returns a result with no protocol-level error, produced without the type-checking backend running.

This was observed, not hypothesised. It fired in a recorded run on this machine, with the reason `tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot)`. In that same run the Vize row was also bracketed for failing the template hover gate.

Both the LSP timing surface (`scripts/lib/surfaces/lsp.mjs`) and the IDE surface (`scripts/lib/ide-ops/context.mjs`) sniff for it and print `⚠ BACKEND FALLBACK` in the row's Notes. It is **reported, never used to fail a row on its own** — the hover and per-operation gates decide ranking. It is recorded so the conditions a row was measured under stay visible.

**A row carrying that warning was measured with the type-checking backend absent, so its latency is not a measurement of type checking.** The condition is non-deterministic: the backend can start normally on the next run, so a published table may carry the note on some runs and not others.

**Not measured:** VS Code extension host UI cost — only the stdio language-server protocol.

**Volar hybrid note:** Vue language-tools v3 no longer embeds tsserver. The client must bridge `tsserver/request` → TypeScript LS (`typescript.tsserverRequest`) → `tsserver/response` ([upgrade guide](https://github.com/vuejs/language-tools/discussions/5456)). This harness uses `typescript-language-server` + `@vue/typescript-plugin`. Incomplete hybrid wiring → status `error`.

**Verter:** set `VERTER_LSP_BIN` to a built `verter-lsp` binary when not published on npm.

**Vize:** `VIZE_LSP_BIN` (with `VIZE_LSP_ARGS` / `VIZE_LSP_LABEL`) overrides discovery. Left unset, the harness prefers the standalone native server the VS Code extension downloads, and only falls back to the npm package's Node entry when no version-matched binary is present — CI has no VS Code, so CI always measures the Node entry. That entry carries ~33 ms of Node bootstrap, so **the row and the memory label always name the entry point**: a local run and a CI run of the same version measured different entry points and are not comparable numbers.

### VS Code E2E (headless extension host)

Full editor-path measurements via [`@vscode/test-electron`](https://github.com/microsoft/vscode-test):

| Workspace    | Path                    | Role                                                         |
| ------------ | ----------------------- | ------------------------------------------------------------ |
| **regular**  | `fixtures/e2e/regular`  | Single-package Vue app                                       |
| **monorepo** | `fixtures/e2e/monorepo` | Shared UI package + app                                      |
| **nuxt-ui**  | `fixtures/e2e/nuxt-ui`  | Pinned real project (`--with-nuxt-ui`, default ref `v3.1.3`) |

| Subject    | Marketplace ID (default)                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------- |
| **Volar**  | [`Vue.volar`](https://marketplace.visualstudio.com/items?itemName=Vue.volar)                       |
| **Vize**   | [`ubugeeei.vize`](https://marketplace.visualstudio.com/items?itemName=ubugeeei.vize)               |
| **Verter** | [`verter.verter-vscode`](https://marketplace.visualstudio.com/items?itemName=verter.verter-vscode) |

Override with `--volar-extension` / `--vize-extension` / `--verter-extension`, or install a local Verter build via `--verter-vsix path.vsix`.

**Setup:** same VS Code **stable** build; isolated `--extensions-dir` per subject (only that Vue extension installed); same probe file per workspace; primary metric **hover cold** after open (`vscode.executeHoverProvider`). Results under `results/e2e-vscode/`.

CI: use workflow_dispatch / optional job — cloning Nuxt UI + downloading VS Code is heavy and network-bound (not on every PR by default).

#### typescript-native-bridge (TNB)

[typescript-native-bridge](https://github.com/johnsoncodehk/typescript-native-bridge) (by Volar's creator) is a drop-in **`typescript` package** backed by tsgo — **not a Vue LSP**.

| Role                                 | Status                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Ranked as a Vue LSP in its own right | No — it is not a language server, and not a different product to compare                           |
| `vue-tsc` engine swap                | **Shipped** — `vue-tsc (TNB / tsgo)` in the typecheck table                                        |
| LSP / IDE row, as Volar's **tsdk**   | **Shipped** — `Volar (TNB / tsgo tsdk)`: same Volar binary, same Vue half, TypeScript half on tsgo |
| component-meta / lint engine swap    | Not yet — same technique would apply, see below                                                    |

Install: `pnpm install --dir envs/tnb --ignore-workspace`. Absent, the row is skipped with a note and nothing else changes. See [`envs/tnb/README.md`](../envs/tnb/README.md) for why it is isolated rather than a root override, and [Engines share one table, tagged (JS)](#engines-share-one-table-tagged-js--and-why-the-tag-matters) for the comparison it enables.

##### Caveat: the TNB engine swap fails an IDE completion-resolve operation

⚠ On the typecheck surface the swap changes one variable, the engine, and TNB passes the full work gate there. On the IDE surface the same swap also changes an observed behaviour, recorded below.

On the IDE surface, `Volar (TNB / tsgo tsdk)` **offers an auto-import completion item and then errors resolving it**. The tsgo side throws `Debug Failure. False expression. at getCompletionEntryCodeActionsAndSourceDisplay` — recorded verbatim in [`scripts/lib/ide-ops/suites/completion.mjs`](../scripts/lib/ide-ops/suites/completion.mjs). The operation corresponds to accepting `computed` from the completion list and having the `import` statement written; on TNB it errors instead.

Stock Volar on the JavaScript TypeScript engine resolves the same item, so the difference tracks the engine swap rather than the harness. The suite fans a resolve out to both halves so the failure is attributed to the tsgo half rather than collapsed into the Vue half's "not my item" response.

Conditions for reading the `vue-tsc (TNB / tsgo)` row: it was measured on the typecheck surface, where it passes the work gate; the same engine fails the IDE completion-resolve operation above. The two surfaces were measured separately, and the typecheck result does not carry over to editor operations.

`vue-component-meta` and type-aware ESLint also run the JS engine today and could get the same treatment, which would remove the last engine asymmetries in the report. Not done yet — each needs its own isolated env and its own work gate.

### Confirmation suite (correctness — not performance)

Benchmarks measure **throughput**. The confirmation suite checks tools against planted expectations:

```bash
pnpm confirm                 # compile + jsx-compile + lint + typecheck + component-meta + format
pnpm confirm:compile
pnpm confirm:jsx-compile
pnpm confirm:lint
pnpm confirm:typecheck
pnpm confirm:component-meta
pnpm confirm:format
```

| Surface            | What we assert                                                                                                                                                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **compile**        | Each SFC compiler emits code that mounts under `@vue/test-utils` and matches expected DOM/behavior (counter, props, `v-if`, `v-for`, slots, `inheritAttrs` true/false).                                                                                                                               |
| **jsx-compile**    | `vue-jsx-vapor` / `@vue-jsx-vapor/compiler-rs` / `@vue/babel-plugin-jsx` transforms plant JSX into code matching expected vapor/VDOM patterns.                                                                                                                                                        |
| **lint**           | Ten exact-row dirty/clean plants require file, line and rule/concept attribution; arbitrary exit status and unrelated diagnostics never pass.                                                                                                                                                         |
| **typecheck**      | Clean projects stay clean; planted bugs in `<script>` and `<template>` are reported. Full plant list, inheritAttrs/root-shape rules, and the last pass/fail matrix: [docs/typecheck.md](typecheck.md).                                                                                                |
| **component-meta** | Extracted public API matches plants: prop names/types/required/defaults, emits, slots, `defineExpose`. Tools are normalized to a common shape — schema phrasing may differ; missing API surface is a FAIL. Vize is scored via `generateDeclaration` (declaration emit, not a dedicated meta package). |
| **format**         | Formatters (Prettier, Oxfmt, Vize, Biome) exit 0, keep the SFC parseable via `@vue/compiler-sfc`, stay idempotent (`format(format(x)) === format(x)`), and preserve planted comments / `v-for` identifiers / `generic=`. Exit 0 alone is not a pass.                                                  |

Results: `results/confirm.md` + `results/confirm.json`. Exit code **1** on any FAIL; **skip** is allowed (e.g. verter-tsc without tsgo).

Fixtures live under `tests/confirm/fixtures/`. This suite is for correctness checks, not throughput ranking.

## Fresh child and Warm metrics

Two surfaces publish both series: **Compiler** and **Component-meta**. The
first timed row workload in a new child is a valid workload, but it is
different from steady-state work. Those tables publish both without combining
them. The bullets below describe the **Compiler** boundary; Component-meta
draws it in a different place, for a stated reason — see
[Component-meta's boundary is not the Compiler's](#component-metas-boundary-is-not-the-compilers).

- **Fresh child** is the median first timed row workload across new child processes,
  one child per row and sample. Child process startup, package import, shared
  input materialisation, and Verter host/workspace construction occur before
  the internal timer, matching the Warm call's setup boundary. Imports and setup
  can themselves initialize or mutate V8/native/thread/allocator state, so the
  metric does not claim that all process-global state is untouched. Each child
  loads only the selected row's package among the benchmarked compilers; shared
  harness dependencies are still imported. Unrelated compiler NAPI modules are
  not initialized in that process.
- **Warm** is the median measured series in the benchmark process after at least
  one discarded pass. This remains the steady-state throughput measurement.

Both columns use the official Vue row as their denominator inside the same
raw/CSS and VDOM/Vapor class. They never share a ratio across classes. The
harness does **not** drop the OS page cache. Fresh child is deliberately not
called Cold, and Fresh-child minus Warm must not be interpreted as pure first-use
overhead because the process models and excluded setup differ.

Fresh-child samples receive already prepared, byte-identical SFC strings from the
parent. Preparation is not repeated in the child because it uses Vue's parser to
locate revision sites; doing that there would exercise only Vue before the timed
row workload. Each child still calls the exact row adapter and validation policy.
Warm input materialization is an explicit all-row setup phase before any row timer.
JSON retains the executed row order plus adapter option hash, input source hash,
input count/bytes, artifact, actual-mode and cache-hit diagnostics. A mismatch
unranks that row.

Retained-process and cache-state effects remain available in the deeper
diagnostic:

```bash
pnpm diagnose:compile-warmth
```

That diagnostic records Vize's first and second identical `compileSfcBatchWithResults` calls in one child, repeats the experiment in fresh children, and records Verter fresh-host, persistent-host changed-source, identical-source, stateless, and session cases with actual modes and cache-hit counts. For Vize, source tracing establishes that the standalone API invokes per-file parsing and compilation/codegen on each call and returns no previous generated-output cache entry. The process-global Rayon pool survives. Ordinary allocator/page reuse is not instrumented and is therefore **UNKNOWN**, not inferred from a faster second call. Imported-type resolution has a separate process-wide filesystem/type cache; it is not parsed SFC, semantic IR, or generated-output reuse. So:

- **Warmup is mandatory for the Warm series.** `--warmups 0` is clamped to 1 and a warning is printed.
- **Fresh child and Warm are medians of independent samples.** Fresh child gets one new process per row/sample; Warm reuses the benchmark process after its discarded pass. They are not paired deltas.
- Warm was deliberately not replaced by the second call in each Fresh-child process. That would be a different workload—one row-local predecessor call instead of the benchmark's shared-process steady state—and would still leave package-import/setup initialization outside the timer. The report therefore refuses to label the independent-series delta as overhead.
- Both series report min, stddev and **CV%** independently. Warm is the primary ordering/ranking. A Fresh-child series above the 50% CV ceiling loses only its Fresh-child ratio; its raw samples remain visible and its Warm result is judged independently.

Compiler **Peak RSS** is measured separately from timing. Each compiler row runs
in its own resource-probe child, so the sampler cannot perturb the speed series
and sibling compilers do not share one process. For in-process compiler APIs the
published value is the highest tool-attributed RSS delta from that worker's
post-GC baseline across all recorded samples; a CLI row, if present, uses the
absolute child/process-tree RSS. The complete min/max/average, allocation proxy,
CPU, wall-time and raw per-sample records live in `docs/compiler.md`.

Local scripts:

```bash
pnpm bench          # default: 5 measured runs, 1 warmup
pnpm bench:quick    # 3 runs, 1 warmup
pnpm bench:deep     # 9 runs, 2 warmups — use when CV% is high
```

### Component-meta's boundary is not the Compiler's

Component-meta uses the same runner and the same two-series presentation, with
one deliberate difference: **checker/session construction stays inside the
timer**. `createChecker` builds a TypeScript program and the Verter row opens
and evicts a pooled native engine on every iteration, and both do so inside the
*warm* timer too — moving them out of the fresh child would have deleted the
part of the cost the column exists to show, and compared two different
workloads. Excluded from that child are process startup, package import, and
project materialisation: the parent prepares the disk-backed project once and
passes its path, so the child reads a project it did not build.

Each child imports only its own row's meta package. The fresh children run
**before** the warm pass, so the warm pass cannot be what warmed the OS page
cache for them; the cache is still not dropped, and no wholly-cold runtime is
claimed. The two paths are checked for adapter parity — same adapter option
hash, same input count, same materialised member count — and a row whose fresh
and warm passes disagree keeps both timings but is unranked, because a cold
number produced from a different workload is a second benchmark rather than
that row's cold reading.

### Artifact column — "fast" vs "did less"

Timing alone cannot tell a fast tool from one that skipped the work. Every table carries an **artifact** count next to the timing — what the tool actually produced:

| Surface        | Artifact                                       | Polarity                                     |
| -------------- | ---------------------------------------------- | -------------------------------------------- |
| compile        | emitted code bytes                             | more = more work (⚠ below 50% of class peak) |
| typecheck      | diagnostics emitted                            | informational                                |
| lsp / ide      | hover bytes, item counts                       | informational                                |
| component-meta | extracted prop/event/slot/model/expose members | informational                                |
| jsx-compile    | generated code bytes                           | informational                                |
| **format**     | **none yet**                                   | —                                            |
| **lint**       | **none yet**                                   | —                                            |

⚠ **Two surfaces currently have no per-timed-run artifact census:** `format` and `lint`. Their exact-row semantic and coverage plants prevent known no-op/partial paths from ranking, but the rankings remain provisional until each timing also reports an artifact count. JSX now records generated code bytes. Component-meta records materialised members; that count is informational rather than semantic equivalence because the tools expose different metadata schemas.

Where **more output means more work** (code bytes), a row below 50% of the largest artifact in its class is flagged ⚠ and its speed marked not comparable. Where the count is **informational** (diagnostics on a deliberately clean corpus, where zero is the correct answer) no threshold applies in either direction: a low count is the expected result there, so a low-count flag would fire on every row that answered correctly.

One consequence of that polarity choice: a row emitting hundreds of diagnostics on a clean corpus receives no automatic flag. `verter-tsc` is the row in question on this corpus — see [the diagnostics caveat](#caveat-verter-tsc-is-the-only-checker-that-is-not-silent-on-a-clean-corpus). The count is disclosed in that note rather than by the column.

Limit of the method: byte-count is blunt. It catches gross omissions, not semantic ones — a compiler that flattens a `v-for` instead of emitting loop codegen loses some bytes but not enough to trip the threshold.

### Failed validation is shown, not hidden

A tool that fails a work gate is **still measured**, and its time is reported **in brackets** with the reason:

```
| Vize ⚠ | (114.0 ms) | … | not ranked | … |
```

The ⚠ on the name replaces the old Status column; the reason lives in the row's entry in the Notes collapsible under the table.

It is excluded from the ranking sort, from the `vs fastest` baseline, and from the artifact-peak calculation, so a bracketed row cannot shift the rows it was measured alongside. Dropping the row entirely removed information: the time and the gate outcome are reported together so both are visible.

### Order rotation

Tool order is **rotated by run index** on every warmup and measured run, so over `runs >= tools` every tool visits every position. Forward/reverse alternation was not enough: it produces only two orderings and leaves run 0 in fixed declaration order, which mattered when run 0 was the ranked metric and the same tool always occupied the first position.

### Remaining limits

- We do **not** drop OS page cache on GitHub-hosted runners (no root `drop_caches`).
- After the first tool touches fixtures/`node_modules`, later tools in the **same** job may share a warmer OS file cache.
- CLI tools pay process startup on every run; in-process tools amortize it. Surfaces with both modes use explicit comparison classes; lint renders separate CLI and in-process tables with an eslint-plugin-vue denominator in each.

### Sharding rule

**Linux only, and every timing surface runs in one job.** No result is ever merged across machines.

> **The one permitted split: by project, in the real-world workflow.** [`benchmark-real-world.yml`](../.github/workflows/benchmark-real-world.yml) runs a matrix of one job **per project**, with every surface and every tool inside it. That does not violate the rule, it applies it: every comparison the real-world report makes is _within_ a corpus (Vue vs Vize vs Verter on Hoppscotch), and the report states outright that corpora are never ranked against each other. So the set of numbers that must share a machine is exactly one project's — which is exactly what one job contains. The split that would still be forbidden is a matrix over **surfaces**, putting `bundle` and `lint` for the _same_ project on two VMs; that is the sharding this rule exists to prevent, wearing a matrix as a disguise.

Cross-OS rows were never comparable — this report already forbids it — so a three-OS matrix bought nothing but 3x the runner cost and three more sources of variance. One OS, one runner class, one set of numbers.

The tempting optimisation is to shard by surface — `lint` and `typecheck` are the two biggest and together are ~70% of the job. We don't, because it puts each surface on a different runner, and GitHub runners vary enough that a report stitched together from several VMs is not one measurement. Keeping everything on one box removes that discrepancy outright, and guarantees a comparison class can never accidentally span machines as surfaces are added or regrouped.

Measured cost per surface (n=200, runs=5, 32-core box) — all of it sequential in the one `bench` job. These are the figures recorded in [`.github/workflows/benchmark.yml`](../.github/workflows/benchmark.yml) (the `bench` job header and its `timeout-minutes` rationale), not estimates:

| Surface                |   Cost |
| ---------------------- | -----: |
| lint                   | ~100 s |
| typecheck              |  ~76 s |
| format                 |  ~33 s |
| lsp                    |  ~25 s |
| component-meta         |   ~9 s |
| compile (whole matrix) |   ~8 s |
| jsx-compile            |   ~2 s |

~4.2 minutes total. Benchmarks are `workflow_dispatch` only — there is no push trigger and no schedule — so this is a cost paid when somebody asks for a number, not on every review round.

⚠ An earlier revision of this table published `lsp ~376 s`, drawn from a period when Volar exhausted a 6 × 60 s retry budget on every run. That is fixed and LSP is now the fourth-cheapest surface. If you have seen the old figure quoted, it is wrong.

The other three jobs run separately and are not in that total, also measured: `memory` ~4.8 min at `--samples 3`, `ide` ~3.2 min at the `--runs 3` CI uses, `ide-scale` ~3.6 min at the 1 run + 1 warmup CI uses. Jobs are capped at `timeout-minutes: 20`, with `ide` at 30.

**Request budgets scale with the workspace.** Every budget in the IDE suites used to be a flat constant sized for the worst case anywhere in the harness — 30 s per request, 45–60 s for a warm-up, 120 s in the scale suite — which on a 3-file workspace is not a budget but the absence of one. [`scripts/lib/ide-ops/budget.mjs`](../scripts/lib/ide-ops/budget.mjs) derives them linearly from the file count the suite declares, from a small-project floor (≤ 20 files) to a large-project cap (≥ 1000):

| Class       | ≤ 20 | 100    | 200   | 500     | ≥ 1000 | What it covers                              |
| ----------- | ---- | ------ | ----- | ------- | ------ | ------------------------------------------- |
| `coldMs`    | 60 s | 69.8 s | 82 s  | 118.8 s | 180 s  | Session start and project load              |
| `warmMs`    | 5 s  | 7 s    | 9.6 s | 17.2 s  | 30 s   | A request answered from the loaded project  |
| `projectMs` | 60 s | 69.8 s | 82 s  | 118.8 s | 180 s  | A query that walks every file on every call |

Identical for every server at a given size, as every budget here is — what varies is the corpus, not who is asking. The cap sits at 1000 rather than at 500, the largest corpus actually run: anchoring it on today's biggest size would put today's biggest run at the ceiling, and the next corpus to grow would get no more budget than the one before it.

The three classes exist because "warm" is not one thing. `references` and `rename` do cold-sized work on every call, and Volar/TNB's references@500 measured **51.13 s** on a 4-core CI runner — a warm-sized budget (17.2 s at that size) would flip that row to a timeout, and a `usable` timeout suppresses every larger size, so one harness-side overrun erases 12 of a server's 16 scale rows looking exactly like a tool failure. The ramp gives it 118.8 s, within 1% of the 120 s flat budget it replaces; that agreement is not a coincidence, since the flat value was forced by the same measurement.

The floor is set against measurement, not caution: the slowest passing ranked operation on any server outside the scale suite is 1.11 s (Volar hover, script setup, 2-core runner), so 5 s is ~4.5× measured need. What the old flat budgets actually bought was failure latency — a wedged `textDocument/completion` in vize 0.302 spent 9 minutes inside one suite (4 warm-ups × 60 s, then readiness polls at 60 s each) and took a 10-minute CI job down with it, publishing nothing and naming no server.

**Surface order matters.** `lsp` runs **last**: its hover retries and language-server churn heat the machine, so running it earlier would leave every subsequent surface measuring a warmer, more throttled box. (It ran last originally because it was also the longest surface; that is no longer true, but the thermal reason stands on its own.)

The **memory** probe stays a separate job on purpose — sampling RSS and CPU alongside timing runs would perturb the very timings it sits next to. That is isolation for a different reason than machine variance.

## Real-world corpora

Everything above measures **generated** fixtures. That corpus is designed — every body content-unique, every construct deliberate, a planted bug in a known place — and that design is what makes the work gates possible. What a designed corpus cannot do is surprise anyone.

The real-world surfaces run the toolchain against SFCs from **pinned checkouts of popular open-source Vue projects**. Fetch with `pnpm fetch:real-world`, measure with `pnpm bench:real-world`. Clones land in `fixtures/real/<id>/` (gitignored) and `fixtures/real/manifest.json` records the **resolved commit SHA** of each — that file, not the tag, is what makes a published real-world number reproducible.

### The corpora are not what the star counts suggest

Every row below was verified against the repository tree at the pinned ref, not taken from the project's README. The intuition "famous Vue UI library ⇒ thousands of SFCs" is wrong for most of the list:

| Project        | ref              | repo `.vue` | library-source `.vue` | what the rest is                                  |
| -------------- | ---------------- | ----------: | --------------------: | ------------------------------------------------- |
| Naive UI       | `v2.44.1`        |        1708 |                    ~0 | component demos; the components are `.tsx`        |
| PrimeVue       | `4.5.5`          |        2615 |               **279** | showcase/doc fragments                            |
| Vuetify        | `v4.1.6`         |        1254 |                    ~8 | the docs application; the library is `.ts`/`.tsx` |
| Quasar         | `quasar-v2.23.3` |        1383 |                    ~3 | playground app + docs examples                    |
| Element Plus   | `2.14.3`         |        1004 |               **162** | docs examples + SSR test cases                    |
| Ant Design Vue | `4.2.6`          |         733 |                    ~0 | per-component demos; 637 `.tsx` components        |
| Nuxt UI        | `v4.10.0`        |         720 |               **187** | docs app components                               |
| Vue Vben Admin | `v5.7.0`         |         650 |               **329** | app shells and playground views                   |
| Hoppscotch     | `a4395b3e` (SHA) |         365 |               **365** | all application source                            |

So three of the "obvious" component libraries contribute **no library SFCs at all**. Their `.vue` files are real, hand-written, non-trivial Vue — they are _documentation and demo_ SFCs, which skew short and template-heavy next to a library component. Both flavours are worth measuring and they are not the same thing, so every corpus carries an explicit `kind` (`library-source` / `app-source` / `docs-demo`) and the report prints it beside the numbers.

Hoppscotch is pinned to a **commit SHA**, not a tag: its newest tag (`v3.0.1`) predates the rewrite and holds 147 SFCs of 2021-era Postwoman, while `main` holds the 365-SFC application everybody means.

**Rank within a corpus, never across one.** A files/second comparison between Naive UI's 1708 demos and PrimeVue's 279 components measures the corpora.

**A corpus larger than `--file-limit` (default 200) is truncated, and every row says so.** The limit takes an **alphabetical prefix by path**, so "Naive UI, 200 SFCs" is in fact the first 200 of 1708 sorted by path. Every tool gets the identical prefix, so the comparison between tools holds; the prefix is _not_ a random sample of the project, so a coverage claim about the project does not. The provenance line now reads `200 of 1708 SFCs (alphabetical prefix, --file-limit 200)` whenever truncation happened, and the JSON records `{limit, truncated, totalAvailable}` per corpus. Raise it with `--file-limit`.

**No lockfile ⇒ the surfaces that execute the project's dependencies are unranked.** Naive UI and Ant Design Vue ship no lockfile at their pinned refs, so `pnpm install` cannot be frozen and the installed dependency set is whatever resolved on the day. `project-test`, `project-build` and `project-typecheck` run _inside_ the checkout against that set, so their timings are not reproducible and every row on them — baseline included — is **unranked** for those corpora, with the reason on the row. The corpus-copy surfaces (`compile`, `format`, `lint`, `bundle`, `hmr`) read SFC text and externalise everything else, so the project's dependency resolution cannot move their numbers and they stay ranked. This is a property of the corpus, not of any tool.

**A `node_modules` on disk is not proof of an install.** A `pnpm install` that dies partway leaves a populated but partial tree, and a partial tree resolves some imports and not others — which is exactly the input that makes a checker report a handful of diagnostics very fast and look like the best tool in the table. So a corpus counts as installed only when `node_modules` exists **and** the fetch manifest does not record a failed install; a disagreement between the two is published in the surface methodology rather than silently resolved in either direction.

**A surface that throws is published as a harness gap.** If a surface run fails outright it produces no rows, and a missing table with no explanation is the harness hiding its own failure. Such runs are recorded as `surfaceFailures` in the JSON and listed in the report's methodology notes, stating that they are failures of this harness on this machine and that nothing should be inferred about the tools that would have been measured.

### Bundle and HMR — what is actually built

Neither surface runs a project's own `pnpm build`. That measures the project's chunking, asset and prerender configuration far more than the Vue toolchain, it produces nothing comparable across bundlers, and swapping the bundler under a project's own config is usually impossible.

Instead every cell builds the **same generated app shell** over the **same corpus**, and only the two dimensions under test vary: the bundler, and the Vue plugin.

- **Module graph = the corpus.** Any specifier that does not resolve to a real file outside `node_modules` is marked **external** and left in the output, identically in every cell. So `vue`, `~/composables/x`, `@hoppscotch/data` and `~icons/lucide/check` are all external, and no cell is credited for resolving less or charged for a dependency another happened to have on disk. It also means these surfaces do **not** require the project's install to have succeeded.
- **External, not stubbed.** An ESM stub cannot satisfy `import { useFoo } from './foo'`, so a stubbing harness drops a different set of modules per bundler. An external import is implemented the same way by Rollup, Rolldown and the webpack family.
- **`minify: false`, `treeshake: false`** everywhere. Minifying folds a second, bundler-specific tool into the number; tree-shaking would reward a bundler for discarding corpus modules.

**Vite 8 _is_ the Rolldown migration** — it depends on `rolldown ~1.1`, and the standalone `rolldown-vite` package is deprecated in its favour. "Vite vs Rolldown" is therefore not a comparison you can construct by installing two Vites; the honest bundler-engine axis is **Vite 7 (Rollup) vs Vite 8 (Rolldown)**. Vite 7 is installed as the npm alias `vite7@npm:vite@7.3.6` so both majors coexist.

#### The bundler suite

Five bundlers in three families, each grouped separately:

| Bundler   | Family   | Engine   | Vue integrations                                                                |
| --------- | -------- | -------- | ------------------------------------------------------------------------------- |
| Vite 8    | vite     | Rolldown | `@vitejs/plugin-vue`, `unplugin-vue`, `@vizejs/vite-plugin`, `@verter/unplugin` |
| Vite 7    | vite     | Rollup   | same four                                                                       |
| Rolldown  | rolldown | Rolldown | `unplugin-vue`, `@verter/unplugin`                                              |
| Rspack    | webpack  | Rspack   | `vue-loader`, `unplugin-vue`, `@vizejs/rspack-plugin`, `@verter/unplugin`       |
| webpack 5 | webpack  | webpack  | `vue-loader`, `unplugin-vue`, `@verter/unplugin`                                |

The **bare Rolldown** group exists to isolate Vite itself: Vite 8 and Rolldown bundle with the same engine, so the gap between those groups is what Vite's own pipeline costs.

Two family-specific differences are inherent and stated rather than hidden:

- **The webpack family needs an explicit TypeScript transform.** Every corpus SFC is `<script setup lang="ts">`, so the script block an integration emits is TypeScript. Vite ships a transform (esbuild on 7, oxc on 8); webpack and Rspack do not, and without one every cell died on the first type annotation. Both get **swc** — Rspack's built-in `builtin:swc-loader`, webpack's via `swc-loader` — with identical options, so the TS cost is a constant across the cells being compared. It does mean webpack-family rows include a step the Vite rows get internally.
- **The webpack family emits CommonJS.** The Vue integrations there produce helper imports that do not survive webpack's strict ESM linking. Output format is not what is being measured; it only has to be the same for every cell in the family.

#### Impartiality: baseline is not favourite

`@vitejs/plugin-vue` (Vite family) and `vue-loader` (webpack family) are the **baselines** — the reference each group is read against, because they are what the ecosystem actually ships on. Baseline does not mean protected. They are gated, bracketed and failed on precisely the same terms as everything else, and the codegen validity gate has bracketed the official `@vue/compiler-sfc` on real-world input before now.

Vize and Verter are under heavy active development and **are expected to fail cases**. That expectation changes nothing about how a failure is recorded: the module and the diagnostic, verbatim, with no softening and no editorialising. A note may explain _what_ a tool does differently — Vize front-loads compilation into a plugin-init batch, and a reader needs to know that to interpret the row — but a note must never argue that a slow or failing row should be read charitably.

Three rules keep this honest, and all three cut in every direction:

1. **A tool the harness could not exercise gets no number, and the harness says the gap is its own.** Applied to the `unplugin` rows on the webpack family (which includes the _official_ `unplugin-vue`), and to the Vite 7 HMR rows.
2. **A tool whose output was never checked is annotated as unchecked, not treated as passing.** A codegen gate that could not run, or that was never registered for a package, now prints `ⓘ CODEGEN VALIDITY GATE NOT RUN` on that row. Before, such a row was indistinguishable from one that had genuinely passed — silently favouring whichever tool the harness had failed to gate.
3. **A harness bug that penalises a tool is a harness bug, and is fixed even when the tool it was penalising is the official one.** The gate called `compileScript` unconditionally, which throws on a template-only SFC — valid Vue that the generated fixtures happen never to contain. On Hoppscotch it bracketed `@vue/compiler-sfc` 3.5 _and_ 3.6 for a file they compile correctly. Fixed by gating what each tool actually emits. The same fix was checked against the other compilers: their gate paths take the whole SFC in one call and handle template-only internally, so there was no equivalent flaw to correct.

#### A cell that never ran is not a cell that failed

The surface distinguishes two failure modes, because conflating them publishes false verdicts. Which one applies is decided on the **transform census the driver recorded before it threw** — how many corpus SFCs actually reached the Vue transform — never on the wording of the error:

- **❌ BUILD FAILED** — corpus SFCs were compiled and then the build failed, so the integration's own output is implicated. A finding about the tool. `@verter/unplugin` is here on Hoppscotch: it emits `_createBlock(_resolveDynamicComponent(…), _ key: 1, …)`, missing the props object literal, in `components/app/KernelInterceptor.vue`.
- **⏭ NOT MEASURED** — the build failed before the Vue transform processed a single corpus SFC. A gap in this harness's wiring for that (integration × bundler) pair and a plugin that throws during initialisation look **identical** from here, so no number and no verdict is published either way, and the row says the ambiguity is the harness's. Currently the `unplugin`-based integrations on the webpack family are in this state; `vue-loader` is wired and passing, so each webpack-family group still has its reference row.

The earlier version of this test searched the error text for `?vue` or `type=script|template`, on the theory that a genuine codegen defect fails inside a Vue sub-request. **Only `vue-loader` emits that query shape.** The unplugin-based integrations name their sub-requests differently, so _their_ codegen bugs matched the "harness gap" branch and were published as ⏭ NOT MEASURED — the harness apologising for a bug in a tool. A classification that depends on how an integration happens to name its sub-requests cannot be a fair test of any of them; a count of SFCs that reached a transform is the same measurement for all of them.

The rule generalises: **when the harness cannot exercise a tool, it publishes no number and says the gap is its own.** The HMR surface applies the same rule to its Vite 7 rows.

#### Corpus-compile gate

One untimed build per cell counts how many corpus SFCs reached a transform. A cell reaching fewer than the best cell **in its own bundler group** is measured but **unranked** — a build that compiled a third of the corpus is not a faster build.

The peer anchor is keyed on the **bundler id**, which is the same key the report groups and ranks by. Keying it on the _family_ let Vite 7 and Vite 8 anchor each other: a Vite 7 cell could be unranked for compiling less than the same integration under Vite 8 — a table it is never compared in — and a Vite 8 cell could be excused by a Vite 7 peer nobody was reading.

There is a second anchor, the **corpus** itself, because the peer anchor is tautological for a lone survivor:

- A bundler with **one** surviving cell has that cell as its own "best", so it passes the peer test at any coverage at all — a cell compiling 3 of 200 SFCs ranked first in its group unchallenged. Such a cell is unranked unless it cleared the whole corpus: with no peer there is nothing to show whether the missing files are unreachable in this corpus or were skipped by that integration. If it did clear the corpus it is ranked and labelled as the only row that ran, so its 1.00× is not read as beating a reference implementation that is absent.
- Where **every** surviving cell reached the same count and that count is below the corpus, the rows are ranked and the shortfall is disclosed on each: it is common to every cell, so it is unreachable code in this corpus rather than a fault of any integration.

The count is keyed on the **source SFC**, not the intermediate module id, because plugins rename them. This is not hypothetical twice over: a `.vue`-only counting rule scored `@vizejs/vite-plugin` 0/40 on a build that had in fact compiled all 40 (it hands the bundler `App.vue.ts` sidecars), and an over-strict resolver rule made that same plugin emit 3.7 kB in 28 ms against the 207 kB every other cell produced — a 12× "win" for compiling nothing. Nothing in the wall clock said so; the census did.

#### HMR

Measured in two parts, because they are different costs: **dev cold start** (`createServer` + `listen` + serving the entry) is paid once per session, **update turnaround** is paid on every save. Do not compare a row across the two tables.

- The change is written to disk and then handed to the watcher directly. Waiting for chokidar folds the OS file-watch debounce — platform-dependent, unrelated to any tool here — into every row.
- The edit goes in the `<template>` block. A `<script setup>` edit makes Vue issue a full page reload instead of a hot update, which is a different and cheaper server path; a cell that full-reloads is measured and **unranked** for that reason.
- Vize pre-compiles the whole corpus at plugin-init, so its cold-start row carries work the lazy plugins defer to first request. That trade-off is why both tables exist.
- **Vite-family only.** Webpack and Rspack implement HMR with a different protocol and a different unit of work (an incremental chunk, not a re-transformed module). Those rows are absent rather than approximated.
- There is no browser executing the app, so no client-side `import.meta.hot.accept` handler is ever registered. Whether the server still announces an update in that state depends on the Vite major — Vite 8 answers for all four plugins, Vite 7 answers only for `@vizejs/vite-plugin`. Rows where nothing arrived are marked **⏭ NOT MEASURED**: that is the harness declining to publish a number, not evidence that a plugin lacks HMR support.
- **The two tables are gated independently.** They were not: any failure in the HMR round trip skipped that cell's _cold-start_ row as well, discarding a measurement that had already succeeded — the server started and the entry transformed, which is the whole of what cold start measures. Because the probe limitation above is Vite-major-specific, that deleted three plugins' cold-start rows on Vite 7 and left the fourth's standing at 1.00× against nothing. A failed HMR probe now costs only the HMR row.
- **A table whose baseline row is not ranked cannot become a candidate-only ranking.** Ranking happens per bundler, so if `@vitejs/plugin-vue`, `vue-loader`, or the declared bare-Rolldown reference is skipped, errored or bracketed, every surviving candidate time stays visible but is unranked. The harness never replaces an absent Vue reference with whichever candidate happened to be fastest.

### Project test suite (`project-test`)

The bundle surface asks whether an SFC can be **resolved and transformed**. This one asks whether the compiled component actually **works**: it runs a project's own Vitest suite, which mounts and renders the components and asserts on the output. That catches codegen which parses perfectly and behaves wrongly — a class of defect no build surface can reach — and it is the only surface that answers the practical question of whether dropping Vize or Verter into a real project leaves it working.

It is also the only real-world surface that **writes into the checkout**, because running a project's own suite means running inside it. One namespaced config file per challenger is written into the target package and removed in a `finally`; the clone is pinned, so residue from a hard kill clears with `pnpm fetch:real-world --force`.

**Targets are discovered, not listed.** A hard-coded "run this script in this directory" registry goes stale the moment a project reorganises, and a stale entry produces a skipped row that reads like a tool result. Discovery requires a package with `vitest` as a dependency _and_ a non-watch script that actually invokes `vitest` — matched on the script body, because a `test` script that shells out to Playwright or jest is not something a Vue plugin can be swapped into. Layout is genuinely irregular: Hoppscotch's `hoppscotch-common` has `vitest.config.mts` and a `do-test` script but no `vite.config` at all, and its build lives in a sibling package.

**Baseline is the project's own toolchain, unmodified** — `@vitejs/plugin-vue` for every project in the registry. Baseline means the reference the other rows are read against, not a protected row: it is gated on tests-executed exactly like every challenger, and if the project's suite fails on this machine, that is what the row says.

Each row states which **swap mechanism** produced it:

| Mechanism  | How                                                                                                                                                                                     | Status               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `none`     | the suite run unmodified                                                                                                                                                                | baseline             |
| `override` | a generated config imports the project's real Vitest config, resolves it (it may be an object, a function, or a promise) and replaces **only** the plugin named `vite:vue`              | preferred, wired     |
| `alias`    | a Node **resolution hook** (`NODE_OPTIONS=--import`) redirects every import of `@vitejs/plugin-vue` to the challenger, so a config that cannot be imported or edited picks it up anyway | wired; fallback only |

The override throws rather than proceeding if it cannot find `vite:vue`. Adding the challenger beside the original would leave two Vue plugins both compiling every SFC — which still produces a number, and the number would be meaningless. The replacement goes in at the **original plugin's index**, not at the front of the array: Vite runs plugins in order, and hoisting the Vue plugin above a project's svg-loader, i18n plugin or macro transform would change which of them sees an `.vue` file first, making the swap a two-variable change.

The base config is resolved with the **same `ConfigEnv` the timed tool uses** — `{command:'serve', mode:'test'}` for `project-test`, `{command:'build', mode:'production'}` for `project-build`. A function-form config branches on it, so a shared hardcoded value (which is what this used to have) resolved the challengers' config in build mode while the baseline `vitest run` resolved it in serve/test mode: a different plugin list and different aliases, with nothing in the output to show it. The parameter is required, with no default, because the wrong value is invisible.

**Known inequality, published on every `override` row.** The project calls `vue({…})` with plugin-vue-specific options — `include`, `script.defineModel`, `template.compilerOptions`, `features` — and those are baked into the plugin _instance_, which exposes no way to read them back out. The substitution therefore constructs the challenger with **no options at all**, while the baseline keeps every one of the project's. That is not a neutral difference: an option the project set could make the baseline do more work (an extra template transform) or less (a narrower `include`). Neither direction is measured, so it is **not** claimed to cancel out — every row generated this way carries the disclosure.

**The alias fallback, and why it is a fallback.** Where a target has no importable config there is no `plugins` array to substitute into, so the swap moves to the only remaining seam: the point where the project's own code asks Node for `@vitejs/plugin-vue`. The timed process runs with `NODE_OPTIONS=--import` pointing at a loader that installs a `resolve` hook redirecting that specifier to the challenger's module. No dependency override, no reinstall, and nothing written into the checkout. `override` is still preferred whenever it is available, because it changes exactly one entry of one array while this changes what a specifier means for the whole process.

Two facts ride on every `alias` row, and the second one is the reason the mechanism is safe to ship at all.

- **⚠ Not equal work, in the opposite direction to `override`.** The project's own `vue({…})` options **do** reach the challenger here. A challenger that does not understand plugin-vue's option shape can therefore fail on the _options_ rather than on the SFCs, and an option-shape mismatch and a real incompatibility are hard to tell apart from the outside. This surface does not tell them apart, and the row says so.
- **The redirect is verified, not assumed.** The hook appends one line per redirect to a marker file, and a row whose marker records **no** redirect is published as **⏭ NOT MEASURED**. A hook that matched nothing leaves the project running its own `@vitejs/plugin-vue` end to end: the run succeeds, the timings look ordinary, and the baseline's number would be published under a challenger's name with nothing in the output to distinguish it. That is the worst failure available on these surfaces and the only one that cannot be spotted after the fact. Every measured run must have fired, not merely one — a series in which the redirect happened once is a series of mixed toolchains.

The hook's _reach_ was measured rather than reasoned about, and the first version of it was wrong in exactly the way the marker gate exists to catch. Matching only the bare specifier and its subpaths intercepted `import("@vitejs/plugin-vue")` perfectly and intercepted a real `vite build` **not at all**: Vite bundles the config file and resolves its externalised imports to absolute paths before evaluating it, so by the time Node is asked for the module the specifier is a `file:` URL in which the package name is only a path segment. The marker stayed empty, the project's own plugin compiled every SFC, and the row was withdrawn rather than published. The rule now matches the resolved path segment as well, and `module.registerHooks()` is used rather than the off-thread `module.register()` so the hook also covers `require`. Verified end to end on a real `vite build` and a real `vitest run`: the redirect fires, the substituted plugin is constructed **with the project's own `vue({include: […]})` options**, and the emitted bundle contains the substitute's output rather than the baseline compiler's.

**Test-count gate — on tests PASSED, not tests collected.** A challenger that passes fewer tests than the baseline is **unranked**, as is one that produced no test census at all or exited non-zero having passed nothing. Two bugs made this the load-bearing paragraph it is:

- The gate read tests _collected_. A toolchain whose codegen mounts a broken component still collects every test and then fails them, so a red suite cleared a collection gate — while the artifact column published `testsPassed`, meaning the table showed one number and the ranking decision was made on another. One quantity now serves both.
- `parseVitestSummary` treated _either_ summary total as a successful parse. When every test file fails to collect, Vitest prints `Test Files 3 failed (3)` and `Tests no tests` — a file total, no test total. That parsed "successfully" with `tests: null`, the row was recorded `ok`, and the gate `continue`d over the null: a run that executed **zero tests** was published as the fastest row in the table. A missing test total is now a parse failure, so such a run is a visible ❌.

Tests that _fail_ under a challenger while the baseline passes them are reported as a correctness finding about that tool. The gate decides ranking, on passes; the failure count is published next to the row so the reader sees both. The note is worded as a fact and deliberately does not argue that a failing row should stay in the ranking.

Where the baseline produced no census to compare against, challenger timings remain visible but are **unranked** as `TEST-COUNT GATE UNKNOWN`. An absent reference never turns the table into a candidate-only `vs fastest` comparison.

### Project build, own config (`project-build`)

`bundle` holds the module graph identical while the bundler _and_ the plugin vary — that is what makes a Rollup number comparable to a webpack number. What it cannot tell you is what a **real** build costs, because the generated shell deliberately excludes dependency pre-bundling, chunk splitting across a genuine dependency tree, CSS extraction across a design system, asset pipelines, and the project's own plugin stack.

This surface keeps all of it. It runs the project's own `vite build` with the project's own `vite.config`, and varies exactly one thing: which plugin compiles the SFCs. The bundler is fixed, because the project's config chose it.

- Read `bundle` for _which implementation is faster on equal terms_.
- Read `project-build` for _what swapping this would cost me in my app_.

Neither supersedes the other and they are not comparable to each other.

**Only reliably swappable targets are measured**: a literal `vite build` script, an importable `vite.config`, and SFCs beneath it. Excluded by construction — `nuxt build` and `quasar build` generate their Vite config at runtime, so there is no `plugins` array to substitute into; workspace fan-out scripts (`pnpm -r`, `turbo run`) would time packages containing no Vue. Fewer packages measured truthfully beats every package measured approximately.

Every build, baseline included, is redirected with `--outDir` into the work tree, so the project's own `dist/` is never written and no run can leave the checkout in a state that changes the next one.

**Output-size gate.** A challenger emitting more than 5% fewer bytes than the baseline is **unranked**: a build that emits materially less is not a faster build until the difference is explained. The tolerance absorbs legitimate codegen differences (helper naming, hoisting choices), not a dropped chunk. Emitting materially _more_ is annotated rather than gated — more output is not cheating, but it changes what shipped. Where the baseline is invalid or produced no output census, challenger timings remain visible but are **unranked**; the harness does not substitute a candidate-only baseline.

#### Baseline pre-flight: a broken target is not three tool failures

Before anything is measured, each candidate's **own** build is run untimed, and only a candidate that genuinely builds is measured. Candidates are tried in order; what was rejected, and why, is printed in the surface methodology.

This exists because of a concrete failure. Hoppscotch's `hoppscotch-sh-admin` passes every static check — literal `vite build`, real `vite.config.ts`, 56 SFCs — and still cannot build, because it imports `src/helpers/backend/graphql`, a GraphQL-codegen artifact. Without the pre-flight the surface published **four ❌ rows including the baseline**, which reads as "all three challengers failed" when in fact nothing could build. On Hoppscotch the surface now measures `hoppscotch-agent` and states that `hoppscotch-sh-admin` and `hoppscotch-desktop` were rejected first.

That codegen cannot simply be run either: its `gql-codegen.yml` reads the schema from `../../gql-gen/*.gql`, which Hoppscotch emits by running its NestJS backend. So the package is genuinely not "easy and reliable" to build, and no `prepare` hook fixes it without standing up a server. The honest cost is a thinner target (3 SFCs rather than 56) — stated, rather than papered over with a number that would have been meaningless.

#### Two harness bugs this surface produced, both fixed

Recorded because both were the kind that publish a plausible wrong answer rather than crashing:

- **Target chosen by name.** `project-test` first sorted candidates alphabetically and picked Hoppscotch's `packages/hoppscotch-cli` — which contains **no Vue at all** — over `packages/hoppscotch-common` and its 293 SFCs, then reported the resulting "no `vite:vue` plugin found" as a failure of all three challengers. Targets are now ranked by SFC count, and a target with zero SFCs is not a candidate.
- **Diagnostic extraction ate characters.** A hand-escaped ANSI-stripping regex collapsed to one matching a bare `m`, silently deleting characters from the very error messages the reports quote verbatim; a sibling bug reported Vite's `transforming...` progress spinner as the cause of every build failure. Both now go through [`ansi.mjs`](../scripts/lib/real-world/ansi.mjs) and an ordered pattern list, with tests pinning that `stripAnsi("module failed")` is unchanged.

### Project typecheck, own tsconfig (`project-typecheck`)

Typechecking a corpus **lifted** out of a monorepo is not offered, and never will be: `~/composables/x` and `@hoppscotch/data` are meaningless outside the project's own alias configuration, so a checker pointed at the lifted copy reports thousands of TS2307s — or, if the tsconfig is wrong the other way, **zero diagnostics very quickly**, which in a table is indistinguishable from a fast, correct checker. `prepareTypecheckDir` refuses the same thing on the generated path.

Running **in place** fixes that, and that is what this surface does: the project's own `tsconfig.json`, its own `paths`, its own installed `node_modules`, in the package with the most SFCs beneath it. It reads the checkout and never writes to it.

| Row                | What it is                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `vue-tsc` **(JS)** | the official Vue Language Tools CLI on the stock JavaScript TypeScript compiler. **Baseline.**             |
| `vue-tsc (N)`      | the _same_ vue-tsc with `typescript` aliased to typescript-native-bridge, so the engine is tsgo in-process |
| `verter-tsc`       | Verter's checker on stable tsgo                                                                            |
| `Vize`             | `vize check --tsconfig …`, native, Corsa when available                                                    |

**Engines are grouped, not just tagged** — deliberately unlike the generated-corpus `typecheck` surface above, which keeps both engines in one table behind the `(JS)` tag. Here the rows are ranked in **separate tables**, because a ratio across them measures TypeScript's own Go rewrite at least as much as the Vue tooling on top of it — and the `vue-tsc` (JS) / `vue-tsc (N)` pair, identical but for the engine, is what lets a reader see how much of any gap is which. The engine tag comes from the canonical `engine: "tsc-js"` value the report's `engineTag()` keys on; the row's _label_ must not also spell "(JS)", or a non-canonical engine string leaves the row untagged and reading as another native checker.

**Diagnostics are a census, not a pass/fail.** Real projects are not clean at their pinned release, a checker is not wrong for saying so, and a non-zero exit is expected and allowed for every row equally. The counts are published on every row (with `artifactPolarity: informational`, so the renderer's generic "produced less than the largest artifact" warning does not scold the _quietest_ checker). Diagnostic equivalence is **not** asserted.

Five gates, applied to every applicable row including the baseline's. The
entrypoint plants run only after all timings and are persisted with a stable
suite version/hash; the target pre-flight necessarily remains before timing
because it decides whether there is a usable project at all:

- **Baseline pre-flight (untimed).** The baseline typechecks each candidate package before anything is measured, and a target is measured only if that produced diagnostics across more than one file, or exited clean. A target the baseline merely _aborts_ on publishes no rows at all. Not hypothetical: Hoppscotch's `hoppscotch-common` ships a committed `src/types/post-request.d.ts` with a syntax error at line 1294, and vue-tsc reports exactly that one TS1128 after ~4.3 s having checked **none** of the 293 SFCs. Anchoring a census on that inverts the gate — it marks the checkers that actually completed as the outliers.
- **Program construction, per measured run.** The same `actuallyChecked` test is applied to every timed run: exit 0, or diagnostics spanning at least two files. It was previously defined, documented, and called only in the pre-flight — so a checker whose _measured_ runs aborted during program construction published a fast, ranked row, gated on a census it satisfied with the single diagnostic that stopped it.
- **TNB activation.** The native row is unranked unless the bridge printed its activation banner on **every** measured run. With `.some()`, a series in which the bridge loaded once and silently fell back to the JavaScript checker four times passed — publishing a JS-engine measurement under a native-engine label, the exact mislabel the gate exists to prevent.
- **Diagnostic census.** A checker reporting under half the baseline's diagnostics is unranked: it may be skipping files or not checking templates, and doing less finishes sooner. Reporting materially _more_ is annotated, not gated — stricter is legitimate. When the baseline reports **zero** diagnostics and exits clean, the ratio test cannot fire at all (`diags < 0 × 0.5` is never true), so on the one corpus state where "reported nothing" is easiest to achieve by not checking, every row used to pass by default; the gate instead requires the row to exit 0 as well. Reporting nothing while failing is not a clean pass.
- **Exact-entrypoint capability plants (post-timing).** Each CLI/configuration must independently detect a script assignment mismatch, a native-template prop mismatch and a template event-handler mismatch. A failure leaves the time visible but unranked; if the official native Vue reference fails, the native comparison class cannot rank. This certifies the entrypoint's basic Vue checking capability, not diagnostic equivalence on third-party code, which remains explicitly unknown.

**Diagnostic counting covers every output shape, with one shared pattern list.** `vue-tsc`/`verter-tsc`/tsgo write `File.vue(3,7): error TS2322:` (or the pretty `File.vue:3:7 - error TS2322:`); `vize check` prints the path once as a heading and indents `error:1:14 [TS2322] …` beneath it, never writing the literal `error TS1234`. An `/error TS\d+/` counter scored Vize **zero** on output where it had just reported real diagnostics — and a zero here is not harmless, because the census gate unranks a row reporting far fewer than the baseline. Mis-parsing a tool's output would bracket that tool for the harness's inability to read it, so the shapes are handled together and the file a diagnostic belongs to is taken from the heading when the line does not carry one.

**Invocation is made as close as the tools allow, and the residual difference is stated.** The tsc-family rows run `--noEmit -p tsconfig.json`. Vize is invoked with **no path pattern**, because it documents that omitting patterns uses the tsconfig's `include`/`exclude`/`files` — the closest analogue of `-p`. Passing `.` (as an earlier revision did) made Vize walk the package directory instead, checking a different file set in an unmeasured direction: on `hoppscotch-desktop` that is 37 files against the tsconfig's 31. Vize still builds its own virtual project rather than a TypeScript program, so identical file sets are **not** asserted; the diagnostic census is what would expose a materially smaller one.

### Project component-meta, own tsconfig (`project-component-meta`)

Extracting component metadata from a **lifted** corpus is refused for the same reason typechecking one is: a metadata extractor whose imports do not resolve does not fail, it returns components with no props, very fast — and in a table that is indistinguishable from a fast, thorough extractor. This surface runs in place, in the package with the most SFCs beneath it, against the project's own `tsconfig.json` and its own installed `node_modules`. It reads the checkout and never writes to it.

| Row                      | What it is                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vue-component-meta`     | official `createChecker(tsconfig)` + `getComponentMeta`. **Baseline.**                                                                                                      |
| `@verter/component-meta` | Verter's published `openComponentMetaSession({root, tsconfig})` + `getComponentMeta`                                                                                        |
| Vize                     | no row. The surface **checks** `@vizejs/native` for a metadata API at runtime and reports what it found; declaration emit is a different job and is not substituted for one |

The component set is the **resolved corpus restricted to the target package**, not a private walk, so `--file-limit` and its truncation disclosure apply here exactly as everywhere else. A private walk would quietly measure a different file set from the one the corpus line names.

**Baseline pre-flight.** Each candidate target is probed untimed: the baseline must build a checker, resolve components from a bounded sample, and find declared props on some of them. A target it cannot read publishes **no rows at all** — every other row would be gated against a reference that did no work, which marks the tools that _did_ extract metadata as the anomalies.

Three gates:

- **Metadata census.** A row that resolved metadata for fewer components than the baseline is unranked, and so is a row that resolved none — including the baseline's own row, gated identically. Returning `{}` is the fastest thing a metadata extractor can do, and it is the trivial way to win this surface.
- **Prop coverage.** A row reporting **zero props** for a component that declares props is unranked. This is the gate that catches an empty answer hiding behind a healthy-looking component count.
- **Member totals are reported, never gated.** props + events + slots is published beside the times and no threshold is applied to it.

The prop-coverage anchor is the part worth reading twice, because the obvious version of it was unfair and measurement caught it. Anchoring on "the baseline found props here" brackets a tool for a **schema disagreement**: on Hoppscotch's first 25 SFCs, `vue-component-meta` reports props for 25 of 25 while only 18 contain a `defineProps`, because it also reports the implicit and inherited instance surface — so `@verter/component-meta`, which reports props on exactly those 18, was unranked for reporting the declared API. The anchor is therefore the **intersection** of "the source declares props" (read off the SFC text, tool-independent) and "the baseline found props". The claim the gate then makes is one no reasonable reading disputes: this component declares props, the reference tool found them, and you reported none.

Metadata **equivalence is not asserted**, and correctness is not checked against the third-party sources — nobody has written down the right answer for these components. This is a throughput surface with a coverage census.

### Project LSP, project as workspace (`project-lsp`)

The generated-corpus `lsp` surface uses a tiny synthetic workspace with a planted marker, which is what makes its hover gate possible — the correct answer is written down. It is also a poor model of an editor session, because the expensive part of a real one is **loading a real project**. This surface keeps that cost: the workspace root is the project package with the most SFCs and its own `tsconfig.json`, the document opened is one of the project's own SFCs, and every server gets the same directory, file and position.

| Row                       | What it is                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `Volar` **(JS)**          | `@vue/language-server` v3 with the stock JavaScript TypeScript tsdk. **Baseline.**       |
| `Volar (TNB / tsgo tsdk)` | the _same_ Volar with its TypeScript half on typescript-native-bridge                    |
| `Verter LSP`              | `verter-lsp`, the native server from the published npm package                           |
| `Vize LSP`                | `vize lsp --stdio` (native server when found, Node entry otherwise — the row says which) |

Both Volar rows are measured as the **two-process product v3 is**: `@vue/language-server` plus `typescript-language-server` with `@vue/typescript-plugin`, joined by the tsserver bridge, the same `.vue` buffer synced to both, each feature asked of both in parallel with the **slower half charged**, and both processes' startup and project load inside the timings.

**Two operations, ranked separately and never pooled** — `didOpen → diagnostics` (cold: the server must load the real project before it can say anything) and `hover` (warm, median of 3, document already open). Each is measured in its **own fresh session**, so the hover row is not credited with a project load the diagnostics row already paid for, and tool-order rotation applies to each operation independently. Within an operation the rows are split again by **TypeScript engine**, for the reason `project-typecheck` splits them: a JS-vs-tsgo ratio measures TypeScript's own Go rewrite at least as much as the Vue layer above it.

**Content gates, and the one claim this surface refuses to make.** There is no planted marker in third-party source, so nobody knows what the right answer is. What can still be established is that a server _answered_:

- **Hover** — the payload must be non-empty on every measured run, at the **single position an untimed baseline pre-flight established the reference server answers at**. Choosing the position any other way would make the gate a test of the harness's cursor placement: a position on whitespace or in a comment would unrank every row alike and read as four broken servers.
- **Diagnostics** — a run that never published diagnostics for the opened document is an ❌ error, not a fast row; there is no latency to report. Where the baseline published at least one diagnostic, a row publishing none on every run is unranked. Where the baseline published an **empty list** — a legitimate answer, but not an anchor — the gate cannot fire and the row says so rather than rendering as though it had passed.

⚠ **Not equal work on the diagnostics operation, and the direction is known.** `publishDiagnostics` from the Volar rows carries what the _Vue_ server computes. Volar v3 delegates TypeScript to a separate tsserver that speaks the **tsserver protocol**, not LSP, so TypeScript diagnostics reach a real editor through the extension and are **not** in that notification — while a single-process server publishes its Vue and TypeScript diagnostics together in one message. The Volar diagnostics rows are therefore answering a **narrower question**, and a narrower question is answered faster. The count is published on every row so the difference is visible rather than inferred, and the gate is deliberately **one-directional** — it fails a row for publishing _nothing_, never for publishing _fewer_ — so it cannot punish a server for the broader answer. The hover operation has no such asymmetry: both Volar halves are asked in parallel and the slower is charged.

⚠ **Correctness of the content is NOT asserted for third-party code.** This surface establishes that a server produced an answer where the reference server produced one, and nothing more. Content correctness is gated on the generated corpus (`lsp`), against a symbol whose type is known.

A degraded type backend is detected from stderr and reported on any row, ranked or not (Vize logs a failed Corsa spawn; Verter logs verter-only mode). It is reported rather than used to fail a row on its own — the content gates decide ranking, and this is the explanation for the number in either direction.

### Surfaces deliberately not run on real-world corpora

`typecheck`, `component-meta` and `lsp` stay refused on a **lifted** corpus, and asking for one by name prints the reason and points at the in-place surface instead. A corpus pulled out of a monorepo resolves none of its imports — `~/composables/x`, `@hoppscotch/data` and `~icons/lucide/check` are meaningless outside the project's own alias configuration — so a checker reports thousands of TS2307s, or, if the tsconfig is wrong the other way, nothing at all very quickly.

They are not _absent_, though: `project-typecheck`, `project-component-meta` and `project-lsp` are the versions of those three measurements worth publishing, and all three run in the checkout against the project's own tsconfig. The lifted names are kept as refusals rather than quietly redirected, because "typecheck on a lifted corpus" and `project-typecheck` are different measurements and a reader asking for one must not be handed the other.

### What real-world runs are for

They find things a generated corpus cannot. The first run of the bundle surface against Hoppscotch caught `@verter/unplugin` emitting syntactically invalid JavaScript for a `v-if` on a dynamic component (`_createBlock(_resolveDynamicComponent(…), _ key: 1, …)` — the props object literal is missing), in `packages/hoppscotch-common/src/components/app/KernelInterceptor.vue`. No generated fixture resembles that file. Treat a failure here as a finding about the tool, and a speed number here as secondary to `fixtures/N`.

## CI layout

| Workflow                                                                  | When                         | What                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test** (`.github/workflows/test.yml`)                                   | pull_request, `main` push    | `tests/harness/run.mjs` + `tests/confirm/run.mjs`. Install only, no fixtures. **Publishes nothing.**                                                                                                                                                                                |
| **PR** (`.github/workflows/pr.yml`)                                       | pull_request                 | **Smoke only**: build (install + `fixtures/20`) → one throughput pass over every surface at `--runs 1 --warmups 0`. **No** `pnpm confirm` (that runs in `test.yml` on the same event — see [`pr.yml`](../.github/workflows/pr.yml) L92), **no** full bench, **no** README rewrite.  |
| **Benchmark** (`.github/workflows/benchmark.yml`)                         | `workflow_dispatch` **only** | build → **bench** + **ide** + **ide-scale** + **memory** + **confirm** → publish `README.md` + the generated pages under `docs/` (per-group results, memory, plant matrix). The only workflow that commits.                                                                                    |
| **Benchmark (real-world)** (`.github/workflows/benchmark-real-world.yml`) | `workflow_dispatch` **only** | Matrix of **one job per project**: clone at the pinned ref → install → `compile,format,lint,bundle,hmr,project-test,project-build,project-typecheck` for every tool on that one runner → `README.md` real-world section. `fail-fast: false`; the clone is cached on the pinned ref. |
| **E2E VS Code** (`.github/workflows/e2e-vscode.yml`)                      | `workflow_dispatch` **only** | Heavy extension-host path (optional). No schedule.                                                                                                                                                                                                                                  |

**All workflows run on `ubuntu-latest`.** One runner class for everything — measurement, correctness and E2E. Platform-specific breakage (Windows file locks, `.cmd` shims, path handling) is consequently **not covered by CI**; run `pnpm confirm` and `pnpm test:harness` locally on macOS/Windows if you need that signal.

**Benchmarks do not run on push or pull request, and there is no schedule.** The reason is not cost — the whole measurement is ~16 minutes of runner time across four jobs (`bench` 4.2 min, `memory` 4.8 min, `ide` 3.2 min, `ide-scale` 3.6 min, each capped at 10). It is that a published number should be traceable to a person who asked for it, and a cron that silently rewrites the README on a runner nobody was watching is the opposite of that. Validation on PR/push is `test.yml`; measurement is a deliberate manual dispatch.

Doc updates follow the [rolldown/benchmarks](https://github.com/rolldown/benchmarks) pattern:

1. Measure on a single Linux runner; upload `results/*` artifacts.
2. On a `main` dispatch, a final job downloads artifacts, snapshots the JSON into `results/benchmarks/`, runs `scripts/generate-docs.mjs`, and **auto-commits** `README.md` + `docs/` with `[skip ci]`.

A section whose artifacts are missing — because its job failed, or was not part of the run — is **left exactly as published**. It is never replaced with a "no artifacts" placeholder, so a partial run can never erase good results and commit the erasure.

Published resource numbers: **[docs/memory.md](memory.md)**.

## Methodology

1. Generate unique-content `.vue` SFCs (`scripts/generate.mjs` — diverse templates + uniquify) **once** in the build job.
2. For each surface, run every available tool on the **same** corpus, discarding ≥1 warmup pass per tool and **rotating tool order** on every pass.
3. Rank by the median of the measured runs, one table per surface unless the surface declares explicit work-equivalence classes (compile does); report min / stddev / CV% alongside.
4. On `main`, merge markdown artifacts into the README results section.

Each report includes methodology notes (`scripts/lib/report.mjs`).

## Quick start

```bash
# Node 22+
corepack enable
pnpm install

# Generate fixtures (50 / 200 / 1000 SFCs by default)
pnpm generate

# Full local bench (default fixture fixtures/200)
pnpm bench

# Fewer / more measured runs (warmup is always applied)
pnpm bench:quick
pnpm bench:deep

# Memory probe (separate process per tool — not mixed with timing runs)
pnpm bench:memory:small
pnpm bench:memory

# Small smoke (what PRs run for throughput, plus pnpm confirm)
pnpm smoke
pnpm confirm

# Single surface
pnpm bench:compile
pnpm bench:jsx-compile
pnpm bench:lint
pnpm bench:typecheck
pnpm bench:format
pnpm bench:component-meta
pnpm bench:lsp

# VS Code headless E2E (downloads VS Code stable; installs subject extensions in isolation)
pnpm e2e:setup                 # regular + monorepo workspaces
pnpm e2e:vscode                # Volar + Vize + Verter × regular/monorepo
# Optional real project (clone pinned Nuxt UI + install):
pnpm e2e:setup:nuxt-ui
pnpm e2e:vscode:full
# Marketplace defaults: Vue.volar, ubugeeei.vize, verter.verter-vscode
# Optional local Verter build: --verter-vsix path/to/verter.vsix

# Compile matrix subsets
node scripts/bench.mjs --surfaces compile --compile-targets vapor --compile-envs production,development
node scripts/bench.mjs --surfaces compile --compile-targets vdom --compile-envs production

# Repeated-input corpus study (NOT for ranking or described as an output-cache hit)
pnpm bench:compile:repeated
```

### Useful flags

```bash
node scripts/bench.mjs \
  --fixture fixtures/1000 \
  --surfaces compile,lint,typecheck,format \
  --compile-targets vdom,vapor \
  --compile-envs production,development \
  --runs 5 \
  --warmups 1 \
  --check-file-limit 200 \
  --meta-file-limit 100 \
  --json results/local.json \
  --out results/local.md
```

## Repository layout

```
scripts/
  generate.mjs              # fixture generator
  bench.mjs                 # throughput orchestrator (compile … lsp)
  ide-bench.mjs             # per-operation IDE orchestrator (its own surface)
  bench-memory.mjs          # resource probe orchestrator
  memory-worker.mjs         # one isolated child per tool, for the probe
  bench-compile-single.mjs  # tinybench size-ladder microbench
  publish-ci-results.mjs    # snapshot CI JSON into results/benchmarks + real_world
  generate-docs.mjs         # README blocks + docs/ from results JSON
  e2e-vscode/               # headless extension-host runner
  lib/
    surfaces/               # compile, jsx-compile, typecheck, format, lint, meta, lsp
    ide-ops/                # IDE surface: server registry, workspace, and
      suites/               #   background, completion, edit-loop, navigation, scale, smoke
    report.mjs              # timing report rendering
    ide-report.mjs          # IDE report rendering (ranked per operation)
    tnb.mjs                 # typescript-native-bridge discovery + activation gate
    work-gate.mjs           # planted-bug gates that decide ranked vs bracketed
envs/tnb/                   # isolated vue-tsc-on-tsgo install (never a root override)
tests/harness/              # self-tests of the benchmark machinery (tracked)
tests/confirm/              # correctness plants + known-failures.json (tracked)
fixtures/                   # generated corpora (gitignored)
work/                       # ephemeral copies (gitignored)
results/                    # local + CI reports — see results/README.md.
                            #   benchmarks/ + real_world/ are the latest Linux
                            #   snapshot (committed); everything else is gitignored
.github/workflows/
  test.yml                  # harness + confirm on PR / main push (publishes nothing)
  pr.yml                    # PR smoke: tiny throughput pass only (no confirm)
  benchmark.yml             # manual dispatch: bench + ide + ide-scale + memory
                            #   + confirm → README + generated docs/
  e2e-vscode.yml            # optional VS Code E2E (manual dispatch)
```

## Resource probe (memory + allocations + CPU)

**Not** collected during timing benches (avoids sampling overhead). Run separately:

```bash
pnpm bench:memory              # default fixtures/50, 3 samples/tool
pnpm bench:memory:small        # fixtures/20 smoke
node --expose-gc scripts/bench-memory.mjs --fixture fixtures/200 --file-limit 100 --samples 3
```

| Metric                | CLI tools                         | In-process (NAPI / eslint / …)                     |
| --------------------- | --------------------------------- | -------------------------------------------------- |
| **RSS min/max/avg**   | Child WorkingSet / RSS only       | RSS during work − GC baseline                      |
| **Alloc min/max/avg** | Windows: private bytes; else n/a  | V8 `heapUsed` delta (+ peak malloc when available) |
| **CPU total / %**     | Process CPU time / (cpu÷wall×100) | `process.cpuUsage()` in isolated worker            |
| Isolation             | One child process per tool        | Same                                               |

Output: `results/memory-<platform>-<limit>.{json,md}`.

Compiler memory is split into the same work scopes as timing. The **Raw SFC compilation** table gives Vue, Vize `compileSfcBatchWithResults`, and Verter `compileMany` identical style-free strings; Verter explicitly uses stateless runtime-render and asserts zero cache hits. The **SFC compilation with CSS** table includes the Vue reference, Vize single/batch, Verter `compileMany + processStyle`, and fervid on the same revised style-bearing sources. These classes are not visually mixed.

On `main`, Linux CI publishes the latest report as **[docs/memory.md](memory.md)** (committed).

#### Caveat: Volar's LSP memory row is not the whole of Volar, but the LSP timing row is

⚠ This asymmetry runs in opposite directions on two different axes.

Vue language-tools v3 is a **two-process** architecture: `@vue/language-server` plus a TypeScript server reached over the `tsserver/request`↔`tsserver/response` bridge. Both processes are real, and the TypeScript half is the larger of the two.

| Surface              | What Volar is charged for                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LSP / IDE timing** | **Both processes.** Startup and project load of the pair are inside the timings, and each feature is asked of both halves in parallel with the **slower** one charged (`scripts/lib/surfaces/lsp.mjs`). |
| **Memory probe**     | **The Vue server only.** RSS and CPU are sampled from a single pid; the tsserver half is a separate, larger process and is **not** included (`scripts/memory-worker.mjs`).                              |

So the memory tables cover **one of Volar's two processes**, and the latency tables cover both. Neither number is wrong for what it measures, but they do not cover the same process set: "Volar's memory" and "Vize's memory" are not measurements of the same thing. Vize and Verter run single-process, so their rows cover the whole tool.

Treat Volar's LSP memory figure as a **lower bound on the Vue half**, not as Volar's footprint. The affected rows carry the same warning in their notes; it is emitted by the probe rather than being editorial.

## Interpreting results

- Published numbers are **Linux only**. Local runs on macOS/Windows are for relative comparison on your own box, not against published figures.
- Compare compiler rows within the same thread class (`1t` vs `1t`, etc.).
- `golar typecheck` is pure typecheck; bare `golar` also runs lint.
- `skipped` / `error` rows are not ranked.
- Numbers from other corpora, hardware, or scripts are a different experiment.
- Memory min/max/avg are tool-attributed (see table above); do not mix with wall-clock tables.
