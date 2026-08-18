<script setup lang="ts">
const emit = defineEmits<{
  change: [value: number];
}>();

// plant: payload must be number
emit("change", "nope");
</script>

<template>
  <div />
</template>
