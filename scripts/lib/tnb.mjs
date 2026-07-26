/**
 * typescript-native-bridge (TNB) — vue-tsc on the native tsgo engine.
 *
 * TNB is a `typescript`-shaped drop-in whose checker is Microsoft's Go compiler
 * (tsgo) running in-process over a cgo NAPI/FFI bridge. It is what finally makes
 * vue-tsc comparable to the native-engine checkers: same Vue layer, same
 * TypeScript engine, so the remaining difference is the Vue layer itself.
 *
 * It lives in `envs/tnb` as a standalone project rather than as the documented
 * root `typescript` override, because a root override would swap the engine
 * under vue-component-meta, type-aware ESLint, the Vue language server and
 * verter-tsc at the same time — silently changing surfaces that are not part of
 * this comparison. See envs/tnb/README.md.
 *
 * Engine selection is bin-relative: vue-tsc resolves `typescript/lib/tsc` from
 * its own package location, never from cwd, so this binary stays on TNB when
 * invoked against a fixture directory elsewhere.
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const defaultRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** Where the isolated TNB install lives, relative to the repo root. */
export const TNB_ENV_DIR = join("envs", "tnb");

/**
 * TNB prints this banner on startup. The harness treats its ABSENCE as a gate
 * failure: a bridge that quietly fell back to the JavaScript checker would
 * still be labelled "native" on the row while running JS, which is precisely
 * the kind of silent mislabel the work gate exists to catch.
 */
export const TNB_ACTIVE_RE = /TNB\s+ACTIVE/i;

/** @param {string} text combined stdout+stderr of a TNB-backed invocation */
export function tnbActive(text = "") {
  return TNB_ACTIVE_RE.test(text);
}

/**
 * TNB's `lib` directory, for use as an LSP `tsdk`.
 *
 * Volar v3 has no in-process TypeScript language service — it delegates every
 * TypeScript answer to a separate tsserver, and `tsdk` is what selects which
 * TypeScript that is. Pointing it here runs Volar's TypeScript half on tsgo
 * while the Vue half is byte-identical, which is the LSP analogue of the
 * `vue-tsc (TNB)` typecheck row: one variable, the engine.
 *
 * TNB ships a real `lib/tsserver.js`, so this is the supported surface rather
 * than a trick — but it is still verified at runtime (the row asserts the
 * hybrid bridge came up and the hover content is correct) rather than assumed.
 *
 * @returns {{ dir: string | null, notes: string }}
 */
export function resolveTnbTsdk(rootDir = defaultRoot) {
  const envDir = join(rootDir, TNB_ENV_DIR);
  try {
    const pkgPath = require.resolve("typescript/package.json", { paths: [envDir] });
    const pkg = readJson(pkgPath);
    if (pkg?.name !== "typescript-native-bridge") {
      return { dir: null, notes: `${TNB_ENV_DIR} typescript is ${pkg?.name ?? "?"}, not TNB` };
    }
    const lib = join(dirname(pkgPath), "lib");
    if (!existsSync(join(lib, "tsserver.js"))) {
      return { dir: null, notes: "TNB has no lib/tsserver.js — cannot back a language server" };
    }
    return { dir: lib, notes: `TNB ${pkg.version} tsdk` };
  } catch {
    return { dir: null, notes: `${TNB_ENV_DIR} not installed` };
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Resolve the TNB-backed vue-tsc entry point.
 *
 * Returns the JS entry (not the `.bin` shim) so the caller can spawn it with
 * `process.execPath`. The shim would add a cmd.exe hop on Windows that the
 * other rows do not all pay, and this surface is a like-for-like comparison.
 *
 * @param {string} [rootDir]
 * @returns {{
 *   entry: string | null,
 *   tnbVersion: string | null,
 *   tsgoVersion: string | null,
 *   tsApiVersion: string | null,
 *   vueTscVersion: string | null,
 *   notes: string,
 * }}
 */
export function resolveTnbVueTsc(rootDir = defaultRoot) {
  const envDir = join(rootDir, TNB_ENV_DIR);
  const missing = {
    entry: null,
    tnbVersion: null,
    tsgoVersion: null,
    tsApiVersion: null,
    vueTscVersion: null,
  };

  if (!existsSync(envDir)) {
    return { ...missing, notes: `${TNB_ENV_DIR} not present` };
  }

  let entry = null;
  let vueTscVersion = null;
  try {
    const pkgPath = require.resolve("vue-tsc/package.json", { paths: [envDir] });
    vueTscVersion = readJson(pkgPath)?.version ?? null;
    const candidate = join(dirname(pkgPath), "bin", "vue-tsc.js");
    if (existsSync(candidate)) entry = candidate;
  } catch {
    entry = null;
  }

  if (!entry) {
    return {
      ...missing,
      notes: `vue-tsc not installed in ${TNB_ENV_DIR} — run: pnpm install --dir ${TNB_ENV_DIR} --ignore-workspace`,
    };
  }

  // The `typescript` specifier in envs/tnb must actually resolve to TNB. If it
  // resolves to the stock JS package the install is misconfigured, and ranking
  // the row as native would be a lie — so report it as unresolved instead.
  let tnbVersion = null;
  let tsApiVersion = null;
  try {
    const tsPkgPath = require.resolve("typescript/package.json", { paths: [entry, envDir] });
    const tsPkg = readJson(tsPkgPath);
    if (tsPkg?.name === "typescript-native-bridge") {
      tnbVersion = tsPkg.version ?? null;
    } else {
      return {
        ...missing,
        vueTscVersion,
        notes: `${TNB_ENV_DIR} resolves typescript to ${tsPkg?.name ?? "?"}@${tsPkg?.version ?? "?"}, not typescript-native-bridge`,
      };
    }
    // Version encodes both halves: <tsApi>-bridge.<n>.tsgo.<tsgoVersion>
    const m = /^([\d.]+)-bridge\.[^.]+\.tsgo\.([\d.]+)/.exec(tnbVersion ?? "");
    tsApiVersion = m?.[1] ?? null;
  } catch {
    return { ...missing, vueTscVersion, notes: `${TNB_ENV_DIR} has no resolvable typescript` };
  }

  const tsgoMatch = /\.tsgo\.([\d.]+)/.exec(tnbVersion ?? "");

  return {
    entry,
    tnbVersion,
    tsgoVersion: tsgoMatch?.[1] ?? null,
    tsApiVersion,
    vueTscVersion,
    notes: "typescript-native-bridge (tsgo in-process via NAPI/FFI)",
  };
}
