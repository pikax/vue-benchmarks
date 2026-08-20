<script setup lang="ts">
import Child from "./Child.vue";

const count = 5;
const title = "ok";
</script>

<template>
  <Child :count :title />
</template>
