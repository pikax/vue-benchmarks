/**
 * Cross-platform resource sampling (RSS, heap/private allocations, CPU).
 * Child-process isolation so numbers reflect one tool at a time.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import v8 from "node:v8";
import os from "node:os";

/** Snapshot of the current Node process. */
export function selfSnapshot() {
  const mu = process.memoryUsage();
  const hs = v8.getHeapStatistics();
  return {
    rss: mu.rss,
    heapUsed: mu.heapUsed,
    heapTotal: mu.heapTotal,
    external: mu.external,
    arrayBuffers: mu.arrayBuffers ?? 0,
    // V8 total heap size including available
    heapSizeLimit: hs.heap_size_limit,
    totalHeapSize: hs.total_heap_size,
    usedHeapSize: hs.used_heap_size,
    // malloc'd by V8 outside JS heap (approx. native/addon pressure proxy)
    totalPhysicalSize: hs.total_physical_size,
    mallocedMemory: hs.malloced_memory ?? 0,
    peakMallocedMemory: hs.peak_malloced_memory ?? 0,
    cpu: process.cpuUsage(),
    hrtime: process.hrtime.bigint(),
  };
}

export function selfRssBytes() {
  return process.memoryUsage().rss;
}

export function bytesToMb(n) {
  if (!Number.isFinite(n)) return Number.NaN;
  return Number((n / (1024 * 1024)).toFixed(2));
}

export function usToMs(us) {
  if (!Number.isFinite(us)) return Number.NaN;
  return Number((us / 1000).toFixed(2));
}

/**
 * RSS for a PID in bytes, or null if unavailable.
 */
export function pidRssBytes(pid) {
  if (!pid || pid <= 0) return null;
  try {
    if (process.platform === "linux") {
      const status = readFileSync(`/proc/${pid}/status`, "utf8");
      const m = status.match(/^VmRSS:\s+(\d+)\s+kB/m);
      return m ? Number(m[1]) * 1024 : null;
    }
    if (process.platform === "darwin") {
      const r = spawnSync("ps", ["-o", "rss=", "-p", String(pid)], {
        encoding: "utf8",
      });
      if (r.status !== 0) return null;
      const kb = Number(String(r.stdout).trim());
      return Number.isFinite(kb) ? kb * 1024 : null;
    }
    const r = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).WorkingSet64`,
      ],
      { encoding: "utf8", windowsHide: true },
    );
    if (r.status !== 0) return null;
    const n = Number(String(r.stdout).trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * RSS for a process and its direct children (helps Windows .cmd → node wrappers).
 */
export function pidTreeRssBytes(pid) {
  if (!pid || pid <= 0) return null;
  let total = pidRssBytes(pid) || 0;
  try {
    if (process.platform === "win32") {
      const r = spawnSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `$p=${pid}; $ids=@($p); $ids += @(Get-CimInstance Win32_Process -Filter "ParentProcessId=$p" -ErrorAction SilentlyContinue | ForEach-Object { $_.ProcessId }); ($ids | ForEach-Object { try { (Get-Process -Id $_ -ErrorAction Stop).WorkingSet64 } catch { 0 } } | Measure-Object -Sum).Sum`,
        ],
        { encoding: "utf8", windowsHide: true },
      );
      const n = Number(String(r.stdout).trim());
      if (Number.isFinite(n) && n > 0) return n;
    } else if (process.platform === "linux") {
      try {
        const kids = readFileSync(`/proc/${pid}/task/${pid}/children`, "utf8")
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        for (const k of kids) {
          total += pidRssBytes(Number(k)) || 0;
        }
      } catch {
        /* no children file */
      }
    }
  } catch {
    /* fall through */
  }
  return total > 0 ? total : null;
}

/** Linux: utime+stime ticks → ms (approx). */
export function linuxCpuMs(pid) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
    // comm can contain spaces in parens — split after last )
    const idx = stat.lastIndexOf(")");
    const rest = stat.slice(idx + 2).split(/\s+/);
    const utime = Number(rest[11]); // fields 14,15 are 1-based → indices 12,13 in rest?
    // After ") ": field 1 is state (rest[0]), ... utime is field 14 overall
    // rest[0]=state, rest[1]=ppid, ... rest[11]=utime, rest[12]=stime
    const stime = Number(rest[12]);
    const ticks = utime + stime;
    // CLK_TCK usually 100
    const hz = 100;
    return (ticks / hz) * 1000;
  } catch {
    return null;
  }
}

export function summarizeByteSeries(samplesBytes, baselineBytes = 0) {
  const valid = samplesBytes.filter((x) => Number.isFinite(x) && x >= 0);
  if (valid.length === 0) {
    return {
      sampleCount: 0,
      minMb: Number.NaN,
      maxMb: Number.NaN,
      avgMb: Number.NaN,
      deltaMinMb: Number.NaN,
      deltaMaxMb: Number.NaN,
      deltaAvgMb: Number.NaN,
    };
  }
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  const base = Number.isFinite(baselineBytes) ? baselineBytes : 0;
  return {
    sampleCount: valid.length,
    minMb: bytesToMb(min),
    maxMb: bytesToMb(max),
    avgMb: bytesToMb(avg),
    deltaMinMb: bytesToMb(Math.max(0, min - base)),
    deltaMaxMb: bytesToMb(Math.max(0, max - base)),
    deltaAvgMb: bytesToMb(Math.max(0, avg - base)),
  };
}

/** @deprecated alias */
export function summarizeSamples(samplesBytes, baselineBytes) {
  const s = summarizeByteSeries(samplesBytes, baselineBytes);
  return {
    sampleCount: s.sampleCount,
    minRssMb: s.minMb,
    maxRssMb: s.maxMb,
    avgRssMb: s.avgMb,
    deltaMinMb: s.deltaMinMb,
    deltaMaxMb: s.deltaMaxMb,
    deltaAvgMb: s.deltaAvgMb,
    baselineRssMb: bytesToMb(baselineBytes),
  };
}

/**
 * Poll RSS + heap while `fn` runs; also measure CPU via process.cpuUsage.
 */
export async function sampleWhile(fn, opts = {}) {
  const pollMs = opts.pollMs ?? 20;
  forceGc();
  const baselineSnap = selfSnapshot();
  const cpu0 = process.cpuUsage();
  const wall0 = process.hrtime.bigint();

  const rssSamples = [];
  const heapSamples = [];
  const mallocSamples = [];

  const iv = setInterval(() => {
    const snap = selfSnapshot();
    if (snap.rss > 0) rssSamples.push(snap.rss);
    if (snap.heapUsed > 0) heapSamples.push(snap.heapUsed);
    if (snap.mallocedMemory >= 0) mallocSamples.push(snap.mallocedMemory);
  }, pollMs);
  if (typeof iv.unref === "function") iv.unref();

  let error = null;
  try {
    await fn();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    clearInterval(iv);
    const snap = selfSnapshot();
    if (snap.rss > 0) rssSamples.push(snap.rss);
    if (snap.heapUsed > 0) heapSamples.push(snap.heapUsed);
    if (snap.mallocedMemory >= 0) mallocSamples.push(snap.mallocedMemory);
  }

  const cpu1 = process.cpuUsage(cpu0);
  const wallNs = Number(process.hrtime.bigint() - wall0);
  const wallMs = wallNs / 1e6;
  const cpuUserMs = usToMs(cpu1.user);
  const cpuSystemMs = usToMs(cpu1.system);
  const cpuTotalMs = Number((cpuUserMs + cpuSystemMs).toFixed(2));
  // % of one core during wall time
  const cpuPercent = wallMs > 0 ? Number(((cpuTotalMs / wallMs) * 100).toFixed(1)) : Number.NaN;

  const rss = summarizeByteSeries(rssSamples, baselineSnap.rss);
  const heap = summarizeByteSeries(heapSamples, baselineSnap.heapUsed);
  const malloc = summarizeByteSeries(mallocSamples, baselineSnap.mallocedMemory);
  const finalSnap = selfSnapshot();

  return {
    error,
    // legacy RSS fields (tool-attributed deltas preferred for inproc)
    sampleCount: rss.sampleCount,
    minRssMb: rss.minMb,
    maxRssMb: rss.maxMb,
    avgRssMb: rss.avgMb,
    deltaMinMb: rss.deltaMinMb,
    deltaMaxMb: rss.deltaMaxMb,
    deltaAvgMb: rss.deltaAvgMb,
    baselineRssMb: bytesToMb(baselineSnap.rss),
    // heap / allocations (V8)
    heap: {
      minMb: heap.deltaMinMb,
      maxMb: heap.deltaMaxMb,
      avgMb: heap.deltaAvgMb,
      absMinMb: heap.minMb,
      absMaxMb: heap.maxMb,
      absAvgMb: heap.avgMb,
      baselineMb: bytesToMb(baselineSnap.heapUsed),
      peakMallocedMb: bytesToMb(finalSnap.peakMallocedMemory),
      mallocDeltaMaxMb: malloc.deltaMaxMb,
    },
    // CPU
    cpu: {
      userMs: cpuUserMs,
      systemMs: cpuSystemMs,
      totalMs: cpuTotalMs,
      percent: cpuPercent,
      wallMs: Number(wallMs.toFixed(2)),
      cores: os.cpus().length,
    },
  };
}

export function forceGc() {
  try {
    if (typeof globalThis.gc === "function") globalThis.gc();
  } catch {
    /* --expose-gc not set */
  }
}
