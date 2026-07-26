import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { collectVueFiles, prepareTypecheckDir, totalBytes } from "../fixtures.mjs";
import { measureVariantsAlternating, timedSync } from "../timing.mjs";

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
  const verterNative = loadOptional("@verter/native");
  const verterMetaPkg = loadOptional("@verter/component-meta");
  const vizeNative = loadOptional("@vizejs/native");

  const variants = [];
  const absFiles = files.map((f) => join(metaDir, f));
  const sources = absFiles.map((path, i) => ({
    path: path.replace(/\\/g, "/"),
    source: readFileSync(path, "utf8"),
    filename: files[i],
  }));

  if (!vueMeta.error) {
    variants.push({
      id: "vue-component-meta",
      label: "vue-component-meta",
      package: "vue-component-meta",
      notes: "createChecker(tsconfig) + getComponentMeta for each .vue file",
      measure: () =>
        timedSync(() => {
          const { createChecker } = vueMeta.mod;
          const checker = createChecker(join(metaDir, "tsconfig.json"), {
            forceUseTs: true,
          });
          for (const file of absFiles) {
            checker.getComponentMeta(file);
          }
        }),
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

  // Prefer native ComponentMetaHost (ships with @verter/native).
  // The separate @verter/component-meta npm package currently publishes without dist/.
  if (!verterNative.error && typeof verterNative.mod.ComponentMetaHost === "function") {
    const { ComponentMetaHost } = verterNative.mod;
    variants.push({
      id: "verter-component-meta-native",
      label: "Verter ComponentMetaHost",
      package: "@verter/native",
      notes:
        "ComponentMetaHost.upsertBase + session.getComponentMeta (protobuf payload). @verter/component-meta TS package is optional/higher-level.",
      measure: () =>
        timedSync(() => {
          // Full cycle per iteration (matches vue-component-meta creating a new checker each run).
          const project = new ComponentMetaHost({ devMode: false });
          for (const f of sources) {
            project.upsertBase(f.path, f.source);
          }
          const session = project.openSession();
          for (const f of sources) {
            session.getComponentMeta(f.path);
          }
          project.shutdown();
        }),
    });
  } else if (!verterMetaPkg.error) {
    variants.push({
      id: "verter-component-meta",
      label: "@verter/component-meta",
      package: "@verter/component-meta",
      notes: "Higher-level package loaded; attempting createChecker-style API",
      measure: () =>
        timedSync(() => {
          const mod = verterMetaPkg.mod;
          const create =
            mod.createChecker ?? mod.createComponentMetaChecker ?? mod.createMetaChecker;
          if (typeof create !== "function") {
            throw new Error(
              `No checker factory on @verter/component-meta. Exports: ${Object.keys(mod).slice(0, 20).join(", ")}`,
            );
          }
          const checker = create(join(metaDir, "tsconfig.json"));
          for (const file of absFiles) checker.getComponentMeta(file);
        }),
    });
  } else {
    variants.push({
      id: "verter-component-meta",
      label: "Verter component-meta",
      package: "@verter/native / @verter/component-meta",
      notes: `Unavailable: native=${verterNative.error ?? "no ComponentMetaHost"}; pkg=${verterMetaPkg.error ?? "n/a"}`,
      skip: true,
    });
  }

  // Vize: unavailable unless a real meta API appears
  if (!vizeNative.error && typeof vizeNative.mod?.extractComponentMeta === "function") {
    variants.push({
      id: "vize-component-meta",
      label: "Vize component-meta",
      package: "@vizejs/native",
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
    `files=${files.length}\nvue-meta=${vueMeta.error ? "err" : "ok"}\nverter-native=${verterNative.error ? "err" : "ok"}\nverter-pkg=${verterMetaPkg.error ? "err" : "ok"}\n`,
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

  const results = await measureVariantsAlternating(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });

  return {
    id: "component-meta",
    label: "Component-meta",
    files: files.length,
    bytes,
    methodology: [
      "Extract component public API metadata (props/events/slots where supported).",
      "Same subset of .vue files for every available tool.",
      "Schema depth and TypeScript program options may differ by tool — timings are throughput, not equivalence.",
      "Measured runs alternate tool order each iteration.",
      "Tools without a real component-meta API are reported as skipped (no substitute workload).",
    ],
    variants: results,
  };
}
