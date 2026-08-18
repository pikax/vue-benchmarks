<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <Child>
    <template #row="{ item }">{{ item.label.toUpperCase() }}</template>
  </Child>
</template>
