<script setup lang="ts">
import { ref } from "vue";

const count = ref(1);
</script>

<template>
  <!-- plant: unwrapped count is number, toUpperCase is string-only -->
  <span>{{ count.toUpperCase() }}</span>
</template>
