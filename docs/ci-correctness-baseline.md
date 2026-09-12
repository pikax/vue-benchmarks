# Correctness CI repair — 2026-09-12

[Linux job 103539616401](https://github.com/pikax/vue-benchmarks/actions/runs/34688515461/job/103539616401)
at `e8a261f` installed successfully and passed the harness tests. The confirmation
gate failed on three obsolete known-failure entries and 132 unlisted failures.
The probe expansion had introduced new expectations without completing the
review of their baseline, and three results were false positives in the harness.

## Harness fixes

The CSS projection now accepts the equivalent rewrites actually emitted by the
tools: basic color keywords and hex spellings on the `color` property, independent
declaration ordering, simple min/max width/height media-query ranges, and the four
legacy pseudo-element spellings. These are bounded normalizations, not a claim
that arbitrary CSS programs can be compared for equivalence.

Duplicate declarations retain their relative order. Unknown properties and
shorthand/longhand interactions remain ordering barriers. Rule/block order,
important flags, custom-property token spelling, string contents, media-query
boundaries and selector relationships remain checked. Regression tests accept
the legal rewrites and reject changes to those contracts.

The range equivalence follows [Media Queries 4](https://drafts.csswg.org/mediaqueries-4/#mq-min-max);
the legacy single/double-colon spellings follow
[Selectors 3](https://drafts.csswg.org/selectors-3/#pseudo-elements).

This corrects three false failures:

- Verter: `style-multiple-style-blocks` and `style-media-scoped`.
- Vize formatter: `shared-css-and-custom-block-semantics`.

The source-map adapter also now distinguishes Vize's parsed input style
descriptors (`content`) from emitted CSS (`css` or a style artifact's `code`).
The previous adapter tried to parse an undefined output field. The repaired
probe inspects the actual emitted CSS and still fails when its source map is
absent. It never substitutes input CSS or manufactures a source map.

CSS, format and source-map suite versions were advanced for these changes.

## Reviewed tool failures

Removed the three Vize entries that now pass on both the local Windows run and
Linux CI: custom directives, reserved props, and async computed.

The remaining 129 newly observed failures are recorded under exact probe/tool
keys with explanations in `tests/confirm/known-failures.json`:

| Probe family | Entries | Observed behavior |
| --- | ---: | --- |
| Reactive destructure shadowing | 2 | Lost outer binding or reactive update |
| CSS compiler semantics | 45 | Incorrect scope transforms, keyframes, module mappings or CSS-variable registration |
| Source-map matrix | 60 | Missing maps, or Fervid's CRLF column error; passing reference and Fervid LF/raw cases remain unsuppressed |
| Prop-mutation lint | 2 | No attributable diagnostic on the dirty twin |
| Slot metadata | 2 | Missing or incorrect payload types |
| Vize LSP | 3 | Missing parent references and initial planted diagnostics |
| Biome formatting | 5 | Requested template formatting does not run |
| Vize typecheck | 10 | Missed attribute/fallthrough or slot-payload errors |

The ten Vize typecheck entries apply only to the combined Linux run, where they
were observed. They do not suppress per-case results or infer Windows behavior
from a run whose native checker failed to start.

No workflow was made optional and no gate logic was relaxed. Reports still show
the tool failures. New failures and known failures that become passes continue
to fail CI.

## Validation

The failed GitHub report is retained locally as evidence under
`results/ci-34688515461/`. Replaying it against the revised baseline leaves only
the three CSS false positives corrected above, with no stale entries. A separate
Linux checkout uses the frozen lockfile and Node 22.23.2 to run the same harness
and full confirmation commands as CI. Both completed successfully:

- Harness: **1,026 passed**, no failures or skips.
- `node tests/confirm/run.mjs --all`: **exit 0**, no unexpected failures and no
  stale entries. Report rows: 510 pass, 166 known failures, 26 skips; combined
  typecheck plant verdicts are also expanded and checked by the gate.
- All three corrected CSS cases pass in the fresh Linux run.

The verified report is retained locally at `results/ci-34688515461/verified.json`.
This verifies the CI commands in Linux; the GitHub workflow still needs to run
on the new commit after it is pushed.
