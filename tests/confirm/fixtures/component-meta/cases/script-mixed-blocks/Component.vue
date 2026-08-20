<script lang="ts">
export interface Row {
  id: number;
  label: string;
}
</script>

<script setup lang="ts">
defineProps<{
  rows: Row[];
  emptyText?: string;
}>();

defineEmits<{
  select: [row: Row];
}>();
</script>

<template>
  <ul>
    <li v-for="row in rows" :key="row.id" @click="$emit('select', row)">{{ row.label }}</li>
    <li v-if="!rows.length">{{ emptyText ?? "none" }}</li>
  </ul>
</template>
