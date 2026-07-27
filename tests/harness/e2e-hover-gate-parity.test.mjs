/**
 * The VS Code E2E surface gates hover content with a CommonJS PORT of the LSP
 * surface's classifiers (scripts/e2e-vscode/suite/hover-gate.cjs), because the
 * extension host is a CJS context and cannot `require()` the ESM originals.
 *
 * A port that drifts is worse than no port: the two surfaces would publish
 * "passed the hover gate" while enforcing different things, and the difference
 * would show up as an unexplained ranking disagreement between two tables in
 * the same report.
 *
 * So the port is not trusted, it is CHECKED. Both implementations are loaded
 * here and must return identical `{ok, bytes, reason}` for:
 *
 *   - every verbatim server payload in lsp-hover-gate.test.mjs, which are real
 *     captures from a run of all three language servers, and
 *   - a generated corpus of several hundred permutations around the two traps
 *     that gate got wrong before: a doc comment concatenated onto the type
 *     (`benchMarker: stringStable hover target…`, which a bare /\bstring\b/
 *     false-FAILS) and prose containing the word `string` (which a bare match
 *     false-PASSES).
 *
 * The last test proves the corpus is not vacuous: a deliberately loosened
 * classifier must be caught by it.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { classifyHover, classifyTemplateHover } from "../../scripts/lib/surfaces/lsp.mjs";

const require = createRequire(import.meta.url);
const port = require("../../scripts/e2e-vscode/suite/hover-gate.cjs");

/**
 * Verbatim server payloads — same fixtures as lsp-hover-gate.test.mjs.
 * Do not tidy: the formatting IS the test.
 */
const REAL = {
  volarScript:
    "```typescript\nconst benchMarker: Ref<string, string>\n```\nStable hover target for LSP benchmarks — do not rename.",
  volarTemplate: "```typescript\n(property) benchMarker: string\n```",

  // Type signature and doc comment concatenated with no separator.
  verterTemplate:
    "```typescript\nlet benchMarker: stringStable hover target for LSP benchmarks — do not rename.\n```",

  // The script type in template context, plus prose claiming the unwrapping.
  vizeTemplate:
    "**benchMarker**\n\n_Template binding from script_\n\n```typescript\nbenchMarker: Ref<string>\n```\n\n" +
    "Reactive reference created with `ref()`. Access `.value` in script, auto-unwrapped in template.\n\n**Source**",
};

/** Deterministic permutation corpus around both known traps. */
function generatedCorpus() {
  const symbols = ["benchMarker", "benchMarkerTwo", "otherMarker", "bench_marker"];
  const separators = [": ", ":", " : ", ":\n", ":  \t"];
  const types = [
    "string",
    "stringStable hover target for LSP benchmarks — do not rename.",
    "Ref<string>",
    "Ref< string >",
    "Ref  <string, string>",
    "MaybeRef<unknown>",
    "any",
    "number",
    "",
  ];
  const prefixes = ["", "(property) ", "let ", "const ", "```typescript\n", "**", "readonly "];
  const suffixes = ["", "\n```", " — docs", "\n\nauto-unwrapped in template.", "**"];

  const out = [];
  for (const symbol of symbols) {
    for (const separator of separators) {
      for (const type of types) {
        // Keep the cross-product bounded but still crossing every prefix and
        // suffix by rotating them against the type index.
        const prefix = prefixes[(types.indexOf(type) + symbols.indexOf(symbol)) % prefixes.length];
        const suffix = suffixes[(types.indexOf(type) + separators.indexOf(separator)) % suffixes.length];
        out.push(`${prefix}${symbol}${separator}${type}${suffix}`);
      }
    }
  }

  // Payloads with no annotation at all, prose, and degenerate input.
  out.push(
    "",
    "   ",
    "\n\n",
    "benchMarker",
    "**benchMarker**",
    "**benchMarker**\n\n_Template binding from script_",
    "A reactive reference holding a string, auto-unwrapped in template.",
    "**benchMarker**\n\nA reactive reference holding a string, auto-unwrapped in template.",
    "benchMarker is a string",
    "benchMarker holds Ref<string> in script",
    "(property) other: string",
    "const somethingElse: Ref<string>",
    "benchMarker : string",
    "benchMarkerbenchMarker: string",
    "xbenchMarker: string",
    "benchMarker:string",
    "benchMarker:Ref<string>",
    "benchMarker: Ref <string>",
    "// benchMarker: string",
    "型 benchMarker: string ✓",
    "benchMarker: string".repeat(40),
  );
  return out;
}

const CORPUS = [...Object.values(REAL), ...generatedCorpus()];

describe("E2E hover gate is a faithful port of the LSP surface classifiers", () => {
  test("the corpus is large enough to be worth running", () => {
    assert.ok(CORPUS.length > 200, `corpus is only ${CORPUS.length} payloads`);
  });

  test("classifyHover agrees on every payload", () => {
    for (const payload of CORPUS) {
      assert.deepEqual(
        port.classifyHover(payload),
        classifyHover(payload),
        `classifyHover disagreed on: ${JSON.stringify(payload).slice(0, 160)}`,
      );
    }
  });

  test("classifyTemplateHover agrees on every payload", () => {
    for (const payload of CORPUS) {
      assert.deepEqual(
        port.classifyTemplateHover(payload),
        classifyTemplateHover(payload),
        `classifyTemplateHover disagreed on: ${JSON.stringify(payload).slice(0, 160)}`,
      );
    }
  });

  test("both sides still hold the four real server payloads", () => {
    // Restated here rather than only cross-checked, so a change that broke BOTH
    // implementations identically would still be caught.
    for (const impl of [port, { classifyHover, classifyTemplateHover }]) {
      assert.equal(impl.classifyHover(REAL.volarScript).ok, true);
      assert.equal(impl.classifyTemplateHover(REAL.volarTemplate).ok, true);
      // The regression that once demoted a correct server: doc comment run into
      // the type signature with no separator.
      assert.equal(
        impl.classifyTemplateHover(REAL.verterTemplate).ok,
        true,
        "concatenated doc comment must not read as a missing type",
      );
      // The script type leaking into template context.
      const leaked = impl.classifyTemplateHover(REAL.vizeTemplate);
      assert.equal(leaked.ok, false);
      assert.match(leaked.reason, /Ref<\.\.\.>/);
    }
  });

  test("the port exposes the same probe symbol", () => {
    assert.equal(port.HOVER_EXPECT_SYMBOL, "benchMarker");
  });

  test("the corpus detects drift — a loosened template check does not survive it", () => {
    // Stand-in for the exact mistake the LSP gate made once: match a bare
    // `string` anywhere instead of the `benchMarker: string` annotation.
    const loosened = (text) => {
      const bytes = Buffer.byteLength(text, "utf8");
      if (!text) return { ok: false, bytes, reason: "empty hover payload at the template position" };
      if (!text.includes("benchMarker")) {
        return { ok: false, bytes, reason: "template hover does not mention benchMarker" };
      }
      return /\bstring\b/.test(text)
        ? { ok: true, bytes, reason: "" }
        : { ok: false, bytes, reason: "no type" };
    };

    const disagreements = CORPUS.filter(
      (p) => loosened(p).ok !== classifyTemplateHover(p).ok,
    );
    assert.ok(
      disagreements.length > 0,
      "corpus failed to distinguish a loosened classifier — it would not catch drift either",
    );
    // Both trap directions must be among them, not just one.
    assert.ok(
      disagreements.includes(REAL.verterTemplate),
      "corpus missed the false-FAIL trap (concatenated doc comment)",
    );
    assert.ok(
      disagreements.some((p) => /auto-unwrapped in template/.test(p) && /Ref</.test(p)),
      "corpus missed the false-PASS trap (prose containing the word string)",
    );
  });
});
