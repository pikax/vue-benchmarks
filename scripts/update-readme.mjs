#!/usr/bin/env node
/**
 * Merge CI benchmark markdown artifacts into README.md between markers.
 *
 * Expects results downloaded into ./results/** or passed via --dir.
 *
 * TWO independent sections, each with its own marker pair and its own artifact
 * prefix:
 *
 *   bench-*.md  ->  <!-- BENCHMARK_RESULTS_START/END -->   (the `bench` job)
 *   ide-*.md    ->  <!-- IDE_RESULTS_START/END -->         (the `ide` job)
 *
 * The IDE pair exists because the `ide` job runs for up to 90 minutes and its
 * report was previously dropped on the floor: the artifact walker matched only
 * `bench-`, so `results/ide-*.md` was never read by anything.
 *
 * A SECTION WITH NO ARTIFACTS IS LEFT EXACTLY AS IT IS. It is never replaced
 * with a "no artifacts" placeholder. The publish job runs when ANY measurement
 * job succeeded, so a run where `bench` failed and `memory` passed used to wipe
 * the previously published bench tables and auto-commit the erasure. Absence of
 * an artifact means "this run has nothing to say about that section", not
 * "delete what is published".
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { IDE_RANKING_RULES, RANKING_RULES } from "./lib/report.mjs";
import {
  formatTypecheckDoc,
  formatTypecheckReadmeSummary,
} from "../tests/confirm/lib/typecheck-doc.mjs";
import {
  artifactKind,
  compactHighlightBody,
  highlightHasRanking,
  memorySnippetsFromBody,
  writeChart as writeChartFile,
} from "./lib/readme-charts.mjs";
import { collectVersions } from "./lib/versions.mjs";
import {
  formatToolTable,
  resolvePublishDates,
  tnbVersion,
  versionsFromTableRows,
} from "./lib/tool-catalog.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Where the full per-artifact reports live. COMMITTED (unlike results/), so
 * the links below survive; the publish workflows add this directory to the
 * same commit as README.md.
 */
const DETAILS_DIR = "docs/results";

/**
 * Split a report into the landing-page body README carries and nothing else.
 *
 * README is a chart + compact ranking table per highlight surface. Full tables,
 * methodology, gate notes and raw runs live under docs/results/. Charts are
 * committed next to those reports as SVG (no third-party image host).
 */
export function splitDetails(markdown) {
  let removed = 0;
  const slim = markdown.replace(/\n?<details>[\s\S]*?<\/details>\n?/g, () => {
    removed++;
    return "\n";
  });
  return { slim: slim.replace(/\n{3,}/g, "\n\n"), removed };
}

/**
 * Escape raw HTML-looking angle brackets OUTSIDE code spans and fences.
 *
 * Tool notes and quoted errors legitimately mention `<script>` blocks,
 * `<template>`, a Rust panic's `<unnamed>` thread, component tags — and where
 * an author forgot the backticks, the rendered page inherits a raw unclosed
 * tag. One unclosed `<script>`/`<template>` makes an HTML-aware markdown
 * renderer (VS Code preview, GitHub) swallow the entire rest of the document:
 * the published README showed NO tables at all. Escaping happens here, at
 * publish time, so artifacts already produced are cured too; `allow` keeps
 * intentional markup (the full reports' own `<details>`), and HTML comments
 * are untouched (the regex requires a letter after `<`).
 */
export function escapeLooseHtml(markdown, allow = []) {
  const allowed = new Set(allow.map((t) => t.toLowerCase()));
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line
        .split(/(`+[^`]*`+)/g)
        .map((seg, i) => {
          if (i % 2 === 1) return seg; // inside an inline code span
          return seg.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/g, (m, slash, name) =>
            allowed.has(name.toLowerCase()) ? m : `&lt;${slash}${name}`,
          );
        })
        .join("");
    })
    .join("\n");
}

/** Write the FULL artifact to docs/results and return the README-relative href. */
function writeDetailFile(leaf, heading, content) {
  const dir = join(rootDir, DETAILS_DIR);
  mkdirSync(dir, { recursive: true });
  const body = [
    `# ${heading}`,
    "",
    `> Full report for \`${leaf}\` — every table, collapsed block (methodology, gate notes, raw runs) that the`,
    `> [README](../../README.md) landing page charts link here for. Auto-generated; do not edit.`,
    "",
    content,
    "",
  ].join("\n");
  writeFileSync(join(dir, leaf), body);
  return `${DETAILS_DIR}/${leaf}`;
}

/**
 * Hoist lines repeated across a section's artifacts into one statement.
 *
 * After the details split, the README's largest prose class was IDENTICAL
 * sentences stated once per project — grouping notes ("Grouped by bundler…"),
 * standing disclaimers ("A project shipping no lockfile…"), tool legends —
 * nine copies each. A line appearing in at least half the section's artifacts
 * moves to a single "Standing notes" list in the section preamble, in
 * first-appearance order. Presentation-only: every full report under
 * docs/results keeps its own copy, so nothing is lost to a reader of one
 * project's page.
 */
export function hoistRepeatedLines(contents) {
  if (contents.length < 2) return { contents, hoisted: [] };
  const counts = new Map();
  const order = [];
  for (const content of contents) {
    const seen = new Set();
    for (const raw of content.split("\n")) {
      const line = raw.trim();
      if (line.length < 60) continue;
      if (line.startsWith("|") || line.startsWith("#") || line.startsWith("<")) continue;
      if (seen.has(line)) continue;
      seen.add(line);
      const n = (counts.get(line) ?? 0) + 1;
      counts.set(line, n);
      if (n === 1) order.push(line);
    }
  }
  const threshold = Math.max(2, Math.ceil(contents.length / 2));
  // A line with a SIBLING — another line identical once every `code span` is
  // masked — is one variant of a parameterized label ("Target: `vdom` · …"
  // next to "Target: `vapor` · …"), not a standing note: hoisting it would
  // strip a group label from above its table and present one variant as
  // global truth. Families stay in place. Fails safe: a false family match
  // merely leaves a real note repeated per block.
  const familyKey = (line) => line.replace(/`[^`]*`/g, "`·`");
  const familyOwners = new Map();
  for (const line of counts.keys()) {
    const key = familyKey(line);
    familyOwners.set(key, familyOwners.has(key) ? null : line);
  }
  const hoisted = order.filter(
    (line) => (counts.get(line) ?? 0) >= threshold && familyOwners.get(familyKey(line)) === line,
  );
  if (hoisted.length === 0) return { contents, hoisted };
  const drop = new Set(hoisted);
  const stripped = contents.map((content) =>
    content
      .split("\n")
      .filter((raw) => !drop.has(raw.trim()))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n"),
  );
  return { contents: stripped, hoisted };
}

/**
 * Strip the per-report environment header from a SUMMARY block.
 *
 * Every artifact opens with the run-meta list (Generated / Fixture / Runs /
 * Runner / Node) and a full Tool-versions table — identical across a run and
 * repeated once per block, which on nine projects was ~20 KB of the same
 * table. The maintainer's design: environment is a POINTER — the full report
 * each block links (which keeps both verbatim) is where that lives.
 */
export function stripReportMeta(markdown) {
  const stripped = markdown
    .replace(/## Benchmark Results\n+(?:- \*\*[^\n]+\n)+/g, "")
    .replace(/### Tool versions\n+(?:\|[^\n]*\n)+/g, "");
  return dropOrphanHeadings(stripped);
}

/**
 * Drop headings whose entire content moved out (to details or the meta strip):
 * a heading immediately followed by a heading of the SAME OR HIGHER level owns
 * nothing. A heading followed by a LOWER-level heading is real structure — a
 * section opening its subsections — and stays. Looped to a fixed point so a
 * chain of emptied headings collapses fully.
 */
function dropOrphanHeadings(markdown) {
  let lines = markdown.split("\n");
  for (;;) {
    const kept = [];
    let dropped = false;
    for (let i = 0; i < lines.length; i++) {
      const m = /^(#{2,6}) /.exec(lines[i]);
      if (m) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === "") j++;
        const next = j < lines.length ? /^(#{2,6}) /.exec(lines[j]) : null;
        const atEnd = j >= lines.length;
        if (atEnd || (next && next[1].length <= m[1].length)) {
          dropped = true;
          continue;
        }
      }
      kept.push(lines[i]);
    }
    lines = kept;
    if (!dropped) break;
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

/**
 * Pull the per-surface "Tools:" legends out of a summary body.
 *
 * Every surface repeats a legend naming what actually ran — the same tool,
 * the same sentence, once per surface per project (~55 copies across the
 * README). Tool names are unique, so the legend lives ONCE per section in its
 * how-to-read file and the tables reference tools by name. The full reports
 * keep their own legends verbatim.
 */
export function extractToolLegends(markdown) {
  const lines = markdown.split("\n");
  const kept = [];
  const tools = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "Tools:") {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      let k = j;
      while (k < lines.length && lines[k].startsWith("- ")) {
        tools.push(lines[k]);
        k++;
      }
      if (k > j) {
        i = k - 1;
        if (lines[i + 1] === "") i++;
        continue;
      }
    }
    kept.push(lines[i]);
  }
  return { body: kept.join("\n").replace(/\n{3,}/g, "\n\n"), tools };
}

/**
 * The section's how-to-read companion: ranking rules + hoisted standing notes
 * + the deduplicated tools legend, written to ONE file under docs/results and
 * linked from the section preamble. Inline, this was a 20-30 bullet wall (plus
 * a tools legend per surface per project) between the reader and the first
 * table; the maintainer's call is that README carries tables and pointers,
 * nothing else. Returns the chunk lines for the preamble (just the link), or
 * nothing when the section has no rules, no legends and nothing hoisted.
 */
function sectionNotes(notes, hoisted, tools = []) {
  const bullets = hoisted.map((line) => (line.startsWith("-") ? line : `- ${line}`));
  const parts = [...(notes?.rules ?? []).flatMap((rule) => [rule, ""])];
  if (bullets.length > 0) {
    parts.push(
      "**Standing notes** — these apply to every block in the section (each full report carries its own copy):",
      "",
      ...bullets,
      "",
    );
  }
  if (tools.length > 0) {
    parts.push(
      "## Tools",
      "",
      "What actually ran, by the name the tables use. Bullets are kept verbatim from the surface legends, so a name can appear once per distinct description (e.g. a CLI and an in-process variant).",
      "",
      ...tools,
      "",
    );
  }
  if (parts.length === 0) return [];
  if (!notes) {
    // No companion file configured: keep everything inline rather than drop it.
    return parts;
  }
  const dir = join(rootDir, DETAILS_DIR);
  mkdirSync(dir, { recursive: true });
  const body = [
    `# ${notes.title}`,
    "",
    "> How to read every table in this README section — the ranking rules, the standing notes and",
    "> the tools legend shared by all of its blocks. Auto-generated; do not edit.",
    "> Where a note mentions collapsible **Notes** or a per-surface **Tools** legend, those live in",
    "> each block's linked full report — the README summary carries the tables only.",
    "",
    ...parts,
  ].join("\n");
  writeFileSync(join(dir, notes.leaf), escapeLooseHtml(body));
  return [
    `<!-- notes: ${notes.leaf} -->`,
    "",
    `> 📖 **[How to read these tables →](${DETAILS_DIR}/${notes.leaf})** — ranking rules, standing notes and the tools legend shared by every block in this section.`,
    "",
  ];
}

/**
 * Replace a table in which EVERY row is ❌ error / ⏭ skipped with a short
 * explanation of why, taken from the table's own Notes bullets.
 *
 * A grid of "skipped – – – –" rows says only that nothing happened; the READER
 * has to open the full report to learn there was a reason, and 76 such tables
 * stood between the reader and the measured ones. The heading stays (the group
 * existed and its absence is disclosed — fairness requires that), the reason is
 * quoted from the per-row notes (uniform reason → one sentence; differing
 * reasons → one line per row), and the full report keeps the table verbatim.
 * A table with even one measured row — including ⚠ measured-but-unranked — is
 * left entirely alone.
 */
export function collapseAllFailedTables(markdown, href) {
  const lines = markdown.split("\n");
  const out = [];
  let removed = 0;

  const reasonsFor = (start, names) => {
    let k = start;
    while (k < lines.length && lines[k].trim() === "") k++;
    if (!lines[k]?.startsWith("<details><summary>Notes")) return new Map();
    const reasons = new Map();
    for (; k < lines.length && !lines[k].includes("</details>"); k++) {
      for (const name of names) {
        const prefix = `- **${name}**:`;
        if (lines[k].startsWith(prefix)) reasons.set(name, lines[k].slice(prefix.length).trim());
      }
    }
    return reasons;
  };

  const firstSentence = (reason) => {
    const cleaned = reason
      .replace(/^[⏭❌]\s*/u, "")
      .replace(/^NOT MEASURED\s+—\s+/, "")
      .replace(/\s+/g, " ")
      .trim();
    const sentence = cleaned.split(/(?<=\.)\s+(?=[A-Z])/)[0] ?? cleaned;
    return sentence.length > 220 ? `${sentence.slice(0, 219)}…` : sentence;
  };

  for (let i = 0; i < lines.length; i++) {
    if (!(/^\|/.test(lines[i]) && /^\|[\s:|-]+\|$/.test(lines[i + 1] ?? ""))) {
      out.push(lines[i]);
      continue;
    }
    let j = i + 2;
    const names = [];
    while (j < lines.length && /^\|/.test(lines[j])) {
      names.push(lines[j].split("|")[1]?.trim() ?? "");
      j++;
    }
    if (names.length === 0 || !names.every((n) => /❌|⏭/u.test(n))) {
      out.push(...lines.slice(i, j));
      i = j - 1;
      continue;
    }
    let heading = "";
    for (let h = i - 1; h >= 0; h--) {
      const m = /^(#{1,6}) (.+)$/.exec(lines[h]);
      if (m) {
        heading = m[2];
        break;
      }
    }
    // Project typecheck/test stay as tables on the README landing view.
    if (/project (typecheck|test)/i.test(heading)) {
      out.push(...lines.slice(i, j));
      i = j - 1;
      continue;
    }
    removed++;
    const statuses = new Set(names.map((n) => (/❌/u.test(n) ? "failed" : "skipped")));
    const one = names.length === 1;
    const verb =
      statuses.size > 1
        ? "produced no measurement (❌ error / ⏭ skipped)"
        : statuses.has("failed")
          ? "failed"
          : one
            ? "was skipped"
            : "were skipped";
    const marker = statuses.has("failed") ? "❌" : "⏭";
    const reasons = reasonsFor(j, names);
    const sentences = names.map((n) => (reasons.has(n) ? firstSentence(reasons.get(n)) : null));
    const uniform = sentences[0] && sentences.every((s) => s === sentences[0]);
    const cells = one ? "The only cell" : `All ${names.length} cells`;
    if (uniform) {
      out.push(`> ${marker} **${cells} in this group ${verb} — no measurements.** ${sentences[0]} Per-row wording: [full report](${href}).`);
    } else {
      out.push(`> ${marker} **${cells} in this group ${verb} — no measurements.** ([full report](${href}))`);
      names.forEach((n, idx) => {
        out.push(`> - **${n}**: ${sentences[idx] ?? "reason not stated in the summary — see the full report."}`);
      });
    }
    i = j - 1;
  }
  return { collapsed: out.join("\n"), removed };
}

/** The line stated under every merged engine table; identical everywhere, so the hoister states it once per section. */
export const ENGINE_MERGE_NOTE =
  "ⓘ One table for both TypeScript engines — rows tagged **(JS)** run the JavaScript compiler, the rest native tsgo; a cross-engine ratio measures TypeScript's Go rewrite as much as the Vue layer on top of it.";

/** Parse the table that follows `headingIdx`, or null when there is none. */
function readTableAfter(lines, headingIdx) {
  let i = headingIdx + 1;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (!(/^\|/.test(lines[i] ?? "") && /^\|[\s:|-]+\|$/.test(lines[i + 1] ?? ""))) return null;
  const header = lines[i];
  const sep = lines[i + 1];
  let j = i + 2;
  const rows = [];
  while (j < lines.length && /^\|/.test(lines[j])) {
    rows.push(lines[j]);
    j++;
  }
  return { header, sep, rows, start: i, end: j };
}

/** Median cell → milliseconds, or null for error/skipped/bracketed rows. */
function parseMedianMs(row) {
  const m = /\*\*([\d.,]+)\s*(ms|s|min)\*\*/.exec(row.split("|")[2] ?? "");
  if (!m) return null;
  const v = parseFloat(m[1].replace(/,/g, ""));
  return m[2] === "s" ? v * 1000 : m[2] === "min" ? v * 60000 : v;
}

/**
 * Merge each "JavaScript TypeScript engine — ranked alone" table with its
 * "native tsgo engines — ranked together" partner into ONE table.
 *
 * The maintainer's call, overriding the earlier per-engine split: the JS and
 * native rows always share a table, tagged **(JS)** vs untagged, with the
 * cross-engine caveat stated alongside (ENGINE_MERGE_NOTE) instead of a table
 * boundary. "vs fastest" is recomputed against the merged fastest and rows are
 * re-sorted by median; rows without a parseable median (❌/⏭/⚠-bracketed) keep
 * their relative order below the measured ones. A pair whose column counts
 * differ is left unmerged — misaligned cells would be worse than a split.
 * README-summary only; the full reports keep the split tables verbatim.
 */
export function mergeEngineTables(markdown) {
  const JS_RE = /^(#+) (?:(.+) — )?JavaScript TypeScript engine(?: —|,) ranked alone$/u;
  const lines = markdown.split("\n");
  const out = [];
  let merged = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = JS_RE.exec(lines[i]);
    if (!m) {
      out.push(lines[i]);
      continue;
    }
    const [, hashes, prefix] = m;
    const partner = prefix
      ? `${hashes} ${prefix} — native tsgo engines, ranked together`
      : `${hashes} Native tsgo engines — ranked together`;
    let p = -1;
    for (let k = i + 1; k < lines.length; k++) {
      if (lines[k] === partner) {
        p = k;
        break;
      }
      if (new RegExp(`^#{1,${hashes.length}} `).test(lines[k])) break;
    }
    const t1 = p >= 0 ? readTableAfter(lines, i) : null;
    const t2 = p >= 0 ? readTableAfter(lines, p) : null;
    if (!t1 || !t2 || t1.header.split("|").length !== t2.header.split("|").length) {
      out.push(lines[i]);
      continue;
    }
    merged++;
    const tables = [t1, t2];
    // Trailing segments between tables (each table's Notes / Raw runs) are
    // kept, in order, after the merged table.
    const trailing = [lines.slice(t1.end, p)];
    // Absorb DEEPER "— ranked alone" class tables that follow within the same
    // surface (project-typecheck renders a third class holding verter-tsc and
    // Vize below the engine pair). A same-or-higher heading — the next
    // surface, the next operation pair — ends the surface and the absorption;
    // so does a column-count mismatch.
    let cursor = t2.end;
    for (;;) {
      let k = cursor;
      const seg = [];
      while (k < lines.length && !/^#+ /.test(lines[k])) {
        seg.push(lines[k]);
        k++;
      }
      const hm = k < lines.length ? /^(#+) .+ — ranked alone$/.exec(lines[k]) : null;
      const t3 = hm && hm[1].length > hashes.length ? readTableAfter(lines, k) : null;
      if (!t3 || t3.header.split("|").length !== t1.header.split("|").length) {
        // Lookahead only — the main loop resumes at `cursor` and re-emits
        // these lines itself.
        break;
      }
      tables.push(t3);
      trailing.push(seg);
      cursor = t3.end;
    }
    const rows = tables.flatMap((t) => t.rows).map((r, order) => ({ r, order, v: parseMedianMs(r) }));
    rows.sort((a, b) => (a.v ?? Infinity) - (b.v ?? Infinity) || a.order - b.order);
    const lead = tables.find((t) => t.rows.some((r) => parseMedianMs(r) !== null)) ?? t1;
    const vsIdx = lead.header.split("|").findIndex((c) => c.trim().toLowerCase() === "vs fastest");
    const fastest = rows.find((x) => x.v !== null)?.v;
    const rendered = rows.map(({ r, v }) => {
      if (v === null || vsIdx < 0 || !fastest) return r;
      const cells = r.split("|");
      cells[vsIdx] = ` ${(v / fastest).toFixed(2)}x `;
      return cells.join("|");
    });
    if (prefix) out.push(`${hashes} ${prefix}`, "");
    out.push(lead.header, lead.sep, ...rendered, "", ENGINE_MERGE_NOTE, "");
    for (const seg of trailing) out.push(...seg);
    i = cursor - 1;
  }
  if (merged === 0) return markdown;
  // The engine-grouping prose described the split; merged tables state
  // ENGINE_MERGE_NOTE instead.
  return out
    .filter((line) => !line.includes("Grouped by **TypeScript engine**"))
    .map((line) => line.replace(" and, within an operation, **per TypeScript engine**", ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Condense a "Did not run — excluded from every table below" quote block to
 * its header and one line per excluded tool.
 *
 * The block is the fairness-mandated disclosure that a tool produced no
 * measurement at all — it must stay above the tables. But its rationale
 * paragraph and each tool's "why this aborts the host" explanation are the
 * same harness boilerplate in every affected project block; the summary keeps
 * the per-project fact (which tool, crashing on which file), links the rest.
 * CI runner path prefixes are stripped — they say nothing the corpus-relative
 * path doesn't. Full reports keep the complete block.
 */
export function condenseExclusionBlocks(markdown, href) {
  const HEADER = "> **Did not run — excluded from every table below.**";
  const lines = markdown.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== HEADER) {
      out.push(lines[i]);
      continue;
    }
    let j = i;
    const bullets = [];
    while (j < lines.length && /^>/.test(lines[j])) {
      if (/^> - /.test(lines[j])) bullets.push(lines[j]);
      j++;
    }
    out.push(HEADER);
    for (const bullet of bullets) {
      let line = bullet
        .replace(/\/home\/runner\/work\/[\w.-]+\/[\w.-]+\//g, "")
        .replace(/[:\s]+$/, ".");
      if (line.length > 320) line = `${line.slice(0, 319)}…`;
      out.push(">", line);
    }
    out.push(">", `> _Why an aborted tool is excluded rather than bracketed, and the full per-tool detail: [full report](${href})._`);
    i = j - 1;
  }
  return out.join("\n");
}

/** Slim body + companion file + the link line that replaces the collapsed blocks. */
export function slimAndLink(leaf, heading, content) {
  // The full report keeps its own <details>/<summary>; everything else that
  // looks like HTML is escaped in both outputs — see escapeLooseHtml.
  const href = writeDetailFile(leaf, heading, escapeLooseHtml(content, ["details", "summary", "br"]));
  // README-summary transforms, in order. All three leave the full report
  // untouched. Merging runs FIRST so a per-engine table that failed alone
  // joins its measured partner instead of collapsing to a dead-table note;
  // collapsing runs before splitDetails because the reasons it quotes live in
  // the Notes details it scans.
  let readmeView = mergeEngineTables(content);
  readmeView = condenseExclusionBlocks(readmeView, href);
  readmeView = collapseAllFailedTables(readmeView, href).collapsed;
  const { slim: rawSlim, removed } = splitDetails(readmeView);
  const slim = escapeLooseHtml(rawSlim);
  const link =
    removed > 0
      ? `> 📄 **[Full details →](${href})** — methodology, per-row notes and raw runs (${removed} collapsed block(s) moved out of this page).`
      : `> 📄 **[Full report →](${href})**`;
  return { slim, link, href };
}

/** Walk `dir` for `*.md` artifacts whose file name starts with `prefix`. */
function walk(dir, prefix, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (entry === "ci-tmp" || entry === "node_modules") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, prefix, acc);
    else if (entry.endsWith(".md") && entry.startsWith(prefix)) acc.push(full);
  }
  return acc;
}

/** Prefer the committed snapshot folders so root leftovers are not published twice. */
function walkPublished(root, prefix) {
  const snap = prefix.startsWith("real-world")
    ? join(root, "real_world")
    : join(root, "benchmarks");
  if (existsSync(snap)) return walk(snap, prefix);
  return walk(root, prefix);
}

function osTitle(platform) {
  if (platform.includes("linux") || platform.includes("ubuntu")) return "Ubuntu";
  if (platform.includes("darwin") || platform.includes("macos")) return "macOS";
  if (platform.includes("win")) return "Windows";
  return platform;
}

/**
 * Case-insensitive: local runs name files from `process.platform` ("linux"),
 * CI names them from `runner.os` ("Linux"). Matching only the lowercase
 * spelling made every CI artifact fall through to the fallback, which published
 * the raw file path as the platform heading.
 */
function platformOf(path) {
  const lower = path.replace(/\\/g, "/").toLowerCase();
  if (lower.includes("win32") || lower.includes("windows")) return "Windows";
  if (lower.includes("darwin") || lower.includes("macos")) return "macOS";
  if (lower.includes("linux") || lower.includes("ubuntu")) return "Ubuntu/Linux";
  return osTitle(path);
}

function leafOf(path) {
  const base = path.replace(/\\/g, "/");
  return base.split("/").pop() || base;
}

/**
 * README states, twice, that published numbers are Linux only and that local
 * runs on other platforms are for comparison on your own box — never against
 * published figures. This is what enforces it.
 *
 * Without the check, `pnpm update-readme` on a developer machine spliced
 * `#### Windows · bench` straight into that README. The tables were labelled,
 * so it was not silent, but the document then contradicted its own stated
 * policy — and the numbers most likely to be published by accident are exactly
 * the ones taken on a machine nobody else can reproduce.
 *
 * Off by default, because the guard exists to stop an accident, not to stop
 * someone who means it: PUBLISH_ANY_PLATFORM=1 allows the splice and says so.
 */
function publishablePlatforms(env = process.env) {
  return env.PUBLISH_ANY_PLATFORM === "1" ? null : ["Ubuntu/Linux"];
}

/**
 * @returns {{ publish: string[], rejected: Array<{file: string, platform: string}> }}
 */
export function filterPublishable(files, allowed = publishablePlatforms()) {
  if (!allowed) return { publish: files, rejected: [] };
  const publish = [];
  const rejected = [];
  for (const file of files) {
    const platform = platformOf(file);
    if (allowed.includes(platform)) publish.push(file);
    else rejected.push({ file: leafOf(file), platform });
  }
  return { publish, rejected };
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Stable order: ranking tables first, cache demos last.
 *
 * There is no cold/warm ordering any more. The cold/warm-os/warm phase model
 * was abolished — every measured run is warmed and ranked on the median — and
 * no producer has emitted a `-cold` / `-warm-os` / `-warm` artifact since.
 * `benchmark.yml` writes exactly two shapes: `bench-<os>-<n>-bench.md` and
 * `bench-<os>-<n>-repeated-cache-demo.md`.
 */
function phaseRank(p) {
  if (p.includes("repeated") || p.includes("cache-demo")) return 9;
  return 5;
}

/**
 * Drop a document's own copy of the given paragraphs, and the blank line each
 * one left behind. The section states them once, above every document it
 * splices — a rule that reads identically over four reports is a rule stated
 * four times.
 */
export function stripParagraphs(markdown, paragraphs) {
  const drop = new Set(paragraphs);
  const kept = [];
  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (drop.has(lines[i].trim())) {
      if (lines[i + 1] === "") i++;
      continue;
    }
    kept.push(lines[i]);
  }
  return kept.join("\n");
}

function renderBench(files, { start, end }) {
  const chunks = [
    start,
    "",
    `> Auto-updated ${today()} from the **Benchmark** workflow (rolldown-style: measure on CI → commit README on \`main\` with \`[skip ci]\`).`,
    `> Numbers are reference-only; re-run on your hardware for local relevance.`,
    `> Every measured run is warmed (>= 1 discarded pass); the ranking metric is the median. There is no cold column.`,
    "",
  ];

  const sorted = [...files].sort((a, b) => {
    const ra = phaseRank(a);
    const rb = phaseRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  chunks.push(
    ...renderArtifactBlocks(
      sorted,
      (file, leaf) => {
        const phase =
          leaf.includes("repeated") || leaf.includes("cache-demo")
            ? "cache-demo (not ranking)"
            : "bench";
        return `${platformOf(file)} · ${phase}`;
      },
      undefined,
      { leaf: "notes-benchmark.md", title: "Reference results — how to read", rules: [] },
      { sectionId: "benchmark" },
    ),
  );
  chunks.push(end);
  return chunks.join("\n");
}

/**
 * Promote every heading one level (### → ##), fence-aware. The artifacts head
 * their surfaces at ###; a section that makes each artifact a top-level
 * heading promotes the surfaces to sit directly under it.
 */
function promoteHeadings(markdown) {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      if (inFence) return line;
      const m = /^(#{3,6}) /.exec(line);
      return m ? line.slice(1) : line;
    })
    .join("\n");
}

/**
 * Shared per-artifact pipeline: full report to docs/results, details split
 * out, repeats hoisted into the section's how-to-read file (see sectionNotes),
 * blocks emitted in order.
 *
 * `blockHeading` is the marker for the per-artifact heading; `promoteBody`
 * lifts the body's headings one level to sit under it. The real-world section
 * uses `# <project>` + promoted `## <surface>` — the maintainer's design: the
 * UI library owns the block, the test type nests inside it. The default keeps
 * the artifact's own levels (surfaces at ###) under a #### block heading.
 */
function renderArtifactBlocks(files, makeHeading, preprocess = (c) => c, notes = null, opts = {}) {
  const { blockHeading = "#### ", promoteBody = false, sectionId = "" } = opts;
  const chartsDir = join(rootDir, DETAILS_DIR, "charts");
  const prepared = files.map((file) => {
    const content = preprocess(readFileSync(file, "utf8").trim());
    const leaf = leafOf(file);
    const heading = makeHeading(file, leaf);
    // The FULL content (environment header included) goes to docs/results;
    // the summary keeps neither the meta list, the versions table, nor the
    // per-surface tools legends (deduplicated into the section notes file).
    const { slim, link } = slimAndLink(leaf, heading, content);
    const { body, tools } = extractToolLegends(stripReportMeta(slim));
    return { leaf, heading, slim: body, link, tools, full: content };
  });
  const seenTools = new Set();
  const allTools = [];
  for (const p of prepared) {
    for (const line of p.tools) {
      if (seenTools.has(line)) continue;
      seenTools.add(line);
      allTools.push(line);
    }
  }
  const { contents, hoisted } = hoistRepeatedLines(prepared.map((p) => p.slim));
  const topLinks = [];
  const bodyChunks = [];
  for (let i = 0; i < prepared.length; i++) {
    const p = prepared[i];
    // Orphans are cleaned AFTER hoisting — that is where they appear: a
    // heading like "Methodology notes" whose bullets all moved to the
    // standing-notes list owns nothing. Surface headings with zero-row
    // explanations survive, because those cite the project by name and never
    // clear the hoist threshold.
    let body = dropOrphanHeadings(contents[i]);
    if (promoteBody) body = promoteHeadings(body);
    const href = `${DETAILS_DIR}/${p.leaf}`;
    const kind = artifactKind(sectionId, p.leaf);
    body = compactHighlightBody(body, {
      kind,
      leaf: p.leaf,
      href,
      chartsHref: `${DETAILS_DIR}/charts`,
      writeChart: (file, svg) => writeChartFile(chartsDir, file, svg),
      notesSource: p.full,
      toolTable: (id) => formatToolTable(id, toolVersions, toolDates),
      memorySnippets: sectionId === "benchmark" ? memorySnippets : undefined,
    });
    if (sectionId === "benchmark" && Object.keys(memorySnippets).length) memoryEmbedded = true;
    if (kind === "real-world" && !highlightHasRanking(body)) continue;
    if (kind === "cache-demo" || kind === "ide-scale") {
      const label = kind === "cache-demo" ? "Cache-demo (not ranking)" : "IDE scale";
      topLinks.push(`> ${label}: [full report](${href}).`);
      continue;
    }
    // Full-details sits under the section/project title, not after the tables.
    if (sectionId === "real-world") {
      bodyChunks.push(`${blockHeading}${p.heading}`, "", `<!-- source: ${p.leaf} -->`, "", p.link, "", body, "");
    } else {
      topLinks.push(p.link);
      bodyChunks.push(`${blockHeading}${p.heading}`, "", `<!-- source: ${p.leaf} -->`, "", body, "");
    }
  }
  return [...topLinks, "", ...sectionNotes(notes, hoisted, allTools), ...bodyChunks];
}

function renderIde(files, { start, end }) {
  const chunks = [
    start,
    "",
    `> Auto-updated ${today()} from the **Benchmark** workflow (\`ide\` job — per-operation editor benchmarks).`,
    `> Ranked **per operation**, never pooled: \`didOpen→diagnostics\` and \`foldingRange\` answer unrelated questions.`,
    `> Same-VM rule holds within the job; these numbers are not comparable to the timing tables above.`,
    `> **⚠ unranked** is a noise or work gate, not “the official tool is unofficial”. A series with CV > 50% is too noisy to rank.`,
    `> Each stacked bar is **warm** (solid, cached request) then **cold** (pale remainder = first-request extra). Ranking uses **Cold**; vs-fastest-cold sits next to it.`,
    "",
  ];

  chunks.push(
    ...renderArtifactBlocks(
      [...files].sort(),
      (file) => `${platformOf(file)} · ide ops`,
      // Each IDE artifact states the ranking rules itself so it reads
      // standalone; the section states them once, in its how-to-read file.
      (content) => stripParagraphs(content, [RANKING_RULES, IDE_RANKING_RULES]),
      {
        leaf: "notes-ide.md",
        title: "IDE operation results — how to read",
        rules: [RANKING_RULES, IDE_RANKING_RULES],
      },
      { sectionId: "ide" },
    ),
  );
  chunks.push(end);
  return chunks.join("\n");
}

/**
 * Real-world section: one artifact per PROJECT, spliced in project order.
 *
 * The header carries the one warning that cannot live in a per-project artifact,
 * because it is about the relationship BETWEEN them: these tables are ranked
 * within a corpus and never across. Element Plus's 162 library components and
 * Naive UI's 1708 demo SFCs are different code doing different work, so a
 * files/second comparison between those two tables measures the corpora.
 */
function renderRealWorld(files, { start, end }) {
  const chunks = [
    start,
    "",
    `> Auto-updated ${today()} from the **Benchmark (real-world)** workflow — one job per project, every surface and every tool inside it.`,
    "> Corpora are pinned checkouts of third-party open-source Vue projects. Sources are unmodified; every table names its ref and resolved commit SHA.",
    "> **Rank within a corpus, never across it.** The corpora differ in size and in kind — library source, application source, and documentation demos are not the same code.",
    "> The generated `fixtures/N` corpus remains the primary ranking corpus; these tables exist to catch what a designed corpus cannot.",
    "> Landing view is the project's **own** typecheck / test / build (plugin swaps included). Harness SFC compile of extracted files stays in the full report. Unranked tools are listed under the table with the gate that dropped them.",
    "> **⚠ unranked** is a gate, not a ranking of the official toolchain. A project that ships **no lockfile** at the pinned ref (Naive UI, Ant Design Vue) cannot be installed frozen, so every typecheck / test / build / lsp row on that corpus is unranked equally — including vue-tsc.",
    "",
  ];

  chunks.push(
    ...renderArtifactBlocks(
      [...files].sort(),
      (file, leaf) =>
        // `real-world-Linux-hoppscotch.md` → `hoppscotch`. The platform is not
        // repeated per block: the publish guard already admits Linux artifacts
        // only, and each full report names its runner.
        leaf
          .replace(/^real-world-/, "")
          .replace(/\.md$/, "")
          .replace(/^(Linux|Windows|macOS|win32|darwin|ubuntu)-/i, ""),
      (content) => stripParagraphs(content, [RANKING_RULES]),
      {
        leaf: "notes-real-world.md",
        title: "Real-world project results — how to read",
        rules: [RANKING_RULES],
      },
      // The UI library owns the block (h1); surfaces sit under it (h2), and
      // their subgroups — bundler, TypeScript engine — at h3.
      { blockHeading: "# ", promoteBody: true, sectionId: "real-world" },
    ),
  );
  chunks.push(end);
  return chunks.join("\n");
}

export const SECTIONS = [
  {
    id: "benchmark",
    prefix: "bench-",
    start: "<!-- BENCHMARK_RESULTS_START -->",
    end: "<!-- BENCHMARK_RESULTS_END -->",
    appendHeading: "## Reference results",
    render: renderBench,
  },
  {
    id: "ide",
    prefix: "ide-",
    start: "<!-- IDE_RESULTS_START -->",
    end: "<!-- IDE_RESULTS_END -->",
    appendHeading: "## IDE operation results",
    render: renderIde,
  },
  {
    id: "real-world",
    prefix: "real-world-",
    start: "<!-- REAL_WORLD_RESULTS_START -->",
    end: "<!-- REAL_WORLD_RESULTS_END -->",
    appendHeading: "## Real-world project results",
    render: renderRealWorld,
  },
];

const INDEX_START = "<!-- RESULTS_INDEX_START -->";
const INDEX_END = "<!-- RESULTS_INDEX_END -->";
const RUN_META_START = "<!-- RUN_META_START -->";
const RUN_META_END = "<!-- RUN_META_END -->";

/** Filled in `main()` from the published bench artifact + npm registry. */
let toolVersions = {};
/** Peak-RSS snippets keyed by memory surface (`compile` / `typecheck` / `lsp`). */
let memorySnippets = {};
let memorySourceLeaf = "";
let memoryCompactBody = "";
let memoryEmbedded = false;
let toolDates = {};

/** Pull Generated / Runner / versions from a bench artifact for the README. */
export function extractRunMeta(markdown) {
  const generated = /- \*\*Generated:\*\* ([^\n]+)/.exec(markdown)?.[1]?.trim() ?? "";
  const runner = /- \*\*Runner:\*\* ([^\n]+)/.exec(markdown)?.[1]?.trim() ?? "";
  const runs = /- \*\*Runs \/ warmups:\*\* ([^\n]+)/.exec(markdown)?.[1]?.trim() ?? "";
  const ci = /- \*\*CI run:\*\* ([^\n]+)/.exec(markdown)?.[1]?.trim() ?? "";
  const fixture = /- \*\*Fixture:\*\* ([^\n]+)/.exec(markdown)?.[1]?.trim() ?? "";
  const table = [];
  const start = markdown.indexOf("### Tool versions");
  if (start >= 0) {
    const chunk = markdown.slice(start);
    const rows = [...chunk.matchAll(/^\| ([^|]+) \| ([^|]+) \|\s*$/gm)];
    const seen = new Set();
    for (const [, pkg, ver] of rows) {
      const name = pkg.trim();
      const version = ver.trim();
      if (name === "Package" || name.startsWith("---")) continue;
      if (name.startsWith("cli:")) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      table.push(`| ${name} | ${version} |`);
    }
  }
  return { generated, runner, runs, ci, fixture, table };
}

export function formatRunMeta(meta) {
  if (!meta?.generated && !meta?.table?.length) return "";
  const lines = [
    RUN_META_START,
    "",
    "## This run",
    "",
  ];
  if (meta.generated) {
    const day = meta.generated.slice(0, 10);
    lines.push(`- **Date:** ${day} (\`${meta.generated}\`)`);
  }
  if (meta.runner) lines.push(`- **Runner:** ${meta.runner}`);
  if (meta.fixture) lines.push(`- **Fixture:** ${meta.fixture}`);
  if (meta.runs) lines.push(`- **Runs / warmups:** ${meta.runs}`);
  if (meta.ci) lines.push(`- **CI run:** ${meta.ci}`);
  lines.push("");
  lines.push(RUN_META_END);
  return lines.join("\n");
}

function spliceRunMeta(readme, dir) {
  const found = walkPublished(dir, "bench-");
  const { publish } = filterPublishable(found);
  const file = publish.sort((a, b) => phaseRank(a) - phaseRank(b) || a.localeCompare(b))[0];
  if (!file) {
    console.log("[run-meta] no Linux bench artifact — existing This run section LEFT UNTOUCHED");
    return readme;
  }
  const rendered = formatRunMeta(extractRunMeta(readFileSync(file, "utf8")));
  if (!rendered) return readme;
  if (readme.includes(RUN_META_START) && readme.includes(RUN_META_END)) {
    return readme.replace(new RegExp(`${RUN_META_START}[\\s\\S]*?${RUN_META_END}`), () => rendered);
  }
  const hook = "## Quick start";
  if (readme.includes(hook)) return readme.replace(hook, `${rendered}\n\n${hook}`);
  return `${readme.trimEnd()}\n\n${rendered}\n`;
}

/**
 * The index at the top of README: one line per results section, linking the
 * in-page section heading plus each artifact's full report in docs/results/.
 * Rebuilt from the README itself AFTER splicing, so it can never disagree with
 * what is actually published — including sections this run did not touch.
 */
export function buildResultsIndex(readme) {
  const rows = [];
  for (const section of SECTIONS) {
    const a = readme.indexOf(section.start);
    const b = readme.indexOf(section.end);
    if (a < 0 || b < 0) continue;
    const body = readme.slice(a, b);
    const title = section.appendHeading.replace(/^#+\s*/, "");
    const slug = title.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
    const seen = new Set();
    const entries = [...body.matchAll(/^#{1,4} ([^\n]+)\n\n<!-- source: (\S+) -->/gm)].map(
      ([, heading, leaf]) => {
        // The heading's tail is the natural label, but it can repeat (both IDE
        // artifacts head "ide ops") — a repeat falls back to the artifact name.
        let label = heading.split("·").pop().trim();
        if (seen.has(label)) label = leaf.replace(/\.md$/, "").replace(/-(Linux|Windows|macOS|ubuntu)/i, "");
        seen.add(label);
        return `[${label}](${DETAILS_DIR}/${leaf})`;
      },
    );
    const notesMatch = /<!-- notes: (\S+) -->/.exec(body);
    if (notesMatch) entries.unshift(`[how to read](${DETAILS_DIR}/${notesMatch[1]})`);
    rows.push(`- **[${title}](#${slug})**${entries.length ? ` — ${entries.join(" · ")}` : ""}`);
  }
  const typecheckRow = readme.includes("<!-- TYPECHECK_CONFIRM_START -->")
    ? "- **[Typecheck confirmation](#typecheck-confirmation)** — [full matrix](docs/typecheck.md)"
    : "";
  const memoryRow = readme.includes(MEMORY_SUMMARY_START)
    ? "- **[Memory](#memory)** — [MEMORY.md](MEMORY.md)"
    : "";
  // Reference (bench) → typecheck → IDE → real-world → memory
  const ordered = [];
  if (rows[0]) ordered.push(rows[0]);
  if (typecheckRow) ordered.push(typecheckRow);
  ordered.push(...rows.slice(1));
  if (memoryRow) ordered.push(memoryRow);
  return ordered.join("\n");
}

const TYPECHECK_CONFIRM_START = "<!-- TYPECHECK_CONFIRM_START -->";
const TYPECHECK_CONFIRM_END = "<!-- TYPECHECK_CONFIRM_END -->";

function findConfirmJson(dir) {
  const pinned = join(dir, "benchmarks", "confirm.json");
  if (existsSync(pinned)) return pinned;
  const hits = [];
  function visit(p) {
    if (!existsSync(p)) return;
    const st = statSync(p);
    if (st.isFile() && /confirm\.json$/i.test(p)) hits.push(p);
    else if (st.isDirectory()) {
      for (const name of readdirSync(p)) {
        if (name === "ci-tmp" || name === "node_modules") continue;
        visit(join(p, name));
      }
    }
  }
  visit(dir);
  return hits[0] ?? null;
}

/**
 * Publish docs/typecheck.md + the README pass/warn summary from confirm.json.
 * Absence of the artifact leaves both files untouched (same rule as bench).
 */
export function spliceTypecheckConfirm(readme, dir) {
  const jsonPath = findConfirmJson(dir);
  if (!jsonPath) {
    console.log(
      "[typecheck-confirm] no confirm.json in artifacts — existing section LEFT UNTOUCHED",
    );
    return readme;
  }
  const data = JSON.parse(readFileSync(jsonPath, "utf8"));
  const allowed = publishablePlatforms();
  const platform = String(data.runner?.platform || data.platform || "").toLowerCase();
  if (allowed && platform && !platform.includes("linux") && platform !== "ubuntu") {
    console.log(
      `[typecheck-confirm] SKIPPED ${leafOf(jsonPath)} — ${platform} artifact, and README publishes Linux only. ` +
        `Set PUBLISH_ANY_PLATFORM=1 to override.`,
    );
    return readme;
  }
  const results = data.results || [];
  const generatedAt = data.generatedAt || new Date().toISOString();
  const runner = data.runner;
  writeFileSync(
    join(rootDir, "docs", "typecheck.md"),
    formatTypecheckDoc({
      results,
      generatedAt,
      runner,
      writeChart: (file, svg) => writeChartFile(join(rootDir, DETAILS_DIR, "charts"), file, svg),
    }),
    "utf8",
  );
  const summary = formatTypecheckReadmeSummary({ results, generatedAt, runner });
  if (readme.includes(TYPECHECK_CONFIRM_START) && readme.includes(TYPECHECK_CONFIRM_END)) {
    readme = readme.replace(
      new RegExp(`${TYPECHECK_CONFIRM_START}[\\s\\S]*?${TYPECHECK_CONFIRM_END}`),
      () => summary,
    );
  } else {
    const hook = "## Quick start";
    if (readme.includes(hook)) {
      readme = readme.replace(hook, `${summary}\n\n${hook}`);
    } else {
      readme = `${readme.trimEnd()}\n\n${summary}\n`;
    }
  }
  console.log(`[typecheck-confirm] published from ${jsonPath}`);
  return readme;
}

const MEMORY_SUMMARY_START = "<!-- MEMORY_SUMMARY_START -->";
const MEMORY_SUMMARY_END = "<!-- MEMORY_SUMMARY_END -->";

function loadMemorySnippets(dir) {
  memorySnippets = {};
  memorySourceLeaf = "";
  memoryCompactBody = "";
  memoryEmbedded = false;
  const found = walkPublished(dir, "memory-").filter((f) => f.endsWith(".md") && !/test/i.test(f));
  const { publish: files, rejected } = filterPublishable(found);
  for (const { file, platform } of rejected) {
    console.log(
      `[memory] SKIPPED ${file} — ${platform} artifact, and README publishes Linux only. ` +
        `Set PUBLISH_ANY_PLATFORM=1 to override.`,
    );
  }
  if (files.length === 0) return;
  const file = files.sort()[0];
  memorySourceLeaf = leafOf(file);
  const chartsDir = join(rootDir, DETAILS_DIR, "charts");
  const body = compactHighlightBody(readFileSync(file, "utf8"), {
    kind: "memory",
    leaf: memorySourceLeaf,
    href: "MEMORY.md",
    chartsHref: `${DETAILS_DIR}/charts`,
    metric: "rss",
    writeChart: (name, svg) => writeChartFile(chartsDir, name, svg),
  });
  memoryCompactBody = body.trim();
  memorySnippets = memorySnippetsFromBody(body);
}

/**
 * Compact peak-RSS charts on the README, linking MEMORY.md for the full probe.
 * When RSS is already nested under compile / typecheck / LSP, this section is
 * a pointer. Absence of a Linux memory artifact leaves the section untouched.
 */
export function spliceMemorySummary(readme, dir) {
  if (!memorySourceLeaf) loadMemorySnippets(dir);
  if (!memorySourceLeaf) {
    console.log("[memory] no memory-*.md artifacts — existing section LEFT UNTOUCHED");
    return readme;
  }
  const leaf = memorySourceLeaf;
  const body = memoryEmbedded ? "" : memoryCompactBody;
  const rendered = [
    MEMORY_SUMMARY_START,
    "",
    `> Auto-updated ${today()} from the **Benchmark** workflow (\`memory\` job). Peak RSS; isolated from timing.`,
    memoryEmbedded
      ? `> Peak RSS for compile / typecheck / format / lint / component-meta / LSP sits next to those timing tables. Full probe (every surface, min/max/avg, CPU): [MEMORY.md](MEMORY.md) · source \`${leaf}\`.`
      : `> Full probe (every surface, min/max/avg, CPU): [MEMORY.md](MEMORY.md) · source \`${leaf}\`.`,
    "",
    ...(body ? [body, ""] : []),
    MEMORY_SUMMARY_END,
  ].join("\n");
  if (readme.includes(MEMORY_SUMMARY_START) && readme.includes(MEMORY_SUMMARY_END)) {
    return readme.replace(
      new RegExp(`${MEMORY_SUMMARY_START}[\\s\\S]*?${MEMORY_SUMMARY_END}`),
      () => rendered,
    );
  }
  const hook = "## Contributing";
  if (readme.includes(hook)) {
    return readme.replace(hook, `## Memory\n\n${rendered}\n\n${hook}`);
  }
  return `${readme.trimEnd()}\n\n## Memory\n\n${rendered}\n`;
}

export function spliceIndex(readme) {
  if (!readme.includes(INDEX_START) || !readme.includes(INDEX_END)) return readme;
  const block = [
    INDEX_START,
    "",
    `**Results index** — charts below; every entry links its FULL report (tables, methodology, per-row notes, raw runs, environment) in [\`${DETAILS_DIR}/\`](${DETAILS_DIR}/):`,
    "",
    buildResultsIndex(readme),
    "",
    INDEX_END,
  ].join("\n");
  return readme.replace(new RegExp(`${INDEX_START}[\\s\\S]*?${INDEX_END}`), () => block);
}

async function loadToolMeta(dir) {
  const found = walkPublished(dir, "bench-");
  const { publish } = filterPublishable(found);
  const file = publish.sort((a, b) => phaseRank(a) - phaseRank(b) || a.localeCompare(b))[0];
  if (file) {
    toolVersions = versionsFromTableRows(extractRunMeta(readFileSync(file, "utf8")).table);
  }
  const collected = collectVersions();
  for (const [name, version] of Object.entries(collected)) {
    if (name === "node" || name.startsWith("cli:")) continue;
    if (!toolVersions[name]) toolVersions[name] = version;
  }
  const tnb = tnbVersion();
  if (tnb) toolVersions["typescript-native-bridge"] = tnb;
  const entries = Object.entries(toolVersions).map(([name, version]) => ({ name, version }));
  toolDates = await resolvePublishDates(entries);
}

async function main() {
  const args = process.argv.slice(2);
  let dir = join(rootDir, "results");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dir") dir = args[++i];
  }
  await loadToolMeta(dir);
  loadMemorySnippets(dir);

  const readmePath = join(rootDir, "README.md");
  if (!existsSync(readmePath)) {
    console.error("README.md not found");
    process.exit(1);
  }

  let readme = readFileSync(readmePath, "utf8");
  const before = readme;

  for (const section of SECTIONS) {
    const found = walkPublished(dir, section.prefix);
    const { publish: files, rejected } = filterPublishable(found);
    const hasMarkers = readme.includes(section.start) && readme.includes(section.end);

    for (const { file, platform } of rejected) {
      console.log(
        `[${section.id}] SKIPPED ${file} — ${platform} artifact, and README publishes Linux only. ` +
          `Set PUBLISH_ANY_PLATFORM=1 to override.`,
      );
    }

    if (files.length === 0) {
      // NEVER overwrite published results with a placeholder — see file header.
      if (hasMarkers) {
        console.log(
          `[${section.id}] no ${section.prefix}*.md artifacts in ${dir} — existing section LEFT UNTOUCHED (nothing published, nothing erased)`,
        );
      } else {
        console.log(
          `[${section.id}] no ${section.prefix}*.md artifacts in ${dir} and no ${section.start} marker — nothing to do`,
        );
      }
      continue;
    }

    const rendered = section.render(files, section);
    if (hasMarkers) {
      // Replacer FUNCTION, not a string. A replacement string interprets `$&`,
      // `` $` ``, `$'` and `$1`, so a results table containing any of them would
      // splice the matched text (the whole old section) into the README. A
      // function's return value is inserted literally.
      readme = readme.replace(
        new RegExp(`${section.start}[\\s\\S]*?${section.end}`),
        () => rendered,
      );
    } else {
      readme = `${readme.trimEnd()}\n\n${section.appendHeading}\n\n${rendered}\n`;
    }
    console.log(
      `[${section.id}] published ${files.length} artifact(s): ${files.map(leafOf).join(", ")}`,
    );
  }

  readme = spliceTypecheckConfirm(readme, dir);
  readme = spliceRunMeta(readme, dir);
  readme = spliceMemorySummary(readme, dir);
  readme = spliceIndex(readme);

  if (readme === before) {
    console.log("README.md unchanged");
    return;
  }
  writeFileSync(readmePath, readme);
  console.log("Updated README.md");
}

// Importable without side effects (the migration script and the tests need the
// helpers); main runs only when this file IS the entry point.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
