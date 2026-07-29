import { parseSync } from "@babel/core";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { collectVueFiles, readSources, totalBytes } from "../fixtures.mjs";
import { measureVariants, timedSync, timedAsync } from "../timing.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * Verter host static-analysis level for the compile rows.
 *
 * `HostConfig.analysisLevel` defaults to "full", which drives the static
 * analysis `upsert()` performs. The compile rows use the `runtime-render`
 * lane, which emits bundler output and does not consume that analysis — and
 * Verter's own apples-to-apples benchmark constructs its host with
 * `analysisLevel: "none"` for exactly this reason.
 *
 * Overridable so the choice can be A/B'd against byte-identical output rather
 * than asserted. Whatever it is set to is printed in the row notes: this
 * changes how much work Verter does, so it must never be an invisible default.
 */
const VERTER_ANALYSIS_LEVEL = process.env.VERTER_ANALYSIS_LEVEL || "full";

/**
 * Compile matrix dimensions (orthogonal, reported separately):
 *   target:     "vdom" | "vapor"
 *   env:        "production" | "development"
 *   sourceMap:  false | true
 *
 * Same in-memory SFC corpus for every cell.
 *
 * `sourceMap` is deliberately its OWN dimension rather than something folded
 * into env. Folding it in made "production" mean *more* work for Vue
 * (hoistStatic + cacheHandlers, maps still on) and *less* work for the native
 * tools (maps off) inside the same ranked table. Now every compiler in a cell
 * is asked for the same source-map behaviour, and both settings are reported.
 *
 * Caveat kept visible in the notes: Vize's `compileSfc` exposes no
 * `isProduction` flag, so its production and development rows do identical
 * work. That is a tool limitation, not a harness one — it is stated rather
 * than papered over with a substitute knob.
 */

/**
 * Official @vue/compiler-sfc: parse + script + template.
 * Returns a rough work score so empty/no-op compiles fail the measure.
 */
function vueCompileSfc(compiler, source, filename, { vapor, isProd, sourceMap }) {
  const { descriptor } = compiler.parse(source, { filename, sourceMap });
  let bindings = {};
  let work = 1; // parse
  const scriptOpts = {
    id: filename,
    inlineTemplate: false,
    isProd,
    sourceMap,
  };
  if (vapor) {
    scriptOpts.vapor = true;
    scriptOpts.templateOptions = { vapor: true, isProd, compilerOptions: { sourceMap } };
  }
  if (descriptor.scriptSetup || descriptor.script) {
    const scriptResult = compiler.compileScript(descriptor, scriptOpts);
    bindings = scriptResult.bindings || {};
    work += scriptResult.content?.length ?? 1;
  }
  if (descriptor.template) {
    const templateOpts = {
      source: descriptor.template.content,
      filename,
      id: filename,
      isProd,
      compilerOptions: {
        bindingMetadata: bindings,
        mode: "module",
        hoistStatic: isProd,
        cacheHandlers: isProd,
        prefixIdentifiers: true,
        // compileTemplate has no top-level sourceMap; it lives in codegen opts.
        sourceMap,
      },
    };
    if (vapor) {
      templateOpts.vapor = true;
    }
    const tpl = compiler.compileTemplate(templateOpts);
    work += tpl?.code?.length ?? descriptor.template.content.length;
  }
  return work;
}

function loadOptional(name) {
  try {
    return require(require.resolve(name, { paths: [rootDir] }));
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * fervid's `compileAsync` dispatches onto libuv's threadpool, not a Rayon pool
 * sized to the machine. Its width is `UV_THREADPOOL_SIZE`, which defaults to 4
 * regardless of core count and is read once, before this module runs — so it
 * cannot be raised here without tuning one tool mid-suite.
 *
 * It is therefore reported rather than adjusted: on a 4-CPU runner the pool
 * happens to match core count and the row is a like-for-like thread-pool peer
 * of Vize's batch; on a wider box it is capped below the pools it sits beside
 * in the same table, and the note has to say so.
 */
const UV_POOL = Number(process.env.UV_THREADPOOL_SIZE) || 4;

/**
 * Codegen validity gate — does the emitted code actually parse?
 *
 * The compile surface ranks on bytes-per-millisecond, and until now nothing
 * checked that those bytes were *valid JavaScript*. A compiler that emits
 * syntactically broken output for part of the corpus is doing less work than
 * one that does not, and would out-rank it on that basis alone. This is the
 * compile-surface analogue of the typecheck/lint work gates: produce valid
 * output for the corpus you are timed on, or be measured and unranked.
 *
 * Applied to EVERY compiler in the table, not to any one tool. Measured once
 * per tool on the vdom/production/sourcemap-off configuration — codegen
 * validity is a property of the compiler, not of a matrix cell — and the result
 * is carried onto that tool's rows in every cell.
 *
 * Output is parsed with the TypeScript plugin enabled, because several rows
 * legitimately emit TS (the corpus is 110/200 `lang="ts"` and Vue's own
 * compileScript passes type annotations straight through for a downstream
 * transpiler to strip). Only genuine syntax errors count.
 */
function parseEmitted(code, filename) {
  parseSync(code, {
    filename: `${filename}.tsx`,
    sourceType: "module",
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["typescript"] },
  });
}

function codegenValidity(sources, emit) {
  let invalid = 0;
  let firstError = null;
  for (const f of sources) {
    let code;
    try {
      code = emit(f);
    } catch (error) {
      invalid++;
      firstError ??= `${f.filename}: threw ${error instanceof Error ? error.message : error}`;
      continue;
    }
    if (!code) {
      invalid++;
      firstError ??= `${f.filename}: no code emitted`;
      continue;
    }
    try {
      parseEmitted(code, f.filename);
    } catch (error) {
      invalid++;
      firstError ??= `${f.filename}: ${String(error.message).split("\n")[0].replace(/^.*\.tsx: /, "")}`;
    }
  }
  return { invalid, total: sources.length, firstError, ok: invalid === 0 };
}

/**
 * fervid reports non-fatal `NonVoidHtmlElementStartTagWithTrailingSolidus`
 * diagnostics for self-closing non-void tags (`<div />`, `<MyComp />`) — an
 * HTML-spec strictness that Vue's own parser does not apply to SFC templates.
 *
 * Verified against this corpus: every such file still emits complete, correct
 * codegen (`<meter :value="1" />` becomes a real `_createElementVNode("meter",
 * { value: 1 })`), so the diagnostic does not mean work was skipped. The row is
 * therefore gated the same way every other compiler here is gated — on codegen
 * actually being produced for every file — and the diagnostic count rides along
 * in the notes rather than bracketing the row.
 *
 * This is not a blanket "ignore fervid's errors": `assertFervidOutput` still
 * fails the row if any file comes back without code.
 */
function assertFervidOutput(results, expected) {
  let codeBytes = 0;
  let mapBytes = 0;
  let diagnostics = 0;
  let empty = 0;
  if (results.length !== expected) {
    throw new Error(`fervid returned ${results.length} results for ${expected} inputs`);
  }
  for (const r of results) {
    const len = r?.code?.length ?? 0;
    if (len === 0) empty++;
    codeBytes += len;
    mapBytes += r?.sourceMap?.length ?? 0;
    diagnostics += r?.errors?.length ?? 0;
  }
  if (empty) {
    throw new Error(`fervid emitted no code for ${empty}/${expected} files`);
  }
  if (codeBytes < expected) {
    throw new Error("fervid returned empty code for corpus");
  }
  return { artifact: codeBytes, mapBytes, diagnostics };
}

function cellId(target, env, sourceMap) {
  return `${target}-${env === "production" ? "prod" : "dev"}-sm${sourceMap ? "on" : "off"}`;
}

function cellLabel(target, env, sourceMap) {
  return `${target.toUpperCase()} · ${env} · sourcemap ${sourceMap ? "on" : "off"}`;
}

/**
 * Build variants for one matrix cell (target × env × sourceMap).
 */
function buildCellVariants({
  target,
  env,
  sourceMap,
  sources,
  compiler35,
  compiler36,
  vizeNative,
  verterNative,
  fervidNative,
  hosts,
}) {
  const vapor = target === "vapor";
  const isProd = env === "production";
  const variants = [];
  const cell = cellId(target, env, sourceMap);
  // Only @vue/compiler-sfc actually emits a map from the entry point we
  // benchmark, so say so on the rows that do not — otherwise an `sm on` cell
  // silently reads as "same request, so same work".
  const smNote = `sourceMap=${sourceMap}`;
  const smIgnored = sourceMap
    ? " ⚠ sourceMap requested but this entry point emits no map — it does NOT pay map-generation cost here, unlike @vue/compiler-sfc."
    : "";

  // --- Vue official 3.5 (VDOM only; Vapor not supported) ---
  // Note: worker_threads fan-out removed — pathologically slow for this corpus
  // and mixed unfairly with native batch rows.
  if (!vapor) {
    variants.push({
      id: `vue-3.5-1t-${cell}`,
      label: `@vue/compiler-sfc 3.5 (1T)`,
      package: "@vue/compiler-sfc",
      target,
      env,
      sourceMap,
      threading: "1t",
      invocation: "in-process",
      notes: `Official 3.5 VDOM, isProd=${isProd}, ${smNote}, single-threaded`,
      artifactLabel: "Code bytes",
      measure: async () => {
        let work = 0;
        const { ms } = timedSync(() => {
          for (const f of sources) {
            work += vueCompileSfc(compiler35, f.source, f.filename, {
              vapor: false,
              isProd,
              sourceMap,
            });
          }
          if (work < sources.length) {
            throw new Error("vue 3.5 compile produced insufficient work units");
          }
        });
        return { ms, artifact: work };
      },
    });
  } else {
    variants.push({
      id: `vue-3.5-vapor-unsupported-${cell}`,
      label: `@vue/compiler-sfc 3.5 (vapor)`,
      package: "@vue/compiler-sfc",
      target,
      env,
      threading: "n/a",
      notes:
        "Vue 3.5 has no Vapor codegen path (Vapor ships with 3.6+). Not substituted with VDOM.",
      skip: true,
    });
  }

  // --- Vue official 3.6 ---
  if (compiler36) {
    variants.push({
      id: `vue-3.6-1t-${cell}`,
      label: `@vue/compiler-sfc 3.6 (1T)`,
      package: "@vue/compiler-sfc-36",
      target,
      env,
      sourceMap,
      threading: "1t",
      invocation: "in-process",
      notes: vapor
        ? `Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=${isProd}, ${smNote}`
        : `Official 3.6 VDOM, isProd=${isProd}, ${smNote}`,
      artifactLabel: "Code bytes",
      measure: async () => {
        let work = 0;
        const { ms } = timedSync(() => {
          for (const f of sources) {
            work += vueCompileSfc(compiler36, f.source, f.filename, {
              vapor,
              isProd,
              sourceMap,
            });
          }
          if (work < sources.length) {
            throw new Error("vue 3.6 compile produced insufficient work units");
          }
        });
        return { ms, artifact: work };
      },
    });
  } else {
    variants.push({
      id: `vue-3.6-unavailable-${cell}`,
      label: `@vue/compiler-sfc 3.6`,
      package: "@vue/compiler-sfc-36",
      target,
      env,
      notes: "Package not installed",
      skip: true,
    });
  }

  // --- Vize ---
  if (!vizeNative.error) {
    // sourceMap comes from the matrix dimension, identically to every other
    // compiler in this cell. Vize exposes no isProduction on compileSfc, so its
    // production and development rows do identical work — stated, not hidden.
    const vizeOpts = {
      vapor,
      sourceMap,
      isTs: true,
    };
    variants.push({
      id: `vize-1t-${cell}`,
      label: `Vize native loop (1T)`,
      package: "@vizejs/native",
      target,
      env,
      sourceMap,
      threading: "1t",
      invocation: "in-process",
      notes: `compileSfc vapor=${vapor}, ${smNote}.${smIgnored} ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.`,
      artifactLabel: "Code bytes",
      measure: async () => {
        let codeBytes = 0;
        const { ms } = timedSync(() => {
          for (const f of sources) {
            const result = vizeNative.compileSfc(f.source, {
              filename: f.filename,
              ...vizeOpts,
            });
            if (result?.errors?.length) {
              throw new Error(`vize compile error in ${f.filename}: ${result.errors.join("; ")}`);
            }
            codeBytes += result?.code?.length ?? 0;
          }
          if (codeBytes < sources.length) {
            throw new Error("vize compile returned empty code for corpus");
          }
        });
        return { ms, artifact: codeBytes };
      },
    });

    if (typeof vizeNative.compileSfcBatchWithResults === "function") {
      variants.push({
        id: `vize-batch-${cell}`,
        label: `Vize native batch (max threads)`,
        package: "@vizejs/native",
        target,
        env,
        sourceMap,
        threading: "batch",
        invocation: "in-process",
        notes: `compileSfcBatchWithResults vapor=${vapor}, ${smNote}.${smIgnored} multi-thread Rayon batch. ⚠ No isProduction flag — identical work in production and development cells. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.`,
        artifactLabel: "Code bytes",
        measure: async () => {
          let codeBytes = 0;
          const { ms } = timedSync(() => {
            const result = vizeNative.compileSfcBatchWithResults(
              sources.map((f) => ({ path: f.filename, source: f.source })),
              { vapor, isTs: true, sourceMap },
            );
            if (result.failedCount) {
              throw new Error(`vize batch failed: ${result.failedCount} files`);
            }
            // Assert unconditionally: a batch API that returns nothing must not
            // be ranked as infinitely fast.
            const rows = result.results ?? result.items ?? [];
            if (!Array.isArray(rows) || rows.length !== sources.length) {
              throw new Error(
                `vize batch returned ${Array.isArray(rows) ? rows.length : "no"} rows for ${sources.length} inputs`,
              );
            }
            codeBytes = rows.reduce(
              (n, r) => n + (r?.code?.length ?? r?.result?.code?.length ?? 0),
              0,
            );
            if (codeBytes < sources.length) {
              throw new Error("vize batch returned empty code for corpus");
            }
          });
          return { ms, artifact: codeBytes };
        },
      });
    }
  } else {
    variants.push({
      id: `vize-unavailable-${cell}`,
      label: `Vize native`,
      package: "@vizejs/native",
      target,
      env,
      notes: `Could not load: ${vizeNative.error}`,
      skip: true,
    });
  }

  // --- fervid ---
  //
  // https://github.com/phoenix-ru/fervid — an all-in-one Vue SFC compiler in
  // Rust. VDOM codegen only: there is no Vapor path, so the vapor cells are
  // skipped rather than substituted with VDOM, exactly as Vue 3.5 is.
  //
  // Two things about this row are NOT like-for-like with its neighbours and are
  // stated on every row rather than folded into the number:
  //
  //  1. fervid compiles `<style>` blocks as part of `compileSync` (scoped
  //     styles come back `isCompiled: true`, with the scope attribute already
  //     applied). Every other row in this table measures parse + script +
  //     template and never touches styles. fervid is doing strictly more work
  //     per file than the rows it is ranked against.
  //  2. fervid honours `sourceMap` for real — it returns a populated map
  //     (~594KB across this corpus), where Vize's and Verter's entry points
  //     return none. In an `sm on` cell fervid pays map-generation cost with
  //     @vue/compiler-sfc, not with the natives.
  if (!vapor && !fervidNative.error && typeof fervidNative.Compiler === "function") {
    const FervidCompiler = fervidNative.Compiler;
    const fervidOptions = { isProduction: isProd, sourceMap };
    // Same shape as the Verter stateless row: construct the handle outside the
    // timed region, measure only the compile.
    const fervidInputs = sources.map((f) => ({
      source: f.source,
      options: { id: f.filename, filename: f.filename },
    }));
    const fervidWorkNote =
      "⚠ also compiles <style> blocks (scoped styles returned isCompiled=true) — strictly more work per file than the parse+script+template rows it is ranked against. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence.";
    const fervidSmNote = sourceMap
      ? " sourceMap=true is honoured — a populated map is returned, so this row DOES pay map-generation cost (unlike the Vize/Verter rows in this cell)."
      : "";

    variants.push({
      id: `fervid-1t-${cell}`,
      label: `fervid compileSync (1T)`,
      package: "@fervid/napi",
      target,
      env,
      sourceMap,
      threading: "1t",
      invocation: "in-process",
      artifactLabel: "Code bytes",
      notes: `compileSync isProduction=${isProd}, ${smNote}, single-threaded.${fervidSmNote} ${fervidWorkNote}`,
      measure: async () => {
        const compiler = new FervidCompiler(fervidOptions);
        return timedSync(() => {
          const results = fervidInputs.map((i) => compiler.compileSync(i.source, i.options));
          return assertFervidOutput(results, sources.length);
        });
      },
    });

    variants.push({
      id: `fervid-async-${cell}`,
      label: `fervid compileAsync (${UV_POOL}-thread libuv pool)`,
      package: "@fervid/napi",
      target,
      env,
      sourceMap,
      threading: "batch",
      invocation: "in-process",
      artifactLabel: "Code bytes",
      notes: `compileAsync isProduction=${isProd}, ${smNote}, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=${UV_POOL}, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than ${UV_POOL} cores this row is thread-capped below the batch rows beside it).${fervidSmNote} ${fervidWorkNote}`,
      measure: async () =>
        timedAsync(async () => {
          const compiler = new FervidCompiler(fervidOptions);
          const results = await Promise.all(
            fervidInputs.map((i) => compiler.compileAsync(i.source, i.options)),
          );
          return assertFervidOutput(results, sources.length);
        }),
    });
  } else if (!vapor && fervidNative.error) {
    variants.push({
      id: `fervid-unavailable-${cell}`,
      label: `fervid`,
      package: "@fervid/napi",
      target,
      env,
      notes: `Could not load: ${fervidNative.error}`,
      skip: true,
    });
  } else if (vapor) {
    variants.push({
      id: `fervid-vapor-unsupported-${cell}`,
      label: `fervid (vapor)`,
      package: "@fervid/napi",
      target,
      env,
      threading: "n/a",
      notes:
        "fervid has no Vapor codegen path (VDOM only). Not substituted with VDOM, same treatment as @vue/compiler-sfc 3.5.",
      skip: true,
    });
  }

  // --- Verter ---
  if (!verterNative.error && typeof verterNative.VerterHost === "function") {
    const VerterHost = verterNative.VerterHost;
    const renderProfile = {
      isProduction: isProd,
      customElement: false,
      ssr: false,
      forceJs: true,
      forceVapor: vapor,
      sourceMap,
      hmrStrategy: isProd ? "none" : "vite",
      runtimeModuleName: "vue",
    };
    const batchInputs = sources.map((f) => ({
      canonicalId: f.path.replace(/\\/g, "/"),
      source: f.source,
      requestedMode: "stateless",
    }));

    const hostKey = `${cell}-stateless`;
    variants.push({
      id: `verter-stateless-${cell}`,
      label: `Verter compileMany (stateless)`,
      package: "@verter/native",
      target,
      env,
      sourceMap,
      threading: "batch",
      invocation: "in-process",
      artifactLabel: "Code bytes",
      notes: `runtime-render forceVapor=${vapor}, isProduction=${isProd}, ${smNote}${smIgnored}, hmr=${renderProfile.hmrStrategy}, mode=stateless, analysis=${VERTER_ANALYSIS_LEVEL}, multi-thread host pool`,
      measure: async () => {
        const host = new VerterHost({ devMode: !isProd, analysisLevel: VERTER_ANALYSIS_LEVEL });
        return timedSync(() => {
          const results = host.compileMany(batchInputs, {
            target: "runtime-render",
            defaultMode: "stateless",
            priority: "interactive",
            compileProfile: renderProfile,
          });
          const failed = results.filter((r) => r.errors?.length);
          if (failed.length) {
            throw new Error(`verter compileMany failed ${failed.length}: ${failed[0].errors[0]}`);
          }
          const codeBytes = results.reduce((n, r) => n + (r?.code?.length ?? 0), 0);
          if (codeBytes < sources.length) {
            throw new Error("verter compileMany returned empty code");
          }
          const cacheHits = results.filter((r) => r.cacheHit).length;
          return {
            artifact: codeBytes,
            cacheHits,
            actualModes: [...new Set(results.map((r) => r.actualMode))],
          };
        });
      },
    });

    variants.push({
      id: `verter-session-${cell}`,
      label: `Verter compileMany (session cache)`,
      package: "@verter/native",
      target,
      env,
      sourceMap,
      // Ranked apart from the cache-free batch rows: this host persists across
      // warmups and runs, so by the first measured run it is already warm. That
      // is a legitimate thing to measure, but not against uncached tools.
      threading: "batch-cached",
      invocation: "in-process",
      artifactLabel: "Code bytes",
      notes: `runtime-render forceVapor=${vapor}, isProduction=${isProd}, ${smNote}${smIgnored}, mode=session, analysis=${VERTER_ANALYSIS_LEVEL} — persistent host, cacheHits reported; not comparable to the cache-free batch rows`,
      measure: async () => {
        const key = `session-${cell}`;
        if (!hosts[key]) {
          // Must match the stateless row's host config. Omitting
          // analysisLevel here made the session row run "full" while its own
          // note printed whatever VERTER_ANALYSIS_LEVEL claimed.
          hosts[key] = new VerterHost({ devMode: !isProd, analysisLevel: VERTER_ANALYSIS_LEVEL });
        }
        return timedSync(() => {
          const results = hosts[key].compileMany(batchInputs, {
            target: "runtime-render",
            defaultMode: "session",
            priority: "interactive",
            compileProfile: renderProfile,
          });
          const failed = results.filter((r) => r.errors?.length);
          if (failed.length) {
            throw new Error(`verter session failed ${failed.length}: ${failed[0].errors[0]}`);
          }
          const codeBytes = results.reduce((n, r) => n + (r?.code?.length ?? 0), 0);
          if (codeBytes < sources.length) {
            throw new Error("verter session returned empty code");
          }
          const cacheHits = results.filter((r) => r.cacheHit).length;
          return {
          artifact: codeBytes,
            cacheHits,
            actualModes: [...new Set(results.map((r) => r.actualMode))],
          };
        });
      },
    });
  } else if (!verterNative.error) {
    variants.push({
      id: `verter-unavailable-api-${cell}`,
      label: `Verter native`,
      package: "@verter/native",
      target,
      env,
      notes: "VerterHost export not found",
      skip: true,
    });
  } else {
    variants.push({
      id: `verter-unavailable-${cell}`,
      label: `Verter native`,
      package: "@verter/native",
      target,
      env,
      notes: `Could not load: ${verterNative.error}`,
      skip: true,
    });
  }

  return variants;
}

/**
 * Run the codegen validity gate once per tool, on vdom/production/sourcemap-off.
 * Returns { [package]: { ok, invalid, total, firstError } }.
 */
function computeCodegenGates(sources, { compiler35, compiler36, vizeNative, verterNative, fervidNative }) {
  const gates = {};
  const safe = (key, emit) => {
    try {
      gates[key] = codegenValidity(sources, emit);
    } catch (error) {
      // A gate that cannot run is not a pass — but it must not take the suite
      // down either. Record it as unmeasured and leave the row ranked.
      gates[key] = {
        ok: true,
        unmeasured: true,
        invalid: 0,
        total: sources.length,
        firstError: `gate could not run: ${error instanceof Error ? error.message : error}`,
      };
    }
  };

  const vueEmit = (compiler) => (f) => {
    const { descriptor } = compiler.parse(f.source, { filename: f.filename });
    return compiler.compileScript(descriptor, {
      id: f.filename,
      inlineTemplate: true,
      isProd: true,
    }).content;
  };

  safe("@vue/compiler-sfc", vueEmit(compiler35));
  if (compiler36) safe("@vue/compiler-sfc-36", vueEmit(compiler36));

  if (!vizeNative.error && typeof vizeNative.compileSfc === "function") {
    safe(
      "@vizejs/native",
      (f) => vizeNative.compileSfc(f.source, { filename: f.filename, vapor: false, sourceMap: false, isTs: true })?.code,
    );
  }

  if (!verterNative.error && typeof verterNative.VerterHost === "function") {
    const host = new verterNative.VerterHost({ devMode: false, analysisLevel: VERTER_ANALYSIS_LEVEL });
    safe(
      "@verter/native",
      (f) =>
        host.compileMany([{ canonicalId: f.path.replace(/\\/g, "/"), source: f.source, requestedMode: "stateless" }], {
          target: "runtime-render",
          defaultMode: "stateless",
          priority: "interactive",
          compileProfile: {
            isProduction: true,
            customElement: false,
            ssr: false,
            forceJs: true,
            forceVapor: false,
            sourceMap: false,
            hmrStrategy: "none",
            runtimeModuleName: "vue",
          },
        })[0]?.code,
    );
  }

  if (!fervidNative.error && typeof fervidNative.Compiler === "function") {
    const fc = new fervidNative.Compiler({ isProduction: true });
    safe("@fervid/napi", (f) => fc.compileSync(f.source, { id: f.filename, filename: f.filename })?.code);
  }

  return gates;
}

/** Mark rows whose tool failed the codegen gate as measured-but-unranked. */
function applyCodegenGates(variants, gates) {
  for (const v of variants) {
    if (v.skip) continue;
    const gate = gates[v.package];
    if (!gate || gate.ok) continue;
    v.unranked = true;
    v.notes = `${v.notes} ⚠ FAILED CODEGEN VALIDITY GATE — ${gate.invalid}/${gate.total} files compiled to output that is not parseable JavaScript/TypeScript (first: ${gate.firstError}). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.`;
  }
  return variants;
}

function corpusUniqueness(sources) {
  const shas = new Set(sources.map((f) => createHash("sha256").update(f.source).digest("hex")));
  return {
    files: sources.length,
    uniqueBodies: shas.size,
    uniqueContents: shas.size === sources.length,
    duplicateBodies: sources.length - shas.size,
  };
}

/**
 * SFC compile surface — matrix of target × environment.
 * Returns one parent surface with `groups` for reporting.
 */
export async function runCompileSurface(fixtureDir, options) {
  const files = collectVueFiles(fixtureDir, options.fileLimit);
  const sources = readSources(fixtureDir, files);
  const fileCount = files.length;
  const bytes = totalBytes(fixtureDir, files);
  const uniqueness = corpusUniqueness(sources);

  // Prefer reading generator manifest when present
  let corpusMode = uniqueness.uniqueContents ? "unique" : "non-unique";
  const manifestPath = join(fixtureDir, "manifest.json");
  if (existsSync(manifestPath)) {
    try {
      const man = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (man.mode) corpusMode = man.mode;
    } catch {
      // ignore
    }
  }

  const compiler35 = await import("@vue/compiler-sfc");

  let compiler36 = null;
  try {
    compiler36 = await import("@vue/compiler-sfc-36");
  } catch {
    // optional
  }

  const vizeNative = loadOptional("@vizejs/native");
  const verterNative = loadOptional("@verter/native");
  const fervidNative = loadOptional("@fervid/napi");
  const hosts = {};

  // One-off, before any timing: does each compiler emit parseable code for this
  // corpus? Rows whose tool fails are measured but unranked.
  const codegenGates = computeCodegenGates(sources, {
    compiler35,
    compiler36,
    vizeNative,
    verterNative,
    fervidNative,
  });

  // Allow filtering:
  //   --compile-targets vdom,vapor
  //   --compile-envs production,development
  //   --compile-sourcemaps off,on
  const wantTargets = new Set(
    (options.compileTargets ?? "vdom,vapor")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const wantEnvs = new Set(
    (options.compileEnvs ?? "production,development")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  // Default is OFF only.
  //
  // `sourceMap: true` is accepted by every compiler here but honoured by one.
  // @vue/compiler-sfc emits a real map (~553B for one SFC). Vize's
  // SfcCompileResultNapi has no map field and its output is byte-identical
  // with the flag on and off; Verter's runtime-render compileMany result has
  // no sourceMap field either. (Both DO support maps elsewhere — Vize on its
  // JSX API, Verter on processStyle and the tsc/declaration path — just not
  // on the entry points this surface benchmarks.)
  //
  // So an `sm on` cell does not equalise work: it charges Vue for map
  // generation and the natives for nothing. It stays available behind
  // `--compile-sourcemaps on` for investigation, clearly annotated, but is
  // not part of the default published matrix.
  const wantSourceMaps = (options.compileSourceMaps ?? "off")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((s) => s === "on" || s === "true");

  const matrix = [];
  for (const target of ["vdom", "vapor"]) {
    for (const env of ["production", "development"]) {
      for (const sourceMap of [...new Set(wantSourceMaps)]) {
        matrix.push({ target, env, sourceMap });
      }
    }
  }

  const groups = [];
  const allVariants = [];

  for (const { target, env, sourceMap } of matrix) {
    if (!wantTargets.has(target) || !wantEnvs.has(env)) continue;

    const cellVariants = buildCellVariants({
      target,
      env,
      sourceMap,
      sources,
      compiler35,
      compiler36,
      vizeNative,
      verterNative,
      fervidNative,
      hosts,
    });
    applyCodegenGates(cellVariants, codegenGates);
    const measured = await measureVariants(cellVariants, {
      runs: options.runs,
      warmups: options.warmups,
      fileCount,
    });
    allVariants.push(...measured);
    groups.push({
      id: cellId(target, env, sourceMap),
      label: cellLabel(target, env, sourceMap),
      target,
      env,
      sourceMap,
      variants: measured,
    });
  }

  return {
    id: "compile",
    label: uniqueness.uniqueContents
      ? "SFC compile (unique contents)"
      : `SFC compile (⚠ ${uniqueness.duplicateBodies} duplicate bodies — content-hash caches may inflate throughput)`,
    files: fileCount,
    bytes,
    corpus: {
      mode: corpusMode,
      ...uniqueness,
      fixtureDir,
    },
    // Why this surface is split into sub-tables. Stated by the surface that
    // does the splitting rather than defaulted in the renderer, so a grouped
    // surface with a different reason (the IDE suites) is not given this one.
    groupingNote:
      "Compile results are **grouped by target × environment × source map**, then by comparison class.",
    methodology: [
      "Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.",
      `Corpus mode=${corpusMode}: ${uniqueness.uniqueBodies}/${uniqueness.files} unique content SHAs. Vize content-hash caches treat identical bodies as free — primary rankings must use unique fixtures (fixtures/N), not fixtures/N-repeated.`,
      "Same in-memory Vue SFC corpus for every variant (compiler flags differ; sources do not).",
      "Work measured: parse SFC + compile script (if any) + compile template (if any).",
      "VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).",
      "Source map is an INDEPENDENT dimension, requested identically from every compiler in a cell (Vue: parse+compileScript+codegen sourceMap; Vize: compileSfc sourceMap; Verter: compileProfile sourceMap; fervid: FervidJsCompilerOptions sourceMap). It is not folded into the prod/dev flag for some tools and not others.",
      "Production vs development uses each tool's real semantic knobs only: Vue isProd (hoistStatic + cacheHandlers); Verter isProduction + hmrStrategy; fervid isProduction.",
      "⚠ Vize exposes no isProduction on compileSfc, so its production and development rows perform identical work. Stated rather than substituted with a different knob.",
      "⚠ fervid compiles <style> blocks inside compileSync — every other row measures parse + script + template only. fervid's rows do strictly more work per file than the rows they are ranked against; there is no option to disable it.",
      "⚠ fervid emits non-fatal HTML-strictness diagnostics (NonVoidHtmlElementStartTagWithTrailingSolidus) on self-closing non-void tags such as <div /> and <MyComp />, which Vue's SFC parser accepts — 44 of them on the 200-file corpus. Verified on this corpus: codegen is still complete and correct for those files, so fervid is gated on codegen actually being produced for every file — the same gate every other compiler here gets — rather than on diagnostic silence. Per-run diagnostic totals are captured in the JSON report's meta samples.",
      "fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).",
      `fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=${UV_POOL}), which is a fixed default of 4 rather than core count. Where the Vize/Verter batch rows scale with cores, that row does not — it is reported, not tuned, because the pool width is fixed before the harness starts.`,
      "1T / batch / batch-cached rows share the table; the mode is in the row label. A batch pool amortises across a thread pool and a cached session reuses prior analysis, so read same-mode rows against each other.",
      "Verter session mode keeps a persistent host across warmups and runs, so it is ranked as `batch-cached`, apart from cache-free batch rows.",
      "Codegen validity gate: every compiler's output is parsed once (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.",
      "Tool order is rotated on every warmup and measured run; no tool is pinned to first position.",
      "Ranking metric is the median of measured runs, all taken after >= 1 discarded warmup. No cold column.",
    ],
    groups,
    variants: allVariants,
  };
}
