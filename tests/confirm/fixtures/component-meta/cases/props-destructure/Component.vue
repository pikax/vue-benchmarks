<script setup lang="ts">
const {
  label,
  count = 1,
  verbose = false,
} = defineProps<{
  label: string;
  count?: number;
  verbose?: boolean;
}>();
</script>

<template>
  <div>{{ label }} / {{ count }} / {{ verbose }}</div>
</template>
