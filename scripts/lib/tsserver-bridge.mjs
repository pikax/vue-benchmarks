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
import { performance } from "node:perf_hooks";
import { LspClient, pathToFileUri } from "./lsp-client.mjs";

const require = createRequire(import.meta.url);

/* -------------------------------------------------------------------------- */
/* Budgets                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Floor for a single forwarded tsserver command.
 *
 * The budget itself is NOT optional and removing it is not the fix. Volar's
 * `sendTsServerRequest` is a bare `new Promise(resolve => …)` with no timeout
 * and no reject path (see the file header), so a forwarded command that never
 * comes back wedges the Vue half forever and takes the whole run with it. This
 * budget is the only thing that guarantees Volar gets the one reply it waits
 * for.
 *
 * What was wrong was the SIZE and the SILENCE:
 *
 *   - it was 15s, i.e. SHORTER than the budget the harness gives the outer
 *     request the forwarded command belongs to (45s in the background suite,
 *     60s in scale). An internal cap tighter than the external one makes the
 *     internal cap the binding constraint, and no other server in this harness
 *     has an internal cap at all — it was a penalty for being two processes.
 *     `forwardedBudgetMs()` now raises this floor to whatever outer budget is
 *     actually in flight, so the harness's own identical-for-everyone budget is
 *     what decides.
 *   - on expiry the bridge replied `null`, which on the wire is exactly what a
 *     TypeScript server that genuinely has no answer sends. The Vue half then
 *     answered the client with an empty result, the content gate failed it, and
 *     the row was published `valid:false` — indistinguishable from the server
 *     answering badly. Every expiry is now recorded in a failure log the suite
 *     can read and attribute (`bridgeFailures()` / `takeBridgeFailures()`).
 */
export const DEFAULT_TS_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Fallback for the TypeScript half's `initialize`.
 *
 * Only a floor — see `resolveTsInitTimeoutMs`. Hard-coding this was defect 2:
 * the number was unreachable from `createSession`'s `initTimeoutMs` and from
 * `SCALE_PROJECT_LOAD_TIMEOUT_MS`, so the documented way to give a slow-starting
 * server more time reached the Vue half and never the TypeScript half — the half
 * most likely to need it on a large project.
 */
export const DEFAULT_TS_INIT_TIMEOUT_MS = 30_000;

/**
 * Budget for a direct request on the TypeScript half when the caller names none.
 * Mirrors `LspClient.sendRequest`'s own default so the two cannot drift.
 */
const DEFAULT_DIRECT_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Grace added to the transport's timeout so THIS budget is the one that fires.
 *
 * Both timers would otherwise be armed for the same duration and which one won
 * would be a coin flip — making "the bridge budget expired" and "the transport
 * gave up" report as each other at random. The transport timer stays armed as
 * the backstop that clears the pending-request entry.
 */
const BUDGET_GRACE_MS = 1_000;

/** First positive, finite number among the candidates; else `fallback`. */
function firstBudget(candidates, fallback) {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === "") continue;
    const n = Number(candidate);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return fallback;
}

/**
 * Budget for the TypeScript half's `initialize`, in precedence order.
 *
 *   1. `initTimeoutMs` passed by the caller — the correct channel.
 *      `createSession()` already computes this (45s by default, and the scale
 *      suite hands it `PROJECT_LOAD_TIMEOUT_MS`); it just does not forward it
 *      yet. When it does, this is the branch that runs.
 *   2. `VOLAR_TS_INIT_TIMEOUT_MS` — targets this half specifically.
 *   3. `SCALE_PROJECT_LOAD_TIMEOUT_MS` — the escape hatch scale.mjs documents
 *      for "a server that genuinely needs longer to load a project". Honouring
 *      it here is the point: it is an ENV var, i.e. already process-global, and
 *      the thing it names — project load — is exactly what this initialize does.
 *      Reading it means the hatch works today without editing scale.mjs or
 *      context.mjs. It can only ever RAISE a ceiling, so a run that did not need
 *      it is unaffected.
 */
export function resolveTsInitTimeoutMs(explicit, env = process.env) {
  return firstBudget(
    [explicit, env.VOLAR_TS_INIT_TIMEOUT_MS, env.SCALE_PROJECT_LOAD_TIMEOUT_MS],
    DEFAULT_TS_INIT_TIMEOUT_MS,
  );
}

/** Floor for forwarded tsserver commands: caller, then env, then the default. */
export function resolveTsRequestTimeoutMs(explicit, env = process.env) {
  return firstBudget(
    [explicit, env.VOLAR_TS_REQUEST_TIMEOUT_MS],
    DEFAULT_TS_REQUEST_TIMEOUT_MS,
  );
}

/**
 * Budget for a forwarded command: the floor, raised to the largest outer budget
 * still in flight.
 *
 * `ask()` fans a request out to both halves at the same instant with the same
 * `timeoutMs`, so while the Vue half is working — and forwarding
 * `tsserver/request` — there is a direct request on the TypeScript half carrying
 * exactly the budget the harness intended for this question. Adopting it is what
 * makes the two-process server answer to the same clock as the single-process
 * ones instead of to a private, tighter one.
 */
export function forwardedBudgetMs(floorMs, inFlightDeadlines, now) {
  let ms = floorMs;
  for (const deadline of inFlightDeadlines) {
    const remaining = deadline - now;
    if (remaining > ms) ms = remaining;
  }
  return ms;
}

/* -------------------------------------------------------------------------- */
/* Failure log — what makes an expiry distinguishable from an empty answer      */
/* -------------------------------------------------------------------------- */

/**
 * Bounded record of forwarded commands that produced no answer.
 *
 * Bounded because a wedged TypeScript server can generate these faster than
 * anything drains them, and an unbounded array inside a benchmark is a memory
 * leak that changes the thing being measured.
 */
export function createBridgeFailureLog(limit = 50) {
  const entries = [];
  return {
    record(entry) {
      entries.push(entry);
      if (entries.length > limit) entries.splice(0, entries.length - limit);
    },
    get size() {
      return entries.length;
    },
    /** Read without clearing. */
    peek() {
      return entries.slice();
    },
    /** Read AND clear, so a caller can attribute failures to one operation. */
    take() {
      return entries.splice(0, entries.length);
    },
  };
}

/**
 * One line naming what the TypeScript half failed to do, for an Op's `reason`.
 *
 * Grouped by (kind, command) with a count: ten expiries of one command is one
 * fact, and ten copies of it would push the actual gate reason out of the 240
 * characters an Op reason is allowed.
 */
export function summarizeBridgeFailures(failures) {
  if (!failures?.length) return "";
  const groups = new Map();
  for (const f of failures) {
    const key = `${f.kind}:${f.command}`;
    const existing = groups.get(key);
    if (existing) existing.count++;
    else groups.set(key, { ...f, count: 1 });
  }
  return [...groups.values()]
    .map((f) =>
      f.kind === "timeout"
        ? `${f.count}x tsserver \`${f.command}\` exceeded the bridge budget of ${Math.round(f.budgetMs)}ms`
        : `${f.count}x tsserver \`${f.command}\` failed (${f.message})`,
    )
    .join("; ");
}

/** Sentinel resolved by the bridge's own deadline, never by a server. */
const BUDGET_EXPIRED = Symbol("volar-bridge-budget-expired");

/**
 * The `tsserver/request` handler, with its transport injected.
 *
 * Split out from `attachVolarHybridBridge` so the behaviour that matters — what
 * happens when the TypeScript server does not answer — is testable without
 * spawning two real language servers.
 *
 * @param {object} o
 * @param {(command: string, args: unknown, timeoutMs: number) => Promise<any>} o.sendToTs
 * @param {(requestId: unknown, body: unknown) => void} o.replyToVolar
 * @param {number | (() => number)} o.budgetMs
 * @param {{record: (entry: object) => void}} [o.failures]
 * @param {boolean} [o.debug]
 * @param {(msg: string) => void} [o.warn] where a budget expiry is announced
 * @param {() => number} [o.now]
 */
export function createTsRequestForwarder({
  sendToTs,
  replyToVolar,
  budgetMs,
  failures,
  debug = false,
  warn = (msg) => console.error(msg),
  now = () => performance.now(),
}) {
  return async function onTsserverRequest(params) {
    const { requestId, command, args } = unwrapTuple(params);
    // No id means no addressable reply. Nothing is waiting on it either, so
    // there is nothing to wedge and nothing to record.
    if (requestId == null) return;

    // Volar's pending-request promise never rejects and never times out, so
    // EVERY request must be answered exactly once — a null body is a valid
    // answer, silence is not. That constraint is also precisely why the failure
    // has to be recorded HERE: on the wire, "the budget expired" and "the
    // TypeScript server has no answer" are the same reply, and only this side
    // knows which one it just sent.
    const reply = (body) => {
      try {
        replyToVolar(requestId, body ?? null);
      } catch {
        // Transport already gone; the run is ending either way.
      }
    };

    if (!command) {
      reply(null);
      return;
    }

    if (debug) warn(`[hybrid] → ts_ls ${command}`);

    const budget = typeof budgetMs === "function" ? budgetMs(command) : budgetMs;
    const started = now();
    let timer = null;
    try {
      const expiry = new Promise((resolve) => {
        timer = setTimeout(() => resolve(BUDGET_EXPIRED), budget);
      });
      // The transport keeps its own, slightly later timer so its pending entry
      // is always cleaned up; `expiry` is the one that decides the verdict.
      const outcome = await Promise.race([
        sendToTs(command, args, budget + BUDGET_GRACE_MS),
        expiry,
      ]);

      if (outcome === BUDGET_EXPIRED) {
        const ms = now() - started;
        failures?.record({
          kind: "timeout",
          command,
          requestId,
          budgetMs: budget,
          ms,
          message: `no reply from the TypeScript server within ${Math.round(budget)}ms`,
        });
        // Always announced, not only under LSP_BENCH_DEBUG: this is the event
        // that used to be published as a confident empty answer.
        warn(
          `[hybrid] BUDGET EXPIRED after ${Math.round(ms)}ms on tsserver \`${command}\` ` +
            `— replying null so Volar cannot hang; the row this feeds is NOT a server answer`,
        );
        reply(null);
        return;
      }

      // ts_ls returns the full tsserver envelope { type, command, success, body }.
      // A body of null here is a GENUINE empty answer and is deliberately not
      // recorded — that distinction is the whole point of this function.
      const body = outcome?.body ?? outcome;
      if (debug) warn(`[hybrid] ← id=${requestId} has=${body != null}`);
      reply(body ?? null);
    } catch (err) {
      const message = String(err?.message ?? err).slice(0, 200);
      failures?.record({
        kind: "error",
        command,
        requestId,
        budgetMs: budget,
        ms: now() - started,
        message,
      });
      if (debug) warn(`[hybrid] err ${message}`);
      reply(null);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
}

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
export async function attachVolarHybridBridge(
  volarClient,
  { workspaceDir, rootDir, tsdkDir, initTimeoutMs, requestTimeoutMs },
) {
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

  // Threaded, not hard-coded — see resolveTsInitTimeoutMs. This is the half most
  // likely to need extra time on a large project, so it must be the half the
  // documented escape hatch can actually reach.
  //
  // The failure path has to kill the process it started. `createSession()` binds
  // its `ctx` only after this call returns, so a throw here leaves the caller
  // with nothing to close: the ts_ls child keeps its stdio pipes open, the
  // event loop never drains and the runner hangs forever instead of reporting
  // "this server could not start". A hang is the one outcome worse than a
  // failed row — it produces no measurement AND no finding.
  const tsInitTimeoutMs = resolveTsInitTimeoutMs(initTimeoutMs);
  try {
    await tsClient.initialize(rootUri, {
      initializationOptions: initOptions,
      timeoutMs: tsInitTimeoutMs,
    });
  } catch (err) {
    try {
      await tsClient.kill();
    } catch {
      // Already gone.
    }
    throw new Error(
      `Volar's TypeScript half did not initialize within ${tsInitTimeoutMs}ms: ${err?.message ?? err}`,
    );
  }

  /** Forwarded commands that produced no answer, for the suite to attribute. */
  const failures = createBridgeFailureLog();

  /**
   * Deadlines of direct requests currently in flight on this half.
   *
   * Read by `forwardedBudgetMs()` so a forwarded command inherits the outer
   * budget the harness chose for the question being asked, instead of a private
   * cap only this server has.
   */
  const inFlight = new Set();

  const requestFloorMs = resolveTsRequestTimeoutMs(requestTimeoutMs);

  const onTsserverRequest = createTsRequestForwarder({
    sendToTs: (command, args, timeoutMs) =>
      // Official bridge command: workspace/executeCommand typescript.tsserverRequest
      tsClient.sendRequest(
        "workspace/executeCommand",
        { command: "typescript.tsserverRequest", arguments: [command, args] },
        timeoutMs,
      ),
    replyToVolar: (requestId, body) => {
      // Wrapped: vscode-jsonrpc spreads array params positionally and Volar's
      // handler takes the tuple as its single argument. See the file header.
      volarClient.sendNotification("tsserver/response", [[requestId, body]]);
    },
    budgetMs: () =>
      forwardedBudgetMs(
        requestFloorMs,
        [...inFlight].map((e) => e.deadline),
        performance.now(),
      ),
    failures,
    debug: Boolean(process.env.LSP_BENCH_DEBUG),
  });

  volarClient.on("notification", (method, params) => {
    if (method !== "tsserver/request") return;
    onTsserverRequest(params);
  });

  return {
    tsClient,
    /**
     * Forwarded tsserver commands that produced no answer since the last drain.
     *
     * A suite reads this so a row that failed its content gate while a budget
     * expired says WHICH it was. Without it the two are the same empty payload.
     */
    bridgeFailures: () => failures.peek(),
    takeBridgeFailures: () => failures.take(),
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
     * Diagnostics for mirrored documents arrive on THIS connection, not
     * Volar's. In hybrid mode the Vue server delegates TypeScript semantics to
     * this half, and typescript-language-server publishes the resulting
     * diagnostics on its own channel — which this bridge used to receive and
     * silently drop. The project-lsp diagnostics operation therefore waited on
     * the Vue socket for a message that structurally never arrives on a real
     * workspace: verified across two projects (hoppscotch, element-plus), both
     * engines (tsserver, tsgo) and two TypeScript majors (5.9.3, 6.0.3) before
     * this hook existed. An editor shows the union of both connections'
     * diagnostics; subscribing here is the same wire.
     */
    onDiagnostics(handler) {
      tsClient.on("notify:textDocument/publishDiagnostics", handler);
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
    /**
     * Ask the TypeScript half for a language feature.
     *
     * The deadline is registered while the request is open so that any
     * `tsserver/request` Volar forwards during the SAME question inherits this
     * budget rather than the bridge's floor — `ask()` starts both legs at the
     * same instant with the same `timeoutMs`, so this is the budget the harness
     * chose for this question, identically for every server.
     */
    request(method, params, timeoutMs) {
      const budget =
        Number.isFinite(timeoutMs) && timeoutMs > 0
          ? timeoutMs
          : DEFAULT_DIRECT_REQUEST_TIMEOUT_MS;
      const entry = { deadline: performance.now() + budget };
      inFlight.add(entry);
      const done = () => inFlight.delete(entry);
      return tsClient.sendRequest(method, params, budget).then(
        (v) => {
          done();
          return v;
        },
        (e) => {
          done();
          throw e;
        },
      );
    },
    async close() {
      await tsClient.shutdown();
    },
  };
}
