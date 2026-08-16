# `envs/tnb` — vue-tsc on the native tsgo engine

An isolated install of **the same vue-tsc** the root project uses, with one
variable changed: the `typescript` package is aliased to
[`typescript-native-bridge`][tnb] (TNB), a `typescript`-shaped drop-in whose
checker is Microsoft's Go compiler (tsgo 7.0.2) running in-process over a
cgo NAPI/FFI bridge.

## Why this exists

The typecheck surface spans two TypeScript engines, and that gap was the
single largest fairness caveat in this repo:

| tool         | Vue layer     | TS engine            |
| ------------ | ------------- | -------------------- |
| `vue-tsc`    | language-tools | TypeScript 6.0.3 (JS) |
| `vize check` | Vize          | tsgo (native)        |
| `verter-tsc` | Verter        | tsgo (native)        |
| `golar`      | golar         | tsgo (native)        |

Ranking `vue-tsc` against the others measured **TypeScript's own Go rewrite**,
not the Vue layer sitting on top of it — so the report puts the two engines in
separate tables and refuses to compare across them.

TNB closes that gap on the typecheck surface. With `vue-tsc (TNB)` in the table,
every native-engine row runs the same TypeScript checker, and the remaining
spread between those rows is the Vue layer.

The swap has an observed consequence on another surface: on the IDE surface the
tsgo half errors resolving an auto-import completion item, recorded in
[the root README][ide-caveat]. The two surfaces are measured separately.

The stock JS-engine `vue-tsc` row is **kept**, because that is what people run
today. Two rows, two engines, both labelled.

## Why a separate project instead of the documented root override

TNB's documented install is a root-level `typescript` override. That is correct
for an application, and wrong here: it would swap the engine underneath
*everything* in the repo at once — `vue-component-meta`, type-aware ESLint, the
Vue language server, `verter-tsc` — silently changing the meaning of surfaces
that are not part of this comparison.

This directory is a standalone pnpm project (no workspace link, own lockfile),
so the root `node_modules` is untouched. Engine selection is **bin-relative**:
`vue-tsc` resolves `typescript/lib/tsc` from its own package location, never
from `cwd`, so invoking this directory's binary against a fixture elsewhere
still uses TNB. Verified, not assumed.

Versions are pinned to match the root install exactly (`vue-tsc@3.3.10`,
`vue@3.5.41`). If you bump one, bump both — otherwise the comparison silently
acquires a second variable.

## Install

```bash
pnpm install --dir envs/tnb --ignore-workspace
```

Missing or unbuilt, the `vue-tsc (TNB)` row is skipped with a note; nothing
else in the benchmark is affected.

## Activation is asserted, not trusted

TNB prints a `TNB ACTIVE` banner on startup. The harness requires it on every
gate run: if the bridge ever fell back to the JavaScript checker without
signalling it, the row would still be *labelled* native while running JS —
the kind of mislabelling the work gate exists to catch. No banner, no ranking.

The row also clears the standard typecheck work gate unchanged: script-level
plant, both template-level plants under `strictTemplates`, and the planted bug
re-found in the full timed corpus.

[tnb]: https://github.com/johnsoncodehk/typescript-native-bridge
[ide-caveat]: ../../README.md#caveat-the-tnb-engine-swap-fails-an-ide-completion-resolve-operation
