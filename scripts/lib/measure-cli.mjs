/**
 * Measure a one-shot CLI: wall clock + peak RSS of the child.
 *
 * Same method as `scripts/memory-worker.mjs` `runCli` / `runCliWindows`.
 *
 *   win32  PowerShell Process.Start samples the full descendant tree
 *          (Node→PowerShell roundtrips miss short-lived CLIs).
 *   linux  spawn + poll pidTreeRssBreakdown (/proc, all descendants)
 *   darwin spawn + poll pidTreeRssBreakdown (ps + recursive pgrep -P)
 *
 * RSS is split into the Vue tool vs a child TypeScript engine (tsgo /
 * native tsc / tsserver). In-process engines stay in the tool column.
 *
 * stdout/stderr are captured so confirm can score diagnostics.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pidPeakRssBytes, pidTreeRssBreakdown, windowsTreeRssPsFunction } from "./memory.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function escapePsSingle(s) {
  return String(s).replace(/'/g, "''");
}

/**
 * @param {{
 *   bin: string,
 *   args?: string[],
 *   cwd?: string,
 *   env?: Record<string, string>,
 *   timeoutMs?: number,
 *   shell?: boolean,
 *   sampleRss?: boolean,
 * }} cli
 *
 * `sampleRss: false` (speed) never polls the process tree — sampling CIM /proc
 * belongs on a separate memory pass so it cannot inflate wall clock.
 */
export async function measureCli(cli) {
  if (process.platform === "win32") {
    return measureCliWindows(cli);
  }
  return measureCliPosix(cli);
}

function rssResult(peak) {
  const total = peak?.total || 0;
  if (!(total > 0)) return {};
  const out = { rssBytes: total };
  if (peak.tool > 0) out.rssToolBytes = peak.tool;
  if (peak.engine > 0) out.rssEngineBytes = peak.engine;
  return out;
}

async function measureCliPosix(cli) {
  const timeoutMs = Number(cli.timeoutMs ?? 120_000);
  const sampleRss = cli.sampleRss === true; // off unless the memory pass asked
  const peak = { total: 0, tool: 0, engine: 0 };
  const wall0 = process.hrtime.bigint();

  return new Promise((resolve) => {
    const child = spawn(cli.bin, cli.args || [], {
      cwd: cli.cwd,
      env: { ...process.env, NO_COLOR: "1", ...(cli.env || {}) },
      shell: cli.shell ?? false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (c) => {
      stdout += c;
    });
    child.stderr?.on("data", (c) => {
      stderr += c;
    });

    const sample = () => {
      if (!sampleRss || !child.pid) return;
      const b = pidTreeRssBreakdown(child.pid);
      const hwm = pidPeakRssBytes(child.pid) || 0;
      if (b.engineBytes > 0) {
        if (b.totalBytes > peak.total) {
          peak.total = b.totalBytes;
          peak.tool = b.toolBytes;
          peak.engine = b.engineBytes;
        }
      } else {
        const n = Math.max(b.totalBytes, hwm);
        if (n > peak.total) {
          peak.total = n;
          peak.tool = n;
          peak.engine = 0;
        }
      }
    };
    const iv = sampleRss ? setInterval(sample, 1) : null;
    if (iv && typeof iv.unref === "function") iv.unref();
    sample();

    let timedOut = false;
    const killer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch {
        /* gone */
      }
    }, timeoutMs);
    if (typeof killer.unref === "function") killer.unref();

    const done = (status, error) => {
      sample();
      if (iv) clearInterval(iv);
      clearTimeout(killer);
      const ms = Number(process.hrtime.bigint() - wall0) / 1e6;
      resolve({
        status: timedOut ? null : status,
        stdout,
        stderr,
        combined: stdout + stderr,
        error: timedOut ? new Error(`timeout after ${timeoutMs}ms`) : error,
        ms,
        ...rssResult(peak),
      });
    };

    child.on("error", (err) => done(null, err));
    child.on("close", (code) => done(code));
  });
}

function measureCliWindows(cli) {
  const timeoutMs = Number(cli.timeoutMs ?? 120_000);
  const sampleRss = cli.sampleRss === true;
  const stamp = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const work = join(rootDir, "work", "confirm-measure");
  mkdirSync(work, { recursive: true });
  const outFile = join(work, `${stamp}.out`);
  const errFile = join(work, `${stamp}.err`);
  const psFile = join(work, `${stamp}.ps1`);

  // Same quoting as memory-worker.mjs: PS single-quoted elements, joined
  // with spaces. Confirm tool args (--noEmit, -p, tsconfig.json) have no spaces.
  const argList = (cli.args || []).map((a) => `'${escapePsSingle(a)}'`).join(", ");
  const envLines = Object.entries(cli.env || {})
    .map(([k, v]) => `$psi.Environment['${escapePsSingle(k)}'] = '${escapePsSingle(v)}'`)
    .join("; ");

  const rssBlock = sampleRss
    ? `
${windowsTreeRssPsFunction()}
$peakTotal = [int64]0
$peakTool = [int64]0
$peakEngine = [int64]0
$lastScan = -9999.0
$rootHwm = [int64]0
function Note-Snap($snap) {
  if ($snap -eq $null) { return }
  $tool = $script:rootHwm + $snap.Tool
  $eng = $snap.Engine
  $tot = $tool + $eng
  if ($tot -gt $script:peakTotal) {
    $script:peakTotal = $tot
    $script:peakTool = $tool
    $script:peakEngine = $eng
  }
}
function Note-Root {
  $pref = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $p.Refresh()
    $ws = [int64]$p.WorkingSet64
    $hwm = [int64]$p.PeakWorkingSet64
    $root = [math]::Max($ws, $hwm)
    if ($root -gt $script:rootHwm) { $script:rootHwm = $root }
    $tool = $script:rootHwm
    $eng = $script:peakEngine
    $tot = $tool + $eng
    if ($tot -gt $script:peakTotal) {
      $script:peakTotal = $tot
      $script:peakTool = $tool
    }
  } catch {}
  $ErrorActionPreference = $pref
}
`
    : `
$peakTotal = [int64]0
$peakTool = [int64]0
$peakEngine = [int64]0
$lastScan = 0
function Note-Snap($snap) {}
function Note-Root {}
`;

  const ps = `
$ErrorActionPreference = 'Stop'
${rssBlock}
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = '${escapePsSingle(cli.bin)}'
$psi.Arguments = [string]::Join(' ', @(${argList || "''"}))
$psi.WorkingDirectory = '${escapePsSingle(cli.cwd || process.cwd())}'
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true
${envLines}
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$p = [System.Diagnostics.Process]::Start($psi)
$started = [datetime]::Now
try { $started = $p.StartTime } catch {}
$outTask = $p.StandardOutput.ReadToEndAsync()
$errTask = $p.StandardError.ReadToEndAsync()
Note-Root
$timedOut = $false
while (-not $p.WaitForExit(10)) {
  if ($sw.Elapsed.TotalMilliseconds -gt ${timeoutMs}) {
    $timedOut = $true
    try { $p.Kill() } catch {}
    break
  }
  Note-Root
  if (${sampleRss ? "$true" : "$false"} -and $sw.Elapsed.TotalMilliseconds - $lastScan -ge 50) {
    try { Note-Snap (Measure-TreeWorkingSet $p.Id $started) } catch {}
    $lastScan = $sw.Elapsed.TotalMilliseconds
  }
}
if ($timedOut) {
  try { $p.WaitForExit(5000) } catch {}
  Write-Output 'TIMEOUT'
  exit 0
}
$sw.Stop()
Note-Root
if (${sampleRss ? "$true" : "$false"}) {
  try { Note-Snap (Measure-TreeWorkingSet $p.Id $started) } catch {}
  Note-Root
}
$stdout = $outTask.GetAwaiter().GetResult()
$stderr = $errTask.GetAwaiter().GetResult()
[System.IO.File]::WriteAllText('${escapePsSingle(outFile)}', $stdout)
[System.IO.File]::WriteAllText('${escapePsSingle(errFile)}', $stderr)
if ($peakTotal -le 0) {
  Write-Output ('EMPTY {0} {1}' -f $p.ExitCode, [math]::Round($sw.Elapsed.TotalMilliseconds, 2))
  exit 0
}
Write-Output ('{0} {1} {2} {3} {4}' -f $p.ExitCode, [math]::Round($sw.Elapsed.TotalMilliseconds, 2), $peakTotal, $peakTool, $peakEngine)
`;

  writeFileSync(psFile, ps, "utf8");
  const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", psFile], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
    timeout: timeoutMs + 30_000,
  });

  const readSide = (p) => {
    try {
      return existsSync(p) ? readFileSync(p, "utf8") : "";
    } catch {
      return "";
    }
  };
  const stdout = readSide(outFile);
  const stderr = readSide(errFile);
  try {
    rmSync(outFile, { force: true });
    rmSync(errFile, { force: true });
    rmSync(psFile, { force: true });
  } catch {
    /* leftover work/ files are gitignored */
  }

  const line = String(r.stdout || "")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .pop();

  if (line === "TIMEOUT" || r.error?.code === "ETIMEDOUT") {
    return {
      status: null,
      stdout,
      stderr,
      combined: stdout + stderr,
      error: new Error(`timeout after ${timeoutMs}ms`),
      ms: timeoutMs,
    };
  }

  if (!line) {
    return {
      status: r.status,
      stdout,
      stderr: stderr || r.stderr || "",
      combined: stdout + (stderr || r.stderr || ""),
      error: r.error,
      ms: 0,
    };
  }

  const parts = line.split(/\s+/);
  if (parts[0] === "EMPTY") {
    const code = Number(parts[1]);
    return {
      status: Number.isFinite(code) ? code : null,
      stdout,
      stderr,
      combined: stdout + stderr,
      ms: Number(parts[2]) || 0,
    };
  }

  const status = Number(parts[0]);
  const ms = Number(parts[1]);
  const rssBytes = Number(parts[2]);
  const rssToolBytes = Number(parts[3]);
  const rssEngineBytes = Number(parts[4]);
  return {
    status: Number.isFinite(status) ? status : null,
    stdout,
    stderr,
    combined: stdout + stderr,
    ms: Number.isFinite(ms) ? ms : 0,
    ...rssResult({
      total: Number.isFinite(rssBytes) ? rssBytes : 0,
      tool: Number.isFinite(rssToolBytes) ? rssToolBytes : 0,
      engine: Number.isFinite(rssEngineBytes) ? rssEngineBytes : 0,
    }),
  };
}
