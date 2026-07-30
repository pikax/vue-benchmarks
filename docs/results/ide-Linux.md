# Ubuntu/Linux · ide ops

> Full report for `ide-Linux.md` — every collapsed block (methodology, gate notes, raw runs) that the
> [README](../../README.md) summary tables link here for. Auto-generated; do not edit.

## IDE operation results

- **Generated:** 2026-07-29T16:07:26.544Z
- **Runner:** linux/x64 · Node v22.23.1
- **Runs / warmups:** 3 / 1

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
| Vize | **0.6 ms** | 0.6 ms | 0.0 ms | 1.9% | 1.00x | 15 | n/a |
| Volar (N) | **642.1 ms** | 639.7 ms | 12.7 ms | 2.0% | 1092.98x | 48 | n/a |
| Volar (JS) | **736.8 ms** | 729.2 ms | 28.9 ms | 3.9% | 1254.20x | 48 | n/a |
| Verter ⚠ | (31.4 ms) | (26.6 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no tokens at all for this document | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.6 ms, 0.6 ms
- **Volar (N)**: 642.1 ms, 639.7 ms, 662.9 ms
- **Volar (JS)**: 782.7 ms, 736.8 ms, 729.2 ms
- **Verter**: 36.7 ms, 31.4 ms, 26.6 ms

</details>

#### Semantic tokens (delta after edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (1.1 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1785340414918", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: TypeScript 6.0.3 (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1785340424304", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.0 ms, 1.0 ms, 1.2 ms
- **Volar (N)**: 1.1 ms, 1.0 ms, 1.1 ms
- **Vize**: 0.6 ms, 0.6 ms, 0.6 ms
- **Verter**: 0.4 ms, 0.5 ms, 0.5 ms

</details>

#### Document symbols (outline)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 0.4 ms | 0.0 ms | 7.3% | 1.00x | 12 | n/a |
| Volar (N) | **16.8 ms** | 16.6 ms | 0.2 ms | 1.0% | 42.81x | 25 | n/a |
| Volar (JS) | **17.4 ms** | 17.2 ms | 1.6 ms | 9.0% | 44.27x | 25 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (2) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — outline is missing 7/7 script symbols: heading, nextLabel, threshold, entries, visibleEntries, formatEntry, addEntry | Sample: "2 symbols: template, script setup" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.4 ms, 0.4 ms, 0.4 ms
- **Volar (N)**: 16.9 ms, 16.6 ms, 16.8 ms
- **Volar (JS)**: 17.4 ms, 20.1 ms, 17.2 ms
- **Vize**: 0.3 ms, 0.2 ms, 0.2 ms

</details>

#### Document highlight (caret move)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 6.0% | 1.00x | 4 | n/a |
| Verter | **0.3 ms** | 0.2 ms | 0.0 ms | 15.7% ⚠ | 1.28x | 4 | n/a |
| Volar (JS) | **17.5 ms** | 17.4 ms | 0.2 ms | 0.9% | 83.38x | 5 | n/a |
| Volar (N) | **29.7 ms** | 29.5 ms | 1.3 ms | 4.2% | 141.52x | 5 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.2 ms
- **Volar (JS)**: 17.5 ms, 17.4 ms, 17.7 ms
- **Volar (N)**: 29.5 ms, 31.8 ms, 29.7 ms

</details>

#### Inlay hints (document range)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 2.5% | 1.00x | 2 | n/a |
| Volar (JS) | **68.3 ms** | 68.1 ms | 0.4 ms | 0.6% | 152.99x | 14 | n/a |
| Volar (N) | **140.0 ms** | 134.9 ms | 3.6 ms | 2.6% | 313.41x | 14 | n/a |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.5 ms, 0.4 ms
- **Volar (JS)**: 68.1 ms, 68.3 ms, 68.9 ms
- **Volar (N)**: 141.9 ms, 134.9 ms, 140.0 ms
- **Verter**: 0.3 ms, 0.2 ms, 0.2 ms

</details>

#### Folding ranges

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 14.2% ⚠ | 1.00x | 2 | n/a |
| Verter | **0.3 ms** | 0.2 ms | 0.1 ms | 20.4% ⚠ | 1.52x | 7 | n/a |
| Volar (JS) | **10.0 ms** | 9.3 ms | 3.3 ms | 28.6% ⚠ | 56.65x | 13 | n/a |
| Volar (N) | **21.0 ms** | 20.5 ms | 0.5 ms | 2.4% | 119.39x | 13 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.2 ms
- **Volar (JS)**: 15.4 ms, 10.0 ms, 9.3 ms
- **Volar (N)**: 20.5 ms, 21.5 ms, 21.0 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.8 ms | 0.0 ms | 4.7% | 1.00x | 3 | n/a |
| Volar (N) | **3.0 ms** | 2.7 ms | 0.4 ms | 13.6% ⚠ | 3.59x | 3 | n/a |
| Volar (JS) | **38.9 ms** | 3.1 ms | 20.7 ms | 76.6% ⚠ | 46.12x | 3 | n/a |
| Vize ⚠ | (5.01 s) | (5.01 s) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — request failed: vize: textDocument/completion timed out after 5000ms | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.9 ms, 0.8 ms, 0.8 ms
- **Volar (N)**: 2.7 ms, 3.0 ms, 3.5 ms
- **Volar (JS)**: 38.9 ms, 3.1 ms, 38.9 ms
- **Vize**: 5.01 s, 5.01 s, 5.01 s

</details>

#### Completion: component tag &lt;Ch

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **33.7 ms** | 32.5 ms | 9.6 ms | 25.0% ⚠ | 1.00x | 1,193 | n/a |
| Volar (JS) | **42.1 ms** | 40.6 ms | 2.4 ms | 5.6% | 1.25x | 192 | n/a |
| Volar (N) | **65.6 ms** | 58.9 ms | 4.3 ms | 6.8% | 1.95x | 192 | n/a |
| Vize ⚠ | (5.01 s) | (5.00 s) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — request failed: vize: textDocument/completion timed out after 5000ms | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 49.8 ms, 33.7 ms, 32.5 ms
- **Volar (JS)**: 45.3 ms, 40.6 ms, 42.1 ms
- **Volar (N)**: 66.9 ms, 65.6 ms, 58.9 ms
- **Vize**: 5.00 s, 5.01 s, 5.01 s

</details>

#### Completion: prop name &lt;C :

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **5.2 ms** | 1.7 ms | 2.0 ms | 50.5% ⚠ | 1.00x | 16 | n/a |
| Volar (N) | **17.0 ms** | 14.2 ms | 2.0 ms | 12.0% ⚠ | 3.30x | 26 | n/a |
| Volar (JS) | **118.0 ms** | 108.3 ms | 26.3 ms | 20.5% ⚠ | 22.90x | 26 | n/a |
| Vize ⚠ | (5.01 s) | (5.01 s) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — request failed: vize: textDocument/completion timed out after 5000ms | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 1.7 ms, 5.2 ms, 5.2 ms
- **Volar (N)**: 14.2 ms, 17.0 ms, 17.9 ms
- **Volar (JS)**: 108.3 ms, 157.8 ms, 118.0 ms
- **Vize**: 5.01 s, 5.01 s, 5.01 s

</details>

#### Completion: event name &lt;C @

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **8.2 ms** | 7.8 ms | 0.4 ms | 5.3% | 1.00x | 25 | n/a |
| Volar (JS) | **10.8 ms** | 10.7 ms | 30.8 ms | 108.1% ⚠ | 1.32x | 25 | n/a |
| Vize ⚠ | (5.01 s) | (5.01 s) | – | – | not ranked | – | – |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — request failed: vize: textDocument/completion timed out after 5000ms | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 8.6 ms, 8.2 ms, 7.8 ms
- **Volar (JS)**: 10.8 ms, 10.7 ms, 64.0 ms
- **Vize**: 5.01 s, 5.01 s, 5.01 s
- **Verter**: 0.3 ms, 0.4 ms, 0.5 ms

</details>

#### Completion: directive v-

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.7 ms** | 15.7 ms | 0.9 ms | 5.5% | 1.00x | 498 | n/a |
| Volar (JS) | **28.2 ms** | 25.1 ms | 2.5 ms | 9.1% | 1.68x | 498 | n/a |
| Vize ⚠ | (5.00 s) | (5.00 s) | – | – | not ranked | – | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — request failed: vize: textDocument/completion timed out after 5000ms | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `v-if` directive in 3 items | Sample: "[style scoped, style, i18n]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 15.7 ms, 17.5 ms, 16.7 ms
- **Volar (JS)**: 30.1 ms, 28.2 ms, 25.1 ms
- **Vize**: 5.01 s, 5.00 s, 5.00 s
- **Verter**: 0.3 ms, 0.5 ms, 0.3 ms

</details>

#### Completion: slot name &lt;template #

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 0.3 ms | 0.2 ms | 49.1% ⚠ | 1.00x | 2 | n/a |
| Volar (N) | **14.6 ms** | 14.3 ms | 0.8 ms | 5.6% | 50.64x | 500 | n/a |
| Volar (JS) | **71.2 ms** | 15.2 ms | 43.5 ms | 69.7% ⚠ | 247.14x | 500 | n/a |
| Vize ⚠ | (5.01 s) | (5.00 s) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — request failed: vize: textDocument/completion timed out after 5000ms | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.6 ms, 0.3 ms
- **Volar (N)**: 15.9 ms, 14.3 ms, 14.6 ms
- **Volar (JS)**: 100.9 ms, 71.2 ms, 15.2 ms
- **Vize**: 5.00 s, 5.01 s, 5.01 s

</details>

#### Completion: auto-import

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **31.7 ms** | 29.3 ms | 4.7 ms | 14.1% ⚠ | 1.00x | 1,077 | n/a |
| Volar (N) | **52.8 ms** | 52.3 ms | 3.1 ms | 5.8% | 1.67x | 1,077 | n/a |
| Vize ⚠ | (5.01 s) | (5.01 s) | – | – | not ranked | – | – |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — request failed: vize: textDocument/completion timed out after 5000ms | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 29.3 ms, 31.7 ms, 38.3 ms
- **Volar (N)**: 52.8 ms, 57.9 ms, 52.3 ms
- **Vize**: 5.01 s, 5.01 s, 5.01 s
- **Verter**: 0.3 ms, 1.6 ms, 0.4 ms

</details>

#### Resolve: auto-import edit

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **24.4 ms** | 24.0 ms | 0.3 ms | 1.0% | 1.00x | 241 | n/a |
| Volar (JS) | **39.9 ms** | 35.6 ms | 6.1 ms | 14.8% ⚠ | 1.64x | 241 | n/a |
| Vize ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "(empty list)" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 24.0 ms, 24.4 ms, 24.5 ms
- **Volar (JS)**: 47.6 ms, 35.6 ms, 39.9 ms
- **Vize**: 0.0 ms, 0.2 ms, 0.0 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **2.4 ms** | 2.2 ms | 0.1 ms | 4.2% | 1.00x | 25 | n/a |
| Volar (JS) | **2.7 ms** | 2.5 ms | 0.6 ms | 19.2% ⚠ | 1.14x | 25 | n/a |
| Verter | **4.3 ms** | 4.3 ms | 0.5 ms | 11.2% ⚠ | 1.83x | 25 | n/a |
| Vize ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — script member completion offered no `quaver` item to resolve (0 items) | Sample: "(empty list)" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 2.4 ms, 2.4 ms, 2.2 ms
- **Volar (JS)**: 2.7 ms, 2.5 ms, 3.5 ms
- **Verter**: 4.3 ms, 5.2 ms, 4.3 ms
- **Vize**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 1.11 s, min 1.10 s, CV 2.7%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 1.10 s, min 1.09 s, CV 1.4%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize**: content verified | NOT RANKED (informational) — measured 277.9 ms, min 274.6 ms, CV 1.3%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter**: content verified | NOT RANKED (informational) — measured 312.7 ms, min 312.4 ms, CV 0.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.10 s, 1.11 s, 1.15 s
- **Volar (N)**: 1.12 s, 1.09 s, 1.10 s
- **Vize**: 277.9 ms, 282.0 ms, 274.6 ms
- **Verter**: 312.8 ms, 312.4 ms, 312.7 ms

</details>

#### Edit plants type error -> reported

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **129.9 ms** | 80.7 ms | 30.9 ms | 26.6% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **381.3 ms** | 377.8 ms | 2.2 ms | 0.6% | 2.93x | 1 | n/a |
| Volar (N) | **394.4 ms** | 393.5 ms | 1.0 ms | 0.3% | 3.04x | 1 | n/a |
| Verter | **498.4 ms** | 480.7 ms | 11.5 ms | 2.3% | 3.84x | 1 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 80.7 ms, 137.7 ms, 129.9 ms
- **Volar (JS)**: 381.3 ms, 377.8 ms, 381.7 ms
- **Volar (N)**: 395.5 ms, 394.4 ms, 393.5 ms
- **Verter**: 498.4 ms, 502.4 ms, 480.7 ms

</details>

#### Edit fixes it -> diagnostic clears

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **141.3 ms** | 90.1 ms | 31.3 ms | 24.8% ⚠ | 1.00x | 0 | n/a |
| Volar (N) | **393.6 ms** | 392.9 ms | 9.2 ms | 2.3% | 2.79x | 0 | n/a |
| Verter | **429.9 ms** | 417.0 ms | 69.5 ms | 15.0% ⚠ | 3.04x | 0 | n/a |
| Volar (JS) | **459.5 ms** | 456.9 ms | 1.8 ms | 0.4% | 3.25x | 0 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 141.3 ms, 90.1 ms, 146.9 ms
- **Volar (N)**: 393.6 ms, 392.9 ms, 409.2 ms
- **Verter**: 543.3 ms, 417.0 ms, 429.9 ms
- **Volar (JS)**: 456.9 ms, 460.4 ms, 459.5 ms

</details>

#### Hover after retype -> NEW type

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **35.4 ms** | 35.2 ms | 0.8 ms | 2.1% | 1.00x | 47 | n/a |
| Volar (JS) | **51.3 ms** | 50.6 ms | 3.3 ms | 6.3% | 1.45x | 47 | n/a |
| Verter | **53.2 ms** | 50.6 ms | 4.3 ms | 8.0% | 1.50x | 40 | n/a |
| Vize | **138.4 ms** | 96.4 ms | 24.5 ms | 19.6% ⚠ | 3.91x | 111 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 36.6 ms, 35.2 ms, 35.4 ms
- **Volar (JS)**: 51.3 ms, 56.6 ms, 50.6 ms
- **Verter**: 59.1 ms, 50.6 ms, 53.2 ms
- **Vize**: 138.4 ms, 96.4 ms, 139.1 ms

</details>

#### ... same hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **35.4 ms** | 35.2 ms | 0.8 ms | 2.1% | 1.00x | 1 | n/a |
| Volar (JS) | **51.3 ms** | 50.6 ms | 3.3 ms | 6.3% | 1.45x | 1 | n/a |
| Verter | **53.2 ms** | 50.6 ms | 4.3 ms | 8.0% | 1.50x | 1 | n/a |
| Vize | **138.4 ms** | 96.4 ms | 24.5 ms | 19.6% ⚠ | 3.91x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 36.6 ms, 35.2 ms, 35.4 ms
- **Volar (JS)**: 51.3 ms, 56.6 ms, 50.6 ms
- **Verter**: 59.1 ms, 50.6 ms, 53.2 ms
- **Vize**: 138.4 ms, 96.4 ms, 139.1 ms

</details>

#### Steady state: edits 1-5 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **32.5 ms** | 31.6 ms | 15.8 ms | 38.4% ⚠ | 1.00x | n/a | n/a |
| Volar (N) | **37.5 ms** | 37.5 ms | 1.2 ms | 3.1% | 1.15x | n/a | n/a |
| Volar (JS) | **39.7 ms** | 39.2 ms | 1.1 ms | 2.7% | 1.22x | n/a | n/a |
| Vize | **139.4 ms** | 136.9 ms | 3.6 ms | 2.5% | 4.29x | n/a | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 59.5 ms, 31.6 ms, 32.5 ms
- **Volar (N)**: 37.5 ms, 39.6 ms, 37.5 ms
- **Volar (JS)**: 39.2 ms, 39.7 ms, 41.3 ms
- **Vize**: 144.0 ms, 139.4 ms, 136.9 ms

</details>

#### Steady state: edits 6-10 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **32.5 ms** | 30.9 ms | 0.9 ms | 2.9% | 1.00x | -5 | n/a |
| Verter | **32.7 ms** | 27.6 ms | 4.1 ms | 12.8% ⚠ | 1.01x | -24 | n/a |
| Volar (JS) | **33.3 ms** | 32.8 ms | 0.3 ms | 1.0% | 1.03x | -6 | n/a |
| Vize | **139.4 ms** | 138.4 ms | 0.6 ms | 0.5% | 4.29x | -4 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 32.5 ms, 30.9 ms, 32.6 ms
- **Verter**: 35.8 ms, 27.6 ms, 32.7 ms
- **Volar (JS)**: 33.5 ms, 32.8 ms, 33.3 ms
- **Vize**: 139.5 ms, 138.4 ms, 139.4 ms

</details>

#### Child prop retype -> Parent diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **224.7 ms** | 215.5 ms | 29.5 ms | 12.5% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **377.9 ms** | 376.1 ms | 1.1 ms | 0.3% | 1.68x | 1 | n/a |
| Volar (N) | **378.2 ms** | 378.0 ms | 0.7 ms | 0.2% | 1.68x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 224.7 ms, 270.5 ms, 215.5 ms
- **Volar (JS)**: 376.1 ms, 378.2 ms, 377.9 ms
- **Volar (N)**: 379.4 ms, 378.2 ms, 378.0 ms
- **Verter**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Child prop retype -> Parent hover

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **58.4 ms** | 57.5 ms | 8.5 ms | 13.5% ⚠ | 1.00x | 42 | n/a |
| Volar (JS) | **104.2 ms** | 103.3 ms | 1.7 ms | 1.7% | 1.79x | 42 | n/a |
| Vize ⚠ | (224.7 ms) | (221.3 ms) | – | – | not ranked | (113) | – |
| Verter ⚠ | (4.8 ms) | (4.6 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; never caught up) | Sample: "**TypeScript quick info**\n\n_Resolved through Vize virtual TypeScript_\n\n```typescript\n(property) label: string\n```" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 578ms) | Sample: "```typescript\n(property) label: string\n```" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 58.4 ms, 72.6 ms, 57.5 ms
- **Volar (JS)**: 104.2 ms, 103.3 ms, 106.6 ms
- **Vize**: 224.7 ms, 276.4 ms, 221.3 ms
- **Verter**: 76.3 ms, 4.6 ms, 4.8 ms

</details>

#### ... Parent hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **58.4 ms** | 57.5 ms | 8.5 ms | 13.5% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **104.2 ms** | 103.3 ms | 1.7 ms | 1.7% | 1.79x | 1 | n/a |
| Verter | **433.8 ms** | 432.0 ms | 83.6 ms | 17.4% ⚠ | 7.43x | 3 | n/a |
| Vize ⚠ | (3.07 s) | (3.07 s) | – | – | not ranked | (15) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — hover never reported `label: number` within 3000ms across 15 attempts — STALE: still reports `label: string` after the edit changed it to `number` | Sample: "**TypeScript quick info**\n\n_Resolved through Vize virtual TypeScript_\n\n```typescript\n(property) label: string\n```" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 58.4 ms, 72.6 ms, 57.5 ms
- **Volar (JS)**: 104.2 ms, 103.3 ms, 106.6 ms
- **Verter**: 577.7 ms, 432.0 ms, 433.8 ms
- **Vize**: 3.07 s, 3.12 s, 3.07 s

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- `didOpen -> first diagnostics` is MEASURED BUT NOT RANKED: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. Its median column is empty by design; the measured time is in the row's note and under Raw runs.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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

#### Definition: &lt;ChildCard/> tag

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.6 ms | 0.3 ms | 32.8% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **9.0 ms** | 8.9 ms | 0.3 ms | 3.2% | 10.70x | 1 | n/a |
| Volar (JS) | **195.3 ms** | 185.5 ms | 9.1 ms | 4.7% | 232.19x | 1 | n/a |
| Vize ⚠ | (3.4 ms) | (3.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/definition: vize: textDocument/definition timed out after 5000ms | Sample: "vize: textDocument/definition timed out after 5000ms" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 1.2 ms, 0.8 ms, 0.6 ms
- **Volar (N)**: 8.9 ms, 9.4 ms, 9.0 ms
- **Volar (JS)**: 185.5 ms, 195.3 ms, 203.6 ms
- **Vize**: 5.01 s, 3.4 ms, 3.3 ms

</details>

#### Definition: imported fn (script)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 0.4 ms | 0.0 ms | 3.8% | 1.00x | 1 | n/a |
| Volar (JS) | **7.0 ms** | 6.7 ms | 0.3 ms | 4.0% | 17.37x | 1 | n/a |
| Volar (N) | **25.7 ms** | 24.6 ms | 5.6 ms | 19.9% ⚠ | 63.56x | 1 | n/a |
| Vize ⚠ | (2.8 ms) | (2.7 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/definition: vize: textDocument/definition timed out after 5000ms | Sample: "vize: textDocument/definition timed out after 5000ms" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.4 ms, 0.4 ms, 0.4 ms
- **Volar (JS)**: 7.3 ms, 7.0 ms, 6.7 ms
- **Volar (N)**: 24.6 ms, 34.9 ms, 25.7 ms
- **Vize**: 5.01 s, 2.8 ms, 2.7 ms

</details>

#### Type definition: typed binding

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **6.0 ms** | 5.6 ms | 2.4 ms | 32.9% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **19.6 ms** | 19.1 ms | 4.0 ms | 18.7% ⚠ | 3.25x | 1 | n/a |
| Verter | **19.6 ms** | 3.7 ms | 10.2 ms | 66.5% ⚠ | 3.25x | 1 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/typeDefinition: vize: textDocument/typeDefinition timed out after 5000ms | Sample: "vize: textDocument/typeDefinition timed out after 5000ms" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 6.0 ms, 9.9 ms, 5.6 ms
- **Volar (JS)**: 26.3 ms, 19.6 ms, 19.1 ms
- **Verter**: 22.9 ms, 3.7 ms, 19.6 ms
- **Vize**: 5.01 s, 0.2 ms, 0.2 ms

</details>

#### References: prop -> parent template

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **116.2 ms** | 113.2 ms | 8.1 ms | 6.8% | 1.00x | 4 | n/a |
| Volar (N) | **354.3 ms** | 349.7 ms | 8.5 ms | 2.4% | 3.05x | 4 | n/a |
| Vize ⚠ | (0.7 ms) | (0.6 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (98.4 ms) | (72.8 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/references: vize: textDocument/references timed out after 60000ms | Sample: "vize: textDocument/references timed out after 60000ms" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 113.2 ms, 116.2 ms, 128.4 ms
- **Volar (N)**: 366.2 ms, 354.3 ms, 349.7 ms
- **Vize**: 60.03 s, 0.6 ms, 0.7 ms
- **Verter**: 72.8 ms, 98.4 ms, 113.5 ms

</details>

#### Prepare rename: prop

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **6.2 ms** | 5.0 ms | 1.3 ms | 21.2% ⚠ | 1.00x | n/a | n/a |
| Volar (N) | **6.7 ms** | 6.4 ms | 0.2 ms | 3.3% | 1.07x | n/a | n/a |
| Vize ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/prepareRename: vize: textDocument/prepareRename timed out after 5000ms | Sample: "vize: textDocument/prepareRename timed out after 5000ms" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 6.2 ms, 7.6 ms, 5.0 ms
- **Volar (N)**: 6.4 ms, 6.7 ms, 6.8 ms
- **Vize**: 5.01 s, 0.6 ms, 0.6 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.6 ms

</details>

#### Rename prop (cross-file edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.5 ms** | 3.0 ms | 0.4 ms | 11.4% ⚠ | 1.00x | 4 | n/a |
| Volar (N) | **4.6 ms** | 4.3 ms | 0.3 ms | 6.7% | 1.32x | 4 | n/a |
| Vize ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (1.3 ms) | (1.2 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/rename: vize: textDocument/rename timed out after 60000ms | Sample: "vize: textDocument/rename timed out after 60000ms" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:3 :: []" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 3.5 ms, 3.7 ms, 3.0 ms
- **Volar (N)**: 4.3 ms, 4.9 ms, 4.6 ms
- **Vize**: 60.05 s, 0.6 ms, 0.6 ms
- **Verter**: 1.2 ms, 1.3 ms, 1.4 ms

</details>

#### Code action at diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **32.1 ms** | 31.7 ms | 2.4 ms | 7.2% | 1.00x | 2 | n/a |
| Volar (N) | **77.1 ms** | 76.8 ms | 12.4 ms | 14.7% ⚠ | 2.40x | 2 | n/a |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.7 ms) | (0.6 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/codeAction: vize: textDocument/codeAction timed out after 5000ms | Sample: "vize: textDocument/codeAction timed out after 5000ms" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 32.1 ms, 36.1 ms, 31.7 ms
- **Volar (N)**: 76.8 ms, 77.1 ms, 98.4 ms
- **Vize**: 5.01 s, 0.4 ms, 0.4 ms
- **Verter**: 0.6 ms, 0.8 ms, 0.7 ms

</details>

#### Signature help after `(`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **16.2 ms** | 15.7 ms | 0.4 ms | 2.5% | 1.00x | 1 | n/a |
| Volar (N) | **32.6 ms** | 31.5 ms | 0.7 ms | 2.2% | 2.01x | 1 | n/a |
| Vize ⚠ | (146.4 ms) | (140.3 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (6.1 ms) | (4.9 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/signatureHelp: vize: textDocument/signatureHelp timed out after 5000ms | Sample: "vize: textDocument/signatureHelp timed out after 5000ms" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 15.7 ms, 16.2 ms, 16.5 ms
- **Volar (N)**: 31.5 ms, 32.7 ms, 32.6 ms
- **Vize**: 5.01 s, 140.3 ms, 146.4 ms
- **Verter**: 4.9 ms, 6.7 ms, 6.1 ms

</details>

#### Format unformatted SFC

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **62.3 ms** | 61.7 ms | 2.4 ms | 3.8% | 1.00x | 1 | n/a |
| Volar (N) | **63.4 ms** | 61.0 ms | 3.9 ms | 6.1% | 1.02x | 1 | n/a |
| Vize ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/formatting: vize: textDocument/formatting timed out after 5000ms | Sample: "vize: textDocument/formatting timed out after 5000ms" | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 66.1 ms, 61.7 ms, 62.3 ms
- **Volar (N)**: 61.0 ms, 68.6 ms, 63.4 ms
- **Vize**: 5.00 s, 0.5 ms, 0.5 ms
- **Verter**: 0.2 ms, 0.2 ms, 0.3 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260602.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **251.1 ms** | 222.1 ms | 22.8 ms | 9.2% | 1.00x | 89 | n/a |
| Vize | **304.6 ms** | 261.3 ms | 28.4 ms | 9.7% | 1.21x | 388 | n/a |
| Volar (JS) | **1.07 s** | 1.06 s | 11.0 ms | 1.0% | 4.27x | 90 | n/a |
| Volar (N) | **1.10 s** | 1.09 s | 7.4 ms | 0.7% | 4.38x | 90 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Verter**: 251.1 ms, 267.1 ms, 222.1 ms
- **Vize**: 304.6 ms, 261.3 ms, 315.0 ms
- **Volar (JS)**: 1.06 s, 1.07 s, 1.08 s
- **Volar (N)**: 1.09 s, 1.10 s, 1.10 s

</details>

#### Hover (template interpolation)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.4 ms** | 1.0 ms | 0.6 ms | 36.8% ⚠ | 1.00x | 74 | n/a |
| Vize | **4.9 ms** | 4.7 ms | 0.2 ms | 4.0% | 3.58x | 107 | n/a |
| Volar (N) | **10.9 ms** | 10.7 ms | 0.1 ms | 1.3% | 7.99x | 43 | n/a |
| Volar (JS) | **199.8 ms** | 199.1 ms | 2.4 ms | 1.2% | 145.89x | 43 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260602.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.6.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 1.4 ms, 2.1 ms, 1.0 ms
- **Vize**: 4.9 ms, 4.7 ms, 5.1 ms
- **Volar (N)**: 10.7 ms, 10.9 ms, 11.0 ms
- **Volar (JS)**: 203.5 ms, 199.1 ms, 199.8 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
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
| Volar (N) | **432.8 ms** | 432.8 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (JS) | **471.5 ms** | 471.5 ms | n/a | n/a | 1.09x | n/a | n/a |
| Verter | **552.4 ms** | 552.4 ms | n/a | n/a | 1.28x | n/a | n/a |
| Vize ⚠ | (5.27 s) | (5.27 s) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: all components verified · edit → diagnostic=394ms · hover after edit=35ms · completion=3ms
- **Volar (JS)**: all components verified · edit → diagnostic=381ms · hover after edit=51ms · completion=39ms
- **Verter**: all components verified · edit → diagnostic=498ms · hover after edit=53ms · completion=1ms
- **Vize ⚠**: ⚠ FAILED VALIDATION — 1 of 3 components failed their gate (completion); the sum is shown for reference only. edit → diagnostic=130ms · hover after edit=138ms · completion=5006ms ✗

</details>

<details><summary>Methodology</summary>

- Sum of three medians: edit-loop/diagnostics-error + edit-loop/hover-after-edit + completion/completion-script-member.
- Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.
- A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.
- Servers that failed a component are shown in brackets with the failing part named.
- Composites share one table across TypeScript engines with (JS)-tagged rows, exactly as the per-operation tables do — a JS-engine composite against a tsgo composite is an engine comparison, not a server comparison.

Raw runs:


</details>
