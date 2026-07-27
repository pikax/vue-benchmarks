/**
 * Discover MCP servers to benchmark.
 *
 * ── STATUS: foundation only, no suite yet ──────────────────────────────────
 * Nothing imports this module or its sibling `client.mjs`. The MCP benchmark
 * is deliberately unfinished: `verter-mcp` is not published yet, and a
 * benchmark with one participant cannot rank anything, so the suite that would
 * consume this is waiting on a second implementation to compare against.
 *
 * Kept rather than deleted because publication is imminent. When it lands, the
 * suite ranks ONLY the single shared capability (see `CAPABILITY` below) and
 * treats everything else as unranked-but-validated, the same rule every other
 * surface here follows. Sentences below written in the present tense
 * ("callers refuse to rank a debug binary") describe that intended contract,
 * not code that exists today.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Resolution mirrors `resolveVerterLsp`, in this order:
 *   1. explicit env override
 *   2. repo-local bin/
 *   3. npm install (`verter-mcp` is being published, like `verter-lsp`)
 *   4. sibling source checkout, release BEFORE debug
 *
 * The build kind is part of the result and is NOT cosmetic. A Rust debug build
 * is routinely an order of magnitude slower than release, so timing one and
 * publishing the number would be worse than not measuring at all. Callers
 * refuse to rank a debug binary; correctness gates still run against it, since
 * behaviour does not change between profiles.
 *
 * Only Verter ships an MCP server today — Vize has no `mcp` subcommand and the
 * Vue language tools have none. This returns a list rather than one server so
 * that stays true by inspection instead of by assumption.
 */

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * "release" | "debug" | "packaged".
 * `packaged` = came from an npm install, where the publisher controls the
 * profile and a release build is the reasonable assumption.
 */
function buildKindOf(binPath) {
  const p = binPath.split(sep).join("/");
  if (/\/target\/release\//.test(p)) return "release";
  if (/\/target\/debug\//.test(p)) return "debug";
  return "packaged";
}

function resolveVerterMcp() {
  const candidates = [];

  if (process.env.VERTER_MCP_BIN) candidates.push(process.env.VERTER_MCP_BIN);

  candidates.push(join(rootDir, "bin", "verter-mcp.exe"), join(rootDir, "bin", "verter-mcp"));

  // npm: the published package, resolved the same way any other bin is.
  for (const name of ["verter-mcp.cmd", "verter-mcp"]) {
    candidates.push(join(rootDir, "node_modules", ".bin", name));
  }
  try {
    const pkg = require.resolve("verter-mcp/package.json", { paths: [rootDir] });
    const dir = dirname(pkg);
    candidates.push(
      join(dir, "bin", "verter-mcp.exe"),
      join(dir, "bin", "verter-mcp"),
      join(dir, "verter-mcp.exe"),
    );
  } catch {
    // Not installed yet — expected until it is published.
  }

  // Sibling checkout. Release first, ALWAYS: picking up a debug binary because
  // it happened to be built more recently would silently publish a number ~10x
  // too slow.
  const home = process.env.USERPROFILE || process.env.HOME || "";
  for (const profile of ["release", "debug"]) {
    candidates.push(
      join(rootDir, "..", "verter", "target", profile, "verter-mcp.exe"),
      join(rootDir, "..", "verter", "target", profile, "verter-mcp"),
    );
    if (home) {
      candidates.push(
        join(home, "dev", "personal", "verter", "target", profile, "verter-mcp.exe"),
        join(home, "dev", "personal", "verter", "target", profile, "verter-mcp"),
      );
    }
  }

  for (const c of candidates.filter(Boolean)) {
    if (!existsSync(c)) continue;
    const buildKind = buildKindOf(c);
    return {
      id: "verter-mcp",
      label: "Verter MCP",
      command: c,
      // --project-root is filled in per run: the fixture differs by suite.
      args: (projectRoot) => ["--project-root", projectRoot],
      shell: c.endsWith(".cmd"),
      buildKind,
      rankable: buildKind !== "debug",
      notes:
        buildKind === "debug"
          ? "DEBUG build — correctness is gated, timings are NOT ranked (a debug Rust build is routinely ~10x slower than release). Install the published `verter-mcp`, or set VERTER_MCP_BIN to a release binary."
          : `${buildKind} build`,
    };
  }

  return {
    id: "verter-mcp",
    label: "Verter MCP",
    command: null,
    buildKind: null,
    rankable: false,
    notes:
      "Not found. Install `verter-mcp` from npm, set VERTER_MCP_BIN, or build it in a sibling verter checkout.",
  };
}

/**
 * Vize's MCP server ships as its OWN npm package, `@vizejs/musea-mcp-server`,
 * not as a `vize` subcommand — which is why neither `vize --help` nor its
 * config schema mentions MCP.
 *
 * Its domain is the design system: component catalog, variants, design tokens,
 * Storybook CSF, docs. It has no compile, lint or diagnostics tools. The only
 * question it and verter-mcp both answer is "what are this SFC's props and
 * emits", so that is the ONLY thing ranked across the two — see CAPABILITY
 * below and the suite's comparison classes.
 */
function resolveMuseaMcp() {
  const candidates = [];
  if (process.env.MUSEA_MCP_BIN) candidates.push(process.env.MUSEA_MCP_BIN);
  // Direct path first. The package's `exports` map exposes only ".", so
  // `require.resolve("@vizejs/musea-mcp-server/package.json")` is blocked by
  // exports encapsulation and throws even when the package is installed.
  candidates.push(
    join(rootDir, "node_modules", "@vizejs", "musea-mcp-server", "dist", "cli.mjs"),
  );
  try {
    const pkg = require.resolve("@vizejs/musea-mcp-server/package.json", { paths: [rootDir] });
    candidates.push(join(dirname(pkg), "dist", "cli.mjs"));
  } catch {
    // Blocked by exports, or not installed — the direct path above covers it.
  }

  for (const c of candidates.filter(Boolean)) {
    if (!existsSync(c)) continue;
    return {
      id: "musea-mcp",
      label: "Vize Musea MCP",
      // Spawned through node directly: the .bin shim is a .cmd on Windows and
      // would add a cmd.exe hop that the other server does not pay.
      command: process.execPath,
      args: (projectRoot) => [c, "--project", projectRoot],
      shell: false,
      buildKind: "packaged",
      rankable: true,
      notes: "published npm build",
    };
  }

  return {
    id: "musea-mcp",
    label: "Vize Musea MCP",
    command: null,
    buildKind: null,
    rankable: false,
    notes: "Not found. Install `@vizejs/musea-mcp-server`, or set MUSEA_MCP_BIN.",
  };
}

/**
 * Which servers can be ranked against each other, and on what.
 *
 * Only operations listed here are compared across servers; everything else is
 * measured and gated PER SERVER and never pooled. verter-mcp is an analysis /
 * diagnostics / compilation server and musea-mcp is a design-system server —
 * they overlap on one question, and a table that ranked "MCP latency" across
 * them would be comparing different products.
 */
export const CAPABILITY = {
  "component-api": {
    label: "Component API (props + emits)",
    shared: true,
    tools: { "verter-mcp": "get_component_api", "musea-mcp": "analyze_component" },
  },
};

/** Every MCP server this harness knows how to talk to. */
export function resolveMcpServers() {
  return [resolveVerterMcp(), resolveMuseaMcp()].filter(Boolean);
}

export { buildKindOf };
