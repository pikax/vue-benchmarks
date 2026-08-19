/**
 * IDE operation benchmark runner.
 *
 * Runs one or more operation suites against one or more language servers and
 * prints a per-operation table. Each suite owns a purpose-built workspace, so
 * suites are independent and can be developed and verified in isolation:
 *
 *   node scripts/ide-bench.mjs --suite edit-loop --server vize
 *   node scripts/ide-bench.mjs --suite all --server all --runs 3
 *   node scripts/ide-bench.mjs --list
 *
 * Ranking lives in the report layer, not here — this prints raw per-op results
 * so a suite author can see exactly what their gates returned.
 *
 * Each measured run gets a fresh workspace under `--work` (default `work-ide/`)
 * and that workspace is REMOVED when the run ends. Pass `--keep-work` to keep
 * them for debugging a suite by hand.
 */

import { existsSync, mkdirSync, readdirSync, rmdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileUri } from "./lib/lsp-client.mjs";
import {
  createSession,
  detectBackendFallback,
  isolatedColdIds,
  mergeIsolatedOps,
  removeWorkspace,
  resolveServers,
} from "./lib/ide-ops/context.mjs";
import { budgetFor } from "./lib/ide-ops/budget.mjs";
import { SUITES } from "./lib/ide-ops/registry.mjs";
import { buildIdeSurfaces, buildTypingLoopSurface } from "./lib/ide-report.mjs";
import { IDE_RANKING_RULES, RANKING_RULES, renderSurfaceMarkdown } from "./lib/report.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = {
    suite: "all",
    server: "all",
    runs: 1,
    warmups: 1,
    work: "work-ide",
    json: null,
    out: null,
    list: false,
    verbose: false,
    // Generated workspaces are removed after each run. `--keep-work` is for
    // debugging a suite by hand; it is never the default, because the default
    // left one directory per suite × server × run behind (144 after a full CI
    // pass), each holding a junction into the repo's node_modules.
    keepWork: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") args.list = true;
    else if (a === "--verbose") args.verbose = true;
    else if (a === "--keep-work") args.keepWork = true;
    else if (a === "--suite") args.suite = argv[++i];
    else if (a === "--server") args.server = argv[++i];
    else if (a === "--runs") args.runs = Number(argv[++i]);
    else if (a === "--warmups") args.warmups = Number(argv[++i]);
    else if (a === "--work") args.work = argv[++i];
    else if (a === "--json") args.json = argv[++i];
    else if (a === "--out") args.out = argv[++i];
  }
  return args;
}

function median(nums) {
  const s = [...nums].filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return null;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmt(ms) {
  if (ms == null) return "n/a";
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(1)} ms`;
}

let wsSeq = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Drop a finished workspace, retrying while the server lets go of it.
 *
 * `removeWorkspace()` (context.mjs) is the ONLY correct way to do this: every
 * workspace contains a `node_modules` JUNCTION to the repo root, `rmSync`
 * recursive fails EPERM on the link rather than following it, and following it
 * would delete the repo's real node_modules. So the link is unlinked first and
 * the rest removed after.
 *
 * The retry exists because `close()` returns as soon as the LSP shutdown
 * handshake completes, and on Windows the process can still hold a handle into
 * the directory for a few milliseconds after that. Bounded and best-effort: a
 * workspace that survives all attempts is inert (every dir is unique), so this
 * never fails a run — it just stops the runner leaving 144 of them behind after
 * a full CI pass.
 */
async function cleanupWorkspace(wsDir) {
  for (let attempt = 0; attempt < 4; attempt++) {
    removeWorkspace(wsDir);
    if (!existsSync(wsDir)) return true;
    await sleep(100 * (attempt + 1));
  }
  return !existsSync(wsDir);
}

async function runSuiteOnServer({ suite, server, workRoot, verbose, keepWork, only, skipOpIds }) {
  // Unique per run: a fresh server process per run is the point, and a previous
  // run's server may still hold handles into its workspace.
  const wsDir = join(workRoot, `${suite.id}-${server.id}-${++wsSeq}`);
  removeWorkspace(wsDir);
  mkdirSync(wsDir, { recursive: true });
  const ws = suite.buildWorkspace(wsDir);

  // Budgets scale with the workspace the suite just wrote. A suite that does
  // not declare `fileCount` gets the small-project floor, which is correct for
  // every suite here except `scale` — and `scale` builds one session per corpus
  // size inside measure(), so it computes its own budgets there.
  const budget = budgetFor(ws.fileCount);

  let ctx = null;
  try {
    ctx = await createSession({ server, workspaceDir: wsDir, budget });
    const ops = await suite.measure({
      ...ctx,
      ws,
      pathToFileUri,
      verbose,
      only,
      skipOpIds,
    });
    const peakRssBytes = ctx.snapshotRss?.() ?? ctx.peakRssBytes;
    return {
      ok: true,
      ops,
      initializeMs: ctx.initializeMs,
      peakRssBytes,
      stderr: ctx.stderrTail(),
    };
  } catch (e) {
    return { ok: false, error: e.message, ops: [], stderr: ctx?.stderrTail?.() ?? "" };
  } finally {
    // Close FIRST, then remove: the workspace is the server's project root.
    await ctx?.close?.();
    if (keepWork) {
      if (verbose) console.log(`    kept workspace ${wsDir}`);
    } else if (!(await cleanupWorkspace(wsDir))) {
      console.warn(`    ⚠ could not remove workspace ${wsDir} (still held); left in place`);
    }
  }
}

/**
 * A later timedColdWarm in one session is not cold — the first op already
 * filled caches. Suites list those ops on `isolatedColdOps`; each is measured
 * in its own spawn so Cold is the first request after didOpen.
 */
async function runSuiteSessions({ suite, server, workRoot, verbose, keepWork, warmup }) {
  const spec = suite.isolatedColdOps ?? [];
  const ids = isolatedColdIds(spec);
  const base = { suite, server, workRoot, verbose, keepWork };
  if (warmup) {
    await runSuiteOnServer(base);
    for (const id of ids) await runSuiteOnServer({ ...base, only: id });
    return null;
  }
  const full = await runSuiteOnServer({ ...base, skipOpIds: ids.length ? ids : undefined });
  if (!full.ok || !ids.length) return full;
  const extras = [];
  for (const id of ids) {
    const extra = await runSuiteOnServer({ ...base, only: id });
    if (!extra.ok) return extra;
    extras.push(extra);
  }
  return {
    ok: true,
    ops: mergeIsolatedOps(
      full.ops,
      extras.map((e) => e.ops),
      spec,
      suite.pairOps,
    ),
    initializeMs: full.initializeMs,
    initializeSamples: [full.initializeMs, ...extras.map((e) => e.initializeMs)].filter(
      Number.isFinite,
    ),
    peakRssBytes: Math.max(
      0,
      ...[full, ...extras].map((s) => s.peakRssBytes).filter(Number.isFinite),
    ) || null,
    stderr: [full.stderr, ...extras.map((e) => e.stderr)].filter(Boolean).join("\n"),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    console.log("Suites:");
    for (const s of SUITES) console.log(`  ${s.id.padEnd(16)} ${s.label}`);
    console.log("\nServers:");
    for (const s of resolveServers()) console.log(`  ${s.id.padEnd(16)} ${s.label}`);
    return;
  }

  const suites =
    args.suite === "all" ? SUITES : SUITES.filter((s) => args.suite.split(",").includes(s.id));
  if (!suites.length) {
    console.error(`No such suite: ${args.suite}. Try --list`);
    process.exit(1);
  }

  const allServers = resolveServers();
  const servers =
    args.server === "all"
      ? allServers
      : allServers.filter((s) => args.server.split(",").includes(s.id));
  if (!servers.length) {
    console.error(`No such server: ${args.server}. Try --list`);
    process.exit(1);
  }

  const workRoot = resolve(rootDir, args.work);
  mkdirSync(workRoot, { recursive: true });

  const results = [];
  for (const suite of suites) {
    console.log(`\n=== ${suite.label} (${suite.id}) ===`);
    for (const server of servers) {
      // Warmups are discarded, as everywhere else in this repo: an unwarmed
      // first run measures JIT warmup for JS servers and nothing for native.
      // Isolated-cold ops get their own discarded spawn too — they are a
      // separate process, and skipping that warmup would put V8 JIT into their
      // published cold number.
      for (let w = 0; w < Math.max(1, args.warmups); w++) {
        await runSuiteSessions({
          suite,
          server,
          workRoot,
          verbose: false,
          keepWork: args.keepWork,
          warmup: true,
        });
      }
      const runs = [];
      for (let r = 0; r < Math.max(1, args.runs); r++) {
        runs.push(
          await runSuiteSessions({
            suite,
            server,
            workRoot,
            verbose: args.verbose,
            keepWork: args.keepWork,
          }),
        );
      }

      const failed = runs.find((r) => !r.ok);
      if (failed) {
        console.log(`\n  ${server.label}: ERROR — ${failed.error}`);
        results.push({ suite: suite.id, server: server.id, error: failed.error, ops: [] });
        continue;
      }

      // Aggregate per operation id across runs.
      const byOp = new Map();
      for (const run of runs) {
        for (const op of run.ops) {
          if (!byOp.has(op.id)) byOp.set(op.id, { ...op, samples: [] });
          byOp.get(op.id).samples.push(op);
        }
      }
      const ops = [...byOp.values()].map((o) => {
        const anyInvalid = o.samples.find((s) => s.valid === false);
        const runs = o.samples.map((s) => s.ms).filter(Number.isFinite);
        const coldRuns = o.samples.map((s) => s.coldMs).filter(Number.isFinite);
        const mean = runs.length ? runs.reduce((a, b) => a + b, 0) / runs.length : null;
        const stddev =
          runs.length > 1
            ? Math.sqrt(runs.reduce((a, b) => a + (b - mean) ** 2, 0) / (runs.length - 1))
            : 0;
        return {
          id: o.id,
          label: o.label,
          medianMs: median(runs),
          coldMedianMs: coldRuns.length ? median(coldRuns) : null,
          minMs: runs.length ? Math.min(...runs) : null,
          stddevMs: runs.length > 1 ? stddev : null,
          // Noise guard, same as every other surface: a contended or throttled
          // box shows up here rather than silently widening every comparison.
          cvPct: runs.length > 1 && mean ? (stddev / mean) * 100 : null,
          runs,
          coldRuns: coldRuns.length ? coldRuns : undefined,
          valid: anyInvalid ? false : o.samples.some((s) => s.valid === true) ? true : null,
          reason: anyInvalid?.reason ?? "",
          sample: anyInvalid?.sample ?? o.samples[0]?.sample ?? "",
          artifact: o.samples[0]?.artifact,
          // Carried, not re-derived. A suite may declare that its operation
          // must not be RANKED (`ranked: false` + why), or name what its
          // artifact number means; both are properties of the operation, and
          // dropping them here is how a suite's own caveat stops reaching the
          // report that publishes its numbers.
          ...(o.ranked === false ? { ranked: false, rankingNote: o.rankingNote } : {}),
          ...(o.artifactLabel ? { artifactLabel: o.artifactLabel } : {}),
        };
      });

      console.log(`\n  ${server.label}   (initialize ${fmt(runs[0].initializeMs)})`);
      for (const op of ops) {
        const mark = op.valid === false ? "✗" : op.valid === true ? "✓" : "·";
        const art = op.artifact == null ? "" : `  [${op.artifact}]`;
        // Same marker the report uses, so a suite author sees at the console
        // which of their operations will not carry a ranking.
        const rank = op.ranked === false ? "  (not ranked)" : "";
        const cold = Number.isFinite(op.coldMedianMs) ? `  cold ${fmt(op.coldMedianMs)}` : "";
        console.log(`    ${mark} ${op.label.padEnd(34)} ${fmt(op.medianMs).padStart(10)}${cold}${art}${rank}`);
        if (op.valid === false) {
          console.log(`        reason: ${op.reason}`);
          if (op.sample) console.log(`        sample: ${JSON.stringify(op.sample.slice(0, 120))}`);
        }
      }
      // Carry the backend-fallback signal through to the report. It was
      // collected here and then dropped, which let a server whose type backend
      // never started be ranked first on questions that backend answers.
      const fallback = runs
        .map((r) => detectBackendFallback(r.stderr))
        .filter(Boolean)
        .pop();
      if (fallback) console.log(`      ⚠ BACKEND FALLBACK — ${fallback}`);
      const initializeRuns = runs
        .flatMap((r) => r.initializeSamples ?? [r.initializeMs])
        .filter(Number.isFinite);
      const rssRuns = runs.map((r) => r.peakRssBytes).filter(Number.isFinite);
      results.push({
        suite: suite.id,
        server: server.id,
        label: server.label,
        ops,
        backendFallback: fallback ?? null,
        initializeMs: median(initializeRuns),
        initializeRuns,
        peakRssMb: rssRuns.length ? median(rssRuns) / (1024 * 1024) : null,
        rssRuns: rssRuns.length ? rssRuns.map((b) => b / (1024 * 1024)) : undefined,
      });
    }
  }

  if (args.json) {
    const out = resolve(rootDir, args.json);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify({ results }, null, 2)}\n`);
    console.log(`\nWrote ${out}`);
  }

  if (args.out) {
    const md = [
      "## IDE operation results",
      "",
      `- **Generated:** ${new Date().toISOString()}`,
      `- **Runner:** ${process.platform}/${process.arch} · Node ${process.version}`,
      `- **Runs / warmups:** ${args.runs} / ${Math.max(1, args.warmups)}`,
      "",
      // Once per document. This report has no methodology section, so the
      // ranking rules are stated here rather than above every table.
      RANKING_RULES,
      "",
      IDE_RANKING_RULES,
      "",
      ...buildIdeSurfaces(results).map((s) => renderSurfaceMarkdown(s)),
      renderSurfaceMarkdown(buildTypingLoopSurface(results)),
    ].join("\n");
    const out = resolve(rootDir, args.out);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${md}\n`);
    console.log(`Wrote ${out}`);
  }

  // The work root itself, only when this run emptied it. `rmdir` without
  // `recursive` on purpose: it refuses on a non-empty directory, so a workspace
  // this run could not remove — or anything a concurrent run is still using —
  // is never taken with it.
  if (!args.keepWork) {
    try {
      if (readdirSync(workRoot).length === 0) rmdirSync(workRoot);
    } catch {
      // Missing, non-empty or in use: leaving it is correct.
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
