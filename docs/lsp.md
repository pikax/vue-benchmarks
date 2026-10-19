# LSP and IDE operations

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-10-19T21:23:23.900Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · INTEL(R) XEON(R) PLATINUM 8573C · 15.6 GB · Node v22.23.3
- **Commit:** [`33fd9d3`](https://github.com/pikax/vue-benchmarks/commit/33fd9d395c22a020a8b9a90d40abe850ac241023)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/39325819866
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
| Volar (JS) ⚠ | (925.5 ms) | (910.1 ms) | – | – | not ranked | (114) | – | (294.2 + 262.6 = 556.9 MB) |
| Volar (N) ⚠ | (350.4 ms) | (344.8 ms) | – | – | not ranked | (114) | – | – |
| Vize ⚠ | (268.3 ms) | (266.3 ms) | – | – | not ranked | (114) | – | (87.0 + 84.0 = 170.9 MB) |
| Verter ⚠ | (350.7 ms) | (342.7 ms) | – | – | not ranked | (0) | – | (89.6 MB) |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. | engine: TypeScript 6.0.3 (JS) | init=732ms · ready=n/a · open→hover=930ms · hoverCold=45ms · hoverWarm=2ms · completion=14ms · definition=7ms | ⚠ FAILED VALIDATION (template hover) — template hover returned Ref<...> — that is the &lt;script setup> type leaking into template context; refs auto-unwrap inside {{ }}, so the correct answer is `string`. Sample: "```typescript\nconst benchMarker: Ref<string, string>\n```\nStable hover target for LSP benchmarks — do not rename."
- **Volar (N) ⚠**: Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.18.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.18.tsgo.7.0.2 | init=452ms · ready=n/a · open→hover=350ms · hoverCold=20ms · hoverWarm=2ms · completion=4ms · definition=3ms | ⚠ FAILED VALIDATION (template hover) — template hover returned Ref<...> — that is the &lt;script setup> type leaking into template context; refs auto-unwrap inside {{ }}, so the correct answer is `string`. Sample: "```typescript\nconst benchMarker: Ref<string, string>\n```\nStable hover target for LSP benchmarks — do not rename." | ⚠ VUE REFERENCE INVALID — official Volar did not clear the same content gates, so candidate latency remains visible but cannot rank without the declared baseline.
- **Vize ⚠**: vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.3/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. | engine: tsgo (bundled) | init=38ms · ready=n/a · open→hover=274ms · hoverCold=1ms · hoverWarm=1ms · completion=3ms · definition=1ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked) | ⚠ VUE REFERENCE INVALID — official Volar did not clear the same content gates, so candidate latency remains visible but cannot rank without the declared baseline.
- **Verter ⚠**: verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | init=4ms · ready=427ms · open→hover=385ms · hoverCold=6ms · hoverWarm=6ms · completion=3ms · definition=3ms | ⚠ FAILED VALIDATION (script hover) — empty hover payload. Sample: "" | ⚠ VUE REFERENCE INVALID — official Volar did not clear the same content gates, so candidate latency remains visible but cannot rank without the declared baseline.

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

- **Volar (JS)**: 910.1 ms, 923.9 ms, 933.2 ms, 925.5 ms, 929.6 ms
- **Volar (N)**: 348.3 ms, 352.6 ms, 344.8 ms, 355.8 ms, 350.4 ms
- **Vize**: 267.7 ms, 268.3 ms, 266.3 ms, 272.7 ms, 274.4 ms
- **Verter**: 350.7 ms, 349.0 ms, 350.7 ms, 342.7 ms, 385.3 ms

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
| Verter | **5.3 ms** | 5.2 ms | 0.1 ms | 1.8% | 1.00x | n/a | n/a |
| Vize | **41.7 ms** | 39.5 ms | 1.1 ms | 2.6% | 7.80x | n/a | n/a |
| Volar (N) | **536.2 ms** | 523.2 ms | 8.5 ms | 1.6% | 100.30x | n/a | n/a |
| Volar (JS) | **536.4 ms** | 527.1 ms | 9.5 ms | 1.8% | 100.34x | n/a | n/a |

<details><summary>Notes</summary>

- **Verter**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? (none)
- **Vize**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo (bundled)
- **Volar (N)**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? via TNB ?
- **Volar (JS)**: LSP initialize handshake after spawn (not first-request latency) | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 5.4 ms, 5.5 ms, 5.4 ms, 5.3 ms, 5.4 ms, 5.2 ms, 5.3 ms, 5.4 ms, 5.2 ms, 5.2 ms, 5.5 ms, 5.3 ms, 5.4 ms, 5.4 ms, 5.3 ms, 5.3 ms, 5.4 ms, 5.3 ms, 5.5 ms, 5.3 ms, 5.3 ms
- **Vize**: 44.0 ms, 40.1 ms, 41.6 ms, 42.5 ms, 42.7 ms, 41.1 ms, 42.4 ms, 43.5 ms, 41.4 ms, 42.2 ms, 41.7 ms, 41.8 ms, 41.8 ms, 40.5 ms, 40.9 ms, 41.2 ms, 41.8 ms, 41.0 ms, 40.8 ms, 41.8 ms, 39.5 ms
- **Volar (N)**: 544.8 ms, 536.2 ms, 540.9 ms, 531.8 ms, 530.0 ms, 558.9 ms, 539.1 ms, 546.2 ms, 537.1 ms, 528.1 ms, 532.7 ms, 540.3 ms, 533.4 ms, 552.6 ms, 541.7 ms, 546.0 ms, 535.7 ms, 535.8 ms, 530.0 ms, 523.2 ms, 531.3 ms
- **Volar (JS)**: 533.3 ms, 562.9 ms, 560.0 ms, 546.7 ms, 546.7 ms, 538.4 ms, 528.6 ms, 534.2 ms, 536.4 ms, 542.0 ms, 544.5 ms, 536.0 ms, 543.7 ms, 552.9 ms, 543.5 ms, 536.4 ms, 534.9 ms, 532.0 ms, 527.1 ms, 535.4 ms, 533.8 ms

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
| Vize | **0.8 ms** | 0.8 ms | 0.1 ms | 6.6% | 1.00x | 15 | n/a |
| Volar (N) | **157.0 ms** | 154.1 ms | 2.2 ms | 1.4% | 185.90x | 48 | n/a |
| Volar (JS) | **953.8 ms** | 838.1 ms | 134.7 ms | 13.9% ⚠ | 1129.34x | 48 | n/a |
| Verter ⚠ | (0.6 ms) | (0.5 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no tokens at all for this document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.8 ms, 0.8 ms, 0.9 ms
- **Volar (N)**: 157.0 ms, 158.4 ms, 154.1 ms
- **Volar (JS)**: 953.8 ms, 1.11 s, 838.1 ms
- **Verter**: 0.5 ms, 0.6 ms, 0.6 ms

</details>

#### Semantic tokens (delta after edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit-dark.svg">
  <img alt="IDE · Background (editor chatter) — Semantic tokens (delta after edit)" src="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (1.1 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (1.1 ms) | (0.9 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.6 ms) | (0.6 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1792444503532", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1792444512708", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.1 ms, 1.0 ms, 1.1 ms
- **Volar (N)**: 1.1 ms, 1.1 ms, 0.9 ms
- **Vize**: 0.6 ms, 0.5 ms, 0.5 ms
- **Verter**: 0.6 ms, 0.7 ms, 0.6 ms

</details>

#### Document symbols (outline)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-symbols-outline-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document symbols (outline)" src="charts/lsp-ide-ide-background-document-symbols-outline.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.5 ms** | 0.5 ms | 0.0 ms | 3.9% | 1.00x | 11 | n/a |
| Vize | **0.8 ms** | 0.7 ms | 0.1 ms | 13.0% ⚠ | 1.41x | 17 | n/a |
| Volar (N) | **21.8 ms** | 21.6 ms | 0.2 ms | 0.8% | 39.82x | 25 | n/a |
| Volar (JS) | **26.0 ms** | 17.1 ms | 5.3 ms | 22.7% ⚠ | 47.50x | 25 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.5 ms, 0.6 ms, 0.5 ms
- **Vize**: 0.8 ms, 0.7 ms, 0.9 ms
- **Volar (N)**: 21.8 ms, 21.6 ms, 21.9 ms
- **Volar (JS)**: 26.4 ms, 26.0 ms, 17.1 ms

</details>

#### Document highlight (caret move)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-highlight-caret-move-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document highlight (caret move)" src="charts/lsp-ide-ide-background-document-highlight-caret-move.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 0.3 ms | 0.0 ms | 2.8% | 1.00x | 4 | n/a |
| Vize | **0.5 ms** | 0.4 ms | 0.1 ms | 11.9% ⚠ | 1.51x | 4 | n/a |
| Volar (JS) | **22.7 ms** | 20.2 ms | 1.9 ms | 8.5% | 70.61x | 5 | n/a |
| Volar (N) | **39.7 ms** | 37.5 ms | 1.4 ms | 3.6% | 123.25x | 5 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms
- **Vize**: 0.5 ms, 0.4 ms, 0.5 ms
- **Volar (JS)**: 23.8 ms, 20.2 ms, 22.7 ms
- **Volar (N)**: 37.5 ms, 40.2 ms, 39.7 ms

</details>

#### Inlay hints (document range)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-inlay-hints-document-range-dark.svg">
  <img alt="IDE · Background (editor chatter) — Inlay hints (document range)" src="charts/lsp-ide-ide-background-inlay-hints-document-range.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **8.2 ms** | 7.9 ms | 0.2 ms | 2.4% | 1.00x | 2 | n/a |
| Volar (JS) | **80.4 ms** | 67.5 ms | 17.7 ms | 21.2% ⚠ | 9.82x | 16 | n/a |
| Volar (N) | **267.8 ms** | 261.5 ms | 3.8 ms | 1.4% | 32.70x | 16 | n/a |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 8.3 ms, 8.2 ms, 7.9 ms
- **Volar (JS)**: 102.5 ms, 80.4 ms, 67.5 ms
- **Volar (N)**: 267.8 ms, 268.3 ms, 261.5 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Folding ranges

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-folding-ranges-dark.svg">
  <img alt="IDE · Background (editor chatter) — Folding ranges" src="charts/lsp-ide-ide-background-folding-ranges.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.3 ms** | 0.3 ms | 0.0 ms | 2.7% | 1.00x | 2 | n/a |
| Vize | **0.4 ms** | 0.4 ms | 0.0 ms | 5.8% | 1.60x | 9 | n/a |
| Volar (N) | **23.1 ms** | 22.5 ms | 1.6 ms | 6.9% | 84.80x | 13 | n/a |
| Volar (JS) ⚠ | (10.3 ms) | (7.2 ms) | – | – | not ranked | (13) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 148.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms
- **Vize**: 0.5 ms, 0.4 ms, 0.4 ms
- **Volar (N)**: 22.5 ms, 25.6 ms, 23.1 ms
- **Volar (JS)**: 7.2 ms, 162.3 ms, 10.3 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 80.8 MB | — | **80.8 MB** |
| Vize | 85.3 MB | 99.4 MB | **184.6 MB** |
| Volar (JS) | 284.4 MB | 257.5 MB | **542.0 MB** |
| Volar (N) | 294.3 MB | 393.6 MB | **687.9 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.7) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Vize | **4.7 ms** | 1.00x | **0.5 ms** | 0.5 ms | 0.0 ms | 5.7% | 1.00x | 3 | n/a |
| Volar (N) | **418.6 ms** | 88.41x | **15.7 ms** | 12.7 ms | 4.9 ms | 29.2% ⚠ | 29.79x | 3 | n/a |
| Volar (JS) | **1.13 s** | 238.93x | **16.6 ms** | 16.2 ms | 2.2 ms | 12.3% ⚠ | 31.63x | 3 | n/a |
| Verter ⚠ | (229.4 ms) | not ranked | (7.0 ms) | (6.2 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `quaver` member of the local object in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.5 ms, 0.5 ms
- **Volar (N)**: 22.3 ms, 12.7 ms, 15.7 ms
- **Volar (JS)**: 16.2 ms, 16.6 ms, 20.1 ms
- **Verter**: 7.1 ms, 7.0 ms, 6.2 ms

</details>

#### Completion: component tag &lt;Ch

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-component-tag-ch-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: component tag &lt;Ch" src="charts/lsp-ide-ide-completion-completion-component-tag-ch.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **2.9 ms** | 1.00x | **4.5 ms** | 4.1 ms | 0.3 ms | 6.2% | 1.00x | 66 | n/a |
| Volar (JS) | **126.7 ms** | 43.15x | **36.3 ms** | 35.8 ms | 4.1 ms | 10.7% ⚠ | 8.02x | 192 | n/a |
| Volar (N) | **144.3 ms** | 49.12x | **42.8 ms** | 42.2 ms | 0.8 ms | 1.9% | 9.44x | 192 | n/a |
| Vize | **207.0 ms** | 70.46x | **20.8 ms** | 20.5 ms | 6.7 ms | 27.5% ⚠ | 4.59x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 4.5 ms, 4.5 ms, 4.1 ms
- **Volar (JS)**: 43.2 ms, 36.3 ms, 35.8 ms
- **Volar (N)**: 43.8 ms, 42.8 ms, 42.2 ms
- **Vize**: 20.5 ms, 20.8 ms, 32.3 ms

</details>

#### Completion: prop name &lt;C :

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-prop-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: prop name &lt;C :" src="charts/lsp-ide-ide-completion-completion-prop-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **10.7 ms** | 1.00x | **1.7 ms** | 1.7 ms | 0.1 ms | 4.0% | 1.00x | 13 | n/a |
| Volar (N) | **38.6 ms** | 3.60x | **7.6 ms** | 7.2 ms | 0.8 ms | 10.5% ⚠ | 4.42x | 26 | n/a |
| Volar (JS) | **197.2 ms** | 18.37x | **92.5 ms** | 82.3 ms | 42.7 ms | 38.2% ⚠ | 53.69x | 26 | n/a |
| Verter ⚠ | (2.7 ms) | not ranked | (2.6 ms) | (2.6 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `blurb` declared prop in 0 items | Sample: "(empty list)" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.7 ms, 1.7 ms, 1.8 ms
- **Volar (N)**: 7.6 ms, 8.8 ms, 7.2 ms
- **Volar (JS)**: 160.8 ms, 82.3 ms, 92.5 ms
- **Verter**: 2.6 ms, 2.6 ms, 2.7 ms

</details>

#### Completion: event name &lt;C @

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-event-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: event name &lt;C @" src="charts/lsp-ide-ide-completion-completion-event-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 1.00x | **0.6 ms** | 0.6 ms | 0.0 ms | 3.2% | 1.00x | 14 | n/a |
| Volar (N) | **7.5 ms** | 12.09x | **6.8 ms** | 6.6 ms | 0.1 ms | 1.7% | 11.31x | 25 | n/a |
| Volar (JS) | **8.8 ms** | 14.20x | **6.1 ms** | 5.8 ms | 0.5 ms | 8.7% | 10.13x | 25 | n/a |
| Verter ⚠ | (2.8 ms) | not ranked | (2.7 ms) | (2.7 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.6 ms, 0.6 ms, 0.6 ms
- **Volar (N)**: 6.6 ms, 6.8 ms, 6.8 ms
- **Volar (JS)**: 6.9 ms, 5.8 ms, 6.1 ms
- **Verter**: 2.7 ms, 2.7 ms, 2.7 ms

</details>

#### Completion: directive v-

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-directive-v-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: directive v-" src="charts/lsp-ide-ide-completion-completion-directive-v.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.6 ms** | 1.00x | **0.5 ms** | 0.5 ms | 0.0 ms | 5.9% | 1.00x | 15 | n/a |
| Verter | **4.3 ms** | 7.59x | **3.0 ms** | 2.5 ms | 0.9 ms | 28.5% ⚠ | 5.63x | 29 | n/a |
| Volar (N) | **28.4 ms** | 50.02x | **12.9 ms** | 12.4 ms | 0.6 ms | 4.3% | 24.07x | 498 | n/a |
| Volar (JS) ⚠ | (33.2 ms) | not ranked | (13.3 ms) | (12.3 ms) | – | – | not ranked | (498) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 92.7% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.6 ms, 0.5 ms
- **Verter**: 4.3 ms, 3.0 ms, 2.5 ms
- **Volar (N)**: 12.9 ms, 12.4 ms, 13.5 ms
- **Volar (JS)**: 57.1 ms, 13.3 ms, 12.3 ms

</details>

#### Completion: slot name &lt;template #

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-slot-name-template-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: slot name &lt;template #" src="charts/lsp-ide-ide-completion-completion-slot-name-template.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.7 ms** | 1.00x | **0.7 ms** | 0.7 ms | 0.0 ms | 3.6% | 1.00x | 30 | n/a |
| Volar (JS) | **14.2 ms** | 19.96x | **15.1 ms** | 14.4 ms | 1.3 ms | 8.3% | 21.61x | 500 | n/a |
| Volar (N) | **15.5 ms** | 21.76x | **14.4 ms** | 13.8 ms | 1.3 ms | 8.6% | 20.68x | 500 | n/a |
| Verter ⚠ | (0.4 ms) | not ranked | (0.4 ms) | (0.4 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `epilogue` declared slot in 0 items | Sample: "(empty list)" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.7 ms, 0.7 ms, 0.7 ms
- **Volar (JS)**: 16.9 ms, 15.1 ms, 14.4 ms
- **Volar (N)**: 13.8 ms, 16.3 ms, 14.4 ms
- **Verter**: 0.4 ms, 0.4 ms, 0.4 ms

</details>

#### Completion: auto-import

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-auto-import-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: auto-import" src="charts/lsp-ide-ide-completion-completion-auto-import.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **37.3 ms** | 33.8 ms | 3.5 ms | 9.4% | 1.00x | 1,073 | n/a |
| Volar (N) | **73.0 ms** | 42.0 ms | 25.6 ms | 36.9% ⚠ | 1.96x | 1,073 | n/a |
| Vize ⚠ | (35.7 ms) | (33.4 ms) | – | – | not ranked | (1,080) | – |
| Verter ⚠ | (3.0 ms) | (2.7 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import | Sample: "offered: \"getComputedStyle\" kind=3 ; \"computed\" kind=6 ; \"computed\" kind=3 detail=\"function computed&lt;T>(getter: () => T): ComputedRef&lt;T>\"" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 40.8 ms, 33.8 ms, 37.3 ms
- **Volar (N)**: 42.0 ms, 73.0 ms, 92.8 ms
- **Vize**: 35.8 ms, 35.7 ms, 33.4 ms
- **Verter**: 2.7 ms, 3.2 ms, 3.0 ms

</details>

#### Resolve: auto-import edit

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-auto-import-edit-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: auto-import edit" src="charts/lsp-ide-ide-completion-resolve-auto-import-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **40.5 ms** | 37.6 ms | 8.1 ms | 18.5% ⚠ | 1.00x | 241 | n/a |
| Volar (N) | **50.7 ms** | 50.5 ms | 4.1 ms | 7.7% | 1.25x | 241 | n/a |
| Vize ⚠ | (5.9 ms) | (5.5 ms) | – | – | not ranked | (67) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` | Sample: "\"computed\" kind=6 detail=\"Update import from \\\"vue\\\"\"" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 52.8 ms, 37.6 ms, 40.5 ms
- **Volar (N)**: 50.5 ms, 50.7 ms, 57.6 ms
- **Vize**: 5.5 ms, 6.2 ms, 5.9 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-script-member-detail-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: script member detail" src="charts/lsp-ide-ide-completion-resolve-script-member-detail.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 3.3% | 1.00x | 75 | n/a |
| Volar (JS) | **3.0 ms** | 2.4 ms | 1.2 ms | 34.9% ⚠ | 14.40x | 25 | n/a |
| Volar (N) | **9.7 ms** | 9.4 ms | 0.4 ms | 3.9% | 47.02x | 25 | n/a |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — script member completion offered no `quaver` item to resolve (9 items) | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Volar (JS)**: 4.7 ms, 2.4 ms, 3.0 ms
- **Volar (N)**: 10.1 ms, 9.7 ms, 9.4 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 86.8 MB | — | **86.8 MB** |
| Vize | 99.9 MB | 112.3 MB | **212.2 MB** |
| Volar (JS) | 299.3 MB | 272.3 MB | **571.6 MB** |
| Volar (N) | 309.5 MB | 401.5 MB | **710.9 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.7) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 1.17 s, min 1.16 s, CV 1.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 490.1 ms, min 478.9 ms, CV 2.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? via TNB ?
- **Vize**: content verified | NOT RANKED (informational) — measured 1.04 s, min 1.04 s, CV 0.1%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo (bundled)
- **Verter**: content verified | NOT RANKED (informational) — measured 877.1 ms, min 873.1 ms, CV 0.3%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.18 s, 1.17 s, 1.16 s
- **Volar (N)**: 490.1 ms, 499.1 ms, 478.9 ms
- **Vize**: 1.04 s, 1.04 s, 1.04 s
- **Verter**: 877.1 ms, 873.1 ms, 877.2 ms

</details>

#### Edit plants type error -> reported

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit plants type error -> reported" src="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **56.1 ms** | 55.2 ms | 0.6 ms | 1.0% | 1.00x | 1 | n/a |
| Volar (N) | **402.6 ms** | 399.5 ms | 7.7 ms | 1.9% | 7.18x | 1 | n/a |
| Volar (JS) | **415.2 ms** | 402.2 ms | 8.6 ms | 2.1% | 7.40x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no diagnostic referencing the planted error (`plantedTypeError` at line 3) in 4000ms across 4 publish(es) [model=push] | Sample: "[]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 56.1 ms, 55.2 ms, 56.3 ms
- **Volar (N)**: 399.5 ms, 402.6 ms, 414.0 ms
- **Volar (JS)**: 415.2 ms, 402.2 ms, 418.6 ms
- **Verter**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Edit fixes it -> diagnostic clears

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit fixes it -> diagnostic clears" src="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **13.8 ms** | 13.8 ms | 0.1 ms | 0.7% | 1.00x | 0 | n/a |
| Volar (N) | **439.7 ms** | 401.4 ms | 30.9 ms | 7.1% | 31.88x | 0 | n/a |
| Volar (JS) | **462.5 ms** | 458.9 ms | 2.5 ms | 0.5% | 33.53x | 0 | n/a |
| Verter ⚠ | (0.1 ms) | (0.1 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — the planted diagnostic was never reported, so its clearing cannot be measured — see the diagnostics-error row | Sample: "after fix (4 publish(es) for this file): []" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 13.8 ms, 13.8 ms, 14.0 ms
- **Volar (N)**: 439.7 ms, 462.6 ms, 401.4 ms
- **Volar (JS)**: 462.5 ms, 458.9 ms, 463.6 ms
- **Verter**: 0.1 ms, 0.1 ms, 0.1 ms

</details>

#### Hover after retype -> NEW type

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Hover after retype -> NEW type" src="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **33.7 ms** | 33.5 ms | 1.1 ms | 3.2% | 1.00x | 40 | n/a |
| Vize | **57.3 ms** | 56.4 ms | 0.8 ms | 1.3% | 1.70x | 40 | n/a |
| Volar (N) ⚠ | (15.1 ms) | (14.0 ms) | – | – | not ranked | (40) | – |
| Verter ⚠ | (6.9 ms) | (6.9 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N) ⚠**: content verified | engine: tsgo ? via TNB ? | ⚠ TOO NOISY TO RANK — CV 50.5% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — empty hover payload for `probeValue` (the same position carried no type before the edit either, so it is unsupported rather than stale; never caught up) | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 33.5 ms, 35.5 ms, 33.7 ms
- **Vize**: 58.0 ms, 57.3 ms, 56.4 ms
- **Volar (N)**: 32.5 ms, 14.0 ms, 15.1 ms
- **Verter**: 6.9 ms, 7.0 ms, 6.9 ms

</details>

#### ... same hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... same hover, time to correct" src="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **33.7 ms** | 33.5 ms | 1.1 ms | 3.2% | 1.00x | 1 | n/a |
| Vize | **57.3 ms** | 56.4 ms | 0.8 ms | 1.3% | 1.70x | 1 | n/a |
| Volar (N) ⚠ | (15.1 ms) | (14.0 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (3.08 s) | (3.08 s) | – | – | not ranked | (16) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N) ⚠**: content verified | engine: tsgo ? via TNB ? | ⚠ TOO NOISY TO RANK — CV 50.5% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — hover never reported `probeValue: number` within 3000ms across 16 attempts — empty hover payload for `probeValue` | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 33.5 ms, 35.5 ms, 33.7 ms
- **Vize**: 58.0 ms, 57.3 ms, 56.4 ms
- **Volar (N)**: 32.5 ms, 14.0 ms, 15.1 ms
- **Verter**: 3.09 s, 3.08 s, 3.08 s

</details>

#### Steady state: edits 1-5 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 1-5 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **14.0 ms** | 13.5 ms | 0.5 ms | 3.7% | 1.00x | n/a | n/a |
| Volar (JS) | **21.5 ms** | 21.2 ms | 0.5 ms | 2.5% | 1.54x | n/a | n/a |
| Vize | **56.2 ms** | 54.6 ms | 1.5 ms | 2.7% | 4.02x | n/a | n/a |
| Verter ⚠ | (6.7 ms) | (6.4 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — edit #1: empty hover payload for `probeValue` | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 14.0 ms, 14.5 ms, 13.5 ms
- **Volar (JS)**: 22.3 ms, 21.5 ms, 21.2 ms
- **Vize**: 56.2 ms, 54.6 ms, 57.6 ms
- **Verter**: 6.4 ms, 7.6 ms, 6.7 ms

</details>

#### Steady state: edits 6-10 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 6-10 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **12.9 ms** | 12.8 ms | 0.5 ms | 3.5% | 1.00x | -1 | n/a |
| Volar (JS) | **17.4 ms** | 16.6 ms | 1.7 ms | 9.7% | 1.35x | -2 | n/a |
| Vize | **55.9 ms** | 54.8 ms | 1.2 ms | 2.1% | 4.35x | 0 | n/a |
| Verter ⚠ | (6.3 ms) | (6.1 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — edit #6: empty hover payload for `probeValue` | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 12.8 ms, 13.6 ms, 12.9 ms
- **Volar (JS)**: 20.0 ms, 17.4 ms, 16.6 ms
- **Vize**: 55.9 ms, 54.8 ms, 57.2 ms
- **Verter**: 6.1 ms, 6.9 ms, 6.3 ms

</details>

#### Child prop retype -> Parent diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent diagnostic" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **126.9 ms** | 124.8 ms | 1.2 ms | 1.0% | 1.00x | 1 | n/a |
| Volar (JS) | **378.3 ms** | 376.5 ms | 1.1 ms | 0.3% | 2.98x | 1 | n/a |
| Volar (N) | **382.0 ms** | 381.3 ms | 0.7 ms | 0.2% | 3.01x | 1 | n/a |
| Verter ⚠ | (4.00 s) | (4.00 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — Parent.vue never reported the now-invalid `:label` binding (line 7) in 4000ms; 8 publish(es) for Parent.vue since the session began, 0 diagnostic(s) now | Sample: "before: [] || after: []" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 127.0 ms, 124.8 ms, 126.9 ms
- **Volar (JS)**: 378.4 ms, 376.5 ms, 378.3 ms
- **Volar (N)**: 382.0 ms, 381.3 ms, 382.7 ms
- **Verter**: 4.00 s, 4.00 s, 4.00 s

</details>

#### Child prop retype -> Parent hover

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent hover" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **72.6 ms** | 72.0 ms | 10.2 ms | 13.0% ⚠ | 1.00x | 42 | n/a |
| Volar (JS) | **121.4 ms** | 115.3 ms | 4.5 ms | 3.7% | 1.67x | 42 | n/a |
| Vize | **137.0 ms** | 135.4 ms | 1.4 ms | 1.0% | 1.89x | 250 | n/a |
| Verter ⚠ | (9.1 ms) | (8.9 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — empty hover payload for `label` (the same position carried no type before the edit either, so it is unsupported rather than stale; never caught up) | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 72.6 ms, 72.0 ms, 89.9 ms
- **Volar (JS)**: 115.3 ms, 121.4 ms, 124.1 ms
- **Vize**: 138.2 ms, 135.4 ms, 137.0 ms
- **Verter**: 9.1 ms, 8.9 ms, 9.4 ms

</details>

#### ... Parent hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... Parent hover, time to correct" src="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **72.6 ms** | 72.0 ms | 10.2 ms | 13.0% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **121.4 ms** | 115.3 ms | 4.5 ms | 3.7% | 1.67x | 1 | n/a |
| Vize | **137.0 ms** | 135.4 ms | 1.4 ms | 1.0% | 1.89x | 1 | n/a |
| Verter ⚠ | (3.10 s) | (3.09 s) | – | – | not ranked | (16) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — hover never reported `label: number` within 3000ms across 16 attempts — empty hover payload for `label` | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 72.6 ms, 72.0 ms, 89.9 ms
- **Volar (JS)**: 115.3 ms, 121.4 ms, 124.1 ms
- **Vize**: 138.2 ms, 135.4 ms, 137.0 ms
- **Verter**: 3.09 s, 3.11 s, 3.10 s

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 83.8 MB | — | **83.8 MB** |
| Vize | 87.6 MB | 122.7 MB | **210.4 MB** |
| Volar (JS) | 294.2 MB | 302.5 MB | **596.7 MB** |
| Volar (N) | 304.7 MB | 424.3 MB | **729.1 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- `didOpen -> first diagnostics` is MEASURED BUT NOT RANKED: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. Its median column is empty by design; the measured time is in the row's note and under Raw runs.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.7) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Verter | **273.3 ms** | 1.00x | **0.7 ms** | 0.6 ms | 0.3 ms | 32.1% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **443.1 ms** | 1.62x | **15.4 ms** | 14.8 ms | 0.6 ms | 3.7% | 21.42x | 1 | n/a |
| Volar (JS) | **1.17 s** | 4.30x | **184.2 ms** | 179.5 ms | 4.8 ms | 2.6% | 256.24x | 1 | n/a |
| Vize ⚠ | (230.0 ms) | not ranked | (158.8 ms) | (0.5 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: content verified | engine: tsgo (bundled) | ⚠ TOO NOISY TO RANK — CV 86.4% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.7 ms, 1.1 ms, 0.6 ms
- **Volar (N)**: 15.4 ms, 14.8 ms, 16.0 ms
- **Volar (JS)**: 179.5 ms, 189.0 ms, 184.2 ms
- **Vize**: 0.5 ms, 169.8 ms, 158.8 ms

</details>

#### Definition: imported fn (script)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-definition-imported-fn-script-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Definition: imported fn (script)" src="charts/lsp-ide-ide-navigation-definition-imported-fn-script.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **272.8 ms** | 1.00x | **0.9 ms** | 0.7 ms | 0.3 ms | 28.7% ⚠ | 1.00x | 1 | n/a |
| Vize | **314.7 ms** | 1.15x | **1.7 ms** | 1.7 ms | 0.0 ms | 1.9% | 1.82x | 1 | n/a |
| Volar (N) | **433.3 ms** | 1.59x | **25.8 ms** | 14.9 ms | 6.5 ms | 28.9% ⚠ | 27.84x | 1 | n/a |
| Volar (JS) | **1.18 s** | 4.31x | **181.1 ms** | 178.8 ms | 5.3 ms | 2.9% | 195.42x | 1 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.9 ms, 1.3 ms, 0.7 ms
- **Vize**: 1.7 ms, 1.7 ms, 1.7 ms
- **Volar (N)**: 26.4 ms, 25.8 ms, 14.9 ms
- **Volar (JS)**: 189.0 ms, 181.1 ms, 178.8 ms

</details>

#### Type definition: typed binding

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-type-definition-typed-binding-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Type definition: typed binding" src="charts/lsp-ide-ide-navigation-type-definition-typed-binding.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **7.2 ms** | 7.1 ms | 0.1 ms | 0.8% | 1.00x | 1 | n/a |
| Volar (N) | **18.3 ms** | 16.2 ms | 1.6 ms | 8.7% | 2.54x | 1 | n/a |
| Vize ⚠ | (9.0 ms) | (8.7 ms) | – | – | not ranked | (1) | – |
| Verter ⚠ | (15.9 ms) | (14.7 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: content verified | engine: tsgo (bundled) | ⚠ TOO NOISY TO RANK — CV 149.1% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — typeDefinition returned no location | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 7.2 ms, 7.2 ms, 7.1 ms
- **Volar (N)**: 19.2 ms, 18.3 ms, 16.2 ms
- **Vize**: 173.4 ms, 9.0 ms, 8.7 ms
- **Verter**: 16.0 ms, 15.9 ms, 14.7 ms

</details>

#### References: prop -> parent template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-references-prop-parent-template-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — References: prop -> parent template" src="charts/lsp-ide-ide-navigation-references-prop-parent-template.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **89.6 ms** | 73.2 ms | 9.5 ms | 11.3% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **144.3 ms** | 141.6 ms | 6.4 ms | 4.4% | 1.61x | 4 | n/a |
| Vize | **264.5 ms** | 263.0 ms | 1.9 ms | 0.7% | 2.95x | 4 | n/a |
| Verter ⚠ | (63.7 ms) | (54.0 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — references returned nothing | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 89.7 ms, 73.2 ms, 89.6 ms
- **Volar (JS)**: 141.6 ms, 153.7 ms, 144.3 ms
- **Vize**: 263.0 ms, 266.8 ms, 264.5 ms
- **Verter**: 75.2 ms, 54.0 ms, 63.7 ms

</details>

#### Prepare rename: prop

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-prepare-rename-prop-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Prepare rename: prop" src="charts/lsp-ide-ide-navigation-prepare-rename-prop.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **5.8 ms** | 5.2 ms | 0.3 ms | 6.1% | 1.00x | n/a | n/a |
| Volar (JS) | **6.3 ms** | 5.0 ms | 1.0 ms | 16.2% ⚠ | 1.09x | n/a | n/a |
| Vize | **173.1 ms** | 172.8 ms | 1.1 ms | 0.6% | 29.99x | n/a | n/a |
| Verter ⚠ | (6.6 ms) | (4.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 5.8 ms, 5.8 ms, 5.2 ms
- **Volar (JS)**: 7.0 ms, 5.0 ms, 6.3 ms
- **Vize**: 174.8 ms, 172.8 ms, 173.1 ms
- **Verter**: 6.6 ms, 8.9 ms, 4.0 ms

</details>

#### Rename prop (cross-file edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Rename prop (cross-file edit)" src="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **3.4 ms** | 3.4 ms | 0.1 ms | 2.7% | 1.00x | 4 | n/a |
| Volar (JS) | **3.8 ms** | 3.5 ms | 1.1 ms | 26.5% ⚠ | 1.09x | 4 | n/a |
| Vize | **265.2 ms** | 264.2 ms | 2.0 ms | 0.8% | 76.99x | 4 | n/a |
| Verter ⚠ | (5.8 ms) | (5.1 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — request failed: {"code":-32803,"message":"verter: rename is unavailable for public component props because complete cross-file usage proof is unavailable; no rename edit was produced."} | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 3.4 ms, 3.4 ms, 3.6 ms
- **Volar (JS)**: 5.6 ms, 3.5 ms, 3.8 ms
- **Vize**: 268.1 ms, 264.2 ms, 265.2 ms
- **Verter**: 5.1 ms, 7.1 ms, 5.8 ms

</details>

#### Code action at diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-code-action-at-diagnostic-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Code action at diagnostic" src="charts/lsp-ide-ide-navigation-code-action-at-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **36.1 ms** | 34.5 ms | 1.3 ms | 3.7% | 1.00x | 2 | n/a |
| Volar (N) | **769.0 ms** | 760.7 ms | 6.4 ms | 0.8% | 21.31x | 2 | n/a |
| Vize ⚠ | (89.4 ms) | (87.3 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (7.1 ms) | (6.5 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — request failed: {"code":-32801,"message":"Content modified"} | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 34.5 ms, 37.2 ms, 36.1 ms
- **Volar (N)**: 760.7 ms, 773.3 ms, 769.0 ms
- **Vize**: 89.4 ms, 87.3 ms, 103.5 ms
- **Verter**: 20.3 ms, 6.5 ms, 7.1 ms

</details>

#### Signature help after `(`

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-signature-help-after-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Signature help after `(`" src="charts/lsp-ide-ide-navigation-signature-help-after.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **20.2 ms** | 20.0 ms | 3.0 ms | 13.6% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **28.0 ms** | 27.2 ms | 0.7 ms | 2.6% | 1.39x | 1 | n/a |
| Vize | **536.6 ms** | 357.4 ms | 106.0 ms | 22.1% ⚠ | 26.60x | 1 | n/a |
| Verter ⚠ | (22.5 ms) | (19.8 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — signatureHelp returned no signatures | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 25.2 ms, 20.2 ms, 20.0 ms
- **Volar (N)**: 27.2 ms, 28.0 ms, 28.6 ms
- **Vize**: 545.2 ms, 536.6 ms, 357.4 ms
- **Verter**: 19.8 ms, 22.5 ms, 24.9 ms

</details>

#### Format unformatted SFC

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-format-unformatted-sfc-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Format unformatted SFC" src="charts/lsp-ide-ide-navigation-format-unformatted-sfc.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **65.9 ms** | 64.7 ms | 1.7 ms | 2.6% | 1.00x | 1 | n/a |
| Volar (N) | **66.9 ms** | 66.3 ms | 1.3 ms | 1.9% | 1.02x | 1 | n/a |
| Vize ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 65.9 ms, 68.1 ms, 64.7 ms
- **Volar (N)**: 66.9 ms, 66.3 ms, 68.7 ms
- **Vize**: 0.5 ms, 0.6 ms, 0.4 ms
- **Verter**: 0.3 ms, 0.3 ms, 0.3 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 93.1 MB | — | **93.1 MB** |
| Vize | 91.1 MB | 87.1 MB | **178.3 MB** |
| Volar (JS) | 296.1 MB | 252.7 MB | **548.7 MB** |
| Volar (N) | 308.9 MB | 471.6 MB | **780.5 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.7) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Vize | **227.1 ms** | 1.00x | **1.1 ms** | 1.1 ms | 0.1 ms | 6.3% | 1.00x | 90 | n/a |
| Volar (JS) ⚠ | (1.14 s) | not ranked | (179.9 ms) | (179.8 ms) | – | – | not ranked | (90) | – |
| Volar (N) ⚠ | (468.3 ms) | not ranked | (25.0 ms) | (13.1 ms) | – | – | not ranked | (90) | – |
| Verter ⚠ | (263.0 ms) | not ranked | (4.6 ms) | (4.5 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — unranked because the paired probe failed (hover-template) — a hover that is right in one context and wrong in the other is not a comparable measurement | Sample: "```typescript\nconst marker: Ref<string, string>\n```\nStable hover target — do not rename." | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — unranked because the paired probe failed (hover-template) — a hover that is right in one context and wrong in the other is not a comparable measurement | Sample: "```typescript\nconst marker: Ref<string, string>\n```\nStable hover target — do not rename." | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no type for `marker` at the script position | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.1 ms, 1.2 ms, 1.1 ms
- **Volar (JS)**: 179.9 ms, 179.8 ms, 184.0 ms
- **Volar (N)**: 25.0 ms, 13.1 ms, 31.6 ms
- **Verter**: 4.6 ms, 4.5 ms, 4.6 ms

</details>

#### Hover (template interpolation)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-smoke-hover-template-interpolation-dark.svg">
  <img alt="IDE · Smoke (reference suite) — Hover (template interpolation)" src="charts/lsp-ide-ide-smoke-hover-template-interpolation.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **223.7 ms** | 1.00x | **1.1 ms** | 1.1 ms | 0.0 ms | 2.1% | 1.00x | 38 | n/a |
| Volar (JS) ⚠ | (1.14 s) | not ranked | (177.0 ms) | (174.9 ms) | – | – | not ranked | (90) | – |
| Volar (N) ⚠ | (472.3 ms) | not ranked | (18.8 ms) | (17.1 ms) | – | – | not ranked | (90) | – |
| Verter ⚠ | (262.3 ms) | not ranked | (4.5 ms) | (4.5 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — cold: returned Ref<...> — script type leaked into template context | Sample: "```typescript\nconst marker: Ref<string, string>\n```\nStable hover target — do not rename." | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — cold: returned Ref<...> — script type leaked into template context | Sample: "```typescript\nconst marker: Ref<string, string>\n```\nStable hover target — do not rename." | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no unwrapped `string` type at the template position | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 1.1 ms, 1.1 ms, 1.1 ms
- **Volar (JS)**: 177.0 ms, 183.3 ms, 174.9 ms
- **Volar (N)**: 19.7 ms, 17.1 ms, 18.8 ms
- **Verter**: 4.5 ms, 4.5 ms, 4.7 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 78.9 MB | — | **78.9 MB** |
| Vize | 84.4 MB | 85.7 MB | **170.1 MB** |
| Volar (JS) | 278.5 MB | 248.3 MB | **526.8 MB** |
| Volar (N) | 289.1 MB | 331.9 MB | **621.1 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.7) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Vize | **113.9 ms** | 113.9 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (N) | **433.3 ms** | 433.3 ms | n/a | n/a | 3.80x | n/a | n/a |
| Volar (JS) | **465.5 ms** | 465.5 ms | n/a | n/a | 4.09x | n/a | n/a |
| Verter ⚠ | (4.02 s) | (4.02 s) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: all components verified · edit → diagnostic=56ms · hover after edit=57ms · completion=1ms
- **Volar (N)**: all components verified · edit → diagnostic=403ms · hover after edit=15ms · completion=16ms
- **Volar (JS)**: all components verified · edit → diagnostic=415ms · hover after edit=34ms · completion=17ms
- **Verter ⚠**: ⚠ FAILED VALIDATION — 3 of 3 components failed their gate (edit → diagnostic, hover after edit, completion); the sum is shown for reference only. edit → diagnostic=4001ms ✗ · hover after edit=7ms ✗ · completion=7ms ✗

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
| **Time-to-usable** | Vize LSP (Node shim) | 220 ms | 220 ms | 224 ms | ×0.99 | 72.8 MB |
|  | Volar (TNB / tsgo tsdk) | 693 ms | 823 ms | 1.31 s | ×1.92 | 286.4 + 139.1 = 425.5 MB |
|  | Volar (@vue/language-server) | 1.20 s | 1.39 s | 2.01 s | ×1.94 | 275.6 + 80.1 = 355.6 MB |
|  | Verter LSP (npm 0.0.1-beta.7) | (60.2 s) ⚠ | – | – | – | 665.4 MB |
| **Completion** | Vize LSP (Node shim) | 0.8 ms | 0.7 ms | 0.8 ms | ×0.95 | 72.8 MB |
|  | Volar (TNB / tsgo tsdk) | 98.0 ms | 94.1 ms | 124 ms | ×1.25 | 286.4 + 139.1 = 425.5 MB |
|  | Volar (@vue/language-server) | 107 ms | 121 ms | 161 ms | ×1.85 | 275.6 + 80.1 = 355.6 MB |
|  | Verter LSP (npm 0.0.1-beta.7) | 2.2 ms | – | – | – | 665.4 MB |
| **References** | Volar (TNB / tsgo tsdk) | 23.1 ms | 40.9 ms | 112 ms | ×5.14 | 286.4 + 139.1 = 425.5 MB |
|  | Volar (@vue/language-server) | 28.0 ms | 68.5 ms | 253 ms | ×9.53 | 275.6 + 80.1 = 355.6 MB |
|  | Vize LSP (Node shim) | 209 ms | 1.14 s | 20.9 s | ×98.87 | 72.8 MB |
|  | Verter LSP (npm 0.0.1-beta.7) | (3.5 ms) ⚠ | – | – | – | 665.4 MB |
| **Hover warm** | Vize LSP (Node shim) | 0.8 ms | 0.8 ms | 0.7 ms | ×0.93 | 72.8 MB |
|  | Volar (@vue/language-server) | 1.4 ms | 1.2 ms | 1.3 ms | ×1.28 | 275.6 + 80.1 = 355.6 MB |
|  | Volar (TNB / tsgo tsdk) | 1.0 ms | 1.5 ms | 3.3 ms | ×3.73 | 286.4 + 139.1 = 425.5 MB |
|  | Verter LSP (npm 0.0.1-beta.7) | (3.1 ms) ⚠ | – | – | – | 665.4 MB |

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

pass **20** · fail **7** · warn **0** · skip **0**

| Case | volar | vize | verter |
| --- | :---: | :---: | :---: |
| `completion-prop-template` | ✓ | ✓ | ✓ |
| `definition-component` | ✓ | ✓ | ✓ |
| `definition-prop-attr` | ✓ | ✓ | ✓ |
| `diagnostics-clear-after-fix` | ✓ | **✗** | **✗** |
| `diagnostics-template` | ✓ | **✗** | **✗** |
| `document-symbol-structure` | ✓ | ✓ | ✓ |
| `hover-template-binding` | ✓ | ✓ | **✗** |
| `references-prop-template` | ✓ | ✓ | **✗** |
| `rename-prop-template` | ✓ | ✓ | **✗** |

<details><summary>Failure detail</summary>

- `diagnostics-template` · **vize** — no diagnostic mentioning plantedBadProp within 20000ms — no diagnostics published
- `diagnostics-clear-after-fix` · **vize** — cannot confirm clear: planted plantedBadProp never appeared
- `hover-template-binding` · **verter** — empty hover payload at {{ greeting }} after 30394.1ms of readiness retries
- `references-prop-template` · **verter** — references returned nothing
- `rename-prop-template` · **verter** — rename request failed: {"code":-32803,"message":"verter: rename is unavailable for public component props because complete cross-file usage proof is unavailable; no rename edit was produced."}
- `diagnostics-template` · **verter** — no diagnostic mentioning plantedBadProp within 20000ms — no diagnostics published
- `diagnostics-clear-after-fix` · **verter** — cannot confirm clear: planted plantedBadProp never appeared

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.7) | 61.15 / 89.54 / 61.15 | 1.14 / 1.87 / 1.49 | 450 | 10.9 | 443 | 3 |
| LSP vize (server process, Node shim) | 113.33 / 170.49 / 113.33 | 0.85 / 1.83 / 1.22 | 100 | 11.5 | 336 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) | 389.81 / 532.32 / 389.81 | 0.94 / 2.63 / 1.70 | 630 | 7.9 | 1504 | 3 |

<details><summary>Notes</summary>

- **LSP verter (server process, npm 0.0.1-beta.7)** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP vize (server process, Node shim)** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP Volar — Vue server process only (TypeScript half not sampled)** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.

</details>

## Tool versions

<details><summary>Every pinned package in this run</summary>

| Package | Version |
| --- | --- |
| node | v22.23.3 |
| vue | 3.5.44 |
| vue-36 | 3.6.0-rc.12 |
| @vue/compiler-sfc | 3.5.44 |
| @vue/compiler-sfc-36 | 3.6.0-rc.12 |
| vize | 0.481.0 |
| @vizejs/native | 0.481.0 |
| @verter/native | 0.0.1-beta.7 |
| @fervid/napi | 0.4.1 |
| verter-tsc | 0.0.1-beta.7 |
| @verter/component-meta | 0.0.1-beta.7 |
| verter-lsp | 0.0.1-beta.7 |
| verter-mcp | 0.0.1-beta.7 |
| @vue/language-server | 3.3.13 |
| @vue/typescript-plugin | 3.3.13 |
| typescript-language-server | 6.0.2 |
| vue-tsc | 3.3.13 |
| vue-component-meta | 3.3.13 |
| golar | 0.1.11 |
| @golar/vue | 0.1.11 |
| prettier | 3.9.10 |
| oxfmt | 0.73.0 |
| oxlint | 1.88.0 |
| eslint-plugin-vue | 10.11.1 |
| @biomejs/biome | 2.5.15 |
| typescript | 6.0.3 |
| cli:vize | 0.481.0 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.7 |
| cli:golar | 0.1.11 |
| cli:prettier | 3.9.10 |
| cli:oxfmt | 0.73.0 |
| cli:oxlint | 1.88.0 |
| cli:biome | 2.5.15 |
| vue-jsx-vapor | 3.2.28 |
| @vue-jsx-vapor/compiler-rs | 3.2.28 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.7 |

</details>
