<script setup>
const items = [{ id: 1, ok: true }];
</script>

<template>
  <ul>
    <li v-for="item in items" v-if="item.ok" :key="item.id">{{ item.id }}</li>
  </ul>
</template>
