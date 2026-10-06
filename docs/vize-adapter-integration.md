# Vize adapter integration

The original 154 typecheck confirmation cases and eleven lint dirty/clean
plants keep their existing sources, metadata, judges, known-failure policy and
published results. This adapter correction does not establish a new ranking.

## Configured typecheck input set

Vize's no-pattern `check --tsconfig <file>` selects the authored tsconfig
`files`/`include`/`exclude`. An explicit `check .` requests the directory as the
input set. The confirmation workspace excludes `golar.config.ts`; passing `.`
overrides that choice and can produce an unrelated missing-Golar-module
diagnostic that the existing bootstrap detector rejects.

Use project mode consistently in confirmation, timing and its discovery/explicit
config work gates. Keep every scoring rule, native environment and failure
classification unchanged. The first retained Vize-source replay of the original
154 cases failed after one shared invocation with 143 passes, eleven missing
strict-prop/fallthrough diagnostics and one unrelated Golar diagnostic. That
failed observation remains historical evidence, not adapter acceptance.

The early global raw-config fallback proposed in
[ubugeeei-prod/vize#8075](https://github.com/ubugeeei-prod/vize/pull/8075) was
withdrawn after unchanged native fallthrough contracts failed. The delivered
fix retains those defaults and provides the explicit `strictComponentAttrs`
policy used by the isolated adapter below. Both failed histories remain
recorded; the adapter does not modify the original project configurations.

## Rich lint frame attribution

Vize's human output frames a location as `╭─[path.vue:line:column]`. The old
parser's greedy filename group included `╭─[`, so the unchanged judge rejected
all eleven legitimate dirty-file attributions. Match the actual frame boundary
and its complete path, bounded by the next diagnostic header. Paths quoted in
source/help and a later report's frame cannot own an earlier diagnostic.

The regression fixture retains four complete original human stdout streams
from an authenticated historical Vize-source Actions artifact, plus all old
complete parsed rows. Independently corrected expected rows remove only the
literal frame-opening decoration from the filename; ranges, rules, messages and
raw slices remain exact. Both original eleven-plant judge runs fail for the old
rows and pass for the corrected rows. Additional full-object controls cover
spaces, Unicode, Windows paths, CRLF, a missing frame before another diagnostic,
wrong locations/rules, uncleared clean twins and retained non-Vize fallbacks.

These tests replay retained text and spawn no Vize/compiler/benchmark. CLI
commands and rich output remain unchanged. The historical source version and
artifact identity are in the fixture manifest; these bytes are not current
installed-package observations. Upstream CI, a supported published Vize update,
current full validation and any ranking refresh remain separate requirements.

## First upstream CI and obsolete exception

Source 5c8e6ea passes all harness controls and the ordinary PR build/smoke.
Test 37399471255 executes all 702 confirmation rows but fails the existing rule
that rejects a known-failure entry once its original dirty/clean judge passes:
`lint/mutating-props-shadowing/vize-lint-1t` now passes after path attribution.
The full failed report is retained: official artifact 11384519536, 28,126 bytes,
SHA256 154ef1564369e266a8f01107c7bab2e7c6d079d33819d530d5e4e92c5768dd03.
Both ZIP member CRCs are valid; report totals are 533 pass / 143 fail / 26 skip / 0 warn.

Remove only that obsolete exception, so its unchanged original test must keep
passing. All other known-failure entries, original plants/judges/configs and
published results stay exact. The first failed run stays failed; a fresh current
upstream Test must execute the same full suite before this patch is qualified.

The [paired correction record](https://github.com/ubugeeei-prod/vize/issues/7856#issuecomment-6007558994) preserves the same complete first-CI evidence and scope.

## Standard strict component-attribute translation

Vize's retained default policy permits native component attributes and automatic
fallthrough; changing it globally breaks existing projects. Standard strict
benchmark options now use an isolated Vize `extends` wrapper: absent
`checkUnknownProps` inherits authored `strictTemplates`, absent
`fallthroughAttributes` becomes false, and absent `strictComponentAttrs` inherits
`strictTemplates`. Authored explicit booleans win, including inherited options.
Original configs, SFCs and all judges remain byte-exact. The helper accepts the
benchmark's generated JSON configs and fails on missing or cyclic inputs.

`strictComponentAttrs` is available in the published Vize 0.435.0: it defaults
false, is effective only with resolved unknown-prop checking, keeps declared and
Vue public attributes, and permits only genuinely enabled inferred root keys.
This applies to confirmation, timing and post-timing work gates. Wrapper creation
is outside measured CLI execution; the actual checker still pays config loading.
The registered Vize current-154 recipe uses the byte-identical helper; official
references keep their original configs. Neither current 154-case completion nor
public ranking is claimed. The previous upstream 702-row confirmation at 2339ffd
is green independently of this new source delta and is not transferred to it.

Decision: https://github.com/ubugeeei-prod/vize/issues/7856#issuecomment-6007815072

## Published dependency adoption

Pin the five direct Vize packages and their fourteen-package dependency graph
to the actual published 0.435.0 release. Every new lockfile integrity matches
the retained official registry metadata. All other package blocks, peer
contexts, the package-manager lock document and original judges remain exact.
The Vite plugin's new `picomatch` dependency uses the already locked 4.0.5.
The resolver adds only these fourteen exact versions to the existing release-age
exceptions; the threshold and other integrity policies remain unchanged.

The public release is sourced from 51f3778473a17cecfb31c6238207418c2232c299,
with source cut baa427830e0a1b1b50a45582bda418992d5a5ac9. Dependency preparation
used lockfile-only resolution with scripts disabled and loaded no provider.
Fresh upstream CI must validate these actual installed versions.

The separate current-source 154-case qualification remains failed: text has
149 passes and five warnings; JSON has 146 passes, two failures and six warnings;
the unchanged reference has 147 passes, two failures and five warnings. No
case, exception, scoring rule or published result is changed by this update.
Vize issue #7856 and authoritative upstream main ranking remain unfinished.

Decision: https://github.com/ubugeeei-prod/vize/issues/7856#issuecomment-6013062932

## First published-package harness result

The first 0.435.0 Test (37441354148) fails one of 1,034 harness tests before
confirmation. The blanket installed-native zero-passes assertion rejects the
unchanged `scss-v-bind-scoped` judge, whose authored style uses only ordinary
CSS nesting and v-bind. Ordinary PR smoke 37441354149 independently records
that single pass for both Vize native APIs, with seven genuine Sass failures.
The complete exact Sass gate remains FAIL; external Sass-adapter results remain
separate. Keep all original eight plants/judges and the aggregate FAIL assertion,
while removing only the Vize-specific forever-zero assumption. No Sass support,
confirmation completion or ranking is inferred. The complete first failed log
and official smoke artifact remain retained; fresh same-PR Actions are required.

Decision: https://github.com/ubugeeei-prod/vize/issues/7856#issuecomment-6013255914
