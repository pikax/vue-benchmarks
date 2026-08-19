<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: fallthrough disabled on a <button> root must be boolean, not string -->
  <!-- @plant-error -->
  <Child title="ok" :disabled="'nope'" />
</template>
