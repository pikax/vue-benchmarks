/**
 * Ranking and rendering rules for the VS Code E2E surface.
 *
 * This table used to rank every row it was handed. There was no correctness
 * gate anywhere on the surface, and two of its columns carried sentinels that
 * read as measurements. The rows below are built from the values that were
 * actually published (results/e2e-vscode/*.json), so each test states a
 * concrete thing the old table said and the new one cannot.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  activateCell,
  classifyRow,
  diagnosticsCell,
  renderMarkdown,
} from "../../scripts/e2e-vscode/report.mjs";

const PASSING_GATE = {
  applicable: true,
  symbol: "benchMarker",
  template: { ok: true, bytes: 44, reason: "" },
  script: { ok: true, bytes: 120, reason: "" },
};

function row(overrides = {}) {
  const { phases, gate, ...rest } = overrides;
  return {
    label: "Subject",
    kind: "regular",
    primaryMs: 100,
    primaryMetric: "hoverColdMs",
    gate: gate === undefined ? PASSING_GATE : gate,
    phases: {
      activateMs: 150,
      activateOutcome: "measured",
      openDocumentMs: 70,
      diagnosticsWaitMs: 400,
      diagnosticsCount: 0,
      diagnosticsOutcome: "measured",
      diagnosticsTimeoutMs: 45_000,
      hoverColdMs: 100,
      hoverColdCount: 1,
      hoverWarmMedianMs: 11,
      completionMs: 20,
      definitionMs: 8,
      ...phases,
    },
    ...rest,
  };
}

describe("classifyRow", () => {
  test("a hover that answered and passed both halves of the gate ranks", () => {
    assert.deepEqual(classifyRow(row()), { status: "ok", reasons: [] });
  });

  test("hoverColdCount 0 is unranked — all three nuxt-ui rows were like this", () => {
    // Published: Volar 17.58 ms / Vize 152.72 ms / Verter 329.43 ms, ranked in
    // that order, every one of them from a hover that returned nothing.
    const v = classifyRow(row({ phases: { hoverColdCount: 0, hoverColdMs: 17.58 } }));
    assert.equal(v.status, "unranked");
    assert.match(v.reasons.join(" "), /no result/);
  });

  test("a null answer is unranked even when the gate object says it passed", () => {
    // Ordering guard: an empty payload cannot legitimately pass, but the row
    // must not depend on the gate agreeing before it refuses to rank.
    const v = classifyRow(row({ phases: { hoverColdCount: 0 }, gate: PASSING_GATE }));
    assert.equal(v.status, "unranked");
  });

  test("a template hover returning the script Ref<...> type is unranked", () => {
    const v = classifyRow(
      row({
        gate: {
          applicable: true,
          template: {
            ok: false,
            bytes: 260,
            reason:
              "template hover returned Ref<...> — that is the <script setup> type leaking into template context",
          },
          script: { ok: true, bytes: 100, reason: "" },
        },
      }),
    );
    assert.equal(v.status, "unranked");
    assert.match(v.reasons[0], /^template hover: /);
    assert.match(v.reasons[0], /Ref<\.\.\.>/);
  });

  test("a failing script half alone is enough to unrank", () => {
    const v = classifyRow(
      row({
        gate: {
          applicable: true,
          template: { ok: true, bytes: 44, reason: "" },
          script: { ok: false, bytes: 30, reason: "hover does not mention benchMarker" },
        },
      }),
    );
    assert.equal(v.status, "unranked");
    assert.match(v.reasons[0], /^script hover: /);
  });

  test("both halves failing are both reported", () => {
    const v = classifyRow(
      row({
        gate: {
          applicable: true,
          template: { ok: false, bytes: 1, reason: "template reason" },
          script: { ok: false, bytes: 1, reason: "script reason" },
        },
      }),
    );
    assert.equal(v.reasons.length, 2);
  });

  test("a position with no known-correct answer is unranked", () => {
    const v = classifyRow(
      row({
        kind: "nuxt-ui",
        gate: { applicable: false, symbol: null, reason: "no planted marker in this workspace" },
      }),
    );
    assert.equal(v.status, "unranked");
    assert.match(v.reasons[0], /no planted marker/);
  });

  test("a row carrying no gate at all cannot rank by omission", () => {
    // Every result file written before this change is in this shape. Silently
    // ranking them would reintroduce the ungated table.
    const v = classifyRow(row({ gate: null }));
    assert.equal(v.status, "unranked");
    assert.match(v.reasons[0], /no correctness gate/);
  });

  test("an errored run stays an error", () => {
    assert.equal(classifyRow({ label: "X", status: "error", error: "boom" }).status, "error");
    assert.equal(classifyRow({ label: "X" }).status, "error");
  });

  test("a missing primary measurement is unranked", () => {
    assert.equal(classifyRow(row({ primaryMs: null })).status, "unranked");
  });
});

describe("activateCell", () => {
  test("an eagerly-activated extension renders n/a, never 0 ms", () => {
    // Published for Volar in all three workspaces: "0 ms".
    const cell = activateCell({ activateMs: null, activateOutcome: "already-active" });
    assert.equal(cell, "n/a (pre-activated)");
    assert.doesNotMatch(cell, /\b0 ms\b/);
  });

  test("a measured activation renders as a duration", () => {
    assert.equal(activateCell({ activateMs: 198.07, activateOutcome: "measured" }), "198 ms");
    assert.equal(activateCell({ activateMs: 2210.7, activateOutcome: "measured" }), "2.21 s");
  });

  test("the no-extension baseline renders n/a", () => {
    assert.equal(activateCell({ activateMs: null, activateOutcome: "no-extension" }), "n/a");
  });
});

describe("diagnosticsCell", () => {
  test("only a measured wait renders as a duration", () => {
    assert.equal(
      diagnosticsCell({
        diagnosticsOutcome: "measured",
        diagnosticsWaitMs: 1468.75,
        diagnosticsCount: 0,
      }),
      "1.47 s · 0",
    );
  });

  test("a pre-open publish does not borrow a number", () => {
    // Published for Vize: "0 ms" beside Volar's "1.47 s" — a ~17,000x spread
    // that was entirely the clock origin.
    const cell = diagnosticsCell({
      diagnosticsOutcome: "pre-open",
      diagnosticsWaitMs: null,
      diagnosticsCount: 2,
    });
    assert.match(cell, /published before open/);
    assert.doesNotMatch(cell, /\d+ ms/);
  });

  test("a timeout renders as an outcome, not as the budget", () => {
    const cell = diagnosticsCell({
      diagnosticsOutcome: "timeout",
      diagnosticsWaitMs: null,
      diagnosticsTimeoutMs: 45_000,
    });
    assert.equal(cell, "none in 45.00 s");
    assert.doesNotMatch(cell, /^45\.00 s/, "the budget must not read as the wait");
  });
});

describe("renderMarkdown", () => {
  /** The regular workspace as it was actually published, with gates attached. */
  const regular = [
    row({
      label: "Vize",
      primaryMs: 88.92,
      phases: {
        activateMs: 198.07,
        activateOutcome: "measured",
        openDocumentMs: 74.07,
        diagnosticsWaitMs: null,
        diagnosticsOutcome: "pre-open",
        diagnosticsCount: 2,
        hoverColdMs: 88.92,
        hoverColdCount: 1,
        hoverWarmMedianMs: 13.43,
        completionMs: 17.4,
        definitionMs: 10.07,
      },
      gate: {
        applicable: true,
        template: {
          ok: false,
          bytes: 260,
          reason:
            "template hover returned Ref<...> — that is the <script setup> type leaking into template context",
        },
        script: { ok: true, bytes: 100, reason: "" },
      },
    }),
    row({
      label: "Volar",
      primaryMs: 109.96,
      phases: {
        activateMs: null,
        activateOutcome: "already-active",
        openDocumentMs: 86.48,
        diagnosticsWaitMs: 1468.75,
        diagnosticsOutcome: "measured",
        diagnosticsCount: 0,
        hoverColdMs: 109.96,
        hoverColdCount: 1,
        hoverWarmMedianMs: 10.81,
        completionMs: 64.72,
        definitionMs: 7.01,
      },
    }),
    row({
      label: "Verter",
      primaryMs: 821.8,
      phases: {
        activateMs: 2210.72,
        activateOutcome: "measured",
        openDocumentMs: 565.88,
        diagnosticsWaitMs: 372.85,
        diagnosticsOutcome: "measured",
        diagnosticsCount: 0,
        hoverColdMs: 821.8,
        hoverColdCount: 2,
        hoverWarmMedianMs: 10.92,
        completionMs: 108.58,
        definitionMs: 388.73,
      },
    }),
  ];

  test("a failed-gate row loses first place instead of keeping it", () => {
    // The old table ranked Vize first at 89 ms. It is the fastest number in the
    // column and it is the row that answered the template with the script type.
    const md = renderMarkdown(regular);
    const body = md.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| ---"));
    const order = body.slice(1).map((l) => l.split("|")[1].trim());
    assert.deepEqual(order, ["Volar", "Verter", "Vize"]);
  });

  test("a failed-gate row uses the repo's existing unranked convention", () => {
    const md = renderMarkdown(regular);
    const vize = md.split("\n").find((l) => l.startsWith("| Vize |"));
    assert.match(vize, /⚠ failed validation/);
    // Time present, in brackets, with the reason — same shape as
    // scripts/lib/report.mjs uses for every other surface.
    assert.match(vize, /\(89 ms\)/);
    assert.match(vize, /Ref<\.\.\./);
  });

  test("every timing cell of an unranked row is bracketed", () => {
    const md = renderMarkdown(regular);
    const vize = md.split("\n").find((l) => l.startsWith("| Vize |"));
    const cells = vize.split("|").slice(3, 10).map((c) => c.trim());
    for (const cell of cells) {
      assert.ok(
        cell === "n/a" || /^\(.*\)$/.test(cell),
        `unranked cell not bracketed, so it reads as comparable: ${cell}`,
      );
    }
  });

  test("a ranked row is not bracketed", () => {
    const md = renderMarkdown(regular);
    const volar = md.split("\n").find((l) => l.startsWith("| Volar |"));
    assert.match(volar, /\| ok \|/);
    assert.match(volar, /\| 110 ms \|/);
  });

  test("the eager-activation zero is gone from the rendered table", () => {
    const md = renderMarkdown(regular);
    const volar = md.split("\n").find((l) => l.startsWith("| Volar |"));
    assert.match(volar, /n\/a \(pre-activated\)/);
    assert.doesNotMatch(volar, /\| 0 ms \|/);
  });

  test("the diagnostics column no longer mixes two quantities", () => {
    const md = renderMarkdown(regular);
    const vize = md.split("\n").find((l) => l.startsWith("| Vize |"));
    const volar = md.split("\n").find((l) => l.startsWith("| Volar |"));
    assert.match(vize, /published before open/);
    assert.doesNotMatch(vize, /\(0 ms\)/);
    assert.match(volar, /1\.47 s · 0/);
  });

  test("a workspace where nothing passed says so instead of ranking anyway", () => {
    const nuxt = ["Volar", "Vize", "Verter"].map((label, i) =>
      row({
        label,
        kind: "nuxt-ui",
        primaryMs: [17.58, 152.72, 329.43][i],
        phases: { hoverColdCount: 0, hoverColdMs: [17.58, 152.72, 329.43][i] },
        gate: { applicable: false, reason: "no planted marker in this workspace" },
      }),
    );
    const md = renderMarkdown(nuxt);
    assert.doesNotMatch(md, /\| ok \|/);
    assert.match(md, /No row in this workspace passed the hover content gate/);
    assert.match(md, /\(18 ms\)/);
  });

  test("errors still render and sort last", () => {
    const md = renderMarkdown([
      row({ label: "Good" }),
      { label: "Broken", kind: "regular", status: "error", error: "install failed" },
    ]);
    const body = md.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| ---"));
    assert.match(body.at(-1), /^\| Broken \| error \|/);
    assert.match(body.at(-1), /install failed/);
  });

  test("the published methodology states the gate", () => {
    const md = renderMarkdown(regular);
    assert.match(md, /Hover content is gated, and a row must pass to be ranked/);
    assert.match(md, /measured but unranked/);
    assert.match(md, /COMMON origin/);
    assert.match(md, /pre-activated/);
  });

  test("cells containing a pipe cannot break the table", () => {
    const md = renderMarkdown([
      row({
        label: "Weird",
        gate: {
          applicable: true,
          template: { ok: false, bytes: 1, reason: "a | b\nsecond line" },
          script: { ok: true, bytes: 1, reason: "" },
        },
      }),
    ]);
    const line = md.split("\n").find((l) => l.startsWith("| Weird |"));
    assert.match(line, /a \\\| b second line/);
    assert.equal(line.split(/(?<!\\)\|/).length - 1, 11, "column count changed");
  });
});
