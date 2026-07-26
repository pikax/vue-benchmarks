<script setup lang="ts" generic="T extends { id: number }">
defineProps<{
  items: T[];
  selected: T;
}>();
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id">{{ item.id }}</li>
  </ul>
</template>
