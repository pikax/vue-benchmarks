/**
 * Completion content gates — regression guard.
 *
 * Every payload below is a VERBATIM capture from a real run of all four
 * language servers against the completion suite's own fixture, at the suite's
 * own positions (scripts/lib/ide-ops/suites/completion.mjs). Documentation
 * strings are dropped — they are megabytes and no gate reads them — and
 * nothing else is edited. The formatting IS the test: `:blurb` and `blurb?`
 * are the same correct answer, and a gate that fails either one has demoted a
 * server that did the work.
 *
 * The two failure modes this file exists to prevent, in order of damage:
 *
 *   1. FALSE FAIL — a correct server reported as unable to complete, because
 *      it spells its labels differently. Real precedent in this repo: a hover
 *      gate matching /\bstring\b/ failed a payload of `let x: stringStable
 *      hover target…` — a correct type with the doc comment run onto it. The
 *      completion equivalents are `blurb?` vs `:blurb` vs `blurb`.
 *
 *   2. FALSE PASS — a gate loose enough that any large list satisfies it. The
 *      traps here are not hypothetical; they are all present in real captured
 *      lists:
 *        - Volar's script-scope list contains `confirm` (a DOM global) and
 *          `if` (a TypeScript keyword). Had the fixture named its emit
 *          `confirm`, or had the directive gate accepted a bare `if`, a server
 *          that mis-mapped a template position into the generated render
 *          function would have passed a Vue-specific gate on TypeScript's
 *          globals.
 *        - Volar's tag list contains `caption`, `footer` and `title` — the
 *          obvious names for a prop and a slot are all HTML elements.
 *        - Verter's attribute list contains `onQuench?`, the props-object form
 *          of the emit, so accepting `onQuench` at the `@` position would let
 *          a server pass the event gate by returning the prop list.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  LIST_CONTEXTS,
  SUITE,
  describeItem,
  findAllExpected,
  findExpected,
  gateList,
  importEdits,
  importEditsAmong,
  itemNames,
  itemsOf,
  nearMisses,
  normalizeName,
  resolvedText,
} from "../../scripts/lib/ide-ops/suites/completion.mjs";

/** Expected-name alternates, read from the suite so the test cannot drift. */
const EXPECT = Object.fromEntries(LIST_CONTEXTS.map((c) => [c.id, c.expect]));

/* ══════════════════════ VERBATIM CAPTURES ══════════════════════ */

/**
 * Volar (@vue/language-server + typescript-language-server, hybrid).
 * Lists are the merged answer of both halves, as `ask` assembles them.
 */
const VOLAR = {
  // `const chosen = probe.|pinnacle` — 3 items, from the TypeScript half.
  member: [
    { label: "pinnacle", kind: 5, textEdit: { newText: ".pinnacle" } },
    { label: "quaver", kind: 5, textEdit: { newText: ".quaver" } },
    { label: "tessellate", kind: 2, textEdit: { newText: ".tessellate" } },
  ],

  // `<ChildCard :|tally="7">` — all 26 items, verbatim and in order.
  prop: [
    { label: "v-text", kind: 14, textEdit: { newText: "v-text" } },
    { label: "v-html", kind: 14, textEdit: { newText: "v-html" } },
    { label: "v-show", kind: 14, textEdit: { newText: "v-show" } },
    { label: "v-if", kind: 14, textEdit: { newText: "v-if" } },
    { label: "v-else", kind: 14, textEdit: { newText: "v-else" } },
    { label: "v-else-if", kind: 14, textEdit: { newText: "v-else-if" } },
    { label: "v-for", kind: 14, textEdit: { newText: 'v-for="${1:value} in ${2:source}"' } },
    { label: "v-on", kind: 14, textEdit: { newText: "v-on" } },
    { label: "v-bind", kind: 14, textEdit: { newText: "v-bind" } },
    { label: "v-model", kind: 14, textEdit: { newText: "v-model" } },
    { label: "v-slot", kind: 14, textEdit: { newText: "v-slot" } },
    { label: "v-pre", kind: 14, textEdit: { newText: "v-pre" } },
    { label: "v-once", kind: 14, textEdit: { newText: "v-once" } },
    { label: "v-memo", kind: 14, textEdit: { newText: "v-memo" } },
    { label: "v-cloak", kind: 14, textEdit: { newText: "v-cloak" } },
    { label: ":key", kind: 5, textEdit: { newText: ":key" } },
    { label: "ref", kind: 12, textEdit: { newText: "ref" } },
    { label: ":data-allow-mismatch", kind: 5, textEdit: { newText: ":data-allow-mismatch" } },
    { label: ":tally", kind: 5, textEdit: { newText: ":tally" } },
    { label: ":blurb", kind: 5, textEdit: { newText: ":blurb" } },
    { label: ":class", kind: 5, textEdit: { newText: ":class" } },
    { label: ":ref", kind: 5, textEdit: { newText: ":ref" } },
    { label: ":ref_for", kind: 5, textEdit: { newText: ":ref_for" } },
    { label: ":ref_key", kind: 5, textEdit: { newText: ":ref_key" } },
    { label: ":style", kind: 5, textEdit: { newText: ":style" } },
    { label: "data-", kind: 12, textEdit: { newText: 'data-$1="$2"' } },
  ],

  // `<ChildCard @|dismiss=…>` — all 25 items, verbatim and in order.
  event: [
    { label: "v-text", kind: 14, textEdit: { newText: "v-text" } },
    { label: "v-html", kind: 14, textEdit: { newText: "v-html" } },
    { label: "v-show", kind: 14, textEdit: { newText: "v-show" } },
    { label: "v-if", kind: 14, textEdit: { newText: "v-if" } },
    { label: "v-else", kind: 14, textEdit: { newText: "v-else" } },
    { label: "v-else-if", kind: 14, textEdit: { newText: "v-else-if" } },
    { label: "v-for", kind: 14, textEdit: { newText: 'v-for="${1:value} in ${2:source}"' } },
    { label: "v-on", kind: 14, textEdit: { newText: "v-on" } },
    { label: "v-bind", kind: 14, textEdit: { newText: "v-bind" } },
    { label: "v-model", kind: 14, textEdit: { newText: "v-model" } },
    { label: "v-slot", kind: 14, textEdit: { newText: "v-slot" } },
    { label: "v-pre", kind: 14, textEdit: { newText: "v-pre" } },
    { label: "v-once", kind: 14, textEdit: { newText: "v-once" } },
    { label: "v-memo", kind: 14, textEdit: { newText: "v-memo" } },
    { label: "v-cloak", kind: 14, textEdit: { newText: "v-cloak" } },
    { label: "ref", kind: 12, textEdit: { newText: "ref" } },
    { label: "@dismiss", kind: 23, textEdit: { newText: "@dismiss" } },
    { label: "@quench", kind: 23, textEdit: { newText: "@quench" } },
    { label: "@vnodeBeforeMount", kind: 23, textEdit: { newText: "@vnodeBeforeMount" } },
    { label: "@vnodeBeforeUnmount", kind: 23, textEdit: { newText: "@vnodeBeforeUnmount" } },
    { label: "@vnodeBeforeUpdate", kind: 23, textEdit: { newText: "@vnodeBeforeUpdate" } },
    { label: "@vnodeMounted", kind: 23, textEdit: { newText: "@vnodeMounted" } },
    { label: "@vnodeUnmounted", kind: 23, textEdit: { newText: "@vnodeUnmounted" } },
    { label: "@vnodeUpdated", kind: 23, textEdit: { newText: "@vnodeUpdated" } },
    { label: "data-", kind: 12, textEdit: { newText: 'data-$1="$2"' } },
  ],

  // `<div v-|show>` — 498 items; the matched one and its neighbours.
  directiveSlice: [
    { label: "v-show", kind: 14, textEdit: { newText: "v-show" } },
    { label: "v-if", kind: 14, textEdit: { newText: "v-if" } },
    { label: "key", kind: 12, textEdit: { newText: "key" } },
    { label: ":key", kind: 5, textEdit: { newText: ":key" } },
    { label: "title", kind: 12, textEdit: { newText: "title" } },
  ],

  // `<template #|masthead>` — 500 items; both slot names plus attribute decoys.
  slotSlice: [
    { label: "v-if", kind: 14, textEdit: { newText: 'v-if="$1"' } },
    { label: "v-slot", kind: 14, textEdit: { newText: 'v-slot="$1"' } },
    { label: "title", kind: 12, textEdit: { newText: 'title="$1"' } },
    { label: ":title", kind: 5, textEdit: { newText: ':title="$1"' } },
    { label: "epilogue?", kind: 5, insertText: "epilogue" },
    { label: "masthead?", kind: 5, insertText: "masthead" },
  ],

  // `<Ch|ildCard>` — 192 items. Note `caption`, `footer` and `title`: the
  // obvious fixture names for a prop and a slot are HTML elements and are
  // really in here.
  tagSlice: [
    { label: "ChildCard", kind: 6, textEdit: { newText: "ChildCard" } },
    { label: "SiblingCard", kind: 6, textEdit: { newText: "SiblingCard" } },
    { label: "caption", kind: 10, textEdit: { newText: "caption" } },
    { label: "div", kind: 10, textEdit: { newText: "div" } },
    { label: "footer", kind: 10, textEdit: { newText: "footer" } },
    { label: "title", kind: 10, textEdit: { newText: "title" } },
    {
      label: "ChildCard",
      kind: 5,
      labelDetails: { description: "./ChildCard.vue" },
      textEdit: { newText: "ChildCard" },
    },
  ],

  // `const derived = comput|` — 1018 items of TypeScript's script scope.
  // `confirm` and `if` are the two traps that decided the fixture naming and
  // the directive gate.
  autoImportSlice: [
    { label: "ChildCard", kind: 6 },
    { label: "confirm", kind: 3 },
    { label: "getComputedStyle", kind: 3 },
    { label: "if", kind: 14 },
    { label: "computed", kind: 6, detail: "vue" },
    { label: "computed", kind: 3, detail: "@vue/reactivity" },
    { label: "ComputedRefImpl", kind: 7, detail: "@vue/reactivity" },
  ],

  // completionItem/resolve, Vue half — throws on an item it did not produce.
  resolveVueHalfError:
    '{"code":-32603,"message":"Request completionItem/resolve failed with message: Cannot read properties of undefined (reading \'1\')"}',

  // completionItem/resolve, TypeScript half, on the `computed` item.
  // The import edit contains NO `import` keyword: it widens the existing
  // `import { ref } from 'vue'` by inserting `computed, ` inside the braces.
  resolvedAutoImport: {
    label: "computed",
    kind: 6,
    detail:
      "Auto import from 'vue'\nconst computed: {\n    <T>(getter: ComputedGetter<T>, debugOptions?: DebuggerOptions): ComputedRef<T>;\n    <T, S = T>(options: WritableComputedOptions<T, S>, debugOptions?: DebuggerOptions): WritableComputedRef<T, S>;\n}",
    additionalTextEdits: [
      {
        range: { start: { line: 13, character: 9 }, end: { line: 13, character: 9 } },
        newText: "computed, ",
      },
    ],
  },

  resolvedMember: {
    label: "quaver",
    kind: 5,
    detail: "(property) quaver: string",
    textEdit: { newText: ".quaver" },
    filterText: ".quaver",
  },
};

/** Volar on the TNB / tsgo tsdk: same lists, but the resolve crashes. */
const VOLAR_TNB = {
  resolveTsHalfError:
    '{"code":1,"message":"<main> TypeScript Server Error (6.0.3-bridge.6.tsgo.7.0.2)\\nDebug Failure. False expression.\\nError: Debug Failure. False expression.\\n    at getCompletionEntryCodeActionsAndSourceDisplay (...typescript.js:181686:9)"}',
  // The list item is identical to Volar's; only the resolve differs.
  autoImportMatches: [
    { label: "computed", kind: 6, detail: "vue" },
    { label: "computed", kind: 3, detail: "@vue/reactivity" },
  ],
};

/** Vize LSP (single process). */
const VIZE = {
  member: [],

  prop: [
    {
      label: "v-bind",
      kind: 10,
      detail: "Attribute binding",
      labelDetails: { description: "Vue directive" },
      textEdit: { newText: 'v-bind:$1="$2"' },
    },
    {
      label: ":",
      kind: 10,
      detail: "Bind shorthand",
      labelDetails: { description: "Vue directive" },
      textEdit: { newText: ':$1="$2"' },
    },
  ],

  event: [
    { label: "v-on", kind: 23, detail: "Event listener", textEdit: { newText: 'v-on:$1="$2"' } },
    { label: "@", kind: 23, detail: "Event shorthand", textEdit: { newText: '@$1="$2"' } },
    { label: "@click", kind: 23, detail: "Click event", textEdit: { newText: '@click="$1"' } },
    { label: "@input", kind: 23, detail: "Input event", textEdit: { newText: '@input="$1"' } },
    { label: "@change", kind: 23, detail: "Change event", textEdit: { newText: '@change="$1"' } },
    { label: "@submit", kind: 23, detail: "Submit event", textEdit: { newText: '@submit="$1"' } },
    { label: "@keydown", kind: 23, detail: "Key down event", textEdit: { newText: '@keydown="$1"' } },
    { label: "@keyup", kind: 23, detail: "Key up event", textEdit: { newText: '@keyup="$1"' } },
    { label: "@focus", kind: 23, detail: "Focus event", textEdit: { newText: '@focus="$1"' } },
    { label: "@blur", kind: 23, detail: "Blur event", textEdit: { newText: '@blur="$1"' } },
    {
      label: "@mouseenter",
      kind: 23,
      detail: "Mouse enter event",
      textEdit: { newText: '@mouseenter="$1"' },
    },
    {
      label: "@mouseleave",
      kind: 23,
      detail: "Mouse leave event",
      textEdit: { newText: '@mouseleave="$1"' },
    },
  ],

  directive: [
    {
      label: "v-if",
      kind: 14,
      detail: "Conditional rendering",
      labelDetails: { description: "Vue directive" },
      textEdit: { newText: 'v-if="$1"' },
    },
    { label: "v-else-if", kind: 14, detail: "Else-if block", textEdit: { newText: 'v-else-if="$1"' } },
    { label: "v-else", kind: 14, detail: "Else block", textEdit: { newText: "v-else" } },
    { label: "v-for", kind: 14, detail: "List rendering", textEdit: { newText: 'v-for="$1 in $2" :key="$3"' } },
    { label: "v-on", kind: 23, detail: "Event listener", textEdit: { newText: 'v-on:$1="$2"' } },
    { label: "v-bind", kind: 10, detail: "Attribute binding", textEdit: { newText: 'v-bind:$1="$2"' } },
    { label: "v-model", kind: 10, detail: "Two-way binding", textEdit: { newText: 'v-model="$1"' } },
    { label: "v-slot", kind: 5, detail: "Named slot", textEdit: { newText: "v-slot:$1" } },
    { label: "v-show", kind: 14, detail: "Toggle visibility", textEdit: { newText: 'v-show="$1"' } },
    { label: "v-pre", kind: 14, detail: "Skip compilation", textEdit: { newText: "v-pre" } },
    { label: "v-once", kind: 14, detail: "Render once", textEdit: { newText: "v-once" } },
    { label: "v-memo", kind: 14, detail: "Memoize subtree", textEdit: { newText: 'v-memo="[$1]"' } },
    { label: "v-cloak", kind: 14, detail: "Hide until compiled", textEdit: { newText: "v-cloak" } },
    { label: "v-text", kind: 14, detail: "Set text content", textEdit: { newText: 'v-text="$1"' } },
    { label: "v-html", kind: 14, detail: "Set innerHTML", textEdit: { newText: 'v-html="$1"' } },
  ],

  // `<template #|masthead>` — 28 items, none of them a slot name. Note the
  // `#`-prefixed textEdits: `#v-if="$1"` normalises to `v-if`, which is why
  // this list is also used to prove the slot gate does not match on them.
  slotSlice: [
    { label: "v-if", kind: 14, detail: "Conditional rendering", textEdit: { newText: '#v-if="$1"' } },
    { label: "v-slot", kind: 5, detail: "Named slot", textEdit: { newText: "v-slot:$1" } },
    { label: "#", kind: 5, detail: "Slot shorthand", textEdit: { newText: "#$1" } },
    { label: "@click", kind: 23, detail: "Click event", textEdit: { newText: '#@click="$1"' } },
    { label: ":", kind: 10, detail: "Bind shorthand", textEdit: { newText: '#:$1="$2"' } },
  ],

  // `<Ch|ildCard>` — 42 items, directives and DOM events. No component names.
  tagSlice: [
    { label: "v-if", kind: 14, detail: "Conditional rendering", textEdit: { newText: 'v-if="$1"' } },
    { label: "v-for", kind: 14, detail: "List rendering", textEdit: { newText: 'v-for="$1 in $2" :key="$3"' } },
    { label: "@click", kind: 23, detail: "Click event", textEdit: { newText: '@click="$1"' } },
    { label: ":", kind: 10, detail: "Bind shorthand", textEdit: { newText: ':$1="$2"' } },
  ],

  // The two `computed` entries. Neither carries an import edit; the second
  // would insert an import STATEMENT at the expression position, producing
  // `const derived = import { computed } from 'vue'`.
  autoImportComputed: [
    { label: "computed", kind: 3, detail: "function computed<T>(getter: () => T): ComputedRef<T>" },
    {
      label: "import computed",
      kind: 9,
      detail: "Import computed from Vue",
      insertText: "import { computed } from 'vue'",
    },
  ],

  // Resolve echoes the item unchanged — detail and documentation were already
  // on the list item.
  resolvedAutoImport: {
    label: "computed",
    kind: 3,
    detail: "function computed<T>(getter: () => T): ComputedRef<T>",
    documentation:
      "**computed**\n\n_Vue API_\n\n```typescript\nfunction computed<T>(getter: () => T): ComputedRef<T>\n```\n\nCreate a computed property\n\n**Docs**\n\n[Vue API](https://vuejs.org/api/)",
  },
};

/** Verter LSP (single process). */
const VERTER = {
  member: [
    { label: "pinnacle", kind: 5 },
    { label: "quaver", kind: 5 },
    { label: "tessellate", kind: 2 },
  ],

  // `<ChildCard :|tally>` — all 16 items. Labels carry the optional-prop `?`
  // and the clean name is in insertText. `onQuench?` is the props-object form
  // of the emit and is the reason the event gate rejects `onQuench`.
  prop: [
    { label: "onVnodeBeforeMount?", kind: 5, insertText: "onVnodeBeforeMount" },
    { label: "onVnodeMounted?", kind: 5, insertText: "onVnodeMounted" },
    { label: "onVnodeBeforeUpdate?", kind: 5, insertText: "onVnodeBeforeUpdate" },
    { label: "onVnodeUpdated?", kind: 5, insertText: "onVnodeUpdated" },
    { label: "onVnodeBeforeUnmount?", kind: 5, insertText: "onVnodeBeforeUnmount" },
    { label: "onVnodeUnmounted?", kind: 5, insertText: "onVnodeUnmounted" },
    { label: "class?", kind: 5, insertText: "class" },
    { label: "style?", kind: 5, insertText: "style" },
    { label: "key?", kind: 5, insertText: "key" },
    { label: "ref?", kind: 5, insertText: "ref" },
    { label: "ref_for?", kind: 5, insertText: "ref_for" },
    { label: "ref_key?", kind: 5, insertText: "ref_key" },
    { label: "blurb?", kind: 5, insertText: "blurb" },
    { label: "tally", kind: 5 },
    { label: "onQuench?", kind: 5, insertText: "onQuench" },
    { label: "onDismiss?", kind: 5, insertText: "onDismiss" },
  ],

  event: [],
  slot: [],

  // `<div v-|show>` — SFC block completions, leaked into a template position.
  directive: [
    {
      label: "style scoped",
      kind: 15,
      detail: "Add <style scoped> block",
      insertText: "<style scoped>\n$0\n</style>",
      textEdit: { newText: "<style scoped>\n$0\n</style>" },
    },
    {
      label: "style",
      kind: 15,
      detail: "Add <style> block",
      insertText: "<style>\n$0\n</style>",
      textEdit: { newText: "<style>\n$0\n</style>" },
    },
    {
      label: "i18n",
      kind: 15,
      detail: "Add <i18n> block",
      insertText: '<i18n lang="${1:json}">\n$0\n</i18n>',
      textEdit: { newText: '<i18n lang="${1:json}">\n$0\n</i18n>' },
    },
  ],

  // `const derived = comput|` — all 9 items: locals and existing imports only.
  autoImport: [
    { label: "headline", kind: 6, detail: "const" },
    { label: "visible", kind: 6, detail: "const" },
    { label: "probe", kind: 6, detail: "const" },
    { label: "chosen", kind: 6, detail: "const" },
    { label: "onDismiss", kind: 3, detail: "function" },
    { label: "derived", kind: 6, detail: "const" },
    { label: "ref", kind: 9, detail: "from 'vue'" },
    { label: "ChildCard", kind: 9, detail: "from './ChildCard.vue'" },
    { label: "SiblingCard", kind: 9, detail: "from './SiblingCard.vue'" },
  ],

  tagSlice: [
    { label: "ChildCard", kind: 6, detail: "from './ChildCard.vue'" },
    { label: "ChildCard", kind: 7, detail: "from './ChildCard.vue'" },
    { label: "div", kind: 5, detail: "HTML element" },
    { label: "span", kind: 5, detail: "HTML element" },
  ],

  resolvedMember: { label: "quaver", kind: 5, detail: "(property) quaver: string" },
};

/* ══════════════════════════ normalizeName ══════════════════════════ */

describe("normalizeName — the same answer spelled four ways", () => {
  test("binding punctuation is presentation, not identity", () => {
    // Volar `:blurb`, Verter `blurb?`, a hypothetical plain `blurb`.
    assert.equal(normalizeName(":blurb"), "blurb");
    assert.equal(normalizeName("blurb?"), "blurb");
    assert.equal(normalizeName("blurb"), "blurb");
    assert.equal(normalizeName("v-bind:blurb"), "blurb");

    assert.equal(normalizeName("@quench"), "quench");
    assert.equal(normalizeName("v-on:quench"), "quench");

    assert.equal(normalizeName("#epilogue"), "epilogue");
    assert.equal(normalizeName("epilogue?"), "epilogue");
    assert.equal(normalizeName("v-slot:epilogue"), "epilogue");

    // Volar's member textEdit is `.quaver`, its label is `quaver`.
    assert.equal(normalizeName(".quaver"), "quaver");
  });

  test("an attribute or snippet tail is stripped", () => {
    assert.equal(normalizeName('v-if="$1"'), "vif"); // Vize's real textEdit
    assert.equal(normalizeName('v-for="${1:value} in ${2:source}"'), "vfor"); // Volar's real textEdit
    assert.equal(normalizeName('blurb=""'), "blurb");
  });

  test("kebab and camel are the same name in a Vue template", () => {
    assert.equal(normalizeName("ChildCard"), normalizeName("child-card"));
    assert.equal(normalizeName("quenchRequest"), normalizeName("quench-request"));
    assert.equal(normalizeName("@quench-request"), normalizeName("quenchRequest"));
  });

  test("the `v-` of a directive is NOT stripped", () => {
    // Stripping it would make `if` match `v-if`, and `if` is a TypeScript
    // keyword that really appears in Volar's script-scope list below.
    assert.notEqual(normalizeName("v-if"), normalizeName("if"));
    assert.equal(normalizeName("v-if"), "vif");
  });

  test("empty and nullish inputs normalise to the empty string", () => {
    for (const raw of [null, undefined, "", "   "]) assert.equal(normalizeName(raw), "");
  });
});

describe("itemNames — the clean name may be in any field", () => {
  test("reads label, insertText, textEdit and filterText", () => {
    // Verter puts the decorated name in label and the clean one in insertText.
    assert.ok(itemNames({ label: "blurb?", insertText: "blurb" }).has("blurb"));
    // Volar puts the clean name in label and a dotted one in textEdit.
    const names = itemNames(VOLAR.member[1]);
    assert.ok(names.has("quaver"), `expected quaver in ${[...names]}`);
  });

  test("an item with nothing usable yields no names", () => {
    assert.equal(itemNames({}).size, 0);
    assert.equal(itemNames(null).size, 0);
  });
});

/* ═══════════════════ the six list contexts, per server ═══════════════════ */

describe("script member gate", () => {
  test("passes on Volar's real 3-item list", () => {
    const r = gateList({ items: VOLAR.member, expect: EXPECT["completion-script-member"], what: "x" });
    assert.equal(r.valid, true);
    assert.equal(r.artifact, 3);
  });

  test("passes on Verter's real list, which carries no textEdit at all", () => {
    assert.equal(
      gateList({ items: VERTER.member, expect: EXPECT["completion-script-member"], what: "x" }).valid,
      true,
    );
  });

  test("fails on Vize's real empty list, and says so", () => {
    const r = gateList({ items: VIZE.member, expect: EXPECT["completion-script-member"], what: "`quaver`" });
    assert.equal(r.valid, false);
    assert.match(r.reason, /no `quaver` in 0 items/);
    assert.equal(r.sample, "(empty list)");
    assert.equal(r.artifact, 0);
  });
});

describe("component tag gate", () => {
  test("passes on Volar's real list", () => {
    assert.equal(
      gateList({ items: VOLAR.tagSlice, expect: EXPECT["completion-component-tag"], what: "x" }).valid,
      true,
    );
  });

  test("passes on Verter's real list", () => {
    assert.equal(
      gateList({ items: VERTER.tagSlice, expect: EXPECT["completion-component-tag"], what: "x" }).valid,
      true,
    );
  });

  test("fails on Vize's real list of directives and DOM events", () => {
    assert.equal(
      gateList({ items: VIZE.tagSlice, expect: EXPECT["completion-component-tag"], what: "x" }).valid,
      false,
    );
  });
});

describe("prop-name gate", () => {
  test("passes Volar's `:blurb`", () => {
    const r = gateList({ items: VOLAR.prop, expect: EXPECT["completion-prop-name"], what: "x" });
    assert.equal(r.valid, true);
    assert.equal(r.artifact, 26);
    assert.match(r.sample, /":blurb"/);
  });

  test("passes Verter's `blurb?` — the optional marker must not fail a correct server", () => {
    const r = gateList({ items: VERTER.prop, expect: EXPECT["completion-prop-name"], what: "x" });
    assert.equal(r.valid, true, `should pass but failed: ${r.reason}`);
  });

  test("fails Vize's two-item shorthand list", () => {
    const r = gateList({ items: VIZE.prop, expect: EXPECT["completion-prop-name"], what: "`blurb`" });
    assert.equal(r.valid, false);
    assert.equal(r.sample, "[v-bind, :]");
  });

  test("a list of every Vue directive is not a prop list", () => {
    // Vize's directive list is 15 real, correct directives — and still not an
    // answer to "what props does this component take".
    assert.equal(
      gateList({ items: VIZE.directive, expect: EXPECT["completion-prop-name"], what: "x" }).valid,
      false,
    );
  });
});

describe("event-name gate", () => {
  test("passes Volar's `@quench`", () => {
    const r = gateList({ items: VOLAR.event, expect: EXPECT["completion-event-name"], what: "x" });
    assert.equal(r.valid, true);
    assert.equal(r.artifact, 25);
  });

  test("fails Vize's DOM-event list, which never mentions the declared emit", () => {
    const r = gateList({ items: VIZE.event, expect: EXPECT["completion-event-name"], what: "`quench`" });
    assert.equal(r.valid, false);
    assert.match(r.sample, /@click/);
  });

  test("fails Verter's empty list", () => {
    assert.equal(
      gateList({ items: VERTER.event, expect: EXPECT["completion-event-name"], what: "x" }).valid,
      false,
    );
  });

  test("the PROP list does not satisfy the EVENT gate", () => {
    // Verter's real attribute list contains `onQuench?`. If the gate accepted
    // the props-object form, a server could pass the `@` context by returning
    // the `:` context's answer — exactly the distinction this row exists for.
    assert.ok(
      VERTER.prop.some((i) => i.label === "onQuench?"),
      "fixture drift: the capture no longer contains onQuench?",
    );
    assert.equal(
      gateList({ items: VERTER.prop, expect: EXPECT["completion-event-name"], what: "x" }).valid,
      false,
    );
  });

  test("but a server that LABELS it onQuench and INSERTS quench still passes", () => {
    // The rejection above must not become a false-fail for a server that
    // presents the prop-style label with the correct insertion.
    const items = [{ label: "onQuench?", kind: 23, insertText: "quench" }];
    assert.equal(
      gateList({ items, expect: EXPECT["completion-event-name"], what: "x" }).valid,
      true,
    );
  });
});

describe("directive gate", () => {
  test("passes Volar's `v-if`", () => {
    assert.equal(
      gateList({ items: VOLAR.directiveSlice, expect: EXPECT["completion-directive"], what: "x" }).valid,
      true,
    );
  });

  test("passes Vize's `v-if`, whose textEdit is the snippet `v-if=\"$1\"`", () => {
    const r = gateList({ items: VIZE.directive, expect: EXPECT["completion-directive"], what: "x" });
    assert.equal(r.valid, true, `should pass but failed: ${r.reason}`);
    assert.equal(r.artifact, 15);
  });

  test("fails Verter's SFC-block completions", () => {
    const r = gateList({ items: VERTER.directive, expect: EXPECT["completion-directive"], what: "`v-if`" });
    assert.equal(r.valid, false);
    assert.equal(r.sample, "[style scoped, style, i18n]");
  });

  test("a TypeScript keyword list containing `if` does NOT pass", () => {
    // The false pass this gate is designed to refuse. `{label:"if",kind:14}` is
    // lifted verbatim from Volar's script-scope list: a server that mis-mapped
    // a template attribute position into the generated render function would
    // return exactly this and must not be credited with directive completion.
    assert.ok(
      VOLAR.autoImportSlice.some((i) => i.label === "if"),
      "fixture drift: the capture no longer contains the `if` keyword",
    );
    assert.equal(
      gateList({ items: VOLAR.autoImportSlice, expect: EXPECT["completion-directive"], what: "x" }).valid,
      false,
    );
  });
});

describe("slot-name gate", () => {
  test("passes Volar's `epilogue?`", () => {
    const r = gateList({ items: VOLAR.slotSlice, expect: EXPECT["completion-slot-name"], what: "x" });
    assert.equal(r.valid, true);
    assert.match(r.sample, /"epilogue\?"/);
  });

  test("fails Vize's list, whose `#`-prefixed textEdits normalise to directives", () => {
    // `#v-if="$1"` normalises to `v-if`; nothing in the list normalises to a
    // slot name, so the gate must still fail.
    const r = gateList({ items: VIZE.slotSlice, expect: EXPECT["completion-slot-name"], what: "x" });
    assert.equal(r.valid, false);
  });

  test("fails Verter's empty list", () => {
    assert.equal(
      gateList({ items: VERTER.slot, expect: EXPECT["completion-slot-name"], what: "x" }).valid,
      false,
    );
  });

  test("the tag list — which really contains `footer` — does not pass the slot gate", () => {
    // Had the fixture named its slot `footer`, Volar's tag list would have
    // satisfied the slot gate with an HTML element.
    assert.ok(VOLAR.tagSlice.some((i) => i.label === "footer"), "fixture drift");
    assert.equal(
      gateList({ items: VOLAR.tagSlice, expect: EXPECT["completion-slot-name"], what: "x" }).valid,
      false,
    );
  });
});

/* ════════════════════════ the naming decisions ════════════════════════ */

describe("fixture naming — proven against the real lists", () => {
  const everyExpected = LIST_CONTEXTS.flatMap((c) => c.expect);

  test("no Vue-specific expected name appears in TypeScript's script scope", () => {
    // `confirm` (a DOM global) and `if` (a keyword) are in this list. The
    // fixture names are not, which is why a server answering the wrong context
    // with TypeScript's globals cannot pass a Vue-specific gate.
    assert.ok(VOLAR.autoImportSlice.some((i) => i.label === "confirm"), "fixture drift");
    const componentNames = new Set(EXPECT["completion-component-tag"].map(normalizeName));
    for (const name of everyExpected) {
      if (componentNames.has(normalizeName(name))) continue; // see the next test
      assert.equal(
        Boolean(findExpected(VOLAR.autoImportSlice, [name])),
        false,
        `${name} is present in TypeScript's script scope and must not be an expected name`,
      );
    }
  });

  test("the component-tag gate's known limitation, locked", () => {
    // `ChildCard` is the ONE expected name that is also a `<script setup>`
    // binding, because a locally-imported component has to be. So the tag gate
    // cannot distinguish "offered the component" from "offered every
    // identifier in scope" — it is a label gate, as specified, and the matched
    // item's kind and detail go into `sample` so a reader can tell.
    //
    // This test exists so the caveat cannot silently change: if the fixture
    // ever stops importing the component into script scope, the limitation is
    // gone and this assertion should be deleted along with the caveat in the
    // suite header.
    assert.ok(
      findExpected(VOLAR.autoImportSlice, EXPECT["completion-component-tag"]),
      "ChildCard is expected to appear in script scope; if it no longer does, the tag gate's documented caveat is stale",
    );
    // The real tag lists carry the discriminating evidence in kind/detail.
    const volarHit = findExpected(VOLAR.tagSlice, EXPECT["completion-component-tag"]);
    const verterHit = findExpected(VERTER.tagSlice, EXPECT["completion-component-tag"]);
    assert.ok(
      VOLAR.tagSlice.some((i) => i.labelDetails?.description === "./ChildCard.vue"),
      "Volar's tag list should name the component's source file",
    );
    assert.match(describeItem(verterHit), /ChildCard\.vue/);
    assert.match(describeItem(volarHit), /kind=/);
  });

  test("the obvious names would all have been traps", () => {
    // Every one of these is in a real captured list at the wrong context.
    for (const trap of ["caption", "footer", "title"]) {
      assert.ok(
        findExpected(VOLAR.tagSlice, [trap]),
        `${trap} should be in the tag list — it is an HTML element`,
      );
    }
    assert.ok(findExpected(VOLAR.autoImportSlice, ["confirm"]));
  });
});

/* ═══════════════════════════ auto-import ═══════════════════════════ */

describe("importEdits — both real shapes of an import edit", () => {
  test("accepts Volar's edit, which contains no `import` keyword", () => {
    // `newText: "computed, "` widens the existing `import { ref } from 'vue'`.
    // A gate matching /import/ would have failed a correct auto-import.
    const edits = importEdits(VOLAR.resolvedAutoImport, "computed");
    assert.equal(edits.length, 1);
    assert.equal(edits[0].newText, "computed, ");
  });

  test("accepts a whole new import statement", () => {
    const item = {
      label: "computed",
      additionalTextEdits: [{ newText: "import { computed } from 'vue'\n" }],
    };
    assert.equal(importEdits(item, "computed").length, 1);
  });

  test("rejects an edit that only looks similar", () => {
    const item = { label: "computed", additionalTextEdits: [{ newText: "getComputedStyle, " }] };
    assert.equal(importEdits(item, "computed").length, 0);
  });

  test("an item with no additionalTextEdits has no import edit", () => {
    assert.equal(importEdits(VIZE.resolvedAutoImport, "computed").length, 0);
    assert.equal(importEdits(VERTER.member[1], "computed").length, 0);
    assert.equal(importEdits(null, "computed").length, 0);
  });

  test("importEditsAmong scans every entry for the symbol, not just the first", () => {
    const items = [
      { label: "computed", kind: 6, detail: "vue" },
      { label: "computed", kind: 3, additionalTextEdits: [{ newText: "computed, " }] },
    ];
    assert.equal(importEditsAmong(items, "computed").length, 1);
    assert.equal(importEditsAmong(VOLAR_TNB.autoImportMatches, "computed").length, 0);
  });
});

describe("auto-import item detection", () => {
  test("finds both of Volar's `computed` entries and neither decoy", () => {
    const matches = findAllExpected(VOLAR.autoImportSlice, ["computed"]);
    assert.equal(matches.length, 2);
    assert.deepEqual(
      matches.map((m) => m.detail),
      ["vue", "@vue/reactivity"],
    );
    // getComputedStyle and ComputedRefImpl must not match.
    assert.ok(!matches.some((m) => m.label !== "computed"));
  });

  test("Vize's `import computed` entry is not accepted as the symbol", () => {
    // Its insertText places `import { computed } from 'vue'` at the cursor,
    // producing `const derived = import { computed } from 'vue'`. That is not
    // an auto-import and normalises to `importcomputedfromvue`.
    const [plain, importStatement] = VIZE.autoImportComputed;
    assert.equal(Boolean(findExpected([plain], ["computed"])), true);
    assert.equal(Boolean(findExpected([importStatement], ["computed"])), false);
    assert.equal(normalizeName(importStatement.insertText), "importcomputedfromvue");
  });

  test("Verter's list has no `computed` at all", () => {
    assert.equal(findAllExpected(VERTER.autoImport, ["computed"]).length, 0);
    // ...but `ChildCard` is there, so the list is real, not empty-by-accident.
    assert.ok(findExpected(VERTER.autoImport, ["ChildCard"]));
  });

  test("nearMisses surfaces what the server offered instead", () => {
    const misses = nearMisses(VIZE.autoImportComputed, "computed");
    assert.equal(misses.length, 2);
    assert.match(describeItem(misses[1]), /import computed/);
    assert.match(describeItem(misses[1]), /import \{ computed \} from 'vue'/);
  });
});

/* ════════════════════════ completionItem/resolve ════════════════════════ */

describe("resolve payloads", () => {
  test("Volar's TypeScript half fills in the member type", () => {
    assert.equal(resolvedText(VOLAR.resolvedMember), "(property) quaver: string");
    assert.ok(itemNames(VOLAR.resolvedMember).has("quaver"));
  });

  test("Verter's resolve fills in the same type without a textEdit", () => {
    assert.equal(resolvedText(VERTER.resolvedMember), "(property) quaver: string");
    assert.ok(itemNames(VERTER.resolvedMember).has("quaver"));
  });

  test("Vize's resolve echoes an item that already carried detail and docs", () => {
    // Pre-filling is a legitimate strategy, so the gate asks whether the
    // editor ends up with a usable item, not whether the round-trip added
    // bytes. It does not, however, produce an import edit.
    const text = resolvedText(VIZE.resolvedAutoImport);
    assert.ok(text.includes("function computed<T>"));
    assert.ok(text.includes("Create a computed property"));
    assert.equal(importEdits(VIZE.resolvedAutoImport, "computed").length, 0);
  });

  test("resolvedText tolerates every documentation shape LSP allows", () => {
    assert.equal(resolvedText({ documentation: "plain" }), "plain");
    assert.equal(resolvedText({ documentation: { kind: "markdown", value: "md" } }), "md");
    assert.equal(resolvedText({ detail: "d", documentation: { value: "m" } }), "d\nm");
    assert.equal(resolvedText({}), "");
    assert.equal(resolvedText(null), "");
  });
});

/* ═══════════════════ the resolve gate, through the suite ══════════════════ */

/**
 * The resolve gate is not one of the helpers above. It lives inside
 * SUITE.measure(), where it reads what the fan-out got back from each half —
 * an item, an error, or both — and decides `valid`, `reason` and `sample`. So
 * the two resolve captures are fed to it the only way that exercises it: by
 * running the suite's own measure() over a context whose halves return them.
 *
 * Nothing below re-implements a gate. The inputs are the captured lists and
 * each half's resolve behaviour; the fan-out, the richest-answer pick, the
 * import-edit test and every verdict in the result are production code.
 */

/** Every probe measure() asks for, as the identity token the fake `ask` keys on. */
const PROBE_IDS = [
  "member",
  "tag",
  "prop",
  "event",
  "directive",
  "slot",
  "autoImport",
  "warmScript",
  "warmTemplate",
  "warmAttribute",
  "warmComponentAttribute",
];

/**
 * Lists that satisfy measure()'s untimed readiness poll — `visible.value` from
 * the script pipeline, SiblingCard's `ballast` from the component one. Neither
 * is a measured context and neither computes an answer a gate below asks for;
 * without them every case spends the poll's whole ~2.2s budget first.
 */
const READY_LISTS = {
  warmScript: [{ label: "value", kind: 5 }],
  warmComponentAttribute: [{ label: ":ballast", kind: 5 }],
};

/**
 * Run the suite over captured payloads; returns its ops keyed by id.
 *
 * `client` is the Vue half and `hybrid` the TypeScript half, as createSession()
 * assembles them. A half fails by throwing an Error whose message is the
 * captured JSON verbatim: LspClient rejects with
 * `new Error(JSON.stringify(msg.error))`, so that string is exactly what the
 * suite reads off the wire.
 */
async function runMeasure({ lists, vueHalf, tsHalf }) {
  const all = { ...READY_LISTS, ...lists };
  const half = (fn) => async (_method, item) => fn(item);
  const ops = await SUITE.measure({
    server: { id: "capture" },
    verbose: false,
    ws: {
      file: "/bench/Host.vue",
      source: "",
      probes: Object.fromEntries(PROBE_IDS.map((id) => [id, { probe: id }])),
    },
    pathToFileUri: (file) => `file://${file}`,
    openDoc() {},
    ask: async (_method, params) => ({
      items: all[params.position.probe] ?? [],
      isIncomplete: false,
    }),
    client: { sendRequest: half(vueHalf) },
    hybrid: { request: half(tsHalf) },
  });
  return Object.fromEntries(ops.map((op) => [op.id, op]));
}

/** A half that rejects, the way LspClient surfaces a server error. */
const rejectsWith = (message) => () => {
  throw new Error(message);
};

describe("resolve gate — the captured payloads, through measure()", () => {
  test("one half rejecting does not fail a resolve the other half answered", async () => {
    // Volar's Vue half throws on an item the TypeScript half produced. This is
    // why the suite fans resolve out tolerantly instead of using `ask`, which
    // awaits Promise.all and would have failed 100% of Volar's resolves.
    const ops = await runMeasure({
      lists: { autoImport: VOLAR.autoImportSlice, member: VOLAR.member },
      vueHalf: rejectsWith(VOLAR.resolveVueHalfError),
      tsHalf: (item) =>
        itemNames(item).has("computed") ? VOLAR.resolvedAutoImport : VOLAR.resolvedMember,
    });
    const resolve = ops["resolve-auto-import"];
    assert.equal(resolve.valid, true, `should pass but failed: ${resolve.reason}`);
    assert.equal(resolve.reason, "");
    assert.match(resolve.sample, /edit "computed, "/);
    // The list gate this resolve completes is not downgraded either.
    assert.equal(ops["completion-auto-import"].valid, true);

    // CONTROL — the pass above is earned by the import edit, not by the gate
    // ignoring a half that failed. Same rejection from the Vue half, and the
    // TypeScript half's own answer with its additionalTextEdits removed: the
    // verdict flips, and the surviving error is quoted on the row.
    const control = await runMeasure({
      lists: { autoImport: VOLAR.autoImportSlice, member: VOLAR.member },
      vueHalf: rejectsWith(VOLAR.resolveVueHalfError),
      tsHalf: () => ({ ...VOLAR.resolvedAutoImport, additionalTextEdits: [] }),
    });
    assert.equal(control["resolve-auto-import"].valid, false);
    assert.match(control["resolve-auto-import"].reason, /no import edit for `computed`/);
    assert.match(control["resolve-auto-import"].reason, /Cannot read properties of undefined/);
    assert.equal(control["completion-auto-import"].valid, false);
  });

  test("the tsgo tsdk crash fails the resolve and is named in the reason", async () => {
    // Volar/TNB offers the `computed` item and then cannot resolve it. Its Vue
    // half is the same @vue/language-server as the row above — only the tsdk
    // differs — so it rejects the item it did not produce with the same error,
    // and BOTH halves fail. Collapsed to a single value, the row would have
    // carried the Vue half's misleading "not my item" error and discarded the
    // actual defect; the gate must keep the crash.
    const ops = await runMeasure({
      lists: { autoImport: VOLAR_TNB.autoImportMatches, member: VOLAR.member },
      vueHalf: rejectsWith(VOLAR.resolveVueHalfError),
      tsHalf: rejectsWith(VOLAR_TNB.resolveTsHalfError),
    });
    const resolve = ops["resolve-auto-import"];
    assert.equal(resolve.valid, false);
    assert.match(resolve.reason, /Debug Failure/);
    assert.match(resolve.reason, /getCompletionEntryCodeActionsAndSourceDisplay/);
    assert.match(resolve.reason, /Cannot read properties of undefined/);
    // The auto-import list gate is completed from this resolve, so it is
    // downgraded too rather than reporting an import the editor never gets.
    assert.equal(ops["completion-auto-import"].valid, false);
    assert.match(ops["completion-auto-import"].reason, /no import edit on any entry/);

    // CONTROL — the failure belongs to the payload, not to this harness. The
    // same two-item list, with the TypeScript half answering as it does on the
    // stock tsdk, turns both ops green.
    const control = await runMeasure({
      lists: { autoImport: VOLAR_TNB.autoImportMatches, member: VOLAR.member },
      vueHalf: rejectsWith(VOLAR.resolveVueHalfError),
      tsHalf: () => VOLAR.resolvedAutoImport,
    });
    assert.equal(control["resolve-auto-import"].valid, true);
    assert.equal(control["resolve-auto-import"].reason, "");
    assert.equal(control["completion-auto-import"].valid, true);
  });
});

/* ═════════════════════════ result-shape handling ═════════════════════════ */

describe("itemsOf — every shape LSP allows for a completion result", () => {
  test("CompletionList, CompletionItem[], null", () => {
    assert.equal(itemsOf({ items: VOLAR.member, isIncomplete: false }).length, 3);
    assert.equal(itemsOf(VOLAR.member).length, 3);
    assert.equal(itemsOf(null).length, 0);
    assert.equal(itemsOf(undefined).length, 0);
    assert.equal(itemsOf({}).length, 0);
  });
});

describe("gate cannot be satisfied by size alone", () => {
  test("Verter's 1194-item tag list fails five of the six gates", () => {
    // It passes the tag gate because `ChildCard` is genuinely in it, and fails
    // everything else — a big list is not a pass.
    const passing = LIST_CONTEXTS.filter(
      (c) => gateList({ items: VERTER.tagSlice, expect: c.expect, what: "x" }).valid,
    ).map((c) => c.id);
    assert.deepEqual(passing, ["completion-component-tag"]);
  });

  test("every context has at least one deliberately-unguessable expected name", () => {
    for (const c of LIST_CONTEXTS) {
      assert.ok(c.expect.length > 0, `${c.id} has no expected name`);
      for (const name of c.expect) {
        assert.ok(normalizeName(name).length >= 2, `${c.id}: ${name} normalises to nothing useful`);
      }
    }
  });
});
