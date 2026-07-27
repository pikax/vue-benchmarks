#!/usr/bin/env node
/**
 * Isolated memory worker — one tool per process.
 * Spawned with: node --expose-gc scripts/memory-worker.mjs --task <path.json>
 *
 * Prints a single JSON object to stdout (last line).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CPU_FLOOR_MS,
  forceGc,
  linuxCpuMs,
  pidTreeRssBytes,
  sampleWhile,
  summarizeSamples,
} from "./lib/memory.mjs";
import { copyFixtureSubset } from "./lib/fixtures.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = { task: "" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--task") args.task = argv[++i];
  }
  return args;
}

function vueCompileSfc(compiler, source, filename, { vapor, isProd }) {
  const { descriptor } = compiler.parse(source, { filename });
  let bindings = {};
  const scriptOpts = { id: filename, inlineTemplate: false, isProd };
  if (vapor) {
    scriptOpts.vapor = true;
    scriptOpts.templateOptions = { vapor: true, isProd };
  }
  if (descriptor.scriptSetup || descriptor.script) {
    const scriptResult = compiler.compileScript(descriptor, scriptOpts);
    bindings = scriptResult.bindings || {};
  }
  if (descriptor.template) {
    const templateOpts = {
      source: descriptor.template.content,
      filename,
      id: filename,
      isProd,
      compilerOptions: {
        bindingMetadata: bindings,
        mode: "module",
        hoistStatic: isProd,
        cacheHandlers: isProd,
        prefixIdentifiers: true,
      },
    };
    if (vapor) templateOpts.vapor = true;
    compiler.compileTemplate(templateOpts);
  }
}

const handlers = {
  async "vue-compile-sfc"(payload) {
    const compiler = require(require.resolve(payload.packageName, { paths: [rootDir] }));
    for (const f of payload.sources) {
      vueCompileSfc(compiler, f.source, f.filename, {
        vapor: payload.vapor,
        isProd: payload.isProd,
      });
    }
  },

  async "vize-compile-sfc"(payload) {
    const vize = require(require.resolve("@vizejs/native", { paths: [rootDir] }));
    for (const f of payload.sources) {
      const result = vize.compileSfc(f.source, {
        filename: f.filename,
        vapor: payload.vapor,
        sourceMap: payload.sourceMap,
        isTs: true,
      });
      if (result?.errors?.length) throw new Error(result.errors.join("; "));
    }
  },

  async "vize-compile-batch"(payload) {
    const vize = require(require.resolve("@vizejs/native", { paths: [rootDir] }));
    const result = vize.compileSfcBatchWithResults(
      payload.sources.map((f) => ({ path: f.filename, source: f.source })),
      { vapor: payload.vapor, isTs: true },
    );
    if (result.failedCount) throw new Error(`vize batch failed ${result.failedCount}`);
  },

  async "verter-compile-many"(payload) {
    const { VerterHost } = require(require.resolve("@verter/native", { paths: [rootDir] }));
    const host = new VerterHost({ devMode: !payload.isProd });
    const batchInputs = payload.sources.map((f) => ({
      canonicalId: (f.path || f.filename).replace(/\\/g, "/"),
      source: f.source,
      requestedMode: "stateless",
    }));
    const results = host.compileMany(batchInputs, {
      target: "runtime-render",
      defaultMode: "stateless",
      priority: "interactive",
      compileProfile: {
        isProduction: payload.isProd,
        customElement: false,
        ssr: false,
        forceJs: true,
        forceVapor: payload.vapor,
        sourceMap: !payload.isProd,
        hmrStrategy: payload.isProd ? "none" : "vite",
        runtimeModuleName: "vue",
      },
    });
    const failed = results.filter((r) => r.errors?.length);
    if (failed.length) throw new Error(String(failed[0].errors[0]));
  },

  async "jsx-compiler-rs"(payload) {
    const { transform } = require(
      require.resolve("@vue-jsx-vapor/compiler-rs", { paths: [rootDir] }),
    );
    for (const f of payload.sources) {
      const r = transform(f.source, payload.interop ? { interop: true } : undefined);
      if (!r?.code && typeof r !== "string") throw new Error(`empty ${f.filename}`);
    }
  },

  async "jsx-babel-vue"(payload) {
    const babel = require(require.resolve("@babel/core", { paths: [rootDir] }));
    const pluginMod = require(require.resolve("@vue/babel-plugin-jsx", { paths: [rootDir] }));
    const plugin = pluginMod.default ?? pluginMod;
    for (const f of payload.sources) {
      const r = babel.transformSync(f.source, {
        plugins: [plugin],
        filename: f.filename,
        sourceMaps: false,
        babelrc: false,
        configFile: false,
      });
      if (!r?.code) throw new Error(`empty ${f.filename}`);
    }
  },

  async "format-cli"(payload) {
    const dest = join(payload.workRoot, "fmt", payload.id, String(process.pid));
    copyFixtureSubset(payload.fixtureDir, dest, payload.files, [
      "package.json",
      "tsconfig.json",
      "eslint.config.mjs",
    ]);
    const r = spawnSync(payload.bin, payload.args, {
      cwd: dest,
      encoding: "utf8",
      shell: payload.shell,
      env: { ...process.env, NO_COLOR: "1" },
      maxBuffer: 64 * 1024 * 1024,
    });
    if (r.error) throw r.error;
  },

  async "eslint-vue"(payload) {
    const { ESLint } = await import("eslint");
    const configFile = join(payload.fixtureDir, "eslint.config.mjs");
    const eslint = new ESLint({
      overrideConfigFile: existsSync(configFile) ? configFile : undefined,
      cwd: payload.fixtureDir,
    });
    await eslint.lintFiles(payload.files);
  },

  async "verter-lint"(payload) {
    const { VerterHost } = require(require.resolve("@verter/native", { paths: [rootDir] }));
    const host = new VerterHost({ devMode: false });
    for (const f of payload.sources) {
      const path = (f.path || f.filename).replace(/\\/g, "/");
      if (typeof host.upsert === "function") {
        host.upsert({
          inputId: path,
          canonicalId: path,
          source: f.source,
          fileKind: "vue",
        });
      }
      if (typeof host.lint === "function") host.lint(path);
      else throw new Error("VerterHost.lint not available");
    }
  },

  /**
   * Language-server footprint. Runs the SAME session the timed LSP surface
   * runs, but with sampling enabled and nothing being timed — memory is always
   * measured in its own pass, never beside speed.
   */
  async "lsp-session"(payload) {
    const { runLspSession, resolveVolarServer, resolveVizeLsp, resolveVerterLsp, resolveTsdk } =
      await import("./lib/surfaces/lsp.mjs");
    const { ensureLspWorkspace } = await import("./lib/lsp-workspace.mjs");

    const resolve = { volar: resolveVolarServer, vize: resolveVizeLsp, verter: resolveVerterLsp };
    const server = resolve[payload.server]?.();
    if (!server) throw new Error(`${payload.server} language server not available`);

    const ws = ensureLspWorkspace({ bulkFiles: payload.bulkFiles ?? 20 });
    const tsdk = resolveTsdk();

    const out = await runLspSession({
      name: payload.server,
      command: server.command,
      args: payload.server === "verter" ? [...(server.args ?? []), ws.dir] : server.args,
      shell: server.shell,
      rootDir: ws.dir,
      filePath: ws.file,
      source: ws.source,
      probe: ws.probe,
      initializationOptions: payload.server === "volar" ? { typescript: { tsdk } } : {},
      readyNotifications: payload.server === "verter" ? ["$/verter/ready"] : [],
      volarHybrid: payload.server === "volar",
      tsdkPath: tsdk,
      // Poll hard: nothing here is timed, so sampling cost is free.
      sampleResources: true,
      resourcePollMs: Number(process.env.MEM_LSP_POLL_MS ?? 10),
    });
    // Surfaced through the task result for the report.
    return { lspResource: out.resource, hoverValid: out.hoverValid };
  },

  async "vue-component-meta"(payload) {
    const { createChecker } = require(require.resolve("vue-component-meta", { paths: [rootDir] }));
    const checker = createChecker(payload.tsconfig, { forceUseTs: true });
    for (const file of payload.files) checker.getComponentMeta(file);
  },

  async "verter-component-meta"(payload) {
    const { ComponentMetaHost } = require(require.resolve("@verter/native", { paths: [rootDir] }));
    const project = new ComponentMetaHost({ devMode: false });
    for (const f of payload.sources) project.upsertBase(f.path, f.source);
    const session = project.openSession();
    for (const f of payload.sources) session.getComponentMeta(f.path);
    project.shutdown?.();
  },
};

function escapePsSingle(s) {
  return String(s).replace(/'/g, "''");
}

/**
 * Windows: PowerShell owns the process lifetime and samples WorkingSet in-process
 * (Node→PowerShell roundtrips are too slow for short-lived CLIs).
 */
function runCliWindows(cli) {
  // Hard ceiling so a wedged tool fails its row instead of hanging the suite.
  const timeoutMs = Number(cli.timeoutMs ?? process.env.MEM_CLI_TIMEOUT_MS ?? 180_000);
  const argList = (cli.args || []).map((a) => `'${escapePsSingle(a)}'`).join(", ");
  const envLines = Object.entries(cli.env || {})
    .map(([k, v]) => `$psi.Environment['${escapePsSingle(k)}'] = '${escapePsSingle(v)}'`)
    .join("; ");

  const ps = `
$ErrorActionPreference = 'Stop'
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = '${escapePsSingle(cli.bin)}'
$psi.Arguments = [string]::Join(' ', @(${argList || "''"}))
$psi.WorkingDirectory = '${escapePsSingle(cli.cwd)}'
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true
${envLines}
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$p = [System.Diagnostics.Process]::Start($psi)
# Drain stdout/stderr asynchronously, BEFORE polling.
#
# Both streams are redirected above. If nobody reads them, the child blocks on
# write as soon as it fills the ~4KB pipe buffer, so it never exits, so
# HasExited never becomes true and the poll loop below spins forever. That is
# exactly what happened: the probe hung indefinitely on the first CLI tool
# (vue-tsc) because it out-writes the buffer. ReadToEndAsync keeps the pipes
# drained while we sample memory.
$outTask = $p.StandardOutput.ReadToEndAsync()
$errTask = $p.StandardError.ReadToEndAsync()
$ws = New-Object System.Collections.Generic.List[Int64]
$priv = New-Object System.Collections.Generic.List[Int64]
$timedOut = $false
while (-not $p.HasExited) {
  if ($sw.Elapsed.TotalMilliseconds -gt ${timeoutMs}) {
    $timedOut = $true
    try { $p.Kill() } catch {}
    break
  }
  try {
    $p.Refresh()
    if ($p.WorkingSet64 -gt 0) { [void]$ws.Add([Int64]$p.WorkingSet64) }
    if ($p.PrivateMemorySize64 -gt 0) { [void]$priv.Add([Int64]$p.PrivateMemorySize64) }
  } catch {}
  Start-Sleep -Milliseconds 1
}
if ($timedOut) {
  try { $p.WaitForExit(5000) } catch {}
  Write-Output 'TIMEOUT'
  exit 0
}
$p.WaitForExit()
$sw.Stop()
try {
  $p.Refresh()
  if ($p.WorkingSet64 -gt 0) { [void]$ws.Add([Int64]$p.WorkingSet64) }
  if ($p.PrivateMemorySize64 -gt 0) { [void]$priv.Add([Int64]$p.PrivateMemorySize64) }
} catch {}
# Kernel high-water mark: exact peak regardless of what polling missed.
try { if ($p.PeakWorkingSet64 -gt 0) { [void]$ws.Add([Int64]$p.PeakWorkingSet64) } } catch {}
if ($ws.Count -eq 0) {
  Write-Output 'EMPTY'
  exit 0
}
$wsMin = ($ws | Measure-Object -Minimum).Minimum
$wsMax = ($ws | Measure-Object -Maximum).Maximum
$wsAvg = ($ws | Measure-Object -Average).Average
$prMin = if ($priv.Count -gt 0) { ($priv | Measure-Object -Minimum).Minimum } else { 0 }
$prMax = if ($priv.Count -gt 0) { ($priv | Measure-Object -Maximum).Maximum } else { 0 }
$prAvg = if ($priv.Count -gt 0) { ($priv | Measure-Object -Average).Average } else { 0 }
# TotalProcessorTime is TimeSpan after exit
$cpuMs = 0
try { $cpuMs = [math]::Round($p.TotalProcessorTime.TotalMilliseconds, 2) } catch {}
$userMs = 0
try { $userMs = [math]::Round($p.UserProcessorTime.TotalMilliseconds, 2) } catch {}
$wallMs = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
Write-Output ("{0} {1} {2} {3} {4} {5} {6} {7} {8} {9}" -f $wsMin, $wsMax, $wsAvg, $ws.Count, $prMin, $prMax, $prAvg, $cpuMs, $userMs, $wallMs)
`;

  const psFile = join(rootDir, "work", "memory", `ps-${process.pid}-${Date.now()}.ps1`);
  mkdirSync(dirname(psFile), { recursive: true });
  writeFileSync(psFile, ps, "utf8");

  const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", psFile], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
    // Backstop: even if the PowerShell-side guard fails, never hang the suite.
    timeout: timeoutMs + 30_000,
  });
  try {
    // best-effort cleanup
    // eslint-disable-next-line no-empty
  } catch {}

  const line = String(r.stdout || "")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .pop();
  if (line === "TIMEOUT" || r.error?.code === "ETIMEDOUT") {
    return {
      ...summarizeSamples([], 0),
      status: "error",
      error: `tool exceeded ${timeoutMs}ms and was killed — row failed rather than hanging the suite`,
      isolation: "cli-child-rss",
      baselineRssMb: 0,
    };
  }
  if (!line || line === "EMPTY") {
    return {
      ...summarizeSamples([], 0),
      status: "error",
      error: `no child RSS samples (ps exit ${r.status}): ${(r.stderr || "").slice(0, 200)}`,
      isolation: "cli-child-rss",
      baselineRssMb: 0,
    };
  }
  const parts = line.split(/\s+/).map(Number);
  const [minB, maxB, avgB, count, prMin, prMax, prAvg, cpuMs, userMs, wallMs] = parts;
  if (![minB, maxB, avgB].every(Number.isFinite)) {
    return {
      status: "error",
      error: `bad ps sample line: ${line}`,
      isolation: "cli-child-rss",
    };
  }
  const toMb = (b) => Number((b / (1024 * 1024)).toFixed(2));
  const cpuTotal = Number.isFinite(cpuMs) ? cpuMs : Number.NaN;
  const cpuPercent =
    Number.isFinite(wallMs) && wallMs > 0 && Number.isFinite(cpuTotal)
      ? Number(((cpuTotal / wallMs) * 100).toFixed(1))
      : Number.NaN;
  return {
    sampleCount: count,
    minRssMb: toMb(minB),
    maxRssMb: toMb(maxB),
    avgRssMb: toMb(avgB),
    deltaMinMb: toMb(minB),
    deltaMaxMb: toMb(maxB),
    deltaAvgMb: toMb(avgB),
    baselineRssMb: 0,
    heap: {
      // Private bytes ≈ committed private allocations (closer than WorkingSet)
      minMb: toMb(prMin || 0),
      maxMb: toMb(prMax || 0),
      avgMb: toMb(prAvg || 0),
      absMinMb: toMb(prMin || 0),
      absMaxMb: toMb(prMax || 0),
      absAvgMb: toMb(prAvg || 0),
      baselineMb: 0,
      peakMallocedMb: Number.NaN,
      mallocDeltaMaxMb: Number.NaN,
      note: "CLI private bytes (PrivateMemorySize64), not V8 heap",
    },
    cpu: (() => {
      // Same accounting floor as the in-process path: TotalProcessorTime is
      // driven by the same scheduler tick, so a short-lived CLI quantises
      // exactly as badly. Report n/a rather than a confident 0.
      const ok = Number.isFinite(wallMs) && wallMs >= CPU_FLOOR_MS;
      return {
        userMs: Number.isFinite(userMs) ? userMs : Number.NaN,
        systemMs:
          Number.isFinite(cpuTotal) && Number.isFinite(userMs)
            ? Number((cpuTotal - userMs).toFixed(2))
            : Number.NaN,
        totalMs: ok ? cpuTotal : null,
        percent: ok ? cpuPercent : null,
        reliable: ok,
        note: ok
          ? null
          : `window ${Number.isFinite(wallMs) ? wallMs.toFixed(1) : "?"}ms < ${CPU_FLOOR_MS}ms ${process.platform} CPU-accounting floor — not measurable`,
        floorMs: CPU_FLOOR_MS,
        wallMs: Number.isFinite(wallMs) ? wallMs : Number.NaN,
      };
    })(),
    isolation: "cli-child-rss",
    note: "RSS=WorkingSet; alloc≈PrivateMemorySize64; CPU=TotalProcessorTime (tool process only)",
  };
}

async function runCli(cli) {
  if (process.platform === "win32") {
    return runCliWindows(cli);
  }

  const rssSamples = [];
  let peakCpuMs = 0;
  const wall0 = process.hrtime.bigint();

  forceGc();

  const timeoutMs = Number(cli.timeoutMs ?? process.env.MEM_CLI_TIMEOUT_MS ?? 180_000);
  let timedOut = false;

  await new Promise((resolve, reject) => {
    const child = spawn(cli.bin, cli.args, {
      cwd: cli.cwd,
      env: { ...process.env, NO_COLOR: "1", ...(cli.env || {}) },
      shell: cli.shell ?? false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    // Drain both pipes. Same deadlock the Windows path hit: stdout/stderr are
    // piped, so once the child writes past the OS pipe buffer it blocks on
    // write and never exits, and 'close' never fires. We do not need the
    // output here — resume() discards it while keeping the pipe empty.
    child.stdout?.resume();
    child.stderr?.resume();

    const sample = () => {
      const rss = pidTreeRssBytes(child.pid);
      if (rss) rssSamples.push(rss);
      if (process.platform === "linux") {
        const cpu = linuxCpuMs(child.pid);
        if (Number.isFinite(cpu) && cpu > peakCpuMs) peakCpuMs = cpu;
      }
    };
    const iv = setInterval(sample, 1);
    if (typeof iv.unref === "function") iv.unref();
    sample();

    // Hard ceiling so a wedged tool fails its row instead of the suite.
    const killer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch {
        /* already gone */
      }
    }, timeoutMs);
    if (typeof killer.unref === "function") killer.unref();

    child.on("error", (err) => {
      clearInterval(iv);
      clearTimeout(killer);
      reject(err);
    });
    child.on("close", () => {
      sample();
      clearInterval(iv);
      clearTimeout(killer);
      resolve();
    });
  });

  if (timedOut) {
    return {
      ...summarizeSamples([], 0),
      status: "error",
      error: `tool exceeded ${timeoutMs}ms and was killed — row failed rather than hanging the suite`,
      isolation: "cli-child-rss",
      baselineRssMb: 0,
    };
  }

  const wallMs = Number(process.hrtime.bigint() - wall0) / 1e6;

  if (rssSamples.length === 0) {
    return {
      ...summarizeSamples([], 0),
      status: "error",
      error: "no child RSS samples (process exited before sample, or OS denied process query)",
      isolation: "cli-child-rss",
      baselineRssMb: 0,
    };
  }

  const stats = summarizeSamples(rssSamples, 0);
  const cpuTotal = peakCpuMs > 0 ? Number(peakCpuMs.toFixed(2)) : Number.NaN;
  const cpuPercent =
    wallMs > 0 && Number.isFinite(cpuTotal)
      ? Number(((cpuTotal / wallMs) * 100).toFixed(1))
      : Number.NaN;

  return {
    ...stats,
    heap: {
      minMb: Number.NaN,
      maxMb: Number.NaN,
      avgMb: Number.NaN,
      note: "private/heap not sampled for CLI on this platform (RSS only; Windows reports private bytes)",
    },
    cpu: {
      userMs: Number.NaN,
      systemMs: Number.NaN,
      totalMs: cpuTotal,
      percent: cpuPercent,
      wallMs: Number(wallMs.toFixed(2)),
    },
    isolation: "cli-child-rss",
    baselineRssMb: 0,
    note: "RSS = child tree; CPU total from /proc when available (Linux)",
  };
}

async function runInproc(task) {
  const handler = handlers[task.inproc.handler];
  if (!handler) throw new Error(`Unknown handler ${task.inproc.handler}`);

  // Capture the handler's return. It used to be discarded by a void arrow,
  // which is how the LSP rows came to publish THIS WORKER's RSS as if it were
  // the language server's — understating the server by ~50x (1.45 MB published
  // against 73 MB actually measured). `lspResource` existed and was collected;
  // nothing ever read it.
  let handlerResult = null;
  const result = await sampleWhile(
    async () => {
      handlerResult = await handler(task.inproc.payload);
    },
    { pollMs: 15 },
  );

  const lspResource = handlerResult?.lspResource ?? null;
  if (lspResource) {
    return {
      ...result,
      // The measured subject is the SERVER process, not this worker. Report the
      // server's numbers, and keep the worker's under explicit `worker*` keys
      // so the harness overhead stays inspectable rather than being mistaken
      // for the result.
      maxRssMb: lspResource.serverRssMaxMb ?? null,
      avgRssMb: lspResource.serverRssAvgMb ?? null,
      minRssMb: lspResource.serverRssAvgMb ?? null,
      // The aggregator prefers delta* over *RssMb for in-process tasks, and for
      // an LSP session the tool-attributed RSS IS the server's resident set —
      // not a delta against this worker's baseline. Setting them consistently
      // is what actually moves the published number; overriding only the
      // *RssMb keys left `deltaAvgMb` winning the pick order.
      deltaMaxMb: lspResource.serverRssMaxMb ?? null,
      deltaAvgMb: lspResource.serverRssAvgMb ?? null,
      deltaMinMb: lspResource.serverRssAvgMb ?? null,
      workerMaxRssMb: result.maxRssMb ?? null,
      workerAvgRssMb: result.avgRssMb ?? null,
      workerDeltaMaxMb: result.deltaMaxMb ?? null,
      cpu: {
        ...(result.cpu ?? {}),
        totalMs: lspResource.serverCpuMs ?? null,
        workerTotalMs: result.cpu?.totalMs ?? null,
      },
      lspResource,
      hoverValid: handlerResult?.hoverValid ?? null,
      isolation: "lsp-session-server-process",
      note: "RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. NOTE: for Volar this covers the Vue server only — its tsserver half is a separate, larger process and is NOT included.",
    };
  }

  return {
    ...result,
    isolation: "inproc-child-resource-delta",
    note: "RSS/heap deltas vs baseline after GC; CPU via process.cpuUsage() in isolated worker",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.task || !existsSync(args.task)) {
    console.error("Usage: memory-worker --task path.json");
    process.exit(2);
  }
  const task = JSON.parse(readFileSync(args.task, "utf8"));

  let out;
  try {
    if (task.skip) {
      out = { id: task.id, status: "skipped", skip: task.skip };
    } else if (task.kind === "cli" && task.cli) {
      out = {
        id: task.id,
        status: "ok",
        label: task.label,
        package: task.package,
        surface: task.surface,
        ...(await runCli(task.cli)),
      };
    } else if (task.kind === "inproc" && task.inproc) {
      out = {
        id: task.id,
        status: "ok",
        label: task.label,
        package: task.package,
        surface: task.surface,
        ...(await runInproc(task)),
      };
      if (out.error) {
        out.status = "error";
      }
    } else {
      out = { id: task.id, status: "skipped", skip: "invalid task shape" };
    }
  } catch (error) {
    out = {
      id: task.id,
      status: "error",
      label: task.label,
      package: task.package,
      surface: task.surface,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Single JSON line for parent to parse
  process.stdout.write(`${JSON.stringify(out)}\n`);
}

main().catch((e) => {
  process.stdout.write(
    `${JSON.stringify({ status: "error", error: e instanceof Error ? e.message : String(e) })}\n`,
  );
  process.exit(1);
});
