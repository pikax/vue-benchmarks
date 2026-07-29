/**
 * Compile an SFC source string with each available compiler, then load the
 * resulting ESM as a Vue component for runtime confirmation with test-utils.
 */
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
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

function hashId(filename) {
  return createHash("sha256").update(filename).digest("hex").slice(0, 8);
}

/**
 * Official @vue/compiler-sfc → single-file ESM with export default.
 */
export function compileWithVueCompiler(compiler, source, filename, { isProd = true } = {}) {
  const { descriptor, errors } = compiler.parse(source, { filename });
  if (errors?.length) {
    return {
      code: null,
      errors: errors.map((e) => e.message || String(e)),
    };
  }
  const id = hashId(filename);
  try {
    const script = compiler.compileScript(descriptor, {
      id,
      inlineTemplate: true,
      isProd,
    });
    return { code: script.content, errors: [] };
  } catch (error) {
    return {
      code: null,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

export function getCompilers() {
  const list = [];

  const c35 = loadOptional("@vue/compiler-sfc");
  if (!c35.error) {
    list.push({
      id: "vue-3.5",
      label: "@vue/compiler-sfc 3.5",
      compile(source, filename) {
        return compileWithVueCompiler(c35.mod, source, filename);
      },
    });
  } else {
    list.push({ id: "vue-3.5", label: "@vue/compiler-sfc 3.5", skip: c35.error });
  }

  const c36 = loadOptional("@vue/compiler-sfc-36");
  if (!c36.error) {
    list.push({
      id: "vue-3.6",
      label: "@vue/compiler-sfc 3.6",
      compile(source, filename) {
        return compileWithVueCompiler(c36.mod, source, filename);
      },
    });
  } else {
    list.push({ id: "vue-3.6", label: "@vue/compiler-sfc 3.6", skip: c36.error });
  }

  const vize = loadOptional("@vizejs/native");
  if (!vize.error && typeof vize.mod.compileSfc === "function") {
    list.push({
      id: "vize",
      label: "@vizejs/native",
      compile(source, filename) {
        const result = vize.mod.compileSfc(source, {
          filename,
          vapor: false,
          sourceMap: false,
          isTs: false,
        });
        const errors = (result?.errors || []).map((e) =>
          typeof e === "string" ? e : e.message || String(e),
        );
        return { code: result?.code ?? null, errors };
      },
    });
  } else {
    list.push({
      id: "vize",
      label: "@vizejs/native",
      skip: vize.error || "compileSfc missing",
    });
  }

  // fervid — https://github.com/phoenix-ru/fervid
  //
  // fervid reports a non-fatal `NonVoidHtmlElementStartTagWithTrailingSolidus`
  // diagnostic for self-closing non-void tags (`<div />`, `<MyComp />`), which
  // Vue's own SFC parser accepts, while still emitting complete codegen. The
  // suite treats a non-empty `errors` array as a compile failure, so that one
  // diagnostic kind is dropped WHEN CODE WAS PRODUCED — otherwise fervid would
  // be failed here for output that mounts and behaves correctly.
  //
  // Deliberately narrow: any other diagnostic, and any diagnostic at all when
  // no code came back, still fails the case. Runtime behaviour remains the real
  // gate — this only stops a parser-strictness note from pre-empting it.
  const FERVID_NONFATAL = /NonVoidHtmlElementStartTagWithTrailingSolidus/;
  const fervid = loadOptional("@fervid/napi");
  if (!fervid.error && typeof fervid.mod.Compiler === "function") {
    const fervidCompiler = new fervid.mod.Compiler({ isProduction: true });
    list.push({
      id: "fervid",
      label: "@fervid/napi",
      compile(source, filename) {
        let result;
        try {
          result = fervidCompiler.compileSync(source, { id: hashId(filename), filename });
        } catch (error) {
          return { code: null, errors: [error instanceof Error ? error.message : String(error)] };
        }
        const code = result?.code ?? null;
        const errors = (result?.errors || [])
          .map((e) => (typeof e === "string" ? e : e.message || String(e)))
          .filter((message) => !(code && FERVID_NONFATAL.test(message)));
        return { code, errors };
      },
    });
  } else {
    list.push({
      id: "fervid",
      label: "@fervid/napi",
      skip: fervid.error || "Compiler missing",
    });
  }

  const verter = loadOptional("@verter/native");
  if (!verter.error && typeof verter.mod.VerterHost === "function") {
    list.push({
      id: "verter",
      label: "@verter/native",
      compile(source, filename) {
        const host = new verter.mod.VerterHost({ devMode: false });
        const results = host.compileMany(
          [
            {
              canonicalId: filename.replace(/\\/g, "/"),
              source,
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
              forceJs: true,
              forceVapor: false,
              sourceMap: false,
              hmrStrategy: "none",
              runtimeModuleName: "vue",
            },
          },
        );
        const r = results[0] || {};
        const errors = (r.errors || []).map((e) =>
          typeof e === "string" ? e : e.message || String(e),
        );
        return { code: r.code ?? null, errors };
      },
    });
  } else {
    list.push({
      id: "verter",
      label: "@verter/native",
      skip: verter.error || "VerterHost missing",
    });
  }

  return list;
}

/**
 * Write compiled ESM under the project tree so bare `vue` resolves to the same
 * install as @vue/test-utils (avoids dual-package / broken document host).
 */
export async function loadCompiledComponent(code, tag = "comp") {
  if (!code || typeof code !== "string") {
    throw new Error("No compiled code to load");
  }
  const dir = join(
    rootDir,
    "work",
    "confirm-compile",
    `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${tag}.mjs`);
  writeFileSync(file, code, "utf8");
  try {
    const href = pathToFileURL(file).href + `?t=${Date.now()}`;
    const mod = await import(href);
    if (!mod.default) {
      throw new Error("Compiled module has no default export");
    }
    return {
      component: mod.default,
      cleanup: () => rmSync(dir, { recursive: true, force: true }),
    };
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}
