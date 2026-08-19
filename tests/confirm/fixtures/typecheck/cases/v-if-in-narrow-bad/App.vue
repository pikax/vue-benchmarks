<script setup lang="ts">
import { ref } from "vue";

type A = { type: "a"; a: string };
type B = { type: "b"; b: number };

const x = ref<A | B>({ type: "a", a: "ok" });
</script>

<template>
  <span v-if="'a' in x">
    <!-- plant: true branch is the { a } variant; b is on the other arm -->
    <!-- @plant-error -->
    {{ x.b.toFixed(0) }}
  </span>
</template>
