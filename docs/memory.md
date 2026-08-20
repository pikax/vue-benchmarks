# Memory (resource probe)

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.
> Source: `results/benchmarks/memory-linux-100.json`. Timing tables on the group pages carry this probe's Peak RSS as a column.

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-08-20T14:26:06.771Z
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
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 59.77 / 61.96 / 60.87 | 62.12 MB | 19.48 / 19.48 / 19.48 | 1015.36 | 194.0 | 523.37 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 61.34 / 63.21 / 62.28 | 64.62 MB | 19.69 / 19.69 / 19.69 | 1003.69 | 198.0 | 510.27 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID | 17.34 / 17.34 / 17.34 | 17.39 MB | 0.84 / 0.84 / 0.84 | n/a | n/a | 16.90 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID | 18.01 / 18.01 / 18.01 | 18.26 MB | 0.78 / 0.78 / 0.78 | n/a | n/a | 16.23 | 3 |
| Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID | 35.64 / 35.64 / 35.64 | 35.82 MB | 0.80 / 0.80 / 0.80 | 98.26 | 148.2 | 65.78 | 3 |
| Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID | 35.86 / 35.86 / 35.86 | 36.09 MB | 0.82 / 0.82 / 0.82 | 97.18 | 154.0 | 63.10 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID | 69.75 / 69.75 / 69.75 | 71.91 MB | 39.60 / 39.60 / 39.60 | 1363.96 | 193.9 | 705.25 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 9/31 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: old dynamic listener was not removed: expected "1", got "2"
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 5/31 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID** — Validation: INVALID — 8/31 plants did not pass: svg-namespace-reactivity: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"; template-refs-v-for-update: itemElements.value.map is not a function
- **Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID** — Validation: INVALID — 27/31 plants did not pass: runtime-props-defaults-reactivity: _setText is not defined; define-emits-payload: _setText is not defined; native-v-model-modifiers: _setText is not defined
- **@vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/31 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: dir is not a function; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

#### SFC compilation with CSS — styles included

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 64.52 / 65.65 / 65.09 | 66.40 MB | 31.89 / 31.89 / 31.89 | 1091.22 | 196.8 | 567.99 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID | 15.40 / 15.40 / 15.40 | 15.40 MB | 0.98 / 0.98 / 0.98 | 41.39 | 110.5 | 37.45 | 3 |
| fervid compileSync (1T) vdom-prod ⚠ INVALID | 15.81 / 15.81 / 15.81 | 15.91 MB | 0.83 / 0.83 / 0.83 | 42.68 | 110.1 | 38.77 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID | 16.70 / 16.70 / 16.70 | 16.84 MB | 0.90 / 0.90 / 0.90 | 38.11 | 109.3 | 34.84 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID | 17.46 / 17.46 / 17.46 | 17.52 MB | 0.89 / 0.89 / 0.89 | n/a | n/a | 17.48 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID | 18.01 / 18.01 / 18.01 | 18.07 MB | 0.82 / 0.82 / 0.82 | n/a | n/a | 16.68 | 3 |
| Verter compileMany + processStyle (render + CSS) vapor-prod ⚠ INVALID | 37.98 / 37.98 / 37.98 | 38.12 MB | 1.02 / 1.02 / 1.02 | 107.85 | 153.7 | 71.06 | 3 |
| Verter compileMany + processStyle (render + CSS) vdom-prod ⚠ INVALID | 38.01 / 38.01 / 38.01 | 38.03 MB | 1.00 / 1.00 / 1.00 | 109.07 | 155.2 | 71.13 | 3 |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID | 75.29 / 75.43 / 75.36 | 76.17 MB | 42.40 / 42.40 / 42.40 | 1498.81 | 194.9 | 765.79 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 9/31 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: old dynamic listener was not removed: expected "1", got "2"
- **fervid compileSync (1T) vdom-prod ⚠ INVALID** — Validation: INVALID — 10/31 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; scoped-slot-props: value is not defined; event-modifier-semantics: event modifiers: expected "0|2|1|1", got "0|2|2|1"
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 5/31 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Verter compileMany + processStyle (render + CSS) vapor-prod ⚠ INVALID** — Validation: INVALID — 27/31 plants did not pass: runtime-props-defaults-reactivity: _setText is not defined; define-emits-payload: _setText is not defined; native-v-model-modifiers: _setText is not defined
- **Verter compileMany + processStyle (render + CSS) vdom-prod ⚠ INVALID** — Validation: INVALID — 8/31 plants did not pass: svg-namespace-reactivity: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"; template-refs-v-for-update: itemElements.value.map is not a function
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/31 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: dir is not a function; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

### jsx-compile

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) ❔ UNVERIFIED | 10.66 / 10.66 / 10.66 | 10.69 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 7.06 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) ❔ UNVERIFIED | 10.84 / 10.84 / 10.84 | 10.91 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 6.31 | 3 |
| @vue/babel-plugin-jsx ❔ UNVERIFIED | 70.89 / 70.89 / 70.89 | 71.69 MB | 29.99 / 29.99 / 29.99 | 782.12 | 171.4 | 458.78 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **All rows** — Validation: UNVERIFIED — handler completed but has no semantic/work validation verdict

</details>

### typecheck

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize check | 14.85 / 215.56 / 114.49 | 215.84 MB | n/a | 400.00 | 54.0 | 740.34 | 3 |
| Golar typecheck | 14.87 / 378.65 / 222.20 | 385.01 MB | n/a | 3130.00 | 246.2 | 1280.84 | 3 |
| vue-tsc | 14.12 / 353.60 / 267.23 | 354.86 MB | n/a | 7920.00 | 211.5 | 3762.72 | 3 |
| verter-tsc ⚠ INVALID | 14.81 / 216.56 / 132.72 | 218.52 MB | n/a | 20.00 | 2.5 | 757.78 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **verter-tsc ⚠ INVALID** — Validation: INVALID — clean typecheck corpus unexpectedly exited 1: /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00000.vue(1,1): error TS2531: Object is possibly 'null'. /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00001.vue(1,1

</details>

### format

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 14.32 / 68.23 / 53.69 | 68.25 MB | n/a | 100.00 | 115.3 | 86.70 | 3 |
| Biome format | 0.74 / 95.44 / 58.16 | 95.56 MB | n/a | 20.00 | 24.1 | 83.82 | 3 |
| Prettier | 14.48 / 186.40 / 139.64 | 187.86 MB | n/a | 3950.00 | 171.3 | 2305.62 | 3 |
| Oxfmt | 14.26 / 684.70 / 488.86 | 689.00 MB | n/a | 130.00 | 5.2 | 2496.15 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### lint

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 31.75 / 31.75 / 31.75 | 31.87 MB | 0.47 / 0.47 / 0.47 | 101.23 | 124.5 | 81.35 | 3 |
| Vize lint (default threads) | 14.53 / 68.72 / 44.85 | 68.75 MB | n/a | 60.00 | 100.6 | 59.67 | 3 |
| Oxlint (default threads; Node host + NAPI addon) | 14.57 / 99.37 / 51.93 | 99.38 MB | n/a | 50.00 | 82.2 | 58.18 | 3 |
| Biome lint (default threads) | 2.19 / 102.45 / 74.21 | 102.86 MB | n/a | 20.00 | 16.4 | 125.87 | 3 |
| eslint-plugin-vue (1T) | 18.32 / 216.21 / 153.84 | 216.36 MB | 7.87 / 63.75 / 44.16 | 3573.53 | 166.5 | 2146.06 | 3 |

<details><summary>Notes</summary>

- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint (default threads)**, **Oxlint (default threads; Node host + NAPI addon)**, **Biome lint (default threads)** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### component-meta

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | 31.56 / 86.36 / 67.83 | 86.57 MB | 7.70 / 19.38 / 13.54 | 611.35 | 154.1 | 397.01 | 3 |
| vue-component-meta | 247.61 / 247.61 / 247.61 | 247.75 MB | 167.63 / 167.63 / 167.63 | 4060.92 | 217.7 | 1865.46 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 100.50 / 221.05 / 100.50 | 232.94 MB | 1.12 / 2.74 / 1.71 | 60.00 | 14.2 | 682.41 | 3 |
| LSP vize (server process, Node shim) | 196.74 / 280.02 / 196.74 | 284.15 MB | 0.87 / 1.78 / 1.27 | 90.00 | 13.1 | 494.59 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED | 395.37 / 535.04 / 395.37 | 556.57 MB | 0.93 / 2.69 / 1.74 | 760.00 | 10.4 | 1935.47 | 3 |

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
- vize: 0.350.2
- @vizejs/native: 0.350.2
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
- cli:vize: 0.350.2
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

