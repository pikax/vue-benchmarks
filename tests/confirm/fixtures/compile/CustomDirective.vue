<script setup>
import { ref } from "vue";

const color = ref("red");

// Local directive via the `vName` <script setup> convention.
const vHighlight = {
  mounted(el, binding) {
    el.setAttribute("data-hit", String(binding.value));
    el.setAttribute("data-arg", binding.arg ?? "");
    el.setAttribute("data-mods", Object.keys(binding.modifiers).sort().join(","));
  },
  updated(el, binding) {
    el.setAttribute("data-hit", String(binding.value));
  },
};

function change() {
  color.value = "blue";
}
</script>

<template>
  <div class="custom-directive">
    <span v-highlight:tone.loud="color" data-testid="target">x</span>
    <button type="button" data-testid="change" @click="change">c</button>
  </div>
</template>
