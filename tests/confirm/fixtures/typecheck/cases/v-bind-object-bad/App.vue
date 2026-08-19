<script setup lang="ts">
import Child from "./Child.vue";

const bound = { title: "ok", count: "nope" };
</script>

<template>
  <!-- plant: count is string, child expects number -->
  <!-- @plant-error -->
  <Child v-bind="bound" />
</template>
