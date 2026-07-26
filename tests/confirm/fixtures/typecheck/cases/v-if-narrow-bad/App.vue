<script setup lang="ts">
import { ref } from "vue";

const user = ref<{ name: string } | null>(null);
</script>

<template>
  <!-- plant: user may be null -->
  <div>{{ user.name }}</div>
</template>
