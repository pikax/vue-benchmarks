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

export function copyFixtureSubset(inputDir, outputDir, files, extras = []) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  for (const file of files) {
    copyFileSync(join(inputDir, file), join(outputDir, file));
  }
  for (const extra of extras) {
    const src = join(inputDir, extra);
    if (existsSync(src)) copyFileSync(src, join(outputDir, extra));
  }
  return outputDir;
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
