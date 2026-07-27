# Vue Toolchain Benchmarks

Throughput measurements for **Vue SFC compilers**, **typecheckers**, **formatters**, **linters**, **component-meta**, and **LSP** tools.

Layout and CI pattern are similar to [rolldown/benchmarks](https://github.com/rolldown/benchmarks).

**Requirements:** Node.js 22+, pnpm 10 (`corepack enable`).

| Rule of thumb        | Detail                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Sort                 | Tables sort by median measured time; every row also shows what it **produced**                        |
| Surfaces             | Independent — do not compare compile ms to typecheck/lint/format ms                                   |
| Missing tools        | Reported as `skipped` (missing API/binary); not replaced with another job                             |
| Warmup               | **Mandatory** — every measured run follows ≥1 discarded pass (`--warmups 0` is clamped to 1)          |
| Compile corpus       | Primary: unique file contents (`fixtures/N`). `fixtures/N-repeated` is a content-hash cache demo only |
| Diagnostics / format | Not required to match across tools; throughput only unless using the confirmation suite               |
| Comparison classes   | Engine × invocation × threading × target ranked in **separate** tables — never mixed |
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

⚠ Vize's production and development rows perform **identical work**, because `compileSfc` exposes no production flag. That is stated in the row notes rather than papered over by swapping in a different knob.

**Comparison classes:** Vue official compiler is **1T only** (worker_threads variants removed). Vize/Verter batch pools are ranked separately, and Verter's `session` mode — which keeps a persistent host across warmups and runs — is ranked as `batch-cached`, apart from the cache-free batch rows.

**Single-file microbench** (tinybench size ladder under `fixtures/compile-single/`):

```bash
pnpm bench:compile:single
# tiny → small → medium → large → xlarge; 20 warmup + 100 iters
# Each iteration uses a **unique** SFC body (defeats Vize content-hash free-rides)
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

### Fixtures (important for Vize content-hash caches)

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
| Vue TSC          | `vue-tsc`                   | `vue-tsc --noEmit -p tsconfig.json`           | **TypeScript 5.9 (JS)** |
| Vue TSC (TNB)    | `typescript-native-bridge`  | same command, `envs/tnb` install              | tsgo **stable** 7.0.2 (in-process NAPI/FFI) |
| Golar            | `golar` + `@golar/vue`      | `golar typecheck` (+ default mode separately) | typescript-go (native) |
| Vize             | `vize`                      | `vize check . --tsconfig …`                   | tsgo **nightly** (`@typescript/native-preview` 7.0.0-dev) |
| Verter           | `verter-tsc`                | `verter-tsc --noEmit -p tsconfig.json`        | tsgo **stable** 7.0.2 |

#### Engines are ranked separately — and this used to be the biggest single caveat

Most of these run the **native Go TypeScript engine**; stock `vue-tsc` runs the **JavaScript** one. Ranking them in one table mostly measures TypeScript's own Go rewrite, not the Vue layer under test. So engine is part of the comparison class and each gets its own table.

**`vue-tsc (TNB / tsgo)` is what makes the incumbent comparable at all.** It is the *same* `vue-tsc`, the same `@vue/language-core`, the same template checking — with `typescript` aliased to [typescript-native-bridge](https://github.com/johnsoncodehk/typescript-native-bridge), whose checker is tsgo in-process. One variable changes, so the pair isolates the engine from the Vue layer, and the native row can finally be ranked against Vize/Verter/golar directly.

Illustrative decomposition (local, `fixtures/50`, win32, 3 runs — published numbers come from Linux CI):

| Comparison | Gap | What it actually measures |
| --- | --- | --- |
| `vue-tsc` (JS) vs `vue-tsc` (TNB) — **same tool, engine swapped** | **~1.9×** | TypeScript's Go rewrite, isolated. Nothing to do with Vue tooling. |
| `vue-tsc` (TNB) vs `verter-tsc` (**same engine, both validated**) | **~2%** | The real Vue-layer difference — they are effectively equal |
| `vue-tsc` (TNB) vs golar (**same engine, both validated**) | ~1.24× | golar's genuine Vue-layer lead |
| Vize (unranked) vs `vue-tsc` (JS) | ~10× | All of the above **plus** work Vize does not do |

The headline: once the engine is held constant, `vue-tsc` is within a couple of percent of `verter-tsc`. Almost the entire "native Vue typechecker is ~2× faster" story is TypeScript's Go rewrite — which the incumbent inherits for free by swapping one package. A single "Nx faster" number spanning engines multiplies these factors together and attributes the product to Vue tooling. It shouldn't.

Stock JS-engine `vue-tsc` is **kept** as a row, because it is what ships today.

TNB lives in [`envs/tnb`](envs/tnb/README.md) as a standalone project, never a root `typescript` override — an override would swap the engine under component-meta, lint and LSP at the same time. It must also print its activation banner on the work-gate run, or the row is unranked: a silent fallback to the JS checker would leave the row labelled native while running JS.

Note also that Vize ships a tsgo **nightly** while `verter-tsc` requires stable and explicitly rejects nightlies. Same class, different rigour — every row prints its exact engine build.

Default typecheck file limit is **200** (or smaller if the fixture is smaller) — typecheck cost scales steeply vs pure compile.

**Work gate — every stage required to be ranked.** Results appear per row as `gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓`:

| Stage           | What it plants                                              | What it proves                                                               |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **script**      | Type error in `<script setup>` only                          | The tool typechecks script blocks at all                                      |
| **tmpl-prop**   | Clean script; `:disabled` string→boolean in template only    | It checks native-element **prop types** in templates                          |
| **tmpl-event**  | Clean script; `@click` number→function in template only      | It checks **event handler** types in templates                                |
| **corpus**      | Same bug planted into the **full timed corpus**              | It still finds it at scale, under the tsconfig the timed runs use             |

The two template capabilities are **separate single-error projects on purpose**. A combined plant carrying both errors let a checker pass on the strength of whichever half it supported — one native checker reports the `@click` mismatch, misses `:disabled` entirely, and was ranked ~10× faster than `vue-tsc` while doing strictly less checking.

The diagnostic must **name the planted file**. Without that, an unrelated project-level failure (a config import that will not resolve, say) reads as a pass and the gate silently stops gating.

**Verter + tsgo:** `verter-tsc` requires the TypeScript **7 native** engine (stable `>=7.0.2,<7.1.0`), not `typescript@5` and not nightly `@typescript/native-preview`. This repo pins:

| Package | Role |
| --- | --- |
| `typescript@5.9.x` | vue-tsc / vue-component-meta |
| `typescript-go` (`npm:typescript@7.0.2`) | Verter tsgo engine |

The harness sets `VERTER_TSGO_BIN` to the platform native binary (`tsc.exe` / `tsc` under `@typescript/typescript-<platform>`). Override with `VERTER_TSGO_BIN=/path/to/tsgo` if needed.

### Formatters

| Tool     | Package    | Notes                          |
| -------- | ---------- | ------------------------------ |
| Prettier | `prettier` | Built-in Vue SFC support       |
| Oxfmt    | `oxfmt`    | Oxc formatter with Vue support |
| Vize     | `vize`     | `vize fmt --write`             |

Each format run uses a **fresh copy** of the corpus (write is destructive).

### Linters

| Tool              | Package                        | Invocation           | Notes                                    |
| ----------------- | ------------------------------ | -------------------- | ---------------------------------------- |
| eslint-plugin-vue | `eslint` + `eslint-plugin-vue` | in-process **and** CLI | 1T + worker fan-out, plus a CLI row    |
| Vize              | `vize lint`                    | CLI only             | 1T (`RAYON_NUM_THREADS=1`) + max threads |
| Verter            | `@verter/native`               | in-process only      | `VerterHost.lint` when available         |

**In-process and CLI tools are ranked in separate tables.** A CLI pays process startup on every run — measured at **~85 ms** for a native CLI on an empty directory — while an in-process API pays it once. No single invocation mode covers every tool here (`vize lint` is CLI-only, `VerterHost.lint` is in-process-only), so splitting is the only way to compare like with like. ESLint is the one tool with both entry points, so it runs in **both** classes and acts as the shared reference point between the two tables.

All tools lint an identical isolated copy of the corpus under `work/lint/`, so a tool that takes an explicit file list and a tool that walks a directory see exactly the same files.

Rule sets are **not** identical — throughput only.

### Component-meta

| Tool               | Package                              | Notes                                                                                                                                                     |
| ------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| vue-component-meta | `vue-component-meta`                 | Official `createChecker` + `getComponentMeta`                                                                                                             |
| Verter             | `@verter/native` `ComponentMetaHost` | Native meta host/session API. The separate `@verter/component-meta` npm tarball currently ships without `dist/` (packaging gap); the native host is used. |
| Vize               | —                                    | No dedicated public component-meta API on `vize` / `@vizejs/native`; row is `skipped` (declaration emit is a different job).                              |

### LSP (language servers)

Harness shape: init → didOpen → hover cold/warm (same workspace, file, and position for every server).

| Tool       | How we start it                | Notes                                                           |
| ---------- | ------------------------------ | --------------------------------------------------------------- |
| **Volar**  | `@vue/language-server --stdio` | Official Vue LS; `typescript.tsdk` = workspace `typescript/lib` |
| **Vize**   | `vize lsp --stdio`             | From npm `vize` package                                         |
| **Verter** | `verter-lsp` binary            | Optional: set `VERTER_LSP_BIN` if not auto-discovered           |

**Phases (in notes):** initialize · workspace ready (`n/a` if no signal) · **didOpen→hover** (primary ranking) · hover cold · hover warm median(5) · completion · definition.

**Retry budget is identical for every server** (6 attempts × 60 s, same backoff). It used to be 6 attempts for Volar and 2 for everyone else — and because the backoff sleeps sit *inside* the timed `didOpen→hover` window, that handed Volar up to ~3 s of billable sleep the other servers could not incur, while hiding slow project spin-up. A server that needs the retries now pays for them.

#### Hover content is gated in two places — and the template one is the Vue-specific one

Latency is only comparable if every server answered the same question correctly, so hover **content** is validated at two positions in the same file. Both must pass to be ranked:

| Position | Correct answer | What it proves |
| --- | --- | --- |
| `const benchMarker` in `<script setup>` | some form of `Ref<string>` | the server returns real TypeScript types |
| `{{ benchMarker }}` in the **template** | `string` | the server actually models the template |

The template probe is the discriminating one. Vue **auto-unwraps refs in templates**, so the same symbol is `Ref<string>` in script and `string` three lines up in the interpolation. A server can satisfy the script probe by proxying to a TypeScript server — that is not the job a *Vue* language server exists to do — but only a server that models the template gets the unwrapped type right.

Measured, same workspace and position: two servers return the unwrapped `string`. One returns `benchMarker: Ref<string>` — the script type — accompanied by prose stating refs are "auto-unwrapped in template", describing the unwrapping it did not perform. It is by far the fastest, which is exactly why the gate exists. It is **measured and shown in brackets, but not ranked**.

`Ref<...>` is rejected rather than accepted here, and the match is against the annotation (`benchMarker: string`) rather than a loose `string`, so that prose mentioning the word cannot pass. The probe runs **outside every timed window**, so it gates ranking without changing what the latency column measures.

Regression fixtures for all three real payloads live in [`tests/harness/lsp-hover-gate.test.mjs`](tests/harness/lsp-hover-gate.test.mjs) — the first version of this gate wrongly failed a *correct* server whose doc comment ran into its type signature (`let benchMarker: stringStable hover target…`), which has no word boundary after `string`.

**Not measured:** VS Code extension host UI cost — only the stdio language-server protocol.

**Volar hybrid note:** Vue language-tools v3 no longer embeds tsserver. The client must bridge `tsserver/request` → TypeScript LS (`typescript.tsserverRequest`) → `tsserver/response` ([upgrade guide](https://github.com/vuejs/language-tools/discussions/5456)). This harness uses `typescript-language-server` + `@vue/typescript-plugin`. Incomplete hybrid wiring → status `error`.

**Verter:** set `VERTER_LSP_BIN` to a built `verter-lsp` binary when not published on npm.

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
| LSP table row                      | No — not a language server                                          |
| `vue-tsc` engine swap              | **Shipped** — `vue-tsc (TNB / tsgo)` in the typecheck table          |
| Compared as Vue LSP                | No — different product surface                                      |
| component-meta / lint engine swap  | Not yet — same technique would apply, see below                      |

Install: `pnpm install --dir envs/tnb --ignore-workspace`. Absent, the row is skipped with a note and nothing else changes. See [`envs/tnb/README.md`](envs/tnb/README.md) for why it is isolated rather than a root override, and [Engines are ranked separately](#engines-are-ranked-separately--and-this-used-to-be-the-biggest-single-caveat) for what it revealed.

`vue-component-meta` and type-aware ESLint also run the JS engine today and could get the same treatment, which would remove the last engine asymmetries in the report. Not done yet — each needs its own isolated env and its own work gate.

### Confirmation suite (correctness — not performance)

Benchmarks measure **throughput**. The confirmation suite checks tools against planted expectations:

```bash
pnpm confirm                 # compile + jsx-compile + lint + typecheck + component-meta
pnpm confirm:compile
pnpm confirm:jsx-compile
pnpm confirm:lint
pnpm confirm:typecheck
pnpm confirm:component-meta
```

| Surface            | What we assert                                                                                                                                                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **compile**        | Each SFC compiler emits code that mounts under `@vue/test-utils` and matches expected DOM/behavior (counter, props, `v-if`, `v-for`, slots, `inheritAttrs` true/false).                                                                                                                               |
| **jsx-compile**    | `vue-jsx-vapor` / `@vue-jsx-vapor/compiler-rs` / `@vue/babel-plugin-jsx` transforms plant JSX into code matching expected vapor/VDOM patterns.                                                                                                                                                        |
| **lint**           | Clean fixtures → 0 issues; planted dirty fixtures → at least the expected issue count (and matching rule/code when the tool has that rule).                                                                                                                                                           |
| **typecheck**      | Clean projects stay clean; planted bugs in `<script>` and `<template>` are reported (`v-if` narrowing, event closures, wrong/unknown props, emit/`v-model` types, native element handler types, `inheritAttrs` + strictTemplates).                                                                    |
| **component-meta** | Extracted public API matches plants: prop names/types/required/defaults, emits, slots, `defineExpose`. Tools are normalized to a common shape — schema phrasing may differ; missing API surface is a FAIL. Vize is scored via `generateDeclaration` (declaration emit, not a dedicated meta package). |

Results: `results/confirm.md` + `results/confirm.json`. Exit code **1** on any FAIL; **skip** is allowed (e.g. verter-tsc without tsgo).

Fixtures live under `tests/confirm/fixtures/`. This suite is for correctness checks, not throughput ranking.

## Why there is no cold metric

An unwarmed first run does not measure a compiler — it measures V8 warming up. Measured on this corpus, six consecutive in-process runs:

| Compiler                    | run 1      | run 2  | run 6  | first-run penalty |
| --------------------------- | ---------- | ------ | ------ | ----------------- |
| `@vue/compiler-sfc` (JS)    | **335 ms** | 139 ms | 105 ms | **3.2×**          |
| `@vizejs/native` (Rust)     | 32 ms      | 34 ms  | 36 ms  | none              |

Ranking on run 1 would report a ~10.5× gap where the steady-state gap is ~3.2× — inflating the native advantage roughly threefold. A JS tool cannot avoid that cost; a native tool structurally never pays it. So:

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

⚠ **Four surfaces currently have no artifact census at all.** Their rows are ranked on time with nothing attesting that the tools produced comparable output — which is exactly the failure mode this column exists to catch. `component-meta` is the sharpest case: it publishes a ~20× spread with neither a gate nor an artifact, while the confirmation suite shows the faster tool extracting fewer events and slots. Treat those four surfaces' rankings as provisional until a census lands.

Where **more genuinely means more work** (code bytes), a row below 50% of the largest artifact in its class is flagged ⚠ and its speed marked not comparable. Where the count is **informational** (diagnostics on a deliberately clean corpus, where zero is the correct answer) no such warning fires — otherwise the report would scold the well-behaved tools and reward one emitting noise about its own internals.

Honest limit: byte-count is blunt. It catches gross omissions, not semantic ones — a compiler that flattens a `v-for` instead of emitting loop codegen loses some bytes but not enough to trip the threshold.

### Failed validation is shown, not hidden

A tool that fails a work gate is **still measured**, and its time is reported **in brackets** with the reason:

```
| Vize check | ⚠ failed validation | (114.0 ms) | … | not ranked | … |
```

It is excluded from the ranking sort, from the `vs fastest` baseline, and from the artifact-peak calculation, so it cannot distort the tools it lost to. Dropping the row entirely hid the interesting part — a tool is often fast *because* it failed validation, and a reader deserves to see both halves of that trade.

### Order rotation

Tool order is **rotated by run index** on every warmup and measured run, so over `runs >= tools` every tool visits every position. Forward/reverse alternation was not enough: it produces only two orderings and leaves run 0 in fixed declaration order, which mattered when run 0 was the ranked metric and the incumbent was always declared first.

### Remaining limits

- We do **not** drop OS page cache on GitHub-hosted runners (no root `drop_caches`).
- After the first tool touches fixtures/`node_modules`, later tools in the **same** job may share a warmer OS file cache.
- CLI tools pay process startup on every run; in-process tools amortize it. This is why **invocation class is part of the comparison class** and the two are never ranked in one table.

### Sharding rule

**Linux only, and every timing surface runs in one job.** No result is ever merged across machines.

Cross-OS rows were never comparable — this report already forbids it — so a three-OS matrix bought nothing but 3x the runner cost and three more sources of variance. One OS, one runner class, one set of numbers.

The tempting optimisation is to shard by surface — LSP alone is ~376 s and dominates, so splitting it out would cut wall time by a third. We don't, because it puts each surface on a different runner, and GitHub runners vary enough that a report stitched together from several VMs is not one measurement. Keeping everything on one box removes that discrepancy outright, and guarantees a comparison class can never accidentally span machines as surfaces are added or regrouped.

Measured cost per surface (n=200, runs=5) — all of it sequential on the same box:

| Surface | Cost |
| --- | ---: |
| lsp | ~376 s |
| lint | ~42 s |
| format | ~32 s |
| typecheck | ~28 s |
| compile (whole matrix) | ~10 s |
| component-meta | ~7 s |
| jsx-compile | ~1 s |

~8–9 minutes total, which is a fine price for a main-push / weekly benchmark.

**Surface order matters.** `lsp` runs **last**: it is by far the longest and its hover retries heat the machine, so running it earlier would leave every subsequent surface measuring a warmer, more throttled box.

The **memory** probe stays a separate job on purpose — sampling RSS and CPU alongside timing runs would perturb the very timings it sits next to. That is isolation for a different reason than machine variance.

## CI layout

| Workflow                                          | When                                | What                                                                                                                                    |
| ------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Test** (`.github/workflows/test.yml`)           | pull_request, `main` push           | `tests/harness/run.mjs` + `tests/confirm/run.mjs`. Install only, no fixtures. **Publishes nothing.**                                    |
| **PR** (`.github/workflows/pr.yml`)               | pull_request                        | **Smoke only**: build → `pnpm confirm` + tiny `fixtures/20` throughput pass. **No** full bench, **no** README rewrite.                  |
| **Benchmark** (`.github/workflows/benchmark.yml`) | `workflow_dispatch` **only**        | build → **bench** + **ide** + **memory** → update `README.md` + [`MEMORY.md`](./MEMORY.md). The only workflow that commits.             |
| **E2E VS Code**                                   | manual / weekly                     | Heavy extension-host path (optional)                                                                                                    |

**All workflows run on `ubuntu-latest`.** One runner class for everything — measurement, correctness and E2E. Platform-specific breakage (Windows file locks, `.cmd` shims, path handling) is consequently **not covered by CI**; run `pnpm confirm` and `pnpm test:harness` locally on macOS/Windows if you need that signal.

**Benchmarks do not run on push or pull request, and there is no schedule.** `ide` alone can take 90 minutes, so measuring on every review round would cost hours of runner time for numbers nobody reads — and a weekly cron that silently rewrites the README is a published number nobody asked for. Validation on PR/push is `test.yml`; measurement is a deliberate manual dispatch.

Doc updates follow the [rolldown/benchmarks](https://github.com/rolldown/benchmarks) pattern:

1. Measure on a single Linux runner; upload `results/*` artifacts.
2. On a `main` dispatch, a final job downloads artifacts, runs `scripts/update-readme.mjs` and `scripts/update-memory-readme.mjs`, and **auto-commits** `README.md` + `MEMORY.md` with `[skip ci]`.

A section whose artifacts are missing — because its job failed, or was not part of the run — is **left exactly as published**. It is never replaced with a "no artifacts" placeholder, so a partial run can never erase good results and commit the erasure.

Published resource numbers: **[MEMORY.md](./MEMORY.md)**.

## Methodology

1. Generate unique-content `.vue` SFCs (`scripts/generate.mjs` — diverse templates + uniquify) **once** in the build job.
2. For each surface, run every available tool on the **same** corpus, discarding ≥1 warmup pass per tool and **rotating tool order** on every pass.
3. Rank by the median of the measured runs within each comparison class; report min / stddev / CV% alongside.
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
  bench.mjs                 # throughput orchestrator
  update-readme.mjs         # CI README merge
  e2e-vscode/               # headless extension-host runner
  lib/
    surfaces/               # compile, typecheck, format, lint, meta, lsp
tests/confirm/              # correctness plants (tracked)
fixtures/                   # generated corpora (gitignored)
work/                       # ephemeral copies (gitignored)
results/                    # local reports (gitignored)
.github/workflows/
  test.yml                  # harness + confirm on PR / main push (publishes nothing)
  pr.yml                    # PR smoke (pnpm confirm + tiny throughput pass)
  benchmark.yml             # manual dispatch: bench + ide + memory → README / MEMORY.md
  e2e-vscode.yml            # optional VS Code E2E
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

On `main`, Linux CI copies the latest report into **[MEMORY.md](./MEMORY.md)** (committed).

## Interpreting results

- Published numbers are **Linux only**. Local runs on macOS/Windows are for relative comparison on your own box, not against published figures.
- Compare compiler rows within the same thread class (`1t` vs `1t`, etc.).
- `golar typecheck` is pure typecheck; bare `golar` also runs lint.
- `skipped` / `error` rows are not ranked.
- Numbers from other corpora, hardware, or scripts are a different experiment.
- Memory min/max/avg are tool-attributed (see table above); do not mix with wall-clock tables.

## Reference results

<!-- BENCHMARK_RESULTS_START -->

_No benchmark artifacts found yet. Run CI or `pnpm bench` locally._

<!-- BENCHMARK_RESULTS_END -->

## IDE operation results

Per-operation editor benchmarks from the `ide` job (`scripts/ide-bench.mjs`). Ranked **per operation**, never pooled — `didOpen→diagnostics` and `foldingRange` differ by orders of magnitude and answer unrelated questions. Not comparable to the timing tables above: different job, different load profile.

<!-- IDE_RESULTS_START -->

_No IDE artifacts found yet. Run the Benchmark workflow or `pnpm bench:ide` locally._

<!-- IDE_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports: [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
