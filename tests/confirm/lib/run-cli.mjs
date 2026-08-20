import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { withTsgoEnv } from "../../../scripts/lib/tsgo.mjs";
import { measureCli } from "../../../scripts/lib/measure-cli.mjs";
import { stripAnsi } from "../../../scripts/lib/real-world/ansi.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

export function resolveBin(name) {
  const binDir = join(rootDir, "node_modules", ".bin");
  const candidates =
    process.platform === "win32"
      ? [
          join(binDir, `${name}.cmd`),
          join(binDir, `${name}.ps1`),
          join(binDir, name),
        ]
      : [join(binDir, name)];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  try {
    const pkgPath = require.resolve(`${name}/package.json`, {
      paths: [rootDir],
    });
    const pkg = require(pkgPath);
    const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.[name];
    if (bin) {
      const abs = join(dirname(pkgPath), bin);
      if (existsSync(abs)) return abs;
    }
  } catch {
    /* missing */
  }
  return null;
}

/**
 * Same resolution as the memory probe (`memory-tasks.mjs` tryCli): JS package
 * bins run under `node` so Windows never goes through a .cmd wrapper, and
 * native bins are spawned directly. RSS then belongs to the real tool process
 * on every OS.
 */
export function resolveSpawnable(name) {
  let pkgPath = join(rootDir, "node_modules", name, "package.json");
  if (!existsSync(pkgPath)) {
    try {
      pkgPath = require.resolve(`${name}/package.json`, { paths: [rootDir] });
    } catch {
      pkgPath = null;
    }
  }
  if (pkgPath && existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const binField = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.[name];
      if (binField) {
        const abs = resolve(dirname(pkgPath), binField);
        if (existsSync(abs)) {
          let isNodeScript = /\.(c?js|mjs)$/i.test(abs);
          if (!isNodeScript) {
            try {
              const head = readFileSync(abs, "utf8").slice(0, 80);
              if (/node/i.test(head) && (head.startsWith("#!") || head.includes("import "))) {
                isNodeScript = true;
              }
            } catch {
              /* binary */
            }
          }
          if (isNodeScript) {
            return { bin: process.execPath, argsPrefix: [abs], shell: false };
          }
          return { bin: abs, argsPrefix: [], shell: false };
        }
      }
    } catch {
      /* fall through */
    }
  }
  const shim = resolveBin(name);
  if (!shim) return null;
  return {
    bin: shim,
    argsPrefix: [],
    shell: process.platform === "win32" && /\.cmd$/i.test(shim),
  };
}

function cliEnv(extra = {}) {
  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");
  const pathSep = process.platform === "win32" ? ";" : ":";
  const pathEnv = `${join(rootDir, "node_modules", ".bin")}${pathSep}${process.env.PATH || ""}`;
  return withTsgoEnv(
    {
      ...process.env,
      NODE_PATH: nodePath,
      PATH: pathEnv,
      // Parity with runCliMeasured, which has always set these: the SCORED dump
      // must not come from a different environment than the MEASURED one.
      // It is not sufficient on its own — vize colours regardless (verified) —
      // which is why every captured stream is also stripped below.
      NO_COLOR: "1",
      FORCE_COLOR: "0",
      ...extra,
    },
    rootDir,
  );
}

function emptyRun(reason) {
  return {
    status: null,
    stdout: "",
    stderr: reason,
    combined: reason,
    ms: 0,
  };
}

/**
 * Every captured stream is decoloured HERE, once, at the boundary.
 *
 * Scoring reads `combined` in more places than the diagnostic parser: forbidden
 * patterns (`mustNotMatch`), the no-pin `mustMatch` fallback, `countErrors`'
 * summary-line fallback, the bootstrap-failure sniffer, snippets in the report.
 * Leaving escapes in and stripping them in ONE of those readers is how a colour
 * code inside `path(line,col)` silently zeroed a tool's diagnostics (#34);
 * every reader downstream of this now sees the same plain text.
 */
function decolour(run) {
  const stdout = stripAnsi(run.stdout || "");
  const stderr = stripAnsi(run.stderr || "");
  return { ...run, stdout, stderr, combined: stdout + stderr };
}

/**
 * @returns {{ status: number|null, stdout: string, stderr: string, combined: string, ms: number }}
 */
export function runCli(bin, args, { cwd, env = {}, timeout = 120_000 } = {}) {
  if (!bin) return emptyRun("binary not found");
  const t0 = performance.now();
  const r = spawnSync(bin, args, {
    cwd,
    encoding: "utf8",
    timeout,
    env: cliEnv(env),
    shell: process.platform === "win32" && /\.cmd$/i.test(bin),
    maxBuffer: 20 * 1024 * 1024,
  });
  return decolour({
    status: r.status,
    stdout: r.stdout || "",
    stderr: r.stderr || "",
    error: r.error,
    ms: performance.now() - t0,
  });
}

/**
 * Timed spawn. Pass `sampleRss: true` only on a memory pass — polling the
 * process tree must not run beside a wall-clock measurement.
 *
 * `bin` may be a path or a `{ bin, argsPrefix, shell }` from resolveSpawnable.
 */
export function runCliMeasured(bin, args, { cwd, env = {}, timeout = 120_000, sampleRss = false } = {}) {
  const spec =
    bin && typeof bin === "object" && bin.bin
      ? bin
      : bin
        ? {
            bin,
            argsPrefix: [],
            shell: process.platform === "win32" && /\.cmd$/i.test(bin),
          }
        : null;
  if (!spec) return Promise.resolve(emptyRun("binary not found"));
  // Only extras — measureCli already spreads process.env. Dumping the full
  // environment into the Windows ProcessStartInfo script breaks on values
  // that contain quotes.
  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");
  const pathSep = process.platform === "win32" ? ";" : ":";
  const pathEnv = `${join(rootDir, "node_modules", ".bin")}${pathSep}${process.env.PATH || ""}`;
  return measureCli({
    bin: spec.bin,
    args: [...(spec.argsPrefix || []), ...(args || [])],
    cwd,
    env: withTsgoEnv(
      {
        NODE_PATH: nodePath,
        PATH: pathEnv,
        NO_COLOR: "1",
        FORCE_COLOR: "0",
        ...env,
      },
      rootDir,
    ),
    timeoutMs: timeout,
    shell: spec.shell ?? false,
    sampleRss,
  }).then(decolour);
}

export { rootDir };
