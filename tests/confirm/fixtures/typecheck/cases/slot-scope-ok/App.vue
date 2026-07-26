<script setup lang="ts">
import Child from "./Child.vue";

function takesString(value: string) {
  return value.toUpperCase();
}
</script>

<template>
  <Child>
    <template #row="{ item }">{{ takesString(item.label) }}</template>
  </Child>
</template>
