# Memory (resource probe)

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.
> Source: `results/benchmarks/memory-linux-100.json`. Timing tables on the group pages carry this probe's Peak RSS as a column.

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-10-19T21:16:20.015Z
- **Fixture:** `fixtures/200`
- **Samples per tool:** 3 requested · 3 recorded for every row (see the **Samples** column)
- **File limit:** 100 (typecheck 100, meta 50)

One table per surface and, where work differs, per comparison class. Each metric is one `min / max / avg` cell, with true cross-sample Peak RSS separate; status is a marker on the name (❌ error · ⏭ skipped · ⚠ INVALID · ❔ UNVERIFIED) and per-row detail is under **Notes** below each table. Invalid/unverified resource figures remain visible because the process ran, but are excluded from performance comparison. `n/a` = not measurable on this platform; `–` = the row never ran.

### Metrics

| Column | Meaning |
| --- | --- |
| **RSS min/max/avg** | Resident set: CLI = child WorkingSet/RSS; in-process = delta vs GC baseline |
| **Peak RSS** | Highest tool-attributed RSS observed in any recorded sample; this is the value used by README Peak RSS charts/tables |
| **Alloc min/max/avg** | In-process: V8 `heapUsed` delta; CLI (Windows): private bytes (`PrivateMemorySize64`) |
| **CPU total / %** | Process CPU time (user+system) and % of wall time on one core (`cpu/wall×100`) |
| **Samples** | Samples that actually produced data for that row; ⚠ = fewer than requested |

### compile

#### Raw SFC compilation — identical style-free inputs

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 61.73 / 62.64 / 61.73 | 63.26 MB | 33.87 / 33.87 / 33.87 | 891.15 | 210.7 | 428.96 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 60.97 / 62.76 / 61.87 | 63.62 MB | 34.20 / 34.20 / 34.20 | 871.55 | 209.6 | 416.47 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID | 24.08 / 24.08 / 24.08 | 24.11 MB | 1.21 / 1.21 / 1.21 | 60.93 | 264.4 | 23.32 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID | 25.96 / 25.96 / 25.96 | 25.96 MB | 1.23 / 1.23 / 1.23 | 63.07 | 259.9 | 25.50 | 3 |
| Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID | 47.68 / 47.68 / 47.68 | 47.79 MB | 0.82 / 0.82 / 0.82 | 137.43 | 182.2 | 75.42 | 3 |
| Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID | 47.86 / 47.86 / 47.86 | 47.86 MB | 0.88 / 0.88 / 0.88 | 147.24 | 181.5 | 76.85 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod ❌ | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **@vue/compiler-sfc 3.6 (1T) vdom-prod**, **@vue/compiler-sfc 3.5 (1T) vdom-prod**, **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID**, **Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID**, **Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 4/33 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 4/33 plants did not pass: object-dynamic-bindings-events: selector did not match: [data-plant="bindings"]; dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: directive mounted binding: expected "first|status|true|true", got undefined
- **Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID** — Validation: INVALID — 7/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID** — Validation: INVALID — 15/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined
- **@vue/compiler-sfc 3.6 vapor (1T) vapor-prod ❌** — [@vue/compiler-sfc] Vapor components with a normal &lt;script> must also include &lt;script setup>, &lt;script vapor>, or &lt;script setup vapor>.

</details>

#### SFC compilation with CSS — styles included

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 64.09 / 65.07 / 64.53 | 65.27 MB | 31.24 / 31.24 / 31.24 | 981.23 | 207.1 | 472.65 | 3 |
| fervid compileSync (1T) vdom-prod ⚠ INVALID | 12.30 / 12.30 / 12.30 | 12.34 MB | 0.84 / 0.84 / 0.84 | 34.91 | 110.1 | 31.62 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID | 22.64 / 22.64 / 22.64 | 22.72 MB | 1.27 / 1.27 / 1.27 | 50.95 | 106.7 | 48.01 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID | 23.35 / 23.40 / 23.38 | 23.55 MB | 1.30 / 1.30 / 1.30 | 51.56 | 107.7 | 48.35 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID | 25.15 / 25.15 / 25.15 | 25.26 MB | 1.24 / 1.24 / 1.24 | 63.56 | 254.7 | 25.12 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID | 27.49 / 27.49 / 27.49 | 27.93 MB | 1.29 / 1.29 / 1.29 | 66.04 | 259.7 | 25.31 | 3 |
| Verter compileMany + style transform (render + CSS) vdom-prod ⚠ INVALID | 49.78 / 49.78 / 49.78 | 49.88 MB | 1.03 / 1.03 / 1.03 | 145.74 | 193.6 | 74.29 | 3 |
| Verter compileMany + style transform (render + CSS) vapor-prod ⚠ INVALID | 49.93 / 49.93 / 49.93 | 50.10 MB | 1.09 / 1.09 / 1.09 | 160.33 | 204.2 | 80.79 | 3 |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ❌ | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod**, **fervid compileSync (1T) vdom-prod ⚠ INVALID**, **Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID**, **Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID**, **Verter compileMany + style transform (render + CSS) vdom-prod ⚠ INVALID**, **Verter compileMany + style transform (render + CSS) vapor-prod ⚠ INVALID** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **fervid compileSync (1T) vdom-prod ⚠ INVALID** — Validation: INVALID — 10/33 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; scoped-slot-props: value is not defined; event-modifier-semantics: event modifiers: expected "0|2|1|1", got "0|2|2|1"
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 4/33 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"
- **Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 4/33 plants did not pass: object-dynamic-bindings-events: selector did not match: [data-plant="bindings"]; dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: directive mounted binding: expected "first|status|true|true", got undefined
- **Verter compileMany + style transform (render + CSS) vdom-prod ⚠ INVALID** — Validation: INVALID — 7/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Verter compileMany + style transform (render + CSS) vapor-prod ⚠ INVALID** — Validation: INVALID — 15/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ❌** — [@vue/compiler-sfc] Vapor components with a normal &lt;script> must also include &lt;script setup>, &lt;script vapor>, or &lt;script setup vapor>.

</details>

### jsx-compile

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) ❔ UNVERIFIED | 10.25 / 10.25 / 10.25 | 10.38 MB | 0.36 / 0.36 / 0.36 | n/a | n/a | 6.11 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) ❔ UNVERIFIED | 10.44 / 10.44 / 10.44 | 10.50 MB | 0.36 / 0.36 / 0.36 | n/a | n/a | 6.02 | 3 |
| @vue/babel-plugin-jsx ❔ UNVERIFIED | 76.51 / 76.51 / 76.51 | 78.02 MB | 33.09 / 33.09 / 33.09 | 721.70 | 172.8 | 417.71 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **All rows** — Validation: UNVERIFIED — handler completed but has no semantic/work validation verdict

</details>

### typecheck

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize check | 14.16 / 234.76 / 159.30 | 235.21 MB | n/a | 150.00 | 27.9 | 537.08 | 3 |
| Golar typecheck | 14.39 / 341.84 / 206.75 | 348.30 MB | n/a | 2900.00 | 248.9 | 1160.26 | 3 |
| vue-tsc | 13.35 / 350.07 / 258.32 | 351.60 MB | n/a | 7550.00 | 223.8 | 3362.57 | 3 |
| verter-tsc ⚠ INVALID | 14.38 / 448.45 / 218.55 | 457.91 MB | n/a | 10.00 | 0.4 | 2565.42 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **verter-tsc ⚠ INVALID** — Validation: INVALID — clean typecheck corpus unexpectedly exited 1: /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00008.vue(17,8): error TS2339: Property '$slots' does not exist on type 'Omit<{ $props: VNodeProps & AllowedComponentProps & ComponentCustomProps & { id?:

</details>

### format

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Biome format | 2.20 / 73.80 / 48.88 | 73.99 MB | n/a | 20.00 | 26.3 | 69.49 | 3 |
| Vize fmt | 13.77 / 72.56 / 58.73 | 72.59 MB | n/a | 80.00 | 77.0 | 111.02 | 3 |
| Prettier | 14.45 / 196.32 / 139.81 | 198.21 MB | n/a | 3420.00 | 171.8 | 1980.55 | 3 |
| Oxfmt | 14.40 / 667.78 / 475.92 | 671.90 MB | n/a | 110.00 | 5.3 | 2085.91 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### lint

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Oxlint (default threads; Node host + NAPI addon) | 15.11 / 97.52 / 50.48 | 97.58 MB | n/a | 50.00 | 83.3 | 53.34 | 3 |
| Verter host lint | 50.58 / 50.58 / 50.58 | 50.62 MB | 0.52 / 0.52 / 0.52 | 259.21 | 104.3 | 248.75 | 3 |
| Vize lint (default threads) | 14.42 / 77.90 / 51.56 | 77.90 MB | n/a | 100.00 | 146.2 | 68.41 | 3 |
| Biome lint (default threads) | 2.21 / 81.54 / 60.94 | 81.54 MB | n/a | 20.00 | 18.9 | 102.18 | 3 |
| eslint-plugin-vue (1T) | 16.83 / 212.65 / 150.26 | 213.39 MB | 7.27 / 63.79 / 45.96 | 3022.51 | 174.2 | 1724.29 | 3 |

<details><summary>Notes</summary>

- **Oxlint (default threads; Node host + NAPI addon)**, **Vize lint (default threads)**, **Biome lint (default threads)** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### component-meta

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | 168.93 / 169.43 / 169.18 | 174.39 MB | 33.66 / 33.66 / 33.66 | 1297.68 | 134.1 | 967.83 | 3 |
| vue-component-meta | 258.57 / 258.57 / 258.57 | 259.27 MB | 177.90 / 177.90 / 177.90 | 3945.14 | 223.7 | 1763.72 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP vize (server process, Node shim) | 113.33 / 170.49 / 113.33 | 170.89 MB | 0.85 / 1.83 / 1.22 | 100.00 | 11.5 | 336.46 | 3 |
| LSP verter (server process, npm 0.0.1-beta.7) ⚠ INVALID | 61.15 / 89.54 / 61.15 | 89.61 MB | 1.14 / 1.87 / 1.49 | 450.00 | 10.9 | 443.29 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED | 389.81 / 532.32 / 389.81 | 556.86 MB | 0.94 / 2.63 / 1.70 | 630.00 | 7.9 | 1504.20 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP verter (server process, npm 0.0.1-beta.7) ⚠ INVALID** — Validation: INVALID — hover validation failed (script=false, template=false)
- **LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED** — Validation: UNVERIFIED — script/template hover validity=false; resource sampler covers only @vue/language-server, not its required TypeScript-server half

</details>

### Versions

- node: v22.23.3
- vue: 3.5.44
- vue-36: 3.6.0-rc.12
- @vue/compiler-sfc: 3.5.44
- @vue/compiler-sfc-36: 3.6.0-rc.12
- vize: 0.481.0
- @vizejs/native: 0.481.0
- @verter/native: 0.0.1-beta.7
- @fervid/napi: 0.4.1
- verter-tsc: 0.0.1-beta.7
- @verter/component-meta: 0.0.1-beta.7
- verter-lsp: 0.0.1-beta.7
- verter-mcp: 0.0.1-beta.7
- @vue/language-server: 3.3.13
- @vue/typescript-plugin: 3.3.13
- typescript-language-server: 6.0.2
- vue-tsc: 3.3.13
- vue-component-meta: 3.3.13
- golar: 0.1.11
- @golar/vue: 0.1.11
- prettier: 3.9.10
- oxfmt: 0.73.0
- oxlint: 1.88.0
- eslint-plugin-vue: 10.11.1
- @biomejs/biome: 2.5.15
- typescript: 6.0.3
- cli:vize: 0.481.0
- cli:vue-tsc: 6.0.3
- cli:verter-tsc: 0.0.1-beta.7
- cli:golar: 0.1.11
- cli:prettier: 3.9.10
- cli:oxfmt: 0.73.0
- cli:oxlint: 1.88.0
- cli:biome: 2.5.15
- vue-jsx-vapor: 3.2.28
- @vue-jsx-vapor/compiler-rs: 3.2.28
- @vue/babel-plugin-jsx: 3.0.0
- @babel/core: 8.0.7

