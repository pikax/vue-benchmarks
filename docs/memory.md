# Memory (resource probe)

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.
> Source: `results/benchmarks/memory-linux-100.json`. Timing tables on the group pages carry this probe's Peak RSS as a column.

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-09-18T13:33:55.751Z
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
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 60.77 / 62.75 / 61.76 | 62.75 MB | 33.92 / 33.92 / 33.92 | 761.10 | 202.4 | 376.02 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 61.56 / 63.43 / 62.50 | 63.58 MB | 34.25 / 34.25 / 34.25 | 738.94 | 204.2 | 361.42 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID | 18.31 / 18.31 / 18.31 | 18.31 MB | 0.81 / 0.81 / 0.81 | n/a | n/a | 13.91 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID | 20.13 / 20.13 / 20.13 | 20.63 MB | 0.85 / 0.85 / 0.85 | n/a | n/a | 15.08 | 3 |
| Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID | 44.34 / 44.34 / 44.34 | 44.41 MB | 0.82 / 0.82 / 0.82 | 110.21 | 151.9 | 74.63 | 3 |
| Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID | 44.96 / 44.96 / 44.96 | 45.00 MB | 0.88 / 0.88 / 0.88 | 113.45 | 161.7 | 69.88 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID | 71.39 / 71.39 / 71.39 | 73.02 MB | 39.73 / 39.73 / 39.73 | 1056.63 | 198.8 | 534.43 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 6/33 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 9/33 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: old dynamic listener was not removed: expected "1", got "2"
- **Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID** — Validation: INVALID — 7/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID** — Validation: INVALID — 15/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined
- **@vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/33 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: directive mounted binding: expected "first|status|true|true", got undefined; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

#### SFC compilation with CSS — styles included

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 64.75 / 65.60 / 65.21 | 65.91 MB | 31.42 / 31.42 / 31.42 | 821.05 | 201.0 | 408.07 | 3 |
| fervid compileSync (1T) vdom-prod ⚠ INVALID | 15.86 / 15.86 / 15.86 | 15.96 MB | 0.84 / 0.84 / 0.84 | 33.26 | 110.4 | 29.99 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID | 16.45 / 16.45 / 16.45 | 16.46 MB | 0.95 / 0.95 / 0.95 | 32.82 | 108.7 | 30.21 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID | 17.13 / 17.13 / 17.13 | 17.28 MB | 0.99 / 0.99 / 0.99 | 37.56 | 107.5 | 34.93 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID | 18.24 / 18.24 / 18.24 | 18.30 MB | 0.84 / 0.84 / 0.84 | n/a | n/a | 14.57 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID | 20.31 / 20.31 / 20.31 | 20.64 MB | 0.89 / 0.89 / 0.89 | n/a | n/a | 16.25 | 3 |
| Verter compileMany + style transform (render + CSS) vdom-prod ⚠ INVALID | 46.62 / 46.62 / 46.62 | 46.75 MB | 1.03 / 1.03 / 1.03 | 123.02 | 163.9 | 72.52 | 3 |
| Verter compileMany + style transform (render + CSS) vapor-prod ⚠ INVALID | 46.96 / 46.96 / 46.96 | 47.03 MB | 1.09 / 1.09 / 1.09 | 124.62 | 183.2 | 68.03 | 3 |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID | 75.25 / 75.25 / 75.25 | 76.20 MB | 42.81 / 42.81 / 42.81 | 1151.84 | 199.2 | 578.30 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **fervid compileSync (1T) vdom-prod ⚠ INVALID** — Validation: INVALID — 10/33 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; scoped-slot-props: value is not defined; event-modifier-semantics: event modifiers: expected "0|2|1|1", got "0|2|2|1"
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 6/33 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"
- **Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 9/33 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: old dynamic listener was not removed: expected "1", got "2"
- **Verter compileMany + style transform (render + CSS) vdom-prod ⚠ INVALID** — Validation: INVALID — 7/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Verter compileMany + style transform (render + CSS) vapor-prod ⚠ INVALID** — Validation: INVALID — 15/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/33 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: directive mounted binding: expected "first|status|true|true", got undefined; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

### jsx-compile

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) ❔ UNVERIFIED | 10.66 / 10.66 / 10.66 | 10.79 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 4.68 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) ❔ UNVERIFIED | 10.70 / 10.70 / 10.70 | 10.99 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 5.06 | 3 |
| @vue/babel-plugin-jsx ❔ UNVERIFIED | 69.09 / 69.09 / 69.09 | 70.10 MB | 23.43 / 23.43 / 23.43 | 605.27 | 174.1 | 347.64 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **All rows** — Validation: UNVERIFIED — handler completed but has no semantic/work validation verdict

</details>

### typecheck

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize check | 10.55 / 212.25 / 114.67 | 218.41 MB | n/a | 340.00 | 56.4 | 602.53 | 3 |
| Golar typecheck | 12.72 / 373.79 / 222.34 | 388.18 MB | n/a | 2310.00 | 244.1 | 942.12 | 3 |
| vue-tsc | 10.39 / 351.84 / 261.68 | 353.57 MB | n/a | 6220.00 | 203.4 | 3096.15 | 3 |
| verter-tsc ⚠ INVALID | 10.65 / 443.64 / 226.05 | 445.84 MB | n/a | 10.00 | 0.6 | 1653.72 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **verter-tsc ⚠ INVALID** — Validation: INVALID — clean typecheck corpus unexpectedly exited 1: /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00008.vue(17,8): error TS2339: Property '$slots' does not exist on type 'Omit<{ $props: VNodeProps & AllowedComponentProps & ComponentCustomProps & { id?:

</details>

### format

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Biome format | 0.76 / 94.70 / 53.01 | 94.82 MB | n/a | 20.00 | 32.3 | 62.02 | 3 |
| Vize fmt | 10.43 / 67.93 / 55.29 | 67.95 MB | n/a | 70.00 | 91.0 | 76.94 | 3 |
| Prettier | 11.47 / 185.43 / 139.81 | 199.29 MB | n/a | 2980.00 | 168.3 | 1747.16 | 3 |
| Oxfmt | 10.56 / 682.15 / 487.92 | 694.08 MB | n/a | 110.00 | 6.1 | 1814.87 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### lint

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (default threads) | 10.55 / 69.31 / 43.77 | 69.34 MB | n/a | 60.00 | 120.3 | 49.07 | 3 |
| Oxlint (default threads; Node host + NAPI addon) | 11.04 / 98.89 / 54.32 | 98.93 MB | n/a | 30.00 | 65.0 | 46.18 | 3 |
| Verter host lint | 64.83 / 64.83 / 64.83 | 64.99 MB | 0.55 / 0.55 / 0.55 | 255.15 | 106.7 | 239.23 | 3 |
| Biome lint (default threads) | 0.77 / 101.48 / 76.16 | 103.44 MB | n/a | 20.00 | 20.1 | 99.32 | 3 |
| eslint-plugin-vue (1T) | 20.55 / 177.39 / 130.99 | 180.63 MB | 9.67 / 106.05 / 61.87 | 2709.11 | 167.2 | 1631.90 | 3 |

<details><summary>Notes</summary>

- **Vize lint (default threads)**, **Oxlint (default threads; Node host + NAPI addon)**, **Biome lint (default threads)** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### component-meta

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta | 247.54 / 247.54 / 247.54 | 248.66 MB | 179.54 / 179.54 / 179.54 | 3099.24 | 221.7 | 1398.01 | 3 |
| @verter/component-meta ❌ | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **vue-component-meta** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **@verter/component-meta ❌** — output materialization error: component-meta output materialization failed at exposed[].type index 0: the source has no live graph representation under the request view

</details>

### lsp

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.5) | 115.46 / 253.21 / 115.46 | 260.61 MB | 1.15 / 2.65 / 1.63 | 240.00 | 11.6 | 559.11 | 3 |
| LSP vize (server process, Node shim) | 174.15 / 266.03 / 174.15 | 266.30 MB | 0.84 / 1.72 / 1.23 | 60.00 | 11.9 | 386.01 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED | 394.78 / 535.74 / 394.78 | 559.87 MB | 0.94 / 2.68 / 1.71 | 580.00 | 9.1 | 1462.62 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED** — Validation: UNVERIFIED — script/template hover validity=true; resource sampler covers only @vue/language-server, not its required TypeScript-server half

</details>

### Versions

- node: v22.23.2
- vue: 3.5.43
- vue-36: 3.6.0-rc.9
- @vue/compiler-sfc: 3.5.43
- @vue/compiler-sfc-36: 3.6.0-rc.9
- vize: 0.424.10
- @vizejs/native: 0.424.10
- @verter/native: 0.0.1-beta.5
- @fervid/napi: 0.4.1
- verter-tsc: 0.0.1-beta.5
- @verter/component-meta: 0.0.1-beta.5
- verter-lsp: 0.0.1-beta.5
- verter-mcp: 0.0.1-beta.5
- @vue/language-server: 3.3.11
- @vue/typescript-plugin: 3.3.11
- typescript-language-server: 6.0.0
- vue-tsc: 3.3.11
- vue-component-meta: 3.3.11
- golar: 0.1.10
- @golar/vue: 0.1.10
- prettier: 3.9.7
- oxfmt: 0.68.0
- oxlint: 1.83.0
- eslint-plugin-vue: 10.11.0
- @biomejs/biome: 2.5.14
- typescript: 6.0.3
- cli:vize: 0.424.10
- cli:vue-tsc: 6.0.3
- cli:verter-tsc: 0.0.1-beta.5
- cli:golar: 0.1.10
- cli:prettier: 3.9.7
- cli:oxfmt: 0.68.0
- cli:oxlint: 1.83.0
- cli:biome: 2.5.14
- vue-jsx-vapor: 3.2.24
- @vue-jsx-vapor/compiler-rs: 3.2.24
- @vue/babel-plugin-jsx: 3.0.0
- @babel/core: 8.0.5

