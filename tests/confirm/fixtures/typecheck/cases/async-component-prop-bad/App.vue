<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const Child = defineAsyncComponent(() => import("./Child.vue"));
</script>

<template>
  <!-- plant: count must be number -->
  <!-- @plant-error -->
  <Child :count="'nope'" />
</template>
