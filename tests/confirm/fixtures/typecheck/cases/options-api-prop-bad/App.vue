<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    count: { type: Number, required: true },
  },
  created() {
    // plant: this.count is number, not string
    // @plant-error
    const label: string = this.count;
    console.log(label);
  },
});
</script>

<template>
  <span>{{ count }}</span>
</template>
