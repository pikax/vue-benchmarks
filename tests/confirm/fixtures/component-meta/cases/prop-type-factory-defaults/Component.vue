<script setup lang="ts">
import type { PropType } from "vue";

interface Filter {
  field: string;
  value: string;
}

const props = defineProps({
  filters: {
    type: Array as PropType<Filter[]>,
    default: () => [],
  },
  pagination: {
    type: Object as PropType<{ page: number; size: number }>,
    default: () => ({ page: 1, size: 20 }),
  },
  scope: {
    type: String as PropType<"all" | "active">,
    required: true,
  },
});
</script>

<template>
  <div>{{ props.scope }} {{ props.filters.length }} {{ props.pagination.page }}</div>
</template>
