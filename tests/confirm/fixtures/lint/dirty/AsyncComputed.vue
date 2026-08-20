<script setup>
import { computed, ref } from "vue";

const userId = ref(1);
const profile = computed(async () => {
  const res = await fetch(`/api/users/${userId.value}`);
  return res.json();
});
</script>

<template>
  <span>{{ profile }}</span>
</template>
