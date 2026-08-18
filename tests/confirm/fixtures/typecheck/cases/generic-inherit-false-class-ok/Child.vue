<script setup lang="ts" generic="T extends { id: number }">
defineOptions({ inheritAttrs: false });
defineProps<{
  items: T[];
}>();
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id">{{ item.id }}</li>
  </ul>
</template>
