<script setup>
import { ref } from "vue";

const text = ref("");
</script>

<template>
  <div v-model="text">{{ text }}</div>
</template>
