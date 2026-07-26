#!/usr/bin/env node
/**
 * Prepare workspaces for VS Code headless E2E benchmarks.
 *
 *   fixtures/e2e/regular   — single-package Vue app
 *   fixtures/e2e/monorepo  — multi-package workspace (shared UI + app)
 *   fixtures/e2e/nuxt-ui   — optional real project clone (pinned ref)
 *
 * Usage:
 *   node scripts/e2e-vscode/setup-workspaces.mjs
 *   node scripts/e2e-vscode/setup-workspaces.mjs --with-nuxt-ui
 *   node scripts/e2e-vscode/setup-workspaces.mjs --with-nuxt-ui --nuxt-ui-ref=v3.1.3
 */

import {
  mkdirSync,
  rmSync,
  writeFileSync,
  existsSync,
  symlinkSync,
  readdirSync,
  statSync,
  readFileSync,
} from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const e2eRoot = join(rootDir, "fixtures", "e2e");
const DEFAULT_NUXT_UI_REF = process.env.NUXT_UI_REF || "v3.1.3";
const NUXT_UI_REPO = "https://github.com/nuxt/ui.git";

function parseArgs(argv) {
  const args = {
    withNuxtUi: false,
    nuxtUiRef: DEFAULT_NUXT_UI_REF,
    skipInstall: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--with-nuxt-ui") args.withNuxtUi = true;
    else if (a === "--nuxt-ui-ref") args.nuxtUiRef = argv[++i];
    else if (a.startsWith("--nuxt-ui-ref=")) args.nuxtUiRef = a.slice("--nuxt-ui-ref=".length);
    else if (a === "--skip-install") args.skipInstall = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function linkRootNodeModules(dir) {
  const nm = join(dir, "node_modules");
  const rootNm = join(rootDir, "node_modules");
  try {
    if (existsSync(nm)) rmSync(nm, { recursive: true, force: true });
    symlinkSync(rootNm, nm, process.platform === "win32" ? "junction" : "dir");
  } catch (e) {
    console.warn(`symlink node_modules failed for ${dir}: ${e.message}`);
  }
}

function writeFiles(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
}

function writeVuePackage(dir, { name, files, extraDeps = {} }) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify(
      {
        name,
        private: true,
        type: "module",
        dependencies: { vue: "3.5.40", ...extraDeps },
        devDependencies: { typescript: "5.9.3" },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          jsx: "preserve",
          noEmit: true,
          skipLibCheck: true,
          lib: ["ESNext", "DOM"],
        },
        include: ["src/**/*.vue", "src/**/*.ts", "env.d.ts"],
      },
      null,
      2,
    )}\n`,
  );
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
  writeFiles(dir, files);
  linkRootNodeModules(dir);
}

function setupRegular() {
  const dir = join(e2eRoot, "regular");
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  writeVuePackage(dir, {
    name: "e2e-regular",
    files: {
      "src/App.vue": `<template>
  <main class="app">
    <h1>{{ title }}</h1>
    <p>{{ e2eMarker }}</p>
    <Hello :name="title" @greet="onGreet" />
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Hello from './components/Hello.vue'

/** Stable E2E hover target — do not rename. */
const e2eMarker = ref('regular-repo-probe')

const title = computed(() => 'Regular ' + e2eMarker.value)

function onGreet(msg: string): void {
  e2eMarker.value = msg
}
</script>
`,
      "src/components/Hello.vue": `<template>
  <button type="button" @click="$emit('greet', name)">Hello {{ name }}</button>
</template>
<script setup lang="ts">
defineProps<{ name: string }>()
defineEmits<{ greet: [msg: string] }>()
</script>
`,
      "src/main.ts": `import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount('#app')
`,
      "e2e-probe.json": `${JSON.stringify(
        { kind: "regular", file: "src/App.vue", symbol: "e2eMarker" },
        null,
        2,
      )}\n`,
    },
  });
  console.log(`✓ regular → ${dir}`);
  return dir;
}

function setupMonorepo() {
  const dir = join(e2eRoot, "monorepo");
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "e2e-monorepo", private: true }, null, 2)}\n`,
  );
  writeFileSync(join(dir, "pnpm-workspace.yaml"), `packages:\n  - "packages/*"\n`);

  writeVuePackage(join(dir, "packages", "ui"), {
    name: "@e2e/ui",
    files: {
      "src/Button.vue": `<template>
  <button type="button" class="ui-btn" @click="$emit('click')">
    <slot />{{ monoMarker }}
  </button>
</template>
<script setup lang="ts">
import { ref } from 'vue'
/** Stable monorepo hover target in shared package. */
const monoMarker = ref('monorepo-ui-probe')
defineEmits<{ click: [] }>()
defineExpose({ monoMarker })
</script>
`,
      "src/index.ts": `export { default as UiButton } from './Button.vue'\n`,
    },
  });

  writeVuePackage(join(dir, "packages", "app"), {
    name: "@e2e/app",
    files: {
      "src/App.vue": `<template>
  <main>
    <h1>{{ title }}</h1>
    <ButtonLocal @click="n++">count {{ n }}</ButtonLocal>
  </main>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
// Relative import across packages (no install needed for resolution walk)
import ButtonLocal from '../../ui/src/Button.vue'
const n = ref(0)
const title = computed(() => 'Monorepo app')
</script>
`,
      "src/main.ts": `import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount('#app')
`,
    },
  });

  writeFileSync(
    join(dir, "e2e-probe.json"),
    `${JSON.stringify(
      {
        kind: "monorepo",
        file: "packages/ui/src/Button.vue",
        symbol: "monoMarker",
      },
      null,
      2,
    )}\n`,
  );
  console.log(`✓ monorepo → ${dir}`);
  return dir;
}

function run(cmd, args, cwd) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`);
}

function findFirstVue(dir, base, depth = 0) {
  if (!existsSync(dir) || depth > 8) return null;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return null;
  }
  for (const e of entries) {
    if (["node_modules", ".git", "dist", ".nuxt", ".output"].includes(e)) continue;
    const full = join(dir, e);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isFile() && e.endsWith(".vue")) {
      return relative(base, full).replace(/\\/g, "/");
    }
  }
  for (const e of entries) {
    if (["node_modules", ".git", "dist", ".nuxt", ".output"].includes(e)) continue;
    const full = join(dir, e);
    try {
      if (statSync(full).isDirectory()) {
        const found = findFirstVue(full, base, depth + 1);
        if (found) return found;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function setupNuxtUi({ ref, skipInstall }) {
  const dir = join(e2eRoot, "nuxt-ui");
  if (existsSync(join(dir, ".git"))) {
    console.log(`nuxt-ui present; checkout ${ref}...`);
    run("git", ["fetch", "--tags", "--force", "origin"], dir);
    run("git", ["checkout", "--force", ref], dir);
  } else {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    mkdirSync(e2eRoot, { recursive: true });
    run("git", ["clone", "--filter=blob:none", NUXT_UI_REPO, "nuxt-ui"], e2eRoot);
    run("git", ["checkout", "--force", ref], dir);
  }

  const candidates = [
    "src/runtime/components/Button.vue",
    "src/runtime/components/App.vue",
    "docs/app/app.vue",
  ];
  let probeFile = candidates.find((c) => existsSync(join(dir, c))) ?? null;
  if (!probeFile) probeFile = findFirstVue(join(dir, "src"), dir) ?? findFirstVue(dir, dir);

  writeFileSync(
    join(dir, "e2e-probe.json"),
    `${JSON.stringify(
      {
        kind: "nuxt-ui",
        ref,
        repo: NUXT_UI_REPO,
        file: probeFile,
        symbol: null,
      },
      null,
      2,
    )}\n`,
  );

  if (!skipInstall) {
    // E2E only needs sources + enough deps for the language server. Native
    // optional modules (e.g. better-sqlite3) often fail to compile on Windows
    // CI/dev boxes — prefer --ignore-scripts and never abort setup if the
    // probe .vue file already exists.
    if (existsSync(join(dir, "pnpm-lock.yaml"))) {
      try {
        run("pnpm", ["install", "--frozen-lockfile", "--ignore-scripts"], dir);
      } catch {
        console.warn("frozen+ignore-scripts install failed; retrying loose install --ignore-scripts");
        try {
          run("pnpm", ["install", "--ignore-scripts"], dir);
        } catch (e) {
          console.warn(
            `nuxt-ui install failed (${e.message}); continuing with sources only for LSP e2e`,
          );
        }
      }
    } else if (existsSync(join(dir, "package-lock.json"))) {
      try {
        run("npm", ["ci", "--ignore-scripts"], dir);
      } catch (e) {
        console.warn(`npm ci failed (${e.message}); continuing with sources only`);
      }
    } else {
      console.warn("No lockfile — skip install");
    }
  }

  if (!probeFile || !existsSync(join(dir, probeFile))) {
    throw new Error(`nuxt-ui setup: no probe .vue file under ${dir}`);
  }

  console.log(`✓ nuxt-ui@${ref} → ${dir} (probe: ${probeFile})`);
  return dir;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      `Usage: node scripts/e2e-vscode/setup-workspaces.mjs [--with-nuxt-ui] [--nuxt-ui-ref <ref>]`,
    );
    process.exit(0);
  }
  mkdirSync(e2eRoot, { recursive: true });
  setupRegular();
  setupMonorepo();
  if (args.withNuxtUi) {
    setupNuxtUi({ ref: args.nuxtUiRef, skipInstall: args.skipInstall });
  } else {
    console.log("(skip nuxt-ui — pass --with-nuxt-ui to clone pinned real project)");
  }
}

main();
