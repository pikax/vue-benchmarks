/**
 * Project-typecheck surface — typecheck a real project with its OWN tsconfig.
 *
 * ## Why the project's own tsconfig is the whole point
 *
 * `typecheck` on a *lifted* corpus is deliberately not offered (see
 * `bench-real-world.mjs`), because a corpus pulled out of a monorepo resolves
 * none of its imports: `~/composables/x` and `@hoppscotch/data` are meaningless
 * outside the project's alias configuration. A checker pointed at that reports
 * thousands of TS2307s, or — worse, if the tsconfig is wrong the other way —
 * **zero diagnostics very quickly**, which in a table is indistinguishable from a
 * fast, correct checker.
 *
 * Running in place fixes that: the project's own `tsconfig.json`, its own paths,
 * its own installed `node_modules`. What is measured is therefore a real
 * typecheck of real code, which is the only version of this surface worth
 * publishing.
 *
 * ## Rows: the Vue layer, and the engine underneath it
 *
 * - **vue-tsc (JS)** — the official CLI on the stock JavaScript TypeScript
 *   compiler. This is the **baseline**.
 * - **vue-tsc (native)** — the *same* vue-tsc with `typescript` aliased to
 *   typescript-native-bridge, so the checker is Microsoft's Go compiler (tsgo)
 *   in-process. Same Vue layer, different engine.
 * - **verter-tsc** — Verter's checker on stable tsgo.
 * - **Vize** — `vize check` (native, Corsa when available).
 *
 * The JS/native pair exists so a reader can separate two effects that a single
 * number conflates. A gap between `vue-tsc (JS)` and any native checker is
 * mostly **TypeScript's own Go rewrite**, not the Vue tooling on top of it; the
 * gap between `vue-tsc (native)` and another native checker is the Vue layer.
 * This is the same discipline the generated-corpus typecheck surface applies, and
 * the reason the engine is a labelled row property rather than a hidden variable.
 *
 * TNB must print its activation banner or the row is unranked: a bridge that
 * quietly fell back to the JavaScript checker would still be labelled "native"
 * while running JS, which is exactly the mislabel the gates exist to catch.
 *
 * ## Diagnostics are a census, not a pass/fail
 *
 * Real projects are not clean. Several of these have pre-existing type errors at
 * their pinned release, and a checker is not wrong for reporting them — so a
 * non-zero exit is expected and allowed for every row equally.
 *
 * What IS gated is doing less work: a checker reporting far fewer diagnostics
 * than the baseline may be skipping files, failing to resolve the project, or
 * template-checking nothing. Fewer diagnostics finishes sooner, and rewarding
 * that would invert the measurement. Diagnostic counts are printed on every row
 * so the reader can see the difference rather than infer it.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { measureVariants, pathWithNodeBins, resolveBin } from "../timing.mjs";
import { measureCli } from "../measure-cli.mjs";
import { resolveTnbVueTsc, tnbActive } from "../tnb.mjs";
import { stripAnsi } from "../real-world/ansi.mjs";
import { discoverTypecheckTargets } from "../real-world/test-targets.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

/**
 * Diagnostic-line shapes emitted by the checkers on this surface.
 *
 * Every checker here is counted with the SAME list, because a per-tool parser is
 * how one tool's formatting ends up flattering it. The list exists because the
 * shapes genuinely differ:
 *
 *   vue-tsc / verter-tsc / tsgo     src/A.vue(83,7): error TS2322: Type 'string'…
 *   the same, pretty/colour layout  src/A.vue:83:7 - error TS2322: Type 'string'…
 *   vize check                      <underlined absolute path>
 *                                     error:1:14 [TS2322] Type 'string'…
 *
 * Vize is the reason both halves of this matter. It never writes the literal
 * `error TS1234` — the code is bracketed, `[TS2322]` — so an `/error TS\d+/`
 * counter scored it ZERO on output where it had just reported three real
 * diagnostics; and it prints the filename once as a heading with the diagnostics
 * indented beneath, so a per-line "which file" regex sees no file at all. A zero
 * on either count is not harmless here: the diagnostic-census gate unranks a row
 * reporting far fewer than the baseline, and `actuallyChecked` unranks a row that
 * cannot show diagnostics across two files. Mis-parsing Vize's output would have
 * bracketed Vize for the harness's inability to read it.
 */
const DIAGNOSTIC_SHAPES = [
  // tsc plain: `file(line,col): error TSxxxx` — the file is on the line.
  { re: /^(\S.*?)\((\d+),(\d+)\):\s*(?:error|warning)\b/i, file: 1 },
  // tsc pretty: `file:line:col - error TSxxxx` — the file is on the line.
  { re: /^(\S.*?):(\d+):(\d+)\s+-\s+(?:error|warning)\b/i, file: 1 },
  // vize: severity first, indented under a filename heading line. The file comes
  // from the most recent heading, not from this line.
  { re: /^\s*(?:error|warning):\d+:\d+/i, file: null },
];

/** A bare path on its own line — how vize introduces a file's diagnostics. */
const FILE_HEADING_RE = /^\s*(\S.*\.(?:vue|m?[cj]?tsx?|d\.ts|jsx?))\s*$/i;

/**
 * Count diagnostics AND the distinct files they were reported against, in one
 * pass over the output.
 *
 * The file count is what separates "typechecked the project and found problems"
 * from "aborted while constructing the program". A fatal parse error in a single
 * file stops TypeScript before it checks anything, and the result is one
 * diagnostic delivered quickly — which on a wall-clock table is
 * indistinguishable from a fast, thorough checker.
 *
 * Not hypothetical: Hoppscotch's `hoppscotch-common` ships a committed
 * `src/types/post-request.d.ts` with a syntax error at line 1294, and vue-tsc
 * reports exactly that one TS1128 after ~4.3 s having checked none of the 293
 * SFCs. Without this signal that row looked like the fastest honest checker in the
 * table, and the diagnostic gate — anchored on it as the baseline — flagged the
 * checkers that *did* complete as the anomalies.
 *
 * Counted per LINE, at most once per line, so a multi-line diagnostic (TypeScript
 * indents the continuation of a nested-type mismatch) is worth exactly one.
 */
export function diagnosticCensus(output) {
  const text = stripAnsi(output);
  const files = new Set();
  let count = 0;
  let heading = null;

  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/, "");
    let matched = false;
    for (const shape of DIAGNOSTIC_SHAPES) {
      const m = line.match(shape.re);
      if (!m) continue;
      count++;
      const file = shape.file !== null ? m[shape.file].trim() : heading;
      if (file) files.add(file);
      matched = true;
      break;
    }
    if (matched) continue;
    // Not a diagnostic: it may be the heading the next ones belong to.
    const h = line.match(FILE_HEADING_RE);
    if (h) heading = h[1].trim();
  }

  // Summary fallback, for a checker that reports only a total. Both shapes seen
  // here: tsc's `Found 3 errors.` and vize's `3 error(s)`.
  if (count === 0) {
    const summary =
      text.match(/Found (\d+) errors?/i)?.[1] ?? text.match(/^\s*(\d+) error\(s\)/im)?.[1];
    if (summary) count = Number(summary);
  }

  return { count, files: files.size };
}

function countDiagnostics(output) {
  return diagnosticCensus(output).count;
}

function distinctDiagnosticFiles(output) {
  return diagnosticCensus(output).files;
}

/**
 * Did this invocation actually typecheck the project?
 *
 * Either it completed cleanly (exit 0), or it produced diagnostics spanning more
 * than one file — which a program that never got built cannot do. One diagnostic
 * in one file with a non-zero exit is program construction failing, not a result.
 *
 * Applied to the untimed baseline pre-flight AND to every measured run of every
 * row, including the baseline's. It was previously defined, documented and then
 * used only in the pre-flight: a challenger whose measured runs aborted during
 * program construction published a fast, ranked row, gated on a diagnostic
 * census it satisfied by reporting the single diagnostic that stopped it.
 */
export function actuallyChecked({ status, output }) {
  if (status === 0) return true;
  return distinctDiagnosticFiles(output) >= 2;
}

async function runChecker({ bin, args, cwd, timeoutMs, env = {}, shell = false }) {
  const result = await measureCli({
    bin,
    args,
    cwd,
    timeoutMs,
    shell,
    env: {
      CI: "1",
      NO_COLOR: "1",
      FORCE_COLOR: "0",
      PATH: pathWithNodeBins(cwd),
      ...env,
    },
  });
  const output = result.combined ?? `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const census = diagnosticCensus(output);
  const timedOut = Boolean(result.error && /timeout/i.test(result.error.message));
  return {
    ms: result.ms,
    output,
    status: result.status,
    timedOut,
    spawnError: result.error && !timedOut ? result.error.message : null,
    diagnostics: census.count,
    diagnosticFiles: census.files,
    rssBytes: result.rssBytes,
  };
}

/**
 * The per-run metadata every measured row returns.
 *
 * One helper rather than four copies: the `checked` flag is what the work gate
 * runs on, and a row that forgot to report it would be ranked ungated — which is
 * exactly the defect this replaced.
 */
function checkerMeta(r) {
  return {
    artifact: r.diagnostics,
    diagnostics: r.diagnostics,
    diagnosticFiles: r.diagnosticFiles,
    exit: r.status,
    checked: actuallyChecked(r),
    rssBytes: r.rssBytes,
  };
}

const isWinShell = (bin) => process.platform === "win32" && Boolean(bin) && bin.endsWith(".cmd");

/**
 * The --ignoreDeprecations value the TS5101/TS5107 retry passes.
 *
 * Phase-specific, and a wrong value is accepted SILENTLY: on this harness's
 * TypeScript 6.0.x the options still emitting TS5101/TS5107 (baseUrl,
 * moduleResolution node10, target ES5, …) are 6.0-phase deprecations, and
 * tsc's checkDeprecations silences them only for "6.0" — "5.0" parses fine
 * and does nothing (verified live 2026-07-31: no flag → TS5101 exit 2;
 * "5.0" → identical; "6.0" → exit 0). The no-op value shipped once: every
 * retry still failed and whole targets were deleted again, exactly the
 * failure the retry exists to prevent. The guard test runs the INSTALLED
 * tsc against a real TS5101 tsconfig, so a TypeScript bump that moves the
 * accepted phase fails the suite instead of silently deleting targets.
 */
export const IGNORE_DEPRECATIONS_VALUE = "6.0";

/**
 * CLI args for one tsc-shaped row.
 *
 * One builder rather than four inline copies, because the flag placement is
 * load-bearing in both directions. `acceptsIgnoreDeprecations: false` is
 * verter-tsc's: its clap CLI hard-rejects flags it does not know
 * (`--ignoreDeprecations` → `error: unexpected argument`, exit 2, verified
 * live 2026-07-31), so the retry flag riding on shared args would fail every
 * verter-tsc measured run in milliseconds on a retry-target and publish a
 * harness fault as a tool failure. verter-tsc therefore runs WITHOUT the
 * flag; the methodology and its row notes disclose the asymmetry.
 */
export function tscRowArgs(
  tsconfig,
  { ignoreDeprecations = false, acceptsIgnoreDeprecations = true } = {},
) {
  return [
    "--noEmit",
    "-p",
    tsconfig,
    ...(ignoreDeprecations && acceptsIgnoreDeprecations
      ? ["--ignoreDeprecations", IGNORE_DEPRECATIONS_VALUE]
      : []),
  ];
}

/**
 * Every post-measurement gate on this surface, in order, mutating rows in place.
 *
 * Exported and pure so it can be tested against synthetic rows. These gates decide
 * whether a number is published as a ranked result, and their failure modes are the
 * silent kind: a row that should have been bracketed rendering as the fastest
 * checker in the table.
 *
 * @param {Array<object>} results rows from `measureVariants`
 */
export function applyTypecheckGates(results) {
  // 1. Program-construction gate, applied to EVERY measured row including the
  // baseline's. A run that aborted while building the program reports one
  // diagnostic in one file, very fast — see `actuallyChecked`. The untimed
  // pre-flight catches a TARGET the baseline cannot check; only this catches a
  // MEASURED RUN that did not check.
  for (const row of results) {
    if (row.status !== "ok") continue;
    const samples = row.metaSamples ?? [];
    if (samples.length === 0) continue;
    // `every`, not `some`: one run that happened to construct a program does not
    // make the rest of the series a typecheck.
    if (samples.every((m) => m.checked)) continue;
    const worst = samples.find((m) => !m.checked) ?? {};
    row.status = "unranked";
    row.notes = `${row.notes} | ⚠ FAILED PROGRAM-CONSTRUCTION GATE — at least one measured run exited ${worst.exit} reporting ${worst.diagnostics ?? "?"} diagnostic(s) across ${worst.diagnosticFiles ?? "?"} file(s). A checker that aborts while building the program returns quickly without checking anything, which on a wall-clock table is indistinguishable from a fast, thorough checker. Measured but UNRANKED.`;
  }

  // 2. TNB activation gate: a "native" row that ran the JavaScript checker is
  // mislabelled, and a mislabelled engine is worse than a missing row.
  for (const row of results) {
    if (row.id !== "vue-tsc-native" || row.status !== "ok") continue;
    // `every`, not `some`. With `some`, a five-run series in which the bridge
    // loaded once and silently fell back to the JavaScript checker four times
    // passed the gate and was published as a native-engine result — the exact
    // mislabel the gate exists to prevent.
    const samples = row.metaSamples ?? [];
    const active = samples.length > 0 && samples.every((m) => m.tnbActive);
    if (!active) {
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ FAILED TNB ACTIVATION GATE — the bridge did not print its activation banner on every measured run, so this row cannot be shown as running the native engine throughout. Measured but UNRANKED rather than published under a label it may not have earned.`;
    }
  }

  // 3. Diagnostic-count census, against the BASELINE (vue-tsc on the JS engine),
  // which is the reference every other row is read against.
  const baseline = results.find((r) => r.id === "vue-tsc-js");
  const baselineDiags = baseline?.artifactMedian ?? null;
  const baselineExits = baseline?.metaSamples?.map((m) => m.exit) ?? [];
  const baselineClean =
    baselineDiags === 0 && baselineExits.length > 0 && baselineExits.every((e) => e === 0);
  for (const row of results) {
    if (row.id === "vue-tsc-js" || row.status === "skipped" || row.status === "error") continue;
    const diags = row.artifactMedian ?? null;
    const exits = row.metaSamples?.map((m) => m.exit) ?? [];
    // A baseline the gates above bracketed cannot anchor a census: its own
    // diagnostic count came from a series that did not reliably typecheck the
    // project, and comparing against it would unrank the checkers that DID.
    if (baseline && baseline.status !== "ok") {
      row.notes = `${row.notes} | ⓘ DIAGNOSTIC-CENSUS GATE NOT RUN — the baseline row is itself ${baseline.status}, so its diagnostic count is not a reference this row can be measured against. Ranked, but unverified rather than verified-equal, and a "vs fastest" in this table does not mean "faster than the reference checker".`;
      continue;
    }
    if (baselineDiags === null || diags === null) {
      row.notes = `${row.notes} | ⓘ DIAGNOSTIC-CENSUS GATE NOT RUN — ${
        baselineDiags === null
          ? "the baseline produced no diagnostic census to anchor against"
          : "this row produced no diagnostic census"
      }, so the amount of checking done was never compared. Ranked, but unverified rather than verified-equal.`;
      continue;
    }
    if (baselineDiags === 0) {
      // A clean baseline is the case the ratio test cannot express: `diags <
      // baselineDiags * 0.5` is `< 0` when the baseline is 0, so the gate could
      // never fire and every row passed by default — on the one corpus state where
      // "reported nothing" is easiest to achieve by not checking. The equivalent
      // question when there is nothing to find is whether the row AGREED there was
      // nothing: a checker that reports no diagnostics and still exits non-zero did
      // not clear the project, it failed to check it.
      if (!baselineClean) {
        row.notes = `${row.notes} | ⓘ DIAGNOSTIC-CENSUS GATE NOT RUN — the baseline reported 0 diagnostics but did not exit 0 on every run, so it is not a usable clean reference. Ranked, but unverified rather than verified-equal.`;
        continue;
      }
      if (exits.length > 0 && exits.some((e) => e !== 0)) {
        row.status = "unranked";
        // Two distinct failures share this branch and the note must not describe
        // one as the other: verter-tsc once carried "reporting nothing while
        // failing" beside its own printed count of 1250.
        row.notes = `${row.notes} | ⚠ FAILED DIAGNOSTIC-CENSUS GATE — the baseline reported 0 diagnostics and exited 0, so a checker that agrees must also exit 0; this row exited ${exits.find((e) => e !== 0)} ${
          diags === 0
            ? "while reporting nothing — reporting nothing while failing is not a clean pass"
            : `while reporting ${diags} diagnostic(s) against a clean reference — a non-zero exit here is a failed check of the project, not a stricter one`
        }. Measured but UNRANKED.`;
      }
      continue;
    }
    if (diags < baselineDiags * 0.5) {
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ FAILED DIAGNOSTIC-CENSUS GATE — reported ${diags} diagnostics against the baseline's ${baselineDiags} (under half). A checker reporting far fewer may be skipping files, failing to resolve the project, or not checking templates; that finishes sooner, and it is not a speed result. Measured but UNRANKED.`;
    } else if (diags > baselineDiags * 2) {
      // Not a failure — stricter is legitimate — but a large divergence is a fact
      // the reader needs, because it means the rows are not answering the same
      // question about this codebase.
      row.notes = `${row.notes} | ⓘ reported ${diags} diagnostics against the baseline's ${baselineDiags}. Diagnostic equivalence is NOT asserted by this surface; a checker may legitimately be stricter. Read the counts, not just the times.`;
    }
  }
  return results;
}

/**
 * @param {import("../real-world/corpus.mjs").ResolvedCorpus} resolved
 */
export async function runProjectTypecheckSurface(resolved, options) {
  const base = {
    id: "project-typecheck",
    label: `Project typecheck (own tsconfig) — ${resolved.selector}`,
    files: resolved.files.length,
    bytes: resolved.bytes,
  };

  if (!resolved.installed) {
    return {
      ...base,
      variants: [],
      methodology: [
        `Skipped: ${resolved.project.id} has no node_modules. A typecheck without the project's dependencies resolves nothing and reports zero diagnostics quickly, which is indistinguishable in a table from a fast correct checker — so it is not run. Fix with: pnpm fetch:real-world --projects ${resolved.project.id}`,
      ],
    };
  }

  const candidates = discoverTypecheckTargets(resolved.dir);
  if (candidates.length === 0) {
    return {
      ...base,
      variants: [],
      methodology: [
        `No typecheck target in ${resolved.project.id} at ${resolved.project.ref}: a target needs its own tsconfig.json and SFCs beneath it.`,
      ],
    };
  }

  const timeoutMs = Math.max(180_000, (options.typecheckTimeoutMs ?? 0) || 900_000);
  const vueTsc = tryResolveBin("vue-tsc");

  // Baseline pre-flight, untimed. The BASELINE has to demonstrate it actually
  // typechecked the project before anything is ranked against it — see
  // `actuallyChecked`. Anchoring a diagnostic census on a checker that aborted
  // during program construction inverts the gate: it marks the checkers that
  // completed as the outliers.
  let target = null;
  let ignoreDeprecations = false;
  const rejectedTargets = [];
  if (vueTsc) {
    for (const candidate of candidates) {
      let probe = await runChecker({
        bin: vueTsc,
        args: ["--noEmit", "-p", candidate.tsconfig],
        cwd: candidate.dir,
        timeoutMs,
        shell: isWinShell(vueTsc),
      });
      if (!probe.timedOut && !probe.spawnError && actuallyChecked(probe)) {
        target = candidate;
        break;
      }
      // TS5101/TS5107 mean the PROJECT's tsconfig sets options that the
      // harness's newer TypeScript deprecates — an artifact of running this
      // harness's engine against a project pinned to an older one, not a fact
      // about the project or any checker. Whole targets (ant-design-vue,
      // hoppscotch) were silently deleted by these exits (2026-07-30 audit,
      // finding 17). Retry once with --ignoreDeprecations (value in
      // IGNORE_DEPRECATIONS_VALUE — phase-specific, and the wrong phase is a
      // silent no-op); if the retry genuinely typechecks, the flag rides on
      // the vue-tsc rows alike (NOT verter-tsc, whose CLI rejects it — see
      // tscRowArgs) and both the rows and the methodology say so.
      let retried = false;
      if (!probe.timedOut && !probe.spawnError && /error TS510[17]\b/.test(stripAnsi(probe.output))) {
        retried = true;
        probe = await runChecker({
          bin: vueTsc,
          args: tscRowArgs(candidate.tsconfig, { ignoreDeprecations: true }),
          cwd: candidate.dir,
          timeoutMs,
          shell: isWinShell(vueTsc),
        });
        if (!probe.timedOut && !probe.spawnError && actuallyChecked(probe)) {
          target = candidate;
          ignoreDeprecations = true;
          break;
        }
      }
      const detail = probe.timedOut
        ? `baseline vue-tsc timed out after ${timeoutMs} ms`
        : probe.spawnError
          ? `baseline vue-tsc could not start: ${probe.spawnError}`
          : `baseline vue-tsc exited ${probe.status} reporting ${probe.diagnostics} diagnostic(s) across ${distinctDiagnosticFiles(probe.output)} file(s)${retried ? ` (retried with --ignoreDeprecations ${IGNORE_DEPRECATIONS_VALUE} after TS5101/TS5107 — still failed)` : ""} — that is program construction failing, not a typecheck. First: ${stripAnsi(probe.output).split("\n").find((l) => /error TS/.test(l))?.trim() ?? "no TS diagnostic"}`;
      rejectedTargets.push({ candidate, detail });
    }
  }

  const rejectedNotes = rejectedTargets.map(
    (r) =>
      `Candidate ${r.candidate.packageName} (${r.candidate.relDir}, ${r.candidate.sfcs} SFCs) was REJECTED before measurement: ${r.detail}. No rows are published for a target the baseline cannot check — a fast abort is indistinguishable from a fast pass on a wall-clock table, and every other row would be gated against it.`,
  );

  if (!target) {
    return {
      ...base,
      variants: [],
      methodology: [
        vueTsc
          ? `No typecheck target in ${resolved.project.id} could be checked by the baseline (vue-tsc) in this environment, so there is no reference to rank against and no rows are published.`
          : "vue-tsc is not installed, so there is no baseline and no rows are published.",
        ...rejectedNotes,
      ],
    };
  }
  const tnb = resolveTnbVueTsc(rootDir);
  const verterTsc = tryResolveBin("verter-tsc");
  const vize = tryResolveBin("vize");

  const variants = [];
  // Args for the vue-tsc rows (both engines). When the preflight needed the
  // TS5101/TS5107 retry, the flag rides on those two rows alike — but NOT on
  // verter-tsc, whose clap CLI hard-rejects unknown flags (exit 2 in
  // milliseconds, which would publish a harness fault as a tool failure; see
  // tscRowArgs), and not on Vize, which parses the tsconfig itself and
  // neither needs nor accepts the flag. The asymmetry is disclosed in the
  // methodology and on the verter-tsc row.
  const tscArgs = tscRowArgs(target.tsconfig, { ignoreDeprecations });
  const verterTscArgs = tscRowArgs(target.tsconfig, {
    ignoreDeprecations,
    acceptsIgnoreDeprecations: false,
  });

  if (vueTsc) {
    variants.push({
      id: "vue-tsc-js",
      // Label is bare `vue-tsc`; the report appends the ENGINE tag from
      // `engine === "tsc-js"`. Spelling "(JS)" into the label as well printed
      // "vue-tsc (JS) (JS)", and — worse — a non-canonical engine string meant
      // `engineTag()` did not fire at all, so the row rendered untagged and read
      // as another native checker.
      label: "vue-tsc",
      package: "vue-tsc",
      engine: "tsc-js",
      engineClass: "js",
      target: "project-typecheck",
      invocation: "cli",
      artifactLabel: "diagnostics",
      // Diagnostics are a census, not production. A checker that finds fewer
      // problems on a dirty project is suspicious (the census gate handles that)
      // but "produced less than the noisiest row" is not a defect, and the
      // renderer's generic low-artifact warning would scold the quietest checker.
      artifactPolarity: "informational",
      notes: `BASELINE · vue-tsc --noEmit -p ${target.tsconfig} · the official Vue Language Tools CLI on the stock JavaScript TypeScript compiler`,
      measure: async () => {
        const r = await runChecker({
          bin: vueTsc,
          args: tscArgs,
          cwd: target.dir,
          timeoutMs,
          shell: isWinShell(vueTsc),
        });
        if (r.spawnError) throw new Error(r.spawnError);
        if (r.timedOut) throw new Error(`vue-tsc timed out after ${timeoutMs} ms`);
        return { ms: r.ms, meta: checkerMeta(r) };
      },
    });
  } else {
    // Skip rows carry the measured rows' classKey fields (`target`,
    // `invocation`) too. A targetless row lands in the renderer's untitled
    // "all" class, which split the engine group into an untitled skip-only
    // table followed by a false "PROJECT-TYPECHECK — ranked alone" heading
    // over the rows that ARE ranked together.
    variants.push({
      id: "vue-tsc-js",
      label: "vue-tsc",
      package: "vue-tsc",
      engine: "tsc-js",
      engineClass: "js",
      target: "project-typecheck",
      invocation: "cli",
      notes: "vue-tsc binary not found",
      skip: true,
    });
  }

  // The engine swap. Same vue-tsc, same Vue layer, tsgo underneath.
  //
  // `resolveTnbVueTsc` returns `entry` — a path to vue-tsc's bin script that must
  // be run with `process.execPath` — not a `bin` shim. Checking the wrong field
  // reported "env not available" while the env was correctly installed, silently
  // dropping the one row that isolates the engine from the Vue layer.
  if (tnb?.entry) {
    variants.push({
      id: "vue-tsc-native",
      label: "vue-tsc (TNB / tsgo)",
      package: "typescript-native-bridge",
      engine: `tsgo ${tnb.tsgoVersion ?? "?"} via TNB ${tnb.tnbVersion ?? "?"}`,
      engineClass: "native",
      target: "project-typecheck",
      invocation: "cli",
      artifactLabel: "diagnostics",
      artifactPolarity: "informational",
      notes: `Same vue-tsc ${tnb.vueTscVersion ?? "?"} with typescript aliased to typescript-native-bridge ${tnb.tnbVersion ?? "?"} (TS API ${tnb.tsApiVersion ?? "?"} on tsgo ${tnb.tsgoVersion ?? "?"}, in-process NAPI/FFI) — exactly one variable against the (JS) row: the TypeScript engine.`,
      measure: async () => {
        const r = await runChecker({
          bin: process.execPath,
          args: [tnb.entry, ...tscArgs],
          cwd: target.dir,
          timeoutMs,
        });
        if (r.spawnError) throw new Error(r.spawnError);
        if (r.timedOut) throw new Error(`vue-tsc (native) timed out after ${timeoutMs} ms`);
        // Unranked unless the bridge announced itself — see the module docblock.
        return { ms: r.ms, meta: { ...checkerMeta(r), tnbActive: tnbActive(r.output) } };
      },
    });
  } else {
    variants.push({
      id: "vue-tsc-native",
      label: "vue-tsc (TNB / tsgo)",
      package: "typescript-native-bridge",
      engineClass: "native",
      // classKey fields — see the vue-tsc-js skip row.
      target: "project-typecheck",
      invocation: "cli",
      notes: `Skipped: ${tnb?.notes ?? "typescript-native-bridge env not resolvable"}`,
      skip: true,
    });
  }

  if (verterTsc) {
    variants.push({
      id: "verter-tsc",
      label: "verter-tsc",
      package: "verter-tsc",
      engine: "tsgo (stable)",
      engineClass: "native",
      target: "project-typecheck",
      invocation: "cli",
      artifactLabel: "diagnostics",
      artifactPolarity: "informational",
      notes: `verter-tsc --noEmit -p ${target.tsconfig}${
        ignoreDeprecations
          ? " · ⚠ runs WITHOUT the --ignoreDeprecations flag the vue-tsc rows carry on this target — verter-tsc's CLI rejects flags it does not know — so it may abort on the deprecated tsconfig options themselves. If it does, the failure on this row is a real verter-tsc limitation on this tsconfig, not a harness artifact."
          : ""
      }`,
      measure: async () => {
        const r = await runChecker({
          bin: verterTsc,
          args: verterTscArgs,
          cwd: target.dir,
          timeoutMs,
          shell: isWinShell(verterTsc),
        });
        if (r.spawnError) throw new Error(r.spawnError);
        if (r.timedOut) throw new Error(`verter-tsc timed out after ${timeoutMs} ms`);
        return { ms: r.ms, meta: checkerMeta(r) };
      },
    });
  } else {
    variants.push({
      id: "verter-tsc",
      label: "verter-tsc",
      package: "verter-tsc",
      engineClass: "native",
      // classKey fields — see the vue-tsc-js skip row.
      target: "project-typecheck",
      invocation: "cli",
      notes: "verter-tsc binary not found",
      skip: true,
    });
  }

  if (vize) {
    // No path PATTERN is passed, deliberately. `vize check` documents that when
    // patterns are omitted it uses the tsconfig's include/exclude/files — which
    // is what `tsc -p` does, and therefore the closest available analogue of the
    // other three rows. The previous `vize check . --tsconfig …` passed `.` as a
    // pattern, so Vize walked the whole package directory instead: a DIFFERENT
    // file set from the one every other row checked, in an unmeasured direction
    // (more files if the tsconfig excludes tests, fewer if it pulls in files
    // outside the package). The remaining difference is stated in the notes.
    const vizeArgs = ["check", "--tsconfig", target.tsconfig];
    variants.push({
      id: "vize-check",
      label: "Vize check",
      package: "vize",
      engine: "tsgo (nightly/Corsa when available)",
      engineClass: "native",
      target: "project-typecheck",
      invocation: "cli",
      artifactLabel: "diagnostics",
      artifactPolarity: "informational",
      notes: `vize check --tsconfig ${target.tsconfig} (no path pattern, so the file set comes from the tsconfig's include/exclude/files — the closest analogue of the -p invocation the other rows use) · ⚠ NOT ASSERTED EQUAL: Vize builds its own virtual project from that tsconfig rather than a TypeScript program, so which files end up checked may still differ; the diagnostic census below is what would expose a materially smaller set.`,
      measure: async () => {
        const r = await runChecker({
          bin: vize,
          args: vizeArgs,
          cwd: target.dir,
          timeoutMs,
          shell: isWinShell(vize),
        });
        if (r.spawnError) throw new Error(r.spawnError);
        if (r.timedOut) throw new Error(`vize check timed out after ${timeoutMs} ms`);
        return { ms: r.ms, meta: checkerMeta(r) };
      },
    });
  } else {
    variants.push({
      id: "vize-check",
      label: "Vize check",
      package: "vize",
      engineClass: "native",
      // classKey fields — see the vue-tsc-js skip row.
      target: "project-typecheck",
      invocation: "cli",
      notes: "vize binary not found",
      skip: true,
    });
  }

  // golar ranks on the generated-corpus typecheck surface but is not wired
  // into this one. Saying so beats silence: its version appears in every
  // report's tool table, and a reader who cannot find its row has no way to
  // tell "excluded for a reason" from "forgotten" (2026-07-30 audit,
  // finding 17). This is the harness's omission, not a verdict about golar.
  variants.push({
    id: "golar-check",
    label: "Golar typecheck",
    package: "golar",
    engineClass: "native",
    // classKey fields — see the vue-tsc-js skip row. Without `target`, this
    // unconditional row split the native group's rendering on EVERY run.
    target: "project-typecheck",
    invocation: "cli",
    notes:
      "⏭ NOT MEASURED — golar is not yet wired into the project-typecheck surface (its own-tsconfig invocation and diagnostic census have not been validated against real projects). A harness omission, not a verdict about golar; it ranks on the generated-corpus typecheck surface.",
    skip: true,
  });

  const results = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: target.sfcs,
  });

  applyTypecheckGates(results);

  // One group per ENGINE CLASS. The JS engine and native tsgo are different
  // comparison classes: a ratio across them measures TypeScript's own Go rewrite
  // at least as much as the Vue layer on top of it, so they are never ranked in
  // one table. This is the same rule the bundle surface applies to bundlers, and
  // it is enforced here — in the surface that knows which row runs what — rather
  // than by widening the shared report's class key, which would re-split
  // unrelated surfaces that deliberately keep their engines in one table.
  const classOf = new Map(variants.map((v) => [v.id, v.engineClass ?? "native"]));
  const groups = [
    {
      id: "engine-js",
      label: "JavaScript TypeScript engine — ranked alone",
      variants: results.filter((r) => classOf.get(r.id) === "js"),
    },
    {
      id: "engine-native",
      label: "Native tsgo engines — ranked together",
      variants: results.filter((r) => classOf.get(r.id) !== "js"),
    },
  ].filter((g) => g.variants.length > 0);

  const p = resolved.project;
  return {
    ...base,
    groups,
    groupingNote:
      "Grouped by **TypeScript engine**, ranked within each group. The JS engine and native tsgo are never ranked against each other: that ratio measures TypeScript's own Go rewrite at least as much as the Vue tooling on top of it. Read WITHIN a group for the Vue layer, and across groups only as context on the rewrite.",
    variants: results,
    methodology: [
      `Target: ${target.packageName} (${target.relDir}) — ${target.sfcs} SFCs, checked with the project's OWN ${target.tsconfig} and its own installed dependencies.`,
      `Corpus pin: ${p.ref} @ ${(resolved.sha ?? "").slice(0, 8)}, ${p.releasedAt ? `released ${p.releasedAt}` : `committed ${p.committedAt}`} (${p.releaseKind}), pinned ${p.pinnedAt}. Pins are updated by hand only.`,
      "The target was pre-flighted: the baseline typechecked it untimed first, and it is measured only because that produced diagnostics across more than one file (or exited clean). A target the baseline merely aborts on publishes no rows at all — a fast abort is indistinguishable from a fast pass on a wall-clock table, and every other row would be gated against it.",
      ...(ignoreDeprecations
        ? [
            `The vue-tsc rows (JS and TNB engines) run with --ignoreDeprecations ${IGNORE_DEPRECATIONS_VALUE}: the project's tsconfig sets options this harness's newer TypeScript deprecates (TS5101/TS5107), which is an engine-version artifact of the harness, not a fact about the project. verter-tsc runs WITHOUT the flag — its CLI rejects flags it does not know outright — so on this target it may abort on the deprecated options themselves; if it does, its row shows that failure, which is a real verter-tsc limitation on this tsconfig rather than a harness artifact. Vize parses the tsconfig itself and needs no flag.`,
          ]
        : []),
      ...rejectedNotes,
      "Every checker gets the same directory, the same tsconfig and the same non-zero-exit policy. Real projects have pre-existing type errors at their pinned release; a checker is not penalised for reporting them, and no row is forgiven a diagnostic another row is failed for.",
      "Rows are grouped and tagged by ENGINE. `vue-tsc` tagged **(JS)** runs the stock JavaScript TypeScript compiler; `vue-tsc (N)` is the SAME vue-tsc with typescript aliased to typescript-native-bridge (tsgo in-process). The pair isolates the engine, so a JS-vs-native gap should be read as TypeScript's own Go rewrite first and the Vue layer second — and because that gap is not a Vue-tooling result, the two engines are ranked in separate tables rather than one.",
      "Program-construction gate: every measured run of every row — the baseline's included — must either exit 0 or report diagnostics spanning at least two files. A checker that aborts while building the program returns one diagnostic very fast without checking anything, and a row that did that on any measured run is UNRANKED.",
      "TNB activation gate: the native row is UNRANKED unless the bridge printed its activation banner on EVERY measured run. A bridge that silently fell back to the JavaScript checker would still be labelled native, which is the mislabel the gates exist to prevent.",
      "Diagnostic-census gate: a checker reporting under half the baseline's diagnostics is UNRANKED — it may be skipping files or not checking templates, and doing less finishes sooner. When the baseline reports ZERO diagnostics and exits clean, the ratio test cannot fire, so the gate instead requires the row to exit 0 as well: reporting nothing while failing is not a clean pass. Reporting materially MORE is annotated, not gated: stricter is legitimate, but the reader needs to know the rows are not answering the same question.",
      "Diagnostic counts are read with one shared set of line patterns covering every output shape on this surface (tsc plain, tsc pretty, and Vize's heading-plus-indented-`error:line:col [TSxxxx]` layout). A per-tool parser is how one tool's formatting ends up flattering it — and under-counting is not neutral here, because the census gate would unrank the tool the harness failed to read.",
      "Vize is invoked with no path pattern so its file set comes from the tsconfig's include/exclude/files, which is the closest analogue of the `-p tsconfig.json` the other three rows use. It still builds its own virtual project rather than a TypeScript program, so identical file sets are NOT asserted; the diagnostic census is what would expose a materially smaller one.",
      "Diagnostic EQUIVALENCE is not asserted. This is a throughput surface with a work census, not a correctness suite; the counts are published so a suspicious row is visible rather than inferred.",
      "Each measured run is a fresh CLI process, so every row pays process startup equally and none inherits another's incremental cache. Tool order is rotated on every warmup and measured run.",
      "The checkout is never written to by this surface — it only reads.",
    ],
  };
}
