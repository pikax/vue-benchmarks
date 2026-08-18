<script setup lang="ts">
import { computed, ref } from "vue";

const count = ref(2);
const doubled = computed(() => count.value * 2);
</script>

<template>
  <span>{{ doubled.toFixed(0) }}</span>
</template>
