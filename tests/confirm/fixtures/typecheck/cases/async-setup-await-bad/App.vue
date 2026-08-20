<script setup lang="ts">
async function load(): Promise<{ name: string }> {
  return { name: "Ada" };
}

const data = await load();
</script>

<template>
  <!-- plant: the awaited value has `name` only; `count` does not exist -->
  <!-- @plant-error -->
  <div>{{ data.count }}</div>
</template>
