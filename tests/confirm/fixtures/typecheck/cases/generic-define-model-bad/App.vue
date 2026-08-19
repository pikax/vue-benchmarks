<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const value = ref({ n: 1 });
</script>

<template>
  <!-- plant: T extends string | number; object is not -->
  <!-- @plant-error -->
  <Child v-model="value" />
</template>
