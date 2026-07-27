/**
 * Edit-loop content gates — regression guard.
 *
 * Every payload in REAL below was captured from a live run of all four servers
 * against the suite's own fixture (`node scripts/ide-bench.mjs --suite edit-loop
 * --server all`). They are VERBATIM, down to the quote style and the trailing
 * prose, because the formatting is the test. Two of these gates were wrong
 * before these payloads existed:
 *
 *  - The suite keyed diagnostics by the uri string it had sent. The tsserver
 *    half of Volar publishes `file:///c%3A/…` for a file the client opened as
 *    `file:///C:/…`, so every Volar diagnostic was filed under a key nobody
 *    looked up, and the first full run reported that Volar publishes nothing,
 *    detects no type error and never invalidates across files. Volar does all
 *    three, in a few hundred milliseconds. `normalizeUri` is what stands
 *    between that measurement and a published lie.
 *
 *  - Servers disagree about how to print the same type. `(property) x: number`,
 *    `let x: number` and a bare `x: number` are all the same answer, and a
 *    string literal type is `"steady-5"` in Volar and Verter but `'steady-5'`
 *    in Vize. A gate that assumed one prefix, or one quote character, would
 *    have failed a server for punctuation — the failure mode this repo already
 *    paid for once with `/\bstring\b/` and `stringStable hover target…`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  SUITE,
  EDIT_BROKEN,
  PARENT_SOURCE,
  classifyTypeHover,
  explainMissingTypeDiagnostics,
  findPlantedDiagnostic,
  looksLikeTypeMismatch,
  normalizeUri,
  PLANTED_SYMBOL,
  PROBE_SYMBOL,
  PROP_SYMBOL,
  summarizeDiagnostics,
} from "../../scripts/lib/ide-ops/suites/edit-loop.mjs";
import { positionOf } from "../../scripts/lib/ide-ops/workspace.mjs";

/** Verbatim server payloads. Do not tidy — the formatting IS the test. */
const REAL = {
  // Hover at `{{ probeValue }}` BEFORE the retype: the type the gate must reject
  // afterwards.
  volarBefore: "```typescript\n(property) probeValue: string\n```",
  verterBefore: "```typescript\nlet probeValue: string\n```",

  // Hover at the same position immediately AFTER `let probeValue: number = 7`.
  // Three different renderings of one fact.
  volarAfter: "```typescript\n(property) probeValue: number\n```",
  verterAfter: "```typescript\nlet probeValue: number\n```",
  vizeAfter:
    "**probeValue**\n\n_Template binding from script_\n\n```typescript\nprobeValue: number\n```\n\n" +
    "Mutable binding from script setup. Changes won't trigger reactivity.\n\n**Source**\n\n" +
    "`<script setup>`\n\n**Template behavior**\n- Ref values are automatically unwrapped in templates.\n" +
    "- The binding is resolved from `<script setup>` analysis.",

  // Steady-state iteration 5, `let probeValue: 'steady-5' = 'steady-5'`.
  // Volar and Verter normalise the literal to double quotes, Vize keeps single.
  volarLiteral: '```typescript\n(property) probeValue: "steady-5"\n```',
  verterLiteral: '```typescript\nlet probeValue: "steady-5"\n```',
  vizeLiteral:
    "**probeValue**\n\n_Template binding from script_\n\n```typescript\nprobeValue: 'steady-5'\n```\n\n" +
    "Mutable binding from script setup. Changes won't trigger reactivity.\n\n**Source**\n\n" +
    "`<script setup>`\n\n**Template behavior**\n- Ref values are automatically unwrapped in templates.\n" +
    "- The binding is resolved from `<script setup>` analysis.",

  // Cross-file: hover on `:label` in Parent.vue after Child.vue's prop became
  // `number`. Volar has caught up; Verter, 4ms after the edit, has not.
  volarPropAfter: "```typescript\n(property) label: number\n```",
  verterPropStale: "```typescript\n(property) label: string\n```",
  // Vize answers this position with generic v-bind documentation and no type at
  // all, before or after the edit — unsupported, which is not the same finding
  // as stale, and the gate must be able to tell them apart.
  vizePropDocs:
    "**v-bind**\n\n_Vue attribute / prop binding_\n\n**Example**\n\n```vue\n:prop=\"expression\"\n```\n\n" +
    "Binds an attribute or component prop to a JavaScript expression in template scope.\n\n" +
    "**Template behavior**\n- Native element bindings patch DOM attributes or reflected properties.\n" +
    "- Component bindings resolve to props when the target is a component.\n\n**Docs**\n\n" +
    "[Vue v-bind](https://vuejs.org/api/built-in-directives.html#v-bind)",
};

/** Verbatim `publishDiagnostics` entries. */
const DIAGS = {
  // Volar's tsserver half, Edit.vue, planted error on line 3. Numeric code.
  volarPlanted: {
    range: { start: { line: 3, character: 6 }, end: { line: 3, character: 22 } },
    message: "Type 'string' is not assignable to type 'number'.",
    severity: 1,
    code: 2322,
    source: "typescript",
  },
  // Verter, same file, same line — but the code arrives as a STRING.
  verterPlanted: {
    code: "2322",
    message: "Type 'string' is not assignable to type 'number'.",
    range: { end: { character: 22, line: 3 }, start: { character: 6, line: 3 } },
    severity: 1,
    source: "ts",
  },
  // Volar's tsserver half, Parent.vue, after Child.vue's prop became `number`.
  volarCrossFile: {
    range: { start: { line: 7, character: 10 }, end: { line: 7, character: 15 } },
    message: "Type 'string' is not assignable to type 'number'.",
    severity: 1,
    code: 2322,
    source: "typescript",
    relatedInformation: [
      {
        location: {
          uri: "file:///c%3A/dev/ws/Child.vue",
          range: { start: { line: 1, character: 14 }, end: { line: 1, character: 19 } },
        },
        message:
          "The expected type comes from property 'label' which is declared here on type " +
          "'{ readonly label: number; } & VNodeProps & AllowedComponentProps & ComponentCustomProps'",
      },
    ],
  },
  // The only thing Vize ever publishes here: a hint saying it cannot type check.
  vizeUnavailable: {
    code: "typecheck-unavailable",
    message:
      "Type checking is unavailable in this workspace. Make sure `tsconfig.json` exists and the " +
      "Corsa runtime is reachable; see https://vizejs.dev/guide/static-analysis.",
    range: { end: { character: 0, line: 0 }, start: { character: 0, line: 0 } },
    severity: 4,
    source: "vize/types",
  },
};

/**
 * Lines the SUITE derives from its own fixture, exactly as `buildWorkspace`
 * does. Never hard-coded here either: if the fixture gains a line, these move
 * with it, and the first test below is what proves they still point at what the
 * servers actually flagged.
 */
const PLANTED_LINE = positionOf(EDIT_BROKEN, PLANTED_SYMBOL, 1).line;
const PROP_LINE = positionOf(PARENT_SOURCE, `${PROP_SYMBOL}=`, 1).line;

describe("fixture positions agree with what the servers flagged", () => {
  test("the planted line is where Volar and Verter both put the error", () => {
    assert.equal(PLANTED_LINE, DIAGS.volarPlanted.range.start.line);
    assert.equal(PLANTED_LINE, DIAGS.verterPlanted.range.start.line);
  });

  test("the prop binding line is where the cross-file error landed", () => {
    assert.equal(PROP_LINE, DIAGS.volarCrossFile.range.start.line);
  });
});

describe("classifyTypeHover — accepts a correct answer in any dialect", () => {
  for (const [name, payload] of [
    ["Volar", REAL.volarAfter],
    ["Verter", REAL.verterAfter],
    ["Vize", REAL.vizeAfter],
  ]) {
    test(`${name}: \`probeValue: number\` after the retype`, () => {
      const r = classifyTypeHover(payload, {
        symbol: PROBE_SYMBOL,
        expect: "number",
        reject: "string",
      });
      assert.equal(r.ok, true, `should pass but failed with: ${r.reason}`);
    });
  }

  test("no prefix is assumed: `(property) x:`, `let x:` and bare `x:` all pass", () => {
    for (const payload of [REAL.volarAfter, REAL.verterAfter, REAL.vizeAfter]) {
      assert.match(payload, /probeValue\s*:\s*number/);
      assert.equal(
        classifyTypeHover(payload, { symbol: PROBE_SYMBOL, expect: "number" }).ok,
        true,
      );
    }
  });

  test("a doc comment concatenated onto the type does not fail the gate", () => {
    // Modelled on the real regression already recorded in lsp-hover-gate.test.mjs,
    // where `let x: stringStable hover target…` failed a `/\bstring\b/` gate:
    // there is no word boundary between the type and the prose. Not captured
    // from this fixture — it is the shape the gate must survive.
    const concatenated = "```typescript\nlet probeValue: numberEdit-loop probe — do not rename.\n```";
    const r = classifyTypeHover(concatenated, {
      symbol: PROBE_SYMBOL,
      expect: "number",
      reject: "string",
    });
    assert.equal(r.ok, true, `should pass but failed with: ${r.reason}`);
  });

  test("a genuinely different type that merely starts with the expected one fails", () => {
    const r = classifyTypeHover("```typescript\nlet probeValue: numberish\n```", {
      symbol: PROBE_SYMBOL,
      expect: "number",
    });
    assert.equal(r.ok, false);
  });
});

describe("classifyTypeHover — string literal types, either quote style", () => {
  for (const [name, payload] of [
    ["Volar", REAL.volarLiteral],
    ["Verter", REAL.verterLiteral],
    ["Vize", REAL.vizeLiteral],
  ]) {
    test(`${name}: accepts 'steady-5' however it is quoted`, () => {
      const r = classifyTypeHover(payload, {
        symbol: PROBE_SYMBOL,
        expect: "'steady-5'",
        reject: "'steady-4'",
      });
      assert.equal(r.ok, true, `should pass but failed with: ${r.reason}`);
    });
  }

  test("the previous iteration's literal is rejected — one-edit lag is caught", () => {
    const stale = '```typescript\n(property) probeValue: "steady-4"\n```';
    const r = classifyTypeHover(stale, {
      symbol: PROBE_SYMBOL,
      expect: "'steady-5'",
      reject: "'steady-4'",
    });
    assert.equal(r.ok, false);
    assert.match(r.reason, /STALE/);
  });
});

describe("classifyTypeHover — staleness vs absence", () => {
  test("the pre-edit type is a STALE failure, named as such", () => {
    for (const payload of [REAL.volarBefore, REAL.verterBefore]) {
      const r = classifyTypeHover(payload, {
        symbol: PROBE_SYMBOL,
        expect: "number",
        reject: "string",
      });
      assert.equal(r.ok, false);
      assert.match(r.reason, /STALE/);
    }
  });

  test("Verter's cross-file hover 4ms after the Child edit is stale, not unsupported", () => {
    const r = classifyTypeHover(REAL.verterPropStale, {
      symbol: PROP_SYMBOL,
      expect: "number",
      reject: "string",
    });
    assert.equal(r.ok, false);
    assert.match(r.reason, /STALE/);
  });

  test("Volar's cross-file hover after the same edit passes", () => {
    const r = classifyTypeHover(REAL.volarPropAfter, {
      symbol: PROP_SYMBOL,
      expect: "number",
      reject: "string",
    });
    assert.equal(r.ok, true, `should pass but failed with: ${r.reason}`);
  });

  test("Vize's v-bind documentation is 'does not mention the symbol', not 'stale'", () => {
    const r = classifyTypeHover(REAL.vizePropDocs, {
      symbol: PROP_SYMBOL,
      expect: "number",
      reject: "string",
    });
    assert.equal(r.ok, false);
    assert.doesNotMatch(r.reason, /STALE/);
    assert.match(r.reason, /does not mention/);
    // The reason must carry the payload, or a reader cannot tell why.
    assert.match(r.reason, /v-bind/);
  });

  test("an empty payload is reported as empty, not as a wrong type", () => {
    // Verter intermittently answers nothing at all in the first milliseconds
    // after a didChange; observed live in this suite.
    const r = classifyTypeHover("", { symbol: PROBE_SYMBOL, expect: "number", reject: "string" });
    assert.equal(r.ok, false);
    assert.match(r.reason, /empty/);
  });

  test("prose that merely contains the word `number` is not a type", () => {
    const prose = "**probeValue**\n\nA binding holding a number, auto-unwrapped in template.";
    assert.equal(classifyTypeHover(prose, { symbol: PROBE_SYMBOL, expect: "number" }).ok, false);
  });

  test("a payload for a different symbol never passes", () => {
    assert.equal(
      classifyTypeHover("```typescript\nlet somethingElse: number\n```", {
        symbol: PROBE_SYMBOL,
        expect: "number",
      }).ok,
      false,
    );
  });

  test("reports byte size for the artifact column", () => {
    assert.equal(
      classifyTypeHover(REAL.volarAfter, { symbol: PROBE_SYMBOL, expect: "number" }).bytes,
      Buffer.byteLength(REAL.volarAfter, "utf8"),
    );
  });
});

describe("findPlantedDiagnostic — the diagnostic must reference the planted error", () => {
  test("Volar's numeric code 2322 at the planted line", () => {
    const hit = findPlantedDiagnostic([DIAGS.volarPlanted], {
      line: PLANTED_LINE,
      symbol: PLANTED_SYMBOL,
    });
    assert.equal(hit, DIAGS.volarPlanted);
  });

  test("Verter's STRING code \"2322\" at the same line", () => {
    const hit = findPlantedDiagnostic([DIAGS.verterPlanted], {
      line: PLANTED_LINE,
      symbol: PLANTED_SYMBOL,
    });
    assert.equal(hit, DIAGS.verterPlanted);
  });

  test("the cross-file diagnostic on Parent.vue's binding line", () => {
    const hit = findPlantedDiagnostic([DIAGS.volarCrossFile], {
      line: PROP_LINE,
      symbol: PROP_SYMBOL,
    });
    assert.equal(hit, DIAGS.volarCrossFile);
  });

  test("Vize's `typecheck-unavailable` hint is NOT the planted error", () => {
    // It is at line 0 and says nothing about types being wrong. Counting it
    // would credit a server with detecting an error it explicitly said it
    // could not look for.
    assert.equal(
      findPlantedDiagnostic([DIAGS.vizeUnavailable], {
        line: PLANTED_LINE,
        symbol: PLANTED_SYMBOL,
      }),
      null,
    );
  });

  test("an unrelated diagnostic on the planted line does not count", () => {
    const unused = {
      range: { start: { line: PLANTED_LINE, character: 6 }, end: { line: PLANTED_LINE, character: 22 } },
      message: `'${PLANTED_SYMBOL}' is declared but its value is never read.`,
      severity: 4,
      code: 6133,
      source: "typescript",
    };
    assert.equal(
      findPlantedDiagnostic([unused], { line: PLANTED_LINE, symbol: PLANTED_SYMBOL }),
      null,
    );
  });

  test("the same error on a different line does not count", () => {
    const elsewhere = { ...DIAGS.volarPlanted, range: { start: { line: 9 }, end: { line: 9 } } };
    assert.equal(
      findPlantedDiagnostic([elsewhere], { line: PLANTED_LINE, symbol: PLANTED_SYMBOL }),
      null,
    );
  });

  test("a checker that words it differently still counts, if it is in the right place", () => {
    // No TypeScript code, no TypeScript phrasing — a hypothetical native
    // checker. The gate must not be a TypeScript-only gate.
    const other = {
      range: { start: { line: PLANTED_LINE, character: 6 }, end: { line: PLANTED_LINE, character: 22 } },
      message: "expected type number, found string",
      severity: 1,
      source: "some-other-checker",
    };
    assert.ok(findPlantedDiagnostic([other], { line: PLANTED_LINE, symbol: PLANTED_SYMBOL }));
  });

  test("a multi-line range that spans the planted line counts", () => {
    const spanning = {
      ...DIAGS.volarPlanted,
      range: { start: { line: PLANTED_LINE - 1, character: 0 }, end: { line: PLANTED_LINE + 1, character: 0 } },
    };
    assert.ok(findPlantedDiagnostic([spanning], { line: PLANTED_LINE, symbol: PLANTED_SYMBOL }));
  });

  test("an empty diagnostics array is null, not a throw", () => {
    assert.equal(findPlantedDiagnostic([], { line: PLANTED_LINE, symbol: PLANTED_SYMBOL }), null);
    assert.equal(
      findPlantedDiagnostic(undefined, { line: PLANTED_LINE, symbol: PLANTED_SYMBOL }),
      null,
    );
  });
});

describe("looksLikeTypeMismatch", () => {
  test("both code shapes and the TypeScript wording", () => {
    assert.equal(looksLikeTypeMismatch(DIAGS.volarPlanted), true);
    assert.equal(looksLikeTypeMismatch(DIAGS.verterPlanted), true);
    assert.equal(looksLikeTypeMismatch({ message: "Type 'A' is not assignable to type 'B'." }), true);
  });

  test("the unavailable-typecheck hint is not a mismatch", () => {
    assert.equal(looksLikeTypeMismatch(DIAGS.vizeUnavailable), false);
  });

  test("an unused-variable diagnostic is not a mismatch", () => {
    assert.equal(
      looksLikeTypeMismatch({ code: 6133, message: "'x' is declared but its value is never read." }),
      false,
    );
  });
});

describe("normalizeUri — the bug that reported Volar as publishing nothing", () => {
  test("the client's uri and the tsserver half's uri are the same file", () => {
    const sent = "file:///C:/dev/ws/Edit.vue";
    const published = "file:///c%3A/dev/ws/Edit.vue";
    assert.notEqual(sent, published, "the two forms really are different strings");
    assert.equal(normalizeUri(sent), normalizeUri(published));
  });

  test("posix uris are left alone, including case", () => {
    assert.equal(normalizeUri("file:///home/u/Edit.vue"), "file:///home/u/Edit.vue");
  });

  test("different files stay different", () => {
    assert.notEqual(
      normalizeUri("file:///C:/dev/ws/Edit.vue"),
      normalizeUri("file:///c%3A/dev/ws/Parent.vue"),
    );
  });

  test("a malformed escape does not throw; the drive is still normalised", () => {
    // `%.` is not a valid escape, so decodeURIComponent throws. The path is
    // then compared undecoded rather than the whole bus losing the publish.
    assert.equal(normalizeUri("file:///C:/dev/100%.vue"), "file:///c:/dev/100%.vue");
  });
});

describe("explainMissingTypeDiagnostics — why a row has no type errors", () => {
  test("quotes the server's own admission when it publishes one", () => {
    const why = explainMissingTypeDiagnostics([DIAGS.vizeUnavailable], "");
    assert.match(why, /type checking unavailable/i);
    assert.match(why, /typecheck-unavailable/);
  });

  test("falls back to the stderr evidence for a backend that never started", () => {
    const why = explainMissingTypeDiagnostics([], "WARN vize_maestro: corsa bridge not available\n");
    assert.match(why, /Corsa backend never started/i);
  });

  test("says nothing when there is nothing to say", () => {
    assert.equal(explainMissingTypeDiagnostics([], ""), "");
    assert.equal(explainMissingTypeDiagnostics([DIAGS.volarPlanted], ""), "");
  });
});

describe("summarizeDiagnostics — the evidence printed on a failing row", () => {
  test("renders source, code and line", () => {
    const s = summarizeDiagnostics([DIAGS.verterPlanted]);
    assert.match(s, /ts:2322@L3/);
    assert.match(s, /not assignable/);
  });

  test("an empty set is visibly empty rather than blank", () => {
    assert.equal(summarizeDiagnostics([]), "[]");
    assert.equal(summarizeDiagnostics(undefined), "[]");
  });
});

describe("suite wiring", () => {
  test("declares the contract the registry validates", () => {
    assert.equal(SUITE.id, "edit-loop");
    assert.ok(SUITE.label);
    assert.equal(typeof SUITE.buildWorkspace, "function");
    assert.equal(typeof SUITE.measure, "function");
  });

  test("the planted value cannot satisfy the diagnostic gate by accident", () => {
    // The gate's last-resort rule accepts a message naming BOTH types. If the
    // planted value itself contained the words `string` or `number`, a server
    // that merely echoed the source would pass without checking anything.
    const planted = new RegExp(`const ${PLANTED_SYMBOL}: number = ('[^']*')`).exec(EDIT_BROKEN);
    assert.ok(planted, "the broken fixture must plant a quoted string value");
    assert.doesNotMatch(planted[1], /\b(string|number)\b/);
  });
});
