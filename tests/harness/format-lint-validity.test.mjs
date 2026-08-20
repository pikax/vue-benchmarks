import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import {
  FORMAT_VALIDITY_PLANTS,
  FORMAT_VALIDITY_SUITE_HASH,
  judgeFormattedPlant,
} from "../../scripts/lib/format-validity-plants.mjs";
import { applyFormatValidityGates } from "../../scripts/lib/format-validity-gates.mjs";
import {
  LINT_VALIDITY_PLANTS,
  LINT_VALIDITY_SUITE_HASH,
  judgeLintPair,
} from "../../scripts/lib/lint-validity-plants.mjs";
import { applyLintValidityGates } from "../../scripts/lib/lint-validity-gates.mjs";
import { lintCliCommand } from "../../scripts/lib/lint-row-specs.mjs";

const require = createRequire(import.meta.url);
const { parse } = require("@vue/compiler-sfc");

test("format plants are versioned, extensive and independently identified", () => {
  assert.equal(FORMAT_VALIDITY_PLANTS.length, 3);
  assert.equal(new Set(FORMAT_VALIDITY_PLANTS.map((plant) => plant.id)).size, 3);
  assert.match(FORMAT_VALIDITY_SUITE_HASH, /^[a-f0-9]{64}$/);
  assert.ok(FORMAT_VALIDITY_PLANTS.every((plant) => plant.coverage.length >= 3));
});

test("format semantic judge rejects a changed template expression without comparing tool outputs", () => {
  const plant = FORMAT_VALIDITY_PLANTS[0];
  const changed = plant.source
    .replace("{{row.label}}", "{{row.id}}")
    .replace("<section", "<section ");
  const result = judgeFormattedPlant({
    plant,
    original: plant.source,
    first: changed,
    second: changed,
    parse,
  });
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((failure) => failure.includes("template semantic AST")));
});

test("format semantic judge requires exact-pass idempotence and descriptor preservation", () => {
  const plant = FORMAT_VALIDITY_PLANTS[1];
  const first = plant.source.replace("<ol>", "<ol >");
  const second = first.replace('module="theme"', 'module="other"');
  const result = judgeFormattedPlant({ plant, original: plant.source, first, second, parse });
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((failure) => failure.includes("idempotent")));
});

test("lint manifest uses ten dirty/clean differential plants", () => {
  assert.equal(LINT_VALIDITY_PLANTS.length, 10);
  assert.equal(new Set(LINT_VALIDITY_PLANTS.map((plant) => plant.id)).size, 10);
  assert.match(LINT_VALIDITY_SUITE_HASH, /^[a-f0-9]{64}$/);
  for (const plant of LINT_VALIDITY_PLANTS) {
    assert.notEqual(plant.dirty, plant.clean);
    assert.ok(Number.isInteger(plant.dirtyLine) && plant.dirtyLine > 0);
  }
});

test("lint differential judge requires file, line and rule/concept attribution", () => {
  const plant = LINT_VALIDITY_PLANTS[0];
  const passing = judgeLintPair(
    plant,
    [{ file: "/x/Plant.vue", line: 6, rule: "vue/no-v-html", message: "unsafe" }],
    [],
  );
  assert.equal(passing.ok, true);

  const arbitraryNonzeroNoise = judgeLintPair(
    plant,
    [{ raw: "Plant.vue exited 1 because config was not found", message: "error" }],
    [],
  );
  assert.equal(arbitraryNonzeroNoise.ok, false);

  const wrongLine = judgeLintPair(
    plant,
    [{ file: "Plant.vue", line: 2, rule: "vue/no-v-html", message: "unsafe" }],
    [],
  );
  assert.equal(wrongLine.ok, false);

  const numericToolCode = judgeLintPair(
    plant,
    [{ file: "Plant.vue", line: plant.dirtyLine, rule: "VIZE042", message: "unsafe v-html" }],
    [],
  );
  assert.equal(
    numericToolCode.ok,
    true,
    "a narrow message concept may identify a foreign rule code",
  );
});

test("clean lint twin retaining the planted diagnostic fails", () => {
  const plant = LINT_VALIDITY_PLANTS[2];
  const diagnostic = {
    file: "Plant.vue",
    line: plant.dirtyLine,
    rule: "vue/no-duplicate-attributes",
    message: "duplicate attribute",
  };
  assert.equal(judgeLintPair(plant, [diagnostic], [diagnostic]).ok, false);
});

test("Vize exact lint rows do not suppress diagnostics and preserve 1T environment", () => {
  assert.deepEqual(lintCliCommand("vize-lint-max").args, ["lint", "."]);
  assert.deepEqual(lintCliCommand("vize-lint-1t"), {
    bin: "vize",
    args: ["lint", "."],
    env: { RAYON_NUM_THREADS: "1" },
  });
});

test("FAIL and UNKNOWN validity verdicts keep timings visible but unranked", () => {
  const formatRows = [{ id: "prettier", status: "ok", notes: "x" }];
  applyFormatValidityGates(formatRows, {
    results: { prettier: { status: "UNKNOWN", reason: "no verdict" } },
  });
  assert.equal(formatRows[0].status, "unranked");

  const lintRows = [{ id: "vize-lint-max", status: "ok", notes: "x" }];
  applyLintValidityGates(lintRows, {
    results: { "vize-lint-max": { status: "FAIL", reason: "gap" } },
  });
  assert.equal(lintRows[0].status, "unranked");
});

test("a failed declared reference invalidates its comparison class", () => {
  const rows = [
    {
      id: "prettier",
      status: "ok",
      notes: "reference",
      baseline: true,
      comparisonClass: "format-full-vue-sfc-cli",
    },
    {
      id: "vize-fmt",
      status: "ok",
      notes: "candidate",
      comparisonClass: "format-full-vue-sfc-cli",
    },
  ];
  applyFormatValidityGates(rows, {
    results: {
      prettier: { status: "FAIL", reason: "reference gap" },
      "vize-fmt": { status: "PASS", passed: 1, plantCount: 1 },
    },
  });
  assert.equal(rows[0].status, "unranked");
  assert.equal(rows[1].status, "unranked");
  assert.match(rows[1].notes, /REFERENCE INVALID/);
});

test("a comparison class without its declared reference cannot rank", () => {
  const rows = [
    {
      id: "vize-lint-max",
      status: "ok",
      comparisonClass: "lint-cli",
      notes: "candidate",
    },
  ];
  const validity = {
    results: {
      "vize-lint-max": { status: "PASS", passed: 10, plantCount: 10 },
    },
  };
  applyLintValidityGates(rows, validity);
  assert.equal(rows[0].status, "unranked");
  assert.match(rows[0].notes, /REFERENCE MISSING/);
});

test("format and lint validation execute after timing and format never writes input configs", () => {
  const formatSource = readFileSync("scripts/lib/surfaces/format.mjs", "utf8");
  const lintSource = readFileSync("scripts/lib/surfaces/lint.mjs", "utf8");
  assert.ok(
    formatSource.indexOf("const results = await measureVariants") <
      formatSource.lastIndexOf('coverageCensus("prettier"'),
  );
  assert.ok(
    formatSource.indexOf("const results = await measureVariants") <
      formatSource.lastIndexOf("runFormatValidityChildren"),
  );
  assert.ok(
    lintSource.indexOf("const results = await measureVariants") <
      lintSource.indexOf("const coverage = new Map"),
  );
  assert.ok(
    lintSource.indexOf("const results = await measureVariants") <
      lintSource.lastIndexOf("runLintValidityChildren"),
  );
  assert.doesNotMatch(
    formatSource,
    /writeFileSync\(join\(fixtureDir,\s*["'](?:\.prettierrc|biome)/,
  );
  assert.match(formatSource, /variant\.baseline = variant\.id === "prettier"/);
  assert.match(lintSource, /comparisonClass = "lint-in-process-api"/);
  assert.match(lintSource, /comparisonClass = "lint-cli"/);
});
