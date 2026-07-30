/**
 * The app shell that the `bundle` and `hmr` surfaces build.
 *
 * ## Why a generated shell instead of each project's own build
 *
 * The obvious design is "run `pnpm build` in each cloned repo and time it". That
 * measures the wrong thing twice over. It measures each project's own build
 * configuration — its chunking strategy, its image pipeline, its SSG prerender
 * step, its Sentry upload — far more than it measures the Vue toolchain, and it
 * produces nothing comparable across bundlers, because Hoppscotch's Vite config
 * and Vuetify's Vite config are not the same benchmark. Swapping the bundler
 * under a project's own config is usually not even possible.
 *
 * So every cell builds the SAME generated shell over the SAME corpus, and the
 * only things that vary are the two dimensions under test: which bundler, and
 * which Vue plugin.
 *
 * ## The module graph is exactly the corpus
 *
 * `corpusOnlyResolver` resolves an import to an internal module if and only if
 * it lands on a `.vue` file inside the corpus. Everything else — `vue` itself,
 * `~/composables/foo`, `@hoppscotch/data`, a sibling `.ts`, an unplugin-icons
 * virtual id — is marked **external** and left in the output.
 *
 * Externalising rather than stubbing matters. A stub module cannot satisfy
 * `import { useFoo } from './foo'` (ESM has no catch-all export), so a stubbing
 * harness either errors or silently drops modules, and it drops a *different*
 * set per bundler. An external import is a first-class concept that Rollup,
 * Rolldown and webpack-family bundlers all implement the same way: the import
 * survives into the output untouched and nothing is invented.
 *
 * The result is a module graph that is identical in every cell and consists of
 * real, unmodified, third-party Vue SFCs. No cell can win by resolving less, and
 * no cell is charged for a dependency another cell happened to have on disk. It
 * also means this surface does **not** require the project's install to have
 * succeeded — which is why `bundle` and `hmr` are not dependency surfaces.
 *
 * What this deliberately does not measure: dependency pre-bundling, chunk
 * splitting across a real dependency tree, CSS extraction across a design
 * system, or anything else that depends on the non-corpus half of a real app.
 * Those are real bundler costs. They are not Vue-toolchain costs, and mixing
 * them in is what makes most published bundler comparisons unreadable.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";

/** Marker appended to ids the resolver has externalised, for the census. */
const EXTERNAL_TAG = "\0bench-external:";

/**
 * Generate the entry module.
 *
 * Every SFC is imported *and re-exported*. A bare `import './Comp.vue'` with no
 * binding is dead code, and a bundler is entitled to drop it — which would let a
 * tree-shaking bundler "win" by compiling nothing. Re-exporting each component
 * under a stable name keeps every module live in every cell, with
 * `treeshake: false` as a second belt.
 */
export function writeEntry(appDir, files) {
  const lines = [];
  const names = [];
  files.forEach((rel, i) => {
    const name = `C${i}`;
    names.push(name);
    // Always a relative specifier with forward slashes: the same entry text has
    // to parse identically on win32 and posix.
    lines.push(`import ${name} from ${JSON.stringify(`./${rel}`)}`);
  });
  lines.push("");
  lines.push(`export const components = [${names.join(", ")}]`);
  lines.push(`export default components`);
  const source = `${lines.join("\n")}\n`;
  const entryPath = join(appDir, "bench-entry.js");
  writeFileSync(entryPath, source);
  return entryPath;
}

/**
 * Rollup/Rolldown/Vite plugin implementing the "corpus is the graph" rule.
 *
 * Runs with `enforce: "pre"` so it sees specifiers before the Vue plugin, but it
 * declines (`return null`) on anything the Vue plugin owns — its own virtual
 * sub-requests (`?vue&type=style`), and any id already in Rollup's virtual
 * namespace (`\0…`). Those must keep flowing to the plugin under test, or the
 * surface would measure a Vue plugin that never gets asked to compile a style
 * block.
 */
export function corpusOnlyResolver(appDir, { onExternal } = {}) {
  const isVendor = (p) => p.split(/[\\/]/).includes("node_modules");

  return {
    name: "bench-corpus-only",
    enforce: "pre",
    async resolveId(source, importer, options) {
      // Rollup's virtual namespace and the Vue plugin's own sub-requests belong
      // to whoever created them.
      if (source.startsWith("\0")) return null;
      if (source.includes("?vue&") || source.includes("?vue=")) return null;
      // The generated entry itself.
      if (source.endsWith("bench-entry.js")) return null;

      // Ask everyone else first, then judge the RESOLVED path. Deciding on the
      // specifier instead would judge `~/foo` and `../foo` by how they were
      // spelled rather than by where they land.
      let resolved = null;
      try {
        resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      } catch {
        resolved = null;
      }

      // Nothing could resolve it: a project alias (`~/composables/x`), a virtual
      // id from a plugin this app does not run (`~icons/…`), or a dependency
      // that is not installed. Externalise — see the module docblock for why
      // that beats stubbing.
      if (!resolved) {
        if (onExternal) onExternal(source);
        return { id: source, external: true };
      }
      if (resolved.external) return resolved;

      const clean = String(resolved.id).split("?")[0];

      // Third-party code is external in every cell. Without this rule `vue`
      // resolves, drags @vue/reactivity and @vue/shared into the graph, and
      // every cell spends most of its time bundling the Vue runtime — identical
      // work for all of them, but it buries the signal under a constant and
      // makes the corpus no longer the graph.
      if (isVendor(clean)) {
        if (onExternal) onExternal(source);
        return { id: source, external: true };
      }

      // The staged app now carries the corpus's RELATIVE import closure — the
      // sibling `.ts` files @vue/compiler-sfc reads for imported prop types (see
      // prepareBundleApp). Those files are for the COMPILER, not the graph: kept
      // internal they would be bundled, and the module graph would stop being
      // exactly the corpus and grow by a different amount per project. A resolved
      // in-app path whose name never mentions `.vue` is one of them — external,
      // as every sibling module always was here.
      const mentionsVue = clean.includes(".vue");
      if (!mentionsVue) {
        if (onExternal) onExternal(source);
        return { id: source, external: true };
      }

      // Anything else that resolved to a path outside node_modules is the
      // plugin under test doing its job, and must stay internal.
      //
      // This is deliberately broader than "is a .vue file inside the corpus".
      // Vize rewrites `App.vue` to an `App.vue.ts` sidecar it pre-compiled, and
      // a `.vue`-only rule externalised that sidecar: the build then "succeeded"
      // in 28 ms having bundled none of the corpus, emitting 3.7 kB against the
      // 207 kB every other cell produced. A rule that a plugin can fail by
      // choosing a different intermediate filename is not measuring the plugin —
      // which is why the test above is "mentions .vue", not "ends with .vue".
      return resolved;
    },
  };
}

/**
 * Census plugin: counts `.vue` modules actually handed to a transform.
 *
 * This is the bundle surface's artifact column. Wall-clock alone cannot
 * distinguish a faster Vue plugin from one that skipped half the corpus, and the
 * two look identical in a table. Counting is done here rather than inside each
 * plugin so the count means the same thing in every cell.
 */
export function transformCensus(appDir) {
  const state = { vueModules: new Set(), styleRequests: 0, totalTransforms: 0 };

  // A module counts as "a corpus SFC was compiled" when its path is inside the
  // app and its basename mentions `.vue`. The second half is what makes the
  // count comparable: @vitejs/plugin-vue keeps the id `App.vue`, while Vize
  // hands the bundler `App.vue.ts`. Matching only `.endsWith(".vue")` scored
  // Vize 0/40 on a build that had in fact compiled all 40 — the census would
  // have accused a working plugin of doing no work.
  // One component, ONE key, however a plugin spelt the id. Percent-decoded,
  // separator- and case-normalised — the same hardening `sfcKeyForWebpackModule`
  // got after `webpack × unplugin` counted 6 of 3, and for the same reason: a
  // plugin that emits lowercase drive letters (Verter did — 3364/1682) or
  // percent-encoded virtual ids is otherwise counted twice per SFC, and an
  // inflated SURVIVING challenger raises the peer anchor and unranks every
  // honest cell in its group (observed: Vize at 185/149 unranked all three
  // 149/149 cells beside it). The CONTAINMENT test runs on the same normalised
  // text, or a case-mismatched id would silently fall out of the census instead
  // of deduplicating into it.
  const rootKey = `${resolve(appDir).split("\\").join("/").toLowerCase()}/`;
  const sfcKey = (id) => {
    let text = String(id);
    if (/%[0-9a-f]{2}/i.test(text)) {
      try {
        text = decodeURIComponent(text);
      } catch {
        // An unreadable id is keyed raw rather than thrown out of a census.
      }
    }
    const clean = text.split("?")[0].split("\\").join("/").toLowerCase();
    const at = clean.lastIndexOf(".vue");
    if (at === -1) return null;
    const key = clean.slice(0, at + 4);
    // The decoded virtual id may EMBED the real path after a prefix, so judge
    // containment on the last occurrence of the app root.
    const idx = key.lastIndexOf(rootKey);
    if (idx === -1) return null;
    return key.slice(idx);
  };

  return {
    state,
    plugin: {
      name: "bench-census",
      // `post` so it observes what reached the pipeline rather than what this
      // plugin would have seen ahead of the Vue plugin's own rewrites.
      enforce: "post",
      transform(_code, id) {
        state.totalTransforms++;
        const key = sfcKey(id);
        if (key) {
          state.vueModules.add(key);
          if (String(id).includes("type=style")) state.styleRequests++;
        }
        return null;
      },
    },
  };
}

/**
 * Inert consumer for SFC CUSTOM-BLOCK sub-requests.
 *
 * The generated shell drops each project's own build config by design — and
 * with it whatever plugin consumed that project's custom blocks. naive-ui's
 * 1682 `.demo.vue` files each carry a `<markdown>` block, vuetify's examples
 * carry `<playground-setup>`/`<playground-resources lang="json">`. Every LAZY
 * integration (the official plugin included) forwards the raw block and the
 * bundler's JS parser explodes on prose — 10 of naive-ui's and 8 of vuetify's
 * 13 bundle ❌ rows were this one gap, attributed to the integrations by the
 * census rule. The exact class of misattribution was already fixed for
 * `<style>` blocks (see tsRules in bundler-drivers.mjs); this is the same fix
 * for every OTHER non-script/template/style block, in the Rollup-shaped
 * families: the block becomes `export default undefined`, which also satisfies
 * the default-import the integration emits for it.
 *
 * `post`, so it runs AFTER the integration's transform — and it replaces the
 * module unconditionally on id-match, which would clobber an integration's own
 * custom-block output if one ever produced it. Acceptable today because none of
 * the four integrations under test emits custom-block JS (verified against
 * their plugin sources); revisit with a parse-check guard if one does.
 * Identical in every cell, so no cell can win or lose on a pipeline the harness
 * never configured.
 */
export function customBlockSink() {
  const TYPE_RE = /[?&]type=([^&]+)/;
  const CORE_TYPES = new Set(["script", "template", "style"]);
  return {
    name: "bench-custom-block-sink",
    enforce: "post",
    transform(_code, id) {
      const text = String(id);
      if (!text.includes("vue&") && !text.includes("vue=")) return null;
      const m = TYPE_RE.exec(text.slice(text.indexOf("?")));
      if (!m || CORE_TYPES.has(m[1])) return null;
      return { code: "export default undefined\n", map: null };
    },
  };
}

/** Minimal html host so `vite dev` has something to serve for the HMR surface. */
export function writeIndexHtml(appDir) {
  const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>bench</title></head>
  <body>
    <div id="app"></div>
    <script type="module" src="/bench-entry.js"></script>
  </body>
</html>
`;
  writeFileSync(join(appDir, "index.html"), html);
}

/** package.json so the app dir is its own ESM package and not the repo's. */
export function writeAppPackageJson(appDir, name) {
  if (!existsSync(appDir)) mkdirSync(appDir, { recursive: true });
  writeFileSync(
    join(appDir, "package.json"),
    `${JSON.stringify({ name, private: true, type: "module", version: "0.0.0" }, null, 2)}\n`,
  );
}

/** Normalise a corpus-relative path for use in a generated import specifier. */
export function toSpecifier(relPath) {
  return relPath.split(sep).join("/");
}

export { EXTERNAL_TAG };
