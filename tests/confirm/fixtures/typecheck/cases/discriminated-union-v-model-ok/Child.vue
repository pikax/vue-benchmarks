<script setup lang="ts">
defineProps<{ kind: "num"; n: number } | { kind: "str"; s: string }>();
</script>

<template>
  <span>{{ kind }}</span>
</template>
