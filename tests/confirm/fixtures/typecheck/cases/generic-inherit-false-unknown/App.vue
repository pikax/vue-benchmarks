<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- @plant-error -->
  <Child :items="[{ id: 1 }]" extra="nope" />
</template>
