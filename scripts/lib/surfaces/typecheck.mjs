import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, writeFileSync } from "node:fs";
import {
  collectVueFiles,
  prepareTypecheckDir,
  totalBytes,
} from "../fixtures.mjs";
import {
  measureVariants,
  resolveBin,
  runCommand,
} from "../timing.mjs";
import {
  applyWorkGate,
  corpusGateFor,
  prepareCorpusPlant,
  prepareTypecheckPlant,
  typecheckGateDetail,
} from "../work-gate.mjs";
import { resolveToolEngine, resolveTsgoBin, withTsgoEnv } from "../tsgo.mjs";

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
 * Count diagnostics a checker emitted on the timed corpus.
 *
 * The artifact census for this surface. The corpus is clean, so a healthy
 * checker reports few or none — the value of the number is that it exposes a
 * tool emitting a suspicious volume of noise (verter-tsc leaks diagnostics
 * about its own virtual code on generic components) or a tool that has
 * silently stopped analysing. Counted as `file(line,col): severity` hits,
 * which every checker here emits.
 */
function countDiagnostics(stdout = "", stderr = "") {
  const text = `${stdout}\n${stderr}`;
  const matches = text.match(/^.*\(\d+,\d+\):\s*(error|warning)/gim);
  return matches ? matches.length : 0;
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
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      package: "vue-tsc",
      notes: "Official Vue Language Tools CLI: vue-tsc --noEmit -p tsconfig.json",
      measure: () => {
        const { ms, stdout, stderr } = runCommand(
          vueTsc,
          ["--noEmit", "-p", "tsconfig.json"],
          {
            cwd: checkDir,
            allowNonZeroExit: true,
            env: baseEnv,
            shell: process.platform === "win32" && vueTsc.endsWith(".cmd"),
          },
        );
        return { ms, artifact: countDiagnostics(stdout, stderr) };
      },
    });
  } else {
    variants.push({
      id: "vue-tsc",
      label: "vue-tsc",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      package: "vue-tsc",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (golar) {
    variants.push({
      id: "golar-typecheck",
      label: "Golar typecheck",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      package: "golar",
      notes: "golar typecheck (typescript-go + @golar/vue plugin)",
      measure: () => {
        const { ms, stdout, stderr } = runCommand(golar, ["typecheck"], {
          cwd: checkDir,
          allowNonZeroExit: true,
          env: baseEnv,
          shell: process.platform === "win32" && golar.endsWith(".cmd"),
        });
        return { ms, artifact: countDiagnostics(stdout, stderr) };
      },
    });
    variants.push({
      id: "golar-default",
      label: "Golar default (lint+typecheck)",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      package: "golar",
      notes: "golar default mode runs lint then typecheck — not a pure typecheck",
      measure: () => {
        const { ms, stdout, stderr } = runCommand(golar, [], {
          cwd: checkDir,
          allowNonZeroExit: true,
          env: baseEnv,
          shell: process.platform === "win32" && golar.endsWith(".cmd"),
        });
        return { ms, artifact: countDiagnostics(stdout, stderr) };
      },
    });
  } else {
    variants.push({
      id: "golar-typecheck",
      label: "Golar typecheck",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      package: "golar",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (vize) {
    variants.push({
      id: "vize-check",
      label: "Vize check",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      package: "vize",
      notes: "vize check . --tsconfig tsconfig.json (native + Corsa when available)",
      measure: () => {
        const { ms, stdout, stderr } = runCommand(
          vize,
          ["check", ".", "--tsconfig", "tsconfig.json"],
          {
            cwd: checkDir,
            allowNonZeroExit: true,
            env: baseEnv,
            shell: process.platform === "win32" && vize.endsWith(".cmd"),
          },
        );
        return { ms, artifact: countDiagnostics(stdout, stderr) };
      },
    });
  } else {
    variants.push({
      id: "vize-check",
      label: "Vize check",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      package: "vize",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (verterTsc && tsgo.bin) {
    variants.push({
      id: "verter-tsc",
      label: "verter-tsc",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      package: "verter-tsc",
      notes: `verter-tsc --noEmit -p tsconfig.json · tsgo ${tsgo.version ?? "?"} (${tsgo.source})`,
      measure: () => {
        const { ms, stdout, stderr } = runCommand(
          verterTsc,
          ["--noEmit", "-p", "tsconfig.json"],
          {
            cwd: checkDir,
            allowNonZeroExit: true,
            env: baseEnv,
            shell: process.platform === "win32" && verterTsc.endsWith(".cmd"),
          },
        );
        return { ms, artifact: countDiagnostics(stdout, stderr) };
      },
    });
  } else if (verterTsc && !tsgo.bin) {
    variants.push({
      id: "verter-tsc",
      label: "verter-tsc",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      package: "verter-tsc",
      notes: `Skipped: ${tsgo.notes}. Install typescript-go (typescript@7.0.2) or set VERTER_TSGO_BIN.`,
      skip: true,
    });
  } else {
    variants.push({
      id: "verter-tsc",
      label: "verter-tsc",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
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

  // Stamp the underlying TypeScript engine onto every row. Engines are ranked
  // separately — see classKey() — because a JS-engine checker and a native
  // tsgo checker are not measuring the same thing.
  for (const v of variants) {
    const e = resolveToolEngine(v.id, rootDir);
    v.engine = e.engine;
    v.notes = `${v.notes || ""} | engine: ${e.label}`.trim();
  }

  // How to invoke each tool for gating. `alt` is a fallback invocation for
  // tools whose primary flag form is flaky on some platforms.
  const gateSpecs = {
    "vue-tsc": vueTsc && { bin: vueTsc, args: ["--noEmit", "-p", "tsconfig.json"] },
    "golar-typecheck": golar && { bin: golar, args: ["typecheck"] },
    "golar-default": golar && { bin: golar, args: [] },
    "vize-check": vize && {
      // Plain `check .` first — Vize discovers via tsconfig include and
      // `--tsconfig` can race Corsa IO on Windows plant dirs.
      bin: vize,
      args: ["check", "."],
      alt: ["check", ".", "--tsconfig", "tsconfig.json"],
    },
    "verter-tsc": verterTsc && { bin: verterTsc, args: ["--noEmit", "-p", "tsconfig.json"] },
  };

  // Work gate, two stages. A tool is ranked only if it reports:
  //   1. a script-level AND a template-level planted error (1-file projects), and
  //   2. a planted error in the full timed corpus under the timed tsconfig.
  const plant = prepareTypecheckPlant(workRoot);
  const corpusPlant = prepareCorpusPlant(checkDir);
  const gateReport = {};
  try {
    applyWorkGate(variants, (v) => {
      const spec = gateSpecs[v.id];
      if (!spec) return true;
      const opts = { shell: isWinShell(spec.bin), env: baseEnv };

      let detail = typecheckGateDetail(spec.bin, spec.args, plant, opts);
      let args = spec.args;
      if (!detail.ok && spec.alt) {
        const altDetail = typecheckGateDetail(spec.bin, spec.alt, plant, opts);
        if (altDetail.ok) {
          detail = altDetail;
          args = spec.alt;
        }
      }

      const corpus = detail.ok
        ? corpusGateFor(spec.bin, args, corpusPlant, {
            shell: isWinShell(spec.bin),
            env: { ...baseEnv, NODE_PATH: nodePath },
          })
        : false;

      gateReport[v.id] = { ...detail, corpus };
      if (!detail.script) v.gateMissed = "script-level plant";
      else if (!detail.templateProp && !detail.templateEvent)
        v.gateMissed = "both template plants (does not typecheck templates)";
      else if (!detail.templateProp)
        v.gateMissed = "template prop-type plant (:disabled string→boolean)";
      else if (!detail.templateEvent)
        v.gateMissed = "template event-handler plant (@click number→function)";
      else if (!corpus) v.gateMissed = "planted bug in full corpus";
      return detail.ok && corpus;
    });
  } finally {
    plant.cleanup();
    corpusPlant.cleanup();
  }

  for (const v of variants) {
    const g = gateReport[v.id];
    if (!g) continue;
    v.notes =
      `${v.notes || ""} | gate: script=${g.script ? "✓" : "✗"} tmpl-prop=${g.templateProp ? "✓" : "✗"} tmpl-event=${g.templateEvent ? "✓" : "✗"} corpus=${g.corpus ? "✓" : "✗"}`.trim();
    if (v.gateMissed) v.notes += ` (missed ${v.gateMissed})`;
  }

  const results = await measureVariants(variants, {
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
      "Each measurement is a full CLI process invocation — every tool here is a CLI, so process startup is paid by all of them equally.",
      "Warm runs still benefit from OS page cache of source files and node_modules.",
      "Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.",
      "Work gate has three parts, all required to be ranked: (1) a script-only planted error, (2) a template-only planted error with strictTemplates — proving the tool actually typechecks templates and does not just run tsc over extracted script blocks, and (3) the same planted bug re-detected in the FULL timed corpus under the timed tsconfig, proving the tool does not degrade at scale.",
      "Per-tool gate results are shown in Notes as script/template/corpus ✓✗.",
      "verter-tsc requires stable tsgo (typescript@7.0.x / typescript-go); set via VERTER_TSGO_BIN.",
      "Diagnostic equivalence is NOT asserted — this is a throughput benchmark, not a correctness suite.",
      "golar default mode includes linting; golar typecheck is pure typecheck.",
      "Allow non-zero exit codes: generated fixtures may surface tool-specific diagnostics.",
    ],
    variants: results,
  };
}
