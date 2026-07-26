<script setup>
defineProps({
  items: { type: Array, required: true },
});
</script>

<template>
  <ul class="list" data-testid="list">
    <li v-for="(item, index) in items" :key="index" class="item" data-testid="item">
      {{ item }}
    </li>
  </ul>
</template>
