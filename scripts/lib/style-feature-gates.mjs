/**
 * Shared, mandatory CSS/SFC feature plants for style-inclusive compile rows.
 *
 * Keep these independent: the gate reports every failed feature so one early
 * failure (for example v-bind) cannot hide selector-transform gaps later in the
 * list. Checks accept formatting differences but require Vue-equivalent selector
 * semantics.
 */
import { createHash } from "node:crypto";

export const STYLE_FEATURE_SUITE_VERSION = "2026-08-20.1";

export const STYLE_FEATURE_CASES = Object.freeze([
  Object.freeze({
    id: "scoped",
    source: '<template><div class="foo"></div></template><style scoped>.foo{color:red}</style>',
  }),
  Object.freeze({
    id: "deep",
    source:
      '<template><div class="deep-host"><span class="deep-target"></span></div></template><style scoped>.deep-host :deep(.deep-target){color:red}</style>',
  }),
  Object.freeze({
    id: "slotted",
    source:
      "<template><slot></slot></template><style scoped>:slotted(.slot-target){color:red}</style>",
  }),
  Object.freeze({
    id: "global",
    source:
      '<template><div class="global-target"></div></template><style scoped>:global(.global-target){color:red}</style>',
  }),
  Object.freeze({
    id: "v-bind",
    source:
      '<template><div class="foo"></div></template><script setup>const color="red"</script><style>.foo{color:v-bind(color)}</style>',
  }),
  Object.freeze({
    id: "css-modules",
    source:
      '<template><div :class="$style.foo"></div></template><style module>.foo{color:red}</style>',
  }),
  Object.freeze({
    id: "global-mixed-local",
    source:
      '<template><div class="local-host"><div class="global-parent active"><span class="global-child"></span></div><span class="local-tail"></span></div></template><style scoped>.local-host :global(.global-parent.active > .global-child:hover) .local-tail{color:red}</style>',
  }),
  Object.freeze({
    id: "deep-compound",
    source:
      '<template><div class="outer"><div class="deep-host active"><div class="deep-target child"><span class="deep-leaf"></span></div></div></div></template><style scoped>.outer > .deep-host.active:deep(.deep-target.child > .deep-leaf:hover){color:red}</style>',
  }),
  Object.freeze({
    id: "slotted-compound",
    source:
      '<template><div class="slot-host"><slot></slot></div></template><style scoped>.slot-host :slotted(.slot-target.active > .slot-child:hover){color:red}</style>',
  }),
  Object.freeze({
    id: "is-selector-list",
    source:
      '<template><div class="is-host alpha"></div></template><style scoped>.is-host:is(.alpha, .beta:hover){color:red}</style>',
  }),
  Object.freeze({
    id: "where-selector-list",
    source:
      '<template><div class="where-host gamma"></div></template><style scoped>.where-host:where(.gamma, .delta:hover){color:red}</style>',
  }),
  Object.freeze({
    id: "media-scoped",
    source:
      '<template><div class="media-target"></div></template><style scoped>@media (min-width:1px){.media-target:hover{color:red}}</style>',
  }),
  Object.freeze({
    id: "supports-scoped",
    source:
      '<template><div class="supports-target"><span class="supports-child"></span></div></template><style scoped>@supports (display:grid){.supports-target > .supports-child{display:grid}}</style>',
  }),
  Object.freeze({
    id: "scoped-keyframes",
    source:
      '<template><div class="animated"></div></template><style scoped>@keyframes fade{from{opacity:0}to{opacity:1}}.animated{animation:fade 1s ease;animation-name:fade}</style>',
  }),
  Object.freeze({
    id: "v-bind-multiple",
    source:
      '<template><div class="multi"></div></template><script setup>const color="red";const borderColor="blue"</script><style>.multi{color:v-bind(color);border-color:v-bind(borderColor)}</style>',
  }),
  Object.freeze({
    id: "v-bind-quoted",
    source:
      '<template><div class="quoted"></div></template><script setup>const theme={gap:"1px",family:"serif"}</script><style>.quoted{margin-left:v-bind(\'theme.gap\');font-family:v-bind("theme.family")}</style>',
  }),
]);

export const STYLE_FEATURE_SUITE_HASH = createHash("sha256")
  .update(JSON.stringify(STYLE_FEATURE_CASES))
  .digest("hex");

function blockPreludes(css) {
  const preludes = [];
  let start = 0;
  for (let index = 0; index < css.length; index++) {
    const character = css[index];
    if (character === "{") {
      const prelude = css.slice(start, index).trim();
      if (prelude) preludes.push(prelude);
      start = index + 1;
    } else if (character === "}") {
      start = index + 1;
    }
  }
  return preludes;
}

function selectorContaining(css, className) {
  const token = `.${className}`;
  for (const prelude of blockPreludes(String(css))) {
    if (prelude.includes(token)) return prelude;
  }
  return "";
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cssVariableForProperty(css, property) {
  return new RegExp(
    `(?:^|[;{])\\s*${escapeRegExp(property)}\\s*:\\s*var\\(\\s*--([a-z0-9_-]+)\\s*\\)`,
    "i",
  ).exec(css)?.[1];
}

function assertCssVariableExpression(feature, { css, js }, property, expression) {
  const variable = cssVariableForProperty(css, property);
  if (!variable) {
    throw new Error(`${feature}: ${property} was not rewritten to a CSS variable`);
  }
  const entry = new RegExp(`["']${escapeRegExp(variable)}["']\\s*:\\s*([^\\n,}]+)`).exec(js)?.[1];
  const compactEntry = String(entry ?? "").replace(/\s+/g, "");
  const compactExpression = String(expression).replace(/\s+/g, "");
  if (!entry || !compactEntry.includes(compactExpression)) {
    throw new Error(
      `${feature}: JS variable "${variable}" used by ${property} was not registered from ${expression}`,
    );
  }
  return variable;
}

export function assertStyleFeature(feature, { css, js = "", modules = null }) {
  css = String(css ?? "");
  js = String(js ?? "");
  if (!css) throw new Error(`${feature}: no generated CSS`);

  if (feature === "scoped" && !/\.foo\[data-v-[a-z0-9]+\]/i.test(css)) {
    throw new Error(`${feature}: selector was not scope-rewritten`);
  }

  if (feature === "deep") {
    if (/:deep\s*\(|::v-deep/.test(css)) {
      throw new Error(`${feature}: :deep() pseudo-selector was left in generated CSS`);
    }
    if (!/\.deep-host\[data-v-[a-z0-9]+\]\s+\.deep-target(?=\s*[{,:>+~])/i.test(css)) {
      throw new Error(
        `${feature}: scope attribute must remain on .deep-host while .deep-target becomes an unscoped descendant`,
      );
    }
  }

  if (feature === "slotted") {
    if (/:slotted\s*\(|::v-slotted/.test(css)) {
      throw new Error(`${feature}: :slotted() pseudo-selector was left in generated CSS`);
    }
    if (!/\.slot-target\[data-v-[a-z0-9]+-s\]/i.test(css)) {
      throw new Error(
        `${feature}: slotted target must receive the [data-v-…-s] attribute selector`,
      );
    }
  }

  if (feature === "global") {
    if (/:global\s*\(|::v-global/.test(css)) {
      throw new Error(`${feature}: :global() pseudo-selector was left in generated CSS`);
    }
    const selector = selectorContaining(css, "global-target");
    if (!selector) {
      throw new Error(`${feature}: .global-target selector was not emitted`);
    }
    if (/\[data-v-[a-z0-9-]+\]/i.test(selector)) {
      throw new Error(
        `${feature}: global selector was incorrectly constrained by a scope attribute`,
      );
    }
  }

  if (feature === "global-mixed-local") {
    if (/:global\s*\(|::v-global/.test(css)) {
      throw new Error(`${feature}: :global() pseudo-selector was left in generated CSS`);
    }
    const selector = selectorContaining(css, "global-parent");
    if (!selector || !/\.global-parent\.active\s*>\s*\.global-child:hover/.test(selector)) {
      throw new Error(`${feature}: the complete compound global selector was not preserved`);
    }
    if (/\.local-host|\.local-tail|\[data-v-[a-z0-9-]+\]/i.test(selector)) {
      throw new Error(
        `${feature}: local selector fragments or a scope constraint leaked into Vue's global selector`,
      );
    }
  }

  if (feature === "deep-compound") {
    if (/:deep\s*\(|::v-deep/.test(css)) {
      throw new Error(`${feature}: :deep() pseudo-selector was left in generated CSS`);
    }
    const selector = selectorContaining(css, "deep-host").replace(/\s+/g, " ");
    if (!/\.outer\s*>\s*\.deep-host\.active\[data-v-[a-z0-9]+\]/i.test(selector)) {
      throw new Error(`${feature}: the scope attribute was not attached to the compound deep host`);
    }
    if (!/\.deep-target\.child\s*>\s*\.deep-leaf:hover/.test(selector)) {
      throw new Error(`${feature}: the compound/nested selector inside :deep() was not preserved`);
    }
    const deepTarget = selector.slice(selector.indexOf(".deep-target"));
    if (/\[data-v-[a-z0-9-]+\]/i.test(deepTarget)) {
      throw new Error(`${feature}: a selector inside :deep() was incorrectly scope-constrained`);
    }
  }

  if (feature === "slotted-compound") {
    if (/:slotted\s*\(|::v-slotted/.test(css)) {
      throw new Error(`${feature}: :slotted() pseudo-selector was left in generated CSS`);
    }
    const selector = selectorContaining(css, "slot-target").replace(/\s+/g, " ");
    if (
      !/\.slot-host\s+\.slot-target\.active\s*>\s*\.slot-child\[data-v-[a-z0-9]+-s\]:hover/i.test(
        selector,
      )
    ) {
      throw new Error(
        `${feature}: the slotted scope attribute was not attached to the final compound target`,
      );
    }
    if (/\[data-v-[a-z0-9]+\]/i.test(selector)) {
      throw new Error(`${feature}: an ordinary scope attribute leaked into a slotted selector`);
    }
  }

  if (feature === "is-selector-list" || feature === "where-selector-list") {
    const pseudo = feature === "is-selector-list" ? "is" : "where";
    const host = pseudo === "is" ? "is-host" : "where-host";
    const members = pseudo === "is" ? [".alpha", ".beta:hover"] : [".gamma", ".delta:hover"];
    const selector = selectorContaining(css, host).replace(/\s+/g, " ");
    if (!new RegExp(`\\.${host}\\[data-v-[a-z0-9]+\\]:${pseudo}\\(`, "i").test(selector)) {
      throw new Error(`${feature}: the scope attribute was not attached outside :${pseudo}()`);
    }
    const args = new RegExp(`:${pseudo}\\(([^)]*)\\)`, "i").exec(selector)?.[1] ?? "";
    if (!members.every((member) => args.includes(member)) || !args.includes(",")) {
      throw new Error(`${feature}: the complete :${pseudo}() selector list was not preserved`);
    }
    if (/\[data-v-[a-z0-9-]+\]/i.test(args)) {
      throw new Error(
        `${feature}: scope attributes were incorrectly injected into selector-list arguments`,
      );
    }
  }

  if (feature === "media-scoped") {
    const selector = selectorContaining(css, "media-target");
    if (!/@media\s*\(/i.test(css)) {
      throw new Error(`${feature}: @media wrapper was not emitted`);
    }
    if (!/\.media-target\[data-v-[a-z0-9]+\]:hover/i.test(selector)) {
      throw new Error(`${feature}: selector nested in @media was not scope-rewritten`);
    }
  }

  if (feature === "supports-scoped") {
    const selector = selectorContaining(css, "supports-target").replace(/\s+/g, " ");
    if (!/@supports\s*\(/i.test(css)) {
      throw new Error(`${feature}: @supports wrapper was not emitted`);
    }
    if (!/\.supports-target\s*>\s*\.supports-child\[data-v-[a-z0-9]+\]/i.test(selector)) {
      throw new Error(`${feature}: selector nested in @supports was not scope-rewritten`);
    }
  }

  if (feature === "scoped-keyframes") {
    const keyframeName = /@(?:-[a-z]+-)?keyframes\s+([a-z0-9_-]+)/i.exec(css)?.[1];
    if (!keyframeName || keyframeName.toLowerCase() === "fade") {
      throw new Error(`${feature}: scoped keyframe name was not rewritten`);
    }
    const escapedName = escapeRegExp(keyframeName);
    if (!new RegExp(`\\banimation\\s*:\\s*${escapedName}(?=\\s|;|})`, "i").test(css)) {
      throw new Error(`${feature}: animation shorthand does not reference the rewritten keyframe`);
    }
    if (!new RegExp(`\\banimation-name\\s*:\\s*${escapedName}(?=\\s|;|})`, "i").test(css)) {
      throw new Error(`${feature}: animation-name does not reference the rewritten keyframe`);
    }
    const selector = selectorContaining(css, "animated");
    if (!/\.animated\[data-v-[a-z0-9]+\]/i.test(selector)) {
      throw new Error(`${feature}: animated selector was not scope-rewritten`);
    }
  }

  if (feature.startsWith("v-bind")) {
    if (/v-bind\s*\(/.test(css) || !/var\(--[^)]+\)/.test(css)) {
      throw new Error(`${feature}: v-bind() was not rewritten to a CSS variable`);
    }
    if (js && !/(useCssVars|_useCssVars)/.test(js)) {
      throw new Error(`${feature}: JS did not install CSS variables`);
    }
    const cssVars = [...css.matchAll(/var\(\s*--([a-z0-9_-]+)\s*(?:[,)]|$)/gi)].map(
      (match) => match[1],
    );
    for (const cssVar of cssVars) {
      const exactDoubleQuoted = js.includes(`"${cssVar}"`);
      const exactSingleQuoted = js.includes(`'${cssVar}'`);
      const doublePrefixed = js.includes(`"--${cssVar}"`) || js.includes(`'--${cssVar}'`);
      if (doublePrefixed) {
        throw new Error(
          `${feature}: JS registers "--${cssVar}" but Vue's useCssVars runtime adds another -- prefix, so runtime output cannot match emitted CSS var(--${cssVar})`,
        );
      }
      if (js && !exactDoubleQuoted && !exactSingleQuoted) {
        throw new Error(
          `${feature}: generated JS does not register the CSS variable name "${cssVar}" used by emitted CSS`,
        );
      }
    }

    if (feature === "v-bind-multiple") {
      const variables = [
        assertCssVariableExpression(feature, { css, js }, "color", "color"),
        assertCssVariableExpression(feature, { css, js }, "border-color", "borderColor"),
      ];
      if (new Set(variables).size !== variables.length) {
        throw new Error(`${feature}: distinct expressions were collapsed onto one CSS variable`);
      }
    }

    if (feature === "v-bind-quoted") {
      const variables = [
        assertCssVariableExpression(feature, { css, js }, "margin-left", "theme.gap"),
        assertCssVariableExpression(feature, { css, js }, "font-family", "theme.family"),
      ];
      if (new Set(variables).size !== variables.length) {
        throw new Error(
          `${feature}: distinct quoted expressions were collapsed onto one CSS variable`,
        );
      }
    }
  }

  if (feature === "css-modules") {
    const mapped = modules?.foo ?? modules?.find?.(([name]) => name === "foo")?.[1];
    if (!mapped || mapped === "foo" || !css.includes(mapped)) {
      throw new Error(`${feature}: class mapping was not generated or does not match emitted CSS`);
    }
  }
}

export function cssModuleMapping(result) {
  const candidates = [
    result?.modules,
    result?.cssModules,
    result?.moduleClasses,
    ...(result?.styles ?? []).flatMap((style) => [
      style?.modules,
      style?.cssModules,
      style?.moduleClasses,
    ]),
  ];
  for (const value of candidates) {
    if (value instanceof Map) return Object.fromEntries(value);
    if (Array.isArray(value)) return Object.fromEntries(value);
    if (value && typeof value === "object") return value;
  }
  return null;
}
