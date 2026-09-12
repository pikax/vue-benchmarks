# LSP and IDE operations

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-09-12T11:01:27.224Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`d4906cb`](https://github.com/pikax/vue-benchmarks/commit/d4906cbe77791d01e3e55b298b0bff7476ea561a)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/34689529541
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
| Verter | **293.8 ms** | 285.7 ms | 6.9 ms | 2.3% | 1.00x | 113 | 3 files/s | 112.9 + 120.7 = 233.6 MB |
| Vize | **381.0 ms** | 372.7 ms | 4.2 ms | 1.1% | 1.30x | 113 | 3 files/s | 74.4 + 193.9 = 268.3 MB |
| Volar (N) | **410.3 ms** | 403.9 ms | 6.5 ms | 1.6% | 1.40x | 114 | 2 files/s | – |
| Volar (JS) | **1.19 s** | 1.15 s | 20.9 ms | 1.8% | 4.04x | 114 | 1 files/s | 292.5 + 261.8 = 554.3 MB |

<details><summary>Notes</summary>

- **Verter**: verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | init=5ms · ready=33ms · open→hover=304ms · hoverCold=1ms · hoverWarm=1ms · completion=1ms · definition=1ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.2/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. | engine: tsgo (bundled) | init=37ms · ready=n/a · open→hover=377ms · hoverCold=5ms · hoverWarm=4ms · completion=8ms · definition=4ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (N)**: Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.16.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.16.tsgo.7.0.2 | init=573ms · ready=n/a · open→hover=419ms · hoverCold=20ms · hoverWarm=2ms · completion=5ms · definition=4ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (JS)**: Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. | engine: TypeScript 6.0.3 (JS) | init=553ms · ready=n/a · open→hover=1167ms · hoverCold=54ms · hoverWarm=3ms · completion=23ms · definition=11ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)

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

- **Verter**: 285.7 ms, 293.8 ms, 295.7 ms, 290.1 ms, 304.1 ms
- **Vize**: 382.5 ms, 372.7 ms, 381.0 ms, 382.0 ms, 376.7 ms
- **Volar (N)**: 410.3 ms, 414.6 ms, 403.9 ms, 405.3 ms, 419.5 ms
- **Volar (JS)**: 1.20 s, 1.19 s, 1.15 s, 1.19 s, 1.17 s

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
| Vize | **30.5 ms** | 28.9 ms | 1.0 ms | 3.2% | 1.00x | n/a | n/a |
| Volar (N) | **414.1 ms** | 408.5 ms | 5.0 ms | 1.2% | 13.58x | n/a | n/a |
| Volar (JS) | **417.8 ms** | 409.2 ms | 13.8 ms | 3.3% | 13.70x | n/a | n/a |
| Verter ⚠ | (4.8 ms) | (3.9 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo (bundled)
- **Volar (N)**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? via TNB ?
- **Volar (JS)**: LSP initialize handshake after spawn (not first-request latency) | engine: TypeScript ? (JS)
- **Verter ⚠**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 56.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 31.2 ms, 31.5 ms, 31.7 ms, 30.0 ms, 30.3 ms, 30.7 ms, 30.6 ms, 29.3 ms, 30.5 ms, 30.6 ms, 30.5 ms, 29.6 ms, 30.2 ms, 29.9 ms, 29.7 ms, 28.9 ms, 31.1 ms, 32.6 ms, 29.5 ms, 29.6 ms, 32.2 ms
- **Volar (N)**: 419.2 ms, 417.8 ms, 415.9 ms, 413.3 ms, 422.1 ms, 419.3 ms, 424.9 ms, 416.3 ms, 426.9 ms, 411.7 ms, 411.0 ms, 408.5 ms, 410.0 ms, 414.1 ms, 411.4 ms, 415.3 ms, 411.3 ms, 411.2 ms, 411.5 ms, 413.1 ms, 414.1 ms
- **Volar (JS)**: 448.4 ms, 458.3 ms, 448.6 ms, 420.9 ms, 421.3 ms, 438.2 ms, 422.2 ms, 421.9 ms, 426.3 ms, 415.8 ms, 417.8 ms, 418.6 ms, 410.2 ms, 415.4 ms, 416.7 ms, 414.0 ms, 411.9 ms, 415.8 ms, 409.2 ms, 414.4 ms, 410.3 ms
- **Verter**: 4.0 ms, 17.4 ms, 13.5 ms, 4.4 ms, 6.1 ms, 4.2 ms, 3.9 ms, 3.9 ms, 3.9 ms, 5.5 ms, 4.9 ms, 4.3 ms, 4.8 ms, 4.1 ms, 4.6 ms, 4.3 ms, 5.6 ms, 6.4 ms, 6.2 ms, 7.0 ms, 7.2 ms

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
| Vize | **0.5 ms** | 0.5 ms | 0.0 ms | 8.3% | 1.00x | 15 | n/a |
| Volar (N) | **73.3 ms** | 54.2 ms | 12.0 ms | 17.7% ⚠ | 137.24x | 48 | n/a |
| Volar (JS) | **475.6 ms** | 462.7 ms | 13.5 ms | 2.8% | 890.74x | 48 | n/a |
| Verter ⚠ | (57.8 ms) | (22.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no tokens at all for this document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.5 ms, 0.5 ms
- **Volar (N)**: 54.2 ms, 73.3 ms, 76.3 ms
- **Volar (JS)**: 462.7 ms, 475.6 ms, 489.7 ms
- **Verter**: 22.2 ms, 57.8 ms, 363.8 ms

</details>

#### Semantic tokens (delta after edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit-dark.svg">
  <img alt="IDE · Background (editor chatter) — Semantic tokens (delta after edit)" src="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (0.8 ms) | (0.8 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (0.9 ms) | (0.9 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (15.8 ms) | (10.4 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1789210326341", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1789210333401", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 0.9 ms, 0.8 ms, 0.8 ms
- **Volar (N)**: 0.9 ms, 0.9 ms, 0.9 ms
- **Vize**: 17.6 ms, 15.8 ms, 10.4 ms
- **Verter**: 2.4 ms, 0.7 ms, 0.7 ms

</details>

#### Document symbols (outline)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-symbols-outline-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document symbols (outline)" src="charts/lsp-ide-ide-background-document-symbols-outline.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.4 ms** | 15.7 ms | 2.4 ms | 13.9% ⚠ | 1.00x | 25 | n/a |
| Volar (JS) | **17.2 ms** | 13.0 ms | 2.7 ms | 16.6% ⚠ | 1.05x | 25 | n/a |
| Vize ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (2) | – |
| Verter ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | (12) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — outline is missing 7/7 script symbols: heading, nextLabel, threshold, entries, visibleEntries, formatEntry, addEntry | Sample: "2 symbols: template, script setup" | engine: tsgo (bundled)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 125.8% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 15.7 ms, 20.2 ms, 16.4 ms
- **Volar (JS)**: 13.0 ms, 18.0 ms, 17.2 ms
- **Vize**: 0.3 ms, 0.2 ms, 0.2 ms
- **Verter**: 4.5 ms, 0.5 ms, 0.5 ms

</details>

#### Document highlight (caret move)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-highlight-caret-move-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document highlight (caret move)" src="charts/lsp-ide-ide-background-document-highlight-caret-move.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 8.2% | 1.00x | 4 | n/a |
| Verter | **0.4 ms** | 0.4 ms | 0.2 ms | 43.9% ⚠ | 2.37x | 4 | n/a |
| Volar (JS) | **14.0 ms** | 13.6 ms | 0.2 ms | 1.7% | 87.98x | 5 | n/a |
| Volar (N) | **25.8 ms** | 25.5 ms | 0.2 ms | 0.7% | 162.26x | 5 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.4 ms, 0.4 ms, 0.8 ms
- **Volar (JS)**: 14.0 ms, 14.0 ms, 13.6 ms
- **Volar (N)**: 25.8 ms, 25.5 ms, 25.8 ms

</details>

#### Inlay hints (document range)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-inlay-hints-document-range-dark.svg">
  <img alt="IDE · Background (editor chatter) — Inlay hints (document range)" src="charts/lsp-ide-ide-background-inlay-hints-document-range.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 2.9% | 1.00x | 2 | n/a |
| Volar (JS) | **65.4 ms** | 58.5 ms | 4.2 ms | 6.6% | 176.57x | 14 | n/a |
| Volar (N) | **174.4 ms** | 165.6 ms | 6.6 ms | 3.8% | 470.91x | 14 | n/a |
| Verter ⚠ | (0.5 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.4 ms, 0.4 ms
- **Volar (JS)**: 65.4 ms, 66.0 ms, 58.5 ms
- **Volar (N)**: 165.6 ms, 174.4 ms, 178.6 ms
- **Verter**: 2.5 ms, 0.3 ms, 0.5 ms

</details>

#### Folding ranges

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-folding-ranges-dark.svg">
  <img alt="IDE · Background (editor chatter) — Folding ranges" src="charts/lsp-ide-ide-background-folding-ranges.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 11.4% ⚠ | 1.00x | 9 | n/a |
| Volar (N) | **5.7 ms** | 5.5 ms | 0.6 ms | 9.4% | 36.00x | 13 | n/a |
| Volar (JS) | **7.4 ms** | 6.0 ms | 3.2 ms | 37.9% ⚠ | 46.65x | 13 | n/a |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (7) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 107.5% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Volar (N)**: 5.5 ms, 6.6 ms, 5.7 ms
- **Volar (JS)**: 6.0 ms, 12.1 ms, 7.4 ms
- **Verter**: 2.2 ms, 0.3 ms, 0.4 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 119.9 MB | 104.3 MB | **224.1 MB** |
| Vize | 72.6 MB | 172.2 MB | **244.7 MB** |
| Volar (JS) | 276.4 MB | 254.3 MB | **530.8 MB** |
| Volar (N) | 286.5 MB | 381.1 MB | **667.5 MB** |

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
| Vize | **0.6 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.0 ms | 11.3% ⚠ | 1.00x | 3 | n/a |
| Volar (N) | **289.6 ms** | 513.90x | **17.9 ms** | 17.9 ms | 1.3 ms | 7.0% | 81.31x | 3 | n/a |
| Volar (JS) | **838.0 ms** | 1487.14x | **21.0 ms** | 18.5 ms | 3.0 ms | 14.0% ⚠ | 95.61x | 3 | n/a |
| Verter ⚠ | (217.9 ms) | not ranked | (1.4 ms) | (0.8 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 154.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Volar (N)**: 17.9 ms, 17.9 ms, 20.1 ms
- **Volar (JS)**: 18.5 ms, 21.0 ms, 24.4 ms
- **Verter**: 1.4 ms, 0.8 ms, 27.3 ms

</details>

#### Completion: component tag &lt;Ch

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-component-tag-ch-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: component tag &lt;Ch" src="charts/lsp-ide-ide-completion-completion-component-tag-ch.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **98.1 ms** | 1.00x | **29.4 ms** | 29.2 ms | 0.1 ms | 0.4% | 1.18x | 192 | n/a |
| Volar (N) | **105.3 ms** | 1.07x | **31.5 ms** | 31.0 ms | 1.8 ms | 5.5% | 1.26x | 192 | n/a |
| Verter | **158.3 ms** | 1.61x | **24.9 ms** | 21.9 ms | 3.8 ms | 14.9% ⚠ | 1.00x | 1,193 | n/a |
| Vize ⚠ | (52.0 ms) | not ranked | (0.5 ms) | (0.5 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `ChildCard` component tag in 42 items | Sample: "[v-if, v-else-if, v-else, v-for, v-on, v-bind, v-model, v-slot, v-show, v-pre, v-once, v-memo, …+30]" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 29.4 ms, 29.2 ms, 29.4 ms
- **Volar (N)**: 34.2 ms, 31.0 ms, 31.5 ms
- **Verter**: 29.4 ms, 21.9 ms, 24.9 ms
- **Vize**: 0.5 ms, 0.5 ms, 0.5 ms

</details>

#### Completion: prop name &lt;C :

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-prop-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: prop name &lt;C :" src="charts/lsp-ide-ide-completion-completion-prop-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 1.00x | **0.3 ms** | 0.2 ms | 0.0 ms | 10.2% ⚠ | 1.00x | 4 | n/a |
| Verter | **2.2 ms** | 7.37x | **1.0 ms** | 0.9 ms | 0.1 ms | 7.0% | 3.83x | 16 | n/a |
| Volar (N) | **26.7 ms** | 91.53x | **5.5 ms** | 5.4 ms | 0.2 ms | 3.2% | 20.97x | 26 | n/a |
| Volar (JS) | **148.7 ms** | 508.70x | **128.7 ms** | 122.9 ms | 19.9 ms | 14.5% ⚠ | 490.76x | 26 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.2 ms, 0.3 ms
- **Verter**: 0.9 ms, 1.1 ms, 1.0 ms
- **Volar (N)**: 5.7 ms, 5.5 ms, 5.4 ms
- **Volar (JS)**: 128.7 ms, 159.8 ms, 122.9 ms

</details>

#### Completion: event name &lt;C @

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-event-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: event name &lt;C @" src="charts/lsp-ide-ide-completion-completion-event-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **5.3 ms** | 1.00x | **4.5 ms** | 4.3 ms | 0.2 ms | 4.9% | 1.00x | 25 | n/a |
| Volar (JS) | **13.0 ms** | 2.43x | **6.6 ms** | 5.2 ms | 1.0 ms | 16.0% ⚠ | 1.45x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.2 ms) | – | – | not ranked | (12) | – |
| Verter ⚠ | (0.2 ms) | not ranked | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 12 items | Sample: "[v-on, @, @click, @input, @change, @submit, @keydown, @keyup, @focus, @blur, @mouseenter, @mouseleave]" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 4.8 ms, 4.3 ms, 4.5 ms
- **Volar (JS)**: 5.2 ms, 7.2 ms, 6.6 ms
- **Vize**: 0.3 ms, 0.2 ms, 0.3 ms
- **Verter**: 0.2 ms, 0.2 ms, 0.2 ms

</details>

#### Completion: directive v-

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-directive-v-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: directive v-" src="charts/lsp-ide-ide-completion-completion-directive-v.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 1.00x | **0.3 ms** | 0.2 ms | 0.0 ms | 11.5% ⚠ | 1.00x | 15 | n/a |
| Volar (N) | **21.7 ms** | 77.78x | **10.2 ms** | 10.2 ms | 0.1 ms | 0.7% | 37.86x | 498 | n/a |
| Volar (JS) | **23.9 ms** | 85.63x | **10.5 ms** | 10.3 ms | 0.5 ms | 5.1% | 39.06x | 498 | n/a |
| Verter ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.2 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `v-if` directive in 3 items | Sample: "[style scoped, style, i18n]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.2 ms, 0.3 ms
- **Volar (N)**: 10.3 ms, 10.2 ms, 10.2 ms
- **Volar (JS)**: 10.3 ms, 11.3 ms, 10.5 ms
- **Verter**: 0.3 ms, 0.2 ms, 0.3 ms

</details>

#### Completion: slot name &lt;template #

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-slot-name-template-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: slot name &lt;template #" src="charts/lsp-ide-ide-completion-completion-slot-name-template.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.2 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.0 ms | 17.4% ⚠ | 1.00x | 2 | n/a |
| Vize | **0.4 ms** | 1.72x | **0.4 ms** | 0.4 ms | 0.0 ms | 9.4% | 1.60x | 30 | n/a |
| Volar (N) | **13.0 ms** | 52.14x | **10.8 ms** | 10.3 ms | 1.1 ms | 10.1% ⚠ | 43.40x | 500 | n/a |
| Volar (JS) | **13.6 ms** | 54.40x | **10.9 ms** | 10.6 ms | 1.1 ms | 9.4% | 43.91x | 500 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.2 ms, 0.2 ms, 0.3 ms
- **Vize**: 0.4 ms, 0.4 ms, 0.4 ms
- **Volar (N)**: 10.8 ms, 12.5 ms, 10.3 ms
- **Volar (JS)**: 12.6 ms, 10.9 ms, 10.6 ms

</details>

#### Completion: auto-import

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-auto-import-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: auto-import" src="charts/lsp-ide-ide-completion-completion-auto-import.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **27.4 ms** | 26.0 ms | 2.3 ms | 8.1% | 1.00x | 1,073 | n/a |
| Volar (N) | **39.4 ms** | 36.3 ms | 8.8 ms | 20.5% ⚠ | 1.44x | 1,073 | n/a |
| Vize ⚠ | (203.6 ms) | (199.3 ms) | – | – | not ranked | (1,103) | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import | Sample: "offered: \"getComputedStyle\" kind=3 ; \"computed\" kind=6 ; \"computed\" kind=3 detail=\"function computed&lt;T>(getter: () => T): ComputedRef&lt;T>\"" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 27.4 ms, 26.0 ms, 30.4 ms
- **Volar (N)**: 36.3 ms, 39.4 ms, 52.8 ms
- **Vize**: 199.3 ms, 203.6 ms, 211.3 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.4 ms

</details>

#### Resolve: auto-import edit

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-auto-import-edit-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: auto-import edit" src="charts/lsp-ide-ide-completion-resolve-auto-import-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **41.1 ms** | 37.8 ms | 2.2 ms | 5.4% | 1.00x | 241 | n/a |
| Volar (N) | **42.1 ms** | 39.2 ms | 2.4 ms | 5.7% | 1.03x | 241 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` | Sample: "\"computed\" kind=6" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 42.0 ms, 37.8 ms, 41.1 ms
- **Volar (N)**: 43.9 ms, 39.2 ms, 42.1 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-script-member-detail-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: script member detail" src="charts/lsp-ide-ide-completion-resolve-script-member-detail.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.1 ms** | 0.1 ms | 0.0 ms | 11.1% ⚠ | 1.00x | 75 | n/a |
| Volar (JS) | **2.9 ms** | 2.7 ms | 0.2 ms | 6.5% | 21.71x | 25 | n/a |
| Verter | **4.2 ms** | 4.1 ms | 0.1 ms | 2.0% | 31.39x | 25 | n/a |
| Volar (N) | **6.9 ms** | 6.8 ms | 0.2 ms | 2.5% | 51.33x | 25 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.1 ms, 0.1 ms, 0.1 ms
- **Volar (JS)**: 2.9 ms, 3.1 ms, 2.7 ms
- **Verter**: 4.3 ms, 4.2 ms, 4.1 ms
- **Volar (N)**: 6.8 ms, 7.1 ms, 6.9 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 75.0 MB | 230.7 MB | **305.7 MB** |
| Verter | 130.6 MB | 180.4 MB | **311.0 MB** |
| Volar (JS) | 291.7 MB | 274.4 MB | **566.1 MB** |
| Volar (N) | 303.7 MB | 387.5 MB | **691.2 MB** |

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

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 918.2 ms, min 901.2 ms, CV 1.3%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 376.7 ms, min 375.0 ms, CV 1.7%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? via TNB ?
- **Vize**: content verified | NOT RANKED (informational) — measured 1.21 s, min 1.21 s, CV 0.5%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo (bundled)
- **Verter**: content verified | NOT RANKED (informational) — measured 313.4 ms, min 312.2 ms, CV 4.7%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 901.2 ms, 924.7 ms, 918.2 ms
- **Volar (N)**: 386.8 ms, 375.0 ms, 376.7 ms
- **Vize**: 1.21 s, 1.21 s, 1.22 s
- **Verter**: 339.2 ms, 312.2 ms, 313.4 ms

</details>

#### Edit plants type error -> reported

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit plants type error -> reported" src="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **79.0 ms** | 78.1 ms | 1.7 ms | 2.1% | 1.00x | 1 | n/a |
| Volar (JS) | **354.5 ms** | 354.4 ms | 1.2 ms | 0.3% | 4.49x | 1 | n/a |
| Volar (N) | **418.0 ms** | 404.1 ms | 19.1 ms | 4.5% | 5.29x | 1 | n/a |
| Verter | **448.3 ms** | 446.1 ms | 1.3 ms | 0.3% | 5.67x | 1 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 81.4 ms, 79.0 ms, 78.1 ms
- **Volar (JS)**: 354.4 ms, 356.5 ms, 354.5 ms
- **Volar (N)**: 404.1 ms, 441.8 ms, 418.0 ms
- **Verter**: 448.5 ms, 446.1 ms, 448.3 ms

</details>

#### Edit fixes it -> diagnostic clears

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit fixes it -> diagnostic clears" src="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **32.2 ms** | 32.1 ms | 1.0 ms | 3.0% | 1.00x | 0 | n/a |
| Volar (N) | **377.8 ms** | 375.3 ms | 1.5 ms | 0.4% | 11.72x | 0 | n/a |
| Volar (JS) | **439.3 ms** | 438.4 ms | 0.5 ms | 0.1% | 13.63x | 0 | n/a |
| Verter | **571.3 ms** | 570.2 ms | 24.1 ms | 4.1% | 17.72x | 0 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 32.2 ms, 32.1 ms, 33.9 ms
- **Volar (N)**: 378.0 ms, 375.3 ms, 377.8 ms
- **Volar (JS)**: 438.4 ms, 439.4 ms, 439.3 ms
- **Verter**: 570.2 ms, 571.3 ms, 612.6 ms

</details>

#### Hover after retype -> NEW type

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Hover after retype -> NEW type" src="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **13.9 ms** | 13.9 ms | 1.1 ms | 7.8% | 1.00x | 47 | n/a |
| Volar (JS) | **42.3 ms** | 42.0 ms | 5.7 ms | 12.6% ⚠ | 3.05x | 47 | n/a |
| Vize | **68.0 ms** | 65.0 ms | 1.9 ms | 2.8% | 4.90x | 40 | n/a |
| Verter | **72.2 ms** | 52.7 ms | 11.8 ms | 17.8% ⚠ | 5.20x | 40 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 13.9 ms, 15.8 ms, 13.9 ms
- **Volar (JS)**: 52.0 ms, 42.0 ms, 42.3 ms
- **Vize**: 65.0 ms, 68.0 ms, 68.5 ms
- **Verter**: 52.7 ms, 72.2 ms, 74.0 ms

</details>

#### ... same hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... same hover, time to correct" src="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **13.9 ms** | 13.9 ms | 1.1 ms | 7.8% | 1.00x | 1 | n/a |
| Volar (JS) | **42.3 ms** | 42.0 ms | 5.7 ms | 12.6% ⚠ | 3.05x | 1 | n/a |
| Vize | **68.0 ms** | 65.0 ms | 1.9 ms | 2.8% | 4.90x | 1 | n/a |
| Verter | **72.2 ms** | 52.7 ms | 11.8 ms | 17.8% ⚠ | 5.20x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 13.9 ms, 15.8 ms, 13.9 ms
- **Volar (JS)**: 52.0 ms, 42.0 ms, 42.3 ms
- **Vize**: 65.0 ms, 68.0 ms, 68.5 ms
- **Verter**: 52.7 ms, 72.2 ms, 74.0 ms

</details>

#### Steady state: edits 1-5 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 1-5 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **13.8 ms** | 12.8 ms | 0.6 ms | 4.6% | 1.00x | n/a | n/a |
| Verter | **28.4 ms** | 27.3 ms | 4.0 ms | 13.2% ⚠ | 2.05x | n/a | n/a |
| Volar (JS) | **33.9 ms** | 33.1 ms | 3.6 ms | 10.1% ⚠ | 2.45x | n/a | n/a |
| Vize | **77.7 ms** | 75.8 ms | 1.6 ms | 2.1% | 5.63x | n/a | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 12.8 ms, 13.9 ms, 13.8 ms
- **Verter**: 34.6 ms, 27.3 ms, 28.4 ms
- **Volar (JS)**: 39.7 ms, 33.9 ms, 33.1 ms
- **Vize**: 79.0 ms, 75.8 ms, 77.7 ms

</details>

#### Steady state: edits 6-10 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 6-10 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **14.3 ms** | 13.3 ms | 1.8 ms | 12.2% ⚠ | 1.00x | 1 | n/a |
| Verter | **29.2 ms** | 28.6 ms | 0.9 ms | 3.1% | 2.05x | -6 | n/a |
| Volar (JS) | **29.8 ms** | 28.1 ms | 2.4 ms | 8.0% | 2.09x | -7 | n/a |
| Vize | **72.5 ms** | 69.4 ms | 3.7 ms | 5.1% | 5.09x | -10 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 13.3 ms, 16.8 ms, 14.3 ms
- **Verter**: 28.6 ms, 29.2 ms, 30.4 ms
- **Volar (JS)**: 32.8 ms, 29.8 ms, 28.1 ms
- **Vize**: 69.4 ms, 72.5 ms, 76.8 ms

</details>

#### Child prop retype -> Parent diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent diagnostic" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **60.8 ms** | 60.5 ms | 0.8 ms | 1.4% | 1.00x | 1 | n/a |
| Volar (JS) | **377.9 ms** | 376.2 ms | 1.0 ms | 0.3% | 6.22x | 1 | n/a |
| Volar (N) | **378.0 ms** | 376.8 ms | 1.2 ms | 0.3% | 6.22x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 62.1 ms, 60.8 ms, 60.5 ms
- **Volar (JS)**: 378.1 ms, 376.2 ms, 377.9 ms
- **Volar (N)**: 379.3 ms, 378.0 ms, 376.8 ms
- **Verter**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Child prop retype -> Parent hover

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent hover" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **49.5 ms** | 48.2 ms | 2.0 ms | 4.0% | 1.00x | 42 | n/a |
| Vize | **61.0 ms** | 60.6 ms | 0.9 ms | 1.4% | 1.23x | 239 | n/a |
| Volar (JS) | **80.0 ms** | 77.3 ms | 5.2 ms | 6.4% | 1.61x | 42 | n/a |
| Verter ⚠ | (4.2 ms) | (3.8 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 439ms) | Sample: "```typescript\n(property) label: string\n```" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 49.5 ms, 52.1 ms, 48.2 ms
- **Vize**: 62.2 ms, 61.0 ms, 60.6 ms
- **Volar (JS)**: 87.3 ms, 80.0 ms, 77.3 ms
- **Verter**: 6.8 ms, 4.2 ms, 3.8 ms

</details>

#### ... Parent hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... Parent hover, time to correct" src="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **49.5 ms** | 48.2 ms | 2.0 ms | 4.0% | 1.00x | 1 | n/a |
| Vize | **61.0 ms** | 60.6 ms | 0.9 ms | 1.4% | 1.23x | 1 | n/a |
| Volar (JS) | **80.0 ms** | 77.3 ms | 5.2 ms | 6.4% | 1.61x | 1 | n/a |
| Verter | **435.3 ms** | 435.2 ms | 2.3 ms | 0.5% | 8.79x | 3 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 49.5 ms, 52.1 ms, 48.2 ms
- **Vize**: 62.2 ms, 61.0 ms, 60.6 ms
- **Volar (JS)**: 87.3 ms, 80.0 ms, 77.3 ms
- **Verter**: 439.3 ms, 435.3 ms, 435.2 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 74.7 MB | 290.2 MB | **365.0 MB** |
| Volar (JS) | 291.8 MB | 310.7 MB | **602.5 MB** |
| Verter | 42.6 MB | 570.0 MB | **612.6 MB** |
| Volar (N) | 303.2 MB | 401.6 MB | **704.8 MB** |

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
| Verter | **0.4 ms** | 1.00x | **0.3 ms** | 0.2 ms | 0.0 ms | 19.0% ⚠ | 1.03x | 1 | n/a |
| Vize | **56.2 ms** | 147.77x | **0.3 ms** | 0.2 ms | 0.0 ms | 12.0% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **318.4 ms** | 836.67x | **14.7 ms** | 13.2 ms | 1.5 ms | 10.4% ⚠ | 55.42x | 1 | n/a |
| Volar (JS) | **843.5 ms** | 2216.53x | **130.7 ms** | 130.4 ms | 2.4 ms | 1.8% | 493.80x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.3 ms, 0.2 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.2 ms
- **Volar (N)**: 16.3 ms, 13.2 ms, 14.7 ms
- **Volar (JS)**: 130.4 ms, 130.7 ms, 134.7 ms

</details>

#### Definition: imported fn (script)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-definition-imported-fn-script-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Definition: imported fn (script)" src="charts/lsp-ide-ide-navigation-definition-imported-fn-script.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.0 ms | 9.0% | 1.00x | 1 | n/a |
| Vize | **238.4 ms** | 557.44x | **4.0 ms** | 3.9 ms | 0.1 ms | 3.0% | 16.33x | 1 | n/a |
| Volar (N) | **316.7 ms** | 740.44x | **14.6 ms** | 13.1 ms | 8.6 ms | 45.7% ⚠ | 59.83x | 1 | n/a |
| Volar (JS) | **853.8 ms** | 1996.17x | **129.8 ms** | 127.9 ms | 8.0 ms | 6.0% | 532.55x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.2 ms, 0.2 ms, 0.3 ms
- **Vize**: 4.2 ms, 3.9 ms, 4.0 ms
- **Volar (N)**: 28.7 ms, 13.1 ms, 14.6 ms
- **Volar (JS)**: 142.6 ms, 129.8 ms, 127.9 ms

</details>

#### Type definition: typed binding

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-type-definition-typed-binding-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Type definition: typed binding" src="charts/lsp-ide-ide-navigation-type-definition-typed-binding.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **5.8 ms** | 5.1 ms | 0.4 ms | 7.6% | 1.00x | 1 | n/a |
| Volar (N) | **13.3 ms** | 10.2 ms | 2.0 ms | 16.0% ⚠ | 2.31x | 1 | n/a |
| Vize | **180.8 ms** | 180.7 ms | 0.9 ms | 0.5% | 31.43x | 1 | n/a |
| Verter | **216.1 ms** | 210.9 ms | 10.1 ms | 4.6% | 37.56x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 5.8 ms, 5.9 ms, 5.1 ms
- **Volar (N)**: 14.0 ms, 10.2 ms, 13.3 ms
- **Vize**: 182.4 ms, 180.8 ms, 180.7 ms
- **Verter**: 230.5 ms, 210.9 ms, 216.1 ms

</details>

#### References: prop -> parent template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-references-prop-parent-template-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — References: prop -> parent template" src="charts/lsp-ide-ide-navigation-references-prop-parent-template.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **81.8 ms** | 74.4 ms | 10.0 ms | 12.0% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **115.9 ms** | 114.7 ms | 1.3 ms | 1.1% | 1.42x | 4 | n/a |
| Vize ⚠ | (2.3 ms) | (2.1 ms) | – | – | not ranked | (5) | – |
| Verter ⚠ | (93.6 ms) | (82.9 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue symbol ranges — found files childcard.vue | Sample: "childcard.vue@2:11 childcard.vue@11:2 childcard.vue@15:38 childcard.vue@16:3 childcard.vue@17:26" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue symbol ranges — found files childcard.vue | Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 81.8 ms, 94.2 ms, 74.4 ms
- **Volar (JS)**: 115.9 ms, 117.3 ms, 114.7 ms
- **Vize**: 2.8 ms, 2.3 ms, 2.1 ms
- **Verter**: 82.9 ms, 98.2 ms, 93.6 ms

</details>

#### Prepare rename: prop

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-prepare-rename-prop-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Prepare rename: prop" src="charts/lsp-ide-ide-navigation-prepare-rename-prop.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **3.4 ms** | 3.3 ms | 0.0 ms | 1.4% | 1.00x | n/a | n/a |
| Volar (JS) | **4.4 ms** | 4.3 ms | 0.3 ms | 7.1% | 1.31x | n/a | n/a |
| Volar (N) | **5.7 ms** | 3.6 ms | 2.8 ms | 46.0% ⚠ | 1.68x | n/a | n/a |
| Verter ⚠ | (0.9 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 3.4 ms, 3.3 ms, 3.4 ms
- **Volar (JS)**: 4.9 ms, 4.4 ms, 4.3 ms
- **Volar (N)**: 3.6 ms, 9.2 ms, 5.7 ms
- **Verter**: 2.6 ms, 0.3 ms, 0.9 ms

</details>

#### Rename prop (cross-file edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Rename prop (cross-file edit)" src="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **2.8 ms** | 2.2 ms | 0.5 ms | 19.3% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **2.9 ms** | 2.8 ms | 0.9 ms | 26.9% ⚠ | 1.02x | 4 | n/a |
| Vize ⚠ | (73.3 ms) | (60.3 ms) | – | – | not ranked | (3) | – |
| Verter ⚠ | (1.2 ms) | (1.0 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: applied edits changed unrelated SFC semantics or failed to perform the intended edit | Sample: "childcard.vue:2, parent.vue:1 :: applied rename of captionText to renamedCaption; declaration, uses and decoys checked" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: must edit both Parent.vue and ChildCard.vue | Sample: "childcard.vue:3 :: applied rename of captionText to renamedCaption; declaration, uses and decoys checked" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 2.2 ms, 3.3 ms, 2.8 ms
- **Volar (JS)**: 4.4 ms, 2.8 ms, 2.9 ms
- **Vize**: 60.3 ms, 74.2 ms, 73.3 ms
- **Verter**: 1.2 ms, 1.0 ms, 2.1 ms

</details>

#### Code action at diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-code-action-at-diagnostic-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Code action at diagnostic" src="charts/lsp-ide-ide-navigation-code-action-at-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **26.3 ms** | 26.2 ms | 0.9 ms | 3.5% | 1.00x | 2 | n/a |
| Volar (N) | **583.2 ms** | 578.0 ms | 4.1 ms | 0.7% | 22.18x | 2 | n/a |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 26.2 ms, 26.3 ms, 27.9 ms
- **Volar (N)**: 578.0 ms, 583.2 ms, 586.1 ms
- **Vize**: 0.4 ms, 0.4 ms, 0.4 ms
- **Verter**: 0.5 ms, 0.5 ms, 0.9 ms

</details>

#### Signature help after `(`

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-signature-help-after-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Signature help after `(`" src="charts/lsp-ide-ide-navigation-signature-help-after.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **15.8 ms** | 15.5 ms | 0.3 ms | 1.7% | 1.00x | 1 | n/a |
| Volar (N) | **22.6 ms** | 21.2 ms | 0.9 ms | 3.9% | 1.43x | 1 | n/a |
| Vize | **171.1 ms** | 163.9 ms | 6.4 ms | 3.8% | 10.84x | 1 | n/a |
| Verter ⚠ | (4.3 ms) | (4.1 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 15.5 ms, 16.0 ms, 15.8 ms
- **Volar (N)**: 21.2 ms, 22.6 ms, 22.8 ms
- **Vize**: 171.1 ms, 176.7 ms, 163.9 ms
- **Verter**: 4.6 ms, 4.1 ms, 4.3 ms

</details>

#### Format unformatted SFC

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-format-unformatted-sfc-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Format unformatted SFC" src="charts/lsp-ide-ide-navigation-format-unformatted-sfc.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 0.3 ms | 0.0 ms | 1.5% | 1.00x | 1 | n/a |
| Volar (N) | **49.5 ms** | 47.1 ms | 1.9 ms | 3.9% | 174.91x | 1 | n/a |
| Volar (JS) | **49.7 ms** | 49.4 ms | 0.8 ms | 1.7% | 175.50x | 1 | n/a |
| Verter ⚠ | (0.3 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Volar (N)**: 47.1 ms, 49.5 ms, 50.9 ms
- **Volar (JS)**: 49.4 ms, 51.0 ms, 49.7 ms
- **Verter**: 0.3 ms, 0.2 ms, 0.7 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 125.3 MB | 127.1 MB | **252.4 MB** |
| Vize | 77.7 MB | 285.8 MB | **363.5 MB** |
| Volar (JS) | 294.2 MB | 254.9 MB | **549.1 MB** |
| Volar (N) | 305.3 MB | 477.6 MB | **782.8 MB** |

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
| Verter | **194.2 ms** | 1.00x | **0.8 ms** | 0.7 ms | 0.0 ms | 5.6% | 1.00x | 89 | n/a |
| Vize | **212.1 ms** | 1.09x | **2.1 ms** | 2.1 ms | 0.1 ms | 6.7% | 2.72x | 89 | n/a |
| Volar (JS) | **841.2 ms** | 4.33x | **130.7 ms** | 130.3 ms | 0.3 ms | 0.2% | 169.58x | 90 | n/a |
| Volar (N) ⚠ | (341.9 ms) | not ranked | (17.0 ms) | (3.2 ms) | – | – | not ranked | (90) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: content verified | engine: tsgo ? via TNB ? | ⚠ TOO NOISY TO RANK — CV 65.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.8 ms, 0.8 ms, 0.7 ms
- **Vize**: 2.1 ms, 2.3 ms, 2.1 ms
- **Volar (JS)**: 130.3 ms, 130.8 ms, 130.7 ms
- **Volar (N)**: 3.2 ms, 17.0 ms, 18.1 ms

</details>

#### Hover (template interpolation)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-smoke-hover-template-interpolation-dark.svg">
  <img alt="IDE · Smoke (reference suite) — Hover (template interpolation)" src="charts/lsp-ide-ide-smoke-hover-template-interpolation.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **211.4 ms** | 1.00x | **1.9 ms** | 1.9 ms | 0.0 ms | 2.4% | 1.00x | 38 | n/a |
| Volar (N) | **338.7 ms** | 1.60x | **21.3 ms** | 17.9 ms | 2.4 ms | 11.6% ⚠ | 11.18x | 43 | n/a |
| Volar (JS) ⚠ | (893.4 ms) | not ranked | (5.6 ms) | (5.5 ms) | – | – | not ranked | (43) | – |
| Verter ⚠ | (180.2 ms) | not ranked | (0.7 ms) | (0.7 ms) | – | – | not ranked | (74) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 150.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 107.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.9 ms, 2.0 ms, 1.9 ms
- **Volar (N)**: 17.9 ms, 22.5 ms, 21.3 ms
- **Volar (JS)**: 5.5 ms, 5.6 ms, 112.4 ms
- **Verter**: 4.0 ms, 0.7 ms, 0.7 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 82.8 MB | 94.2 MB | **177.0 MB** |
| Vize | 73.7 MB | 179.1 MB | **252.8 MB** |
| Volar (JS) | 276.8 MB | 247.7 MB | **524.5 MB** |
| Volar (N) | 287.8 MB | 323.8 MB | **611.6 MB** |

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
| Vize | **147.3 ms** | 147.3 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (JS) | **417.8 ms** | 417.8 ms | n/a | n/a | 2.84x | n/a | n/a |
| Volar (N) | **449.8 ms** | 449.8 ms | n/a | n/a | 3.05x | n/a | n/a |
| Verter | **521.8 ms** | 521.8 ms | n/a | n/a | 3.54x | n/a | n/a |

<details><summary>Notes</summary>

- **Vize**: all components verified · edit → diagnostic=79ms · hover after edit=68ms · completion=0ms
- **Volar (JS)**: all components verified · edit → diagnostic=354ms · hover after edit=42ms · completion=21ms
- **Volar (N)**: all components verified · edit → diagnostic=418ms · hover after edit=14ms · completion=18ms
- **Verter**: all components verified · edit → diagnostic=448ms · hover after edit=72ms · completion=1ms

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
| **Time-to-usable** | Vize LSP (Node shim) | 247 ms | 240 ms | 245 ms | ×1.03 | 63.7 MB |
|  | Verter LSP (npm 0.0.1-beta.3) | 209 ms | 341 ms | 554 ms | ×2.65 | 27.9 MB |
|  | Volar (TNB / tsgo tsdk) | 788 ms | 924 ms | 1.48 s | ×1.88 | 269.4 + 138.7 = 408.0 MB |
|  | Volar (@vue/language-server) | 1.26 s | 1.41 s | 2.17 s | ×1.72 | 255.0 + 78.3 = 333.2 MB |
| **Completion** | Vize LSP (Node shim) | 0.4 ms | 0.4 ms | 0.4 ms | ×0.95 | 63.7 MB |
|  | Verter LSP (npm 0.0.1-beta.3) | 123 ms | 136 ms | 163 ms | ×1.15 | 27.9 MB |
|  | Volar (TNB / tsgo tsdk) | 125 ms | 140 ms | 179 ms | ×1.41 | 269.4 + 138.7 = 408.0 MB |
|  | Volar (@vue/language-server) | 140 ms | 127 ms | 215 ms | ×2.1 | 255.0 + 78.3 = 333.2 MB |
| **References** | Volar (TNB / tsgo tsdk) | 95.2 ms | 479 ms | 8.28 s | ×85.07 | 269.4 + 138.7 = 408.0 MB |
|  | Volar (@vue/language-server) | 211 ms | 731 ms | 10.1 s | ×44.73 | 255.0 + 78.3 = 333.2 MB |
|  | Vize LSP (Node shim) | (0.2 ms) ⚠ | (0.2 ms) ⚠ | (0.2 ms) ⚠ | – | 63.7 MB |
|  | Verter LSP (npm 0.0.1-beta.3) | (96.7 ms) ⚠ | (85.9 ms) ⚠ | (46.5 ms) ⚠ | – | 27.9 MB |
| **Hover warm** | Verter LSP (npm 0.0.1-beta.3) | 0.8 ms | 0.6 ms | 0.7 ms | ×0.51 | 27.9 MB |
|  | Volar (@vue/language-server) | 1.4 ms | 1.9 ms | 1.2 ms | ×0.84 | 255.0 + 78.3 = 333.2 MB |
|  | Volar (TNB / tsgo tsdk) | 1.1 ms | 1.4 ms | 2.7 ms | ×2.47 | 269.4 + 138.7 = 408.0 MB |
|  | Vize LSP (Node shim) | 2.6 ms | 2.2 ms | 3.0 ms | ×1.09 | 63.7 MB |

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

pass **21** · fail **6** · warn **0** · skip **0**

| Case | volar | vize | verter |
| --- | :---: | :---: | :---: |
| `completion-prop-template` | ✓ | ✓ | ✓ |
| `definition-component` | ✓ | ✓ | ✓ |
| `definition-prop-attr` | ✓ | ✓ | ✓ |
| `diagnostics-clear-after-fix` | ✓ | **✗** | ✓ |
| `diagnostics-template` | ✓ | **✗** | ✓ |
| `document-symbol-structure` | ✓ | **✗** | ✓ |
| `hover-template-binding` | ✓ | ✓ | ✓ |
| `references-prop-template` | ✓ | **✗** | **✗** |
| `rename-prop-template` | ✓ | ✓ | **✗** |

<details><summary>Failure detail</summary>

- `document-symbol-structure` · **vize** — documentSymbol never names greeting — saw: template, script setup
- `references-prop-template` · **vize** — references missing App.vue symbol ranges — found files child.vue
- `diagnostics-template` · **vize** — no diagnostic mentioning plantedBadProp within 20000ms — no diagnostics published
- `diagnostics-clear-after-fix` · **vize** — cannot confirm clear: planted plantedBadProp never appeared
- `references-prop-template` · **verter** — references missing App.vue symbol ranges — found files child.vue
- `rename-prop-template` · **verter** — BROKEN REFACTOR: must edit both App.vue and Child.vue

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 100.60 / 217.00 / 100.60 | 1.14 / 2.69 / 1.66 | 50 | 14.6 | 584 | 3 |
| LSP vize (server process, Node shim) | 182.50 / 266.39 / 182.50 | 0.87 / 1.85 / 1.29 | 80 | 13.7 | 501 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) | 394.95 / 535.14 / 394.95 | 0.96 / 2.68 / 1.74 | 790 | 11.1 | 1954 | 3 |

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
| vue | 3.5.42 |
| vue-36 | 3.6.0-rc.8 |
| @vue/compiler-sfc | 3.5.42 |
| @vue/compiler-sfc-36 | 3.6.0-rc.8 |
| vize | 0.421.0 |
| @vizejs/native | 0.421.0 |
| @verter/native | 0.0.1-beta.3 |
| @fervid/napi | 0.4.1 |
| verter-tsc | 0.0.1-beta.3 |
| @verter/component-meta | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| verter-mcp | 0.0.1-beta.3 |
| @vue/language-server | 3.3.11 |
| @vue/typescript-plugin | 3.3.11 |
| typescript-language-server | 6.0.0 |
| vue-tsc | 3.3.11 |
| vue-component-meta | 3.3.11 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.6 |
| oxfmt | 0.67.0 |
| oxlint | 1.82.0 |
| eslint-plugin-vue | 10.11.0 |
| @biomejs/biome | 2.5.13 |
| typescript | 6.0.3 |
| cli:vize | 0.421.0 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.67.0 |
| cli:oxlint | 1.82.0 |
| cli:biome | 2.5.13 |
| vue-jsx-vapor | 3.2.23 |
| @vue-jsx-vapor/compiler-rs | 3.2.23 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.5 |

</details>
