<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- v-if="true" is statically one root (the div) -->
  <Child title="ok" id="outer" />
</template>
