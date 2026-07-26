/**
 * LSP surface — apples-to-apples editor-server latency.
 *
 * Tools (when available):
 *   - Volar:  @vue/language-server --stdio
 *   - Vize:   vize lsp --stdio
 *   - Verter: verter-lsp / VERTER_LSP_BIN (optional; not always on npm)
 *
 * Phases (same request sequence for every server):
 *   1. initialize + initialized
 *   2. didOpen → first hover          (cold semantic path)
 *   3. hover cold                     (document already open)
 *   4. hover warm median (N=5)
 *   5. completion (optional, same position context)
 *   6. definition (optional)
 *
 * Notes:
 *   - Same workspace, same file, same UTF-16 positions.
 *   - Fresh process per measured run (tool process cache cold).
 *   - workspaceScan is only timed when the server emits a documented ready signal;
 *     otherwise reported as n/a (not zero-filled).
 *   - typescript-native-bridge is NOT an LSP — see methodology; optional
 *     "Volar + workspace TS override" would be a separate experiment, not mixed in.
 */

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { LspClient, pathToFileUri } from "../lsp-client.mjs";
import { ensureLspWorkspace } from "../lsp-workspace.mjs";
import { attachVolarHybridBridge } from "../tsserver-bridge.mjs";
import { measureVariantsAlternating, resolveBin, median } from "../timing.mjs";
import { withTsgoEnv } from "../tsgo.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const WARM_HOVER_N = 5;

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

function resolveVolarServer() {
  try {
    const pkg = require.resolve("@vue/language-server/package.json", {
      paths: [rootDir],
    });
    const dir = dirname(pkg);
    const bin = join(dir, "bin", "vue-language-server.js");
    if (existsSync(bin)) return { command: process.execPath, args: [bin, "--stdio"] };
  } catch {
    // fall through
  }
  return null;
}

function resolveVizeLsp() {
  const vize = tryResolveBin("vize");
  if (!vize) return null;
  // Prefer node entry if cmd wrapping is flaky
  try {
    const pkg = require.resolve("vize/package.json", { paths: [rootDir] });
    const binJs = join(dirname(pkg), "bin", "vize");
    if (existsSync(binJs)) {
      return {
        command: process.execPath,
        args: [binJs, "lsp", "--stdio"],
        shell: false,
      };
    }
  } catch {
    // use bin
  }
  return {
    command: vize,
    args: ["lsp", "--stdio"],
    shell: process.platform === "win32" && vize.endsWith(".cmd"),
  };
}

function resolveVerterLsp() {
  if (process.env.VERTER_LSP_BIN && existsSync(process.env.VERTER_LSP_BIN)) {
    return {
      command: process.env.VERTER_LSP_BIN,
      args: process.env.VERTER_LSP_ARGS
        ? process.env.VERTER_LSP_ARGS.split(/\s+/).filter(Boolean)
        : [],
      shell: false,
      labelExtra: process.env.VERTER_LSP_LABEL ?? "custom binary",
    };
  }

  // Discovery: env, repo-local bin/, sibling checkout (dev/personal/verter), cwd target/
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const candidates = [
    join(rootDir, "bin", "verter-lsp.exe"),
    join(rootDir, "bin", "verter-lsp"),
    // Sibling monorepo: .../personal/vue-benchmarks + .../personal/verter
    join(rootDir, "..", "verter", "target", "release", "verter-lsp.exe"),
    join(rootDir, "..", "verter", "target", "release", "verter-lsp"),
    join(rootDir, "..", "verter", "target", "debug", "verter-lsp.exe"),
    join(rootDir, "..", "verter", "target", "debug", "verter-lsp"),
    // Common absolute-ish local paths via USERPROFILE
    home ? join(home, "dev", "personal", "verter", "target", "release", "verter-lsp.exe") : "",
    home ? join(home, "dev", "personal", "verter", "target", "debug", "verter-lsp.exe") : "",
    join(process.cwd(), "target", "release", "verter-lsp.exe"),
    join(process.cwd(), "target", "release", "verter-lsp"),
  ].filter(Boolean);

  for (const c of candidates) {
    if (existsSync(c)) {
      return {
        command: c,
        args: [],
        shell: false,
        labelExtra: "local build",
      };
    }
  }
  return null;
}

function resolveTsdk() {
  try {
    const ts = require.resolve("typescript/package.json", { paths: [rootDir] });
    return join(dirname(ts), "lib");
  } catch {
    return join(rootDir, "node_modules", "typescript", "lib");
  }
}

/**
 * Run one full LSP session and return phase timings (ms).
 */
async function runLspSession({
  name,
  command,
  args,
  shell,
  rootDir: workspaceDir,
  filePath,
  source,
  probe,
  initializationOptions,
  readyNotifications = [],
  readyTimeoutMs = 15_000,
  /** When true, attach tsserver hybrid bridge (required for modern Volar). */
  volarHybrid = false,
  tsdkPath,
  env = {},
}) {
  const rootUri = pathToFileUri(workspaceDir);
  const fileUri = pathToFileUri(filePath);
  const client = new LspClient(name, command, args, {
    shell,
    cwd: workspaceDir,
    env,
    configuration: {
      typescript: {
        tsdk: initializationOptions?.typescript?.tsdk ?? tsdkPath,
      },
      vue: {},
      volar: {},
      workspaceFolders: [{ uri: rootUri, name: "bench" }],
    },
  });

  let hybrid = null;

  try {
    const tInit0 = performance.now();
    // Hybrid bridge must listen before Volar initialize/open so it does not miss tsserver/request
    if (volarHybrid) {
      hybrid = await attachVolarHybridBridge(client, {
        workspaceDir,
        rootDir,
      });
    }
    await client.initialize(rootUri, {
      initializationOptions,
      timeoutMs: 45_000,
    });
    const initializeMs = performance.now() - tInit0;

    // Optional ready signal (Verter emits $/verter/ready; others may not)
    let workspaceReadyMs = null;
    if (readyNotifications.length) {
      const tR0 = performance.now();
      try {
        await client.waitForNotification(readyNotifications, readyTimeoutMs);
        workspaceReadyMs = performance.now() - tR0;
      } catch {
        workspaceReadyMs = null; // n/a when no ready signal
      }
    }

    const position = { line: probe.line, character: probe.character };

    // didOpen → first hover
    // Some servers finish project load asynchronously; retry hover briefly
    // instead of a single long hang (still counted as one open→hover wall time).
    const tOpen0 = performance.now();
    client.sendNotification("textDocument/didOpen", {
      textDocument: {
        uri: fileUri,
        languageId: "vue",
        version: 1,
        text: source,
      },
    });
    // Brief yield for project service spin-up (same for every tool)
    await new Promise((r) => setTimeout(r, 50));
    let hoverOk = false;
    let lastErr = null;
    // Bounded retries: Volar hybrid can need a moment after tsserver bridge ACK.
    const attempts = volarHybrid ? 6 : 2;
    const perAttemptMs = volarHybrid ? 20_000 : 12_000;
    for (let attempt = 0; attempt < attempts && !hoverOk; attempt++) {
      try {
        await client.sendRequest(
          "textDocument/hover",
          { textDocument: { uri: fileUri }, position },
          perAttemptMs,
        );
        hoverOk = true;
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      }
    }
    if (!hoverOk) {
      throw new Error(
        `${lastErr?.message ?? "hover failed"}${volarHybrid ? " (Volar hybrid: ensure typescript-language-server + @vue/typescript-plugin; see README)" : ""}`,
      );
    }
    const didOpenToHoverMs = performance.now() - tOpen0;

    // hover cold (already open)
    const tCold0 = performance.now();
    await client.sendRequest(
      "textDocument/hover",
      { textDocument: { uri: fileUri }, position },
      30_000,
    );
    const hoverColdMs = performance.now() - tCold0;

    // hover warm
    const warm = [];
    for (let i = 0; i < WARM_HOVER_N; i++) {
      const t0 = performance.now();
      await client.sendRequest(
        "textDocument/hover",
        { textDocument: { uri: fileUri }, position },
        30_000,
      );
      warm.push(performance.now() - t0);
    }
    const hoverWarmMedianMs = median(warm);

    // completion (best-effort; failures recorded as null)
    let completionMs = null;
    try {
      const tC0 = performance.now();
      await client.sendRequest(
        "textDocument/completion",
        {
          textDocument: { uri: fileUri },
          position: { line: probe.line, character: probe.character + 4 },
        },
        15_000,
      );
      completionMs = performance.now() - tC0;
    } catch {
      completionMs = null;
    }

    // definition (best-effort)
    let definitionMs = null;
    try {
      const tD0 = performance.now();
      await client.sendRequest(
        "textDocument/definition",
        { textDocument: { uri: fileUri }, position },
        15_000,
      );
      definitionMs = performance.now() - tD0;
    } catch {
      definitionMs = null;
    }

    return {
      initializeMs,
      workspaceReadyMs,
      didOpenToHoverMs,
      hoverColdMs,
      hoverWarmMedianMs,
      completionMs,
      definitionMs,
      // Primary ranking metric for alternating harness: didOpen→hover (most user-visible cold path)
      ms: didOpenToHoverMs,
      meta: {
        initializeMs,
        workspaceReadyMs,
        didOpenToHoverMs,
        hoverColdMs,
        hoverWarmMedianMs,
        completionMs,
        definitionMs,
      },
    };
  } finally {
    await client.shutdown();
    if (hybrid) await hybrid.close();
  }
}

export async function runLspSurface(_fixtureDir, options) {
  const bulkFiles = options.lspBulkFiles ?? 20;
  const workspace = ensureLspWorkspace({ bulkFiles });
  const tsdk = resolveTsdk();

  const variants = [];

  // --- Volar ---
  const volar = resolveVolarServer();
  if (volar) {
    variants.push({
      id: "volar-language-server",
      label: "Volar (@vue/language-server)",
      package: "@vue/language-server",
      threading: "lsp",
      notes:
        "Official Vue language server v3 hybrid mode. Harness attaches typescript-language-server + @vue/typescript-plugin via tsserver/request↔response (VS Code/Neovim contract). If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover.",
      measure: async () =>
        runLspSession({
          name: "Volar",
          command: volar.command,
          args: volar.args,
          shell: false,
          rootDir: workspace.dir,
          filePath: workspace.file,
          source: workspace.source,
          probe: workspace.probe,
          initializationOptions: {
            typescript: { tsdk },
          },
          readyNotifications: [],
          volarHybrid: true,
          tsdkPath: tsdk,
        }),
    });
  } else {
    variants.push({
      id: "volar-language-server",
      label: "Volar (@vue/language-server)",
      package: "@vue/language-server",
      notes: "Package not installed",
      skip: true,
    });
  }

  // --- Vize ---
  const vize = resolveVizeLsp();
  if (vize) {
    variants.push({
      id: "vize-lsp",
      label: "Vize LSP (vize lsp)",
      package: "vize",
      threading: "lsp",
      notes:
        "vize lsp --stdio. Same workspace/file/position as Volar. Ready signal: none standardized → workspaceReady = n/a.",
      measure: async () =>
        runLspSession({
          name: "Vize",
          command: vize.command,
          args: vize.args,
          shell: vize.shell,
          rootDir: workspace.dir,
          filePath: workspace.file,
          source: workspace.source,
          probe: workspace.probe,
          initializationOptions: {},
          readyNotifications: [],
        }),
    });
  } else {
    variants.push({
      id: "vize-lsp",
      label: "Vize LSP",
      package: "vize",
      notes: "vize binary not found",
      skip: true,
    });
  }

  // --- Verter ---
  const verter = resolveVerterLsp();
  if (verter) {
    variants.push({
      id: "verter-lsp",
      label: `Verter LSP${verter.labelExtra ? ` (${verter.labelExtra})` : ""}`,
      package: "verter-lsp",
      threading: "lsp",
      notes:
        "verter-lsp stdio. Set VERTER_LSP_BIN if not auto-discovered. Waits for $/verter/ready when emitted; otherwise workspaceReady n/a.",
      measure: async () =>
        runLspSession({
          name: "Verter",
          command: verter.command,
          // Pass workspace root as some servers expect CLI cwd/args
          args: [...(verter.args ?? []), workspace.dir],
          shell: verter.shell,
          rootDir: workspace.dir,
          filePath: workspace.file,
          source: workspace.source,
          probe: workspace.probe,
          initializationOptions: {},
          readyNotifications: ["$/verter/ready"],
          readyTimeoutMs: 30_000,
          // Stable tsgo (typescript@7.0.x) for Verter type provider
          env: withTsgoEnv({}, rootDir),
        }),
    });
  } else {
    variants.push({
      id: "verter-lsp",
      label: "Verter LSP",
      package: "verter-lsp",
      notes: "Binary not found. Build verter-lsp or set VERTER_LSP_BIN=/path/to/verter-lsp.",
      skip: true,
    });
  }

  // Fix Vize label typo if any slipped
  for (const v of variants) {
    if (v.label.startsWith("Vory")) v.label = v.label.replace("Vory", "Vize");
  }

  const results = await measureVariantsAlternating(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: 1, // primary metric is latency not files/s; keep 1 for table
  });

  // Enrich notes with phase breakdown from last meta sample
  for (const r of results) {
    if (r.status === "ok" && r.metaSamples?.length) {
      const last = r.metaSamples[r.metaSamples.length - 1];
      const parts = [
        `init=${last.initializeMs?.toFixed?.(0) ?? "?"}ms`,
        `ready=${last.workspaceReadyMs == null ? "n/a" : `${last.workspaceReadyMs.toFixed(0)}ms`}`,
        `open→hover=${last.didOpenToHoverMs?.toFixed?.(0) ?? "?"}ms`,
        `hoverCold=${last.hoverColdMs?.toFixed?.(0) ?? "?"}ms`,
        `hoverWarm=${last.hoverWarmMedianMs?.toFixed?.(0) ?? "?"}ms`,
        `completion=${last.completionMs == null ? "n/a" : `${last.completionMs.toFixed(0)}ms`}`,
        `definition=${last.definitionMs == null ? "n/a" : `${last.definitionMs.toFixed(0)}ms`}`,
      ];
      r.phaseBreakdown = parts.join(" · ");
      r.notes = `${r.notes} | ${r.phaseBreakdown}`;
      // Surface primary metric clearly
      r.primaryMetric = "didOpen→hover (ms)";
    }
  }

  return {
    id: "lsp",
    label: "LSP (editor language server)",
    files: 1,
    bytes: Buffer.byteLength(workspace.source, "utf8"),
    corpus: {
      workspace: workspace.dir,
      file: workspace.fileRel,
      probe: workspace.probe,
      bulkFiles,
    },
    methodology: [
      "Apples-to-apples: identical workspace, LspTarget.vue, UTF-16 hover position on `const benchMarker`.",
      "Each measured run starts a fresh language-server process (tool process cold).",
      "Primary ranking column uses didOpen→hover latency (cold semantic path after open).",
      "Phase breakdown in Notes: initialize, ready (n/a if no server signal), open→hover, hover cold, hover warm median(5), completion, definition.",
      "workspaceReady is ONLY timed when the server documents a ready notification (e.g. $/verter/ready). Missing signal = n/a, not 0.",
      "Completion/definition are best-effort extras; null/n/a does not mean the tool is slower — capability may differ.",
      "typescript-native-bridge (TNB) is a drop-in typescript package for CLI/tsserver — NOT a Vue LSP. It is out of this table; optional future experiment: Volar with TNB as workspace tsdk (same Volar binary, different TS engine).",
      "Verter binary is optional (VERTER_LSP_BIN). Skipped when missing.",
      "VS Code extension host overhead is NOT measured — only the language server stdio protocol.",
      "Measured runs alternate server order each iteration.",
    ],
    variants: results,
  };
}
