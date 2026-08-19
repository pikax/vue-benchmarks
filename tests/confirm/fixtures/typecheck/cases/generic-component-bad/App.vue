<script setup lang="ts">
import Child from "./Child.vue";

const rows = [
  { id: 1, name: "a" },
  { id: 2, name: "b" },
];
</script>

<template>
  <!-- plant: `selected` must be the same T inferred from `items`; a string is not -->
  <!-- @plant-error -->
  <Child :items="rows" :selected="'nope'" />
</template>
