import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { buildCellVariants, registerCompilerTS } from "./surfaces/compile.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function loadOptional(name) {
  try {
    return require(require.resolve(name, { paths: [rootDir] }));
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

const [, , payloadPath, variantId, rawIteration, outputPath] = process.argv;

export function compilerFreshChildPackageSelection(id, target) {
  const isVue = id.startsWith("vue-");
  const vue36 =
    isVue &&
    (id.startsWith("vue-3.6-") ||
      (id.startsWith("vue-reference-") && target === "vapor"));
  return {
    vue35: isVue && !vue36,
    vue36,
    vize: id.startsWith("vize-"),
    verter: id.startsWith("verter-"),
    fervid: id.startsWith("fervid-"),
  };
}

async function main() {
  const payload = JSON.parse(readFileSync(payloadPath, "utf8"));
  const selected = compilerFreshChildPackageSelection(
    variantId,
    payload.target,
  );
  const compiler35 = selected.vue35 ? await import("@vue/compiler-sfc") : null;
  let compiler36 = null;
  if (selected.vue36) {
    try {
      compiler36 = await import("@vue/compiler-sfc-36");
    } catch {
      compiler36 = null;
    }
  }
  registerCompilerTS(compiler35);
  registerCompilerTS(compiler36);

  // Among benchmarked compiler packages, a row's child loads only its own.
  // Shared harness modules have already loaded above. Importing every compiler
  // NAPI module here would exclude their startup from the timer yet still let
  // unrelated native initialization perturb the process/allocator state.
  const notSelected = { error: "not selected in this fresh child" };
  const vizeNative = selected.vize
    ? loadOptional("@vizejs/native")
    : notSelected;
  const verterNative = selected.verter
    ? loadOptional("@verter/native")
    : notSelected;
  const fervidNative = selected.fervid
    ? loadOptional("@fervid/napi")
    : notSelected;
  const workspaceRoot = payload.fixtureDir.replace(/\\/g, "/");
  const makeVerterHost = (config) => {
    if (
      !verterNative.error &&
      typeof verterNative.Workspace === "function" &&
      typeof verterNative.VerterHost?.withWorkspace === "function"
    ) {
      const workspace = new verterNative.Workspace([workspaceRoot]);
      workspace.configureProjects([{ root: workspaceRoot, workspaceRoot }]);
      return verterNative.VerterHost.withWorkspace(config, workspace);
    }
    return new verterNative.VerterHost(config);
  };

  const variants = buildCellVariants({
    target: payload.target,
    env: payload.env,
    sourceMap: payload.sourceMap,
    sources: payload.sources,
    compiler35,
    compiler36,
    vizeNative,
    verterNative,
    fervidNative,
    makeVerterHost,
    capabilities: payload.capabilities,
    preparedRaw: payload.preparedRaw,
    preparedStyle: payload.preparedStyle,
    freshChildVariantId: variantId,
  });
  const variant = variants.find((candidate) => candidate.id === variantId);
  if (!variant) throw new Error(`fresh-child variant not found: ${variantId}`);
  if (variant.skip)
    throw new Error(`fresh-child variant is skipped: ${variantId}`);
  const pass = {
    phase: "fresh-child",
    iteration: Number(rawIteration) || 0,
  };
  // Input construction is an explicit adapter setup phase, outside the row's
  // timer. Calling prepare here also makes diagnostics available before the
  // native API is invoked.
  const prepared = (await variant.prepare?.(pass)) ?? null;
  const result = await variant.measure({
    ...pass,
  });
  const ms = typeof result === "number" ? result : result?.ms;
  if (!Number.isFinite(ms))
    throw new Error(
      `fresh-child variant returned no finite duration: ${variantId}`,
    );
  const { ms: _ms, ...resultMeta } = typeof result === "number" ? {} : result;
  writeFileSync(
    outputPath,
    JSON.stringify({
      ok: true,
      ms,
      meta: {
        ...(prepared ?? {}),
        ...resultMeta,
      },
    }),
  );
}

export const compilerColdPackageSelection = compilerFreshChildPackageSelection;

// Importing every scripts/lib module is a harness invariant. Run only when the
// parent supplied the complete worker protocol; a plain module import is inert.
if (payloadPath && variantId && outputPath) {
  try {
    await main();
  } catch (error) {
    writeFileSync(
      outputPath,
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.stack : String(error),
      }),
    );
    process.exitCode = 1;
  }
}
