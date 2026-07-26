<script setup lang="ts">
import { inject, provide, type InjectionKey } from "vue";

const userKey = Symbol("user") as InjectionKey<{ name: string }>;

provide(userKey, { name: "Ada" });

const user = inject(userKey);

// plant: inject() without a default returns `{ name: string } | undefined`
const upper = user.name.toUpperCase();
</script>

<template>
  <div>{{ upper }}</div>
</template>
