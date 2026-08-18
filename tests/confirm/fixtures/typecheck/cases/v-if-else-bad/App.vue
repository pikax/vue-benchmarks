<script setup lang="ts">
import { ref } from "vue";

const user = ref<{ name: string } | null>(null);
</script>

<template>
  <div v-if="user">{{ user.name }}</div>
  <!-- plant: v-else is the null branch; user.name is not valid here -->
  <div v-else>{{ user.name }}</div>
</template>
