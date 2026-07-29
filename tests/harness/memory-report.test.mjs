/**
 * Resource-probe report contract: scripts/lib/memory-report.mjs
 *
 * The table shape is the deliverable here — MEMORY.md is spliced verbatim from
 * this renderer's output, so a dropped column or a mis-escaped note is a silent
 * documentation bug. Assertions read the rendered markdown rather than the
 * private helpers.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { renderMemoryMarkdown, samplesHeadline } from "../../scripts/lib/memory-report.mjs";
import { collectMarkdownTables } from "./helpers.mjs";

/**
 * Column layout, by name. There is no Status column (status is a marker on the
 * name: ❌ error, ⏭ skipped) and no Notes column (notes live in a <details>
 * block under the table); min/max/avg are one cell per metric.
 */
const COL = {
  tool: 0,
  rss: 1,
  alloc: 2,
  cpuMs: 3,
  cpuPct: 4,
  wallMs: 5,
  samples: 6,
};

function okRow(overrides = {}) {
  return {
    id: overrides.label ?? "tool",
    label: "Tool",
    surface: "compile",
    status: "ok",
    minMb: 10,
    maxMb: 20,
    avgMb: 15,
    allocMinMb: 1,
    allocMaxMb: 2,
    allocAvgMb: 1.5,
    cpuTotalMs: 100,
    cpuPercent: 110,
    wallMs: 90,
    samples: 3,
    note: "",
    ...overrides,
  };
}

function report(results, settings = {}) {
  return {
    kind: "memory",
    generatedAt: "2026-01-01T00:00:00.000Z",
    fixture: "fixtures/200",
    settings: { samples: 3, fileLimit: 100, checkFileLimit: 100, metaFileLimit: 50, ...settings },
    versions: { node: "v22.0.0" },
    results,
  };
}

/** Body rows of the first (or nth) results table, keyed by the Tool cell. */
function rowsByLabel(markdown, index = 0) {
  // Table 0 is the Metrics legend; results tables follow.
  return Object.fromEntries(
    collectMarkdownTables(markdown)[index + 1].body.map((cells) => [cells[COL.tool], cells]),
  );
}

function resultsTable(markdown, index = 0) {
  return collectMarkdownTables(markdown)[index + 1];
}

describe("memory table shape", () => {
  test("no Status column and no Notes column", () => {
    const md = renderMemoryMarkdown(report([okRow()]));
    const { header } = resultsTable(md);

    assert.ok(!header.includes("Status"), "Status must be a name marker, not a column");
    assert.ok(!header.includes("Notes"), "Notes must live below the table");
    assert.equal(header.length, 7, `expected 7 columns, got ${header.length}: ${header.join(" | ")}`);
    assert.equal(header[COL.tool], "Tool");
    assert.equal(header[COL.samples], "Samples");
  });

  test("every row has exactly as many cells as the header", () => {
    const md = renderMemoryMarkdown(
      report([
        okRow({ label: "Ok" }),
        okRow({ label: "Gone", status: "skipped", skip: "not installed" }),
        okRow({ label: "Broke", status: "error", error: "boom" }),
      ]),
    );
    const { header, separator, body } = resultsTable(md);
    assert.equal(separator.length, header.length);
    for (const cells of body) {
      assert.equal(cells.length, header.length, `ragged row: ${cells.join(" | ")}`);
    }
  });

  test("min/max/avg collapse into one cell per metric", () => {
    const md = renderMemoryMarkdown(report([okRow({ label: "A" })]));
    const row = rowsByLabel(md)["A"];

    assert.equal(row[COL.rss], "10.00 / 20.00 / 15.00");
    assert.equal(row[COL.alloc], "1.00 / 2.00 / 1.50");
  });

  test("rows are sorted by average RSS ascending, non-ok rows last", () => {
    const md = renderMemoryMarkdown(
      report([
        okRow({ label: "Big", avgMb: 300 }),
        okRow({ label: "Dead", status: "error", error: "boom" }),
        okRow({ label: "Small", avgMb: 5 }),
      ]),
    );
    assert.deepEqual(
      resultsTable(md).body.map((cells) => cells[COL.tool]),
      ["Small", "Big", "Dead ❌"],
    );
  });

  test("one table per surface, in first-seen order", () => {
    const md = renderMemoryMarkdown(
      report([
        okRow({ label: "C", surface: "compile" }),
        okRow({ label: "L", surface: "lint" }),
        okRow({ label: "C2", surface: "compile" }),
      ]),
    );
    const headings = md.split("\n").filter((l) => l.startsWith("### "));
    assert.deepEqual(headings, ["### Metrics", "### compile", "### lint", "### Versions"]);
    assert.deepEqual(
      resultsTable(md).body.map((cells) => cells[COL.tool]),
      ["C", "C2"],
    );
  });
});

describe("status markers", () => {
  test("status is a marker on the name", () => {
    const md = renderMemoryMarkdown(
      report([
        okRow({ label: "Fine" }),
        okRow({ label: "Gone", status: "skipped", skip: "no public API" }),
        okRow({ label: "Broke", status: "error", error: "boom" }),
      ]),
    );
    const rows = rowsByLabel(md);

    assert.ok(rows["Fine"], "an ok row carries no marker");
    assert.ok(rows["Gone ⏭"], "skipped row must be marked ⏭");
    assert.ok(rows["Broke ❌"], "error row must be marked ❌");
  });

  test("a row that never ran prints – in every metric cell, never a number", () => {
    const md = renderMemoryMarkdown(
      report([okRow({ label: "Gone", status: "skipped", skip: "not installed" })]),
    );
    const row = rowsByLabel(md)["Gone ⏭"];
    for (const col of [COL.rss, COL.alloc, COL.cpuMs, COL.cpuPct, COL.wallMs, COL.samples]) {
      assert.equal(row[col], "–");
    }
  });

  test("an error row falls back to its id when it has no label", () => {
    const md = renderMemoryMarkdown(
      report([{ id: "vize-fmt", surface: "format", status: "error", error: "boom" }]),
    );
    assert.ok(rowsByLabel(md)["vize-fmt ❌"], "error row must still be identifiable");
  });
});

describe("unmeasurable vs did-not-run", () => {
  test("a metric this platform cannot measure is n/a, not – and not 0", () => {
    // The Linux CLI path reports RSS and CPU but no allocation figures.
    const md = renderMemoryMarkdown(
      report([
        okRow({
          label: "CLI",
          allocMinMb: Number.NaN,
          allocMaxMb: Number.NaN,
          allocAvgMb: Number.NaN,
        }),
      ]),
    );
    const row = rowsByLabel(md)["CLI"];

    assert.equal(row[COL.alloc], "n/a", "unmeasurable must not read as a measurement");
    assert.notEqual(row[COL.alloc], "–");
    assert.equal(row[COL.rss], "10.00 / 20.00 / 15.00", "RSS is still measured on that path");
  });

  test("a partially measured triple keeps the numbers it has", () => {
    const md = renderMemoryMarkdown(
      report([okRow({ label: "Partial", allocMaxMb: Number.NaN })]),
    );
    assert.equal(rowsByLabel(md)["Partial"][COL.alloc], "1.00 / n/a / 1.50");
  });

  test("CPU below the accounting floor is n/a rather than a confident zero", () => {
    const md = renderMemoryMarkdown(
      report([okRow({ label: "Quick", cpuTotalMs: Number.NaN, cpuPercent: Number.NaN })]),
    );
    const row = rowsByLabel(md)["Quick"];
    assert.equal(row[COL.cpuMs], "n/a");
    assert.equal(row[COL.cpuPct], "n/a");
  });
});

describe("notes", () => {
  test("a note shared by every row is written once, not per row", () => {
    const shared = "RSS/heap deltas vs baseline after GC";
    const md = renderMemoryMarkdown(
      report([
        okRow({ label: "A", note: shared }),
        okRow({ label: "B", note: shared }),
        okRow({ label: "C", note: shared }),
      ]),
    );

    assert.equal(
      md.split(shared).length - 1,
      1,
      "the same note must not be repeated once per row",
    );
    assert.ok(md.includes(`- **All rows** — ${shared}`));
  });

  test("a note held by some rows names exactly those rows", () => {
    const md = renderMemoryMarkdown(
      report([
        okRow({ label: "A", note: "shared" }),
        okRow({ label: "B", note: "shared" }),
        okRow({ label: "C", note: "own note" }),
      ]),
    );

    assert.ok(md.includes("- **A**, **B** — shared"));
    assert.ok(md.includes("- **C** — own note"));
  });

  test("notes are a collapsible under the table, not a column", () => {
    const md = renderMemoryMarkdown(report([okRow({ label: "A", note: "a caveat" })]));
    const tableEnd = md.indexOf("| A |");
    const notes = md.indexOf("<details><summary>Notes</summary>");

    assert.ok(notes > tableEnd, "the Notes block belongs below the table");
    assert.ok(md.includes("- **A** — a caveat"));
  });

  test("skip and error reasons are carried into the notes", () => {
    const md = renderMemoryMarkdown(
      report([
        okRow({ label: "Gone", status: "skipped", skip: "no public API" }),
        okRow({ label: "Broke", status: "error", error: "worker exit 1" }),
      ]),
    );

    assert.ok(md.includes("- **Gone ⏭** — no public API"));
    assert.ok(md.includes("- **Broke ❌** — worker exit 1"));
  });

  test("a multi-line note is flattened so it cannot break the list", () => {
    const md = renderMemoryMarkdown(report([okRow({ label: "A", note: "line one\nline two" })]));
    assert.ok(md.includes("- **A** — line one line two"));
  });

  test("no Notes block is emitted when no row has one", () => {
    const md = renderMemoryMarkdown(report([okRow({ label: "A" })]));
    assert.ok(!md.includes("<details><summary>Notes</summary>"));
  });
});

describe("samples", () => {
  test("the per-row count is rendered by the report itself", () => {
    const md = renderMemoryMarkdown(report([okRow({ label: "A", samples: 3 })]));
    assert.equal(rowsByLabel(md)["A"][COL.samples], "3");
  });

  test("a row short of the requested count is flagged ⚠", () => {
    const md = renderMemoryMarkdown(
      report([okRow({ label: "Full", samples: 3 }), okRow({ label: "Flaky", samples: 1 })]),
    );

    assert.equal(rowsByLabel(md)["Full"][COL.samples], "3");
    assert.equal(rowsByLabel(md)["Flaky"][COL.samples], "1 ⚠", "a short row must not read as full");
  });

  test("the header states the recorded range, never just the requested count", () => {
    const line = samplesHeadline(
      report([okRow({ label: "A", samples: 3 }), okRow({ label: "B", samples: 1 })]),
    );

    assert.match(line, /3 requested/);
    assert.match(line, /1–3 actually recorded/);
  });

  test("the header says so plainly when every row recorded what was asked", () => {
    const line = samplesHeadline(report([okRow({ samples: 3 }), okRow({ samples: 3 })]));
    assert.match(line, /3 requested · 3 recorded for every row/);
  });

  test("the header does not claim a count when no row recorded a sample", () => {
    const line = samplesHeadline(
      report([okRow({ status: "error", error: "boom", samples: undefined })]),
    );
    assert.match(line, /no row recorded any sample/);
  });
});

describe("document frame", () => {
  test("run settings and versions survive the render", () => {
    const md = renderMemoryMarkdown(report([okRow()]));

    assert.match(md, /- \*\*Generated:\*\* 2026-01-01T00:00:00\.000Z/);
    assert.match(md, /- \*\*Fixture:\*\* `fixtures\/200`/);
    assert.match(md, /- \*\*File limit:\*\* 100 \(typecheck 100, meta 50\)/);
    assert.match(md, /- node: v22\.0\.0/);
  });

  test("the reading rules are stated once per document, not once per table", () => {
    const md = renderMemoryMarkdown(
      report([
        okRow({ label: "A", surface: "compile" }),
        okRow({ label: "B", surface: "lint" }),
        okRow({ label: "C", surface: "typecheck" }),
      ]),
    );
    assert.equal(md.split("One table per surface").length - 1, 1);
  });

  test("the Metrics legend documents every column the tables use", () => {
    const md = renderMemoryMarkdown(report([okRow()]));
    const legend = collectMarkdownTables(md)[0];
    const documented = legend.body.map((cells) => cells[0]).join(" ");

    assert.match(documented, /RSS min\/max\/avg/);
    assert.match(documented, /Alloc min\/max\/avg/);
    assert.match(documented, /CPU total \/ %/);
    assert.match(documented, /Samples/);
  });
});
