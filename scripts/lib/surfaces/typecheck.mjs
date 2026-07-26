import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, writeFileSync } from "node:fs";
import {
  collectVueFiles,
  prepareTypecheckDir,
  totalBytes,
} from "../fixtures.mjs";
import {
  measureVariantsAlternating,
  resolveBin,
  runCommand,
} from "../timing.mjs";
import {
  applyWorkGate,
  prepareTypecheckPlant,
  typecheckGateFor,
} from "../work-gate.mjs";
import { resolveTsgoBin, withTsgoEnv } from "../tsgo.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

function isWinShell(bin) {
  return process.platform === "win32" && bin.endsWith(".cmd");
}

/**
 * Typecheck surface — CLI tools only (process-level).
 * Each run uses the same fixture directory and tsconfig.
 *
 * Tool paths differ (also written into the report):
 * - vue-tsc uses TypeScript (JS) language service path
 * - golar uses typescript-go + @golar/vue (official language-core plugin)
 * - vize check uses native checker + optional Corsa/tsgo
 * - verter-tsc is a native vue-tsc replacement (needs stable tsgo / typescript@7.0.x)
 * These are not bit-identical checkers; timings measure "typecheck this project" throughput.
 */
export async function runTypecheckSurface(fixtureDir, options) {
  const files = collectVueFiles(
    fixtureDir,
    options.checkFileLimit ?? options.fileLimit,
  );
  const bytes = totalBytes(fixtureDir, files);
  const workRoot = options.workRoot;
  const checkDir = prepareTypecheckDir(
    fixtureDir,
    files,
    workRoot,
    `n${files.length}`,
  );

  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");

  const baseEnv = withTsgoEnv({ NODE_PATH: nodePath }, rootDir);
  const tsgo = resolveTsgoBin(rootDir);

  const vueTsc = tryResolveBin("vue-tsc");
  const vize = tryResolveBin("vize");
  const verterTsc = tryResolveBin("verter-tsc");
  const golar = tryResolveBin("golar");

  const variants = [];

  if (vueTsc) {
    variants.push({
      id: "vue-tsc",
      label: "vue-tsc",
      package: "vue-tsc",
      notes: "Official Vue Language Tools CLI: vue-tsc --noEmit -p tsconfig.json",
      measure: () => {
        const { ms } = runCommand(
          vueTsc,
          ["--noEmit", "-p", "tsconfig.json"],
          {
            cwd: checkDir,
            allowNonZeroExit: true,
            env: baseEnv,
            shell: process.platform === "win32" && vueTsc.endsWith(".cmd"),
          },
        );
        return ms;
      },
    });
  } else {
    variants.push({
      id: "vue-tsc",
      label: "vue-tsc",
      package: "vue-tsc",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (golar) {
    variants.push({
      id: "golar-typecheck",
      label: "Golar typecheck",
      package: "golar",
      notes: "golar typecheck (typescript-go + @golar/vue plugin)",
      measure: () => {
        const { ms } = runCommand(golar, ["typecheck"], {
          cwd: checkDir,
          allowNonZeroExit: true,
          env: baseEnv,
          shell: process.platform === "win32" && golar.endsWith(".cmd"),
        });
        return ms;
      },
    });
    variants.push({
      id: "golar-default",
      label: "Golar default (lint+typecheck)",
      package: "golar",
      notes: "golar default mode runs lint then typecheck — not a pure typecheck",
      measure: () => {
        const { ms } = runCommand(golar, [], {
          cwd: checkDir,
          allowNonZeroExit: true,
          env: baseEnv,
          shell: process.platform === "win32" && golar.endsWith(".cmd"),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "golar-typecheck",
      label: "Golar typecheck",
      package: "golar",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (vize) {
    variants.push({
      id: "vize-check",
      label: "Vize check",
      package: "vize",
      notes: "vize check . --tsconfig tsconfig.json (native + Corsa when available)",
      measure: () => {
        const { ms } = runCommand(
          vize,
          ["check", ".", "--tsconfig", "tsconfig.json"],
          {
            cwd: checkDir,
            allowNonZeroExit: true,
            env: baseEnv,
            shell: process.platform === "win32" && vize.endsWith(".cmd"),
          },
        );
        return ms;
      },
    });
  } else {
    variants.push({
      id: "vize-check",
      label: "Vize check",
      package: "vize",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (verterTsc && tsgo.bin) {
    variants.push({
      id: "verter-tsc",
      label: "verter-tsc",
      package: "verter-tsc",
      notes: `verter-tsc --noEmit -p tsconfig.json · tsgo ${tsgo.version ?? "?"} (${tsgo.source})`,
      measure: () => {
        const { ms } = runCommand(
          verterTsc,
          ["--noEmit", "-p", "tsconfig.json"],
          {
            cwd: checkDir,
            allowNonZeroExit: true,
            env: baseEnv,
            shell: process.platform === "win32" && verterTsc.endsWith(".cmd"),
          },
        );
        return ms;
      },
    });
  } else if (verterTsc && !tsgo.bin) {
    variants.push({
      id: "verter-tsc",
      label: "verter-tsc",
      package: "verter-tsc",
      notes: `Skipped: ${tsgo.notes}. Install typescript-go (typescript@7.0.2) or set VERTER_TSGO_BIN.`,
      skip: true,
    });
  } else {
    variants.push({
      id: "verter-tsc",
      label: "verter-tsc",
      package: "verter-tsc",
      notes: "Binary not found",
      skip: true,
    });
  }

  writeFileSync(
    join(checkDir, "BENCH_NOTE.txt"),
    [
      `files=${files.length}`,
      `vue-tsc=${vueTsc ?? "missing"}`,
      `golar=${golar ?? "missing"}`,
      `vize=${vize ?? "missing"}`,
      `verter-tsc=${verterTsc ?? "missing"}`,
      `tsgo=${tsgo.bin ?? "missing"} (${tsgo.source})`,
      `exists.tsconfig=${existsSync(join(checkDir, "tsconfig.json"))}`,
    ].join("\n"),
  );

  // Work gate: tools that do not report a planted type error are unranked.
  const plant = prepareTypecheckPlant(workRoot);
  try {
    applyWorkGate(variants, (v) => {
      if (v.id === "vue-tsc" && vueTsc) {
        return typecheckGateFor(
          vueTsc,
          ["--noEmit", "-p", "tsconfig.json"],
          plant,
          { shell: isWinShell(vueTsc), env: baseEnv },
        );
      }
      if (v.id === "golar-typecheck" && golar) {
        return typecheckGateFor(golar, ["typecheck"], plant, {
          shell: isWinShell(golar),
          env: baseEnv,
        });
      }
      if (v.id === "golar-default" && golar) {
        return typecheckGateFor(golar, [], plant, {
          shell: isWinShell(golar),
          env: baseEnv,
        });
      }
      if (v.id === "vize-check" && vize) {
        return (
          typecheckGateFor(vize, ["check", "."], plant, {
            shell: isWinShell(vize),
            env: baseEnv,
          }) ||
          typecheckGateFor(
            vize,
            ["check", ".", "--tsconfig", "tsconfig.json"],
            plant,
            { shell: isWinShell(vize), env: baseEnv },
          )
        );
      }
      if (v.id === "verter-tsc" && verterTsc) {
        return typecheckGateFor(
          verterTsc,
          ["--noEmit", "-p", "tsconfig.json"],
          plant,
          { shell: isWinShell(verterTsc), env: baseEnv },
        );
      }
      return true;
    });
  } finally {
    plant.cleanup();
  }

  const results = await measureVariantsAlternating(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });

  return {
    id: "typecheck",
    label: "Typecheck",
    files: files.length,
    bytes,
    methodology: [
      "Same on-disk fixture directory and tsconfig for every tool.",
      "Default check file limit is smaller than compile corpus (typecheck cost scales steeply).",
      "Each measurement is a full CLI process invocation (tool-cache cold per process start).",
      "Warm runs still benefit from OS page cache of source files and node_modules.",
      "Measured runs alternate tool order each iteration.",
      "Planted-bug work gate: each tool must report a deliberate type error or is unranked.",
      "verter-tsc requires stable tsgo (typescript@7.0.x / typescript-go); set via VERTER_TSGO_BIN.",
      "Diagnostic equivalence is NOT asserted — this is a throughput benchmark, not a correctness suite.",
      "golar default mode includes linting; golar typecheck is pure typecheck.",
      "Allow non-zero exit codes: generated fixtures may surface tool-specific diagnostics.",
    ],
    variants: results,
  };
}
