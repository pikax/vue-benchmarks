/** Process-isolated exact-entrypoint JSX runtime-semantic validator. */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ensureDom } from "../../tests/confirm/lib/dom.mjs";
import { loadCompiledComponent } from "../../tests/confirm/lib/compile-to-component.mjs";
import {
  JSX_VALIDITY_PLANTS,
  JSX_VALIDITY_SUITE_HASH,
  JSX_VALIDITY_SUITE_VERSION,
  unknownJsxValidityResults,
} from "./jsx-validity-plants.mjs";

export const JSX_VALIDITY_JSON_PREFIX = "@@JSX_VALIDITY_JSON@@";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

const ENTRYPOINTS = Object.freeze({
  "compiler-rs-vdom": {
    label: "@vue-jsx-vapor/compiler-rs (interop VDOM)",
    exactPath: "transform(source, { interop: true })",
  },
  "babel-vdom": {
    label: "@vue/babel-plugin-jsx (Babel VDOM)",
    exactPath:
      "@babel/core transformSync(source, { plugins: [@vue/babel-plugin-jsx], sourceMaps:false, babelrc:false, configFile:false })",
  },
  "compiler-rs-vapor": {
    label: "@vue-jsx-vapor/compiler-rs (vapor)",
    exactPath: "transform(source)",
  },
  "vue-jsx-vapor-api": {
    label: "vue-jsx-vapor/api",
    exactPath: "transformVueJsxVapor(source)",
  },
});

function textError(error) {
  return error instanceof Error ? error.message : String(error);
}

function loadOptional(name) {
  try {
    return { mod: require(require.resolve(name, { paths: [rootDir] })) };
  } catch (error) {
    return { error: textError(error) };
  }
}

function outputCode(result) {
  return typeof result === "string" ? result : typeof result?.code === "string" ? result.code : "";
}

function compilerErrors(result) {
  return (result?.errors ?? []).map((error) =>
    typeof error === "string" ? error : (error?.message ?? JSON.stringify(error)),
  );
}

function transformCompilerRs(source) {
  const loaded = loadOptional("@vue-jsx-vapor/compiler-rs");
  if (loaded.error) throw new Error(loaded.error);
  if (typeof loaded.mod.transform !== "function") throw new Error("transform missing");
  const result = loaded.mod.transform(source, { interop: true });
  const errors = compilerErrors(result);
  if (errors.length) throw new Error(errors.join("; "));
  const code = outputCode(result);
  if (!code) throw new Error("transform returned empty code");

  // compiler-rs intentionally emits the bundler virtual id. Resolve that id
  // to the package's own shipped VDOM helper for this isolated Node oracle.
  const apiEntry = require.resolve("vue-jsx-vapor/api", { paths: [rootDir] });
  const runtimePath = require.resolve("@vue-jsx-vapor/runtime/dist/vdom.js", {
    paths: [dirname(apiEntry)],
  });
  const runtimeUrl = pathToFileURL(runtimePath).href;
  const executable = code.replaceAll('"/vue-jsx-vapor/vdom"', JSON.stringify(runtimeUrl));
  if (/from\s+["']\/vue-jsx-vapor\//.test(executable)) {
    throw new Error("generated output contains an unresolved vue-jsx-vapor virtual runtime id");
  }
  return executable;
}

function transformBabel(source) {
  const babel = loadOptional("@babel/core");
  if (babel.error) throw new Error(babel.error);
  const pluginLoaded = loadOptional("@vue/babel-plugin-jsx");
  if (pluginLoaded.error) throw new Error(pluginLoaded.error);
  const plugin = pluginLoaded.mod.default ?? pluginLoaded.mod;
  const result = babel.mod.transformSync(source, {
    plugins: [plugin],
    filename: "Plant.jsx",
    sourceMaps: false,
    babelrc: false,
    configFile: false,
  });
  const code = outputCode(result);
  if (!code) throw new Error("transformSync returned empty code");
  return code;
}

function aggregate(entrypoint, results, reason = null) {
  const passed = results.filter((result) => result.status === "PASS").length;
  const failed = results.filter((result) => result.status === "FAIL").length;
  const unknown = results.filter((result) => result.status === "UNKNOWN").length;
  return {
    schemaVersion: 1,
    suiteVersion: JSX_VALIDITY_SUITE_VERSION,
    suiteHash: JSX_VALIDITY_SUITE_HASH,
    entrypoint,
    label: ENTRYPOINTS[entrypoint]?.label ?? entrypoint,
    exactPath: ENTRYPOINTS[entrypoint]?.exactPath ?? "unknown",
    status: failed ? "FAIL" : unknown ? "UNKNOWN" : "PASS",
    reason,
    plantCount: results.length,
    passed,
    failed,
    unknown,
    results,
  };
}

async function execute(entrypoint) {
  if (!ENTRYPOINTS[entrypoint]) {
    const reason = `unknown entrypoint ${entrypoint}`;
    return aggregate(entrypoint, unknownJsxValidityResults(reason), reason);
  }
  if (entrypoint === "compiler-rs-vapor" || entrypoint === "vue-jsx-vapor-api") {
    const reason =
      "Exact Vapor runtime mounting is not available with the benchmark's Vue 3.5 runtime; VDOM evidence and code-shape regexes are not borrowed";
    return aggregate(entrypoint, unknownJsxValidityResults(reason), reason);
  }

  const transform = entrypoint === "compiler-rs-vdom" ? transformCompilerRs : transformBabel;
  ensureDom();
  const { mount } = await import("@vue/test-utils");
  const results = [];
  for (const plant of JSX_VALIDITY_PLANTS) {
    let code;
    try {
      code = transform(plant.source);
    } catch (error) {
      results.push({
        id: plant.id,
        coverage: plant.coverage,
        status: "FAIL",
        phase: "transform",
        detail: textError(error),
      });
      continue;
    }

    let loaded;
    try {
      loaded = await loadCompiledComponent(code, `${entrypoint}-${plant.id}`);
    } catch (error) {
      results.push({
        id: plant.id,
        coverage: plant.coverage,
        status: "FAIL",
        phase: "module-load",
        detail: textError(error),
      });
      continue;
    }

    try {
      await plant.assert({ mount, component: loaded.component });
      results.push({
        id: plant.id,
        coverage: plant.coverage,
        status: "PASS",
        phase: "runtime",
      });
    } catch (error) {
      results.push({
        id: plant.id,
        coverage: plant.coverage,
        status: "FAIL",
        phase: "runtime",
        detail: textError(error),
      });
    } finally {
      loaded.cleanup();
    }
  }
  return aggregate(entrypoint, results);
}

export async function runJsxValidityChild({ entrypoint }) {
  return execute(entrypoint);
}

async function main() {
  const index = process.argv.indexOf("--entrypoint");
  const entrypoint = index >= 0 ? (process.argv[index + 1] ?? "") : "";
  try {
    console.log(`${JSX_VALIDITY_JSON_PREFIX}${JSON.stringify(await execute(entrypoint))}`);
  } catch (error) {
    const detail = `validity child crashed: ${textError(error)}`;
    const results = JSX_VALIDITY_PLANTS.map((plant) => ({
      id: plant.id,
      coverage: plant.coverage,
      status: "FAIL",
      phase: "child",
      detail,
    }));
    console.log(
      `${JSX_VALIDITY_JSON_PREFIX}${JSON.stringify(aggregate(entrypoint, results, detail))}`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
