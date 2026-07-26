<script setup lang="ts">
type Size = "sm" | "md" | "lg";
type Base = { id: number };
type Extra = { note: string };

withDefaults(
  defineProps<{
    size: Size;
    value: string | number | null;
    config: Base & Extra;
    tuple: [number, string];
    optionalWithDefault?: boolean;
    optionalNoDefault?: string;
  }>(),
  { optionalWithDefault: true },
);
</script>

<template>
  <div>{{ size }} {{ value }} {{ config.id }} {{ tuple[0] }} {{ optionalWithDefault }}</div>
</template>
