<script setup lang="ts">
type Row = { id: number; label: string; tags: string[] };

const rows: Row[] = [{ id: 1, label: "a", tags: ["x"] }];
</script>

<template>
  <ul>
    <li v-for="(row, index) in rows" :key="row.id">
      {{ index.toFixed(0) }}: {{ row.label.toUpperCase() }}
      <span v-for="tag in row.tags" :key="tag">{{ tag.trim() }}</span>
    </li>
  </ul>
</template>
