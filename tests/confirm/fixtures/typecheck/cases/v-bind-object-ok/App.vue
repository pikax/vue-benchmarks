<script setup lang="ts">
import Child from "./Child.vue";

const bound = { title: "ok", count: 1 };
</script>

<template>
  <Child v-bind="bound" />
</template>
