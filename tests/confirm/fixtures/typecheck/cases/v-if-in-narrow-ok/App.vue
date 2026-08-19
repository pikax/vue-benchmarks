<script setup lang="ts">
import { ref } from "vue";

type A = { type: "a"; a: string };
type B = { type: "b"; b: number };

const x = ref<A | B>({ type: "a", a: "ok" });
</script>

<template>
  <span v-if="'a' in x">{{ x.a.toUpperCase() }}</span>
</template>
