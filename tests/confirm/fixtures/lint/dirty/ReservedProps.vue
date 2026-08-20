<script setup>
const props = defineProps({
  key: { type: String, default: "" },
});
</script>

<template>
  <span>{{ props.key }}</span>
</template>
