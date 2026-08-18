<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <Child :item="{ id: 1, label: 'a' }">
    <template #default="{ item }">{{ item.label.toUpperCase() }}</template>
  </Child>
</template>
