/** Process-isolated exact-lifecycle component-meta plant validator. */
import { createRequire } from "node:module";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { normalizeVolarComponentMeta } from "../../tests/confirm/lib/component-meta-extract.mjs";
import { prepareTypecheckDir } from "./fixtures.mjs";
import {
  COMPONENT_META_CASES_ROOT,
  COMPONENT_META_VALIDITY_PLANTS,
  COMPONENT_META_VALIDITY_SUITE_HASH,
  COMPONENT_META_VALIDITY_SUITE_VERSION,
  scoreComponentMetaPlant,
  unknownComponentMetaValidityResults,
} from "./component-meta-validity-plants.mjs";

export const COMPONENT_META_VALIDITY_JSON_PREFIX = "@@COMPONENT_META_VALIDITY_JSON@@";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

const ENTRYPOINTS = Object.freeze({
  "vue-component-meta": {
    label: "vue-component-meta",
    exactPath:
      "createChecker(diskTsconfig, { forceUseTs:true }) once + getComponentMeta(diskFile) for every plant",
  },
  "verter-component-meta": {
    label: "@verter/component-meta",
    exactPath:
      "openComponentMetaSession({ root, tsconfig }) once + getComponentMeta(diskFile) for every plant; no updateFile overlay",
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

function preparePlantRoot(entrypoint) {
  const cleanupRoot = join(
    rootDir,
    "work",
    "component-meta-validity",
    `${process.pid}-${entrypoint}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const relativeFiles = COMPONENT_META_VALIDITY_PLANTS.map((plant) =>
    join(plant.id, plant.componentFile),
  );
  // Reuse the timed generated surface's staging helper, including its compiler
  // options, Vue resolution, package marker and entirely disk-backed layout.
  const workDir = prepareTypecheckDir(
    COMPONENT_META_CASES_ROOT,
    relativeFiles,
    cleanupRoot,
    "plants",
  );
  return {
    cleanupRoot,
    workDir,
    files: relativeFiles.map((file) => join(workDir, file)),
  };
}

async function extractVue(workDir, files) {
  const loaded = loadOptional("vue-component-meta");
  if (loaded.error) return { unavailable: loaded.error };
  if (typeof loaded.mod.createChecker !== "function")
    return { unavailable: "createChecker missing" };
  const checker = loaded.mod.createChecker(join(workDir, "tsconfig.json"), {
    forceUseTs: true,
  });
  return files.map((file) =>
    normalizeVolarComponentMeta(checker.getComponentMeta(file), "vue-component-meta"),
  );
}

async function extractVerter(workDir, files) {
  const loaded = loadOptional("@verter/component-meta");
  if (loaded.error) return { unavailable: loaded.error };
  if (typeof loaded.mod.openComponentMetaSession !== "function") {
    return { unavailable: "openComponentMetaSession missing" };
  }
  const sessionConfig = {
    root: workDir.replaceAll("\\", "/"),
    tsconfig: join(workDir, "tsconfig.json").replaceAll("\\", "/"),
  };
  const session = await loaded.mod.openComponentMetaSession(sessionConfig);
  try {
    const output = [];
    for (const file of files) {
      // Exact timed lifecycle: disk-backed lookup only. No updateFile overlay.
      const raw = await session.getComponentMeta(file.replaceAll("\\", "/"));
      output.push(normalizeVolarComponentMeta(raw, "verter-component-meta"));
    }
    return output;
  } finally {
    try {
      session.close();
    } catch {
      /* ignore */
    }
    try {
      loaded.mod.evictComponentMetaSession?.(sessionConfig);
    } catch {
      /* ignore */
    }
    try {
      loaded.mod.shutdownMetaRuntime?.();
    } catch {
      /* ignore */
    }
  }
}

function aggregate(entrypoint, results, reason = null) {
  const passed = results.filter((result) => result.status === "PASS").length;
  const failed = results.filter((result) => result.status === "FAIL").length;
  const unknown = results.filter((result) => result.status === "UNKNOWN").length;
  return {
    schemaVersion: 1,
    suiteVersion: COMPONENT_META_VALIDITY_SUITE_VERSION,
    suiteHash: COMPONENT_META_VALIDITY_SUITE_HASH,
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
    return aggregate(entrypoint, unknownComponentMetaValidityResults(reason), reason);
  }
  const { cleanupRoot, workDir, files } = preparePlantRoot(entrypoint);
  try {
    const extracted =
      entrypoint === "vue-component-meta"
        ? await extractVue(workDir, files)
        : await extractVerter(workDir, files);
    if (extracted?.unavailable) {
      return aggregate(
        entrypoint,
        unknownComponentMetaValidityResults(extracted.unavailable),
        extracted.unavailable,
      );
    }
    if (!Array.isArray(extracted) || extracted.length !== COMPONENT_META_VALIDITY_PLANTS.length) {
      throw new Error(
        `entrypoint returned ${extracted?.length ?? 0}/${COMPONENT_META_VALIDITY_PLANTS.length} plant results`,
      );
    }
    const results = COMPONENT_META_VALIDITY_PLANTS.map((plant, index) => {
      try {
        const score = scoreComponentMetaPlant(extracted[index], plant);
        return score.ok
          ? {
              id: plant.id,
              coverage: plant.coverage,
              status: "PASS",
              phase: "metadata",
              detail: score.message,
              meta: score.metaSummary,
            }
          : {
              id: plant.id,
              coverage: plant.coverage,
              status: "FAIL",
              phase: "metadata",
              detail: score.message,
              meta: score.metaSummary,
            };
      } catch (error) {
        return {
          id: plant.id,
          coverage: plant.coverage,
          status: "FAIL",
          phase: "metadata",
          detail: textError(error),
        };
      }
    });
    return aggregate(entrypoint, results);
  } finally {
    rmSync(cleanupRoot, { recursive: true, force: true });
  }
}

export async function runComponentMetaValidityChild({ entrypoint }) {
  return execute(entrypoint);
}

async function main() {
  const index = process.argv.indexOf("--entrypoint");
  const entrypoint = index >= 0 ? (process.argv[index + 1] ?? "") : "";
  try {
    console.log(
      `${COMPONENT_META_VALIDITY_JSON_PREFIX}${JSON.stringify(await execute(entrypoint))}`,
    );
  } catch (error) {
    const detail = `validity child crashed: ${textError(error)}`;
    const results = COMPONENT_META_VALIDITY_PLANTS.map((plant) => ({
      id: plant.id,
      coverage: plant.coverage,
      status: "FAIL",
      phase: "child",
      detail,
    }));
    console.log(
      `${COMPONENT_META_VALIDITY_JSON_PREFIX}${JSON.stringify(aggregate(entrypoint, results, detail))}`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
