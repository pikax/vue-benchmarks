import { createHash } from "node:crypto";

/**
 * Supplemental VDOM runtime-semantic plants.
 *
 * This manifest is kept separate from compile-validity-plants.mjs so it can be
 * reviewed and adopted without colliding with the Vue 3.6 Vapor work. The
 * assertions intentionally observe public runtime behaviour and never compare
 * generated code or Vue's internal vnode/patch flags.
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

export const SUPPLEMENTAL_COMPILE_VALIDITY_SUITE_VERSION = "2026-08-20.1";

export const SUPPLEMENTAL_COMPILE_VALIDITY_PLANTS = Object.freeze([
  {
    id: "conditional-branch-switching",
    coverage: ["v-if", "v-else-if", "v-else", "branch disposal", "reactive branch switch"],
    source: `<script setup>
import { ref } from 'vue'
const mode = ref('alpha')
function next() {
  mode.value = mode.value === 'alpha' ? 'beta' : mode.value === 'beta' ? 'other' : 'alpha'
}
</script>
<template>
  <button data-plant="branch-next" @click="next">next</button>
  <strong v-if="mode === 'alpha'" data-plant="branch-alpha">alpha</strong>
  <em v-else-if="mode === 'beta'" data-plant="branch-beta">beta</em>
  <span v-else data-plant="branch-other">other</span>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        truthy(wrapper.find('[data-plant="branch-alpha"]').exists(), "v-if branch missing");
        await wrapper.get('[data-plant="branch-next"]').trigger("click");
        truthy(!wrapper.find('[data-plant="branch-alpha"]').exists(), "old v-if branch remained");
        equal(wrapper.get('[data-plant="branch-beta"]').text(), "beta", "v-else-if branch");
        await wrapper.get('[data-plant="branch-next"]').trigger("click");
        truthy(!wrapper.find('[data-plant="branch-beta"]').exists(), "old v-else-if remained");
        equal(wrapper.get('[data-plant="branch-other"]').text(), "other", "v-else branch");
      });
    },
  },
  {
    id: "dynamic-slot-outlet-props-fallback",
    coverage: ["slot outlet", "dynamic slot name", "slot props", "slot fallback", "slot update"],
    source: `<script setup>
import { ref } from 'vue'
const slotName = ref('alpha')
const payload = ref('one')
function showBeta() { slotName.value = 'beta'; payload.value = 'two' }
function showMissing() { slotName.value = 'missing'; payload.value = 'three' }
defineExpose({ showBeta, showMissing })
</script>
<template>
  <section data-plant="slot-outlet">
    <slot :name="slotName" :payload="payload"><i data-plant="slot-fallback">fallback:{{ payload }}</i></slot>
  </section>
</template>`,
    assert({ mount, component }) {
      return mountPlant(
        mount,
        component,
        {
          slots: {
            alpha: ({ payload }) => `alpha:${payload}`,
            beta: ({ payload }) => `beta:${payload}`,
          },
        },
        async (wrapper) => {
          equal(wrapper.get('[data-plant="slot-outlet"]').text(), "alpha:one", "alpha slot props");
          wrapper.vm.showBeta();
          await wrapper.vm.$nextTick();
          equal(wrapper.get('[data-plant="slot-outlet"]').text(), "beta:two", "dynamic beta slot");
          wrapper.vm.showMissing();
          await wrapper.vm.$nextTick();
          equal(
            wrapper.get('[data-plant="slot-fallback"]').text(),
            "fallback:three",
            "slot fallback",
          );
        },
      );
    },
  },
  {
    id: "dynamic-component-props-events",
    coverage: ["component :is", "dynamic component", "component props", "component events"],
    source: `<script setup>
import { h, ref, shallowRef } from 'vue'
const chosen = ref('none')
const label = ref('first')
function make(kind) {
  return {
    props: { label: String },
    emits: ['choose'],
    setup(props, { emit }) {
      return () => h('button', { 'data-plant': 'dynamic-child', onClick: () => emit('choose', kind) }, kind + ':' + props.label)
    }
  }
}
const Alpha = make('alpha')
const Beta = make('beta')
const current = shallowRef(Alpha)
function swap() { current.value = Beta; label.value = 'second' }
defineExpose({ swap })
</script>
<template>
  <component :is="current" :label="label" @choose="chosen = $event"></component>
  <output data-plant="dynamic-choice">{{ chosen }}</output>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        equal(
          wrapper.get('[data-plant="dynamic-child"]').text(),
          "alpha:first",
          "initial component",
        );
        await wrapper.get('[data-plant="dynamic-child"]').trigger("click");
        equal(wrapper.get('[data-plant="dynamic-choice"]').text(), "alpha", "component event");
        wrapper.vm.swap();
        await wrapper.vm.$nextTick();
        equal(
          wrapper.get('[data-plant="dynamic-child"]').text(),
          "beta:second",
          "swapped component",
        );
      });
    },
  },
  {
    id: "custom-directive-value-argument-modifiers",
    coverage: ["custom directive", "directive argument", "directive modifiers", "updated hook"],
    source: `<script setup>
import { ref } from 'vue'
const value = ref('first')
const vPlant = {
  mounted(el, binding) {
    el.dataset.directive = [binding.value, binding.arg, binding.modifiers.live, binding.modifiers.trim].join('|')
  },
  updated(el, binding) {
    el.dataset.directive = [binding.value, binding.oldValue, binding.arg, binding.modifiers.live].join('|')
  }
}
</script>
<template>
  <button data-plant="directive" v-plant:status.live.trim="value" @click="value = 'second'">directive</button>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        const button = wrapper.get('[data-plant="directive"]');
        equal(
          button.attributes("data-directive"),
          "first|status|true|true",
          "directive mounted binding",
        );
        await button.trigger("click");
        equal(
          button.attributes("data-directive"),
          "second|first|status|true",
          "directive updated binding",
        );
      });
    },
  },
  {
    id: "v-once-static-retention",
    coverage: ["v-once", "render cache", "static retention", "sibling reactive update"],
    source: `<script setup>
import { ref } from 'vue'
const count = ref(0)
function increment() { count.value++ }
</script>
<template>
  <button data-plant="once-next" @click="increment">next</button>
  <output v-once data-plant="once-value">{{ count }}</output>
  <output data-plant="live-value">{{ count }}</output>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        await wrapper.get('[data-plant="once-next"]').trigger("click");
        equal(
          wrapper.get('[data-plant="once-value"]').text(),
          "0",
          "v-once retained initial value",
        );
        equal(wrapper.get('[data-plant="live-value"]').text(), "1", "normal sibling updated");
      });
    },
  },
  {
    id: "v-memo-dependency-gating",
    coverage: ["v-memo", "memo dependency", "skipped subtree update", "memo invalidation"],
    source: `<script setup>
import { ref } from 'vue'
const count = ref(0)
const memoKey = ref(0)
function changeOnlyValue() { count.value++ }
function invalidateMemo() { memoKey.value++ }
defineExpose({ changeOnlyValue, invalidateMemo })
</script>
<template>
  <output v-memo="[memoKey]" data-plant="memo-value">{{ count }}</output>
  <output data-plant="memo-live">{{ count }}</output>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        wrapper.vm.changeOnlyValue();
        await wrapper.vm.$nextTick();
        equal(wrapper.get('[data-plant="memo-value"]').text(), "0", "memoized subtree skipped");
        equal(wrapper.get('[data-plant="memo-live"]').text(), "1", "unmemoized sibling updated");
        wrapper.vm.invalidateMemo();
        await wrapper.vm.$nextTick();
        equal(wrapper.get('[data-plant="memo-value"]').text(), "1", "memo dependency invalidated");
      });
    },
  },
  {
    id: "v-show-display-toggle",
    coverage: ["v-show", "built-in directive", "display restoration", "node retention"],
    source: `<script setup>
import { ref } from 'vue'
const visible = ref(false)
</script>
<template><button data-plant="show" v-show="visible" @click="visible = false">shown</button><button data-plant="reveal" @click="visible = true">reveal</button></template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        const shown = wrapper.get('[data-plant="show"]');
        const element = shown.element;
        equal(element.style.display, "none", "v-show initial display");
        await wrapper.get('[data-plant="reveal"]').trigger("click");
        truthy(
          wrapper.get('[data-plant="show"]').element === element,
          "v-show replaced its element",
        );
        equal(element.style.display, "", "v-show restored display");
        await shown.trigger("click");
        equal(element.style.display, "none", "v-show hid element again");
      });
    },
  },
  {
    id: "content-directives-text-html",
    coverage: ["v-text", "v-html", "text escaping", "HTML replacement", "directive update"],
    source: `<script setup>
import { ref } from 'vue'
const text = ref('<safe & text>')
const html = ref('<b data-plant="html-child">one</b>')
function update() { text.value = '<next>'; html.value = '<i data-plant="html-child">two</i>' }
</script>
<template>
  <p data-plant="text" v-text="text"></p>
  <div data-plant="html" v-html="html"></div>
  <button data-plant="content-next" @click="update">next</button>
</template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        equal(wrapper.get('[data-plant="text"]').text(), "<safe & text>", "v-text text content");
        equal(
          wrapper.get('[data-plant="html-child"]').element.tagName,
          "B",
          "v-html parsed element",
        );
        await wrapper.get('[data-plant="content-next"]').trigger("click");
        equal(wrapper.get('[data-plant="text"]').text(), "<next>", "updated v-text");
        equal(
          wrapper.get('[data-plant="html-child"]').element.tagName,
          "I",
          "updated v-html element",
        );
        equal(wrapper.get('[data-plant="html-child"]').text(), "two", "updated v-html content");
      });
    },
  },
  {
    id: "teleport-target-reactivity",
    coverage: ["Teleport", "built-in component", "external target", "teleported update"],
    source: `<script setup>
import { ref } from 'vue'
const message = ref('first')
</script>
<template><Teleport to="#compile-plant-teleport"><button data-plant="teleported" @click="message = 'second'">{{ message }}</button></Teleport></template>`,
    async assert({ mount, component }) {
      const target = document.createElement("div");
      target.id = "compile-plant-teleport";
      document.body.appendChild(target);
      const wrapper = mount(component);
      try {
        const button = target.querySelector('[data-plant="teleported"]');
        truthy(button, "Teleport did not render into its target");
        equal(button.textContent, "first", "initial teleported content");
        button.dispatchEvent(new Event("click", { bubbles: true }));
        await wrapper.vm.$nextTick();
        equal(button.textContent, "second", "teleported reactive update");
      } finally {
        wrapper.unmount();
        target.remove();
      }
    },
  },
  {
    id: "keep-alive-dynamic-state",
    coverage: ["KeepAlive", "dynamic component", "activation", "component state retention"],
    source: `<script setup>
import { h, ref, shallowRef } from 'vue'
const A = {
  name: 'PlantA',
  setup() {
    const count = ref(0)
    return () => h('button', { 'data-plant': 'kept-a', onClick: () => count.value++ }, 'a:' + count.value)
  }
}
const B = { name: 'PlantB', setup: () => () => h('p', { 'data-plant': 'kept-b' }, 'b') }
const current = shallowRef(A)
function swap() { current.value = current.value === A ? B : A }
</script>
<template><button data-plant="keep-swap" @click="swap">swap</button><KeepAlive><component :is="current"></component></KeepAlive></template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        await wrapper.get('[data-plant="kept-a"]').trigger("click");
        equal(wrapper.get('[data-plant="kept-a"]').text(), "a:1", "dynamic child state update");
        await wrapper.get('[data-plant="keep-swap"]').trigger("click");
        equal(wrapper.get('[data-plant="kept-b"]').text(), "b", "alternate kept child");
        await wrapper.get('[data-plant="keep-swap"]').trigger("click");
        equal(wrapper.get('[data-plant="kept-a"]').text(), "a:1", "KeepAlive retained state");
      });
    },
  },
  {
    id: "suspense-async-component-resolution",
    coverage: ["Suspense", "async component", "fallback slot", "async resolution"],
    source: `<script setup>
import { defineAsyncComponent, h } from 'vue'
const AsyncChild = defineAsyncComponent(() => Promise.resolve({
  setup: () => () => h('strong', { 'data-plant': 'async-ready' }, 'ready')
}))
</script>
<template><Suspense><AsyncChild></AsyncChild><template #fallback><i data-plant="async-fallback">loading</i></template></Suspense></template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        truthy(wrapper.find('[data-plant="async-fallback"]').exists(), "Suspense fallback missing");
        await new Promise((resolve) => setTimeout(resolve, 0));
        await wrapper.vm.$nextTick();
        equal(wrapper.get('[data-plant="async-ready"]').text(), "ready", "async component result");
        truthy(
          !wrapper.find('[data-plant="async-fallback"]').exists(),
          "fallback remained after resolution",
        );
      });
    },
  },
  {
    id: "v-pre-literal-subtree",
    coverage: [
      "v-pre",
      "literal interpolation",
      "compile-skip subtree",
      "normal sibling interpolation",
    ],
    source: `<script setup>const value = 'evaluated'</script>
<template><code v-pre data-plant="pre">{{ value }}<span :title="value">{{ value }}</span></code><output data-plant="normal">{{ value }}</output></template>`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, async (wrapper) => {
        const pre = wrapper.get('[data-plant="pre"]');
        equal(pre.text(), "{{ value }}{{ value }}", "v-pre literal interpolation");
        equal(pre.get("span").attributes(":title"), "value", "v-pre literal binding attribute");
        equal(
          wrapper.get('[data-plant="normal"]').text(),
          "evaluated",
          "normal interpolation sibling",
        );
      });
    },
  },
]);

export const SUPPLEMENTAL_COMPILE_VALIDITY_SUITE_HASH = createHash("sha256")
  .update(
    JSON.stringify(
      SUPPLEMENTAL_COMPILE_VALIDITY_PLANTS.map(({ id, coverage, source }) => ({
        id,
        coverage,
        source,
      })),
    ),
  )
  .digest("hex");
