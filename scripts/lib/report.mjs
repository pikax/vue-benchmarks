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


/**
 * Display names are SLIMMED at render time, not in the surface definitions,
 * so previously-written result JSON re-renders with the same names as a fresh
 * run. The stripped identity is restored in the per-surface "Tools" legend —
 * the table trades detail for scanability, the legend holds the detail.
 *
 * `desc` is what the tool actually runs — shown once per surface above the
 * tables instead of being repeated in every row's Notes.
 */
const SLIM_RULES = [
  {
    re: /^Volar \(@vue\/language-server\)$/,
    slim: "Volar",
    desc: "@vue/language-server v3 hybrid pair — the Vue server plus typescript-language-server with @vue/typescript-plugin; both processes are measured and the slower half is charged.",
  },
  {
    re: /^Volar \(TNB.*\)$/,
    slim: "Volar (N)",
    desc: "the same Volar pair with its TypeScript half on typescript-native-bridge (tsgo) — same Vue layer, native engine.",
  },
  {
    re: /^Vize LSP.*$/,
    slim: "Vize",
    desc: "vize lsp --stdio from the npm package (native standalone server when found, Node entry otherwise — the row's notes say which). Runs its own bundled tsgo (Corsa).",
  },
  {
    re: /^Verter LSP.*$/,
    slim: "Verter",
    desc: "verter-lsp — the native server from the published npm package (version in the notes). Runs stable tsgo.",
  },
  {
    re: /^vue-tsc \(TNB.*\)$/,
    slim: "vue-tsc (N)",
    desc: "the same vue-tsc with typescript aliased to typescript-native-bridge (tsgo) — same Vue layer, native engine.",
  },
  {
    re: /^Vize check$/,
    slim: "Vize",
    desc: "vize check --tsconfig tsconfig.json (native, Corsa when available).",
  },
  {
    re: /^Vize fmt$/,
    slim: "Vize",
    desc: "vize fmt --write.",
  },
  {
    re: /^Golar default \(lint\+typecheck\)$/,
    slim: "Golar (lint+check)",
    desc: "golar default mode — lint then typecheck in one pass, not a pure typecheck.",
  },
  // desc-only entries (name unchanged) so a surface's legend covers every row,
  // not just the renamed ones.
  {
    re: /^vue-tsc$/,
    slim: "vue-tsc",
    desc: "the official Vue Language Tools CLI — vue-tsc --noEmit -p tsconfig.json, stock JavaScript TypeScript engine.",
  },
  {
    re: /^verter-tsc$/,
    slim: "verter-tsc",
    desc: "verter-tsc --noEmit -p tsconfig.json from the published npm package; runs stable tsgo.",
  },
  {
    re: /^Golar typecheck$/,
    slim: "Golar typecheck",
    desc: "golar typecheck — typescript-go with the @golar/vue plugin, pure typecheck.",
  },
  {
    re: /^Prettier$/,
    slim: "Prettier",
    desc: "prettier --write over a fresh corpus copy; built-in Vue SFC support, single-threaded by design.",
  },
  {
    re: /^Oxfmt$/,
    slim: "Oxfmt",
    desc: "oxfmt --write — Oxc's Vue-capable formatter, multi-threaded.",
  },
  {
    re: /^Biome format$/,
    slim: "Biome format",
    desc: "biome format --write — multi-threaded, but formats the <script> block only; template and style come back byte-identical, so it is unranked on the format surface.",
  },
  // Two rules, not one `/^Biome lint/`: `slim` REPLACES the label everywhere it
  // is rendered, so a shared rule collapsed the 1T and max-threads rows into two
  // identically-named lines in the table, notes and raw runs.
  {
    re: /^Biome lint \(1T\)$/,
    slim: "Biome lint (1T)",
    desc: "biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.",
  },
  {
    re: /^Biome lint \(max threads\)$/,
    slim: "Biome lint (max threads)",
    desc: "biome lint on all cores — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.",
  },
  // Same two-rule split as Biome above — one shared /^Oxlint/ rule would rename
  // both rows to the same string in the table, notes and raw runs.
  {
    re: /^Oxlint \(1T\)$/,
    slim: "Oxlint (1T)",
    desc: "oxlint --threads=1 with its vue plugin enabled — script block only. The plugin's 31 Vue rules all read <script>; <template> is never parsed, so the planted vue/no-v-html is missed; unranked.",
  },
  {
    re: /^Oxlint \(max threads\)$/,
    slim: "Oxlint (max threads)",
    desc: "oxlint on all cores with its vue plugin enabled — script block only, misses the planted vue/no-v-html; unranked.",
  },
];

function slimRuleFor(rawLabel) {
  return SLIM_RULES.find((r) => r.re.test(String(rawLabel ?? "")));
}

/**
 * Engine tag on the NAME, not a table split. JS-engine rows are marked (JS);
 * native (tsgo) rows are unmarked. The engines share one table — the tag plus
 * the legend carry the caveat that a cross-engine ratio measures TypeScript's
 * rewrite as much as the Vue layer.
 */
function engineTag(v) {
  return v.engine === "tsc-js" ? " (JS)" : "";
}

/** Marker appended to the name instead of a Status column. */
function statusMark(status) {
  if (status === "unranked") return " ⚠";
  if (status === "error") return " ❌";
  if (status === "skipped") return " ⏭";
  return "";
}

/** Table display name: slimmed label + engine tag + status marker. */
function displayName(v) {
  const rule = slimRuleFor(v.label);
  return `${rule ? rule.slim : v.label}${engineTag(v)}${statusMark(v.status)}`;
}

/**
 * Comparison class — reduced to the codegen target only; see classKey.
 */
function classKey(v) {
  // ONE table per surface. Engine, invocation and threading are deliberately
  // NOT table splits any more — JS-engine rows are tagged (JS) on the name,
  // and the invocation/threading identity of a row lives in its label, the
  // Tools legend and its notes entry. The caveats those splits used to carry
  // (a CLI pays startup every run, a thread pool is not a single thread)
  // moved to the methodology notes; the reader compares like with like by
  // reading the row, not by which table it landed in.
  //
  // Codegen target is the one split that stays. jsx-compile carries vapor and
  // VDOM rows in one flat surface (compile separates them into cells), and
  // they share no runtime helpers — those are different jobs, not the same
  // job invoked differently.
  return v.target ? `target:${v.target}` : "all";
}

function classLabel(key) {
  const target = key.startsWith("target:") ? key.slice("target:".length) : null;
  return target ? `${target.toUpperCase()} — ranked alone` : "";
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
    `| Tool | **Median (primary)** | Min | Stddev | CV% | vs fastest | ${artifactLabel} | Throughput |`,
  );
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");

  const base = fastestPrimary(variants);
  const sorted = [...variants].sort((a, b) => primaryMs(a) - primaryMs(b));

  // Reference artifact volume for this class: the largest any tool produced.
  // A tool well below it was measured doing materially less work, so its
  // speed is not comparable no matter how carefully it was timed.
  const artifacts = okVariants(variants)
    .map((v) => v.artifactMedian)
    .filter((n) => Number.isFinite(n) && n > 0);
  const peakArtifact = artifacts.length ? Math.max(...artifacts) : Number.NaN;

  // Status lives on the name (⚠ unranked, ❌ error, ⏭ skipped) and per-row
  // detail lives in the Notes collapsible below the table — cells that cannot
  // apply to a row print "–" rather than a wall of n/a.
  const noteRows = [];
  for (const v of sorted) {
    const name = displayName(v);
    let noteText = v.notes || "";
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
      if (Number.isFinite(v.medianMs)) {
        lines.push(
          `| ${name} | **${formatMs(v.medianMs)}** | ${formatMs(v.minMs)} | ${formatMs(v.stddevMs)} | ${cv} | ${timesSlower(base, v.medianMs)} | ${artifact} | ${v.throughput} |`,
        );
      } else {
        // An ok row with no duration is a ratio or informational row — its
        // value sits in the artifact column (or the notes), never in a
        // fabricated time.
        const throughput = v.throughput && v.throughput !== "n/a" ? v.throughput : "–";
        lines.push(`| ${name} | – | – | – | – | – | ${artifact} | ${throughput} |`);
      }
      noteText = (v.notes || "") + cacheNote + artifactWarn;
    } else if (v.status === "unranked") {
      // Measured but failed validation: show the time in brackets so the
      // speed/correctness trade is visible, and keep it out of every
      // comparison column — it is not competing on equal terms.
      const bracketed = Number.isFinite(v.medianMs) ? `(${formatMs(v.medianMs)})` : "–";
      const artifact = Number.isFinite(v.artifactMedian)
        ? `(${v.artifactMedian.toLocaleString()})`
        : "–";
      lines.push(
        `| ${name} | ${bracketed} | ${Number.isFinite(v.minMs) ? `(${formatMs(v.minMs)})` : "–"} | – | – | not ranked | ${artifact} | – |`,
      );
    } else if (v.status === "skipped") {
      lines.push(`| ${name} | skipped | – | – | – | – | – | – |`);
    } else {
      lines.push(`| ${name} | error | – | – | – | – | – | – |`);
      noteText = v.error || v.notes || "";
    }
    if (noteText) noteRows.push(`- **${displayName(v)}**: ${noteText.replace(/\r?\n/g, " ")}`);
  }

  if (noteRows.length) {
    lines.push("");
    lines.push("<details><summary>Notes</summary>");
    lines.push("");
    lines.push(...noteRows);
    lines.push("");
    lines.push("</details>");
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

  // Stable order: the untargeted class first, then targets alphabetically.
  const keys = [...byClass.keys()].sort(
    (a, b) => (a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b)),
  );

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
  const entries = [];
  for (const v of sorted) {
    if ((v.status === "ok" || v.status === "unranked") && Array.isArray(v.runs)) {
      const rule = slimRuleFor(v.label);
      entries.push(`- **${rule ? rule.slim : v.label}${engineTag(v)}**: ${v.runs.map(formatMs).join(", ")}`);
    }
  }
  // A table of ratio rows has no runs — an empty collapsible says nothing.
  if (entries.length === 0) return [];
  return ["<details><summary>Raw runs</summary>", "", ...entries, "", "</details>"];
}

/**
 * One legend entry per distinct tool on the surface: the slim display name
 * mapped back to what actually ran. Emitted once, above the tables, instead of
 * repeating the identity in every row.
 */
function renderToolLegend(surface) {
  const variants = Array.isArray(surface.groups)
    ? surface.groups.flatMap((g) => g.variants)
    : (surface.variants ?? []);
  const seen = new Map();
  for (const v of variants) {
    const rule = slimRuleFor(v.label);
    const name = `${rule ? rule.slim : v.label}${engineTag(v)}`;
    if (seen.has(name)) continue;
    const desc = rule?.desc ?? (rule && rule.slim !== v.label ? v.label : null);
    if (desc) seen.set(name, desc);
  }
  if (seen.size === 0) return [];
  const lines = ["Tools:", ""];
  for (const [name, desc] of seen) lines.push(`- **${name}** — ${desc}`);
  lines.push("");
  return lines;
}

/**
 * How to read the tables — a property of the REPORT, stated once per document.
 *
 * This paragraph used to be emitted by `renderSurfaceMarkdown`, which put a
 * verbatim copy above every table on every surface: 21 identical copies in
 * README.md, one every few screens, saying the same thing each time. Nothing
 * about it varies per surface.
 *
 * A full timing report states these rules in its **Methodology notes** section
 * and does not need this line at all; documents with no methodology section
 * (`ide-bench.mjs`) push it once, near the top.
 */
/**
 * The IDE report's half of the same contract, stated once per document.
 *
 * It was a per-surface `groupingNote` on all eight IDE suites, so the identical
 * paragraph landed above every suite in the same document.
 */
export const IDE_RANKING_RULES =
  "Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. A row that failed its content gate is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.";

export const RANKING_RULES =
  "Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per surface: engine, invocation and threading are row properties, not table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. Per-row detail is under **Notes** below each table.";

/**
 * Tools that produced NO measurement, rendered ABOVE the tables.
 *
 * Distinct from an unranked row, and the distinction is the point. An unranked
 * row has a time that is real but not comparable, so it belongs in the table in
 * brackets. A tool that aborted the process has no time at all — putting it in a
 * ranking table would imply something was ranked, and there is nothing to rank.
 *
 * It is deliberately placed before the tables rather than in a `<details>` at the
 * bottom: a crash is a louder result than any latency in the table underneath it,
 * and burying it would be the quiet failure this section exists to prevent. A
 * reader must never be able to conclude a tool "wasn't tested" when it was tested
 * and destroyed the process.
 */
function renderExcluded(surface) {
  const excluded = surface.excluded ?? [];
  if (excluded.length === 0) return [];
  const lines = [
    "> **Did not run — excluded from every table below.**",
    ">",
    "> These tools produced no measurement on this corpus, so they have no row: a ranking table is for things that were ranked. This is a harder failure than any bracketed row, not a softer one.",
    ">",
  ];
  for (const e of excluded) {
    const what = e.kind === "process-abort" ? "aborted the benchmark process" : (e.kind ?? "failed");
    lines.push(`> - **${e.tool}** (\`${e.package}\`) — ${what}: ${e.reason}`);
    if (e.detail) lines.push(`>   ${e.detail}`);
  }
  lines.push("");
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
  lines.push(...renderToolLegend(surface));
  lines.push(...renderExcluded(surface));

  // Compile matrix (and any future grouped surface)
  if (Array.isArray(surface.groups) && surface.groups.length > 0) {
    // Only when the surface has something to say. A default here printed the
    // compile matrix's explanation above every grouped surface, including the
    // eight IDE suites it does not describe.
    if (surface.groupingNote) {
      lines.push(surface.groupingNote);
      lines.push("");
    }

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
      const rule = slimRuleFor(v.label);
      lines.push(`- **${rule ? rule.slim : v.label}${engineTag(v)}**: ${v.runs.map(formatMs).join(", ")}`);
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
    "Status is a marker on the tool NAME, not a column: ⚠ failed a validation gate (time in brackets, unranked) · ❌ error · ⏭ skipped. Per-row detail is in the collapsible **Notes** under each table, and each surface carries a **Tools** legend naming what actually ran.",
    "Each surface is ONE table. Engine, invocation and threading are row properties, not table splits: a CLI pays process startup on every run (~85ms measured for one native CLI) while an in-process API amortises it, and a thread pool is not a single thread — the row's label and notes say which mode it ran, so compare like with like.",
    "Rows tagged **(JS)** run the JavaScript TypeScript compiler, untagged typecheck/LSP rows run native tsgo. A cross-engine ratio measures TypeScript's Go rewrite as much as the Vue layer on top of it.",
    "Surfaces are independent: compile ms is not comparable to jsx-compile/typecheck/lint/format ms.",
    "jsx-compile uses fixtures/jsx-N (.jsx); SFC compile uses fixtures/N (.vue).",
    "Compile matrix cells (VDOM/Vapor × production/development × sourcemap on/off) are independent.",
    "Source map is an explicit, independent dimension applied identically to every compiler — it is never folded into the production/development flag for some tools and not others.",
    "Primary compile corpus is unique file contents (fixtures/N).",
    "Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.",
    "Tool order is **rotated** on every warmup and measured run, so no tool is pinned to the expensive first slot.",
    "CI does not drop OS page cache; later tools in a job may share a warmer file cache.",
    "Typecheck/lint/format tools that fail a work gate are unranked (skipped). Typecheck gates require both a script-level and a template-level diagnostic, and are re-verified against the full timed corpus. Lint gates require the planted vue/no-v-html. The format gate requires the tool to actually rewrite the <template> block, so a script-only formatter is not ranked against whole-SFC formatters.",
    "Compile measures assert non-empty codegen where applicable.",
    "Vue official compiler is 1T only (worker_threads variants removed).",
    "LSP: every server resolves from its installed npm package and is skipped when absent — no local-build or working-copy discovery, so each row names a version.",
    "verter-tsc needs stable tsgo (typescript@7.0.x via typescript-go); harness sets VERTER_TSGO_BIN.",
    "Diagnostic/format identity across tools is not required for throughput rows.",
  ];
}

