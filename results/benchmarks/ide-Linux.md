## IDE operation results

- **Generated:** 2026-08-19T18:36:26.268Z
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
| Verter | **5.4 ms** | 5.1 ms | 1.3 ms | 21.5% ⚠ | 1.00x | n/a | n/a |
| Vize | **40.1 ms** | 37.7 ms | 3.8 ms | 9.1% | 7.46x | n/a | n/a |
| Volar (N) | **541.7 ms** | 536.6 ms | 4.0 ms | 0.7% | 100.61x | n/a | n/a |
| Volar (JS) | **542.4 ms** | 533.2 ms | 3.8 ms | 0.7% | 100.74x | n/a | n/a |

<details><summary>Notes</summary>

- **Verter**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: LSP initialize handshake after spawn (not first-request latency) | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 5.4 ms, 5.3 ms, 5.2 ms, 5.5 ms, 5.2 ms, 5.3 ms, 5.1 ms, 5.1 ms, 5.2 ms, 5.2 ms, 5.8 ms, 5.4 ms, 9.6 ms, 5.2 ms, 5.4 ms, 6.6 ms, 5.9 ms, 5.9 ms, 6.0 ms, 5.6 ms, 9.4 ms
- **Vize**: 40.1 ms, 40.0 ms, 37.7 ms, 43.4 ms, 39.0 ms, 42.9 ms, 54.8 ms, 38.6 ms, 41.8 ms, 42.1 ms, 39.1 ms, 47.4 ms, 43.0 ms, 40.1 ms, 40.3 ms, 38.8 ms, 40.0 ms, 40.3 ms, 42.3 ms, 39.3 ms, 39.6 ms
- **Volar (N)**: 549.5 ms, 540.8 ms, 545.6 ms, 542.4 ms, 543.7 ms, 539.8 ms, 543.5 ms, 536.6 ms, 538.3 ms, 553.2 ms, 541.2 ms, 545.6 ms, 537.1 ms, 544.0 ms, 539.7 ms, 544.6 ms, 538.6 ms, 540.6 ms, 541.7 ms, 538.4 ms, 542.2 ms
- **Volar (JS)**: 534.6 ms, 545.4 ms, 533.2 ms, 542.1 ms, 546.3 ms, 547.1 ms, 540.0 ms, 543.3 ms, 542.8 ms, 542.6 ms, 539.5 ms, 546.0 ms, 542.4 ms, 540.5 ms, 542.7 ms, 542.4 ms, 540.1 ms, 542.5 ms, 539.0 ms, 534.9 ms, 545.5 ms

</details>

<details><summary>Methodology</summary>

- Time from process spawn through the LSP initialize/initialized handshake, pooled across the suites in this job (small purpose-built workspaces). This is server startup, not the first editor request — Cold on the operation tables is that first request.

</details>

### IDE · background

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### Semantic tokens (full)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 0.5 ms | 0.0 ms | 5.4% | 1.00x | 15 | n/a |
| Volar (N) | **330.8 ms** | 325.2 ms | 6.8 ms | 2.0% | 551.61x | 48 | n/a |
| Volar (JS) | **760.3 ms** | 754.2 ms | 17.9 ms | 2.3% | 1267.75x | 48 | n/a |
| Verter ⚠ | (32.7 ms) | (26.5 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no tokens at all for this document | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.5 ms, 0.6 ms
- **Volar (N)**: 325.2 ms, 338.6 ms, 330.8 ms
- **Volar (JS)**: 787.7 ms, 760.3 ms, 754.2 ms
- **Verter**: 26.5 ms, 33.9 ms, 32.7 ms

</details>

#### Semantic tokens (delta after edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (1.1 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (1.1 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (0.6 ms) | (0.5 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1787164355091", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: TypeScript 6.0.3 (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1787164364224", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.0 ms, 1.1 ms, 1.1 ms
- **Volar (N)**: 1.0 ms, 1.1 ms, 1.1 ms
- **Vize**: 0.5 ms, 0.6 ms, 0.7 ms
- **Verter**: 0.5 ms, 0.4 ms, 2.9 ms

</details>

#### Document symbols (outline)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **17.3 ms** | 17.1 ms | 3.6 ms | 18.6% ⚠ | 1.00x | 25 | n/a |
| Volar (JS) | **21.2 ms** | 16.6 ms | 3.1 ms | 15.4% ⚠ | 1.23x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | (12) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — outline is missing 7/7 script symbols: heading, nextLabel, threshold, entries, visibleEntries, formatEntry, addEntry | Sample: "2 symbols: template, script setup" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | ⚠ TOO NOISY TO RANK — CV 92.8% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 23.4 ms, 17.1 ms, 17.3 ms
- **Volar (JS)**: 16.6 ms, 22.4 ms, 21.2 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Verter**: 0.4 ms, 0.5 ms, 2.0 ms

</details>

#### Document highlight (caret move)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 7.9% | 1.00x | 4 | n/a |
| Verter | **0.3 ms** | 0.3 ms | 0.0 ms | 14.8% ⚠ | 1.41x | 4 | n/a |
| Volar (JS) | **18.4 ms** | 17.9 ms | 0.4 ms | 2.3% | 89.83x | 5 | n/a |
| Volar (N) | **30.3 ms** | 30.1 ms | 0.6 ms | 1.8% | 148.00x | 5 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.4 ms
- **Volar (JS)**: 18.7 ms, 17.9 ms, 18.4 ms
- **Volar (N)**: 30.1 ms, 30.3 ms, 31.1 ms

</details>

#### Inlay hints (document range)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.4 ms | 0.0 ms | 6.4% | 1.00x | 2 | n/a |
| Volar (JS) | **71.7 ms** | 69.9 ms | 3.2 ms | 4.5% | 155.16x | 14 | n/a |
| Volar (N) | **167.5 ms** | 164.1 ms | 2.4 ms | 1.4% | 362.72x | 14 | n/a |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.5 ms, 0.5 ms
- **Volar (JS)**: 71.7 ms, 69.9 ms, 76.2 ms
- **Volar (N)**: 167.5 ms, 168.5 ms, 164.1 ms
- **Verter**: 0.2 ms, 0.2 ms, 0.4 ms

</details>

#### Folding ranges

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 6.8% | 1.00x | 9 | n/a |
| Verter | **0.2 ms** | 0.2 ms | 0.0 ms | 17.0% ⚠ | 1.13x | 7 | n/a |
| Volar (N) | **7.0 ms** | 6.9 ms | 0.3 ms | 4.2% | 31.82x | 13 | n/a |
| Volar (JS) | **130.6 ms** | 117.6 ms | 13.4 ms | 10.2% ⚠ | 596.45x | 13 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.2 ms, 0.2 ms, 0.3 ms
- **Volar (N)**: 6.9 ms, 7.5 ms, 7.0 ms
- **Volar (JS)**: 130.6 ms, 117.6 ms, 144.3 ms

</details>

#### Peak RSS (process tree)

| Tool | **Peak RSS** |
| --- | ---: |
| Verter | **236.1 MB** |
| Vize | **293.0 MB** |
| Volar (JS) | **534.4 MB** |
| Volar (N) | **693.3 MB** |


<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260603.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · completion

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### Completion: script member

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **301.8 ms** | 1.00x | **32.9 ms** | 24.4 ms | 8.1 ms | 24.8% ⚠ | 1.63x | 3 | n/a |
| Volar (N) | **442.4 ms** | 1.47x | **20.1 ms** | 20.0 ms | 6.1 ms | 25.9% ⚠ | 1.00x | 3 | n/a |
| Volar (JS) | **1.08 s** | 3.59x | **25.2 ms** | 25.2 ms | 1.3 ms | 4.8% | 1.25x | 3 | n/a |
| Vize ⚠ | (256.0 ms) | not ranked | (47.2 ms) | (1.5 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly) | ⚠ TOO NOISY TO RANK — CV 85.5% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 24.4 ms, 32.9 ms, 40.6 ms
- **Volar (N)**: 20.0 ms, 20.1 ms, 30.7 ms
- **Volar (JS)**: 25.2 ms, 27.4 ms, 25.2 ms
- **Vize**: 61.8 ms, 1.5 ms, 47.2 ms

</details>

#### Completion: component tag <Ch

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **120.3 ms** | 1.00x | **35.1 ms** | 34.9 ms | 1.3 ms | 3.7% | 1.20x | 192 | n/a |
| Volar (N) | **126.8 ms** | 1.05x | **38.0 ms** | 36.0 ms | 1.5 ms | 4.1% | 1.30x | 192 | n/a |
| Verter | **168.6 ms** | 1.40x | **29.2 ms** | 27.5 ms | 1.0 ms | 3.4% | 1.00x | 1,193 | n/a |
| Vize ⚠ | (0.7 ms) | not ranked | (0.5 ms) | (0.5 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `ChildCard` component tag in 42 items | Sample: "[v-if, v-else-if, v-else, v-for, v-on, v-bind, v-model, v-slot, v-show, v-pre, v-once, v-memo, …+30]" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 35.1 ms, 34.9 ms, 37.3 ms
- **Volar (N)**: 38.9 ms, 36.0 ms, 38.0 ms
- **Verter**: 29.2 ms, 29.2 ms, 27.5 ms
- **Vize**: 0.5 ms, 0.6 ms, 0.5 ms

</details>

#### Completion: prop name <C :

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.8 ms** | 1.00x | **1.2 ms** | 1.2 ms | 0.0 ms | 1.3% | 1.00x | 16 | n/a |
| Volar (N) | **63.1 ms** | 34.32x | **7.2 ms** | 6.9 ms | 0.4 ms | 5.8% | 6.16x | 26 | n/a |
| Volar (JS) | **177.5 ms** | 96.46x | **167.4 ms** | 154.0 ms | 26.0 ms | 14.8% ⚠ | 143.28x | 26 | n/a |
| Vize ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (4) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly) | ⚠ TOO NOISY TO RANK — CV 96.6% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 1.2 ms, 1.2 ms, 1.2 ms
- **Volar (N)**: 7.2 ms, 6.9 ms, 7.7 ms
- **Volar (JS)**: 154.0 ms, 167.4 ms, 204.2 ms
- **Vize**: 0.3 ms, 1.5 ms, 0.3 ms

</details>

#### Completion: event name <C @

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **7.0 ms** | 1.00x | **6.5 ms** | 6.3 ms | 0.2 ms | 2.5% | 1.00x | 25 | n/a |
| Volar (JS) | **13.4 ms** | 1.90x | **7.8 ms** | 6.0 ms | 1.4 ms | 19.2% ⚠ | 1.20x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (12) | – |
| Verter ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 12 items | Sample: "[v-on, @, @click, @input, @change, @submit, @keydown, @keyup, @focus, @blur, @mouseenter, @mouseleave]" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 6.5 ms, 6.3 ms, 6.6 ms
- **Volar (JS)**: 7.8 ms, 6.0 ms, 8.8 ms
- **Vize**: 0.3 ms, 0.5 ms, 0.3 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Completion: directive v-

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 1.00x | **0.3 ms** | 0.3 ms | 0.1 ms | 27.9% ⚠ | 1.00x | 15 | n/a |
| Volar (N) | **29.6 ms** | 81.70x | **13.5 ms** | 13.0 ms | 0.3 ms | 2.2% | 42.19x | 498 | n/a |
| Volar (JS) ⚠ | (31.3 ms) | not ranked | (48.6 ms) | (13.1 ms) | – | – | not ranked | (498) | – |
| Verter ⚠ | (0.4 ms) | not ranked | (0.4 ms) | (0.3 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS) ⚠**: content verified | engine: TypeScript 6.0.3 (JS) | ⚠ TOO NOISY TO RANK — CV 56.6% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `v-if` directive in 3 items | Sample: "[style scoped, style, i18n]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.5 ms, 0.3 ms
- **Volar (N)**: 13.6 ms, 13.5 ms, 13.0 ms
- **Volar (JS)**: 51.2 ms, 48.6 ms, 13.1 ms
- **Verter**: 0.3 ms, 0.4 ms, 0.4 ms

</details>

#### Completion: slot name <template #

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 1.00x | **0.3 ms** | 0.2 ms | 0.1 ms | 21.6% ⚠ | 1.00x | 2 | n/a |
| Vize | **0.5 ms** | 1.50x | **0.5 ms** | 0.5 ms | 0.0 ms | 7.4% | 1.79x | 30 | n/a |
| Volar (N) | **16.5 ms** | 47.26x | **16.6 ms** | 13.6 ms | 1.8 ms | 11.6% ⚠ | 57.65x | 500 | n/a |
| Volar (JS) | **131.7 ms** | 378.07x | **15.0 ms** | 14.9 ms | 0.8 ms | 5.3% | 52.16x | 500 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.2 ms, 0.4 ms, 0.3 ms
- **Vize**: 0.5 ms, 0.6 ms, 0.5 ms
- **Volar (N)**: 16.6 ms, 13.6 ms, 16.9 ms
- **Volar (JS)**: 15.0 ms, 14.9 ms, 16.4 ms

</details>

#### Completion: auto-import

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **35.4 ms** | 31.7 ms | 2.2 ms | 6.3% | 1.00x | 1,073 | n/a |
| Volar (N) | **36.7 ms** | 35.2 ms | 0.9 ms | 2.5% | 1.04x | 1,073 | n/a |
| Vize ⚠ | (89.6 ms) | (87.8 ms) | – | – | not ranked | (1,103) | – |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import | Sample: "offered: \"getComputedStyle\" kind=3 ; \"computed\" kind=6 ; \"computed\" kind=3 detail=\"function computed<T>(getter: () => T): ComputedRef<T>\"" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 35.5 ms, 35.4 ms, 31.7 ms
- **Volar (N)**: 36.7 ms, 36.8 ms, 35.2 ms
- **Vize**: 89.6 ms, 110.6 ms, 87.8 ms
- **Verter**: 0.4 ms, 0.4 ms, 0.3 ms

</details>

#### Resolve: auto-import edit

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **47.9 ms** | 47.7 ms | 0.6 ms | 1.2% | 1.00x | 241 | n/a |
| Volar (N) | **152.5 ms** | 145.8 ms | 4.2 ms | 2.8% | 3.18x | 241 | n/a |
| Vize ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` | Sample: "\"computed\" kind=6" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 48.8 ms, 47.7 ms, 47.9 ms
- **Volar (N)**: 152.5 ms, 145.8 ms, 153.3 ms
- **Vize**: 0.4 ms, 0.5 ms, 0.3 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.4 ms** | 3.2 ms | 0.7 ms | 18.9% ⚠ | 1.00x | 25 | n/a |
| Verter | **6.2 ms** | 5.6 ms | 0.4 ms | 6.7% | 1.82x | 25 | n/a |
| Volar (N) | **7.9 ms** | 7.8 ms | 0.5 ms | 6.6% | 2.34x | 25 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no detail and no documentation | Sample: "\"quaver\" kind=5" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 4.5 ms, 3.4 ms, 3.2 ms
- **Verter**: 5.6 ms, 6.2 ms, 6.4 ms
- **Volar (N)**: 7.9 ms, 8.8 ms, 7.8 ms
- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms

</details>

#### Peak RSS (process tree)

| Tool | **Peak RSS** |
| --- | ---: |
| Verter | **304.0 MB** |
| Vize | **330.5 MB** |
| Volar (JS) | **584.6 MB** |
| Volar (N) | **726.4 MB** |


<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260603.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · edit-loop

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### didOpen -> first diagnostics

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | – | – | – | – | – | 0 | – |
| Volar (N) | – | – | – | – | – | 0 | – |
| Vize | – | – | – | – | – | 0 | – |
| Verter | – | – | – | – | – | 0 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 1.14 s, min 1.13 s, CV 1.0%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 497.5 ms, min 491.7 ms, CV 1.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | NOT RANKED (informational) — measured 243.1 ms, min 235.3 ms, CV 5.6%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | NOT RANKED (informational) — measured 312.4 ms, min 311.6 ms, CV 0.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.15 s, 1.13 s, 1.14 s
- **Volar (N)**: 497.5 ms, 491.7 ms, 502.6 ms
- **Vize**: 262.1 ms, 243.1 ms, 235.3 ms
- **Verter**: 312.4 ms, 311.6 ms, 312.4 ms

</details>

#### Edit plants type error -> reported

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **68.7 ms** | 50.9 ms | 11.6 ms | 18.1% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **393.6 ms** | 388.0 ms | 3.3 ms | 0.8% | 5.73x | 1 | n/a |
| Volar (N) | **455.1 ms** | 412.9 ms | 26.0 ms | 5.9% | 6.62x | 1 | n/a |
| Verter | **499.8 ms** | 490.2 ms | 6.3 ms | 1.3% | 7.27x | 1 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 68.7 ms, 50.9 ms, 72.7 ms
- **Volar (JS)**: 393.9 ms, 393.6 ms, 388.0 ms
- **Volar (N)**: 460.3 ms, 455.1 ms, 412.9 ms
- **Verter**: 490.2 ms, 499.8 ms, 502.0 ms

</details>

#### Edit fixes it -> diagnostic clears

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **20.5 ms** | 18.5 ms | 1.2 ms | 6.0% | 1.00x | 0 | n/a |
| Volar (N) | **383.1 ms** | 382.5 ms | 0.4 ms | 0.1% | 18.65x | 0 | n/a |
| Volar (JS) | **457.4 ms** | 451.1 ms | 5.0 ms | 1.1% | 22.27x | 0 | n/a |
| Verter | **652.0 ms** | 626.2 ms | 21.4 ms | 3.3% | 31.74x | 0 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 20.5 ms, 20.6 ms, 18.5 ms
- **Volar (N)**: 382.5 ms, 383.2 ms, 383.1 ms
- **Volar (JS)**: 461.0 ms, 457.4 ms, 451.1 ms
- **Verter**: 626.2 ms, 668.7 ms, 652.0 ms

</details>

#### Hover after retype -> NEW type

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **17.4 ms** | 17.4 ms | 0.7 ms | 3.8% | 1.00x | 47 | n/a |
| Volar (JS) | **51.2 ms** | 49.7 ms | 5.4 ms | 10.1% ⚠ | 2.93x | 47 | n/a |
| Vize | **55.5 ms** | 44.0 ms | 7.3 ms | 14.0% ⚠ | 3.18x | 40 | n/a |
| Verter | **76.5 ms** | 72.9 ms | 4.6 ms | 5.9% | 4.39x | 40 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 17.4 ms, 18.6 ms, 17.4 ms
- **Volar (JS)**: 59.7 ms, 51.2 ms, 49.7 ms
- **Vize**: 57.6 ms, 44.0 ms, 55.5 ms
- **Verter**: 72.9 ms, 82.0 ms, 76.5 ms

</details>

#### ... same hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **17.4 ms** | 17.4 ms | 0.7 ms | 3.8% | 1.00x | 1 | n/a |
| Volar (JS) | **51.2 ms** | 49.7 ms | 5.4 ms | 10.1% ⚠ | 2.93x | 1 | n/a |
| Vize | **55.5 ms** | 44.0 ms | 7.3 ms | 14.0% ⚠ | 3.18x | 1 | n/a |
| Verter | **76.5 ms** | 72.9 ms | 4.6 ms | 5.9% | 4.39x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 17.4 ms, 18.6 ms, 17.4 ms
- **Volar (JS)**: 59.7 ms, 51.2 ms, 49.7 ms
- **Vize**: 57.6 ms, 44.0 ms, 55.5 ms
- **Verter**: 72.9 ms, 82.0 ms, 76.5 ms

</details>

#### Steady state: edits 1-5 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **17.6 ms** | 17.4 ms | 0.3 ms | 1.5% | 1.00x | n/a | n/a |
| Volar (JS) | **42.5 ms** | 41.0 ms | 1.5 ms | 3.5% | 2.42x | n/a | n/a |
| Vize | **44.8 ms** | 44.6 ms | 0.7 ms | 1.6% | 2.55x | n/a | n/a |
| Verter | **52.6 ms** | 52.1 ms | 0.7 ms | 1.3% | 2.99x | n/a | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 17.4 ms, 17.6 ms, 18.0 ms
- **Volar (JS)**: 44.0 ms, 41.0 ms, 42.5 ms
- **Vize**: 46.0 ms, 44.6 ms, 44.8 ms
- **Verter**: 52.6 ms, 53.4 ms, 52.1 ms

</details>

#### Steady state: edits 6-10 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **17.6 ms** | 16.9 ms | 0.5 ms | 2.7% | 1.00x | 0 | n/a |
| Volar (JS) | **35.6 ms** | 33.1 ms | 2.0 ms | 5.6% | 2.02x | -7 | n/a |
| Vize | **45.2 ms** | 45.2 ms | 6.6 ms | 13.5% ⚠ | 2.57x | -1 | n/a |
| Verter | **56.7 ms** | 56.2 ms | 0.4 ms | 0.8% | 3.22x | 4 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 17.6 ms, 16.9 ms, 17.7 ms
- **Volar (JS)**: 37.0 ms, 35.6 ms, 33.1 ms
- **Vize**: 45.2 ms, 56.7 ms, 45.2 ms
- **Verter**: 56.7 ms, 57.1 ms, 56.2 ms

</details>

#### Child prop retype -> Parent diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **92.3 ms** | 78.4 ms | 42.8 ms | 39.0% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **378.8 ms** | 378.7 ms | 1.6 ms | 0.4% | 4.10x | 1 | n/a |
| Volar (N) | **384.9 ms** | 383.7 ms | 1.3 ms | 0.3% | 4.17x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 158.5 ms, 92.3 ms, 78.4 ms
- **Volar (JS)**: 378.7 ms, 378.8 ms, 381.5 ms
- **Volar (N)**: 383.7 ms, 384.9 ms, 386.2 ms
- **Verter**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Child prop retype -> Parent hover

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **66.0 ms** | 63.2 ms | 6.0 ms | 8.9% | 1.00x | 42 | n/a |
| Volar (JS) | **106.8 ms** | 102.6 ms | 4.1 ms | 3.8% | 1.62x | 42 | n/a |
| Vize | **158.5 ms** | 150.0 ms | 18.2 ms | 11.1% ⚠ | 2.40x | 42 | n/a |
| Verter ⚠ | (4.8 ms) | (4.7 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 497ms) | Sample: "```typescript\n(property) label: string\n```" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 66.0 ms, 63.2 ms, 74.8 ms
- **Volar (JS)**: 110.7 ms, 106.8 ms, 102.6 ms
- **Vize**: 158.5 ms, 150.0 ms, 184.9 ms
- **Verter**: 4.8 ms, 4.7 ms, 4.8 ms

</details>

#### ... Parent hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **66.0 ms** | 63.2 ms | 6.0 ms | 8.9% | 1.00x | 1 | n/a |
| Volar (JS) | **106.8 ms** | 102.6 ms | 4.1 ms | 3.8% | 1.62x | 1 | n/a |
| Vize | **158.5 ms** | 150.0 ms | 18.2 ms | 11.1% ⚠ | 2.40x | 1 | n/a |
| Verter | **496.7 ms** | 484.3 ms | 7.2 ms | 1.5% | 7.52x | 3 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 66.0 ms, 63.2 ms, 74.8 ms
- **Volar (JS)**: 110.7 ms, 106.8 ms, 102.6 ms
- **Vize**: 158.5 ms, 150.0 ms, 184.9 ms
- **Verter**: 496.8 ms, 496.7 ms, 484.3 ms

</details>

#### Peak RSS (process tree)

| Tool | **Peak RSS** |
| --- | ---: |
| Vize | **344.4 MB** |
| Volar (JS) | **601.3 MB** |
| Verter | **619.5 MB** |
| Volar (N) | **705.2 MB** |


<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- `didOpen -> first diagnostics` is MEASURED BUT NOT RANKED: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. Its median column is empty by design; the measured time is in the row's note and under Raw runs.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260603.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · navigation

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### Definition: <ChildCard/> tag

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.6 ms** | 1.00x | **0.4 ms** | 0.3 ms | 0.0 ms | 5.9% | 1.00x | 1 | n/a |
| Volar (N) | **459.9 ms** | 779.49x | **17.5 ms** | 16.8 ms | 5.9 ms | 28.7% ⚠ | 47.39x | 1 | n/a |
| Volar (JS) | **1.10 s** | 1858.83x | **173.6 ms** | 173.6 ms | 1.7 ms | 0.9% | 469.25x | 1 | n/a |
| Vize ⚠ | (357.3 ms) | not ranked | (0.3 ms) | (0.2 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: every provider rejected textDocument/definition: vize: textDocument/definition timed out after 5000ms | Sample: "vize: textDocument/definition timed out after 5000ms" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.4 ms, 0.3 ms, 0.4 ms
- **Volar (N)**: 17.5 ms, 27.4 ms, 16.8 ms
- **Volar (JS)**: 173.6 ms, 173.6 ms, 176.4 ms
- **Vize**: 0.3 ms, 0.2 ms, 0.5 ms

</details>

#### Definition: imported fn (script)

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 1.00x | **0.3 ms** | 0.3 ms | 0.0 ms | 9.6% | 1.00x | 1 | n/a |
| Vize | **363.4 ms** | 850.11x | **4.5 ms** | 4.5 ms | 0.1 ms | 3.2% | 14.63x | 1 | n/a |
| Volar (N) | **448.3 ms** | 1048.49x | **17.4 ms** | 16.8 ms | 3.4 ms | 17.8% ⚠ | 56.65x | 1 | n/a |
| Volar (JS) | **1.12 s** | 2614.81x | **170.1 ms** | 167.0 ms | 2.5 ms | 1.5% | 553.00x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.3 ms, 0.4 ms
- **Vize**: 4.5 ms, 4.7 ms, 4.5 ms
- **Volar (N)**: 23.0 ms, 17.4 ms, 16.8 ms
- **Volar (JS)**: 171.9 ms, 167.0 ms, 170.1 ms

</details>

#### Type definition: typed binding

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **7.2 ms** | 7.1 ms | 0.4 ms | 5.2% | 1.00x | 1 | n/a |
| Volar (N) | **48.7 ms** | 48.5 ms | 0.4 ms | 0.8% | 6.75x | 1 | n/a |
| Vize | **58.6 ms** | 57.1 ms | 2.2 ms | 3.8% | 8.11x | 1 | n/a |
| Verter | **280.4 ms** | 270.8 ms | 11.5 ms | 4.1% | 38.84x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 7.8 ms, 7.1 ms, 7.2 ms
- **Volar (N)**: 49.3 ms, 48.5 ms, 48.7 ms
- **Vize**: 58.6 ms, 61.5 ms, 57.1 ms
- **Verter**: 270.8 ms, 280.4 ms, 293.7 ms

</details>

#### References: prop -> parent template

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **92.7 ms** | 73.2 ms | 12.0 ms | 13.8% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **138.1 ms** | 133.9 ms | 5.3 ms | 3.8% | 1.49x | 4 | n/a |
| Vize ⚠ | (9.7 ms) | (7.6 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (118.6 ms) | (91.9 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@2:11 childcard.vue@11:2" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 92.7 ms, 73.2 ms, 94.9 ms
- **Volar (JS)**: 138.1 ms, 133.9 ms, 144.4 ms
- **Vize**: 7.6 ms, 11.5 ms, 9.7 ms
- **Verter**: 132.1 ms, 118.6 ms, 91.9 ms

</details>

#### Prepare rename: prop

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **2.2 ms** | 2.0 ms | 0.5 ms | 21.0% ⚠ | 1.00x | n/a | n/a |
| Volar (JS) | **5.6 ms** | 5.5 ms | 0.4 ms | 6.5% | 2.56x | n/a | n/a |
| Volar (N) ⚠ | (17.9 ms) | (5.9 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N) ⚠**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2 | ⚠ TOO NOISY TO RANK — CV 52.8% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 3.0 ms, 2.0 ms, 2.2 ms
- **Volar (JS)**: 5.6 ms, 6.2 ms, 5.5 ms
- **Volar (N)**: 5.9 ms, 20.7 ms, 17.9 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Rename prop (cross-file edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **4.0 ms** | 3.9 ms | 0.2 ms | 4.4% | 1.00x | 4 | n/a |
| Volar (N) | **4.6 ms** | 3.5 ms | 1.0 ms | 21.7% ⚠ | 1.14x | 4 | n/a |
| Vize ⚠ | (7.4 ms) | (6.9 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (1.3 ms) | (1.2 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:2 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:2 :: []" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:3 :: []" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 4.0 ms, 4.2 ms, 3.9 ms
- **Volar (N)**: 3.5 ms, 4.6 ms, 5.4 ms
- **Vize**: 7.8 ms, 7.4 ms, 6.9 ms
- **Verter**: 1.2 ms, 1.3 ms, 1.3 ms

</details>

#### Code action at diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **34.8 ms** | 34.3 ms | 0.8 ms | 2.2% | 1.00x | 2 | n/a |
| Volar (N) | **708.8 ms** | 705.2 ms | 10.8 ms | 1.5% | 20.34x | 2 | n/a |
| Vize ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.7 ms) | (0.6 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 34.3 ms, 35.8 ms, 34.8 ms
- **Volar (N)**: 705.2 ms, 725.4 ms, 708.8 ms
- **Vize**: 0.6 ms, 0.5 ms, 0.4 ms
- **Verter**: 0.6 ms, 0.8 ms, 0.7 ms

</details>

#### Signature help after `(`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **18.6 ms** | 18.5 ms | 0.1 ms | 0.5% | 1.00x | 1 | n/a |
| Volar (N) | **25.0 ms** | 24.5 ms | 3.0 ms | 11.4% ⚠ | 1.35x | 1 | n/a |
| Vize | **160.3 ms** | 153.2 ms | 6.1 ms | 3.8% | 8.64x | 1 | n/a |
| Verter ⚠ | (6.0 ms) | (5.0 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 18.5 ms, 18.7 ms, 18.6 ms
- **Volar (N)**: 30.0 ms, 25.0 ms, 24.5 ms
- **Vize**: 165.3 ms, 153.2 ms, 160.3 ms
- **Verter**: 6.1 ms, 5.0 ms, 6.0 ms

</details>

#### Format unformatted SFC

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 0.5 ms | 0.4 ms | 47.9% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **63.4 ms** | 60.8 ms | 2.4 ms | 3.8% | 110.77x | 1 | n/a |
| Volar (N) | **117.1 ms** | 86.9 ms | 19.1 ms | 17.6% ⚠ | 204.67x | 1 | n/a |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.5 ms, 1.2 ms
- **Volar (JS)**: 60.8 ms, 63.4 ms, 65.6 ms
- **Volar (N)**: 86.9 ms, 117.1 ms, 122.4 ms
- **Verter**: 0.2 ms, 0.2 ms, 0.2 ms

</details>

#### Peak RSS (process tree)

| Tool | **Peak RSS** |
| --- | ---: |
| Verter | **249.6 MB** |
| Vize | **384.5 MB** |
| Volar (JS) | **548.4 MB** |
| Volar (N) | **834.0 MB** |


<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260603.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · smoke

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### Hover (script setup)

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **232.8 ms** | 1.00x | **25.4 ms** | 25.0 ms | 1.0 ms | 3.8% | 1.36x | 89 | n/a |
| Volar (N) | **480.8 ms** | 2.07x | **18.6 ms** | 17.5 ms | 2.6 ms | 13.3% ⚠ | 1.00x | 90 | n/a |
| Volar (JS) | **1.10 s** | 4.72x | **176.1 ms** | 170.2 ms | 5.1 ms | 2.9% | 9.46x | 90 | n/a |
| Verter ⚠ | (250.9 ms) | not ranked | (0.9 ms) | (0.8 ms) | – | – | not ranked | (89) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter ⚠**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | ⚠ TOO NOISY TO RANK — CV 154.2% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 25.0 ms, 26.8 ms, 25.4 ms
- **Volar (N)**: 17.5 ms, 22.4 ms, 18.6 ms
- **Volar (JS)**: 176.1 ms, 170.2 ms, 180.4 ms
- **Verter**: 22.2 ms, 0.9 ms, 0.8 ms

</details>

#### Hover (template interpolation)

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **223.5 ms** | 1.00x | **21.4 ms** | 20.0 ms | 0.8 ms | 4.0% | 14.02x | 38 | n/a |
| Verter | **243.8 ms** | 1.09x | **1.5 ms** | 1.1 ms | 0.8 ms | 45.6% ⚠ | 1.00x | 74 | n/a |
| Volar (N) | **485.6 ms** | 2.17x | **24.5 ms** | 20.2 ms | 2.5 ms | 11.0% ⚠ | 16.03x | 43 | n/a |
| Volar (JS) ⚠ | (1.15 s) | not ranked | (150.7 ms) | (7.3 ms) | – | – | not ranked | (43) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS) ⚠**: content verified | engine: TypeScript 6.0.3 (JS) | ⚠ TOO NOISY TO RANK — CV 80.6% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 21.5 ms, 20.0 ms, 21.4 ms
- **Verter**: 2.6 ms, 1.1 ms, 1.5 ms
- **Volar (N)**: 20.2 ms, 24.5 ms, 24.7 ms
- **Volar (JS)**: 154.8 ms, 150.7 ms, 7.3 ms

</details>

#### Peak RSS (process tree)

| Tool | **Peak RSS** |
| --- | ---: |
| Verter | **174.1 MB** |
| Vize | **264.1 MB** |
| Volar (JS) | **523.9 MB** |
| Volar (N) | **613.3 MB** |


<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
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
| Vize | **171.5 ms** | 171.5 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (JS) | **470.0 ms** | 470.0 ms | n/a | n/a | 2.74x | n/a | n/a |
| Volar (N) | **492.7 ms** | 492.7 ms | n/a | n/a | 2.87x | n/a | n/a |
| Verter | **609.3 ms** | 609.3 ms | n/a | n/a | 3.55x | n/a | n/a |

<details><summary>Notes</summary>

- **Vize**: all components verified · edit → diagnostic=69ms · hover after edit=56ms · completion=47ms
- **Volar (JS)**: all components verified · edit → diagnostic=394ms · hover after edit=51ms · completion=25ms
- **Volar (N)**: all components verified · edit → diagnostic=455ms · hover after edit=17ms · completion=20ms
- **Verter**: all components verified · edit → diagnostic=500ms · hover after edit=77ms · completion=33ms

</details>

<details><summary>Methodology</summary>

- Sum of three medians: edit-loop/diagnostics-error + edit-loop/hover-after-edit + completion/completion-script-member.
- Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.
- A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.
- Servers that failed a component are shown in brackets with the failing part named.
- Composites share one table across TypeScript engines with (JS)-tagged rows, exactly as the per-operation tables do — a JS-engine composite against a tsgo composite is an engine comparison, not a server comparison.

Raw runs:


</details>

