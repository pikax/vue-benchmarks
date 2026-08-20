#!/usr/bin/env node

/**
 * Publish one complete, compiler-only document from the timing and resource
 * artifacts. The readable Markdown is followed by the exact compiler-owned
 * JSON payloads so plant verdicts, raw samples, scheduling and parity evidence
 * are not lost when the README is compacted.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compactHighlightBody, memorySnippetsFromBody, writeChart } from "./lib/readme-charts.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
export const COMPILER_RESULTS_START = "<!-- COMPILER_RESULTS_START -->";
export const COMPILER_RESULTS_END = "<!-- COMPILER_RESULTS_END -->";

function sectionAtLevel(markdown, title, level = 3) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  const prefix = `${"#".repeat(level)} `;
  const start = lines.findIndex(
    (line) =>
      line.startsWith(prefix) &&
      line.slice(prefix.length).trim().toLowerCase() === title.toLowerCase(),
  );
  if (start < 0) return "";
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    const match = /^(#{1,6})\s/.exec(lines[index]);
    if (match && match[1].length <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

export function compilerMarkdownSection(markdown) {
  return sectionAtLevel(markdown, "Compiler", 3);
}

export function compilerMemoryMarkdownSection(markdown) {
  return sectionAtLevel(markdown, "compile", 3);
}

function compilerVersionTable(markdown) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  const heading = lines.findIndex((line) => /^### Tool versions\s*$/i.test(line));
  if (heading < 0) return "";
  const start = lines.findIndex(
    (line, index) => index > heading && /^\|\s*Package\s*\|/i.test(line),
  );
  if (start < 0) return "";
  const table = [];
  for (let index = start; index < lines.length && /^\|/.test(lines[index]); index++) {
    table.push(lines[index]);
  }
  if (table.length < 2) return "";
  const packages = new Set([
    "vue",
    "vue-36",
    "@vue/compiler-sfc",
    "@vue/compiler-sfc-36",
    "vize",
    "@vizejs/native",
    "@verter/native",
    "@fervid/napi",
  ]);
  const rows = table.slice(2).filter((line) => {
    const name = line.split("|")[1]?.trim();
    return packages.has(name);
  });
  return rows.length ? [table[0], table[1], ...rows].join("\n") : "";
}

function benchmarkPrelude(markdown) {
  const source = String(markdown ?? "");
  const compiler = compilerMarkdownSection(source);
  if (!compiler) return "";
  return source.slice(0, source.indexOf(compiler)).trim();
}

function benchmarkContext(data, compilerSurface) {
  return {
    schemaVersion: data.schemaVersion,
    generatedAt: data.generatedAt,
    fixture: data.fixture,
    fileCount: data.fileCount,
    settings: data.settings,
    runner: data.runner,
    commit: data.commit,
    versions: data.versions,
    methodology: data.methodology,
    compilerSurface,
  };
}

function memoryContext(data, rows) {
  return {
    kind: data.kind,
    generatedAt: data.generatedAt,
    fixture: data.fixture,
    settings: data.settings,
    versions: data.versions,
    validation: data.validation,
    compilerResults: rows,
  };
}

export function formatCompilerDoc({
  benchmarkMarkdown,
  benchmarkData,
  memoryMarkdown,
  memoryData,
  benchmarkSource = "benchmark artifact",
  memorySource = "memory artifact",
}) {
  const compilerSurface = benchmarkData?.surfaces?.find((surface) => surface.id === "compile");
  if (!compilerSurface) throw new Error("benchmark JSON has no compile surface");
  const compilerSection = compilerMarkdownSection(benchmarkMarkdown);
  if (!compilerSection) throw new Error("benchmark Markdown has no Compiler section");
  const memoryRows = (memoryData?.results ?? []).filter((row) => row.surface === "compile");
  if (!memoryRows.length) throw new Error("memory JSON has no compile rows");
  const memorySection = compilerMemoryMarkdownSection(memoryMarkdown);
  if (!memorySection) throw new Error("memory Markdown has no compile section");

  const dirty = benchmarkData?.commit?.dirty === true;
  const prelude = benchmarkPrelude(benchmarkMarkdown)
    .replace(/^## Benchmark Results\s*/i, "")
    .trim();
  const readableCompiler = compilerSection.replace(
    /^### Compiler\s*/i,
    "## Timing, output and validity results\n\n",
  );
  const readableMemory = memorySection.replace(
    /^### compile\s*/i,
    "## Peak RSS and complete resource-probe results\n\n",
  );
  const completeBenchmark = benchmarkContext(benchmarkData, compilerSurface);
  const completeMemory = memoryContext(memoryData, memoryRows);

  return [
    "# Compiler",
    "",
    "> Auto-generated; do not edit. This document is the lossless Compiler publication: readable full tables first, followed by the exact compiler-owned JSON payloads.",
    `> Timing source: \`${benchmarkSource}\` · resource source: \`${memorySource}\`.`,
    dirty
      ? "> **DIRTY WORKTREE:** these local figures are not attributable to the recorded commit alone. A clean Linux Benchmark workflow replaces them."
      : "> The benchmark artifact records a clean worktree and exact commit metadata below.",
    "",
    "## Run environment",
    "",
    prelude,
    "",
    readableCompiler,
    "",
    readableMemory,
    "",
    "## Complete machine-readable Compiler timing data",
    "",
    "This is every top-level benchmark field needed to interpret the run plus the complete `compile` surface. It includes all groups and rows, Fresh-child and Warm raw samples/statistics, execution order, adapter-parity evidence, capability probes, plant manifests/verdicts, methodology, exclusions and tool versions.",
    "",
    "<details><summary>Compiler benchmark JSON</summary>",
    "",
    "````json",
    JSON.stringify(completeBenchmark, null, 2),
    "````",
    "",
    "</details>",
    "",
    "## Complete machine-readable Compiler resource data",
    "",
    "This contains the complete resource-probe validation matrix plus every Compiler memory row and every raw sample, including baseline/delta RSS, true peak RSS, allocation proxies, CPU, wall time and per-sample validity evidence.",
    "",
    "<details><summary>Compiler resource JSON</summary>",
    "",
    "````json",
    JSON.stringify(completeMemory, null, 2),
    "````",
    "",
    "</details>",
    "",
  ].join("\n");
}

function listFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) listFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function pairFromMarkdown(markdownPath) {
  const jsonPath = markdownPath.slice(0, -extname(markdownPath).length) + ".json";
  return existsSync(jsonPath) ? { markdownPath, jsonPath } : null;
}

function generatedAt(pair) {
  try {
    return Date.parse(JSON.parse(readFileSync(pair.jsonPath, "utf8")).generatedAt) || 0;
  } catch {
    return 0;
  }
}

function isDirty(pair) {
  try {
    const data = JSON.parse(readFileSync(pair.jsonPath, "utf8"));
    if (data?.commit?.dirty === true) return true;
  } catch {
    return true;
  }
  return /\*\*DIRTY WORKTREE\*\*/i.test(readFileSync(pair.markdownPath, "utf8"));
}

function newestPair(dir, kind, allowDirty) {
  const pattern = kind === "benchmark" ? /^bench-.*-bench\.md$/i : /^memory-.*\.md$/i;
  const pairs = listFiles(dir)
    .filter((file) => pattern.test(file.replace(/\\/g, "/").split("/").pop()))
    .map(pairFromMarkdown)
    .filter(Boolean)
    .filter((pair) => allowDirty || !isDirty(pair))
    .filter((pair) => {
      const markdown = readFileSync(pair.markdownPath, "utf8");
      return kind === "benchmark"
        ? Boolean(compilerMarkdownSection(markdown))
        : Boolean(compilerMemoryMarkdownSection(markdown));
    })
    .sort((a, b) => generatedAt(b) - generatedAt(a));
  return pairs[0] ?? null;
}

function explicitPair(path) {
  if (!path) return null;
  const absolute = resolve(path);
  const markdownPath =
    extname(absolute).toLowerCase() === ".json" ? absolute.slice(0, -5) + ".md" : absolute;
  const pair = pairFromMarkdown(markdownPath);
  if (!pair) throw new Error(`missing Markdown/JSON artifact pair for ${path}`);
  return pair;
}

export function wrapCompilerLanding(markdown) {
  if (String(markdown).includes(COMPILER_RESULTS_START)) return String(markdown);
  const lines = String(markdown).split(/\r?\n/);
  const start = lines.findIndex((line) => /^### Compiler\s*$/.test(line));
  if (start < 0) return String(markdown);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    if (/^### (?!#)/.test(lines[index])) {
      end = index;
      break;
    }
  }
  lines.splice(end, 0, COMPILER_RESULTS_END, "");
  lines.splice(start, 0, COMPILER_RESULTS_START, "");
  return lines.join("\n");
}

export function formatCompilerLanding({
  benchmarkMarkdown,
  memoryMarkdown,
  benchmarkLeaf,
  memoryLeaf,
  chartsDir,
}) {
  const versions = compilerVersionTable(benchmarkMarkdown);
  const memoryBody = compactHighlightBody(memoryMarkdown, {
    kind: "memory",
    leaf: memoryLeaf,
    href: "MEMORY.md",
    chartsHref: "docs/results/charts",
    metric: "rss",
    writeChart: (file, svg) => writeChart(chartsDir, file, svg),
  });
  const snippets = memorySnippetsFromBody(memoryBody);
  const body = compactHighlightBody(compilerMarkdownSection(benchmarkMarkdown), {
    kind: "bench",
    leaf: benchmarkLeaf,
    href: "docs/compiler.md",
    chartsHref: "docs/results/charts",
    writeChart: (file, svg) => writeChart(chartsDir, file, svg),
    notesSource: benchmarkMarkdown,
    memorySnippets: snippets,
    toolTable: () => versions,
  });
  return wrapCompilerLanding(body.trim());
}

export function updateCompilerDoc({
  dir = join(rootDir, "results"),
  benchmark,
  memory,
  output = join(rootDir, "docs", "compiler.md"),
  allowDirty = false,
  updateReadme = false,
} = {}) {
  const benchmarkPair = explicitPair(benchmark) ?? newestPair(dir, "benchmark", allowDirty);
  const memoryPair = explicitPair(memory) ?? newestPair(dir, "memory", allowDirty);
  if (!benchmarkPair || !memoryPair) {
    return { updated: false, reason: "complete benchmark and memory artifact pairs are required" };
  }
  if (!allowDirty && (isDirty(benchmarkPair) || isDirty(memoryPair))) {
    return { updated: false, reason: "dirty artifacts are not publishable" };
  }
  const benchmarkMarkdown = readFileSync(benchmarkPair.markdownPath, "utf8");
  const benchmarkData = JSON.parse(readFileSync(benchmarkPair.jsonPath, "utf8"));
  const memoryMarkdown = readFileSync(memoryPair.markdownPath, "utf8");
  const memoryData = JSON.parse(readFileSync(memoryPair.jsonPath, "utf8"));
  const benchmarkLeaf = benchmarkPair.markdownPath.replace(/\\/g, "/").split("/").pop();
  const memoryLeaf = memoryPair.markdownPath.replace(/\\/g, "/").split("/").pop();
  const document = formatCompilerDoc({
    benchmarkMarkdown,
    benchmarkData,
    memoryMarkdown,
    memoryData,
    benchmarkSource: benchmarkLeaf,
    memorySource: memoryLeaf,
  });
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, document, "utf8");

  if (updateReadme) {
    const readmePath = join(rootDir, "README.md");
    const readme = readFileSync(readmePath, "utf8");
    if (!readme.includes(COMPILER_RESULTS_START) || !readme.includes(COMPILER_RESULTS_END)) {
      throw new Error("README Compiler result markers are missing");
    }
    const landing = formatCompilerLanding({
      benchmarkMarkdown,
      memoryMarkdown,
      benchmarkLeaf,
      memoryLeaf,
      chartsDir: join(rootDir, "docs", "results", "charts"),
    });
    const replaced = readme.replace(
      new RegExp(`${COMPILER_RESULTS_START}[\\s\\S]*?${COMPILER_RESULTS_END}`),
      landing,
    );
    writeFileSync(readmePath, replaced, "utf8");
  }

  return {
    updated: true,
    output,
    benchmark: benchmarkPair.markdownPath,
    memory: memoryPair.markdownPath,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (value === "--dir") args.dir = argv[++index];
    else if (value === "--bench") args.benchmark = argv[++index];
    else if (value === "--memory") args.memory = argv[++index];
    else if (value === "--out") args.output = argv[++index];
    else if (value === "--allow-dirty") args.allowDirty = true;
    else if (value === "--update-readme") args.updateReadme = true;
  }
  return args;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = updateCompilerDoc(parseArgs(process.argv.slice(2)));
  if (!result.updated) {
    console.error(`[compiler-doc] not updated: ${result.reason}`);
    process.exitCode = 1;
  } else {
    console.log(`[compiler-doc] wrote ${result.output}`);
  }
}
