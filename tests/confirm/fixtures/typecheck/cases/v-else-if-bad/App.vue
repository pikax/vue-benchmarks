<script setup lang="ts">
import { ref } from "vue";

const value = ref<string | number>("ada");
</script>

<template>
  <!-- plant: string branch has no toFixed -->
  <div v-if="typeof value === 'string'">{{ value.toFixed(1) }}</div>
</template>
