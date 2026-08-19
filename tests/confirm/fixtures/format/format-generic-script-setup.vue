<script setup lang="ts" generic="T extends string">
defineProps<{
  value: T;
  items: T[];
}>();
</script>

<template>
  <p>{{ value }}</p>
</template>
