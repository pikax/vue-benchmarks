<script setup lang="ts">
const { count = 0 } = defineProps<{ count?: number }>();
</script>

<template>
  <!-- plant: count is number, toUpperCase is a string method -->
  <!-- @plant-error -->
  <div>{{ count.toUpperCase() }}</div>
</template>
