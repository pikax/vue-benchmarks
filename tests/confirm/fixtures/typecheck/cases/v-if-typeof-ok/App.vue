<script setup lang="ts">
import { ref } from "vue";

const value = ref<string | number>(1);
</script>

<template>
  <span v-if="typeof value === 'number'">{{ value.toFixed(2) }}</span>
</template>
