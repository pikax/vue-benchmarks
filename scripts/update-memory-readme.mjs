#!/usr/bin/env node
/**
 * Merge CI memory-*.md artifacts into MEMORY.md between markers.
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
      // Prefer CI Linux reports; ignore local one-off names like memory-cli-test
      if (/test/i.test(entry)) continue;
      acc.push(full);
    }
  }
  return acc;
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

  let section;
  if (files.length === 0) {
    section = `${START}\n\n_No CI memory artifacts found yet. Run the Benchmark workflow or \`pnpm bench:memory\` locally._\n\n${END}`;
  } else {
    const chunks = [
      START,
      "",
      `> Auto-updated ${new Date().toISOString().slice(0, 10)} from the **Benchmark** workflow (**Linux** resource probe). Commit uses \`[skip ci]\`.`,
      "",
    ];
    for (const file of files) {
      const content = readFileSync(file, "utf8").trim();
      const leaf = file.replace(/\\/g, "/").split("/").pop();
      chunks.push(`#### Source: \`${leaf}\``);
      chunks.push("");
      chunks.push(content);
      chunks.push("");
    }
    chunks.push(END);
    section = chunks.join("\n");
  }

  const doc = readFileSync(memoryPath, "utf8");
  let next;
  if (doc.includes(START) && doc.includes(END)) {
    next = doc.replace(new RegExp(`${START}[\\s\\S]*?${END}`), section);
  } else {
    next = `${doc.trimEnd()}\n\n${section}\n`;
  }
  writeFileSync(memoryPath, next);
  console.log(`Updated MEMORY.md from ${files.length} artifact(s)`);
}

main();
