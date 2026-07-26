import { formatMs } from "./timing.mjs";

function okVariants(variants) {
  return variants.filter((v) => v.status === "ok");
}

/** Primary ranking metric: cold first measured run. */
function primaryMs(v) {
  if (v.status !== "ok") return Number.POSITIVE_INFINITY;
  if (Number.isFinite(v.coldMs)) return v.coldMs;
  return v.overallMedianMs;
}

function fastestPrimary(variants) {
  const ok = okVariants(variants);
  if (ok.length === 0) return Number.NaN;
  return Math.min(...ok.map((v) => primaryMs(v)));
}

/**
 * "How many times slower than fastest (by cold)" — base is fastest cold.
 * Faster tool → 1.00x; slower → >1.
 */
function timesSlower(fastestCold, thisCold) {
  if (!Number.isFinite(fastestCold) || !Number.isFinite(thisCold) || thisCold <= 0) {
    return "n/a";
  }
  return `${(thisCold / fastestCold).toFixed(2)}x`;
}

function escapeCell(text) {
  return String(text ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

function threadingKey(v) {
  return v.threading || "default";
}

/**
 * Render one ranking table for a homogeneous set of variants
 * (same threading class). Primary column = cold.
 */
function renderVariantTable(variants, { title } = {}) {
  const lines = [];
  if (title) {
    lines.push(`##### ${title}`);
    lines.push("");
  }
  lines.push(
    "| Tool | Status | **Cold (primary)** | Warm median | Overall median | vs fastest (cold) | Throughput | Notes |",
  );
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |");

  const base = fastestPrimary(variants);
  const sorted = [...variants].sort((a, b) => primaryMs(a) - primaryMs(b));

  for (const v of sorted) {
    if (v.status === "ok") {
      const cacheNote = Number.isFinite(v.cacheHitsMedian) ? ` cacheHits≈${v.cacheHitsMedian}` : "";
      lines.push(
        `| ${v.label} | ok | **${formatMs(v.coldMs)}** | ${formatMs(v.warmMedianMs)} | ${formatMs(v.overallMedianMs)} | ${timesSlower(base, v.coldMs)} | ${v.throughput} | ${escapeCell((v.notes || "") + cacheNote)} |`,
      );
    } else if (v.status === "skipped") {
      lines.push(`| ${v.label} | skipped | n/a | n/a | n/a | n/a | n/a | ${escapeCell(v.notes)} |`);
    } else {
      lines.push(
        `| ${v.label} | error | n/a | n/a | n/a | n/a | n/a | ${escapeCell(v.error || v.notes)} |`,
      );
    }
  }
  return { lines, sorted };
}

/**
 * Split variants by threading class and render separate ranked tables.
 */
function renderByThreadingClass(variants) {
  const lines = [];
  const byClass = new Map();
  for (const v of variants) {
    const k = threadingKey(v);
    if (!byClass.has(k)) byClass.set(k, []);
    byClass.get(k).push(v);
  }

  // Stable order of classes
  const order = ["1t", "batch", "max", "host", "lsp", "default", "n/a", "workers"];
  const keys = [...byClass.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const allSorted = [];
  for (const k of keys) {
    const group = byClass.get(k);
    const label =
      k === "1t"
        ? "Single-thread (1T) — ranked alone"
        : k === "batch"
          ? "Batch / multi-thread pool — ranked alone"
          : k === "max"
            ? "Max threads — ranked alone"
            : k === "workers"
              ? "Worker fan-out — ranked alone"
              : k === "lsp"
                ? "LSP servers — ranked alone"
                : k === "host"
                  ? "Host API — ranked alone"
                  : `Threading: ${k}`;
    // Only print class heading when multiple classes exist
    const { lines: tableLines, sorted } = renderVariantTable(group, {
      title: keys.length > 1 ? label : undefined,
    });
    lines.push(...tableLines);
    lines.push("");
    allSorted.push(...sorted);
  }
  return { lines, sorted: allSorted };
}

function renderRawRuns(sorted) {
  const lines = [];
  lines.push("<details><summary>Raw runs</summary>");
  lines.push("");
  for (const v of sorted) {
    if (v.status === "ok" && Array.isArray(v.runs)) {
      lines.push(`- **${v.label}**: ${v.runs.map(formatMs).join(", ")}`);
    }
  }
  lines.push("");
  lines.push("</details>");
  return lines;
}

export function renderSurfaceMarkdown(surface) {
  const lines = [];
  lines.push(`### ${surface.label}`);
  lines.push("");
  lines.push(
    `Files: **${surface.files.toLocaleString()}** · Bytes: **${surface.bytes.toLocaleString()}**`,
  );
  lines.push("");
  lines.push(
    "Primary ranking column is **cold** (first measured run). Warm median is secondary. Threading classes are ranked **separately**.",
  );
  lines.push("");

  // Compile matrix (and any future grouped surface)
  if (Array.isArray(surface.groups) && surface.groups.length > 0) {
    lines.push("Compile results are **grouped by target × environment**, then by threading class.");
    lines.push("");

    for (const group of surface.groups) {
      lines.push(`#### ${group.label}`);
      lines.push("");
      if (group.target || group.env) {
        lines.push(`Target: \`${group.target ?? "?"}\` · Environment: \`${group.env ?? "?"}\``);
        lines.push("");
      }
      const { lines: tableLines, sorted } = renderByThreadingClass(group.variants);
      lines.push(...tableLines);
      lines.push(...renderRawRuns(sorted));
      lines.push("");
    }

    lines.push("<details><summary>Methodology</summary>");
    lines.push("");
    for (const note of surface.methodology ?? []) {
      lines.push(`- ${note}`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
    return lines.join("\n");
  }

  // Flat surfaces
  const { lines: tableLines, sorted } = renderByThreadingClass(surface.variants);
  lines.push(...tableLines);
  lines.push("<details><summary>Methodology</summary>");
  lines.push("");
  for (const note of surface.methodology ?? []) {
    lines.push(`- ${note}`);
  }
  lines.push("");
  lines.push("Raw runs:");
  lines.push("");
  for (const v of sorted) {
    if (v.status === "ok" && Array.isArray(v.runs)) {
      lines.push(`- **${v.label}**: ${v.runs.map(formatMs).join(", ")}`);
    }
  }
  lines.push("");
  lines.push("</details>");
  lines.push("");
  return lines.join("\n");
}

export function renderFullMarkdown(data) {
  const lines = [];
  lines.push(`## Benchmark Results`);
  lines.push("");
  lines.push(`- **Generated:** ${data.generatedAt}`);
  lines.push(`- **Fixture:** \`${data.fixture}\` (${data.fileCount} SFCs)`);
  lines.push(`- **Runs / warmups:** ${data.settings.runs} / ${data.settings.warmups}`);
  lines.push(
    `- **Runner:** ${data.runner.label} · ${data.runner.platform}/${data.runner.arch} · ${data.runner.cpuCount} CPUs · ${data.runner.cpuModel}`,
  );
  lines.push(`- **Node:** ${data.versions.node}`);
  if (data.commit?.runUrl) {
    lines.push(`- **CI run:** ${data.commit.runUrl}`);
  }
  lines.push("");
  lines.push("### Tool versions");
  lines.push("");
  lines.push("| Package | Version |");
  lines.push("| --- | --- |");
  for (const [name, version] of Object.entries(data.versions)) {
    if (name === "node") continue;
    lines.push(`| ${name} | ${version} |`);
  }
  lines.push("");
  lines.push("### Methodology notes");
  lines.push("");
  for (const note of data.methodology ?? data.fairness ?? []) {
    lines.push(`- ${note}`);
  }
  lines.push("");

  for (const surface of data.surfaces) {
    lines.push(renderSurfaceMarkdown(surface));
  }

  return `${lines.join("\n")}\n`;
}

/** Factual run parameters and corpus rules (for reports). */
export function buildMethodologyNotes() {
  return [
    "Primary ranking metric is **cold** (first measured run after warmups).",
    "Warm median is secondary; overall median includes cold + warm runs.",
    "Threading classes (1t / batch / max / host / lsp) are ranked in **separate tables** — not mixed.",
    "Surfaces are independent: compile ms is not comparable to jsx-compile/typecheck/lint/format ms.",
    "jsx-compile uses fixtures/jsx-N (.jsx); SFC compile uses fixtures/N (.vue).",
    "Compile matrix cells (VDOM/Vapor × production/development) are independent.",
    "Primary compile corpus is unique file contents (fixtures/N).",
    "Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.",
    "Measured runs alternate tool order each iteration.",
    "CI does not drop OS page cache; later tools in a job may share a warmer file cache.",
    "Typecheck/lint tools that fail a planted-bug work gate are unranked (skipped).",
    "Compile measures assert non-empty codegen where applicable.",
    "Vue official compiler is 1T only (worker_threads variants removed).",
    "LSP: Verter discovered via VERTER_LSP_BIN or sibling ../verter/target/{release,debug}/verter-lsp.",
    "verter-tsc needs stable tsgo (typescript@7.0.x via typescript-go); harness sets VERTER_TSGO_BIN.",
    "Diagnostic/format identity across tools is not required for throughput rows.",
  ];
}

/** @deprecated use buildMethodologyNotes */
export function buildFairnessNotes() {
  return buildMethodologyNotes();
}
