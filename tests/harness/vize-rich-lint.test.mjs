import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { cliDiagnostics } from "../../scripts/lib/lint-validity-child.mjs";
import {
  LINT_VALIDITY_PLANTS,
  LINT_VALIDITY_SUITE_HASH,
  judgeLintPair,
} from "../../scripts/lib/lint-validity-plants.mjs";

const directory = new URL("./fixtures/vize-rich-lint/", import.meta.url);
const read = (name) => readFileSync(new URL(name, directory));
const source = JSON.parse(read("source.json"));
const original = JSON.parse(read("original-diagnostics.json"));
const expected = JSON.parse(read("expected-diagnostics.json"));

test("original human streams, complete diagnostics and unchanged eleven judges are pinned", () => {
  assert.equal(LINT_VALIDITY_SUITE_HASH, source.originalSuiteHash);
  assert.equal(LINT_VALIDITY_PLANTS.length, 11);
  for (const pin of source.fixtures) {
    const bytes = read(pin.file);
    assert.equal(bytes.length, pin.bytes, pin.file);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), pin.sha256, pin.file);
  }
  for (const [path, hash] of Object.entries(source.sourcePins)) {
    const bytes = readFileSync(new URL(`../../${path}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, path);
  }
  for (const profile of ["vize-lint-1t", "vize-lint-max"]) {
    const parsed = {};
    for (const polarity of ["dirty", "clean"]) {
      parsed[polarity] = cliDiagnostics(read(`${profile}-${polarity}-human.stdout`).toString());
      assert.deepEqual(parsed[polarity], expected[profile][polarity]);
      assert.deepEqual(
        original[profile][polarity].map((row) => ({ ...row, file: row.file.slice(3) })),
        expected[profile][polarity],
        "only the frame boundary was incorrectly included in the old filename",
      );
    }
    for (const [index, plant] of LINT_VALIDITY_PLANTS.entries()) {
      const path = `nested/${String(index).padStart(2, "0")}/${plant.id}/Plant.vue`;
      assert.equal(judgeLintPair(plant, original[profile].dirty, original[profile].clean, path).ok, false);
      assert.equal(judgeLintPair(plant, parsed.dirty, parsed.clean, path).ok, true);
    }
  }
});

function report(path, line = 6, ending = "\n") {
  return `⚠ [vize:vue/no-v-html] v-html can lead to XSS attacks.${ending}   ╭─[${path}:${line}:8]`;
}

test("the complete frame path survives spaces, brackets, Unicode, Windows and CRLF", () => {
  for (const path of ["src/A space.vue", "C:\\project\\A.vue", "src/雪[one].vue"]) {
    for (const ending of ["\n", "\r\n"]) {
      const raw = report(path, 6, ending);
      assert.deepEqual(cliDiagnostics(raw), [{
        file: path, line: 6, column: 8,
        rule: "vize:vue/no-v-html", message: "v-html can lead to XSS attacks.", raw: raw.slice(0, -1),
      }]);
    }
  }
});

test("a diagnostic cannot borrow the next report's frame or a quoted source path", () => {
  const unframed = "⚠ [vize:vue/no-v-html] missing source location\n";
  const other = report("nested/OtherPlant.vue");
  const actual = cliDiagnostics(unframed + other + "\n 6 │ <p>nested/Plant.vue:6:8</p>");
  assert.deepEqual(actual, cliDiagnostics(other));
  assert.equal(judgeLintPair(LINT_VALIDITY_PLANTS[0], actual, [], "nested/Plant.vue").ok, false);
});

test("wrong line, wrong rule, missing dirty evidence and retained clean evidence still fail", () => {
  const plant = LINT_VALIDITY_PLANTS[0];
  const valid = cliDiagnostics(report("Plant.vue"));
  assert.equal(judgeLintPair(plant, cliDiagnostics(report("Plant.vue", 2)), []).ok, false);
  assert.equal(judgeLintPair(plant, [{ ...valid[0], rule: "other", message: "unrelated" }], []).ok, false);
  assert.equal(judgeLintPair(plant, [], []).ok, false);
  assert.equal(judgeLintPair(plant, valid, valid).ok, false);
});

test("other CLI layouts and unknown nonempty output retain complete fallback diagnostics", () => {
  assert.deepEqual(cliDiagnostics("src/A.vue\n 2:3 warning message vue/rule"), [{
    file: "src/A.vue", line: 2, column: 3, message: "message", rule: "vue/rule",
    raw: "src/A.vue\n 2:3 warning message vue/rule",
  }]);
  assert.deepEqual(cliDiagnostics("src/A.vue:2:3 message"), [{
    file: "src/A.vue", line: 2, column: 3, message: "message", raw: "src/A.vue:2:3 message",
  }]);
  assert.deepEqual(cliDiagnostics("not found"), [{ raw: "not found", message: "not found" }]);
  assert.deepEqual(cliDiagnostics(""), []);
});
