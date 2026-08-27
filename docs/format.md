# Format

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

### Format

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/format-bench-linux-200-bench-format-dark.svg">
  <img alt="Format" src="charts/format-bench-linux-200-bench-format.svg">
</picture>

Files: **200** · Bytes: **285,701**

Tools:

- **Prettier** — prettier --write over a fresh corpus copy; built-in Vue SFC support, single-threaded by design.
- **Oxfmt** — oxfmt --write — Oxc's Vue-capable formatter, multi-threaded.
- **Vize** — vize fmt --write.
- **Biome format** — biome format --write — multi-threaded; the exact pinned row rewrites none of the planted .vue corpus and is unranked on the full-SFC format surface.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **99.2 ms** | 98.2 ms | 1.1 ms | 1.1% | 1.00x | n/a | 2.0k files/s | 67.2 MB |
| Oxfmt | **3.12 s** | 3.09 s | 18.5 ms | 0.6% | 31.42x | n/a | 64 files/s | 686.1 MB |
| Prettier | **3.60 s** | 3.56 s | 59.9 ms | 1.7% | 36.26x | n/a | 56 files/s | 198.0 MB |
| Biome format ⚠ | (93.6 ms) | (91.2 ms) | – | – | not ranked | – | – | (96.1 MB) |

<details><summary>Notes</summary>

- **Vize**: vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded | ⓘ file coverage verified: rewrote 200/200 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Oxfmt**: oxfmt --write (fresh copy each run) · pinned 0.65.0 routes a full .vue file through its bundled Prettier formatFile callback in worker threads; the native binding orchestrates the call, but Vue parsing/printing is the bundled Prettier path. Re-audit this package path after upgrades. | ⓘ file coverage verified: rewrote 200/200 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Prettier**: prettier --write **/*.vue (fresh copy each run) · single-threaded by design | ⓘ file coverage verified: rewrote 200/200 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Biome format ⚠**: biome format --write . (fresh copy each run) · multi-threaded (Rayon; honours RAYON_NUM_THREADS) · exact pinned row currently rewrites none of the planted .vue corpus | ⚠ FAILED FILE-COVERAGE GATE — rewrote 0 of 200 planted corpus files. A tool covering fewer files finishes sooner; that is a different job, not a faster one. Measured but UNRANKED. | ⚠ FORMAT SEMANTIC VALIDITY FAIL — template-behaviour: messy template block was not rewritten; descriptor-attributes: messy template block was not rewritten. Full per-plant evidence is retained in validation.formatSemantics.

</details>

<details><summary>Methodology</summary>

- Each invocation receives a fresh copy of the same Vue SFC corpus (formatters rewrite files).
- Prettier is the explicit established-reference denominator for the full-Vue-SFC CLI comparison class. A faster candidate never silently becomes the baseline.
- .prettierrc.json and biome.json are written only into disposable work copies; the input fixture or checked-out real-world project is never overwritten. Both configs set the same indent, width, quote, semicolon and trailing-comma choices.
- All four formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.
- Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.
- Oxfmt 0.65.0 is a hybrid native/JS package. Its shipped native binding delegates a full .vue file to the bundled JS formatFile callback, whose implementation calls bundled Prettier with parser=vue; worker orchestration remains oxfmt's. Its output is byte-identical to Prettier on the work-gate probe. This is pinned-version evidence and must be re-audited after an oxfmt upgrade rather than assumed forever.
- Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxfmt 0.63+) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in, see zero files, and get unranked for walking reasons rather than formatting ones. A real project root has the boundary; the marker changes no tool's invocation.
- FORMAT SEMANTIC GATE (untimed, post-timing): suite 2026-08-20.1 runs 3 nested plants twice through each row's exact directory/glob command and shared configs. Every plant must remain parseable and idempotent; preserve SFC block attrs/custom blocks and template/script AST meaning; preserve scoped/module/v-bind/deep/slotted/global CSS constructs; and actually rewrite the messy template. Generated output is never compared between tools. Every outcome and the suite hash are retained in validation.formatSemantics.
- FILE-COVERAGE GATE, untimed, per tool with its exact timed invocation: every corpus file is planted with a mess (trailing spaces, stacked blank lines) that any formatter under the shared configs must undo, and files rewritten are counted by byte comparison — the same method for every tool. A ranked tool that rewrites fewer than every corpus file is measured but UNRANKED: tools walking different file sets are not doing the same job, however similar the clock looks. A walk-invoked tool that also rewrites a config file is disclosed, not gated (one extra tiny file is noise; skipping corpus files is not).
- Prettier, Oxfmt, and Vize format the whole SFC. On the pinned Biome, `biome format --write .` reports .vue files as formatted but applies NO fixes to any block of them (probed: 0 of 50 planted files rewritten, 'No fixes applied') — its bracketed time is a walk-and-parse, which both gates say on the row. Rule/option parity is not guaranteed for any tool.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize**: 99.2 ms, 98.2 ms, 101.1 ms, 99.2 ms, 99.9 ms
- **Oxfmt**: 3.11 s, 3.12 s, 3.14 s, 3.12 s, 3.09 s
- **Prettier**: 3.60 s, 3.56 s, 3.59 s, 3.60 s, 3.72 s
- **Biome format**: 91.2 ms, 93.6 ms, 94.2 ms, 92.7 ms, 96.3 ms

</details>

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

pass **50** · fail **2** · warn **0** · skip **0**

| Case | prettier | oxfmt | vize-fmt | biome-fmt |
| --- | :---: | :---: | :---: | :---: |
| `format-comments-preserved` | ✓ | ✓ | ✓ | ✓ |
| `format-generic-script-setup` | ✓ | ✓ | ✓ | ✓ |
| `format-i18n-custom-block` | ✓ | ✓ | ✓ | ✓ |
| `format-idempotent` | ✓ | ✓ | ✓ | ✓ |
| `format-multiline-expressions` | ✓ | ✓ | ✓ | ✓ |
| `format-parseable` | ✓ | ✓ | ✓ | ✓ |
| `format-pre-whitespace` | ✓ | ✓ | ✓ | ✓ |
| `format-pug-template` | ✓ | ✓ | **✗** | ✓ |
| `format-style-v-bind` | ✓ | ✓ | ✓ | ✓ |
| `format-top-level-comments` | ✓ | ✓ | **✗** | ✓ |
| `format-v-for-expression-preserved` | ✓ | ✓ | ✓ | ✓ |
| `format-v-pre-content` | ✓ | ✓ | ✓ | ✓ |
| `format-void-self-closing` | ✓ | ✓ | ✓ | ✓ |

<details><summary>Failure detail</summary>

- `format-pug-template` · **vize-fmt** — formatted output does not match /(^|[\r\n])\.wrapper\r?\n {2}h1\.title CONFIRM_PUG_TITLE\r?\n {2}ul\r?\n {4}li\(v-for="item in items" :key="item"\) \{\{ item \}\}/
- `format-top-level-comments` · **vize-fmt** — formatted output missing "CONFIRM_TOP_BETWEEN_BLOCKS"

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize fmt | 14.52 / 67.16 / 53.73 | n/a | 100 | 117.0 | 82 | 3 |
| Biome format | 2.18 / 95.89 / 60.60 | n/a | 30 | 36.8 | 80 | 3 |
| Prettier | 14.35 / 186.93 / 137.83 | n/a | 3980 | 169.1 | 2353 | 3 |
| Oxfmt | 14.33 / 675.74 / 500.20 | n/a | 140 | 5.7 | 2472 | 3 |

<details><summary>Notes</summary>

- **Vize fmt** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **Biome format** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **Prettier** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **Oxfmt** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained

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
