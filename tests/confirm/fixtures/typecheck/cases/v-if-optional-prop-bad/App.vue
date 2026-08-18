<script setup lang="ts">
defineProps<{
  label?: string;
}>();
</script>

<template>
  <!-- plant: optional prop is string | undefined without a guard -->
  <span>{{ label.toUpperCase() }}</span>
</template>
