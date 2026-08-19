# Ubuntu/Linux · ide ops

> Full report for `ide-Linux.md` — every table, collapsed block (methodology, gate notes, raw runs) that the
> [README](../../README.md) landing page charts link here for. Auto-generated; do not edit.

## IDE operation results

- **Generated:** 2026-08-16T09:15:20.140Z
- **Runner:** linux/x64 · Node v22.23.2
- **Runs / warmups:** 3 / 1

Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

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
| Vize | **0.6 ms** | 0.6 ms | 0.0 ms | 5.3% | 1.00x | 15 | n/a |
| Volar (N) | **359.6 ms** | 335.6 ms | 17.3 ms | 4.9% | 625.51x | 48 | n/a |
| Volar (JS) | **808.4 ms** | 787.5 ms | 56.5 ms | 6.8% | 1406.27x | 48 | n/a |
| Verter ⚠ | (33.7 ms) | (32.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no tokens at all for this document | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.6 ms, 0.6 ms
- **Volar (N)**: 359.6 ms, 335.6 ms, 369.1 ms
- **Volar (JS)**: 894.2 ms, 808.4 ms, 787.5 ms
- **Verter**: 33.7 ms, 32.2 ms, 132.7 ms

</details>

#### Semantic tokens (delta after edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (1.1 ms) | (0.9 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1786871515413", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: TypeScript 6.0.3 (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1786871524534", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.1 ms, 1.1 ms, 0.9 ms
- **Volar (N)**: 1.0 ms, 1.0 ms, 1.1 ms
- **Vize**: 0.4 ms, 0.4 ms, 0.4 ms
- **Verter**: 0.6 ms, 0.6 ms, 3.3 ms

</details>

#### Document symbols (outline)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.5 ms** | 0.5 ms | 0.1 ms | 11.4% ⚠ | 1.00x | 12 | n/a |
| Volar (N) | **17.0 ms** | 16.8 ms | 0.2 ms | 1.3% | 31.71x | 25 | n/a |
| Volar (JS) | **17.5 ms** | 16.6 ms | 3.5 ms | 18.4% ⚠ | 32.49x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (2) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — outline is missing 7/7 script symbols: heading, nextLabel, threshold, entries, visibleEntries, formatEntry, addEntry | Sample: "2 symbols: template, script setup" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.5 ms, 0.6 ms, 0.5 ms
- **Volar (N)**: 17.0 ms, 16.8 ms, 17.2 ms
- **Volar (JS)**: 23.1 ms, 17.5 ms, 16.6 ms
- **Vize**: 0.4 ms, 0.3 ms, 0.3 ms

</details>

#### Document highlight (caret move)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 5.9% | 1.00x | 4 | n/a |
| Volar (JS) | **18.6 ms** | 18.3 ms | 0.5 ms | 2.5% | 76.50x | 5 | n/a |
| Volar (N) | **30.7 ms** | 30.0 ms | 0.7 ms | 2.3% | 126.19x | 5 | n/a |
| Verter ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | (4) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter ⚠**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | ⚠ TOO NOISY TO RANK — CV 170.2% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.3 ms
- **Volar (JS)**: 19.2 ms, 18.6 ms, 18.3 ms
- **Volar (N)**: 30.7 ms, 30.0 ms, 31.4 ms
- **Verter**: 0.4 ms, 0.5 ms, 74.2 ms

</details>

#### Inlay hints (document range)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 3.2% | 1.00x | 2 | n/a |
| Volar (JS) | **74.0 ms** | 71.9 ms | 1.5 ms | 2.1% | 167.98x | 14 | n/a |
| Volar (N) | **176.5 ms** | 174.8 ms | 6.8 ms | 3.8% | 400.56x | 14 | n/a |
| Verter ⚠ | (0.6 ms) | (0.4 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.5 ms, 0.4 ms
- **Volar (JS)**: 71.9 ms, 74.0 ms, 74.8 ms
- **Volar (N)**: 174.8 ms, 176.5 ms, 187.3 ms
- **Verter**: 0.4 ms, 3.3 ms, 0.6 ms

</details>

#### Folding ranges

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 5.9% | 1.00x | 9 | n/a |
| Verter | **0.5 ms** | 0.3 ms | 0.1 ms | 21.2% ⚠ | 2.02x | 7 | n/a |
| Volar (N) | **6.6 ms** | 6.4 ms | 1.4 ms | 19.7% ⚠ | 29.02x | 13 | n/a |
| Volar (JS) | **123.5 ms** | 119.8 ms | 3.1 ms | 2.5% | 544.11x | 13 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.5 ms, 0.5 ms, 0.3 ms
- **Volar (N)**: 6.4 ms, 6.6 ms, 9.0 ms
- **Volar (JS)**: 123.5 ms, 126.1 ms, 119.8 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
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

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.8 ms** | 0.8 ms | 0.1 ms | 9.1% | 1.00x | 3 | n/a |
| Vize | **1.0 ms** | 1.0 ms | 0.0 ms | 2.7% | 1.27x | 3 | n/a |
| Volar (N) | **1.8 ms** | 1.8 ms | 0.2 ms | 9.3% | 2.27x | 3 | n/a |
| Volar (JS) ⚠ | (4.3 ms) | (3.9 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS) ⚠**: content verified | engine: TypeScript 6.0.3 (JS) | ⚠ TOO NOISY TO RANK — CV 134.3% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.9 ms, 0.8 ms, 0.8 ms
- **Vize**: 1.0 ms, 1.0 ms, 1.0 ms
- **Volar (N)**: 1.8 ms, 2.1 ms, 1.8 ms
- **Volar (JS)**: 4.3 ms, 3.9 ms, 46.4 ms

</details>

#### Completion: component tag &lt;Ch

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **35.8 ms** | 34.8 ms | 10.6 ms | 25.5% ⚠ | 1.00x | 1,193 | n/a |
| Volar (N) | **37.8 ms** | 37.0 ms | 0.5 ms | 1.3% | 1.06x | 192 | n/a |
| Volar (JS) | **41.7 ms** | 39.8 ms | 3.5 ms | 8.2% | 1.16x | 192 | n/a |
| Vize ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — no `ChildCard` component tag in 42 items | Sample: "[v-if, v-else-if, v-else, v-for, v-on, v-bind, v-model, v-slot, v-show, v-pre, v-once, v-memo, …+30]" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 53.6 ms, 34.8 ms, 35.8 ms
- **Volar (N)**: 37.8 ms, 37.9 ms, 37.0 ms
- **Volar (JS)**: 39.8 ms, 41.7 ms, 46.6 ms
- **Vize**: 0.6 ms, 0.6 ms, 0.6 ms

</details>

#### Completion: prop name &lt;C :

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.8 ms** | 1.5 ms | 0.2 ms | 13.2% ⚠ | 1.00x | 16 | n/a |
| Volar (N) | **40.1 ms** | 39.5 ms | 0.3 ms | 0.8% | 22.06x | 26 | n/a |
| Volar (JS) ⚠ | (27.3 ms) | (18.9 ms) | – | – | not ranked | (26) | – |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (4) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS) ⚠**: content verified | engine: TypeScript 6.0.3 (JS) | ⚠ TOO NOISY TO RANK — CV 104.6% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Vize ⚠**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly) | ⚠ TOO NOISY TO RANK — CV 71.7% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 1.9 ms, 1.8 ms, 1.5 ms
- **Volar (N)**: 40.2 ms, 39.5 ms, 40.1 ms
- **Volar (JS)**: 18.9 ms, 27.3 ms, 128.1 ms
- **Vize**: 0.4 ms, 0.4 ms, 1.1 ms

</details>

#### Completion: event name &lt;C @

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **7.4 ms** | 7.2 ms | 0.2 ms | 2.4% | 1.00x | 25 | n/a |
| Volar (JS) ⚠ | (134.8 ms) | (15.0 ms) | – | – | not ranked | (25) | – |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (12) | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS) ⚠**: content verified | engine: TypeScript 6.0.3 (JS) | ⚠ TOO NOISY TO RANK — CV 74.2% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Vize ⚠**: ⚠ FAILED VALIDATION — no `quench` declared emit in 12 items | Sample: "[v-on, @, @click, @input, @change, @submit, @keydown, @keyup, @focus, @blur, @mouseenter, @mouseleave]" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 7.5 ms, 7.4 ms, 7.2 ms
- **Volar (JS)**: 15.0 ms, 152.0 ms, 134.8 ms
- **Vize**: 0.4 ms, 0.4 ms, 0.4 ms
- **Verter**: 4.2 ms, 0.3 ms, 0.3 ms

</details>

#### Completion: directive v-

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 2.6% | 1.00x | 15 | n/a |
| Volar (N) | **16.4 ms** | 16.3 ms | 1.1 ms | 6.7% | 43.47x | 498 | n/a |
| Volar (JS) | **26.5 ms** | 23.8 ms | 2.6 ms | 9.9% | 70.24x | 498 | n/a |
| Verter ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `v-if` directive in 3 items | Sample: "[style scoped, style, i18n]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.4 ms, 0.4 ms
- **Volar (N)**: 18.3 ms, 16.4 ms, 16.3 ms
- **Volar (JS)**: 26.5 ms, 29.1 ms, 23.8 ms
- **Verter**: 0.4 ms, 0.4 ms, 0.4 ms

</details>

#### Completion: slot name &lt;template #

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 0.3 ms | 0.0 ms | 10.4% ⚠ | 1.00x | 2 | n/a |
| Vize | **0.6 ms** | 0.5 ms | 0.1 ms | 11.0% ⚠ | 1.72x | 30 | n/a |
| Volar (N) | **14.9 ms** | 13.7 ms | 0.8 ms | 5.4% | 42.81x | 500 | n/a |
| Volar (JS) | **15.5 ms** | 14.8 ms | 1.4 ms | 8.8% | 44.45x | 500 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.4 ms, 0.3 ms, 0.3 ms
- **Vize**: 0.6 ms, 0.5 ms, 0.7 ms
- **Volar (N)**: 14.9 ms, 15.3 ms, 13.7 ms
- **Volar (JS)**: 17.5 ms, 14.8 ms, 15.5 ms

</details>

#### Completion: auto-import

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **38.2 ms** | 31.7 ms | 4.3 ms | 11.8% ⚠ | 1.00x | 1,077 | n/a |
| Volar (N) | **48.7 ms** | 32.2 ms | 11.8 ms | 26.0% ⚠ | 1.28x | 1,073 | n/a |
| Vize ⚠ | (92.7 ms) | (90.6 ms) | – | – | not ranked | (1,103) | – |
| Verter ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import | Sample: "offered: \"getComputedStyle\" kind=3 ; \"computed\" kind=6 ; \"computed\" kind=3 detail=\"function computed&lt;T>(getter: () => T): ComputedRef&lt;T>\"" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 39.8 ms, 38.2 ms, 31.7 ms
- **Volar (N)**: 55.1 ms, 48.7 ms, 32.2 ms
- **Vize**: 94.9 ms, 92.7 ms, 90.6 ms
- **Verter**: 0.8 ms, 0.4 ms, 0.4 ms

</details>

#### Resolve: auto-import edit

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **49.7 ms** | 48.2 ms | 2.8 ms | 5.6% | 1.00x | 241 | n/a |
| Volar (N) | **162.8 ms** | 160.3 ms | 3.9 ms | 2.4% | 3.28x | 241 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` | Sample: "\"computed\" kind=6" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 53.7 ms, 49.7 ms, 48.2 ms
- **Volar (N)**: 162.8 ms, 160.3 ms, 167.9 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.1 ms** | 2.8 ms | 0.4 ms | 11.3% ⚠ | 1.00x | 25 | n/a |
| Verter | **4.3 ms** | 4.2 ms | 0.4 ms | 9.0% | 1.40x | 25 | n/a |
| Volar (N) | **8.2 ms** | 8.0 ms | 0.8 ms | 9.1% | 2.63x | 25 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no detail and no documentation | Sample: "\"quaver\" kind=5" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 2.8 ms, 3.1 ms, 3.5 ms
- **Verter**: 4.9 ms, 4.2 ms, 4.3 ms
- **Volar (N)**: 9.4 ms, 8.2 ms, 8.0 ms
- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
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

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 1.15 s, min 1.15 s, CV 0.7%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 498.5 ms, min 497.8 ms, CV 1.8%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | NOT RANKED (informational) — measured 297.5 ms, min 296.9 ms, CV 1.3%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | NOT RANKED (informational) — measured 314.1 ms, min 314.0 ms, CV 0.3%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.17 s, 1.15 s, 1.15 s
- **Volar (N)**: 498.5 ms, 497.8 ms, 514.2 ms
- **Vize**: 303.8 ms, 297.5 ms, 296.9 ms
- **Verter**: 315.8 ms, 314.1 ms, 314.0 ms

</details>

#### Edit plants type error -> reported

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **149.9 ms** | 144.9 ms | 9.5 ms | 6.2% | 1.00x | 1 | n/a |
| Volar (JS) | **412.1 ms** | 407.4 ms | 5.6 ms | 1.4% | 2.75x | 1 | n/a |
| Volar (N) | **461.1 ms** | 451.1 ms | 9.8 ms | 2.1% | 3.08x | 1 | n/a |
| Verter | **506.2 ms** | 495.2 ms | 6.7 ms | 1.3% | 3.38x | 1 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 149.9 ms, 144.9 ms, 163.3 ms
- **Volar (JS)**: 412.1 ms, 407.4 ms, 418.6 ms
- **Volar (N)**: 451.1 ms, 461.1 ms, 470.7 ms
- **Verter**: 506.2 ms, 495.2 ms, 507.2 ms

</details>

#### Edit fixes it -> diagnostic clears

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **145.9 ms** | 143.1 ms | 5.4 ms | 3.6% | 1.00x | 0 | n/a |
| Volar (N) | **382.1 ms** | 380.0 ms | 1.4 ms | 0.4% | 2.62x | 0 | n/a |
| Volar (JS) | **465.4 ms** | 460.7 ms | 5.7 ms | 1.2% | 3.19x | 0 | n/a |
| Verter | **661.5 ms** | 657.1 ms | 16.6 ms | 2.5% | 4.53x | 0 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 153.4 ms, 143.1 ms, 145.9 ms
- **Volar (N)**: 382.8 ms, 380.0 ms, 382.1 ms
- **Volar (JS)**: 472.2 ms, 460.7 ms, 465.4 ms
- **Verter**: 661.5 ms, 687.8 ms, 657.1 ms

</details>

#### Hover after retype -> NEW type

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.2 ms** | 15.8 ms | 0.7 ms | 4.5% | 1.00x | 47 | n/a |
| Volar (JS) | **53.2 ms** | 51.9 ms | 1.0 ms | 2.0% | 3.30x | 47 | n/a |
| Verter | **86.6 ms** | 82.9 ms | 5.0 ms | 5.8% | 5.36x | 40 | n/a |
| Vize | **233.3 ms** | 209.8 ms | 13.7 ms | 6.1% | 14.44x | 40 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 17.2 ms, 15.8 ms, 16.2 ms
- **Volar (JS)**: 53.2 ms, 54.0 ms, 51.9 ms
- **Verter**: 82.9 ms, 86.6 ms, 92.8 ms
- **Vize**: 209.8 ms, 233.3 ms, 233.8 ms

</details>

#### ... same hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.2 ms** | 15.8 ms | 0.7 ms | 4.5% | 1.00x | 1 | n/a |
| Volar (JS) | **53.2 ms** | 51.9 ms | 1.0 ms | 2.0% | 3.30x | 1 | n/a |
| Verter | **86.6 ms** | 82.9 ms | 5.0 ms | 5.8% | 5.36x | 1 | n/a |
| Vize | **233.3 ms** | 209.8 ms | 13.7 ms | 6.1% | 14.44x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 17.2 ms, 15.8 ms, 16.2 ms
- **Volar (JS)**: 53.2 ms, 54.0 ms, 51.9 ms
- **Verter**: 82.9 ms, 86.6 ms, 92.8 ms
- **Vize**: 209.8 ms, 233.3 ms, 233.8 ms

</details>

#### Steady state: edits 1-5 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **15.3 ms** | 14.9 ms | 0.3 ms | 1.9% | 1.00x | n/a | n/a |
| Volar (JS) | **42.1 ms** | 40.4 ms | 1.4 ms | 3.4% | 2.75x | n/a | n/a |
| Verter | **56.2 ms** | 50.5 ms | 3.4 ms | 6.3% | 3.67x | n/a | n/a |
| Vize | **175.2 ms** | 168.2 ms | 5.8 ms | 3.3% | 11.44x | n/a | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 14.9 ms, 15.3 ms, 15.4 ms
- **Volar (JS)**: 43.2 ms, 40.4 ms, 42.1 ms
- **Verter**: 56.5 ms, 50.5 ms, 56.2 ms
- **Vize**: 179.7 ms, 168.2 ms, 175.2 ms

</details>

#### Steady state: edits 6-10 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **14.9 ms** | 14.9 ms | 0.0 ms | 0.1% | 1.00x | 0 | n/a |
| Volar (JS) | **33.9 ms** | 32.9 ms | 1.4 ms | 4.0% | 2.27x | -9 | n/a |
| Verter | **58.4 ms** | 48.1 ms | 6.2 ms | 11.3% ⚠ | 3.92x | -8 | n/a |
| Vize | **171.2 ms** | 168.7 ms | 5.8 ms | 3.3% | 11.48x | -0 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 14.9 ms, 14.9 ms, 14.9 ms
- **Volar (JS)**: 33.9 ms, 35.6 ms, 32.9 ms
- **Verter**: 48.1 ms, 59.3 ms, 58.4 ms
- **Vize**: 179.7 ms, 168.7 ms, 171.2 ms

</details>

#### Child prop retype -> Parent diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **304.5 ms** | 297.7 ms | 28.0 ms | 8.8% | 1.00x | 1 | n/a |
| Volar (JS) | **378.2 ms** | 376.2 ms | 1.7 ms | 0.4% | 1.24x | 1 | n/a |
| Volar (N) | **383.6 ms** | 383.2 ms | 0.3 ms | 0.1% | 1.26x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 304.5 ms, 349.2 ms, 297.7 ms
- **Volar (JS)**: 379.6 ms, 376.2 ms, 378.2 ms
- **Volar (N)**: 383.8 ms, 383.2 ms, 383.6 ms
- **Verter**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Child prop retype -> Parent hover

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **64.2 ms** | 63.3 ms | 6.1 ms | 9.0% | 1.00x | 42 | n/a |
| Volar (JS) | **106.2 ms** | 104.5 ms | 5.6 ms | 5.1% | 1.65x | 42 | n/a |
| Vize | **338.8 ms** | 333.2 ms | 8.1 ms | 2.4% | 5.28x | 42 | n/a |
| Verter ⚠ | (4.7 ms) | (4.5 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 460ms) | Sample: "```typescript\n(property) label: string\n```" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 74.2 ms, 63.3 ms, 64.2 ms
- **Volar (JS)**: 104.5 ms, 114.8 ms, 106.2 ms
- **Vize**: 333.2 ms, 349.2 ms, 338.8 ms
- **Verter**: 15.0 ms, 4.5 ms, 4.7 ms

</details>

#### ... Parent hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **64.2 ms** | 63.3 ms | 6.1 ms | 9.0% | 1.00x | 1 | n/a |
| Volar (JS) | **106.2 ms** | 104.5 ms | 5.6 ms | 5.1% | 1.65x | 1 | n/a |
| Vize | **338.8 ms** | 333.2 ms | 8.1 ms | 2.4% | 5.28x | 1 | n/a |
| Verter | **499.6 ms** | 460.2 ms | 25.8 ms | 5.3% | 7.78x | 3 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 74.2 ms, 63.3 ms, 64.2 ms
- **Volar (JS)**: 104.5 ms, 114.8 ms, 106.2 ms
- **Vize**: 333.2 ms, 349.2 ms, 338.8 ms
- **Verter**: 460.2 ms, 508.7 ms, 499.6 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
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

#### Definition: &lt;ChildCard/> tag

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 0.3 ms | 0.1 ms | 19.6% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **28.3 ms** | 26.0 ms | 3.4 ms | 11.8% ⚠ | 80.80x | 1 | n/a |
| Volar (JS) | **215.2 ms** | 206.9 ms | 7.0 ms | 3.3% | 615.58x | 1 | n/a |
| Verter ⚠ | (0.7 ms) | (0.5 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter ⚠**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | ⚠ TOO NOISY TO RANK — CV 110.1% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.5 ms, 0.3 ms
- **Volar (N)**: 32.7 ms, 28.3 ms, 26.0 ms
- **Volar (JS)**: 220.8 ms, 206.9 ms, 215.2 ms
- **Verter**: 3.8 ms, 0.7 ms, 0.5 ms

</details>

#### Definition: imported fn (script)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **4.2 ms** | 4.1 ms | 0.1 ms | 2.3% | 1.00x | 1 | n/a |
| Volar (N) | **5.9 ms** | 5.7 ms | 0.7 ms | 10.8% ⚠ | 1.40x | 1 | n/a |
| Volar (JS) | **6.8 ms** | 6.6 ms | 2.5 ms | 30.4% ⚠ | 1.63x | 1 | n/a |
| Verter ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter ⚠**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | ⚠ TOO NOISY TO RANK — CV 110.9% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 4.2 ms, 4.3 ms, 4.1 ms
- **Volar (N)**: 6.9 ms, 5.7 ms, 5.9 ms
- **Volar (JS)**: 6.8 ms, 6.6 ms, 11.0 ms
- **Verter**: 0.4 ms, 0.5 ms, 2.8 ms

</details>

#### Type definition: typed binding

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **21.7 ms** | 20.5 ms | 2.9 ms | 12.8% ⚠ | 1.00x | 1 | n/a |
| Verter | **35.6 ms** | 30.9 ms | 6.3 ms | 17.3% ⚠ | 1.64x | 1 | n/a |
| Volar (N) | **67.3 ms** | 44.8 ms | 18.6 ms | 28.8% ⚠ | 3.10x | 1 | n/a |
| Vize ⚠ | (0.3 ms) | (0.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/typeDefinition: {"code":-32601,"message":"Method not found"} | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 21.7 ms, 26.0 ms, 20.5 ms
- **Verter**: 35.6 ms, 30.9 ms, 43.4 ms
- **Volar (N)**: 44.8 ms, 67.3 ms, 81.8 ms
- **Vize**: 0.3 ms, 0.2 ms, 0.3 ms

</details>

#### References: prop -> parent template

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **78.4 ms** | 63.4 ms | 19.1 ms | 23.6% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **123.1 ms** | 122.8 ms | 1.7 ms | 1.4% | 1.57x | 4 | n/a |
| Vize ⚠ | (7.2 ms) | (6.9 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (103.8 ms) | (86.9 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@2:11 childcard.vue@11:2" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 63.4 ms, 101.4 ms, 78.4 ms
- **Volar (JS)**: 126.0 ms, 122.8 ms, 123.1 ms
- **Vize**: 7.2 ms, 7.7 ms, 6.9 ms
- **Verter**: 103.8 ms, 113.8 ms, 86.9 ms

</details>

#### Prepare rename: prop

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.7 ms** | 1.7 ms | 0.0 ms | 2.4% | 1.00x | n/a | n/a |
| Volar (JS) | **5.7 ms** | 5.2 ms | 0.4 ms | 7.4% | 3.34x | n/a | n/a |
| Volar (N) ⚠ | (4.4 ms) | (4.2 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N) ⚠**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2 | ⚠ TOO NOISY TO RANK — CV 75.9% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.8 ms, 1.7 ms, 1.7 ms
- **Volar (JS)**: 5.7 ms, 6.0 ms, 5.2 ms
- **Volar (N)**: 14.4 ms, 4.4 ms, 4.2 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Rename prop (cross-file edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.1 ms** | 3.0 ms | 0.3 ms | 7.9% | 1.00x | 4 | n/a |
| Volar (N) | **4.0 ms** | 3.6 ms | 0.4 ms | 9.8% | 1.31x | 4 | n/a |
| Vize ⚠ | (5.4 ms) | (5.4 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (1.3 ms) | (1.3 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:2 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:2 :: []" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:3 :: []" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 3.1 ms, 3.4 ms, 3.0 ms
- **Volar (N)**: 4.3 ms, 4.0 ms, 3.6 ms
- **Vize**: 5.4 ms, 5.4 ms, 5.5 ms
- **Verter**: 1.3 ms, 1.5 ms, 1.3 ms

</details>

#### Code action at diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **34.8 ms** | 33.7 ms | 1.8 ms | 5.1% | 1.00x | 2 | n/a |
| Volar (N) | **736.3 ms** | 728.8 ms | 6.9 ms | 0.9% | 21.17x | 2 | n/a |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.7 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 34.8 ms, 37.2 ms, 33.7 ms
- **Volar (N)**: 742.5 ms, 736.3 ms, 728.8 ms
- **Vize**: 0.4 ms, 0.4 ms, 0.4 ms
- **Verter**: 0.5 ms, 0.7 ms, 0.7 ms

</details>

#### Signature help after `(`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **17.0 ms** | 16.5 ms | 0.7 ms | 4.1% | 1.00x | 1 | n/a |
| Volar (N) | **23.0 ms** | 22.4 ms | 0.4 ms | 1.9% | 1.35x | 1 | n/a |
| Vize | **248.3 ms** | 230.3 ms | 16.1 ms | 6.5% | 14.58x | 1 | n/a |
| Verter ⚠ | (5.1 ms) | (5.0 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 17.0 ms, 16.5 ms, 17.9 ms
- **Volar (N)**: 22.4 ms, 23.3 ms, 23.0 ms
- **Vize**: 248.3 ms, 230.3 ms, 262.4 ms
- **Verter**: 5.0 ms, 5.1 ms, 10.6 ms

</details>

#### Format unformatted SFC

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **66.0 ms** | 65.0 ms | 1.7 ms | 2.6% | 1.00x | 1 | n/a |
| Volar (N) | **129.7 ms** | 127.7 ms | 2.1 ms | 1.6% | 1.97x | 1 | n/a |
| Vize ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly) | ⚠ TOO NOISY TO RANK — CV 108.4% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 65.0 ms, 66.0 ms, 68.3 ms
- **Volar (N)**: 129.7 ms, 127.7 ms, 131.9 ms
- **Vize**: 3.1 ms, 0.5 ms, 0.5 ms
- **Verter**: 0.3 ms, 0.4 ms, 0.3 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
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

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **7.3 ms** | 6.9 ms | 0.3 ms | 3.8% | 1.00x | 317 | n/a |
| Volar (JS) | **184.8 ms** | 179.6 ms | 3.4 ms | 1.9% | 25.44x | 90 | n/a |
| Volar (N) ⚠ | (14.2 ms) | (4.0 ms) | – | – | not ranked | (90) | – |
| Verter ⚠ | (29.2 ms) | (0.7 ms) | – | – | not ranked | (89) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N) ⚠**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2 | ⚠ TOO NOISY TO RANK — CV 59.1% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | ⚠ TOO NOISY TO RANK — CV 104.8% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 6.9 ms, 7.4 ms, 7.3 ms
- **Volar (JS)**: 184.8 ms, 186.0 ms, 179.6 ms
- **Volar (N)**: 4.0 ms, 17.5 ms, 14.2 ms
- **Verter**: 70.5 ms, 0.7 ms, 29.2 ms

</details>

#### Hover (template interpolation)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **1.8 ms** | 1.7 ms | 0.0 ms | 1.9% | 1.00x | 38 | n/a |
| Volar (N) | **5.3 ms** | 5.2 ms | 1.6 ms | 25.7% ⚠ | 2.94x | 43 | n/a |
| Volar (JS) | **36.2 ms** | 33.5 ms | 2.1 ms | 5.9% | 20.21x | 43 | n/a |
| Verter ⚠ | (1.2 ms) | (0.9 ms) | – | – | not ranked | (74) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter ⚠**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | ⚠ TOO NOISY TO RANK — CV 65.2% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.8 ms, 1.8 ms, 1.7 ms
- **Volar (N)**: 8.0 ms, 5.3 ms, 5.2 ms
- **Volar (JS)**: 36.2 ms, 33.5 ms, 37.6 ms
- **Verter**: 2.9 ms, 0.9 ms, 1.2 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
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
| Vize | **384.2 ms** | 384.2 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (JS) | **469.7 ms** | 469.7 ms | n/a | n/a | 1.22x | n/a | n/a |
| Volar (N) | **479.0 ms** | 479.0 ms | n/a | n/a | 1.25x | n/a | n/a |
| Verter | **593.6 ms** | 593.6 ms | n/a | n/a | 1.54x | n/a | n/a |

<details><summary>Notes</summary>

- **Vize**: all components verified · edit → diagnostic=150ms · hover after edit=233ms · completion=1ms
- **Volar (JS)**: all components verified · edit → diagnostic=412ms · hover after edit=53ms · completion=4ms
- **Volar (N)**: all components verified · edit → diagnostic=461ms · hover after edit=16ms · completion=2ms
- **Verter**: all components verified · edit → diagnostic=506ms · hover after edit=87ms · completion=1ms

</details>

<details><summary>Methodology</summary>

- Sum of three medians: edit-loop/diagnostics-error + edit-loop/hover-after-edit + completion/completion-script-member.
- Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.
- A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.
- Servers that failed a component are shown in brackets with the failing part named.
- Composites share one table across TypeScript engines with (JS)-tagged rows, exactly as the per-operation tables do — a JS-engine composite against a tsgo composite is an engine comparison, not a server comparison.

Raw runs:


</details>
