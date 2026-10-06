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

The independent Vize raw-config correction is tracked in
[ubugeeei-prod/vize#8075](https://github.com/ubugeeei-prod/vize/pull/8075): absent
`checkUnknownProps` inherits authored `strictTemplates`, while an explicit false
wins and unconfigured/typed defaults stay unchanged. This upstream patch does
not update the pinned Vize dependency or assume that correction is published.

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
