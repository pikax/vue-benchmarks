/**
 * Compact README tables + self-contained SVG bar charts.
 *
 * The published README is a landing page (chart + Tool / Median / vs-fastest).
 * Full tables, notes, raw runs and environment stay in docs/results/.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { linkToolLabel, plainToolName } from "./tool-catalog.mjs";

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&lt;/g, " ")
    .replace(/&gt;/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

/** Median cell → { ms, ranked } or null for skip/error. */
export function parseMedianCell(cell) {
  const raw = String(cell ?? "").trim();
  if (!raw || /^(skipped|error|–|-)$/i.test(raw)) return null;
  const m = /\(?([\d.,]+)\s*(ms|s|min)\)?/.exec(raw);
  if (!m) return null;
  const v = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(v)) return null;
  const ms = m[2] === "s" ? v * 1000 : m[2] === "min" ? v * 60000 : v;
  return { ms, ranked: !/^\(/.test(raw) && !/not ranked/i.test(raw) };
}

/** RSS cell `min / max / avg` or `32.3 MB` → peak MB. */
export function parseRssMaxMb(cell) {
  const raw = String(cell ?? "").trim();
  const parts = raw.split("/").map((s) => parseFloat(s.replace(/,/g, "").trim()));
  if (parts.length >= 2 && Number.isFinite(parts[1])) return parts[1];
  const m = /\(?([\d.,]+)\s*MB\)?/i.exec(raw);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function splitRow(line) {
  const raw = line.trim();
  if (!raw.startsWith("|")) return [];
  return raw
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms)) return "–";
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10_000 ? 1 : 2)} s`;
  if (ms >= 100) return `${ms.toFixed(0)} ms`;
  return `${ms.toFixed(1)} ms`;
}

/** Stable per-family colours so a tool is the same hue on every chart. */
export const TOOL_COLORS = {
  verter: "#e11d48",
  vue: "#42b883",
  vize: "#2563eb",
  golar: "#c9842a",
  prettier: "#f7b93e",
  oxc: "#ca8a04",
  biome: "#0ea5e9",
  eslint: "#4b32c3",
  fervid: "#78716c",
  babel: "#f9dc3e",
  jsxVapor: "#0891b2",
  rspack: "#8b5cf6",
  webpack: "#1d78c1",
  vite8: "#ff7e36",
  vite7: "#ff3e00",
  other: "#64748b",
};

export function colorForTool(name) {
  const n = String(name).toLowerCase();
  if (n.includes("verter")) return TOOL_COLORS.verter;
  if (n.includes("vize")) return TOOL_COLORS.vize;
  if (
    n.includes("vue-tsc") ||
    n.includes("volar") ||
    n.includes("@vue/compiler") ||
    n.includes("vue-component-meta") ||
    n.includes("@vitejs/plugin-vue") ||
    n.includes("unplugin-vue") ||
    n.includes("vue-loader") ||
    /\bvue official\b/.test(n)
  )
    return TOOL_COLORS.vue;
  if (n.includes("golar")) return TOOL_COLORS.golar;
  if (n.includes("prettier")) return TOOL_COLORS.prettier;
  if (n.includes("oxfmt") || n.includes("oxlint")) return TOOL_COLORS.oxc;
  if (n.includes("biome")) return TOOL_COLORS.biome;
  if (n.includes("eslint")) return TOOL_COLORS.eslint;
  if (n.includes("fervid")) return TOOL_COLORS.fervid;
  if (n.includes("babel")) return TOOL_COLORS.babel;
  if (n.includes("jsx-vapor") || n.includes("compiler-rs")) return TOOL_COLORS.jsxVapor;
  if (n.includes("rspack")) return TOOL_COLORS.rspack;
  if (n.includes("webpack")) return TOOL_COLORS.webpack;
  if (n.includes("rolldown") || n.includes("vite 8")) return TOOL_COLORS.vite8;
  if (n.includes("vite 7") || n.includes("rollup")) return TOOL_COLORS.vite7;
  return TOOL_COLORS.other;
}

function formatBarValue(value, unit) {
  if (unit === "%") return `${value.toFixed(0)}%`;
  if (unit === "MB") return `${value.toFixed(1)} MB`;
  return formatDuration(value);
}

/**
 * Horizontal bar chart. Speed/RSS: lower is better. Pass rate: higher is better
 * (`lowerIsBetter: false`, axis 0–100). Unranked bars keep the tool colour
 * with a hatch overlay. Background is transparent; labels follow light/dark.
 */
function groupBars(usable, lowerIsBetter) {
  const map = new Map();
  for (const b of usable) {
    const key = b.label;
    if (!map.has(key)) {
      map.set(key, {
        label: key,
        ranked: true,
        warm: null,
        cold: null,
        toolRss: null,
        engineRss: null,
        value: null,
      });
    }
    const g = map.get(key);
    if (b.ranked === false) g.ranked = false;
    if (b.series === "warm") g.warm = b.value;
    else if (b.series === "cold") g.cold = b.value;
    else if (b.series === "tool") g.toolRss = b.value;
    else if (b.series === "engine") g.engineRss = b.value;
    else g.value = b.value;
  }
  const groups = [...map.values()].map((g) => {
    const stackedRss = Number.isFinite(g.toolRss) && Number.isFinite(g.engineRss);
    const stacked = Number.isFinite(g.warm) && Number.isFinite(g.cold);
    const sortValue = stackedRss
      ? g.toolRss + g.engineRss
      : stacked
        ? g.cold
        : (g.value ?? g.cold ?? g.warm ?? 0);
    const barValue = stackedRss ? g.toolRss + g.engineRss : stacked ? Math.max(g.cold, g.warm) : sortValue;
    return { ...g, stacked, stackedRss, sortValue, barValue };
  });
  groups.sort((a, b) => {
    if (a.ranked !== b.ranked) return a.ranked ? -1 : 1;
    return lowerIsBetter ? a.sortValue - b.sortValue : b.sortValue - a.sortValue;
  });
  return groups;
}

export function barChartSvg({ title, unit = "ms", bars, lowerIsBetter = true, maxValue }) {
  const usable = bars.filter((b) => Number.isFinite(b.value) && b.value >= 0);
  if (usable.length === 0) return "";
  const groups = groupBars(usable, lowerIsBetter);
  const stacked = groups.some((g) => g.stacked);
  const stackedRss = groups.some((g) => g.stackedRss);

  const padL = 16;
  const labelW = 248;
  const rightPad = 110;
  const top = stacked || stackedRss ? 52 : 44;
  const rowH = 36;
  const barH = 22;
  const bottom = 28;
  const height = top + groups.length * rowH + bottom;
  const width = 760;
  const plotW = width - labelW - rightPad;
  const dataMax = Math.max(...groups.map((g) => g.barValue), Number.EPSILON);
  const max = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : unit === "%" ? 100 : dataMax;

  const escape = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const plotBottom = height - bottom;
  const ticks = 4;
  const axis = [];
  for (let i = 0; i <= ticks; i++) {
    const frac = i / ticks;
    const x = labelW + frac * plotW;
    const v = max * frac;
    axis.push(
      `<line class="grid" x1="${x}" y1="${top - 8}" x2="${x}" y2="${plotBottom}" />`,
      `<text class="muted" x="${x}" y="${height - 8}" text-anchor="middle" font-size="11">${escape(formatBarValue(v, unit))}</text>`,
    );
  }

  const hatches = [];
  const rows = groups.map((g, i) => {
    const y = top + i * rowH;
    const color = colorForTool(g.label);
    const hatchId = `hatch-${i}`;
    if (g.ranked === false) {
      hatches.push(
        `<pattern id="${hatchId}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="8" height="8" fill="${color}"/><line x1="0" y1="0" x2="0" y2="8" stroke="#fff" stroke-width="3" opacity="0.35"/></pattern>`,
      );
    }
    const fill = g.ranked === false ? `url(#${hatchId})` : color;
    const name = g.label.length > 36 ? `${g.label.slice(0, 35)}…` : g.label;
    const nameClass = g.ranked === false ? "label struck" : "label";
    const unranked = g.ranked === false ? " · unranked" : "";

    let segments = "";
    let valueLabel;
    let totalW;
    if (g.stackedRss) {
      const toolW = Math.max(0, (g.toolRss / max) * plotW);
      const engineW = Math.max(0, (g.engineRss / max) * plotW);
      const totalStack = toolW + engineW;
      segments = `<rect class="track" x="${labelW}" y="${y + 5}" width="${plotW}" height="${barH}" rx="5"/>
      <rect class="tool-rss" x="${labelW}" y="${y + 5}" width="${Math.max(4, toolW).toFixed(1)}" height="${barH}" rx="5" fill="${fill}"/>
      <rect class="engine-rss" x="${labelW + toolW}" y="${y + 5}" width="${Math.max(g.engineRss > 0 ? 4 : 0, engineW).toFixed(1)}" height="${barH}" rx="5" fill="${fill}" fill-opacity="0.38"/>`;
      valueLabel =
        g.engineRss > 0
          ? `${formatBarValue(g.toolRss, unit)} + ${formatBarValue(g.engineRss, unit)} = ${formatBarValue(g.barValue, unit)}${unranked}`
          : `${formatBarValue(g.barValue, unit)}${unranked}`;
      totalW = Math.max(4, totalStack);
    } else if (g.stacked) {
      const warmW = Math.max(4, (g.warm / max) * plotW);
      const coldW = Math.max(warmW, (g.cold / max) * plotW);
      const extra = Math.max(0, coldW - warmW);
      // Warm sits on the left; cold extra stacks to the right so the full
      // bar is first-request time and the solid run is cached time.
      segments = `<rect class="track" x="${labelW}" y="${y + 5}" width="${plotW}" height="${barH}" rx="5"/>
      <rect class="cold" x="${labelW}" y="${y + 5}" width="${coldW.toFixed(1)}" height="${barH}" rx="5" fill="${fill}" fill-opacity="0.38"/>
      <rect class="warm" x="${labelW}" y="${y + 5}" width="${warmW.toFixed(1)}" height="${barH}" rx="5" fill="${fill}"/>`;
      if (extra < 1) {
        // cold ≈ warm: the pale layer is hidden; still label both.
      }
      valueLabel = `${formatBarValue(g.warm, unit)} / ${formatBarValue(g.cold, unit)}${unranked}`;
      totalW = coldW;
    } else {
      totalW = Math.max(4, (g.barValue / max) * plotW);
      segments = `<rect class="track" x="${labelW}" y="${y + 5}" width="${plotW}" height="${barH}" rx="5"/>
      <rect x="${labelW}" y="${y + 5}" width="${totalW.toFixed(1)}" height="${barH}" rx="5" fill="${fill}"/>`;
      valueLabel = formatBarValue(g.barValue, unit) + unranked;
    }
    const valueInside = totalW > 96;
    const valueEl = valueInside
      ? `<text class="onbar" x="${labelW + totalW - 8}" y="${y + 16}" text-anchor="end" font-size="12" font-weight="600">${escape(valueLabel)}</text>`
      : `<text class="label" x="${labelW + totalW + 8}" y="${y + 16}" font-size="12" font-weight="600">${escape(valueLabel)}</text>`;
    return `<text class="muted" x="${padL}" y="${y + 16}" font-size="11">${i + 1}</text>
      <text class="${nameClass}" x="${labelW - 12}" y="${y + 16}" text-anchor="end" font-size="13">${escape(name)}</text>
      ${segments}
      ${valueEl}`;
  });

  const legend = stackedRss
    ? `<rect x="${padL}" y="28" width="10" height="10" rx="2" fill="#111827"/>
  <text class="muted" x="${padL + 14}" y="37" font-size="11">tool</text>
  <rect x="${padL + 54}" y="28" width="10" height="10" rx="2" fill="#111827" fill-opacity="0.38"/>
  <text class="muted" x="${padL + 68}" y="37" font-size="11">tsgo / tsc</text>`
    : stacked
      ? `<rect x="${padL}" y="28" width="10" height="10" rx="2" fill="#111827"/>
  <text class="muted" x="${padL + 14}" y="37" font-size="11">warm</text>
  <rect x="${padL + 58}" y="28" width="10" height="10" rx="2" fill="#111827" fill-opacity="0.38"/>
  <text class="muted" x="${padL + 72}" y="37" font-size="11">cold</text>`
      : "";

  const better = lowerIsBetter ? "lower is better" : "higher is better";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(title)}">
  <title>${escape(title)} (${better})</title>
  <style><![CDATA[
    text { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
    .label { fill: #111827; }
    .struck { text-decoration: line-through; opacity: 0.62; }
    .muted { fill: #6b7280; }
    .onbar { fill: #ffffff; }
    .track { fill: #111827; fill-opacity: 0.06; }
    .grid { stroke: #111827; stroke-opacity: 0.08; }
    @media (prefers-color-scheme: dark) {
      .label { fill: #f9fafb; }
      .muted { fill: #9ca3af; }
      .track { fill: #f9fafb; fill-opacity: 0.08; }
      .grid { stroke: #f9fafb; stroke-opacity: 0.12; }
    }
  ]]></style>
  ${hatches.length ? `<defs>${hatches.join("")}</defs>` : ""}
  <text class="label" x="${padL}" y="22" font-size="15" font-weight="600">${escape(title)}</text>
  <text class="muted" x="${width - padL}" y="22" text-anchor="end" font-size="11">${escape(better)}</text>
  ${legend}
  ${axis.join("\n  ")}
  ${rows.join("\n  ")}
</svg>
`;
}

export function writeChart(dir, leaf, svg) {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, leaf);
  writeFileSync(path, svg);
  return path;
}

function headerIndex(header, re) {
  return header.findIndex((c) => re.test(c.replace(/\*/g, "").trim()));
}

function rowIsUnranked(cells, medianIdx, vsIdx) {
  if (/[⚠❌⏭]/u.test(cells[0] ?? "")) return true;
  if (vsIdx >= 0 && /not ranked/i.test(cells[vsIdx] ?? "")) return true;
  const med = String(cells[medianIdx] ?? "").trim();
  if (/^(skipped|error|–|-)$/i.test(med)) return true;
  const parsed = parseMedianCell(med);
  return parsed ? parsed.ranked === false : false;
}

export function compactSpeedTable(headerLine, sepLine, rowLines, { rankedOnly = false } = {}) {
  const header = splitRow(headerLine);
  const toolIdx = 0;
  const coldIdx = headerIndex(header, /^cold$/i);
  const warmIdx = headerIndex(header, /^warm$/i);
  const medianIdx = headerIndex(header, /median/i) >= 0 ? headerIndex(header, /median/i) : 1;
  const vsColdIdx = headerIndex(header, /vs fastest cold/i);
  const vsIdx = header.findIndex((c, i) => /vs fastest/i.test(c.replace(/\*/g, "").trim()) && i !== vsColdIdx);
  const dual = coldIdx >= 0 && warmIdx >= 0;
  const cols = dual
    ? ["Tool", "**Cold**", "vs fastest cold", "**Warm**"]
    : ["Tool", "**Median**", "vs fastest"];
  const align = dual ? ["---", "---:", "---:", "---:"] : ["---", "---:", "---:"];
  const out = [`| ${cols.join(" | ")} |`, `| ${align.join(" | ")} |`];
  let n = 0;
  for (const line of rowLines) {
    const cells = splitRow(line);
    if (!cells.length) continue;
    if (rankedOnly && rowIsUnranked(cells, dual ? warmIdx : medianIdx, vsIdx)) continue;
    n++;
    const vs = vsIdx >= 0 ? cells[vsIdx] ?? "–" : "–";
    const tool = linkToolLabel(cells[toolIdx] ?? "");
    if (dual) {
      const vsCold = vsColdIdx >= 0 ? cells[vsColdIdx] ?? "–" : "–";
      out.push(`| ${tool} | ${cells[coldIdx] ?? "–"} | ${vsCold} | ${cells[warmIdx] ?? "–"} |`);
    } else {
      out.push(`| ${tool} | ${cells[medianIdx] ?? "–"} | ${vs} |`);
    }
  }
  return n === 0 ? "" : out.join("\n");
}

export function barsFromSpeedTable(headerLine, rowLines, { rankedOnly = false } = {}) {
  const header = splitRow(headerLine);
  const coldIdx = headerIndex(header, /^cold$/i);
  const warmIdx = headerIndex(header, /^warm$/i);
  const medianIdx = headerIndex(header, /median/i) >= 0 ? headerIndex(header, /median/i) : 1;
  const vsColdIdx = headerIndex(header, /vs fastest cold/i);
  const vsIdx = header.findIndex((c, i) => /vs fastest/i.test(c.replace(/\*/g, "").trim()) && i !== vsColdIdx);
  const bars = [];
  for (const line of rowLines) {
    const cells = splitRow(line);
    if (!cells.length) continue;
    if (rankedOnly && rowIsUnranked(cells, warmIdx >= 0 ? warmIdx : medianIdx, vsIdx)) continue;
    const label = plainToolName(cells[0]);
    const nameRanked = !/[⚠❌⏭]/u.test(cells[0]);
    if (coldIdx >= 0 && warmIdx >= 0) {
      const cold = parseMedianCell(cells[coldIdx]);
      const warm = parseMedianCell(cells[warmIdx]);
      if (cold) {
        bars.push({
          label,
          series: "cold",
          value: cold.ms,
          ranked: cold.ranked && nameRanked,
        });
      }
      if (warm) {
        bars.push({
          label,
          series: "warm",
          value: warm.ms,
          ranked: warm.ranked && nameRanked,
        });
      }
      continue;
    }
    const parsed = parseMedianCell(cells[medianIdx]);
    if (!parsed) continue;
    bars.push({
      label,
      value: parsed.ms,
      ranked: parsed.ranked && nameRanked,
    });
  }
  return bars;
}

export function barsFromRssTable(headerLine, rowLines) {
  const header = splitRow(headerLine);
  const rssIdx = header.findIndex((c) => /rss/i.test(c));
  if (rssIdx < 0) return [];
  const bars = [];
  for (const line of rowLines) {
    const cells = splitRow(line);
    if (!cells.length) continue;
    const mb = parseRssMaxMb(cells[rssIdx]);
    if (mb == null) continue;
    bars.push({
      label: plainToolName(cells[0]),
      value: mb,
      ranked: !/[⚠❌⏭]/u.test(cells[0]),
    });
  }
  return bars;
}

export function parseMarkdownSections(markdown) {
  const root = { level: 0, title: "", lines: [], children: [] };
  const stack = [root];
  for (const line of String(markdown).split("\n")) {
    const m = /^(#{1,6}) (.+)$/.exec(line);
    if (m) {
      const level = m[1].length;
      while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
      const node = { level, title: m[2], lines: [], children: [] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    } else {
      stack[stack.length - 1].lines.push(line);
    }
  }
  return root;
}

function titlePath(ancestors, node) {
  return [...ancestors.map((a) => a.title), node.title].filter(Boolean).join(" › ");
}

/**
 * README IDE landing order. Template interpolation is lifted out of smoke so
 * it can sit between completion and the script-hover smoke probe.
 */
export const IDE_HIGHLIGHT_SECTIONS = [
  { section: "IDE · initialize", leaf: /^(lsp initialize|initialize)$/i },
  { section: "IDE · completion", leaf: /completion:\s*script member/i },
  { section: "IDE · template interpolation", leaf: /hover \(template/i },
  { section: "IDE · smoke", leaf: /hover \(script setup\)/i },
  { section: "IDE · navigation", leaf: /definition:\s*imported fn/i },
  { section: "IDE · edit-loop", leaf: /edit plants type error/i },
];

function walkKeepLeaves(node, acc = [], parent = null) {
  if (node.level > 0 && node.keepSelf && extractFirstTable(node.lines)) {
    acc.push({ node, parentTitle: parent?.title ?? "" });
  }
  for (const child of node.children ?? []) walkKeepLeaves(child, acc, node);
  return acc;
}

function orderIdeHighlightTree(tree) {
  const leaves = walkKeepLeaves(tree);
  const used = new Set();
  const children = [];
  for (const spec of IDE_HIGHLIGHT_SECTIONS) {
    const hit = leaves.find((x) => spec.leaf.test(x.node.title) && !used.has(x.node));
    if (!hit) continue;
    used.add(hit.node);
    const kids = [{ ...hit.node, level: 4, children: [] }];
    for (const x of leaves) {
      if (used.has(x.node)) continue;
      if (!/peak rss/i.test(x.node.title)) continue;
      if (x.parentTitle !== hit.parentTitle && x.parentTitle !== spec.section) continue;
      used.add(x.node);
      kids.push({ ...x.node, level: 4, children: [] });
    }
    children.push({
      level: 3,
      title: spec.section,
      lines: [],
      children: kids,
      keepSelf: false,
    });
  }
  for (const { node } of leaves) {
    if (used.has(node)) continue;
    children.push({
      level: 3,
      title: node.title.startsWith("IDE · ") ? node.title : `IDE · ${node.title}`,
      lines: [],
      children: [{ ...node, level: 4, children: [] }],
      keepSelf: false,
    });
  }
  return { ...tree, children };
}

function isSfcCompilePath(blob) {
  // Unique-contents is the usual title; duplicate-body corpora warn in the
  // heading instead (`SFC compile (⚠ 2 duplicate bodies — …)`).
  return /sfc compile/.test(blob);
}

function isKeepHeading(kind, node, ancestors) {
  const path = titlePath(ancestors, node);
  const blob = path.toLowerCase();
  const title = node.title.toLowerCase();

  if (kind === "cache-demo" || kind === "ide-scale") return false;

  if (kind === "bench") {
    if (isSfcCompilePath(blob)) {
      if (/production|development|sourcemap/i.test(title) || /^vdom|^vapor/i.test(title)) {
        return /production/.test(title) && !/development/.test(title);
      }
      return true;
    }
    if (title === "typecheck") return true;
    if (title === "format" || title === "lint" || title === "component-meta") return true;
    if (title.startsWith("lsp")) return true;
    return false;
  }

  if (kind === "ide") {
    return /peak rss/i.test(title) || IDE_HIGHLIGHT_SECTIONS.some((s) => s.leaf.test(title));
  }

  if (kind === "real-world") {
    if (/peak rss/i.test(title)) return true;
    if (/project typecheck/i.test(blob)) return true;
    if (/project test/i.test(blob)) return true;
    if (/project build/i.test(blob)) return true;
    return false;
  }

  if (kind === "memory") {
    return (
      title === "compile" ||
      title === "typecheck" ||
      title === "format" ||
      title === "lint" ||
      title === "component-meta" ||
      title === "lsp"
    );
  }

  return false;
}

function pruneTree(node, kind, ancestors = []) {
  const kids = node.children
    .map((child) => pruneTree(child, kind, [...ancestors, node]))
    .filter(Boolean);
  const want = node.level === 0 || isKeepHeading(kind, node, ancestors.filter((a) => a.level > 0));
  if (!want && kids.length === 0) return null;
  if (node.level > 0 && kids.length === 0 && !extractFirstTable(node.lines)) return null;
  return { ...node, children: kids, keepSelf: want };
}

function extractFirstTable(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (/^\|/.test(lines[i]) && /^\|[\s:|-]+\|$/.test(lines[i + 1] ?? "")) {
      let j = i + 2;
      const rows = [];
      while (j < lines.length && /^\|/.test(lines[j])) {
        rows.push(lines[j]);
        j++;
      }
      return { header: lines[i], sep: lines[i + 1], rows, start: i, end: j };
    }
  }
  return null;
}

function noteMap(lines) {
  const map = new Map();
  for (const line of lines) {
    const m = /^- \*\*(.+?)\*\*:\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    const key = plainToolName(m[1]);
    if (map.has(key)) continue;
    map.set(key, m[2]);
  }
  return map;
}

function unrankedWhy(note) {
  const parts = String(note ?? "").split(/\s*\|\s*/);
  const hit =
    parts.find((p) => /⚠\s*(UNRANKED|FAILED|TOO NOISY|BACKEND FALLBACK)/i.test(p)) ||
    parts.find((p) => p.includes("⚠"));
  if (!hit) return "";
  let s = hit.replace(/^⚠\s*/, "").replace(/\s+/g, " ").trim();
  if (s.length > 220) {
    const cut = s.slice(0, 220);
    const dot = cut.lastIndexOf(".");
    s = dot > 80 ? cut.slice(0, dot + 1) : `${cut}…`;
  }
  return s;
}

function linesForHeading(sourceLines, title) {
  if (!title) return sourceLines;
  const needle = String(title).replace(/^#+\s*/, "").slice(0, 48);
  let start = -1;
  let level = 6;
  for (let i = 0; i < sourceLines.length; i++) {
    const m = /^(#{1,6}) (.+)$/.exec(sourceLines[i]);
    if (m && m[2].includes(needle)) {
      start = i;
      level = m[1].length;
      break;
    }
  }
  if (start < 0) return sourceLines;
  const out = [];
  for (let i = start + 1; i < sourceLines.length; i++) {
    const m = /^(#{1,6}) /.exec(sourceLines[i]);
    if (m && m[1].length <= level) break;
    out.push(sourceLines[i]);
  }
  return out;
}

export function unrankedFootnotes(headerLine, rowLines, extraLines = [], heading = "") {
  const header = splitRow(headerLine);
  const medianIdx = headerIndex(header, /median/i) >= 0 ? headerIndex(header, /median/i) : 1;
  const vsColdIdx = headerIndex(header, /vs fastest cold/i);
  const vsIdx = header.findIndex((c, i) => /vs fastest/i.test(c.replace(/\*/g, "").trim()) && i !== vsColdIdx);
  const notes = noteMap(linesForHeading(extraLines, heading));
  const items = [];
  for (const line of rowLines) {
    const cells = splitRow(line);
    if (!cells.length || !rowIsUnranked(cells, medianIdx, vsIdx)) continue;
    const name = plainToolName(cells[0]);
    const med = String(cells[medianIdx] ?? "").trim();
    let why = unrankedWhy(notes.get(name) ?? "");
    if (!why && /^skipped/i.test(med)) why = "skipped";
    if (!why && /^error/i.test(med)) why = "errored";
    if (!why) why = "unranked";
    items.push({ name, why });
  }
  if (!items.length) return "";
  if (items.every((i) => /NO LOCKFILE/i.test(i.why))) {
    const why = items[0].why.replace(/^UNRANKED — /i, "");
    return `**Not ranked** — ${why}`;
  }
  return ["**Not ranked**", "", ...items.map((i) => `- **${linkToolLabel(i.name)}**: ${i.why}`)].join("\n");
}

export function compactRssTable(headerLine, rowLines) {
  const header = splitRow(headerLine);
  const rssIdx = header.findIndex((c) => /rss/i.test(c));
  const out = ["| Tool | **Peak RSS** |", "| --- | ---: |"];
  for (const line of rowLines) {
    const cells = splitRow(line);
    if (!cells.length) continue;
    const mb = rssIdx >= 0 ? parseRssMaxMb(cells[rssIdx]) : null;
    out.push(`| ${linkToolLabel(cells[0] ?? "")} | ${mb == null ? "–" : `${mb.toFixed(1)} MB`} |`);
  }
  return out.join("\n");
}

/** Map a landing heading to TOOL_SECTIONS.id, or null. */
export function toolSectionForTitle(kind, title) {
  const t = String(title ?? "")
    .toLowerCase()
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  if (kind === "ide") return /^ide · initialize$/.test(t) ? "lsp" : null;
  if (kind !== "bench") return null;
  if (/sfc compile/.test(t)) return "compile";
  if (t === "typecheck") return "typecheck";
  if (t === "format") return "format";
  if (t === "lint") return "lint";
  if (t === "component-meta") return "component-meta";
  if (/^lsp\b/.test(t)) return "lsp";
  return null;
}

/** Map a landing heading to a memory-probe surface id. */
export function memorySurfaceForTitle(kind, title) {
  const t = String(title ?? "").toLowerCase();
  if (kind !== "bench") return null;
  if (/sfc compile/.test(t)) return "compile";
  if (t === "typecheck") return "typecheck";
  if (t === "format") return "format";
  if (t === "lint") return "lint";
  if (t === "component-meta") return "component-meta";
  if (/^lsp\b/.test(t)) return "lsp";
  return null;
}

/**
 * Split a compacted memory body (`### compile` / `### typecheck` / `### lsp`)
 * into snippets that nest under the matching speed heading as `#### Peak RSS`.
 */
export function memorySnippetsFromBody(compacted) {
  const map = {};
  for (const part of String(compacted ?? "").split(/^(?=### )/m)) {
    const m = /^### (.+)\n?/.exec(part);
    if (!m) continue;
    const key = m[1].trim().toLowerCase();
    const rest = part.replace(/^### .+\n*/, "").trim();
    if (!rest) continue;
    map[key] =
      `#### Peak RSS\n\n> Isolated from timing. Full probe (min/max/avg, CPU): [MEMORY.md](MEMORY.md).\n\n${rest}`;
  }
  return map;
}

function renderNode(node, ctx, ancestors = []) {
  const out = [];
  if (node.level > 0 && !/^(IDE operation results|Benchmark Results|Resource probe results)\b/i.test(node.title)) {
    out.push(`${"#".repeat(node.level)} ${node.title}`, "");
  }

  const table = extractFirstTable(node.lines);
  const intro = table ? node.lines.slice(0, table.start) : node.lines;
  for (const line of intro) {
    if (/^tools:$/i.test(line.trim())) break;
    if (ctx.kind === "ide" && /^\s*Files:/.test(line)) continue;
    if (table) {
      out.push(line);
    } else {
      const t = line.trim();
      if (!t || t.startsWith("Files:") || t.startsWith("Target:")) out.push(line);
    }
  }

  const toolId = toolSectionForTitle(ctx.kind, node.title);
  if (toolId && typeof ctx.toolTable === "function") {
    const tools = ctx.toolTable(toolId);
    if (tools) out.push(tools.trimEnd(), "");
  }

  if (table && table.rows.length) {
    const rankedOnly = ctx.kind === "real-world";
    const tableIsRss = /rss/i.test(table.header);
    const metric = tableIsRss ? "rss" : ctx.metric;
    const bars =
      metric === "rss"
        ? barsFromRssTable(table.header, table.rows)
        : barsFromSpeedTable(table.header, table.rows, { rankedOnly });
    const footnotes =
      rankedOnly
        ? unrankedFootnotes(
            table.header,
            table.rows,
            String(ctx.notesSource ?? node.lines.join("\n")).split("\n"),
            node.title,
          )
        : "";
    if (bars.length === 0 && metric !== "rss") {
      if (footnotes) out.push(footnotes, "");
      else if (/project (typecheck|test|build)/i.test(node.title)) {
        const tableMd = compactSpeedTable(table.header, table.sep, table.rows, { rankedOnly });
        if (tableMd) out.push(tableMd, "");
      }
    } else if (bars.length >= 1 && ctx.writeChart) {
      const unit = metric === "rss" ? "MB" : "ms";
      const title = node.title.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      const svg = barChartSvg({ title, unit, bars, lowerIsBetter: true });
      if (svg) {
        const file = `${slugify(ctx.leaf)}-${slugify(titlePath(ancestors, node) || node.title)}.svg`;
        ctx.writeChart(file, svg);
        out.push(`![${title}](${ctx.chartsHref}/${file})`, "");
      }
      if (metric === "rss") {
        out.push(compactRssTable(table.header, table.rows), "");
      } else {
        const tableMd = compactSpeedTable(table.header, table.sep, table.rows, { rankedOnly });
        if (tableMd) out.push(tableMd, "");
      }
      if (footnotes) out.push(footnotes, "");
    } else if (metric === "rss") {
      out.push(compactRssTable(table.header, table.rows), "");
    } else {
      const tableMd = compactSpeedTable(table.header, table.sep, table.rows, { rankedOnly });
      if (tableMd) out.push(tableMd, "");
      if (footnotes) out.push(footnotes, "");
    }
  }

  for (const child of node.children) {
    out.push(renderNode(child, ctx, [...ancestors, node]));
  }

  const memKey = memorySurfaceForTitle(ctx.kind, node.title);
  if (memKey && ctx.memorySnippets?.[memKey]) {
    out.push(String(ctx.memorySnippets[memKey]).trim(), "");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** True when the landing body has a chart or a ranking table, not just a heading. */
export function highlightHasRanking(body) {
  const text = String(body ?? "");
  return (
    /!\[[^\]]*]\([^)]+\)/.test(text) ||
    /\|\s*\*\*Median\*\*/.test(text) ||
    /\|\s*\*\*Warm\*\*/.test(text) ||
    /\|\s*\*\*Peak RSS\*\*/.test(text) ||
    /\*\*Not ranked\*\*/.test(text)
  );
}

/**
 * Keep the highlight tables for a section, emit a chart + compact 3-column
 * table, and drop everything else (it remains in the full report).
 */
export function compactHighlightBody(markdown, opts) {
  const {
    kind,
    leaf,
    href,
    chartsHref = "docs/results/charts",
    writeChart,
    metric = "speed",
    notesSource,
    toolTable,
    memorySnippets,
  } = opts;
  if (kind === "cache-demo" || kind === "ide-scale") {
    return `> Not a ranking table — [full report](${href}).\n`;
  }
  let tree = pruneTree(parseMarkdownSections(markdown), kind);
  if (kind === "ide" && tree) tree = orderIdeHighlightTree(tree);
  if (!tree || (tree.children.length === 0 && !extractFirstTable(tree.lines))) {
    return kind === "real-world" ? "" : `> See the [full report](${href}) for every table on this artifact.\n`;
  }
  const body = renderNode(tree, {
    leaf,
    href,
    chartsHref,
    writeChart,
    metric,
    kind,
    notesSource: notesSource ?? markdown,
    toolTable,
    memorySnippets,
  }).trim();
  if (!body || (kind === "real-world" && !highlightHasRanking(body))) return "";
  return `${body}\n`;
}

export function artifactKind(sectionId, leaf) {
  const name = String(leaf);
  if (name.includes("cache-demo") || name.includes("repeated")) return "cache-demo";
  if (name.startsWith("ide-scale")) return "ide-scale";
  if (sectionId === "benchmark") return "bench";
  if (sectionId === "ide") return "ide";
  if (sectionId === "real-world") return "real-world";
  return sectionId;
}

const ALL_PLANT_LABELS = {
  "vue-tsc": "vue-tsc",
  "vize-check": "vize",
  "verter-tsc": "verter-tsc",
  "golar-typecheck": "golar",
};

function allPlantTools(rows) {
  return (rows || [])
    .filter((r) => (r.suite === "typecheck-all" || r.caseId === "all-plants") && r.status !== "skip")
    .map((r) => {
      const d = r.detail || {};
      return {
        label: ALL_PLANT_LABELS[r.tool] || r.tool,
        ms: Number(r.ms ?? d.ms),
        rssMb: Number(r.rssMb ?? d.rssMb),
        rssToolMb: Number(r.rssToolMb ?? d.rssToolMb),
        rssEngineMb: Number(r.rssEngineMb ?? d.rssEngineMb),
        passPct: Number(d.passPct ?? r.passPct),
        pass: Number(d.pass ?? r.pass),
        scored: Number(d.scored ?? r.scored),
        skip: Number(d.skip ?? r.skip) || 0,
      };
    });
}

/**
 * Charts + compact tables for the combined all-plants typecheck
 * (one tsconfig, one spawn per tool).
 */
export function typecheckAllLanding(rows, { writeChart, chartsHref = "docs/results/charts" } = {}) {
  const tools = allPlantTools(rows);
  if (!tools.length) return "";
  const out = [];

  const wallBars = tools
    .filter((t) => Number.isFinite(t.ms))
    .map((t) => ({ label: t.label, value: t.ms, ranked: true }));
  if (wallBars.length && writeChart) {
    const file = "typecheck-all-wall.svg";
    writeChart(file, barChartSvg({ title: "All plants · wall (one tsconfig)", unit: "ms", bars: wallBars }));
    out.push(`![All plants wall](${chartsHref}/${file})`, "");
  }
  if (wallBars.length) {
    const fastest = Math.min(...wallBars.map((b) => b.value));
    out.push("| Tool | **Wall** | vs fastest |", "| --- | ---: | ---: |");
    for (const t of [...tools].sort((a, b) => (a.ms ?? Infinity) - (b.ms ?? Infinity))) {
      if (!Number.isFinite(t.ms)) continue;
      out.push(`| ${t.label} | **${formatDuration(t.ms)}** | ${(t.ms / fastest).toFixed(2)}x |`);
    }
    out.push("");
  }

  const rssTools = tools.filter((t) => Number.isFinite(t.rssMb) && t.rssMb > 0);
  const rssBars = rssTools.flatMap((t) => {
    const engine = Number.isFinite(t.rssEngineMb) && t.rssEngineMb > 0 ? t.rssEngineMb : 0;
    const tool = Number.isFinite(t.rssToolMb) && t.rssToolMb > 0 ? t.rssToolMb : t.rssMb - engine;
    if (engine > 0 && tool >= 0) {
      return [
        { label: t.label, series: "tool", value: tool, ranked: true },
        { label: t.label, series: "engine", value: engine, ranked: true },
      ];
    }
    return [{ label: t.label, value: t.rssMb, ranked: true }];
  });
  if (rssBars.length && writeChart) {
    const file = "typecheck-all-rss.svg";
    writeChart(file, barChartSvg({ title: "All plants · peak RSS (one tsconfig)", unit: "MB", bars: rssBars }));
    out.push(`![All plants peak RSS](${chartsHref}/${file})`, "");
  }
  if (rssTools.length) {
    out.push("| Tool | Tool | tsgo / tsc | **Total** |", "| --- | ---: | ---: | ---: |");
    for (const t of [...rssTools].sort((a, b) => (a.rssMb ?? Infinity) - (b.rssMb ?? Infinity))) {
      const engine = Number.isFinite(t.rssEngineMb) && t.rssEngineMb > 0 ? t.rssEngineMb : null;
      const tool =
        Number.isFinite(t.rssToolMb) && t.rssToolMb > 0
          ? t.rssToolMb
          : engine != null
            ? t.rssMb - engine
            : t.rssMb;
      const engineCell = engine != null ? `${engine.toFixed(1)} MB` : "—";
      out.push(
        `| ${t.label} | ${tool.toFixed(1)} MB | ${engineCell} | **${t.rssMb.toFixed(1)} MB** |`,
      );
    }
    out.push("");
    out.push(
      "Engine is a **child** `tsgo` / native `tsc` / `tsserver`. vue-tsc, golar, and vize host the checker **in-process** — Peak RSS is that process's high-water mark (Tool = Total, engine —).",
      "",
    );
  }

  const pctBars = tools
    .filter((t) => Number.isFinite(t.passPct))
    .map((t) => ({ label: t.label, value: t.passPct, ranked: true }));
  if (pctBars.length && writeChart) {
    const file = "typecheck-all-pass.svg";
    writeChart(
      file,
      barChartSvg({
        title: "All plants · pass rate (one tsconfig)",
        unit: "%",
        bars: pctBars,
        lowerIsBetter: false,
        maxValue: 100,
      }),
    );
    out.push(`![All plants pass rate](${chartsHref}/${file})`, "");
  }
  if (pctBars.length) {
    out.push("| Tool | **Pass rate** | pass / scored | skipped |", "| --- | ---: | ---: | ---: |");
    for (const t of [...tools].sort((a, b) => (b.passPct ?? -1) - (a.passPct ?? -1))) {
      if (!Number.isFinite(t.passPct)) continue;
      const frac =
        Number.isFinite(t.pass) && Number.isFinite(t.scored) ? `${t.pass} / ${t.scored}` : "–";
      out.push(`| ${t.label} | **${t.passPct.toFixed(0)}%** | ${frac} | ${t.skip || 0} |`);
    }
    out.push("");
    const skipped = tools.filter((t) => t.skip > 0);
    if (skipped.length) {
      const bits = skipped.map((t) => {
        const total = (t.scored || 0) + t.skip;
        return `**${t.label}** scored ${t.scored} of ${total} (${t.skip} skipped)`;
      });
      out.push(
        `${bits.join("; ")}. Skips are capability gaps, not fails — Vize does not claim \`strict-component-attrs\` (undeclared component attrs under \`strictTemplates\`).`,
      );
      out.push("");
    }
  }

  return out.join("\n").trim() + "\n";
}
