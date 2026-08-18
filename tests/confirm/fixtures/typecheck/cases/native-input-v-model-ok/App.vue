<script setup lang="ts">
import { ref } from "vue";

const text = ref("");
</script>

<template>
  <input v-model="text" />
</template>
