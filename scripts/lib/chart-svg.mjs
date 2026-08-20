/**
 * THE shared SVG bar-chart renderer. Every chart in this repository — README
 * landing blocks, docs/<group>.md pages, docs/real-world*, docs/memory.md —
 * goes through `barChartSvg`. One code path, one look, one place to fix
 * rendering quirks.
 *
 * Why every chart is a LIGHT/DARK PAIR selected by a <picture> element rather
 * than one SVG with a media query: these SVGs are loaded as <img> on GitHub,
 * where Safari does not reliably apply `@media (prefers-color-scheme: dark)`
 * INSIDE the image — the text colour silently stays wrong for one theme. The
 * theme decision therefore moves out of the SVG entirely: `barChartSvg` takes
 * an explicit `theme` and uses only fixed fills (no media queries), the
 * background stays transparent, and the embedding page picks the right file
 * with `<picture><source media="(prefers-color-scheme: dark)">`, which every
 * browser evaluates at the page level. On-bar value labels pick dark or white
 * ink from the bar colour's own luminance (theme-independent), so a light bar
 * (Prettier yellow) never carries white text.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function slugify(text) {
  const normalized = String(text)
    .toLowerCase()
    .replace(/&lt;/g, " ")
    .replace(/&gt;/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (normalized.length <= 72) return normalized;

  // Long headings can share their first 72 characters; truncating alone made
  // sibling charts overwrite each other. Keep a readable prefix plus a
  // deterministic suffix derived from the complete string.
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const suffix = (hash >>> 0).toString(36).padStart(7, "0");
  return `${normalized.slice(0, 64)}-${suffix}`;
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
    /\bvue official\b/.test(n) ||
    n.includes("vue compiler-sfc")
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

/**
 * Fixed ink colours per theme — one set for a light page, one for a dark
 * page, no media queries inside the SVG. The background stays transparent;
 * the embedding page chooses the themed file (see the module docblock).
 */
export const CHART_THEMES = {
  light: {
    label: "#1f2328",
    muted: "#59636e",
    track: "#afb8c133", // GitHub light border tone at low alpha
    grid: "#d0d7de",
    boundary: "#ffffff",
    onDarkBar: "#ffffff",
    onLightBar: "#1f2328",
  },
  dark: {
    label: "#e6edf3",
    muted: "#9198a1",
    track: "#6e768166",
    grid: "#3d444d",
    boundary: "#0d1117",
    onDarkBar: "#ffffff",
    onLightBar: "#1f2328",
  },
};

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return 0;
  const chan = (i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * chan(0) + 0.7152 * chan(2) + 0.0722 * chan(4);
}

/** Ink for text drawn ON a bar of the given colour (theme-independent). */
function inkOnBar(color, ink) {
  return luminance(color) > 0.45 ? ink.onLightBar : ink.onDarkBar;
}

function formatBarValue(value, unit) {
  if (unit === "%") return `${value.toFixed(0)}%`;
  if (unit === "MB") return `${value.toFixed(1)} MB`;
  return formatDuration(value);
}

/**
 * Collapse bar entries by label into row groups. A label may carry series:
 * warm/cold/fresh (range bar), tool/engine (stacked RSS), or a plain value.
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
        fresh: null,
        toolRss: null,
        engineRss: null,
        value: null,
      });
    }
    const g = map.get(key);
    if (b.ranked === false) g.ranked = false;
    if (b.series === "warm") g.warm = b.value;
    else if (b.series === "cold") g.cold = b.value;
    else if (b.series === "fresh") g.fresh = b.value;
    else if (b.series === "tool") g.toolRss = b.value;
    else if (b.series === "engine") g.engineRss = b.value;
    else g.value = b.value;
  }
  const groups = [...map.values()].map((g) => {
    const stackedRss = Number.isFinite(g.toolRss) && Number.isFinite(g.engineRss);
    const first = Number.isFinite(g.fresh) ? g.fresh : g.cold;
    const firstLabel = Number.isFinite(g.fresh) ? "fresh child" : "cold";
    const stacked = Number.isFinite(g.warm) && Number.isFinite(first);
    const sortValue = stackedRss
      ? g.toolRss + g.engineRss
      : stacked
        ? firstLabel === "fresh child"
          ? g.warm
          : first
        : (g.value ?? first ?? g.warm ?? 0);
    const barValue = stackedRss
      ? g.toolRss + g.engineRss
      : stacked
        ? Math.max(first, g.warm)
        : sortValue;
    return { ...g, first, firstLabel, stacked, stackedRss, sortValue, barValue };
  });
  groups.sort((a, b) => {
    if (a.ranked !== b.ranked) return a.ranked ? -1 : 1;
    return lowerIsBetter ? a.sortValue - b.sortValue : b.sortValue - a.sortValue;
  });
  return groups;
}

/** Approximate text width so labels stay inside the viewBox (Safari clips overflow). */
function fitLabel(text, maxPx, fontPx) {
  const em = fontPx * 0.62;
  const s = String(text);
  if (s.length * em <= maxPx) return s;
  const budget = Math.max(1, Math.floor((maxPx - em) / em));
  return `${s.slice(0, budget)}…`;
}

function svgText(fill, attrs, content) {
  const extra = attrs.trim() ? ` ${attrs.trim()}` : "";
  return `<text fill="${fill}"${extra}>${content}</text>`;
}

/**
 * Horizontal bar chart. Speed/RSS: lower is better. Pass rate: higher is
 * better (`lowerIsBetter: false`, axis 0–100). Unranked bars keep the tool
 * colour with a hatch overlay and a struck name.
 *
 * `bars`: [{ label, value, ranked?, series? }] — series: warm|cold|fresh for
 * a combined range bar, tool|engine for a stacked RSS bar, absent for plain.
 * `theme`: "light" | "dark" — publish both files and let the page choose.
 */
export function barChartSvg({ title, unit = "ms", bars, lowerIsBetter = true, maxValue, theme = "light" }) {
  const ink = CHART_THEMES[theme] ?? CHART_THEMES.light;
  const usable = bars.filter((b) => Number.isFinite(b.value) && b.value >= 0);
  if (usable.length === 0) return "";
  const groups = groupBars(usable, lowerIsBetter);
  const stacked = groups.some((g) => g.stacked);
  const stackedRss = groups.some((g) => g.stackedRss);

  const padL = 16;
  const nameX = 36;
  const labelW = 248;
  const rightPad = 110;
  const top = stacked || stackedRss ? 64 : 56;
  const rowH = 36;
  const barH = 22;
  const bottom = 28;
  const height = top + groups.length * rowH + bottom;
  const width = 760;
  const plotW = width - labelW - rightPad;
  const dataMax = Math.max(...groups.map((g) => g.barValue), Number.EPSILON);
  const max = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : unit === "%" ? 100 : dataMax;
  const nameMaxPx = labelW - nameX - 8;

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
      `<line x1="${x}" y1="${top - 8}" x2="${x}" y2="${plotBottom}" stroke="${ink.grid}" stroke-opacity="0.55" />`,
      svgText(
        ink.muted,
        `x="${x}" y="${height - 8}" text-anchor="middle" font-size="11"`,
        escape(formatBarValue(v, unit)),
      ),
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
    const name = fitLabel(g.label, nameMaxPx, 13);
    const unranked = g.ranked === false ? " · unranked" : "";
    const nameOpacity = g.ranked === false ? ` fill-opacity="0.62"` : "";

    let segments = "";
    let valueLabel;
    let totalW;
    if (g.stackedRss) {
      const toolW = Math.max(0, (g.toolRss / max) * plotW);
      const engineW = Math.max(0, (g.engineRss / max) * plotW);
      const totalStack = toolW + engineW;
      segments = `<rect x="${labelW}" y="${y + 5}" width="${plotW}" height="${barH}" rx="5" fill="${ink.track}"/>
      <rect x="${labelW}" y="${y + 5}" width="${Math.max(4, toolW).toFixed(1)}" height="${barH}" rx="5" fill="${fill}"/>
      <rect x="${labelW + toolW}" y="${y + 5}" width="${Math.max(g.engineRss > 0 ? 4 : 0, engineW).toFixed(1)}" height="${barH}" rx="5" fill="${fill}" fill-opacity="0.38"/>`;
      valueLabel =
        g.engineRss > 0
          ? `${formatBarValue(g.toolRss, unit)} + ${formatBarValue(g.engineRss, unit)} = ${formatBarValue(g.barValue, unit)}${unranked}`
          : `${formatBarValue(g.barValue, unit)}${unranked}`;
      totalW = Math.max(4, totalStack);
    } else if (g.stacked) {
      const warmW = Math.max(4, (g.warm / max) * plotW);
      const firstW = Math.max(4, (g.first / max) * plotW);
      const warmIsLonger = g.warm >= g.first;
      const longW = warmIsLonger ? warmW : firstW;
      const shortW = warmIsLonger ? firstW : warmW;
      const longOpacity = warmIsLonger ? "1" : "0.38";
      const shortOpacity = warmIsLonger ? "0.38" : "1";
      // One combined range bar: the full rectangle ends at the slower value;
      // the overlaid rectangle ends at the faster value. This preserves both
      // directions (including first < warm) without adding the measurements.
      segments = `<rect x="${labelW}" y="${y + 5}" width="${plotW}" height="${barH}" rx="5" fill="${ink.track}"/>
      <rect x="${labelW}" y="${y + 5}" width="${longW.toFixed(1)}" height="${barH}" rx="5" fill="${fill}" fill-opacity="${longOpacity}"/>
      <rect x="${labelW}" y="${y + 5}" width="${shortW.toFixed(1)}" height="${barH}" rx="5" fill="${fill}" fill-opacity="${shortOpacity}"/>
      <line x1="${labelW + shortW}" y1="${y + 4}" x2="${labelW + shortW}" y2="${y + 28}" stroke="${ink.boundary}" stroke-width="2" stroke-opacity="0.9"/>`;
      valueLabel = `${formatBarValue(g.warm, unit)} warm / ${formatBarValue(g.first, unit)} ${g.firstLabel}${unranked}`;
      totalW = longW;
    } else {
      totalW = Math.max(4, (g.barValue / max) * plotW);
      segments = `<rect x="${labelW}" y="${y + 5}" width="${plotW}" height="${barH}" rx="5" fill="${ink.track}"/>
      <rect x="${labelW}" y="${y + 5}" width="${totalW.toFixed(1)}" height="${barH}" rx="5" fill="${fill}"/>`;
      valueLabel = formatBarValue(g.barValue, unit) + unranked;
    }
    const valueInside = totalW > 96;
    const valueEl = valueInside
      ? svgText(
          inkOnBar(color, ink),
          `x="${labelW + 8}" y="${y + 21}" font-size="12" font-weight="600"`,
          escape(valueLabel),
        )
      : svgText(
          ink.label,
          `x="${labelW + totalW + 8}" y="${y + 21}" font-size="12" font-weight="600"`,
          escape(valueLabel),
        );
    const strike =
      g.ranked === false
        ? `<line x1="${nameX}" y1="${y + 16}" x2="${labelW - 8}" y2="${y + 16}" stroke="${ink.label}" stroke-opacity="0.45" />`
        : "";
    return `${svgText(ink.muted, `x="${padL}" y="${y + 21}" font-size="11"`, String(i + 1))}
      ${svgText(ink.label, `x="${nameX}" y="${y + 21}" font-size="13"${nameOpacity}`, escape(name))}
      ${strike}
      ${segments}
      ${valueEl}`;
  });

  const legendY = 42;
  const legend = stackedRss
    ? `<rect x="${padL + 130}" y="${legendY - 9}" width="10" height="10" rx="2" fill="${ink.label}"/>
  ${svgText(ink.muted, `x="${padL + 144}" y="${legendY}" font-size="11"`, "tool")}
  <rect x="${padL + 178}" y="${legendY - 9}" width="10" height="10" rx="2" fill="${ink.label}" fill-opacity="0.38"/>
  ${svgText(ink.muted, `x="${padL + 192}" y="${legendY}" font-size="11"`, "tsgo / tsc")}`
    : stacked
      ? `<rect x="${padL + 130}" y="${legendY - 9}" width="10" height="10" rx="2" fill="${ink.label}"/>
  ${svgText(ink.muted, `x="${padL + 144}" y="${legendY}" font-size="11"`, "warm")}
  <rect x="${padL + 188}" y="${legendY - 9}" width="10" height="10" rx="2" fill="${ink.label}" fill-opacity="0.38"/>
  ${svgText(ink.muted, `x="${padL + 202}" y="${legendY}" font-size="11"`, groups.find((g) => g.stacked)?.firstLabel ?? "first")}`
      : "";

  const better = lowerIsBetter ? "lower is better" : "higher is better";
  const chartTitle = fitLabel(title, width - padL * 2, 15);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(title)}">
  <title>${escape(title)} (${better})</title>
  <style><![CDATA[
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
  ]]></style>
  ${hatches.length ? `<defs>${hatches.join("")}</defs>` : ""}
  ${svgText(ink.label, `x="${padL}" y="20" font-size="15" font-weight="600"`, escape(chartTitle))}
  ${svgText(ink.muted, `x="${padL}" y="36" font-size="11"`, escape(better))}
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
