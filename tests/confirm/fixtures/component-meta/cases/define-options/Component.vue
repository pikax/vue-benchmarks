<script setup lang="ts">
defineOptions({
  name: "FancyPanel",
  inheritAttrs: false,
});

defineProps<{
  heading: string;
  tone?: "info" | "warn";
}>();
</script>

<template>
  <section v-bind="$attrs">
    <h3>{{ heading }}</h3>
    <p>{{ tone ?? "info" }}</p>
  </section>
</template>
