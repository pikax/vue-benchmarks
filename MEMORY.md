# Resource probe (memory + allocations + CPU)

Isolated from timing benchmarks: each tool runs in its **own process** so RSS, allocation proxies, and CPU time are not mixed with sibling tools or the speed suite.

| Metric                | CLI tools                                                     | In-process (NAPI / eslint / ...)  |
| --------------------- | ------------------------------------------------------------- | --------------------------------- |
| **RSS min/max/avg**   | Child WorkingSet / RSS                                        | RSS during work minus GC baseline |
| **Alloc min/max/avg** | Linux: n/a (RSS only); Windows private bytes when run locally | V8 `heapUsed` delta               |
| **CPU total / %**     | Process CPU when available                                    | `process.cpuUsage()`              |
| **Wall**              | Elapsed while the tool ran                                    | Same                              |

**CI:** Linux (`ubuntu-latest`) only, via the **Benchmark** workflow (`memory` job, manual dispatch). Results below are auto-committed on a `main` dispatch with `[skip ci]`.

Once published, each block below states the platform it came from and carries a per-row **Samples** column. `⚠` on a sample count means that row recorded **fewer** samples than were requested — its numbers rest on less evidence than its neighbours.

### Reading these numbers

- **Rows from different platforms are not comparable.** Each block names its own source platform; the banner names every platform spliced. Published figures are the Linux ones.
- **The `Alloc` column is not available for CLI tools on Linux.** The probe samples private bytes only on Windows (`scripts/memory-worker.mjs`); on Linux a CLI row reports RSS and CPU, and `Alloc` is `n/a`. An `Alloc` figure on a CLI row in a block labelled Linux is not a Linux measurement — treat the block as mislabelled rather than the number as real.
- **⚠ Volar's LSP rows cover the Vue server only.** Vue language-tools v3 is two processes; the probe samples one pid, and the tsserver half is the larger of the two. Volar's LSP memory is therefore a **lower bound on the Vue half**, not Volar's footprint — while the LSP *timing* tables in the README charge Volar **both** processes. Vize and Verter are single-process, so their rows cover the whole tool. The `Notes` column on each row carries this warning as emitted by the probe.

Local:

```bash
pnpm bench:memory:small
pnpm bench:memory
node --expose-gc scripts/bench-memory.mjs --fixture fixtures/200 --file-limit 100 --samples 3
```

<!-- MEMORY_RESULTS_START -->

> Auto-updated 2026-07-27 from the **Benchmark** workflow (**Linux** resource probe). Commit uses `[skip ci]`.

#### Linux · source: `memory-linux-100.md`

# Resource probe results (memory + allocations + CPU)

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-07-27T17:11:25.760Z
- **Fixture:** `fixtures/200`
- **Samples per tool:** 3 requested · 3 recorded for every row (see the **Samples** column)
- **File limit:** 100 (typecheck 100, meta 50)

### Metrics

| Column | Meaning |
| --- | --- |
| **RSS min/max/avg** | Resident set: CLI = child WorkingSet/RSS; in-process = delta vs GC baseline |
| **Alloc min/max/avg** | In-process: V8 `heapUsed` delta; CLI (Windows): private bytes (`PrivateMemorySize64`) |
| **CPU total / %** | Process CPU time (user+system) and % of wall time on one core (`cpu/wall×100`) |

### compile

| Tool | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms | Notes | Samples |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Vize native loop (1T) vapor-prod | ok | 16.34 | 16.46 | 16.40 | 0.89 | 0.89 | 0.89 | 35.55 | 108.8 | 31.87 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| Vize native loop (1T) vdom-prod | ok | 17.48 | 17.48 | 17.48 | 0.81 | 0.81 | 0.81 | 38.08 | 108.8 | 34.98 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| Vize native batch vapor-prod | ok | 18.14 | 18.14 | 18.14 | 0.80 | 0.80 | 0.80 | n/a | n/a | 14.96 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| Vize native batch vdom-prod | ok | 18.63 | 18.63 | 18.63 | 0.73 | 0.73 | 0.73 | n/a | n/a | 17.31 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| Verter compileMany (stateless) vdom-prod | ok | 38.39 | 38.39 | 38.39 | 0.82 | 0.82 | 0.82 | 113.25 | 149.4 | 75.78 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| Verter compileMany (stateless) vapor-prod | ok | 38.40 | 38.40 | 38.40 | 0.82 | 0.82 | 0.82 | 114.33 | 161.9 | 70.61 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | ok | 61.91 | 63.31 | 62.38 | 32.71 | 32.71 | 32.71 | 1012.31 | 193.8 | 519.65 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | ok | 61.66 | 63.23 | 62.39 | 31.60 | 31.60 | 31.60 | 982.06 | 196.0 | 504.86 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod | ok | 72.49 | 73.01 | 72.78 | 39.13 | 39.13 | 39.13 | 1347.39 | 191.7 | 710.93 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |

### jsx-compile

| Tool | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms | Notes | Samples |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | ok | 10.65 | 10.65 | 10.65 | 0.34 | 0.34 | 0.34 | n/a | n/a | 6.13 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) | ok | 10.80 | 10.80 | 10.80 | 0.32 | 0.32 | 0.32 | n/a | n/a | 6.29 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| @vue/babel-plugin-jsx | ok | 78.88 | 78.88 | 78.88 | 36.11 | 36.11 | 36.11 | 830.07 | 159.4 | 521.42 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |

### typecheck

| Tool | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms | Notes | Samples |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| verter-tsc | ok | 10.46 | 79.28 | 72.27 | n/a | n/a | n/a | 20.00 | 2.7 | 741.66 | RSS = child tree; CPU total from /proc when available (Linux) | 3 |
| Vize check | ok | 10.85 | 212.08 | 134.20 | n/a | n/a | n/a | 90.00 | 28.3 | 318.28 | RSS = child tree; CPU total from /proc when available (Linux) | 3 |
| Golar typecheck | ok | 11.11 | 371.71 | 214.88 | n/a | n/a | n/a | 3130.00 | 249.5 | 1270.54 | RSS = child tree; CPU total from /proc when available (Linux) | 3 |
| vue-tsc | ok | 10.72 | 323.29 | 245.99 | n/a | n/a | n/a | 8380.00 | 215.5 | 3887.88 | RSS = child tree; CPU total from /proc when available (Linux) | 3 |

### format

| Tool | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms | Notes | Samples |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Vize fmt | ok | 12.25 | 65.41 | 45.64 | n/a | n/a | n/a | 60.00 | 102.8 | 58.35 | RSS = child tree; CPU total from /proc when available (Linux) | 3 |
| Prettier | ok | 11.17 | 189.69 | 144.18 | n/a | n/a | n/a | 4380.00 | 173.2 | 2528.59 | RSS = child tree; CPU total from /proc when available (Linux) | 3 |
| Oxfmt | ok | 11.61 | 687.39 | 496.78 | n/a | n/a | n/a | 120.00 | 5.3 | 2253.57 | RSS = child tree; CPU total from /proc when available (Linux) | 3 |

### lint

| Tool | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms | Notes | Samples |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Verter host lint | ok | 32.49 | 32.49 | 32.49 | 0.43 | 0.43 | 0.43 | 102.94 | 123.7 | 83.17 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| Vize lint | ok | 10.63 | 66.80 | 46.34 | n/a | n/a | n/a | 80.00 | 139.1 | 58.79 | RSS = child tree; CPU total from /proc when available (Linux) | 3 |
| eslint-plugin-vue (1T) | ok | 18.44 | 213.76 | 152.30 | 7.81 | 63.31 | 43.77 | 3596.50 | 165.4 | 2180.85 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |

### component-meta

| Tool | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms | Notes | Samples |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Verter ComponentMetaHost | ok | 33.30 | 33.30 | 33.30 | 0.44 | 0.44 | 0.44 | 107.28 | 113.0 | 95.16 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |
| vue-component-meta | ok | 237.02 | 237.02 | 237.02 | 158.67 | 158.67 | 158.67 | 4341.27 | 221.9 | 1953.07 | RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker | 3 |

### lsp

| Tool | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms | Notes | Samples |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| LSP volar (server process) | ok | 122.67 | 141.23 | 122.67 | 0.95 | 1.77 | 1.26 | 760.00 | 4.2 | 1826.23 | RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. NOTE: for Volar this covers the Vue server only — its tsserver half is a separate, larger process and is NOT included. | 3 |
| LSP vize (server process, Node shim) | ok | 134.65 | 210.30 | 134.65 | 0.89 | 1.35 | 1.13 | 50.00 | 13.4 | 324.06 | RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. NOTE: for Volar this covers the Vue server only — its tsserver half is a separate, larger process and is NOT included. | 3 |
| LSP verter (server process, npm 0.0.1-beta.3) | error | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | node:events:497       throw er; // Unhandled 'error' event       ^  Error: spawn /home/runner/work/vue-benchmarks/vue-benchmarks/node_modules/.pnpm/@verter+lsp-linux-x64-gnu@0.0.1-beta.3/node_modules/@verter/lsp-linux-x64-gnu/verter-lsp EACCES     at ChildProcess._handle.onexit (node:internal/child_process:285:19)     at onErrorNT (node:internal/child_process:483:16)     at process.processTicksAndRejections (node:internal/process/task_queues:89:21) Emitted 'error' event on LspClient instance at:     at ChildProcess.<anonymous> (file:///home/runner/work/vue-benchmarks/vue-benchmarks/scripts/lib/lsp-client.mjs:36:42)     at ChildProcess.emit (node:events:519:28)     at ChildProcess._handle.onexit (node:internal/child_process:291:12)     at onErrorNT (node:internal/child_process:483:16)     at process.processTicksAndRejections (node:internal/process/task_queues:89:21) {   errno: -13,   code: 'EACCES',   syscall: 'spawn /home/runner/work/vue-benchmarks/vue-benchmarks/node_modules/.pnpm/@verter+lsp-linux-x64-gnu@0.0.1-beta.3/node_modules/@verter/lsp-linux-x64-gnu/verter-lsp',   path: '/home/runner/work/vue-benchmarks/vue-benchmarks/node_modules/.pnpm/@verter+lsp-linux-x64-gnu@0.0.1-beta.3/node_modules/@verter/lsp-linux-x64-gnu/verter-lsp',   spawnargs: [     '/home/runner/work/vue-benchmarks/vue-benchmarks/fixtures/lsp-workspace'   ] }  Node.js v22.23.1 | n/a |

### Versions

- node: v22.23.1
- vue: 3.5.40
- @vue/compiler-sfc: 3.5.40
- @vue/compiler-sfc-36: 3.6.0-rc.2
- vize: 0.291.0
- @vizejs/native: 0.291.0
- @verter/native: 0.0.1-beta.3
- verter-tsc: 0.0.1-beta.3
- @verter/component-meta: 0.0.1-beta.3
- verter-lsp: 0.0.1-beta.3
- verter-mcp: 0.0.1-beta.3
- @vue/language-server: 3.3.8
- @vue/typescript-plugin: 3.3.8
- typescript-language-server: 5.3.0
- vue-tsc: 3.3.8
- vue-component-meta: 3.3.8
- golar: 0.1.10
- @golar/vue: 0.1.10
- prettier: 3.9.6
- oxfmt: 0.61.0
- typescript: 5.9.3
- cli:vize: 0.291.0
- cli:vue-tsc: 5.9.3
- cli:verter-tsc: 0.0.1-beta.3
- cli:golar: 0.1.10
- cli:prettier: 3.9.6
- cli:oxfmt: 0.61.0
- vue-jsx-vapor: 3.2.19
- @vue-jsx-vapor/compiler-rs: 3.2.19
- @vue/babel-plugin-jsx: 3.0.0
- @babel/core: 7.29.7

<!-- MEMORY_RESULTS_END -->
