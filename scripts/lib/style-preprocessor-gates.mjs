import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import * as sass from "sass";

import { assertStyleFeature, cssModuleMapping } from "./style-feature-gates.mjs";

/**
 * Sass/SCSS validity is intentionally reported in two separate layers:
 *
 *  1. `exactEntrypoints` asks whether the exact compiler API used by the
 *     benchmark directly accepts an authored lang=scss/lang=sass SFC and
 *     orchestrates preprocessing in that call. Vue's API still loads the
 *     separately installed `sass` package; "exact" does not mean Sass is
 *     implemented inside Vue. An API which returns raw preprocessor syntax is
 *     FAIL/unsupported here, not a false PASS borrowed from the harness.
 *  2. `sharedSassAdapter` feeds byte-identical CSS from the pinned `sass`
 *     dependency into each compiler's public CSS/SFC transform. This proves
 *     downstream Vue scoping, v-bind and CSS Modules integration, but does not
 *     claim that the compiler performed Sass compilation.
 */
export const STYLE_PREPROCESSOR_SUITE_VERSION = "2026-08-20.2";

const CASE_DEFINITIONS = [
  {
    id: "scss-nesting-mixin-scoped",
    lang: "scss",
    attrs: "scoped",
    template: '<div class="pre-scss-host"><span class="pre-scss-child"></span></div>',
    script: "",
    style: `$gap: 7px;
@mixin inset($value) { padding: $value; }
.pre-scss-host {
  @include inset($gap);
  & > .pre-scss-child { border-color: rgb(1, 2, 3); }
}`,
    oracle: "nesting-mixin-scoped",
    hostClass: "pre-scss-host",
    childClass: "pre-scss-child",
    expectedGap: "7px",
    expectedBorderRgb: [1, 2, 3],
  },
  {
    id: "scss-deep-media-scoped",
    lang: "scss",
    attrs: "scoped",
    template: '<div class="pre-scss-deep"><span class="pre-scss-external"></span></div>',
    script: "",
    style: `$minimum: 1px;
.pre-scss-deep {
  @media (min-width: $minimum) {
    &:hover :deep(.pre-scss-external) { color: red; }
  }
}`,
    oracle: "deep-media-scoped",
    hostClass: "pre-scss-deep",
    childClass: "pre-scss-external",
    expectedMediaWidth: "1px",
    expectedColor: "red",
    expectedColorRgb: [255, 0, 0],
  },
  {
    id: "scss-v-bind-scoped",
    lang: "scss",
    attrs: "scoped",
    template: '<div class="pre-scss-bind"><span class="bind-target"></span></div>',
    script: 'const tone = "red"; const theme = { gap: "2px" }',
    style: `.pre-scss-bind {
  & > .bind-target {
    color: v-bind(tone);
    margin-left: v-bind('theme.gap');
  }
}`,
    oracle: "v-bind-scoped",
    hostClass: "pre-scss-bind",
    childClass: "bind-target",
  },
  {
    id: "scss-css-modules",
    lang: "scss",
    attrs: "module",
    template: '<div :class="$style.foo"></div>',
    script: "",
    style: `$accent: rgb(4, 5, 6);
.foo {
  color: $accent;
  &:hover { border-color: $accent; }
}`,
    oracle: "css-modules",
    expectedModuleRgb: [4, 5, 6],
  },
  {
    id: "sass-nesting-mixin-scoped",
    lang: "sass",
    attrs: "scoped",
    template: '<div class="pre-sass-host"><span class="pre-sass-child"></span></div>',
    script: "",
    style: `$gap: 9px
=inset($value)
  padding: $value
.pre-sass-host
  +inset($gap)
  & > .pre-sass-child
    border-color: rgb(7, 8, 9)`,
    oracle: "nesting-mixin-scoped",
    hostClass: "pre-sass-host",
    childClass: "pre-sass-child",
    expectedGap: "9px",
    expectedBorderRgb: [7, 8, 9],
  },
  {
    id: "sass-deep-media-scoped",
    lang: "sass",
    attrs: "scoped",
    template: '<div class="pre-sass-deep"><span class="pre-sass-external"></span></div>',
    script: "",
    style: `$minimum: 2px
.pre-sass-deep
  @media (min-width: $minimum)
    &:hover :deep(.pre-sass-external)
      color: blue`,
    oracle: "deep-media-scoped",
    hostClass: "pre-sass-deep",
    childClass: "pre-sass-external",
    expectedMediaWidth: "2px",
    expectedColor: "blue",
    expectedColorRgb: [0, 0, 255],
  },
  {
    id: "sass-v-bind-scoped",
    lang: "sass",
    attrs: "scoped",
    template: '<div class="pre-sass-bind"><span class="bind-target"></span></div>',
    script: 'const tone = "blue"; const theme = { gap: "3px" }',
    style: `.pre-sass-bind
  & > .bind-target
    color: v-bind(tone)
    margin-left: v-bind('theme.gap')`,
    oracle: "v-bind-scoped",
    hostClass: "pre-sass-bind",
    childClass: "bind-target",
  },
  {
    id: "sass-css-modules",
    lang: "sass",
    attrs: "module",
    template: '<div :class="$style.foo"></div>',
    script: "",
    style: `$accent: rgb(10, 11, 12)
.foo
  color: $accent
  &:hover
    border-color: $accent`,
    oracle: "css-modules",
    expectedModuleRgb: [10, 11, 12],
  },
];

function sourceForPlant(definition, style, { includeLang = true } = {}) {
  const language = includeLang ? ` lang="${definition.lang}"` : "";
  const script = definition.script ? `<script setup>${definition.script}</script>` : "";
  return `<template>${definition.template}</template>${script}<style ${definition.attrs}${language}>${style}</style>`;
}

export const STYLE_PREPROCESSOR_CASES = Object.freeze(
  CASE_DEFINITIONS.map((definition) =>
    Object.freeze({
      ...definition,
      source: sourceForPlant(definition, definition.style),
    }),
  ),
);

export const STYLE_PREPROCESSOR_SUITE_HASH = createHash("sha256")
  .update(JSON.stringify(STYLE_PREPROCESSOR_CASES))
  .digest("hex");

export const STYLE_PREPROCESSOR_OPTIONS = Object.freeze({
  implementation: "sass",
  syntax: Object.freeze({ scss: "scss", sass: "indented" }),
  outputStyle: "expanded",
  quietDeps: true,
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function selectorContaining(css, className) {
  const escaped = escapeRegExp(className);
  return new RegExp(`([^{}]*\\.${escaped}[^{}]*)\\{`, "i").exec(css)?.[1] ?? "";
}

function rulesContaining(css, className) {
  const escaped = escapeRegExp(className);
  return [
    ...String(css).matchAll(new RegExp(`([^{}]*\\.${escaped}[^{}]*)\\{([^{}]*)\\}`, "gi")),
  ].map((match) => ({ selector: match[1].trim(), body: match[2].trim() }));
}

function rgbHex([red, green, blue]) {
  return [red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function colorValuePattern(rgb, keyword = "") {
  const [red, green, blue] = rgb;
  const alternatives = [
    `rgb\\(\\s*${red}\\s*,\\s*${green}\\s*,\\s*${blue}\\s*\\)`,
    `#${rgbHex(rgb)}`,
  ];
  if (keyword) alternatives.push(escapeRegExp(keyword));
  return `(?:${alternatives.join("|")})`;
}

function assertRuleDeclaration(feature, rule, property, valuePattern, context) {
  if (!rule) throw new Error(`${feature}: ${context} rule was not emitted`);
  const declaration = new RegExp(
    `(?:^|;)\\s*${escapeRegExp(property)}\\s*:\\s*${valuePattern}\\s*(?=;|$)`,
    "i",
  );
  if (!declaration.test(rule.body)) {
    throw new Error(`${feature}: ${context} did not preserve ${property}`);
  }
}

function assertNoSassSyntax(feature, css) {
  const forbidden = [
    [/\$[a-z_-][a-z0-9_-]*\s*:/i, "Sass variable declaration"],
    [/@mixin\b/i, "SCSS mixin declaration"],
    [/@include\b/i, "SCSS mixin include"],
    [/^\s*[+=][a-z_-][a-z0-9_-]*\s*\(/im, "indented-Sass mixin syntax"],
    [/#{/i, "Sass interpolation"],
    [/(?:^|[,{])\s*&(?=\s|[.:#>+~[{])/m, "nested parent selector"],
  ];
  for (const [pattern, label] of forbidden) {
    if (pattern.test(css)) throw new Error(`${feature}: emitted CSS still contains ${label}`);
  }
}

function cssVariableForProperty(css, property) {
  return new RegExp(
    `(?:^|[;{])\\s*${escapeRegExp(property)}\\s*:\\s*var\\(\\s*--((?:\\\\.|[a-z0-9_.-])+)\\s*\\)`,
    "i",
  ).exec(css)?.[1];
}

function assertCssVariableExpression(feature, css, js, property, expression) {
  const cssVariable = cssVariableForProperty(css, property);
  if (!cssVariable) {
    throw new Error(`${feature}: ${property} was not rewritten to a CSS variable`);
  }
  // CSS escapes punctuation in a custom-property identifier while the JS
  // string stores the runtime name itself (for example `theme\\.gap` in CSS
  // and `theme.gap` in JS). Compare the decoded identifier.
  const variable = cssVariable.replace(/\\(.)/g, "$1");
  const compactJs = String(js).replace(/\s+/g, "");
  const compactExpression = String(expression).replace(/\s+/g, "");
  const candidates = [variable, cssVariable];
  let entryValue = null;
  for (const candidate of candidates) {
    const key = new RegExp(`(["'])${escapeRegExp(candidate)}\\1:`).exec(compactJs);
    if (!key) continue;
    let index = key.index + key[0].length;
    const start = index;
    let depth = 0;
    let quote = "";
    let escaped = false;
    for (; index < compactJs.length; index++) {
      const character = compactJs[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === quote) quote = "";
        continue;
      }
      if (character === '"' || character === "'" || character === "`") {
        quote = character;
      } else if (character === "(" || character === "[" || character === "{") {
        depth++;
      } else if (character === ")" || character === "]") {
        depth--;
      } else if ((character === "," || character === "}") && depth === 0) {
        break;
      } else if (character === "}") {
        depth--;
      }
    }
    entryValue = compactJs.slice(start, index);
    break;
  }
  if (entryValue === null) {
    throw new Error(`${feature}: JS does not register CSS variable ${variable}`);
  }
  if (!entryValue.includes(compactExpression)) {
    throw new Error(`${feature}: ${variable} was not registered from ${expression}`);
  }
  return variable;
}

export function assertStylePreprocessorPlant(plant, { css, js = "", modules = null }) {
  css = String(css ?? "");
  js = String(js ?? "");
  if (!css) throw new Error(`${plant.id}: no generated CSS`);
  assertNoSassSyntax(plant.id, css);

  if (plant.oracle === "nesting-mixin-scoped") {
    const hostRule = rulesContaining(css, plant.hostClass).find(({ selector }) =>
      new RegExp(`\\.${escapeRegExp(plant.hostClass)}\\[data-v-[a-z0-9]+\\]`, "i").test(selector),
    );
    const childRule = rulesContaining(css, plant.childClass).find(({ selector }) =>
      new RegExp(
        `\\.${escapeRegExp(plant.hostClass)}\\s*>\\s*\\.${escapeRegExp(plant.childClass)}\\[data-v-[a-z0-9]+\\]`,
        "i",
      ).test(selector.replace(/\s+/g, " ")),
    );
    const hostSelector = hostRule?.selector ?? "";
    const childSelector = childRule?.selector ?? "";
    if (
      !new RegExp(`\\.${escapeRegExp(plant.hostClass)}\\[data-v-[a-z0-9]+\\]`, "i").test(
        hostSelector,
      )
    ) {
      throw new Error(`${plant.id}: host selector was not scope-rewritten`);
    }
    if (
      !new RegExp(
        `\\.${escapeRegExp(plant.hostClass)}\\s*>\\s*\\.${escapeRegExp(plant.childClass)}\\[data-v-[a-z0-9]+\\]`,
        "i",
      ).test(childSelector.replace(/\s+/g, " "))
    ) {
      throw new Error(`${plant.id}: nested child selector was not flattened and scoped`);
    }
    assertRuleDeclaration(
      plant.id,
      hostRule,
      "padding",
      escapeRegExp(plant.expectedGap),
      `host mixin (${plant.expectedGap})`,
    );
    assertRuleDeclaration(
      plant.id,
      childRule,
      "border-color",
      colorValuePattern(plant.expectedBorderRgb),
      "nested child",
    );
  }

  if (plant.oracle === "deep-media-scoped") {
    const mediaWidth = escapeRegExp(plant.expectedMediaWidth);
    if (
      !new RegExp(
        `@media\\s*\\((?:min-width\\s*:\\s*${mediaWidth}|width\\s*>=\\s*${mediaWidth})\\)`,
        "i",
      ).test(css)
    ) {
      throw new Error(`${plant.id}: Sass variable did not resolve inside @media`);
    }
    if (/:deep\s*\(|::v-deep/.test(css)) {
      throw new Error(`${plant.id}: Vue :deep() transform was not applied after preprocessing`);
    }
    const childRule = rulesContaining(css, plant.childClass)[0];
    const selector = String(childRule?.selector ?? "").replace(/\s+/g, " ");
    const hostToChild = new RegExp(
      `\\.${escapeRegExp(plant.hostClass)}[^\\s>+~]*\\[data-v-[a-z0-9]+\\][^\\s>+~]*\\s+\\.${escapeRegExp(plant.childClass)}`,
      "i",
    );
    if (!hostToChild.test(selector)) {
      throw new Error(`${plant.id}: local host/deep descendant scoping relationship is wrong`);
    }
    const hostFragment = selector.slice(0, selector.indexOf(`.${plant.childClass}`));
    if (!/:hover/i.test(hostFragment)) {
      throw new Error(`${plant.id}: host :hover was not preserved before the deep descendant`);
    }
    const descendant = selector.slice(selector.indexOf(`.${plant.childClass}`));
    if (/\[data-v-[a-z0-9-]+\]/i.test(descendant)) {
      throw new Error(`${plant.id}: deep descendant was incorrectly scope-constrained`);
    }
    assertRuleDeclaration(
      plant.id,
      childRule,
      "color",
      colorValuePattern(plant.expectedColorRgb, plant.expectedColor),
      "deep descendant",
    );
  }

  if (plant.oracle === "v-bind-scoped") {
    assertStyleFeature("v-bind", { css, js });
    const colorVar = assertCssVariableExpression(plant.id, css, js, "color", "tone");
    const gapVar = assertCssVariableExpression(plant.id, css, js, "margin-left", "theme.gap");
    if (colorVar === gapVar) {
      throw new Error(`${plant.id}: distinct v-bind expressions collapsed onto one CSS variable`);
    }
    const selector = selectorContaining(css, plant.childClass).replace(/\s+/g, " ");
    if (
      !new RegExp(
        `\\.${escapeRegExp(plant.hostClass)}\\s*>\\s*\\.${escapeRegExp(plant.childClass)}\\[data-v-[a-z0-9]+\\]`,
        "i",
      ).test(selector)
    ) {
      throw new Error(`${plant.id}: v-bind host/child selector was not flattened and scoped`);
    }
  }

  if (plant.oracle === "css-modules") {
    assertStyleFeature("css-modules", { css, modules });
    const mapped = modules?.foo ?? modules?.find?.(([name]) => name === "foo")?.[1];
    const rules = rulesContaining(css, mapped);
    const baseRule = rules.find(({ selector }) => !/:hover/i.test(selector));
    const hoverRule = rules.find(({ selector }) => /:hover/i.test(selector));
    const color = colorValuePattern(plant.expectedModuleRgb);
    assertRuleDeclaration(plant.id, baseRule, "color", color, "CSS Modules base selector");
    assertRuleDeclaration(
      plant.id,
      hoverRule,
      "border-color",
      color,
      "CSS Modules nested :hover selector",
    );
  }
}

export function preprocessStylePlant(plant) {
  const result = sass.compileString(plant.style, {
    syntax: STYLE_PREPROCESSOR_OPTIONS.syntax[plant.lang],
    style: STYLE_PREPROCESSOR_OPTIONS.outputStyle,
    quietDeps: STYLE_PREPROCESSOR_OPTIONS.quietDeps,
    url: pathToFileURL(`/style-preprocessor-gate/${plant.id}.${plant.lang}`),
  });
  return {
    css: result.css,
    source: sourceForPlant(plant, result.css, { includeLang: false }),
  };
}

function firstError(errors) {
  const value = errors?.[0];
  return typeof value === "string" ? value : (value?.message ?? String(value ?? "unknown error"));
}

function finishPlantResults(results, exactPath, statusOverride) {
  const passed = results.filter((result) => result.status === "PASS").map((result) => result.id);
  const failures = results
    .filter((result) => result.status === "FAIL")
    .map(({ id, error }) => ({ id, error }));
  const unknown = results
    .filter((result) => result.status === "UNKNOWN")
    .map(({ id, reason, evidence }) => ({ id, reason, ...(evidence ? { evidence } : {}) }));
  const status = statusOverride ?? (failures.length ? "FAIL" : unknown.length ? "UNKNOWN" : "PASS");
  return {
    status,
    ok: status === "PASS",
    exactPath,
    plantCount: STYLE_PREPROCESSOR_CASES.length,
    passed,
    failures,
    unknown,
    results,
  };
}

async function runPlants(exactPath, run) {
  const results = [];
  for (const plant of STYLE_PREPROCESSOR_CASES) {
    try {
      const artifacts = await run(plant);
      assertStylePreprocessorPlant(plant, artifacts);
      results.push({ id: plant.id, lang: plant.lang, status: "PASS" });
    } catch (error) {
      results.push({
        id: plant.id,
        lang: plant.lang,
        status: "FAIL",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return finishPlantResults(results, exactPath);
}

async function compileVuePlant(compiler, plant, preprocessed) {
  const source = preprocessed ? preprocessStylePlant(plant).source : plant.source;
  const filename = `/style-preprocessor-gate/${plant.id}.vue`;
  const parsed = compiler.parse(source, { filename });
  if (parsed.errors?.length) throw new Error(`parse failed: ${firstError(parsed.errors)}`);
  const style = parsed.descriptor.styles[0];
  const options = {
    source: style.content,
    filename,
    id: "data-v-abc12345",
    scoped: style.scoped,
    isProd: true,
    ...(preprocessed
      ? {}
      : {
          preprocessLang: plant.lang,
          preprocessOptions: {
            outputStyle: STYLE_PREPROCESSOR_OPTIONS.outputStyle,
            quietDeps: STYLE_PREPROCESSOR_OPTIONS.quietDeps,
          },
        }),
  };
  const result = style.module
    ? await compiler.compileStyleAsync({ ...options, modules: true })
    : await compiler.compileStyleAsync(options);
  if (result.errors?.length)
    throw new Error(`compileStyleAsync failed: ${firstError(result.errors)}`);
  let js = "";
  if (parsed.descriptor.script || parsed.descriptor.scriptSetup) {
    js = compiler.compileScript(parsed.descriptor, {
      id: "abc12345",
      inlineTemplate: false,
      isProd: true,
    }).content;
  }
  return { css: result.code, js, modules: result.modules ?? null };
}

function vizeModules(plant, result) {
  if (plant.oracle !== "css-modules") return null;
  const match = String(result.code ?? "").match(
    /__cssModules\s*=\s*\{[\s\S]*?["']foo["']\s*:\s*["']([^"']+)["']/,
  );
  return match ? { foo: match[1] } : cssModuleMapping(result);
}

export function normalizeStylePreprocessorBatchRows(result, inputs) {
  const expected = inputs.length;
  if (result?.failedCount) {
    throw new Error(`compileSfcBatchWithResults failed ${result.failedCount}/${expected} inputs`);
  }
  if (result?.errors?.length) {
    throw new Error(
      `compileSfcBatchWithResults returned top-level errors: ${firstError(result.errors)}`,
    );
  }
  const rows = Array.isArray(result) ? result : (result?.results ?? result?.items);
  if (!Array.isArray(rows) || rows.length !== expected) {
    throw new Error(`compileSfcBatchWithResults returned ${rows?.length ?? 0}/${expected} results`);
  }
  return rows.map((row, index) => {
    const value = row?.result ?? row;
    if (row?.errors?.length) {
      throw new Error(
        `compileSfcBatchWithResults result ${index} returned errors: ${firstError(row.errors)}`,
      );
    }
    if (value?.errors?.length) {
      throw new Error(
        `compileSfcBatchWithResults nested result ${index} returned errors: ${firstError(value.errors)}`,
      );
    }
    const expectedPath = inputs[index]?.path;
    for (const actualPath of new Set([row?.path, value?.path].filter(Boolean))) {
      if (expectedPath && actualPath !== expectedPath) {
        throw new Error(
          `compileSfcBatchWithResults result ${index} path mismatch: expected ${expectedPath}, got ${actualPath}`,
        );
      }
    }
    return row?.result ? { ...row, ...value, result: value } : row;
  });
}

async function runSharedSassAdapters({
  compiler35,
  compiler36,
  vizeNative,
  verterNative,
  fervidNative,
  makeVerterHost,
}) {
  const gates = {};
  gates["@vue/compiler-sfc"] = await runPlants(
    "sass.compileString -> @vue/compiler-sfc compileStyleAsync (plain CSS)",
    (plant) => compileVuePlant(compiler35, plant, true),
  );
  if (compiler36) {
    gates["@vue/compiler-sfc-36"] = await runPlants(
      "sass.compileString -> @vue/compiler-sfc-36 compileStyleAsync (plain CSS)",
      (plant) => compileVuePlant(compiler36, plant, true),
    );
  }

  if (!vizeNative?.error && typeof vizeNative.compileSfc === "function") {
    gates["@vizejs/native:compileSfc"] = await runPlants(
      "sass.compileString -> @vizejs/native compileSfc with lang removed",
      (plant) => {
        const preprocessed = preprocessStylePlant(plant);
        const result = vizeNative.compileSfc(preprocessed.source, {
          filename: `/style-preprocessor-gate/${plant.id}.vue`,
          isTs: true,
          scopeId: "data-v-abc12345",
          templateHoistStatic: true,
          templateCacheHandlers: true,
        });
        if (result.errors?.length) throw new Error(firstError(result.errors));
        return { css: result.css, js: result.code, modules: vizeModules(plant, result) };
      },
    );
  }

  if (!vizeNative?.error && typeof vizeNative.compileSfcBatchWithResults === "function") {
    const exactPath =
      "one sass.compileString per style -> @vizejs/native compileSfcBatchWithResults with lang removed";
    const prepared = STYLE_PREPROCESSOR_CASES.map((plant) => ({
      plant,
      preprocessed: preprocessStylePlant(plant),
    }));
    const batchInputs = prepared.map(({ plant, preprocessed }) => ({
      path: `/style-preprocessor-gate/${plant.id}.vue`,
      source: preprocessed.source,
    }));
    let rows;
    try {
      rows = normalizeStylePreprocessorBatchRows(
        vizeNative.compileSfcBatchWithResults(batchInputs, {
          isTs: true,
          templateHoistStatic: true,
          templateCacheHandlers: true,
        }),
        batchInputs,
      );
    } catch (error) {
      rows = null;
      const message = error instanceof Error ? error.message : String(error);
      gates["@vizejs/native:compileSfcBatchWithResults"] = finishPlantResults(
        STYLE_PREPROCESSOR_CASES.map((plant) => ({
          id: plant.id,
          lang: plant.lang,
          status: "FAIL",
          error: `whole batch failed: ${message}`,
        })),
        exactPath,
      );
    }
    if (rows) {
      gates["@vizejs/native:compileSfcBatchWithResults"] = await runPlants(
        exactPath,
        async (plant) => {
          const index = STYLE_PREPROCESSOR_CASES.indexOf(plant);
          const row = rows[index];
          return { css: row.css, js: row.code, modules: vizeModules(plant, row) };
        },
      );
    }
  }

  if (
    !verterNative?.error &&
    typeof verterNative.processStyle === "function" &&
    typeof verterNative.VerterHost === "function"
  ) {
    const host = makeVerterHost({ devMode: false, analysisLevel: "full" });
    try {
      gates["@verter/native"] = await runPlants(
        "sass.compileString -> one newly created host reused for the 8-case compileMany (CSS SFC) + processStyle gate",
        (plant) => {
          const preprocessed = preprocessStylePlant(plant);
          const canonicalId = `/style-preprocessor-gate/${plant.id}.vue`;
          const componentId = createHash("sha256").update(plant.id).digest("hex").slice(0, 8);
          const [render] = host.compileMany(
            [
              {
                canonicalId,
                source: preprocessed.source,
                requestedMode: "stateless",
                componentId,
              },
            ],
            {
              target: "runtime-render",
              defaultMode: "stateless",
              priority: "interactive",
              compileProfile: {
                filename: canonicalId,
                isProduction: true,
                customElement: false,
                ssr: false,
                forceJs: false,
                forceVapor: false,
                sourceMap: false,
                hmrStrategy: "none",
                runtimeModuleName: "vue",
              },
            },
          );
          if (render?.errors?.length) throw new Error(firstError(render.errors));
          const result = verterNative.processStyle(preprocessed.css, {
            scopeId: componentId,
            scoped: plant.attrs.includes("scoped"),
            isModule: plant.attrs.includes("module"),
            filename: canonicalId,
          });
          return {
            css: result.code,
            js: render?.code ?? "",
            modules: result.moduleClasses,
          };
        },
      );
    } finally {
      host?.close?.();
    }
  }

  if (!fervidNative?.error && typeof fervidNative.Compiler === "function") {
    const compiler = new fervidNative.Compiler({ isProduction: true });
    gates["@fervid/napi:compileSync"] = await runPlants(
      "sass.compileString -> @fervid/napi compileSync with lang removed",
      (plant) => {
        const preprocessed = preprocessStylePlant(plant);
        const result = compiler.compileSync(preprocessed.source, {
          id: "abc12345",
          filename: `/style-preprocessor-gate/${plant.id}.vue`,
        });
        if (result.errors?.length) throw new Error(firstError(result.errors));
        return {
          css: (result.styles ?? []).map((style) => style.code ?? "").join("\n"),
          js: result.code,
          modules: cssModuleMapping(result),
        };
      },
    );
    gates["@fervid/napi:compileAsync"] = await runPlants(
      "sass.compileString -> @fervid/napi compileAsync with lang removed",
      async (plant) => {
        const preprocessed = preprocessStylePlant(plant);
        const result = await compiler.compileAsync(preprocessed.source, {
          id: "abc12345",
          filename: `/style-preprocessor-gate/${plant.id}.vue`,
        });
        if (result.errors?.length) throw new Error(firstError(result.errors));
        return {
          css: (result.styles ?? []).map((style) => style.code ?? "").join("\n"),
          js: result.code,
          modules: cssModuleMapping(result),
        };
      },
    );
  }
  return gates;
}

async function runExactVizeBatch(vizeNative) {
  const exactPath =
    "one @vizejs/native compileSfcBatchWithResults call on authored lang=scss/lang=sass SFCs";
  const inputs = STYLE_PREPROCESSOR_CASES.map((plant) => ({
    path: `/style-preprocessor-gate/${plant.id}.vue`,
    source: plant.source,
  }));
  let rows;
  try {
    rows = normalizeStylePreprocessorBatchRows(
      vizeNative.compileSfcBatchWithResults(inputs, {
        isTs: true,
        includeStyles: true,
        templateHoistStatic: true,
        templateCacheHandlers: true,
      }),
      inputs,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return finishPlantResults(
      STYLE_PREPROCESSOR_CASES.map((plant) => ({
        id: plant.id,
        lang: plant.lang,
        status: "FAIL",
        error: `whole authored-language batch failed: ${message}`,
      })),
      exactPath,
    );
  }
  return runPlants(exactPath, (plant) => {
    const row = rows[STYLE_PREPROCESSOR_CASES.indexOf(plant)];
    return { css: row.css, js: row.code, modules: vizeModules(plant, row) };
  });
}

async function runExactVerter(verterNative, makeVerterHost) {
  const exactPath =
    "one newly created host reused for the 8-case authored-language compileMany + processStyle gate";
  const host = makeVerterHost({ devMode: false, analysisLevel: "full" });
  try {
    return await runPlants(exactPath, (plant) => {
      const canonicalId = `/style-preprocessor-gate/${plant.id}.vue`;
      const componentId = createHash("sha256").update(plant.id).digest("hex").slice(0, 8);
      const [render] = host.compileMany(
        [
          {
            canonicalId,
            source: plant.source,
            requestedMode: "stateless",
            componentId,
          },
        ],
        {
          target: "runtime-render",
          defaultMode: "stateless",
          priority: "interactive",
          compileProfile: {
            filename: canonicalId,
            isProduction: true,
            customElement: false,
            ssr: false,
            forceJs: false,
            forceVapor: false,
            sourceMap: false,
            hmrStrategy: "none",
            runtimeModuleName: "vue",
          },
        },
      );
      if (render?.errors?.length) throw new Error(firstError(render.errors));
      const result = verterNative.processStyle(plant.style, {
        scopeId: componentId,
        scoped: plant.attrs.includes("scoped"),
        isModule: plant.attrs.includes("module"),
        filename: canonicalId,
      });
      return {
        css: result.code,
        js: render?.code ?? "",
        modules: result.moduleClasses,
      };
    });
  } finally {
    host?.close?.();
  }
}

function fervidArtifacts(result) {
  if (result.errors?.length) throw new Error(firstError(result.errors));
  return {
    css: (result.styles ?? []).map((style) => style.code ?? "").join("\n"),
    js: result.code,
    modules: cssModuleMapping(result),
  };
}

/**
 * Compute both the exact-API ownership verdict and the common downstream
 * adapter verdict. This is diagnostic coverage; it must not be used to gate
 * the existing timed inline-plain-CSS class.
 */
export async function computeStylePreprocessorGates(tools) {
  const exactEntrypoints = {};
  exactEntrypoints["@vue/compiler-sfc"] = await runPlants(
    "@vue/compiler-sfc compileStyleAsync({ preprocessLang })",
    (plant) => compileVuePlant(tools.compiler35, plant, false),
  );
  if (tools.compiler36) {
    exactEntrypoints["@vue/compiler-sfc-36"] = await runPlants(
      "@vue/compiler-sfc-36 compileStyleAsync({ preprocessLang })",
      (plant) => compileVuePlant(tools.compiler36, plant, false),
    );
  }

  if (!tools.vizeNative?.error && typeof tools.vizeNative.compileSfc === "function") {
    exactEntrypoints["@vizejs/native:compileSfc"] = await runPlants(
      "@vizejs/native compileSfc on authored lang=scss/lang=sass SFC",
      (plant) => {
        const result = tools.vizeNative.compileSfc(plant.source, {
          filename: `/style-preprocessor-gate/${plant.id}.vue`,
          isTs: true,
          scopeId: "data-v-abc12345",
          includeStyles: true,
          templateHoistStatic: true,
          templateCacheHandlers: true,
        });
        if (result.errors?.length) throw new Error(firstError(result.errors));
        return { css: result.css, js: result.code, modules: vizeModules(plant, result) };
      },
    );
  }
  if (
    !tools.vizeNative?.error &&
    typeof tools.vizeNative.compileSfcBatchWithResults === "function"
  ) {
    exactEntrypoints["@vizejs/native:compileSfcBatchWithResults"] = await runExactVizeBatch(
      tools.vizeNative,
    );
  }

  if (
    !tools.verterNative?.error &&
    typeof tools.verterNative.processStyle === "function" &&
    typeof tools.verterNative.VerterHost === "function"
  ) {
    exactEntrypoints["@verter/native"] = await runExactVerter(
      tools.verterNative,
      tools.makeVerterHost,
    );
  }
  if (!tools.fervidNative?.error && typeof tools.fervidNative.Compiler === "function") {
    const compiler = new tools.fervidNative.Compiler({ isProduction: true });
    exactEntrypoints["@fervid/napi:compileSync"] = await runPlants(
      "@fervid/napi compileSync on authored lang=scss/lang=sass SFC",
      (plant) =>
        fervidArtifacts(
          compiler.compileSync(plant.source, {
            id: "abc12345",
            filename: `/style-preprocessor-gate/${plant.id}.vue`,
          }),
        ),
    );
    exactEntrypoints["@fervid/napi:compileAsync"] = await runPlants(
      "@fervid/napi compileAsync on authored lang=scss/lang=sass SFC",
      async (plant) =>
        fervidArtifacts(
          await compiler.compileAsync(plant.source, {
            id: "abc12345",
            filename: `/style-preprocessor-gate/${plant.id}.vue`,
          }),
        ),
    );
  }

  return {
    suiteVersion: STYLE_PREPROCESSOR_SUITE_VERSION,
    suiteHash: STYLE_PREPROCESSOR_SUITE_HASH,
    plantCount: STYLE_PREPROCESSOR_CASES.length,
    plantIds: STYLE_PREPROCESSOR_CASES.map((plant) => plant.id),
    sassVersion: sass.info?.match(/dart-sass\s+([0-9.]+)/i)?.[1] ?? null,
    options: STYLE_PREPROCESSOR_OPTIONS,
    exactEntrypoints,
    sharedSassAdapter: await runSharedSassAdapters(tools),
    classification: {
      exactEntrypoints:
        "Does this exact compiler API directly accept an authored lang=scss/lang=sass SFC and orchestrate preprocessing in that call? Vue still loads the separately installed Sass implementation. Raw/unsupported output is FAIL, semantic success self-clears to PASS, and harness preprocessing is never counted here.",
      sharedSassAdapter:
        "The pinned Sass implementation produced identical plain CSS before each compiler's downstream Vue style transform. PASS proves emitted scoping, v-bind linkage and CSS Modules transform compatibility only; it does not prove runtime $style injection or native Sass support.",
    },
  };
}
