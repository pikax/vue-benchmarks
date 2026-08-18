<script setup lang="ts">
import Child from "./Child.vue";

function onChange(value: string) {
  console.log(value.toUpperCase());
}
</script>

<template>
  <!-- plant: emit payload is number; .once does not make it a string -->
  <Child @change.once="onChange" />
</template>
