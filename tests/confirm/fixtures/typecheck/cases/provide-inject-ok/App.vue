<script setup lang="ts">
import { inject, provide, type InjectionKey } from "vue";

const labelKey = Symbol("label") as InjectionKey<string>;

provide(labelKey, "ada");

const label = inject(labelKey, "fallback");
</script>

<template>
  <span>{{ label.toUpperCase() }}</span>
</template>
