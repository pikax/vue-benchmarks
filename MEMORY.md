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

- **Generated:** 2026-07-29T15:54:33.063Z
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
| fervid compileSync (1T) vdom-prod | 16.25 / 16.25 / 16.25 | 0.77 / 0.77 / 0.77 | 40.61 | 109.3 | 36.60 | 3 |
| Vize native loop (1T) vapor-prod | 16.34 / 16.34 / 16.34 | 0.89 / 0.89 / 0.89 | 35.23 | 110.0 | 32.02 | 3 |
| Vize native loop (1T) vdom-prod | 17.48 / 17.48 / 17.48 | 0.81 / 0.81 / 0.81 | 35.17 | 110.4 | 31.80 | 3 |
| Vize native batch vapor-prod | 18.14 / 18.14 / 18.14 | 0.80 / 0.80 / 0.80 | n/a | n/a | 15.51 | 3 |
| Vize native batch vdom-prod | 18.76 / 18.76 / 18.76 | 0.73 / 0.73 / 0.73 | n/a | n/a | 15.10 | 3 |
| Verter compileMany (stateless) vapor-prod | 38.32 / 38.32 / 38.32 | 0.82 / 0.82 / 0.82 | 115.40 | 164.0 | 71.85 | 3 |
| Verter compileMany (stateless) vdom-prod | 38.37 / 38.37 / 38.37 | 0.82 / 0.82 / 0.82 | 112.43 | 161.0 | 70.20 | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 61.22 / 63.04 / 62.13 | 32.82 / 32.82 / 32.82 | 1001.64 | 194.1 | 515.29 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 62.72 / 63.27 / 62.72 | 31.73 / 31.73 / 31.73 | 1029.10 | 193.6 | 530.08 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod | 69.65 / 70.15 / 69.90 | 39.22 / 39.22 / 39.22 | 1379.17 | 192.7 | 720.26 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### jsx-compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | 10.68 / 10.68 / 10.68 | 0.34 / 0.34 / 0.34 | n/a | n/a | 6.50 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) | 10.80 / 10.80 / 10.80 | 0.32 / 0.32 / 0.32 | n/a | n/a | 6.50 | 3 |
| @vue/babel-plugin-jsx | 69.47 / 69.47 / 69.47 | 25.05 / 25.05 / 25.05 | 823.56 | 171.3 | 484.25 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### typecheck

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | 11.21 / 79.36 / 72.60 | n/a | 20.00 | 2.6 | 754.46 | 3 |
| Vize check | 10.73 / 220.12 / 144.62 | n/a | 100.00 | 28.8 | 349.17 | 3 |
| Golar typecheck | 10.95 / 379.86 / 222.61 | n/a | 3270.00 | 242.2 | 1313.51 | 3 |
| vue-tsc | 11.24 / 340.13 / 254.48 | n/a | 8090.00 | 214.4 | 3773.65 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### format

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 10.70 / 66.96 / 46.40 | n/a | 70.00 | 109.5 | 63.91 | 3 |
| Biome format | 0.72 / 96.16 / 54.88 | n/a | 30.00 | 37.1 | 80.80 | 3 |
| Prettier | 10.52 / 188.54 / 144.19 | n/a | 4550.00 | 172.9 | 2632.09 | 3 |
| Oxfmt | 10.54 / 685.62 / 501.90 | n/a | 130.00 | 5.5 | 2355.04 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### lint

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 32.61 / 32.61 / 32.61 | 0.43 / 0.43 / 0.43 | 103.96 | 123.5 | 84.17 | 3 |
| Vize lint | 11.60 / 67.16 / 46.93 | n/a | 90.00 | 145.4 | 61.92 | 3 |
| Oxlint (Node host + NAPI addon) | 10.66 / 100.18 / 54.78 | n/a | 50.00 | 84.9 | 58.92 | 3 |
| Biome lint | 0.74 / 102.20 / 84.12 | n/a | 20.00 | 11.0 | 183.21 | 3 |
| eslint-plugin-vue (1T) | 18.45 / 213.65 / 152.29 | 7.82 / 64.03 / 44.11 | 3746.18 | 166.4 | 2255.07 | 3 |

<details><summary>Notes</summary>

- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint**, **Oxlint (Node host + NAPI addon)**, **Biome lint** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### component-meta

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter ComponentMetaHost | 33.41 / 33.41 / 33.41 | 0.44 / 0.44 / 0.44 | 114.34 | 113.5 | 100.70 | 3 |
| vue-component-meta | 248.01 / 248.01 / 248.01 | 167.40 / 167.40 / 167.40 | 4199.40 | 216.7 | 1937.59 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 37.38 / 41.04 / 37.38 | 1.12 / 1.55 / 1.30 | 70.00 | 10.0 | 663.09 | 3 |
| LSP volar (server process) | 122.93 / 140.80 / 122.93 | 0.94 / 1.81 / 1.26 | 790.00 | 4.6 | 1914.15 | 3 |
| LSP vize (server process, Node shim) | 195.40 / 319.80 / 195.40 | 0.88 / 1.35 / 1.13 | 60.00 | 10.3 | 485.69 | 3 |

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
