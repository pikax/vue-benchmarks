<script setup lang="ts">
defineProps<{
  ariaLabel: string;
  dataTestId?: string;
}>();

defineEmits<{
  "row-select": [id: number];
}>();
</script>

<template>
  <button
    type="button"
    :aria-label="ariaLabel"
    :data-test-id="dataTestId"
    @click="$emit('row-select', 1)"
  >
    go
  </button>
</template>
