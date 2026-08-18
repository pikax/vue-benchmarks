<script setup lang="ts" generic="T extends { id: number }">
defineProps<{
  item: T;
}>();
</script>

<template>
  <div class="root">{{ item.id }}</div>
</template>
