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
import { resolveSpawnable, runCli, runCliMeasured, rootDir } from "../lib/run-cli.mjs";
import { effectiveWarmups, mean, median } from "../../../scripts/lib/timing.mjs";
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

function mb(bytes) {
  return Number.isFinite(bytes) && bytes > 0 ? Number((bytes / (1024 * 1024)).toFixed(1)) : undefined;
}

function resourcesFrom(run) {
  const out = {};
  if (Number.isFinite(run?.ms)) out.ms = Number(run.ms.toFixed(1));
  const rssMb = mb(run?.rssBytes);
  const rssToolMb = mb(run?.rssToolBytes);
  const rssEngineMb = mb(run?.rssEngineBytes);
  if (rssMb) out.rssMb = rssMb;
  if (rssToolMb) out.rssToolMb = rssToolMb;
  if (rssEngineMb) out.rssEngineMb = rssEngineMb;
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

function scoreOne(meta, result, diags) {
  if (!meta.expectErrors) {
    const leaks = findVirtualCodeLeaks(result.combined, diags);
    if (leaks.length) {
      return {
        ok: false,
        message: `clean fixture: diagnostic describes the tool's own generated code — ${leaks[0].trim().slice(0, 200)}`,
      };
    }
  }
  return scoreDiagnostics({ ...scoreOpts(meta, result), diags });
}

/**
 * Capability tags for plants (`meta.requires`). `*` means all plants.
 *
 * This table is DISCLOSURE, not scoring. A tool that does not claim a plant's
 * capability still runs and is still judged on what it printed: it fails the
 * plant because the diagnostic is missing, not because of a line in this file.
 * The claim is appended to the message so the reason is visible, and a tool
 * that has since closed the gap passes and says the table is stale.
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

/**
 * @returns {string[]} diagnostics that leak a virtual-code identifier
 *
 * Detection runs over PARSED diagnostics, not raw lines. The old line filter
 * was `/error\s+TS\d+/`, which is the tsc-family layout — vize prints
 * `error:9:11 [TS2322] …` and never matched it, so vize alone was exempt from
 * a check the other three were held to. Whether a tool is scolded for
 * diagnosing its own codegen must not depend on how it formats a line.
 */
function findVirtualCodeLeaks(combined, diags) {
  const parsed = diags ?? parseDiagnostics(combined);
  return parsed
    .filter((d) => d.code)
    .map((d) => d.raw || d.message || "")
    .filter((text) => VIRTUAL_CODE_MARKERS.some((marker) => text.includes(marker)));
}

function toolSupports(toolId, requires) {
  if (!requires?.length) return true;
  const caps = TOOL_CAPABILITIES[toolId] || [];
  if (caps.includes("*")) return true;
  return requires.every((r) => caps.includes(r));
}

function invoke(spec, args, { cwd, timeout, sampleRss = false }) {
  if (sampleRss) return runCliMeasured(spec, args, { cwd, timeout, sampleRss: true });
  const bin = spec && spec.bin ? spec.bin : spec;
  const prefix = spec && spec.argsPrefix ? spec.argsPrefix : [];
  return Promise.resolve(runCli(bin, [...prefix, ...(args || [])], { cwd, timeout }));
}

export function toolRunners(cwd, { timeout = 120_000 } = {}) {
  const vueTsc = resolveSpawnable("vue-tsc");
  const vize = resolveSpawnable("vize");
  const verterTsc = resolveSpawnable("verter-tsc");
  const golar = resolveSpawnable("golar");

  return [
    {
      id: "vue-tsc",
      available: Boolean(vueTsc),
      run: (opts = {}) =>
        invoke(vueTsc, ["--noEmit", "-p", "tsconfig.json"], { cwd, timeout, sampleRss: opts.sampleRss }),
      runProject: (rel, opts = {}) =>
        invoke(vueTsc, ["--noEmit", "-p", rel], { cwd, timeout, sampleRss: opts.sampleRss }),
      unavailable: "vue-tsc binary not found",
    },
    {
      id: "vize-check",
      available: Boolean(vize),
      run: (opts = {}) =>
        invoke(vize, ["check", ".", "--tsconfig", "tsconfig.json"], { cwd, timeout, sampleRss: opts.sampleRss }),
      runProject: (rel, opts = {}) =>
        invoke(vize, ["check", ".", "--tsconfig", rel], { cwd, timeout, sampleRss: opts.sampleRss }),
      unavailable: "vize binary not found",
    },
    {
      id: "verter-tsc",
      available: Boolean(verterTsc),
      run: (opts = {}) =>
        invoke(verterTsc, ["--noEmit", "-p", "tsconfig.json"], { cwd, timeout, sampleRss: opts.sampleRss }),
      runProject: (rel, opts = {}) =>
        invoke(verterTsc, ["--noEmit", "-p", rel], { cwd, timeout, sampleRss: opts.sampleRss }),
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
      run: (opts = {}) => invoke(golar, ["typecheck"], { cwd, timeout, sampleRss: opts.sampleRss }),
      // golar reads tsconfig.json only — swap, run, restore. Never leave the
      // extra option in the shared file for the next tool.
      async runProject(rel, opts = {}) {
        const main = join(cwd, "tsconfig.json");
        const extra = join(cwd, rel);
        const backup = readFileSync(main, "utf8");
        writeFileSync(main, readFileSync(extra, "utf8"));
        try {
          return await invoke(golar, ["typecheck"], { cwd, timeout, sampleRss: opts.sampleRss });
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

  if (opts.allPlantsOnly) {
    const allSuite = createSuite("typecheck-all");
    await runTypecheckAllPlants(allSuite, opts);
    return allSuite.results;
  }

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
        // An unclaimed capability is a GAP in the tool, not a neutral skip:
        // the plant exists because correct tools catch it. Skip remains only
        // for a missing binary/engine (the tool never ran at all).
        //
        // The tool still RUNS. TOOL_CAPABILITIES is a hand-maintained claim,
        // and short-circuiting on it means the day a tool starts catching the
        // plant the harness keeps printing a fail until someone edits the
        // list. Scoring the real output cannot go stale: a gap the tool has
        // actually closed shows up as a pass, and the verdict below always
        // comes from what the tool did, never from what the table says.
        const gapRun = await tool.run();
        // Same skip rules as the normal path: a tool whose engine is missing
        // never ran, and "did not report the plant" would be a lie about it.
        const gapBroken = tool.after?.(gapRun)?.skip || runLooksBroken(gapRun);
        if (gapBroken) {
          suite.skip(meta.id, tool.id, gapBroken);
          continue;
        }
        const gapScore = scoreDiagnostics(scoreOpts(meta, gapRun));
        const claim = `capability gap — tool does not claim: ${(meta.requires || []).join(", ")}`;
        if (gapScore.ok) {
          suite.pass(
            meta.id,
            tool.id,
            `${gapScore.message} — passed despite an unclaimed capability (${(meta.requires || []).join(", ")}); TOOL_CAPABILITIES is stale`,
            resourcesFrom(gapRun),
          );
        } else {
          suite.fail(meta.id, tool.id, `${claim} (scored: ${gapScore.message})`, {
            snippet: gapRun.combined.slice(0, 800),
            ...resourcesFrom(gapRun),
          });
        }
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
 *
 * `root` defaults to the shared work tree the confirm runner uses (guarded by
 * run.mjs's single-run lock). Harness tests must pass their own scratch root —
 * preparing (rmSync!) the shared tree from a test deletes it out from under a
 * concurrently running confirm suite.
 */
export function prepareAllPlants(root = allPlantsRoot) {
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, "cases"), { recursive: true });
  cpSync(join(sharedRoot, "env.d.ts"), join(root, "env.d.ts"));

  const cases = [];
  for (const caseId of listCases()) {
    const src = join(casesRoot, caseId);
    const dest = join(root, "cases", caseId);
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
  writeFileSync(join(root, "tsconfig.json"), JSON.stringify(base, null, 2));
  writeFileSync(
    join(root, "package.json"),
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
    join(root, "golar.config.ts"),
    `import { defineConfig } from "golar/unstable";\nimport "@golar/vue";\nexport default defineConfig({});\n`,
  );
  // Second config for the inheritAttrs/root-shape plants only. Never written
  // over tsconfig.json: the shared file stays the default one every other plant
  // is judged on, and a tool that only scores with the opt-in is a warn.
  const fallthroughTsconfig = "tsconfig.fallthrough.json";
  writeFileSync(
    join(root, fallthroughTsconfig),
    JSON.stringify(
      {
        ...base,
        vueCompilerOptions: {
          ...(base.vueCompilerOptions || {}),
          ...FALLTHROUGH_EXTRA_VUE_COMPILER_OPTIONS,
        },
      },
      null,
      2,
    ),
  );
  return { dest: root, cases, fallthroughTsconfig };
}

/** One plant's verdict from a combined dump: the parsed subset plus its score. */
function scorePlantFromDump(meta, caseId, result, diags) {
  // Score the parsed subset directly — combinedFromDiags keeps only the raw
  // diagnostic lines, and re-parsing those loses the file for tools that
  // print it on a separate header line (vize), failing every pin check.
  const subset = diagsForCase(diags, caseId);
  return scoreOne(meta, { ...result, combined: combinedFromDiags(subset) }, subset);
}

/**
 * Score each plant from one combined diagnostic dump.
 *
 * `fallthroughResult`, when given, is a second dump of the SAME project taken
 * with `vueCompilerOptions.fallthroughAttributes` on. Plants flagged
 * `needsFallthroughAttributes` are judged from the pair exactly as the per-case
 * path judges them, because the shared config cannot answer what they ask:
 * with the opt-in off, a legitimate fallthrough `id` IS an unknown prop, so a
 * checker that models fallthrough correctly reports TS2353 on a plant whose
 * expected answer is "clean" — and is marked wrong for being right, while a
 * checker that does not implement fallthrough at all passes for free. Without
 * the second dump this is 12 of the plants and it favours the least capable
 * tool in the table.
 */
export function scoreCombinedRun(cases, toolId, result, fallthroughResult = null) {
  const diags = parseDiagnostics(result.combined);
  const extraDiags = fallthroughResult ? parseDiagnostics(fallthroughResult.combined) : null;
  let pass = 0;
  let fail = 0;
  let warn = 0;
  let skip = 0;
  const plants = [];
  // Diagnostics this scorer cannot hand to any plant, because their path is not
  // under `cases/<id>/` — verter-tsc reports some of its own generated code as
  // `.tmpXXXX/App_<hash>.vue.ts`, which belongs to a plant but does not say
  // which. They are invisible to per-plant scoring by construction, so on a
  // CLEAN plant the tool is credited with silence it did not earn. Counted and
  // disclosed on the row rather than dropped: the per-case path, which scores
  // one project at a time, still catches them properly.
  const attributed = new Set();
  for (const { caseId } of cases) for (const d of diagsForCase(diags, caseId)) attributed.add(d);
  const unattributed = diags.filter((d) => !attributed.has(d));
  const record = (caseId, status, message) => {
    if (status === "pass") pass++;
    else if (status === "warn") warn++;
    else fail++;
    plants.push({ caseId, skip: false, status, ok: status === "pass", message });
  };

  for (const { caseId, meta } of cases) {
    const claimed = toolSupports(toolId, meta.requires);

    if (meta.needsFallthroughAttributes && extraDiags) {
      const pair = scoreFallthroughPair(
        scorePlantFromDump(meta, caseId, result, diags),
        scorePlantFromDump(meta, caseId, fallthroughResult, extraDiags),
      );
      record(caseId, pair.status, pair.message);
      continue;
    }

    const score = scorePlantFromDump(meta, caseId, result, diags);

    // The tool ran over every plant in this dump, so an unclaimed capability
    // is scored from what it actually reported — never short-circuited on the
    // hand-maintained TOOL_CAPABILITIES table. A gap it has since closed reads
    // as a pass; one it still has reads as a fail, with the claim disclosed.
    if (!claimed) {
      const requires = (meta.requires || []).join(", ");
      record(
        caseId,
        score.ok ? "pass" : "fail",
        score.ok
          ? `${score.message} — passed despite an unclaimed capability (${requires}); TOOL_CAPABILITIES is stale`
          : `capability gap — tool does not claim: ${requires} (scored: ${score.message})`,
      );
      continue;
    }

    record(caseId, score.ok ? "pass" : "fail", score.message);
  }

  // warn is NOT a pass (it means the plant only scored with a non-default
  // compiler option) and it stays in the denominator, so needing the opt-in
  // can never read as better than not needing it.
  const scored = pass + fail + warn;
  const passPct = scored ? (100 * pass) / scored : 0;
  return {
    pass,
    fail,
    warn,
    skip,
    scored,
    passPct,
    plants,
    unattributed: unattributed.length,
    unattributedFiles: [...new Set(unattributed.map((d) => d.file || "(no file)"))].slice(0, 5),
  };
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
 * Extra check: one project, one tsconfig, every plant.
 * Speed and memory are **separate** spawns so the RSS sampler cannot inflate wall.
 *   speed  — warmups discarded; wall is the median (and avg/min/max) of measured runs
 *   memory — one sampled spawn afterwards; peak RSS only (wall discarded)
 * Pass rate is per-plant scoring of the last speed dump.
 */
export async function runTypecheckAllPlants(suite = createSuite("typecheck-all"), opts = {}) {
  const { runs, warmups } = allPlantsRunCounts(process.env, opts);
  const { dest, cases, fallthroughTsconfig } = prepareAllPlants();
  const runners = toolRunners(dest, { timeout: 300_000 });
  for (const tool of runners) {
    if (!tool.available) {
      suite.skip("all-plants", tool.id, tool.unavailable);
      continue;
    }

    let skipReason = null;
    console.log(`  → ${tool.id}  speed: ${warmups} warmup(s) + ${runs} run(s) over ${cases.length} plants`);
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
      console.log(
        `    speed ${i + 1}/${runs}  ${Number.isFinite(result.ms) ? `${result.ms.toFixed(0)}ms` : "–"}`,
      );
    }
    if (skipReason || !last) {
      suite.skip("all-plants", tool.id, skipReason || "no measured run");
      continue;
    }

    console.log(`  → ${tool.id}  memory: 1 sampled run`);
    const mem = await tool.run({ sampleRss: true });
    const memBroken = runLooksBroken(mem);
    const peakRss = { total: 0, tool: 0, engine: 0 };
    if (!memBroken && Number.isFinite(mem.rssBytes) && mem.rssBytes > 0) {
      peakRss.total = mem.rssBytes;
      peakRss.tool = mem.rssToolBytes || 0;
      peakRss.engine = mem.rssEngineBytes || 0;
    }
    const rssMb = peakRss.total > 0 ? mb(peakRss.total) : undefined;
    const engMb = peakRss.engine > 0 ? mb(peakRss.engine) : undefined;
    console.log(
      `    rss ${rssMb ?? "–"} MB (engine ${engMb ?? "–"})${memBroken ? ` — ${memBroken}` : ""}`,
    );

    // Correctness-only second spawn, AFTER every measurement, for the
    // inheritAttrs/root-shape plants. Untimed and unsampled on purpose: it must
    // not enter the wall clock or the RSS peak, it exists so those 12 plants
    // are judged on the config that can actually answer them (see
    // scoreCombinedRun). Every tool gets the identical extra tsconfig; if the
    // spawn is broken the pair is dropped and they fall back to shared-only
    // scoring rather than silently passing.
    let fallthroughRun = null;
    if (fallthroughTsconfig && tool.runProject && cases.some((c) => c.meta.needsFallthroughAttributes)) {
      console.log(`  → ${tool.id}  fallthroughAttributes: 1 correctness run (untimed)`);
      const extra = await tool.runProject(fallthroughTsconfig);
      const extraBroken = tool.after?.(extra)?.skip || runLooksBroken(extra);
      if (extraBroken) console.log(`    skipped fallthrough pass — ${extraBroken}`);
      else fallthroughRun = extra;
    }

    const tally = scoreCombinedRun(cases, tool.id, last, fallthroughRun);
    const ms = measuredMs.length ? median(measuredMs) : last.ms;
    const avgMs = measuredMs.length ? mean(measuredMs) : last.ms;
    const measured = {
      ms: Number.isFinite(ms) ? Number(ms.toFixed(1)) : undefined,
      avgMs: Number.isFinite(avgMs) ? Number(avgMs.toFixed(1)) : undefined,
      minMs: measuredMs.length ? Number(Math.min(...measuredMs).toFixed(1)) : undefined,
      maxMs: measuredMs.length ? Number(Math.max(...measuredMs).toFixed(1)) : undefined,
      rssMb,
      rssToolMb: peakRss.tool > 0 ? mb(peakRss.tool) : undefined,
      rssEngineMb: peakRss.engine > 0 ? mb(peakRss.engine) : undefined,
      runs: measuredMs.map((n) => Number(n.toFixed(1))),
      warmups,
      runCount: runs,
      ...tally,
    };
    const warnPart = tally.warn ? ` · ${tally.warn} ⚠ (needed fallthroughAttributes)` : "";
    const orphanPart = tally.unattributed
      ? ` · ${tally.unattributed} diagnostic(s) not attributable to a plant (${tally.unattributedFiles.join(", ")})`
      : "";
    const msg = `${tally.passPct.toFixed(0)}% (${tally.pass}/${tally.scored})${warnPart} · median ${
      Number.isFinite(measured.ms) ? `${(measured.ms / 1000).toFixed(2)}s` : "–"
    } · avg ${
      Number.isFinite(measured.avgMs) ? `${(measured.avgMs / 1000).toFixed(2)}s` : "–"
    } of ${runs} after ${warmups} warmup(s)${orphanPart}`;
    suite.pass("all-plants", tool.id, msg, measured);
  }
  return suite.results;
}
