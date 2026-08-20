<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "OptionsCounter",
  props: {
    label: { type: String, required: true },
    step: { type: Number, default: 1 },
  },
  emits: ["increment", "reset"],
  data() {
    return { count: 0 };
  },
  methods: {
    bump(): void {
      this.count += this.step;
      this.$emit("increment", this.count);
    },
    clear(): void {
      this.count = 0;
      this.$emit("reset");
    },
  },
});
</script>

<template>
  <div>
    <button type="button" @click="bump">{{ label }} {{ count }}</button>
    <button type="button" @click="clear">reset</button>
  </div>
</template>
