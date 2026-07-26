import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { collectVueFiles, readSources, totalBytes } from "../fixtures.mjs";
import { measureVariantsAlternating, timedSync } from "../timing.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * Compile matrix dimensions (orthogonal, reported separately):
 *   target:  "vdom" | "vapor"
 *   env:     "production" | "development"
 *
 * Same in-memory SFC corpus for every cell. Vapor is a different
 * codegen path — not mixed into VDOM rows. Prod/dev toggles match each
 * tool's real flags (isProd / isProduction / sourceMap / HMR).
 */

/**
 * Official @vue/compiler-sfc: parse + script + template.
 * Returns a rough work score so empty/no-op compiles fail the measure.
 */
function vueCompileSfc(compiler, source, filename, { vapor, isProd }) {
  const { descriptor } = compiler.parse(source, { filename });
  let bindings = {};
  let work = 1; // parse
  const scriptOpts = {
    id: filename,
    inlineTemplate: false,
    isProd,
  };
  if (vapor) {
    scriptOpts.vapor = true;
    scriptOpts.templateOptions = { vapor: true, isProd };
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

function cellId(target, env) {
  return `${target}-${env === "production" ? "prod" : "dev"}`;
}

function cellLabel(target, env) {
  return `${target.toUpperCase()} · ${env}`;
}

/**
 * Build variants for one matrix cell (target × env).
 */
function buildCellVariants({
  target,
  env,
  sources,
  compiler35,
  compiler36,
  vizeNative,
  verterNative,
  hosts,
}) {
  const vapor = target === "vapor";
  const isProd = env === "production";
  const variants = [];
  const cell = cellId(target, env);

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
      threading: "1t",
      notes: `Official 3.5 VDOM, isProd=${isProd}, single-threaded`,
      measure: async () => {
        const { ms } = timedSync(() => {
          let work = 0;
          for (const f of sources) {
            work += vueCompileSfc(compiler35, f.source, f.filename, {
              vapor: false,
              isProd,
            });
          }
          if (work < sources.length) {
            throw new Error("vue 3.5 compile produced insufficient work units");
          }
        });
        return ms;
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
      threading: "1t",
      notes: vapor
        ? `Official 3.6 Vapor (compileScript vapor + compileTemplate vapor=true), isProd=${isProd}`
        : `Official 3.6 VDOM, isProd=${isProd}`,
      measure: async () => {
        const { ms } = timedSync(() => {
          let work = 0;
          for (const f of sources) {
            work += vueCompileSfc(compiler36, f.source, f.filename, {
              vapor,
              isProd,
            });
          }
          if (work < sources.length) {
            throw new Error("vue 3.6 compile produced insufficient work units");
          }
        });
        return ms;
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
    // Vize has no separate isProduction on compileSfc; map env:
    // production → sourceMap off; development → sourceMap on (dev tooling cost).
    const vizeOpts = {
      vapor,
      sourceMap: !isProd,
      isTs: true,
    };
    variants.push({
      id: `vize-1t-${cell}`,
      label: `Vize native loop (1T)`,
      package: "@vizejs/native",
      target,
      env,
      threading: "1t",
      notes: `compileSfc vapor=${vapor}, sourceMap=${!isProd} (Vize has no isProduction flag on compileSfc; sourceMap is the documented dev/prod toggle). Content-hash caches reward duplicate bodies — use unique fixtures for ranking.`,
      measure: async () => {
        const { ms } = timedSync(() => {
          let codeBytes = 0;
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
        return ms;
      },
    });

    if (typeof vizeNative.compileSfcBatchWithResults === "function") {
      variants.push({
        id: `vize-batch-${cell}`,
        label: `Vize native batch (max threads)`,
        package: "@vizejs/native",
        target,
        env,
        threading: "batch",
        notes: `compileSfcBatchWithResults vapor=${vapor}, multi-thread Rayon batch. Content-hash caches can skip work on repeated bodies — unique corpus required for ranking.`,
        measure: async () => {
          const { ms } = timedSync(() => {
            const result = vizeNative.compileSfcBatchWithResults(
              sources.map((f) => ({ path: f.filename, source: f.source })),
              { vapor, isTs: true },
            );
            if (result.failedCount) {
              throw new Error(`vize batch failed: ${result.failedCount} files`);
            }
            const rows = result.results ?? result.items ?? [];
            if (Array.isArray(rows) && rows.length) {
              const codeBytes = rows.reduce(
                (n, r) => n + (r?.code?.length ?? r?.result?.code?.length ?? 0),
                0,
              );
              if (codeBytes < sources.length) {
                throw new Error("vize batch returned empty code for corpus");
              }
            }
          });
          return ms;
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

  // --- Verter ---
  if (!verterNative.error && typeof verterNative.VerterHost === "function") {
    const VerterHost = verterNative.VerterHost;
    const renderProfile = {
      isProduction: isProd,
      customElement: false,
      ssr: false,
      forceJs: true,
      forceVapor: vapor,
      sourceMap: !isProd,
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
      threading: "batch",
      notes: `runtime-render forceVapor=${vapor}, isProduction=${isProd}, sourceMap=${!isProd}, hmr=${renderProfile.hmrStrategy}, mode=stateless, multi-thread host pool`,
      measure: async () => {
        const host = new VerterHost({ devMode: !isProd });
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
      threading: "batch",
      notes: `runtime-render forceVapor=${vapor}, isProduction=${isProd}, mode=session — cacheHits reported in results (warm may hit cache)`,
      measure: async () => {
        const key = `session-${cell}`;
        if (!hosts[key]) {
          hosts[key] = new VerterHost({ devMode: !isProd });
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
  const hosts = {};

  const matrix = [
    { target: "vdom", env: "production" },
    { target: "vdom", env: "development" },
    { target: "vapor", env: "production" },
    { target: "vapor", env: "development" },
  ];

  // Allow filtering: --compile-targets vdom,vapor  --compile-envs production,development
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

  const groups = [];
  const allVariants = [];

  for (const { target, env } of matrix) {
    if (!wantTargets.has(target) || !wantEnvs.has(env)) continue;

    const cellVariants = buildCellVariants({
      target,
      env,
      sources,
      compiler35,
      compiler36,
      vizeNative,
      verterNative,
      hosts,
    });
    const measured = await measureVariantsAlternating(cellVariants, {
      runs: options.runs,
      warmups: options.warmups,
      fileCount,
    });
    allVariants.push(...measured);
    groups.push({
      id: cellId(target, env),
      label: cellLabel(target, env),
      target,
      env,
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
    methodology: [
      "Matrix: target ∈ {vdom, vapor} × env ∈ {production, development}. Cells are independent — do not cross-compare VDOM vs Vapor or prod vs dev as the same job.",
      `Corpus mode=${corpusMode}: ${uniqueness.uniqueBodies}/${uniqueness.files} unique content SHAs. Vize content-hash caches treat identical bodies as free — primary rankings must use unique fixtures (fixtures/N), not fixtures/N-repeated.`,
      "Same in-memory Vue SFC corpus for every variant (compiler flags differ; sources do not).",
      "Work measured: parse SFC + compile script (if any) + compile template (if any).",
      "VDOM = classic Virtual DOM render functions. Vapor = direct DOM codegen (Vue 3.6+ / native tool vapor flags).",
      "Production vs development uses each tool's real knobs: Vue isProd; Verter isProduction + sourceMap + hmrStrategy; Vize sourceMap (no isProduction on compileSfc — documented).",
      "Vue 3.5 has no Vapor path → skipped for vapor cells (not run as VDOM).",
      "1T vs batch/max are ranked in separate tables (not mixed).",
      "Measured runs alternate variant order each iteration (order bias reduction).",
      "Verter session/stateless rows may include cacheHitsMedian when the host reports cacheHit.",
      "Cold = first measured run after warmups; warm = median of remaining measured runs.",
    ],
    groups,
    variants: allVariants,
  };
}
