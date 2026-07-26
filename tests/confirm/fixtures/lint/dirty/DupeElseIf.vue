<script setup>
const x = 1;
</script>

<template>
  <div>
    <p v-if="x === 1">one</p>
    <!-- plant: vue/no-dupe-v-else-if -->
    <p v-else-if="x === 1">also one</p>
  </div>
</template>
