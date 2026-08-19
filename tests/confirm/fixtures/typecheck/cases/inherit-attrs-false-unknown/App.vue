<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: data-x is not declared; inheritAttrs false does not make it valid -->
  <!-- @plant-error -->
  <Child title="ok" data-x="1" />
</template>
