# Real-world: ant-design-vue

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../../results/benchmarks/) and [`results/real_world/`](../../results/real_world/) by `pnpm docs`. Do not edit by hand.

**ant-design-vue:demos** — [`vueComponent/ant-design-vue`](https://github.com/vueComponent/ant-design-vue) 4.2.6 @ `4a37016f4e` · 695 files · **no lockfile** (unranked corpus)

- **Generated:** 2026-08-27T10:55:50.800Z
- **Fixture:** `fixtures/real` (695 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · INTEL(R) XEON(R) PLATINUM 8573C · 15.6 GB · Node v22.23.2
- **Commit:** [`abafafd`](https://github.com/pikax/vue-benchmarks/commit/abafafd07c14f26c07f1d0ed9da818102fdc97e1)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/33062222081

Ranked on the **median of measured runs**. Warm series follow ≥1 discarded warmup and are the primary ordering and ranking metric wherever both series exist. Compiler and Component-meta additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup and package imports. It is not called Cold and its ratio/noise gate never substitutes for Warm. What else the child excludes differs by surface and each surface states it in its own methodology — Compiler builds its compiler host outside the timer, Component-meta builds its checker/session inside it, because its warm timer does too. Every table sorts fastest-first and every ratio column is **vs fastest** — the fastest ranked row is the 1.00x denominator; no tool is pinned as a reference. One table per surface unless that surface declares explicit work-equivalence classes; engine, invocation and threading are row properties, not implicit table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three warm samples is bracketed as TOO NOISY TO RANK, no tool exempted (a two-run spread has no third sample to adjudicate, so it is flagged, not bracketed). Per-row detail is under **Notes** below each table.

> Corpora are pinned checkouts of third-party open-source Vue projects; sources are unmodified and every page names its ref and resolved commit SHA.
> **Rank within a corpus, never across it.** The corpora differ in size and in kind — library source, application source and documentation demos are not the same code.
> **⚠ unranked** is a gate, not a verdict on the official toolchain. A project shipping **no lockfile** at the pinned ref cannot be installed frozen, so every row on that corpus is unranked equally — including vue-tsc.

### Format

Files: **695** · Bytes: **920,155**

Tools:

- **Prettier** — prettier --write over a fresh corpus copy; built-in Vue SFC support, single-threaded by design.
- **Oxfmt** — oxfmt --write — Oxc's Vue-capable formatter, multi-threaded.
- **Vize** — vize fmt --write.
- **Biome format** — biome format --write — multi-threaded; the exact pinned row rewrites none of the planted .vue corpus and is unranked on the full-SFC format surface.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **365.6 ms** | 352.0 ms | 182.7 ms | 50.0% ⚠ | 1.00x | n/a | 1.9k files/s |
| Oxfmt | **3.33 s** | 3.28 s | 125.7 ms | 3.8% | 9.11x | n/a | 209 files/s |
| Prettier | **4.80 s** | 4.76 s | 286.2 ms | 6.0% | 13.14x | n/a | 145 files/s |
| Biome format ⚠ | (119.9 ms) | (119.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded | ⓘ file coverage verified: rewrote 695/695 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Oxfmt**: oxfmt --write (fresh copy each run) · pinned 0.65.0 routes a full .vue file through its bundled Prettier formatFile callback in worker threads; the native binding orchestrates the call, but Vue parsing/printing is the bundled Prettier path. Re-audit this package path after upgrades. | ⓘ file coverage verified: rewrote 695/695 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Prettier**: prettier --write **/*.vue (fresh copy each run) · single-threaded by design | ⓘ file coverage verified: rewrote 695/695 planted corpus files. | ✓ format validity 3/3: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.
- **Biome format ⚠**: biome format --write . (fresh copy each run) · multi-threaded (Rayon; honours RAYON_NUM_THREADS) · exact pinned row currently rewrites none of the planted .vue corpus | ⚠ FAILED FILE-COVERAGE GATE — rewrote 0 of 695 planted corpus files. A tool covering fewer files finishes sooner; that is a different job, not a faster one. Measured but UNRANKED. | ⚠ FORMAT SEMANTIC VALIDITY FAIL — template-behaviour: messy template block was not rewritten; descriptor-attributes: messy template block was not rewritten. Full per-plant evidence is retained in validation.formatSemantics.

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

- **Vize**: 778.4 ms, 352.0 ms, 353.7 ms, 365.6 ms, 442.6 ms
- **Oxfmt**: 3.42 s, 3.58 s, 3.33 s, 3.28 s, 3.28 s
- **Prettier**: 5.42 s, 4.80 s, 4.81 s, 4.76 s, 4.76 s
- **Biome format**: 119.9 ms, 120.1 ms, 120.7 ms, 119.6 ms, 119.0 ms

</details>

### Lint

Files: **695** · Bytes: **920,155**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Biome lint (default threads)** — biome lint with its default pool size — script block only. No template rules, so it misses the planted Vue template rules and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — the exact pinned row is script-block-only on the planted Vue template capabilities and remains unranked.
- **Oxlint (default threads)** — oxlint with its default pool size and vue plugin enabled — script block only, so it misses the planted Vue template rules; unranked.

##### Vue SFC lint — fresh CLI process

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (default threads) | **78.7 ms** | 76.7 ms | 2.0 ms | 2.5% | 1.00x | n/a | 8.8k files/s |
| Vize lint (1T) | **109.5 ms** | 107.8 ms | 7.0 ms | 6.4% | 1.39x | n/a | 6.3k files/s |
| eslint-plugin-vue (CLI) | **4.11 s** | 4.08 s | 34.6 ms | 0.8% | 52.25x | n/a | 169 files/s |
| Biome lint (1T) ⚠ | (671.6 ms) | (666.2 ms) | – | – | not ranked | – | – |
| Biome lint (default threads) ⚠ | (279.4 ms) | (276.5 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (69.2 ms) | (66.6 ms) | – | – | not ranked | – | – |
| Oxlint (default threads) ⚠ | (57.5 ms) | (54.9 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize lint (default threads)**: vize lint . using default Rayon pool; diagnostics are not suppressed | ⓘ file coverage verified: named 695/695 planted corpus files. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Vize lint (1T)**: vize lint . with RAYON_NUM_THREADS=1; diagnostics are not suppressed | ⓘ file coverage verified: named 695/695 planted corpus files. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **eslint-plugin-vue (CLI)**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs | ⓘ file coverage verified: named 695/695 planted corpus files. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Biome lint (1T) ⚠**: biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules | ⓘ file coverage verified: named 695/695 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Biome lint (default threads) ⚠**: biome lint . using its undocumented default pool size · script block only | ⓘ file coverage verified: named 695/695 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Oxlint (1T) ⚠**: oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules | ⓘ file coverage verified: named 695/695 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Oxlint (default threads) ⚠**: oxlint . on its default thread pool, vue plugin enabled · script block only | ⓘ file coverage verified: named 695/695 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.

</details>

##### Vue SFC lint — in-process APIs

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-vue (1T) | **2.79 s** | 2.75 s | 259.0 ms | 9.3% | 1.00x | n/a | 249 files/s |
| eslint-plugin-vue (4 workers) | **4.00 s** | 3.96 s | 30.7 ms | 0.8% | 1.44x | n/a | 174 files/s |
| Verter host lint ⚠ | (440.6 ms) | (422.0 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles | ⓘ file coverage by construction: this invocation is handed the 695 corpus files as an explicit list, not a directory walk. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **eslint-plugin-vue (4 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker) | ⓘ file coverage by construction: this invocation is handed the 695 corpus files as an explicit list, not a directory walk. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Verter host lint ⚠**: VerterHost.upsert + lint(canonicalId) for each file (if API available) | ⓘ file coverage by construction: this invocation is handed the 695 corpus files as an explicit list, not a directory walk. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — duplicate-attributes: dirty twin had no file+line+rule/concept-attributed diagnostic; require-component-is: clean twin retained the planted diagnostic. Rows missing any mandatory planted capability remain contextual/unranked; all results are retained in validation.lintSemantics.

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

- **Vize lint (default threads)**: 77.1 ms, 76.7 ms, 79.1 ms, 78.7 ms, 81.7 ms
- **Vize lint (1T)**: 110.5 ms, 109.0 ms, 107.8 ms, 124.6 ms, 109.5 ms
- **eslint-plugin-vue (CLI)**: 4.10 s, 4.08 s, 4.11 s, 4.14 s, 4.17 s
- **Biome lint (1T)**: 671.2 ms, 666.2 ms, 683.9 ms, 671.6 ms, 692.2 ms
- **Biome lint (default threads)**: 276.5 ms, 279.2 ms, 279.4 ms, 279.6 ms, 280.1 ms
- **Oxlint (1T)**: 68.3 ms, 66.6 ms, 73.5 ms, 69.2 ms, 72.8 ms
- **Oxlint (default threads)**: 59.0 ms, 54.9 ms, 57.5 ms, 56.7 ms, 57.6 ms
- **eslint-plugin-vue (1T)**: 3.17 s, 3.31 s, 2.79 s, 2.78 s, 2.75 s
- **eslint-plugin-vue (4 workers)**: 3.96 s, 4.00 s, 4.01 s, 4.00 s, 4.04 s
- **Verter host lint**: 422.0 ms, 441.1 ms, 451.8 ms, 436.6 ms, 440.6 ms

</details>

### Bundle (production build) — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

Grouped by **bundler**, ranked within each group by Vue integration. Rows from different bundlers are never ranked against each other: read **across a row** (same bundler, different integration) for the Vue layer, and **down a column** (same integration, different bundler) for bundler architecture — the second is context, not a verdict.

#### Vite 8 (Rolldown) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 8 (Rolldown) × @vitejs/plugin-vue ❌ | error | – | – | – | – | – | – |
| Vite 8 (Rolldown) × unplugin-vue ❌ | error | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ❌ | error | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ❌ | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vite 8 (Rolldown) × @vitejs/plugin-vue ❌**: Build failed with 6 errors:  [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/modal/demo/fullscreen.vue?vue&type=style&index=0&lang.less
- **Vite 8 (Rolldown) × unplugin-vue ❌**: Build failed with 6 errors:  [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/modal/demo/fullscreen.vue?vue&type=style&index=0&lang.less
- **Vite 8 (Rolldown) × @vizejs/vite-plugin ❌**: Build failed with 6 errors:  [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/config-provider/demo/direction.vue?vue=&type=style&index=0&scoped=data-v-095ef9fc&lang=less.less.less.less
- **Vite 8 (Rolldown) × @verter/unplugin ❌**: Build failed with 6 errors:  [plugin vite:css] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/ant-design-vue/bundle/ant-design-vue-demos/components/grid/demo/flex.vue?vue&type=style&index=0&lang.less

</details>

#### Rolldown (no Vite) — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rolldown (no Vite) × unplugin-vue ⏭ | skipped | – | – | – | – | – | – |
| Rolldown (no Vite) × @verter/unplugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rolldown (no Vite) × unplugin-vue ⏭**: ⏭ NOT MEASURED — this corpus carries 98 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. A failure here would be the pairing's, not unplugin-vue's. The Vite 8 group bundles the same corpus with the same Rolldown engine under Vite's CSS handling.
- **Rolldown (no Vite) × @verter/unplugin ⏭**: ⏭ NOT MEASURED — this corpus carries 98 &lt;style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. A failure here would be the pairing's, not @verter/unplugin's. The Vite 8 group bundles the same corpus with the same Rolldown engine under Vite's CSS handling.

</details>

#### Rspack — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rspack × vue-loader ⚠ | (1.67 s) | (1.59 s) | – | – | not ranked | (6,303,083) | – |
| Rspack × unplugin-vue ⚠ | (1.45 s) | (1.44 s) | – | – | not ranked | (4,691,498) | – |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ⚠ | (1.21 s) | (1.19 s) | – | – | not ranked | (4,419,919) | – |

<details><summary>Notes</summary>

- **Rspack × vue-loader ⚠**: loader chain · compiled 695/695 corpus SFCs · 98 style sub-requests · 6,303,083 output bytes | The official webpack Vue integration — a loader rule plus VueLoaderPlugin. The reference implementation for this family. | Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank.
- **Rspack × unplugin-vue ⚠**: lazy per-module transform · compiled 695/695 corpus SFCs · 98 style sub-requests · 4,691,498 output bytes | Official compiler pipeline as an unplugin, so the same code path the Vite rows use. | Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank. | ⚠ COMPARISON REFERENCE UNAVAILABLE/INVALID: Rspack's Vue reference row did not produce a valid ranked result, so candidate timings remain visible but no ratio in this class may rank.
- **Rspack × @vizejs/rspack-plugin ❌**:   × ESModulesLinkingError: export 'default' (imported as 'Basic') was not found in './basic.vue' (possible exports: render)     ╭─[19:8]  17 │     US,
- **Rspack × @verter/unplugin ⚠**: lazy per-module transform · compiled 695/695 corpus SFCs · 100 style sub-requests · 4,419,919 output bytes | Verter's universal bundler plugin (unplugin; webpack/rspack entry point). | Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank. | ⚠ COMPARISON REFERENCE UNAVAILABLE/INVALID: Rspack's Vue reference row did not produce a valid ranked result, so candidate timings remain visible but no ratio in this class may rank.

</details>

<details><summary>Raw runs</summary>

- **Rspack × vue-loader**: 1.75 s, 1.59 s
- **Rspack × unplugin-vue**: 1.45 s, 1.44 s
- **Rspack × @verter/unplugin**: 1.19 s, 1.22 s

</details>

#### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader ⚠ | (1.85 s) | (1.83 s) | – | – | not ranked | (9,745,465) | – |
| webpack 5 × unplugin-vue ⚠ | (2.61 s) | (2.42 s) | – | – | not ranked | (7,283,567) | – |
| webpack 5 × @verter/unplugin ⚠ | (1.98 s) | (1.82 s) | – | – | not ranked | (5,512,482) | – |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **webpack 5 × vue-loader ⚠**: loader chain · compiled 695/695 corpus SFCs · 98 style sub-requests · 9,745,465 output bytes | The official webpack Vue integration — a loader rule plus VueLoaderPlugin. The reference implementation for this family. | The reference webpack implementation. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank.
- **webpack 5 × unplugin-vue ⚠**: lazy per-module transform · compiled 695/695 corpus SFCs · 98 style sub-requests · 7,283,567 output bytes | Official compiler pipeline as an unplugin, so the same code path the Vite rows use. | The reference webpack implementation. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank. | ⚠ COMPARISON REFERENCE UNAVAILABLE/INVALID: webpack 5's Vue reference row did not produce a valid ranked result, so candidate timings remain visible but no ratio in this class may rank.
- **webpack 5 × @verter/unplugin ⚠**: lazy per-module transform · compiled 695/695 corpus SFCs · 100 style sub-requests · 5,512,482 output bytes | Verter's universal bundler plugin (unplugin; webpack/rspack entry point). | The reference webpack implementation. Loader/plugin architecture, not Rollup hooks. | ⚠ BUNDLE STRUCTURAL VALIDITY FAIL: cssVariableLinkage. Time remains visible but is excluded from ranking. | ⚠ COMPARISON REFERENCE INVALID: this bundler's official/reference integration did not pass the same canary, so no peer ratio in the class may rank. | ⚠ COMPARISON REFERENCE UNAVAILABLE/INVALID: webpack 5's Vue reference row did not produce a valid ranked result, so candidate timings remain visible but no ratio in this class may rank.
- **webpack 5 × @vizejs/rspack-plugin ⏭**: @vizejs/rspack-plugin publishes no webpack entry point

</details>

<details><summary>Raw runs</summary>

- **webpack 5 × vue-loader**: 1.88 s, 1.83 s
- **webpack 5 × unplugin-vue**: 2.42 s, 2.81 s
- **webpack 5 × @verter/unplugin**: 2.14 s, 1.82 s

</details>

<details><summary>Methodology</summary>

- Corpus: ant-design-vue:demos @ 4a37016f — 695 SFCs, docs-demo, MIT. Sources are third-party and unmodified.
- The staged copy carries the corpus SFCs' RELATIVE import closure (764 extra source files) so @vue/compiler-sfc can resolve imported prop types from disk, exactly as it can in the real checkout. Closure files exist for the COMPILER only: the bundler-facing resolvers externalise them, so the module graph is still exactly the corpus.
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

### HMR / dev server — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

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
| Vite 8 (Rolldown) × @verter/unplugin | **55.0 ms** | 52.8 ms | 3.2 ms | 5.8% | 1.00x | n/a | 12.6k files/s |
| Vite 8 (Rolldown) × unplugin-vue | **59.4 ms** | 56.9 ms | 3.5 ms | 5.9% | 1.08x | n/a | 11.7k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **61.1 ms** | 51.8 ms | 13.1 ms | 21.5% ⚠ | 1.11x | n/a | 11.4k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **103.3 ms** | 97.4 ms | 8.3 ms | 8.0% | 1.88x | n/a | 6.7k files/s |

<details><summary>Notes</summary>

- **Vite 8 (Rolldown) × @verter/unplugin**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 695-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · lazy per-module transform
- **Vite 8 (Rolldown) × unplugin-vue**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 695-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · lazy per-module transform
- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 695-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · lazy per-module transform
- **Vite 8 (Rolldown) × @vizejs/vite-plugin**: createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full 695-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · eager native batch pre-compile

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

- **Vite 8 (Rolldown) × @verter/unplugin**: 57.3 ms, 52.8 ms
- **Vite 8 (Rolldown) × unplugin-vue**: 61.9 ms, 56.9 ms
- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: 70.4 ms, 51.8 ms
- **Vite 8 (Rolldown) × @vizejs/vite-plugin**: 109.1 ms, 97.4 ms

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
| Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠ | (5.0 ms) | (4.6 ms) | – | – | not ranked | (9,277) | – |
| Vite 8 (Rolldown) × unplugin-vue ⚠ | (5.1 ms) | (4.4 ms) | – | – | not ranked | (9,279) | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (0.5 ms) | (0.5 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠**: edit &lt;template> of components/affix/demo/basic.vue and components/affix/demo/index.vue → update · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | measured region: change announced → update message → updated module fetched over HTTP | revision plant verified in /components/affix/demo/basic.vue | ⚠ TOO NOISY TO RANK — CV 6603.1% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Vite 8 (Rolldown) × unplugin-vue ⚠**: edit &lt;template> of components/affix/demo/basic.vue and components/affix/demo/index.vue → update · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | measured region: change announced → update message → updated module fetched over HTTP | revision plant verified in /components/affix/demo/basic.vue | ⚠ TOO NOISY TO RANK — CV 528.5% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — no HMR message (headless probe limitation, not a tool result) exceeded 30000 ms. This is the harness declining to publish a number, not a statement about @vizejs/vite-plugin. The dev cold-start row for this cell is published regardless: that measurement succeeded, and discarding it would hide a working result behind a probe limitation.
- **Vite 8 (Rolldown) × @verter/unplugin ⚠**: edit &lt;template> of components/affix/demo/basic.vue and components/affix/demo/index.vue → full-reload · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | ⚠ FULL RELOAD, not a hot update — the server discarded the module instead of patching it, which is much less work. Measured but UNRANKED. | ⚠ FAILED REVISION PLANT — components/affix/demo/basic.vue fetched an update that did not contain its exact changed revision (full-reload carries no updated module). Resource/timing figures remain visible, but stale output is not ranked as a fast update.

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

- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: 744.3 ms, 5.0 ms, 6.1 ms, 5.0 ms, 4.6 ms
- **Vite 8 (Rolldown) × unplugin-vue**: 65.1 ms, 5.1 ms, 4.4 ms, 5.3 ms, 4.7 ms
- **Vite 8 (Rolldown) × @verter/unplugin**: 0.5 ms, 0.6 ms, 0.5 ms, 0.6 ms, 0.5 ms

</details>

<details><summary>Methodology</summary>

- Corpus: ant-design-vue:demos @ 4a37016f — 695 SFCs, third-party and unmodified.
- The staged copy carries the corpus SFCs' relative import closure (764 extra source files) for @vue/compiler-sfc's type resolution; the resolver still externalises them, so the module graph is exactly the corpus.
- HMR probes: a fixed-width hidden element carrying a unique revision token is inserted inside the &lt;template> block of components/affix/demo/basic.vue and then components/affix/demo/index.vue — genuine template changes, one round trip per probe per run, ms = the mean. The token must appear in the announced transformed module or that SFC's own template submodule; a missing/stale revision is measured but UNRANKED. A &lt;script setup> edit would make Vue issue a full page reload instead of a hot update — a different and cheaper server path.
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

### Project test suite — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

<details><summary>Methodology</summary>

- No Vitest target found in ant-design-vue at 4.2.6. Discovery looks for a package with a non-watch script that invokes vitest AND vitest as a dependency; a suite driven by jest, playwright or a bespoke runner is not something a Vue plugin can be swapped into, so it is not run rather than run meaninglessly.
- Measured runs capped at 1 for this surface (requested 5; per-surface runtime budget, 2026-07-30). project-test is a correctness surface — its timing is INDICATIVE, not a ranking a median-of-5 would sharpen.
- ⚠ ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

Raw runs:

</details>

### Project build (own config) — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

<details><summary>Methodology</summary>

- No reliably swappable build target in ant-design-vue at 4.2.6. A target needs a literal `vite build` script, an importable vite.config, and SFCs beneath it. Excluded by design: `nuxt build` / `quasar build` (Vite config generated at runtime, so there is no plugins array to substitute into) and workspace fan-out scripts (`pnpm -r`, `turbo run`, which would time packages containing no Vue). Measuring those approximately would be worse than not measuring them.
- ⚠ ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

Raw runs:

</details>

### Project typecheck (own tsconfig) — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

<details><summary>Methodology</summary>

- No typecheck target in ant-design-vue could be checked by the baseline (vue-tsc) in this environment, so there is no reference to rank against and no rows are published.
- Candidate ant-design-vue (., 733 SFCs) was REJECTED before measurement: baseline vue-tsc exited 2 reporting 1 diagnostic(s) across 1 file(s) (retried with --ignoreDeprecations 6.0 after TS5101/TS5107 — still failed) — that is program construction failing, not a typecheck. First: tsconfig.json(24,5): error TS5102: Option 'importsNotUsedAsValues' has been removed. Please remove it from your configuration.. No rows are published for a target the baseline cannot check — a fast abort is indistinguishable from a fast pass on a wall-clock table, and every other row would be gated against it.
- Measured runs capped at 2 for this surface (requested 5; per-surface runtime budget, 2026-07-30). Set BENCH_UNIFORM_RUNS=1 for equal run counts everywhere.
- ⚠ ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

Raw runs:

</details>

### Project component-meta (own tsconfig) — ant-design-vue:demos

Files: **695** · Bytes: **920,155**

##### Project component public-API metadata

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-component-meta ⚠ | (4.45 s) | (3.86 s) | – | – | not ranked | (695) | – |
| @verter/component-meta ⚠ | (2.28 s) | (2.24 s) | – | – | not ranked | (695) | – |

<details><summary>Notes</summary>

- **vue-component-meta ⚠**: BASELINE · createChecker(tsconfig.json) + getComponentMeta for each of 695 corpus SFCs under ., using the project's own tsconfig and installed dependencies ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props.value: missing; options-api-component: events.increment: missing; events.reset: missing. | ⚠ UNRANKED — NO LOCKFILE: ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **@verter/component-meta ⚠**: openComponentMetaSession({root: ., tsconfig: tsconfig.json}) + getComponentMeta for the same 695 corpus SFCs | ⚠ FAILED PROP-COVERAGE GATE — reported ZERO props for 1 of the 5 components that DECLARE props in their source and that the baseline also found props on (e.g. components/select/demo/custom-dropdown-menu.vue). Returning an empty API is the trivial way to be fast on this surface. Measured but UNRANKED. | ⓘ reported 7 props+events+slots against the baseline's 8347 across the same 695 components. Member counts are NOT asserted equivalent: the tools differ on whether inherited and implicit surface belongs to a component's public API. The gated quantities are components resolved and per-component prop coverage. ⚠ COMPONENT-META SEMANTIC VALIDITY FAIL (27/29 passed) — external-props-import: props.name: missing; props.hint: missing; props-destructure: props.count: expected hasDefault; props.verbose: expected hasDefault. ⚠ COMPARISON REFERENCE INVALID: the official Vue component-meta baseline did not pass mandatory validation. | ⚠ UNRANKED — NO LOCKFILE: ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

##### PROJECT-COMPONENT-META — ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Vize component-meta ⏭**: No component-meta API found on @vizejs/native in this install (loaded successfully, but exports no extractComponentMeta()). Declaration emit is a different job and is NOT substituted for metadata extraction.

</details>

<details><summary>Methodology</summary>

- Target: ant-design-vue (.) — 695 corpus SFCs, read with the project's OWN tsconfig.json and its own installed dependencies.
- Corpus pin: 4.2.6 @ 4a37016f, released 2024-11-11 (github-release), pinned 2026-07-29.
- The component set is the RESOLVED CORPUS restricted to the target package, not a private walk — so `--file-limit` and its truncation disclosure apply here exactly as they do to every other real-world surface. A private walk would quietly measure a different file set from the one the corpus line names.
- Both tools are given the same absolute file list, the same tsconfig and the same directory, and each is driven through its own published entry point. No payload is hand-decoded and no row is measured through an API it does not ship.
- POST-TIMING ENTRYPOINT-CAPABILITY GATE: suite 2026-08-20.2 runs 29 known generated cases through the same createChecker/getComponentMeta and openComponentMetaSession/getComponentMeta lifecycles in isolated children. It never reads or writes the third-party checkout and cannot warm its timed programs. A failure or UNKNOWN exact entrypoint is measured but UNRANKED; a failed Vue reference invalidates the class. This gate proves only that the published API handles the planted language features, not that this project's metadata is semantically equivalent.
- The target was pre-flighted: the baseline built a checker and extracted from a bounded sample untimed first, and the target is measured only because that resolved components AND found declared props on some of them. A target the baseline cannot read publishes no rows at all — every other row would be gated against a reference that did no work.
- Metadata census gate: a row that resolved metadata for fewer components than the baseline is UNRANKED, and so is a row that resolved none at all — including the baseline's own row, which is gated identically. Returning `{}` is the fastest thing a metadata extractor can do.
- Prop-coverage gate: a row reporting ZERO props for any component the baseline found props on is UNRANKED. This is the gate that catches a fast, empty answer hiding behind a healthy-looking component count.
- Member totals (props+events+slots) are published but NEVER gated. The tools disagree about what belongs to a component's public API — vue-component-meta reports inherited and implicit surface, Verter reports the declared API — and gating on that would brand a tool for a schema definition rather than for doing less work. The per-component prop coverage above is the part that is not a schema disagreement.
- PROJECT METADATA EQUIVALENCE remains UNKNOWN and is not asserted: the generated capability plants do not supply an oracle for the third-party components, and nobody has written down their complete correct public APIs. This is a throughput surface with a project coverage census plus a separate entrypoint-capability gate.
- Each measured run constructs a fresh checker/session and Verter's pooled engine is evicted afterwards, so no run inherits another's warm program. Tool order is rotated on every warmup and measured run.
- The checkout is never written to by this surface — it only reads.
- ⚠ ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

Raw runs:

- **vue-component-meta**: 4.74 s, 4.06 s, 4.62 s, 4.45 s, 3.86 s
- **@verter/component-meta**: 2.24 s, 2.25 s, 2.28 s, 2.30 s, 2.33 s

</details>

### Project LSP (project as workspace) — ant-design-vue:demos

Files: **1** · Bytes: **528**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).

Hover is ranked per TypeScript engine; diagnostics is observational and always unranked. The operations differ by orders of magnitude and answer unrelated questions, a ratio across engines measures TypeScript's Go rewrite as much as the Vue layer, and the diagnostics products are unequal (Volar Vue-only LSP publication versus native combined Vue+TypeScript publication) with no known-correct answer in third-party source.

#### didOpen → diagnostics — JavaScript TypeScript engine, observational only

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (6.23 s) | (6.19 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: BASELINE · official Vue language server v3 in hybrid (two-process) mode — the only mode v3 has. The measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver bridge. Both processes' startup and project load of the real project are inside the timings. HOVER asks both halves in parallel and charges the slower; DIAGNOSTICS times the first publication for the document from either half (which may be an empty preliminary — the count it carried and the first NON-EMPTY publication are both published). · operation: didOpen → diagnostics · workspace ., document components/affix/demo/basic.vue | ⓘ DIAGNOSTIC-CONTENT GATE NOT RUN — every server published an EMPTY diagnostic list for this document. That is a legitimate answer, but not one any row can be measured against. Ranked, but unverified rather than verified-equal. | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking. | ⚠ UNRANKED — NO LOCKFILE: ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 6.31 s, 6.19 s, 6.23 s, 6.23 s, 6.25 s

</details>

#### didOpen → diagnostics — native tsgo engines, observational only

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) ⚠ | (4.18 s) | (4.12 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (1.11 s) | (984.0 ms) | – | – | not ranked | (0) | – |
| Vize ⚠ | (2.01 s) | (1.98 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (N) ⚠**: Identical to the Volar row except the TypeScript half runs on typescript-native-bridge (tsgo): same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.15.tsgo.7.0.2 tsdk. Exactly one variable against the baseline — the TypeScript engine — which is why the two are ranked in separate tables. · operation: didOpen → diagnostics · workspace ., document components/affix/demo/basic.vue | ⓘ DIAGNOSTIC-CONTENT GATE NOT RUN — every server published an EMPTY diagnostic list for this document. That is a legitimate answer, but not one any row can be measured against. Ranked, but unverified rather than verified-equal. | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking. | ⚠ UNRANKED — NO LOCKFILE: ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **Verter ⚠**: verter-lsp stdio, the native server from the published npm package, given the project directory as its workspace root. $/verter/ready is not waited for — its workspace load is inside the measured window like every other server's. · operation: didOpen → diagnostics · workspace ., document components/affix/demo/basic.vue | ⓘ DIAGNOSTIC-CONTENT GATE NOT RUN — every server published an EMPTY diagnostic list for this document. That is a legitimate answer, but not one any row can be measured against. Ranked, but unverified rather than verified-equal. | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking. | ⚠ VUE REFERENCE UNAVAILABLE/INVALID — this operation × engine class has no valid official Vue reference, so candidate timing remains visible but cannot rank. | ⚠ UNRANKED — NO LOCKFILE: ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **Vize ⚠**: vize lsp --stdio, launched from the npm package's NODE entry, because no version-matched native server was found; that costs ~35ms of Node bootstrap per spawn. Same workspace, file and position as every other row. · operation: didOpen → diagnostics · workspace ., document components/affix/demo/basic.vue | ⓘ DIAGNOSTIC-CONTENT GATE NOT RUN — every server published an EMPTY diagnostic list for this document. That is a legitimate answer, but not one any row can be measured against. Ranked, but unverified rather than verified-equal. | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking. | ⚠ VUE REFERENCE UNAVAILABLE/INVALID — this operation × engine class has no valid official Vue reference, so candidate timing remains visible but cannot rank. | ⚠ UNRANKED — NO LOCKFILE: ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 4.18 s, 4.19 s, 4.18 s, 4.12 s, 4.20 s
- **Verter**: 1.11 s, 984.0 ms, 1.31 s, 1.01 s, 1.12 s
- **Vize**: 2.01 s, 2.03 s, 1.99 s, 1.98 s, 2.01 s

</details>

#### hover on `top` — JavaScript TypeScript engine, ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (2.0 ms) | (1.7 ms) | – | – | not ranked | (48) | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: BASELINE · official Vue language server v3 in hybrid (two-process) mode — the only mode v3 has. The measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver bridge. Both processes' startup and project load of the real project are inside the timings. HOVER asks both halves in parallel and charges the slower; DIAGNOSTICS times the first publication for the document from either half (which may be an empty preliminary — the count it carried and the first NON-EMPTY publication are both published). · operation: hover on `top` · workspace ., document components/affix/demo/basic.vue | ⚠ UNRANKED — NO LOCKFILE: ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 2.9 ms, 2.9 ms, 2.0 ms, 1.9 ms, 1.7 ms

</details>

#### hover on `top` — native tsgo engines, ranked together

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (N) ⚠ | (17.9 ms) | (17.3 ms) | – | – | not ranked | (48) | – |
| Verter ⚠ | (0.8 ms) | (0.8 ms) | – | – | not ranked | (48) | – |
| Vize ⚠ | (1.7 ms) | (1.6 ms) | – | – | not ranked | (48) | – |

<details><summary>Notes</summary>

- **Volar (N) ⚠**: Identical to the Volar row except the TypeScript half runs on typescript-native-bridge (tsgo): same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.15.tsgo.7.0.2 tsdk. Exactly one variable against the baseline — the TypeScript engine — which is why the two are ranked in separate tables. · operation: hover on `top` · workspace ., document components/affix/demo/basic.vue | ⚠ UNRANKED — NO LOCKFILE: ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **Verter ⚠**: verter-lsp stdio, the native server from the published npm package, given the project directory as its workspace root. $/verter/ready is not waited for — its workspace load is inside the measured window like every other server's. · operation: hover on `top` · workspace ., document components/affix/demo/basic.vue | ⚠ UNRANKED — NO LOCKFILE: ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.
- **Vize ⚠**: vize lsp --stdio, launched from the npm package's NODE entry, because no version-matched native server was found; that costs ~35ms of Node bootstrap per spawn. Same workspace, file and position as every other row. · operation: hover on `top` · workspace ., document components/affix/demo/basic.vue | ⚠ UNRANKED — NO LOCKFILE: ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>

<details><summary>Raw runs</summary>

- **Volar (N)**: 18.3 ms, 17.9 ms, 17.9 ms, 17.3 ms, 18.4 ms
- **Verter**: 0.9 ms, 0.8 ms, 0.9 ms, 0.8 ms, 0.8 ms
- **Vize**: 1.6 ms, 1.6 ms, 1.8 ms, 1.7 ms, 1.8 ms

</details>

<details><summary>Methodology</summary>

- Workspace root: ant-design-vue (.) — the project's own directory, its own tsconfig.json and its own installed dependencies, with 733 SFCs beneath it. Nothing is copied out and nothing is written in.
- Operation budget: 150 s, scaled by corpus size (+30 s per 500 SFCs past the first 500, capped at 300 s) and IDENTICAL for every server — a flat budget sized on small corpora turned "slow but real project load" into "the server never answered" on large ones, a harness budget in tool-verdict clothing.
- Every row runs a dedicated, discarded warmup session before its measured sessions. (The baseline preflight was considered as a substitute warm pass and rejected: it warms the shared workspace files for every server, but only the baseline's own binaries and tsdk — a per-server asymmetry a warm pass must not have.)
- Diagnostics rows time the FIRST publication for the opened document, which can be an empty preliminary; the count it carried and the first NON-EMPTY publication (time and count) are all published, and the diagnostic-content gate anchors on the maximum ANY ranked row reported across all samples so one racy empty message cannot disarm it.
- Document: components/affix/demo/basic.vue. Hover position: line 30, character 6 — the identifier `top`, chosen by an untimed BASELINE pre-flight because it is a position the reference server actually answers at.
- Corpus pin: 4.2.6 @ 4a37016f, released 2024-11-11 (github-release), pinned 2026-07-29.
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
- ⚠ ant-design-vue ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on project-test, project-build, project-typecheck, project-component-meta, project-lsp are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.

</details>
