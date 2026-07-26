# Vue Toolchain Benchmarks

Throughput measurements for **Vue SFC compilers**, **typecheckers**, **formatters**, **linters**, **component-meta**, and **LSP** tools.

Layout and CI pattern are similar to [rolldown/benchmarks](https://github.com/rolldown/benchmarks).

**Requirements:** Node.js 22+, pnpm 10 (`corepack enable`).

| Rule of thumb        | Detail                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Sort                 | Tables sort by measured time                                                                          |
| Surfaces             | Independent — do not compare compile ms to typecheck/lint/format ms                                   |
| Missing tools        | Reported as `skipped` (missing API/binary); not replaced with another job                             |
| Cold / warm          | Both reported when `runs > 1`; CI also has separate cold / warm-os / warm jobs                        |
| Compile corpus       | Primary: unique file contents (`fixtures/N`). `fixtures/N-repeated` is a content-hash cache demo only |
| Diagnostics / format | Not required to match across tools; throughput only unless using the confirmation suite               |
| Threading            | Classes (`1t` / `batch` / `max` / `workers` / `lsp`) ranked in **separate** tables                    |
| Ranking              | Primary sort is **cold** (first measured run); warm median is secondary                               |
| Work gates           | Typecheck/lint tools that miss a planted bug are **unranked** (skipped)                               |

## What is compared

### Compilers — SFC (`.vue` parse + script + template)

Compile is a **matrix**, not one table:

| Target    | Environments            | Meaning                                      |
| --------- | ----------------------- | -------------------------------------------- |
| **VDOM**  | production, development | Classic Virtual DOM render functions         |
| **Vapor** | production, development | Direct DOM codegen (different compiler path) |

| Tool               | Package                 | VDOM | Vapor                              | Prod / Dev knobs                                       |
| ------------------ | ----------------------- | ---- | ---------------------------------- | ------------------------------------------------------ |
| Vue Official 3.5.x | `@vue/compiler-sfc`     | yes  | **no** (skipped — no Vapor path)   | `isProd`                                               |
| Vue Official 3.6.x | `@vue/compiler-sfc@3.6` | yes  | yes (`vapor: true` / vapor script) | `isProd`                                               |
| Vize               | `@vizejs/native`        | yes  | yes (`vapor`)                      | `sourceMap` off/on (no `isProduction` on `compileSfc`) |
| Verter             | `@verter/native`        | yes  | yes (`forceVapor`)                 | `isProduction` + `sourceMap` + `hmrStrategy`           |

**Threading:** Vue official compiler is **1T only** (worker_threads variants removed). Vize/Verter batch/max pools are labeled and ranked in separate tables.

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

| Tool    | Package                | Command / API                                 |
| ------- | ---------------------- | --------------------------------------------- |
| Vue TSC | `vue-tsc`              | `vue-tsc --noEmit -p tsconfig.json`           |
| Golar   | `golar` + `@golar/vue` | `golar typecheck` (+ default mode separately) |
| Vize    | `vize`                 | `vize check . --tsconfig …`                   |
| Verter  | `verter-tsc`           | `verter-tsc --noEmit -p tsconfig.json` (needs stable **tsgo** / `typescript@7.0.x`) |

Default typecheck file limit is **200** (or smaller if the fixture is smaller) — typecheck cost scales steeply vs pure compile.

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

| Tool              | Package                        | Notes                                    |
| ----------------- | ------------------------------ | ---------------------------------------- |
| eslint-plugin-vue | `eslint` + `eslint-plugin-vue` | 1T + worker fan-out                      |
| Vize              | `vize lint`                    | 1T (`RAYON_NUM_THREADS=1`) + max threads |
| Verter            | `@verter/native`               | `VerterHost.lint` when available         |

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

| Role                               | Status                                    |
| ---------------------------------- | ----------------------------------------- |
| LSP table row                      | No — not a language server                |
| `vue-tsc` / Volar-tsdk engine swap | Possible as a separate labeled experiment |
| Compared as Vue LSP                | No — different product surface            |

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

## Cold vs warm

CI runs these as **separate jobs** (fresh runners), after a shared **build** job that installs binaries and generates fixtures once per OS:

| Pass        | Job       | How we run it                                      | What it approximates                                    |
| ----------- | --------- | -------------------------------------------------- | ------------------------------------------------------- |
| **cold**    | `cold`    | `--runs 1 --warmups 0`                             | First measured tool touch after restore (singular pass) |
| **warm-os** | `warm-os` | 1 discarded full pass, then `--runs N --warmups 0` | OS page cache warm; process still “cold” each run       |
| **warm**    | `warm`    | `--runs N --warmups W` (default 5 / 1)             | Process warmups + multi-run median (steady-state-ish)   |

Local scripts:

```bash
pnpm bench:cold      # singular pass
pnpm bench:warm-os   # 1 discard + 3 measured (warmups 0)
pnpm bench:warm      # process warmups + multi-run
```

Within a multi-run JSON report we still also report:

| Term                 | Meaning                                           |
| -------------------- | ------------------------------------------------- |
| **Warmup**           | Discarded run(s) before measurement (`--warmups`) |
| **Cold** (in-report) | First **measured** run in that process            |
| **Warm median**      | Median of remaining measured runs                 |
| **Overall median**   | Median of all measured runs                       |

Limits:

- We do **not** drop OS page cache on GitHub-hosted runners (no root `drop_caches`).
- Artifact restore / install still touch disk before the cold job’s first measure — a dedicated machine can get a colder first touch.
- After the first tool touches fixtures/`node_modules`, later tools in the **same** job may share a warmer OS file cache.
- CLI tools still pay process startup each run; in-process NAPI tools amortize startup across iterations.

## CI layout

| Workflow                                          | When                                              | What                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **PR** (`.github/workflows/pr.yml`)               | pull_request                                      | **Smoke only**: build → `pnpm confirm` + tiny `fixtures/20` throughput pass. **No** full bench, **no** README rewrite.            |
| **Benchmark** (`.github/workflows/benchmark.yml`) | `main` push, weekly schedule, `workflow_dispatch` | build → **cold** / **warm-os** / **warm** (OS matrix) + **memory** (Linux only) → update `README.md` + [`MEMORY.md`](./MEMORY.md) |
| **E2E VS Code**                                   | manual / weekly                                   | Heavy extension-host path (optional)                                                                                              |

Doc updates follow the [rolldown/benchmarks](https://github.com/rolldown/benchmarks) pattern:

1. Measure on the OS matrix; upload `results/*` artifacts (memory is Linux-only).
2. On `main` only, a final job downloads artifacts, runs `scripts/update-readme.mjs` and `scripts/update-memory-readme.mjs`, and **auto-commits** `README.md` + `MEMORY.md` with `[skip ci]`.

PRs never rewrite docs from partial smoke data.

Published resource numbers: **[MEMORY.md](./MEMORY.md)**.

## Methodology

1. Generate unique-content `.vue` SFCs (`scripts/generate.mjs` — diverse templates + uniquify) **once** in the build job.
2. For each surface, run every available tool on the **same** corpus; **alternate tool order** each measured iteration.
3. Record cold / warm-OS / warm passes as separate CI artifacts (and in-report cold/warm medians when `runs > 1`).
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

# Cold / warm-OS / warm (mirrors CI pass jobs)
pnpm bench:cold
pnpm bench:warm-os
pnpm bench:warm

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
  pr.yml                    # PR smoke
  benchmark.yml             # cold / warm-os / warm + README
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

- Compare rows from the same OS.
- Compare compiler rows within the same thread class (`1t` vs `1t`, etc.).
- `golar typecheck` is pure typecheck; bare `golar` also runs lint.
- `skipped` / `error` rows are not ranked.
- Numbers from other corpora, hardware, or scripts are a different experiment.
- Memory min/max/avg are tool-attributed (see table above); do not mix with wall-clock tables.

## Reference results

<!-- BENCHMARK_RESULTS_START -->

_No benchmark artifacts found yet. Run CI or `pnpm bench` locally._

<!-- BENCHMARK_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports: [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
