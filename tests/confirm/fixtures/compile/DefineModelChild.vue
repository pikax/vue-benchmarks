<script setup>
// defineModel with modifiers: the macro must generate the modelValue +
// modelModifiers props, the update:modelValue emit, and pass the set()
// transformer through to useModel.
const [model, modifiers] = defineModel({
  set(value) {
    return modifiers.upper ? value.toUpperCase() : value;
  },
});
</script>

<template>
  <div class="define-model-child">
    <p data-testid="value">{{ model }}</p>
    <p data-testid="mods">{{ Object.keys(modifiers).sort().join(",") }}</p>
    <button type="button" data-testid="send" @click="model = 'next'">s</button>
  </div>
</template>
