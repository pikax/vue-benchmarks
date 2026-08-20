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
import { typecheckAllLanding, renderRealWorldIndex } from "../../scripts/lib/docs/render.mjs";
import { renderBenchBlock } from "../../scripts/lib/docs/readme.mjs";
import { formatTypecheckDoc } from "../confirm/lib/typecheck-doc.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("CI typecheck uses --all, not per-case spawns", () => {
  test("test.yml and benchmark.yml pass --all", () => {
    const testYml = readFileSync(join(repoRoot, ".github/workflows/test.yml"), "utf8");
    const benchYml = readFileSync(join(repoRoot, ".github/workflows/benchmark.yml"), "utf8");
    assert.match(testYml, /tests\/confirm\/run\.mjs --all/);
    assert.match(benchYml, /tests\/confirm\/run\.mjs --all/);
    assert.doesNotMatch(
      benchYml,
      /--surfaces typecheck --all/,
      "benchmark confirm publishes EVERY suite, not just typecheck",
    );
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

  test("vize-style output (file on a separate header line) still hits pins", () => {
    // vize's raw diagnostic lines carry no file path — the file sits on its
    // own header line above them. The per-case subset must be scored as parsed
    // diags; re-parsing the reduced text drops the attribution and fails every
    // pin with "no diagnostic at <file>:<line>".
    const cases = [
      {
        caseId: "async-setup-await-bad",
        meta: {
          expectErrors: true,
          _pins: [{ file: "App.vue", commentLine: 11, targetLine: 12 }],
          mustMatch: ["TS2339", "count", "does not exist"],
          mustNotMatch: ["TS1308"],
          expectMention: ["count"],
        },
      },
    ];
    const result = {
      combined: [
        "",
        "D:\\repo\\work\\confirm-typecheck-all\\cases\\async-setup-await-bad\\App.vue",
        "  error:11:16 [TS2339] Property 'count' does not exist on type '{ name: string; }'.",
        "",
        "✗ Type checked 300 files in 1000ms",
        "  1 error(s)",
      ].join("\n"),
      status: 1,
    };
    const tally = scoreCombinedRun(cases, "vize-check", result);
    assert.equal(tally.fail, 0, tally.plants[0].message);
    assert.equal(tally.pass, 1);
  });

  test("an unclaimed capability is scored as a FAIL, never a neutral skip", () => {
    const cases = [
      { caseId: "clean-basic", meta: { expectErrors: false, _pins: [] } },
      {
        caseId: "unknown-prop-strict",
        meta: {
          expectErrors: true,
          requires: ["strict-component-attrs"],
          _pins: [{ file: "App.vue", commentLine: 7, targetLine: 8 }],
          expectMention: ["notdeclared"],
        },
      },
    ];
    // vize-check does not claim strict-component-attrs.
    const tally = scoreCombinedRun(cases, "vize-check", { combined: "", status: 0 });
    assert.equal(tally.skip, 0, "capability gaps are not skips");
    assert.equal(tally.fail, 1);
    assert.equal(tally.pass, 1);
    assert.equal(tally.passPct, 50, "the gap stays in the denominator");
    const gap = tally.plants.find((p) => p.caseId === "unknown-prop-strict");
    assert.equal(gap.skip, false);
    assert.equal(gap.ok, false);
    assert.match(gap.message, /capability gap/);
  });
});

describe("prepareAllPlants", () => {
  test("writes one tsconfig and nests each plant under cases/<id>/", () => {
    // Own scratch root — preparing the shared work/confirm-typecheck-all here
    // would rmSync it out from under a concurrently running confirm suite.
    const { dest, cases } = prepareAllPlants(join(repoRoot, "work", "test-confirm-all-plants"));
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
    assert.match(md, /gap and counts as a fail/);
    assert.doesNotMatch(md, /\| skipped \|/);
    const passChart = charts.find((c) => c.file.includes("pass"));
    assert.ok(passChart, "pass-rate chart");
    assert.match(passChart.svg, /83%/);
    assert.doesNotMatch(passChart.svg, />100</);
  });

  test("wall / pass charts include every tool, not just the first", () => {
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
    // Wall + pass rate, each as a light/dark pair. RSS is a column on the
    // wall table, not a third chart.
    assert.equal(charts.length, 4);
    assert.ok(charts.some((c) => c.file.endsWith("-dark.svg")), "dark variants written");
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

describe("README landing omits JSX tables", () => {
  test("typecheck gets a chart + table; jsx-compile gets a pointer line", () => {
    const model = {
      bench: {
        name: "bench-Linux-200-bench.json",
        data: {
          surfaces: [
            {
              id: "typecheck",
              label: "Typecheck",
              files: 200,
              bytes: 1,
              variants: [
                { id: "verter-tsc", label: "verter-tsc", status: "ok", medianMs: 1090, runs: [1090] },
              ],
            },
            {
              id: "jsx-compile",
              label: "JSX compile",
              files: 200,
              bytes: 1,
              variants: [
                { id: "jsx", label: "vue-jsx-vapor/api", status: "ok", medianMs: 3.4, runs: [3.4], target: "vapor" },
              ],
            },
          ],
        },
      },
      ide: null,
      confirm: null,
      realWorld: [],
    };
    const chartsDir = join(repoRoot, "work", "test-charts-readme");
    const out = renderBenchBlock(model, { chartsDir });
    rmSync(chartsDir, { recursive: true, force: true });
    assert.match(out, /### Typecheck/);
    assert.match(out, /verter-tsc/);
    assert.match(out, /JSX compile \(vue-jsx-vapor vs Babel\) is ranked per codegen target/);
    assert.doesNotMatch(out, /vue-jsx-vapor\/api/);
  });
});

describe("real-world landing keeps the project's own surfaces", () => {
  test("drops bundle and harness compile; keeps own typecheck/test", () => {
    const surface = (id, label, toolLabel, ms) => ({
      id,
      label,
      files: 10,
      bytes: 1,
      variants: [{ id: `${id}-row`, label: toolLabel, status: "ok", medianMs: ms, runs: [ms] }],
    });
    const entry = {
      project: "hoppscotch",
      name: "real-world-Linux-hoppscotch.json",
      data: {
        corpora: [{ selector: "hoppscotch:common", repo: "https://github.com/hoppscotch/hoppscotch.git", ref: "abc", sha: "abc", files: 293 }],
        surfaces: [
          surface("compile", "SFC compile (unique contents)", "Vize native batch", 82.8),
          surface("bundle", "Bundle (production build)", "Vite 8", 1000),
          surface("project-typecheck", "Project typecheck (own tsconfig) — hoppscotch:common", "verter-tsc", 1650),
          surface("project-test", "Project test suite — hoppscotch:common", "baseline", 24890),
        ],
      },
    };
    const out = renderRealWorldIndex([entry], {
      chartsDir: join(repoRoot, "work", "test-charts"),
      chartsHref: "charts",
    });
    rmSync(join(repoRoot, "work", "test-charts"), { recursive: true, force: true });
    assert.doesNotMatch(out, /SFC compile/);
    assert.match(out, /Project typecheck/);
    assert.match(out, /Project test suite/);
    assert.doesNotMatch(out, /Bundle \(production build\)/);
  });
});
