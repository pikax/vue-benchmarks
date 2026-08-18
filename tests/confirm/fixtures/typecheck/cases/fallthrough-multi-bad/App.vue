<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: fragment root — nowhere for id to fall through -->
  <Child title="ok" id="outer" />
</template>
