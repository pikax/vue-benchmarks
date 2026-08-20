import { createHash } from "node:crypto";

import { SUPPLEMENTAL_COMPILE_VALIDITY_PLANTS } from "./compile-validity-supplemental-plants.mjs";

/**
 * Runtime-semantic plants for the raw SFC render comparison.
 *
 * Generated source is intentionally never compared with Vue's output. Each
 * oracle observes the mounted component instead: DOM, emitted events, public
 * instance behaviour, or Vue's documented directive semantics. Sources are
 * plain JavaScript so Verter's timed `forceJs:false` path remains executable.
 */

function equal(actual, expected, context) {
  if (actual !== expected) {
    throw new Error(
      `${context}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function truthy(value, context) {
  if (!value) throw new Error(context);
}

function mountPlant(mount, component, options, run) {
  const wrapper = mount(component, options);
  return Promise.resolve(run(wrapper)).finally(() => wrapper.unmount());
}

export const COMPILE_VALIDITY_SUITE_VERSION = "2026-08-20.2";

export const COMPILE_VALIDITY_PLANTS = Object.freeze([
  {
    id: "runtime-props-defaults-reactivity",
    coverage: ["defineProps", "runtime props", "defaults", "prop update", "computed"],
    source: `<script setup>
import { computed } from 'vue'
const props = defineProps({
  label: { type: String, default: 'fallback' },
  count: { type: Number, default: 2 }
})
const summary = computed(() => props.label + ':' + props.count)
</script>
<template><output data-plant="summary">{{ summary }}</output></template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        equal(wrapper.get('[data-plant="summary"]').text(), "fallback:2", "prop defaults");
        await wrapper.setProps({ label: "updated", count: 7 });
        equal(wrapper.get('[data-plant="summary"]').text(), "updated:7", "reactive props");
      });
    },
  },
  {
    id: "define-emits-payload",
    coverage: ["defineEmits", "event payload", "reactive event handler"],
    source: `<script setup>
import { ref } from 'vue'
const emit = defineEmits(['change'])
const count = ref(0)
function send() {
  count.value++
  emit('change', { value: count.value, kind: 'plant' })
}
</script>
<template><button data-plant="emit" @click="send">{{ count }}</button></template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        await wrapper.get('[data-plant="emit"]').trigger("click");
        equal(wrapper.get('[data-plant="emit"]').text(), "1", "reactive emit handler");
        const events = wrapper.emitted("change");
        truthy(events && events.length === 1, "defineEmits did not emit exactly once");
        equal(events[0][0]?.value, 1, "emitted payload value");
        equal(events[0][0]?.kind, "plant", "emitted payload field");
      });
    },
  },
  {
    id: "native-v-model-modifiers",
    coverage: ["native v-model", "trim modifier", "number modifier", "input events"],
    source: `<script setup>
import { ref } from 'vue'
const text = ref('')
const amount = ref(0)
</script>
<template>
  <input data-plant="trim" v-model.trim="text">
  <input data-plant="number" v-model.number="amount">
  <output data-plant="models">{{ text }}|{{ typeof amount }}:{{ amount }}</output>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        await wrapper.get('[data-plant="trim"]').setValue("  hello  ");
        await wrapper.get('[data-plant="number"]').setValue("42");
        equal(wrapper.get('[data-plant="models"]').text(), "hello|number:42", "v-model modifiers");
      });
    },
  },
  {
    id: "object-dynamic-bindings-events",
    coverage: ["v-bind object", "v-on object", "dynamic argument", "attribute removal"],
    source: `<script setup>
import { ref } from 'vue'
const attrs = ref({ id: 'first', title: 'hello' })
const dynamicName = ref('data-state')
const dynamicValue = ref('idle')
function update() {
  attrs.value = { id: 'second', 'aria-label': 'updated' }
  dynamicName.value = 'data-next'
  dynamicValue.value = 'ready'
}
const listeners = { click: update }
</script>
<template><button data-plant="bindings" v-bind="attrs" :[dynamicName]="dynamicValue" v-on="listeners">go</button></template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        const button = wrapper.get('[data-plant="bindings"]');
        equal(button.attributes("id"), "first", "initial v-bind object");
        equal(button.attributes("data-state"), "idle", "initial dynamic argument");
        await button.trigger("click");
        equal(button.attributes("id"), "second", "updated v-bind object");
        equal(button.attributes("aria-label"), "updated", "new object-bound attribute");
        truthy(
          button.attributes("title") === undefined,
          "removed object attribute remained in DOM",
        );
        truthy(
          button.attributes("data-state") === undefined,
          "old dynamic argument remained in DOM",
        );
        equal(button.attributes("data-next"), "ready", "updated dynamic argument");
      });
    },
  },
  {
    id: "scoped-slot-props",
    coverage: ["local component", "scoped slot", "slot props", "slot expression"],
    source: `<script setup>
import { h } from 'vue'
const SlotProvider = {
  setup(_, { slots }) {
    return () => h('section', { 'data-plant': 'provider' }, slots.default({ value: 'scoped' }))
  }
}
</script>
<template>
  <SlotProvider v-slot="{ value }">
    <span data-plant="slot-value">{{ value.toUpperCase() }}</span>
  </SlotProvider>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        truthy(wrapper.get('[data-plant="provider"]').exists(), "slot provider did not render");
        equal(wrapper.get('[data-plant="slot-value"]').text(), "SCOPED", "scoped slot prop");
      });
    },
  },
  {
    id: "svg-namespace-reactivity",
    coverage: ["SVG namespace", "SVG attributes", "SVG event", "reactive update"],
    source: `<script setup>
import { ref } from 'vue'
const radius = ref(4)
function grow() { radius.value = 9 }
</script>
<template>
  <svg data-plant="svg" viewBox="0 0 20 20">
    <circle data-plant="circle" cx="10" cy="10" :r="radius" @click="grow"></circle>
  </svg>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        const circle = wrapper.get('[data-plant="circle"]');
        equal(circle.element.namespaceURI, "http://www.w3.org/2000/svg", "SVG namespace");
        equal(circle.attributes("r"), "4", "initial SVG attribute");
        await circle.trigger("click");
        equal(circle.attributes("r"), "9", "reactive SVG attribute");
      });
    },
  },
  {
    id: "template-ref-define-expose",
    coverage: ["template ref", "onMounted", "defineExpose", "public instance"],
    source: `<script setup>
import { ref, onMounted } from 'vue'
const target = ref(null)
const mountedTag = ref('pending')
const count = ref(0)
function increment() { count.value++ }
defineExpose({ increment })
onMounted(() => { mountedTag.value = target.value.tagName.toLowerCase() })
</script>
<template>
  <button ref="target" data-plant="ref">{{ mountedTag }}:{{ count }}</button>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        await wrapper.vm.$nextTick();
        equal(wrapper.get('[data-plant="ref"]').text(), "button:0", "template ref on mount");
        truthy(typeof wrapper.vm.increment === "function", "defineExpose method missing");
        wrapper.vm.increment();
        await wrapper.vm.$nextTick();
        equal(wrapper.get('[data-plant="ref"]').text(), "button:1", "exposed method update");
      });
    },
  },
  {
    id: "event-modifier-semantics",
    coverage: ["stop modifier", "once modifier", "key modifier", "exact modifier"],
    source: `<script setup>
import { ref } from 'vue'
const parent = ref(0)
const stopped = ref(0)
const once = ref(0)
const entered = ref(0)
</script>
<template>
  <div data-plant="parent" @click="parent++">
    <button data-plant="stop" @click.stop="stopped++">stop</button>
  </div>
  <button data-plant="once" @click.once="once++">once</button>
  <input data-plant="key" @keyup.enter.exact="entered++">
  <output data-plant="modifier-state">{{ parent }}|{{ stopped }}|{{ once }}|{{ entered }}</output>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        await wrapper.get('[data-plant="stop"]').trigger("click");
        await wrapper.get('[data-plant="stop"]').trigger("click");
        await wrapper.get('[data-plant="once"]').trigger("click");
        await wrapper.get('[data-plant="once"]').trigger("click");
        await wrapper.get('[data-plant="key"]').trigger("keyup", { key: "Enter", ctrlKey: true });
        await wrapper.get('[data-plant="key"]').trigger("keyup", { key: "Enter" });
        equal(wrapper.get('[data-plant="modifier-state"]').text(), "0|2|1|1", "event modifiers");
      });
    },
  },
  {
    id: "named-component-v-model",
    coverage: ["component v-model", "named model", "update event", "local component"],
    source: `<script setup>
import { h, ref } from 'vue'
const title = ref('start')
const ModelControl = {
  props: { title: String },
  emits: ['update:title'],
  setup(props, { emit }) {
    return () => h('button', {
      'data-plant': 'model-control',
      onClick: () => emit('update:title', props.title + '!')
    }, props.title)
  }
}
</script>
<template>
  <ModelControl v-model:title="title"></ModelControl>
  <output data-plant="model-value">{{ title }}</output>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        equal(wrapper.get('[data-plant="model-value"]').text(), "start", "initial named model");
        await wrapper.get('[data-plant="model-control"]').trigger("click");
        equal(wrapper.get('[data-plant="model-value"]').text(), "start!", "named model update");
      });
    },
  },
  {
    id: "keyed-list-reorder",
    coverage: ["v-for", "keyed fragment", "list reorder", "destructuring"],
    source: `<script setup>
import { ref } from 'vue'
const items = ref([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }])
function reverse() { items.value = [...items.value].reverse() }
</script>
<template>
  <button data-plant="reverse" @click="reverse">reverse</button>
  <ul><li v-for="({ id, label }, index) in items" :key="id" data-plant="item">{{ index }}:{{ label }}</li></ul>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        equal(
          wrapper
            .findAll('[data-plant="item"]')
            .map((node) => node.text())
            .join(","),
          "0:A,1:B,2:C",
          "initial keyed list",
        );
        await wrapper.get('[data-plant="reverse"]').trigger("click");
        equal(
          wrapper
            .findAll('[data-plant="item"]')
            .map((node) => node.text())
            .join(","),
          "0:C,1:B,2:A",
          "reordered keyed list",
        );
      });
    },
  },
  {
    id: "class-style-bindings",
    coverage: ["class array", "class object", "style object", "CSS custom property"],
    source: `<script setup>
import { ref } from 'vue'
const active = ref(false)
const color = ref('red')
function toggle() { active.value = true; color.value = 'blue' }
</script>
<template>
  <button data-plant="styled" :class="['base', { active }]" :style="{ color, '--plant-gap': active ? '8px' : '2px' }" @click="toggle">styled</button>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        const button = wrapper.get('[data-plant="styled"]');
        truthy(button.classes().includes("base"), "static array class missing");
        truthy(!button.classes().includes("active"), "conditional class enabled too early");
        equal(button.element.style.color, "red", "initial style binding");
        equal(
          button.element.style.getPropertyValue("--plant-gap"),
          "2px",
          "initial custom property",
        );
        await button.trigger("click");
        truthy(button.classes().includes("active"), "conditional object class missing");
        equal(button.element.style.color, "blue", "updated style binding");
        equal(
          button.element.style.getPropertyValue("--plant-gap"),
          "8px",
          "updated custom property",
        );
      });
    },
  },
  {
    id: "form-control-v-model-matrix",
    coverage: ["checkbox v-model", "radio v-model", "select v-model", "textarea v-model"],
    source: `<script setup>
import { ref } from 'vue'
const checked = ref(false)
const radio = ref('a')
const selected = ref('x')
const note = ref('')
</script>
<template>
  <input data-plant="checkbox" type="checkbox" v-model="checked">
  <input data-plant="radio-b" type="radio" value="b" v-model="radio">
  <select data-plant="select" v-model="selected"><option value="x">X</option><option value="y">Y</option></select>
  <textarea data-plant="textarea" v-model="note"></textarea>
  <output data-plant="forms">{{ checked }}|{{ radio }}|{{ selected }}|{{ note }}</output>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        await wrapper.get('[data-plant="checkbox"]').setValue(true);
        await wrapper.get('[data-plant="radio-b"]').setValue();
        await wrapper.get('[data-plant="select"]').setValue("y");
        await wrapper.get('[data-plant="textarea"]').setValue("memo");
        equal(wrapper.get('[data-plant="forms"]').text(), "true|b|y|memo", "form v-model matrix");
      });
    },
  },
  {
    id: "dynamic-event-name-handler-removal",
    coverage: ["dynamic v-on argument", "handler replacement", "listener removal"],
    source: `<script setup>
import { computed, ref } from 'vue'
const eventName = ref('click')
const enabled = ref(true)
const count = ref(0)
function handle() { count.value++ }
const currentHandler = computed(() => enabled.value ? handle : null)
function useDoubleClick() { eventName.value = 'dblclick' }
function disable() { enabled.value = false }
defineExpose({ useDoubleClick, disable })
</script>
<template>
  <button data-plant="dynamic-event" @[eventName]="currentHandler">{{ count }}</button>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        const button = wrapper.get('[data-plant="dynamic-event"]');
        await button.trigger("click");
        equal(button.text(), "1", "initial dynamic event");
        wrapper.vm.useDoubleClick();
        await wrapper.vm.$nextTick();
        await button.trigger("click");
        equal(button.text(), "1", "old dynamic listener was not removed");
        await button.trigger("dblclick");
        equal(button.text(), "2", "replacement dynamic listener");
        wrapper.vm.disable();
        await wrapper.vm.$nextTick();
        await button.trigger("dblclick");
        equal(button.text(), "2", "null dynamic handler was not removed");
      });
    },
  },
  {
    id: "named-scoped-slot-fallback",
    coverage: ["named slot", "scoped slot props", "slot fallback", "multiple component slots"],
    source: `<script setup>
import { h } from 'vue'
const NamedProvider = {
  setup(_, { slots }) {
    return () => h('section', { 'data-plant': 'named-provider' },
      slots.header ? slots.header({ title: 'named' }) : h('i', { 'data-plant': 'slot-fallback' }, 'fallback'))
  }
}
</script>
<template>
  <NamedProvider><template #header="{ title }"><b data-plant="named-slot">{{ title.toUpperCase() }}</b></template></NamedProvider>
  <NamedProvider></NamedProvider>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        equal(wrapper.get('[data-plant="named-slot"]').text(), "NAMED", "named scoped slot");
        equal(
          wrapper.get('[data-plant="slot-fallback"]').text(),
          "fallback",
          "named slot fallback",
        );
        equal(wrapper.findAll('[data-plant="named-provider"]').length, 2, "named slot providers");
      });
    },
  },
  {
    id: "template-refs-v-for-update",
    coverage: ["template ref in v-for", "ref array", "post-update refs", "defineExpose"],
    source: `<script setup>
import { ref } from 'vue'
const items = ref(['a', 'b'])
const itemElements = ref([])
function add() { items.value.push('c') }
function referencedText() { return itemElements.value.map((node) => node.textContent).sort().join(',') }
defineExpose({ add, referencedText })
</script>
<template><ul><li v-for="item in items" :key="item" ref="itemElements" data-plant="ref-item">{{ item }}</li></ul></template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        await wrapper.vm.$nextTick();
        equal(wrapper.vm.referencedText(), "a,b", "initial v-for template refs");
        wrapper.vm.add();
        await wrapper.vm.$nextTick();
        equal(wrapper.vm.referencedText(), "a,b,c", "updated v-for template refs");
      });
    },
  },
  {
    id: "define-model-named-modifier",
    coverage: ["defineModel", "named model", "model modifiers", "model setter", "update event"],
    source: `<script setup>
const [title, modifiers] = defineModel('title', {
  set(value) {
    const clean = value.trim()
    return modifiers.capitalize ? clean.charAt(0).toUpperCase() + clean.slice(1) : clean
  }
})
function update() { title.value = ' next ' }
</script>
<template><button data-plant="define-model" @click="update">{{ title }}:{{ modifiers.capitalize }}</button></template>`,
    assert({ mount, component }) {
      return mountPlant(
        mount,
        component,
        { props: { title: "start", titleModifiers: { capitalize: true } } },
        async (wrapper) => {
          equal(
            wrapper.get('[data-plant="define-model"]').text(),
            "start:true",
            "defineModel inputs",
          );
          await wrapper.get('[data-plant="define-model"]').trigger("click");
          const updates = wrapper.emitted("update:title");
          truthy(updates && updates.length === 1, "defineModel did not emit an update");
          equal(updates[0][0], "Next", "defineModel modifier/set transform");
        },
      );
    },
  },
  {
    id: "template-only-sfc",
    coverage: ["template-only SFC", "no script block", "text interpolation"],
    source: `<template><article data-plant="template-only">template only</article></template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        equal(
          wrapper.get('[data-plant="template-only"]').text(),
          "template only",
          "template-only SFC",
        );
      });
    },
  },
  {
    id: "classic-script-sfc",
    coverage: ["classic script", "Options API setup", "template binding", "event update"],
    source: `<script>
import { ref } from 'vue'
export default {
  setup() {
    const count = ref(3)
    return { count, increment: () => count.value++ }
  }
}
</script>
<template><button data-plant="classic" @click="increment">{{ count }}</button></template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        equal(wrapper.get('[data-plant="classic"]').text(), "3", "classic script initial state");
        await wrapper.get('[data-plant="classic"]').trigger("click");
        equal(wrapper.get('[data-plant="classic"]').text(), "4", "classic script update");
      });
    },
  },
  {
    id: "combined-script-and-setup-sfc",
    coverage: ["classic script plus script setup", "defineOptions merge", "inheritAttrs"],
    source: `<script>
export default { inheritAttrs: false }
</script>
<script setup>
const label = 'combined'
</script>
<template><main data-plant="combined">{{ label }}</main></template>`,
    assert({ mount, component }) {
      return mountPlant(
        mount,
        component,
        { attrs: { id: "must-not-fall-through" } },
        async (wrapper) => {
          const root = wrapper.get('[data-plant="combined"]');
          equal(root.text(), "combined", "combined script binding");
          truthy(root.attributes("id") === undefined, "classic script options were not merged");
        },
      );
    },
  },
  ...SUPPLEMENTAL_COMPILE_VALIDITY_PLANTS,
]);

export const COMPILE_VALIDITY_SUITE_HASH = createHash("sha256")
  .update(
    JSON.stringify(
      COMPILE_VALIDITY_PLANTS.map(({ id, coverage, source }) => ({ id, coverage, source })),
    ),
  )
  .digest("hex");

export function unknownCompileValidityResults(reason) {
  return COMPILE_VALIDITY_PLANTS.map((plant) => ({
    id: plant.id,
    coverage: plant.coverage,
    status: "UNKNOWN",
    phase: "not-run",
    detail: reason,
  }));
}
