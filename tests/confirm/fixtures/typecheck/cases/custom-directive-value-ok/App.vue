<script setup lang="ts">
import type { Directive, DirectiveBinding } from "vue";

const vDir: Directive<HTMLElement, number> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<number>) {
    el.textContent = String(binding.value);
  },
};
</script>

<template>
  <span v-dir="1"></span>
</template>
