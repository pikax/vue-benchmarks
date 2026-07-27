#!/usr/bin/env node
/**
 * Merge CI memory-*.md artifacts into MEMORY.md between markers.
 *
 * Three things this script is careful about:
 *
 * 1. NO ARTIFACTS => NO EDIT. An empty results directory means "this run has
 *    nothing to say", not "delete what is published". The publish job runs when
 *    ANY measurement job succeeded, so replacing the section with a "no
 *    artifacts" placeholder used to erase good published numbers and
 *    auto-commit the erasure.
 *
 * 2. THE BANNER IS DERIVED, NOT ASSUMED. It used to state "**Linux** resource
 *    probe" unconditionally while globbing every `memory-*.md` — including
 *    `memory-win32-*.md` from a local Windows run — so Windows numbers were
 *    published under a Linux-only banner. The banner now names the platforms
 *    actually spliced, and each block is labelled with its own source platform.
 *
 * 3. SAMPLE COUNTS ARE PER ROW. `bench-memory.mjs` prints the REQUESTED sample
 *    count in the report header (`- **Samples per tool:** 3`,
 *    bench-memory.mjs:208) but stores the count that actually produced data per
 *    row (`samples: ok.length`, bench-memory.mjs:179). A flaky LSP probe that
 *    lost two of three samples was therefore published looking identical to a
 *    three-sample row. The sibling `*.json` is read and each row gets its real
 *    count in a **Samples** column, with ⚠ when it is short of the request.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const START = "<!-- MEMORY_RESULTS_START -->";
const END = "<!-- MEMORY_RESULTS_END -->";

function walkMemoryMd(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkMemoryMd(full, acc);
    else if (entry.endsWith(".md") && entry.startsWith("memory-")) {
      // Ignore local one-off names like memory-cli-test
      if (/test/i.test(entry)) continue;
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Source platform of an artifact, from its file name — the only signal there
 * is, since the report JSON records no platform field. CI writes
 * `memory-linux-<n>.md`; local runs use `process.platform` (`win32`,
 * `darwin`).
 */
function platformOf(path) {
  const lower = path.replace(/\\/g, "/").toLowerCase();
  if (lower.includes("win32") || lower.includes("windows")) return "Windows";
  if (lower.includes("darwin") || lower.includes("macos")) return "macOS";
  if (lower.includes("linux") || lower.includes("ubuntu")) return "Linux";
  return "unknown platform";
}

function leafOf(path) {
  const base = path.replace(/\\/g, "/");
  return base.split("/").pop() || base;
}

/** `| a | b |` -> ["a", "b"]; tolerates padded cells and CRLF. */
function cells(line) {
  const t = line.trim();
  if (!t.startsWith("|")) return null;
  return t
    .slice(1, t.endsWith("|") ? -1 : undefined)
    .split("|")
    .map((c) => c.trim());
}

function isResultsHeader(row) {
  return Array.isArray(row) && row[0] === "Tool" && row[1] === "Status";
}

/**
 * Add a per-row **Samples** column to every results table and correct the
 * report header line so a short row can never read as a full one.
 *
 * @returns {{ md: string, summary: string }}
 */
function annotateSamples(md, jsonPath) {
  if (!existsSync(jsonPath)) {
    return {
      md: md.replace(
        /^(- \*\*Samples per tool:\*\* .*)$/m,
        "$1 (requested; per-row counts unavailable — sibling JSON missing)",
      ),
      summary: `${leafOf(jsonPath)} missing — per-row sample counts not verified`,
    };
  }

  let data;
  try {
    data = JSON.parse(readFileSync(jsonPath, "utf8"));
  } catch (err) {
    return {
      md,
      summary: `${leafOf(jsonPath)} unreadable (${err.message}) — samples not verified`,
    };
  }

  const declared = Number(data?.settings?.samples);
  // surface -> label -> recorded sample count (null when the row produced none)
  const bySurface = new Map();
  for (const r of data.results || []) {
    const surface = String(r.surface ?? "");
    if (!bySurface.has(surface)) bySurface.set(surface, new Map());
    // `bench-memory.mjs` renders `r.label || r.id` in the Tool cell.
    const cell = String(r.label || r.id);
    bySurface.get(surface).set(cell, Number.isFinite(r.samples) ? r.samples : null);
  }

  const observed = [];
  let short = 0;
  let surface = "";
  let inTable = false;
  const out = [];

  for (const raw of md.split(/\r?\n/)) {
    const heading = /^###\s+(.+?)\s*$/.exec(raw);
    if (heading) {
      surface = heading[1];
      inTable = false;
      out.push(raw);
      continue;
    }

    const row = cells(raw);
    if (!row) {
      inTable = false;
      out.push(raw);
      continue;
    }

    if (isResultsHeader(row)) {
      inTable = true;
      out.push(`${raw.trimEnd()} Samples |`);
      continue;
    }
    if (!inTable) {
      out.push(raw);
      continue;
    }
    if (row.every((c) => /^:?-{2,}:?$/.test(c))) {
      out.push(`${raw.trimEnd()} ---: |`);
      continue;
    }

    const n = bySurface.get(surface)?.get(row[0]);
    let cell;
    if (n === undefined || n === null) {
      cell = "n/a";
    } else {
      observed.push(n);
      const isShort = Number.isFinite(declared) && n < declared;
      if (isShort) short++;
      cell = isShort ? `${n} ⚠` : String(n);
    }
    out.push(`${raw.trimEnd()} ${cell} |`);
  }

  let annotated = out.join("\n");
  const min = observed.length ? Math.min(...observed) : null;
  const max = observed.length ? Math.max(...observed) : null;

  let headerLine;
  let summary;
  if (!Number.isFinite(declared)) {
    headerLine = `- **Samples per tool:** see the **Samples** column (recorded per row)`;
    summary = "no declared sample count; per-row counts published";
  } else if (min === null) {
    headerLine = `- **Samples per tool:** ${declared} requested · no row recorded any sample`;
    summary = `${declared} requested; no row recorded a sample`;
  } else if (min === max && min === declared) {
    headerLine = `- **Samples per tool:** ${declared} requested · ${declared} recorded for every row (see the **Samples** column)`;
    summary = `${declared} requested, ${declared} recorded on all ${observed.length} row(s)`;
  } else {
    headerLine = `- **Samples per tool:** ${declared} requested · **${min}–${max} actually recorded** — per-row counts in the **Samples** column (⚠ = fewer than requested)`;
    summary = `${declared} requested, ${min}–${max} recorded; ${short} row(s) short of the request`;
  }
  annotated = annotated.replace(/^- \*\*Samples per tool:\*\* .*$/m, () => headerLine);

  return { md: annotated, summary };
}

function bannerPlatforms(files) {
  const seen = [];
  for (const f of files) {
    const p = platformOf(f);
    if (!seen.includes(p)) seen.push(p);
  }
  return seen;
}

function main() {
  const args = process.argv.slice(2);
  let dir = join(rootDir, "results");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dir") dir = args[++i];
  }

  const files = walkMemoryMd(dir).sort((a, b) => {
    // Prefer linux artifacts first
    const score = (p) => (p.includes("linux") ? 0 : p.includes("darwin") ? 1 : 2);
    const d = score(a) - score(b);
    return d !== 0 ? d : a.localeCompare(b);
  });

  const memoryPath = join(rootDir, "MEMORY.md");
  if (!existsSync(memoryPath)) {
    console.error("MEMORY.md not found");
    process.exit(1);
  }

  const doc = readFileSync(memoryPath, "utf8");
  const hasMarkers = doc.includes(START) && doc.includes(END);

  if (files.length === 0) {
    // NEVER overwrite published results with a placeholder — see file header.
    if (hasMarkers) {
      console.log(
        `[memory] no memory-*.md artifacts in ${dir} — existing section LEFT UNTOUCHED (nothing published, nothing erased)`,
      );
    } else {
      console.log(
        `[memory] no memory-*.md artifacts in ${dir} and no ${START} marker — nothing to do`,
      );
    }
    return;
  }

  const platforms = bannerPlatforms(files);
  const banner =
    platforms.length === 1
      ? `> Auto-updated ${new Date().toISOString().slice(0, 10)} from the **Benchmark** workflow (**${platforms[0]}** resource probe). Commit uses \`[skip ci]\`.`
      : `> Auto-updated ${new Date().toISOString().slice(0, 10)} from the **Benchmark** workflow. Sources below come from **${platforms.join("**, **")}** — each block states its own platform. **Rows from different platforms are not comparable.** Commit uses \`[skip ci]\`.`;

  const chunks = [START, "", banner, ""];
  for (const file of files) {
    const leaf = leafOf(file);
    const jsonPath = file.replace(/\.md$/, ".json");
    const { md, summary } = annotateSamples(readFileSync(file, "utf8").trim(), jsonPath);
    console.log(`[memory] ${leaf} · ${platformOf(file)} · samples: ${summary}`);
    chunks.push(`#### ${platformOf(file)} · source: \`${leaf}\``);
    chunks.push("");
    chunks.push(md.trim());
    chunks.push("");
  }
  chunks.push(END);
  const section = chunks.join("\n");

  let next;
  if (hasMarkers) {
    // Replacer FUNCTION — see update-readme.mjs. A replacement string would
    // interpret `$&` / `` $` `` / `$'` in any table cell and splice the matched
    // text into the document.
    next = doc.replace(new RegExp(`${START}[\\s\\S]*?${END}`), () => section);
  } else {
    next = `${doc.trimEnd()}\n\n${section}\n`;
  }
  if (next === doc) {
    console.log(`MEMORY.md unchanged (${files.length} artifact(s) produced identical output)`);
    return;
  }
  writeFileSync(memoryPath, next);
  console.log(
    `Updated MEMORY.md from ${files.length} artifact(s) · platform(s): ${platforms.join(", ")}`,
  );
}

main();
