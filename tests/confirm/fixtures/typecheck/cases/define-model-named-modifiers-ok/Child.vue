<script setup lang="ts">
const [title, modifiers] = defineModel<string, "trim">("title", { required: true });

if (modifiers.trim) {
  title.value = title.value.trim();
}
</script>

<template>
  <span>{{ title }}</span>
</template>
