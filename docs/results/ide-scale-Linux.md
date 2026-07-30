# Ubuntu/Linux · ide ops

> Full report for `ide-scale-Linux.md` — every collapsed block (methodology, gate notes, raw runs) that the
> [README](../../README.md) summary tables link here for. Auto-generated; do not edit.

## IDE operation results

- **Generated:** 2026-07-29T15:56:04.487Z
- **Runner:** linux/x64 · Node v22.23.1
- **Runs / warmups:** 1 / 1

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
| Verter | **231.1 ms** | 231.1 ms | n/a | n/a | 1.00x | 21 | n/a |
| Vize | **383.1 ms** | 383.1 ms | n/a | n/a | 1.66x | 21 | n/a |
| Volar (N) | **1.83 s** | 1.83 s | n/a | n/a | 7.93x | 21 | n/a |
| Volar (JS) | **1.95 s** | 1.95 s | n/a | n/a | 8.42x | 21 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 231.1 ms
- **Vize**: 383.1 ms
- **Volar (N)**: 1.83 s
- **Volar (JS)**: 1.95 s

</details>

#### Completion @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.1 ms** | 1.1 ms | n/a | n/a | 1.00x | 7 | n/a |
| Verter | **167.4 ms** | 167.4 ms | n/a | n/a | 154.13x | 7 | n/a |
| Volar (JS) | **209.5 ms** | 209.5 ms | n/a | n/a | 192.89x | 276 | n/a |
| Volar (N) | **404.9 ms** | 404.9 ms | n/a | n/a | 372.79x | 276 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.1 ms
- **Verter**: 167.4 ms
- **Volar (JS)**: 209.5 ms
- **Volar (N)**: 404.9 ms

</details>

#### References @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **453.7 ms** | 453.7 ms | n/a | n/a | 1.00x | 22 | n/a |
| Volar (N) | **556.2 ms** | 556.2 ms | n/a | n/a | 1.23x | 22 | n/a |
| Vize ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (32.4 ms) | (32.4 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — all 2 references are in a single file — no cross-file search happened | Sample: "2 refs / 1 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 453.7 ms
- **Volar (N)**: 556.2 ms
- **Vize**: 0.7 ms
- **Verter**: 32.4 ms

</details>

#### Hover warm @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.00x | 131 | n/a |
| Volar (JS) | **1.4 ms** | 1.4 ms | n/a | n/a | 1.07x | 131 | n/a |
| Vize | **1.9 ms** | 1.9 ms | n/a | n/a | 1.48x | 429 | n/a |
| Verter | **2.8 ms** | 2.8 ms | n/a | n/a | 2.13x | 130 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 1.3 ms
- **Volar (JS)**: 1.4 ms
- **Vize**: 1.9 ms
- **Verter**: 2.8 ms

</details>

#### Time-to-usable @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **324.3 ms** | 324.3 ms | n/a | n/a | 1.00x | 101 | n/a |
| Vize | **381.7 ms** | 381.7 ms | n/a | n/a | 1.18x | 101 | n/a |
| Volar (JS) | **2.11 s** | 2.11 s | n/a | n/a | 6.51x | 101 | n/a |
| Volar (N) | **2.12 s** | 2.12 s | n/a | n/a | 6.52x | 101 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Verter**: 324.3 ms
- **Vize**: 381.7 ms
- **Volar (JS)**: 2.11 s
- **Volar (N)**: 2.12 s

</details>

#### Completion @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.2 ms** | 1.2 ms | n/a | n/a | 1.00x | 7 | n/a |
| Volar (JS) | **222.4 ms** | 222.4 ms | n/a | n/a | 185.44x | 356 | n/a |
| Verter | **249.1 ms** | 249.1 ms | n/a | n/a | 207.73x | 7 | n/a |
| Volar (N) | **429.8 ms** | 429.8 ms | n/a | n/a | 358.39x | 356 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.2 ms
- **Volar (JS)**: 222.4 ms
- **Verter**: 249.1 ms
- **Volar (N)**: 429.8 ms

</details>

#### References @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **1.29 s** | 1.29 s | n/a | n/a | 1.00x | 102 | n/a |
| Volar (N) | **2.14 s** | 2.14 s | n/a | n/a | 1.66x | 102 | n/a |
| Vize ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (62.8 ms) | (62.8 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — all 2 references are in a single file — no cross-file search happened | Sample: "2 refs / 1 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.29 s
- **Volar (N)**: 2.14 s
- **Vize**: 0.7 ms
- **Verter**: 62.8 ms

</details>

#### Hover warm @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.00x | 131 | n/a |
| Volar (JS) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.00x | 131 | n/a |
| Verter | **1.6 ms** | 1.6 ms | n/a | n/a | 1.21x | 130 | n/a |
| Vize | **1.8 ms** | 1.8 ms | n/a | n/a | 1.40x | 429 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 1.3 ms
- **Volar (JS)**: 1.3 ms
- **Verter**: 1.6 ms
- **Vize**: 1.8 ms

</details>

#### Time-to-usable @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **382.7 ms** | 382.7 ms | n/a | n/a | 1.00x | 501 | n/a |
| Verter | **454.8 ms** | 454.8 ms | n/a | n/a | 1.19x | 501 | n/a |
| Volar (JS) | **3.07 s** | 3.07 s | n/a | n/a | 8.02x | 501 | n/a |
| Volar (N) | **3.52 s** | 3.52 s | n/a | n/a | 9.20x | 501 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 382.7 ms
- **Verter**: 454.8 ms
- **Volar (JS)**: 3.07 s
- **Volar (N)**: 3.52 s

</details>

#### Completion @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.1 ms** | 1.1 ms | n/a | n/a | 1.00x | 7 | n/a |
| Verter | **140.9 ms** | 140.9 ms | n/a | n/a | 129.46x | 7 | n/a |
| Volar (JS) | **244.1 ms** | 244.1 ms | n/a | n/a | 224.30x | 756 | n/a |
| Volar (N) | **603.3 ms** | 603.3 ms | n/a | n/a | 554.45x | 756 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.1 ms
- **Verter**: 140.9 ms
- **Volar (JS)**: 244.1 ms
- **Volar (N)**: 603.3 ms

</details>

#### References @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **17.65 s** | 17.65 s | n/a | n/a | 1.00x | 502 | n/a |
| Volar (N) | **38.91 s** | 38.91 s | n/a | n/a | 2.21x | 502 | n/a |
| Vize ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — all 2 references are in a single file — no cross-file search happened | Sample: "2 refs / 1 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 17.65 s
- **Volar (N)**: 38.91 s
- **Vize**: 0.7 ms
- **Verter**: 1.0 ms

</details>

#### Hover warm @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.8 ms | n/a | n/a | 1.00x | 130 | n/a |
| Volar (JS) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.52x | 131 | n/a |
| Volar (N) | **1.3 ms** | 1.3 ms | n/a | n/a | 1.57x | 131 | n/a |
| Vize | **1.9 ms** | 1.9 ms | n/a | n/a | 2.22x | 429 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.8 ms
- **Volar (JS)**: 1.3 ms
- **Volar (N)**: 1.3 ms
- **Vize**: 1.9 ms

</details>

#### Scale × time-to-usable 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.58 | – |
| Volar (N) | – | – | – | – | – | 1.92 | – |
| Vize | – | – | – | – | – | 1 | – |
| Verter | – | – | – | – | – | 1.97 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.58 (1945.9 ms → 3069.9 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.92 (1832.1 ms → 3519.5 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | scale factor ×1 (383.1 ms → 382.7 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | scale factor ×1.97 (231.1 ms → 454.8 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × completion 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.16 | – |
| Volar (N) | – | – | – | – | – | 1.49 | – |
| Vize | – | – | – | – | – | 1 | – |
| Verter | – | – | – | – | – | 0.84 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.16 (209.5 ms → 244.1 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.49 (404.9 ms → 603.3 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | scale factor ×1 (1.1 ms → 1.1 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | scale factor ×0.84 (167.4 ms → 140.9 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × references 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 38.89 | – |
| Volar (N) | – | – | – | – | – | 69.96 | – |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×38.89 (453.7 ms → 17645.7 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×69.96 (556.2 ms → 38909.9 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × hover warm 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 0.93 | – |
| Volar (N) | – | – | – | – | – | 1.02 | – |
| Vize | – | – | – | – | – | 0.98 | – |
| Verter | – | – | – | – | – | 0.31 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×0.93 (1.4 ms → 1.3 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.02 (1.3 ms → 1.3 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | scale factor ×0.98 (1.9 ms → 1.9 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | scale factor ×0.31 (2.8 ms → 0.8 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows whose value is a RATIO (`Scale × …`) have an empty median by design: the measurement is a factor, not a duration, and it is printed in the artifact column with the pair it came from. A ratio row is never given an invented time so that it can be ranked.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
