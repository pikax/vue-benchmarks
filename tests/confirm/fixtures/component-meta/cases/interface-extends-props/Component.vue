<script setup lang="ts">
interface BaseControlProps {
  id: string;
  disabled?: boolean;
}

interface TextFieldProps extends BaseControlProps {
  modelValue: string;
  maxLength?: number;
}

defineProps<TextFieldProps>();
</script>

<template>
  <input :id="id" :disabled="disabled" :value="modelValue" :maxlength="maxLength" />
</template>
