import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Absolute path to the installed `vue` package.
 *
 * The corpus is copied into a work directory that may sit anywhere `--work`
 * points, so every generated tsconfig needs to name `vue` from wherever it
 * landed. The old code guessed with `join(inputDir, "..", "..", "node_modules",
 * "vue")` — two levels up from the FIXTURE dir, which is only correct while
 * fixtures live exactly at <root>/fixtures/<name>/ and the work dir is inside
 * the repo. Point `--work` outside the repo and the mapping aimed at nothing:
 * vue-tsc then reported 0 diagnostics on a corpus with 40 planted errors (a
 * checker that resolves no types finds no faults) while verter-tsc reported
 * ~2400. Both numbers are garbage, and neither run said anything was wrong.
 *
 * Walking up from this module instead is independent of both fixture layout
 * and work-dir location. Callers must fail loudly if it is missing.
 */
function findVuePackage() {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let up = 0; up < 8; up++) {
    const candidate = join(dir, "node_modules", "vue");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function collectVueFiles(dir, limit = Infinity) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".vue"))
    .sort()
    .slice(0, limit);
}

/**
 * Recursive `.vue` collection, returning POSIX-relative paths.
 *
 * `collectVueFiles` above is flat by design and stays that way: the generated
 * corpora are flat, and a recursive walk there would be slower for no gain. Real
 * projects are not flat — Hoppscotch's 293 SFCs sit up to seven directories deep
 * — so pointing the flat collector at a cloned repo returns zero files, and a
 * surface handed zero files reports a very fast, entirely empty run.
 *
 * Paths are returned relative and POSIX-separated so the same list can be used
 * as a copy manifest, a tsconfig `include`, and a report key on every platform.
 *
 * The result is sorted, which is what makes `limit` meaningful: a truncated
 * corpus has to be the *same* truncated corpus for every tool, or the tools are
 * not being compared on the same input.
 */
export function collectVueFilesDeep(dir, { limit = Infinity, roots = [], ignore = [] } = {}) {
  if (!existsSync(dir)) return [];
  const skip = new Set(ignore);
  const out = [];

  const walk = (absDir) => {
    let entries;
    try {
      entries = readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    // Sort at each level so the traversal order — and therefore any `limit`
    // prefix — is stable across filesystems that do not enumerate in order.
    for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      if (skip.has(entry.name)) continue;
      const abs = join(absDir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && entry.name.endsWith(".vue")) {
        out.push(relative(dir, abs).split(sep).join("/"));
      }
    }
  };

  const searchRoots = roots.length ? roots.map((r) => join(dir, r)) : [dir];
  for (const root of searchRoots) walk(root);

  // A file reachable from two overlapping roots must be compiled once, not
  // twice: a duplicated entry would inflate the file count and hand every tool
  // the same source twice, which content-hash caches serve for free.
  const unique = [...new Set(out)].sort();
  return Number.isFinite(limit) ? unique.slice(0, limit) : unique;
}

export function collectJsxFiles(dir, limit = Infinity) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".jsx") || f.endsWith(".tsx"))
    .sort()
    .slice(0, limit);
}

export function totalBytes(dir, files) {
  return files.reduce((sum, f) => sum + statSync(join(dir, f)).size, 0);
}

export function readSources(dir, files) {
  return files.map((filename) => ({
    filename,
    path: join(dir, filename),
    source: readFileSync(join(dir, filename), "utf8"),
  }));
}

/**
 * Copy a named subset of a corpus into a work directory.
 *
 * `files` may contain nested POSIX-relative paths (see `collectVueFilesDeep`),
 * so each destination's parent directory is created before the copy. Without
 * that, every real-world corpus copy threw ENOENT on its first nested file and
 * the surface reported a tool error — which reads as "the tool failed" rather
 * than "the harness cannot lay out this corpus".
 */
export function copyFixtureSubset(inputDir, outputDir, files, extras = []) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  // Repo-boundary marker. Ignore-crate walkers (oxfmt 0.63+, oxlint) apply
  // .gitignore rules from ANCESTOR directories up to the nearest repo root,
  // and every work copy lives inside this repository, whose .gitignore
  // excludes /work/ — so without a boundary of its own a directory-walk tool
  // sees an EMPTY corpus and its row measures startup time. Observed live on
  // oxfmt 0.63 (0.61 did not yet honour ancestor ignore files): it exited
  // "all matched files may have been excluded by ignore rules" and rewrote
  // 0 of 20 planted files. An empty .git dir is what a real project root has
  // where these copies did not, and it changes no tool's invocation.
  mkdirSync(join(outputDir, ".git"));
  const ensured = new Set();
  const ensureDir = (target) => {
    const parent = dirname(target);
    if (ensured.has(parent)) return;
    mkdirSync(parent, { recursive: true });
    ensured.add(parent);
  };
  for (const file of files) {
    const dest = join(outputDir, file);
    ensureDir(dest);
    copyFileSync(join(inputDir, file), dest);
  }
  for (const extra of extras) {
    const src = join(inputDir, extra);
    if (existsSync(src)) {
      const dest = join(outputDir, extra);
      ensureDir(dest);
      copyFileSync(src, dest);
    }
  }
  return outputDir;
}

/** Import/export specifiers in a source file, cheaply and syntax-agnostically. */
const IMPORT_SPECIFIER_RE =
  /(?:import|export)\s[^'"()]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g;

const CLOSURE_RESOLVE_SUFFIXES = ["", ".ts", ".tsx", ".d.ts", ".mts", ".cts", ".js", ".mjs", ".vue"];

/**
 * Copy the RELATIVE import closure of the staged corpus files.
 *
 * A `.vue`-only staged copy hands `@vue/compiler-sfc` an SFC whose
 * `import type { AlertProps } from './alert'` cannot be read — the compiler
 * resolves imported prop types on the filesystem, the sibling was never copied,
 * and on Element Plus 107 of 162 SFCs failed with errors the bundle surface then
 * attributed to whichever integration hit them first (the official plugin
 * included). These files exist for the COMPILER's type resolution only; the
 * bundler-facing resolvers still externalise them, so the module graph remains
 * exactly the corpus — see corpusOnlyResolver and webpackExternals.
 *
 * Only relative specifiers are followed: a bare or aliased specifier
 * (`@element-plus/hooks`) needs the project's own tsconfig and node_modules,
 * which staging deliberately does not depend on. What that costs is decided —
 * and disclosed — by the compilability preflight in prepareBundleApp, not here.
 */
export function copyRelativeImportClosure(inputDir, outputDir, seedFiles) {
  const copied = [];
  const visited = new Set(seedFiles.map((f) => join(inputDir, f)));
  const queue = [...visited];

  const tryCopy = (absSrc) => {
    const rel = relative(inputDir, absSrc);
    if (!rel || rel.startsWith("..")) return false;
    let stat;
    try {
      stat = statSync(absSrc);
    } catch {
      return false;
    }
    if (!stat.isFile()) return false;
    const dest = join(outputDir, rel);
    if (!existsSync(dest)) {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(absSrc, dest);
      copied.push(rel);
    }
    return true;
  };

  while (queue.length) {
    const file = queue.pop();
    let source;
    try {
      source = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const match of source.matchAll(IMPORT_SPECIFIER_RE)) {
      const spec = match[1] ?? match[2] ?? match[3];
      if (!spec || !spec.startsWith(".")) continue;
      const base = join(dirname(file), spec.split("?")[0]);
      for (const candidate of [
        ...CLOSURE_RESOLVE_SUFFIXES.map((s) => base + s),
        ...CLOSURE_RESOLVE_SUFFIXES.filter(Boolean).map((s) => join(base, `index${s}`)),
      ]) {
        // First existing candidate wins, exactly one file per specifier — a
        // specifier that already resolved must not also copy its next-best match.
        if (visited.has(candidate)) break;
        if (!tryCopy(candidate)) continue;
        visited.add(candidate);
        queue.push(candidate);
        break;
      }
    }
  }
  return copied;
}

export function writeTsconfig(dir, { include = ["**/*.vue", "**/*.ts"], extendsPath } = {}) {
  const config = {
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      jsx: "preserve",
      noEmit: true,
      skipLibCheck: true,
      isolatedModules: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      lib: ["ESNext", "DOM"],
      // MUST stay empty: `@types/node` is not a dependency of this repo, and
      // `types: ["node"]` made every typechecker fail at program construction
      // with TS2688 instead of checking the corpus — vue-tsc reported that one
      // config error and nothing else, so its "typecheck" timing was really a
      // fast config failure. The generated SFCs need no ambient node types.
      types: [],
    },
    // The work-gate plant projects set strictTemplates, so without it here the
    // TIMED runs were checking materially less than the gate certified. Two
    // checkers flip from "misses unknown props/events/components" to catching
    // them once this is on, so its absence silently discounted their measured
    // work relative to a checker that template-checks unconditionally.
    vueCompilerOptions: { strictTemplates: true },
    include,
  };
  if (extendsPath) {
    config.extends = extendsPath.split(sep).join("/");
  }
  writeFileSync(join(dir, "tsconfig.json"), `${JSON.stringify(config, null, 2)}\n`);
}

export function writeGolarConfig(dir) {
  writeFileSync(
    join(dir, "golar.config.ts"),
    `import { defineConfig } from 'golar/unstable'
import '@golar/vue'

export default defineConfig({})
`,
  );
}

export function writeEnvDTs(dir) {
  writeFileSync(
    join(dir, "env.d.ts"),
    `/// <reference types="vue/macros-global" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
`,
  );
}

export function prepareTypecheckDir(inputDir, files, workRoot, label) {
  const out = join(workRoot, "typecheck", label);
  copyFixtureSubset(inputDir, out, files, []);
  writeEnvDTs(out);
  writeTsconfig(out, { include: [...files, "env.d.ts"] });
  writeGolarConfig(out);

  // Minimal package marker so tools resolve vue from the monorepo root node_modules.
  writeFileSync(
    join(out, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name: `bench-${label}` }, null, 2)}\n`,
  );

  // Point the corpus at the real `vue` from wherever --work put it. Fail loudly
  // rather than emit a tsconfig aimed at nothing: a checker that cannot resolve
  // vue reports zero errors on a corpus full of them, which reads as a clean,
  // fast pass instead of a broken run.
  const vuePkg = findVuePackage();
  if (!vuePkg) {
    throw new Error(
      "cannot locate node_modules/vue — refusing to build a typecheck corpus " +
        "whose tsconfig would resolve no types (every checker would report 0 diagnostics)",
    );
  }
  const rootVue = relative(out, vuePkg).split(sep).join("/");
  const tsconfig = JSON.parse(readFileSync(join(out, "tsconfig.json"), "utf8"));
  tsconfig.compilerOptions.paths = {
    vue: [rootVue],
  };
  writeFileSync(join(out, "tsconfig.json"), `${JSON.stringify(tsconfig, null, 2)}\n`);
  return out;
}

/**
 * oxlint config shared by the timed lint corpus and the lint work-gate plant.
 *
 * The vue plugin is enabled deliberately. It is oxlint's *maximum* Vue
 * awareness — 31 extra rules — so the gate verdict cannot be waved away with
 * "you never turned the plugin on". Every one of those 31 rules reads
 * `<script>` (SFC option/macro shape: prop casing, `defineEmits` style,
 * lifecycle-after-await); none of them examine `<template>`.
 *
 * `plugins` REPLACES oxlint's default list rather than extending it, so the
 * three defaults are repeated here. Listing only `["vue"]` measured 88 active
 * rules against a stock run's 111 — Vue support bought by silently dropping a
 * fifth of the rule set. As written it is 142: the stock 111 plus the 31 vue
 * rules.
 */
export const OXLINT_CONFIG = `${JSON.stringify(
  { plugins: ["unicorn", "typescript", "oxc", "vue"] },
  null,
  2,
)}\n`;

/**
 * Isolated lint corpus holding exactly the measured subset.
 *
 * Tools discover inputs differently — eslint takes an explicit file list,
 * `vize lint .` walks a directory. Handing both an identical directory keeps
 * the compared file set the same regardless of discovery strategy.
 */
export function prepareLintDir(inputDir, files, workRoot, label) {
  const out = join(workRoot, "lint", label);
  copyFixtureSubset(inputDir, out, files, ["eslint.config.mjs"]);
  if (!existsSync(join(out, "eslint.config.mjs"))) {
    writeFileSync(
      join(out, "eslint.config.mjs"),
      `import pluginVue from "eslint-plugin-vue";
import tsParser from "@typescript-eslint/parser";

// parserOptions.parser is required for <script setup lang="ts"> — without it
// ESLint fatally fails to parse and silently skips those files.
export default [
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "off",
      "vue/require-explicit-emits": "off",
    },
  },
];
`,
    );
  }
  // Biome resolves biome.json by walking up from the file, so like the eslint
  // config it has to exist inside the lint corpus itself. Formatter disabled:
  // this surface measures linting, and `biome lint` must not be credited or
  // charged for format work the other linters here do not do.
  if (!existsSync(join(out, "biome.json"))) {
    writeFileSync(
      join(out, "biome.json"),
      `${JSON.stringify(
        {
          formatter: { enabled: false },
          linter: { enabled: true, rules: { recommended: true } },
        },
        null,
        2,
      )}\n`,
    );
  }
  // Same walk-up story as biome.json: oxlint resolves .oxlintrc.json from the
  // linted file upwards, and the corpus is not under the fixture dir, so the
  // config has to be written into the corpus itself. Without it oxlint would
  // run with the vue plugin OFF and be measured doing even less than it can.
  if (!existsSync(join(out, ".oxlintrc.json"))) {
    writeFileSync(join(out, ".oxlintrc.json"), OXLINT_CONFIG);
  }
  writeFileSync(
    join(out, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name: `bench-lint-${label}` }, null, 2)}\n`,
  );
  return out;
}

export function prepareFormatCopy(inputDir, files, workRoot, label, invocation) {
  const out = join(workRoot, "format", `${label}-${String(invocation).padStart(4, "0")}`);
  // .prettierrc.json and biome.json must travel with the copy: both tools
  // resolve config by walking up from the file, and the work dir is not under
  // the fixture dir, so a config left behind in the fixture root would never be
  // applied — each tool would silently fall back to its own defaults.
  copyFixtureSubset(inputDir, out, files, [".prettierrc.json", "biome.json"]);
  return out;
}
