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
  writeFileSync(
    join(out, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name: `bench-lint-${label}` }, null, 2)}\n`,
  );
  return out;
}

export function prepareFormatCopy(inputDir, files, workRoot, label, invocation) {
  const out = join(workRoot, "format", `${label}-${String(invocation).padStart(4, "0")}`);
  // .prettierrc.json must travel with the copy: Prettier resolves config by
  // walking up from the file, and the work dir is not under the fixture dir,
  // so a config left behind in the fixture root would never be applied.
  copyFixtureSubset(inputDir, out, files, [".prettierrc.json"]);
  return out;
}

/**
 * Generate a realistic-enough Vue SFC for tooling workloads.
 * Deterministic for a given index so reruns compare the same corpus.
 */
export function generateSfcSource(index, { complexity = "normal", vapor = false } = {}) {
  const n = index;
  const propCount = complexity === "rich" ? 8 : 4;
  const props = Array.from({ length: propCount }, (_, i) => {
    const kinds = ["string", "number", "boolean", "'a' | 'b' | 'c'"];
    const kind = kinds[i % kinds.length];
    return `  p${i}${i % 3 === 0 ? "?" : ""}: ${kind}`;
  }).join("\n");

  const emits = `  (e: 'update', value: number): void
  (e: 'select', id: string): void`;

  // Vapor prefers Composition API + script setup; avoid Options-only patterns.
  // :key on v-for is still fine; keep templates Vapor-friendly (no filters, etc.).
  const listItems = Array.from({ length: complexity === "rich" ? 12 : 6 }, (_, i) => {
    return `      <li :key="'${n}-${i}'" class="item item-${i}" :data-n="${i}">
        <span>{{ labels[${i % 4}] }}</span>
        <strong>{{ formatValue(count + ${i}) }}</strong>
        <button type="button" @click="onSelect('${n}-${i}')">Select</button>
      </li>`;
  }).join("\n");

  // Vue 3.6 authoring style for Vapor components (`vapor` on script setup).
  // Compile benchmarks also force vapor via compiler flags on the same corpus.
  const scriptOpen = vapor ? `<script setup lang="ts" vapor>` : `<script setup lang="ts">`;

  return `<template>
  <section class="card card-${n % 7}" :class="{ active: active, dense: dense }">
    <header>
      <h2>{{ title }}</h2>
      <p class="subtitle">#{{ id }} · {{ statusLabel }}</p>
    </header>
    <div class="body">
      <p v-if="description">{{ description }}</p>
      <p v-else class="muted">No description for item ${n}.</p>
      <ul class="list">
${listItems}
      </ul>
      <footer>
        <button type="button" @click="increment">Count: {{ count }}</button>
        <button type="button" @click="toggle">{{ active ? 'On' : 'Off' }}</button>
        <slot name="actions" :count="count" />
      </footer>
    </div>
  </section>
</template>

${scriptOpen}
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    title?: string
    description?: string
    dense?: boolean
${props}
  }>(),
  {
    id: 'item-${n}',
    title: 'Component ${n}',
    dense: false,
  },
)

const emit = defineEmits<{
${emits}
}>()

const count = ref(${n % 50})
const active = ref(${n % 2 === 0})

const labels = computed(() => [
  props.title ?? 'Untitled',
  'metric-${n % 9}',
  active.value ? 'live' : 'idle',
  String(count.value),
])

const statusLabel = computed(() => (active.value ? 'active' : 'idle'))

watch(count, (value) => {
  emit('update', value)
})

function formatValue(value: number): string {
  return (value * 3 + ${n % 11}).toFixed(0)
}

function increment(): void {
  count.value += 1
}

function toggle(): void {
  active.value = !active.value
}

function onSelect(id: string): void {
  emit('select', id)
}

defineExpose({
  count,
  reset() {
    count.value = 0
  },
})
</script>

<style scoped>
.card {
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
}
.card.active {
  border-color: #2563eb;
}
.card.dense {
  padding: 6px;
}
.subtitle {
  color: #71717a;
  font-size: 0.875rem;
}
.list {
  list-style: none;
  padding: 0;
  margin: 8px 0;
}
.item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
}
.muted {
  color: #a1a1aa;
}
button {
  cursor: pointer;
}
</style>
`;
}
