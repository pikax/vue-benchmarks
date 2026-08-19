# Windows · ide ops

> Full report for `ide-win32.md` — every table, collapsed block (methodology, gate notes, raw runs) that the
> [README](../../README.md) landing page charts link here for. Auto-generated; do not edit.

## IDE operation results

- **Generated:** 2026-08-19T15:19:19.077Z
- **Runner:** win32/x64 · Node v26.5.0
- **Runs / warmups:** 2 / 1

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
| Verter | **31.1 ms** | 26.1 ms | 3.0 ms | 10.0% | 1.00x | n/a | n/a |
| Vize | **63.7 ms** | 56.7 ms | 6.5 ms | 10.2% ⚠ | 2.05x | n/a | n/a |
| Volar (JS) | **569.3 ms** | 530.0 ms | 28.5 ms | 4.9% | 18.29x | n/a | n/a |
| Volar (N) | **580.4 ms** | 537.8 ms | 41.5 ms | 7.1% | 18.64x | n/a | n/a |

<details><summary>Notes</summary>

- **Verter**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Vize**: LSP initialize handshake after spawn (not first-request latency) | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: LSP initialize handshake after spawn (not first-request latency) | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2

</details>

<details><summary>Raw runs</summary>

- **Verter**: 30.9 ms, 33.3 ms, 33.7 ms, 26.1 ms, 33.5 ms, 34.1 ms, 31.7 ms, 30.7 ms, 26.1 ms, 31.3 ms, 27.7 ms, 27.0 ms
- **Vize**: 64.0 ms, 65.1 ms, 58.4 ms, 65.5 ms, 78.5 ms, 58.3 ms, 58.9 ms, 56.7 ms, 68.7 ms, 63.4 ms, 59.0 ms, 72.0 ms
- **Volar (JS)**: 530.0 ms, 579.1 ms, 558.6 ms, 643.2 ms, 594.2 ms, 569.1 ms, 564.7 ms, 569.5 ms, 568.2 ms, 581.0 ms, 608.7 ms, 559.4 ms
- **Volar (N)**: 609.4 ms, 589.1 ms, 695.2 ms, 596.0 ms, 562.5 ms, 553.1 ms, 577.3 ms, 537.8 ms, 583.6 ms, 559.4 ms, 547.3 ms, 598.6 ms

</details>

<details><summary>Methodology</summary>

- Time from process spawn through the LSP initialize/initialized handshake, pooled across the suites in this job (small purpose-built workspaces). This is server startup, not the first editor request — Cold on the operation tables is that first request.

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
| Verter | **496.7 ms** | 1.00x | **24.9 ms** | 17.3 ms | 10.8 ms | 43.3% ⚠ | 1.69x | 3 | n/a |
| Volar (N) | **671.6 ms** | 1.35x | **17.1 ms** | 6.8 ms | 14.5 ms | 85.1% ⚠ | 1.16x | 3 | n/a |
| Volar (JS) | **795.1 ms** | 1.60x | **14.8 ms** | 12.4 ms | 3.4 ms | 22.8% ⚠ | 1.00x | 3 | n/a |
| Vize ⚠ | (0.7 ms) | not ranked | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `quaver` member of the local object in 0 items | Sample: "(empty list)" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 17.3 ms, 32.5 ms
- **Volar (N)**: 6.8 ms, 27.3 ms
- **Volar (JS)**: 17.1 ms, 12.4 ms
- **Vize**: 0.2 ms, 0.3 ms

</details>

#### Completion: component tag &lt;Ch

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **74.0 ms** | 1.00x | **24.2 ms** | 23.0 ms | 1.8 ms | 7.3% | 1.00x | 192 | n/a |
| Volar (N) | **102.5 ms** | 1.38x | **57.5 ms** | 50.2 ms | 10.4 ms | 18.1% ⚠ | 2.37x | 192 | n/a |
| Verter | **136.8 ms** | 1.85x | **40.2 ms** | 34.6 ms | 8.0 ms | 19.8% ⚠ | 1.66x | 1,193 | n/a |
| Vize ⚠ | (0.6 ms) | not ranked | (0.5 ms) | (0.4 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `ChildCard` component tag in 42 items | Sample: "[v-if, v-else-if, v-else, v-for, v-on, v-bind, v-model, v-slot, v-show, v-pre, v-once, v-memo, …+30]" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 23.0 ms, 25.5 ms
- **Volar (N)**: 64.9 ms, 50.2 ms
- **Verter**: 45.9 ms, 34.6 ms
- **Vize**: 0.4 ms, 0.6 ms

</details>

#### Completion: prop name &lt;C :

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.7 ms** | 1.00x | **0.6 ms** | 0.5 ms | 0.2 ms | 24.6% ⚠ | 1.00x | 4 | n/a |
| Verter | **2.2 ms** | 3.32x | **1.3 ms** | 1.2 ms | 0.2 ms | 12.6% ⚠ | 1.99x | 16 | n/a |
| Volar (N) | **46.0 ms** | 69.12x | **5.3 ms** | 4.7 ms | 0.8 ms | 15.8% ⚠ | 8.26x | 26 | n/a |
| Volar (JS) | **82.4 ms** | 123.80x | **6.3 ms** | 5.8 ms | 0.7 ms | 10.6% ⚠ | 9.86x | 26 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.8 ms
- **Verter**: 1.4 ms, 1.2 ms
- **Volar (N)**: 4.7 ms, 5.9 ms
- **Volar (JS)**: 6.8 ms, 5.8 ms

</details>

#### Completion: event name &lt;C @

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **6.3 ms** | 1.00x | **5.6 ms** | 5.6 ms | 0.0 ms | 0.3% | 1.00x | 25 | n/a |
| Volar (JS) | **7.6 ms** | 1.22x | **6.8 ms** | 6.2 ms | 0.9 ms | 12.5% ⚠ | 1.21x | 25 | n/a |
| Vize ⚠ | (0.4 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (12) | – |
| Verter ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 12 items | Sample: "[v-on, @, @click, @input, @change, @submit, @keydown, @keyup, @focus, @blur, @mouseenter, @mouseleave]" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 5.6 ms, 5.6 ms
- **Volar (JS)**: 6.2 ms, 7.4 ms
- **Vize**: 0.3 ms, 0.3 ms
- **Verter**: 0.3 ms, 0.3 ms

</details>

#### Completion: directive v-

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 1.00x | **0.4 ms** | 0.3 ms | 0.1 ms | 33.3% ⚠ | 1.00x | 15 | n/a |
| Volar (N) | **19.2 ms** | 52.64x | **10.7 ms** | 9.6 ms | 1.5 ms | 14.1% ⚠ | 30.00x | 498 | n/a |
| Volar (JS) | **22.2 ms** | 60.81x | **12.8 ms** | 11.8 ms | 1.4 ms | 11.2% ⚠ | 35.93x | 498 | n/a |
| Verter ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `v-if` directive in 3 items | Sample: "[style scoped, style, i18n]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.4 ms
- **Volar (N)**: 11.8 ms, 9.6 ms
- **Volar (JS)**: 11.8 ms, 13.8 ms
- **Verter**: 0.3 ms, 0.3 ms

</details>

#### Completion: slot name &lt;template #

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.0 ms | 7.9% | 1.00x | 2 | n/a |
| Vize | **0.8 ms** | 2.69x | **1.1 ms** | 0.7 ms | 0.5 ms | 42.6% ⚠ | 4.40x | 30 | n/a |
| Volar (N) | **9.8 ms** | 31.44x | **11.4 ms** | 10.3 ms | 1.5 ms | 13.3% ⚠ | 47.04x | 500 | n/a |
| Volar (JS) | **40.1 ms** | 128.99x | **11.6 ms** | 11.3 ms | 0.4 ms | 3.6% | 48.17x | 500 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Vize**: content verified | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.2 ms
- **Vize**: 1.4 ms, 0.7 ms
- **Volar (N)**: 12.4 ms, 10.3 ms
- **Volar (JS)**: 11.3 ms, 11.9 ms

</details>

#### Completion: auto-import

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **21.0 ms** | 20.4 ms | 0.8 ms | 3.9% | 1.00x | 1,073 | n/a |
| Volar (N) | **55.2 ms** | 53.9 ms | 1.8 ms | 3.3% | 2.63x | 1,073 | n/a |
| Vize ⚠ | (0.8 ms) | (0.5 ms) | – | – | not ranked | (44) | – |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import | Sample: "offered: \"computed\" kind=3 detail=\"function computed&lt;T>(getter: () => T): ComputedRef&lt;T>\" ; \"import computed\" kind=9 detail=\"Import computed from Vue\" insertTex" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 21.6 ms, 20.4 ms
- **Volar (N)**: 53.9 ms, 56.5 ms
- **Vize**: 1.1 ms, 0.5 ms
- **Verter**: 0.3 ms, 0.4 ms

</details>

#### Resolve: auto-import edit

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **26.9 ms** | 23.6 ms | 4.6 ms | 17.2% ⚠ | 1.00x | 241 | n/a |
| Volar (N) | **67.1 ms** | 56.7 ms | 14.7 ms | 21.9% ⚠ | 2.49x | 241 | n/a |
| Vize ⚠ | (0.3 ms) | (0.2 ms) | – | – | not ranked | (223) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` | Sample: "\"computed\" kind=3 detail=\"function computed&lt;T>(getter: () => T): ComputedRef&lt;T>\"" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 23.6 ms, 30.2 ms
- **Volar (N)**: 77.5 ms, 56.7 ms
- **Vize**: 0.3 ms, 0.2 ms
- **Verter**: 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **2.2 ms** | 2.2 ms | 0.1 ms | 2.6% | 1.00x | 25 | n/a |
| Verter | **5.4 ms** | 4.0 ms | 2.1 ms | 38.1% ⚠ | 2.43x | 25 | n/a |
| Volar (N) | **6.0 ms** | 5.3 ms | 1.1 ms | 18.4% ⚠ | 2.70x | 25 | n/a |
| Vize ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — script member completion offered no `quaver` item to resolve (0 items) | Sample: "(empty list)" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 2.3 ms, 2.2 ms
- **Verter**: 6.9 ms, 4.0 ms
- **Volar (N)**: 6.8 ms, 5.3 ms
- **Vize**: 0.0 ms, 0.0 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260603.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Vize | – | – | – | – | – | 1 | – |
| Verter | – | – | – | – | – | 0 | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 1.09 s, min 1.03 s, CV 7.3%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 940.7 ms, min 778.8 ms, CV 24.3%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize**: content verified | NOT RANKED (informational) — measured 44.9 ms, min 42.9 ms, CV 6.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter**: content verified | NOT RANKED (informational) — measured 13.4 ms, min 10.9 ms, CV 26.4%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.03 s, 1.15 s
- **Volar (N)**: 1.10 s, 778.8 ms
- **Vize**: 42.9 ms, 46.8 ms
- **Verter**: 15.9 ms, 10.9 ms

</details>

#### Edit plants type error -> reported

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **386.0 ms** | 385.2 ms | 1.2 ms | 0.3% | 1.00x | 1 | n/a |
| Volar (N) | **429.2 ms** | 411.3 ms | 25.3 ms | 5.9% | 1.11x | 1 | n/a |
| Verter | **890.2 ms** | 881.8 ms | 11.9 ms | 1.3% | 2.31x | 1 | n/a |
| Vize ⚠ | (4.01 s) | (4.01 s) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — no diagnostic referencing the planted error (`plantedTypeError` at line 3) in 4000ms across 2 publish(es) [model=push] — server itself reports type checking unavailable (typecheck-unavailable: Type checking is unavailable in this workspace. Make sure `tsconfig.json` exists and the C) | Sample: "vize/types:typecheck-unavailable@L0 Type checking is unavailable in this workspace. Make sure `tsconfig.js" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 385.2 ms, 386.9 ms
- **Volar (N)**: 447.1 ms, 411.3 ms
- **Verter**: 898.6 ms, 881.8 ms
- **Vize**: 4.01 s, 4.01 s

</details>

#### Edit fixes it -> diagnostic clears

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **354.5 ms** | 350.8 ms | 5.3 ms | 1.5% | 1.00x | 0 | n/a |
| Volar (N) | **407.0 ms** | 400.4 ms | 9.3 ms | 2.3% | 1.15x | 0 | n/a |
| Volar (JS) | **436.8 ms** | 429.3 ms | 10.7 ms | 2.4% | 1.23x | 0 | n/a |
| Vize ⚠ | (0.1 ms) | (0.1 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — the planted diagnostic was never reported, so its clearing cannot be measured — see the diagnostics-error row | Sample: "after fix (3 publish(es) for this file): vize/types:typecheck-unavailable@L0 Type checking is unavailable in this workspace. Make sure `tsconfig.js" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 358.3 ms, 350.8 ms
- **Volar (N)**: 413.6 ms, 400.4 ms
- **Volar (JS)**: 429.3 ms, 444.4 ms
- **Vize**: 0.1 ms, 0.1 ms

</details>

#### Hover after retype -> NEW type

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **20.2 ms** | 18.5 ms | 2.5 ms | 12.4% ⚠ | 1.00x | 47 | n/a |
| Volar (JS) | **47.3 ms** | 45.9 ms | 2.1 ms | 4.4% | 2.34x | 47 | n/a |
| Vize ⚠ | (2.8 ms) | (2.6 ms) | – | – | not ranked | (183) | – |
| Verter ⚠ | (26.4 ms) | (26.4 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — hover names `probeValue` but carries no `number` type for it (the same position carried no type before the edit either, so it is unsupported rather than stale; never caught up) | Sample: "**probeValue**\n\n_Template binding_\n\nBinding from `<script setup>`.\n\n**Behavior**\n- Available directly in the template scope.\n- Vue automatically unwraps refs wh" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — empty hover payload for `probeValue` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 250ms) | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 22.0 ms, 18.5 ms
- **Volar (JS)**: 45.9 ms, 48.8 ms
- **Vize**: 3.0 ms, 2.6 ms
- **Verter**: 26.4 ms, 26.5 ms

</details>

#### ... same hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **20.2 ms** | 18.5 ms | 2.5 ms | 12.4% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **47.3 ms** | 45.9 ms | 2.1 ms | 4.4% | 2.34x | 1 | n/a |
| Verter | **248.3 ms** | 246.7 ms | 2.3 ms | 0.9% | 12.27x | 2 | n/a |
| Vize ⚠ | (3.13 s) | (3.12 s) | – | – | not ranked | (16) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — hover never reported `probeValue: number` within 3000ms across 16 attempts — hover names `probeValue` but carries no `number` type for it | Sample: "**probeValue**\n\n_Template binding_\n\nBinding from `<script setup>`.\n\n**Behavior**\n- Available directly in the template scope.\n- Vue automatically unwraps refs wh" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 22.0 ms, 18.5 ms
- **Volar (JS)**: 45.9 ms, 48.8 ms
- **Verter**: 249.9 ms, 246.7 ms
- **Vize**: 3.15 s, 3.12 s

</details>

#### Steady state: edits 1-5 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **21.5 ms** | 16.7 ms | 6.8 ms | 31.8% ⚠ | 1.00x | n/a | n/a |
| Volar (JS) | **29.6 ms** | 27.8 ms | 2.6 ms | 8.8% | 1.38x | n/a | n/a |
| Vize ⚠ | (2.7 ms) | (2.7 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (38.9 ms) | (33.6 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — edit #1: hover names `probeValue` but carries no `'steady-0'` type for it | Sample: "**probeValue**\n\n_Template binding_\n\nBinding from `<script setup>`.\n\n**Behavior**\n- Available directly in the template scope.\n- Vue automatically unwraps refs wh" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — edit #1: empty hover payload for `probeValue` | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 26.4 ms, 16.7 ms
- **Volar (JS)**: 27.8 ms, 31.5 ms
- **Vize**: 2.8 ms, 2.7 ms
- **Verter**: 44.2 ms, 33.6 ms

</details>

#### Steady state: edits 6-10 (median)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **24.0 ms** | 19.2 ms | 6.8 ms | 28.2% ⚠ | 1.00x | 2 | n/a |
| Volar (JS) | **26.2 ms** | 25.9 ms | 0.4 ms | 1.7% | 1.09x | -2 | n/a |
| Verter | **39.5 ms** | 37.6 ms | 2.7 ms | 6.7% | 1.65x | -3 | n/a |
| Vize ⚠ | (2.9 ms) | (2.0 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — edit #6: hover names `probeValue` but carries no `'steady-5'` type for it | Sample: "**probeValue**\n\n_Template binding_\n\nBinding from `<script setup>`.\n\n**Behavior**\n- Available directly in the template scope.\n- Vue automatically unwraps refs wh" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 28.7 ms, 19.2 ms
- **Volar (JS)**: 25.9 ms, 26.5 ms
- **Verter**: 41.4 ms, 37.6 ms
- **Vize**: 3.7 ms, 2.0 ms

</details>

#### Child prop retype -> Parent diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **419.3 ms** | 417.1 ms | 3.1 ms | 0.7% | 1.00x | 1 | n/a |
| Volar (N) | **435.3 ms** | 432.0 ms | 4.7 ms | 1.1% | 1.04x | 1 | n/a |
| Vize ⚠ | (4.01 s) | (4.01 s) | – | – | not ranked | (1) | – |
| Verter ⚠ | (4.01 s) | (4.01 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 1 diagnostic(s) now — server itself reports type checking unavailable (typecheck-unavailable: Type checking is unavailable in this workspace. Make sure `tsconfig.json` exists and the C) | Sample: "before: vize/types:typecheck-unavailable@L0 Type checking is unavailable in this workspace. Make sure `tsconfig.js || after: vize/types:typecheck-unavailable@L0" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 421.5 ms, 417.1 ms
- **Volar (N)**: 438.6 ms, 432.0 ms
- **Vize**: 4.01 s, 4.01 s
- **Verter**: 4.01 s, 4.01 s

</details>

#### Child prop retype -> Parent hover

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **5.0 ms** | 5.0 ms | 0.1 ms | 1.1% | 1.00x | 239 | n/a |
| Volar (JS) | **62.7 ms** | 58.6 ms | 5.8 ms | 9.3% | 12.54x | 42 | n/a |
| Volar (N) | **79.7 ms** | 71.7 ms | 11.3 ms | 14.2% ⚠ | 15.94x | 42 | n/a |
| Verter ⚠ | (5.6 ms) | (5.0 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 473ms) | Sample: "```typescript\n(property) label: string\n```" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 5.0 ms, 5.0 ms
- **Volar (JS)**: 66.8 ms, 58.6 ms
- **Volar (N)**: 87.7 ms, 71.7 ms
- **Verter**: 5.0 ms, 6.1 ms

</details>

#### ... Parent hover, time to correct

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **5.0 ms** | 5.0 ms | 0.1 ms | 1.1% | 1.00x | 1 | n/a |
| Volar (JS) | **62.7 ms** | 58.6 ms | 5.8 ms | 9.3% | 12.54x | 1 | n/a |
| Volar (N) | **79.7 ms** | 71.7 ms | 11.3 ms | 14.2% ⚠ | 15.94x | 1 | n/a |
| Verter | **611.8 ms** | 473.5 ms | 195.6 ms | 32.0% ⚠ | 122.39x | 3 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 5.0 ms, 5.0 ms
- **Volar (JS)**: 66.8 ms, 58.6 ms
- **Volar (N)**: 87.7 ms, 71.7 ms
- **Verter**: 473.5 ms, 750.1 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- `didOpen -> first diagnostics` is MEASURED BUT NOT RANKED: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. Its median column is empty by design; the measured time is in the row's note and under Raw runs.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260603.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **2.5 ms** | 1.00x | **0.5 ms** | 0.3 ms | 0.3 ms | 49.0% ⚠ | 1.29x | 1 | n/a |
| Vize | **59.4 ms** | 24.22x | **0.4 ms** | 0.4 ms | 0.0 ms | 11.4% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **645.6 ms** | 263.33x | **3.1 ms** | 2.4 ms | 1.0 ms | 32.1% ⚠ | 7.54x | 1 | n/a |
| Volar (JS) | **802.9 ms** | 327.45x | **87.2 ms** | 75.9 ms | 15.9 ms | 18.3% ⚠ | 213.41x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Vize**: content verified | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.7 ms
- **Vize**: 0.4 ms, 0.4 ms
- **Volar (N)**: 2.4 ms, 3.8 ms
- **Volar (JS)**: 75.9 ms, 98.5 ms

</details>

#### Definition: imported fn (script)

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **1.6 ms** | 1.00x | **0.5 ms** | 0.4 ms | 0.0 ms | 8.6% | 1.00x | 1 | n/a |
| Volar (N) | **662.4 ms** | 412.48x | **14.2 ms** | 6.3 ms | 11.3 ms | 79.3% ⚠ | 31.56x | 1 | n/a |
| Volar (JS) | **818.5 ms** | 509.65x | **72.7 ms** | 69.1 ms | 5.0 ms | 6.9% | 161.04x | 1 | n/a |
| Vize ⚠ | (64.0 ms) | not ranked | (0.3 ms) | (0.2 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: definition stayed inside Parent.vue — never crossed into helpers.ts | Sample: "parent.vue@8:9" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.5 ms, 0.4 ms
- **Volar (N)**: 22.2 ms, 6.3 ms
- **Volar (JS)**: 69.1 ms, 76.2 ms
- **Vize**: 0.3 ms, 0.2 ms

</details>

#### Type definition: typed binding

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.9 ms** | 3.4 ms | 0.6 ms | 16.5% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **50.3 ms** | 48.9 ms | 2.0 ms | 4.0% | 13.02x | 1 | n/a |
| Verter | **274.6 ms** | 249.8 ms | 35.0 ms | 12.8% ⚠ | 71.01x | 1 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Vize ⚠**: ⚠ FAILED VALIDATION — every provider rejected textDocument/typeDefinition: {"code":-32601,"message":"Method not found"} | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 3.4 ms, 4.3 ms
- **Volar (N)**: 48.9 ms, 51.8 ms
- **Verter**: 249.8 ms, 299.4 ms
- **Vize**: 0.2 ms, 0.3 ms

</details>

#### References: prop -> parent template

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **69.4 ms** | 60.2 ms | 13.0 ms | 18.8% ⚠ | 1.00x | 4 | n/a |
| Volar (N) | **72.3 ms** | 67.8 ms | 6.3 ms | 8.7% | 1.04x | 4 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (3) | – |
| Verter ⚠ | (121.6 ms) | (0.6 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@2:11 childcard.vue@11:2 childcard.vue@15:38" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 60.2 ms, 78.6 ms
- **Volar (N)**: 67.8 ms, 76.8 ms
- **Vize**: 0.3 ms, 0.3 ms
- **Verter**: 242.6 ms, 0.6 ms

</details>

#### Prepare rename: prop

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 10.1% ⚠ | 1.00x | n/a | n/a |
| Volar (JS) | **3.9 ms** | 3.3 ms | 0.9 ms | 21.7% ⚠ | 20.63x | n/a | n/a |
| Volar (N) | **6.3 ms** | 6.0 ms | 0.5 ms | 7.1% | 33.12x | n/a | n/a |
| Verter ⚠ | (0.3 ms) | (0.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms
- **Volar (JS)**: 3.3 ms, 4.6 ms
- **Volar (N)**: 6.7 ms, 6.0 ms
- **Verter**: 0.2 ms, 0.3 ms

</details>

#### Rename prop (cross-file edit)

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **4.4 ms** | 2.9 ms | 2.0 ms | 46.2% ⚠ | 1.00x | 4 | n/a |
| Volar (N) | **9.9 ms** | 3.4 ms | 9.2 ms | 92.4% ⚠ | 2.28x | 4 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (3) | – |
| Verter ⚠ | (115.4 ms) | (1.2 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:3 :: []" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:3 :: []" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 5.8 ms, 2.9 ms
- **Volar (N)**: 16.5 ms, 3.4 ms
- **Vize**: 0.3 ms, 0.3 ms
- **Verter**: 1.2 ms, 229.5 ms

</details>

#### Code action at diagnostic

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **17.7 ms** | 16.4 ms | 1.8 ms | 9.9% | 1.00x | 2 | n/a |
| Volar (N) | **384.3 ms** | 343.6 ms | 57.6 ms | 15.0% ⚠ | 21.74x | 2 | n/a |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.6 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 16.4 ms, 18.9 ms
- **Volar (N)**: 343.6 ms, 425.0 ms
- **Vize**: 0.5 ms, 0.4 ms
- **Verter**: 0.5 ms, 0.6 ms

</details>

#### Signature help after `(`

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **18.5 ms** | 14.8 ms | 5.1 ms | 27.8% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **26.9 ms** | 26.5 ms | 0.5 ms | 2.0% | 1.46x | 1 | n/a |
| Vize ⚠ | (3.9 ms) | (2.9 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (3.9 ms) | (3.1 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Vize ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Verter ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 14.8 ms, 22.1 ms
- **Volar (N)**: 26.5 ms, 27.3 ms
- **Vize**: 5.0 ms, 2.9 ms
- **Verter**: 3.1 ms, 4.7 ms

</details>

#### Format unformatted SFC

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 0.4 ms | 0.2 ms | 36.4% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **50.1 ms** | 48.5 ms | 2.2 ms | 4.4% | 84.15x | 1 | n/a |
| Volar (N) | **50.4 ms** | 46.4 ms | 5.6 ms | 11.1% ⚠ | 84.61x | 1 | n/a |
| Verter ⚠ | (0.3 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.7 ms, 0.4 ms
- **Volar (JS)**: 48.5 ms, 51.7 ms
- **Volar (N)**: 46.4 ms, 54.3 ms
- **Verter**: 0.2 ms, 0.3 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260603.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Verter | **276.9 ms** | 1.00x | **0.8 ms** | 0.7 ms | 0.1 ms | 8.6% | 1.00x | 89 | n/a |
| Volar (N) | **700.1 ms** | 2.53x | **4.7 ms** | 4.3 ms | 0.5 ms | 11.2% ⚠ | 6.17x | 90 | n/a |
| Volar (JS) | **819.3 ms** | 2.96x | **5.7 ms** | 5.3 ms | 0.5 ms | 9.3% | 7.50x | 90 | n/a |
| Vize ⚠ | (34.1 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (221) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no type for `marker` at the script position | Sample: "### 🟡 vue/sfc-element-order\n\n&lt;script> should come before &lt;template>\n\n**Help:** Recommended order: &lt;script> -> &lt;template> -> &lt;style>\n\n[📖 View rule documentatio" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.8 ms, 0.7 ms
- **Volar (N)**: 4.3 ms, 5.0 ms
- **Volar (JS)**: 5.3 ms, 6.1 ms
- **Vize**: 0.3 ms, 0.3 ms

</details>

#### Hover (template interpolation)

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **289.9 ms** | 1.00x | **8.4 ms** | 0.5 ms | 11.3 ms | 133.5% ⚠ | 1.00x | 74 | n/a |
| Volar (N) | **638.0 ms** | 2.20x | **13.3 ms** | 7.8 ms | 7.7 ms | 58.2% ⚠ | 1.57x | 43 | n/a |
| Volar (JS) | **799.2 ms** | 2.76x | **40.3 ms** | 4.9 ms | 50.1 ms | 124.2% ⚠ | 4.78x | 43 | n/a |
| Vize ⚠ | (35.6 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (179) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64)
- **Volar (N)**: content verified | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2
- **Volar (JS)**: content verified | engine: TypeScript 6.0.3 (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no unwrapped `string` type at the template position | Sample: "**marker**\n\n_Template binding_\n\nBinding from `<script setup>`.\n\n**Behavior**\n- Available directly in the template scope.\n- Vue automatically unwraps refs when r" | ⚠ BACKEND FALLBACK — tsgo/Corsa backend did not start — server answered from its own semantic analysis (OpenProject request returned no error but project not present in snapshot) | engine: tsgo 7.0.0-dev.20260603.1 (nightly)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.5 ms, 16.4 ms
- **Volar (N)**: 18.7 ms, 7.8 ms
- **Volar (JS)**: 75.7 ms, 4.9 ms
- **Vize**: 0.3 ms, 0.3 ms

</details>

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript 6.0.3 (JS); Volar (TNB / tsgo tsdk) = tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2; Vize LSP (Node shim) = tsgo 7.0.0-dev.20260603.1 (nightly); Verter LSP (npm 0.0.1-beta.3) = tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-win32-x64). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Volar (JS) | **448.1 ms** | 448.1 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (N) | **466.5 ms** | 466.5 ms | n/a | n/a | 1.04x | n/a | n/a |
| Vize ⚠ | (4.01 s) | (4.01 s) | – | – | not ranked | – | – |
| Verter ⚠ | (941.5 ms) | (941.5 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: all components verified · edit → diagnostic=386ms · hover after edit=47ms · completion=15ms
- **Volar (N)**: all components verified · edit → diagnostic=429ms · hover after edit=20ms · completion=17ms
- **Vize ⚠**: ⚠ FAILED VALIDATION — 3 of 3 components failed their gate (edit → diagnostic, hover after edit, completion); the sum is shown for reference only. edit → diagnostic=4012ms ✗ · hover after edit=3ms ✗ · completion=0ms ✗
- **Verter ⚠**: ⚠ FAILED VALIDATION — 1 of 3 components failed their gate (hover after edit); the sum is shown for reference only. edit → diagnostic=890ms · hover after edit=26ms ✗ · completion=25ms

</details>

<details><summary>Methodology</summary>

- Sum of three medians: edit-loop/diagnostics-error + edit-loop/hover-after-edit + completion/completion-script-member.
- Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.
- A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.
- Servers that failed a component are shown in brackets with the failing part named.
- Composites share one table across TypeScript engines with (JS)-tagged rows, exactly as the per-operation tables do — a JS-engine composite against a tsgo composite is an engine comparison, not a server comparison.

Raw runs:


</details>
