<script setup lang="ts">
import { ref } from "vue";

const user = ref<{ name: string } | null>(null);
</script>

<template>
  <!-- plant: v-show is visibility only and must NOT narrow user -->
  <div v-show="user">{{ user.name }}</div>
</template>
