/**
 * README landing blocks: one compact section per main group (chart + Tool /
 * Median / vs fastest / Peak RSS table + link to the full docs page), plus a
 * short real-world summary. Everything else lives under docs/.
 */

import { GROUPS, confirmForGroup, runMetaLines } from "./data.mjs";
import {
  barsFromVariants,
  benchSourcesForGroup,
  compactTable,
  emitChart,
  escapeLooseHtml,
  localRunBanner,
  typecheckAllLanding,
  variantClasses,
} from "./render.mjs";
import { writeChart } from "../chart-svg.mjs";
import { npmUrl, urlFor } from "../tool-catalog.mjs";
import { buildTypingLoopSurface } from "../ide-report.mjs";

export const MARKERS = {
  index: ["<!-- RESULTS_INDEX_START -->", "<!-- RESULTS_INDEX_END -->"],
  what: ["<!-- WHAT_IS_COMPARED_START -->", "<!-- WHAT_IS_COMPARED_END -->"],
  runMeta: ["<!-- RUN_META_START -->", "<!-- RUN_META_END -->"],
  bench: ["<!-- BENCHMARK_RESULTS_START -->", "<!-- BENCHMARK_RESULTS_END -->"],
  realWorld: ["<!-- REAL_WORLD_RESULTS_START -->", "<!-- REAL_WORLD_RESULTS_END -->"],
};

const today = () => new Date().toISOString().slice(0, 10);

function spliceBetween(readme, [start, end], body) {
  if (!readme.includes(start) || !readme.includes(end)) return readme;
  // Escape stray HTML-ish tags in notes (an unclosed <script> swallows the
  // page in HTML-aware renderers). Replacer FUNCTION, not a string: a
  // replacement string interprets `$&` and friends, so table content could
  // splice the old section back in.
  const safe = escapeLooseHtml(body.trim());
  return readme.replace(
    new RegExp(`${start}[\\s\\S]*?${end}`),
    () => `${start}\n\n${safe}\n\n${end}`,
  );
}

/** Production, sourcemap-off compile groups — the headline comparison. */
function headlineCompileGroups(surface) {
  return (surface?.groups ?? []).filter(
    (g) => g.metric !== "rss" && g.env === "production" && !g.sourceMap,
  );
}

function groupSection(group, model, { chartsDir }) {
  const { ide } = model;
  // h3: the blocks sit inside the skeleton's `## Results` section.
  const lines = [`### ${group.title}`, ""];
  const docHref = group.doc;
  // The landing shows the NEWEST source per surface — a `-current` study
  // outranks an older published snapshot, with its local-run banner.
  const sources = benchSourcesForGroup(group, model);
  const surfaces = [];
  for (const id of group.benchSurfaces) {
    for (const entry of sources) {
      const surface = (entry.data.surfaces ?? []).find((s) => s.id === id);
      if (surface) {
        surfaces.push({ surface, entry });
        break;
      }
    }
  }
  if (!surfaces.length) return "";

  lines.push(`> 📄 **[Full results →](${docHref})** — every table, per-row notes, raw runs, validation plants and the isolated memory probe.`, "");

  const bannered = new Set();
  for (const { surface, entry } of surfaces) {
    if (entry.local && !bannered.has(entry.name)) {
      bannered.add(entry.name);
      lines.push(localRunBanner(entry), "");
    }
    if (surface.id === "compile") {
      for (const g of headlineCompileGroups(surface)) {
        // Comparison classes never share a chart or a ranking. The
        // "Official render pipeline" context class stays on the full page.
        for (const cls of variantClasses(g.variants)) {
          if (/^official render pipeline/i.test(cls.label)) continue;
          const bars = barsFromVariants(cls.variants);
          if (!bars.length) continue;
          const title = cls.label
            ? `Compiler — ${g.label} — ${cls.label}`
            : `Compiler — ${g.label}`;
          const img = emitChart({
            title,
            bars,
            chartsDir,
            chartsHref: "docs/charts",
            fileBase: `readme-compiler-${g.label}${cls.label ? `-${cls.label}` : ""}`,
          });
          if (img) lines.push(img, "");
          const table = compactTable(cls.variants, { docHref });
          if (table) lines.push(table, "");
        }
      }
      lines.push(
        "Development builds, sourcemap cells, the single-file size ladder and the repeated-input study: [full results](docs/compiler.md).",
        "",
      );
      continue;
    }
    if (surface.id === "jsx-compile") {
      lines.push(`JSX compile (vue-jsx-vapor vs Babel) is ranked per codegen target on the [Compiler page](${docHref}).`, "");
      continue;
    }
    for (const cls of variantClasses(surface.variants)) {
      const bars = barsFromVariants(cls.variants);
      if (bars.length) {
        const img = emitChart({
          title: cls.label ? `${surface.label} — ${cls.label}` : surface.label,
          bars,
          chartsDir,
          chartsHref: "docs/charts",
          fileBase: `readme-${group.id}-${surface.id}${cls.label ? `-${cls.label}` : ""}`,
        });
        if (img) lines.push(img, "");
      }
      const table = compactTable(cls.variants, { docHref });
      if (table) lines.push(table, "");
    }
  }

  if (group.id === "typecheck") {
    const { rows } = confirmForGroup(model, group);
    const landing = typecheckAllLanding(rows, {
      chartsHref: "docs/charts",
      writeChart: (file, svg) => writeChart(chartsDir, file, svg),
    });
    if (landing.trim()) {
      // README reuses the SVGs the docs page writes; no second chart write.
      lines.push("**Correctness (plant suite, one tsconfig):**", "", landing.trim(), "");
    }
  }

  if (group.includesIde && ide?.data?.results?.length) {
    const loop = buildTypingLoopSurface(ide.data.results);
    const loopVariants = loop?.variants ?? [];
    const bars = barsFromVariants(loopVariants);
    if (bars.length) {
      const img = emitChart({
        title: "IDE typing loop (edit → diagnostic + hover + completion)",
        bars,
        chartsDir,
        chartsHref: "docs/charts",
        fileBase: "readme-lsp-typing-loop",
      });
      if (img) lines.push(img, "");
      const table = compactTable(loopVariants, { docHref });
      if (table) lines.push(table, "");
    }
    lines.push(
      `Per-operation IDE latency (initialize, completion, hover, navigation, edit loop — Cold and Warm) is ranked on the [LSP page](${docHref}).`,
      "",
    );
  }

  return lines.join("\n");
}

export function renderBenchBlock(model, { chartsDir }) {
  const { bench } = model;
  const lines = [
    `> Generated ${today()} from the latest published **Linux** JSON snapshot in \`results/benchmarks/\`. Numbers are reference-only; re-run on your hardware for local relevance.`,
    `> Median of measured runs; **Peak RSS** column: memory for the same row (timed session where sampled there, isolated probe otherwise). ⚠ failed a validation gate (bracketed, unranked). How to read: [docs/how-to-read.md](docs/how-to-read.md).`,
    "",
  ];
  for (const group of GROUPS) {
    const section = groupSection(group, model, { chartsDir });
    if (section) lines.push(section);
  }
  return lines.join("\n");
}

export function renderRealWorldBlock(model) {
  const { realWorld } = model;
  if (!realWorld.length) return "";
  const lines = [
    `> Auto-updated ${today()} from the **Benchmark (real-world)** workflow — pinned checkouts of third-party Vue projects, each project's **own** test / build / typecheck. Ranked **within** a corpus, never across.`,
    "",
    `📄 **[Main numbers with charts → docs/real-world.md](docs/real-world.md)** · full per-project reports:`,
    "",
    realWorld.map((e) => `[${e.project}](docs/real-world/${e.project}.md)`).join(" · "),
    "",
  ];
  return lines.join("\n");
}

function surfaceVariantLists(surface) {
  return [surface?.variants ?? [], ...(surface?.groups ?? []).map((g) => g.variants ?? [])];
}

function packagesForGroup(group, model) {
  const seen = new Set();
  const out = [];
  const surfaces = (model.bench?.data?.surfaces ?? []).filter((s) =>
    group.benchSurfaces.includes(s.id),
  );
  for (const s of surfaces) {
    for (const list of surfaceVariantLists(s)) {
      for (const v of list) {
        if (!v.package || seen.has(v.package)) continue;
        seen.add(v.package);
        out.push(v.package);
      }
    }
  }
  return out;
}

function pkgLink(pkg) {
  const url = urlFor(pkg) || npmUrl(pkg);
  return url ? `[\`${pkg}\`](${url})` : `\`${pkg}\``;
}

/**
 * The "What is compared" table — generated from the published run's own
 * variant packages, so the tool list cannot drift from what actually ran.
 */
export function renderWhatBlock(model) {
  const lines = [
    "| Group | Measured in the published run |",
    "| --- | --- |",
  ];
  for (const group of GROUPS) {
    const pkgs = packagesForGroup(group, model);
    if (!pkgs.length) continue;
    lines.push(`| **[${group.title}](${group.doc})** | ${pkgs.map(pkgLink).join(" · ")} |`);
  }
  const rw = model.realWorld;
  if (rw.length) {
    const swaps = new Set();
    const bundlers = new Set();
    for (const e of rw) {
      for (const s of e.data.surfaces ?? []) {
        if (/^project-(test|build)$/.test(s.id)) {
          for (const v of s.variants ?? []) {
            const m = /—\s*(.+)$/.exec(String(v.label ?? ""));
            if (m && !/baseline|own toolchain/i.test(m[1])) swaps.add(m[1].trim());
          }
        }
        if (s.id === "bundle" || s.id === "hmr") {
          for (const list of surfaceVariantLists(s)) {
            for (const v of list) if (v.package) bundlers.add(v.package);
          }
        }
      }
    }
    const swapCell = [...swaps].map((x) => `\`${x}\``).join(" · ");
    const bundlerCell = [...bundlers].map(pkgLink).join(" · ");
    lines.push(
      `| **[Real-world projects](docs/real-world.md)** | ${rw.length} pinned checkouts — each project's own test / build / typecheck vs plugin swaps${swapCell ? ` (${swapCell})` : ""}${bundlerCell ? `; bundle / HMR across ${bundlerCell}` : ""} |`,
    );
  }
  lines.push(
    "| **[Memory](docs/memory.md)** | same tools, isolated resource probe — plus the **Peak RSS** column on every timing table |",
  );
  return lines.join("\n");
}

export function renderRunMetaBlock(model) {
  const data = model.bench?.data;
  if (!data) return "";
  return ["## This run", "", ...runMetaLines(data, {}), ""].join("\n");
}

export function renderIndexBlock(model) {
  const lines = [
    "**Results index** — compact charts below; every group links its full page under [`docs/`](docs/):",
    "",
  ];
  for (const group of GROUPS) {
    lines.push(`- **[${group.title}](#${group.title.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "")})** — [${group.doc}](${group.doc})`);
  }
  lines.push("- **[Real-world projects](#real-world-projects)** — [docs/real-world.md](docs/real-world.md)");
  lines.push("- **Memory** — [docs/memory.md](docs/memory.md)");
  lines.push("- **Methodology** — [docs/methodology.md](docs/methodology.md) · [docs/how-to-read.md](docs/how-to-read.md)");
  return lines.join("\n");
}

export function updateReadme(readme, model, { chartsDir }) {
  let out = readme;
  if (model.bench?.data) {
    out = spliceBetween(out, MARKERS.bench, renderBenchBlock(model, { chartsDir }));
    out = spliceBetween(out, MARKERS.runMeta, renderRunMetaBlock(model));
    out = spliceBetween(out, MARKERS.what, renderWhatBlock(model));
  } else {
    console.log("[readme] no publishable bench JSON — benchmark section LEFT UNTOUCHED");
  }
  if (model.realWorld.length) {
    out = spliceBetween(out, MARKERS.realWorld, renderRealWorldBlock(model));
  } else {
    console.log("[readme] no real-world JSON — real-world section LEFT UNTOUCHED");
  }
  out = spliceBetween(out, MARKERS.index, renderIndexBlock(model));
  return out;
}
