<script setup lang="ts">
const row = { item: { id: "nope", label: "x" } };

defineSlots<{
  row(props: { item: { id: number; label: string } }): unknown;
}>();
</script>

<template>
  <div>
    <!-- plant: id is string, slot payload wants number -->
    <slot name="row" v-bind="row" />
  </div>
</template>
