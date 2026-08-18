<script setup lang="ts">
import { ref } from "vue";

const count = ref(1);
</script>

<template>
  <span>{{ count + 1 }}</span>
</template>
