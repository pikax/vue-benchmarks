# Lint

> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.

- **Generated:** 2026-08-19T18:37:25.414Z
- **Fixture:** `fixtures/200` (200 files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 15.6 GB · Node v22.23.2
- **Commit:** [`94f6696`](https://github.com/pikax/vue-benchmarks/commit/94f6696b1c7b6f54928678126b9831febd70b4ff)
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/32287835178
- **Source:** `results/benchmarks/bench-Linux-200-bench.json`

## Results

Ranked on the **median of measured runs**. Warm series follow ≥1 discarded warmup and are the Compiler surface's primary ordering and ranking metric. Compiler additionally publishes a separately sampled **Fresh child** column: the first timed row workload after excluded process startup, imports and adapter setup. It is not called Cold and its ratio/noise gate never substitutes for Warm. Every table sorts fastest-first and every ratio column is **vs fastest** — the fastest ranked row is the 1.00x denominator; no tool is pinned as a reference. One table per surface unless that surface declares explicit work-equivalence classes; engine, invocation and threading are row properties, not implicit table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three warm samples is bracketed as TOO NOISY TO RANK, no tool exempted (a two-run spread has no third sample to adjudicate, so it is flagged, not bracketed). Per-row detail is under **Notes** below each table.

> **Peak RSS** on a timing row is the tool's peak resident set: measured in the timed session where the runner samples it (LSP servers, real-world CLIs), otherwise injected from the isolated memory probe below — the probe runs each tool in its own process, separate from timing.

2026-08-20 · `fixtures/200` (200 files) · win32/x64 · source `bench-win32-200.json`

> ⚠ **Local run — not the published Linux CI series** (win32/x64 · **dirty worktree** — not attributable to a single commit). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

### Lint

Files: **200** · Bytes: **285,701**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Biome lint (default threads)** — biome lint with its default pool size — script block only. No template rules, so it misses the planted Vue template rules and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — the exact pinned row is script-block-only on the planted Vue template capabilities and remains unranked.
- **Oxlint (default threads)** — oxlint with its default pool size and vue plugin enabled — script block only, so it misses the planted Vue template rules; unranked.

##### Vue SFC lint — fresh CLI process

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lint-bench-win32-200-lint-vue-sfc-lint-fresh-cli-process-dark.svg">
  <img alt="Lint — Vue SFC lint — fresh CLI process" src="charts/lint-bench-win32-200-lint-vue-sfc-lint-fresh-cli-process.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-vue (CLI) | **1.94 s** | 1.83 s | 82.0 ms | 4.2% | 1.00x | n/a | 103 files/s | – |
| Vize lint (1T) ⚠ | (162.8 ms) | (145.0 ms) | – | – | not ranked | – | – | – |
| Vize lint (default threads) ⚠ | (134.3 ms) | (122.8 ms) | – | – | not ranked | – | – | (68.5 MB) |
| Biome lint (1T) ⚠ | (376.9 ms) | (373.8 ms) | – | – | not ranked | – | – | – |
| Biome lint (default threads) ⚠ | (227.1 ms) | (224.5 ms) | – | – | not ranked | – | – | (104.7 MB) |
| Oxlint (1T) ⚠ | (128.7 ms) | (122.4 ms) | – | – | not ranked | – | – | – |
| Oxlint (default threads) ⚠ | (124.9 ms) | (120.6 ms) | – | – | not ranked | – | – | (99.4 MB) |

<details><summary>Notes</summary>

- **eslint-plugin-vue (CLI)**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs | ⓘ file coverage verified: named 200/200 planted corpus files. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Vize lint (1T) ⚠**: vize lint . with RAYON_NUM_THREADS=1; diagnostics are not suppressed | ⓘ file coverage verified: named 200/200 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — mutating-props: dirty twin had no file+line+rule/concept-attributed diagnostic; deprecated-slot-attribute: dirty twin had no file+line+rule/concept-attributed diagnostic. Rows missing any mandatory planted capability remain contextual/unranked; all results are retained in validation.lintSemantics.
- **Vize lint (default threads) ⚠**: vize lint . using default Rayon pool; diagnostics are not suppressed | ⓘ file coverage verified: named 200/200 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — mutating-props: dirty twin had no file+line+rule/concept-attributed diagnostic; deprecated-slot-attribute: dirty twin had no file+line+rule/concept-attributed diagnostic. Rows missing any mandatory planted capability remain contextual/unranked; all results are retained in validation.lintSemantics.
- **Biome lint (1T) ⚠**: biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules | ⓘ file coverage verified: named 200/200 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Biome lint (default threads) ⚠**: biome lint . using its undocumented default pool size · script block only | ⓘ file coverage verified: named 200/200 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Oxlint (1T) ⚠**: oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules | ⓘ file coverage verified: named 200/200 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.
- **Oxlint (default threads) ⚠**: oxlint . on its default thread pool, vue plugin enabled · script block only | ⓘ file coverage verified: named 200/200 planted corpus files. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — v-html: dirty twin had no file+line+rule/concept-attributed diagnostic; v-for-key: dirty twin had no file+line+rule/concept-attributed diagnostic. This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked; all results are retained in validation.lintSemantics.

</details>

##### Vue SFC lint — in-process APIs

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lint-bench-win32-200-lint-vue-sfc-lint-in-process-apis-dark.svg">
  <img alt="Lint — Vue SFC lint — in-process APIs" src="charts/lint-bench-win32-200-lint-vue-sfc-lint-in-process-apis.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-vue (1T) | **1.22 s** | 1.05 s | 132.3 ms | 10.8% ⚠ | 1.00x | n/a | 164 files/s | 213.8 MB |
| eslint-plugin-vue (32 workers) | **5.53 s** | 3.45 s | 1.16 s | 21.0% ⚠ | 4.53x | n/a | 36 files/s | – |
| Verter host lint ⚠ | (163.5 ms) | (144.6 ms) | – | – | not ranked | – | – | (31.7 MB) |

<details><summary>Notes</summary>

- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **eslint-plugin-vue (32 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker) | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **Verter host lint ⚠**: VerterHost.upsert + lint(canonicalId) for each file (if API available) | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk. | ⚠ VUE TEMPLATE-LINT VALIDITY FAIL — duplicate-attributes: dirty twin had no file+line+rule/concept-attributed diagnostic; require-component-is: clean twin retained the planted diagnostic. Rows missing any mandatory planted capability remain contextual/unranked; all results are retained in validation.lintSemantics.

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

- **eslint-plugin-vue (CLI)**: 1.94 s, 2.01 s, 1.83 s, 1.93 s, 2.04 s
- **Vize lint (1T)**: 157.0 ms, 145.0 ms, 162.8 ms, 178.1 ms, 166.0 ms
- **Vize lint (default threads)**: 165.1 ms, 122.8 ms, 134.3 ms, 160.8 ms, 133.9 ms
- **Biome lint (1T)**: 376.9 ms, 378.4 ms, 376.2 ms, 383.0 ms, 373.8 ms
- **Biome lint (default threads)**: 230.2 ms, 224.5 ms, 227.1 ms, 254.2 ms, 225.6 ms
- **Oxlint (1T)**: 122.4 ms, 140.6 ms, 124.3 ms, 128.7 ms, 129.8 ms
- **Oxlint (default threads)**: 124.9 ms, 135.9 ms, 120.6 ms, 133.5 ms, 122.8 ms
- **eslint-plugin-vue (1T)**: 1.31 s, 1.34 s, 1.07 s, 1.22 s, 1.05 s
- **eslint-plugin-vue (32 workers)**: 6.18 s, 3.45 s, 6.39 s, 5.53 s, 5.26 s
- **Verter host lint**: 162.5 ms, 163.5 ms, 144.6 ms, 169.9 ms, 165.6 ms

</details>

### bench-Linux-200-bench

2026-08-19 · `fixtures/200` (200 files) · linux/x64 · source `bench-Linux-200-bench.json`

#### Lint

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lint-bench-linux-200-bench-lint-dark.svg">
  <img alt="Lint" src="charts/lint-bench-linux-200-bench-lint.svg">
</picture>

Files: **200** · Bytes: **285,701**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — the exact pinned row is script-block-only on the planted Vue template capabilities and remains unranked.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **81.8 ms** | 80.9 ms | 1.3 ms | 1.6% | 1.00x | n/a | 2.4k files/s | 68.5 MB |
| Vize lint (1T) | **104.9 ms** | 102.7 ms | 6.7 ms | 6.3% | 1.28x | n/a | 1.9k files/s | – |
| Verter host lint | **155.3 ms** | 149.3 ms | 3.3 ms | 2.1% | 1.90x | n/a | 1.3k files/s | 31.7 MB |
| eslint-plugin-vue (1T) | **2.14 s** | 2.05 s | 146.0 ms | 6.8% | 26.16x | n/a | 94 files/s | 213.8 MB |
| eslint-plugin-vue (CLI) | **3.29 s** | 3.23 s | 38.7 ms | 1.2% | 40.25x | n/a | 61 files/s | – |
| eslint-plugin-vue (4 workers) | **3.80 s** | 3.61 s | 93.8 ms | 2.5% | 46.54x | n/a | 53 files/s | – |
| Biome lint (1T) ⚠ | (356.3 ms) | (350.4 ms) | – | – | not ranked | – | – | – |
| Biome lint (max threads) ⚠ | (180.0 ms) | (178.1 ms) | – | – | not ranked | – | – | (104.7 MB) |
| Oxlint (1T) ⚠ | (81.3 ms) | (78.6 ms) | – | – | not ranked | – | – | – |
| Oxlint (max threads) ⚠ | (76.1 ms) | (75.3 ms) | – | – | not ranked | – | – | (99.4 MB) |

<details><summary>Notes</summary>

- **Vize lint (max threads)**: vize lint . using default Rayon pool (all cores) | ⓘ file coverage verified: named 200/200 planted corpus files.
- **Vize lint (1T)**: vize lint . with RAYON_NUM_THREADS=1 | ⓘ file coverage verified: named 200/200 planted corpus files.
- **Verter host lint**: VerterHost.upsert + lint(canonicalId) for each file (if API available) | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk.
- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk.
- **eslint-plugin-vue (CLI)**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs | ⓘ file coverage verified: named 200/200 planted corpus files.
- **eslint-plugin-vue (4 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker) | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk.
- **Biome lint (1T) ⚠**: biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 200/200 planted corpus files.
- **Biome lint (max threads) ⚠**: biome lint . using the default Rayon pool (all cores) · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 200/200 planted corpus files.
- **Oxlint (1T) ⚠**: oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 200/200 planted corpus files.
- **Oxlint (max threads) ⚠**: oxlint . on the default thread pool (all cores), vue plugin enabled · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 200/200 planted corpus files.

</details>

<details><summary>Methodology</summary>

- Every tool lints an identical isolated copy of the corpus (work/lint/…). That tools see the SAME FILES is enforced, not assumed: an untimed FILE-COVERAGE census plants a guaranteed-reportable issue in every corpus file (`debugger` in script, `v-html` in template) and runs each directory-walk tool once — a ranked tool that fails to name every corpus file is measured but UNRANKED. Explicit-list invocations (the eslint API rows, VerterHost) are handed exactly the corpus by construction and say so. Census-only output changes (vize without --quiet, biome --max-diagnostics=none) alter what is printed, never what is linted; a walk tool that also lints a config file beside the corpus is disclosed, not gated.
- Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxlint; oxfmt 0.63+ on the format surface) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in and walk zero files. A real project root has the boundary; the marker changes no tool's invocation.
- In-process and CLI rows share the table; the row label says which mode ran. A CLI pays process startup on every run (~85ms measured for a native CLI); an in-process API pays it once — read same-mode rows against each other. eslint runs in BOTH modes and is the reference point between them.
- No single invocation mode covers every tool — vize lint is CLI-only, VerterHost.lint is in-process-only — which is why the mode is on the row instead of one mode being dropped.
- eslint-plugin-vue uses flat recommended config generated with fixtures.
- Vize, Biome and Oxlint each get separate 1T and max-threads rows — a thread-count gap is not a linter gap.
- Planted-bug work gate: each tool must report vue/no-v-html (or equivalent) or is unranked. Biome and Oxlint both fail it — each lints the &lt;script> block only and has no template rules, so nothing in &lt;template> is examined.
- Oxlint runs with its vue plugin ON (.oxlintrc.json travels with the corpus and with the gate plant): 31 extra rules over its stock 111, all of them &lt;script> rules for SFC option/macro shape. Template syntax is still never parsed, which is why the plant is missed with the plugin's full rule set active.
- Oxlint ships no standalone executable — it is a NAPI addon loaded into a Node process — so its per-run startup is Node's, while vize and biome launch a native binary. All three pay startup every run; it is not the same constant.
- Biome's script-only view also produces false positives on this corpus: variables declared in &lt;script setup> and used only in &lt;template> are reported as unused. Oxlint avoids that by disabling no-unused-vars for .vue entirely — it reports neither the false positive nor a genuinely unused declaration. Neither tool's diagnostics are comparable to the Vue-aware linters'.
- Allow non-zero exit (style diagnostics do not abort timing).
- Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize lint (max threads)**: 84.1 ms, 81.8 ms, 81.0 ms, 82.2 ms, 80.9 ms
- **Vize lint (1T)**: 104.9 ms, 104.8 ms, 102.7 ms, 109.7 ms, 119.3 ms
- **Verter host lint**: 158.0 ms, 149.3 ms, 153.6 ms, 156.3 ms, 155.3 ms
- **eslint-plugin-vue (1T)**: 2.16 s, 2.43 s, 2.13 s, 2.14 s, 2.05 s
- **eslint-plugin-vue (CLI)**: 3.29 s, 3.23 s, 3.27 s, 3.33 s, 3.32 s
- **eslint-plugin-vue (4 workers)**: 3.61 s, 3.81 s, 3.84 s, 3.80 s, 3.72 s
- **Biome lint (1T)**: 352.6 ms, 350.4 ms, 356.3 ms, 363.1 ms, 360.8 ms
- **Biome lint (max threads)**: 183.3 ms, 178.1 ms, 179.4 ms, 185.2 ms, 180.0 ms
- **Oxlint (1T)**: 84.9 ms, 81.3 ms, 78.6 ms, 81.2 ms, 89.1 ms
- **Oxlint (max threads)**: 75.3 ms, 76.1 ms, 78.4 ms, 78.4 ms, 75.4 ms

</details>

### bench-win32-50

2026-07-29 · `fixtures/50` (50 files) · win32/x64 · source `bench-win32-50.json`

> ⚠ **Local run — not the published Linux CI series** (win32/x64). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

#### Lint

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lint-bench-win32-50-lint-dark.svg">
  <img alt="Lint" src="charts/lint-bench-win32-50-lint.svg">
</picture>

Files: **50** · Bytes: **68,285**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — the exact pinned row is script-block-only on the planted Vue template capabilities and remains unranked.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | **51.4 ms** | 43.6 ms | 11.0 ms | 21.4% ⚠ | 1.00x | n/a | 974 files/s | 31.7 MB |
| Vize lint (1T) | **153.7 ms** | 124.4 ms | 41.5 ms | 27.0% ⚠ | 2.99x | n/a | 325 files/s | – |
| Vize lint (max threads) | **170.5 ms** | 127.4 ms | 61.0 ms | 35.8% ⚠ | 3.32x | n/a | 293 files/s | 68.5 MB |
| eslint-plugin-vue (1T) | **1.46 s** | 838.1 ms | 881.6 ms | 60.3% ⚠ | 28.46x | n/a | 34 files/s | 213.8 MB |
| eslint-plugin-vue (CLI) | **2.36 s** | 2.21 s | 221.1 ms | 9.4% | 46.02x | n/a | 21 files/s | – |
| eslint-plugin-vue (32 workers) | **3.49 s** | 3.18 s | 438.5 ms | 12.6% ⚠ | 67.91x | n/a | 14 files/s | – |
| Biome lint (1T) ⚠ | (344.5 ms) | (315.9 ms) | – | – | not ranked | – | – | – |
| Biome lint (max threads) ⚠ | (286.1 ms) | (214.0 ms) | – | – | not ranked | – | – | (104.7 MB) |
| Oxlint (1T) ⚠ | (162.2 ms) | (140.2 ms) | – | – | not ranked | – | – | – |
| Oxlint (max threads) ⚠ | (144.8 ms) | (120.0 ms) | – | – | not ranked | – | – | (99.4 MB) |

<details><summary>Notes</summary>

- **Verter host lint**: VerterHost.upsert + lint(canonicalId) for each file (if API available)
- **Vize lint (1T)**: vize lint . with RAYON_NUM_THREADS=1
- **Vize lint (max threads)**: vize lint . using default Rayon pool (all cores)
- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles
- **eslint-plugin-vue (CLI)**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs
- **eslint-plugin-vue (32 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker)
- **Biome lint (1T) ⚠**: biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Biome lint (max threads) ⚠**: biome lint . using the default Rayon pool (all cores) · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Oxlint (1T) ⚠**: oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Oxlint (max threads) ⚠**: oxlint . on the default thread pool (all cores), vue plugin enabled · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking

</details>

<details><summary>Methodology</summary>

- Every tool lints an identical isolated copy of the corpus (work/lint/…), so tools that take an explicit file list and tools that walk a directory see exactly the same files.
- In-process and CLI rows share the table; the row label says which mode ran. A CLI pays process startup on every run (~85ms measured for a native CLI); an in-process API pays it once — read same-mode rows against each other. eslint runs in BOTH modes and is the reference point between them.
- No single invocation mode covers every tool — vize lint is CLI-only, VerterHost.lint is in-process-only — which is why the mode is on the row instead of one mode being dropped.
- eslint-plugin-vue uses flat recommended config generated with fixtures.
- Vize, Biome and Oxlint each get separate 1T and max-threads rows — a thread-count gap is not a linter gap.
- Planted-bug work gate: each tool must report vue/no-v-html (or equivalent) or is unranked. Biome and Oxlint both fail it — each lints the &lt;script> block only and has no template rules, so nothing in &lt;template> is examined.
- Oxlint runs with its vue plugin ON (.oxlintrc.json travels with the corpus and with the gate plant): 31 extra rules over its stock 111, all of them &lt;script> rules for SFC option/macro shape. Template syntax is still never parsed, which is why the plant is missed with the plugin's full rule set active.
- Oxlint ships no standalone executable — it is a NAPI addon loaded into a Node process — so its per-run startup is Node's, while vize and biome launch a native binary. All three pay startup every run; it is not the same constant.
- Biome's script-only view also produces false positives on this corpus: variables declared in &lt;script setup> and used only in &lt;template> are reported as unused. Oxlint avoids that by disabling no-unused-vars for .vue entirely — it reports neither the false positive nor a genuinely unused declaration. Neither tool's diagnostics are comparable to the Vue-aware linters'.
- Allow non-zero exit (style diagnostics do not abort timing).
- Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Verter host lint**: 59.1 ms, 43.6 ms
- **Vize lint (1T)**: 183.1 ms, 124.4 ms
- **Vize lint (max threads)**: 213.6 ms, 127.4 ms
- **eslint-plugin-vue (1T)**: 838.1 ms, 2.08 s
- **eslint-plugin-vue (CLI)**: 2.52 s, 2.21 s
- **eslint-plugin-vue (32 workers)**: 3.80 s, 3.18 s
- **Biome lint (1T)**: 373.1 ms, 315.9 ms
- **Biome lint (max threads)**: 358.2 ms, 214.0 ms
- **Oxlint (1T)**: 184.2 ms, 140.2 ms
- **Oxlint (max threads)**: 169.6 ms, 120.0 ms

</details>

### bench-win32-1000

2026-07-29 · `fixtures/1000` (1000 files) · win32/x64 · source `bench-win32-1000.json`

> ⚠ **Local run — not the published Linux CI series** (win32/x64). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

#### Lint

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lint-bench-win32-1000-lint-dark.svg">
  <img alt="Lint" src="charts/lint-bench-win32-1000-lint.svg">
</picture>

Files: **1,000** · Bytes: **3,798,747**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — the exact pinned row is script-block-only on the planted Vue template capabilities and remains unranked.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize lint (max threads) | **246.2 ms** | 190.2 ms | 63.6 ms | 25.8% ⚠ | 1.00x | n/a | 4.1k files/s | 68.5 MB |
| Vize lint (1T) | **842.2 ms** | 542.8 ms | 271.6 ms | 32.3% ⚠ | 3.42x | n/a | 1.2k files/s | – |
| eslint-plugin-vue (1T) ❌ | error | – | – | – | – | – | – | (213.8 MB) |
| eslint-plugin-vue (32 workers) ❌ | error | – | – | – | – | – | – | – |
| eslint-plugin-vue (CLI) ⚠ | (699.6 ms) | (445.1 ms) | – | – | not ranked | – | – | – |
| Biome lint (1T) ⚠ | (2.78 s) | (2.63 s) | – | – | not ranked | – | – | – |
| Biome lint (max threads) ⚠ | (692.8 ms) | (463.3 ms) | – | – | not ranked | – | – | (104.7 MB) |
| Oxlint (1T) ⚠ | (354.5 ms) | (265.0 ms) | – | – | not ranked | – | – | – |
| Oxlint (max threads) ⚠ | (174.7 ms) | (163.3 ms) | – | – | not ranked | – | – | (99.4 MB) |
| Verter host lint ⚠ | (2.79 s) | (2.06 s) | – | – | not ranked | – | – | (31.7 MB) |

<details><summary>Notes</summary>

- **Vize lint (max threads)**: vize lint . using default Rayon pool (all cores)
- **Vize lint (1T)**: vize lint . with RAYON_NUM_THREADS=1
- **eslint-plugin-vue (1T) ❌**: Cannot find package 'eslint-plugin-vue' imported from C:\Users\david\AppData\Local\Temp\claude\D--dev-personal-vue-benchmarks\dd4fda27-7e08-422f-83f5-0a1d1065fce3\scratchpad\work-lint1000\lint\n1000\eslint.config.mjs
- **eslint-plugin-vue (32 workers) ❌**: Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'eslint-plugin-vue' imported from C:\Users\david\AppData\Local\Temp\claude\D--dev-personal-vue-benchmarks\dd4fda27-7e08-422f-83f5-0a1d1065fce3\scratchpad\work-lint1000\lint\n1000\eslint.config.mjs     at Object.getPackageJSONURL (node:internal/modules/package_json_reader:301:9)     at packageResolve (node:internal/modules/esm/resolve:784:25)     at moduleResolve (node:internal/modules/esm/resolve:873:18)     at defaultResolve (node:internal/modules/esm/resolve:1006:11)     at #cachedDefaultResolve (node:internal/modules/esm/loader:708:20)     at #resolveAndMaybeBlockOnLoaderThread (node:internal/modules/esm/loader:728:38)     at ModuleLoader.resolveSync (node:internal/modules/esm/loader:766:56)     at #resolve (node:internal/modules/esm/loader:690:17)     at ModuleLoader.getOrCreateModuleJob (node:internal/modules/esm/loader:610:35)     at ModuleJob.syncLink (node:internal/modules/esm/module_job:277:33)
- **eslint-plugin-vue (CLI) ⚠**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Biome lint (1T) ⚠**: biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Biome lint (max threads) ⚠**: biome lint . using the default Rayon pool (all cores) · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Oxlint (1T) ⚠**: oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Oxlint (max threads) ⚠**: oxlint . on the default thread pool (all cores), vue plugin enabled · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking
- **Verter host lint ⚠**: VerterHost.upsert + lint(canonicalId) for each file (if API available) | ⚠ TOO NOISY TO RANK — CV 56.6% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Methodology</summary>

- Every tool lints an identical isolated copy of the corpus (work/lint/…), so tools that take an explicit file list and tools that walk a directory see exactly the same files.
- In-process and CLI rows share the table; the row label says which mode ran. A CLI pays process startup on every run (~85ms measured for a native CLI); an in-process API pays it once — read same-mode rows against each other. eslint runs in BOTH modes and is the reference point between them.
- No single invocation mode covers every tool — vize lint is CLI-only, VerterHost.lint is in-process-only — which is why the mode is on the row instead of one mode being dropped.
- eslint-plugin-vue uses flat recommended config generated with fixtures.
- Vize, Biome and Oxlint each get separate 1T and max-threads rows — a thread-count gap is not a linter gap.
- Planted-bug work gate: each tool must report vue/no-v-html (or equivalent) or is unranked. Biome and Oxlint both fail it — each lints the &lt;script> block only and has no template rules, so nothing in &lt;template> is examined.
- Oxlint runs with its vue plugin ON (.oxlintrc.json travels with the corpus and with the gate plant): 31 extra rules over its stock 111, all of them &lt;script> rules for SFC option/macro shape. Template syntax is still never parsed, which is why the plant is missed with the plugin's full rule set active.
- Biome's script-only view also produces false positives on this corpus: variables declared in &lt;script setup> and used only in &lt;template> are reported as unused. Oxlint avoids that by disabling no-unused-vars for .vue entirely — it reports neither the false positive nor a genuinely unused declaration. Neither tool's diagnostics are comparable to the Vue-aware linters'.
- Allow non-zero exit (style diagnostics do not abort timing).
- Rule sets are NOT identical across tools — throughput only, not diagnostic equivalence.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize lint (max threads)**: 203.7 ms, 347.0 ms, 190.2 ms, 246.2 ms, 283.2 ms
- **Vize lint (1T)**: 631.1 ms, 1.07 s, 542.8 ms, 842.2 ms, 1.17 s
- **eslint-plugin-vue (CLI)**: 500.2 ms, 1.34 s, 445.1 ms, 699.6 ms, 4.28 s
- **Biome lint (1T)**: 2.63 s, 3.61 s, 2.78 s, 2.65 s, 3.18 s
- **Biome lint (max threads)**: 463.3 ms, 733.3 ms, 651.4 ms, 692.8 ms, 775.6 ms
- **Oxlint (1T)**: 265.0 ms, 440.6 ms, 333.6 ms, 354.5 ms, 393.8 ms
- **Oxlint (max threads)**: 174.3 ms, 174.7 ms, 224.9 ms, 163.3 ms, 211.4 ms
- **Verter host lint**: 2.06 s, 2.84 s, 2.31 s, 2.79 s, 5.96 s

</details>

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

> ⚠ **Local run — not the published Linux CI series** (win32/x64). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

pass **45** · fail **15** · warn **0** · skip **0**

| Case | eslint-plugin-vue | vize-lint | verter-lint |
| --- | :---: | :---: | :---: |
| `async-computed` | ✓ | **✗** | ✓ |
| `clean` | ✓ | ✓ | – |
| `computed-side-effect` | ✓ | **✗** | **✗** |
| `deprecated-slot-attr` | ✓ | **✗** | ✓ |
| `dupe-else-if` | ✓ | ✓ | **✗** |
| `duplicate-attributes` | ✓ | ✓ | **✗** |
| `img-no-alt` | ✓ | ✓ | ✓ |
| `invalid-v-model` | ✓ | ✓ | **✗** |
| `invalid-v-slot` | ✓ | **✗** | **✗** |
| `mutating-props` | ✓ | **✗** | **✗** |
| `prop-type-constructor` | ✓ | **✗** | ✓ |
| `require-component-is` | ✓ | ✓ | ✓ |
| `reserved-props` | ✓ | **✗** | ✓ |
| `template-key` | ✓ | ✓ | **✗** |
| `textarea-mustache` | ✓ | ✓ | ✓ |
| `unused-components` | ✓ | – | – |
| `v-for-no-key` | ✓ | ✓ | ✓ |
| `v-html` | ✓ | ✓ | ✓ |
| `v-if-with-v-for` | ✓ | ✓ | ✓ |
| `v-on-native-modifier` | ✓ | **✗** | ✓ |
| `v-text-on-component` | ✓ | ✓ | ✓ |

<details><summary>Failure detail</summary>

- `dupe-else-if` · **verter-lint** — missing rules no-dupe-v-else-if; got no-bare-strings-in-template, no-bare-strings-in-template
- `duplicate-attributes` · **verter-lint** — missing rules no-duplicate-attributes; got no-bare-strings-in-template
- `mutating-props` · **vize-lint** — expected ≥1 issues, got 0
- `mutating-props` · **verter-lint** — missing rules no-mutating-props; got click-events-have-key-events, define-props-declaration
- `deprecated-slot-attr` · **vize-lint** — expected ≥1 issues, got 0
- `template-key` · **verter-lint** — missing rules no-template-key; got no-bare-strings-in-template, no-useless-template-attributes, no-lone-template
- `invalid-v-model` · **verter-lint** — expected ≥1 diagnostics, got 0
- `invalid-v-slot` · **vize-lint** — expected ≥1 issues, got 0
- `invalid-v-slot` · **verter-lint** — missing rules valid-v-slot; got no-undef-components, no-bare-strings-in-template, multi-word-component-names
- `v-on-native-modifier` · **vize-lint** — expected ≥1 issues, got 0
- `reserved-props` · **vize-lint** — expected ≥1 issues, got 0
- `computed-side-effect` · **vize-lint** — expected ≥1 issues, got 0
- `computed-side-effect` · **verter-lint** — expected ≥1 diagnostics, got 0
- `async-computed` · **vize-lint** — expected ≥1 issues, got 0
- `prop-type-constructor` · **vize-lint** — expected ≥1 issues, got 0

</details>

> The same group measured on pinned third-party projects: [real-world.md](real-world.md).

## Memory (isolated probe)

Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).

### memory-linux-100

2026-08-19 · `fixtures/200` · source `memory-linux-100.json`

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 31.65 / 31.65 / 31.65 | 0.47 / 0.47 / 0.47 | 81 | 114.2 | 73 | 3 |
| Vize lint | 13.84 / 68.45 / 45.22 | n/a | 70 | 133.0 | 51 | 3 |
| Oxlint (Node host + NAPI addon) | 14.64 / 99.35 / 51.49 | n/a | 40 | 86.5 | 47 | 3 |
| Biome lint | 1.95 / 103.19 / 83.26 | n/a | 10 | 7.3 | 138 | 3 |
| eslint-plugin-vue (1T) | 18.48 / 213.32 / 152.01 | 7.85 / 129.60 / 62.04 | 2807 | 174.4 | 1609 | 3 |

<details><summary>Notes</summary>

- **Verter host lint** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint** — RSS = child tree; CPU total from /proc when available (Linux)
- **Oxlint (Node host + NAPI addon)** — RSS = child tree; CPU total from /proc when available (Linux)
- **Biome lint** — RSS = child tree; CPU total from /proc when available (Linux)
- **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

### memory-win32-50

2026-07-26 · `fixtures/50` · source `memory-win32-50.json`

> ⚠ **Local run — not the published Linux CI series** (unknown platform). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 20.18 / 20.18 / 20.18 | 0.86 / 0.86 / 0.86 | n/a | n/a | 32 | 3 |
| Vize lint | 53.72 / 53.72 / 53.72 | 13.01 / 13.53 / 13.53 | 47 | 46.4 | 101 | 3 |
| eslint-plugin-vue (1T) | 15.82 / 221.30 / 133.58 | 8.58 / 112.11 / 68.00 | 1453 | 138.6 | 1044 | 3 |

<details><summary>Notes</summary>

- **Verter host lint** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint** — RSS=WorkingSet; alloc≈PrivateMemorySize64; CPU=TotalProcessorTime (tool process only)
- **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

</details>

## Tool versions

<details><summary>Every pinned package in this run</summary>

| Package | Version |
| --- | --- |
| node | v22.23.2 |
| vue | 3.5.41 |
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
