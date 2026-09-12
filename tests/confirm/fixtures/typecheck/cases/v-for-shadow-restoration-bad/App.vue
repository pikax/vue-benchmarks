<script setup lang="ts">
const item: string = "outer";
const rows = [{ id: 1 }];
</script>
<template>
  <p>{{ item.toUpperCase() }}</p>
  <div v-for="item in rows" :key="item.id">
    <!-- @plant-error -->
    <span>{{ item.toUpperCase() }}</span>
  </div>
  <p>{{ item.toUpperCase() }}</p>
</template>
