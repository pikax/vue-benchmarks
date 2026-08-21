# Memory (resource probe)

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.
> Source: `results/benchmarks/memory-linux-100.json`. Timing tables on the group pages carry this probe's Peak RSS as a column.

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-08-21T09:51:47.307Z
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
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 59.70 / 61.65 / 60.67 | 61.85 MB | 19.53 / 19.53 / 19.53 | 1008.10 | 198.1 | 506.69 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 61.06 / 62.34 / 61.70 | 62.83 MB | 19.90 / 19.90 / 19.90 | 999.00 | 199.1 | 501.71 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID | 17.89 / 17.89 / 17.89 | 17.95 MB | 0.81 / 0.81 / 0.81 | n/a | n/a | 17.38 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID | 18.59 / 18.59 / 18.59 | 18.65 MB | 0.84 / 0.84 / 0.84 | n/a | n/a | 17.37 | 3 |
| Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID | 35.71 / 35.71 / 35.71 | 36.15 MB | 0.80 / 0.80 / 0.80 | 96.04 | 155.4 | 63.36 | 3 |
| Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID | 35.99 / 35.99 / 35.99 | 36.01 MB | 0.82 / 0.82 / 0.82 | 99.23 | 152.6 | 64.90 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID | 72.09 / 72.09 / 72.09 | 72.59 MB | 39.54 / 39.54 / 39.54 | 1335.24 | 195.2 | 684.01 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 5/31 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 9/31 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: old dynamic listener was not removed: expected "1", got "2"
- **Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID** — Validation: INVALID — 8/31 plants did not pass: svg-namespace-reactivity: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"; template-refs-v-for-update: itemElements.value.map is not a function
- **Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID** — Validation: INVALID — 27/31 plants did not pass: runtime-props-defaults-reactivity: _setText is not defined; define-emits-payload: _setText is not defined; native-v-model-modifiers: _setText is not defined
- **@vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/31 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: dir is not a function; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

#### SFC compilation with CSS — styles included

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 64.48 / 65.37 / 65.03 | 65.71 MB | 31.90 / 31.90 / 31.90 | 1095.01 | 196.4 | 557.52 | 3 |
| fervid compileSync (1T) vdom-prod ⚠ INVALID | 15.89 / 15.89 / 15.89 | 16.25 MB | 0.83 / 0.83 / 0.83 | 40.28 | 108.7 | 37.06 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID | 16.37 / 16.37 / 16.37 | 16.40 MB | 0.98 / 0.98 / 0.98 | 43.37 | 109.8 | 39.51 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID | 16.45 / 16.45 / 16.45 | 16.51 MB | 0.93 / 0.93 / 0.93 | 41.53 | 107.9 | 38.50 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID | 18.01 / 18.01 / 18.01 | 18.01 MB | 0.84 / 0.84 / 0.84 | n/a | n/a | 18.23 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID | 18.59 / 18.59 / 18.59 | 18.65 MB | 0.89 / 0.89 / 0.89 | n/a | n/a | 18.24 | 3 |
| Verter compileMany + processStyle (render + CSS) vapor-prod ⚠ INVALID | 38.00 / 38.00 / 38.00 | 38.35 MB | 1.02 / 1.02 / 1.02 | 104.69 | 154.3 | 67.89 | 3 |
| Verter compileMany + processStyle (render + CSS) vdom-prod ⚠ INVALID | 38.03 / 38.03 / 38.03 | 38.16 MB | 1.00 / 1.00 / 1.00 | 107.09 | 154.7 | 69.03 | 3 |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID | 76.50 / 77.77 / 77.42 | 78.34 MB | 42.75 / 42.75 / 42.75 | 1458.85 | 194.6 | 747.29 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **fervid compileSync (1T) vdom-prod ⚠ INVALID** — Validation: INVALID — 10/31 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; scoped-slot-props: value is not defined; event-modifier-semantics: event modifiers: expected "0|2|1|1", got "0|2|2|1"
- **Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 9/31 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: old dynamic listener was not removed: expected "1", got "2"
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 5/31 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Verter compileMany + processStyle (render + CSS) vapor-prod ⚠ INVALID** — Validation: INVALID — 27/31 plants did not pass: runtime-props-defaults-reactivity: _setText is not defined; define-emits-payload: _setText is not defined; native-v-model-modifiers: _setText is not defined
- **Verter compileMany + processStyle (render + CSS) vdom-prod ⚠ INVALID** — Validation: INVALID — 8/31 plants did not pass: svg-namespace-reactivity: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"; template-refs-v-for-update: itemElements.value.map is not a function
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/31 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: dir is not a function; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

### jsx-compile

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) ❔ UNVERIFIED | 10.66 / 10.66 / 10.66 | 10.66 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 5.76 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) ❔ UNVERIFIED | 10.79 / 10.79 / 10.79 | 10.82 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 7.23 | 3 |
| @vue/babel-plugin-jsx ❔ UNVERIFIED | 70.27 / 70.40 / 70.34 | 74.93 MB | 24.66 / 24.66 / 24.66 | 766.85 | 170.3 | 451.55 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **All rows** — Validation: UNVERIFIED — handler completed but has no semantic/work validation verdict

</details>

### typecheck

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize check | 15.18 / 213.82 / 114.50 | 213.89 MB | n/a | 410.00 | 51.1 | 798.91 | 3 |
| Golar typecheck | 17.24 / 383.47 / 226.44 | 387.09 MB | n/a | 3060.00 | 244.2 | 1248.80 | 3 |
| vue-tsc | 17.00 / 350.48 / 265.11 | 351.52 MB | n/a | 7870.00 | 210.6 | 3737.45 | 3 |
| verter-tsc ⚠ INVALID | 17.14 / 216.57 / 132.51 | 216.75 MB | n/a | 20.00 | 2.7 | 748.98 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **verter-tsc ⚠ INVALID** — Validation: INVALID — clean typecheck corpus unexpectedly exited 1: /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00000.vue(1,1): error TS2531: Object is possibly 'null'. /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00001.vue(1,1

</details>

### format

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 15.30 / 68.27 / 54.32 | 68.33 MB | n/a | 90.00 | 112.3 | 80.11 | 3 |
| Biome format | 2.19 / 95.77 / 59.14 | 96.90 MB | n/a | 20.00 | 24.7 | 81.21 | 3 |
| Prettier | 15.27 / 186.70 / 139.57 | 188.42 MB | n/a | 3880.00 | 171.6 | 2260.52 | 3 |
| Oxfmt | 15.34 / 678.58 / 498.99 | 683.15 MB | n/a | 120.00 | 5.1 | 2375.88 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### lint

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 31.65 / 31.65 / 31.65 | 31.75 MB | 0.46 / 0.46 / 0.46 | 100.63 | 125.6 | 79.97 | 3 |
| Vize lint (default threads) | 17.27 / 69.04 / 44.75 | 69.06 MB | n/a | 60.00 | 105.1 | 57.26 | 3 |
| Oxlint (default threads; Node host + NAPI addon) | 17.25 / 99.27 / 54.39 | 99.30 MB | n/a | 40.00 | 76.3 | 53.88 | 3 |
| Biome lint (default threads) | 2.94 / 102.40 / 74.24 | 102.87 MB | n/a | 20.00 | 16.5 | 121.38 | 3 |
| eslint-plugin-vue (1T) | 18.07 / 215.13 / 151.61 | 216.20 MB | 7.84 / 65.15 / 45.04 | 3500.57 | 167.0 | 2106.69 | 3 |

<details><summary>Notes</summary>

- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint (default threads)**, **Oxlint (default threads; Node host + NAPI addon)**, **Biome lint (default threads)** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### component-meta

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | 31.93 / 90.41 / 70.81 | 90.84 MB | 7.87 / 23.65 / 15.76 | 604.46 | 154.6 | 390.78 | 3 |
| vue-component-meta | 246.98 / 246.98 / 246.98 | 247.07 MB | 170.19 / 170.19 / 170.19 | 4000.60 | 218.3 | 1828.62 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 98.33 / 219.58 / 98.33 | 232.98 MB | 1.13 / 2.80 / 1.66 | 40.00 | 14.1 | 583.05 | 3 |
| LSP vize (server process, Node shim) | 167.17 / 253.36 / 167.17 | 253.44 MB | 0.88 / 1.73 / 1.25 | 80.00 | 13.2 | 422.72 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED | 395.57 / 536.12 / 395.57 | 556.11 MB | 0.92 / 2.65 / 1.72 | 760.00 | 10.3 | 1916.72 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED** — Validation: UNVERIFIED — script/template hover validity=true; resource sampler covers only @vue/language-server, not its required TypeScript-server half

</details>

### Versions

- node: v22.23.2
- vue: 3.5.41
- vue-36: 3.6.0-rc.4
- @vue/compiler-sfc: 3.5.41
- @vue/compiler-sfc-36: 3.6.0-rc.4
- vize: 0.354.0
- @vizejs/native: 0.354.0
- @verter/native: 0.0.1-beta.3
- @fervid/napi: 0.4.1
- verter-tsc: 0.0.1-beta.3
- @verter/component-meta: 0.0.1-beta.3
- verter-lsp: 0.0.1-beta.3
- verter-mcp: 0.0.1-beta.3
- @vue/language-server: 3.3.10
- @vue/typescript-plugin: 3.3.10
- typescript-language-server: 5.3.0
- vue-tsc: 3.3.10
- vue-component-meta: 3.3.10
- golar: 0.1.10
- @golar/vue: 0.1.10
- prettier: 3.9.6
- oxfmt: 0.64.0
- oxlint: 1.79.0
- eslint-plugin-vue: 10.10.0
- @biomejs/biome: 2.5.9
- typescript: 6.0.3
- cli:vize: 0.354.0
- cli:vue-tsc: 6.0.3
- cli:verter-tsc: 0.0.1-beta.3
- cli:golar: 0.1.10
- cli:prettier: 3.9.6
- cli:oxfmt: 0.64.0
- cli:oxlint: 1.79.0
- cli:biome: 2.5.9
- vue-jsx-vapor: 3.2.21
- @vue-jsx-vapor/compiler-rs: 3.2.21
- @vue/babel-plugin-jsx: 3.0.0
- @babel/core: 8.0.1

