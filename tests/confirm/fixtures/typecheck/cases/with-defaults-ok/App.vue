<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
  }>(),
  { title: "untitled" },
);
</script>

<template>
  <span>{{ title.toUpperCase() }}</span>
</template>
