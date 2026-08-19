<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: static attribute is string; count is number -->
  <!-- @plant-error -->
  <Child count="1" />
</template>
