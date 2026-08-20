<script setup lang="ts">
withDefaults(
  defineProps<{
    items?: string[];
    config?: { retries: number; verbose: boolean };
    formatter?: (value: number) => string;
  }>(),
  {
    items: () => ["a", "b"],
    config: () => ({ retries: 3, verbose: false }),
    formatter: (value: number) => `#${value}`,
  },
);
</script>

<template>
  <div>{{ formatter(config.retries) }} {{ items.length }}</div>
</template>
