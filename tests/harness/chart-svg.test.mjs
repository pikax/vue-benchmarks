/**
 * The ONE shared chart renderer. Every chart in the repo goes through
 * barChartSvg, so its contract is tested once, here.
 *
 * The Safari contract is the load-bearing part: these SVGs are loaded as
 * <img> on GitHub, where Safari does not reliably apply
 * `prefers-color-scheme` media queries INSIDE the image. The theme decision
 * therefore lives outside the SVG: `barChartSvg` renders one explicit theme
 * with fixed fills and a transparent background, and the pages embed the
 * light/dark pair through a page-level <picture> element.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  barChartSvg,
  CHART_THEMES,
  colorForTool,
  slugify,
  TOOL_COLORS,
} from "../../scripts/lib/chart-svg.mjs";

describe("barChartSvg — Safari-safe rendering", () => {
  const svg = barChartSvg({
    title: "Typecheck",
    unit: "ms",
    bars: [
      { label: "verter-tsc", value: 1090, ranked: true },
      { label: "vue-tsc (JS)", value: 4850, ranked: true },
      { label: "fervid", value: 57, ranked: false },
    ],
  });

  test("emits a self-contained SVG with one bar per tool", () => {
    assert.match(svg, /^<\?xml/);
    assert.match(svg, /<svg /);
    assert.match(svg, /Typecheck/);
    assert.match(svg, /verter-tsc/);
    assert.ok(svg.includes(TOOL_COLORS.verter));
    assert.ok(svg.includes(TOOL_COLORS.vue));
  });

  test("no media queries: the same pixels render in every browser and theme", () => {
    assert.doesNotMatch(svg, /prefers-color-scheme/);
    assert.doesNotMatch(svg, /@media/);
  });

  test("transparent background, every text with an explicit fill", () => {
    // No painted card — the pair of themed files handles the page background.
    assert.doesNotMatch(svg, /fill="#ffffff" stroke="#d0d7de"/);
    for (const m of svg.matchAll(/<text[^>]*>/g)) {
      assert.match(m[0], /fill="#/, `text without explicit fill: ${m[0]}`);
    }
  });

  test("the dark theme renders dark-page inks with the same tool colours", () => {
    const dark = barChartSvg({
      title: "Typecheck",
      unit: "ms",
      bars: [{ label: "verter-tsc", value: 1090, ranked: true }],
      theme: "dark",
    });
    assert.ok(dark.includes(CHART_THEMES.dark.label));
    assert.ok(dark.includes(CHART_THEMES.dark.muted));
    assert.ok(!dark.includes(`fill="${CHART_THEMES.light.label}" x=`), "no light label ink");
    assert.ok(dark.includes(TOOL_COLORS.verter), "tool colour is theme-stable");
    assert.doesNotMatch(dark, /prefers-color-scheme/);
  });

  test("unranked bars keep the tool colour hatched, name struck, label says so", () => {
    assert.match(svg, /<pattern id="hatch-/);
    assert.match(svg, /url\(#hatch-/);
    assert.match(svg, /unranked/);
    assert.match(svg, /fill-opacity="0\.62"/);
  });

  test("empty bars → empty string", () => {
    assert.equal(barChartSvg({ title: "x", bars: [] }), "");
  });
});

describe("barChartSvg — on-bar label ink follows bar luminance", () => {
  test("white ink on a dark bar, dark ink on a light bar", () => {
    // Long bars so both value labels render ON the bar.
    const dark = barChartSvg({
      title: "t",
      bars: [{ label: "eslint-plugin-vue", value: 100, ranked: true }],
    });
    assert.match(dark, /fill="#ffffff"[^>]*font-weight="600"/);
    const light = barChartSvg({
      title: "t",
      bars: [{ label: "@vue/babel-plugin-jsx", value: 100, ranked: true }],
    });
    assert.match(light, /fill="#1f2328"[^>]*font-weight="600"/);
    assert.doesNotMatch(light, /fill="#ffffff"[^>]*font-weight="600"/);
  });
});

describe("barChartSvg — cold/warm range bar", () => {
  test("one combined bar per tool with both endpoints in the label", () => {
    const svg = barChartSvg({
      title: "Completion",
      unit: "ms",
      bars: [
        { label: "Volar (JS)", series: "cold", value: 46, ranked: false },
        { label: "Volar (JS)", series: "warm", value: 4.3, ranked: false },
        { label: "Vize", series: "cold", value: 12, ranked: true },
        { label: "Vize", series: "warm", value: 1, ranked: true },
      ],
    });
    assert.equal((svg.match(/Volar \(JS\)/g) || []).length, 1);
    assert.match(svg, /1\.0 ms warm \/ 12\.0 ms cold/);
    assert.match(svg, />warm</);
    assert.match(svg, />cold</);
    // The boundary between the two series is drawn, not implied.
    assert.match(svg, /stroke-width="2" stroke-opacity="0\.9"/);
  });

  test("fresh child faster than warm still renders both directions", () => {
    const svg = barChartSvg({
      title: "Compiler",
      bars: [
        { label: "Vue", series: "fresh", value: 20, ranked: true },
        { label: "Vue", series: "warm", value: 30, ranked: true },
      ],
    });
    assert.match(svg, /30\.0 ms warm \/ 20\.0 ms fresh child/);
    assert.match(svg, />fresh child</);
  });
});

describe("colorForTool", () => {
  test("verter is red, official Vue is green, vize is not Vue-green", () => {
    assert.equal(colorForTool("verter-tsc"), TOOL_COLORS.verter);
    assert.equal(
      colorForTool("Verter compileMany (warm-host stateless re-render)"),
      TOOL_COLORS.verter,
    );
    assert.equal(colorForTool("vue-tsc (JS)"), TOOL_COLORS.vue);
    assert.equal(colorForTool("@vue/compiler-sfc 3.6 (1T)"), TOOL_COLORS.vue);
    assert.equal(colorForTool("Volar (N)"), TOOL_COLORS.vue);
    assert.equal(colorForTool("Vize native batch"), TOOL_COLORS.vize);
    assert.notEqual(TOOL_COLORS.verter, TOOL_COLORS.vue);
    assert.notEqual(TOOL_COLORS.vize, TOOL_COLORS.vue);
  });
});

describe("slugify", () => {
  test("is filename-safe", () => {
    assert.equal(slugify("VDOM · production · sourcemap off"), "vdom-production-sourcemap-off");
  });

  test("keeps long comparison-class chart paths collision-free", () => {
    const prefix = "Benchmark Results › Compiler › VDOM · production · sourcemap off › ";
    const raw = slugify(`${prefix}Raw SFC compilation — identical changed inputs`);
    const style = slugify(`${prefix}SFC compilation with CSS — every block changed`);
    assert.notEqual(raw, style);
    assert.ok(raw.length <= 72);
    assert.ok(style.length <= 72);
  });
});
