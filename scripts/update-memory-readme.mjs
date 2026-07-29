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
 * 3. SAMPLE COUNTS ARE PER ROW — and they are no longer this script's job.
 *    This file used to re-parse the artifact markdown, match each row by its
 *    `Tool` cell against the sibling `*.json`, and string-append a **Samples**
 *    column onto the end of every line. That coupling broke the moment a column
 *    moved. The count is now rendered by `lib/memory-report.mjs`, which owns the
 *    table and already holds `samples` per row; this script only splices.
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

/**
 * The renderer's own sample-count line, echoed to the job log so a run where
 * rows came up short is visible without opening the diff.
 */
function samplesLine(md) {
  const m = /^- \*\*Samples per tool:\*\* (.*)$/m.exec(md);
  return m ? m[1].replace(/\*\*/g, "") : "not stated by the artifact";
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
    const md = readFileSync(file, "utf8").trim();
    console.log(`[memory] ${leaf} · ${platformOf(file)} · samples: ${samplesLine(md)}`);
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
