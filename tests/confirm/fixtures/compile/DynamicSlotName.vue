<script setup>
import { h, ref } from "vue";

const Panel = {
  setup(_props, { slots }) {
    return () =>
      h("div", [
        h("div", { "data-testid": "alpha-slot" }, slots.alpha ? slots.alpha({ n: 1 }) : "none"),
        h("div", { "data-testid": "beta-slot" }, slots.beta ? slots.beta({ n: 2 }) : "none"),
      ]);
  },
};

const slotName = ref("alpha");

function swap() {
  slotName.value = "beta";
}
</script>

<template>
  <div class="dynamic-slot-name">
    <Panel>
      <template #[slotName]="{ n }">dyn-{{ n }}</template>
    </Panel>
    <button type="button" data-testid="swap" @click="swap">s</button>
  </div>
</template>
