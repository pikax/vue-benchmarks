/**
 * Shared scaffolding for the harness self-test suite.
 *
 * Nothing in here asserts — it only builds deterministic inputs (temp dirs,
 * fake CLIs, markdown parsers) so the tests never have to run a real compiler
 * or depend on machine speed.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Temp scratch lives under the repo's gitignored work/ dir. */
const TEMP_ROOT = join(repoRoot, "work", "harness-tests");

/**
 * Some helpers must live under <repo>/fixtures/<name> because the code under
 * test derives the repo root by walking two levels up from the fixture dir
 * (see prepareTypecheckDir's relative compilerOptions.paths.vue). /fixtures/* is
 * gitignored, so this is invisible to git.
 */
const FIXTURE_ROOT = join(repoRoot, "fixtures");

/** Remove a directory, tolerating Windows file-lock flakiness. */
export function removeDir(dir) {
  if (!dir) return;
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
}

/** A throwaway directory under work/harness-tests. Caller must removeDir() it. */
export function makeTempDir(prefix = "t-") {
  mkdirSync(TEMP_ROOT, { recursive: true });
  return mkdtempSync(join(TEMP_ROOT, prefix));
}

const SFC = (n) => `<script setup lang="ts">
const label = "item-${n}"
const count = ${n}
</script>

<template>
  <p class="c-${n}">{{ label }} {{ count }}</p>
</template>
`;

/**
 * A minimal corpus at <repo>/fixtures/__harness-*, i.e. exactly two levels
 * below the repo root, matching the layout the real fixtures use.
 * Returns { dir, files }. Caller must removeDir(dir).
 */
export function makeFixtureDir(count = 3, extras = {}) {
  mkdirSync(FIXTURE_ROOT, { recursive: true });
  const dir = mkdtempSync(join(FIXTURE_ROOT, "__harness-"));
  const files = [];
  for (let i = 0; i < count; i++) {
    const name = `Comp${String(i).padStart(3, "0")}.vue`;
    writeFileSync(join(dir, name), SFC(i));
    files.push(name);
  }
  for (const [name, contents] of Object.entries(extras)) {
    writeFileSync(join(dir, name), contents);
  }
  return { dir, files };
}

/** Every entry in a directory, sorted. */
export function listDir(dir) {
  return readdirSync(dir).sort();
}

/**
 * Resolve a TypeScript `types: [...]` entry the way tsc does: walk up looking
 * for node_modules/@types/<name>. Returns the names that do NOT resolve.
 *
 * Regression guard for the `types: ["node"]` bug — a type package that is not
 * an installed dependency makes every typechecker die at program construction
 * with TS2688 and check nothing, which reads as a very fast benchmark.
 */
export function unresolvableTypePackages(fromDir, types = []) {
  const missing = [];
  for (const name of types) {
    let current = fromDir;
    let found = false;
    for (;;) {
      if (existsSync(join(current, "node_modules", "@types", name))) {
        found = true;
        break;
      }
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }
    if (!found) missing.push(name);
  }
  return missing;
}

const FAKE_TOOL_SOURCE = `"use strict";
// Fake CLI for harness tests: prints canned output chosen by its cwd basename.
const fs = require("node:fs");
const path = require("node:path");
const config = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const dir = path.basename(process.cwd());
const rule =
  (config.rules || []).find((r) =>
    r.cwdBasename ? dir === r.cwdBasename : dir.includes(r.cwdIncludes),
  ) ||
  config.default ||
  {};
if (rule.stdout) process.stdout.write(String(rule.stdout) + "\\n");
if (rule.stderr) process.stderr.write(String(rule.stderr) + "\\n");
process.exit(typeof rule.code === "number" ? rule.code : 0);
`;

let fakeToolSeq = 0;

/**
 * Build a fake tool invocation for the work gate.
 *
 * `spec` is `{ default: { stdout, stderr, code }, rules: [{ cwdBasename | cwdIncludes, ... }] }`.
 * The first rule matching the cwd's basename wins, which is how a tool can be
 * made to "see" the script plant but not the template plant. Matching on the
 * basename (never the full path) keeps the fake independent of where the repo
 * happens to be checked out. Returns `{ bin, args }` for cliReportsPlantedIssue.
 *
 * `hostDir` must NOT be a plant/corpus directory — the tool's own files would
 * otherwise show up as stray inputs.
 */
export function makeFakeTool(hostDir, spec) {
  mkdirSync(hostDir, { recursive: true });
  const id = `${process.pid}-${++fakeToolSeq}`;
  const scriptPath = join(hostDir, `fake-tool-${id}.cjs`);
  const configPath = join(hostDir, `fake-tool-${id}.json`);
  writeFileSync(scriptPath, FAKE_TOOL_SOURCE);
  writeFileSync(configPath, JSON.stringify(spec));
  return { bin: process.execPath, args: [scriptPath, configPath] };
}

/** True for a markdown table separator row such as `| --- | ---: |`. */
export function isSeparatorRow(line) {
  return /^\|(\s*:?-{3,}:?\s*\|)+$/.test(line.trim());
}

/** Split a markdown row into cells, honouring `\|` escapes. */
export function splitRow(line) {
  const trimmed = line.trim();
  const parts = trimmed.split(/(?<!\\)\|/);
  // The outer pipes produce a leading and a trailing empty fragment.
  return parts.slice(1, -1).map((c) => c.trim());
}

/** Group contiguous `|`-prefixed lines into tables. */
export function collectMarkdownTables(markdown) {
  const tables = [];
  let current = null;
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("|")) {
      if (!current) {
        current = [];
        tables.push(current);
      }
      current.push(line);
    } else {
      current = null;
    }
  }
  return tables.map((lines) => ({
    lines,
    header: splitRow(lines[0]),
    separator: lines[1] ? splitRow(lines[1]) : [],
    body: lines.slice(2).map(splitRow),
  }));
}

/** Section titles rendered as `##### ...` (one per comparison class). */
export function classTitles(markdown) {
  return markdown
    .split("\n")
    .filter((l) => l.startsWith("##### "))
    .map((l) => l.slice(6).trim());
}

/** Recursively collect *.mjs files under `dir`. */
export function collectMjsFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectMjsFiles(full, out);
    else if (entry.name.endsWith(".mjs")) out.push(full);
  }
  return out;
}

/** Number of path segments — used to assert directory-depth invariants. */
export function depthOf(p) {
  return p.split(sep).filter(Boolean).length;
}
