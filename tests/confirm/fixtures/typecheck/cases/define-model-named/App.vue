<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const total = ref(0);
</script>

<template>
  <!-- plant: the `title` model is string, but a number ref is bound to it -->
  <Child v-model:title="total" />
</template>
