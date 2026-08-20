<script setup lang="ts" generic="TRow extends { id: number }">
defineProps<{ rows: TRow[] }>();

defineSlots<{
  row(props: { row: TRow; index: number }): any;
  empty?(): any;
}>();
</script>

<template>
  <ul>
    <li v-for="(row, index) in rows" :key="row.id">
      <slot name="row" :row="row" :index="index" />
    </li>
    <li v-if="!rows.length"><slot name="empty" /></li>
  </ul>
</template>
