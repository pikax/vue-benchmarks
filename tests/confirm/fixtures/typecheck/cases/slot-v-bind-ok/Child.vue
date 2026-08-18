<script setup lang="ts">
const row = { item: { id: 1, label: "x" } };

defineSlots<{
  row(props: { item: { id: number; label: string } }): unknown;
}>();
</script>

<template>
  <div>
    <slot name="row" v-bind="row" />
  </div>
</template>
