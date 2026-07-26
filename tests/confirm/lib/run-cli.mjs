import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { withTsgoEnv } from "../../../scripts/lib/tsgo.mjs";

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
  // package bin field
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
 * @returns {{ status: number|null, stdout: string, stderr: string, combined: string }}
 */
export function runCli(bin, args, { cwd, env = {}, timeout = 120_000 } = {}) {
  if (!bin) {
    return {
      status: null,
      stdout: "",
      stderr: "binary not found",
      combined: "binary not found",
    };
  }
  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");

  const pathSep = process.platform === "win32" ? ";" : ":";
  const pathEnv = `${join(rootDir, "node_modules", ".bin")}${pathSep}${process.env.PATH || ""}`;

  const r = spawnSync(bin, args, {
    cwd,
    encoding: "utf8",
    timeout,
    env: withTsgoEnv(
      {
        ...process.env,
        NODE_PATH: nodePath,
        PATH: pathEnv,
        ...env,
      },
      rootDir,
    ),
    // Avoid shell on Windows when we have a .cmd path — still need shell for .cmd
    shell: process.platform === "win32" && /\.cmd$/i.test(bin),
    maxBuffer: 20 * 1024 * 1024,
  });

  const stdout = r.stdout || "";
  const stderr = r.stderr || "";
  return {
    status: r.status,
    stdout,
    stderr,
    combined: stdout + stderr,
    error: r.error,
  };
}

export { rootDir };
