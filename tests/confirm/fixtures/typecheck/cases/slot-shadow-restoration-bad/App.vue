<script setup lang="ts">
import Child from "./Child.vue";
const item: string = "outer";
</script>
<template>
  <p>{{ item.toUpperCase() }}</p>
  <Child><template #row="{ item }">
    <!-- @plant-error -->
    <span>{{ item.toUpperCase() }}</span>
  </template></Child>
  <p>{{ item.toUpperCase() }}</p>
</template>
