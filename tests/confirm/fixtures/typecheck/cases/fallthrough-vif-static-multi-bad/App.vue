<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: v-if="true" but that branch is a fragment -->
  <Child title="ok" id="outer" />
</template>
