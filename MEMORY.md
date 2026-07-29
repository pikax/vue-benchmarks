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

> Auto-updated 2026-07-27 from the **Benchmark** workflow (**Linux** resource probe). Commit uses `[skip ci]`.

#### Linux · source: `memory-linux-100.md`

# Resource probe results (memory + allocations + CPU)

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-07-27T17:25:01.521Z
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
| Vize native loop (1T) vapor-prod | 16.44 / 16.44 / 16.44 | 0.89 / 0.89 / 0.89 | 34.02 | 110.0 | 30.89 | 3 |
| Vize native loop (1T) vdom-prod | 17.63 / 17.70 / 17.70 | 0.81 / 0.81 / 0.81 | 34.34 | 110.0 | 32.14 | 3 |
| Vize native batch vapor-prod | 18.14 / 18.14 / 18.14 | 0.80 / 0.80 / 0.80 | n/a | n/a | 15.20 | 3 |
| Vize native batch vdom-prod | 18.70 / 18.70 / 18.70 | 0.73 / 0.73 / 0.73 | n/a | n/a | 14.99 | 3 |
| Verter compileMany (stateless) vapor-prod | 38.44 / 38.44 / 38.44 | 0.82 / 0.82 / 0.82 | 112.28 | 166.0 | 67.96 | 3 |
| Verter compileMany (stateless) vdom-prod | 38.46 / 38.46 / 38.46 | 0.82 / 0.82 / 0.82 | 112.23 | 161.5 | 69.94 | 3 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod | 61.65 / 62.37 / 62.27 | 32.78 / 32.78 / 32.78 | 1038.61 | 190.7 | 547.09 | 3 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod | 62.13 / 63.35 / 62.74 | 31.74 / 31.74 / 31.74 | 1033.41 | 193.8 | 533.23 | 3 |
| @vue/compiler-sfc 3.6 vapor (1T) vapor-prod | 70.09 / 70.11 / 70.10 | 39.16 / 39.16 / 39.16 | 1339.36 | 193.0 | 694.89 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### jsx-compile

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | 10.68 / 10.68 / 10.68 | 0.34 / 0.34 / 0.34 | n/a | n/a | 6.49 | 3 |
| @vue-jsx-vapor/compiler-rs (vapor) | 10.77 / 10.77 / 10.77 | 0.32 / 0.32 / 0.32 | n/a | n/a | 6.75 | 3 |
| @vue/babel-plugin-jsx | 65.59 / 65.59 / 65.59 | 25.04 / 25.04 / 25.04 | 801.22 | 171.3 | 466.12 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### typecheck

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | 12.91 / 79.50 / 72.59 | n/a | 10.00 | 1.4 | 740.08 | 3 |
| Vize check | 12.93 / 218.15 / 140.49 | n/a | 90.00 | 28.0 | 321.57 | 3 |
| Golar typecheck | 12.11 / 376.91 / 224.23 | n/a | 3100.00 | 250.6 | 1235.40 | 3 |
| vue-tsc | 12.91 / 343.71 / 257.53 | n/a | 8360.00 | 220.8 | 3786.21 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### format

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 12.55 / 65.37 / 45.58 | n/a | 70.00 | 110.7 | 57.30 | 3 |
| Prettier | 12.54 / 188.28 / 143.12 | n/a | 4270.00 | 173.2 | 2465.55 | 3 |
| Oxfmt | 11.04 / 689.45 / 501.70 | n/a | 120.00 | 5.2 | 2305.07 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### lint

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 32.48 / 32.48 / 32.48 | 0.45 / 0.45 / 0.45 | 102.43 | 124.1 | 82.54 | 3 |
| Vize lint | 10.45 / 66.71 / 45.93 | n/a | 80.00 | 133.8 | 59.79 | 3 |
| eslint-plugin-vue (1T) | 18.41 / 213.33 / 151.99 | 7.81 / 63.66 / 44.32 | 3645.48 | 165.4 | 2204.36 | 3 |

<details><summary>Notes</summary>

- **Verter host lint**, **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint** — RSS = child tree; CPU total from /proc when available (Linux)

</details>

### component-meta

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter ComponentMetaHost | 33.49 / 33.49 / 33.49 | 0.44 / 0.44 / 0.44 | 110.49 | 113.9 | 96.97 | 3 |
| vue-component-meta | 251.37 / 251.37 / 251.37 | 176.16 / 176.16 / 176.16 | 4475.84 | 224.1 | 1988.39 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### lsp

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 27.26 / 34.70 / 27.26 | 1.12 / 1.56 / 1.31 | 50.00 | 9.8 | 582.86 | 3 |
| LSP volar (server process) | 122.88 / 140.86 / 122.88 | 0.94 / 1.78 / 1.26 | 760.00 | 3.8 | 1896.16 | 3 |
| LSP vize (server process, Node shim) | 141.43 / 230.75 / 141.43 | 0.88 / 1.35 / 1.13 | 50.00 | 13.1 | 330.14 | 3 |

<details><summary>Notes</summary>

- **All rows** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. NOTE: for Volar this covers the Vue server only — its tsserver half is a separate, larger process and is NOT included.

</details>

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
- @babel/core: 8.0.1

<!-- MEMORY_RESULTS_END -->
