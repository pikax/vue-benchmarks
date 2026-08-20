#!/usr/bin/env node
import { createRequire } from "node:module";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runEslintWorkers } from "./lint-eslint-workers.mjs";
import { lintCliCommand } from "./lint-row-specs.mjs";
import {
  LINT_VALIDITY_PLANTS,
  LINT_VALIDITY_SUITE_HASH,
  LINT_VALIDITY_SUITE_VERSION,
  judgeLintPair,
} from "./lint-validity-plants.mjs";
import { resolveBin, runCommand } from "./timing.mjs";
import { stripAnsi } from "./real-world/ansi.mjs";

export const LINT_VALIDITY_JSON_PREFIX = "@@LINT_VALIDITY_JSON@@";
const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function copyConfig(configRoot, cwd) {
  mkdirSync(join(cwd, ".git"), { recursive: true });
  for (const name of ["eslint.config.mjs", "biome.json", ".oxlintrc.json", "package.json"]) {
    try {
      cpSync(join(configRoot, name), join(cwd, name));
    } catch {
      // Missing optional config is preserved as missing; the exact invocation
      // must prove itself under the same files that the timed corpus had.
    }
  }
}

function eslintDiagnostics(results) {
  return results.flatMap((result) =>
    (result.messages ?? []).map((message) => ({
      file: result.filePath,
      line: message.line,
      column: message.column,
      rule: message.ruleId,
      message: message.message,
      raw: `${result.filePath}:${message.line}:${message.column} ${message.ruleId ?? ""} ${message.message}`,
    })),
  );
}

function lineOfDiagnostic(diagnostic) {
  const zeroBased = diagnostic?.range?.start?.line ?? diagnostic?.start?.line;
  if (Number.isFinite(zeroBased)) return zeroBased + 1;
  return diagnostic?.line ?? diagnostic?.location?.line ?? diagnostic?.span?.start?.line;
}

function verterDiagnostics(output, filename, source) {
  const list = Array.isArray(output) ? output : (output?.diagnostics ?? []);
  return list.map((diagnostic) => ({
    file: diagnostic.file ?? diagnostic.filename ?? diagnostic.path ?? filename,
    line:
      lineOfDiagnostic(diagnostic) ??
      (Number.isFinite(diagnostic.spanStart)
        ? source.slice(0, diagnostic.spanStart).split(/\r?\n/).length
        : undefined),
    rule: diagnostic.code ?? diagnostic.rule ?? diagnostic.ruleId,
    message: String(diagnostic.message ?? diagnostic.description ?? ""),
    raw: JSON.stringify(diagnostic),
  }));
}

function cliDiagnostics(raw) {
  const diagnostics = [];
  const text = stripAnsi(raw);
  const vizePattern = /(?:⚠|×|✖|✗)\s*\[([^\]]+)]\s*([^\r\n]+)[\s\S]*?([^\s]+\.vue):(\d+):(\d+)/g;
  for (const match of text.matchAll(vizePattern)) {
    diagnostics.push({
      file: match[3],
      line: Number(match[4]),
      column: Number(match[5]),
      rule: match[1],
      message: match[2],
      raw: match[0],
    });
  }
  if (diagnostics.length) return diagnostics;
  let currentFile = null;
  for (const line of text.split(/\r?\n/)) {
    const header = line.trim().match(/^(.*\.vue)$/i);
    if (header) {
      currentFile = header[1];
      continue;
    }
    const stylish = line.match(/^\s*(\d+):(\d+)\s+(?:error|warning)\s+(.+?)\s+([^\s]+)\s*$/i);
    if (stylish && currentFile) {
      diagnostics.push({
        file: currentFile,
        line: Number(stylish[1]),
        column: Number(stylish[2]),
        message: stylish[3],
        rule: stylish[4],
        raw: `${currentFile}\n${line}`,
      });
      continue;
    }
    const inline = line.match(/([^\s:]+\.vue):(\d+):(\d+)\s*(.*)$/i);
    if (inline) {
      diagnostics.push({
        file: inline[1],
        line: Number(inline[2]),
        column: Number(inline[3]),
        message: inline[4],
        raw: line,
      });
    }
  }
  return diagnostics.length ? diagnostics : raw.trim() ? [{ raw, message: raw }] : [];
}

async function runEntrypoint(entrypoint, cwd, relativeFiles) {
  const filenames = relativeFiles.map((relativeFile) => join(cwd, relativeFile));
  if (entrypoint === "eslint-plugin-vue-1t") {
    const { ESLint } = await import("eslint");
    const eslint = new ESLint({ overrideConfigFile: join(cwd, "eslint.config.mjs"), cwd });
    return eslintDiagnostics(await eslint.lintFiles(filenames));
  }
  if (entrypoint === "eslint-plugin-vue-workers") {
    const eslintPath = require.resolve("eslint", { paths: [rootDir] });
    return eslintDiagnostics(await runEslintWorkers(cwd, relativeFiles, eslintPath));
  }
  if (entrypoint === "verter-lint-host") {
    const verter = require(require.resolve("@verter/native", { paths: [rootDir] }));
    if (typeof verter.VerterHost !== "function") throw new Error("VerterHost missing");
    const host = new verter.VerterHost({ devMode: false });
    try {
      if (typeof host.upsert !== "function" || typeof host.lint !== "function") {
        throw new Error("VerterHost upsert/lint API incomplete");
      }
      const diagnostics = [];
      for (const filename of filenames) {
        const source = require("node:fs").readFileSync(filename, "utf8");
        const path = filename.replaceAll("\\", "/");
        host.upsert({ inputId: path, canonicalId: path, source, fileKind: "vue" });
        diagnostics.push(...verterDiagnostics(host.lint(path), path, source));
      }
      return diagnostics;
    } finally {
      host.close?.();
    }
  }
  const command = lintCliCommand(entrypoint);
  if (!command) throw new Error(`unknown lint entrypoint ${entrypoint}`);
  const bin = resolveBin(command.bin, rootDir);
  const run = runCommand(bin, command.args, {
    cwd,
    env: command.env,
    shell: process.platform === "win32" && bin.endsWith(".cmd"),
    allowNonZeroExit: true,
  });
  const raw = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;
  // Exit status alone is deliberately not evidence. The differential oracle
  // below requires the output itself to name the file, line and rule/concept.
  return cliDiagnostics(raw);
}

async function main() {
  const entrypoint = arg("--entrypoint");
  const configRoot = arg("--config-root");
  if (!entrypoint || !configRoot) throw new Error("--entrypoint and --config-root are required");
  const base = join(rootDir, "work", "lint-validity", `${process.pid}-${entrypoint}`);
  rmSync(base, { recursive: true, force: true });
  const results = [];
  try {
    const runs = {};
    const relativeFiles = LINT_VALIDITY_PLANTS.map((plant, plantIndex) =>
      join("nested", String(plantIndex).padStart(2, "0"), plant.id, "Plant.vue"),
    );
    for (const polarity of ["dirty", "clean"]) {
      const cwd = join(base, polarity);
      copyConfig(configRoot, cwd);
      for (const [plantIndex, plant] of LINT_VALIDITY_PLANTS.entries()) {
        const relativeFile = relativeFiles[plantIndex];
        mkdirSync(dirname(join(cwd, relativeFile)), { recursive: true });
        writeFileSync(join(cwd, relativeFile), plant[polarity]);
      }
      runs[polarity] = await runEntrypoint(entrypoint, cwd, relativeFiles);
    }
    for (const [plantIndex, plant] of LINT_VALIDITY_PLANTS.entries()) {
      const expectedFile = relativeFiles[plantIndex].replaceAll("\\", "/");
      const judged = judgeLintPair(plant, runs.dirty, runs.clean, expectedFile);
      results.push({
        id: plant.id,
        coverage: plant.coverage,
        status: judged.ok ? "PASS" : "FAIL",
        dirtyMatches: judged.dirtyMatches,
        cleanMatches: judged.cleanMatches,
        dirtyEvidence: judged.dirtyEvidence,
        cleanEvidence: judged.cleanEvidence,
        detail: judged.failures.join("; ") || "dirty diagnostic attributed; clean twin cleared",
      });
    }
  } finally {
    rmSync(base, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  }
  const passed = results.filter((result) => result.status === "PASS").length;
  emit({
    schemaVersion: 1,
    suiteVersion: LINT_VALIDITY_SUITE_VERSION,
    suiteHash: LINT_VALIDITY_SUITE_HASH,
    entrypoint,
    exactPath:
      entrypoint === "eslint-plugin-vue-1t"
        ? "new ESLint(exact timed config/cwd).lintFiles"
        : entrypoint === "eslint-plugin-vue-workers"
          ? "exact worker_threads ESLint fan-out"
          : entrypoint === "verter-lint-host"
            ? "fresh VerterHost upsert + lint"
            : `${lintCliCommand(entrypoint)?.bin} ${lintCliCommand(entrypoint)?.args.join(" ")} ${Object.entries(
                lintCliCommand(entrypoint)?.env ?? {},
              )
                .map(([key, value]) => `${key}=${value}`)
                .join(" ")}`.trim(),
    status: passed === results.length ? "PASS" : "FAIL",
    plantCount: results.length,
    passed,
    failed: results.length - passed,
    unknown: 0,
    results,
  });
}

function emit(payload) {
  process.stdout.write(`${LINT_VALIDITY_JSON_PREFIX}${JSON.stringify(payload)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    emit({
      schemaVersion: 1,
      suiteVersion: LINT_VALIDITY_SUITE_VERSION,
      suiteHash: LINT_VALIDITY_SUITE_HASH,
      entrypoint: arg("--entrypoint"),
      status: /not found|missing|incomplete/i.test(String(error?.message ?? error))
        ? "UNKNOWN"
        : "FAIL",
      reason: error instanceof Error ? (error.stack ?? error.message) : String(error),
    });
  });
}
