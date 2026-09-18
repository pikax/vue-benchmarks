/** Capture the unmodified JS/CSS artifacts from each exact compiler API. */
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import postcss from "postcss";
import { vueCompileSfc } from "./surfaces/compile.mjs";
import { assertOnlyAllowedFervidDiagnostics } from "./fervid-diagnostics.mjs";
import {
  SOURCE_MAP_PLANTS,
  SOURCE_MAP_SUITE_VERSION,
  SOURCE_MAP_SUITE_HASH,
} from "./source-map-validity-plants.mjs";
import { judgeSourceMapArtifact } from "./source-map-validity-oracle.mjs";
import { resolveVerterStyleTransform, assertVerterStyleResult } from "./verter-style.mjs";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const PREFIX = "@@SOURCE_MAP_VALIDITY_JSON@@";
const filenameFor = (plant) =>
  join(root, "work", "source-map-plants", `${plant.id}.vue`).replaceAll("\\", "/");
const sourceIdentity = (filename) => {
  const normalized = String(filename ?? "").replaceAll("\\", "/");
  return /^[a-z]:\//i.test(normalized) ? normalized.toLowerCase() : normalized;
};
function assertErrors(result) {
  if (result?.errors?.length || result?.failedCount)
    throw new Error(`compiler errors: ${JSON.stringify(result.errors ?? result.failedCount)}`);
}

export function nativeArtifacts(result, { fervid = false } = {}) {
  if (fervid) assertOnlyAllowedFervidDiagnostics(result, "source-map probe");
  else assertErrors(result);
  const artifacts = [{ kind: "js", code: result?.code, map: result?.map ?? result?.sourceMap }];
  // Vize's styles are parsed input descriptors (`content`), while Fervid's
  // are emitted artifacts (`code`). Never use input CSS as compiler output.
  const compiledStyles = Array.isArray(result?.styles)
    ? result.styles.map((style, styleIndex) => ({ style, styleIndex }))
      .filter(({ style }) => typeof style.code === "string")
    : [];
  if (compiledStyles.length) {
    for (const { styleIndex, style } of compiledStyles)
      artifacts.push({
        kind: "css",
        styleIndex,
        code: style.code,
        map: style.map ?? style.sourceMap,
      });
  } else if (typeof result?.css === "string") {
    artifacts.push({
      kind: "css",
      code: result.css,
      map: result.cssMap ?? result.styleMap ?? result.cssSourceMap,
    });
  }
  return artifacts;
}

async function capture(entrypoint, plants, { target, env }) {
  const vapor = target === "vapor";
  const isProd = env === "production";
  const withStyles = plants[0].workload === "styles";
  if (vapor && ["vue-3.5", "fervid-sync", "fervid-async"].includes(entrypoint))
    return { unavailable: "no Vapor backend" };
  let native;
  const packageName = {
    "vue-3.5": "@vue/compiler-sfc",
    "vue-3.6": "@vue/compiler-sfc-36",
    "vize-single": "@vizejs/native",
    "vize-batch": "@vizejs/native",
    "verter-compile-many": "@verter/native",
    "fervid-sync": "@fervid/napi",
    "fervid-async": "@fervid/napi",
  }[entrypoint];
  if (!packageName) return { unavailable: `unknown entrypoint ${entrypoint}` };
  try {
    native = require(packageName);
  } catch (error) {
    return { unavailable: error.message };
  }
  if (entrypoint.startsWith("vue-")) {
    return {
      rows: plants.map(
        (plant) =>
          vueCompileSfc(native, plant.source, filenameFor(plant), {
            vapor,
            isProd,
            sourceMap: true,
            styles: withStyles,
            componentId: "abc12345",
            captureArtifacts: true,
          }).artifacts,
      ),
    };
  }
  if (entrypoint.startsWith("vize-")) {
    const options = {
      vapor,
      isTs: true,
      templateHoistStatic: isProd,
      templateCacheHandlers: isProd,
    };
    if (entrypoint === "vize-single")
      return {
        rows: plants.map((plant) =>
          nativeArtifacts(
            native.compileSfc(plant.source, {
              ...options,
              filename: filenameFor(plant),
              sourceMap: true,
            }),
          ),
        ),
      };
    const result = native.compileSfcBatchWithResults(
      plants.map((plant) => ({ path: filenameFor(plant), source: plant.source })),
      { ...options, includeSourceMap: true },
    );
    assertErrors(result);
    const rows = result.results ?? result.items;
    if (rows?.length !== plants.length)
      throw new Error("source-map batch result count differs from input count");
    return {
      rows: rows.map((row, index) => {
        if (row.path && sourceIdentity(row.path) !== sourceIdentity(filenameFor(plants[index])))
          throw new Error("source-map batch result path differs from input path");
        assertErrors(row);
        return nativeArtifacts(row.result ?? row);
      }),
    };
  }
  if (entrypoint.startsWith("fervid-")) {
    const compiler = new native.Compiler({ isProduction: isProd, sourceMap: true });
    const compile = (plant) =>
      compiler[entrypoint === "fervid-sync" ? "compileSync" : "compileAsync"](plant.source, {
        id: "abc12345",
        filename: filenameFor(plant),
      });
    // Preserve fan-out for the asynchronous API, including both line endings.
    const results =
      entrypoint === "fervid-sync" ? plants.map(compile) : await Promise.all(plants.map(compile));
    return { rows: results.map((result) => nativeArtifacts(result, { fervid: true })) };
  }
  const workspaceRoot = root.replaceAll("\\", "/");
  const config = { devMode: !isProd, analysisLevel: process.env.VERTER_ANALYSIS_LEVEL || "full" };
  let host;
  try {
    if (native.Workspace && native.VerterHost?.withWorkspace) {
      const workspace = new native.Workspace([workspaceRoot]);
      workspace.configureProjects([{ root: workspaceRoot, workspaceRoot }]);
      host = native.VerterHost.withWorkspace(config, workspace);
    } else host = new native.VerterHost(config);
    const results = host.compileMany(
      plants.map((plant) => ({
        canonicalId: filenameFor(plant),
        source: plant.source,
        requestedMode: "stateless",
        ...(withStyles ? { componentId: "abc12345" } : {}),
      })),
      {
        target: "runtime-render",
        defaultMode: "stateless",
        priority: "interactive",
        compileProfile: {
          isProduction: isProd,
          customElement: false,
          ssr: false,
          forceJs: false,
          forceVapor: vapor,
          sourceMap: true,
          hmrStrategy: isProd ? "none" : "vite",
          runtimeModuleName: "vue",
        },
      },
    );
    if (results?.length !== plants.length)
      throw new Error("source-map compileMany result count differs from input count");
    return {
      rows: results.map((result, index) => {
        if (sourceIdentity(result.canonicalId) !== sourceIdentity(filenameFor(plants[index])))
          throw new Error(
            `source-map compileMany attribution mismatch: ${result.canonicalId} != ${filenameFor(plants[index])}`,
          );
        if (result.cacheHit || result.actualMode !== "stateless")
          throw new Error("source-map compileMany was not first-admission stateless");
        const artifacts = nativeArtifacts(result);
        if (withStyles) {
          const { descriptor } = require("@vue/compiler-sfc").parse(plants[index].source);
          const verterStyle = resolveVerterStyleTransform(native);
          if (!verterStyle) throw new Error("verter exposes no public style transform export");
          descriptor.styles.forEach((style, styleIndex) => {
            const output = verterStyle.transform(style.content, {
              scopeId: "abc12345",
              scoped: style.scoped,
              isModule: false,
              filename: filenameFor(plants[index]),
              sourcemap: true,
            });
            assertErrors(output);
            assertVerterStyleResult(output, verterStyle.name);
            artifacts.push({ kind: "css", styleIndex, code: output.code, map: output.sourceMap });
          });
        }
        return artifacts;
      }),
    };
  } finally {
    host?.close?.();
  }
}

function generatedOffset(artifact, anchor) {
  if (anchor.id.startsWith("css-")) {
    const positions = [];
    postcss
      .parse(artifact.code)
      .walkDecls(anchor.generatedToken, (node) => positions.push(node.source.start.offset));
    if (positions.length !== 1)
      throw new Error(
        `${anchor.id}: expected one generated CSS declaration, got ${positions.length}`,
      );
    return positions[0];
  }
  const file = ts.createSourceFile("generated.ts", artifact.code, ts.ScriptTarget.Latest, true);
  if (file.parseDiagnostics.length)
    throw new Error("generated JavaScript/TypeScript does not parse");
  const matches = [];
  const visit = (node) => {
    if (
      ts.isIdentifier(node) &&
      node.text === anchor.generatedToken &&
      (anchor.selector !== "declaration" ||
        (ts.isVariableDeclaration(node.parent) && node.parent.name === node))
    )
      matches.push(node.getStart(file));
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (matches.length !== 1)
    throw new Error(
      `${anchor.id}: expected one generated ${anchor.selector}, got ${matches.length}`,
    );
  return matches[0];
}

function judgePlant(plant, artifacts) {
  const traces = [],
    failures = [];
  for (const anchor of plant.anchors) {
    try {
      const kind = anchor.id.startsWith("css-") ? "css" : anchor.id;
      const matching = artifacts.filter(
        (artifact) =>
          (artifact.kind === kind || (artifact.kind === "js" && kind !== "css")) &&
          (kind !== "css" ||
            artifact.styleIndex == null ||
            artifact.styleIndex === anchor.styleIndex),
      );
      if (matching.length !== 1)
        throw new Error(
          `${anchor.id}: expected exactly one matching artifact, got ${matching.length}`,
        );
      const artifact = matching[0];
      const offset = generatedOffset(artifact, anchor);
      const result = judgeSourceMapArtifact({
        ...artifact,
        source: plant.source,
        filename: filenameFor(plant),
        anchors: [
          {
            ...anchor,
            generatedOffset: offset,
            originalOffset: plant.source.indexOf(anchor.generatedToken),
          },
        ],
      });
      failures.push(...result.failures.map((failure) => `${anchor.id}: ${failure}`));
      traces.push(...result.traces);
    } catch (error) {
      failures.push(error.message);
    }
  }
  return {
    id: plant.id,
    workload: plant.workload,
    status: failures.length ? "FAIL" : "PASS",
    failures,
    traces,
  };
}

export async function runSourceMapValidityChild({
  entrypoint,
  target = "vdom",
  env = "production",
}) {
  const results = [];
  for (const workload of ["raw", "styles"]) {
    const plants = SOURCE_MAP_PLANTS.filter((plant) => plant.workload === workload);
    try {
      const captured = await capture(entrypoint, plants, { target, env });
      if (captured.unavailable)
        results.push(
          ...plants.map((plant) => ({
            id: plant.id,
            workload,
            status: "UNKNOWN",
            failures: [captured.unavailable],
          })),
        );
      else results.push(...plants.map((plant, index) => judgePlant(plant, captured.rows[index])));
    } catch (error) {
      results.push(
        ...plants.map((plant) => ({
          id: plant.id,
          workload,
          status: "FAIL",
          failures: [error.message],
        })),
      );
    }
  }
  return {
    entrypoint,
    target,
    env,
    suiteVersion: SOURCE_MAP_SUITE_VERSION,
    suiteHash: SOURCE_MAP_SUITE_HASH,
    results,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name, fallback) => {
    const index = process.argv.indexOf(name);
    return index < 0 ? fallback : process.argv[index + 1];
  };
  runSourceMapValidityChild({
    entrypoint: arg("--entrypoint"),
    target: arg("--target", "vdom"),
    env: arg("--env", "production"),
  })
    .then((result) => process.stdout.write(`${PREFIX}${JSON.stringify(result)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack}\n`);
      process.exitCode = 1;
    });
}
