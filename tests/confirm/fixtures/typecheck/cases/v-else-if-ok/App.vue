<script setup lang="ts">
import { ref } from "vue";

const value = ref<string | number>("ada");
</script>

<template>
  <div v-if="typeof value === 'string'">{{ value.toUpperCase() }}</div>
  <div v-else-if="typeof value === 'number'">{{ value.toFixed(1) }}</div>
</template>
