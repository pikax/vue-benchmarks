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
import { measureVariantsAlternating, timedSync } from "../timing.mjs";

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
      notes:
        "Rust/Oxc transform; default vapor mode (see vuejs/vue-jsx-vapor). Same unique .jsx corpus as other JSX rows.",
      measure: () =>
        timedSync(() => {
          for (const f of sources) {
            const result = transform(f.source);
            if (result?.errors?.length) {
              throw new Error(result.errors.join("; "));
            }
            if (!result?.code && typeof result !== "string") {
              throw new Error(`empty code for ${f.filename}`);
            }
          }
        }),
    });
    variants.push({
      id: "vue-jsx-vapor-rs-vdom",
      label: "@vue-jsx-vapor/compiler-rs (interop VDOM)",
      package: "@vue-jsx-vapor/compiler-rs",
      target: "vdom",
      threading: "1t",
      notes: "Rust/Oxc transform with interop: true (VDOM createElementBlock path).",
      measure: () =>
        timedSync(() => {
          for (const f of sources) {
            const result = transform(f.source, { interop: true });
            if (result?.errors?.length) {
              throw new Error(result.errors.join("; "));
            }
            if (!result?.code && typeof result !== "string") {
              throw new Error(`empty code for ${f.filename}`);
            }
          }
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
      notes: "transformVueJsxVapor() public API (vapor default).",
      measure: () =>
        timedSync(() => {
          for (const f of sources) {
            const result = transformVueJsxVapor(f.source);
            if (!result?.code) throw new Error(`empty code for ${f.filename}`);
          }
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
      notes: "Official Babel Vue JSX plugin (createVNode). Reference VDOM JSX path; not Vapor.",
      measure: () =>
        timedSync(() => {
          for (const f of sources) {
            const result = transformSync(f.source, {
              plugins: [plugin],
              filename: f.filename,
              sourceMaps: false,
              babelrc: false,
              configFile: false,
            });
            if (!result?.code) throw new Error(`empty code for ${f.filename}`);
          }
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

  const results = await measureVariantsAlternating(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });

  return {
    id: "jsx-compile",
    label: "JSX compile",
    files: files.length,
    bytes,
    fixtureDir: jsxDir,
    methodology: [
      "Surface is JSX/TSX transform throughput — independent of SFC (.vue) compile.",
      "Corpus: fixtures/jsx-N unique .jsx files (generate.mjs --with-jsx).",
      "vue-jsx-vapor: https://github.com/vuejs/vue-jsx-vapor — Vapor Mode of Vue JSX (Oxc/Rust compiler-rs).",
      "compiler-rs vapor vs interop:true (VDOM) are different codegen targets.",
      "@vue/babel-plugin-jsx is the classic Babel VDOM JSX path (comparison baseline).",
      "Do not compare JSX ms to SFC compile ms; different language and pipeline.",
      "Measured runs alternate tool order each iteration.",
    ],
    variants: results,
  };
}
