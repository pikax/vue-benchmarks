<script setup lang="ts">
const modelValue = defineModel<string>({ required: true });
const count = defineModel<number>("count", { default: 0 });

function bump() {
  count.value = (count.value ?? 0) + 1;
}
</script>

<template>
  <div>
    <input :value="modelValue" @input="modelValue = ($event.target as HTMLInputElement).value" />
    <button type="button" @click="bump">{{ count }}</button>
  </div>
</template>
