/**
 * Substituting a Vue plugin into a project's own Vite/Vitest config.
 *
 * Shared by the `project-test` and `project-build` surfaces. It lives in one file
 * because the tricky part — resolving a config that may be an object, a function
 * or a promise, then replacing exactly one plugin in it — is identical for both,
 * and two copies of that logic would drift apart in ways nothing would catch.
 */

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const rootDir = join(here, "..", "..", "..");

export const SWAP_MECHANISMS = {
  none: "the project's own toolchain, unmodified (baseline)",
  override:
    "a generated config that imports the project's real config and replaces only the Vue plugin",
  /**
   * The known inequality in the `override` mechanism, stated on every row it
   * produces.
   *
   * The project calls `vue({ … })` with plugin-vue-specific options — `include`,
   * `script.defineModel`, `template.compilerOptions`, `features`, custom
   * `customElement` predicates — and those options are baked into the plugin
   * INSTANCE, which exposes no way to read them back out. The substitution
   * therefore constructs the challenger with NO options at all, while the
   * baseline row keeps every one of the project's.
   *
   * That is not a neutral difference: an option the project set could make the
   * baseline do more work (an extra template transform) or less (a narrower
   * `include` glob). Neither direction is measured, so it cannot be claimed to
   * cancel out, and the disclosure belongs next to the number rather than in a
   * design document.
   */
  optionsDropped:
    "⚠ NOT EQUAL WORK — the project's own vue({...}) options are DROPPED: the challenger is constructed with no options, because plugin-vue bakes them into the instance and exposes no way to read them back. The baseline row keeps them. This row may therefore be doing more or less work than the baseline, in an unmeasured direction",
  /**
   * The wired fallback for configs the override cannot reach.
   *
   * Implemented as a Node module-resolution hook rather than a dependency
   * override plus reinstall — see `alias-hooks.mjs`. Two facts must ride on every
   * row it produces, and both are in this string because the row prints it
   * verbatim:
   *
   * - the project's own `vue({...})` options DO reach the challenger here (unlike
   *   the override, which drops them), and the challenger may not understand
   *   them, so a failure may be an option-shape mismatch rather than a real
   *   incompatibility;
   * - the redirect is verified, not assumed. A hook that matched nothing would run
   *   the project's real plugin-vue and publish the baseline's number under a
   *   challenger's name, so the row is ⏭ NOT MEASURED unless the loader recorded
   *   the redirect.
   */
  alias:
    "resolution-hook override: the timed process runs with NODE_OPTIONS=--import pointing at a Node resolve hook that redirects every import of @vitejs/plugin-vue (and its subpaths) to the challenger's module, so a config generated at runtime picks the challenger up without being imported or edited. ⚠ NOT EQUAL WORK, in the opposite direction to the override mechanism: the project's own vue({...}) options DO reach the challenger here, and a challenger that does not understand plugin-vue's option shape may fail on the options rather than on the SFCs — an option-shape mismatch and a real incompatibility are hard to tell apart from the outside, and this surface does not tell them apart. The redirect is verified by a marker the hook writes; a row whose redirect never fired is ⏭ NOT MEASURED, never published, because a silent no-op would publish the baseline's number under the challenger's name",
  aliasNotFired:
    "⏭ NOT MEASURED — the alias resolution hook was installed but recorded NO redirect of @vitejs/plugin-vue, so nothing shows that the challenger ever replaced the baseline plugin. The run may have been the project's own toolchain from end to end, and publishing its time under a challenger's name would be the worst failure available on this surface. This is a harness gap, NOT a statement about the tool",
};

/**
 * Challengers, as (label, module specifier) pairs.
 *
 * All three default-export a factory returning a Vite plugin, which is what makes
 * a drop-in substitution possible at all.
 *
 * `unplugin-vue` is included even though it wraps the same official compiler as
 * the baseline, and that is the point: it isolates the plugin *wrapper* from the
 * *compiler*, so a gap between it and baseline is wrapper overhead rather than
 * compiler speed. Without that row, wrapper cost would be silently attributed to
 * whichever compiler happened to be underneath.
 */
export const CHALLENGERS = [
  {
    id: "unplugin-vue",
    label: "unplugin-vue",
    package: "unplugin-vue",
    spec: "unplugin-vue/vite",
    notes:
      "Same official @vue/compiler-sfc as the baseline, different plugin wrapper — a gap to baseline is wrapper cost, not compiler cost.",
  },
  {
    id: "vize",
    label: "@vizejs/vite-plugin",
    package: "@vizejs/vite-plugin",
    spec: "@vizejs/vite-plugin",
    notes: "Vize's native compiler, substituted for the project's Vue plugin.",
  },
  {
    id: "verter",
    label: "@verter/unplugin",
    package: "@verter/unplugin",
    spec: "@verter/unplugin/vite",
    notes: "Verter's universal bundler plugin, substituted for the project's Vue plugin.",
  },
];

/**
 * The plugin name `@vitejs/plugin-vue` registers itself under.
 *
 * This string is how the plugin to replace is located. It is a public, stable part
 * of the plugin's contract (Vite plugin names are how users target `enforce`,
 * ordering and filtering), so keying on it is safer than positional guessing.
 */
export const VUE_PLUGIN_NAME = "vite:vue";

/**
 * Generate an override config.
 *
 * Written as plain ESM into the target package, so the project's own relative
 * imports, aliases and `node_modules` resolve exactly as they normally would —
 * which is the whole point: a challenger that fails here failed on the project's
 * real terms, not on a synthetic approximation of them.
 *
 * Three details are load-bearing:
 *
 * - The base config may be an object, a function, or a promise. `defineConfig`
 *   accepts all three, and real projects use all three.
 * - Plugins may be nested arrays (a preset returning several). They are flattened
 *   before the search, or a Vue plugin one level down would be missed.
 * - If the Vue plugin is not found, this THROWS instead of prepending the
 *   challenger. Adding it beside the original would leave two Vue plugins both
 *   compiling every SFC — which still produces a number, and the number would be
 *   meaningless. Failing loudly turns that into a visible ❌ row.
 * - The challenger goes in at the ORIGINAL plugin's index, not at the front.
 *   Vite runs plugins in array order, and hoisting the Vue plugin above the
 *   others changes which of them sees an `.vue` file first — a project that puts
 *   an svg-loader, an i18n plugin or a macro transform before Vue would have had
 *   its own ordering for the baseline row and a different ordering for every
 *   challenger row, silently making the swap a two-variable change.
 * - `configEnv` is REQUIRED, not defaulted. A Vite/Vitest config exported as a
 *   function branches on it, so resolving with the wrong one hands the
 *   challengers a different config from the one the baseline ran: a hardcoded
 *   `{command:'build', mode:'production'}` meant the project-test rows resolved
 *   their config in BUILD mode while the baseline `vitest run` resolved it in
 *   serve/test mode — different plugins, different aliases, different work.
 *   Getting it wrong is invisible in the output, so there is no safe default.
 *
 * @param {object} opts
 * @param {string} opts.baseConfigFile  filename to import, relative to the package
 * @param {string} opts.challengerSpec  module specifier of the replacement plugin
 * @param {{command: string, mode: string}} opts.configEnv  ConfigEnv the base
 *        config is resolved with — must match how the tool being timed resolves it
 * @param {object} [opts.extend]        extra top-level config keys to merge in
 */
export function overrideConfigSource({ baseConfigFile, challengerSpec, configEnv, extend = {} }) {
  if (!configEnv?.command || !configEnv?.mode) {
    throw new Error(
      "overrideConfigSource: configEnv { command, mode } is required — resolving a project's " +
        "config under the wrong ConfigEnv gives the challenger a different config from the one " +
        "the baseline ran, and nothing in the output would show it.",
    );
  }
  return `// Generated by the vue-benchmarks real-world surfaces — safe to delete.
import challenger from ${JSON.stringify(challengerSpec)}
import baseExport from ${JSON.stringify(`./${baseConfigFile}`)}

const VUE_PLUGIN_NAME = ${JSON.stringify(VUE_PLUGIN_NAME)}

// The SAME ConfigEnv the timed tool resolves this config with. A function-form
// config branches on it, so a mismatch here is a second variable in the swap.
const CONFIG_ENV = ${JSON.stringify({ command: configEnv.command, mode: configEnv.mode })}

async function resolveBase() {
  const raw = baseExport?.default ?? baseExport
  const value = typeof raw === 'function'
    ? await raw(CONFIG_ENV)
    : await raw
  return value ?? {}
}

const base = await resolveBase()
const plugins = (base.plugins ?? []).flat(Infinity).filter(Boolean)

const isVuePlugin = (p) => p && p.name === VUE_PLUGIN_NAME
const vueIndex = plugins.findIndex(isVuePlugin)
if (vueIndex === -1) {
  throw new Error(
    'bench: no plugin named "' + VUE_PLUGIN_NAME + '" in ' + ${JSON.stringify(baseConfigFile)} +
    ' — refusing to add a second Vue plugin beside the original, which would have both ' +
    'compiling every SFC and report a number that means nothing.'
  )
}

// In place, at the original plugin's index: plugin order is part of the
// project's configuration, and reordering it would vary more than the compiler.
//
// The challenger is constructed with NO options, because plugin-vue's are baked
// into the instance and cannot be read back out. Every row this generates says
// so — see SWAP_MECHANISMS.optionsDropped.
const swapped = plugins.slice()
swapped.splice(vueIndex, 1, challenger())

export default {
  ...base,
  ...${JSON.stringify(extend)},
  plugins: swapped,
}
`;
}

/* -------------------------------------------------------------------------- */
/* The alias fallback                                                          */
/* -------------------------------------------------------------------------- */

/** The package every challenger stands in for. */
export const BASELINE_PLUGIN_SPECIFIER = "@vitejs/plugin-vue";

/**
 * Resolve a challenger's ENTRY MODULE to an absolute `file:` URL.
 *
 * The resolve hook has to return a URL, not a specifier, because the challenger
 * lives in THIS repository's `node_modules` and the process it is injected into
 * runs in a third-party checkout that cannot see it. Resolving here — in the
 * harness, from the harness's own root — is the only place that works.
 *
 * `import.meta.resolve` is used first because a challenger's entry is declared in
 * `exports` (`@verter/unplugin/vite`, `unplugin-vue/vite`) and CommonJS resolution
 * cannot read subpath exports for an ESM-only package. `require.resolve` is the
 * fallback for a package that ships CJS and no `exports`.
 *
 * @param {string} spec module specifier of the challenger plugin
 * @returns {{url: string|null, notes: string}}
 */
export function resolveChallengerUrl(spec) {
  try {
    return { url: import.meta.resolve(spec), notes: `resolved ${spec} via import.meta.resolve` };
  } catch (error) {
    try {
      return {
        url: pathToFileURL(require.resolve(spec, { paths: [rootDir] })).href,
        notes: `resolved ${spec} via require.resolve`,
      };
    } catch {
      return {
        url: null,
        notes: `${spec} is not resolvable from ${rootDir}: ${
          error instanceof Error ? error.message : error
        }`,
      };
    }
  }
}

/**
 * Environment for one alias-swapped run.
 *
 * Returns the env additions AND the marker path, because the caller has to read
 * the marker back to decide whether the row may be published at all. The marker
 * file is REMOVED here rather than after the run: a stale marker from a previous
 * iteration would report a redirect that this run did not make, which is the one
 * mistake the whole verification exists to prevent.
 *
 * `NODE_OPTIONS` is APPENDED to, never replaced. A project can set its own
 * (`--max-old-space-size`, `--experimental-vm-modules` for a jsdom test env), and
 * dropping those would change what the run does — and it would change it only for
 * the challenger rows, which is exactly the kind of one-sided difference this
 * repository unranks rows for.
 *
 * @param {object} opts
 * @param {string} opts.challengerSpec  module specifier of the replacement plugin
 * @param {string} opts.markerPath      file the hook appends each redirect to
 * @param {NodeJS.ProcessEnv} [opts.baseEnv]
 * @returns {{env: Record<string,string>, markerPath: string, url: string|null, notes: string}}
 */
export function aliasSwapEnv({ challengerSpec, markerPath, baseEnv = process.env }) {
  const { url, notes } = resolveChallengerUrl(challengerSpec);
  mkdirSync(dirname(markerPath), { recursive: true });
  rmSync(markerPath, { force: true });

  if (!url) return { env: {}, markerPath, url: null, notes };

  const loaderUrl = pathToFileURL(join(here, "alias-loader.mjs")).href;
  const existing = baseEnv.NODE_OPTIONS ? `${baseEnv.NODE_OPTIONS} ` : "";
  return {
    env: {
      // Quoted because NODE_OPTIONS is whitespace-split, and a repository checked
      // out under a path with a space in it would otherwise inject a truncated URL
      // and silently install no hook at all.
      NODE_OPTIONS: `${existing}--import "${loaderUrl}"`,
      BENCH_ALIAS_FROM: BASELINE_PLUGIN_SPECIFIER,
      BENCH_ALIAS_TO: url,
      BENCH_ALIAS_MARKER: markerPath,
    },
    markerPath,
    url,
    notes,
  };
}

/**
 * Read the marker back: did the redirect actually happen?
 *
 * `fired: false` is the gate. It covers both "the hook was never installed" and
 * "the hook was installed and nothing asked for @vitejs/plugin-vue", and the
 * surface treats them the same way, because from here they are the same thing: no
 * evidence that the challenger compiled anything.
 *
 * @param {string} markerPath
 * @returns {{fired: boolean, count: number, specifiers: string[], importers: string[]}}
 */
export function aliasRedirectCensus(markerPath) {
  if (!markerPath || !existsSync(markerPath)) {
    return { fired: false, count: 0, specifiers: [], importers: [] };
  }
  let text = "";
  try {
    text = readFileSync(markerPath, "utf8");
  } catch {
    return { fired: false, count: 0, specifiers: [], importers: [] };
  }
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const specifiers = new Set();
  const importers = new Set();
  for (const line of lines) {
    const [spec, importer] = line.split("\t");
    if (spec) specifiers.add(spec);
    if (importer) importers.add(importer);
  }
  return {
    fired: lines.length > 0,
    count: lines.length,
    specifiers: [...specifiers],
    importers: [...importers],
  };
}
