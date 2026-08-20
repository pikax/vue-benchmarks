import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { diagsForCase, combinedFromDiags } from "../confirm/lib/diagnostics.mjs";
import {
  allPlantsRunCounts,
  prepareAllPlants,
  scoreCombinedRun,
} from "../confirm/suites/typecheck.mjs";
import { typecheckAllLanding } from "../../scripts/lib/readme-charts.mjs";
import { compactHighlightBody } from "../../scripts/lib/readme-charts.mjs";
import { formatTypecheckDoc } from "../confirm/lib/typecheck-doc.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("CI typecheck uses --all, not per-case spawns", () => {
  test("test.yml and benchmark.yml pass --all", () => {
    const testYml = readFileSync(join(repoRoot, ".github/workflows/test.yml"), "utf8");
    const benchYml = readFileSync(join(repoRoot, ".github/workflows/benchmark.yml"), "utf8");
    assert.match(testYml, /tests\/confirm\/run\.mjs --all/);
    assert.match(benchYml, /--surfaces typecheck --all/);
    assert.doesNotMatch(
      benchYml,
      /Per-plant cells \(~500\)/,
      "benchmark confirm must not still describe the per-case loop",
    );
  });
});

describe("allPlantsRunCounts", () => {
  test("defaults match the Benchmark workflow (5 runs, 1 warmup)", () => {
    assert.deepEqual(allPlantsRunCounts({}, {}), { runs: 5, warmups: 1 });
  });

  test("reads BENCH_RUNS / BENCH_WARMUPS and clamps warmup to ≥1", () => {
    assert.deepEqual(allPlantsRunCounts({ BENCH_RUNS: "3", BENCH_WARMUPS: "2" }, {}), {
      runs: 3,
      warmups: 2,
    });
    assert.equal(allPlantsRunCounts({}, { warmups: "0" }).warmups, 1);
    assert.equal(allPlantsRunCounts({}, { runs: "9" }).runs, 9);
  });
});

describe("diagsForCase / scoreCombinedRun", () => {
  test("keeps only diagnostics under cases/<id>/", () => {
    const diags = [
      {
        file: "work/confirm-typecheck-all/cases/wrong-prop-type/App.vue",
        line: 8,
        message: "title",
        raw: "a",
      },
      {
        file: "work/confirm-typecheck-all/cases/clean-basic/App.vue",
        line: 3,
        message: "nope",
        raw: "b",
      },
    ];
    assert.equal(diagsForCase(diags, "wrong-prop-type").length, 1);
    assert.equal(combinedFromDiags(diagsForCase(diags, "clean-basic")), "b");
  });

  test("a dirty plant without a pin hit fails; a clean plant with no diags passes", () => {
    const cases = [
      {
        caseId: "wrong-prop-type",
        meta: {
          expectErrors: true,
          _pins: [{ file: "App.vue", commentLine: 7, targetLine: 8 }],
          expectMention: ["title"],
        },
      },
      { caseId: "clean-basic", meta: { expectErrors: false, _pins: [] } },
    ];
    const result = {
      combined: [
        "cases/wrong-prop-type/App.vue(8,1): error TS2322: Type 'number' is not assignable to type 'string' title",
      ].join("\n"),
      status: 2,
    };
    const tally = scoreCombinedRun(cases, "vue-tsc", result);
    assert.equal(tally.pass, 2);
    assert.equal(tally.fail, 0);
    assert.equal(tally.passPct, 100);
  });
});

describe("prepareAllPlants", () => {
  test("writes one tsconfig and nests each plant under cases/<id>/", () => {
    const { dest, cases } = prepareAllPlants();
    try {
      assert.ok(cases.length > 10);
      const tsconfig = JSON.parse(readFileSync(join(dest, "tsconfig.json"), "utf8"));
      assert.equal(tsconfig.vueCompilerOptions.strictTemplates, true);
      assert.ok(!("fallthroughAttributes" in (tsconfig.vueCompilerOptions || {})));
      assert.ok(existsSync(join(dest, "cases", cases[0].caseId)));
      assert.equal(existsSync(join(dest, "cases", cases[0].caseId, "meta.json")), false);
      assert.equal(existsSync(join(dest, "cases", cases[0].caseId, "tsconfig.json")), false);
    } finally {
      rmSync(dest, { recursive: true, force: true });
    }
  });
});

describe("typecheckAllLanding", () => {
  test("pass-rate bars are percentages, not raw counts", () => {
    const charts = [];
    const md = typecheckAllLanding(
      [
        {
          suite: "typecheck-all",
          caseId: "all-plants",
          tool: "vue-tsc",
          status: "pass",
          ms: 12000,
          rssMb: 200,
          detail: { passPct: 83.3, pass: 100, scored: 120, ms: 12000, rssMb: 200 },
        },
        {
          suite: "typecheck-all",
          caseId: "all-plants",
          tool: "vize-check",
          status: "pass",
          ms: 4000,
          rssMb: 80,
          detail: { passPct: 70, pass: 84, scored: 120, ms: 4000, rssMb: 80 },
        },
      ],
      { writeChart: (file, svg) => charts.push({ file, svg }) },
    );
    assert.match(md, /\*\*83%\*\*/);
    assert.match(md, /100 \/ 120/);
    assert.match(md, /Pass rate/);
    assert.match(md, /skipped/);
    const passChart = charts.find((c) => c.file.includes("pass"));
    assert.ok(passChart, "pass-rate chart");
    assert.match(passChart.svg, /83%/);
    assert.doesNotMatch(passChart.svg, />100</);
  });

  test("wall / rss / pass charts include every tool, not just the first", () => {
    const charts = [];
    const rows = ["vue-tsc", "vize-check", "verter-tsc", "golar-typecheck"].map((tool, i) => ({
      suite: "typecheck-all",
      caseId: "all-plants",
      tool,
      status: "pass",
      ms: 1000 * (i + 1),
      rssMb: 50 * (i + 1),
      detail: {
        passPct: 90 - i * 10,
        pass: 90 - i * 10,
        scored: 100,
        ms: 1000 * (i + 1),
        rssMb: 50 * (i + 1),
      },
    }));
    typecheckAllLanding(rows, { writeChart: (file, svg) => charts.push({ file, svg }) });
    assert.equal(charts.length, 3);
    for (const c of charts) {
      assert.match(c.svg, /vue-tsc/);
      assert.match(c.svg, />vize</);
      assert.match(c.svg, /verter-tsc/);
      assert.match(c.svg, />golar</);
    }
  });
});

describe("formatTypecheckDoc all-plants section", () => {
  test("renders the combined section when typecheck-all rows exist", () => {
    const md = formatTypecheckDoc({
      generatedAt: "2026-08-19T00:00:00.000Z",
      runner: {
        platform: "linux",
        ci: true,
        arch: "x64",
        cpuCount: 4,
        cpuModel: "Test",
        totalmem: 8e9,
        node: "v22",
      },
      results: [
        { suite: "typecheck", caseId: "clean-basic", tool: "vue-tsc", status: "pass" },
        {
          suite: "typecheck-all",
          caseId: "all-plants",
          tool: "vue-tsc",
          status: "pass",
          ms: 5000,
          rssMb: 100,
          detail: { passPct: 90, pass: 9, scored: 10, ms: 5000, rssMb: 100 },
        },
      ],
    });
    assert.match(md, /## All plants \(one tsconfig\)/);
    assert.match(md, /90%/);
  });

  test("--all dump (no per-plant suite rows) still fills the matrix, summary, and wall avg", () => {
    const md = formatTypecheckDoc({
      generatedAt: "2026-08-19T00:00:00.000Z",
      runner: {
        platform: "linux",
        ci: true,
        arch: "x64",
        cpuCount: 4,
        cpuModel: "Test",
        totalmem: 8e9,
        node: "v22",
      },
      results: [
        {
          suite: "typecheck-all",
          caseId: "all-plants",
          tool: "vue-tsc",
          status: "pass",
          ms: 3000,
          rssMb: 100,
          detail: {
            ms: 3000,
            avgMs: 3100,
            runs: [2900, 3000, 3100, 3200, 3300],
            passPct: 50,
            pass: 1,
            fail: 1,
            skip: 0,
            scored: 2,
            plants: [
              { caseId: "clean-basic", skip: false, ok: true, message: "clean" },
              { caseId: "wrong-prop-type", skip: false, ok: false, message: "missed" },
            ],
          },
        },
      ],
    });
    assert.match(md, /pass: \*\*1\*\* · fail: \*\*1\*\*/);
    assert.match(md, /clean-basic/);
    assert.match(md, /\*\*Median\*\*/);
    assert.match(md, /Avg/);
    assert.match(md, /3\.10 s/);
  });
});

describe("bench landing omits JSX", () => {
  test("jsx compile tables are dropped", () => {
    const md = [
      "### Typecheck",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| verter-tsc | **1.09 s** | 1.00x |",
      "",
      "### JSX compile",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| vue-jsx-vapor/api | **3.4 ms** | 1.00x |",
    ].join("\n");
    const out = compactHighlightBody(md, {
      kind: "bench",
      leaf: "bench-Linux-200-bench.md",
      href: "docs/results/x.md",
      writeChart: () => {},
    });
    assert.match(out, /Typecheck/);
    assert.doesNotMatch(out, /JSX compile/);
    assert.doesNotMatch(out, /vue-jsx-vapor/);
  });
});

describe("real-world landing keeps compile, typecheck, test", () => {
  test("drops bundle/hmr and harness Compiler; keeps own typecheck/test", () => {
    const md = [
      "## Compiler",
      "",
      "#### VDOM · production · sourcemap off",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| Vize native batch | **82.8 ms** | 1.00x |",
      "",
      "## Bundle (production build)",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| Vite 8 | **1.0 s** | 1.00x |",
      "",
      "## Project typecheck (own tsconfig) — hoppscotch:common",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| verter-tsc | **1.65 s** | 1.00x |",
      "",
      "## Project test suite — hoppscotch:common",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| baseline | **24.89 s** | 1.00x |",
    ].join("\n");
    const out = compactHighlightBody(md, {
      kind: "real-world",
      leaf: "real-world-Linux-hoppscotch.md",
      href: "docs/results/x.md",
      writeChart: () => {},
    });
    assert.doesNotMatch(out, /VDOM · production/);
    assert.doesNotMatch(out, /## Compiler/);
    assert.match(out, /Project typecheck/);
    assert.match(out, /Project test suite/);
    assert.doesNotMatch(out, /Bundle/);
  });
});
