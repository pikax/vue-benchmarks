<script setup lang="ts">
import type { Directive, DirectiveBinding } from "vue";

const vDir: Directive<HTMLElement, number> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<number>) {
    el.textContent = String(binding.value);
  },
};
</script>

<template>
  <!-- plant: v-dir value must be number -->
  <!-- @plant-error -->
  <span v-dir="'nope'"></span>
</template>
