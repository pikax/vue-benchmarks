<script setup lang="ts" generic="T extends { id: number }">
defineProps<{
  items: T[];
  selected?: T;
  keyOf: (row: T) => string;
}>();

defineEmits<{
  pick: [row: T];
}>();
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id">{{ keyOf(item) }}</li>
  </ul>
</template>
