<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const on = ref(true);
</script>

<template>
  <!-- both branches are a single element, so runtime is always one root -->
  <Child title="ok" :on="on" id="outer" />
</template>
