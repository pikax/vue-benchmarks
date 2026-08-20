#!/usr/bin/env node
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBin, runCommand } from "./timing.mjs";
import { formatConfigFiles, formatRowCommand } from "./format-row-specs.mjs";
import {
  FORMAT_VALIDITY_PLANTS,
  FORMAT_VALIDITY_SUITE_HASH,
  FORMAT_VALIDITY_SUITE_VERSION,
  judgeFormattedPlant,
} from "./format-validity-plants.mjs";

export const FORMAT_VALIDITY_JSON_PREFIX = "@@FORMAT_VALIDITY_JSON@@";
const require = createRequire(import.meta.url);
const { parse } = require("@vue/compiler-sfc");
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function main() {
  const entrypoint = arg("--entrypoint");
  const command = formatRowCommand(entrypoint);
  if (!command) throw new Error(`unknown format entrypoint ${entrypoint}`);
  let bin;
  try {
    bin = resolveBin(command.bin, rootDir);
  } catch (error) {
    emit({
      entrypoint,
      status: "UNKNOWN",
      reason: error instanceof Error ? error.message : String(error),
    });
    return;
  }
  const dir = join(rootDir, "work", "format-validity", `${process.pid}-${entrypoint}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, ".git"), { recursive: true });
  for (const [name, content] of Object.entries(formatConfigFiles()))
    writeFileSync(join(dir, name), content);
  const originals = new Map();
  for (const plant of FORMAT_VALIDITY_PLANTS) {
    const relative = join("nested", plant.id, "Plant.vue");
    const filename = join(dir, relative);
    mkdirSync(dirname(filename), { recursive: true });
    writeFileSync(filename, plant.source);
    originals.set(plant.id, { filename, source: plant.source });
  }
  const shell = process.platform === "win32" && bin.endsWith(".cmd");
  try {
    const firstRun = runCommand(bin, command.args, { cwd: dir, shell, allowNonZeroExit: true });
    const first = new Map(
      FORMAT_VALIDITY_PLANTS.map((plant) => [
        plant.id,
        readFileSync(originals.get(plant.id).filename, "utf8"),
      ]),
    );
    const secondRun = runCommand(bin, command.args, { cwd: dir, shell, allowNonZeroExit: true });
    const results = FORMAT_VALIDITY_PLANTS.map((plant) => {
      const judged = judgeFormattedPlant({
        plant,
        original: originals.get(plant.id).source,
        first: first.get(plant.id),
        second: readFileSync(originals.get(plant.id).filename, "utf8"),
        parse,
      });
      if (firstRun.status !== 0)
        judged.failures.unshift(`first exact invocation exited ${firstRun.status}`);
      if (secondRun.status !== 0)
        judged.failures.unshift(`second exact invocation exited ${secondRun.status}`);
      return {
        id: plant.id,
        coverage: plant.coverage,
        status: judged.failures.length ? "FAIL" : "PASS",
        detail:
          judged.failures.join("; ") || "semantic projections preserved; exact pass idempotent",
      };
    });
    const passed = results.filter((result) => result.status === "PASS").length;
    emit({
      schemaVersion: 1,
      suiteVersion: FORMAT_VALIDITY_SUITE_VERSION,
      suiteHash: FORMAT_VALIDITY_SUITE_HASH,
      entrypoint,
      exactPath: `${command.bin} ${command.args.join(" ")} (nested directory, shared benchmark configs, twice)`,
      status: passed === results.length ? "PASS" : "FAIL",
      plantCount: results.length,
      passed,
      failed: results.length - passed,
      unknown: 0,
      results,
    });
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  }
}

function emit(payload) {
  process.stdout.write(`${FORMAT_VALIDITY_JSON_PREFIX}${JSON.stringify(payload)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    main();
  } catch (error) {
    emit({
      schemaVersion: 1,
      suiteVersion: FORMAT_VALIDITY_SUITE_VERSION,
      suiteHash: FORMAT_VALIDITY_SUITE_HASH,
      entrypoint: arg("--entrypoint"),
      status: "FAIL",
      reason: error instanceof Error ? (error.stack ?? error.message) : String(error),
    });
  }
}
