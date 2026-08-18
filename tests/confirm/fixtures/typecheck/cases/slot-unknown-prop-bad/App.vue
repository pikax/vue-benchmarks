<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <Child>
    <!-- plant: payload has msg, not missing -->
    <template #default="{ missing }">{{ missing }}</template>
  </Child>
</template>
