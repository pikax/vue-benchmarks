/**
 * Project-LSP surface — language-server operations over a REAL project, with the
 * project as the workspace root.
 *
 * ## Why the project has to be the workspace
 *
 * `lsp` on the generated corpus uses a tiny synthetic workspace with a planted
 * marker (`const benchMarker = ref('lsp-probe-token')`), which is what makes its
 * hover gate possible: the correct answer is written down. That workspace is also
 * what makes it a poor model of an editor session, because the expensive part of a
 * real one is loading a real project — hundreds of SFCs, a real dependency tree, a
 * real tsconfig with `paths`.
 *
 * This surface keeps that cost. The workspace root is the project package with the
 * most SFCs under it and its own `tsconfig.json`, the document opened is one of the
 * project's own SFCs, and every server gets the same directory, file and position.
 * Nothing is copied out and nothing is written in.
 *
 * ## What is measured, and why it is ranked per operation
 *
 * - **didOpen → diagnostics** — the cold path: the server has to load the project
 *   before it can say anything about the document.
 * - **hover** — warm, with the document already open and the project loaded.
 *
 * These differ by orders of magnitude and answer unrelated questions, so they are
 * ranked in separate tables and never pooled (`IDE_RANKING_RULES`). Each operation
 * is measured in its OWN fresh server session, so the hover row is not credited
 * with a project load the diagnostics row already paid for, and so tool-order
 * rotation applies to each operation independently.
 *
 * ## Rows: the Vue layer, and the TypeScript engine underneath it
 *
 * - **Volar (JS)** — `@vue/language-server` with the stock JavaScript TypeScript
 *   tsdk. **BASELINE.**
 * - **Volar (TNB / tsgo tsdk)** — the SAME Volar with its TypeScript half on
 *   typescript-native-bridge. One variable against the row above: the engine.
 * - **Verter LSP** and **Vize LSP** — single-process native servers, when they
 *   start.
 *
 * Volar v3 has no in-process TypeScript language service, so both Volar rows are
 * measured as the two-process product they are: `@vue/language-server` plus
 * `typescript-language-server` with `@vue/typescript-plugin`, joined by the
 * tsserver bridge, both processes' startup and project load inside the timings.
 *
 * The JS and native engines are ranked in SEPARATE tables, as
 * `project-typecheck.mjs` does and for the same reason: a ratio across them
 * measures TypeScript's own Go rewrite at least as much as the Vue layer on top.
 *
 * ## The content gate, and what it does NOT claim
 *
 * There is no planted marker in third-party source, so "the right answer" is
 * unknown. What can still be established is that a server ANSWERED:
 *
 * - **hover** — the payload must be non-empty at a position the BASELINE also
 *   answered at. The position is chosen by an untimed baseline pre-flight for
 *   exactly that reason: a position nothing answers at would gate every row on the
 *   harness's choice of cursor.
 * - **diagnostics** — a `publishDiagnostics` notification must arrive for the
 *   opened document, and where the baseline reported at least one diagnostic, a row
 *   reporting none is unranked. An empty or absent answer is not a fast answer.
 *
 * **Correctness of the content is NOT asserted for third-party code.** This
 * surface does not know whether a hover payload or a diagnostic is right; it knows
 * whether the server produced one where the reference server produced one. The
 * generated-corpus `lsp` surface is where content correctness is actually gated,
 * against a marker whose type is known.
 */

import { readFileSync } from "node:fs";
import { dirname, join, relative, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { LspClient, pathToFileUri } from "../lsp-client.mjs";
import { attachVolarHybridBridge, summarizeBridgeFailures } from "../tsserver-bridge.mjs";
import { measureVariants, median } from "../timing.mjs";
import { resolveTnbTsdk } from "../tnb.mjs";
import { withTsgoEnv } from "../tsgo.mjs";
import { discoverTypecheckTargets } from "../real-world/test-targets.mjs";
import {
  detectBackendFallback,
  resolveTsdk,
  resolveVerterLsp,
  resolveVizeLsp,
  resolveVolarServer,
} from "./lsp.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Warm hover samples taken inside one session; the median is the row's number. */
const WARM_HOVER_N = 3;

/**
 * Budgets, identical for every server — and BOUNDED, which took a correction.
 *
 * `OP_TIMEOUT_MS` is the budget for a whole operation: loading a real project is
 * the work this surface exists to measure, so it has to be generous, and an
 * asymmetric budget would silently subsidise whichever server got the larger one.
 * A budget too small for anyone is no better, because it turns "slow" into
 * "absent", which reads as no result rather than as a result.
 *
 * `REQUEST_TIMEOUT_MS` is the budget for ONE request, and it exists because the
 * first version multiplied instead of bounding: a 120 s per-attempt timeout, 6
 * attempts, and up to 8 candidate positions is 96 minutes of worst case for a
 * single session. The retry loop now runs against a single wall-clock DEADLINE, so
 * the total is bounded by `OP_TIMEOUT_MS` however the attempts fall out.
 */
// Env-overridable for DIAGNOSIS only (work/probe-lsp.mjs raises it to tell a
// slow tsserver project load from a wedged one). Published runs use the
// scaled default: a budget that varies by machine is not a comparable budget.
const OP_TIMEOUT_MS = Number(process.env.LSP_BENCH_OP_TIMEOUT_MS) || 120_000;

/**
 * Operation budget scaled by CORPUS SIZE, identically for every server.
 *
 * A flat 120 s was validated on 162-293-SFC corpora; a language server that
 * legitimately needs longer to load a 1246-1682-SFC program would get
 * "the server never answered" — a harness budget published in tool-verdict
 * clothing, and the slowest-loading engine (usually the JS baseline) hits it
 * first. +30 s per 500 SFCs past the first 500, capped at 300 s so a genuinely
 * dead server still costs minutes, not the surface. The same number is handed
 * to every server on a corpus, so the budget can never rank anyone.
 */
export function scaledOpTimeoutMs(fileCount) {
  const env = Number(process.env.LSP_BENCH_OP_TIMEOUT_MS);
  if (env > 0) return env;
  const extra = Math.max(0, Math.ceil((Number(fileCount) - 500) / 500)) * 30_000;
  return Math.min(300_000, 120_000 + extra);
}
const REQUEST_TIMEOUT_MS = 30_000;

/** Flatten the several shapes LSP allows for Hover.contents into plain text. */
export function hoverText(result) {
  const c = result?.contents;
  if (c == null) return "";
  const one = (x) => (typeof x === "string" ? x : typeof x?.value === "string" ? x.value : "");
  return (Array.isArray(c) ? c.map(one).join("\n") : one(c)).trim();
}

/** Merge hover payloads the way an editor merges several providers' answers. */
function mergeHover(...hovers) {
  const contents = [];
  for (const h of hovers) {
    if (!h?.contents) continue;
    const c = h.contents;
    if (Array.isArray(c)) contents.push(...c);
    else contents.push(c);
  }
  return contents.length ? { contents } : null;
}

/**
 * Candidate hover positions inside one SFC: the `const <name>` declarations of its
 * `<script setup>` block.
 *
 * Deliberately NOT "line 1, character 1". A position chosen without reference to
 * the source lands on whitespace or inside a comment as often as not, and a server
 * answering nothing there would fail the content gate for the harness's choice of
 * cursor rather than for anything about the server. The pre-flight then narrows
 * these to one the BASELINE actually answers at.
 *
 * Exported for tests: getting this wrong produces a surface where every row is
 * unranked, which looks like four broken servers.
 */
export function hoverCandidates(source, limit = 8) {
  const lines = String(source ?? "").split(/\r?\n/);
  const out = [];
  let inScript = false;
  for (let i = 0; i < lines.length && out.length < limit; i++) {
    const line = lines[i];
    if (/<script\b/.test(line)) inScript = true;
    else if (/<\/script>/.test(line)) inScript = false;
    if (!inScript) continue;
    // `const foo = …`, `const { a, b } = …` is skipped: a destructuring pattern has
    // no single identifier a hover is guaranteed to describe.
    const m = /^\s*(?:const|let|function)\s+([A-Za-z_$][\w$]*)/.exec(line);
    if (!m) continue;
    const character = line.indexOf(m[1], m.index ?? 0);
    if (character < 0) continue;
    out.push({ line: i, character, symbol: m[1] });
  }
  return out;
}

/**
 * One language-server session against the real project.
 *
 * Returns both operations' numbers so the pre-flight can establish a probe with a
 * single session; the measured rows each call it for ONE operation, so no row is
 * credited with work another row already paid for.
 *
 * @param {object} opts
 * @param {"diagnostics"|"hover"} opts.operation which number is the row's `ms`
 */
/**
 * Canonical form for COMPARING document URIs across servers.
 *
 * Servers echo the same Windows path in different legal spellings — the
 * harness opens `file:///D:/dev/…/affix.vue` and Volar (both halves) publishes
 * `file:///d%3A/dev/…/affix.vue`: lowercase drive AND a percent-encoded colon.
 * The old filter lowercased both sides, which fixes the drive letter and not
 * the `%3A`, so every genuine publication was silently discarded and the
 * diagnostics wait "timed out" on servers that had answered in 5 seconds.
 * That one dropped comparison was the whole of "project-lsp never finishes":
 * 48 sessions × a 120 s wait for a message that had already arrived.
 *
 * Decode first, then case-fold. An invalid escape keeps the raw string, so a
 * malformed URI fails the comparison instead of throwing out of a listener.
 */
export function canonicalUri(uri) {
  let text = String(uri ?? "");
  try {
    text = decodeURIComponent(text);
  } catch {
    // Fail closed: an undecodable URI is compared as spelled.
  }
  return text.replace(/\\/g, "/").toLowerCase();
}

export async function runProjectLspSession({
  name,
  command,
  args,
  shell = false,
  workspaceDir,
  filePath,
  source,
  positions,
  operation,
  initializationOptions,
  volarHybrid = false,
  tsdkPath,
  env = {},
  opTimeoutMs = OP_TIMEOUT_MS,
}) {
  const rootUri = pathToFileUri(workspaceDir);
  const fileUri = pathToFileUri(filePath);
  const client = new LspClient(name, command, args, {
    shell,
    cwd: workspaceDir,
    env,
    configuration: {
      typescript: { tsdk: initializationOptions?.typescript?.tsdk ?? tsdkPath },
      vue: {},
      volar: {},
      workspaceFolders: [{ uri: rootUri, name: "bench" }],
    },
  });

  // Diagnostics are PUSHED, and they can arrive before the request that would
  // otherwise be awaited. The listener is attached before `initialize` so nothing
  // published during project load is missed — a missed notification would be
  // recorded as "the server never answered", which is the gate's failure verdict.
  let diagnosticsAt = null;
  let diagnosticsCount = null;
  // The FIRST publication can be an empty preliminary (typescript-language-
  // server's syntax-only pass routinely is), so the first NON-EMPTY publication
  // is tracked alongside it for as long as the session lives. The row's ms
  // stays "first answer" — the same event for every server — but the count
  // gate and the reader get both numbers instead of whichever raced first.
  let firstNonEmptyAt = null;
  let firstNonEmptyCount = null;
  const wantUri = canonicalUri(fileUri);
  const onDiagnostics = (params) => {
    if (canonicalUri(params?.uri) !== wantUri) return;
    const count = Array.isArray(params?.diagnostics) ? params.diagnostics.length : 0;
    if (diagnosticsAt == null) {
      diagnosticsAt = performance.now();
      diagnosticsCount = count;
    }
    if (count > 0 && firstNonEmptyAt == null) {
      firstNonEmptyAt = performance.now();
      firstNonEmptyCount = count;
    }
  };
  client.on("notify:textDocument/publishDiagnostics", onDiagnostics);

  let hybrid = null;
  try {
    const tInit0 = performance.now();
    // The bridge must be listening before initialize/didOpen, or it misses the
    // first `tsserver/request` and Volar's TypeScript half never comes up.
    if (volarHybrid) {
      hybrid = await attachVolarHybridBridge(client, {
        workspaceDir,
        rootDir,
        tsdkDir: tsdkPath,
      });
      // In hybrid mode the TypeScript half also publishes diagnostics for the
      // opened document, on its own connection (see onDiagnostics in
      // tsserver-bridge.mjs). The row times the FIRST publication from either
      // half of the measured pair — first answer, not a union: an editor shows
      // both halves' lists merged eventually, but the latency a user feels is
      // whichever half speaks first, and the listener records the first
      // non-empty publication separately so an empty preliminary cannot pass
      // itself off as the whole answer. Attached before didOpen, like the
      // Vue-side listener above.
      hybrid.onDiagnostics(onDiagnostics);
    }
    await client.initialize(rootUri, { initializationOptions, timeoutMs: opTimeoutMs });
    const initializeMs = performance.now() - tInit0;

    const tOpen0 = performance.now();
    const openParams = {
      textDocument: { uri: fileUri, languageId: "vue", version: 1, text: source },
    };
    client.sendNotification("textDocument/didOpen", openParams);
    // Volar's TypeScript half needs the same buffer: `_vue:projectInfo` fails
    // outright unless the .vue file is open in the TypeScript server too. Editors
    // sync it to both, and the cost of the second open is inside Volar's window.
    if (hybrid) hybrid.openDocument(openParams.textDocument);

    const ask = async (method, params, timeoutMs, merge) => {
      if (!hybrid) return client.sendRequest(method, params, timeoutMs);
      const own = client.sendRequest(method, params, timeoutMs);
      const ts = hybrid.request(method, params, timeoutMs);
      // Promise.all settles on the first rejection, so the other leg could reject
      // later with nobody listening — an unhandled rejection that takes the worker
      // down. A no-op handler marks each leg handled without hiding the failure.
      own.catch(() => {});
      ts.catch(() => {});
      const [a, b] = await Promise.all([own, ts]);
      return merge ? merge(a, b) : (b ?? a);
    };

    /**
     * Wait for the first diagnostics publication for this document.
     *
     * Polled rather than awaited on a one-shot promise because the notification
     * may already have arrived during `initialize` — the listener above records
     * the timestamp, and this only has to notice it.
     */
    const waitForDiagnostics = async () => {
      const deadline = performance.now() + opTimeoutMs;
      while (diagnosticsAt == null && performance.now() < deadline) {
        await new Promise((r) => setTimeout(r, 25));
      }
      return diagnosticsAt != null ? diagnosticsAt - tOpen0 : null;
    };

    let didOpenToDiagnosticsMs = null;
    let hoverMs = null;
    let hoverPayload = "";
    let hoverAnswered = false;
    let hoverPosition = null;

    if (operation === "diagnostics") {
      didOpenToDiagnosticsMs = await waitForDiagnostics();
      if (didOpenToDiagnosticsMs == null) {
        throw new Error(
          `${name}: no textDocument/publishDiagnostics for the opened document within ${opTimeoutMs} ms — the server never answered, so there is no latency to report`,
        );
      }
    } else {
      // The document has to be usable before a hover means anything, and the way
      // readiness is established is the SAME for every server and INSIDE the
      // measured region: retry the hover until it returns. Whoever needs project
      // load time pays for it, exactly as on the generated-corpus lsp surface.
      //
      // ONE wall-clock deadline governs the whole phase. Nesting a per-attempt
      // timeout inside a per-position loop multiplied instead of bounding — 120 s
      // × 6 attempts × 8 positions is 96 minutes for a single session, which is
      // not a budget, it is a hang with a plausible explanation.
      let last = null;
      let ok = false;
      let attempts = 0;
      const deadline = performance.now() + opTimeoutMs;
      while (!ok && performance.now() < deadline) {
        // Positions are cycled rather than exhausted one at a time: a server that
        // is still loading answers nothing ANYWHERE, so retrying position 1 six
        // times before trying position 2 spends the whole budget on the wrong
        // question.
        const position = positions[attempts % positions.length];
        attempts++;
        try {
          const hover = await ask(
            "textDocument/hover",
            { textDocument: { uri: fileUri }, position },
            Math.min(REQUEST_TIMEOUT_MS, Math.max(1_000, deadline - performance.now())),
            mergeHover,
          );
          const text = hoverText(hover);
          if (text) {
            hoverPayload = text;
            hoverAnswered = true;
            hoverPosition = position;
            ok = true;
            break;
          }
        } catch (error) {
          last = error;
        }
        // Backoff, identical for every server, and inside the measured window —
        // whoever needs project-load time pays for it in the metric.
        await new Promise((r) => setTimeout(r, Math.min(1_000, 200 * attempts)));
      }
      if (!ok && last) throw new Error(`${name}: hover failed — ${last.message}`);

      // Warm samples at the position that answered (or the first candidate, so a
      // server that answered nothing still produces a comparable latency next to
      // its ⚠ marker rather than dropping out of the table entirely).
      const at = hoverPosition ?? positions[0];
      const warm = [];
      for (let i = 0; i < WARM_HOVER_N; i++) {
        const t0 = performance.now();
        try {
          const hover = await ask(
            "textDocument/hover",
            { textDocument: { uri: fileUri }, position: at },
            REQUEST_TIMEOUT_MS,
            mergeHover,
          );
          if (!hoverPayload) hoverPayload = hoverText(hover);
        } catch {
          // A failed warm sample still costs the time it took; recording it keeps
          // the median honest rather than quietly dropping the slow attempts.
        }
        warm.push(performance.now() - t0);
      }
      hoverMs = median(warm);
      // Observed, never waited for: a diagnostics count from this session is a
      // diagnostic about the session, not a second measurement.
      if (diagnosticsAt != null) didOpenToDiagnosticsMs = diagnosticsAt - tOpen0;
    }

    const meta = {
      initializeMs,
      didOpenToDiagnosticsMs,
      diagnosticsCount,
      firstNonEmptyDiagnosticsMs: firstNonEmptyAt != null ? firstNonEmptyAt - tOpen0 : null,
      firstNonEmptyDiagnosticsCount: firstNonEmptyCount,
      hoverMs,
      hoverAnswered,
      hoverBytes: Buffer.byteLength(hoverPayload, "utf8"),
      hoverSample: hoverPayload.slice(0, 200),
      hoverPosition,
      backendFallback: detectBackendFallback(client.stderrTail),
      // The bridge's attribution channel, finally CONSUMED: forwarded tsserver
      // commands that produced no answer within budget. Without this, "the
      // content gate failed" and "the bridge budget expired" published as the
      // same empty payload — the exact ambiguity the channel was built to
      // remove, then left unread.
      bridgeFailures: hybrid?.takeBridgeFailures?.() ?? null,
    };
    const ms = operation === "diagnostics" ? didOpenToDiagnosticsMs : hoverMs;
    return {
      ms,
      // Artifact is the diagnostics count for the diagnostics rows and the hover
      // payload size for the hover rows: in both cases "the server produced
      // something", which is what the gate rules on.
      meta: {
        ...meta,
        artifact: operation === "diagnostics" ? (diagnosticsCount ?? 0) : meta.hoverBytes,
      },
    };
  } finally {
    client.off("notify:textDocument/publishDiagnostics", onDiagnostics);
    await client.shutdown();
    if (hybrid) await hybrid.close();
  }
}

/**
 * Every post-measurement gate on this surface, mutating rows in place.
 *
 * Exported and pure so it can be tested against synthetic rows. Both gates guard
 * the same thing: latency credited for an answer that was never given.
 *
 * @param {Array<object>} results rows from `measureVariants`
 */
export function applyProjectLspGates(results) {
  const opOf = (row) => (String(row.id).endsWith("-diagnostics") ? "diagnostics" : "hover");

  // 1. Hover content: an empty payload is not a fast answer. Applied to EVERY
  // hover row including the baseline's — the position was chosen because the
  // baseline answered at it untimed, so a baseline that stops answering there is
  // as suspect as anyone.
  for (const row of results) {
    if (row.status !== "ok" || opOf(row) !== "hover") continue;
    const samples = row.metaSamples ?? [];
    // `every`, not `some`: one run that happened to answer does not make the
    // series an answered series.
    if (samples.length > 0 && samples.every((m) => m.hoverAnswered)) continue;
    const answered = samples.filter((m) => m.hoverAnswered).length;
    row.status = "unranked";
    row.notes = `${row.notes} | ⚠ FAILED HOVER CONTENT GATE — returned a non-empty hover on ${answered} of ${samples.length} measured run(s) at a position the baseline answered at untimed. An empty or absent answer is not a fast answer. Measured but UNRANKED. (Whether the content is CORRECT is not asserted for third-party code — see the methodology.)`;
  }

  // 2. Diagnostics content. Presence is enforced by the session itself (a run with
  // no publication throws), so what is left is the count.
  //
  // The anchor is the MAX **any OK row** reported, across every sample and both
  // recorded publications (first and first-non-empty). It used to be the
  // baseline alone — but Volar v3's hybrid routes most TypeScript diagnostics
  // over its tsserver half, and on corpora where that half stays silent the
  // baseline structurally publishes 0, so a baseline-only anchor never fired:
  // rows publishing 0 diagnostics were ranked FIRST against peers publishing
  // 4-62 (2026-07-30 audit, finding 3). A document one server finds problems
  // in has reportable content, whoever that server is; publishing none there
  // is not the same job done faster. Applied to EVERY row including the
  // baseline — the reference implementation earns no exemption from its own
  // gate. Max over samples still holds: one racy empty preliminary push must
  // not disarm the only guard against "answered nothing fast".
  const diagCountOf = (row) => {
    const samples = row.metaSamples ?? [];
    if (samples.length === 0) return null;
    return Math.max(
      ...samples.map((m) =>
        Math.max(m.diagnosticsCount ?? 0, m.firstNonEmptyDiagnosticsCount ?? 0),
      ),
    );
  };
  const diagRows = results.filter((r) => r.status === "ok" && opOf(r) === "diagnostics");
  let anchor = { row: null, count: null };
  for (const row of diagRows) {
    const count = diagCountOf(row);
    if (count !== null && count > (anchor.count ?? -1)) anchor = { row, count };
  }
  for (const row of diagRows) {
    // A row with NO recorded census cannot be evaluated, and this function is
    // exported-pure with a claim to gate every row — so the row must say the
    // gate never saw it instead of rendering as though it had passed. (When
    // every row is censusless, the anchor is null and each row gets this note
    // rather than a silent early exit.)
    if (diagCountOf(row) === null) {
      row.notes = `${row.notes} | ⓘ DIAGNOSTIC-CONTENT GATE NOT RUN — no diagnostic census was recorded for this row, so the content gate could not evaluate it. Ranked, but unverified rather than verified-equal.`;
      continue;
    }
    if (anchor.count === 0) {
      row.notes = `${row.notes} | ⓘ DIAGNOSTIC-CONTENT GATE NOT RUN — every server published an EMPTY diagnostic list for this document. That is a legitimate answer, but not one any row can be measured against. Ranked, but unverified rather than verified-equal.`;
      continue;
    }
    if (row === anchor.row) continue;
    const count = diagCountOf(row);
    if (count === 0) {
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ FAILED DIAGNOSTIC-CONTENT GATE — published 0 diagnostics for a document ${anchor.row.package ?? anchor.row.id} published ${anchor.count} for. Answering "nothing to report" fast is not the same job as answering. Measured but UNRANKED. (Diagnostic EQUIVALENCE is not asserted; the counts are published so a suspicious row is visible.)`;
    }
  }

  // A count/presence census is not a semantic oracle, and these rows do not
  // even observe the same diagnostic product: Volar's LSP notification omits
  // diagnostics owned by its separate tsserver half, while the single-process
  // servers publish Vue and TypeScript diagnostics together. Keep the useful
  // latency observations, but never rank unequal, unknown-correctness work.
  for (const row of results) {
    if (opOf(row) !== "diagnostics") continue;
    if (row.status === "ok") row.status = "unranked";
    if (row.status !== "unranked") continue;
    row.notes = `${row.notes} | ⚠ OBSERVATIONAL ONLY — diagnostics correctness is UNKNOWN on this unplanted third-party document, and Volar's Vue-only LSP publication is not the same product as the native servers' combined Vue+TypeScript publication. Time and counts remain visible; no diagnostics row participates in ranking.`;
  }

  // 3. Degraded backend, reported on ANY row ranked or not — it is the
  // explanation for the number in either direction, and detecting one vendor's
  // and not another's would disclose the condition only for the tool the harness
  // happens to know about.
  for (const row of results) {
    const fell = (row.metaSamples ?? []).map((m) => m.backendFallback).filter(Boolean);
    if (fell.length) row.notes = `${row.notes} | ⚠ BACKEND FALLBACK — ${fell[fell.length - 1]}`;
  }

  // 4. Bridge failures, on any row that had one: a forwarded tsserver command
  // that produced no answer is the difference between "the server answered
  // emptily" and "the harness stopped waiting (or errored)", and a row whose
  // gate verdict rests on an empty payload must say which one it was. The
  // summary comes from the bridge's own tested summariser, which distinguishes
  // budget expiries from request errors — a hand-rolled format here once
  // labelled every error kind an expiry.
  for (const row of results) {
    const failures = (row.metaSamples ?? []).flatMap((m) => m.bridgeFailures ?? []).filter(Boolean);
    if (failures.length === 0) continue;
    const summary = summarizeBridgeFailures(failures);
    row.notes = `${row.notes} | ⚠ TSSERVER BRIDGE FAILURES during measurement — ${summary}. An empty answer influenced by these is the harness component stopping, not the server answering emptily. (Only the two-process Volar rows have a bridge; single-process servers have no equivalent harness component to fail.)`;
  }
  return results;
}

/**
 * Server definitions, resolved against what is installed.
 *
 * `engineClass` is a row property AND the second half of the group key: the JS
 * TypeScript engine and native tsgo are different comparison classes, so a Volar
 * (JS) number is never ranked against a tsgo number — see `project-typecheck.mjs`
 * for the same rule and the same reason.
 */
export function resolveServers() {
  const servers = [];
  const volar = resolveVolarServer();
  const tsdk = resolveTsdk();

  if (volar) {
    servers.push({
      id: "volar-js",
      label: "Volar (@vue/language-server)",
      package: "@vue/language-server",
      engine: "tsc-js",
      engineClass: "js",
      baseline: true,
      notes:
        "BASELINE · official Vue language server v3 in hybrid (two-process) mode — the only mode v3 has. The measured unit is the pair: @vue/language-server plus typescript-language-server with @vue/typescript-plugin, joined by the tsserver bridge. Both processes' startup and project load of the real project are inside the timings. HOVER asks both halves in parallel and charges the slower; DIAGNOSTICS times the first publication for the document from either half (which may be an empty preliminary — the count it carried and the first NON-EMPTY publication are both published).",
      session: {
        command: volar.command,
        args: volar.args,
        volarHybrid: true,
        tsdkPath: tsdk,
        initializationOptions: { typescript: { tsdk } },
      },
    });

    const tnb = resolveTnbTsdk(rootDir);
    if (tnb.dir) {
      servers.push({
        id: "volar-tnb",
        label: "Volar (TNB / tsgo tsdk)",
        package: "@vue/language-server",
        baseline: true,
        baselineLabel: "Vue official layer",
        engine: "tsgo via typescript-native-bridge",
        engineClass: "native",
        notes: `Identical to the Volar row except the TypeScript half runs on typescript-native-bridge (tsgo): same @vue/language-server, same @vue/typescript-plugin, same bridge, tsdk pointed at ${tnb.notes}. Exactly one variable against the baseline — the TypeScript engine — which is why the two are ranked in separate tables.`,
        session: {
          command: volar.command,
          args: volar.args,
          volarHybrid: true,
          tsdkPath: tnb.dir,
          initializationOptions: { typescript: { tsdk: tnb.dir } },
        },
      });
    } else {
      servers.push({
        id: "volar-tnb",
        label: "Volar (TNB / tsgo tsdk)",
        package: "@vue/language-server",
        baseline: true,
        baselineLabel: "Vue official layer",
        engineClass: "native",
        notes: `Skipped: ${tnb.notes}`,
        unavailable: true,
      });
    }
  } else {
    servers.push({
      id: "volar-js",
      label: "Volar (@vue/language-server)",
      package: "@vue/language-server",
      engine: "tsc-js",
      engineClass: "js",
      baseline: true,
      notes: "Skipped: @vue/language-server is not installed, so there is no baseline.",
      unavailable: true,
    });
  }

  const verter = resolveVerterLsp();
  servers.push(
    verter
      ? {
          id: "verter-lsp",
          label: `Verter LSP${verter.labelExtra ? ` (${verter.labelExtra})` : ""}`,
          package: "verter-lsp",
          engine: "tsgo (stable)",
          engineClass: "native",
          notes: `verter-lsp stdio, the native server from the published npm package, given the project directory as its workspace root. $/verter/ready is not waited for — its workspace load is inside the measured window like every other server's.${verter.packagingNote ? ` ${verter.packagingNote}` : ""}`,
          session: {
            command: verter.command,
            // No positional workspace argv: A/B'd 2026-07-30 — the server
            // loads the workspace from the LSP rootUri alone (diagnostics in
            // 2.5 s on hoppscotch without the arg), which is all an editor
            // would give it. The extra argv was undocumented provisioning.
            args: verter.args ?? [],
            shell: verter.shell,
            initializationOptions: {},
            env: withTsgoEnv({}, rootDir),
          },
        }
      : {
          id: "verter-lsp",
          label: "Verter LSP",
          package: "verter-lsp",
          engineClass: "native",
          notes:
            "Not installed. Add `verter-lsp` from npm — no local build is discovered, so every row names a published version.",
          unavailable: true,
        },
  );

  const vize = resolveVizeLsp();
  servers.push(
    vize
      ? {
          id: "vize-lsp",
          label: `Vize LSP${vize.labelExtra ? ` (${vize.labelExtra})` : ""}`,
          package: "vize",
          engine: "tsgo (nightly/Corsa when available)",
          engineClass: "native",
          notes: `vize lsp --stdio, launched from the ${
            vize.entry === "native"
              ? "standalone NATIVE server the VS Code extension downloads and runs"
              : "npm package's NODE entry, because no version-matched native server was found; that costs ~35ms of Node bootstrap per spawn"
          }. Same workspace, file and position as every other row.`,
          session: {
            command: vize.command,
            args: vize.args,
            shell: vize.shell,
            initializationOptions: {},
          },
        }
      : {
          id: "vize-lsp",
          label: "Vize LSP",
          package: "vize",
          engineClass: "native",
          notes: "vize binary not found",
          unavailable: true,
        },
  );

  return servers;
}

/**
 * Untimed baseline pre-flight: pick the document AND the hover position.
 *
 * The position must be one the BASELINE answers at. Choosing it any other way
 * makes the content gate a test of the harness's cursor placement: a position on
 * whitespace, in a comment, or on a symbol whose type the reference server also
 * declines to describe would unrank every row alike and read as four broken
 * servers.
 *
 * At most `maxFiles` candidates are tried, because each attempt is a full project
 * load and the pre-flight is pure overhead on the surface's runtime.
 */
async function preflightProbe({ baseline, workspaceDir, candidates, maxFiles = 3, opTimeoutMs }) {
  const rejected = [];
  for (const candidate of candidates.slice(0, maxFiles)) {
    let source;
    try {
      source = readFileSync(candidate.abs, "utf8");
    } catch (error) {
      rejected.push(
        `${candidate.key}: unreadable (${error instanceof Error ? error.message : error})`,
      );
      continue;
    }
    const positions = hoverCandidates(source);
    if (positions.length === 0) {
      rejected.push(
        `${candidate.key}: no const/let/function declaration in its script block to hover`,
      );
      continue;
    }
    try {
      const probe = await runProjectLspSession({
        name: "preflight",
        command: baseline.session.command,
        args: baseline.session.args,
        shell: baseline.session.shell,
        workspaceDir,
        filePath: candidate.abs,
        source,
        positions,
        operation: "hover",
        initializationOptions: baseline.session.initializationOptions,
        volarHybrid: baseline.session.volarHybrid,
        tsdkPath: baseline.session.tsdkPath,
        env: baseline.session.env ?? {},
        opTimeoutMs,
      });
      if (!probe.meta.hoverAnswered) {
        rejected.push(
          `${candidate.key}: the baseline answered no hover at any of ${positions.length} candidate positions`,
        );
        continue;
      }
      return {
        probe: {
          key: candidate.key,
          abs: candidate.abs,
          source,
          // ONE position, the one that worked. Every server is asked at exactly
          // this position, so the comparison is not "did you answer somewhere".
          positions: [probe.meta.hoverPosition],
          symbol:
            positions.find(
              (p) =>
                p.line === probe.meta.hoverPosition?.line &&
                p.character === probe.meta.hoverPosition?.character,
            )?.symbol ?? "?",
          baselineHoverSample: probe.meta.hoverSample,
          baselineDiagnostics: probe.meta.diagnosticsCount,
        },
        rejected,
      };
    } catch (error) {
      rejected.push(
        `${candidate.key}: the baseline session failed — ${String(
          error instanceof Error ? error.message : error,
        ).slice(0, 200)}`,
      );
    }
  }
  return { probe: null, rejected };
}

/**
 * The corpus files under a target, sorted for determinism.
 *
 * Uses the resolved corpus rather than a private walk, so `--file-limit` and its
 * truncation disclosure apply here as everywhere else.
 */
function documentsUnderTarget(resolved, targetDir) {
  const out = [];
  for (const rel of resolved.files) {
    const abs = resolvePath(resolved.dir, rel);
    const inside = relative(targetDir, abs);
    if (!inside || inside.startsWith("..")) continue;
    out.push({ key: rel, abs });
  }
  return out;
}

/**
 * @param {import("../real-world/corpus.mjs").ResolvedCorpus} resolved
 */
export async function runProjectLspSurface(resolved, options) {
  const base = {
    id: "project-lsp",
    label: `Project LSP (project as workspace) — ${resolved.selector}`,
    files: resolved.files.length,
    bytes: resolved.bytes,
  };

  if (!resolved.installed) {
    return {
      ...base,
      variants: [],
      methodology: [
        `Skipped: ${resolved.project.id} has no node_modules. A language server whose workspace cannot resolve its imports answers quickly and emptily, which in a table is indistinguishable from a fast, thorough server. Fix with: pnpm fetch:real-world --projects ${resolved.project.id}`,
      ],
    };
  }

  // Only targets the CORPUS actually lives in are candidates. The typecheck
  // ranking prefers the package with the most SFCs anywhere in the repo, which
  // on element-plus is `docs` (779 SFCs) — none of them in the `components`
  // corpus, so the surface published zero rows for a corpus every server could
  // have measured. The workspace opened must be one containing at least one
  // corpus document; among those, the typecheck ranking (most SFCs first)
  // still decides.
  const candidates = discoverTypecheckTargets(resolved.dir);
  const overlapping = candidates.filter((c) => documentsUnderTarget(resolved, c.dir).length > 0);
  const target = overlapping[0] ?? null;
  if (!target) {
    return {
      ...base,
      variants: [],
      methodology: [
        candidates.length === 0
          ? `No LSP target in ${resolved.project.id} at ${resolved.project.ref}: the workspace root needs its own tsconfig.json and SFCs beneath it. Reusing the typecheck discovery is deliberate — a language server needs the same real TypeScript project a checker does, and without a tsconfig the managed engines do not start at all.`
          : `No LSP target overlaps this corpus: ${candidates.length} tsconfig target(s) exist (${candidates
              .slice(0, 3)
              .map((c) => c.relDir)
              .join(", ")}…) but none contains a corpus SFC, so there is no document to open.`,
      ],
    };
  }

  const workspaceDir = target.dir;
  const documents = documentsUnderTarget(resolved, workspaceDir);

  const servers = resolveServers();
  const baseline = servers.find((s) => s.baseline);
  if (!baseline?.session) {
    return {
      ...base,
      variants: [],
      methodology: [
        `No rows: ${baseline?.notes ?? "the baseline server is unavailable"}. Without the reference server there is no position the content gate can anchor on, so nothing is published rather than published ungated.`,
      ],
    };
  }

  const opTimeoutMs = scaledOpTimeoutMs(resolved.files.length);
  const { probe, rejected } = await preflightProbe({
    baseline,
    workspaceDir,
    candidates: documents,
    opTimeoutMs,
  });
  const rejectedNotes = rejected.map(
    (r) =>
      `Pre-flight rejected a candidate document — ${r}. This is a harness gap in choosing a probe, NOT a statement about any server.`,
  );
  if (!probe) {
    return {
      ...base,
      variants: [],
      methodology: [
        `No document in ${target.relDir} could be probed with the baseline (Volar) in this environment, so there is no position the content gate can anchor on and no rows are published. Publishing rows gated on a position nothing answers at would unrank every server for this harness's choice of cursor.`,
        ...rejectedNotes,
      ],
    };
  }

  // Two variants per server: one per OPERATION, each with its own session. The
  // hover row must not be credited with a project load the diagnostics row
  // already paid for, and rotation has to apply to each operation separately.
  const OPERATIONS = [
    {
      id: "diagnostics",
      label: "didOpen → diagnostics",
      artifactLabel: "diagnostics published",
    },
    { id: "hover", label: `hover on \`${probe.symbol}\``, artifactLabel: "hover bytes" },
  ];

  const variants = [];
  for (const op of OPERATIONS) {
    for (const server of servers) {
      const row = {
        id: `${server.id}-${op.id}`,
        // The OPERATION is the group heading, so it is not repeated in the row
        // label. Keeping the label to the server's own name is also what lets the
        // shared report legend (`SLIM_RULES`) recognise these rows and print what
        // each server actually is — a label with the operation appended matches
        // nothing, so the table would carry four unexplained long names.
        label: server.label,
        package: server.package,
        baseline: Boolean(server.baseline),
        baselineLabel: server.baselineLabel ?? (server.baseline ? "Vue official" : undefined),
        engine: server.engine,
        invocation: "language server",
        artifactLabel: op.artifactLabel,
        // Diagnostics count is a census, not production: a server reporting fewer
        // problems is handled by the gate, and the renderer's generic
        // "produced less than the largest artifact" warning would scold the
        // quietest server instead.
        artifactPolarity: "informational",
      };
      if (server.unavailable) {
        variants.push({ ...row, notes: server.notes, skip: true });
        continue;
      }
      variants.push({
        ...row,
        notes: `${server.notes} · operation: ${op.label} · workspace ${target.relDir}, document ${probe.key}`,
        measure: () =>
          runProjectLspSession({
            name: `${server.id}:${op.id}`,
            command: server.session.command,
            args: server.session.argsWithWorkspace
              ? [...(server.session.args ?? []), workspaceDir]
              : server.session.args,
            shell: server.session.shell,
            workspaceDir,
            filePath: probe.abs,
            source: probe.source,
            positions: probe.positions,
            operation: op.id,
            initializationOptions: server.session.initializationOptions,
            volarHybrid: server.session.volarHybrid,
            tsdkPath: server.session.tsdkPath,
            env: server.session.env ?? {},
            opTimeoutMs,
          }),
      });
    }
  }

  const results = await measureVariants(variants, {
    runs: options.runs,
    // Gate-as-warmup was CONSIDERED here and REJECTED by fairness review: the
    // preflight is a BASELINE-ONLY session, so it warms the shared workspace
    // files for every server but only the BASELINE's own binaries and tsdk —
    // a challenger's first session would pay a cold-binary cost (25-40 MB of
    // native server + engine on this machine) the baseline's does not, and at
    // two measured runs the median absorbs half of it. Each row keeps its own
    // dedicated, rotated warmup session.
    warmups: options.warmups,
    fileCount: 1,
  });

  applyProjectLspGates(results);

  const classOf = new Map(servers.map((s) => [s.id, s.engineClass ?? "native"]));
  for (const op of OPERATIONS) {
    for (const cls of ["js", "native"]) {
      const members = results.filter((row) => {
        if (!String(row.id).endsWith(`-${op.id}`)) return false;
        const serverId = String(row.id).slice(0, -`-${op.id}`.length);
        return classOf.get(serverId) === cls;
      });
      if (members.length === 0) continue;
      const reference = members.find((row) => row.baseline);
      if (reference?.status === "ok") continue;
      for (const row of members) {
        if (row === reference || row.status === "skipped" || row.status === "error") continue;
        if (row.status === "ok") row.status = "unranked";
        row.notes = `${row.notes} | ⚠ VUE REFERENCE UNAVAILABLE/INVALID — this operation × engine class has no valid official Vue reference, so candidate timing remains visible but cannot rank.`;
      }
    }
  }

  // One group per OPERATION × ENGINE CLASS. Operations are never pooled (they
  // differ by orders of magnitude and answer unrelated questions) and engines are
  // never ranked across (a JS-vs-tsgo ratio measures TypeScript's Go rewrite as
  // much as the Vue layer). Both splits are enforced here, in the surface that
  // knows which row runs what.
  const groups = [];
  for (const op of OPERATIONS) {
    for (const cls of ["js", "native"]) {
      const rows = results.filter(
        (r) =>
          String(r.id).endsWith(`-${op.id}`) &&
          classOf.get(String(r.id).slice(0, -`-${op.id}`.length)) === cls,
      );
      if (rows.length === 0) continue;
      groups.push({
        id: `${op.id}-${cls}`,
        label:
          op.id === "diagnostics"
            ? `${op.label} — ${cls === "js" ? "JavaScript TypeScript engine" : "native tsgo engines"}, observational only`
            : cls === "js"
              ? `${op.label} — JavaScript TypeScript engine, ranked alone`
              : `${op.label} — native tsgo engines, ranked together`,
        variants: rows,
      });
    }
  }

  const p = resolved.project;
  return {
    ...base,
    files: 1,
    bytes: Buffer.byteLength(probe.source, "utf8"),
    groups,
    groupingNote:
      "Hover is ranked per TypeScript engine; diagnostics is observational and always unranked. The operations differ by orders of magnitude and answer unrelated questions, a ratio across engines measures TypeScript's Go rewrite as much as the Vue layer, and the diagnostics products are unequal (Volar Vue-only LSP publication versus native combined Vue+TypeScript publication) with no known-correct answer in third-party source.",
    variants: results,
    methodology: [
      `Workspace root: ${target.packageName} (${target.relDir}) — the project's own directory, its own tsconfig.json and its own installed dependencies, with ${target.sfcs} SFCs beneath it. Nothing is copied out and nothing is written in.`,
      `Operation budget: ${Math.round(opTimeoutMs / 1000)} s, scaled by corpus size (+30 s per 500 SFCs past the first 500, capped at 300 s) and IDENTICAL for every server — a flat budget sized on small corpora turned "slow but real project load" into "the server never answered" on large ones, a harness budget in tool-verdict clothing.`,
      "Every row runs a dedicated, discarded warmup session before its measured sessions. (The baseline preflight was considered as a substitute warm pass and rejected: it warms the shared workspace files for every server, but only the baseline's own binaries and tsdk — a per-server asymmetry a warm pass must not have.)",
      "Diagnostics rows time the FIRST publication for the opened document, which can be an empty preliminary; the count it carried and the first NON-EMPTY publication (time and count) are all published, and the diagnostic-content gate anchors on the maximum ANY ranked row reported across all samples so one racy empty message cannot disarm it.",
      `Document: ${probe.key}. Hover position: line ${probe.positions[0]?.line}, character ${probe.positions[0]?.character} — the identifier \`${probe.symbol}\`, chosen by an untimed BASELINE pre-flight because it is a position the reference server actually answers at.`,
      `Corpus pin: ${p.ref} @ ${(resolved.sha ?? "").slice(0, 8)}, ${p.releasedAt ? `released ${p.releasedAt}` : `committed ${p.committedAt}`} (${p.releaseKind}), pinned ${p.pinnedAt}.`,
      ...rejectedNotes,
      "Two operations, each measured in its OWN fresh server session: `didOpen → diagnostics` (cold — the server must load the real project before it can say anything) and `hover` (warm, median of 3, document already open). Sharing one session between them would credit the hover row with a project load the diagnostics row already paid for.",
      "Volar is measured as the two-process product it is in v3: @vue/language-server has no in-process TypeScript language service, so typescript-language-server with @vue/typescript-plugin is started too, the same .vue buffer is synced to both, and each feature is asked of both in parallel with the SLOWER half charged. Both processes' startup and project load are inside the timings.",
      "Rows are grouped by TypeScript ENGINE as well as by operation. `Volar (JS)` runs the stock JavaScript TypeScript compiler; `Volar (TNB / tsgo tsdk)` is the SAME Volar with its tsserver half on typescript-native-bridge. The pair isolates the engine, and because a JS-vs-native gap is not a Vue-tooling result the two are ranked in separate tables rather than one.",
      "HOVER CONTENT GATE: a row is UNRANKED unless it returned a non-empty hover on EVERY measured run, at the single position the baseline answered at untimed. An empty or absent answer is not a fast answer.",
      "DIAGNOSTIC CONTENT GATE: a run that never published diagnostics for the opened document is an ❌ error, not a fast row — there is no latency to report. The anchor is the maximum ANY ranked row published (not the baseline alone: Volar v3 routes most TypeScript diagnostics over its tsserver half, and where that half is silent a baseline-only anchor never fires, ranking 0-diagnostic rows first against peers publishing dozens). Where any server published at least one diagnostic, a row publishing none on every run is UNRANKED — baseline included; the note names the anchoring server. Where every server published an empty list, the gate cannot fire and each row says so rather than rendering as though it had passed.",
      "⚠ DIAGNOSTICS IS OBSERVATIONAL/UNRANKED. `textDocument/publishDiagnostics` from the Volar rows carries what the VUE server computes; Volar v3 delegates TypeScript to a separate tsserver that speaks the tsserver protocol rather than LSP, so TypeScript diagnostics reach a real editor through the extension and are NOT in this notification. A single-process server publishes Vue and TypeScript diagnostics together. Those are unequal products, and this third-party document has no planted known-correct diagnostic set. Times and counts are retained to expose behaviour, but no ratio is published. Hover does not have this product asymmetry: both Volar halves are asked and the slower is charged.",
      "⚠ CORRECTNESS OF THE CONTENT IS NOT ASSERTED. These are third-party sources with no planted marker, so nobody has written down what the right hover text or the right diagnostic set is for them. This surface establishes that a server ANSWERED where the reference server answered, and nothing more. Content correctness is gated on the generated corpus (`lsp`), against a symbol whose type is known.",
      "The retry budget and per-request timeout are identical for every server, and retry sleeps fall inside the measured window — an asymmetric budget would silently subsidise whichever server got the larger one. Readiness is established the same way for every server, by retrying the operation until it answers, so whoever needs project-load time pays for it in the metric.",
      "A degraded type backend is detected from stderr and reported on any row, ranked or not (Vize logs a failed Corsa spawn, Verter logs verter-only mode). It is reported rather than used to fail a row on its own: the content gates decide ranking, and this is the explanation for the number in either direction.",
      "Each measured run starts a fresh server process, so per-process project load is paid every time and no run inherits another's cache. Server order is rotated on every warmup and measured run.",
      "VS Code extension-host overhead is NOT measured — only the language-server stdio protocol.",
    ],
  };
}
