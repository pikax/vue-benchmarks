/**
 * Where the VS Code E2E surface hovers, and whether the probe components it
 * generates still carry a marker it can gate on.
 *
 * The position used to come from one heuristic that took the first line
 * matching `const <symbol>` OR the first line containing the bare symbol,
 * whichever came first scanning downward. In a single-file component the
 * template always precedes `<script setup>`, so the bare-symbol branch always
 * won and the probe landed inside `{{ }}` — the right position, reached by
 * accident, documented nowhere, and one edit away from moving.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import {
  MONOREPO_BUTTON_SOURCE,
  PROBE_SYMBOL,
  REGULAR_APP_SOURCE,
} from "../../scripts/e2e-vscode/setup-workspaces.mjs";

const require = createRequire(import.meta.url);
const {
  findFallbackPosition,
  findScriptPosition,
  findTemplatePosition,
  offsetToPosition,
} = require("../../scripts/e2e-vscode/suite/probe-positions.cjs");

/** Read back what a {line, character} actually points at. */
function textAt(source, pos, length) {
  const line = source.split(/\r?\n/)[pos.line];
  return line.slice(pos.character, pos.character + length);
}

describe("offsetToPosition", () => {
  test("maps offsets to 0-based line/character", () => {
    const src = "a\nbb\nccc";
    assert.deepEqual(offsetToPosition(src, 0), { line: 0, character: 0 });
    assert.deepEqual(offsetToPosition(src, 2), { line: 1, character: 0 });
    assert.deepEqual(offsetToPosition(src, 3), { line: 1, character: 1 });
    assert.deepEqual(offsetToPosition(src, 5), { line: 2, character: 0 });
  });

  test("counts UTF-16 code units, which is what vscode.Position.character means", () => {
    const src = "const s = '𝒳'\nconst benchMarker = ref('x')";
    const pos = findScriptPosition(src, "benchMarker");
    assert.equal(textAt(src, pos, "benchMarker".length), "benchMarker");
  });
});

describe("findTemplatePosition", () => {
  test("lands on the symbol inside the interpolation", () => {
    const pos = findTemplatePosition(REGULAR_APP_SOURCE, PROBE_SYMBOL);
    assert.ok(pos, "no template position found in the regular probe component");
    assert.equal(textAt(REGULAR_APP_SOURCE, pos, PROBE_SYMBOL.length), PROBE_SYMBOL);
    assert.match(REGULAR_APP_SOURCE.split("\n")[pos.line], /\{\{/);
  });

  test("ignores an identifier that is not inside {{ }}", () => {
    const src = `<template>\n  <p :title="benchMarker">x</p>\n</template>\n<script setup>\nconst benchMarker = ref('a')\n</script>\n`;
    assert.equal(findTemplatePosition(src, "benchMarker"), null);
  });

  test("resolves an interpolation broken across lines", () => {
    const src = `<template>\n  <p>{{\n    benchMarker\n  }}</p>\n</template>\n`;
    const pos = findTemplatePosition(src, "benchMarker");
    assert.deepEqual(pos, { line: 2, character: 4 });
  });

  test("does not match a longer identifier that merely starts with the symbol", () => {
    const src = `<template><p>{{ benchMarkerTwo }}</p></template>\n`;
    assert.equal(findTemplatePosition(src, "benchMarker"), null);
  });

  test("returns null rather than guessing when there is no interpolation", () => {
    assert.equal(findTemplatePosition("<template><p>x</p></template>", "benchMarker"), null);
    assert.equal(findTemplatePosition("{{ other }}", "benchMarker"), null);
    assert.equal(findTemplatePosition("{{ benchMarker", "benchMarker"), null);
    assert.equal(findTemplatePosition("anything", null), null);
  });
});

describe("findScriptPosition", () => {
  test("lands on the symbol in its const declaration, not on the keyword", () => {
    const pos = findScriptPosition(REGULAR_APP_SOURCE, PROBE_SYMBOL);
    assert.ok(pos, "no script position found in the regular probe component");
    assert.equal(textAt(REGULAR_APP_SOURCE, pos, PROBE_SYMBOL.length), PROBE_SYMBOL);
    assert.match(REGULAR_APP_SOURCE.split("\n")[pos.line], /^const /);
  });

  test("is a different position from the template one", () => {
    // The whole point of the gate: `benchMarker` is Ref<string> here and
    // `string` in the interpolation. One position cannot test both.
    const script = findScriptPosition(REGULAR_APP_SOURCE, PROBE_SYMBOL);
    const template = findTemplatePosition(REGULAR_APP_SOURCE, PROBE_SYMBOL);
    assert.notDeepEqual(script, template);
    assert.ok(script.line > template.line, "script setup follows the template in an SFC");
  });

  test("does not accept a longer identifier with the same prefix", () => {
    const src = `<script setup>\nconst benchMarkerTwo = ref('a')\n</script>\n`;
    assert.equal(findScriptPosition(src, "benchMarker"), null);
  });

  test("returns null rather than falling back to an unrelated line", () => {
    // The old heuristic returned {0,0} for a symbol it could not find, so a
    // renamed marker silently became "hover the first character of the file".
    assert.equal(findScriptPosition("<template>{{ benchMarker }}</template>", "benchMarker"), null);
    assert.equal(findScriptPosition("anything", null), null);
  });
});

describe("findFallbackPosition", () => {
  test("still returns a position for a workspace with no planted marker", () => {
    // Retained unchanged. Rows measured here are unranked — see classifyRow —
    // because no identifier chosen this way has a known-correct hover answer.
    const src = Array.from({ length: 20 }, (_, i) => `line ${i} withWord${i}`).join("\n");
    const pos = findFallbackPosition(src);
    assert.ok(pos.line >= 6, "should start ~30% into the file");
    assert.ok(Number.isInteger(pos.character));
  });

  test("degrades to the start of the file rather than throwing", () => {
    assert.deepEqual(findFallbackPosition(""), { line: 0, character: 0 });
  });
});

describe("generated probe components stay gateable", () => {
  for (const [name, source] of [
    ["regular", REGULAR_APP_SOURCE],
    ["monorepo", MONOREPO_BUTTON_SOURCE],
  ]) {
    test(`${name} declares and interpolates ${PROBE_SYMBOL}`, () => {
      const script = findScriptPosition(source, PROBE_SYMBOL);
      const template = findTemplatePosition(source, PROBE_SYMBOL);
      assert.ok(script, `${name} lost its \`const ${PROBE_SYMBOL}\` declaration`);
      assert.ok(template, `${name} lost its {{ ${PROBE_SYMBOL} }} interpolation`);
      // Declared as a ref, which is what makes the two positions disagree and
      // therefore what makes the template half of the gate discriminating.
      assert.match(source, new RegExp(`const ${PROBE_SYMBOL} = ref\\(`));
    });
  }

  test("the marker is the same identifier the LSP surface plants", () => {
    // The E2E gate reuses the LSP classifiers verbatim; they are hardcoded to
    // this name. Rename the fixture and the gate silently stops recognising it.
    assert.equal(PROBE_SYMBOL, "benchMarker");
    assert.equal(
      require("../../scripts/e2e-vscode/suite/hover-gate.cjs").HOVER_EXPECT_SYMBOL,
      PROBE_SYMBOL,
    );
  });
});
