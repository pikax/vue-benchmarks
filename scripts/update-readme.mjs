#!/usr/bin/env node
/**
 * Merge CI benchmark markdown artifacts into README.md between markers.
 *
 * Expects results downloaded into ./results/** or passed via --dir.
 *
 * TWO independent sections, each with its own marker pair and its own artifact
 * prefix:
 *
 *   bench-*.md  ->  <!-- BENCHMARK_RESULTS_START/END -->   (the `bench` job)
 *   ide-*.md    ->  <!-- IDE_RESULTS_START/END -->         (the `ide` job)
 *
 * The IDE pair exists because the `ide` job runs for up to 90 minutes and its
 * report was previously dropped on the floor: the artifact walker matched only
 * `bench-`, so `results/ide-*.md` was never read by anything.
 *
 * A SECTION WITH NO ARTIFACTS IS LEFT EXACTLY AS IT IS. It is never replaced
 * with a "no artifacts" placeholder. The publish job runs when ANY measurement
 * job succeeded, so a run where `bench` failed and `memory` passed used to wipe
 * the previously published bench tables and auto-commit the erasure. Absence of
 * an artifact means "this run has nothing to say about that section", not
 * "delete what is published".
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Walk `dir` for `*.md` artifacts whose file name starts with `prefix`. */
function walk(dir, prefix, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, prefix, acc);
    else if (entry.endsWith(".md") && entry.startsWith(prefix)) acc.push(full);
  }
  return acc;
}

function osTitle(platform) {
  if (platform.includes("linux") || platform.includes("ubuntu")) return "Ubuntu";
  if (platform.includes("darwin") || platform.includes("macos")) return "macOS";
  if (platform.includes("win")) return "Windows";
  return platform;
}

/**
 * Case-insensitive: local runs name files from `process.platform` ("linux"),
 * CI names them from `runner.os` ("Linux"). Matching only the lowercase
 * spelling made every CI artifact fall through to the fallback, which published
 * the raw file path as the platform heading.
 */
function platformOf(path) {
  const lower = path.replace(/\\/g, "/").toLowerCase();
  if (lower.includes("win32") || lower.includes("windows")) return "Windows";
  if (lower.includes("darwin") || lower.includes("macos")) return "macOS";
  if (lower.includes("linux") || lower.includes("ubuntu")) return "Ubuntu/Linux";
  return osTitle(path);
}

function leafOf(path) {
  const base = path.replace(/\\/g, "/");
  return base.split("/").pop() || base;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Stable order: ranking tables first, cache demos last.
 *
 * There is no cold/warm ordering any more. The cold/warm-os/warm phase model
 * was abolished — every measured run is warmed and ranked on the median — and
 * no producer has emitted a `-cold` / `-warm-os` / `-warm` artifact since.
 * `benchmark.yml` writes exactly two shapes: `bench-<os>-<n>-bench.md` and
 * `bench-<os>-<n>-repeated-cache-demo.md`.
 */
function phaseRank(p) {
  if (p.includes("repeated") || p.includes("cache-demo")) return 9;
  return 5;
}

function renderBench(files, { start, end }) {
  const chunks = [
    start,
    "",
    `> Auto-updated ${today()} from the **Benchmark** workflow (rolldown-style: measure on CI → commit README on \`main\` with \`[skip ci]\`).`,
    `> Numbers are reference-only; re-run on your hardware for local relevance.`,
    `> Every measured run is warmed (>= 1 discarded pass); the ranking metric is the median. There is no cold column.`,
    "",
  ];

  const sorted = [...files].sort((a, b) => {
    const ra = phaseRank(a);
    const rb = phaseRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  for (const file of sorted) {
    const content = readFileSync(file, "utf8").trim();
    const leaf = leafOf(file);
    let phase = "bench";
    if (leaf.includes("repeated") || leaf.includes("cache-demo")) {
      phase = "cache-demo (not ranking)";
    }

    chunks.push(`#### ${platformOf(file)} · ${phase}`);
    chunks.push("");
    chunks.push(`<!-- source: ${leaf} -->`);
    chunks.push("");
    chunks.push(content);
    chunks.push("");
  }
  chunks.push(end);
  return chunks.join("\n");
}

function renderIde(files, { start, end }) {
  const chunks = [
    start,
    "",
    `> Auto-updated ${today()} from the **Benchmark** workflow (\`ide\` job — per-operation editor benchmarks).`,
    `> Ranked **per operation**, never pooled: \`didOpen→diagnostics\` and \`foldingRange\` answer unrelated questions.`,
    `> Same-VM rule holds within the job; these numbers are not comparable to the timing tables above.`,
    "",
  ];

  for (const file of [...files].sort()) {
    const content = readFileSync(file, "utf8").trim();
    const leaf = leafOf(file);
    chunks.push(`#### ${platformOf(file)} · ide ops`);
    chunks.push("");
    chunks.push(`<!-- source: ${leaf} -->`);
    chunks.push("");
    chunks.push(content);
    chunks.push("");
  }
  chunks.push(end);
  return chunks.join("\n");
}

const SECTIONS = [
  {
    id: "benchmark",
    prefix: "bench-",
    start: "<!-- BENCHMARK_RESULTS_START -->",
    end: "<!-- BENCHMARK_RESULTS_END -->",
    appendHeading: "## Reference results",
    render: renderBench,
  },
  {
    id: "ide",
    prefix: "ide-",
    start: "<!-- IDE_RESULTS_START -->",
    end: "<!-- IDE_RESULTS_END -->",
    appendHeading: "## IDE operation results",
    render: renderIde,
  },
];

function main() {
  const args = process.argv.slice(2);
  let dir = join(rootDir, "results");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dir") dir = args[++i];
  }

  const readmePath = join(rootDir, "README.md");
  if (!existsSync(readmePath)) {
    console.error("README.md not found");
    process.exit(1);
  }

  let readme = readFileSync(readmePath, "utf8");
  const before = readme;

  for (const section of SECTIONS) {
    const files = walk(dir, section.prefix);
    const hasMarkers = readme.includes(section.start) && readme.includes(section.end);

    if (files.length === 0) {
      // NEVER overwrite published results with a placeholder — see file header.
      if (hasMarkers) {
        console.log(
          `[${section.id}] no ${section.prefix}*.md artifacts in ${dir} — existing section LEFT UNTOUCHED (nothing published, nothing erased)`,
        );
      } else {
        console.log(
          `[${section.id}] no ${section.prefix}*.md artifacts in ${dir} and no ${section.start} marker — nothing to do`,
        );
      }
      continue;
    }

    const rendered = section.render(files, section);
    if (hasMarkers) {
      // Replacer FUNCTION, not a string. A replacement string interprets `$&`,
      // `` $` ``, `$'` and `$1`, so a results table containing any of them would
      // splice the matched text (the whole old section) into the README. A
      // function's return value is inserted literally.
      readme = readme.replace(
        new RegExp(`${section.start}[\\s\\S]*?${section.end}`),
        () => rendered,
      );
    } else {
      readme = `${readme.trimEnd()}\n\n${section.appendHeading}\n\n${rendered}\n`;
    }
    console.log(
      `[${section.id}] published ${files.length} artifact(s): ${files.map(leafOf).join(", ")}`,
    );
  }

  if (readme === before) {
    console.log("README.md unchanged");
    return;
  }
  writeFileSync(readmePath, readme);
  console.log("Updated README.md");
}

main();
