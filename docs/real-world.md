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
| element-plus — unplugin-vue | **86.55 s** | 1.00x | 1627.8 MB |
| element-plus — project's own toolchain (baseline) | **88.45 s** | 1.02x | 1673.1 MB |
| [element-plus — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **88.83 s** | 1.03x | 1562.0 MB |
| [element-plus — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (84.45 s) | not ranked | (3538.4 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/element-plus.md).

### Project typecheck (own tsconfig) — element-plus:components

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-element-plus-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — element-plus:components" src="charts/real-world-element-plus-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **7.60 s** | 1.00x | 2564.8 MB |
| [verter-tsc](https://github.com/pikax/verter) | **8.46 s** | 1.11x | 1257.8 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **17.02 s** | 2.24x | 1936.4 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (25.52 s) | not ranked | (3477.6 MB) |

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
| [@hoppscotch/common — @verter/unplugin](https://github.com/pikax/verter) | **19.21 s** | 1.00x | 734.1 MB |
| @hoppscotch/common — project's own toolchain (baseline) | **19.24 s** | 1.00x | 711.9 MB |
| @hoppscotch/common — unplugin-vue | **19.31 s** | 1.01x | 746.3 MB |
| [@hoppscotch/common — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **19.46 s** | 1.01x | 780.2 MB |

> Errors, skips and per-row notes: [full results](real-world/hoppscotch.md).

### Project build (own config) — hoppscotch:common

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-hoppscotch-project-build-dark.svg">
  <img alt="Project build (own config) — hoppscotch:common" src="charts/real-world-hoppscotch-project-build.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| hoppscotch-agent — project's own toolchain (baseline) | **1.14 s** | 1.00x | 432.2 MB |
| hoppscotch-agent — unplugin-vue | **1.19 s** | 1.04x | 432.3 MB |
| [hoppscotch-agent — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **1.20 s** | 1.05x | 448.6 MB |
| [hoppscotch-agent — @verter/unplugin](https://github.com/pikax/verter) | **1.55 s** | 1.35x | 490.3 MB |

> Errors, skips and per-row notes: [full results](real-world/hoppscotch.md).

### Project typecheck (own tsconfig) — hoppscotch:common

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-hoppscotch-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — hoppscotch:common" src="charts/real-world-hoppscotch-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **5.06 s** | 1.00x | 625.9 MB |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) ⚠ | (1.41 s) | not ranked | (470.6 MB) |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (6.09 s) | not ranked | (701.4 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (1.73 s) | not ranked | (508.3 MB) |

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
| naive-ui — project's own toolchain (baseline) ⚠ | (328.83 s) | not ranked | (1602.6 MB) |
| naive-ui — unplugin-vue ⚠ | (326.47 s) | not ranked | (1653.5 MB) |
| [naive-ui — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) ⚠ | (325.26 s) | not ranked | (1675.2 MB) |
| [naive-ui — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (325.89 s) | not ranked | (1660.4 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/naive-ui.md).

### Project typecheck (own tsconfig) — naive-ui:demos

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-naive-ui-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — naive-ui:demos" src="charts/real-world-naive-ui-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) ⚠ | (54.20 s) | not ranked | (2503.4 MB) |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) ⚠ | (45.47 s) | not ranked | (2966.3 MB) |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (95.87 s) | not ranked | (2511.2 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (26.85 s) | not ranked | (4855.2 MB) |

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
| primevue — unplugin-vue | **34.41 s** | 1.00x | 756.6 MB |
| primevue — project's own toolchain (baseline) | **34.68 s** | 1.01x | 838.4 MB |
| [primevue — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) ⚠ | (25.67 s) | not ranked | (488.3 MB) |
| [primevue — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (36.94 s) | not ranked | (1120.2 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/primevue.md).

### Project typecheck (own tsconfig) — primevue:components

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-primevue-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — primevue:components" src="charts/real-world-primevue-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **14.37 s** | 1.00x | 3583.6 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **29.46 s** | 2.05x | 2529.2 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (26.16 s) | not ranked | (1005.6 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (38.83 s) | not ranked | (5390.7 MB) |

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
| quasar.dev — project's own toolchain (baseline) | **3.92 s** | 1.00x | 460.8 MB |

> Errors, skips and per-row notes: [full results](real-world/quasar.md).

### Project typecheck (own tsconfig) — quasar:playground

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-quasar-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — quasar:playground" src="charts/real-world-quasar-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **2.14 s** | 1.00x | 737.6 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **2.71 s** | 1.27x | 399.6 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **9.37 s** | 4.38x | 509.4 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (397.6 ms) | not ranked | (143.8 MB) |

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
| vben-admin-monorepo — project's own toolchain (baseline) | **10.98 s** | 1.00x | 691.4 MB |
| [vben-admin-monorepo — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **11.13 s** | 1.01x | 684.0 MB |
| vben-admin-monorepo — unplugin-vue | **11.25 s** | 1.02x | 721.4 MB |
| [vben-admin-monorepo — @verter/unplugin](https://github.com/pikax/verter) | **11.27 s** | 1.03x | 701.5 MB |

> Errors, skips and per-row notes: [full results](real-world/vue-vben-admin.md).

### Project typecheck (own tsconfig) — vue-vben-admin:core-ui

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-vue-vben-admin-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — vue-vben-admin:core-ui" src="charts/real-world-vue-vben-admin-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **10.62 s** | 1.00x | 2624.1 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **21.88 s** | 2.06x | 1663.9 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (21.27 s) | not ranked | (713.5 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (86.61 s) | not ranked | (2756.6 MB) |

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
| vuetify — project's own toolchain (baseline) | **47.65 s** | 1.00x | 1042.0 MB |
| [vuetify — @verter/unplugin](https://github.com/pikax/verter) | **47.81 s** | 1.00x | 1034.1 MB |
| vuetify — unplugin-vue | **47.84 s** | 1.00x | 989.7 MB |
| [vuetify — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **48.23 s** | 1.01x | 976.9 MB |

> Errors, skips and per-row notes: [full results](real-world/vuetify.md).

### Project typecheck (own tsconfig) — vuetify:docs

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-vuetify-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — vuetify:docs" src="charts/real-world-vuetify-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **13.00 s** | 1.00x | 2523.9 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **20.55 s** | 1.58x | 3546.9 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **31.42 s** | 2.42x | 2091.4 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (7.84 s) | not ranked | (621.0 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/vuetify.md).
