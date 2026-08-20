#!/usr/bin/env node
/**
 * Correctness confirmation suite — distinct from performance benchmarks.
 *
 * Surfaces:
 *   compile         — SFC compilers → @vue/test-utils mount/assert
 *   jsx-compile     — vue-jsx-vapor / babel JSX transform shape checks
 *   lint            — planted issues + clean files, expected counts
 *   typecheck       — clean projects + diagnostic plants
 *   component-meta  — props/events/slots/expose extraction correctness
 *   lsp             — hover / definition / publishDiagnostics plants
 *   format          — formatters keep SFCs parseable, idempotent, tokens intact
 *
 * Usage:
 *   node tests/confirm/run.mjs
 *   node tests/confirm/run.mjs --surfaces compile,lint
 *   node tests/confirm/run.mjs --json results/confirm.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatReport, printConsole, summarize } from "./lib/harness.mjs";
import { acquireRunLock, lockConflictMessage } from "./lib/run-lock.mjs";
import { collectRunner } from "./lib/typecheck-doc.mjs";
import { runCompileSuite } from "./suites/compile.mjs";
import { runJsxCompileConfirmSuite } from "./suites/jsx-compile.mjs";
import { runLintSuite } from "./suites/lint.mjs";
import { runTypecheckSuite } from "./suites/typecheck.mjs";
import { runComponentMetaSuite } from "./suites/component-meta.mjs";
import { runLspConfirmSuite } from "./suites/lsp.mjs";
import { runFormatSuite } from "./suites/format.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** `suite/caseId/tool` key for allowlist lookups. */
function resultKey(r) {
  return `${r.suite}/${r.caseId}/${r.tool}`;
}

function loadKnownFailures() {
  const path = join(dirname(fileURLToPath(import.meta.url)), "known-failures.json");
  if (!existsSync(path)) return {};
  const raw = JSON.parse(readFileSync(path, "utf8"));
  // Drop the embedded "$comment" documentation block.
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("$")));
}

/**
 * Decide the exit code, accounting for known-failing upstream bugs.
 *
 * The suite found 18 genuine tool bugs, so a plain `fail > 0 ? 1 : 0` left the
 * PR gate permanently red — which trains everyone to ignore it and destroys
 * the signal the suite exists to provide. Suppressing them wholesale would
 * throw that signal away just as effectively.
 *
 * So: a listed failure is expected and does not fail the build. An UNLISTED
 * failure does — that is a new regression. And a listed entry that starts
 * PASSING also fails the build, so a fixed tool cannot leave a stale
 * suppression sitting there quietly hiding a future regression.
 */
function reportKnownFailures(results, { strict = false } = {}) {
  const known = loadKnownFailures();
  const failures = results.filter((r) => /fail/i.test(r.status ?? ""));

  const unexpected = failures.filter((r) => !(resultKey(r) in known));
  const expected = failures.filter((r) => resultKey(r) in known);

  const passingKeys = new Set(
    results.filter((r) => /pass/i.test(r.status ?? "")).map(resultKey),
  );
  const fixed = Object.keys(known).filter((k) => passingKeys.has(k));

  const warnings = results.filter((r) => /warn/i.test(r.status ?? ""));
  if (warnings.length) {
    console.log(`Disclosed extra-harness behaviour (warn, not a pass): ${warnings.length}`);
    for (const r of warnings) console.log(`  · ${resultKey(r)} — ${r.message ?? "warned"}`);
    console.log("");
  }

  console.log("");
  if (expected.length) {
    console.log(`Known upstream failures (allowed): ${expected.length}`);
    for (const r of expected) console.log(`  · ${resultKey(r)} — ${known[resultKey(r)]}`);
  }

  if (fixed.length) {
    console.log(`\n✗ ${fixed.length} known-failure entr${fixed.length === 1 ? "y is" : "ies are"} now PASSING — remove from tests/confirm/known-failures.json:`);
    for (const k of fixed) console.log(`  · ${k}`);
  }

  if (unexpected.length) {
    console.log(`\n✗ ${unexpected.length} UNEXPECTED failure(s) — these are regressions:`);
    for (const r of unexpected) {
      console.log(`  · ${resultKey(r)} — ${r.message ?? "failed"}`);
    }
  }

  if (strict && expected.length) {
    console.log(`\n--strict: treating ${expected.length} known failure(s) as fatal.`);
    return 1;
  }

  if (unexpected.length || fixed.length) return 1;
  console.log(
    unexpected.length === 0 && expected.length
      ? "\n✓ No regressions (all failures are known and documented)."
      : "\n✓ No failures.",
  );
  return 0;
}

function parseArgs(argv) {
  const args = {
    surfaces: "compile,jsx-compile,lint,typecheck,component-meta,format,lsp",
    json: "",
    out: "",
    strict: false,
    help: false,
    runs: process.env.BENCH_RUNS || "",
    warmups: process.env.BENCH_WARMUPS || "",
    allPlants: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--surfaces") args.surfaces = argv[++i];
    else if (a === "--json") args.json = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--strict") args.strict = true;
    else if (a === "--runs") args.runs = argv[++i];
    else if (a === "--warmups") args.warmups = argv[++i];
    else if (a === "--all" || a === "--all-plants") args.allPlants = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function help() {
  console.log(`Confirmation suite (correctness, not performance)

Usage:
  node tests/confirm/run.mjs [--surfaces compile,jsx-compile,lint,typecheck,component-meta,format,lsp]
                             [--json path] [--out path.md] [--strict]
                             [--runs N] [--warmups N] [--all]

  --runs / --warmups  apply to the all-plants typecheck (one tsconfig).
                      Default: BENCH_RUNS / BENCH_WARMUPS, else 5 / 1
                      (same as the Benchmark workflow).
  --all               typecheck: one spawn per tool over every plant (CI).
                      Skip the per-case spawn loop. Plant ✓/✗ come from the
                      combined dump. Local pnpm confirm:typecheck without
                      --all still runs each plant on its own.

Exit code:
  0  no unexpected failures (skips allowed; known upstream bugs allowed)
  1  a failure NOT in tests/confirm/known-failures.json (a regression),
     OR a listed known-failure that now PASSES (stale entry — delete it)
  2  the suite itself crashed

--strict  also fail on known upstream bugs. Use to see the raw picture.
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    help();
    process.exit(0);
  }

  const surfaces = args.surfaces
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  /** @type {import('./lib/harness.mjs').createSuite extends Function ? any : never[]} */
  const all = [];

  // Suites rebuild fixed scratch trees under work/ (rmSync + recopy), so a
  // second concurrent run corrupts the first's scoring instead of crashing it.
  // Fail fast; `exit` also fires on process.exit() so the lock always clears.
  const lockPath = join(rootDir, "work", "confirm.lock");
  const lock = acquireRunLock(lockPath);
  if (!lock.ok) {
    console.error(lockConflictMessage(lockPath, lock.holder));
    process.exit(2);
  }
  process.on("exit", lock.release);

  console.log("Confirmation suite — correctness checks (not benchmarks)\n");

  if (surfaces.includes("compile")) {
    console.log("→ compile");
    all.push(...(await runCompileSuite()));
  }
  if (surfaces.includes("jsx-compile") || surfaces.includes("jsx")) {
    console.log("→ jsx-compile");
    all.push(...(await runJsxCompileConfirmSuite()));
  }
  if (surfaces.includes("lint")) {
    console.log("→ lint");
    all.push(...(await runLintSuite()));
  }
  if (surfaces.includes("typecheck")) {
    console.log(args.allPlants ? "→ typecheck (all plants, one tsconfig)" : "→ typecheck");
    all.push(
      ...(await runTypecheckSuite({
        runs: args.runs,
        warmups: args.warmups,
        allPlantsOnly: args.allPlants,
      })),
    );
  }
  if (surfaces.includes("component-meta") || surfaces.includes("meta")) {
    console.log("→ component-meta");
    all.push(...(await runComponentMetaSuite()));
  }
  if (surfaces.includes("lsp")) {
    console.log("→ lsp");
    all.push(...(await runLspConfirmSuite()));
  }
  if (surfaces.includes("format")) {
    console.log("→ format");
    all.push(...(await runFormatSuite()));
  }

  console.log("");
  printConsole(all);

  const report = formatReport(all);
  const summary = summarize(all);

  const outMd = args.out || join(rootDir, "results", "confirm.md");
  const outJson = args.json || join(rootDir, "results", "confirm.json");

  const generatedAt = new Date().toISOString();
  const runner = collectRunner();

  mkdirSync(dirname(outMd), { recursive: true });
  writeFileSync(outMd, report, "utf8");
  writeFileSync(
    outJson,
    JSON.stringify(
      {
        kind: "confirmation",
        generatedAt,
        runner,
        summary,
        results: all,
      },
      null,
      2,
    ),
    "utf8",
  );

  const typecheckRows = all.filter((r) => r.suite === "typecheck" || r.suite === "typecheck-all");
  if (typecheckRows.length) {
    // The full plant matrix embeds into docs/typecheck.md when `pnpm docs`
    // renders from this run's confirm.json — this runner only writes results.
    console.log("Typecheck plant matrix: run `pnpm docs` to embed it in docs/typecheck.md");
  }

  console.log(`\nWrote ${outMd}`);
  console.log(`Wrote ${outJson}`);

  // --all scores plants from the combined dump for docs/typecheck.md. Those
  // rows are not the per-case spawn gate (fallthrough retries, extra tsconfig).
  // CI therefore gates typecheck on the typecheck-all row only.
  process.exit(reportKnownFailures(all, { strict: args.strict }));
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
