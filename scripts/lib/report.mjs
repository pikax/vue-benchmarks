import { formatMs } from "./timing.mjs";

function okVariants(variants) {
  return variants.filter((v) => v.status === "ok");
}

/** Primary steady-state metric: median of the measured warm runs. */
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

function freshChildIsNoisy(v) {
  return (
    Number.isFinite(v.freshChildCvPct) &&
    v.freshChildCvPct > NOISE_CV_LIMIT_PCT &&
    Array.isArray(v.freshChildRuns) &&
    v.freshChildRuns.length >= NOISE_CV_MIN_SAMPLES
  );
}

function freshChildIsRanked(v) {
  return (
    v.status === "ok" &&
    Number.isFinite(v.freshChildMedianMs) &&
    !freshChildIsNoisy(v)
  );
}

function fastestFreshChild(variants) {
  const ok = variants.filter(freshChildIsRanked);
  if (ok.length === 0) return Number.NaN;
  return Math.min(...ok.map((v) => v.freshChildMedianMs));
}

function fastestCold(variants) {
  const ok = okVariants(variants).filter((v) =>
    Number.isFinite(v.coldMedianMs),
  );
  if (ok.length === 0) return Number.NaN;
  return Math.min(...ok.map((v) => v.coldMedianMs));
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
 * Ratios and ordering are ALWAYS vs the fastest ranked row — no tool is
 * pinned as a reference denominator. A `baseline` flag on a variant remains
 * in the data (legend/notes can still name the official workload) but never
 * changes sorting or the 1.00x row.
 */
function referenceRow() {
  return null;
}

function referenceHeading(reference, cold = false) {
  return cold ? "vs fastest cold" : "vs fastest";
}

function freshChildReferenceHeading() {
  return "vs fastest fresh child";
}

function warmReferenceHeading() {
  return "vs fastest warm";
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
    desc: "biome format --write — multi-threaded; the exact pinned row rewrites none of the planted .vue corpus and is unranked on the full-SFC format surface.",
  },
  // Two rules, not one `/^Biome lint/`: `slim` REPLACES the label everywhere it
  // is rendered, so a shared rule collapsed the 1T and default-thread rows into two
  // identically-named lines in the table, notes and raw runs.
  {
    re: /^Biome lint \(1T\)$/,
    slim: "Biome lint (1T)",
    desc: "biome lint with RAYON_NUM_THREADS=1 — script block only. No template rules, so it misses the planted vue/no-v-html and reports template-only variable uses as unused; unranked.",
  },
  {
    re: /^Biome lint \(default threads\)$/,
    slim: "Biome lint (default threads)",
    desc: "biome lint with its default pool size — script block only. No template rules, so it misses the planted Vue template rules and reports template-only variable uses as unused; unranked.",
  },
  // Same two-rule split as Biome above — one shared /^Oxlint/ rule would rename
  // both rows to the same string in the table, notes and raw runs.
  {
    re: /^Oxlint \(1T\)$/,
    slim: "Oxlint (1T)",
    desc: "oxlint --threads=1 with its vue plugin enabled — the exact pinned row is script-block-only on the planted Vue template capabilities and remains unranked.",
  },
  {
    re: /^Oxlint \(default threads\)$/,
    slim: "Oxlint (default threads)",
    desc: "oxlint with its default pool size and vue plugin enabled — script block only, so it misses the planted Vue template rules; unranked.",
  },
];

export function slimRuleFor(rawLabel) {
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
export function displayName(v) {
  const rule = slimRuleFor(v.label);
  return `${rule ? rule.slim : v.label}${engineTag(v)}${statusMark(v.status)}`;
}

/** Chart/legend name: slimmed label + engine tag, no status marker. */
export function plainDisplayName(v) {
  const rule = slimRuleFor(v.label);
  return `${rule ? rule.slim : v.label}${engineTag(v)}`;
}

/** Comparison class: explicit workload class when supplied, then target. */
export function classKey(v) {
  // Most surfaces deliberately remain one table. A surface may opt into an
  // explicit work-equivalence split when two rows do materially different
  // compiler work (compile's raw render vs render+CSS split is the motivating
  // case). Engine, invocation and threading remain row
  // properties and never create a class implicitly.
  //
  // Codegen target is the one split that stays. jsx-compile carries vapor and
  // VDOM rows in one flat surface (compile separates them into cells), and
  // they share no runtime helpers — those are different jobs, not the same
  // job invoked differently.
  const target = v.target ? `target:${v.target}` : "target:*";
  return v.comparisonClass
    ? `comparison:${v.comparisonClass}|${target}`
    : v.target
      ? target
      : "all";
}

export function classLabel(key, variants) {
  if (key.startsWith("comparison:")) {
    const declared = variants.find(
      (v) => v.comparisonClassLabel,
    )?.comparisonClassLabel;
    if (declared) return declared;
    const id = key.slice("comparison:".length).split("|", 1)[0];
    return id.replaceAll("-", " ");
  }
  const target = key.startsWith("target:") ? key.slice("target:".length) : null;
  return target ? `${target.toUpperCase()} — ranked alone` : "";
}

/**
 * Above this CV%, a median is a coin flip, not a result. The ⚠ flag at 10%
 * means "noisy — read with care"; the ceiling is where reading-with-care stops
 * helping. Rows were published as table WINNERS at CV 384% and 2515% (one
 * winning series: 313.5, 0.8, 5.3, 4.9, 86.4 ms) — which rewards whichever
 * tool has the least stable behaviour, since instability widens the shot at a
 * lucky median (2026-07-30 audit, finding 8). Applied identically to every
 * row, baseline included; the time stays visible in brackets like any other
 * gate failure.
 *
 * The ceiling unranks only rows with at least THREE samples. With n=2 the
 * stddev is |a−b|/√2, so a single page-cache blip beside a minutes-scale
 * baseline clears 50% with no third sample to adjudicate which run was the
 * outlier — and the ceiling's own rationale (an unstable series buys more
 * shots at a lucky median) assumes there are enough draws to shop between.
 * A two-run row above the ceiling keeps the 10% ⚠ flag, which applies at
 * any sample count, and stays ranked.
 */
export const NOISE_CV_LIMIT_PCT = 50;

/** Minimum samples before the CV ceiling may unrank — see the docblock above. */
export const NOISE_CV_MIN_SAMPLES = 3;

/**
 * Render one ranking table for a homogeneous set of variants.
 * Primary column = median of measured runs (all warmed).
 */
function renderVariantTable(rawVariants, { title } = {}) {
  const variants = rawVariants.map((v) =>
    v.status === "ok" &&
    Number.isFinite(v.cvPct) &&
    v.cvPct > NOISE_CV_LIMIT_PCT &&
    Array.isArray(v.runs) &&
    v.runs.length >= NOISE_CV_MIN_SAMPLES
      ? {
          ...v,
          status: "unranked",
          notes: `${v.notes ? `${v.notes} | ` : ""}⚠ TOO NOISY TO RANK — CV ${v.cvPct.toFixed(1)}% (ceiling ${NOISE_CV_LIMIT_PCT}%). The median of a series this unstable is a draw from noise, not a result; the time is bracketed and excluded from ranking exactly like a failed gate. Raw runs below.`,
        }
      : v,
  );
  const lines = [];
  if (title) {
    lines.push(`##### ${title}`);
    lines.push("");
  }
  const artifactLabel =
    variants.find((v) => v.artifactLabel)?.artifactLabel ?? "Artifact";
  const showFreshChild = variants.some((v) =>
    Number.isFinite(v.freshChildMedianMs),
  );
  const showCold = variants.some((v) => Number.isFinite(v.coldMedianMs));
  // Memory is a COLUMN on the timing table, not a separate table/chart. The
  // value is whatever the run (or the isolated probe, injected upstream)
  // attributed to the row; provenance is stated once per document.
  const showRss = variants.some(
    (v) => Number.isFinite(v.rssMaxMb) && v.rssMaxMb > 0,
  );
  const rssHead = showRss ? " Peak RSS |" : "";
  const rssAlign = showRss ? " ---: |" : "";
  const rssCell = (v) => {
    if (!showRss) return "";
    if (!Number.isFinite(v.rssMaxMb) || v.rssMaxMb <= 0) return " – |";
    // Split `tool + tsgo/tsserver = total` when the run attributed a child
    // TypeScript engine — same presentation as the typecheck surface.
    const split =
      Number.isFinite(v.rssToolMb) &&
      Number.isFinite(v.rssEngineMb) &&
      v.rssEngineMb > 0;
    const cell = split
      ? `${v.rssToolMb.toFixed(1)} + ${v.rssEngineMb.toFixed(1)} = ${formatMb(v.rssMaxMb)}`
      : formatMb(v.rssMaxMb);
    return ` ${v.status === "ok" ? cell : `(${cell})`} |`;
  };
  const reference = referenceRow(variants);
  const primaryHeading = referenceHeading(reference);
  const coldHeading = referenceHeading(reference, true);
  const freshChildHeading = freshChildReferenceHeading(reference);
  const warmHeading = warmReferenceHeading(reference);
  if (showFreshChild) {
    lines.push(
      `| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | ${freshChildHeading} | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | ${warmHeading} | ${artifactLabel} | Throughput |${rssHead}`,
    );
    lines.push(
      `| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |${rssAlign}`,
    );
  } else if (showCold) {
    lines.push(
      `| Tool | **Cold** | ${coldHeading} | **Warm** | Min | Stddev | CV% | ${primaryHeading} | ${artifactLabel} | Throughput |${rssHead}`,
    );
    lines.push(
      `| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |${rssAlign}`,
    );
  } else {
    lines.push(
      `| Tool | **Median (primary)** | Min | Stddev | CV% | ${primaryHeading} | ${artifactLabel} | Throughput |${rssHead}`,
    );
    lines.push(`| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |${rssAlign}`);
  }

  const base = reference ? primaryMs(reference) : fastestPrimary(variants);
  const freshChildBase = reference
    ? freshChildIsRanked(reference)
      ? reference.freshChildMedianMs
      : Number.NaN
    : fastestFreshChild(variants);
  const coldBase = reference
    ? reference.status === "ok" && Number.isFinite(reference.coldMedianMs)
      ? reference.coldMedianMs
      : Number.NaN
    : fastestCold(variants);
  const sorted = [...variants].sort((a, b) => {
    // A declared reference is the conceptual first row even when a native
    // candidate is faster. Tables without a reference preserve fastest-first.
    if (reference) {
      if (a === reference) return -1;
      if (b === reference) return 1;
    }
    // Warm is the primary compiler throughput metric. Never substitute the
    // independently sampled fresh-child value when Warm is absent or noisy.
    // IDE tables have no freshChildMedianMs and retain their own Cold ordering.
    if (showFreshChild) return primaryMs(a) - primaryMs(b);
    if (showCold) {
      const coldMs = (v) =>
        v.status === "ok" && Number.isFinite(v.coldMedianMs)
          ? v.coldMedianMs
          : Number.POSITIVE_INFINITY;
      return coldMs(a) - coldMs(b);
    }
    return primaryMs(a) - primaryMs(b);
  });

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
      const cacheNote = Number.isFinite(v.cacheHitsMedian)
        ? ` cacheHits≈${v.cacheHitsMedian}`
        : "";
      // Flag noisy series so a thermally-throttled or contended box is visible.
      const cv = Number.isFinite(v.cvPct)
        ? `${v.cvPct.toFixed(1)}%${v.cvPct > 10 ? " ⚠" : ""}`
        : "n/a";
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
        if (showFreshChild) {
          const freshNoisy = freshChildIsNoisy(v);
          const fresh = Number.isFinite(v.freshChildMedianMs)
            ? freshNoisy
              ? `(${formatMs(v.freshChildMedianMs)}) ⚠`
              : formatMs(v.freshChildMedianMs)
            : "–";
          const freshCv = Number.isFinite(v.freshChildCvPct)
            ? `${v.freshChildCvPct.toFixed(1)}%${v.freshChildCvPct > 10 ? " ⚠" : ""}`
            : "n/a";
          const freshRatio = freshChildIsRanked(v)
            ? timesSlower(freshChildBase, v.freshChildMedianMs)
            : "not ranked";
          lines.push(
            `| ${name} | ${fresh} | ${formatMs(v.freshChildMinMs)} | ${formatMs(v.freshChildStddevMs)} | ${freshCv} | ${freshRatio} | **${formatMs(v.medianMs)}** | ${formatMs(v.minMs)} | ${formatMs(v.stddevMs)} | ${cv} | ${timesSlower(base, v.medianMs)} | ${artifact} | ${v.throughput} |${rssCell(v)}`,
          );
          if (freshNoisy) {
            noteText = `${noteText ? `${noteText} | ` : ""}⚠ FRESH-CHILD SERIES TOO NOISY FOR ITS OWN RATIO — CV ${v.freshChildCvPct.toFixed(1)}% (ceiling ${NOISE_CV_LIMIT_PCT}%). Warm remains independently ranked; raw fresh-child values stay visible.`;
          }
        } else if (showCold) {
          const cold = Number.isFinite(v.coldMedianMs)
            ? formatMs(v.coldMedianMs)
            : "–";
          lines.push(
            `| ${name} | **${cold}** | ${timesSlower(coldBase, v.coldMedianMs)} | **${formatMs(v.medianMs)}** | ${formatMs(v.minMs)} | ${formatMs(v.stddevMs)} | ${cv} | ${timesSlower(base, v.medianMs)} | ${artifact} | ${v.throughput} |${rssCell(v)}`,
          );
        } else {
          lines.push(
            `| ${name} | **${formatMs(v.medianMs)}** | ${formatMs(v.minMs)} | ${formatMs(v.stddevMs)} | ${cv} | ${timesSlower(base, v.medianMs)} | ${artifact} | ${v.throughput} |${rssCell(v)}`,
          );
        }
      } else {
        // An ok row with no duration is a ratio or informational row — its
        // value sits in the artifact column (or the notes), never in a
        // fabricated time.
        const throughput =
          v.throughput && v.throughput !== "n/a" ? v.throughput : "–";
        lines.push(
          `| ${name} | – | – | – | – | – | ${artifact} | ${throughput} |${rssCell(v)}`,
        );
      }
      noteText = noteText + cacheNote + artifactWarn;
    } else if (v.status === "unranked") {
      // Measured but failed validation: show the time in brackets so the
      // speed/correctness trade is visible, and keep it out of every
      // comparison column — it is not competing on equal terms.
      const bracketed = Number.isFinite(v.medianMs)
        ? `(${formatMs(v.medianMs)})`
        : "–";
      const artifact = Number.isFinite(v.artifactMedian)
        ? `(${v.artifactMedian.toLocaleString()})`
        : "–";
      if (showFreshChild) {
        const fresh = Number.isFinite(v.freshChildMedianMs)
          ? `(${formatMs(v.freshChildMedianMs)})`
          : "–";
        lines.push(
          `| ${name} | ${fresh} | ${Number.isFinite(v.freshChildMinMs) ? `(${formatMs(v.freshChildMinMs)})` : "–"} | ${Number.isFinite(v.freshChildStddevMs) ? `(${formatMs(v.freshChildStddevMs)})` : "n/a"} | ${Number.isFinite(v.freshChildCvPct) ? `(${v.freshChildCvPct.toFixed(1)}%)` : "n/a"} | not ranked | ${bracketed} | ${Number.isFinite(v.minMs) ? `(${formatMs(v.minMs)})` : "–"} | ${Number.isFinite(v.stddevMs) ? `(${formatMs(v.stddevMs)})` : "n/a"} | ${Number.isFinite(v.cvPct) ? `(${v.cvPct.toFixed(1)}%)` : "n/a"} | not ranked | ${artifact} | – |${rssCell(v)}`,
        );
      } else if (showCold) {
        const cold = Number.isFinite(v.coldMedianMs)
          ? `(${formatMs(v.coldMedianMs)})`
          : "–";
        lines.push(
          `| ${name} | ${cold} | not ranked | ${bracketed} | ${Number.isFinite(v.minMs) ? `(${formatMs(v.minMs)})` : "–"} | – | – | not ranked | ${artifact} | – |${rssCell(v)}`,
        );
      } else {
        lines.push(
          `| ${name} | ${bracketed} | ${Number.isFinite(v.minMs) ? `(${formatMs(v.minMs)})` : "–"} | – | – | not ranked | ${artifact} | – |${rssCell(v)}`,
        );
      }
    } else if (v.status === "skipped") {
      lines.push(
        (showFreshChild
          ? `| ${name} | skipped | – | – | – | – | – | – | – | – | – | – | – |`
          : showCold
            ? `| ${name} | skipped | – | – | – | – | – | – | – | – |`
            : `| ${name} | skipped | – | – | – | – | – | – |`) + rssCell(v),
      );
    } else {
      lines.push(
        (showFreshChild
          ? `| ${name} | error | – | – | – | – | – | – | – | – | – | – | – |`
          : showCold
            ? `| ${name} | error | – | – | – | – | – | – | – | – |`
            : `| ${name} | error | – | – | – | – | – | – |`) + rssCell(v),
      );
      noteText = v.error || v.notes || "";
    }
    if (noteText)
      noteRows.push(
        `- **${displayName(v)}**: ${noteText.replace(/\r?\n/g, " ")}`,
      );
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
function formatMb(mb) {
  if (!Number.isFinite(mb)) return "–";
  return `${mb.toFixed(1)} MB`;
}

/**
 * Whole-process peak RSS table. Used as its own group (IDE) or appended after
 * a speed table (real-world CLIs).
 */
function renderPeakRssBlock(variants, { heading = true } = {}) {
  const rows = variants.filter(
    (v) => Number.isFinite(v.rssMaxMb) && v.rssMaxMb > 0,
  );
  if (!rows.length) return [];
  const sorted = [...rows].sort((a, b) => a.rssMaxMb - b.rssMaxMb);
  const split = sorted.some(
    (v) => Number.isFinite(v.rssToolMb) && Number.isFinite(v.rssEngineMb) && v.rssEngineMb > 0,
  );
  const lines = [];
  if (heading) {
    lines.push("#### Peak RSS", "");
    lines.push(
      "> Whole process tree of the timed run (not Vue-attributed). Volar includes both halves.",
      "",
    );
  }
  if (split) {
    lines.push("| Tool | Tool | tsgo / tsserver | **Total** |");
    lines.push("| --- | ---: | ---: | ---: |");
    for (const v of sorted) {
      const name = displayName(v);
      const engine = Number.isFinite(v.rssEngineMb) && v.rssEngineMb > 0 ? v.rssEngineMb : null;
      const tool = Number.isFinite(v.rssToolMb)
        ? v.rssToolMb
        : engine != null
          ? v.rssMaxMb - engine
          : v.rssMaxMb;
      const total =
        v.status === "ok" ? `**${formatMb(v.rssMaxMb)}**` : `(${formatMb(v.rssMaxMb)})`;
      lines.push(
        `| ${name} | ${formatMb(tool)} | ${engine != null ? formatMb(engine) : "—"} | ${total} |`,
      );
    }
    lines.push("");
    lines.push(
      "Engine is a **child** `tsgo` / sibling `tsserver` process — the same attribution the typecheck surface uses. `—` = the server hosts its checker in-process.",
    );
  } else {
    lines.push("| Tool | **Peak RSS** |");
    lines.push("| --- | ---: |");
    for (const v of sorted) {
      const name = displayName(v);
      const cell =
        v.status === "ok"
          ? `**${formatMb(v.rssMaxMb)}**`
          : `(${formatMb(v.rssMaxMb)})`;
      lines.push(`| ${name} | ${cell} |`);
    }
  }
  lines.push("");
  return lines;
}

function renderByThreadingClass(variants) {
  const lines = [];
  const byClass = new Map();
  for (const v of variants) {
    const k = classKey(v);
    if (!byClass.has(k)) byClass.set(k, []);
    byClass.get(k).push(v);
  }

  // Stable order: the untargeted class first, then targets alphabetically.
  const keys = [...byClass.keys()].sort((a, b) =>
    a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b),
  );

  const allSorted = [];
  for (const k of keys) {
    const group = byClass.get(k);
    // Only print class heading when multiple classes exist
    const { lines: tableLines, sorted } = renderVariantTable(group, {
      title: keys.length > 1 ? classLabel(k, group) : undefined,
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
    if (
      (v.status === "ok" || v.status === "unranked") &&
      Array.isArray(v.runs)
    ) {
      const rule = slimRuleFor(v.label);
      const warm = v.runs.map(formatMs).join(", ");
      const samples = Array.isArray(v.freshChildRuns)
        ? `Fresh child (first timed row workload): ${v.freshChildRuns.map(formatMs).join(", ")} · Warm: ${warm}`
        : Array.isArray(v.coldRuns)
          ? `Cold: ${v.coldRuns.map(formatMs).join(", ")} · Warm: ${warm}`
          : warm;
      entries.push(
        `- **${rule ? rule.slim : v.label}${engineTag(v)}**: ${samples}`,
      );
    }
  }
  // A table of ratio rows has no runs — an empty collapsible says nothing.
  if (entries.length === 0) return [];
  return [
    "<details><summary>Raw runs</summary>",
    "",
    ...entries,
    "",
    "</details>",
  ];
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
  "Ranked **per operation**, never pooled. These operations differ by orders of magnitude and answer unrelated questions, so one table each. Each request-style operation publishes **Cold** (first request after initialize+didOpen in a **fresh session dedicated to that operation** — later ops do not reuse a warmed server) and **Warm** (the same request immediately after). Ranking uses Cold; vs-fastest-cold sits next to it. A row that failed its content gate on the cold request is shown in brackets and excluded from ranking — latency without a correct answer is not a comparable measurement.";

export const RANKING_RULES =
  "Ranked on the **median of measured runs**. Warm series follow ≥1 discarded warmup and are the primary ordering and ranking metric wherever both series exist. Compiler and Component-meta additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup and package imports. It is not called Cold and its ratio/noise gate never substitutes for Warm. What else the child excludes differs by surface and each surface states it in its own methodology — Compiler builds its compiler host outside the timer, Component-meta builds its checker/session inside it, because its warm timer does too. Every table sorts fastest-first and every ratio column is **vs fastest** — the fastest ranked row is the 1.00x denominator; no tool is pinned as a reference. One table per surface unless that surface declares explicit work-equivalence classes; engine, invocation and threading are row properties, not implicit table splits — rows tagged **(JS)** run the JavaScript TypeScript compiler (a cross-engine ratio measures TypeScript's rewrite as much as the tool), and a row's label/notes say whether it is a CLI (pays process startup every run), an in-process API, single-threaded or a thread pool. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three warm samples is bracketed as TOO NOISY TO RANK, no tool exempted (a two-run spread has no third sample to adjudicate, so it is flagged, not bracketed). Per-row detail is under **Notes** below each table.";

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
    const what =
      e.kind === "process-abort"
        ? "aborted the benchmark process"
        : (e.kind ?? "failed");
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
      if (group.metric === "rss") {
        lines.push(...renderPeakRssBlock(group.variants, { heading: false }));
      } else {
        // Peak RSS is a column on the timing table (rssCell); no second table.
        const { lines: tableLines, sorted } = renderByThreadingClass(
          group.variants,
        );
        lines.push(...tableLines);
        lines.push(...renderRawRuns(sorted));
      }
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

  // Flat surfaces — Peak RSS is a column on the timing table (rssCell).
  const { lines: tableLines, sorted } = renderByThreadingClass(
    surface.variants,
  );
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
    if (
      (v.status === "ok" || v.status === "unranked") &&
      Array.isArray(v.runs)
    ) {
      const rule = slimRuleFor(v.label);
      const warm = v.runs.map(formatMs).join(", ");
      const samples = Array.isArray(v.freshChildRuns)
        ? `Fresh child (first timed row workload): ${v.freshChildRuns.map(formatMs).join(", ")} · Warm: ${warm}`
        : Array.isArray(v.coldRuns)
          ? `Cold: ${v.coldRuns.map(formatMs).join(", ")} · Warm: ${warm}`
          : warm;
      lines.push(
        `- **${rule ? rule.slim : v.label}${engineTag(v)}**: ${samples}`,
      );
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
  lines.push(
    `- **Runs / warmups:** ${data.settings.runs} / ${data.settings.warmups}`,
  );
  lines.push(
    `- **Runner:** ${data.runner.label} · ${data.runner.platform}/${data.runner.arch} · ${data.runner.cpuCount} CPUs · ${data.runner.cpuModel}`,
  );
  lines.push(`- **Node:** ${data.versions.node}`);
  if (data.commit?.sha) {
    const repository = data.commit.repository;
    const sha = String(data.commit.sha);
    const rendered = repository
      ? `[\`${sha}\`](https://github.com/${repository}/commit/${sha})`
      : `\`${sha}\``;
    const state =
      data.commit.dirty === true
        ? " · **DIRTY WORKTREE** — this result is not attributable to that commit alone"
        : data.commit.dirty === false
          ? " · clean worktree"
          : " · worktree state unknown";
    lines.push(`- **Benchmark commit:** ${rendered}${state}`);
  }
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
    "This suite publishes two complementary outputs: apples-to-apples performance rankings against each surface's declared reference, and executable compatibility-gap findings for tool maintainers. Failed or incomplete work remains visible with evidence but cannot win a speed ranking.",
    "Primary ranking metric is the **Warm median of measured runs**. Every warm measured series is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1). Compiler and Component-meta also report a separately sampled Fresh-child median for the first timed row workload; each surface methodology defines exactly which setup is outside that timer, and they do not draw that line in the same place.",
    "Every ratio is **vs fastest**: tables sort fastest-first and the fastest ranked row is the 1.00x denominator. No tool is pinned as a reference — the official Vue workload competes on the same terms and its row is labelled so it stays easy to find.",
    "Warm columns rank steady-state work after a discarded pass. Compiler and Component-meta additionally publish Fresh child, but that value cannot be interpreted as pure first-use overhead: process startup, package import and adapter setup are excluded and may already change V8/native/thread/allocator state; the OS page cache is not flushed. `pnpm diagnose:compile-warmth` remains the deeper state diagnostic.",
    "Min / stddev / CV% are reported per row. CV% > 10 is flagged ⚠ — treat that row as noisy (thermal drift or a contended runner), not as a result. Above CV 50% a row with at least three samples is TOO NOISY TO RANK: bracketed and excluded exactly like a gate failure, baseline included — an unstable series buys more shots at a lucky median, so ranking it rewards instability. A two-run row is never bracketed by the ceiling (its stddev is |a−b|/√2 and there is no third sample to adjudicate); it keeps the ⚠ flag.",
    "Status is a marker on the tool NAME, not a column: ⚠ failed a validation gate (time in brackets, unranked) · ❌ error · ⏭ skipped. Per-row detail is in the collapsible **Notes** under each table, and each surface carries a **Tools** legend naming what actually ran.",
    "Each surface is one table unless it explicitly declares work-equivalence classes. Engine, invocation and threading remain row properties, not implicit table splits: a CLI pays process startup on every run (~85ms measured for one native CLI) while an in-process API amortises it, and a thread pool is not a single thread — the row's label and notes say which mode it ran, so compare like with like.",
    "Rows tagged **(JS)** run the JavaScript TypeScript compiler, untagged typecheck/LSP rows run native tsgo. A cross-engine ratio measures TypeScript's Go rewrite as much as the Vue layer on top of it.",
    "Surfaces are independent: compile ms is not comparable to jsx-compile/typecheck/lint/format ms.",
    "jsx-compile uses fixtures/jsx-N (.jsx); Compiler uses fixtures/N (.vue).",
    "Compile matrix cells (VDOM/Vapor × production/development × sourcemap on/off) are independent.",
    "Source map is an explicit, independent dimension applied identically to every compiler — it is never folded into the production/development flag for some tools and not others.",
    "Primary compile corpus is unique file contents (fixtures/N).",
    "Duplicate compile bodies are disclosed as a corpus property. The Vize compileSfcBatchWithResults path does not use the stats-only compileSfcBatch API's duplicate-body grouping and neither raw native row may return cached generated output.",
    "Tool order is rotated on generic surfaces. Compiler uses paired forward/reverse ordering for Fresh-child samples, warmups and measured Warm runs, balancing positions over any complete pair even when runs < rows; executed order is retained in JSON.",
    "CI does not drop OS page cache; later tools in a job may share a warmer file cache.",
    "Typecheck/lint/format rows that fail mandatory validity stay measured but unranked. Typecheck gates require script and template diagnostics and re-check the timed corpus. Lint uses exact-row dirty/clean differential plants with file, line and rule/concept attribution. Format requires idempotent, parseable full-SFC rewriting with preserved descriptor/template/script semantics; script-only tools cannot rank as whole-SFC tools.",
    "Compile measures assert non-empty codegen where applicable.",
    "Vue official compiler is 1T only (worker_threads variants removed).",
    "LSP: every server resolves from its installed npm package and is skipped when absent — no local-build or working-copy discovery, so each row names a version.",
    "verter-tsc needs stable tsgo (typescript@7.0.x via typescript-go); harness sets VERTER_TSGO_BIN.",
    "Diagnostic/format identity across tools is not required for throughput rows.",
  ];
}
