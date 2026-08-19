<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: inheritAttrs defaults to true, but strictTemplates still rejects undeclared attrs -->
  <!-- @plant-error -->
  <Child title="ok" id="outer" />
</template>
