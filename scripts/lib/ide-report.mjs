/**
 * Turn IDE operation results into report surfaces.
 *
 * Ranking is PER OPERATION, never pooled. `didOpen→diagnostics` and
 * `foldingRange` differ by three orders of magnitude and answer unrelated
 * questions; a single "IDE score" would be dominated by whichever operation
 * happened to be slowest and would hide the only thing that matters — that a
 * server is fast at one job and absent at another. So each operation becomes
 * its own group with its own table, reusing the existing renderer and therefore
 * the existing unranked-in-brackets treatment, artifact census and CV% guard.
 *
 * On top of that sits ONE composite, the typing loop, because a developer does
 * not experience these operations separately.
 *
 * TWO KINDS OF ROW DO NOT CARRY A RANKED DURATION, and both are rendered with
 * an empty Median column on purpose rather than being dropped or invented:
 *
 *   - a RATIO row (scale's `Scale × … 20→500`), whose measurement is a factor
 *     and not a duration; it lands in the artifact column;
 *   - an op the suite declares `ranked: false`, because the operation cannot be
 *     compared like for like however carefully it is timed. The measurement is
 *     still published — in the row note and in the raw-runs list — it simply
 *     never enters the `vs fastest` column.
 */

import { resolveToolEngine } from "./tsgo.mjs";

/**
 * A ratio-style operation reports a FACTOR, not a duration.
 *
 * `scalingOps()` sets `ms: null` deliberately and puts the 20→500 factor in
 * `artifact`. Mapping "no median" to `error` printed those four headline rows
 * as `| Vize LSP | error | n/a | … |` and blanked the artifact column, which is
 * the only cell they fill — the suite's whole conclusion rendered as a failure.
 */
function isRatioOp(op) {
  return !Number.isFinite(op.medianMs) && op.valid === true && Number.isFinite(op.artifact);
}

/** An operation the suite itself declares uncomparable (see `rankingNote`). */
function isUnrankedByDesign(op) {
  return op.ranked === false;
}

/**
 * Why is there no row for this operation, and what does that NOT mean?
 *
 * "operation not reported" answered neither question. A reader seeing it next
 * to a competitor's timing cannot tell whether the server refuses the request
 * or whether this harness never asked — and those are opposite conclusions
 * about the tool.
 *
 * The load-bearing fact is that IN THIS HARNESS A SERVER THAT DOES NOT
 * IMPLEMENT AN OPERATION STILL GETS A ROW. Every suite pushes its ops
 * unconditionally; an unimplemented LSP method comes back as JSON-RPC -32601
 * and is recorded as a row that FAILED ITS GATE naming that code (see
 * `suites/background.mjs`), and `suites/scale.mjs` emits explicit placeholder
 * rows for sizes it stops measuring rather than dropping them. So an ABSENT op
 * is always a harness-side condition and never evidence about the tool, and
 * the note has to say so rather than leave the reader to guess.
 *
 * Within "harness-side" the data supports four distinct causes, so each is
 * named instead of being flattened into one string:
 *
 *   - the suite was not run for this server at all (no result row);
 *   - the session for this suite failed outright (`row.error`), which is why
 *     none of its operations exist;
 *   - the session completed but the suite returned no operations at all;
 *   - the suite returned other operations and simply never produced this id.
 *
 * The first two are self-explanatory; the last two are the ones a reader could
 * misread as the server refusing the request, so those carry the disclaimer.
 */
const NOT_A_CAPABILITY_CLAIM =
  "This is NOT a statement that the server lacks the capability: an unimplemented method is reported as a row that failed its gate (JSON-RPC -32601), never as an absent one.";

/** The cause clause alone, shared by the per-operation tables and the composite. */
function missingOpCause(row, opId) {
  if (!row) return "that suite was not run for this server";
  const suite = row.suite ?? "this";
  if (row.error) {
    return `the ${suite} session failed before any result was collected (${row.error})`;
  }
  const reported = row.ops?.length ?? 0;
  if (reported === 0) {
    return `the ${suite} session completed but returned no operations at all`;
  }
  return `the ${suite} suite reported ${reported} other operation${
    reported === 1 ? "" : "s"
  } for this server but never produced \`${opId}\``;
}

/** True when the absence could be misread as the server refusing the request. */
function needsCapabilityDisclaimer(row) {
  return Boolean(row) && !row.error;
}

function missingOpNote(row, opId) {
  const disclaimer = needsCapabilityDisclaimer(row) ? ` ${NOT_A_CAPABILITY_CLAIM}` : "";
  return `⚠ NOT MEASURED (harness) — ${missingOpCause(row, opId)}.${disclaimer}`;
}

/** An operation whose gate failed is measured but never ranked. */
function statusOf(op) {
  if (op.valid === false) return "unranked";
  // `ok` here means "this row is reported normally", not "this row has a time":
  // a ratio row has no time by design and the renderer prints n/a for it, which
  // is the honest cell. Fabricating a duration to fill it is the one thing this
  // must never do.
  if (Number.isFinite(op.medianMs) || isRatioOp(op)) return "ok";
  return "error";
}

function noteFor(op) {
  const bits = [];
  if (op.valid === false) {
    bits.push(`⚠ FAILED VALIDATION — ${op.reason}`);
    if (op.sample) bits.push(`Sample: ${JSON.stringify(String(op.sample).slice(0, 160))}`);
  } else if (op.valid === true) {
    bits.push("content verified");
  }
  if (isRatioOp(op)) {
    // The value is a factor; say so on the row, and show the pair it came from
    // (`sample` is `"12.3 ms → 48.5 ms"`) so nobody reads it as a duration.
    bits.push(
      `scale factor ×${op.artifact}${op.sample ? ` (${op.sample})` : ""} — a ratio, not a duration, so the median column is empty by design`,
    );
  } else if (isUnrankedByDesign(op)) {
    // The measurement is published in full — median, min and the noise guard —
    // just never in a column that ranks it. Withholding the number would be a
    // different dishonesty from ranking it.
    bits.push(
      `NOT RANKED (informational) — measured ${fmtMs(op.medianMs)}${
        Number.isFinite(op.minMs) && op.minMs !== op.medianMs ? `, min ${fmtMs(op.minMs)}` : ""
      }${Number.isFinite(op.cvPct) ? `, CV ${op.cvPct.toFixed(1)}%` : ""}: ${
        op.rankingNote ?? "this operation is not comparable across servers"
      }`,
    );
  }
  return bits.join(" | ");
}

function fmtMs(ms) {
  if (!Number.isFinite(ms)) return "n/a";
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(1)} ms`;
}

/**
 * Which TypeScript engine answers this server's semantic questions?
 *
 * Same fairness axis the typecheck surface applies, for the same reason: Volar
 * on the stock JavaScript tsdk and Volar on the tsgo (TNB) tsdk are the SAME
 * Vue layer differing only in engine, so ranking them against each other
 * measures TypeScript's Go rewrite rather than anything about the server. The
 * engine is resolved by `resolveToolEngine()` — the function that classifies
 * the very same tools on the typecheck surface — so the two surfaces cannot
 * drift apart:
 *
 *   volar     → the tsdk is the repo's `typescript/lib`  → JS engine
 *   volar-tnb → the tsdk is envs/tnb typescript-native-bridge → tsgo
 *   vize      → drives its own bundled tsgo (Corsa)      → tsgo
 *   verter    → driven through VERTER_TSGO_BIN           → tsgo
 *
 * A server whose type backend did not actually start still carries its declared
 * engine here; that condition is reported separately and loudly on every one of
 * its rows (`⚠ BACKEND FALLBACK`), which is where a reader must see it.
 */
const ENGINE_PEER = {
  volar: "vue-tsc",
  "volar-tnb": "vue-tsc-tnb",
  vize: "vize-check",
  verter: "verter-tsc",
};

const engineCache = new Map();

export function engineForServer(serverId) {
  if (!engineCache.has(serverId)) {
    const peer = ENGINE_PEER[serverId];
    let resolved = { engine: "unknown", label: "unknown engine" };
    if (peer) {
      try {
        resolved = resolveToolEngine(peer);
      } catch {
        // Never let engine detection break a report; an unknown engine is its
        // own comparison class, which errs towards not comparing.
      }
    }
    engineCache.set(serverId, resolved);
  }
  return engineCache.get(serverId);
}

/**
 * @param {Array<{suite:string, server:string, label:string, ops:Array, error?:string}>} results
 * @returns {Array<object>} one surface per suite, one group per operation
 */
export function buildIdeSurfaces(results) {
  const bySuite = new Map();
  for (const r of results) {
    if (!bySuite.has(r.suite)) bySuite.set(r.suite, []);
    bySuite.get(r.suite).push(r);
  }

  const surfaces = [];
  for (const [suiteId, rows] of bySuite) {
    // Operation order is taken from the first server that produced any, so the
    // report follows the suite's own narrative order rather than alphabetical.
    const opOrder = [];
    for (const row of rows) {
      for (const op of row.ops ?? []) {
        if (!opOrder.some((o) => o.id === op.id)) opOrder.push({ id: op.id, label: op.label });
      }
    }

    const groups = opOrder.map(({ id, label }) => ({
      label,
      variants: rows.map((row) => {
        const engine = engineForServer(row.server);
        const op = (row.ops ?? []).find((o) => o.id === id);
        if (!op) {
          return {
            id: `${row.server}-${id}`,
            label: row.label ?? row.server,
            status: row.error ? "error" : "skipped",
            threading: "lsp",
            invocation: "lsp",
            engine: engine.engine,
            notes: missingOpNote(row, id),
            error: row.error,
          };
        }
        // A row that carries no ranked duration — a ratio, or an operation the
        // suite declared uncomparable — keeps its timing OUT of the ranked
        // columns. The number is not hidden: it is stated in the note and, for
        // a real measurement, still listed under Raw runs.
        const ranked = !isRatioOp(op) && !isUnrankedByDesign(op);
        const timing = ranked
          ? {
              medianMs: op.medianMs,
              minMs: op.minMs,
              stddevMs: op.stddevMs,
              cvPct: op.cvPct,
            }
          : {};
        return {
          id: `${row.server}-${id}`,
          label: row.label ?? row.server,
          status: statusOf(op),
          ...timing,
          runs: op.runs?.length ? op.runs : undefined,
          artifactMedian: Number.isFinite(op.artifact) ? op.artifact : undefined,
          // The suite names its own artifact when it is not a plain census —
          // the scale rows put a 20→500 factor there, and a column headed
          // "Artifact" invites reading it as a payload size.
          artifactLabel: op.artifactLabel ?? "Artifact",
          // Engines are ranked in separate tables — see engineForServer().
          engine: engine.engine,
          // Informational on purpose. Across these operations the artifact is
          // sometimes a payload size, sometimes an item count, sometimes a
          // ratio — "produced less than the biggest" is only a work signal for
          // the first kind, so a blanket warning would scold correct servers.
          // The per-operation gates already judge whether the answer was right.
          artifactPolarity: "informational",
          threading: "lsp",
          invocation: "lsp",
          throughput: "n/a",
          // The backend-fallback warning goes on EVERY row for that server, not
          // just the ones that failed. A server whose type backend never
          // started is fast on the operations it still answers, and those are
          // exactly the rows where the reader needs to know why.
          notes: [
            noteFor(op),
            row.backendFallback && `⚠ BACKEND FALLBACK — ${row.backendFallback}`,
            `engine: ${engine.label}`,
          ]
            .filter(Boolean)
            .join(" | "),
        };
      }),
    }));

    // Caveats the SUITES declared, carried into the published methodology. The
    // hazard on `didOpen → first diagnostics` was documented in the suite's own
    // header for months and never reached a reader of the report.
    const allOps = rows.flatMap((r) => r.ops ?? []);
    const rankingNotes = [
      ...new Set(
        allOps
          .filter(isUnrankedByDesign)
          .map(
            (op) =>
              `\`${op.label}\` is MEASURED BUT NOT RANKED: ${
                op.rankingNote ?? "this operation is not comparable across servers"
              } Its median column is empty by design; the measured time is in the row's note and under Raw runs.`,
          ),
      ),
    ];
    const ratioNote = allOps.some(isRatioOp)
      ? [
          "Rows whose value is a RATIO (`Scale × …`) have an empty median by design: the measurement is a factor, not a duration, and it is printed in the artifact column with the pair it came from. A ratio row is never given an invented time so that it can be ranked.",
        ]
      : [];
    const engineNote = [
      `Rows share one table across TypeScript engines; rows tagged (JS) run the JavaScript compiler — ${[
        ...new Set(rows.map((r) => `${r.label ?? r.server} = ${engineForServer(r.server).label}`)),
      ].join(
        "; ",
      )}. Volar on the stock JavaScript tsdk and Volar on the tsgo tsdk are the same Vue layer differing only in engine, so a cross-engine ratio measures TypeScript's Go rewrite as much as the server. Same axis, same resolver as the typecheck surface.`,
    ];

    surfaces.push({
      id: `ide-${suiteId}`,
      label: `IDE · ${rows[0]?.suiteLabel ?? suiteId}`,
      files: 1,
      bytes: 0,
      groups,
      groupingNote:
        "Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.",
      methodology: [
        "Every operation carries a content gate; the timing is only ranked when the answer was verified correct.",
        ...rankingNotes,
        ...ratioNote,
        ...engineNote,
        "Volar is measured as the two-process product it is: both halves are asked in parallel and the pair is charged the slower leg.",
        "A rejected leg counts as `no answer from this provider`, not as a failure of the pair — Volar's Vue half legitimately rejects methods it does not implement, and an editor routes those to the TypeScript half.",
        "Document URIs are compared normalised, never by string equality: the same file arrives percent-encoded and with a different drive-letter case from different servers.",
        "Each suite builds its own purpose-built workspace with an identical tsconfig, strictTemplates, the @vue/typescript-plugin tsserver entry, and Vize's opt-in Corsa/tsgo switches enabled.",
        "Fresh server process per run; warmups are discarded.",
      ],
    });
  }
  return surfaces;
}

/**
 * The composite: what one edit-and-look-at-it cycle costs.
 *
 * A developer does not experience `didChange→diagnostics`, hover and completion
 * separately — they type, wait for the squiggle, hover the thing, and complete
 * the next token. The composite is the SUM of those three medians.
 *
 * It is deliberately strict: a server is ranked only if it passed the gate on
 * EVERY component. Summing a server's fast hover with a diagnostics number it
 * never earned would invent a figure that flatters exactly the servers that do
 * least, which is the failure mode this whole harness exists to prevent.
 */
const LOOP_PARTS = [
  { suite: "edit-loop", op: "diagnostics-error", label: "edit → diagnostic" },
  { suite: "edit-loop", op: "hover-after-edit", label: "hover after edit" },
  { suite: "completion", op: "completion-script-member", label: "completion" },
];

export function buildTypingLoopSurface(results, { parts = LOOP_PARTS } = {}) {
  const servers = [...new Set(results.map((r) => r.server))];
  const variants = [];

  for (const server of servers) {
    const label = results.find((r) => r.server === server)?.label ?? server;
    // Same engine axis as the per-operation tables: a composite built from
    // JS-engine components is not comparable to one built from tsgo components.
    const engine = engineForServer(server).engine;
    const found = parts.map((p) => {
      const row = results.find((r) => r.server === server && r.suite === p.suite);
      // `opId` deliberately, not `op`: spreading `p` and then assigning `op`
      // overwrote the id string with the looked-up object, so the
      // missing-component message printed `suite/undefined` — the one branch
      // where the id is the only information the reader has.
      return { ...p, opId: p.op, row, op: (row?.ops ?? []).find((o) => o.id === p.op) };
    });

    const missing = found.filter((f) => !f.op);
    const failed = found.filter((f) => f.op && f.op.valid === false);

    if (missing.length) {
      variants.push({
        id: `${server}-typing-loop`,
        label,
        status: "skipped",
        threading: "lsp",
        invocation: "lsp",
        engine,
        // Same rule as the per-operation tables: name WHY the component is
        // absent, and say what its absence does not prove. A composite the
        // reader cannot attribute reads as though the server failed at it.
        notes: `⚠ NOT MEASURED (harness) — ${missing
          .map((m) => `${m.suite}/${m.opId}: ${missingOpCause(m.row, m.opId)}`)
          .join("; ")}.${
          missing.some((m) => needsCapabilityDisclaimer(m.row)) ? ` ${NOT_A_CAPABILITY_CLAIM}` : ""
        }`,
      });
      continue;
    }

    const total = found.reduce((sum, f) => sum + (f.op.medianMs ?? 0), 0);
    const breakdown = found
      .map((f) => `${f.label}=${(f.op.medianMs ?? 0).toFixed(0)}ms${f.op.valid === false ? " ✗" : ""}`)
      .join(" · ");

    if (failed.length) {
      variants.push({
        id: `${server}-typing-loop`,
        label,
        status: "unranked",
        medianMs: total,
        minMs: total,
        threading: "lsp",
        invocation: "lsp",
        engine,
        notes: `⚠ FAILED VALIDATION — ${failed.length} of ${parts.length} components failed their gate (${failed.map((f) => f.label).join(", ")}); the sum is shown for reference only. ${breakdown}`,
      });
      continue;
    }

    variants.push({
      id: `${server}-typing-loop`,
      label,
      status: "ok",
      medianMs: total,
      minMs: total,
      // The composite is a SUM OF THREE MEDIANS, not a series — it has no
      // samples of its own, so it has no dispersion. `0` would have read as a
      // perfectly reproducible measurement; both cells print n/a.
      stddevMs: null,
      cvPct: null,
      threading: "lsp",
      invocation: "lsp",
      engine,
      throughput: "n/a",
      notes: `all components verified · ${breakdown}`,
    });
  }

  return {
    id: "ide-typing-loop",
    label: "IDE · Typing loop (composite)",
    files: 1,
    bytes: 0,
    variants,
    methodology: [
      `Sum of three medians: ${parts.map((p) => `${p.suite}/${p.op}`).join(" + ")}.`,
      "Measured in separate sessions and added, NOT observed as one continuous cycle — it is an indicative cost of one edit-and-look cycle, not a single stopwatch reading.",
      "A server is ranked only if it passed the content gate on every component. Adding a fast hover to a diagnostics number the server never earned would flatter exactly the servers that do the least work.",
      "Servers that failed a component are shown in brackets with the failing part named.",
      "Composites share one table across TypeScript engines with (JS)-tagged rows, exactly as the per-operation tables do — a JS-engine composite against a tsgo composite is an engine comparison, not a server comparison.",
    ],
  };
}
