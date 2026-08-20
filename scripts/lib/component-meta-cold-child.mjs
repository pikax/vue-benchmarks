import { readFileSync, writeFileSync } from "node:fs";
import {
  buildComponentMetaVariants,
  componentMetaFreshChildPackageSelection,
  ensureMetaNodePath,
  loadOptionalMetaPackage,
} from "./surfaces/component-meta.mjs";

/**
 * One fresh-child sample for the component-meta surface.
 *
 * Spawned by `measureFreshChildVariants` as
 * `node component-meta-cold-child.mjs <payload> <variantId> <iteration> <out>`
 * and answers with `{ ok, ms, meta }` for exactly one row.
 *
 * The row is built through the surface's own `buildComponentMetaVariants`, so
 * the cold sample and the warm sample are the same adapter. A separate
 * child-only adapter would be a different benchmark wearing the same label —
 * and the parity check the parent runs afterwards could not tell, because it
 * would be comparing that adapter against itself.
 *
 * The project directory is NOT materialised here. The parent prepared it once
 * and passes its path, so this process pays only for what the row measures:
 * loading its own package, then building a checker/session and extracting.
 */
const [, , payloadPath, variantId, rawIteration, outputPath] = process.argv;

async function main() {
  const payload = JSON.parse(readFileSync(payloadPath, "utf8"));

  // vue-component-meta resolves `vue` through the module path; the parent set
  // this before spawning, but a child launched with a stripped environment
  // must not silently measure a checker that failed to find Vue.
  ensureMetaNodePath();

  // Among the benchmarked meta packages, a row's child loads only its own.
  // Shared harness modules have already loaded above. Importing the other two
  // here would exclude their startup from the timer yet still let unrelated
  // native initialization perturb this process's allocator and thread-pool
  // state — the exact contamination a fresh child exists to avoid.
  const selected = componentMetaFreshChildPackageSelection(variantId);
  const notSelected = { error: "not selected in this fresh child" };
  const variants = buildComponentMetaVariants({
    metaDir: payload.metaDir,
    files: payload.files,
    vueMeta: selected.vueComponentMeta
      ? loadOptionalMetaPackage("vue-component-meta")
      : notSelected,
    verterMetaPkg: selected.verterComponentMeta
      ? loadOptionalMetaPackage("@verter/component-meta")
      : notSelected,
    vizeNative: selected.vizeNative ? loadOptionalMetaPackage("@vizejs/native") : notSelected,
  });

  const variant = variants.find((candidate) => candidate.id === variantId);
  if (!variant) throw new Error(`fresh-child variant not found: ${variantId}`);
  // A row the parent measured but this child cannot build is a package that
  // failed to load HERE. Reporting it as a slow sample would be a fabrication;
  // the runner turns a non-zero exit into a visible per-row unavailability.
  if (variant.skip) throw new Error(`fresh-child variant is skipped: ${variantId} — ${variant.notes}`);

  const pass = { phase: "fresh-child", iteration: Number(rawIteration) || 0 };
  const prepared = (await variant.prepare?.(pass)) ?? null;
  const result = await variant.measure(pass);
  const ms = typeof result === "number" ? result : result?.ms;
  if (!Number.isFinite(ms))
    throw new Error(`fresh-child variant returned no finite duration: ${variantId}`);
  const { ms: _ms, ...resultMeta } = typeof result === "number" ? {} : result;
  writeFileSync(
    outputPath,
    JSON.stringify({
      ok: true,
      ms,
      meta: { ...(prepared ?? {}), ...resultMeta },
    }),
  );
}

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
