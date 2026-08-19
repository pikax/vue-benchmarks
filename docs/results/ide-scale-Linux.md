# Ubuntu/Linux · ide ops

> Full report for `ide-scale-Linux.md` — every table, collapsed block (methodology, gate notes, raw runs) that the
> [README](../../README.md) landing page charts link here for. Auto-generated; do not edit.

## IDE operation results

- **Generated:** 2026-08-16T09:14:33.058Z
- **Runner:** linux/x64 · Node v22.23.2
- **Runs / warmups:** 3 / 1

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

### IDE · scale

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### Time-to-usable @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **390.5 ms** | 388.3 ms | 14.9 ms | 3.8% | 1.00x | 21 | n/a |
| Volar (N) | **993.4 ms** | 976.5 ms | 17.0 ms | 1.7% | 2.54x | 21 | n/a |
| Volar (JS) | **1.57 s** | 1.55 s | 17.5 ms | 1.1% | 4.03x | 21 | n/a |
| Verter ⚠ | (317.4 ms) | (187.3 ms) | – | – | not ranked | (21) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter ⚠**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | ⚠ TOO NOISY TO RANK — CV 54.5% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 415.2 ms, 390.5 ms, 388.3 ms
- **Volar (N)**: 993.4 ms, 976.5 ms, 1.01 s
- **Volar (JS)**: 1.55 s, 1.59 s, 1.57 s
- **Verter**: 187.3 ms, 572.1 ms, 317.4 ms

</details>

#### Completion @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.1 ms | 15.9% ⚠ | 1.00x | 7 | n/a |
| Verter | **136.6 ms** | 112.0 ms | 15.5 ms | 11.9% ⚠ | 273.87x | 7 | n/a |
| Volar (N) | **146.0 ms** | 127.0 ms | 11.2 ms | 8.0% | 292.74x | 276 | n/a |
| Volar (JS) | **180.4 ms** | 172.1 ms | 5.5 ms | 3.1% | 361.77x | 276 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.5 ms, 0.6 ms
- **Verter**: 140.6 ms, 136.6 ms, 112.0 ms
- **Volar (N)**: 146.7 ms, 146.0 ms, 127.0 ms
- **Volar (JS)**: 180.4 ms, 172.1 ms, 182.5 ms

</details>

#### References @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **137.6 ms** | 136.6 ms | 3.2 ms | 2.3% | 1.00x | 22 | n/a |
| Volar (JS) | **254.3 ms** | 251.0 ms | 7.1 ms | 2.8% | 1.85x | 22 | n/a |
| Vize ⚠ | (7.3 ms) | (7.1 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (35.1 ms) | (0.6 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — 3 references across 2 files but none in any generated component — the corpus was not searched | Sample: "3 refs / 2 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 137.6 ms, 142.7 ms, 136.6 ms
- **Volar (JS)**: 251.0 ms, 264.6 ms, 254.3 ms
- **Vize**: 7.3 ms, 7.6 ms, 7.1 ms
- **Verter**: 35.1 ms, 189.4 ms, 0.6 ms

</details>

#### Hover warm @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.6 ms** | 0.6 ms | 0.0 ms | 7.3% | 1.00x | 130 | n/a |
| Volar (N) | **1.4 ms** | 1.4 ms | 0.1 ms | 6.9% | 2.35x | 131 | n/a |
| Volar (JS) | **1.7 ms** | 1.6 ms | 0.4 ms | 19.9% ⚠ | 2.76x | 131 | n/a |
| Vize ⚠ | (2.2 ms) | (2.1 ms) | – | – | not ranked | (358) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly) | ⚠ TOO NOISY TO RANK — CV 99.3% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.6 ms, 0.6 ms, 0.7 ms
- **Volar (N)**: 1.4 ms, 1.5 ms, 1.4 ms
- **Volar (JS)**: 2.2 ms, 1.7 ms, 1.6 ms
- **Vize**: 2.2 ms, 2.1 ms, 10.8 ms

</details>

#### Time-to-usable @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **287.7 ms** | 265.9 ms | 24.0 ms | 8.3% | 1.00x | 101 | n/a |
| Vize | **403.9 ms** | 403.2 ms | 5.9 ms | 1.4% | 1.40x | 101 | n/a |
| Volar (N) | **1.15 s** | 1.12 s | 16.0 ms | 1.4% | 4.00x | 101 | n/a |
| Volar (JS) | **1.75 s** | 1.74 s | 16.1 ms | 0.9% | 6.10x | 101 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 265.9 ms, 313.8 ms, 287.7 ms
- **Vize**: 403.2 ms, 413.7 ms, 403.9 ms
- **Volar (N)**: 1.12 s, 1.15 s, 1.15 s
- **Volar (JS)**: 1.74 s, 1.78 s, 1.75 s

</details>

#### Completion @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.2 ms | 36.7% ⚠ | 1.00x | 7 | n/a |
| Verter | **117.0 ms** | 116.8 ms | 14.1 ms | 11.3% ⚠ | 243.26x | 7 | n/a |
| Volar (N) | **135.7 ms** | 130.0 ms | 8.2 ms | 5.9% | 282.19x | 356 | n/a |
| Volar (JS) | **182.2 ms** | 162.3 ms | 13.3 ms | 7.5% | 378.92x | 356 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.9 ms, 0.5 ms, 0.5 ms
- **Verter**: 141.4 ms, 116.8 ms, 117.0 ms
- **Volar (N)**: 135.7 ms, 130.0 ms, 146.1 ms
- **Volar (JS)**: 182.2 ms, 162.3 ms, 187.5 ms

</details>

#### References @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **565.3 ms** | 563.8 ms | 7.3 ms | 1.3% | 1.00x | 102 | n/a |
| Volar (JS) | **948.4 ms** | 927.3 ms | 31.5 ms | 3.3% | 1.68x | 102 | n/a |
| Vize ⚠ | (7.1 ms) | (6.9 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (32.9 ms) | (27.4 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — 3 references across 2 files but none in any generated component — the corpus was not searched | Sample: "3 refs / 2 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 565.3 ms, 563.8 ms, 577.1 ms
- **Volar (JS)**: 948.4 ms, 927.3 ms, 989.3 ms
- **Vize**: 7.1 ms, 7.2 ms, 6.9 ms
- **Verter**: 32.9 ms, 140.7 ms, 27.4 ms

</details>

#### Hover warm @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.7 ms** | 0.6 ms | 0.2 ms | 21.3% ⚠ | 1.00x | 130 | n/a |
| Volar (N) | **1.6 ms** | 1.5 ms | 0.1 ms | 5.1% | 2.24x | 131 | n/a |
| Vize | **2.2 ms** | 2.1 ms | 1.4 ms | 48.6% ⚠ | 3.09x | 358 | n/a |
| Volar (JS) ⚠ | (1.9 ms) | (1.6 ms) | – | – | not ranked | (131) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS) ⚠**: content verified | engine: TypeScript 6.0.3 (JS) | ⚠ TOO NOISY TO RANK — CV 55.3% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.7 ms, 0.6 ms, 0.9 ms
- **Volar (N)**: 1.7 ms, 1.5 ms, 1.6 ms
- **Vize**: 4.6 ms, 2.1 ms, 2.2 ms
- **Volar (JS)**: 1.6 ms, 4.3 ms, 1.9 ms

</details>

#### Time-to-usable @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **259.4 ms** | 209.5 ms | 122.4 ms | 40.3% ⚠ | 1.00x | 501 | n/a |
| Vize | **393.0 ms** | 388.4 ms | 9.5 ms | 2.4% | 1.51x | 501 | n/a |
| Volar (N) | **1.79 s** | 1.76 s | 21.8 ms | 1.2% | 6.91x | 501 | n/a |
| Volar (JS) | **2.65 s** | 2.65 s | 18.7 ms | 0.7% | 10.21x | 501 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 259.4 ms, 442.0 ms, 209.5 ms
- **Vize**: 393.0 ms, 406.7 ms, 388.4 ms
- **Volar (N)**: 1.76 s, 1.80 s, 1.79 s
- **Volar (JS)**: 2.65 s, 2.68 s, 2.65 s

</details>

#### Completion @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.1 ms | 17.2% ⚠ | 1.00x | 7 | n/a |
| Verter | **146.4 ms** | 140.4 ms | 46.7 ms | 27.4% ⚠ | 297.56x | 7 | n/a |
| Volar (N) | **193.2 ms** | 192.2 ms | 3.2 ms | 1.6% | 392.63x | 756 | n/a |
| Volar (JS) | **242.4 ms** | 199.7 ms | 25.1 ms | 11.0% ⚠ | 492.74x | 756 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.5 ms, 0.7 ms
- **Verter**: 146.4 ms, 224.1 ms, 140.4 ms
- **Volar (N)**: 198.1 ms, 193.2 ms, 192.2 ms
- **Volar (JS)**: 199.7 ms, 242.4 ms, 243.8 ms

</details>

#### References @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **9.27 s** | 9.13 s | 104.1 ms | 1.1% | 1.00x | 502 | n/a |
| Volar (JS) | **13.71 s** | 13.07 s | 698.0 ms | 5.1% | 1.48x | 502 | n/a |
| Vize ⚠ | (7.3 ms) | (6.7 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (29.8 ms) | (26.6 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — 3 references across 2 files but none in any generated component — the corpus was not searched | Sample: "3 refs / 2 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 9.27 s, 9.33 s, 9.13 s
- **Volar (JS)**: 13.07 s, 14.47 s, 13.71 s
- **Vize**: 8.0 ms, 6.7 ms, 7.3 ms
- **Verter**: 26.6 ms, 29.8 ms, 63.7 ms

</details>

#### Hover warm @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.3 ms** | 0.7 ms | 0.3 ms | 28.4% ⚠ | 1.00x | 130 | n/a |
| Volar (JS) | **1.4 ms** | 1.3 ms | 0.7 ms | 39.5% ⚠ | 1.05x | 131 | n/a |
| Vize | **2.1 ms** | 1.9 ms | 0.5 ms | 21.9% ⚠ | 1.61x | 358 | n/a |
| Volar (N) | **3.4 ms** | 3.1 ms | 0.2 ms | 5.1% | 2.65x | 131 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Verter**: 1.3 ms, 1.3 ms, 0.7 ms
- **Volar (JS)**: 2.5 ms, 1.4 ms, 1.3 ms
- **Vize**: 2.8 ms, 1.9 ms, 2.1 ms
- **Volar (N)**: 3.4 ms, 3.1 ms, 3.5 ms

</details>

#### Scale × time-to-usable 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.71 | – |
| Volar (N) | – | – | – | – | – | 1.77 | – |
| Vize | – | – | – | – | – | 0.95 | – |
| Verter | – | – | – | – | – | 1.39 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.71 (1554.1 ms → 2650.2 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.77 (993.4 ms → 1757.9 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | scale factor ×0.95 (415.2 ms → 393.0 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | scale factor ×1.39 (187.3 ms → 259.4 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × completion 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.11 | – |
| Volar (N) | – | – | – | – | – | 1.35 | – |
| Vize | – | – | – | – | – | 0.99 | – |
| Verter | – | – | – | – | – | 1.04 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.11 (180.4 ms → 199.7 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.35 (146.7 ms → 198.1 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | scale factor ×0.99 (0.5 ms → 0.5 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | scale factor ×1.04 (140.6 ms → 146.4 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × references 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 52.07 | – |
| Volar (N) | – | – | – | – | – | 67.4 | – |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×52.07 (251.0 ms → 13071.0 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×67.4 (137.6 ms → 9274.4 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × hover warm 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.1 | – |
| Volar (N) | – | – | – | – | – | 2.4 | – |
| Vize | – | – | – | – | – | 1.31 | – |
| Verter | – | – | – | – | – | 2.19 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.1 (2.2 ms → 2.5 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×2.4 (1.4 ms → 3.4 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | scale factor ×1.31 (2.2 ms → 2.8 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | scale factor ×2.19 (0.6 ms → 1.3 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows whose value is a RATIO (`Scale × …`) have an empty median by design: the measurement is a factor, not a duration, and it is printed in the artifact column with the pair it came from. A ratio row is never given an invented time so that it can be ranked.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260603.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Typing loop (composite)

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⏭ | skipped | – | – | – | – | – | – |
| Volar (N) ⏭ | skipped | – | – | – | – | – | – |
| Vize ⏭ | skipped | – | – | – | – | – | – |
| Verter ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⏭**: ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server.
- **Volar (N) ⏭**: ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server.
- **Vize ⏭**: ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server.
- **Verter ⏭**: ⚠ NOT MEASURED (harness) — edit-loop/diagnostics-error: that suite was not run for this server; edit-loop/hover-after-edit: that suite was not run for this server; completion/completion-script-member: that suite was not run for this server.

</details>

<details><summary>Methodology</summary>

- Sum of three medians: edit-loop/diagnostics-error + edit-loop/hover-after-edit + completion/completion-script-member.
- Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.
- A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.
- Servers that failed a component are shown in brackets with the failing part named.
- Composites share one table across TypeScript engines with (JS)-tagged rows, exactly as the per-operation tables do — a JS-engine composite against a tsgo composite is an engine comparison, not a server comparison.

Raw runs:


</details>
