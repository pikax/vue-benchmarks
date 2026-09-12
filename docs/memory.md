# Memory (resource probe)

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.
> Source: `results/benchmarks/memory-linux-100.json`. Timing tables on the group pages carry this probe's Peak RSS as a column.

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-09-12T10:53:41.562Z
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
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 61.12 / 61.81 / 61.81 | 62.93 MB | 21.61 / 21.61 / 21.61 | 1055.98 | 194.6 | 537.82 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 63.28 / 63.34 / 63.28 | 63.61 MB | 20.10 / 20.10 / 20.10 | 1024.78 | 199.1 | 514.83 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID | 18.12 / 18.12 / 18.12 | 18.36 MB | 0.81 / 0.81 / 0.81 | n/a | n/a | 17.87 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID | 18.62 / 18.62 / 18.62 | 18.74 MB | 0.85 / 0.85 / 0.85 | n/a | n/a | 18.18 | 3 |
| Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID | 35.83 / 35.83 / 35.83 | 35.87 MB | 0.82 / 0.82 / 0.82 | 101.16 | 151.0 | 66.49 | 3 |
| Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID | 35.85 / 35.85 / 35.85 | 36.21 MB | 0.80 / 0.80 / 0.80 | 103.20 | 156.0 | 66.00 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID | 72.00 / 72.00 / 72.00 | 73.70 MB | 39.68 / 39.68 / 39.68 | 1409.35 | 194.6 | 728.11 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 6/33 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 9/33 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: old dynamic listener was not removed: expected "1", got "2"
- **Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID** — Validation: INVALID — 29/33 plants did not pass: runtime-props-defaults-reactivity: _setText is not defined; reactive-props-destructure-shadowing: _setText is not defined; reactive-props-destructure-alias-default: _setText is not defined
- **Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID** — Validation: INVALID — 10/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; svg-namespace-reactivity: reactive SVG attribute: expected "9", got "4"
- **@vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/33 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: dir is not a function; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

#### SFC compilation with CSS — styles included

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 64.30 / 65.88 / 65.14 | 65.98 MB | 31.79 / 31.79 / 31.79 | 1130.91 | 193.4 | 588.34 | 3 |
| fervid compileSync (1T) vdom-prod ⚠ INVALID | 15.83 / 15.83 / 15.83 | 15.87 MB | 0.83 / 0.83 / 0.83 | 42.82 | 107.6 | 41.48 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID | 16.06 / 16.06 / 16.06 | 16.13 MB | 0.98 / 0.98 / 0.98 | 42.32 | 108.4 | 39.10 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID | 16.24 / 16.24 / 16.24 | 16.34 MB | 0.93 / 0.93 / 0.93 | 42.49 | 108.1 | 39.29 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID | 18.11 / 18.11 / 18.11 | 18.61 MB | 0.84 / 0.84 / 0.84 | n/a | n/a | 18.59 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID | 18.50 / 18.50 / 18.50 | 18.73 MB | 0.89 / 0.89 / 0.89 | n/a | n/a | 19.13 | 3 |
| Verter compileMany + processStyle (render + CSS) vdom-prod ⚠ INVALID | 38.01 / 38.01 / 38.01 | 38.07 MB | 1.00 / 1.00 / 1.00 | 113.44 | 165.9 | 68.10 | 3 |
| Verter compileMany + processStyle (render + CSS) vapor-prod ⚠ INVALID | 38.18 / 38.18 / 38.18 | 38.22 MB | 1.02 / 1.02 / 1.02 | 108.88 | 158.5 | 68.71 | 3 |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID | 77.05 / 78.15 / 77.29 | 78.89 MB | 42.35 / 42.35 / 42.35 | 1540.00 | 195.9 | 786.29 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **fervid compileSync (1T) vdom-prod ⚠ INVALID** — Validation: INVALID — 10/33 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; scoped-slot-props: value is not defined; event-modifier-semantics: event modifiers: expected "0|2|1|1", got "0|2|2|1"
- **Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 9/33 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: old dynamic listener was not removed: expected "1", got "2"
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 6/33 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"
- **Verter compileMany + processStyle (render + CSS) vdom-prod ⚠ INVALID** — Validation: INVALID — 10/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; svg-namespace-reactivity: reactive SVG attribute: expected "9", got "4"
- **Verter compileMany + processStyle (render + CSS) vapor-prod ⚠ INVALID** — Validation: INVALID — 29/33 plants did not pass: runtime-props-defaults-reactivity: _setText is not defined; reactive-props-destructure-shadowing: _setText is not defined; reactive-props-destructure-alias-default: _setText is not defined
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/33 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: dir is not a function; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

### jsx-compile

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) ❔ UNVERIFIED | 10.64 / 10.64 / 10.64 | 10.67 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 7.10 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) ❔ UNVERIFIED | 10.76 / 10.76 / 10.76 | 10.89 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 6.47 | 3 |
| @vue/babel-plugin-jsx ❔ UNVERIFIED | 65.18 / 65.18 / 65.18 | 66.95 MB | 32.63 / 32.63 / 32.63 | 788.92 | 172.4 | 453.99 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **All rows** — Validation: UNVERIFIED — handler completed but has no semantic/work validation verdict

</details>

### typecheck

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize check | 14.14 / 214.61 / 116.49 | 216.28 MB | n/a | 410.00 | 51.8 | 791.71 | 3 |
| Golar typecheck | 14.30 / 375.28 / 222.74 | 385.96 MB | n/a | 3120.00 | 239.8 | 1302.29 | 3 |
| vue-tsc | 14.04 / 351.04 / 260.48 | 352.13 MB | n/a | 8060.00 | 210.0 | 3825.07 | 3 |
| verter-tsc ⚠ INVALID | 14.51 / 210.31 / 133.80 | 212.39 MB | n/a | 20.00 | 2.4 | 833.73 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **verter-tsc ⚠ INVALID** — Validation: INVALID — clean typecheck corpus unexpectedly exited 1: /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00000.vue(1,1): error TS2531: Object is possibly 'null'. /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00001.vue(1,1

</details>

### format

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 14.27 / 67.98 / 54.02 | 68.00 MB | n/a | 100.00 | 111.2 | 89.95 | 3 |
| Biome format | 2.63 / 92.59 / 54.28 | 92.69 MB | n/a | 20.00 | 25.2 | 81.43 | 3 |
| Prettier | 14.42 / 187.00 / 139.39 | 189.04 MB | n/a | 4170.00 | 171.0 | 2409.47 | 3 |
| Oxfmt | 14.33 / 680.14 / 500.32 | 683.83 MB | n/a | 140.00 | 5.4 | 2570.50 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### lint

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 31.75 / 31.75 / 31.75 | 31.80 MB | 0.47 / 0.47 / 0.47 | 103.13 | 122.6 | 83.30 | 3 |
| Vize lint (default threads) | 14.52 / 69.25 / 46.49 | 69.26 MB | n/a | 80.00 | 126.3 | 63.34 | 3 |
| Oxlint (default threads; Node host + NAPI addon) | 14.55 / 96.86 / 53.62 | 98.94 MB | n/a | 40.00 | 70.9 | 56.93 | 3 |
| Biome lint (default threads) | 2.32 / 99.93 / 76.18 | 101.94 MB | n/a | 20.00 | 15.9 | 126.56 | 3 |
| eslint-plugin-vue (1T) | 20.33 / 185.27 / 130.91 | 186.49 MB | 9.64 / 106.85 / 63.55 | 3685.47 | 165.0 | 2228.38 | 3 |

<details><summary>Notes</summary>

- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint (default threads)**, **Oxlint (default threads; Node host + NAPI addon)**, **Biome lint (default threads)** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### component-meta

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | 31.30 / 90.30 / 70.52 | 91.47 MB | 7.97 / 23.79 / 15.88 | 633.15 | 155.6 | 410.30 | 3 |
| vue-component-meta | 247.49 / 247.49 / 247.49 | 247.63 MB | 168.00 / 168.00 / 168.00 | 4160.46 | 217.7 | 1911.08 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 100.60 / 217.00 / 100.60 | 233.63 MB | 1.14 / 2.69 / 1.66 | 50.00 | 14.6 | 583.74 | 3 |
| LSP vize (server process, Node shim) | 182.50 / 266.39 / 182.50 | 268.28 MB | 0.87 / 1.85 / 1.29 | 80.00 | 13.7 | 501.28 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED | 394.95 / 535.14 / 394.95 | 554.28 MB | 0.96 / 2.68 / 1.74 | 790.00 | 11.1 | 1954.03 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED** — Validation: UNVERIFIED — script/template hover validity=true; resource sampler covers only @vue/language-server, not its required TypeScript-server half

</details>

### Versions

- node: v22.23.2
- vue: 3.5.42
- vue-36: 3.6.0-rc.8
- @vue/compiler-sfc: 3.5.42
- @vue/compiler-sfc-36: 3.6.0-rc.8
- vize: 0.421.0
- @vizejs/native: 0.421.0
- @verter/native: 0.0.1-beta.3
- @fervid/napi: 0.4.1
- verter-tsc: 0.0.1-beta.3
- @verter/component-meta: 0.0.1-beta.3
- verter-lsp: 0.0.1-beta.3
- verter-mcp: 0.0.1-beta.3
- @vue/language-server: 3.3.11
- @vue/typescript-plugin: 3.3.11
- typescript-language-server: 6.0.0
- vue-tsc: 3.3.11
- vue-component-meta: 3.3.11
- golar: 0.1.10
- @golar/vue: 0.1.10
- prettier: 3.9.6
- oxfmt: 0.67.0
- oxlint: 1.82.0
- eslint-plugin-vue: 10.11.0
- @biomejs/biome: 2.5.13
- typescript: 6.0.3
- cli:vize: 0.421.0
- cli:vue-tsc: 6.0.3
- cli:verter-tsc: 0.0.1-beta.3
- cli:golar: 0.1.10
- cli:prettier: 3.9.6
- cli:oxfmt: 0.67.0
- cli:oxlint: 1.82.0
- cli:biome: 2.5.13
- vue-jsx-vapor: 3.2.23
- @vue-jsx-vapor/compiler-rs: 3.2.23
- @vue/babel-plugin-jsx: 3.0.0
- @babel/core: 8.0.5

