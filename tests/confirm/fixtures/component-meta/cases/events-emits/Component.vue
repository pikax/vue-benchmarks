<script setup lang="ts">
defineProps<{ id: number }>();

const emit = defineEmits<{
  change: [value: number];
  "update:modelValue": [value: string];
  close: [];
}>();

function onClick() {
  emit("change", 1);
  emit("update:modelValue", "x");
  emit("close");
}
</script>

<template>
  <button type="button" @click="onClick">{{ id }}</button>
</template>
