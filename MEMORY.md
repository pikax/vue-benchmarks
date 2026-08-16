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

> Auto-updated 2026-08-16 from the **Benchmark** workflow (**Linux** resource probe). Commit uses `[skip ci]`.

#### Linux · source: `memory-linux-100.md`

# Resource probe results (memory + allocations + CPU)

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-08-16T09:12:42.658Z
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
| Vize native loop (1T) vapor-prod | 15.34 / 15.34 / 15.34 | 0.91 / 0.91 / 0.91 | 29.52 | 110.2 | 26.79 | 3 |
| fervid compileSync (1T) vdom-prod | 16.07 / 16.07 / 16.07 | 0.77 / 0.77 / 0.77 | 30.43 | 110.2 | 27.67 | 3 |
| Vize native loop (1T) vdom-prod | 16.84 / 16.84 / 16.84 | 0.84 / 0.84 / 0.84 | 29.53 | 111.9 | 26.39 | 3 |
| Vize native batch vapor-prod | 17.48 / 17.48 / 17.48 | 0.84 / 0.84 / 0.84 | n/a | n/a | 13.05 | 3 |
| Vize native batch vdom-prod | 18.09 / 18.09 / 18.09 | 0.77 / 0.77 / 0.77 | n/a | n/a | 12.60 | 3 |
| Verter compileMany (stateless) vdom-prod | 38.19 / 38.19 / 38.19 | 0.82 / 0.82 / 0.82 | 84.81 | 143.1 | 59.58 | 3 |
| Verter compileMany (stateless) vapor-prod | 38.19 / 38.19 / 38.19 | 0.82 / 0.82 / 0.82 | 83.46 | 144.3 | 57.50 | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 61.17 / 62.87 / 62.02 | 32.53 / 32.53 / 32.53 | 758.01 | 196.3 | 386.14 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 61.70 / 63.53 / 62.62 | 31.06 / 31.06 / 31.06 | 748.90 | 200.7 | 373.38 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod | 71.11 / 71.52 / 71.31 | 39.06 / 39.06 / 39.06 | 1020.72 | 200.0 | 510.27 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### jsx-compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (vapor) | 11.16 / 11.16 / 11.16 | 0.35 / 0.35 / 0.35 | n/a | n/a | 4.93 | 3 |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | 11.28 / 11.28 / 11.28 | 0.36 / 0.36 / 0.36 | n/a | n/a | 4.66 | 3 |
| @vue/babel-plugin-jsx | 74.45 / 74.45 / 74.45 | 29.78 / 29.78 / 29.78 | 623.68 | 173.4 | 354.33 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### typecheck

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | 7.33 / 79.52 / 72.29 | n/a | 10.00 | 1.9 | 538.14 | 3 |
| Vize check | 7.52 / 204.61 / 109.26 | n/a | 330.00 | 58.0 | 568.90 | 3 |
| Golar typecheck | 7.27 / 373.71 / 222.37 | n/a | 2330.00 | 248.1 | 938.94 | 3 |
| vue-tsc | 7.27 / 354.80 / 264.00 | n/a | 6230.00 | 211.0 | 2952.71 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### format

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 9.65 / 67.84 / 46.21 | n/a | 50.00 | 99.3 | 50.52 | 3 |
| Biome format | 1.97 / 95.09 / 56.17 | n/a | 20.00 | 32.0 | 60.39 | 3 |
| Prettier | 7.39 / 188.85 / 140.01 | n/a | 3000.00 | 174.5 | 1676.90 | 3 |
| Oxfmt | 9.39 / 697.32 / 508.00 | n/a | 100.00 | 5.9 | 1705.28 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### lint

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 31.57 / 31.57 / 31.57 | 0.49 / 0.49 / 0.49 | 78.44 | 125.2 | 62.69 | 3 |
| Vize lint | 9.27 / 68.09 / 44.58 | n/a | 60.00 | 122.3 | 49.67 | 3 |
| Oxlint (Node host + NAPI addon) | 9.97 / 100.41 / 52.07 | n/a | 40.00 | 88.7 | 45.09 | 3 |
| Biome lint | 2.14 / 102.81 / 80.53 | n/a | 20.00 | 14.9 | 131.20 | 3 |
| eslint-plugin-vue (1T) | 18.29 / 213.73 / 152.33 | 7.79 / 129.83 / 61.89 | 2732.24 | 168.9 | 1605.51 | 3 |

<details><summary>Notes</summary>

- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint**, **Oxlint (Node host + NAPI addon)**, **Biome lint** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### component-meta

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter ComponentMetaHost | 33.54 / 33.54 / 33.54 | 0.44 / 0.44 / 0.44 | 84.79 | 113.9 | 74.42 | 3 |
| vue-component-meta | 248.35 / 248.35 / 248.35 | 179.47 / 179.47 / 179.47 | 3075.50 | 219.5 | 1401.09 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 27.11 / 32.31 / 27.11 | 1.13 / 1.50 / 1.34 | 30.00 | 8.5 | 440.22 | 3 |
| LSP vize (server process, Node shim) | 70.88 / 73.56 / 70.88 | 0.83 / 1.44 / 1.08 | 60.00 | 7.2 | 440.97 | 3 |
| LSP volar (server process) | 122.54 / 140.67 / 122.54 | 0.94 / 1.72 / 1.21 | 580.00 | 3.6 | 1403.93 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. NOTE: for Volar this covers the Vue server only — its tsserver half is a separate, larger process and is NOT included.

</details>

### Versions

- node: v22.23.2
- vue: 3.5.41
- @vue/compiler-sfc: 3.5.41
- @vue/compiler-sfc-36: 3.6.0-rc.4
- vize: 0.347.7
- @vizejs/native: 0.347.7
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
- oxfmt: 0.63.0
- oxlint: 1.78.0
- @biomejs/biome: 2.5.8
- typescript: 6.0.3
- cli:vize: 0.347.7
- cli:vue-tsc: 6.0.3
- cli:verter-tsc: 0.0.1-beta.3
- cli:golar: 0.1.10
- cli:prettier: 3.9.6
- cli:oxfmt: 0.63.0
- cli:oxlint: 1.78.0
- cli:biome: 2.5.8
- vue-jsx-vapor: 3.2.21
- @vue-jsx-vapor/compiler-rs: 3.2.21
- @vue/babel-plugin-jsx: 3.0.0
- @babel/core: 8.0.1

<!-- MEMORY_RESULTS_END -->
