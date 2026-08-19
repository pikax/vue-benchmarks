<script setup lang="ts">
const emit = defineEmits<{
  change: [value: number];
}>();

// plant: "nope" is not a declared emit
// @plant-error
emit("nope", 1);
</script>

<template>
  <div />
</template>
