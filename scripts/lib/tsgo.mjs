/**
 * Resolve the stable tsgo / TypeScript 7 native engine for Verter.
 *
 * Verter requires: tsgo (TypeScript 7 native) stable >=7.0.2, <7.1.0
 * Nightly `@typescript/native-preview` is rejected unless
 * VERTER_TSGO_DEV_ALLOW_NIGHTLY=1.
 *
 * This repo keeps:
 *   - typescript@5.9.x  → vue-tsc / vue-component-meta
 *   - typescript-go (npm:typescript@7.0.2) → Verter tsgo engine
 *
 * Prefer VERTER_TSGO_BIN when set; otherwise resolve the platform native
 * binary from the typescript-go (or typescript@7) install.
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const defaultRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * @param {string} [rootDir]
 * @returns {{ bin: string | null, version: string | null, source: string, notes: string }}
 */
export function resolveTsgoBin(rootDir = defaultRoot) {
  if (process.env.VERTER_TSGO_BIN && existsSync(process.env.VERTER_TSGO_BIN)) {
    return {
      bin: process.env.VERTER_TSGO_BIN,
      version: null,
      source: "VERTER_TSGO_BIN",
      notes: "env override",
    };
  }

  // Package names that may host the TS7 native engine
  const pkgNames = [
    "typescript-go", // alias: npm:typescript@7.0.2
    "typescript", // only if main typescript is already 7.0.x
  ];

  for (const name of pkgNames) {
    try {
      const pkgPath = require.resolve(`${name}/package.json`, {
        paths: [rootDir],
      });
      const pkg = readJson(pkgPath);
      const version = String(pkg.version || "");
      // Accept only stable 7.0.x (not 7.1+, not 5.x, not nightlies)
      if (!/^7\.0\.\d+$/.test(version)) {
        continue;
      }
      const pkgDir = dirname(pkgPath);
      const platformPkg = `@typescript/typescript-${process.platform}-${process.arch}`;
      let platformDir = null;
      try {
        platformDir = dirname(
          require.resolve(`${platformPkg}/package.json`, {
            paths: [pkgDir, rootDir],
          }),
        );
      } catch {
        platformDir = null;
      }
      if (!platformDir) continue;

      const exeName =
        process.platform === "win32" ? "tsc.exe" : "tsc";
      // TS7 ships the native engine as tsc[.exe] under the platform package lib/
      const candidates = [
        join(platformDir, "lib", exeName),
        join(platformDir, exeName),
        // Some layouts keep a non-.exe unix name on win (unlikely)
        join(platformDir, "lib", "tsc"),
      ];
      for (const c of candidates) {
        if (existsSync(c)) {
          return {
            bin: c,
            version,
            source: `${name}@${version} → ${platformPkg}`,
            notes: "stable TypeScript 7 native engine (tsgo)",
          };
        }
      }
    } catch {
      // try next package name
    }
  }

  return {
    bin: null,
    version: null,
    source: "none",
    notes:
      "Install typescript-go (typescript@7.0.2) or set VERTER_TSGO_BIN to a stable tsgo binary",
  };
}

/**
 * Env fragment to inject into verter-tsc / verter-lsp spawns.
 * @param {string} [rootDir]
 * @returns {Record<string, string>}
 */
export function tsgoEnv(rootDir = defaultRoot) {
  const { bin } = resolveTsgoBin(rootDir);
  if (!bin) return {};
  return { VERTER_TSGO_BIN: bin };
}

/**
 * Merge tsgo env into an existing env object (for runCommand).
 */
export function withTsgoEnv(env = {}, rootDir = defaultRoot) {
  return { ...env, ...tsgoEnv(rootDir) };
}

/**
 * Which TypeScript engine does each checker actually run on?
 *
 * This is a first-class fairness axis, not a footnote. The typecheck surface
 * spans three engines: vue-tsc on the JavaScript TypeScript compiler, and the
 * others on native tsgo builds (one stable, one nightly). Ranking a JS engine
 * against a native one measures TypeScript's own rewrite, not the Vue layer
 * sitting on top of it — so engines are ranked in separate tables and the
 * engine is printed on every row.
 */
export function resolveToolEngine(id, rootDir = defaultRoot) {
  const readVersion = (spec) => {
    try {
      return require(require.resolve(`${spec}/package.json`, { paths: [rootDir] })).version;
    } catch {
      return null;
    }
  };

  if (id === "vue-tsc") {
    const v = readVersion("typescript");
    // vue-tsc drives the TypeScript compiler API, which only the JS package
    // provides — the tsgo npm package is a native-binary wrapper, not a
    // drop-in API, so vue-tsc cannot simply be pointed at it.
    return { engine: "tsc-js", version: v, label: `TypeScript ${v ?? "?"} (JS)` };
  }

  if (id === "vize-check") {
    // Vize bundles its own tsgo; read the exact build from its shim.
    const shim = join(rootDir, "node_modules", "vize", "node_modules", ".bin", "tsgo");
    if (existsSync(shim)) {
      const m = readFileSync(shim, "utf8").match(/@typescript\+native-preview@([\d.a-zA-Z-]+)/);
      const version = m?.[1] ?? null;
      const nightly = Boolean(version && /dev|preview/.test(version));
      return {
        engine: "tsgo",
        version,
        nightly,
        label: `tsgo ${version ?? "?"}${nightly ? " (nightly)" : ""}`,
      };
    }
    return { engine: "tsgo", version: null, label: "tsgo (bundled)" };
  }

  if (id === "verter-tsc") {
    const t = resolveTsgoBin(rootDir);
    return { engine: "tsgo", version: t.version, label: `tsgo ${t.version ?? "?"} (${t.source})` };
  }

  if (id.startsWith("golar")) {
    const v = readVersion("typescript-go") ?? readVersion("@typescript/native-preview");
    return { engine: "tsgo", version: v, label: `typescript-go ${v ?? "?"}` };
  }

  return { engine: "unknown", version: null, label: "unknown engine" };
}
