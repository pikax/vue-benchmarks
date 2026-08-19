<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: inheritAttrs false — id must not fall through even with a single root -->
  <!-- @plant-error -->
  <Child title="ok" id="outer" />
</template>
