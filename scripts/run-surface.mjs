#!/usr/bin/env node
/**
 * Run ONE surface against ONE corpus, in this process, and write the result as
 * JSON. Invoked as a child by `bench-real-world.mjs`.
 *
 * ## Why surfaces run in child processes
 *
 * The orchestrator already wraps every surface in try/catch, and that is not
 * enough, because the failures that actually happen here are not exceptions:
 *
 * - **A native panic aborts the process.** `@fervid/napi` answers "not yet
 *   implemented" with a Rust `panic!`, which on a NAPI thread terminates the
 *   host. There is nothing to catch. It killed a nine-project sweep during the
 *   first project's compile surface, and the shell reported exit 0.
 * - **Accumulated native state kills a later, innocent surface.** After compile,
 *   format, lint, bundle and hmr have each built Verter hosts, Vize batches and
 *   Vite dev servers in one long-lived process, `project-test` died silently on
 *   Element Plus — while the same surface, run on its own, completes fine
 *   (baseline 54 s, unplugin-vue 69 s, Verter 40 s). The surface was not at
 *   fault; the process it inherited was.
 *
 * Both classes have the same shape: something unrecoverable happens, and the
 * cost is every result that had not yet been written. Isolation converts that
 * into the loss of exactly one (project, surface) cell, which the parent then
 * reports as a failure with its exit code and output.
 *
 * The fervid child probe stays as it is. It is narrower and cheaper — it keeps
 * fervid from being loaded in-process at all, so the compile surface still
 * produces results for every other compiler on a corpus fervid cannot survive.
 * This isolation is the backstop for everything that probe cannot anticipate.
 *
 * ## Contract
 *
 *   --project <selector>   project or project:corpus
 *   --surface <id>         one surface id
 *   --out <file>           where to write the surface JSON
 *   --runs / --warmups / --file-limit / --work
 *
 * Exit 0 with the file written means success. Any other exit — including a
 * signal or an abort that never reaches the writer — means the parent records a
 * failed cell. The parent must not infer success from exit code alone: a process
 * that aborts after writing a partial file would otherwise look fine, so the file
 * is written atomically (temp + rename) and only at the very end.
 */

import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { appendRunBudgetDisclosures, effectiveWarmups } from "./lib/timing.mjs";
import { applyUnreproducibleGate, provenance, resolveCorpus } from "./lib/real-world/corpus.mjs";
import { runCompileSurface } from "./lib/surfaces/compile.mjs";
import { runFormatSurface } from "./lib/surfaces/format.mjs";
import { runLintSurface } from "./lib/surfaces/lint.mjs";
import { runBundleSurface } from "./lib/surfaces/bundle.mjs";
import { runHmrSurface } from "./lib/surfaces/hmr.mjs";
import { runProjectTestSurface } from "./lib/surfaces/project-test.mjs";
import { runProjectBuildSurface } from "./lib/surfaces/project-build.mjs";
import { runProjectTypecheckSurface } from "./lib/surfaces/project-typecheck.mjs";
import { runProjectComponentMetaSurface } from "./lib/surfaces/project-component-meta.mjs";
import { runProjectLspSurface } from "./lib/surfaces/project-lsp.mjs";
import { copyFixtureSubset } from "./lib/fixtures.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = { runs: 3, warmups: 1, fileLimit: Infinity, work: "work-real" };
  for (let i = 0; i < argv.length; i++) {
    const next = () => argv[++i];
    const a = argv[i];
    if (a === "--project") args.project = next();
    else if (a === "--surface") args.surface = next();
    else if (a === "--out") args.out = next();
    else if (a === "--runs") args.runs = Number.parseInt(next(), 10);
    else if (a === "--warmups") args.warmups = Number.parseInt(next(), 10);
    else if (a === "--file-limit") args.fileLimit = Number.parseInt(next(), 10);
    else if (a === "--work") args.work = next();
  }
  return args;
}

/**
 * Stage a `.vue`-only copy for the surfaces that mutate their input.
 *
 * `format` rewrites the files it is handed and drops its config beside them;
 * `lint` needs configs written into the corpus root. Pointed at the checkout,
 * they would reformat third-party sources in place and the next run would
 * measure already-formatted code.
 *
 * `compile` deliberately does NOT use this — it is read-only, and the staged copy
 * omits the sibling `.ts` files that hold imported types, which made
 * @vue/compiler-sfc fail where the natives passed.
 */
function stageCorpus(resolved, workRoot) {
  const staged = join(workRoot, "corpus", resolved.selector.replace(/[^a-z0-9]+/gi, "-"));
  copyFixtureSubset(resolved.dir, staged, resolved.files);
  writeFileSync(
    join(staged, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name: `bench-real-${resolved.project.id}` }, null, 2)}\n`,
  );
  return staged;
}

/**
 * Per-surface run budgets (user decision, 2026-07-30, targeting 20-30 min per
 * project for the full surface list):
 *
 * - project-test is a CORRECTNESS surface — whether the project's suite passes
 *   under a swapped toolchain. One measured run keeps that signal; the two
 *   extra full-suite executions a median-of-3 costs bought a ranking nobody
 *   chooses a toolchain by. Its timing is published as indicative.
 * - bundle, project-typecheck and hmr keep 2 measured runs: their per-run cost
 *   is minutes, and the min-of-2 catches a one-off stall without a third pass.
 * - compile, format and lint keep the caller's runs (default 3): they are the
 *   core ranked throughput surfaces and their runs are cheap.
 *
 * The cap lowers the caller's --runs, never raises it, and every cap is
 * disclosed in the surface's methodology. BENCH_UNIFORM_RUNS=1 disables the
 * caps for studies that need equal run counts everywhere.
 */
const SURFACE_RUN_CAPS = {
  "project-test": 1,
  bundle: 2,
  "project-typecheck": 2,
  hmr: 2,
};

const RUNNERS = {
  compile: (r, o, staged) => runCompileSurface(r.dir, o),
  format: (r, o, staged) => runFormatSurface(staged, o),
  lint: (r, o, staged) => runLintSurface(staged, o),
  bundle: (r, o) => runBundleSurface(r, o),
  hmr: (r, o) => runHmrSurface(r, o),
  "project-test": (r, o) => runProjectTestSurface(r, o),
  "project-build": (r, o) => runProjectBuildSurface(r, o),
  "project-typecheck": (r, o) => runProjectTypecheckSurface(r, o),
  "project-component-meta": (r, o) => runProjectComponentMetaSurface(r, o),
  "project-lsp": (r, o) => runProjectLspSurface(r, o),
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runner = RUNNERS[args.surface];
  if (!runner) {
    console.error(`run-surface: unknown surface "${args.surface}"`);
    process.exit(2);
  }

  const resolved = resolveCorpus(args.project, { fileLimit: args.fileLimit });
  if (!resolved.available) {
    console.error(`run-surface: ${args.project} unavailable — ${resolved.reason}`);
    process.exit(3);
  }

  const workRoot = resolve(rootDir, args.work, resolved.project.id);
  mkdirSync(workRoot, { recursive: true });

  // Only staged for the surfaces that need it — staging a 1682-SFC corpus costs
  // real time, and `bundle`/`hmr`/`project-*` never read it.
  const needsStaging = args.surface === "format" || args.surface === "lint";
  const staged = needsStaging ? stageCorpus(resolved, workRoot) : null;

  const uniformRuns = process.env.BENCH_UNIFORM_RUNS === "1";
  const cap = uniformRuns ? Infinity : (SURFACE_RUN_CAPS[args.surface] ?? Infinity);
  const runs = Math.min(args.runs, cap);

  const options = {
    runs,
    // BENCH_UNIFORM_RUNS promises equal run counts EVERYWHERE, which binds a
    // surface that raises its own table-local run count (hmr's update table)
    // exactly as it disables the caps here — so the flag is plumbed through.
    uniformRuns,
    warmups: effectiveWarmups(args.warmups),
    files: resolved.files,
    fileLimit: resolved.files.length,
    lintFileLimit: resolved.files.length,
    compileTargets: "vdom",
    compileEnvs: "production",
    compileSourceMaps: "off",
    workRoot,
  };

  const surface = await runner(resolved, options, staged);
  // Cap note + single-run stamps, keyed on each row's ACTUAL sample count —
  // the hmr update table deliberately runs above the cap, and a disclosure
  // that contradicts the rows it sits over is a falsehood in honesty's
  // wording. See appendRunBudgetDisclosures.
  appendRunBudgetDisclosures(surface, { surfaceId: args.surface, runs, requested: args.runs });
  // The no-lockfile rule, applied where every (surface, corpus) pair passes —
  // see applyUnreproducibleGate for the history of it being declared and not
  // enforced.
  applyUnreproducibleGate(surface, resolved);
  surface.provenance = provenance(resolved);

  // Atomic: a partial file from a process that aborted mid-write must never be
  // read as a result.
  const outPath = resolve(args.out);
  mkdirSync(dirname(outPath), { recursive: true });
  const tmp = `${outPath}.partial`;
  writeFileSync(tmp, `${JSON.stringify(surface)}\n`);
  renameSync(tmp, outPath);
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
