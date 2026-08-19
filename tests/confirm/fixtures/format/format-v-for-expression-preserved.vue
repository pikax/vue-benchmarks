<script setup>
defineProps({
  items: { type: Array, required: true },
});
</script>

<template>
  <ul>
    <li v-for="(item, index) in items" :key="index">
      {{ item }}
    </li>
  </ul>
</template>
