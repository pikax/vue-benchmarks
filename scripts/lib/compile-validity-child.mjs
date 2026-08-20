#!/usr/bin/env node
/**
 * Process-isolated semantic validity probe for one exact compile entry point.
 *
 * stdout may contain native/compiler noise, so the machine-readable payload is
 * emitted on one prefixed line. The parent runner launches one child per API:
 * a native abort cannot erase another tool's evidence or warm benchmark timing.
 */
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  assertOnlyAllowedFervidDiagnostics,
  fervidDiagnosticMessage,
} from "./fervid-diagnostics.mjs";
import {
  COMPILE_VALIDITY_PLANTS,
  COMPILE_VALIDITY_SUITE_HASH,
  COMPILE_VALIDITY_SUITE_VERSION,
  unknownCompileValidityResults,
} from "./compile-validity-plants.mjs";
import { ensureDom } from "../../tests/confirm/lib/dom.mjs";

export const COMPILE_VALIDITY_JSON_PREFIX = "@@COMPILE_VALIDITY_JSON@@";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

const ENTRYPOINTS = Object.freeze({
  "vue-3.5": {
    label: "@vue/compiler-sfc 3.5 composed parse + compileScript + compileTemplate",
    exactPath: "parse → compileScript(inlineTemplate=false) → compileTemplate",
  },
  "vue-3.6": {
    label: "@vue/compiler-sfc 3.6 composed parse + compileScript + compileTemplate",
    exactPath: "parse → compileScript(inlineTemplate=false) → compileTemplate",
  },
  "vize-single": {
    label: "Vize compileSfc loop",
    exactPath: "@vizejs/native compileSfc once per plant",
  },
  "vize-batch": {
    label: "Vize compileSfcBatchWithResults",
    exactPath: "one @vizejs/native compileSfcBatchWithResults call containing every plant",
  },
  "verter-compile-many": {
    label: "Verter first-admission stateless compileMany",
    exactPath: "one fresh workspace-backed VerterHost.compileMany call containing every plant",
  },
  "fervid-sync": {
    label: "fervid compileSync loop",
    exactPath: "one Compiler instance; compileSync once per plant",
  },
  "fervid-async": {
    label: "fervid compileAsync fan-out",
    exactPath: "one Compiler instance; all compileAsync calls started before awaiting",
  },
});

function textError(error) {
  return (error instanceof Error ? error.message : String(error))
    .replaceAll(/\s+/g, " ")
    .slice(0, 1200);
}

function diagnosticMessage(error) {
  return String(error?.message ?? error);
}

function loadOptional(name) {
  try {
    return { mod: require(require.resolve(name, { paths: [rootDir] })) };
  } catch (error) {
    return { error: textError(error) };
  }
}

function hashId(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}

function filenames() {
  const base = join(rootDir, "work", "compile-validity-sources");
  return COMPILE_VALIDITY_PLANTS.map((plant) =>
    join(base, `${plant.id}.vue`).replaceAll("\\", "/"),
  );
}

function compileFailure(error, metadata = {}) {
  return { error: textError(error), ...metadata };
}

function assertCompilerErrors(errors, context) {
  if (errors?.length) {
    throw new Error(`${context}: ${errors.map(diagnosticMessage).join("; ")}`);
  }
}

function compileVue(entrypoint, isProduction, sourceMap, target) {
  const packageName = entrypoint === "vue-3.5" ? "@vue/compiler-sfc" : "@vue/compiler-sfc-36";
  const vapor = target === "vapor";
  if (vapor && entrypoint !== "vue-3.6") {
    return { unavailable: `${packageName} has no Vapor compiler backend` };
  }
  const loaded = loadOptional(packageName);
  if (loaded.error) return { unavailable: loaded.error };
  const compiler = loaded.mod;
  if (
    typeof compiler.parse !== "function" ||
    typeof compiler.compileScript !== "function" ||
    typeof compiler.compileTemplate !== "function" ||
    typeof compiler.rewriteDefault !== "function"
  ) {
    return { unavailable: `${packageName} composed compiler API is incomplete` };
  }

  const files = filenames();
  const compiled = COMPILE_VALIDITY_PLANTS.map((plant, index) => {
    const filename = files[index];
    try {
      const parsed = compiler.parse(plant.source, { filename, sourceMap });
      assertCompilerErrors(parsed.errors, `parse ${plant.id}`);
      const { descriptor } = parsed;
      let bindings = {};
      let rewrittenScript = `const __sfc__ = ${vapor ? "{ __vapor: true }" : "{}"}`;
      if (descriptor.script || descriptor.scriptSetup) {
        const scriptOptions = {
          id: filename,
          inlineTemplate: false,
          isProd: isProduction,
          sourceMap,
        };
        if (vapor) {
          scriptOptions.vapor = true;
          scriptOptions.templateOptions = { vapor: true, isProd: isProduction };
        }
        const script = compiler.compileScript(descriptor, scriptOptions);
        bindings = script.bindings || {};
        rewrittenScript = compiler.rewriteDefault(script.content, "__sfc__");
      }
      if (!descriptor.template) throw new Error("plant has no template block");
      const templateOptions = {
        source: descriptor.template.content,
        filename,
        id: filename,
        isProd: isProduction,
        compilerOptions: {
          bindingMetadata: bindings,
          mode: "module",
          hoistStatic: isProduction,
          cacheHandlers: isProduction,
          prefixIdentifiers: true,
          sourceMap,
        },
      };
      if (vapor) templateOptions.vapor = true;
      const template = compiler.compileTemplate(templateOptions);
      assertCompilerErrors(template.errors, `compileTemplate ${plant.id}`);
      return {
        code: `${rewrittenScript}\n${template.code}\n${vapor ? "__sfc__.__vapor = true\n" : ""}__sfc__.render = render\nexport default __sfc__\n`,
      };
    } catch (error) {
      return compileFailure(error);
    }
  });
  return {
    compiled,
    metadata: { callCount: COMPILE_VALIDITY_PLANTS.length, inputCount: compiled.length },
  };
}

function vizeErrors(result, context) {
  const errors = result?.errors ?? [];
  if (errors.length) throw new Error(`${context}: ${errors.map(diagnosticMessage).join("; ")}`);
}

function compileVizeSingle(isProduction, sourceMap, target) {
  const loaded = loadOptional("@vizejs/native");
  if (loaded.error) return { unavailable: loaded.error };
  if (typeof loaded.mod.compileSfc !== "function") return { unavailable: "compileSfc missing" };
  const files = filenames();
  const compiled = COMPILE_VALIDITY_PLANTS.map((plant, index) => {
    try {
      const result = loaded.mod.compileSfc(plant.source, {
        filename: files[index],
        vapor: target === "vapor",
        sourceMap,
        isTs: true,
        templateHoistStatic: isProduction,
        templateCacheHandlers: isProduction,
      });
      vizeErrors(result, `compileSfc ${plant.id}`);
      if (!result?.code) throw new Error("compileSfc returned empty code");
      return { code: result.code };
    } catch (error) {
      return compileFailure(error);
    }
  });
  return {
    compiled,
    metadata: { callCount: compiled.length, inputCount: compiled.length },
  };
}

function compileVizeBatch(isProduction, sourceMap, target) {
  const loaded = loadOptional("@vizejs/native");
  if (loaded.error) return { unavailable: loaded.error };
  if (typeof loaded.mod.compileSfcBatchWithResults !== "function") {
    return { unavailable: "compileSfcBatchWithResults missing" };
  }
  const files = filenames();
  try {
    const result = loaded.mod.compileSfcBatchWithResults(
      COMPILE_VALIDITY_PLANTS.map((plant, index) => ({
        path: files[index],
        source: plant.source,
      })),
      {
        vapor: target === "vapor",
        isTs: true,
        includeSourceMap: sourceMap,
        templateHoistStatic: isProduction,
        templateCacheHandlers: isProduction,
      },
    );
    vizeErrors(result, "compileSfcBatchWithResults top level");
    const rows = result?.results ?? result?.items ?? [];
    if (rows.length !== COMPILE_VALIDITY_PLANTS.length) {
      throw new Error(
        `compileSfcBatchWithResults returned ${rows.length}/${COMPILE_VALIDITY_PLANTS.length} rows`,
      );
    }
    for (let index = 0; index < rows.length; index++) {
      if (rows[index]?.path && rows[index].path !== files[index]) {
        throw new Error(
          `batch result ${index} path mismatch: expected ${files[index]}, got ${rows[index].path}`,
        );
      }
    }
    return {
      compiled: rows.map((row, index) => {
        try {
          const value = row?.result ?? row;
          vizeErrors(row, `batch result ${COMPILE_VALIDITY_PLANTS[index].id}`);
          vizeErrors(value, `batch nested result ${COMPILE_VALIDITY_PLANTS[index].id}`);
          if (!value?.code) throw new Error("batch result returned empty code");
          return { code: value.code };
        } catch (error) {
          return compileFailure(error);
        }
      }),
      metadata: {
        callCount: 1,
        inputCount: COMPILE_VALIDITY_PLANTS.length,
        outputCount: rows.length,
        outputPathsMatchedInputs: true,
      },
    };
  } catch (error) {
    return {
      compiled: COMPILE_VALIDITY_PLANTS.map(() =>
        compileFailure(`whole batch failed: ${textError(error)}`),
      ),
      metadata: { callCount: 1, inputCount: COMPILE_VALIDITY_PLANTS.length },
    };
  }
}

function makeVerterHost(native, isProduction) {
  const config = { devMode: !isProduction, analysisLevel: "full" };
  const workspaceRoot = rootDir.replaceAll("\\", "/");
  if (
    typeof native.Workspace === "function" &&
    typeof native.VerterHost?.withWorkspace === "function"
  ) {
    const workspace = new native.Workspace([workspaceRoot]);
    workspace.configureProjects([{ root: workspaceRoot, workspaceRoot }]);
    return native.VerterHost.withWorkspace(config, workspace);
  }
  return new native.VerterHost(config);
}

function compileVerter(isProduction, sourceMap, target) {
  const loaded = loadOptional("@verter/native");
  if (loaded.error) return { unavailable: loaded.error };
  if (typeof loaded.mod.VerterHost !== "function") return { unavailable: "VerterHost missing" };
  const files = filenames();
  let host;
  try {
    host = makeVerterHost(loaded.mod, isProduction);
    const rows = host.compileMany(
      COMPILE_VALIDITY_PLANTS.map((plant, index) => ({
        canonicalId: files[index],
        source: plant.source,
        requestedMode: "stateless",
      })),
      {
        target: "runtime-render",
        defaultMode: "stateless",
        priority: "interactive",
        compileProfile: {
          isProduction,
          customElement: false,
          ssr: false,
          forceJs: false,
          forceVapor: target === "vapor",
          sourceMap,
          hmrStrategy: isProduction ? "none" : "vite",
          runtimeModuleName: "vue",
        },
      },
    );
    if (!Array.isArray(rows) || rows.length !== COMPILE_VALIDITY_PLANTS.length) {
      throw new Error(
        `compileMany returned ${rows?.length ?? 0}/${COMPILE_VALIDITY_PLANTS.length} rows`,
      );
    }
    return {
      compiled: rows.map((row) => {
        try {
          assertCompilerErrors(row?.errors, "compileMany");
          if (row?.cacheHit)
            throw new Error("first-admission stateless result reported cacheHit=true");
          if (row?.actualMode !== "stateless") {
            throw new Error(`requested stateless but actualMode=${String(row?.actualMode)}`);
          }
          if (!row?.code) throw new Error("compileMany returned empty code");
          return {
            code: row.code,
            metadata: { cacheHit: Boolean(row.cacheHit), actualMode: row.actualMode },
          };
        } catch (error) {
          return compileFailure(error, {
            metadata: { cacheHit: Boolean(row?.cacheHit), actualMode: row?.actualMode ?? null },
          });
        }
      }),
      metadata: {
        callCount: 1,
        inputCount: COMPILE_VALIDITY_PLANTS.length,
        outputCount: rows.length,
        requestedMode: "stateless",
      },
    };
  } catch (error) {
    return {
      compiled: COMPILE_VALIDITY_PLANTS.map(() =>
        compileFailure(`whole compileMany call failed: ${textError(error)}`),
      ),
      metadata: { callCount: 1, inputCount: COMPILE_VALIDITY_PLANTS.length },
    };
  } finally {
    host?.close?.();
  }
}

function fervidResult(result, id) {
  assertOnlyAllowedFervidDiagnostics(result, `fervid ${id}`);
  if (!result?.code) throw new Error("fervid returned empty code");
  return {
    code: result.code,
    metadata: {
      allowedDiagnostics: (result.errors ?? []).map(fervidDiagnosticMessage),
    },
  };
}

function compileFervidSync(isProduction, sourceMap) {
  const loaded = loadOptional("@fervid/napi");
  if (loaded.error) return { unavailable: loaded.error };
  if (typeof loaded.mod.Compiler !== "function") return { unavailable: "Compiler missing" };
  const compiler = new loaded.mod.Compiler({ isProduction, sourceMap });
  const files = filenames();
  const compiled = COMPILE_VALIDITY_PLANTS.map((plant, index) => {
    try {
      return fervidResult(
        compiler.compileSync(plant.source, {
          id: hashId(files[index]),
          filename: files[index],
        }),
        plant.id,
      );
    } catch (error) {
      return compileFailure(error);
    }
  });
  return {
    compiled,
    metadata: { callCount: compiled.length, inputCount: compiled.length },
  };
}

async function compileFervidAsync(isProduction, sourceMap) {
  const loaded = loadOptional("@fervid/napi");
  if (loaded.error) return { unavailable: loaded.error };
  if (typeof loaded.mod.Compiler !== "function") return { unavailable: "Compiler missing" };
  const compiler = new loaded.mod.Compiler({ isProduction, sourceMap });
  const files = filenames();
  // Start the whole fan-out before awaiting, matching the timed Promise.all path.
  const settled = await Promise.allSettled(
    COMPILE_VALIDITY_PLANTS.map((plant, index) =>
      compiler.compileAsync(plant.source, {
        id: hashId(files[index]),
        filename: files[index],
      }),
    ),
  );
  return {
    compiled: settled.map((result, index) => {
      if (result.status === "rejected") return compileFailure(result.reason);
      try {
        return fervidResult(result.value, COMPILE_VALIDITY_PLANTS[index].id);
      } catch (error) {
        return compileFailure(error);
      }
    }),
    metadata: { callCount: settled.length, inputCount: settled.length, fanOut: true },
  };
}

async function compileEntrypoint(entrypoint, isProduction, sourceMap, target) {
  if (entrypoint === "vue-3.5" || entrypoint === "vue-3.6") {
    return compileVue(entrypoint, isProduction, sourceMap, target);
  }
  if (entrypoint === "vize-single") return compileVizeSingle(isProduction, sourceMap, target);
  if (entrypoint === "vize-batch") return compileVizeBatch(isProduction, sourceMap, target);
  if (entrypoint === "verter-compile-many") {
    return compileVerter(isProduction, sourceMap, target);
  }
  if (target === "vapor" && (entrypoint === "fervid-sync" || entrypoint === "fervid-async")) {
    return { unavailable: "fervid has no Vapor compiler backend" };
  }
  if (entrypoint === "fervid-sync") return compileFervidSync(isProduction, sourceMap);
  if (entrypoint === "fervid-async") return compileFervidAsync(isProduction, sourceMap);
  return { unavailable: `unknown entrypoint ${entrypoint}` };
}

function transpileForRuntime(code, filename) {
  const loaded = loadOptional("typescript");
  if (loaded.error) throw new Error(`TypeScript runtime loader unavailable: ${loaded.error}`);
  const ts = loaded.mod;
  const result = ts.transpileModule(code, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      verbatimModuleSyntax: true,
      sourceMap: false,
    },
  });
  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length) {
    throw new Error(
      `generated TypeScript is invalid: ${errors
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "))
        .join("; ")}`,
    );
  }
  return result.outputText;
}

/**
 * Resolve the runtime that was released with the Vapor compiler under test.
 *
 * Node's `vue-36` entry resolves to the package's CJS build, which intentionally
 * exposes only runtime-dom. Vapor output imports its helpers from `vue`, as a
 * bundler would resolve them from the ESM build. The self-contained browser ESM
 * artifact is therefore the exact executable package artifact for this isolated
 * DOM harness: it exports both runtime-dom and runtime-vapor without Node's
 * `node` export condition selecting the non-Vapor CJS file.
 */
function resolveVue36VaporRuntime() {
  try {
    const runtimePackageFile = require.resolve("vue-36/package.json", { paths: [rootDir] });
    const compilerPackageFile = require.resolve("@vue/compiler-sfc-36/package.json", {
      paths: [rootDir],
    });
    const runtimePackage = JSON.parse(readFileSync(runtimePackageFile, "utf8"));
    const compilerPackage = JSON.parse(readFileSync(compilerPackageFile, "utf8"));
    if (runtimePackage.version !== compilerPackage.version) {
      throw new Error(
        `Vue Vapor compiler/runtime version mismatch: compiler=${compilerPackage.version}, runtime=${runtimePackage.version}`,
      );
    }
    const artifact = "vue.runtime-with-vapor.esm-browser.js";
    const runtimeFile = join(dirname(runtimePackageFile), "dist", artifact);
    return {
      runtimeFile,
      runtimeUrl: pathToFileURL(runtimeFile).href,
      artifact: `dist/${artifact}`,
      version: runtimePackage.version,
      compilerVersion: compilerPackage.version,
    };
  } catch (error) {
    return { error: textError(error) };
  }
}

function routeVueImportsToRuntime(code, runtimeUrl) {
  const quoteRuntime = JSON.stringify(runtimeUrl);
  return code
    .replace(/(\bfrom\s*)(["'])vue\2/g, (_match, prefix) => `${prefix}${quoteRuntime}`)
    .replace(/(\bimport\s*)(["'])vue\2/g, (_match, prefix) => `${prefix}${quoteRuntime}`);
}

function eventConstructor(type) {
  if (/^(?:key|beforeinput|input)/.test(type)) {
    return type.startsWith("key") ? globalThis.KeyboardEvent : globalThis.InputEvent;
  }
  if (/^(?:click|dblclick|mouse|pointer)/.test(type)) return globalThis.MouseEvent;
  return globalThis.Event;
}

class VaporDomWrapper {
  constructor(element, runtime, takeRuntimeError) {
    this.element = element;
    this.runtime = runtime;
    this.takeRuntimeError = takeRuntimeError;
  }

  exists() {
    return Boolean(this.element);
  }

  text() {
    return this.element.textContent ?? "";
  }

  attributes(name) {
    return this.element.hasAttribute(name) ? (this.element.getAttribute(name) ?? "") : undefined;
  }

  classes() {
    return [...this.element.classList];
  }

  get(selector) {
    const element = this.element.querySelector(selector);
    if (!element)
      throw new Error(`selector did not match inside ${this.element.tagName}: ${selector}`);
    return new VaporDomWrapper(element, this.runtime, this.takeRuntimeError);
  }

  find(selector) {
    const element = this.element.querySelector(selector);
    return element
      ? new VaporDomWrapper(element, this.runtime, this.takeRuntimeError)
      : { element: null, exists: () => false };
  }

  findAll(selector) {
    return [...this.element.querySelectorAll(selector)].map(
      (element) => new VaporDomWrapper(element, this.runtime, this.takeRuntimeError),
    );
  }

  async trigger(type, options = {}) {
    const Constructor = eventConstructor(type);
    const event = new Constructor(type, { bubbles: true, cancelable: true, ...options });
    this.element.dispatchEvent(event);
    await this.runtime.nextTick();
    const error = this.takeRuntimeError();
    if (error) throw error;
  }

  async setValue(value) {
    const element = this.element;
    let eventName = "input";
    if (element instanceof globalThis.HTMLInputElement) {
      if (element.type === "checkbox") {
        element.checked = Boolean(value);
        eventName = "change";
      } else if (element.type === "radio") {
        element.checked = true;
        eventName = "change";
      } else {
        element.value = String(value ?? "");
      }
    } else if (element instanceof globalThis.HTMLTextAreaElement) {
      element.value = String(value ?? "");
    } else if (element.tagName === "SELECT") {
      element.value = String(value ?? "");
      eventName = "change";
    } else {
      throw new Error(`setValue is unsupported for ${element.tagName.toLowerCase()}`);
    }
    const Constructor = eventConstructor(eventName);
    element.dispatchEvent(new Constructor(eventName, { bubbles: true, cancelable: true }));
    await this.runtime.nextTick();
    const error = this.takeRuntimeError();
    if (error) throw error;
  }
}

function createVaporMount(runtime) {
  return (component, options = {}) => {
    const emissions = new Map();
    const propState = runtime.reactive({
      ...(options?.attrs ?? {}),
      ...(options?.props ?? {}),
    });
    const declaredProps = Array.isArray(component?.props)
      ? component.props
      : component?.props && typeof component.props === "object"
        ? Object.keys(component.props)
        : [];
    const props = {};
    for (const key of new Set([...declaredProps, ...Object.keys(propState)])) {
      props[key] = () => propState[key];
    }
    const capture =
      (name, existing) =>
      (...args) => {
        const calls = emissions.get(name) ?? [];
        calls.push(args);
        emissions.set(name, calls);
        if (typeof existing === "function") existing(...args);
      };
    const declaredEmits = Array.isArray(component?.emits)
      ? component.emits
      : component?.emits && typeof component.emits === "object"
        ? Object.keys(component.emits)
        : [];
    if (declaredEmits.includes("change")) {
      const onChange = capture("change", options?.attrs?.onChange ?? options?.props?.onChange);
      props.onChange = () => onChange;
    }
    if (declaredEmits.includes("update:title")) {
      const onUpdateTitle = capture(
        "update:title",
        options?.attrs?.["onUpdate:title"] ?? options?.props?.["onUpdate:title"],
      );
      props["onUpdate:title"] = () => onUpdateTitle;
    }

    const slots = Object.fromEntries(
      Object.entries(options?.slots ?? {}).map(([name, slot]) => [
        name,
        (slotProps) => {
          const value = typeof slot === "function" ? slot(slotProps) : slot;
          if (value instanceof globalThis.Node || Array.isArray(value)) return value;
          return document.createTextNode(String(value ?? ""));
        },
      ]),
    );

    const container = document.createElement("div");
    document.body.appendChild(container);
    let childInstance;
    const Harness = runtime.defineVaporComponent({
      name: "CompileValidityVaporHarness",
      setup(_props, { expose }) {
        childInstance = runtime.createComponent(
          component,
          Object.keys(props).length ? props : null,
          Object.keys(slots).length ? slots : null,
          false,
        );
        expose({
          __plantChild: childInstance,
          __plantSetProps(nextProps) {
            Object.assign(propState, nextProps);
          },
        });
        return childInstance;
      },
    });
    const app = runtime.createVaporApp(Harness);
    const runtimeErrors = [];
    app.config.errorHandler = (error) => runtimeErrors.push(error);
    const takeRuntimeError = () => runtimeErrors.shift();
    // Several plants intentionally create local VDOM components with `h()`.
    // Vue's own explicit interop plugin is the supported bridge for those
    // components inside a Vapor root; this is runtime setup, not borrowed VDOM
    // compiler evidence.
    app.use(runtime.vaporInteropPlugin);
    const exposed = app.mount(container) ?? {};
    const mountError = takeRuntimeError();
    if (mountError) {
      app.unmount();
      container.remove();
      throw mountError;
    }
    const vm = new Proxy(exposed, {
      get(target, key, receiver) {
        if (key === "$nextTick") return runtime.nextTick;
        if (Reflect.has(target, key)) return Reflect.get(target, key, receiver);
        const childExposed = childInstance?.exposed;
        if (childExposed && Reflect.has(childExposed, key)) return runtime.unref(childExposed[key]);
        return Reflect.get(target, key, receiver);
      },
    });

    return {
      vm,
      get(selector) {
        const element = container.querySelector(selector);
        if (!element) throw new Error(`selector did not match: ${selector}`);
        return new VaporDomWrapper(element, runtime, takeRuntimeError);
      },
      findAll(selector) {
        return [...container.querySelectorAll(selector)].map(
          (element) => new VaporDomWrapper(element, runtime, takeRuntimeError),
        );
      },
      find(selector) {
        const element = container.querySelector(selector);
        return element
          ? new VaporDomWrapper(element, runtime, takeRuntimeError)
          : {
              element: null,
              exists: () => false,
            };
      },
      emitted(name) {
        return emissions.get(name);
      },
      async setProps(nextProps) {
        exposed.__plantSetProps(nextProps);
        await runtime.nextTick();
        const error = takeRuntimeError();
        if (error) throw error;
      },
      unmount() {
        app.unmount();
        container.remove();
      },
    };
  };
}

function aggregate({
  entrypoint,
  target,
  env,
  sourceMap,
  results,
  reason = null,
  entrypointMetadata = null,
}) {
  const passed = results.filter((result) => result.status === "PASS").length;
  const failed = results.filter((result) => result.status === "FAIL").length;
  const unknown = results.filter((result) => result.status === "UNKNOWN").length;
  return {
    schemaVersion: 1,
    suiteVersion: COMPILE_VALIDITY_SUITE_VERSION,
    suiteHash: COMPILE_VALIDITY_SUITE_HASH,
    entrypoint,
    label: ENTRYPOINTS[entrypoint]?.label ?? entrypoint,
    exactPath: ENTRYPOINTS[entrypoint]?.exactPath ?? "unknown",
    target,
    env,
    sourceMap,
    status: failed ? "FAIL" : unknown ? "UNKNOWN" : "PASS",
    reason,
    entrypointMetadata,
    plantCount: results.length,
    passed,
    failed,
    unknown,
    results,
  };
}

async function execute({ entrypoint, target, env, sourceMap }) {
  if (!ENTRYPOINTS[entrypoint]) {
    return aggregate({
      entrypoint,
      target,
      env,
      sourceMap,
      reason: "entrypoint is not registered",
      results: unknownCompileValidityResults("entrypoint is not registered"),
    });
  }
  const isProduction = env === "production";
  const compilation = await compileEntrypoint(entrypoint, isProduction, sourceMap, target);
  if (compilation.unavailable) {
    return aggregate({
      entrypoint,
      target,
      env,
      sourceMap,
      reason: compilation.unavailable,
      results: unknownCompileValidityResults(compilation.unavailable),
    });
  }

  ensureDom();
  let mount;
  let vaporRuntimeMetadata = null;
  let vaporRuntimeUrl = null;
  if (target === "vapor") {
    const resolved = resolveVue36VaporRuntime();
    if (resolved.error) {
      return aggregate({
        entrypoint,
        target,
        env,
        sourceMap,
        reason: resolved.error,
        results: unknownCompileValidityResults(resolved.error),
        entrypointMetadata: compilation.metadata ?? null,
      });
    }
    try {
      // Generated modules are routed to this exact same URL. Do not add a
      // cache-busting query: two evaluations would create two independent
      // current-instance/effect globals and make valid render effects execute
      // outside the app's component scope.
      const runtime = await import(resolved.runtimeUrl);
      for (const name of ["createVaporApp", "vaporInteropPlugin", "nextTick", "template"]) {
        if (typeof runtime[name] !== "function") {
          throw new Error(`Vue ${resolved.version} Vapor runtime export ${name} is missing`);
        }
      }
      mount = createVaporMount(runtime);
      vaporRuntimeUrl = resolved.runtimeUrl;
      vaporRuntimeMetadata = {
        package: "vue-36",
        version: resolved.version,
        compilerVersion: resolved.compilerVersion,
        artifact: resolved.artifact,
        createAppExport: "createVaporApp",
        interopPlugin: "vaporInteropPlugin",
      };
    } catch (error) {
      const reason = `compatible Vue 3.6 Vapor runtime could not load: ${textError(error)}`;
      return aggregate({
        entrypoint,
        target,
        env,
        sourceMap,
        reason,
        results: unknownCompileValidityResults(reason),
        entrypointMetadata: compilation.metadata ?? null,
      });
    }
  } else {
    ({ mount } = await import("@vue/test-utils"));
  }
  const outputDir = join(
    rootDir,
    "work",
    "compile-validity",
    `${process.pid}-${entrypoint}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  mkdirSync(outputDir, { recursive: true });
  const results = [];
  const asyncRuntimeErrors = [];
  const recordUncaught = (error) => asyncRuntimeErrors.push(error);
  const recordUnhandled = (error) => asyncRuntimeErrors.push(error);
  process.prependListener("uncaughtException", recordUncaught);
  process.prependListener("unhandledRejection", recordUnhandled);
  try {
    for (let index = 0; index < COMPILE_VALIDITY_PLANTS.length; index++) {
      const plant = COMPILE_VALIDITY_PLANTS[index];
      const compiled = compilation.compiled?.[index];
      if (!compiled || compiled.error) {
        results.push({
          id: plant.id,
          coverage: plant.coverage,
          status: "FAIL",
          phase: "compile",
          detail: compiled?.error ?? "compiler returned no result for plant",
          ...(compiled?.metadata ? { metadata: compiled.metadata } : {}),
        });
        continue;
      }

      let component;
      try {
        const filename = join(outputDir, `${String(index).padStart(2, "0")}-${plant.id}.mjs`);
        // Timed native paths deliberately request TypeScript passthrough
        // (`isTs:true` / `forceJs:false`). Validate and strip that syntax as a
        // .ts module before Node executes the semantic oracle; calling it .mjs
        // here would incorrectly reject legal generated TS annotations.
        let executable = transpileForRuntime(compiled.code, `${plant.id}.ts`);
        if (target === "vapor") {
          executable = routeVueImportsToRuntime(executable, vaporRuntimeUrl);
        }
        writeFileSync(filename, executable, "utf8");
        const loaded = await import(`${pathToFileURL(filename).href}?plant=${Date.now()}-${index}`);
        if (!loaded.default) throw new Error("compiled module has no default export");
        component = loaded.default;
      } catch (error) {
        await new Promise((resolve) => setImmediate(resolve));
        const asyncError = asyncRuntimeErrors.shift();
        results.push({
          id: plant.id,
          coverage: plant.coverage,
          status: "FAIL",
          phase: "module-load",
          detail: textError(asyncError ?? error),
          ...(compiled.metadata ? { metadata: compiled.metadata } : {}),
        });
        continue;
      }

      try {
        await plant.assert({ mount, component });
        // Some candidate outputs schedule component/interop work after the
        // plant's final tick. Give that work one turn and turn an otherwise
        // process-fatal error into evidence for this exact plant.
        await new Promise((resolve) => setImmediate(resolve));
        if (asyncRuntimeErrors.length) throw asyncRuntimeErrors.shift();
        results.push({
          id: plant.id,
          coverage: plant.coverage,
          status: "PASS",
          phase: "runtime",
          ...(compiled.metadata ? { metadata: compiled.metadata } : {}),
        });
      } catch (error) {
        await new Promise((resolve) => setImmediate(resolve));
        const asyncError = asyncRuntimeErrors.shift();
        results.push({
          id: plant.id,
          coverage: plant.coverage,
          status: "FAIL",
          phase: "runtime",
          detail: textError(asyncError ?? error),
          ...(compiled.metadata ? { metadata: compiled.metadata } : {}),
        });
      }
    }
  } finally {
    process.removeListener("uncaughtException", recordUncaught);
    process.removeListener("unhandledRejection", recordUnhandled);
    rmSync(outputDir, { recursive: true, force: true });
  }
  return aggregate({
    entrypoint,
    target,
    env,
    sourceMap,
    results,
    entrypointMetadata: {
      ...(compilation.metadata ?? {}),
      ...(vaporRuntimeMetadata ? { vaporRuntime: vaporRuntimeMetadata } : {}),
    },
  });
}

function cliOptions(argv) {
  const options = {
    entrypoint: "",
    target: "vdom",
    env: "production",
    sourceMap: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--entrypoint") options.entrypoint = argv[++index] ?? "";
    else if (arg === "--target") options.target = argv[++index] ?? "vdom";
    else if (arg === "--env") options.env = argv[++index] ?? "production";
    else if (arg === "--source-map") options.sourceMap = (argv[++index] ?? "false") === "true";
  }
  return options;
}

export async function runCompileValidityChild(options) {
  return execute(options);
}

async function main() {
  const options = cliOptions(process.argv.slice(2));
  try {
    const result = await execute(options);
    console.log(`${COMPILE_VALIDITY_JSON_PREFIX}${JSON.stringify(result)}`);
  } catch (error) {
    const detail = `validity child crashed: ${textError(error)}`;
    const result = aggregate({
      ...options,
      reason: detail,
      results: COMPILE_VALIDITY_PLANTS.map((plant) => ({
        id: plant.id,
        coverage: plant.coverage,
        status: "FAIL",
        phase: "child",
        detail,
      })),
    });
    console.log(`${COMPILE_VALIDITY_JSON_PREFIX}${JSON.stringify(result)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
