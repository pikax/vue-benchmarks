<script setup lang="ts">
import { ref } from "vue";

const user = ref<{ name: string } | null>(null);
</script>

<template>
  <div v-if="!user">guest</div>
  <div v-else>{{ user.name }}</div>
</template>
