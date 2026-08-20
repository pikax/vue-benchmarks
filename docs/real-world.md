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
| element-plus — project's own toolchain (baseline) | **160.55 s** | 1.00x | 1629.9 MB |
| element-plus — unplugin-vue | **162.66 s** | 1.01x | 1785.9 MB |
| [element-plus — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) ⚠ | (225.08 s) | not ranked | (5421.2 MB) |
| [element-plus — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (110.73 s) | not ranked | (1365.2 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/element-plus.md).

### Project typecheck (own tsconfig) — element-plus:components

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-element-plus-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — element-plus:components" src="charts/real-world-element-plus-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [verter-tsc](https://github.com/pikax/verter) | **4.79 s** | 1.00x | 649.7 MB |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **13.34 s** | 2.79x | 2552.4 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **29.62 s** | 6.19x | 1916.7 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **61.13 s** | 12.77x | 5188.7 MB |

> Errors, skips and per-row notes: [full results](real-world/element-plus.md).

## hoppscotch

> 📄 Full report: [real-world/hoppscotch.md](real-world/hoppscotch.md)

### Project test suite — hoppscotch:common

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-hoppscotch-project-test-dark.svg">
  <img alt="Project test suite — hoppscotch:common" src="charts/real-world-hoppscotch-project-test.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| @hoppscotch/common — project's own toolchain (baseline) | **20.20 s** | 1.00x | 701.5 MB |
| @hoppscotch/common — unplugin-vue | **20.28 s** | 1.00x | 710.9 MB |
| [@hoppscotch/common — @verter/unplugin](https://github.com/pikax/verter) | **20.29 s** | 1.00x | 709.3 MB |
| [@hoppscotch/common — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **20.40 s** | 1.01x | 756.0 MB |

> Errors, skips and per-row notes: [full results](real-world/hoppscotch.md).

### Project build (own config) — hoppscotch:common

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-hoppscotch-project-build-dark.svg">
  <img alt="Project build (own config) — hoppscotch:common" src="charts/real-world-hoppscotch-project-build.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| hoppscotch-agent — project's own toolchain (baseline) | **1.16 s** | 1.00x | 439.2 MB |
| hoppscotch-agent — unplugin-vue | **1.20 s** | 1.03x | 431.0 MB |
| [hoppscotch-agent — @verter/unplugin](https://github.com/pikax/verter) | **1.23 s** | 1.05x | 459.9 MB |
| [hoppscotch-agent — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **1.26 s** | 1.08x | 446.0 MB |

> Errors, skips and per-row notes: [full results](real-world/hoppscotch.md).

### Project typecheck (own tsconfig) — hoppscotch:common

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-hoppscotch-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — hoppscotch:common" src="charts/real-world-hoppscotch-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [verter-tsc](https://github.com/pikax/verter) | **1.28 s** | 1.00x | 352.4 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **2.23 s** | 1.75x | 431.6 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **5.26 s** | 4.12x | 628.3 MB |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) ⚠ | (1.38 s) | not ranked | (465.6 MB) |

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
| naive-ui — project's own toolchain (baseline) ⚠ | (301.58 s) | not ranked | (1583.2 MB) |
| naive-ui — unplugin-vue ⚠ | (301.97 s) | not ranked | (1661.0 MB) |
| [naive-ui — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) ⚠ | (304.76 s) | not ranked | (1537.3 MB) |
| [naive-ui — @verter/unplugin](https://github.com/pikax/verter) ⚠ | (307.77 s) | not ranked | (1540.5 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/naive-ui.md).

### Project typecheck (own tsconfig) — naive-ui:demos

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-naive-ui-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — naive-ui:demos" src="charts/real-world-naive-ui-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) ⚠ | (53.11 s) | not ranked | (2487.2 MB) |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) ⚠ | (44.87 s) | not ranked | (2923.9 MB) |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (10.61 s) | not ranked | (1363.1 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (19.03 s) | not ranked | (3167.7 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/naive-ui.md).

## nuxt-ui

> 📄 Full report: [real-world/nuxt-ui.md](real-world/nuxt-ui.md)

### Project typecheck (own tsconfig) — nuxt-ui:runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-nuxt-ui-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — nuxt-ui:runtime" src="charts/real-world-nuxt-ui-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **12.33 s** | 1.00x | 4145.5 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **30.09 s** | 2.44x | 4468.5 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **43.09 s** | 3.49x | 3377.2 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (5.62 s) | not ranked | (925.5 MB) |

> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](real-world/nuxt-ui.md).

## quasar

> 📄 Full report: [real-world/quasar.md](real-world/quasar.md)

### Project test suite — quasar:playground

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-quasar-project-test-dark.svg">
  <img alt="Project test suite — quasar:playground" src="charts/real-world-quasar-project-test.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| quasar.dev — project's own toolchain (baseline) | **3.35 s** | 1.00x | 455.8 MB |

> Errors, skips and per-row notes: [full results](real-world/quasar.md).

### Project typecheck (own tsconfig) — quasar:playground

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-quasar-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — quasar:playground" src="charts/real-world-quasar-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **1.90 s** | 1.00x | 734.6 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **2.36 s** | 1.24x | 390.5 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **8.55 s** | 4.51x | 505.3 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (349.6 ms) | not ranked | (136.5 MB) |

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
| vben-admin-monorepo — project's own toolchain (baseline) | **10.77 s** | 1.00x | 697.8 MB |
| vben-admin-monorepo — unplugin-vue | **11.12 s** | 1.03x | 708.7 MB |
| [vben-admin-monorepo — @verter/unplugin](https://github.com/pikax/verter) | **11.22 s** | 1.04x | 657.8 MB |
| [vben-admin-monorepo — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **41.94 s** | 3.90x | 6581.0 MB |

> Errors, skips and per-row notes: [full results](real-world/vue-vben-admin.md).

### Project typecheck (own tsconfig) — vue-vben-admin:core-ui

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-vue-vben-admin-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — vue-vben-admin:core-ui" src="charts/real-world-vue-vben-admin-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **10.26 s** | 1.00x | 2696.7 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **21.14 s** | 2.06x | 1672.6 MB |
| [verter-tsc](https://github.com/pikax/verter) ⚠ | (3.75 s) | not ranked | (728.4 MB) |
| [Vize](https://github.com/ubugeeei-prod/vize) ⚠ | (66.80 s) | not ranked | (3022.8 MB) |

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
| vuetify — unplugin-vue | **45.05 s** | 1.00x | 1035.9 MB |
| [vuetify — @verter/unplugin](https://github.com/pikax/verter) | **45.20 s** | 1.00x | 979.6 MB |
| vuetify — project's own toolchain (baseline) | **45.27 s** | 1.00x | 995.8 MB |
| [vuetify — @vizejs/vite-plugin](https://github.com/ubugeeei-prod/vize) | **46.06 s** | 1.02x | 1079.9 MB |

> Errors, skips and per-row notes: [full results](real-world/vuetify.md).

### Project typecheck (own tsconfig) — vuetify:docs

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-vuetify-project-typecheck-dark.svg">
  <img alt="Project typecheck (own tsconfig) — vuetify:docs" src="charts/real-world-vuetify-project-typecheck.svg">
</picture>

| Tool | **Median** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| [verter-tsc](https://github.com/pikax/verter) | **5.09 s** | 1.00x | 771.2 MB |
| [vue-tsc (N)](https://github.com/johnsoncodehk/typescript-native-bridge) | **12.64 s** | 2.48x | 2523.8 MB |
| [Vize](https://github.com/ubugeeei-prod/vize) | **14.39 s** | 2.83x | 2435.0 MB |
| [vue-tsc (JS)](https://github.com/vuejs/language-tools) | **31.12 s** | 6.11x | 2080.2 MB |

> Errors, skips and per-row notes: [full results](real-world/vuetify.md).
