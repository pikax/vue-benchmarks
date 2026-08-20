<script setup>
const props = defineProps({
  label: { type: "String", default: "" },
});
</script>

<template>
  <span>{{ props.label }}</span>
</template>
