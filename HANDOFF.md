# Handoff — real-world benchmark surfaces (vue-benchmarks)

You are continuing work on `D:\dev\personal\vue-benchmarks`, a Vue toolchain
benchmark. **Nothing is committed.** All work is in the working tree.

## The values this repo is built on — read before changing anything

Fairness and transparency are the project's stated core values, and most of the
code exists to defend them. Internalise these or you will "simplify" away the
guards:

1. **A tool doing less work is not faster.** Every surface has a work gate with a
   census; a row that fails it is `unranked` (bracketed), never ranked.
2. **A tool that produced NO measurement gets NO table row.** It is recorded in
   `surface.excluded` and rendered *above* the tables as "Did not run".
3. **When the HARNESS cannot exercise a tool, publish no number and say the gap is
   the harness's.** Never blame the tool.
4. **Never rank across comparison classes** (engine / bundler / corpus). Use
   `groups`.
5. **Baselines are references, not favourites.** They are gated *identically* to
   the challengers. Vize and Verter are under heavy development and expected to
   fail cases — that is a finding, not something to soften.
6. **The upstream-CI rule (the user's tie-breaker):** green upstream CI at the
   pinned commit ⇒ a failure here is **the harness's fault until proven
   otherwise**.
7. Comments explain WHY, especially the failure mode a guard prevents.

## State as of 2026-07-30 (end of day)

- `node tests/harness/run.mjs` → **720 pass, 0 fail** (27 new guard tests).
- The full 9-project e2e (OLD harness) RAN TO COMPLETION — the first ever —
  with `surfaceFailures: []`; its data is DIAGNOSTIC ONLY (see below).
- Two subagent forensic reports classified every failure in that sweep, and
  THREE adversarial audits reviewed the harness itself, each finding the last
  one's blind spots (all fixes committed same-day):
  1. fairness of the fix batch → prop-resolution census, codegen-gate mirror,
     transitive staging exclusion, census-coherence bracket, disclosure gaps;
  2. fairness of the FIXES themselves → census extended to fervid, LSP
     diagnostics gate hardened against empty-preliminary pushes, parser
     wrong-parse shapes, incoherent-census anchor, single-run loudness;
  3. INVERTED lens (does the harness do a tool's work FOR it?) → one uniform
     TS-passthrough standard per compile cell (Verter forceJs:false, Vize's
     official-plugin deviation disclosed), Verter analysisLevel back to the
     drop-in default "full", verter-lsp's missing-executable-bit packaging
     defect now LOGGED on the row rather than silently repaired. The user's
     standard: a tool that boasts drop-in replacement is tested as one, and a
     worked-around defect is still a finding.
  Full reports in the session transcript.
- Timing validation: naive-ui hmr 1875.7s → **95s**; full element-plus project
  **11.7 min** (was ~16) while compile/typecheck now do strictly more honest
  work. The 20-30 min per-project window holds.

## Fixed today (all in working tree, all with guard tests)

1. **compile**: `registerTS` never called + `compilerFs.fileExists` true for
   directories → baseline ❌ on element-plus ("Failed to resolve extends base
   type"). Also Verter now gets a workspace-backed host
   (`VerterHost.withWorkspace`). Validated: baselines ok on full corpus; Verter's
   remaining bracket is a real codegen finding (select.vue).
2. **bundle/hmr staging**: relative-import closure copied (compiler-only; the
   graph still externalises it) + baseline-compilability preflight excludes
   workspace-typed SFCs loudly for every cell alike (element-plus: 13/162).
3. **bundle**: `-!` loader-prefix guard (vue-loader compiled NOTHING yet ranked);
   sub-request containment gate + external-aware census; census key
   normalisation (Vize 185/149 raised the peer anchor and unranked honest
   cells); entry exemption; virtual-issuer base recovery + deliberate
   externalisation of sibling imports webpack cannot resolve; custom-block sink
   (naive-ui `<markdown>`, vuetify `<playground-*>`) in BOTH families;
   bare-rolldown skip-with-reason on styled corpora (rolldown#4271).
4. **project-typecheck**: solution tsconfig with `files: []` defeated the
   solution-only guard → vue-tsc ranked an EMPTY program while verter-tsc was
   unranked for doing real work. References are now followed one level
   (element-plus targets docs/tsconfig.json 779 SFCs, then tsconfig.web.json);
   `readJsonLoose`'s comment stripper no longer eats `/**/` inside glob strings.
5. **no-lockfile rule enforced** (`applyUnreproducibleGate` in corpus.mjs, called
   from run-surface.mjs) — it was declared everywhere and implemented nowhere.
6. **packageName**: nameless ROOT package.json rendered rows with no subject.
7. **Runtime budget (user decision)**: per-surface run caps in run-surface.mjs
   (project-test=1 with timing-indicative note, bundle/typecheck/hmr=2,
   `BENCH_UNIFORM_RUNS=1` escape); Vite 7 opt-in via `BENCH_BUNDLERS`; HMR
   redesign — ONE warm server per row (sessions closed after the whole table),
   2 probe files, mean per round trip, bounded `server.close()`. Target: every
   project ≤20-30 min. naive-ui was 89 min; hmr alone was 1876s.
8. Wording: typecheck census note no longer self-contradicts; hmr skips no
   longer imply capability claims; project-build firstFailure appends the line
   after a bare "error during build:" header.

## Open items

- **project-lsp: SOLVED (fix committed, 185010f).** Nothing was ever wedged:
  Volar published diagnostics for the opened document within seconds on every
  workspace, spelled `file:///d%3A/...` — and the harness's URI filter
  (lowercase-only) rejected the `%3A`, so every real answer was discarded and
  every session waited out its 120 s budget. `canonicalUri()` fixes the
  comparison; the bridge now also surfaces the TypeScript half's diagnostics.
  Verified: element-plus 5.2 s, hoppscotch 9.1 s. The full surface then
  COMPLETED FOR THE FIRST TIME on hoppscotch — all 8 rows ok (vize 42 ms,
  verter 1.2 s, volar-js 6.5 s, volar-tnb 10.0 s diagnostics) — and
  project-lsp is back in the CI surface list.
- **Re-run the full 9-project sweep with the fixed harness** — the 2026-07-30
  results (`results/e2e-full.*`, work-real/surface-json/*) are POISONED for
  publication (bundle fault classes, element-plus empty-program typecheck,
  naive-ui ranked-despite-no-lockfile). The fixed harness is validated
  per-surface; the fresh sweep is the publishable one. Expected total ≈ 2.5-3 h.
- Vize×rspack on a CUSTOM-BLOCK corpus (naive-ui/vuetify) is unverified — the
  fairness audit noted its `oneOf` rule set has no custom-block branch; run one
  cell and check.
- ant-design-vue CI is `unknown` at its pin — rule 6 does not apply there.
- nuxt-ui local install issue unchanged (pnpm store shim; CI-clean-store fix
  unverified). Its bundle cells error heavily (alias-only imports) — review
  with the no-CI-evidence caution.
- Consider committing: NOTHING is committed and the working tree now carries
  two agent-sessions' worth of work. Ask the user before any git action.

## Do not regress (each fixed a published-wrong-answer bug)

Everything in the old handoff's list, plus today's: the `-!` prefix family in
webpackExternals; census keys normalised (case/separators/percent-encoding) AND
externals never counted as compiled; the peer anchor clamped to the corpus and
never set by a leaking cell; `files: []` is NOT "no files key"; the no-lockfile
gate lives at the run-surface choke point so no orchestrator can forget it;
closure files exist for the COMPILER and must stay external to the graph.

## Environment warnings (unchanged, they still cost hours)

- Windows + Git Bash: heredocs and `node -e` mangle backslash escapes — use the
  Write tool for anything with regex escapes. `/**/` inside a JS block comment
  terminates it (bit us in a docblock TODAY).
- **`import`ing `scripts/bench-real-world.mjs` RUNS it** — check with `--help`.
- Long runs: `run_in_background`; liveness via `Get-CimInstance Win32_Process`.
- **Never edit modules a running sweep's children will import** — batch fixes
  until the sweep exits.
- The orchestrator has a 45-min per-surface budget (`SURFACE_TIMEOUT_MS`);
  a cell that hits it is recorded in `surfaceFailures[]`, the sweep continues.

## Git rules (the user's, absolute)

- **NEVER PUSH. EVER.** Not for CI fixes, not when a remote run is broken, not
  for anything. Commit locally when asked, then say the commit is ready to
  push. The user pushes.

## Verification checklist before you claim anything works

1. `node tests/harness/run.mjs` → 715+ pass, 0 fail.
2. The specific surface actually ran and produced rows — not "no output".
3. For any ❌: tool, or harness? Check upstream CI at the pinned commit. Green
   upstream ⇒ yours.
4. Never report a number you have not seen produced.
