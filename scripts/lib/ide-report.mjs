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
 */

/** An operation whose gate failed is measured but never ranked. */
function statusOf(op) {
  if (op.valid === false) return "unranked";
  return Number.isFinite(op.medianMs) ? "ok" : "error";
}

function noteFor(op) {
  const bits = [];
  if (op.valid === false) {
    bits.push(`⚠ FAILED VALIDATION — ${op.reason}`);
    if (op.sample) bits.push(`Sample: ${JSON.stringify(String(op.sample).slice(0, 160))}`);
  } else if (op.valid === true) {
    bits.push("content verified");
  }
  return bits.join(" | ");
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
        const op = (row.ops ?? []).find((o) => o.id === id);
        if (!op) {
          return {
            id: `${row.server}-${id}`,
            label: row.label ?? row.server,
            status: row.error ? "error" : "skipped",
            threading: "lsp",
            invocation: "lsp",
            notes: row.error ? `session failed: ${row.error}` : "operation not reported",
            error: row.error,
          };
        }
        return {
          id: `${row.server}-${id}`,
          label: row.label ?? row.server,
          status: statusOf(op),
          medianMs: op.medianMs,
          minMs: op.minMs,
          stddevMs: op.stddevMs,
          cvPct: op.cvPct,
          runs: op.runs,
          artifactMedian: Number.isFinite(op.artifact) ? op.artifact : undefined,
          artifactLabel: "Artifact",
          // Informational on purpose. Across these operations the artifact is
          // sometimes a payload size, sometimes an item count, sometimes a
          // ratio — "produced less than the biggest" is only a work signal for
          // the first kind, so a blanket warning would scold correct servers.
          // The per-operation gates already judge whether the answer was right.
          artifactPolarity: "informational",
          threading: "lsp",
          invocation: "lsp",
          throughput: "n/a",
          notes: noteFor(op),
        };
      }),
    }));

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
    const found = parts.map((p) => {
      const row = results.find((r) => r.server === server && r.suite === p.suite);
      // `opId` deliberately, not `op`: spreading `p` and then assigning `op`
      // overwrote the id string with the looked-up object, so the
      // missing-component message printed `suite/undefined` — the one branch
      // where the id is the only information the reader has.
      return { ...p, opId: p.op, op: (row?.ops ?? []).find((o) => o.id === p.op) };
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
        notes: `not measured: ${missing.map((m) => `${m.suite}/${m.opId}`).join(", ")} absent from this run`,
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
      stddevMs: 0,
      cvPct: null,
      threading: "lsp",
      invocation: "lsp",
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
    ],
  };
}
