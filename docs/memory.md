# Memory (resource probe)

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.
> Source: `results/benchmarks/memory-linux-100.json`. Timing tables on the group pages carry this probe's Peak RSS as a column.

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-08-27T10:17:27.135Z
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
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 59.77 / 61.89 / 60.83 | 62.16 MB | 19.57 / 19.57 / 19.57 | 1009.43 | 196.9 | 512.65 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 60.76 / 62.58 / 61.67 | 63.73 MB | 19.90 / 19.90 / 19.90 | 1013.12 | 199.1 | 508.40 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID | 17.39 / 17.39 / 17.39 | 17.45 MB | 0.81 / 0.81 / 0.81 | n/a | n/a | 18.64 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID | 17.95 / 17.95 / 17.95 | 18.09 MB | 0.85 / 0.85 / 0.85 | n/a | n/a | 18.26 | 3 |
| Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID | 35.57 / 35.57 / 35.57 | 35.69 MB | 0.80 / 0.80 / 0.80 | 100.23 | 148.3 | 67.88 | 3 |
| Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID | 35.86 / 35.86 / 35.86 | 35.92 MB | 0.82 / 0.82 / 0.82 | 98.30 | 153.6 | 64.00 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID | 70.33 / 70.33 / 70.33 | 71.07 MB | 39.86 / 39.86 / 39.86 | 1339.06 | 195.0 | 686.62 | 3 |

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
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 63.05 / 63.81 / 63.43 | 66.90 MB | 31.76 / 31.76 / 31.76 | 1113.99 | 191.3 | 576.24 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID | 15.59 / 15.59 / 15.59 | 15.74 MB | 0.93 / 0.93 / 0.93 | 42.71 | 107.9 | 39.46 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID | 15.68 / 15.68 / 15.68 | 15.68 MB | 0.98 / 0.98 / 0.98 | 44.40 | 109.7 | 40.46 | 3 |
| fervid compileSync (1T) vdom-prod ⚠ INVALID | 15.87 / 15.87 / 15.87 | 15.88 MB | 0.83 / 0.83 / 0.83 | 42.31 | 108.3 | 38.86 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID | 17.54 / 17.54 / 17.54 | 17.64 MB | 0.84 / 0.84 / 0.84 | n/a | n/a | 18.31 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID | 18.02 / 18.02 / 18.02 | 18.46 MB | 0.89 / 0.89 / 0.89 | 58.43 | 285.9 | 18.55 | 3 |
| Verter compileMany + processStyle (render + CSS) vdom-prod ⚠ INVALID | 37.84 / 37.84 / 37.84 | 38.04 MB | 1.00 / 1.00 / 1.00 | 107.55 | 151.6 | 70.57 | 3 |
| Verter compileMany + processStyle (render + CSS) vapor-prod ⚠ INVALID | 37.92 / 37.92 / 37.92 | 38.36 MB | 1.02 / 1.02 / 1.02 | 106.78 | 159.1 | 68.95 | 3 |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID | 75.98 / 76.05 / 76.05 | 78.03 MB | 42.46 / 42.46 / 42.46 | 1507.25 | 195.4 | 772.48 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 5/31 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; object-dynamic-bindings-events: initial dynamic argument: expected "idle", got undefined; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 9/31 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: old dynamic listener was not removed: expected "1", got "2"
- **fervid compileSync (1T) vdom-prod ⚠ INVALID** — Validation: INVALID — 10/31 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; scoped-slot-props: value is not defined; event-modifier-semantics: event modifiers: expected "0|2|1|1", got "0|2|2|1"
- **Verter compileMany + processStyle (render + CSS) vdom-prod ⚠ INVALID** — Validation: INVALID — 8/31 plants did not pass: svg-namespace-reactivity: reactive SVG attribute: expected "9", got "4"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"; template-refs-v-for-update: itemElements.value.map is not a function
- **Verter compileMany + processStyle (render + CSS) vapor-prod ⚠ INVALID** — Validation: INVALID — 27/31 plants did not pass: runtime-props-defaults-reactivity: _setText is not defined; define-emits-payload: _setText is not defined; native-v-model-modifiers: _setText is not defined
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/31 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: dir is not a function; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

### jsx-compile

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) ❔ UNVERIFIED | 10.64 / 10.64 / 10.64 | 10.79 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 5.97 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) ❔ UNVERIFIED | 10.82 / 10.82 / 10.82 | 10.89 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 6.32 | 3 |
| @vue/babel-plugin-jsx ❔ UNVERIFIED | 68.41 / 69.36 / 68.89 | 70.25 MB | 24.73 / 24.73 / 24.73 | 766.96 | 171.9 | 445.23 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **All rows** — Validation: UNVERIFIED — handler completed but has no semantic/work validation verdict

</details>

### typecheck

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize check | 14.31 / 209.88 / 111.17 | 213.41 MB | n/a | 400.00 | 53.8 | 725.56 | 3 |
| Golar typecheck | 14.36 / 379.34 / 220.01 | 379.74 MB | n/a | 3180.00 | 236.4 | 1324.15 | 3 |
| vue-tsc | 14.37 / 351.59 / 262.23 | 351.76 MB | n/a | 7980.00 | 210.0 | 3802.32 | 3 |
| verter-tsc ⚠ INVALID | 14.35 / 217.08 / 132.41 | 217.33 MB | n/a | 20.00 | 2.5 | 793.84 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **verter-tsc ⚠ INVALID** — Validation: INVALID — clean typecheck corpus unexpectedly exited 1: /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00000.vue(1,1): error TS2531: Object is possibly 'null'. /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00001.vue(1,1

</details>

### format

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 14.52 / 67.16 / 53.73 | 67.21 MB | n/a | 100.00 | 117.0 | 82.07 | 3 |
| Biome format | 2.18 / 95.89 / 60.60 | 96.07 MB | n/a | 30.00 | 36.8 | 80.19 | 3 |
| Prettier | 14.35 / 186.93 / 137.83 | 198.02 MB | n/a | 3980.00 | 169.1 | 2352.75 | 3 |
| Oxfmt | 14.33 / 675.74 / 500.20 | 686.14 MB | n/a | 140.00 | 5.7 | 2472.48 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### lint

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 31.61 / 31.61 / 31.61 | 31.78 MB | 0.46 / 0.46 / 0.46 | 100.68 | 123.1 | 81.28 | 3 |
| Vize lint (default threads) | 14.53 / 67.98 / 45.39 | 67.99 MB | n/a | 70.00 | 120.1 | 57.77 | 3 |
| Oxlint (default threads; Node host + NAPI addon) | 14.58 / 99.21 / 53.44 | 99.25 MB | n/a | 50.00 | 85.1 | 58.72 | 3 |
| Biome lint (default threads) | 1.88 / 102.44 / 76.88 | 102.61 MB | n/a | 20.00 | 16.5 | 121.44 | 3 |
| eslint-plugin-vue (1T) | 18.11 / 214.32 / 152.58 | 215.57 MB | 7.88 / 130.01 / 62.17 | 3571.61 | 166.7 | 2147.41 | 3 |

<details><summary>Notes</summary>

- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint (default threads)**, **Oxlint (default threads; Node host + NAPI addon)**, **Biome lint (default threads)** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### component-meta

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | 32.21 / 89.94 / 70.60 | 89.96 MB | 7.82 / 23.52 / 15.66 | 630.21 | 154.0 | 409.31 | 3 |
| vue-component-meta | 247.73 / 247.73 / 247.73 | 248.25 MB | 167.64 / 167.64 / 167.64 | 4049.78 | 217.5 | 1867.80 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 103.84 / 219.69 / 103.84 | 224.47 MB | 1.14 / 2.74 / 1.66 | 40.00 | 14.2 | 638.90 | 3 |
| LSP vize (server process, Node shim) | 168.21 / 256.47 / 168.21 | 256.61 MB | 0.85 / 1.74 / 1.26 | 80.00 | 13.9 | 434.61 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED | 394.47 / 531.57 / 394.47 | 558.31 MB | 0.94 / 2.66 / 1.72 | 770.00 | 10.6 | 1917.74 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED** — Validation: UNVERIFIED — script/template hover validity=true; resource sampler covers only @vue/language-server, not its required TypeScript-server half

</details>

### Versions

- node: v22.23.2
- vue: 3.5.42
- vue-36: 3.6.0-rc.5
- @vue/compiler-sfc: 3.5.42
- @vue/compiler-sfc-36: 3.6.0-rc.5
- vize: 0.387.0
- @vizejs/native: 0.387.0
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
- oxfmt: 0.65.0
- oxlint: 1.80.0
- eslint-plugin-vue: 10.10.0
- @biomejs/biome: 2.5.10
- typescript: 6.0.3
- cli:vize: 0.387.0
- cli:vue-tsc: 6.0.3
- cli:verter-tsc: 0.0.1-beta.3
- cli:golar: 0.1.10
- cli:prettier: 3.9.6
- cli:oxfmt: 0.65.0
- cli:oxlint: 1.80.0
- cli:biome: 2.5.10
- vue-jsx-vapor: 3.2.22
- @vue-jsx-vapor/compiler-rs: 3.2.22
- @vue/babel-plugin-jsx: 3.0.0
- @babel/core: 8.0.1

