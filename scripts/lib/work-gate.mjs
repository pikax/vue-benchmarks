/**
 * Lightweight "does this tool actually report planted failures?" gates.
 * Tools that skip real work are demoted to unranked (skipped), not sorted as fast.
 */
import { cpSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCommand } from "./timing.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Script-block plant: a plain TS assignment error. Any tool that typechecks
 * `<script setup>` at all will catch this.
 */
const BAD_SCRIPT_VUE = `<script setup lang="ts">
// plant: string assigned to number
const n: number = "not-a-number"
</script>
<template>
  <div>{{ n }}</div>
</template>
`;

/**
 * Template-block plant: the script is clean, the error exists ONLY in template
 * expressions. A tool that merely runs tsc over extracted script blocks passes
 * the script plant while doing none of the work that makes a Vue typechecker a
 * Vue typechecker — this plant is what separates the two.
 *
 * `:disabled` on a native button expects boolean and gets string; `@click`
 * expects a handler and gets a number. Requires vueCompilerOptions.strictTemplates.
 */
const BAD_TEMPLATE_VUE = `<script setup lang="ts">
const disabledFlag: string = "yes"
const notAHandler = 123
</script>
<template>
  <!-- plant: :disabled expects boolean; @click expects a function -->
  <button type="button" :disabled="disabledFlag" @click="notAHandler">go</button>
</template>
`;

/**
 * The combined template plant above carries TWO independent errors, and a
 * gate that accepts "at least one diagnostic" passes a tool that finds only
 * the easier half. Measured: one native checker reports the `@click` handler
 * mismatch and silently misses the `:disabled` prop-type mismatch, yet still
 * earned a ✓.
 *
 * Splitting them into single-error projects makes each capability its own
 * pass/fail, so partial coverage cannot hide behind a sibling diagnostic.
 */
const BAD_TEMPLATE_PROP_VUE = `<script setup lang="ts">
const disabledFlag: string = "yes"
</script>
<template>
  <!-- plant: :disabled on a native button expects boolean, gets string -->
  <button type="button" :disabled="disabledFlag">go</button>
</template>
`;

const BAD_TEMPLATE_EVENT_VUE = `<script setup lang="ts">
const notAHandler = 123
</script>
<template>
  <!-- plant: @click expects a function, gets a number -->
  <button type="button" @click="notAHandler">go</button>
</template>
`;

/** Corpus plant: both failure modes in one file, appended to the real corpus. */
const BAD_CORPUS_VUE = `<script setup lang="ts">
const n: number = "not-a-number"
const disabledFlag: string = "yes"
</script>
<template>
  <button type="button" :disabled="disabledFlag">{{ n }}</button>
</template>
`;

const DIRTY_VUE = `<script setup>
const html = "<b>x</b>"
</script>
<template>
  <!-- plant: vue/no-v-html -->
  <div v-html="html"></div>
</template>
`;

/**
 * Returns true if the CLI appears to perform real diagnostics on a planted bug.
 * @param {{ bin: string, args: string[], cwd: string, shell?: boolean, env?: object, expectErrors?: boolean }} opts
 */
export function cliReportsPlantedIssue(opts) {
  const { bin, args, cwd, shell = false, env = {}, expectErrors = true, mustMention } = opts;
  if (!bin) return false;
  try {
    const r = runCommand(bin, args, {
      cwd,
      shell,
      env,
      allowNonZeroExit: true,
    });
    const text = `${r.stdout || ""}${r.stderr || ""}`;
    if (!expectErrors) {
      return r.status === 0;
    }
    // The diagnostic must name the planted file. Without this, an unrelated
    // project-level failure (a config file that will not resolve, say) reads as
    // a pass and the gate silently stops gating. Verified that vue-tsc, vize,
    // golar and verter-tsc all print the offending filename.
    if (mustMention && !text.includes(mustMention)) return false;
    // Prefer non-zero exit OR explicit error diagnostics in output
    if (r.status !== 0 && r.status !== null) {
      // Exit non-zero alone is weak if the tool merely crashed (IO error, missing config).
      // Require either diagnostic-looking text or accept when status is clearly "found issues".
      if (
        /(TS\d+|not assignable|error\(s\)|Type '|Cannot find)/i.test(text) ||
        (/\d+\s+error/i.test(text) && !/\b0\s+error/i.test(text))
      ) {
        return true;
      }
      // Still accept non-zero if output is not an obvious tool crash
      if (!/IO error|Access is denied|No \.vue|not found|ENOENT/i.test(text)) {
        return true;
      }
    }
    if (/\berror\b/i.test(text) && /(TS\d+|not assignable|Cannot find|Type ')/i.test(text)) {
      return true;
    }
    // The zero-error guards need a word boundary: "Found 10 errors" contains
    // the substring "0 errors", so an unanchored /0\s+error/ reads any count
    // ending in 0 as "no diagnostics" and unranks a tool that did find the plant.
    if (/error\(s\)/i.test(text) && !/\b0 error\(s\)/i.test(text)) return true;
    // ESLint-style: "error" rule hits
    if (/\d+\s+error/i.test(text) && !/\b0\s+error/i.test(text)) return true;
    // Lint tools may report severity as warning (e.g. Vize ⚠) while still flagging the plant
    if (
      /(?:no-v-html|v-html|vue\/no-v-html)/i.test(text) &&
      /(?:error|warning|⚠|✖|\bx\b|\d+\s+warning)/i.test(text)
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Shared project scaffolding for a one-file typecheck plant. */
function writePlantProject(dir, badFileSource, name) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify(
      {
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
          lib: ["ESNext", "DOM"],
          types: [],
        },
        // Required for the template plant: without strictTemplates a native
        // element's prop types are not checked.
        vueCompilerOptions: { strictTemplates: true },
        include: ["**/*.vue", "**/*.ts"],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(dir, "env.d.ts"),
    `/// <reference types="vue/macros-global" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
`,
  );
  writeFileSync(join(dir, "Bad.vue"), badFileSource);
  writeFileSync(
    join(dir, "golar.config.ts"),
    `import { defineConfig } from "golar/unstable";\nimport "@golar/vue";\nexport default defineConfig({});\n`,
  );
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name, private: true, type: "module" }),
  );
  return dir;
}

/**
 * Prepare typecheck plant projects.
 *
 * Two independent projects, and a tool must fail BOTH to be ranked:
 *   script/   — error in `<script setup>` only
 *   template/ — script is clean, error is only in template expressions
 *
 * A single script-level plant was not enough: a tool that extracts script
 * blocks and shells out to tsc passes it while doing none of the template
 * checking that dominates real vue-tsc cost.
 */
export function prepareTypecheckPlant(workRoot) {
  // Unique dir avoids Windows EPERM when a previous plant is still locked
  const root = join(workRoot, `work-gate-typecheck-${process.pid}-${Date.now().toString(36)}`);
  const scriptDir = writePlantProject(join(root, "script"), BAD_SCRIPT_VUE, "work-gate-tc-script");
  const templateDir = writePlantProject(
    join(root, "template"),
    BAD_TEMPLATE_VUE,
    "work-gate-tc-template",
  );
  // Each template capability gated independently — see BAD_TEMPLATE_PROP_VUE.
  const templatePropDir = writePlantProject(
    join(root, "template-prop"),
    BAD_TEMPLATE_PROP_VUE,
    "work-gate-tc-template-prop",
  );
  const templateEventDir = writePlantProject(
    join(root, "template-event"),
    BAD_TEMPLATE_EVENT_VUE,
    "work-gate-tc-template-event",
  );

  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");

  return {
    dir: scriptDir, // back-compat for callers expecting a single dir
    scriptDir,
    templateDir,
    templatePropDir,
    templateEventDir,
    nodePath,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

/**
 * Plant one bad SFC into a copy of the REAL timed corpus and return the dir.
 *
 * The small plant projects prove a tool can find a bug in a 1-file project.
 * This proves it still finds one at corpus scale with the same tsconfig the
 * timed run uses — catching a tool that silently degrades, samples, or bails
 * on large projects.
 */
export function prepareCorpusPlant(checkDir) {
  // Sibling of checkDir, NOT under workRoot: prepareTypecheckDir writes a
  // RELATIVE compilerOptions.paths.vue pointing at the repo's node_modules.
  // Copying the project to a different directory depth silently breaks that
  // path, `vue` stops resolving, template typechecking degrades to nothing,
  // and every tool then fails the gate for the wrong reason.
  const dir = join(dirname(checkDir), `${basename(checkDir)}-workgate-${process.pid}`);
  rmSync(dir, { recursive: true, force: true });
  cpSync(checkDir, dir, { recursive: true });

  const planted = "__WorkGatePlant.vue";
  writeFileSync(join(dir, planted), BAD_CORPUS_VUE);

  // The timed tsconfig lists files explicitly — the plant must be added to it,
  // and strictTemplates enabled so the template half of the plant is checked.
  const tsconfigPath = join(dir, "tsconfig.json");
  try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
    if (Array.isArray(tsconfig.include) && !tsconfig.include.includes(planted)) {
      tsconfig.include.push(planted);
    }
    tsconfig.vueCompilerOptions = {
      ...(tsconfig.vueCompilerOptions ?? {}),
      strictTemplates: true,
    };
    writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);
  } catch {
    // If the tsconfig cannot be read the gate will simply fail closed.
  }

  return {
    dir,
    plantedFile: planted,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

/**
 * Prepare a tiny lint plant (v-html dirty).
 */
export function prepareLintPlant(workRoot) {
  const dir = join(workRoot, `work-gate-lint-${process.pid}-${Date.now().toString(36)}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "Dirty.vue"), DIRTY_VUE);
  writeFileSync(
    join(dir, "eslint.config.mjs"),
    `import pluginVue from "eslint-plugin-vue";
export default [
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "error",
    },
  },
];
`,
  );
  return {
    dir,
    dirtyFile: join(dir, "Dirty.vue"),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

/**
 * Mark variants unranked (skip) if they fail the work gate.
 */
export function applyWorkGate(variants, gateFn) {
  for (const v of variants) {
    if (v.skip) continue;
    let ok = false;
    try {
      ok = gateFn(v);
    } catch {
      ok = false;
    }
    if (!ok) {
      // Measure it anyway, but never rank it.
      //
      // Marking it `skip` dropped the tool from the table entirely, which hid
      // the interesting part: a tool is usually fast *because* it failed
      // validation. Showing the time in brackets next to the reason lets a
      // reader see the trade — "118ms, but it misses prop-type checking" —
      // instead of silently omitting the row.
      v.unranked = true;
      v.notes =
        `${v.notes || ""} | ⚠ FAILED VALIDATION — time shown in brackets, excluded from ranking`.trim();
    }
  }
  return variants;
}

/**
 * Gate a typecheck CLI variant.
 *
 * Requires diagnostics on BOTH the script-only and the template-only plant.
 * Returns a detail object so the report can say which half a tool missed
 * rather than just marking it unranked.
 */
export function typecheckGateDetail(bin, args, plant, { shell = false, env = {} } = {}) {
  if (!bin || !existsSync(plant.scriptDir) || !existsSync(plant.templateDir)) {
    return { ok: false, script: false, template: false };
  }
  const run = (cwd) =>
    cliReportsPlantedIssue({
      bin,
      args,
      cwd,
      shell,
      env: { NODE_PATH: plant.nodePath, ...env },
      expectErrors: true,
      mustMention: "Bad.vue",
    });
  const script = run(plant.scriptDir);
  // EVERY planted error must be found, not merely one of them. The two
  // template capabilities are checked in isolated single-error projects so a
  // tool cannot pass on the strength of whichever half it happens to support.
  const templateProp = plant.templatePropDir ? run(plant.templatePropDir) : false;
  const templateEvent = plant.templateEventDir ? run(plant.templateEventDir) : false;
  const template = templateProp && templateEvent;
  return { ok: script && template, script, template, templateProp, templateEvent };
}

/** Boolean form of {@link typecheckGateDetail}. */
export function typecheckGateFor(bin, args, plant, opts = {}) {
  return typecheckGateDetail(bin, args, plant, opts).ok;
}

/**
 * Verify a tool still reports the planted bug on the FULL timed corpus,
 * using the same tsconfig the measured runs use.
 */
export function corpusGateFor(bin, args, corpusPlant, { shell = false, env = {} } = {}) {
  if (!bin || !corpusPlant?.dir || !existsSync(corpusPlant.dir)) return false;
  return cliReportsPlantedIssue({
    bin,
    args,
    cwd: corpusPlant.dir,
    shell,
    env,
    expectErrors: true,
    // Must name the planted file specifically — the corpus is large and a tool
    // may legitimately emit other diagnostics.
    mustMention: corpusPlant.plantedFile,
  });
}

/**
 * Gate eslint (programmatic) against Dirty.vue with no-v-html.
 */
export async function eslintReportsPlant(plant, eslintPath) {
  if (!eslintPath || !plant?.dir) return false;
  try {
    const { createRequire } = await import("node:module");
    const req = createRequire(import.meta.url);
    const { ESLint } = req(eslintPath);
    const eslint = new ESLint({
      overrideConfigFile: join(plant.dir, "eslint.config.mjs"),
      cwd: plant.dir,
    });
    const results = await eslint.lintFiles([plant.dirtyFile]);
    const errorCount = results.reduce((n, r) => n + (r.errorCount || 0), 0);
    const rules = results.flatMap((r) => (r.messages || []).map((m) => m.ruleId).filter(Boolean));
    return errorCount > 0 || rules.includes("vue/no-v-html");
  } catch {
    return false;
  }
}
