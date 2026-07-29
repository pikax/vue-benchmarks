import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCommand, resolveBin } from "./timing.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function pkgVersion(name, fallback = "unknown") {
  // Prefer package root package.json (works even when "exports" blocks deep imports).
  const direct = join(rootDir, "node_modules", ...name.split("/"), "package.json");
  if (existsSync(direct)) {
    try {
      return JSON.parse(readFileSync(direct, "utf8")).version ?? fallback;
    } catch {
      // continue
    }
  }
  try {
    const pkgPath = require.resolve(`${name}/package.json`, { paths: [rootDir] });
    return JSON.parse(readFileSync(pkgPath, "utf8")).version ?? fallback;
  } catch {
    try {
      // Some packages don't export package.json; walk from main entry.
      const mainPath = require.resolve(name, { paths: [rootDir] });
      let dir = dirname(mainPath);
      for (let i = 0; i < 8; i++) {
        const pkg = join(dir, "package.json");
        if (existsSync(pkg)) {
          const json = JSON.parse(readFileSync(pkg, "utf8"));
          if (json.name === name || json.name?.endsWith(name.split("/").pop())) {
            return json.version ?? fallback;
          }
          if (json.version && json.name?.startsWith("@") === name.startsWith("@")) {
            // keep walking if name mismatch
          }
        }
        const parent = dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
    } catch {
      // ignore
    }
    return fallback;
  }
}

function cliVersion(binName, args = ["--version"]) {
  try {
    const bin = resolveBin(binName, rootDir);
    const { stdout, stderr, status } = runCommand(bin, args, {
      cwd: rootDir,
      allowNonZeroExit: true,
      shell: process.platform === "win32" && bin.endsWith(".cmd"),
    });
    const text = `${stdout}\n${stderr}`.trim();
    const match = text.match(/(\d+\.\d+\.\d+(?:[-+][\w.]+)?)/);
    return match?.[1] ?? (status === 0 ? text.split("\n")[0] : "unknown");
  } catch {
    return "unavailable";
  }
}

export function collectVersions() {
  return {
    node: process.version,
    vue: pkgVersion("vue"),
    "@vue/compiler-sfc": pkgVersion("@vue/compiler-sfc"),
    "@vue/compiler-sfc-36": pkgVersion("@vue/compiler-sfc-36"),
    vize: pkgVersion("vize"),
    "@vizejs/native": pkgVersion("@vizejs/native"),
    "@verter/native": pkgVersion("@verter/native"),
    "@fervid/napi": pkgVersion("@fervid/napi"),
    "verter-tsc": pkgVersion("verter-tsc"),
    "@verter/component-meta": pkgVersion("@verter/component-meta"),
    // The LSP row used to resolve an unversioned local build, so it was the one
    // server in the table with nothing to pin it to. Reported now that the
    // package is published.
    "verter-lsp": pkgVersion("verter-lsp"),
    "verter-mcp": pkgVersion("verter-mcp"),
    // Volar's two halves. Neither was reported either, so of the three servers
    // in the LSP table only Vize could be traced to a version.
    "@vue/language-server": pkgVersion("@vue/language-server"),
    "@vue/typescript-plugin": pkgVersion("@vue/typescript-plugin"),
    "typescript-language-server": pkgVersion("typescript-language-server"),
    "vue-tsc": pkgVersion("vue-tsc"),
    "vue-component-meta": pkgVersion("vue-component-meta"),
    golar: pkgVersion("golar"),
    "@golar/vue": pkgVersion("@golar/vue"),
    prettier: pkgVersion("prettier"),
    oxfmt: pkgVersion("oxfmt"),
    oxlint: pkgVersion("oxlint"),
    "@biomejs/biome": pkgVersion("@biomejs/biome"),
    typescript: pkgVersion("typescript"),
    "cli:vize": cliVersion("vize", ["--version"]),
    "cli:vue-tsc": cliVersion("vue-tsc", ["--version"]),
    "cli:verter-tsc": cliVersion("verter-tsc", ["--version"]),
    "cli:golar": cliVersion("golar", ["--version"]),
    "cli:prettier": cliVersion("prettier", ["--version"]),
    "cli:oxfmt": cliVersion("oxfmt", ["--version"]),
    "cli:oxlint": cliVersion("oxlint", ["--version"]),
    "cli:biome": cliVersion("biome", ["--version"]),
    "vue-jsx-vapor": pkgVersion("vue-jsx-vapor"),
    "@vue-jsx-vapor/compiler-rs": pkgVersion("@vue-jsx-vapor/compiler-rs"),
    "@vue/babel-plugin-jsx": pkgVersion("@vue/babel-plugin-jsx"),
    "@babel/core": pkgVersion("@babel/core"),
  };
}
