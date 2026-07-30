/**
 * `--import` entry point for the alias swap. Installs `./alias-hooks.mjs`.
 *
 * Pointed at by `NODE_OPTIONS=--import <file url of this module>`, which
 * `aliasSwapEnv()` in plugin-swap.mjs builds. Doing nothing when
 * `BENCH_ALIAS_TO` is unset is deliberate: `NODE_OPTIONS` is inherited by every
 * grandchild process a build spawns, and a stray installation in an unrelated
 * process must be inert rather than an error.
 *
 * ## registerHooks, not register — and it is not a style preference
 *
 * `module.register()` runs hooks on a SEPARATE thread and applies to ESM
 * resolution only. Measured against a real `vite build` whose config does
 * `import vue from "@vitejs/plugin-vue"`, it intercepted NOTHING: the redirect
 * marker stayed empty and the project's own plugin compiled every SFC. Vite
 * bundles the config with esbuild/rolldown and loads the result through its own
 * module runner, so the specifier never reaches the ESM loader chain the
 * off-thread hooks sit in.
 *
 * `module.registerHooks()` (Node 22.15+, and the API that deprecates `register`
 * in Node 24+) installs SYNCHRONOUS, in-thread hooks that also cover `require`,
 * which is what a bundled config's externalised dependency actually goes through.
 * The fallback to `register` exists only for a Node without `registerHooks`, and
 * on such a Node the swap will simply not fire — which the marker gate then
 * reports as ⏭ NOT MEASURED rather than publishing an unswapped run.
 */
import module from "node:module";
import { resolve } from "./alias-hooks.mjs";

if (process.env.BENCH_ALIAS_TO) {
  if (typeof module.registerHooks === "function") {
    module.registerHooks({ resolve });
  } else {
    module.register("./alias-hooks.mjs", import.meta.url);
  }
}
