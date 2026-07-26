/**
 * Volar hybrid bridge via typescript-language-server (official client pattern).
 *
 * Vue language-tools v3 dropped the in-process TypeScript language service.
 * `@vue/language-server` alone answers only Vue-specific features (template,
 * style, SFC structure); every TypeScript answer — including `quickinfo` for a
 * symbol in `<script setup>` — comes from a *separate* TypeScript server that
 * has `@vue/typescript-plugin` loaded. Volar is a two-process product, and the
 * editor client is what joins the halves:
 *
 *   1. Volar sends notification `tsserver/request` with the tuple
 *      `[id, command, args]`.
 *   2. The client forwards it to a TypeScript language server that exposes
 *      `typescript.tsserverRequest` (typescript-language-server >= 4.4 / vtsls).
 *   3. The client replies with notification `tsserver/response` `[id, body]`.
 *   4. The client ALSO syncs open documents to the TypeScript server and asks
 *      it for TypeScript language features, merging with Volar's answer.
 *
 * Two wire details are load-bearing and were the original bug:
 *
 *   - vscode-jsonrpc spreads ARRAY params positionally
 *     (`notificationHandler(...params)`). Volar's handler is
 *     `([id, res]) => …`, i.e. it takes ONE argument that is the tuple, so the
 *     params on the wire must be `[[id, body]]`, not `[id, body]`. Sending the
 *     flat form makes Volar's handler throw `number N is not iterable` and the
 *     request is dropped. Volar's `sendTsServerRequest` is a bare
 *     `new Promise(resolve => …)` with no timeout and no reject path, so a
 *     dropped response hangs the language service forever. Volar's own
 *     `tsserver/request` arrives as `[[id, command, args]]` for the same
 *     reason — `unwrapTuple` below undoes it.
 *   - `_vue:projectInfo` (the first thing Volar asks on any request) only
 *     succeeds if the `.vue` file is already open in the TypeScript server.
 *     Real editors do open it: `@vue/typescript-plugin` declares
 *     `languages: ["vue"]`, which puts `vue` in the TS server's accepted
 *     language ids. Without the sync the command fails and Volar falls back to
 *     a project-less language service.
 *
 * This is the same contract VS Code and Neovim implement, not a Volar-specific
 * shortcut. Vize and Verter are single-process and need none of it.
 *
 * @see https://github.com/vuejs/language-tools/discussions/5456
 */

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { LspClient, pathToFileUri } from "./lsp-client.mjs";

const require = createRequire(import.meta.url);

/** Cap on a single forwarded tsserver command. */
const TS_REQUEST_TIMEOUT_MS = 15_000;

/**
 * @param {string} fromDir resolution root for typescript / plugin / ts_ls
 * @param {string} [tsdkDir] explicit TypeScript `lib` directory to use instead
 *   of resolving `typescript` from `fromDir`. This is what actually selects the
 *   engine: Volar v3 answers no TypeScript itself, so the compiler in play is
 *   whichever `tsserver.js` THIS bridge launches. Passing a different `tsdk` in
 *   `initializationOptions` does nothing on its own — verified by pointing tsdk
 *   at a nonexistent directory and watching the session still succeed.
 */
export function resolveTsserverPaths(fromDir, tsdkDir) {
  if (tsdkDir) {
    const candidate = join(tsdkDir, "tsserver.js");
    if (!existsSync(candidate)) {
      throw new Error(
        `tsdk override has no tsserver.js: ${candidate} — refusing to fall back, the row would be labelled with an engine it is not running`,
      );
    }
  }
  const tsPkg = require.resolve("typescript/package.json", { paths: [fromDir] });
  const tsDir = tsdkDir ? dirname(tsdkDir) : dirname(tsPkg);
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
    // When tsdkDir is given it IS the lib directory, so do not append "lib".
    tsserverJs: tsdkDir ? join(tsdkDir, "tsserver.js") : join(tsDir, "lib", "tsserver.js"),
    tsDir,
    vuePlugin,
    tsLsBin,
  };
}

/**
 * Volar's tuple arrives wrapped by vscode-jsonrpc's positional-params spread,
 * so `[id, command, args]` shows up as `[[id, command, args]]`. Unwrap defensively
 * (a client library that does not wrap would send the flat form).
 */
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
  return { requestId: null, command: "", args: undefined };
}

/**
 * Start typescript-language-server and attach the hybrid bridge to a Volar
 * LspClient.
 *
 * Returns the TS half of the pair: the request forwarder is wired internally,
 * and `openDocument` / `request` let the caller drive the TypeScript member the
 * way an editor does.
 */
export async function attachVolarHybridBridge(volarClient, { workspaceDir, rootDir, tsdkDir }) {
  const paths = resolveTsserverPaths(rootDir, tsdkDir);
  if (!paths.tsLsBin || !existsSync(paths.tsLsBin)) {
    throw new Error(
      "typescript-language-server not installed (needed for Volar hybrid tsserver bridge)",
    );
  }
  if (!paths.vuePlugin) {
    throw new Error(
      "@vue/typescript-plugin not installed — Volar v3 cannot answer TypeScript requests for .vue files without it",
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

  // Init TS language server with the Vue plugin. `languages: ["vue"]` is what
  // makes the server accept `.vue` documents at all (its accepted language ids
  // are the JS/TS set plus whatever plugins declare) and what makes tsserver
  // load @vue/typescript-plugin, which registers the `_vue:*` commands Volar
  // calls. `tsserver.path` pins the TypeScript build to the same one handed to
  // Volar as `typescript.tsdk`, so both halves agree on the compiler.
  const initOptions = {
    hostInfo: "vue-benchmarks",
    tsserver: {
      ...(existsSync(paths.tsserverJs) ? { path: paths.tsserverJs } : {}),
      // Answer from the real program, never from the partial-semantic server.
      //
      // typescript-language-server's default `useSyntaxServer: "auto"` runs a
      // second tsserver in `--serverMode partialSemantic` and dynamically routes
      // `quickinfo` (among others) to it *while the project is still loading*.
      // That server has no resolved module graph, so the first hover after
      // didOpen comes back as `const benchMarker: any` — a confident, fast,
      // WRONG answer; ~25ms later the semantic server has the real
      // `Ref<string, string>`. Since this surface takes exactly one hover
      // snapshot and validates its content, accepting the partial answer would
      // be measuring a placeholder. "never" costs Volar time (it must wait for
      // the full project load) and buys correctness — the trade always in that
      // direction.
      useSyntaxServer: "never",
    },
    plugins: [
      {
        name: "@vue/typescript-plugin",
        location: paths.vuePlugin,
        languages: ["vue"],
      },
    ],
    preferences: {},
  };

  await tsClient.initialize(rootUri, {
    initializationOptions: initOptions,
    timeoutMs: 30_000,
  });

  volarClient.on("notification", (method, params) => {
    if (method !== "tsserver/request") return;
    const { requestId, command, args } = unwrapTuple(params);
    if (requestId == null) return;

    // Volar's pending-request promise never rejects and never times out, so
    // EVERY request must be answered exactly once — a null body is a valid
    // answer, silence is not.
    const reply = (body) => {
      try {
        // Wrapped: vscode-jsonrpc spreads array params positionally and Volar's
        // handler takes the tuple as its single argument. See the file header.
        volarClient.sendNotification("tsserver/response", [[requestId, body ?? null]]);
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

    // Official bridge command: workspace/executeCommand typescript.tsserverRequest
    tsClient
      .sendRequest(
        "workspace/executeCommand",
        {
          command: "typescript.tsserverRequest",
          arguments: [command, args],
        },
        TS_REQUEST_TIMEOUT_MS,
      )
      .then((result) => {
        // ts_ls returns the full tsserver envelope { type, command, success, body }
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
    /** PID of the TypeScript half, for resource sampling of the whole pair. */
    get pid() {
      return tsClient.pid;
    },
    /**
     * Mirror an open document to the TypeScript server. An editor running Volar
     * hybrid syncs the same `.vue` buffers to both servers; without this the
     * TypeScript server has no script info for the file and `_vue:projectInfo`
     * fails.
     */
    openDocument({ uri, languageId, version, text }) {
      tsClient.sendNotification("textDocument/didOpen", {
        textDocument: { uri, languageId, version, text },
      });
    },
    /**
     * Mirror an edit to the TypeScript server.
     *
     * Required for any measurement of the edit loop: Volar answers no
     * TypeScript itself, so if only the Vue half sees a change, every
     * subsequent type answer is computed from the stale buffer and the server
     * looks both fast and correct while being neither.
     */
    changeDocument(uri, text, version) {
      tsClient.sendNotification("textDocument/didChange", {
        textDocument: { uri, version },
        contentChanges: [{ text }],
      });
    },
    /** Ask the TypeScript half for a language feature. */
    request(method, params, timeoutMs) {
      return tsClient.sendRequest(method, params, timeoutMs);
    },
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
