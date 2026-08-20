import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { collectVueFiles, prepareTypecheckDir, totalBytes } from "../fixtures.mjs";
import { measureVariants, timedAsync, timedSync } from "../timing.mjs";
import {
  applyComponentMetaValidityGates,
  runComponentMetaValidityChildren,
} from "../component-meta-validity-gates.mjs";

/**
 * Members actually materialised from one component's meta.
 *
 * Recorded so a row cannot be fast for the uninteresting reason that it
 * returned nothing: before this, no variant on this surface declared an
 * artifact at all, so a tool answering `{}` would have ranked fastest.
 *
 * Polarity is INFORMATIONAL — the count is published, never used to flag a
 * row. Measured on `fixtures/50`: vue-component-meta reports 665 members,
 * @verter/component-meta 40. That is not 16x less work. 45 of the 50 generated
 * SFCs declare no macros at all — no defineProps/Emits/Slots/Expose — and for
 * those, vue-component-meta still reports ~12 members each (implicit and
 * inherited surface) while Verter reports the declared API only, i.e. none.
 * On the 5 fixtures that do declare an API the counts are 20 vs 8.
 *
 * So the gap is mostly a difference in what each tool considers part of a
 * component's public API, not in how much work it did. Scoring it as "did
 * less" would brand one tool for a schema definition. Same reasoning as the
 * diagnostics column on the typecheck surface, and the same polarity.
 */
function countMetaMembers(meta) {
  if (!meta) return 0;
  return (
    (meta.props?.length ?? 0) +
    (meta.events?.length ?? 0) +
    (meta.slots?.length ?? 0) +
    (meta.exposed?.length ?? 0)
  );
}

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function loadOptional(name) {
  try {
    return { mod: require(require.resolve(name, { paths: [rootDir] })) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Component-meta surface: extract props/events/slots (or closest equivalent).
 *
 * Scope:
 * - vue-component-meta: official API createChecker + getComponentMeta
 * - @verter/component-meta: Verter Type-IR metadata extractor (if package loads)
 * - Vize: no dedicated public component-meta package equivalent found in npm `vize` /
 *   `@vizejs/native` at scaffold time; declaration emit is a different job.
 *   Marked unavailable (skipped) when no API is present.
 */
export async function runComponentMetaSurface(fixtureDir, options) {
  const files = collectVueFiles(
    fixtureDir,
    options.metaFileLimit ?? Math.min(options.fileLimit ?? 200, 200),
  );
  const bytes = totalBytes(fixtureDir, files);
  const workRoot = options.workRoot;
  const metaDir = prepareTypecheckDir(fixtureDir, files, workRoot, `meta-${files.length}`);

  // vue-component-meta needs a proper tsconfig and vue in resolution path
  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");
  process.env.NODE_PATH = nodePath;

  const vueMeta = loadOptional("vue-component-meta");
  const verterMetaPkg = loadOptional("@verter/component-meta");
  const vizeNative = loadOptional("@vizejs/native");

  const variants = [];
  const absFiles = files.map((f) => join(metaDir, f));
  const normalizedAbsFiles = absFiles.map((path) => path.replace(/\\/g, "/"));

  if (!vueMeta.error) {
    variants.push({
      id: "vue-component-meta",
      label: "vue-component-meta",
      package: "vue-component-meta",
      comparisonClass: "component-public-api",
      comparisonClassLabel: "Component public-API metadata",
      baseline: true,
      baselineLabel: "Vue official",
      notes: "createChecker(tsconfig) + getComponentMeta for each .vue file",
      artifactLabel: "Meta members",
      artifactPolarity: "informational",
      measure: () => {
        let work = 0;
        const { ms } = timedSync(() => {
          const { createChecker } = vueMeta.mod;
          const checker = createChecker(join(metaDir, "tsconfig.json"), {
            forceUseTs: true,
          });
          for (const file of absFiles) {
            work += countMetaMembers(checker.getComponentMeta(file));
          }
        });
        return { ms, artifact: work };
      },
    });
  } else {
    variants.push({
      id: "vue-component-meta",
      label: "vue-component-meta",
      package: "vue-component-meta",
      notes: `Could not load: ${vueMeta.error}`,
      skip: true,
    });
  }

  // Drive Verter through its published `@verter/component-meta` session API,
  // the same entry point the correctness suite scores.
  //
  // This row used to call `@verter/native`'s ComponentMetaHost directly and
  // DISCARD the protobuf buffer it returns, while the vue-component-meta row
  // above materialises full PropertyMeta objects. The two were then ranked
  // against each other in one table: a decode-and-materialise pass timed
  // against a pass that stops at the transport. The artifact column could not
  // reveal it either, because no variant on this surface declared one — a row
  // returning nothing at all would have ranked fastest.
  //
  // The workaround existed because the published package shipped an empty
  // `dist/`. It ships properly as of 0.0.1-beta.3, so the workaround is gone.
  if (!verterMetaPkg.error && typeof verterMetaPkg.mod.openComponentMetaSession === "function") {
    const { openComponentMetaSession, evictComponentMetaSession } = verterMetaPkg.mod;
    const sessionConfig = {
      root: metaDir.replace(/\\/g, "/"),
      tsconfig: join(metaDir, "tsconfig.json").replace(/\\/g, "/"),
    };
    variants.push({
      id: "verter-component-meta",
      label: "@verter/component-meta",
      package: "@verter/component-meta",
      comparisonClass: "component-public-api",
      comparisonClassLabel: "Component public-API metadata",
      notes:
        "openComponentMetaSession(root, tsconfig) + disk-backed getComponentMeta for each .vue file; no updateFile overlay",
      artifactLabel: "Meta members",
      artifactPolarity: "informational",
      measure: async () => {
        let work = 0;
        // Full cycle per iteration, matching vue-component-meta creating a new
        // checker each run. Engines are pooled per root+tsconfig, so the evict
        // is what actually ends the cycle — without it the second run would
        // measure a warm engine against the other row's cold one.
        const { ms } = await timedAsync(async () => {
          const session = await openComponentMetaSession(sessionConfig);
          try {
            for (const path of normalizedAbsFiles) {
              // Disk-backed lifecycle, exactly as the post-timing plants: no
              // updateFile overlay and no source string preloaded for Verter.
              work += countMetaMembers(await session.getComponentMeta(path));
            }
          } finally {
            try {
              session.close();
            } catch {
              /* ignore */
            }
            try {
              evictComponentMetaSession(sessionConfig);
            } catch {
              /* ignore */
            }
          }
        });
        return { ms, artifact: work };
      },
    });
  } else {
    variants.push({
      id: "verter-component-meta",
      label: "@verter/component-meta",
      package: "@verter/component-meta",
      // No substitute workload: a row measured through a different entry point
      // than the one it claims is not this tool's number.
      notes: `Unavailable: ${verterMetaPkg.error ?? "openComponentMetaSession missing"}`,
      skip: true,
    });
  }

  // Vize: unavailable unless a real meta API appears
  if (!vizeNative.error && typeof vizeNative.mod?.extractComponentMeta === "function") {
    variants.push({
      id: "vize-component-meta",
      label: "Vize component-meta",
      package: "@vizejs/native",
      comparisonClass: "component-public-api",
      comparisonClassLabel: "Component public-API metadata",
      notes: "vize extractComponentMeta",
      measure: () =>
        timedSync(() => {
          for (const f of absFiles) {
            vizeNative.mod.extractComponentMeta(f);
          }
        }),
    });
  } else {
    variants.push({
      id: "vize-component-meta",
      label: "Vize component-meta",
      package: "vize",
      notes:
        "No dedicated public component-meta API found on vize/@vizejs/native (declaration emit is a different surface and is not substituted).",
      skip: true,
    });
  }

  writeFileSync(
    join(metaDir, "META_BENCH_NOTE.txt"),
    `files=${files.length}\nvue-meta=${vueMeta.error ? "err" : "ok"}\nverter-pkg=${verterMetaPkg.error ? "err" : "ok"}\n`,
  );

  // Wrap measures that return timedSync result objects
  for (const v of variants) {
    if (v.skip || !v.measure) continue;
    const inner = v.measure;
    v.measure = async (ctx) => {
      const out = await inner(ctx);
      if (typeof out === "number") return out;
      if (out && typeof out.ms === "number") return out;
      return out;
    };
  }

  const results = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });

  // Run after timing and in separate children. The validators reproduce each
  // row's disk-backed lifecycle, so neither TypeScript program construction nor
  // Verter's pooled native session can warm a measured pass.
  const componentMetaSemantics = runComponentMetaValidityChildren();
  applyComponentMetaValidityGates(results, componentMetaSemantics);

  return {
    id: "component-meta",
    label: "Component-meta",
    files: files.length,
    bytes,
    validation: { componentMetaSemantics },
    methodology: [
      "Extract component public API metadata (props/events/slots where supported).",
      "Same subset of .vue files for every available tool.",
      "Schema depth and TypeScript program options may differ by tool — timings are throughput, not equivalence.",
      "Every tool is driven through its own published entry point. No payload is hand-decoded, and no row is measured through an API it does not ship.",
      `POST-TIMING SEMANTIC GATE: suite ${componentMetaSemantics.suiteVersion} runs ${componentMetaSemantics.plantCount} existing component-meta cases in one isolated child per exact row. Vue creates one checker over a disk-backed tsconfig and calls getComponentMeta for every planted disk file. Verter opens one published session over the same disk-backed project and calls getComponentMeta for every file without updateFile overlays. Named props/events/slots/exposed members, coarse type facts, requiredness, defaults and deliberate absence are scored by one tool-neutral oracle; output objects and type strings are never byte-compared. FAIL, crash, missing verdict and UNKNOWN remain measured but UNRANKED, and a failed official Vue baseline invalidates the class.`,
      "Each row reports the meta members it materialised. The counts are NOT equivalent between tools and no threshold is applied to them: on this corpus most generated SFCs declare no macros, and the tools differ on whether a component with no declared API still has implicit members. Read the member counts alongside the times rather than treating the ratio as like-for-like.",
      "Tool order is ROTATED on every warmup and measured run (not merely alternated), so no tool keeps a fixed position in the sequence.",
      "Tools without a real component-meta API are reported as skipped (no substitute workload).",
    ],
    variants: results,
  };
}
