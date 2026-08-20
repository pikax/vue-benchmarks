/**
 * JSX/TSX compile surface — separate from SFC (.vue) compile.
 *
 * Tools:
 *   - @vue-jsx-vapor/compiler-rs  (Rust/Oxc) vapor + VDOM interop modes
 *   - vue-jsx-vapor/api            transformVueJsxVapor (wrapper)
 *   - @vue/babel-plugin-jsx        classic Vue JSX → VDOM (Babel)
 *
 * Inputs are unique .jsx fixtures (fixtures/jsx-N), not SFCs.
 * Rank only within this surface; do not compare to SFC compile ms.
 */

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { basename } from "node:path";
import { collectJsxFiles, readSources, totalBytes } from "../fixtures.mjs";
import { measureVariants, timedSync } from "../timing.mjs";
import { applyJsxValidityGates, runJsxValidityChildren } from "../jsx-validity-gates.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function loadOptional(name) {
  try {
    return { mod: require(require.resolve(name, { paths: [rootDir] })) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function generatedCode(result) {
  return typeof result === "string" ? result : typeof result?.code === "string" ? result.code : "";
}

function codeBytes(code) {
  return Buffer.byteLength(code, "utf8");
}

/**
 * Map SFC fixture path fixtures/200 → fixtures/jsx-200 when present.
 */
export function resolveJsxFixtureDir(sfcFixtureDir) {
  if (!sfcFixtureDir) return null;
  if (existsSync(sfcFixtureDir) && collectJsxFiles(sfcFixtureDir).length) {
    return sfcFixtureDir;
  }
  const leaf = basename(sfcFixtureDir);
  const parent = dirname(sfcFixtureDir);
  const m = leaf.match(/^(\d+)(?:-vapor|-repeated)?$/);
  if (m) {
    const alt = join(parent, `jsx-${m[1]}`);
    if (existsSync(alt)) return alt;
  }
  return null;
}

export async function runJsxCompileSurface(fixtureDir, options) {
  const jsxDir = resolveJsxFixtureDir(fixtureDir) || fixtureDir;
  const files = collectJsxFiles(jsxDir, options.fileLimit);
  if (files.length === 0) {
    return {
      id: "jsx-compile",
      label: "JSX compile",
      files: 0,
      bytes: 0,
      methodology: ["No .jsx/.tsx fixtures found. Run `pnpm generate` (emits fixtures/jsx-N)."],
      variants: [
        {
          id: "jsx-fixtures-missing",
          label: "JSX fixtures",
          package: "n/a",
          status: "skipped",
          notes: `No JSX files under ${jsxDir}`,
          files: 0,
          throughput: "n/a",
        },
      ],
    };
  }

  const sources = readSources(jsxDir, files);
  const bytes = totalBytes(jsxDir, files);
  const variants = [];

  const compilerRs = loadOptional("@vue-jsx-vapor/compiler-rs");
  if (!compilerRs.error && typeof compilerRs.mod.transform === "function") {
    const transform = compilerRs.mod.transform;
    variants.push({
      id: "vue-jsx-vapor-rs-vapor",
      label: "@vue-jsx-vapor/compiler-rs (vapor)",
      package: "@vue-jsx-vapor/compiler-rs",
      target: "vapor",
      threading: "1t",
      comparisonClass: "jsx-vapor",
      comparisonClassLabel: "Vue JSX Vapor transform",
      baseline: true,
      baselineLabel: "Vue JSX Vapor compiler-rs",
      artifactLabel: "Code bytes",
      artifactPolarity: "informational",
      notes:
        "Rust/Oxc transform; default vapor mode (see vuejs/vue-jsx-vapor). Same unique .jsx corpus as other JSX rows.",
      measure: () =>
        timedSync(() => {
          let artifact = 0;
          for (const f of sources) {
            const result = transform(f.source);
            if (result?.errors?.length) {
              throw new Error(result.errors.join("; "));
            }
            const code = generatedCode(result);
            if (!code) throw new Error(`empty code for ${f.filename}`);
            artifact += codeBytes(code);
          }
          return { artifact };
        }),
    });
    variants.push({
      id: "vue-jsx-vapor-rs-vdom",
      label: "@vue-jsx-vapor/compiler-rs (interop VDOM)",
      package: "@vue-jsx-vapor/compiler-rs",
      target: "vdom",
      threading: "1t",
      comparisonClass: "jsx-vdom",
      comparisonClassLabel: "Vue JSX VDOM transform",
      artifactLabel: "Code bytes",
      artifactPolarity: "informational",
      notes: "Rust/Oxc transform with interop: true (VDOM createElementBlock path).",
      measure: () =>
        timedSync(() => {
          let artifact = 0;
          for (const f of sources) {
            const result = transform(f.source, { interop: true });
            if (result?.errors?.length) {
              throw new Error(result.errors.join("; "));
            }
            const code = generatedCode(result);
            if (!code) throw new Error(`empty code for ${f.filename}`);
            artifact += codeBytes(code);
          }
          return { artifact };
        }),
    });
  } else {
    variants.push({
      id: "vue-jsx-vapor-rs",
      label: "@vue-jsx-vapor/compiler-rs",
      package: "@vue-jsx-vapor/compiler-rs",
      notes: `Unavailable: ${compilerRs.error || "no transform()"}`,
      skip: true,
    });
  }

  // High-level API (defaults to vapor)
  try {
    const { transformVueJsxVapor } = await import("vue-jsx-vapor/api");
    variants.push({
      id: "vue-jsx-vapor-api",
      label: "vue-jsx-vapor/api",
      package: "vue-jsx-vapor",
      target: "vapor",
      threading: "1t",
      comparisonClass: "jsx-vapor",
      comparisonClassLabel: "Vue JSX Vapor transform",
      artifactLabel: "Code bytes",
      artifactPolarity: "informational",
      notes: "transformVueJsxVapor() public API (vapor default).",
      measure: () =>
        timedSync(() => {
          let artifact = 0;
          for (const f of sources) {
            const result = transformVueJsxVapor(f.source);
            const code = generatedCode(result);
            if (!code) throw new Error(`empty code for ${f.filename}`);
            artifact += codeBytes(code);
          }
          return { artifact };
        }),
    });
  } catch (error) {
    variants.push({
      id: "vue-jsx-vapor-api",
      label: "vue-jsx-vapor/api",
      package: "vue-jsx-vapor",
      notes: `Unavailable: ${error instanceof Error ? error.message : String(error)}`,
      skip: true,
    });
  }

  // Classic Vue JSX via Babel (VDOM)
  const babelCore = loadOptional("@babel/core");
  const babelVueJsx = loadOptional("@vue/babel-plugin-jsx");
  if (!babelCore.error && !babelVueJsx.error) {
    const { transformSync } = babelCore.mod;
    const plugin = babelVueJsx.mod.default ?? babelVueJsx.mod;
    variants.push({
      id: "vue-babel-plugin-jsx",
      label: "@vue/babel-plugin-jsx (Babel VDOM)",
      package: "@vue/babel-plugin-jsx",
      target: "vdom",
      threading: "1t",
      comparisonClass: "jsx-vdom",
      comparisonClassLabel: "Vue JSX VDOM transform",
      baseline: true,
      baselineLabel: "Vue Babel JSX",
      artifactLabel: "Code bytes",
      artifactPolarity: "informational",
      notes: "Official Babel Vue JSX plugin (createVNode). Reference VDOM JSX path; not Vapor.",
      measure: () =>
        timedSync(() => {
          let artifact = 0;
          for (const f of sources) {
            const result = transformSync(f.source, {
              plugins: [plugin],
              filename: f.filename,
              sourceMaps: false,
              babelrc: false,
              configFile: false,
            });
            const code = generatedCode(result);
            if (!code) throw new Error(`empty code for ${f.filename}`);
            artifact += codeBytes(code);
          }
          return { artifact };
        }),
    });
  } else {
    variants.push({
      id: "vue-babel-plugin-jsx",
      label: "@vue/babel-plugin-jsx",
      package: "@vue/babel-plugin-jsx",
      notes: `Unavailable: babel=${babelCore.error ?? "ok"} plugin=${babelVueJsx.error ?? "ok"}`,
      skip: true,
    });
  }

  const results = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });

  // The plants run after every timed pass and in isolated processes. Loading
  // jsdom, Vue runtimes or compiler helpers for certification cannot warm the
  // benchmark process. Vapor remains explicitly UNKNOWN until its exact
  // generated output can be mounted against a compatible shipped runtime.
  const jsxSemantics = runJsxValidityChildren();
  applyJsxValidityGates(results, jsxSemantics);

  return {
    id: "jsx-compile",
    label: "JSX compile",
    files: files.length,
    bytes,
    fixtureDir: jsxDir,
    validation: { jsxSemantics },
    methodology: [
      "Surface is JSX/TSX transform throughput — independent of SFC (.vue) compile.",
      "Corpus: fixtures/jsx-N unique .jsx files (generate.mjs --with-jsx).",
      "vue-jsx-vapor: https://github.com/vuejs/vue-jsx-vapor — Vapor Mode of Vue JSX (Oxc/Rust compiler-rs).",
      "compiler-rs vapor vs interop:true (VDOM) are different codegen targets.",
      "VDOM and Vapor are separate comparison classes. @vue/babel-plugin-jsx is the Vue VDOM baseline; compiler-rs is the lower-level Vue Vapor baseline for the Vapor API wrapper.",
      `Each measured row reports generated code bytes. Empty string output is rejected for object and string native return shapes; byte counts are informational and never a correctness threshold.`,
      `POST-TIMING SEMANTIC GATE: suite ${jsxSemantics.suiteVersion} (${jsxSemantics.plantCount} plants) executes the Babel VDOM and compiler-rs interop VDOM outputs against Vue using each row's exact transform call. It observes DOM, props, updates, keyed lists, fragments, spreads, component props and events; generated text is never compared. compiler-rs's emitted virtual VDOM id is resolved to @vue-jsx-vapor/runtime's shipped VDOM helper. Each entrypoint runs in an isolated child after timing. FAIL, crash, missing verdict and UNKNOWN are measured but UNRANKED, and a failed Vue baseline invalidates its comparison class.`,
      "Vapor compiler-rs and vue-jsx-vapor/api timings are currently UNKNOWN/unranked: the benchmark's Vue 3.5 runtime cannot execute their Vue 3.6 Vapor output, and neither VDOM behaviour nor generated-code regexes are borrowed as correctness evidence.",
      "Do not compare JSX ms to SFC compile ms; different language and pipeline.",
      "Tool order is ROTATED on every warmup and measured run (not merely alternated), so no tool keeps a fixed position in the sequence.",
    ],
    variants: results,
  };
}
