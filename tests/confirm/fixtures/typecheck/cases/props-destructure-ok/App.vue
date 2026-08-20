<script setup lang="ts">
const { count = 0, label = "x" } = defineProps<{ count?: number; label?: string }>();
</script>

<template>
  <div>{{ label.toUpperCase() }}:{{ count.toFixed(1) }}</div>
</template>
