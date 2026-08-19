# Resource probe (memory + allocations + CPU)

Isolated from timing benchmarks: each tool runs in its **own process** so RSS, allocation proxies, and CPU time are not mixed with sibling tools or the speed suite.

| Metric | CLI tools | In-process (NAPI / eslint / ...) |
| --- | --- | --- |
| **RSS min/max/avg** | Child WorkingSet / RSS | RSS during work minus GC baseline |
| **Alloc min/max/avg** | Linux: n/a (RSS only); Windows private bytes when run locally | V8 `heapUsed` delta |
| **CPU total / %** | Process CPU when available | `process.cpuUsage()` |
| **Wall** | Elapsed while the tool ran | Same |

**CI:** Linux (`ubuntu-latest`) only, via the **Benchmark** workflow (`memory` job, manual dispatch). Results below are auto-committed on a `main` dispatch with `[skip ci]`.

Once published, each block below states the platform it came from and carries a per-row **Samples** column. `⚠` on a sample count means that row recorded **fewer** samples than were requested — its numbers rest on less evidence than its neighbours.

### Reading these numbers

- **One table per surface, one cell per metric.** RSS and Alloc are rendered `min / max / avg` in a single cell. Status is a marker on the tool name — **❌** error · **⏭** skipped — and per-row detail is in the collapsible **Notes** under each table, where a note shared by every row is written once. `n/a` means the platform cannot measure that number; `–` means the row never ran.
- **Rows from different platforms are not comparable.** Each block names its own source platform; the banner names every platform spliced. Published figures are the Linux ones.
- **The `Alloc` column is not available for CLI tools on Linux.** The probe samples private bytes only on Windows (`scripts/memory-worker.mjs`); on Linux a CLI row reports RSS and CPU, and `Alloc` is `n/a`. An `Alloc` figure on a CLI row in a block labelled Linux is not a Linux measurement — treat the block as mislabelled rather than the number as real.
- **⚠ Volar's LSP rows cover the Vue server only.** Vue language-tools v3 is two processes; the probe samples one pid, and the tsserver half is the larger of the two. Volar's LSP memory is therefore a **lower bound on the Vue half**, not Volar's footprint — while the LSP *timing* tables in the README charge Volar **both** processes. Vize and Verter are single-process, so their rows cover the whole tool. The collapsible **Notes** under each table carries this warning as emitted by the probe.

Local:

```bash
pnpm bench:memory:small
pnpm bench:memory
node --expose-gc scripts/bench-memory.mjs --fixture fixtures/200 --file-limit 100 --samples 3
```

<!-- MEMORY_RESULTS_START -->

> Auto-updated 2026-08-19 from the **Benchmark** workflow (**Linux** resource probe). Commit uses `[skip ci]`.

#### Linux · source: `memory-linux-100.md`

# Resource probe results (memory + allocations + CPU)

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-08-19T18:33:50.705Z
- **Fixture:** `fixtures/200`
- **Samples per tool:** 3 requested · 3 recorded for every row (see the **Samples** column)
- **File limit:** 100 (typecheck 100, meta 50)

One table per surface. Each metric is one `min / max / avg` cell; status is a marker on the name (❌ error · ⏭ skipped) and per-row detail is under **Notes** below each table. `n/a` = not measurable on this platform; `–` = the row never ran.

### Metrics

| Column | Meaning |
| --- | --- |
| **RSS min/max/avg** | Resident set: CLI = child WorkingSet/RSS; in-process = delta vs GC baseline |
| **Alloc min/max/avg** | In-process: V8 `heapUsed` delta; CLI (Windows): private bytes (`PrivateMemorySize64`) |
| **CPU total / %** | Process CPU time (user+system) and % of wall time on one core (`cpu/wall×100`) |
| **Samples** | Samples that actually produced data for that row; ⚠ = fewer than requested |

### compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize native loop (1T) vapor-prod | 15.16 / 15.16 / 15.16 | 0.94 / 0.94 / 0.94 | 30.72 | 111.7 | 27.33 | 3 |
| fervid compileSync (1T) vdom-prod | 15.93 / 15.93 / 15.93 | 0.77 / 0.77 / 0.77 | 30.15 | 111.8 | 28.32 | 3 |
| Vize native loop (1T) vdom-prod | 16.65 / 16.65 / 16.65 | 0.87 / 0.87 / 0.87 | 27.86 | 111.6 | 25.56 | 3 |
| Vize native batch vapor-prod | 17.43 / 17.43 / 17.43 | 0.84 / 0.84 / 0.84 | n/a | n/a | 13.61 | 3 |
| Vize native batch vdom-prod | 18.11 / 18.11 / 18.11 | 0.77 / 0.77 / 0.77 | n/a | n/a | 12.27 | 3 |
| Verter compileMany (stateless) vapor-prod | 37.71 / 37.71 / 37.71 | 0.83 / 0.83 / 0.83 | 88.95 | 142.1 | 61.15 | 3 |
| Verter compileMany (stateless) vdom-prod | 37.84 / 37.84 / 37.84 | 0.82 / 0.82 / 0.82 | 86.56 | 142.2 | 59.29 | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 60.83 / 62.65 / 61.74 | 32.40 / 32.40 / 32.40 | 777.23 | 207.2 | 374.65 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 62.34 / 62.87 / 62.66 | 30.60 / 30.60 / 30.60 | 770.00 | 209.1 | 368.21 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod | 70.91 / 71.75 / 71.33 | 38.93 / 38.93 / 38.93 | 1056.19 | 206.8 | 517.14 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### jsx-compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | 10.66 / 10.66 / 10.66 | 0.36 / 0.36 / 0.36 | n/a | n/a | 4.50 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) | 10.82 / 10.82 / 10.82 | 0.35 / 0.35 / 0.35 | n/a | n/a | 5.36 | 3 |
| @vue/babel-plugin-jsx | 67.89 / 67.89 / 67.89 | 24.59 / 24.59 / 24.59 | 642.52 | 178.2 | 360.64 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### typecheck

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize check | 13.17 / 211.50 / 129.29 | n/a | 170.00 | 39.5 | 430.64 | 3 |
| verter-tsc | 13.16 / 214.81 / 132.59 | n/a | 10.00 | 1.9 | 537.84 | 3 |
| Golar typecheck | 13.13 / 382.57 / 223.50 | n/a | 2430.00 | 250.8 | 977.44 | 3 |
| vue-tsc | 12.96 / 353.81 / 263.79 | n/a | 6450.00 | 220.0 | 2932.38 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### format

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 14.61 / 67.95 / 44.20 | n/a | 50.00 | 97.4 | 51.34 | 3 |
| Biome format | 2.15 / 95.85 / 57.58 | n/a | 10.00 | 15.7 | 63.76 | 3 |
| Prettier | 13.13 / 186.23 / 139.99 | n/a | 3170.00 | 177.3 | 1782.09 | 3 |
| Oxfmt | 13.10 / 685.33 / 490.28 | n/a | 90.00 | 4.8 | 1872.36 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### lint

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 31.65 / 31.65 / 31.65 | 0.47 / 0.47 / 0.47 | 81.23 | 114.2 | 73.06 | 3 |
| Vize lint | 13.84 / 68.45 / 45.22 | n/a | 70.00 | 133.0 | 51.49 | 3 |
| Oxlint (Node host + NAPI addon) | 14.64 / 99.35 / 51.49 | n/a | 40.00 | 86.5 | 47.09 | 3 |
| Biome lint | 1.95 / 103.19 / 83.26 | n/a | 10.00 | 7.3 | 137.66 | 3 |
| eslint-plugin-vue (1T) | 18.48 / 213.32 / 152.01 | 7.85 / 129.60 / 62.04 | 2806.74 | 174.4 | 1609.01 | 3 |

<details><summary>Notes</summary>

- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint**, **Oxlint (Node host + NAPI addon)**, **Biome lint** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### component-meta

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter ComponentMetaHost | 33.52 / 33.52 / 33.52 | 0.44 / 0.44 / 0.44 | 95.37 | 108.2 | 88.65 | 3 |
| vue-component-meta | 243.66 / 243.78 / 243.72 | 174.74 / 174.74 / 174.74 | 3248.90 | 227.2 | 1432.36 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 69.63 / 223.09 / 69.63 | 1.13 / 2.74 / 1.68 | 20.00 | 8.1 | 582.78 | 3 |
| LSP volar (server process) | 122.42 / 140.17 / 122.42 | 0.96 / 2.03 / 1.37 | 570.00 | 4.3 | 1377.19 | 3 |
| LSP vize (server process, Node shim) | 226.40 / 276.09 / 226.40 | 0.88 / 2.58 / 1.49 | 60.00 | 7.7 | 728.32 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. NOTE: for Volar this covers the Vue server only — its tsserver half is a separate, larger process and is NOT included.

</details>

### Versions

- node: v22.23.2
- vue: 3.5.41
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

<!-- MEMORY_RESULTS_END -->
