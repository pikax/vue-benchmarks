<script setup>
import { h, ref } from "vue";

// Child declared inline so the fixture stays single-file for every compiler.
const Child = {
  props: { modelValue: { type: String, default: "" } },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h(
        "button",
        {
          type: "button",
          "data-testid": "child",
          onClick: () => emit("update:modelValue", props.modelValue + "!"),
        },
        props.modelValue,
      );
  },
};

const text = ref("a");
</script>

<template>
  <div class="v-model-component">
    <Child v-model="text" />
    <p data-testid="parent">{{ text }}</p>
  </div>
</template>
