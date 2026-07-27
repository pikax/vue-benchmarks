/**
 * Edit loop — what a developer feels while TYPING, not on a freshly opened file.
 *
 * Every other suite here measures a cold file: open it, ask one question, stop.
 * That says nothing about the loop the editor is actually in — change a
 * character, wait for the squiggle, change it back, hover to check the type. The
 * failure this suite is built to catch is the one a cold-file benchmark cannot
 * see: a server that answers from a STALE buffer. It looks fast and it looks
 * correct, and it is neither, because the answer belongs to the previous edit.
 *
 * Operations, all timed from the `didChange` that caused them:
 *
 *   1. open-diagnostics    didOpen -> first diagnostics published for the file
 *   2. diagnostics-error   edit plants a type error -> diagnostics report it
 *   3. diagnostics-cleared edit fixes it            -> that diagnostic goes away
 *   4. hover-after-edit    edit changes a symbol's type -> hover returns the NEW
 *                          type, immediately, and never the old one
 *   5. xfile-diagnostics   Child.vue's prop type changes -> Parent.vue's template
 *                          diagnostics reflect it
 *   6. xfile-hover         ... and so does Parent.vue's hover
 *   7/8. steady-first/last 10 successive edits; median per-edit latency of the
 *                          first five vs the last five, so drift is visible
 *
 * THREE THINGS THAT ARE LOAD-BEARING AND NOT OBVIOUS
 *
 * a) Diagnostics are collected from EVERY half of the session, not just the
 *    server we spawned. Volar v3 answers no TypeScript itself: measured here,
 *    its Vue half publishes `[]` for a file that contains a hard type error
 *    while the tsserver half publishes the error. Listening to one half would
 *    report "Volar detects nothing", which is false. This is the same principle
 *    `ask()` implements for requests — an editor merges its providers — applied
 *    to notifications. It is not a per-server branch: the code path is "every
 *    half of whatever session was created", and for a single-process server
 *    there is exactly one half.
 *
 * b) The fixture puts `<script setup>` BEFORE `<template>`. With the usual
 *    template-first layout, Vize's `vue/sfc-element-order` lint fires on every
 *    file and its hover then answers with the LINT MESSAGE instead of a type —
 *    so a template-first fixture would measure a lint rule, not the edit loop.
 *    Script-first is valid, idiomatic Vue and no server penalises it.
 *
 * c) The hover probe sits at the TEMPLATE interpolation, not at the `<script>`
 *    declaration. Measured: Vize returns an empty hover at the script position
 *    and a typed hover at the template position, while the other three answer
 *    both. Probing the script position would have scored Vize as "no answer"
 *    on a question it can answer, and the staleness check — the entire point of
 *    operation 4 — would never have run against it.
 *
 * ONE LIMIT, STATED PLAINLY: operation 1 times the first `publishDiagnostics`
 * for a VALID file, and the correct payload for a valid file is empty. A server
 * that publishes `[]` before it has analysed anything therefore scores well
 * there. That is why the gate on operation 1 is only "a report arrived and it
 * does not claim this valid file is broken", and why operations 2/3 — which
 * demand specific CONTENT — are the ones to read.
 *
 * Because no content gate can tell an analysed empty report from a reflex empty
 * one — for a valid file both are `[]` — operation 1 is published with
 * `ranked: false`. It is still measured and its number still printed; it is
 * simply never given a `vs fastest` figure, because "1.00x" against a server
 * that really analysed the file would be a ranking of who answers soonest with
 * nothing. Measured, unranked and explained beats ranked and wrong.
 *
 * That this caveat was written here and nowhere else is the whole problem it
 * fixes: the report published the ranking anyway. Measured on this fixture,
 * `Verter 21.6 ms → 1.00x` against `Volar 877.2 ms → 40.69x`, both rows marked
 * "content verified" and both carrying ZERO diagnostics — a like-for-like
 * ranking of two numbers that are not like for like. A caveat that lives only
 * in a source header is not a caveat, it is a comment.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { contentText, mergeHover, timed } from "../context.mjs";
import { positionOf, scaffold } from "../workspace.mjs";

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

export const PROBE_SYMBOL = "probeValue";
export const PLANTED_SYMBOL = "plantedTypeError";
export const PROP_SYMBOL = "label";

/** The value planted to break the type. Deliberately contains neither the word
 *  "string" nor "number": the diagnostic gate has a last-resort rule that
 *  accepts a message naming both types, and a value like
 *  `'string-into-number'` would satisfy it by accident. */
const PLANTED_BAD_VALUE = "'not-a-valid-value'";

const PROBE_DECL_BASE = `let ${PROBE_SYMBOL}: string = 'edit-loop-base'`;
const PROBE_DECL_RETYPED = `let ${PROBE_SYMBOL}: number = 7`;
const probeDeclSteady = (i) => `let ${PROBE_SYMBOL}: 'steady-${i}' = 'steady-${i}'`;

/**
 * One-line-per-slot on purpose: every variant has the same line count, so the
 * planted line stays where `positionOf` found it no matter which variant is in
 * the buffer.
 */
export function editSource(probeDecl, plantedInit) {
  return `<script setup lang="ts">
${probeDecl}

const ${PLANTED_SYMBOL}: number = ${plantedInit}
</script>

<template>
  <p class="probe">{{ ${PROBE_SYMBOL} }}</p>
  <p class="planted">{{ ${PLANTED_SYMBOL} }}</p>
</template>
`;
}

export const EDIT_BASE = editSource(PROBE_DECL_BASE, "1");
export const EDIT_BROKEN = editSource(PROBE_DECL_BASE, PLANTED_BAD_VALUE);
// Not identical to EDIT_BASE — a server that hashes document content must see a
// genuinely new revision, or "the fix landed" would be indistinguishable from
// "the edit was ignored".
export const EDIT_FIXED = editSource(PROBE_DECL_BASE, "2");
export const EDIT_RETYPED = editSource(PROBE_DECL_RETYPED, "2");
export const editSteady = (i) => editSource(probeDeclSteady(i), "2");

export const childSource = (propType) => `<script setup lang="ts">
defineProps<{ ${PROP_SYMBOL}: ${propType} }>()
</script>

<template>
  <span class="child-label">{{ ${PROP_SYMBOL} }}</span>
</template>
`;

export const CHILD_BASE = childSource("string");
export const CHILD_RETYPED = childSource("number");

/** `parentLabel` is a string, so `:label` is valid against `label: string` and
 *  invalid the moment Child's prop becomes `number`. */
export const PARENT_SOURCE = `<script setup lang="ts">
import Child from './Child.vue'

const parentLabel = 'parent-text'
</script>

<template>
  <Child :${PROP_SYMBOL}="parentLabel" />
</template>
`;

// ---------------------------------------------------------------------------
// Timing budget — identical for every server, no exceptions.
// ---------------------------------------------------------------------------

// Sized from MEASURED need, not from caution. On this corpus the servers that
// answer do so in:
//
//     didOpen -> first diagnostics     389 ms - 944 ms
//     edit -> diagnostic reported      385 ms / 433 ms / 558 ms
//     cross-file hover converge        447 ms
//
// The previous budgets were 20-50x that, and the cost was not hypothetical: a
// server that never publishes burns the WHOLE budget on every failing op, on
// every pass. Two such ops at 12s was ~36s of dead time per pass, i.e. ~3.6 of
// the 5.8 minutes this suite took at --runs 5.
//
// These are still 7-9x the slowest observed success, and remain IDENTICAL for
// every server — the point is to stop paying 20x for a known non-answer, not to
// make anything harder to pass. A server that legitimately needs longer should
// have these raised for everybody, with the measurement that justifies it.
const OPEN_DIAGNOSTICS_TIMEOUT_MS = 8_000;
const EDIT_DIAGNOSTICS_TIMEOUT_MS = 4_000;
const PULL_DIAGNOSTICS_TIMEOUT_MS = 4_000;
const HOVER_TIMEOUT_MS = 8_000;
/**
 * A diagnostics state must survive this long to count.
 *
 * Measured: Verter publishes an EMPTY diagnostics array within ~2ms of any
 * `didChange` and only then re-analyses (~20ms later it republishes the real
 * error). Without a stability window, "time until the error cleared" would be
 * timing that reflex rather than the re-check, and every fix would look
 * instant — including a fix that fixed nothing. This window is far longer than
 * the slowest observed analysis (~190ms, Volar) so a state that holds for it
 * has been through the server's checker.
 */
const DIAGNOSTICS_STABLE_MS = 600;
/** Fixed pause after opening the cross-file pair, so no server is measured
 *  mid-project-load. Applied identically to all. */
const CROSS_FILE_SETTLE_MS = 1_500;
const STEADY_EDITS = 10;
/**
 * Budget for re-asking a hover until it catches up with the edit.
 *
 * Measured: Verter answers the Parent hover with the PRE-edit prop type ~5ms
 * after Child.vue changed and with the new one ~450ms later, and its same-file
 * hover intermittently comes back EMPTY in the first milliseconds after a
 * `didChange`. A single strict hover reports both as ✗ with no sense of scale —
 * "wrong for 450ms" and "wrong forever" become the same row. Re-asking turns
 * the difference into a number.
 */
// 3s: the one server that converges does so in 447ms. The one that never
// reports the type burned the full 6s on every pass.
const HOVER_CONVERGE_TIMEOUT_MS = 3_000;
const HOVER_POLL_MS = 200;

// ---------------------------------------------------------------------------
// Content gates
// ---------------------------------------------------------------------------

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Tail guard for a type name in a hover payload.
 *
 * NOT `\b`. The precedent this repo already paid for: a gate matching
 * `/\bstring\b/` failed a server whose payload was
 * `let x: stringStable hover target…` — the correct type with a doc comment
 * concatenated onto it and no separator. There is no word boundary between `g`
 * and `S`, so a correct answer was scored as no answer. Allowing an uppercase
 * continuation accepts that formatting while still rejecting a genuinely
 * different type name like `numberish`.
 */
const TYPE_TAIL = "(?![a-z0-9_$])";

/**
 * Match `symbol: type` in a hover payload.
 *
 * Semantics, never substrings: the payload must associate the type WITH the
 * symbol. Servers disagree about the prefix — measured, the same fact is
 * rendered `(property) probeValue: number` (Volar), `let probeValue: number`
 * (Verter) and a bare `probeValue: number` (Vize) — so the pattern anchors on
 * the symbol and the colon and assumes nothing before it.
 *
 * String literal types are quote-agnostic: Volar and Verter print
 * `probeValue: "steady-5"`, Vize prints `probeValue: 'steady-5'`. Both are the
 * same type, and a gate that insisted on one quote style would fail a correct
 * server for punctuation.
 */
function typeMatcher(symbol, type) {
  const literal = /^(['"])([\s\S]*)\1$/.exec(type);
  const typeSrc = literal
    ? `['"]${escapeRe(literal[2])}['"]`
    : `${escapeRe(type)}${TYPE_TAIL}`;
  return new RegExp(`${escapeRe(symbol)}\\s*:\\s*${typeSrc}`);
}

/**
 * Same association, deliberately looser, for the type we must REJECT.
 *
 * A stale answer must not slip through on formatting, so the rejection pattern
 * drops the tail guard and the quote requirement. Over-matching here can only
 * fail a payload that already claims the pre-edit type for the probe symbol,
 * which is the thing being detected.
 */
function rejectMatcher(symbol, type) {
  const literal = /^(['"])([\s\S]*)\1$/.exec(type);
  const typeSrc = literal ? `['"]?${escapeRe(literal[2])}['"]?` : escapeRe(type);
  return new RegExp(`${escapeRe(symbol)}\\s*:\\s*${typeSrc}`);
}

/**
 * The hover gate: does this payload carry `expect` for `symbol`, and has it
 * stopped carrying `reject`?
 *
 * @param {string} text        flattened hover contents
 * @param {object} opts
 * @param {string} opts.symbol
 * @param {string} opts.expect type the server must now report
 * @param {string} [opts.reject] pre-edit type it must NOT still report
 */
export function classifyTypeHover(text, { symbol, expect, reject }) {
  const bytes = Buffer.byteLength(text ?? "", "utf8");
  if (!text) {
    return { ok: false, bytes, reason: `empty hover payload for \`${symbol}\`` };
  }
  if (reject && rejectMatcher(symbol, reject).test(text)) {
    return {
      ok: false,
      bytes,
      reason: `STALE: still reports \`${symbol}: ${reject}\` after the edit changed it to \`${expect}\``,
    };
  }
  if (!typeMatcher(symbol, expect).test(text)) {
    return {
      ok: false,
      bytes,
      reason: text.includes(symbol)
        ? `hover names \`${symbol}\` but carries no \`${expect}\` type for it`
        : `hover does not mention \`${symbol}\` at all — payload begins ${JSON.stringify(
            text.slice(0, 60),
          )}`,
    };
  }
  return { ok: true, bytes, reason: "" };
}

/**
 * Does this diagnostic look like an assignability failure?
 *
 * Written for three checkers that agree on nothing but the concept. Measured
 * payloads: Volar/tsserver `code: 2322` (number), Verter `code: "2322"`
 * (string) — hence the String() — both with TypeScript's wording. The last
 * clause is the escape hatch for a checker that words it differently: a message
 * that names BOTH the offending and the target type, at the right place, is the
 * planted error whatever the phrasing.
 */
export function looksLikeTypeMismatch(diagnostic) {
  const message = String(diagnostic?.message ?? "");
  if (String(diagnostic?.code ?? "") === "2322") return true;
  if (/not assignable|cannot be assigned|incompatible|mismatch/i.test(message)) return true;
  return /\bstring\b/i.test(message) && /\bnumber\b/i.test(message);
}

/**
 * Find the diagnostic that actually REFERENCES the planted error.
 *
 * "Diagnostics changed" is not a gate — a server that republished an unrelated
 * lint hint would pass it. The diagnostic must be tied to the planted edit,
 * either by covering its line or by naming its symbol, AND read as a type
 * mismatch. Both halves of that are needed: the location alone would accept an
 * unused-variable hint on the same line.
 */
export function findPlantedDiagnostic(diagnostics, { line, symbol }) {
  for (const d of diagnostics ?? []) {
    const start = d?.range?.start?.line;
    const end = d?.range?.end?.line ?? start;
    const coversLine = Number.isInteger(start) && start <= line && line <= end;
    const namesSymbol = symbol ? String(d?.message ?? "").includes(symbol) : false;
    if ((coversLine || namesSymbol) && looksLikeTypeMismatch(d)) return d;
  }
  return null;
}

/**
 * Compare file URIs by identity rather than by string.
 *
 * Not defensive tidying — without this the suite reports a flat lie. Measured:
 * the client sends `file:///C:/…/Edit.vue`; Vize and Verter echo it back
 * unchanged, but the tsserver half of Volar publishes its diagnostics as
 * `file:///c%3A/…/Edit.vue` — lowercase drive letter, percent-encoded colon,
 * same file. Keying on the raw string dropped every Volar diagnostic on the
 * floor, and the first full run of this suite duly reported that Volar
 * publishes nothing at all and detects neither the planted error nor the
 * cross-file break. It detects both, in about 170ms.
 */
export function normalizeUri(uri) {
  let s = String(uri ?? "");
  try {
    s = decodeURIComponent(s);
  } catch {
    // Malformed escape — compare what we were given rather than throwing.
  }
  return s.replace(
    /^(file:\/\/\/)([A-Za-z]):/,
    (_, prefix, drive) => `${prefix}${drive.toLowerCase()}:`,
  );
}

/** Compact, greppable rendering of a diagnostics array for the `sample` field. */
export function summarizeDiagnostics(diagnostics) {
  if (!diagnostics?.length) return "[]";
  return diagnostics
    .map(
      (d) =>
        `${d.source ?? "?"}:${d.code ?? "?"}@L${d.range?.start?.line ?? "?"} ${String(
          d.message ?? "",
        )
          .replace(/\s+/g, " ")
          .slice(0, 70)}`,
    )
    .join(" | ");
}

/**
 * Why is this server not producing type diagnostics?
 *
 * A server can initialize, answer every request and still have no type backend.
 * Vize drives tsgo out-of-process; when that bridge does not come up it says so
 * on stderr and in a hint-severity diagnostic, and then simply never reports a
 * type error. Without this the row would read "no diagnostic" with no cause.
 */
export function explainMissingTypeDiagnostics(diagnostics, stderr) {
  const disclaimed = (diagnostics ?? []).find((d) =>
    /type.?check\w*\s+(is\s+)?unavailable|typecheck-unavailable/i.test(
      `${d?.code ?? ""} ${d?.message ?? ""}`,
    ),
  );
  if (disclaimed) {
    return `server itself reports type checking unavailable (${disclaimed.code}: ${String(
      disclaimed.message ?? "",
    )
      .replace(/\s+/g, " ")
      .slice(0, 90)})`;
  }
  if (/corsa bridge (spawn failed|not available)/i.test(stderr ?? "")) {
    return "tsgo/Corsa backend never started (stderr: corsa bridge not available)";
  }
  return "";
}

// ---------------------------------------------------------------------------
// Diagnostics collection
// ---------------------------------------------------------------------------

/**
 * Merge `publishDiagnostics` from every half of the session.
 *
 * See note (a) in the file header for why one half is not enough. Each half's
 * latest array per uri is kept separately and concatenated on read, because a
 * half that publishes `[]` must not erase what the other half published.
 */
function createDiagnosticsBus(ctx) {
  const halves = [["server", ctx.client]];
  if (ctx.hybrid?.tsClient) halves.push(["tsserver", ctx.hybrid.tsClient]);

  const latest = new Map(); // `${half} ${uri}` -> diagnostics[]
  const publishes = new Map(); // uri -> count
  const waiters = new Set();

  // Every uri entering or leaving this bus goes through normalizeUri(), so a
  // half that renders the same file differently is still the same file.
  const merged = (rawUri) => {
    const uri = normalizeUri(rawUri);
    const out = [];
    for (const [half] of halves) out.push(...(latest.get(`${half} ${uri}`) ?? []));
    return out;
  };

  const onPublish = (half, params) => {
    if (!params?.uri) return;
    const uri = normalizeUri(params.uri);
    latest.set(`${half} ${uri}`, params.diagnostics ?? []);
    publishes.set(uri, (publishes.get(uri) ?? 0) + 1);
    for (const w of [...waiters]) {
      if (w.uri !== uri) continue;
      w.onPublish(merged(uri));
    }
  };

  for (const [half, client] of halves) {
    client.on("notification", (method, params) => {
      if (method === "textDocument/publishDiagnostics") onPublish(half, params);
    });
  }

  return {
    halves: halves.map(([h]) => h),
    merged,

    /**
     * Resolve when `test(mergedDiagnostics)` has held for `stableMs`.
     *
     * Returns `firstTrueAt`, the absolute moment the state FIRST became true —
     * the latency a developer feels. The caller subtracts its own start time,
     * so the stability window (and anything else this helper waits for) is
     * never charged to the measurement. A publish that breaks the predicate
     * during the window resets both the timestamp and the window.
     */
    wait(rawUri, test, { timeoutMs, stableMs = DIAGNOSTICS_STABLE_MS } = {}) {
      const uri = normalizeUri(rawUri);
      return new Promise((resolve) => {
        let firstTrueAt = null;
        let stableTimer = null;

        const finish = (timedOut) => {
          if (stableTimer) clearTimeout(stableTimer);
          clearTimeout(deadline);
          waiters.delete(waiter);
          resolve({
            diagnostics: merged(uri),
            firstTrueAt,
            timedOut,
            publishes: publishes.get(uri) ?? 0,
          });
        };

        const evaluate = (diagnostics) => {
          if (test(diagnostics)) {
            if (firstTrueAt == null) firstTrueAt = performance.now();
            if (!stableTimer) stableTimer = setTimeout(() => finish(false), stableMs);
          } else {
            firstTrueAt = null;
            if (stableTimer) {
              clearTimeout(stableTimer);
              stableTimer = null;
            }
          }
        };

        const waiter = { uri, onPublish: evaluate };
        waiters.add(waiter);
        const deadline = setTimeout(() => finish(true), timeoutMs);

        // Only consider the current state if the server has actually published
        // for this uri; an empty map is "nothing said yet", not "said nothing".
        if ((publishes.get(uri) ?? 0) > 0) evaluate(merged(uri));
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const SUITE = {
  id: "edit-loop",
  label: "Edit loop (type, wait, hover)",

  buildWorkspace(dir) {
    scaffold(dir);
    writeFileSync(join(dir, "Edit.vue"), EDIT_BASE);
    writeFileSync(join(dir, "Child.vue"), CHILD_BASE);
    writeFileSync(join(dir, "Parent.vue"), PARENT_SOURCE);
    return {
      dir,
      file: join(dir, "Edit.vue"),
      fileRel: "Edit.vue",
      source: EDIT_BASE,
      childFile: join(dir, "Child.vue"),
      parentFile: join(dir, "Parent.vue"),
      // Every position derived from the source. A hard-coded line number points
      // at whitespace the moment a fixture gains a line.
      probeTemplate: positionOf(EDIT_BASE, PROBE_SYMBOL, 2), // `{{ probeValue }}`
      plantedLine: positionOf(EDIT_BROKEN, PLANTED_SYMBOL, 1).line,
      propProbe: positionOf(PARENT_SOURCE, `${PROP_SYMBOL}=`, 1), // `:label=` in Parent
      propLine: positionOf(PARENT_SOURCE, `${PROP_SYMBOL}=`, 1).line,
    };
  },

  async measure(ctx) {
    const { ask, openDoc, changeDoc, client, ws, pathToFileUri } = ctx;
    const editUri = pathToFileUri(ws.file);
    const childUri = pathToFileUri(ws.childFile);
    const parentUri = pathToFileUri(ws.parentFile);

    // Installed before the first didOpen so no publish is missed.
    const bus = createDiagnosticsBus(ctx);
    const ops = [];
    let editVersion = 1;

    /**
     * Hover, never throwing. A request timeout is a result to gate on — an
     * exception would abort the whole run and the row would vanish instead of
     * saying what happened.
     */
    const hover = async (uri, position) => {
      try {
        return contentText(
          await ask(
            "textDocument/hover",
            { textDocument: { uri }, position },
            HOVER_TIMEOUT_MS,
            mergeHover,
          ),
        );
      } catch (e) {
        return `<<hover request failed: ${String(e.message).slice(0, 120)}>>`;
      }
    };

    /** Elapsed since `t0`, using the moment a wait's predicate first held. */
    const latency = (t0, waited) => (waited.firstTrueAt ?? performance.now()) - t0;

    /**
     * The Op contract caps `sample` at 200 chars. `timed()` applies that to the
     * ops it wraps; the hand-built ops in this suite have to do it themselves,
     * and Vize's hover payloads are 400+ bytes.
     */
    const evidence = (text) => String(text ?? "").slice(0, 200);

    /**
     * Ask for a hover once, immediately, then keep re-asking until it passes.
     *
     * Two numbers come out of one edit: what the editor would have SHOWN at the
     * first opportunity (`first*`, the staleness verdict) and how long the
     * server took to become right (`convergedMs`, the recovery). The repeated
     * requests mirror what an editor does after an edit — hover, inlay hints
     * and semantic tokens all re-fire — and every server gets the same interval
     * and the same budget.
     */
    const hoverUntil = async (uri, position, gate, start) => {
      const firstText = await hover(uri, position);
      const firstMs = performance.now() - start;
      const firstVerdict = gate(firstText);
      let attempts = 1;
      let convergedMs = firstVerdict.ok ? firstMs : null;
      let latestText = firstText;
      let latestVerdict = firstVerdict;
      while (convergedMs == null && performance.now() - start < HOVER_CONVERGE_TIMEOUT_MS) {
        await sleep(HOVER_POLL_MS);
        attempts++;
        latestText = await hover(uri, position);
        latestVerdict = gate(latestText);
        if (latestVerdict.ok) convergedMs = performance.now() - start;
      }
      return {
        firstText,
        firstMs,
        firstVerdict,
        attempts,
        convergedMs,
        // Captured here, not at op-construction time: anything awaited between
        // the loop and the op (the cross-file diagnostics wait is 12s) would
        // otherwise be charged to a hover that stopped being asked long before.
        endedMs: performance.now() - start,
        latestText,
        latestVerdict,
      };
    };

    /**
     * Why a hover verdict failed, in terms of what the SAME position answered
     * before the edit. Without this, "empty payload" reads the same whether the
     * server has no such feature or dropped the answer while digesting an edit.
     */
    const supportNote = (hadTypeBefore, priorType, converged) =>
      `${
        hadTypeBefore
          ? ` (the same position answered \`${priorType}\` before the edit, so the feature works here — this is the edit loop`
          : " (the same position carried no type before the edit either, so it is unsupported rather than stale"
      }${converged == null ? "; never caught up)" : `; caught up after ${Math.round(converged)}ms)`}`;

    // -- 1. didOpen -> first diagnostics -----------------------------------
    //
    // Push first, because that is the model every editor assumes. Only if
    // nothing arrives do we ask for a pull report — same request, same timeout,
    // for every server. Which model answered is recorded in `sample`, because
    // "this server has no diagnostics at all" is a finding, not an error.
    //
    // MEASURED BUT NOT RANKED — see the file header. The fixture is a VALID
    // file, so the correct first payload is `[]`, and no content gate can
    // separate "analysed, nothing wrong" from "published empty on open and
    // analysed afterwards". Ranking it rewards the latter.
    const OPEN_DIAGNOSTICS_RANKING_NOTE =
      "the fixture is a valid file, so the correct payload is empty and no gate can tell an analysed empty report from a server that publishes `[]` on open and analyses afterwards — the fastest number here can be the least work done. Read `Edit plants type error -> reported` and `Edit fixes it -> diagnostic clears`, which demand specific content, as the comparable diagnostics figures.";
    let diagnosticsModel = "none";
    let modelEvidence = "";

    ops.push(
      await timed("open-diagnostics", "didOpen -> first diagnostics", async () => {
        openDoc(editUri, EDIT_BASE);
        const push = await bus.wait(editUri, () => true, {
          timeoutMs: OPEN_DIAGNOSTICS_TIMEOUT_MS,
          stableMs: 0,
        });

        let report = push.timedOut ? null : push.diagnostics;
        if (report) {
          diagnosticsModel = "push";
          modelEvidence = `push: ${push.publishes} publish(es) across [${bus.halves.join(
            "+",
          )}] -> ${summarizeDiagnostics(report)}`;
        } else {
          try {
            const pulled = await client.sendRequest(
              "textDocument/diagnostic",
              { textDocument: { uri: editUri } },
              PULL_DIAGNOSTICS_TIMEOUT_MS,
            );
            report = pulled?.items ?? (Array.isArray(pulled) ? pulled : []);
            diagnosticsModel = "pull";
            modelEvidence = `push: none in ${OPEN_DIAGNOSTICS_TIMEOUT_MS}ms; pull textDocument/diagnostic -> ${summarizeDiagnostics(
              report,
            )}`;
          } catch (e) {
            diagnosticsModel = "none";
            modelEvidence = `push: none in ${OPEN_DIAGNOSTICS_TIMEOUT_MS}ms; pull textDocument/diagnostic -> ${String(
              e.message,
            ).slice(0, 120)}`;
          }
        }

        if (!report) {
          return { valid: false, reason: `no diagnostics by either model — ${modelEvidence}`, sample: modelEvidence };
        }
        // The fixture is valid TypeScript and a valid SFC. Anything the server
        // calls an ERROR here is the server being wrong about a correct file.
        const bogus = report.filter((d) => d.severity === 1);
        return {
          valid: bogus.length === 0,
          reason: bogus.length
            ? `reported ${bogus.length} error(s) on a valid file: ${summarizeDiagnostics(bogus)}`
            : "",
          sample: modelEvidence,
          artifact: report.length,
        };
      }).then((op) =>
        // `timed()` shapes the Op; whether the Op may be RANKED is the suite's
        // call, and this one may not be. The note travels with the record so
        // the report can publish the reason next to the number.
        Object.assign(op, {
          ranked: false,
          rankingNote: OPEN_DIAGNOSTICS_RANKING_NOTE,
        }),
      ),
    );

    // -- 2. edit introduces a type error -----------------------------------
    //
    // Built by hand rather than through `timed()`: the reported latency must be
    // the moment the diagnostic APPEARED, not the moment this code stopped
    // waiting. `timed()` would additionally charge every server the stability
    // window, which is longer than the fastest server's whole response.
    const hasPlanted = (diags) =>
      findPlantedDiagnostic(diags, { line: ws.plantedLine, symbol: PLANTED_SYMBOL }) != null;

    const breakStart = performance.now();
    changeDoc(editUri, EDIT_BROKEN, ++editVersion);
    const broke = await bus.wait(editUri, hasPlanted, {
      timeoutMs: EDIT_DIAGNOSTICS_TIMEOUT_MS,
    });
    const plantedHit = findPlantedDiagnostic(broke.diagnostics, {
      line: ws.plantedLine,
      symbol: PLANTED_SYMBOL,
    });
    const plantedWasReported = plantedHit != null;
    const missingCause = plantedWasReported
      ? ""
      : explainMissingTypeDiagnostics(broke.diagnostics, ctx.stderrTail?.() ?? "");

    ops.push({
      id: "diagnostics-error",
      label: "Edit plants type error -> reported",
      ms: latency(breakStart, broke),
      valid: plantedWasReported,
      reason: plantedWasReported
        ? ""
        : `no diagnostic referencing the planted error (\`${PLANTED_SYMBOL}\` at line ${ws.plantedLine}) ` +
          `in ${EDIT_DIAGNOSTICS_TIMEOUT_MS}ms across ${broke.publishes} publish(es) [model=${diagnosticsModel}]` +
          (missingCause ? ` — ${missingCause}` : ""),
      sample: evidence(
        plantedHit ? summarizeDiagnostics([plantedHit]) : summarizeDiagnostics(broke.diagnostics),
      ),
      artifact: broke.diagnostics.length,
    });

    // -- 3. edit fixes it --------------------------------------------------
    //
    // Same wait, inverted predicate. The verdict is NOT the same as the
    // predicate: a server that never reported the error satisfies "the error is
    // absent" vacuously, and crediting that would be scoring a server for
    // clearing something it never found.
    const fixStart = performance.now();
    changeDoc(editUri, EDIT_FIXED, ++editVersion);
    const fixed = await bus.wait(editUri, (diags) => !hasPlanted(diags), {
      timeoutMs: EDIT_DIAGNOSTICS_TIMEOUT_MS,
    });
    const stillBroken = findPlantedDiagnostic(fixed.diagnostics, {
      line: ws.plantedLine,
      symbol: PLANTED_SYMBOL,
    });

    ops.push({
      id: "diagnostics-cleared",
      label: "Edit fixes it -> diagnostic clears",
      ms: latency(fixStart, fixed),
      valid: plantedWasReported && stillBroken == null,
      reason: !plantedWasReported
        ? "the planted diagnostic was never reported, so its clearing cannot be measured — see the diagnostics-error row"
        : stillBroken
          ? `planted diagnostic still present ${EDIT_DIAGNOSTICS_TIMEOUT_MS}ms after the fix: ${summarizeDiagnostics([stillBroken])}`
          : "",
      sample: evidence(
        `after fix (${fixed.publishes} publish(es) for this file): ${summarizeDiagnostics(fixed.diagnostics)}`,
      ),
      artifact: fixed.diagnostics.length,
    });

    // -- 4. hover immediately after a type-changing edit -------------------
    //
    // The staleness detector. LSP messages are ordered on one stream, so a
    // server that has taken the didChange MUST answer the following hover from
    // the new buffer; a stale answer is a defect, not a race. The pre-edit
    // hover is captured (untimed) purely so the failure reason can distinguish
    // "answered with the old type" from "never had a type here at all".
    const preEditHover = await hover(editUri, ws.probeTemplate);
    const preEditHadType = classifyTypeHover(preEditHover, {
      symbol: PROBE_SYMBOL,
      expect: "string",
    }).ok;

    const retypeStart = performance.now();
    changeDoc(editUri, EDIT_RETYPED, ++editVersion);
    const retypeHover = await hoverUntil(
      editUri,
      positionOf(EDIT_RETYPED, PROBE_SYMBOL, 2),
      (text) => classifyTypeHover(text, { symbol: PROBE_SYMBOL, expect: "number", reject: "string" }),
      retypeStart,
    );

    ops.push({
      id: "hover-after-edit",
      label: "Hover after retype -> NEW type",
      ms: retypeHover.firstMs,
      valid: retypeHover.firstVerdict.ok,
      reason: retypeHover.firstVerdict.ok
        ? ""
        : retypeHover.firstVerdict.reason +
          supportNote(preEditHadType, "string", retypeHover.convergedMs),
      sample: evidence(retypeHover.firstText),
      artifact: retypeHover.firstVerdict.bytes,
    });

    ops.push({
      id: "hover-settled",
      label: "... same hover, time to correct",
      ms: retypeHover.convergedMs ?? retypeHover.endedMs,
      valid: retypeHover.convergedMs != null,
      reason:
        retypeHover.convergedMs != null
          ? ""
          : `hover never reported \`${PROBE_SYMBOL}: number\` within ${HOVER_CONVERGE_TIMEOUT_MS}ms ` +
            `across ${retypeHover.attempts} attempts — ${retypeHover.latestVerdict.reason}`,
      sample: evidence(retypeHover.latestText),
      artifact: retypeHover.attempts,
    });

    // -- 7/8. steady state --------------------------------------------------
    //
    // Ten successive edits, each one changing the probe's type to a value no
    // previous edit used, each followed by a hover that must report exactly
    // that value and explicitly not the previous one. A server lagging by one
    // edit fails every iteration instead of quietly returning plausible types.
    //
    // These two rows are built by hand rather than through `timed()` because
    // the number that matters is the MEDIAN of the per-edit latencies, not the
    // wall time of the loop.
    const steady = [];
    for (let i = 0; i < STEADY_EDITS; i++) {
      const text = editSteady(i);
      const expect = `'steady-${i}'`;
      const reject = i === 0 ? "number" : `'steady-${i - 1}'`;
      const t0 = performance.now();
      changeDoc(editUri, text, ++editVersion);
      const payload = await hover(editUri, positionOf(text, PROBE_SYMBOL, 2));
      const ms = performance.now() - t0;
      steady.push({ i, ms, expect, payload, verdict: classifyTypeHover(payload, { symbol: PROBE_SYMBOL, expect, reject }) });
    }

    const median = (nums) => {
      const s = [...nums].sort((a, b) => a - b);
      if (!s.length) return null;
      const mid = Math.floor(s.length / 2);
      return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    };
    const half = Math.floor(STEADY_EDITS / 2);
    const firstWindow = steady.slice(0, half);
    const lastWindow = steady.slice(half);
    const windowOp = (id, label, window, artifact) => {
      const bad = window.find((s) => !s.verdict.ok);
      return {
        id,
        label,
        ms: median(window.map((s) => s.ms)),
        valid: !bad,
        reason: bad ? `edit #${bad.i + 1}: ${bad.verdict.reason}` : "",
        sample: (bad ?? window[window.length - 1]).payload.slice(0, 200),
        artifact,
      };
    };
    const firstMedian = median(firstWindow.map((s) => s.ms));
    const lastMedian = median(lastWindow.map((s) => s.ms));
    ops.push(windowOp("steady-first", `Steady state: edits 1-${half} (median)`, firstWindow));
    ops.push(
      windowOp(
        "steady-last",
        `Steady state: edits ${half + 1}-${STEADY_EDITS} (median)`,
        lastWindow,
        Math.round(lastMedian - firstMedian),
      ),
    );

    // -- 5/6. cross-file invalidation --------------------------------------
    //
    // The hardest thing for a Vue LSP: Parent.vue's template is only wrong
    // because of an edit to a file it imports. Both rows are timed from the one
    // didChange to Child.vue, and the hover is issued first so that neither
    // measurement can be credited with work the other triggered.
    openDoc(childUri, CHILD_BASE);
    openDoc(parentUri, PARENT_SOURCE);
    await bus.wait(parentUri, () => true, {
      timeoutMs: OPEN_DIAGNOSTICS_TIMEOUT_MS,
      stableMs: 0,
    });
    await sleep(CROSS_FILE_SETTLE_MS);

    const prePropHover = await hover(parentUri, ws.propProbe);
    const prePropHadType = classifyTypeHover(prePropHover, {
      symbol: PROP_SYMBOL,
      expect: "string",
    }).ok;
    const preParentDiagnostics = bus.merged(parentUri);

    const crossFileStart = performance.now();
    changeDoc(childUri, CHILD_RETYPED, 2);
    // Registered before the hover is issued, so a publish that lands DURING the
    // hover is timed at the moment it landed rather than at the moment this
    // code got round to asking.
    const parentDiagPending = bus.wait(
      parentUri,
      (diags) => findPlantedDiagnostic(diags, { line: ws.propLine, symbol: PROP_SYMBOL }) != null,
      { timeoutMs: EDIT_DIAGNOSTICS_TIMEOUT_MS },
    );

    const propHover = await hoverUntil(
      parentUri,
      ws.propProbe,
      (text) => classifyTypeHover(text, { symbol: PROP_SYMBOL, expect: "number", reject: "string" }),
      crossFileStart,
    );

    const parentDiag = await parentDiagPending;
    const parentHit = findPlantedDiagnostic(parentDiag.diagnostics, {
      line: ws.propLine,
      symbol: PROP_SYMBOL,
    });
    const parentCause = explainMissingTypeDiagnostics(
      parentDiag.diagnostics,
      ctx.stderrTail?.() ?? "",
    );

    ops.push({
      id: "xfile-diagnostics",
      label: "Child prop retype -> Parent diagnostic",
      ms: latency(crossFileStart, parentDiag),
      valid: parentHit != null,
      reason: parentHit
        ? ""
        : `Parent.vue never reported the now-invalid \`:${PROP_SYMBOL}\` binding (line ${ws.propLine}) ` +
          `in ${EDIT_DIAGNOSTICS_TIMEOUT_MS}ms; ${parentDiag.publishes} publish(es) for Parent.vue ` +
          `since the session began, ${bus.merged(parentUri).length} diagnostic(s) now` +
          (parentCause ? ` — ${parentCause}` : ""),
      sample: evidence(
        `before: ${summarizeDiagnostics(preParentDiagnostics)} || after: ${summarizeDiagnostics(
          parentDiag.diagnostics,
        )}`,
      ),
      artifact: parentDiag.diagnostics.length,
    });

    ops.push({
      id: "xfile-hover",
      label: "Child prop retype -> Parent hover",
      ms: propHover.firstMs,
      valid: propHover.firstVerdict.ok,
      reason: propHover.firstVerdict.ok
        ? ""
        : propHover.firstVerdict.reason +
          supportNote(prePropHadType, "string", propHover.convergedMs),
      sample: evidence(propHover.firstText),
      artifact: propHover.firstVerdict.bytes,
    });

    ops.push({
      id: "xfile-hover-settled",
      label: "... Parent hover, time to correct",
      ms: propHover.convergedMs ?? propHover.endedMs,
      valid: propHover.convergedMs != null,
      reason:
        propHover.convergedMs != null
          ? ""
          : `hover never reported \`${PROP_SYMBOL}: number\` within ${HOVER_CONVERGE_TIMEOUT_MS}ms ` +
            `across ${propHover.attempts} attempts — ${propHover.latestVerdict.reason}`,
      sample: evidence(propHover.latestText),
      artifact: propHover.attempts,
    });

    return ops;
  },
};
