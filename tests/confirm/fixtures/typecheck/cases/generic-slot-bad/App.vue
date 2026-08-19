<script setup lang="ts">
import Child from "./Child.vue";

function takesString(s: string) {
  return s.toUpperCase();
}
</script>

<template>
  <Child :item="{ id: 1, label: 'a' }">
    <!-- plant: item.id is number -->
    <!-- @plant-error -->
    <template #default="{ item }">{{ takesString(item.id) }}</template>
  </Child>
</template>
