<script setup lang="ts">
const rows = [
  { id: 1, label: "a" },
  { id: 2, label: "b" },
];
</script>

<template>
  <ul>
    <li v-for="{ id, label } in rows" :key="id">{{ label.toUpperCase() }}</li>
  </ul>
</template>
