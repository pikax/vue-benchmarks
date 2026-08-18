<script setup lang="ts" generic="T = string">
defineProps<{
  value: T;
}>();
</script>

<template>
  <span>{{ value }}</span>
</template>
