/**
 * Scale suite — corpus generator and content gates.
 *
 * The hover, completion and reference payloads below are VERBATIM captures from
 * a real run of all four language servers against this suite's own 20-file
 * corpus. Nothing here is invented prose about what a server "would" return.
 *
 * Each hover was captured TWICE: once against the real corpus, and once with
 * `shared.ts` deleted so the probe's cross-file import cannot resolve. That
 * pair is the whole reason this suite's gate is shaped the way it is:
 *
 *   - Volar and Verter answer `Ref<number, number>` when the module is there
 *     and `any` when it is not. They compute the type.
 *   - Vize returns a BYTE-IDENTICAL payload in both cases, naming
 *     `Ref<string>` for a module that does not exist. It never computed
 *     anything; it pattern-matched `ref(...)`.
 *
 * An earlier version of this probe expected `string`, and Vize's guess sailed
 * through it — a fast, confident, wrong answer scored as correct. The probe now
 * types through a `number`-returning shared function, so a guess is
 * distinguishable from a computation. `vize resolved === vize broken` is
 * asserted below, because that equality IS the evidence.
 *
 * The other half of the job is not false-failing a server that did the work.
 * Verter renders `const scaleProbeTally: Ref<number, number>Stable probe — do
 * not rename.` — the correct type with the doc comment run straight onto it, no
 * separator. This repo previously demoted a correct server with a gate that
 * required a word boundary there. That payload is a test case below.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  PROBE_FILE,
  PROBE_POSITIONS,
  PROBE_SOURCE,
  SHARED_FILE,
  SIZES,
  TEMPLATE_BINDINGS,
  classifyScaleCompletion,
  classifyScaleHover,
  classifyScaleReferences,
  completionItems,
  componentName,
  componentSource,
  corpusDirName,
  mergeLocations,
  normalizeUri,
  scalingOps,
  sharedSource,
  toLocations,
} from "../../scripts/lib/ide-ops/suites/scale.mjs";

/* ------------------------------------------------------------------ */
/* Verbatim captures. Do not tidy — the formatting IS the test.        */
/* ------------------------------------------------------------------ */

/** Hovers on `scaleProbeTally`, with ./shared present ("ok") and deleted ("broken"). */
const HOVER = {
  volarOk:
    "```typescript\nconst scaleProbeTally: Ref<number, number>\n```\nStable probe — do not rename. Its type requires ./shared to resolve.",
  volarBroken:
    "```typescript\nconst scaleProbeTally: any\n```\nStable probe — do not rename. Its type requires ./shared to resolve.",

  // volar-tnb (tsgo tsdk) produced a byte-identical pair to volar's.
  volarTnbOk:
    "```typescript\nconst scaleProbeTally: Ref<number, number>\n```\nStable probe — do not rename. Its type requires ./shared to resolve.",

  // Correct type, doc comment concatenated with NO separator. The regression.
  verterOk:
    "```typescript\nconst scaleProbeTally: Ref<number, number>Stable probe — do not rename. Its type requires ./shared to resolve.\n```",
  verterBroken:
    "```typescript\nconst scaleProbeTally: anyStable probe — do not rename. Its type requires ./shared to resolve.\n```",

  // Identical whether or not ./shared exists. See the file header.
  vizeOk:
    "**scaleProbeTally**\n\n_Script binding_\n\n```typescript\nscaleProbeTally: Ref<string>\n```\n\n" +
    "Reactive reference created with `ref()`. Access `.value` in script, auto-unwrapped in template.\n\n" +
    "**Tip**\n\nUse `scaleProbeTally.value` to read or write this ref in script.\n\n---\n\n" +
    "### 🟡 vue/sfc-element-order\n\n<script> should come before <template>\n\n" +
    "**Help:** Recommended order: <script> -> <template> -> <style>\n\n" +
    "[📖 View rule documentation](https://eslint.vuejs.org/rules/sfc-element-order.html)",
};
HOVER.vizeBroken = HOVER.vizeOk;

/** First labels of each server's completion list at the probe's `{{ ` position. */
const COMPLETION = {
  // 276 items; the head of the list, verbatim.
  volar: [
    "computed",
    "ref",
    "scaleProbeLabel",
    "scaleProbeTally",
    "scaleProbeUpper",
    "sharedCount",
    "sharedLabel",
    "abstract",
    "any",
    "Array",
    "as",
    "asserts",
  ],
  // 119 items.
  volarTnb: ["computed", "ref", "scaleProbeLabel", "scaleProbeTally", "scaleProbeUpper", "sharedCount", "sharedLabel"],
  // 7 items — the complete list.
  vize: [
    "computed",
    "ref",
    "sharedLabel",
    "scaleProbeTally",
    "scaleProbeUpper",
    "sharedCount",
    "scaleProbeLabel",
  ],
  // 7 items — the complete list.
  verter: [
    "computed",
    "ref",
    "scaleProbeLabel",
    "scaleProbeTally",
    "scaleProbeUpper",
    "sharedCount",
    "sharedLabel",
  ],
};

/**
 * The capture directory, verbatim. The two spellings matter and are the point:
 * the probe URI carries an upper-case drive letter, and Volar answers with a
 * percent-encoded lower-case one for the very same files.
 */
const DIR = "/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/scratchpad/cap/size-20";
const PROBE_URI = `file:///C:${DIR}/ScaleProbe.vue`;
const VOLAR_BASE = `file:///c%3A${DIR}`;

const loc = (uri, line, from, to) => ({
  uri,
  range: { start: { line, character: from }, end: { line, character: to } },
});

/** Volar: 63 locations over 22 files. Head of the list, ranges verbatim. */
const VOLAR_REFERENCES = [
  loc(`${VOLAR_BASE}/ScaleProbe.vue`, 10, 22, 33),
  loc(`${VOLAR_BASE}/ScaleProbe.vue`, 14, 28, 39),
  loc(`${VOLAR_BASE}/shared.ts`, 7, 16, 27),
  loc(`${VOLAR_BASE}/Comp0001.vue`, 11, 9, 20),
  loc(`${VOLAR_BASE}/Comp0002.vue`, 11, 9, 20),
  loc(`${VOLAR_BASE}/Comp0003.vue`, 11, 9, 20),
];

/** Vize: 3 locations, every one of them inside the probe file. */
const VIZE_REFERENCES = [
  loc(PROBE_URI, 10, 22, 33),
  loc(PROBE_URI, 11, 22, 33),
  loc(PROBE_URI, 15, 28, 39),
];

/** Verter answered the request with a bare `null`. */
const VERTER_REFERENCES = null;

/* ------------------------------------------------------------------ */

describe("corpus generator", () => {
  test("a component is a pure function of its index", () => {
    assert.equal(componentSource(7), componentSource(7));
    assert.notEqual(componentSource(7), componentSource(8));
  });

  test("component names are zero-padded and unique across the largest size", () => {
    const largest = Math.max(...SIZES);
    const names = new Set();
    for (let i = 1; i <= largest; i++) names.add(componentName(i));
    assert.equal(names.size, largest);
    assert.equal(componentName(1), "Comp0001");
    assert.equal(componentName(500), "Comp0500");
  });

  test("a generated component is a valid SFC with props, refs and a computed", () => {
    const src = componentSource(42);
    assert.equal(src.split("<template>").length - 1, 1);
    assert.equal(src.split("</template>").length - 1, 1);
    assert.match(src, /<script setup lang="ts">/);
    assert.equal(src.split("</script>").length - 1, 1);
    assert.match(src, /defineProps<\{ title: string; index: number \}>\(\)/);
    assert.match(src, /const \w+ = ref\(/);
    assert.match(src, /const \w+ = computed\(/);
    // Template actually uses the bindings — an unused binding measures nothing.
    for (const used of ["{{ title }}", "{{ caption }}", "{{ doubled }}"]) {
      assert.ok(src.includes(used), `template should render ${used}`);
    }
  });

  test("every component imports the shared symbol, so references must cross files", () => {
    for (const i of [1, 13, 500]) {
      assert.match(componentSource(i), /import \{ sharedLabel \} from '\.\/shared'/);
      assert.match(componentSource(i), /sharedLabel\(/);
    }
  });

  test("shared module declares both gate targets, and the hover target is a number", () => {
    const s = sharedSource();
    assert.match(s, /export function sharedLabel\(index: number\): string/);
    // If this ever returns string, the hover gate stops distinguishing a
    // computed type from a guessed one. See the file header.
    assert.match(s, /export function sharedCount\(index: number\): number/);
  });

  test("writeCorpus writes exactly count generated components plus the probe", async (t) => {
    const { writeCorpus } = await import("../../scripts/lib/ide-ops/suites/scale.mjs");
    const dir = mkdtempSync(join(tmpdir(), "scale-corpus-"));
    t.after(() => rmSync(dir, { recursive: true, force: true }));

    for (const count of [20, 37]) {
      const sub = join(dir, `n${count}`);
      const info = writeCorpus(sub, count);
      const files = readdirSync(sub);
      const vue = files.filter((f) => f.endsWith(".vue"));
      const generated = vue.filter((f) => /^Comp\d{4}\.vue$/.test(f));

      assert.equal(generated.length, count, `${count}: generated component count`);
      assert.equal(vue.length, count + 1, `${count}: generated components plus the probe`);
      assert.equal(info.generated, count);
      assert.equal(info.vueFiles, count + 1);
      assert.ok(files.includes(SHARED_FILE), "shared.ts is written");
      assert.ok(files.includes(PROBE_FILE), "probe is written");
      assert.equal(readFileSync(info.probeFile, "utf8"), PROBE_SOURCE);
    }
  });

  test("the corpus is byte-identical when generated twice", async (t) => {
    const { writeCorpus } = await import("../../scripts/lib/ide-ops/suites/scale.mjs");
    const dir = mkdtempSync(join(tmpdir(), "scale-determinism-"));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const a = join(dir, "a");
    const b = join(dir, "b");
    writeCorpus(a, 25);
    writeCorpus(b, 25);
    const names = readdirSync(a).sort();
    assert.deepEqual(names, readdirSync(b).sort());
    for (const n of names) {
      assert.equal(readFileSync(join(a, n), "utf8"), readFileSync(join(b, n), "utf8"), n);
    }
  });

  test("corpus directory names are distinct per size", () => {
    assert.equal(new Set(SIZES.map(corpusDirName)).size, SIZES.length);
  });

  test("sizes cover at least 20 / 100 / 500", () => {
    for (const required of [20, 100, 500]) assert.ok(SIZES.includes(required));
  });
});

describe("probe positions (derived, never hard-coded)", () => {
  const lines = PROBE_SOURCE.split(/\r?\n/);
  const textAt = (p, len) => lines[p.line].slice(p.character, p.character + len);

  test("hover lands on the `const scaleProbeTally` declaration", () => {
    assert.equal(textAt(PROBE_POSITIONS.hover, 15), "scaleProbeTally");
    assert.match(lines[PROBE_POSITIONS.hover.line], /^const scaleProbeTally = ref\(sharedCount/);
  });

  test("completion lands inside a template interpolation with an empty prefix", () => {
    const line = lines[PROBE_POSITIONS.completion.line];
    assert.equal(line.slice(PROBE_POSITIONS.completion.character - 3, PROBE_POSITIONS.completion.character), "{{ ");
    assert.match(line, /\{\{ scaleProbeTally \}\}/);
  });

  test("references lands on the shared symbol's call site, not its import", () => {
    assert.equal(textAt(PROBE_POSITIONS.references, 11), "sharedLabel");
    assert.match(lines[PROBE_POSITIONS.references.line], /= ref\(sharedLabel\(0\)\)/);
  });
});

describe("classifyScaleHover", () => {
  test("accepts Volar's computed Ref<number, number>", () => {
    assert.equal(classifyScaleHover(HOVER.volarOk).ok, true);
  });

  test("accepts volar-tnb's payload", () => {
    assert.equal(classifyScaleHover(HOVER.volarTnbOk).ok, true);
  });

  test("accepts a correct type with the doc comment concatenated onto it", () => {
    // `Ref<number, number>Stable probe — do not rename.` There is no word
    // boundary after the type name. A gate that required one demoted a server
    // that had done the work. See the file header.
    const r = classifyScaleHover(HOVER.verterOk);
    assert.equal(r.ok, true, `should pass but failed with: ${r.reason}`);
  });

  test("rejects `any` — the import did not resolve", () => {
    for (const [name, payload] of [
      ["volar", HOVER.volarBroken],
      ["verter", HOVER.verterBroken],
    ]) {
      const r = classifyScaleHover(payload);
      assert.equal(r.ok, false, name);
      assert.match(r.reason, /did not resolve|guessed/);
    }
  });

  test("rejects a type the server never computed", () => {
    // The evidence, not an opinion: Vize sends the same bytes whether or not
    // the module it claims to have read exists.
    assert.equal(
      HOVER.vizeOk,
      HOVER.vizeBroken,
      "capture invariant: Vize's payload is identical with and without ./shared",
    );
    const r = classifyScaleHover(HOVER.vizeOk);
    assert.equal(r.ok, false);
    assert.match(r.reason, /guessed type instead of the computed number/);
  });

  test("rejects an empty payload", () => {
    assert.equal(classifyScaleHover("").ok, false);
    assert.match(classifyScaleHover("").reason, /empty/);
  });

  test("rejects a payload for a different symbol", () => {
    assert.equal(classifyScaleHover("const somethingElse: Ref<number, number>").ok, false);
  });

  test("prose mentioning a number is not a type", () => {
    // The other direction: loose matching would credit this for the word.
    const prose = "**scaleProbeTally**\n\nA reactive reference holding a number, unwrapped in template.";
    assert.equal(classifyScaleHover(prose).ok, false);
  });

  test("accepts the unwrapped form some servers render in <script>", () => {
    // Not the shape Volar uses, but a server that renders `: number` there has
    // still resolved sharedCount(). Failing it would be a false negative.
    assert.equal(classifyScaleHover("let scaleProbeTally: numberStable probe — do not rename.").ok, true);
  });

  test("reports byte size for the artifact column", () => {
    assert.equal(
      classifyScaleHover(HOVER.volarOk).bytes,
      Buffer.byteLength(HOVER.volarOk, "utf8"),
    );
  });
});

describe("classifyScaleCompletion", () => {
  test("accepts every server's real completion list", () => {
    for (const [name, labels] of Object.entries(COMPLETION)) {
      const r = classifyScaleCompletion(labels.map((label) => ({ label })));
      assert.equal(r.ok, true, `${name}: ${r.reason}`);
      assert.ok(r.matched.length > 0, name);
    }
  });

  test("rejects an empty list", () => {
    const r = classifyScaleCompletion([]);
    assert.equal(r.ok, false);
    assert.match(r.reason, /no items/);
  });

  test("rejects a list that knows nothing of the component's scope", () => {
    // What a server offers when it parsed the SFC but resolved no bindings.
    const html = ["div", "span", "section", "template", "v-if", "v-for"].map((label) => ({ label }));
    const r = classifyScaleCompletion(html);
    assert.equal(r.ok, false);
    assert.match(r.reason, /none of the probe's own bindings/);
  });

  test("matches labels exactly, never as substrings", () => {
    const near = [{ label: "scaleProbeTallyExtra" }, { label: "mysharedLabel" }];
    assert.equal(classifyScaleCompletion(near).ok, false);
  });

  test("counts items for the artifact column", () => {
    assert.equal(classifyScaleCompletion(COMPLETION.vize.map((label) => ({ label }))).count, 7);
  });

  test("completionItems normalises both response shapes", () => {
    assert.equal(completionItems([{ label: "a" }]).length, 1);
    assert.equal(completionItems({ items: [{ label: "a" }, { label: "b" }] }).length, 2);
    assert.equal(completionItems(null).length, 0);
  });

  test("every advertised template binding is spelled as the probe declares it", () => {
    for (const b of TEMPLATE_BINDINGS) {
      assert.ok(PROBE_SOURCE.includes(b), `${b} must exist in the probe source`);
    }
  });
});

describe("references gate", () => {
  test("normalizeUri reconciles percent-encoding and drive-letter case", () => {
    // Volar answers `file:///c%3A/...` for a file the client opened as
    // `file:///C:/...`. Without this the same file counts as two.
    assert.equal(
      normalizeUri(`${VOLAR_BASE}/ScaleProbe.vue`),
      normalizeUri(PROBE_URI),
    );
  });

  test("one file in two URI spellings is not two files", () => {
    const both = [loc(`${VOLAR_BASE}/ScaleProbe.vue`, 10, 22, 33), loc(PROBE_URI, 11, 22, 33)];
    const r = classifyScaleReferences(both, { probeUri: PROBE_URI });
    assert.equal(r.files, 1);
    assert.equal(r.ok, false);
    assert.match(r.reason, /single file/);
  });

  test("accepts a payload that reaches the generated corpus", () => {
    const r = classifyScaleReferences(VOLAR_REFERENCES, { probeUri: PROBE_URI });
    assert.equal(r.ok, true, r.reason);
    assert.ok(r.generatedFiles >= 2, "should see several generated components");
    assert.equal(r.total, VOLAR_REFERENCES.length);
  });

  test("rejects a search confined to the open file", () => {
    const r = classifyScaleReferences(VIZE_REFERENCES, { probeUri: PROBE_URI });
    assert.equal(r.ok, false);
    assert.equal(r.files, 1);
    assert.match(r.reason, /single file/);
  });

  test("rejects a null answer, and says so", () => {
    const r = classifyScaleReferences(VERTER_REFERENCES, { probeUri: PROBE_URI });
    assert.equal(r.ok, false);
    assert.equal(r.total, 0);
    assert.match(r.reason, /null/);
  });

  test("declaration plus the open file is not a corpus search", () => {
    // Two files, so a naive ">1 file" gate passes this. It is exactly what a
    // server returns when it followed the import and stopped.
    const shallow = [
      loc(PROBE_URI, 10, 22, 33),
      loc(`${VOLAR_BASE}/shared.ts`, 7, 16, 27),
    ];
    const r = classifyScaleReferences(shallow, { probeUri: PROBE_URI });
    assert.equal(r.files, 2, "the weak gate's condition is met");
    assert.equal(r.ok, false, "the real gate still rejects it");
    assert.match(r.reason, /none in any generated component/);
  });

  test("toLocations accepts Location[] and LocationLink[]", () => {
    assert.equal(toLocations(VOLAR_REFERENCES).length, VOLAR_REFERENCES.length);
    const links = [
      {
        targetUri: `${VOLAR_BASE}/Comp0004.vue`,
        targetRange: { start: { line: 11, character: 9 }, end: { line: 11, character: 20 } },
        targetSelectionRange: { start: { line: 11, character: 9 }, end: { line: 11, character: 20 } },
      },
    ];
    const out = toLocations(links);
    assert.equal(out.length, 1);
    assert.match(out[0].uri, /Comp0004\.vue$/);
    assert.equal(toLocations(null).length, 0);
  });

  test("mergeLocations unions the two halves of a hybrid server without duplicating", () => {
    const vueHalf = VOLAR_REFERENCES.slice(0, 3);
    const tsHalf = VOLAR_REFERENCES.slice(2);
    const merged = mergeLocations(vueHalf, tsHalf);
    assert.equal(merged.length, VOLAR_REFERENCES.length);
    // And a differently-spelled duplicate of the same position collapses too.
    const dup = mergeLocations(VOLAR_REFERENCES, [loc(PROBE_URI, 10, 22, 33)]);
    assert.equal(dup.length, VOLAR_REFERENCES.length);
  });
});

describe("scalingOps", () => {
  const opAt = (family, size, valid, ms) => ({
    id: `${family}@${size}`,
    label: `${family} @${size}`,
    ms,
    valid,
    reason: "",
    sample: "",
  });

  test("divides the largest size by the smallest when both gates passed", () => {
    const ops = [
      opAt("hover-warm", 20, true, 4),
      opAt("hover-warm", 500, true, 50),
    ];
    const [row] = scalingOps(ops, [20, 500]).filter((o) => o.id === "scale-hover-warm");
    assert.equal(row.valid, true);
    assert.equal(row.artifact, 12.5);
    assert.equal(row.ms, null, "a ratio is not a duration");
    assert.match(row.sample, /4\.0 ms → 50\.0 ms/);
  });

  test("refuses to quote a ratio when a gate failed, and names the size", () => {
    const ops = [
      opAt("references", 20, true, 200),
      opAt("references", 500, false, 1),
    ];
    const [row] = scalingOps(ops, [20, 500]).filter((o) => o.id === "scale-references");
    assert.equal(row.valid, false);
    assert.equal(row.artifact, undefined);
    assert.match(row.reason, /gate failed at 500 files/);
  });

  test("refuses when the measurement is missing entirely", () => {
    const [row] = scalingOps([], [20, 500]).filter((o) => o.id === "scale-usable");
    assert.equal(row.valid, false);
    assert.equal(row.artifact, undefined);
  });

  test("emits one row per measured operation family", () => {
    const ids = scalingOps([], SIZES).map((o) => o.id);
    assert.deepEqual(ids, [
      "scale-usable",
      "scale-completion",
      "scale-references",
      "scale-hover-warm",
    ]);
  });
});
