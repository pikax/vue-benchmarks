# Real-world project results

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

One page per pinned open-source project; this page carries each project's headline numbers — its **own** test / build / typecheck (plugin swaps included). Everything else (compile, format, lint, bundle, HMR, LSP, per-row notes, raw runs) lives on the project page.

> Corpora are pinned checkouts of third-party open-source Vue projects; sources are unmodified and every page names its ref and resolved commit SHA.
> **Rank within a corpus, never across it.** The corpora differ in size and in kind — library source, application source and documentation demos are not the same code.
> **⚠ unranked** is a gate, not a verdict on the official toolchain. A project shipping **no lockfile** at the pinned ref cannot be installed frozen, so every row on that corpus is unranked equally — including vue-tsc.

## Projects

- [ant-design-vue](real-world/ant-design-vue.md) — **ant-design-vue:demos** — [`vueComponent/ant-design-vue`](https://github.com/vueComponent/ant-design-vue) 4.2.6 @ `4a37016f4e` · 695 files · **no lockfile** (unranked corpus)
- [element-plus](real-world/element-plus.md) — **element-plus:components** — [`element-plus/element-plus`](https://github.com/element-plus/element-plus) 2.14.3 @ `7a7bcfb66b` · 162 files
- [hoppscotch](real-world/hoppscotch.md) — **hoppscotch:common** — [`hoppscotch/hoppscotch`](https://github.com/hoppscotch/hoppscotch) a4395b3e7c… @ `a4395b3e7c` · 293 files
- [naive-ui](real-world/naive-ui.md) — **naive-ui:demos** — [`tusen-ai/naive-ui`](https://github.com/tusen-ai/naive-ui) v2.44.0 @ `a3e05c11db` · 1682 files · **no lockfile** (unranked corpus)
- [nuxt-ui](real-world/nuxt-ui.md) — **nuxt-ui:runtime** — [`nuxt/ui`](https://github.com/nuxt/ui) v4.10.0 @ `ada1580368` · 187 files
- [primevue](real-world/primevue.md) — **primevue:components** — [`primefaces/primevue`](https://github.com/primefaces/primevue) 4.5.3 @ `8600f6a3b2` · 279 files
- [quasar](real-world/quasar.md) — **quasar:playground** — [`quasarframework/quasar`](https://github.com/quasarframework/quasar) quasar-v2.23.3 @ `db082a4407` · 252 files
- [vue-vben-admin](real-world/vue-vben-admin.md) — **vue-vben-admin:core-ui** — [`vbenjs/vue-vben-admin`](https://github.com/vbenjs/vue-vben-admin) v5.7.0 @ `63a38dce49` · 330 files
- [vuetify](real-world/vuetify.md) — **vuetify:docs** — [`vuetifyjs/vuetify`](https://github.com/vuetifyjs/vuetify) v4.1.6 @ `f5d76f8ac4` · 1246 files

## element-plus

> 📄 Full report: [real-world/element-plus.md](real-world/element-plus.md)

### Project test suite — element-plus:components

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-element-plus-project-test-dark.svg">
  <img alt="Project test suite — element-plus:components" src="charts/real-world-element-plus-project-test.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [element-plus — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **116.77 s** | 1.00x | 1668.1 MB |
| element-plus — unplugin-vue | **117.55 s** | 1.01x | 1773.3 MB |
| element-plus — project's own toolchain (baseline) | **117.84 s** | 1.01x | 1723.6 MB |
| [element-plus — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (106.49 s) | not ranked | (3532.0 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/element-plus.md).

### Project typecheck (own tsconfig) — element-plus:components

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-element-plus-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — element-plus:components" src="charts/real-world-element-plus-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **9.96 s** | 1.00x | 2505.1 MB |
| [verter-tsc](https://github.com/pikax/verter) | **9.99 s** | 1.00x | 1259.5 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **22.73 s** | 2.28x | 1919.0 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (16.93 s) | not ranked | (3475.7 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/element-plus.md).

## hoppscotch

> 📄 Full report: [real-world/hoppscotch.md](real-world/hoppscotch.md)

### Project test suite — hoppscotch:common

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-hoppscotch-project-test-dark.svg">
  <img alt="Project test suite — hoppscotch:common" src="charts/real-world-hoppscotch-project-test.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| @hoppscotch/common — project's own toolchain (baseline) | **23.04 s** | 1.00x | 717.2 MB |
| [@hoppscotch/common — @verter/unplugin](https://github.com/pikax/verter) | **23.10 s** | 1.00x | 710.3 MB |
| @hoppscotch/common — unplugin-vue | **23.30 s** | 1.01x | 737.5 MB |
| [@hoppscotch/common — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **23.31 s** | 1.01x | 715.9 MB |

> Errors, skips and per-row notes: [full results](real-world/hoppscotch.md).

### Project build (own config) — hoppscotch:common

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-hoppscotch-project-build-dark.svg">
  <img alt="Project build (own config) — hoppscotch:common" src="charts/real-world-hoppscotch-project-build.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [hoppscotch-agent — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **1.43 s** | 1.00x | 443.6 MB |
| hoppscotch-agent — unplugin-vue | **1.58 s** | 1.10x | 421.0 MB |
| hoppscotch-agent — project's own toolchain (baseline) | **1.60 s** | 1.12x | 440.9 MB |
| [hoppscotch-agent — @verter/unplugin](https://github.com/pikax/verter) | **1.76 s** | 1.23x | 493.8 MB |

> Errors, skips and per-row notes: [full results](real-world/hoppscotch.md).

### Project typecheck (own tsconfig) — hoppscotch:common

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-hoppscotch-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — hoppscotch:common" src="charts/real-world-hoppscotch-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **6.64 s** | 1.00x | 631.2 MB |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) ⚠ | (1.76 s) | not ranked | (460.3 MB) |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (7.81 s) | not ranked | (695.1 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (1.97 s) | not ranked | (472.3 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/hoppscotch.md).

## naive-ui

> 📄 Full report: [real-world/naive-ui.md](real-world/naive-ui.md)

### Project test suite — naive-ui:demos

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-naive-ui-project-test-dark.svg">
  <img alt="Project test suite — naive-ui:demos" src="charts/real-world-naive-ui-project-test.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| naive-ui — project's own toolchain (baseline) ⚠ | (328.87 s) | not ranked | (1656.6 MB) |
| naive-ui — unplugin-vue ⚠ | (331.20 s) | not ranked | (1575.2 MB) |
| [naive-ui — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) ⚠ | (331.28 s) | not ranked | (1656.5 MB) |
| [naive-ui — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (329.89 s) | not ranked | (1622.3 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/naive-ui.md).

### Project typecheck (own tsconfig) — naive-ui:demos

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-naive-ui-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — naive-ui:demos" src="charts/real-world-naive-ui-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) ⚠ | (57.51 s) | not ranked | (2339.8 MB) |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) ⚠ | (48.08 s) | not ranked | (2993.0 MB) |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (89.85 s) | not ranked | (2531.7 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (24.86 s) | not ranked | (4559.3 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/naive-ui.md).

## primevue

> 📄 Full report: [real-world/primevue.md](real-world/primevue.md)

### Project test suite — primevue:components

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-primevue-project-test-dark.svg">
  <img alt="Project test suite — primevue:components" src="charts/real-world-primevue-project-test.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| primevue — unplugin-vue | **37.08 s** | 1.00x | 762.8 MB |
| primevue — project's own toolchain (baseline) | **37.82 s** | 1.02x | 923.9 MB |
| [primevue — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) ⚠ | (27.09 s) | not ranked | (490.4 MB) |
| [primevue — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (39.48 s) | not ranked | (1138.7 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/primevue.md).

### Project typecheck (own tsconfig) — primevue:components

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-primevue-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — primevue:components" src="charts/real-world-primevue-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **15.86 s** | 1.00x | 3704.1 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **28.45 s** | 1.79x | 2327.8 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (28.76 s) | not ranked | (1000.3 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (37.84 s) | not ranked | (4853.1 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/primevue.md).

## quasar

> 📄 Full report: [real-world/quasar.md](real-world/quasar.md)

### Project test suite — quasar:playground

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-quasar-project-test-dark.svg">
  <img alt="Project test suite — quasar:playground" src="charts/real-world-quasar-project-test.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| quasar.dev — project's own toolchain (baseline) | **2.52 s** | 1.00x | 460.8 MB |

> Errors, skips and per-row notes: [full results](real-world/quasar.md).

### Project typecheck (own tsconfig) — quasar:playground

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-quasar-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — quasar:playground" src="charts/real-world-quasar-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **1.31 s** | 1.00x | 725.5 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **1.79 s** | 1.37x | 391.6 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **6.18 s** | 4.73x | 503.4 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (289.3 ms) | not ranked | (145.3 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/quasar.md).

## vue-vben-admin

> 📄 Full report: [real-world/vue-vben-admin.md](real-world/vue-vben-admin.md)

### Project test suite — vue-vben-admin:core-ui

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-vue-vben-admin-project-test-dark.svg">
  <img alt="Project test suite — vue-vben-admin:core-ui" src="charts/real-world-vue-vben-admin-project-test.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| vben-admin-monorepo — project's own toolchain (baseline) | **11.70 s** | 1.00x | 750.5 MB |
| vben-admin-monorepo — unplugin-vue | **11.89 s** | 1.02x | 730.5 MB |
| [vben-admin-monorepo — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **11.92 s** | 1.02x | 749.1 MB |
| [vben-admin-monorepo — @verter/unplugin](https://github.com/pikax/verter) | **12.01 s** | 1.03x | 729.7 MB |

> Errors, skips and per-row notes: [full results](real-world/vue-vben-admin.md).

### Project typecheck (own tsconfig) — vue-vben-admin:core-ui

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-vue-vben-admin-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — vue-vben-admin:core-ui" src="charts/real-world-vue-vben-admin-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **10.76 s** | 1.00x | 2670.8 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **22.29 s** | 2.07x | 1653.4 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (20.41 s) | not ranked | (705.2 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (81.39 s) | not ranked | (2736.2 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/vue-vben-admin.md).

## vuetify

> 📄 Full report: [real-world/vuetify.md](real-world/vuetify.md)

### Project test suite — vuetify:docs

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-vuetify-project-test-dark.svg">
  <img alt="Project test suite — vuetify:docs" src="charts/real-world-vuetify-project-test.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| vuetify — project's own toolchain (baseline) | **45.51 s** | 1.00x | 1034.1 MB |
| [vuetify — @verter/unplugin](https://github.com/pikax/verter) | **45.83 s** | 1.01x | 933.5 MB |
| vuetify — unplugin-vue | **45.98 s** | 1.01x | 1078.2 MB |
| [vuetify — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **46.53 s** | 1.02x | 1112.8 MB |

> Errors, skips and per-row notes: [full results](real-world/vuetify.md).

### Project typecheck (own tsconfig) — vuetify:docs

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-vuetify-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — vuetify:docs" src="charts/real-world-vuetify-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **12.86 s** | 1.00x | 2451.5 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **19.67 s** | 1.53x | 3457.7 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **31.79 s** | 2.47x | 2153.2 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (8.42 s) | not ranked | (605.8 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/vuetify.md).
