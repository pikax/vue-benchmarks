# Memory (resource probe)

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.
> Source: `results/benchmarks/memory-linux-100.json`. Timing tables on the group pages carry this probe's Peak RSS as a column.

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-09-29T12:48:28.592Z
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
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 60.64 / 62.54 / 61.57 | 63.49 MB | 20.17 / 20.17 / 20.17 | 1037.39 | 196.0 | 534.82 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 61.16 / 62.87 / 62.01 | 63.79 MB | 19.76 / 19.76 / 19.76 | 1041.45 | 196.5 | 529.87 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID | 21.48 / 21.48 / 21.48 | 21.58 MB | 0.83 / 0.83 / 0.83 | 57.95 | 276.9 | 20.50 | 3 |
| Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID | 23.52 / 23.52 / 23.52 | 23.75 MB | 0.86 / 0.86 / 0.86 | 62.50 | 298.5 | 20.35 | 3 |
| Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID | 45.21 / 45.21 / 45.21 | 45.32 MB | 0.82 / 0.82 / 0.82 | 156.52 | 193.9 | 83.61 | 3 |
| Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID | 45.95 / 45.95 / 45.95 | 46.14 MB | 0.88 / 0.88 / 0.88 | 164.84 | 184.7 | 89.24 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID | 70.81 / 70.81 / 70.81 | 71.44 MB | 40.20 / 40.20 / 40.20 | 1440.34 | 194.0 | 743.76 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 6/33 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"
- **Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 6/33 plants did not pass: template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; template-refs-v-for-update: initial v-for template refs: expected "a,b", got ""
- **Verter compileMany (stateless raw render) vdom-prod ⚠ INVALID** — Validation: INVALID — 7/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Verter compileMany (stateless raw render) vapor-prod ⚠ INVALID** — Validation: INVALID — 15/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined
- **@vue/compiler-sfc 3.6 vapor (1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/33 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: directive mounted binding: expected "first|status|true|true", got undefined; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

#### SFC compilation with CSS — styles included

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference (render + CSS, 1T) vdom-prod | 63.58 / 65.38 / 64.17 | 65.52 MB | 31.81 / 31.81 / 31.81 | 1125.88 | 196.4 | 575.90 | 3 |
| fervid compileSync (1T) vdom-prod ⚠ INVALID | 15.79 / 15.79 / 15.79 | 15.81 MB | 0.84 / 0.84 / 0.84 | 42.43 | 108.2 | 39.25 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID | 19.10 / 19.10 / 19.10 | 19.20 MB | 0.97 / 0.97 / 0.97 | 47.44 | 107.1 | 44.27 | 3 |
| Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID | 20.31 / 20.31 / 20.31 | 20.39 MB | 1.02 / 1.02 / 1.02 | 50.16 | 107.2 | 46.20 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID | 21.58 / 21.58 / 21.58 | 21.63 MB | 0.86 / 0.86 / 0.86 | 63.79 | 309.2 | 19.98 | 3 |
| Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID | 23.72 / 23.72 / 23.72 | 23.88 MB | 0.93 / 0.93 / 0.93 | 65.98 | 312.8 | 21.09 | 3 |
| Verter compileMany + style transform (render + CSS) vdom-prod ⚠ INVALID | 47.37 / 47.37 / 47.37 | 47.56 MB | 1.03 / 1.03 / 1.03 | 172.11 | 209.9 | 82.00 | 3 |
| Verter compileMany + style transform (render + CSS) vapor-prod ⚠ INVALID | 48.25 / 48.25 / 48.25 | 48.48 MB | 1.09 / 1.09 / 1.09 | 174.63 | 203.5 | 85.98 | 3 |
| Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID | 77.89 / 77.89 / 77.89 | 78.61 MB | 42.71 / 42.71 / 42.71 | 1532.83 | 193.8 | 791.04 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **fervid compileSync (1T) vdom-prod ⚠ INVALID** — Validation: INVALID — 10/33 plants did not pass: object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined; scoped-slot-props: value is not defined; event-modifier-semantics: event modifiers: expected "0|2|1|1", got "0|2|2|1"
- **Vize compileSfc loop (render + CSS, 1T) vdom-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vdom-prod ⚠ INVALID** — Validation: INVALID — 6/33 plants did not pass: runtime-props-defaults-reactivity: reactive props: expected "updated:7", got "fallback:2"; reactive-props-destructure-shadowing: shadowing after prop update: expected "updated|parameter|arrow", got "outer|parameter|arrow"; reactive-props-destructure-alias-default: aliased prop and computed update: expected "next|next:7", got "fallback|fallback:2"
- **Vize compileSfc loop (render + CSS, 1T) vapor-prod ⚠ INVALID**, **Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) vapor-prod ⚠ INVALID** — Validation: INVALID — 6/33 plants did not pass: template-ref-define-expose: Cannot read properties of null (reading 'tagName'); dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; template-refs-v-for-update: initial v-for template refs: expected "a,b", got ""
- **Verter compileMany + style transform (render + CSS) vdom-prod ⚠ INVALID** — Validation: INVALID — 7/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; dynamic-event-name-handler-removal: initial dynamic event: expected "1", got "0"
- **Verter compileMany + style transform (render + CSS) vapor-prod ⚠ INVALID** — Validation: INVALID — 15/33 plants did not pass: reactive-props-destructure-shadowing: lexical shadowing: expected "outer|parameter|arrow", got "|parameter|arrow"; reactive-props-destructure-alias-default: destructure defaults: expected "fallback|fallback:2", got "|fallback:2"; object-dynamic-bindings-events: initial v-bind object: expected "first", got undefined
- **Vue compiler-sfc 3.6 reference (render + CSS, 1T) vapor-prod ⚠ INVALID** — Validation: INVALID — 3/33 plants did not pass: dynamic-event-name-handler-removal: _ctx.currentHandler is not a function; custom-directive-value-argument-modifiers: directive mounted binding: expected "first|status|true|true", got undefined; v-memo-dependency-gating: memoized subtree skipped: expected "0", got "1"

</details>

### jsx-compile

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) ❔ UNVERIFIED | 11.01 / 11.01 / 11.01 | 11.13 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 6.58 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) ❔ UNVERIFIED | 11.41 / 11.41 / 11.41 | 11.41 MB | 0.35 / 0.35 / 0.35 | n/a | n/a | 6.69 | 3 |
| @vue/babel-plugin-jsx ❔ UNVERIFIED | 75.79 / 75.92 / 75.86 | 77.58 MB | 32.89 / 32.89 / 32.89 | 849.39 | 171.5 | 487.27 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **All rows** — Validation: UNVERIFIED — handler completed but has no semantic/work validation verdict

</details>

### typecheck

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize check | 13.79 / 230.98 / 127.04 | 231.10 MB | n/a | 450.00 | 52.1 | 853.42 | 3 |
| Golar typecheck | 14.55 / 373.52 / 222.91 | 374.49 MB | n/a | 3190.00 | 242.0 | 1326.27 | 3 |
| vue-tsc | 14.21 / 354.54 / 267.90 | 355.41 MB | n/a | 8210.00 | 209.9 | 3910.78 | 3 |
| verter-tsc ⚠ INVALID | 13.91 / 442.74 / 234.57 | 446.23 MB | n/a | 20.00 | 0.9 | 2175.94 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **verter-tsc ⚠ INVALID** — Validation: INVALID — clean typecheck corpus unexpectedly exited 1: /home/runner/work/vue-benchmarks/vue-benchmarks/work/memory/typecheck/mem-tc-100/Comp00008.vue(17,8): error TS2339: Property '$slots' does not exist on type 'Omit<{ $props: VNodeProps & AllowedComponentProps & ComponentCustomProps & { id?:

</details>

### format

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 14.50 / 70.28 / 56.42 | 70.28 MB | n/a | 100.00 | 110.5 | 90.53 | 3 |
| Biome format | 2.25 / 94.44 / 57.78 | 94.51 MB | n/a | 30.00 | 35.9 | 82.66 | 3 |
| Prettier | 14.16 / 188.60 / 139.49 | 188.68 MB | n/a | 4070.00 | 167.9 | 2375.34 | 3 |
| Oxfmt | 14.49 / 680.39 / 491.84 | 681.91 MB | n/a | 150.00 | 5.9 | 2514.85 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

</details>

### lint

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (default threads) | 14.52 / 73.76 / 49.71 | 73.84 MB | n/a | 90.00 | 136.5 | 67.69 | 3 |
| Oxlint (default threads; Node host + NAPI addon) | 14.07 / 98.77 / 55.94 | 98.84 MB | n/a | 40.00 | 71.3 | 58.38 | 3 |
| Verter host lint | 65.75 / 65.75 / 65.75 | 65.79 MB | 0.53 / 0.53 / 0.53 | 331.69 | 105.7 | 313.80 | 3 |
| Biome lint (default threads) | 1.95 / 100.96 / 76.99 | 103.07 MB | n/a | 20.00 | 15.3 | 130.64 | 3 |
| eslint-plugin-vue (1T) | 17.07 / 213.20 / 151.93 | 215.71 MB | 7.34 / 67.24 / 46.55 | 3715.74 | 164.5 | 2260.88 | 3 |

<details><summary>Notes</summary>

- **Vize lint (default threads)**, **Oxlint (default threads; Node host + NAPI addon)**, **Biome lint (default threads)** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### component-meta

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | 31.93 / 127.09 / 95.32 | 128.37 MB | 10.02 / 31.78 / 20.90 | 1247.41 | 134.9 | 929.14 | 3 |
| vue-component-meta | 247.16 / 247.16 / 247.16 | 248.34 MB | 168.52 / 168.52 / 168.52 | 4110.82 | 217.0 | 1899.55 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.6) | 89.49 / 202.80 / 89.49 | 273.39 MB | 1.13 / 2.59 / 1.63 | 260.00 | 13.5 | 545.01 | 3 |
| LSP vize (server process, Node shim) | 181.26 / 266.52 / 181.26 | 266.66 MB | 0.88 / 1.79 / 1.28 | 90.00 | 13.2 | 490.57 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) ❔ UNVERIFIED | 394.78 / 532.84 / 394.78 | 557.57 MB | 0.92 / 2.65 / 1.72 | 780.00 | 10.7 | 1929.75 | 3 |

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
- vize: 0.429.1
- @vizejs/native: 0.429.1
- @verter/native: 0.0.1-beta.6
- @fervid/napi: 0.4.1
- verter-tsc: 0.0.1-beta.6
- @verter/component-meta: 0.0.1-beta.6
- verter-lsp: 0.0.1-beta.6
- verter-mcp: 0.0.1-beta.6
- @vue/language-server: 3.3.11
- @vue/typescript-plugin: 3.3.11
- typescript-language-server: 6.0.1
- vue-tsc: 3.3.11
- vue-component-meta: 3.3.11
- golar: 0.1.10
- @golar/vue: 0.1.10
- prettier: 3.9.9
- oxfmt: 0.71.0
- oxlint: 1.86.0
- eslint-plugin-vue: 10.11.1
- @biomejs/biome: 2.5.14
- typescript: 6.0.3
- cli:vize: 0.429.1
- cli:vue-tsc: 6.0.3
- cli:verter-tsc: 0.0.1-beta.6
- cli:golar: 0.1.10
- cli:prettier: 3.9.9
- cli:oxfmt: 0.71.0
- cli:oxlint: 1.86.0
- cli:biome: 2.5.14
- vue-jsx-vapor: 3.2.25
- @vue-jsx-vapor/compiler-rs: 3.2.25
- @vue/babel-plugin-jsx: 3.0.0
- @babel/core: 8.0.6

