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

⚠ in this table marks a matrix dimension the tool does not vary with: the rows are still produced, and they are identical. Where a tool has no code path for a dimension at all, the row is reported `skipped` instead and carries no ⚠.

⚠ Vize's production and development rows therefore perform **identical work**, because `compileSfc` exposes no production flag. The row notes record this; no substitute flag is used in its place.

**Comparison classes:** Vue official compiler is **1T only** (worker_threads variants removed). Vize/Verter batch pools are ranked separately, and Verter's `session` mode — which keeps a persistent host across warmups and runs — is ranked as `batch-cached`, apart from the cache-free batch rows.

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
| Vue TSC          | `vue-tsc`                   | `vue-tsc --noEmit -p tsconfig.json`           | **TypeScript 5.9 (JS)** |
| Vue TSC (TNB)    | `typescript-native-bridge`  | same command, `envs/tnb` install              | tsgo **stable** 7.0.2 (in-process NAPI/FFI) |
| Golar            | `golar` + `@golar/vue`      | `golar typecheck` (+ default mode separately) | typescript-go (native) |
| Vize             | `vize`                      | `vize check . --tsconfig …`                   | tsgo **nightly** (`@typescript/native-preview` 7.0.0-dev) |
| Verter           | `verter-tsc`                | `verter-tsc --noEmit -p tsconfig.json`        | tsgo **stable** 7.0.2 |

#### Engines are ranked separately — and this used to be the biggest single caveat

Most of these run the **native Go TypeScript engine**; stock `vue-tsc` runs the **JavaScript** one. Ranking them in one table mostly measures TypeScript's own Go rewrite, not the Vue layer under test. So engine is part of the comparison class and each gets its own table.

**`vue-tsc (TNB / tsgo)` holds the Vue layer fixed and changes only the engine.** It is the *same* `vue-tsc`, the same `@vue/language-core`, the same template checking — with `typescript` aliased to [typescript-native-bridge](https://github.com/johnsoncodehk/typescript-native-bridge), whose checker is tsgo in-process. One variable changes, so the pair isolates the engine from the Vue layer, and the row falls in the same engine class as Vize/Verter/golar.

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

Read together: the 1.94× between the two `vue-tsc` rows is attributable to the engine swap alone, and between same-engine, both-validated rows the measured gaps on this corpus are 1.09× and 1.23×. A single cross-engine ratio multiplies the two factors together, which is why engine is part of the comparison class here.

> ⚠ An earlier revision of this table published **~2%** from a **single** unreplicated run at a 20-file limit. That figure was corrected: the run it was taken from showed 1.20×, in the opposite direction to the 1.09× that the replicated 5-run measurement at 50 files above gives. Single-run typecheck numbers on this corpus move by more than the gaps being reported, so they are not treated as results. Note also that `verter-tsc` is the only row emitting diagnostics on this corpus — 105 of them, referring to its own virtual code — so its output on this run was not the same as that of the rows above it.

Stock JS-engine `vue-tsc` is **kept** as a row, because it is what ships today.

TNB lives in [`envs/tnb`](envs/tnb/README.md) as a standalone project, never a root `typescript` override — an override would swap the engine under component-meta, lint and LSP at the same time. It must also print its activation banner on the work-gate run, or the row is unranked: a silent fallback to the JS checker would leave the row labelled native while running JS.

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

The diagnostics refer to Verter's own virtual code rather than to the source under test. The confirmation suite records this independently in [`tests/confirm/known-failures.json`](tests/confirm/known-failures.json): on a **clean** generic `<script setup>` component `verter-tsc` emits three diagnostics — `___VERTER___Attrs requires 1 type argument`, `___VERTER___attributes is not generic`, and `Cannot find name 'items'` — against a fixture that contains no planted error.

Two consequences for how the tables read:

- **The work gate does not test for this.** It asks whether the planted bug was found, not whether anything else was reported. `verter-tsc` passes all four stages (`script`, `tmpl-prop`, `tmpl-event`, `corpus`) and is ranked on that basis.
- **The artifact column does not flag it either.** Diagnostics carry *informational* polarity, because on a clean corpus a higher count is not more work — so no ⚠ fires on the count, on any row. The count is recorded in this note instead of by an automatic flag.

Emitting diagnostics is not a gate failure, so the row is not bracketed. The condition on reading its time: the rows in this class did not produce equivalent output — one emitted 442 diagnostics on 200 files, the others emitted 0.

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

Regression fixtures for all three real payloads live in [`tests/harness/lsp-hover-gate.test.mjs`](tests/harness/lsp-hover-gate.test.mjs) — the first version of this gate wrongly failed a *correct* server whose doc comment ran into its type signature (`let benchMarker: stringStable hover target…`), which has no word boundary after `string`.

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

Install: `pnpm install --dir envs/tnb --ignore-workspace`. Absent, the row is skipped with a note and nothing else changes. See [`envs/tnb/README.md`](envs/tnb/README.md) for why it is isolated rather than a root override, and [Engines are ranked separately](#engines-are-ranked-separately--and-this-used-to-be-the-biggest-single-caveat) for the comparison it enables.

##### Caveat: the TNB engine swap fails an IDE completion-resolve operation

⚠ On the typecheck surface the swap changes one variable, the engine, and TNB passes the full work gate there. On the IDE surface the same swap also changes an observed behaviour, recorded below.

On the IDE surface, `Volar (TNB / tsgo tsdk)` **offers an auto-import completion item and then errors resolving it**. The tsgo side throws `Debug Failure. False expression. at getCompletionEntryCodeActionsAndSourceDisplay` — recorded verbatim in [`scripts/lib/ide-ops/suites/completion.mjs`](scripts/lib/ide-ops/suites/completion.mjs). The operation corresponds to accepting `computed` from the completion list and having the `import` statement written; on TNB it errors instead.

Stock Volar on the JavaScript TypeScript engine resolves the same item, so the difference tracks the engine swap rather than the harness. The suite fans a resolve out to both halves so the failure is attributed to the tsgo half rather than collapsed into the Vue half's "not my item" response.

Conditions for reading the `vue-tsc (TNB / tsgo)` row: it was measured on the typecheck surface, where it passes the work gate; the same engine fails the IDE completion-resolve operation above. The two surfaces were measured separately, and the typecheck result does not carry over to editor operations.

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
| Vize check | ⚠ failed validation | (114.0 ms) | … | not ranked | … |
```

It is excluded from the ranking sort, from the `vs fastest` baseline, and from the artifact-peak calculation, so a bracketed row cannot shift the rows it was measured alongside. Dropping the row entirely removed information: the time and the gate outcome are reported together so both are visible.

### Order rotation

Tool order is **rotated by run index** on every warmup and measured run, so over `runs >= tools` every tool visits every position. Forward/reverse alternation was not enough: it produces only two orderings and leaves run 0 in fixed declaration order, which mattered when run 0 was the ranked metric and the same tool always occupied the first position.

### Remaining limits

- We do **not** drop OS page cache on GitHub-hosted runners (no root `drop_caches`).
- After the first tool touches fixtures/`node_modules`, later tools in the **same** job may share a warmer OS file cache.
- CLI tools pay process startup on every run; in-process tools amortize it. This is why **invocation class is part of the comparison class** and the two are never ranked in one table.

### Sharding rule

**Linux only, and every timing surface runs in one job.** No result is ever merged across machines.

Cross-OS rows were never comparable — this report already forbids it — so a three-OS matrix bought nothing but 3x the runner cost and three more sources of variance. One OS, one runner class, one set of numbers.

The tempting optimisation is to shard by surface — `lint` and `typecheck` are the two biggest and together are ~70% of the job. We don't, because it puts each surface on a different runner, and GitHub runners vary enough that a report stitched together from several VMs is not one measurement. Keeping everything on one box removes that discrepancy outright, and guarantees a comparison class can never accidentally span machines as surfaces are added or regrouped.

Measured cost per surface (n=200, runs=5, 32-core box) — all of it sequential in the one `bench` job. These are the figures recorded in [`.github/workflows/benchmark.yml`](.github/workflows/benchmark.yml) (the `bench` job header and its `timeout-minutes` rationale), not estimates:

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

The other three jobs run separately and are not in that total, also measured: `memory` ~4.8 min at `--samples 3`, `ide` ~3.2 min at the `--runs 3` CI uses, `ide-scale` ~3.6 min at the 1 run + 1 warmup CI uses. Every job is capped at `timeout-minutes: 10`.

**Surface order matters.** `lsp` runs **last**: its hover retries and language-server churn heat the machine, so running it earlier would leave every subsequent surface measuring a warmer, more throttled box. (It ran last originally because it was also the longest surface; that is no longer true, but the thermal reason stands on its own.)

The **memory** probe stays a separate job on purpose — sampling RSS and CPU alongside timing runs would perturb the very timings it sits next to. That is isolation for a different reason than machine variance.

## CI layout

| Workflow                                          | When                                | What                                                                                                                                    |
| ------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Test** (`.github/workflows/test.yml`)           | pull_request, `main` push           | `tests/harness/run.mjs` + `tests/confirm/run.mjs`. Install only, no fixtures. **Publishes nothing.**                                    |
| **PR** (`.github/workflows/pr.yml`)               | pull_request                        | **Smoke only**: build (install + `fixtures/20`) → one throughput pass over every surface at `--runs 1 --warmups 0`. **No** `pnpm confirm` (that runs in `test.yml` on the same event — see [`pr.yml`](.github/workflows/pr.yml) L92), **no** full bench, **no** README rewrite. |
| **Benchmark** (`.github/workflows/benchmark.yml`) | `workflow_dispatch` **only**        | build → **bench** + **ide** + **ide-scale** + **memory** → update `README.md` + [`MEMORY.md`](./MEMORY.md). The only workflow that commits. |
| **E2E VS Code** (`.github/workflows/e2e-vscode.yml`) | `workflow_dispatch` **only**     | Heavy extension-host path (optional). No schedule.                                                                                      |

**All workflows run on `ubuntu-latest`.** One runner class for everything — measurement, correctness and E2E. Platform-specific breakage (Windows file locks, `.cmd` shims, path handling) is consequently **not covered by CI**; run `pnpm confirm` and `pnpm test:harness` locally on macOS/Windows if you need that signal.

**Benchmarks do not run on push or pull request, and there is no schedule.** The reason is not cost — the whole measurement is ~16 minutes of runner time across four jobs (`bench` 4.2 min, `memory` 4.8 min, `ide` 3.2 min, `ide-scale` 3.6 min, each capped at 10). It is that a published number should be traceable to a person who asked for it, and a cron that silently rewrites the README on a runner nobody was watching is the opposite of that. Validation on PR/push is `test.yml`; measurement is a deliberate manual dispatch.

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
                            #   → README / MEMORY.md
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

On `main`, Linux CI copies the latest report into **[MEMORY.md](./MEMORY.md)** (committed).

#### Caveat: Volar's LSP memory row is not the whole of Volar, but the LSP timing row is

⚠ This asymmetry runs in opposite directions on two different axes.

Vue language-tools v3 is a **two-process** architecture: `@vue/language-server` plus a TypeScript server reached over the `tsserver/request`↔`tsserver/response` bridge. Both processes are real, and the TypeScript half is the larger of the two.

| Surface | What Volar is charged for |
| --- | --- |
| **LSP / IDE timing** | **Both processes.** Startup and project load of the pair are inside the timings, and each feature is asked of both halves in parallel with the **slower** one charged (`scripts/lib/surfaces/lsp.mjs`). |
| **Memory probe** | **The Vue server only.** RSS and CPU are sampled from a single pid; the tsserver half is a separate, larger process and is **not** included (`scripts/memory-worker.mjs`). |

So the memory tables cover **one of Volar's two processes**, and the latency tables cover both. Neither number is wrong for what it measures, but they do not cover the same process set: "Volar's memory" and "Vize's memory" are not measurements of the same thing. Vize and Verter run single-process, so their rows cover the whole tool.

Treat Volar's LSP memory figure as a **lower bound on the Vue half**, not as Volar's footprint. The `Notes` column on the affected rows carries the same warning; it is emitted by the probe rather than being editorial.

## Interpreting results

- Published numbers are **Linux only**. Local runs on macOS/Windows are for relative comparison on your own box, not against published figures.
- Compare compiler rows within the same thread class (`1t` vs `1t`, etc.).
- `golar typecheck` is pure typecheck; bare `golar` also runs lint.
- `skipped` / `error` rows are not ranked.
- Numbers from other corpora, hardware, or scripts are a different experiment.
- Memory min/max/avg are tool-attributed (see table above); do not mix with wall-clock tables.

## Reference results

**Before reading the tables — four known caveats that the numbers alone will not tell you:**

| Caveat | Effect on the tables |
| --- | --- |
| [`verter-tsc` is the only checker not silent on a clean corpus](#caveat-verter-tsc-is-the-only-checker-that-is-not-silent-on-a-clean-corpus) | It emits 442 diagnostics on 200 files (every other ranked checker: 0) and ranks 1st in its class on the smaller corpus. Passes the work gate; not bracketed. |
| [Vize's tsgo/Corsa backend sometimes never starts](#caveat-vizes-type-checking-backend-sometimes-never-starts-and-the-row-still-answers) | Non-deterministic. When it fires, the row was measured with the type-checking backend absent. Look for `⚠ BACKEND FALLBACK` in Notes. |
| [Volar's memory excludes its tsserver half; its timing includes it](#caveat-volars-lsp-memory-row-is-not-the-whole-of-volar-but-the-lsp-timing-row-is) | Volar's memory row covers one of its two processes; its latency rows include both. Vize and Verter are single-process, so their rows cover the whole tool. |
| [The TNB engine swap fails an IDE completion resolve](#caveat-the-tnb-engine-swap-fails-an-ide-completion-resolve-operation) | TNB passes the typecheck work gate. On the IDE surface, resolving an auto-import completion item errors in the tsgo half. |

Four surfaces (`jsx-compile`, `format`, `lint`, `component-meta`) also have [no artifact census](#artifact-column--fast-vs-did-less) — their rankings are provisional.

<!-- BENCHMARK_RESULTS_START -->

_No benchmark artifacts found yet. Run CI or `pnpm bench` locally._

<!-- BENCHMARK_RESULTS_END -->

## IDE operation results

Per-operation editor benchmarks from the `ide` job (`scripts/ide-bench.mjs`). Ranked **per operation**, never pooled — `didOpen→diagnostics` and `foldingRange` differ by orders of magnitude and answer unrelated questions. Not comparable to the timing tables above: different job, different load profile.

Servers here are Volar, **Volar on the TNB/tsgo tsdk**, Vize and Verter. Three caveats apply to these tables specifically:

- **`Volar (TNB / tsgo tsdk)` errors resolving an auto-import completion** — `Debug Failure. False expression. at getCompletionEntryCodeActionsAndSourceDisplay`. Stock Volar resolves the same item. [Details](#caveat-the-tnb-engine-swap-fails-an-ide-completion-resolve-operation).
- **Vize may answer with its tsgo backend absent**, with no error in the LSP traffic. [Details](#caveat-vizes-type-checking-backend-sometimes-never-starts-and-the-row-still-answers).
- **Both Volar rows are two processes**, charged the slower half on every operation; Vize and Verter are one. [Details](#caveat-volars-lsp-memory-row-is-not-the-whole-of-volar-but-the-lsp-timing-row-is).

<!-- IDE_RESULTS_START -->

_No IDE artifacts found yet. Run the Benchmark workflow or `pnpm bench:ide` locally._

<!-- IDE_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports: [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
