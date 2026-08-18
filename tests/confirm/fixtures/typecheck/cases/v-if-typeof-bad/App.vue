<script setup lang="ts">
import { ref } from "vue";

const value = ref<string | number>(1);
</script>

<template>
  <!-- plant: no typeof guard, toUpperCase is string-only -->
  <span>{{ value.toUpperCase() }}</span>
</template>
