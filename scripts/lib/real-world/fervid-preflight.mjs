#!/usr/bin/env node
/**
 * Child-process survival probe for `@fervid/napi`.
 *
 * ## Why this exists
 *
 * fervid is a Rust compiler behind a NAPI binding, and it does not return an
 * error for constructs it has not implemented — it `panic!`s. On Element Plus
 * that is:
 *
 *     thread '<unnamed>' panicked at crates/fervid_codegen/src/components/mod.rs:463:13:
 *     not yet implemented: createSlots is not supported yet
 *
 * A Rust panic on a NAPI worker thread cannot be caught from JavaScript. It
 * aborts the host process. When that host process is the benchmark, one
 * unimplemented feature in one tool destroys the run for **every** tool and
 * **every** project — the observed failure was the full nine-project sweep dying
 * during the first project's compile surface, with the wrapper still reporting
 * exit 0 because the shell saw a detached process finish.
 *
 * No amount of try/catch in the parent fixes that. The only way to bound a
 * process-aborting fault is to put it in a process that is allowed to abort, so
 * this script compiles the whole corpus with fervid in a child. If it comes back
 * non-zero, or on a signal, or not at all, the parent knows fervid cannot be run
 * in-process against this corpus and reports it as a tool finding — which it is —
 * instead of losing the benchmark.
 *
 * ## Contract
 *
 *   argv[2] — path to a JSON file: { files: [{ filename, source }], options }
 *   argv[3] — path to write progress to (the last filename attempted)
 *
 * Exit 0 means every file compiled without aborting. Any other outcome — exit
 * code, signal, or a panic that never returns — is a failure, and the progress
 * file names the input that caused it. The parent quotes that filename, so a
 * panic is attributable to a specific third-party SFC rather than to "fervid".
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

// Only act when executed directly. The harness wiring test imports every module
// under scripts/ to check it loads, and without this guard that import ran the
// probe — which exits the process, failing the whole test file with a bare
// "fervid-preflight: no payload path".
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

const payloadPath = process.argv[2];
const progressPath = process.argv[3];

if (!isMain) {
  // Imported for inspection, not invoked. Do nothing.
} else if (!payloadPath) {
  console.error("fervid-preflight: no payload path");
  process.exit(2);
} else {
  main();
}

function main() {

let fervid;
try {
  fervid = require("@fervid/napi");
} catch (error) {
  // Not installed is not a crash — the parent skips the rows either way, but the
  // two states must be distinguishable.
  console.error(`fervid-preflight: cannot load @fervid/napi: ${error?.message ?? error}`);
  process.exit(3);
}

const payload = JSON.parse(readFileSync(payloadPath, "utf8"));
const { files, options } = payload;

if (typeof fervid.Compiler !== "function") {
  console.error("fervid-preflight: @fervid/napi exports no Compiler");
  process.exit(3);
}

const compiler = new fervid.Compiler(options ?? {});

for (const file of files) {
  // Written BEFORE the call, and flushed synchronously: if the next line aborts
  // the process there is no chance to record anything afterwards, so the file
  // that killed it has to already be on disk.
  if (progressPath) writeFileSync(progressPath, file.filename);
  compiler.compileSync(file.source, file.options ?? {});
}

if (progressPath) writeFileSync(progressPath, "");
process.exit(0);
}
