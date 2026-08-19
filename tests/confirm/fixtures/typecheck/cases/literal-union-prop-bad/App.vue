<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: "danger" is not a member of the declared union -->
  <!-- @plant-error -->
  <Child variant="danger" />
</template>
