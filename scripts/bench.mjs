#!/usr/bin/env node
/**
 * Vue toolchain benchmark runner.
 *
 * Surfaces: compile | jsx-compile | typecheck | format | lint | component-meta | lsp
 *
 * Ranking metric is the median of the measured runs. There is no cold metric:
 * an unwarmed first run costs a JS compiler ~3.2x its steady state and a native
 * compiler nothing, so `--warmups 0` is clamped to 1.
 * Tool order is rotated on every warmup and measured run.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectVueFiles } from "./lib/fixtures.mjs";
import { effectiveWarmups } from "./lib/timing.mjs";
import { collectVersions } from "./lib/versions.mjs";
import { buildMethodologyNotes, renderFullMarkdown } from "./lib/report.mjs";
import { runCompileSurface } from "./lib/surfaces/compile.mjs";
import { runJsxCompileSurface } from "./lib/surfaces/jsx-compile.mjs";
import { runTypecheckSurface } from "./lib/surfaces/typecheck.mjs";
import { runFormatSurface } from "./lib/surfaces/format.mjs";
import { runLintSurface } from "./lib/surfaces/lint.mjs";
import { runComponentMetaSurface } from "./lib/surfaces/component-meta.mjs";
import { runLspSurface } from "./lib/surfaces/lsp.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = {
    fixture: "fixtures/200",
    surfaces: "compile,jsx-compile,typecheck,format,lint,component-meta,lsp",
    runs: 5,
    warmups: 1,
    fileLimit: Infinity,
    checkFileLimit: 200,
    metaFileLimit: 100,
    lintFileLimit: Infinity,
    compileTargets: "vdom,vapor",
    compileEnvs: "production,development",
    // OFF only by default: `sourceMap: true` is honoured by @vue/compiler-sfc
    // but silently ignored by the native SFC entry points, so an `on` cell
    // charges Vue for map generation and the natives for nothing. Opt in with
    // --compile-sourcemaps on when investigating that specifically.
    compileSourceMaps: "off",
    json: "",
    out: "",
    work: "work",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--fixture":
        args.fixture = next();
        break;
      case "--surfaces":
        args.surfaces = next();
        break;
      case "--runs":
        args.runs = Number.parseInt(next(), 10);
        break;
      case "--warmups":
        args.warmups = Number.parseInt(next(), 10);
        break;
      case "--file-limit":
        args.fileLimit = Number.parseInt(next(), 10);
        break;
      case "--check-file-limit":
        args.checkFileLimit = Number.parseInt(next(), 10);
        break;
      case "--meta-file-limit":
        args.metaFileLimit = Number.parseInt(next(), 10);
        break;
      case "--lint-file-limit":
        args.lintFileLimit = Number.parseInt(next(), 10);
        break;
      case "--compile-targets":
        args.compileTargets = next();
        break;
      case "--compile-envs":
        args.compileEnvs = next();
        break;
      case "--compile-sourcemaps":
        args.compileSourceMaps = next();
        break;
      case "--json":
        args.json = next();
        break;
      case "--out":
        args.out = next();
        break;
      case "--work":
        args.work = next();
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        break;
    }
  }
  return args;
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
    console.log(`Usage: node scripts/bench.mjs [options]

Options:
  --fixture PATH           Fixture directory (default: fixtures/200 UNIQUE)
  --surfaces LIST          compile,jsx-compile,typecheck,format,lint,component-meta,lsp
  --runs N                 Measured runs (default: 5)
  --warmups N              Discarded warmup runs (default: 1, minimum: 1)
  --file-limit N           Max files for compile/format/lint/jsx-compile
  --check-file-limit N     Max SFCs for typecheck (default: 200)
  --meta-file-limit N      Max SFCs for component-meta (default: 100)
  --lint-file-limit N      Max SFCs for lint (default: all)
  --compile-targets LIST   vdom,vapor (SFC compile only)
  --compile-envs LIST      production,development (SFC compile only)
  --compile-sourcemaps L   off (default) or on. Only @vue/compiler-sfc emits a
                           map from the benchmarked entry point, so "on" does
                           NOT equalise work — it is opt-in, not published.
  --json FILE              Write JSON
  --out FILE               Write markdown
  --work DIR               Work directory

Ranking:
  Median of measured runs, each preceded by >= 1 discarded warmup pass.
  There is no cold metric: an unwarmed first run measures JIT warmup for JS
  tools and nothing for native tools. --warmups 0 is clamped to 1.

Corpus notes:
  fixtures/N              UNIQUE SFC contents (primary rankings)
  fixtures/N-vapor        UNIQUE + vapor authoring attribute
  fixtures/N-repeated     identical bodies (cache demo only — not for ranking)
  fixtures/jsx-N          UNIQUE .jsx for jsx-compile (vue-jsx-vapor)
`);
    process.exit(0);
  }

  const fixtureDir = resolve(rootDir, args.fixture);
  if (!existsSync(fixtureDir)) {
    console.error(`Fixture not found: ${fixtureDir}`);
    console.error(`Run: pnpm generate`);
    process.exit(1);
  }

  if (String(args.fixture).includes("repeated")) {
    console.warn(
      "⚠ Fixture looks like REPEATED-content corpus. Content-hash caches (e.g. Vize) will inflate compile throughput. Use fixtures/N for ranking.",
    );
  }

  const surfaceIds = args.surfaces
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const needsVue = surfaceIds.some((id) => id !== "jsx-compile");
  const files = collectVueFiles(fixtureDir);
  if (needsVue && files.length === 0) {
    console.error(`No .vue files in ${fixtureDir}`);
    console.error(`Run: pnpm generate`);
    process.exit(1);
  }

  let workRoot = resolve(rootDir, args.work);
  try {
    rmSync(workRoot, { recursive: true, force: true });
  } catch (err) {
    // Windows often keeps file locks (antivirus / prior tools). Fall back to a unique dir.
    console.warn(`warn: could not wipe ${workRoot} (${err?.code || err}); using unique work dir`);
    workRoot = resolve(rootDir, `${args.work}-${process.pid}-${Date.now().toString(36)}`);
  }
  mkdirSync(workRoot, { recursive: true });

  const fileCount = files.length || 0;
  // Warmup is mandatory. An unwarmed first run costs a JS compiler ~3.2x its
  // steady state and a native compiler nothing, so a zero-warmup pass ranks
  // V8 warmup rather than the tools.
  const warmups = effectiveWarmups(args.warmups);
  if (warmups !== args.warmups) {
    console.warn(`warn: --warmups ${args.warmups} raised to ${warmups} (warmup is mandatory)`);
  }
  const options = {
    runs: args.runs,
    warmups,
    fileLimit: Number.isFinite(args.fileLimit) ? args.fileLimit : fileCount || Infinity,
    checkFileLimit: Number.isFinite(args.checkFileLimit)
      ? Math.min(args.checkFileLimit, fileCount || args.checkFileLimit)
      : Math.min(200, fileCount || 200),
    metaFileLimit: Math.min(args.metaFileLimit, fileCount || args.metaFileLimit),
    lintFileLimit: Number.isFinite(args.lintFileLimit) ? args.lintFileLimit : fileCount || Infinity,
    compileTargets: args.compileTargets,
    compileEnvs: args.compileEnvs,
    compileSourceMaps: args.compileSourceMaps,
    workRoot,
  };

  console.log(
    `Fixture: ${fixtureDir}${fileCount ? ` (${fileCount} SFCs)` : " (SFC optional for jsx-compile)"}`,
  );
  console.log(`Surfaces: ${surfaceIds.join(", ")}`);
  console.log(
    `Runs=${options.runs} warmups=${options.warmups} checkLimit=${options.checkFileLimit} metaLimit=${options.metaFileLimit}`,
  );
  console.log("");

  const surfaces = [];
  for (const id of surfaceIds) {
    console.log(`→ Running surface: ${id}`);
    const started = Date.now();
    let surface;
    if (id === "compile") surface = await runCompileSurface(fixtureDir, options);
    else if (id === "jsx-compile") {
      surface = await runJsxCompileSurface(fixtureDir, options);
    } else if (id === "typecheck") {
      surface = await runTypecheckSurface(fixtureDir, options);
    } else if (id === "format") surface = await runFormatSurface(fixtureDir, options);
    else if (id === "lint") {
      surface = await runLintSurface(fixtureDir, {
        ...options,
        fileLimit: options.lintFileLimit,
      });
    } else if (id === "component-meta") {
      surface = await runComponentMetaSurface(fixtureDir, options);
    } else if (id === "lsp") {
      surface = await runLspSurface(fixtureDir, options);
    } else {
      console.warn(`Unknown surface: ${id}`);
      continue;
    }
    surfaces.push(surface);
    const ok = surface.variants.filter((v) => v.status === "ok").length;
    const err = surface.variants.filter((v) => v.status === "error").length;
    const skip = surface.variants.filter((v) => v.status === "skipped").length;
    console.log(
      `  done in ${((Date.now() - started) / 1000).toFixed(1)}s — ok=${ok} error=${err} skipped=${skip}`,
    );
  }

  const data = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    fixture: args.fixture,
    fileCount: files.length || surfaces.find((s) => s.id === "jsx-compile")?.files || 0,
    settings: {
      phase: process.env.BENCH_PHASE || "local",
      runs: options.runs,
      warmups: options.warmups,
      fileLimit: options.fileLimit,
      checkFileLimit: options.checkFileLimit,
      metaFileLimit: options.metaFileLimit,
      lintFileLimit: options.lintFileLimit,
      compileTargets: options.compileTargets,
      compileEnvs: options.compileEnvs,
      compileSourceMaps: options.compileSourceMaps,
      surfaces: surfaceIds,
    },
    runner: {
      label: process.env.RUNNER_OS ?? process.env.VIZE_BENCH_RUNNER ?? "local",
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
    methodology: buildMethodologyNotes(),
    surfaces,
  };

  const markdown = renderFullMarkdown(data);
  process.stdout.write(markdown);

  const resultsDir = join(rootDir, "results");
  mkdirSync(resultsDir, { recursive: true });

  const defaultJson = join(resultsDir, `bench-${process.platform}-${files.length}.json`);
  const defaultMd = join(resultsDir, `bench-${process.platform}-${files.length}.md`);

  writeFileSync(args.json ? resolve(args.json) : defaultJson, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(args.out ? resolve(args.out) : defaultMd, markdown);

  console.log(`\nWrote ${args.json || defaultJson}`);
  console.log(`Wrote ${args.out || defaultMd}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
