/**
 * Scoring rules that must not depend on WHICH tool produced the output.
 *
 * Every case here is a real verdict the harness got wrong: a correct
 * diagnostic scored as a miss because of message phrasing, a plant that could
 * not be satisfied by any tool, a check that only recognised one vendor's line
 * format. They are pinned as tests because each one moved a published number.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { mentions, parseDiagnostics, scoreDiagnostics } from "../confirm/lib/diagnostics.mjs";
import { findExpectErrorPins, stripExpectErrorDirectives } from "../confirm/lib/plant-pins.mjs";
import { vizeIssueText } from "../confirm/suites/lint.mjs";
import { gateRows, knownEntryFor } from "../confirm/run.mjs";

describe("expectMention is not a message-phrasing lottery", () => {
  test("case-insensitive: 'style' is named by a message that says StyleValue", () => {
    // vize on style-binding-bad, pinned to the exact binding column. Scored as
    // a miss by a case-sensitive includes() while vue-tsc passed only because
    // its message happens to echo `{ style: 123; }`.
    assert.equal(
      mentions("TS2322 Type '123' is not assignable to type 'StyleValue'.", "style"),
      true,
    );
  });

  test("a quoted needle also matches the bare token on an identifier boundary", () => {
    const vize =
      "TS2345 Argument of type '{ kind: \"num\"; s: string; }' is not assignable to parameter";
    const vueTsc = "TS2353 Object literal may only specify known properties, and 's' does not exist";
    assert.equal(mentions(vize, "'s'"), true);
    assert.equal(mentions(vueTsc, "'s'"), true);
  });

  test("the boundary keeps a one-character needle from matching inside a word", () => {
    assert.equal(mentions("Type 'string' is not assignable to type 'number'", "'s'"), false);
    assert.equal(mentions("Property 'count' does not exist", "'x'"), false);
  });

  test("a needle nobody prints still fails — the check is loosened, not removed", () => {
    assert.equal(
      mentions("Argument of type 'string' is not assignable to parameter of type 'number'", "nope"),
      false,
    );
  });
});

describe("plant pins survive more than one pin per file", () => {
  test("the second pin accounts for both stripped comment lines", () => {
    const dir = mkdtempSync(join(tmpdir(), "vue-bench-pins-"));
    try {
      writeFileSync(
        join(dir, "App.vue"),
        [
          "<template>",
          "  <!-- @plant-error -->",
          '  <button :disabled="s">a</button>',
          "  <!-- @plant-error -->",
          '  <button @click="n">b</button>',
          "</template>",
          "",
        ].join("\n"),
      );
      const pins = findExpectErrorPins(dir);
      assert.equal(pins.length, 2);
      // Source coordinates, for the docs and the failure message.
      assert.deepEqual(
        pins.map((p) => p.targetLine),
        [3, 5],
      );
      // Where the code actually lands once the pins are stripped: the first
      // shifts up one line, the second up two. Only accepting `targetLine` and
      // `commentLine` made every plant past the first unscoreable.
      assert.deepEqual(
        pins.map((p) => p.strippedLine),
        [2, 3],
      );

      stripExpectErrorDirectives(dir);
      const diags = parseDiagnostics(
        [
          "App.vue(2,11): error TS2322: Type 'string' is not assignable to type 'Booleanish'.",
          "App.vue(3,11): error TS2322: Type 'number' is not assignable to type 'function'.",
        ].join("\n"),
      );
      const score = scoreDiagnostics({
        combined: "",
        diags,
        expectErrors: true,
        minErrors: 2,
        pins,
      });
      assert.equal(score.ok, true, score.message);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("one diagnostic does not satisfy two pins", () => {
    const pins = [
      { file: "App.vue", commentLine: 2, targetLine: 3, strippedLine: 2 },
      { file: "App.vue", commentLine: 4, targetLine: 5, strippedLine: 3 },
    ];
    const diags = parseDiagnostics("App.vue(2,11): error TS2322: Type 'string' is not assignable.");
    const score = scoreDiagnostics({ combined: "", diags, expectErrors: true, pins });
    assert.equal(score.ok, false);
    assert.match(score.message, /no diagnostic at App\.vue:5/);
  });
});

describe("vize lint needles are matched against the diagnostic, not the dump", () => {
  const report = [
    "  ⚠ [vize:a11y/alt-text] <img> elements must have an alt attribute",
    "   ╭─[dirty/ImgNoAlt.vue:5:3]",
    " 4 │   <!-- plant -->",
    ' 5 │   <img src="photo.png" />',
    "  help: Add an alt attribute",
  ].join("\n");

  test("the rule tag, message and help line are kept", () => {
    const text = vizeIssueText(report);
    assert.match(text, /\[vize:a11y\/alt-text\]/);
    assert.match(text, /help: Add an alt attribute/);
  });

  test("the file path and the quoted source are NOT evidence", () => {
    // `ImgNoAlt.vue` contains both "img" and "alt", and the excerpt repeats the
    // planted markup — matching needles against the whole dump let vize satisfy
    // a rule-identity check it never answered.
    const text = vizeIssueText(report);
    assert.doesNotMatch(text, /ImgNoAlt\.vue/);
    assert.doesNotMatch(text, /photo\.png/);
  });
});

describe("gateRows exposes combined-run plants to known-failures", () => {
  const allRow = {
    suite: "typecheck-all",
    caseId: "all-plants",
    tool: "vue-tsc",
    status: "pass",
    detail: {
      plants: [
        { caseId: "clean-basic", status: "pass", ok: true },
        { caseId: "element-prop-type", status: "fail", ok: false, message: "no diagnostic" },
        { caseId: "fallthrough-mono-ok", status: "warn", ok: false, message: "needed the opt-in" },
      ],
    },
  };

  test("--all: per-plant verdicts become gate rows under the per-case keys", () => {
    const rows = gateRows([allRow]);
    const expanded = rows.filter((r) => r.suite === "typecheck");
    assert.equal(expanded.length, 3);
    const fail = expanded.find((r) => r.caseId === "element-prop-type");
    assert.equal(fail.status, "fail");
    assert.equal(fail.tool, "vue-tsc");
    // warn is carried through as warn: not a failure, and not a "this entry is
    // fixed now" signal either.
    assert.equal(expanded.find((r) => r.caseId === "fallthrough-mono-ok").status, "warn");
  });

  test("the per-case suite stays the authority when it ran", () => {
    const perCase = { suite: "typecheck", caseId: "clean-basic", tool: "vue-tsc", status: "pass" };
    const rows = gateRows([perCase, allRow]);
    assert.equal(rows.length, 2, "no expansion when per-case rows exist");
  });

  test("expanded rows are tagged with the project that produced them", () => {
    assert.equal(gateRows([allRow]).find((r) => r.caseId === "element-prop-type").path, "combined");
  });
});

describe("a known failure can be scoped to one typecheck path", () => {
  // vize resolves a GlobalComponents augmentation in the 5-file per-case
  // project and reports nothing for the same files in the 150-plant combined
  // one. Both verdicts are real; one unqualified entry would make whichever
  // run you did call known-failures.json wrong.
  const known = {
    "typecheck/scale-dependent/vize-check": { why: "disappears at scale", path: "combined" },
    "typecheck/always/vize-check": "plain string entry, both paths",
  };
  const row = (caseId, path) => ({ suite: "typecheck", caseId, tool: "vize-check", path });

  test("it applies to its own path", () => {
    assert.equal(knownEntryFor(known, row("scale-dependent", "combined"))?.why, "disappears at scale");
  });

  test("it does not excuse — or get refuted by — the other path", () => {
    assert.equal(knownEntryFor(known, row("scale-dependent", "per-case")), null);
  });

  test("rows with no path are per-case, the historical default", () => {
    assert.equal(knownEntryFor(known, row("scale-dependent", undefined)), null);
    assert.equal(knownEntryFor(known, row("always", undefined))?.why, "plain string entry, both paths");
    assert.equal(knownEntryFor(known, row("always", "combined"))?.why, "plain string entry, both paths");
  });
});

describe("a known failure can be scoped to one platform", () => {
  // The tools are not identical per OS. Measured on one commit: verter-tsc
  // leaks ___VERTER___ virtual code into diagnostics on clean generic SFCs on
  // Linux and is silent on win32. CI is Linux; a developer elsewhere still has
  // to get a truthful run out of the same file.
  const known = {
    "typecheck/generic-slot-ok/verter-tsc": { why: "virtual-code leak", platform: "linux" },
    "typecheck/attrs-unknown-fallthrough/verter-tsc": { why: "undeclared attr", platform: "win32" },
    "typecheck/always/verter-tsc": "not platform specific",
  };
  const row = (caseId) => ({ suite: "typecheck", caseId, tool: "verter-tsc" });

  test("it excuses the failure only on its own platform", () => {
    assert.equal(knownEntryFor(known, row("generic-slot-ok"), { platform: "linux" })?.why, "virtual-code leak");
    assert.equal(knownEntryFor(known, row("generic-slot-ok"), { platform: "win32" }), null);
  });

  test("a pass on another platform does not report it stale", () => {
    // The stale check runs through the same lookup, so an entry that does not
    // apply cannot be refuted by a run it was never about.
    assert.equal(knownEntryFor(known, row("attrs-unknown-fallthrough"), { platform: "linux" }), null);
    assert.equal(
      knownEntryFor(known, row("attrs-unknown-fallthrough"), { platform: "win32" })?.why,
      "undeclared attr",
    );
  });

  test("an unqualified entry still applies everywhere", () => {
    for (const platform of ["linux", "win32", "darwin"]) {
      assert.equal(knownEntryFor(known, row("always"), { platform })?.why, "not platform specific");
    }
  });

  test("path and platform compose", () => {
    const scoped = {
      "typecheck/both/vize-check": { why: "combined + win32 only", path: "combined", platform: "win32" },
    };
    const at = (path, platform) =>
      knownEntryFor(scoped, { suite: "typecheck", caseId: "both", tool: "vize-check", path }, { platform });
    assert.equal(at("combined", "win32")?.why, "combined + win32 only");
    assert.equal(at("combined", "linux"), null);
    assert.equal(at("per-case", "win32"), null);
  });
});
