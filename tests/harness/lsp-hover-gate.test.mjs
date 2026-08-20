/**
 * Hover content gate — regression guard.
 *
 * The payloads below are VERBATIM captures from a real run of all three
 * language servers against the same workspace, file and UTF-16 position
 * (results/bench-*.json → surfaces.lsp.variants[].metaSamples[]). They are
 * fixtures precisely because the first version of the template gate got one of
 * them wrong.
 *
 * The bug worth never repeating: the template check matched a bare
 * /\bstring\b/, which FAILED `let benchMarker: stringStable hover target for…`
 * — a server that had resolved the template type correctly but ran its doc
 * comment into the type signature with no separator. There is no word boundary
 * inside `stringStable`, so a correct answer was reported as carrying no type
 * and the row was demoted to unranked. Unranking a tool that did the work is
 * the most damaging failure mode this harness has.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { classifyHover, classifyTemplateHover } from "../../scripts/lib/surfaces/lsp.mjs";
import { hoverWithRetry } from "../confirm/suites/lsp.mjs";

/** Verbatim server payloads. Do not tidy — the formatting IS the test. */
const REAL = {
  volarScript: "```typescript\nconst benchMarker: Ref<string, string>\n```\nStable hover target for LSP benchmarks — do not rename.",
  volarTemplate: "```typescript\n(property) benchMarker: string\n```",

  // Type signature and doc comment concatenated with no separator.
  verterTemplate:
    "```typescript\nlet benchMarker: stringStable hover target for LSP benchmarks — do not rename.\n```",

  // The script type in template context, plus prose claiming the unwrapping.
  vizeTemplate:
    "**benchMarker**\n\n_Template binding from script_\n\n```typescript\nbenchMarker: Ref<string>\n```\n\n" +
    "Reactive reference created with `ref()`. Access `.value` in script, auto-unwrapped in template.\n\n**Source**",
};

describe("classifyHover (script position)", () => {
  test("accepts a real TypeScript type", () => {
    assert.equal(classifyHover(REAL.volarScript).ok, true);
  });

  test("rejects an empty payload", () => {
    assert.equal(classifyHover("").ok, false);
  });

  test("rejects a payload that names the symbol but carries no type", () => {
    const r = classifyHover("**benchMarker**\n\n_Template binding from script_");
    assert.equal(r.ok, false);
    assert.match(r.reason, /no TypeScript type/);
  });

  test("rejects a payload for a different symbol", () => {
    assert.equal(classifyHover("const somethingElse: Ref<string>").ok, false);
  });
});

describe("classifyTemplateHover (template position)", () => {
  test("accepts the auto-unwrapped string type", () => {
    assert.equal(classifyTemplateHover(REAL.volarTemplate).ok, true);
  });

  test("accepts a correct type even when the doc comment is concatenated onto it", () => {
    // The regression that demoted a correct server. See file header.
    const r = classifyTemplateHover(REAL.verterTemplate);
    assert.equal(r.ok, true, `should pass but failed with: ${r.reason}`);
  });

  test("rejects the script Ref<...> type leaking into template context", () => {
    const r = classifyTemplateHover(REAL.vizeTemplate);
    assert.equal(r.ok, false);
    assert.match(r.reason, /Ref<\.\.\.>/);
  });

  test("prose mentioning 'string' does not count as a type", () => {
    // Guards the other direction: loose matching would credit this payload for
    // the word `string` in its own explanatory sentence.
    const prose =
      "**benchMarker**\n\nA reactive reference holding a string, auto-unwrapped in template.";
    assert.equal(classifyTemplateHover(prose).ok, false);
  });

  test("rejects an empty payload", () => {
    const r = classifyTemplateHover("");
    assert.equal(r.ok, false);
    assert.match(r.reason, /empty/);
  });

  test("rejects a payload naming a different symbol", () => {
    assert.equal(classifyTemplateHover("(property) other: string").ok, false);
  });

  test("reports byte size for the artifact column", () => {
    assert.equal(
      classifyTemplateHover(REAL.volarTemplate).bytes,
      Buffer.byteLength(REAL.volarTemplate, "utf8"),
    );
  });
});

/**
 * The confirmation suite's first request of a session, and therefore its
 * readiness gate.
 *
 * Observed on a Benchmark run: `hover-template-binding · verter — empty hover
 * payload`, while definition, documentSymbol, completion, definition-prop-attr
 * and both diagnostics cases on the SAME session all passed. A server that is
 * dead does not answer six later requests correctly; one that has not finished
 * loading the project answers the first one with nothing and raises no error,
 * so the error-only retry never fired.
 *
 * The suite allowed 50ms. Measured time to first non-empty answer on the
 * confirm workspace: 317-619ms on 4 CPUs, and 230-4934ms on 1 CPU. The budget
 * was never large enough for any of the three, and the fastest server to become
 * ready (verter, ~280ms) is the one the flake was reported against — which is
 * what makes this the harness's problem rather than a tool's.
 *
 * The race itself does not reproduce on demand, so the contract is pinned here
 * directly rather than by trying to recreate the timing.
 */
describe("hoverWithRetry", () => {
  const uri = "file:///App.vue";
  const at = { line: 0, character: 0 };
  const typed = { contents: { kind: "markdown", value: "```typescript\nconst greeting: string\n```" } };

  test("an empty payload is not an answer — it is retried", async () => {
    let calls = 0;
    const ask = async () => {
      calls += 1;
      return calls < 3 ? null : typed;
    };
    assert.deepEqual(await hoverWithRetry(ask, uri, at), typed);
    assert.equal(calls, 3);
  });

  test("a non-empty payload IS an answer and is returned as it stands", async () => {
    // The fairness half: retrying an untyped payload until it turns typed
    // would launder a real "this server has no type here" verdict into a pass,
    // which is the one thing this suite exists to catch.
    let calls = 0;
    const untyped = { contents: { kind: "markdown", value: "greeting" } };
    const ask = async () => {
      calls += 1;
      return untyped;
    };
    assert.deepEqual(await hoverWithRetry(ask, uri, at), untyped);
    assert.equal(calls, 1, "answered on the first attempt; no retry, no delay");
  });

  test("a server that only ever answers empty still returns empty, bounded", async () => {
    // Bounded, and then SCORED — never skipped on the grounds of not being
    // ready. A server that cannot answer its first request on a two-file
    // workspace is reporting something real, and the suite must say so.
    let calls = 0;
    const ask = async () => {
      calls += 1;
      return null;
    };
    assert.equal(await hoverWithRetry(ask, uri, at, { maxAttempts: 3 }), null);
    assert.equal(calls, 3);
  });

  test("a throwing server still surfaces its error rather than a false empty", async () => {
    const ask = async () => {
      throw new Error("connection closed");
    };
    await assert.rejects(() => hoverWithRetry(ask, uri, at, { maxAttempts: 2 }), /connection closed/);
  });
});
