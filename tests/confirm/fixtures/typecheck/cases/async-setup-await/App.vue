<script setup lang="ts">
async function load(): Promise<{ name: string }> {
  return { name: "Ada" };
}

// Top-level await: the virtual setup() must be emitted as async,
// otherwise this reports TS1308 rather than typechecking cleanly.
const data = await load();
</script>

<template>
  <div>{{ data.name.toUpperCase() }}</div>
</template>
