# Correctness probe audit — 2026-09-12

The existing coverage is broad. The most valuable improvements are stronger
oracles and complete fixtures: several checks could accept incorrect output,
and one metadata fixture incorrectly made a working extractor fail.

This review covered the SFC/JSX runtime manifests, CSS feature gates, format and
lint validity gates, typecheck diagnostic scoring, component metadata, and LSP
confirmation/IDE gates. It is a code review with focused execution, not a new
published benchmark run or an exhaustive compatibility verdict for every tool.

## Changes made

| Area | Finding and change |
| --- | --- |
| SFC and JSX | Keyed lists only checked final text order. They now require the same DOM nodes to move with their keys; removing keys demonstrably fails both probes. |
| SFC | Added `reactive-props-destructure-alias-default`: defaults, renamed bindings, computed dependencies, prop updates, and restoration of defaults after a prop becomes undefined. |
| JSX | Added `event-handler-replacement-removal`: the new handler runs once, the old handler stops, and removal stops both. Conditional rendering also checks disposal of the previous branch. |
| Runtime isolation | `Promise.resolve(run(wrapper))` could throw before installing cleanup. All three plant helpers now unmount in `finally`, including synchronous assertion failures. |
| Format | The semantic projection trimmed meaningful inline/preformatted spaces and omitted regex literal contents. Added `significant-whitespace-and-regexp` and preserved both kinds of evidence in the projection. |
| Lint and typecheck | Filename suffix matching could attribute `OtherApp.vue` to `App.vue`. Matching now requires a complete path segment. Structured lint paths take precedence over raw text, and a clean twin cannot pass by moving the same diagnostic to a different line. |
| Component metadata | Missing required/default flags could pass. Claimed capabilities now require the expected boolean, including explicit false; normalization preserves unknown requiredness. |
| Metadata fixture staging | The imported-props plant lost its sibling `types.ts` when copied. Supporting source files now travel with each plant and contribute to its fingerprint. The reference's imported-props failure disappears with the complete fixture. |
| LSP | Confirmation hover now requires the planted binding's string/literal annotation. Completion uses exact normalized names, including text edits, and outline matching requires the exact binding. Null/malformed diagnostic responses cannot clear a plant; push reports stamped with an obsolete document version are ignored. |

Changed validity suites have new version identifiers. Historical benchmark JSON
and charts have not been regenerated; the stronger gates apply on subsequent runs.

## Validation

The harness includes positive reference checks and deliberate mutations: dropped
keys, nonreactive destructuring, changed whitespace/regexes, missing metadata
flags, wrong filenames, stale diagnostic versions, and unsupported pull responses.

Local Windows execution with the pinned dependencies:

- Full harness: **989/989** tests pass, with no skips.
- Official Vue 3.5: **32/32** runtime plants pass.
- Babel JSX: **9/9** runtime plants pass.
- Prettier: **4/4** format plants pass in both the regression suite and the exact CLI validator.
- ESLint's reference API entry point: **10/10** dirty/clean lint pairs pass using the generated benchmark config.
- `vue-component-meta`: **28/29** pass after fixing fixture staging. The remaining
  `options-api-component` failure reports missing `increment`/`reset` events;
  this is separate from the changed required/default checks.
- Live LSP confirmation, repeated after diagnostic-store hardening: Volar
  **9/9**, Verter **7/9**, Vize **3/9**. The command exits nonzero: five Vize
  failures are outside the applicable local known-failure entries. These are
  local findings, not new suppressions or claims about Linux CI.

## Follow-up

All nine agent proposals, including the first three items below, were subsequently
implemented. See [the expansion report](missing-correctness-probes.md) for current
contracts, integration and validation. The counts above record the initial audit.

## Proposals at the initial audit checkpoint

| Priority | Probe | Why it adds evidence |
| --- | --- | --- |
| High | Source-map coordinate tracing | Trace planted script/template/CSS tokens back to exact source positions, including Unicode and CRLF input. Map presence alone cannot establish correctness; source-map rows already remain unranked pending this work. |
| High | Apply refactoring edits and recheck | Extend navigation checks by applying rename/quick-fix edits to disposable files, then parsing/typechecking and verifying all intended uses changed. Merely returning edits in the expected files is weaker evidence. |
| Medium | Formatter CSS and custom-block semantics | Add declaration/value projections and payload checks. Current style/custom-block markers can survive while other contents change. Preserve legal formatting differences. |
| Separate surface | SSR and hydration | Add server-rendered escaping, attribute serialization and client hydration tests with their own reference and comparison class. These are different artifacts from the existing client-render rows. |

For LSP servers that omit document versions, a delayed pre-edit notification is
still inherently harder to attribute. A future edit probe should require positive
evidence of a new sentinel as well as disappearance of the old diagnostic.
