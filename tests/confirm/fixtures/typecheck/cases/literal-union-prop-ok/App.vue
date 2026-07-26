<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- static attribute must narrow to the "primary" literal, not widen to string -->
  <Child variant="primary" />
</template>
