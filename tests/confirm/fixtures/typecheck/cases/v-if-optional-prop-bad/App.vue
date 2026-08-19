<script setup lang="ts">
defineProps<{
  label?: string;
}>();
</script>

<template>
  <!-- plant: optional prop is string | undefined without a guard -->
  <!-- @plant-error -->
  <span>{{ label.toUpperCase() }}</span>
</template>
