#!/usr/bin/env node
/**
 * Download the latest successful Benchmark (+ real-world) artifacts and
 * snapshot them into results/benchmarks and results/real_world (latest run only).
 *
 * Requires GitHub CLI (`gh`) authenticated against this repo.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { publishCiResults } from "./publish-ci-results.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(rootDir, "results", "ci-tmp");

function gh(args) {
  const r = spawnSync("gh", args, { encoding: "utf8", cwd: rootDir });
  if (r.status !== 0) {
    throw new Error(`gh ${args.join(" ")} failed:\n${r.stderr || r.stdout}`);
  }
  return r.stdout.trim();
}

function latestRun(workflow) {
  const raw = gh([
    "run",
    "list",
    "--workflow",
    workflow,
    "--status",
    "success",
    "--limit",
    "1",
    "--json",
    "databaseId,url",
  ]);
  const rows = JSON.parse(raw);
  return rows[0] ?? null;
}

function download(run, label) {
  if (!run) {
    console.log(`[${label}] no successful run`);
    return;
  }
  const dir = join(tmp, label);
  mkdirSync(dir, { recursive: true });
  console.log(`[${label}] ${run.url}`);
  gh(["run", "download", String(run.databaseId), "--dir", dir, "--pattern", "results-*"]);
}

mkdirSync(tmp, { recursive: true });
download(latestRun("benchmark.yml"), "bench");
download(latestRun("benchmark-real-world.yml"), "real-world");
const { copied } = publishCiResults({ fromDir: tmp, scope: "all" });
console.log(`snapshotted ${copied} Linux files into results/benchmarks and results/real_world (previous cleared).`);
console.log("Regenerate README + docs/ with: pnpm docs");
