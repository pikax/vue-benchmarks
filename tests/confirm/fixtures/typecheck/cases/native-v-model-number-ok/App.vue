<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <input v-model.number="count" />
</template>
