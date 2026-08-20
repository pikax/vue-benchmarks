/**
 * Ranking + report contract: scripts/lib/report.mjs
 *
 * primaryMs / classKey / renderVariantTable / renderByThreadingClass are module
 * private, so they are exercised through the public renderers. That is the
 * stronger test anyway — a malformed markdown table is a silent doc bug that
 * only shows up in the rendered output.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  buildMethodologyNotes,
  RANKING_RULES,
  renderFullMarkdown,
  renderSurfaceMarkdown,
} from "../../scripts/lib/report.mjs";
import {
  classTitles,
  collectMarkdownTables,
  isSeparatorRow,
} from "./helpers.mjs";

function okRow(overrides = {}) {
  const medianMs = overrides.medianMs ?? 10;
  return {
    id: overrides.label ?? "tool",
    label: "Tool",
    status: "ok",
    medianMs,
    minMs: medianMs - 1,
    maxMs: medianMs + 1,
    meanMs: medianMs,
    stddevMs: 0.5,
    cvPct: 5,
    runs: [medianMs - 1, medianMs, medianMs + 1],
    throughput: "1.0k files/s",
    notes: "",
    threading: "1t",
    invocation: "cli",
    files: 10,
    ...overrides,
  };
}

function surface(variants, extra = {}) {
  return {
    id: "demo",
    label: "Demo",
    files: 10,
    bytes: 2048,
    methodology: ["a methodology note"],
    variants,
    ...extra,
  };
}

/** Body rows of the first (or nth) rendered table, as label strings. */
function tableLabels(markdown, index = 0) {
  return collectMarkdownTables(markdown)[index].body.map((cells) => cells[0]);
}

/**
 * Column layout of a rendered ranking table, by name, so an assertion says
 * which column it means instead of an index nobody can check.
 *
 * There is no Status column (status is a marker on the name: ⚠ unranked,
 * ❌ error, ⏭ skipped) and no Notes column (notes live in a <details> block
 * under the table).
 */
const COL = {
  tool: 0,
  primary: 1,
  min: 2,
  stddev: 3,
  cv: 4,
  vsFastest: 5,
  artifact: 6,
  throughput: 7,
};

/** `{ [label]: cells }` for the first (or nth) rendered table. Keys keep any name marker. */
function rowsByLabel(markdown, index = 0) {
  return Object.fromEntries(
    collectMarkdownTables(markdown)[index].body.map((cells) => [
      cells[COL.tool],
      cells,
    ]),
  );
}

/** The `- **name**: …` notes line for one row inside the Notes collapsible, or null. */
function notesLineFor(markdown, name) {
  return (
    markdown.split("\n").find((l) => l.startsWith(`- **${name}**: `)) ?? null
  );
}

describe("noise ceiling", () => {
  test("a row above the CV ceiling is bracketed and never wins, baseline included", () => {
    // Rows were published as table WINNERS at CV 384% and 2515% — an unstable
    // series buys more shots at a lucky median, so ranking it rewards
    // instability (2026-07-30 audit, finding 8).
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Erratic", medianMs: 5, stddevMs: 130, cvPct: 2515.5 }),
        okRow({ label: "Steady", medianMs: 18, stddevMs: 1, cvPct: 4.2 }),
      ]),
    );
    const rows = rowsByLabel(md);
    assert.ok(rows["Erratic ⚠"], "the noisy row carries the unranked marker");
    assert.equal(
      rows["Erratic ⚠"][COL.primary],
      "(5.0 ms)",
      "time bracketed, still visible",
    );
    assert.equal(rows["Erratic ⚠"][COL.vsFastest], "not ranked");
    assert.equal(
      rows.Steady[COL.vsFastest],
      "1.00x",
      "the stable row anchors the ranking",
    );
    assert.match(
      notesLineFor(md, "Erratic ⚠"),
      /TOO NOISY TO RANK — CV 2515\.5%/,
    );
  });

  test("the 10% noise flag alone does not unrank", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Flagged", medianMs: 5, cvPct: 15.8 }),
        okRow({ label: "Quiet", medianMs: 18, cvPct: 4.2 }),
      ]),
    );
    const rows = rowsByLabel(md);
    assert.ok(rows.Flagged, "a merely-noisy row keeps its name unmarked");
    assert.equal(rows.Flagged[COL.vsFastest], "1.00x");
    assert.match(rows.Flagged[COL.cv], /15\.8% ⚠/);
  });

  test("the ceiling needs three samples — a two-run spread is flagged, never bracketed", () => {
    // With n=2 the stddev is |a−b|/√2, so one page-cache blip beside a
    // minutes-scale baseline clears any ceiling with no third sample to say
    // which run was the outlier — the ceiling's own rationale ("more shots at
    // a lucky median") assumes there are draws to shop between. The 10% ⚠
    // flag still marks the row at any sample count.
    const md = renderSurfaceMarkdown(
      surface([
        okRow({
          label: "TwoRuns",
          medianMs: 60_000,
          stddevMs: 48_000,
          cvPct: 80,
          runs: [26_000, 94_000],
        }),
        okRow({
          label: "Steady",
          medianMs: 90_000,
          stddevMs: 900,
          cvPct: 1,
          runs: [89_000, 91_000],
        }),
      ]),
    );
    const rows = rowsByLabel(md);
    assert.ok(
      rows.TwoRuns,
      "a two-run row above the ceiling keeps its unmarked name",
    );
    assert.equal(rows.TwoRuns[COL.vsFastest], "1.00x", "and stays ranked");
    assert.match(
      rows.TwoRuns[COL.cv],
      /80\.0% ⚠/,
      "the noise flag applies at any n",
    );
    assert.ok(
      !md.includes("TOO NOISY TO RANK"),
      "no bracketing without a third sample",
    );
  });

  test("the same CV with three samples is bracketed", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({
          label: "ThreeRuns",
          medianMs: 60_000,
          stddevMs: 48_000,
          cvPct: 80,
          runs: [26_000, 60_000, 94_000],
        }),
        okRow({ label: "Steady", medianMs: 90_000, cvPct: 1 }),
      ]),
    );
    const rows = rowsByLabel(md);
    assert.ok(
      rows["ThreeRuns ⚠"],
      "three samples above the ceiling bracket the row",
    );
    assert.equal(rows["ThreeRuns ⚠"][COL.vsFastest], "not ranked");
    assert.match(
      notesLineFor(md, "ThreeRuns ⚠"),
      /TOO NOISY TO RANK — CV 80\.0%/,
    );
    assert.equal(rows.Steady[COL.vsFastest], "1.00x");
  });
});

describe("ranking order", () => {
  test("rows are sorted by median ascending regardless of declaration order", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Slow", medianMs: 300 }),
        okRow({ label: "Fast", medianMs: 100 }),
        okRow({ label: "Middle", medianMs: 200 }),
      ]),
    );

    assert.deepEqual(tableLabels(md), ["Fast", "Middle", "Slow"]);
  });

  test("the ranking statistic is the median — mean, min and max each give a different answer", () => {
    // Every row here is deliberately skewed so that no two candidate statistics
    // agree. Ranked on the median the order is Spiky, Steady; ranked on the
    // mean, the min or the max it is Steady, Spiky — and the "vs fastest"
    // multiplier differs in all four. Rows whose median happens to equal their
    // mean (the common test-fixture shape) cannot tell any of this apart.
    const md = renderSurfaceMarkdown(
      surface([
        okRow({
          label: "Spiky",
          medianMs: 100,
          meanMs: 500,
          minMs: 90,
          maxMs: 1900,
          stddevMs: 700,
        }),
        okRow({
          label: "Steady",
          medianMs: 200,
          meanMs: 150,
          minMs: 20,
          maxMs: 210,
          stddevMs: 5,
        }),
      ]),
    );

    assert.deepEqual(
      tableLabels(md),
      ["Spiky", "Steady"],
      "sorted on the median",
    );

    const rows = rowsByLabel(md);
    // The primary column prints the median itself, not a neighbouring statistic.
    assert.equal(rows.Spiky[COL.primary], "**100.0 ms**");
    assert.equal(rows.Steady[COL.primary], "**200.0 ms**");
    // 200/100. Mean would be 500/150 = 3.33x, min 90/20 = 4.50x, max 1900/210 = 9.05x.
    assert.equal(rows.Spiky[COL.vsFastest], "1.00x");
    assert.equal(rows.Steady[COL.vsFastest], "2.00x");
    for (const wrong of [
      "3.33x",
      "4.50x",
      "9.05x",
      "0.30x",
      "0.22x",
      "0.11x",
    ]) {
      assert.notEqual(
        rows.Steady[COL.vsFastest],
        wrong,
        `ranking baseline is not the ${wrong} statistic`,
      );
    }
  });

  test("error and skipped rows sort last and never become the fastest baseline", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Slow", medianMs: 100 }),
        {
          ...okRow({ label: "Broken" }),
          status: "error",
          error: "spawn failed",
          medianMs: undefined,
        },
        {
          ...okRow({ label: "Missing" }),
          status: "skipped",
          notes: "Binary not found",
          medianMs: undefined,
        },
        okRow({ label: "Fast", medianMs: 50 }),
      ]),
    );

    const labels = tableLabels(md);
    assert.deepEqual(
      labels.slice(0, 2),
      ["Fast", "Slow"],
      "ok rows rank first",
    );
    // Status is a marker on the name, not a column.
    assert.deepEqual(labels.slice(2).sort(), ["Broken ❌", "Missing ⏭"]);

    const [table] = collectMarkdownTables(md);
    const vsFastest = Object.fromEntries(
      table.body.map((cells) => [cells[0], cells[COL.vsFastest]]),
    );
    // Baseline is the fastest *ok* median (50), not the +Infinity of an error row.
    assert.equal(vsFastest.Fast, "1.00x");
    assert.equal(vsFastest.Slow, "2.00x");
    assert.equal(vsFastest["Broken ❌"], "–");
    assert.equal(vsFastest["Missing ⏭"], "–");
  });

  test("a class made only of error/skipped rows produces no bogus baseline", () => {
    const md = renderSurfaceMarkdown(
      surface([
        {
          ...okRow({ label: "Broken" }),
          status: "error",
          error: "boom",
          medianMs: undefined,
        },
        {
          ...okRow({ label: "Missing" }),
          status: "skipped",
          medianMs: undefined,
        },
      ]),
    );

    const [table] = collectMarkdownTables(md);
    for (const cells of table.body) {
      assert.equal(cells[COL.vsFastest], "–");
    }
    assert.ok(!md.includes("NaN"), "no NaN leaked into the rendered table");
    assert.ok(
      !md.includes("Infinity"),
      "no Infinity leaked into the rendered table",
    );
  });
});

/**
 * `status: "unranked"` is the row for a tool that WAS measured but failed a
 * validation gate (the planted-bug work gate, an empty-codegen check). Its
 * timing is published for context and must be excluded from every comparison.
 * Getting this wrong publishes the fastest number in the table as the winner
 * while the row that produced it never did the work.
 */
describe("unranked rows — ⚠ failed validation", () => {
  const unrankedRow = (overrides = {}) => ({
    ...okRow({ label: "Cheat", medianMs: 10, ...overrides }),
    status: "unranked",
    throughput: "n/a",
    notes: "unranked: failed planted-bug work gate (no template diagnostic)",
    ...overrides,
  });

  function rendered(extra = []) {
    return renderSurfaceMarkdown(
      surface([
        okRow({ label: "Fast", medianMs: 100 }),
        okRow({ label: "Slow", medianMs: 200 }),
        unrankedRow(),
        ...extra,
      ]),
    );
  }

  test("its name carries the ⚠ marker instead of a status column", () => {
    assert.ok(
      rowsByLabel(rendered())["Cheat ⚠"],
      "unranked row must be named with a trailing ⚠",
    );
  });

  test("its time is rendered in brackets, never as a plain ranking number", () => {
    const cells = rowsByLabel(rendered())["Cheat ⚠"];
    assert.equal(cells[COL.primary], "(10.0 ms)", "median must be bracketed");
    assert.equal(cells[COL.min], "(9.0 ms)", "min must be bracketed too");
    // Bold is the ranked-row treatment; an unranked row must not wear it.
    assert.ok(
      !cells[COL.primary].includes("**"),
      "an unranked time must not be bolded like a ranking",
    );
  });

  test("it is excluded from the vs-fastest comparison", () => {
    const rows = rowsByLabel(rendered());
    assert.equal(rows["Cheat ⚠"][COL.vsFastest], "not ranked");
    assert.equal(
      rows["Cheat ⚠"][COL.cv],
      "–",
      "no CV% for a row that is not competing",
    );
    assert.equal(rows["Cheat ⚠"][COL.stddev], "–");
    assert.equal(
      rows["Cheat ⚠"][COL.throughput],
      "–",
      "throughput is a ranking number",
    );
  });

  test("it is never counted as the fastest, even when it is the fastest number in the table", () => {
    // Cheat's 10ms is the smallest median present. The baseline must still be
    // Fast's 100ms, so Slow stays at 2.00x rather than 20.00x.
    const rows = rowsByLabel(rendered());
    assert.equal(
      rows.Fast[COL.vsFastest],
      "1.00x",
      "the fastest OK row is the baseline",
    );
    assert.equal(rows.Slow[COL.vsFastest], "2.00x");
    assert.notEqual(
      rows.Slow[COL.vsFastest],
      "20.00x",
      "the unranked 10ms row became the baseline",
    );
  });

  test("it shows its reason in the Notes collapsible and sorts below every ranked row", () => {
    const md = rendered();
    assert.deepEqual(tableLabels(md), ["Fast", "Slow", "Cheat ⚠"]);
    assert.match(
      notesLineFor(md, "Cheat ⚠") ?? "",
      /failed planted-bug work gate \(no template diagnostic\)/,
      "the reason a row is unranked must be in its notes entry",
    );
    assert.ok(
      md.includes("<details><summary>Notes</summary>"),
      "notes live in a collapsible",
    );
  });

  test("its raw runs are still published — the timing is reported, only the ranking is withheld", () => {
    const md = rendered();
    assert.ok(
      md.includes("- **Cheat**:"),
      "an unranked row's measured runs must still be visible",
    );
  });

  test("an unranked row does not become the baseline for a class of its own either", () => {
    // Sole survivor: with no OK row at all there is no baseline to invent.
    const md = renderSurfaceMarkdown(surface([unrankedRow()]));
    const [table] = collectMarkdownTables(md);
    assert.equal(table.body[0][COL.vsFastest], "not ranked");
    assert.ok(!md.includes("NaN"), "no NaN leaked into the rendered table");
    assert.ok(
      !md.includes("Infinity"),
      "no Infinity leaked into the rendered table",
    );
  });
});

/**
 * The artifact ⚠ guard. Timing alone cannot tell "fast" from "did less": a tool
 * that emits a third of the code, or parses a third of the corpus, is quicker
 * for reasons that have nothing to do with being better. A row materially below
 * the largest artifact in its class is flagged so the number is not read at face
 * value — except where MORE does not mean more work (a diagnostics census on a
 * clean corpus), where the flag would scold the tools that are behaving.
 */
describe("artifact ⚠ guard", () => {
  function artifactSurface(rows) {
    return renderSurfaceMarkdown(
      surface(
        rows.map(([label, medianMs, artifactMedian, extra = {}]) =>
          okRow({
            label,
            medianMs,
            artifactMedian,
            artifactLabel: "Code bytes",
            ...extra,
          }),
        ),
      ),
    );
  }

  test("a row below half the class peak is flagged and told what share it produced", () => {
    const md = artifactSurface([
      ["Full", 300, 800],
      ["Half", 200, 400],
      ["Thin", 100, 200],
    ]);
    const rows = rowsByLabel(md);

    assert.equal(
      rows.Thin[COL.artifact],
      "200 ⚠",
      "25% of the peak must be flagged",
    );
    assert.match(
      notesLineFor(md, "Thin") ?? "",
      /produced 25% of the largest artifact in this class — speed is not comparable/,
    );
    // Exactly 50% is the documented boundary and is NOT flagged.
    assert.equal(
      rows.Half[COL.artifact],
      "400",
      "exactly half the peak is the boundary, not a warning",
    );
    assert.ok(
      !(notesLineFor(md, "Half") ?? "").includes("produced"),
      notesLineFor(md, "Half") ?? "",
    );
    assert.equal(
      rows.Full[COL.artifact],
      "800",
      "the peak itself is never flagged",
    );
    assert.ok(
      !(notesLineFor(md, "Full") ?? "").includes("produced"),
      notesLineFor(md, "Full") ?? "",
    );
  });

  test("artifactPolarity informational suppresses the warning", () => {
    const md = artifactSurface([
      ["Full", 300, 800, { artifactPolarity: "informational" }],
      ["Thin", 100, 200, { artifactPolarity: "informational" }],
    ]);
    const rows = rowsByLabel(md);

    assert.equal(
      rows.Thin[COL.artifact],
      "200",
      "an informational census must not be flagged",
    );
    const thinNotes = notesLineFor(md, "Thin") ?? "";
    assert.ok(!thinNotes.includes("⚠"), thinNotes);
    assert.ok(!thinNotes.includes("produced"), thinNotes);
  });

  test("polarity is per-row: an informational row is spared while its neighbour is not", () => {
    const md = artifactSurface([
      ["Full", 300, 800],
      ["ThinWork", 100, 100],
      ["ThinInfo", 50, 100, { artifactPolarity: "informational" }],
    ]);
    const rows = rowsByLabel(md);

    assert.equal(rows.ThinWork[COL.artifact], "100 ⚠");
    assert.equal(rows.ThinInfo[COL.artifact], "100");
  });

  test("the peak comes from ranked rows only — an unranked row cannot raise the bar", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Full", medianMs: 300, artifactMedian: 800 }),
        okRow({ label: "Half", medianMs: 200, artifactMedian: 400 }),
        {
          ...okRow({ label: "Cheat", medianMs: 10, artifactMedian: 100_000 }),
          status: "unranked",
          notes: "failed validation",
        },
      ]),
    );
    const rows = rowsByLabel(md);

    // Peak is Full's 800, so Half is exactly at the boundary and unflagged. If
    // the unranked 100,000 counted, everything would be flagged.
    assert.equal(rows.Half[COL.artifact], "400");
    assert.equal(rows.Full[COL.artifact], "800");
    assert.equal(
      rows["Cheat ⚠"][COL.artifact],
      "(100,000)",
      "an unranked artifact is bracketed too",
    );
  });

  test("a row with no artifact census renders n/a and is not flagged", () => {
    const md = artifactSurface([
      ["Full", 300, 800],
      ["Unknown", 100, undefined],
    ]);
    const rows = rowsByLabel(md);

    assert.equal(rows.Unknown[COL.artifact], "n/a");
    assert.ok(
      !(notesLineFor(md, "Unknown") ?? "").includes("produced"),
      notesLineFor(md, "Unknown") ?? "",
    );
  });

  test("the artifact column is titled by artifactLabel, so the census names its unit", () => {
    const [table] = collectMarkdownTables(
      artifactSurface([["Full", 300, 800]]),
    );
    assert.equal(table.header[COL.artifact], "Code bytes");

    const [plain] = collectMarkdownTables(
      renderSurfaceMarkdown(surface([okRow({ label: "A" })])),
    );
    assert.equal(
      plain.header[COL.artifact],
      "Artifact",
      "a surface with no label still names the column",
    );
  });
});

describe("rules stated once per document, not once per table", () => {
  test("a surface does not restate the ranking rules", () => {
    // They used to head every surface: 16 verbatim copies in README.md. They
    // are a property of the report, so the document states them.
    const md = renderSurfaceMarkdown(surface([okRow({ label: "A" })]));
    assert.ok(
      !md.includes(RANKING_RULES),
      "the ranking rules belong to the document",
    );
  });

  test("a full report carries them in its methodology notes", () => {
    const md = renderFullMarkdown({
      generatedAt: "now",
      fixture: "fixtures/10",
      fileCount: 10,
      settings: { runs: 5, warmups: 1 },
      runner: {
        label: "R",
        platform: "linux",
        arch: "x64",
        cpuCount: 4,
        cpuModel: "cpu",
      },
      versions: { node: "v22" },
      methodology: buildMethodologyNotes(),
      surfaces: [surface([okRow({ label: "A" })])],
    });

    assert.match(
      md,
      /median of measured runs/,
      "the primary metric must be stated somewhere",
    );
    assert.match(
      md,
      /Status is a marker on the tool NAME/,
      "the name markers must be documented",
    );
  });

  test("a grouped surface prints a grouping note only when it has one", () => {
    const grouped = (extra) =>
      renderSurfaceMarkdown(
        surface([], {
          groups: [
            {
              label: "Cell",
              target: "vdom",
              env: "production",
              variants: [okRow()],
            },
          ],
          ...extra,
        }),
      );

    // The IDE suites are grouped too, and the compile matrix's explanation is
    // not theirs — a renderer default put it above all eight of them.
    assert.ok(!grouped({}).includes("grouped by"), "no default grouping prose");
    assert.ok(
      grouped({ groupingNote: "Grouped by cell." }).includes(
        "Grouped by cell.",
      ),
    );
  });
});

describe("comparison classes", () => {
  test("an in-process tool and a CLI tool share one table with one baseline", () => {
    // Invocation is a row property, not a table split: the mode lives in the
    // label/legend/notes, and the caveat (a CLI pays startup every run) lives
    // in the methodology notes.
    const md = renderSurfaceMarkdown(
      surface([
        okRow({
          label: "CliTool",
          invocation: "cli",
          threading: "1t",
          medianMs: 500,
        }),
        okRow({
          label: "ApiTool",
          invocation: "in-process",
          threading: "1t",
          medianMs: 5,
        }),
      ]),
    );

    const tables = collectMarkdownTables(md);
    assert.equal(tables.length, 1, "one table for the surface");
    assert.deepEqual(classTitles(md), [], "no class headings");
    assert.deepEqual(
      tableLabels(md),
      ["ApiTool", "CliTool"],
      "sorted by median",
    );

    const rows = rowsByLabel(md);
    assert.equal(
      rows.ApiTool[COL.vsFastest],
      "1.00x",
      "single shared baseline",
    );
    assert.equal(rows.CliTool[COL.vsFastest], "100.00x");
  });

  test("threading modes share the table too", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Single", invocation: "cli", threading: "1t" }),
        okRow({ label: "Batch", invocation: "cli", threading: "batch" }),
      ]),
    );

    assert.equal(collectMarkdownTables(md).length, 1);
  });

  test("an explicit work-equivalence class gets its own baseline", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({
          label: "Vize raw",
          target: "vdom",
          comparisonClass: "raw-render-batch",
          comparisonClassLabel: "Raw render batch — all stages rerun",
          medianMs: 20,
        }),
        okRow({
          label: "Verter raw",
          target: "vdom",
          comparisonClass: "raw-render-batch",
          comparisonClassLabel: "Raw render batch — all stages rerun",
          medianMs: 30,
        }),
        okRow({
          label: "Verter retained",
          target: "vdom",
          comparisonClass: "retained-host-render",
          comparisonClassLabel: "Warm-host re-render — retained compiler state",
          medianMs: 5,
        }),
      ]),
    );

    const tables = collectMarkdownTables(md);
    assert.equal(tables.length, 2);
    assert.ok(classTitles(md).includes("Raw render batch — all stages rerun"));
    assert.ok(
      classTitles(md).includes("Warm-host re-render — retained compiler state"),
    );
    const rawTable = tables.find((table) =>
      table.body.some((row) => row[0] === "Vize raw"),
    );
    const retainedTable = tables.find((table) =>
      table.body.some((row) => row[0] === "Verter retained"),
    );
    assert.equal(
      rawTable.body.find((row) => row[0] === "Vize raw")[COL.vsFastest],
      "1.00x",
    );
    assert.equal(
      rawTable.body.find((row) => row[0] === "Verter raw")[COL.vsFastest],
      "1.50x",
    );
    assert.equal(retainedTable.body[0][COL.vsFastest], "1.00x");
  });

  test("an explicit Vue reference remains the denominator when a candidate is faster", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({
          label: "Vue reference",
          comparisonClass: "raw-render",
          comparisonClassLabel: "Raw render",
          baseline: true,
          baselineLabel: "Vue",
          medianMs: 20,
        }),
        okRow({
          label: "Native candidate",
          comparisonClass: "raw-render",
          comparisonClassLabel: "Raw render",
          medianMs: 5,
        }),
      ]),
    );

    const table = collectMarkdownTables(md)[0];
    assert.match(table.header.join(" | "), /vs Vue baseline/);
    assert.equal(
      table.body[0][COL.tool],
      "Vue reference",
      "reference renders first",
    );
    assert.equal(table.body[0][COL.vsFastest], "1.00x");
    assert.equal(
      table.body.find((row) => row[COL.tool] === "Native candidate")[
        COL.vsFastest
      ],
      "0.25x",
      "candidate is relative to Vue, not itself",
    );
  });

  test("codegen targets still split — vapor and VDOM are different jobs", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "VaporTool", target: "vapor", medianMs: 10 }),
        okRow({ label: "VdomTool", target: "vdom", medianMs: 20 }),
      ]),
    );

    const tables = collectMarkdownTables(md);
    assert.equal(tables.length, 2, "one table per codegen target");
    const titles = classTitles(md);
    assert.ok(
      titles.some((t) => t.startsWith("VAPOR")),
      titles.join(" | "),
    );
    assert.ok(
      titles.some((t) => t.startsWith("VDOM")),
      titles.join(" | "),
    );
    // Each target has its own baseline — the 2x gap never crosses tables.
    for (const table of tables) {
      assert.equal(table.body[0][COL.vsFastest], "1.00x");
    }
  });

  test("a homogeneous surface renders a single untitled table", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "A", invocation: "cli", threading: "1t" }),
        okRow({ label: "B", invocation: "cli", threading: "1t" }),
      ]),
    );

    assert.equal(collectMarkdownTables(md).length, 1);
    assert.deepEqual(
      classTitles(md),
      [],
      "no class heading when there is only one class",
    );
  });

  test("a skip row carrying the measured rows' target shares their single table", () => {
    // The live fault this pins (project-typecheck's golar ⏭ row): a skip row
    // WITHOUT `target` falls into classKey's untitled "all" class, so a group
    // whose measured rows are all `target: project-typecheck` rendered as an
    // untitled skip-only table followed by a false "PROJECT-TYPECHECK — ranked
    // alone" heading over the rows that ARE ranked together. With the field on
    // the skip row, the group is one class and one table again.
    const native = [
      okRow({
        label: "verter-tsc",
        target: "project-typecheck",
        invocation: "cli",
        medianMs: 500,
      }),
      okRow({
        label: "Vize check",
        target: "project-typecheck",
        invocation: "cli",
        medianMs: 700,
      }),
      {
        ...okRow({ label: "Golar typecheck" }),
        status: "skipped",
        medianMs: undefined,
        runs: undefined,
        target: "project-typecheck",
        invocation: "cli",
        notes: "⏭ NOT MEASURED — not yet wired into this surface.",
      },
    ];
    const md = renderSurfaceMarkdown(
      surface([], {
        groups: [
          {
            id: "engine-native",
            label: "Native tsgo engines — ranked together",
            variants: native,
          },
        ],
        groupingNote: "Grouped by engine.",
      }),
    );

    assert.ok(
      !md.includes("— ranked alone"),
      "no per-class heading may appear inside the group",
    );
    const tables = collectMarkdownTables(md);
    assert.equal(
      tables.length,
      1,
      "the skip row shares the measured rows' single table",
    );
    const labels = tables[0].body.map((cells) => cells[0]);
    assert.ok(labels.includes("Golar typecheck ⏭"), labels.join(" | "));
  });
});

describe("noise flag", () => {
  test("CV% above 10 is flagged and CV% at or below 10 is not", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Noisy", medianMs: 10, cvPct: 10.1 }),
        okRow({ label: "Steady", medianMs: 20, cvPct: 10 }),
        okRow({ label: "Calm", medianMs: 30, cvPct: 0 }),
      ]),
    );

    const [table] = collectMarkdownTables(md);
    const cv = Object.fromEntries(
      table.body.map((cells) => [cells[0], cells[COL.cv]]),
    );

    assert.equal(cv.Noisy, "10.1% ⚠");
    assert.equal(cv.Steady, "10.0%");
    assert.equal(cv.Calm, "0.0%");
  });

  test("a missing CV% renders n/a instead of NaN", () => {
    const md = renderSurfaceMarkdown(
      surface([okRow({ label: "NoCv", cvPct: undefined })]),
    );

    const [table] = collectMarkdownTables(md);
    assert.equal(table.body[0][COL.cv], "n/a");
  });
});

describe("markdown table integrity", () => {
  /** Header, separator and every body row must agree on column count. */
  function assertTablesWellFormed(markdown, what) {
    const tables = collectMarkdownTables(markdown);
    assert.ok(tables.length > 0, `${what}: expected at least one table`);
    for (const table of tables) {
      const columns = table.header.length;
      assert.ok(columns > 1, `${what}: table header has ${columns} column(s)`);
      assert.ok(
        isSeparatorRow(table.lines[1]),
        `${what}: missing separator row after header`,
      );
      assert.equal(
        table.separator.length,
        columns,
        `${what}: separator/header column mismatch`,
      );
      table.body.forEach((cells, i) => {
        assert.equal(
          cells.length,
          columns,
          `${what}: body row ${i} has ${cells.length} of ${columns} columns`,
        );
      });
    }
  }

  test("a flat surface renders well-formed tables", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "A", medianMs: 10 }),
        {
          ...okRow({ label: "B" }),
          status: "error",
          error: "boom",
          medianMs: undefined,
        },
        {
          ...okRow({ label: "C" }),
          status: "skipped",
          notes: "Binary not found",
          medianMs: undefined,
        },
      ]),
    );

    assertTablesWellFormed(md, "flat surface");
  });

  test("notes with pipes and newlines live outside the table and cannot shift columns", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "A", notes: "gate: script=✓ | template=✓ | corpus=✓" }),
        {
          ...okRow({ label: "B" }),
          status: "error",
          error: "cmd | failed\nsecond line",
          medianMs: undefined,
        },
        {
          ...okRow({ label: "C" }),
          status: "skipped",
          notes: "unranked | failed planted-bug work gate",
          medianMs: undefined,
        },
      ]),
    );

    assertTablesWellFormed(md, "notes with pipes");
    // Notes are a list inside the collapsible, not table cells, so pipes are
    // harmless there — but each entry must be one line.
    assert.match(
      notesLineFor(md, "A") ?? "",
      /gate: script=✓ \| template=✓ \| corpus=✓/,
    );
    assert.match(
      notesLineFor(md, "B ❌") ?? "",
      /cmd \| failed second line/,
      "newlines flattened to one line",
    );
    assert.match(notesLineFor(md, "C ⏭") ?? "", /failed planted-bug work gate/);
  });

  test("a grouped (compile-matrix) surface renders well-formed tables", () => {
    const md = renderSurfaceMarkdown(
      surface([], {
        groups: [
          {
            label: "VDOM / production / sourcemap off",
            target: "vdom",
            env: "production",
            sourceMap: false,
            variants: [
              okRow({ label: "A", medianMs: 10, invocation: "in-process" }),
              okRow({ label: "B", medianMs: 20, invocation: "cli" }),
            ],
          },
          {
            label: "Vapor / development / sourcemap on",
            target: "vapor",
            env: "development",
            sourceMap: true,
            variants: [okRow({ label: "C", medianMs: 30 })],
          },
        ],
      }),
    );

    assertTablesWellFormed(md, "grouped surface");
    assert.ok(md.includes("#### VDOM / production / sourcemap off"));
    assert.ok(md.includes("#### Vapor / development / sourcemap on"));
  });

  test("renderFullMarkdown produces well-formed tables end to end", () => {
    const md = renderFullMarkdown({
      generatedAt: "2026-01-01T00:00:00.000Z",
      fixture: "fixtures/200",
      fileCount: 200,
      settings: { runs: 5, warmups: 1 },
      runner: {
        label: "local",
        platform: "win32",
        arch: "x64",
        cpuCount: 8,
        cpuModel: "Test CPU",
      },
      versions: { node: "v22.0.0", vue: "3.5.40", vize: "0.291.0" },
      commit: {
        sha: "94f6696b1c7b6f54928678126b9831febd70b4ff",
        repository: "pikax/vue-benchmarks",
      },
      methodology: buildMethodologyNotes(),
      surfaces: [
        surface([
          okRow({ label: "A", medianMs: 10, invocation: "cli" }),
          okRow({ label: "B", medianMs: 20, invocation: "in-process" }),
        ]),
      ],
    });

    assertTablesWellFormed(md, "full report");
    assert.ok(md.includes("| Package | Version |"));
    assert.ok(md.includes("| vue | 3.5.40 |"));
    assert.match(
      md,
      /Benchmark commit.*94f6696b1c7b6f54928678126b9831febd70b4ff/,
    );
    assert.ok(
      !md.includes("| node |"),
      "node is reported separately, not in the versions table",
    );
  });

  test("raw runs are rendered for ok rows only", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "A", medianMs: 10, runs: [9, 10, 11] }),
        {
          ...okRow({ label: "B" }),
          status: "error",
          error: "boom",
          runs: undefined,
          medianMs: undefined,
        },
      ]),
    );

    assert.ok(md.includes("- **A**:"), "ok row missing from raw runs");
    assert.ok(
      !md.includes("- **B**:"),
      "error row must not appear in raw runs",
    );
  });

  test("IDE rows with coldMedianMs rank on cold and emit vs fastest cold", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Volar", medianMs: 4.3, coldMedianMs: 46.4 }),
        okRow({ label: "Vize", medianMs: 1.0, coldMedianMs: 12.0 }),
      ]),
    );
    assert.match(md, /\*\*Cold\*\*/);
    assert.match(md, /vs fastest cold/);
    assert.match(md, /\*\*Warm\*\*/);
    const vize = md.indexOf("**12.0 ms**");
    const volar = md.indexOf("**46.4 ms**");
    assert.ok(
      vize >= 0 && volar >= 0 && vize < volar,
      "sorted by cold ascending",
    );
    assert.match(md, /\*\*12\.0 ms\*\* \| 1\.00x/);
  });

  test("IDE cold and warm raw samples are both retained in full reports", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({
          label: "Vue",
          medianMs: 10,
          runs: [9, 10, 11],
          coldMedianMs: 20,
          coldRuns: [18, 20, 22],
        }),
      ]),
    );
    assert.match(md, /Cold: 18\.0 ms, 20\.0 ms, 22\.0 ms/);
    assert.match(md, /Warm: 9\.0 ms, 10\.0 ms, 11\.0 ms/);
  });

  test("Compiler Fresh child has its own distribution and Warm remains primary", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({
          label: "Slower warm",
          medianMs: 30,
          minMs: 29,
          runs: [29, 30, 31],
          freshChildMedianMs: 5,
          freshChildMinMs: 4,
          freshChildStddevMs: 1,
          freshChildCvPct: 20,
          freshChildRuns: [4, 5, 6],
        }),
        okRow({
          label: "Faster warm",
          medianMs: 10,
          minMs: 9,
          runs: [9, 10, 11],
          freshChildMedianMs: 50,
          freshChildMinMs: 49,
          freshChildStddevMs: 1,
          freshChildCvPct: 2,
          freshChildRuns: [49, 50, 51],
        }),
      ]),
    );
    assert.match(md, /Fresh child.*Fresh min.*Fresh stddev.*Fresh CV%/);
    assert.match(md, /Warm \(primary\)/);
    assert.match(
      md,
      /Fresh child \(first timed row workload\): 4\.0 ms, 5\.0 ms, 6\.0 ms/,
    );
    assert.ok(
      md.indexOf("Faster warm") < md.indexOf("Slower warm"),
      "Warm must order rows",
    );
  });

  test("Fresh-child noise gates only its ratio and leaves raw values plus Warm ranked", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({
          label: "Noisy first workload",
          medianMs: 10,
          minMs: 9,
          runs: [9, 10, 11],
          freshChildMedianMs: 20,
          freshChildMinMs: 1,
          freshChildStddevMs: 15,
          freshChildCvPct: 75,
          freshChildRuns: [1, 20, 40],
        }),
      ]),
    );
    assert.match(md, /\(20\.0 ms\) ⚠/);
    assert.match(md, /not ranked \| \*\*10\.0 ms\*\*/);
    assert.match(md, /FRESH-CHILD SERIES TOO NOISY FOR ITS OWN RATIO/);
    assert.doesNotMatch(md, /Noisy first workload ⚠/);
  });
});

describe("Peak RSS", () => {
  test("a speed surface with rssMaxMb grows a Peak RSS table", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Small", medianMs: 10, rssMaxMb: 32.3 }),
        okRow({ label: "Large", medianMs: 20, rssMaxMb: 140.7 }),
      ]),
    );
    assert.match(md, /#### Peak RSS/);
    assert.match(md, /\*\*32\.3 MB\*\*/);
    const small = md.indexOf("**32.3 MB**");
    const large = md.indexOf("**140.7 MB**");
    assert.ok(
      small >= 0 && large >= 0 && small < large,
      "RSS table sorted ascending",
    );
  });
});

describe("methodology notes", () => {
  test("notes are a non-empty list of strings", () => {
    const notes = buildMethodologyNotes();
    assert.ok(Array.isArray(notes));
    assert.ok(notes.length > 5);
    for (const note of notes) assert.equal(typeof note, "string");
  });

  test("the documented invariants match the ones the code enforces", () => {
    const text = buildMethodologyNotes().join("\n");
    assert.match(
      text,
      /performance rankings.*compatibility-gap findings/i,
      "reports must preserve the project's performance-and-gap dual purpose",
    );
    assert.match(
      text,
      /Warm median of measured runs/i,
      "primary metric must be documented",
    );
    assert.match(
      text,
      /Compiler.*Fresh-child median.*first timed row workload/i,
      "the Compiler fresh-child boundary must stay documented",
    );
    assert.match(
      text,
      /warmups 0.*clamped to 1|clamped to 1/i,
      "warmup clamping must stay documented",
    );
    assert.match(text, /rotated/i, "order rotation must stay documented");
    assert.match(
      text,
      /one table unless.*work-equivalence classes/i,
      "the explicit comparison-class rule and its row-property caveats must stay documented",
    );
    assert.match(
      text,
      /CV% > 10/i,
      "the noise flag threshold must stay documented",
    );
  });
});
