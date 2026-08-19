/**
 * Typecheck confirmation plants.
 * Each case is a mini project under fixtures/typecheck/cases/<id>/.
 * Tools are judged independently (expectErrors true/false + optional mustMatch).
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSuite } from "../lib/harness.mjs";
import { resolveSpawnable, runCliMeasured, rootDir } from "../lib/run-cli.mjs";
import { effectiveWarmups, median } from "../../../scripts/lib/timing.mjs";
import {
  combinedFromDiags,
  diagsForCase,
  isToolBootstrapFailure,
  parseDiagnostics,
  scoreDiagnostics,
} from "../lib/diagnostics.mjs";
import { findExpectErrorPins, stripExpectErrorDirectives } from "../lib/plant-pins.mjs";
import {
  VERTER_TS_IMPORT_EXTRA_COMPILER_OPTIONS,
  verterExtraTsconfigWarning,
  verterSkippedTsImporter,
} from "../lib/ts-import-vue.mjs";
import {
  FALLTHROUGH_EXTRA_VUE_COMPILER_OPTIONS,
  scoreFallthroughPair,
} from "../lib/fallthrough-attrs.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const casesRoot = join(__dirname, "../fixtures/typecheck/cases");
const sharedRoot = join(__dirname, "../fixtures/typecheck/_shared");
const workRoot = join(rootDir, "work", "confirm-typecheck");
const allPlantsRoot = join(rootDir, "work", "confirm-typecheck-all");

function listCases() {
  return readdirSync(casesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function prepareCase(caseId) {
  const src = join(casesRoot, caseId);
  const dest = join(workRoot, caseId);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });

  // copy case files
  cpSync(src, dest, { recursive: true });

  // shared env + tsconfig
  cpSync(join(sharedRoot, "env.d.ts"), join(dest, "env.d.ts"));
  const base = JSON.parse(readFileSync(join(sharedRoot, "tsconfig.base.json"), "utf8"));
  const caseTsconfigPath = join(src, "tsconfig.json");
  const overlay = existsSync(caseTsconfigPath)
    ? JSON.parse(readFileSync(caseTsconfigPath, "utf8"))
    : {};
  // Shared tsconfig is what every tool is judged on. Do NOT add
  // allowArbitraryExtensions / allowImportingTsExtensions here — those are
  // extra flags only verter-tsc has been observed to need for a .ts→.vue
  // import, and applying them to everyone would hide that. The verter retry
  // writes tsconfig.verter-extra.json and records a warn.
  base.compilerOptions = {
    ...base.compilerOptions,
    ...(overlay.compilerOptions || {}),
    paths: {
      vue: [join(rootDir, "node_modules/vue").replace(/\\/g, "/")],
      "vue/*": [join(rootDir, "node_modules/vue/*").replace(/\\/g, "/")],
    },
  };
  if (overlay.include) base.include = overlay.include;
  // Case-local vueCompilerOptions (e.g. fallthroughAttributes) must merge
  // onto the shared strictTemplates default. They are never applied globally:
  // existing unknown-attr plants expect the default (no fallthrough typing).
  if (overlay.vueCompilerOptions) {
    base.vueCompilerOptions = {
      ...(base.vueCompilerOptions || {}),
      ...overlay.vueCompilerOptions,
    };
  }
  // Keep tool-only configs out of typecheck include
  base.exclude = ["golar.config.ts", "node_modules"];
  writeFileSync(join(dest, "tsconfig.json"), JSON.stringify(base, null, 2));
  writeFileSync(
    join(dest, "package.json"),
    JSON.stringify(
      {
        name: `confirm-${caseId}`,
        private: true,
        type: "module",
        dependencies: {
          vue: "file:" + join(rootDir, "node_modules/vue").replace(/\\/g, "/"),
        },
      },
      null,
      2,
    ),
  );

  // NOTE: do not junction root node_modules here — Vize/Corsa hits
  // "Access is denied" on Windows junctions for this work tree. Resolution
  // uses compilerOptions.paths + NODE_PATH from runCli instead.

  // golar config (matched to repo fixtures)
  writeFileSync(
    join(dest, "golar.config.ts"),
    `import { defineConfig } from "golar/unstable";\nimport "@golar/vue";\nexport default defineConfig({});\n`,
  );

  const meta = JSON.parse(readFileSync(join(src, "meta.json"), "utf8"));
  const pins = findExpectErrorPins(src);
  // @plant-error is a harness pin, not a compiler directive. Strip it so
  // line numbers of the bad code stay put. Real // @ts-expect-error in .ts
  // (unused-directive plants) is never stripped.
  if (pins.length && meta.expectErrors) stripExpectErrorDirectives(dest);
  return { dest, meta, pins: meta.expectErrors ? pins : [] };
}

/** Isolated extra tsconfig for the verter-tsc retry — never mutates tsconfig.json. */
function writeVerterExtraTsconfig(dest) {
  const shared = JSON.parse(readFileSync(join(dest, "tsconfig.json"), "utf8"));
  shared.compilerOptions = {
    ...shared.compilerOptions,
    ...VERTER_TS_IMPORT_EXTRA_COMPILER_OPTIONS,
  };
  const rel = "tsconfig.verter-extra.json";
  writeFileSync(join(dest, rel), JSON.stringify(shared, null, 2));
  return rel;
}

/**
 * Isolated extra tsconfig that enables Volar's fallthroughAttributes opt-in.
 * Never written over tsconfig.json — a tool that only works with this file
 * is scored as warn, not pass.
 */
function writeFallthroughExtraTsconfig(dest) {
  const shared = JSON.parse(readFileSync(join(dest, "tsconfig.json"), "utf8"));
  shared.vueCompilerOptions = {
    ...(shared.vueCompilerOptions || {}),
    ...FALLTHROUGH_EXTRA_VUE_COMPILER_OPTIONS,
  };
  const rel = "tsconfig.fallthrough.json";
  writeFileSync(join(dest, rel), JSON.stringify(shared, null, 2));
  return rel;
}

function resourcesFrom(run) {
  const out = {};
  if (Number.isFinite(run?.ms)) out.ms = Number(run.ms.toFixed(1));
  if (Number.isFinite(run?.rssBytes) && run.rssBytes > 0) {
    out.rssMb = Number((run.rssBytes / (1024 * 1024)).toFixed(1));
  }
  return out;
}

function scoreOpts(meta, result) {
  return {
    combined: result.combined,
    status: result.status,
    expectErrors: meta.expectErrors,
    minErrors: meta.minErrors ?? 1,
    maxErrors: meta.maxErrors,
    mustMatch: meta.mustMatch,
    mustNotMatch: meta.mustNotMatch,
    expectFile: meta.expectFile,
    expectLine: meta.expectLine,
    expectCode: meta.expectCode,
    pins: meta._pins || [],
    expectMention: meta.expectMention,
  };
}

function scoreOne(meta, result) {
  if (!meta.expectErrors) {
    const leaks = findVirtualCodeLeaks(result.combined);
    if (leaks.length) {
      return {
        ok: false,
        message: `clean fixture: diagnostic describes the tool's own generated code — ${leaks[0].trim().slice(0, 200)}`,
      };
    }
  }
  return scoreDiagnostics(scoreOpts(meta, result));
}

/**
 * Capability tags for plants (`meta.requires`).
 * Tools without a required capability skip that plant (not a silent pass).
 * `*` means all plants.
 *
 * Observed gap: Vize/Corsa currently does not flag undeclared component attrs
 * the way Volar strictTemplates does — those plants require strict-component-attrs.
 */
const TOOL_CAPABILITIES = {
  "vue-tsc": ["*"],
  "golar-typecheck": ["*"],
  "vize-check": [
    "script-types",
    "template-bindings",
    "prop-types",
    "v-if-narrow",
    "emits",
    "v-model",
    "dom-events",
  ],
  "verter-tsc": ["*"],
};

/**
 * Virtual-code identifier prefixes. Every Vue typechecker rewrites SFCs into
 * generated TS before handing them to the checker.
 *
 * On a *clean* fixture any diagnostic is already wrong; one that also names the
 * tool's own generated code is diagnosing its own codegen rather than the
 * author's source, which is worth calling out by name. Dirty fixtures are
 * deliberately not checked: naming a virtual symbol inside an otherwise correct
 * diagnostic (e.g. Volar's `'__VLS_ctx.user' is possibly 'null'`) is a message
 * wart, not a failure to do the work.
 */
const VIRTUAL_CODE_MARKERS = ["__VLS_", "___VERTER___", "__vize_", "__golar_"];

/** @returns {string[]} diagnostic lines that leak a virtual-code identifier */
function findVirtualCodeLeaks(combined) {
  if (!combined) return [];
  return combined
    .split(/\r?\n/)
    .filter((line) => /error\s+TS\d+/i.test(line))
    .filter((line) => VIRTUAL_CODE_MARKERS.some((marker) => line.includes(marker)));
}

function toolSupports(toolId, requires) {
  if (!requires?.length) return true;
  const caps = TOOL_CAPABILITIES[toolId] || [];
  if (caps.includes("*")) return true;
  return requires.every((r) => caps.includes(r));
}

function toolRunners(cwd, { timeout = 120_000 } = {}) {
  const vueTsc = resolveSpawnable("vue-tsc");
  const vize = resolveSpawnable("vize");
  const verterTsc = resolveSpawnable("verter-tsc");
  const golar = resolveSpawnable("golar");

  return [
    {
      id: "vue-tsc",
      available: Boolean(vueTsc),
      run: () => runCliMeasured(vueTsc, ["--noEmit", "-p", "tsconfig.json"], { cwd, timeout }),
      runProject: (rel) => runCliMeasured(vueTsc, ["--noEmit", "-p", rel], { cwd, timeout }),
      unavailable: "vue-tsc binary not found",
    },
    {
      id: "vize-check",
      available: Boolean(vize),
      run: () => runCliMeasured(vize, ["check", ".", "--tsconfig", "tsconfig.json"], { cwd, timeout }),
      runProject: (rel) => runCliMeasured(vize, ["check", ".", "--tsconfig", rel], { cwd, timeout }),
      unavailable: "vize binary not found",
    },
    {
      id: "verter-tsc",
      available: Boolean(verterTsc),
      run: () => runCliMeasured(verterTsc, ["--noEmit", "-p", "tsconfig.json"], { cwd, timeout }),
      runProject: (rel) => runCliMeasured(verterTsc, ["--noEmit", "-p", rel], { cwd, timeout }),
      unavailable: "verter-tsc binary not found",
      /**
       * verter-tsc requires tsgo for its typecheck surface; detect and skip.
       */
      after(result) {
        if (
          /no supported tsgo engine/i.test(result.combined) ||
          /There is no tsc fallback/i.test(result.combined)
        ) {
          return {
            skip: "verter-tsc requires tsgo (TypeScript 7 native); not installed",
          };
        }
        return null;
      },
    },
    {
      id: "golar-typecheck",
      available: Boolean(golar),
      run: () => runCliMeasured(golar, ["typecheck"], { cwd, timeout }),
      // golar reads tsconfig.json only — swap, run, restore. Never leave the
      // extra option in the shared file for the next tool.
      async runProject(rel) {
        const main = join(cwd, "tsconfig.json");
        const extra = join(cwd, rel);
        const backup = readFileSync(main, "utf8");
        writeFileSync(main, readFileSync(extra, "utf8"));
        try {
          return await runCliMeasured(golar, ["typecheck"], { cwd, timeout });
        } finally {
          writeFileSync(main, backup);
        }
      },
      unavailable: "golar binary not found",
      after(result) {
        if (/golar\.config/i.test(result.combined) && /not found/i.test(result.combined)) {
          return { skip: "golar.config missing/unreadable" };
        }
        return null;
      },
    },
  ];
}

export async function runTypecheckSuite(opts = {}) {
  const suite = createSuite("typecheck");
  mkdirSync(workRoot, { recursive: true });

  for (const caseId of listCases()) {
    const { dest, meta, pins } = prepareCase(caseId);
    meta._pins = pins;
    const runners = toolRunners(dest);

    for (const tool of runners) {
      if (!tool.available) {
        suite.skip(meta.id, tool.id, tool.unavailable);
        continue;
      }

      if (!toolSupports(tool.id, meta.requires)) {
        suite.skip(meta.id, tool.id, `tool lacks capability: ${(meta.requires || []).join(", ")}`);
        continue;
      }

      let result = await tool.run();
      if (tool.after) {
        const special = tool.after(result);
        if (special?.skip) {
          suite.skip(meta.id, tool.id, special.skip);
          continue;
        }
      }

      // Engine/bootstrap failures (non-diagnostic) → skip not fail
      if (result.error || (result.status === null && !result.combined.trim())) {
        suite.skip(meta.id, tool.id, result.error?.message || "process failed to start");
        continue;
      }

      if (isToolBootstrapFailure(result.combined)) {
        suite.skip(
          meta.id,
          tool.id,
          `tool bootstrap/runtime failure: ${
            result.combined
              .split(/\r?\n/)
              .find((l) => l.trim())
              ?.slice(0, 160) || "unknown"
          }`,
        );
        continue;
      }

      // inheritAttrs + root-shape plants: score the shared tsconfig AND an
      // isolated fallthroughAttributes retry. Needing the opt-in is a warn,
      // never a silent pass. Missing the plant only after the opt-in is a fail.
      if (meta.needsFallthroughAttributes && tool.runProject) {
        const extraRel = writeFallthroughExtraTsconfig(dest);
        const extraRun = await tool.runProject(extraRel);
        if (tool.after) {
          const special = tool.after(extraRun);
          if (special?.skip) {
            suite.skip(meta.id, tool.id, special.skip);
            continue;
          }
        }
        if (extraRun.error || (extraRun.status === null && !extraRun.combined.trim())) {
          suite.skip(
            meta.id,
            tool.id,
            extraRun.error?.message || "fallthroughAttributes retry failed to start",
          );
          continue;
        }
        if (isToolBootstrapFailure(extraRun.combined)) {
          suite.skip(
            meta.id,
            tool.id,
            `fallthroughAttributes retry bootstrap/runtime failure: ${
              extraRun.combined
                .split(/\r?\n/)
                .find((l) => l.trim())
                ?.slice(0, 160) || "unknown"
            }`,
          );
          continue;
        }
        const pair = scoreFallthroughPair(scoreOne(meta, result), scoreOne(meta, extraRun));
        const detail = {
          snippet: `shared:\n${result.combined.slice(0, 400)}\n--- extra ---\n${extraRun.combined.slice(0, 400)}`,
          extraTsconfig: extraRel,
          ...resourcesFrom(result),
        };
        if (pair.status === "pass") suite.pass(meta.id, tool.id, pair.message, detail);
        else if (pair.status === "warn") suite.warn(meta.id, tool.id, pair.message, detail);
        else suite.fail(meta.id, tool.id, pair.message, detail);
        continue;
      }

      // verter-tsc may ignore a .ts importer on the shared tsconfig. Retry
      // with extra flags isolated to this tool, and warn — never a silent pass.
      if (
        tool.id === "verter-tsc" &&
        meta.tsImporter &&
        verterSkippedTsImporter(result.combined, meta.tsImporter)
      ) {
        const extraRel = writeVerterExtraTsconfig(dest);
        const extraRun = await tool.runProject(extraRel);
        if (tool.after) {
          const special = tool.after(extraRun);
          if (special?.skip) {
            suite.skip(meta.id, tool.id, special.skip);
            continue;
          }
        }
        if (extraRun.error || (extraRun.status === null && !extraRun.combined.trim())) {
          suite.skip(meta.id, tool.id, extraRun.error?.message || "extra-tsconfig retry failed to start");
          continue;
        }
        if (isToolBootstrapFailure(extraRun.combined)) {
          suite.skip(
            meta.id,
            tool.id,
            `extra-tsconfig retry bootstrap/runtime failure: ${
              extraRun.combined
                .split(/\r?\n/)
                .find((l) => l.trim())
                ?.slice(0, 160) || "unknown"
            }`,
          );
          continue;
        }
        result = extraRun;
        const stillSkipped = verterSkippedTsImporter(result.combined, meta.tsImporter);
        const score = scoreDiagnostics(scoreOpts(meta, result));
        const snippet = result.combined.slice(0, 800);
        const measured = { snippet, extraTsconfig: extraRel, ...resourcesFrom(result) };
        if (stillSkipped) {
          suite.warn(
            meta.id,
            tool.id,
            verterExtraTsconfigWarning(meta.tsImporter, "retry-still-skipped"),
            measured,
          );
        } else if (score.ok) {
          suite.warn(
            meta.id,
            tool.id,
            verterExtraTsconfigWarning(meta.tsImporter, "retry-passed", score.message),
            measured,
          );
        } else {
          suite.fail(
            meta.id,
            tool.id,
            verterExtraTsconfigWarning(meta.tsImporter, "retry-failed", score.message),
            measured,
          );
        }
        continue;
      }

      // On a clean fixture, a diagnostic naming the tool's own virtual code is
      // reporting a defect in its codegen, not in the source. Name it rather
      // than letting it read as a generic "expected clean, got N".
      if (!meta.expectErrors) {
        const leaks = findVirtualCodeLeaks(result.combined);
        if (leaks.length) {
          suite.fail(
            meta.id,
            tool.id,
            `clean fixture: diagnostic describes the tool's own generated code — ${leaks[0].trim().slice(0, 200)}`,
            { snippet: leaks.join("\n").slice(0, 800), ...resourcesFrom(result) },
          );
          continue;
        }
      }

      const score = scoreDiagnostics(scoreOpts(meta, result));

      if (score.ok) {
        suite.pass(meta.id, tool.id, score.message, resourcesFrom(result));
      } else {
        suite.fail(meta.id, tool.id, score.message, {
          snippet: result.combined.slice(0, 800),
          ...resourcesFrom(result),
        });
      }
    }
  }

  const allSuite = createSuite("typecheck-all");
  await runTypecheckAllPlants(allSuite, opts);
  return [...suite.results, ...allSuite.results];
}

function copyCaseSources(src, dest) {
  cpSync(src, dest, {
    recursive: true,
    filter: (from) => {
      const base = from.replace(/\\/g, "/").split("/").pop();
      return base !== "meta.json" && base !== "tsconfig.json" && base !== "golar.config.ts";
    },
  });
}

/**
 * One project, one tsconfig, every plant under `cases/<id>/`.
 * Shared compiler options only — no per-case overlay, no fallthrough retry.
 */
export function prepareAllPlants() {
  rmSync(allPlantsRoot, { recursive: true, force: true });
  mkdirSync(join(allPlantsRoot, "cases"), { recursive: true });
  cpSync(join(sharedRoot, "env.d.ts"), join(allPlantsRoot, "env.d.ts"));

  const cases = [];
  for (const caseId of listCases()) {
    const src = join(casesRoot, caseId);
    const dest = join(allPlantsRoot, "cases", caseId);
    mkdirSync(dest, { recursive: true });
    copyCaseSources(src, dest);
    const meta = JSON.parse(readFileSync(join(src, "meta.json"), "utf8"));
    const pins = findExpectErrorPins(src);
    if (pins.length && meta.expectErrors) stripExpectErrorDirectives(dest);
    cases.push({ caseId, meta: { ...meta, _pins: meta.expectErrors ? pins : [] } });
  }

  const base = JSON.parse(readFileSync(join(sharedRoot, "tsconfig.base.json"), "utf8"));
  base.compilerOptions = {
    ...base.compilerOptions,
    paths: {
      vue: [join(rootDir, "node_modules/vue").replace(/\\/g, "/")],
      "vue/*": [join(rootDir, "node_modules/vue/*").replace(/\\/g, "/")],
    },
  };
  base.include = ["**/*.vue", "**/*.ts", "**/*.d.ts"];
  base.exclude = ["golar.config.ts", "node_modules"];
  writeFileSync(join(allPlantsRoot, "tsconfig.json"), JSON.stringify(base, null, 2));
  writeFileSync(
    join(allPlantsRoot, "package.json"),
    JSON.stringify(
      {
        name: "confirm-typecheck-all",
        private: true,
        type: "module",
        dependencies: {
          vue: "file:" + join(rootDir, "node_modules/vue").replace(/\\/g, "/"),
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(allPlantsRoot, "golar.config.ts"),
    `import { defineConfig } from "golar/unstable";\nimport "@golar/vue";\nexport default defineConfig({});\n`,
  );
  return { dest: allPlantsRoot, cases };
}

/** Score each plant from one combined diagnostic dump. */
export function scoreCombinedRun(cases, toolId, result) {
  const diags = parseDiagnostics(result.combined);
  let pass = 0;
  let fail = 0;
  let skip = 0;
  for (const { caseId, meta } of cases) {
    if (!toolSupports(toolId, meta.requires)) {
      skip++;
      continue;
    }
    const subset = diagsForCase(diags, caseId);
    const score = scoreOne(meta, { ...result, combined: combinedFromDiags(subset) });
    if (score.ok) pass++;
    else fail++;
  }
  const scored = pass + fail;
  const passPct = scored ? (100 * pass) / scored : 0;
  return { pass, fail, skip, scored, passPct };
}

/**
 * Same defaults as `.github/workflows/benchmark.yml` (`BENCH_RUNS` / `BENCH_WARMUPS`).
 * Warmups clamp to ≥1, matching `effectiveWarmups` on the throughput surfaces.
 */
export function allPlantsRunCounts(env = process.env, args = {}) {
  const runsRaw = Number.parseInt(String(args.runs ?? env.BENCH_RUNS ?? "5"), 10);
  const warmRaw = Number.parseInt(String(args.warmups ?? env.BENCH_WARMUPS ?? "1"), 10);
  return {
    runs: Number.isFinite(runsRaw) && runsRaw > 0 ? runsRaw : 5,
    warmups: effectiveWarmups(Number.isFinite(warmRaw) ? warmRaw : 1),
  };
}

function runLooksBroken(result) {
  if (!result) return "no result";
  if (result.error) return result.error.message || "process failed to start";
  if (result.status === null && !String(result.combined || "").trim()) return "process failed to start";
  if (isToolBootstrapFailure(result.combined)) return "tool bootstrap/runtime failure";
  return null;
}

/**
 * Extra check: one project, one tsconfig, every plant. Warmups are discarded;
 * wall is the median of measured runs; peak RSS is the max of those runs.
 * Pass rate is per-plant scoring of the last measured dump.
 */
export async function runTypecheckAllPlants(suite = createSuite("typecheck-all"), opts = {}) {
  const { runs, warmups } = allPlantsRunCounts(process.env, opts);
  const { dest, cases } = prepareAllPlants();
  const runners = toolRunners(dest, { timeout: 300_000 });
  for (const tool of runners) {
    if (!tool.available) {
      suite.skip("all-plants", tool.id, tool.unavailable);
      continue;
    }

    let skipReason = null;
    for (let i = 0; i < warmups; i++) {
      const warm = await tool.run();
      if (tool.after) {
        const special = tool.after(warm);
        if (special?.skip) {
          skipReason = special.skip;
          break;
        }
      }
      skipReason = runLooksBroken(warm);
      if (skipReason) break;
    }
    if (skipReason) {
      suite.skip("all-plants", tool.id, skipReason);
      continue;
    }

    const measuredMs = [];
    const measuredRss = [];
    let last = null;
    for (let i = 0; i < runs; i++) {
      const result = await tool.run();
      if (tool.after) {
        const special = tool.after(result);
        if (special?.skip) {
          skipReason = special.skip;
          break;
        }
      }
      skipReason = runLooksBroken(result);
      if (skipReason) break;
      last = result;
      if (Number.isFinite(result.ms)) measuredMs.push(result.ms);
      if (Number.isFinite(result.rssBytes) && result.rssBytes > 0) measuredRss.push(result.rssBytes);
    }
    if (skipReason || !last) {
      suite.skip("all-plants", tool.id, skipReason || "no measured run");
      continue;
    }

    const tally = scoreCombinedRun(cases, tool.id, last);
    const ms = measuredMs.length ? median(measuredMs) : last.ms;
    const rssMb = measuredRss.length
      ? Number((Math.max(...measuredRss) / (1024 * 1024)).toFixed(1))
      : resourcesFrom(last).rssMb;
    const measured = {
      ms: Number.isFinite(ms) ? Number(ms.toFixed(1)) : undefined,
      rssMb,
      runs: measuredMs.map((n) => Number(n.toFixed(1))),
      warmups,
      runCount: runs,
      ...tally,
    };
    const msg = `${tally.passPct.toFixed(0)}% (${tally.pass}/${tally.scored}) · median ${
      Number.isFinite(measured.ms) ? `${(measured.ms / 1000).toFixed(2)}s` : "–"
    } of ${runs} after ${warmups} warmup(s)`;
    suite.pass("all-plants", tool.id, msg, measured);
  }
  return suite.results;
}
