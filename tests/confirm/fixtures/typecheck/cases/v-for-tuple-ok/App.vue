<script setup lang="ts">
const rows = [["a", 1]] as const;
</script>

<template>
  <ul>
    <li v-for="item in rows" :key="item[0]">{{ item[0].toUpperCase() }}</li>
  </ul>
</template>
