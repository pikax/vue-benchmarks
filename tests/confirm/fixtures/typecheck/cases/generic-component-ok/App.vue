<script setup lang="ts">
import Child from "./Child.vue";

const rows = [
  { id: 1, name: "a" },
  { id: 2, name: "b" },
];
</script>

<template>
  <Child :items="rows" :selected="rows[0]" />
</template>
