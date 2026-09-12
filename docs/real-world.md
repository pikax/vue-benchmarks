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
| [element-plus — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **92.93 s** | 1.00x | 1686.3 MB |
| element-plus — unplugin-vue | **93.82 s** | 1.01x | 1754.4 MB |
| element-plus — project's own toolchain (baseline) | **96.06 s** | 1.03x | 1599.2 MB |
| [element-plus — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (62.85 s) | not ranked | (1505.9 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/element-plus.md).

### Project typecheck (own tsconfig) — element-plus:components

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-element-plus-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — element-plus:components" src="charts/real-world-element-plus-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [verter-tsc](https://github.com/pikax/verter) | **2.54 s** | 1.00x | 658.9 MB |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **7.85 s** | 3.09x | 2534.2 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **17.89 s** | 7.04x | 1913.1 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (15.02 s) | not ranked | (3563.5 MB) |

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
| [@hoppscotch/common — @verter/unplugin](https://github.com/pikax/verter) | **27.29 s** | 1.00x | 709.8 MB |
| @hoppscotch/common — project's own toolchain (baseline) | **27.31 s** | 1.00x | 725.1 MB |
| @hoppscotch/common — unplugin-vue | **27.32 s** | 1.00x | 771.3 MB |
| [@hoppscotch/common — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **27.68 s** | 1.01x | 732.1 MB |

> Errors, skips and per-row notes: [full results](real-world/hoppscotch.md).

### Project build (own config) — hoppscotch:common

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-hoppscotch-project-build-dark.svg">
  <img alt="Project build (own config) — hoppscotch:common" src="charts/real-world-hoppscotch-project-build.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [hoppscotch-agent — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **1.70 s** | 1.00x | 444.4 MB |
| hoppscotch-agent — unplugin-vue | **1.74 s** | 1.02x | 432.1 MB |
| hoppscotch-agent — project's own toolchain (baseline) | **1.78 s** | 1.05x | 440.0 MB |
| [hoppscotch-agent — @verter/unplugin](https://github.com/pikax/verter) | **1.84 s** | 1.08x | 459.4 MB |

> Errors, skips and per-row notes: [full results](real-world/hoppscotch.md).

### Project typecheck (own tsconfig) — hoppscotch:common

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-hoppscotch-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — hoppscotch:common" src="charts/real-world-hoppscotch-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **6.66 s** | 1.00x | 631.6 MB |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) ⚠ | (1.85 s) | not ranked | (465.9 MB) |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (1.76 s) | not ranked | (353.9 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (2.39 s) | not ranked | (487.5 MB) |

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
| naive-ui — project's own toolchain (baseline) ⚠ | (324.21 s) | not ranked | (1653.8 MB) |
| naive-ui — unplugin-vue ⚠ | (324.74 s) | not ranked | (1743.2 MB) |
| [naive-ui — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) ⚠ | (327.43 s) | not ranked | (1653.8 MB) |
| [naive-ui — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (323.56 s) | not ranked | (1640.7 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/naive-ui.md).

### Project typecheck (own tsconfig) — naive-ui:demos

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-naive-ui-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — naive-ui:demos" src="charts/real-world-naive-ui-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) ⚠ | (52.89 s) | not ranked | (2505.0 MB) |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) ⚠ | (45.82 s) | not ranked | (2948.7 MB) |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (11.19 s) | not ranked | (1346.5 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (23.98 s) | not ranked | (4418.2 MB) |

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
| primevue — project's own toolchain (baseline) | **41.17 s** | 1.00x | 872.8 MB |
| primevue — unplugin-vue | **41.54 s** | 1.01x | 764.7 MB |
| [primevue — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) ⚠ | (30.86 s) | not ranked | (474.4 MB) |
| [primevue — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (37.66 s) | not ranked | (616.8 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/primevue.md).

### Project typecheck (own tsconfig) — primevue:components

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-primevue-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — primevue:components" src="charts/real-world-primevue-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **16.32 s** | 1.00x | 3692.3 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **30.34 s** | 1.86x | 2327.8 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (3.02 s) | not ranked | (424.7 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (41.03 s) | not ranked | (4866.8 MB) |

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
| quasar.dev — project's own toolchain (baseline) | **3.99 s** | 1.00x | 469.4 MB |

> Errors, skips and per-row notes: [full results](real-world/quasar.md).

### Project typecheck (own tsconfig) — quasar:playground

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-quasar-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — quasar:playground" src="charts/real-world-quasar-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **2.12 s** | 1.00x | 704.6 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **2.78 s** | 1.31x | 399.1 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **9.57 s** | 4.51x | 503.8 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (403.7 ms) | not ranked | (135.4 MB) |

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
| vben-admin-monorepo — project's own toolchain (baseline) | **8.43 s** | 1.00x | 713.7 MB |
| [vben-admin-monorepo — @verter/unplugin](https://github.com/pikax/verter) | **8.45 s** | 1.00x | 724.2 MB |
| vben-admin-monorepo — unplugin-vue | **8.50 s** | 1.01x | 746.3 MB |
| [vben-admin-monorepo — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **8.51 s** | 1.01x | 744.6 MB |

> Errors, skips and per-row notes: [full results](real-world/vue-vben-admin.md).

### Project typecheck (own tsconfig) — vue-vben-admin:core-ui

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-vue-vben-admin-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — vue-vben-admin:core-ui" src="charts/real-world-vue-vben-admin-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **8.15 s** | 1.00x | 2680.0 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **16.62 s** | 2.04x | 1664.4 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (2.98 s) | not ranked | (733.7 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (65.17 s) | not ranked | (2752.4 MB) |

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
| [vuetify — @verter/unplugin](https://github.com/pikax/verter) | **34.71 s** | 1.00x | 1039.1 MB |
| [vuetify — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **34.78 s** | 1.00x | 980.8 MB |
| vuetify — project's own toolchain (baseline) | **34.79 s** | 1.00x | 1020.0 MB |
| vuetify — unplugin-vue | **34.79 s** | 1.00x | 1026.1 MB |

> Errors, skips and per-row notes: [full results](real-world/vuetify.md).

### Project typecheck (own tsconfig) — vuetify:docs

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-vuetify-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — vuetify:docs" src="charts/real-world-vuetify-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [verter-tsc](https://github.com/pikax/verter) | **4.11 s** | 1.00x | 789.7 MB |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **10.44 s** | 2.54x | 2462.0 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **18.75 s** | 4.56x | 3412.3 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **26.57 s** | 6.46x | 2083.7 MB |

> Errors, skips and per-row notes: [full results](real-world/vuetify.md).
