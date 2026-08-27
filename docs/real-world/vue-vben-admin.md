# Real-world: vue-vben-admin

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../../results/benchmarks/) and [`results/real_world/`](../../results/real_world/) by `pnpm docs`. Do not edit by hand.

**vue-vben-admin:core-ui** — [`vbenjs/vue-vben-admin`](https://github.com/vbenjs/vue-vben-admin) v5.7.0 @ `63a38dce49` · 330 files

- **Generated:** 2026-08-27T11:12:04.718Z
- **Fixture:** `fixtures/real` (330 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`abafafd`](https://github.com/pikax/vue-benchmarks/commit/abafafd07c14f26c07f1d0ed9da818102fdc97e1)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/33062222081

Ranked on the **median of measured runs**. Warm series follow ≥1 discarded warmup and are the primary ordering and ranking metric wherever both series exist. Compiler and Component-meta additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup and package imports. It is not called Cold and its ratio/noise gate never substitutes for Warm. What else the child excludes differs by surface and each surface states it in its own methodology — Compiler builds its compiler host outside the timer, Component-meta builds its checker/session inside it, because its warm timer does too. Every table sorts fastest-first and every ratio column is **vs fastest** — the fastest ranked row is the 1.00x denominator; no tool is pinned as a reference. One table per surface unless that surface declares explicit work-equivalence classes; engine, invocation and threading are row properties, not implicit table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three warm samples is bracketed as TOO NOISY TO RANK, no tool exempted (a two-run spread has no third sample to adjudicate, so it is flagged, not bracketed). Per-row detail is under **Notes** below each table.

> Corpora are pinned checkouts of third-party open-source Vue projects; sources are unmodified and every page names its ref and resolved commit SHA.
> **Rank within a corpus, never across it.** The corpora differ in size and in kind — library source, application source and documentation demos are not the same code.
> **⚠ unranked** is a gate, not a verdict on the official toolchain. A project shipping **no lockfile** at the pinned ref cannot be installed frozen, so every row on that corpus is unranked equally — including vue-tsc.

### Format

Files: **330** · Bytes: **933,224**

Tools:

- **Prettier** — prettier --write over a fresh corpus copy; built-in Vue SFC support, single-threaded by design.
- **Oxfmt** — oxfmt --write — Oxc's Vue-capable formatter, multi-threaded.
- **Vize** — vize fmt --write.
- **Biome format** — biome format --write — multi-threaded; the exact pinned row rewrites none of the planted .vue corpus and is unranked on the full-SFC format surface.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **143.3 ms** | 142.2 ms | 34.9 ms | 24.3% ⚠ | 1.00x | n/a | 2.3k files/s |
| Oxfmt | **3.42 s** | 3.40 s | 13.3 ms | 0.4% | 23.90x | n/a | 96 files/s |
| Prettier | **4.72 s** | 4.70 s | 136.4 ms | 2.9% | 32.97x | n/a | 70 files/s |
| Biome format ⚠ | (142.4 ms) | (142.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded | ⓘ file coverage verified: rewrote 330/330 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Oxfmt**: oxfmt --write (fresh copy each run) · pinned 0.65.0 routes a full .vue file through its bundled Prettier formatFile callback in worker threads; the native binding orchestrates the call, but Vue parsing/printing is the bundled Prettier path. Re-audit this package path after upgrades. | ⓘ file coverage verified: rewrote 330/330 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Prettier**: prettier --write **/*.vue (fresh copy each run) · single-threaded by design | ⓘ file coverage verified: rewrote 330/330 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Biome format ⚠**: biome format --write . (fresh copy each run) · multi-threaded (Rayon; honours RAYON_NUM_THREADS) · exact pinned row currently rewrites none of the planted .vue corpus | ⚠ FAILED FILE-COVERAGE GATE — rewrote 0 of 330 planted corpus files. A tool covering fewer files finishes sooner; that is a different job, not a faster one. Measured but UNRANKED. | ⚠ FORMAT SEMANTIC VALIDITY FAIL — template-behaviour: messy template block was not rewritten; descriptor-attributes: messy template block was not rewritten. Full per-plant evidence is retained in validation.formatSemantics.

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

- **Vize**: 143.3 ms, 208.3 ms, 204.4 ms, 142.2 ms, 142.7 ms
- **Oxfmt**: 3.42 s, 3.43 s, 3.43 s, 3.42 s, 3.40 s
- **Prettier**: 4.71 s, 4.72 s, 5.02 s, 4.76 s, 4.70 s
- **Biome format**: 142.2 ms, 143.8 ms, 142.3 ms, 142.4 ms, 142.8 ms

</details>

### Lint

Files: **330** · Bytes: **933,224**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Biome lint (default threads)** — biome lint with its default pool size — script block only. No template rules, so it misses the planted Vue template rules and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — the exact pinned row is script-block-only on the planted Vue template capabilities and remains unranked.
- **Oxlint (default threads)** — oxlint with its default pool size and vue plugin enabled — script block only, so it misses the planted Vue template rules; unranked.

##### Vue SFC lint — fresh CLI process

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-vue (CLI) | **4.14 s** | 4.12 s | 26.8 ms | 0.6% | 1.00x | n/a | 80 files/s |
| Vize lint (1T) ⚠ | (133.1 ms) | (130.8 ms) | – | – | not ranked | – | – |
| Vize lint (default threads) ⚠ | (94.8 ms) | (92.8 ms) | – | – | not ranked | – | – |
| Biome lint (1T) ⚠ | (645.9 ms) | (640.4 ms) | – | – | not ranked | – | – |
| Biome lint (default threads) ⚠ | (280.0 ms) | (276.4 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (86.2 ms) | (83.0 ms) | – | – | not ranked | – | – |
| Oxlint (default threads) ⚠ | (72.2 ms) | (67.5 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **eslint-plugin-vue (CLI)**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs | ⓘ file coverage verified: named 330/330 planted corpus files. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Vize lint (1T) ⚠**: vize lint . with RAYON_NUM_THREADS=1; diagnostics are not suppressed | ⚠ FAILED FILE-COVERAGE GATE — named 327 of 330 planted corpus files. A tool covering fewer files finishes sooner; that is a different job, not a faster one. Measured but UNRANKED. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Vize lint (default threads) ⚠**: vize lint . using default Rayon pool; diagnostics are not suppressed | ⚠ FAILED FILE-COVERAGE GATE — named 327 of 330 planted corpus files. A tool covering fewer files finishes sooner; that is a different job, not a faster one. Measured but UNRANKED. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Biome lint (1T) ⚠**: biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules | ⓘ file coverage verified: named 330/330 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Biome lint (default threads) ⚠**: biome lint . using its undocumented default pool size · script block only | ⓘ file coverage verified: named 330/330 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Oxlint (1T) ⚠**: oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules | ⓘ file coverage verified: named 330/330 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Oxlint (default threads) ⚠**: oxlint . on its default thread pool, vue plugin enabled · script block only | ⓘ file coverage verified: named 330/330 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.

</details>

##### Vue SFC lint — in-process APIs

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-vue (1T) | **2.20 s** | 2.09 s | 438.4 ms | 19.9% ⚠ | 1.00x | n/a | 150 files/s |
| eslint-plugin-vue (4 workers) | **4.26 s** | 4.21 s | 39.7 ms | 0.9% | 1.93x | n/a | 77 files/s |
| Verter host lint ⚠ | (440.9 ms) | (437.7 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles | ⓘ file coverage by construction: this invocation is handed the 330 corpus files as an explicit list, not a directory walk. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **eslint-plugin-vue (4 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker) | ⓘ file coverage by construction: this invocation is handed the 330 corpus files as an explicit list, not a directory walk. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Verter host lint ⚠**: VerterHost.upsert + lint(canonicalId) for each file (if API available) | ⓘ file coverage by construction: this invocation is handed the 330 corpus files as an explicit list, not a directory walk. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — duplicate-attributes: dirty twin had no file+line+rule/concept-attributed diagnostic; require-component-is: clean twin retained the planted diagnostic. Rows missing any mandatory planted capability remain contextual/unranked; all results are retained in validation.lintSemantics.

</details>

<details><summary>Methodology</summary>

- Every tool lints an identical isolated copy of the corpus (work/lint/…). That tools see the SAME FILES is enforced, not assumed: an untimed post-timing FILE-COVERAGE census plants a guaranteed-reportable issue in every corpus file and runs each directory-walk tool once — a ranked tool that fails to name every corpus file is measured but UNRANKED. Explicit-list invocations (the eslint API rows, VerterHost) are handed exactly the corpus by construction and say so. Census-only reporter changes (eslint JSON, biome unlimited diagnostics) alter what is printed, never what is linted; Vize and Oxlint use their exact timed commands and thread settings. A walk tool that also lints a config file beside the corpus is disclosed, not gated.
- Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxlint; oxfmt 0.63+ on the format surface) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in and walk zero files. A real project root has the boundary; the marker changes no tool's invocation.
- In-process APIs and fresh CLI processes are separate comparison tables because a CLI pays process startup and config loading on every run while an in-process API amortises them. eslint-plugin-vue runs in both modes and is the explicit reference denominator in each table.
- Ranking is split into explicit in-process-API and fresh-CLI comparison classes. eslint-plugin-vue is the declared denominator in both; ratios never compare Verter's in-process host with native CLI startup or let the fastest candidate redefine the reference.
- No single invocation mode covers every tool — vize lint is CLI-only, VerterHost.lint is in-process-only — which is why the mode is on the row instead of one mode being dropped.
- eslint-plugin-vue uses flat recommended config generated with fixtures.
- Vize, Biome and Oxlint each get separate 1T and default-thread rows — a thread-count gap is not a linter gap. The benchmark does not rename an undocumented default pool size as 'all cores'.
- VUE TEMPLATE-LINT SEMANTIC GATE (untimed, post-timing): suite 2026-08-20.1 runs 10 dirty/clean differential plants through every exact row separately, including main-thread/worker/CLI ESLint, thread-limited/default native CLIs, and fresh VerterHost. A pass must name the planted file, overlap its line, identify the rule or narrow concept, and disappear for the clean twin. Exit status or an unrelated diagnostic never passes. Every result and suite hash is retained in validation.lintSemantics; FAIL/UNKNOWN is measured but UNRANKED.
- Oxlint runs with its vue plugin ON (.oxlintrc.json travels with the corpus and with the gate plant). The exact pinned row still misses every mandatory Vue template diagnostic plant, so it remains contextual/unranked; no hard-coded rule-count claim is carried across package upgrades.
- Oxlint ships no standalone executable — it is a NAPI addon loaded into a Node process — so its per-run startup is Node's, while vize and biome launch a native binary. All three pay startup every run; it is not the same constant.
- Biome's script-only view also produces false positives on this corpus: variables declared in &lt;script setup> and used only in &lt;template> are reported as unused. Oxlint avoids that by disabling no-unused-vars for .vue entirely — it reports neither the false positive nor a genuinely unused declaration. Neither tool's diagnostics are comparable to the Vue-aware linters'.
- Allow non-zero exit (style diagnostics do not abort timing).
- Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **eslint-plugin-vue (CLI)**: 4.12 s, 4.19 s, 4.14 s, 4.14 s, 4.17 s
- **Vize lint (1T)**: 130.8 ms, 131.0 ms, 134.9 ms, 142.3 ms, 133.1 ms
- **Vize lint (default threads)**: 92.8 ms, 93.4 ms, 94.8 ms, 98.2 ms, 110.0 ms
- **Biome lint (1T)**: 640.4 ms, 648.2 ms, 645.9 ms, 643.0 ms, 648.8 ms
- **Biome lint (default threads)**: 276.5 ms, 276.4 ms, 280.4 ms, 280.0 ms, 281.1 ms
- **Oxlint (1T)**: 83.0 ms, 85.8 ms, 91.5 ms, 89.4 ms, 86.2 ms
- **Oxlint (default threads)**: 68.0 ms, 67.5 ms, 72.2 ms, 74.1 ms, 73.0 ms
- **eslint-plugin-vue (1T)**: 2.42 s, 3.14 s, 2.20 s, 2.11 s, 2.09 s
- **eslint-plugin-vue (4 workers)**: 4.29 s, 4.21 s, 4.32 s, 4.26 s, 4.26 s
- **Verter host lint**: 440.9 ms, 450.5 ms, 444.0 ms, 437.7 ms, 438.5 ms

</details>

### Bundle (production build) — vue-vben-admin:core-ui

Files: **207** · Bytes: **933,224**

Grouped by **bundler**, ranked within each group by Vue integration. Rows from different bundlers are never ranked against each other: read **across a row** (same bundler, different integration) for the Vue layer, and **down a column** (same integration, different bundler) for bundler architecture — the second is context, not a verdict.

#### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue ❌ | error | – | – | – | – | – | – |
| Vite 8 (Rolldown) × unplugin-vue ❌ | error | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ❌ | error | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vite 8 (Rolldown) × @vitejs/plugin-vue ❌**: Build failed with 1 error:  [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/effects/common-ui/src/components/json-viewer/index.vue?vue&type=style&index=0&lang.scss
- **Vite 8 (Rolldown) × unplugin-vue ❌**: Build failed with 1 error:  [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/effects/common-ui/src/components/json-viewer/index.vue?vue&type=style&index=0&lang.scss
- **Vite 8 (Rolldown) × @vizejs/vite-plugin ❌**: Build failed with 1 error:  [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/effects/common-ui/src/components/json-viewer/index.vue?vue=&type=style&index=0&lang=scss.scss.scss.scss
- **Vite 8 (Rolldown) × @verter/unplugin ❌**: Build failed with 15 errors:  [plugin vite:vue] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/@core/ui-kit/shadcn-ui/src/components/count-to-animator/count-to-animator.vue

</details>

#### Rolldown (no Vite) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rolldown (no Vite) × unplugin-vue ⏭**: ⏭ NOT MEASURED — this corpus carries 29 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. A failure here would be the pairing's, not unplugin-vue's. The Vite 8 group bundles the same corpus with the same Rolldown engine under Vite's CSS handling.
- **Rolldown (no Vite) × @verter/unplugin ⏭**: ⏭ NOT MEASURED — this corpus carries 29 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. A failure here would be the pairing's, not @verter/unplugin's. The Vite 8 group bundles the same corpus with the same Rolldown engine under Vite's CSS handling.

</details>

#### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × vue-loader ⚠ | (373.0 ms) | (369.9 ms) | – | – | not ranked | (2,321,761) | – |
| Rspack × unplugin-vue ⚠ | (751.6 ms) | (738.0 ms) | – | – | not ranked | (1,781,622) | – |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rspack × vue-loader ⚠**: loader chain · compiled 207/207 corpus SFCs · 28 style sub-requests · 2,321,761 output bytes | The official webpack Vue integration — a loader rule plus VueLoaderPlugin. The reference implementation for this family. | Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank.
- **Rspack × unplugin-vue ⚠**: lazy per-module transform · compiled 207/207 corpus SFCs · 28 style sub-requests · 1,781,622 output bytes | Official compiler pipeline as an unplugin, so the same code path the Vite rows use. | Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank. | ⚠ COMPARISON REFERENCE UNAVAILABLE/INVALID: Rspack's Vue reference row did not produce a valid ranked result, so candidate timings remain visible but no ratio in this class may rank.
- **Rspack × @vizejs/rspack-plugin ❌**:   × Module Error (from /home/runner/work/vue-benchmarks/vue-benchmarks/node_modules/.pnpm/@vizejs+rspack-plugin@0.387.0_@rspack+core@2.2.0/node_modules/@vizejs/rspack-plugin/dist/loader/scope-loader.mjs):   │ [vize] CSS parse error: Unexpected token Semicolon at /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/effects/common-ui/src/com
- **Rspack × @verter/unplugin ❌**:   × Module build failed (from ../../../../node_modules/.pnpm/unplugin@3.3.0_@rspack+core@2.2.0_esbuild@0.28.1_rolldown@1.2.6_vite@8.2.2_@types+node@_c9061723cb064c6c35e46062972d9ab5/node_modules/unplugin/dist/rspack/loaders/load.mjs):   ╰─▶   × Error: [verter] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/@core/ui-kit/popup-ui/src/a

</details>

<details><summary>Raw runs</summary>

- **Rspack × vue-loader**: 369.9 ms, 376.1 ms
- **Rspack × unplugin-vue**: 738.0 ms, 765.2 ms

</details>

#### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader ⚠ | (642.5 ms) | (640.8 ms) | – | – | not ranked | (3,302,016) | – |
| webpack 5 × unplugin-vue ⚠ | (1.10 s) | (1.10 s) | – | – | not ranked | (2,550,208) | – |
| webpack 5 × @verter/unplugin ❌ | error | – | – | – | – | – | – |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **webpack 5 × vue-loader ⚠**: loader chain · compiled 207/207 corpus SFCs · 28 style sub-requests · 3,302,016 output bytes | The official webpack Vue integration — a loader rule plus VueLoaderPlugin. The reference implementation for this family. | The reference webpack implementation. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank.
- **webpack 5 × unplugin-vue ⚠**: lazy per-module transform · compiled 207/207 corpus SFCs · 28 style sub-requests · 2,550,208 output bytes | Official compiler pipeline as an unplugin, so the same code path the Vite rows use. | The reference webpack implementation. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank. | ⚠ COMPARISON REFERENCE UNAVAILABLE/INVALID: webpack 5's Vue reference row did not produce a valid ranked result, so candidate timings remain visible but no ratio in this class may rank.
- **webpack 5 × @verter/unplugin ❌**: Module build failed (from ../../../../node_modules/.pnpm/unplugin@3.3.0_@rspack+core@2.2.0_esbuild@0.28.1_rolldown@1.2.6_vite@8.2.2_@types+node@_c9061723cb064c6c35e46062972d9ab5/node_modules/unplugin/dist/webpack/loaders/transform.mjs): Error: [verter] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/@core/ui-kit/popup-ui/src/alert/ale
- **webpack 5 × @vizejs/rspack-plugin ⏭**: @vizejs/rspack-plugin publishes no webpack entry point

</details>

<details><summary>Raw runs</summary>

- **webpack 5 × vue-loader**: 640.8 ms, 644.3 ms
- **webpack 5 × unplugin-vue**: 1.10 s, 1.10 s

</details>

<details><summary>Methodology</summary>

- Corpus: vue-vben-admin:core-ui @ 63a38dce — 207 SFCs, library-source, MIT. Sources are third-party and unmodified.
- ⚠ 123 of 330 corpus SFCs are EXCLUDED from this surface's app for every cell alike: their macro prop types need the project's own workspace context (tsconfig paths / node_modules), which the staged copy deliberately does not depend on — plus any file whose relative imports reach one (transitive, each edge named in the JSON). Judged untimed by @vue/compiler-sfc with the same fs bridge and TS registration the compile surface provisions; CHALLENGER COMPILERS WERE NOT CONSULTED for the exclusion — a tool that handles these files shows it on the compile surface, which reads the real checkout with no exclusions. First: packages/@core/ui-kit/menu-ui/src/components/menu-badge.vue ([@vue/compiler-sfc] Failed to resolve extends base type.)
- The staged copy carries the corpus SFCs' RELATIVE import closure (161 extra source files) so @vue/compiler-sfc can resolve imported prop types from disk, exactly as it can in the real checkout. Closure files exist for the COMPILER only: the bundler-facing resolvers externalise them, so the module graph is still exactly the corpus.
- Every cell builds the SAME generated entry over the SAME corpus. Each project's own build config is deliberately NOT used: it measures that project's chunking, asset and prerender choices far more than the Vue toolchain, and it cannot be held constant while the bundler is swapped.
- Module graph = the corpus. Any specifier that does not resolve to a real file outside node_modules is marked EXTERNAL and left in the output — so no cell is credited for resolving less or charged for a dependency another happened to have on disk. Implemented per bundler family (Rollup-shaped `resolveId` vs webpack `externals`) against the same rule.
- ⚠ One DISCLOSED per-integration graph-edge difference in the webpack family: a sibling-SFC import written inside an unplugin VIRTUAL module is deliberately externalised (webpack cannot re-base its resolver for a virtual issuer, so keeping it internal fails the build from the wrong directory), while vue-loader's real-path modules keep the same edge internal. The component named by the edge is still compiled exactly once in every cell — it enters through the generated entry — so the work difference is the edge itself, not the compilation.
- Externalising rather than stubbing is deliberate: an ESM stub cannot satisfy named imports, so a stubbing harness silently drops a different set of modules per bundler.
- SFC CUSTOM BLOCKS (&lt;markdown>, &lt;playground-*>, &lt;i18n>, …) are consumed by an inert harness-side sink in every cell — the generated shell drops each project's own build config and with it whatever plugin consumed those blocks, so without the sink the bundler's JS parser fails on prose and the census rule attributes a harness gap to the integration. Style blocks have their own handling per family; script and template always go to the integration under test.
- Vite 7 (Rollup) is an OPT-IN study, not part of the default matrix — enable with BENCH_BUNDLERS=vite8,vite7,rolldown,rspack,webpack. Vite 8 is the current release; the 7-vs-8 comparison measures Rollup vs Rolldown under Vite and does not change any integration's standing within a group.
- No minification and no tree-shaking/side-effect elimination in any cell. Minifying folds a second, bundler-specific tool into the number; dead-code elimination would reward a bundler for discarding corpus modules.
- BUNDLE STRUCTURAL VALIDITY PLANT (suite 2026-08-20.1, sha256 a9e142313871): after every timing has finished, each exact bundler × integration cell builds a separate one-SFC canary with static/dynamic render content, an event handler, scoped CSS and v-bind()-backed CSS. The gate checks relational markers in the emitted module/CSS — including agreement between the generated CSS-variable declaration and its var() use without prescribing the generated name — and a one-SFC transform census; it never compares whole output. This proves structural integration work, not browser runtime behaviour (project-test remains that oracle). FAIL/UNKNOWN is measured but UNRANKED, and a failed reference invalidates its whole bundler comparison class. Running last means the canary cannot pre-warm measured plugins or native libraries.
- Corpus-compile gate: one untimed build per cell counts how many corpus SFCs were compiled. A cell reaching fewer than the best cell FOR THE SAME BUNDLER — the same key the tables are grouped and ranked by — is measured but UNRANKED. The count is keyed on the source SFC, not the intermediate module id, because integrations rename them (Vize hands the bundler `.vue.ts` sidecars).
- Where a bundler has only ONE surviving cell, the peer anchor is that cell itself, so it is gated against the CORPUS instead: a lone cell that compiled part of the corpus is unranked, because nothing shows whether the rest is unreachable here or was skipped by that integration. A lone cell that did clear the corpus is ranked and labelled as the only row that ran, so its 1.00x is not read as beating a reference implementation that is absent.
- Where every surviving cell reached the same count and that count is below the corpus, the rows are ranked and the shortfall is disclosed: it is common to every cell, so it is treated as unreachable code in this corpus rather than as a fault of any integration.
- A cell whose build FAILED is classified on the transform census the driver recorded before it threw, never on the wording of the error. Corpus SFCs compiled and then a failure is ❌ attributable to the integration; zero corpus SFCs compiled is ⏭ NOT MEASURED, because a gap in this harness's wiring for that pair and a plugin that throws at init are indistinguishable from here — so no number and no verdict is published either way. The previous test looked for `?vue` in the error text, a sub-request shape only vue-loader emits, which meant the other integrations' codegen bugs were excused as harness gaps.
- Vize's plugin pre-compiles the whole corpus in a native batch at plugin-init and serves modules from that cache; the unplugin/loader rows compile lazily per module. The pre-pass is inside the timed region, so the totals are comparable; per-module cost is not. Every row's notes name its strategy — no row is excused on the strength of its strategy.
- No tool is exempt and none is given the benefit of the doubt. @vitejs/plugin-vue (Vite family) and vue-loader (webpack family) are the BASELINES, not the favourites: they are the reference each group is read against, and they are gated, bracketed and failed on exactly the same terms as everything else — the codegen gate has bracketed the official compiler on this corpus before now. Vize and Verter are under heavy development and are expected to fail cases; a failure is reported with its module and its diagnostic, and neither softened nor editorialised.
- Bundler families are not comparable line-for-line. A webpack build and a Rollup build of the same corpus differ in module runtime, chunk graph and output format as well as in Vue plugin, which is why they are separate groups.
- EXPRESSION dynamic imports (template-literal `import()`) whose static prefix does not resolve in the staged app are non-fatal in every family: the Rollup family externalises the unresolved specifier, and the webpack family ignores exactly those corpus-derived prefixes via IgnorePlugin — the one mechanism that reaches ContextModules, which never consult the externals callback (criticality parser flags only demote the warning, not the resolution error). A prefix that DOES resolve is never ignored, so a real missing module still fails. Before this was equalised, one such import in vuetify's docs failed the ENTIRE webpack family — its own baseline included — while the Vite cells passed, publishing an environment gap as six tool verdicts.
- Vite 8 IS the Rolldown migration (it depends on rolldown ~1.1); the standalone rolldown-vite package is deprecated in its favour. Vite 7 (Rollup) vs Vite 8 (Rolldown) is therefore the honest engine axis, and the bare Rolldown group shows what Vite's own pipeline costs on top of the same bundler.
- The corpus is copied into a work directory; the checked-out third-party repository is never written to.
- The DISCARDED WARM PASS is the corpus-compile gate build: every cell is built once, untimed, on the identical code path before any timing, which warms much of what a dedicated warmup would (module and OS caches; JIT tiering continues to settle over subsequent executions). The gate runs in fixed cell order — and so does measured run 0, which makes the gate-to-first-measure distance IDENTICAL for every cell; later runs rotate. Run 0 is each cell's second-ever execution and may carry a small residual that JS-implemented integrations feel more than native ones; at two measured runs the median averages it. Measured-run count is unchanged.
- Ranking metric is the median of measured runs.
- Measured runs capped at 2 for this surface (requested 5; per-surface runtime budget, 2026-07-30). Set BENCH_UNIFORM_RUNS=1 for equal run counts everywhere.

</details>

### HMR / dev server — vue-vben-admin:core-ui

Files: **207** · Bytes: **933,224**

Two independent measurements. Cold start is paid once per session; HMR turnaround is paid on every save. Do not compare a row across the two tables.

#### Dev server cold start

##### ROLLDOWN — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rolldown (no Vite) × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **Rolldown (no Vite) × unplugin-vue ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **Rolldown (no Vite) × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **Rolldown (no Vite) × @verter/unplugin ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

##### RSPACK — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rspack × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rspack × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Rspack × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rspack × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **Rspack × unplugin-vue ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **Rspack × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **Rspack × @verter/unplugin ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

##### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × unplugin-vue | **23.7 ms** | 22.7 ms | 1.4 ms | 5.8% | 1.00x | n/a | 8.7k files/s |
| Vite 8 (Rolldown) × @verter/unplugin | **24.6 ms** | 23.2 ms | 2.0 ms | 8.0% | 1.04x | n/a | 8.4k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **28.3 ms** | 27.7 ms | 1.0 ms | 3.4% | 1.20x | n/a | 7.3k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **61.4 ms** | 58.1 ms | 4.7 ms | 7.6% | 2.59x | n/a | 3.4k files/s |

<details><summary>Notes</summary>

- **Vite 8 (Rolldown) × unplugin-vue**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 207-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · lazy per-module transform
- **Vite 8 (Rolldown) × @verter/unplugin**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 207-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · lazy per-module transform
- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 207-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · lazy per-module transform
- **Vite 8 (Rolldown) × @vizejs/vite-plugin**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 207-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · eager native batch pre-compile

</details>

##### WEBPACK — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **webpack 5 × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **webpack 5 × unplugin-vue ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **webpack 5 × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **webpack 5 × @verter/unplugin ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

<details><summary>Raw runs</summary>

- **Vite 8 (Rolldown) × unplugin-vue**: 22.7 ms, 24.7 ms
- **Vite 8 (Rolldown) × @verter/unplugin**: 26.0 ms, 23.2 ms
- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: 29.0 ms, 27.7 ms
- **Vite 8 (Rolldown) × @vizejs/vite-plugin**: 64.7 ms, 58.1 ms

</details>

#### HMR update turnaround

##### ROLLDOWN — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rolldown (no Vite) × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **Rolldown (no Vite) × unplugin-vue ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **Rolldown (no Vite) × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **Rolldown (no Vite) × @verter/unplugin ⏭**: ⏭ NOT MEASURED — rolldown exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

##### RSPACK — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rspack × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rspack × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Rspack × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rspack × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **Rspack × unplugin-vue ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **Rspack × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **Rspack × @verter/unplugin ⏭**: ⏭ NOT MEASURED — @rspack/core exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

##### VITE8 — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠ | (18.4 ms) | (12.0 ms) | – | – | not ranked | (63,461) | – |
| Vite 8 (Rolldown) × unplugin-vue ⚠ | (16.6 ms) | (16.3 ms) | – | – | not ranked | (63,463) | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (1.2 ms) | (0.9 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠**: edit &lt;template> of packages/@core/ui-kit/form-ui/src/components/form-actions.vue and packages/@core/ui-kit/form-ui/src/form-render/form-field.vue → update · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | measured region: change announced → update message → updated module fetched over HTTP | revision plant verified in /packages/@core/ui-kit/form-ui/src/components/form-actions.vue | ⚠ TOO NOISY TO RANK — CV 186.2% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Vite 8 (Rolldown) × unplugin-vue ⚠**: edit &lt;template> of packages/@core/ui-kit/form-ui/src/components/form-actions.vue and packages/@core/ui-kit/form-ui/src/form-render/form-field.vue → update · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | measured region: change announced → update message → updated module fetched over HTTP | revision plant verified in /packages/@core/ui-kit/form-ui/src/components/form-actions.vue | ⚠ TOO NOISY TO RANK — CV 555.9% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — no HMR message (headless probe limitation, not a tool result) exceeded 30000 ms. This is the harness declining to publish a number, not a statement about @vizejs/vite-plugin. The dev cold-start row for this cell is published regardless: that measurement succeeded, and discarding it would hide a working result behind a probe limitation.
- **Vite 8 (Rolldown) × @verter/unplugin ⚠**: edit &lt;template> of packages/@core/ui-kit/form-ui/src/components/form-actions.vue and packages/@core/ui-kit/form-ui/src/form-render/form-field.vue → full-reload · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | ⚠ FULL RELOAD, not a hot update — the server discarded the module instead of patching it, which is much less work. Measured but UNRANKED. | ⚠ FAILED REVISION PLANT — packages/@core/ui-kit/form-ui/src/components/form-actions.vue fetched an update that did not contain its exact changed revision (full-reload carries no updated module). Resource/timing figures remain visible, but stale output is not ranked as a fast update.

</details>

##### WEBPACK — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × @vitejs/plugin-vue ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| webpack 5 × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **webpack 5 × @vitejs/plugin-vue ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vitejs/plugin-vue.
- **webpack 5 × unplugin-vue ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about unplugin-vue.
- **webpack 5 × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @vizejs/vite-plugin.
- **webpack 5 × @verter/unplugin ⏭**: ⏭ NOT MEASURED — webpack exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about @verter/unplugin.

</details>

<details><summary>Raw runs</summary>

- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: 93.0 ms, 17.2 ms, 18.4 ms, 19.6 ms, 12.0 ms
- **Vite 8 (Rolldown) × unplugin-vue**: 228.9 ms, 16.3 ms, 16.6 ms, 16.5 ms, 85.4 ms
- **Vite 8 (Rolldown) × @verter/unplugin**: 1.4 ms, 1.0 ms, 1.2 ms, 1.2 ms, 0.9 ms

</details>

<details><summary>Methodology</summary>

- Corpus: vue-vben-admin:core-ui @ 63a38dce — 207 SFCs, third-party and unmodified.
- ⚠ 123 of 330 corpus SFCs are EXCLUDED from this surface's app for every cell alike (workspace-context prop types, plus transitive relative importers). Judged untimed by @vue/compiler-sfc; challenger compilers were not consulted — a tool that handles these files shows it on the compile surface, which reads the real checkout with no exclusions. First: packages/@core/ui-kit/menu-ui/src/components/menu-badge.vue ([@vue/compiler-sfc] Failed to resolve extends base type.)
- The staged copy carries the corpus SFCs' relative import closure (161 extra source files) for @vue/compiler-sfc's type resolution; the resolver still externalises them, so the module graph is exactly the corpus.
- HMR probes: a fixed-width hidden element carrying a unique revision token is inserted inside the &lt;template> block of packages/@core/ui-kit/form-ui/src/components/form-actions.vue and then packages/@core/ui-kit/form-ui/src/form-render/form-field.vue — genuine template changes, one round trip per probe per run, ms = the mean. The token must appear in the announced transformed module or that SFC's own template submodule; a missing/stale revision is measured but UNRANKED. A &lt;script setup> edit would make Vue issue a full page reload instead of a hot update — a different and cheaper server path.
- The change is written to disk and then handed to the watcher directly. Waiting for chokidar would fold the OS file-watch debounce (platform-dependent, unrelated to any tool here) into every row.
- HMR turnaround is measured from the change being announced to the updated module being fetched over HTTP — the same two steps a browser performs. The WebSocket-notification half is reported separately in the run metadata, because a plugin can be quick to decide what changed and slow to recompile it.
- Revision validation runs AFTER the ranked clock stops. If the announced module is only a facade, the harness follows only that changed SFC's own template-module edges; architecture-dependent validation requests never lengthen the published update time. Generated output is not compared byte-for-byte — only the exact per-edit token is required.
- A cell whose edit produces a full reload rather than an update is measured but UNRANKED: discarding a module is much less work than patching one.
- Dev cold start is createServer + listen + transformRequest of the generated entry, so it includes the plugin's initialisation. Vize pre-compiles the whole corpus at plugin-init, so its cold-start row carries work the lazy plugins defer to first request — that is the real trade-off, and it is why both tables exist.
- Dependency pre-bundling is disabled (optimizeDeps.noDiscovery). Everything outside the corpus is external, so there is nothing to pre-bundle, and leaving discovery on would time a dependency scan this app does not have.
- Vite-family only. Webpack and Rspack implement HMR with a different protocol and a different unit of work (an incremental chunk, not a re-transformed module); those rows are absent rather than approximated.
- Vite 7 (Rollup) is an OPT-IN study, not part of the default matrix — enable with BENCH_BUNDLERS=vite8,vite7. Its known limitation here (the headless probe receives no HMR message from most plugins on Vite 7) is documented on the probe branch.
- SFC custom blocks are consumed by the same inert harness-side sink the bundle surface uses, so a dev server asked for a &lt;markdown> or &lt;playground-*> block the shell has no consumer for does not fail the probe against the Vue plugin.
- There is no browser executing the app, so no client-side `import.meta.hot.accept` handler is ever registered. Whether the server still announces an update in that state varies by Vite major AND plugin — observed: all four plugins answer on Vite 8; on Vite 7 some answer only with a full reload and some not at all. Rows where nothing arrived are marked ⏭ NOT MEASURED and are a limitation of this headless probe — they are not evidence that a plugin lacks HMR support.
- The two tables are gated INDEPENDENTLY. An HMR probe that produces no update does not remove that cell's dev-cold-start row: the server started and the entry transformed, which is the whole of what cold start measures. Previously one probe limitation deleted both rows, which on Vite 7 removed three plugins' cold-start numbers and left the fourth ranked against nothing.
- Where the baseline (@vitejs/plugin-vue) is not ranked in a bundler's table, every surviving row in that table says so: the vs-fastest column then compares challengers with each other only, and its 1.00x must not be read as beating the reference implementation.
- Dev cold start: each measured run starts a FRESH server — that row's question is what a cold session costs, so no run may inherit another's module graph. The DISCARDED WARM PASS is the gate probe, which already started a server and transformed the entry for every surviving cell on the identical code path. The probe runs in fixed cell order and so does measured run 0, so probe-to-first-measure distance is identical per cell; later runs rotate. Run 0 is each cell's second in-process execution and may carry a small JIT residual JS plugins feel more than native ones; the median over measured runs absorbs it.
- HMR turnaround: ONE WARM server per row, shared across warmup and measured runs. Real HMR only happens against a long-lived server; the per-run restart this replaced re-paid a corpus-scale startup to measure a milliseconds-long round trip (~31 of naive-ui's 89 sweep minutes were that ceremony). Each round trip edits from the pristine source with a unique marker and restores the file, so no run compounds another's edit.
- Run counts differ by table, deliberately: dev cold start ran 2 measured run(s) per cell (each is a corpus-scale server start — what the per-surface run cap protects), while the update table ran 5 measured run(s) per row (each is 2 millisecond-scale round trip(s) against the row's warm server, where a 2-run median left one contaminated round trip as half the number). BENCH_UNIFORM_RUNS=1 forces both tables to the caller's run count.
- The session's FIRST save is discarded: one untimed round trip per probe runs at session open, because a module transform alone does not warm the edit→update→fetch path and the first edit of a session costs a lazy plugin 100-900 ms it never pays again. Publishing that in a 2-run median made half of every lazy plugin's number a one-time cost the eager plugin had paid untimed at init — first-save cost is a cold-start question, and this table answers the every-save question.
- Measured runs capped at 2 for this surface (requested 5; per-surface runtime budget, 2026-07-30). Rows here carry 2 or 5 measured sample(s): a table may run MORE than the cap where its per-run cost is milliseconds — the surface's own methodology says which table and why. Set BENCH_UNIFORM_RUNS=1 for equal run counts everywhere.

</details>

### Project test suite — vue-vben-admin:core-ui

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../charts/real-world-vue-vben-admin-project-test-dark.svg">
  <img alt="Project test suite — vue-vben-admin:core-ui" src="../charts/real-world-vue-vben-admin-project-test.svg">
</picture>

Files: **330** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests passed | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vben-admin-monorepo — project's own toolchain (baseline) | **10.75 s** | 10.75 s | n/a | n/a | 1.00x | 308 | 31 files/s | 732.2 MB |
| vben-admin-monorepo — @verter/unplugin | **10.92 s** | 10.92 s | n/a | n/a | 1.02x | 308 | 30 files/s | 741.3 MB |
| vben-admin-monorepo — unplugin-vue | **10.96 s** | 10.96 s | n/a | n/a | 1.02x | 308 | 30 files/s | 755.2 MB |
| vben-admin-monorepo — @vizejs/vite-plugin | **40.66 s** | 40.66 s | n/a | n/a | 3.78x | 308 | 8 files/s | 6986.7 MB |

<details><summary>Notes</summary>

- **vben-admin-monorepo — project's own toolchain (baseline)**: the project's own toolchain, unmodified (baseline) · package . · script "test:unit": vitest run --dom · config vitest.config.ts | ⓘ 1 of 35 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it.
- **vben-admin-monorepo — @verter/unplugin**: a generated config that imports the project's real config and replaces only the Vue plugin · extends vitest.config.ts · resolved with ConfigEnv {command:'serve', mode:'test'}, matching how vitest resolves it for the baseline · Verter's universal bundler plugin, substituted for the project's Vue plugin. · ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction | ⓘ 1 of 35 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⚠ 1 test(s) FAILED under this toolchain (the project's own toolchain also fails 1) — a correctness finding about @verter/unplugin. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it.
- **vben-admin-monorepo — unplugin-vue**: a generated config that imports the project's real config and replaces only the Vue plugin · extends vitest.config.ts · resolved with ConfigEnv {command:'serve', mode:'test'}, matching how vitest resolves it for the baseline · Same official @vue/compiler-sfc as the baseline, different plugin wrapper — a gap to baseline is wrapper cost, not compiler cost. · ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction | ⓘ 1 of 35 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⚠ 1 test(s) FAILED under this toolchain (the project's own toolchain also fails 1) — a correctness finding about unplugin-vue. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it.
- **vben-admin-monorepo — @vizejs/vite-plugin**: a generated config that imports the project's real config and replaces only the Vue plugin · extends vitest.config.ts · resolved with ConfigEnv {command:'serve', mode:'test'}, matching how vitest resolves it for the baseline · Vize's native compiler, substituted for the project's Vue plugin. · ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction | ⓘ 1 of 35 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⚠ 1 test(s) FAILED under this toolchain (the project's own toolchain also fails 1) — a correctness finding about @vizejs/vite-plugin. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it.

</details>

<details><summary>Methodology</summary>

- Target: vben-admin-monorepo (.) at v5.7.0 / 63a38dce — the project's own Vitest suite, unmodified test code.
- This surface EXECUTES compiled components rather than only bundling them, so it catches codegen that parses correctly and behaves wrongly — a class of defect no build surface can reach. It is also the only surface that answers whether a challenger would actually work in a real project.
- The first row is the project's suite run completely unmodified. That is the BASELINE — the reference the others are read against — and its pass/fail census is published exactly like every challenger's. If the project's own suite fails on this machine, the row says so.
- Swap mechanism is stated per row. Preferred: a generated config that imports the project's real config and replaces only the Vue plugin. The generated config replaces ONLY the plugin named 'vite:vue', at that plugin's own index in the array, and throws if it cannot find it — adding a second Vue plugin beside the original would have both compiling every SFC and report a number that means nothing, and hoisting the replacement to the front would change which other plugins see an .vue file first.
- KNOWN INEQUALITY, published on every override row: ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction. The direction of the resulting error is not measured, so it is not claimed to cancel out.
- The project's config is resolved with the same ConfigEnv vitest uses ({command:'serve', mode:'test'}). A function-form config branches on it, so resolving it as build/production — as an earlier revision did — gave the challengers a different plugin list and different aliases from the baseline while the table claimed one variable changed.
- Fallback, used only where a target has no importable config: resolution-hook override: the timed process runs with NODE_OPTIONS=--import pointing at a Node resolve hook that redirects every import of @vitejs/plugin-vue (and its subpaths) to the challenger's module, so a config generated at runtime picks the challenger up without being imported or edited. ⚠ NOT EQUAL WORK, in the opposite direction to the override mechanism: the project's own vue({...}) options DO reach the challenger here, and a challenger that does not understand plugin-vue's option shape may fail on the options rather than on the SFCs — an option-shape mismatch and a real incompatibility are hard to tell apart from the outside, and this surface does not tell them apart. The redirect is verified by a marker the hook writes; a row whose redirect never fired is ⏭ NOT MEASURED, never published, because a silent no-op would publish the baseline's number under the challenger's name.
- Alias-verification gate: an alias row is ⏭ NOT MEASURED unless the resolution hook recorded a redirect on EVERY measured run. A hook that matched nothing leaves the project running its own @vitejs/plugin-vue, and the run would be published under a challenger's name with nothing in the output to distinguish it — the worst failure available on this surface, and the only one that cannot be spotted after the fact.
- The census is read from the LAST summary block vitest prints, and the file and test lines are always taken from the SAME block. A run can print more than one (a reporter list naming `default` twice, a merged blob report), and the label lines are matched anchored at the start of a line — the previous parser matched each label anywhere in the output with `\s` able to span newlines, so it could pair a file count from one block with a test count from another and publish a census that describes no single run.
- The file census publishes files FAILED as well as the total, because the total alone is misleading. On Hoppscotch's `hoppscotch-common` vitest prints `Test Files 31 failed | 31 passed (62)`: half its 62 spec files never collect, because `@hoppscotch/data` is built by a postinstall that `pnpm fetch:real-world` skips. That is a property of the corpus on this machine and it hits the baseline too, so it is stated on every row rather than only where a challenger loses tests.
- Test-count gate: a challenger that PASSES fewer tests than the baseline is UNRANKED, as is one that FAILS more tests than the baseline (a pass-count tie does not clear extra failures — a toolchain can change what the suite collects), one that produced no test census at all, or one that exited non-zero having passed nothing. A suite that fails to collect — or collects and then fails — is faster, and rewarding that would invert the measurement. Passes and failures, not collections, are the gated quantities, and passes is the same number the artifact column publishes.
- Failing tests are reported as a correctness finding about the tool. The timing of a row that passed fewer tests than the baseline is bracketed and excluded from ranking by the gate above; the failure count is published next to it so the reader sees both.
- vitest is invoked directly rather than through the project's npm script, because --config must reach vitest itself; the script that was bypassed is named in the baseline row's notes.
- This is the ONE real-world surface that writes into the checkout — running a project's own suite means running inside it. One namespaced config file per challenger is written and removed in a finally; the clone is pinned, so residue from a hard kill clears with `pnpm fetch:real-world --force`.
- Vitest starts a fresh process per run, so no run inherits another's transform cache. Tool order is rotated on every warmup and measured run.
- Measured runs capped at 1 for this surface (requested 5; per-surface runtime budget, 2026-07-30). project-test is a correctness surface — its timing is INDICATIVE, not a ranking a median-of-5 would sharpen.

Raw runs:

- **vben-admin-monorepo — project's own toolchain (baseline)**: 10.75 s
- **vben-admin-monorepo — @verter/unplugin**: 10.92 s
- **vben-admin-monorepo — unplugin-vue**: 10.96 s
- **vben-admin-monorepo — @vizejs/vite-plugin**: 40.66 s

</details>

### Project build (own config) — vue-vben-admin:core-ui

Files: **330** · Bytes: **933,224**

<details><summary>Methodology</summary>

- No build target in vue-vben-admin could build with its OWN toolchain in this environment, so there is no baseline to compare anything against and no rows are published.
- Candidate @vben/playground (playground, 125 SFCs) was REJECTED before measurement: own build exited 1 with 0 output files — error during build: Error: Build failed with 1 error:. No challenger rows are emitted for a target whose own build fails — that would report a broken target as three tool failures.
- Candidate @vben/web-naive (apps/web-naive, 30 SFCs) was REJECTED before measurement: own build exited 1 with 0 output files — error during build: Error: Build failed with 1 error:. No challenger rows are emitted for a target whose own build fails — that would report a broken target as three tool failures.
- Candidate @vben/web-ele (apps/web-ele, 28 SFCs) was REJECTED before measurement: own build exited 1 with 0 output files — error during build: Error: Build failed with 1 error:. No challenger rows are emitted for a target whose own build fails — that would report a broken target as three tool failures.
- Candidate @vben/web-antd (apps/web-antd, 27 SFCs) was REJECTED before measurement: own build exited 1 with 0 output files — error during build: Error: Build failed with 1 error:. No challenger rows are emitted for a target whose own build fails — that would report a broken target as three tool failures.
- Candidate @vben/web-antdv-next (apps/web-antdv-next, 27 SFCs) was REJECTED before measurement: own build exited 1 with 0 output files — error during build: Error: Build failed with 1 error:. No challenger rows are emitted for a target whose own build fails — that would report a broken target as three tool failures.
- Candidate @vben/web-tdesign (apps/web-tdesign, 27 SFCs) was REJECTED before measurement: own build exited 1 with 0 output files — error during build: Error: Build failed with 1 error:. No challenger rows are emitted for a target whose own build fails — that would report a broken target as three tool failures.
- A common cause is code generation: several projects import files produced by a `postinstall` script, and `pnpm fetch:real-world` installs with `--ignore-scripts` because postinstall scripts in this set download browsers and build native modules that no surface here uses. Such a package is not "easy and reliable" to build, which is the bar this surface holds itself to.

Raw runs:

</details>

### Project typecheck (own tsconfig) — vue-vben-admin:core-ui

Files: **330** · Bytes: **933,224**

Tools:

- **vue-tsc (JS)** — the official Vue Language Tools CLI — vue-tsc --noEmit -p tsconfig.json, stock JavaScript TypeScript engine.
- **vue-tsc (N)** — the same vue-tsc with typescript aliased to typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **verter-tsc** — verter-tsc --noEmit -p tsconfig.json from the published npm package; runs stable tsgo.
- **Vize** — vize check --tsconfig tsconfig.json (native, Corsa when available).
- **Golar typecheck** — golar typecheck — typescript-go with the @golar/vue plugin, pure typecheck.

Grouped by **TypeScript engine**, ranked within each group. The JS engine and native tsgo are never ranked against each other: that ratio measures TypeScript's own Go rewrite at least as much as the Vue tooling on top of it. Read WITHIN a group for the Vue layer, and across groups only as context on the rewrite.

#### JavaScript TypeScript engine — ranked alone

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../charts/real-world-vue-vben-admin-project-typecheck-javascript-typescrip-1kl3r9h-dark.svg">
  <img alt="Project typecheck (own tsconfig) — vue-vben-admin:core-ui — JavaScript TypeScript engine — ranked alone" src="../charts/real-world-vue-vben-admin-project-typecheck-javascript-typescrip-1kl3r9h.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (JS) | **20.94 s** | 20.94 s | 7.2 ms | 0.0% | 1.00x | 0 | 6 files/s | 1664.0 MB |

<details><summary>Notes</summary>

- **vue-tsc (JS)**: BASELINE · vue-tsc --noEmit -p tsconfig.json · the official Vue Language Tools CLI on the stock JavaScript TypeScript compiler | post-timing entrypoint plants: script=✓ template-prop=✓ template-event=✓

</details>

<details><summary>Raw runs</summary>

- **vue-tsc (JS)**: 20.95 s, 20.94 s

</details>

#### Native tsgo engines — ranked together

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../charts/real-world-vue-vben-admin-project-typecheck-native-tsgo-engines--0dixsc7-dark.svg">
  <img alt="Project typecheck (own tsconfig) — vue-vben-admin:core-ui — Native tsgo engines — ranked together" src="../charts/real-world-vue-vben-admin-project-typecheck-native-tsgo-engines--0dixsc7.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (N) | **10.10 s** | 10.09 s | 21.4 ms | 0.2% | 1.00x | 0 | 12 files/s | 2694.7 MB |
| verter-tsc ⚠ | (3.68 s) | (3.67 s) | – | – | not ranked | (156) | – | (719.6 MB) |
| Vize ⚠ | (82.93 s) | (82.65 s) | – | – | not ranked | (23) | – | (2940.2 MB) |
| Golar typecheck ⏭ | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **vue-tsc (N)**: Same vue-tsc 3.3.11 with typescript aliased to typescript-native-bridge 6.0.3-bridge.15.tsgo.7.0.2 (TS API 6.0.3 on tsgo 7.0.2, in-process NAPI/FFI) — exactly one variable against the (JS) row: the TypeScript engine. | post-timing entrypoint plants: script=✓ template-prop=✓ template-event=✓
- **verter-tsc ⚠**: verter-tsc --noEmit -p tsconfig.json | ⚠ FAILED DIAGNOSTIC-CENSUS GATE — the baseline reported 0 diagnostics and exited 0, so a checker that agrees must also exit 0; this row exited 1 while reporting 156 diagnostic(s) against a clean reference — a non-zero exit here is a failed check of the project, not a stricter one. Measured but UNRANKED. | post-timing entrypoint plants: script=✓ template-prop=✓ template-event=✓
- **Vize ⚠**: vize check --tsconfig tsconfig.json (no path pattern, so the file set comes from the tsconfig's include/exclude/files — the closest analogue of the -p invocation the other rows use) · ⚠ NOT ASSERTED EQUAL: Vize builds its own virtual project from that tsconfig rather than a TypeScript program, so which files end up checked may still differ; the diagnostic census below is what would expose a materially smaller set. | ⚠ FAILED DIAGNOSTIC-CENSUS GATE — the baseline reported 0 diagnostics and exited 0, so a checker that agrees must also exit 0; this row exited 1 while reporting 23 diagnostic(s) against a clean reference — a non-zero exit here is a failed check of the project, not a stricter one. Measured but UNRANKED. | post-timing entrypoint plants: script=✓ template-prop=✓ template-event=✓
- **Golar typecheck ⏭**: ⏭ NOT MEASURED — golar is not yet wired into the project-typecheck surface (its own-tsconfig invocation and diagnostic census have not been validated against real projects). A harness omission, not a verdict about golar; it ranks on the generated-corpus typecheck surface.

</details>

<details><summary>Raw runs</summary>

- **vue-tsc (N)**: 10.12 s, 10.09 s
- **verter-tsc**: 3.68 s, 3.67 s
- **Vize**: 83.21 s, 82.65 s

</details>

<details><summary>Methodology</summary>

- Target: @vben/playground (playground) — 125 SFCs, checked with the project's OWN tsconfig.json and its own installed dependencies.
- Corpus pin: v5.7.0 @ 63a38dce, released 2026-05-21 (github-release), pinned 2026-07-29. Pins are updated by hand only.
- The target was pre-flighted: the baseline typechecked it untimed first, and it is measured only because that produced diagnostics across more than one file (or exited clean). A target the baseline merely aborts on publishes no rows at all — a fast abort is indistinguishable from a fast pass on a wall-clock table, and every other row would be gated against it.
- Every checker gets the same directory, the same tsconfig and the same non-zero-exit policy. Real projects have pre-existing type errors at their pinned release; a checker is not penalised for reporting them, and no row is forgiven a diagnostic another row is failed for.
- Rows are grouped and tagged by ENGINE. `vue-tsc` tagged **(JS)** runs the stock JavaScript TypeScript compiler; `vue-tsc (N)` is the SAME vue-tsc with typescript aliased to typescript-native-bridge (tsgo in-process). The pair isolates the engine, so a JS-vs-native gap should be read as TypeScript's own Go rewrite first and the Vue layer second — and because that gap is not a Vue-tooling result, the two engines are ranked in separate tables rather than one.
- Program-construction gate: every measured run of every row — the baseline's included — must either exit 0 or report diagnostics spanning at least two files. A checker that aborts while building the program returns one diagnostic very fast without checking anything, and a row that did that on any measured run is UNRANKED.
- TNB activation gate: the native row is UNRANKED unless the bridge printed its activation banner on EVERY measured run. A bridge that silently fell back to the JavaScript checker would still be labelled native, which is the mislabel the gates exist to prevent.
- Diagnostic-census gate: a checker reporting under half the baseline's diagnostics is UNRANKED — it may be skipping files or not checking templates, and doing less finishes sooner. When the baseline reports ZERO diagnostics and exits clean, the ratio test cannot fire, so the gate instead requires the row to exit 0 as well: reporting nothing while failing is not a clean pass. Reporting materially MORE is annotated, not gated: stricter is legitimate, but the reader needs to know the rows are not answering the same question.
- Diagnostic counts are read with one shared set of line patterns covering every output shape on this surface (tsc plain, tsc pretty, and Vize's heading-plus-indented-`error:line:col [TSxxxx]` layout). A per-tool parser is how one tool's formatting ends up flattering it — and under-counting is not neutral here, because the census gate would unrank the tool the harness failed to read.
- Vize is invoked with no path pattern so its file set comes from the tsconfig's include/exclude/files, which is the closest analogue of the `-p tsconfig.json` the other three rows use. It still builds its own virtual project rather than a TypeScript program, so identical file sets are NOT asserted; the diagnostic census is what would expose a materially smaller one.
- Diagnostic EQUIVALENCE is not asserted. This is a throughput surface with a work census, not a correctness suite; the counts are published so a suspicious row is visible rather than inferred.
- POST-TIMING ENTRYPOINT CAPABILITY PLANTS (suite 2026-08-20.1, sha256 d5523c21e8bd): each exact CLI row must independently report a script assignment error, a native-template prop mismatch, and a template event-handler mismatch. FAIL is measured but UNRANKED, and a failed native vue-tsc reference invalidates the native comparison class. These plants certify the entrypoint/configuration, not equivalence of diagnostics on the third-party project; that remains UNKNOWN and the project census is retained separately. Running last prevents the plant processes from warming executable/source/dependency pages for measured calls.
- Each measured run is a fresh CLI process, so every row pays process startup equally and none inherits another's incremental cache. Tool order is rotated on every warmup and measured run.
- The checkout is never written to by this surface — it only reads.
- Measured runs capped at 2 for this surface (requested 5; per-surface runtime budget, 2026-07-30). Set BENCH_UNIFORM_RUNS=1 for equal run counts everywhere.

</details>

### Project component-meta (own tsconfig) — vue-vben-admin:core-ui

Files: **70** · Bytes: **933,224**

##### Project component public-API metadata

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta ⚠ | (2.58 s) | (2.37 s) | – | – | not ranked | (70) | – |
| @verter/component-meta ⚠ | (598.5 ms) | (594.3 ms) | – | – | not ranked | (70) | – |

<details><summary>Notes</summary>

- **vue-component-meta ⚠**: BASELINE · createChecker(tsconfig.json) + getComponentMeta for each of 70 corpus SFCs under packages/effects/layouts, using the project's own tsconfig and installed dependencies ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props.value: missing; options-api-component: events.increment: missing; events.reset: missing.
- **@verter/component-meta ⚠**: openComponentMetaSession({root: packages/effects/layouts, tsconfig: tsconfig.json}) + getComponentMeta for the same 70 corpus SFCs | prop coverage verified: reported at least one prop for all 36 components that declare props in their source. Components that declare NO props are excluded from this gate, because the tools legitimately disagree about whether such a component still has implicit and inherited surface. | ⓘ reported 486 props+events+slots against the baseline's 1326 across the same 70 components. Member counts are NOT asserted equivalent: the tools differ on whether inherited and implicit surface belongs to a component's public API. The gated quantities are components resolved and per-component prop coverage. ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props-destructure: props.count: expected hasDefault; props.verbose: expected hasDefault. ⚠ COMPARISON REFERENCE INVALID: the official Vue component-meta baseline did not pass mandatory validation.

</details>

##### PROJECT-COMPONENT-META — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vize component-meta ⏭**: No component-meta API found on @vizejs/native in this install (loaded successfully, but exports no extractComponentMeta()). Declaration emit is a different job and is NOT substituted for metadata extraction.

</details>

<details><summary>Methodology</summary>

- Target: @vben/layouts (packages/effects/layouts) — 70 corpus SFCs, read with the project's OWN tsconfig.json and its own installed dependencies.
- Corpus pin: v5.7.0 @ 63a38dce, released 2026-05-21 (github-release), pinned 2026-07-29.
- The component set is the RESOLVED CORPUS restricted to the target package, not a private walk — so `--file-limit` and its truncation disclosure apply here exactly as they do to every other real-world surface. A private walk would quietly measure a different file set from the one the corpus line names.
- Both tools are given the same absolute file list, the same tsconfig and the same directory, and each is driven through its own published entry point. No payload is hand-decoded and no row is measured through an API it does not ship.
- POST-TIMING ENTRYPOINT-CAPABILITY GATE: suite 2026-08-20.2 runs 29 known generated cases through the same createChecker/getComponentMeta and openComponentMetaSession/getComponentMeta lifecycles in isolated children. It never reads or writes the third-party checkout and cannot warm its timed programs. A failure or UNKNOWN exact entrypoint is measured but UNRANKED; a failed Vue reference invalidates the class. This gate proves only that the published API handles the planted language features, not that this project's metadata is semantically equivalent.
- The target was pre-flighted: the baseline built a checker and extracted from a bounded sample untimed first, and the target is measured only because that resolved components AND found declared props on some of them. A target the baseline cannot read publishes no rows at all — every other row would be gated against a reference that did no work.
- Candidate @vben/playground (playground, 125 SFCs) was REJECTED before measurement: no corpus SFC lies under playground, so this target and this corpus do not overlap. No rows are published for a target the baseline cannot extract from — every other row would be gated against a reference that did no work, which marks the tools that DID as the anomalies.
- Metadata census gate: a row that resolved metadata for fewer components than the baseline is UNRANKED, and so is a row that resolved none at all — including the baseline's own row, which is gated identically. Returning `{}` is the fastest thing a metadata extractor can do.
- Prop-coverage gate: a row reporting ZERO props for any component the baseline found props on is UNRANKED. This is the gate that catches a fast, empty answer hiding behind a healthy-looking component count.
- Member totals (props+events+slots) are published but NEVER gated. The tools disagree about what belongs to a component's public API — vue-component-meta reports inherited and implicit surface, Verter reports the declared API — and gating on that would brand a tool for a schema definition rather than for doing less work. The per-component prop coverage above is the part that is not a schema disagreement.
- PROJECT METADATA EQUIVALENCE remains UNKNOWN and is not asserted: the generated capability plants do not supply an oracle for the third-party components, and nobody has written down their complete correct public APIs. This is a throughput surface with a project coverage census plus a separate entrypoint-capability gate.
- Each measured run constructs a fresh checker/session and Verter's pooled engine is evicted afterwards, so no run inherits another's warm program. Tool order is rotated on every warmup and measured run.
- The checkout is never written to by this surface — it only reads.

Raw runs:

- **vue-component-meta**: 2.64 s, 2.58 s, 2.55 s, 2.89 s, 2.37 s
- **@verter/component-meta**: 596.0 ms, 612.9 ms, 594.3 ms, 598.5 ms, 608.4 ms

</details>

### Project LSP (project as workspace) — vue-vben-admin:core-ui

Files: **1** · Bytes: **5,190**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).

Hover is ranked per TypeScript engine; diagnostics is observational and always unranked. The operations differ by orders of magnitude and answer unrelated questions, a ratio across engines measures TypeScript's Go rewrite as much as the Vue layer, and the diagnostics products are unequal (Volar Vue-only LSP publication versus native combined Vue+TypeScript publication) with no known-correct answer in third-party source.

#### didOpen → diagnostics — JavaScript TypeScript engine, observational only

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (3.94 s) | (3.91 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: BASELINE · official Vue language server v3 in hybrid (two-process) mode — the only mode v3 has. The measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver bridge. Both processes' startup and project load of the real project are inside the timings. HOVER asks both halves in parallel and charges the slower; DIAGNOSTICS times the first publication for the document from either half (which may be an empty preliminary — the count it carried and the first NON-EMPTY publication are both published). · operation: didOpen → diagnostics · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue | ⚠ FAILED DIAGNOSTIC-CONTENT GATE — published 0 diagnostics for a document vize published 4 for. Answering "nothing to report" fast is not the same job as answering. Measured but UNRANKED. (Diagnostic EQUIVALENCE is not asserted; the counts are published so a suspicious row is visible.) | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking.

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 3.91 s, 3.94 s, 3.95 s, 3.94 s, 4.08 s

</details>

#### didOpen → diagnostics — native tsgo engines, observational only

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) ⚠ | (2.24 s) | (2.24 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (385.5 ms) | (383.6 ms) | – | – | not ranked | (0) | – |
| Vize ⚠ | (31.6 ms) | (31.3 ms) | – | – | not ranked | (4) | – |

<details><summary>Notes</summary>

- **Volar (N) ⚠**: Identical to the Volar row except the TypeScript half runs on typescript-native-bridge (tsgo): same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.15.tsgo.7.0.2 tsdk. Exactly one variable against the baseline — the TypeScript engine — which is why the two are ranked in separate tables. · operation: didOpen → diagnostics · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue | ⚠ FAILED DIAGNOSTIC-CONTENT GATE — published 0 diagnostics for a document vize published 4 for. Answering "nothing to report" fast is not the same job as answering. Measured but UNRANKED. (Diagnostic EQUIVALENCE is not asserted; the counts are published so a suspicious row is visible.) | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking.
- **Verter ⚠**: verter-lsp stdio, the native server from the published npm package, given the project directory as its workspace root. $/verter/ready is not waited for — its workspace load is inside the measured window like every other server's. · operation: didOpen → diagnostics · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue | ⚠ FAILED DIAGNOSTIC-CONTENT GATE — published 0 diagnostics for a document vize published 4 for. Answering "nothing to report" fast is not the same job as answering. Measured but UNRANKED. (Diagnostic EQUIVALENCE is not asserted; the counts are published so a suspicious row is visible.) | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking. | ⚠ VUE REFERENCE UNAVAILABLE/INVALID — this operation × engine class has no valid official Vue reference, so candidate timing remains visible but cannot rank.
- **Vize ⚠**: vize lsp --stdio, launched from the npm package's NODE entry, because no version-matched native server was found; that costs ~35ms of Node bootstrap per spawn. Same workspace, file and position as every other row. · operation: didOpen → diagnostics · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking. | ⚠ VUE REFERENCE UNAVAILABLE/INVALID — this operation × engine class has no valid official Vue reference, so candidate timing remains visible but cannot rank.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 2.25 s, 2.24 s, 2.24 s, 2.24 s, 2.26 s
- **Verter**: 383.6 ms, 389.7 ms, 413.0 ms, 384.4 ms, 385.5 ms
- **Vize**: 31.6 ms, 31.3 ms, 31.8 ms, 31.6 ms, 31.9 ms

</details>

#### hover on `props` — JavaScript TypeScript engine, ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **4.4 ms** | 3.0 ms | 0.7 ms | 16.5% ⚠ | 1.00x | 621 | 229 files/s |

<details><summary>Notes</summary>

- **Volar (JS)**: BASELINE · official Vue language server v3 in hybrid (two-process) mode — the only mode v3 has. The measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver bridge. Both processes' startup and project load of the real project are inside the timings. HOVER asks both halves in parallel and charges the slower; DIAGNOSTICS times the first publication for the document from either half (which may be an empty preliminary — the count it carried and the first NON-EMPTY publication are both published). · operation: hover on `props` · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 3.0 ms, 4.4 ms, 3.1 ms, 4.4 ms, 4.4 ms

</details>

#### hover on `props` — native tsgo engines, ranked together

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) | **3.1 ms** | 3.0 ms | 1.3 ms | 41.9% ⚠ | 1.00x | 234 | 319 files/s |
| Verter | **77.4 ms** | 74.1 ms | 11.7 ms | 15.1% ⚠ | 24.65x | 618 | 13 files/s |
| Vize | **222.6 ms** | 220.5 ms | 1.2 ms | 0.6% | 70.91x | 447 | 4 files/s |

<details><summary>Notes</summary>

- **Volar (N)**: Identical to the Volar row except the TypeScript half runs on typescript-native-bridge (tsgo): same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.15.tsgo.7.0.2 tsdk. Exactly one variable against the baseline — the TypeScript engine — which is why the two are ranked in separate tables. · operation: hover on `props` · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue
- **Verter**: verter-lsp stdio, the native server from the published npm package, given the project directory as its workspace root. $/verter/ready is not waited for — its workspace load is inside the measured window like every other server's. · operation: hover on `props` · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue
- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry, because no version-matched native server was found; that costs ~35ms of Node bootstrap per spawn. Same workspace, file and position as every other row. · operation: hover on `props` · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 3.1 ms, 3.1 ms, 3.2 ms, 6.0 ms, 3.0 ms
- **Verter**: 101.0 ms, 92.1 ms, 76.9 ms, 77.4 ms, 74.1 ms
- **Vize**: 222.6 ms, 220.8 ms, 220.5 ms, 223.1 ms, 223.1 ms

</details>

<details><summary>Methodology</summary>

- Workspace root: @vben/layouts (packages/effects/layouts) — the project's own directory, its own tsconfig.json and its own installed dependencies, with 70 SFCs beneath it. Nothing is copied out and nothing is written in.
- Operation budget: 120 s, scaled by corpus size (+30 s per 500 SFCs past the first 500, capped at 300 s) and IDENTICAL for every server — a flat budget sized on small corpora turned "slow but real project load" into "the server never answered" on large ones, a harness budget in tool-verdict clothing.
- Every row runs a dedicated, discarded warmup session before its measured sessions. (The baseline preflight was considered as a substitute warm pass and rejected: it warms the shared workspace files for every server, but only the baseline's own binaries and tsdk — a per-server asymmetry a warm pass must not have.)
- Diagnostics rows time the FIRST publication for the opened document, which can be an empty preliminary; the count it carried and the first NON-EMPTY publication (time and count) are all published, and the diagnostic-content gate anchors on the maximum ANY ranked row reported across all samples so one racy empty message cannot disarm it.
- Document: packages/effects/layouts/src/authentication/authentication.vue. Hover position: line 25, character 6 — the identifier `props`, chosen by an untimed BASELINE pre-flight because it is a position the reference server actually answers at.
- Corpus pin: v5.7.0 @ 63a38dce, released 2026-05-21 (github-release), pinned 2026-07-29.
- Two operations, each measured in its OWN fresh server session: `didOpen → diagnostics` (cold — the server must load the real project before it can say anything) and `hover` (warm, median of 3, document already open). Sharing one session between them would credit the hover row with a project load the diagnostics row already paid for.
- Volar is measured as the two-process product it is in v3: @vue/language-server has no in-process TypeScript language service, so typescript-language-server with @vue/typescript-plugin is started too, the same .vue buffer is synced to both, and each feature is asked of both in parallel with the SLOWER half charged. Both processes' startup and project load are inside the timings.
- Rows are grouped by TypeScript ENGINE as well as by operation. `Volar (JS)` runs the stock JavaScript TypeScript compiler; `Volar (TNB / tsgo tsdk)` is the SAME Volar with its tsserver half on typescript-native-bridge. The pair isolates the engine, and because a JS-vs-native gap is not a Vue-tooling result the two are ranked in separate tables rather than one.
- HOVER CONTENT GATE: a row is UNRANKED unless it returned a non-empty hover on EVERY measured run, at the single position the baseline answered at untimed. An empty or absent answer is not a fast answer.
- DIAGNOSTIC CONTENT GATE: a run that never published diagnostics for the opened document is an ❌ error, not a fast row — there is no latency to report. The anchor is the maximum ANY ranked row published (not the baseline alone: Volar v3 routes most TypeScript diagnostics over its tsserver half, and where that half is silent a baseline-only anchor never fires, ranking 0-diagnostic rows first against peers publishing dozens). Where any server published at least one diagnostic, a row publishing none on every run is UNRANKED — baseline included; the note names the anchoring server. Where every server published an empty list, the gate cannot fire and each row says so rather than rendering as though it had passed.
- ⚠ DIAGNOSTICS IS OBSERVATIONAL/UNRANKED. `textDocument/publishDiagnostics` from the Volar rows carries what the VUE server computes; Volar v3 delegates TypeScript to a separate tsserver that speaks the tsserver protocol rather than LSP, so TypeScript diagnostics reach a real editor through the extension and are NOT in this notification. A single-process server publishes Vue and TypeScript diagnostics together. Those are unequal products, and this third-party document has no planted known-correct diagnostic set. Times and counts are retained to expose behaviour, but no ratio is published. Hover does not have this product asymmetry: both Volar halves are asked and the slower is charged.
- ⚠ CORRECTNESS OF THE CONTENT IS NOT ASSERTED. These are third-party sources with no planted marker, so nobody has written down what the right hover text or the right diagnostic set is for them. This surface establishes that a server ANSWERED where the reference server answered, and nothing more. Content correctness is gated on the generated corpus (`lsp`), against a symbol whose type is known.
- The retry budget and per-request timeout are identical for every server, and retry sleeps fall inside the measured window — an asymmetric budget would silently subsidise whichever server got the larger one. Readiness is established the same way for every server, by retrying the operation until it answers, so whoever needs project-load time pays for it in the metric.
- A degraded type backend is detected from stderr and reported on any row, ranked or not (Vize logs a failed Corsa spawn, Verter logs verter-only mode). It is reported rather than used to fail a row on its own: the content gates decide ranking, and this is the explanation for the number in either direction.
- Each measured run starts a fresh server process, so per-process project load is paid every time and no run inherits another's cache. Server order is rotated on every warmup and measured run.
- VS Code extension-host overhead is NOT measured — only the language-server stdio protocol.

</details>
