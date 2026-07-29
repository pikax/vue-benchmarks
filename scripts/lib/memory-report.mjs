/**
 * Markdown for the resource probe (memory + allocations + CPU).
 *
 * Same compact-table contract the timing report adopted in `report.mjs`:
 *
 *   - NO `Status` column. Status is a marker on the NAME (❌ error, ⏭ skipped),
 *     so a table whose rows are all `ok` spends no width on a column that says
 *     so thirteen times.
 *   - NO `Notes` column. The probe emits the SAME note for every row of an
 *     isolation mode ("RSS/heap deltas vs baseline after GC; ..." on all nine
 *     compile rows), which made the widest column in the table the one with the
 *     least information per row. Notes now sit in a collapsible below the table,
 *     grouped by text: a note shared by every row is written once.
 *   - min/max/avg collapse into ONE cell per metric (`12.91 / 79.50 / 72.59`).
 *     Six numeric columns become two; the `Metrics` legend above the tables
 *     already names them as one concept each.
 *   - The `Samples` column is rendered HERE. It used to be string-appended onto
 *     every row by `update-memory-readme.mjs`, which re-parsed this markdown and
 *     matched rows by their `Tool` cell — a coupling that broke the moment a
 *     column moved. The per-row count lives in `data.results[].samples`, so the
 *     renderer that owns the table owns the column.
 *
 * `n/a` and `–` are NOT interchangeable here. `n/a` means the platform cannot
 * measure that number (Alloc for a CLI tool on Linux — a documented gap that
 * MEMORY.md's prose points at); `–` means the row has no such measurement at
 * all because it never ran.
 */

/** Marker appended to the name instead of a Status column. */
function statusMark(status) {
  if (status === "error") return " ❌";
  if (status === "skipped") return " ⏭";
  return "";
}

function displayName(row) {
  return `${row.label || row.id}${statusMark(row.status)}`;
}

function fmt(n, digits = 2) {
  return Number.isFinite(n) ? n.toFixed(digits) : "n/a";
}

/**
 * One cell for a min/max/avg triple. Unmeasurable on this platform (every
 * component non-finite) prints a single `n/a` rather than `n/a / n/a / n/a`.
 */
function triple(min, max, avg) {
  if (![min, max, avg].some(Number.isFinite)) return "n/a";
  return `${fmt(min)} / ${fmt(max)} / ${fmt(avg)}`;
}

/**
 * Per-row sample count, with ⚠ when the row recorded fewer samples than were
 * requested — a flaky probe that lost two of three samples must not read
 * identically to one that recorded all three.
 */
function samplesCell(row, declared) {
  if (!Number.isFinite(row.samples)) return "–";
  const short = Number.isFinite(declared) && row.samples < declared;
  return short ? `${row.samples} ⚠` : String(row.samples);
}

/** Pipes and newlines would split a bullet across the notes list. */
function noteText(text) {
  return String(text ?? "")
    .trim()
    .replace(/\r?\n/g, " ");
}

/**
 * Notes for one table, grouped by text. The probe attaches the same isolation
 * note to every row it applies to; printing it once with the rows it covers is
 * the whole point of moving notes out of the table.
 */
function renderNotes(rows) {
  const byText = new Map();
  for (const r of rows) {
    const text = noteText(r.status === "ok" ? r.note : r.status === "skipped" ? r.skip : r.error);
    if (!text) continue;
    if (!byText.has(text)) byText.set(text, []);
    byText.get(text).push(displayName(r));
  }
  if (byText.size === 0) return [];

  const lines = ["<details><summary>Notes</summary>", ""];
  for (const [text, names] of byText) {
    // "All rows" only earns its place when it is shorter than the list it
    // replaces — a one-row table names the row.
    const who =
      names.length === rows.length && rows.length > 1
        ? "**All rows**"
        : names.map((n) => `**${n}**`).join(", ");
    lines.push(`- ${who} — ${text}`);
  }
  lines.push("");
  lines.push("</details>");
  return lines;
}

/**
 * The header line for sample counts.
 *
 * The probe prints the REQUESTED count in its settings but stores the count
 * that actually produced data per row, so the header must not claim a number
 * no row reached.
 */
export function samplesHeadline(data) {
  const declared = Number(data?.settings?.samples);
  const observed = (data?.results ?? [])
    .map((r) => r.samples)
    .filter((n) => Number.isFinite(n));
  const min = observed.length ? Math.min(...observed) : null;
  const max = observed.length ? Math.max(...observed) : null;

  if (!Number.isFinite(declared)) {
    return "- **Samples per tool:** see the **Samples** column (recorded per row)";
  }
  if (min === null) {
    return `- **Samples per tool:** ${declared} requested · no row recorded any sample`;
  }
  if (min === max && min === declared) {
    return `- **Samples per tool:** ${declared} requested · ${declared} recorded for every row (see the **Samples** column)`;
  }
  return `- **Samples per tool:** ${declared} requested · **${min}–${max} actually recorded** — per-row counts in the **Samples** column (⚠ = fewer than requested)`;
}

export function renderMemoryMarkdown(data) {
  const declared = Number(data?.settings?.samples);
  const lines = [];
  lines.push("# Resource probe results (memory + allocations + CPU)");
  lines.push("");
  lines.push(
    "Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.",
  );
  lines.push("");
  lines.push(`- **Generated:** ${data.generatedAt}`);
  lines.push(`- **Fixture:** \`${data.fixture}\``);
  lines.push(samplesHeadline(data));
  lines.push(
    `- **File limit:** ${data.settings.fileLimit} (typecheck ${data.settings.checkFileLimit}, meta ${data.settings.metaFileLimit})`,
  );
  lines.push("");
  lines.push(
    "One table per surface. Each metric is one `min / max / avg` cell; status is a marker on the name (❌ error · ⏭ skipped) and per-row detail is under **Notes** below each table. `n/a` = not measurable on this platform; `–` = the row never ran.",
  );
  lines.push("");
  lines.push("### Metrics");
  lines.push("");
  lines.push("| Column | Meaning |");
  lines.push("| --- | --- |");
  lines.push(
    "| **RSS min/max/avg** | Resident set: CLI = child WorkingSet/RSS; in-process = delta vs GC baseline |",
  );
  lines.push(
    "| **Alloc min/max/avg** | In-process: V8 `heapUsed` delta; CLI (Windows): private bytes (`PrivateMemorySize64`) |",
  );
  lines.push(
    "| **CPU total / %** | Process CPU time (user+system) and % of wall time on one core (`cpu/wall×100`) |",
  );
  lines.push(
    "| **Samples** | Samples that actually produced data for that row; ⚠ = fewer than requested |",
  );
  lines.push("");

  const bySurface = new Map();
  for (const row of data.results) {
    if (!bySurface.has(row.surface)) bySurface.set(row.surface, []);
    bySurface.get(row.surface).push(row);
  }

  for (const [surface, rows] of bySurface) {
    lines.push(`### ${surface}`);
    lines.push("");
    lines.push("| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |");
    lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
    const sorted = [...rows].sort((a, b) => {
      if (a.status !== "ok") return 1;
      if (b.status !== "ok") return -1;
      return (a.avgMb ?? Infinity) - (b.avgMb ?? Infinity);
    });
    for (const r of sorted) {
      const name = displayName(r);
      if (r.status === "ok") {
        lines.push(
          `| ${name} | ${triple(r.minMb, r.maxMb, r.avgMb)} | ${triple(r.allocMinMb, r.allocMaxMb, r.allocAvgMb)} | ${fmt(r.cpuTotalMs)} | ${fmt(r.cpuPercent, 1)} | ${fmt(r.wallMs)} | ${samplesCell(r, declared)} |`,
        );
      } else {
        lines.push(`| ${name} | – | – | – | – | – | – |`);
      }
    }
    lines.push("");
    const notes = renderNotes(sorted);
    if (notes.length) {
      lines.push(...notes);
      lines.push("");
    }
  }

  lines.push("### Versions");
  lines.push("");
  for (const [k, v] of Object.entries(data.versions || {})) {
    lines.push(`- ${k}: ${v}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}
