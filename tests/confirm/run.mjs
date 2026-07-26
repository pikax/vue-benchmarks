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
import { runCompileSuite } from "./suites/compile.mjs";
import { runJsxCompileConfirmSuite } from "./suites/jsx-compile.mjs";
import { runLintSuite } from "./suites/lint.mjs";
import { runTypecheckSuite } from "./suites/typecheck.mjs";
import { runComponentMetaSuite } from "./suites/component-meta.mjs";

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
    surfaces: "compile,jsx-compile,lint,typecheck,component-meta",
    json: "",
    out: "",
    strict: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--surfaces") args.surfaces = argv[++i];
    else if (a === "--json") args.json = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--strict") args.strict = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function help() {
  console.log(`Confirmation suite (correctness, not performance)

Usage:
  node tests/confirm/run.mjs [--surfaces compile,jsx-compile,lint,typecheck,component-meta]
                             [--json path] [--out path.md] [--strict]

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
    console.log("→ typecheck");
    all.push(...(await runTypecheckSuite()));
  }
  if (surfaces.includes("component-meta") || surfaces.includes("meta")) {
    console.log("→ component-meta");
    all.push(...(await runComponentMetaSuite()));
  }

  console.log("");
  printConsole(all);

  const report = formatReport(all);
  const summary = summarize(all);

  const outMd = args.out || join(rootDir, "results", "confirm.md");
  const outJson = args.json || join(rootDir, "results", "confirm.json");

  mkdirSync(dirname(outMd), { recursive: true });
  writeFileSync(outMd, report, "utf8");
  writeFileSync(
    outJson,
    JSON.stringify(
      {
        kind: "confirmation",
        generatedAt: new Date().toISOString(),
        summary,
        results: all,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`\nWrote ${outMd}`);
  console.log(`Wrote ${outJson}`);

  process.exit(reportKnownFailures(all, { strict: args.strict }));
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
