<script setup lang="ts">
defineSlots<{
  row(props: { item: { id: number; label: string } }): any;
}>();
</script>

<template>
  <div>
    <slot name="row" :item="{ id: 1, label: 'x' }" />
  </div>
</template>
