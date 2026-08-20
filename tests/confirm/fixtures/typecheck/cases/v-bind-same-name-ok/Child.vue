<script setup lang="ts">
defineProps<{
  count: number;
  title: string;
}>();
</script>

<template>
  <span>{{ title }}:{{ count }}</span>
</template>
