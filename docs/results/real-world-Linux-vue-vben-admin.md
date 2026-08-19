# vue-vben-admin

> Full report for `real-world-Linux-vue-vben-admin.md` — every table, collapsed block (methodology, gate notes, raw runs) that the
> [README](../../README.md) landing page charts link here for. Auto-generated; do not edit.

## Benchmark Results

- **Generated:** 2026-08-19T20:06:18.378Z
- **Fixture:** `fixtures/real` (330 SFCs)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor
- **Node:** v22.23.2
- **CI run:** https://github.com/pikax/vue-benchmarks/actions/runs/32287855785

### Tool versions

| Package | Version |
| --- | --- |
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

### Methodology notes

- Corpora are pinned checkouts of third-party open-source Vue projects; sources are unmodified and every row names its project, ref and resolved commit SHA.
- Rank WITHIN a corpus, never across. The corpora differ in size and in kind — library source, application source, and documentation demos are not the same code, and a docs-demo SFC is a fraction of the size of a library component.
- The generated fixtures/N corpus remains the primary ranking corpus. It is content-unique by construction and carries planted bugs, which is what makes the work gates possible; real-world code cannot be gated that way because nobody knows where its bugs are.
- Real-world corpora exist to catch what a generated corpus cannot: constructs nobody thought to generate. Treat a failure here as a finding about the tool, and a speed number here as secondary to fixtures/N.
- Corpora are COMPLETE: no --file-limit was applied, so every SFC under each corpus root was measured. This is the default, because a limit takes an alphabetical prefix by path — a systematically narrower corpus rather than a sample of one.
- A project shipping no lockfile cannot be installed frozen, so its dependency set is whatever resolved on the day. Rows on the surfaces that execute those dependencies (project-test, project-build, project-typecheck, project-component-meta, project-lsp) are UNRANKED for such a corpus — equally for every tool, baseline included, because it is a property of the corpus and not of any tool.
- Surface "component-meta" is not run on a LIFTED real-world corpus: not offered on a LIFTED corpus — a corpus pulled out of a monorepo resolves none of its imports, and a metadata extractor whose imports do not resolve returns components with no props very quickly. Ask for project-component-meta, which runs in the checkout against the project's own tsconfig.
- Surface "lsp" is not run on a LIFTED real-world corpus: not offered on a LIFTED corpus — same resolution requirement, plus the workspace has to be the project itself for a language server's project load to mean anything. Ask for project-lsp.
- Surface "typecheck" is not run on a LIFTED real-world corpus: not offered on a LIFTED corpus — see project-typecheck, which runs in the checkout against the project's own tsconfig.
- ⚠ HARNESS GAP — 1 surface run(s) threw and produced NO rows. These are failures of this harness on this machine, not results about any tool, and nothing should be inferred about the tools that would have been measured: compile on vue-vben-admin:core-ui (undefined)

### Format

Files: **330** · Bytes: **933,224**

Tools:

- **Prettier** — prettier --write over a fresh corpus copy; built-in Vue SFC support, single-threaded by design.
- **Oxfmt** — oxfmt --write — Oxc's Vue-capable formatter, multi-threaded.
- **Vize** — vize fmt --write.
- **Biome format** — biome format --write — multi-threaded, but formats the &lt;script> block only; template and style come back byte-identical, so it is unranked on the format surface.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **144.3 ms** | 142.1 ms | 6.2 ms | 4.3% | 1.00x | n/a | 2.3k files/s |
| Oxfmt | **3.45 s** | 3.39 s | 57.0 ms | 1.7% | 23.91x | n/a | 96 files/s |
| Prettier | **4.76 s** | 4.67 s | 57.2 ms | 1.2% | 33.02x | n/a | 69 files/s |
| Biome format ⚠ | (149.4 ms) | (147.8 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Vize**: vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded | ⓘ file coverage verified: rewrote 330/330 planted corpus files.
- **Oxfmt**: oxfmt --write (fresh copy each run) · .vue files route through oxfmt's BUNDLED PRETTIER fallback in worker threads, not the Rust core (its dist ships Prettier and exposes Prettier's Vue options) — read this row as Prettier-with-workers until oxfmt formats SFCs natively | ⓘ file coverage verified: rewrote 330/330 planted corpus files.
- **Prettier**: prettier --write **/*.vue (fresh copy each run) · single-threaded by design | ⓘ file coverage verified: rewrote 330/330 planted corpus files.
- **Biome format ⚠**: biome format --write . (fresh copy each run) · multi-threaded (Rayon; honours RAYON_NUM_THREADS) · formats the &lt;script> block ONLY — template and style are returned byte-identical | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file-coverage census: rewrote 0 of 330 planted corpus files.

</details>

<details><summary>Methodology</summary>

- Each invocation receives a fresh copy of the same Vue SFC corpus (formatters rewrite files).
- .prettierrc.json and biome.json are copied into every work copy so each tool's config actually resolves (config left in the fixture root is not on the work dir's lookup path). Both configs set the same indent, width, quote, semicolon and trailing-comma choices.
- All four formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.
- Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.
- Oxfmt's .vue path is NOT its Rust core: oxfmt (verified through 0.63) bundles Prettier and routes SFCs through it in worker threads — which is also why its output is byte-identical to Prettier's. Its row measures that pipeline, disclosed in its label notes; Vize is currently the only ranked formatter compiling SFCs natively.
- Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxfmt 0.63+) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in, see zero files, and get unranked for walking reasons rather than formatting ones. A real project root has the boundary; the marker changes no tool's invocation.
- The template-rewrite gate probe lives in a NESTED directory, so a tool invoked non-recursively fails the gate rather than being ranked on an empty match (this exact fault put Prettier at 1.00x on every nested corpus while formatting zero files).
- Template-rewrite work gate: each formatter is run against a messy SFC and must actually change the &lt;template> block, or it is measured but unranked.
- FILE-COVERAGE GATE, untimed, per tool with its exact timed invocation: every corpus file is planted with a mess (trailing spaces, stacked blank lines) that any formatter under the shared configs must undo, and files rewritten are counted by byte comparison — the same method for every tool. A ranked tool that rewrites fewer than every corpus file is measured but UNRANKED: tools walking different file sets are not doing the same job, however similar the clock looks. A walk-invoked tool that also rewrites a config file is disclosed, not gated (one extra tiny file is noise; skipping corpus files is not).
- Prettier, Oxfmt, and Vize format the whole SFC. On the pinned Biome, `biome format --write .` reports .vue files as formatted but applies NO fixes to any block of them (probed: 0 of 50 planted files rewritten, 'No fixes applied') — its bracketed time is a walk-and-parse, which both gates say on the row. Rule/option parity is not guaranteed for any tool.
- Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.

Raw runs:

- **Vize**: 142.1 ms, 157.6 ms, 145.5 ms, 144.3 ms, 144.2 ms
- **Oxfmt**: 3.39 s, 3.45 s, 3.47 s, 3.52 s, 3.39 s
- **Prettier**: 4.77 s, 4.71 s, 4.82 s, 4.67 s, 4.76 s
- **Biome format**: 148.8 ms, 147.8 ms, 149.4 ms, 149.8 ms, 150.0 ms

</details>

### Lint

Files: **330** · Bytes: **933,224**

Tools:

- **Biome lint (1T)** — biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Biome lint (max threads)** — biome lint on all cores — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.
- **Oxlint (1T)** — oxlint --threads=1 with its vue plugin enabled — script block only. The plugin's 31 Vue rules all read &lt;script>; &lt;template> is never parsed, so the planted vue/no-v-html is missed; unranked.
- **Oxlint (max threads)** — oxlint on all cores with its vue plugin enabled — script block only, misses the planted vue/no-v-html; unranked.

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint | **448.4 ms** | 444.2 ms | 2.4 ms | 0.5% | 1.00x | n/a | 736 files/s |
| eslint-plugin-vue (1T) | **2.59 s** | 2.33 s | 353.9 ms | 13.6% ⚠ | 5.79x | n/a | 127 files/s |
| eslint-plugin-vue (CLI) | **4.16 s** | 4.07 s | 51.8 ms | 1.2% | 9.27x | n/a | 79 files/s |
| eslint-plugin-vue (4 workers) | **4.35 s** | 4.19 s | 77.7 ms | 1.8% | 9.71x | n/a | 76 files/s |
| Vize lint (1T) ⚠ | (119.1 ms) | (117.4 ms) | – | – | not ranked | – | – |
| Vize lint (max threads) ⚠ | (83.9 ms) | (81.9 ms) | – | – | not ranked | – | – |
| Biome lint (1T) ⚠ | (655.1 ms) | (650.8 ms) | – | – | not ranked | – | – |
| Biome lint (max threads) ⚠ | (283.0 ms) | (278.2 ms) | – | – | not ranked | – | – |
| Oxlint (1T) ⚠ | (85.9 ms) | (83.5 ms) | – | – | not ranked | – | – |
| Oxlint (max threads) ⚠ | (74.3 ms) | (70.9 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter host lint**: VerterHost.upsert + lint(canonicalId) for each file (if API available) | ⓘ file coverage by construction: this invocation is handed the 330 corpus files as an explicit list, not a directory walk.
- **eslint-plugin-vue (1T)**: ESLint flat config + eslint-plugin-vue recommended, single-threaded lintFiles | ⓘ file coverage by construction: this invocation is handed the 330 corpus files as an explicit list, not a directory walk.
- **eslint-plugin-vue (CLI)**: eslint CLI over the same corpus — pays Node startup + config load per run, like the native CLIs | ⓘ file coverage verified: named 330/330 planted corpus files.
- **eslint-plugin-vue (4 workers)**: ESLint worker_threads fan-out (one ESLint instance per worker) | ⓘ file coverage by construction: this invocation is handed the 330 corpus files as an explicit list, not a directory walk.
- **Vize lint (1T) ⚠**: vize lint . with RAYON_NUM_THREADS=1 | ⚠ FAILED FILE-COVERAGE GATE — named 327 of 330 planted corpus files. A tool covering fewer files finishes sooner; that is a different job, not a faster one. Measured but UNRANKED.
- **Vize lint (max threads) ⚠**: vize lint . using default Rayon pool (all cores) | ⚠ FAILED FILE-COVERAGE GATE — named 327 of 330 planted corpus files. A tool covering fewer files finishes sooner; that is a different job, not a faster one. Measured but UNRANKED.
- **Biome lint (1T) ⚠**: biome lint . with RAYON_NUM_THREADS=1 · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 330/330 planted corpus files.
- **Biome lint (max threads) ⚠**: biome lint . using the default Rayon pool (all cores) · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 330/330 planted corpus files.
- **Oxlint (1T) ⚠**: oxlint . --threads=1, vue plugin enabled via .oxlintrc.json · script block only, no template rules | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 330/330 planted corpus files.
- **Oxlint (max threads) ⚠**: oxlint . on the default thread pool (all cores), vue plugin enabled · script block only | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking | ⓘ file coverage verified: named 330/330 planted corpus files.

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

- **Verter host lint**: 450.1 ms, 449.2 ms, 448.4 ms, 445.9 ms, 444.2 ms
- **eslint-plugin-vue (1T)**: 3.14 s, 3.09 s, 2.58 s, 2.59 s, 2.33 s
- **eslint-plugin-vue (CLI)**: 4.07 s, 4.16 s, 4.21 s, 4.13 s, 4.16 s
- **eslint-plugin-vue (4 workers)**: 4.36 s, 4.35 s, 4.19 s, 4.32 s, 4.38 s
- **Vize lint (1T)**: 119.1 ms, 118.8 ms, 119.2 ms, 138.7 ms, 117.4 ms
- **Vize lint (max threads)**: 82.8 ms, 83.9 ms, 81.9 ms, 85.6 ms, 86.3 ms
- **Biome lint (1T)**: 655.1 ms, 654.4 ms, 650.8 ms, 659.0 ms, 663.3 ms
- **Biome lint (max threads)**: 278.2 ms, 283.0 ms, 290.9 ms, 281.7 ms, 286.1 ms
- **Oxlint (1T)**: 87.2 ms, 88.6 ms, 85.9 ms, 83.5 ms, 85.0 ms
- **Oxlint (max threads)**: 70.9 ms, 73.9 ms, 75.2 ms, 75.7 ms, 74.3 ms

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
| Rspack × vue-loader | **367.5 ms** | 366.1 ms | 2.0 ms | 0.6% | 1.00x | 2,321,761 | 563 files/s |
| Rspack × unplugin-vue | **775.4 ms** | 766.3 ms | 12.9 ms | 1.7% | 2.11x | 1,781,622 | 267 files/s |
| Rspack × @vizejs/rspack-plugin ❌ | error | – | – | – | – | – | – |
| Rspack × @verter/unplugin ❌ | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Rspack × vue-loader**: loader chain · compiled 207/207 corpus SFCs · 28 style sub-requests · 2,321,761 output bytes | The official webpack Vue integration — a loader rule plus VueLoaderPlugin. The reference implementation for this family. | Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks.
- **Rspack × unplugin-vue**: lazy per-module transform · compiled 207/207 corpus SFCs · 28 style sub-requests · 1,781,622 output bytes | Official compiler pipeline as an unplugin, so the same code path the Vite rows use. | Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks.
- **Rspack × @vizejs/rspack-plugin ❌**:   × Module Error (from /home/runner/work/vue-benchmarks/vue-benchmarks/node_modules/.pnpm/@vizejs+rspack-plugin@0.350.2_@rspack+core@2.1.10/node_modules/@vizejs/rspack-plugin/dist/loader/scope-loader.mjs):   │ [vize] CSS parse error: Unexpected token Semicolon at /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/effects/common-ui/src/co
- **Rspack × @verter/unplugin ❌**:   × Module build failed (from ../../../../node_modules/.pnpm/unplugin@3.3.0_@rspack+core@2.1.10_esbuild@0.28.1_rolldown@1.2.5_vite@8.2.1_@types+node_76ddc243448a59429355ba827d046bea/node_modules/unplugin/dist/rspack/loaders/load.mjs):   ╰─▶   × Error: [verter] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/@core/ui-kit/popup-ui/src/a

</details>

<details><summary>Raw runs</summary>

- **Rspack × vue-loader**: 368.9 ms, 366.1 ms
- **Rspack × unplugin-vue**: 766.3 ms, 784.5 ms

</details>

#### webpack 5 — Vue integrations compared

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | output bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| webpack 5 × vue-loader | **640.7 ms** | 635.4 ms | 7.6 ms | 1.2% | 1.00x | 3,302,016 | 323 files/s |
| webpack 5 × unplugin-vue | **1.24 s** | 1.15 s | 119.7 ms | 9.7% | 1.93x | 2,550,208 | 168 files/s |
| webpack 5 × @verter/unplugin ❌ | error | – | – | – | – | – | – |
| webpack 5 × @vizejs/rspack-plugin ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **webpack 5 × vue-loader**: loader chain · compiled 207/207 corpus SFCs · 28 style sub-requests · 3,302,016 output bytes | The official webpack Vue integration — a loader rule plus VueLoaderPlugin. The reference implementation for this family. | The reference webpack implementation. Loader/plugin architecture, not Rollup hooks.
- **webpack 5 × unplugin-vue**: lazy per-module transform · compiled 207/207 corpus SFCs · 28 style sub-requests · 2,550,208 output bytes | Official compiler pipeline as an unplugin, so the same code path the Vite rows use. | The reference webpack implementation. Loader/plugin architecture, not Rollup hooks.
- **webpack 5 × @verter/unplugin ❌**: Module build failed (from ../../../../node_modules/.pnpm/unplugin@3.3.0_@rspack+core@2.1.10_esbuild@0.28.1_rolldown@1.2.5_vite@8.2.1_@types+node_76ddc243448a59429355ba827d046bea/node_modules/unplugin/dist/webpack/loaders/transform.mjs): Error: [verter] /home/runner/work/vue-benchmarks/vue-benchmarks/work-real/vue-vben-admin/bundle/vue-vben-admin-core-ui/packages/@core/ui-kit/popup-ui/src/alert/ale
- **webpack 5 × @vizejs/rspack-plugin ⏭**: @vizejs/rspack-plugin publishes no webpack entry point

</details>

<details><summary>Raw runs</summary>

- **webpack 5 × vue-loader**: 635.4 ms, 646.1 ms
- **webpack 5 × unplugin-vue**: 1.15 s, 1.32 s

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
| Vite 8 (Rolldown) × unplugin-vue | **25.7 ms** | 24.8 ms | 1.3 ms | 4.9% | 1.00x | n/a | 8.1k files/s |
| Vite 8 (Rolldown) × @verter/unplugin | **27.5 ms** | 25.9 ms | 2.3 ms | 8.3% | 1.07x | n/a | 7.5k files/s |
| Vite 8 (Rolldown) × @vitejs/plugin-vue | **28.9 ms** | 25.5 ms | 4.8 ms | 16.8% ⚠ | 1.12x | n/a | 7.2k files/s |
| Vite 8 (Rolldown) × @vizejs/vite-plugin | **60.9 ms** | 58.5 ms | 3.5 ms | 5.7% | 2.37x | n/a | 3.4k files/s |

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

- **Vite 8 (Rolldown) × unplugin-vue**: 26.6 ms, 24.8 ms
- **Vite 8 (Rolldown) × @verter/unplugin**: 29.1 ms, 25.9 ms
- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: 32.3 ms, 25.5 ms
- **Vite 8 (Rolldown) × @vizejs/vite-plugin**: 63.4 ms, 58.5 ms

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
| Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠ | (17.7 ms) | (12.7 ms) | – | – | not ranked | (63,065) | – |
| Vite 8 (Rolldown) × unplugin-vue ⚠ | (17.4 ms) | (16.2 ms) | – | – | not ranked | (63,067) | – |
| Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭ | skipped | – | – | – | – | – | – |
| Vite 8 (Rolldown) × @verter/unplugin ⚠ | (1.2 ms) | (1.0 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vite 8 (Rolldown) × @vitejs/plugin-vue ⚠**: edit &lt;template> of packages/@core/ui-kit/form-ui/src/components/form-actions.vue and packages/@core/ui-kit/form-ui/src/form-render/form-field.vue → update · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | measured region: change announced → update message → updated module fetched over HTTP | ⚠ TOO NOISY TO RANK — CV 196.7% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Vite 8 (Rolldown) × unplugin-vue ⚠**: edit &lt;template> of packages/@core/ui-kit/form-ui/src/components/form-actions.vue and packages/@core/ui-kit/form-ui/src/form-render/form-field.vue → update · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | measured region: change announced → update message → updated module fetched over HTTP | ⚠ TOO NOISY TO RANK — CV 527.9% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.
- **Vite 8 (Rolldown) × @vizejs/vite-plugin ⏭**: ⏭ NOT MEASURED — no HMR message (headless probe limitation, not a tool result) exceeded 30000 ms. This is the harness declining to publish a number, not a statement about @vizejs/vite-plugin. The dev cold-start row for this cell is published regardless: that measurement succeeded, and discarding it would hide a working result behind a probe limitation.
- **Vite 8 (Rolldown) × @verter/unplugin ⚠**: edit &lt;template> of packages/@core/ui-kit/form-ui/src/components/form-actions.vue and packages/@core/ui-kit/form-ui/src/form-render/form-field.vue → full-reload · lazy per-module transform · one warm server per row (cold start is the other table's question), ms = mean of 2 round trip(s) per run | ⚠ FULL RELOAD, not a hot update — the server discarded the module instead of patching it, which is much less work. Measured but UNRANKED.

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

- **Vite 8 (Rolldown) × @vitejs/plugin-vue**: 94.3 ms, 17.9 ms, 17.6 ms, 17.7 ms, 12.7 ms
- **Vite 8 (Rolldown) × unplugin-vue**: 227.7 ms, 16.3 ms, 16.2 ms, 17.4 ms, 84.6 ms
- **Vite 8 (Rolldown) × @verter/unplugin**: 1.2 ms, 1.0 ms, 1.2 ms, 1.7 ms, 1.3 ms

</details>

<details><summary>Methodology</summary>

- Corpus: vue-vben-admin:core-ui @ 63a38dce — 207 SFCs, third-party and unmodified.
- ⚠ 123 of 330 corpus SFCs are EXCLUDED from this surface's app for every cell alike (workspace-context prop types, plus transitive relative importers). Judged untimed by @vue/compiler-sfc; challenger compilers were not consulted — a tool that handles these files shows it on the compile surface, which reads the real checkout with no exclusions. First: packages/@core/ui-kit/menu-ui/src/components/menu-badge.vue ([@vue/compiler-sfc] Failed to resolve extends base type.)
- The staged copy carries the corpus SFCs' relative import closure (161 extra source files) for @vue/compiler-sfc's type resolution; the resolver still externalises them, so the module graph is exactly the corpus.
- HMR probes: a comment is inserted inside the &lt;template> block of packages/@core/ui-kit/form-ui/src/components/form-actions.vue and then packages/@core/ui-kit/form-ui/src/form-render/form-field.vue — genuine template changes, one round trip per probe per run, ms = the mean. A &lt;script setup> edit would make Vue issue a full page reload instead of a hot update — a different and cheaper server path.
- The change is written to disk and then handed to the watcher directly. Waiting for chokidar would fold the OS file-watch debounce (platform-dependent, unrelated to any tool here) into every row.
- HMR turnaround is measured from the change being announced to the updated module being fetched over HTTP — the same two steps a browser performs. The WebSocket-notification half is reported separately in the run metadata, because a plugin can be quick to decide what changed and slow to recompile it.
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

Files: **330** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | tests passed | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vben-admin-monorepo — project's own toolchain (baseline) | **10.77 s** | 10.77 s | n/a | n/a | 1.00x | 308 | 31 files/s |
| vben-admin-monorepo — unplugin-vue | **11.12 s** | 11.12 s | n/a | n/a | 1.03x | 308 | 30 files/s |
| vben-admin-monorepo — @verter/unplugin | **11.22 s** | 11.22 s | n/a | n/a | 1.04x | 308 | 29 files/s |
| vben-admin-monorepo — @vizejs/vite-plugin | **41.94 s** | 41.94 s | n/a | n/a | 3.90x | 308 | 8 files/s |

<details><summary>Notes</summary>

- **vben-admin-monorepo — project's own toolchain (baseline)**: the project's own toolchain, unmodified (baseline) · package . · script "test:unit": vitest run --dom · config vitest.config.ts | ⓘ 1 of 35 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it.
- **vben-admin-monorepo — unplugin-vue**: a generated config that imports the project's real config and replaces only the Vue plugin · extends vitest.config.ts · resolved with ConfigEnv {command:'serve', mode:'test'}, matching how vitest resolves it for the baseline · Same official @vue/compiler-sfc as the baseline, different plugin wrapper — a gap to baseline is wrapper cost, not compiler cost. · ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction | ⓘ 1 of 35 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⚠ 1 test(s) FAILED under this toolchain (the project's own toolchain also fails 1) — a correctness finding about unplugin-vue. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it.
- **vben-admin-monorepo — @verter/unplugin**: a generated config that imports the project's real config and replaces only the Vue plugin · extends vitest.config.ts · resolved with ConfigEnv {command:'serve', mode:'test'}, matching how vitest resolves it for the baseline · Verter's universal bundler plugin, substituted for the project's Vue plugin. · ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction | ⓘ 1 of 35 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⚠ 1 test(s) FAILED under this toolchain (the project's own toolchain also fails 1) — a correctness finding about @verter/unplugin. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it.
- **vben-admin-monorepo — @vizejs/vite-plugin**: a generated config that imports the project's real config and replaces only the Vue plugin · extends vitest.config.ts · resolved with ConfigEnv {command:'serve', mode:'test'}, matching how vitest resolves it for the baseline · Vize's native compiler, substituted for the project's Vue plugin. · ⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction | ⓘ 1 of 35 test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole. | ⚠ 1 test(s) FAILED under this toolchain (the project's own toolchain also fails 1) — a correctness finding about @vizejs/vite-plugin. | ⓘ SINGLE MEASURED RUN — the time is indicative (per-surface runtime budget); there is no median or spread behind it.

</details>

#### Peak RSS

> Whole process tree of the timed run (not Vue-attributed). Volar includes both halves.

| Tool | **Peak RSS** |
| --- | ---: |
| vben-admin-monorepo — @verter/unplugin | **657.8 MB** |
| vben-admin-monorepo — project's own toolchain (baseline) | **697.8 MB** |
| vben-admin-monorepo — unplugin-vue | **708.7 MB** |
| vben-admin-monorepo — @vizejs/vite-plugin | **6581.0 MB** |

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

- **vben-admin-monorepo — project's own toolchain (baseline)**: 10.77 s
- **vben-admin-monorepo — unplugin-vue**: 11.12 s
- **vben-admin-monorepo — @verter/unplugin**: 11.22 s
- **vben-admin-monorepo — @vizejs/vite-plugin**: 41.94 s

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

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (JS) | **21.14 s** | 21.03 s | 154.9 ms | 0.7% | 1.00x | 0 | 6 files/s |

<details><summary>Notes</summary>

- **vue-tsc (JS)**: BASELINE · vue-tsc --noEmit -p tsconfig.json · the official Vue Language Tools CLI on the stock JavaScript TypeScript compiler

</details>

<details><summary>Raw runs</summary>

- **vue-tsc (JS)**: 21.25 s, 21.03 s

</details>
#### Peak RSS

> Whole process tree of the timed run (not Vue-attributed). Volar includes both halves.

| Tool | **Peak RSS** |
| --- | ---: |
| vue-tsc (JS) | **1672.6 MB** |


#### Native tsgo engines — ranked together

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vue-tsc (N) | **10.26 s** | 10.25 s | 18.6 ms | 0.2% | 1.00x | 0 | 12 files/s |
| verter-tsc ⚠ | (3.75 s) | (3.69 s) | – | – | not ranked | (156) | – |
| Vize ⚠ | (66.80 s) | (66.76 s) | – | – | not ranked | (21) | – |
| Golar typecheck ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **vue-tsc (N)**: Same vue-tsc 3.3.10 with typescript aliased to typescript-native-bridge 6.0.3-bridge.13.tsgo.7.0.2 (TS API 6.0.3 on tsgo 7.0.2, in-process NAPI/FFI) — exactly one variable against the (JS) row: the TypeScript engine.
- **verter-tsc ⚠**: verter-tsc --noEmit -p tsconfig.json | ⚠ FAILED DIAGNOSTIC-CENSUS GATE — the baseline reported 0 diagnostics and exited 0, so a checker that agrees must also exit 0; this row exited 1 while reporting 156 diagnostic(s) against a clean reference — a non-zero exit here is a failed check of the project, not a stricter one. Measured but UNRANKED.
- **Vize ⚠**: vize check --tsconfig tsconfig.json (no path pattern, so the file set comes from the tsconfig's include/exclude/files — the closest analogue of the -p invocation the other rows use) · ⚠ NOT ASSERTED EQUAL: Vize builds its own virtual project from that tsconfig rather than a TypeScript program, so which files end up checked may still differ; the diagnostic census below is what would expose a materially smaller set. | ⚠ FAILED DIAGNOSTIC-CENSUS GATE — the baseline reported 0 diagnostics and exited 0, so a checker that agrees must also exit 0; this row exited 1 while reporting 21 diagnostic(s) against a clean reference — a non-zero exit here is a failed check of the project, not a stricter one. Measured but UNRANKED.
- **Golar typecheck ⏭**: ⏭ NOT MEASURED — golar is not yet wired into the project-typecheck surface (its own-tsconfig invocation and diagnostic census have not been validated against real projects). A harness omission, not a verdict about golar; it ranks on the generated-corpus typecheck surface.

</details>

<details><summary>Raw runs</summary>

- **vue-tsc (N)**: 10.25 s, 10.27 s
- **verter-tsc**: 3.81 s, 3.69 s
- **Vize**: 66.76 s, 66.84 s

</details>
#### Peak RSS

> Whole process tree of the timed run (not Vue-attributed). Volar includes both halves.

| Tool | **Peak RSS** |
| --- | ---: |
| verter-tsc ⚠ | (728.4 MB) |
| vue-tsc (N) | **2696.7 MB** |
| Vize ⚠ | (3022.8 MB) |


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
- Each measured run is a fresh CLI process, so every row pays process startup equally and none inherits another's incremental cache. Tool order is rotated on every warmup and measured run.
- The checkout is never written to by this surface — it only reads.
- Measured runs capped at 2 for this surface (requested 5; per-surface runtime budget, 2026-07-30). Set BENCH_UNIFORM_RUNS=1 for equal run counts everywhere.

</details>

### Project component-meta (own tsconfig) — vue-vben-admin:core-ui

Files: **70** · Bytes: **933,224**

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | components resolved | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @verter/component-meta | **620.0 ms** | 598.3 ms | 14.1 ms | 2.3% | 1.00x | 70 | 113 files/s |
| vue-component-meta | **2.72 s** | 2.40 s | 284.0 ms | 10.4% ⚠ | 4.38x | 70 | 26 files/s |
| Vize component-meta ⏭ | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **@verter/component-meta**: openComponentMetaSession({root: packages/effects/layouts, tsconfig: tsconfig.json}) + getComponentMeta for the same 70 corpus SFCs | prop coverage verified: reported at least one prop for all 36 components that declare props in their source. Components that declare NO props are excluded from this gate, because the tools legitimately disagree about whether such a component still has implicit and inherited surface. | ⓘ reported 486 props+events+slots against the baseline's 1326 across the same 70 components. Member counts are NOT asserted equivalent: the tools differ on whether inherited and implicit surface belongs to a component's public API. The gated quantities are components resolved and per-component prop coverage.
- **vue-component-meta**: BASELINE · createChecker(tsconfig.json) + getComponentMeta for each of 70 corpus SFCs under packages/effects/layouts, using the project's own tsconfig and installed dependencies
- **Vize component-meta ⏭**: No component-meta API found on @vizejs/native in this install (loaded successfully, but exports no extractComponentMeta()). Declaration emit is a different job and is NOT substituted for metadata extraction.

</details>

<details><summary>Methodology</summary>

- Target: @vben/layouts (packages/effects/layouts) — 70 corpus SFCs, read with the project's OWN tsconfig.json and its own installed dependencies.
- Corpus pin: v5.7.0 @ 63a38dce, released 2026-05-21 (github-release), pinned 2026-07-29.
- The component set is the RESOLVED CORPUS restricted to the target package, not a private walk — so `--file-limit` and its truncation disclosure apply here exactly as they do to every other real-world surface. A private walk would quietly measure a different file set from the one the corpus line names.
- Both tools are given the same absolute file list, the same tsconfig and the same directory, and each is driven through its own published entry point. No payload is hand-decoded and no row is measured through an API it does not ship.
- The target was pre-flighted: the baseline built a checker and extracted from a bounded sample untimed first, and the target is measured only because that resolved components AND found declared props on some of them. A target the baseline cannot read publishes no rows at all — every other row would be gated against a reference that did no work.
- Candidate @vben/playground (playground, 125 SFCs) was REJECTED before measurement: no corpus SFC lies under playground, so this target and this corpus do not overlap. No rows are published for a target the baseline cannot extract from — every other row would be gated against a reference that did no work, which marks the tools that DID as the anomalies.
- Metadata census gate: a row that resolved metadata for fewer components than the baseline is UNRANKED, and so is a row that resolved none at all — including the baseline's own row, which is gated identically. Returning `{}` is the fastest thing a metadata extractor can do.
- Prop-coverage gate: a row reporting ZERO props for any component the baseline found props on is UNRANKED. This is the gate that catches a fast, empty answer hiding behind a healthy-looking component count.
- Member totals (props+events+slots) are published but NEVER gated. The tools disagree about what belongs to a component's public API — vue-component-meta reports inherited and implicit surface, Verter reports the declared API — and gating on that would brand a tool for a schema definition rather than for doing less work. The per-component prop coverage above is the part that is not a schema disagreement.
- Metadata EQUIVALENCE is not asserted, and correctness of the extracted metadata is not checked against the third-party sources: nobody has written down what the right answer is for these components. This is a throughput surface with a coverage census.
- Each measured run constructs a fresh checker/session and Verter's pooled engine is evicted afterwards, so no run inherits another's warm program. Tool order is rotated on every warmup and measured run.
- The checkout is never written to by this surface — it only reads.

Raw runs:

- **@verter/component-meta**: 620.0 ms, 626.9 ms, 603.2 ms, 598.3 ms, 629.5 ms
- **vue-component-meta**: 2.72 s, 2.69 s, 3.08 s, 3.06 s, 2.40 s

</details>

### Project LSP (project as workspace) — vue-vben-admin:core-ui

Files: **1** · Bytes: **5,190**

Tools:

- **Volar (JS)** — @vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.
- **Volar (N)** — the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.
- **Verter** — verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.
- **Vize** — vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).

Ranked **per operation** and, within an operation, **per TypeScript engine** — never pooled. The two operations differ by orders of magnitude and answer unrelated questions (cold project load vs a warm request), and a ratio across engines measures TypeScript's own Go rewrite at least as much as the Vue layer on top of it. A row that failed its content gate is shown in brackets and excluded from ranking: latency without an answer is not a comparable measurement.

#### didOpen → diagnostics — JavaScript TypeScript engine, ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) ⚠ | (3.97 s) | (3.95 s) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Volar (JS) ⚠**: BASELINE · official Vue language server v3 in hybrid (two-process) mode — the only mode v3 has. The measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver bridge. Both processes' startup and project load of the real project are inside the timings. HOVER asks both halves in parallel and charges the slower; DIAGNOSTICS times the first publication for the document from either half (which may be an empty preliminary — the count it carried and the first NON-EMPTY publication are both published). · operation: didOpen → diagnostics · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue | ⚠ FAILED DIAGNOSTIC-CONTENT GATE — published 0 diagnostics for a document vize published 4 for. Answering "nothing to report" fast is not the same job as answering. Measured but UNRANKED. (Diagnostic EQUIVALENCE is not asserted; the counts are published so a suspicious row is visible.)

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 3.97 s, 4.04 s, 3.95 s, 3.96 s, 3.98 s

</details>

#### didOpen → diagnostics — native tsgo engines, ranked together

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | diagnostics published | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vize | **7.35 s** | 7.31 s | 46.4 ms | 0.6% | 1.00x | 4 | 0 files/s |
| Volar (N) ⚠ | (2.40 s) | (2.36 s) | – | – | not ranked | (0) | – |
| Verter ⚠ | (385.9 ms) | (383.8 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry, because no version-matched native server was found; that costs ~35ms of Node bootstrap per spawn. Same workspace, file and position as every other row. · operation: didOpen → diagnostics · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue
- **Volar (N) ⚠**: Identical to the Volar row except the TypeScript half runs on typescript-native-bridge (tsgo): same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.13.tsgo.7.0.2 tsdk. Exactly one variable against the baseline — the TypeScript engine — which is why the two are ranked in separate tables. · operation: didOpen → diagnostics · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue | ⚠ FAILED DIAGNOSTIC-CONTENT GATE — published 0 diagnostics for a document vize published 4 for. Answering "nothing to report" fast is not the same job as answering. Measured but UNRANKED. (Diagnostic EQUIVALENCE is not asserted; the counts are published so a suspicious row is visible.)
- **Verter ⚠**: verter-lsp stdio, the native server from the published npm package, given the project directory as its workspace root. $/verter/ready is not waited for — its workspace load is inside the measured window like every other server's. · operation: didOpen → diagnostics · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue | ⚠ FAILED DIAGNOSTIC-CONTENT GATE — published 0 diagnostics for a document vize published 4 for. Answering "nothing to report" fast is not the same job as answering. Measured but UNRANKED. (Diagnostic EQUIVALENCE is not asserted; the counts are published so a suspicious row is visible.)

</details>

<details><summary>Raw runs</summary>

- **Vize**: 7.43 s, 7.35 s, 7.31 s, 7.32 s, 7.39 s
- **Volar (N)**: 2.40 s, 2.37 s, 2.41 s, 2.41 s, 2.36 s
- **Verter**: 383.8 ms, 384.3 ms, 410.7 ms, 385.9 ms, 387.6 ms

</details>

#### hover on `props` — JavaScript TypeScript engine, ranked alone

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volar (JS) | **4.2 ms** | 2.9 ms | 1.9 ms | 45.6% ⚠ | 1.00x | 621 | 238 files/s |

<details><summary>Notes</summary>

- **Volar (JS)**: BASELINE · official Vue language server v3 in hybrid (two-process) mode — the only mode v3 has. The measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver bridge. Both processes' startup and project load of the real project are inside the timings. HOVER asks both halves in parallel and charges the slower; DIAGNOSTICS times the first publication for the document from either half (which may be an empty preliminary — the count it carried and the first NON-EMPTY publication are both published). · operation: hover on `props` · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue

</details>

<details><summary>Raw runs</summary>

- **Volar (JS)**: 7.1 ms, 7.1 ms, 4.2 ms, 4.2 ms, 2.9 ms

</details>

#### hover on `props` — native tsgo engines, ranked together

| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | **94.2 ms** | 72.8 ms | 13.2 ms | 14.0% ⚠ | 1.00x | 618 | 11 files/s |
| Vize | **232.2 ms** | 214.2 ms | 13.7 ms | 5.9% | 2.46x | 447 | 4 files/s |
| Volar (N) ⚠ | (2.9 ms) | (2.9 ms) | – | – | not ranked | (234) | – |

<details><summary>Notes</summary>

- **Verter**: verter-lsp stdio, the native server from the published npm package, given the project directory as its workspace root. $/verter/ready is not waited for — its workspace load is inside the measured window like every other server's. · operation: hover on `props` · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue
- **Vize**: vize lsp --stdio, launched from the npm package's NODE entry, because no version-matched native server was found; that costs ~35ms of Node bootstrap per spawn. Same workspace, file and position as every other row. · operation: hover on `props` · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue
- **Volar (N) ⚠**: Identical to the Volar row except the TypeScript half runs on typescript-native-bridge (tsgo): same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at TNB 6.0.3-bridge.13.tsgo.7.0.2 tsdk. Exactly one variable against the baseline — the TypeScript engine — which is why the two are ranked in separate tables. · operation: hover on `props` · workspace packages/effects/layouts, document packages/effects/layouts/src/authentication/authentication.vue | ⚠ TOO NOISY TO RANK — CV 66.4% (ceiling 50%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.

</details>

<details><summary>Raw runs</summary>

- **Verter**: 94.2 ms, 105.3 ms, 72.8 ms, 92.8 ms, 105.0 ms
- **Vize**: 232.2 ms, 214.4 ms, 241.9 ms, 241.1 ms, 214.2 ms
- **Volar (N)**: 2.9 ms, 2.9 ms, 2.9 ms, 7.3 ms, 4.4 ms

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
- ⚠ NOT EQUAL WORK on the diagnostics operation, and the direction is known. `textDocument/publishDiagnostics` from the Volar rows carries what the VUE server computes; Volar v3 delegates TypeScript to a separate tsserver that speaks the tsserver protocol rather than LSP, so TypeScript diagnostics reach a real editor through the extension and are NOT in this notification. A single-process server publishes its Vue and TypeScript diagnostics together in one message. So the Volar diagnostics rows are answering a NARROWER question than the Verter and Vize rows, and answering a narrower question is faster. The diagnostic COUNT is published on every row so the difference is visible rather than inferred, and the gate is deliberately one-directional (it fails a row for publishing nothing, never for publishing fewer) so it cannot punish a server for the broader answer. The hover operation does not have this asymmetry: both Volar halves are asked and the slower is charged.
- ⚠ CORRECTNESS OF THE CONTENT IS NOT ASSERTED. These are third-party sources with no planted marker, so nobody has written down what the right hover text or the right diagnostic set is for them. This surface establishes that a server ANSWERED where the reference server answered, and nothing more. Content correctness is gated on the generated corpus (`lsp`), against a symbol whose type is known.
- The retry budget and per-request timeout are identical for every server, and retry sleeps fall inside the measured window — an asymmetric budget would silently subsidise whichever server got the larger one. Readiness is established the same way for every server, by retrying the operation until it answers, so whoever needs project-load time pays for it in the metric.
- A degraded type backend is detected from stderr and reported on any row, ranked or not (Vize logs a failed Corsa spawn, Verter logs verter-only mode). It is reported rather than used to fail a row on its own: the content gates decide ranking, and this is the explanation for the number in either direction.
- Each measured run starts a fresh server process, so per-process project load is paid every time and no run inherits another's cache. Server order is rotated on every warmup and measured run.
- VS Code extension-host overhead is NOT measured — only the language-server stdio protocol.

</details>
