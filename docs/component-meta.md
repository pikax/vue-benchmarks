# Component-meta

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-08-20T14:33:30.648Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`523d7bf`](https://github.com/pikax/vue-benchmarks/commit/523d7bfad95408f88bd6db210f9a0b106f8662e2)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/32379826142
- **Source:** `results/benchmarks/bench-Linux-200-bench.json`

## Results

Ranked on the **median of measured runs**. Warm series follow ≥1 discarded warmup and are the primary ordering and ranking metric wherever both series exist. Compiler and Component-meta additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup and package imports. It is not called Cold and its ratio/noise gate never substitutes for Warm. What else the child excludes differs by surface and each surface states it in its own methodology — Compiler builds its compiler host outside the timer, Component-meta builds its checker/session inside it, because its warm timer does too. Every table sorts fastest-first and every ratio column is **vs fastest** — the fastest ranked row is the 1.00x denominator; no tool is pinned as a reference. One table per surface unless that surface declares explicit work-equivalence classes; engine, invocation and threading are row properties, not implicit table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three warm samples is bracketed as TOO NOISY TO RANK, no tool exempted (a two-run spread has no third sample to adjudicate, so it is flagged, not bracketed). Per-row detail is under **Notes** below each table.

> **Peak RSS** on a timing row is the tool's peak resident set: measured in the timed session where the runner samples it (LSP servers, real-world CLIs), otherwise injected from the isolated memory probe below — the probe runs each tool in its own process, separate from timing.

### Component-meta

Files: **100** · Bytes: **142,771**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vize component-meta ⏭**: No dedicated public component-meta API found on vize/@vizejs/native (declaration emit is a different surface and is not substituted).

</details>

##### Component public-API metadata — concurrent (every request in flight)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/component-meta-bench-linux-200-bench-component-meta-component-pu-03bmemk-dark.svg">
  <img alt="Component-meta — Component public-API metadata — concurrent (every request in flight)" src="charts/component-meta-bench-linux-200-bench-component-meta-component-pu-03bmemk.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Meta members | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta (Promise.all) ⚠ | (2.24 s) | (2.23 s) | (14.0 ms) | (0.6%) | not ranked | (932.2 ms) | (816.4 ms) | (156.6 ms) | (16.8%) | not ranked | (1,343) | – |
| @verter/component-meta (Promise.all) ⚠ | (491.1 ms) | (482.3 ms) | (6.7 ms) | (1.4%) | not ranked | (470.1 ms) | (464.0 ms) | (48.4 ms) | (10.3%) | not ranked | (88) | – |
| @verter/component-meta (getComponentMetaBatch) ⚠ | (325.2 ms) | (323.4 ms) | (1.6 ms) | (0.5%) | not ranked | (275.6 ms) | (265.7 ms) | (51.4 ms) | (18.6%) | not ranked | (88) | – |

<details><summary>Notes</summary>

- **vue-component-meta (Promise.all) ⚠**: createChecker(tsconfig) + Promise.all over getComponentMeta for each .vue file. getComponentMeta is SYNCHRONOUS: every request is issued before any is awaited, but a synchronous API cannot overlap them — the event loop serialises the whole fan-out on one thread. Read this row as the cost of fanning out a sync API, never as a parallel result. ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props.value: missing; options-api-component: events.increment: missing; events.reset: missing.
- **@verter/component-meta (Promise.all) ⚠**: openComponentMetaSession(root, tsconfig) + Promise.all over getComponentMeta for each .vue file, so the whole corpus is in flight at once against one session; no updateFile overlay. In-flight count equals the corpus size, so this number is corpus-dependent by construction. ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props-destructure: props.count: expected hasDefault; props.verbose: expected hasDefault. ⚠ COMPARISON REFERENCE INVALID: the official Vue component-meta baseline did not pass mandatory validation.
- **@verter/component-meta (getComponentMetaBatch) ⚠**: openComponentMetaSession(root, tsconfig) + a SINGLE getComponentMetaBatch(files) call — one scheduler dispatch with the host-owned admission caches shared across the batch, rather than N independent requests; no updateFile overlay. ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props-destructure: props.count: expected hasDefault; props.verbose: expected hasDefault. ⚠ COMPARISON REFERENCE INVALID: the official Vue component-meta baseline did not pass mandatory validation.

</details>

##### Component public-API metadata

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/component-meta-bench-linux-200-bench-component-meta-component-pu-02zecon-dark.svg">
  <img alt="Component-meta — Component public-API metadata" src="charts/component-meta-bench-linux-200-bench-component-meta-component-pu-02zecon.svg">
</picture>

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs fastest fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs fastest warm | Meta members | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta ⚠ | (2.26 s) | (2.25 s) | (8.9 ms) | (0.4%) | not ranked | (910.5 ms) | (832.7 ms) | (166.2 ms) | (18.3%) | not ranked | (1,343) | – | (247.8 MB) |
| @verter/component-meta ⚠ | (495.0 ms) | (484.6 ms) | (4.7 ms) | (1.0%) | not ranked | (465.9 ms) | (453.7 ms) | (12.2 ms) | (2.6%) | not ranked | (88) | – | (86.6 MB) |

<details><summary>Notes</summary>

- **vue-component-meta ⚠**: createChecker(tsconfig) + getComponentMeta for each .vue file ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props.value: missing; options-api-component: events.increment: missing; events.reset: missing.
- **@verter/component-meta ⚠**: openComponentMetaSession(root, tsconfig) + disk-backed getComponentMeta for each .vue file; no updateFile overlay ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props-destructure: props.count: expected hasDefault; props.verbose: expected hasDefault. ⚠ COMPARISON REFERENCE INVALID: the official Vue component-meta baseline did not pass mandatory validation.

</details>

<details><summary>Methodology</summary>

- Extract component public API metadata (props/events/slots where supported).
- Same subset of .vue files for every available tool.
- Schema depth and TypeScript program options may differ by tool — timings are throughput, not equivalence.
- Every tool is driven through its own published entry point. No payload is hand-decoded, and no row is measured through an API it does not ship.
- TWO INDEPENDENT SERIES per row. Fresh child: one NEW process per sample, which builds its checker (or opens its session) for the first time inside the timer — the cost of extracting metadata once, as an editor or a one-shot CI job pays it. Warm: the shared benchmark process after a discarded pass — the cost of extracting again. Warm remains the primary ranking metric; the fresh-child column is ranked separately and never substituted for it.
- A fresh child imports ONLY its own row's benchmarked package. Importing all three would keep the others' startup out of the timer while still letting their native initialization change the allocator and thread-pool state the row is measured in.
- The fresh-child child process is spawned before the warm pass runs, so the warm pass cannot be what warmed the OS page cache for it. Node startup, package import and project materialisation are outside the child's timer; checker/session construction is inside it, because it is inside the warm timer too. OS page and filesystem caches are NOT flushed and no wholly-cold runtime is claimed.
- The two paths are checked for ADAPTER PARITY: same adapter options hash, same input count, same materialised member count. A row whose fresh-child and warm passes disagree keeps both timings but is UNRANKED — a cold number produced from a different workload is a second benchmark, not this row's cold reading.
- TWO WORK-EQUIVALENCE CLASSES, and no ratio crosses between them. SEQUENTIAL asks what it costs to extract metadata for the corpus one request at a time. CONCURRENT asks what the same corpus costs when EVERY request is issued before any is awaited — the in-flight count equals the corpus size, so this is a stress reading and is corpus-dependent by construction. Within the concurrent class the workload is identical to the sequential one (same files, same materialised members, same open/evict cycle per iteration); only the issuing strategy differs, which is the whole of what the class measures.
- THE OFFICIAL VUE CONCURRENT ROW IS NOT A PARALLEL RESULT. vue-component-meta's getComponentMeta is SYNCHRONOUS: Promise.all issues every request up front but cannot overlap them, so the event loop runs the whole fan-out on one thread. It is published because the class needs its official Vue reference and because fanning out this API is a real thing callers do — not as evidence about parallel throughput. Every row's threading and invocation model is stated on the row itself, so a ratio is always read next to what produced it.
- The concurrent rows are gated through THEIR OWN plant runs, not the sequential verdict. `getComponentMetaBatch` is a method the sequential plants never call, and issuing every scalar request at once is exactly the condition under which a shared scheduler or admission cache could return a different answer — a concurrency bug that corrupts metadata is the most valuable thing this class can find, so each entry point earns its own isolated child.
- The batch row is published only when the installed package actually exports `getComponentMetaBatch`. It is never substituted by a hand-rolled fan-out: a row measured through an API the package does not ship is not that package's number. Its returned slot count is checked against the input count inside the timer, so a short array shows up as a failure rather than as a fast row with a smaller member count.
- POST-TIMING SEMANTIC GATE: suite 2026-08-20.2 runs 29 existing component-meta cases in one isolated child per exact row. Vue creates one checker over a disk-backed tsconfig and calls getComponentMeta for every planted disk file. Verter opens one published session over the same disk-backed project and calls getComponentMeta for every file without updateFile overlays. Named props/events/slots/exposed members, coarse type facts, requiredness, defaults and deliberate absence are scored by one tool-neutral oracle; output objects and type strings are never byte-compared. FAIL, crash, missing verdict and UNKNOWN remain measured but UNRANKED, and a failed official Vue baseline invalidates the class.
- Each row reports the meta members it materialised. The counts are NOT equivalent between tools and no threshold is applied to them: on this corpus most generated SFCs declare no macros, and the tools differ on whether a component with no declared API still has implicit members. Read the member counts alongside the times rather than treating the ratio as like-for-like.
- Tool order is ROTATED on every warmup and measured run (not merely alternated), so no tool keeps a fixed position in the sequence. Fresh-child samples use a paired forward/reverse schedule, which balances row position over any complete pair even when fewer runs than rows were requested; the executed order is retained in JSON.
- Tools without a real component-meta API are reported as skipped (no substitute workload).

Raw runs:

- **vue-component-meta (Promise.all)**: Fresh child (first timed row workload): 2.26 s, 2.26 s, 2.24 s, 2.24 s, 2.23 s · Warm: 958.7 ms, 1.22 s, 857.5 ms, 932.2 ms, 816.4 ms
- **@verter/component-meta (Promise.all)**: Fresh child (first timed row workload): 489.7 ms, 491.1 ms, 491.3 ms, 501.0 ms, 482.3 ms · Warm: 479.6 ms, 464.8 ms, 464.0 ms, 577.0 ms, 470.1 ms
- **@verter/component-meta (getComponentMetaBatch)**: Fresh child (first timed row workload): 325.2 ms, 323.4 ms, 325.8 ms, 324.9 ms, 327.9 ms · Warm: 387.9 ms, 265.7 ms, 277.7 ms, 275.2 ms, 275.6 ms
- **vue-component-meta**: Fresh child (first timed row workload): 2.25 s, 2.28 s, 2.26 s, 2.26 s, 2.26 s · Warm: 988.9 ms, 910.5 ms, 869.5 ms, 1.25 s, 832.7 ms
- **@verter/component-meta**: Fresh child (first timed row workload): 495.8 ms, 495.2 ms, 495.0 ms, 494.8 ms, 484.6 ms · Warm: 465.9 ms, 472.9 ms, 486.3 ms, 453.7 ms, 462.9 ms

</details>

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

pass **76** · fail **11** · warn **0** · skip **0**

| Case | vue-component-meta | verter-component-meta | vize-declaration-meta |
| --- | :---: | :---: | :---: |
| `attr-name-normalization` | ✓ | ✓ | ✓ |
| `basic-props` | ✓ | ✓ | ✓ |
| `complex-defaults` | ✓ | ✓ | **✗** |
| `define-model` | ✓ | ✓ | **✗** |
| `define-model-modifiers` | ✓ | ✓ | **✗** |
| `define-options` | ✓ | ✓ | ✓ |
| `emits-multi-payload` | ✓ | ✓ | ✓ |
| `emits-overloads` | ✓ | ✓ | ✓ |
| `emits-runtime-validators` | ✓ | ✓ | ✓ |
| `emits-type-alias` | ✓ | ✓ | **✗** |
| `enum-props` | ✓ | ✓ | ✓ |
| `events-emits` | ✓ | ✓ | ✓ |
| `expose` | ✓ | ✓ | **✗** |
| `expose-ref-computed` | ✓ | ✓ | ✓ |
| `external-props-import` | ✓ | ✓ | **✗** |
| `full-api` | ✓ | ✓ | ✓ |
| `generic-props` | ✓ | ✓ | **✗** |
| `interface-extends-props` | ✓ | ✓ | **✗** |
| `no-declared-api` | ✓ | ✓ | ✓ |
| `options-api-component` | **✗** | ✓ | **✗** |
| `prop-type-factory-defaults` | ✓ | ✓ | ✓ |
| `props-destructure` | ✓ | **✗** | ✓ |
| `recursive-props` | ✓ | ✓ | ✓ |
| `runtime-props` | ✓ | ✓ | ✓ |
| `script-mixed-blocks` | ✓ | ✓ | ✓ |
| `slots` | ✓ | ✓ | ✓ |
| `slots-generic-optional` | ✓ | ✓ | ✓ |
| `union-intersection-props` | ✓ | ✓ | ✓ |
| `with-defaults` | ✓ | ✓ | ✓ |

<details><summary>Failure detail</summary>

- `complex-defaults` · **vize-declaration-meta** — generateDeclaration emitted unparseable TypeScript: '>' expected. (near "export type Props = <{ items?: string[]; config?: { r"); ';' expected. (near "rmatter?: (value: number) => string; }>; export type Emits = {}; export type S"); Expression expected. (near "matter?: (value: number) => string; }>; export type Emits = {}; export type Sl")
- `define-model` · **vize-declaration-meta** — props.modelValue: missing; props.count: missing; events.update:modelValue: missing; events.update:count: missing
- `define-model-modifiers` · **vize-declaration-meta** — props.modelValue: missing; props.page: missing; events.update:modelValue: missing; events.update:page: missing
- `emits-type-alias` · **vize-declaration-meta** — events.update:modelValue: missing; events.blur: missing; events.commit: missing
- `expose` · **vize-declaration-meta** — capability gap — generateDeclaration does not emit defineExpose members
- `external-props-import` · **vize-declaration-meta** — props.name: missing; props.hint: missing; props.value: missing
- `generic-props` · **vize-declaration-meta** — generateDeclaration emitted unparseable TypeScript: '>' expected. (near "rops&lt;T extends { id: number } = any> = <{ items: T[]; selected?: T; keyOf:"); ';' expected. (near "cted?: T; keyOf: (row: T) => string; }>; export type Emits&lt;T extends { id: num"); Expression expected. (near "ted?: T; keyOf: (row: T) => string; }>; export type Emits&lt;T extends { id: numb")
- `interface-extends-props` · **vize-declaration-meta** — props.id: missing; props.disabled: missing; props.modelValue: missing; props.maxLength: missing
- `options-api-component` · **vue-component-meta** — events.increment: missing; events.reset: missing
- `options-api-component` · **vize-declaration-meta** — props.label: missing; props.step: missing
- `props-destructure` · **verter-component-meta** — props.count: expected hasDefault; props.verbose: expected hasDefault

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | 31.56 / 86.36 / 67.83 | 7.70 / 19.38 / 13.54 | 611 | 154.1 | 397 | 3 |
| vue-component-meta | 247.61 / 247.61 / 247.61 | 167.63 / 167.63 / 167.63 | 4061 | 217.7 | 1865 | 3 |

<details><summary>Notes</summary>

- **@verter/component-meta** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **vue-component-meta** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

## Tool versions

<details><summary>Every pinned package in this run</summary>

| Package | Version |
| --- | --- |
| node | v22.23.2 |
| vue | 3.5.41 |
| vue-36 | 3.6.0-rc.4 |
| @vue/compiler-sfc | 3.5.41 |
| @vue/compiler-sfc-36 | 3.6.0-rc.4 |
| vize | 0.350.2 |
| @vizejs/native | 0.350.2 |
| @verter/native | 0.0.1-beta.3 |
| @fervid/napi | 0.4.1 |
| verter-tsc | 0.0.1-beta.3 |
| @verter/component-meta | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| verter-mcp | 0.0.1-beta.3 |
| @vue/language-server | 3.3.10 |
| @vue/typescript-plugin | 3.3.10 |
| typescript-language-server | 5.3.0 |
| vue-tsc | 3.3.10 |
| vue-component-meta | 3.3.10 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.6 |
| oxfmt | 0.64.0 |
| oxlint | 1.79.0 |
| eslint-plugin-vue | 10.10.0 |
| @biomejs/biome | 2.5.9 |
| typescript | 6.0.3 |
| cli:vize | 0.350.2 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.64.0 |
| cli:oxlint | 1.79.0 |
| cli:biome | 2.5.9 |
| vue-jsx-vapor | 3.2.21 |
| @vue-jsx-vapor/compiler-rs | 3.2.21 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

</details>
