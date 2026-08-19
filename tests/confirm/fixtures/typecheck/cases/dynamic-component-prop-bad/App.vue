<script setup lang="ts">
import Child from "./Child.vue";

const Comp = Child;
</script>

<template>
  <!-- plant: count must be number -->
  <!-- @plant-error -->
  <component :is="Comp" :count="'nope'" />
</template>
