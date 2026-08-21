# LSP and IDE operations

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-08-21T09:58:23.715Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`64b460c`](https://github.com/pikax/vue-benchmarks/commit/64b460c3b8cafbc9efba895cd716d5ef41920124)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/32469697609
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
| Vize | **278.1 ms** | 259.3 ms | 21.7 ms | 7.8% | 1.00x | 113 | 4 files/s | 73.9 + 179.5 = 253.4 MB |
| Verter | **320.9 ms** | 296.7 ms | 48.9 ms | 15.2% ⚠ | 1.15x | 113 | 3 files/s | 122.2 + 110.8 = 233.0 MB |
| Volar (N) | **354.1 ms** | 342.1 ms | 13.8 ms | 3.9% | 1.27x | 114 | 3 files/s | – |
| Volar (JS) | **967.5 ms** | 923.4 ms | 45.8 ms | 4.7% | 3.48x | 114 | 1 files/s | 292.7 + 263.4 = 556.1 MB |

<details><summary>Notes</summary>

- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.2/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. | engine: tsgo 7.0.0-dev.20260603.1 (nightly) | init=32ms · ready=n/a · open→hover=259ms · hoverCold=3ms · hoverWarm=7ms · completion=16ms · definition=3ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Verter**: verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | init=4ms · ready=28ms · open→hover=321ms · hoverCold=16ms · hoverWarm=1ms · completion=2ms · definition=1ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (N)**: Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.13.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.13.tsgo.7.0.2 | init=467ms · ready=n/a · open→hover=346ms · hoverCold=6ms · hoverWarm=3ms · completion=4ms · definition=3ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (JS)**: Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. | engine: TypeScript 6.0.3 (JS) | init=460ms · ready=n/a · open→hover=952ms · hoverCold=34ms · hoverWarm=2ms · completion=21ms · definition=4ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)

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

- **Vize**: 318.1 ms, 274.5 ms, 278.1 ms, 284.4 ms, 259.3 ms
- **Verter**: 296.7 ms, 308.6 ms, 383.1 ms, 407.3 ms, 320.9 ms
- **Volar (N)**: 368.4 ms, 373.9 ms, 342.1 ms, 354.1 ms, 346.3 ms
- **Volar (JS)**: 1.05 s, 967.5 ms, 972.3 ms, 923.4 ms, 951.8 ms

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
| Verter | **3.6 ms** | 3.3 ms | 0.9 ms | 21.9% ⚠ | 1.00x | n/a | n/a |
| Vize | **31.9 ms** | 30.8 ms | 1.2 ms | 3.7% | 8.76x | n/a | n/a |
| Volar (N) | **398.8 ms** | 387.4 ms | 6.8 ms | 1.7% | 109.42x | n/a | n/a |
| Volar (JS) | **403.8 ms** | 391.6 ms | 17.6 ms | 4.3% | 110.81x | n/a | n/a |

<details><summary>Notes</summary>

- **Verter**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? (none)
- **Vize**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo (bundled)
- **Volar (N)**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? via TNB ?
- **Volar (JS)**: LSP initialize handshake after spawn (not first-request latency) | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 3.7 ms, 4.4 ms, 4.2 ms, 3.7 ms, 6.6 ms, 3.3 ms, 3.6 ms, 3.6 ms, 3.5 ms, 3.5 ms, 4.2 ms, 3.4 ms, 3.5 ms, 3.4 ms, 3.5 ms, 5.5 ms, 3.9 ms, 3.6 ms, 5.7 ms, 3.8 ms, 3.4 ms
- **Vize**: 34.5 ms, 31.8 ms, 31.6 ms, 30.9 ms, 32.6 ms, 31.9 ms, 30.8 ms, 32.6 ms, 33.8 ms, 31.6 ms, 32.3 ms, 31.8 ms, 31.1 ms, 31.3 ms, 32.2 ms, 31.8 ms, 35.2 ms, 32.0 ms, 33.1 ms, 31.5 ms, 33.9 ms
- **Volar (N)**: 414.7 ms, 407.8 ms, 396.4 ms, 400.5 ms, 396.6 ms, 395.5 ms, 392.9 ms, 404.9 ms, 397.4 ms, 395.8 ms, 401.9 ms, 409.3 ms, 398.1 ms, 412.5 ms, 401.8 ms, 401.4 ms, 392.1 ms, 398.8 ms, 397.7 ms, 387.4 ms, 403.6 ms
- **Volar (JS)**: 391.6 ms, 448.3 ms, 403.8 ms, 401.3 ms, 413.5 ms, 402.9 ms, 404.0 ms, 401.5 ms, 421.3 ms, 401.8 ms, 393.3 ms, 408.4 ms, 421.5 ms, 397.9 ms, 398.2 ms, 411.0 ms, 426.8 ms, 459.1 ms, 392.7 ms, 395.4 ms, 407.2 ms

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
| Vize | **0.5 ms** | 0.5 ms | 0.0 ms | 4.0% | 1.00x | 15 | n/a |
| Volar (N) | **260.2 ms** | 254.5 ms | 11.7 ms | 4.4% | 480.50x | 48 | n/a |
| Volar (JS) | **471.9 ms** | 468.8 ms | 9.9 ms | 2.1% | 871.25x | 48 | n/a |
| Verter ⚠ | (35.3 ms) | (24.1 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no tokens at all for this document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.5 ms, 0.5 ms
- **Volar (N)**: 254.5 ms, 277.0 ms, 260.2 ms
- **Volar (JS)**: 487.3 ms, 471.9 ms, 468.8 ms
- **Verter**: 141.6 ms, 35.3 ms, 24.1 ms

</details>

#### Semantic tokens (delta after edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit-dark.svg">
  <img alt="IDE · Background (editor chatter) — Semantic tokens (delta after edit)" src="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (1.0 ms) | (0.9 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (12.8 ms) | (0.3 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1787305817601", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1787305824847", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 0.9 ms, 1.1 ms, 1.0 ms
- **Volar (N)**: 1.1 ms, 1.0 ms, 1.0 ms
- **Vize**: 12.8 ms, 0.3 ms, 13.7 ms
- **Verter**: 0.5 ms, 0.4 ms, 0.5 ms

</details>

#### Document symbols (outline)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-symbols-outline-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document symbols (outline)" src="charts/lsp-ide-ide-background-document-symbols-outline.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 0.3 ms | 0.1 ms | 26.0% ⚠ | 1.00x | 12 | n/a |
| Volar (N) | **14.2 ms** | 14.1 ms | 3.3 ms | 20.8% ⚠ | 38.95x | 25 | n/a |
| Volar (JS) | **14.4 ms** | 13.8 ms | 0.4 ms | 2.7% | 39.56x | 25 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (2) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — outline is missing 7/7 script symbols: heading, nextLabel, threshold, entries, visibleEntries, formatEntry, addEntry | Sample: "2 symbols: template, script setup" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.4 ms, 0.5 ms
- **Volar (N)**: 14.1 ms, 14.2 ms, 19.9 ms
- **Volar (JS)**: 14.4 ms, 14.5 ms, 13.8 ms
- **Vize**: 0.2 ms, 0.2 ms, 0.3 ms

</details>

#### Document highlight (caret move)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-highlight-caret-move-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document highlight (caret move)" src="charts/lsp-ide-ide-background-document-highlight-caret-move.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.1 ms | 0.0 ms | 15.2% ⚠ | 1.00x | 4 | n/a |
| Verter | **0.2 ms** | 0.2 ms | 0.0 ms | 11.4% ⚠ | 1.48x | 4 | n/a |
| Volar (JS) | **15.9 ms** | 15.2 ms | 0.4 ms | 2.7% | 95.23x | 5 | n/a |
| Volar (N) | **28.1 ms** | 28.0 ms | 0.2 ms | 0.6% | 168.59x | 5 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.1 ms, 0.2 ms
- **Verter**: 0.2 ms, 0.2 ms, 0.3 ms
- **Volar (JS)**: 15.9 ms, 15.9 ms, 15.2 ms
- **Volar (N)**: 28.0 ms, 28.1 ms, 28.3 ms

</details>

#### Inlay hints (document range)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-inlay-hints-document-range-dark.svg">
  <img alt="IDE · Background (editor chatter) — Inlay hints (document range)" src="charts/lsp-ide-ide-background-inlay-hints-document-range.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 0.3 ms | 0.0 ms | 6.2% | 1.00x | 2 | n/a |
| Volar (JS) | **59.2 ms** | 57.0 ms | 1.7 ms | 2.9% | 172.96x | 14 | n/a |
| Volar (N) | **133.7 ms** | 132.8 ms | 1.8 ms | 1.4% | 390.57x | 14 | n/a |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.3 ms, 0.3 ms
- **Volar (JS)**: 59.2 ms, 57.0 ms, 60.4 ms
- **Volar (N)**: 136.3 ms, 133.7 ms, 132.8 ms
- **Verter**: 0.2 ms, 0.2 ms, 0.2 ms

</details>

#### Folding ranges

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-folding-ranges-dark.svg">
  <img alt="IDE · Background (editor chatter) — Folding ranges" src="charts/lsp-ide-ide-background-folding-ranges.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.1 ms | 0.0 ms | 19.9% ⚠ | 1.00x | 9 | n/a |
| Verter | **0.3 ms** | 0.2 ms | 0.0 ms | 17.4% ⚠ | 1.55x | 7 | n/a |
| Volar (N) | **5.3 ms** | 5.2 ms | 0.7 ms | 12.3% ⚠ | 31.65x | 13 | n/a |
| Volar (JS) | **6.5 ms** | 6.4 ms | 2.6 ms | 33.0% ⚠ | 38.79x | 13 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.1 ms, 0.2 ms
- **Verter**: 0.3 ms, 0.2 ms, 0.3 ms
- **Volar (N)**: 6.4 ms, 5.2 ms, 5.3 ms
- **Volar (JS)**: 6.5 ms, 11.0 ms, 6.4 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 131.7 MB | 101.7 MB | **233.4 MB** |
| Vize | 73.3 MB | 166.1 MB | **239.4 MB** |
| Volar (JS) | 275.5 MB | 254.1 MB | **529.6 MB** |
| Volar (N) | 292.8 MB | 404.6 MB | **697.5 MB** |

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
| Vize | **0.6 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.1 ms | 31.0% ⚠ | 1.00x | 3 | n/a |
| Volar (N) | **327.6 ms** | 574.58x | **17.1 ms** | 13.8 ms | 2.6 ms | 15.4% ⚠ | 80.18x | 3 | n/a |
| Volar (JS) | **831.7 ms** | 1458.69x | **22.1 ms** | 17.4 ms | 4.2 ms | 19.1% ⚠ | 103.98x | 3 | n/a |
| Verter ⚠ | (231.4 ms) | not ranked | (3.1 ms) | (1.9 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 92.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.2 ms, 0.2 ms
- **Volar (N)**: 18.9 ms, 17.1 ms, 13.8 ms
- **Volar (JS)**: 22.1 ms, 25.7 ms, 17.4 ms
- **Verter**: 10.8 ms, 1.9 ms, 3.1 ms

</details>

#### Completion: component tag &lt;Ch

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-component-tag-ch-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: component tag &lt;Ch" src="charts/lsp-ide-ide-completion-completion-component-tag-ch.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **97.4 ms** | 1.00x | **28.0 ms** | 27.0 ms | 0.8 ms | 2.8% | 1.00x | 192 | n/a |
| Volar (N) | **111.2 ms** | 1.14x | **30.6 ms** | 30.0 ms | 0.6 ms | 2.1% | 1.09x | 192 | n/a |
| Verter | **146.5 ms** | 1.50x | **161.9 ms** | 70.1 ms | 59.8 ms | 43.3% ⚠ | 5.78x | 1,193 | n/a |
| Vize ⚠ | (61.6 ms) | not ranked | (0.5 ms) | (0.4 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `ChildCard` component tag in 42 items | Sample: "[v-if, v-else-if, v-else, v-for, v-on, v-bind, v-model, v-slot, v-show, v-pre, v-once, v-memo, …+30]" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 28.5 ms, 27.0 ms, 28.0 ms
- **Volar (N)**: 30.0 ms, 30.6 ms, 31.3 ms
- **Verter**: 70.1 ms, 182.5 ms, 161.9 ms
- **Vize**: 0.6 ms, 0.5 ms, 0.4 ms

</details>

#### Completion: prop name &lt;C :

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-prop-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: prop name &lt;C :" src="charts/lsp-ide-ide-completion-completion-prop-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.0 ms | 10.5% ⚠ | 1.00x | 4 | n/a |
| Verter | **18.6 ms** | 60.71x | **1.1 ms** | 1.0 ms | 0.1 ms | 4.9% | 5.07x | 16 | n/a |
| Volar (N) | **53.9 ms** | 175.75x | **5.8 ms** | 5.7 ms | 0.3 ms | 5.5% | 27.86x | 26 | n/a |
| Volar (JS) | **155.3 ms** | 506.33x | **163.7 ms** | 119.9 ms | 26.3 ms | 17.5% ⚠ | 785.10x | 26 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 1.1 ms, 1.1 ms, 1.0 ms
- **Volar (N)**: 5.8 ms, 6.3 ms, 5.7 ms
- **Volar (JS)**: 167.0 ms, 119.9 ms, 163.7 ms

</details>

#### Completion: event name &lt;C @

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-event-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: event name &lt;C @" src="charts/lsp-ide-ide-completion-completion-event-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **6.3 ms** | 1.00x | **5.4 ms** | 5.3 ms | 0.1 ms | 2.8% | 1.00x | 25 | n/a |
| Volar (JS) | **10.0 ms** | 1.60x | **6.5 ms** | 5.4 ms | 1.3 ms | 19.9% ⚠ | 1.21x | 25 | n/a |
| Vize ⚠ | (0.2 ms) | not ranked | (0.2 ms) | (0.2 ms) | – | – | not ranked | (12) | – |
| Verter ⚠ | (0.3 ms) | not ranked | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 12 items | Sample: "[v-on, @, @click, @input, @change, @submit, @keydown, @keyup, @focus, @blur, @mouseenter, @mouseleave]" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 5.3 ms, 5.4 ms, 5.6 ms
- **Volar (JS)**: 8.0 ms, 5.4 ms, 6.5 ms
- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.2 ms, 0.2 ms, 0.2 ms

</details>

#### Completion: directive v-

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-directive-v-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: directive v-" src="charts/lsp-ide-ide-completion-completion-directive-v.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.0 ms | 2.8% | 1.00x | 15 | n/a |
| Volar (N) | **23.0 ms** | 94.92x | **10.5 ms** | 10.3 ms | 0.7 ms | 6.4% | 46.30x | 498 | n/a |
| Volar (JS) ⚠ | (29.7 ms) | not ranked | (21.8 ms) | (10.9 ms) | – | – | not ranked | (498) | – |
| Verter ⚠ | (0.3 ms) | not ranked | (0.2 ms) | (0.2 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 53.8% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `v-if` directive in 3 items | Sample: "[style scoped, style, i18n]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Volar (N)**: 10.5 ms, 11.6 ms, 10.3 ms
- **Volar (JS)**: 35.2 ms, 10.9 ms, 21.8 ms
- **Verter**: 0.2 ms, 0.2 ms, 0.2 ms

</details>

#### Completion: slot name &lt;template #

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-slot-name-template-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: slot name &lt;template #" src="charts/lsp-ide-ide-completion-completion-slot-name-template.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.2 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.0 ms | 5.1% | 1.00x | 2 | n/a |
| Vize | **0.3 ms** | 1.69x | **0.3 ms** | 0.3 ms | 0.0 ms | 1.3% | 1.78x | 30 | n/a |
| Volar (N) | **12.5 ms** | 61.08x | **16.3 ms** | 12.3 ms | 2.8 ms | 18.2% ⚠ | 90.36x | 500 | n/a |
| Volar (JS) | **98.1 ms** | 478.21x | **13.1 ms** | 11.0 ms | 1.4 ms | 10.8% ⚠ | 72.74x | 500 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.2 ms, 0.2 ms, 0.2 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Volar (N)**: 16.3 ms, 12.3 ms, 17.7 ms
- **Volar (JS)**: 13.5 ms, 11.0 ms, 13.1 ms

</details>

#### Completion: auto-import

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-auto-import-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: auto-import" src="charts/lsp-ide-ide-completion-completion-auto-import.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **25.5 ms** | 25.1 ms | 0.9 ms | 3.6% | 1.00x | 1,073 | n/a |
| Volar (N) | **31.6 ms** | 30.0 ms | 14.5 ms | 37.1% ⚠ | 1.24x | 1,073 | n/a |
| Vize ⚠ | (197.2 ms) | (189.8 ms) | – | – | not ranked | (1,103) | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import | Sample: "offered: \"getComputedStyle\" kind=3 ; \"computed\" kind=6 ; \"computed\" kind=3 detail=\"function computed&lt;T>(getter: () => T): ComputedRef&lt;T>\"" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 25.5 ms, 25.1 ms, 26.8 ms
- **Volar (N)**: 30.0 ms, 55.9 ms, 31.6 ms
- **Vize**: 197.2 ms, 201.1 ms, 189.8 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Resolve: auto-import edit

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-auto-import-edit-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: auto-import edit" src="charts/lsp-ide-ide-completion-resolve-auto-import-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **41.5 ms** | 41.3 ms | 1.3 ms | 3.0% | 1.00x | 241 | n/a |
| Volar (N) | **117.2 ms** | 115.1 ms | 2.7 ms | 2.3% | 2.82x | 241 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` | Sample: "\"computed\" kind=6" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 41.5 ms, 43.6 ms, 41.3 ms
- **Volar (N)**: 115.1 ms, 120.5 ms, 117.2 ms
- **Vize**: 0.3 ms, 1.2 ms, 0.3 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-script-member-detail-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: script member detail" src="charts/lsp-ide-ide-completion-resolve-script-member-detail.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.1 ms** | 0.1 ms | 0.1 ms | 36.6% ⚠ | 1.00x | 75 | n/a |
| Volar (JS) | **2.7 ms** | 2.5 ms | 0.2 ms | 8.1% | 22.58x | 25 | n/a |
| Verter | **3.5 ms** | 3.3 ms | 0.4 ms | 10.6% ⚠ | 28.77x | 25 | n/a |
| Volar (N) | **6.4 ms** | 6.3 ms | 0.2 ms | 3.1% | 52.67x | 25 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.1 ms, 0.2 ms, 0.1 ms
- **Volar (JS)**: 2.5 ms, 3.0 ms, 2.7 ms
- **Verter**: 4.1 ms, 3.5 ms, 3.3 ms
- **Volar (N)**: 6.3 ms, 6.4 ms, 6.7 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 77.1 MB | 228.6 MB | **305.7 MB** |
| Verter | 138.2 MB | 239.4 MB | **377.6 MB** |
| Volar (JS) | 295.7 MB | 288.6 MB | **584.3 MB** |
| Volar (N) | 306.8 MB | 429.0 MB | **735.8 MB** |

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

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 900.1 ms, min 896.5 ms, CV 0.6%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 400.4 ms, min 395.7 ms, CV 2.6%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? via TNB ?
- **Vize**: content verified | NOT RANKED (informational) — measured 1.21 s, min 1.21 s, CV 1.9%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo (bundled)
- **Verter**: content verified | NOT RANKED (informational) — measured 369.4 ms, min 327.4 ms, CV 8.6%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 906.8 ms, 900.1 ms, 896.5 ms
- **Volar (N)**: 400.4 ms, 416.0 ms, 395.7 ms
- **Vize**: 1.21 s, 1.25 s, 1.21 s
- **Verter**: 327.4 ms, 369.4 ms, 387.8 ms

</details>

#### Edit plants type error -> reported

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit plants type error -> reported" src="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **62.1 ms** | 40.9 ms | 12.6 ms | 22.7% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **354.3 ms** | 354.0 ms | 0.2 ms | 0.1% | 5.70x | 1 | n/a |
| Volar (N) | **446.6 ms** | 446.3 ms | 0.5 ms | 0.1% | 7.19x | 1 | n/a |
| Verter | **697.5 ms** | 477.4 ms | 188.8 ms | 27.9% ⚠ | 11.22x | 1 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 62.1 ms, 63.3 ms, 40.9 ms
- **Volar (JS)**: 354.0 ms, 354.3 ms, 354.4 ms
- **Volar (N)**: 446.6 ms, 447.2 ms, 446.3 ms
- **Verter**: 853.2 ms, 477.4 ms, 697.5 ms

</details>

#### Edit fixes it -> diagnostic clears

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit fixes it -> diagnostic clears" src="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **16.8 ms** | 15.8 ms | 1.0 ms | 6.0% | 1.00x | 0 | n/a |
| Volar (N) | **384.6 ms** | 379.4 ms | 3.3 ms | 0.9% | 22.91x | 0 | n/a |
| Volar (JS) | **442.2 ms** | 441.8 ms | 2.2 ms | 0.5% | 26.34x | 0 | n/a |
| Verter | **657.2 ms** | 466.5 ms | 111.5 ms | 18.7% ⚠ | 39.15x | 0 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 16.8 ms, 15.8 ms, 17.9 ms
- **Volar (N)**: 384.6 ms, 385.7 ms, 379.4 ms
- **Volar (JS)**: 441.8 ms, 445.9 ms, 442.2 ms
- **Verter**: 466.5 ms, 661.9 ms, 657.2 ms

</details>

#### Hover after retype -> NEW type

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Hover after retype -> NEW type" src="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.1 ms** | 15.3 ms | 0.5 ms | 3.1% | 1.00x | 47 | n/a |
| Volar (JS) | **43.2 ms** | 42.5 ms | 2.0 ms | 4.5% | 2.69x | 47 | n/a |
| Vize | **43.6 ms** | 33.2 ms | 14.6 ms | 31.6% ⚠ | 2.71x | 40 | n/a |
| Verter ⚠ | (133.0 ms) | (78.3 ms) | – | – | not ranked | (40) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 122.8% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 16.2 ms, 15.3 ms, 16.1 ms
- **Volar (JS)**: 43.2 ms, 46.2 ms, 42.5 ms
- **Vize**: 43.6 ms, 62.1 ms, 33.2 ms
- **Verter**: 872.4 ms, 133.0 ms, 78.3 ms

</details>

#### ... same hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... same hover, time to correct" src="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.1 ms** | 15.3 ms | 0.5 ms | 3.1% | 1.00x | 1 | n/a |
| Volar (JS) | **43.2 ms** | 42.5 ms | 2.0 ms | 4.5% | 2.69x | 1 | n/a |
| Vize | **43.6 ms** | 33.2 ms | 14.6 ms | 31.6% ⚠ | 2.71x | 1 | n/a |
| Verter ⚠ | (133.0 ms) | (78.3 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 122.8% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 16.2 ms, 15.3 ms, 16.1 ms
- **Volar (JS)**: 43.2 ms, 46.2 ms, 42.5 ms
- **Vize**: 43.6 ms, 62.1 ms, 33.2 ms
- **Verter**: 872.4 ms, 133.0 ms, 78.3 ms

</details>

#### Steady state: edits 1-5 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 1-5 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **13.7 ms** | 12.8 ms | 0.8 ms | 5.6% | 1.00x | n/a | n/a |
| Vize | **33.2 ms** | 31.3 ms | 4.9 ms | 14.0% ⚠ | 2.43x | n/a | n/a |
| Volar (JS) | **34.7 ms** | 33.1 ms | 1.2 ms | 3.4% | 2.54x | n/a | n/a |
| Verter ⚠ | (64.8 ms) | (50.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — edit #4: empty hover payload for `probeValue` | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 12.8 ms, 14.3 ms, 13.7 ms
- **Vize**: 40.5 ms, 31.3 ms, 33.2 ms
- **Volar (JS)**: 33.1 ms, 35.5 ms, 34.7 ms
- **Verter**: 100.8 ms, 64.8 ms, 50.0 ms

</details>

#### Steady state: edits 6-10 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 6-10 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **11.9 ms** | 11.9 ms | 0.8 ms | 6.8% | 1.00x | 1 | n/a |
| Volar (JS) | **26.9 ms** | 25.8 ms | 1.5 ms | 5.4% | 2.26x | -6 | n/a |
| Vize | **31.4 ms** | 30.6 ms | 0.9 ms | 2.9% | 2.64x | -9 | n/a |
| Verter ⚠ | (52.7 ms) | (49.6 ms) | – | – | not ranked | (29) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 58.8% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 13.4 ms, 11.9 ms, 11.9 ms
- **Volar (JS)**: 26.9 ms, 25.8 ms, 28.7 ms
- **Vize**: 31.4 ms, 32.5 ms, 30.6 ms
- **Verter**: 129.9 ms, 49.6 ms, 52.7 ms

</details>

#### Child prop retype -> Parent diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent diagnostic" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **149.5 ms** | 58.7 ms | 55.8 ms | 45.4% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **374.9 ms** | 373.6 ms | 1.5 ms | 0.4% | 2.51x | 1 | n/a |
| Volar (N) | **380.7 ms** | 379.8 ms | 1.2 ms | 0.3% | 2.55x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 149.5 ms, 58.7 ms, 160.4 ms
- **Volar (JS)**: 374.9 ms, 373.6 ms, 376.5 ms
- **Volar (N)**: 379.8 ms, 382.1 ms, 380.7 ms
- **Verter**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Child prop retype -> Parent hover

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent hover" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **61.8 ms** | 55.6 ms | 9.8 ms | 15.3% ⚠ | 1.00x | 42 | n/a |
| Volar (JS) | **88.6 ms** | 87.3 ms | 1.1 ms | 1.2% | 1.43x | 42 | n/a |
| Vize | **149.5 ms** | 133.1 ms | 13.8 ms | 9.3% | 2.42x | 42 | n/a |
| Verter ⚠ | (4.6 ms) | (4.4 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 941ms) | Sample: "```typescript\n(property) label: string\n```" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 74.8 ms, 55.6 ms, 61.8 ms
- **Volar (JS)**: 89.5 ms, 88.6 ms, 87.3 ms
- **Vize**: 149.5 ms, 133.1 ms, 160.5 ms
- **Verter**: 4.6 ms, 4.4 ms, 4.8 ms

</details>

#### ... Parent hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... Parent hover, time to correct" src="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **61.8 ms** | 55.6 ms | 9.8 ms | 15.3% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **88.6 ms** | 87.3 ms | 1.1 ms | 1.2% | 1.43x | 1 | n/a |
| Vize | **149.5 ms** | 133.1 ms | 13.8 ms | 9.3% | 2.42x | 1 | n/a |
| Verter | **642.9 ms** | 459.8 ms | 243.1 ms | 35.7% ⚠ | 10.40x | 5 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 74.8 ms, 55.6 ms, 61.8 ms
- **Volar (JS)**: 89.5 ms, 88.6 ms, 87.3 ms
- **Vize**: 149.5 ms, 133.1 ms, 160.5 ms
- **Verter**: 941.4 ms, 642.9 ms, 459.8 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 74.2 MB | 277.8 MB | **352.0 MB** |
| Volar (JS) | 291.6 MB | 309.9 MB | **601.5 MB** |
| Verter | 42.3 MB | 600.7 MB | **643.0 MB** |
| Volar (N) | 302.3 MB | 403.3 MB | **705.7 MB** |

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
| Verter | **0.4 ms** | 1.00x | **0.4 ms** | 0.3 ms | 0.1 ms | 24.5% ⚠ | 2.04x | 1 | n/a |
| Vize | **64.3 ms** | 143.81x | **0.2 ms** | 0.2 ms | 0.0 ms | 15.0% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **353.7 ms** | 791.59x | **15.3 ms** | 13.1 ms | 1.7 ms | 11.4% ⚠ | 75.65x | 1 | n/a |
| Volar (JS) | **837.1 ms** | 1873.69x | **146.2 ms** | 135.9 ms | 6.4 ms | 4.5% | 722.16x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.4 ms, 0.3 ms, 0.5 ms
- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Volar (N)**: 15.3 ms, 13.1 ms, 16.4 ms
- **Volar (JS)**: 146.2 ms, 135.9 ms, 147.7 ms

</details>

#### Definition: imported fn (script)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-definition-imported-fn-script-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Definition: imported fn (script)" src="charts/lsp-ide-ide-navigation-definition-imported-fn-script.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 1.00x | **0.3 ms** | 0.2 ms | 0.0 ms | 11.9% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **372.1 ms** | 1009.44x | **17.1 ms** | 12.6 ms | 2.7 ms | 17.4% ⚠ | 63.98x | 1 | n/a |
| Volar (JS) | **866.2 ms** | 2349.81x | **138.4 ms** | 135.7 ms | 2.5 ms | 1.8% | 516.98x | 1 | n/a |
| Vize ⚠ | (250.7 ms) | not ranked | (3.6 ms) | (3.5 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: content verified | engine: tsgo (bundled) | ⚠ TOO NOISY TO RANK — CV 142.2% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.2 ms, 0.3 ms
- **Volar (N)**: 17.6 ms, 12.6 ms, 17.1 ms
- **Volar (JS)**: 138.4 ms, 135.7 ms, 140.6 ms
- **Vize**: 3.6 ms, 3.5 ms, 52.5 ms

</details>

#### Type definition: typed binding

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-type-definition-typed-binding-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Type definition: typed binding" src="charts/lsp-ide-ide-navigation-type-definition-typed-binding.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **5.6 ms** | 5.5 ms | 0.2 ms | 3.8% | 1.00x | 1 | n/a |
| Volar (N) | **41.7 ms** | 38.4 ms | 9.0 ms | 20.0% ⚠ | 7.41x | 1 | n/a |
| Vize | **165.6 ms** | 150.4 ms | 9.9 ms | 6.1% | 29.45x | 1 | n/a |
| Verter | **226.9 ms** | 185.1 ms | 35.0 ms | 15.8% ⚠ | 40.36x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 5.5 ms, 5.6 ms, 5.9 ms
- **Volar (N)**: 55.4 ms, 38.4 ms, 41.7 ms
- **Vize**: 150.4 ms, 165.6 ms, 169.1 ms
- **Verter**: 226.9 ms, 254.7 ms, 185.1 ms

</details>

#### References: prop -> parent template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-references-prop-parent-template-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — References: prop -> parent template" src="charts/lsp-ide-ide-navigation-references-prop-parent-template.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **78.6 ms** | 61.7 ms | 13.7 ms | 17.9% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **105.4 ms** | 100.8 ms | 3.1 ms | 2.9% | 1.34x | 4 | n/a |
| Vize ⚠ | (161.7 ms) | (54.7 ms) | – | – | not ranked | (3) | – |
| Verter ⚠ | (173.5 ms) | (72.4 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: content verified | engine: tsgo (bundled) | ⚠ TOO NOISY TO RANK — CV 62.8% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 78.6 ms, 88.9 ms, 61.7 ms
- **Volar (JS)**: 100.8 ms, 106.6 ms, 105.4 ms
- **Vize**: 161.7 ms, 249.2 ms, 54.7 ms
- **Verter**: 184.0 ms, 72.4 ms, 173.5 ms

</details>

#### Prepare rename: prop

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-prepare-rename-prop-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Prepare rename: prop" src="charts/lsp-ide-ide-navigation-prepare-rename-prop.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **2.0 ms** | 1.8 ms | 0.3 ms | 16.0% ⚠ | 1.00x | n/a | n/a |
| Volar (JS) | **5.5 ms** | 4.3 ms | 1.6 ms | 27.4% ⚠ | 2.77x | n/a | n/a |
| Volar (N) ⚠ | (5.0 ms) | (4.4 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: content verified | engine: tsgo ? via TNB ? | ⚠ TOO NOISY TO RANK — CV 53.1% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 2.5 ms, 2.0 ms, 1.8 ms
- **Volar (JS)**: 7.4 ms, 4.3 ms, 5.5 ms
- **Volar (N)**: 4.4 ms, 5.0 ms, 10.9 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.4 ms

</details>

#### Rename prop (cross-file edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Rename prop (cross-file edit)" src="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **3.4 ms** | 3.2 ms | 0.1 ms | 3.4% | 1.00x | 4 | n/a |
| Volar (N) | **3.7 ms** | 3.7 ms | 0.0 ms | 0.8% | 1.09x | 4 | n/a |
| Vize ⚠ | (36.4 ms) | (6.1 ms) | – | – | not ranked | (3) | – |
| Verter ⚠ | (1.3 ms) | (1.1 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: content verified | engine: tsgo (bundled) | ⚠ TOO NOISY TO RANK — CV 80.9% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:3 :: []" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 3.5 ms, 3.4 ms, 3.2 ms
- **Volar (N)**: 3.7 ms, 3.7 ms, 3.7 ms
- **Vize**: 6.1 ms, 36.4 ms, 63.1 ms
- **Verter**: 1.3 ms, 1.3 ms, 1.1 ms

</details>

#### Code action at diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-code-action-at-diagnostic-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Code action at diagnostic" src="charts/lsp-ide-ide-navigation-code-action-at-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **26.2 ms** | 25.2 ms | 0.7 ms | 2.6% | 1.00x | 2 | n/a |
| Volar (N) | **560.2 ms** | 545.4 ms | 13.1 ms | 2.3% | 21.35x | 2 | n/a |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.7 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 25.2 ms, 26.2 ms, 26.5 ms
- **Volar (N)**: 560.2 ms, 545.4 ms, 571.4 ms
- **Vize**: 0.4 ms, 0.4 ms, 0.4 ms
- **Verter**: 0.7 ms, 0.7 ms, 0.5 ms

</details>

#### Signature help after `(`

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-signature-help-after-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Signature help after `(`" src="charts/lsp-ide-ide-navigation-signature-help-after.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **15.4 ms** | 15.0 ms | 0.4 ms | 2.6% | 1.00x | 1 | n/a |
| Volar (N) | **24.1 ms** | 21.2 ms | 2.2 ms | 9.2% | 1.56x | 1 | n/a |
| Vize | **113.7 ms** | 112.3 ms | 2.0 ms | 1.8% | 7.37x | 1 | n/a |
| Verter ⚠ | (4.3 ms) | (3.4 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 15.0 ms, 15.7 ms, 15.4 ms
- **Volar (N)**: 21.2 ms, 25.5 ms, 24.1 ms
- **Vize**: 116.2 ms, 112.3 ms, 113.7 ms
- **Verter**: 4.9 ms, 3.4 ms, 4.3 ms

</details>

#### Format unformatted SFC

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-format-unformatted-sfc-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Format unformatted SFC" src="charts/lsp-ide-ide-navigation-format-unformatted-sfc.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 8.3% | 1.00x | 1 | n/a |
| Volar (JS) | **47.9 ms** | 47.6 ms | 2.8 ms | 5.6% | 126.84x | 1 | n/a |
| Volar (N) | **94.8 ms** | 85.3 ms | 7.7 ms | 8.2% | 250.96x | 1 | n/a |
| Verter ⚠ | (0.3 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.4 ms, 0.4 ms
- **Volar (JS)**: 47.6 ms, 52.5 ms, 47.9 ms
- **Volar (N)**: 100.5 ms, 85.3 ms, 94.8 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.2 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 125.1 MB | 137.3 MB | **262.4 MB** |
| Vize | 76.5 MB | 265.6 MB | **342.1 MB** |
| Volar (JS) | 293.3 MB | 254.4 MB | **547.6 MB** |
| Volar (N) | 301.3 MB | 536.3 MB | **837.6 MB** |

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
| Vize | **214.5 ms** | 1.00x | **1.9 ms** | 1.9 ms | 0.1 ms | 6.3% | 1.00x | 89 | n/a |
| Volar (N) | **381.6 ms** | 1.78x | **18.9 ms** | 18.2 ms | 0.6 ms | 3.1% | 9.93x | 90 | n/a |
| Volar (JS) | **866.0 ms** | 4.04x | **142.3 ms** | 136.5 ms | 3.4 ms | 2.4% | 74.84x | 90 | n/a |
| Verter ⚠ | (197.4 ms) | not ranked | (27.6 ms) | (0.7 ms) | – | – | not ranked | (89) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 88.7% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.9 ms, 1.9 ms, 2.1 ms
- **Volar (N)**: 18.2 ms, 18.9 ms, 19.4 ms
- **Volar (JS)**: 142.4 ms, 136.5 ms, 142.3 ms
- **Verter**: 0.7 ms, 40.9 ms, 27.6 ms

</details>

#### Hover (template interpolation)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-smoke-hover-template-interpolation-dark.svg">
  <img alt="IDE · Smoke (reference suite) — Hover (template interpolation)" src="charts/lsp-ide-ide-smoke-hover-template-interpolation.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **200.7 ms** | 1.00x | **1.8 ms** | 1.8 ms | 0.0 ms | 1.8% | 1.00x | 38 | n/a |
| Volar (N) | **389.5 ms** | 1.94x | **16.7 ms** | 14.8 ms | 2.0 ms | 11.9% ⚠ | 9.06x | 43 | n/a |
| Volar (JS) ⚠ | (895.4 ms) | not ranked | (119.9 ms) | (5.9 ms) | – | – | not ranked | (43) | – |
| Verter ⚠ | (162.0 ms) | not ranked | (8.3 ms) | (0.6 ms) | – | – | not ranked | (74) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 82.2% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 113.4% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.8 ms, 1.8 ms, 1.9 ms
- **Volar (N)**: 18.8 ms, 14.8 ms, 16.7 ms
- **Volar (JS)**: 119.9 ms, 5.9 ms, 145.5 ms
- **Verter**: 26.7 ms, 0.6 ms, 8.3 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 80.0 MB | 100.0 MB | **180.0 MB** |
| Vize | 72.9 MB | 170.8 MB | **243.7 MB** |
| Volar (JS) | 276.1 MB | 248.6 MB | **524.6 MB** |
| Volar (N) | 287.7 MB | 337.4 MB | **625.1 MB** |

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
| Vize | **105.9 ms** | 105.9 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (JS) | **419.7 ms** | 419.7 ms | n/a | n/a | 3.96x | n/a | n/a |
| Volar (N) | **479.8 ms** | 479.8 ms | n/a | n/a | 4.53x | n/a | n/a |
| Verter | **833.6 ms** | 833.6 ms | n/a | n/a | 7.87x | n/a | n/a |

<details><summary>Notes</summary>

- **Vize**: all components verified · edit → diagnostic=62ms · hover after edit=44ms · completion=0ms
- **Volar (JS)**: all components verified · edit → diagnostic=354ms · hover after edit=43ms · completion=22ms
- **Volar (N)**: all components verified · edit → diagnostic=447ms · hover after edit=16ms · completion=17ms
- **Verter**: all components verified · edit → diagnostic=697ms · hover after edit=133ms · completion=3ms

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
| **Time-to-usable** | Verter LSP (npm 0.0.1-beta.3) | 226 ms | 281 ms | 300 ms | ×1.6 | 46.0 MB |
|  | Vize LSP (Node shim) | 577 ms | 588 ms | 595 ms | ×1.03 | 63.6 MB |
|  | Volar (TNB / tsgo tsdk) | 1.19 s | 1.38 s | 2.09 s | ×1.73 | 268.9 + 137.3 = 406.2 MB |
|  | Volar (@vue/language-server) | 1.93 s | 2.08 s | 3.09 s | ×1.58 | 253.5 + 76.5 = 330.0 MB |
| **Completion** | Vize LSP (Node shim) | 0.4 ms | 0.4 ms | 0.4 ms | ×1.31 | 63.6 MB |
|  | Verter LSP (npm 0.0.1-beta.3) | 156 ms | 179 ms | 177 ms | ×1.13 | 46.0 MB |
|  | Volar (TNB / tsgo tsdk) | 182 ms | 190 ms | 251 ms | ×1.38 | 268.9 + 137.3 = 406.2 MB |
|  | Volar (@vue/language-server) | 215 ms | 194 ms | 275 ms | ×1.31 | 253.5 + 76.5 = 330.0 MB |
| **References** | Volar (TNB / tsgo tsdk) | 165 ms | 681 ms | 10.8 s | ×65.69 | 268.9 + 137.3 = 406.2 MB |
|  | Volar (@vue/language-server) | 451 ms | 1.05 s | 15.1 s | ×33.55 | 253.5 + 76.5 = 330.0 MB |
|  | Vize LSP (Node shim) | 424 ms | (3.20 s) ⚠ | (16.4 s) ⚠ | – | 63.6 MB |
|  | Verter LSP (npm 0.0.1-beta.3) | (29.4 ms) ⚠ | (39.7 ms) ⚠ | (37.1 ms) ⚠ | – | 46.0 MB |
| **Hover warm** | Verter LSP (npm 0.0.1-beta.3) | 0.7 ms | 0.9 ms | 1.1 ms | ×1.57 | 46.0 MB |
|  | Volar (@vue/language-server) | 1.4 ms | 2.1 ms | 1.5 ms | ×1.1 | 253.5 + 76.5 = 330.0 MB |
|  | Volar (TNB / tsgo tsdk) | 1.6 ms | 1.9 ms | 4.5 ms | ×2.76 | 268.9 + 137.3 = 406.2 MB |
|  | Vize LSP (Node shim) | 3.0 ms | 5.5 ms | (1.1 ms) ⚠ | – | 63.6 MB |

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

pass **22** · fail **5** · warn **0** · skip **0**

| Case | volar | vize | verter |
| --- | :---: | :---: | :---: |
| `completion-prop-template` | ✓ | ✓ | ✓ |
| `definition-component` | ✓ | ✓ | ✓ |
| `definition-prop-attr` | ✓ | ✓ | ✓ |
| `diagnostics-clear-after-fix` | ✓ | **✗** | ✓ |
| `diagnostics-template` | ✓ | **✗** | ✓ |
| `document-symbol-structure` | ✓ | **✗** | ✓ |
| `hover-template-binding` | ✓ | ✓ | ✓ |
| `references-prop-template` | ✓ | ✓ | **✗** |
| `rename-prop-template` | ✓ | ✓ | **✗** |

<details><summary>Failure detail</summary>

- `document-symbol-structure` · **vize** — documentSymbol never names greeting — saw: template, script setup
- `diagnostics-template` · **vize** — no diagnostic mentioning plantedBadProp within 20000ms — no diagnostics published
- `diagnostics-clear-after-fix` · **vize** — cannot confirm clear: planted plantedBadProp never appeared
- `references-prop-template` · **verter** — references missing App.vue — only found child.vue
- `rename-prop-template` · **verter** — BROKEN REFACTOR: edited child.vue:2 but produced no edit in App.vue — the template usage is left behind

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 98.33 / 219.58 / 98.33 | 1.13 / 2.80 / 1.66 | 40 | 14.1 | 583 | 3 |
| LSP vize (server process, Node shim) | 167.17 / 253.36 / 167.17 | 0.88 / 1.73 / 1.25 | 80 | 13.2 | 423 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) | 395.57 / 536.12 / 395.57 | 0.92 / 2.65 / 1.72 | 760 | 10.3 | 1917 | 3 |

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
| vize | 0.354.0 |
| @vizejs/native | 0.354.0 |
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
| cli:vize | 0.354.0 |
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
