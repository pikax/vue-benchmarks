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
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatReport, printConsole, summarize } from "./lib/harness.mjs";
import { runCompileSuite } from "./suites/compile.mjs";
import { runJsxCompileConfirmSuite } from "./suites/jsx-compile.mjs";
import { runLintSuite } from "./suites/lint.mjs";
import { runTypecheckSuite } from "./suites/typecheck.mjs";
import { runComponentMetaSuite } from "./suites/component-meta.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function parseArgs(argv) {
  const args = {
    surfaces: "compile,jsx-compile,lint,typecheck,component-meta",
    json: "",
    out: "",
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--surfaces") args.surfaces = argv[++i];
    else if (a === "--json") args.json = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function help() {
  console.log(`Confirmation suite (correctness, not performance)

Usage:
  node tests/confirm/run.mjs [--surfaces compile,jsx-compile,lint,typecheck,component-meta]
                             [--json path] [--out path.md]

Exit code: 0 if no failures (skips allowed); 1 if any FAIL.
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

  process.exit(summary.fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
