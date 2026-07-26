import { formatMs } from "./timing.mjs";

function okVariants(variants) {
  return variants.filter((v) => v.status === "ok");
}

/**
 * Primary ranking metric: median of the measured runs (all warmed).
 * There is deliberately no cold column — an unwarmed first run measures JIT
 * warmup for JS tools and nothing for native tools, which is not comparable.
 */
function primaryMs(v) {
  if (v.status !== "ok") return Number.POSITIVE_INFINITY;
  if (Number.isFinite(v.medianMs)) return v.medianMs;
  return Number.POSITIVE_INFINITY;
}

function fastestPrimary(variants) {
  const ok = okVariants(variants);
  if (ok.length === 0) return Number.NaN;
  return Math.min(...ok.map((v) => primaryMs(v)));
}

/**
 * "How many times slower than fastest" — base is the fastest median in the class.
 * Faster tool → 1.00x; slower → >1.
 */
function timesSlower(fastest, current) {
  if (!Number.isFinite(fastest) || !Number.isFinite(current) || current <= 0) {
    return "n/a";
  }
  return `${(current / fastest).toFixed(2)}x`;
}

function escapeCell(text) {
  return String(text ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

const THREADING_LABEL = {
  "1t": "Single-thread (1T)",
  batch: "Batch / multi-thread pool",
  "batch-cached": "Batch with persistent cache",
  max: "Max threads",
  workers: "Worker fan-out",
  lsp: "LSP servers",
  host: "Host API",
};

const INVOCATION_LABEL = {
  cli: "CLI subprocess",
  "in-process": "In-process API",
};

/**
 * Comparison class. Tools are only ranked against tools in the same class.
 *
 * `invocation` matters as much as threading: an in-process API amortises
 * process startup across iterations while a CLI pays it on every run
 * (measured ~85ms for one native CLI), so the two are not comparable.
 */
function classKey(v) {
  const threading = v.threading || "default";
  let base = v.invocation ? `${v.invocation}|${threading}` : threading;
  // Codegen target is part of the class too. jsx-compile carries vapor and
  // VDOM rows in one flat surface (compile separates them into cells), and
  // they share no runtime helpers — ranking them together compared three
  // different jobs in a single table.
  if (v.target) base += `|target:${v.target}`;
  // Underlying engine is part of the class as well. The typecheck surface
  // spans the JavaScript TypeScript compiler and native tsgo builds; ranking
  // those together measures the TypeScript rewrite rather than the Vue layer
  // under test, which is the comparison this surface claims to make.
  if (v.engine) base += `|engine:${v.engine}`;
  return base;
}

const ENGINE_LABEL = {
  "tsc-js": "TypeScript (JS engine)",
  tsgo: "tsgo (native engine)",
};

function classLabel(key) {
  const parts = key.split("|");
  const target = parts.find((p) => p.startsWith("target:"))?.slice("target:".length);
  const engine = parts.find((p) => p.startsWith("engine:"))?.slice("engine:".length);
  const rest = parts.filter((p) => !p.startsWith("target:") && !p.startsWith("engine:"));
  const [a, b] = rest.length > 1 ? rest : [null, rest[0]];
  const threading = THREADING_LABEL[b] ?? `Threading: ${b}`;
  const invocation = a ? `${INVOCATION_LABEL[a] ?? a} · ` : "";
  const targetLabel = target ? `${target.toUpperCase()} · ` : "";
  const engineLabel = engine ? `${ENGINE_LABEL[engine] ?? engine} · ` : "";
  return `${engineLabel}${targetLabel}${invocation}${threading} — ranked alone`;
}

/**
 * Render one ranking table for a homogeneous set of variants.
 * Primary column = median of measured runs (all warmed).
 */
function renderVariantTable(variants, { title } = {}) {
  const lines = [];
  if (title) {
    lines.push(`##### ${title}`);
    lines.push("");
  }
  const artifactLabel =
    variants.find((v) => v.artifactLabel)?.artifactLabel ?? "Artifact";
  lines.push(
    `| Tool | Status | **Median (primary)** | Min | Stddev | CV% | vs fastest | ${artifactLabel} | Throughput | Notes |`,
  );
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");

  const base = fastestPrimary(variants);
  const sorted = [...variants].sort((a, b) => primaryMs(a) - primaryMs(b));

  // Reference artifact volume for this class: the largest any tool produced.
  // A tool well below it was measured doing materially less work, so its
  // speed is not comparable no matter how carefully it was timed.
  const artifacts = okVariants(variants)
    .map((v) => v.artifactMedian)
    .filter((n) => Number.isFinite(n) && n > 0);
  const peakArtifact = artifacts.length ? Math.max(...artifacts) : Number.NaN;

  for (const v of sorted) {
    if (v.status === "ok") {
      const cacheNote = Number.isFinite(v.cacheHitsMedian) ? ` cacheHits≈${v.cacheHitsMedian}` : "";
      // Flag noisy series so a thermally-throttled or contended box is visible.
      const cv = Number.isFinite(v.cvPct) ? `${v.cvPct.toFixed(1)}%${v.cvPct > 10 ? " ⚠" : ""}` : "n/a";
      let artifact = "n/a";
      let artifactWarn = "";
      if (Number.isFinite(v.artifactMedian)) {
        artifact = v.artifactMedian.toLocaleString();
        // Only flag a low artifact where MORE genuinely means more work done
        // (e.g. emitted code bytes). For an informational census such as
        // diagnostics on a deliberately clean corpus, zero is the correct
        // answer and a "produced less" warning would be actively misleading —
        // it would scold the tools that are behaving and reward the one
        // emitting noise about its own internals.
        const moreIsWork = v.artifactPolarity !== "informational";
        if (moreIsWork && Number.isFinite(peakArtifact) && peakArtifact > 0) {
          const share = v.artifactMedian / peakArtifact;
          if (share < 0.5) {
            artifact += " ⚠";
            artifactWarn = ` | ⚠ produced ${(share * 100).toFixed(0)}% of the largest artifact in this class — speed is not comparable`;
          }
        }
      }
      lines.push(
        `| ${v.label} | ok | **${formatMs(v.medianMs)}** | ${formatMs(v.minMs)} | ${formatMs(v.stddevMs)} | ${cv} | ${timesSlower(base, v.medianMs)} | ${artifact} | ${v.throughput} | ${escapeCell((v.notes || "") + cacheNote + artifactWarn)} |`,
      );
    } else if (v.status === "unranked") {
      // Measured but failed validation: show the time in brackets so the
      // speed/correctness trade is visible, and keep it out of every
      // comparison column — it is not competing on equal terms.
      const bracketed = Number.isFinite(v.medianMs) ? `(${formatMs(v.medianMs)})` : "n/a";
      const artifact = Number.isFinite(v.artifactMedian)
        ? `(${v.artifactMedian.toLocaleString()})`
        : "n/a";
      lines.push(
        `| ${v.label} | ⚠ failed validation | ${bracketed} | ${Number.isFinite(v.minMs) ? `(${formatMs(v.minMs)})` : "n/a"} | n/a | n/a | not ranked | ${artifact} | n/a | ${escapeCell(v.notes)} |`,
      );
    } else if (v.status === "skipped") {
      lines.push(
        `| ${v.label} | skipped | n/a | n/a | n/a | n/a | n/a | n/a | n/a | ${escapeCell(v.notes)} |`,
      );
    } else {
      lines.push(
        `| ${v.label} | error | n/a | n/a | n/a | n/a | n/a | n/a | n/a | ${escapeCell(v.error || v.notes)} |`,
      );
    }
  }
  return { lines, sorted };
}

/**
 * Split variants by comparison class (invocation × threading) and render
 * separate ranked tables. Classes are never mixed in one ranking.
 */
function renderByThreadingClass(variants) {
  const lines = [];
  const byClass = new Map();
  for (const v of variants) {
    const k = classKey(v);
    if (!byClass.has(k)) byClass.set(k, []);
    byClass.get(k).push(v);
  }

  // Stable order of classes
  const order = ["1t", "batch", "max", "host", "lsp", "default", "n/a", "workers"];
  const rank = (k) => {
    const t = k.includes("|") ? k.split("|")[1] : k;
    const i = order.indexOf(t);
    return i === -1 ? order.length : i;
  };
  const keys = [...byClass.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

  const allSorted = [];
  for (const k of keys) {
    const group = byClass.get(k);
    // Only print class heading when multiple classes exist
    const { lines: tableLines, sorted } = renderVariantTable(group, {
      title: keys.length > 1 ? classLabel(k) : undefined,
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
    if ((v.status === "ok" || v.status === "unranked") && Array.isArray(v.runs)) {
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
    "Primary ranking column is the **median of measured runs**, every one taken after at least one discarded warmup pass. There is no cold column: an unwarmed first run measures JIT warmup for JS tools and nothing for native tools. Comparison classes (invocation × threading) are ranked **separately**.",
  );
  lines.push("");

  // Compile matrix (and any future grouped surface)
  if (Array.isArray(surface.groups) && surface.groups.length > 0) {
    lines.push(
      "Compile results are **grouped by target × environment × source map**, then by comparison class.",
    );
    lines.push("");

    for (const group of surface.groups) {
      lines.push(`#### ${group.label}`);
      lines.push("");
      if (group.target || group.env) {
        lines.push(
          `Target: \`${group.target ?? "?"}\` · Environment: \`${group.env ?? "?"}\` · Source map: \`${group.sourceMap ? "on" : "off"}\``,
        );
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
    if ((v.status === "ok" || v.status === "unranked") && Array.isArray(v.runs)) {
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
    "Primary ranking metric is the **median of measured runs**. Every measured run is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1).",
    "There is **no cold column**. An unwarmed first run costs a JS compiler ~3.2x its steady state and a native compiler nothing, so ranking on it measures V8 warmup rather than the tool.",
    "Min / stddev / CV% are reported per row. CV% > 10 is flagged ⚠ — treat that row as noisy (thermal drift or a contended runner), not as a result.",
    "Comparison classes (invocation × threading) are ranked in **separate tables** — an in-process API amortises process startup across runs, a CLI pays it every run.",
    "Surfaces are independent: compile ms is not comparable to jsx-compile/typecheck/lint/format ms.",
    "jsx-compile uses fixtures/jsx-N (.jsx); SFC compile uses fixtures/N (.vue).",
    "Compile matrix cells (VDOM/Vapor × production/development × sourcemap on/off) are independent.",
    "Source map is an explicit, independent dimension applied identically to every compiler — it is never folded into the production/development flag for some tools and not others.",
    "Primary compile corpus is unique file contents (fixtures/N).",
    "Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.",
    "Tool order is **rotated** on every warmup and measured run, so no tool is pinned to the expensive first slot.",
    "CI does not drop OS page cache; later tools in a job may share a warmer file cache.",
    "Typecheck/lint tools that fail a planted-bug work gate are unranked (skipped). Typecheck gates require both a script-level and a template-level diagnostic, and are re-verified against the full timed corpus.",
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
