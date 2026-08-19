<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const text = ref("hello");
</script>

<template>
  <!-- plant: Child model is number, parent ref is string -->
  <!-- @plant-error -->
  <Child v-model="text" />
</template>
