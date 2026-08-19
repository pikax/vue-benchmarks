# Typecheck confirmation

This is the **correctness** suite for Vue typecheckers, not a throughput benchmark.
A tool is compatible only if it reports the planted error (or stays clean) on every plant.
vue-tsc (Volar) is the usual reference, but it is **not assumed perfect** — a plant it fails is a real gap and is listed as such.

Generated from `pnpm confirm:typecheck` at 2026-08-19T18:13:47.784Z on **Windows**.
- **Runner:** Windows · win32/x64 · 32 CPUs · AMD Ryzen 9 7950X 16-Core Processor · 127.2 GB · Node v26.5.0

On a **Benchmark** dispatch, Linux CI re-runs this and commits the file. Do not hand-edit the results.

## How plants are judged

- Each case is a tiny project under `tests/confirm/fixtures/typecheck/cases/<id>/`. CI scores the matrix from **one spawn per tool** (`--all`) over every plant. `pnpm confirm:typecheck` without `--all` still runs each plant as its own spawn (fallthrough / extra-tsconfig retries).
- **All plants (one tsconfig)** — extra check: every plant is copied under `cases/<id>/` and typechecked in **one** process with the shared `tsconfig.json` (no per-case overlay, no fallthroughAttributes retry). Wall is a speed pass (no RSS sampler). Peak RSS is a **separate** memory spawn. Pass rate is the per-plant score of the last speed dump, as a percentage of scored plants (skips excluded).
- Every tool runs on the **same shared tsconfig** (`strictTemplates: true`). Extra TypeScript flags that only one tool needs are **not** added globally.
- `expectErrors: false` — the fixture is clean. Any diagnostic is a fail. A diagnostic that names the tool's own virtual code (`__VLS_`, `___VERTER___`, …) is called out as a codegen leak.
- `expectErrors: true` — at least one error, matching `mustMatch` when set. Dirty plants mark the bad line with a harness pin (`<!-- @plant-error -->` in template, `// @plant-error` in script). That is **not** TypeScript: HTML comments are ignored by every checker, so the pin always survives. The harness requires a diagnostic **on the next line** that mentions `expectMention` (e.g. the invalid prop name). A hit on the wrong line, or an error that does not name the plant, is a fail. `// @ts-expect-error` is only used in `.ts` where unused-directive is itself the plant.
- **skip** — the tool does not claim the capability (`meta.requires`), or the binary/engine is missing.
- **warn** — extra harness behaviour for one tool (today: verter-tsc retried with `allowArbitraryExtensions` + `allowImportingTsExtensions` that the others do not need). A warn is **not** a pass.
- Known upstream bugs live in `tests/confirm/known-failures.json`. They still show as **✗** here so the gap stays visible; they do not fail the PR gate until they start passing (stale entry) or a new unlisted fail appears.

## Shared vs extra vueCompilerOptions

The shared config does **not** set `fallthroughAttributes`. That flag is a Volar opt-in (default `false`). This suite does not put it in any case `tsconfig.json` — doing so would hide that a tool only types inheritAttrs fallthrough when given a non-default option.

Plants in **inheritAttrs + root shape** run **twice**: once on the shared tsconfig, then on an isolated `tsconfig.fallthrough.json`. Scoring:

- shared ✓ and extra ✓ → **pass** (no opt-in needed, or a dirty plant errors either way)
- shared ✗ and extra ✓ → **⚠ warn** (needed `fallthroughAttributes`; not a pass)
- shared ✓ and extra ✗ → **fail** (the opt-in revealed the plant was missed)
- shared ✗ and extra ✗ → **fail**

What those plants ask (the *correct* inheritAttrs/root-shape answer):

| Root shape | inheritAttrs | Call-site `id=` | Correct answer |
| --- | --- | --- | --- |
| Single element | default / true | native `id` | clean (falls through) |
| Single element | `false` | native `id` | error |
| Multi-root fragment | default / true | native `id` | error (no single target) |
| `v-if` / `v-else`, both single-root | default / true | native `id` | clean (always one root) |
| `v-if` single / `v-else` fragment | default / true | native `id` | error (not always one root) |
| `v-if="true"` or a literal-`true` prop, single branch | default / true | native `id` | clean if the checker resolves the condition statically |
| `v-if="true"` but that branch is a fragment | default / true | native `id` | error |

Static resolution (`v-if="true"`, `alwaysOn: true`) is the hard edge. A tool that only counts root nodes syntactically will fail it. That is a finding, including for vue-tsc.

## Status key

| Mark | Meaning |
| --- | --- |
| ✓ | pass — plant met on the shared (or disclosed case-local) config |
| **✗** | fail — plant not met. If listed in known-failures.json it is a documented upstream gap |
| ⚠ | warn — extra harness behaviour; not scored as a pass |
| ○ | skip — missing capability or engine |
| – | no row (tool did not run this case) |

## Summary

- plants: **142**
- pass: **0** · fail: **0** · skip: **0** · warn: **0**
- one-spawn combined run: [All plants (one tsconfig)](#all-plants-one-tsconfig)

## All plants (one tsconfig)

One spawn per tool over **every** plant, nested at `cases/<id>/` so filenames do not collide. Same shared `strictTemplates` tsconfig as the per-plant matrix — no case-local `vueCompilerOptions`, no fallthroughAttributes retry, no verter extra flags. A plant that only passes with those extras fails here; that is the point of the combined check.

Wall is the **median** of a **speed** pass (`--runs`, default 5, after `--warmups`, default 1) with **no** RSS sampler. Peak RSS is a **separate memory pass** (one sampled spawn after speed) so process-tree polling cannot inflate the clock. Engine RSS is a child `tsgo` / native `tsc` / `tsserver` when one was spawned. Pass rate is scored plants that met their pin (skips excluded), as a **percentage**.

![All plants wall](results/charts/typecheck-all-wall.svg)

| Tool | **Wall** | vs fastest |
| --- | ---: | ---: |
| golar | **920 ms** | 1.00x |
| vize | **1.28 s** | 1.39x |
| vue-tsc | **2.50 s** | 2.72x |
| verter-tsc | **2.82 s** | 3.07x |

![All plants peak RSS](results/charts/typecheck-all-rss.svg)

| Tool | Tool | tsgo / tsc | **Total** |
| --- | ---: | ---: | ---: |
| golar | 323.1 MB | — | **323.1 MB** |
| vue-tsc | 350.2 MB | — | **350.2 MB** |
| vize | 90.5 MB | 292.2 MB | **382.7 MB** |
| verter-tsc | 351.1 MB | 363.9 MB | **715.0 MB** |

Engine is a **child** `tsgo` / native `tsc` / `tsserver`. vue-tsc, golar, and vize host the checker **in-process** — Peak RSS is that process's high-water mark (Tool = Total, engine —).

![All plants pass rate](results/charts/typecheck-all-pass.svg)

| Tool | **Pass rate** | pass / scored | skipped |
| --- | ---: | ---: | ---: |
| vue-tsc | **84%** | 119 / 142 | 0 |
| golar | **82%** | 117 / 142 | 0 |
| verter-tsc | **76%** | 108 / 142 | 0 |
| vize | **52%** | 71 / 136 | 6 |

**vize** scored 136 of 142 (6 skipped). Skips are capability gaps, not fails — Vize does not claim `strict-component-attrs` (undeclared component attrs under `strictTemplates`).


## Running

```bash
pnpm confirm:typecheck          # local: per-plant + all-plants
pnpm confirm --all              # CI: one typecheck spawn per tool
```

Writes `results/confirm.json`, `results/confirm.md`, and refreshes this file. A Benchmark dispatch on `main` commits this file and a README summary (`[skip ci]`).
