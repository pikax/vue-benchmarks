/**
 * LSP surface — apples-to-apples editor-server latency.
 *
 * Tools (when available):
 *   - Volar:  @vue/language-server --stdio  +  typescript-language-server with
 *             @vue/typescript-plugin. Vue language-tools v3 has no in-process
 *             TypeScript language service: the Vue server answers Vue-specific
 *             features and delegates every TypeScript answer to a separate TS
 *             server over `tsserver/request`↔`tsserver/response`. Both processes
 *             are started, synced and timed here, because both are what a user
 *             running the Vue (Official) extension actually waits for.
 *   - Vize:   vize lsp --stdio                (single process)
 *   - Verter: verter-lsp / VERTER_LSP_BIN     (single process; optional)
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
import { measureVariants, resolveBin, median } from "../timing.mjs";
import { pidCpuMs, pidPeakRssBytes, pidTreeRssBytes } from "../memory.mjs";
import { withTsgoEnv } from "../tsgo.mjs";
import { resolveTnbTsdk } from "../tnb.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const WARM_HOVER_N = 5;
/** Same hover retry budget for every server — see the note at the retry loop. */
const HOVER_ATTEMPTS = 6;
// 60s per attempt. Volar in hybrid mode has to spin up tsserver through the
// bridge and load the project before it can answer the first hover, and 20s
// was not enough on a cold CI box — it timed out 6/6 and dropped out of the
// table entirely, which reads as "no result" rather than "slow". Generous and
// identical for every server is the honest setting: whoever needs the time
// pays for it in the measurement.
const HOVER_ATTEMPT_TIMEOUT_MS = 60_000;

/**
 * The probe hovers `const benchMarker = ref('lsp-probe-token')` in a .vue file.
 * A server doing real work answers with the TypeScript type — some form of
 * `Ref<string>`. A server that pattern-matches can return a confident-looking
 * payload very fast and be wrong: one returns a 270-byte answer that calls a
 * function a `const`, resolves typed cross-module imports to
 * `MaybeRef<unknown>`, and answers for symbols that do not exist.
 *
 * Hover LATENCY without hover CORRECTNESS is not a comparable measurement, so
 * the content is validated and a server that cannot produce a real type is
 * measured but unranked.
 */
const HOVER_EXPECT_SYMBOL = "benchMarker";
const HOVER_EXPECT_TYPE = /\bRef\s*<|\bstring\b/;

/**
 * The TEMPLATE half of the hover gate — the Vue-specific one.
 *
 * The script-position probe above can be satisfied by proxying to a TypeScript
 * server, which is not the work a *Vue* language server exists to do. Inside
 * `{{ }}` Vue auto-unwraps refs, so `benchMarker` is `string` here while it is
 * `Ref<string>` three lines down in `<script setup>`. Resolving that requires
 * actually modelling the template.
 *
 * Measured against all three servers on an identical workspace and position.
 * Two return the unwrapped `string` — `(property) benchMarker: string` and
 * `let benchMarker: string`. The third returns `benchMarker: Ref<string>`,
 * the `<script setup>` type, alongside prose stating that refs are
 * "auto-unwrapped in template" — describing the unwrapping it did not do. It
 * answers in a fraction of the time of either, which is precisely why latency
 * without content is not a comparable number.
 *
 * `Ref<` is therefore REJECTED rather than accepted: it is the script type
 * leaking into template context, i.e. the template was not modelled.
 *
 * Matched against the ANNOTATION (`benchMarker: string`), not a bare `string`
 * anywhere in the payload. Two reasons, both found by measurement:
 *
 *   - A bare /\bstring\b/ false-FAILED a server whose payload is
 *     `let benchMarker: stringStable hover target for…` — it had resolved the
 *     template type correctly and merely ran its doc comment into the type
 *     signature with no separator. There is no word boundary in `stringStable`,
 *     so the gate called a correct answer typeless.
 *   - A bare match would also PASS on prose. One server returns the script type
 *     `Ref<string>` plus the sentence "auto-unwrapped in template" — describing
 *     the unwrapping it did not perform. Loose matching would have credited it
 *     for the word `string` in that sentence.
 */
const HOVER_TEMPLATE_EXPECT_TYPE = new RegExp(`\\b${HOVER_EXPECT_SYMBOL}\\s*:\\s*string`);
const HOVER_TEMPLATE_REJECT_TYPE = new RegExp(`\\b${HOVER_EXPECT_SYMBOL}\\s*:\\s*Ref\\s*<`);

/**
 * Merge two Hover payloads into one, the way an editor merges the answers of
 * several hover providers for the same position. Needed for Volar, which is a
 * two-process product: the Vue server answers template/style/SFC hovers and the
 * TypeScript server answers `<script>` hovers. Neither half is the whole answer.
 */
function mergeHover(...hovers) {
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

/** Count of "useful stuff" in a list-shaped LSP result, for picking a winner. */
function resultSize(result) {
  if (result == null) return 0;
  if (Array.isArray(result)) return result.length;
  if (Array.isArray(result?.items)) return result.items.length;
  return 1;
}

/** Flatten the several shapes LSP allows for Hover.contents into plain text. */
function hoverText(result) {
  const c = result?.contents;
  if (c == null) return "";
  const one = (x) =>
    typeof x === "string" ? x : typeof x?.value === "string" ? x.value : "";
  return (Array.isArray(c) ? c.map(one).join("\n") : one(c)).trim();
}

/**
 * Does this hover actually carry TypeScript type information for the probe?
 * Requires the symbol name AND something type-shaped — a payload that merely
 * echoes the identifier is not a typecheck result.
 */
export function classifyHover(text) {
  const bytes = Buffer.byteLength(text, "utf8");
  if (!text) return { ok: false, bytes, reason: "empty hover payload" };
  const hasSymbol = text.includes(HOVER_EXPECT_SYMBOL);
  const hasType = HOVER_EXPECT_TYPE.test(text);
  if (!hasSymbol) return { ok: false, bytes, reason: `hover does not mention ${HOVER_EXPECT_SYMBOL}` };
  if (!hasType) {
    return {
      ok: false,
      bytes,
      reason: `hover names ${HOVER_EXPECT_SYMBOL} but carries no TypeScript type (expected Ref<string>)`,
    };
  }
  return { ok: true, bytes, reason: "" };
}

/**
 * Does this hover carry the TEMPLATE type for the probe symbol?
 * See HOVER_TEMPLATE_EXPECT_TYPE for why `Ref<...>` is a failure, not a pass.
 */
export function classifyTemplateHover(text) {
  const bytes = Buffer.byteLength(text, "utf8");
  if (!text) {
    return { ok: false, bytes, reason: "empty hover payload at the template position" };
  }
  if (!text.includes(HOVER_EXPECT_SYMBOL)) {
    return {
      ok: false,
      bytes,
      reason: `template hover does not mention ${HOVER_EXPECT_SYMBOL}`,
    };
  }
  if (HOVER_TEMPLATE_REJECT_TYPE.test(text)) {
    return {
      ok: false,
      bytes,
      reason: `template hover returned Ref<...> — that is the <script setup> type leaking into template context; refs auto-unwrap inside {{ }}, so the correct answer is \`string\``,
    };
  }
  if (!HOVER_TEMPLATE_EXPECT_TYPE.test(text)) {
    return {
      ok: false,
      bytes,
      reason: `template hover names ${HOVER_EXPECT_SYMBOL} but carries no type — the server resolves the binding without typechecking the template (expected \`string\`)`,
    };
  }
  return { ok: true, bytes, reason: "" };
}

/**
 * Did the server come up on a DEGRADED backend?
 *
 * A server can initialize, answer every request and look healthy while its
 * type-checking backend never started. Vize drives tsgo out-of-process as
 * "Corsa"; when that session fails to spawn it logs to stderr and silently
 * falls back to its own semantic analysis. Nothing in the LSP traffic shows it,
 * so a row would otherwise report a very fast, apparently-fine result whose
 * speed is explained by work that did not happen.
 *
 * This is reported, never used to fail a row on its own: the hover gate already
 * judges the answers. It exists so the reason a row is fast is visible.
 *
 * @param {string} stderr bounded stderr tail from the server process
 * @returns {string | null} human-readable reason, or null if nothing detected
 */
function detectBackendFallback(stderr = "") {
  if (!stderr) return null;
  if (/corsa bridge (spawn failed|not available)/i.test(stderr)) {
    const panic = /panic:\s*([^\n]+)/i.exec(stderr);
    return `tsgo/Corsa backend did not start — server answered from its own semantic analysis${panic ? ` (${panic[1].trim().slice(0, 120)})` : ""}`;
  }
  return null;
}

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

export function resolveVolarServer() {
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

export function resolveVizeLsp() {
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

export function resolveVerterLsp() {
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

export function resolveTsdk() {
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
export async function runLspSession({
  name,
  command,
  args,
  shell,
  rootDir: workspaceDir,
  filePath,
  source,
  probe,
  /** Template-position probe for the Vue-specific half of the hover gate. */
  templateProbe,
  initializationOptions,
  readyNotifications = [],
  readyTimeoutMs = 15_000,
  /** When true, attach tsserver hybrid bridge (required for modern Volar). */
  volarHybrid = false,
  tsdkPath,
  env = {},
  /** Memory is measured in its own run — see the note at the sampler. */
  sampleResources = false,
  resourcePollMs = 25,
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

  // Resource sampling for the SERVER process — OFF during timed runs.
  //
  // Memory is always measured in its own run, never alongside speed. Sampling
  // a process costs real time (on Windows each RSS read spawns PowerShell at
  // ~50-100ms), and this surface reports hover latency, so a sampler running
  // beside it would be measuring its own overhead. The memory probe calls the
  // same session with sampleResources:true and polls hard, because there
  // nothing is being timed.
  const rssSamples = [];
  // Held by reference in the returned object. `return expr` builds the object
  // before `finally` runs, so a plain local would still be null by then —
  // mutating this shared object in `finally` is what makes the numbers arrive.
  const resource = { serverRssMaxMb: null, serverRssAvgMb: null, serverCpuMs: null };
  const sampleRss = () => {
    const rss = client.pid ? pidTreeRssBytes(client.pid) : null;
    if (Number.isFinite(rss) && rss > 0) rssSamples.push(rss);
  };
  const rssTimer = sampleResources ? setInterval(sampleRss, resourcePollMs) : null;
  if (rssTimer && typeof rssTimer.unref === "function") rssTimer.unref();

  try {
    const tInit0 = performance.now();
    // Hybrid bridge must listen before Volar initialize/open so it does not miss tsserver/request
    if (volarHybrid) {
      hybrid = await attachVolarHybridBridge(client, {
        workspaceDir,
        rootDir,
        // The ONLY thing that actually selects Volar's TypeScript engine.
        tsdkDir: tsdkPath,
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

    /**
     * Send a language-feature request to the server under test.
     *
     * For Volar the "server under test" is a PAIR. Vue language-tools v3 has no
     * in-process TypeScript language service at all — `createVueLanguageServicePlugins`
     * ships only the syntactic/docComment TS plugins, and the single semantic
     * `provideHover` in the whole set (vue-template) bails out unless the
     * position is inside `<template>`. A hover on `const benchMarker` in
     * `<script setup>` therefore returns null from `@vue/language-server` by
     * design; the TypeScript quickinfo comes from the TypeScript server that has
     * `@vue/typescript-plugin` loaded. That is exactly how the Vue (Official)
     * extension behaves in VS Code, so the honest thing to measure is the pair.
     *
     * Both halves are asked in parallel and the caller waits for both, so Volar
     * is charged the slower of the two — the hybrid architecture pays for its
     * own extra hop rather than being credited the faster leg.
     */
    const askServer = async (method, params, timeoutMs, merge) => {
      if (!hybrid) return client.sendRequest(method, params, timeoutMs);
      const ownPromise = client.sendRequest(method, params, timeoutMs);
      const tsPromise = hybrid.request(method, params, timeoutMs);
      // Promise.all settles on the FIRST rejection, so the other leg can reject
      // later with nobody listening — an unhandled rejection that would take the
      // worker down. Attaching a no-op handler marks each leg as handled without
      // hiding the failure from Promise.all below.
      ownPromise.catch(() => {});
      tsPromise.catch(() => {});
      const [own, ts] = await Promise.all([ownPromise, tsPromise]);
      if (merge) return merge(own, ts);
      return resultSize(ts) > resultSize(own) ? ts : resultSize(own) ? own : ts;
    };

    // didOpen → first hover
    // Some servers finish project load asynchronously; retry hover briefly
    // instead of a single long hang (still counted as one open→hover wall time).
    const tOpen0 = performance.now();
    const openParams = {
      textDocument: {
        uri: fileUri,
        languageId: "vue",
        version: 1,
        text: source,
      },
    };
    client.sendNotification("textDocument/didOpen", openParams);
    // Volar's TypeScript half needs the same buffer: `_vue:projectInfo` — the
    // first thing Volar asks on any request — fails outright unless the .vue
    // file is open in the TypeScript server. Editors sync it to both; the cost
    // of the second open is inside Volar's timed window, as it should be.
    if (hybrid) hybrid.openDocument(openParams.textDocument);
    // Brief yield for project service spin-up (same for every tool)
    await new Promise((r) => setTimeout(r, 50));
    let hoverOk = false;
    let lastErr = null;
    // Retry budget is IDENTICAL for every server, and deliberately so.
    //
    // It used to be 6 attempts for Volar and 2 for everyone else. Because the
    // backoff sleeps below sit inside the timed open→hover region — the primary
    // ranked metric — that handed Volar up to ~3s of billable sleep that the
    // other servers could not incur, while also masking slow project spin-up.
    // Same budget for all: whoever needs the retries pays for them.
    const attempts = HOVER_ATTEMPTS;
    const perAttemptMs = HOVER_ATTEMPT_TIMEOUT_MS;
    let firstHover = null;
    for (let attempt = 0; attempt < attempts && !hoverOk; attempt++) {
      try {
        firstHover = await askServer(
          "textDocument/hover",
          { textDocument: { uri: fileUri }, position },
          perAttemptMs,
          mergeHover,
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

    // Validate the CONTENT, not just that a response arrived. Answering fast
    // with the wrong type is not the same job as answering with the right one.
    const hoverPayload = hoverText(firstHover);
    const hoverCheck = classifyHover(hoverPayload);

    // hover cold (already open)
    const tCold0 = performance.now();
    await askServer(
      "textDocument/hover",
      { textDocument: { uri: fileUri }, position },
      30_000,
      mergeHover,
    );
    const hoverColdMs = performance.now() - tCold0;

    // hover warm
    const warm = [];
    for (let i = 0; i < WARM_HOVER_N; i++) {
      const t0 = performance.now();
      await askServer(
        "textDocument/hover",
        { textDocument: { uri: fileUri }, position },
        30_000,
        mergeHover,
      );
      warm.push(performance.now() - t0);
    }
    const hoverWarmMedianMs = median(warm);

    // completion (best-effort; failures recorded as null)
    let completionMs = null;
    try {
      const tC0 = performance.now();
      await askServer(
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
      await askServer(
        "textDocument/definition",
        { textDocument: { uri: fileUri }, position },
        15_000,
      );
      definitionMs = performance.now() - tD0;
    } catch {
      definitionMs = null;
    }

    // TEMPLATE hover gate — deliberately OUTSIDE every timed window.
    //
    // This is a correctness gate, not a measurement: adding it to the primary
    // metric would change what the ranking column means and make runs before
    // and after this commit incomparable. Same shape as the typecheck work
    // gate, which also runs beside the timed pass rather than inside it.
    let templateHoverCheck = { ok: null, bytes: 0, reason: "not probed" };
    let templateHoverPayload = "";
    if (templateProbe) {
      try {
        const tmplHover = await askServer(
          "textDocument/hover",
          {
            textDocument: { uri: fileUri },
            position: { line: templateProbe.line, character: templateProbe.character },
          },
          30_000,
          mergeHover,
        );
        templateHoverPayload = hoverText(tmplHover);
        templateHoverCheck = classifyTemplateHover(templateHoverPayload);
      } catch (e) {
        templateHoverCheck = {
          ok: false,
          bytes: 0,
          reason: `template hover request failed: ${e.message}`,
        };
      }
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
      // Artifact for this surface: bytes of hover content actually returned.
      artifact: hoverCheck.bytes,
      hoverValid: hoverCheck.ok,
      hoverReason: hoverCheck.reason,
      hoverSample: hoverPayload.slice(0, 200),
      templateHoverValid: templateHoverCheck.ok,
      templateHoverReason: templateHoverCheck.reason,
      templateHoverSample: templateHoverPayload.slice(0, 200),
      backendFallback: detectBackendFallback(client.stderrTail),
      meta: {
        initializeMs,
        workspaceReadyMs,
        didOpenToHoverMs,
        hoverColdMs,
        hoverWarmMedianMs,
        completionMs,
        definitionMs,
        artifact: hoverCheck.bytes,
        hoverValid: hoverCheck.ok,
        hoverReason: hoverCheck.reason,
        hoverSample: hoverPayload.slice(0, 200),
        templateHoverValid: templateHoverCheck.ok,
        templateHoverReason: templateHoverCheck.reason,
        templateHoverSample: templateHoverPayload.slice(0, 200),
        backendFallback: detectBackendFallback(client.stderrTail),
        // Populated in `finally` — see the note where `resource` is declared.
        resource,
      },
      resource,
    };
  } finally {
    // Read CPU BEFORE shutdown — the counter disappears with the process.
    if (rssTimer) clearInterval(rssTimer);
    if (sampleResources) {
      sampleRss();
      // Exact high-water mark where the OS exposes it, so the peak does not
      // depend on what the poll interval happened to catch.
      const exact = client.pid ? pidPeakRssBytes(client.pid) : null;
      if (Number.isFinite(exact) && exact > 0) rssSamples.push(exact);
      try {
        resource.serverCpuMs = client.pid ? pidCpuMs(client.pid) : null;
      } catch {
        resource.serverCpuMs = null;
      }
    }
    if (rssSamples.length) {
      const toMb = (b) => Number((b / (1024 * 1024)).toFixed(2));
      resource.serverRssMaxMb = toMb(Math.max(...rssSamples));
      resource.serverRssAvgMb = toMb(
        rssSamples.reduce((a, b) => a + b, 0) / rssSamples.length,
      );
    }
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
      artifactLabel: "Hover bytes",
      notes:
        "Official Vue language server v3, hybrid (two-process) mode — the only mode v3 has. Measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver/request↔tsserver/response bridge (the VS Code/Neovim client contract). The .vue buffer is synced to both and both are asked for each feature, in parallel, with the slower one charged — a script-block hover is answered by the TypeScript half, since v3 ships no semantic TS provider in the Vue server. Startup and project load of BOTH processes are inside the timings. If hybrid wiring fails, row is error — not ranked as slow. Primary metric: didOpen→hover.",
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
          templateProbe: workspace.templateProbe,
          initializationOptions: {
            typescript: { tsdk },
          },
          readyNotifications: [],
          volarHybrid: true,
          tsdkPath: tsdk,
        }),
    });
    // Same Volar, same Vue half, TypeScript half on tsgo via TNB. The LSP
    // analogue of the `vue-tsc (TNB)` typecheck row: since v3 answers every
    // script-position TypeScript question from a separate tsserver, `tsdk` is
    // the one variable that selects the engine. Ranked next to stock Volar so
    // the pair shows how much of Volar's latency is TypeScript's, not Vue's.
    const tnbTsdk = resolveTnbTsdk(rootDir);
    if (tnbTsdk.dir) {
      variants.push({
        id: "volar-language-server-tnb",
        label: "Volar (TNB / tsgo tsdk)",
        package: "@vue/language-server",
        threading: "lsp",
        artifactLabel: "Hover bytes",
        notes: `Identical to the Volar row above except the TypeScript half runs on typescript-native-bridge (tsgo) instead of the JavaScript TypeScript: same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at ${tnbTsdk.notes}. Isolates how much of Volar's latency is TypeScript's engine rather than the Vue layer.`,
        measure: async () =>
          runLspSession({
            name: "Volar+TNB",
            command: volar.command,
            args: volar.args,
            shell: false,
            rootDir: workspace.dir,
            filePath: workspace.file,
            source: workspace.source,
            probe: workspace.probe,
            templateProbe: workspace.templateProbe,
            initializationOptions: {
              typescript: { tsdk: tnbTsdk.dir },
            },
            readyNotifications: [],
            volarHybrid: true,
            tsdkPath: tnbTsdk.dir,
          }),
      });
    }
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
      artifactLabel: "Hover bytes",
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
          templateProbe: workspace.templateProbe,
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
      artifactLabel: "Hover bytes",
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
          templateProbe: workspace.templateProbe,
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

  const results = await measureVariants(variants, {
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
      // No RSS/CPU here on purpose: this is the timed run. Server memory and
      // CPU come from `pnpm bench:memory`, which runs the same session with
      // sampling on and nothing being timed.
      r.phaseBreakdown = parts.join(" · ");
      r.notes = `${r.notes} | ${r.phaseBreakdown}`;
      // Surface primary metric clearly
      r.primaryMetric = "didOpen→hover (ms)";

      // Hover CONTENT gate. A server that answers quickly with no usable type
      // is not doing the job the latency is being credited for, so it is
      // demoted to unranked — measured, shown in brackets, with the reason.
      const invalid = r.metaSamples.filter((m) => m.hoverValid === false);
      // The Vue-specific half. A server can satisfy the script probe by
      // proxying to a TypeScript server; only the template probe shows whether
      // it models the template at all. Both must pass to be ranked.
      const tmplInvalid = r.metaSamples.filter((m) => m.templateHoverValid === false);
      if (invalid.length) {
        const why = invalid[invalid.length - 1];
        r.status = "unranked";
        r.throughput = "n/a";
        r.notes = `${r.notes} | ⚠ FAILED VALIDATION (script hover) — ${why.hoverReason}. Sample: ${JSON.stringify((why.hoverSample || "").slice(0, 120))}`;
      } else if (tmplInvalid.length) {
        const why = tmplInvalid[tmplInvalid.length - 1];
        r.status = "unranked";
        r.throughput = "n/a";
        r.notes = `${r.notes} | ⚠ FAILED VALIDATION (template hover) — ${why.templateHoverReason}. Sample: ${JSON.stringify((why.templateHoverSample || "").slice(0, 120))}`;
      }

      // Report a degraded backend on ANY row, ranked or not — it is the
      // explanation for the number in either direction.
      const fellBack = r.metaSamples.map((m) => m.backendFallback).filter(Boolean);
      if (fellBack.length) {
        r.notes = `${r.notes} | ⚠ BACKEND FALLBACK — ${fellBack[fellBack.length - 1]}`;
      }

      if (!invalid.length && !tmplInvalid.length) {
        const tmplProbed = r.metaSamples.some((m) => m.templateHoverValid === true);
        r.notes = `${r.notes} | hover verified: returns a TypeScript type for \`${HOVER_EXPECT_SYMBOL}\` in <script setup>${tmplProbed ? " AND the auto-unwrapped `string` inside {{ }} (template is really typechecked)" : ""}`;
      }
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
      "Hover content is gated in TWO places, both required to be ranked: the `<script setup>` position (must return a TypeScript type) and the `{{ benchMarker }}` TEMPLATE position (must return the auto-unwrapped `string`). The template probe is the Vue-specific one — a server can satisfy the script probe by proxying to a TypeScript server, but resolving a ref's unwrapped type inside an interpolation requires actually modelling the template, which is the job a Vue language server exists to do. A payload naming the symbol with no type, or returning the `Ref<...>` script type, fails.",
      "The template probe runs OUTSIDE every timed window, so it gates ranking without changing what the latency column measures.",
      "Each measured run starts a fresh language-server process (tool process cold).",
      "Volar is measured as the two-process product it is in v3: @vue/language-server has no in-process TypeScript language service, so the harness also starts typescript-language-server with @vue/typescript-plugin, syncs the same .vue buffer to both, and asks both for every feature in parallel — Volar is charged the slower half plus both processes' startup and project load. This is the same wiring VS Code and Neovim implement; without it the Vue server returns null for a <script setup> hover by design.",
      "Primary ranking column uses didOpen→hover latency (first semantic response after open), taken as the median over warmed runs — each run still starts a fresh server process, so per-process project load is measured every time.",
      `Hover retry budget is identical for every server (${HOVER_ATTEMPTS} attempts, ${HOVER_ATTEMPT_TIMEOUT_MS / 1000}s each, same backoff). Retry sleeps fall inside the timed open→hover window, so an asymmetric budget would silently subsidise whichever server got the larger one.`,
      "A fixed 50ms yield after didOpen is inside the timed window for every server alike — it is an additive constant, so it compresses ratios slightly but cannot reorder them.",
      "Phase breakdown in Notes: initialize, ready (n/a if no server signal), open→hover, hover cold, hover warm median(5), completion, definition.",
      "workspaceReady is ONLY timed when the server documents a ready notification (e.g. $/verter/ready). Missing signal = n/a, not 0.",
      "Completion/definition are best-effort extras; null/n/a does not mean the tool is slower — capability may differ.",
      "typescript-native-bridge (TNB) is a drop-in typescript package for CLI/tsserver — NOT a Vue LSP. It is out of this table; optional future experiment: Volar with TNB as workspace tsdk (same Volar binary, different TS engine).",
      "Verter binary is optional (VERTER_LSP_BIN). Skipped when missing.",
      "VS Code extension host overhead is NOT measured — only the language server stdio protocol.",
      "Server order is rotated on every warmup and measured run; no server is pinned to first position.",
    ],
    variants: results,
  };
}
