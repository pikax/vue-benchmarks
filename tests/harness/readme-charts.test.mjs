import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  artifactKind,
  barChartSvg,
  barsFromSpeedTable,
  colorForTool,
  compactHighlightBody,
  compactSpeedTable,
  highlightHasRanking,
  memorySnippetsFromBody,
  memorySurfaceForTitle,
  parseMarkdownSections,
  parseMedianCell,
  parseRssMaxMb,
  slugify,
  TOOL_COLORS,
  toolSectionForTitle,
} from "../../scripts/lib/readme-charts.mjs";
import { extractRunMeta, formatRunMeta } from "../../scripts/update-readme.mjs";

describe("parseMedianCell", () => {
  test("ranked bold median", () => {
    assert.deepEqual(parseMedianCell("**22.8 ms**"), { ms: 22.8, ranked: true });
    assert.deepEqual(parseMedianCell("**1.09 s**"), { ms: 1090, ranked: true });
  });

  test("bracketed unranked", () => {
    const p = parseMedianCell("(57.4 ms)");
    assert.equal(p.ms, 57.4);
    assert.equal(p.ranked, false);
  });

  test("skip / error", () => {
    assert.equal(parseMedianCell("skipped"), null);
    assert.equal(parseMedianCell("error"), null);
    assert.equal(parseMedianCell("–"), null);
  });
});

describe("parseRssMaxMb", () => {
  test("takes the peak (middle) of min / max / avg", () => {
    assert.equal(parseRssMaxMb("7.33 / 79.52 / 72.29"), 79.52);
  });

  test("parses a Peak RSS cell in MB", () => {
    assert.equal(parseRssMaxMb("**32.3 MB**"), 32.3);
    assert.equal(parseRssMaxMb("(140.7 MB)"), 140.7);
  });
});

describe("compactSpeedTable", () => {
  test("keeps tool, median, vs fastest", () => {
    const header = "| Tool | **Median (primary)** | Min | vs fastest | Throughput |";
    const sep = "| --- | ---: | ---: | ---: | ---: |";
    const rows = ["| Vize | **22.8 ms** | 19.6 ms | 1.00x | 8.8k files/s |"];
    const out = compactSpeedTable(header, sep, rows);
    assert.match(out, /\*\*Median\*\*/);
    assert.match(out, /vs fastest/);
    assert.doesNotMatch(out, /Throughput/);
    assert.doesNotMatch(out, /Min/);
    assert.match(out, /22\.8 ms/);
    assert.match(out, /\[Vize\]\(https:\/\/github.com\/ubugeeei-prod\/vize\)/);
  });

  test("keeps cold and warm columns for IDE tables", () => {
    const header = "| Tool | **Cold** | vs fastest cold | **Warm** | Min | vs fastest |";
    const sep = "| --- | ---: | ---: | ---: | ---: | ---: |";
    const rows = ["| Volar (JS) | **46.4 ms** | 1.00x | **4.3 ms** | 3.9 ms | 10.7x |"];
    const out = compactSpeedTable(header, sep, rows);
    assert.match(out, /\*\*Cold\*\*/);
    assert.match(out, /vs fastest cold/);
    assert.match(out, /\*\*Warm\*\*/);
    assert.match(out, /46\.4 ms/);
    assert.match(out, /4\.3 ms/);
    assert.match(out, /1\.00x/);
    assert.doesNotMatch(out, /Min/);
  });
});

describe("barChartSvg", () => {
  test("emits a self-contained SVG with one bar per tool", () => {
    const svg = barChartSvg({
      title: "Typecheck",
      unit: "ms",
      bars: [
        { label: "verter-tsc", value: 1090, ranked: true },
        { label: "vue-tsc (JS)", value: 4850, ranked: true },
        { label: "fervid", value: 57, ranked: false },
      ],
    });
    assert.match(svg, /^<\?xml/);
    assert.match(svg, /<svg /);
    assert.match(svg, /Typecheck/);
    assert.match(svg, /verter-tsc/);
    assert.match(svg, /unranked/);
    assert.match(svg, /class="label struck"/);
    assert.ok(svg.includes(TOOL_COLORS.verter));
    assert.ok(svg.includes(TOOL_COLORS.vue));
    assert.doesNotMatch(svg, /rect width="100%"[^>]*fill="#ffffff"/);
    assert.match(svg, /prefers-color-scheme: dark/);
    assert.match(svg, /class="track"/);
  });

  test("Safari-as-img: caption and names are start-anchored with presentation fills", () => {
    const svg = barChartSvg({
      title: "Typecheck",
      unit: "ms",
      bars: [
        { label: "verter-tsc", value: 1090, ranked: true },
        { label: "Verter compileMany (session cache)", value: 2000, ranked: true },
      ],
    });
    assert.match(svg, /fill="#6b7280"[^>]*>lower is better</);
    assert.doesNotMatch(svg, /text-anchor="end"[^>]*>lower is better</);
    assert.match(svg, /x="16" y="36"[^>]*>lower is better</);
    assert.match(svg, /fill="#111827"[^>]*>verter-tsc</);
    assert.doesNotMatch(svg, /text-anchor="end"[^>]*>verter-tsc</);
    assert.match(svg, />Verter compileMany/);
  });

  test("empty bars → empty string", () => {
    assert.equal(barChartSvg({ title: "x", bars: [] }), "");
  });

  test("cold/warm stack into one bar per tool, warm first", () => {
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
    assert.match(svg, /Vize/);
    assert.match(svg, /Volar \(JS\)/);
    assert.match(svg, /class="warm"/);
    assert.match(svg, /class="cold"/);
    assert.match(svg, />warm</);
    assert.match(svg, />cold</);
    assert.equal((svg.match(/Volar \(JS\)/g) || []).length, 1);
    assert.match(svg, /1\.0 ms \/ 12\.0 ms/);
  });
});

describe("compactHighlightBody", () => {
  const bench = [
    "### SFC compile (unique contents)",
    "",
    "Files: **200** · Bytes: **285,701**",
    "",
    "#### VDOM · production · sourcemap off",
    "",
    "Target: `vdom` · Environment: `production`",
    "",
    "| Tool | **Median (primary)** | Min | vs fastest | Throughput |",
    "| --- | ---: | ---: | ---: | ---: |",
    "| Vize native batch | **22.8 ms** | 19.6 ms | 1.00x | 8.8k |",
    "| @vue/compiler-sfc 3.6 | **182.2 ms** | 179.5 ms | 7.98x | 1.1k |",
    "",
    "#### VDOM · development · sourcemap off",
    "",
    "| Tool | **Median (primary)** | Min | vs fastest | Throughput |",
    "| --- | ---: | ---: | ---: | ---: |",
    "| Vize native batch | **24.3 ms** | 18.6 ms | 1.00x | 8.2k |",
    "",
    "### Typecheck",
    "",
    "| Tool | **Median (primary)** | Min | vs fastest | Throughput |",
    "| --- | ---: | ---: | ---: | ---: |",
    "| verter-tsc | **1.09 s** | 1.07 s | 1.00x | 183 |",
    "",
    "### Format",
    "",
    "| Tool | **Median (primary)** | Min | vs fastest | Throughput |",
    "| --- | ---: | ---: | ---: | ---: |",
    "| Vize | **125.9 ms** | 120.6 ms | 1.00x | 1.6k |",
  ].join("\n");

  test("bench keeps production compile + typecheck + format, drops development", () => {
    const charts = [];
    const out = compactHighlightBody(bench, {
      kind: "bench",
      leaf: "bench-Linux-200-bench.md",
      href: "docs/results/bench-Linux-200-bench.md",
      writeChart: (file, svg) => charts.push({ file, svg }),
    });
    assert.match(out, /VDOM · production/);
    assert.doesNotMatch(out, /development/);
    assert.match(out, /### Typecheck/);
    assert.match(out, /### Format/);
    assert.match(out, /!\[/);
    assert.ok(charts.length >= 3, `expected charts, got ${charts.length}`);
    assert.ok(charts.every((c) => c.svg.includes("<svg")));
    assert.doesNotMatch(out, /Throughput/);
  });

  test("cache-demo and ide-scale collapse to a link", () => {
    const out = compactHighlightBody(bench, {
      kind: "cache-demo",
      leaf: "x.md",
      href: "docs/results/x.md",
    });
    assert.match(out, /full report/);
    assert.doesNotMatch(out, /Typecheck/);
  });

  test("ide cold/warm table becomes a stacked chart plus compact dual columns", () => {
    const charts = [];
    const md = [
      "### IDE · completion",
      "",
      "#### Completion: script member",
      "",
      "Files: **1** · Bytes: **0**",
      "",
      "| Tool | **Cold** | vs fastest cold | **Warm** | vs fastest |",
      "| --- | ---: | ---: | ---: | ---: |",
      "| Vize | **12.0 ms** | 1.00x | **1.0 ms** | 1.00x |",
      "| Volar (JS) ⚠ | (46.4 ms) | not ranked | (4.3 ms) | not ranked |",
    ].join("\n");
    const out = compactHighlightBody(md, {
      kind: "ide",
      leaf: "ide-Linux.md",
      href: "docs/results/ide-Linux.md",
      writeChart: (file, svg) => charts.push({ file, svg }),
    });
    assert.match(out, /\*\*Cold\*\*/);
    assert.match(out, /vs fastest cold/);
    assert.match(out, /\*\*Warm\*\*/);
    assert.doesNotMatch(out, /Files:/);
    assert.equal(charts.length, 1);
    assert.match(charts[0].svg, /class="warm"/);
    assert.match(charts[0].svg, /class="cold"/);
  });

  test("ide keeps only the highlight operations", () => {
    const md = [
      "### IDE · edit-loop",
      "",
      "#### Edit plants type error -> reported",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| Verter | **12.0 ms** | 1.00x |",
      "",
      "#### Folding ranges",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| Vize | **0.4 ms** | 1.00x |",
    ].join("\n");
    const out = compactHighlightBody(md, {
      kind: "ide",
      leaf: "ide-Linux.md",
      href: "docs/results/ide-Linux.md",
      writeChart: () => {},
    });
    assert.match(out, /Edit plants type error/);
    assert.doesNotMatch(out, /Folding ranges/);
  });

  test("ide highlights sort completion > template interpolation > smoke > navigation > edit-loop", () => {
    const speed = [
      "| Tool | **Cold** | vs fastest cold | **Warm** |",
      "| --- | ---: | ---: | ---: |",
      "| Vize | **12.0 ms** | 1.00x | **1.0 ms** |",
    ].join("\n");
    const md = [
      "### IDE · edit-loop",
      "",
      "#### Edit plants type error -> reported",
      "",
      speed,
      "",
      "### IDE · navigation",
      "",
      "#### Definition: imported fn (script)",
      "",
      speed,
      "",
      "### IDE · smoke",
      "",
      "#### Hover (script setup)",
      "",
      speed,
      "",
      "#### Hover (template interpolation)",
      "",
      speed,
      "",
      "### IDE · completion",
      "",
      "#### Completion: script member",
      "",
      speed,
      "",
      "### IDE · initialize",
      "",
      "#### LSP initialize",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| Verter | **38.0 ms** | 1.00x |",
    ].join("\n");
    const out = compactHighlightBody(md, {
      kind: "ide",
      leaf: "ide-Linux.md",
      href: "docs/results/ide-Linux.md",
      writeChart: () => {},
    });
    const headings = [...out.matchAll(/^### IDE · (.+)$/gm)].map((m) => m[1]);
    assert.deepEqual(headings, [
      "initialize",
      "completion",
      "template interpolation",
      "smoke",
      "navigation",
      "edit-loop",
    ]);
    assert.match(out, /### IDE · template interpolation[\s\S]*Hover \(template interpolation\)/);
    assert.doesNotMatch(
      out,
      /### IDE · smoke[\s\S]*Hover \(template interpolation\)[\s\S]*### IDE · navigation/,
    );
  });

  test("bench injects the matching tool table and Peak RSS under each surface", () => {
    const out = compactHighlightBody(bench, {
      kind: "bench",
      leaf: "bench-Linux-200-bench.md",
      href: "docs/results/bench-Linux-200-bench.md",
      writeChart: () => {},
      toolTable: (id) => (id === "typecheck" ? "| Tool | Version |\n| --- | --- |\n| vue-tsc | 3.3.10 |\n" : ""),
      memorySnippets: {
        typecheck: "#### Peak RSS\n\n| Tool | **Peak RSS** |\n| --- | ---: |\n| vue-tsc | 354.8 MB |\n",
      },
    });
    assert.match(out, /### Typecheck[\s\S]*\| Tool \| Version \|[\s\S]*vue-tsc[\s\S]*!\[Typecheck\]/);
    assert.match(out, /### Typecheck[\s\S]*#### Peak RSS[\s\S]*354\.8 MB/);
    assert.doesNotMatch(out, /### Tools/);
    const vdom = out.slice(0, out.indexOf("### Typecheck"));
    assert.doesNotMatch(vdom, /\| Tool \| Version \|/);
  });

  test("ide keeps Peak RSS under the suite that measured it", () => {
    const charts = [];
    const md = [
      "### IDE · completion",
      "",
      "#### Completion: script member",
      "",
      "| Tool | **Cold** | vs fastest cold | **Warm** |",
      "| --- | ---: | ---: | ---: |",
      "| Vize | **12.0 ms** | 1.00x | **1.0 ms** |",
      "",
      "#### Peak RSS (process tree)",
      "",
      "| Tool | **Peak RSS** |",
      "| --- | ---: |",
      "| Vize | **73.6 MB** |",
      "| Verter | **32.3 MB** |",
    ].join("\n");
    const out = compactHighlightBody(md, {
      kind: "ide",
      leaf: "ide-Linux.md",
      href: "docs/results/ide-Linux.md",
      writeChart: (file, svg) => charts.push({ file, svg }),
    });
    assert.match(out, /### IDE · completion[\s\S]*Peak RSS[\s\S]*32\.3 MB/);
    assert.ok(charts.some((c) => c.svg.includes("MB")));
  });
});

describe("toolSectionForTitle / memorySurfaceForTitle", () => {
  test("maps bench headings and leaves VDOM children unmatched", () => {
    assert.equal(toolSectionForTitle("bench", "SFC compile (unique contents)"), "compile");
    assert.equal(toolSectionForTitle("bench", "Typecheck"), "typecheck");
    assert.equal(toolSectionForTitle("bench", "LSP (editor language server)"), "lsp");
    assert.equal(toolSectionForTitle("bench", "VDOM · production · sourcemap off"), null);
    assert.equal(toolSectionForTitle("ide", "IDE · initialize"), "lsp");
    assert.equal(toolSectionForTitle("ide", "IDE · completion"), null);
    assert.equal(memorySurfaceForTitle("bench", "SFC compile (unique contents)"), "compile");
    assert.equal(memorySurfaceForTitle("bench", "Format"), "format");
    assert.equal(memorySurfaceForTitle("bench", "Lint"), "lint");
    assert.equal(memorySurfaceForTitle("bench", "Component-meta"), "component-meta");
    assert.equal(memorySurfaceForTitle("bench", "VDOM · production · sourcemap off"), null);
  });

  test("memorySnippetsFromBody nests Peak RSS under the speed heading", () => {
    const map = memorySnippetsFromBody("### typecheck\n\n![typecheck](x.svg)\n\n| Tool | **Peak RSS** |\n");
    assert.match(map.typecheck, /#### Peak RSS/);
    assert.match(map.typecheck, /MEMORY\.md/);
    assert.match(map.typecheck, /Peak RSS/);
  });
});

describe("colorForTool", () => {
  test("verter is red, official Vue is green, vize is not Vue-green", () => {
    assert.equal(colorForTool("verter-tsc"), TOOL_COLORS.verter);
    assert.equal(colorForTool("Verter compileMany (session cache)"), TOOL_COLORS.verter);
    assert.equal(colorForTool("vue-tsc (JS)"), TOOL_COLORS.vue);
    assert.equal(colorForTool("@vue/compiler-sfc 3.6 (1T)"), TOOL_COLORS.vue);
    assert.equal(colorForTool("Volar (N)"), TOOL_COLORS.vue);
    assert.equal(colorForTool("Vize native batch"), TOOL_COLORS.vize);
    assert.notEqual(TOOL_COLORS.verter, TOOL_COLORS.vue);
    assert.notEqual(TOOL_COLORS.vize, TOOL_COLORS.vue);
  });
});

describe("highlightHasRanking", () => {
  test("a heading-only project is empty", () => {
    assert.equal(highlightHasRanking("## Project typecheck\n\nFiles: **695**\n"), false);
    assert.equal(highlightHasRanking("> See the [full report](x.md)\n"), false);
  });

  test("a chart or compact table counts", () => {
    assert.equal(highlightHasRanking("![Typecheck](docs/results/charts/x.svg)\n"), true);
    assert.equal(highlightHasRanking("| Tool | **Median** |\n| --- | ---: |\n| Vize | **1 ms** |\n"), true);
  });
});

describe("compactHighlightBody real-world empty", () => {
  test("a typecheck heading with no ranking table is omitted", () => {
    const md = [
      "## Project typecheck (own tsconfig) — ant-design-vue:demos",
      "",
      "Files: **695** · Bytes: **920,155**",
      "",
    ].join("\n");
    const out = compactHighlightBody(md, {
      kind: "real-world",
      leaf: "real-world-Linux-ant-design-vue.md",
      href: "docs/results/real-world-Linux-ant-design-vue.md",
    });
    assert.equal(out, "");
  });

  test("SFC compile is omitted from the real-world landing (harness, not the project's process)", () => {
    const charts = [];
    const md = [
      "## SFC compile (⚠ 2 duplicate bodies — content-hash caches may inflate throughput)",
      "",
      "Files: **1,682** · Bytes: **1,751,750**",
      "",
      "> **Did not run — excluded from every table below.**",
      ">",
      "> - **fervid** — aborted",
      "",
      "### VDOM · production · sourcemap off",
      "",
      "Target: `vdom` · Environment: `production` · Source map: `off`",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| Vize native batch | **121.9 ms** | 1.00x |",
      "",
      "### VDOM · development · sourcemap off",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| Vize native batch | **122.0 ms** | 1.00x |",
    ].join("\n");
    const out = compactHighlightBody(md, {
      kind: "real-world",
      leaf: "real-world-Linux-naive-ui.md",
      href: "docs/results/real-world-Linux-naive-ui.md",
      writeChart: (file, svg) => charts.push({ file, svg }),
    });
    assert.doesNotMatch(out, /SFC compile/);
    assert.doesNotMatch(out, /VDOM · production/);
    assert.equal(charts.length, 0);
  });

  test("unranked project-test rows leave the table and explain underneath", () => {
    const md = [
      "## Project test suite — element-plus:components",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| element-plus — project's own toolchain (baseline) | **142.00 s** | 1.00x |",
      "| element-plus — @vizejs/vite-plugin ⚠ | (206.02 s) | not ranked |",
      "",
      "- **element-plus — @vizejs/vite-plugin ⚠**: ⚠ FAILED TEST-COUNT GATE — passed 2047 tests where the project's own toolchain passed 2533.",
    ].join("\n");
    const out = compactHighlightBody(md, {
      kind: "real-world",
      leaf: "real-world-Linux-element-plus.md",
      href: "docs/results/x.md",
      writeChart: () => {},
    });
    assert.match(out, /project's own toolchain/);
    assert.doesNotMatch(out, /206\.02 s/);
    assert.match(out, /\*\*Not ranked\*\*/);
    assert.match(out, /FAILED TEST-COUNT GATE/);
  });

  test("all-error project test still emits the compact table", () => {
    const md = [
      "## Project test suite — nuxt-ui:runtime",
      "",
      "Files: **187** · Bytes: **1,014,900**",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      "| --- | ---: | ---: |",
      "| @nuxt/ui — project's own toolchain (baseline) ❌ | error | – |",
      "| @nuxt/ui — unplugin-vue ❌ | error | – |",
    ].join("\n");
    const out = compactHighlightBody(md, {
      kind: "real-world",
      leaf: "real-world-Linux-nuxt-ui.md",
      href: "docs/results/real-world-Linux-nuxt-ui.md",
      writeChart: () => {},
    });
    assert.match(out, /Project test suite/);
    assert.match(out, /error/);
    assert.doesNotMatch(out, /!\[/);
  });
});

describe("artifactKind / slugify", () => {
  test("cache-demo and ide-scale are their own kinds", () => {
    assert.equal(artifactKind("benchmark", "bench-Linux-200-repeated-cache-demo.md"), "cache-demo");
    assert.equal(artifactKind("ide", "ide-scale-Linux.md"), "ide-scale");
    assert.equal(artifactKind("ide", "ide-Linux.md"), "ide");
  });

  test("slugify is filename-safe", () => {
    assert.equal(slugify("VDOM · production · sourcemap off"), "vdom-production-sourcemap-off");
  });
});

describe("parseMarkdownSections", () => {
  test("nests headings", () => {
    const tree = parseMarkdownSections("### A\n\n#### B\n\nhi\n");
    assert.equal(tree.children[0].title, "A");
    assert.equal(tree.children[0].children[0].title, "B");
    assert.ok(tree.children[0].children[0].lines.includes("hi"));
  });
});

describe("extractRunMeta", () => {
  test("reads date, runner and unique package versions (drops cli: dupes)", () => {
    const md = [
      "- **Generated:** 2026-08-16T09:16:08.702Z",
      "- **Runner:** Linux · linux/x64 · 4 CPUs",
      "- **Runs / warmups:** 5 / 1",
      "",
      "### Tool versions",
      "",
      "| Package | Version |",
      "| --- | --- |",
      "| vue | 3.5.41 |",
      "| vize | 0.347.7 |",
      "| cli:vize | 0.347.7 |",
    ].join("\n");
    const meta = extractRunMeta(md);
    assert.equal(meta.generated, "2026-08-16T09:16:08.702Z");
    assert.match(formatRunMeta(meta), /\*\*Date:\*\* 2026-08-16/);
    assert.match(formatRunMeta(meta), /\*\*Runner:\*\*/);
    assert.doesNotMatch(formatRunMeta(meta), /### Tool versions/);
    assert.doesNotMatch(formatRunMeta(meta), /cli:vize/);
  });
});

describe("barsFromSpeedTable", () => {
  test("emits cold and warm series from a dual column table", () => {
    const bars = barsFromSpeedTable(
      "| Tool | **Cold** | **Warm** | vs fastest |",
      [
        "| Volar (JS) ⚠ | (46.4 ms) | (4.3 ms) | not ranked |",
        "| Vize | **12.0 ms** | **1.0 ms** | 1.00x |",
      ],
    );
    assert.equal(bars.length, 4);
    assert.equal(bars[0].series, "cold");
    assert.equal(bars[1].series, "warm");
    assert.equal(bars[1].ranked, false);
    assert.equal(bars[3].ranked, true);
    assert.equal(bars[3].value, 1);
  });

  test("skips skipped rows", () => {
    const bars = barsFromSpeedTable(
      "| Tool | **Median (primary)** | vs fastest |",
      [
        "| Vize | **22.8 ms** | 1.00x |",
        "| fervid ⚠ | (57.4 ms) | not ranked |",
        "| vapor ⏭ | skipped | – |",
      ],
    );
    assert.equal(bars.length, 2);
    assert.equal(bars[0].ranked, true);
    assert.equal(bars[1].ranked, false);
  });
});
