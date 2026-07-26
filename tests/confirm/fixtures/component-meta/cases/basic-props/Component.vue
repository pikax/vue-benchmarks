<script setup lang="ts">
defineProps<{
  title: string;
  count: number;
}>();
</script>

<template>
  <div>{{ title }} ({{ count }})</div>
</template>
