#!/usr/bin/env node
/**
 * Isolated memory worker — one tool per process.
 * Spawned with: node --expose-gc scripts/memory-worker.mjs --task <path.json>
 *
 * Prints a single JSON object to stdout (last line).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
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
  windowsTreeRssPsFunction,
} from "./lib/memory.mjs";
import { copyFixtureSubset } from "./lib/fixtures.mjs";
import { assertOnlyAllowedFervidDiagnostics } from "./lib/fervid-diagnostics.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI_OUTPUT_LIMIT = 1024 * 1024;

function appendBounded(current, chunk, limit = CLI_OUTPUT_LIMIT) {
  if (current.length >= limit) return current;
  return current + String(chunk).slice(0, limit - current.length);
}

function cliValidity(cli, { exitCode, stdout = "", stderr = "" }) {
  const policy = cli.validation ?? { kind: "exit-zero" };
  const output = `${stdout}\n${stderr}`;
  if (!Number.isInteger(exitCode)) {
    return { status: "fail", detail: "child exited without an integer exit code" };
  }
  if (policy.kind === "typecheck-clean") {
    // The resource corpus is intentionally the same clean corpus as the timed
    // row. A non-zero code is therefore never "expected diagnostics": it is a
    // failed workload and its RSS remains visible only as an invalid row.
    const ok = exitCode === 0;
    return {
      status: ok ? "pass" : "fail",
      detail: ok
        ? "clean typecheck corpus completed with exit 0"
        : `clean typecheck corpus unexpectedly exited ${exitCode}: ${output.slice(0, 240).trim() || "no diagnostic output"}`,
      exitCode,
    };
  }
  if (policy.kind === "lint-scan") {
    if (exitCode === 0) {
      const reportedCounts = [...output.matchAll(/\b(\d+)\s+files?\b/gi)].map((match) =>
        Number(match[1]),
      );
      const reportedFiles = reportedCounts.length ? Math.max(...reportedCounts) : null;
      if (Number.isFinite(policy.expectedMinimumFiles)) {
        const ok = Number.isFinite(reportedFiles) && reportedFiles >= policy.expectedMinimumFiles;
        return {
          status: ok ? "pass" : "fail",
          detail: ok
            ? `lint completed with exit 0 and reported ${reportedFiles} files (minimum ${policy.expectedMinimumFiles})`
            : `lint exited 0 but did not prove the expected ${policy.expectedMinimumFiles}-file scan (reported ${reportedFiles ?? "no count"})`,
          exitCode,
          reportedFiles,
        };
      }
      if (policy.silentExitZero === "unknown" && !output.trim()) {
        return {
          status: "unknown",
          detail:
            "lint exited 0 silently; this CLI exposes no per-file census in its normal invocation",
          exitCode,
        };
      }
      return { status: "pass", detail: "lint completed with exit 0", exitCode };
    }
    const findingExitCodes = policy.findingExitCodes ?? [1];
    const namesVueFile = /\.vue(?::|\(|\s|$)/i.test(output);
    const ok = findingExitCodes.includes(exitCode) && namesVueFile;
    return {
      status: ok ? "pass" : "fail",
      detail: ok
        ? `lint finding exit ${exitCode}; output names a .vue input`
        : `unexpected lint exit ${exitCode}${namesVueFile ? "" : "; output names no .vue input"}`,
      exitCode,
    };
  }
  const ok = exitCode === 0;
  return {
    status: ok ? "pass" : "fail",
    detail: ok ? "process completed with exit 0" : `unexpected process exit ${exitCode}`,
    exitCode,
  };
}

function prepareCliSample(cli) {
  if (!cli.freshCopy) return { cli, cleanup: () => {} };
  const fresh = cli.freshCopy;
  const cwd = join(fresh.workRoot, `${fresh.id}-${process.pid}`);
  rmSync(cwd, { recursive: true, force: true });
  copyFixtureSubset(fresh.fixtureDir, cwd, fresh.files, fresh.extraFiles ?? []);
  return {
    cli: { ...cli, cwd, freshCopy: undefined },
    cleanup: () => rmSync(cwd, { recursive: true, force: true }),
  };
}

function parseArgs(argv) {
  const args = { task: "" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--task") args.task = argv[++i];
  }
  return args;
}

function vueCompileSfc(
  compiler,
  source,
  filename,
  { vapor, isProd, includeStyles = false, componentId = filename },
) {
  const { descriptor, errors } = compiler.parse(source, { filename });
  if (errors?.length) throw new Error(String(errors[0]?.message ?? errors[0]));
  let bindings = {};
  let generatedBytes = 0;
  const scriptOpts = {
    id: includeStyles ? componentId : filename,
    inlineTemplate: false,
    isProd,
  };
  if (vapor) {
    scriptOpts.vapor = true;
    scriptOpts.templateOptions = { vapor: true, isProd };
  }
  if (descriptor.scriptSetup || descriptor.script) {
    const scriptResult = compiler.compileScript(descriptor, scriptOpts);
    bindings = scriptResult.bindings || {};
    generatedBytes += scriptResult.content?.length ?? 0;
  }
  if (descriptor.template) {
    const templateOpts = {
      source: descriptor.template.content,
      filename,
      id: includeStyles ? componentId : filename,
      isProd,
      compilerOptions: {
        bindingMetadata: bindings,
        mode: "module",
        hoistStatic: isProd,
        cacheHandlers: isProd,
        prefixIdentifiers: true,
        scopeId:
          includeStyles && descriptor.styles.some((style) => style.scoped)
            ? `data-v-${componentId}`
            : undefined,
      },
    };
    if (vapor) templateOpts.vapor = true;
    const result = compiler.compileTemplate(templateOpts);
    if (result.errors?.length)
      throw new Error(String(result.errors[0]?.message ?? result.errors[0]));
    generatedBytes += result.code?.length ?? 0;
  }
  if (includeStyles) {
    for (const style of descriptor.styles) {
      const result = compiler.compileStyle({
        source: style.content,
        filename,
        id: `data-v-${componentId}`,
        scoped: style.scoped,
        isProd,
      });
      if (result.errors?.length) {
        throw new Error(String(result.errors[0]?.message ?? result.errors[0]));
      }
      if (!result.code?.length) throw new Error(`Vue emitted no CSS for ${filename}`);
      generatedBytes += result.code.length;
    }
  }
  if (generatedBytes === 0) throw new Error(`Vue emitted no output for ${filename}`);
  return generatedBytes;
}

const handlers = {
  async "vue-compile-sfc"(payload) {
    const compiler = require(require.resolve(payload.packageName, { paths: [rootDir] }));
    let outputBytes = 0;
    for (const f of payload.sources) {
      outputBytes += vueCompileSfc(compiler, f.source, f.filename, {
        vapor: payload.vapor,
        isProd: payload.isProd,
        includeStyles: payload.includeStyles,
        componentId: f.componentId,
      });
    }
    return {
      validity: {
        status: "pass",
        detail: `parsed and generated non-empty output for ${payload.sources.length} SFCs (${outputBytes} bytes)`,
      },
    };
  },

  async "vize-compile-sfc"(payload) {
    const vize = require(require.resolve("@vizejs/native", { paths: [rootDir] }));
    for (const f of payload.sources) {
      const result = vize.compileSfc(f.source, {
        filename: f.filename,
        vapor: payload.vapor,
        sourceMap: payload.sourceMap,
        isTs: true,
        templateHoistStatic: payload.isProd,
        templateCacheHandlers: payload.isProd,
      });
      if (result?.errors?.length) throw new Error(result.errors.join("; "));
      if (!(result?.code?.length > 0)) throw new Error(`vize emitted no code for ${f.filename}`);
      if ((f.styles?.length ?? 0) > 0 && !(result?.css?.length > 0)) {
        throw new Error(`vize emitted no CSS for ${f.filename}`);
      }
      for (const style of f.styles ?? []) {
        if (!String(result?.css ?? "").includes(style.sentinel)) {
          throw new Error(`vize compileSfc omitted style block ${style.index} for ${f.filename}`);
        }
      }
    }
    return {
      validity: {
        status: "pass",
        detail: `compileSfc returned code for ${payload.sources.length} SFCs and every expected CSS sentinel`,
      },
    };
  },

  async "vize-compile-batch"(payload) {
    const vize = require(require.resolve("@vizejs/native", { paths: [rootDir] }));
    const inputs = payload.sources.map((f) => ({ path: f.filename, source: f.source }));
    const result = vize.compileSfcBatchWithResults(inputs, {
      vapor: payload.vapor,
      isTs: true,
      includeSourceMap: false,
      templateHoistStatic: payload.isProd,
      templateCacheHandlers: payload.isProd,
    });
    if (result.failedCount) throw new Error(`vize batch failed ${result.failedCount}`);
    if (result.errors?.length) {
      throw new Error(`vize batch returned top-level errors: ${result.errors.join("; ")}`);
    }
    const rows = result.results ?? result.items ?? [];
    if (rows.length !== inputs.length) {
      throw new Error(`vize batch returned ${rows.length}/${inputs.length} results`);
    }
    const failedRows = rows.filter((row) => row?.errors?.length);
    if (failedRows.length) {
      throw new Error(
        `vize batch returned per-file errors for ${failedRows.length}/${inputs.length}: ${failedRows[0].errors.join("; ")}`,
      );
    }
    if (rows.some((row) => !(row?.code?.length > 0))) {
      throw new Error("vize batch returned an empty generated-code result");
    }
    const expectedCss = payload.sources.filter((f) => (f.styles?.length ?? 0) > 0).length;
    if (expectedCss && rows.filter((row) => (row?.css?.length ?? 0) > 0).length !== expectedCss) {
      throw new Error("vize batch did not return CSS for every styled SFC");
    }
    for (let index = 0; index < rows.length; index++) {
      for (const style of payload.sources[index].styles ?? []) {
        if (!String(rows[index]?.css ?? "").includes(style.sentinel)) {
          throw new Error(
            `vize batch omitted style block ${style.index} for ${payload.sources[index].filename}`,
          );
        }
      }
    }
    return {
      validity: {
        status: "pass",
        detail: `compileSfcBatchWithResults returned ${rows.length}/${inputs.length} code results and every expected CSS sentinel`,
      },
    };
  },

  async "fervid-compile-sfc"(payload) {
    const { Compiler } = require(require.resolve("@fervid/napi", { paths: [rootDir] }));
    const compiler = new Compiler({ isProduction: payload.isProd });
    for (const f of payload.sources) {
      const result = compiler.compileSync(f.source, { id: f.filename, filename: f.filename });
      // Gated on codegen, not on diagnostic silence: fervid reports non-fatal
      // HTML-strictness diagnostics on self-closing non-void tags while still
      // emitting complete code. See scripts/lib/surfaces/compile.mjs.
      assertOnlyAllowedFervidDiagnostics(result, `fervid ${f.filename}`);
      if (!result?.code?.length) throw new Error(`fervid emitted no code for ${f.filename}`);
      if ((f.styles?.length ?? 0) > 0 && !(result.styles?.[0]?.code?.length > 0)) {
        throw new Error(`fervid emitted no CSS for ${f.filename}`);
      }
    }
    return {
      validity: {
        status: "pass",
        detail: `compileSync returned code for ${payload.sources.length} SFCs and CSS where expected`,
      },
    };
  },

  async "verter-compile-many"(payload) {
    const native = require(require.resolve("@verter/native", { paths: [rootDir] }));
    const config = {
      devMode: !payload.isProd,
      analysisLevel: "full",
    };
    let host;
    if (
      payload.workspaceRoot &&
      typeof native.Workspace === "function" &&
      typeof native.VerterHost?.withWorkspace === "function"
    ) {
      const root = payload.workspaceRoot.replace(/\\/g, "/");
      const workspace = new native.Workspace([root]);
      workspace.configureProjects([{ root, workspaceRoot: root }]);
      host = native.VerterHost.withWorkspace(config, workspace);
    } else {
      host = new native.VerterHost(config);
    }
    const batchInputs = payload.sources.map((f) => ({
      canonicalId: (f.path || f.filename).replace(/\\/g, "/"),
      source: f.source,
      requestedMode: "stateless",
      componentId: f.componentId,
    }));
    const results = host.compileMany(batchInputs, {
      target: "runtime-render",
      defaultMode: "stateless",
      priority: "interactive",
      compileProfile: {
        isProduction: payload.isProd,
        customElement: false,
        ssr: false,
        forceJs: false, // one TS-passthrough standard for every compiler — see compile.mjs renderProfile
        forceVapor: payload.vapor,
        // Keep memory cells comparable: no compiler is asked to materialise
        // source maps here. Map cost is measured by the compile timing matrix.
        sourceMap: false,
        hmrStrategy: payload.isProd ? "none" : "vite",
        runtimeModuleName: "vue",
      },
    });
    const failed = results.filter((r) => r.errors?.length);
    if (failed.length) throw new Error(String(failed[0].errors[0]));
    if (results.length !== batchInputs.length) {
      throw new Error(`verter returned ${results.length}/${batchInputs.length} results`);
    }
    if (results.some((r) => !(r?.code?.length > 0))) {
      throw new Error("verter returned an empty generated-code result");
    }
    if (results.some((r) => r.cacheHit)) {
      throw new Error("verter runtime-render unexpectedly reported an output-cache hit");
    }
    if (results.some((r) => r.actualMode !== "stateless")) {
      throw new Error("verter runtime-render did not use requestedMode=stateless");
    }
    if (payload.includeStyles) {
      const { processStyle } = require(require.resolve("@verter/native", { paths: [rootDir] }));
      let cssBytes = 0;
      for (const f of payload.sources) {
        for (const style of f.styles ?? []) {
          const result = processStyle(style.content, {
            scopeId: style.scopeId,
            scoped: style.scoped,
            isModule: false,
            filename: style.filename,
          });
          cssBytes += result?.code?.length ?? 0;
        }
      }
      if (cssBytes === 0) throw new Error("verter processStyle emitted no CSS");
    }
    return {
      validity: {
        status: "pass",
        detail: `workspace-backed compileMany returned ${results.length}/${batchInputs.length} stateless, non-cached code results${payload.includeStyles ? " plus processStyle output" : ""}`,
      },
    };
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
    const results = await eslint.lintFiles(payload.files);
    return {
      validity: {
        status: results.length === payload.files.length ? "pass" : "fail",
        detail: `ESLint returned ${results.length}/${payload.files.length} explicitly requested SFC results`,
      },
    };
  },

  async "verter-lint"(payload) {
    const { VerterHost } = require(require.resolve("@verter/native", { paths: [rootDir] }));
    const host = new VerterHost({ devMode: false, analysisLevel: "full" });
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
    return {
      validity: {
        status: "pass",
        detail: `workspace host upserted and linted ${payload.sources.length}/${payload.sources.length} explicitly requested SFCs`,
      },
    };
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
      templateProbe: ws.templateProbe,
      initializationOptions: payload.server === "volar" ? { typescript: { tsdk } } : {},
      readyNotifications: payload.server === "verter" ? ["$/verter/ready"] : [],
      volarHybrid: payload.server === "volar",
      tsdkPath: tsdk,
      // Poll hard: nothing here is timed, so sampling cost is free.
      sampleResources: true,
      resourcePollMs: Number(process.env.MEM_LSP_POLL_MS ?? 10),
    });
    // Surfaced through the task result for the report.
    const contentValid = out.hoverValid === true && out.templateHoverValid === true;
    return {
      lspResource: out.resource,
      hoverValid: out.hoverValid,
      templateHoverValid: out.templateHoverValid,
      validity: {
        // runLspSession currently samples the Vue-server pid. In Volar hybrid
        // mode the TypeScript server is a sibling process, not its descendant,
        // so claiming this is the two-process product would understate it.
        status: payload.server === "volar" ? "unknown" : contentValid ? "pass" : "fail",
        detail:
          payload.server === "volar"
            ? `script/template hover validity=${contentValid}; resource sampler covers only @vue/language-server, not its required TypeScript-server half`
            : contentValid
              ? "script hover and template auto-unwrapped hover both passed"
              : `hover validation failed (script=${out.hoverValid}, template=${out.templateHoverValid})`,
      },
    };
  },

  async "vue-component-meta"(payload) {
    const { createChecker } = require(require.resolve("vue-component-meta", { paths: [rootDir] }));
    const checker = createChecker(payload.tsconfig, { forceUseTs: true });
    let resolved = 0;
    for (const file of payload.files) {
      if (checker.getComponentMeta(file)) resolved++;
    }
    return {
      validity: {
        status: resolved === payload.files.length ? "pass" : "fail",
        detail: `getComponentMeta resolved ${resolved}/${payload.files.length} components`,
      },
    };
  },

  async "verter-component-meta"(payload) {
    const mod = await import("@verter/component-meta");
    if (typeof mod.openComponentMetaSession !== "function") {
      throw new Error("@verter/component-meta exports no openComponentMetaSession");
    }
    const sessionConfig = {
      root: payload.root.replace(/\\/g, "/"),
      tsconfig: payload.tsconfig.replace(/\\/g, "/"),
    };
    const session = await mod.openComponentMetaSession(sessionConfig);
    let resolved = 0;
    try {
      for (const file of payload.files) {
        if (await session.getComponentMeta(file.replace(/\\/g, "/"))) resolved++;
      }
    } finally {
      try {
        session.close();
      } catch {
        /* ignore */
      }
      try {
        mod.evictComponentMetaSession?.(sessionConfig);
      } catch {
        /* ignore */
      }
    }
    return {
      validity: {
        status: resolved === payload.files.length ? "pass" : "fail",
        detail: `published @verter/component-meta session resolved ${resolved}/${payload.files.length} components`,
      },
    };
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
${windowsTreeRssPsFunction()}
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
$lastScan = -9999.0
$timedOut = $false
while (-not $p.HasExited) {
  if ($sw.Elapsed.TotalMilliseconds -gt ${timeoutMs}) {
    $timedOut = $true
    try { $p.Kill() } catch {}
    break
  }
  if ($sw.Elapsed.TotalMilliseconds - $lastScan -ge 50) {
    try {
      $snap = Measure-TreeWorkingSet $p.Id
      if ($snap.Total -gt 0) { [void]$ws.Add([Int64]$snap.Total) }
    } catch {}
    $lastScan = $sw.Elapsed.TotalMilliseconds
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
$stdoutText = $outTask.GetAwaiter().GetResult()
$stderrText = $errTask.GetAwaiter().GetResult()
$captureChars = ${Math.floor(CLI_OUTPUT_LIMIT / 2)}
if ($stdoutText.Length -gt $captureChars) { $stdoutText = $stdoutText.Substring(0, $captureChars) }
if ($stderrText.Length -gt $captureChars) { $stderrText = $stderrText.Substring(0, $captureChars) }
$stdout64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($stdoutText))
$stderr64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($stderrText))
if (-not $stdout64) { $stdout64 = '-' }
if (-not $stderr64) { $stderr64 = '-' }
$childExit = $p.ExitCode
try {
  $snap = Measure-TreeWorkingSet $p.Id
  if ($snap.Total -gt 0) { [void]$ws.Add([Int64]$snap.Total) }
} catch {}
try {
  $p.Refresh()
  if ($p.PeakWorkingSet64 -gt 0) { [void]$ws.Add([Int64]$p.PeakWorkingSet64) }
} catch {}
try {
  $p.Refresh()
  if ($p.PrivateMemorySize64 -gt 0) { [void]$priv.Add([Int64]$p.PrivateMemorySize64) }
} catch {}
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
Write-Output ("{0} {1} {2} {3} {4} {5} {6} {7} {8} {9} {10} {11} {12}" -f $wsMin, $wsMax, $wsAvg, $ws.Count, $prMin, $prMax, $prAvg, $cpuMs, $userMs, $wallMs, $childExit, $stdout64, $stderr64)
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
    rmSync(psFile, { force: true });
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
  const parts = line.split(/\s+/);
  const [minB, maxB, avgB, count, prMin, prMax, prAvg, cpuMs, userMs, wallMs, exitCode] = parts
    .slice(0, 11)
    .map(Number);
  const decode = (value) =>
    value && value !== "-" ? Buffer.from(value, "base64").toString("utf8") : "";
  const stdout = decode(parts[11]);
  const stderr = decode(parts[12]);
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
  const validity = cliValidity(cli, { exitCode, stdout, stderr });
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
    exitCode,
    output: {
      stdout: stdout.slice(0, 4_000),
      stderr: stderr.slice(0, 4_000),
      truncatedAt: CLI_OUTPUT_LIMIT,
    },
    validity,
    note: "RSS=WorkingSet of the full descendant tree (tool + child tsgo/tsc); alloc≈PrivateMemorySize64 of the root process; CPU=TotalProcessorTime of the root process; exit/output validity retained",
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
  let exitCode = null;
  let stdout = "";
  let stderr = "";

  await new Promise((resolve, reject) => {
    const child = spawn(cli.bin, cli.args, {
      cwd: cli.cwd,
      env: { ...process.env, NO_COLOR: "1", ...(cli.env || {}) },
      shell: cli.shell ?? false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    // Drain both pipes while retaining a bounded prefix for correctness. Exit
    // status without output cannot distinguish expected diagnostics from a
    // config/bootstrap abort, and unbounded capture would make the sampler
    // itself a memory benchmark.
    child.stdout?.on("data", (chunk) => {
      stdout = appendBounded(stdout, chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr = appendBounded(stderr, chunk);
    });

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
    child.on("close", (code) => {
      exitCode = code;
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

  const validity = cliValidity(cli, { exitCode, stdout, stderr });
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
    exitCode,
    output: {
      stdout: stdout.slice(0, 4_000),
      stderr: stderr.slice(0, 4_000),
      truncatedAt: CLI_OUTPUT_LIMIT,
    },
    validity,
    note: "RSS = child tree; CPU total from /proc when available (Linux); exit/output validity retained",
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
      templateHoverValid: handlerResult?.templateHoverValid ?? null,
      validity: handlerResult?.validity ?? {
        status: "unknown",
        detail: "handler returned no validity verdict",
      },
      isolation: "lsp-session-server-process",
      note: "RSS/CPU are the LANGUAGE SERVER process, sampled by the session. Worker-process figures are reported separately as worker*. Volar is explicitly UNVERIFIED because this covers its Vue server only — its required tsserver half is a separate process and is NOT included.",
    };
  }

  return {
    ...result,
    validity: handlerResult?.validity ?? {
      status: "unknown",
      detail: "handler completed but has no semantic/work validation verdict",
    },
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
      const prepared = prepareCliSample(task.cli);
      try {
        out = {
          id: task.id,
          status: "ok",
          label: task.label,
          package: task.package,
          surface: task.surface,
          comparisonClass: task.comparisonClass,
          ...(await runCli(prepared.cli)),
        };
      } finally {
        prepared.cleanup();
      }
    } else if (task.kind === "inproc" && task.inproc) {
      out = {
        id: task.id,
        status: "ok",
        label: task.label,
        package: task.package,
        surface: task.surface,
        comparisonClass: task.comparisonClass,
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
      comparisonClass: task.comparisonClass,
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
