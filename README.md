# Vue Toolchain Benchmarks

Reference-anchored performance and compatibility testing for Vue compilers,
typecheckers, formatters, linters, language servers and bundlers. Measured on one
Linux CI runner per dispatch and committed back here.

This project has two equally important outputs:

1. **Apples-to-apples performance comparisons.** A candidate is timed against
   the official or established reference for the same work. Different targets,
   artifacts, threading modes and cache states are disclosed; materially
   different work is separated or left unranked.
2. **Actionable tooling-gap findings.** Executable gates and confirmation
   plants expose missing transforms, invalid output, skipped files and semantic
   differences. The timing stays visible when useful, but incomplete work
   cannot become a performance win.

The goal is not a leaderboard. It is reproducible evidence about both
performance and compatibility, with Vue and the relevant established toolchain
as the reference point.

This page is the **landing view**: one chart and a compact ranking per main
group. Every group links its full page under [`docs/`](docs/) — all tables,
per-row notes, raw runs, validation plants and the memory probe — generated
from the JSON snapshots in [`results/benchmarks/`](results/benchmarks/) and
[`results/real_world/`](results/real_world/).

<!-- RESULTS_INDEX_START -->

**Results index** — compact charts below; every group links its full page under [`docs/`](docs/):

- **[Compiler](#compiler)** — [docs/compiler.md](docs/compiler.md)
- **[Typecheck](#typecheck)** — [docs/typecheck.md](docs/typecheck.md)
- **[Format](#format)** — [docs/format.md](docs/format.md)
- **[Lint](#lint)** — [docs/lint.md](docs/lint.md)
- **[Component-meta](#component-meta)** — [docs/component-meta.md](docs/component-meta.md)
- **[LSP and IDE operations](#lsp-and-ide-operations)** — [docs/lsp.md](docs/lsp.md)
- **[Real-world projects](#real-world-projects)** — [docs/real-world.md](docs/real-world.md)
- **Memory** — [docs/memory.md](docs/memory.md)
- **Methodology** — [docs/methodology.md](docs/methodology.md) · [docs/how-to-read.md](docs/how-to-read.md)

<!-- RESULTS_INDEX_END -->

## What is compared

<!-- WHAT_IS_COMPARED_START -->

| Group | Measured in the published run |
| --- | --- |
| **[Compiler](docs/compiler.md)** | [`@vue/compiler-sfc`](https://github.com/vuejs/core) · [`@vue/compiler-sfc-36`](https://github.com/vuejs/core) · [`@vizejs/native`](https://github.com/ubugeeei-prod/vize) · [`@fervid/napi`](https://github.com/phoenix-ru/fervid) · [`@verter/native`](https://github.com/pikax/verter) · [`@vue-jsx-vapor/compiler-rs`](https://github.com/vuejs/vue-jsx-vapor) · [`vue-jsx-vapor`](https://github.com/vuejs/vue-jsx-vapor) · [`@vue/babel-plugin-jsx`](https://github.com/vuejs/babel-plugin-jsx) |
| **[Typecheck](docs/typecheck.md)** | [`vue-tsc`](https://github.com/vuejs/language-tools) · [`typescript-native-bridge`](https://github.com/johnsoncodehk/typescript-native-bridge) · [`golar`](https://github.com/auvred/golar) · [`vize`](https://github.com/ubugeeei-prod/vize) · [`verter-tsc`](https://github.com/pikax/verter) |
| **[Format](docs/format.md)** | [`prettier`](https://github.com/prettier/prettier) · [`oxfmt`](https://github.com/oxc-project/oxc) · [`vize`](https://github.com/ubugeeei-prod/vize) · [`@biomejs/biome`](https://github.com/biomejs/biome) |
| **[Lint](docs/lint.md)** | [`eslint-plugin-vue`](https://github.com/vuejs/eslint-plugin-vue) · [`vize`](https://github.com/ubugeeei-prod/vize) · [`@biomejs/biome`](https://github.com/biomejs/biome) · [`oxlint`](https://github.com/oxc-project/oxc) · [`@verter/native`](https://github.com/pikax/verter) |
| **[Component-meta](docs/component-meta.md)** | [`vue-component-meta`](https://github.com/vuejs/language-tools) · [`@verter/component-meta`](https://github.com/pikax/verter) · [`vize`](https://github.com/ubugeeei-prod/vize) |
| **[LSP and IDE operations](docs/lsp.md)** | [`@vue/language-server`](https://github.com/vuejs/language-tools) · [`vize`](https://github.com/ubugeeei-prod/vize) · [`verter-lsp`](https://github.com/pikax/verter) |
| **[Real-world projects](docs/real-world.md)** | 9 pinned checkouts — each project's own test / build / typecheck vs plugin swaps (`unplugin-vue` · `@vizejs/vite-plugin` · `@verter/unplugin`); bundle / HMR across [`@vitejs/plugin-vue`](https://github.com/vitejs/vite-plugin-vue) · [`unplugin-vue`](https://github.com/unplugin/unplugin-vue) · [`@vizejs/vite-plugin`](https://github.com/ubugeeei-prod/vize) · [`@verter/unplugin`](https://github.com/pikax/verter) · `vue-loader` · [`@vizejs/rspack-plugin`](https://github.com/ubugeeei-prod/vize) |
| **[Memory](docs/memory.md)** | same tools, isolated resource probe — plus the **Peak RSS** column on every timing table |

<!-- WHAT_IS_COMPARED_END -->

## How to read

Median of measured runs; Compiler and Component-meta show a separately sampled
**Fresh child** column plus primary **Warm**; IDE operations show **Cold** and
**Warm**. **⚠** failed a
validation gate (shown, unranked) · **❌** error · **⏭** skipped. Each timing
table carries a **Peak RSS** column instead of a separate memory chart.
Details: [docs/how-to-read.md](docs/how-to-read.md) ·
[docs/methodology.md](docs/methodology.md).

Published numbers are **Linux CI only**; local runs are for comparison on your
own box, never against the published charts.

<!-- RUN_META_START -->

## This run

- **Generated:** 2026-08-19T18:37:25.414Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`94f6696`](https://github.com/pikax/vue-benchmarks/commit/94f6696b1c7b6f54928678126b9831febd70b4ff)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/32287835178

<!-- RUN_META_END -->

## Quick start

```bash
corepack enable && pnpm install   # Node 22+, pnpm 10
pnpm generate                     # fixtures
pnpm bench                        # full local bench (5 runs, 1 warmup)
pnpm confirm                      # validity plants
pnpm docs                         # regenerate README + docs/ from the published results JSON
pnpm docs:local                   # same, but also include your local runs (banner-disclosed)
```

More commands: [docs/methodology.md](docs/methodology.md#quick-start).

## Results

<!-- BENCHMARK_RESULTS_START -->

> Generated 2026-08-20 from the latest published **Linux** JSON snapshot in `results/benchmarks/`. Numbers are reference-only; re-run on your hardware for local relevance.
> Median of measured runs; **Peak RSS** column: memory for the same row (timed session where sampled there, isolated probe otherwise). ⚠ failed a validation gate (bracketed, unranked). How to read: [docs/how-to-read.md](docs/how-to-read.md).

### Compiler

> 📄 **[Full results →](docs/compiler.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

> ⚠ **Local run — not the published Linux CI series** (win32/x64 · **dirty worktree** — not attributable to a single commit). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-compiler-vdom-production-sourcemap-off-raw-sfc-compilatio-1ec7hu9-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="docs/charts/readme-compiler-vdom-production-sourcemap-off-raw-sfc-compilatio-1ec7hu9.svg">
</picture>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| [Vue compiler-sfc 3.5 reference (raw render, 1T)](https://github.com/vuejs/core) | 235.8 ms | **146.1 ms** | 1.00x | – |
| [Vize compileSfcBatchWithResults (raw render)](https://github.com/ubugeeei-prod/vize) ⚠ | (10.5 ms) | (7.4 ms) | not ranked | (21.4 MB) |
| [Verter compileMany (first-admission stateless raw render)](https://github.com/pikax/verter) ⚠ | (44.9 ms) | (36.4 ms) | not ranked | (67.1 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/compiler.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-compiler-vdom-production-sourcemap-off-sfc-compilation-wi-1n1ebc6-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="docs/charts/readme-compiler-vdom-production-sourcemap-off-sfc-compilation-wi-1n1ebc6.svg">
</picture>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| [Vue compiler-sfc 3.5 reference (render + CSS, 1T)](https://github.com/vuejs/core) | 267.2 ms | **171.0 ms** | 1.00x | 103.8 MB |
| [Vize compileSfc loop (full SFC, 1T)](https://github.com/ubugeeei-prod/vize) ⚠ | (39.3 ms) | (47.1 ms) | not ranked | (16.7 MB) |
| [Vize compileSfcBatchWithResults (render + CSS, Rayon batch)](https://github.com/ubugeeei-prod/vize) ⚠ | (11.9 ms) | (9.3 ms) | not ranked | (21.6 MB) |
| [fervid compileSync (1T)](https://github.com/phoenix-ru/fervid) ⚠ | (33.5 ms) | (39.1 ms) | not ranked | (15.9 MB) |
| [fervid compileAsync (4-thread libuv pool)](https://github.com/phoenix-ru/fervid) ⚠ | (12.0 ms) | (13.0 ms) | not ranked | – |
| [Verter compileMany + processStyle (render + CSS)](https://github.com/pikax/verter) ⚠ | (53.0 ms) | (39.0 ms) | not ranked | (68.6 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/compiler.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-compiler-vapor-production-sourcemap-off-raw-sfc-compilati-1uzi4el-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="docs/charts/readme-compiler-vapor-production-sourcemap-off-raw-sfc-compilati-1uzi4el.svg">
</picture>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| [Vue compiler-sfc 3.6 reference (raw render, 1T)](https://github.com/vuejs/core) ⚠ | (392.2 ms) | (270.9 ms) | not ranked | – |
| [Vize compileSfcBatchWithResults (raw render)](https://github.com/ubugeeei-prod/vize) ⚠ | (12.7 ms) | (5.2 ms) | not ranked | (20.9 MB) |
| [Verter compileMany (first-admission stateless raw render)](https://github.com/pikax/verter) ⚠ | (46.7 ms) | (34.5 ms) | not ranked | (65.8 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/compiler.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-compiler-vapor-production-sourcemap-off-sfc-compilation-w-02joyyi-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="docs/charts/readme-compiler-vapor-production-sourcemap-off-sfc-compilation-w-02joyyi.svg">
</picture>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| [Vue compiler-sfc 3.6 reference (render + CSS, 1T)](https://github.com/vuejs/core) ⚠ | (421.8 ms) | (300.2 ms) | not ranked | (114.7 MB) |
| [Vize compileSfc loop (full SFC, 1T)](https://github.com/ubugeeei-prod/vize) ⚠ | (42.9 ms) | (41.3 ms) | not ranked | (15.4 MB) |
| [Vize compileSfcBatchWithResults (render + CSS, Rayon batch)](https://github.com/ubugeeei-prod/vize) ⚠ | (13.9 ms) | (5.8 ms) | not ranked | (20.4 MB) |
| [Verter compileMany + processStyle (render + CSS)](https://github.com/pikax/verter) ⚠ | (50.0 ms) | (43.9 ms) | not ranked | (68.7 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/compiler.md).

Development builds, sourcemap cells, the single-file size ladder and the repeated-input study: [full results](docs/compiler.md).

JSX compile (vue-jsx-vapor vs Babel) is ranked per codegen target on the [Compiler page](docs/compiler.md).

### Typecheck

> 📄 **[Full results →](docs/typecheck.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

> ⚠ **Local run — not the published Linux CI series** (win32/x64 · **dirty worktree** — not attributable to a single commit). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-typecheck-typecheck-dark.svg">
  <img alt="Typecheck" src="docs/charts/readme-typecheck-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [Golar (lint+check)](https://github.com/auvred/golar) | **1.16 s** | 1.00x | – |
| [Golar typecheck](https://github.com/auvred/golar) | **1.17 s** | 1.01x | 384.0 MB |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **1.60 s** | 1.39x | – |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **3.28 s** | 2.84x | 353.9 MB |
| [verter-tsc](https://github.com/pikax/verter) | **3.74 s** | 3.23x | 216.5 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **6.29 s** | 5.44x | 211.6 MB |

> Errors, skips and per-row notes: [full results](docs/typecheck.md).

**Correctness (plant suite, one tsconfig):**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/typecheck-all-wall-dark.svg">
  <img alt="All plants · wall (one tsconfig)" src="docs/charts/typecheck-all-wall.svg">
</picture>

| Tool | **Median** | Avg | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| golar | **687 ms** | 675 ms | 1.00x | **335.5 MB** |
| vize | **1.11 s** | 1.09 s | 1.61x | 82.5 + 364.1 = **446.6 MB** |
| vue-tsc | **1.98 s** | 1.99 s | 2.89x | **345.8 MB** |
| verter-tsc | **2.66 s** | 2.66 s | 3.86x | 353.5 + 445.5 = **799.0 MB** |

Peak RSS is the separate memory pass, split `tool + tsgo/tsc = total` when the checker spawns a TypeScript engine; in-process engines cannot be split.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/typecheck-all-pass-dark.svg">
  <img alt="All plants · pass rate (one tsconfig)" src="docs/charts/typecheck-all-pass.svg">
</picture>

| Tool | **Pass rate** | pass / plants |
| --- | ---: | ---: |
| vue-tsc | **93%** | 139 / 150 |
| golar | **91%** | 137 / 150 |
| verter-tsc | **83%** | 125 / 150 |
| vize | **49%** | 73 / 150 |

An unclaimed capability is a **gap and counts as a fail** — every tool is scored over the same full plant set. Skip is reserved for a missing binary/engine.

### Format

> 📄 **[Full results →](docs/format.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

> ⚠ **Local run — not the published Linux CI series** (win32/x64 · **dirty worktree** — not attributable to a single commit). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-format-format-dark.svg">
  <img alt="Format" src="docs/charts/readme-format-format.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [Vize](https://github.com/ubugeeei-prod/vize) | **356.0 ms** | 1.00x | 68.1 MB |
| [Oxfmt](https://github.com/oxc-project/oxc) | **1.48 s** | 4.15x | 689.9 MB |
| [Prettier](https://github.com/prettier/prettier) | **2.28 s** | 6.41x | 195.6 MB |
| [Biome format](https://github.com/biomejs/biome) ⚠ | (229.8 ms) | not ranked | (97.7 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/format.md).

### Lint

> 📄 **[Full results →](docs/lint.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

> ⚠ **Local run — not the published Linux CI series** (win32/x64 · **dirty worktree** — not attributable to a single commit). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-lint-lint-vue-sfc-lint-fresh-cli-process-dark.svg">
  <img alt="Lint — Vue SFC lint — fresh CLI process" src="docs/charts/readme-lint-lint-vue-sfc-lint-fresh-cli-process.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [eslint-plugin-vue (CLI)](https://github.com/vuejs/eslint-plugin-vue) | **1.94 s** | 1.00x | – |
| [Vize lint (1T)](https://github.com/ubugeeei-prod/vize) ⚠ | (162.8 ms) | not ranked | – |
| [Vize lint (default threads)](https://github.com/ubugeeei-prod/vize) ⚠ | (134.3 ms) | not ranked | (68.5 MB) |
| [Biome lint (1T)](https://github.com/biomejs/biome) ⚠ | (376.9 ms) | not ranked | – |
| [Biome lint (default threads)](https://github.com/biomejs/biome) ⚠ | (227.1 ms) | not ranked | (104.7 MB) |
| [Oxlint (1T)](https://github.com/oxc-project/oxc) ⚠ | (128.7 ms) | not ranked | – |
| [Oxlint (default threads)](https://github.com/oxc-project/oxc) ⚠ | (124.9 ms) | not ranked | (99.4 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/lint.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-lint-lint-vue-sfc-lint-in-process-apis-dark.svg">
  <img alt="Lint — Vue SFC lint — in-process APIs" src="docs/charts/readme-lint-lint-vue-sfc-lint-in-process-apis.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [eslint-plugin-vue (1T)](https://github.com/vuejs/eslint-plugin-vue) | **1.22 s** | 1.00x | 213.8 MB |
| [eslint-plugin-vue (32 workers)](https://github.com/vuejs/eslint-plugin-vue) | **5.53 s** | 4.53x | – |
| [Verter host lint](https://github.com/pikax/verter) ⚠ | (163.5 ms) | not ranked | (31.7 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/lint.md).

### Component-meta

> 📄 **[Full results →](docs/component-meta.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

> ⚠ **Local run — not the published Linux CI series** (win32/x64 · **dirty worktree** — not attributable to a single commit). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-component-meta-component-meta-component-public-api-metadata-dark.svg">
  <img alt="Component-meta — Component public-API metadata" src="docs/charts/readme-component-meta-component-meta-component-public-api-metadata.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-component-meta](https://github.com/vuejs/language-tools) | **648.4 ms** | 1.00x | 245.6 MB |
| [@verter/component-meta](https://github.com/pikax/verter) | **694.2 ms** | 1.07x | 33.5 MB |

> Errors, skips and per-row notes: [full results](docs/component-meta.md).

### LSP and IDE operations

> 📄 **[Full results →](docs/lsp.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

> ⚠ **Local run — not the published Linux CI series** (win32/x64 · **dirty worktree** — not attributable to a single commit). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-lsp-lsp-dark.svg">
  <img alt="LSP (editor language server)" src="docs/charts/readme-lsp-lsp.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [Verter](https://github.com/pikax/verter) | **409.4 ms** | 1.00x | 263.7 MB |
| [Volar (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **465.5 ms** | 1.14x | – |
| [Volar (JS)](https://github.com/vuejs/language-tools) | **771.3 ms** | 1.88x | 140.2 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (75.3 ms) | not ranked | (280.0 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/lsp.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-lsp-typing-loop-dark.svg">
  <img alt="IDE typing loop (edit → diagnostic + hover + completion)" src="docs/charts/readme-lsp-typing-loop.svg">
</picture>

| Tool | **Median** | vs fastest |
| --- | ---: | ---: |
| [Volar (JS)](https://github.com/vuejs/language-tools) | **448.1 ms** | 1.00x |
| [Volar (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **466.5 ms** | 1.04x |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (4.01 s) | not ranked |
| [Verter](https://github.com/pikax/verter) ⚠ | (941.5 ms) | not ranked |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/lsp.md).

Per-operation IDE latency (initialize, completion, hover, navigation, edit loop — Cold and Warm) is ranked on the [LSP page](docs/lsp.md).

<!-- BENCHMARK_RESULTS_END -->

## Real-world projects

<!-- REAL_WORLD_RESULTS_START -->

> Auto-updated 2026-08-20 from the **Benchmark (real-world)** workflow — pinned checkouts of third-party Vue projects, each project's **own** test / build / typecheck. Ranked **within** a corpus, never across.

📄 **[Main numbers with charts → docs/real-world.md](docs/real-world.md)** · full per-project reports:

[ant-design-vue](docs/real-world/ant-design-vue.md) · [element-plus](docs/real-world/element-plus.md) · [hoppscotch](docs/real-world/hoppscotch.md) · [naive-ui](docs/real-world/naive-ui.md) · [nuxt-ui](docs/real-world/nuxt-ui.md) · [primevue](docs/real-world/primevue.md) · [quasar](docs/real-world/quasar.md) · [vue-vben-admin](docs/real-world/vue-vben-admin.md) · [vuetify](docs/real-world/vuetify.md)

<!-- REAL_WORLD_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports: [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
