# Contributing

## Prerequisites

- Node.js **22+** (see `.node-version`)
- [pnpm](https://pnpm.io) 10 (`corepack enable`)

## Setup

```bash
corepack enable
pnpm install
pnpm generate:small   # or pnpm generate
```

## Before opening a PR

Run the same gates CI uses on pull requests. Two workflows fire on a PR: `test.yml` runs the harness self-tests and the confirmation suite, `pr.yml` runs the throughput smoke.

```bash
pnpm test:harness     # harness self-tests      (test.yml)
pnpm confirm          # correctness suite       (test.yml)
pnpm smoke            # tiny throughput pass, generates fixtures/20 (pr.yml)
pnpm bench:memory:small  # optional memory probe (isolated from timing; not a CI gate)
```

CI is **Linux only**, so platform-specific breakage (Windows file locks, `.cmd` shims, path handling) is not covered — run the above locally on macOS/Windows if you need that signal.

Do **not** commit:

- `fixtures/**` (generated)
- `results/**` (local reports)
- `work/**` (ephemeral)
- `node_modules/`

## Project layout

| Path                              | Role                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `scripts/bench.mjs`               | Throughput orchestrator (compile, jsx-compile, typecheck, format, lint, component-meta, lsp)                  |
| `scripts/ide-bench.mjs`           | Per-operation IDE orchestrator — a separate surface, not part of `bench.mjs`                                  |
| `scripts/bench-memory.mjs`        | Resource probe orchestrator; `scripts/memory-worker.mjs` is the isolated per-tool child                        |
| `scripts/generate.mjs`            | Fixture generator                                                                                             |
| `scripts/lib/surfaces/`           | Per-surface measurements (includes `jsx-compile` for [vue-jsx-vapor](https://github.com/vuejs/vue-jsx-vapor)) |
| `scripts/lib/ide-ops/`            | IDE surface internals: server registry, workspace scaffolding, and `suites/` (background, completion, edit-loop, navigation, scale, smoke) |
| `envs/tnb/`                       | Isolated `vue-tsc`-on-tsgo install. Never a root `typescript` override — an override would swap the engine under component-meta, lint and LSP at once |
| `tests/harness/`                  | Self-tests of the benchmark machinery: measurement protocol, report rendering, work gates, module wiring. Spawns no compiler; runs in seconds |
| `tests/confirm/`                  | Correctness plants + `known-failures.json` (tracked in git)                                                   |
| `.github/workflows/test.yml`      | Harness + confirm on every PR and `main` push. Publishes nothing                                              |
| `.github/workflows/pr.yml`        | PR smoke: tiny `fixtures/20` throughput pass only. Does **not** run `pnpm confirm` — `test.yml` already does, on the same event |
| `.github/workflows/benchmark.yml` | Manual dispatch only. `build` → `bench` + `ide` + `ide-scale` + `memory` → README.md + MEMORY.md. The only workflow that commits |

**`benchmark.yml` deliberately does not shard.** Every timing surface runs in the one `bench` job so no result is ever merged across runners — runner-to-runner variance is easily larger than the differences being measured. The job header states the rejection and the measured per-surface costs that make it affordable; do not "optimise" it into a matrix.

## Adding a tool

1. Wire it in the relevant `scripts/lib/surfaces/*.mjs` file — or, for a language server, in the server registry under `scripts/lib/ide-ops/` (the IDE surface is separate from `bench.mjs` and has its own orchestrator).
2. If the surface is ranking-critical, add confirmation plants under `tests/confirm/fixtures/`.
3. Record the real package name/version via `scripts/lib/versions.mjs` when possible.
4. If an API is missing, report `skipped` — do not substitute a different workload.

## Adding a confirmation plant

See existing cases under `tests/confirm/fixtures/{compile,lint,typecheck,component-meta}/`.

```bash
pnpm confirm:typecheck
# etc.
```

## Coding notes

- ESM only (`"type": "module"`).
- Keep report and documentation wording factual: state what was measured, under what conditions, and what was observed. No tool preference language, no verdicts about which tool is better, and no telling the reader what a number means beyond the measurement. Caveats are worded as conditions on reading a number, not as warnings about a tool — and a factual caveat is reworded, never deleted.
- Windows and Unix paths are both supported; prefer `node:path` and avoid shell-only pipelines in scripts used by CI.

## License

By contributing, you agree that your contributions are licensed under the MIT License (see `LICENSE`).
