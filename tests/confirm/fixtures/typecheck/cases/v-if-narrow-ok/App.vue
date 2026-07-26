<script setup lang="ts">
import { ref } from "vue";

const user = ref<{ name: string } | null>({ name: "Ada" });
</script>

<template>
  <div v-if="user">
    {{ user.name }}
  </div>
</template>
