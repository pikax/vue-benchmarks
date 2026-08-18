<script setup lang="ts">
import Child from "./Child.vue";

function onChange(value: number) {
  console.log(value.toFixed(1));
}
</script>

<template>
  <Child @change.once="onChange" />
</template>
