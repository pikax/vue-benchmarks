<script setup lang="ts">
defineProps<{
  variant: "primary" | "secondary";
}>();
</script>

<template>
  <span>{{ variant }}</span>
</template>
