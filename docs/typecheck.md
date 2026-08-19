# Typecheck confirmation

This is the **correctness** suite for Vue typecheckers, not a throughput benchmark.
A tool is compatible only if it reports the planted error (or stays clean) on every plant.
vue-tsc (Volar) is the usual reference, but it is **not assumed perfect** — a plant it fails is a real gap and is listed as such.

Generated from `pnpm confirm:typecheck` at 2026-08-19T18:33:13.434Z on **Linux CI**.
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor · 15.6 GB · Node v22.23.2
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/32287835178

On a **Benchmark** dispatch, Linux CI re-runs this and commits the file. Do not hand-edit the results.

## How plants are judged

- Each case is a tiny project under `tests/confirm/fixtures/typecheck/cases/<id>/`. CI scores the matrix from **one spawn per tool** (`--all`) over every plant. `pnpm confirm:typecheck` without `--all` still runs each plant as its own spawn (fallthrough / extra-tsconfig retries).
- **All plants (one tsconfig)** — extra check: every plant is copied under `cases/<id>/` and typechecked in **one** process with the shared `tsconfig.json` (no per-case overlay, no fallthroughAttributes retry). Wall is a speed pass (no RSS sampler). Peak RSS is a **separate** memory spawn. Pass rate is the per-plant score of the last speed dump, as a percentage of scored plants (skips excluded).
- Every tool runs on the **same shared tsconfig** (`strictTemplates: true`). Extra TypeScript flags that only one tool needs are **not** added globally.
- `expectErrors: false` — the fixture is clean. Any diagnostic is a fail. A diagnostic that names the tool's own virtual code (`__VLS_`, `___VERTER___`, …) is called out as a codegen leak.
- `expectErrors: true` — at least one error, matching `mustMatch` when set. Dirty plants mark the bad line with a harness pin (`<!-- @plant-error -->` in template, `// @plant-error` in script). That is **not** TypeScript: HTML comments are ignored by every checker, so the pin always survives. The harness requires a diagnostic **on the next line** that mentions `expectMention` (e.g. the invalid prop name). A hit on the wrong line, or an error that does not name the plant, is a fail. `// @ts-expect-error` is only used in `.ts` where unused-directive is itself the plant.
- **skip** — the tool does not claim the capability (`meta.requires`), or the binary/engine is missing.
- **warn** — extra harness behaviour for one tool (today: verter-tsc retried with `allowArbitraryExtensions` + `allowImportingTsExtensions` that the others do not need). A warn is **not** a pass.
- Known upstream bugs live in `tests/confirm/known-failures.json`. They still show as **✗** here so the gap stays visible; they do not fail the PR gate until they start passing (stale entry) or a new unlisted fail appears.

## Shared vs extra vueCompilerOptions

The shared config does **not** set `fallthroughAttributes`. That flag is a Volar opt-in (default `false`). This suite does not put it in any case `tsconfig.json` — doing so would hide that a tool only types inheritAttrs fallthrough when given a non-default option.

Plants in **inheritAttrs + root shape** run **twice**: once on the shared tsconfig, then on an isolated `tsconfig.fallthrough.json`. Scoring:

- shared ✓ and extra ✓ → **pass** (no opt-in needed, or a dirty plant errors either way)
- shared ✗ and extra ✓ → **⚠ warn** (needed `fallthroughAttributes`; not a pass)
- shared ✓ and extra ✗ → **fail** (the opt-in revealed the plant was missed)
- shared ✗ and extra ✗ → **fail**

What those plants ask (the *correct* inheritAttrs/root-shape answer):

| Root shape | inheritAttrs | Call-site `id=` | Correct answer |
| --- | --- | --- | --- |
| Single element | default / true | native `id` | clean (falls through) |
| Single element | `false` | native `id` | error |
| Multi-root fragment | default / true | native `id` | error (no single target) |
| `v-if` / `v-else`, both single-root | default / true | native `id` | clean (always one root) |
| `v-if` single / `v-else` fragment | default / true | native `id` | error (not always one root) |
| `v-if="true"` or a literal-`true` prop, single branch | default / true | native `id` | clean if the checker resolves the condition statically |
| `v-if="true"` but that branch is a fragment | default / true | native `id` | error |

Static resolution (`v-if="true"`, `alwaysOn: true`) is the hard edge. A tool that only counts root nodes syntactically will fail it. That is a finding, including for vue-tsc.

## Status key

| Mark | Meaning |
| --- | --- |
| ✓ | pass — plant met on the shared (or disclosed case-local) config |
| **✗** | fail — plant not met. If listed in known-failures.json it is a documented upstream gap |
| ⚠ | warn — extra harness behaviour; not scored as a pass |
| ○ | skip — missing capability or engine |
| – | no row (tool did not run this case) |

## Summary

- plants: **142**
- pass: **407** · fail: **155** · skip: **6** · warn: **0**
- one-spawn combined run: [All plants (one tsconfig)](#all-plants-one-tsconfig)

## All plants (one tsconfig)

One spawn per tool over **every** plant, nested at `cases/<id>/` so filenames do not collide. Same shared `strictTemplates` tsconfig as the per-plant matrix — no case-local `vueCompilerOptions`, no fallthroughAttributes retry, no verter extra flags. A plant that only passes with those extras fails here; that is the point of the combined check.

Wall ranking uses the **median** of a **speed** pass (`--runs`, default 5, after `--warmups`, default 1) with **no** RSS sampler; **Avg** is the arithmetic mean of those same measured runs. Peak RSS is a **separate memory pass** (one sampled spawn after speed) so process-tree polling cannot inflate the clock. Engine RSS is a child `tsgo` / native `tsc` / `tsserver` when one was spawned. Pass rate is scored plants that met their pin (skips excluded), as a **percentage**.

![All plants wall](results/charts/typecheck-all-wall.svg)

| Tool | **Median** | Avg | vs fastest |
| --- | ---: | ---: | ---: |
| vize | **603 ms** | 602 ms | 1.00x |
| verter-tsc | **755 ms** | 756 ms | 1.25x |
| golar | **915 ms** | 913 ms | 1.52x |
| vue-tsc | **3.18 s** | 3.17 s | 5.28x |

![All plants peak RSS](results/charts/typecheck-all-rss.svg)

| Tool | Tool | tsgo / tsc | **Total** |
| --- | ---: | ---: | ---: |
| verter-tsc | 81.6 MB | 141.9 MB | **223.5 MB** |
| vue-tsc | 340.1 MB | — | **340.1 MB** |
| golar | 353.5 MB | — | **353.5 MB** |
| vize | 72.3 MB | 319.6 MB | **392.0 MB** |

Engine is a **child** `tsgo` / native `tsc` / `tsserver`. vue-tsc, golar, and vize host the checker **in-process** — Peak RSS is that process's high-water mark (Tool = Total, engine —).

![All plants pass rate](results/charts/typecheck-all-pass.svg)

| Tool | **Pass rate** | pass / scored | skipped |
| --- | ---: | ---: | ---: |
| vue-tsc | **84%** | 119 / 142 | 0 |
| golar | **82%** | 117 / 142 | 0 |
| verter-tsc | **70%** | 100 / 142 | 0 |
| vize | **52%** | 71 / 136 | 6 |

**vize** scored 136 of 142 (6 skipped). Skips are capability gaps, not fails — Vize does not claim `strict-component-attrs` (undeclared component attrs under `strictTemplates`).


## Template narrowing

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`v-else-if-bad`](../tests/confirm/fixtures/typecheck/cases/v-else-if-bad/) | error | ✓ | **✗** | ✓ | ✓ | typeof === 'string' branch must reject number-only methods (toFixed) |
| [`v-else-if-ok`](../tests/confirm/fixtures/typecheck/cases/v-else-if-ok/) | clean | ✓ | ✓ | ✓ | ✓ | typeof guards on v-if / v-else-if narrow a string \| number union in the template |
| [`v-if-discriminant-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-discriminant-bad/) | error | ✓ | **✗** | ✓ | ✓ | After narrowing to kind === 'dog', accessing cat-only meow() must error |
| [`v-if-discriminant-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-discriminant-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | v-if on a tagged-union discriminant narrows each branch to the matching variant |
| [`v-if-else-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-else-bad/) | error | ✓ | **✗** | ✓ | ✓ | v-else branch must treat the nullable ref as null, so .name is an error |
| [`v-if-else-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-else-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if / v-else: narrowed user.name in the true branch, literal in the else |
| [`v-if-event-closure`](../tests/confirm/fixtures/typecheck/cases/v-if-event-closure/) | error | ✓ | **✗** | ✓ | ✓ | Script handler uses nullable ref without guard (event may run later) |
| [`v-if-in-narrow-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-in-narrow-bad/) | error | ✓ | **✗** | ✓ | ✓ | After v-if="'a' in x", accessing x.b in the true branch must error |
| [`v-if-in-narrow-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-in-narrow-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if="'a' in x" narrows a {a} \| {b} union so x.a is a string (clean) |
| [`v-if-inline-event-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-inline-event-bad/) | error | ✓ | **✗** | ✓ | ✓ | Inline @click reads .name on a nullable ref with no v-if guard |
| [`v-if-inline-event-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-inline-event-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if on an element narrows a nullable ref inside that element's @click and interpolation |
| [`v-if-narrow-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-narrow-bad/) | error | ✓ | **✗** | ✓ | ✓ | Access nullable ref property without v-if guard |
| [`v-if-narrow-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-narrow-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if should narrow ref union in template (clean) |
| [`v-if-not-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-not-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if="!user" / v-else must narrow the else branch to the object |
| [`v-if-optional-prop-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-optional-prop-bad/) | error | ✓ | **✗** | **✗** | ✓ | Optional prop used without v-if must report possibly undefined |
| [`v-if-optional-prop-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-optional-prop-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if on an optional prop narrows it to string before toUpperCase |
| [`v-if-typeof-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-typeof-bad/) | error | ✓ | **✗** | ✓ | ✓ | string \| number without a typeof guard must reject toUpperCase |
| [`v-if-typeof-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-typeof-ok/) | clean | ✓ | ✓ | ✓ | ✓ | typeof === 'number' in v-if narrows a string \| number ref for toFixed |
| [`v-show-no-narrow`](../tests/confirm/fixtures/typecheck/cases/v-show-no-narrow/) | error | ✓ | **✗** | ✓ | ✓ | v-show does not narrow; reading .name on a nullable ref must still error |

## inheritAttrs + root shape

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`fallthrough-mono-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-mono-false-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs:false + single root: undeclared id must still error under fallthroughAttributes · *may warn if fallthroughAttributes is required* |
| [`fallthrough-mono-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-mono-ok/) | clean | **✗** | ✓ | **✗**† | **✗** | inheritAttrs default + single root: native id falls through (fallthroughAttributes) · *may warn if fallthroughAttributes is required* |
| [`fallthrough-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-multi-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs default + multi-root fragment: undeclared id must error (no single target) · *may warn if fallthroughAttributes is required* |
| [`fallthrough-multi-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-multi-false-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs:false + multi-root: undeclared id must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-native-type-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-native-type-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs default + single &lt;button&gt; root: fallthrough :disabled="string" must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-both-mono-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-both-mono-false-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs:false + v-if/v-else both single-root: undeclared id must still error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-both-mono-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-both-mono-ok/) | clean | **✗** | ✓ | **✗**† | **✗** | inheritAttrs default + v-if/v-else both single-root: id may fall through (always one root) · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-mono-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-mono-multi-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs default + v-if mono / v-else multi-root: undeclared id must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-static-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-multi-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs default + v-if="true" whose branch is multi-root: undeclared id must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-static-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-ok/) | clean | **✗** | ✓ | **✗**† | **✗** | inheritAttrs default + v-if="true" (statically single root): id may fall through · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-static-prop-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-prop-ok/) | clean | **✗** | ✓ | **✗**† | **✗** | inheritAttrs default + v-if on a literal-true prop: statically single root, id may fall through · *may warn if fallthroughAttributes is required* |

## inheritAttrs / strictTemplates (no fallthrough typing)

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`attrs-aria-data-unknown`](../tests/confirm/fixtures/typecheck/cases/attrs-aria-data-unknown/) | error | ✓ | ○ | **✗**† | ✓ | Undeclared aria-*/data-* attributes on a component are not exempt from strictTemplates (isolates the root cause of inherit-attrs-false-unknown: the exemption is prefix-based, not inheritAttrs-based) |
| [`attrs-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/attrs-class-style-ok/) | clean | ✓ | ✓ | ✓ | ✓ | class/style on component are AllowedComponentProps (clean under strictTemplates) |
| [`attrs-unknown-fallthrough`](../tests/confirm/fixtures/typecheck/cases/attrs-unknown-fallthrough/) | error | ✓ | ○ | ✓ | ✓ | Non-declared attribute (id) on component errors under strictTemplates regardless of inheritAttrs |
| [`inherit-attrs-default-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-default-class-style-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Default inheritAttrs still allows class and style (AllowedComponentProps) |
| [`inherit-attrs-default-unknown`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-default-unknown/) | error | ✓ | ○ | ✓ | ✓ | Default inheritAttrs (no defineOptions) still errors on undeclared attrs under strictTemplates |
| [`inherit-attrs-false-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-false-class-style-ok/) | clean | ✓ | ✓ | ✓ | ✓ | inheritAttrs: false still allows class and style on the component |
| [`inherit-attrs-false-unknown`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-false-unknown/) | error | **✗** | ○ | **✗**† | **✗** | inheritAttrs:false still rejects unknown attrs at the call site under strictTemplates |
| [`unknown-prop-strict`](../tests/confirm/fixtures/typecheck/cases/unknown-prop-strict/) | error | ✓ | ○ | ✓ | ✓ | strictTemplates: undeclared prop on child component |

## Generics

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`generic-component-bad`](../tests/confirm/fixtures/typecheck/cases/generic-component-bad/) | error | **✗** | **✗** | **✗** | **✗** | Generic &lt;script setup&gt; component: `selected` must unify with the element type inferred from `items` |
| [`generic-component-ok`](../tests/confirm/fixtures/typecheck/cases/generic-component-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | generic="T extends { id: number }" on &lt;script setup&gt;; parent passes a consistent T (clean) |
| [`generic-constraint-template-bad`](../tests/confirm/fixtures/typecheck/cases/generic-constraint-template-bad/) | error | ✓ | **✗** | ✓ | ✓ | Inside a generic SFC, T extends { id: number } must reject item.name |
| [`generic-default-ok`](../tests/confirm/fixtures/typecheck/cases/generic-default-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic with a default type param (T = string) accepts a string value |
| [`generic-define-model-bad`](../tests/confirm/fixtures/typecheck/cases/generic-define-model-bad/) | error | ✓ | **✗** | **✗** | ✓ | generic defineModel&lt;T extends string \| number&gt; must reject an object v-model |
| [`generic-define-model-ok`](../tests/confirm/fixtures/typecheck/cases/generic-define-model-ok/) | clean | ✓ | ✓ | **✗** | ✓ | generic defineModel&lt;T extends string \| number&gt; accepts a string v-model (clean) |
| [`generic-emit-bad`](../tests/confirm/fixtures/typecheck/cases/generic-emit-bad/) | error | ✓ | **✗** | ✓ | ✓ | Generic emit payload inferred as number must reject a string handler |
| [`generic-emit-ok`](../tests/confirm/fixtures/typecheck/cases/generic-emit-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic emit payload matches the inferred T from the value prop |
| [`generic-fallthrough-mono-ok`](../tests/confirm/fixtures/typecheck/cases/generic-fallthrough-mono-ok/) | clean | **✗** | ✓ | **✗**† | **✗** | Generic + inheritAttrs default + single root: native id falls through · *may warn if fallthroughAttributes is required* |
| [`generic-inherit-false-class-ok`](../tests/confirm/fixtures/typecheck/cases/generic-inherit-false-class-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic + inheritAttrs:false still allows class |
| [`generic-inherit-false-unknown`](../tests/confirm/fixtures/typecheck/cases/generic-inherit-false-unknown/) | error | ✓ | ○ | ✓ | ✓ | Generic + inheritAttrs:false: undeclared extra attr must error |
| [`generic-multi-root-ok`](../tests/confirm/fixtures/typecheck/cases/generic-multi-root-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic multi-root SFC with correct props stays clean (no extra attrs) |
| [`generic-slot-bad`](../tests/confirm/fixtures/typecheck/cases/generic-slot-bad/) | error | **✗** | **✗**† | **✗** | **✗** | Generic scoped slot: item.id (number) must reject a string-only consumer |
| [`generic-slot-ok`](../tests/confirm/fixtures/typecheck/cases/generic-slot-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic scoped slot exposes T so item.label is a string |
| [`generic-two-params-bad`](../tests/confirm/fixtures/typecheck/cases/generic-two-params-bad/) | error | ✓ | **✗**† | ✓ | ✓ | Two-param generic: slot payload inferred as number must reject a string-only consumer |
| [`generic-two-params-ok`](../tests/confirm/fixtures/typecheck/cases/generic-two-params-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic component with two type params and matching bindings |

## Emits

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`emit-ok`](../tests/confirm/fixtures/typecheck/cases/emit-ok/) | clean | ✓ | ✓ | ✓ | ✓ | defineEmits typed payload: correct event name and number arg |
| [`emit-unknown-event`](../tests/confirm/fixtures/typecheck/cases/emit-unknown-event/) | error | ✓ | **✗** | ✓ | ✓ | emit() of an undeclared event name must error |
| [`emit-wrong-arg`](../tests/confirm/fixtures/typecheck/cases/emit-wrong-arg/) | error | **✗** | **✗** | **✗** | **✗** | emit('change', string) where the payload is typed as number |
| [`event-emit-payload`](../tests/confirm/fixtures/typecheck/cases/event-emit-payload/) | error | ✓ | **✗** | ✓ | ✓ | Listener receives wrong payload type for typed emit |

## Native events / $event / modifiers

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`dollar-event-bad`](../tests/confirm/fixtures/typecheck/cases/dollar-event-bad/) | error | ✓ | **✗** | ✓ | ✓ | $event on native @click must reject an unknown method |
| [`dollar-event-ok`](../tests/confirm/fixtures/typecheck/cases/dollar-event-ok/) | clean | ✓ | ✓ | ✓ | ✓ | $event on native @click is a MouseEvent and has preventDefault |
| [`element-prop-type`](../tests/confirm/fixtures/typecheck/cases/element-prop-type/) | error | **✗** | **✗** | **✗** | **✗** | Native element / event handler type error in template |
| [`event-mod-click-ctrl-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-ctrl-ok/) | clean | ✓ | ✓ | ✓ | ✓ | System modifier @click.ctrl is still a MouseEvent handler (clean) |
| [`event-mod-click-prevent-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-bad/) | error | ✓ | **✗** | ✓ | ✓ | .prevent does not change @click from MouseEvent to KeyboardEvent |
| [`event-mod-click-prevent-dollar-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-dollar-bad/) | error | **✗** | **✗** | ✓ | **✗** | $event on @click.prevent is still MouseEvent (no .key) |
| [`event-mod-click-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-ok/) | clean | ✓ | ✓ | ✓ | ✓ | @click.prevent keeps the native MouseEvent handler type (clean) |
| [`event-mod-click-stop-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-stop-prevent-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Chained @click.stop.prevent is still a MouseEvent handler (clean) |
| [`event-mod-component-once-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-component-once-bad/) | error | ✓ | **✗** | ✓ | ✓ | .once on a component emit does not erase the payload type |
| [`event-mod-component-once-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-component-once-ok/) | clean | ✓ | ✓ | ✓ | ✓ | @change.once on a typed emit still receives the number payload (clean) |
| [`event-mod-keyup-enter-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-keyup-enter-bad/) | error | **✗** | **✗** | ✓ | **✗** | @keyup.enter is still KeyboardEvent; a MouseEvent handler must error |
| [`event-mod-keyup-enter-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-keyup-enter-ok/) | clean | ✓ | ✓ | ✓ | ✓ | @keyup.enter keeps KeyboardEvent (key modifiers are not event-type rewrites) |
| [`event-mod-submit-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-submit-prevent-ok/) | clean | ✓ | ✓ | ✓ | ✓ | @submit.prevent accepts an Event handler (clean) |
| [`native-keyup-bad`](../tests/confirm/fixtures/typecheck/cases/native-keyup-bad/) | error | **✗** | **✗** | ✓ | **✗** | @keyup handler typed as MouseEvent must not accept a KeyboardEvent |

## v-model / defineModel

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`define-model-default-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-default-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Unnamed defineModel&lt;string&gt; accepts v-model on a string ref (clean) |
| [`define-model-get-set-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-get-set-ok/) | clean | ✓ | ✓ | ✓ | ✓ | defineModel get/set transformers whose in/out types match T stay clean |
| [`define-model-modifiers-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | defineModel&lt;string, 'trim' \| 'capitalize'&gt; + v-model.trim; child reads modifiers.trim (clean) |
| [`define-model-modifiers-read-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-read-bad/) | error | ✓ | **✗**† | **✗**† | ✓ | Reading modifiers.nope must error when the union is 'trim' \| 'capitalize' |
| [`define-model-modifiers-unknown-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-unknown-bad/) | error | ✓ | **✗**† | **✗** | ✓ | v-model.nope must error when defineModel only declares 'trim' \| 'capitalize' |
| [`define-model-named`](../tests/confirm/fixtures/typecheck/cases/define-model-named/) | error | **✗** | **✗** | **✗** | **✗** | Named defineModel: v-model:title must be typechecked against the declared model type |
| [`define-model-named-modifiers-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-named-modifiers-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Named defineModel + v-model:title.trim matches the declared modifier (clean) |
| [`define-model-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Named defineModel bindings with matching ref types stay clean |
| [`define-model-set-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-set-bad/) | error | ✓ | **✗** | ✓ | ✓ | defineModel&lt;number&gt; set() must not call string-only methods on the value |
| [`discriminated-union-v-model-bad`](../tests/confirm/fixtures/typecheck/cases/discriminated-union-v-model-bad/) | error | ✓ | **✗** | **✗** | ✓ | Discriminated union child: kind='num' must reject a bound s field |
| [`discriminated-union-v-model-ok`](../tests/confirm/fixtures/typecheck/cases/discriminated-union-v-model-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Discriminated union child: kind='num' with v-model:n number stays clean |
| [`native-input-v-model-ok`](../tests/confirm/fixtures/typecheck/cases/native-input-v-model-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Native &lt;input&gt; v-model accepts a string ref |
| [`native-v-model-lazy-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-lazy-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Native &lt;input v-model.lazy&gt; accepts a string ref (clean) |
| [`native-v-model-number-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-number-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Native &lt;input v-model.number&gt; accepts a number ref (clean) |
| [`native-v-model-trim-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-trim-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Native &lt;input v-model.trim&gt; accepts a string ref (clean) |
| [`v-model-type`](../tests/confirm/fixtures/typecheck/cases/v-model-type/) | error | **✗** | **✗** | **✗** | **✗** | v-model type mismatch between parent ref and child model |

## Slots

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`define-slots-default-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-default-ok/) | clean | ✓ | ✓ | ✓ | ✓ | defineSlots default props flow into the parent's #default destructure (clean) |
| [`define-slots-fn-bad`](../tests/confirm/fixtures/typecheck/cases/define-slots-fn-bad/) | error | **✗** | **✗** | **✗** | **✗** | Slot callback typed (id: number) =&gt; void must reject a string argument |
| [`define-slots-fn-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-fn-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Slot callback prop (id: number) =&gt; void called with a number (clean) |
| [`define-slots-named-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-named-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Named + default defineSlots used at their declared payload types (clean) |
| [`required-slot-missing-bad`](../tests/confirm/fixtures/typecheck/cases/required-slot-missing-bad/) | error | **✗** | **✗** | **✗** | **✗** | Omitting a named header slot declared in defineSlots must error if the checker treats it as required |
| [`required-slot-ok`](../tests/confirm/fixtures/typecheck/cases/required-slot-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Named header slot from defineSlots is provided with the declared title payload (clean) |
| [`slot-default-implicit-ok`](../tests/confirm/fixtures/typecheck/cases/slot-default-implicit-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Default slot without defineSlots accepts parent children (clean) |
| [`slot-provide-type-bad`](../tests/confirm/fixtures/typecheck/cases/slot-provide-type-bad/) | error | **✗** | **✗**† | **✗** | **✗** | Child &lt;slot :msg=number&gt; must error when defineSlots says msg: string |
| [`slot-provide-type-ok`](../tests/confirm/fixtures/typecheck/cases/slot-provide-type-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Child &lt;slot :msg&gt; matches defineSlots default payload (clean) |
| [`slot-scope-ok`](../tests/confirm/fixtures/typecheck/cases/slot-scope-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Scoped slot payload destructured and used at its declared type (clean) |
| [`slot-scope-payload`](../tests/confirm/fixtures/typecheck/cases/slot-scope-payload/) | error | **✗** | **✗** | **✗** | **✗** | Scoped slot payload type must flow into the parent's v-slot destructuring |
| [`slot-unknown-prop-bad`](../tests/confirm/fixtures/typecheck/cases/slot-unknown-prop-bad/) | error | ✓ | **✗**† | ✓ | ✓ | Scoped slot destructure must reject a property that is not on the payload |
| [`slot-v-bind-bad`](../tests/confirm/fixtures/typecheck/cases/slot-v-bind-bad/) | error | ✓ | **✗**† | **✗**† | ✓ | Child &lt;slot v-bind&gt; with item.id: string must not satisfy id: number |
| [`slot-v-bind-ok`](../tests/confirm/fixtures/typecheck/cases/slot-v-bind-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Child slot v-bind object whose fields match defineSlots stays clean |

## v-for

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`v-for-destructure-ok`](../tests/confirm/fixtures/typecheck/cases/v-for-destructure-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Destructured v-for bindings keep their field types |
| [`v-for-item-type`](../tests/confirm/fixtures/typecheck/cases/v-for-item-type/) | error | ✓ | **✗** | ✓ | ✓ | v-for alias must carry the array element type into template expressions |
| [`v-for-ok`](../tests/confirm/fixtures/typecheck/cases/v-for-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-for item/index types and a nested v-for used correctly (clean) |
| [`v-for-tuple-ok`](../tests/confirm/fixtures/typecheck/cases/v-for-tuple-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-for over an as const [string, number] tuple uses the string element (clean) |
| [`v-for-tuple-type-bad`](../tests/confirm/fixtures/typecheck/cases/v-for-tuple-type-bad/) | error | ✓ | **✗** | ✓ | ✓ | v-for over an as const [string, number] tuple must reject toFixed on the string element |

## Dynamic / async / global components

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`async-component-prop-bad`](../tests/confirm/fixtures/typecheck/cases/async-component-prop-bad/) | error | ✓ | **✗** | ✓ | ✓ | defineAsyncComponent child must reject a string where count expects number |
| [`async-component-prop-ok`](../tests/confirm/fixtures/typecheck/cases/async-component-prop-ok/) | clean | ✓ | ✓ | ✓ | ✓ | defineAsyncComponent(() =&gt; import('./Child.vue')) with a matching number prop stays clean |
| [`dynamic-component-prop-bad`](../tests/confirm/fixtures/typecheck/cases/dynamic-component-prop-bad/) | error | ✓ | **✗** | ✓ | ✓ | &lt;component :is&gt; must reject a string where the resolved SFC expects count: number |
| [`dynamic-component-prop-ok`](../tests/confirm/fixtures/typecheck/cases/dynamic-component-prop-ok/) | clean | ✓ | ✓ | ✓ | ✓ | &lt;component :is&gt; with a typed SFC and a matching number prop stays clean |
| [`global-component-prop-bad`](../tests/confirm/fixtures/typecheck/cases/global-component-prop-bad/) | error | ✓ | **✗** | **✗** | ✓ | GlobalComponents Fancy must reject a number where title expects string |
| [`global-component-prop-ok`](../tests/confirm/fixtures/typecheck/cases/global-component-prop-ok/) | clean | ✓ | ✓ | **✗** | ✓ | GlobalComponents Fancy with title: string accepts a string attribute (clean) |

## Directives

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`custom-directive-value-bad`](../tests/confirm/fixtures/typecheck/cases/custom-directive-value-bad/) | error | ✓ | **✗** | ✓ | **✗** | Local directive typed DirectiveBinding&lt;number&gt; must reject a string value |
| [`custom-directive-value-ok`](../tests/confirm/fixtures/typecheck/cases/custom-directive-value-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Local directive typed DirectiveBinding&lt;number&gt; accepts a numeric value (clean) |

## Props / v-bind

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`boolean-prop-attr-ok`](../tests/confirm/fixtures/typecheck/cases/boolean-prop-attr-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Boolean presence attribute `&lt;Child enabled /&gt;` satisfies enabled: boolean |
| [`literal-union-prop-bad`](../tests/confirm/fixtures/typecheck/cases/literal-union-prop-bad/) | error | ✓ | **✗** | ✓ | ✓ | Static attribute value outside the declared string-literal union must error |
| [`literal-union-prop-ok`](../tests/confirm/fixtures/typecheck/cases/literal-union-prop-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Static attribute value must narrow to a string literal type for a union prop (clean) |
| [`missing-required-prop`](../tests/confirm/fixtures/typecheck/cases/missing-required-prop/) | error | ✓ | **✗** | ✓ | **✗**† | Omitting a required child prop must error |
| [`static-number-attr-bad`](../tests/confirm/fixtures/typecheck/cases/static-number-attr-bad/) | error | **✗** | **✗** | **✗** | **✗** | Static attribute count="1" is a string and must not satisfy count: number |
| [`v-bind-object-bad`](../tests/confirm/fixtures/typecheck/cases/v-bind-object-bad/) | error | ✓ | **✗** | ✓ | ✓ | v-bind object with count: string must not satisfy count: number |
| [`v-bind-object-ok`](../tests/confirm/fixtures/typecheck/cases/v-bind-object-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-bind="object" whose fields match the child props is clean |
| [`with-defaults-ok`](../tests/confirm/fixtures/typecheck/cases/with-defaults-ok/) | clean | ✓ | ✓ | ✓ | ✓ | withDefaults makes an optional prop defined in the template (toUpperCase is safe) |
| [`wrong-prop-type`](../tests/confirm/fixtures/typecheck/cases/wrong-prop-type/) | error | **✗** | **✗** | **✗** | **✗** | Pass string where child prop expects number |

## Refs / expose / unwrap

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`component-ref-expose-bad`](../tests/confirm/fixtures/typecheck/cases/component-ref-expose-bad/) | error | ✓ | **✗**† | ✓ | ✓ | Calling a method that was not defineExpose'd on a component template ref must error |
| [`component-ref-expose-ok`](../tests/confirm/fixtures/typecheck/cases/component-ref-expose-ok/) | clean | ✓ | ✓ | ✓ | ✓ | useTemplateRef on a child can call a method declared in defineExpose |
| [`computed-unwrap-ok`](../tests/confirm/fixtures/typecheck/cases/computed-unwrap-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Template auto-unwraps a computed number so toFixed is valid |
| [`ref-unwrap-bad`](../tests/confirm/fixtures/typecheck/cases/ref-unwrap-bad/) | error | ✓ | **✗** | ✓ | ✓ | Auto-unwrapped number ref must reject string methods in the template |
| [`ref-unwrap-ok`](../tests/confirm/fixtures/typecheck/cases/ref-unwrap-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Template auto-unwraps a number ref so count + 1 is valid |
| [`template-ref-type`](../tests/confirm/fixtures/typecheck/cases/template-ref-type/) | error | ✓ | **✗** | ✓ | ✓ | useTemplateRef element type must be enforced on member access |

## Script / inject / options API

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`async-setup-await`](../tests/confirm/fixtures/typecheck/cases/async-setup-await/) | clean | ✓ | ✓ | ✓ | ✓ | Top-level await in &lt;script setup&gt; must typecheck cleanly (async setup wrapper) |
| [`inject-key-type`](../tests/confirm/fixtures/typecheck/cases/inject-key-type/) | error | ✓ | **✗** | ✓ | ✓ | inject(InjectionKey) without a default is possibly undefined |
| [`options-api-prop-bad`](../tests/confirm/fixtures/typecheck/cases/options-api-prop-bad/) | error | **✗** | **✗** | **✗** | **✗** | Options API: assigning this.count (number) to a string must error |
| [`provide-inject-ok`](../tests/confirm/fixtures/typecheck/cases/provide-inject-ok/) | clean | ✓ | ✓ | ✓ | ✓ | inject(key, default) is a definite string when the default is provided |
| [`script-type-error`](../tests/confirm/fixtures/typecheck/cases/script-type-error/) | error | **✗** | **✗** | **✗** | **✗** | Planted TS error in &lt;script setup&gt; |

## .ts imports .vue

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`ts-import-vue-bad`](../tests/confirm/fixtures/typecheck/cases/ts-import-vue-bad/) | clean | ✓ | ✓ | ✓ | ✓ | .ts file imports an SFC; @ts-expect-error on a string assigned to a number prop (unused if the import is any) |
| [`ts-import-vue-ok`](../tests/confirm/fixtures/typecheck/cases/ts-import-vue-ok/) | clean | ✓ | ✓ | ✓ | ✓ | .ts file imports an SFC and passes correctly typed props |

## Other

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`clean-basic`](../tests/confirm/fixtures/typecheck/cases/clean-basic/) | clean | ✓ | ✓ | ✓ | ✓ | Valid script + template; no intentional errors |
| [`optional-chain-bad`](../tests/confirm/fixtures/typecheck/cases/optional-chain-bad/) | error | ✓ | **✗** | ✓ | ✓ | Unguarded member access on an optional property inside a template expression |
| [`optional-chain-ok`](../tests/confirm/fixtures/typecheck/cases/optional-chain-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Optional chaining + nullish coalescing inside template expressions (clean) |
| [`style-binding-bad`](../tests/confirm/fixtures/typecheck/cases/style-binding-bad/) | error | ✓ | **✗** | ✓ | ✓ | :style bound to a number must error |
| [`template-undefined`](../tests/confirm/fixtures/typecheck/cases/template-undefined/) | error | ✓ | **✗** | ✓ | ✓ | Planted unknown identifier in &lt;template&gt; |

## Documented gaps (†)

These fails are real. They are allow-listed only so the PR gate stays a useful signal; the cell still shows **✗**.

- `typecheck/attrs-aria-data-unknown/verter-tsc` — expected ≥1 error(s), got 0
- `typecheck/component-ref-expose-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/define-model-modifiers-ok/verter-tsc` — expected clean (0 errors), got 2
- `typecheck/define-model-modifiers-read-bad/verter-tsc` — no diagnostic at App.vue:6 (@plant-error)
- `typecheck/define-model-modifiers-read-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/define-model-modifiers-unknown-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/define-model-named-modifiers-ok/verter-tsc` — expected clean (0 errors), got 2
- `typecheck/fallthrough-mono-false-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/fallthrough-mono-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/fallthrough-multi-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/fallthrough-multi-false-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/fallthrough-native-type-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/fallthrough-vif-both-mono-false-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/fallthrough-vif-both-mono-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/fallthrough-vif-mono-multi-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/fallthrough-vif-static-multi-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/fallthrough-vif-static-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/fallthrough-vif-static-prop-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/generic-component-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — /home/runner/work/vue-benchmarks/vue-benchmarks/work/confirm-typecheck-all/cases/generic-component-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s).
- `typecheck/generic-default-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — /home/runner/work/vue-benchmarks/vue-benchmarks/work/confirm-typecheck-all/cases/generic-default-ok/Child.vue(1,1): error TS2315: Type '___VERTER___attributes' is not generic.
- `typecheck/generic-emit-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — /home/runner/work/vue-benchmarks/vue-benchmarks/work/confirm-typecheck-all/cases/generic-emit-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s).
- `typecheck/generic-fallthrough-mono-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — /home/runner/work/vue-benchmarks/vue-benchmarks/work/confirm-typecheck-all/cases/generic-fallthrough-mono-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s).
- `typecheck/generic-inherit-false-class-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — /home/runner/work/vue-benchmarks/vue-benchmarks/work/confirm-typecheck-all/cases/generic-inherit-false-class-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(
- `typecheck/generic-multi-root-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — /home/runner/work/vue-benchmarks/vue-benchmarks/work/confirm-typecheck-all/cases/generic-multi-root-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s).
- `typecheck/generic-slot-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/generic-slot-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — /home/runner/work/vue-benchmarks/vue-benchmarks/work/confirm-typecheck-all/cases/generic-slot-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s).
- `typecheck/generic-two-params-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/generic-two-params-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — /home/runner/work/vue-benchmarks/vue-benchmarks/work/confirm-typecheck-all/cases/generic-two-params-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 2 type argument(s).
- `typecheck/inherit-attrs-false-unknown/verter-tsc` — expected ≥1 error(s), got 0
- `typecheck/missing-required-prop/golar-typecheck` — expected ≥1 error(s), got 0
- `typecheck/slot-default-implicit-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/slot-provide-type-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/slot-unknown-prop-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/slot-v-bind-bad/verter-tsc` — plant at App.vue:13 did not mention one of: TS2322 \| TS2345 \| number \| string \| not assignable
- `typecheck/slot-v-bind-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/slot-v-bind-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/v-if-discriminant-ok/verter-tsc` — expected clean (0 errors), got 2

## Running

```bash
pnpm confirm:typecheck          # local: per-plant + all-plants
pnpm confirm --all              # CI: one typecheck spawn per tool
```

Writes `results/confirm.json`, `results/confirm.md`, and refreshes this file. A Benchmark dispatch on `main` commits this file and a README summary (`[skip ci]`).
