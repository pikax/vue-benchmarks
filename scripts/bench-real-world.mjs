#!/usr/bin/env node
/**
 * Real-world benchmark orchestrator.
 *
 * Runs the toolchain surfaces against SFCs from pinned checkouts of popular
 * open-source Vue projects instead of generated fixtures.
 *
 *   pnpm fetch:real-world                       # clone + install (do this first)
 *   pnpm bench:real-world                       # every project, every surface
 *   pnpm bench:real-world -- --projects hoppscotch --surfaces bundle,hmr
 *
 * ## What a real-world corpus is worth, and what it is not
 *
 * The generated corpus is designed: every body unique, every construct
 * deliberate, a planted bug in a known place. That is what makes the work gates
 * possible, and it is why it stays the primary ranking corpus. What it cannot do
 * is surprise anyone. Real projects contain the constructs nobody thought to
 * generate — and they find things: the first run of the bundle surface against
 * Hoppscotch caught `@verter/unplugin` emitting syntactically invalid JavaScript
 * for a `v-if` on a dynamic component, on a file no generated fixture resembles.
 *
 * What real-world numbers are NOT is a like-for-like replacement ranking. The
 * corpora differ in size, in kind (library source vs docs demos — see the
 * registry docblock, the difference is larger than it sounds), and in what they
 * exercise. Rank within a corpus; do not rank across corpora.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFixtureSubset } from "./lib/fixtures.mjs";
import { effectiveWarmups } from "./lib/timing.mjs";
import { collectVersions } from "./lib/versions.mjs";
import { renderFullMarkdown } from "./lib/report.mjs";
import { defaultSelectors } from "./lib/real-world/projects.mjs";
import {
  CHECKOUT_DEPENDENCY_SURFACES,
  provenance,
  resolveCorpus,
  usesCheckoutDependencies,
} from "./lib/real-world/corpus.mjs";
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

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Wall-clock ceiling for ONE (project, surface) child.
 *
 * Generous on purpose: naive-ui is 1682 SFCs and project-lsp starts a fresh
 * language server per pass. This is a backstop against a wedged child holding the
 * sweep open forever, not a performance budget — a cell that hits it is reported
 * as a failure with the ceiling named, never silently truncated.
 */
const SURFACE_TIMEOUT_MS = 45 * 60 * 1000;

/**
 * Surfaces this orchestrator can run against a cloned project.
 *
 * Two families, and the distinction is the whole reason the list looks like this.
 *
 * The CORPUS-COPY surfaces (`compile`, `format`, `lint`, `bundle`, `hmr`) read SFC
 * text out of the checkout and externalise every specifier that is not corpus code,
 * so they do not need the project's imports to resolve.
 *
 * The `project-*` surfaces run IN the checkout against the project's own tsconfig,
 * config and installed `node_modules`. They exist because the same measurements on
 * a LIFTED corpus are worthless: `~/composables/x`, `@hoppscotch/data` and
 * `~icons/lucide/check` are meaningless outside the project's own alias
 * configuration, so a checker, a metadata extractor or a language server pointed at
 * a lifted copy reports thousands of TS2307s — or, if the tsconfig is wrong in the
 * other direction, nothing at all, very fast, which in a table is
 * indistinguishable from a fast and thorough tool. The lifted forms stay refused
 * (see `DEFERRED_SURFACES`) rather than quietly redirected, because "typecheck on a
 * lifted corpus" and "project-typecheck" are different measurements and a reader
 * asking for one must not be handed the other.
 */
const SUPPORTED_SURFACES = [
  "compile",
  "format",
  "lint",
  "bundle",
  "hmr",
  "project-test",
  "project-build",
  "project-typecheck",
  "project-component-meta",
  "project-lsp",
];

/**
 * Surfaces asked for by name that this orchestrator will not run, and why.
 *
 * Empty is the correct state, not an oversight: `component-meta` and `lsp` used to
 * live here because a LIFTED corpus resolves none of its imports. They are now
 * offered as `project-component-meta` and `project-lsp`, which run IN the checkout
 * against the project's own tsconfig — the same move `project-typecheck` made, for
 * the same reason. The LIFTED forms are still refused, and the aliases below say so
 * rather than silently running the in-place surface under the lifted name: those are
 * different measurements and a reader must not be handed one while asking for the
 * other.
 */
const DEFERRED_SURFACES = {
  "component-meta":
    "not offered on a LIFTED corpus — a corpus pulled out of a monorepo resolves none of its imports, and a metadata extractor whose imports do not resolve returns components with no props very quickly. Ask for project-component-meta, which runs in the checkout against the project's own tsconfig",
  lsp: "not offered on a LIFTED corpus — same resolution requirement, plus the workspace has to be the project itself for a language server's project load to mean anything. Ask for project-lsp",
  typecheck:
    "not offered on a LIFTED corpus — see project-typecheck, which runs in the checkout against the project's own tsconfig",
};

function parseArgs(argv) {
  const args = {
    projects: "",
    surfaces: SUPPORTED_SURFACES.join(","),
    runs: 3,
    warmups: 1,
    // NO TRUNCATION BY DEFAULT. A default limit silently published an
    // alphabetical prefix — "naive-ui, 200 SFCs" was really the first 200 of 1708
    // sorted by path, i.e. components A through C — and an alphabetical slice of a
    // component library is a systematically narrower corpus than the whole, not a
    // sample of it. The full corpus is the only one whose coverage claim is true,
    // so it is the default; `--file-limit` remains available for quick local runs
    // and every truncated run says so on the corpus line and in the methodology.
    fileLimit: Infinity,
    json: "",
    out: "",
    work: "work-real",
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--projects") args.projects = next();
    else if (a.startsWith("--projects=")) args.projects = a.slice("--projects=".length);
    else if (a === "--surfaces") args.surfaces = next();
    else if (a === "--runs") args.runs = Number.parseInt(next(), 10);
    else if (a === "--warmups") args.warmups = Number.parseInt(next(), 10);
    else if (a === "--file-limit") args.fileLimit = Number.parseInt(next(), 10);
    else if (a === "--json") args.json = next();
    else if (a === "--out") args.out = next();
    else if (a === "--work") args.work = next();
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

/**
 * Stage the corpus into the work tree before any surface touches it.
 *
 * Non-negotiable: `format` rewrites the files it is given and writes its config
 * into the corpus root. Pointed straight at a clone that would reformat a
 * third-party checkout in place and leave a `.prettierrc.json` in it, so the next
 * run would benchmark already-formatted sources — a corpus that silently changes
 * between runs is not a corpus.
 */
function stageCorpus(resolved, workRoot) {
  const staged = join(workRoot, "corpus", resolved.selector.replace(/[^a-z0-9]+/gi, "-"));
  copyFixtureSubset(resolved.dir, staged, resolved.files);
  writeFileSync(
    join(staged, "package.json"),
    `${JSON.stringify(
      { private: true, type: "module", name: `bench-real-${resolved.project.id}` },
      null,
      2,
    )}\n`,
  );
  return staged;
}

function githubRunUrl() {
  const server = process.env.GITHUB_SERVER_URL;
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (!server || !repo || !runId) return "";
  return `${server}/${repo}/actions/runs/${runId}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/bench-real-world.mjs [options]

Options:
  --projects a,b        Project or project:corpus selectors (default: one corpus per project)
  --surfaces LIST       ${SUPPORTED_SURFACES.join(",")}
  --runs N              Measured runs (default: 3)
  --warmups N           Discarded warmups (default: 1, minimum 1)
  --file-limit N        Max SFCs per corpus (default: NO LIMIT — the full corpus).
                        A limit takes an ALPHABETICAL PREFIX by path, which is a
                        narrower corpus rather than a sample of one. Use it for
                        quick local runs; published runs should not set it.
  --json FILE / --out FILE / --work DIR

Fetch the projects first:
  node scripts/fetch-real-world.mjs

Not available here (and why):
${Object.entries(DEFERRED_SURFACES)
  .map(([k, v]) => `  ${k.padEnd(16)} ${v}`)
  .join("\n")}
`);
    process.exit(0);
  }

  const requested = args.surfaces
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const surfaceIds = [];
  for (const id of requested) {
    if (SUPPORTED_SURFACES.includes(id)) surfaceIds.push(id);
    else if (DEFERRED_SURFACES[id]) {
      console.warn(`⚠ surface "${id}" is not available on real-world corpora — ${DEFERRED_SURFACES[id]}`);
    } else {
      console.warn(`⚠ unknown surface "${id}"`);
    }
  }
  if (surfaceIds.length === 0) {
    console.error("No runnable surfaces selected.");
    process.exit(1);
  }

  const selectors = args.projects
    ? args.projects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : defaultSelectors();

  let workRoot = resolve(rootDir, args.work);
  try {
    rmSync(workRoot, { recursive: true, force: true });
  } catch (error) {
    console.warn(`warn: could not wipe ${workRoot} (${error?.code || error}); using a unique work dir`);
    workRoot = resolve(rootDir, `${args.work}-${process.pid}-${Date.now().toString(36)}`);
  }
  mkdirSync(workRoot, { recursive: true });

  const warmups = effectiveWarmups(args.warmups);
  const corpora = [];
  const skipped = [];

  for (const selector of selectors) {
    let resolved;
    try {
      resolved = resolveCorpus(selector, { fileLimit: args.fileLimit });
    } catch (error) {
      skipped.push({ selector, reason: error instanceof Error ? error.message : String(error) });
      continue;
    }
    if (!resolved.available) {
      skipped.push({ selector: resolved.selector, reason: resolved.reason });
      continue;
    }
    corpora.push(resolved);
  }

  for (const s of skipped) console.warn(`⏭ ${s.selector}: ${s.reason}`);
  if (corpora.length === 0) {
    console.error("\nNo real-world corpora available. Run: pnpm fetch:real-world");
    process.exit(1);
  }

  console.log(`Corpora: ${corpora.length} · Surfaces: ${surfaceIds.join(", ")}`);
  console.log(`Runs=${args.runs} warmups=${warmups} fileLimit=${args.fileLimit}\n`);

  const surfaces = [];
  // Surfaces that threw. Recorded, not just logged — see the catch below.
  const surfaceFailures = [];
  for (const resolved of corpora) {
    console.log(`\n=== ${provenance(resolved)} ===`);
    const staged = stageCorpus(resolved, workRoot);
    const options = {
      runs: args.runs,
      warmups,
      files: resolved.files,
      fileLimit: resolved.files.length,
      lintFileLimit: resolved.files.length,
      compileTargets: "vdom",
      compileEnvs: "production",
      compileSourceMaps: "off",
      workRoot: join(workRoot, resolved.project.id),
    };
    mkdirSync(options.workRoot, { recursive: true });

    for (const id of surfaceIds) {
      const started = Date.now();
      process.stdout.write(`  → ${id} ... `);
      try {
        // Each surface runs in its OWN child process.
        //
        // The try/catch around this call cannot catch what actually goes wrong
        // here. `@fervid/napi` reports unimplemented constructs with a Rust
        // `panic!`, which aborts the host rather than throwing; and after
        // compile/format/lint/bundle/hmr have each built Verter hosts, Vize
        // batches and Vite dev servers in one process, `project-test` died
        // silently on Element Plus — the same surface completes fine on its own.
        // Both cost every result not yet written. In a child, both cost exactly
        // this one cell, and the parent records why.
        const outFile = join(
          workRoot,
          "surface-json",
          `${resolved.selector.replace(/[^a-z0-9]+/gi, "-")}-${id}.json`,
        );
        mkdirSync(dirname(outFile), { recursive: true });
        rmSync(outFile, { force: true });

        const childArgs = [
          join(rootDir, "scripts", "run-surface.mjs"),
          "--project", resolved.selector,
          "--surface", id,
          "--out", outFile,
          "--runs", String(args.runs),
          "--warmups", String(warmups),
          "--work", args.work,
        ];
        if (Number.isFinite(args.fileLimit)) {
          childArgs.push("--file-limit", String(args.fileLimit));
        }

        const child = spawnSync(process.execPath, childArgs, {
          cwd: rootDir,
          encoding: "utf8",
          maxBuffer: 256 * 1024 * 1024,
          timeout: SURFACE_TIMEOUT_MS,
          env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
        });

        let surface = null;
        if (existsSync(outFile)) {
          try {
            surface = JSON.parse(readFileSync(outFile, "utf8"));
          } catch (parseError) {
            surface = null;
            child.parseError = parseError?.message ?? String(parseError);
          }
        }

        if (!surface) {
          // A cell that produced nothing. Recorded and reported, never silent:
          // an absent surface is indistinguishable from one that was not
          // requested, and that is exactly how the first crash went unnoticed.
          const how = child.signal
            ? `killed by signal ${child.signal}`
            : child.error?.code === "ETIMEDOUT"
              ? `exceeded the ${Math.round(SURFACE_TIMEOUT_MS / 60000)} min surface budget`
              : `exited ${child.status}`;
          const tail = `${child.stderr ?? ""}`.trim().split("\n").filter(Boolean).slice(-4).join(" | ");
          surfaceFailures.push({
            surface: id,
            corpus: resolved.selector,
            how,
            detail: tail.slice(0, 800) || "(no stderr captured)",
          });
          console.log(`FAILED (isolated): ${how}${tail ? ` — ${tail.split("|").pop().trim().slice(0, 160)}` : ""}`);
          continue;
        }

        surfaces.push(surface);
        const rows = surface.variants ?? [];
        const ok = rows.filter((v) => v.status === "ok").length;
        const unranked = rows.filter((v) => v.status === "unranked").length;
        const err = rows.filter((v) => v.status === "error").length;
        const skip = rows.filter((v) => v.status === "skipped").length;
        const excl = (surface.excluded ?? []).length;
        console.log(
          `done in ${((Date.now() - started) / 1000).toFixed(1)}s — ok=${ok} unranked=${unranked} error=${err} skipped=${skip}${excl ? ` excluded=${excl}` : ""}`,
        );
      } catch (error) {
        // One surface failing on one project must not lose the other eight
        // projects' results — but it must not vanish either. This used to be a
        // console.log and nothing else: the surface produced no rows, appeared in
        // no `skipped` list, and the published report was simply missing a table
        // with no statement that anything had been attempted. A silently absent
        // surface is the harness hiding its own gap, so the failure is recorded
        // and printed in the report's methodology.
        const message = String(error instanceof Error ? (error.stack ?? error.message) : error)
          .split("\n")
          .slice(0, 4)
          .join(" ")
          .slice(0, 600);
        surfaceFailures.push({
          surface: id,
          corpus: resolved.selector,
          project: resolved.project.id,
          error: message,
        });
        console.log(`FAILED: ${message.split(" ")[0] ? message : "unknown error"}`);
      }
    }
  }

  const data = {
    schemaVersion: 2,
    kind: "real-world",
    generatedAt: new Date().toISOString(),
    fixture: "fixtures/real",
    fileCount: corpora.reduce((n, c) => n + c.files.length, 0),
    corpora: corpora.map((c) => ({
      selector: c.selector,
      repo: c.project.repo,
      ref: c.project.ref,
      sha: c.sha,
      kind: c.corpus.kind,
      license: c.project.license,
      files: c.files.length,
      bytes: c.bytes,
      installed: c.installed,
      installNote: c.installNote,
      hasLockfile: c.hasLockfile,
      dependenciesReproducible: c.dependenciesReproducible,
      truncation: c.truncation,
    })),
    skipped,
    surfaceFailures,
    settings: {
      phase: process.env.BENCH_PHASE || "local",
      runs: args.runs,
      warmups,
      fileLimit: args.fileLimit,
      surfaces: surfaceIds,
    },
    runner: {
      label: process.env.RUNNER_OS ?? "local",
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model ?? "unknown",
      totalmem: os.totalmem(),
      node: process.version,
    },
    commit: {
      sha: process.env.GITHUB_SHA ?? "",
      ref: process.env.GITHUB_REF_NAME ?? "",
      repository: process.env.GITHUB_REPOSITORY ?? "",
      runUrl: githubRunUrl(),
    },
    versions: collectVersions(),
    methodology: [
      "Corpora are pinned checkouts of third-party open-source Vue projects; sources are unmodified and every row names its project, ref and resolved commit SHA.",
      "Rank WITHIN a corpus, never across. The corpora differ in size and in kind — library source, application source, and documentation demos are not the same code, and a docs-demo SFC is a fraction of the size of a library component.",
      "The generated fixtures/N corpus remains the primary ranking corpus. It is content-unique by construction and carries planted bugs, which is what makes the work gates possible; real-world code cannot be gated that way because nobody knows where its bugs are.",
      "Real-world corpora exist to catch what a generated corpus cannot: constructs nobody thought to generate. Treat a failure here as a finding about the tool, and a speed number here as secondary to fixtures/N.",
      Number.isFinite(args.fileLimit)
        ? `⚠ THIS RUN WAS TRUNCATED: --file-limit ${args.fileLimit} was passed, so each corpus is an ALPHABETICAL PREFIX by path rather than the whole project. The prefix is identical for every tool, so the comparison between tools holds; the corpus is not a random sample of the project, so no coverage claim about the project does. Published runs use the full corpus (no --file-limit).`
        : "Corpora are COMPLETE: no --file-limit was applied, so every SFC under each corpus root was measured. This is the default, because a limit takes an alphabetical prefix by path — a systematically narrower corpus rather than a sample of one.",
      `A project shipping no lockfile cannot be installed frozen, so its dependency set is whatever resolved on the day. Rows on the surfaces that execute those dependencies (${CHECKOUT_DEPENDENCY_SURFACES.join(", ")}) are UNRANKED for such a corpus — equally for every tool, baseline included, because it is a property of the corpus and not of any tool.`,
      // Worded as "on a LIFTED corpus", not "on real-world corpora". The in-place
      // `project-*` equivalents DO run on real-world corpora, and a blanket
      // "component-meta is not run on real-world corpora" line sitting above a
      // `project-component-meta` table in the same document would contradict it.
      ...Object.entries(DEFERRED_SURFACES).map(
        ([k, v]) => `Surface "${k}" is not run on a LIFTED real-world corpus: ${v}.`,
      ),
      // The gap belongs in the published document, not only in a terminal nobody
      // kept. Listed even when empty is not useful, so it is conditional.
      ...(surfaceFailures.length > 0
        ? [
            `⚠ HARNESS GAP — ${surfaceFailures.length} surface run(s) threw and produced NO rows. These are failures of this harness on this machine, not results about any tool, and nothing should be inferred about the tools that would have been measured: ${surfaceFailures
              .map((f) => `${f.surface} on ${f.corpus} (${f.error})`)
              .join(" · ")}`,
          ]
        : []),
    ],
    surfaces,
  };

  const markdown = renderFullMarkdown(data);
  process.stdout.write(`\n${markdown}`);

  const resultsDir = join(rootDir, "results");
  mkdirSync(resultsDir, { recursive: true });
  const defaultJson = join(resultsDir, `real-world-${process.platform}.json`);
  const defaultMd = join(resultsDir, `real-world-${process.platform}.md`);
  writeFileSync(args.json ? resolve(args.json) : defaultJson, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(args.out ? resolve(args.out) : defaultMd, markdown);
  console.log(`\nWrote ${args.json || defaultJson}`);
  console.log(`Wrote ${args.out || defaultMd}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
