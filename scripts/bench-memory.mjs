#!/usr/bin/env node
/**
 * Memory tracking — separate from timing benchmarks (does not share a process
 * with the speed suite).
 *
 * Each tool runs in its own child (`memory-worker.mjs`) so RSS reflects that
 * tool only:
 *   - CLI tools: child process WorkingSet/RSS of the tool binary
 *   - In-process NAPI: isolated Node worker; min/max/avg RSS during work,
 *     plus delta vs baseline after GC in that worker
 *
 * Usage:
 *   node --expose-gc scripts/bench-memory.mjs
 *   pnpm bench:memory
 *   node scripts/bench-memory.mjs --fixture fixtures/50 --samples 3
 */
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectVueFiles } from "./lib/fixtures.mjs";
import { collectVersions } from "./lib/versions.mjs";
import { buildMemoryTasks } from "./lib/memory-tasks.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const workerPath = join(rootDir, "scripts", "memory-worker.mjs");

function parseArgs(argv) {
  const args = {
    fixture: "fixtures/50",
    samples: 3,
    fileLimit: 50,
    checkFileLimit: 50,
    metaFileLimit: 30,
    compileTargets: "vdom",
    compileEnvs: "production",
    surfaces: "",
    json: "",
    out: "",
    work: "work/memory",
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--fixture") args.fixture = next();
    else if (a === "--samples") args.samples = Number.parseInt(next(), 10);
    else if (a === "--file-limit") args.fileLimit = Number.parseInt(next(), 10);
    else if (a === "--check-file-limit") args.checkFileLimit = Number.parseInt(next(), 10);
    else if (a === "--meta-file-limit") args.metaFileLimit = Number.parseInt(next(), 10);
    else if (a === "--compile-targets") args.compileTargets = next();
    else if (a === "--compile-envs") args.compileEnvs = next();
    else if (a === "--surfaces") args.surfaces = next();
    else if (a === "--json") args.json = next();
    else if (a === "--out") args.out = next();
    else if (a === "--work") args.work = next();
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function runWorker(task, taskDir) {
  const taskFile = join(taskDir, `${task.id}.json`);
  writeFileSync(taskFile, `${JSON.stringify(task)}\n`);
  const r = spawnSync(process.execPath, ["--expose-gc", workerPath, "--task", taskFile], {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: "1" },
  });
  const lines = String(r.stdout || "")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const last = lines[lines.length - 1];
  if (!last) {
    return {
      id: task.id,
      status: "error",
      label: task.label,
      package: task.package,
      surface: task.surface,
      error: r.stderr || `worker exit ${r.status}`,
    };
  }
  try {
    return JSON.parse(last);
  } catch {
    return {
      id: task.id,
      status: "error",
      error: `bad worker JSON: ${last.slice(0, 200)}`,
    };
  }
}

function median(nums) {
  const s = [...nums].filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return Number.NaN;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function pickSeries(ok, keys) {
  for (const key of keys) {
    const vals = ok
      .map((s) => {
        if (key.includes(".")) {
          const [a, b] = key.split(".");
          return s[a]?.[b];
        }
        return s[key];
      })
      .filter(Number.isFinite);
    if (vals.length) return vals;
  }
  return [];
}

function aggregateSamples(sampleResults) {
  const ok = sampleResults.filter(
    (s) => s.status === "ok" && (Number.isFinite(s.minRssMb) || Number.isFinite(s.deltaMinMb)),
  );
  if (!ok.length) {
    const err = sampleResults.find((s) => s.status === "error" || s.error);
    const skip = sampleResults.find((s) => s.status === "skipped");
    return {
      status: err ? "error" : "skipped",
      error: err?.error || "no valid memory samples",
      skip: skip?.skip,
    };
  }

  const isCli = String(ok[0].isolation || "").startsWith("cli");
  // CLI: absolute child RSS. In-process: delta vs worker baseline.
  const mins = isCli ? pickSeries(ok, ["minRssMb"]) : pickSeries(ok, ["deltaMinMb", "minRssMb"]);
  const maxs = isCli ? pickSeries(ok, ["maxRssMb"]) : pickSeries(ok, ["deltaMaxMb", "maxRssMb"]);
  const avgs = isCli ? pickSeries(ok, ["avgRssMb"]) : pickSeries(ok, ["deltaAvgMb", "avgRssMb"]);

  if (!mins.length || !maxs.length || !avgs.length) {
    return {
      status: "error",
      error: "non-finite memory metrics",
    };
  }

  const heapMins = pickSeries(ok, ["heap.minMb"]);
  const heapMaxs = pickSeries(ok, ["heap.maxMb"]);
  const heapAvgs = pickSeries(ok, ["heap.avgMb"]);
  const cpuTotals = pickSeries(ok, ["cpu.totalMs"]);
  const cpuPercents = pickSeries(ok, ["cpu.percent"]);
  const cpuUsers = pickSeries(ok, ["cpu.userMs"]);
  const cpuSystems = pickSeries(ok, ["cpu.systemMs"]);
  const walls = pickSeries(ok, ["cpu.wallMs"]);
  const mallocPeaks = pickSeries(ok, ["heap.peakMallocedMb", "heap.mallocDeltaMaxMb"]);

  return {
    status: "ok",
    isolation: ok[0].isolation,
    note: ok[0].note,
    // RSS / working set (tool-attributed)
    minMb: Number(median(mins).toFixed(2)),
    maxMb: Number(median(maxs).toFixed(2)),
    avgMb: Number(median(avgs).toFixed(2)),
    peakMaxMb: Number(Math.max(...maxs).toFixed(2)),
    troughMinMb: Number(Math.min(...mins).toFixed(2)),
    // Allocations: heap (inproc) or private bytes (CLI on Windows)
    allocMinMb: heapMins.length ? Number(median(heapMins).toFixed(2)) : Number.NaN,
    allocMaxMb: heapMaxs.length ? Number(median(heapMaxs).toFixed(2)) : Number.NaN,
    allocAvgMb: heapAvgs.length ? Number(median(heapAvgs).toFixed(2)) : Number.NaN,
    allocPeakMb: heapMaxs.length ? Number(Math.max(...heapMaxs).toFixed(2)) : Number.NaN,
    mallocPeakMb: mallocPeaks.length ? Number(median(mallocPeaks).toFixed(2)) : Number.NaN,
    // CPU
    cpuTotalMs: cpuTotals.length ? Number(median(cpuTotals).toFixed(2)) : Number.NaN,
    cpuUserMs: cpuUsers.length ? Number(median(cpuUsers).toFixed(2)) : Number.NaN,
    cpuSystemMs: cpuSystems.length ? Number(median(cpuSystems).toFixed(2)) : Number.NaN,
    cpuPercent: cpuPercents.length ? Number(median(cpuPercents).toFixed(1)) : Number.NaN,
    wallMs: walls.length ? Number(median(walls).toFixed(2)) : Number.NaN,
    samples: ok.length,
    raw: ok.map((s) => ({
      minRssMb: s.minRssMb,
      maxRssMb: s.maxRssMb,
      avgRssMb: s.avgRssMb,
      deltaMinMb: s.deltaMinMb,
      deltaMaxMb: s.deltaMaxMb,
      deltaAvgMb: s.deltaAvgMb,
      baselineRssMb: s.baselineRssMb,
      heap: s.heap,
      cpu: s.cpu,
    })),
  };
}

function fmt(n, digits = 2) {
  return Number.isFinite(n) ? n.toFixed(digits) : "n/a";
}

function renderMarkdown(data) {
  const lines = [];
  lines.push("# Resource probe results (memory + allocations + CPU)");
  lines.push("");
  lines.push(
    "Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.",
  );
  lines.push("");
  lines.push(`- **Generated:** ${data.generatedAt}`);
  lines.push(`- **Fixture:** \`${data.fixture}\``);
  lines.push(`- **Samples per tool:** ${data.settings.samples}`);
  lines.push(
    `- **File limit:** ${data.settings.fileLimit} (typecheck ${data.settings.checkFileLimit}, meta ${data.settings.metaFileLimit})`,
  );
  lines.push("");
  lines.push("### Metrics");
  lines.push("");
  lines.push("| Column | Meaning |");
  lines.push("| --- | --- |");
  lines.push(
    "| **RSS min/max/avg** | Resident set: CLI = child WorkingSet/RSS; in-process = delta vs GC baseline |",
  );
  lines.push(
    "| **Alloc min/max/avg** | In-process: V8 `heapUsed` delta; CLI (Windows): private bytes (`PrivateMemorySize64`) |",
  );
  lines.push(
    "| **CPU total / %** | Process CPU time (user+system) and % of wall time on one core (`cpu/wall×100`) |",
  );
  lines.push("");

  const bySurface = new Map();
  for (const row of data.results) {
    if (!bySurface.has(row.surface)) bySurface.set(row.surface, []);
    bySurface.get(row.surface).push(row);
  }

  for (const [surface, rows] of bySurface) {
    lines.push(`### ${surface}`);
    lines.push("");
    lines.push(
      "| Tool | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms |",
    );
    lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
    const sorted = [...rows].sort((a, b) => {
      if (a.status !== "ok") return 1;
      if (b.status !== "ok") return -1;
      return (a.avgMb ?? Infinity) - (b.avgMb ?? Infinity);
    });
    for (const r of sorted) {
      if (r.status === "ok") {
        lines.push(
          `| ${r.label} | ok | ${fmt(r.minMb)} | ${fmt(r.maxMb)} | ${fmt(r.avgMb)} | ${fmt(r.allocMinMb)} | ${fmt(r.allocMaxMb)} | ${fmt(r.allocAvgMb)} | ${fmt(r.cpuTotalMs)} | ${fmt(r.cpuPercent, 1)} | ${fmt(r.wallMs)} |`,
        );
      } else if (r.status === "skipped") {
        lines.push(
          `| ${r.label} | skipped | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |`,
        );
      } else {
        lines.push(
          `| ${r.label || r.id} | error | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |`,
        );
      }
    }
    lines.push("");
  }

  lines.push("### Versions");
  lines.push("");
  for (const [k, v] of Object.entries(data.versions || {})) {
    lines.push(`- ${k}: ${v}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node --expose-gc scripts/bench-memory.mjs [options]

Options:
  --fixture PATH           (default fixtures/50)
  --samples N              repeats per tool (default 3)
  --file-limit N           (default 50)
  --check-file-limit N
  --meta-file-limit N
  --compile-targets LIST   default vdom
  --compile-envs LIST      default production
  --surfaces LIST          filter by surface id
  --json FILE
  --out FILE

Does not run the timing benchmark. Safe to run in parallel with pnpm bench
only if machine load is acceptable; prefer sequential for cleaner numbers.
`);
    process.exit(0);
  }

  const fixtureDir = resolve(rootDir, args.fixture);
  if (!existsSync(fixtureDir)) {
    console.error(`Fixture not found: ${fixtureDir}`);
    console.error("Run: pnpm generate");
    process.exit(1);
  }

  const workRoot = resolve(rootDir, args.work);
  mkdirSync(workRoot, { recursive: true });
  const taskDir = join(workRoot, "tasks");
  rmSync(taskDir, { recursive: true, force: true });
  mkdirSync(taskDir, { recursive: true });

  let tasks = buildMemoryTasks(fixtureDir, {
    fileLimit: args.fileLimit,
    checkFileLimit: args.checkFileLimit,
    metaFileLimit: args.metaFileLimit,
    compileTargets: args.compileTargets,
    compileEnvs: args.compileEnvs,
    workRoot,
  });

  if (args.surfaces) {
    const allow = new Set(args.surfaces.split(",").map((s) => s.trim()));
    tasks = tasks.filter((t) => allow.has(t.surface));
  }

  console.log(`Memory probe — fixture ${args.fixture}`);
  console.log(
    `Tasks: ${tasks.length} · samples/tool: ${args.samples} · fileLimit: ${args.fileLimit}`,
  );
  console.log("Each tool = dedicated child process (isolated from timing bench).\n");

  const results = [];
  for (const task of tasks) {
    process.stdout.write(`→ ${task.id} ... `);
    if (task.skip) {
      console.log("skip");
      results.push({
        id: task.id,
        label: task.label,
        package: task.package,
        surface: task.surface,
        status: "skipped",
        skip: task.skip,
      });
      continue;
    }

    const sampleResults = [];
    for (let i = 0; i < args.samples; i++) {
      sampleResults.push(runWorker(task, taskDir));
    }
    const agg = aggregateSamples(sampleResults);
    const row = {
      id: task.id,
      label: task.label,
      package: task.package,
      surface: task.surface,
      ...agg,
    };
    results.push(row);
    if (row.status === "ok") {
      console.log(
        `ok  RSS avg=${row.avgMb} MiB  alloc avg=${Number.isFinite(row.allocAvgMb) ? row.allocAvgMb : "n/a"} MiB  CPU=${Number.isFinite(row.cpuTotalMs) ? row.cpuTotalMs + "ms" : "n/a"} (${Number.isFinite(row.cpuPercent) ? row.cpuPercent + "%" : "n/a"})`,
      );
    } else {
      console.log(row.status, row.error || row.skip || "");
    }
  }

  const data = {
    kind: "memory",
    generatedAt: new Date().toISOString(),
    fixture: args.fixture,
    settings: {
      samples: args.samples,
      fileLimit: args.fileLimit,
      checkFileLimit: args.checkFileLimit,
      metaFileLimit: args.metaFileLimit,
      compileTargets: args.compileTargets,
      compileEnvs: args.compileEnvs,
    },
    versions: collectVersions(),
    results,
  };

  const md = renderMarkdown(data);
  const resultsDir = join(rootDir, "results");
  mkdirSync(resultsDir, { recursive: true });
  const jsonPath =
    args.json || join(resultsDir, `memory-${process.platform}-${args.fileLimit}.json`);
  const mdPath = args.out || join(resultsDir, `memory-${process.platform}-${args.fileLimit}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(mdPath, md);
  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main();
