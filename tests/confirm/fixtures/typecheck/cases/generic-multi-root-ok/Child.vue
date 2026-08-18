<script setup lang="ts" generic="T extends { id: number; label: string }">
defineProps<{
  item: T;
}>();
</script>

<template>
  <span>{{ item.id }}</span>
  <span>{{ item.label }}</span>
</template>
