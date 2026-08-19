<script setup lang="ts">
const [model, modifiers] = defineModel<string, "trim" | "capitalize">({ required: true });

// plant: nope is not a declared modifier
// @plant-error
if (modifiers.nope) {
  model.value = model.value.trim();
}
</script>

<template>
  <span>{{ model }}</span>
</template>
