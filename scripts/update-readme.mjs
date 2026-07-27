#!/usr/bin/env node
/**
 * Merge CI benchmark markdown artifacts into README.md between markers.
 *
 * Expects results downloaded into ./results/** or passed via --dir.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const START = "<!-- BENCHMARK_RESULTS_START -->";
const END = "<!-- BENCHMARK_RESULTS_END -->";

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (entry.endsWith(".md") && entry.startsWith("bench-")) acc.push(full);
  }
  return acc;
}

function osTitle(platform) {
  if (platform.includes("linux") || platform.includes("ubuntu")) return "Ubuntu";
  if (platform.includes("darwin") || platform.includes("macos")) return "macOS";
  if (platform.includes("win")) return "Windows";
  return platform;
}

function main() {
  const args = process.argv.slice(2);
  let dir = join(rootDir, "results");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dir") dir = args[++i];
  }

  const files = walk(dir).sort();
  const readmePath = join(rootDir, "README.md");
  if (!existsSync(readmePath)) {
    console.error("README.md not found");
    process.exit(1);
  }

  let section;
  if (files.length === 0) {
    section = `${START}\n\n_No benchmark artifacts found yet. Run CI or \`pnpm bench\` locally._\n\n${END}`;
  } else {
    const chunks = [
      START,
      "",
      `> Auto-updated ${new Date().toISOString().slice(0, 10)} from the **Benchmark** workflow (rolldown-style: measure on CI → commit README on \`main\` with \`[skip ci]\`).`,
      `> Numbers are reference-only; re-run on your hardware for local relevance.`,
      `> Pass labels: **cold** (single first touch) · **warm-os** (after discarded OS warmer) · **warm** (process warmups + multi-run).`,
      "",
    ];

    // Prefer stable order: cold → warm-os → warm → other
    const phaseRank = (p) => {
      if (p.includes("-cold")) return 0;
      if (p.includes("-warm-os")) return 1;
      if (p.includes("-warm") && !p.includes("warm-os")) return 2;
      if (p.includes("repeated") || p.includes("cache-demo")) return 9;
      return 5;
    };
    files.sort((a, b) => {
      const ra = phaseRank(a);
      const rb = phaseRank(b);
      if (ra !== rb) return ra - rb;
      return a.localeCompare(b);
    });

    for (const file of files) {
      const content = readFileSync(file, "utf8").trim();
      const base = file.replace(/\\/g, "/");
      const leaf = base.split("/").pop() || base;
      // Case-insensitive: local runs name files from `process.platform`
      // ("linux"), CI names them from `runner.os` ("Linux"). Matching only the
      // lowercase spelling made every CI artifact fall through to the fallback,
      // which published the raw file path as the platform heading.
      const baseLower = base.toLowerCase();
      const platformGuess = baseLower.includes("win32")
        ? "Windows"
        : baseLower.includes("darwin") || baseLower.includes("macos")
          ? "macOS"
          : baseLower.includes("linux") || baseLower.includes("ubuntu")
            ? "Ubuntu/Linux"
            : osTitle(base);
      let phase = "bench";
      if (leaf.includes("-cold")) phase = "cold";
      else if (leaf.includes("-warm-os")) phase = "warm-os";
      else if (leaf.includes("repeated") || leaf.includes("cache-demo")) {
        phase = "cache-demo (not ranking)";
      } else if (leaf.includes("-warm")) phase = "warm";

      chunks.push(`#### ${platformGuess} · ${phase}`);
      chunks.push("");
      chunks.push(`<!-- source: ${leaf} -->`);
      chunks.push("");
      chunks.push(content);
      chunks.push("");
    }
    chunks.push(END);
    section = chunks.join("\n");
  }

  const readme = readFileSync(readmePath, "utf8");
  let next;
  if (readme.includes(START) && readme.includes(END)) {
    // Replacer FUNCTION, not a string. A replacement string interprets `$&`,
    // `` $` ``, `$'` and `$1`, so a results table containing any of them would
    // splice the matched text (the whole old section) into the README. A
    // function's return value is inserted literally.
    next = readme.replace(new RegExp(`${START}[\\s\\S]*?${END}`), () => section);
  } else {
    next = `${readme.trimEnd()}\n\n## Reference results\n\n${section}\n`;
  }

  writeFileSync(readmePath, next);
  console.log(`Updated README.md from ${files.length} artifact(s)`);
}

main();
