/**
 * Bundle surface — production build of a real Vue corpus, across
 * (bundler × Vue integration).
 *
 * Two dimensions, deliberately separated and never pooled:
 *
 * - **Vue integration** — which implementation compiles the SFCs. Holding the
 *   bundler fixed isolates the Vue layer, which is what this repository is for.
 * - **Bundler** — Vite 8 (Rolldown), Vite 7 (Rollup), bare Rolldown, Rspack,
 *   webpack 5. Holding the integration fixed isolates the bundler.
 *
 * The bundler adapters, the integration registry and the reasoning about which
 * comparisons are legitimate live in `../real-world/bundler-drivers.mjs`. The
 * app being built is generated and identical in every cell — see
 * `../real-world/app-shell.mjs`, which is where the reason these numbers are
 * comparable at all is written down.
 *
 * ## Gate: did the cell actually compile the corpus?
 *
 * Every cell is built ONCE, untimed, before any measurement. That pass records
 * how many corpus SFCs reached a compile and how many bytes were emitted. A cell
 * that compiled fewer SFCs than the best cell **for the same bundler** is
 * measured but **unranked**, on the principle the rest of this repository applies
 * everywhere: a build that skipped part of the corpus is not a faster build.
 *
 * The peer anchor is keyed on the bundler the report actually ranks by, and a
 * bundler with only one surviving cell must clear the CORPUS instead — otherwise
 * the sole survivor is its own anchor and passes at any coverage at all.
 *
 * The gate is not hypothetical. During development a resolver rule that looked
 * perfectly reasonable made `@vizejs/vite-plugin` emit 3.7 kB in 28 ms against
 * the 207 kB every other cell produced — a 12x "win" for compiling nothing.
 * Nothing in the wall-clock number said so. The census did.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, posix, relative } from "node:path";
import { copyFixtureSubset, copyRelativeImportClosure } from "../fixtures.mjs";
import { GATE_IS_THE_WARM_PASS, measureVariants } from "../timing.mjs";
import {
  writeAppPackageJson,
  writeEntry,
  writeIndexHtml,
} from "../real-world/app-shell.mjs";
import {
  BUNDLERS,
  INTEGRATIONS,
  allCells,
  enabledBundlers,
  loadCell,
} from "../real-world/bundler-drivers.mjs";
import { compilerFs, registerCompilerTS } from "./compile.mjs";

export { BUNDLERS, INTEGRATIONS, enabledBundlers };

/** Back-compat alias: the Vite-family integrations, which the HMR surface uses. */
export const VUE_PLUGINS = INTEGRATIONS.vite;

/**
 * Lay out the app whose module graph is the corpus.
 *
 * The corpus is COPIED into the work directory rather than built in place. Two
 * non-negotiable reasons: the HMR surface edits files to trigger updates and
 * nothing here may ever write into a checked-out third-party repository; and a
 * build in place would resolve the project's real siblings and `node_modules`,
 * making the module graph depend on whether an install happened to succeed.
 *
 * Two provisions keep the copy honest about what a copy costs:
 *
 * 1. The RELATIVE import closure rides along. @vue/compiler-sfc resolves
 *    imported prop types on the filesystem, and a `.vue`-only copy made
 *    `import type { AlertProps } from './alert'` unreadable — 107 of Element
 *    Plus's 162 SFCs failed, attributed by the census rule to whichever
 *    integration hit them first, the official plugin included. Closure files
 *    are for the compiler only; the bundler-facing resolvers externalise them,
 *    so the module graph is still exactly the corpus.
 *
 * 2. A BASELINE COMPILABILITY PREFLIGHT (untimed) excludes, for every cell
 *    alike, the SFCs whose macro types need the project's own workspace context
 *    (tsconfig paths, node_modules) — context a copy deliberately does not
 *    have. Leaving them in publishes ❌ rows for an environment gap; silently
 *    dropping them would be truncation. They are excluded loudly instead: the
 *    surface reports how many and why, and the graph stays identical in every
 *    cell. The judge is @vue/compiler-sfc with the same fs bridge and TS
 *    registration the compile surface provisions.
 */
export async function prepareBundleApp(resolved, workRoot, label) {
  const appDir = join(workRoot, "bundle", label);
  rmSync(appDir, { recursive: true, force: true });
  mkdirSync(appDir, { recursive: true });
  copyFixtureSubset(resolved.dir, appDir, resolved.files);
  const closureCopied = copyRelativeImportClosure(resolved.dir, appDir, resolved.files);
  writeAppPackageJson(appDir, `bench-bundle-${label}`);
  // Stop @vue/compiler-sfc's tsconfig discovery at the staged root: without
  // this, findConfigFile walks UP from the work directory and whatever tsconfig
  // it happens to find above it (this harness's own, say) decides type
  // resolution for third-party code — nondeterministic across machines.
  writeFileSync(join(appDir, "tsconfig.json"), `${JSON.stringify({ compilerOptions: {} }, null, 2)}\n`);

  const compiler = await import("@vue/compiler-sfc");
  registerCompilerTS(compiler);
  const entryFiles = [];
  const excludedFiles = [];
  // What the corpus carries decides which bundler families can host it at all —
  // bare Rolldown removed CSS bundling (rolldown#4271), so a styled corpus is
  // skipped there with the reason stated, instead of published as 1682 ❌s.
  const corpusTraits = { styleBlocks: 0, customBlocks: 0 };
  for (const rel of resolved.files) {
    const abs = join(appDir, rel);
    try {
      const source = readFileSync(abs, "utf8");
      const { descriptor, errors } = compiler.parse(source, { filename: abs });
      if (errors?.length) throw new Error(String(errors[0].message ?? errors[0]));
      corpusTraits.styleBlocks += descriptor.styles?.length ?? 0;
      corpusTraits.customBlocks += descriptor.customBlocks?.length ?? 0;
      if (descriptor.scriptSetup || descriptor.script) {
        compiler.compileScript(descriptor, { id: abs, inlineTemplate: false, isProd: true, fs: compilerFs });
      }
      entryFiles.push(rel);
    } catch (error) {
      excludedFiles.push({
        rel,
        reason: String(error instanceof Error ? error.message : error)
          .split("\n")[0]
          .slice(0, 200),
      });
    }
  }
  // Close the exclusion under the corpus's RELATIVE .vue import graph. An
  // excluded file stays on disk (the closure copy needs it), and an INCLUDED
  // sibling that imports it re-creates exactly the ❌ the preflight exists to
  // prevent — asymmetrically, because the Vite family and vue-loader follow the
  // edge while unplugin cells externalise it. If an entry file imports an
  // excluded file, it is excluded too, transitively, each with the edge named.
  const REL_VUE_IMPORT_RE =
    /(?:import|export)\s[^'"()]*?from\s*['"](\.[^'"]*?\.vue)['"]|import\s*\(\s*['"](\.[^'"]*?\.vue)['"]\s*\)|import\s*['"](\.[^'"]*?\.vue)['"]/g;
  const excludedSet = new Set(excludedFiles.map((e) => e.rel));
  const entrySet = new Set(entryFiles);
  const importsOf = new Map();
  for (const rel of entryFiles) {
    const targets = [];
    let source = "";
    try {
      source = readFileSync(join(appDir, rel), "utf8");
    } catch {
      continue;
    }
    for (const m of source.matchAll(REL_VUE_IMPORT_RE)) {
      const spec = m[1] ?? m[2] ?? m[3];
      targets.push(posix.normalize(posix.join(posix.dirname(rel), spec)));
    }
    if (targets.length) importsOf.set(rel, targets);
  }
  let moved = true;
  while (moved) {
    moved = false;
    for (const rel of entrySet) {
      const hit = (importsOf.get(rel) ?? []).find((t) => excludedSet.has(t));
      if (!hit) continue;
      entrySet.delete(rel);
      excludedSet.add(rel);
      excludedFiles.push({ rel, reason: `imports ${hit}, which is excluded (transitive)` });
      moved = true;
    }
  }
  const finalEntryFiles = entryFiles.filter((rel) => entrySet.has(rel));

  writeEntry(appDir, finalEntryFiles);
  writeIndexHtml(appDir);
  return {
    appDir,
    entryFiles: finalEntryFiles,
    excludedFiles,
    closureCopied: closureCopied.length,
    corpusTraits,
  };
}

function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return String(s).replace(/\u001B\[[0-9;]*m/g, "");
}

function shortId(id, appDir) {
  const clean = stripAnsi(id).split("?")[0];
  const rel = relative(appDir, clean);
  return rel && !rel.startsWith("..") ? rel.split("\\").join("/") : clean;
}

/**
 * Can a failed build be attributed to the Vue integration at all?
 *
 * Decided on the transform census the driver recorded before it threw (see
 * `attachCensus` in bundler-drivers.mjs) — positive evidence that corpus SFCs
 * reached the Vue transform, not an inference from the error text.
 *
 * What this replaced: a string test for `?vue` in the error message, on the theory
 * that a genuine codegen defect fails inside a `?vue&type=…` sub-request. Only
 * vue-loader emits that query shape. The unplugin-based integrations name their
 * sub-requests differently, so THEIR codegen bugs matched the "harness gap" branch
 * and were published as ⏭ NOT MEASURED — the harness apologising for a bug in a
 * tool. A test that depends on how an integration happens to name its sub-requests
 * cannot be a fair test of any of them.
 *
 * Exported for tests: the wrong answer here is published as a marker on a row, and
 * both wrong answers are damaging — ❌ blames a tool for a harness gap, ⏭ excuses a
 * tool for a real defect.
 */
export function attributeBuildFailure(gate) {
  const compiled = gate?.census?.vueModules ?? null;
  return { compiled, attributable: (compiled ?? 0) > 0 };
}

/**
 * Corpus-compile gate verdict for one cell.
 *
 * Two anchors, because one is not enough:
 *
 * - PEER — the best any cell for the SAME BUNDLER managed. Comparing to the corpus
 *   alone would unrank every cell whenever the corpus holds an SFC no integration
 *   can reach, which says nothing about the integrations.
 * - CORPUS — `fileCount`, which is what a lone surviving cell must clear. A sole
 *   survivor IS the peer anchor, so the peer test is tautological for it: that is
 *   how a cell compiling 3 of 200 SFCs could rank first in its group unchallenged.
 *
 * Exported for tests.
 */
export function corpusCompileVerdict({ compiled, best, survivors, fileCount }) {
  const matchesPeers = best > 0 && compiled >= best;
  const soleSurvivorShortfall = survivors === 1 && compiled < fileCount;
  return {
    ranked: matchesPeers && !soleSurvivorShortfall,
    matchesPeers,
    soleSurvivorShortfall,
    belowCorpus: compiled < fileCount,
  };
}

/**
 * Untimed pre-pass establishing what each cell actually does.
 *
 * Run before any measurement so a cell that cannot build is never entered into a
 * timing loop, and so the census that decides ranked-vs-unranked is not itself
 * part of a measured run.
 */
async function computeBundleGates(cells, { appDir, entry, workRoot }) {
  const gates = new Map();
  for (const cell of cells) {
    const outDir = join(workRoot, "bundle-gate", cell.id);
    try {
      const r = await cell.run({ appDir, entry, outDir });
      gates.set(cell.id, { ok: true, ...r });
    } catch (error) {
      gates.set(cell.id, {
        ok: false,
        // The location is the useful half of a codegen failure: it names the
        // file in the third-party project the integration could not handle.
        error: stripAnsi(error instanceof Error ? error.message : String(error))
          .split("\n")
          .slice(0, 3)
          .join(" ")
          .slice(0, 400),
        id: stripAnsi(String(error?.id ?? "")),
        // How much of the corpus the Vue transform had compiled before the
        // failure — see `attachCensus` in bundler-drivers.mjs. `null` when the
        // driver could not record one.
        census: error?.census ?? null,
      });
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  }
  return gates;
}

/**
 * @param {import("../real-world/corpus.mjs").ResolvedCorpus} resolved
 */
export async function runBundleSurface(resolved, options) {
  const workRoot = options.workRoot;
  const { appDir, entryFiles, excludedFiles, closureCopied, corpusTraits } = await prepareBundleApp(
    resolved,
    workRoot,
    resolved.selector.replace(/[^a-z0-9]+/gi, "-"),
  );
  const entry = join(appDir, "bench-entry.js");
  // The gate anchor is the app's entry list, not the raw corpus: files the
  // preflight excluded (see prepareBundleApp) are absent from EVERY cell's
  // graph, so holding cells to the raw count would unrank all of them for a
  // staging property none of them controls.
  const fileCount = entryFiles.length;
  const stagingNote =
    excludedFiles.length > 0
      ? `⚠ ${excludedFiles.length} of ${resolved.files.length} corpus SFCs are EXCLUDED from this surface's app for every cell alike: their macro prop types need the project's own workspace context (tsconfig paths / node_modules), which the staged copy deliberately does not depend on — plus any file whose relative imports reach one (transitive, each edge named in the JSON). Judged untimed by @vue/compiler-sfc with the same fs bridge and TS registration the compile surface provisions; CHALLENGER COMPILERS WERE NOT CONSULTED for the exclusion — a tool that handles these files shows it on the compile surface, which reads the real checkout with no exclusions. First: ${excludedFiles[0].rel} (${excludedFiles[0].reason})`
      : null;

  const runnable = [];
  const unavailable = [];
  for (const cell of allCells()) {
    // Bare Rolldown removed CSS bundling (rolldown/rolldown#4271) and this
    // family is given no style pipeline (Vite supplies one for the vite groups,
    // the webpack family stores styles as asset/source). A styled corpus there
    // fails on every style sub-request at once — a property of the pairing, not
    // of any Vue integration, so the cells are skipped with the reason stated
    // rather than published as ❌ rows.
    if (cell.bundler.id === "rolldown" && corpusTraits.styleBlocks > 0) {
      unavailable.push({
        id: cell.id,
        label: cell.label,
        package: cell.integration.package,
        target: cell.bundler.id,
        engine: cell.bundler.engine,
        notes: `⏭ NOT MEASURED — this corpus carries ${corpusTraits.styleBlocks} <style> block(s), and bare Rolldown no longer bundles CSS (rolldown#4271) while this harness gives the bare-Rolldown family no substitute style pipeline. A failure here would be the pairing's, not ${cell.integration.label}'s. The Vite 8 group bundles the same corpus with the same Rolldown engine under Vite's CSS handling.`,
        skip: true,
      });
      continue;
    }
    const loaded = await loadCell(cell.bundler, cell.integration);
    if (loaded.error) {
      unavailable.push({
        id: cell.id,
        label: cell.label,
        package: cell.integration.package,
        target: cell.bundler.id,
        engine: cell.bundler.engine,
        notes: loaded.error,
        skip: true,
      });
      continue;
    }
    runnable.push({ ...cell, run: loaded.run });
  }

  const gates = await computeBundleGates(runnable, { appDir, entry, workRoot });

  // Two anchors, because one is not enough.
  //
  // PEER anchor — the best any cell in the same comparison class managed. Needed
  // because comparing to `fileCount` alone would unrank every cell whenever the
  // corpus holds an SFC no integration can reach (an alias-only import, say),
  // which says nothing about the integrations.
  //
  // Keyed on `bundler.id`, not `bundler.family`. The report groups and ranks by
  // id, so a family key let Vite 7 and Vite 8 anchor each other: a Vite 7 cell
  // that compiled less than the same integration under Vite 8 was unranked in a
  // table it was never compared in, and a Vite 8 cell could be excused by a Vite 7
  // peer nobody was reading. The gate's key now matches the ranking's key.
  //
  // CORPUS anchor — `fileCount`, applied as a disclosure on every partial cell and
  // as a gate when the class has only ONE surviving cell. A lone survivor passes
  // the peer test tautologically (it IS the best), which is how a cell compiling
  // 3 of 200 SFCs could rank first in its group unchallenged. With no peer there
  // is nothing to distinguish "the corpus contains SFCs nothing can reach" from
  // "this integration skipped them", so it is not ranked.
  const bestById = new Map();
  const survivorsById = new Map();
  for (const cell of runnable) {
    const gate = gates.get(cell.id);
    if (!gate?.ok) continue;
    // A cell that externalised its own sub-requests has a census of facades, not
    // compiled components (see the containment gate below) — it must not set the
    // bar its honest peers are judged against. An INCOHERENT census (more SFCs
    // than the corpus contains) is excluded for the same reason: its own
    // bracket calls the count "provably wrong", and a provably wrong count must
    // neither set the peer anchor nor pad the survivor tally that lets a lone
    // honest cell dodge the sole-survivor corpus gate.
    if ((gate.externalizedVueRequests ?? 0) > 0) continue;
    if (gate.vueModules > fileCount) continue;
    const key = cell.bundler.id;
    // Clamped to the corpus: a census ABOVE the entry list is arithmetic proof
    // of double counting, and an inflated anchor unranks every honest peer. The
    // cell's own note still prints the raw count, so the incoherence stays
    // visible instead of silently normalised away.
    bestById.set(key, Math.max(bestById.get(key) ?? 0, Math.min(gate.vueModules, fileCount)));
    survivorsById.set(key, (survivorsById.get(key) ?? 0) + 1);
  }

  const variants = [];
  for (const cell of runnable) {
    const gate = gates.get(cell.id);
    const base = {
      id: cell.id,
      label: cell.label,
      package: cell.integration.package,
      target: cell.bundler.id,
      engine: cell.bundler.engine,
      invocation: "in-process API",
      threading: "bundler default",
      artifactLabel: "output bytes",
    };

    if (!gate?.ok) {
      const detail = `${gate?.error ?? "unknown error"}${
        gate?.id ? ` (module: ${shortId(gate.id, appDir)})` : ""
      }`;

      const { compiled, attributable: transformRan } = attributeBuildFailure(gate);
      const censusNote =
        compiled === null
          ? "no transform census was recorded for this failure"
          : `the Vue transform compiled ${compiled}/${fileCount} corpus SFCs before the failure (${gate.census.totalTransforms ?? "?"} transforms total)`;

      variants.push({
        ...base,
        notes: transformRan
          ? `❌ BUILD FAILED on this corpus after the Vue transform ran — ${censusNote} — ${detail}`
          : // Deliberately NOT worded as "the harness is at fault" or as "the tool
            // is at fault". Zero corpus SFCs transformed is consistent with both a
            // gap in this harness's wiring for the pair AND a plugin that threw
            // during initialisation. This harness cannot tell them apart, so it
            // publishes no number and says whose gap the ambiguity is.
            `⏭ NOT MEASURED — the build failed before the Vue transform processed a single corpus SFC (${censusNote}), so this harness cannot attribute the failure: a gap in its own ${cell.integration.package} × ${cell.bundler.label} wiring and a plugin that throws at init look identical from here. No number and no verdict is published for ${cell.integration.label} on this cell. Underlying error: ${detail}`,
        // `skip` when nothing can be attributed (no number, no blame); a thrown
        // error for an attributable failure so it carries the ❌ marker. Either
        // way the measure never rebuilds — five identical failures are five
        // identical stack traces, not five measurements.
        ...(transformRan
          ? {
              measure: () => {
                throw new Error(detail);
              },
            }
          : { skip: true }),
      });
      continue;
    }

    const best = bestById.get(cell.bundler.id) ?? 0;
    const survivors = survivorsById.get(cell.bundler.id) ?? 0;
    let { ranked: compiledAll, matchesPeers, soleSurvivorShortfall } = corpusCompileVerdict({
      compiled: gate.vueModules,
      best,
      survivors,
      fileCount,
    });
    // Containment: a build that EXTERNALISED any of its own SFC sub-requests
    // replaced that work with require() stubs, and its census counts facades of
    // components whose blocks were never compiled. The number is real wall-clock
    // for unreal work, so it is measured and unranked, whatever the SFC count
    // says — the vue-loader cells that motivated this passed the count at
    // 162/162 while compiling nothing.
    const leakedSubRequests = gate.externalizedVueRequests ?? 0;
    if (leakedSubRequests > 0) compiledAll = false;
    // A census ABOVE the entry list is arithmetic proof of double counting that
    // survived key normalisation. The clamp on bestById protects the PEERS from
    // an inflated anchor; this protects the READER from the incoherent cell
    // itself, which would otherwise pass `compiled >= best` and rank on a count
    // that cannot prove anything.
    const incoherentCensus = gate.vueModules > fileCount;
    if (incoherentCensus) compiledAll = false;
    const notes = [
      `${cell.integration.strategy} · compiled ${gate.vueModules}/${fileCount} corpus SFCs · ${gate.styleRequests} style sub-requests · ${gate.outputBytes.toLocaleString()} output bytes`,
      cell.integration.notes,
      cell.bundler.notes,
    ];
    if (leakedSubRequests > 0) {
      notes.push(
        `⚠ FAILED SUB-REQUEST CONTAINMENT GATE — ${leakedSubRequests} of this integration's own SFC sub-request(s) were EXTERNALISED instead of compiled, so part of the corpus in this cell is require() stubs rather than compiled components. Measured but UNRANKED: the wall-clock is real, the work is not.`,
      );
    }
    if (incoherentCensus) {
      notes.push(
        `⚠ FAILED CENSUS COHERENCE — counted ${gate.vueModules} corpus SFCs where the app's entry lists ${fileCount}. A count above the corpus is double counting, and a count that is provably wrong in one direction cannot prove coverage in the other. Measured but UNRANKED.`,
      );
    }
    if (!matchesPeers) {
      notes.push(
        `⚠ FAILED CORPUS COMPILE GATE — reached ${gate.vueModules} corpus SFCs where the best cell for ${cell.bundler.label} reached ${best}. Measured but UNRANKED: a build that compiles less of the corpus is not a faster build.`,
      );
    } else if (soleSurvivorShortfall) {
      notes.push(
        `⚠ FAILED CORPUS COMPILE GATE — this is the ONLY cell that built for ${cell.bundler.label}, and it compiled ${gate.vueModules} of ${fileCount} corpus SFCs. With no peer cell there is nothing to show whether the missing ${fileCount - gate.vueModules} are unreachable in this corpus or were skipped by this integration, and the peer anchor is satisfied only because this cell IS the anchor. Measured but UNRANKED rather than ranked first against nothing.`,
      );
    } else if (gate.vueModules < fileCount) {
      // Ranked, because every surviving cell in the class reached the same bar —
      // but the reader is told the bar is below the corpus, not at it.
      notes.push(
        `ⓘ the best cell for ${cell.bundler.label} reached ${best} of ${fileCount} corpus SFCs, so this group's gate is anchored BELOW the corpus: the missing ${fileCount - best} were not compiled by any cell here and are treated as unreachable in this corpus rather than as a fault of any integration.`,
      );
    }
    if (survivors === 1) {
      notes.push(
        `ⓘ only cell that built for ${cell.bundler.label} — a "vs fastest" of 1.00x in this group means "the only row that ran", not "faster than the reference implementation".`,
      );
    }

    variants.push({
      ...base,
      unranked: !compiledAll,
      notes: notes.filter(Boolean).join(" | "),
      measure: async ({ phase, iteration }) => {
        const outDir = join(workRoot, "bundle-out", `${cell.id}-${phase}-${iteration}`);
        try {
          const r = await cell.run({ appDir, entry, outDir });
          return {
            ms: r.ms,
            meta: {
              artifact: r.outputBytes,
              vueModules: r.vueModules,
              styleRequests: r.styleRequests,
              externals: r.externals,
            },
          };
        } finally {
          rmSync(outDir, { recursive: true, force: true });
        }
      },
    });
  }

  const results = await measureVariants([...variants, ...unavailable], {
    runs: options.runs,
    // The corpus-compile gate already built every cell once, untimed, on the
    // identical code path — THAT is the discarded warm pass. Running another
    // warmup build repeated ~35 s of full-corpus work per cell to warm caches
    // the gate had just warmed. Disclosed in the methodology; measured-run
    // count is unchanged.
    warmups: GATE_IS_THE_WARM_PASS,
    fileCount,
  });

  // One group per bundler. The bundler is the comparison class: mixing Rollup,
  // Rolldown and webpack rows into one ranking would rank bundler architectures
  // while appearing to rank Vue integrations.
  const groups = BUNDLERS.map((b) => ({
    id: b.id,
    label: `${b.label} — Vue integrations compared`,
    variants: results.filter((r) => r.target === b.id),
  })).filter((g) => g.variants.length > 0);

  return {
    id: "bundle",
    label: `Bundle (production build) — ${resolved.selector}`,
    files: fileCount,
    bytes: resolved.bytes,
    groups,
    groupingNote:
      "Grouped by **bundler**, ranked within each group by Vue integration. Rows from different bundlers are never ranked against each other: read **across a row** (same bundler, different integration) for the Vue layer, and **down a column** (same integration, different bundler) for bundler architecture — the second is context, not a verdict.",
    variants: results,
    methodology: bundleMethodology(resolved, fileCount, { stagingNote, closureCopied }),
  };
}

function bundleMethodology(resolved, fileCount, { stagingNote = null, closureCopied = 0 } = {}) {
  return [
    `Corpus: ${resolved.selector} @ ${resolved.sha ? resolved.sha.slice(0, 8) : "unknown"} — ${fileCount} SFCs, ${resolved.corpus.kind}, ${resolved.project.license}. Sources are third-party and unmodified.`,
    stagingNote,
    `The staged copy carries the corpus SFCs' RELATIVE import closure (${closureCopied} extra source files) so @vue/compiler-sfc can resolve imported prop types from disk, exactly as it can in the real checkout. Closure files exist for the COMPILER only: the bundler-facing resolvers externalise them, so the module graph is still exactly the corpus.`,
    "Every cell builds the SAME generated entry over the SAME corpus. Each project's own build config is deliberately NOT used: it measures that project's chunking, asset and prerender choices far more than the Vue toolchain, and it cannot be held constant while the bundler is swapped.",
    "Module graph = the corpus. Any specifier that does not resolve to a real file outside node_modules is marked EXTERNAL and left in the output — so no cell is credited for resolving less or charged for a dependency another happened to have on disk. Implemented per bundler family (Rollup-shaped `resolveId` vs webpack `externals`) against the same rule.",
    "⚠ One DISCLOSED per-integration graph-edge difference in the webpack family: a sibling-SFC import written inside an unplugin VIRTUAL module is deliberately externalised (webpack cannot re-base its resolver for a virtual issuer, so keeping it internal fails the build from the wrong directory), while vue-loader's real-path modules keep the same edge internal. The component named by the edge is still compiled exactly once in every cell — it enters through the generated entry — so the work difference is the edge itself, not the compilation.",
    "Externalising rather than stubbing is deliberate: an ESM stub cannot satisfy named imports, so a stubbing harness silently drops a different set of modules per bundler.",
    "SFC CUSTOM BLOCKS (<markdown>, <playground-*>, <i18n>, …) are consumed by an inert harness-side sink in every cell — the generated shell drops each project's own build config and with it whatever plugin consumed those blocks, so without the sink the bundler's JS parser fails on prose and the census rule attributes a harness gap to the integration. Style blocks have their own handling per family; script and template always go to the integration under test.",
    enabledBundlers().some((b) => b.id === "vite7")
      ? null
      : "Vite 7 (Rollup) is an OPT-IN study, not part of the default matrix — enable with BENCH_BUNDLERS=vite8,vite7,rolldown,rspack,webpack. Vite 8 is the current release; the 7-vs-8 comparison measures Rollup vs Rolldown under Vite and does not change any integration's standing within a group.",
    "No minification and no tree-shaking/side-effect elimination in any cell. Minifying folds a second, bundler-specific tool into the number; dead-code elimination would reward a bundler for discarding corpus modules.",
    "Corpus-compile gate: one untimed build per cell counts how many corpus SFCs were compiled. A cell reaching fewer than the best cell FOR THE SAME BUNDLER — the same key the tables are grouped and ranked by — is measured but UNRANKED. The count is keyed on the source SFC, not the intermediate module id, because integrations rename them (Vize hands the bundler `.vue.ts` sidecars).",
    "Where a bundler has only ONE surviving cell, the peer anchor is that cell itself, so it is gated against the CORPUS instead: a lone cell that compiled part of the corpus is unranked, because nothing shows whether the rest is unreachable here or was skipped by that integration. A lone cell that did clear the corpus is ranked and labelled as the only row that ran, so its 1.00x is not read as beating a reference implementation that is absent.",
    "Where every surviving cell reached the same count and that count is below the corpus, the rows are ranked and the shortfall is disclosed: it is common to every cell, so it is treated as unreachable code in this corpus rather than as a fault of any integration.",
    "A cell whose build FAILED is classified on the transform census the driver recorded before it threw, never on the wording of the error. Corpus SFCs compiled and then a failure is ❌ attributable to the integration; zero corpus SFCs compiled is ⏭ NOT MEASURED, because a gap in this harness's wiring for that pair and a plugin that throws at init are indistinguishable from here — so no number and no verdict is published either way. The previous test looked for `?vue` in the error text, a sub-request shape only vue-loader emits, which meant the other integrations' codegen bugs were excused as harness gaps.",
    "Vize's plugin pre-compiles the whole corpus in a native batch at plugin-init and serves modules from that cache; the unplugin/loader rows compile lazily per module. The pre-pass is inside the timed region, so the totals are comparable; per-module cost is not. Every row's notes name its strategy — no row is excused on the strength of its strategy.",
    "No tool is exempt and none is given the benefit of the doubt. @vitejs/plugin-vue (Vite family) and vue-loader (webpack family) are the BASELINES, not the favourites: they are the reference each group is read against, and they are gated, bracketed and failed on exactly the same terms as everything else — the codegen gate has bracketed the official compiler on this corpus before now. Vize and Verter are under heavy development and are expected to fail cases; a failure is reported with its module and its diagnostic, and neither softened nor editorialised.",
    "Bundler families are not comparable line-for-line. A webpack build and a Rollup build of the same corpus differ in module runtime, chunk graph and output format as well as in Vue plugin, which is why they are separate groups.",
    "EXPRESSION dynamic imports (template-literal `import()`) whose static prefix does not resolve in the staged app are non-fatal in every family: the Rollup family externalises the unresolved specifier, and the webpack family ignores exactly those corpus-derived prefixes via IgnorePlugin — the one mechanism that reaches ContextModules, which never consult the externals callback (criticality parser flags only demote the warning, not the resolution error). A prefix that DOES resolve is never ignored, so a real missing module still fails. Before this was equalised, one such import in vuetify's docs failed the ENTIRE webpack family — its own baseline included — while the Vite cells passed, publishing an environment gap as six tool verdicts.",
    "Vite 8 IS the Rolldown migration (it depends on rolldown ~1.1); the standalone rolldown-vite package is deprecated in its favour. Vite 7 (Rollup) vs Vite 8 (Rolldown) is therefore the honest engine axis, and the bare Rolldown group shows what Vite's own pipeline costs on top of the same bundler.",
    "The corpus is copied into a work directory; the checked-out third-party repository is never written to.",
    "The DISCARDED WARM PASS is the corpus-compile gate build: every cell is built once, untimed, on the identical code path before any timing, which warms much of what a dedicated warmup would (module and OS caches; JIT tiering continues to settle over subsequent executions). The gate runs in fixed cell order — and so does measured run 0, which makes the gate-to-first-measure distance IDENTICAL for every cell; later runs rotate. Run 0 is each cell's second-ever execution and may carry a small residual that JS-implemented integrations feel more than native ones; at two measured runs the median averages it. Measured-run count is unchanged.",
    "Ranking metric is the median of measured runs.",
  ].filter(Boolean);
}
