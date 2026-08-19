<script setup lang="ts">
const rows = [["a", 1]] as const;
</script>

<template>
  <ul>
    <li v-for="item in rows" :key="item[0]">
      <!-- plant: item[0] is string; toFixed is number-only -->
      <!-- @plant-error -->
      {{ item[0].toFixed(0) }}
    </li>
  </ul>
</template>
