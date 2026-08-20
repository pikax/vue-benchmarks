/**
 * Render docs/<group>.md, docs/real-world*, docs/memory.md and the README
 * summary blocks — all from the published JSON snapshots, all through the ONE
 * shared chart renderer (scripts/lib/chart-svg.mjs).
 */

import {
  classKey,
  classLabel,
  displayName,
  plainDisplayName,
  renderSurfaceMarkdown,
  IDE_RANKING_RULES,
  RANKING_RULES,
} from "../report.mjs";
import { formatMs } from "../timing.mjs";
import { barChartSvg, formatDuration, slugify, writeChart } from "../chart-svg.mjs";
import { linkToolLabel } from "../tool-catalog.mjs";
import { confirmForGroup, memoryPeakMb, runMetaLines } from "./data.mjs";
import { buildIdeSurfaces, buildTypingLoopSurface } from "../ide-report.mjs";

export const GENERATED_NOTE =
  "> Auto-generated from the JSON snapshots in [`results/benchmarks/`](../results/benchmarks/) and [`results/real_world/`](../results/real_world/) by `pnpm docs`. Do not edit by hand.";

/** The HTML tags generated pages intentionally emit; everything else escapes. */
export const ALLOWED_HTML_TAGS = ["details", "summary", "picture", "source", "img", "br"];

/**
 * Escape raw HTML-looking angle brackets OUTSIDE code spans and fences.
 *
 * Tool notes legitimately mention `<script>` blocks, `<template>`, component
 * tags — and where an author forgot the backticks, the rendered page inherits
 * a raw unclosed tag. One unclosed `<script>`/`<template>` makes an HTML-aware
 * markdown renderer (VS Code preview, GitHub) swallow the entire rest of the
 * document. Escaping happens at generation time on every page; `allow` keeps
 * the intentional markup (details/picture/img…), and HTML comments are
 * untouched (the regex requires a letter after `<`). Idempotent.
 */
export function escapeLooseHtml(markdown, allow = ALLOWED_HTML_TAGS) {
  const allowed = new Set(allow.map((t) => t.toLowerCase()));
  let inFence = false;
  return String(markdown)
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

/* -------------------------------------------------------------------------- */
/* Bars from JSON variants                                                    */
/* -------------------------------------------------------------------------- */

function variantRanked(v) {
  return v.status === "ok";
}

/**
 * Chart bars for a variant list. Emits fresh/warm or cold/warm range series
 * when the surface measures both, otherwise a plain median bar. Unranked rows
 * keep their bar, hatched; error/skipped rows have nothing to draw.
 */
export function barsFromVariants(variants) {
  const bars = [];
  for (const v of variants ?? []) {
    if (v.status === "error" || v.status === "skipped") continue;
    const label = plainDisplayName(v);
    const ranked = variantRanked(v);
    const first = Number.isFinite(v.freshChildMedianMs)
      ? { series: "fresh", value: v.freshChildMedianMs }
      : Number.isFinite(v.coldMedianMs)
        ? { series: "cold", value: v.coldMedianMs }
        : null;
    if (first && Number.isFinite(v.medianMs)) {
      bars.push({ label, series: first.series, value: first.value, ranked });
      bars.push({ label, series: "warm", value: v.medianMs, ranked });
    } else if (Number.isFinite(v.medianMs)) {
      bars.push({ label, value: v.medianMs, ranked });
    }
  }
  return bars;
}

/** Peak RSS bars for a variant list (used by the memory doc). */
export function rssBarsFromVariants(variants) {
  return (variants ?? [])
    .filter((v) => Number.isFinite(v.rssMaxMb) && v.rssMaxMb > 0)
    .map((v) => ({
      label: plainDisplayName(v),
      value: v.rssMaxMb,
      ranked: variantRanked(v),
    }));
}

/* -------------------------------------------------------------------------- */
/* Chart emission                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The <picture> block that embeds a light/dark chart pair. The page-level
 * `prefers-color-scheme` source is evaluated by the browser document (Safari
 * included), which is exactly what a media query inside an <img> SVG is not.
 */
export function chartPicture(chartsHref, base, title) {
  return [
    "<picture>",
    `  <source media="(prefers-color-scheme: dark)" srcset="${chartsHref}/${base}-dark.svg">`,
    `  <img alt="${title.replace(/"/g, "&quot;")}" src="${chartsHref}/${base}.svg">`,
    "</picture>",
  ].join("\n");
}

/**
 * Write one chart as a light/dark SVG pair and return the <picture> block.
 * `fileBase` is a stable deterministic name (`<group>-<slug>`), so
 * regenerating overwrites in place instead of leaking stale SVGs.
 */
export function emitChart({ title, unit = "ms", bars, chartsDir, chartsHref, fileBase, lowerIsBetter = true, maxValue }) {
  const light = barChartSvg({ title, unit, bars, lowerIsBetter, maxValue, theme: "light" });
  if (!light) return "";
  const base = slugify(fileBase);
  writeChart(chartsDir, `${base}.svg`, light);
  writeChart(
    chartsDir,
    `${base}-dark.svg`,
    barChartSvg({ title, unit, bars, lowerIsBetter, maxValue, theme: "dark" }),
  );
  return chartPicture(chartsHref, base, title);
}

/* -------------------------------------------------------------------------- */
/* Compact tables (README landing)                                            */
/* -------------------------------------------------------------------------- */

function fastestOf(variants, pick) {
  const vals = variants
    .filter((v) => v.status === "ok")
    .map(pick)
    .filter((n) => Number.isFinite(n) && n > 0);
  return vals.length ? Math.min(...vals) : Number.NaN;
}

function ratioCell(base, value, ok) {
  if (!ok) return "not ranked";
  if (!Number.isFinite(base) || !Number.isFinite(value) || value <= 0) return "–";
  return `${(value / base).toFixed(2)}x`;
}

function rssCellCompact(v) {
  if (!Number.isFinite(v.rssMaxMb) || v.rssMaxMb <= 0) return "–";
  const split =
    Number.isFinite(v.rssToolMb) && Number.isFinite(v.rssEngineMb) && v.rssEngineMb > 0;
  const cell = split
    ? `${v.rssToolMb.toFixed(1)} + ${v.rssEngineMb.toFixed(1)} = ${v.rssMaxMb.toFixed(1)} MB`
    : `${v.rssMaxMb.toFixed(1)} MB`;
  return v.status === "ok" ? cell : `(${cell})`;
}

/**
 * The landing table: measured rows only, one ratio column, and the memory
 * column — errors/skips stay on the full page the block links. Sorting and
 * the ratio are ALWAYS vs fastest; a `baseline` flag never pins a row.
 */
export function compactTable(variants, { docHref } = {}) {
  const rows = (variants ?? []).filter(
    (v) => v.status === "ok" || v.status === "unranked",
  );
  if (!rows.length) return "";
  const showFresh = rows.some((v) => Number.isFinite(v.freshChildMedianMs));
  const showCold = !showFresh && rows.some((v) => Number.isFinite(v.coldMedianMs));
  const showRss = rows.some((v) => Number.isFinite(v.rssMaxMb) && v.rssMaxMb > 0);
  const base = fastestOf(rows, (v) => v.medianMs);
  const vsHead = "vs fastest";
  const head = ["Tool"];
  if (showFresh) head.push("Fresh child", "**Warm (primary)**");
  else if (showCold) head.push("**Cold**", "Warm");
  else head.push("**Median**");
  head.push(vsHead);
  if (showRss) head.push("Peak RSS");
  const lines = [
    `| ${head.join(" | ")} |`,
    `| --- | ${head
      .slice(1)
      .map(() => "---:")
      .join(" | ")} |`,
  ];
  const sorted = [...rows].sort((a, b) => {
    const ms = (v) =>
      v.status === "ok" && Number.isFinite(v.medianMs) ? v.medianMs : Number.POSITIVE_INFINITY;
    return ms(a) - ms(b);
  });
  for (const v of sorted) {
    const ok = v.status === "ok";
    const wrap = (ms) =>
      !Number.isFinite(ms) ? "–" : ok ? `**${formatMs(ms)}**` : `(${formatMs(ms)})`;
    const plain = (ms) => (!Number.isFinite(ms) ? "–" : ok ? formatMs(ms) : `(${formatMs(ms)})`);
    const cells = [linkToolLabel(displayName(v))];
    if (showFresh) cells.push(plain(v.freshChildMedianMs), wrap(v.medianMs));
    else if (showCold) cells.push(wrap(v.coldMedianMs), plain(v.medianMs));
    else cells.push(wrap(v.medianMs));
    cells.push(ratioCell(base, v.medianMs, ok));
    if (showRss) cells.push(rssCellCompact(v));
    lines.push(`| ${cells.join(" | ")} |`);
  }
  if (docHref) {
    const hasUnranked = rows.some((v) => v.status !== "ok");
    lines.push("");
    lines.push(
      hasUnranked
        ? `> ⚠ rows failed a validation gate (time bracketed, unranked); errors, skips and per-row notes: [full results](${docHref}).`
        : `> Errors, skips and per-row notes: [full results](${docHref}).`,
    );
  }
  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/* Memory probe tables                                                        */
/* -------------------------------------------------------------------------- */

function fmtRange(min, max, avg) {
  const f = (n) => (Number.isFinite(n) ? n.toFixed(2) : "n/a");
  if (![min, max, avg].some((n) => Number.isFinite(n))) return "n/a";
  return `${f(min)} / ${f(max)} / ${f(avg)}`;
}

/** Full probe table for one memory surface (MEMORY doc style). */
export function memoryProbeTable(rows) {
  const usable = (rows ?? []).filter((r) => r.status !== "skip");
  if (!usable.length) return "";
  const lines = [
    "| Tool | RSS min / max / avg | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  const sorted = [...usable].sort(
    (a, b) => (memoryPeakMb(a) ?? Infinity) - (memoryPeakMb(b) ?? Infinity),
  );
  const notes = [];
  for (const r of sorted) {
    const rss = fmtRange(r.minMb, r.maxMb, r.avgMb);
    const alloc = fmtRange(r.allocMinMb, r.allocMaxMb, r.allocAvgMb);
    const cpu = Number.isFinite(r.cpuTotalMs) ? r.cpuTotalMs.toFixed(0) : "n/a";
    const cpuPct = Number.isFinite(r.cpuPercent) ? r.cpuPercent.toFixed(1) : "n/a";
    const wall = Number.isFinite(r.wallMs) ? r.wallMs.toFixed(0) : "n/a";
    const mark = r.status === "error" ? " ❌" : "";
    lines.push(
      `| ${r.label}${mark} | ${rss} | ${alloc} | ${cpu} | ${cpuPct} | ${wall} | ${r.samples ?? "–"} |`,
    );
    if (r.note) notes.push(`- **${r.label}** — ${r.note}`);
  }
  if (notes.length) {
    const unique = [...new Set(notes)];
    lines.push("", "<details><summary>Notes</summary>", "", ...unique, "", "</details>");
  }
  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/* Confirm (plant) tables                                                     */
/* -------------------------------------------------------------------------- */

function confirmMark(status) {
  if (status === "pass") return "✓";
  if (status === "fail") return "**✗**";
  if (status === "warn") return "⚠";
  if (status === "skip") return "○";
  return "–";
}

/**
 * Per-surface plant matrix: one row per case, one column per tool. Only for
 * the plain confirm suites; the combined typecheck run has its own landing.
 */
export function confirmMatrix(rows) {
  const plain = (rows ?? []).filter((r) => r.suite !== "typecheck-all");
  if (!plain.length) return "";
  const tools = [...new Set(plain.map((r) => r.tool))];
  const byCase = new Map();
  for (const r of plain) {
    if (!byCase.has(r.caseId)) byCase.set(r.caseId, new Map());
    byCase.get(r.caseId).set(r.tool, r);
  }
  const lines = [
    `| Case | ${tools.join(" | ")} |`,
    `| --- | ${tools.map(() => ":---:").join(" | ")} |`,
  ];
  for (const [caseId, perTool] of [...byCase.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const cells = tools.map((t) => confirmMark(perTool.get(t)?.status));
    lines.push(`| \`${caseId}\` | ${cells.join(" | ")} |`);
  }
  const fails = plain.filter((r) => r.status === "fail" && r.message);
  if (fails.length) {
    lines.push("", "<details><summary>Failure detail</summary>", "");
    for (const r of fails) {
      lines.push(`- \`${r.caseId}\` · **${r.tool}** — ${String(r.message).replace(/\r?\n/g, " ")}`);
    }
    lines.push("", "</details>");
  }
  return lines.join("\n");
}

export function confirmSummaryLine(rows) {
  const plain = rows ?? [];
  if (!plain.length) return "";
  const count = (s) => plain.filter((r) => r.status === s).length;
  return `pass **${count("pass")}** · fail **${count("fail")}** · warn **${count("warn")}** · skip **${count("skip")}**`;
}

/* -------------------------------------------------------------------------- */
/* Typecheck all-plants landing (combined one-tsconfig run)                    */
/* -------------------------------------------------------------------------- */

const ALL_PLANT_LABELS = {
  "vue-tsc": "vue-tsc",
  "vize-check": "vize",
  "verter-tsc": "verter-tsc",
  "golar-typecheck": "golar",
};

function finiteRuns(d) {
  return (Array.isArray(d?.runs) ? d.runs : []).map(Number).filter(Number.isFinite);
}

function mean(values) {
  if (!values.length) return Number.NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function allPlantTools(rows) {
  return (rows || [])
    .filter(
      (r) => (r.suite === "typecheck-all" || r.caseId === "all-plants") && r.status !== "skip",
    )
    .map((r) => {
      const d = r.detail || {};
      const runs = finiteRuns(d);
      const avgMs = Number(d.avgMs);
      const pass = Number(d.pass ?? r.pass);
      const scored = Number(d.scored ?? r.scored);
      const skip = Number(d.skip ?? r.skip) || 0;
      // A capability gap is a FAIL. Current runs score gaps directly; older
      // snapshots recorded them as skips, so fold those into the denominator
      // rather than excusing them out of the pass rate.
      const plants = (Number.isFinite(scored) ? scored : 0) + skip;
      const passPct =
        Number.isFinite(pass) && plants > 0
          ? (100 * pass) / plants
          : Number(d.passPct ?? r.passPct);
      return {
        label: ALL_PLANT_LABELS[r.tool] || r.tool,
        ms: Number(r.ms ?? d.ms),
        avgMs: Number.isFinite(avgMs) ? avgMs : runs.length ? mean(runs) : Number.NaN,
        rssMb: Number(r.rssMb ?? d.rssMb),
        rssToolMb: Number(r.rssToolMb ?? d.rssToolMb),
        rssEngineMb: Number(r.rssEngineMb ?? d.rssEngineMb),
        passPct,
        pass,
        plants,
        legacySkips: skip,
      };
    });
}

/**
 * Charts + compact tables for the combined all-plants typecheck
 * (one tsconfig, one spawn per tool). Shared by docs/typecheck.md and README.
 */
export function typecheckAllLanding(rows, { writeChart: write, chartsHref = "docs/charts" } = {}) {
  const tools = allPlantTools(rows);
  if (!tools.length) return "";
  const out = [];

  const writePair = (base, opts) => {
    write(`${base}.svg`, barChartSvg({ ...opts, theme: "light" }));
    write(`${base}-dark.svg`, barChartSvg({ ...opts, theme: "dark" }));
    out.push(chartPicture(chartsHref, base, opts.title), "");
  };

  const wallBars = tools
    .filter((t) => Number.isFinite(t.ms))
    .map((t) => ({ label: t.label, value: t.ms, ranked: true }));
  if (wallBars.length && write) {
    writePair("typecheck-all-wall", {
      title: "All plants · wall (one tsconfig)",
      unit: "ms",
      bars: wallBars,
    });
  }
  if (wallBars.length) {
    const fastest = Math.min(...wallBars.map((b) => b.value));
    const showAvg = tools.some((t) => Number.isFinite(t.avgMs));
    const showRss = tools.some((t) => Number.isFinite(t.rssMb) && t.rssMb > 0);
    const head = ["Tool", showAvg ? "**Median**" : "**Wall**"];
    if (showAvg) head.push("Avg");
    head.push("vs fastest");
    if (showRss) head.push("Peak RSS");
    out.push(`| ${head.join(" | ")} |`, `| --- | ${head.slice(1).map(() => "---:").join(" | ")} |`);
    for (const t of [...tools].sort((a, b) => (a.ms ?? Infinity) - (b.ms ?? Infinity))) {
      if (!Number.isFinite(t.ms)) continue;
      const cells = [t.label, `**${formatDuration(t.ms)}**`];
      if (showAvg) cells.push(Number.isFinite(t.avgMs) ? formatDuration(t.avgMs) : "–");
      cells.push(`${(t.ms / fastest).toFixed(2)}x`);
      if (showRss) {
        const engine = Number.isFinite(t.rssEngineMb) && t.rssEngineMb > 0 ? t.rssEngineMb : null;
        const tool =
          Number.isFinite(t.rssToolMb) && t.rssToolMb > 0
            ? t.rssToolMb
            : engine != null
              ? t.rssMb - engine
              : t.rssMb;
        cells.push(
          !Number.isFinite(t.rssMb) || t.rssMb <= 0
            ? "–"
            : engine != null
              ? `${tool.toFixed(1)} + ${engine.toFixed(1)} = **${t.rssMb.toFixed(1)} MB**`
              : `**${t.rssMb.toFixed(1)} MB**`,
        );
      }
      out.push(`| ${cells.join(" | ")} |`);
    }
    out.push("");
    if (tools.some((t) => Number.isFinite(t.rssEngineMb) && t.rssEngineMb > 0)) {
      out.push(
        "Peak RSS is the separate memory pass, split `tool + tsgo/tsc = total` when the checker spawns a TypeScript engine; in-process engines cannot be split.",
        "",
      );
    }
  }

  const pctBars = tools
    .filter((t) => Number.isFinite(t.passPct))
    .map((t) => ({ label: t.label, value: t.passPct, ranked: true }));
  if (pctBars.length && write) {
    writePair("typecheck-all-pass", {
      title: "All plants · pass rate (one tsconfig)",
      unit: "%",
      bars: pctBars,
      lowerIsBetter: false,
      maxValue: 100,
    });
  }
  if (pctBars.length) {
    out.push("| Tool | **Pass rate** | pass / plants |", "| --- | ---: | ---: |");
    for (const t of [...tools].sort((a, b) => (b.passPct ?? -1) - (a.passPct ?? -1))) {
      if (!Number.isFinite(t.passPct)) continue;
      const frac =
        Number.isFinite(t.pass) && t.plants > 0 ? `${t.pass} / ${t.plants}` : "–";
      out.push(`| ${t.label} | **${t.passPct.toFixed(0)}%** | ${frac} |`);
    }
    out.push("");
    out.push(
      "An unclaimed capability is a **gap and counts as a fail** — every tool is scored over the same full plant set. Skip is reserved for a missing binary/engine.",
      "",
    );
  }

  return out.join("\n").trim() + "\n";
}

/* -------------------------------------------------------------------------- */
/* Group documents                                                            */
/* -------------------------------------------------------------------------- */

function surfaceVariantLists(surface) {
  return [surface?.variants ?? [], ...(surface?.groups ?? []).map((g) => g.variants ?? [])];
}

/**
 * Split a variant list into its comparison classes — the same rules the table
 * renderer uses (report.mjs classKey), so a chart never ranks across classes.
 */
export function variantClasses(variants) {
  const byClass = new Map();
  for (const v of variants ?? []) {
    const k = classKey(v);
    if (!byClass.has(k)) byClass.set(k, []);
    byClass.get(k).push(v);
  }
  const keys = [...byClass.keys()].sort((a, b) =>
    a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b),
  );
  return keys.map((k) => ({
    key: k,
    label: keys.length > 1 ? classLabel(k, byClass.get(k)) : "",
    variants: byClass.get(k),
  }));
}

/**
 * Chart blocks for one bench surface: one chart per group and per comparison
 * class, never mixing classes into a ranking. Each chart carries the heading
 * it belongs under so it can be spliced above its table.
 */
function surfaceCharts(surface, groupId, { chartsDir, chartsHref }) {
  const out = [];
  const emitFor = (variants, { titleBase, fileBase, anchor }) => {
    for (const cls of variantClasses(variants)) {
      const bars = barsFromVariants(cls.variants);
      if (!bars.length) continue;
      const title = cls.label ? `${titleBase} — ${cls.label}` : titleBase;
      const img = emitChart({
        title,
        bars,
        chartsDir,
        chartsHref,
        fileBase: cls.label ? `${fileBase}-${cls.label}` : fileBase,
      });
      if (!img) continue;
      out.push({
        anchor: cls.label ? { level: 5, text: cls.label } : anchor,
        img,
      });
    }
  };
  const groups = (surface.groups ?? []).filter((g) => g.metric !== "rss");
  if (groups.length) {
    for (const g of groups) {
      emitFor(g.variants ?? [], {
        titleBase: `${surface.label} — ${g.label}`,
        fileBase: `${groupId}-${surface.id}-${g.label}`,
        anchor: { level: 4, text: g.label },
      });
    }
    return out;
  }
  emitFor(surface.variants ?? [], {
    titleBase: surface.label,
    fileBase: `${groupId}-${surface.id}`,
    anchor: { level: 3, text: null },
  });
  return out;
}

/**
 * Insert each chart image directly under the heading of the table it charts:
 * `##### <class>`, `#### <group>`, or the surface's own `### ` heading.
 */
function spliceChartsIntoSurface(markdown, charts) {
  if (!charts.length) return markdown;
  const lines = markdown.split("\n");
  const out = [];
  const pending = [...charts];
  for (const line of lines) {
    out.push(line);
    const m = /^(#{3,5}) (.+)$/.exec(line);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].trim();
    const idx = pending.findIndex(
      (c) =>
        c.anchor &&
        c.anchor.level === level &&
        (c.anchor.text == null || c.anchor.text === text),
    );
    if (idx >= 0) {
      out.push("", pending[idx].img, "");
      pending.splice(idx, 1);
    }
  }
  return out.join("\n");
}

/**
 * The IDE scale study as ONE table: rows = operation × server, one column per
 * workspace size, plus the growth multiplier. The per-op ops are named
 * `<op>@<files>` and the growth summaries `scale-<op>` (artifact = ×). The
 * old rendering (one table per op × size) was mostly empty cells.
 */
export function renderIdeScaleTable(results) {
  const sizes = [];
  const opOrder = [];
  const perServer = new Map(); // server -> { label, rssMb, cells: Map(`op@size`), growth: Map(op) }
  for (const row of results ?? []) {
    if (!perServer.has(row.server)) {
      perServer.set(row.server, {
        label: row.label ?? row.server,
        rssMb: Number.isFinite(row.peakRssMb) ? row.peakRssMb : null,
        rssToolMb: Number.isFinite(row.rssToolMb) ? row.rssToolMb : null,
        rssEngineMb: Number.isFinite(row.rssEngineMb) ? row.rssEngineMb : null,
        cells: new Map(),
        growth: new Map(),
      });
    }
    const entry = perServer.get(row.server);
    for (const op of row.ops ?? []) {
      const at = /^(.+)@(\d+)$/.exec(op.id);
      if (at) {
        const [, base, size] = at;
        if (!sizes.includes(size)) sizes.push(size);
        if (!opOrder.some((o) => o.id === base)) {
          opOrder.push({ id: base, label: String(op.label ?? base).replace(/\s*@\d+ files?$/i, "") });
        }
        entry.cells.set(`${base}@${size}`, op);
        continue;
      }
      const growth = /^scale-(.+)$/.exec(op.id);
      if (growth) entry.growth.set(growth[1], op);
    }
  }
  if (!opOrder.length) return "";
  sizes.sort((a, b) => Number(a) - Number(b));

  const cell = (op) => {
    if (!op || !Number.isFinite(op.medianMs)) return "–";
    const value = formatDuration(op.medianMs);
    return op.valid === false || op.ranked === false ? `(${value}) ⚠` : value;
  };
  const showRss = [...perServer.values()].some((s) => Number.isFinite(s.rssMb));
  const lines = [
    `| Operation | Tool | ${sizes.map((s) => `@${s} files`).join(" | ")} | growth |${showRss ? " Peak RSS |" : ""}`,
    `| --- | --- | ${sizes.map(() => "---:").join(" | ")} | ---: |${showRss ? " ---: |" : ""}`,
  ];
  for (const op of opOrder) {
    const servers = [...perServer.values()].sort((a, b) => {
      const last = (e) => {
        const c = e.cells.get(`${op.id}@${sizes[sizes.length - 1]}`);
        return c && Number.isFinite(c.medianMs) && c.valid !== false
          ? c.medianMs
          : Number.POSITIVE_INFINITY;
      };
      return last(a) - last(b);
    });
    for (let i = 0; i < servers.length; i++) {
      const s = servers[i];
      const cells = sizes.map((size) => cell(s.cells.get(`${op.id}@${size}`)));
      const g = s.growth.get(op.id);
      const growthCell = Number.isFinite(g?.artifact) ? `×${g.artifact}` : "–";
      const rssSplit =
        Number.isFinite(s.rssToolMb) && Number.isFinite(s.rssEngineMb) && s.rssEngineMb > 0;
      const rssCell = showRss
        ? ` ${
            !Number.isFinite(s.rssMb)
              ? "–"
              : rssSplit
                ? `${s.rssToolMb.toFixed(1)} + ${s.rssEngineMb.toFixed(1)} = ${s.rssMb.toFixed(1)} MB`
                : `${s.rssMb.toFixed(1)} MB`
          } |`
        : "";
      lines.push(
        `| ${i === 0 ? `**${op.label}**` : ""} | ${s.label} | ${cells.join(" | ")} | ${growthCell} |${rssCell}`,
      );
    }
  }
  return lines.join("\n");
}

/** Push every heading one level deeper (### → ####), fence-aware. */
function demoteHeadings(markdown) {
  let inFence = false;
  return String(markdown)
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      if (inFence) return line;
      return /^#{1,5} /.test(line) ? `#${line}` : line;
    })
    .join("\n");
}

const MEMORY_COLUMN_NOTE =
  "> **Peak RSS** on a timing row is the tool's peak resident set: measured in the timed session where the runner samples it (LSP servers, real-world CLIs), otherwise injected from the isolated memory probe below — the probe runs each tool in its own process, separate from timing.";

/** Disclosure banner for a source that is not a clean Linux CI run. */
export function localRunBanner(entry) {
  const r = entry?.data?.runner ?? {};
  const dirty = entry?.data?.commit?.dirty === true;
  const where = [r.platform, r.arch].filter(Boolean).join("/") || "unknown platform";
  return `> ⚠ **Local run — not the published Linux CI series** (${where}${dirty ? " · **dirty worktree** — not attributable to a single commit" : ""}). Shown because it is the newest data for this group; the next clean Linux Benchmark publish replaces it.`;
}

function sourceMetaLine(entry) {
  const d = entry.data;
  const bits = [];
  if (d.generatedAt) bits.push(String(d.generatedAt).slice(0, 10));
  if (d.fixture) bits.push(`\`${d.fixture}\`${d.fileCount ? ` (${d.fileCount} files)` : ""}`);
  if (d.runner?.platform) bits.push(`${d.runner.platform}/${d.runner.arch ?? "?"}`);
  bits.push(`source \`${entry.name}\``);
  return bits.join(" · ");
}

/**
 * Every bench-schema source that carries surfaces for this group, newest
 * first: `-current` studies lead when they are newer than the published
 * snapshot, corpus-scaling runs and older studies follow it.
 */
export function benchSourcesForGroup(group, model) {
  const has = (entry) =>
    (entry?.data?.surfaces ?? []).some((s) => group.benchSurfaces.includes(s.id));
  const primary = model.bench && has(model.bench) ? model.bench : null;
  const others = [
    ...(model.extras ?? []).filter(has),
    ...(model.benches ?? []).slice(1).filter(has),
  ];
  const at = (e) => String(e.data.generatedAt ?? "");
  const newer = others
    .filter((e) => primary && at(e) > at(primary))
    .sort((a, b) => at(b).localeCompare(at(a)));
  const older = others
    .filter((e) => !primary || at(e) <= at(primary))
    .sort((a, b) => at(b).localeCompare(at(a)));
  return [...newer, ...(primary ? [primary] : []), ...older];
}

/**
 * Rewrite methodology bullets recorded by OLDER runners that contradict the
 * current ranking rule (ratios were once pinned to a Vue reference; they are
 * now always vs fastest). The artifact JSON is history and stays untouched —
 * only the rendered page is corrected.
 */
const LEGACY_METHODOLOGY_REWRITES = [
  [
    /^Vue is the explicit reference for every candidate comparison class\. Ratio columns are vs Vue, never vs whichever .*?fastest\./,
    "Ratio columns are vs fastest — the fastest ranked row in each comparison class is the 1.00x denominator; no tool is pinned as a reference.",
  ],
];

function sanitizeSurface(surface) {
  if (!surface?.methodology?.length) return surface;
  const methodology = surface.methodology.map((note) => {
    for (const [re, to] of LEGACY_METHODOLOGY_REWRITES) {
      if (re.test(note)) return note.replace(re, to);
    }
    return note;
  });
  return { ...surface, methodology };
}

/** One source's surfaces for a group: charts + full tables (+ banner). */
function renderBenchSource(group, entry, { chartsDir, chartsHref, lead, isPrimary }) {
  const out = [];
  const surfaces = (entry.data.surfaces ?? []).filter((s) =>
    group.benchSurfaces.includes(s.id),
  );
  if (!surfaces.length) return out;
  if (!lead) {
    // Secondary sources own a heading so surface anchors cannot collide with
    // the leading run's; their surface headings are demoted underneath it.
    out.push(`### ${entry.name.replace(/\.json$/i, "")}`, "");
    out.push(sourceMetaLine(entry), "");
  } else if (!isPrimary) {
    // The lead is a study that outranks the published snapshot by date — the
    // page-top run meta describes the snapshot, so this source states its own.
    out.push(sourceMetaLine(entry), "");
  }
  if (entry.local) out.push(localRunBanner(entry), "");
  for (const raw of surfaces) {
    const surface = sanitizeSurface(raw);
    const charts = surfaceCharts(surface, `${group.id}-${entry.name.replace(/\.json$/i, "")}`, {
      chartsDir,
      chartsHref,
    });
    const rendered = spliceChartsIntoSurface(renderSurfaceMarkdown(surface), charts);
    out.push(lead ? rendered : demoteHeadings(rendered));
  }
  return out;
}

/** The compile-single size-ladder study (its own JSON kind). */
function renderCompileSingle(entry) {
  const suites = entry?.data?.suites ?? [];
  if (!suites.length) return [];
  const out = ["## Single-file compile (size ladder)", ""];
  out.push(sourceMetaLine(entry), "");
  if (entry.local) out.push(localRunBanner(entry), "");
  for (const note of entry.data.notes ?? []) out.push(`- ${note}`);
  if (entry.data.notes?.length) out.push("");
  for (const suite of suites) {
    out.push(
      `### ${suite.file} — ${Number(suite.bytes).toLocaleString()} bytes · ${suite.target} · ${suite.env}`,
      "",
    );
    out.push("| Tool | First call | Mean | ops/s | Samples | RME |");
    out.push("| --- | ---: | ---: | ---: | ---: | ---: |");
    const rows = [...(suite.rows ?? [])].sort(
      (a, b) => (a.meanMs ?? Infinity) - (b.meanMs ?? Infinity),
    );
    for (const r of rows) {
      if (r.status && r.status !== "ok") {
        out.push(`| ${r.tool} ${r.status === "error" ? "❌" : "⏭"} | ${r.status} | – | – | – | – |`);
        continue;
      }
      const first = Number.isFinite(r.firstCallMs) ? formatDuration(r.firstCallMs) : "–";
      const mean = Number.isFinite(r.meanMs) ? `**${r.meanMs.toFixed(3)} ms**` : "–";
      const hz = Number.isFinite(r.hz) ? Math.round(r.hz).toLocaleString() : "–";
      const rme = Number.isFinite(r.rme) ? `±${r.rme.toFixed(1)}%` : "–";
      out.push(`| ${r.tool} | ${first} | ${mean} | ${hz} | ${r.samples ?? "–"} | ${rme} |`);
    }
    out.push("");
  }
  return out;
}

/** docs/<group>.md */
export function renderGroupDoc(group, model, { chartsDir, chartsHref = "charts", typecheckPlants = "" }) {
  const { bench, ide, ideScale, memory, confirm, repeated } = model;
  const lines = [`# ${group.title}`, "", GENERATED_NOTE, ""];

  if (bench?.data) {
    lines.push(...runMetaLines(bench.data, { sourceName: bench.name }), "");
  }

  lines.push("## Results", "", RANKING_RULES, "", MEMORY_COLUMN_NOTE, "");

  // EVERY source that measured this group renders — the newest study first
  // (a `-current` artifact leads its page), then the published snapshot,
  // then corpus-scaling runs and older studies.
  const sources = benchSourcesForGroup(group, model);
  sources.forEach((entry, i) => {
    lines.push(
      ...renderBenchSource(group, entry, {
        chartsDir,
        chartsHref,
        lead: i === 0,
        isPrimary: entry === model.bench,
      }),
    );
  });
  if (!sources.length) {
    lines.push("_No published benchmark JSON for this group yet._", "");
  }

  if (group.id === "compiler" && model.compileSingle) {
    lines.push(...renderCompileSingle(model.compileSingle));
  }

  if (group.id === "compiler" && repeated?.data?.surfaces?.length) {
    const repeatedSurfaces = repeated.data.surfaces.filter((s) =>
      group.benchSurfaces.includes(s.id),
    );
    if (repeatedSurfaces.length) {
      lines.push("## Repeated-input study", "");
      lines.push(
        `A study, not a ranking: identical file bodies probe output-cache behaviour. Source: \`results/benchmarks/${repeated.name}\`.`,
        "",
      );
      for (const surface of repeatedSurfaces) {
        lines.push(demoteHeadings(renderSurfaceMarkdown(surface)));
      }
    }
  }

  if (group.includesIde && ide?.data?.results?.length) {
    lines.push("## IDE operations", "");
    lines.push(
      "The same language servers, measured per editor operation over LSP. " + IDE_RANKING_RULES,
      "",
    );
    // buildIdeSurfaces already leads with the initialize surface.
    const ideSurfaces = [
      ...buildIdeSurfaces(ide.data.results),
      buildTypingLoopSurface(ide.data.results),
    ].filter(Boolean);
    for (const surface of ideSurfaces) {
      const charts = surfaceCharts(surface, "lsp-ide", { chartsDir, chartsHref });
      lines.push(spliceChartsIntoSurface(renderSurfaceMarkdown(surface), charts));
    }
    if (ideScale?.data?.results?.length) {
      const scaleTable = renderIdeScaleTable(ideScale.data.results);
      if (scaleTable) {
        lines.push("### IDE scale study", "");
        lines.push(
          "Operation latency as the workspace grows — one table, one column per workspace size. A study, not a ranking surface; **growth** is the 20→500-file multiplier. **Peak RSS** is the server process tree's peak over the whole scale session (one figure per server — it is not attributable to a single size, so it repeats across operations).",
          "",
        );
        if (ideScale.local) lines.push(localRunBanner(ideScale), "");
        lines.push(scaleTable, "");
      }
    }
  }

  const { rows: confirmRows, sources: confirmSources } = confirmForGroup(model, group);
  const isTypecheck = group.id === "typecheck";
  lines.push("## Validation (plants)", "");
  lines.push(
    "Executable correctness checks — planted errors that must be reported, clean fixtures that must stay clean. A fast tool that misses plants cannot rank as a correct one; gate failures surface as ⚠ in the timing tables.",
    "",
  );
  for (const src of confirmSources) {
    if (src.local) {
      lines.push(localRunBanner(src), "");
      break;
    }
  }
  if (isTypecheck) {
    const landing = typecheckAllLanding(confirmRows, {
      chartsHref,
      writeChart: (file, svg) => writeChart(chartsDir, file, svg),
    });
    if (landing.trim()) {
      lines.push("### All plants (one tsconfig)", "");
      lines.push(
        "One spawn per tool over every plant with the shared `strictTemplates` tsconfig — no per-case overlays, no retries.",
        "",
      );
      lines.push(landing.trim(), "");
    }
    if (typecheckPlants.trim()) {
      // The FULL per-plant matrix — every case, documented gaps, per-plant
      // time/memory — lives on this page, demoted under the Validation
      // section rather than split into a separate document.
      lines.push("### Plant matrix", "");
      lines.push(demoteHeadings(typecheckPlants).trim(), "");
    }
  }
  const matrix = confirmMatrix(confirmRows);
  if (matrix) {
    const summary = confirmSummaryLine(confirmRows.filter((r) => r.suite !== "typecheck-all"));
    if (summary) lines.push(summary, "");
    lines.push(matrix, "");
  }
  if (!matrix && !isTypecheck) {
    lines.push(
      `_The published \`confirm.json\` carries no ${group.id} rows yet — the Benchmark workflow's confirm job publishes every suite on its next dispatch; locally: \`pnpm confirm:${group.id === "compiler" ? "compile" : group.id}\`._`,
      "",
    );
  }

  // Real-world results live only on docs/real-world.md and the per-project
  // pages; group pages point there rather than duplicating the tables.
  if ((model.realWorld ?? []).length) {
    lines.push(
      `> The same group measured on pinned third-party projects: [real-world.md](real-world.md).`,
      "",
    );
  }

  const memorySources = (model.memories ?? (memory ? [memory] : [])).filter((m) =>
    (m?.data?.results ?? []).some((r) => group.memorySurfaces.includes(r.surface)),
  );
  if (memorySources.length) {
    lines.push("## Memory (isolated probe)", "");
    lines.push(
      "Each tool in its own process so RSS, allocation proxies and CPU are not mixed with siblings or with timing. Full probe across every group: [memory.md](memory.md).",
      "",
    );
    for (const src of memorySources) {
      if (memorySources.length > 1) {
        lines.push(`### ${src.name.replace(/\.json$/i, "")}`, "");
        lines.push(sourceMetaLine(src), "");
      }
      if (src.local) lines.push(localRunBanner(src), "");
      const rows = src.data.results.filter((r) => group.memorySurfaces.includes(r.surface));
      const bySurface = new Map();
      for (const r of rows) {
        if (!bySurface.has(r.surface)) bySurface.set(r.surface, []);
        bySurface.get(r.surface).push(r);
      }
      const deep = memorySources.length > 1;
      for (const [surfaceId, surfaceRows] of bySurface) {
        if (bySurface.size > 1) lines.push(`${deep ? "####" : "###"} ${surfaceId}`, "");
        const table = memoryProbeTable(surfaceRows);
        if (table) lines.push(table, "");
      }
    }
  }

  if (bench?.data?.versions) {
    lines.push("## Tool versions", "");
    lines.push("<details><summary>Every pinned package in this run</summary>", "");
    lines.push("| Package | Version |", "| --- | --- |");
    for (const [name, version] of Object.entries(bench.data.versions)) {
      lines.push(`| ${name} | ${version} |`);
    }
    lines.push("", "</details>", "");
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

/* -------------------------------------------------------------------------- */
/* Real-world documents                                                       */
/* -------------------------------------------------------------------------- */

/** The surfaces the real-world landing ranks (the project's OWN toolchain). */
const REAL_WORLD_LANDING = ["project-test", "project-build", "project-typecheck"];

export const REAL_WORLD_RULES = [
  "> Corpora are pinned checkouts of third-party open-source Vue projects; sources are unmodified and every page names its ref and resolved commit SHA.",
  "> **Rank within a corpus, never across it.** The corpora differ in size and in kind — library source, application source and documentation demos are not the same code.",
  "> **⚠ unranked** is a gate, not a verdict on the official toolchain. A project shipping **no lockfile** at the pinned ref cannot be installed frozen, so every row on that corpus is unranked equally — including vue-tsc.",
];

function repoLink(repo) {
  const url = String(repo ?? "");
  if (!url) return "";
  const clean = url.replace(/\.git$/, "");
  const short = clean.replace(/^https?:\/\/github\.com\//, "");
  const href = /^https?:/i.test(clean) ? clean : `https://github.com/${clean}`;
  return `[\`${short}\`](${href})`;
}

function corpusLine(data) {
  const c = (data?.corpora ?? [])[0];
  if (!c) return "";
  const ref = c.ref && String(c.ref).length > 16 ? `${String(c.ref).slice(0, 10)}…` : (c.ref ?? "");
  const sha = c.sha ? ` @ \`${String(c.sha).slice(0, 10)}\`` : "";
  return `**${c.selector}** — ${repoLink(c.repo)} ${ref}${sha} · ${c.files ?? "?"} files${c.hasLockfile === false ? " · **no lockfile** (unranked corpus)" : ""}`;
}

/** docs/real-world/<project>.md — the full per-project report. */
export function renderRealWorldProjectDoc(entry, { chartsDir, chartsHref = "../charts" }) {
  const { data, project } = entry;
  const lines = [
    `# Real-world: ${project}`,
    "",
    GENERATED_NOTE.replace("(../results", "(../../results").replace("[`results/real_world/`](../results/real_world/)", "[`results/real_world/`](../../results/real_world/)"),
    "",
  ];
  const corpus = corpusLine(data);
  if (corpus) lines.push(corpus, "");
  lines.push(...runMetaLines(data, {}), "");
  lines.push(RANKING_RULES, "", ...REAL_WORLD_RULES, "");

  for (const rawSurface of data.surfaces ?? []) {
    const surface = sanitizeSurface(rawSurface);
    const charts = REAL_WORLD_LANDING.includes(surface.id)
      ? surfaceCharts(surface, `real-world-${project}`, { chartsDir, chartsHref })
      : [];
    lines.push(spliceChartsIntoSurface(renderSurfaceMarkdown(surface), charts));
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

/** docs/real-world.md — the landing: main numbers + charts per project. */
export function renderRealWorldIndex(realWorld, { chartsDir, chartsHref = "charts" }) {
  const lines = [
    "# Real-world project results",
    "",
    GENERATED_NOTE,
    "",
    "One page per pinned open-source project; this page carries each project's headline numbers — its **own** test / build / typecheck (plugin swaps included). Everything else (compile, format, lint, bundle, HMR, LSP, per-row notes, raw runs) lives on the project page.",
    "",
    ...REAL_WORLD_RULES,
    "",
    "## Projects",
    "",
  ];
  for (const entry of realWorld) {
    lines.push(`- [${entry.project}](real-world/${entry.project}.md) — ${corpusLine(entry.data)}`);
  }
  lines.push("");

  for (const entry of realWorld) {
    const { data, project } = entry;
    const landing = (data.surfaces ?? []).filter((s) => REAL_WORLD_LANDING.includes(s.id));
    const rendered = [];
    for (const surface of landing) {
      const parts = [];
      for (const variants of surfaceVariantLists(surface)) {
        const bars = barsFromVariants(variants);
        if (!bars.length) continue;
        const img = emitChart({
          title: surface.label,
          bars,
          chartsDir,
          chartsHref,
          fileBase: `real-world-${project}-${surface.id}`,
        });
        const table = compactTable(variants, {
          docHref: `real-world/${project}.md`,
        });
        if (img) parts.push(img, "");
        if (table) parts.push(table, "");
        break;
      }
      if (parts.length) rendered.push(`### ${surface.label}`, "", ...parts);
    }
    if (!rendered.length) continue;
    lines.push(`## ${project}`, "");
    lines.push(`> 📄 Full report: [real-world/${project}.md](real-world/${project}.md)`, "");
    lines.push(...rendered);
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}
