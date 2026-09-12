import { createRequire } from "node:module";
import { computeStyleCorrectnessGates } from "../../../scripts/lib/surfaces/compile.mjs";
import { rootDir } from "./run-cli.mjs";
import { runSourceMapValidityMatrix } from "../../../scripts/lib/source-map-validity-gates.mjs";

const require = createRequire(import.meta.url);
function optional(name) {
  try {
    return require(name);
  } catch (error) {
    return { error: error.message };
  }
}

export async function confirmStyleFeatures(suite) {
  const compiler35 = require("@vue/compiler-sfc");
  const vue36 = optional("@vue/compiler-sfc-36");
  const verterNative = optional("@verter/native");
  const gates = await computeStyleCorrectnessGates({
    compiler35,
    compiler36: vue36.error ? null : vue36,
    vizeNative: optional("@vizejs/native"),
    fervidNative: optional("@fervid/napi"),
    verterNative,
    makeVerterHost(config) {
      const workspaceRoot = rootDir.replaceAll("\\", "/");
      if (verterNative.Workspace && verterNative.VerterHost?.withWorkspace) {
        const workspace = new verterNative.Workspace([workspaceRoot]);
        workspace.configureProjects([{ root: workspaceRoot, workspaceRoot }]);
        return verterNative.VerterHost.withWorkspace(config, workspace);
      }
      return new verterNative.VerterHost(config);
    },
  });
  for (const [tool, gate] of Object.entries(gates)) {
    for (const id of gate.passed)
      suite.pass(`style-${id}`, tool, "selector and declaration semantics preserved");
    for (const failure of gate.failures) suite.fail(`style-${failure.id}`, tool, failure.error);
  }
}

export function confirmSourceMaps(suite) {
  const maps = runSourceMapValidityMatrix(
    ["vdom", "vapor"].flatMap((target) =>
      ["production", "development"].map((env) => ({ target, env, sourceMap: true })),
    ),
  );
  for (const cell of Object.values(maps.matrix))
    for (const [tool, verdict] of Object.entries(cell.entrypoints)) {
      for (const plant of verdict.results) {
        const id = `source-map-${cell.configuration.target}-${cell.configuration.env}-${plant.id}`;
        if (plant.status === "PASS")
          suite.pass(id, tool, "all selected generated positions trace to exact SFC coordinates", {
            traces: plant.traces,
          });
        else if (plant.status === "UNKNOWN") suite.skip(id, tool, plant.failures.join("; "));
        else suite.fail(id, tool, plant.failures.join("; "), { traces: plant.traces });
      }
    }
}
