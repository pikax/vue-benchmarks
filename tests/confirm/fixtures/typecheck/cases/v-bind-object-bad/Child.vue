<script setup lang="ts">
defineProps<{
  title: string;
  count: number;
}>();
</script>

<template>
  <span>{{ title }}:{{ count }}</span>
</template>
