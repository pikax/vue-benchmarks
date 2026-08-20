<script setup lang="ts">
const [text, textModifiers] = defineModel<string, "trim">({ required: true });
const page = defineModel<number>("page", { default: 1 });
</script>

<template>
  <div>
    <input :value="text" @input="text = ($event.target as HTMLInputElement).value" />
    <span>{{ page }} {{ textModifiers.trim ? "trim" : "raw" }}</span>
  </div>
</template>
