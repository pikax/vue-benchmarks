<script setup lang="ts">
const model = defineModel<string>({
  required: true,
  get(value: string) {
    return (value ?? "").toUpperCase();
  },
  set(value: string) {
    return value.trim();
  },
});
</script>

<template>
  <span>{{ model }}</span>
</template>
