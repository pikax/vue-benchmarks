import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { collectVueFiles, prepareTypecheckDir, totalBytes } from "../fixtures.mjs";
import { measureVariants, timedAsync, timedSync } from "../timing.mjs";
import { measureFreshChildVariants } from "../compile-cold-runs.mjs";
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
const here = dirname(fileURLToPath(import.meta.url));
const rootDir = join(here, "../../..");
const freshChildScript = join(here, "../component-meta-cold-child.mjs");

/**
 * Resolve a benchmarked meta package from the repo root.
 *
 * Exported because the fresh-child process must resolve the SAME package by
 * the same rule. A child that resolved differently would be timing a different
 * installation than the warm pass and the parity check would be comparing two
 * unrelated things.
 */
export function loadOptionalMetaPackage(name) {
  try {
    return { mod: require(require.resolve(name, { paths: [rootDir] })) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * vue-component-meta needs `vue` on the module resolution path, and so does the
 * fresh child. Shared so the two paths cannot drift.
 */
export function ensureMetaNodePath() {
  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");
  process.env.NODE_PATH = nodePath;
  return nodePath;
}

/**
 * Which benchmarked package a fresh child is allowed to import for one row.
 *
 * A child that imported all three would exclude the other tools' startup from
 * its timer yet still let their native initialization perturb the process,
 * allocator and thread-pool state the row is about to be measured in. Same
 * rule, and the same reason, as the compiler surface's fresh children.
 */
export function componentMetaFreshChildPackageSelection(id) {
  return {
    vueComponentMeta: id === "vue-component-meta",
    verterComponentMeta: id === "verter-component-meta",
    vizeNative: id === "vize-component-meta",
  };
}

/**
 * Stable identity of what a row was configured to do.
 *
 * The fresh child receives the project directory and file list over a JSON
 * payload rather than sharing the parent's variables, so "both paths ran the
 * same workload" is an assumption until something checks it. This hash plus
 * the input count and artifact census are what the parity check compares.
 */
function adapterOptionsHash(id, tsconfigPath, files) {
  return createHash("sha256")
    .update(JSON.stringify({ id, tsconfig: tsconfigPath.replace(/\\/g, "/"), files }))
    .digest("hex")
    .slice(0, 16);
}

/**
 * Build the timed rows for this surface.
 *
 * Split out of `runComponentMetaSurface` so the fresh-child process builds its
 * row through the identical code path: a second, child-only adapter would be a
 * different benchmark wearing the same row label.
 *
 * `files` are names relative to `metaDir` — the payload stays small and the
 * child materialises nothing, it reads the project the parent already prepared.
 */
export function buildComponentMetaVariants({
  metaDir,
  files,
  vueMeta,
  verterMetaPkg,
  vizeNative,
}) {
  const variants = [];
  const absFiles = files.map((f) => join(metaDir, f));
  const normalizedAbsFiles = absFiles.map((path) => path.replace(/\\/g, "/"));
  const tsconfigPath = join(metaDir, "tsconfig.json");

  if (!vueMeta.error) {
    const optionsHash = adapterOptionsHash("vue-component-meta", tsconfigPath, files);
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
          const checker = createChecker(tsconfigPath, {
            forceUseTs: true,
          });
          for (const file of absFiles) {
            work += countMetaMembers(checker.getComponentMeta(file));
          }
        });
        return {
          ms,
          artifact: work,
          inputCount: absFiles.length,
          adapterOptionsHash: optionsHash,
        };
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
      tsconfig: tsconfigPath.replace(/\\/g, "/"),
    };
    const optionsHash = adapterOptionsHash("verter-component-meta", tsconfigPath, files);
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
        return {
          ms,
          artifact: work,
          inputCount: normalizedAbsFiles.length,
          adapterOptionsHash: optionsHash,
        };
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
    const optionsHash = adapterOptionsHash("vize-component-meta", tsconfigPath, files);
    variants.push({
      id: "vize-component-meta",
      label: "Vize component-meta",
      package: "@vizejs/native",
      comparisonClass: "component-public-api",
      comparisonClassLabel: "Component public-API metadata",
      notes: "vize extractComponentMeta",
      artifactLabel: "Meta members",
      artifactPolarity: "informational",
      measure: () => {
        // Counted, not discarded. The rows above materialise members inside
        // their timer; a row that stopped at whatever this API hands back
        // would be timing strictly less work while declaring no artifact,
        // which is the exact shape the Verter row was fixed for.
        let work = 0;
        const { ms } = timedSync(() => {
          for (const f of absFiles) {
            work += countMetaMembers(vizeNative.mod.extractComponentMeta(f));
          }
        });
        return {
          ms,
          artifact: work,
          inputCount: absFiles.length,
          adapterOptionsHash: optionsHash,
        };
      },
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

  return variants;
}

/**
 * Merge fresh-child samples into the warm rows, and check the two paths
 * measured the same thing before publishing them side by side.
 *
 * A fresh-child number that came from a different file set, a different
 * tsconfig or a tool that materialised a different amount of metadata is not a
 * cold reading of this row — it is a second, unlabelled benchmark. When the
 * parity checks disagree the row keeps its timings (they are still evidence)
 * but stops being ranked, exactly as a failed semantic gate does.
 */
export function applyComponentMetaFreshChildSamples(rows, freshById) {
  for (const row of rows) {
    const fresh = freshById.get(row.id);
    if (!fresh) continue;
    if (!Number.isFinite(fresh.freshChildMedianMs)) {
      if (!fresh.freshChildError) continue;
      row.freshChildRuns = fresh.freshChildRuns;
      row.freshChildError = fresh.freshChildError;
      row.notes = `${row.notes ? `${row.notes} ` : ""}⚠ FRESH-CHILD SAMPLE UNAVAILABLE: ${fresh.freshChildError}. Warm timing remains reported.`;
      continue;
    }

    Object.assign(row, fresh);
    const warmMeta = Array.isArray(row.metaSamples) ? row.metaSamples : [];
    const freshMeta = Array.isArray(row.freshChildMetaSamples)
      ? row.freshChildMetaSamples
      : [];
    const values = (items, key) => items.map((item) => item?.[key]).filter((v) => v != null);
    const sameSet = (a, b) =>
      a.length > 0 &&
      b.length > 0 &&
      JSON.stringify([...new Set(a)].sort()) === JSON.stringify([...new Set(b)].sort());
    const checks = {};
    // Only assert on a fact one of the two paths actually reported. A check
    // that fails merely because neither side recorded the field would unrank
    // every row on the surface and call it a parity failure.
    for (const key of ["adapterOptionsHash", "inputCount", "artifact"]) {
      const freshValues = values(freshMeta, key);
      const warmValues = values(warmMeta, key);
      if (freshValues.length || warmValues.length) {
        checks[key] = sameSet(freshValues, warmValues);
      }
    }
    row.adapterParity = { ok: Object.values(checks).every(Boolean), checks };
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
 *
 * Two independent series per row:
 * - FRESH CHILD — one process per sample, so the checker/session construction
 *   inside the timer is the first one this process has ever built. This is the
 *   number a user pays when they open an editor or run the tool once in CI.
 * - WARM — the shared benchmark process after a discarded pass, i.e. repeat
 *   extraction cost. It stays the primary ranking metric.
 *
 * Both are wanted here because this surface's timer already contains the whole
 * lifecycle: `createChecker` builds a TypeScript program and the Verter row
 * opens and evicts a pooled native engine per iteration. Publishing only the
 * warm median hid how much of that a process pays exactly once — and a JS
 * TypeScript program and a native engine do not pay it in the same proportion.
 */
export async function runComponentMetaSurface(fixtureDir, options) {
  const files = collectVueFiles(
    fixtureDir,
    options.metaFileLimit ?? Math.min(options.fileLimit ?? 200, 200),
  );
  const bytes = totalBytes(fixtureDir, files);
  const workRoot = options.workRoot;
  const metaDir = prepareTypecheckDir(fixtureDir, files, workRoot, `meta-${files.length}`);

  // vue-component-meta needs a proper tsconfig and vue in resolution path.
  // Set before the fresh children spawn: they inherit this environment.
  ensureMetaNodePath();

  const vueMeta = loadOptionalMetaPackage("vue-component-meta");
  const verterMetaPkg = loadOptionalMetaPackage("@verter/component-meta");
  const vizeNative = loadOptionalMetaPackage("@vizejs/native");

  const variants = buildComponentMetaVariants({
    metaDir,
    files,
    vueMeta,
    verterMetaPkg,
    vizeNative,
  });

  writeFileSync(
    join(metaDir, "META_BENCH_NOTE.txt"),
    `files=${files.length}\nvue-meta=${vueMeta.error ? "err" : "ok"}\nverter-pkg=${verterMetaPkg.error ? "err" : "ok"}\n`,
  );

  // Fresh children run FIRST, before this process has extracted any metadata.
  // Their own state is per-process, but the warm pass below must not be the
  // thing that warmed the OS page cache for them.
  const freshChild = measureFreshChildVariants(variants, {
    runs: options.runs,
    payload: { metaDir, files },
    childScript: freshChildScript,
  });

  const results = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });
  applyComponentMetaFreshChildSamples(results, freshChild.byId);

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
    freshChildMeasurement: {
      samplesPerActiveRow: Math.max(1, Math.trunc(Number(options.runs) || 1)),
      processModel: "fresh-child-first-timed-row-workload",
      packageIsolation:
        "selected-row-benchmarked-meta-package-only; shared-harness-dependencies-still-imported",
      excludes: ["child-process-startup", "package-import", "project-materialisation"],
      // Unlike the compiler surface, checker/session construction is INSIDE
      // the timer — because it is inside the warm timer too. Moving it out
      // would delete the part of the cost this table exists to show.
      includes: ["checker-or-session-construction", "metadata-materialisation"],
      osPageCacheFlushed: false,
      whollyFreshRuntimeStateClaimed: false,
      executedOrder: freshChild.executedOrder,
      deterministicFailureRetries: 0,
    },
    warmMeasurement: {
      processModel: "shared-benchmark-process-after-discarded-warmup",
    },
    validation: { componentMetaSemantics },
    methodology: [
      "Extract component public API metadata (props/events/slots where supported).",
      "Same subset of .vue files for every available tool.",
      "Schema depth and TypeScript program options may differ by tool — timings are throughput, not equivalence.",
      "Every tool is driven through its own published entry point. No payload is hand-decoded, and no row is measured through an API it does not ship.",
      "TWO INDEPENDENT SERIES per row. Fresh child: one NEW process per sample, which builds its checker (or opens its session) for the first time inside the timer — the cost of extracting metadata once, as an editor or a one-shot CI job pays it. Warm: the shared benchmark process after a discarded pass — the cost of extracting again. Warm remains the primary ranking metric; the fresh-child column is ranked separately and never substituted for it.",
      "A fresh child imports ONLY its own row's benchmarked package. Importing all three would keep the others' startup out of the timer while still letting their native initialization change the allocator and thread-pool state the row is measured in.",
      "The fresh-child child process is spawned before the warm pass runs, so the warm pass cannot be what warmed the OS page cache for it. Node startup, package import and project materialisation are outside the child's timer; checker/session construction is inside it, because it is inside the warm timer too. OS page and filesystem caches are NOT flushed and no wholly-cold runtime is claimed.",
      "The two paths are checked for ADAPTER PARITY: same adapter options hash, same input count, same materialised member count. A row whose fresh-child and warm passes disagree keeps both timings but is UNRANKED — a cold number produced from a different workload is a second benchmark, not this row's cold reading.",
      `POST-TIMING SEMANTIC GATE: suite ${componentMetaSemantics.suiteVersion} runs ${componentMetaSemantics.plantCount} existing component-meta cases in one isolated child per exact row. Vue creates one checker over a disk-backed tsconfig and calls getComponentMeta for every planted disk file. Verter opens one published session over the same disk-backed project and calls getComponentMeta for every file without updateFile overlays. Named props/events/slots/exposed members, coarse type facts, requiredness, defaults and deliberate absence are scored by one tool-neutral oracle; output objects and type strings are never byte-compared. FAIL, crash, missing verdict and UNKNOWN remain measured but UNRANKED, and a failed official Vue baseline invalidates the class.`,
      "Each row reports the meta members it materialised. The counts are NOT equivalent between tools and no threshold is applied to them: on this corpus most generated SFCs declare no macros, and the tools differ on whether a component with no declared API still has implicit members. Read the member counts alongside the times rather than treating the ratio as like-for-like.",
      "Tool order is ROTATED on every warmup and measured run (not merely alternated), so no tool keeps a fixed position in the sequence. Fresh-child samples use a paired forward/reverse schedule, which balances row position over any complete pair even when fewer runs than rows were requested; the executed order is retained in JSON.",
      "Tools without a real component-meta API are reported as skipped (no substitute workload).",
    ],
    variants: results,
  };
}
