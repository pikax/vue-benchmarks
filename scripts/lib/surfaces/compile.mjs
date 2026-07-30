import { parseSync } from "@babel/core";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { collectVueFiles, readSources, totalBytes } from "../fixtures.mjs";
import { measureVariants, timedSync, timedAsync } from "../timing.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * Verter host static-analysis level for the compile rows: the DROP-IN default.
 *
 * `HostConfig.analysisLevel` drives the static analysis `upsert()` performs,
 * and its documented default is `"full"` — which is also what a drop-in user
 * gets, because Verter's own official plugin constructs its host with no
 * analysisLevel at all. The harness measures tools as their users receive
 * them, so `"full"` it is.
 *
 * The A/B record stays, because each alternative was seriously considered and
 * one briefly shipped: `"none"` (the tool's own benchmark setting) breaks
 * imported-type macro resolution outright on real corpora (element-plus,
 * 2026-07-30: 3/3 fail, 0 bytes); `"essential"` emits byte-identical output
 * ~6% faster and spent an afternoon as the default — a tuning gift no other
 * tool got a tuning pass for, which the drop-in standard reversed. Overridable
 * for re-A/B; whatever it is set to is printed in the row notes, because this
 * changes how much work Verter does and must never be an invisible default.
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
 * One error out of a compiler's error array, whatever shape it uses.
 *
 * Vue's compiler returns `CompilerError` objects, Vize returns strings, Verter
 * returns objects with a message. Normalised here so the three rows can be held
 * to the same policy with the same code.
 */
/**
 * Filesystem bridge handed to `@vue/compiler-sfc`'s `compileScript`.
 *
 * Vue resolves imported types by reading the files they live in, and refuses to
 * guess when it has no way to read them. Native compilers open files themselves,
 * so they need no equivalent — which means omitting this does not "treat all
 * tools the same", it uniquely disables one of them.
 *
 * `realpath` matters on Windows: the corpus is staged into a work directory and
 * type imports resolve through it, so returning the path unchanged is correct
 * here and avoids a symlink round-trip per lookup.
 */
export const compilerFs = {
  // isFile(), NOT existsSync(): existsSync answers true for DIRECTORIES, and the
  // compiler's resolveExt tries the bare path before any extension — so a
  // directory-module import (`./use-delayed-toggle` → `use-delayed-toggle/index.ts`)
  // "resolved" to the directory itself, whose readFile returns undefined, and every
  // type that module exports silently vanished into an empty scope. On Element Plus
  // that surfaced as "Failed to resolve extends base type" on all baseline rows —
  // blaming the reference compiler for the bridge's answer. ts.sys.fileExists, which
  // this bridge stands in for, is false for directories.
  fileExists: (file) => {
    try {
      return statSync(file).isFile();
    } catch {
      return false;
    }
  },
  readFile: (file) => {
    try {
      return readFileSync(file, "utf8");
    } catch {
      return undefined;
    }
  },
  realpath: (file) => file,
};

/**
 * Hand @vue/compiler-sfc a TypeScript module for type-import resolution.
 *
 * Non-relative type imports (`@element-plus/components/...`) are resolved through
 * ts.resolveModuleName against the nearest tsconfig — but only if a TS module has
 * been registered. Vite's plugin-vue registers one in every real build; a harness
 * that does not is not "treating all tools the same", it is uniquely disabling the
 * reference implementation's cross-package type resolution and publishing the
 * failure as the baseline's ❌ (same reasoning as the fs bridge above).
 *
 * The harness's own TypeScript (the declared JS arm) is used for every corpus, so
 * resolution behaviour is uniform across projects rather than varying with each
 * checkout's pinned TS.
 */
export function registerCompilerTS(compiler) {
  if (typeof compiler?.registerTS !== "function") return;
  compiler.registerTS(() => require(require.resolve("typescript", { paths: [rootDir] })));
}

/**
 * The path a compiler should be told a source lives at: ABSOLUTE.
 *
 * Compilers resolve imported types relative to the filename they are given, so a
 * relative one anchors nothing. @vue/compiler-sfc reported "Failed to resolve
 * import source \"./affix\"" across all 162 Element Plus components for exactly
 * this reason, while the natives — which do not resolve imported types that way —
 * passed. Reports keep the short relative name; only the compilers see this.
 */
function srcId(f) {
  return f.path ?? f.filename;
}

function firstCompileError(errors) {
  const e = errors?.[0];
  if (!e) return "unknown error";
  return String(e.message ?? e).split("\n")[0].slice(0, 300);
}

/**
 * Official @vue/compiler-sfc: parse + script + template.
 * Returns a rough work score so empty/no-op compiles fail the measure.
 *
 * ## Errors are FATAL here, exactly as they are for Vize and Verter
 *
 * `parse()` and `compileTemplate()` return their diagnostics in an `errors`
 * array rather than throwing, and this function used to discard both — while the
 * Vize row throws on `result.errors.length` and the Verter row throws on
 * `results.filter(r => r.errors?.length)`. That asymmetry is a thumb on the scale
 * for the reference implementation: a file Vue could not parse was billed as
 * cheap work successfully done and left the row ranked, where the same failure in
 * a challenger produced a ❌.
 *
 * So the three rows now share one policy: a non-empty `errors` array from any of
 * them fails the measure. fervid is deliberately NOT folded in here — it emits
 * documented non-fatal HTML-strictness diagnostics for `<div />` and is gated on
 * codegen actually being produced instead; that difference is disclosed on every
 * fervid row and in the surface methodology rather than being silently applied.
 */
function vueCompileSfc(compiler, source, filename, { vapor, isProd, sourceMap }) {
  const { descriptor, errors: parseErrors } = compiler.parse(source, { filename, sourceMap });
  if (parseErrors?.length) {
    throw new Error(
      `vue parse error in ${filename} (${parseErrors.length}): ${firstCompileError(parseErrors)}`,
    );
  }
  let bindings = {};
  let work = 1; // parse
  const scriptOpts = {
    id: filename,
    inlineTemplate: false,
    isProd,
    sourceMap,
    // Required the moment an SFC imports a TYPE from another file:
    // `defineProps<Props>()` where `Props` lives in a sibling `.ts`. Without it
    // @vue/compiler-sfc throws "No fs option provided to `compileScript` in
    // non-Node environment", and since parse/template errors are (correctly)
    // fatal for every compiler here, the REFERENCE implementation showed ❌ on
    // Element Plus — 162 library components that do exactly this — while the
    // native challengers, which resolve from disk themselves, showed ok.
    //
    // That is the harness blaming the baseline for something the harness failed
    // to give it. Vite's own plugin-vue passes an fs bridge for the same reason;
    // this is the same bridge, and it is what makes the row comparable to tools
    // that never needed to be told.
    fs: compilerFs,
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
    if (tpl?.errors?.length) {
      throw new Error(
        `vue template error in ${filename} (${tpl.errors.length}): ${firstCompileError(tpl.errors)}`,
      );
    }
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
 * Applied to EVERY compiler in the table, not to any one tool, and computed
 * once per (target × environment) cell with that cell's flags — see
 * computeCodegenGates, which owns the reasoning. (An earlier revision ran it
 * once on vdom/production and stamped that verdict everywhere; this sentence
 * used to describe that behaviour, which invited re-simplifying back to it.)
 *
 * Output is parsed with the TypeScript plugin enabled, because several rows
 * legitimately emit TS (the corpus is 110/200 `lang="ts"` and Vue's own
 * compileScript passes type annotations straight through for a downstream
 * transpiler to strip). Only genuine syntax errors count.
 *
 * An emit may be several MODULES (Vue's script and template halves are each
 * their own module in every real pipeline); each is parsed separately —
 * concatenating them invented duplicate-binding errors no pipeline produces
 * (a script that legally declares top-level `render` collides with the
 * template's `render` export only in the concatenation).
 */
function parseEmitted(code, filename) {
  for (const module of Array.isArray(code) ? code : [code]) {
    parseSync(module, {
      filename: `${filename}.tsx`,
      sourceType: "module",
      babelrc: false,
      configFile: false,
      parserOpts: { plugins: ["typescript"] },
    });
  }
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
    if (!code || (Array.isArray(code) && code.every((m) => !m))) {
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
  makeVerterHost,
  // Sink for tools that produced NO measurement (a process abort, not a slow or
  // wrong answer). They get no table row — a ranking table is for things that
  // were ranked — and are reported above the tables instead.
  excluded = [],
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
            work += vueCompileSfc(compiler35, f.source, srcId(f), {
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
            work += vueCompileSfc(compiler36, f.source, srcId(f), {
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
      notes: `compileSfc vapor=${vapor}, isTs=true (TS passthrough — the cell's uniform standard; ⓘ Vize's own Vite plugin omits this flag, so a drop-in Vite user gets Vize STRIPPING types on every lang="ts" file — more work than benchmarked here), ${smNote}.${smIgnored} ⚠ Vize has no isProduction flag on compileSfc — this row does identical work in the production and development cells. Content-hash caches reward duplicate bodies — use unique fixtures for ranking.`,
      artifactLabel: "Code bytes",
      measure: async () => {
        let codeBytes = 0;
        const { ms } = timedSync(() => {
          for (const f of sources) {
            const result = vizeNative.compileSfc(f.source, {
              filename: srcId(f),
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
              sources.map((f) => ({ path: srcId(f), source: f.source })),
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
  const fervidProbe =
    !vapor && !fervidNative.error && typeof fervidNative.Compiler === "function"
      ? fervidSurvives(sources, { isProduction: isProd, sourceMap })
      : { ok: false, notInstalled: true, reason: "not applicable" };
  // `fervidProbe.ok` is the load-bearing clause: fervid is only ever loaded in
  // THIS process after a child process has proved it can compile this corpus
  // without aborting.
  if (
    !vapor &&
    !fervidNative.error &&
    typeof fervidNative.Compiler === "function" &&
    fervidProbe.ok
  ) {
    const FervidCompiler = fervidNative.Compiler;
    const fervidOptions = { isProduction: isProd, sourceMap };
    // Same shape as the Verter stateless row: construct the handle outside the
    // timed region, measure only the compile.
    const fervidInputs = sources.map((f) => ({
      source: f.source,
      options: { id: srcId(f), filename: srcId(f) },
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
  } else if (!vapor && !fervidProbe.ok && !fervidProbe.notInstalled) {
    // fervid aborted the survival probe, so it produced NO measurement — and a
    // table is for measurements. It gets no row at all, not even a bracketed one:
    // an entry in a ranking table implies something was ranked, and there is
    // nothing here to rank.
    //
    // It is recorded instead, and rendered above the tables as "Did not run", so
    // the failure is louder than a bracketed row rather than quieter. The two
    // things that must both be true — the reader learns fervid crashed, and the
    // other tools' numbers are unaffected — are met by recording rather than by
    // faking a row whose time never existed.
    excluded.push({
      tool: "fervid",
      package: "@fervid/napi",
      kind: "process-abort",
      cell,
      reason: fervidProbe.reason,
      detail:
        "fervid is a Rust compiler behind NAPI and signals unimplemented constructs with a panic. A panic on a NAPI thread cannot be caught from JavaScript — it aborts the host process — so fervid is probed in a child process and never loaded in-process for a corpus it cannot survive. This is a genuine tool finding on this corpus, not a harness gap.",
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
    const renderProfile = {
      isProduction: isProd,
      customElement: false,
      ssr: false,
      // ONE TypeScript-handling standard for the whole cell: PASSTHROUGH,
      // requested identically from every compiler (the sourceMap dimension's
      // pattern). The baseline passes type annotations through by design,
      // fervid passes them through, Vize is asked to via isTs:true — and
      // `forceJs: true` here made Verter THE ONLY compiler in the cell paying
      // TS→JS transpile work, undisclosed, while its own official plugin runs
      // forceJs:false under Vite. The flag also selects which Verter codegen
      // path the validity gate judges, so it must match what drop-in users run.
      forceJs: false,
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
      notes: `runtime-render forceVapor=${vapor}, isProduction=${isProd}, forceJs=false (TS passthrough — the cell's uniform standard, and Verter's own Vite path), ${smNote}${smIgnored}, hmr=${renderProfile.hmrStrategy}, mode=stateless, analysis=${VERTER_ANALYSIS_LEVEL} (the drop-in default — Verter's official plugin sets none, which means full), multi-thread host pool, workspace-backed host (project root as workspace — documented compileMany usage, same provision the fs bridge gives @vue/compiler-sfc)`,
      measure: async () => {
        const host = makeVerterHost({ devMode: !isProd, analysisLevel: VERTER_ANALYSIS_LEVEL });
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
      notes: `runtime-render forceVapor=${vapor}, isProduction=${isProd}, ${smNote}${smIgnored}, mode=session, analysis=${VERTER_ANALYSIS_LEVEL} — persistent workspace-backed host, cacheHits reported; not comparable to the cache-free batch rows`,
      measure: async () => {
        const key = `session-${cell}`;
        if (!hosts[key]) {
          // Must match the stateless row's host config. Omitting
          // analysisLevel here made the session row run "full" while its own
          // note printed whatever VERTER_ANALYSIS_LEVEL claimed.
          hosts[key] = makeVerterHost({ devMode: !isProd, analysisLevel: VERTER_ANALYSIS_LEVEL });
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
 * Run the codegen validity gate for ONE matrix configuration (target × env).
 *
 * Returns { [package]: { ok, invalid, total, firstError } }.
 *
 * ## Why this is per-configuration and not once
 *
 * It used to run once, on vdom/production, and stamp that verdict onto every row
 * in every cell — including the Vapor and development cells, which it had never
 * exercised. Vapor is a completely different codegen backend and development mode
 * emits different code (HMR wiring, no hoisting), so a pass on vdom/production is
 * not evidence about either. In the direction that matters, a tool whose Vapor
 * output does not parse kept a ranked Vapor row on the strength of its VDOM
 * output; in the other, a tool bracketed for a VDOM bug was bracketed in cells
 * where its output may have been fine. Both are the gate lying about what it
 * checked.
 *
 * Source maps are NOT a gate dimension: a map is emitted beside the code and does
 * not change whether the code parses. That is stated in the methodology rather
 * than silently assumed.
 *
 * @param {{vapor: boolean, isProd: boolean}} config the cell being gated
 */
function computeCodegenGates(
  sources,
  { compiler35, compiler36, vizeNative, verterNative, fervidNative, makeVerterHost },
  { vapor, isProd },
) {
  const gates = {};
  // `makeEmit` is a FACTORY, not an emit function, so anything a tool needs
  // constructing happens inside the try. `new VerterHost(...)` and
  // `new fervidNative.Compiler(...)` used to be built outside it: one throwing
  // constructor took down the whole surface for the corpus — every row of every
  // cell lost — where the intended failure mode is a single
  // "ⓘ GATE NOT RUN" annotation on that one tool's rows.
  const safe = (key, makeEmit) => {
    try {
      gates[key] = codegenValidity(sources, makeEmit());
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
    const { descriptor } = compiler.parse(f.source, { filename: srcId(f) });

    // A template-only SFC — no <script> and no <script setup> — is valid Vue,
    // and `compileScript` throws "SFC contains no <script> tags" on it. The
    // TIMED path (`vueCompileSfc`) has always guarded for that; this gate did
    // not, because every generated fixture carries a <script setup> so the case
    // never arose. On real projects it arises immediately: Hoppscotch's
    // `components/app/Logo.vue` is template-only, and it made the gate report
    // @vue/compiler-sfc 3.5 AND 3.6 as emitting invalid codegen — bracketing
    // the reference implementation for a file it compiles perfectly well.
    //
    // Gate what the tool actually emits for the file, EXACTLY as the timed path
    // emits it: script compiled non-inline with the fs bridge, then the template
    // compiled separately with the script's binding metadata and the SAME
    // target/env flags. An earlier revision gated `inlineTemplate: true` output
    // — codegen the timed rows never produce — so its verdict was stamped onto
    // rows emitting different code: the exact "gate lying about what it
    // checked" failure the per-cell split was written to kill.
    let scriptCode = "";
    let bindings;
    if (descriptor.scriptSetup || descriptor.script) {
      const opts = { id: srcId(f), inlineTemplate: false, isProd, fs: compilerFs };
      if (vapor) {
        opts.vapor = true;
        opts.templateOptions = { vapor: true, isProd };
      }
      const scriptResult = compiler.compileScript(descriptor, opts);
      scriptCode = scriptResult.content;
      bindings = scriptResult.bindings || {};
    }
    let templateCode = "";
    if (descriptor.template) {
      const opts = {
        source: descriptor.template.content,
        filename: srcId(f),
        id: srcId(f),
        isProd,
        compilerOptions: {
          bindingMetadata: bindings,
          mode: "module",
          hoistStatic: isProd,
          cacheHandlers: isProd,
          prefixIdentifiers: true,
        },
      };
      if (vapor) opts.vapor = true;
      templateCode = compiler.compileTemplate(opts).code ?? "";
    }
    // Returned as SEPARATE modules: each half is its own module in every real
    // pipeline, and parseEmitted parses them separately — a concatenation
    // invented duplicate-binding collisions (script-level `render` vs the
    // template's `render` export) that would bracket the baseline for code no
    // pipeline ever assembles.
    return [scriptCode, templateCode].filter(Boolean);
  };

  // Vue 3.5 has no Vapor codegen path, so it gets no Vapor gate — matching the
  // skipped 3.5 row in those cells. Registering one would fail 3.5 for a backend
  // it does not claim to have.
  if (!vapor) safe("@vue/compiler-sfc", () => vueEmit(compiler35));
  if (compiler36) safe("@vue/compiler-sfc-36", () => vueEmit(compiler36));

  if (!vizeNative.error && typeof vizeNative.compileSfc === "function") {
    // Vize exposes no isProduction on compileSfc — the same limitation its rows
    // disclose — so the gate can only vary vapor here.
    safe("@vizejs/native", () => (f) =>
      vizeNative.compileSfc(f.source, {
        filename: srcId(f),
        vapor,
        sourceMap: false,
        isTs: true,
      })?.code);
  }

  if (!verterNative.error && typeof verterNative.VerterHost === "function") {
    safe("@verter/native", () => {
      // Same workspace-backed construction as the rows — the gate must judge the
      // codegen the rows actually emit.
      const host = makeVerterHost({
        devMode: !isProd,
        analysisLevel: VERTER_ANALYSIS_LEVEL,
      });
      return (f) =>
        host.compileMany([{ canonicalId: f.path.replace(/\\/g, "/"), source: f.source, requestedMode: "stateless" }], {
          target: "runtime-render",
          defaultMode: "stateless",
          priority: "interactive",
          compileProfile: {
            isProduction: isProd,
            customElement: false,
            ssr: false,
            // Same passthrough standard as the rows — see renderProfile.
            forceJs: false,
            forceVapor: vapor,
            sourceMap: false,
            hmrStrategy: isProd ? "none" : "vite",
            runtimeModuleName: "vue",
          },
        })[0]?.code;
    });
  }

  // fervid is VDOM-only, exactly like Vue 3.5.
  //
  // The survival probe gates this too, and that is not belt-and-braces: THIS is
  // where the nine-project sweep actually died. The variant rows were already
  // guarded, but the codegen gate runs earlier and loaded fervid in-process
  // regardless, so Element Plus still panicked the host before a single row was
  // built. `safe()` cannot help — a Rust `panic!` on a NAPI thread aborts the
  // process rather than throwing, so there is nothing for a try/catch to catch.
  // Every in-process entry into fervid has to sit behind the child probe.
  const fervidProbe =
    !vapor && !fervidNative.error && typeof fervidNative.Compiler === "function"
      ? fervidSurvives(sources, { isProduction: isProd, sourceMap: false })
      : { ok: false, notInstalled: true };
  if (
    !vapor &&
    !fervidNative.error &&
    typeof fervidNative.Compiler === "function" &&
    fervidProbe.ok
  ) {
    safe("@fervid/napi", () => {
      const fc = new fervidNative.Compiler({ isProduction: isProd });
      return (f) => fc.compileSync(f.source, { id: srcId(f), filename: srcId(f) })?.code;
    });
  } else if (!vapor && !fervidProbe.ok && !fervidProbe.notInstalled) {
    // NOT `unmeasured: true` — that shape leaves a row ranked, and a compiler
    // that aborts the host process must never be ranked. This is a hard fail.
    gates["@fervid/napi"] = {
      ok: false,
      aborted: true,
      invalid: sources.length,
      total: sources.length,
      firstError: `aborted the process during the child survival probe — ${fervidProbe.reason}`,
    };
  }

  return gates;
}

/**
 * Mark rows whose tool failed the codegen gate as measured-but-unranked.
 *
 * A gate that could not run, or that was never registered for a package, is
 * ANNOTATED rather than passed over in silence. Previously those rows rendered
 * identically to rows that had actually been checked, which quietly favoured
 * whichever tool the harness failed to gate — the row kept its ranking and
 * nothing in the table said its output had never been parsed. Which tool that
 * happens to is incidental; that it is invisible is the problem.
 */
function applyCodegenGates(variants, gates) {
  for (const v of variants) {
    if (v.skip) continue;
    const gate = gates[v.package];

    if (!gate) {
      v.notes = `${v.notes} ⓘ CODEGEN VALIDITY GATE NOT RUN — no gate is registered for ${v.package}, so this row's output was never parsed. It is ranked, but it has not been checked to the standard the bracketed rows were held to.`;
      continue;
    }
    if (gate.unmeasured) {
      v.notes = `${v.notes} ⓘ CODEGEN VALIDITY GATE NOT RUN — ${gate.firstError}. This row is ranked without its output having been parsed; treat it as unverified rather than as having passed.`;
      continue;
    }
    if (gate.ok) continue;
    v.unranked = true;
    v.notes = `${v.notes} ⚠ FAILED CODEGEN VALIDITY GATE — ${gate.invalid}/${gate.total} files compiled to output that is not parseable JavaScript/TypeScript (first: ${gate.firstError}). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.`;
  }
  return variants;
}

/**
 * Top-level keys of the first `props:` object in emitted component code.
 *
 * Tolerates a call wrapper (`props: /*#__PURE__*\/_mergeDefaults({...}, ...)`)
 * and returns null when no props object can be located — a null is "cannot
 * measure", never "zero props", because an emission shape this parser does not
 * recognise must annotate rather than unrank. Exported for tests.
 */
export function topLevelPropsKeys(code) {
  const text = String(code);
  const at = text.search(/props:/);
  if (at < 0) return null;

  // What sits between `props:` and its value decides the shape. Three are
  // read; anything else is "cannot measure". The head window is small so a
  // `props:` deep inside unrelated code cannot adopt a distant brace — the
  // adoption bug is not hypothetical: `props: ["msg"], emits: { click }` used
  // to return ["click"], the NEXT object's keys, which as a census ground
  // truth is a false unrank waiting for an array-emitting compiler.
  const head = text.slice(at + 6, at + 126);
  const bracket = head.search(/[[{]/);
  if (bracket < 0) return null;
  const open = at + 6 + bracket;

  // Array form: the props ARE the string elements.
  if (text[open] === "[") {
    const keys = [];
    for (let i = open + 1; i < text.length; i++) {
      const c = text[i];
      if (c === "]") return keys.length ? keys : null;
      if (c === '"' || c === "'" || c === "`") {
        let key = "";
        const q = c;
        for (i++; i < text.length && text[i] !== q; i++) {
          if (text[i] === "\\") i++;
          key += text[i];
        }
        keys.push(key);
      }
    }
    return null;
  }

  const readObjectKeys = (start) => {
    const keys = [];
    let depth = 0;
    let token = "";
    let i = start;
    for (; i < text.length; i++) {
      const c = text[i];
      if (c === '"' || c === "'" || c === "`") {
        // Skip string contents; a brace inside a default-value string must not
        // move the depth counter.
        const quote = c;
        if (depth === 1) token += c;
        for (i++; i < text.length && text[i] !== quote; i++) {
          if (text[i] === "\\") i++;
          if (depth === 1) token += text[i];
        }
        if (depth === 1) token += quote;
        continue;
      }
      if (c === "{" || c === "[" || c === "(") {
        depth++;
        if (depth === 1) token = "";
        continue;
      }
      if (c === "}" || c === "]" || c === ")") {
        depth--;
        if (depth === 0) break;
        continue;
      }
      if (depth === 1) {
        if (c === ":") {
          // Quoted keys keep their inner colons — Vize really emits
          // `"onUpdate:visible":` on element-plus, and the baseline really
          // resolves that prop; rejecting the key was a guaranteed miscount.
          const key = token.trim().replace(/^["']|["']$/g, "");
          if (/^[\w$:.-]+$/.test(key)) keys.push(key);
          token = "";
          // Skip the VALUE up to the next depth-1 comma so value text
          // (ternaries, arrow bodies) cannot be mistaken for the next key.
          let vd = 0;
          for (i++; i < text.length; i++) {
            const v = text[i];
            if (v === '"' || v === "'" || v === "`") {
              const q = v;
              for (i++; i < text.length && text[i] !== q; i++) if (text[i] === "\\") i++;
              continue;
            }
            if (v === "{" || v === "[" || v === "(") vd++;
            else if (v === "}" || v === "]" || v === ")") {
              if (vd === 0) {
                i--;
                break;
              }
              vd--;
            } else if (v === "," && vd === 0) break;
          }
          continue;
        }
        if (c === ",") {
          token = "";
          continue;
        }
        token += c;
      }
    }
    return { keys, end: i };
  };

  // Object form, possibly inside a merge wrapper. EVERY top-level object
  // argument of the wrapper contributes keys: `_mergeModels({props}, {models})`
  // declares runtime props in BOTH arguments (defineModel props live in the
  // second), and `_mergeDefaults({props}, {defaults})`'s second object is a
  // subset of the first, so the union is exact for both wrappers.
  const keys = [];
  let cursor = open;
  for (;;) {
    const { keys: got, end } = readObjectKeys(cursor);
    keys.push(...got);
    // Another top-level object argument? Skip separators; stop at anything else.
    let j = end + 1;
    while (j < text.length && /[\s,]/.test(text[j])) j++;
    if (text[j] !== "{") break;
    cursor = j;
  }
  return keys.length ? [...new Set(keys)] : null;
}

/**
 * Prop-resolution census: does Vize emit the SAME prop set the baseline
 * resolves, on files whose props come from imported types?
 *
 * Why this exists: with the fs bridge, TS registration and Verter's workspace
 * in place, @vue/compiler-sfc THROWS on an unresolvable prop type and Verter
 * reports an error — but Vize resolves what it can and silently emits a
 * SMALLER runtime props object for declarations it cannot reach (observed on
 * element-plus: props reached only through the @element-plus/hooks barrel were
 * dropped with zero errors). A smaller emitted prop set is less work and
 * different runtime behaviour, and by this repository's first rule it must not
 * rank. Every comparable defect (codegen validity, empty programs, sub-request
 * containment) gets a bracket; prose was the only thing this one had.
 *
 * Anchored on the baseline exactly like the LSP hover gate: sampled files are
 * those using type-only `defineProps<...>`, the baseline's resolved prop names
 * come from compileScript's binding metadata, and a file the baseline cannot
 * compile anchors nothing. An emission shape the props parser cannot read
 * yields "not measured" and annotates rather than unranks.
 */
function computePropResolutionCensus(sources, compiler, tools, { sample = 8 } = {}) {
  const typed = sources.filter((f) => /defineProps<\s*[A-Za-z]/.test(f.source));
  // Silent drops happen where a declaration is REACHED through module
  // resolution — a bare or aliased type import — not in self-contained files.
  // An alphabetical prefix of all defineProps<> files sampled element-plus's
  // affix..autocomplete and missed tooltip.vue's barrel drop entirely, so the
  // sample leads with cross-module-typed files and fills with the rest.
  const crossModule = typed.filter((f) => /import\s+type\s[^'"]*?from\s*['"][^.'"]/.test(f.source));
  const rest = typed.filter((f) => !crossModule.includes(f));
  const candidates = [...crossModule, ...rest].slice(0, sample);
  if (candidates.length === 0) return { applicable: false };

  // One emitter per package that has one. The census applies to EVERY compiler
  // whose emitted props the parser can read — the first version censused Vize
  // alone, which held one challenger to a standard fervid demonstrably violated
  // on the same corpora (it emits NO props object for imported types, with a
  // diagnostic the harness tolerates for unrelated HTML-strictness reasons)
  // while fervid stayed ranked. One tool bracketed for a defect class another
  // ranks with is the exact asymmetry this repository exists to prevent.
  const { vizeNative, fervidNative, verterNative, makeVerterHost } = tools;
  const emitters = new Map();
  if (!vizeNative?.error && typeof vizeNative?.compileSfc === "function") {
    emitters.set("@vizejs/native", (f) => {
      const r = vizeNative.compileSfc(f.source, { filename: srcId(f), isTs: true });
      if (r?.errors?.length) return { skip: true };
      return { code: r?.code ?? "" };
    });
  }
  if (
    !fervidNative?.error &&
    typeof fervidNative?.Compiler === "function" &&
    fervidSurvives(sources, { isProduction: true, sourceMap: false }).ok
  ) {
    const fc = new fervidNative.Compiler({ isProduction: true });
    emitters.set("@fervid/napi", (f) => {
      const r = fc.compileSync(f.source, { id: srcId(f), filename: srcId(f) });
      return {
        code: r?.code ?? "",
        // fervid signals an unresolvable imported type with a diagnostic and
        // still emits (props-less) code. The diagnostic makes the missing props
        // ATTRIBUTABLE: with it, a null parse is "dropped everything", not
        // "cannot measure".
        resolveFailed: (r?.errors ?? []).some((e) => /resolve/i.test(String(e?.message ?? e))),
      };
    });
  }
  if (!verterNative?.error && typeof verterNative?.VerterHost === "function" && makeVerterHost) {
    let host = null;
    emitters.set("@verter/native", (f) => {
      host ??= makeVerterHost({ devMode: false, analysisLevel: VERTER_ANALYSIS_LEVEL });
      const [entry] = host.compileMany(
        [{ canonicalId: f.path.replace(/\\/g, "/"), source: f.source, requestedMode: "stateless" }],
        {
          target: "runtime-render",
          defaultMode: "stateless",
          priority: "interactive",
          compileProfile: {
            isProduction: true,
            customElement: false,
            ssr: false,
            // Same passthrough standard as the rows — see renderProfile.
            forceJs: false,
            forceVapor: false,
            sourceMap: false,
            hmrStrategy: "none",
            runtimeModuleName: "vue",
          },
        },
      );
      if (entry?.errors?.length) return { skip: true };
      return { code: entry?.code ?? "" };
    });
  }
  if (emitters.size === 0) return { applicable: false };

  const byPackage = new Map(
    [...emitters.keys()].map((pkg) => [
      pkg,
      { anchored: 0, unreadable: 0, missingTotal: 0, examples: [] },
    ]),
  );
  let anchoredFiles = 0;
  for (const f of candidates) {
    let baselineProps;
    try {
      const { descriptor, errors } = compiler.parse(f.source, { filename: srcId(f) });
      if (errors?.length || !(descriptor.scriptSetup || descriptor.script)) continue;
      const r = compiler.compileScript(descriptor, {
        id: srcId(f),
        inlineTemplate: false,
        isProd: true,
        fs: compilerFs,
      });
      // EXACTLY "props": a destructure-with-rename adds a "props-aliased"
      // binding under the LOCAL name, which no compiler's emitted props object
      // ever contains — keeping it made a false unrank out of a legal rename.
      baselineProps = Object.entries(r.bindings ?? {})
        .filter(([, kind]) => String(kind) === "props")
        .map(([name]) => name);
    } catch {
      // The baseline could not compile this file — it anchors nothing.
      continue;
    }
    if (baselineProps.length === 0) continue;
    anchoredFiles++;

    for (const [pkg, emitOne] of emitters) {
      const state = byPackage.get(pkg);
      let emission;
      try {
        emission = emitOne(f);
      } catch {
        continue;
      }
      if (emission.skip) continue; // its own error is its own row's business
      let keys = topLevelPropsKeys(emission.code);
      if (keys === null) {
        if (emission.resolveFailed) {
          // No props object AND a resolve-class diagnostic: the absence is the
          // finding, not a parser gap.
          keys = [];
        } else {
          state.unreadable++;
          continue;
        }
      }
      state.anchored++;
      const keySet = new Set(keys);
      const missing = baselineProps.filter((k) => !keySet.has(k));
      if (missing.length) {
        state.missingTotal += missing.length;
        if (state.examples.length < 2) {
          state.examples.push(`${f.filename}: ${missing.slice(0, 4).join(", ")}`);
        }
      }
    }
  }

  return { applicable: true, sampled: candidates.length, anchoredFiles, byPackage };
}

/**
 * Stamp the prop-resolution census onto every censused compiler's rows —
 * unranked on a drop, annotated when the census could not measure, silent
 * (a clean pass needs no banner) otherwise.
 */
function applyPropResolutionCensus(variants, census) {
  if (!census?.applicable) return variants;
  for (const v of variants) {
    if (v.skip) continue;
    const state = census.byPackage?.get(v.package);
    if (!state) continue;
    if (state.anchored === 0) {
      v.notes = `${v.notes} ⓘ PROP-RESOLUTION CENSUS NOT MEASURED — of ${census.sampled} sampled type-only defineProps files, none could be anchored for this compiler (baseline failures, its own compile errors, or an emission shape the props parser does not read). Ranked, but the imported-type prop set is unverified against the baseline's.`;
      continue;
    }
    if (state.missingTotal === 0) continue;
    v.unranked = true;
    v.notes = `${v.notes} ⚠ FAILED PROP-RESOLUTION CENSUS — across ${state.anchored} baseline-anchored sample file(s), ${state.missingTotal} prop(s) the baseline resolves are ABSENT from this compiler's emitted props (e.g. ${state.examples.join("; ")}). Emitting fewer resolved props is less work and different runtime behaviour. Measured but UNRANKED; re-run every benchmark, self-clearing on a fixed release.`;
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
 * Does fervid survive this corpus?
 *
 * Answered in a CHILD PROCESS, before fervid is ever loaded in the benchmark's
 * own process, because fervid answers "no" by aborting rather than by throwing —
 * see `../real-world/fervid-preflight.mjs`. A `not yet implemented` panic in its
 * Rust codegen killed a full nine-project sweep during the first project.
 *
 * Cached per corpus signature: the probe compiles the whole corpus, so running it
 * once per matrix cell would multiply a real cost by the number of cells for no
 * new information — the answer cannot differ between cells that feed it the same
 * sources.
 */
const fervidSurvivalCache = new Map();

function fervidSurvives(sources, { isProduction, sourceMap }) {
  const key = `${sources.length}:${isProduction}:${sourceMap}:${sources[0]?.filename ?? ""}:${sources[sources.length - 1]?.filename ?? ""}`;
  if (fervidSurvivalCache.has(key)) return fervidSurvivalCache.get(key);

  const dir = mkdtempSync(join(tmpdir(), "fervid-probe-"));
  const payloadPath = join(dir, "payload.json");
  const progressPath = join(dir, "progress.txt");
  let verdict;
  try {
    writeFileSync(
      payloadPath,
      JSON.stringify({
        options: { isProduction, sourceMap },
        files: sources.map((f) => ({
          filename: srcId(f),
          source: f.source,
          options: { id: srcId(f), filename: srcId(f) },
        })),
      }),
    );

    const probe = spawnSync(
      process.execPath,
      [join(rootDir, "scripts", "lib", "real-world", "fervid-preflight.mjs"), payloadPath, progressPath],
      { encoding: "utf8", timeout: 300_000, maxBuffer: 32 * 1024 * 1024 },
    );

    if (probe.status === 0) {
      verdict = { ok: true };
    } else {
      let lastFile = "";
      try {
        lastFile = readFileSync(progressPath, "utf8").trim();
      } catch {
        lastFile = "";
      }
      const output = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`;
      const panic =
        output
          .split("\n")
          .map((l) => l.trim())
          .find((l) => /panicked at|not yet implemented|fatal|Assertion/i.test(l)) ?? "";
      const how =
        probe.signal
          ? `killed by signal ${probe.signal}`
          : probe.error?.code === "ETIMEDOUT"
            ? "did not finish within 300 s"
            : `exited ${probe.status}`;
      verdict = {
        ok: false,
        // `notInstalled` is exit 3 from the probe — a different fact from a crash,
        // and it must not be reported as one.
        notInstalled: probe.status === 3,
        reason: `${how}${lastFile ? ` while compiling ${lastFile}` : ""}${panic ? ` — ${panic}` : ""}`,
      };
    }
  } catch (error) {
    verdict = { ok: false, reason: `probe could not run: ${error?.message ?? error}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  fervidSurvivalCache.set(key, verdict);
  return verdict;
}

/**
 * SFC compile surface — matrix of target × environment.
 * Returns one parent surface with `groups` for reporting.
 */
export async function runCompileSurface(fixtureDir, options) {
  // `options.files` lets a caller supply the corpus itself. The real-world
  // orchestrator does: its corpora are nested inside a cloned repository, and
  // `collectVueFiles` is flat by design, so it would return zero files there —
  // and a surface handed zero files reports a very fast, entirely empty run.
  const files = options.files ?? collectVueFiles(fixtureDir, options.fileLimit);
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

  // Both compilers, before any gate or timed run — the gate must exercise the
  // same resolution the rows do.
  registerCompilerTS(compiler35);
  registerCompilerTS(compiler36);

  const vizeNative = loadOptional("@vizejs/native");
  const verterNative = loadOptional("@verter/native");
  const fervidNative = loadOptional("@fervid/napi");
  const hosts = {};

  // Verter's project context. A bare `new VerterHost()` has no filesystem, so
  // `defineProps<Imported>()` fails with "missing-declaration" on every real
  // project — the same class of harness gap as the fs bridge and registerTS
  // above, and by the upstream-CI rule it was ours, not Verter's. One Workspace
  // per surface run, shared by the rows AND the codegen gate: it is a file-access
  // layer (like Vue's module-level type caches), not a compile cache, so sharing
  // it does not leak work between the cache-free rows.
  const verterWorkspaceRoot = fixtureDir.replace(/\\/g, "/");
  let verterWorkspace = null;
  if (!verterNative.error && typeof verterNative.Workspace === "function") {
    verterWorkspace = new verterNative.Workspace([verterWorkspaceRoot]);
    verterWorkspace.configureProjects([
      { root: verterWorkspaceRoot, workspaceRoot: verterWorkspaceRoot },
    ]);
  }
  const makeVerterHost = (config) =>
    verterWorkspace && typeof verterNative.VerterHost?.withWorkspace === "function"
      ? verterNative.VerterHost.withWorkspace(config, verterWorkspace)
      : new verterNative.VerterHost(config);

  // Before any timing: does each compiler emit parseable code for this corpus, in
  // THIS cell's configuration? Rows whose tool fails are measured but unranked.
  //
  // Computed per (target, env) pair and memoised, so a cell's verdict is always
  // about the codegen that cell measures — see computeCodegenGates. Only pairs
  // that survive the matrix filter are ever computed, so asking for one cell does
  // not pay for four gates.
  const tools = { compiler35, compiler36, vizeNative, verterNative, fervidNative, makeVerterHost };

  // Once per corpus: prop resolution is a property of each compiler on these
  // sources, not of a matrix cell (vapor changes codegen, not type
  // resolution — and the census could not even be computed ON vapor output,
  // whose first `props:` is runtime forwarding, not a declaration).
  const propCensus = computePropResolutionCensus(sources, compiler35, {
    vizeNative,
    fervidNative,
    verterNative,
    makeVerterHost,
  });

  const gateCache = new Map();
  const gatesFor = (target, env) => {
    const key = `${target}/${env}`;
    if (!gateCache.has(key)) {
      gateCache.set(
        key,
        computeCodegenGates(sources, tools, {
          vapor: target === "vapor",
          isProd: env === "production",
        }),
      );
    }
    return gateCache.get(key);
  };

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
  // Tools that produced no measurement at all (a process abort, not a slow or
  // wrong answer). Collected across cells and reported above the tables.
  const excluded = [];

  for (const { target, env, sourceMap } of matrix) {
    if (!wantTargets.has(target) || !wantEnvs.has(env)) continue;

    const cellVariants = buildCellVariants({
      excluded,
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
      makeVerterHost,
    });
    applyCodegenGates(cellVariants, gatesFor(target, env));
    applyPropResolutionCensus(cellVariants, propCensus);
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

  // One entry per (tool, reason): the same abort is hit once per matrix cell, and
  // four identical notices would read as four separate failures.
  const excludedUnique = [];
  for (const e of excluded) {
    if (!excludedUnique.some((x) => x.tool === e.tool && x.reason === e.reason)) {
      excludedUnique.push(e);
    }
  }

  return {
    id: "compile",
    excluded: excludedUnique,
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
      "Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.",
      "The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.",
      "⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.",
      "VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).",
      "Source map is an INDEPENDENT dimension, requested identically from every compiler in a cell (Vue: parse+compileScript+codegen sourceMap; Vize: compileSfc sourceMap; Verter: compileProfile sourceMap; fervid: FervidJsCompilerOptions sourceMap). It is not folded into the prod/dev flag for some tools and not others.",
      "TypeScript handling is ONE standard for the whole cell: PASSTHROUGH, requested identically from every compiler (Vue and fervid pass annotations through by design; Vize via isTs:true; Verter via forceJs:false, which is also its own Vite path). Two official-integration deviations are disclosed rather than silently mirrored: Vize's own Vite plugin omits isTs and therefore STRIPS types for drop-in users (more work than benchmarked here), and an earlier harness revision set Verter's forceJs:true, charging one challenger transpile work no peer row paid — the flag also selects which Verter codegen path the validity gate judges.",
      "Verter's analysisLevel is the DROP-IN DEFAULT (full — its official plugin sets none, which means full). 'essential' emits byte-identical output ~6% faster and is available via VERTER_ANALYSIS_LEVEL for study, but a tuned default would be a gift no other tool gets a tuning pass for. Whatever level runs is printed on every Verter row. Verter's devMode follows isProduction here; its official plugin hardcodes devMode:true — a minor deviation, stated.",
      "Production vs development uses each tool's real semantic knobs only: Vue isProd (hoistStatic + cacheHandlers); Verter isProduction + hmrStrategy; fervid isProduction.",
      "⚠ Vize exposes no isProduction on compileSfc, so its production and development rows perform identical work. Stated rather than substituted with a different knob.",
      "⚠ fervid compiles <style> blocks inside compileSync — every other row measures parse + script + template only. fervid's rows do strictly more work per file than the rows they are ranked against; there is no option to disable it.",
      "⚠ fervid emits non-fatal HTML-strictness diagnostics (NonVoidHtmlElementStartTagWithTrailingSolidus) on self-closing non-void tags such as <div /> and <MyComp />, which Vue's SFC parser accepts — 44 of them on the 200-file corpus. Verified on this corpus: codegen is still complete and correct for those files, so fervid is gated on codegen actually being produced for every file — the same gate every other compiler here gets — rather than on diagnostic silence. Per-run diagnostic totals are captured in the JSON report's meta samples.",
      "fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).",
      `fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=${UV_POOL}), which is a fixed default of 4 rather than core count. Where the Vize/Verter batch rows scale with cores, that row does not — it is reported, not tuned, because the pool width is fixed before the harness starts.`,
      "1T / batch / batch-cached rows share the table; the mode is in the row label. A batch pool amortises across a thread pool and a cached session reuses prior analysis, so read same-mode rows against each other.",
      "Verter session mode keeps a persistent host across warmups and runs, so it is ranked as `batch-cached`, apart from cache-free batch rows.",
      "Codegen validity gate: every compiler's output is parsed (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.",
      "The gate runs ONCE PER (target × environment) cell, with that cell's flags. It previously ran once on vdom/production and stamped the verdict onto the Vapor and development cells it had never exercised — Vapor is a different codegen backend and development mode emits different code, so a pass on one is not evidence about the other. Source maps are not a gate dimension: a map is emitted beside the code and cannot change whether the code parses.",
      "The gate builds each tool's compiler handle inside its own try, so a constructor that throws costs that one tool a `GATE NOT RUN` annotation instead of destroying every row for the corpus.",
      "@vue/compiler-sfc, Vize and Verter are held to ONE error policy in the timed path: a non-empty `errors` array fails the measure. Vue returns parse and template errors in an array instead of throwing, and discarding them — as an earlier revision did — billed a file Vue could not parse as cheap successful work while the same failure in a challenger produced ❌. fervid is the documented exception and is gated on codegen produced for every file, because its diagnostics include non-fatal HTML strictness warnings Vue's parser does not raise.",
      "Tool order is rotated on every warmup and measured run; no tool is pinned to first position.",
      "Ranking metric is the median of measured runs, all taken after >= 1 discarded warmup. No cold column.",
    ],
    groups,
    variants: allVariants,
  };
}
