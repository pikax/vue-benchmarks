<script setup lang="ts">
enum Priority {
  Low = "low",
  High = "high",
}

defineProps<{
  priority: Priority;
  mode?: "auto" | "manual";
}>();

defineEmits<{
  "update:priority": [value: Priority];
}>();
</script>

<template>
  <span>{{ priority }} {{ mode ?? "auto" }}</span>
</template>
