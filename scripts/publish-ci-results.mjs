#!/usr/bin/env node
/**
 * Snapshot the latest CI artifacts into committed folders:
 *   results/benchmarks/   — bench, ide, memory, confirm (Linux, JSON only)
 *   results/real_world/   — per-project real-world results (Linux, JSON only)
 *
 * JSON only: the committed snapshot is the machine-readable source that
 * `pnpm docs` renders README.md and docs/ from. Markdown artifacts remain
 * run-local conveniences and are never committed.
 *
 * A new publish CLEARS the destination first so only the latest run remains.
 * Local Windows reports at results/*.json stay gitignored and untouched.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_DIRS = new Set([
  "ci-tmp",
  "node_modules",
  "benchmarks",
  "real_world",
  "e2e-vscode",
  "work-real",
]);

function isLinuxLeaf(name) {
  if (/^(bench|ide|ide-scale|real-world)-/i.test(name) && /linux/i.test(name)) return true;
  if (/^memory-linux/i.test(name)) return true;
  if (/^confirm\.json$/i.test(name)) return true;
  return false;
}

function destFor(name) {
  if (/^real-world-/i.test(name)) return "real_world";
  return "benchmarks";
}

function listLeaves(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) listLeaves(full, acc);
    else if (/\.json$/i.test(name) && isLinuxLeaf(name)) acc.push(full);
  }
  return acc;
}

function confirmIsLinux(abs) {
  if (!/confirm\.json$/i.test(abs)) return true;
  try {
    const data = JSON.parse(readFileSync(abs, "utf8"));
    const p = String(data.runner?.platform || "").toLowerCase();
    if (!p) return true;
    return p.includes("linux") || p === "ubuntu";
  } catch {
    return true;
  }
}

export function publishCiResults({ fromDir, root = rootDir, scope = "all" } = {}) {
  const src = fromDir || join(root, "results");
  const benchDest = join(root, "results", "benchmarks");
  const realDest = join(root, "results", "real_world");
  const doBench = scope === "all" || scope === "bench";
  const doReal = scope === "all" || scope === "real-world";
  if (doBench) {
    rmSync(benchDest, { recursive: true, force: true });
    mkdirSync(benchDest, { recursive: true });
  }
  if (doReal) {
    rmSync(realDest, { recursive: true, force: true });
    mkdirSync(realDest, { recursive: true });
  }

  let n = 0;
  for (const abs of listLeaves(src)) {
    const name = abs.replace(/\\/g, "/").split("/").pop();
    const kind = destFor(name);
    if (kind === "real_world" && !doReal) continue;
    if (kind !== "real_world" && !doBench) continue;
    if (/confirm\.json$/i.test(name) && !confirmIsLinux(abs)) continue;
    const destDir = kind === "real_world" ? realDest : benchDest;
    mkdirSync(destDir, { recursive: true });
    copyFileSync(abs, join(destDir, name));
    n++;
  }
  return { copied: n, benchDest, realDest };
}

function parseArgs(argv) {
  const args = { from: join(rootDir, "results"), scope: "all" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--from") args.from = argv[++i];
    else if (argv[i] === "--scope") args.scope = argv[++i];
  }
  return args;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const { copied, benchDest, realDest } = publishCiResults({ fromDir: args.from, scope: args.scope });
  console.log(`published ${copied} Linux artifact(s) → ${benchDest} and ${realDest} (previous snapshot cleared)`);
}
