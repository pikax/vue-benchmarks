# LSP and IDE operations

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-08-27T10:24:48.274Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz · 15.6 GB · Node v22.23.2
- **Commit:** [`abafafd`](https://github.com/pikax/vue-benchmarks/commit/abafafd07c14f26c07f1d0ed9da818102fdc97e1)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/33062210774
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
| Verter | **311.1 ms** | 300.0 ms | 8.6 ms | 2.8% | 1.00x | 113 | 3 files/s | 105.6 + 118.9 = 224.5 MB |
| Vize | **343.4 ms** | 333.1 ms | 76.7 ms | 22.3% ⚠ | 1.10x | 113 | 3 files/s | 72.9 + 183.7 = 256.6 MB |
| Volar (N) | **380.0 ms** | 370.4 ms | 7.7 ms | 2.0% | 1.22x | 114 | 3 files/s | – |
| Volar (JS) | **1.09 s** | 1.08 s | 11.0 ms | 1.0% | 3.49x | 114 | 1 files/s | 292.8 + 265.5 = 558.3 MB |

<details><summary>Notes</summary>

- **Verter**: verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | init=4ms · ready=23ms · open→hover=300ms · hoverCold=1ms · hoverWarm=1ms · completion=1ms · definition=1ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.2/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. | engine: tsgo (bundled) | init=35ms · ready=n/a · open→hover=355ms · hoverCold=4ms · hoverWarm=3ms · completion=8ms · definition=3ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (N)**: Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.15.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.15.tsgo.7.0.2 | init=503ms · ready=n/a · open→hover=380ms · hoverCold=21ms · hoverWarm=2ms · completion=5ms · definition=8ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (JS)**: Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. | engine: TypeScript 6.0.3 (JS) | init=503ms · ready=n/a · open→hover=1086ms · hoverCold=43ms · hoverWarm=3ms · completion=29ms · definition=4ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)

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

- **Verter**: 312.7 ms, 300.8 ms, 311.1 ms, 320.5 ms, 300.0 ms
- **Vize**: 333.1 ms, 343.4 ms, 336.5 ms, 512.4 ms, 354.6 ms
- **Volar (N)**: 381.4 ms, 370.4 ms, 380.0 ms, 392.2 ms, 380.0 ms
- **Volar (JS)**: 1.11 s, 1.08 s, 1.09 s, 1.08 s, 1.09 s

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
| Verter | **5.2 ms** | 4.6 ms | 1.1 ms | 20.3% ⚠ | 1.00x | n/a | n/a |
| Vize | **34.7 ms** | 33.2 ms | 1.2 ms | 3.3% | 6.72x | n/a | n/a |
| Volar (N) | **520.2 ms** | 515.2 ms | 5.0 ms | 1.0% | 100.71x | n/a | n/a |
| Volar (JS) | **524.0 ms** | 516.1 ms | 7.2 ms | 1.4% | 101.44x | n/a | n/a |

<details><summary>Notes</summary>

- **Verter**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? (none)
- **Vize**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo (bundled)
- **Volar (N)**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? via TNB ?
- **Volar (JS)**: LSP initialize handshake after spawn (not first-request latency) | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 5.9 ms, 4.9 ms, 5.1 ms, 4.7 ms, 4.9 ms, 4.7 ms, 4.6 ms, 4.8 ms, 4.6 ms, 4.9 ms, 5.2 ms, 4.6 ms, 5.9 ms, 5.4 ms, 5.6 ms, 6.9 ms, 7.2 ms, 8.4 ms, 7.3 ms, 7.4 ms, 5.3 ms
- **Vize**: 33.3 ms, 36.7 ms, 34.8 ms, 36.5 ms, 33.4 ms, 34.5 ms, 35.8 ms, 35.3 ms, 35.1 ms, 34.7 ms, 35.0 ms, 34.1 ms, 33.2 ms, 34.7 ms, 35.3 ms, 33.5 ms, 35.2 ms, 37.2 ms, 33.6 ms, 34.4 ms, 33.4 ms
- **Volar (N)**: 528.3 ms, 519.5 ms, 523.8 ms, 525.5 ms, 518.2 ms, 518.9 ms, 521.9 ms, 519.4 ms, 522.9 ms, 535.0 ms, 527.4 ms, 521.8 ms, 518.8 ms, 529.3 ms, 520.2 ms, 520.1 ms, 516.6 ms, 524.4 ms, 515.7 ms, 515.2 ms, 517.5 ms
- **Volar (JS)**: 538.7 ms, 545.0 ms, 523.8 ms, 519.3 ms, 520.8 ms, 522.6 ms, 517.9 ms, 523.3 ms, 518.3 ms, 526.7 ms, 524.6 ms, 535.0 ms, 522.5 ms, 526.0 ms, 532.6 ms, 525.1 ms, 525.4 ms, 524.0 ms, 524.7 ms, 516.1 ms, 517.8 ms

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
| Vize | **0.5 ms** | 0.5 ms | 0.0 ms | 4.4% | 1.00x | 15 | n/a |
| Volar (N) | **137.3 ms** | 136.7 ms | 0.6 ms | 0.5% | 275.51x | 48 | n/a |
| Volar (JS) | **762.4 ms** | 760.3 ms | 65.0 ms | 8.1% | 1530.10x | 48 | n/a |
| Verter ⚠ | (31.3 ms) | (28.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no tokens at all for this document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.5 ms, 0.5 ms
- **Volar (N)**: 136.7 ms, 138.0 ms, 137.3 ms
- **Volar (JS)**: 874.0 ms, 762.4 ms, 760.3 ms
- **Verter**: 33.2 ms, 28.2 ms, 31.3 ms

</details>

#### Semantic tokens (delta after edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit-dark.svg">
  <img alt="IDE · Background (editor chatter) — Semantic tokens (delta after edit)" src="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (0.8 ms) | (0.7 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (0.7 ms) | (0.7 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (38.5 ms) | (33.8 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1787825766504", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1787825775035", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 0.8 ms, 0.7 ms, 0.9 ms
- **Volar (N)**: 0.7 ms, 0.7 ms, 0.9 ms
- **Vize**: 33.8 ms, 38.5 ms, 43.5 ms
- **Verter**: 0.4 ms, 0.5 ms, 0.4 ms

</details>

#### Document symbols (outline)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-symbols-outline-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document symbols (outline)" src="charts/lsp-ide-ide-background-document-symbols-outline.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 0.4 ms | 0.1 ms | 20.8% ⚠ | 1.00x | 12 | n/a |
| Volar (JS) | **18.6 ms** | 18.3 ms | 3.8 ms | 18.3% ⚠ | 43.83x | 25 | n/a |
| Volar (N) | **21.1 ms** | 20.9 ms | 3.0 ms | 13.1% ⚠ | 49.83x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (2) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — outline is missing 7/7 script symbols: heading, nextLabel, threshold, entries, visibleEntries, formatEntry, addEntry | Sample: "2 symbols: template, script setup" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.4 ms, 0.6 ms, 0.4 ms
- **Volar (JS)**: 18.6 ms, 24.9 ms, 18.3 ms
- **Volar (N)**: 26.2 ms, 20.9 ms, 21.1 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Document highlight (caret move)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-highlight-caret-move-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document highlight (caret move)" src="charts/lsp-ide-ide-background-document-highlight-caret-move.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 5.3% | 1.00x | 4 | n/a |
| Verter | **0.3 ms** | 0.3 ms | 0.0 ms | 7.9% | 1.38x | 4 | n/a |
| Volar (JS) | **17.9 ms** | 17.4 ms | 0.5 ms | 2.8% | 77.27x | 5 | n/a |
| Volar (N) | **33.1 ms** | 30.5 ms | 2.4 ms | 7.3% | 142.69x | 5 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms
- **Volar (JS)**: 18.4 ms, 17.9 ms, 17.4 ms
- **Volar (N)**: 35.3 ms, 33.1 ms, 30.5 ms

</details>

#### Inlay hints (document range)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-inlay-hints-document-range-dark.svg">
  <img alt="IDE · Background (editor chatter) — Inlay hints (document range)" src="charts/lsp-ide-ide-background-inlay-hints-document-range.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 8.6% | 1.00x | 2 | n/a |
| Volar (JS) | **74.6 ms** | 73.4 ms | 1.8 ms | 2.3% | 173.38x | 14 | n/a |
| Volar (N) | **229.6 ms** | 225.5 ms | 6.3 ms | 2.7% | 533.90x | 14 | n/a |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.5 ms, 0.4 ms
- **Volar (JS)**: 73.4 ms, 76.9 ms, 74.6 ms
- **Volar (N)**: 237.9 ms, 229.6 ms, 225.5 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Folding ranges

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-folding-ranges-dark.svg">
  <img alt="IDE · Background (editor chatter) — Folding ranges" src="charts/lsp-ide-ide-background-folding-ranges.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 1.9% | 1.00x | 9 | n/a |
| Verter | **0.3 ms** | 0.3 ms | 0.0 ms | 8.3% | 1.31x | 7 | n/a |
| Volar (JS) ⚠ | (11.4 ms) | (10.4 ms) | – | – | not ranked | (13) | – |
| Volar (N) ⚠ | (8.8 ms) | (6.6 ms) | – | – | not ranked | (13) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 133.6% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Volar (N) ⚠**: content verified | engine: tsgo ? via TNB ? | ⚠ TOO NOISY TO RANK — CV 67.5% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.4 ms
- **Volar (JS)**: 11.4 ms, 120.7 ms, 10.4 ms
- **Volar (N)**: 22.3 ms, 8.8 ms, 6.6 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 72.6 MB | 165.8 MB | **238.4 MB** |
| Verter | 132.7 MB | 107.8 MB | **240.5 MB** |
| Volar (JS) | 283.2 MB | 254.3 MB | **537.5 MB** |
| Volar (N) | 293.9 MB | 386.4 MB | **680.3 MB** |

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
| Vize | **0.4 ms** | 1.00x | **0.3 ms** | 0.3 ms | 0.0 ms | 12.8% ⚠ | 1.00x | 3 | n/a |
| Verter | **340.2 ms** | 804.36x | **31.6 ms** | 26.4 ms | 8.0 ms | 24.1% ⚠ | 98.21x | 3 | n/a |
| Volar (N) | **399.7 ms** | 944.94x | **25.1 ms** | 22.5 ms | 5.6 ms | 20.8% ⚠ | 78.01x | 3 | n/a |
| Volar (JS) | **1.10 s** | 2597.62x | **24.8 ms** | 24.2 ms | 1.5 ms | 5.8% | 76.89x | 3 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Verter**: 26.4 ms, 42.2 ms, 31.6 ms
- **Volar (N)**: 25.1 ms, 22.5 ms, 33.2 ms
- **Volar (JS)**: 24.2 ms, 24.8 ms, 27.0 ms

</details>

#### Completion: component tag &lt;Ch

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-component-tag-ch-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: component tag &lt;Ch" src="charts/lsp-ide-ide-completion-completion-component-tag-ch.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **125.4 ms** | 1.00x | **34.2 ms** | 33.5 ms | 0.5 ms | 1.5% | 1.10x | 192 | n/a |
| Volar (N) | **134.7 ms** | 1.07x | **36.8 ms** | 36.2 ms | 0.4 ms | 1.2% | 1.19x | 192 | n/a |
| Verter | **184.6 ms** | 1.47x | **31.0 ms** | 22.9 ms | 6.7 ms | 22.4% ⚠ | 1.00x | 1,193 | n/a |
| Vize ⚠ | (69.7 ms) | not ranked | (0.6 ms) | (0.5 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `ChildCard` component tag in 42 items | Sample: "[v-if, v-else-if, v-else, v-for, v-on, v-bind, v-model, v-slot, v-show, v-pre, v-once, v-memo, …+30]" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 33.5 ms, 34.2 ms, 34.6 ms
- **Volar (N)**: 36.2 ms, 36.8 ms, 37.0 ms
- **Verter**: 31.0 ms, 36.3 ms, 22.9 ms
- **Vize**: 0.6 ms, 0.6 ms, 0.5 ms

</details>

#### Completion: prop name &lt;C :

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-prop-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: prop name &lt;C :" src="charts/lsp-ide-ide-completion-completion-prop-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 1.00x | **0.3 ms** | 0.3 ms | 0.0 ms | 5.5% | 1.00x | 4 | n/a |
| Verter | **1.5 ms** | 4.09x | **1.1 ms** | 1.0 ms | 0.0 ms | 4.0% | 3.54x | 16 | n/a |
| Volar (N) | **33.8 ms** | 94.61x | **7.3 ms** | 6.9 ms | 0.4 ms | 5.0% | 23.73x | 26 | n/a |
| Volar (JS) | **195.2 ms** | 547.17x | **160.4 ms** | 156.7 ms | 6.1 ms | 3.7% | 521.50x | 26 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Verter**: 1.0 ms, 1.1 ms, 1.1 ms
- **Volar (N)**: 7.6 ms, 7.3 ms, 6.9 ms
- **Volar (JS)**: 156.7 ms, 168.6 ms, 160.4 ms

</details>

#### Completion: event name &lt;C @

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-event-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: event name &lt;C @" src="charts/lsp-ide-ide-completion-completion-event-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **6.9 ms** | 1.00x | **6.4 ms** | 6.1 ms | 0.3 ms | 5.3% | 1.03x | 25 | n/a |
| Volar (JS) | **11.4 ms** | 1.66x | **6.3 ms** | 6.2 ms | 0.6 ms | 9.1% | 1.00x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (12) | – |
| Verter ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 12 items | Sample: "[v-on, @, @click, @input, @change, @submit, @keydown, @keyup, @focus, @blur, @mouseenter, @mouseleave]" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 6.1 ms, 6.8 ms, 6.4 ms
- **Volar (JS)**: 6.3 ms, 7.3 ms, 6.2 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Completion: directive v-

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-directive-v-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: directive v-" src="charts/lsp-ide-ide-completion-completion-directive-v.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 1.00x | **0.4 ms** | 0.3 ms | 0.0 ms | 8.1% | 1.00x | 15 | n/a |
| Volar (N) | **28.5 ms** | 84.19x | **12.2 ms** | 11.9 ms | 0.5 ms | 4.4% | 34.46x | 498 | n/a |
| Volar (JS) | **32.6 ms** | 96.56x | **44.8 ms** | 26.3 ms | 11.3 ms | 28.7% ⚠ | 126.88x | 498 | n/a |
| Verter ⚠ | (0.3 ms) | not ranked | (0.3 ms) | (0.3 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `v-if` directive in 3 items | Sample: "[style scoped, style, i18n]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.4 ms, 0.4 ms
- **Volar (N)**: 11.9 ms, 12.9 ms, 12.2 ms
- **Volar (JS)**: 46.6 ms, 44.8 ms, 26.3 ms
- **Verter**: 0.3 ms, 0.4 ms, 0.3 ms

</details>

#### Completion: slot name &lt;template #

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-slot-name-template-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: slot name &lt;template #" src="charts/lsp-ide-ide-completion-completion-slot-name-template.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 1.00x | **0.3 ms** | 0.2 ms | 0.0 ms | 6.3% | 1.00x | 2 | n/a |
| Vize | **0.5 ms** | 1.62x | **0.5 ms** | 0.5 ms | 0.0 ms | 3.3% | 1.77x | 30 | n/a |
| Volar (N) | **15.5 ms** | 47.41x | **20.4 ms** | 15.7 ms | 2.8 ms | 14.7% ⚠ | 76.12x | 500 | n/a |
| Volar (JS) | **137.5 ms** | 421.78x | **16.9 ms** | 13.7 ms | 2.9 ms | 17.1% ⚠ | 63.00x | 500 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.3 ms, 0.2 ms
- **Vize**: 0.5 ms, 0.5 ms, 0.5 ms
- **Volar (N)**: 20.6 ms, 15.7 ms, 20.4 ms
- **Volar (JS)**: 19.4 ms, 16.9 ms, 13.7 ms

</details>

#### Completion: auto-import

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-auto-import-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: auto-import" src="charts/lsp-ide-ide-completion-completion-auto-import.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **38.6 ms** | 38.3 ms | 14.5 ms | 31.0% ⚠ | 1.00x | 1,073 | n/a |
| Volar (JS) | **39.4 ms** | 36.4 ms | 2.0 ms | 5.3% | 1.02x | 1,073 | n/a |
| Vize ⚠ | (249.5 ms) | (247.2 ms) | – | – | not ranked | (1,103) | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import | Sample: "offered: \"getComputedStyle\" kind=3 ; \"computed\" kind=6 ; \"computed\" kind=3 detail=\"function computed&lt;T>(getter: () => T): ComputedRef&lt;T>\"" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 38.3 ms, 63.6 ms, 38.6 ms
- **Volar (JS)**: 40.3 ms, 39.4 ms, 36.4 ms
- **Vize**: 247.2 ms, 257.6 ms, 249.5 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Resolve: auto-import edit

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-auto-import-edit-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: auto-import edit" src="charts/lsp-ide-ide-completion-resolve-auto-import-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **49.3 ms** | 48.8 ms | 20.3 ms | 33.4% ⚠ | 1.00x | 241 | n/a |
| Volar (N) | **55.5 ms** | 54.5 ms | 12.6 ms | 20.3% ⚠ | 1.12x | 241 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` | Sample: "\"computed\" kind=6" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 49.3 ms, 48.8 ms, 84.2 ms
- **Volar (N)**: 76.9 ms, 55.5 ms, 54.5 ms
- **Vize**: 0.3 ms, 1.1 ms, 0.3 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-script-member-detail-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: script member detail" src="charts/lsp-ide-ide-completion-resolve-script-member-detail.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 3.8% | 1.00x | 75 | n/a |
| Volar (JS) | **4.2 ms** | 4.1 ms | 0.1 ms | 1.9% | 23.00x | 25 | n/a |
| Verter | **4.5 ms** | 4.2 ms | 0.7 ms | 13.9% ⚠ | 24.73x | 25 | n/a |
| Volar (N) | **9.0 ms** | 8.3 ms | 0.5 ms | 5.7% | 49.61x | 25 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Volar (JS)**: 4.3 ms, 4.2 ms, 4.1 ms
- **Verter**: 4.5 ms, 5.5 ms, 4.2 ms
- **Volar (N)**: 8.3 ms, 9.0 ms, 9.3 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 76.5 MB | 226.3 MB | **302.8 MB** |
| Verter | 133.5 MB | 176.7 MB | **310.2 MB** |
| Volar (JS) | 297.3 MB | 288.2 MB | **585.6 MB** |
| Volar (N) | 309.5 MB | 396.1 MB | **705.6 MB** |

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

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 1.15 s, min 1.14 s, CV 0.8%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 466.5 ms, min 462.6 ms, CV 1.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? via TNB ?
- **Vize**: content verified | NOT RANKED (informational) — measured 1.25 s, min 1.24 s, CV 0.3%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo (bundled)
- **Verter**: content verified | NOT RANKED (informational) — measured 312.5 ms, min 312.2 ms, CV 0.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.16 s, 1.14 s, 1.15 s
- **Volar (N)**: 472.6 ms, 462.6 ms, 466.5 ms
- **Vize**: 1.25 s, 1.25 s, 1.24 s
- **Verter**: 312.5 ms, 312.6 ms, 312.2 ms

</details>

#### Edit plants type error -> reported

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit plants type error -> reported" src="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **54.3 ms** | 41.9 ms | 15.9 ms | 28.2% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **413.3 ms** | 404.2 ms | 5.8 ms | 1.4% | 7.61x | 1 | n/a |
| Volar (N) | **434.4 ms** | 418.1 ms | 26.1 ms | 5.9% | 8.00x | 1 | n/a |
| Verter | **498.2 ms** | 497.5 ms | 9.8 ms | 2.0% | 9.18x | 1 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 73.5 ms, 41.9 ms, 54.3 ms
- **Volar (JS)**: 404.2 ms, 415.1 ms, 413.3 ms
- **Volar (N)**: 418.1 ms, 434.4 ms, 469.2 ms
- **Verter**: 498.2 ms, 514.9 ms, 497.5 ms

</details>

#### Edit fixes it -> diagnostic clears

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit fixes it -> diagnostic clears" src="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **20.8 ms** | 19.3 ms | 1.0 ms | 4.7% | 1.00x | 0 | n/a |
| Volar (N) | **382.3 ms** | 381.1 ms | 0.7 ms | 0.2% | 18.38x | 0 | n/a |
| Volar (JS) | **463.1 ms** | 455.6 ms | 5.1 ms | 1.1% | 22.27x | 0 | n/a |
| Verter | **698.7 ms** | 656.0 ms | 34.7 ms | 5.0% | 33.60x | 0 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 20.8 ms, 19.3 ms, 21.1 ms
- **Volar (N)**: 382.4 ms, 382.3 ms, 381.1 ms
- **Volar (JS)**: 463.1 ms, 455.6 ms, 465.3 ms
- **Verter**: 698.7 ms, 724.7 ms, 656.0 ms

</details>

#### Hover after retype -> NEW type

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Hover after retype -> NEW type" src="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.4 ms** | 14.9 ms | 0.9 ms | 5.5% | 1.00x | 47 | n/a |
| Vize | **40.3 ms** | 39.7 ms | 7.3 ms | 16.6% ⚠ | 2.45x | 40 | n/a |
| Volar (JS) | **50.6 ms** | 49.3 ms | 1.4 ms | 2.8% | 3.08x | 47 | n/a |
| Verter | **86.3 ms** | 85.1 ms | 2.8 ms | 3.2% | 5.25x | 40 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 16.5 ms, 14.9 ms, 16.4 ms
- **Vize**: 52.7 ms, 39.7 ms, 40.3 ms
- **Volar (JS)**: 52.1 ms, 49.3 ms, 50.6 ms
- **Verter**: 85.1 ms, 90.4 ms, 86.3 ms

</details>

#### ... same hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... same hover, time to correct" src="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **16.4 ms** | 14.9 ms | 0.9 ms | 5.5% | 1.00x | 1 | n/a |
| Vize | **40.3 ms** | 39.7 ms | 7.3 ms | 16.6% ⚠ | 2.45x | 1 | n/a |
| Volar (JS) | **50.6 ms** | 49.3 ms | 1.4 ms | 2.8% | 3.08x | 1 | n/a |
| Verter | **86.3 ms** | 85.1 ms | 2.8 ms | 3.2% | 5.25x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 16.5 ms, 14.9 ms, 16.4 ms
- **Vize**: 52.7 ms, 39.7 ms, 40.3 ms
- **Volar (JS)**: 52.1 ms, 49.3 ms, 50.6 ms
- **Verter**: 85.1 ms, 90.4 ms, 86.3 ms

</details>

#### Steady state: edits 1-5 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 1-5 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **14.7 ms** | 14.3 ms | 0.3 ms | 2.2% | 1.00x | n/a | n/a |
| Vize | **39.1 ms** | 38.7 ms | 0.6 ms | 1.5% | 2.65x | n/a | n/a |
| Volar (JS) | **40.0 ms** | 39.7 ms | 1.2 ms | 3.1% | 2.71x | n/a | n/a |
| Verter | **53.6 ms** | 48.4 ms | 3.1 ms | 6.0% | 3.64x | n/a | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 14.3 ms, 14.7 ms, 14.9 ms
- **Vize**: 39.1 ms, 39.9 ms, 38.7 ms
- **Volar (JS)**: 40.0 ms, 39.7 ms, 42.0 ms
- **Verter**: 48.4 ms, 53.6 ms, 54.1 ms

</details>

#### Steady state: edits 6-10 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 6-10 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **14.5 ms** | 13.8 ms | 0.5 ms | 3.5% | 1.00x | 0 | n/a |
| Volar (JS) | **33.2 ms** | 32.8 ms | 0.3 ms | 0.9% | 2.29x | -7 | n/a |
| Vize | **39.3 ms** | 38.4 ms | 0.5 ms | 1.3% | 2.71x | 0 | n/a |
| Verter | **55.3 ms** | 53.8 ms | 1.2 ms | 2.1% | 3.81x | 8 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 14.5 ms, 13.8 ms, 14.8 ms
- **Volar (JS)**: 33.2 ms, 33.4 ms, 32.8 ms
- **Vize**: 39.3 ms, 39.3 ms, 38.4 ms
- **Verter**: 56.1 ms, 53.8 ms, 55.3 ms

</details>

#### Child prop retype -> Parent diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent diagnostic" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **37.5 ms** | 37.2 ms | 1.1 ms | 2.8% | 1.00x | 1 | n/a |
| Volar (JS) | **377.7 ms** | 376.0 ms | 2.0 ms | 0.5% | 10.07x | 1 | n/a |
| Volar (N) | **382.3 ms** | 382.1 ms | 0.2 ms | 0.0% | 10.19x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 2 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 39.2 ms, 37.5 ms, 37.2 ms
- **Volar (JS)**: 376.0 ms, 379.9 ms, 377.7 ms
- **Volar (N)**: 382.3 ms, 382.4 ms, 382.1 ms
- **Verter**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Child prop retype -> Parent hover

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent hover" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **37.5 ms** | 37.3 ms | 1.0 ms | 2.7% | 1.00x | 239 | n/a |
| Volar (N) | **80.0 ms** | 79.1 ms | 7.2 ms | 8.6% | 2.13x | 42 | n/a |
| Volar (JS) | **107.0 ms** | 102.6 ms | 3.3 ms | 3.1% | 2.85x | 42 | n/a |
| Verter ⚠ | (4.6 ms) | (4.4 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 512ms) | Sample: "```typescript\n(property) label: string\n```" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 39.2 ms, 37.5 ms, 37.3 ms
- **Volar (N)**: 79.1 ms, 80.0 ms, 92.0 ms
- **Volar (JS)**: 102.6 ms, 109.0 ms, 107.0 ms
- **Verter**: 4.6 ms, 4.4 ms, 4.6 ms

</details>

#### ... Parent hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... Parent hover, time to correct" src="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **37.5 ms** | 37.3 ms | 1.0 ms | 2.7% | 1.00x | 1 | n/a |
| Volar (N) | **80.0 ms** | 79.1 ms | 7.2 ms | 8.6% | 2.13x | 1 | n/a |
| Volar (JS) | **107.0 ms** | 102.6 ms | 3.3 ms | 3.1% | 2.85x | 1 | n/a |
| Verter | **511.6 ms** | 495.5 ms | 129.0 ms | 22.3% ⚠ | 13.63x | 3 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 39.2 ms, 37.5 ms, 37.3 ms
- **Volar (N)**: 79.1 ms, 80.0 ms, 92.0 ms
- **Volar (JS)**: 102.6 ms, 109.0 ms, 107.0 ms
- **Verter**: 511.6 ms, 726.5 ms, 495.5 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 73.0 MB | 270.6 MB | **343.6 MB** |
| Volar (JS) | 292.1 MB | 310.1 MB | **602.2 MB** |
| Verter | 40.9 MB | 587.5 MB | **628.4 MB** |
| Volar (N) | 303.4 MB | 423.0 MB | **726.4 MB** |

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
| Verter | **0.5 ms** | 1.00x | **0.4 ms** | 0.4 ms | 0.0 ms | 11.8% ⚠ | 1.53x | 1 | n/a |
| Vize | **69.0 ms** | 132.22x | **0.3 ms** | 0.3 ms | 0.0 ms | 4.4% | 1.00x | 1 | n/a |
| Volar (N) | **426.4 ms** | 816.54x | **16.9 ms** | 16.6 ms | 1.1 ms | 6.4% | 64.68x | 1 | n/a |
| Volar (JS) | **1.11 s** | 2130.74x | **180.5 ms** | 178.9 ms | 1.7 ms | 0.9% | 690.60x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.4 ms, 0.5 ms, 0.4 ms
- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Volar (N)**: 16.9 ms, 18.7 ms, 16.6 ms
- **Volar (JS)**: 178.9 ms, 182.3 ms, 180.5 ms

</details>

#### Definition: imported fn (script)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-definition-imported-fn-script-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Definition: imported fn (script)" src="charts/lsp-ide-ide-navigation-definition-imported-fn-script.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.4 ms** | 1.00x | **0.4 ms** | 0.3 ms | 0.2 ms | 39.0% ⚠ | 1.00x | 1 | n/a |
| Vize | **267.4 ms** | 618.90x | **4.5 ms** | 4.4 ms | 0.1 ms | 1.5% | 10.67x | 1 | n/a |
| Volar (N) | **416.8 ms** | 964.59x | **17.0 ms** | 15.8 ms | 9.1 ms | 41.9% ⚠ | 40.16x | 1 | n/a |
| Volar (JS) | **1.13 s** | 2606.68x | **172.9 ms** | 167.2 ms | 5.5 ms | 3.2% | 407.86x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.6 ms, 0.4 ms
- **Vize**: 4.5 ms, 4.4 ms, 4.5 ms
- **Volar (N)**: 17.0 ms, 15.8 ms, 32.1 ms
- **Volar (JS)**: 172.9 ms, 167.2 ms, 178.3 ms

</details>

#### Type definition: typed binding

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-type-definition-typed-binding-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Type definition: typed binding" src="charts/lsp-ide-ide-navigation-type-definition-typed-binding.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **6.5 ms** | 5.9 ms | 0.7 ms | 11.3% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **18.3 ms** | 17.0 ms | 0.8 ms | 4.7% | 2.83x | 1 | n/a |
| Vize | **188.3 ms** | 187.3 ms | 0.7 ms | 0.4% | 29.01x | 1 | n/a |
| Verter | **290.0 ms** | 283.7 ms | 5.4 ms | 1.9% | 44.70x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 5.9 ms, 7.4 ms, 6.5 ms
- **Volar (N)**: 18.6 ms, 17.0 ms, 18.3 ms
- **Vize**: 188.3 ms, 188.7 ms, 187.3 ms
- **Verter**: 294.4 ms, 283.7 ms, 290.0 ms

</details>

#### References: prop -> parent template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-references-prop-parent-template-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — References: prop -> parent template" src="charts/lsp-ide-ide-navigation-references-prop-parent-template.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **85.1 ms** | 70.7 ms | 8.6 ms | 10.7% ⚠ | 1.00x | 3 | n/a |
| Volar (N) | **114.0 ms** | 82.7 ms | 18.4 ms | 17.7% ⚠ | 1.34x | 4 | n/a |
| Volar (JS) | **139.7 ms** | 131.4 ms | 5.7 ms | 4.1% | 1.64x | 4 | n/a |
| Verter ⚠ | (149.1 ms) | (140.3 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue — only found childcard.vue | Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 86.0 ms, 70.7 ms, 85.1 ms
- **Volar (N)**: 114.0 ms, 82.7 ms, 115.1 ms
- **Volar (JS)**: 131.4 ms, 139.7 ms, 142.2 ms
- **Verter**: 151.1 ms, 149.1 ms, 140.3 ms

</details>

#### Prepare rename: prop

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-prepare-rename-prop-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Prepare rename: prop" src="charts/lsp-ide-ide-navigation-prepare-rename-prop.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **2.2 ms** | 2.2 ms | 0.1 ms | 3.0% | 1.00x | n/a | n/a |
| Volar (N) | **5.0 ms** | 4.8 ms | 0.2 ms | 4.2% | 2.26x | n/a | n/a |
| Volar (JS) | **5.7 ms** | 5.2 ms | 0.4 ms | 7.7% | 2.55x | n/a | n/a |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 2.3 ms, 2.2 ms, 2.2 ms
- **Volar (N)**: 5.3 ms, 4.8 ms, 5.0 ms
- **Volar (JS)**: 5.7 ms, 5.2 ms, 6.0 ms
- **Verter**: 0.4 ms, 0.3 ms, 3.1 ms

</details>

#### Rename prop (cross-file edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Rename prop (cross-file edit)" src="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **3.7 ms** | 3.6 ms | 0.5 ms | 13.1% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **4.0 ms** | 4.0 ms | 0.2 ms | 4.1% | 1.08x | 4 | n/a |
| Vize | **7.5 ms** | 7.3 ms | 0.2 ms | 3.1% | 2.00x | 3 | n/a |
| Verter ⚠ | (1.3 ms) | (1.3 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: edited childcard.vue:3 but produced no edit in Parent.vue — the template usage is left behind | Sample: "childcard.vue:3 :: []" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 3.6 ms, 4.5 ms, 3.7 ms
- **Volar (JS)**: 4.3 ms, 4.0 ms, 4.0 ms
- **Vize**: 7.7 ms, 7.5 ms, 7.3 ms
- **Verter**: 1.3 ms, 1.3 ms, 4.0 ms

</details>

#### Code action at diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-code-action-at-diagnostic-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Code action at diagnostic" src="charts/lsp-ide-ide-navigation-code-action-at-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **36.6 ms** | 34.2 ms | 2.0 ms | 5.4% | 1.00x | 2 | n/a |
| Volar (N) | **751.1 ms** | 749.2 ms | 4.2 ms | 0.6% | 20.54x | 2 | n/a |
| Vize ⚠ | (0.4 ms) | (0.4 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.8 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 34.2 ms, 38.2 ms, 36.6 ms
- **Volar (N)**: 751.1 ms, 757.2 ms, 749.2 ms
- **Vize**: 0.5 ms, 0.4 ms, 0.4 ms
- **Verter**: 0.8 ms, 0.5 ms, 1.1 ms

</details>

#### Signature help after `(`

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-signature-help-after-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Signature help after `(`" src="charts/lsp-ide-ide-navigation-signature-help-after.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **18.3 ms** | 17.8 ms | 0.4 ms | 2.3% | 1.00x | 1 | n/a |
| Volar (N) | **25.1 ms** | 24.6 ms | 0.7 ms | 2.6% | 1.37x | 1 | n/a |
| Vize | **147.9 ms** | 147.8 ms | 2.8 ms | 1.9% | 8.09x | 1 | n/a |
| Verter ⚠ | (5.9 ms) | (4.7 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 18.3 ms, 17.8 ms, 18.7 ms
- **Volar (N)**: 24.6 ms, 25.1 ms, 25.9 ms
- **Vize**: 147.8 ms, 147.9 ms, 152.7 ms
- **Verter**: 7.0 ms, 4.7 ms, 5.9 ms

</details>

#### Format unformatted SFC

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-format-unformatted-sfc-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Format unformatted SFC" src="charts/lsp-ide-ide-navigation-format-unformatted-sfc.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 5.7% | 1.00x | 1 | n/a |
| Volar (JS) | **62.9 ms** | 61.6 ms | 3.2 ms | 5.0% | 145.09x | 1 | n/a |
| Volar (N) | **123.0 ms** | 119.0 ms | 3.0 ms | 2.5% | 283.67x | 1 | n/a |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.5 ms, 0.4 ms
- **Volar (JS)**: 61.6 ms, 62.9 ms, 67.7 ms
- **Volar (N)**: 123.0 ms, 119.0 ms, 125.0 ms
- **Verter**: 0.4 ms, 0.2 ms, 0.2 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 125.1 MB | 133.0 MB | **258.1 MB** |
| Vize | 75.7 MB | 263.5 MB | **339.2 MB** |
| Volar (JS) | 295.2 MB | 253.5 MB | **548.7 MB** |
| Volar (N) | 303.7 MB | 537.4 MB | **841.1 MB** |

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
| Vize | **245.9 ms** | 1.00x | **2.0 ms** | 2.0 ms | 0.0 ms | 1.6% | 1.00x | 89 | n/a |
| Volar (JS) | **1.11 s** | 4.53x | **179.0 ms** | 178.9 ms | 5.2 ms | 2.8% | 91.41x | 90 | n/a |
| Volar (N) ⚠ | (452.2 ms) | not ranked | (16.6 ms) | (5.6 ms) | – | – | not ranked | (90) | – |
| Verter ⚠ | (280.7 ms) | not ranked | (1.0 ms) | (0.8 ms) | – | – | not ranked | (89) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: content verified | engine: tsgo ? via TNB ? | ⚠ TOO NOISY TO RANK — CV 59.6% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 97.1% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 2.0 ms, 2.0 ms, 2.0 ms
- **Volar (JS)**: 178.9 ms, 187.9 ms, 179.0 ms
- **Volar (N)**: 16.6 ms, 23.8 ms, 5.6 ms
- **Verter**: 0.8 ms, 1.0 ms, 4.3 ms

</details>

#### Hover (template interpolation)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-smoke-hover-template-interpolation-dark.svg">
  <img alt="IDE · Smoke (reference suite) — Hover (template interpolation)" src="charts/lsp-ide-ide-smoke-hover-template-interpolation.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **248.8 ms** | 1.00x | **2.1 ms** | 2.0 ms | 0.1 ms | 2.4% | 3.01x | 38 | n/a |
| Verter | **253.5 ms** | 1.02x | **0.7 ms** | 0.7 ms | 0.1 ms | 11.2% ⚠ | 1.00x | 74 | n/a |
| Volar (N) | **458.8 ms** | 1.84x | **21.5 ms** | 20.1 ms | 1.9 ms | 8.6% | 31.06x | 43 | n/a |
| Volar (JS) | **1.18 s** | 4.74x | **152.2 ms** | 151.8 ms | 0.4 ms | 0.3% | 219.33x | 43 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 2.0 ms, 2.1 ms, 2.1 ms
- **Verter**: 0.8 ms, 0.7 ms, 0.7 ms
- **Volar (N)**: 21.5 ms, 23.9 ms, 20.1 ms
- **Volar (JS)**: 152.7 ms, 152.2 ms, 151.8 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 96.0 MB | 98.6 MB | **194.6 MB** |
| Vize | 71.9 MB | 170.6 MB | **242.5 MB** |
| Volar (JS) | 276.5 MB | 248.8 MB | **525.3 MB** |
| Volar (N) | 288.4 MB | 320.8 MB | **609.2 MB** |

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
| Vize | **94.9 ms** | 94.9 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (N) | **475.9 ms** | 475.9 ms | n/a | n/a | 5.01x | n/a | n/a |
| Volar (JS) | **488.6 ms** | 488.6 ms | n/a | n/a | 5.15x | n/a | n/a |
| Verter | **616.2 ms** | 616.2 ms | n/a | n/a | 6.49x | n/a | n/a |

<details><summary>Notes</summary>

- **Vize**: all components verified · edit → diagnostic=54ms · hover after edit=40ms · completion=0ms
- **Volar (N)**: all components verified · edit → diagnostic=434ms · hover after edit=16ms · completion=25ms
- **Volar (JS)**: all components verified · edit → diagnostic=413ms · hover after edit=51ms · completion=25ms
- **Verter**: all components verified · edit → diagnostic=498ms · hover after edit=86ms · completion=32ms

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
| **Time-to-usable** | Verter LSP (npm 0.0.1-beta.3) | 262 ms | 253 ms | 263 ms | ×1.23 | 40.9 MB |
|  | Vize LSP (Node shim) | 555 ms | 520 ms | 528 ms | ×0.95 | 63.0 MB |
|  | Volar (TNB / tsgo tsdk) | 1.19 s | 1.36 s | 2.06 s | ×1.77 | 268.8 + 138.4 = 407.2 MB |
|  | Volar (@vue/language-server) | 1.90 s | 2.07 s | 3.01 s | ×1.6 | 253.6 + 77.5 = 331.2 MB |
| **Completion** | Vize LSP (Node shim) | 0.4 ms | 0.4 ms | 0.4 ms | ×1.07 | 63.0 MB |
|  | Verter LSP (npm 0.0.1-beta.3) | 122 ms | 172 ms | 178 ms | ×1 | 40.9 MB |
|  | Volar (TNB / tsgo tsdk) | 164 ms | 183 ms | 242 ms | ×1.48 | 268.8 + 138.4 = 407.2 MB |
|  | Volar (@vue/language-server) | 204 ms | 218 ms | 267 ms | ×1.21 | 253.6 + 77.5 = 331.2 MB |
| **References** | Volar (TNB / tsgo tsdk) | 116 ms | 626 ms | 12.3 s | ×109.78 | 268.8 + 138.4 = 407.2 MB |
|  | Volar (@vue/language-server) | 442 ms | 1.24 s | 17.7 s | ×40.23 | 253.6 + 77.5 = 331.2 MB |
|  | Vize LSP (Node shim) | 406 ms | (3.15 s) ⚠ | (16.7 s) ⚠ | – | 63.0 MB |
|  | Verter LSP (npm 0.0.1-beta.3) | (0.5 ms) ⚠ | (34.6 ms) ⚠ | (33.9 ms) ⚠ | – | 40.9 MB |
| **Hover warm** | Verter LSP (npm 0.0.1-beta.3) | 0.6 ms | 1.2 ms | 0.8 ms | ×1.13 | 40.9 MB |
|  | Volar (@vue/language-server) | 1.5 ms | 1.3 ms | 1.3 ms | ×1.05 | 253.6 + 77.5 = 331.2 MB |
|  | Volar (TNB / tsgo tsdk) | 1.6 ms | 1.9 ms | 5.0 ms | ×1.87 | 268.8 + 138.4 = 407.2 MB |
|  | Vize LSP (Node shim) | 2.9 ms | 4.5 ms | (1.1 ms) ⚠ | – | 63.0 MB |

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

pass **24** · fail **3** · warn **0** · skip **0**

| Case | volar | vize | verter |
| --- | :---: | :---: | :---: |
| `completion-prop-template` | ✓ | ✓ | ✓ |
| `definition-component` | ✓ | ✓ | ✓ |
| `definition-prop-attr` | ✓ | ✓ | ✓ |
| `diagnostics-clear-after-fix` | ✓ | ✓ | ✓ |
| `diagnostics-template` | ✓ | ✓ | ✓ |
| `document-symbol-structure` | ✓ | **✗** | ✓ |
| `hover-template-binding` | ✓ | ✓ | ✓ |
| `references-prop-template` | ✓ | ✓ | **✗** |
| `rename-prop-template` | ✓ | ✓ | **✗** |

<details><summary>Failure detail</summary>

- `document-symbol-structure` · **vize** — documentSymbol never names greeting — saw: template, script setup
- `references-prop-template` · **verter** — references missing App.vue — only found child.vue
- `rename-prop-template` · **verter** — BROKEN REFACTOR: edited child.vue:2 but produced no edit in App.vue — the template usage is left behind

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.3) | 103.84 / 219.69 / 103.84 | 1.14 / 2.74 / 1.66 | 40 | 14.2 | 639 | 3 |
| LSP vize (server process, Node shim) | 168.21 / 256.47 / 168.21 | 0.85 / 1.74 / 1.26 | 80 | 13.9 | 435 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) | 394.47 / 531.57 / 394.47 | 0.94 / 2.66 / 1.72 | 770 | 10.6 | 1918 | 3 |

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
| vue-36 | 3.6.0-rc.5 |
| @vue/compiler-sfc | 3.5.42 |
| @vue/compiler-sfc-36 | 3.6.0-rc.5 |
| vize | 0.387.0 |
| @vizejs/native | 0.387.0 |
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
| oxfmt | 0.65.0 |
| oxlint | 1.80.0 |
| eslint-plugin-vue | 10.10.0 |
| @biomejs/biome | 2.5.10 |
| typescript | 6.0.3 |
| cli:vize | 0.387.0 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.3 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.65.0 |
| cli:oxlint | 1.80.0 |
| cli:biome | 2.5.10 |
| vue-jsx-vapor | 3.2.22 |
| @vue-jsx-vapor/compiler-rs | 3.2.22 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.1 |

</details>
