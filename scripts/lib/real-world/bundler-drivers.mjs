/**
 * Bundler drivers — one adapter per bundler family, so the `bundle` surface can
 * compare more than one bundler architecture without pretending they are one.
 *
 * There are three families here and they do NOT share an API:
 *
 * - **vite** (`vite` 8 / `vite7`) — `build()`, Rollup-shaped plugin objects.
 * - **rolldown** — `build()`, Rollup-shaped plugins, but Rolldown's own entry
 *   point rather than Vite's. Vite 8 already bundles with Rolldown; this driver
 *   is Rolldown *without* Vite's plugin pipeline on top, which is what isolates
 *   how much of a Vite number is Vite.
 * - **webpack** (`webpack` 5 / `@rspack/core`) — a config object, a compiler
 *   callback, loaders instead of transform hooks.
 *
 * Every driver must produce the same three things, or the surface cannot compare
 * cells at all: wall-clock, a count of **corpus SFCs that were actually
 * compiled**, and output bytes. And every driver must implement the same
 * externalisation rule — module graph = the corpus, everything else external —
 * because that rule is the only reason a Rollup number and a webpack number are
 * measuring comparable work.
 *
 * ## Cross-family comparisons are grouped apart, always
 *
 * A webpack build and a Vite build of the same corpus differ by far more than
 * their Vue plugin: module runtime, chunk graph, output format, code-splitting
 * defaults. The surface groups by bundler for exactly this reason. Read down a
 * column (same plugin, different bundler) knowing you are looking at bundler
 * architecture, and across a row (same bundler, different plugin) knowing you
 * are looking at the Vue layer. The second is the comparison this repository is
 * for; the first is context.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve as resolvePath } from "node:path";
import { corpusOnlyResolver, customBlockSink, transformCensus } from "./app-shell.mjs";

/** Recursive byte total of an output directory. */
export function dirBytes(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else total += statSync(p).size;
    }
  };
  walk(dir);
  return total;
}

const isVendorPath = (p) => p.split(/[\\/]/).includes("node_modules");

/**
 * Record how much of the corpus a FAILED build had already compiled.
 *
 * Carried on the thrown error because that is the only channel out of a build
 * that did not return. The consumer (`surfaces/bundle.mjs`) uses it to decide
 * whether a failure is attributable to the Vue integration at all: modules
 * compiled and then a failure is the integration's output; zero modules is a
 * build that died before the integration saw an SFC, which this harness cannot
 * attribute either way and therefore publishes as unmeasured.
 */
function attachCensus(error, census) {
  if (error && typeof error === "object") {
    try {
      error.census = census;
    } catch {
      // A frozen error object loses the evidence; the consumer treats a missing
      // census as "unknown", which is the safe reading.
    }
  }
}

/**
 * Is this resolved path a corpus module we want bundled?
 *
 * The corpus copy contains ONLY `.vue` files, so "an existing file outside
 * node_modules" and "a corpus SFC" coincide — with the deliberate exception of
 * intermediate artifacts a plugin writes beside the source (Vize emits
 * `App.vue.ts` sidecars), which also live inside the app dir and must stay
 * internal or the plugin is measured compiling nothing.
 */
function isInternalPath(appDir, abs) {
  if (isVendorPath(abs)) return false;
  const rel = relative(appDir, abs);
  return Boolean(rel) && !rel.startsWith("..") && !isAbsolute(rel);
}

/* -------------------------------------------------------------------------- */
/* Rollup-shaped families (vite, rolldown)                                     */
/* -------------------------------------------------------------------------- */

/**
 * Shared build for anything taking Rollup-shaped plugins and a Vite-shaped
 * `build()` config. `vite`, `vite7` and `rolldown` all qualify.
 */
async function rollupFamilyBuild({ build, factory, appDir, entry, outDir, viteShaped }) {
  const census = transformCensus(appDir);
  const externals = new Set();
  const plugins = [
    corpusOnlyResolver(appDir, { onExternal: (s) => externals.add(s) }),
    factory(),
    census.plugin,
    // After the census, so a sunk block still counts as a transform that
    // happened rather than silently vanishing from totalTransforms.
    customBlockSink(),
  ];

  const started = performance.now();
  try {
    if (viteShaped) {
      await build({
        root: appDir,
        logLevel: "silent",
        configFile: false,
        plugins,
        build: {
          write: true,
          minify: false,
          target: "esnext",
          outDir,
          emptyOutDir: true,
          lib: { entry, formats: ["es"], fileName: "bench" },
          rollupOptions: { treeshake: false },
        },
      });
    } else {
      // Rolldown's own API: Rollup-compatible input/output options, no Vite layer.
      const bundle = await build({
        input: entry,
        plugins,
        treeshake: false,
        output: { dir: outDir, format: "es", minify: false },
      });
      // Rolldown's `build()` writes when `output.dir` is given; older shapes
      // return a bundle needing an explicit write. Handle both without assuming.
      if (bundle && typeof bundle.write === "function") {
        await bundle.write({ dir: outDir, format: "es", minify: false });
      }
      if (bundle && typeof bundle.close === "function") await bundle.close();
    }
  } catch (error) {
    // Attach what the census saw BEFORE the failure. This is the only positive
    // evidence available about whether the Vue integration ran at all, and the
    // bundle surface needs it to tell a codegen defect (modules compiled, then a
    // failure) from a build that died before the integration ever saw an SFC.
    // Without it the surface guessed from the error text, and any guess there
    // either blames a tool for a harness gap or excuses a tool for a real bug.
    attachCensus(error, {
      vueModules: census.state.vueModules.size,
      styleRequests: census.state.styleRequests,
      totalTransforms: census.state.totalTransforms,
    });
    throw error;
  }
  const ms = performance.now() - started;

  return {
    ms,
    vueModules: census.state.vueModules.size,
    styleRequests: census.state.styleRequests,
    totalTransforms: census.state.totalTransforms,
    externals: externals.size,
    outputBytes: dirBytes(outDir),
  };
}

/* -------------------------------------------------------------------------- */
/* webpack family (webpack 5, rspack)                                          */
/* -------------------------------------------------------------------------- */

/**
 * The webpack-family externalisation rule.
 *
 * Webpack has no `this.resolve()` inside an externals callback, so the rule is
 * applied to the raw request rather than to a resolved path. It comes out the
 * same because of how the corpus is laid out — the app directory contains only
 * `.vue` files, so a relative request that does not land on an existing file
 * inside it cannot be corpus code.
 *
 * `?vue` sub-requests are the integrations' own machinery and must never be
 * externalised, or a loader would be measured never compiling a template.
 *
 * What it must NOT do is treat "the request mentions .vue" as "the request is
 * corpus code". Hoppscotch's router does `import("~/pages/_.vue")` — a project
 * ALIAS to a file the corpus copy does not contain — and a blanket
 * `pathPart.endsWith(".vue") ⇒ internal` rule sent that to webpack's resolver,
 * which failed with `Can't resolve '~/pages/_.vue'` after the integration had
 * already compiled all 60 SFCs. Because the transform had run, the bundle surface
 * classified it as ❌ attributable to the integration: three of the four
 * webpack-family integrations blamed for an alias this harness declined to
 * externalise. The Rollup-family driver never had the bug, because it decides on
 * the RESOLVED path.
 */
/**
 * The directory a VIRTUAL module's relative requests are actually relative to.
 *
 * unplugin's webpack adapter serves SFC sub-blocks from
 * `_virtual_<percent-encoded original request>` files directly under the app
 * dir, so webpack hands the externals callback the app ROOT as `context` — and
 * `./basic-date-table.vue`, written in a file four directories deep, stopped
 * resolving ("Can't resolve './basic-date-table.vue' in '<corpus root>'",
 * published as a ❌ against the integration on all three projects that hit it).
 * The virtual filename EMBEDS the real path, so the real directory is
 * recoverable: decode, take the last occurrence of the app root, cut at `.vue`.
 * Case-insensitive matching, case-PRESERVING slice — the recovered path is used
 * for filesystem resolution, which is case-sensitive on posix.
 */
export function issuerRealDir(appDir, issuer) {
  let text = String(issuer ?? "");
  if (!text.includes("_virtual_")) return null;
  if (/%[0-9a-f]{2}/i.test(text)) {
    try {
      text = decodeURIComponent(text);
    } catch {
      return null;
    }
  }
  const clean = text.split("?")[0].split("\\").join("/");
  const root = toPosix(resolvePath(appDir));
  const idx = clean.toLowerCase().lastIndexOf(root.toLowerCase());
  if (idx === -1) return null;
  const embedded = clean.slice(idx);
  const at = embedded.toLowerCase().lastIndexOf(".vue");
  if (at === -1) return null;
  return dirname(embedded.slice(0, at + 4));
}

export function webpackExternals(appDir) {
  return ({ context, request, contextInfo }, callback) => {
    if (!request) return callback();
    // Loader-prefixed and Rollup-virtual requests belong to whoever made them.
    // `-!` is a member of the prefix family (`!`, `!!`, `-!`), and it is the one
    // vue-loader's pitcher uses to re-dispatch every `?vue&type=` block —
    // `-!<templateLoader>!<resource>`. `'-!x'.startsWith('!')` is false, so this
    // guard missed it, every sub-block was externalised as `commonjs -!…`, and
    // vue-loader "compiled" 162 SFCs in 124 ms by compiling none of them: the
    // output was require() stubs, and the two vue-loader cells ranked as the
    // sole baselines of their groups on that basis.
    if (request.startsWith("!") || request.startsWith("-!") || request.startsWith("\0")) {
      return callback();
    }

    // Judge the PATH, not the whole request. A Vue integration's sub-requests
    // arrive as `./App.vue?vue&type=template&id=…&ts=true`, and a rule applied to
    // the raw request string externalised them — the template module then linked
    // as an empty external and every cell failed with "export 'render' was not
    // found ... (module has no exports)". Splitting the query off first makes the
    // rule mean what it says: an SFC is corpus code whatever query is hung off it.
    const pathPart = request.split("?")[0];

    if (pathPart.startsWith(".") || isAbsolute(pathPart)) {
      // A request from a VIRTUAL module is relative to the ORIGINAL file's
      // directory, not to the app root webpack reports — see issuerRealDir.
      const virtualBase = issuerRealDir(appDir, contextInfo?.issuer);
      const abs = resolvePath(virtualBase ?? context ?? appDir, pathPart);
      // The generated entry is the graph's root and never external — without
      // this, the `.vue`-mention gate below externalised the ENTRY itself and
      // every webpack-family cell "built" a 1 kB require stub in silence.
      if (pathPart.endsWith("bench-entry.js")) return callback();
      // A sibling-SFC import WRITTEN INSIDE a virtual module is externalised on
      // purpose: an externals callback can only answer internal/external, not
      // re-base webpack's resolver, and "internal" here means webpack resolves
      // the request against the virtual root and fails — which was published as
      // "Can't resolve './basic-date-table.vue' in '<corpus root>'" against the
      // integration on every project with sibling-SFC imports. The component it
      // names is still compiled: every corpus SFC enters through the entry.
      // (Sub-block requests never take this branch — the prefix and `?vue&`
      // guards above return before it.)
      if (virtualBase && pathPart.includes(".vue") && existsSync(abs)) {
        return callback(null, `commonjs ${request}`);
      }
      // Only requests that MENTION `.vue` may stay internal — corpus SFCs, their
      // sub-requests, and plugin sidecars/virtuals. The staged app now carries
      // the corpus's relative import closure for @vue/compiler-sfc's type
      // resolution (see prepareBundleApp), and without this gate `./alert` would
      // resolve onto the copied `alert.ts` and be BUNDLED — the module graph
      // would stop being exactly the corpus, in this family only. The same gate
      // also kills a phantom this family used to publish as a tool ❌: with
      // `.vue` first in resolve.extensions, a sibling-less `./affix` resolved to
      // `affix.vue` ITSELF, and the circular self-import surfaced as
      // "export 'affixEmits' was not found" against whichever integration was in
      // the cell. (Same rule as the Rollup-family resolver, stated there too.)
      if (pathPart.includes(".vue")) {
        for (const candidate of [abs, `${abs}.vue`, `${abs}.ts`, `${abs}.js`]) {
          if (existsSync(candidate) && isInternalPath(appDir, candidate)) return callback();
        }
        // Nothing on disk — but an integration's VIRTUAL sub-request lands here
        // too, and it must stay internal or the integration is measured compiling
        // nothing. EXACTLY two shapes qualify: an SFC path inside the app dir
        // that a plugin invented (`_virtual_…Banner.vue%3Fvue%26type%3Dscript…`),
        // and a sidecar beside the source (`App.vue.ts`). A plain `./x.vue` that
        // failed the existence probe is NEITHER — it is a real reference webpack
        // will try to resolve from THIS context and fail ("Can't resolve
        // './date-table.vue' in '<corpus root>'", a dynamic import whose
        // ContextModule carries no issuer to recover the real base from), so it
        // is externalised like every other unreachable-from-here module.
        if (
          isInternalPath(appDir, abs) &&
          (pathPart.includes("_virtual_") || /\.vue\.[a-z]+$/i.test(pathPart))
        ) {
          return callback();
        }
      }
      // A relative import that is not SFC machinery: a sibling `.ts` helper
      // (copied for the compiler, external to the graph) or something the corpus
      // never contained. External, exactly as in the Rollup-family driver.
      return callback(null, `commonjs ${request}`);
    }
    // Bare specifier: `vue`, `@vueuse/core`, `~icons/…`, and a project alias such
    // as `~/pages/_.vue`. Always external — see the docblock.
    return callback(null, `commonjs ${request}`);
  };
}

const toPosix = (p) => String(p).split("\\").join("/");

/**
 * Which corpus SFC did this webpack module come out of?
 *
 * Returns the SFC's absolute path (POSIX-separated, lower-cased for keying) or
 * `null` when the module is not corpus code. The census counts DISTINCT return
 * values, so this function is what decides whether one component counts once.
 *
 * The percent-decoding is the load-bearing part. unplugin's webpack adapter
 * serves an SFC's sub-blocks from its own virtual filesystem under a filename
 * that is the ENTIRE original request percent-encoded and appended to a
 * `_virtual_` prefix inside the app dir:
 *
 *   <appDir>/_virtual_D%3A%5C…%5CBanner.vue%3Fvue%26type%3Dscript%26lang.ts
 *
 * Keyed raw, that is a different string from `<appDir>/components/app/Banner.vue`,
 * so `webpack × unplugin-vue` reported **6 of 3** corpus SFCs compiled — the
 * source module and its virtual script block counted as two components. That is
 * not a harmless over-count: the corpus-compile gate anchors on the BEST cell for
 * the bundler, so a doubled challenger raises the bar above the corpus and
 * UNRANKS the vue-loader baseline for compiling "too few". The harness would have
 * bracketed the reference implementation on the strength of its own arithmetic.
 */
export function sfcKeyForWebpackModule(appDir, resource) {
  let text = String(resource ?? "");
  if (/%[0-9a-f]{2}/i.test(text)) {
    try {
      text = decodeURIComponent(text);
    } catch {
      // A malformed escape means keep the raw string: an unreadable id must not
      // throw out of a census, it just does not resolve to a corpus SFC.
    }
  }
  const clean = toPosix(text.split("?")[0]);
  const at = clean.toLowerCase().lastIndexOf(".vue");
  if (at === -1) return null;
  const path = clean.slice(0, at + 4);

  // The decoded virtual id EMBEDS the real absolute path after the `_virtual_`
  // prefix, so the app dir occurs twice. The last occurrence is the real file.
  const root = toPosix(appDir);
  const idx = path.toLowerCase().lastIndexOf(root.toLowerCase());
  const abs = idx === -1 ? path : path.slice(idx);
  if (!isInternalPath(appDir, abs)) return null;
  return abs.toLowerCase();
}

/**
 * Count corpus SFCs a webpack-family compilation actually processed.
 *
 * Read off the compilation's module list rather than from a counting loader:
 * a loader would only see what the loader chain was configured for, which
 * differs between vue-loader and the unplugin variants, so it would count a
 * different thing per cell. Keyed on the source SFC so one component is one
 * unit regardless of how many sub-requests it was split into — see
 * `sfcKeyForWebpackModule` for the id shapes that has to survive.
 */
export function webpackCensus(appDir, stats) {
  const seen = new Set();
  let styleRequests = 0;
  let externalizedVueRequests = 0;
  const compilation = stats?.compilation;
  if (!compilation?.modules) {
    return { vueModules: 0, styleRequests: 0, externalizedVueRequests: 0 };
  }
  for (const mod of compilation.modules) {
    const resource = mod?.resource ?? mod?.request ?? mod?.identifier?.() ?? "";
    // An EXTERNAL module was not compiled by anyone — it is a require() stub.
    // Counting externals into `seen` is how the broken vue-loader cells passed
    // this census at 162/162: the facade module names the SFC, the externalised
    // sub-blocks name it again, and the Set collapses the difference between
    // "compiled" and "stubbed out". Externals that mention SFC machinery are
    // counted SEPARATELY as leaks, because a healthy cell externalises zero of
    // its own sub-requests — that is what webpackExternals' prefix guard is for.
    const isExternal =
      typeof mod?.externalType === "string" ||
      (typeof mod?.identifier === "function" && String(mod.identifier()).startsWith("external "));
    if (isExternal) {
      const req = String(mod?.request ?? mod?.identifier?.() ?? "");
      // Only SUB-REQUEST shapes count as leaks — a `?vue&type=` query (raw or
      // percent-encoded) or a loader-chain request. A PLAIN `./sibling.vue`
      // external is a deliberate graph-edge choice (virtual-issuer imports are
      // externalised because webpack would resolve them from the wrong base —
      // see webpackExternals), and counting it here would have this gate unrank
      // the cell for the exact behaviour the externals rule prescribes.
      if (req.includes("type=") || /\.vue\?vue|%3Fvue/i.test(req) || req.includes("!")) {
        externalizedVueRequests++;
      }
      continue;
    }
    const key = sfcKeyForWebpackModule(appDir, resource);
    if (!key) continue;
    seen.add(key);
    // Decoded, so the style sub-request is recognised whether the query is a
    // real query string or baked into a virtual filename.
    let decoded = String(resource);
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      /* keep raw */
    }
    if (decoded.includes("type=style")) styleRequests++;
  }
  return { vueModules: seen.size, styleRequests, externalizedVueRequests };
}

/**
 * Any module whose content came out of an SFC — however the integration named it.
 *
 * Three naming schemes are in play and they must all land in the same rule, or
 * the rule becomes a per-integration variable:
 *
 *   @vitejs/plugin-vue / vue-loader   `…/App.vue`               (query separate)
 *   vue-loader sub-request            `…/App.vue` + `?vue&type=script&lang.ts`
 *   unplugin (webpack adapter)        `…/_virtual_<percent-encoded absolute path
 *                                      including `.vue%3Fvue%26type%3Dscript…
 *                                      %26lang.ts`>`
 *
 * The third is the one that broke: unplugin's webpack adapter serves the script
 * block from its own virtual filesystem under a filename that is the whole
 * original request PERCENT-ENCODED, so `?` becomes `%3F` and the path ends in
 * `lang.ts` rather than `.vue`. Hence `[?%]` as well as `$`.
 */
const SFC_DERIVED_RE = /\.vue($|[?%])/i;

/**
 * A `<style>` block sub-request, in the PATH.
 *
 * The same marker exists in two places depending on the integration: as a real
 * query (`?vue&type=style&…`, matched with `resourceQuery`) or percent-encoded
 * into a virtual filename (`…%26type%3Dstyle%26…`, matched here). Both have to be
 * recognised, or a rule aimed at one silently applies to the other.
 */
const STYLE_SUBREQUEST_PATH_RE = /type%3Dstyle/i;
const STYLE_SUBREQUEST_QUERY_RE = /type=style/;

/**
 * CUSTOM-BLOCK sub-requests — any `type=` that is not script/template/style.
 * Stored as `asset/source` exactly like the style rules below and for the same
 * fairness reason: the shell configures no consumer for a project's custom
 * blocks (naive-ui `<markdown>`, vuetify `<playground-*>`), so handing one to
 * swc as TypeScript fails on the first line of prose and reads as a
 * Vue-integration defect. The Rollup-shaped families get the same treatment
 * from `customBlockSink` in app-shell.mjs.
 */
const CUSTOM_BLOCK_QUERY_RE = /[?&]type=(?!script(?:&|$)|template(?:&|$)|style(?:&|$))/;
const CUSTOM_BLOCK_PATH_RE = /type%3D(?!script|template|style)/i;

/**
 * The TypeScript rule shared by every webpack-family cell.
 *
 * Rspack has swc built in (`builtin:swc-loader`, no extra dependency); webpack 5
 * gets the same compiler through `swc-loader`. Same transform, same options, so
 * the TS cost is a constant across the cells being compared rather than a
 * per-cell variable.
 *
 * ## Why the SFC rule must be the POST one, and must be the ONLY one
 *
 * webpack builds a module's loader array as `[…post, …normal, …pre]` and runs the
 * normal phase from the END backwards, so the FIRST element runs LAST. A `post`
 * loader therefore sees the output of every normal loader — which is exactly what
 * a TypeScript transform on a Vue integration's output has to do.
 *
 * The bug this replaced: the plain-`.ts` rule also carried `|lang\.ts`, and
 * unplugin's virtual script-block filename ends in `lang.ts`. So swc matched that
 * module as a NORMAL loader — and unplugin's own load loader is a normal rule too,
 * `unshift`ed to the front of `module.rules`, which puts it at a LOWER index and
 * therefore LATER in execution. The order came out: swc on unplugin's empty vfs
 * stub, then unplugin's load loader returning the real TypeScript, then nothing.
 * webpack's parser got `setup(__props: any, …)` and every `webpack × unplugin`
 * cell failed with `Module parse failed: Unexpected token`, while the vue-loader
 * cells passed — a difference in how each integration NAMES its output, published
 * as a difference in capability.
 *
 * So SFC-derived modules are matched in one place, as `post`, and are EXCLUDED
 * from the plain-`.ts` rule: a normal-phase match on the same module is what let
 * a lower-indexed normal loader run after it.
 *
 * `type=style` sub-requests are excluded and handled by the rules below instead. A
 * `<style>` block is not TypeScript and handing one to a TypeScript parser fails
 * on the first selector — it would look like a Vue-integration defect and be
 * nothing of the kind. `type=template` is NOT excluded, because a template
 * compiled from a `lang="ts"` SFC can carry type annotations and does need the
 * transform.
 *
 * ## Style blocks are stored, not compiled, and every cell is treated the same
 *
 * This family has no CSS pipeline: no css-loader, no sass-loader, nothing that
 * turns a `<style lang="scss">` block into CSS. So SFC style sub-requests are
 * given webpack's `asset/source` module type, which stores the integration's
 * style output as a string module instead of parsing it.
 *
 * The reason is a fairness one, not a convenience one. 39 of Hoppscotch's 293
 * SFCs carry a `<style>` block, most of them `lang="scss"`. Without this rule the
 * style module is parsed as JavaScript, so every cell except vue-loader failed on
 * `.share-link { @apply … }` — and because the Vue transform HAD already run by
 * then, `attributeBuildFailure` classified it as ❌ attributable to the
 * integration. That is the harness publishing a verdict about a tool for a
 * pipeline the harness never configured. vue-loader escaped it only because its
 * pitcher yields an inert module when no CSS rule matches, which is a property of
 * vue-loader rather than a capability the others lack.
 *
 * What this does NOT do is compile the CSS. That is a real difference from the
 * Vite-family cells, where Vite's built-in CSS handling (and `sass`) does compile
 * it — stated in the surface methodology rather than papered over, and identical
 * for every cell in this family.
 */
export function tsRules(isRspack) {
  const swcOptions = {
    jsc: {
      parser: { syntax: "typescript", tsx: false, decorators: true },
      target: "esnext",
    },
  };
  const loader = isRspack ? "builtin:swc-loader" : "swc-loader";
  const base = isRspack ? { type: "javascript/auto" } : {};

  return [
    // Real `.ts` modules in the graph. SFC-derived ones are handled by the post
    // rule below and must NOT also match here — see the docblock.
    { test: /\.ts$/, exclude: SFC_DERIVED_RE, loader, options: swcOptions, ...base },

    // Everything an SFC turned into, whatever the integration called it, as the
    // single POST loader so swc sees the integration's OUTPUT rather than the raw
    // `<template>`. Style AND custom blocks are excluded — neither is
    // TypeScript, and both have asset/source rules below.
    {
      test: SFC_DERIVED_RE,
      exclude: [STYLE_SUBREQUEST_PATH_RE, CUSTOM_BLOCK_PATH_RE],
      resourceQuery: { not: [STYLE_SUBREQUEST_QUERY_RE, CUSTOM_BLOCK_QUERY_RE] },
      enforce: "post",
      loader,
      options: swcOptions,
      ...base,
    },

    // Style sub-requests, both id shapes. Two rules because webpack ANDs a
    // rule's conditions, and the marker lives in the query for one shape and in
    // the path for the other.
    { test: SFC_DERIVED_RE, resourceQuery: STYLE_SUBREQUEST_QUERY_RE, type: "asset/source" },
    { test: STYLE_SUBREQUEST_PATH_RE, type: "asset/source" },

    // Custom-block sub-requests, same two shapes, same storage — see the
    // CUSTOM_BLOCK_QUERY_RE docblock.
    { test: SFC_DERIVED_RE, resourceQuery: CUSTOM_BLOCK_QUERY_RE, type: "asset/source" },
    { test: CUSTOM_BLOCK_PATH_RE, type: "asset/source" },
  ];
}

/**
 * Static prefixes of EXPRESSION dynamic imports whose context directory does
 * not exist in the staged app.
 *
 * `import(\`../../api-generator/dist/api/\${name}.json\`)` becomes a webpack
 * ContextModule, which never consults the externals callback — so when the
 * prefix directory is absent from the staged copy (vuetify's is a build
 * artifact of the real repo), the context RESOLUTION fails the build for every
 * integration in the family at once, baseline included. Criticality parser
 * flags were tried first and are a red herring: they demote the "Critical
 * dependency" WARNING, not the resolution error. An IgnorePlugin keyed on
 * exactly these corpus-derived prefixes is the mechanism that works on both
 * bundlers (verified empirically), and it mirrors what the Rollup family does
 * with the same import: the specifier survives to runtime unresolved.
 *
 * Corpus-DERIVED, not corpus-hardcoded: the scan reads the staged sources, so
 * any project with the idiom gets the same treatment, and a prefix that DOES
 * resolve in the app is never ignored — a real missing module still fails.
 * Cached per appDir: the scan reads every staged source once (~1700 files),
 * and gate + measured runs would repeat it per build.
 */
const contextPrefixCache = new Map();

export function unresolvableContextPrefixes(appDir) {
  if (contextPrefixCache.has(appDir)) return contextPrefixCache.get(appDir);
  const EXPR_IMPORT_RE = /import\s*\(\s*`([^`$]*?)\$\{/g;
  const prefixes = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        walk(p);
        continue;
      }
      if (!/\.(vue|[cm]?[jt]sx?)$/.test(entry.name)) continue;
      let source;
      try {
        source = readFileSync(p, "utf8");
      } catch {
        continue;
      }
      for (const m of source.matchAll(EXPR_IMPORT_RE)) {
        const raw = m[1];
        if (!raw.startsWith(".")) continue;
        // The context directory is the prefix up to its last slash.
        const dirPart = raw.slice(0, raw.lastIndexOf("/") + 1) || raw;
        const abs = resolvePath(dirname(p), dirPart);
        if (!existsSync(abs)) {
          // BOTH spellings: inside an SFC pipeline the context dependency can
          // arrive at IgnorePlugin already RESOLVED to an absolute directory
          // (observed: the raw `../../../../api-generator/dist/api` prefix
          // matched in a plain-JS probe but the staged vuetify build presented
          // `D:/…/vuetify-docs/packages/api-generator/dist/api/`), so the raw
          // prefix alone never matched and the family kept failing.
          prefixes.add(dirPart.replace(/\/$/, ""));
          prefixes.add(abs.replace(/\\/g, "/").replace(/\/$/, ""));
        }
      }
    }
  };
  try {
    walk(appDir);
  } catch {
    // An unreadable staged dir surfaces in the build itself; the scan must not
    // be the thing that fails a cell.
  }
  const result = [...prefixes];
  contextPrefixCache.set(appDir, result);
  return result;
}

async function webpackFamilyBuild({
  compiler: makeCompiler,
  integration,
  appDir,
  entry,
  outDir,
  isRspack,
  IgnorePlugin,
}) {
  const config = {
    mode: "development",
    devtool: false,
    entry,
    context: appDir,
    output: { path: outDir, filename: "bench.js", clean: true },
    resolve: { extensions: [".vue", ".ts", ".js", ".mjs"] },
    // Every SFC in these corpora is `<script setup lang="ts">`, so the script
    // block a Vue integration emits is TypeScript. Vite ships a TS transform
    // (esbuild on 7, oxc on 8); the webpack family does not, and without one
    // every cell here died with "Module parse failed: Unexpected token" on the
    // first type annotation — which reads as a Vue-integration failure and is
    // nothing of the kind.
    //
    // swc is used for both bundlers so the transform is the SAME implementation
    // in every webpack-family cell, and `.vue?…lang.ts` sub-requests are matched
    // as well as plain `.ts`, because that is the form the script block arrives
    // in. This does mean webpack-family rows include a TS transform the Vite rows
    // get internally — an inherent difference between the families, stated in the
    // surface methodology rather than papered over.
    // CommonJS externals and output for this family. The Vue integrations here
    // emit helper imports that do not survive webpack's strict ESM linking, and
    // the output format is not what is being measured — it only has to be the
    // SAME for every cell in the family, which it is. (Cross-family rows are
    // grouped apart for exactly this class of reason.)
    externalsType: "commonjs",
    externals: [webpackExternals(appDir)],
    // Match the Rollup-family cells: no minification, and nothing removed for
    // being unreachable. A bundler must not be able to win by discarding corpus
    // modules.
    optimization: {
      minimize: false,
      usedExports: false,
      sideEffects: false,
      concatenateModules: false,
      splitChunks: false,
    },
    module: { rules: tsRules(isRspack) },
    // One IgnorePlugin per unresolvable expression-import prefix — see
    // unresolvableContextPrefixes. Identical for every integration in the
    // family; a prefix that resolves in the app is never here.
    plugins: (IgnorePlugin ? unresolvableContextPrefixes(appDir) : []).map(
      (prefix) =>
        new IgnorePlugin({
          // Separator-tolerant: the same prefix arrives with / or \ depending
          // on which loader chain created the context dependency.
          resourceRegExp: new RegExp(
            `^${prefix
              .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
              .replace(/\//g, "[\\\\/]")}`,
          ),
        }),
    ),
    stats: "errors-only",
    infrastructureLogging: { level: "error" },
  };

  // MUST be awaited. The integration `apply` functions are async, so calling
  // this bare turned any plugin-construction error into an unhandled rejection
  // that killed the whole process — losing every other cell's results instead of
  // producing one ❌ row for the cell that failed.
  await integration.apply(config);

  const started = performance.now();
  const stats = await new Promise((resolveP, rejectP) => {
    const compiler = makeCompiler(config);
    compiler.run((err, result) => {
      const finish = () => {
        // Same census-on-failure contract as the Rollup-family driver. Read off
        // the compilation when there is one: a build with errors still has a
        // module list, so it can say whether corpus SFCs were compiled before the
        // failure. A compiler-level `err` has no compilation, and a zero census is
        // then the honest answer rather than a claim.
        if (err) {
          attachCensus(err, { vueModules: 0, styleRequests: 0, totalTransforms: 0 });
          return rejectP(err);
        }
        if (result?.hasErrors?.()) {
          const json = result.toJson({ errors: true, all: false });
          const first = json.errors?.[0];
          const failure = new Error(first?.message ?? "webpack build failed");
          const partial = webpackCensus(appDir, result);
          attachCensus(failure, {
            ...partial,
            totalTransforms: result?.compilation?.modules?.size ?? 0,
          });
          return rejectP(failure);
        }
        resolveP(result);
      };
      if (compiler.close) compiler.close(() => finish());
      else finish();
    });
  });
  const ms = performance.now() - started;

  const census = webpackCensus(appDir, stats);
  return {
    ms,
    vueModules: census.vueModules,
    styleRequests: census.styleRequests,
    externalizedVueRequests: census.externalizedVueRequests,
    totalTransforms: stats?.compilation?.modules?.size ?? 0,
    // Webpack reports externals as modules; counting them precisely would need a
    // second pass over the module list for no benefit, so this is left out
    // rather than guessed at.
    externals: 0,
    outputBytes: dirBytes(outDir),
  };
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Vue integrations, keyed by family.
 *
 * `apply` for the webpack family mutates the config, because that is the only
 * way webpack accepts a Vue integration: vue-loader is a loader rule plus a
 * plugin, not a transform hook.
 */
export const INTEGRATIONS = {
  vite: [
    {
      id: "plugin-vue",
      label: "@vitejs/plugin-vue",
      package: "@vitejs/plugin-vue",
      spec: "@vitejs/plugin-vue",
      strategy: "lazy per-module transform",
      notes: "The official Vite Vue plugin — the reference implementation for this surface.",
    },
    {
      id: "unplugin-vue",
      label: "unplugin-vue",
      package: "unplugin-vue",
      spec: "unplugin-vue/vite",
      strategy: "lazy per-module transform",
      notes: "Bundler-agnostic build of the official @vue/compiler-sfc pipeline.",
    },
    {
      id: "vize",
      label: "@vizejs/vite-plugin",
      package: "@vizejs/vite-plugin",
      spec: "@vizejs/vite-plugin",
      strategy: "eager native batch pre-compile",
      // Describes WHAT it does and WHERE the time lands. It deliberately stops
      // short of claiming the total work is equivalent to the lazy plugins' —
      // that would be an excuse for a row rather than a description of it, and
      // this surface has not measured it. The whole pre-pass is inside the timed
      // region either way, so the wall-clock is directly comparable; only the
      // per-module attribution differs.
      notes:
        "Different strategy: compiles the whole corpus in a native batch when the plugin initialises, then serves each module from that result, handing the bundler `.vue.ts` sidecars rather than `.vue` ids. The pre-pass is inside the timed region, so the total is comparable to the lazy rows; what is not comparable is per-module cost, since this row front-loads what the others spread out.",
    },
    {
      id: "verter",
      label: "@verter/unplugin",
      package: "@verter/unplugin",
      spec: "@verter/unplugin/vite",
      strategy: "lazy per-module transform",
      notes: "Verter's universal bundler plugin (unplugin; vite entry point).",
    },
  ],
  rolldown: [
    {
      id: "unplugin-vue",
      label: "unplugin-vue",
      package: "unplugin-vue",
      spec: "unplugin-vue/rolldown",
      strategy: "lazy per-module transform",
      notes: "Official compiler pipeline on Rolldown directly, with no Vite layer above it.",
    },
    {
      id: "verter",
      label: "@verter/unplugin",
      package: "@verter/unplugin",
      spec: "@verter/unplugin/rolldown",
      strategy: "lazy per-module transform",
      notes: "Verter on Rolldown directly, with no Vite layer above it.",
    },
  ],
  webpack: [
    {
      id: "vue-loader",
      label: "vue-loader",
      package: "vue-loader",
      spec: "vue-loader",
      strategy: "loader chain",
      notes:
        "The official webpack Vue integration — a loader rule plus VueLoaderPlugin. The reference implementation for this family.",
      async apply(config, mod) {
        const { VueLoaderPlugin } = mod;
        config.module.rules.push({ test: /\.vue$/, loader: "vue-loader" });
        config.plugins.push(new VueLoaderPlugin());
      },
    },
    {
      id: "unplugin-vue",
      label: "unplugin-vue",
      package: "unplugin-vue",
      specByBundler: { webpack: "unplugin-vue/webpack", rspack: "unplugin-vue/rspack" },
      strategy: "lazy per-module transform",
      notes: "Official compiler pipeline as an unplugin, so the same code path the Vite rows use.",
      async apply(config, mod) {
        config.plugins.push(mod.default());
      },
    },
    {
      id: "vize",
      label: "@vizejs/rspack-plugin",
      package: "@vizejs/rspack-plugin",
      // rspack only — there is no webpack build of this plugin published.
      specByBundler: { rspack: "@vizejs/rspack-plugin" },
      strategy: "eager native batch pre-compile",
      notes:
        "Vize's native compiler as an Rspack integration: a LOADER rule (`@vizejs/rspack-plugin/loader`) plus the `VizePlugin` class — the same two-part shape vue-loader has, and the setup its README documents. The plugin does not register the SFC loader itself; it clones the config's CSS rules for Vue style sub-requests and adds an swc post-pass for `.vue` TypeScript, both of which need the loader rule to already be there.",
      async apply(config, mod) {
        const Plugin = mod.VizePlugin ?? mod.default;
        if (typeof Plugin !== "function") {
          throw new Error("@vizejs/rspack-plugin exports no VizePlugin");
        }
        // The loader rule is REQUIRED and was the whole bug.
        //
        // This cell used to push `new VizePlugin()` and nothing else, on the note
        // that the plugin "registers its loader rules from its own apply()". It
        // does not. Reading its dist: `applyRuleCloning` searches
        // `module.rules` for a rule whose `use` already names
        // `@vizejs/rspack-plugin/loader` and CLONES that rule's CSS siblings for
        // `?vue&type=style` sub-requests; with no such rule it returns
        // `{applied:false}` and does nothing. The separate TypeScript post-rule
        // it injects is skipped too, because the harness already supplies one.
        //
        // So no loader ever touched an SFC, the raw `<template>` reached
        // rspack's swc post-pass, and the cell failed with
        // `Syntax Error: Expected '>', got ':'` on a template attribute — output
        // that reads exactly like a Vue-compiler defect and was none of it. The
        // README's "Simple Mode" is a `.vue` rule plus the plugin, which is what
        // this now builds.
        //
        // The `oneOf` is required too, and Vize says so itself. Its main loader
        // REFUSES a style sub-request — verbatim: "[vize] Main loader received
        // style sub-request … Use module.rules[].oneOf with resourceQuery
        // branches so style requests are handled by
        // @vizejs/rspack-plugin/style-loader". The plugin can build those
        // branches on its own (`applyRuleCloning`), but only by CLONING a CSS
        // rule already present in the config; this family has no CSS pipeline, so
        // there is nothing to clone and it falls back to `lang=css` branches
        // only. 39 of Hoppscotch's 293 SFCs carry a `<style>` block and most are
        // `lang="scss"`, so every one of them hit the refusal.
        //
        // Written out here rather than left to the plugin, with `autoRules:false`
        // so the plugin does not rewrite the rule underneath: its cloning
        // replaces the rule with `{test, oneOf:[…, mainLoader]}`, and the trailing
        // main-loader branch has no resourceQuery, so it would catch the style
        // request again.
        //
        // Loader order matches the plugin's own: `use` runs right-to-left, so
        // style-loader compiles the block and scope-loader then applies the
        // scope id. The result is stored by the family's `asset/source` rule,
        // exactly as the other integrations' style output is — see `tsRules`.
        config.module.rules.push({
          test: /\.vue$/,
          oneOf: [
            {
              resourceQuery: STYLE_SUBREQUEST_QUERY_RE,
              use: [
                { loader: "@vizejs/rspack-plugin/scope-loader" },
                { loader: "@vizejs/rspack-plugin/style-loader" },
              ],
              type: "asset/source",
            },
            { use: [{ loader: "@vizejs/rspack-plugin/loader" }] },
          ],
        });
        config.plugins.push(new Plugin({ autoRules: false }));
      },
    },
    {
      id: "verter",
      label: "@verter/unplugin",
      package: "@verter/unplugin",
      specByBundler: { webpack: "@verter/unplugin/webpack", rspack: "@verter/unplugin/rspack" },
      strategy: "lazy per-module transform",
      notes: "Verter's universal bundler plugin (unplugin; webpack/rspack entry point).",
      async apply(config, mod) {
        config.plugins.push(mod.default());
      },
    },
  ],
};

/**
 * Bundlers under test.
 *
 * Note on Vite majors: **Vite 8 IS the Rolldown migration** (it depends on
 * `rolldown ~1.1`), and the standalone `rolldown-vite` package is deprecated in
 * its favour. So "Vite vs Rolldown" cannot be benchmarked by installing two
 * Vites; the honest engine axis is Vite 7 (Rollup) vs Vite 8 (Rolldown), plus
 * bare Rolldown to show what Vite's own pipeline costs on top of it.
 */
export const BUNDLERS = [
  {
    id: "vite8",
    label: "Vite 8 (Rolldown)",
    family: "vite",
    engine: "rolldown",
    package: "vite",
    spec: "vite",
    notes: "Vite 8 bundles with Rolldown (depends on rolldown ~1.1).",
  },
  {
    id: "vite7",
    label: "Vite 7 (Rollup)",
    family: "vite",
    engine: "rollup",
    package: "vite7",
    spec: "vite7",
    // Opt-in since 2026-07-30: the Vite-7-vs-8 engine axis is a legacy study,
    // and running it by default doubled the Vite family's cost in every bundle
    // and hmr cell. Enable with BENCH_BUNDLERS (see enabledBundlers).
    optIn: true,
    notes: "Vite 7 bundles with Rollup. Installed as the npm alias vite7@npm:vite@7.3.6.",
  },
  {
    id: "rolldown",
    label: "Rolldown (no Vite)",
    family: "rolldown",
    engine: "rolldown",
    package: "rolldown",
    spec: "rolldown",
    notes:
      "Rolldown's own build() with no Vite pipeline above it. The gap to the Vite 8 rows is what Vite itself costs, since both bundle with Rolldown.",
  },
  {
    id: "rspack",
    label: "Rspack",
    family: "webpack",
    engine: "rspack",
    package: "@rspack/core",
    spec: "@rspack/core",
    notes: "Rust webpack-compatible bundler. Loader/plugin architecture, not Rollup hooks.",
  },
  {
    id: "webpack",
    label: "webpack 5",
    family: "webpack",
    engine: "webpack",
    package: "webpack",
    spec: "webpack",
    notes: "The reference webpack implementation. Loader/plugin architecture, not Rollup hooks.",
  },
];

/**
 * The bundlers a default run measures.
 *
 * `optIn` entries (Vite 7) are absent unless BENCH_BUNDLERS names them — an
 * explicit, comma-separated allowlist that REPLACES the default set, so
 * `BENCH_BUNDLERS=vite8,vite7` is a Vite engine study and `BENCH_BUNDLERS=vite7`
 * alone is legal. Absence is disclosed in the surface methodology rather than
 * rendered as skipped rows: a bundler nobody asked for is not a gap.
 */
export function enabledBundlers() {
  const override = process.env.BENCH_BUNDLERS;
  if (override) {
    const want = new Set(
      override
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    return BUNDLERS.filter((b) => want.has(b.id));
  }
  return BUNDLERS.filter((b) => !b.optIn);
}

/** Resolve the import specifier an integration uses for a given bundler. */
export function integrationSpec(integration, bundler) {
  if (integration.specByBundler) return integration.specByBundler[bundler.id] ?? null;
  return integration.spec ?? null;
}

/**
 * Load a (bundler, integration) pair into a runnable build function.
 *
 * Returns `{ error }` rather than throwing, so one missing package produces one
 * skipped row that names the package instead of losing the whole matrix.
 */
export async function loadCell(bundler, integration) {
  const spec = integrationSpec(integration, bundler);
  if (!spec) {
    return {
      error: `${integration.package} publishes no ${bundler.id} entry point`,
    };
  }

  let bundlerMod;
  try {
    bundlerMod = await import(bundler.spec);
  } catch (error) {
    return { error: `${bundler.package} not installed or unloadable: ${msg(error)}` };
  }

  let integrationMod;
  try {
    integrationMod = await import(spec);
  } catch (error) {
    return { error: `${integration.package} not installed or unloadable: ${msg(error)}` };
  }

  if (bundler.family === "vite" || bundler.family === "rolldown") {
    const build = bundlerMod.build;
    if (typeof build !== "function") return { error: `${bundler.spec} exports no build()` };
    const factory = integrationMod.default;
    if (typeof factory !== "function") return { error: `${spec} exports no default factory` };
    return {
      run: ({ appDir, entry, outDir }) =>
        rollupFamilyBuild({
          build,
          factory,
          appDir,
          entry,
          outDir,
          viteShaped: bundler.family === "vite",
        }),
    };
  }

  // webpack family
  const makeCompiler = bundlerMod.default ?? bundlerMod.webpack ?? bundlerMod.rspack;
  if (typeof makeCompiler !== "function") {
    return { error: `${bundler.spec} exports no compiler factory` };
  }
  if (typeof integration.apply !== "function") {
    return { error: `${integration.package} has no webpack-family apply()` };
  }
  return {
    run: ({ appDir, entry, outDir }) =>
      webpackFamilyBuild({
        compiler: makeCompiler,
        integration: { apply: (config) => integration.apply(config, integrationMod) },
        appDir,
        entry,
        outDir,
        isRspack: bundler.id === "rspack",
        // Both bundlers publish an IgnorePlugin with the same contract; it is
        // the only mechanism that reaches ContextModules (expression dynamic
        // imports), which never consult the externals callback. Verified
        // empirically on both before use — see unresolvableContextPrefixes.
        IgnorePlugin: bundlerMod.IgnorePlugin ?? makeCompiler.IgnorePlugin ?? null,
      }),
  };
}

function msg(error) {
  return String(error instanceof Error ? error.message : error).split("\n")[0].slice(0, 200);
}

/** Every (bundler, integration) pair the registry describes. */
export function allCells() {
  const cells = [];
  for (const bundler of enabledBundlers()) {
    for (const integration of INTEGRATIONS[bundler.family] ?? []) {
      cells.push({
        id: `${bundler.id}__${integration.id}`,
        label: `${bundler.label} × ${integration.label}`,
        bundler,
        integration,
      });
    }
  }
  return cells;
}
