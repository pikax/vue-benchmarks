<script setup lang="ts">
import Child from "./Child.vue";
import type { Result } from "./types";

const result: Result = { state: "loaded", items: ["a"] };
</script>

<template>
  <Child :result="result" />
</template>
