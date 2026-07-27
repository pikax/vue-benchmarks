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

> Auto-updated 2026-07-27 from the **Benchmark** workflow (rolldown-style: measure on CI → commit README on `main` with `[skip ci]`).
> Numbers are reference-only; re-run on your hardware for local relevance.
> Every measured run is warmed (>= 1 discarded pass); the ranking metric is the median. There is no cold column.

#### Ubuntu/Linux · bench

<!-- source: bench-Linux-200-bench.md -->

## Benchmark Results

- **Generated:** 2026-07-27T17:27:43.471Z
- **Fixture:** `fixtures/200` (200 SFCs)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
- **Node:** v22.23.1
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/30288994570

### Tool versions

| Package | Version |
| --- | --- |
| vue | 3.5.40 |
| @vue/compiler-sfc | 3.5.40 |
| @vue/compiler-sfc-36 | 3.6.0-rc.2 |
| vize | 0.291.0 |
| @vizejs/native | 0.291.0 |
| @verter/native | 0.0.1-beta.3 |
| verter-tsc | 0.0.1-beta.3 |
| @verter/component-meta | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| verter-mcp | 0.0.1-beta.3 |
| @vue/language-server | 3.3.8 |
| @vue/typescript-plugin | 3.3.8 |
| typescript-language-server | 5.3.0 |
| vue-tsc | 3.3.8 |
| vue-component-meta | 3.3.8 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.6 |
| oxfmt | 0.61.0 |
| typescript | 5.9.3 |
| cli:vize | 0.291.0 |
| cli:vue-tsc | 5.9.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.61.0 |
| vue-jsx-vapor | 3.2.19 |
| @vue-jsx-vapor/compiler-rs | 3.2.19 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

### Methodology notes

- Primary ranking metric is the **median of measured runs**. Every measured run is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1).
- There is **no cold column**. An unwarmed first run costs a JS compiler ~3.2x its steady state and a native compiler nothing, so ranking on it measures V8 warmup rather than the tool.
- Min / stddev / CV% are reported per row. CV% > 10 is flagged ⚠ — treat that row as noisy (thermal drift or a contended runner), not as a result.
- Comparison classes (invocation × threading) are ranked in **separate tables** — an in-process API amortises process startup across runs, a CLI pays it every run.
- Surfaces are independent: compile ms is not comparable to jsx-compile/typecheck/lint/format ms.
- jsx-compile uses fixtures/jsx-N (.jsx); SFC compile uses fixtures/N (.vue).
- Compile matrix cells (VDOM/Vapor × production/development × sourcemap on/off) are independent.
- Source map is an explicit, independent dimension applied identically to every compiler — it is never folded into the production/development flag for some tools and not others.
- Primary compile corpus is unique file contents (fixtures/N).
- Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.
- Tool order is **rotated** on every warmup and measured run, so no tool is pinned to the expensive first slot.
- CI does not drop OS page cache; later tools in a job may share a warmer file cache.
- Typecheck/lint tools that fail a planted-bug work gate are unranked (skipped). Typecheck gates require both a script-level and a template-level diagnostic, and are re-verified against the full timed corpus.
- Compile measures assert non-empty codegen where applicable.
- Vue official compiler is 1T only (worker_threads variants removed).
- LSP: every server resolves from its installed npm package and is skipped when absent — no local-build or working-copy discovery, so each row names a version.
- verter-tsc needs stable tsgo (typescript@7.0.x via typescript-go); harness sets VERTER_TSGO_BIN.
- Diagnostic/format identity across tools is not required for throughput rows.

### SFC compile (unique contents)

Files: **200** · Bytes: **285,701**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

Compile results are **grouped by target × environment × source map**, then by comparison class.

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

##### VDOM · In-process API · Single-thread (1T) — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize native loop (1T) | ok | **43.1 ms** | 43.1 ms | 0.3 ms | 0.8% | 1.00x | 609,596 | 4.6k files/s | compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking. |
| @vue/compiler-sfc 3.5 (1T) | ok | **157.0 ms** | 144.3 ms | 9.6 ms | 6.1% | 3.64x | 670,030 | 1.3k files/s | Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded |
| @vue/compiler-sfc 3.6 (1T) | ok | **166.7 ms** | 156.2 ms | 5.3 ms | 3.2% | 3.87x | 670,030 | 1.2k files/s | Official 3.6 VDOM, isProd=true, sourceMap=false |

##### VDOM · In-process API · Batch / multi-thread pool — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize native batch (max threads) | ok | **16.4 ms** | 16.0 ms | 0.5 ms | 3.0% | 1.00x | 609,596 | 12.2k files/s | compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking. |
| Verter compileMany (stateless) | ok | **129.4 ms** | 127.9 ms | 2.2 ms | 1.7% | 7.89x | 541,003 | 1.5k files/s | runtime-render forceVapor=false, isProduction=true, sourceMap=false, hmr=none, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0 |

##### VDOM · In-process API · Batch with persistent cache — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter compileMany (session cache) | ok | **22.3 ms** | 21.5 ms | 1.4 ms | 6.4% | 1.00x | 541,003 | 9.0k files/s | runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported (ranked separately from cache-free batch rows) cacheHits≈0 |

<details><summary>Raw runs</summary>

- **Vize native loop (1T)**: 43.1 ms, 43.1 ms, 43.1 ms, 43.6 ms, 43.8 ms
- **@vue/compiler-sfc 3.5 (1T)**: 168.1 ms, 164.2 ms, 157.0 ms, 151.5 ms, 144.3 ms
- **@vue/compiler-sfc 3.6 (1T)**: 166.7 ms, 166.9 ms, 158.2 ms, 156.2 ms, 166.8 ms
- **Vize native batch (max threads)**: 17.3 ms, 16.3 ms, 16.7 ms, 16.4 ms, 16.0 ms
- **Verter compileMany (stateless)**: 131.6 ms, 133.1 ms, 129.4 ms, 127.9 ms, 128.3 ms
- **Verter compileMany (session cache)**: 21.7 ms, 24.9 ms, 22.3 ms, 21.5 ms, 23.6 ms

</details>

#### VDOM · development · sourcemap off

Target: `vdom` · Environment: `development` · Source map: `off`

##### VDOM · In-process API · Single-thread (1T) — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize native loop (1T) | ok | **43.9 ms** | 43.5 ms | 0.5 ms | 1.1% | 1.00x | 609,596 | 4.6k files/s | compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking. |
| @vue/compiler-sfc 3.5 (1T) | ok | **138.5 ms** | 136.4 ms | 5.5 ms | 4.0% | 3.15x | 656,372 | 1.4k files/s | Official 3.5 VDOM, isProd=false, sourceMap=false, single-threaded |
| @vue/compiler-sfc 3.6 (1T) | ok | **144.1 ms** | 136.0 ms | 10.5 ms | 7.3% | 3.28x | 656,372 | 1.4k files/s | Official 3.6 VDOM, isProd=false, sourceMap=false |

##### VDOM · In-process API · Batch / multi-thread pool — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize native batch (max threads) | ok | **16.5 ms** | 16.0 ms | 1.0 ms | 6.3% | 1.00x | 609,596 | 12.2k files/s | compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking. |
| Verter compileMany (stateless) | ok | **134.0 ms** | 130.7 ms | 2.9 ms | 2.2% | 8.14x | 663,894 | 1.5k files/s | runtime-render forceVapor=false, isProduction=false, sourceMap=false, hmr=vite, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0 |

##### VDOM · In-process API · Batch with persistent cache — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter compileMany (session cache) | ok | **26.4 ms** | 20.6 ms | 2.8 ms | 10.6% ⚠ | 1.00x | 663,894 | 7.6k files/s | runtime-render forceVapor=false, isProduction=false, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported (ranked separately from cache-free batch rows) cacheHits≈0 |

<details><summary>Raw runs</summary>

- **Vize native loop (1T)**: 43.5 ms, 44.0 ms, 44.8 ms, 43.9 ms, 43.8 ms
- **@vue/compiler-sfc 3.5 (1T)**: 149.9 ms, 139.9 ms, 138.5 ms, 136.4 ms, 137.1 ms
- **@vue/compiler-sfc 3.6 (1T)**: 161.6 ms, 149.1 ms, 136.8 ms, 144.1 ms, 136.0 ms
- **Vize native batch (max threads)**: 18.6 ms, 16.0 ms, 16.5 ms, 16.4 ms, 16.5 ms
- **Verter compileMany (stateless)**: 135.6 ms, 131.8 ms, 137.9 ms, 130.7 ms, 134.0 ms
- **Verter compileMany (session cache)**: 27.3 ms, 24.1 ms, 26.4 ms, 26.9 ms, 20.6 ms

</details>

#### VAPOR · production · sourcemap off

Target: `vapor` · Environment: `production` · Source map: `off`

##### VAPOR · In-process API · Single-thread (1T) — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize native loop (1T) | ok | **45.7 ms** | 44.1 ms | 1.1 ms | 2.3% | 1.00x | 754,148 | 4.4k files/s | compileSfc vapor=true, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking. |
| @vue/compiler-sfc 3.6 (1T) | ok | **332.2 ms** | 279.7 ms | 34.8 ms | 10.5% ⚠ | 7.27x | 690,938 | 602 files/s | Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=true, sourceMap=false |

##### VAPOR · In-process API · Batch / multi-thread pool — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize native batch (max threads) | ok | **20.9 ms** | 16.8 ms | 2.4 ms | 11.6% ⚠ | 1.00x | 754,148 | 9.6k files/s | compileSfcBatchWithResults vapor=true, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking. |
| Verter compileMany (stateless) | ok | **142.4 ms** | 135.4 ms | 6.3 ms | 4.4% | 6.81x | 577,324 | 1.4k files/s | runtime-render forceVapor=true, isProduction=true, sourceMap=false, hmr=none, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0 |

##### VAPOR · In-process API · Batch with persistent cache — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter compileMany (session cache) | ok | **24.7 ms** | 18.0 ms | 4.2 ms | 16.9% ⚠ | 1.00x | 577,324 | 8.1k files/s | runtime-render forceVapor=true, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported (ranked separately from cache-free batch rows) cacheHits≈0 |

##### VAPOR · Threading: n/a — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| @vue/compiler-sfc 3.5 (vapor) | skipped | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM. |

<details><summary>Raw runs</summary>

- **Vize native loop (1T)**: 45.8 ms, 44.1 ms, 45.7 ms, 45.2 ms, 47.1 ms
- **@vue/compiler-sfc 3.6 (1T)**: 332.2 ms, 339.6 ms, 371.2 ms, 305.5 ms, 279.7 ms
- **Vize native batch (max threads)**: 17.0 ms, 16.8 ms, 20.9 ms, 21.5 ms, 21.5 ms
- **Verter compileMany (stateless)**: 135.4 ms, 138.1 ms, 142.4 ms, 148.3 ms, 149.9 ms
- **Verter compileMany (session cache)**: 18.0 ms, 24.7 ms, 29.1 ms, 27.1 ms, 23.9 ms

</details>

#### VAPOR · development · sourcemap off

Target: `vapor` · Environment: `development` · Source map: `off`

##### VAPOR · In-process API · Single-thread (1T) — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize native loop (1T) | ok | **44.7 ms** | 44.3 ms | 1.1 ms | 2.6% | 1.00x | 754,148 | 4.5k files/s | compileSfc vapor=true, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking. |
| @vue/compiler-sfc 3.6 (1T) | ok | **273.2 ms** | 268.7 ms | 17.0 ms | 6.2% | 6.11x | 692,676 | 732 files/s | Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=false, sourceMap=false |

##### VAPOR · In-process API · Batch / multi-thread pool — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize native batch (max threads) | ok | **17.3 ms** | 16.5 ms | 3.1 ms | 17.6% ⚠ | 1.00x | 754,148 | 11.5k files/s | compileSfcBatchWithResults vapor=true, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking. |
| Verter compileMany (stateless) | ok | **145.7 ms** | 139.7 ms | 11.5 ms | 7.9% | 8.40x | 613,062 | 1.4k files/s | runtime-render forceVapor=true, isProduction=false, sourceMap=false, hmr=vite, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0 |

##### VAPOR · In-process API · Batch with persistent cache — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter compileMany (session cache) | ok | **22.0 ms** | 18.3 ms | 5.7 ms | 25.8% ⚠ | 1.00x | 613,062 | 9.1k files/s | runtime-render forceVapor=true, isProduction=false, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported (ranked separately from cache-free batch rows) cacheHits≈0 |

##### VAPOR · Threading: n/a — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| @vue/compiler-sfc 3.5 (vapor) | skipped | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM. |

<details><summary>Raw runs</summary>

- **Vize native loop (1T)**: 45.0 ms, 47.2 ms, 44.3 ms, 44.7 ms, 44.7 ms
- **@vue/compiler-sfc 3.6 (1T)**: 309.8 ms, 273.2 ms, 270.1 ms, 278.7 ms, 268.7 ms
- **Vize native batch (max threads)**: 22.8 ms, 21.9 ms, 16.5 ms, 17.3 ms, 16.6 ms
- **Verter compileMany (stateless)**: 168.1 ms, 152.0 ms, 139.7 ms, 141.2 ms, 145.7 ms
- **Verter compileMany (session cache)**: 23.3 ms, 33.1 ms, 18.3 ms, 20.9 ms, 22.0 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=unique: 200/200 unique content SHAs. Vize content-hash caches treat identical bodies as free — primary rankings must use unique fixtures (fixtures/N), not fixtures/N-repeated.
- Same in-memory Vue SFC corpus for every variant (compiler flags differ; sources do not).
- Work measured: parse SFC + compile script (if any) + compile template (if any).
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested identically from every compiler in a cell (Vue: parse+compileScript+codegen sourceMap; Vize: compileSfc sourceMap; Verter: compileProfile sourceMap). It is not folded into the prod/dev flag for some tools and not others.
- Production vs development uses each tool's real semantic knobs only: Vue isProd (hoistStatic + cacheHandlers); Verter isProduction + hmrStrategy.
- ⚠ Vize exposes no isProduction on compileSfc, so its production and development rows perform identical work. Stated rather than substituted with a different knob.
- Vue 3.5 has no Vapor path → skipped for vapor cells (not run as VDOM).
- Comparison classes (1T / batch / batch-cached) are ranked in separate tables (not mixed).
- Verter session mode keeps a persistent host across warmups and runs, so it is ranked as `batch-cached`, apart from cache-free batch rows.
- Tool order is rotated on every warmup and measured run; no tool is pinned to first position.
- Ranking metric is the median of measured runs, all taken after >= 1 discarded warmup. No cold column.

</details>

### JSX compile

Files: **200** · Bytes: **38,804**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

##### VAPOR · Single-thread (1T) — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| @vue-jsx-vapor/compiler-rs (vapor) | ok | **3.6 ms** | 3.6 ms | 0.3 ms | 8.7% | 1.00x | n/a | 55.3k files/s | Rust/Oxc transform; default vapor mode (see vuejs/vue-jsx-vapor). Same unique .jsx corpus as other JSX rows. |
| vue-jsx-vapor/api | ok | **4.4 ms** | 4.3 ms | 0.1 ms | 2.5% | 1.21x | n/a | 45.7k files/s | transformVueJsxVapor() public API (vapor default). |

##### VDOM · Single-thread (1T) — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | ok | **3.1 ms** | 3.1 ms | 0.1 ms | 2.2% | 1.00x | n/a | 63.9k files/s | Rust/Oxc transform with interop: true (VDOM createElementBlock path). |
| @vue/babel-plugin-jsx (Babel VDOM) | ok | **132.4 ms** | 112.5 ms | 11.8 ms | 8.9% | 42.33x | n/a | 1.5k files/s | Official Babel Vue JSX plugin (createVNode). Reference VDOM JSX path; not Vapor. |

<details><summary>Methodology</summary>

- Surface is JSX/TSX transform throughput — independent of SFC (.vue) compile.
- Corpus: fixtures/jsx-N unique .jsx files (generate.mjs --with-jsx).
- vue-jsx-vapor: https://github.com/vuejs/vue-jsx-vapor — Vapor Mode of Vue JSX (Oxc/Rust compiler-rs).
- compiler-rs vapor vs interop:true (VDOM) are different codegen targets.
- @vue/babel-plugin-jsx is the classic Babel VDOM JSX path (comparison baseline).
- Do not compare JSX ms to SFC compile ms; different language and pipeline.
- Tool order is ROTATED on every warmup and measured run (not merely alternated), so no tool keeps a fixed position in the sequence.

Raw runs:

- **@vue-jsx-vapor/compiler-rs (vapor)**: 3.6 ms, 3.6 ms, 3.6 ms, 4.3 ms, 3.8 ms
- **vue-jsx-vapor/api**: 4.3 ms, 4.4 ms, 4.3 ms, 4.6 ms, 4.4 ms
- **@vue-jsx-vapor/compiler-rs (interop VDOM)**: 3.1 ms, 3.2 ms, 3.1 ms, 3.3 ms, 3.1 ms
- **@vue/babel-plugin-jsx (Babel VDOM)**: 136.4 ms, 132.4 ms, 116.2 ms, 137.8 ms, 112.5 ms

</details>

### Typecheck

Files: **200** · Bytes: **285,701**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

##### TypeScript (JS engine) · Threading: default — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| vue-tsc | ok | **4.69 s** | 4.68 s | 11.0 ms | 0.2% | 1.00x | 0 | 43 files/s | Official Vue Language Tools CLI: vue-tsc --noEmit -p tsconfig.json \| engine: TypeScript 5.9.3 (JS) \| gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓ |

##### tsgo (native engine) · Threading: default — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| verter-tsc | ok | **1.06 s** | 1.05 s | 30.2 ms | 2.8% | 1.00x | 420 | 188 files/s | verter-tsc --noEmit -p tsconfig.json · tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) \| gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓ |
| Golar default (lint+typecheck) | ok | **1.53 s** | 1.51 s | 10.5 ms | 0.7% | 1.44x | 0 | 130 files/s | golar default mode runs lint then typecheck — not a pure typecheck \| engine: typescript-go 7.0.2 \| gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓ |
| Golar typecheck | ok | **1.56 s** | 1.55 s | 9.4 ms | 0.6% | 1.47x | 0 | 128 files/s | golar typecheck (typescript-go + @golar/vue plugin) \| engine: typescript-go 7.0.2 \| gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓ |
| vue-tsc (TNB / tsgo) | ok | **2.21 s** | 2.06 s | 76.2 ms | 3.4% | 2.08x | 0 | 90 files/s | vue-tsc 3.3.8 with typescript aliased to typescript-native-bridge 6.0.3-bridge.6.tsgo.7.0.2 (TS API 6.0.3 on tsgo 7.0.2, in-process NAPI/FFI) \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 \| gate: script=✓ tmpl-prop=✓ tmpl-event=✓ corpus=✓ |
| Vize check | ⚠ failed validation | (421.2 ms) | (411.1 ms) | n/a | n/a | not ranked | (22) | n/a | vize check . --tsconfig tsconfig.json (native + Corsa when available) \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) \| ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking \| gate: script=✓ tmpl-prop=✗ tmpl-event=✓ corpus=✗ (missed template prop-type plant (:disabled string→boolean)) |

<details><summary>Methodology</summary>

- Same on-disk fixture directory and tsconfig for every tool.
- Default check file limit is smaller than compile corpus (typecheck cost scales steeply).
- Each measurement is a full CLI process invocation — every tool here is a CLI, so process startup is paid by all of them equally.
- Warm runs still benefit from OS page cache of source files and node_modules.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.
- Work gate has three parts, all required to be ranked: (1) a script-only planted error, (2) a template-only planted error with strictTemplates — proving the tool actually typechecks templates and does not just run tsc over extracted script blocks, and (3) the same planted bug re-detected in the FULL timed corpus under the timed tsconfig, proving the tool does not degrade at scale.
- Per-tool gate results are shown in Notes as script/template/corpus ✓✗.
- verter-tsc requires stable tsgo (typescript@7.0.x / typescript-go); set via VERTER_TSGO_BIN.
- Two engines are measured and ranked separately: the JavaScript TypeScript compiler and native tsgo. `vue-tsc` and `vue-tsc (TNB / tsgo)` are the SAME vue-tsc and the same Vue layer differing only in engine, so the pair isolates how much of any speed gap is TypeScript's Go rewrite rather than the Vue tooling on top of it.
- The TNB row lives in envs/tnb as a standalone install, never a root `typescript` override, so the engine swap cannot leak into component-meta, lint or LSP surfaces; it must also print its activation banner or it is unranked.
- Diagnostic equivalence is NOT asserted — this is a throughput benchmark, not a correctness suite.
- golar default mode includes linting; golar typecheck is pure typecheck.
- Allow non-zero exit codes: generated fixtures may surface tool-specific diagnostics.

Raw runs:

- **vue-tsc**: 4.70 s, 4.70 s, 4.68 s, 4.68 s, 4.69 s
- **verter-tsc**: 1.06 s, 1.05 s, 1.05 s, 1.12 s, 1.06 s
- **Golar default (lint+typecheck)**: 1.52 s, 1.54 s, 1.51 s, 1.54 s, 1.53 s
- **Golar typecheck**: 1.56 s, 1.56 s, 1.57 s, 1.57 s, 1.55 s
- **vue-tsc (TNB / tsgo)**: 2.26 s, 2.21 s, 2.22 s, 2.21 s, 2.06 s
- **Vize check**: 411.1 ms, 440.3 ms, 421.2 ms, 418.8 ms, 423.0 ms

</details>

### Format

Files: **200** · Bytes: **285,701**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

##### CLI subprocess · Single-thread (1T) — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Prettier | ok | **3.77 s** | 3.76 s | 16.0 ms | 0.4% | 1.00x | n/a | 53 files/s | prettier --write *.vue (fresh copy each run) · single-threaded by design |

##### CLI subprocess · Max threads — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Oxfmt | ok | **2.99 s** | 2.92 s | 39.6 ms | 1.3% | 1.00x | n/a | 67 files/s | oxfmt --write (Vue-capable Oxc formatter; fresh copy each run) · self-reports 32 threads on this box, so it is NOT ranked against single-threaded Prettier |

##### CLI subprocess · Threading: unknown — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize fmt | ok | **96.3 ms** | 94.7 ms | 1.4 ms | 1.4% | 1.00x | n/a | 2.1k files/s | vize fmt --write (fresh copy each run) · does not report thread usage; ranked apart rather than assumed single-threaded |

<details><summary>Methodology</summary>

- Each invocation receives a fresh copy of the same Vue SFC corpus (formatters rewrite files).
- .prettierrc.json is copied into every work copy so Prettier's config actually resolves (config left in the fixture root is not on the work dir's lookup path).
- All three formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.
- Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.
- Prettier, Oxfmt, and Vize all claim Vue SFC support; rule/option parity is not guaranteed.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Prettier**: 3.76 s, 3.79 s, 3.76 s, 3.79 s, 3.77 s
- **Oxfmt**: 2.94 s, 2.92 s, 2.99 s, 3.00 s, 3.02 s
- **Vize fmt**: 96.9 ms, 96.3 ms, 98.4 ms, 95.7 ms, 94.7 ms

</details>

### Lint

Files: **200** · Bytes: **285,701**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

##### CLI subprocess · Single-thread (1T) — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize lint (1T) | ok | **76.5 ms** | 76.3 ms | 2.0 ms | 2.7% | 1.00x | n/a | 2.6k files/s | vize lint . with RAYON_NUM_THREADS=1 |
| eslint-plugin-vue (CLI) | ok | **2.86 s** | 2.86 s | 13.8 ms | 0.5% | 37.44x | n/a | 70 files/s | eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs |

##### In-process API · Single-thread (1T) — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| eslint-plugin-vue (1T) | ok | **1.62 s** | 1.51 s | 84.5 ms | 5.2% | 1.00x | n/a | 123 files/s | ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles |

##### CLI subprocess · Max threads — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize lint (max threads) | ok | **58.8 ms** | 56.0 ms | 2.4 ms | 4.1% | 1.00x | n/a | 3.4k files/s | vize lint . using default Rayon pool (all cores) |

##### In-process API · Host API — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter host lint | ok | **160.6 ms** | 151.4 ms | 4.4 ms | 2.8% | 1.00x | n/a | 1.2k files/s | VerterHost.upsert + lint(canonicalId) for each file (if API available) |

##### In-process API · Worker fan-out — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| eslint-plugin-vue (4 workers) | ok | **3.32 s** | 3.28 s | 42.4 ms | 1.3% | 1.00x | n/a | 60 files/s | ESLint worker_threads fan-out (one ESLint instance per worker) |

<details><summary>Methodology</summary>

- Every tool lints an identical isolated copy of the corpus (work/lint/…), so tools that take an explicit file list and tools that walk a directory see exactly the same files.
- In-process and CLI tools are ranked in SEPARATE tables. A CLI pays process startup on every run (~85ms measured for a native CLI); an in-process API pays it once. eslint runs in BOTH classes so the two tables have a shared reference point.
- No single invocation mode covers every tool — vize lint is CLI-only, VerterHost.lint is in-process-only — so the split is the only way to compare like with like.
- eslint-plugin-vue uses flat recommended config generated with fixtures.
- Vize lint 1T vs max threads reported separately — compare within class.
- Planted-bug work gate: each tool must report vue/no-v-html (or equivalent) or is unranked.
- Allow non-zero exit (style diagnostics do not abort timing).
- Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize lint (1T)**: 76.5 ms, 76.4 ms, 76.3 ms, 81.0 ms, 77.2 ms
- **eslint-plugin-vue (CLI)**: 2.89 s, 2.86 s, 2.86 s, 2.88 s, 2.86 s
- **eslint-plugin-vue (1T)**: 1.73 s, 1.66 s, 1.58 s, 1.62 s, 1.51 s
- **Vize lint (max threads)**: 56.0 ms, 58.6 ms, 58.8 ms, 59.7 ms, 62.7 ms
- **Verter host lint**: 160.6 ms, 151.4 ms, 161.6 ms, 162.5 ms, 159.0 ms
- **eslint-plugin-vue (4 workers)**: 3.28 s, 3.40 s, 3.32 s, 3.32 s, 3.31 s

</details>

### Component-meta

Files: **100** · Bytes: **142,771**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Meta members | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| @verter/component-meta | ok | **526.0 ms** | 507.9 ms | 12.7 ms | 2.4% | 1.00x | 88 | 190 files/s | openComponentMetaSession(root, tsconfig) + getComponentMeta for each .vue file |
| vue-component-meta | ok | **925.0 ms** | 893.3 ms | 176.0 ms | 19.0% ⚠ | 1.76x | 1,343 | 108 files/s | createChecker(tsconfig) + getComponentMeta for each .vue file |
| Vize component-meta | skipped | n/a | n/a | n/a | n/a | n/a | n/a | n/a | No dedicated public component-meta API found on vize/@vizejs/native (declaration emit is a different surface and is not substituted). |

<details><summary>Methodology</summary>

- Extract component public API metadata (props/events/slots where supported).
- Same subset of .vue files for every available tool.
- Schema depth and TypeScript program options may differ by tool — timings are throughput, not equivalence.
- Every tool is driven through its own published entry point. No payload is hand-decoded, and no row is measured through an API it does not ship.
- Each row reports the meta members it materialised. The counts are NOT equivalent between tools and no threshold is applied to them: on this corpus most generated SFCs declare no macros, and the tools differ on whether a component with no declared API still has implicit members. Read the member counts alongside the times rather than treating the ratio as like-for-like.
- Tool order is ROTATED on every warmup and measured run (not merely alternated), so no tool keeps a fixed position in the sequence.
- Tools without a real component-meta API are reported as skipped (no substitute workload).

Raw runs:

- **@verter/component-meta**: 521.6 ms, 507.9 ms, 526.0 ms, 532.8 ms, 541.9 ms
- **vue-component-meta**: 1.31 s, 981.9 ms, 925.0 ms, 897.2 ms, 893.3 ms

</details>

### LSP (editor language server)

Files: **1** · Bytes: **745**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

##### TypeScript (JS engine) · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Hover bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **1.07 s** | 1.07 s | 6.3 ms | 0.6% | 1.00x | 114 | 1 files/s | Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. \| engine: TypeScript 5.9.3 (JS) \| init=555ms · ready=n/a · open→hover=1073ms · hoverCold=37ms · hoverWarm=3ms · completion=18ms · definition=9ms \| hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) |

##### tsgo (native engine) · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Hover bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **337.1 ms** | 273.8 ms | 34.0 ms | 10.1% ⚠ | 1.00x | 113 | 3 files/s | verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) \| init=4ms · ready=27ms · open→hover=346ms · hoverCold=17ms · hoverWarm=1ms · completion=1ms · definition=2ms \| hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) |
| Volar (TNB / tsgo tsdk) | ok | **1.03 s** | 1.01 s | 10.9 ms | 1.1% | 3.04x | 114 | 1 files/s | Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.6.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 \| init=498ms · ready=n/a · open→hover=1025ms · hoverCold=3ms · hoverWarm=3ms · completion=23ms · definition=5ms \| hover verified: returns a TypeScript type for `benchMarker` in <script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) |
| Vize LSP (Node shim) | ⚠ failed validation | (220.4 ms) | (179.8 ms) | n/a | n/a | not ranked | (473) | n/a | vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.1/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) \| init=31ms · ready=n/a · open→hover=180ms · hoverCold=1ms · hoverWarm=2ms · completion=1ms · definition=1ms \| ⚠ FAILED VALIDATION (template hover) — template hover returned Ref<...> — that is the <script setup> type leaking into template context; refs auto-unwrap inside {{ }}, so the correct answer is `string`. Sample: "**benchMarker**\n\n_Template binding from script_\n\n```typescript\nbenchMarker: Ref<string>\n```\n\nReactive reference created " |

<details><summary>Methodology</summary>

- Apples-to-apples: identical workspace, LspTarget.vue, UTF-16 hover position on `const benchMarker`.
- Hover content is gated in TWO places, both required to be ranked: the `<script setup>` position (must return a TypeScript type) and the `{{ benchMarker }}` TEMPLATE position (must return the auto-unwrapped `string`). The template probe is the Vue-specific one — a server can satisfy the script probe by proxying to a TypeScript server, but resolving a ref's unwrapped type inside an interpolation requires actually modelling the template, which is the job a Vue language server exists to do. A payload naming the symbol with no type, or returning the `Ref<...>` script type, fails.
- The template probe runs OUTSIDE every timed window, so it gates ranking without changing what the latency column measures.
- Each measured run starts a fresh language-server process (tool process cold).
- Volar is measured as the two-process product it is in v3: @vue/language-server has no in-process TypeScript language service, so the harness also starts typescript-language-server with @vue/typescript-plugin, syncs the same .vue buffer to both, and asks both for every feature in parallel — Volar is charged the slower half plus both processes' startup and project load. This is the same wiring VS Code and Neovim implement; without it the Vue server returns null for a <script setup> hover by design.
- Primary ranking column uses didOpen→hover latency (first semantic response after open), taken as the median over warmed runs — each run still starts a fresh server process, so per-process project load is measured every time.
- Hover retry budget is identical for every server (6 attempts, 60s each, same backoff). Retry sleeps fall inside the timed open→hover window, so an asymmetric budget would silently subsidise whichever server got the larger one.
- A fixed 50ms yield after didOpen is inside the timed window for every server alike — it is an additive constant, so it compresses ratios slightly but cannot reorder them.
- Phase breakdown in Notes: initialize, ready (n/a if no server signal), open→hover, hover cold, hover warm median(5), completion, definition.
- workspaceReady is OBSERVED, never waited for. A vendor ready notification (e.g. $/verter/ready) is recorded from session start as a diagnostic and never enters a ranked column — the harness does not pause on it. It previously did, which moved one server's workspace load OUT of the ranked open→hover window while every other server's stayed inside it. Missing signal = n/a, not 0.
- Readiness is established identically for every server and INSIDE the ranked window, via the shared didOpen→hover retry loop — the same content-gated approach the ide-ops suites use. Whoever needs project-load time pays for it in the metric.
- Comparison classes are split by TypeScript ENGINE, the same rule the typecheck surface applies and via the same resolver: Volar runs the JavaScript TypeScript compiler, while Volar/TNB, Vize and Verter all run native tsgo. Ranking those in one table measures TypeScript's Go rewrite rather than the Vue layer under test.
- Process host (native executable vs Node) is NOT a comparison-class axis here — there is no native Volar and no Node-hosted Verter, so splitting on it would leave every table with one row. It is printed on the row instead.
- Vize is launched from the standalone native server the VS Code extension downloads (version-matched, discovered under VS Code globalStorage, or pinned with VIZE_LSP_BIN) — that is the process the shipped product runs. Where no native server exists, e.g. CI, the npm package's Node entry is used and the row says so, because the Node bootstrap it adds (~35ms/spawn, inside initialize) is not part of the product.
- Completion/definition are best-effort extras; null/n/a does not mean the tool is slower — capability may differ.
- typescript-native-bridge (TNB) is a drop-in typescript package for CLI/tsserver — NOT a Vue LSP in its own right. It appears here only as Volar's TypeScript engine: the `Volar (TNB / tsgo tsdk)` row is the same Volar binary with TNB supplying the tsserver half, so the pair isolates the TS engine from the Vue layer.
- Verter resolves from the installed `verter-lsp` package only; skipped when it is absent.
- VS Code extension host overhead is NOT measured — only the language server stdio protocol.
- Server order is rotated on every warmup and measured run; no server is pinned to first position.

Raw runs:

- **Volar (@vue/language-server)**: 1.09 s, 1.08 s, 1.07 s, 1.07 s, 1.07 s
- **Verter LSP (npm 0.0.1-beta.3)**: 362.6 ms, 320.6 ms, 337.1 ms, 273.8 ms, 346.3 ms
- **Volar (TNB / tsgo tsdk)**: 1.03 s, 1.02 s, 1.01 s, 1.04 s, 1.03 s
- **Vize LSP (Node shim)**: 232.5 ms, 222.2 ms, 220.4 ms, 214.3 ms, 179.8 ms

</details>

#### Ubuntu/Linux · cache-demo (not ranking)

<!-- source: bench-Linux-200-repeated-cache-demo.md -->

## Benchmark Results

- **Generated:** 2026-07-27T17:27:45.412Z
- **Fixture:** `fixtures/200-repeated` (200 SFCs)
- **Runs / warmups:** 2 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
- **Node:** v22.23.1
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/30288994570

### Tool versions

| Package | Version |
| --- | --- |
| vue | 3.5.40 |
| @vue/compiler-sfc | 3.5.40 |
| @vue/compiler-sfc-36 | 3.6.0-rc.2 |
| vize | 0.291.0 |
| @vizejs/native | 0.291.0 |
| @verter/native | 0.0.1-beta.3 |
| verter-tsc | 0.0.1-beta.3 |
| @verter/component-meta | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| verter-mcp | 0.0.1-beta.3 |
| @vue/language-server | 3.3.8 |
| @vue/typescript-plugin | 3.3.8 |
| typescript-language-server | 5.3.0 |
| vue-tsc | 3.3.8 |
| vue-component-meta | 3.3.8 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.6 |
| oxfmt | 0.61.0 |
| typescript | 5.9.3 |
| cli:vize | 0.291.0 |
| cli:vue-tsc | 5.9.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.61.0 |
| vue-jsx-vapor | 3.2.19 |
| @vue-jsx-vapor/compiler-rs | 3.2.19 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

### Methodology notes

- Primary ranking metric is the **median of measured runs**. Every measured run is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1).
- There is **no cold column**. An unwarmed first run costs a JS compiler ~3.2x its steady state and a native compiler nothing, so ranking on it measures V8 warmup rather than the tool.
- Min / stddev / CV% are reported per row. CV% > 10 is flagged ⚠ — treat that row as noisy (thermal drift or a contended runner), not as a result.
- Comparison classes (invocation × threading) are ranked in **separate tables** — an in-process API amortises process startup across runs, a CLI pays it every run.
- Surfaces are independent: compile ms is not comparable to jsx-compile/typecheck/lint/format ms.
- jsx-compile uses fixtures/jsx-N (.jsx); SFC compile uses fixtures/N (.vue).
- Compile matrix cells (VDOM/Vapor × production/development × sourcemap on/off) are independent.
- Source map is an explicit, independent dimension applied identically to every compiler — it is never folded into the production/development flag for some tools and not others.
- Primary compile corpus is unique file contents (fixtures/N).
- Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.
- Tool order is **rotated** on every warmup and measured run, so no tool is pinned to the expensive first slot.
- CI does not drop OS page cache; later tools in a job may share a warmer file cache.
- Typecheck/lint tools that fail a planted-bug work gate are unranked (skipped). Typecheck gates require both a script-level and a template-level diagnostic, and are re-verified against the full timed corpus.
- Compile measures assert non-empty codegen where applicable.
- Vue official compiler is 1T only (worker_threads variants removed).
- LSP: every server resolves from its installed npm package and is skipped when absent — no local-build or working-copy discovery, so each row names a version.
- verter-tsc needs stable tsgo (typescript@7.0.x via typescript-go); harness sets VERTER_TSGO_BIN.
- Diagnostic/format identity across tools is not required for throughput rows.

### SFC compile (⚠ 199 duplicate bodies — content-hash caches may inflate throughput)

Files: **200** · Bytes: **46,600**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

Compile results are **grouped by target × environment × source map**, then by comparison class.

#### VDOM · production · sourcemap off

Target: `vdom` · Environment: `production` · Source map: `off`

##### VDOM · In-process API · Single-thread (1T) — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize native loop (1T) | ok | **12.7 ms** | 12.6 ms | 0.2 ms | 1.2% | 1.00x | 107,800 | 15.8k files/s | compileSfc vapor=false, sourceMap=false. ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking. |
| @vue/compiler-sfc 3.5 (1T) | ok | **46.9 ms** | 43.9 ms | 4.3 ms | 9.1% | 3.70x | 153,800 | 4.3k files/s | Official 3.5 VDOM, isProd=true, sourceMap=false, single-threaded |
| @vue/compiler-sfc 3.6 (1T) | ok | **54.1 ms** | 48.0 ms | 8.6 ms | 15.9% ⚠ | 4.27x | 153,800 | 3.7k files/s | Official 3.6 VDOM, isProd=true, sourceMap=false |

##### VDOM · In-process API · Batch / multi-thread pool — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize native batch (max threads) | ok | **4.7 ms** | 4.3 ms | 0.5 ms | 11.6% ⚠ | 1.00x | 107,800 | 42.2k files/s | compileSfcBatchWithResults vapor=false, sourceMap=false. multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking. |
| Verter compileMany (stateless) | ok | **111.5 ms** | 110.2 ms | 1.8 ms | 1.6% | 23.55x | 140,600 | 1.8k files/s | runtime-render forceVapor=false, isProduction=true, sourceMap=false, hmr=none, mode=stateless, analysis=full, multi-thread host pool cacheHits≈0 |

##### VDOM · In-process API · Batch with persistent cache — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter compileMany (session cache) | ok | **8.9 ms** | 8.1 ms | 1.2 ms | 12.9% ⚠ | 1.00x | 140,600 | 22.4k files/s | runtime-render forceVapor=false, isProduction=true, sourceMap=false, mode=session, analysis=full — persistent host, cacheHits reported (ranked separately from cache-free batch rows) cacheHits≈0 |

<details><summary>Raw runs</summary>

- **Vize native loop (1T)**: 12.8 ms, 12.6 ms
- **@vue/compiler-sfc 3.5 (1T)**: 49.9 ms, 43.9 ms
- **@vue/compiler-sfc 3.6 (1T)**: 48.0 ms, 60.2 ms
- **Vize native batch (max threads)**: 5.1 ms, 4.3 ms
- **Verter compileMany (stateless)**: 112.8 ms, 110.2 ms
- **Verter compileMany (session cache)**: 9.7 ms, 8.1 ms

</details>

<details><summary>Methodology</summary>

- Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.
- Corpus mode=repeated: 1/200 unique content SHAs. Vize content-hash caches treat identical bodies as free — primary rankings must use unique fixtures (fixtures/N), not fixtures/N-repeated.
- Same in-memory Vue SFC corpus for every variant (compiler flags differ; sources do not).
- Work measured: parse SFC + compile script (if any) + compile template (if any).
- VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).
- Source map is an INDEPENDENT dimension, requested identically from every compiler in a cell (Vue: parse+compileScript+codegen sourceMap; Vize: compileSfc sourceMap; Verter: compileProfile sourceMap). It is not folded into the prod/dev flag for some tools and not others.
- Production vs development uses each tool's real semantic knobs only: Vue isProd (hoistStatic + cacheHandlers); Verter isProduction + hmrStrategy.
- ⚠ Vize exposes no isProduction on compileSfc, so its production and development rows perform identical work. Stated rather than substituted with a different knob.
- Vue 3.5 has no Vapor path → skipped for vapor cells (not run as VDOM).
- Comparison classes (1T / batch / batch-cached) are ranked in separate tables (not mixed).
- Verter session mode keeps a persistent host across warmups and runs, so it is ranked as `batch-cached`, apart from cache-free batch rows.
- Tool order is rotated on every warmup and measured run; no tool is pinned to first position.
- Ranking metric is the median of measured runs, all taken after >= 1 discarded warmup. No cold column.

</details>

<!-- BENCHMARK_RESULTS_END -->

## IDE operation results

Per-operation editor benchmarks from the `ide` job (`scripts/ide-bench.mjs`). Ranked **per operation**, never pooled — `didOpen→diagnostics` and `foldingRange` differ by orders of magnitude and answer unrelated questions. Not comparable to the timing tables above: different job, different load profile.

Servers here are Volar, **Volar on the TNB/tsgo tsdk**, Vize and Verter. Three caveats apply to these tables specifically:

- **`Volar (TNB / tsgo tsdk)` errors resolving an auto-import completion** — `Debug Failure. False expression. at getCompletionEntryCodeActionsAndSourceDisplay`. Stock Volar resolves the same item. [Details](#caveat-the-tnb-engine-swap-fails-an-ide-completion-resolve-operation).
- **Vize may answer with its tsgo backend absent**, with no error in the LSP traffic. [Details](#caveat-vizes-type-checking-backend-sometimes-never-starts-and-the-row-still-answers).
- **Both Volar rows are two processes**, charged the slower half on every operation; Vize and Verter are one. [Details](#caveat-volars-lsp-memory-row-is-not-the-whole-of-volar-but-the-lsp-timing-row-is).

<!-- IDE_RESULTS_START -->

> Auto-updated 2026-07-27 from the **Benchmark** workflow (`ide` job — per-operation editor benchmarks).
> Ranked **per operation**, never pooled: `didOpen→diagnostics` and `foldingRange` answer unrelated questions.
> Same-VM rule holds within the job; these numbers are not comparable to the timing tables above.

#### Ubuntu/Linux · ide ops

<!-- source: ide-Linux.md -->

## IDE operation results

- **Generated:** 2026-07-27T17:29:16.508Z
- **Runner:** linux/x64 · Node v22.23.1
- **Runs / warmups:** 3 / 1

### IDE · background

Files: **1** · Bytes: **0**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Semantic tokens (full)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **754.0 ms** | 724.1 ms | 25.0 ms | 3.3% | 1.00x | 48 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **0.5 ms** | 0.5 ms | 0.0 ms | 5.2% | 1.00x | 15 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Volar (TNB / tsgo tsdk) | ok | **634.6 ms** | 632.6 ms | 8.9 ms | 1.4% | 1228.95x | 48 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (124.6 ms) | (37.4 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — returned null — no tokens at all for this document \| Sample: "null" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 773.9 ms, 724.1 ms, 754.0 ms
- **Vize LSP (Node shim)**: 0.5 ms, 0.5 ms, 0.6 ms
- **Volar (TNB / tsgo tsdk)**: 632.6 ms, 634.6 ms, 649.0 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 124.6 ms, 363.4 ms, 37.4 ms

</details>

#### Semantic tokens (delta after edit)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ⚠ failed validation | (1.0 ms) | (1.0 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1785173034867", which invites a delta \| Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ⚠ failed validation | (1.1 ms) | (1.0 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1785173044387", which invites a delta \| Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.5 ms) | (0.4 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId \| Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.7 ms) | (0.4 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId \| Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 1.0 ms, 1.1 ms, 1.0 ms
- **Volar (TNB / tsgo tsdk)**: 1.1 ms, 1.1 ms, 1.0 ms
- **Vize LSP (Node shim)**: 0.6 ms, 0.5 ms, 0.4 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.7 ms, 1.1 ms, 0.4 ms

</details>

#### Document symbols (outline)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **17.8 ms** | 17.5 ms | 2.8 ms | 14.6% ⚠ | 1.00x | 25 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **0.6 ms** | 0.4 ms | 0.5 ms | 66.8% ⚠ | 1.00x | 12 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **16.7 ms** | 16.6 ms | 3.6 ms | 19.2% ⚠ | 29.43x | 25 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.3 ms) | (0.3 ms) | n/a | n/a | not ranked | (2) | n/a | ⚠ FAILED VALIDATION — outline is missing 7/7 script symbols: heading, nextLabel, threshold, entries, visibleEntries, formatEntry, addEntry \| Sample: "2 symbols: template, script setup" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 17.5 ms, 17.8 ms, 22.5 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.6 ms, 1.4 ms, 0.4 ms
- **Volar (TNB / tsgo tsdk)**: 16.7 ms, 16.6 ms, 22.9 ms
- **Vize LSP (Node shim)**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Document highlight (caret move)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **17.9 ms** | 16.4 ms | 3.0 ms | 16.0% ⚠ | 1.00x | 5 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **0.3 ms** | 0.3 ms | 0.1 ms | 17.9% ⚠ | 1.00x | 4 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ok | **0.4 ms** | 0.3 ms | 1.9 ms | 133.0% ⚠ | 1.46x | 4 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **28.4 ms** | 28.2 ms | 0.5 ms | 1.9% | 110.32x | 5 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 22.2 ms, 17.9 ms, 16.4 ms
- **Vize LSP (Node shim)**: 0.3 ms, 0.3 ms, 0.3 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.4 ms, 3.6 ms, 0.3 ms
- **Volar (TNB / tsgo tsdk)**: 28.2 ms, 29.2 ms, 28.4 ms

</details>

#### Inlay hints (document range)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **68.1 ms** | 67.2 ms | 12.2 ms | 16.4% ⚠ | 1.00x | 14 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **0.6 ms** | 0.5 ms | 0.0 ms | 6.5% | 1.00x | 2 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Volar (TNB / tsgo tsdk) | ok | **138.7 ms** | 130.3 ms | 4.9 ms | 3.6% | 240.68x | 14 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.3 ms) | (0.2 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings \| Sample: "null" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 88.8 ms, 68.1 ms, 67.2 ms
- **Vize LSP (Node shim)**: 0.6 ms, 0.6 ms, 0.5 ms
- **Volar (TNB / tsgo tsdk)**: 138.7 ms, 130.3 ms, 138.8 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.3 ms, 4.4 ms, 0.2 ms

</details>

#### Folding ranges

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **102.8 ms** | 9.0 ms | 58.9 ms | 77.0% ⚠ | 1.00x | 13 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **0.2 ms** | 0.2 ms | 0.0 ms | 23.6% ⚠ | 1.00x | 2 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ok | **0.3 ms** | 0.2 ms | 0.1 ms | 26.3% ⚠ | 1.64x | 7 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **21.6 ms** | 21.4 ms | 1.4 ms | 6.3% | 110.44x | 13 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 102.8 ms, 9.0 ms, 117.6 ms
- **Vize LSP (Node shim)**: 0.3 ms, 0.2 ms, 0.2 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.3 ms, 0.4 ms, 0.2 ms
- **Volar (TNB / tsgo tsdk)**: 23.9 ms, 21.6 ms, 21.4 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows are split by the TypeScript ENGINE behind the server and ranked only within one engine — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so ranking them together would measure TypeScript's Go rewrite rather than the server. Same axis, same reason, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · completion

Files: **1** · Bytes: **0**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Completion: script member

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **5.4 ms** | 2.9 ms | 19.7 ms | 127.3% ⚠ | 1.00x | 3 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **0.9 ms** | 0.8 ms | 0.1 ms | 8.4% | 1.00x | 3 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **3.0 ms** | 2.6 ms | 0.3 ms | 10.2% ⚠ | 3.54x | 3 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.3 ms) | (0.3 ms) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — no `quaver` member of the local object in 0 items \| Sample: "(empty list)" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 38.2 ms, 5.4 ms, 2.9 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.9 ms, 0.9 ms, 0.8 ms
- **Volar (TNB / tsgo tsdk)**: 2.6 ms, 3.0 ms, 3.2 ms
- **Vize LSP (Node shim)**: 0.4 ms, 0.3 ms, 0.3 ms

</details>

#### Completion: component tag <Ch

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **44.2 ms** | 36.9 ms | 38.3 ms | 61.3% ⚠ | 1.00x | 192 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **34.3 ms** | 32.2 ms | 1.3 ms | 3.9% | 1.00x | 1,193 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **60.6 ms** | 59.7 ms | 0.5 ms | 0.9% | 1.76x | 192 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.8 ms) | (0.8 ms) | n/a | n/a | not ranked | (42) | n/a | ⚠ FAILED VALIDATION — no `ChildCard` component tag in 42 items \| Sample: "[v-if, v-else-if, v-else, v-for, v-on, v-bind, v-model, v-slot, v-show, v-pre, v-once, v-memo, …+30]" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 44.2 ms, 36.9 ms, 106.6 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 32.2 ms, 34.7 ms, 34.3 ms
- **Volar (TNB / tsgo tsdk)**: 60.8 ms, 60.6 ms, 59.7 ms
- **Vize LSP (Node shim)**: 0.8 ms, 0.9 ms, 0.8 ms

</details>

#### Completion: prop name <C :

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **81.1 ms** | 7.9 ms | 50.9 ms | 78.4% ⚠ | 1.00x | 26 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **0.5 ms** | 0.5 ms | 0.0 ms | 7.7% | 1.00x | 4 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ok | **1.7 ms** | 1.5 ms | 0.7 ms | 32.8% ⚠ | 3.37x | 16 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **15.2 ms** | 14.8 ms | 0.3 ms | 2.3% | 30.50x | 26 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 105.8 ms, 81.1 ms, 7.9 ms
- **Vize LSP (Node shim)**: 0.5 ms, 0.6 ms, 0.5 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 2.7 ms, 1.5 ms, 1.7 ms
- **Volar (TNB / tsgo tsdk)**: 15.5 ms, 15.2 ms, 14.8 ms

</details>

#### Completion: event name <C @

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **9.4 ms** | 8.6 ms | 0.7 ms | 7.2% | 1.00x | 25 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **7.9 ms** | 7.7 ms | 0.3 ms | 4.0% | 1.00x | 25 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.5 ms) | (0.5 ms) | n/a | n/a | not ranked | (12) | n/a | ⚠ FAILED VALIDATION — no `quench` declared emit in 12 items \| Sample: "[v-on, @, @click, @input, @change, @submit, @keydown, @keyup, @focus, @blur, @mouseenter, @mouseleave]" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.3 ms) | (0.3 ms) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — no `quench` declared emit in 0 items \| Sample: "(empty list)" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 9.4 ms, 9.9 ms, 8.6 ms
- **Volar (TNB / tsgo tsdk)**: 8.3 ms, 7.7 ms, 7.9 ms
- **Vize LSP (Node shim)**: 0.5 ms, 0.5 ms, 0.5 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.4 ms, 0.3 ms, 0.3 ms

</details>

#### Completion: directive v-

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **25.1 ms** | 22.1 ms | 31.0 ms | 74.8% ⚠ | 1.00x | 498 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **0.6 ms** | 0.6 ms | 0.4 ms | 45.3% ⚠ | 1.00x | 15 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Volar (TNB / tsgo tsdk) | ok | **16.2 ms** | 15.9 ms | 0.3 ms | 2.0% | 28.04x | 498 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.4 ms) | (0.3 ms) | n/a | n/a | not ranked | (3) | n/a | ⚠ FAILED VALIDATION — no `v-if` directive in 3 items \| Sample: "[style scoped, style, i18n]" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 77.3 ms, 22.1 ms, 25.1 ms
- **Vize LSP (Node shim)**: 0.6 ms, 0.6 ms, 1.2 ms
- **Volar (TNB / tsgo tsdk)**: 16.5 ms, 15.9 ms, 16.2 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.5 ms, 0.4 ms, 0.3 ms

</details>

#### Completion: slot name <template #

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **14.7 ms** | 14.2 ms | 2.1 ms | 13.2% ⚠ | 1.00x | 500 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **0.3 ms** | 0.3 ms | 0.0 ms | 0.7% | 1.00x | 2 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Vize LSP (Node shim) | ok | **0.9 ms** | 0.8 ms | 0.1 ms | 13.4% ⚠ | 2.83x | 30 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Volar (TNB / tsgo tsdk) | ok | **14.4 ms** | 13.7 ms | 1.0 ms | 6.8% | 45.64x | 500 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 14.7 ms, 18.0 ms, 14.2 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.3 ms, 0.3 ms, 0.3 ms
- **Vize LSP (Node shim)**: 0.9 ms, 0.8 ms, 1.0 ms
- **Volar (TNB / tsgo tsdk)**: 15.7 ms, 14.4 ms, 13.7 ms

</details>

#### Completion: auto-import

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **30.5 ms** | 29.1 ms | 1.9 ms | 6.1% | 1.00x | 1,018 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **53.7 ms** | 52.7 ms | 1.4 ms | 2.5% | 1.00x | 1,077 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.8 ms) | (0.8 ms) | n/a | n/a | not ranked | (44) | n/a | ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import \| Sample: "offered: \"computed\" kind=3 detail=\"function computed<T>(getter: () => T): ComputedRef<T>\" ; \"import computed\" kind=9 detail=\"Import computed from Vue\" insertTex" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.4 ms) | (0.4 ms) | n/a | n/a | not ranked | (9) | n/a | ⚠ FAILED VALIDATION — no `computed` in 9 items \| Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 30.5 ms, 32.8 ms, 29.1 ms
- **Volar (TNB / tsgo tsdk)**: 53.7 ms, 55.4 ms, 52.7 ms
- **Vize LSP (Node shim)**: 0.8 ms, 0.8 ms, 0.8 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.4 ms, 0.4 ms, 0.4 ms

</details>

#### Resolve: auto-import edit

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **38.3 ms** | 36.0 ms | 1.5 ms | 4.0% | 1.00x | 241 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **23.9 ms** | 23.3 ms | 0.6 ms | 2.4% | 1.00x | 241 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.3 ms) | (0.2 ms) | n/a | n/a | not ranked | (223) | n/a | ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` \| Sample: "\"computed\" kind=3 detail=\"function computed<T>(getter: () => T): ComputedRef<T>\"" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.0 ms) | (0.0 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve \| Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 36.0 ms, 38.3 ms, 38.8 ms
- **Volar (TNB / tsgo tsdk)**: 23.3 ms, 23.9 ms, 24.4 ms
- **Vize LSP (Node shim)**: 0.3 ms, 0.2 ms, 0.4 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **2.4 ms** | 2.4 ms | 0.0 ms | 1.2% | 1.00x | 25 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **2.1 ms** | 2.0 ms | 0.1 ms | 6.1% | 1.00x | 25 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ok | **4.5 ms** | 4.2 ms | 0.2 ms | 3.6% | 2.13x | 25 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Vize LSP (Node shim) | ⚠ failed validation | (0.0 ms) | (0.0 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — script member completion offered no `quaver` item to resolve (0 items) \| Sample: "(empty list)" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 2.4 ms, 2.5 ms, 2.4 ms
- **Volar (TNB / tsgo tsdk)**: 2.0 ms, 2.3 ms, 2.1 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 4.5 ms, 4.5 ms, 4.2 ms
- **Vize LSP (Node shim)**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows are split by the TypeScript ENGINE behind the server and ranked only within one engine — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so ranking them together would measure TypeScript's Go rewrite rather than the server. Same axis, same reason, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · edit-loop

Files: **1** · Bytes: **0**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### didOpen -> first diagnostics

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **n/a** | n/a | n/a | n/a | n/a | 0 | n/a | content verified \| NOT RANKED (informational) — measured 1.15 s, min 1.14 s, CV 0.6%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **n/a** | n/a | n/a | n/a | n/a | 0 | n/a | content verified \| NOT RANKED (informational) — measured 1.12 s, min 1.11 s, CV 1.2%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ok | **n/a** | n/a | n/a | n/a | n/a | 0 | n/a | content verified \| NOT RANKED (informational) — measured 208.5 ms, min 200.5 ms, CV 4.6%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ok | **n/a** | n/a | n/a | n/a | n/a | 0 | n/a | content verified \| NOT RANKED (informational) — measured 312.4 ms, min 311.8 ms, CV 0.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 1.15 s, 1.15 s, 1.14 s
- **Volar (TNB / tsgo tsdk)**: 1.13 s, 1.11 s, 1.12 s
- **Vize LSP (Node shim)**: 200.5 ms, 208.5 ms, 219.5 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 312.5 ms, 311.8 ms, 312.4 ms

</details>

#### Edit plants type error -> reported

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **375.2 ms** | 374.0 ms | 1.5 ms | 0.4% | 1.00x | 1 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **150.3 ms** | 125.2 ms | 15.1 ms | 10.6% ⚠ | 1.00x | 1 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Volar (TNB / tsgo tsdk) | ok | **393.7 ms** | 391.8 ms | 1.4 ms | 0.4% | 2.62x | 1 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ok | **483.7 ms** | 482.1 ms | 7.4 ms | 1.5% | 3.22x | 1 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 376.9 ms, 375.2 ms, 374.0 ms
- **Vize LSP (Node shim)**: 152.3 ms, 125.2 ms, 150.3 ms
- **Volar (TNB / tsgo tsdk)**: 391.8 ms, 393.7 ms, 394.6 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 482.1 ms, 483.7 ms, 495.6 ms

</details>

#### Edit fixes it -> diagnostic clears

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **456.9 ms** | 453.7 ms | 3.2 ms | 0.7% | 1.00x | 0 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **127.6 ms** | 126.6 ms | 2.5 ms | 2.0% | 1.00x | 0 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Volar (TNB / tsgo tsdk) | ok | **392.7 ms** | 392.3 ms | 0.3 ms | 0.1% | 3.08x | 0 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ok | **503.7 ms** | 500.4 ms | 9.6 ms | 1.9% | 3.95x | 0 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 456.9 ms, 453.7 ms, 460.2 ms
- **Vize LSP (Node shim)**: 131.3 ms, 127.6 ms, 126.6 ms
- **Volar (TNB / tsgo tsdk)**: 392.7 ms, 392.8 ms, 392.3 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 503.7 ms, 500.4 ms, 518.5 ms

</details>

#### Hover after retype -> NEW type

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **52.0 ms** | 48.4 ms | 2.6 ms | 5.0% | 1.00x | 47 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **35.8 ms** | 34.7 ms | 1.7 ms | 4.6% | 1.00x | 47 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ok | **52.4 ms** | 51.2 ms | 2.1 ms | 4.0% | 1.46x | 40 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Vize LSP (Node shim) | ok | **132.4 ms** | 128.4 ms | 3.8 ms | 2.9% | 3.70x | 320 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 52.0 ms, 48.4 ms, 53.4 ms
- **Volar (TNB / tsgo tsdk)**: 34.7 ms, 38.0 ms, 35.8 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 51.2 ms, 55.3 ms, 52.4 ms
- **Vize LSP (Node shim)**: 128.4 ms, 132.4 ms, 136.1 ms

</details>

#### ... same hover, time to correct

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **52.0 ms** | 48.4 ms | 2.6 ms | 5.0% | 1.00x | 1 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **35.8 ms** | 34.7 ms | 1.7 ms | 4.6% | 1.00x | 1 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ok | **52.4 ms** | 51.2 ms | 2.1 ms | 4.0% | 1.46x | 1 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Vize LSP (Node shim) | ok | **132.4 ms** | 128.4 ms | 3.8 ms | 2.9% | 3.70x | 1 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 52.0 ms, 48.4 ms, 53.4 ms
- **Volar (TNB / tsgo tsdk)**: 34.7 ms, 38.0 ms, 35.8 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 51.2 ms, 55.3 ms, 52.4 ms
- **Vize LSP (Node shim)**: 128.4 ms, 132.4 ms, 136.1 ms

</details>

#### Steady state: edits 1-5 (median)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **36.4 ms** | 34.8 ms | 1.4 ms | 3.7% | 1.00x | n/a | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **32.8 ms** | 28.4 ms | 9.7 ms | 26.9% ⚠ | 1.00x | n/a | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **39.7 ms** | 38.4 ms | 1.0 ms | 2.6% | 1.21x | n/a | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (201.0 ms) | (190.9 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — edit #1: hover does not mention `probeValue` at all — payload begins "<<hover request failed: vize: textDocument/hover timed out a" \| Sample: "<<hover request failed: vize: textDocument/hover timed out after 8000ms>>" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 37.5 ms, 34.8 ms, 36.4 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 47.0 ms, 28.4 ms, 32.8 ms
- **Volar (TNB / tsgo tsdk)**: 38.4 ms, 40.3 ms, 39.7 ms
- **Vize LSP (Node shim)**: 190.9 ms, 8.01 s, 201.0 ms

</details>

#### Steady state: edits 6-10 (median)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **31.8 ms** | 31.4 ms | 1.0 ms | 3.1% | 1.00x | -6 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **30.8 ms** | 30.7 ms | 2.6 ms | 8.1% | 1.00x | -3 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ok | **32.5 ms** | 27.6 ms | 3.1 ms | 10.0% | 1.05x | -19 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Vize LSP (Node shim) | ⚠ failed validation | (228.1 ms) | (221.9 ms) | n/a | n/a | not ranked | (31) | n/a | ⚠ FAILED VALIDATION — edit #6: hover does not mention `probeValue` at all — payload begins "<<hover request failed: vize: textDocument/hover timed out a" \| Sample: "<<hover request failed: vize: textDocument/hover timed out after 8000ms>>" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 31.4 ms, 31.8 ms, 33.3 ms
- **Volar (TNB / tsgo tsdk)**: 35.3 ms, 30.8 ms, 30.7 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 27.6 ms, 33.5 ms, 32.5 ms
- **Vize LSP (Node shim)**: 221.9 ms, 8.01 s, 228.1 ms

</details>

#### Child prop retype -> Parent diagnostic

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **377.4 ms** | 375.2 ms | 4.3 ms | 1.1% | 1.00x | 1 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **393.6 ms** | 386.9 ms | 4.1 ms | 1.0% | 1.00x | 1 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (4.00 s) | (4.00 s) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 1 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now \| Sample: "before: [] \|\| after: []" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (4.00 s) | (4.00 s) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now \| Sample: "before: [] \|\| after: []" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 377.4 ms, 375.2 ms, 383.5 ms
- **Volar (TNB / tsgo tsdk)**: 386.9 ms, 394.3 ms, 393.6 ms
- **Vize LSP (Node shim)**: 4.00 s, 8.00 s, 4.00 s
- **Verter LSP (npm 0.0.1-beta.3)**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Child prop retype -> Parent hover

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **97.4 ms** | 94.8 ms | 1.6 ms | 1.6% | 1.00x | 42 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **57.3 ms** | 53.5 ms | 6.8 ms | 11.4% ⚠ | 1.00x | 42 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (135.7 ms) | (127.5 ms) | n/a | n/a | not ranked | (239) | n/a | ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; never caught up) \| Sample: "**label**\n\n_Component prop_\n\n```typescript\nlabel: string\n```\n\n**Requirement**\n\nRequired\n\n**Example**\n\n```vue\n<Child label=\"...\" />\n<Child :label=\"value\" />\n```\n" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (4.6 ms) | (4.6 ms) | n/a | n/a | not ranked | (42) | n/a | ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 431ms) \| Sample: "```typescript\n(property) label: string\n```" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 97.6 ms, 97.4 ms, 94.8 ms
- **Volar (TNB / tsgo tsdk)**: 53.5 ms, 57.3 ms, 66.6 ms
- **Vize LSP (Node shim)**: 135.7 ms, 8.00 s, 127.5 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 4.6 ms, 4.9 ms, 4.6 ms

</details>

#### ... Parent hover, time to correct

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **97.4 ms** | 94.8 ms | 1.6 ms | 1.6% | 1.00x | 1 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **57.3 ms** | 53.5 ms | 6.8 ms | 11.4% ⚠ | 1.00x | 1 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ok | **432.6 ms** | 430.5 ms | 6.7 ms | 1.5% | 7.56x | 3 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Vize LSP (Node shim) | ⚠ failed validation | (3.16 s) | (3.16 s) | n/a | n/a | not ranked | (16) | n/a | ⚠ FAILED VALIDATION — hover never reported `label: number` within 3000ms across 16 attempts — STALE: still reports `label: string` after the edit changed it to `number` \| Sample: "**label**\n\n_Component prop_\n\n```typescript\nlabel: string\n```\n\n**Requirement**\n\nRequired\n\n**Example**\n\n```vue\n<Child label=\"...\" />\n<Child :label=\"value\" />\n```\n" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 97.6 ms, 97.4 ms, 94.8 ms
- **Volar (TNB / tsgo tsdk)**: 53.5 ms, 57.3 ms, 66.6 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 430.5 ms, 443.0 ms, 432.6 ms
- **Vize LSP (Node shim)**: 3.16 s, 8.00 s, 3.16 s

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- `didOpen -> first diagnostics` is MEASURED BUT NOT RANKED: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. Its median column reads n/a; the measured time is on the row and under Raw runs.
- Rows are split by the TypeScript ENGINE behind the server and ranked only within one engine — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so ranking them together would measure TypeScript's Go rewrite rather than the server. Same axis, same reason, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · navigation

Files: **1** · Bytes: **0**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Definition: <ChildCard/> tag

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **190.9 ms** | 183.5 ms | 7.3 ms | 3.8% | 1.00x | 1 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **0.9 ms** | 0.5 ms | 1.2 ms | 86.4% ⚠ | 1.00x | 1 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Vize LSP (Node shim) | ok | **1.8 ms** | 1.7 ms | 0.1 ms | 3.1% | 1.92x | 1 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Volar (TNB / tsgo tsdk) | ok | **8.8 ms** | 8.6 ms | 0.3 ms | 3.3% | 9.43x | 1 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 183.5 ms, 190.9 ms, 198.1 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.5 ms, 2.8 ms, 0.9 ms
- **Vize LSP (Node shim)**: 1.8 ms, 1.7 ms, 1.8 ms
- **Volar (TNB / tsgo tsdk)**: 8.6 ms, 8.8 ms, 9.2 ms

</details>

#### Definition: imported fn (script)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **6.8 ms** | 6.8 ms | 0.0 ms | 0.7% | 1.00x | 1 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **0.4 ms** | 0.3 ms | 0.1 ms | 16.6% ⚠ | 1.00x | 1 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **36.1 ms** | 23.4 ms | 8.1 ms | 24.7% ⚠ | 87.58x | 1 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (1.6 ms) | (1.6 ms) | n/a | n/a | not ranked | (1) | n/a | ⚠ FAILED VALIDATION — definition stayed inside Parent.vue — never crossed into helpers.ts \| Sample: "parent.vue@8:9" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 6.8 ms, 6.8 ms, 6.8 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.3 ms, 0.4 ms, 0.4 ms
- **Volar (TNB / tsgo tsdk)**: 23.4 ms, 36.1 ms, 38.4 ms
- **Vize LSP (Node shim)**: 5.2 ms, 1.6 ms, 1.6 ms

</details>

#### Type definition: typed binding

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **16.1 ms** | 15.9 ms | 5.0 ms | 26.6% ⚠ | 1.00x | 1 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **6.7 ms** | 5.6 ms | 3.2 ms | 39.8% ⚠ | 1.00x | 1 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ok | **23.4 ms** | 20.2 ms | 6.8 ms | 26.6% ⚠ | 3.47x | 1 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Vize LSP (Node shim) | ⚠ failed validation | (0.3 ms) | (0.3 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — every provider rejected textDocument/typeDefinition: {"code":-32601,"message":"Method not found"} \| Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 24.7 ms, 15.9 ms, 16.1 ms
- **Volar (TNB / tsgo tsdk)**: 5.6 ms, 11.5 ms, 6.7 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 33.3 ms, 20.2 ms, 23.4 ms
- **Vize LSP (Node shim)**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### References: prop -> parent template

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **117.1 ms** | 113.3 ms | 4.2 ms | 3.6% | 1.00x | 4 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **338.8 ms** | 338.1 ms | 2.0 ms | 0.6% | 1.00x | 4 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (1.4 ms) | (1.0 ms) | n/a | n/a | not ranked | (3) | n/a | ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue \| Sample: "childcard.vue@2:11 childcard.vue@12:2 childcard.vue@16:38" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (97.9 ms) | (79.8 ms) | n/a | n/a | not ranked | (3) | n/a | ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue \| Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 113.3 ms, 121.7 ms, 117.1 ms
- **Volar (TNB / tsgo tsdk)**: 341.8 ms, 338.1 ms, 338.8 ms
- **Vize LSP (Node shim)**: 1.4 ms, 1.5 ms, 1.0 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 97.9 ms, 79.8 ms, 110.4 ms

</details>

#### Prepare rename: prop

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **5.1 ms** | 5.1 ms | 0.3 ms | 5.1% | 1.00x | n/a | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **0.4 ms** | 0.3 ms | 0.0 ms | 12.6% ⚠ | 1.00x | n/a | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Volar (TNB / tsgo tsdk) | ok | **6.1 ms** | 6.0 ms | 0.5 ms | 7.4% | 16.67x | n/a | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.4 ms) | (0.3 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position \| Sample: "null" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 5.6 ms, 5.1 ms, 5.1 ms
- **Vize LSP (Node shim)**: 0.4 ms, 0.4 ms, 0.3 ms
- **Volar (TNB / tsgo tsdk)**: 6.1 ms, 6.9 ms, 6.0 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.7 ms, 0.3 ms, 0.4 ms

</details>

#### Rename prop (cross-file edit)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **3.1 ms** | 3.0 ms | 0.1 ms | 3.5% | 1.00x | 4 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **4.3 ms** | 3.9 ms | 0.3 ms | 6.8% | 1.00x | 4 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.4 ms) | (0.3 ms) | n/a | n/a | not ranked | (3) | n/a | ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind \| Sample: "childcard.vue:3 :: []" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (1.4 ms) | (1.3 ms) | n/a | n/a | not ranked | (3) | n/a | ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind \| Sample: "childcard.vue:3 :: []" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 3.2 ms, 3.1 ms, 3.0 ms
- **Volar (TNB / tsgo tsdk)**: 4.5 ms, 4.3 ms, 3.9 ms
- **Vize LSP (Node shim)**: 0.4 ms, 2.8 ms, 0.3 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 1.4 ms, 1.3 ms, 1.4 ms

</details>

#### Code action at diagnostic

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **33.7 ms** | 32.1 ms | 2.7 ms | 7.8% | 1.00x | 2 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **75.7 ms** | 71.8 ms | 14.5 ms | 17.7% ⚠ | 1.00x | 2 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.6 ms) | (0.5 ms) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic \| Sample: "null" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.6 ms) | (0.5 ms) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic \| Sample: "null" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 37.4 ms, 32.1 ms, 33.7 ms
- **Volar (TNB / tsgo tsdk)**: 98.7 ms, 75.7 ms, 71.8 ms
- **Vize LSP (Node shim)**: 2.8 ms, 0.6 ms, 0.5 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.6 ms, 0.8 ms, 0.5 ms

</details>

#### Signature help after `(`

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **15.4 ms** | 15.3 ms | 0.1 ms | 0.9% | 1.00x | 1 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **30.6 ms** | 30.3 ms | 0.2 ms | 0.6% | 1.00x | 1 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (221.7 ms) | (219.2 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — every provider rejected textDocument/signatureHelp: {"code":-32601,"message":"Method not found"} \| Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (5.3 ms) | (5.2 ms) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — signatureHelp returned no signatures \| Sample: "null" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 15.4 ms, 15.6 ms, 15.3 ms
- **Volar (TNB / tsgo tsdk)**: 30.6 ms, 30.3 ms, 30.6 ms
- **Vize LSP (Node shim)**: 244.5 ms, 219.2 ms, 221.7 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 5.8 ms, 5.2 ms, 5.3 ms

</details>

#### Format unformatted SFC

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **61.8 ms** | 59.5 ms | 1.4 ms | 2.3% | 1.00x | 1 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **0.6 ms** | 0.6 ms | 0.3 ms | 35.6% ⚠ | 1.00x | 1 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Volar (TNB / tsgo tsdk) | ok | **60.0 ms** | 59.6 ms | 2.2 ms | 3.7% | 97.51x | 1 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.2 ms) | (0.2 ms) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document \| Sample: "null" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 59.5 ms, 61.8 ms, 62.0 ms
- **Vize LSP (Node shim)**: 0.6 ms, 1.1 ms, 0.6 ms
- **Volar (TNB / tsgo tsdk)**: 59.6 ms, 63.7 ms, 60.0 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.2 ms, 0.3 ms, 0.2 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows are split by the TypeScript ENGINE behind the server and ranked only within one engine — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so ranking them together would measure TypeScript's Go rewrite rather than the server. Same axis, same reason, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · smoke

Files: **1** · Bytes: **0**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Hover (script setup)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **1.10 s** | 1.09 s | 10.9 ms | 1.0% | 1.00x | 90 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **248.6 ms** | 238.2 ms | 6.1 ms | 2.5% | 1.00x | 89 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **1.11 s** | 1.09 s | 16.5 ms | 1.5% | 4.45x | 90 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (217.1 ms) | (212.6 ms) | n/a | n/a | not ranked | (458) | n/a | ⚠ FAILED VALIDATION — unranked because the paired probe failed (hover-template) — a hover that is right in one context and wrong in the other is not a comparable measurement \| Sample: "**marker**\n\n_Script binding_\n\n```typescript\nmarker: Ref<string>\n```\n\nReactive reference created with `ref()`. Access `.value` in script, auto-unwrapped in templ" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 1.10 s, 1.09 s, 1.11 s
- **Verter LSP (npm 0.0.1-beta.3)**: 238.2 ms, 248.8 ms, 248.6 ms
- **Volar (TNB / tsgo tsdk)**: 1.11 s, 1.09 s, 1.12 s
- **Vize LSP (Node shim)**: 212.6 ms, 218.9 ms, 217.1 ms

</details>

#### Hover (template interpolation)

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **195.1 ms** | 194.7 ms | 0.6 ms | 0.3% | 1.00x | 43 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **1.1 ms** | 1.0 ms | 0.1 ms | 9.2% | 1.00x | 74 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **10.8 ms** | 10.4 ms | 1.1 ms | 10.2% ⚠ | 10.17x | 43 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.8 ms) | (0.7 ms) | n/a | n/a | not ranked | (344) | n/a | ⚠ FAILED VALIDATION — returned Ref<...> — script type leaked into template context \| Sample: "**marker**\n\n_Template binding from script_\n\n```typescript\nmarker: Ref<string>\n```\n\nReactive reference created with `ref()`. Access `.value` in script, auto-unwr" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 195.9 ms, 194.7 ms, 195.1 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 1.2 ms, 1.1 ms, 1.0 ms
- **Volar (TNB / tsgo tsdk)**: 10.8 ms, 10.4 ms, 12.6 ms
- **Vize LSP (Node shim)**: 0.7 ms, 0.8 ms, 0.8 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows are split by the TypeScript ENGINE behind the server and ranked only within one engine — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so ranking them together would measure TypeScript's Go rewrite rather than the server. Same axis, same reason, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Typing loop (composite)

Files: **1** · Bytes: **0**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **432.6 ms** | 432.6 ms | n/a | n/a | 1.00x | n/a | n/a | all components verified · edit → diagnostic=375ms · hover after edit=52ms · completion=5ms |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **432.5 ms** | 432.5 ms | n/a | n/a | 1.00x | n/a | n/a | all components verified · edit → diagnostic=394ms · hover after edit=36ms · completion=3ms |
| Verter LSP (npm 0.0.1-beta.3) | ok | **536.9 ms** | 536.9 ms | n/a | n/a | 1.24x | n/a | n/a | all components verified · edit → diagnostic=484ms · hover after edit=52ms · completion=1ms |
| Vize LSP (Node shim) | ⚠ failed validation | (283.0 ms) | (283.0 ms) | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — 1 of 3 components failed their gate (completion); the sum is shown for reference only. edit → diagnostic=150ms · hover after edit=132ms · completion=0ms ✗ |

<details><summary>Methodology</summary>

- Sum of three medians: edit-loop/diagnostics-error + edit-loop/hover-after-edit + completion/completion-script-member.
- Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.
- A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.
- Servers that failed a component are shown in brackets with the failing part named.
- Composites are split by TypeScript engine and ranked only within one, exactly as the per-operation tables are — the same Vue layer on a JS engine and on tsgo would otherwise be compared as if they were different servers.

Raw runs:


</details>

#### Ubuntu/Linux · ide ops

<!-- source: ide-scale-Linux.md -->

## IDE operation results

- **Generated:** 2026-07-27T17:27:59.790Z
- **Runner:** linux/x64 · Node v22.23.1
- **Runs / warmups:** 1 / 1

### IDE · scale

Files: **1** · Bytes: **0**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

#### Time-to-usable @20 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **1.95 s** | 1.95 s | n/a | n/a | 1.00x | 21 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **234.2 ms** | 234.2 ms | n/a | n/a | 1.00x | 21 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **1.88 s** | 1.88 s | n/a | n/a | 8.02x | 21 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (30.06 s) | (30.06 s) | n/a | n/a | not ranked | (21) | n/a | ⚠ FAILED VALIDATION — no correct hover within 30000 ms (197 attempts): scaleProbeTally is not a number — sharedCount() from ./shared did not resolve, so this type was guessed, not computed \| Sample: "**scaleProbeTally**\n\n_Script binding_\n\n```typescript\nscaleProbeTally: Ref<string>\n```\n\nReactive reference created with `ref()`. Access `.value` in script, auto-" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 1.95 s
- **Verter LSP (npm 0.0.1-beta.3)**: 234.2 ms
- **Volar (TNB / tsgo tsdk)**: 1.88 s
- **Vize LSP (Node shim)**: 30.06 s

</details>

#### Completion @20 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **209.3 ms** | 209.3 ms | n/a | n/a | 1.00x | 276 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Vize LSP (Node shim) | ok | **1.4 ms** | 1.4 ms | n/a | n/a | 1.00x | 7 | n/a | content verified \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ok | **138.0 ms** | 138.0 ms | n/a | n/a | 101.20x | 7 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **420.3 ms** | 420.3 ms | n/a | n/a | 308.16x | 276 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 209.3 ms
- **Vize LSP (Node shim)**: 1.4 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 138.0 ms
- **Volar (TNB / tsgo tsdk)**: 420.3 ms

</details>

#### References @20 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **453.1 ms** | 453.1 ms | n/a | n/a | 1.00x | 22 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **623.7 ms** | 623.7 ms | n/a | n/a | 1.00x | 22 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.7 ms) | (0.7 ms) | n/a | n/a | not ranked | (1) | n/a | ⚠ FAILED VALIDATION — all 3 references are in a single file — no cross-file search happened \| Sample: "3 refs / 1 files / 0 generated components" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (38.3 ms) | (38.3 ms) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — server answered textDocument/references with null — no reference provider replied \| Sample: "0 refs / 0 files / 0 generated components" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 453.1 ms
- **Volar (TNB / tsgo tsdk)**: 623.7 ms
- **Vize LSP (Node shim)**: 0.7 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 38.3 ms

</details>

#### Hover warm @20 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **1.5 ms** | 1.5 ms | n/a | n/a | 1.00x | 131 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **0.8 ms** | 0.8 ms | n/a | n/a | 1.00x | 130 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **1.3 ms** | 1.3 ms | n/a | n/a | 1.73x | 131 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | (0.7 ms) | (0.7 ms) | n/a | n/a | not ranked | (485) | n/a | ⚠ FAILED VALIDATION — 5/5 repeats failed the gate — scaleProbeTally is not a number — sharedCount() from ./shared did not resolve, so this type was guessed, not computed \| Sample: "**scaleProbeTally**\n\n_Script binding_\n\n```typescript\nscaleProbeTally: Ref<string>\n```\n\nReactive reference created with `ref()`. Access `.value` in script, auto-" \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 1.5 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.8 ms
- **Volar (TNB / tsgo tsdk)**: 1.3 ms
- **Vize LSP (Node shim)**: 0.7 ms

</details>

#### Time-to-usable @100 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **2.16 s** | 2.16 s | n/a | n/a | 1.00x | 101 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **345.6 ms** | 345.6 ms | n/a | n/a | 1.00x | 101 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **2.17 s** | 2.17 s | n/a | n/a | 6.28x | 101 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 100. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 2.16 s
- **Verter LSP (npm 0.0.1-beta.3)**: 345.6 ms
- **Volar (TNB / tsgo tsdk)**: 2.17 s

</details>

#### Completion @100 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **226.1 ms** | 226.1 ms | n/a | n/a | 1.00x | 356 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **135.2 ms** | 135.2 ms | n/a | n/a | 1.00x | 7 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **466.6 ms** | 466.6 ms | n/a | n/a | 3.45x | 356 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 100. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 226.1 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 135.2 ms
- **Volar (TNB / tsgo tsdk)**: 466.6 ms

</details>

#### References @100 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **1.22 s** | 1.22 s | n/a | n/a | 1.00x | 102 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **2.77 s** | 2.77 s | n/a | n/a | 1.00x | 102 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 100. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.6 ms) | (0.6 ms) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — server answered textDocument/references with null — no reference provider replied \| Sample: "0 refs / 0 files / 0 generated components" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 1.22 s
- **Volar (TNB / tsgo tsdk)**: 2.77 s
- **Verter LSP (npm 0.0.1-beta.3)**: 0.6 ms

</details>

#### Hover warm @100 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **1.3 ms** | 1.3 ms | n/a | n/a | 1.00x | 131 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **0.8 ms** | 0.8 ms | n/a | n/a | 1.00x | 130 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **1.4 ms** | 1.4 ms | n/a | n/a | 1.76x | 131 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 100. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 1.3 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 0.8 ms
- **Volar (TNB / tsgo tsdk)**: 1.4 ms

</details>

#### Time-to-usable @500 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **3.09 s** | 3.09 s | n/a | n/a | 1.00x | 501 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **395.4 ms** | 395.4 ms | n/a | n/a | 1.00x | 501 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **3.59 s** | 3.59 s | n/a | n/a | 9.07x | 501 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 500. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 3.09 s
- **Verter LSP (npm 0.0.1-beta.3)**: 395.4 ms
- **Volar (TNB / tsgo tsdk)**: 3.59 s

</details>

#### Completion @500 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **249.0 ms** | 249.0 ms | n/a | n/a | 1.00x | 756 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **137.8 ms** | 137.8 ms | n/a | n/a | 1.00x | 7 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **665.3 ms** | 665.3 ms | n/a | n/a | 4.83x | 756 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 500. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 249.0 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 137.8 ms
- **Volar (TNB / tsgo tsdk)**: 665.3 ms

</details>

#### References @500 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **15.37 s** | 15.37 s | n/a | n/a | 1.00x | 502 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **51.13 s** | 51.13 s | n/a | n/a | 1.00x | 502 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 500. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | (0.7 ms) | (0.7 ms) | n/a | n/a | not ranked | (0) | n/a | ⚠ FAILED VALIDATION — server answered textDocument/references with null — no reference provider replied \| Sample: "0 refs / 0 files / 0 generated components" \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 15.37 s
- **Volar (TNB / tsgo tsdk)**: 51.13 s
- **Verter LSP (npm 0.0.1-beta.3)**: 0.7 ms

</details>

#### Hover warm @500 files

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **1.5 ms** | 1.5 ms | n/a | n/a | 1.00x | 131 | n/a | content verified \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Verter LSP (npm 0.0.1-beta.3) | ok | **1.0 ms** | 1.0 ms | n/a | n/a | 1.00x | 130 | n/a | content verified \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |
| Volar (TNB / tsgo tsdk) | ok | **1.3 ms** | 1.3 ms | n/a | n/a | 1.37x | 131 | n/a | content verified \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — not attempted: the server never became usable on the 20-file corpus, so it cannot become usable on 500. Re-proving that costs the full project-load budget per size, per pass, and yields no new information. \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |

<details><summary>Raw runs</summary>

- **Volar (@vue/language-server)**: 1.5 ms
- **Verter LSP (npm 0.0.1-beta.3)**: 1.0 ms
- **Volar (TNB / tsgo tsdk)**: 1.3 ms

</details>

#### Scale × time-to-usable 20→500

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **n/a** | n/a | n/a | n/a | n/a | 1.58 | n/a | content verified \| scale factor ×1.58 (1952.2 ms → 3089.7 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **n/a** | n/a | n/a | n/a | n/a | 1.91 | n/a | content verified \| scale factor ×1.91 (1878.2 ms → 3587.5 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see usable@20) \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ok | **n/a** | n/a | n/a | n/a | n/a | 1.69 | n/a | content verified \| scale factor ×1.69 (234.2 ms → 395.4 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>


</details>

#### Scale × completion 20→500

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **n/a** | n/a | n/a | n/a | n/a | 1.19 | n/a | content verified \| scale factor ×1.19 (209.3 ms → 249.0 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **n/a** | n/a | n/a | n/a | n/a | 1.58 | n/a | content verified \| scale factor ×1.58 (420.3 ms → 665.3 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — no scale factor: the gate failed at 500 files (see completion@500) \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ok | **n/a** | n/a | n/a | n/a | n/a | 1 | n/a | content verified \| scale factor ×1 (138.0 ms → 137.8 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>


</details>

#### Scale × references 20→500

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **n/a** | n/a | n/a | n/a | n/a | 33.93 | n/a | content verified \| scale factor ×33.93 (453.1 ms → 15372.9 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **n/a** | n/a | n/a | n/a | n/a | 81.98 | n/a | content verified \| scale factor ×81.98 (623.7 ms → 51131.8 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>


</details>

#### Scale × hover warm 20→500

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | ok | **n/a** | n/a | n/a | n/a | n/a | 1 | n/a | content verified \| scale factor ×1 (1.5 ms → 1.5 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: TypeScript 5.9.3 (JS) |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | ok | **n/a** | n/a | n/a | n/a | n/a | 1.01 | n/a | content verified \| scale factor ×1.01 (1.3 ms → 1.3 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2 |
| Vize LSP (Node shim) | ⚠ failed validation | n/a | n/a | n/a | n/a | not ranked | n/a | n/a | ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see hover-warm@20) \| engine: tsgo 7.0.0-dev.20260602.1 (nightly) |
| Verter LSP (npm 0.0.1-beta.3) | ok | **n/a** | n/a | n/a | n/a | n/a | 1.27 | n/a | content verified \| scale factor ×1.27 (0.8 ms → 1.0 ms) — a ratio, not a duration, so the median column is n/a by design \| engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) |

<details><summary>Raw runs</summary>


</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows whose value is a RATIO (`Scale × …`) have no median: the measurement is a factor, not a duration, and it is printed in the artifact column with the pair it came from. A ratio row is never given an invented time so that it can be ranked.
- Rows are split by the TypeScript ENGINE behind the server and ranked only within one engine — Volar (@vue/language-server) = TypeScript 5.9.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so ranking them together would measure TypeScript's Go rewrite rather than the server. Same axis, same reason, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Typing loop (composite)

Files: **1** · Bytes: **0**

Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.

##### TypeScript (JS engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (@vue/language-server) | skipped | n/a | n/a | n/a | n/a | n/a | n/a | n/a | ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server. |

##### tsgo (native engine) · lsp · LSP servers — ranked alone

| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Volar (TNB / tsgo tsdk) | skipped | n/a | n/a | n/a | n/a | n/a | n/a | n/a | ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server. |
| Vize LSP (Node shim) | skipped | n/a | n/a | n/a | n/a | n/a | n/a | n/a | ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server. |
| Verter LSP (npm 0.0.1-beta.3) | skipped | n/a | n/a | n/a | n/a | n/a | n/a | n/a | ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server. |

<details><summary>Methodology</summary>

- Sum of three medians: edit-loop/diagnostics-error + edit-loop/hover-after-edit + completion/completion-script-member.
- Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.
- A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.
- Servers that failed a component are shown in brackets with the failing part named.
- Composites are split by TypeScript engine and ranked only within one, exactly as the per-operation tables are — the same Vue layer on a JS engine and on tsgo would otherwise be compared as if they were different servers.

Raw runs:


</details>

<!-- IDE_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports: [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
