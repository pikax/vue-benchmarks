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
import { renderMemoryMarkdown } from "./lib/memory-report.mjs";
import {
  compileValidityConfigKey,
  runCompileValidityChildren,
} from "./lib/compile-validity-gates.mjs";

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
      comparisonClass: task.comparisonClass,
      error: r.stderr || `worker exit ${r.status}`,
    };
  }
  try {
    return JSON.parse(last);
  } catch {
    return {
      id: task.id,
      status: "error",
      label: task.label,
      package: task.package,
      surface: task.surface,
      comparisonClass: task.comparisonClass,
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

function aggregateValidity(samples) {
  const verdicts = samples.map((sample) => sample.validity).filter(Boolean);
  if (verdicts.some((verdict) => verdict.status === "fail")) {
    return {
      status: "fail",
      detail: verdicts.find((verdict) => verdict.status === "fail")?.detail ?? "validation failed",
      samples: verdicts,
    };
  }
  if (
    verdicts.length !== samples.length ||
    verdicts.some((verdict) => verdict.status === "unknown")
  ) {
    return {
      status: "unknown",
      detail:
        verdicts.find((verdict) => verdict.status === "unknown")?.detail ??
        `only ${verdicts.length}/${samples.length} resource samples returned a validity verdict`,
      samples: verdicts,
    };
  }
  return {
    status: "pass",
    detail: verdicts[0]?.detail ?? "every resource sample passed validation",
    samples: verdicts,
  };
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
  const failedSamples = sampleResults.filter((sample) => sample.status !== "ok");
  const validity = failedSamples.length
    ? {
        status: "fail",
        detail: `${failedSamples.length}/${sampleResults.length} resource samples failed: ${failedSamples[0].error ?? failedSamples[0].status}`,
        samples: sampleResults.map((sample) =>
          sample.status === "ok"
            ? (sample.validity ?? {
                status: "unknown",
                detail: "sample returned no validity verdict",
              })
            : { status: "fail", detail: sample.error ?? sample.status },
        ),
      }
    : aggregateValidity(ok);

  return {
    // Invalid/unverified figures remain visible: resource use happened. They are
    // marked outside the comparable set instead of erased as if the tool never
    // ran.
    status:
      validity.status === "pass" ? "ok" : validity.status === "fail" ? "invalid" : "unverified",
    validity,
    isolation: ok[0].isolation,
    note: ok[0].note,
    // RSS / working set (tool-attributed)
    minMb: Number(median(mins).toFixed(2)),
    maxMb: Number(median(maxs).toFixed(2)),
    avgMb: Number(median(avgs).toFixed(2)),
    peakMaxMb: Number(Math.max(...maxs).toFixed(2)),
    troughMinMb: Number(Math.min(...mins).toFixed(2)),
    // LSP sessions split the tree like the typecheck surface: a spawned tsgo
    // child (verter/vize) or Volar's tsserver half is the engine's share.
    // Taken from the sample with the highest server total, so tool + engine
    // sums to one consistent peak.
    ...(() => {
      const withSplit = ok.filter((s) =>
        Number.isFinite(s.lspResource?.serverRssToolMb),
      );
      if (!withSplit.length) return {};
      const peak = withSplit.reduce((a, b) =>
        (b.lspResource.serverRssMaxMb ?? 0) > (a.lspResource.serverRssMaxMb ?? 0) ? b : a,
      );
      return {
        rssToolMb: peak.lspResource.serverRssToolMb,
        rssEngineMb: peak.lspResource.serverRssEngineMb ?? null,
      };
    })(),
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
      exitCode: s.exitCode,
      output: s.output,
      validity: s.validity,
    })),
  };
}

function compileValidityEntrypoint(task) {
  if (task.surface !== "compile") return null;
  if (task.id.startsWith("mem-vue-3.5")) return "vue-3.5";
  if (task.id.startsWith("mem-vue-3.6")) return "vue-3.6";
  if (task.id.startsWith("mem-vue-style-reference")) {
    return task.package === "@vue/compiler-sfc-36" ? "vue-3.6" : "vue-3.5";
  }
  if (task.id.startsWith("mem-vize-1t")) return "vize-single";
  if (task.id.includes("vize-full-sfc-batch") || task.id.includes("vize-raw-render-batch")) {
    return "vize-batch";
  }
  if (task.id.startsWith("mem-verter-")) return "verter-compile-many";
  if (task.id.startsWith("mem-fervid-")) return "fervid-sync";
  return null;
}

function semanticVerdictDetail(verdict) {
  if (verdict?.reason) return verdict.reason;
  const misses = (verdict?.results ?? []).filter((result) => result.status !== "PASS");
  if (!misses.length) return `${verdict?.passed ?? 0}/${verdict?.plantCount ?? 0} plants passed`;
  const examples = misses
    .slice(0, 3)
    .map((miss) => `${miss.id}${miss.detail ? `: ${miss.detail}` : ""}`)
    .join("; ");
  return `${misses.length}/${verdict?.plantCount ?? misses.length} plants did not pass: ${examples}`;
}

function applyCompileSemanticValidity(results, tasks) {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const configs = new Map();
  for (const task of tasks) {
    const entrypoint = compileValidityEntrypoint(task);
    if (!entrypoint || task.skip) continue;
    const target = task.id.includes("-vapor-") ? "vapor" : "vdom";
    const env = task.id.endsWith("-prod") ? "production" : "development";
    const key = compileValidityConfigKey({ target, env, sourceMap: false });
    if (!configs.has(key)) configs.set(key, { target, env, entrypoints: new Set() });
    configs.get(key).entrypoints.add(entrypoint);
  }

  const suites = {};
  for (const [key, config] of configs) {
    suites[key] = runCompileValidityChildren({
      target: config.target,
      env: config.env,
      sourceMap: false,
      entrypoints: [...config.entrypoints],
    });
  }

  for (const row of results) {
    const task = taskById.get(row.id);
    const entrypoint = task ? compileValidityEntrypoint(task) : null;
    if (!entrypoint || row.status === "error" || row.status === "skipped") continue;
    const target = task.id.includes("-vapor-") ? "vapor" : "vdom";
    const env = task.id.endsWith("-prod") ? "production" : "development";
    const key = compileValidityConfigKey({ target, env, sourceMap: false });
    const verdict = suites[key]?.results?.[entrypoint];
    row.semanticValidity = verdict ?? {
      status: "UNKNOWN",
      reason: "no exact-entrypoint compile semantic verdict was produced",
    };
    if (row.semanticValidity.status === "FAIL") row.status = "invalid";
    else if (row.semanticValidity.status !== "PASS" && row.status !== "invalid") {
      row.status = "unverified";
    }
    row.validity = {
      ...(row.validity ?? {}),
      semanticStatus: row.semanticValidity.status,
      semanticDetail: semanticVerdictDetail(row.semanticValidity),
    };
  }
  return suites;
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
        comparisonClass: task.comparisonClass,
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
      comparisonClass: task.comparisonClass,
      ...agg,
    };
    results.push(row);
    if (["ok", "invalid", "unverified"].includes(row.status)) {
      console.log(
        `${row.status}  RSS avg=${row.avgMb} MiB  alloc avg=${Number.isFinite(row.allocAvgMb) ? row.allocAvgMb : "n/a"} MiB  CPU=${Number.isFinite(row.cpuTotalMs) ? row.cpuTotalMs + "ms" : "n/a"} (${Number.isFinite(row.cpuPercent) ? row.cpuPercent + "%" : "n/a"})`,
      );
    } else {
      console.log(row.status, row.error || row.skip || "");
    }
  }

  // Semantic plants run only after every resource sample. Each plant uses a
  // separate child process, so native/JIT/thread/allocator state cannot affect
  // the already-recorded memory figures.
  const compileSemanticValidation = applyCompileSemanticValidity(results, tasks);
  for (const row of results) {
    if (!row.semanticValidity || row.semanticValidity.status === "PASS") continue;
    console.log(
      `  validation ${row.id}: ${row.status} — ${row.validity?.semanticDetail ?? "no detail"}`,
    );
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
    validation: { compileSemantics: compileSemanticValidation },
    results,
  };

  const md = renderMemoryMarkdown(data);
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
