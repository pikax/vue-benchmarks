# LSP and IDE operations

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-08-20T14:33:30.648Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`523d7bf`](https://github.com/pikax/vue-benchmarks/commit/523d7bfad95408f88bd6db210f9a0b106f8662e2)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/32379826142
- **Source:** `results/benchmarks/bench-Linux-200-bench.json`

## Results

Ranked on the **median of measured runs**. Warm series follow ≥1 discarded warmup and are the primary ordering and ranking metric wherever both series exist. Compiler and Component-meta additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup and package imports. It is not called Cold and its ratio/noise gate never substitutes for Warm. What else the child excludes differs by surface and each surface states it in its own methodology — Compiler builds its compiler host outside the timer, Component-meta builds its checker/session inside it, because its warm timer does too. Every table sorts fastest-first and every ratio column is **vs fastest** — the fastest ranked row is the 1.00x denominator; no tool is pinned as a reference. One table per surface unless that surface declares explicit work-equivalence classes; engine, invocation and threading are row properties, not implicit table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three warm samples is bracketed as TOO NOISY TO RANK, no tool exempted (a two-run spread has no third sample to adjudicate, so it is flagged, not bracketed). Per-row detail is under **Notes** below each table.

> **Peak RSS** on a timing row is the tool's peak resident set: measured in the timed session where the runner samples it (LSP servers, real-world CLIs), otherwise injected from the isolated memory probe below — the probe runs each tool in its own process, separate from timing.

### LSP (editor language server)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-bench-linux-200-bench-lsp-dark.svg">
  <img alt="LSP (editor language server)" src="charts/lsp-bench-linux-200-bench-lsp.svg">
</picture>

Files: **1** · Bytes: **745**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Hover bytes | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **282.2 ms** | 277.1 ms | 7.2 ms | 2.5% | 1.00x | 113 | 4 files/s | 111.7 + 121.3 = 232.9 MB |
| Vize | **323.8 ms** | 312.4 ms | 7.6 ms | 2.3% | 1.15x | 113 | 3 files/s | 73.5 + 210.6 = 284.1 MB |
| Volar (N) | **426.0 ms** | 413.9 ms | 11.7 ms | 2.7% | 1.51x | 114 | 2 files/s | – |
| Volar (JS) | **1.12 s** | 1.11 s | 10.1 ms | 0.9% | 3.97x | 114 | 1 files/s | 292.0 + 264.6 = 556.6 MB |

<details><summary>Notes</summary>

- **Verter**: verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | init=5ms · ready=35ms · open→hover=282ms · hoverCold=1ms · hoverWarm=1ms · completion=1ms · definition=1ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.2/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. | engine: tsgo 7.0.0-dev.20260603.1 (nightly) | init=39ms · ready=n/a · open→hover=324ms · hoverCold=47ms · hoverWarm=3ms · completion=22ms · definition=4ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (N)**: Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.13.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2 | init=560ms · ready=n/a · open→hover=414ms · hoverCold=17ms · hoverWarm=2ms · completion=6ms · definition=4ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (JS)**: Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. | engine: TypeScript 6.0.3 (JS) | init=571ms · ready=n/a · open→hover=1110ms · hoverCold=52ms · hoverWarm=2ms · completion=18ms · definition=8ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)

</details>

<details><summary>Methodology</summary>

- Apples-to-apples: identical workspace, LspTarget.vue, UTF-16 hover position on `const benchMarker`.
- Hover content is gated in TWO places, both required to be ranked: the `<script setup>` position (must return a TypeScript type) and the `{{ benchMarker }}` TEMPLATE position (must return the auto-unwrapped `string`). The template probe is the Vue-specific one — a server can satisfy the script probe by proxying to a TypeScript server, but resolving a ref's unwrapped type inside an interpolation requires actually modelling the template, which is the job a Vue language server exists to do. A payload naming the symbol with no type, or returning the `Ref<...>` script type, fails.
- The template probe runs OUTSIDE every timed window, so it gates ranking without changing what the latency column measures.
- Each measured run starts a fresh language-server process (tool process cold).
- Volar is measured as the two-process product it is in v3: @vue/language-server has no in-process TypeScript language service, so the harness also starts typescript-language-server with @vue/typescript-plugin, syncs the same .vue buffer to both, and asks both for every feature in parallel — Volar is charged the slower half plus both processes' startup and project load. This is the same wiring VS Code and Neovim implement; without it the Vue server returns null for a &lt;script setup> hover by design.
- Primary ranking column uses didOpen→hover latency (first semantic response after open), taken as the median over warmed runs — each run still starts a fresh server process, so per-process project load is measured every time.
- Hover retry budget is identical for every server (6 attempts, 60s each, same backoff). Retry sleeps fall inside the timed open→hover window, so an asymmetric budget would silently subsidise whichever server got the larger one.
- A fixed 50ms yield after didOpen is inside the timed window for every server alike — it is an additive constant, so it compresses ratios slightly but cannot reorder them.
- Phase breakdown in Notes: initialize, ready (n/a if no server signal), open→hover, hover cold, hover warm median(5), completion, definition.
- workspaceReady is OBSERVED, never waited for. A vendor ready notification (e.g. $/verter/ready) is recorded from session start as a diagnostic and never enters a ranked column — the harness does not pause on it. It previously did, which moved one server's workspace load OUT of the ranked open→hover window while every other server's stayed inside it. Missing signal = n/a, not 0.
- Readiness is established identically for every server and INSIDE the ranked window, via the shared didOpen→hover retry loop — the same content-gated approach the ide-ops suites use. Whoever needs project-load time pays for it in the metric.
- Rows share one table across TypeScript engines, tagged by the same resolver the typecheck surface uses: Volar (JS) runs the JavaScript TypeScript compiler, while Volar (N), Vize and Verter all run native tsgo. A cross-engine ratio measures TypeScript's Go rewrite as much as the Vue layer under test — the (JS) tag is there so you compare like with like.
- Process host (native executable vs Node) is NOT a comparison-class axis here — there is no native Volar and no Node-hosted Verter, so splitting on it would leave every table with one row. It is printed on the row instead.
- Vize is launched from the standalone native server the VS Code extension downloads (version-matched, discovered under VS Code globalStorage, or pinned with VIZE_LSP_BIN) — that is the process the shipped product runs. Where no native server exists, e.g. CI, the npm package's Node entry is used and the row says so, because the Node bootstrap it adds (~35ms/spawn, inside initialize) is not part of the product.
- Completion/definition are best-effort extras; null/n/a does not mean the tool is slower — capability may differ.
- typescript-native-bridge (TNB) is a drop-in typescript package for CLI/tsserver — NOT a Vue LSP in its own right. It appears here only as Volar's TypeScript engine: the `Volar (TNB / tsgo tsdk)` row is the same Volar binary with TNB supplying the tsserver half, so the pair isolates the TS engine from the Vue layer.
- Verter resolves from the installed `verter-lsp` package only; skipped when it is absent.
- VS Code extension host overhead is NOT measured — only the language server stdio protocol.
- Server order is rotated on every warmup and measured run; no server is pinned to first position.

Raw runs:

- **Verter**: 277.1 ms, 281.4 ms, 296.0 ms, 286.8 ms, 282.2 ms
- **Vize**: 314.1 ms, 312.4 ms, 325.4 ms, 330.1 ms, 323.8 ms
- **Volar (N)**: 441.8 ms, 426.0 ms, 432.1 ms, 415.4 ms, 413.9 ms
- **Volar (JS)**: 1.14 s, 1.12 s, 1.12 s, 1.12 s, 1.11 s

</details>

## IDE operations

The same language servers, measured per editor operation over LSP. Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. Each request-style operation publishes **Cold** (first request after initialize+didOpen in a **fresh session dedicated to that operation** — later ops do not reuse a warmed server) and **Warm** (the same request immediately after). Ranking uses Cold; vs-fastest-cold sits next to it. A row that failed its content gate on the cold request is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.

### IDE · initialize

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### LSP initialize

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-initialize-lsp-initialize-dark.svg">
  <img alt="IDE · initialize — LSP initialize" src="charts/lsp-ide-ide-initialize-lsp-initialize.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **6.1 ms** | 5.1 ms | 1.8 ms | 27.3% ⚠ | 1.00x | n/a | n/a |
| Vize | **40.1 ms** | 37.2 ms | 4.3 ms | 10.3% ⚠ | 6.55x | n/a | n/a |
| Volar (N) | **547.5 ms** | 537.9 ms | 7.2 ms | 1.3% | 89.44x | n/a | n/a |
| Volar (JS) | **548.8 ms** | 536.5 ms | 7.6 ms | 1.4% | 89.64x | n/a | n/a |

<details><summary>Notes</summary>

- **Verter**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? (none)
- **Vize**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo (bundled)
- **Volar (N)**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? via TNB ?
- **Volar (JS)**: LSP initialize handshake after spawn (not first-request latency) | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 5.3 ms, 6.2 ms, 5.4 ms, 5.1 ms, 5.4 ms, 5.7 ms, 6.5 ms, 5.2 ms, 5.2 ms, 5.5 ms, 7.8 ms, 5.1 ms, 6.1 ms, 5.4 ms, 10.5 ms, 7.4 ms, 6.6 ms, 12.0 ms, 6.4 ms, 7.4 ms, 6.2 ms
- **Vize**: 39.2 ms, 37.8 ms, 39.1 ms, 39.0 ms, 39.4 ms, 51.5 ms, 39.0 ms, 39.1 ms, 39.4 ms, 53.4 ms, 42.8 ms, 44.1 ms, 44.3 ms, 42.8 ms, 47.1 ms, 39.4 ms, 40.2 ms, 41.3 ms, 40.1 ms, 40.2 ms, 37.2 ms
- **Volar (N)**: 547.5 ms, 556.9 ms, 553.4 ms, 544.9 ms, 571.1 ms, 541.3 ms, 550.7 ms, 549.5 ms, 546.1 ms, 543.5 ms, 547.6 ms, 539.2 ms, 537.9 ms, 548.1 ms, 543.4 ms, 544.8 ms, 544.5 ms, 553.5 ms, 552.3 ms, 541.9 ms, 548.4 ms
- **Volar (JS)**: 543.2 ms, 559.4 ms, 548.8 ms, 541.2 ms, 553.0 ms, 560.3 ms, 543.4 ms, 552.7 ms, 551.9 ms, 540.4 ms, 561.7 ms, 543.9 ms, 558.7 ms, 550.2 ms, 541.7 ms, 549.3 ms, 554.4 ms, 536.5 ms, 538.0 ms, 542.4 ms, 547.8 ms

</details>

<details><summary>Methodology</summary>

- Time from process spawn through the LSP initialize/initialized handshake, pooled across the suites in this job (small purpose-built workspaces). This is server startup, not the first editor request — Cold on the operation tables is that first request.

</details>

### IDE · Background (editor chatter)

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### Semantic tokens (full)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-semantic-tokens-full-dark.svg">
  <img alt="IDE · Background (editor chatter) — Semantic tokens (full)" src="charts/lsp-ide-ide-background-semantic-tokens-full.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 0.5 ms | 0.1 ms | 8.5% | 1.00x | 15 | n/a |
| Volar (N) | **347.4 ms** | 328.4 ms | 12.5 ms | 3.6% | 548.87x | 48 | n/a |
| Volar (JS) | **791.4 ms** | 750.2 ms | 31.2 ms | 4.0% | 1250.45x | 48 | n/a |
| Verter ⚠ | (27.4 ms) | (27.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no tokens at all for this document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.6 ms, 0.5 ms
- **Volar (N)**: 328.4 ms, 352.0 ms, 347.4 ms
- **Volar (JS)**: 811.5 ms, 791.4 ms, 750.2 ms
- **Verter**: 33.2 ms, 27.2 ms, 27.4 ms

</details>

#### Semantic tokens (delta after edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit-dark.svg">
  <img alt="IDE · Background (editor chatter) — Semantic tokens (delta after edit)" src="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (1.1 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (0.6 ms) | (0.5 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1787235865795", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1787235874895", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.1 ms, 1.0 ms, 1.1 ms
- **Volar (N)**: 1.1 ms, 1.0 ms, 1.0 ms
- **Vize**: 0.5 ms, 0.6 ms, 0.6 ms
- **Verter**: 0.5 ms, 0.5 ms, 0.5 ms

</details>

#### Document symbols (outline)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-symbols-outline-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document symbols (outline)" src="charts/lsp-ide-ide-background-document-symbols-outline.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 0.4 ms | 0.1 ms | 11.8% ⚠ | 1.00x | 12 | n/a |
| Volar (N) | **17.1 ms** | 16.8 ms | 3.9 ms | 20.5% ⚠ | 39.34x | 25 | n/a |
| Volar (JS) | **18.4 ms** | 17.5 ms | 2.3 ms | 11.8% ⚠ | 42.36x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (2) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — outline is missing 7/7 script symbols: heading, nextLabel, threshold, entries, visibleEntries, formatEntry, addEntry | Sample: "2 symbols: template, script setup" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.5 ms, 0.4 ms, 0.4 ms
- **Volar (N)**: 17.1 ms, 23.8 ms, 16.8 ms
- **Volar (JS)**: 18.4 ms, 21.8 ms, 17.5 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Document highlight (caret move)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-highlight-caret-move-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document highlight (caret move)" src="charts/lsp-ide-ide-background-document-highlight-caret-move.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 8.1% | 1.00x | 4 | n/a |
| Verter | **0.3 ms** | 0.2 ms | 0.0 ms | 13.3% ⚠ | 1.28x | 4 | n/a |
| Volar (JS) | **19.8 ms** | 19.2 ms | 0.5 ms | 2.6% | 85.74x | 5 | n/a |
| Volar (N) | **29.8 ms** | 29.3 ms | 0.7 ms | 2.5% | 128.81x | 5 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.2 ms
- **Volar (JS)**: 20.2 ms, 19.8 ms, 19.2 ms
- **Volar (N)**: 29.3 ms, 30.8 ms, 29.8 ms

</details>

#### Inlay hints (document range)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-inlay-hints-document-range-dark.svg">
  <img alt="IDE · Background (editor chatter) — Inlay hints (document range)" src="charts/lsp-ide-ide-background-inlay-hints-document-range.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.5 ms** | 0.4 ms | 0.0 ms | 7.3% | 1.00x | 2 | n/a |
| Volar (JS) | **79.9 ms** | 77.4 ms | 1.6 ms | 2.0% | 175.83x | 14 | n/a |
| Volar (N) | **174.5 ms** | 167.0 ms | 4.9 ms | 2.9% | 383.99x | 14 | n/a |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.5 ms, 0.4 ms
- **Volar (JS)**: 77.4 ms, 79.9 ms, 80.4 ms
- **Volar (N)**: 174.5 ms, 176.3 ms, 167.0 ms
- **Verter**: 0.3 ms, 0.2 ms, 0.2 ms

</details>

#### Folding ranges

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-folding-ranges-dark.svg">
  <img alt="IDE · Background (editor chatter) — Folding ranges" src="charts/lsp-ide-ide-background-folding-ranges.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 12.1% ⚠ | 1.00x | 9 | n/a |
| Verter | **0.3 ms** | 0.2 ms | 0.0 ms | 14.4% ⚠ | 1.10x | 7 | n/a |
| Volar (N) | **7.0 ms** | 7.0 ms | 0.6 ms | 8.6% | 29.49x | 13 | n/a |
| Volar (JS) ⚠ | (116.5 ms) | (9.7 ms) | – | – | not ranked | (13) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 76.3% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.2 ms
- **Volar (N)**: 7.0 ms, 8.1 ms, 7.0 ms
- **Volar (JS)**: 116.5 ms, 117.1 ms, 9.7 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 133.0 MB | 103.8 MB | **236.8 MB** |
| Vize | 73.1 MB | 229.8 MB | **302.9 MB** |
| Volar (JS) | 281.7 MB | 255.1 MB | **536.8 MB** |
| Volar (N) | 293.5 MB | 405.7 MB | **699.2 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.3) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Completion (8 contexts, content-gated)

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### Completion: script member

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-script-member-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: script member" src="charts/lsp-ide-ide-completion-completion-script-member.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **291.4 ms** | 1.00x | **26.8 ms** | 23.3 ms | 3.0 ms | 11.3% ⚠ | 1.30x | 3 | n/a |
| Volar (N) | **440.5 ms** | 1.51x | **20.7 ms** | 20.2 ms | 1.6 ms | 7.3% | 1.00x | 3 | n/a |
| Volar (JS) | **1.12 s** | 3.85x | **27.3 ms** | 20.9 ms | 4.2 ms | 16.4% ⚠ | 1.32x | 3 | n/a |
| Vize ⚠ | (257.6 ms) | not ranked | (45.9 ms) | (1.5 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: content verified | engine: tsgo (bundled) | ⚠ TOO NOISY TO RANK — CV 82.5% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 26.8 ms, 23.3 ms, 29.3 ms
- **Volar (N)**: 20.2 ms, 23.1 ms, 20.7 ms
- **Volar (JS)**: 28.8 ms, 20.9 ms, 27.3 ms
- **Vize**: 45.9 ms, 1.5 ms, 46.5 ms

</details>

#### Completion: component tag &lt;Ch

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-component-tag-ch-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: component tag &lt;Ch" src="charts/lsp-ide-ide-completion-completion-component-tag-ch.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **129.7 ms** | 1.00x | **39.8 ms** | 39.4 ms | 0.4 ms | 0.9% | 1.17x | 192 | n/a |
| Volar (JS) | **131.2 ms** | 1.01x | **37.1 ms** | 35.7 ms | 1.6 ms | 4.3% | 1.09x | 192 | n/a |
| Verter | **175.7 ms** | 1.36x | **33.9 ms** | 30.9 ms | 1.8 ms | 5.3% | 1.00x | 1,193 | n/a |
| Vize ⚠ | (0.7 ms) | not ranked | (0.5 ms) | (0.5 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `ChildCard` component tag in 42 items | Sample: "[v-if, v-else-if, v-else, v-for, v-on, v-bind, v-model, v-slot, v-show, v-pre, v-once, v-memo, …+30]" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 40.1 ms, 39.8 ms, 39.4 ms
- **Volar (JS)**: 38.9 ms, 35.7 ms, 37.1 ms
- **Verter**: 30.9 ms, 34.0 ms, 33.9 ms
- **Vize**: 0.5 ms, 0.7 ms, 0.5 ms

</details>

#### Completion: prop name &lt;C :

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-prop-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: prop name &lt;C :" src="charts/lsp-ide-ide-completion-completion-prop-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 1.00x | **0.3 ms** | 0.3 ms | 0.0 ms | 14.5% ⚠ | 1.00x | 4 | n/a |
| Verter | **1.8 ms** | 4.92x | **1.2 ms** | 1.0 ms | 0.3 ms | 25.1% ⚠ | 3.68x | 16 | n/a |
| Volar (N) | **63.4 ms** | 177.72x | **7.6 ms** | 7.5 ms | 0.1 ms | 0.9% | 23.02x | 26 | n/a |
| Volar (JS) ⚠ | (194.4 ms) | not ranked | (157.1 ms) | (8.8 ms) | – | – | not ranked | (26) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 79.6% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.4 ms, 0.3 ms
- **Verter**: 1.7 ms, 1.2 ms, 1.0 ms
- **Volar (N)**: 7.5 ms, 7.6 ms, 7.6 ms
- **Volar (JS)**: 8.8 ms, 157.1 ms, 159.6 ms

</details>

#### Completion: event name &lt;C @

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-event-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: event name &lt;C @" src="charts/lsp-ide-ide-completion-completion-event-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **6.7 ms** | 1.00x | **6.6 ms** | 6.4 ms | 0.3 ms | 4.0% | 1.00x | 25 | n/a |
| Volar (JS) | **12.4 ms** | 1.86x | **7.2 ms** | 7.0 ms | 0.1 ms | 1.5% | 1.08x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (12) | – |
| Verter ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 12 items | Sample: "[v-on, @, @click, @input, @change, @submit, @keydown, @keyup, @focus, @blur, @mouseenter, @mouseleave]" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 6.9 ms, 6.6 ms, 6.4 ms
- **Volar (JS)**: 7.2 ms, 7.2 ms, 7.0 ms
- **Vize**: 0.3 ms, 0.4 ms, 0.3 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.2 ms

</details>

#### Completion: directive v-

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-directive-v-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: directive v-" src="charts/lsp-ide-ide-completion-completion-directive-v.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 1.00x | **0.3 ms** | 0.3 ms | 0.1 ms | 14.1% ⚠ | 1.00x | 15 | n/a |
| Volar (N) | **30.4 ms** | 85.39x | **14.2 ms** | 13.7 ms | 0.4 ms | 2.7% | 43.18x | 498 | n/a |
| Volar (JS) | **32.6 ms** | 91.65x | **47.7 ms** | 19.6 ms | 18.1 ms | 45.0% ⚠ | 144.83x | 498 | n/a |
| Verter ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `v-if` directive in 3 items | Sample: "[style scoped, style, i18n]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.4 ms, 0.3 ms
- **Volar (N)**: 14.2 ms, 13.7 ms, 14.4 ms
- **Volar (JS)**: 19.6 ms, 53.5 ms, 47.7 ms
- **Verter**: 0.4 ms, 0.3 ms, 0.3 ms

</details>

#### Completion: slot name &lt;template #

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-slot-name-template-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: slot name &lt;template #" src="charts/lsp-ide-ide-completion-completion-slot-name-template.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 1.00x | **0.4 ms** | 0.2 ms | 0.1 ms | 22.4% ⚠ | 1.00x | 2 | n/a |
| Vize | **0.5 ms** | 1.55x | **0.5 ms** | 0.5 ms | 0.0 ms | 4.8% | 1.47x | 30 | n/a |
| Volar (N) | **16.8 ms** | 51.06x | **15.6 ms** | 13.7 ms | 2.0 ms | 12.6% ⚠ | 44.46x | 500 | n/a |
| Volar (JS) | **133.4 ms** | 404.27x | **17.4 ms** | 15.5 ms | 1.8 ms | 10.3% ⚠ | 49.58x | 500 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.4 ms, 0.4 ms, 0.2 ms
- **Vize**: 0.5 ms, 0.5 ms, 0.5 ms
- **Volar (N)**: 15.6 ms, 17.7 ms, 13.7 ms
- **Volar (JS)**: 15.5 ms, 19.1 ms, 17.4 ms

</details>

#### Completion: auto-import

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-auto-import-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: auto-import" src="charts/lsp-ide-ide-completion-completion-auto-import.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **37.4 ms** | 33.9 ms | 13.0 ms | 30.2% ⚠ | 1.00x | 1,073 | n/a |
| Volar (N) | **69.8 ms** | 67.9 ms | 3.3 ms | 4.7% | 1.87x | 1,073 | n/a |
| Vize ⚠ | (91.3 ms) | (90.4 ms) | – | – | not ranked | (1,103) | – |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import | Sample: "offered: \"getComputedStyle\" kind=3 ; \"computed\" kind=6 ; \"computed\" kind=3 detail=\"function computed&lt;T>(getter: () => T): ComputedRef&lt;T>\"" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 33.9 ms, 57.9 ms, 37.4 ms
- **Volar (N)**: 74.3 ms, 69.8 ms, 67.9 ms
- **Vize**: 91.3 ms, 119.8 ms, 90.4 ms
- **Verter**: 0.4 ms, 0.4 ms, 0.3 ms

</details>

#### Resolve: auto-import edit

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-auto-import-edit-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: auto-import edit" src="charts/lsp-ide-ide-completion-resolve-auto-import-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **48.5 ms** | 37.1 ms | 7.3 ms | 16.1% ⚠ | 1.00x | 241 | n/a |
| Volar (N) | **153.6 ms** | 151.3 ms | 2.1 ms | 1.4% | 3.17x | 241 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` | Sample: "\"computed\" kind=6" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 37.1 ms, 50.8 ms, 48.5 ms
- **Volar (N)**: 153.6 ms, 151.3 ms, 155.5 ms
- **Vize**: 0.3 ms, 0.4 ms, 0.3 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-script-member-detail-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: script member detail" src="charts/lsp-ide-ide-completion-resolve-script-member-detail.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.4 ms** | 3.0 ms | 0.6 ms | 15.9% ⚠ | 1.00x | 25 | n/a |
| Verter | **5.4 ms** | 4.3 ms | 1.2 ms | 21.5% ⚠ | 1.57x | 25 | n/a |
| Volar (N) | **8.1 ms** | 8.0 ms | 0.9 ms | 10.4% ⚠ | 2.38x | 25 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no detail and no documentation | Sample: "\"quaver\" kind=5" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 3.0 ms, 4.1 ms, 3.4 ms
- **Verter**: 5.4 ms, 6.7 ms, 4.3 ms
- **Volar (N)**: 8.1 ms, 8.0 ms, 9.6 ms
- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 133.3 MB | 176.3 MB | **309.6 MB** |
| Vize | 78.9 MB | 241.6 MB | **320.5 MB** |
| Volar (JS) | 295.4 MB | 287.5 MB | **582.9 MB** |
| Volar (N) | 307.4 MB | 414.9 MB | **722.3 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.3) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Edit loop (type, wait, hover)

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

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 1.16 s, min 1.11 s, CV 2.3%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 502.4 ms, min 502.4 ms, CV 0.9%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? via TNB ?
- **Vize**: content verified | NOT RANKED (informational) — measured 243.2 ms, min 238.1 ms, CV 1.5%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo (bundled)
- **Verter**: content verified | NOT RANKED (informational) — measured 313.2 ms, min 312.2 ms, CV 0.5%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.11 s, 1.16 s, 1.16 s
- **Volar (N)**: 502.4 ms, 502.4 ms, 510.0 ms
- **Vize**: 245.0 ms, 238.1 ms, 243.2 ms
- **Verter**: 315.2 ms, 312.2 ms, 313.2 ms

</details>

#### Edit plants type error -> reported

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit plants type error -> reported" src="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **75.1 ms** | 71.9 ms | 16.7 ms | 20.1% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **403.7 ms** | 390.7 ms | 9.1 ms | 2.3% | 5.38x | 1 | n/a |
| Volar (N) | **457.7 ms** | 451.7 ms | 4.3 ms | 0.9% | 6.10x | 1 | n/a |
| Verter | **498.8 ms** | 493.0 ms | 6.4 ms | 1.3% | 6.64x | 1 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 102.3 ms, 71.9 ms, 75.1 ms
- **Volar (JS)**: 403.7 ms, 390.7 ms, 408.1 ms
- **Volar (N)**: 460.1 ms, 451.7 ms, 457.7 ms
- **Verter**: 498.8 ms, 505.9 ms, 493.0 ms

</details>

#### Edit fixes it -> diagnostic clears

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit fixes it -> diagnostic clears" src="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **20.3 ms** | 18.5 ms | 1.1 ms | 5.8% | 1.00x | 0 | n/a |
| Volar (N) | **382.8 ms** | 381.1 ms | 1.0 ms | 0.3% | 18.89x | 0 | n/a |
| Volar (JS) | **457.5 ms** | 453.7 ms | 2.3 ms | 0.5% | 22.58x | 0 | n/a |
| Verter | **658.6 ms** | 645.5 ms | 8.1 ms | 1.2% | 32.51x | 0 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 18.5 ms, 20.3 ms, 20.7 ms
- **Volar (N)**: 382.8 ms, 381.1 ms, 383.0 ms
- **Volar (JS)**: 458.1 ms, 453.7 ms, 457.5 ms
- **Verter**: 645.5 ms, 660.5 ms, 658.6 ms

</details>

#### Hover after retype -> NEW type

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Hover after retype -> NEW type" src="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **18.5 ms** | 18.5 ms | 0.5 ms | 2.4% | 1.00x | 47 | n/a |
| Volar (JS) | **54.2 ms** | 49.8 ms | 4.1 ms | 7.5% | 2.93x | 47 | n/a |
| Vize | **55.2 ms** | 44.1 ms | 6.8 ms | 13.1% ⚠ | 2.99x | 40 | n/a |
| Verter ⚠ | (82.1 ms) | (74.6 ms) | – | – | not ranked | (40) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 61.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 19.3 ms, 18.5 ms, 18.5 ms
- **Volar (JS)**: 57.9 ms, 54.2 ms, 49.8 ms
- **Vize**: 56.3 ms, 44.1 ms, 55.2 ms
- **Verter**: 205.7 ms, 74.6 ms, 82.1 ms

</details>

#### ... same hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... same hover, time to correct" src="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **18.5 ms** | 18.5 ms | 0.5 ms | 2.4% | 1.00x | 1 | n/a |
| Volar (JS) | **54.2 ms** | 49.8 ms | 4.1 ms | 7.5% | 2.93x | 1 | n/a |
| Vize | **55.2 ms** | 44.1 ms | 6.8 ms | 13.1% ⚠ | 2.99x | 1 | n/a |
| Verter ⚠ | (82.1 ms) | (74.6 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 61.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 19.3 ms, 18.5 ms, 18.5 ms
- **Volar (JS)**: 57.9 ms, 54.2 ms, 49.8 ms
- **Vize**: 56.3 ms, 44.1 ms, 55.2 ms
- **Verter**: 205.7 ms, 74.6 ms, 82.1 ms

</details>

#### Steady state: edits 1-5 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 1-5 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **18.0 ms** | 17.7 ms | 0.6 ms | 3.3% | 1.00x | n/a | n/a |
| Volar (JS) | **43.1 ms** | 42.8 ms | 0.4 ms | 1.0% | 2.39x | n/a | n/a |
| Vize | **53.6 ms** | 43.6 ms | 6.5 ms | 12.7% ⚠ | 2.98x | n/a | n/a |
| Verter | **94.6 ms** | 53.5 ms | 25.7 ms | 31.0% ⚠ | 5.26x | n/a | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 18.8 ms, 18.0 ms, 17.7 ms
- **Volar (JS)**: 43.7 ms, 43.1 ms, 42.8 ms
- **Vize**: 55.7 ms, 53.6 ms, 43.6 ms
- **Verter**: 53.5 ms, 94.6 ms, 100.9 ms

</details>

#### Steady state: edits 6-10 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 6-10 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **18.3 ms** | 18.3 ms | 0.1 ms | 0.4% | 1.00x | -1 | n/a |
| Volar (JS) | **37.1 ms** | 35.0 ms | 1.5 ms | 4.0% | 2.03x | -7 | n/a |
| Vize | **46.1 ms** | 43.9 ms | 2.4 ms | 5.3% | 2.52x | -7 | n/a |
| Verter | **55.7 ms** | 53.8 ms | 21.3 ms | 31.8% ⚠ | 3.05x | 0 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 18.3 ms, 18.4 ms, 18.3 ms
- **Volar (JS)**: 37.1 ms, 37.8 ms, 35.0 ms
- **Vize**: 48.7 ms, 46.1 ms, 43.9 ms
- **Verter**: 53.8 ms, 91.6 ms, 55.7 ms

</details>

#### Child prop retype -> Parent diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent diagnostic" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **191.0 ms** | 80.1 ms | 65.3 ms | 42.0% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **379.0 ms** | 377.7 ms | 1.2 ms | 0.3% | 1.98x | 1 | n/a |
| Volar (N) | **385.6 ms** | 385.1 ms | 0.3 ms | 0.1% | 2.02x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 80.1 ms, 191.0 ms, 195.2 ms
- **Volar (JS)**: 379.0 ms, 380.1 ms, 377.7 ms
- **Volar (N)**: 385.6 ms, 385.6 ms, 385.1 ms
- **Verter**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Child prop retype -> Parent hover

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent hover" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **64.8 ms** | 64.6 ms | 6.6 ms | 9.6% | 1.00x | 42 | n/a |
| Volar (JS) | **109.2 ms** | 100.2 ms | 5.6 ms | 5.3% | 1.68x | 42 | n/a |
| Vize | **191.0 ms** | 152.5 ms | 23.6 ms | 13.1% ⚠ | 2.95x | 42 | n/a |
| Verter ⚠ | (4.9 ms) | (4.9 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 455ms) | Sample: "```typescript\n(property) label: string\n```" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 64.6 ms, 64.8 ms, 76.1 ms
- **Volar (JS)**: 100.2 ms, 109.2 ms, 110.6 ms
- **Vize**: 152.5 ms, 191.0 ms, 195.2 ms
- **Verter**: 4.9 ms, 4.9 ms, 4.9 ms

</details>

#### ... Parent hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... Parent hover, time to correct" src="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **64.8 ms** | 64.6 ms | 6.6 ms | 9.6% | 1.00x | 1 | n/a |
| Volar (JS) | **109.2 ms** | 100.2 ms | 5.6 ms | 5.3% | 1.68x | 1 | n/a |
| Vize | **191.0 ms** | 152.5 ms | 23.6 ms | 13.1% ⚠ | 2.95x | 1 | n/a |
| Verter | **455.4 ms** | 455.3 ms | 28.3 ms | 6.0% | 7.03x | 3 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 64.6 ms, 64.8 ms, 76.1 ms
- **Volar (JS)**: 100.2 ms, 109.2 ms, 110.6 ms
- **Vize**: 152.5 ms, 191.0 ms, 195.2 ms
- **Verter**: 455.4 ms, 455.3 ms, 504.3 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 72.9 MB | 272.3 MB | **345.2 MB** |
| Volar (JS) | 290.7 MB | 311.5 MB | **602.2 MB** |
| Volar (N) | 302.8 MB | 410.3 MB | **713.2 MB** |
| Verter | 41.4 MB | 801.4 MB | **842.8 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- `didOpen -> first diagnostics` is MEASURED BUT NOT RANKED: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. Its median column is empty by design; the measured time is in the row's note and under Raw runs.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.3) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Navigation & refactor (cross-file)

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### Definition: &lt;ChildCard/> tag

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-definition-childcard-tag-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Definition: &lt;ChildCard/> tag" src="charts/lsp-ide-ide-navigation-definition-childcard-tag.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.5 ms** | 1.00x | **0.3 ms** | 0.3 ms | 0.1 ms | 32.8% ⚠ | 1.18x | 1 | n/a |
| Vize | **358.3 ms** | 712.63x | **0.3 ms** | 0.2 ms | 0.0 ms | 13.5% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **465.3 ms** | 925.42x | **24.5 ms** | 18.6 ms | 5.8 ms | 23.7% ⚠ | 92.25x | 1 | n/a |
| Volar (JS) | **1.10 s** | 2190.58x | **171.3 ms** | 171.1 ms | 5.7 ms | 3.2% | 646.28x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.5 ms, 0.3 ms, 0.3 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.2 ms
- **Volar (N)**: 18.6 ms, 24.5 ms, 30.1 ms
- **Volar (JS)**: 171.1 ms, 181.0 ms, 171.3 ms

</details>

#### Definition: imported fn (script)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-definition-imported-fn-script-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Definition: imported fn (script)" src="charts/lsp-ide-ide-navigation-definition-imported-fn-script.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.5 ms** | 1.00x | **0.3 ms** | 0.3 ms | 0.0 ms | 2.4% | 1.00x | 1 | n/a |
| Volar (N) | **459.6 ms** | 865.44x | **18.8 ms** | 18.3 ms | 0.3 ms | 1.6% | 58.15x | 1 | n/a |
| Volar (JS) | **1.11 s** | 2093.92x | **168.2 ms** | 165.2 ms | 1.8 ms | 1.1% | 521.25x | 1 | n/a |
| Vize ⚠ | (382.0 ms) | not ranked | (5.7 ms) | (4.5 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: every provider rejected textDocument/definition: vize: textDocument/definition timed out after 5000ms | Sample: "vize: textDocument/definition timed out after 5000ms" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms
- **Volar (N)**: 18.8 ms, 18.3 ms, 18.9 ms
- **Volar (JS)**: 168.2 ms, 168.2 ms, 165.2 ms
- **Vize**: 4.5 ms, 5.7 ms, 110.3 ms

</details>

#### Type definition: typed binding

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-type-definition-typed-binding-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Type definition: typed binding" src="charts/lsp-ide-ide-navigation-type-definition-typed-binding.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **7.4 ms** | 7.1 ms | 0.2 ms | 3.4% | 1.00x | 1 | n/a |
| Volar (N) | **49.2 ms** | 48.4 ms | 7.8 ms | 14.7% ⚠ | 6.68x | 1 | n/a |
| Vize | **66.0 ms** | 60.0 ms | 8.2 ms | 12.2% ⚠ | 8.96x | 1 | n/a |
| Verter | **285.9 ms** | 274.1 ms | 24.4 ms | 8.3% | 38.82x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 7.1 ms, 7.4 ms, 7.6 ms
- **Volar (N)**: 48.4 ms, 62.3 ms, 49.2 ms
- **Vize**: 60.0 ms, 76.2 ms, 66.0 ms
- **Verter**: 321.1 ms, 285.9 ms, 274.1 ms

</details>

#### References: prop -> parent template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-references-prop-parent-template-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — References: prop -> parent template" src="charts/lsp-ide-ide-navigation-references-prop-parent-template.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **99.2 ms** | 80.7 ms | 15.2 ms | 15.7% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **139.2 ms** | 136.1 ms | 5.4 ms | 3.8% | 1.40x | 4 | n/a |
| Vize ⚠ | (10.5 ms) | (8.3 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (136.3 ms) | (127.1 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@2:11 childcard.vue@11:2" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 110.8 ms, 99.2 ms, 80.7 ms
- **Volar (JS)**: 139.2 ms, 136.1 ms, 146.6 ms
- **Vize**: 10.5 ms, 8.3 ms, 12.2 ms
- **Verter**: 136.3 ms, 153.9 ms, 127.1 ms

</details>

#### Prepare rename: prop

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-prepare-rename-prop-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Prepare rename: prop" src="charts/lsp-ide-ide-navigation-prepare-rename-prop.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **2.5 ms** | 1.9 ms | 0.4 ms | 18.5% ⚠ | 1.00x | n/a | n/a |
| Volar (JS) | **6.3 ms** | 6.1 ms | 0.3 ms | 5.0% | 2.47x | n/a | n/a |
| Volar (N) ⚠ | (5.7 ms) | (5.2 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: content verified | engine: tsgo ? via TNB ? | ⚠ TOO NOISY TO RANK — CV 65.4% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 2.5 ms, 1.9 ms, 2.7 ms
- **Volar (JS)**: 6.3 ms, 6.7 ms, 6.1 ms
- **Volar (N)**: 5.2 ms, 5.7 ms, 15.5 ms
- **Verter**: 1.9 ms, 0.3 ms, 0.3 ms

</details>

#### Rename prop (cross-file edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Rename prop (cross-file edit)" src="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **4.1 ms** | 3.9 ms | 0.5 ms | 11.4% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **4.3 ms** | 4.3 ms | 0.0 ms | 1.0% | 1.06x | 4 | n/a |
| Vize ⚠ | (6.7 ms) | (6.7 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (1.4 ms) | (1.4 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:2 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:2 :: []" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:3 :: []" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 4.1 ms, 3.9 ms, 4.8 ms
- **Volar (JS)**: 4.3 ms, 4.4 ms, 4.3 ms
- **Vize**: 6.7 ms, 7.1 ms, 6.7 ms
- **Verter**: 2.8 ms, 1.4 ms, 1.4 ms

</details>

#### Code action at diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-code-action-at-diagnostic-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Code action at diagnostic" src="charts/lsp-ide-ide-navigation-code-action-at-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **37.4 ms** | 33.2 ms | 2.5 ms | 7.0% | 1.00x | 2 | n/a |
| Volar (N) | **703.4 ms** | 695.5 ms | 11.2 ms | 1.6% | 18.79x | 2 | n/a |
| Vize ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 37.4 ms, 33.2 ms, 37.6 ms
- **Volar (N)**: 695.5 ms, 703.4 ms, 717.6 ms
- **Vize**: 0.5 ms, 0.5 ms, 0.6 ms
- **Verter**: 0.8 ms, 0.7 ms, 0.7 ms

</details>

#### Signature help after `(`

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-signature-help-after-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Signature help after `(`" src="charts/lsp-ide-ide-navigation-signature-help-after.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **20.3 ms** | 18.7 ms | 1.0 ms | 4.9% | 1.00x | 1 | n/a |
| Volar (N) | **25.6 ms** | 23.7 ms | 2.6 ms | 10.2% ⚠ | 1.26x | 1 | n/a |
| Vize | **140.2 ms** | 136.7 ms | 5.3 ms | 3.7% | 6.91x | 1 | n/a |
| Verter ⚠ | (6.9 ms) | (4.9 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 18.7 ms, 20.3 ms, 20.5 ms
- **Volar (N)**: 28.9 ms, 23.7 ms, 25.6 ms
- **Vize**: 136.7 ms, 147.0 ms, 140.2 ms
- **Verter**: 7.1 ms, 4.9 ms, 6.9 ms

</details>

#### Format unformatted SFC

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-format-unformatted-sfc-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Format unformatted SFC" src="charts/lsp-ide-ide-navigation-format-unformatted-sfc.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 0.6 ms | 0.0 ms | 6.1% | 1.00x | 1 | n/a |
| Volar (JS) | **63.3 ms** | 63.2 ms | 2.5 ms | 3.9% | 98.33x | 1 | n/a |
| Volar (N) | **127.9 ms** | 117.0 ms | 17.6 ms | 13.3% ⚠ | 198.52x | 1 | n/a |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.6 ms, 0.7 ms
- **Volar (JS)**: 63.3 ms, 67.7 ms, 63.2 ms
- **Volar (N)**: 151.4 ms, 127.9 ms, 117.0 ms
- **Verter**: 0.4 ms, 0.2 ms, 0.2 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 126.6 MB | 127.1 MB | **253.7 MB** |
| Vize | 151.2 MB | 227.5 MB | **378.6 MB** |
| Volar (JS) | 292.9 MB | 255.9 MB | **548.8 MB** |
| Volar (N) | 304.6 MB | 524.1 MB | **828.7 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.3) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Smoke (reference suite)

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

#### Hover (script setup)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-smoke-hover-script-setup-dark.svg">
  <img alt="IDE · Smoke (reference suite) — Hover (script setup)" src="charts/lsp-ide-ide-smoke-hover-script-setup.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **231.7 ms** | 1.00x | **25.9 ms** | 25.3 ms | 5.4 ms | 18.9% ⚠ | 1.00x | 89 | n/a |
| Volar (JS) ⚠ | (1.11 s) | not ranked | (173.3 ms) | (4.1 ms) | – | – | not ranked | (90) | – |
| Volar (N) ⚠ | (504.3 ms) | not ranked | (23.7 ms) | (2.8 ms) | – | – | not ranked | (90) | – |
| Verter ⚠ | (262.9 ms) | not ranked | (1.6 ms) | (0.8 ms) | – | – | not ranked | (89) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 83.7% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Volar (N) ⚠**: content verified | engine: tsgo ? via TNB ? | ⚠ TOO NOISY TO RANK — CV 72.2% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 149.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 25.9 ms, 25.3 ms, 35.0 ms
- **Volar (JS)**: 181.2 ms, 173.3 ms, 4.1 ms
- **Volar (N)**: 23.7 ms, 23.7 ms, 2.8 ms
- **Verter**: 0.8 ms, 23.2 ms, 1.6 ms

</details>

#### Hover (template interpolation)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-smoke-hover-template-interpolation-dark.svg">
  <img alt="IDE · Smoke (reference suite) — Hover (template interpolation)" src="charts/lsp-ide-ide-smoke-hover-template-interpolation.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **234.5 ms** | 1.00x | **21.1 ms** | 21.0 ms | 0.5 ms | 2.3% | 10.61x | 38 | n/a |
| Verter | **241.3 ms** | 1.03x | **2.0 ms** | 0.9 ms | 0.9 ms | 47.9% ⚠ | 1.00x | 74 | n/a |
| Volar (N) | **499.1 ms** | 2.13x | **19.9 ms** | 19.1 ms | 1.6 ms | 8.0% | 9.97x | 43 | n/a |
| Volar (JS) ⚠ | (1.17 s) | not ranked | (8.7 ms) | (4.9 ms) | – | – | not ranked | (43) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 151.2% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 21.9 ms, 21.1 ms, 21.0 ms
- **Verter**: 2.0 ms, 2.6 ms, 0.9 ms
- **Volar (N)**: 22.2 ms, 19.9 ms, 19.1 ms
- **Volar (JS)**: 4.9 ms, 8.7 ms, 146.1 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 84.3 MB | 98.3 MB | **182.5 MB** |
| Vize | 72.8 MB | 189.3 MB | **262.1 MB** |
| Volar (JS) | 275.6 MB | 248.4 MB | **524.0 MB** |
| Volar (N) | 288.4 MB | 332.2 MB | **620.6 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.3) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
- Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.
- A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.
- Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.
- Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.
- Fresh server process per run; warmups are discarded.

</details>

### IDE · Typing loop (composite)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-typing-loop-dark.svg">
  <img alt="IDE · Typing loop (composite)" src="charts/lsp-ide-ide-typing-loop.svg">
</picture>

Files: **1** · Bytes: **0**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **176.2 ms** | 176.2 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (JS) | **485.3 ms** | 485.3 ms | n/a | n/a | 2.75x | n/a | n/a |
| Volar (N) | **496.9 ms** | 496.9 ms | n/a | n/a | 2.82x | n/a | n/a |
| Verter | **607.7 ms** | 607.7 ms | n/a | n/a | 3.45x | n/a | n/a |

<details><summary>Notes</summary>

- **Vize**: all components verified · edit → diagnostic=75ms · hover after edit=55ms · completion=46ms
- **Volar (JS)**: all components verified · edit → diagnostic=404ms · hover after edit=54ms · completion=27ms
- **Volar (N)**: all components verified · edit → diagnostic=458ms · hover after edit=18ms · completion=21ms
- **Verter**: all components verified · edit → diagnostic=499ms · hover after edit=82ms · completion=27ms

</details>

<details><summary>Methodology</summary>

- Sum of three medians: edit-loop/diagnostics-error + edit-loop/hover-after-edit + completion/completion-script-member.
- Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.
- A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.
- Servers that failed a component are shown in brackets with the failing part named.
- Composites share one table across TypeScript engines with (JS)-tagged rows, exactly as the per-operation tables do — a JS-engine composite against a tsgo composite is an engine comparison, not a server comparison.

Raw runs:

</details>

### IDE scale study

Operation latency as the workspace grows — one table, one column per workspace size. A study, not a ranking surface; **growth** is the 20→500-file multiplier. **Peak RSS** is the server process tree's peak over the whole scale session (one figure per server — it is not attributable to a single size, so it repeats across operations).

| Operation | Tool | @20 files | @100 files | @500 files | growth | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| **Time-to-usable** | Verter LSP (npm 0.0.1-beta.3) | 223 ms | 251 ms | 244 ms | ×1.19 | 45.1 MB |
|  | Vize LSP (Node shim) | 343 ms | 340 ms | 345 ms | ×1 | 63.4 MB |
|  | Volar (TNB / tsgo tsdk) | 1.12 s | 1.27 s | 1.97 s | ×1.75 | 268.5 + 138.7 = 407.3 MB |
|  | Volar (@vue/language-server) | 1.77 s | 1.93 s | 2.86 s | ×1.62 | 253.4 + 76.0 = 329.4 MB |
| **Completion** | Vize LSP (Node shim) | 0.4 ms | 0.4 ms | 0.5 ms | ×1.22 | 63.4 MB |
|  | Verter LSP (npm 0.0.1-beta.3) | 160 ms | 200 ms | 192 ms | ×0.6 | 45.1 MB |
|  | Volar (TNB / tsgo tsdk) | 166 ms | 186 ms | 235 ms | ×1.43 | 268.5 + 138.7 = 407.3 MB |
|  | Volar (@vue/language-server) | 197 ms | 204 ms | 236 ms | ×1.16 | 253.4 + 76.0 = 329.4 MB |
| **References** | Volar (TNB / tsgo tsdk) | 163 ms | 687 ms | 11.3 s | ×73.38 | 268.5 + 138.7 = 407.3 MB |
|  | Volar (@vue/language-server) | 285 ms | 1.03 s | 14.7 s | ×51.05 | 253.4 + 76.0 = 329.4 MB |
|  | Vize LSP (Node shim) | (23.0 ms) ⚠ | (24.9 ms) ⚠ | (29.8 ms) ⚠ | – | 63.4 MB |
|  | Verter LSP (npm 0.0.1-beta.3) | (37.0 ms) ⚠ | (32.8 ms) ⚠ | (38.4 ms) ⚠ | – | 45.1 MB |
| **Hover warm** | Verter LSP (npm 0.0.1-beta.3) | 0.6 ms | 0.8 ms | 0.7 ms | ×0.94 | 45.1 MB |
|  | Volar (@vue/language-server) | 1.5 ms | 2.4 ms | 1.3 ms | ×0.9 | 253.4 + 76.0 = 329.4 MB |
|  | Vize LSP (Node shim) | 2.0 ms | 2.0 ms | 2.0 ms | ×1.03 | 63.4 MB |
|  | Volar (TNB / tsgo tsdk) | 1.4 ms | 1.8 ms | 3.4 ms | ×2.24 | 268.5 + 138.7 = 407.3 MB |

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

pass **19** · fail **8** · warn **0** · skip **0**

| Case | volar | vize | verter |
| --- | :---: | :---: | :---: |
| `completion-prop-template` | ✓ | ✓ | ✓ |
| `definition-component` | ✓ | ✓ | ✓ |
| `definition-prop-attr` | ✓ | ✓ | ✓ |
| `diagnostics-clear-after-fix` | ✓ | **✗** | ✓ |
| `diagnostics-template` | ✓ | **✗** | ✓ |
| `document-symbol-structure` | ✓ | **✗** | ✓ |
| `hover-template-binding` | ✓ | ✓ | **✗** |
| `references-prop-template` | ✓ | **✗** | **✗** |
| `rename-prop-template` | ✓ | **✗** | **✗** |

<details><summary>Failure detail</summary>

- `document-symbol-structure` · **vize** — documentSymbol never names greeting — saw: template, script setup
- `references-prop-template` · **vize** — references missing App.vue — only found child.vue
- `rename-prop-template` · **vize** — BROKEN REFACTOR: edited child.vue:2 but produced no edit in App.vue — the template usage is left behind
- `diagnostics-template` · **vize** — no diagnostic mentioning plantedBadProp within 20000ms — no diagnostics published
- `diagnostics-clear-after-fix` · **vize** — cannot confirm clear: planted plantedBadProp never appeared
- `hover-template-binding` · **verter** — empty hover payload at {{ greeting }}
- `references-prop-template` · **verter** — references missing App.vue — only found child.vue
- `rename-prop-template` · **verter** — BROKEN REFACTOR: edited child.vue:2 but produced no edit in App.vue — the template usage is left behind

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 100.50 / 221.05 / 100.50 | 1.12 / 2.74 / 1.71 | 60 | 14.2 | 682 | 3 |
| LSP vize (server process, Node shim) | 196.74 / 280.02 / 196.74 | 0.87 / 1.78 / 1.27 | 90 | 13.1 | 495 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) | 395.37 / 535.04 / 395.37 | 0.93 / 2.69 / 1.74 | 760 | 10.4 | 1935 | 3 |

<details><summary>Notes</summary>

- **LSP verter (server process, npm 0.0.1-beta.3)** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP vize (server process, Node shim)** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP Volar — Vue server process only (TypeScript half not sampled)** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.

</details>

## Tool versions

<details><summary>Every pinned package in this run</summary>

| Package | Version |
| --- | --- |
| node | v22.23.2 |
| vue | 3.5.41 |
| vue-36 | 3.6.0-rc.4 |
| @vue/compiler-sfc | 3.5.41 |
| @vue/compiler-sfc-36 | 3.6.0-rc.4 |
| vize | 0.350.2 |
| @vizejs/native | 0.350.2 |
| @verter/native | 0.0.1-beta.3 |
| @fervid/napi | 0.4.1 |
| verter-tsc | 0.0.1-beta.3 |
| @verter/component-meta | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| verter-mcp | 0.0.1-beta.3 |
| @vue/language-server | 3.3.10 |
| @vue/typescript-plugin | 3.3.10 |
| typescript-language-server | 5.3.0 |
| vue-tsc | 3.3.10 |
| vue-component-meta | 3.3.10 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.6 |
| oxfmt | 0.64.0 |
| oxlint | 1.79.0 |
| eslint-plugin-vue | 10.10.0 |
| @biomejs/biome | 2.5.9 |
| typescript | 6.0.3 |
| cli:vize | 0.350.2 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.64.0 |
| cli:oxlint | 1.79.0 |
| cli:biome | 2.5.9 |
| vue-jsx-vapor | 3.2.21 |
| @vue-jsx-vapor/compiler-rs | 3.2.21 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

</details>
