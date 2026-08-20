<script setup lang="ts">
import type { BaseFieldProps } from "./types";

defineProps<BaseFieldProps & { value: number }>();
</script>

<template>
  <label>{{ name }} {{ hint }} {{ value }}</label>
</template>
