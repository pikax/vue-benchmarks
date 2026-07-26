/**
 * Build a small, stable LSP workspace with known hover/completion targets.
 * Separate from the bulk unique corpus so positions stay deterministic.
 */

import { mkdirSync, rmSync, writeFileSync, existsSync, symlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Hover target: identifier `benchMarker` in script setup.
 * Position is documented in HOVER_PROBE (0-based, UTF-16).
 */
export const HOVER_PROBE = {
  // 0-based line/character into LspTarget.vue (UTF-16)
  // Keep in sync with generateLspWorkspace source below.
  line: null, // filled after write by scanning
  character: null,
  symbol: "benchMarker",
};

const TARGET_SOURCE = `<template>
  <section class="lsp-target">
    <h1>{{ title }}</h1>
    <p>{{ benchMarker }}</p>
    <button type="button" @click="increment">{{ count }}</button>
    <Child :label="title" @select="onSelect" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Child from './Child.vue'

/** Stable hover target for LSP benchmarks — do not rename. */
const benchMarker = ref('lsp-probe-token')

const count = ref(0)
const title = computed(() => 'LSP target ' + benchMarker.value)

function increment(): void {
  count.value += 1
}

function onSelect(id: string): void {
  benchMarker.value = id
}

defineExpose({ benchMarker, count })
</script>

<style scoped>
.lsp-target { padding: 12px; }
</style>
`;

const CHILD_SOURCE = `<template>
  <button type="button" class="child" @click="$emit('select', label)">{{ label }}</button>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
defineEmits<{ select: [id: string] }>()
</script>
`;

function findSymbolPosition(source, symbol) {
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const idx = lines[i].indexOf(symbol);
    if (idx !== -1 && lines[i].includes(`const ${symbol}`)) {
      return { line: i, character: idx + "const ".length };
    }
  }
  // fallback: first occurrence
  for (let i = 0; i < lines.length; i++) {
    const idx = lines[i].indexOf(symbol);
    if (idx !== -1) return { line: i, character: idx };
  }
  throw new Error(`Could not locate symbol ${symbol} in LSP target`);
}

/**
 * Create/refresh fixtures/lsp-workspace with package wiring to root node_modules/vue.
 */
export function ensureLspWorkspace(options = {}) {
  const dir = options.dir ?? join(rootDir, "fixtures", "lsp-workspace");
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, "LspTarget.vue"), TARGET_SOURCE);
  writeFileSync(join(dir, "Child.vue"), CHILD_SOURCE);

  // Extra files so "workspace" is non-trivial (imports still resolve via relative paths)
  const bulkCount = options.bulkFiles ?? 20;
  for (let i = 0; i < bulkCount; i++) {
    writeFileSync(
      join(dir, `Bulk${String(i).padStart(3, "0")}.vue`),
      `<template><div>bulk {{ n }}</div></template>
<script setup lang="ts">
import { ref } from 'vue'
const n = ref(${i})
</script>
`,
    );
  }

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
          // Required for Volar hybrid tsserver path (same as real VS Code Vue projects)
          plugins: [{ name: "@vue/typescript-plugin" }],
        },
        include: ["**/*.vue", "**/*.ts"],
        vueCompilerOptions: {
          target: 3.5,
        },
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

  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify(
      {
        private: true,
        type: "module",
        name: "vue-bench-lsp-workspace",
        dependencies: {
          vue: "3.5.40",
        },
      },
      null,
      2,
    )}\n`,
  );

  // Point node_modules at repo root so Volar/TS resolve `vue` without a second install.
  const nm = join(dir, "node_modules");
  const rootNm = join(rootDir, "node_modules");
  try {
    if (existsSync(nm)) rmSync(nm, { recursive: true, force: true });
    // 'junction' works without admin on Windows; 'dir' on posix
    symlinkSync(rootNm, nm, process.platform === "win32" ? "junction" : "dir");
  } catch (e) {
    // Non-fatal: resolution may still walk up to root node_modules
    if (process.env.LSP_BENCH_DEBUG) {
      console.warn("lsp-workspace symlink failed:", e.message);
    }
  }

  const probe = findSymbolPosition(TARGET_SOURCE, "benchMarker");
  writeFileSync(
    join(dir, "lsp-probe.json"),
    `${JSON.stringify(
      {
        file: "LspTarget.vue",
        symbol: "benchMarker",
        position: probe,
        encoding: "utf-16",
        note: "0-based line/character for textDocument/hover on const benchMarker",
      },
      null,
      2,
    )}\n`,
  );

  return {
    dir,
    file: join(dir, "LspTarget.vue"),
    fileRel: "LspTarget.vue",
    probe,
    source: TARGET_SOURCE,
  };
}
