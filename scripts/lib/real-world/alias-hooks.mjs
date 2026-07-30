/**
 * Node module-resolution hooks that redirect `@vitejs/plugin-vue` to a challenger.
 *
 * This is the executable half of `SWAP_MECHANISMS.alias` (see plugin-swap.mjs).
 * It runs inside the timed child process — vite, vitest, or a framework CLI — and
 * is registered by `alias-loader.mjs`, which is what `NODE_OPTIONS=--import`
 * points at.
 *
 * ## Why a resolve hook rather than a dependency override
 *
 * The override mechanism needs a config file it can import and a `plugins` array
 * to substitute into. A framework wrapper (Nuxt, Quasar) builds its Vite config at
 * runtime, so there is no such array; the only remaining seam is the point where
 * the framework's own code asks Node for `@vitejs/plugin-vue`. A `resolve` hook
 * sits exactly there, and unlike a dependency override it needs no reinstall and
 * cannot leave the checkout modified.
 *
 * ## Why it records that it fired, in a file
 *
 * A hook that silently matched nothing is the worst outcome available here: the
 * child process would run the project's REAL `@vitejs/plugin-vue`, finish
 * normally, and the harness would publish the baseline's number under a
 * challenger's name. Nothing in the output would differ. So every redirect is
 * appended to a marker file whose path arrives in `BENCH_ALIAS_MARKER`, and the
 * surface publishes ⏭ NOT MEASURED unless the file says the remap actually
 * happened. Positive evidence, not an assumption.
 *
 * A FILE rather than an exit code or stdout line because the redirect happens in a
 * child (or a worker of a child — vitest runs its config load in the main process
 * and its tests in workers), and a file is the one channel that survives all of
 * them without depending on how the tool multiplexes output.
 *
 * Configured entirely through the environment, because `NODE_OPTIONS` carries a
 * single `--import <url>` with no way to attach per-run data to it:
 *
 *   BENCH_ALIAS_FROM    specifier to intercept   (e.g. `@vitejs/plugin-vue`)
 *   BENCH_ALIAS_TO      absolute file: URL of the challenger's entry module
 *   BENCH_ALIAS_MARKER  file to append one line per redirect to
 */

import { appendFileSync } from "node:fs";

const FROM = process.env.BENCH_ALIAS_FROM || "@vitejs/plugin-vue";
const TO = process.env.BENCH_ALIAS_TO || "";
const MARKER = process.env.BENCH_ALIAS_MARKER || "";

/**
 * Does this specifier name the package being replaced?
 *
 * Three forms have to match, and the third is the one that makes the mechanism
 * work at all:
 *
 *   1. the bare name          `@vitejs/plugin-vue`
 *   2. a subpath              `@vitejs/plugin-vue/dist/index.mjs`
 *   3. an ALREADY-RESOLVED absolute path or file: URL that lands inside the
 *      package, whatever copy of it and whatever the node_modules layout —
 *      `file:///…/node_modules/.pnpm/@vitejs+plugin-vue@6.0.8_…/node_modules/
 *      @vitejs/plugin-vue/dist/index.mjs`
 *
 * Form 3 was found by measurement, not by reading docs. A hook matching only
 * forms 1 and 2 intercepted a direct `import("@vitejs/plugin-vue")` perfectly and
 * intercepted a real `vite build` NOT AT ALL: Vite bundles the config file and its
 * externalise-dependencies step RESOLVES each bare import to an absolute path
 * before the bundle is evaluated, so by the time Node is asked for the module the
 * specifier is a file URL and the package name is only a path segment in it. The
 * marker file stayed empty and the project's own plugin compiled every SFC — which
 * is exactly the silent no-op the marker gate exists to catch, and it did.
 *
 * Matching on the path SEGMENT rather than on a resolved directory is deliberate:
 * the third-party project has its own copy of `@vitejs/plugin-vue` under its own
 * `node_modules`, so a rule anchored on the path this repository resolves would
 * miss the copy that actually gets imported.
 *
 * Exported so the rule can be unit-tested without spawning a process. A resolve
 * hook that matched nothing is invisible at runtime, which is why the rule itself
 * has a test.
 */
export function matchesAliasedSpecifier(specifier, from = FROM) {
  if (!from) return false;
  const s = String(specifier ?? "");
  if (s === from || s.startsWith(`${from}/`)) return true;
  // A resolved path or URL. `%40` because a file: URL percent-encodes `@`, and
  // backslashes because a Windows path is handed over unconverted in places.
  const normalised = s.split("\\").join("/").replace(/%40/gi, "@");
  const segment = from.split("\\").join("/");
  return new RegExp(`(^|/)${escapeRegExp(segment)}(/|$)`).test(normalised);
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** One line per redirect, appended. Failure to record is a HARD failure. */
function record(specifier, parentURL) {
  if (!MARKER) return;
  try {
    appendFileSync(MARKER, `${specifier}\t${parentURL ?? "?"}\n`);
  } catch (error) {
    // Deliberately loud. If the marker cannot be written, the surface cannot tell
    // "the remap never fired" from "the remap fired and could not say so", and the
    // second would be published as the first — a challenger row silently reported
    // NOT MEASURED, or worse, a marker-less run mistaken for a clean one.
    throw new Error(
      `bench alias loader: could not record a redirect to ${MARKER} (${
        error instanceof Error ? error.message : error
      }). Refusing to continue silently: an unrecorded redirect makes the swap unverifiable.`,
    );
  }
}

/**
 * The hook. Written to satisfy BOTH `module.registerHooks` (synchronous,
 * in-thread, also covers `require`) and the older off-thread
 * `module.register` — returning `nextResolve(...)` directly works either way,
 * because an async caller awaits a plain value happily and a sync caller gets the
 * value it needs.
 */
export function resolve(specifier, context, nextResolve) {
  if (!TO || !matchesAliasedSpecifier(specifier)) {
    return nextResolve(specifier, context);
  }
  record(specifier, context?.parentURL);
  // Returned as a resolved URL rather than handed back to `nextResolve` as a new
  // specifier. The challenger lives in THIS repository's node_modules, not the
  // third-party project's, so re-resolving it from the importer's directory would
  // fail — and a failure here reads as "the challenger is broken" when it is only
  // "the challenger is not installed where the project can see it".
  return { url: TO, shortCircuit: true, format: "module" };
}
