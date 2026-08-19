<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <Child>
    <!-- plant: payload has msg, not missing -->
    <!-- @plant-error -->
    <template #default="{ missing }">{{ missing }}</template>
  </Child>
</template>
