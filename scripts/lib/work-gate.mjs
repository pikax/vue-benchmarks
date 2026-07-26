/**
 * Lightweight "does this tool actually report planted failures?" gates.
 * Tools that skip real work are demoted to unranked (skipped), not sorted as fast.
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCommand } from "./timing.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

const BAD_VUE = `<script setup lang="ts">
// plant: string assigned to number
const n: number = "not-a-number"
</script>
<template>
  <div>{{ n }}</div>
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
  const { bin, args, cwd, shell = false, env = {}, expectErrors = true } = opts;
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
    // Prefer non-zero exit OR explicit error diagnostics in output
    if (r.status !== 0 && r.status !== null) {
      // Exit non-zero alone is weak if the tool merely crashed (IO error, missing config).
      // Require either diagnostic-looking text or accept when status is clearly "found issues".
      if (
        /(TS\d+|not assignable|error\(s\)|Type '|Cannot find)/i.test(text) ||
        (/\d+\s+error/i.test(text) && !/0\s+error/i.test(text))
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
    if (/error\(s\)/i.test(text) && !/0 error\(s\)/i.test(text)) return true;
    // ESLint-style: "error" rule hits
    if (/\d+\s+error/i.test(text) && !/0\s+error/i.test(text)) return true;
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

/**
 * Prepare a tiny typecheck plant project; returns { dir, cleanup, nodePath }.
 */
export function prepareTypecheckPlant(workRoot) {
  // Unique dir avoids Windows EPERM when a previous plant is still locked
  const dir = join(workRoot, `work-gate-typecheck-${process.pid}-${Date.now().toString(36)}`);
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
  writeFileSync(join(dir, "Bad.vue"), BAD_VUE);
  writeFileSync(
    join(dir, "golar.config.ts"),
    `import { defineConfig } from "golar/unstable";\nimport "@golar/vue";\nexport default defineConfig({});\n`,
  );
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "work-gate-tc", private: true, type: "module" }),
  );

  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");

  return {
    dir,
    nodePath,
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
      v.skip = true;
      v.notes =
        `${v.notes || ""} | unranked: failed planted-bug work gate (no/too-few diagnostics)`.trim();
    }
  }
  return variants;
}

/**
 * Gate a typecheck CLI variant against the planted Bad.vue project.
 */
export function typecheckGateFor(
  bin,
  args,
  plant,
  { shell = false, env = {} } = {},
) {
  if (!bin || !existsSync(plant.dir)) return false;
  return cliReportsPlantedIssue({
    bin,
    args,
    cwd: plant.dir,
    shell,
    env: { NODE_PATH: plant.nodePath, ...env },
    expectErrors: true,
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
