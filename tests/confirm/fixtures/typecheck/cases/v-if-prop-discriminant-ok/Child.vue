<script setup lang="ts">
import type { Result } from "./types";

defineProps<{
  result: Result;
}>();
</script>

<template>
  <span v-if="result.state === 'loaded'">{{ result.items.length }}</span>
  <span v-else>{{ result.message.toUpperCase() }}</span>
</template>
