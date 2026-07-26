<script setup lang="ts">
import Child from "./Child.vue";

function takesString(value: string) {
  return value.toUpperCase();
}
</script>

<template>
  <Child>
    <!-- plant: item.id is number, takesString wants string -->
    <template #row="{ item }">{{ takesString(item.id) }}</template>
  </Child>
</template>
