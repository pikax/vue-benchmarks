<script setup lang="ts">
import { ref } from "vue";

const value = ref(0);

function focus() {
  value.value += 1;
}

function reset() {
  value.value = 0;
}

defineExpose({ focus, reset, value });
</script>

<template>
  <div>{{ value }}</div>
</template>
