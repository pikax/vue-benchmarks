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
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileUri } from "./lib/lsp-client.mjs";
import { createSession, removeWorkspace, resolveServers } from "./lib/ide-ops/context.mjs";
import { SUITES } from "./lib/ide-ops/registry.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = {
    suite: "all",
    server: "all",
    runs: 1,
    warmups: 1,
    work: "work-ide",
    json: null,
    list: false,
    verbose: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") args.list = true;
    else if (a === "--verbose") args.verbose = true;
    else if (a === "--suite") args.suite = argv[++i];
    else if (a === "--server") args.server = argv[++i];
    else if (a === "--runs") args.runs = Number(argv[++i]);
    else if (a === "--warmups") args.warmups = Number(argv[++i]);
    else if (a === "--work") args.work = argv[++i];
    else if (a === "--json") args.json = argv[++i];
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

async function runSuiteOnServer({ suite, server, workRoot, verbose }) {
  // Unique per run: a fresh server process per run is the point, and a previous
  // run's server may still hold handles into its workspace.
  const wsDir = join(workRoot, `${suite.id}-${server.id}-${++wsSeq}`);
  removeWorkspace(wsDir);
  mkdirSync(wsDir, { recursive: true });
  const ws = suite.buildWorkspace(wsDir);

  let ctx = null;
  try {
    ctx = await createSession({ server, workspaceDir: wsDir });
    const ops = await suite.measure({ ...ctx, ws, pathToFileUri, verbose });
    return { ok: true, ops, initializeMs: ctx.initializeMs, stderr: ctx.stderrTail() };
  } catch (e) {
    return { ok: false, error: e.message, ops: [], stderr: ctx?.stderrTail?.() ?? "" };
  } finally {
    await ctx?.close?.();
  }
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
      for (let w = 0; w < Math.max(1, args.warmups); w++) {
        await runSuiteOnServer({ suite, server, workRoot, verbose: false });
      }
      const runs = [];
      for (let r = 0; r < Math.max(1, args.runs); r++) {
        runs.push(await runSuiteOnServer({ suite, server, workRoot, verbose: args.verbose }));
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
        return {
          id: o.id,
          label: o.label,
          medianMs: median(o.samples.map((s) => s.ms)),
          valid: anyInvalid ? false : o.samples.some((s) => s.valid === true) ? true : null,
          reason: anyInvalid?.reason ?? "",
          sample: anyInvalid?.sample ?? o.samples[0]?.sample ?? "",
          artifact: o.samples[0]?.artifact,
        };
      });

      console.log(`\n  ${server.label}   (initialize ${fmt(runs[0].initializeMs)})`);
      for (const op of ops) {
        const mark = op.valid === false ? "✗" : op.valid === true ? "✓" : "·";
        const art = op.artifact == null ? "" : `  [${op.artifact}]`;
        console.log(`    ${mark} ${op.label.padEnd(34)} ${fmt(op.medianMs).padStart(10)}${art}`);
        if (op.valid === false) {
          console.log(`        reason: ${op.reason}`);
          if (op.sample) console.log(`        sample: ${JSON.stringify(op.sample.slice(0, 120))}`);
        }
      }
      results.push({ suite: suite.id, server: server.id, label: server.label, ops });
    }
  }

  if (args.json) {
    const out = resolve(rootDir, args.json);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify({ results }, null, 2)}\n`);
    console.log(`\nWrote ${out}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
