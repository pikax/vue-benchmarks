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
| **[Compiler](docs/compiler.md)** | [`@vue/compiler-sfc`](https://github.com/vuejs/core) · [`@vue/compiler-sfc-36`](https://github.com/vuejs/core) · [`@vizejs/native`](https://github.com/ubugeeei-prod/vize) · [`@fervid/napi`](https://github.com/phoenix-ru/fervid) · [`@verter/native`](https://github.com/pikax/verter) · `@vue-jsx-vapor/compiler-rs` · `vue-jsx-vapor` · `@vue/babel-plugin-jsx` |
| **[Typecheck](docs/typecheck.md)** | [`vue-tsc`](https://github.com/vuejs/language-tools) · [`typescript-native-bridge`](https://github.com/johnsoncodehk/typescript-native-bridge) · [`golar`](https://github.com/auvred/golar) · [`vize`](https://github.com/ubugeeei-prod/vize) · [`verter-tsc`](https://github.com/pikax/verter) |
| **[Format](docs/format.md)** | [`prettier`](https://github.com/prettier/prettier) · [`oxfmt`](https://github.com/oxc-project/oxc) · [`vize`](https://github.com/ubugeeei-prod/vize) · [`@biomejs/biome`](https://github.com/biomejs/biome) |
| **[Lint](docs/lint.md)** | [`eslint-plugin-vue`](https://github.com/vuejs/eslint-plugin-vue) · [`vize`](https://github.com/ubugeeei-prod/vize) · [`@biomejs/biome`](https://github.com/biomejs/biome) · [`oxlint`](https://github.com/oxc-project/oxc) · [`@verter/native`](https://github.com/pikax/verter) |
| **[Component-meta](docs/component-meta.md)** | [`vue-component-meta`](https://github.com/vuejs/language-tools) · [`@verter/component-meta`](https://github.com/pikax/verter) · [`vize`](https://github.com/ubugeeei-prod/vize) |
| **[LSP and IDE operations](docs/lsp.md)** | [`@vue/language-server`](https://github.com/vuejs/language-tools) · [`vize`](https://github.com/ubugeeei-prod/vize) · [`verter-lsp`](https://github.com/pikax/verter) |
| **[Real-world projects](docs/real-world.md)** | 9 pinned checkouts — each project's own test / build / typecheck vs plugin swaps (`unplugin-vue` · `@vizejs/vite-plugin` · `@verter/unplugin`); bundle / HMR across `@vitejs/plugin-vue` · `unplugin-vue` · `@vizejs/vite-plugin` · `@verter/unplugin` · `vue-loader` · `@vizejs/rspack-plugin` |
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

- **Generated:** 2026-08-27T10:24:48.274Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz · 15.6 GB · Node v22.23.2
- **Commit:** [`abafafd`](https://github.com/pikax/vue-benchmarks/commit/abafafd07c14f26c07f1d0ed9da818102fdc97e1)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/33062210774

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

> Generated 2026-08-27 from the latest published **Linux** JSON snapshot in `results/benchmarks/`. Numbers are reference-only; re-run on your hardware for local relevance.
> Median of measured runs; **Peak RSS** column: memory for the same row (timed session where sampled there, isolated probe otherwise). ⚠ failed a validation gate (bracketed, unranked). How to read: [docs/how-to-read.md](docs/how-to-read.md).

### Compiler

> 📄 **[Full results →](docs/compiler.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-compiler-vdom-production-sourcemap-off-raw-sfc-compilatio-1ec7hu9-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="docs/charts/readme-compiler-vdom-production-sourcemap-off-raw-sfc-compilatio-1ec7hu9.svg">
</picture>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| [Vue compiler-sfc 3.5 reference (raw render, 1T)](https://github.com/vuejs/core) | 493.0 ms | **238.5 ms** | 1.00x | – |
| [Vize compileSfcBatchWithResults (raw render)](https://github.com/ubugeeei-prod/vize) ⚠ | (23.6 ms) | (22.2 ms) | not ranked | (17.4 MB) |
| [Verter compileMany (first-admission stateless raw render)](https://github.com/pikax/verter) ⚠ | (120.5 ms) | (116.5 ms) | not ranked | (35.7 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/compiler.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-compiler-vdom-production-sourcemap-off-sfc-compilation-wi-1n1ebc6-dark.svg">
  <img alt="Compiler — VDOM · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="docs/charts/readme-compiler-vdom-production-sourcemap-off-sfc-compilation-wi-1n1ebc6.svg">
</picture>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| [Vue compiler-sfc 3.5 reference (render + CSS, 1T)](https://github.com/vuejs/core) | 561.1 ms | **295.0 ms** | 1.00x | 66.9 MB |
| [Vize compileSfc loop (full SFC, 1T)](https://github.com/ubugeeei-prod/vize) ⚠ | (63.1 ms) | (62.5 ms) | not ranked | (15.7 MB) |
| [Vize compileSfcBatchWithResults (render + CSS, Rayon batch)](https://github.com/ubugeeei-prod/vize) ⚠ | (24.6 ms) | (23.3 ms) | not ranked | (17.6 MB) |
| [fervid compileSync (1T)](https://github.com/phoenix-ru/fervid) ⚠ | (54.5 ms) | (52.5 ms) | not ranked | (15.9 MB) |
| [fervid compileAsync (4-thread libuv pool)](https://github.com/phoenix-ru/fervid) ⚠ | (25.3 ms) | (26.0 ms) | not ranked | – |
| [Verter compileMany + processStyle (render + CSS)](https://github.com/pikax/verter) ⚠ | (127.7 ms) | (123.7 ms) | not ranked | (38.0 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/compiler.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-compiler-vapor-production-sourcemap-off-raw-sfc-compilati-1uzi4el-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — Raw SFC compilation — identical changed inputs; no output-cache reuse" src="docs/charts/readme-compiler-vapor-production-sourcemap-off-raw-sfc-compilati-1uzi4el.svg">
</picture>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| [Vue compiler-sfc 3.6 reference (raw render, 1T)](https://github.com/vuejs/core) ⚠ | (807.1 ms) | (405.5 ms) | not ranked | – |
| [Vize compileSfcBatchWithResults (raw render)](https://github.com/ubugeeei-prod/vize) ⚠ | (23.7 ms) | (23.3 ms) | not ranked | (18.1 MB) |
| [Verter compileMany (first-admission stateless raw render)](https://github.com/pikax/verter) ⚠ | (120.5 ms) | (125.1 ms) | not ranked | (35.9 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/compiler.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-compiler-vapor-production-sourcemap-off-sfc-compilation-w-02joyyi-dark.svg">
  <img alt="Compiler — VAPOR · production · sourcemap off — SFC compilation with CSS — script, template and style changed" src="docs/charts/readme-compiler-vapor-production-sourcemap-off-sfc-compilation-w-02joyyi.svg">
</picture>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| [Vue compiler-sfc 3.6 reference (render + CSS, 1T)](https://github.com/vuejs/core) ⚠ | (898.0 ms) | (484.7 ms) | not ranked | (78.0 MB) |
| [Vize compileSfc loop (full SFC, 1T)](https://github.com/ubugeeei-prod/vize) ⚠ | (64.2 ms) | (64.1 ms) | not ranked | (15.7 MB) |
| [Vize compileSfcBatchWithResults (render + CSS, Rayon batch)](https://github.com/ubugeeei-prod/vize) ⚠ | (25.7 ms) | (25.1 ms) | not ranked | (18.5 MB) |
| [Verter compileMany + processStyle (render + CSS)](https://github.com/pikax/verter) ⚠ | (128.6 ms) | (128.4 ms) | not ranked | (38.4 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/compiler.md).

Development builds, sourcemap cells, the single-file size ladder and the repeated-input study: [full results](docs/compiler.md).

JSX compile (vue-jsx-vapor vs Babel) is ranked per codegen target on the [Compiler page](docs/compiler.md).

### Typecheck

> 📄 **[Full results →](docs/typecheck.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-typecheck-typecheck-dark.svg">
  <img alt="Typecheck" src="docs/charts/readme-typecheck-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [Vize](https://github.com/ubugeeei-prod/vize) | **1.04 s** | 1.00x | 213.4 MB |
| [verter-tsc](https://github.com/pikax/verter) | **1.09 s** | 1.05x | 217.3 MB |
| [Golar (lint+check)](https://github.com/auvred/golar) | **1.57 s** | 1.51x | – |
| [Golar typecheck](https://github.com/auvred/golar) | **1.58 s** | 1.52x | 379.7 MB |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **2.29 s** | 2.21x | – |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **4.86 s** | 4.68x | 351.8 MB |

> Errors, skips and per-row notes: [full results](docs/typecheck.md).

**Correctness (plant suite, one tsconfig):**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/typecheck-all-wall-dark.svg">
  <img alt="All plants · wall (one tsconfig)" src="docs/charts/typecheck-all-wall.svg">
</picture>

| Tool | **Median** | Avg | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| verter-tsc | **762 ms** | 767 ms | 1.00x | 84.7 + 149.8 = **234.5 MB** |
| vize | **832 ms** | 827 ms | 1.09x | 72.9 + 413.0 = **485.8 MB** |
| golar | **950 ms** | 943 ms | 1.25x | **356.9 MB** |
| vue-tsc | **3.30 s** | 3.36 s | 4.33x | **342.5 MB** |

Peak RSS is the separate memory pass, split `tool + tsgo/tsc = total` when the checker spawns a TypeScript engine; in-process engines cannot be split.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/typecheck-all-pass-dark.svg">
  <img alt="All plants · pass rate (one tsconfig)" src="docs/charts/typecheck-all-pass.svg">
</picture>

| Tool | **Pass rate** | pass / plants | ⚠ needed opt-in |
| --- | ---: | ---: | ---: |
| vize | **99%** | 148 / 150 | – |
| vue-tsc | **95%** | 143 / 150 | 5 |
| golar | **94%** | 141 / 150 | 5 |
| verter-tsc | **81%** | 121 / 150 | – |

An unclaimed capability is a **gap and counts as a fail** — every tool is scored over the same full plant set, on what it actually reported. Skip is reserved for a missing binary/engine. **⚠ needed opt-in** counts the inheritAttrs/root-shape plants a tool only scored with `vueCompilerOptions.fallthroughAttributes`: not a pass, and still in the denominator.

### Format

> 📄 **[Full results →](docs/format.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-format-format-dark.svg">
  <img alt="Format" src="docs/charts/readme-format-format.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [Vize](https://github.com/ubugeeei-prod/vize) | **99.2 ms** | 1.00x | 67.2 MB |
| [Oxfmt](https://github.com/oxc-project/oxc) | **3.12 s** | 31.42x | 686.1 MB |
| [Prettier](https://github.com/prettier/prettier) | **3.60 s** | 36.26x | 198.0 MB |
| [Biome format](https://github.com/biomejs/biome) ⚠ | (93.6 ms) | not ranked | (96.1 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/format.md).

### Lint

> 📄 **[Full results →](docs/lint.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-lint-lint-vue-sfc-lint-fresh-cli-process-dark.svg">
  <img alt="Lint — Vue SFC lint — fresh CLI process" src="docs/charts/readme-lint-lint-vue-sfc-lint-fresh-cli-process.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [Vize lint (default threads)](https://github.com/ubugeeei-prod/vize) | **66.4 ms** | 1.00x | 68.0 MB |
| [Vize lint (1T)](https://github.com/ubugeeei-prod/vize) | **84.3 ms** | 1.27x | – |
| [eslint-plugin-vue (CLI)](https://github.com/vuejs/eslint-plugin-vue) | **2.99 s** | 45.06x | – |
| [Biome lint (1T)](https://github.com/biomejs/biome) ⚠ | (296.3 ms) | not ranked | – |
| [Biome lint (default threads)](https://github.com/biomejs/biome) ⚠ | (156.6 ms) | not ranked | (102.6 MB) |
| [Oxlint (1T)](https://github.com/oxc-project/oxc) ⚠ | (64.6 ms) | not ranked | – |
| [Oxlint (default threads)](https://github.com/oxc-project/oxc) ⚠ | (61.1 ms) | not ranked | (99.3 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/lint.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-lint-lint-vue-sfc-lint-in-process-apis-dark.svg">
  <img alt="Lint — Vue SFC lint — in-process APIs" src="docs/charts/readme-lint-lint-vue-sfc-lint-in-process-apis.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [eslint-plugin-vue (1T)](https://github.com/vuejs/eslint-plugin-vue) | **1.79 s** | 1.00x | 215.6 MB |
| [eslint-plugin-vue (4 workers)](https://github.com/vuejs/eslint-plugin-vue) | **3.39 s** | 1.89x | – |
| [Verter host lint](https://github.com/pikax/verter) ⚠ | (161.1 ms) | not ranked | (31.8 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/lint.md).

### Component-meta

> 📄 **[Full results →](docs/component-meta.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-component-meta-component-meta-component-public-api-metada-1w86g8z-dark.svg">
  <img alt="Component-meta — Component public-API metadata — concurrent (every request in flight)" src="docs/charts/readme-component-meta-component-meta-component-public-api-metada-1w86g8z.svg">
</picture>

| Tool | Fresh child | **Warm (primary)** | vs fastest |
| --- | ---: | ---: | ---: |
| [vue-component-meta (Promise.all)](https://github.com/vuejs/language-tools) ⚠ | (2.18 s) | (870.6 ms) | not ranked |
| [@verter/component-meta (Promise.all)](https://github.com/pikax/verter) ⚠ | (490.8 ms) | (560.0 ms) | not ranked |
| [@verter/component-meta (getComponentMetaBatch)](https://github.com/pikax/verter) ⚠ | (326.5 ms) | (328.9 ms) | not ranked |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/component-meta.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-component-meta-component-meta-component-public-api-metadata-dark.svg">
  <img alt="Component-meta — Component public-API metadata" src="docs/charts/readme-component-meta-component-meta-component-public-api-metadata.svg">
</picture>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| [vue-component-meta](https://github.com/vuejs/language-tools) ⚠ | (2.17 s) | (911.9 ms) | not ranked | (248.3 MB) |
| [@verter/component-meta](https://github.com/pikax/verter) ⚠ | (498.1 ms) | (554.7 ms) | not ranked | (90.0 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](docs/component-meta.md).

### LSP and IDE operations

> 📄 **[Full results →](docs/lsp.md)** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-lsp-lsp-dark.svg">
  <img alt="LSP (editor language server)" src="docs/charts/readme-lsp-lsp.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [Verter](https://github.com/pikax/verter) | **311.1 ms** | 1.00x | 105.6 + 118.9 = 224.5 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **343.4 ms** | 1.10x | 72.9 + 183.7 = 256.6 MB |
| [Volar (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **380.0 ms** | 1.22x | – |
| [Volar (JS)](https://github.com/vuejs/language-tools) | **1.09 s** | 3.49x | 292.8 + 265.5 = 558.3 MB |

> Errors, skips and per-row notes: [full results](docs/lsp.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/readme-lsp-typing-loop-dark.svg">
  <img alt="IDE typing loop (edit → diagnostic + hover + completion)" src="docs/charts/readme-lsp-typing-loop.svg">
</picture>

| Tool | **Median** | vs fastest |
| --- | ---: | ---: |
| [Vize](https://github.com/ubugeeei-prod/vize) | **94.9 ms** | 1.00x |
| [Volar (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **475.9 ms** | 5.01x |
| [Volar (JS)](https://github.com/vuejs/language-tools) | **488.6 ms** | 5.15x |
| [Verter](https://github.com/pikax/verter) | **616.2 ms** | 6.49x |

> Errors, skips and per-row notes: [full results](docs/lsp.md).

Per-operation IDE latency (initialize, completion, hover, navigation, edit loop — Cold and Warm) is ranked on the [LSP page](docs/lsp.md).

<!-- BENCHMARK_RESULTS_END -->

## Real-world projects

<!-- REAL_WORLD_RESULTS_START -->

> Auto-updated 2026-08-27 from the **Benchmark (real-world)** workflow — pinned checkouts of third-party Vue projects, each project's **own** test / build / typecheck. Ranked **within** a corpus, never across.

📄 **[Main numbers with charts → docs/real-world.md](docs/real-world.md)** · full per-project reports:

[ant-design-vue](docs/real-world/ant-design-vue.md) · [element-plus](docs/real-world/element-plus.md) · [hoppscotch](docs/real-world/hoppscotch.md) · [naive-ui](docs/real-world/naive-ui.md) · [nuxt-ui](docs/real-world/nuxt-ui.md) · [primevue](docs/real-world/primevue.md) · [quasar](docs/real-world/quasar.md) · [vue-vben-admin](docs/real-world/vue-vben-admin.md) · [vuetify](docs/real-world/vuetify.md)

<!-- REAL_WORLD_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports: [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
