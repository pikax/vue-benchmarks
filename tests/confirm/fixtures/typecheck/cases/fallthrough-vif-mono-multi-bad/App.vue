<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const on = ref(true);
</script>

<template>
  <!-- plant: v-if is one root, v-else is a fragment — not always single-root -->
  <!-- @plant-error -->
  <Child title="ok" :on="on" id="outer" />
</template>
