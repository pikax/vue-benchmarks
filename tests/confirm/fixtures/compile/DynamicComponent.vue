<script setup>
import { h, ref } from "vue";

// Kept out of a ref: storing a component in ref() would proxy it and break
// identity comparisons, which is a test artifact rather than a compiler trait.
const Alpha = { setup: () => () => h("span", { "data-testid": "alpha" }, "A") };
const Beta = { setup: () => () => h("span", { "data-testid": "beta" }, "B") };

const which = ref("alpha");

function swap() {
  which.value = which.value === "alpha" ? "beta" : "alpha";
}
</script>

<template>
  <div class="dynamic-component">
    <component :is="which === 'alpha' ? Alpha : Beta" />
    <button type="button" data-testid="swap" @click="swap">swap</button>
  </div>
</template>
