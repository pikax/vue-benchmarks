#!/usr/bin/env node
/**
 * Runner for the harness self-test suite.
 *
 * The suite tests the benchmark machinery itself — measurement protocol,
 * ranking/report rendering, the planted-bug work gate, corpus preparation and
 * module wiring. It never runs a real benchmark and never spawns a real
 * compiler, so it finishes in seconds.
 *
 *   node tests/harness/run.mjs                 # all suites
 *   node tests/harness/run.mjs --test-name-pattern gate
 *
 * Test files are passed to `node --test` explicitly rather than as a directory:
 * directory recursion is not supported on every Node 22+ build, an explicit
 * file list is.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function testFiles() {
  return readdirSync(here)
    .filter((name) => name.endsWith(".test.mjs"))
    .sort()
    .map((name) => join(here, name));
}

function main() {
  const files = testFiles();
  if (files.length === 0) {
    console.error(`No *.test.mjs files found in ${here}`);
    process.exit(1);
  }

  const result = spawnSync(process.execPath, ["--test", ...process.argv.slice(2), ...files], {
    cwd: join(here, "..", ".."),
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

// `node --test tests/harness/` may load this file as a candidate test file.
// Only spawn when executed directly, otherwise the run would recurse forever.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
