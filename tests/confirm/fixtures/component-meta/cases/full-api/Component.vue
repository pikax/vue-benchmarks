<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    size?: "sm" | "md" | "lg";
  }>(),
  { size: "md" },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  submit: [payload: { value: string; size: string }];
}>();

defineSlots<{
  default(props: { size: string }): any;
  actions(): any;
}>();

const inputEl = ref<HTMLInputElement | null>(null);

function focus() {
  inputEl.value?.focus();
}

defineExpose({ focus, props });
</script>

<template>
  <div>
    <input
      ref="inputEl"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <slot :size="size" />
    <slot name="actions" />
    <button type="button" @click="emit('submit', { value: modelValue, size })">go</button>
  </div>
</template>
