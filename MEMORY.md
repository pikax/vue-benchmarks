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

> Auto-updated 2026-07-29 from the **Benchmark** workflow (**Linux** resource probe). Commit uses `[skip ci]`.

#### Linux · source: `memory-linux-100.md`

# Resource probe results (memory + allocations + CPU)

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-07-29T15:04:20.657Z
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
| Vize native loop (1T) vapor-prod | 16.34 / 16.34 / 16.34 | 0.89 / 0.89 / 0.89 | 33.67 | 111.0 | 30.35 | 3 |
| fervid compileSync (1T) vdom-prod | 16.45 / 16.45 / 16.45 | 0.77 / 0.77 / 0.77 | 40.44 | 109.3 | 37.50 | 3 |
| Vize native loop (1T) vdom-prod | 17.70 / 17.70 / 17.70 | 0.81 / 0.81 / 0.81 | 33.99 | 111.0 | 31.25 | 3 |
| Vize native batch vapor-prod | 18.15 / 18.15 / 18.15 | 0.80 / 0.80 / 0.80 | n/a | n/a | 14.83 | 3 |
| Vize native batch vdom-prod | 18.82 / 18.82 / 18.82 | 0.73 / 0.73 / 0.73 | n/a | n/a | 15.39 | 3 |
| Verter compileMany (stateless) vapor-prod | 38.46 / 38.46 / 38.46 | 0.82 / 0.82 / 0.82 | 107.43 | 159.2 | 67.57 | 3 |
| Verter compileMany (stateless) vdom-prod | 38.47 / 38.47 / 38.47 | 0.82 / 0.82 / 0.82 | 110.53 | 153.0 | 69.87 | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 60.78 / 62.56 / 61.67 | 32.79 / 32.79 / 32.79 | 949.24 | 199.1 | 478.01 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 62.44 / 63.13 / 62.95 | 28.27 / 28.27 / 28.27 | 944.90 | 201.0 | 470.06 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod | 70.68 / 71.17 / 70.94 | 38.67 / 38.67 / 38.67 | 1304.79 | 198.6 | 657.10 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### jsx-compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | 10.68 / 10.68 / 10.68 | 0.34 / 0.34 / 0.34 | n/a | n/a | 6.75 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) | 10.80 / 10.80 / 10.80 | 0.32 / 0.32 / 0.32 | n/a | n/a | 5.96 | 3 |
| @vue/babel-plugin-jsx | 73.91 / 74.04 / 73.97 | 29.51 / 29.51 / 29.51 | 770.10 | 172.4 | 454.04 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### typecheck

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | 8.27 / 79.32 / 71.93 | n/a | 20.00 | 2.9 | 680.19 | 3 |
| Vize check | 8.02 / 219.98 / 138.05 | n/a | 100.00 | 31.0 | 329.90 | 3 |
| Golar typecheck | 7.70 / 379.21 / 223.53 | n/a | 2970.00 | 250.2 | 1177.03 | 3 |
| vue-tsc | 8.27 / 335.66 / 256.18 | n/a | 7790.00 | 209.2 | 3723.10 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### format

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 8.20 / 66.96 / 44.67 | n/a | 70.00 | 109.3 | 62.51 | 3 |
| Biome format | 0.20 / 94.78 / 54.56 | n/a | 20.00 | 25.3 | 80.81 | 3 |
| Prettier | 8.14 / 188.47 / 144.74 | n/a | 4270.00 | 175.9 | 2428.13 | 3 |
| Oxfmt | 8.08 / 688.22 / 503.82 | n/a | 130.00 | 5.9 | 2185.34 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### lint

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 32.57 / 32.57 / 32.57 | 0.47 / 0.47 / 0.47 | 102.44 | 125.9 | 81.76 | 3 |
| Vize lint | 8.13 / 67.24 / 44.76 | n/a | 90.00 | 140.7 | 63.11 | 3 |
| Oxlint (Node host + NAPI addon) | 8.33 / 100.19 / 50.89 | n/a | 40.00 | 69.4 | 57.66 | 3 |
| Biome lint | 0.19 / 102.30 / 82.94 | n/a | 30.00 | 16.4 | 183.23 | 3 |
| eslint-plugin-vue (1T) | 18.37 / 214.57 / 152.97 | 7.83 / 134.45 / 63.10 | 3544.04 | 167.4 | 2117.30 | 3 |

<details><summary>Notes</summary>

- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint**, **Oxlint (Node host + NAPI addon)**, **Biome lint** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### component-meta

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter ComponentMetaHost | 33.57 / 33.57 / 33.57 | 0.44 / 0.44 / 0.44 | 109.70 | 113.5 | 96.66 | 3 |
| vue-component-meta | 247.49 / 247.49 / 247.49 | 179.21 / 179.21 / 179.21 | 3959.73 | 220.6 | 1808.93 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 26.93 / 31.15 / 26.93 | 1.13 / 1.54 / 1.31 | 40.00 | 9.2 | 563.37 | 3 |
| LSP volar (server process) | 122.63 / 141.04 / 122.63 | 0.94 / 1.83 / 1.25 | 760.00 | 4.1 | 1824.48 | 3 |
| LSP vize (server process, Node shim) | 196.17 / 319.34 / 196.17 | 0.88 / 1.35 / 1.14 | 50.00 | 10.0 | 447.88 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. NOTE: for Volar this covers the Vue server only — its tsserver half is a separate, larger process and is NOT included.

</details>

### Versions

- node: v22.23.1
- vue: 3.5.40
- @vue/compiler-sfc: 3.5.40
- @vue/compiler-sfc-36: 3.6.0-rc.2
- vize: 0.302.0
- @vizejs/native: 0.302.0
- @verter/native: 0.0.1-beta.3
- @fervid/napi: 0.4.1
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
- oxlint: 1.76.0
- @biomejs/biome: 2.5.6
- typescript: 6.0.3
- cli:vize: 0.302.0
- cli:vue-tsc: 6.0.3
- cli:verter-tsc: 0.0.1-beta.3
- cli:golar: 0.1.10
- cli:prettier: 3.9.6
- cli:oxfmt: 0.61.0
- cli:oxlint: 1.76.0
- cli:biome: 2.5.6
- vue-jsx-vapor: 3.2.19
- @vue-jsx-vapor/compiler-rs: 3.2.19
- @vue/babel-plugin-jsx: 3.0.0
- @babel/core: 8.0.1

<!-- MEMORY_RESULTS_END -->
