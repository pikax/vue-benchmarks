<script setup lang="ts">
const emit = defineEmits<{
  change: [value: number];
}>();

// plant: payload must be number
// @plant-error
emit("change", "nope");
</script>

<template>
  <div />
</template>
