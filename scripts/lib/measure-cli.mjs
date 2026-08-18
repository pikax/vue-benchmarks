/**
 * Measure a one-shot CLI: wall clock + peak RSS of the child.
 *
 * Same method as `scripts/memory-worker.mjs` `runCli` / `runCliWindows`.
 *
 *   win32  PowerShell Process.Start samples WorkingSet64 in-process
 *          (Node→PowerShell roundtrips miss short-lived CLIs).
 *          PeakWorkingSet64 is the kernel high-water mark.
 *   linux  spawn + poll pidTreeRssBytes (/proc) and fold in VmHWM
 *   darwin spawn + poll pidTreeRssBytes (ps + pgrep -P children)
 *
 * stdout/stderr are captured so confirm can score diagnostics.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pidPeakRssBytes, pidTreeRssBytes } from "./memory.mjs";

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
 * }} cli
 */
export async function measureCli(cli) {
  if (process.platform === "win32") {
    return measureCliWindows(cli);
  }
  return measureCliPosix(cli);
}

async function measureCliPosix(cli) {
  const timeoutMs = Number(cli.timeoutMs ?? 120_000);
  const rssSamples = [];
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
      if (!child.pid) return;
      const tree = pidTreeRssBytes(child.pid);
      const exact = process.platform === "linux" ? pidPeakRssBytes(child.pid) : null;
      const n = Math.max(tree || 0, exact || 0);
      if (n > 0) rssSamples.push(n);
    };
    const iv = setInterval(sample, 1);
    if (typeof iv.unref === "function") iv.unref();
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
      clearInterval(iv);
      clearTimeout(killer);
      const ms = Number(process.hrtime.bigint() - wall0) / 1e6;
      const peak = rssSamples.length ? Math.max(...rssSamples) : undefined;
      resolve({
        status: timedOut ? null : status,
        stdout,
        stderr,
        combined: stdout + stderr,
        error: timedOut ? new Error(`timeout after ${timeoutMs}ms`) : error,
        ms,
        rssBytes: Number.isFinite(peak) && peak > 0 ? peak : undefined,
      });
    };

    child.on("error", (err) => done(null, err));
    child.on("close", (code) => done(code));
  });
}

function measureCliWindows(cli) {
  const timeoutMs = Number(cli.timeoutMs ?? 120_000);
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

  const ps = `
$ErrorActionPreference = 'Stop'
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
$outTask = $p.StandardOutput.ReadToEndAsync()
$errTask = $p.StandardError.ReadToEndAsync()
$ws = New-Object System.Collections.Generic.List[Int64]
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
} catch {}
try { if ($p.PeakWorkingSet64 -gt 0) { [void]$ws.Add([Int64]$p.PeakWorkingSet64) } } catch {}
$stdout = $outTask.GetAwaiter().GetResult()
$stderr = $errTask.GetAwaiter().GetResult()
[System.IO.File]::WriteAllText('${escapePsSingle(outFile)}', $stdout)
[System.IO.File]::WriteAllText('${escapePsSingle(errFile)}', $stderr)
if ($ws.Count -eq 0) {
  Write-Output ('EMPTY {0} {1}' -f $p.ExitCode, [math]::Round($sw.Elapsed.TotalMilliseconds, 2))
  exit 0
}
$wsMax = ($ws | Measure-Object -Maximum).Maximum
Write-Output ('{0} {1} {2}' -f $p.ExitCode, [math]::Round($sw.Elapsed.TotalMilliseconds, 2), $wsMax)
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
    return {
      status: Number(parts[1]) || null,
      stdout,
      stderr,
      combined: stdout + stderr,
      ms: Number(parts[2]) || 0,
    };
  }

  const status = Number(parts[0]);
  const ms = Number(parts[1]);
  const rssBytes = Number(parts[2]);
  return {
    status: Number.isFinite(status) ? status : null,
    stdout,
    stderr,
    combined: stdout + stderr,
    ms: Number.isFinite(ms) ? ms : 0,
    rssBytes: Number.isFinite(rssBytes) && rssBytes > 0 ? rssBytes : undefined,
  };
}
