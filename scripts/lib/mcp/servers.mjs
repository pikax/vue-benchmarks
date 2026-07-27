/**
 * Discover MCP servers to benchmark.
 *
 * ── STATUS: foundation only, no suite yet ──────────────────────────────────
 * Nothing imports this module or its sibling `client.mjs`. A benchmark with
 * one working participant cannot rank anything, and as of 2026-07-27 that is
 * still the position — though for a different reason than when this was
 * written.
 *
 * Measured, both servers installed (verter-mcp 0.0.1-beta.3,
 * @vizejs/musea-mcp-server 0.291.0). Both start and answer `tools/list`:
 * verter-mcp exposes 49 tools, musea-mcp 13, with no exact-name overlap, so
 * the hand-authored CAPABILITY map below is the only way to pair them. The
 * pairing itself holds up — the two descriptions ask the same question:
 *
 *   verter-mcp get_component_api : "Get the public API surface of a Vue
 *                                   component: props, emits, slots, models,
 *                                   expose."
 *   musea-mcp  analyze_component : "Statically analyze a Vue SFC to extract
 *                                   its props and emits."
 *
 * Called on the same SFC, `get_component_api` returns a full answer (props,
 * emits and slots all present). `analyze_component` fails:
 *
 *   MCP error -32603: analyzeSfc not available in native binding
 *
 * So the one shared capability is currently unrunnable on the musea side, and
 * a ranked table would be a table of one. Kept because the blocker is an
 * upstream defect rather than a design problem: re-run the check when musea
 * ships a working binding.
 *
 * Sentences below written in the present tense ("callers refuse to rank a
 * debug binary") describe the intended contract, not code that exists today.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Resolution is the INSTALLED PACKAGE, and nothing else. Both servers resolve
 * through their own published entry point and are skipped when absent.
 *
 * There used to be a ladder — env override, repo-local `bin/`, npm, then a
 * sibling source checkout with release ordered before debug — plus a
 * `buildKind`/`rankable` guard so a debug binary could not be ranked. All of it
 * existed because the packages were unpublished. They are published now, so the
 * ladder is gone and the guard has nothing left to guard: an npm platform
 * package is a release build. See `resolveVerterLsp` in
 * `scripts/lib/surfaces/lsp.mjs`, which lost the same apparatus for the same
 * reason and describes what silent local-path discovery cost.
 *
 * Vize ships its MCP server as its OWN npm package rather than a `vize`
 * subcommand, which is why neither `vize --help` nor the CLI surface reveals
 * it. The Vue language tools have none. This returns a list rather than one
 * server so that stays true by inspection instead of by assumption.
 */

import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * Installed version of a package, or null — so a row names the artifact that
 * produced it. Resolves by path rather than `require.resolve(<pkg>/package.json)`,
 * which throws for any package whose `exports` omits "./package.json".
 */
function pkgVersion(name) {
  const dir = join(rootDir, "node_modules", ...name.split("/"));
  try {
    return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).version ?? null;
  } catch {
    return null;
  }
}

/**
 * The published `verter-mcp` server binary, or an unavailable descriptor.
 *
 * npm ONLY, for the same reason as `resolveVerterLsp` in
 * `scripts/lib/surfaces/lsp.mjs`. This used to search repo-local `bin/`, the
 * `.bin` shims, and a sibling `../verter/target/{release,debug}` checkout,
 * ordering release before debug precisely because picking up a debug build
 * would publish a number roughly an order of magnitude too slow. That whole
 * apparatus existed to work around the package not being published. It is
 * published, so the apparatus is gone — and with it the `buildKind` /
 * `rankable` debug guard, which had nothing left to guard against: an npm
 * platform package is a release build.
 *
 * The `.bin` shim entries were also wrong in the way `verter-lsp` was: they
 * point at `bin/run.js`, a Node launcher, so the row would have paid a Node
 * startup the product does not. Resolved through the package's own
 * `resolveServerBinary()` instead, which returns the native executable.
 */
function resolveVerterMcp() {
  try {
    const { resolveServerBinary } = require("verter-mcp");
    const resolved = resolveServerBinary?.();
    if (resolved?.path && existsSync(resolved.path)) {
      return {
        id: "verter-mcp",
        label: "Verter MCP",
        command: resolved.path,
        // --project-root is filled in per run: the fixture differs by suite.
        args: (projectRoot) => ["--project-root", projectRoot],
        shell: false,
        version: pkgVersion("verter-mcp"),
        rankable: true,
        notes: `npm ${pkgVersion("verter-mcp") ?? "package"}`,
      };
    }
  } catch {
    // Not installed, or no platform package for this host.
  }

  return {
    id: "verter-mcp",
    label: "Verter MCP",
    command: null,
    version: null,
    rankable: false,
    notes: "Not found. Install `verter-mcp` from npm.",
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
  // Direct path: the package's `exports` map exposes only ".", so
  // `require.resolve("@vizejs/musea-mcp-server/package.json")` is blocked by
  // exports encapsulation and throws even when the package is installed. The
  // same packaging detail once sent the Vize LSP resolver down a shell shim,
  // which is why it is spelled out rather than worked around silently.
  const cli = join(rootDir, "node_modules", "@vizejs", "musea-mcp-server", "dist", "cli.mjs");

  if (existsSync(cli)) {
    return {
      id: "musea-mcp",
      label: "Vize Musea MCP",
      // Spawned through node directly: the .bin shim is a .cmd on Windows and
      // would add a cmd.exe hop that the other server does not pay.
      command: process.execPath,
      args: (projectRoot) => [cli, "--project", projectRoot],
      shell: false,
      version: pkgVersion("@vizejs/musea-mcp-server"),
      rankable: true,
      notes: `npm ${pkgVersion("@vizejs/musea-mcp-server") ?? "package"}`,
    };
  }

  return {
    id: "musea-mcp",
    label: "Vize Musea MCP",
    command: null,
    version: null,
    rankable: false,
    notes: "Not found. Install `@vizejs/musea-mcp-server`.",
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
