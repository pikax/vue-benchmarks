<script setup lang="ts">
import { computed, ref } from "vue";

const query = ref("");
const isEmpty = computed(() => query.value.length === 0);

function clear(): void {
  query.value = "";
}

defineExpose({ query, isEmpty, clear });
</script>

<template>
  <input v-model="query" />
</template>
