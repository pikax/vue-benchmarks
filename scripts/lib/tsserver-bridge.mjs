/**
 * Volar hybrid bridge via typescript-language-server (official client pattern).
 *
 * Vue language-tools v3 requires the LSP *client* to:
 *   1. Receive notification `tsserver/request` with params [id, command, args]
 *      (sometimes nested as [[id, command, args]])
 *   2. Forward to a TypeScript language server that supports
 *      `typescript.tsserverRequest` (typescript-language-server ≥ 4.4 / vtsls)
 *   3. Reply with notification `tsserver/response` [id, body]
 *
 * This is the same contract Neovim/VS Code use — not a Volar-specific shortcut.
 * Vize and Verter do not need this bridge.
 *
 * @see https://github.com/vuejs/language-tools/discussions/5456
 */

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { LspClient, pathToFileUri } from "./lsp-client.mjs";

const require = createRequire(import.meta.url);

export function resolveTsserverPaths(fromDir) {
  const tsPkg = require.resolve("typescript/package.json", { paths: [fromDir] });
  const tsDir = dirname(tsPkg);
  let vuePlugin = null;
  try {
    vuePlugin = dirname(
      require.resolve("@vue/typescript-plugin/package.json", { paths: [fromDir] }),
    );
  } catch {
    vuePlugin = null;
  }
  let tsLsBin = null;
  try {
    const p = require.resolve("typescript-language-server/package.json", {
      paths: [fromDir],
    });
    tsLsBin = join(dirname(p), "lib", "cli.mjs");
    if (!existsSync(tsLsBin)) {
      tsLsBin = join(dirname(p), "lib", "cli.js");
    }
  } catch {
    tsLsBin = null;
  }
  return {
    tsserverJs: join(tsDir, "lib", "tsserver.js"),
    tsDir,
    vuePlugin,
    tsLsBin,
  };
}

function unwrapTuple(params) {
  let p = params;
  for (let i = 0; i < 4; i++) {
    if (Array.isArray(p) && p.length === 1 && Array.isArray(p[0])) {
      p = p[0];
      continue;
    }
    break;
  }
  if (Array.isArray(p) && p.length >= 2) {
    return { requestId: p[0], command: p[1], args: p[2] };
  }
  return { requestId: 0, command: "", args: undefined };
}

/**
 * Start typescript-language-server and attach hybrid bridge to a Volar LspClient.
 * Returns { close }.
 */
export async function attachVolarHybridBridge(volarClient, { workspaceDir, rootDir }) {
  const paths = resolveTsserverPaths(rootDir);
  if (!paths.tsLsBin || !existsSync(paths.tsLsBin)) {
    throw new Error(
      "typescript-language-server not installed (needed for Volar hybrid tsserver bridge)",
    );
  }

  const tsClient = new LspClient("ts_ls", process.execPath, [paths.tsLsBin, "--stdio"], {
    cwd: workspaceDir,
    configuration: {
      typescript: {},
      javascript: {},
    },
  });

  const rootUri = pathToFileUri(workspaceDir);

  // Init TS language server with Vue plugin
  const initOptions = {
    hostInfo: "vue-benchmarks",
    plugins: paths.vuePlugin
      ? [
          {
            name: "@vue/typescript-plugin",
            location: paths.vuePlugin,
            languages: ["vue"],
          },
        ]
      : [],
    preferences: {},
  };

  await tsClient.initialize(rootUri, {
    initializationOptions: initOptions,
    timeoutMs: 30_000,
  });

  // Open a dummy TS context so the project loads
  // (Vue files are opened via the Vue LS; tsserver plugin hooks them.)

  volarClient.on("notification", (method, params) => {
    if (method !== "tsserver/request") return;
    const { requestId, command, args } = unwrapTuple(params);

    const reply = (body) => {
      try {
        volarClient.sendNotification("tsserver/response", [requestId, body]);
      } catch {
        // ignore
      }
    };

    if (!command) {
      reply(null);
      return;
    }

    if (process.env.LSP_BENCH_DEBUG) {
      console.error(`[hybrid] → ts_ls ${command}`);
    }

    // Official bridge: workspace/executeCommand typescript.tsserverRequest
    tsClient
      .sendRequest(
        "workspace/executeCommand",
        {
          command: "typescript.tsserverRequest",
          arguments: [command, args],
        },
        15_000,
      )
      .then((result) => {
        // ts_ls wraps body
        const body = result?.body ?? result;
        if (process.env.LSP_BENCH_DEBUG) {
          console.error(`[hybrid] ← id=${requestId} has=${body != null}`);
        }
        reply(body ?? null);
      })
      .catch((err) => {
        if (process.env.LSP_BENCH_DEBUG) {
          console.error(`[hybrid] err`, err?.message);
        }
        reply(null);
      });
  });

  return {
    tsClient,
    async close() {
      await tsClient.shutdown();
    },
  };
}

// Keep old names as thin wrappers so call sites can migrate cleanly
export function startTsserver() {
  throw new Error("Use attachVolarHybridBridge instead of startTsserver");
}
export function attachVolarTsserverBridge() {
  throw new Error("Use attachVolarHybridBridge instead of attachVolarTsserverBridge");
}
