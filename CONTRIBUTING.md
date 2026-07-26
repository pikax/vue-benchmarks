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

Run the same gates CI uses on pull requests:

```bash
pnpm confirm          # correctness suite
pnpm smoke            # tiny throughput pass (generates fixtures/20)
pnpm bench:memory:small  # optional memory probe (isolated from timing)
```

Do **not** commit:

- `fixtures/**` (generated)
- `results/**` (local reports)
- `work/**` (ephemeral)
- `node_modules/`

## Project layout

| Path                              | Role                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `scripts/bench.mjs`               | Throughput orchestrator                                                                                       |
| `scripts/generate.mjs`            | Fixture generator                                                                                             |
| `scripts/lib/surfaces/`           | Per-surface measurements (includes `jsx-compile` for [vue-jsx-vapor](https://github.com/vuejs/vue-jsx-vapor)) |
| `tests/confirm/`                  | Correctness plants (tracked in git)                                                                           |
| `.github/workflows/pr.yml`        | PR smoke                                                                                                      |
| `.github/workflows/benchmark.yml` | Compile (sharded by target) + bench + Linux memory probe → README.md + MEMORY.md                                       |

## Adding a tool

1. Wire it in the relevant `scripts/lib/surfaces/*.mjs` file.
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
- Keep report wording factual (no tool preference language).
- Windows and Unix paths are both supported; prefer `node:path` and avoid shell-only pipelines in scripts used by CI.

## Publishing this repository

Suggested first push (from a clean tree):

```bash
git init   # if needed
git add .
git status # confirm: no fixtures/* corpora, no results/* reports, no work/, no node_modules
git commit -m "chore: initial public release"
git remote add origin <your-github-url>
git push -u origin main
```

Then enable Actions, Dependabot, and (optional) private vulnerability reporting under the repo Settings.

## License

By contributing, you agree that your contributions are licensed under the MIT License (see `LICENSE`).
