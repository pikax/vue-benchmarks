/**
 * Ranking and rendering for the VS Code E2E surface.
 *
 * Split out of run.mjs so the rules that decide WHICH ROWS RANK can be tested
 * without launching Electron — see tests/harness/e2e-vscode-report.test.mjs.
 * While it lived inline, the table sorted every row it was handed by
 * `primaryMs` and printed it as a result, with nothing in between.
 *
 * The convention for a row that was measured but must not rank is NOT invented
 * here. It is the one scripts/lib/report.mjs already uses for every other
 * surface: status `⚠ failed validation`, the measured time in brackets, no
 * comparison, and the reason spelled out in Notes. Same words, same shape, so a
 * reader who has seen one table can read this one.
 */

/**
 * Number formatting for this surface — unchanged from the original inline
 * renderer so published tables stay comparable across the change.
 */
export function fmt(ms) {
  if (ms == null || !Number.isFinite(ms)) return "n/a";
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(0)} ms`;
}

/** Bracket a measured-but-not-comparable cell. Leaves "n/a" alone. */
function bracket(cell) {
  return cell === "n/a" ? "n/a" : `(${cell})`;
}

function escapeCell(text) {
  return String(text ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

/**
 * Decide whether one result row may be ranked, and say why not when it may not.
 *
 * Three independent reasons a row is measured but unranked. Each one existed as
 * a published number before this gate:
 *
 *  1. NO ANSWER. `hoverColdCount === 0` means the hover provider returned
 *     nothing at all, and the row still carried a `primaryMs` that ranked. All
 *     three nuxt-ui rows were like this: the fastest "hover" in the table was
 *     the one that answered nothing, fastest. Timing a null answer measures how
 *     quickly a server can decline.
 *
 *  2. NO GATE. The workspace has no planted marker, so no hover at that
 *     position has a known-correct answer and nothing can be validated. Honest
 *     outcome: measured, not ranked, reason stated. (Real cloned projects are
 *     in this class — see findFallbackPosition in suite/probe-positions.cjs.)
 *
 *  3. FAILED GATE. The hover answered, and the answer was wrong. Both halves
 *     are required, as on the LSP surface: the script position must carry a
 *     TypeScript type, and the template position must carry the auto-unwrapped
 *     one. A server that returns `Ref<...>` inside `{{ }}` handed back the
 *     `<script setup>` type without modelling the template — it can do that
 *     much faster than modelling it, which is exactly why its latency is not
 *     comparable to a server that did the work.
 *
 * @param {object} row parsed result JSON
 * @returns {{status: "ok"|"unranked"|"error", reasons: string[]}}
 */
export function classifyRow(row) {
  if (!row || row.status === "error" || !row.phases) {
    return { status: "error", reasons: row?.error ? [row.error] : [] };
  }

  const p = row.phases;
  const reasons = [];

  if (!Number.isFinite(row.primaryMs)) {
    reasons.push("no primary measurement recorded");
  }

  if (p.hoverColdCount === 0) {
    // Deliberately suppresses the gate reasons below: with no payload the gate
    // can only report "empty", which says less than this does.
    reasons.push(
      "hover returned no result — a timed null answer is not a measurement of hover",
    );
  } else {
    const gate = row.gate;
    if (!gate || gate.applicable === false) {
      reasons.push(
        gate?.reason ||
          "no correctness gate at this probe position — the workspace has no planted marker, so there is no known-correct answer to validate against",
      );
    } else {
      if (gate.template && !gate.template.ok) {
        reasons.push(`template hover: ${gate.template.reason}`);
      }
      if (gate.script && !gate.script.ok) {
        reasons.push(`script hover: ${gate.script.reason}`);
      }
    }
  }

  return reasons.length > 0 ? { status: "unranked", reasons } : { status: "ok", reasons: [] };
}

/**
 * Activate cell.
 *
 * `already-active` renders as n/a and never as a duration. See activateSubject
 * in suite/measure.cjs for why 0 was a lie rather than a fast result.
 */
export function activateCell(p = {}) {
  switch (p.activateOutcome) {
    case "already-active":
      return "n/a (pre-activated)";
    case "no-extension":
      return "n/a";
    case "measured":
      return fmt(p.activateMs);
    default:
      return fmt(p.activateMs);
  }
}

/**
 * Diagnostics cell. Only `measured` produces a duration; the other outcomes say
 * what happened instead of borrowing a number that would read as one.
 */
export function diagnosticsCell(p = {}) {
  // `·<n>` rather than `(<n>)`: an unranked row wraps every cell in brackets,
  // and a parenthesised count nested inside those reads as `(96 ms (2))`.
  const n = Number.isFinite(p.diagnosticsCount) ? ` · ${p.diagnosticsCount}` : "";
  switch (p.diagnosticsOutcome) {
    case "measured":
      return `${fmt(p.diagnosticsWaitMs)}${n}`;
    case "pre-open":
      return `n/a — published before open${n}`;
    case "timeout":
      return `none in ${fmt(p.diagnosticsTimeoutMs)}`;
    default:
      return fmt(p.diagnosticsWaitMs);
  }
}

const COLUMNS =
  "| Extension | Status | Activate | Open | Diag first publish · n | Hover cold | Hover warm | Completion | Definition | Notes |";
const ALIGN = "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |";

function renderRow(row, verdict) {
  const label = escapeCell(row.label);

  if (verdict.status === "error") {
    return `| ${label} | error | n/a | n/a | n/a | n/a | n/a | n/a | n/a | ${escapeCell(
      row.error || row.notes,
    )} |`;
  }

  const p = row.phases || {};
  const cells = [
    activateCell(p),
    fmt(p.openDocumentMs),
    diagnosticsCell(p),
    fmt(p.hoverColdMs),
    fmt(p.hoverWarmMedianMs),
    fmt(p.completionMs),
    fmt(p.definitionMs),
  ];

  if (verdict.status === "unranked") {
    // Measured but not comparable: every timing cell is bracketed so no column
    // of this row can be read against a ranked one, and the reason is stated.
    // Same convention as scripts/lib/report.mjs.
    return `| ${label} | ⚠ failed validation | ${cells
      .map(bracket)
      .join(" | ")} | ${escapeCell(verdict.reasons.join("; "))} |`;
  }

  return `| ${label} | ok | ${cells.join(" | ")} | ${escapeCell(row.notes || "")} |`;
}

/**
 * Sort key. Ranked rows first by measured hover-cold; unranked rows after them,
 * still ordered by their own measurement so the table is stable; errors last.
 */
function sortKey(entry) {
  const tier = entry.verdict.status === "ok" ? 0 : entry.verdict.status === "unranked" ? 1 : 2;
  const ms = Number.isFinite(entry.row.primaryMs) ? entry.row.primaryMs : Number.POSITIVE_INFINITY;
  return [tier, ms];
}

export const METHODOLOGY = [
  "VS Code launched headless via `@vscode/test-electron` (stable channel).",
  "One subject extension per run in an isolated extensions directory.",
  "Workspaces: regular (single app), monorepo (shared package + app), optional real Nuxt UI clone.",
  "Primary ranking metric: the first `vscode.executeHoverProvider` after open, taken at the `{{ benchMarker }}` TEMPLATE position (hover cold).",
  "**Hover content is gated, and a row must pass to be ranked.** The same probe the LSP surface uses: `benchMarker` is `Ref<string>` in `<script setup>` and `string` inside `{{ }}` because Vue auto-unwraps refs in templates. Both positions are checked. A server answering `Ref<...>` at the template position returned the script type without modelling the template — the Vue-specific work — and answering that is much faster than doing it, so its latency is not comparable.",
  "Rows that fail the gate, answer nothing, or sit at a position with no known-correct answer are **measured but unranked**: the time is shown in brackets with the reason, matching every other surface in this repo.",
  "Activation is reported only when this run performed it. An extension already active when the subject was resolved shows `n/a (pre-activated)` — it is not a zero, and it never ranks.",
  "Diagnostics wait is measured from a COMMON origin for every subject: the subscription is registered and the clock started BEFORE the document is opened, so a publish landing during the open is timed rather than scoring zero. An empty publish counts — the probe workspaces are clean, so \"no problems here\" is the correct answer and reaching it is the work being timed. Nothing arriving inside the budget is reported as `none in <budget>`, never as the budget itself.",
  "Marketplace defaults: Vue.volar, ubugeeei.vize, verter.verter-vscode.",
  "typescript-native-bridge is not an extension under test here.",
];

/**
 * Render the published table for a set of parsed result rows.
 * @param {object[]} rows
 */
export function renderMarkdown(rows) {
  const lines = [];
  lines.push("## VS Code E2E results");
  lines.push("");
  lines.push(
    "Headless `@vscode/test-electron` runs. Primary metric: **hover cold** at the template position, **gated on hover content**. Sorted within each workspace; rows that fail the gate are measured but not ranked.",
  );
  lines.push("");
  lines.push(
    "Setup: same VS Code stable build; isolated `--extensions-dir` per subject; only that Vue extension installed.",
  );
  lines.push("");

  const byWorkspace = new Map();
  for (const row of rows) {
    const key = row.kind || row.workspace || "?";
    if (!byWorkspace.has(key)) byWorkspace.set(key, []);
    byWorkspace.get(key).push(row);
  }

  for (const [workspace, list] of byWorkspace) {
    lines.push(`### Workspace: ${workspace}`);
    lines.push("");
    lines.push(COLUMNS);
    lines.push(ALIGN);

    const entries = list
      .map((row) => ({ row, verdict: classifyRow(row) }))
      .sort((a, b) => {
        const [at, am] = sortKey(a);
        const [bt, bm] = sortKey(b);
        return at - bt || am - bm;
      });

    for (const entry of entries) lines.push(renderRow(entry.row, entry.verdict));

    const ranked = entries.filter((e) => e.verdict.status === "ok").length;
    if (ranked === 0) {
      lines.push("");
      lines.push(
        "> No row in this workspace passed the hover content gate, so nothing here is ranked. The times are still shown, in brackets, with the reason on each row.",
      );
    }
    lines.push("");
  }

  lines.push("<details><summary>Methodology</summary>");
  lines.push("");
  for (const note of METHODOLOGY) lines.push(`- ${note}`);
  lines.push("");
  lines.push("</details>");
  lines.push("");
  return lines.join("\n");
}
