<script setup lang="ts">
type Row = { id: number; label: string };

const rows: Row[] = [{ id: 1, label: "a" }];
</script>

<template>
  <ul>
    <!-- plant: row.id is number, toUpperCase is a string method -->
    <!-- @plant-error -->
    <li v-for="row in rows" :key="row.id">{{ row.id.toUpperCase() }}</li>
  </ul>
</template>
