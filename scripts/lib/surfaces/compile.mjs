import { parseSync } from "@babel/core";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  readFileSync,
  existsSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { collectVueFiles, readSources, totalBytes } from "../fixtures.mjs";
import { measureVariants, timedSync, timedAsync } from "../timing.mjs";
import { assertOnlyAllowedFervidDiagnostics } from "../fervid-diagnostics.mjs";
import {
  STYLE_FEATURE_CASES,
  STYLE_FEATURE_SUITE_HASH,
  STYLE_FEATURE_SUITE_VERSION,
  assertStyleFeature,
  cssModuleMapping,
} from "../style-feature-gates.mjs";
import {
  STYLE_PREPROCESSOR_CASES,
  STYLE_PREPROCESSOR_SUITE_HASH,
  STYLE_PREPROCESSOR_SUITE_VERSION,
  computeStylePreprocessorGates,
} from "../style-preprocessor-gates.mjs";
import {
  compileValidityConfigKey,
  runCompileValidityMatrix,
} from "../compile-validity-gates.mjs";
import { measureCompileFreshChildVariants } from "../compile-cold-runs.mjs";

export { STYLE_FEATURE_CASES } from "../style-feature-gates.mjs";
export { STYLE_PREPROCESSOR_CASES } from "../style-preprocessor-gates.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * Verter host static-analysis level for the compile rows.
 *
 * The benchmark requests `full` explicitly instead of inheriting a package
 * default that can move between releases. Imported-type and prop-resolution
 * gates verify the consequences on the actual corpus. An environment override
 * exists for diagnostics; every row prints the effective value so a tuned run
 * cannot be mistaken for the default comparison.
 */
const VERTER_ANALYSIS_LEVEL = process.env.VERTER_ANALYSIS_LEVEL || "full";

const COMPARISON = Object.freeze({
  officialRender: Object.freeze({
    comparisonClass: "official-render-pipeline",
    comparisonClassLabel:
      "Official render pipeline — parse + script + template",
  }),
  sfcWithStyle: Object.freeze({
    comparisonClass: "sfc-with-style",
    comparisonClassLabel:
      "SFC compilation with CSS — script, template and style changed",
  }),
  rawRenderBatch: Object.freeze({
    comparisonClass: "raw-render-batch",
    comparisonClassLabel:
      "Raw SFC compilation — identical changed inputs; no output-cache reuse",
  }),
});

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
 * Vize does not expose one `isProduction` switch on these APIs, but it does
 * expose the two template behaviours this matrix varies: `templateHoistStatic`
 * and `templateCacheHandlers`. They are set explicitly for both single and
 * batch calls. An untimed capability probe verifies their VDOM effect before a
 * VDOM row may rank and records their Vapor response separately without
 * treating a VDOM-only transform as a required Vapor distinction.
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
  compiler.registerTS(() =>
    require(require.resolve("typescript", { paths: [rootDir] })),
  );
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
  return String(e.message ?? e)
    .split("\n")[0]
    .slice(0, 300);
}

function serializedMapBytes(map) {
  if (!map) return 0;
  if (typeof map === "string") return map.length;
  try {
    return JSON.stringify(map).length;
  } catch {
    return 0;
  }
}

function cssSourceMapBytes(result) {
  const direct =
    serializedMapBytes(result?.cssMap) +
    serializedMapBytes(result?.styleMap) +
    serializedMapBytes(result?.cssSourceMap);
  const styles = Array.isArray(result?.styles)
    ? result.styles.reduce(
        (total, style) =>
          total +
          serializedMapBytes(style?.map) +
          serializedMapBytes(style?.sourceMap),
        0,
      )
    : 0;
  return direct + styles;
}

function vizeBatchRows(result, expected, context) {
  if (result?.failedCount) {
    throw new Error(
      `${context} failed ${result.failedCount}/${expected} inputs`,
    );
  }
  if (result?.errors?.length) {
    throw new Error(
      `${context} returned top-level errors: ${firstCompileError(result.errors)}`,
    );
  }
  const rows = result?.results ?? result?.items ?? [];
  if (rows.length !== expected) {
    throw new Error(`${context} returned ${rows.length}/${expected} results`);
  }
  const failed = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row?.errors?.length);
  if (failed.length) {
    const { row, index } = failed[0];
    throw new Error(
      `${context} returned per-file errors for ${failed.length}/${expected} inputs; result ${index}: ${firstCompileError(row.errors)}`,
    );
  }
  return rows;
}

function timedVerterHost(host, compile) {
  try {
    return timedSync(compile);
  } finally {
    host?.close?.();
  }
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
function vueCompileSfc(
  compiler,
  source,
  filename,
  { vapor, isProd, sourceMap, styles = false, componentId = null },
) {
  const { descriptor, errors: parseErrors } = compiler.parse(source, {
    filename,
    sourceMap,
  });
  if (parseErrors?.length) {
    throw new Error(
      `vue parse error in ${filename} (${parseErrors.length}): ${firstCompileError(parseErrors)}`,
    );
  }
  let bindings = {};
  let work = 1; // parse
  let jsBytes = 0;
  let jsMapBytes = 0;
  let cssMapBytes = 0;
  const scriptOpts = {
    id: styles ? componentId : filename,
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
    scriptOpts.templateOptions = {
      vapor: true,
      isProd,
      compilerOptions: { sourceMap },
    };
  }
  if (descriptor.scriptSetup || descriptor.script) {
    const scriptResult = compiler.compileScript(descriptor, scriptOpts);
    bindings = scriptResult.bindings || {};
    const scriptBytes = scriptResult.content?.length ?? 0;
    work += scriptBytes || 1;
    jsBytes += scriptBytes;
    jsMapBytes += serializedMapBytes(scriptResult.map);
  }
  if (descriptor.template) {
    const templateOpts = {
      source: descriptor.template.content,
      filename,
      id: styles ? componentId : filename,
      isProd,
      compilerOptions: {
        bindingMetadata: bindings,
        mode: "module",
        hoistStatic: isProd,
        cacheHandlers: isProd,
        prefixIdentifiers: true,
        // compileTemplate has no top-level sourceMap; it lives in codegen opts.
        sourceMap,
        // The style-inclusive reference path uses the same id for render
        // scope markers and compileStyle(). Render-only rows omit it because
        // their shared corpus has no style blocks.
        scopeId:
          styles && descriptor.styles.some((block) => block.scoped)
            ? `data-v-${componentId}`
            : undefined,
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
    const templateBytes = tpl?.code?.length ?? 0;
    work += templateBytes || descriptor.template.content.length;
    jsBytes += templateBytes;
    jsMapBytes += serializedMapBytes(tpl?.map);
  }
  let cssBytes = 0;
  let styleBlocks = 0;
  if (styles) {
    for (const [index, style] of descriptor.styles.entries()) {
      // This direct, synchronous reference path intentionally supports the
      // plain-CSS fixture class only. Preprocessors and CSS Modules are Vite
      // integration work (compileStyleAsync + preprocessor/modules options),
      // not silently approximated here.
      if (style.src || style.module || (style.lang && style.lang !== "css")) {
        throw new Error(
          `Vue style reference only accepts inline plain CSS (${filename} style ${index})`,
        );
      }
      const result = compiler.compileStyle({
        source: style.content,
        filename,
        id: `data-v-${componentId}`,
        scoped: style.scoped,
        isProd,
        inMap: sourceMap ? style.map : undefined,
      });
      if (result.errors?.length) {
        throw new Error(
          `vue style error in ${filename} (${result.errors.length}): ${firstCompileError(result.errors)}`,
        );
      }
      cssBytes += result.code?.length ?? 0;
      cssMapBytes += serializedMapBytes(result.map);
      styleBlocks++;
    }
    work += cssBytes;
  }
  return {
    work,
    jsBytes,
    cssBytes,
    styleBlocks,
    jsMapBytes,
    cssMapBytes,
    mapBytes: jsMapBytes + cssMapBytes,
  };
}

function loadOptional(name) {
  try {
    return require(require.resolve(name, { paths: [rootDir] }));
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

const COMPILE_CAPABILITY_SOURCE = `<template>
  <button @click="count++"><span>static</span>{{ count }}</button>
</template>
<script setup lang="ts">
let count: number = 0
</script>
<style scoped>
.probe { color: red }
</style>`;

function capabilityResult(ok, detail) {
  return { ok: Boolean(ok), detail };
}

function productionResponseResult(ok, changesOutput, detail) {
  return {
    ok: Boolean(ok),
    changesOutput: ok ? Boolean(changesOutput) : null,
    detail,
  };
}

/**
 * Version-sensitive compiler facts used by the benchmark itself.
 *
 * These are deliberately executable probes rather than package-version
 * allowlists. A package upgrade that adds Verter maps or drops Vize's template
 * knobs changes the row automatically instead of leaving a stale beta/version
 * note in control of ranking.
 */
export function computeCompileCapabilities({
  vizeNative,
  verterNative,
  fervidNative,
  makeVerterHost,
}) {
  const capabilities = {
    vize: {
      singleProductionOptions: capabilityResult(false, "API unavailable"),
      batchProductionOptions: capabilityResult(false, "API unavailable"),
      singleVaporProductionResponse: productionResponseResult(
        false,
        null,
        "API unavailable",
      ),
      batchVaporProductionResponse: productionResponseResult(
        false,
        null,
        "API unavailable",
      ),
      singleSourceMap: capabilityResult(false, "API unavailable"),
      batchSourceMap: capabilityResult(false, "API unavailable"),
      singleStyleSourceMap: capabilityResult(false, "API unavailable"),
      batchStyleSourceMap: capabilityResult(false, "API unavailable"),
    },
    verter: {
      runtimeSourceMap: capabilityResult(false, "API unavailable"),
      styleSourceMap: capabilityResult(false, "API unavailable"),
      runtimeEmitsCss: capabilityResult(false, "API unavailable"),
    },
    fervid: {
      sourceMap: capabilityResult(false, "API unavailable"),
      styleSourceMap: capabilityResult(false, "API unavailable"),
    },
  };

  if (!vizeNative?.error && typeof vizeNative.compileSfc === "function") {
    try {
      const common = {
        filename: "/capability-audit/Probe.vue",
        isTs: true,
        sourceMap: false,
      };
      const production = vizeNative.compileSfc(COMPILE_CAPABILITY_SOURCE, {
        ...common,
        templateHoistStatic: true,
        templateCacheHandlers: true,
      });
      const development = vizeNative.compileSfc(COMPILE_CAPABILITY_SOURCE, {
        ...common,
        templateHoistStatic: false,
        templateCacheHandlers: false,
      });
      const ok =
        !production.errors?.length &&
        !development.errors?.length &&
        production.code !== development.code;
      capabilities.vize.singleProductionOptions = capabilityResult(
        ok,
        ok
          ? "templateHoistStatic/templateCacheHandlers change compileSfc output"
          : "production/development template options did not change compileSfc output",
      );

      const vaporProduction = vizeNative.compileSfc(COMPILE_CAPABILITY_SOURCE, {
        ...common,
        vapor: true,
        templateHoistStatic: true,
        templateCacheHandlers: true,
      });
      const vaporDevelopment = vizeNative.compileSfc(
        COMPILE_CAPABILITY_SOURCE,
        {
          ...common,
          vapor: true,
          templateHoistStatic: false,
          templateCacheHandlers: false,
        },
      );
      const vaporChanges =
        !vaporProduction.errors?.length &&
        !vaporDevelopment.errors?.length &&
        vaporProduction.code !== vaporDevelopment.code;
      const vaporOk =
        !vaporProduction.errors?.length &&
        !vaporDevelopment.errors?.length &&
        typeof vaporProduction.code === "string" &&
        typeof vaporDevelopment.code === "string";
      capabilities.vize.singleVaporProductionResponse =
        productionResponseResult(
          vaporOk,
          vaporChanges,
          !vaporOk
            ? "Vapor compileSfc production/development probe failed"
            : vaporChanges
              ? "production template options change Vapor compileSfc output"
              : "production template options are accepted but do not change Vapor compileSfc output",
        );

      const mapped = vizeNative.compileSfc(COMPILE_CAPABILITY_SOURCE, {
        ...common,
        sourceMap: true,
      });
      const mappedBytes = serializedMapBytes(mapped.map);
      capabilities.vize.singleSourceMap = capabilityResult(
        mappedBytes > 0,
        mappedBytes
          ? `${mappedBytes} source-map bytes`
          : "compileSfc returned no map",
      );
      const cssMapBytes = cssSourceMapBytes(mapped);
      capabilities.vize.singleStyleSourceMap = capabilityResult(
        cssMapBytes > 0,
        cssMapBytes
          ? `${cssMapBytes} CSS source-map bytes`
          : "compileSfc returned compiled CSS but no CSS source map",
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      capabilities.vize.singleProductionOptions = capabilityResult(
        false,
        detail,
      );
      capabilities.vize.singleVaporProductionResponse =
        productionResponseResult(false, null, detail);
      capabilities.vize.singleSourceMap = capabilityResult(false, detail);
      capabilities.vize.singleStyleSourceMap = capabilityResult(false, detail);
    }
  }

  if (
    !vizeNative?.error &&
    typeof vizeNative.compileSfcBatchWithResults === "function"
  ) {
    try {
      const files = [
        {
          path: "/capability-audit/Probe.vue",
          source: COMPILE_CAPABILITY_SOURCE,
        },
      ];
      const production = vizeNative.compileSfcBatchWithResults(files, {
        isTs: true,
        threads: 1,
        templateHoistStatic: true,
        templateCacheHandlers: true,
      });
      const development = vizeNative.compileSfcBatchWithResults(files, {
        isTs: true,
        threads: 1,
        templateHoistStatic: false,
        templateCacheHandlers: false,
      });
      const [prodRow] = vizeBatchRows(
        production,
        files.length,
        "Vize batch production probe",
      );
      const [devRow] = vizeBatchRows(
        development,
        files.length,
        "Vize batch development probe",
      );
      const ok = prodRow?.code && devRow?.code && prodRow.code !== devRow.code;
      capabilities.vize.batchProductionOptions = capabilityResult(
        ok,
        ok
          ? "templateHoistStatic/templateCacheHandlers change batch output"
          : "production/development template options did not change batch output",
      );

      const vaporProduction = vizeNative.compileSfcBatchWithResults(files, {
        isTs: true,
        vapor: true,
        threads: 1,
        templateHoistStatic: true,
        templateCacheHandlers: true,
      });
      const vaporDevelopment = vizeNative.compileSfcBatchWithResults(files, {
        isTs: true,
        vapor: true,
        threads: 1,
        templateHoistStatic: false,
        templateCacheHandlers: false,
      });
      const [vaporProdRow] = vizeBatchRows(
        vaporProduction,
        files.length,
        "Vize Vapor batch production probe",
      );
      const [vaporDevRow] = vizeBatchRows(
        vaporDevelopment,
        files.length,
        "Vize Vapor batch development probe",
      );
      const vaporChanges = vaporProdRow.code !== vaporDevRow.code;
      const vaporOk =
        typeof vaporProdRow.code === "string" &&
        typeof vaporDevRow.code === "string";
      capabilities.vize.batchVaporProductionResponse = productionResponseResult(
        vaporOk,
        vaporChanges,
        !vaporOk
          ? "Vapor batch production/development probe failed"
          : vaporChanges
            ? "production template options change Vapor batch output"
            : "production template options are accepted but do not change Vapor batch output",
      );

      const mapped = vizeNative.compileSfcBatchWithResults(files, {
        isTs: true,
        threads: 1,
        includeSourceMap: true,
      });
      const [mappedRow] = vizeBatchRows(
        mapped,
        files.length,
        "Vize batch source-map probe",
      );
      const map = mappedRow.map;
      const mapBytes = serializedMapBytes(map);
      capabilities.vize.batchSourceMap = capabilityResult(
        mapBytes > 0,
        mapBytes
          ? `${mapBytes} source-map bytes`
          : "compileSfcBatchWithResults returned no map",
      );
      const cssMapBytes = cssSourceMapBytes(mappedRow);
      capabilities.vize.batchStyleSourceMap = capabilityResult(
        cssMapBytes > 0,
        cssMapBytes
          ? `${cssMapBytes} CSS source-map bytes`
          : "compileSfcBatchWithResults returned compiled CSS but no CSS source map",
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      capabilities.vize.batchProductionOptions = capabilityResult(
        false,
        detail,
      );
      capabilities.vize.batchVaporProductionResponse = productionResponseResult(
        false,
        null,
        detail,
      );
      capabilities.vize.batchSourceMap = capabilityResult(false, detail);
      capabilities.vize.batchStyleSourceMap = capabilityResult(false, detail);
    }
  }

  if (
    !verterNative?.error &&
    typeof verterNative.VerterHost === "function" &&
    typeof makeVerterHost === "function"
  ) {
    let host;
    try {
      host = makeVerterHost({
        devMode: false,
        analysisLevel: VERTER_ANALYSIS_LEVEL,
      });
      const [result] = host.compileMany(
        [
          {
            canonicalId: "/capability-audit/Probe.vue",
            source: COMPILE_CAPABILITY_SOURCE,
            requestedMode: "stateless",
            componentId: "abc12345",
          },
        ],
        {
          target: "runtime-render",
          defaultMode: "stateless",
          priority: "interactive",
          compileProfile: {
            isProduction: true,
            customElement: false,
            ssr: false,
            forceJs: false,
            forceVapor: false,
            sourceMap: true,
            hmrStrategy: "none",
            runtimeModuleName: "vue",
          },
        },
      );
      const mapBytes = serializedMapBytes(result?.sourceMap);
      capabilities.verter.runtimeSourceMap = capabilityResult(
        mapBytes > 0,
        mapBytes
          ? `${mapBytes} source-map bytes`
          : "runtime-render returned no map",
      );
      const cssBytes =
        (typeof result?.css === "string" ? result.css.length : 0) +
        (Array.isArray(result?.styles)
          ? result.styles.reduce(
              (n, style) => n + (style?.code?.length ?? 0),
              0,
            )
          : 0);
      capabilities.verter.runtimeEmitsCss = capabilityResult(
        cssBytes > 0,
        cssBytes
          ? `${cssBytes} CSS bytes`
          : "runtime-render returned no compiled CSS",
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      capabilities.verter.runtimeSourceMap = capabilityResult(false, detail);
      capabilities.verter.runtimeEmitsCss = capabilityResult(false, detail);
    } finally {
      try {
        host?.close?.();
      } catch {
        // best effort: capability hosts do not own benchmark state
      }
    }
  }

  if (!verterNative?.error && typeof verterNative.processStyle === "function") {
    try {
      const result = verterNative.processStyle(".probe {\n  color: red;\n}\n", {
        scopeId: "abc12345",
        scoped: true,
        isModule: false,
        filename: "/capability-audit/Probe.vue",
        sourcemap: true,
      });
      const mapBytes = serializedMapBytes(result?.sourceMap);
      capabilities.verter.styleSourceMap = capabilityResult(
        mapBytes > 0,
        mapBytes
          ? `${mapBytes} source-map bytes`
          : "processStyle returned no map",
      );
    } catch (error) {
      capabilities.verter.styleSourceMap = capabilityResult(
        false,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  if (!fervidNative?.error && typeof fervidNative.Compiler === "function") {
    try {
      const compiler = new fervidNative.Compiler({
        isProduction: true,
        sourceMap: true,
      });
      const result = compiler.compileSync(COMPILE_CAPABILITY_SOURCE, {
        id: "abc12345",
        filename: "/capability-audit/Probe.vue",
      });
      const jsMapBytes = serializedMapBytes(result?.sourceMap);
      const cssMapBytes = cssSourceMapBytes(result);
      capabilities.fervid.sourceMap = capabilityResult(
        jsMapBytes > 0,
        jsMapBytes
          ? `${jsMapBytes} JS source-map bytes`
          : "compileSync returned no JS map",
      );
      capabilities.fervid.styleSourceMap = capabilityResult(
        cssMapBytes > 0,
        cssMapBytes
          ? `${cssMapBytes} CSS source-map bytes`
          : "compileSync returned compiled CSS but no CSS source map",
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      capabilities.fervid.sourceMap = capabilityResult(false, detail);
      capabilities.fervid.styleSourceMap = capabilityResult(false, detail);
    }
  }

  return capabilities;
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
      firstError ??= `${f.filename}: ${String(error.message)
        .split("\n")[0]
        .replace(/^.*\.tsx: /, "")}`;
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
 * This is not a blanket "ignore fervid's errors": only the complete diagnostic
 * code above is tolerated. Every other diagnostic and every missing output is
 * fatal.
 */
function assertFervidOutput(results, expected) {
  let codeBytes = 0;
  let cssBytes = 0;
  let styleBlocks = 0;
  let jsMapBytes = 0;
  let cssMapBytes = 0;
  let diagnostics = 0;
  let empty = 0;
  if (results.length !== expected) {
    throw new Error(
      `fervid returned ${results.length} results for ${expected} inputs`,
    );
  }
  for (const r of results) {
    diagnostics += assertOnlyAllowedFervidDiagnostics(
      r,
      "fervid compile returned an unexpected diagnostic",
    );
    const len = r?.code?.length ?? 0;
    if (len === 0) empty++;
    codeBytes += len;
    for (const style of r?.styles ?? []) {
      cssBytes += style?.code?.length ?? 0;
      styleBlocks++;
    }
    jsMapBytes += serializedMapBytes(r?.sourceMap);
    cssMapBytes += cssSourceMapBytes(r);
  }
  if (empty) {
    throw new Error(`fervid emitted no code for ${empty}/${expected} files`);
  }
  if (codeBytes < expected) {
    throw new Error("fervid returned empty code for corpus");
  }
  return {
    artifact: codeBytes + cssBytes,
    jsBytes: codeBytes,
    cssBytes,
    styleBlocks,
    mapBytes: jsMapBytes + cssMapBytes,
    jsMapBytes,
    cssMapBytes,
    diagnostics,
  };
}

function cellId(target, env, sourceMap) {
  return `${target}-${env === "production" ? "prod" : "dev"}-sm${sourceMap ? "on" : "off"}`;
}

function cellLabel(target, env, sourceMap) {
  return `${target.toUpperCase()} · ${env} · sourcemap ${sourceMap ? "on" : "off"}`;
}

export function compileCellSourceSalts(cell) {
  const salt = (namespace) =>
    createHash("sha256")
      .update(`${cell}:${namespace}`)
      .digest("hex")
      .slice(0, 8);
  return Object.freeze({
    officialContext: salt("official-context"),
    candidateRaw: salt("candidate-raw"),
    candidateStyle: salt("candidate-style"),
  });
}

/**
 * Return the full source range occupied by one top-level SFC block.
 * Vue's descriptor offsets delimit block CONTENT, so expand them to include
 * the opening and closing tags before removing a style block.
 */
function sfcBlockRange(source, block, tag) {
  const lower = source.toLowerCase();
  const contentStart = block.loc.start.offset;
  const contentEnd = block.loc.end.offset;
  const start = lower.lastIndexOf(`<${tag}`, contentStart);
  const openEnd = source.indexOf(">", start);
  const closeStart = lower.indexOf(`</${tag}`, contentEnd);
  const end = source.indexOf(">", closeStart) + 1;
  if (
    start < 0 ||
    openEnd < start ||
    openEnd >= contentStart ||
    closeStart < contentEnd ||
    end <= 0
  ) {
    throw new Error(
      `could not locate <${tag}> block around descriptor offsets`,
    );
  }
  return { start, end };
}

/**
 * Build the shared render-only corpus used by the apples-to-apples native
 * class. Styles are removed from every compiler input outside the timer by the
 * raw-render class definition. Revision sites are then captured in every
 * script and template block.
 */
export function prepareRawRenderCorpus(sources, compiler) {
  return sources.map((file) => {
    const parsed = compiler.parse(file.source, { filename: srcId(file) });
    if (parsed.errors?.length) {
      throw new Error(
        `raw render corpus parse failed for ${srcId(file)}: ${firstCompileError(parsed.errors)}`,
      );
    }

    let source = file.source;
    const styleRanges = parsed.descriptor.styles
      .map((block) => sfcBlockRange(source, block, "style"))
      .sort((a, b) => b.start - a.start);
    for (const range of styleRanges) {
      source = source.slice(0, range.start) + source.slice(range.end);
    }

    // Parse the style-free source because removing earlier blocks changes all
    // later offsets. This setup work is deliberately outside every timer.
    const renderParsed = compiler.parse(source, { filename: srcId(file) });
    if (renderParsed.errors?.length) {
      throw new Error(
        `style-free raw render corpus parse failed for ${srcId(file)}: ${firstCompileError(renderParsed.errors)}`,
      );
    }
    const descriptor = renderParsed.descriptor;
    const revisionSites = [];
    if (descriptor.template) {
      revisionSites.push({
        offset: descriptor.template.loc.start.offset,
        kind: "template",
      });
    }
    if (descriptor.script) {
      revisionSites.push({
        offset: descriptor.script.loc.start.offset,
        kind: "script",
      });
    }
    if (descriptor.scriptSetup) {
      revisionSites.push({
        offset: descriptor.scriptSetup.loc.start.offset,
        kind: "script",
      });
    }
    if (revisionSites.length === 0) {
      throw new Error(
        `raw render corpus has no template or script block: ${srcId(file)}`,
      );
    }
    return { ...file, source, revisionSites };
  });
}

/**
 * Materialise one fixed-width, semantically neutral revision of the shared
 * raw corpus. Both compilers receive these exact strings. Changing every
 * script/template slice on every pass prevents an already-populated Verter
 * host from treating unchanged block hashes as reusable compiler state.
 */
export function materializeRawRenderCorpus(
  prepared,
  { phase, iteration, cellSalt = "00000000" },
) {
  const phaseCode =
    phase === "warmup" ? "w" : phase === "fresh-child" ? "f" : "m";
  const token = `${cellSalt}:${phaseCode}${String(iteration).padStart(10, "0")}`;
  return prepared.map((file) => {
    let source = file.source;
    for (const site of [...file.revisionSites].sort(
      (a, b) => b.offset - a.offset,
    )) {
      const marker =
        site.kind === "template"
          ? `<!--vue-bench-raw:${token}-->`
          : `/*vue-bench-raw:${token}*/`;
      source =
        source.slice(0, site.offset) + marker + source.slice(site.offset);
    }
    return { ...file, source };
  });
}

function componentIdFor(file) {
  return createHash("sha256")
    .update(srcId(file).replace(/\\/g, "/"))
    .digest("hex")
    .slice(0, 8);
}

/**
 * Build the shared style-inclusive corpus.
 *
 * The generated benchmark fixture deliberately contains only inline plain
 * CSS. That is the overlap supported by the public paths measured here: Vue
 * compileStyle(), Vize compileSfc/compileSfcBatchWithResults(), Verter
 * processStyle(), and fervid compileSync/compileAsync. Preprocessors, CSS
 * Modules and external `src` styles are rejected instead of being silently
 * handled for only one compiler.
 */
export function prepareStyleSfcCorpus(sources, compiler) {
  return sources.map((file) => {
    const parsed = compiler.parse(file.source, { filename: srcId(file) });
    if (parsed.errors?.length) {
      throw new Error(
        `style corpus parse failed for ${srcId(file)}: ${firstCompileError(parsed.errors)}`,
      );
    }
    const { descriptor } = parsed;
    const componentId = componentIdFor(file);
    const revisionSites = [];
    if (descriptor.template) {
      revisionSites.push({
        offset: descriptor.template.loc.start.offset,
        kind: "template",
      });
    }
    if (descriptor.script) {
      revisionSites.push({
        offset: descriptor.script.loc.start.offset,
        kind: "script",
      });
    }
    if (descriptor.scriptSetup) {
      revisionSites.push({
        offset: descriptor.scriptSetup.loc.start.offset,
        kind: "script",
      });
    }

    const styles = descriptor.styles.map((style, index) => {
      if (style.src || style.module || (style.lang && style.lang !== "css")) {
        throw new Error(
          `style comparison requires inline plain CSS: ${srcId(file)} style ${index}`,
        );
      }
      revisionSites.push({
        offset: style.loc.start.offset,
        kind: "style",
        styleIndex: index,
      });
      return {
        index,
        content: style.content,
        filename: srcId(file),
        scopeId: componentId,
        scoped: Boolean(style.scoped),
      };
    });

    if (revisionSites.length === 0) {
      throw new Error(
        `style corpus has no compilable SFC blocks: ${srcId(file)}`,
      );
    }
    return { ...file, componentId, revisionSites, styles };
  });
}

/**
 * Materialise one fixed-width revision of the style-inclusive corpus.
 *
 * Every present script, template and style block changes on every pass. The
 * CSS task handed to Verter processStyle() contains the exact same inserted
 * marker as the CSS block in the full SFC handed to Vue, Vize and compileMany.
 */
export function materializeStyleSfcCorpus(
  prepared,
  { phase, iteration, cellSalt = "00000000" },
) {
  const phaseCode =
    phase === "warmup" ? "w" : phase === "fresh-child" ? "f" : "m";
  const token = `${cellSalt}:${phaseCode}${String(iteration).padStart(10, "0")}`;
  return prepared.map((file) => {
    let source = file.source;
    for (const site of [...file.revisionSites].sort(
      (a, b) => b.offset - a.offset,
    )) {
      const marker =
        site.kind === "template"
          ? `<!--vue-bench-style:${token}-->`
          : site.kind === "style"
            ? `.vue-bench-style-${file.componentId}-${site.styleIndex}{--vue-bench-revision:${token}}`
            : `/*vue-bench-style:${token}*/`;
      source =
        source.slice(0, site.offset) + marker + source.slice(site.offset);
    }
    return {
      ...file,
      source,
      styles: file.styles.map((style) => ({
        ...style,
        sentinel: `.vue-bench-style-${file.componentId}-${style.index}`,
        content: `.vue-bench-style-${file.componentId}-${style.index}{--vue-bench-revision:${token}}${style.content}`,
      })),
    };
  });
}

/**
 * Build variants for one matrix cell (target × env × sourceMap).
 */
export function buildCellVariants({
  target,
  env,
  sourceMap,
  sources,
  compiler35,
  compiler36,
  vizeNative,
  verterNative,
  fervidNative,
  makeVerterHost,
  capabilities,
  preparedRaw,
  preparedStyle,
  freshChildVariantId = "",
  // Sink for tools that produced NO measurement (a process abort, not a slow or
  // wrong answer). They get no table row — a ranking table is for things that
  // were ranked — and are reported above the tables instead.
  excluded = [],
}) {
  const vapor = target === "vapor";
  const isProd = env === "production";
  const variants = [];
  const cell = cellId(target, env, sourceMap);
  const sourceSalts = compileCellSourceSalts(cell);
  const smNote = `sourceMap=${sourceMap}`;
  // A fresh child receives already prepared corpora from the
  // parent. Preparation uses Vue's parser to find revision sites; repeating it
  // inside the child would uniquely exercise Vue before the timed row workload.
  // Every compiler still receives the same materialised source strings.
  const rawPrepared =
    preparedRaw ?? prepareRawRenderCorpus(sources, compiler36 ?? compiler35);
  const stylePrepared =
    preparedStyle ?? prepareStyleSfcCorpus(sources, compiler36 ?? compiler35);
  const vizeSingleModeOk = vapor
    ? true
    : capabilities?.vize?.singleProductionOptions?.ok === true;
  const vizeBatchModeOk = vapor
    ? true
    : capabilities?.vize?.batchProductionOptions?.ok === true;
  const verterRuntimeMapOk =
    capabilities?.verter?.runtimeSourceMap?.ok === true;
  const verterStyleMapOk = capabilities?.verter?.styleSourceMap?.ok === true;
  const verterRuntimeAlreadyEmitsCss =
    capabilities?.verter?.runtimeEmitsCss?.ok === true;
  const rawPassCache = new Map();
  const officialRawPassCache = new Map();
  const stylePassCache = new Map();
  const rawInputsForPass = (pass) => {
    const key = `${pass.phase}:${pass.iteration}`;
    if (!rawPassCache.has(key)) {
      const revised = materializeRawRenderCorpus(rawPrepared, {
        ...pass,
        cellSalt: sourceSalts.candidateRaw,
      });
      rawPassCache.set(key, {
        revision: `candidate-raw:${key}`,
        vize: revised.map((f) => ({ path: srcId(f), source: f.source })),
        verter: revised.map((f) => ({
          canonicalId: srcId(f).replace(/\\/g, "/"),
          source: f.source,
          requestedMode: "stateless",
        })),
      });
    }
    return rawPassCache.get(key);
  };
  const officialRawInputsForPass = (pass) => {
    const key = `${pass.phase}:${pass.iteration}`;
    if (!officialRawPassCache.has(key)) {
      const revised = materializeRawRenderCorpus(rawPrepared, {
        ...pass,
        cellSalt: sourceSalts.officialContext,
      });
      officialRawPassCache.set(key, {
        revision: `official-context:${key}`,
        files: revised,
      });
    }
    return officialRawPassCache.get(key);
  };
  const styleInputsForPass = (pass) => {
    const key = `${pass.phase}:${pass.iteration}`;
    if (!stylePassCache.has(key)) {
      const revised = materializeStyleSfcCorpus(stylePrepared, {
        ...pass,
        cellSalt: sourceSalts.candidateStyle,
      });
      stylePassCache.set(key, {
        revision: key,
        files: revised,
        styleBlocks: revised.reduce((n, f) => n + f.styles.length, 0),
        styleFiles: revised.filter((f) => f.styles.length > 0).length,
        vize: revised.map((f) => ({ path: srcId(f), source: f.source })),
        verter: revised.map((f) => ({
          canonicalId: srcId(f).replace(/\\/g, "/"),
          source: f.source,
          requestedMode: "stateless",
          componentId: f.componentId,
        })),
      });
    }
    return stylePassCache.get(key);
  };

  // Vue is the reference, not the fastest native row. Vue 3.5 anchors VDOM;
  // Vue 3.6 anchors Vapor because 3.5 has no Vapor backend.
  const referenceCompiler = vapor ? compiler36 : compiler35;
  const referencePackage = vapor ? "@vue/compiler-sfc-36" : "@vue/compiler-sfc";
  const referenceVersion = vapor ? "3.6" : "3.5";

  // --- Vue official 3.5 (VDOM only; Vapor not supported) ---
  // Note: worker_threads fan-out removed — pathologically slow for this corpus
  // and mixed unfairly with native batch rows.
  if (!vapor) {
    variants.push({
      ...COMPARISON.officialRender,
      id: `vue-3.5-1t-${cell}`,
      label: `@vue/compiler-sfc 3.5 (1T)`,
      package: "@vue/compiler-sfc",
      target,
      env,
      sourceMap,
      baseline: true,
      threading: "1t",
      invocation: "in-process",
      notes: `Official 3.5 VDOM, isProd=${isProd}, ${smNote}, single-threaded`,
      artifactLabel: "Code bytes",
      measure: async (pass) => {
        const inputs = officialRawInputsForPass(pass);
        let work = 0;
        let mapBytes = 0;
        const { ms } = timedSync(() => {
          for (const f of inputs.files) {
            const result = vueCompileSfc(compiler35, f.source, srcId(f), {
              vapor: false,
              isProd,
              sourceMap,
            });
            work += result.work;
            mapBytes += result.jsMapBytes;
          }
          if (work < sources.length) {
            throw new Error("vue 3.5 compile produced insufficient work units");
          }
          if (sourceMap && mapBytes === 0) {
            throw new Error(
              "Vue 3.5 was asked for JS source maps but returned none",
            );
          }
        });
        return {
          ms,
          artifact: work,
          mapBytes,
          sourceRevision: inputs.revision,
        };
      },
    });
  } else {
    variants.push({
      ...COMPARISON.officialRender,
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
      ...COMPARISON.officialRender,
      id: `vue-3.6-1t-${cell}`,
      label: `@vue/compiler-sfc 3.6 (1T)`,
      package: "@vue/compiler-sfc-36",
      target,
      env,
      sourceMap,
      baseline: vapor,
      threading: "1t",
      invocation: "in-process",
      notes: vapor
        ? `Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=${isProd}, ${smNote}`
        : `Official 3.6 VDOM, isProd=${isProd}, ${smNote}`,
      artifactLabel: "Code bytes",
      measure: async (pass) => {
        const inputs = officialRawInputsForPass(pass);
        let work = 0;
        let mapBytes = 0;
        const { ms } = timedSync(() => {
          for (const f of inputs.files) {
            const result = vueCompileSfc(compiler36, f.source, srcId(f), {
              vapor,
              isProd,
              sourceMap,
            });
            work += result.work;
            mapBytes += result.jsMapBytes;
          }
          if (work < sources.length) {
            throw new Error("vue 3.6 compile produced insufficient work units");
          }
          if (sourceMap && mapBytes === 0) {
            throw new Error(
              "Vue 3.6 was asked for JS source maps but returned none",
            );
          }
        });
        return {
          ms,
          artifact: work,
          mapBytes,
          sourceRevision: inputs.revision,
        };
      },
    });
  } else {
    variants.push({
      ...COMPARISON.officialRender,
      id: `vue-3.6-unavailable-${cell}`,
      label: `@vue/compiler-sfc 3.6`,
      package: "@vue/compiler-sfc-36",
      target,
      env,
      notes: "Package not installed",
      skip: true,
    });
  }

  // --- Vue reference rows for the candidate comparison classes ---
  // These are deliberately separate from the reference-version context rows
  // above. Each candidate class gets the exact Vue workload it is compared
  // with; no Vize/Verter-only fastest baseline is allowed.
  if (referenceCompiler) {
    variants.push({
      ...COMPARISON.rawRenderBatch,
      id: `vue-reference-raw-render-${cell}`,
      label: `Vue compiler-sfc ${referenceVersion} reference (raw render, 1T)`,
      package: referencePackage,
      target,
      env,
      sourceMap,
      baseline: true,
      baselineLabel: "Vue",
      threading: "1t",
      invocation: "in-process",
      artifactLabel: "Generated JS bytes",
      notes: `REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate, ${smNote}, isProd=${isProd}. Receives the same style-free, per-pass-revised SFC strings as the native candidates. Every script/template block changes on every pass; input construction is outside the timer. Vue is the ratio denominator even when a candidate is faster.`,
      measure: async (pass) => {
        const inputs = rawInputsForPass(pass);
        let jsBytes = 0;
        let mapBytes = 0;
        const { ms } = timedSync(() => {
          for (const f of inputs.vize) {
            const result = vueCompileSfc(referenceCompiler, f.source, f.path, {
              vapor,
              isProd,
              sourceMap,
            });
            jsBytes += result.jsBytes;
            mapBytes += result.jsMapBytes;
          }
          if (jsBytes < sources.length) {
            throw new Error("Vue raw reference emitted insufficient JS");
          }
          if (sourceMap && mapBytes === 0) {
            throw new Error("Vue raw reference returned no JS source maps");
          }
        });
        return {
          ms,
          artifact: jsBytes,
          jsBytes,
          cssBytes: 0,
          mapBytes,
          sourceRevision: inputs.revision,
        };
      },
    });

    variants.push({
      ...COMPARISON.sfcWithStyle,
      id: `vue-reference-sfc-style-${cell}`,
      label: `Vue compiler-sfc ${referenceVersion} reference (render + CSS, 1T)`,
      package: referencePackage,
      target,
      env,
      sourceMap,
      baseline: true,
      baselineLabel: "Vue",
      threading: "1t",
      invocation: "in-process",
      artifactLabel: "Generated JS + CSS bytes",
      notes: `REFERENCE BASELINE: official @vue/compiler-sfc parse + compileScript + compileTemplate + compileStyle for every inline plain-CSS block, ${smNote}, isProd=${isProd}. This is a composed official compiler-sfc pipeline (Vue exposes no one-call whole-SFC compile API). Every script, template and style block changes on every pass. The fixture scope is explicit: inline plain CSS only; no preprocessor, CSS Module or external-style work is being claimed.`,
      measure: async (pass) => {
        const inputs = styleInputsForPass(pass);
        let jsBytes = 0;
        let cssBytes = 0;
        let styleBlocks = 0;
        let jsMapBytes = 0;
        let cssMapBytes = 0;
        const { ms } = timedSync(() => {
          for (const f of inputs.files) {
            const result = vueCompileSfc(
              referenceCompiler,
              f.source,
              srcId(f),
              {
                vapor,
                isProd,
                sourceMap,
                styles: true,
                componentId: f.componentId,
              },
            );
            jsBytes += result.jsBytes;
            cssBytes += result.cssBytes;
            styleBlocks += result.styleBlocks;
            jsMapBytes += result.jsMapBytes;
            cssMapBytes += result.cssMapBytes;
          }
          if (jsBytes < sources.length || cssBytes === 0) {
            throw new Error("Vue style reference emitted insufficient JS/CSS");
          }
          if (styleBlocks !== inputs.styleBlocks) {
            throw new Error(
              `Vue style reference compiled ${styleBlocks}/${inputs.styleBlocks} style blocks`,
            );
          }
          if (sourceMap && (jsMapBytes === 0 || cssMapBytes === 0)) {
            throw new Error(
              `Vue style reference returned incomplete maps: JS=${jsMapBytes}, CSS=${cssMapBytes}`,
            );
          }
        });
        return {
          ms,
          artifact: jsBytes + cssBytes,
          jsBytes,
          cssBytes,
          mapBytes: jsMapBytes + cssMapBytes,
          jsMapBytes,
          cssMapBytes,
          styleBlocks,
          styleFiles: inputs.styleFiles,
          sourceRevision: inputs.revision,
        };
      },
    });
  } else {
    for (const comparison of [
      [COMPARISON.rawRenderBatch, "raw render"],
      [COMPARISON.sfcWithStyle, "render + CSS"],
    ]) {
      variants.push({
        ...comparison[0],
        id: `vue-reference-unavailable-${comparison[1].replaceAll(" ", "-")}-${cell}`,
        label: `Vue reference (${comparison[1]})`,
        package: referencePackage,
        target,
        env,
        baseline: true,
        notes: `No official Vue compiler is installed for the ${target} target, so this class has no reference baseline.`,
        skip: true,
      });
    }
  }

  // --- Vize ---
  if (!vizeNative.error) {
    // Vize exposes the production behaviours as template-specific options
    // rather than one isProduction flag. Set both explicitly; the capability
    // gate below proves the installed single and batch APIs honour them.
    const vizeTemplateMode = {
      templateHoistStatic: isProd,
      templateCacheHandlers: isProd,
    };
    const vizeOpts = {
      vapor,
      sourceMap,
      isTs: true,
      ...vizeTemplateMode,
    };
    variants.push({
      ...COMPARISON.sfcWithStyle,
      id: `vize-1t-${cell}`,
      label: `Vize compileSfc loop (full SFC, 1T)`,
      package: "@vizejs/native",
      target,
      env,
      sourceMap,
      threading: "1t",
      invocation: "in-process",
      unranked:
        !vizeSingleModeOk ||
        (sourceMap &&
          (capabilities?.vize?.singleSourceMap?.ok !== true ||
            capabilities?.vize?.singleStyleSourceMap?.ok !== true)),
      notes: `CANDIDATE VS VUE STYLE BASELINE: compileSfc vapor=${vapor}, isTs=true, templateHoistStatic=${isProd}, templateCacheHandlers=${isProd}, ${smNote}. Receives the same per-pass-revised full SFCs; compiles script, template and inline plain-CSS style blocks. The installed binding's production/development response is capability-probed before ranking.${!vizeSingleModeOk ? ` ⚠ UNRANKED: compileSfc production options were not observed changing VDOM output (${capabilities?.vize?.singleProductionOptions?.detail ?? "no detail"}).` : ""}${sourceMap && (capabilities?.vize?.singleSourceMap?.ok !== true || capabilities?.vize?.singleStyleSourceMap?.ok !== true) ? ` ⚠ UNRANKED: style-inclusive source-map work is incomplete (JS=${capabilities?.vize?.singleSourceMap?.ok === true}, CSS=${capabilities?.vize?.singleStyleSourceMap?.ok === true}; ${capabilities?.vize?.singleStyleSourceMap?.detail ?? "no CSS-map detail"}).` : ""}`,
      artifactLabel: "Generated JS + CSS bytes",
      measure: async (pass) => {
        const inputs = styleInputsForPass(pass);
        let codeBytes = 0;
        let cssBytes = 0;
        let jsMapBytes = 0;
        let cssMapBytes = 0;
        const { ms } = timedSync(() => {
          for (const f of inputs.files) {
            const result = vizeNative.compileSfc(f.source, {
              filename: srcId(f),
              ...vizeOpts,
            });
            if (result?.errors?.length) {
              throw new Error(
                `vize compile error in ${f.filename}: ${result.errors.join("; ")}`,
              );
            }
            for (const style of f.styles) {
              if (!String(result?.css ?? "").includes(style.sentinel)) {
                throw new Error(
                  `vize compileSfc omitted style block ${style.index} sentinel for ${f.filename}`,
                );
              }
            }
            codeBytes += result?.code?.length ?? 0;
            cssBytes += result?.css?.length ?? 0;
            jsMapBytes += serializedMapBytes(result?.map);
            cssMapBytes += cssSourceMapBytes(result);
          }
          if (codeBytes < sources.length || cssBytes === 0) {
            throw new Error("vize compile returned empty JS/CSS for corpus");
          }
          if (
            sourceMap &&
            capabilities?.vize?.singleSourceMap?.ok &&
            jsMapBytes === 0
          ) {
            throw new Error(
              "vize compileSfc capability probe reported JS maps but the timed path returned none",
            );
          }
          if (
            sourceMap &&
            capabilities?.vize?.singleStyleSourceMap?.ok &&
            cssMapBytes === 0
          ) {
            throw new Error(
              "vize compileSfc capability probe reported CSS maps but the timed path returned none",
            );
          }
        });
        return {
          ms,
          artifact: codeBytes + cssBytes,
          jsBytes: codeBytes,
          cssBytes,
          mapBytes: jsMapBytes + cssMapBytes,
          jsMapBytes,
          cssMapBytes,
          styleBlocks: inputs.styleBlocks,
          styleFiles: inputs.styleFiles,
          sourceRevision: inputs.revision,
        };
      },
    });

    if (typeof vizeNative.compileSfcBatchWithResults === "function") {
      variants.push({
        ...COMPARISON.sfcWithStyle,
        id: `vize-full-sfc-batch-${cell}`,
        label: `Vize compileSfcBatchWithResults (render + CSS, Rayon batch)`,
        package: "@vizejs/native",
        target,
        env,
        sourceMap,
        threading: "batch",
        invocation: "in-process",
        unranked:
          !vizeBatchModeOk ||
          (sourceMap &&
            (capabilities?.vize?.batchSourceMap?.ok !== true ||
              capabilities?.vize?.batchStyleSourceMap?.ok !== true)),
        notes: `CANDIDATE VS VUE STYLE BASELINE: compileSfcBatchWithResults vapor=${vapor}, isTs=true, templateHoistStatic=${isProd}, templateCacheHandlers=${isProd}, includeSourceMap=${sourceMap}; receives the same per-pass-revised full SFCs and emits JS plus compiled CSS. Script, template and CSS all change every pass, so a prior generated output cannot satisfy this call. Warm samples reuse the process-global Rayon pool; a Fresh-child sample may still inherit native/thread/allocator effects from the excluded package import and adapter setup. Input objects are built outside the timer. The installed binding's production/development response is capability-probed before ranking.${!vizeBatchModeOk ? ` ⚠ UNRANKED: batch production options were not observed changing VDOM output (${capabilities?.vize?.batchProductionOptions?.detail ?? "no detail"}).` : ""}${sourceMap && (capabilities?.vize?.batchSourceMap?.ok !== true || capabilities?.vize?.batchStyleSourceMap?.ok !== true) ? ` ⚠ UNRANKED: style-inclusive source-map work is incomplete (JS=${capabilities?.vize?.batchSourceMap?.ok === true}, CSS=${capabilities?.vize?.batchStyleSourceMap?.ok === true}; ${capabilities?.vize?.batchStyleSourceMap?.detail ?? "no CSS-map detail"}).` : ""}`,
        artifactLabel: "Generated JS + CSS bytes",
        measure: async (pass) => {
          const inputs = styleInputsForPass(pass);
          return timedSync(() => {
            const result = vizeNative.compileSfcBatchWithResults(inputs.vize, {
              vapor,
              isTs: true,
              includeSourceMap: sourceMap,
              ...vizeTemplateMode,
            });
            const rows = vizeBatchRows(
              result,
              inputs.vize.length,
              "vize style compileSfcBatchWithResults",
            );
            const codeBytes = rows.reduce(
              (n, r) => n + (r?.code?.length ?? r?.result?.code?.length ?? 0),
              0,
            );
            if (codeBytes < sources.length) {
              throw new Error("vize batch returned empty code for corpus");
            }
            const cssBytes = rows.reduce(
              (n, r) => n + (r?.css?.length ?? r?.result?.css?.length ?? 0),
              0,
            );
            if (inputs.styleBlocks > 0 && cssBytes === 0) {
              throw new Error(
                `vize batch returned no CSS for ${inputs.styleBlocks} style blocks`,
              );
            }
            for (let index = 0; index < rows.length; index++) {
              const css = String(
                rows[index]?.css ?? rows[index]?.result?.css ?? "",
              );
              for (const style of inputs.files[index].styles) {
                if (!css.includes(style.sentinel)) {
                  throw new Error(
                    `vize batch omitted style block ${style.index} sentinel for ${inputs.files[index].filename}`,
                  );
                }
              }
            }
            const jsMapBytes = rows.reduce(
              (n, r) => n + serializedMapBytes(r?.map),
              0,
            );
            const cssMapBytes = rows.reduce(
              (n, r) => n + cssSourceMapBytes(r),
              0,
            );
            if (
              sourceMap &&
              capabilities?.vize?.batchSourceMap?.ok &&
              jsMapBytes === 0
            ) {
              throw new Error(
                "vize batch capability probe reported JS maps but the timed path returned none",
              );
            }
            if (
              sourceMap &&
              capabilities?.vize?.batchStyleSourceMap?.ok &&
              cssMapBytes === 0
            ) {
              throw new Error(
                "vize batch capability probe reported CSS maps but the timed path returned none",
              );
            }
            return {
              artifact: codeBytes + cssBytes,
              jsBytes: codeBytes,
              cssBytes,
              mapBytes: jsMapBytes + cssMapBytes,
              jsMapBytes,
              cssMapBytes,
              styleBlocks: inputs.styleBlocks,
              styleFiles: inputs.styleFiles,
              sourceRevision: inputs.revision,
            };
          });
        },
      });

      variants.push({
        ...COMPARISON.rawRenderBatch,
        id: `vize-raw-render-batch-${cell}`,
        label: `Vize compileSfcBatchWithResults (raw render)`,
        package: "@vizejs/native",
        target,
        env,
        sourceMap,
        threading: "batch",
        invocation: "in-process",
        artifactLabel: "Generated JS bytes",
        unranked:
          !vizeBatchModeOk ||
          (sourceMap && capabilities?.vize?.batchSourceMap?.ok !== true),
        notes: `CANDIDATE VS VUE RAW BASELINE: compileSfcBatchWithResults vapor=${vapor}, isTs=true, templateHoistStatic=${isProd}, templateCacheHandlers=${isProd}, includeSourceMap=${sourceMap}; receives the exact same style-free, per-pass-revised strings as Vue and Verter. Every input body differs between passes, so a previous whole-output artifact cannot directly satisfy the call. Source inspection finds per-call parse/compile/codegen and no generated-output cache on this standalone entry point; the harness does not claim more granular internal reuse than it can observe. Warm samples reuse the process-global Rayon pool. A Fresh-child sample excludes package import, so it does not prove the pool, allocator, JIT or all native state began untouched. Ordinary allocator reuse is not instrumented and remains UNKNOWN. Input construction is outside the timer.${!vizeBatchModeOk ? ` ⚠ UNRANKED: batch production options were not observed changing VDOM output (${capabilities?.vize?.batchProductionOptions?.detail ?? "no detail"}).` : ""}${sourceMap && capabilities?.vize?.batchSourceMap?.ok !== true ? ` ⚠ UNRANKED: batch source-map capability probe failed (${capabilities?.vize?.batchSourceMap?.detail ?? "no detail"}).` : ""}`,
        measure: async (pass) => {
          const inputs = rawInputsForPass(pass);
          let codeBytes = 0;
          let mapBytes = 0;
          const { ms } = timedSync(() => {
            const result = vizeNative.compileSfcBatchWithResults(inputs.vize, {
              vapor,
              isTs: true,
              includeSourceMap: sourceMap,
              ...vizeTemplateMode,
            });
            const rows = vizeBatchRows(
              result,
              inputs.vize.length,
              "vize raw compileSfcBatchWithResults",
            );
            codeBytes = rows.reduce((n, r) => n + (r?.code?.length ?? 0), 0);
            mapBytes = rows.reduce((n, r) => n + serializedMapBytes(r?.map), 0);
            if (codeBytes < sources.length) {
              throw new Error("vize raw render batch returned empty code");
            }
            if (sourceMap && mapBytes === 0) {
              throw new Error(
                "vize raw render batch was asked for source maps but returned none",
              );
            }
          });
          return {
            ms,
            artifact: codeBytes,
            mapBytes,
            sourceRevision: inputs.revision,
          };
        },
      });
    }
  } else {
    variants.push({
      ...COMPARISON.sfcWithStyle,
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
  // Two things about this row are stated on every row rather than folded into
  // the number:
  //
  //  1. fervid compiles `<style>` blocks as part of `compileSync` (scoped
  //     styles come back `isCompiled: true`, with the scope attribute already
  //     applied). It therefore belongs in render+CSS, not raw render.
  //  2. fervid's map support is split into JS and CSS capabilities. The pinned
  //     build returns a JS map but no map for its separately emitted styles, so
  //     source-map-on style rows remain visible but unranked.
  const fervidProbe =
    (!freshChildVariantId || freshChildVariantId.startsWith("fervid-")) &&
    !vapor &&
    !fervidNative.error &&
    typeof fervidNative.Compiler === "function"
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
    const fervidJsMapOk = capabilities?.fervid?.sourceMap?.ok === true;
    const fervidCssMapOk = capabilities?.fervid?.styleSourceMap?.ok === true;
    const fervidWorkNote =
      "Candidate against the Vue render+CSS baseline. Receives the same per-pass-revised SFC strings and returns generated JS plus compiled CSS. ⚠ emits non-fatal NonVoidHtmlElementStartTagWithTrailingSolidus diagnostics for self-closing non-void tags (<div />, <MyComp />) that Vue's SFC parser accepts; codegen is complete regardless, so the row is gated on codegen produced for every file, not on diagnostic silence.";
    const fervidSmNote = sourceMap
      ? ` sourceMap=true: JS map=${fervidJsMapOk}, CSS map=${fervidCssMapOk}; both are required for this style-inclusive row.${!fervidJsMapOk || !fervidCssMapOk ? " Measured but UNRANKED for incomplete map work." : " Returned map bytes are asserted."}`
      : "";

    variants.push({
      ...COMPARISON.sfcWithStyle,
      id: `fervid-1t-${cell}`,
      label: `fervid compileSync (1T)`,
      package: "@fervid/napi",
      target,
      env,
      sourceMap,
      threading: "1t",
      invocation: "in-process",
      artifactLabel: "Generated JS + CSS bytes",
      unranked: sourceMap && (!fervidJsMapOk || !fervidCssMapOk),
      notes: `compileSync isProduction=${isProd}, ${smNote}, single-threaded.${fervidSmNote} ${fervidWorkNote}`,
      measure: async (pass) => {
        const inputs = styleInputsForPass(pass);
        const fervidInputs = inputs.files.map((f) => ({
          source: f.source,
          options: { id: f.componentId, filename: srcId(f) },
        }));
        const compiler = new FervidCompiler(fervidOptions);
        const measured = timedSync(() => {
          const results = fervidInputs.map((i) =>
            compiler.compileSync(i.source, i.options),
          );
          return assertFervidOutput(results, sources.length);
        });
        if (measured.styleBlocks !== inputs.styleBlocks) {
          throw new Error(
            `fervid compiled ${measured.styleBlocks}/${inputs.styleBlocks} style blocks`,
          );
        }
        if (sourceMap && fervidJsMapOk && measured.jsMapBytes === 0) {
          throw new Error(
            "fervid capability probe reported JS maps but the timed path returned none",
          );
        }
        if (sourceMap && fervidCssMapOk && measured.cssMapBytes === 0) {
          throw new Error(
            "fervid capability probe reported CSS maps but the timed path returned none",
          );
        }
        return {
          ...measured,
          styleFiles: inputs.styleFiles,
          sourceRevision: inputs.revision,
        };
      },
    });

    variants.push({
      ...COMPARISON.sfcWithStyle,
      id: `fervid-async-${cell}`,
      label: `fervid compileAsync (${UV_POOL}-thread libuv pool)`,
      package: "@fervid/napi",
      target,
      env,
      sourceMap,
      threading: "batch",
      invocation: "in-process",
      artifactLabel: "Generated JS + CSS bytes",
      unranked: sourceMap && (!fervidJsMapOk || !fervidCssMapOk),
      notes: `compileAsync isProduction=${isProd}, ${smNote}, fanned out with Promise.all over libuv's threadpool (UV_THREADPOOL_SIZE=${UV_POOL}, default 4 — NOT sized to core count like a Rayon pool, so on a runner with more than ${UV_POOL} cores this row is thread-capped below the batch rows beside it).${fervidSmNote} ${fervidWorkNote}`,
      measure: async (pass) => {
        const inputs = styleInputsForPass(pass);
        const fervidInputs = inputs.files.map((f) => ({
          source: f.source,
          options: { id: f.componentId, filename: srcId(f) },
        }));
        const compiler = new FervidCompiler(fervidOptions);
        const measured = await timedAsync(async () => {
          const results = await Promise.all(
            fervidInputs.map((i) => compiler.compileAsync(i.source, i.options)),
          );
          return assertFervidOutput(results, sources.length);
        });
        if (measured.styleBlocks !== inputs.styleBlocks) {
          throw new Error(
            `fervid async compiled ${measured.styleBlocks}/${inputs.styleBlocks} style blocks`,
          );
        }
        if (sourceMap && fervidJsMapOk && measured.jsMapBytes === 0) {
          throw new Error(
            "fervid async capability probe reported JS maps but the timed path returned none",
          );
        }
        if (sourceMap && fervidCssMapOk && measured.cssMapBytes === 0) {
          throw new Error(
            "fervid async capability probe reported CSS maps but the timed path returned none",
          );
        }
        return {
          ...measured,
          styleFiles: inputs.styleFiles,
          sourceRevision: inputs.revision,
        };
      },
    });
  } else if (!vapor && fervidNative.error) {
    variants.push({
      ...COMPARISON.sfcWithStyle,
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
      ...COMPARISON.sfcWithStyle,
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
    if (typeof verterNative.processStyle === "function") {
      variants.push({
        ...COMPARISON.sfcWithStyle,
        id: `verter-render-style-${cell}`,
        label: `Verter compileMany + processStyle (render + CSS)`,
        package: "@verter/native",
        target,
        env,
        sourceMap,
        threading: "host-pool + serial-css",
        invocation: "in-process",
        artifactLabel: "Generated JS + CSS bytes",
        unranked:
          (sourceMap && (!verterRuntimeMapOk || !verterStyleMapOk)) ||
          verterRuntimeAlreadyEmitsCss,
        notes: `CANDIDATE VS VUE STYLE BASELINE: runtime-render plus one public processStyle call per style block; forceVapor=${vapor}, isProduction=${isProd}, forceJs=false, ${smNote}, requestedMode=stateless, analysis=${VERTER_ANALYSIS_LEVEL}. Receives the same per-pass-revised full SFCs and exact revised CSS contents as Vue/Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer; compileMany performs first admission inside the timer. processStyle is synchronous and called serially on the JS thread. cacheHit must stay zero.${sourceMap && (!verterRuntimeMapOk || !verterStyleMapOk) ? ` ⚠ UNRANKED: installed capability probe reports runtime JS maps=${verterRuntimeMapOk} and processStyle CSS maps=${verterStyleMapOk}.` : ""}${verterRuntimeAlreadyEmitsCss ? " ⚠ UNRANKED: runtime-render now emits compiled CSS, so composing it with processStyle may duplicate style work; this adapter requires revalidation before ranking." : ""}`,
        measure: async (pass) => {
          const inputs = styleInputsForPass(pass);
          const host = makeVerterHost({
            devMode: !isProd,
            analysisLevel: VERTER_ANALYSIS_LEVEL,
          });
          return timedVerterHost(host, () => {
            const results = host.compileMany(inputs.verter, {
              target: "runtime-render",
              defaultMode: "stateless",
              priority: "interactive",
              compileProfile: renderProfile,
            });
            const failed = results.filter((r) => r.errors?.length);
            if (failed.length) {
              throw new Error(
                `verter style compileMany failed ${failed.length}: ${failed[0].errors[0]}`,
              );
            }
            const jsBytes = results.reduce(
              (n, r) => n + (r?.code?.length ?? 0),
              0,
            );
            const cacheHits = results.filter((r) => r.cacheHit).length;
            const actualModes = [...new Set(results.map((r) => r.actualMode))];
            if (cacheHits !== 0) {
              throw new Error(
                `verter style runtime-render reported ${cacheHits} cache hits`,
              );
            }
            if (actualModes.some((mode) => mode !== "stateless")) {
              throw new Error(
                `verter style compile ran unexpected mode(s): ${actualModes.join(", ")}`,
              );
            }

            let cssBytes = 0;
            let styleBlocks = 0;
            let cssMapBytes = 0;
            let moduleMappings = 0;
            for (const file of inputs.files) {
              for (const style of file.styles) {
                const result = verterNative.processStyle(style.content, {
                  scopeId: style.scopeId,
                  scoped: style.scoped,
                  isModule: false,
                  filename: style.filename,
                  sourcemap: sourceMap,
                });
                cssBytes += result?.code?.length ?? 0;
                cssMapBytes += serializedMapBytes(result?.sourceMap);
                moduleMappings += result?.moduleClasses?.length ?? 0;
                styleBlocks++;
              }
            }
            if (jsBytes < sources.length || cssBytes === 0) {
              throw new Error("verter style path emitted insufficient JS/CSS");
            }
            if (styleBlocks !== inputs.styleBlocks) {
              throw new Error(
                `verter processStyle handled ${styleBlocks}/${inputs.styleBlocks} blocks`,
              );
            }
            const jsMapBytes = results.reduce(
              (n, r) => n + serializedMapBytes(r?.sourceMap),
              0,
            );
            if (
              sourceMap &&
              verterRuntimeMapOk &&
              verterStyleMapOk &&
              (jsMapBytes === 0 || cssMapBytes === 0)
            ) {
              throw new Error(
                "Verter capability probe reported JS/CSS source maps, but the timed style path returned none",
              );
            }
            return {
              artifact: jsBytes + cssBytes,
              jsBytes,
              cssBytes,
              styleBlocks,
              styleFiles: inputs.styleFiles,
              moduleMappings,
              cacheHits,
              actualModes,
              mapBytes: jsMapBytes + cssMapBytes,
              sourceRevision: inputs.revision,
            };
          });
        },
      });
    } else {
      variants.push({
        ...COMPARISON.sfcWithStyle,
        id: `verter-style-api-unavailable-${cell}`,
        label: "Verter render + CSS",
        package: "@verter/native",
        target,
        env,
        notes:
          "processStyle export not found; no equivalent style-inclusive native path can be measured.",
        skip: true,
      });
    }

    variants.push({
      ...COMPARISON.rawRenderBatch,
      id: `verter-raw-render-${cell}`,
      label: `Verter compileMany (first-admission stateless raw render)`,
      package: "@verter/native",
      target,
      env,
      sourceMap,
      threading: "batch",
      invocation: "in-process",
      artifactLabel: "Generated JS bytes",
      unranked: sourceMap && !verterRuntimeMapOk,
      notes: `CANDIDATE VS VUE RAW BASELINE: runtime-render forceVapor=${vapor}, isProduction=${isProd}, forceJs=false, ${smNote}, hmr=${renderProfile.hmrStrategy}, requestedMode=stateless, analysis=${VERTER_ANALYSIS_LEVEL}. Receives the exact same style-free, per-pass-revised strings as Vue and Vize. Each pass gets a fresh workspace-backed host/project, created outside the timer, so the timed compileMany call measures first source admission rather than incremental edits on a populated host. cacheHit must remain zero. Warm samples retain process/native-library state; Fresh-child samples exclude package import and host construction, so neither metric claims wholly untouched global state. No host-owned parsed or semantic state crosses passes.${sourceMap && !verterRuntimeMapOk ? ` ⚠ UNRANKED IN THIS CELL: installed capability probe reports no runtime-render source map (${capabilities?.verter?.runtimeSourceMap?.detail ?? "no detail"}).` : ""}`,
      measure: async (pass) => {
        const inputs = rawInputsForPass(pass);
        const host = makeVerterHost({
          devMode: !isProd,
          analysisLevel: VERTER_ANALYSIS_LEVEL,
        });
        return timedVerterHost(host, () => {
          const results = host.compileMany(inputs.verter, {
            target: "runtime-render",
            defaultMode: "stateless",
            priority: "interactive",
            compileProfile: renderProfile,
          });
          const failed = results.filter((r) => r.errors?.length);
          if (failed.length) {
            throw new Error(
              `verter compileMany failed ${failed.length}: ${failed[0].errors[0]}`,
            );
          }
          const codeBytes = results.reduce(
            (n, r) => n + (r?.code?.length ?? 0),
            0,
          );
          if (codeBytes < sources.length) {
            throw new Error("verter compileMany returned empty code");
          }
          const cacheHits = results.filter((r) => r.cacheHit).length;
          if (cacheHits !== 0) {
            throw new Error(
              `verter stateless raw compile unexpectedly reported ${cacheHits} cache hits`,
            );
          }
          const actualModes = [...new Set(results.map((r) => r.actualMode))];
          if (actualModes.some((mode) => mode !== "stateless")) {
            throw new Error(
              `verter raw compile ran unexpected mode(s): ${actualModes.join(", ")}`,
            );
          }
          const mapBytes = results.reduce(
            (n, r) => n + serializedMapBytes(r?.sourceMap),
            0,
          );
          if (sourceMap && verterRuntimeMapOk && mapBytes === 0) {
            throw new Error(
              "Verter capability probe reported runtime source maps, but the timed raw path returned none",
            );
          }
          return {
            artifact: codeBytes,
            cacheHits,
            actualModes,
            mapBytes,
            sourceRevision: inputs.revision,
          };
        });
      },
    });
  } else if (!verterNative.error) {
    variants.push({
      ...COMPARISON.rawRenderBatch,
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
      ...COMPARISON.rawRenderBatch,
      id: `verter-unavailable-${cell}`,
      label: `Verter native`,
      package: "@verter/native",
      target,
      env,
      notes: `Could not load: ${verterNative.error}`,
      skip: true,
    });
  }

  // One explicit setup hook per adapter. The scheduler executes these hooks
  // for the complete pass before it starts any row timer, so no row is charged
  // for constructing the shared revised corpus merely because it ran first.
  // The returned diagnostics let the fresh-child and warm adapters prove that
  // they used the same option shape and input dimensions while retaining the
  // deliberately different per-pass source hashes.
  for (const variant of variants) {
    if (variant.skip || typeof variant.measure !== "function") continue;
    const inputsForPass =
      variant.comparisonClass === COMPARISON.officialRender.comparisonClass
        ? officialRawInputsForPass
        : variant.comparisonClass === COMPARISON.sfcWithStyle.comparisonClass
          ? styleInputsForPass
          : rawInputsForPass;
    const optionsFingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          adapterId: variant.id,
          target,
          env,
          sourceMap,
          analysisLevel: variant.id.startsWith("verter-")
            ? VERTER_ANALYSIS_LEVEL
            : null,
        }),
      )
      .digest("hex");
    variant.prepare = (pass) => {
      const inputs = inputsForPass(pass);
      const files = inputs.files ?? inputs.vize ?? [];
      const hash = createHash("sha256");
      let inputBytes = 0;
      for (const file of files) {
        const path = srcId(file);
        const source = String(file.source ?? "");
        inputBytes += Buffer.byteLength(source);
        hash.update(path).update("\0").update(source).update("\0");
      }
      return {
        adapterOptionsHash: optionsFingerprint,
        inputSourceHash: hash.digest("hex"),
        inputCount: files.length,
        inputBytes,
        sourceRevision: inputs.revision,
      };
    };
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
  {
    compiler35,
    compiler36,
    vizeNative,
    verterNative,
    fervidNative,
    makeVerterHost,
  },
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
      // down either. Record it as UNKNOWN. applyCodegenGates keeps the timing
      // visible but excludes the row from ranking: an unchecked artifact cannot
      // honestly be presented as equivalent to one that passed validation.
      gates[key] = {
        ok: false,
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
      const opts = {
        id: srcId(f),
        inlineTemplate: false,
        isProd,
        fs: compilerFs,
      };
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
    safe(
      "@vizejs/native:compileSfc",
      () => (f) =>
        vizeNative.compileSfc(f.source, {
          filename: srcId(f),
          vapor,
          sourceMap: false,
          isTs: true,
          templateHoistStatic: isProd,
          templateCacheHandlers: isProd,
        })?.code,
    );
  }
  if (
    !vizeNative.error &&
    typeof vizeNative.compileSfcBatchWithResults === "function"
  ) {
    safe("@vizejs/native:compileSfcBatchWithResults", () => (f) => {
      const result = vizeNative.compileSfcBatchWithResults(
        [{ path: srcId(f), source: f.source }],
        {
          vapor,
          isTs: true,
          includeSourceMap: false,
          threads: 1,
          templateHoistStatic: isProd,
          templateCacheHandlers: isProd,
        },
      );
      return vizeBatchRows(result, 1, "Vize batch codegen gate")[0]?.code;
    });
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
        host.compileMany(
          [
            {
              canonicalId: f.path.replace(/\\/g, "/"),
              source: f.source,
              requestedMode: "stateless",
            },
          ],
          {
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
          },
        )[0]?.code;
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
      return (f) =>
        fc.compileSync(f.source, { id: srcId(f), filename: srcId(f) })?.code;
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
 * UNKNOWN and unranked. Such rows used to keep their ranking with only an
 * annotation, quietly favouring whichever tool the harness failed to check.
 */
export function applyCodegenGates(variants, gates) {
  for (const v of variants) {
    if (v.skip) continue;
    const gateKey =
      v.id.startsWith("vize-full-sfc-batch-") ||
      v.id.startsWith("vize-raw-render-batch-")
        ? "@vizejs/native:compileSfcBatchWithResults"
        : v.id.startsWith("vize-1t-")
          ? "@vizejs/native:compileSfc"
          : v.package;
    const gate = gates[gateKey];

    if (!gate) {
      v.unranked = true;
      v.notes = `${v.notes} ⚠ CODEGEN VALIDITY UNKNOWN — no gate is registered for ${gateKey}, so this row's output was never parsed. Time is shown but excluded from ranking.`;
      continue;
    }
    if (gate.unmeasured) {
      v.unranked = true;
      v.notes = `${v.notes} ⚠ CODEGEN VALIDITY UNKNOWN — ${gate.firstError}. Time is shown but excluded from ranking; a validation failure cannot be credited as a compiler pass.`;
      continue;
    }
    if (gate.ok) continue;
    v.unranked = true;
    v.notes = `${v.notes} ⚠ FAILED CODEGEN VALIDITY GATE — ${gate.invalid}/${gate.total} files compiled to output that is not parseable JavaScript/TypeScript (first: ${gate.firstError}). Time is shown in brackets and excluded from ranking: a compiler that emits broken output for part of the corpus is not doing the same work as one that does not. The gate is re-run every benchmark, so a fixed release clears this automatically.`;
  }
  return variants;
}

/**
 * Exclude either a not-yet-measured variant or an already-measured result row.
 * Post-timing conformance plants deliberately use the latter form so validation
 * cannot warm the code paths whose timing it certifies.
 */
function markCompileRowUnranked(row) {
  row.unranked = true;
  if (row.status === "ok") {
    row.status = "unranked";
    row.throughput = "n/a";
  }
}

function semanticEntrypointForRow(row) {
  if (row.id?.startsWith("vize-1t-")) return "vize-single";
  if (
    row.id?.startsWith("vize-full-sfc-batch-") ||
    row.id?.startsWith("vize-raw-render-batch-")
  ) {
    return "vize-batch";
  }
  if (row.id?.startsWith("verter-")) return "verter-compile-many";
  if (row.id?.startsWith("fervid-1t-")) return "fervid-sync";
  if (row.id?.startsWith("fervid-async-")) return "fervid-async";
  if (row.package === "@vue/compiler-sfc") return "vue-3.5";
  if (row.package === "@vue/compiler-sfc-36") return "vue-3.6";
  return null;
}

function semanticFailureSummary(gate) {
  const failures = (gate?.results ?? []).filter(
    (result) => result.status !== "PASS",
  );
  if (!failures.length)
    return gate?.reason ?? "no passing plant outcomes were returned";
  const shown = failures
    .slice(0, 3)
    .map(
      (result) =>
        `${result.id} [${result.phase}]: ${result.detail ?? result.status}`,
    )
    .join("; ");
  return failures.length > 3
    ? `${shown}; +${failures.length - 3} more (all retained in JSON)`
    : shown;
}

/**
 * Attach post-timing, exact-entrypoint runtime-semantic verdicts.
 *
 * PASS means every planted observable behaved correctly. FAIL and UNKNOWN both
 * preserve the measurement but cannot rank. A failed/unknown Vue denominator
 * also invalidates its entire comparison class: candidate timings do not become
 * meaningful merely because the reference could not be certified.
 */
export function applyCompileSemanticGates(rows, validity, configuration) {
  const config = validity?.matrix?.[compileValidityConfigKey(configuration)];
  for (const row of rows) {
    if (row.status === "skipped" || row.skip) continue;
    const entrypoint = semanticEntrypointForRow(row);
    const gate = entrypoint ? config?.entrypoints?.[entrypoint] : null;
    if (!gate) {
      markCompileRowUnranked(row);
      row.notes = `${row.notes} ⚠ RUNTIME SEMANTIC VALIDITY UNKNOWN — no exact-entrypoint plant verdict exists for ${entrypoint ?? row.id}.`;
      continue;
    }
    if (gate.status !== "PASS") {
      markCompileRowUnranked(row);
      row.notes = `${row.notes} ⚠ RUNTIME SEMANTIC VALIDITY ${gate.status} (${gate.passed}/${gate.plantCount} passed) — ${semanticFailureSummary(gate)}. Generated text is not compared; these are observable runtime/API outcomes. Full per-plant results are retained in validation.compileSemantics.`;
      continue;
    }
    row.notes = `${row.notes} ✓ RUNTIME SEMANTIC VALIDITY: ${gate.passed}/${gate.plantCount} independent observable-behaviour plants passed through ${gate.exactPath}.`;
  }

  if (configuration.sourceMap) {
    for (const row of rows) {
      if (row.status === "skipped" || row.status === "error" || row.skip)
        continue;
      markCompileRowUnranked(row);
      row.notes = `${row.notes} ⚠ SOURCE-MAP MAPPING VALIDITY UNKNOWN — this release checks that the requested JS/CSS map artifacts are present, but it does not yet trace planted generated positions back to the correct SFC block, filename and source coordinates. Map-on timing remains visible but cannot rank until that semantic oracle exists.`;
    }
  }

  const classes = new Map();
  for (const row of rows) {
    if (!row.comparisonClass) continue;
    if (!classes.has(row.comparisonClass)) classes.set(row.comparisonClass, []);
    classes.get(row.comparisonClass).push(row);
  }
  for (const members of classes.values()) {
    const reference = members.find(
      (row) => row.baseline && row.status !== "skipped",
    );
    if (!reference || reference.status === "ok") continue;
    for (const row of members) {
      if (
        row === reference ||
        row.status === "skipped" ||
        row.status === "error"
      )
        continue;
      markCompileRowUnranked(row);
      row.notes = `${row.notes} ⚠ COMPARISON REFERENCE INVALID: the Vue reference in this work-equivalence class did not clear mandatory validation, so no candidate ratio in the class may rank.`;
    }
  }
  return rows;
}

/**
 * Mandatory style-correctness preflight for the style-inclusive ranking.
 *
 * The timed generated corpus is deliberately simple, so it cannot by itself
 * prove that a compiler's CSS pipeline implements Vue's defining transforms.
 * These feature probes are untimed and gate the style rows. The shared suite
 * covers ordinary and compound scoped selectors, deep/slotted/global semantics,
 * selector-list pseudos, nested at-rules, scoped keyframes, v-bind linkage and
 * CSS Modules. Every case must be transformed correctly, not merely parsed.
 */
export async function computeStyleCorrectnessGates({
  compiler35,
  compiler36,
  vizeNative,
  verterNative,
  fervidNative,
  makeVerterHost,
}) {
  const gates = {};
  const finishFeatures = (key, passed, failures) => {
    gates[key] = {
      ok: failures.length === 0,
      passed,
      failures,
      ...(failures.length
        ? {
            error: failures
              .map((failure) => `[${failure.id}] ${failure.error}`)
              .join("; "),
          }
        : {}),
    };
  };
  const recordFeatures = async (key, runFeature) => {
    const passed = [];
    const failures = [];
    for (let index = 0; index < STYLE_FEATURE_CASES.length; index++) {
      const feature = STYLE_FEATURE_CASES[index];
      try {
        await runFeature(feature, index);
        passed.push(feature.id);
      } catch (error) {
        failures.push({
          id: feature.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    finishFeatures(key, passed, failures);
  };

  const gateVueFeature = async (compiler, feature) => {
    const filename = `/style-gate/${feature.id}.vue`;
    const parsed = compiler.parse(feature.source, { filename });
    if (parsed.errors?.length) {
      throw new Error(
        `${feature.id}: parse failed: ${firstCompileError(parsed.errors)}`,
      );
    }
    const style = parsed.descriptor.styles[0];
    const options = {
      source: style.content,
      filename,
      id: "data-v-abc12345",
      scoped: style.scoped,
      isProd: true,
    };
    const result = style.module
      ? await compiler.compileStyleAsync({ ...options, modules: true })
      : compiler.compileStyle(options);
    if (result.errors?.length) {
      throw new Error(
        `${feature.id}: compileStyle failed: ${firstCompileError(result.errors)}`,
      );
    }
    let js = "";
    if (parsed.descriptor.script || parsed.descriptor.scriptSetup) {
      js = compiler.compileScript(parsed.descriptor, {
        id: "abc12345",
        inlineTemplate: false,
        isProd: true,
      }).content;
    }
    assertStyleFeature(feature.id, {
      css: result.code,
      js,
      modules: result.modules ?? null,
    });
  };

  await recordFeatures("@vue/compiler-sfc", (feature) =>
    gateVueFeature(compiler35, feature),
  );
  if (compiler36) {
    await recordFeatures("@vue/compiler-sfc-36", (feature) =>
      gateVueFeature(compiler36, feature),
    );
  }

  if (
    !vizeNative.error &&
    typeof vizeNative.compileSfcBatchWithResults === "function"
  ) {
    const key = "@vizejs/native:compileSfcBatchWithResults";
    const inputs = STYLE_FEATURE_CASES.map((feature) => ({
      path: `/style-gate/${feature.id}.vue`,
      source: feature.source,
    }));
    const passed = [];
    const failures = [];
    let rows = null;
    try {
      const result = vizeNative.compileSfcBatchWithResults(inputs, {
        isTs: true,
        templateHoistStatic: true,
        templateCacheHandlers: true,
      });
      rows = vizeBatchRows(
        result,
        inputs.length,
        "style gate compileSfcBatchWithResults multi-input call",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      for (const feature of STYLE_FEATURE_CASES) {
        failures.push({
          id: feature.id,
          error: `whole batch failed: ${message}`,
        });
      }
    }
    if (rows) {
      for (let index = 0; index < STYLE_FEATURE_CASES.length; index++) {
        const feature = STYLE_FEATURE_CASES[index];
        const row = rows[index];
        try {
          if (row?.path && row.path !== inputs[index].path) {
            throw new Error(
              `batch result attribution mismatch: expected ${inputs[index].path}, got ${row.path}`,
            );
          }
          let modules = null;
          if (feature.id === "css-modules") {
            const match = row.code?.match(
              /__cssModules\s*=\s*\{[\s\S]*?["']foo["']\s*:\s*["']([^"']+)["']/,
            );
            modules = match ? { foo: match[1] } : null;
          }
          assertStyleFeature(feature.id, {
            css: row.css,
            js: row.code,
            modules,
          });
          passed.push(feature.id);
        } catch (error) {
          failures.push({
            id: feature.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    finishFeatures(key, passed, failures);
  }

  if (!vizeNative.error && typeof vizeNative.compileSfc === "function") {
    await recordFeatures("@vizejs/native:compileSfc", async (feature) => {
      const single = vizeNative.compileSfc(feature.source, {
        filename: `/style-gate/${feature.id}.vue`,
        isTs: true,
        scopeId: "data-v-abc12345",
        templateHoistStatic: true,
        templateCacheHandlers: true,
      });
      if (single.errors?.length) {
        throw new Error(
          `compileSfc ${feature.id}: ${single.errors.join("; ")}`,
        );
      }
      let modules = null;
      if (feature.id === "css-modules") {
        const match = single.code?.match(
          /__cssModules\s*=\s*\{[\s\S]*?["']foo["']\s*:\s*["']([^"']+)["']/,
        );
        modules = match ? { foo: match[1] } : null;
      }
      assertStyleFeature(feature.id, {
        css: single.css,
        js: single.code,
        modules,
      });
    });
  }

  if (
    !verterNative.error &&
    typeof verterNative.processStyle === "function" &&
    typeof verterNative.VerterHost === "function"
  ) {
    const host = makeVerterHost({
      devMode: false,
      analysisLevel: VERTER_ANALYSIS_LEVEL,
    });
    try {
      const key = "@verter/native";
      const inputs = STYLE_FEATURE_CASES.map((feature) => ({
        canonicalId: `/style-gate/${feature.id}.vue`,
        source: feature.source,
        requestedMode: "stateless",
        componentId: createHash("sha256")
          .update(feature.id)
          .digest("hex")
          .slice(0, 8),
      }));
      let rendered = null;
      const passed = [];
      const failures = [];
      try {
        rendered = host.compileMany(inputs, {
          target: "runtime-render",
          defaultMode: "stateless",
          priority: "interactive",
          compileProfile: {
            isProduction: true,
            customElement: false,
            ssr: false,
            forceJs: false,
            forceVapor: false,
            sourceMap: false,
            hmrStrategy: "none",
            runtimeModuleName: "vue",
          },
        });
        if (rendered.length !== inputs.length) {
          throw new Error(
            `compileMany returned ${rendered.length}/${inputs.length} plant results`,
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        for (const feature of STYLE_FEATURE_CASES) {
          failures.push({
            id: feature.id,
            error: `whole compileMany failed: ${message}`,
          });
        }
      }
      if (rendered) {
        for (let index = 0; index < STYLE_FEATURE_CASES.length; index++) {
          const feature = STYLE_FEATURE_CASES[index];
          const input = inputs[index];
          const render = rendered[index];
          try {
            if (
              render?.canonicalId &&
              render.canonicalId !== input.canonicalId
            ) {
              throw new Error(
                `compileMany result attribution mismatch: expected ${input.canonicalId}, got ${render.canonicalId}`,
              );
            }
            if (render?.errors?.length) {
              throw new Error(
                `compileMany errors: ${firstCompileError(render.errors)}`,
              );
            }
            if (render?.cacheHit || render?.actualMode !== "stateless") {
              throw new Error(
                `expected first-admission stateless result; cacheHit=${Boolean(render?.cacheHit)}, actualMode=${String(render?.actualMode)}`,
              );
            }
            const style = compiler35.parse(feature.source, {
              filename: input.canonicalId,
            }).descriptor.styles[0];
            const result = verterNative.processStyle(style.content, {
              scopeId: input.componentId,
              scoped: style.scoped,
              isModule: Boolean(style.module),
              moduleName:
                typeof style.module === "string" ? style.module : undefined,
              filename: input.canonicalId,
            });
            assertStyleFeature(feature.id, {
              css: result.code,
              js: render.code,
              modules: result.moduleClasses,
            });
            passed.push(feature.id);
          } catch (error) {
            failures.push({
              id: feature.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
      finishFeatures(key, passed, failures);
    } finally {
      host?.close?.();
    }
  }

  if (!fervidNative.error && typeof fervidNative.Compiler === "function") {
    for (const entrypoint of ["sync", "async"]) {
      const probe = spawnSync(
        process.execPath,
        [
          join(rootDir, "scripts", "lib", "style-correctness-fervid-child.mjs"),
          ...(entrypoint === "async" ? ["--async"] : []),
        ],
        { encoding: "utf8", timeout: 30_000, maxBuffer: 4 * 1024 * 1024 },
      );
      const line = String(probe.stdout ?? "")
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .at(-1);
      let payload = null;
      try {
        payload = line ? JSON.parse(line) : null;
      } catch {
        payload = null;
      }
      const childFailure = probe.signal
        ? `child aborted with ${probe.signal}`
        : probe.error?.code === "ETIMEDOUT"
          ? "child timed out"
          : payload?.error || `child exited ${probe.status}`;
      await recordFeatures(
        `@fervid/napi:compile${entrypoint === "async" ? "Async" : "Sync"}`,
        async (feature) => {
          const outcome = payload?.results?.find(
            (result) => result.id === feature.id,
          );
          if (!outcome) throw new Error(childFailure);
          if (!outcome.ok)
            throw new Error(outcome.error || "feature probe failed");
        },
      );
    }
  }

  return gates;
}

export function applyStyleCorrectnessGates(variants, gates) {
  for (const variant of variants) {
    if (variant.skip || variant.comparisonClass !== "sfc-with-style") continue;
    const gateKey = variant.id.startsWith("vize-full-sfc-batch-")
      ? "@vizejs/native:compileSfcBatchWithResults"
      : variant.id.startsWith("vize-1t-")
        ? "@vizejs/native:compileSfc"
        : variant.id.startsWith("fervid-1t-")
          ? "@fervid/napi:compileSync"
          : variant.id.startsWith("fervid-async-")
            ? "@fervid/napi:compileAsync"
            : variant.package;
    const gate = gates[gateKey];
    if (!gate) {
      markCompileRowUnranked(variant);
      variant.notes = `${variant.notes} ⚠ STYLE CORRECTNESS GATE NOT RUN for ${gateKey}; a render+CSS result without the ${STYLE_FEATURE_CASES.length}-plant CSS semantics suite is not ranked.`;
      continue;
    }
    if (!gate.ok) {
      markCompileRowUnranked(variant);
      variant.notes = `${variant.notes} ⚠ FAILED STYLE CORRECTNESS GATE — ${gate.error}. All ${STYLE_FEATURE_CASES.length} independent CSS semantics plants are mandatory; measured but UNRANKED.`;
      continue;
    }
    variant.notes = `${variant.notes} ✓ STYLE CORRECTNESS GATE: all ${STYLE_FEATURE_CASES.length} independent CSS semantics plants passed.`;
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
              for (i++; i < text.length && text[i] !== q; i++)
                if (text[i] === "\\") i++;
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
function computePropResolutionCensus(
  sources,
  compiler,
  tools,
  { sample = 8 } = {},
) {
  const typed = sources.filter((f) => /defineProps<\s*[A-Za-z]/.test(f.source));
  // Silent drops happen where a declaration is REACHED through module
  // resolution — a bare or aliased type import — not in self-contained files.
  // An alphabetical prefix of all defineProps<> files sampled element-plus's
  // affix..autocomplete and missed tooltip.vue's barrel drop entirely, so the
  // sample leads with cross-module-typed files and fills with the rest.
  const crossModule = typed.filter((f) =>
    /import\s+type\s[^'"]*?from\s*['"][^.'"]/.test(f.source),
  );
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
    emitters.set("@vizejs/native:compileSfc", (f) => {
      const r = vizeNative.compileSfc(f.source, {
        filename: srcId(f),
        isTs: true,
        templateHoistStatic: true,
        templateCacheHandlers: true,
      });
      if (r?.errors?.length) return { skip: true };
      return { code: r?.code ?? "" };
    });
  }
  if (
    !vizeNative?.error &&
    typeof vizeNative?.compileSfcBatchWithResults === "function"
  ) {
    emitters.set("@vizejs/native:compileSfcBatchWithResults", (f) => {
      const result = vizeNative.compileSfcBatchWithResults(
        [{ path: srcId(f), source: f.source }],
        {
          isTs: true,
          threads: 1,
          templateHoistStatic: true,
          templateCacheHandlers: true,
        },
      );
      try {
        return {
          code:
            vizeBatchRows(result, 1, "Vize batch prop census")[0]?.code ?? "",
        };
      } catch {
        return { skip: true };
      }
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
        resolveFailed: (r?.errors ?? []).some((e) =>
          /resolve/i.test(String(e?.message ?? e)),
        ),
      };
    });
  }
  if (
    !verterNative?.error &&
    typeof verterNative?.VerterHost === "function" &&
    makeVerterHost
  ) {
    let host = null;
    emitters.set("@verter/native", (f) => {
      host ??= makeVerterHost({
        devMode: false,
        analysisLevel: VERTER_ANALYSIS_LEVEL,
      });
      const [entry] = host.compileMany(
        [
          {
            canonicalId: f.path.replace(/\\/g, "/"),
            source: f.source,
            requestedMode: "stateless",
          },
        ],
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
      const { descriptor, errors } = compiler.parse(f.source, {
        filename: srcId(f),
      });
      if (errors?.length || !(descriptor.scriptSetup || descriptor.script))
        continue;
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
          state.examples.push(
            `${f.filename}: ${missing.slice(0, 4).join(", ")}`,
          );
        }
      }
    }
  }

  return {
    applicable: true,
    sampled: candidates.length,
    anchoredFiles,
    byPackage,
  };
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
    const censusKey =
      v.id.startsWith("vize-full-sfc-batch-") ||
      v.id.startsWith("vize-raw-render-batch-")
        ? "@vizejs/native:compileSfcBatchWithResults"
        : v.id.startsWith("vize-1t-")
          ? "@vizejs/native:compileSfc"
          : v.package;
    const state = census.byPackage?.get(censusKey);
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
  const shas = new Set(
    sources.map((f) => createHash("sha256").update(f.source).digest("hex")),
  );
  return {
    files: sources.length,
    uniqueBodies: shas.size,
    uniqueContents: shas.size === sources.length,
    duplicateBodies: sources.length - shas.size,
  };
}

function styleCorpusCensus(sources, compiler) {
  const census = {
    filesWithStyles: 0,
    blocks: 0,
    scoped: 0,
    modules: 0,
    vBind: 0,
    external: 0,
    preprocessors: 0,
  };
  for (const file of sources) {
    const parsed = compiler.parse(file.source, { filename: srcId(file) });
    if (parsed.errors?.length) continue;
    if (parsed.descriptor.styles.length) census.filesWithStyles++;
    for (const style of parsed.descriptor.styles) {
      census.blocks++;
      if (style.scoped) census.scoped++;
      if (style.module) census.modules++;
      if (style.content.includes("v-bind(")) census.vBind++;
      if (style.src) census.external++;
      if (style.lang && style.lang !== "css") census.preprocessors++;
    }
  }
  return census;
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
      [
        join(rootDir, "scripts", "lib", "real-world", "fervid-preflight.mjs"),
        payloadPath,
        progressPath,
      ],
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
          .find((l) =>
            /panicked at|not yet implemented|fatal|Assertion/i.test(l),
          ) ?? "";
      const how = probe.signal
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
    verdict = {
      ok: false,
      reason: `probe could not run: ${error?.message ?? error}`,
    };
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
  const styleCensus = styleCorpusCensus(sources, compiler35);
  // Prepare revision sites once in the parent. Fresh-child samples
  // receive these plain objects so their first compiler call is not preceded by
  // a Vue-only parser pass used merely to construct the shared benchmark input.
  const preparationCompiler = compiler36 ?? compiler35;
  const preparedRaw = prepareRawRenderCorpus(sources, preparationCompiler);
  const preparedStyle = prepareStyleSfcCorpus(sources, preparationCompiler);

  const vizeNative = loadOptional("@vizejs/native");
  const verterNative = loadOptional("@verter/native");
  const fervidNative = loadOptional("@fervid/napi");
  // Verter's project context. A bare `new VerterHost()` has no filesystem, so
  // `defineProps<Imported>()` fails with "missing-declaration" on every real
  // project — the same class of harness gap as the fs bridge and registerTS
  // above, and by the upstream-CI rule it was ours, not Verter's.
  // Each call creates a fresh Workspace and host. This preserves filesystem
  // provisioning while preventing parsed/semantic/project state from crossing
  // timed passes. Construction remains outside the timer.
  const verterWorkspaceRoot = fixtureDir.replace(/\\/g, "/");
  const makeVerterHost = (config) => {
    if (
      !verterNative.error &&
      typeof verterNative.Workspace === "function" &&
      typeof verterNative.VerterHost?.withWorkspace === "function"
    ) {
      const workspace = new verterNative.Workspace([verterWorkspaceRoot]);
      workspace.configureProjects([
        { root: verterWorkspaceRoot, workspaceRoot: verterWorkspaceRoot },
      ]);
      return verterNative.VerterHost.withWorkspace(config, workspace);
    }
    return new verterNative.VerterHost(config);
  };

  // Before any timing: does each compiler emit parseable code for this corpus, in
  // THIS cell's configuration? Rows whose tool fails are measured but unranked.
  //
  // Computed per (target, env) pair and memoised, so a cell's verdict is always
  // about the codegen that cell measures — see computeCodegenGates. Only pairs
  // that survive the matrix filter are ever computed, so asking for one cell does
  // not pay for four gates.
  const tools = {
    compiler35,
    compiler36,
    vizeNative,
    verterNative,
    fervidNative,
    makeVerterHost,
  };
  const compileCapabilities = computeCompileCapabilities(tools);

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
  // Correctness plants run only after every timed cell. Besides keeping their
  // work untimed, this ordering prevents the conformance suite from warming a
  // native entrypoint, compiler cache, allocator or thread pool before that
  // entrypoint's own benchmark warmups have established the measured state.
  let styleCorrectnessGates = null;
  let stylePreprocessorGates = null;

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
  // Default is OFF to keep the published matrix focused; the ON cell is
  // available explicitly. Native rows assert a non-empty returned map when
  // enabled. Vize's batch API spells the option `includeSourceMap` (not the
  // single-file API's `sourceMap`), while Verter returns `sourceMap` per entry.
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
  const freshChildExecutedOrder = [];
  const warmExecutedOrder = [];
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
      makeVerterHost,
      capabilities: compileCapabilities,
      preparedRaw,
      preparedStyle,
    });
    applyCodegenGates(cellVariants, gatesFor(target, env));
    applyPropResolutionCensus(cellVariants, propCensus);
    const freshChild = measureCompileFreshChildVariants(cellVariants, {
      runs: options.runs,
      payload: {
        target,
        env,
        sourceMap,
        fixtureDir,
        sources,
        capabilities: compileCapabilities,
        preparedRaw,
        preparedStyle,
      },
    });
    const orderLog = { warmups: [], runs: [] };
    const measured = await measureVariants(cellVariants, {
      runs: options.runs,
      warmups: options.warmups,
      fileCount,
      prepareAllBeforeTiming: true,
      balancedShortRuns: true,
      orderLog,
    });
    freshChildExecutedOrder.push({
      cell: cellId(target, env, sourceMap),
      iterations: freshChild.executedOrder,
    });
    warmExecutedOrder.push({
      cell: cellId(target, env, sourceMap),
      ...orderLog,
    });
    for (const row of measured) {
      const fresh = freshChild.byId.get(row.id);
      if (!fresh) continue;
      if (Number.isFinite(fresh.freshChildMedianMs)) {
        Object.assign(row, fresh);

        const warmMeta = Array.isArray(row.metaSamples) ? row.metaSamples : [];
        const freshMeta = Array.isArray(row.freshChildMetaSamples)
          ? row.freshChildMetaSamples
          : [];
        const values = (items, key) =>
          items.map((item) => item?.[key]).filter((v) => v != null);
        const sameSet = (a, b) =>
          a.length > 0 &&
          b.length > 0 &&
          JSON.stringify([...new Set(a)].sort()) ===
            JSON.stringify([...new Set(b)].sort());
        const freshHashes = values(freshMeta, "inputSourceHash");
        const warmHashes = values(warmMeta, "inputSourceHash");
        const checks = {
          optionsHash: sameSet(
            values(freshMeta, "adapterOptionsHash"),
            values(warmMeta, "adapterOptionsHash"),
          ),
          inputCount: sameSet(
            values(freshMeta, "inputCount"),
            values(warmMeta, "inputCount"),
          ),
          inputBytes: sameSet(
            values(freshMeta, "inputBytes"),
            values(warmMeta, "inputBytes"),
          ),
          artifact: sameSet(
            values(freshMeta, "artifact"),
            values(warmMeta, "artifact"),
          ),
          sourceRevisionsDistinct:
            freshHashes.length === freshMeta.length &&
            warmHashes.length === warmMeta.length &&
            new Set([...freshHashes, ...warmHashes]).size ===
              freshHashes.length + warmHashes.length,
        };
        const freshModes = values(freshMeta, "actualModes").map(JSON.stringify);
        const warmModes = values(warmMeta, "actualModes").map(JSON.stringify);
        if (freshModes.length || warmModes.length)
          checks.actualModes = sameSet(freshModes, warmModes);
        const freshHits = values(freshMeta, "cacheHits");
        const warmHits = values(warmMeta, "cacheHits");
        if (freshHits.length || warmHits.length)
          checks.cacheHits = sameSet(freshHits, warmHits);
        row.adapterParity = {
          ok: Object.values(checks).every(Boolean),
          checks,
          freshChildSourceHashes: freshHashes,
          warmSourceHashes: warmHashes,
        };
        if (!row.adapterParity.ok) {
          row.status = "unranked";
          row.throughput = "n/a";
          row.notes = `${row.notes ? `${row.notes} ` : ""}⚠ ADAPTER PARITY FAILED between fresh-child and warm paths: ${Object.entries(
            checks,
          )
            .filter(([, ok]) => !ok)
            .map(([name]) => name)
            .join(", ")}.`;
        }
      } else if (fresh.freshChildError) {
        row.freshChildRuns = fresh.freshChildRuns;
        row.freshChildError = fresh.freshChildError;
        row.notes = `${row.notes ? `${row.notes} ` : ""}⚠ FRESH-CHILD SAMPLE UNAVAILABLE: ${fresh.freshChildError}. Warm timing remains reported.`;
      }
    }
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

  styleCorrectnessGates = await computeStyleCorrectnessGates(tools);
  for (const group of groups) {
    applyStyleCorrectnessGates(group.variants, styleCorrectnessGates);
  }
  // This audit is deliberately diagnostic rather than a gate on the timed
  // inline-plain-CSS class. It separates exact API ownership of Sass work from
  // downstream Vue style transforms after one shared pinned-Sass pass.
  stylePreprocessorGates = await computeStylePreprocessorGates(tools);

  // Runtime plants are deliberately last. They run in one isolated child per
  // exact API/configuration, so neither their compilation nor jsdom/Vue mounting
  // can alter the warm state measured above.
  const compileSemantics = runCompileValidityMatrix(
    groups.map(({ target, env, sourceMap }) => ({ target, env, sourceMap })),
  );
  for (const group of groups) {
    applyCompileSemanticGates(group.variants, compileSemantics, {
      target: group.target,
      env: group.env,
      sourceMap: group.sourceMap,
    });
  }

  // One entry per (tool, reason): the same abort is hit once per matrix cell, and
  // four identical notices would read as four separate failures.
  const excludedUnique = [];
  for (const e of excluded) {
    if (
      !excludedUnique.some((x) => x.tool === e.tool && x.reason === e.reason)
    ) {
      excludedUnique.push(e);
    }
  }

  return {
    id: "compile",
    excluded: excludedUnique,
    label: "Compiler",
    files: fileCount,
    bytes,
    corpus: {
      mode: corpusMode,
      ...uniqueness,
      style: styleCensus,
      fixtureDir,
    },
    freshChildMeasurement: {
      samplesPerActiveRow: Math.max(1, Math.trunc(Number(options.runs) || 1)),
      processModel: "fresh-child-first-timed-row-workload",
      packageIsolation:
        "selected-row-benchmarked-compiler-only; shared-harness-dependencies-still-imported",
      excludes: [
        "child-process-startup",
        "package-import",
        "input-materialisation",
        "host-setup",
      ],
      osPageCacheFlushed: false,
      whollyFreshRuntimeStateClaimed: false,
      executedOrder: freshChildExecutedOrder,
      deterministicFailureRetries: 0,
    },
    warmMeasurement: {
      processModel: "shared-benchmark-process-after-discarded-pass",
      inputMaterialisation: "explicit-all-row-setup-before-timers",
      executedOrder: warmExecutedOrder,
    },
    validation: {
      compileCapabilities,
      styleCorrectness: styleCorrectnessGates,
      styleCorrectnessManifest: {
        suiteVersion: STYLE_FEATURE_SUITE_VERSION,
        suiteHash: STYLE_FEATURE_SUITE_HASH,
        plantIds: STYLE_FEATURE_CASES.map((plant) => plant.id),
      },
      stylePreprocessors: stylePreprocessorGates,
      stylePreprocessorManifest: {
        suiteVersion: STYLE_PREPROCESSOR_SUITE_VERSION,
        suiteHash: STYLE_PREPROCESSOR_SUITE_HASH,
        plantIds: STYLE_PREPROCESSOR_CASES.map((plant) => plant.id),
      },
      compileSemantics,
    },
    // Why this surface is split into sub-tables. Stated by the surface that
    // does the splitting rather than defaulted in the renderer, so a grouped
    // surface with a different reason (the IDE suites) is not given this one.
    groupingNote:
      "**Vue-anchored apples-to-apples compiler results.** Each target/environment/source-map cell contains two candidate-comparison subsections: Raw SFC compilation gives Vue, Vize batch and Verter first-admission the same revised style-free SFC strings; SFC compilation with CSS gives the style-capable entrypoints the same revised style-bearing SFCs and counts both generated JS and CSS. Every measured row publishes Fresh child and Warm separately when both samplers succeed. Ratios never cross these subsections and always use the official Vue workload as 1.00x. A failed semantic gate leaves both measured times visible but unranked.",
    methodology: [
      "Matrix: target ∈ {vdom, vapor} × env ∈ {production, development} × sourceMap ∈ {off, on}. Cells are independent — do not cross-compare cells.",
      `Corpus mode=${corpusMode}: ${uniqueness.uniqueBodies}/${uniqueness.files} unique content SHAs. The exact compileSfcBatchWithResults path measured here does not have Vize's stats-only batch API's duplicate-body grouping, so duplicate bodies are disclosed for corpus representativeness rather than described as output-cache hits.`,
      "Ratio columns are vs fastest — the fastest ranked row in each comparison class is the 1.00x denominator; no tool is pinned as a reference. The official Vue workload competes on the same terms and its row is labelled: Vue 3.5 provides the VDOM workload; Vue 3.6 the Vapor one because 3.5 has no Vapor backend.",
      "Rows are split into explicit work-equivalence classes and ratios never cross those boundaries: official Vue-version context; Raw SFC compilation; and SFC compilation with CSS. The old unmatched Verter retained-host re-render row is not in the ranked surface; it remains available through diagnose:compile-warmth.",
      "The RAW RENDER class compares Vue, Vize and Verter on byte-identical, intentionally style-free SFC strings. <style> blocks are removed from ALL three outside the timer by the class definition. This class measures SFC parse + script/template parse and analysis + render codegen, not CSS.",
      "Every raw-class cell/pass injects a distinct fixed-width semantically neutral comment into every present script and template block. This prevents Vue cross-cell source-cache contamination and previous whole-output reuse; all candidates in a cell receive the exact same revised strings. Revision and input-object construction happen outside the timer.",
      "Official Vue-version context rows use a separate fixed-width source namespace from the candidate raw class. This prevents the context row and Vue candidate baseline from lending each other same-compiler parse/template cache entries while preserving byte-identical Vue/Vize/Verter inputs inside the candidate class.",
      "The ranked raw Verter row creates a fresh workspace-backed host/project outside every timed pass, then measures first source admission through compileMany. requestedMode=stateless is explicit and cacheHit is asserted zero. Process/native-library state may remain warm, but no populated-host parsed, semantic, dependency-graph or output state crosses timed passes.",
      "The SFC RENDER + CSS class changes every present script, template and style block on every pass. Vue runs its official composed compiler-sfc pipeline (parse + compileScript + compileTemplate + compileStyle); Vize runs compileSfc/compileSfcBatchWithResults; Verter runs compileMany runtime-render plus one processStyle call per block. Generated JS and CSS bytes are both counted.",
      `TIMED STYLE CORPUS CENSUS: ${styleCensus.filesWithStyles}/${fileCount} files contain ${styleCensus.blocks} style block(s): scoped=${styleCensus.scoped}, CSS Modules=${styleCensus.modules}, v-bind=${styleCensus.vBind}, preprocessors=${styleCensus.preprocessors}, external src=${styleCensus.external}. The direct three-tool comparison currently requires inline plain CSS; the report never claims timed feature coverage absent from these counts.`,
      `STYLE CORRECTNESS GATE (untimed, mandatory for style ranking): suite ${STYLE_FEATURE_SUITE_VERSION} (${STYLE_FEATURE_SUITE_HASH.slice(0, 12)}) runs ${STYLE_FEATURE_CASES.length} independent plants covering ordinary and compound scoped selectors; :deep(), :slotted(), :global(), :is() and :where() semantics; selectors nested in @media/@supports; scoped keyframe declaration/reference consistency; multiple and quoted v-bind() expression linkage; and CSS Modules mapping. Checks assert semantic relationships, never whole generated-CSS equality. Vize compileSfc and one real multi-input compileSfcBatchWithResults call have separate verdicts; Verter uses one fresh-host multi-input compileMany followed by serial processStyle; fervid sync and async are checked separately. Any failure is measured but UNRANKED and self-clears after a fixed upgrade. Plants execute after timing so they cannot pre-warm measured entrypoints; manifest metadata is retained in validation.styleCorrectnessManifest.`,
      `SASS/SCSS CAPABILITY AUDIT (untimed, diagnostic): suite ${STYLE_PREPROCESSOR_SUITE_VERSION} (${STYLE_PREPROCESSOR_SUITE_HASH.slice(0, 12)}) runs ${STYLE_PREPROCESSOR_CASES.length} independent lang=scss/lang=sass plants for variables, mixins/nesting, scoped selectors, :deep() inside @media, v-bind linkage and CSS Modules. validation.stylePreprocessors keeps two non-interchangeable verdicts: exactEntrypoints says whether the measured compiler API directly accepts authored Sass and orchestrates the separately installed preprocessor in that call; sharedSassAdapter first runs the pinned sass dependency once per plant and then tests only each compiler's downstream Vue-style transform. Harness preprocessing can never turn an unsupported exact API into PASS. These diagnostic plants do not gate the separately defined timed inline-plain-CSS class.`,
      `RUNTIME SEMANTIC GATE (untimed, mandatory): suite ${compileSemantics.suiteVersion} runs ${compileSemantics.plantCount} independent valid-SFC plants against observable DOM/events/updates/public-instance behaviour, never generated-text equality. It certifies Vue's composed non-inline API, Vize single and real multi-input batch, fresh-host stateless multi-input Verter compileMany, and fervid sync/async separately with the exact target/env/map flags. Each API runs in an isolated child after all timings; every outcome and the manifest hash are retained in validation.compileSemantics. FAIL, crash, timeout, missing verdict and UNKNOWN are measured but UNRANKED. Vapor output is executed with Vue's pinned, version-matched 3.6 compiler/runtime and shipped createVaporApp path; each Vapor entrypoint receives its own PASS/FAIL verdict, while unsupported backends remain UNKNOWN individually. VDOM evidence is never borrowed.`,
      "Scheduling is not disguised as equal: Vue's reference and Vize compileSfc loop are 1T; Vize's with-results API compiles inside the process-global Rayon pool; Verter compileMany uses its host pool but public processStyle is synchronous and is called serially; fervid async uses libuv. Each row says so.",
      "Imported-type resolution is PROVISIONED for every tool that accepts a provision: @vue/compiler-sfc gets an fs bridge (ts.sys semantics — fileExists is false for directories) AND a registered TypeScript module for non-relative sources, exactly as Vite's plugin-vue provides in real builds; Verter gets a workspace-backed host rooted at the project. Withholding either does not 'treat tools equally' — it uniquely disables the tools that resolve through the host and publishes the gap as their ❌.",
      "The TypeScript registered for @vue/compiler-sfc is THE HARNESS'S OWN (the declared JS arm), the same version for every corpus — not each project's pinned TS. Uniform resolution behaviour across corpora was chosen over per-project fidelity; the tsconfig consulted is still the project's own.",
      "⚠ Imported-type resolution DEPTH differs by tool: @vue/compiler-sfc THROWS on an unresolvable prop type, Verter reports an error, Vize resolves what it can and silently emits a smaller runtime props object, and fervid emits NO props object at all while reporting a resolve diagnostic this harness otherwise tolerates. This is GATED for every compiler alike, not just disclosed: a baseline-anchored PROP-RESOLUTION CENSUS samples the corpus's type-only defineProps files, compares each compiler's emitted prop keys (Vize, fervid, Verter) with the prop names the baseline resolves, and unranks on any drop — fervid's missing props count as dropped when its own resolve diagnostic attributes them. Annotates instead when a compiler's emission shape cannot be read. Re-run every benchmark; self-clearing on a fixed release.",
      "VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).",
      `Source map is an INDEPENDENT dimension, requested from every compiler in a cell (Vue and Vize single-file: sourceMap; Vize batch: includeSourceMap; Verter: compileProfile.sourceMap/processStyle sourcemap; fervid: FervidJsCompilerOptions.sourceMap). Raw render requires a JS map. Style-inclusive rows emit two artifacts and therefore require both JS and CSS maps. Timed paths assert returned bytes whenever the installed capability exists. Current executable presence probe: Vize single JS=${compileCapabilities.vize.singleSourceMap.ok ? "YES" : "NO"}/CSS=${compileCapabilities.vize.singleStyleSourceMap.ok ? "YES" : "NO"}, Vize batch JS=${compileCapabilities.vize.batchSourceMap.ok ? "YES" : "NO"}/CSS=${compileCapabilities.vize.batchStyleSourceMap.ok ? "YES" : "NO"}, Verter runtime-render JS=${compileCapabilities.verter.runtimeSourceMap.ok ? "YES" : "NO"}/processStyle CSS=${compileCapabilities.verter.styleSourceMap.ok ? "YES" : "NO"}, fervid JS=${compileCapabilities.fervid.sourceMap.ok ? "YES" : "NO"}/CSS=${compileCapabilities.fervid.styleSourceMap.ok ? "YES" : "NO"}. Presence is not mapping correctness: all map-on timings remain UNRANKED until planted script/template/CSS positions are traced back to the correct input coordinates.`,
      "TypeScript handling is ONE benchmark standard for the whole cell: PASSTHROUGH, requested identically from every compiler (Vue and fervid preserve annotations by their API behaviour; Vize via isTs:true; Verter via forceJs:false). The report describes the exact benchmark call rather than inferring behaviour from a separate Vite integration.",
      `Verter analysisLevel=${VERTER_ANALYSIS_LEVEL} for every timed and validation call. The default benchmark setting is full; VERTER_ANALYSIS_LEVEL remains an explicit diagnostic override, and every Verter row prints the effective value so a tuned run cannot masquerade as the default. devMode follows the cell's isProduction value.`,
      "Production vs development uses each tool's real semantic knobs: Vue isProd (hoistStatic + cacheHandlers); Vize templateHoistStatic + templateCacheHandlers; Verter isProduction + hmrStrategy; fervid isProduction.",
      `VIZE MODE CAPABILITY AUDIT (untimed): VDOM compileSfc=${compileCapabilities.vize.singleProductionOptions.ok ? "YES" : "NO"}, VDOM compileSfcBatchWithResults=${compileCapabilities.vize.batchProductionOptions.ok ? "YES" : "NO"}; Vapor compileSfc output changes=${compileCapabilities.vize.singleVaporProductionResponse.changesOutput ? "YES" : "NO"}, Vapor batch output changes=${compileCapabilities.vize.batchVaporProductionResponse.changesOutput ? "YES" : "NO"}. "NO" for the Vapor observation is not itself a failure: the current Vapor backend does not use these VDOM transforms. A VDOM row whose options stop affecting output is automatically unranked.`,
      `VERTER API CAPABILITY AUDIT (untimed): runtime-render emits compiled CSS=${compileCapabilities.verter.runtimeEmitsCss.ok ? "YES" : "NO"}. The style adapter composes runtime-render + processStyle only while runtime-render returns no CSS; if an upgrade starts emitting CSS, that row is automatically unranked pending adapter revalidation so CSS cannot be charged twice.`,
      "fervid and Vize's full-SFC APIs, Vue's composed compiler-sfc reference, and Verter's composed render+processStyle path are classified in the style-inclusive class because each timed row emits both JS and CSS. API composition and scheduling differences remain explicit row properties.",
      "fervid may emit the non-fatal HTML-strictness diagnostic NonVoidHtmlElementStartTagWithTrailingSolidus on self-closing non-void tags accepted by Vue. Only that complete diagnostic code is tolerated, and only with generated output; every other fervid diagnostic fails the timed row. The exact tolerated count is captured from each run.",
      "fervid and Vue 3.5 have no Vapor path → skipped for vapor cells (not run as VDOM).",
      `fervid's compileAsync row fans out over libuv's threadpool (UV_THREADPOOL_SIZE=${UV_POOL}), which is a fixed default of 4 rather than core count. It is reported, not tuned.`,
      "Threading remains a row property inside a work-equivalence class. It never changes the reference: Vue stays the denominator even where a native batch is faster.",
      "Codegen validity gate: every compiler's output is parsed (TypeScript plugin enabled, since several rows legitimately emit TS) before any timing. A tool that emits unparseable output for part of the corpus is measured but UNRANKED — bytes-per-millisecond is not a result if the bytes do not parse. Applied to every compiler in the table, re-run each benchmark, and self-clearing on a fixed release.",
      "The gate runs ONCE PER (target × environment) cell, with that cell's flags. It previously ran once on vdom/production and stamped the verdict onto the Vapor and development cells it had never exercised — Vapor is a different codegen backend and development mode emits different code, so a pass on one is not evidence about the other. Source maps are not a gate dimension: a map is emitted beside the code and cannot change whether the code parses.",
      "The gate builds each tool's compiler handle inside its own try, so a constructor that throws cannot destroy every row for the corpus. Missing or unmeasured mandatory validity is UNKNOWN and unranked.",
      "@vue/compiler-sfc, Vize and Verter are held to ONE error policy in the timed path: any non-empty top-level or per-file `errors` array fails the measure. fervid's sole exception is the exact NonVoidHtmlElementStartTagWithTrailingSolidus diagnostic code when code was still generated; all other diagnostics fail.",
      "Tool order uses a paired forward/reverse schedule for fresh-child samples, discarded warmups and measured warm runs. A complete pair balances row positions even when the requested run count is smaller than the number of rows; the executed order is retained in JSON.",
      "FRESH CHILD is the median first timed row workload across new child processes, one child per row and sample. Among benchmarked compiler packages, each child loads only the selected row's; shared harness dependencies are still imported. Child startup, package import, shared-input materialisation and Verter host/workspace construction are outside the timer. Imports and setup may already change V8/native/thread/allocator state; the OS page/filesystem caches are not flushed. It is therefore not a Cold metric and Fresh-child minus Warm must not be interpreted as pure initialization overhead. WARM is the primary ranking: the median shared-benchmark-process series after >= 1 discarded pass. Both series have independent distribution/noise statistics and separate Vue ratios.",
    ],
    groups,
    variants: allVariants,
  };
}
