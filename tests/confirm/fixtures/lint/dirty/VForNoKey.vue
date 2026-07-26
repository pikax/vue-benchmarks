<script setup>
const items = [1, 2, 3];
</script>

<template>
  <ul>
    <!-- plant: vue/require-v-for-key -->
    <li v-for="n in items">{{ n }}</li>
  </ul>
</template>
