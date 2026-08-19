<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: count must be number -->
  <!-- @plant-error -->
  <Child :count="'nope'" label="ok" />
</template>
