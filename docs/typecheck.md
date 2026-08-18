# Typecheck confirmation

This is the **correctness** suite for Vue typecheckers, not a throughput benchmark.
A tool is compatible only if it reports the planted error (or stays clean) on every plant.
vue-tsc (Volar) is the usual reference, but it is **not assumed perfect** — a plant it fails is a real gap and is listed as such.

Generated from `pnpm confirm:typecheck` at 2026-08-18T14:47:43.517Z on **Windows**.
- **Runner:** Windows · win32/x64 · 32 CPUs · AMD Ryzen 9 7950X 16-Core Processor · 127.2 GB · Node v26.5.0

On a **Benchmark** dispatch, Linux CI re-runs this and commits the file. Do not hand-edit the results.

## How plants are judged

- Each case is a tiny project under `tests/confirm/fixtures/typecheck/cases/<id>/`.
- Every tool runs on the **same shared tsconfig** (`strictTemplates: true`). Extra TypeScript flags that only one tool needs are **not** added globally.
- `expectErrors: false` — the fixture is clean. Any diagnostic is a fail. A diagnostic that names the tool's own virtual code (`__VLS_`, `___VERTER___`, …) is called out as a codegen leak.
- `expectErrors: true` — at least one error, matching `mustMatch` when set. Missing the plant is a fail.
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

- plants: **124**
- pass: **437** · fail: **41** · skip: **6** · warn: **12**
- wall clock + peak RSS per plant × tool: [Time and memory](#time-and-memory)

## Template narrowing

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`v-else-if-bad`](../tests/confirm/fixtures/typecheck/cases/v-else-if-bad/) | error | ✓ | ✓ | ✓ | ✓ | typeof === 'string' branch must reject number-only methods (toFixed) |
| [`v-else-if-ok`](../tests/confirm/fixtures/typecheck/cases/v-else-if-ok/) | clean | ✓ | ✓ | ✓ | ✓ | typeof guards on v-if / v-else-if narrow a string \| number union in the template |
| [`v-if-discriminant-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-discriminant-bad/) | error | ✓ | ✓ | ✓ | ✓ | After narrowing to kind === 'dog', accessing cat-only meow() must error |
| [`v-if-discriminant-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-discriminant-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | v-if on a tagged-union discriminant narrows each branch to the matching variant |
| [`v-if-else-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-else-bad/) | error | ✓ | ✓ | ✓ | ✓ | v-else branch must treat the nullable ref as null, so .name is an error |
| [`v-if-else-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-else-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if / v-else: narrowed user.name in the true branch, literal in the else |
| [`v-if-event-closure`](../tests/confirm/fixtures/typecheck/cases/v-if-event-closure/) | error | ✓ | ✓ | ✓ | ✓ | Script handler uses nullable ref without guard (event may run later) |
| [`v-if-inline-event-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-inline-event-bad/) | error | ✓ | ✓ | ✓ | ✓ | Inline @click reads .name on a nullable ref with no v-if guard |
| [`v-if-inline-event-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-inline-event-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if on an element narrows a nullable ref inside that element's @click and interpolation |
| [`v-if-narrow-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-narrow-bad/) | error | ✓ | ✓ | ✓ | ✓ | Access nullable ref property without v-if guard |
| [`v-if-narrow-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-narrow-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if should narrow ref union in template (clean) |
| [`v-if-not-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-not-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if="!user" / v-else must narrow the else branch to the object |
| [`v-if-optional-prop-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-optional-prop-bad/) | error | ✓ | ✓ | ✓ | ✓ | Optional prop used without v-if must report possibly undefined |
| [`v-if-optional-prop-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-optional-prop-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-if on an optional prop narrows it to string before toUpperCase |
| [`v-if-typeof-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-typeof-bad/) | error | ✓ | ✓ | ✓ | ✓ | string \| number without a typeof guard must reject toUpperCase |
| [`v-if-typeof-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-typeof-ok/) | clean | ✓ | ✓ | ✓ | ✓ | typeof === 'number' in v-if narrows a string \| number ref for toFixed |
| [`v-show-no-narrow`](../tests/confirm/fixtures/typecheck/cases/v-show-no-narrow/) | error | ✓ | ✓ | ✓ | ✓ | v-show does not narrow; reading .name on a nullable ref must still error |

## inheritAttrs + root shape

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`fallthrough-mono-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-mono-false-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs:false + single root: undeclared id must still error under fallthroughAttributes · *may warn if fallthroughAttributes is required* |
| [`fallthrough-mono-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-mono-ok/) | clean | ⚠ | ✓ | **✗**† | ⚠ | inheritAttrs default + single root: native id falls through (fallthroughAttributes) · *may warn if fallthroughAttributes is required* |
| [`fallthrough-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-multi-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs default + multi-root fragment: undeclared id must error (no single target) · *may warn if fallthroughAttributes is required* |
| [`fallthrough-multi-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-multi-false-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs:false + multi-root: undeclared id must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-native-type-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-native-type-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs default + single &lt;button&gt; root: fallthrough :disabled="string" must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-both-mono-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-both-mono-false-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs:false + v-if/v-else both single-root: undeclared id must still error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-both-mono-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-both-mono-ok/) | clean | ⚠ | ✓ | **✗**† | ⚠ | inheritAttrs default + v-if/v-else both single-root: id may fall through (always one root) · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-mono-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-mono-multi-bad/) | error | **✗**† | **✗**† | ✓ | **✗**† | inheritAttrs default + v-if mono / v-else multi-root: undeclared id must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-static-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-multi-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs default + v-if="true" whose branch is multi-root: undeclared id must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-static-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-ok/) | clean | ⚠ | ✓ | **✗**† | ⚠ | inheritAttrs default + v-if="true" (statically single root): id may fall through · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-static-prop-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-prop-ok/) | clean | ⚠ | ✓ | **✗**† | ⚠ | inheritAttrs default + v-if on a literal-true prop: statically single root, id may fall through · *may warn if fallthroughAttributes is required* |

## inheritAttrs / strictTemplates (no fallthrough typing)

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`attrs-aria-data-unknown`](../tests/confirm/fixtures/typecheck/cases/attrs-aria-data-unknown/) | error | ✓ | ○ | **✗**† | ✓ | Undeclared aria-*/data-* attributes on a component are not exempt from strictTemplates (isolates the root cause of inherit-attrs-false-unknown: the exemption is prefix-based, not inheritAttrs-based) |
| [`attrs-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/attrs-class-style-ok/) | clean | ✓ | ✓ | ✓ | ✓ | class/style on component are AllowedComponentProps (clean under strictTemplates) |
| [`attrs-unknown-fallthrough`](../tests/confirm/fixtures/typecheck/cases/attrs-unknown-fallthrough/) | error | ✓ | ○ | ✓ | ✓ | Non-declared attribute (id) on component errors under strictTemplates regardless of inheritAttrs |
| [`inherit-attrs-default-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-default-class-style-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Default inheritAttrs still allows class and style (AllowedComponentProps) |
| [`inherit-attrs-default-unknown`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-default-unknown/) | error | ✓ | ○ | ✓ | ✓ | Default inheritAttrs (no defineOptions) still errors on undeclared attrs under strictTemplates |
| [`inherit-attrs-false-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-false-class-style-ok/) | clean | ✓ | ✓ | ✓ | ✓ | inheritAttrs: false still allows class and style on the component |
| [`inherit-attrs-false-unknown`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-false-unknown/) | error | ✓ | ○ | **✗**† | ✓ | inheritAttrs:false still rejects unknown attrs at the call site under strictTemplates |
| [`unknown-prop-strict`](../tests/confirm/fixtures/typecheck/cases/unknown-prop-strict/) | error | ✓ | ○ | ✓ | ✓ | strictTemplates: undeclared prop on child component |

## Generics

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`generic-component-bad`](../tests/confirm/fixtures/typecheck/cases/generic-component-bad/) | error | ✓ | ✓ | ✓ | ✓ | Generic &lt;script setup&gt; component: `selected` must unify with the element type inferred from `items` |
| [`generic-component-ok`](../tests/confirm/fixtures/typecheck/cases/generic-component-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | generic="T extends { id: number }" on &lt;script setup&gt;; parent passes a consistent T (clean) |
| [`generic-constraint-template-bad`](../tests/confirm/fixtures/typecheck/cases/generic-constraint-template-bad/) | error | ✓ | ✓ | ✓ | ✓ | Inside a generic SFC, T extends { id: number } must reject item.name |
| [`generic-default-ok`](../tests/confirm/fixtures/typecheck/cases/generic-default-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic with a default type param (T = string) accepts a string value |
| [`generic-emit-bad`](../tests/confirm/fixtures/typecheck/cases/generic-emit-bad/) | error | ✓ | ✓ | ✓ | ✓ | Generic emit payload inferred as number must reject a string handler |
| [`generic-emit-ok`](../tests/confirm/fixtures/typecheck/cases/generic-emit-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic emit payload matches the inferred T from the value prop |
| [`generic-fallthrough-mono-ok`](../tests/confirm/fixtures/typecheck/cases/generic-fallthrough-mono-ok/) | clean | ⚠ | ✓ | **✗**† | ⚠ | Generic + inheritAttrs default + single root: native id falls through · *may warn if fallthroughAttributes is required* |
| [`generic-inherit-false-class-ok`](../tests/confirm/fixtures/typecheck/cases/generic-inherit-false-class-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic + inheritAttrs:false still allows class |
| [`generic-inherit-false-unknown`](../tests/confirm/fixtures/typecheck/cases/generic-inherit-false-unknown/) | error | ✓ | ○ | ✓ | ✓ | Generic + inheritAttrs:false: undeclared extra attr must error |
| [`generic-multi-root-ok`](../tests/confirm/fixtures/typecheck/cases/generic-multi-root-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic multi-root SFC with correct props stays clean (no extra attrs) |
| [`generic-slot-bad`](../tests/confirm/fixtures/typecheck/cases/generic-slot-bad/) | error | ✓ | **✗**† | ✓ | ✓ | Generic scoped slot: item.id (number) must reject a string-only consumer |
| [`generic-slot-ok`](../tests/confirm/fixtures/typecheck/cases/generic-slot-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic scoped slot exposes T so item.label is a string |
| [`generic-two-params-bad`](../tests/confirm/fixtures/typecheck/cases/generic-two-params-bad/) | error | ✓ | **✗**† | ✓ | ✓ | Two-param generic: slot payload inferred as number must reject a string-only consumer |
| [`generic-two-params-ok`](../tests/confirm/fixtures/typecheck/cases/generic-two-params-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic component with two type params and matching bindings |

## Emits

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`emit-ok`](../tests/confirm/fixtures/typecheck/cases/emit-ok/) | clean | ✓ | ✓ | ✓ | ✓ | defineEmits typed payload: correct event name and number arg |
| [`emit-unknown-event`](../tests/confirm/fixtures/typecheck/cases/emit-unknown-event/) | error | ✓ | ✓ | ✓ | ✓ | emit() of an undeclared event name must error |
| [`emit-wrong-arg`](../tests/confirm/fixtures/typecheck/cases/emit-wrong-arg/) | error | ✓ | ✓ | ✓ | ✓ | emit('change', string) where the payload is typed as number |
| [`event-emit-payload`](../tests/confirm/fixtures/typecheck/cases/event-emit-payload/) | error | ✓ | ✓ | ✓ | ✓ | Listener receives wrong payload type for typed emit |

## Native events / $event / modifiers

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`dollar-event-bad`](../tests/confirm/fixtures/typecheck/cases/dollar-event-bad/) | error | ✓ | ✓ | ✓ | ✓ | $event on native @click must reject an unknown method |
| [`dollar-event-ok`](../tests/confirm/fixtures/typecheck/cases/dollar-event-ok/) | clean | ✓ | ✓ | ✓ | ✓ | $event on native @click is a MouseEvent and has preventDefault |
| [`element-prop-type`](../tests/confirm/fixtures/typecheck/cases/element-prop-type/) | error | ✓ | ✓ | ✓ | ✓ | Native element / event handler type error in template |
| [`event-mod-click-ctrl-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-ctrl-ok/) | clean | ✓ | ✓ | ✓ | ✓ | System modifier @click.ctrl is still a MouseEvent handler (clean) |
| [`event-mod-click-prevent-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-bad/) | error | ✓ | ✓ | ✓ | ✓ | .prevent does not change @click from MouseEvent to KeyboardEvent |
| [`event-mod-click-prevent-dollar-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-dollar-bad/) | error | ✓ | ✓ | ✓ | ✓ | $event on @click.prevent is still MouseEvent (no .key) |
| [`event-mod-click-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-ok/) | clean | ✓ | ✓ | ✓ | ✓ | @click.prevent keeps the native MouseEvent handler type (clean) |
| [`event-mod-click-stop-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-stop-prevent-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Chained @click.stop.prevent is still a MouseEvent handler (clean) |
| [`event-mod-component-once-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-component-once-bad/) | error | ✓ | ✓ | ✓ | ✓ | .once on a component emit does not erase the payload type |
| [`event-mod-component-once-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-component-once-ok/) | clean | ✓ | ✓ | ✓ | ✓ | @change.once on a typed emit still receives the number payload (clean) |
| [`event-mod-keyup-enter-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-keyup-enter-bad/) | error | ✓ | ✓ | ✓ | ✓ | @keyup.enter is still KeyboardEvent; a MouseEvent handler must error |
| [`event-mod-keyup-enter-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-keyup-enter-ok/) | clean | ✓ | ✓ | ✓ | ✓ | @keyup.enter keeps KeyboardEvent (key modifiers are not event-type rewrites) |
| [`event-mod-submit-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-submit-prevent-ok/) | clean | ✓ | ✓ | ✓ | ✓ | @submit.prevent accepts an Event handler (clean) |
| [`native-keyup-bad`](../tests/confirm/fixtures/typecheck/cases/native-keyup-bad/) | error | ✓ | ✓ | ✓ | ✓ | @keyup handler typed as MouseEvent must not accept a KeyboardEvent |

## v-model / defineModel

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`define-model-default-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-default-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Unnamed defineModel&lt;string&gt; accepts v-model on a string ref (clean) |
| [`define-model-get-set-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-get-set-ok/) | clean | ✓ | ✓ | ✓ | ✓ | defineModel get/set transformers whose in/out types match T stay clean |
| [`define-model-modifiers-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-ok/) | clean | ✓ | **✗**† | **✗**† | ✓ | defineModel&lt;string, 'trim' \| 'capitalize'&gt; + v-model.trim; child reads modifiers.trim (clean) |
| [`define-model-modifiers-read-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-read-bad/) | error | ✓ | **✗**† | **✗**† | ✓ | Reading modifiers.nope must error when the union is 'trim' \| 'capitalize' |
| [`define-model-modifiers-unknown-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-unknown-bad/) | error | ✓ | **✗**† | ✓ | ✓ | v-model.nope must error when defineModel only declares 'trim' \| 'capitalize' |
| [`define-model-named`](../tests/confirm/fixtures/typecheck/cases/define-model-named/) | error | ✓ | ✓ | ✓ | ✓ | Named defineModel: v-model:title must be typechecked against the declared model type |
| [`define-model-named-modifiers-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-named-modifiers-ok/) | clean | ✓ | **✗**† | **✗**† | ✓ | Named defineModel + v-model:title.trim matches the declared modifier (clean) |
| [`define-model-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Named defineModel bindings with matching ref types stay clean |
| [`define-model-set-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-set-bad/) | error | ✓ | ✓ | ✓ | ✓ | defineModel&lt;number&gt; set() must not call string-only methods on the value |
| [`native-input-v-model-ok`](../tests/confirm/fixtures/typecheck/cases/native-input-v-model-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Native &lt;input&gt; v-model accepts a string ref |
| [`native-v-model-lazy-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-lazy-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Native &lt;input v-model.lazy&gt; accepts a string ref (clean) |
| [`native-v-model-number-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-number-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Native &lt;input v-model.number&gt; accepts a number ref (clean) |
| [`native-v-model-trim-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-trim-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Native &lt;input v-model.trim&gt; accepts a string ref (clean) |
| [`v-model-type`](../tests/confirm/fixtures/typecheck/cases/v-model-type/) | error | ✓ | ✓ | ✓ | ✓ | v-model type mismatch between parent ref and child model |

## Slots

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`define-slots-default-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-default-ok/) | clean | ✓ | ✓ | ✓ | ✓ | defineSlots default props flow into the parent's #default destructure (clean) |
| [`define-slots-fn-bad`](../tests/confirm/fixtures/typecheck/cases/define-slots-fn-bad/) | error | ✓ | ✓ | ✓ | ✓ | Slot callback typed (id: number) =&gt; void must reject a string argument |
| [`define-slots-fn-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-fn-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Slot callback prop (id: number) =&gt; void called with a number (clean) |
| [`define-slots-named-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-named-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Named + default defineSlots used at their declared payload types (clean) |
| [`slot-default-implicit-ok`](../tests/confirm/fixtures/typecheck/cases/slot-default-implicit-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Default slot without defineSlots accepts parent children (clean) |
| [`slot-provide-type-bad`](../tests/confirm/fixtures/typecheck/cases/slot-provide-type-bad/) | error | ✓ | **✗**† | ✓ | ✓ | Child &lt;slot :msg=number&gt; must error when defineSlots says msg: string |
| [`slot-provide-type-ok`](../tests/confirm/fixtures/typecheck/cases/slot-provide-type-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Child &lt;slot :msg&gt; matches defineSlots default payload (clean) |
| [`slot-scope-ok`](../tests/confirm/fixtures/typecheck/cases/slot-scope-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Scoped slot payload destructured and used at its declared type (clean) |
| [`slot-scope-payload`](../tests/confirm/fixtures/typecheck/cases/slot-scope-payload/) | error | ✓ | ✓ | ✓ | ✓ | Scoped slot payload type must flow into the parent's v-slot destructuring |
| [`slot-unknown-prop-bad`](../tests/confirm/fixtures/typecheck/cases/slot-unknown-prop-bad/) | error | ✓ | **✗**† | ✓ | ✓ | Scoped slot destructure must reject a property that is not on the payload |
| [`slot-v-bind-bad`](../tests/confirm/fixtures/typecheck/cases/slot-v-bind-bad/) | error | ✓ | **✗**† | **✗**† | ✓ | Child &lt;slot v-bind&gt; with item.id: string must not satisfy id: number |
| [`slot-v-bind-ok`](../tests/confirm/fixtures/typecheck/cases/slot-v-bind-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Child slot v-bind object whose fields match defineSlots stays clean |

## Props / v-bind

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`boolean-prop-attr-ok`](../tests/confirm/fixtures/typecheck/cases/boolean-prop-attr-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Boolean presence attribute `&lt;Child enabled /&gt;` satisfies enabled: boolean |
| [`literal-union-prop-bad`](../tests/confirm/fixtures/typecheck/cases/literal-union-prop-bad/) | error | ✓ | ✓ | ✓ | ✓ | Static attribute value outside the declared string-literal union must error |
| [`literal-union-prop-ok`](../tests/confirm/fixtures/typecheck/cases/literal-union-prop-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Static attribute value must narrow to a string literal type for a union prop (clean) |
| [`missing-required-prop`](../tests/confirm/fixtures/typecheck/cases/missing-required-prop/) | error | ✓ | ✓ | ✓ | **✗**† | Omitting a required child prop must error |
| [`static-number-attr-bad`](../tests/confirm/fixtures/typecheck/cases/static-number-attr-bad/) | error | ✓ | ✓ | ✓ | ✓ | Static attribute count="1" is a string and must not satisfy count: number |
| [`v-bind-object-bad`](../tests/confirm/fixtures/typecheck/cases/v-bind-object-bad/) | error | ✓ | ✓ | ✓ | ✓ | v-bind object with count: string must not satisfy count: number |
| [`v-bind-object-ok`](../tests/confirm/fixtures/typecheck/cases/v-bind-object-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-bind="object" whose fields match the child props is clean |
| [`with-defaults-ok`](../tests/confirm/fixtures/typecheck/cases/with-defaults-ok/) | clean | ✓ | ✓ | ✓ | ✓ | withDefaults makes an optional prop defined in the template (toUpperCase is safe) |
| [`wrong-prop-type`](../tests/confirm/fixtures/typecheck/cases/wrong-prop-type/) | error | ✓ | ✓ | ✓ | ✓ | Pass string where child prop expects number |

## Refs / expose / unwrap

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`component-ref-expose-bad`](../tests/confirm/fixtures/typecheck/cases/component-ref-expose-bad/) | error | ✓ | **✗**† | ✓ | ✓ | Calling a method that was not defineExpose'd on a component template ref must error |
| [`component-ref-expose-ok`](../tests/confirm/fixtures/typecheck/cases/component-ref-expose-ok/) | clean | ✓ | ✓ | ✓ | ✓ | useTemplateRef on a child can call a method declared in defineExpose |
| [`computed-unwrap-ok`](../tests/confirm/fixtures/typecheck/cases/computed-unwrap-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Template auto-unwraps a computed number so toFixed is valid |
| [`ref-unwrap-bad`](../tests/confirm/fixtures/typecheck/cases/ref-unwrap-bad/) | error | ✓ | ✓ | ✓ | ✓ | Auto-unwrapped number ref must reject string methods in the template |
| [`ref-unwrap-ok`](../tests/confirm/fixtures/typecheck/cases/ref-unwrap-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Template auto-unwraps a number ref so count + 1 is valid |
| [`template-ref-type`](../tests/confirm/fixtures/typecheck/cases/template-ref-type/) | error | ✓ | ✓ | ✓ | ✓ | useTemplateRef element type must be enforced on member access |

## Script / inject / options API

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`async-setup-await`](../tests/confirm/fixtures/typecheck/cases/async-setup-await/) | clean | ✓ | ✓ | ✓ | ✓ | Top-level await in &lt;script setup&gt; must typecheck cleanly (async setup wrapper) |
| [`inject-key-type`](../tests/confirm/fixtures/typecheck/cases/inject-key-type/) | error | ✓ | ✓ | ✓ | ✓ | inject(InjectionKey) without a default is possibly undefined |
| [`options-api-prop-bad`](../tests/confirm/fixtures/typecheck/cases/options-api-prop-bad/) | error | ✓ | ✓ | ✓ | ✓ | Options API: assigning this.count (number) to a string must error |
| [`provide-inject-ok`](../tests/confirm/fixtures/typecheck/cases/provide-inject-ok/) | clean | ✓ | ✓ | ✓ | ✓ | inject(key, default) is a definite string when the default is provided |
| [`script-type-error`](../tests/confirm/fixtures/typecheck/cases/script-type-error/) | error | ✓ | ✓ | ✓ | ✓ | Planted TS error in &lt;script setup&gt; |

## .ts imports .vue

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`ts-import-vue-bad`](../tests/confirm/fixtures/typecheck/cases/ts-import-vue-bad/) | clean | ✓ | ✓ | ⚠ | ✓ | .ts file imports an SFC; @ts-expect-error on a string assigned to a number prop (unused if the import is any) |
| [`ts-import-vue-ok`](../tests/confirm/fixtures/typecheck/cases/ts-import-vue-ok/) | clean | ✓ | ✓ | ⚠ | ✓ | .ts file imports an SFC and passes correctly typed props |

## Other

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`clean-basic`](../tests/confirm/fixtures/typecheck/cases/clean-basic/) | clean | ✓ | ✓ | ✓ | ✓ | Valid script + template; no intentional errors |
| [`optional-chain-bad`](../tests/confirm/fixtures/typecheck/cases/optional-chain-bad/) | error | ✓ | ✓ | ✓ | ✓ | Unguarded member access on an optional property inside a template expression |
| [`optional-chain-ok`](../tests/confirm/fixtures/typecheck/cases/optional-chain-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Optional chaining + nullish coalescing inside template expressions (clean) |
| [`style-binding-bad`](../tests/confirm/fixtures/typecheck/cases/style-binding-bad/) | error | ✓ | ✓ | ✓ | ✓ | :style bound to a number must error |
| [`template-undefined`](../tests/confirm/fixtures/typecheck/cases/template-undefined/) | error | ✓ | ✓ | ✓ | ✓ | Planted unknown identifier in &lt;template&gt; |
| [`v-for-destructure-ok`](../tests/confirm/fixtures/typecheck/cases/v-for-destructure-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Destructured v-for bindings keep their field types |
| [`v-for-item-type`](../tests/confirm/fixtures/typecheck/cases/v-for-item-type/) | error | ✓ | ✓ | ✓ | ✓ | v-for alias must carry the array element type into template expressions |
| [`v-for-ok`](../tests/confirm/fixtures/typecheck/cases/v-for-ok/) | clean | ✓ | ✓ | ✓ | ✓ | v-for item/index types and a nested v-for used correctly (clean) |

## Documented gaps (†)

These fails are real. They are allow-listed only so the PR gate stays a useful signal; the cell still shows **✗**.

- `typecheck/attrs-aria-data-unknown/verter-tsc` — expected ≥1 error(s), got 0
- `typecheck/component-ref-expose-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/define-model-modifiers-ok/verter-tsc` — expected clean (0 errors), got 2
- `typecheck/define-model-modifiers-ok/vize-check` — expected clean (0 errors), got 2
- `typecheck/define-model-modifiers-read-bad/verter-tsc` — expected diagnostics to match one of: TS2339 \| TS2551 \| nope (got 1 error lines)
- `typecheck/define-model-modifiers-read-bad/vize-check` — expected diagnostics to match one of: TS2339 \| TS2551 \| nope (got 2 error lines)
- `typecheck/define-model-modifiers-unknown-bad/vize-check` — expected diagnostics to match one of: TS2353 \| TS2322 \| TS2345 \| nope \| trim \| capitalize (got 2 error lines)
- `typecheck/define-model-named-modifiers-ok/verter-tsc` — expected clean (0 errors), got 2
- `typecheck/define-model-named-modifiers-ok/vize-check` — expected clean (0 errors), got 2
- `typecheck/fallthrough-mono-false-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-mono-ok/verter-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected clean (0 errors), got 1.
- `typecheck/fallthrough-multi-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-multi-false-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-native-type-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-both-mono-false-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-both-mono-ok/verter-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected clean (0 errors), got 1.
- `typecheck/fallthrough-vif-mono-multi-bad/golar-typecheck` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. On the shared tsconfig the plant appeared to pass (undeclared attrs always error under default strictTemplates). With fallthroughAttributes the plant was missed: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-mono-multi-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-mono-multi-bad/vue-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. On the shared tsconfig the plant appeared to pass (undeclared attrs always error under default strictTemplates). With fallthroughAttributes the plant was missed: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-static-multi-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-static-ok/verter-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected clean (0 errors), got 1.
- `typecheck/fallthrough-vif-static-prop-ok/verter-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected clean (0 errors), got 1.
- `typecheck/generic-component-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — D:/dev/personal/vue-benchmarks/work/confirm-typecheck/generic-component-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s).
- `typecheck/generic-default-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — D:/dev/personal/vue-benchmarks/work/confirm-typecheck/generic-default-ok/Child.vue(1,1): error TS2315: Type '___VERTER___attributes' is not generic.
- `typecheck/generic-emit-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — D:/dev/personal/vue-benchmarks/work/confirm-typecheck/generic-emit-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s).
- `typecheck/generic-fallthrough-mono-ok/verter-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: clean fixture: diagnostic describes the tool's own generated code — D:/dev/personal/vue-benchmarks/work/confirm-typecheck/generic-fallthrough-mono-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s)..
- `typecheck/generic-inherit-false-class-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — D:/dev/personal/vue-benchmarks/work/confirm-typecheck/generic-inherit-false-class-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s).
- `typecheck/generic-multi-root-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — D:/dev/personal/vue-benchmarks/work/confirm-typecheck/generic-multi-root-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s).
- `typecheck/generic-slot-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/generic-slot-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — D:/dev/personal/vue-benchmarks/work/confirm-typecheck/generic-slot-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 1 type argument(s).
- `typecheck/generic-two-params-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/generic-two-params-ok/verter-tsc` — clean fixture: diagnostic describes the tool's own generated code — D:/dev/personal/vue-benchmarks/work/confirm-typecheck/generic-two-params-ok/Child.vue(1,1): error TS2314: Generic type '___VERTER___Attrs' requires 2 type argument(s).
- `typecheck/inherit-attrs-false-unknown/verter-tsc` — expected ≥1 error(s), got 0
- `typecheck/missing-required-prop/golar-typecheck` — expected ≥1 error(s), got 0
- `typecheck/slot-default-implicit-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/slot-provide-type-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/slot-unknown-prop-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/slot-v-bind-bad/verter-tsc` — expected diagnostics to match one of: TS2322 \| TS2345 \| number \| string \| not assignable (got 1 error lines)
- `typecheck/slot-v-bind-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/slot-v-bind-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/v-if-discriminant-ok/verter-tsc` — expected clean (0 errors), got 2

## Disclosed extra harness behaviour

- `typecheck/fallthrough-mono-ok/vue-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean.
- `typecheck/fallthrough-mono-ok/golar-typecheck` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean.
- `typecheck/fallthrough-vif-both-mono-ok/vue-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean.
- `typecheck/fallthrough-vif-both-mono-ok/golar-typecheck` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean.
- `typecheck/fallthrough-vif-static-ok/vue-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean.
- `typecheck/fallthrough-vif-static-ok/golar-typecheck` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean.
- `typecheck/fallthrough-vif-static-prop-ok/vue-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean.
- `typecheck/fallthrough-vif-static-prop-ok/golar-typecheck` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean.
- `typecheck/generic-fallthrough-mono-ok/vue-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean.
- `typecheck/generic-fallthrough-mono-ok/golar-typecheck` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean.
- `typecheck/ts-import-vue-bad/verter-tsc` — EXTRA TSCONFIG — verter-tsc did not typecheck main.ts (a .ts importer of a .vue SFC) on the shared tsconfig the other tools use. Retried with allowArbitraryExtensions + allowImportingTsExtensions (other tools do not need these). Retry still only checked .vue files — the plant in main.ts was not exercised.
- `typecheck/ts-import-vue-ok/verter-tsc` — EXTRA TSCONFIG — verter-tsc did not typecheck main.ts (a .ts importer of a .vue SFC) on the shared tsconfig the other tools use. Retried with allowArbitraryExtensions + allowImportingTsExtensions (other tools do not need these). Retry still only checked .vue files — the plant in main.ts was not exercised.

## Time and memory

This table is from **Windows**. Rows from another machine are not comparable. Published figures come from a Benchmark workflow Linux run.

One spawn per cell on the **shared** tsconfig. Wall clock is spawn → exit (not a ranked throughput number: no warmup, one run, tiny fixtures). RSS uses the same method as `pnpm bench:memory`:

- Linux / macOS: poll `pidTreeRssBytes` (`/proc` or `ps` + children); Linux also folds in `VmHWM`
- Windows: PowerShell `Process.Start` samples `WorkingSet64` in-process and folds in `PeakWorkingSet64`

FallthroughAttributes retries and other extra-config runs are **not** in this table. Skip cells are –. Do not compare these to the `typecheck` throughput surface in the README.

| Case | vue-tsc | vize | verter-tsc | golar |
| --- | --- | --- | --- | --- |
| [`async-setup-await`](../tests/confirm/fixtures/typecheck/cases/async-setup-await/) | 1.23s / 264MB | 403ms / 78MB | 526ms / 73MB | 633ms / 226MB |
| [`attrs-aria-data-unknown`](../tests/confirm/fixtures/typecheck/cases/attrs-aria-data-unknown/) | 1.23s / 262MB | – | 633ms / 69MB | 629ms / 224MB |
| [`attrs-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/attrs-class-style-ok/) | 1.28s / 277MB | 407ms / 78MB | 705ms / 69MB | 641ms / 228MB |
| [`attrs-unknown-fallthrough`](../tests/confirm/fixtures/typecheck/cases/attrs-unknown-fallthrough/) | 1.11s / 266MB | – | 608ms / 69MB | 747ms / 225MB |
| [`boolean-prop-attr-ok`](../tests/confirm/fixtures/typecheck/cases/boolean-prop-attr-ok/) | 1.54s / 266MB | 424ms / 78MB | 717ms / 69MB | 724ms / 233MB |
| [`clean-basic`](../tests/confirm/fixtures/typecheck/cases/clean-basic/) | 1.27s / 263MB | 412ms / 78MB | 605ms / 69MB | 663ms / 228MB |
| [`component-ref-expose-bad`](../tests/confirm/fixtures/typecheck/cases/component-ref-expose-bad/) | 1.22s / 263MB | 420ms / 78MB | 668ms / 69MB | 731ms / 234MB |
| [`component-ref-expose-ok`](../tests/confirm/fixtures/typecheck/cases/component-ref-expose-ok/) | 1.15s / 266MB | 421ms / 78MB | 596ms / 69MB | 643ms / 231MB |
| [`computed-unwrap-ok`](../tests/confirm/fixtures/typecheck/cases/computed-unwrap-ok/) | 1.24s / 264MB | 442ms / 78MB | 735ms / 69MB | 673ms / 230MB |
| [`define-model-default-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-default-ok/) | 1.17s / 262MB | 418ms / 79MB | 706ms / 69MB | 577ms / 232MB |
| [`define-model-get-set-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-get-set-ok/) | 1.32s / 261MB | 426ms / 78MB | 706ms / 69MB | 666ms / 221MB |
| [`define-model-modifiers-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-ok/) | 1.29s / 276MB | 417ms / 78MB | 681ms / 69MB | 611ms / 224MB |
| [`define-model-modifiers-read-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-read-bad/) | 1.32s / 265MB | 395ms / 78MB | 617ms / 69MB | 696ms / 232MB |
| [`define-model-modifiers-unknown-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-unknown-bad/) | 1.09s / 255MB | 425ms / 79MB | 666ms / 69MB | 681ms / 229MB |
| [`define-model-named`](../tests/confirm/fixtures/typecheck/cases/define-model-named/) | 1.41s / 264MB | 672ms / 79MB | 893ms / 69MB | 601ms / 237MB |
| [`define-model-named-modifiers-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-named-modifiers-ok/) | 1.12s / 263MB | 351ms / 78MB | 642ms / 69MB | 573ms / 232MB |
| [`define-model-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-ok/) | 1.22s / 262MB | 480ms / 78MB | 595ms / 69MB | 534ms / 234MB |
| [`define-model-set-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-set-bad/) | 1.07s / 261MB | 337ms / 78MB | 662ms / 69MB | 628ms / 226MB |
| [`define-slots-default-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-default-ok/) | 1.21s / 266MB | 417ms / 78MB | 755ms / 69MB | 764ms / 237MB |
| [`define-slots-fn-bad`](../tests/confirm/fixtures/typecheck/cases/define-slots-fn-bad/) | 1.10s / 268MB | 367ms / 79MB | 652ms / 69MB | 520ms / 231MB |
| [`define-slots-fn-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-fn-ok/) | 1.41s / 277MB | 420ms / 79MB | 641ms / 69MB | 688ms / 225MB |
| [`define-slots-named-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-named-ok/) | 1.30s / 264MB | 384ms / 78MB | 573ms / 69MB | 705ms / 233MB |
| [`dollar-event-bad`](../tests/confirm/fixtures/typecheck/cases/dollar-event-bad/) | 1.69s / 267MB | 472ms / 82MB | 1.22s / 73MB | 625ms / 227MB |
| [`dollar-event-ok`](../tests/confirm/fixtures/typecheck/cases/dollar-event-ok/) | 1.29s / 298MB | 362ms / 81MB | 662ms / 73MB | 638ms / 223MB |
| [`element-prop-type`](../tests/confirm/fixtures/typecheck/cases/element-prop-type/) | 1.36s / 268MB | 404ms / 82MB | 714ms / 73MB | 604ms / 225MB |
| [`emit-ok`](../tests/confirm/fixtures/typecheck/cases/emit-ok/) | 1.29s / 265MB | 439ms / 82MB | 645ms / 73MB | 713ms / 230MB |
| [`emit-unknown-event`](../tests/confirm/fixtures/typecheck/cases/emit-unknown-event/) | 1.47s / 265MB | 607ms / 82MB | 681ms / 73MB | 773ms / 227MB |
| [`emit-wrong-arg`](../tests/confirm/fixtures/typecheck/cases/emit-wrong-arg/) | 1.27s / 249MB | 386ms / 82MB | 609ms / 73MB | 814ms / 230MB |
| [`event-emit-payload`](../tests/confirm/fixtures/typecheck/cases/event-emit-payload/) | 1.39s / 265MB | 570ms / 82MB | 757ms / 73MB | 896ms / 228MB |
| [`event-mod-click-ctrl-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-ctrl-ok/) | 1.08s / 261MB | 359ms / 78MB | 561ms / 69MB | 708ms / 230MB |
| [`event-mod-click-prevent-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-bad/) | 1.18s / 261MB | 372ms / 78MB | 1.13s / 69MB | 980ms / 227MB |
| [`event-mod-click-prevent-dollar-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-dollar-bad/) | 1.20s / 263MB | 412ms / 79MB | 567ms / 69MB | 541ms / 230MB |
| [`event-mod-click-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-ok/) | 1.13s / 259MB | 439ms / 78MB | 698ms / 69MB | 632ms / 229MB |
| [`event-mod-click-stop-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-stop-prevent-ok/) | 1.18s / 261MB | 332ms / 82MB | 608ms / 73MB | 635ms / 228MB |
| [`event-mod-component-once-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-component-once-bad/) | 1.22s / 261MB | 424ms / 78MB | 702ms / 69MB | 657ms / 235MB |
| [`event-mod-component-once-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-component-once-ok/) | 1.52s / 260MB | 407ms / 79MB | 587ms / 69MB | 678ms / 234MB |
| [`event-mod-keyup-enter-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-keyup-enter-bad/) | 1.16s / 264MB | 439ms / 78MB | 739ms / 69MB | 612ms / 227MB |
| [`event-mod-keyup-enter-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-keyup-enter-ok/) | 1.11s / 274MB | 386ms / 78MB | 506ms / 69MB | 523ms / 232MB |
| [`event-mod-submit-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-submit-prevent-ok/) | 1.15s / 295MB | 369ms / 78MB | 642ms / 69MB | 647ms / 215MB |
| [`fallthrough-mono-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-mono-false-bad/) | 1.32s / 265MB | 473ms / 78MB | 586ms / 69MB | 618ms / 231MB |
| [`fallthrough-mono-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-mono-ok/) | 1.25s / 274MB | 422ms / 79MB | 632ms / 69MB | 615ms / 230MB |
| [`fallthrough-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-multi-bad/) | 1.28s / 259MB | 462ms / 79MB | 715ms / 69MB | 647ms / 237MB |
| [`fallthrough-multi-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-multi-false-bad/) | 1.12s / 264MB | 510ms / 78MB | 620ms / 69MB | 659ms / 232MB |
| [`fallthrough-native-type-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-native-type-bad/) | 1.19s / 263MB | 470ms / 79MB | 788ms / 69MB | 735ms / 237MB |
| [`fallthrough-vif-both-mono-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-both-mono-false-bad/) | 8.98s / 267MB | 885ms / 83MB | 2.42s / 73MB | 955ms / 227MB |
| [`fallthrough-vif-both-mono-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-both-mono-ok/) | 1.85s / 270MB | 471ms / 83MB | 990ms / 73MB | 866ms / 229MB |
| [`fallthrough-vif-mono-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-mono-multi-bad/) | 1.98s / 280MB | 425ms / 79MB | 631ms / 69MB | 775ms / 231MB |
| [`fallthrough-vif-static-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-multi-bad/) | 1.30s / 266MB | 653ms / 79MB | 720ms / 69MB | 712ms / 220MB |
| [`fallthrough-vif-static-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-ok/) | 1.68s / 265MB | 445ms / 78MB | 643ms / 69MB | 797ms / 231MB |
| [`fallthrough-vif-static-prop-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-prop-ok/) | 1.25s / 262MB | 474ms / 79MB | 688ms / 69MB | 691ms / 232MB |
| [`generic-component-bad`](../tests/confirm/fixtures/typecheck/cases/generic-component-bad/) | 1.45s / 265MB | 442ms / 79MB | 743ms / 69MB | 692ms / 228MB |
| [`generic-component-ok`](../tests/confirm/fixtures/typecheck/cases/generic-component-ok/) | 1.55s / 296MB | 438ms / 79MB | 676ms / 69MB | 647ms / 221MB |
| [`generic-constraint-template-bad`](../tests/confirm/fixtures/typecheck/cases/generic-constraint-template-bad/) | 1.39s / 265MB | 448ms / 78MB | 707ms / 69MB | 760ms / 226MB |
| [`generic-default-ok`](../tests/confirm/fixtures/typecheck/cases/generic-default-ok/) | 1.43s / 258MB | 466ms / 79MB | 675ms / 69MB | 682ms / 225MB |
| [`generic-emit-bad`](../tests/confirm/fixtures/typecheck/cases/generic-emit-bad/) | 1.26s / 267MB | 1.13s / 82MB | 8.34s / 73MB | 2.98s / 237MB |
| [`generic-emit-ok`](../tests/confirm/fixtures/typecheck/cases/generic-emit-ok/) | 1.99s / 268MB | 1.12s / 83MB | 1.18s / 73MB | 881ms / 234MB |
| [`generic-fallthrough-mono-ok`](../tests/confirm/fixtures/typecheck/cases/generic-fallthrough-mono-ok/) | 1.70s / 266MB | 382ms / 78MB | 639ms / 69MB | 582ms / 233MB |
| [`generic-inherit-false-class-ok`](../tests/confirm/fixtures/typecheck/cases/generic-inherit-false-class-ok/) | 1.08s / 261MB | 385ms / 79MB | 533ms / 69MB | 578ms / 232MB |
| [`generic-inherit-false-unknown`](../tests/confirm/fixtures/typecheck/cases/generic-inherit-false-unknown/) | 975ms / 263MB | – | 501ms / 69MB | 490ms / 223MB |
| [`generic-multi-root-ok`](../tests/confirm/fixtures/typecheck/cases/generic-multi-root-ok/) | 1.19s / 262MB | 318ms / 79MB | 550ms / 69MB | 571ms / 225MB |
| [`generic-slot-bad`](../tests/confirm/fixtures/typecheck/cases/generic-slot-bad/) | 1.03s / 279MB | 322ms / 79MB | 518ms / 69MB | 525ms / 229MB |
| [`generic-slot-ok`](../tests/confirm/fixtures/typecheck/cases/generic-slot-ok/) | 985ms / 266MB | 330ms / 78MB | 600ms / 69MB | 590ms / 223MB |
| [`generic-two-params-bad`](../tests/confirm/fixtures/typecheck/cases/generic-two-params-bad/) | 995ms / 263MB | 264ms / 79MB | 535ms / 69MB | 544ms / 233MB |
| [`generic-two-params-ok`](../tests/confirm/fixtures/typecheck/cases/generic-two-params-ok/) | 994ms / 261MB | 291ms / 79MB | 512ms / 69MB | 571ms / 224MB |
| [`inherit-attrs-default-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-default-class-style-ok/) | 988ms / 282MB | 295ms / 78MB | 494ms / 69MB | 523ms / 224MB |
| [`inherit-attrs-default-unknown`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-default-unknown/) | 1.02s / 263MB | – | 575ms / 69MB | 524ms / 234MB |
| [`inherit-attrs-false-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-false-class-style-ok/) | 1.01s / 262MB | 317ms / 79MB | 531ms / 69MB | 491ms / 234MB |
| [`inherit-attrs-false-unknown`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-false-unknown/) | 1.10s / 262MB | – | 586ms / 69MB | 521ms / 224MB |
| [`inject-key-type`](../tests/confirm/fixtures/typecheck/cases/inject-key-type/) | 931ms / 263MB | 264ms / 78MB | 474ms / 69MB | 515ms / 227MB |
| [`literal-union-prop-bad`](../tests/confirm/fixtures/typecheck/cases/literal-union-prop-bad/) | 977ms / 274MB | 355ms / 79MB | 576ms / 69MB | 546ms / 224MB |
| [`literal-union-prop-ok`](../tests/confirm/fixtures/typecheck/cases/literal-union-prop-ok/) | 907ms / 263MB | 310ms / 79MB | 473ms / 69MB | 538ms / 239MB |
| [`missing-required-prop`](../tests/confirm/fixtures/typecheck/cases/missing-required-prop/) | 1.25s / 276MB | 303ms / 78MB | 542ms / 69MB | 587ms / 234MB |
| [`native-input-v-model-ok`](../tests/confirm/fixtures/typecheck/cases/native-input-v-model-ok/) | 1.05s / 260MB | 265ms / 78MB | 818ms / 69MB | 1.02s / 228MB |
| [`native-keyup-bad`](../tests/confirm/fixtures/typecheck/cases/native-keyup-bad/) | 1.36s / 264MB | 337ms / 79MB | 595ms / 69MB | 547ms / 229MB |
| [`native-v-model-lazy-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-lazy-ok/) | 927ms / 251MB | 293ms / 78MB | 481ms / 69MB | 508ms / 229MB |
| [`native-v-model-number-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-number-ok/) | 1.05s / 262MB | 297ms / 78MB | 531ms / 69MB | 542ms / 229MB |
| [`native-v-model-trim-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-trim-ok/) | 1.04s / 261MB | 294ms / 78MB | 516ms / 69MB | 511ms / 230MB |
| [`optional-chain-bad`](../tests/confirm/fixtures/typecheck/cases/optional-chain-bad/) | 1.02s / 262MB | 304ms / 78MB | 638ms / 69MB | 512ms / 229MB |
| [`optional-chain-ok`](../tests/confirm/fixtures/typecheck/cases/optional-chain-ok/) | 943ms / 264MB | 309ms / 78MB | 457ms / 69MB | 510ms / 230MB |
| [`options-api-prop-bad`](../tests/confirm/fixtures/typecheck/cases/options-api-prop-bad/) | 966ms / 265MB | 303ms / 78MB | 563ms / 69MB | 549ms / 229MB |
| [`provide-inject-ok`](../tests/confirm/fixtures/typecheck/cases/provide-inject-ok/) | 896ms / 276MB | 250ms / 78MB | 475ms / 69MB | 515ms / 230MB |
| [`ref-unwrap-bad`](../tests/confirm/fixtures/typecheck/cases/ref-unwrap-bad/) | 1.13s / 259MB | 337ms / 78MB | 519ms / 69MB | 536ms / 226MB |
| [`ref-unwrap-ok`](../tests/confirm/fixtures/typecheck/cases/ref-unwrap-ok/) | 853ms / 296MB | 287ms / 78MB | 434ms / 69MB | 504ms / 227MB |
| [`script-type-error`](../tests/confirm/fixtures/typecheck/cases/script-type-error/) | 960ms / 255MB | 268ms / 78MB | 471ms / 69MB | 472ms / 224MB |
| [`slot-default-implicit-ok`](../tests/confirm/fixtures/typecheck/cases/slot-default-implicit-ok/) | 895ms / 282MB | 282ms / 78MB | 502ms / 69MB | 448ms / 228MB |
| [`slot-provide-type-bad`](../tests/confirm/fixtures/typecheck/cases/slot-provide-type-bad/) | 1.08s / 262MB | 456ms / 78MB | 1.37s / 69MB | 608ms / 235MB |
| [`slot-provide-type-ok`](../tests/confirm/fixtures/typecheck/cases/slot-provide-type-ok/) | 1.10s / 266MB | 302ms / 78MB | 447ms / 69MB | 497ms / 224MB |
| [`slot-scope-ok`](../tests/confirm/fixtures/typecheck/cases/slot-scope-ok/) | 1.06s / 262MB | 390ms / 78MB | 571ms / 69MB | 483ms / 234MB |
| [`slot-scope-payload`](../tests/confirm/fixtures/typecheck/cases/slot-scope-payload/) | 1.02s / 261MB | 333ms / 78MB | 516ms / 69MB | 589ms / 225MB |
| [`slot-unknown-prop-bad`](../tests/confirm/fixtures/typecheck/cases/slot-unknown-prop-bad/) | 965ms / 266MB | 311ms / 79MB | 640ms / 69MB | 506ms / 232MB |
| [`slot-v-bind-bad`](../tests/confirm/fixtures/typecheck/cases/slot-v-bind-bad/) | 971ms / 263MB | 275ms / 78MB | 440ms / 69MB | 519ms / 231MB |
| [`slot-v-bind-ok`](../tests/confirm/fixtures/typecheck/cases/slot-v-bind-ok/) | 1.09s / 264MB | 311ms / 79MB | 565ms / 69MB | 540ms / 239MB |
| [`static-number-attr-bad`](../tests/confirm/fixtures/typecheck/cases/static-number-attr-bad/) | 989ms / 273MB | 269ms / 78MB | 579ms / 69MB | 548ms / 234MB |
| [`style-binding-bad`](../tests/confirm/fixtures/typecheck/cases/style-binding-bad/) | 1.02s / 261MB | 307ms / 78MB | 624ms / 69MB | 555ms / 231MB |
| [`template-ref-type`](../tests/confirm/fixtures/typecheck/cases/template-ref-type/) | 896ms / 295MB | 273ms / 78MB | 537ms / 69MB | 470ms / 226MB |
| [`template-undefined`](../tests/confirm/fixtures/typecheck/cases/template-undefined/) | 1.12s / 264MB | 361ms / 78MB | 552ms / 69MB | 508ms / 227MB |
| [`ts-import-vue-bad`](../tests/confirm/fixtures/typecheck/cases/ts-import-vue-bad/) | 919ms / 274MB | 300ms / 78MB | 610ms / 69MB | 565ms / 231MB |
| [`ts-import-vue-ok`](../tests/confirm/fixtures/typecheck/cases/ts-import-vue-ok/) | 1.04s / 262MB | 314ms / 78MB | 557ms / 69MB | 573ms / 232MB |
| [`unknown-prop-strict`](../tests/confirm/fixtures/typecheck/cases/unknown-prop-strict/) | 983ms / 277MB | – | 568ms / 69MB | 568ms / 235MB |
| [`v-bind-object-bad`](../tests/confirm/fixtures/typecheck/cases/v-bind-object-bad/) | 1.05s / 266MB | 289ms / 79MB | 657ms / 69MB | 578ms / 235MB |
| [`v-bind-object-ok`](../tests/confirm/fixtures/typecheck/cases/v-bind-object-ok/) | 917ms / 262MB | 328ms / 79MB | 506ms / 69MB | 532ms / 213MB |
| [`v-else-if-bad`](../tests/confirm/fixtures/typecheck/cases/v-else-if-bad/) | 911ms / 245MB | 338ms / 82MB | 643ms / 73MB | 520ms / 227MB |
| [`v-else-if-ok`](../tests/confirm/fixtures/typecheck/cases/v-else-if-ok/) | 1.01s / 268MB | 472ms / 82MB | 3.61s / 73MB | 1.09s / 229MB |
| [`v-for-destructure-ok`](../tests/confirm/fixtures/typecheck/cases/v-for-destructure-ok/) | 1.85s / 267MB | 650ms / 82MB | 929ms / 73MB | 1.02s / 231MB |
| [`v-for-item-type`](../tests/confirm/fixtures/typecheck/cases/v-for-item-type/) | 1.77s / 278MB | 485ms / 82MB | 998ms / 73MB | 788ms / 231MB |
| [`v-for-ok`](../tests/confirm/fixtures/typecheck/cases/v-for-ok/) | 1.52s / 264MB | 374ms / 82MB | 765ms / 73MB | 743ms / 225MB |
| [`v-if-discriminant-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-discriminant-bad/) | 1.36s / 265MB | 353ms / 82MB | 749ms / 73MB | 749ms / 227MB |
| [`v-if-discriminant-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-discriminant-ok/) | 1.10s / 265MB | 372ms / 82MB | 681ms / 73MB | 590ms / 227MB |
| [`v-if-else-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-else-bad/) | 1.09s / 263MB | 368ms / 82MB | 564ms / 73MB | 542ms / 231MB |
| [`v-if-else-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-else-ok/) | 1.01s / 265MB | 287ms / 82MB | 526ms / 73MB | 599ms / 227MB |
| [`v-if-event-closure`](../tests/confirm/fixtures/typecheck/cases/v-if-event-closure/) | 1.06s / 266MB | 335ms / 82MB | 668ms / 73MB | 650ms / 229MB |
| [`v-if-inline-event-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-inline-event-bad/) | 1.12s / 267MB | 310ms / 82MB | 574ms / 73MB | 639ms / 230MB |
| [`v-if-inline-event-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-inline-event-ok/) | 1.19s / 266MB | 328ms / 82MB | 665ms / 73MB | 585ms / 227MB |
| [`v-if-narrow-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-narrow-bad/) | 997ms / 264MB | 362ms / 82MB | 509ms / 73MB | 562ms / 228MB |
| [`v-if-narrow-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-narrow-ok/) | 1.17s / 263MB | 332ms / 82MB | 563ms / 73MB | 561ms / 223MB |
| [`v-if-not-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-not-ok/) | 4.23s / 265MB | 426ms / 82MB | 522ms / 73MB | 558ms / 232MB |
| [`v-if-optional-prop-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-optional-prop-bad/) | 1.11s / 264MB | 311ms / 82MB | 544ms / 73MB | 580ms / 233MB |
| [`v-if-optional-prop-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-optional-prop-ok/) | 1.07s / 264MB | 334ms / 82MB | 507ms / 73MB | 517ms / 224MB |
| [`v-if-typeof-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-typeof-bad/) | 958ms / 265MB | 311ms / 82MB | 572ms / 73MB | 560ms / 231MB |
| [`v-if-typeof-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-typeof-ok/) | 970ms / 263MB | 274ms / 82MB | 492ms / 73MB | 508ms / 226MB |
| [`v-model-type`](../tests/confirm/fixtures/typecheck/cases/v-model-type/) | 1.38s / 264MB | 902ms / 82MB | 3.01s / 73MB | 1.50s / 242MB |
| [`v-show-no-narrow`](../tests/confirm/fixtures/typecheck/cases/v-show-no-narrow/) | 1.83s / 264MB | 590ms / 83MB | 1.07s / 74MB | 985ms / 231MB |
| [`with-defaults-ok`](../tests/confirm/fixtures/typecheck/cases/with-defaults-ok/) | 1.66s / 265MB | 397ms / 82MB | 694ms / 73MB | 771ms / 227MB |
| [`wrong-prop-type`](../tests/confirm/fixtures/typecheck/cases/wrong-prop-type/) | 1.23s / 270MB | 388ms / 83MB | 781ms / 73MB | 721ms / 236MB |
| **all plants** | Σ 159.32s · peak 298MB | Σ 47.43s · peak 83MB | Σ 94.37s · peak 74MB | Σ 81.55s · peak 242MB |

## Running

```bash
pnpm confirm:typecheck
```

Writes `results/confirm.json`, `results/confirm.md`, and refreshes this file. A Benchmark dispatch on `main` commits this file and a README summary (`[skip ci]`).
