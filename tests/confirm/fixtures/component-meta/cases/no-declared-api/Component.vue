<script setup lang="ts">
import { ref } from "vue";

const now = ref("1970-01-01");
</script>

<template>
  <time>{{ now }}</time>
</template>
