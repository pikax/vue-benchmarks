<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- clean: Child declares a `header` slot; omitting it is legal Vue -->
  <Child />
</template>
