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
  buildFairnessNotes,
  buildMethodologyNotes,
  renderFullMarkdown,
  renderSurfaceMarkdown,
} from "../../scripts/lib/report.mjs";
import { classTitles, collectMarkdownTables, isSeparatorRow } from "./helpers.mjs";

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

  test("error and skipped rows sort last and never become the fastest baseline", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Slow", medianMs: 100 }),
        { ...okRow({ label: "Broken" }), status: "error", error: "spawn failed", medianMs: undefined },
        { ...okRow({ label: "Missing" }), status: "skipped", notes: "Binary not found", medianMs: undefined },
        okRow({ label: "Fast", medianMs: 50 }),
      ]),
    );

    const labels = tableLabels(md);
    assert.deepEqual(labels.slice(0, 2), ["Fast", "Slow"], "ok rows rank first");
    assert.deepEqual(labels.slice(2).sort(), ["Broken", "Missing"]);

    const [table] = collectMarkdownTables(md);
    const vsFastest = Object.fromEntries(table.body.map((cells) => [cells[0], cells[6]]));
    // Baseline is the fastest *ok* median (50), not the +Infinity of an error row.
    assert.equal(vsFastest.Fast, "1.00x");
    assert.equal(vsFastest.Slow, "2.00x");
    assert.equal(vsFastest.Broken, "n/a");
    assert.equal(vsFastest.Missing, "n/a");
  });

  test("a class made only of error/skipped rows produces no bogus baseline", () => {
    const md = renderSurfaceMarkdown(
      surface([
        { ...okRow({ label: "Broken" }), status: "error", error: "boom", medianMs: undefined },
        { ...okRow({ label: "Missing" }), status: "skipped", medianMs: undefined },
      ]),
    );

    const [table] = collectMarkdownTables(md);
    for (const cells of table.body) {
      assert.equal(cells[6], "n/a");
    }
    assert.ok(!md.includes("NaN"), "no NaN leaked into the rendered table");
    assert.ok(!md.includes("Infinity"), "no Infinity leaked into the rendered table");
  });
});

describe("comparison classes (invocation x threading)", () => {
  test("an in-process tool and a CLI tool are never ranked in the same table", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "CliTool", invocation: "cli", threading: "1t", medianMs: 500 }),
        okRow({ label: "ApiTool", invocation: "in-process", threading: "1t", medianMs: 5 }),
      ]),
    );

    const tables = collectMarkdownTables(md);
    assert.equal(tables.length, 2, "one table per comparison class");

    const titles = classTitles(md);
    assert.equal(titles.length, 2);
    assert.ok(titles.some((t) => t.startsWith("CLI subprocess")), titles.join(" | "));
    assert.ok(titles.some((t) => t.startsWith("In-process API")), titles.join(" | "));

    const grouped = tables.map((t) => t.body.map((cells) => cells[0]));
    assert.ok(
      grouped.some((labels) => labels.length === 1 && labels[0] === "CliTool"),
      "CliTool must be ranked alone",
    );
    assert.ok(
      grouped.some((labels) => labels.length === 1 && labels[0] === "ApiTool"),
      "ApiTool must be ranked alone",
    );

    // The 100x gap must not produce a cross-class "vs fastest" comparison.
    for (const table of tables) {
      assert.equal(table.body[0][6], "1.00x", "each class has its own baseline");
    }
  });

  test("different threading modes split even within one invocation kind", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "Single", invocation: "cli", threading: "1t" }),
        okRow({ label: "Batch", invocation: "cli", threading: "batch" }),
      ]),
    );

    assert.equal(collectMarkdownTables(md).length, 2);
  });

  test("a homogeneous surface renders a single untitled table", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "A", invocation: "cli", threading: "1t" }),
        okRow({ label: "B", invocation: "cli", threading: "1t" }),
      ]),
    );

    assert.equal(collectMarkdownTables(md).length, 1);
    assert.deepEqual(classTitles(md), [], "no class heading when there is only one class");
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
    const cv = Object.fromEntries(table.body.map((cells) => [cells[0], cells[5]]));

    assert.equal(cv.Noisy, "10.1% ⚠");
    assert.equal(cv.Steady, "10.0%");
    assert.equal(cv.Calm, "0.0%");
  });

  test("a missing CV% renders n/a instead of NaN", () => {
    const md = renderSurfaceMarkdown(surface([okRow({ label: "NoCv", cvPct: undefined })]));

    const [table] = collectMarkdownTables(md);
    assert.equal(table.body[0][5], "n/a");
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
      assert.ok(isSeparatorRow(table.lines[1]), `${what}: missing separator row after header`);
      assert.equal(table.separator.length, columns, `${what}: separator/header column mismatch`);
      table.body.forEach((cells, i) => {
        assert.equal(cells.length, columns, `${what}: body row ${i} has ${cells.length} of ${columns} columns`);
      });
    }
  }

  test("a flat surface renders well-formed tables", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "A", medianMs: 10 }),
        { ...okRow({ label: "B" }), status: "error", error: "boom", medianMs: undefined },
        { ...okRow({ label: "C" }), status: "skipped", notes: "Binary not found", medianMs: undefined },
      ]),
    );

    assertTablesWellFormed(md, "flat surface");
  });

  test("pipes in notes are escaped and do not shift columns", () => {
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
    assert.ok(md.includes("\\|"), "a literal pipe in a note must be escaped");
    assert.ok(!/\|[^\n]*\n[^|\n]/.test(md.split("| A |")[1] ?? ""), "newlines in cells must be flattened");
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
    assert.ok(!md.includes("| node |"), "node is reported separately, not in the versions table");
  });

  test("raw runs are rendered for ok rows only", () => {
    const md = renderSurfaceMarkdown(
      surface([
        okRow({ label: "A", medianMs: 10, runs: [9, 10, 11] }),
        { ...okRow({ label: "B" }), status: "error", error: "boom", runs: undefined, medianMs: undefined },
      ]),
    );

    assert.ok(md.includes("- **A**:"), "ok row missing from raw runs");
    assert.ok(!md.includes("- **B**:"), "error row must not appear in raw runs");
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
    assert.match(text, /median of measured runs/i, "primary metric must be documented");
    assert.match(text, /no cold column/i, "removal of the cold metric must stay documented");
    assert.match(text, /warmups 0.*clamped to 1|clamped to 1/i, "warmup clamping must stay documented");
    assert.match(text, /rotated/i, "order rotation must stay documented");
    assert.match(text, /separate tables|separately/i, "class separation must stay documented");
    assert.match(text, /CV% > 10/i, "the noise flag threshold must stay documented");
  });

  test("buildFairnessNotes is a pure alias of buildMethodologyNotes", () => {
    assert.deepEqual(buildFairnessNotes(), buildMethodologyNotes());
  });
});
