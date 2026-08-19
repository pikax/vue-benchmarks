# Methodology — what is compared, and how

> Companion to the [README](../README.md), which keeps only the short version and the published tables. Everything here is the detail: corpus design, comparison classes, work gates, caveats, CI layout, and how to run the suite locally.

**Requirements:** Node.js 22+, pnpm 10 (`corepack enable`).

| Rule of thumb        | Detail                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Sort                 | Tables sort by median measured time; every row also shows what it **produced**                        |
| Surfaces             | Independent — do not compare compile ms to typecheck/lint/format ms                                   |
| Missing tools        | Reported as `skipped` (missing API/binary); not replaced with another job                             |
| Warmup               | **Mandatory** — every measured run follows ≥1 discarded pass (`--warmups 0` is clamped to 1)          |
| Compile corpus       | Primary: unique file contents (`fixtures/N`). `fixtures/N-repeated` is a content-hash cache demo only |
| Diagnostics / format | Not required to match across tools; throughput only unless using the confirmation suite               |
| Comparison classes   | **One table per surface**; only vapor/vdom codegen targets split. Engine ((JS) tag), invocation and threading are row properties — compare like with like by reading the row |
| Ranking              | Primary sort is the **median of measured runs**. There is no cold metric — see below                  |
| Noise                | Every row carries min / stddev / **CV%**; CV > 10% is flagged ⚠ and should not be read as a result     |
| Work gates           | A tool that misses a planted bug is **measured but unranked** — time shown in (brackets) with the reason |

## What is compared

### Compilers — SFC (`.vue` parse + script + template)

Compile is a **matrix**, not one table — three independent dimensions:

| Dimension      | Values                  | Meaning                                                      |
| -------------- | ----------------------- | ------------------------------------------------------------ |
| **Target**     | vdom, vapor             | Classic VDOM render functions vs direct DOM codegen           |
| **Env**        | production, development | Semantic prod/dev knobs only (`isProd`, HMR strategy)         |
| **Source map** | off (default)           | ⚠ Only `@vue/compiler-sfc` emits a map from the benchmarked entry point — see below |

Source map is a **separate dimension on purpose**. It used to be folded into `env`, which meant that inside one ranked table "production" told Vue to do *more* work (`hoistStatic` + `cacheHandlers`, maps still on) and told the native tools to do *less* (maps off).

It now defaults to **off only**, because requesting it identically is not the same as it being honoured identically:

| Compiler | `sourceMap: true` on the benchmarked entry point |
| --- | --- |
| `@vue/compiler-sfc` | emits a real map (~553 B for one SFC) |
| Vize `compileSfc` | no `map` field; output **byte-identical** with the flag on and off |
| Verter `compileMany` | no `sourceMap` field on the runtime-render result |

Both natives *do* support source maps elsewhere — Vize on its JSX API, Verter on `processStyle` and the tsc/declaration path — just not on the entry points this surface benchmarks. So an `on` cell charges Vue for map generation and the natives for nothing. It stays available via `--compile-sourcemaps on` for investigation, with the affected rows annotated, but it is not part of the published matrix.

| Tool               | Package                 | VDOM | Vapor                              | Prod / Dev knobs                                  |
| ------------------ | ----------------------- | ---- | ---------------------------------- | ------------------------------------------------- |
| Vue Official 3.5.x | `@vue/compiler-sfc`     | yes  | **no** (skipped — no Vapor path)   | `isProd`                                          |
| Vue Official 3.6.x | `@vue/compiler-sfc@3.6` | yes  | yes (`vapor: true` / vapor script) | `isProd`                                          |
| Vize               | `@vizejs/native`        | yes  | yes (`vapor`)                      | ⚠ **none** — no `isProduction` on `compileSfc`    |
| Verter             | `@verter/native`        | yes  | yes (`forceVapor`)                 | `isProduction` + `hmrStrategy`                    |
| [fervid](https://github.com/phoenix-ru/fervid) | `@fervid/napi` | yes | **no** (skipped — no Vapor path)   | `isProduction`                                    |

⚠ in this table marks a matrix dimension the tool does not vary with: the rows are still produced, and they are identical. Where a tool has no code path for a dimension at all, the row is reported `skipped` instead and carries no ⚠.

⚠ Vize's production and development rows therefore perform **identical work**, because `compileSfc` exposes no production flag. The row notes record this; no substitute flag is used in its place.

#### Caveat: fervid is measured but unranked — 11% of its output for this corpus is not valid JavaScript

[fervid](https://github.com/phoenix-ru/fervid) (`@fervid/napi` 0.4.1) is an all-in-one Vue SFC compiler in Rust. It is wired into the SFC compile surface only — it has no JSX, typecheck, format, lint, component-meta or LSP surface, so it appears nowhere else — and VDOM only, so vapor cells report it `skipped` rather than substituting VDOM, exactly as Vue 3.5 is treated.

Its rows are **measured, bracketed and excluded from ranking**, because it fails the [codegen validity gate](#codegen-validity-gate):

> **22 of 200** timed fixtures compile to output that is not parseable JavaScript.

The cause is multi-binding `v-for`. For `v-for="(label, i) in labels"` fervid emits doubly-parenthesised arrow parameters:

```js
_renderList(__props.items, ((item, index)) => /* … */)
//                         ^^^^^^^^^^^^^^^  not valid JavaScript
```

Single-binding `v-for="item in items"` is unaffected. `@vue/compiler-sfc` 3.5/3.6, Vize and Verter each emit parseable output for **all 200** files, so the gate is not a fervid-specific rule — it is applied to every compiler in the table and only fervid fails it.

The confirmation suite (`pnpm confirm:compile`, runtime behaviour under `@vue/test-utils`) shows the same picture from the correctness side — fervid passes 10 of 19 cases. All nine failures are recorded in `tests/confirm/known-failures.json` with root causes:

| Case | Root cause |
| --- | --- |
| `v-for-list` | doubly-parenthesised arrow params — the gate failure above |
| `slot-fallback` | fallback passed to `_renderSlot` as an array, not the thunk Vue calls |
| `dynamic-component-is` | `<component :is>` compiled as a literal component named `component` instead of `_resolveDynamicComponent` |
| `keep-alive` | same `<component :is>` cause, inside `<KeepAlive>` |
| `custom-directive` | directive bound correctly, but the `512 /* NEED_PATCH */` flag is omitted so `updated` never fires |
| `dynamic-slot-name` | plain computed slot key instead of `_createSlots` + `1024 /* DYNAMIC_SLOTS */` |
| `event-modifiers` | `@keyup.enter` compiled with `_withModifiers` instead of `_withKeys`, so the key guard is a no-op |
| `css-v-bind` | `__scopeId` set but no `useCssVars()` emitted, so `<style> v-bind()` never resolves |
| `v-show` | `_vShow` bound but `512 /* NEED_PATCH */` omitted, so toggling never updates `display` |

Two further properties of the fervid rows are stated on every row rather than folded into the number:

- **It does more work than its neighbours.** `compileSync` also compiles `<style>` blocks (scoped styles come back `isCompiled: true` with the scope attribute applied). Every other row in the table measures parse + script + template and never touches styles. There is no option to disable it.
- **It honours `sourceMap` for real** (~594 KB of map across this corpus), where Vize's and Verter's benchmarked entry points return none. In an `sm on` cell fervid pays map-generation cost alongside `@vue/compiler-sfc`, not alongside the natives.

A third observation is *not* held against it: fervid reports non-fatal `NonVoidHtmlElementStartTagWithTrailingSolidus` diagnostics for self-closing non-void tags (`<div />`, `<MyComp />`) that Vue's SFC parser accepts — 44 on this corpus. Verified case by case: codegen is complete and correct for those files, so the count is recorded (in the row notes, and per-run in the JSON report's meta samples) and nothing more is made of it.

**Every part of this is re-derived on each run.** The gate re-parses fervid's output each benchmark and the confirmation suite fails the build if a listed failure starts passing, so a later fervid release that fixes the `v-for` codegen clears the bracket and enters the ranking with no change to this repository.

#### Codegen validity gate

The compile surface ranks on bytes per millisecond, and nothing used to check that those bytes parsed. A compiler emitting syntactically broken output for part of the corpus is doing less work than one that is not, and would out-rank it on exactly that basis.

So before any timing, each compiler's output for the whole corpus is parsed. TypeScript syntax is permitted (the corpus is 110/200 `lang="ts"` and `compileScript` passes annotations through for a downstream transpiler); only genuine syntax errors count. A tool that fails is **measured but unranked**, with the failing count and first error in its row notes — the compile-surface analogue of the typecheck and lint work gates.

**The gate runs once per (target × environment) cell, with that cell's flags.** It used to run once on vdom/production and stamp the verdict onto the Vapor and development cells it had never exercised — but Vapor is a different codegen backend and development mode emits different code (HMR wiring, no hoisting), so a pass on one is not evidence about the other. In the direction that matters, a tool whose Vapor output does not parse kept a ranked Vapor row on the strength of its VDOM output. Source maps are *not* a gate dimension: a map is emitted beside the code and cannot change whether the code parses.

Each tool's compiler handle is constructed **inside** the gate's own try, so a throwing constructor costs that one tool a `ⓘ GATE NOT RUN` annotation rather than destroying every row for the corpus — which is what happened when `new VerterHost(…)` and `new Compiler(…)` sat outside it.

**One error policy for `@vue/compiler-sfc`, Vize and Verter in the timed path:** a non-empty `errors` array fails the measure. Vue returns parse and template errors in an array rather than throwing, and the timed path used to discard both — while the Vize row threw on `result.errors.length` and the Verter row threw on `results.filter(r => r.errors?.length)`. That asymmetry billed a file Vue could not parse as cheap work successfully done, with the row left ranked, where the identical failure in a challenger produced ❌. fervid is the documented exception, gated on codegen actually being produced for every file, because its diagnostics include non-fatal HTML-strictness warnings that Vue's SFC parser does not raise — stated on every fervid row rather than applied silently.

**Modes on the row:** Vue official compiler is **1T only** (worker_threads variants removed). Vize/Verter batch pools and Verter's `session` mode — a persistent host across warmups and runs — share the table with the mode in the row label; a pool row against a 1T row is a thread-count comparison, and a session row reuses prior analysis the cache-free rows repeat.

**Single-file microbench** (tinybench size ladder under `fixtures/compile-single/`):

```bash
pnpm bench:compile:single
# tiny → small → medium → large → xlarge; 20 warmup + 100 iters
# Each iteration uses a **unique** SFC body (a content-hash cache cannot serve a repeat)
# options: --files tiny,medium --targets vdom --verter-session | --no-mutate
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

### Fixtures (and content-hash caches)

| Path                    | Contents                                            | Use for ranking?               |
| ----------------------- | --------------------------------------------------- | ------------------------------ |
| `fixtures/{N}`          | Diverse templates, **every body unique** (uniquify) | **Yes — primary** (SFC)        |
| `fixtures/{N}-vapor`    | Unique + `<script setup vapor>`                     | Optional vapor authoring       |
| `fixtures/{N}-repeated` | **Identical body**, different filenames             | **No** — cache-demo only       |
| `fixtures/jsx-{N}`      | Unique `.jsx` components                            | **Yes** for `jsx-compile` only |

Default compile applies **compiler flags** (VDOM/Vapor × prod/dev) on the unique corpus.

CI also runs a non-ranking compile pass on `fixtures/{N}-repeated` so content-hash cache effects stay visible.

### Typecheckers

| Tool             | Package                     | Command / API                                 | TypeScript engine |
| ---------------- | --------------------------- | --------------------------------------------- | ----------------- |
| Vue TSC          | `vue-tsc`                   | `vue-tsc --noEmit -p tsconfig.json`           | **TypeScript 6.0 (JS)** |
| Vue TSC (TNB)    | `typescript-native-bridge`  | same command, `envs/tnb` install              | tsgo **stable** 7.0.2 (in-process NAPI/FFI) |
| Golar            | `golar` + `@golar/vue`      | `golar typecheck` (+ default mode separately) | typescript-go (native) |
| Vize             | `vize`                      | `vize check . --tsconfig …`                   | tsgo **nightly** (`@typescript/native-preview` 7.0.0-dev) |
| Verter           | `verter-tsc`                | `verter-tsc --noEmit -p tsconfig.json`        | tsgo **stable** 7.0.2 |

#### Engines share one table, tagged (JS) — and why the tag matters

Most of these run the **native Go TypeScript engine**; stock `vue-tsc` runs the **JavaScript** one. A cross-engine ratio mostly measures TypeScript's own Go rewrite, not the Vue layer under test. The engines used to get separate tables for that reason; they now share one table with the JS-engine rows tagged **(JS)** on the name — compact, but the caveat is unchanged: compare like with like, and read a JS-vs-native gap as an engine measurement first.

**`vue-tsc (N)` (TNB / tsgo) holds the Vue layer fixed and changes only the engine.** It is the *same* `vue-tsc`, the same `@vue/language-core`, the same template checking — with `typescript` aliased to [typescript-native-bridge](https://github.com/johnsoncodehk/typescript-native-bridge), whose checker is tsgo in-process. One variable changes, so the pair isolates the engine from the Vue layer.

Illustrative decomposition. **Local `fixtures/50` on win32, 50 files, 5 measured runs after a warmup; CV 1.5–3.1% on every ranked row.** Published numbers come from Linux CI — these are indicative of the *shape*, not a published ranking.

Measured medians:

| Tool | Engine | Median | CV | Diagnostics |
| --- | --- | ---: | ---: | ---: |
| `vue-tsc` | TypeScript 5.9.3 (JS) | 1.35 s | 2.6% | 0 |
| golar typecheck | tsgo 7.0.2 | 564.1 ms | 3.1% | 0 |
| `vue-tsc` (TNB / tsgo) | tsgo 7.0.2 | 696.6 ms | 1.5% | 0 |
| `verter-tsc` | tsgo 7.0.2 | 760.5 ms | 2.0% | 105 ⚠ |
| Vize check | tsgo nightly | *(132.8 ms)* | — | *(0)* — unranked, failed the template gate |

| Comparison | Gap | What differs between the two rows |
| --- | --- | --- |
| `vue-tsc` (JS) vs `vue-tsc` (TNB) — **same tool, engine swapped** | **1.94×** | The TypeScript engine only; the Vue layer is identical in both rows |
| `vue-tsc` (TNB) vs `verter-tsc` (**same engine, both validated**) | **1.09×** (`vue-tsc` (TNB) median lower) | The Vue layer only; the engine is identical in both rows |
| `vue-tsc` (TNB) vs golar (**same engine, both validated**) | 1.23× (golar median lower) | The Vue layer only; the engine is identical in both rows |
| Vize (unranked) vs `vue-tsc` (JS) | 10.2× | Engine and Vue layer both differ, and the Vize row did not pass the template gate |

Read together: the 1.94× between the two `vue-tsc` rows is attributable to the engine swap alone, and between same-engine, both-validated rows the measured gaps on this corpus are 1.09× and 1.23×. A single cross-engine ratio multiplies the two factors together, which is why the (JS) tag exists and why a cross-engine comparison should be read as an engine measurement first.

> ⚠ An earlier revision of this table published **~2%** from a **single** unreplicated run at a 20-file limit. That figure was corrected: the run it was taken from showed 1.20×, in the opposite direction to the 1.09× that the replicated 5-run measurement at 50 files above gives. Single-run typecheck numbers on this corpus move by more than the gaps being reported, so they are not treated as results. Note also that `verter-tsc` is the only row emitting diagnostics on this corpus — 105 of them, referring to its own virtual code — so its output on this run was not the same as that of the rows above it.

Stock JS-engine `vue-tsc` is **kept** as a row, because it is what ships today.

TNB lives in [`envs/tnb`](../envs/tnb/README.md) as a standalone project, never a root `typescript` override — an override would swap the engine under component-meta, lint and LSP at the same time. It must also print its activation banner on the work-gate run, or the row is unranked: a silent fallback to the JS checker would leave the row labelled native while running JS.

Note also that Vize ships a tsgo **nightly** while `verter-tsc` requires stable and rejects nightlies. Both are ranked in the same engine class, and every row prints its exact engine build.

Default typecheck file limit is **200** (or smaller if the fixture is smaller) — typecheck cost scales steeply vs pure compile.

**Work gate — every stage required to be ranked.** Results appear per row as `gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓`:

| Stage           | What it plants                                              | What it proves                                                               |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **script**      | Type error in `<script setup>` only                          | The tool typechecks script blocks at all                                      |
| **tmpl-prop**   | Clean script; `:disabled` string→boolean in template only    | It checks native-element **prop types** in templates                          |
| **tmpl-event**  | Clean script; `@click` number→function in template only      | It checks **event handler** types in templates                                |
| **corpus**      | Same bug planted into the **full timed corpus**              | It still finds it at scale, under the tsconfig the timed runs use             |

The two template capabilities are **separate single-error projects on purpose**. A combined plant carrying both errors let a checker pass on the strength of whichever half it supported: under the combined plant, one checker reported the `@click` mismatch, did not report `:disabled`, passed the gate, and was ranked at ~10× the speed of `vue-tsc`. Split into two projects, the same checker fails the `tmpl-prop` stage and its time is bracketed.

The diagnostic must **name the planted file**. Without that, an unrelated project-level failure (a config import that will not resolve, say) reads as a pass and the gate silently stops gating.

#### Caveat: `verter-tsc` is the only checker that is not silent on a clean corpus

⚠ The benchmark corpus is generated and clean, so **0 diagnostics is the correct answer**, and it is the answer `vue-tsc`, `vue-tsc (TNB / tsgo)`, `golar typecheck` and `golar default` all give. `verter-tsc` does not.

Measured locally (win32, the same runs the tables above are produced from — `results/` is gitignored, so these are not yet the published CI figures):

| Corpus | `verter-tsc` diagnostics | Every other ranked checker | `verter-tsc` rank in its class |
| --- | ---: | ---: | --- |
| 200 files (`fixtures/200`) | **442** | 0 | 3rd (2.20× golar's median) |
| 20 files (`fixtures/50`, check limit 20) | **42** | 0 | **1st** |

On the smaller corpus, the row ranked 1st in its class is also the only one emitting diagnostics, at roughly two per file. Ranking is by median time and is not adjusted for diagnostic count.

The diagnostics refer to Verter's own virtual code rather than to the source under test. The confirmation suite records this independently in [`tests/confirm/known-failures.json`](../tests/confirm/known-failures.json): on a **clean** generic `<script setup>` component `verter-tsc` emits three diagnostics — `___VERTER___Attrs requires 1 type argument`, `___VERTER___attributes is not generic`, and `Cannot find name 'items'` — against a fixture that contains no planted error.

Two consequences for how the tables read:

- **The work gate does not test for this.** It asks whether the planted bug was found, not whether anything else was reported. `verter-tsc` passes all four stages (`script`, `tmpl-prop`, `tmpl-event`, `corpus`) and is ranked on that basis.
- **The artifact column does not flag it either.** Diagnostics carry *informational* polarity, because on a clean corpus a higher count is not more work — so no ⚠ fires on the count, on any row. The count is recorded in this note instead of by an automatic flag.

Emitting diagnostics is not a gate failure, so the row is not bracketed. The condition on reading its time: the rows in this class did not produce equivalent output — one emitted 442 diagnostics on 200 files, the others emitted 0.

**Verter + tsgo:** `verter-tsc` requires the TypeScript **7 native** engine (stable `>=7.0.2,<7.1.0`), not the JS-engine `typescript` and not nightly `@typescript/native-preview`. This repo pins:

| Package | Role |
| --- | --- |
| `typescript@6.0.x` | vue-tsc / vue-component-meta |
| `typescript-go` (`npm:typescript@7.0.2`) | Verter tsgo engine |

The harness sets `VERTER_TSGO_BIN` to the platform native binary (`tsc.exe` / `tsc` under `@typescript/typescript-<platform>`). Override with `VERTER_TSGO_BIN=/path/to/tsgo` if needed.

### Formatters

| Tool     | Package           | Notes                                                    |
| -------- | ----------------- | -------------------------------------------------------- |
| Prettier | `prettier`        | Built-in Vue SFC support                                  |
| Oxfmt    | `oxfmt`           | Oxc formatter with Vue support                            |
| Vize     | `vize`            | `vize fmt --write`                                        |
| Biome    | `@biomejs/biome`  | `biome format --write` — **`<script>` block only**; unranked |

Each format run uses a **fresh copy** of the corpus (write is destructive).

`.prettierrc.json` and `biome.json` travel with every copy — both tools resolve
config by walking up from the file, and the work dir is not under the fixture
dir. The two configs set the same indent, line width, quote style, semicolon
and trailing-comma choices, so neither is doing more rewriting than the other
because of style settings alone.

Every work copy and gate plant also carries an empty `.git` directory as a
**repo-boundary marker**. Walk tools that honour ancestor `.gitignore` rules
(oxfmt 0.63+; oxlint on the lint surface) otherwise inherit *this* repository's
exclusion of the `work/` dir the copies live in and walk zero files — observed
live on oxfmt 0.63, which exited "all matched files may have been excluded by
ignore rules" and rewrote 0 planted files, where 0.61 (no ancestor-ignore
handling yet) was ranked. A real project root has the boundary; the marker
changes no tool's invocation.

**Template-rewrite work gate.** Each formatter is run against a messy SFC whose
template, script and style are all badly formatted, and must actually change the
`<template>` block or it is measured but **unranked**. Prettier, Oxfmt and Vize
pass. **Biome fails**: it treats `.vue` as a host for an embedded script and has
no template formatter, so the template and style blocks come back byte-identical
while the script block is reformatted.

This gate is why Biome is bracketed rather than ranked. It is not a small
difference in the ranking — on 50 SFCs Biome finished in **226 ms** against
Vize's 231 ms, so without the gate the fastest row in the table would have
belonged to the one tool doing a fraction of the work.

### Linters

| Tool              | Package                        | Invocation           | Notes                                    |
| ----------------- | ------------------------------ | -------------------- | ---------------------------------------- |
| eslint-plugin-vue | `eslint` + `eslint-plugin-vue` | in-process **and** CLI | 1T + worker fan-out, plus a CLI row    |
| Vize              | `vize lint`                    | CLI only             | 1T (`RAYON_NUM_THREADS=1`) + max threads |
| Verter            | `@verter/native`               | in-process only      | `VerterHost.lint` when available         |
| Biome             | `@biomejs/biome`               | CLI only             | 1T + max threads; **`<script>` only**, unranked |
| Oxlint            | `oxlint`                       | CLI only             | 1T (`--threads=1`) + max threads; **`<script>` only**, unranked |

**In-process and CLI rows share the table, with the mode in the row label.** A CLI pays process startup on every run — measured at **~85 ms** for a native CLI on an empty directory — while an in-process API pays it once, so read same-mode rows against each other. No single invocation mode covers every tool here (`vize lint` is CLI-only, `VerterHost.lint` is in-process-only), which is why the mode is stated on the row instead of one mode being dropped. ESLint is the one tool with both entry points, so it runs in **both** modes and acts as the reference point between them.

All tools lint an identical isolated copy of the corpus under `work/lint/`, so a tool that takes an explicit file list and a tool that walks a directory see exactly the same files.

Rule sets are **not** identical — throughput only.

**Biome is unranked on this surface too.** It lints the `<script>` block and has
no template rules, so it never examines `<template>` and misses the planted
`vue/no-v-html`. The same blind spot produces false positives on this corpus in
the other direction: a variable declared in `<script setup>` and used only in
the template is reported as `noUnusedVariables`. Its diagnostics are therefore
not comparable to the Vue-aware linters' in either direction, which is what the
gate records. Biome does honour `RAYON_NUM_THREADS`, so it gets the same 1T /
max-threads split as Vize (measured ~4.3× spread over 1000 SFCs).

**Oxlint is unranked for the same reason**, and it is the case worth being
careful about, because oxlint ships a `vue` plugin and the obvious objection to
its verdict is that the plugin was never switched on. It is switched on. An
`.oxlintrc.json` travels with the lint corpus **and with the gate plant**, so
the gate certifies exactly the configuration that is timed:

```json
{ "plugins": ["unicorn", "typescript", "oxc", "vue"] }
```

All four are listed because `plugins` **replaces** oxlint's default list rather
than extending it — `["vue"]` alone measured 88 active rules against a stock
run's 111. As written it is 142: the stock 111 plus 31 vue rules.

Those 31 rules read `<script>`. They cover SFC option and macro shape — prop
name casing, `defineEmits` declaration style, lifecycle calls after `await` —
and not one of them parses template syntax. With all 142 active, `oxlint` on
the planted `Dirty.vue` prints nothing and exits 0.

Where oxlint differs from Biome is in how it handles the blind spot. Biome
reports template-only variable uses as unused; oxlint disables `no-unused-vars`
for `.vue` outright, so it reports neither the false positive **nor** a variable
that is genuinely unused in both blocks (verified: `-D no-unused-vars` on an SFC
with a dead `const` is silent). That is the better failure mode, but it is still
a rule the other linters run and oxlint does not. It exposes `--threads`, so it
gets the same 1T / max-threads split as Vize and Biome (measured ~1.8× spread
over 1000 SFCs — a narrower spread than Biome's, still wide enough that one row
would hide it).

One thing to keep in mind when reading oxlint's bracketed time against Vize's
and Biome's: **oxlint ships no standalone executable.** It is a NAPI addon
(`@oxlint/binding-<platform>`) loaded into a Node process, so its per-run
startup is Node's, while `vize` and `biome` launch a native binary. The
methodology's "a CLI pays process startup on every run" applies to all three,
but it is not the same constant for all three. The memory row is labelled
accordingly.

### Component-meta

| Tool               | Package                              | Notes                                                                                                                                                     |
| ------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| vue-component-meta | `vue-component-meta`                 | Official `createChecker` + `getComponentMeta`                                                                                                             |
| Verter             | `@verter/native` `ComponentMetaHost` | Native meta host/session API. The separate `@verter/component-meta` npm tarball currently ships without `dist/`; the native host is used instead. |
| Vize               | —                                    | No dedicated public component-meta API on `vize` / `@vizejs/native`; row is `skipped` (declaration emit is a different job).                              |

### LSP (language servers)

Harness shape: init → didOpen → hover cold/warm (same workspace, file, and position for every server).

| Tool       | How we start it                | Notes                                                           |
| ---------- | ------------------------------ | --------------------------------------------------------------- |
| **Volar**  | `@vue/language-server --stdio` | Official Vue LS; `typescript.tsdk` = workspace `typescript/lib` |
| **Vize**   | `vize lsp --stdio`             | Prefers the standalone native server its VS Code extension ships (auto-discovered from VS Code globalStorage, version-matched); falls back to the npm package's Node entry. Override with `VIZE_LSP_BIN`. The row says which was used. |
| **Verter** | `verter-lsp` binary            | Optional: set `VERTER_LSP_BIN` if not auto-discovered           |

**Phases (in notes):** initialize · workspace ready (`n/a` if no signal) · **didOpen→hover** (primary ranking) · hover cold · hover warm median(5) · completion · definition.

**Retry budget is identical for every server** (6 attempts × 60 s, same backoff). It used to be 6 attempts for Volar and 2 for everyone else — and because the backoff sleeps sit *inside* the timed `didOpen→hover` window, that handed Volar up to ~3 s of billable sleep the other servers could not incur, while hiding slow project spin-up. A server that needs the retries now pays for them.

#### Hover content is gated at two positions

Latency is only comparable if every server answered the same question correctly, so hover **content** is validated at two positions in the same file. Both must pass to be ranked:

| Position | Correct answer | What it proves |
| --- | --- | --- |
| `const benchMarker` in `<script setup>` | some form of `Ref<string>` | the server returns real TypeScript types |
| `{{ benchMarker }}` in the **template** | `string` | the server actually models the template |

The template probe is the discriminating one. Vue **auto-unwraps refs in templates**, so the same symbol is `Ref<string>` in script and `string` three lines up in the interpolation. The script probe can be satisfied by proxying to a TypeScript server; the template probe cannot, so only a server that models the template returns the unwrapped type.

Measured, same workspace and position: two servers return the unwrapped `string`. One returns `benchMarker: Ref<string>` — the script type — accompanied by prose stating that refs are "auto-unwrapped in template". Its measured latency is the lowest of the three; it is **measured and shown in brackets, but not ranked**.

`Ref<...>` is rejected rather than accepted here, and the match is against the annotation (`benchMarker: string`) rather than a loose `string`, so that prose mentioning the word cannot pass. The probe runs **outside every timed window**, so it gates ranking without changing what the latency column measures.

Regression fixtures for all three real payloads live in [`tests/harness/lsp-hover-gate.test.mjs`](../tests/harness/lsp-hover-gate.test.mjs) — the first version of this gate wrongly failed a *correct* server whose doc comment ran into its type signature (`let benchMarker: stringStable hover target…`), which has no word boundary after `string`.

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

| Role                               | Status                                                              |
| ---------------------------------- | ------------------------------------------------------------------- |
| Ranked as a Vue LSP in its own right | No — it is not a language server, and not a different product to compare |
| `vue-tsc` engine swap              | **Shipped** — `vue-tsc (TNB / tsgo)` in the typecheck table          |
| LSP / IDE row, as Volar's **tsdk** | **Shipped** — `Volar (TNB / tsgo tsdk)`: same Volar binary, same Vue half, TypeScript half on tsgo |
| component-meta / lint engine swap  | Not yet — same technique would apply, see below                      |

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
| **lint**           | Clean fixtures → 0 issues; planted dirty fixtures → at least the expected issue count (and matching rule/code when the tool has that rule).                                                                                                                                                           |
| **typecheck**      | Clean projects stay clean; planted bugs in `<script>` and `<template>` are reported. Full plant list, inheritAttrs/root-shape rules, and the last pass/fail matrix: [docs/typecheck.md](typecheck.md).                                                                                                 |
| **component-meta** | Extracted public API matches plants: prop names/types/required/defaults, emits, slots, `defineExpose`. Tools are normalized to a common shape — schema phrasing may differ; missing API surface is a FAIL. Vize is scored via `generateDeclaration` (declaration emit, not a dedicated meta package). |
| **format**          | Formatters (Prettier, Oxfmt, Vize, Biome) exit 0, keep the SFC parseable via `@vue/compiler-sfc`, stay idempotent (`format(format(x)) === format(x)`), and preserve planted comments / `v-for` identifiers / `generic=`. Exit 0 alone is not a pass. |

Results: `results/confirm.md` + `results/confirm.json`. Exit code **1** on any FAIL; **skip** is allowed (e.g. verter-tsc without tsgo).

Fixtures live under `tests/confirm/fixtures/`. This suite is for correctness checks, not throughput ranking.

## Why there is no cold metric

An unwarmed first run does not measure a compiler — it measures V8 warming up. Measured on this corpus, six consecutive in-process runs:

| Compiler                    | run 1      | run 2  | run 6  | first-run penalty |
| --------------------------- | ---------- | ------ | ------ | ----------------- |
| `@vue/compiler-sfc` (JS)    | **335 ms** | 139 ms | 105 ms | **3.2×**          |
| `@vizejs/native` (Rust)     | 32 ms      | 34 ms  | 36 ms  | none              |

Ranking on run 1 would report a ~10.5× gap where the steady-state gap is ~3.2×, roughly a threefold overstatement of the warmed measurement. A JS tool cannot avoid that first-run cost; a native tool does not pay it. So:

- **Warmup is mandatory.** `--warmups 0` is clamped to 1 and a warning is printed.
- **The ranking metric is the median of the measured runs**, all of them warmed.
- Every row also reports min, stddev and **CV%**. CV > 10% is flagged ⚠ — that row is noise (thermal drift, contended runner), not a measurement.

Local scripts:

```bash
pnpm bench          # default: 5 measured runs, 1 warmup
pnpm bench:quick    # 3 runs, 1 warmup
pnpm bench:deep     # 9 runs, 2 warmups — use when CV% is high
```

### Artifact column — "fast" vs "did less"

Timing alone cannot tell a fast tool from one that skipped the work. Every table carries an **artifact** count next to the timing — what the tool actually produced:

| Surface | Artifact | Polarity |
| --- | --- | --- |
| compile | emitted code bytes | more = more work (⚠ below 50% of class peak) |
| typecheck | diagnostics emitted | informational |
| lsp / ide | hover bytes, item counts | informational |
| **jsx-compile** | **none yet** | — |
| **format** | **none yet** | — |
| **lint** | **none yet** | — |
| **component-meta** | **none yet** | — |

⚠ **Four surfaces currently have no artifact census at all.** Their rows are ranked on time with nothing attesting that the tools produced comparable output — the condition this column exists to detect. On `component-meta` the published spread is ~20× with neither a gate nor an artifact count, and the confirmation suite records the faster tool extracting fewer events and slots than the slower one. Those four surfaces' rankings are provisional until a census lands.

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
- CLI tools pay process startup on every run; in-process tools amortize it. The rows share a table, so **the invocation mode is stated on every row** — a CLI-vs-API gap includes process startup, not just tool speed.

### Sharding rule

**Linux only, and every timing surface runs in one job.** No result is ever merged across machines.

> **The one permitted split: by project, in the real-world workflow.** [`benchmark-real-world.yml`](../.github/workflows/benchmark-real-world.yml) runs a matrix of one job **per project**, with every surface and every tool inside it. That does not violate the rule, it applies it: every comparison the real-world report makes is *within* a corpus (Vue vs Vize vs Verter on Hoppscotch), and the report states outright that corpora are never ranked against each other. So the set of numbers that must share a machine is exactly one project's — which is exactly what one job contains. The split that would still be forbidden is a matrix over **surfaces**, putting `bundle` and `lint` for the *same* project on two VMs; that is the sharding this rule exists to prevent, wearing a matrix as a disguise.

Cross-OS rows were never comparable — this report already forbids it — so a three-OS matrix bought nothing but 3x the runner cost and three more sources of variance. One OS, one runner class, one set of numbers.

The tempting optimisation is to shard by surface — `lint` and `typecheck` are the two biggest and together are ~70% of the job. We don't, because it puts each surface on a different runner, and GitHub runners vary enough that a report stitched together from several VMs is not one measurement. Keeping everything on one box removes that discrepancy outright, and guarantees a comparison class can never accidentally span machines as surfaces are added or regrouped.

Measured cost per surface (n=200, runs=5, 32-core box) — all of it sequential in the one `bench` job. These are the figures recorded in [`.github/workflows/benchmark.yml`](../.github/workflows/benchmark.yml) (the `bench` job header and its `timeout-minutes` rationale), not estimates:

| Surface | Cost |
| --- | ---: |
| lint | ~100 s |
| typecheck | ~76 s |
| format | ~33 s |
| lsp | ~25 s |
| component-meta | ~9 s |
| compile (whole matrix) | ~8 s |
| jsx-compile | ~2 s |

~4.2 minutes total. Benchmarks are `workflow_dispatch` only — there is no push trigger and no schedule — so this is a cost paid when somebody asks for a number, not on every review round.

⚠ An earlier revision of this table published `lsp ~376 s`, drawn from a period when Volar exhausted a 6 × 60 s retry budget on every run. That is fixed and LSP is now the fourth-cheapest surface. If you have seen the old figure quoted, it is wrong.

The other three jobs run separately and are not in that total, also measured: `memory` ~4.8 min at `--samples 3`, `ide` ~3.2 min at the `--runs 3` CI uses, `ide-scale` ~3.6 min at the 1 run + 1 warmup CI uses. Jobs are capped at `timeout-minutes: 20`, with `ide` at 30.

**Request budgets scale with the workspace.** Every budget in the IDE suites used to be a flat constant sized for the worst case anywhere in the harness — 30 s per request, 45–60 s for a warm-up, 120 s in the scale suite — which on a 3-file workspace is not a budget but the absence of one. [`scripts/lib/ide-ops/budget.mjs`](../scripts/lib/ide-ops/budget.mjs) derives them linearly from the file count the suite declares, from a small-project floor (≤ 20 files) to a large-project cap (≥ 1000):

| Class | ≤ 20 | 100 | 200 | 500 | ≥ 1000 | What it covers |
| --- | --- | --- | --- | --- | --- | --- |
| `coldMs` | 60 s | 69.8 s | 82 s | 118.8 s | 180 s | Session start and project load |
| `warmMs` | 5 s | 7 s | 9.6 s | 17.2 s | 30 s | A request answered from the loaded project |
| `projectMs` | 60 s | 69.8 s | 82 s | 118.8 s | 180 s | A query that walks every file on every call |

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

| Project | ref | repo `.vue` | library-source `.vue` | what the rest is |
| --- | --- | ---: | ---: | --- |
| Naive UI | `v2.44.1` | 1708 | ~0 | component demos; the components are `.tsx` |
| PrimeVue | `4.5.5` | 2615 | **279** | showcase/doc fragments |
| Vuetify | `v4.1.6` | 1254 | ~8 | the docs application; the library is `.ts`/`.tsx` |
| Quasar | `quasar-v2.23.3` | 1383 | ~3 | playground app + docs examples |
| Element Plus | `2.14.3` | 1004 | **162** | docs examples + SSR test cases |
| Ant Design Vue | `4.2.6` | 733 | ~0 | per-component demos; 637 `.tsx` components |
| Nuxt UI | `v4.10.0` | 720 | **187** | docs app components |
| Vue Vben Admin | `v5.7.0` | 650 | **329** | app shells and playground views |
| Hoppscotch | `a4395b3e` (SHA) | 365 | **365** | all application source |

So three of the "obvious" component libraries contribute **no library SFCs at all**. Their `.vue` files are real, hand-written, non-trivial Vue — they are *documentation and demo* SFCs, which skew short and template-heavy next to a library component. Both flavours are worth measuring and they are not the same thing, so every corpus carries an explicit `kind` (`library-source` / `app-source` / `docs-demo`) and the report prints it beside the numbers.

Hoppscotch is pinned to a **commit SHA**, not a tag: its newest tag (`v3.0.1`) predates the rewrite and holds 147 SFCs of 2021-era Postwoman, while `main` holds the 365-SFC application everybody means.

**Rank within a corpus, never across one.** A files/second comparison between Naive UI's 1708 demos and PrimeVue's 279 components measures the corpora.

**A corpus larger than `--file-limit` (default 200) is truncated, and every row says so.** The limit takes an **alphabetical prefix by path**, so "Naive UI, 200 SFCs" is in fact the first 200 of 1708 sorted by path. Every tool gets the identical prefix, so the comparison between tools holds; the prefix is *not* a random sample of the project, so a coverage claim about the project does not. The provenance line now reads `200 of 1708 SFCs (alphabetical prefix, --file-limit 200)` whenever truncation happened, and the JSON records `{limit, truncated, totalAvailable}` per corpus. Raise it with `--file-limit`.

**No lockfile ⇒ the surfaces that execute the project's dependencies are unranked.** Naive UI and Ant Design Vue ship no lockfile at their pinned refs, so `pnpm install` cannot be frozen and the installed dependency set is whatever resolved on the day. `project-test`, `project-build` and `project-typecheck` run *inside* the checkout against that set, so their timings are not reproducible and every row on them — baseline included — is **unranked** for those corpora, with the reason on the row. The corpus-copy surfaces (`compile`, `format`, `lint`, `bundle`, `hmr`) read SFC text and externalise everything else, so the project's dependency resolution cannot move their numbers and they stay ranked. This is a property of the corpus, not of any tool.

**A `node_modules` on disk is not proof of an install.** A `pnpm install` that dies partway leaves a populated but partial tree, and a partial tree resolves some imports and not others — which is exactly the input that makes a checker report a handful of diagnostics very fast and look like the best tool in the table. So a corpus counts as installed only when `node_modules` exists **and** the fetch manifest does not record a failed install; a disagreement between the two is published in the surface methodology rather than silently resolved in either direction.

**A surface that throws is published as a harness gap.** If a surface run fails outright it produces no rows, and a missing table with no explanation is the harness hiding its own failure. Such runs are recorded as `surfaceFailures` in the JSON and listed in the report's methodology notes, stating that they are failures of this harness on this machine and that nothing should be inferred about the tools that would have been measured.

### Bundle and HMR — what is actually built

Neither surface runs a project's own `pnpm build`. That measures the project's chunking, asset and prerender configuration far more than the Vue toolchain, it produces nothing comparable across bundlers, and swapping the bundler under a project's own config is usually impossible.

Instead every cell builds the **same generated app shell** over the **same corpus**, and only the two dimensions under test vary: the bundler, and the Vue plugin.

- **Module graph = the corpus.** Any specifier that does not resolve to a real file outside `node_modules` is marked **external** and left in the output, identically in every cell. So `vue`, `~/composables/x`, `@hoppscotch/data` and `~icons/lucide/check` are all external, and no cell is credited for resolving less or charged for a dependency another happened to have on disk. It also means these surfaces do **not** require the project's install to have succeeded.
- **External, not stubbed.** An ESM stub cannot satisfy `import { useFoo } from './foo'`, so a stubbing harness drops a different set of modules per bundler. An external import is implemented the same way by Rollup, Rolldown and the webpack family.
- **`minify: false`, `treeshake: false`** everywhere. Minifying folds a second, bundler-specific tool into the number; tree-shaking would reward a bundler for discarding corpus modules.

**Vite 8 *is* the Rolldown migration** — it depends on `rolldown ~1.1`, and the standalone `rolldown-vite` package is deprecated in its favour. "Vite vs Rolldown" is therefore not a comparison you can construct by installing two Vites; the honest bundler-engine axis is **Vite 7 (Rollup) vs Vite 8 (Rolldown)**. Vite 7 is installed as the npm alias `vite7@npm:vite@7.3.6` so both majors coexist.

#### The bundler suite

Five bundlers in three families, each grouped separately:

| Bundler | Family | Engine | Vue integrations |
| --- | --- | --- | --- |
| Vite 8 | vite | Rolldown | `@vitejs/plugin-vue`, `unplugin-vue`, `@vizejs/vite-plugin`, `@verter/unplugin` |
| Vite 7 | vite | Rollup | same four |
| Rolldown | rolldown | Rolldown | `unplugin-vue`, `@verter/unplugin` |
| Rspack | webpack | Rspack | `vue-loader`, `unplugin-vue`, `@vizejs/rspack-plugin`, `@verter/unplugin` |
| webpack 5 | webpack | webpack | `vue-loader`, `unplugin-vue`, `@verter/unplugin` |

The **bare Rolldown** group exists to isolate Vite itself: Vite 8 and Rolldown bundle with the same engine, so the gap between those groups is what Vite's own pipeline costs.

Two family-specific differences are inherent and stated rather than hidden:

- **The webpack family needs an explicit TypeScript transform.** Every corpus SFC is `<script setup lang="ts">`, so the script block an integration emits is TypeScript. Vite ships a transform (esbuild on 7, oxc on 8); webpack and Rspack do not, and without one every cell died on the first type annotation. Both get **swc** — Rspack's built-in `builtin:swc-loader`, webpack's via `swc-loader` — with identical options, so the TS cost is a constant across the cells being compared. It does mean webpack-family rows include a step the Vite rows get internally.
- **The webpack family emits CommonJS.** The Vue integrations there produce helper imports that do not survive webpack's strict ESM linking. Output format is not what is being measured; it only has to be the same for every cell in the family.

#### Impartiality: baseline is not favourite

`@vitejs/plugin-vue` (Vite family) and `vue-loader` (webpack family) are the **baselines** — the reference each group is read against, because they are what the ecosystem actually ships on. Baseline does not mean protected. They are gated, bracketed and failed on precisely the same terms as everything else, and the codegen validity gate has bracketed the official `@vue/compiler-sfc` on real-world input before now.

Vize and Verter are under heavy active development and **are expected to fail cases**. That expectation changes nothing about how a failure is recorded: the module and the diagnostic, verbatim, with no softening and no editorialising. A note may explain *what* a tool does differently — Vize front-loads compilation into a plugin-init batch, and a reader needs to know that to interpret the row — but a note must never argue that a slow or failing row should be read charitably.

Three rules keep this honest, and all three cut in every direction:

1. **A tool the harness could not exercise gets no number, and the harness says the gap is its own.** Applied to the `unplugin` rows on the webpack family (which includes the *official* `unplugin-vue`), and to the Vite 7 HMR rows.
2. **A tool whose output was never checked is annotated as unchecked, not treated as passing.** A codegen gate that could not run, or that was never registered for a package, now prints `ⓘ CODEGEN VALIDITY GATE NOT RUN` on that row. Before, such a row was indistinguishable from one that had genuinely passed — silently favouring whichever tool the harness had failed to gate.
3. **A harness bug that penalises a tool is a harness bug, and is fixed even when the tool it was penalising is the official one.** The gate called `compileScript` unconditionally, which throws on a template-only SFC — valid Vue that the generated fixtures happen never to contain. On Hoppscotch it bracketed `@vue/compiler-sfc` 3.5 *and* 3.6 for a file they compile correctly. Fixed by gating what each tool actually emits. The same fix was checked against the other compilers: their gate paths take the whole SFC in one call and handle template-only internally, so there was no equivalent flaw to correct.

#### A cell that never ran is not a cell that failed

The surface distinguishes two failure modes, because conflating them publishes false verdicts. Which one applies is decided on the **transform census the driver recorded before it threw** — how many corpus SFCs actually reached the Vue transform — never on the wording of the error:

- **❌ BUILD FAILED** — corpus SFCs were compiled and then the build failed, so the integration's own output is implicated. A finding about the tool. `@verter/unplugin` is here on Hoppscotch: it emits `_createBlock(_resolveDynamicComponent(…), _ key: 1, …)`, missing the props object literal, in `components/app/KernelInterceptor.vue`.
- **⏭ NOT MEASURED** — the build failed before the Vue transform processed a single corpus SFC. A gap in this harness's wiring for that (integration × bundler) pair and a plugin that throws during initialisation look **identical** from here, so no number and no verdict is published either way, and the row says the ambiguity is the harness's. Currently the `unplugin`-based integrations on the webpack family are in this state; `vue-loader` is wired and passing, so each webpack-family group still has its reference row.

The earlier version of this test searched the error text for `?vue` or `type=script|template`, on the theory that a genuine codegen defect fails inside a Vue sub-request. **Only `vue-loader` emits that query shape.** The unplugin-based integrations name their sub-requests differently, so *their* codegen bugs matched the "harness gap" branch and were published as ⏭ NOT MEASURED — the harness apologising for a bug in a tool. A classification that depends on how an integration happens to name its sub-requests cannot be a fair test of any of them; a count of SFCs that reached a transform is the same measurement for all of them.

The rule generalises: **when the harness cannot exercise a tool, it publishes no number and says the gap is its own.** The HMR surface applies the same rule to its Vite 7 rows.

#### Corpus-compile gate

One untimed build per cell counts how many corpus SFCs reached a transform. A cell reaching fewer than the best cell **in its own bundler group** is measured but **unranked** — a build that compiled a third of the corpus is not a faster build.

The peer anchor is keyed on the **bundler id**, which is the same key the report groups and ranks by. Keying it on the *family* let Vite 7 and Vite 8 anchor each other: a Vite 7 cell could be unranked for compiling less than the same integration under Vite 8 — a table it is never compared in — and a Vite 8 cell could be excused by a Vite 7 peer nobody was reading.

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
- **The two tables are gated independently.** They were not: any failure in the HMR round trip skipped that cell's *cold-start* row as well, discarding a measurement that had already succeeded — the server started and the entry transformed, which is the whole of what cold start measures. Because the probe limitation above is Vite-major-specific, that deleted three plugins' cold-start rows on Vite 7 and left the fourth's standing at 1.00× against nothing. A failed HMR probe now costs only the HMR row.
- **A table whose baseline row is not ranked says so on every surviving row.** Ranking happens per bundler, so if `@vitejs/plugin-vue` is skipped, errored or bracketed for a bundler, the "vs fastest" column of the rows that remain compares challengers with each other only and the top one prints **1.00×** — which reads as "at least as fast as the official plugin" when the official plugin is absent. Those rows are labelled rather than suppressed: the measurement is real, it just is not a comparison against the reference.

### Project test suite (`project-test`)

The bundle surface asks whether an SFC can be **resolved and transformed**. This one asks whether the compiled component actually **works**: it runs a project's own Vitest suite, which mounts and renders the components and asserts on the output. That catches codegen which parses perfectly and behaves wrongly — a class of defect no build surface can reach — and it is the only surface that answers the practical question of whether dropping Vize or Verter into a real project leaves it working.

It is also the only real-world surface that **writes into the checkout**, because running a project's own suite means running inside it. One namespaced config file per challenger is written into the target package and removed in a `finally`; the clone is pinned, so residue from a hard kill clears with `pnpm fetch:real-world --force`.

**Targets are discovered, not listed.** A hard-coded "run this script in this directory" registry goes stale the moment a project reorganises, and a stale entry produces a skipped row that reads like a tool result. Discovery requires a package with `vitest` as a dependency *and* a non-watch script that actually invokes `vitest` — matched on the script body, because a `test` script that shells out to Playwright or jest is not something a Vue plugin can be swapped into. Layout is genuinely irregular: Hoppscotch's `hoppscotch-common` has `vitest.config.mts` and a `do-test` script but no `vite.config` at all, and its build lives in a sibling package.

**Baseline is the project's own toolchain, unmodified** — `@vitejs/plugin-vue` for every project in the registry. Baseline means the reference the other rows are read against, not a protected row: it is gated on tests-executed exactly like every challenger, and if the project's suite fails on this machine, that is what the row says.

Each row states which **swap mechanism** produced it:

| Mechanism | How | Status |
| --- | --- | --- |
| `none` | the suite run unmodified | baseline |
| `override` | a generated config imports the project's real Vitest config, resolves it (it may be an object, a function, or a promise) and replaces **only** the plugin named `vite:vue` | preferred, wired |
| `alias` | a Node **resolution hook** (`NODE_OPTIONS=--import`) redirects every import of `@vitejs/plugin-vue` to the challenger, so a config that cannot be imported or edited picks it up anyway | wired; fallback only |

The override throws rather than proceeding if it cannot find `vite:vue`. Adding the challenger beside the original would leave two Vue plugins both compiling every SFC — which still produces a number, and the number would be meaningless. The replacement goes in at the **original plugin's index**, not at the front of the array: Vite runs plugins in order, and hoisting the Vue plugin above a project's svg-loader, i18n plugin or macro transform would change which of them sees an `.vue` file first, making the swap a two-variable change.

The base config is resolved with the **same `ConfigEnv` the timed tool uses** — `{command:'serve', mode:'test'}` for `project-test`, `{command:'build', mode:'production'}` for `project-build`. A function-form config branches on it, so a shared hardcoded value (which is what this used to have) resolved the challengers' config in build mode while the baseline `vitest run` resolved it in serve/test mode: a different plugin list and different aliases, with nothing in the output to show it. The parameter is required, with no default, because the wrong value is invisible.

**Known inequality, published on every `override` row.** The project calls `vue({…})` with plugin-vue-specific options — `include`, `script.defineModel`, `template.compilerOptions`, `features` — and those are baked into the plugin *instance*, which exposes no way to read them back out. The substitution therefore constructs the challenger with **no options at all**, while the baseline keeps every one of the project's. That is not a neutral difference: an option the project set could make the baseline do more work (an extra template transform) or less (a narrower `include`). Neither direction is measured, so it is **not** claimed to cancel out — every row generated this way carries the disclosure.

**The alias fallback, and why it is a fallback.** Where a target has no importable config there is no `plugins` array to substitute into, so the swap moves to the only remaining seam: the point where the project's own code asks Node for `@vitejs/plugin-vue`. The timed process runs with `NODE_OPTIONS=--import` pointing at a loader that installs a `resolve` hook redirecting that specifier to the challenger's module. No dependency override, no reinstall, and nothing written into the checkout. `override` is still preferred whenever it is available, because it changes exactly one entry of one array while this changes what a specifier means for the whole process.

Two facts ride on every `alias` row, and the second one is the reason the mechanism is safe to ship at all.

- **⚠ Not equal work, in the opposite direction to `override`.** The project's own `vue({…})` options **do** reach the challenger here. A challenger that does not understand plugin-vue's option shape can therefore fail on the *options* rather than on the SFCs, and an option-shape mismatch and a real incompatibility are hard to tell apart from the outside. This surface does not tell them apart, and the row says so.
- **The redirect is verified, not assumed.** The hook appends one line per redirect to a marker file, and a row whose marker records **no** redirect is published as **⏭ NOT MEASURED**. A hook that matched nothing leaves the project running its own `@vitejs/plugin-vue` end to end: the run succeeds, the timings look ordinary, and the baseline's number would be published under a challenger's name with nothing in the output to distinguish it. That is the worst failure available on these surfaces and the only one that cannot be spotted after the fact. Every measured run must have fired, not merely one — a series in which the redirect happened once is a series of mixed toolchains.

The hook's *reach* was measured rather than reasoned about, and the first version of it was wrong in exactly the way the marker gate exists to catch. Matching only the bare specifier and its subpaths intercepted `import("@vitejs/plugin-vue")` perfectly and intercepted a real `vite build` **not at all**: Vite bundles the config file and resolves its externalised imports to absolute paths before evaluating it, so by the time Node is asked for the module the specifier is a `file:` URL in which the package name is only a path segment. The marker stayed empty, the project's own plugin compiled every SFC, and the row was withdrawn rather than published. The rule now matches the resolved path segment as well, and `module.registerHooks()` is used rather than the off-thread `module.register()` so the hook also covers `require`. Verified end to end on a real `vite build` and a real `vitest run`: the redirect fires, the substituted plugin is constructed **with the project's own `vue({include: […]})` options**, and the emitted bundle contains the substitute's output rather than the baseline compiler's.

**Test-count gate — on tests PASSED, not tests collected.** A challenger that passes fewer tests than the baseline is **unranked**, as is one that produced no test census at all or exited non-zero having passed nothing. Two bugs made this the load-bearing paragraph it is:

- The gate read tests *collected*. A toolchain whose codegen mounts a broken component still collects every test and then fails them, so a red suite cleared a collection gate — while the artifact column published `testsPassed`, meaning the table showed one number and the ranking decision was made on another. One quantity now serves both.
- `parseVitestSummary` treated *either* summary total as a successful parse. When every test file fails to collect, Vitest prints `Test Files 3 failed (3)` and `Tests no tests` — a file total, no test total. That parsed "successfully" with `tests: null`, the row was recorded `ok`, and the gate `continue`d over the null: a run that executed **zero tests** was published as the fastest row in the table. A missing test total is now a parse failure, so such a run is a visible ❌.

Tests that *fail* under a challenger while the baseline passes them are reported as a correctness finding about that tool. The gate decides ranking, on passes; the failure count is published next to the row so the reader sees both. The note is worded as a fact and deliberately does not argue that a failing row should stay in the ranking.

Where the baseline produced no census to compare against, the challenger rows are annotated `ⓘ TEST-COUNT GATE NOT RUN` rather than rendering identically to rows that cleared it — the same treatment `applyCodegenGates` gives an ungated compile row, and for the same reason: an unstated ungated row silently favours whichever tool the harness failed to anchor.

### Project build, own config (`project-build`)

`bundle` holds the module graph identical while the bundler *and* the plugin vary — that is what makes a Rollup number comparable to a webpack number. What it cannot tell you is what a **real** build costs, because the generated shell deliberately excludes dependency pre-bundling, chunk splitting across a genuine dependency tree, CSS extraction across a design system, asset pipelines, and the project's own plugin stack.

This surface keeps all of it. It runs the project's own `vite build` with the project's own `vite.config`, and varies exactly one thing: which plugin compiles the SFCs. The bundler is fixed, because the project's config chose it.

- Read `bundle` for *which implementation is faster on equal terms*.
- Read `project-build` for *what swapping this would cost me in my app*.

Neither supersedes the other and they are not comparable to each other.

**Only reliably swappable targets are measured**: a literal `vite build` script, an importable `vite.config`, and SFCs beneath it. Excluded by construction — `nuxt build` and `quasar build` generate their Vite config at runtime, so there is no `plugins` array to substitute into; workspace fan-out scripts (`pnpm -r`, `turbo run`) would time packages containing no Vue. Fewer packages measured truthfully beats every package measured approximately.

Every build, baseline included, is redirected with `--outDir` into the work tree, so the project's own `dist/` is never written and no run can leave the checkout in a state that changes the next one.

**Output-size gate.** A challenger emitting more than 5% fewer bytes than the baseline is **unranked**: a build that emits materially less is not a faster build until the difference is explained. The tolerance absorbs legitimate codegen differences (helper naming, hoisting choices), not a dropped chunk. Emitting materially *more* is annotated rather than gated — more output is not cheating, but it changes what shipped. Where the baseline produced no output census to anchor against, the challenger rows are annotated `ⓘ OUTPUT-SIZE GATE NOT RUN`, so an ungated row never renders identically to one that cleared the gate.

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

| Row | What it is |
| --- | --- |
| `vue-tsc` **(JS)** | the official Vue Language Tools CLI on the stock JavaScript TypeScript compiler. **Baseline.** |
| `vue-tsc (N)` | the *same* vue-tsc with `typescript` aliased to typescript-native-bridge, so the engine is tsgo in-process |
| `verter-tsc` | Verter's checker on stable tsgo |
| `Vize` | `vize check --tsconfig …`, native, Corsa when available |

**Engines are grouped, not just tagged** — deliberately unlike the generated-corpus `typecheck` surface above, which keeps both engines in one table behind the `(JS)` tag. Here the rows are ranked in **separate tables**, because a ratio across them measures TypeScript's own Go rewrite at least as much as the Vue tooling on top of it — and the `vue-tsc` (JS) / `vue-tsc (N)` pair, identical but for the engine, is what lets a reader see how much of any gap is which. The engine tag comes from the canonical `engine: "tsc-js"` value the report's `engineTag()` keys on; the row's *label* must not also spell "(JS)", or a non-canonical engine string leaves the row untagged and reading as another native checker.

**Diagnostics are a census, not a pass/fail.** Real projects are not clean at their pinned release, a checker is not wrong for saying so, and a non-zero exit is expected and allowed for every row equally. The counts are published on every row (with `artifactPolarity: informational`, so the renderer's generic "produced less than the largest artifact" warning does not scold the *quietest* checker). Diagnostic equivalence is **not** asserted.

Four gates, all applied to every row including the baseline's:

- **Baseline pre-flight (untimed).** The baseline typechecks each candidate package before anything is measured, and a target is measured only if that produced diagnostics across more than one file, or exited clean. A target the baseline merely *aborts* on publishes no rows at all. Not hypothetical: Hoppscotch's `hoppscotch-common` ships a committed `src/types/post-request.d.ts` with a syntax error at line 1294, and vue-tsc reports exactly that one TS1128 after ~4.3 s having checked **none** of the 293 SFCs. Anchoring a census on that inverts the gate — it marks the checkers that actually completed as the outliers.
- **Program construction, per measured run.** The same `actuallyChecked` test is applied to every timed run: exit 0, or diagnostics spanning at least two files. It was previously defined, documented, and called only in the pre-flight — so a checker whose *measured* runs aborted during program construction published a fast, ranked row, gated on a census it satisfied with the single diagnostic that stopped it.
- **TNB activation.** The native row is unranked unless the bridge printed its activation banner on **every** measured run. With `.some()`, a series in which the bridge loaded once and silently fell back to the JavaScript checker four times passed — publishing a JS-engine measurement under a native-engine label, the exact mislabel the gate exists to prevent.
- **Diagnostic census.** A checker reporting under half the baseline's diagnostics is unranked: it may be skipping files or not checking templates, and doing less finishes sooner. Reporting materially *more* is annotated, not gated — stricter is legitimate. When the baseline reports **zero** diagnostics and exits clean, the ratio test cannot fire at all (`diags < 0 × 0.5` is never true), so on the one corpus state where "reported nothing" is easiest to achieve by not checking, every row used to pass by default; the gate instead requires the row to exit 0 as well. Reporting nothing while failing is not a clean pass.

**Diagnostic counting covers every output shape, with one shared pattern list.** `vue-tsc`/`verter-tsc`/tsgo write `File.vue(3,7): error TS2322:` (or the pretty `File.vue:3:7 - error TS2322:`); `vize check` prints the path once as a heading and indents `error:1:14 [TS2322] …` beneath it, never writing the literal `error TS1234`. An `/error TS\d+/` counter scored Vize **zero** on output where it had just reported real diagnostics — and a zero here is not harmless, because the census gate unranks a row reporting far fewer than the baseline. Mis-parsing a tool's output would bracket that tool for the harness's inability to read it, so the shapes are handled together and the file a diagnostic belongs to is taken from the heading when the line does not carry one.

**Invocation is made as close as the tools allow, and the residual difference is stated.** The tsc-family rows run `--noEmit -p tsconfig.json`. Vize is invoked with **no path pattern**, because it documents that omitting patterns uses the tsconfig's `include`/`exclude`/`files` — the closest analogue of `-p`. Passing `.` (as an earlier revision did) made Vize walk the package directory instead, checking a different file set in an unmeasured direction: on `hoppscotch-desktop` that is 37 files against the tsconfig's 31. Vize still builds its own virtual project rather than a TypeScript program, so identical file sets are **not** asserted; the diagnostic census is what would expose a materially smaller one.

### Project component-meta, own tsconfig (`project-component-meta`)

Extracting component metadata from a **lifted** corpus is refused for the same reason typechecking one is: a metadata extractor whose imports do not resolve does not fail, it returns components with no props, very fast — and in a table that is indistinguishable from a fast, thorough extractor. This surface runs in place, in the package with the most SFCs beneath it, against the project's own `tsconfig.json` and its own installed `node_modules`. It reads the checkout and never writes to it.

| Row | What it is |
| --- | --- |
| `vue-component-meta` | official `createChecker(tsconfig)` + `getComponentMeta`. **Baseline.** |
| `@verter/component-meta` | Verter's published `openComponentMetaSession({root, tsconfig})` + `getComponentMeta` |
| Vize | no row. The surface **checks** `@vizejs/native` for a metadata API at runtime and reports what it found; declaration emit is a different job and is not substituted for one |

The component set is the **resolved corpus restricted to the target package**, not a private walk, so `--file-limit` and its truncation disclosure apply here exactly as everywhere else. A private walk would quietly measure a different file set from the one the corpus line names.

**Baseline pre-flight.** Each candidate target is probed untimed: the baseline must build a checker, resolve components from a bounded sample, and find declared props on some of them. A target it cannot read publishes **no rows at all** — every other row would be gated against a reference that did no work, which marks the tools that *did* extract metadata as the anomalies.

Three gates:

- **Metadata census.** A row that resolved metadata for fewer components than the baseline is unranked, and so is a row that resolved none — including the baseline's own row, gated identically. Returning `{}` is the fastest thing a metadata extractor can do, and it is the trivial way to win this surface.
- **Prop coverage.** A row reporting **zero props** for a component that declares props is unranked. This is the gate that catches an empty answer hiding behind a healthy-looking component count.
- **Member totals are reported, never gated.** props + events + slots is published beside the times and no threshold is applied to it.

The prop-coverage anchor is the part worth reading twice, because the obvious version of it was unfair and measurement caught it. Anchoring on "the baseline found props here" brackets a tool for a **schema disagreement**: on Hoppscotch's first 25 SFCs, `vue-component-meta` reports props for 25 of 25 while only 18 contain a `defineProps`, because it also reports the implicit and inherited instance surface — so `@verter/component-meta`, which reports props on exactly those 18, was unranked for reporting the declared API. The anchor is therefore the **intersection** of "the source declares props" (read off the SFC text, tool-independent) and "the baseline found props". The claim the gate then makes is one no reasonable reading disputes: this component declares props, the reference tool found them, and you reported none.

Metadata **equivalence is not asserted**, and correctness is not checked against the third-party sources — nobody has written down the right answer for these components. This is a throughput surface with a coverage census.

### Project LSP, project as workspace (`project-lsp`)

The generated-corpus `lsp` surface uses a tiny synthetic workspace with a planted marker, which is what makes its hover gate possible — the correct answer is written down. It is also a poor model of an editor session, because the expensive part of a real one is **loading a real project**. This surface keeps that cost: the workspace root is the project package with the most SFCs and its own `tsconfig.json`, the document opened is one of the project's own SFCs, and every server gets the same directory, file and position.

| Row | What it is |
| --- | --- |
| `Volar` **(JS)** | `@vue/language-server` v3 with the stock JavaScript TypeScript tsdk. **Baseline.** |
| `Volar (TNB / tsgo tsdk)` | the *same* Volar with its TypeScript half on typescript-native-bridge |
| `Verter LSP` | `verter-lsp`, the native server from the published npm package |
| `Vize LSP` | `vize lsp --stdio` (native server when found, Node entry otherwise — the row says which) |

Both Volar rows are measured as the **two-process product v3 is**: `@vue/language-server` plus `typescript-language-server` with `@vue/typescript-plugin`, joined by the tsserver bridge, the same `.vue` buffer synced to both, each feature asked of both in parallel with the **slower half charged**, and both processes' startup and project load inside the timings.

**Two operations, ranked separately and never pooled** — `didOpen → diagnostics` (cold: the server must load the real project before it can say anything) and `hover` (warm, median of 3, document already open). Each is measured in its **own fresh session**, so the hover row is not credited with a project load the diagnostics row already paid for, and tool-order rotation applies to each operation independently. Within an operation the rows are split again by **TypeScript engine**, for the reason `project-typecheck` splits them: a JS-vs-tsgo ratio measures TypeScript's own Go rewrite at least as much as the Vue layer above it.

**Content gates, and the one claim this surface refuses to make.** There is no planted marker in third-party source, so nobody knows what the right answer is. What can still be established is that a server *answered*:

- **Hover** — the payload must be non-empty on every measured run, at the **single position an untimed baseline pre-flight established the reference server answers at**. Choosing the position any other way would make the gate a test of the harness's cursor placement: a position on whitespace or in a comment would unrank every row alike and read as four broken servers.
- **Diagnostics** — a run that never published diagnostics for the opened document is an ❌ error, not a fast row; there is no latency to report. Where the baseline published at least one diagnostic, a row publishing none on every run is unranked. Where the baseline published an **empty list** — a legitimate answer, but not an anchor — the gate cannot fire and the row says so rather than rendering as though it had passed.

⚠ **Not equal work on the diagnostics operation, and the direction is known.** `publishDiagnostics` from the Volar rows carries what the *Vue* server computes. Volar v3 delegates TypeScript to a separate tsserver that speaks the **tsserver protocol**, not LSP, so TypeScript diagnostics reach a real editor through the extension and are **not** in that notification — while a single-process server publishes its Vue and TypeScript diagnostics together in one message. The Volar diagnostics rows are therefore answering a **narrower question**, and a narrower question is answered faster. The count is published on every row so the difference is visible rather than inferred, and the gate is deliberately **one-directional** — it fails a row for publishing *nothing*, never for publishing *fewer* — so it cannot punish a server for the broader answer. The hover operation has no such asymmetry: both Volar halves are asked in parallel and the slower is charged.

⚠ **Correctness of the content is NOT asserted for third-party code.** This surface establishes that a server produced an answer where the reference server produced one, and nothing more. Content correctness is gated on the generated corpus (`lsp`), against a symbol whose type is known.

A degraded type backend is detected from stderr and reported on any row, ranked or not (Vize logs a failed Corsa spawn; Verter logs verter-only mode). It is reported rather than used to fail a row on its own — the content gates decide ranking, and this is the explanation for the number in either direction.

### Surfaces deliberately not run on real-world corpora

`typecheck`, `component-meta` and `lsp` stay refused on a **lifted** corpus, and asking for one by name prints the reason and points at the in-place surface instead. A corpus pulled out of a monorepo resolves none of its imports — `~/composables/x`, `@hoppscotch/data` and `~icons/lucide/check` are meaningless outside the project's own alias configuration — so a checker reports thousands of TS2307s, or, if the tsconfig is wrong the other way, nothing at all very quickly.

They are not *absent*, though: `project-typecheck`, `project-component-meta` and `project-lsp` are the versions of those three measurements worth publishing, and all three run in the checkout against the project's own tsconfig. The lifted names are kept as refusals rather than quietly redirected, because "typecheck on a lifted corpus" and `project-typecheck` are different measurements and a reader asking for one must not be handed the other.

### What real-world runs are for

They find things a generated corpus cannot. The first run of the bundle surface against Hoppscotch caught `@verter/unplugin` emitting syntactically invalid JavaScript for a `v-if` on a dynamic component (`_createBlock(_resolveDynamicComponent(…), _ key: 1, …)` — the props object literal is missing), in `packages/hoppscotch-common/src/components/app/KernelInterceptor.vue`. No generated fixture resembles that file. Treat a failure here as a finding about the tool, and a speed number here as secondary to `fixtures/N`.

## CI layout

| Workflow                                          | When                                | What                                                                                                                                    |
| ------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Test** (`.github/workflows/test.yml`)           | pull_request, `main` push           | `tests/harness/run.mjs` + `tests/confirm/run.mjs`. Install only, no fixtures. **Publishes nothing.**                                    |
| **PR** (`.github/workflows/pr.yml`)               | pull_request                        | **Smoke only**: build (install + `fixtures/20`) → one throughput pass over every surface at `--runs 1 --warmups 0`. **No** `pnpm confirm` (that runs in `test.yml` on the same event — see [`pr.yml`](../.github/workflows/pr.yml) L92), **no** full bench, **no** README rewrite. |
| **Benchmark** (`.github/workflows/benchmark.yml`) | `workflow_dispatch` **only**        | build → **bench** + **ide** + **ide-scale** + **memory** + **confirm** → update `README.md` + [`MEMORY.md`](../MEMORY.md) + [`docs/typecheck.md`](typecheck.md). The only workflow that commits. |
| **Benchmark (real-world)** (`.github/workflows/benchmark-real-world.yml`) | `workflow_dispatch` **only** | Matrix of **one job per project**: clone at the pinned ref → install → `compile,format,lint,bundle,hmr,project-test,project-build,project-typecheck` for every tool on that one runner → `README.md` real-world section. `fail-fast: false`; the clone is cached on the pinned ref. |
| **E2E VS Code** (`.github/workflows/e2e-vscode.yml`) | `workflow_dispatch` **only**     | Heavy extension-host path (optional). No schedule.                                                                                      |

**All workflows run on `ubuntu-latest`.** One runner class for everything — measurement, correctness and E2E. Platform-specific breakage (Windows file locks, `.cmd` shims, path handling) is consequently **not covered by CI**; run `pnpm confirm` and `pnpm test:harness` locally on macOS/Windows if you need that signal.

**Benchmarks do not run on push or pull request, and there is no schedule.** The reason is not cost — the whole measurement is ~16 minutes of runner time across four jobs (`bench` 4.2 min, `memory` 4.8 min, `ide` 3.2 min, `ide-scale` 3.6 min, each capped at 10). It is that a published number should be traceable to a person who asked for it, and a cron that silently rewrites the README on a runner nobody was watching is the opposite of that. Validation on PR/push is `test.yml`; measurement is a deliberate manual dispatch.

Doc updates follow the [rolldown/benchmarks](https://github.com/rolldown/benchmarks) pattern:

1. Measure on a single Linux runner; upload `results/*` artifacts.
2. On a `main` dispatch, a final job downloads artifacts, runs `scripts/update-readme.mjs` and `scripts/update-memory-readme.mjs`, and **auto-commits** `README.md` + `MEMORY.md` + `docs/typecheck.md` with `[skip ci]`.

A section whose artifacts are missing — because its job failed, or was not part of the run — is **left exactly as published**. It is never replaced with a "no artifacts" placeholder, so a partial run can never erase good results and commit the erasure.

Published resource numbers: **[MEMORY.md](../MEMORY.md)**.

## Methodology

1. Generate unique-content `.vue` SFCs (`scripts/generate.mjs` — diverse templates + uniquify) **once** in the build job.
2. For each surface, run every available tool on the **same** corpus, discarding ≥1 warmup pass per tool and **rotating tool order** on every pass.
3. Rank by the median of the measured runs, one table per surface (vapor/vdom targets separate); report min / stddev / CV% alongside.
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

# Content-hash cache demo (NOT for ranking)
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
  update-readme.mjs         # CI merge into BENCHMARK_RESULTS / IDE_RESULTS
  update-memory-readme.mjs  # CI merge into MEMORY.md MEMORY_RESULTS
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
results/                    # local + CI reports (gitignored; published copies live
                            #   in the README / MEMORY.md marker sections)
.github/workflows/
  test.yml                  # harness + confirm on PR / main push (publishes nothing)
  pr.yml                    # PR smoke: tiny throughput pass only (no confirm)
  benchmark.yml             # manual dispatch: bench + ide + ide-scale + memory
                            #   + confirm → README / MEMORY.md / docs/typecheck.md
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

On `main`, Linux CI copies the latest report into **[MEMORY.md](../MEMORY.md)** (committed).

#### Caveat: Volar's LSP memory row is not the whole of Volar, but the LSP timing row is

⚠ This asymmetry runs in opposite directions on two different axes.

Vue language-tools v3 is a **two-process** architecture: `@vue/language-server` plus a TypeScript server reached over the `tsserver/request`↔`tsserver/response` bridge. Both processes are real, and the TypeScript half is the larger of the two.

| Surface | What Volar is charged for |
| --- | --- |
| **LSP / IDE timing** | **Both processes.** Startup and project load of the pair are inside the timings, and each feature is asked of both halves in parallel with the **slower** one charged (`scripts/lib/surfaces/lsp.mjs`). |
| **Memory probe** | **The Vue server only.** RSS and CPU are sampled from a single pid; the tsserver half is a separate, larger process and is **not** included (`scripts/memory-worker.mjs`). |

So the memory tables cover **one of Volar's two processes**, and the latency tables cover both. Neither number is wrong for what it measures, but they do not cover the same process set: "Volar's memory" and "Vize's memory" are not measurements of the same thing. Vize and Verter run single-process, so their rows cover the whole tool.

Treat Volar's LSP memory figure as a **lower bound on the Vue half**, not as Volar's footprint. The affected rows carry the same warning in their notes; it is emitted by the probe rather than being editorial.

## Interpreting results

- Published numbers are **Linux only**. Local runs on macOS/Windows are for relative comparison on your own box, not against published figures.
- Compare compiler rows within the same thread class (`1t` vs `1t`, etc.).
- `golar typecheck` is pure typecheck; bare `golar` also runs lint.
- `skipped` / `error` rows are not ranked.
- Numbers from other corpora, hardware, or scripts are a different experiment.
- Memory min/max/avg are tool-attributed (see table above); do not mix with wall-clock tables.
