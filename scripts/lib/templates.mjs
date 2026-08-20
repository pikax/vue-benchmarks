/**
 * Diverse SFC templates + uniquify.
 *
 * Unique bodies model distinct project files and prevent any compiler-specific
 * duplicate-body shortcut from changing the primary workload.
 */

/** Replace __BENCH_ID__ or inject a unique token so every file has a unique body. */
export function uniquify(template, index) {
  const id = String(index).padStart(5, "0");
  if (template.includes("__BENCH_ID__")) {
    return template.replaceAll("__BENCH_ID__", id);
  }
  // Fallback: unique string in a comment (always unique, even if template is static)
  return `${template.trimEnd()}\n<!-- bench-unique:${id} -->\n`;
}

export function createTemplates({ vapor = false } = {}) {
  const scriptOpen = vapor ? `<script setup lang="ts" vapor>` : `<script setup lang="ts">`;
  const scriptOpenJs = vapor ? `<script setup vapor>` : `<script setup>`;

  return [
    // 0 simple
    `<template>
  <div class="hello-__BENCH_ID__">{{ message }}</div>
</template>
${scriptOpenJs}
import { ref } from 'vue'
const message = ref('Hello __BENCH_ID__')
</script>
`,
    // 1 with style
    `<template>
  <div class="container c-__BENCH_ID__">
    <h1>{{ title }}</h1>
    <p>{{ content }}</p>
  </div>
</template>
${scriptOpenJs}
import { ref } from 'vue'
const title = ref('Title __BENCH_ID__')
const content = ref('Content for __BENCH_ID__')
</script>
<style scoped>
.container { padding: 20px; }
h1 { color: #333; }
</style>
`,
    // 2 list + conditionals
    `<template>
  <div class="app a-__BENCH_ID__">
    <header>
      <h1>{{ title }}</h1>
      <nav>
        <a v-for="link in links" :key="link.id" :href="link.url">{{ link.text }}</a>
      </nav>
    </header>
    <main>
      <section v-if="loading">Loading...</section>
      <section v-else>
        <article v-for="item in items" :key="item.id">
          <h2>{{ item.title }}</h2>
          <p>{{ item.body }}</p>
          <button type="button" @click="selectItem(item)">Select</button>
        </article>
      </section>
    </main>
  </div>
</template>
${scriptOpenJs}
import { ref, computed } from 'vue'
const title = ref('App __BENCH_ID__')
const loading = ref(false)
const items = ref([
  { id: 1, title: 'One', body: 'Body A __BENCH_ID__' },
  { id: 2, title: 'Two', body: 'Body B __BENCH_ID__' },
])
const links = ref([
  { id: 1, url: '/', text: 'Home' },
  { id: 2, url: '/about', text: 'About' },
])
function selectItem(item) { console.log('Selected', item.id, '__BENCH_ID__') }
</script>
<style scoped>
.app { max-width: 1200px; margin: 0 auto; }
</style>
`,
    // 3 form
    `<template>
  <form class="form f-__BENCH_ID__" @submit.prevent="submit">
    <label>Name <input v-model="name" /></label>
    <label>Email <input v-model="email" type="email" /></label>
    <label>Count <input v-model.number="count" type="number" /></label>
    <p v-if="error" class="err">{{ error }}</p>
    <button type="submit" :disabled="!valid">Send {{ count }}</button>
  </form>
</template>
${scriptOpen}
import { computed, ref } from 'vue'
const name = ref('User __BENCH_ID__')
const email = ref('user-__BENCH_ID__@example.com')
const count = ref(1)
const error = ref('')
const valid = computed(() => name.value.length > 0 && email.value.includes('@'))
function submit() {
  if (!valid.value) { error.value = 'invalid'; return }
  error.value = ''
}
</script>
<style scoped>
.form { display: grid; gap: 8px; }
.err { color: #b91c1c; }
</style>
`,
    // 4 dashboard-ish
    `<template>
  <section class="dash d-__BENCH_ID__">
    <header>
      <h1>{{ title }}</h1>
      <button type="button" @click="refresh">Refresh</button>
    </header>
    <div class="stats">
      <article v-for="stat in stats" :key="stat.id" :style="{ borderColor: stat.color }">
        <h2>{{ stat.value }}</h2>
        <p>{{ stat.label }}</p>
      </article>
    </div>
    <ul>
      <li v-for="row in rows" :key="row.id">
        <span>{{ row.name }}</span>
        <strong>{{ row.score + offset }}</strong>
      </li>
    </ul>
  </section>
</template>
${scriptOpen}
import { ref } from 'vue'
const title = ref('Dashboard __BENCH_ID__')
const offset = ref(3)
const stats = ref([
  { id: 1, label: 'Users', value: '1,234', color: '#4CAF50' },
  { id: 2, label: 'Revenue', value: '$9k', color: '#2196F3' },
])
const rows = ref(
  Array.from({ length: 8 }, (_, i) => ({ id: i, name: 'Row ' + i + ' __BENCH_ID__', score: i * 3 })),
)
function refresh() { offset.value += 1 }
</script>
<style scoped>
.dash { display: grid; gap: 12px; }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>
`,
    // 5 options API (only when not vapor — vapor needs script setup)
    ...(vapor
      ? []
      : [
          `<template>
  <section class="options o-__BENCH_ID__">
    <h1>{{ title }}</h1>
    <input v-model="query" />
    <ul>
      <li v-for="t in visible" :key="t.id">{{ t.summary }} — {{ t.owner }}</li>
    </ul>
    <button type="button" @click="toggle">Toggle archive</button>
  </section>
</template>
<script>
export default {
  name: 'OptionsBench__BENCH_ID__',
  data() {
    return {
      title: 'Options __BENCH_ID__',
      query: '',
      showArchived: false,
      tickets: [
        { id: 1, summary: 'A __BENCH_ID__', owner: 'Aki', archived: false },
        { id: 2, summary: 'B __BENCH_ID__', owner: 'Mika', archived: true },
      ],
    }
  },
  computed: {
    visible() {
      return this.tickets.filter((t) => {
        const q = !this.query || t.summary.includes(this.query)
        return q && (this.showArchived || !t.archived)
      })
    },
  },
  methods: {
    toggle() { this.showArchived = !this.showArchived },
  },
}
</script>
<style scoped>
.options { padding: 12px; }
</style>
`,
        ]),
    // 6 typed heavy
    `<template>
  <section class="typed t-__BENCH_ID__">
    <h1>{{ headline }}</h1>
    <article v-for="r in decorated" :key="r.id">
      <h2>{{ r.name }}</h2>
      <p>{{ r.summary }}</p>
      <meter :value="r.score" min="0" max="100" />
      <button type="button" @click="select(r)">Select</button>
    </article>
    <footer>{{ selected?.name ?? 'none' }}</footer>
  </section>
</template>
${scriptOpen}
import { computed, ref } from 'vue'
type State = { kind: 'ready' } | { kind: 'pending'; percent: number } | { kind: 'failed'; reason: string }
type Res = { id: number; name: string; weight: number; state: State; owner: string }
const headline = computed(() => 'Typed __BENCH_ID__')
const selected = ref<(Res & { score: number; summary: string }) | null>(null)
const resources = ref<Res[]>([
  { id: 1, name: 'Compiler', weight: 0.9, state: { kind: 'ready' }, owner: 'Core' },
  { id: 2, name: 'Checker', weight: 0.6, state: { kind: 'pending', percent: 40 }, owner: 'Types' },
  { id: 3, name: 'Linter', weight: 0.4, state: { kind: 'failed', reason: 'rule __BENCH_ID__' }, owner: 'Lint' },
])
function scoreOf(r: Res): number {
  const base = r.state.kind === 'ready' ? 100 : r.state.kind === 'pending' ? 60 : 15
  return Math.round(base * r.weight)
}
const decorated = computed(() =>
  resources.value.map((r) => ({ ...r, score: scoreOf(r), summary: r.owner + ' / __BENCH_ID__' })),
)
function select(r: Res & { score: number; summary: string }) { selected.value = r }
</script>
<style scoped>
.typed { display: grid; gap: 8px; }
</style>
`,
    // 7 large-ish template
    createLargeTemplate(),
    // 8 card component (matches earlier shape)
    `<template>
  <section class="card card-__BENCH_ID__" :class="{ active }">
    <header>
      <h2>{{ title }}</h2>
      <p>#{{ id }} · {{ statusLabel }}</p>
    </header>
    <ul>
      <li v-for="(label, i) in labels" :key="i">
        <span>{{ label }}</span>
        <strong>{{ formatValue(count + i) }}</strong>
        <button type="button" @click="onSelect(String(i))">Select</button>
      </li>
    </ul>
    <footer>
      <button type="button" @click="increment">{{ count }}</button>
      <button type="button" @click="toggle">{{ active ? 'On' : 'Off' }}</button>
      <slot name="actions" :count="count" />
    </footer>
  </section>
</template>
${scriptOpen}
import { computed, ref, watch } from 'vue'
const props = withDefaults(defineProps<{ id?: string; title?: string; dense?: boolean }>(), {
  id: 'item-__BENCH_ID__',
  title: 'Component __BENCH_ID__',
  dense: false,
})
const emit = defineEmits<{ update: [value: number]; select: [id: string] }>()
const count = ref(1)
const active = ref(true)
const labels = computed(() => [props.title ?? 'x', 'metric-__BENCH_ID__', active.value ? 'live' : 'idle'])
const statusLabel = computed(() => (active.value ? 'active' : 'idle'))
watch(count, (v) => emit('update', v))
function formatValue(v: number): string { return String(v * 3) }
function increment() { count.value += 1 }
function toggle() { active.value = !active.value }
function onSelect(id: string) { emit('select', id) }
defineExpose({ count, reset() { count.value = 0 } })
</script>
<style scoped>
.card { border: 1px solid #e4e4e7; padding: 12px; }
.card.active { border-color: #2563eb; }
</style>
`,
  ];
}

function createLargeTemplate() {
  const panels = [];
  for (let i = 0; i < 12; i++) {
    const bucket = i % 4;
    panels.push(`    <article class="row r-${i}" :class="{ selected: active === ${bucket} }">
      <h3>{{ rows[${bucket}].title }}</h3>
      <p>{{ rows[${bucket}].eyebrow }} / {{ format(rows[${bucket}].score, ${i}) }}</p>
      <ul>
        <li v-for="item in rows[${bucket}].items" :key="item.id">{{ item.name }}: {{ item.score + ${i} }}</li>
      </ul>
      <button type="button" @click="activate(${bucket})">Open</button>
    </article>`);
  }
  return `<template>
  <main class="large large-__BENCH_ID__">
    <header>
      <h1>{{ title }}</h1>
      <p>{{ selected.title }}</p>
    </header>
${panels.join("\n")}
  </main>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
const title = ref('Large template __BENCH_ID__')
const active = ref(0)
const rows = ref(Array.from({ length: 4 }, (_, rowIndex) => ({
  eyebrow: 'Cluster ' + rowIndex,
  title: 'Group ' + rowIndex + ' __BENCH_ID__',
  score: rowIndex * 7,
  items: Array.from({ length: 4 }, (__, j) => ({
    id: rowIndex + '-' + j,
    name: 'Item ' + j,
    score: rowIndex * 10 + j,
  })),
})))
const selected = computed(() => rows.value[active.value])
function format(v: number, offset: number) { return v + offset }
function activate(i: number) { active.value = i }
</script>
<style scoped>
.large { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.row { border: 1px solid #d4d4d8; padding: 8px; }
.row.selected { border-color: #2563eb; }
</style>
`;
}

/**
 * Intentionally NON-unique body (same content every time).
 * Used only for the explicitly non-ranking repeated-input corpus.
 */
export function repeatedBodyTemplate() {
  return `<template>
  <div class="repeated">{{ message }}</div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const message = ref('IDENTICAL_BODY_FOR_CACHE_TEST')
</script>
<style scoped>
.repeated { padding: 8px; }
</style>
`;
}
