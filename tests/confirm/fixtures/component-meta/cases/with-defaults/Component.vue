<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    count?: number;
    disabled?: boolean;
  }>(),
  {
    count: 0,
    disabled: false,
  },
);
</script>

<template>
  <span>{{ label }}:{{ count }}:{{ disabled }}</span>
</template>
