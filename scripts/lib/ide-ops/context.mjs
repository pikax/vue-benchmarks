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

/**
 * Canonical form of a document URI, for comparing URIs that name the same file.
 *
 * The same file genuinely arrives spelled three ways in one session:
 * `file:///D:/…` from this client, `file:///d%3A/…` from Volar's tsserver half,
 * and `file:///d:/…` from others. Keying diagnostics on the raw string silently
 * dropped every diagnostic published by one half of Volar, which reads exactly
 * like "this server publishes nothing" — a published lie rather than a missing
 * feature. Never compare document URIs by string equality.
 */
export function normalizeUri(uri) {
  if (typeof uri !== "string") return uri;
  let u = uri;
  try {
    u = decodeURIComponent(u);
  } catch {
    // Malformed escapes: fall through with the raw string.
  }
  // Windows drive letters are case-insensitive; nothing else in a URI is.
  return u.replace(/^file:\/\/\/([A-Za-z]):/, (_m, d) => `file:///${d.toLowerCase()}:`);
}

/**
 * Did the server come up on a DEGRADED backend?
 *
 * A server can initialize, answer every request and look healthy while its
 * type-checking backend never started. Vize drives tsgo out-of-process as
 * "Corsa"; when that session fails to spawn it logs to stderr and silently
 * falls back to its own semantic analysis. Nothing in the LSP traffic shows it.
 *
 * This is REPORTED, never used to fail a row on its own — the per-operation
 * gates already judge the answers. It exists so the reason a row is fast is
 * never invisible. Omitting it is how a server ends up ranked first on
 * questions its type backend cannot answer.
 *
 * @param {string} stderr bounded stderr tail from the server process
 * @returns {string | null} human-readable reason, or null if nothing detected
 */
export function detectBackendFallback(stderr = "") {
  if (!stderr) return null;
  if (/corsa bridge (spawn failed|not available)/i.test(stderr)) {
    const panic = /panic:\s*([^\n]+)/i.exec(stderr);
    return `tsgo/Corsa backend did not start — answers come from the server's own semantic analysis, not a type checker${panic ? ` (${panic[1].trim().slice(0, 120)})` : ""}`;
  }
  if (/typecheck-unavailable/i.test(stderr)) {
    return "server reports type checking unavailable in this workspace";
  }
  return null;
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
  // Which entry point is in the label on purpose. Vize resolves to the
  // standalone native server the VS Code extension ships when one is present
  // and to the npm package's Node entry otherwise (CI has no VS Code), and the
  // two differ by ~35ms of Node bootstrap per spawn — which `Time-to-usable`
  // measures. Unlabelled, a local run and a CI run publish different
  // measurements under the same row name.
  if (vize) {
    out.push({
      id: "vize",
      label: `Vize LSP${vize.labelExtra ? ` (${vize.labelExtra})` : ""}`,
      ...vize,
      hybrid: false,
    });
  }
  const verter = resolveVerterLsp();
  if (verter) {
    out.push({
      id: "verter",
      label: `Verter LSP${verter.labelExtra ? ` (${verter.labelExtra})` : ""}`,
      ...verter,
      hybrid: false,
    });
  }
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

  // Diagnostics are keyed by NORMALIZED uri — see normalizeUri(). Volar's two
  // halves publish the same file under different spellings.
  const onDiagnostics = (params) => {
    const key = normalizeUri(params.uri);
    const list = params.diagnostics ?? [];
    diagnostics.set(key, list);
    for (const w of [...diagWaiters]) {
      if (w.test(key, list)) {
        diagWaiters.delete(w);
        w.resolve(list);
      }
    }
  };

  client.on("notification", (method, params) => {
    if (method !== "textDocument/publishDiagnostics") return;
    onDiagnostics(params);
  });

  const initializeStart = performance.now();
  await client.initialize(rootUri, {
    initializationOptions: {
      typescript: { tsdk: server.tsdk },
      vue: {},
      volar: {},
      // FLAT, not nested. Vize reads these as top-level keys; a
      // `languageServer: {...}` wrapper is silently ignored, so every flag the
      // harness thought it was setting was a no-op. Falsified directly: sending
      // `{languageServer:{typecheck:false}}` still parsed `typecheck: true`,
      // while `{typecheck:false}` parsed false and skipped the Corsa attempt.
      //
      // These are the keys Vize's own VS Code extension sends. Note it does NOT
      // send `corsa` — Corsa is driven by `typecheck`, so requesting it
      // explicitly would be asking for something the shipped product never asks
      // for.
      lint: true,
      typecheck: true,
      editor: true,
      ecosystem: true,
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

  /**
   * Request, fanned out to every half, charged the slower.
   *
   * `allSettled`, deliberately NOT `all`. Volar v3's Vue half rejects
   * `-32601 Unhandled method` for everything it does not implement — verified
   * for `typeDefinition` and `signatureHelp`, where the TypeScript half answers
   * correctly and a real editor simply routes to it. Under `Promise.all` one
   * half saying "not my job" became a failure of the pair, and a CORRECT server
   * was reported as unable to perform the operation. That is the worst failure
   * mode this harness has, so a rejected leg is treated as "no answer from this
   * provider", exactly as an editor treats it.
   *
   * Both legs are still awaited, so the pair is still charged the slower one,
   * and if EVERY leg rejects the error is preserved and rethrown — a genuine
   * failure must still fail.
   */
  const ask = async (method, params, timeoutMs = 30_000, merge) => {
    if (!hybrid) return client.sendRequest(method, params, timeoutMs);
    const settled = await Promise.allSettled([
      client.sendRequest(method, params, timeoutMs),
      hybrid.request(method, params, timeoutMs),
    ]);
    if (settled.every((s) => s.status === "rejected")) throw settled[0].reason;
    const [a, b] = settled.map((s) => (s.status === "fulfilled" ? s.value : null));
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

  /** Latest push diagnostics seen for a uri (uri spelling-insensitive). */
  const diagnosticsFor = (uri) => diagnostics.get(normalizeUri(uri)) ?? [];

  /**
   * Wait until a uri's diagnostics satisfy `test`, or time out.
   * Resolves `null` on timeout rather than throwing — "no diagnostics ever
   * arrived" is a result to report, not an error to swallow.
   */
  const waitForDiagnostics = (uri, test, timeoutMs = 15_000) =>
    new Promise((resolve) => {
      const key = normalizeUri(uri);
      const existing = diagnostics.get(key);
      if (existing && test(key, existing)) return resolve(existing);
      const waiter = {
        // Compare normalized, never raw — see normalizeUri().
        test: (u, d) => u === key && test(u, d),
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
