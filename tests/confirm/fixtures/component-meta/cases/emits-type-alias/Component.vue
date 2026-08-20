<script setup lang="ts">
type FieldEmits = {
  "update:modelValue": [value: string];
  blur: [];
  commit: [value: string, force: boolean];
};

defineProps<{ modelValue: string }>();
const emit = defineEmits<FieldEmits>();
</script>

<template>
  <input
    :value="modelValue"
    @blur="emit('blur')"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @change="emit('commit', modelValue, true)"
  />
</template>
