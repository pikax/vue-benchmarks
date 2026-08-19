<template>
  <section>
    <p>{{ greeting }}</p>
    <Child :title="greeting" />
  </section>
</template>

<script setup lang="ts">
import Child from "./Child.vue";

const greeting = "confirm-lsp";
</script>
