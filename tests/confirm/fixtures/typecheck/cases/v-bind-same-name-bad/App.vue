<script setup lang="ts">
import Child from "./Child.vue";

const count = "nope";
</script>

<template>
  <!-- plant: :count same-name shorthand binds a string to count: number -->
  <!-- @plant-error -->
  <Child :count />
</template>
