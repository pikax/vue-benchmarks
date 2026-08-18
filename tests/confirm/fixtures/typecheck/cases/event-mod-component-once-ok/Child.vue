<script setup lang="ts">
const emit = defineEmits<{
  change: [value: number];
}>();

function fire() {
  emit("change", 42);
}
</script>

<template>
  <button type="button" @click="fire">go</button>
</template>
