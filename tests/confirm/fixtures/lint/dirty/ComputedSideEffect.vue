<script setup>
import { computed, ref } from "vue";

const count = ref(0);
const doubled = computed(() => {
  count.value += 1;
  return count.value * 2;
});
</script>

<template>
  <span>{{ doubled }}</span>
</template>
