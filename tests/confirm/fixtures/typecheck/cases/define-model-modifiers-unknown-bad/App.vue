<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const text = ref("ok");
</script>

<template>
  <!-- plant: .nope is not in the declared modifier union -->
  <!-- @plant-error -->
  <Child v-model.nope="text" />
</template>
