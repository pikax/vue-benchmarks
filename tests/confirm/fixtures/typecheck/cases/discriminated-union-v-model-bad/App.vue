<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: kind 'num' has n, not s -->
  <!-- @plant-error -->
  <Child kind="num" :s="'nope'" />
</template>
