# Missing correctness probes

Agent review, 2026-09-12. Reviewed against the current working tree, including
the fixes and three new plants described in [the audit](probe-audit.md).
All nine proposals below are now implemented. The table records the original
review; implementation details and validation follow it.

## Demonstrated gaps

A read-only exercise of the earlier gates found five incorrect results that
passed. Regression tests now reject each of these:

- A rename that only inserts a comment containing the new name in the parent.
- A definition naming the expected file but providing no target range.
- Formatting edits that delete the entire document.
- Slot metadata reporting `open: string` instead of the expected `open: boolean`.
- Scoped CSS changing a declaration from `red` to `blue`.

These provide negative controls: a stronger oracle should reject each corruption
while accepting the pinned reference tool's correct result.

## Ranked proposals

| Priority | Probe | Kind / effort | Minimal fixture and observable assertion |
| --- | --- | --- | --- |
| High | Applied LSP edits and precise navigation | Strengthen / medium | Extend the existing parent/child fixture with multiple uses and same-name comment/string decoys. Apply rename or quick-fix edits to disposable source. Require intended declarations and uses to change, decoys to survive, output to parse/typecheck, and the planted error to clear. Definition/reference ranges must cover intended symbols. Formatting must preserve semantics. |
| High | Complete metadata payload facts | Strengthen / small–medium | Check both arguments of `move(x: number, y: number)`, optionality of `toggle(value?: boolean)`, and the field/type association in a slot payload `{ open: boolean }`. Dropping an argument or changing the slot field's type must fail. |
| High | Conflicting JSX spreads and removal | Strengthen / small | Use `id="first" {...props.rest} id="last"`, overlapping classes/styles, and multiple handlers. Verify attribute precedence and merging. Update/remove spread entries and require old attributes, styles and listeners to disappear. |
| High | CSS declarations and multiple style blocks | Strengthen + new / medium | Compile two style blocks with overlapping selectors, contrasting values, custom properties and a media condition. Verify values, both blocks, wrapper conditions and cascade order. Dropped blocks, reversed order and changed values must fail. |
| High | Reactive destructure with lexical shadowing | New / small | Destructure `label`, then shadow it with a function parameter and an arrow callback parameter. A prop update must change the outer rendered value while the inner values remain unchanged. |
| Medium | Template scope and shadow restoration | New / small | Declare outer `item: string`, shadow it with a numeric-field `v-for` item, then use the outer string after the loop. Clean and dirty twins test correct inner/outer methods and a pinned invalid inner expression. Add the equivalent scoped-slot pattern. |
| Medium | Prop-mutation lint follows bindings | Strengthen / small | Keep outer `props = defineProps(...)`. The dirty twin mutates that binding; the clean twin mutates a same-name function parameter receiving an ordinary local object. Only the actual prop mutation should be reported. |
| Medium | Formatter CSS semantics and custom-block parity | Strengthen / medium | Preserve duplicate CSS declarations, custom properties, quoted content and conditional rules using a parsed projection. Reuse the existing confirmation JSON payload oracle in benchmark validity; add an opaque custom-block payload check. |
| Separate pass | Source-map coordinates | New / large | Trace retained generated script/template/CSS tokens to their source spans. Include CRLF and a non-BMP character before a target. Wrong files, shifted coordinates and stale source contents must fail. |

## Where the probes belong

1. **LSP:** [navigation suite](../scripts/lib/ide-ops/suites/navigation.mjs).
   Current definition/reference gates check file identity; rename looks for the
   new name in a parent edit; formatting only requires changed text. Support
   existing legal response shapes and command-backed/resolved actions. Validate
   semantic outcomes outside request timing, rather than requiring identical edits.
2. **Metadata:** [scorer](../tests/confirm/lib/component-meta-score.mjs) and
   [fixtures](../tests/confirm/fixtures/component-meta/cases).
   `typeIncludes` intentionally accepts alternative spellings. Add separate
   all-required or structured constraints instead of globally changing OR to AND.
3. **JSX:** [runtime plants](../scripts/lib/jsx-validity-plants.mjs) and
   [confirmation suite](../tests/confirm/suites/jsx-compile.mjs).
   Existing spread cases use disjoint static attributes. Establish collision and
   merge behavior using the pinned Babel configuration.
4. **CSS compiler:** [feature gates](../scripts/lib/style-feature-gates.mjs) and
   [compiler adapters](../scripts/lib/surfaces/compile.mjs).
   The reference feature adapter currently processes `styles[0]`; update every
   relevant adapter to handle all blocks before introducing a multi-block plant.
5. **SFC scope:** [runtime plants](../scripts/lib/compile-validity-plants.mjs).
   Extend the new destructuring coverage with plain-JavaScript shadowing cases.
6. **Template scope:** [typecheck cases](../tests/confirm/fixtures/typecheck/cases).
   Use existing clean/dirty scoring and diagnostic pins; avoid optional extensions.
7. **Lint scope:** [dirty/clean plants](../scripts/lib/lint-validity-plants.mjs).
   Retain shared rule scope and concept matching; unrelated lint rules must not
   invalidate the clean twin.
8. **Formatter:** [validity projection](../scripts/lib/format-validity-plants.mjs)
   and [confirmation suite](../tests/confirm/suites/format.mjs).
   JSON custom-block semantics already have a confirmation oracle; share it
   rather than duplicating coverage. Allow legal CSS formatting and JSON key order.
9. **Maps:** [compiler surface](../scripts/lib/surfaces/compile.mjs).
   Validate the exact JS/CSS artifacts promised by each comparison class and
   compose intermediate maps when needed. Calibrate mapping granularity against
   official references; do not demand mappings for synthetic helpers.

## Implementation and integration

All nine areas are covered. New SFC and JSX runtime plants run in benchmark
validity and confirmation; runtime-only JSX probes cannot pass an empty shape
check. All five shared format plants now run in confirmation with two exact
passes. The lint twin and all 17 CSS feature gates also run in confirmation.
Metadata and the four typecheck fixtures use automatic discovery.

Metadata payload facts are parsed as TypeScript types, checking parameter count,
order, optionality and nested property types independently of existing alternative
type-token checks. CSS projections retain declaration order, duplicate properties,
values, importance and conditional context. JSON object key order may change;
array order and payload values may not. Opaque block checks ignore surrounding
whitespace and line-ending spelling while preserving inner payload text.

Applied LSP edits are validated in disposable strings outside measured request
timing. Rename compares the complete intended parsed result and preserves decoys;
it does not claim a project-wide vue-tsc pass. Quick fixes additionally prove the
actual TypeScript name diagnostic disappears. Resolved and command-backed fixes
support a scoped workspace/applyEdit handler. Navigation validates source ranges.

Source maps now have a separate process-isolated, exact-entrypoint manifest for
both targets and environments. Four plants cover raw/style workloads, LF/CRLF,
emoji before anchors and two CSS blocks. Selected generated AST token starts must
trace to the full SFC filename, exact source content and UTF-16 coordinates.
Evidence is retained in validation.sourceMaps. Each row needs its own workload's
PASS; missing, failed or unknown evidence keeps it unranked. A passing map check
cannot clear another failed gate. Confirmation runs the same map manifest.

This found a harness bug: Vue's composed template pipeline returned block-relative
maps, and its inMap/descriptor maps omit the first-line opening-template column.
The timed vueCompileSfc adapter now translates template maps using the parser's
full source location and content. That work is included in map-on timing. The
validator itself never repairs returned artifacts or borrows another API's maps.

## Validation

Local Windows execution with the pinned lockfile:

- **1,020/1,020 harness tests pass**, without skips, including deliberate edit,
  navigation, metadata, CSS, JSX, custom-block and source-map corruptions.
- Live Volar navigation: **9/9 operations pass** with the stronger gates.
- Official Vue 3.5 and 3.6 VDOM maps pass all four plants in production and
  development. Vue 3.6 Vapor passes all four in both environments.
- All **17 official Vue CSS plants** pass. Babel and compiler-rs VDOM both pass
  the new spread collision/update/removal runtime case.
- All four new typecheck fixtures meet the expected clean/error contract with
  vue-tsc in isolated and combined projects; only the two pinned bad expressions
  produce errors.
- Prettier passes all five shared format plants. ESLint passes the new lint twin.
  vue-component-meta passes strengthened event/slot facts, and all three metadata
  tools pass the multi-payload event case.

Confirmation remains red because the stronger probes expose candidate failures.
Examples include Vize reactive destructure updates and CSS formatting, incorrect
Verter/Vize slot payload types and missed prop-mutation lint diagnostics, missing
native map artifacts, and Fervid's CRLF script column mismatch. Unsupported Vapor
compiler/runtime combinations remain explicit unknowns/skips. Existing known-failure
entries were not changed. These are local findings, not claims about Linux CI.

Local reports are ignored build artifacts: results/probe-expanded-final.json
(compiler/JSX/lint/metadata/LSP), results/probe-expanded-confirm.json (earlier format
confirmation), results/probe-expanded-source-maps.json (full trace matrix, including
the corrected Windows path-case check), and results/probe-expanded-navigation.json
(live Volar). Historical benchmark timings and charts have not been regenerated.

[Test CI](../.github/workflows/test.yml) runs the harness and confirmation suites.
SFC, JSX and format confirmation use separate manifests from benchmark validity,
so adding a benchmark plant alone does not add it to `pnpm confirm`. Include
positive reference checks and negative mutation tests in the harness.

The IDE registry discovers suites locally, but
[benchmark CI](../.github/workflows/benchmark.yml) explicitly lists its IDE suites
and runs scale separately. A new IDE suite needs corresponding workflow wiring.
