# Typecheck confirmation

This is the **correctness** suite for Vue typecheckers, not a throughput benchmark.
A tool is compatible only if it reports the planted error (or stays clean) on every plant.
vue-tsc (Volar) is the usual reference, but it is **not assumed perfect** — a plant it fails is a real gap and is listed as such.

Generated from `pnpm confirm:typecheck` at 2026-08-19T09:07:35.594Z on **Windows**.
- **Runner:** Windows · win32/x64 · 32 CPUs · AMD Ryzen 9 7950X 16-Core Processor · 127.2 GB · Node v26.5.0

On a **Benchmark** dispatch, Linux CI re-runs this and commits the file. Do not hand-edit the results.

## How plants are judged

- Each case is a tiny project under `tests/confirm/fixtures/typecheck/cases/<id>/`.
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
- pass: **407** · fail: **143** · skip: **6** · warn: **12**
- wall clock + peak RSS per plant × tool: [Time and memory](#time-and-memory)

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
| [`fallthrough-mono-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-mono-ok/) | clean | ⚠ | ✓ | ✓ | ⚠ | inheritAttrs default + single root: native id falls through (fallthroughAttributes) · *may warn if fallthroughAttributes is required* |
| [`fallthrough-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-multi-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs default + multi-root fragment: undeclared id must error (no single target) · *may warn if fallthroughAttributes is required* |
| [`fallthrough-multi-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-multi-false-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs:false + multi-root: undeclared id must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-native-type-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-native-type-bad/) | error | **✗** | **✗**† | **✗** | **✗** | inheritAttrs default + single &lt;button&gt; root: fallthrough :disabled="string" must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-both-mono-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-both-mono-false-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs:false + v-if/v-else both single-root: undeclared id must still error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-both-mono-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-both-mono-ok/) | clean | ⚠ | ✓ | ✓ | ⚠ | inheritAttrs default + v-if/v-else both single-root: id may fall through (always one root) · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-mono-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-mono-multi-bad/) | error | **✗**† | **✗**† | ✓ | **✗**† | inheritAttrs default + v-if mono / v-else multi-root: undeclared id must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-static-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-multi-bad/) | error | ✓ | **✗**† | ✓ | ✓ | inheritAttrs default + v-if="true" whose branch is multi-root: undeclared id must error · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-static-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-ok/) | clean | ⚠ | ✓ | ✓ | ⚠ | inheritAttrs default + v-if="true" (statically single root): id may fall through · *may warn if fallthroughAttributes is required* |
| [`fallthrough-vif-static-prop-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-prop-ok/) | clean | ⚠ | ✓ | ✓ | ⚠ | inheritAttrs default + v-if on a literal-true prop: statically single root, id may fall through · *may warn if fallthroughAttributes is required* |

## inheritAttrs / strictTemplates (no fallthrough typing)

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`attrs-aria-data-unknown`](../tests/confirm/fixtures/typecheck/cases/attrs-aria-data-unknown/) | error | ✓ | ○ | **✗**† | ✓ | Undeclared aria-*/data-* attributes on a component are not exempt from strictTemplates (isolates the root cause of inherit-attrs-false-unknown: the exemption is prefix-based, not inheritAttrs-based) |
| [`attrs-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/attrs-class-style-ok/) | clean | ✓ | ✓ | ✓ | ✓ | class/style on component are AllowedComponentProps (clean under strictTemplates) |
| [`attrs-unknown-fallthrough`](../tests/confirm/fixtures/typecheck/cases/attrs-unknown-fallthrough/) | error | ✓ | ○ | **✗** | ✓ | Non-declared attribute (id) on component errors under strictTemplates regardless of inheritAttrs |
| [`inherit-attrs-default-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-default-class-style-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Default inheritAttrs still allows class and style (AllowedComponentProps) |
| [`inherit-attrs-default-unknown`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-default-unknown/) | error | ✓ | ○ | **✗** | ✓ | Default inheritAttrs (no defineOptions) still errors on undeclared attrs under strictTemplates |
| [`inherit-attrs-false-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-false-class-style-ok/) | clean | ✓ | ✓ | ✓ | ✓ | inheritAttrs: false still allows class and style on the component |
| [`inherit-attrs-false-unknown`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-false-unknown/) | error | **✗** | ○ | **✗**† | **✗** | inheritAttrs:false still rejects unknown attrs at the call site under strictTemplates |
| [`unknown-prop-strict`](../tests/confirm/fixtures/typecheck/cases/unknown-prop-strict/) | error | ✓ | ○ | ✓ | ✓ | strictTemplates: undeclared prop on child component |

## Generics

| Case | Expect | vue-tsc | vize | verter-tsc | golar | What it checks |
| --- | --- | --- | --- | --- | --- | --- |
| [`generic-component-bad`](../tests/confirm/fixtures/typecheck/cases/generic-component-bad/) | error | **✗** | **✗** | **✗** | **✗** | Generic &lt;script setup&gt; component: `selected` must unify with the element type inferred from `items` |
| [`generic-component-ok`](../tests/confirm/fixtures/typecheck/cases/generic-component-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | generic="T extends { id: number }" on &lt;script setup&gt;; parent passes a consistent T (clean) |
| [`generic-constraint-template-bad`](../tests/confirm/fixtures/typecheck/cases/generic-constraint-template-bad/) | error | ✓ | **✗** | ✓ | ✓ | Inside a generic SFC, T extends { id: number } must reject item.name |
| [`generic-default-ok`](../tests/confirm/fixtures/typecheck/cases/generic-default-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Generic with a default type param (T = string) accepts a string value |
| [`generic-define-model-bad`](../tests/confirm/fixtures/typecheck/cases/generic-define-model-bad/) | error | ✓ | **✗** | **✗** | ✓ | generic defineModel&lt;T extends string \| number&gt; must reject an object v-model |
| [`generic-define-model-ok`](../tests/confirm/fixtures/typecheck/cases/generic-define-model-ok/) | clean | ✓ | ✓ | ✓ | ✓ | generic defineModel&lt;T extends string \| number&gt; accepts a string v-model (clean) |
| [`generic-emit-bad`](../tests/confirm/fixtures/typecheck/cases/generic-emit-bad/) | error | ✓ | **✗** | ✓ | ✓ | Generic emit payload inferred as number must reject a string handler |
| [`generic-emit-ok`](../tests/confirm/fixtures/typecheck/cases/generic-emit-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Generic emit payload matches the inferred T from the value prop |
| [`generic-fallthrough-mono-ok`](../tests/confirm/fixtures/typecheck/cases/generic-fallthrough-mono-ok/) | clean | ⚠ | ✓ | ✓ | ⚠ | Generic + inheritAttrs default + single root: native id falls through · *may warn if fallthroughAttributes is required* |
| [`generic-inherit-false-class-ok`](../tests/confirm/fixtures/typecheck/cases/generic-inherit-false-class-ok/) | clean | ✓ | ✓ | **✗**† | ✓ | Generic + inheritAttrs:false still allows class |
| [`generic-inherit-false-unknown`](../tests/confirm/fixtures/typecheck/cases/generic-inherit-false-unknown/) | error | ✓ | ○ | ✓ | ✓ | Generic + inheritAttrs:false: undeclared extra attr must error |
| [`generic-multi-root-ok`](../tests/confirm/fixtures/typecheck/cases/generic-multi-root-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Generic multi-root SFC with correct props stays clean (no extra attrs) |
| [`generic-slot-bad`](../tests/confirm/fixtures/typecheck/cases/generic-slot-bad/) | error | **✗** | **✗**† | **✗** | **✗** | Generic scoped slot: item.id (number) must reject a string-only consumer |
| [`generic-slot-ok`](../tests/confirm/fixtures/typecheck/cases/generic-slot-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Generic scoped slot exposes T so item.label is a string |
| [`generic-two-params-bad`](../tests/confirm/fixtures/typecheck/cases/generic-two-params-bad/) | error | ✓ | **✗**† | ✓ | ✓ | Two-param generic: slot payload inferred as number must reject a string-only consumer |
| [`generic-two-params-ok`](../tests/confirm/fixtures/typecheck/cases/generic-two-params-ok/) | clean | ✓ | ✓ | ✓ | ✓ | Generic component with two type params and matching bindings |

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
| [`define-model-modifiers-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-ok/) | clean | ✓ | **✗**† | **✗**† | ✓ | defineModel&lt;string, 'trim' \| 'capitalize'&gt; + v-model.trim; child reads modifiers.trim (clean) |
| [`define-model-modifiers-read-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-read-bad/) | error | ✓ | **✗**† | **✗**† | ✓ | Reading modifiers.nope must error when the union is 'trim' \| 'capitalize' |
| [`define-model-modifiers-unknown-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-unknown-bad/) | error | ✓ | **✗**† | **✗** | ✓ | v-model.nope must error when defineModel only declares 'trim' \| 'capitalize' |
| [`define-model-named`](../tests/confirm/fixtures/typecheck/cases/define-model-named/) | error | **✗** | **✗** | **✗** | **✗** | Named defineModel: v-model:title must be typechecked against the declared model type |
| [`define-model-named-modifiers-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-named-modifiers-ok/) | clean | ✓ | **✗**† | **✗**† | ✓ | Named defineModel + v-model:title.trim matches the declared modifier (clean) |
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
| [`ts-import-vue-bad`](../tests/confirm/fixtures/typecheck/cases/ts-import-vue-bad/) | clean | ✓ | ✓ | ⚠ | ✓ | .ts file imports an SFC; @ts-expect-error on a string assigned to a number prop (unused if the import is any) |
| [`ts-import-vue-ok`](../tests/confirm/fixtures/typecheck/cases/ts-import-vue-ok/) | clean | ✓ | ✓ | ⚠ | ✓ | .ts file imports an SFC and passes correctly typed props |

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
- `typecheck/define-model-modifiers-ok/vize-check` — expected clean (0 errors), got 2
- `typecheck/define-model-modifiers-read-bad/verter-tsc` — no diagnostic at App.vue:6 (@plant-error)
- `typecheck/define-model-modifiers-read-bad/vize-check` — no diagnostic at App.vue:6 (@plant-error)
- `typecheck/define-model-modifiers-unknown-bad/vize-check` — no diagnostic at App.vue:11 (@plant-error)
- `typecheck/define-model-named-modifiers-ok/verter-tsc` — expected clean (0 errors), got 2
- `typecheck/define-model-named-modifiers-ok/vize-check` — expected clean (0 errors), got 2
- `typecheck/fallthrough-mono-false-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-multi-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-multi-false-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-native-type-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-both-mono-false-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-mono-multi-bad/golar-typecheck` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. On the shared tsconfig the plant appeared to pass (undeclared attrs always error under default strictTemplates). With fallthroughAttributes the plant was missed: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-mono-multi-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-mono-multi-bad/vue-tsc` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. On the shared tsconfig the plant appeared to pass (undeclared attrs always error under default strictTemplates). With fallthroughAttributes the plant was missed: expected ≥1 error(s), got 0.
- `typecheck/fallthrough-vif-static-multi-bad/vize-check` — EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0.
- `typecheck/generic-component-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/generic-inherit-false-class-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/generic-slot-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/generic-two-params-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/inherit-attrs-false-unknown/verter-tsc` — expected ≥1 error(s), got 0
- `typecheck/missing-required-prop/golar-typecheck` — expected ≥1 error(s), got 0
- `typecheck/slot-default-implicit-ok/verter-tsc` — expected clean (0 errors), got 1
- `typecheck/slot-provide-type-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/slot-unknown-prop-bad/vize-check` — expected ≥1 error(s), got 0
- `typecheck/slot-v-bind-bad/verter-tsc` — plant at App.vue:13 did not mention one of: TS2322 \| TS2345 \| number \| string \| not assignable
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
| [`async-component-prop-bad`](../tests/confirm/fixtures/typecheck/cases/async-component-prop-bad/) | 1.06s / 267MB | 364ms / 78MB | 545ms / 68MB | 466ms / 233MB |
| [`async-component-prop-ok`](../tests/confirm/fixtures/typecheck/cases/async-component-prop-ok/) | 891ms / 261MB | 289ms / 78MB | 496ms / 68MB | 470ms / 235MB |
| [`async-setup-await`](../tests/confirm/fixtures/typecheck/cases/async-setup-await/) | 967ms / 260MB | 307ms / 77MB | 435ms / 68MB | 539ms / 229MB |
| [`attrs-aria-data-unknown`](../tests/confirm/fixtures/typecheck/cases/attrs-aria-data-unknown/) | 906ms / 265MB | – | 344ms / 68MB | 480ms / 225MB |
| [`attrs-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/attrs-class-style-ok/) | 978ms / 261MB | 354ms / 78MB | 433ms / 68MB | 555ms / 230MB |
| [`attrs-unknown-fallthrough`](../tests/confirm/fixtures/typecheck/cases/attrs-unknown-fallthrough/) | 916ms / 262MB | – | 457ms / 68MB | 463ms / 233MB |
| [`boolean-prop-attr-ok`](../tests/confirm/fixtures/typecheck/cases/boolean-prop-attr-ok/) | 927ms / 265MB | 363ms / 78MB | 464ms / 68MB | 632ms / 230MB |
| [`clean-basic`](../tests/confirm/fixtures/typecheck/cases/clean-basic/) | 946ms / 276MB | 250ms / 78MB | 464ms / 68MB | 446ms / 222MB |
| [`component-ref-expose-bad`](../tests/confirm/fixtures/typecheck/cases/component-ref-expose-bad/) | 956ms / 276MB | 297ms / 78MB | 485ms / 68MB | 577ms / 228MB |
| [`component-ref-expose-ok`](../tests/confirm/fixtures/typecheck/cases/component-ref-expose-ok/) | 962ms / 275MB | 275ms / 78MB | 454ms / 68MB | 528ms / 228MB |
| [`computed-unwrap-ok`](../tests/confirm/fixtures/typecheck/cases/computed-unwrap-ok/) | 1.01s / 261MB | 268ms / 77MB | 523ms / 68MB | 549ms / 227MB |
| [`custom-directive-value-bad`](../tests/confirm/fixtures/typecheck/cases/custom-directive-value-bad/) | 1.06s / 264MB | 303ms / 78MB | 351ms / 68MB | 500ms / 228MB |
| [`custom-directive-value-ok`](../tests/confirm/fixtures/typecheck/cases/custom-directive-value-ok/) | 971ms / 261MB | 312ms / 78MB | 521ms / 68MB | 479ms / 228MB |
| [`define-model-default-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-default-ok/) | 930ms / 264MB | 285ms / 78MB | 486ms / 68MB | 638ms / 228MB |
| [`define-model-get-set-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-get-set-ok/) | 1.19s / 248MB | 335ms / 78MB | 557ms / 69MB | 662ms / 226MB |
| [`define-model-modifiers-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-ok/) | 1.04s / 265MB | 259ms / 78MB | 367ms / 68MB | 500ms / 228MB |
| [`define-model-modifiers-read-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-read-bad/) | 1.04s / 281MB | 269ms / 77MB | 446ms / 68MB | 541ms / 225MB |
| [`define-model-modifiers-unknown-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-modifiers-unknown-bad/) | 1.01s / 261MB | 291ms / 78MB | 386ms / 69MB | 489ms / 231MB |
| [`define-model-named`](../tests/confirm/fixtures/typecheck/cases/define-model-named/) | 1.00s / 263MB | 302ms / 78MB | 634ms / 69MB | 532ms / 238MB |
| [`define-model-named-modifiers-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-named-modifiers-ok/) | 960ms / 262MB | 281ms / 78MB | 342ms / 68MB | 458ms / 236MB |
| [`define-model-ok`](../tests/confirm/fixtures/typecheck/cases/define-model-ok/) | 990ms / 264MB | 307ms / 78MB | 470ms / 68MB | 516ms / 224MB |
| [`define-model-set-bad`](../tests/confirm/fixtures/typecheck/cases/define-model-set-bad/) | 960ms / 264MB | 267ms / 77MB | 400ms / 68MB | 462ms / 231MB |
| [`define-slots-default-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-default-ok/) | 976ms / 278MB | 296ms / 78MB | 431ms / 68MB | 522ms / 228MB |
| [`define-slots-fn-bad`](../tests/confirm/fixtures/typecheck/cases/define-slots-fn-bad/) | 977ms / 262MB | 241ms / 78MB | 315ms / 68MB | 456ms / 232MB |
| [`define-slots-fn-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-fn-ok/) | 976ms / 276MB | 340ms / 78MB | 423ms / 68MB | 498ms / 206MB |
| [`define-slots-named-ok`](../tests/confirm/fixtures/typecheck/cases/define-slots-named-ok/) | 813ms / 260MB | 278ms / 78MB | 308ms / 68MB | 498ms / 222MB |
| [`discriminated-union-v-model-bad`](../tests/confirm/fixtures/typecheck/cases/discriminated-union-v-model-bad/) | 977ms / 285MB | 302ms / 82MB | 413ms / 72MB | 465ms / 233MB |
| [`discriminated-union-v-model-ok`](../tests/confirm/fixtures/typecheck/cases/discriminated-union-v-model-ok/) | 994ms / 266MB | 310ms / 82MB | 507ms / 72MB | 460ms / 234MB |
| [`dollar-event-bad`](../tests/confirm/fixtures/typecheck/cases/dollar-event-bad/) | 949ms / 265MB | 274ms / 81MB | 476ms / 72MB | 527ms / 213MB |
| [`dollar-event-ok`](../tests/confirm/fixtures/typecheck/cases/dollar-event-ok/) | 975ms / 283MB | 312ms / 81MB | 299ms / 72MB | 491ms / 221MB |
| [`dynamic-component-prop-bad`](../tests/confirm/fixtures/typecheck/cases/dynamic-component-prop-bad/) | 933ms / 269MB | 307ms / 82MB | 485ms / 72MB | 518ms / 216MB |
| [`dynamic-component-prop-ok`](../tests/confirm/fixtures/typecheck/cases/dynamic-component-prop-ok/) | 873ms / 265MB | 318ms / 82MB | 431ms / 68MB | 431ms / 235MB |
| [`element-prop-type`](../tests/confirm/fixtures/typecheck/cases/element-prop-type/) | 845ms / 258MB | 299ms / 77MB | 308ms / 68MB | 499ms / 221MB |
| [`emit-ok`](../tests/confirm/fixtures/typecheck/cases/emit-ok/) | 898ms / 260MB | 234ms / 77MB | 335ms / 68MB | 476ms / 229MB |
| [`emit-unknown-event`](../tests/confirm/fixtures/typecheck/cases/emit-unknown-event/) | 936ms / 251MB | 295ms / 77MB | 312ms / 68MB | 497ms / 227MB |
| [`emit-wrong-arg`](../tests/confirm/fixtures/typecheck/cases/emit-wrong-arg/) | 843ms / 260MB | 241ms / 78MB | 302ms / 68MB | 474ms / 230MB |
| [`event-emit-payload`](../tests/confirm/fixtures/typecheck/cases/event-emit-payload/) | 949ms / 261MB | 282ms / 78MB | 428ms / 68MB | 513ms / 230MB |
| [`event-mod-click-ctrl-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-ctrl-ok/) | 903ms / 260MB | 244ms / 77MB | 287ms / 68MB | 436ms / 229MB |
| [`event-mod-click-prevent-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-bad/) | 905ms / 293MB | 274ms / 77MB | 440ms / 68MB | 498ms / 227MB |
| [`event-mod-click-prevent-dollar-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-dollar-bad/) | 803ms / 288MB | 248ms / 77MB | 347ms / 68MB | 518ms / 228MB |
| [`event-mod-click-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-prevent-ok/) | 854ms / 260MB | 309ms / 77MB | 538ms / 68MB | 510ms / 228MB |
| [`event-mod-click-stop-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-click-stop-prevent-ok/) | 899ms / 260MB | 280ms / 77MB | 325ms / 68MB | 451ms / 226MB |
| [`event-mod-component-once-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-component-once-bad/) | 933ms / 261MB | 320ms / 78MB | 438ms / 68MB | 483ms / 202MB |
| [`event-mod-component-once-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-component-once-ok/) | 804ms / 260MB | 267ms / 78MB | 416ms / 68MB | 483ms / 226MB |
| [`event-mod-keyup-enter-bad`](../tests/confirm/fixtures/typecheck/cases/event-mod-keyup-enter-bad/) | 1.00s / 262MB | 333ms / 81MB | 570ms / 72MB | 531ms / 227MB |
| [`event-mod-keyup-enter-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-keyup-enter-ok/) | 1.04s / 265MB | 282ms / 77MB | 339ms / 68MB | 505ms / 232MB |
| [`event-mod-submit-prevent-ok`](../tests/confirm/fixtures/typecheck/cases/event-mod-submit-prevent-ok/) | 988ms / 261MB | 257ms / 77MB | 494ms / 68MB | 536ms / 215MB |
| [`fallthrough-mono-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-mono-false-bad/) | 1.01s / 276MB | 304ms / 78MB | 519ms / 68MB | 637ms / 231MB |
| [`fallthrough-mono-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-mono-ok/) | 936ms / 262MB | 279ms / 78MB | 467ms / 69MB | 561ms / 230MB |
| [`fallthrough-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-multi-bad/) | 987ms / 265MB | 269ms / 78MB | 470ms / 69MB | 531ms / 234MB |
| [`fallthrough-multi-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-multi-false-bad/) | 945ms / 265MB | 499ms / 78MB | 448ms / 68MB | 489ms / 234MB |
| [`fallthrough-native-type-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-native-type-bad/) | 973ms / 264MB | 254ms / 78MB | 345ms / 68MB | 595ms / 235MB |
| [`fallthrough-vif-both-mono-false-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-both-mono-false-bad/) | 1.06s / 270MB | 293ms / 78MB | 587ms / 68MB | 595ms / 228MB |
| [`fallthrough-vif-both-mono-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-both-mono-ok/) | 879ms / 264MB | 307ms / 78MB | 409ms / 68MB | 541ms / 220MB |
| [`fallthrough-vif-mono-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-mono-multi-bad/) | 954ms / 265MB | 276ms / 78MB | 386ms / 68MB | 534ms / 231MB |
| [`fallthrough-vif-static-multi-bad`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-multi-bad/) | 1.04s / 264MB | 275ms / 78MB | 428ms / 69MB | 521ms / 231MB |
| [`fallthrough-vif-static-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-ok/) | 920ms / 295MB | 294ms / 78MB | 464ms / 68MB | 507ms / 229MB |
| [`fallthrough-vif-static-prop-ok`](../tests/confirm/fixtures/typecheck/cases/fallthrough-vif-static-prop-ok/) | 912ms / 264MB | 358ms / 78MB | 441ms / 68MB | 565ms / 230MB |
| [`generic-component-bad`](../tests/confirm/fixtures/typecheck/cases/generic-component-bad/) | 921ms / 263MB | 262ms / 78MB | 431ms / 68MB | 508ms / 228MB |
| [`generic-component-ok`](../tests/confirm/fixtures/typecheck/cases/generic-component-ok/) | 984ms / 262MB | 317ms / 78MB | 467ms / 68MB | 502ms / 205MB |
| [`generic-constraint-template-bad`](../tests/confirm/fixtures/typecheck/cases/generic-constraint-template-bad/) | 917ms / 261MB | 247ms / 78MB | 478ms / 68MB | 529ms / 231MB |
| [`generic-default-ok`](../tests/confirm/fixtures/typecheck/cases/generic-default-ok/) | 953ms / 262MB | 315ms / 78MB | 389ms / 68MB | 536ms / 228MB |
| [`generic-define-model-bad`](../tests/confirm/fixtures/typecheck/cases/generic-define-model-bad/) | 905ms / 261MB | 285ms / 78MB | 476ms / 68MB | 517ms / 227MB |
| [`generic-define-model-ok`](../tests/confirm/fixtures/typecheck/cases/generic-define-model-ok/) | 921ms / 265MB | 295ms / 78MB | 508ms / 68MB | 491ms / 232MB |
| [`generic-emit-bad`](../tests/confirm/fixtures/typecheck/cases/generic-emit-bad/) | 1.02s / 275MB | 331ms / 78MB | 416ms / 68MB | 563ms / 233MB |
| [`generic-emit-ok`](../tests/confirm/fixtures/typecheck/cases/generic-emit-ok/) | 954ms / 263MB | 326ms / 79MB | 474ms / 69MB | 501ms / 231MB |
| [`generic-fallthrough-mono-ok`](../tests/confirm/fixtures/typecheck/cases/generic-fallthrough-mono-ok/) | 1.03s / 283MB | 298ms / 79MB | 348ms / 68MB | 473ms / 231MB |
| [`generic-inherit-false-class-ok`](../tests/confirm/fixtures/typecheck/cases/generic-inherit-false-class-ok/) | 942ms / 280MB | 305ms / 78MB | 310ms / 68MB | 489ms / 228MB |
| [`generic-inherit-false-unknown`](../tests/confirm/fixtures/typecheck/cases/generic-inherit-false-unknown/) | 943ms / 261MB | – | 308ms / 68MB | 474ms / 238MB |
| [`generic-multi-root-ok`](../tests/confirm/fixtures/typecheck/cases/generic-multi-root-ok/) | 1.01s / 291MB | 331ms / 78MB | 334ms / 68MB | 499ms / 232MB |
| [`generic-slot-bad`](../tests/confirm/fixtures/typecheck/cases/generic-slot-bad/) | 903ms / 262MB | 274ms / 78MB | 443ms / 68MB | 496ms / 220MB |
| [`generic-slot-ok`](../tests/confirm/fixtures/typecheck/cases/generic-slot-ok/) | 1.00s / 295MB | 298ms / 78MB | 354ms / 68MB | 547ms / 235MB |
| [`generic-two-params-bad`](../tests/confirm/fixtures/typecheck/cases/generic-two-params-bad/) | 943ms / 263MB | 340ms / 78MB | 480ms / 68MB | 518ms / 222MB |
| [`generic-two-params-ok`](../tests/confirm/fixtures/typecheck/cases/generic-two-params-ok/) | 1.01s / 294MB | 279ms / 78MB | 458ms / 68MB | 495ms / 229MB |
| [`global-component-prop-bad`](../tests/confirm/fixtures/typecheck/cases/global-component-prop-bad/) | 869ms / 261MB | 291ms / 78MB | 378ms / 68MB | 549ms / 238MB |
| [`global-component-prop-ok`](../tests/confirm/fixtures/typecheck/cases/global-component-prop-ok/) | 1.04s / 262MB | 339ms / 78MB | 454ms / 68MB | 542ms / 236MB |
| [`inherit-attrs-default-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-default-class-style-ok/) | 1.00s / 260MB | 273ms / 78MB | 428ms / 68MB | 471ms / 235MB |
| [`inherit-attrs-default-unknown`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-default-unknown/) | 970ms / 278MB | – | 423ms / 68MB | 507ms / 224MB |
| [`inherit-attrs-false-class-style-ok`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-false-class-style-ok/) | 873ms / 262MB | 297ms / 78MB | 344ms / 68MB | 459ms / 231MB |
| [`inherit-attrs-false-unknown`](../tests/confirm/fixtures/typecheck/cases/inherit-attrs-false-unknown/) | 1.03s / 261MB | – | 311ms / 68MB | 598ms / 229MB |
| [`inject-key-type`](../tests/confirm/fixtures/typecheck/cases/inject-key-type/) | 930ms / 261MB | 312ms / 77MB | 340ms / 68MB | 477ms / 228MB |
| [`literal-union-prop-bad`](../tests/confirm/fixtures/typecheck/cases/literal-union-prop-bad/) | 931ms / 262MB | 281ms / 78MB | 470ms / 68MB | 515ms / 228MB |
| [`literal-union-prop-ok`](../tests/confirm/fixtures/typecheck/cases/literal-union-prop-ok/) | 856ms / 264MB | 246ms / 78MB | 465ms / 68MB | 461ms / 228MB |
| [`missing-required-prop`](../tests/confirm/fixtures/typecheck/cases/missing-required-prop/) | 938ms / 274MB | 289ms / 78MB | 311ms / 68MB | 459ms / 222MB |
| [`native-input-v-model-ok`](../tests/confirm/fixtures/typecheck/cases/native-input-v-model-ok/) | 895ms / 256MB | 250ms / 77MB | 365ms / 68MB | 516ms / 219MB |
| [`native-keyup-bad`](../tests/confirm/fixtures/typecheck/cases/native-keyup-bad/) | 965ms / 253MB | 329ms / 78MB | 500ms / 68MB | 471ms / 224MB |
| [`native-v-model-lazy-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-lazy-ok/) | 884ms / 260MB | 265ms / 77MB | 392ms / 68MB | 500ms / 232MB |
| [`native-v-model-number-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-number-ok/) | 991ms / 261MB | 279ms / 77MB | 370ms / 68MB | 531ms / 216MB |
| [`native-v-model-trim-ok`](../tests/confirm/fixtures/typecheck/cases/native-v-model-trim-ok/) | 935ms / 260MB | 268ms / 77MB | 341ms / 68MB | 530ms / 214MB |
| [`optional-chain-bad`](../tests/confirm/fixtures/typecheck/cases/optional-chain-bad/) | 934ms / 259MB | 300ms / 77MB | 456ms / 68MB | 499ms / 230MB |
| [`optional-chain-ok`](../tests/confirm/fixtures/typecheck/cases/optional-chain-ok/) | 841ms / 263MB | 273ms / 77MB | 440ms / 68MB | 439ms / 225MB |
| [`options-api-prop-bad`](../tests/confirm/fixtures/typecheck/cases/options-api-prop-bad/) | 877ms / 260MB | 281ms / 77MB | 386ms / 68MB | 498ms / 230MB |
| [`provide-inject-ok`](../tests/confirm/fixtures/typecheck/cases/provide-inject-ok/) | 859ms / 261MB | 247ms / 78MB | 392ms / 68MB | 455ms / 233MB |
| [`ref-unwrap-bad`](../tests/confirm/fixtures/typecheck/cases/ref-unwrap-bad/) | 1.04s / 245MB | 320ms / 77MB | 516ms / 68MB | 543ms / 227MB |
| [`ref-unwrap-ok`](../tests/confirm/fixtures/typecheck/cases/ref-unwrap-ok/) | 1.02s / 283MB | 302ms / 77MB | 501ms / 68MB | 589ms / 226MB |
| [`required-slot-missing-bad`](../tests/confirm/fixtures/typecheck/cases/required-slot-missing-bad/) | 1.18s / 261MB | 353ms / 78MB | 483ms / 68MB | 589ms / 228MB |
| [`required-slot-ok`](../tests/confirm/fixtures/typecheck/cases/required-slot-ok/) | 1.06s / 260MB | 331ms / 78MB | 318ms / 68MB | 535ms / 236MB |
| [`script-type-error`](../tests/confirm/fixtures/typecheck/cases/script-type-error/) | 1.08s / 260MB | 341ms / 78MB | 429ms / 68MB | 530ms / 231MB |
| [`slot-default-implicit-ok`](../tests/confirm/fixtures/typecheck/cases/slot-default-implicit-ok/) | 928ms / 266MB | 267ms / 77MB | 326ms / 68MB | 501ms / 230MB |
| [`slot-provide-type-bad`](../tests/confirm/fixtures/typecheck/cases/slot-provide-type-bad/) | 1.02s / 260MB | 281ms / 77MB | 446ms / 68MB | 541ms / 229MB |
| [`slot-provide-type-ok`](../tests/confirm/fixtures/typecheck/cases/slot-provide-type-ok/) | 940ms / 276MB | 283ms / 77MB | 317ms / 68MB | 508ms / 215MB |
| [`slot-scope-ok`](../tests/confirm/fixtures/typecheck/cases/slot-scope-ok/) | 939ms / 261MB | 274ms / 78MB | 433ms / 68MB | 510ms / 231MB |
| [`slot-scope-payload`](../tests/confirm/fixtures/typecheck/cases/slot-scope-payload/) | 957ms / 266MB | 285ms / 78MB | 457ms / 68MB | 447ms / 226MB |
| [`slot-unknown-prop-bad`](../tests/confirm/fixtures/typecheck/cases/slot-unknown-prop-bad/) | 893ms / 294MB | 272ms / 78MB | 503ms / 68MB | 540ms / 229MB |
| [`slot-v-bind-bad`](../tests/confirm/fixtures/typecheck/cases/slot-v-bind-bad/) | 880ms / 247MB | 245ms / 77MB | 365ms / 68MB | 488ms / 231MB |
| [`slot-v-bind-ok`](../tests/confirm/fixtures/typecheck/cases/slot-v-bind-ok/) | 1.01s / 256MB | 299ms / 78MB | 460ms / 68MB | 534ms / 236MB |
| [`static-number-attr-bad`](../tests/confirm/fixtures/typecheck/cases/static-number-attr-bad/) | 1.03s / 260MB | 298ms / 78MB | 464ms / 68MB | 522ms / 238MB |
| [`style-binding-bad`](../tests/confirm/fixtures/typecheck/cases/style-binding-bad/) | 1.01s / 259MB | 288ms / 77MB | 452ms / 68MB | 530ms / 233MB |
| [`template-ref-type`](../tests/confirm/fixtures/typecheck/cases/template-ref-type/) | 865ms / 259MB | 295ms / 77MB | 426ms / 68MB | 478ms / 230MB |
| [`template-undefined`](../tests/confirm/fixtures/typecheck/cases/template-undefined/) | 994ms / 274MB | 279ms / 77MB | 465ms / 68MB | 494ms / 229MB |
| [`ts-import-vue-bad`](../tests/confirm/fixtures/typecheck/cases/ts-import-vue-bad/) | 898ms / 263MB | 274ms / 77MB | 292ms / 68MB | 479ms / 226MB |
| [`ts-import-vue-ok`](../tests/confirm/fixtures/typecheck/cases/ts-import-vue-ok/) | 903ms / 260MB | 262ms / 77MB | 369ms / 68MB | 525ms / 231MB |
| [`unknown-prop-strict`](../tests/confirm/fixtures/typecheck/cases/unknown-prop-strict/) | 1.04s / 266MB | – | 486ms / 68MB | 536ms / 237MB |
| [`v-bind-object-bad`](../tests/confirm/fixtures/typecheck/cases/v-bind-object-bad/) | 948ms / 252MB | 286ms / 78MB | 462ms / 68MB | 468ms / 225MB |
| [`v-bind-object-ok`](../tests/confirm/fixtures/typecheck/cases/v-bind-object-ok/) | 879ms / 262MB | 296ms / 78MB | 471ms / 68MB | 467ms / 234MB |
| [`v-else-if-bad`](../tests/confirm/fixtures/typecheck/cases/v-else-if-bad/) | 866ms / 260MB | 253ms / 78MB | 399ms / 68MB | 505ms / 229MB |
| [`v-else-if-ok`](../tests/confirm/fixtures/typecheck/cases/v-else-if-ok/) | 943ms / 294MB | 291ms / 77MB | 426ms / 68MB | 565ms / 229MB |
| [`v-for-destructure-ok`](../tests/confirm/fixtures/typecheck/cases/v-for-destructure-ok/) | 912ms / 257MB | 258ms / 77MB | 330ms / 68MB | 454ms / 224MB |
| [`v-for-item-type`](../tests/confirm/fixtures/typecheck/cases/v-for-item-type/) | 894ms / 262MB | 266ms / 77MB | 337ms / 68MB | 502ms / 226MB |
| [`v-for-ok`](../tests/confirm/fixtures/typecheck/cases/v-for-ok/) | 910ms / 260MB | 280ms / 77MB | 451ms / 68MB | 475ms / 230MB |
| [`v-for-tuple-ok`](../tests/confirm/fixtures/typecheck/cases/v-for-tuple-ok/) | 866ms / 280MB | 308ms / 77MB | 353ms / 68MB | 529ms / 228MB |
| [`v-for-tuple-type-bad`](../tests/confirm/fixtures/typecheck/cases/v-for-tuple-type-bad/) | 864ms / 261MB | 240ms / 77MB | 431ms / 68MB | 475ms / 230MB |
| [`v-if-discriminant-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-discriminant-bad/) | 1.01s / 261MB | 269ms / 77MB | 355ms / 68MB | 524ms / 228MB |
| [`v-if-discriminant-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-discriminant-ok/) | 960ms / 262MB | 264ms / 77MB | 492ms / 68MB | 447ms / 233MB |
| [`v-if-else-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-else-bad/) | 903ms / 257MB | 292ms / 78MB | 371ms / 68MB | 509ms / 229MB |
| [`v-if-else-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-else-ok/) | 949ms / 290MB | 291ms / 77MB | 370ms / 68MB | 543ms / 215MB |
| [`v-if-event-closure`](../tests/confirm/fixtures/typecheck/cases/v-if-event-closure/) | 1.18s / 294MB | 387ms / 78MB | 764ms / 68MB | 586ms / 218MB |
| [`v-if-in-narrow-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-in-narrow-bad/) | 859ms / 263MB | 258ms / 78MB | 365ms / 68MB | 454ms / 226MB |
| [`v-if-in-narrow-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-in-narrow-ok/) | 834ms / 261MB | 308ms / 77MB | 508ms / 68MB | 520ms / 213MB |
| [`v-if-inline-event-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-inline-event-bad/) | 977ms / 293MB | 283ms / 78MB | 464ms / 68MB | 471ms / 204MB |
| [`v-if-inline-event-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-inline-event-ok/) | 975ms / 261MB | 337ms / 77MB | 501ms / 68MB | 573ms / 221MB |
| [`v-if-narrow-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-narrow-bad/) | 1.09s / 291MB | 263ms / 81MB | 521ms / 72MB | 500ms / 227MB |
| [`v-if-narrow-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-narrow-ok/) | 999ms / 297MB | 321ms / 81MB | 494ms / 72MB | 504ms / 227MB |
| [`v-if-not-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-not-ok/) | 1.09s / 264MB | 284ms / 81MB | 349ms / 72MB | 549ms / 223MB |
| [`v-if-optional-prop-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-optional-prop-bad/) | 974ms / 267MB | 327ms / 81MB | 532ms / 72MB | 587ms / 226MB |
| [`v-if-optional-prop-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-optional-prop-ok/) | 906ms / 280MB | 305ms / 81MB | 449ms / 72MB | 510ms / 227MB |
| [`v-if-typeof-bad`](../tests/confirm/fixtures/typecheck/cases/v-if-typeof-bad/) | 1.00s / 264MB | 302ms / 81MB | 406ms / 68MB | 493ms / 225MB |
| [`v-if-typeof-ok`](../tests/confirm/fixtures/typecheck/cases/v-if-typeof-ok/) | 802ms / 259MB | 279ms / 77MB | 363ms / 68MB | 481ms / 224MB |
| [`v-model-type`](../tests/confirm/fixtures/typecheck/cases/v-model-type/) | 954ms / 275MB | 311ms / 78MB | 476ms / 68MB | 517ms / 202MB |
| [`v-show-no-narrow`](../tests/confirm/fixtures/typecheck/cases/v-show-no-narrow/) | 846ms / 288MB | 249ms / 77MB | 394ms / 68MB | 495ms / 229MB |
| [`with-defaults-ok`](../tests/confirm/fixtures/typecheck/cases/with-defaults-ok/) | 895ms / 294MB | 334ms / 77MB | 482ms / 68MB | 604ms / 229MB |
| [`wrong-prop-type`](../tests/confirm/fixtures/typecheck/cases/wrong-prop-type/) | 989ms / 279MB | 283ms / 78MB | 313ms / 68MB | 505ms / 220MB |
| **all plants** | Σ 135.25s · peak 297MB | Σ 39.82s · peak 82MB | Σ 60.36s · peak 72MB | Σ 72.67s · peak 238MB |

## Running

```bash
pnpm confirm:typecheck
```

Writes `results/confirm.json`, `results/confirm.md`, and refreshes this file. A Benchmark dispatch on `main` commits this file and a README summary (`[skip ci]`).
