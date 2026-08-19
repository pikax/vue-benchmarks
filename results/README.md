# `results/` — benchmark reports

Where every bench writes its markdown + JSON. Two kinds of files live here:

1. **Latest Linux CI snapshot** (committed): `benchmarks/` and `real_world/`. A new publish **clears** the folder first so only that run remains.
2. **Local and working copies** (gitignored): everything else at this directory's root, plus `ci-tmp/`. Windows reports, logs, and pull scratch belong here and stay on the machine that produced them.

The landing page is the root [`README.md`](../README.md). Full tables the landing page links live under [`docs/results/`](../docs/results/) (markdown copies + SVG charts). This folder is the **source** of those reports, not the published HTML view.

Linux numbers and local Windows/macOS numbers are not comparable. The README publishes Linux only unless `PUBLISH_ANY_PLATFORM=1`.

## Layout

| Path | Tracked | What it is |
| --- | --- | --- |
| [`benchmarks/`](benchmarks/) | yes | Latest Linux bench, IDE, IDE-scale, memory, confirm (`.md` + `.json`) |
| [`real_world/`](real_world/) | yes | Latest Linux per-project real-world reports |
| `*.md` / `*.json` at this root | no | Local or CI-job working copies (`ide-win32.md`, `bench-win32-200.md`, …) |
| `ci-tmp/` | no | Scratch for `pnpm pull:ci-results` (downloaded GitHub artifacts) |

## File names

CI uses `runner.os` (`Linux`). Local runs use `process.platform` (`win32`, `darwin`).

| Pattern | Produced by |
| --- | --- |
| `bench-<OS>-<N>-bench.{md,json}` | `pnpm bench` / Benchmark `bench` job — unique-content corpus of N SFCs |
| `bench-<OS>-<N>-repeated-cache-demo.{md,json}` | same job, repeated corpus — cache demo, **not** a ranking table |
| `ide-<OS>.{md,json}` | `pnpm bench:ide` / Benchmark `ide` job |
| `ide-scale-<OS>.{md,json}` | Benchmark `ide-scale` job |
| `memory-linux-<N>.{md,json}` | `pnpm bench:memory` / Benchmark `memory` job |
| `confirm.{md,json}` | `pnpm confirm` / Benchmark `confirm` job |
| `real-world-<OS>-<project>.{md,json}` | `pnpm bench:real-world` / Benchmark (real-world) job |

## Refresh the committed snapshot

```bash
pnpm pull:ci-results      # latest successful Benchmark + real-world artifacts via `gh`
pnpm publish:ci-results   # copy Linux leaves from this folder into benchmarks/ + real_world/
pnpm update-readme        # splice Linux reports into the root README (default --dir results)
```

`publish-ci-results` skips `ci-tmp`, `benchmarks`, `real_world`, and non-Linux leaves. `scope=bench` or `scope=real-world` updates one side without wiping the other.

A section whose artifacts are missing is left as published — a partial run does not erase numbers it did not measure.

## Local runs

```bash
pnpm bench --json results/local.json --out results/local.md
pnpm bench:ide --json results/ide-win32.json --out results/ide-win32.md
```

Those files stay gitignored. Do not copy them into `benchmarks/` or `real_world/`. How to read the tables: [`docs/how-to-read.md`](../docs/how-to-read.md). Methodology: [`docs/methodology.md`](../docs/methodology.md).
