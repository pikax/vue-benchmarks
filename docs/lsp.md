# LSP and IDE operations

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-09-18T13:42:39.794Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`9db7b15`](https://github.com/pikax/vue-benchmarks/commit/9db7b15d6a8266ab757541d4f5e3a2a6ae13d2b6)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/35350720887
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
| Verter | **317.3 ms** | 314.9 ms | 1.9 ms | 0.6% | 1.00x | 113 | 3 files/s | 139.3 + 121.3 = 260.6 MB |
| Vize | **393.2 ms** | 378.7 ms | 8.5 ms | 2.2% | 1.24x | 113 | 3 files/s | 74.2 + 192.1 = 266.3 MB |
| Volar (N) | **422.0 ms** | 418.4 ms | 6.4 ms | 1.5% | 1.33x | 114 | 2 files/s | – |
| Volar (JS) | **1.19 s** | 1.17 s | 24.5 ms | 2.1% | 3.75x | 114 | 1 files/s | 292.2 + 267.6 = 559.9 MB |

<details><summary>Notes</summary>

- **Verter**: verter-lsp stdio, the native server from the published npm package. $/verter/ready is OBSERVED, never waited for — its workspace load is inside the timed open→hover window like every other server's. | engine: tsgo 7.0.2 (typescript-go@7.0.2 → @typescript/typescript-linux-x64) | init=5ms · ready=185ms · open→hover=316ms · hoverCold=17ms · hoverWarm=44ms · completion=2ms · definition=3ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry (bin/vize → NAPI addon under Node) because no version-matched native server was found; this costs ~35ms of Node bootstrap per spawn, inside initialize (/opt/hostedtoolcache/node/22.23.2/x64/bin/node). Set VIZE_LSP_BIN to pin a specific binary. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a. | engine: tsgo (bundled) | init=38ms · ready=n/a · open→hover=401ms · hoverCold=5ms · hoverWarm=4ms · completion=9ms · definition=4ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (N)**: Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.17.tsgo.7.0.2 tsdk. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer. | engine: tsgo 7.0.2 via TNB 6.0.3-bridge.17.tsgo.7.0.2 | init=566ms · ready=n/a · open→hover=419ms · hoverCold=13ms · hoverWarm=2ms · completion=6ms · definition=4ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)
- **Volar (JS)**: Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover. | engine: TypeScript 6.0.3 (JS) | init=564ms · ready=n/a · open→hover=1191ms · hoverCold=45ms · hoverWarm=2ms · completion=23ms · definition=11ms | hover verified: returns a TypeScript type for `benchMarker` in &lt;script setup> AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)

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

- **Verter**: 319.5 ms, 318.6 ms, 317.3 ms, 314.9 ms, 316.2 ms
- **Vize**: 385.3 ms, 394.0 ms, 378.7 ms, 393.2 ms, 400.8 ms
- **Volar (N)**: 422.0 ms, 433.9 ms, 418.4 ms, 427.5 ms, 419.5 ms
- **Volar (JS)**: 1.22 s, 1.23 s, 1.19 s, 1.17 s, 1.19 s

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
| Verter | **4.1 ms** | 3.8 ms | 0.6 ms | 13.0% ⚠ | 1.00x | n/a | n/a |
| Vize | **36.1 ms** | 33.9 ms | 1.8 ms | 4.9% | 8.76x | n/a | n/a |
| Volar (N) | **458.5 ms** | 449.6 ms | 6.0 ms | 1.3% | 111.27x | n/a | n/a |
| Volar (JS) | **459.3 ms** | 446.8 ms | 15.9 ms | 3.4% | 111.47x | n/a | n/a |

<details><summary>Notes</summary>

- **Verter**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? (none)
- **Vize**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo (bundled)
- **Volar (N)**: LSP initialize handshake after spawn (not first-request latency) | engine: tsgo ? via TNB ?
- **Volar (JS)**: LSP initialize handshake after spawn (not first-request latency) | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 4.6 ms, 4.0 ms, 4.1 ms, 3.8 ms, 4.0 ms, 3.9 ms, 6.5 ms, 4.0 ms, 4.3 ms, 4.1 ms, 4.0 ms, 4.2 ms, 4.1 ms, 4.1 ms, 4.1 ms, 4.8 ms, 4.2 ms, 4.3 ms, 4.1 ms, 4.3 ms, 4.6 ms
- **Vize**: 35.6 ms, 34.5 ms, 36.1 ms, 37.4 ms, 35.4 ms, 34.5 ms, 35.1 ms, 35.6 ms, 38.1 ms, 39.9 ms, 34.6 ms, 38.7 ms, 36.4 ms, 34.9 ms, 36.1 ms, 35.7 ms, 36.4 ms, 36.6 ms, 40.7 ms, 33.9 ms, 36.9 ms
- **Volar (N)**: 456.4 ms, 459.1 ms, 457.4 ms, 469.9 ms, 467.5 ms, 455.9 ms, 457.9 ms, 461.3 ms, 450.5 ms, 458.5 ms, 455.3 ms, 465.7 ms, 451.1 ms, 449.6 ms, 470.6 ms, 453.7 ms, 458.4 ms, 462.4 ms, 459.4 ms, 463.7 ms, 463.5 ms
- **Volar (JS)**: 497.1 ms, 511.4 ms, 484.5 ms, 462.1 ms, 458.8 ms, 466.4 ms, 470.0 ms, 459.5 ms, 453.0 ms, 455.5 ms, 459.3 ms, 454.5 ms, 459.9 ms, 458.3 ms, 454.0 ms, 453.1 ms, 460.7 ms, 454.0 ms, 469.6 ms, 446.8 ms, 449.2 ms

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
| Vize | **0.5 ms** | 0.5 ms | 0.1 ms | 21.1% ⚠ | 1.00x | 15 | n/a |
| Verter | **30.4 ms** | 27.9 ms | 4.5 ms | 14.2% ⚠ | 57.69x | 53 | n/a |
| Volar (N) | **122.5 ms** | 120.4 ms | 3.6 ms | 2.9% | 232.13x | 48 | n/a |
| Volar (JS) | **637.1 ms** | 611.7 ms | 28.8 ms | 4.5% | 1207.23x | 48 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.7 ms, 0.5 ms, 0.5 ms
- **Verter**: 30.4 ms, 27.9 ms, 36.6 ms
- **Volar (N)**: 127.5 ms, 120.4 ms, 122.5 ms
- **Volar (JS)**: 611.7 ms, 637.1 ms, 669.1 ms

</details>

#### Semantic tokens (delta after edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit-dark.svg">
  <img alt="IDE · Background (editor chatter) — Semantic tokens (delta after edit)" src="charts/lsp-ide-ide-background-semantic-tokens-delta-after-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (1.0 ms) | (1.0 ms) | – | – | not ranked | – | – |
| Volar (N) ⚠ | (1.1 ms) | (1.1 ms) | – | – | not ranked | – | – |
| Vize ⚠ | (60.7 ms) | (51.8 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1789738363445", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Unhandled method textDocument/semanticTokens/full/delta); the full request DID return resultId "1789738371485", which invites a delta | Sample: "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}" | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — not implemented (JSON-RPC -32601: Method not found); the full request returned no resultId | Sample: "{\"code\":-32601,\"message\":\"Method not found\"}" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.0 ms, 1.1 ms, 1.0 ms
- **Volar (N)**: 1.1 ms, 1.2 ms, 1.1 ms
- **Vize**: 62.0 ms, 51.8 ms, 60.7 ms
- **Verter**: 0.6 ms, 0.5 ms, 0.5 ms

</details>

#### Document symbols (outline)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-symbols-outline-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document symbols (outline)" src="charts/lsp-ide-ide-background-document-symbols-outline.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **0.7 ms** | 0.7 ms | 0.1 ms | 12.4% ⚠ | 1.00x | 11 | n/a |
| Volar (JS) | **16.8 ms** | 15.9 ms | 0.7 ms | 4.2% | 22.73x | 25 | n/a |
| Volar (N) | **19.7 ms** | 19.5 ms | 0.2 ms | 0.8% | 26.69x | 25 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (2) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — outline is missing 7/7 script symbols: heading, nextLabel, threshold, entries, visibleEntries, formatEntry, addEntry | Sample: "2 symbols: template, script setup" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 0.9 ms, 0.7 ms, 0.7 ms
- **Volar (JS)**: 15.9 ms, 17.3 ms, 16.8 ms
- **Volar (N)**: 19.5 ms, 19.9 ms, 19.7 ms
- **Vize**: 0.3 ms, 0.4 ms, 0.3 ms

</details>

#### Document highlight (caret move)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-document-highlight-caret-move-dark.svg">
  <img alt="IDE · Background (editor chatter) — Document highlight (caret move)" src="charts/lsp-ide-ide-background-document-highlight-caret-move.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.2 ms | 0.0 ms | 12.6% ⚠ | 1.00x | 4 | n/a |
| Verter | **0.3 ms** | 0.3 ms | 0.1 ms | 35.3% ⚠ | 1.40x | 4 | n/a |
| Volar (JS) | **18.7 ms** | 17.6 ms | 1.2 ms | 6.6% | 88.44x | 5 | n/a |
| Volar (N) | **34.4 ms** | 33.3 ms | 0.8 ms | 2.3% | 162.82x | 5 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.5 ms, 0.3 ms, 0.3 ms
- **Volar (JS)**: 17.6 ms, 20.1 ms, 18.7 ms
- **Volar (N)**: 34.9 ms, 33.3 ms, 34.4 ms

</details>

#### Inlay hints (document range)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-inlay-hints-document-range-dark.svg">
  <img alt="IDE · Background (editor chatter) — Inlay hints (document range)" src="charts/lsp-ide-ide-background-inlay-hints-document-range.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 0.3 ms | 0.1 ms | 15.6% ⚠ | 1.00x | 2 | n/a |
| Volar (JS) | **77.1 ms** | 66.9 ms | 6.6 ms | 8.9% | 186.20x | 14 | n/a |
| Volar (N) | **209.2 ms** | 200.0 ms | 7.4 ms | 3.5% | 504.94x | 14 | n/a |
| Verter ⚠ | (0.2 ms) | (0.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — returned null — no inlay hints for a document full of inferable bindings | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.5 ms, 0.4 ms, 0.3 ms
- **Volar (JS)**: 77.1 ms, 79.3 ms, 66.9 ms
- **Volar (N)**: 200.0 ms, 214.6 ms, 209.2 ms
- **Verter**: 0.3 ms, 0.2 ms, 0.2 ms

</details>

#### Folding ranges

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-background-folding-ranges-dark.svg">
  <img alt="IDE · Background (editor chatter) — Folding ranges" src="charts/lsp-ide-ide-background-folding-ranges.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.2 ms** | 0.1 ms | 0.1 ms | 25.5% ⚠ | 1.00x | 9 | n/a |
| Verter | **0.2 ms** | 0.2 ms | 0.0 ms | 7.6% | 1.11x | 2 | n/a |
| Volar (JS) ⚠ | (108.5 ms) | (12.6 ms) | – | – | not ranked | (13) | – |
| Volar (N) ⚠ | (6.8 ms) | (6.0 ms) | – | – | not ranked | (13) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 74.2% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Volar (N) ⚠**: content verified | engine: tsgo ? via TNB ? | ⚠ TOO NOISY TO RANK — CV 74.6% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.1 ms
- **Verter**: 0.3 ms, 0.2 ms, 0.2 ms
- **Volar (JS)**: 12.6 ms, 126.6 ms, 108.5 ms
- **Volar (N)**: 6.8 ms, 20.8 ms, 6.0 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 74.3 MB | 172.3 MB | **246.6 MB** |
| Verter | 138.7 MB | 111.8 MB | **250.5 MB** |
| Volar (JS) | 276.8 MB | 256.9 MB | **533.6 MB** |
| Volar (N) | 293.8 MB | 387.3 MB | **681.1 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.5) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Vize | **0.7 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.1 ms | 46.6% ⚠ | 1.00x | 3 | n/a |
| Volar (N) | **360.9 ms** | 519.21x | **23.0 ms** | 20.4 ms | 5.4 ms | 22.0% ⚠ | 123.07x | 3 | n/a |
| Volar (JS) | **958.0 ms** | 1378.11x | **19.9 ms** | 16.8 ms | 3.8 ms | 18.5% ⚠ | 106.51x | 3 | n/a |
| Verter ⚠ | (282.2 ms) | not ranked | (1.9 ms) | (1.8 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 145.0% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.4 ms, 0.2 ms
- **Volar (N)**: 30.8 ms, 20.4 ms, 23.0 ms
- **Volar (JS)**: 16.8 ms, 24.3 ms, 19.9 ms
- **Verter**: 30.4 ms, 1.9 ms, 1.8 ms

</details>

#### Completion: component tag &lt;Ch

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-component-tag-ch-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: component tag &lt;Ch" src="charts/lsp-ide-ide-completion-completion-component-tag-ch.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **113.5 ms** | 1.00x | **32.8 ms** | 32.6 ms | 0.7 ms | 2.2% | 1.36x | 192 | n/a |
| Volar (N) | **131.1 ms** | 1.16x | **38.7 ms** | 36.3 ms | 2.0 ms | 5.2% | 1.60x | 192 | n/a |
| Verter | **182.5 ms** | 1.61x | **24.2 ms** | 23.7 ms | 4.1 ms | 15.6% ⚠ | 1.00x | 1,193 | n/a |
| Vize ⚠ | (66.5 ms) | not ranked | (0.6 ms) | (0.6 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `ChildCard` component tag in 42 items | Sample: "[v-if, v-else-if, v-else, v-for, v-on, v-bind, v-model, v-slot, v-show, v-pre, v-once, v-memo, …+30]" | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 32.8 ms, 34.0 ms, 32.6 ms
- **Volar (N)**: 40.3 ms, 36.3 ms, 38.7 ms
- **Verter**: 23.7 ms, 31.1 ms, 24.2 ms
- **Vize**: 0.6 ms, 0.6 ms, 0.6 ms

</details>

#### Completion: prop name &lt;C :

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-prop-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: prop name &lt;C :" src="charts/lsp-ide-ide-completion-completion-prop-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.0 ms | 5.5% | 1.00x | 4 | n/a |
| Verter | **6.5 ms** | 23.88x | **5.8 ms** | 4.4 ms | 2.0 ms | 31.9% ⚠ | 27.23x | 201 | n/a |
| Volar (N) | **33.1 ms** | 120.94x | **7.1 ms** | 6.9 ms | 0.3 ms | 3.7% | 33.26x | 26 | n/a |
| Volar (JS) | **183.3 ms** | 669.37x | **152.7 ms** | 137.4 ms | 28.9 ms | 17.9% ⚠ | 716.38x | 26 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 4.4 ms, 5.8 ms, 8.2 ms
- **Volar (N)**: 7.1 ms, 6.9 ms, 7.4 ms
- **Volar (JS)**: 193.3 ms, 137.4 ms, 152.7 ms

</details>

#### Completion: event name &lt;C @

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-event-name-c-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: event name &lt;C @" src="charts/lsp-ide-ide-completion-completion-event-name-c.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **6.8 ms** | 1.00x | **5.9 ms** | 5.3 ms | 0.4 ms | 7.6% | 1.00x | 25 | n/a |
| Volar (JS) ⚠ | (14.8 ms) | not ranked | (7.9 ms) | (5.7 ms) | – | – | not ranked | (25) | – |
| Vize ⚠ | (0.2 ms) | not ranked | (0.2 ms) | (0.2 ms) | – | – | not ranked | (12) | – |
| Verter ⚠ | (0.5 ms) | not ranked | (0.4 ms) | (0.3 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 145.8% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Vize ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 12 items | Sample: "[v-on, @, @click, @input, @change, @submit, @keydown, @keyup, @focus, @blur, @mouseenter, @mouseleave]" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — cold: no `quench` declared emit in 0 items | Sample: "(empty list)" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 6.2 ms, 5.3 ms, 5.9 ms
- **Volar (JS)**: 115.4 ms, 7.9 ms, 5.7 ms
- **Vize**: 0.2 ms, 0.2 ms, 0.2 ms
- **Verter**: 0.3 ms, 0.4 ms, 0.4 ms

</details>

#### Completion: directive v-

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-directive-v-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: directive v-" src="charts/lsp-ide-ide-completion-completion-directive-v.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 1.00x | **0.2 ms** | 0.2 ms | 0.0 ms | 5.3% | 1.00x | 15 | n/a |
| Verter | **0.5 ms** | 1.89x | **0.4 ms** | 0.3 ms | 0.1 ms | 16.9% ⚠ | 1.75x | 29 | n/a |
| Volar (N) | **25.2 ms** | 99.16x | **12.3 ms** | 11.4 ms | 0.6 ms | 5.2% | 50.15x | 498 | n/a |
| Volar (JS) ⚠ | (30.9 ms) | not ranked | (18.0 ms) | (11.2 ms) | – | – | not ranked | (498) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 103.9% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.2 ms, 0.3 ms
- **Verter**: 0.3 ms, 0.4 ms, 0.4 ms
- **Volar (N)**: 12.3 ms, 11.4 ms, 12.6 ms
- **Volar (JS)**: 11.2 ms, 18.0 ms, 79.6 ms

</details>

#### Completion: slot name &lt;template #

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-slot-name-template-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: slot name &lt;template #" src="charts/lsp-ide-ide-completion-completion-slot-name-template.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.4 ms** | 1.00x | **0.4 ms** | 0.3 ms | 0.0 ms | 5.6% | 1.00x | 30 | n/a |
| Verter | **0.4 ms** | 1.02x | **0.4 ms** | 0.3 ms | 0.1 ms | 32.9% ⚠ | 1.00x | 2 | n/a |
| Volar (N) | **15.1 ms** | 39.35x | **13.0 ms** | 12.4 ms | 1.2 ms | 8.7% | 36.71x | 500 | n/a |
| Volar (JS) | **15.9 ms** | 41.41x | **14.4 ms** | 13.8 ms | 1.0 ms | 6.8% | 40.79x | 500 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.4 ms, 0.3 ms, 0.4 ms
- **Verter**: 0.3 ms, 0.5 ms, 0.4 ms
- **Volar (N)**: 14.6 ms, 12.4 ms, 13.0 ms
- **Volar (JS)**: 14.4 ms, 15.8 ms, 13.8 ms

</details>

#### Completion: auto-import

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-completion-auto-import-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Completion: auto-import" src="charts/lsp-ide-ide-completion-completion-auto-import.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **33.6 ms** | 28.9 ms | 4.2 ms | 12.7% ⚠ | 1.00x | 1,073 | n/a |
| Volar (N) | **61.0 ms** | 36.7 ms | 14.0 ms | 26.5% ⚠ | 1.82x | 1,073 | n/a |
| Vize ⚠ | (249.2 ms) | (240.0 ms) | – | – | not ranked | (1,103) | – |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | (9) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — `computed` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import | Sample: "offered: \"getComputedStyle\" kind=3 ; \"computed\" kind=6 ; \"computed\" kind=3 detail=\"function computed&lt;T>(getter: () => T): ComputedRef&lt;T>\"" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — no `computed` in 9 items | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 37.4 ms, 33.6 ms, 28.9 ms
- **Volar (N)**: 61.0 ms, 36.7 ms, 61.0 ms
- **Vize**: 240.0 ms, 249.2 ms, 249.6 ms
- **Verter**: 0.3 ms, 0.5 ms, 0.4 ms

</details>

#### Resolve: auto-import edit

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-auto-import-edit-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: auto-import edit" src="charts/lsp-ide-ide-completion-resolve-auto-import-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **47.6 ms** | 46.0 ms | 1.5 ms | 3.2% | 1.00x | 241 | n/a |
| Volar (JS) | **48.0 ms** | 35.6 ms | 7.7 ms | 17.4% ⚠ | 1.01x | 241 | n/a |
| Vize ⚠ | (0.3 ms) | (0.3 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (0.0 ms) | (0.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — resolve returned no import edit for `computed` | Sample: "\"computed\" kind=6" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — auto-import completion offered no `computed` item to resolve | Sample: "[headline, visible, probe, chosen, onDismiss, derived, ref, ChildCard, SiblingCard]" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 47.6 ms, 46.0 ms, 49.1 ms
- **Volar (JS)**: 48.0 ms, 49.7 ms, 35.6 ms
- **Vize**: 0.4 ms, 0.3 ms, 0.3 ms
- **Verter**: 0.0 ms, 0.0 ms, 0.0 ms

</details>

#### Resolve: script member detail

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-completion-resolve-script-member-detail-dark.svg">
  <img alt="IDE · Completion (8 contexts, content-gated) — Resolve: script member detail" src="charts/lsp-ide-ide-completion-resolve-script-member-detail.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.1 ms** | 0.1 ms | 0.0 ms | 22.0% ⚠ | 1.00x | 75 | n/a |
| Volar (JS) | **3.3 ms** | 2.5 ms | 0.5 ms | 15.5% ⚠ | 25.11x | 25 | n/a |
| Verter | **4.6 ms** | 4.2 ms | 0.8 ms | 16.4% ⚠ | 35.10x | 25 | n/a |
| Volar (N) | **8.0 ms** | 7.9 ms | 0.1 ms | 1.8% | 60.60x | 25 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.2 ms, 0.1 ms, 0.1 ms
- **Volar (JS)**: 3.3 ms, 3.4 ms, 2.5 ms
- **Verter**: 4.6 ms, 5.7 ms, 4.2 ms
- **Volar (N)**: 8.0 ms, 7.9 ms, 8.2 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 76.7 MB | 232.4 MB | **309.1 MB** |
| Verter | 150.4 MB | 180.4 MB | **330.8 MB** |
| Volar (JS) | 296.6 MB | 287.8 MB | **584.4 MB** |
| Volar (N) | 308.5 MB | 388.6 MB | **697.0 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.5) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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

- **Volar (JS)**: content verified | NOT RANKED (informational) — measured 1.01 s, min 1.01 s, CV 1.4%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | NOT RANKED (informational) — measured 439.7 ms, min 426.8 ms, CV 2.4%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? via TNB ?
- **Vize**: content verified | NOT RANKED (informational) — measured 1.27 s, min 1.26 s, CV 0.4%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo (bundled)
- **Verter**: content verified | NOT RANKED (informational) — measured 318.4 ms, min 317.4 ms, CV 1.4%: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 1.03 s, 1.01 s, 1.01 s
- **Volar (N)**: 426.8 ms, 447.5 ms, 439.7 ms
- **Vize**: 1.27 s, 1.26 s, 1.27 s
- **Verter**: 325.6 ms, 318.4 ms, 317.4 ms

</details>

#### Edit plants type error -> reported

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit plants type error -> reported" src="charts/lsp-ide-ide-edit-loop-edit-plants-type-error-reported.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **101.9 ms** | 99.3 ms | 2.1 ms | 2.0% | 1.00x | 1 | n/a |
| Volar (JS) | **360.6 ms** | 354.6 ms | 4.0 ms | 1.1% | 3.54x | 1 | n/a |
| Volar (N) | **432.9 ms** | 411.3 ms | 22.2 ms | 5.1% | 4.25x | 1 | n/a |
| Verter | **483.3 ms** | 481.5 ms | 7.4 ms | 1.5% | 4.74x | 1 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 103.4 ms, 99.3 ms, 101.9 ms
- **Volar (JS)**: 360.6 ms, 362.3 ms, 354.6 ms
- **Volar (N)**: 411.3 ms, 432.9 ms, 455.7 ms
- **Verter**: 483.3 ms, 495.0 ms, 481.5 ms

</details>

#### Edit fixes it -> diagnostic clears

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Edit fixes it -> diagnostic clears" src="charts/lsp-ide-ide-edit-loop-edit-fixes-it-diagnostic-clears.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **41.8 ms** | 40.9 ms | 0.9 ms | 2.2% | 1.00x | 0 | n/a |
| Volar (N) | **382.2 ms** | 381.8 ms | 0.5 ms | 0.1% | 9.15x | 0 | n/a |
| Volar (JS) | **458.2 ms** | 452.4 ms | 6.3 ms | 1.4% | 10.97x | 0 | n/a |
| Verter | **654.0 ms** | 650.4 ms | 8.4 ms | 1.3% | 15.65x | 0 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 41.8 ms, 40.9 ms, 42.7 ms
- **Volar (N)**: 382.2 ms, 381.8 ms, 382.8 ms
- **Volar (JS)**: 452.4 ms, 464.9 ms, 458.2 ms
- **Verter**: 654.0 ms, 650.4 ms, 666.4 ms

</details>

#### Hover after retype -> NEW type

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Hover after retype -> NEW type" src="charts/lsp-ide-ide-edit-loop-hover-after-retype-new-type.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **17.5 ms** | 16.6 ms | 1.2 ms | 6.9% | 1.00x | 47 | n/a |
| Volar (JS) | **50.9 ms** | 49.9 ms | 2.5 ms | 4.9% | 2.91x | 47 | n/a |
| Vize | **85.9 ms** | 84.4 ms | 9.6 ms | 10.5% ⚠ | 4.91x | 40 | n/a |
| Verter | **89.0 ms** | 76.3 ms | 22.6 ms | 23.7% ⚠ | 5.09x | 40 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 19.0 ms, 17.5 ms, 16.6 ms
- **Volar (JS)**: 54.7 ms, 49.9 ms, 50.9 ms
- **Vize**: 85.9 ms, 84.4 ms, 101.6 ms
- **Verter**: 76.3 ms, 120.1 ms, 89.0 ms

</details>

#### ... same hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... same hover, time to correct" src="charts/lsp-ide-ide-edit-loop-same-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **17.5 ms** | 16.6 ms | 1.2 ms | 6.9% | 1.00x | 1 | n/a |
| Volar (JS) | **50.9 ms** | 49.9 ms | 2.5 ms | 4.9% | 2.91x | 1 | n/a |
| Vize | **85.9 ms** | 84.4 ms | 9.6 ms | 10.5% ⚠ | 4.91x | 1 | n/a |
| Verter | **89.0 ms** | 76.3 ms | 22.6 ms | 23.7% ⚠ | 5.09x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 19.0 ms, 17.5 ms, 16.6 ms
- **Volar (JS)**: 54.7 ms, 49.9 ms, 50.9 ms
- **Vize**: 85.9 ms, 84.4 ms, 101.6 ms
- **Verter**: 76.3 ms, 120.1 ms, 89.0 ms

</details>

#### Steady state: edits 1-5 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 1-5 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-1-5-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **15.6 ms** | 14.3 ms | 1.1 ms | 7.2% | 1.00x | n/a | n/a |
| Volar (JS) | **37.4 ms** | 36.8 ms | 1.1 ms | 2.9% | 2.39x | n/a | n/a |
| Verter | **68.1 ms** | 61.6 ms | 13.8 ms | 19.1% ⚠ | 4.35x | n/a | n/a |
| Vize | **89.7 ms** | 84.7 ms | 7.8 ms | 8.5% | 5.74x | n/a | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 16.5 ms, 14.3 ms, 15.6 ms
- **Volar (JS)**: 36.8 ms, 38.9 ms, 37.4 ms
- **Verter**: 88.1 ms, 61.6 ms, 68.1 ms
- **Vize**: 100.0 ms, 89.7 ms, 84.7 ms

</details>

#### Steady state: edits 6-10 (median)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Steady state: edits 6-10 (median)" src="charts/lsp-ide-ide-edit-loop-steady-state-edits-6-10-median.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **14.4 ms** | 13.4 ms | 1.4 ms | 9.3% | 1.00x | 0 | n/a |
| Volar (JS) | **31.0 ms** | 30.8 ms | 1.9 ms | 6.1% | 2.15x | -6 | n/a |
| Verter | **55.2 ms** | 50.9 ms | 5.2 ms | 9.4% | 3.83x | -37 | n/a |
| Vize | **84.4 ms** | 80.7 ms | 3.4 ms | 4.1% | 5.86x | -16 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 16.1 ms, 14.4 ms, 13.4 ms
- **Volar (JS)**: 30.8 ms, 34.2 ms, 31.0 ms
- **Verter**: 50.9 ms, 61.3 ms, 55.2 ms
- **Vize**: 84.4 ms, 80.7 ms, 87.5 ms

</details>

#### Child prop retype -> Parent diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent diagnostic" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **76.1 ms** | 73.0 ms | 7.5 ms | 9.5% | 1.00x | 1 | n/a |
| Volar (N) | **381.7 ms** | 381.4 ms | 0.5 ms | 0.1% | 5.01x | 1 | n/a |
| Volar (JS) | **381.9 ms** | 374.6 ms | 5.8 ms | 1.5% | 5.02x | 1 | n/a |
| Verter | **688.0 ms** | 684.2 ms | 39.0 ms | 5.5% | 9.04x | 1 | n/a |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 76.1 ms, 73.0 ms, 87.3 ms
- **Volar (N)**: 381.4 ms, 381.7 ms, 382.4 ms
- **Volar (JS)**: 374.6 ms, 381.9 ms, 386.0 ms
- **Verter**: 684.2 ms, 688.0 ms, 753.6 ms

</details>

#### Child prop retype -> Parent hover

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — Child prop retype -> Parent hover" src="charts/lsp-ide-ide-edit-loop-child-prop-retype-parent-hover.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **59.3 ms** | 58.8 ms | 7.5 ms | 11.9% ⚠ | 1.00x | 42 | n/a |
| Vize | **76.2 ms** | 73.2 ms | 7.6 ms | 9.6% | 1.28x | 239 | n/a |
| Volar (JS) | **96.9 ms** | 92.9 ms | 3.5 ms | 3.6% | 1.63x | 42 | n/a |
| Verter ⚠ | (1.5 ms) | (1.5 ms) | – | – | not ranked | (42) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: ⚠ FAILED VALIDATION — STALE: still reports `label: string` after the edit changed it to `number` (the same position answered `string` before the edit, so the feature works here — this is the edit loop; caught up after 444ms) | Sample: "```typescript\n(property) label: string\n```" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 72.1 ms, 59.3 ms, 58.8 ms
- **Vize**: 76.2 ms, 73.2 ms, 87.5 ms
- **Volar (JS)**: 96.9 ms, 92.9 ms, 99.9 ms
- **Verter**: 1.5 ms, 1.5 ms, 1.5 ms

</details>

#### ... Parent hover, time to correct

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct-dark.svg">
  <img alt="IDE · Edit loop (type, wait, hover) — ... Parent hover, time to correct" src="charts/lsp-ide-ide-edit-loop-parent-hover-time-to-correct.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **59.3 ms** | 58.8 ms | 7.5 ms | 11.9% ⚠ | 1.00x | 1 | n/a |
| Vize | **76.2 ms** | 73.2 ms | 7.6 ms | 9.6% | 1.28x | 1 | n/a |
| Volar (JS) | **96.9 ms** | 92.9 ms | 3.5 ms | 3.6% | 1.63x | 1 | n/a |
| Verter | **500.7 ms** | 444.1 ms | 34.3 ms | 7.1% | 8.44x | 3 | n/a |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 72.1 ms, 59.3 ms, 58.8 ms
- **Vize**: 76.2 ms, 73.2 ms, 87.5 ms
- **Volar (JS)**: 96.9 ms, 92.9 ms, 99.9 ms
- **Verter**: 444.1 ms, 500.7 ms, 505.9 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Vize | 74.7 MB | 294.8 MB | **369.4 MB** |
| Volar (JS) | 292.4 MB | 310.2 MB | **602.6 MB** |
| Volar (N) | 304.1 MB | 395.1 MB | **699.1 MB** |
| Verter | 38.3 MB | 759.5 MB | **797.8 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- `didOpen -> first diagnostics` is MEASURED BUT NOT RANKED: the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures. Its median column is empty by design; the measured time is in the row's note and under Raw runs.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.5) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Vize | **71.9 ms** | 1.00x | **0.3 ms** | 0.3 ms | 0.0 ms | 12.9% ⚠ | 1.00x | 1 | n/a |
| Volar (N) | **389.1 ms** | 5.41x | **19.8 ms** | 17.2 ms | 1.7 ms | 8.8% | 75.03x | 1 | n/a |
| Volar (JS) | **1.01 s** | 14.05x | **164.0 ms** | 163.8 ms | 0.2 ms | 0.1% | 621.03x | 1 | n/a |
| Verter ⚠ | (47.2 ms) | not ranked | (6.0 ms) | (2.1 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 67.7% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.3 ms, 0.3 ms
- **Volar (N)**: 19.8 ms, 20.3 ms, 17.2 ms
- **Volar (JS)**: 163.8 ms, 164.2 ms, 164.0 ms
- **Verter**: 10.6 ms, 2.1 ms, 6.0 ms

</details>

#### Definition: imported fn (script)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-definition-imported-fn-script-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Definition: imported fn (script)" src="charts/lsp-ide-ide-navigation-definition-imported-fn-script.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **296.3 ms** | 1.00x | **5.4 ms** | 5.2 ms | 0.1 ms | 2.6% | 1.00x | 1 | n/a |
| Volar (N) | **379.3 ms** | 1.28x | **22.3 ms** | 19.9 ms | 1.4 ms | 6.4% | 4.13x | 1 | n/a |
| Volar (JS) | **977.7 ms** | 3.30x | **163.2 ms** | 162.6 ms | 1.8 ms | 1.1% | 30.30x | 1 | n/a |
| Verter ⚠ | (47.3 ms) | not ranked | (1.3 ms) | (0.6 ms) | – | – | not ranked | (1) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Verter ⚠**: content verified | engine: tsgo ? (none) | ⚠ TOO NOISY TO RANK — CV 134.4% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Vize**: 5.4 ms, 5.2 ms, 5.4 ms
- **Volar (N)**: 19.9 ms, 22.3 ms, 22.3 ms
- **Volar (JS)**: 163.2 ms, 166.1 ms, 162.6 ms
- **Verter**: 0.6 ms, 10.5 ms, 1.3 ms

</details>

#### Type definition: typed binding

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-type-definition-typed-binding-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Type definition: typed binding" src="charts/lsp-ide-ide-navigation-type-definition-typed-binding.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **7.4 ms** | 6.9 ms | 0.4 ms | 5.8% | 1.00x | 1 | n/a |
| Volar (N) | **17.2 ms** | 15.6 ms | 1.1 ms | 6.7% | 2.32x | 1 | n/a |
| Vize | **227.4 ms** | 225.6 ms | 3.0 ms | 1.3% | 30.77x | 1 | n/a |
| Verter | **260.3 ms** | 248.9 ms | 35.4 ms | 12.9% ⚠ | 35.21x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize**: content verified | engine: tsgo (bundled)
- **Verter**: content verified | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 7.7 ms, 7.4 ms, 6.9 ms
- **Volar (N)**: 17.8 ms, 17.2 ms, 15.6 ms
- **Vize**: 227.4 ms, 231.5 ms, 225.6 ms
- **Verter**: 248.9 ms, 260.3 ms, 315.1 ms

</details>

#### References: prop -> parent template

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-references-prop-parent-template-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — References: prop -> parent template" src="charts/lsp-ide-ide-navigation-references-prop-parent-template.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **98.5 ms** | 90.4 ms | 5.7 ms | 5.9% | 1.00x | 4 | n/a |
| Volar (JS) | **125.7 ms** | 124.6 ms | 1.7 ms | 1.3% | 1.28x | 4 | n/a |
| Vize ⚠ | (2.5 ms) | (2.0 ms) | – | – | not ranked | (5) | – |
| Verter ⚠ | (164.6 ms) | (99.4 ms) | – | – | not ranked | (3) | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue symbol ranges — found files childcard.vue | Sample: "childcard.vue@2:11 childcard.vue@11:2 childcard.vue@15:38 childcard.vue@16:3 childcard.vue@17:26" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — references missing Parent.vue symbol ranges — found files childcard.vue | Sample: "childcard.vue@11:2 childcard.vue@15:38 childcard.vue@2:11" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 101.4 ms, 98.5 ms, 90.4 ms
- **Volar (JS)**: 124.6 ms, 127.8 ms, 125.7 ms
- **Vize**: 3.2 ms, 2.0 ms, 2.5 ms
- **Verter**: 164.6 ms, 198.6 ms, 99.4 ms

</details>

#### Prepare rename: prop

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-prepare-rename-prop-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Prepare rename: prop" src="charts/lsp-ide-ide-navigation-prepare-rename-prop.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **3.9 ms** | 3.8 ms | 0.2 ms | 5.8% | 1.00x | n/a | n/a |
| Volar (JS) | **5.5 ms** | 5.4 ms | 0.1 ms | 1.1% | 1.41x | n/a | n/a |
| Volar (N) ⚠ | (5.6 ms) | (4.8 ms) | – | – | not ranked | – | – |
| Verter ⚠ | (1.1 ms) | (1.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N) ⚠**: content verified | engine: tsgo ? via TNB ? | ⚠ TOO NOISY TO RANK — CV 70.3% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Verter ⚠**: ⚠ FAILED VALIDATION — prepareRename returned null — server declines to rename at this position | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 3.9 ms, 3.8 ms, 4.3 ms
- **Volar (JS)**: 5.4 ms, 5.5 ms, 5.5 ms
- **Volar (N)**: 15.8 ms, 5.6 ms, 4.8 ms
- **Verter**: 1.1 ms, 2.3 ms, 1.0 ms

</details>

#### Rename prop (cross-file edit)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Rename prop (cross-file edit)" src="charts/lsp-ide-ide-navigation-rename-prop-cross-file-edit.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **3.4 ms** | 3.1 ms | 0.7 ms | 18.8% ⚠ | 1.00x | 4 | n/a |
| Volar (JS) | **3.4 ms** | 3.4 ms | 0.1 ms | 4.0% | 1.01x | 4 | n/a |
| Vize ⚠ | (89.9 ms) | (85.9 ms) | – | – | not ranked | (3) | – |
| Verter ⚠ | (0.4 ms) | (0.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Vize ⚠**: ⚠ FAILED VALIDATION — BROKEN REFACTOR: applied edits changed unrelated SFC semantics or failed to perform the intended edit | Sample: "childcard.vue:2, parent.vue:1 :: applied rename of captionText to renamedCaption; declaration, uses and decoys checked" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — request failed: {"code":-32803,"message":"verter: rename is unavailable for public component props because complete cross-file usage proof is unavailable; no rename edit was produced."} | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 4.4 ms, 3.4 ms, 3.1 ms
- **Volar (JS)**: 3.4 ms, 3.6 ms, 3.4 ms
- **Vize**: 85.9 ms, 89.9 ms, 90.2 ms
- **Verter**: 0.4 ms, 0.3 ms, 0.5 ms

</details>

#### Code action at diagnostic

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-code-action-at-diagnostic-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Code action at diagnostic" src="charts/lsp-ide-ide-navigation-code-action-at-diagnostic.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **33.0 ms** | 30.1 ms | 2.0 ms | 6.1% | 1.00x | 2 | n/a |
| Volar (N) | **689.3 ms** | 672.4 ms | 10.5 ms | 1.5% | 20.90x | 2 | n/a |
| Vize ⚠ | (0.5 ms) | (0.4 ms) | – | – | not ranked | (0) | – |
| Verter ⚠ | (8.8 ms) | (1.9 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Vize ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo (bundled)
- **Verter ⚠**: ⚠ FAILED VALIDATION — codeAction returned nothing at the diagnostic | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 30.1 ms, 33.9 ms, 33.0 ms
- **Volar (N)**: 689.3 ms, 691.7 ms, 672.4 ms
- **Vize**: 0.4 ms, 0.6 ms, 0.5 ms
- **Verter**: 10.3 ms, 8.8 ms, 1.9 ms

</details>

#### Signature help after `(`

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-signature-help-after-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Signature help after `(`" src="charts/lsp-ide-ide-navigation-signature-help-after.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **17.6 ms** | 17.3 ms | 0.5 ms | 2.9% | 1.00x | 1 | n/a |
| Volar (N) | **26.2 ms** | 26.0 ms | 0.3 ms | 1.1% | 1.49x | 1 | n/a |
| Verter | **130.0 ms** | 120.6 ms | 6.5 ms | 5.1% | 7.41x | 1 | n/a |
| Vize | **209.1 ms** | 203.2 ms | 5.0 ms | 2.4% | 11.91x | 1 | n/a |

<details><summary>Notes</summary>

- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 18.2 ms, 17.3 ms, 17.6 ms
- **Volar (N)**: 26.0 ms, 26.5 ms, 26.2 ms
- **Verter**: 130.0 ms, 120.6 ms, 133.2 ms
- **Vize**: 213.0 ms, 209.1 ms, 203.2 ms

</details>

#### Format unformatted SFC

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-navigation-format-unformatted-sfc-dark.svg">
  <img alt="IDE · Navigation & refactor (cross-file) — Format unformatted SFC" src="charts/lsp-ide-ide-navigation-format-unformatted-sfc.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **0.3 ms** | 0.3 ms | 0.0 ms | 12.4% ⚠ | 1.00x | 1 | n/a |
| Volar (JS) | **57.1 ms** | 56.6 ms | 1.9 ms | 3.2% | 167.34x | 1 | n/a |
| Volar (N) | **58.0 ms** | 55.4 ms | 1.7 ms | 3.0% | 170.03x | 1 | n/a |
| Verter ⚠ | (0.3 ms) | (0.2 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Verter ⚠**: ⚠ FAILED VALIDATION — formatting returned null on a deliberately unformatted document | Sample: "null" | engine: tsgo ? (none)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 0.3 ms, 0.4 ms, 0.3 ms
- **Volar (JS)**: 56.6 ms, 60.0 ms, 57.1 ms
- **Volar (N)**: 58.0 ms, 55.4 ms, 58.6 ms
- **Verter**: 0.4 ms, 0.3 ms, 0.2 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 144.2 MB | 196.5 MB | **340.6 MB** |
| Vize | 77.3 MB | 287.8 MB | **365.1 MB** |
| Volar (JS) | 294.2 MB | 254.8 MB | **549.0 MB** |
| Volar (N) | 305.0 MB | 477.5 MB | **782.4 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.5) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Verter | **206.9 ms** | 1.00x | **52.3 ms** | 46.8 ms | 4.9 ms | 9.5% | 19.32x | 89 | n/a |
| Vize | **267.9 ms** | 1.29x | **2.7 ms** | 2.6 ms | 0.0 ms | 1.8% | 1.00x | 89 | n/a |
| Volar (N) | **424.0 ms** | 2.05x | **5.3 ms** | 4.5 ms | 2.5 ms | 39.1% ⚠ | 1.96x | 90 | n/a |
| Volar (JS) ⚠ | (972.9 ms) | not ranked | (6.7 ms) | (5.9 ms) | – | – | not ranked | (90) | – |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS) ⚠**: content verified | engine: TypeScript ? (JS) | ⚠ TOO NOISY TO RANK — CV 155.1% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 52.3 ms, 46.8 ms, 56.6 ms
- **Vize**: 2.7 ms, 2.7 ms, 2.6 ms
- **Volar (N)**: 4.5 ms, 5.3 ms, 9.1 ms
- **Volar (JS)**: 168.9 ms, 5.9 ms, 6.7 ms

</details>

#### Hover (template interpolation)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-ide-ide-smoke-hover-template-interpolation-dark.svg">
  <img alt="IDE · Smoke (reference suite) — Hover (template interpolation)" src="charts/lsp-ide-ide-smoke-hover-template-interpolation.svg">
</picture>

| Tool | **Cold** | vs fastest cold | **Warm** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **207.1 ms** | 1.00x | **45.1 ms** | 43.1 ms | 3.6 ms | 7.8% | 16.68x | 74 | n/a |
| Vize | **266.1 ms** | 1.28x | **2.7 ms** | 2.7 ms | 0.1 ms | 4.0% | 1.00x | 38 | n/a |
| Volar (N) | **422.8 ms** | 2.04x | **18.8 ms** | 10.1 ms | 7.5 ms | 42.0% ⚠ | 6.95x | 43 | n/a |
| Volar (JS) | **1.04 s** | 5.04x | **140.3 ms** | 136.0 ms | 3.1 ms | 2.3% | 51.91x | 43 | n/a |

<details><summary>Notes</summary>

- **Verter**: content verified | engine: tsgo ? (none)
- **Vize**: content verified | engine: tsgo (bundled)
- **Volar (N)**: content verified | engine: tsgo ? via TNB ?
- **Volar (JS)**: content verified | engine: TypeScript ? (JS)

</details>

<details><summary>Raw runs</summary>

- **Verter**: 50.1 ms, 43.1 ms, 45.1 ms
- **Vize**: 2.9 ms, 2.7 ms, 2.7 ms
- **Volar (N)**: 25.1 ms, 10.1 ms, 18.8 ms
- **Volar (JS)**: 142.1 ms, 136.0 ms, 140.3 ms

</details>

#### Peak RSS (process tree)

| Tool | Tool | tsgo / tsserver | **Total** |
| --- | ---: | ---: | ---: |
| Verter | 88.8 MB | 100.0 MB | **188.8 MB** |
| Vize | 73.6 MB | 179.0 MB | **252.6 MB** |
| Volar (JS) | 277.2 MB | 248.3 MB | **525.6 MB** |
| Volar (N) | 287.4 MB | 323.3 MB | **610.7 MB** |

Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.

<details><summary>Methodology</summary>

- Every operation carries a content gate; the timing is only ranked when the answer was verified correct.
- Peak RSS is the whole language-server process tree during the timed session (Volar = Vue half + TypeScript half). It is sampled alongside the run, not from a separate memory job.
- Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — Volar (@vue/language-server) = TypeScript ? (JS); Volar (TNB / tsgo tsdk) = tsgo ? via TNB ?; Vize LSP (Node shim) = tsgo (bundled); Verter LSP (npm 0.0.1-beta.5) = tsgo ? (none). Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.
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
| Vize | **188.0 ms** | 188.0 ms | n/a | n/a | 1.00x | n/a | n/a |
| Volar (JS) | **431.4 ms** | 431.4 ms | n/a | n/a | 2.29x | n/a | n/a |
| Volar (N) | **473.4 ms** | 473.4 ms | n/a | n/a | 2.52x | n/a | n/a |
| Verter | **574.1 ms** | 574.1 ms | n/a | n/a | 3.05x | n/a | n/a |

<details><summary>Notes</summary>

- **Vize**: all components verified · edit → diagnostic=102ms · hover after edit=86ms · completion=0ms
- **Volar (JS)**: all components verified · edit → diagnostic=361ms · hover after edit=51ms · completion=20ms
- **Volar (N)**: all components verified · edit → diagnostic=433ms · hover after edit=17ms · completion=23ms
- **Verter**: all components verified · edit → diagnostic=483ms · hover after edit=89ms · completion=2ms

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
| **Time-to-usable** | Vize LSP (Node shim) | 336 ms | 347 ms | 340 ms | ×1.02 | 63.7 MB |
|  | Verter LSP (npm 0.0.1-beta.5) | 342 ms | 344 ms | 405 ms | ×1.18 | 70.6 MB |
|  | Volar (TNB / tsgo tsdk) | 1.18 s | 1.35 s | 2.07 s | ×1.73 | 269.5 + 138.2 = 407.7 MB |
|  | Volar (@vue/language-server) | 1.91 s | 2.11 s | 3.08 s | ×1.61 | 253.6 + 77.0 = 330.6 MB |
| **Completion** | Vize LSP (Node shim) | 0.4 ms | 0.4 ms | 0.4 ms | ×0.6 | 63.7 MB |
|  | Volar (TNB / tsgo tsdk) | 186 ms | 192 ms | 257 ms | ×1.38 | 269.5 + 138.2 = 407.7 MB |
|  | Verter LSP (npm 0.0.1-beta.5) | 176 ms | 239 ms | 274 ms | ×1.99 | 70.6 MB |
|  | Volar (@vue/language-server) | 210 ms | 227 ms | 274 ms | ×1.29 | 253.6 + 77.0 = 330.6 MB |
| **References** | Volar (TNB / tsgo tsdk) | 125 ms | 611 ms | 11.3 s | ×84.54 | 269.5 + 138.2 = 407.7 MB |
|  | Volar (@vue/language-server) | 441 ms | 1.24 s | 16.9 s | ×38.71 | 253.6 + 77.0 = 330.6 MB |
|  | Vize LSP (Node shim) | (0.3 ms) ⚠ | (0.3 ms) ⚠ | (0.3 ms) ⚠ | – | 63.7 MB |
|  | Verter LSP (npm 0.0.1-beta.5) | (0.5 ms) ⚠ | (47.7 ms) ⚠ | (46.5 ms) ⚠ | – | 70.6 MB |
| **Hover warm** | Verter LSP (npm 0.0.1-beta.5) | 0.8 ms | 0.9 ms | 0.7 ms | ×0.9 | 70.6 MB |
|  | Volar (@vue/language-server) | 1.3 ms | 1.3 ms | 1.2 ms | ×0.9 | 253.6 + 77.0 = 330.6 MB |
|  | Vize LSP (Node shim) | 2.6 ms | 2.7 ms | 2.7 ms | ×1.06 | 63.7 MB |
|  | Volar (TNB / tsgo tsdk) | 1.7 ms | 1.9 ms | 4.6 ms | ×3.21 | 269.5 + 138.2 = 407.7 MB |

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
- `rename-prop-template` · **verter** — rename request failed: {"code":-32803,"message":"verter: rename is unavailable for public component props because complete cross-file usage proof is unavailable; no rename edit was produced."}

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LSP verter (server process, npm 0.0.1-beta.5) | 115.46 / 253.21 / 115.46 | 1.15 / 2.65 / 1.63 | 240 | 11.6 | 559 | 3 |
| LSP vize (server process, Node shim) | 174.15 / 266.03 / 174.15 | 0.84 / 1.72 / 1.23 | 60 | 11.9 | 386 | 3 |
| LSP Volar — Vue server process only (TypeScript half not sampled) | 394.78 / 535.74 / 394.78 | 0.94 / 2.68 / 1.71 | 580 | 9.1 | 1463 | 3 |

<details><summary>Notes</summary>

- **LSP verter (server process, npm 0.0.1-beta.5)** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP vize (server process, Node shim)** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.
- **LSP Volar — Vue server process only (TypeScript half not sampled)** — RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.

</details>

## Tool versions

<details><summary>Every pinned package in this run</summary>

| Package | Version |
| --- | --- |
| node | v22.23.2 |
| vue | 3.5.43 |
| vue-36 | 3.6.0-rc.9 |
| @vue/compiler-sfc | 3.5.43 |
| @vue/compiler-sfc-36 | 3.6.0-rc.9 |
| vize | 0.424.10 |
| @vizejs/native | 0.424.10 |
| @verter/native | 0.0.1-beta.5 |
| @fervid/napi | 0.4.1 |
| verter-tsc | 0.0.1-beta.5 |
| @verter/component-meta | 0.0.1-beta.5 |
| verter-lsp | 0.0.1-beta.5 |
| verter-mcp | 0.0.1-beta.5 |
| @vue/language-server | 3.3.11 |
| @vue/typescript-plugin | 3.3.11 |
| typescript-language-server | 6.0.0 |
| vue-tsc | 3.3.11 |
| vue-component-meta | 3.3.11 |
| golar | 0.1.10 |
| @golar/vue | 0.1.10 |
| prettier | 3.9.7 |
| oxfmt | 0.68.0 |
| oxlint | 1.83.0 |
| eslint-plugin-vue | 10.11.0 |
| @biomejs/biome | 2.5.14 |
| typescript | 6.0.3 |
| cli:vize | 0.424.10 |
| cli:vue-tsc | 6.0.3 |
| cli:verter-tsc | 0.0.1-beta.5 |
| cli:golar | 0.1.10 |
| cli:prettier | 3.9.7 |
| cli:oxfmt | 0.68.0 |
| cli:oxlint | 1.83.0 |
| cli:biome | 2.5.14 |
| vue-jsx-vapor | 3.2.24 |
| @vue-jsx-vapor/compiler-rs | 3.2.24 |
| @vue/babel-plugin-jsx | 3.0.0 |
| @babel/core | 8.0.5 |

</details>
