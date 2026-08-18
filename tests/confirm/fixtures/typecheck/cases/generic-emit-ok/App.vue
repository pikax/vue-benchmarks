<script setup lang="ts">
import Child from "./Child.vue";

function onChange(value: number) {
  console.log(value.toFixed(0));
}
</script>

<template>
  <Child :value="1" @change="onChange" />
</template>
