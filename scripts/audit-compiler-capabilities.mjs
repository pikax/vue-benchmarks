import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as compiler35 from "@vue/compiler-sfc";
import * as compiler36 from "@vue/compiler-sfc-36";
import * as fervidNative from "@fervid/napi";
import * as verterNative from "@verter/native";
import * as vizeNative from "@vizejs/native";

import {
  computeCompileCapabilities,
  computeStyleCorrectnessGates,
  STYLE_FEATURE_CASES,
  STYLE_PREPROCESSOR_CASES,
} from "./lib/surfaces/compile.mjs";
import { computeStylePreprocessorGates } from "./lib/style-preprocessor-gates.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function packageVersion(name) {
  try {
    return JSON.parse(
      readFileSync(join(rootDir, "node_modules", ...name.split("/"), "package.json"), "utf8"),
    ).version;
  } catch {
    return "unavailable";
  }
}

const makeVerterHost = (config) => new verterNative.VerterHost(config);
const tools = {
  compiler35,
  compiler36,
  fervidNative,
  verterNative,
  vizeNative,
  makeVerterHost,
};

const report = {
  schemaVersion: 1,
  auditedAt: new Date().toISOString(),
  packages: Object.fromEntries(
    [
      "@vue/compiler-sfc",
      "@vue/compiler-sfc-36",
      "@vizejs/native",
      "@verter/native",
      "@fervid/napi",
      "sass",
      "oxfmt",
    ].map((name) => [name, packageVersion(name)]),
  ),
  compileCapabilities: computeCompileCapabilities(tools),
  styleCorrectness: await computeStyleCorrectnessGates(tools),
  stylePreprocessors: await computeStylePreprocessorGates(tools),
  interpretation: {
    productionOptions:
      "VDOM response is a ranking capability. Vapor response is an observation because those VDOM transforms may not apply to the Vapor backend.",
    sourceMaps:
      "Raw rows require a JS map. Style-inclusive rows require both JS and CSS maps. This probe checks artifact presence only; all source-map-on rows remain unranked until planted mappings are traced to correct source coordinates.",
    styles: `Style validity requires all ${STYLE_FEATURE_CASES.length} shared CSS semantics plants to pass. They cover scoped/deep/slotted/global selectors, selector-list pseudos, nested at-rules, keyframes, v-bind linkage and CSS Modules without comparing whole generated output. Every plant runs independently; any failure keeps timing visible but excludes that exact entry point from the style-inclusive ranking.`,
    preprocessors: `${STYLE_PREPROCESSOR_CASES.length} Sass/SCSS diagnostic plants report exact-API preprocessing separately from the shared pinned-Sass downstream adapter. An external Sass pass is never credited to a compiler API, and these plants do not gate the separately scoped inline-plain-CSS timing class.`,
    upgrades:
      "This command probes installed behavior. Do not carry its output forward after changing package versions; run it again.",
  },
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
