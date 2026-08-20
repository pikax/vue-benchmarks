# Lint

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

### Lint

Files: **200** · Bytes: **285,701**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Biome lint (default threads)** — biome lint with its default pool size — script block only. No template rules, so it misses the planted Vue template rules and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — the exact pinned row is script-block-only on the planted Vue template capabilities and remains unranked.
- **Oxlint (default threads)** — oxlint with its default pool size and vue plugin enabled — script block only, so it misses the planted Vue template rules; unranked.

##### Vue SFC lint — fresh CLI process

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lint-bench-linux-200-bench-lint-vue-sfc-lint-fresh-cli-process-dark.svg">
  <img alt="Lint — Vue SFC lint — fresh CLI process" src="charts/lint-bench-linux-200-bench-lint-vue-sfc-lint-fresh-cli-process.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-vue (CLI) | **3.09 s** | 3.02 s | 52.4 ms | 1.7% | 1.00x | n/a | 65 files/s | – |
| Vize lint (1T) ⚠ | (106.9 ms) | (105.7 ms) | – | – | not ranked | – | – | – |
| Vize lint (default threads) ⚠ | (84.1 ms) | (83.7 ms) | – | – | not ranked | – | – | (68.8 MB) |
| Biome lint (1T) ⚠ | (364.8 ms) | (361.2 ms) | – | – | not ranked | – | – | – |
| Biome lint (default threads) ⚠ | (181.8 ms) | (180.8 ms) | – | – | not ranked | – | – | (102.9 MB) |
| Oxlint (1T) ⚠ | (84.3 ms) | (78.3 ms) | – | – | not ranked | – | – | – |
| Oxlint (default threads) ⚠ | (76.8 ms) | (75.2 ms) | – | – | not ranked | – | – | (99.4 MB) |

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
  <source media="(prefers-color-scheme: dark)" srcset="charts/lint-bench-linux-200-bench-lint-vue-sfc-lint-in-process-apis-dark.svg">
  <img alt="Lint — Vue SFC lint — in-process APIs" src="charts/lint-bench-linux-200-bench-lint-vue-sfc-lint-in-process-apis.svg">
</picture>

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput | Peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-vue (1T) | **1.81 s** | 1.65 s | 127.4 ms | 7.0% | 1.00x | n/a | 111 files/s | 216.4 MB |
| eslint-plugin-vue (4 workers) | **3.47 s** | 3.44 s | 21.5 ms | 0.6% | 1.92x | n/a | 58 files/s | – |
| Verter host lint ⚠ | (154.1 ms) | (151.5 ms) | – | – | not ranked | – | – | (31.9 MB) |

<details><summary>Notes</summary>

- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
- **eslint-plugin-vue (4 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker) | ⓘ file coverage by construction: this invocation is handed the 200 corpus files as an explicit list, not a directory walk. | ✓ Vue template-lint validity 10/10: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.
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

- **eslint-plugin-vue (CLI)**: 3.08 s, 3.14 s, 3.09 s, 3.02 s, 3.15 s
- **Vize lint (1T)**: 105.7 ms, 105.7 ms, 109.7 ms, 110.2 ms, 106.9 ms
- **Vize lint (default threads)**: 83.7 ms, 84.1 ms, 85.8 ms, 84.1 ms, 86.1 ms
- **Biome lint (1T)**: 369.7 ms, 361.2 ms, 364.8 ms, 363.4 ms, 367.3 ms
- **Biome lint (default threads)**: 181.8 ms, 180.9 ms, 180.8 ms, 184.0 ms, 185.5 ms
- **Oxlint (1T)**: 89.2 ms, 78.3 ms, 79.8 ms, 90.9 ms, 84.3 ms
- **Oxlint (default threads)**: 75.7 ms, 78.1 ms, 76.8 ms, 81.2 ms, 75.2 ms
- **eslint-plugin-vue (1T)**: 1.93 s, 1.89 s, 1.65 s, 1.67 s, 1.81 s
- **eslint-plugin-vue (4 workers)**: 3.48 s, 3.46 s, 3.50 s, 3.44 s, 3.47 s
- **Verter host lint**: 153.2 ms, 151.5 ms, 157.0 ms, 155.0 ms, 154.1 ms

</details>

## Validation (plants)

Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.

pass **46** · fail **15** · warn **0** · skip **0**

| Case | eslint-plugin-vue | vize-lint | verter-lint |
| --- | :---: | :---: | :---: |
| `async-computed` | ✓ | **✗** | ✓ |
| `clean` | ✓ | ✓ | ✓ |
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

| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | 31.75 / 31.75 / 31.75 | 0.47 / 0.47 / 0.47 | 101 | 124.5 | 81 | 3 |
| Vize lint (default threads) | 14.53 / 68.72 / 44.85 | n/a | 60 | 100.6 | 60 | 3 |
| Oxlint (default threads; Node host + NAPI addon) | 14.57 / 99.37 / 51.93 | n/a | 50 | 82.2 | 58 | 3 |
| Biome lint (default threads) | 2.19 / 102.45 / 74.21 | n/a | 20 | 16.4 | 126 | 3 |
| eslint-plugin-vue (1T) | 18.32 / 216.21 / 153.84 | 7.87 / 63.75 / 44.16 | 3574 | 166.5 | 2146 | 3 |

<details><summary>Notes</summary>

- **Verter host lint** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker
- **Vize lint (default threads)** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **Oxlint (default threads; Node host + NAPI addon)** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **Biome lint (default threads)** — RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained
- **eslint-plugin-vue (1T)** — RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker

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
