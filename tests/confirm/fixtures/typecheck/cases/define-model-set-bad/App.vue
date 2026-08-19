<script setup lang="ts">
const model = defineModel<number>({
  required: true,
  // plant: value is number, trim is a string method
  set(value: number) {
    // @plant-error
    return value.trim();
  },
});
</script>

<template>
  <span>{{ model }}</span>
</template>
