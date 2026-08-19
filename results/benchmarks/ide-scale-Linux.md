## IDE operation results

- **Generated:** 2026-08-19T18:36:11.710Z
- **Runner:** linux/x64 · Node v22.23.2
- **Runs / warmups:** 3 / 1

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included (a two-run spread has no third sample to adjudicate, so it is flagged, not bracketed). Per-row detail is under **Notes** below each table.

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. Each request-style operation publishes **Cold** (first request after initialize+didOpen in a **fresh session dedicated to that operation** — later ops do not reuse a warmed server) and **Warm** (the same request immediately after). Ranking uses Cold; vs-fastest-cold sits next to it. A row that failed its content gate on the cold request is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

### IDE · initialize

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### LSP initialize

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **7.4 ms** | 6.0 ms | 0.9 ms | 12.3% ⚠ | 1.00x | n/a | n/a |
| Vize | **37.8 ms** | 37.1 ms | 1.5 ms | 4.0% | 5.08x | n/a | n/a |
| Volar (N) | **543.2 ms** | 535.3 ms | 5.4 ms | 1.0% | 73.01x | n/a | n/a |
| Volar (JS) | **562.3 ms** | 545.1 ms | 10.1 ms | 1.8% | 75.58x | n/a | n/a |

<details><summary>Notes</summary>

- **Verter**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: LSP initialize handshake after spawn (not first-request latency) | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 6.0 ms, 7.4 ms, 7.5 ms
- **Vize**: 37.8 ms, 37.1 ms, 40.0 ms
- **Volar (N)**: 545.7 ms, 543.2 ms, 535.3 ms
- **Volar (JS)**: 562.8 ms, 545.1 ms, 562.3 ms

</details>

<details><summary>Methodology</summary>

- Time from process spawn through the LSP initialize/initialized handshake, pooled across the suites in this job (small purpose-built workspaces). This is server startup, not the first editor request — Cold on the operation tables is that first request.

</details>

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
| Verter | **231.7 ms** | 224.6 ms | 5.4 ms | 2.3% | 1.00x | 21 | n/a |
| Vize | **353.8 ms** | 345.0 ms | 11.4 ms | 3.2% | 1.53x | 21 | n/a |
| Volar (N) | **1.23 s** | 1.22 s | 6.1 ms | 0.5% | 5.30x | 21 | n/a |
| Volar (JS) | **2.00 s** | 1.99 s | 32.0 ms | 1.6% | 8.63x | 21 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 235.2 ms, 231.7 ms, 224.6 ms
- **Vize**: 353.8 ms, 345.0 ms, 367.7 ms
- **Volar (N)**: 1.22 s, 1.23 s, 1.23 s
- **Volar (JS)**: 1.99 s, 2.00 s, 2.05 s

</details>

#### Completion @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.0 ms | 0.7% | 1.00x | 7 | n/a |
| Verter | **159.2 ms** | 153.8 ms | 23.2 ms | 13.7% ⚠ | 340.21x | 7 | n/a |
| Volar (N) | **175.4 ms** | 163.8 ms | 8.8 ms | 5.1% | 374.96x | 276 | n/a |
| Volar (JS) | **222.6 ms** | 215.8 ms | 10.3 ms | 4.6% | 475.83x | 276 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.5 ms, 0.5 ms
- **Verter**: 196.5 ms, 159.2 ms, 153.8 ms
- **Volar (N)**: 181.1 ms, 163.8 ms, 175.4 ms
- **Volar (JS)**: 215.8 ms, 236.1 ms, 222.6 ms

</details>

#### References @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **168.0 ms** | 165.0 ms | 3.0 ms | 1.8% | 1.00x | 22 | n/a |
| Volar (JS) | **479.3 ms** | 469.1 ms | 19.7 ms | 4.1% | 2.85x | 22 | n/a |
| Vize ⚠ | (28.8 ms) | (24.7 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (40.8 ms) | (31.1 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — 3 references across 2 files but none in any generated component — the corpus was not searched | Sample: "3 refs / 2 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 171.1 ms, 165.0 ms, 168.0 ms
- **Volar (JS)**: 469.1 ms, 479.3 ms, 507.1 ms
- **Vize**: 28.8 ms, 24.7 ms, 36.0 ms
- **Verter**: 46.4 ms, 31.1 ms, 40.8 ms

</details>

#### Hover warm @20 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.7 ms** | 0.6 ms | 0.2 ms | 22.3% ⚠ | 1.00x | 130 | n/a |
| Volar (JS) | **1.5 ms** | 1.5 ms | 0.1 ms | 5.0% | 2.19x | 131 | n/a |
| Volar (N) | **1.6 ms** | 1.5 ms | 0.1 ms | 5.5% | 2.23x | 131 | n/a |
| Vize | **2.2 ms** | 2.1 ms | 0.1 ms | 5.0% | 3.10x | 130 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.6 ms, 0.9 ms, 0.7 ms
- **Volar (JS)**: 1.5 ms, 1.5 ms, 1.7 ms
- **Volar (N)**: 1.5 ms, 1.7 ms, 1.6 ms
- **Vize**: 2.2 ms, 2.1 ms, 2.3 ms

</details>

#### Time-to-usable @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **286.3 ms** | 262.8 ms | 117.7 ms | 34.4% ⚠ | 1.00x | 101 | n/a |
| Vize | **353.8 ms** | 341.1 ms | 7.7 ms | 2.2% | 1.24x | 101 | n/a |
| Volar (N) | **1.40 s** | 1.40 s | 8.9 ms | 0.6% | 4.89x | 101 | n/a |
| Volar (JS) | **2.23 s** | 2.17 s | 75.7 ms | 3.4% | 7.79x | 101 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 477.5 ms, 286.3 ms, 262.8 ms
- **Vize**: 353.8 ms, 355.0 ms, 341.1 ms
- **Volar (N)**: 1.40 s, 1.42 s, 1.40 s
- **Volar (JS)**: 2.17 s, 2.23 s, 2.32 s

</details>

#### Completion @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.0 ms | 5.4% | 1.00x | 7 | n/a |
| Volar (N) | **174.4 ms** | 171.1 ms | 3.0 ms | 1.7% | 357.43x | 356 | n/a |
| Verter | **195.2 ms** | 150.0 ms | 50.5 ms | 25.4% ⚠ | 400.09x | 7 | n/a |
| Volar (JS) | **241.4 ms** | 198.4 ms | 25.3 ms | 11.1% ⚠ | 494.75x | 356 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.5 ms, 0.5 ms
- **Volar (N)**: 171.1 ms, 177.1 ms, 174.4 ms
- **Verter**: 250.9 ms, 150.0 ms, 195.2 ms
- **Volar (JS)**: 198.4 ms, 241.4 ms, 243.0 ms

</details>

#### References @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **677.2 ms** | 650.3 ms | 27.6 ms | 4.1% | 1.00x | 102 | n/a |
| Volar (JS) | **1.53 s** | 1.23 s | 171.2 ms | 12.0% ⚠ | 2.26x | 102 | n/a |
| Vize ⚠ | (28.0 ms) | (27.2 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (34.8 ms) | (1.0 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — 3 references across 2 files but none in any generated component — the corpus was not searched | Sample: "3 refs / 2 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 677.2 ms, 705.4 ms, 650.3 ms
- **Volar (JS)**: 1.23 s, 1.53 s, 1.53 s
- **Vize**: 27.2 ms, 31.0 ms, 28.0 ms
- **Verter**: 1.0 ms, 34.8 ms, 41.0 ms

</details>

#### Hover warm @100 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.9 ms** | 0.8 ms | 0.1 ms | 9.4% | 1.00x | 130 | n/a |
| Volar (JS) | **1.8 ms** | 1.7 ms | 0.4 ms | 18.7% ⚠ | 1.92x | 131 | n/a |
| Volar (N) | **1.9 ms** | 1.8 ms | 0.1 ms | 5.1% | 1.97x | 131 | n/a |
| Vize | **2.3 ms** | 2.1 ms | 0.2 ms | 8.3% | 2.45x | 130 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.9 ms, 1.0 ms, 0.8 ms
- **Volar (JS)**: 2.4 ms, 1.7 ms, 1.8 ms
- **Volar (N)**: 1.9 ms, 2.0 ms, 1.8 ms
- **Vize**: 2.3 ms, 2.5 ms, 2.1 ms

</details>

#### Time-to-usable @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **356.6 ms** | 328.5 ms | 56.5 ms | 15.1% ⚠ | 1.00x | 501 | n/a |
| Verter | **404.7 ms** | 383.8 ms | 69.6 ms | 16.0% ⚠ | 1.14x | 501 | n/a |
| Volar (N) | **2.16 s** | 2.13 s | 24.8 ms | 1.1% | 6.06x | 501 | n/a |
| Volar (JS) | **3.24 s** | 3.17 s | 58.6 ms | 1.8% | 9.08x | 501 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 356.6 ms, 437.3 ms, 328.5 ms
- **Verter**: 513.4 ms, 404.7 ms, 383.8 ms
- **Volar (N)**: 2.18 s, 2.16 s, 2.13 s
- **Volar (JS)**: 3.17 s, 3.29 s, 3.24 s

</details>

#### Completion @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.5 ms | 0.0 ms | 8.1% | 1.00x | 7 | n/a |
| Verter | **170.1 ms** | 152.2 ms | 34.8 ms | 19.3% ⚠ | 367.79x | 7 | n/a |
| Volar (N) | **231.9 ms** | 226.1 ms | 5.8 ms | 2.5% | 501.19x | 756 | n/a |
| Volar (JS) | **287.9 ms** | 278.7 ms | 11.7 ms | 4.0% | 622.31x | 756 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.5 ms, 0.5 ms
- **Verter**: 219.5 ms, 152.2 ms, 170.1 ms
- **Volar (N)**: 226.1 ms, 237.6 ms, 231.9 ms
- **Volar (JS)**: 301.9 ms, 278.7 ms, 287.9 ms

</details>

#### References @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **11.89 s** | 11.88 s | 31.5 ms | 0.3% | 1.00x | 502 | n/a |
| Volar (JS) | **17.82 s** | 17.49 s | 272.9 ms | 1.5% | 1.50x | 502 | n/a |
| Vize ⚠ | (31.8 ms) | (27.9 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (0.8 ms) | (0.7 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — 3 references across 2 files but none in any generated component — the corpus was not searched | Sample: "3 refs / 2 files / 0 generated components" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — server answered textDocument/references with null — the provider declined this request (which is not proof the capability is absent) | Sample: "0 refs / 0 files / 0 generated components" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 11.88 s, 11.94 s, 11.89 s
- **Volar (JS)**: 18.03 s, 17.82 s, 17.49 s
- **Vize**: 27.9 ms, 31.8 ms, 36.9 ms
- **Verter**: 43.7 ms, 0.8 ms, 0.7 ms

</details>

#### Hover warm @500 files

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.7 ms | 0.1 ms | 16.3% ⚠ | 1.00x | 130 | n/a |
| Volar (JS) | **1.4 ms** | 1.2 ms | 0.1 ms | 7.8% | 1.68x | 131 | n/a |
| Vize | **2.4 ms** | 2.2 ms | 0.1 ms | 3.5% | 2.84x | 130 | n/a |
| Volar (N) | **4.8 ms** | 4.6 ms | 0.2 ms | 4.5% | 5.74x | 131 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Verter**: 1.0 ms, 0.7 ms, 0.8 ms
- **Volar (JS)**: 1.4 ms, 1.2 ms, 1.4 ms
- **Vize**: 2.4 ms, 2.4 ms, 2.2 ms
- **Volar (N)**: 4.6 ms, 4.8 ms, 5.1 ms

</details>

#### Scale × time-to-usable 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.6 | – |
| Volar (N) | – | – | – | – | – | 1.79 | – |
| Vize | – | – | – | – | – | 1.01 | – |
| Verter | – | – | – | – | – | 2.18 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.6 (1987.2 ms → 3172.1 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.79 (1218.8 ms → 2176.7 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | scale factor ×1.01 (353.8 ms → 356.6 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | scale factor ×2.18 (235.2 ms → 513.4 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × completion 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 1.4 | – |
| Volar (N) | – | – | – | – | – | 1.25 | – |
| Vize | – | – | – | – | – | 0.98 | – |
| Verter | – | – | – | – | – | 1.12 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×1.4 (215.8 ms → 301.9 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×1.25 (181.1 ms → 226.1 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | scale factor ×0.98 (0.5 ms → 0.5 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | scale factor ×1.12 (196.5 ms → 219.5 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × references 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 38.44 | – |
| Volar (N) | – | – | – | – | – | 69.45 | – |
| Vize ⚠ | – | – | – | – | not ranked | – | – |
| Verter ⚠ | – | – | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×38.44 (469.1 ms → 18029.9 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×69.45 (171.1 ms → 11884.3 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no scale factor: the gate failed at 20 and 500 files (see references@20) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Scale × hover warm 20→500

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Scale factor 20→500 (×, lower is better) | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 0.95 | – |
| Volar (N) | – | – | – | – | – | 3.02 | – |
| Vize | – | – | – | – | – | 1.08 | – |
| Verter | – | – | – | – | – | 1.61 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | scale factor ×0.95 (1.5 ms → 1.4 ms) — a ratio, not a duration, so the median column is empty by design | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | scale factor ×3.02 (1.5 ms → 4.6 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | scale factor ×1.08 (2.2 ms → 2.4 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | scale factor ×1.61 (0.6 ms → 1.0 ms) — a ratio, not a duration, so the median column is empty by design | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>


#### Peak RSS (process tree)

| Tool | **Peak RSS** |
| --- | ---: |
| Verter | **41.0 MB** |
| Vize | **63.4 MB** |
| Volar (JS) | **329.8 MB** |
| Volar (N) | **407.0 MB** |


<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
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

