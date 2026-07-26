/**
 * Server session context for IDE operation suites.
 *
 * Every suite under `scripts/lib/ide-ops/` measures a family of editor
 * operations against a language server. They must not care which server they
 * are talking to, and in particular must not care that Volar is two processes:
 * `ask` fans out to both halves and merges, exactly as an editor merges the
 * answers of several providers, and charges the caller the slower leg.
 *
 * The contract every suite implements:
 *
 *   export const SUITE = {
 *     id: "edit-loop",
 *     label: "Edit loop",
 *     buildWorkspace(dir) -> ws,     // write files; return { file, fileRel, source, ... }
 *     async measure(ctx) -> Op[],    // ctx is what createSession() returns, plus { ws }
 *   }
 *
 *   Op = {
 *     id, label,
 *     ms,                 // wall time for the operation
 *     valid,              // true | false | null(not applicable) — the CONTENT gate
 *     reason,             // why invalid, shown on the row
 *     sample,             // <=200 chars of the payload, as evidence
 *     artifact,           // optional numeric census (item count, bytes, edits)
 *   }
 *
 * `valid` is not optional in spirit. This repo has three separate cases where a
 * server answered fast and wrong — a hover naming a type it had not computed, a
 * partial-semantic tsserver returning `any` in 25ms before the real answer, and
 * a server whose type backend never started. A timing without a content gate is
 * not a measurement, it is a number.
 */

import { performance } from "node:perf_hooks";
import { lstatSync, rmSync, rmdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LspClient, pathToFileUri } from "../lsp-client.mjs";
import { attachVolarHybridBridge } from "../tsserver-bridge.mjs";
import {
  resolveVizeLsp,
  resolveVerterLsp,
  resolveVolarServer,
  resolveTsdk,
} from "../surfaces/lsp.mjs";
import { resolveTnbTsdk } from "../tnb.mjs";
import { withTsgoEnv } from "../tsgo.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * Remove a generated workspace, junction-first.
 *
 * Suite workspaces link `node_modules` to the repo root (a junction on
 * Windows). `rmSync(recursive)` does not follow it — it tries to remove the
 * link itself and fails EPERM, leaving the directory behind. Node's refusal is
 * the safe behaviour: following it would delete the repo's real node_modules.
 * So drop the link explicitly first, then remove the rest.
 */
export function removeWorkspace(dir) {
  const nm = join(dir, "node_modules");
  try {
    const st = lstatSync(nm);
    // A junction/symlink is removed with rmdir (Windows) or unlink (POSIX);
    // either way, never recursively.
    if (st.isSymbolicLink()) {
      try {
        unlinkSync(nm);
      } catch {
        rmdirSync(nm);
      }
    } else if (st.isDirectory()) {
      rmdirSync(nm);
    }
  } catch {
    // Not present — nothing to unlink.
  }
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // A server process may still hold a handle; the caller uses unique dirs so
    // a leftover is inert rather than a correctness problem.
  }
}

/** Servers this harness knows how to start. */
export function resolveServers() {
  const out = [];
  const volar = resolveVolarServer();
  if (volar) {
    out.push({
      id: "volar",
      label: "Volar (@vue/language-server)",
      ...volar,
      hybrid: true,
      tsdk: resolveTsdk(),
    });
    const tnb = resolveTnbTsdk(rootDir);
    if (tnb.dir) {
      out.push({
        id: "volar-tnb",
        label: "Volar (TNB / tsgo tsdk)",
        ...volar,
        hybrid: true,
        tsdk: tnb.dir,
      });
    }
  }
  const vize = resolveVizeLsp();
  if (vize) out.push({ id: "vize", label: "Vize LSP", ...vize, hybrid: false });
  const verter = resolveVerterLsp();
  if (verter) out.push({ id: "verter", label: "Verter LSP", ...verter, hybrid: false });
  return out;
}

/**
 * Flatten the shapes LSP allows for Hover.contents / MarkupContent into text.
 * Exported because nearly every suite needs it.
 */
export function contentText(result) {
  const c = result?.contents ?? result;
  if (c == null) return "";
  const one = (x) => (typeof x === "string" ? x : typeof x?.value === "string" ? x.value : "");
  return (Array.isArray(c) ? c.map(one).join("\n") : one(c)).trim();
}

/** Merge two Hover payloads the way an editor merges hover providers. */
export function mergeHover(...hovers) {
  const contents = [];
  let range;
  for (const h of hovers) {
    if (!h?.contents) continue;
    const c = h.contents;
    if (Array.isArray(c)) contents.push(...c);
    else contents.push(c);
    range ??= h.range;
  }
  if (!contents.length) return null;
  return { contents, ...(range ? { range } : {}) };
}

/** Merge two CompletionList/CompletionItem[] payloads into one item array. */
export function mergeCompletions(...results) {
  const items = [];
  for (const r of results) {
    if (!r) continue;
    if (Array.isArray(r)) items.push(...r);
    else if (Array.isArray(r.items)) items.push(...r.items);
  }
  return items.length ? { items, isIncomplete: false } : null;
}

/** Count of "useful stuff" in a list-shaped result, for picking a winner. */
function resultSize(result) {
  if (result == null) return 0;
  if (Array.isArray(result)) return result.length;
  if (Array.isArray(result?.items)) return result.items.length;
  return 1;
}

/**
 * Start one server against one workspace and return the operation context.
 *
 * @param {object} opts
 * @param {object} opts.server         entry from resolveServers()
 * @param {string} opts.workspaceDir
 * @param {number} [opts.initTimeoutMs]
 */
export async function createSession({ server, workspaceDir, initTimeoutMs = 45_000 }) {
  const rootUri = pathToFileUri(workspaceDir);
  const client = new LspClient(server.id, server.command, server.args, {
    cwd: workspaceDir,
    shell: server.shell ?? false,
    env: withTsgoEnv({}, rootDir),
    configuration: {
      typescript: { tsdk: server.tsdk },
      vue: {},
      volar: {},
      workspaceFolders: [{ uri: rootUri, name: "bench" }],
    },
  });

  /** uri -> latest diagnostics array (push model). */
  const diagnostics = new Map();
  /** Resolvers waiting on a diagnostics predicate. */
  const diagWaiters = new Set();

  client.on("notification", (method, params) => {
    if (method !== "textDocument/publishDiagnostics") return;
    diagnostics.set(params.uri, params.diagnostics ?? []);
    for (const w of [...diagWaiters]) {
      if (w.test(params.uri, params.diagnostics ?? [])) {
        diagWaiters.delete(w);
        w.resolve(params.diagnostics ?? []);
      }
    }
  });

  const initializeStart = performance.now();
  await client.initialize(rootUri, {
    initializationOptions: {
      typescript: { tsdk: server.tsdk },
      vue: {},
      volar: {},
      // Vize's tsgo/Corsa IDE backend is opt-in; without it the server answers
      // from its own semantic analysis. Enabled here so every suite measures
      // the product the extension ships, not a default-off subset.
      languageServer: { corsa: true, tsgo: true, typecheck: true, editor: true },
      workspaceFolders: [{ uri: rootUri, name: "bench" }],
    },
    timeoutMs: initTimeoutMs,
  });
  const initializeMs = performance.now() - initializeStart;

  let hybrid = null;
  if (server.hybrid) {
    hybrid = await attachVolarHybridBridge(client, {
      workspaceDir,
      rootDir,
      tsdkDir: server.tsdk,
    });
  }

  /** Request, fanned out to every half, charged the slower. */
  const ask = async (method, params, timeoutMs = 30_000, merge) => {
    if (!hybrid) return client.sendRequest(method, params, timeoutMs);
    const own = client.sendRequest(method, params, timeoutMs);
    const ts = hybrid.request(method, params, timeoutMs);
    // Promise.all settles on first rejection; without these the other leg can
    // reject later unheard and take the process down.
    own.catch(() => {});
    ts.catch(() => {});
    const [a, b] = await Promise.all([own, ts]);
    if (merge) return merge(a, b);
    return resultSize(b) > resultSize(a) ? b : resultSize(a) ? a : b;
  };

  /** Notification to every half. */
  const notify = (method, params) => {
    client.sendNotification(method, params);
    if (hybrid && method === "textDocument/didOpen") hybrid.openDocument(params.textDocument);
    else if (hybrid) hybrid.notify?.(method, params);
  };

  /** Open a document in every half. */
  const openDoc = (uri, text, { languageId = "vue", version = 1 } = {}) => {
    const textDocument = { uri, languageId, version, text };
    client.sendNotification("textDocument/didOpen", { textDocument });
    if (hybrid) hybrid.openDocument(textDocument);
  };

  /**
   * Full-document didChange, to every half.
   *
   * Uses the Full form (`contentChanges: [{ text }]`) regardless of the sync
   * kind the server advertised: it is unambiguous, universally accepted, and
   * keeps every server on identical input. Incremental sync would measure the
   * client's diffing, not the server.
   */
  const changeDoc = (uri, text, version) => {
    const params = {
      textDocument: { uri, version },
      contentChanges: [{ text }],
    };
    client.sendNotification("textDocument/didChange", params);
    if (hybrid) hybrid.changeDocument?.(uri, text, version);
  };

  /** Latest push diagnostics seen for a uri. */
  const diagnosticsFor = (uri) => diagnostics.get(uri) ?? [];

  /**
   * Wait until a uri's diagnostics satisfy `test`, or time out.
   * Resolves `null` on timeout rather than throwing — "no diagnostics ever
   * arrived" is a result to report, not an error to swallow.
   */
  const waitForDiagnostics = (uri, test, timeoutMs = 15_000) =>
    new Promise((resolve) => {
      const existing = diagnostics.get(uri);
      if (existing && test(uri, existing)) return resolve(existing);
      const waiter = {
        test: (u, d) => u === uri && test(u, d),
        resolve,
      };
      diagWaiters.add(waiter);
      setTimeout(() => {
        diagWaiters.delete(waiter);
        resolve(null);
      }, timeoutMs);
    });

  const close = async () => {
    try {
      await client.shutdown();
    } catch {}
    client.kill();
    try {
      await hybrid?.close?.();
    } catch {}
  };

  return {
    server,
    workspaceDir,
    rootUri,
    client,
    hybrid,
    initializeMs,
    ask,
    notify,
    openDoc,
    changeDoc,
    diagnosticsFor,
    waitForDiagnostics,
    stderrTail: () => client.stderrTail,
    close,
  };
}

/** Time one operation and shape it into the Op record suites return. */
export async function timed(id, label, fn) {
  const t0 = performance.now();
  try {
    const r = await fn();
    const ms = performance.now() - t0;
    return {
      id,
      label,
      ms,
      valid: r?.valid ?? null,
      reason: r?.reason ?? "",
      sample: String(r?.sample ?? "").slice(0, 200),
      artifact: r?.artifact,
    };
  } catch (e) {
    return {
      id,
      label,
      ms: performance.now() - t0,
      valid: false,
      reason: `request failed: ${e.message}`.slice(0, 240),
      sample: "",
    };
  }
}
