<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <Child>
    <template #header="{ title }">{{ title }}</template>
  </Child>
</template>
