<script setup lang="ts">
defineProps<{
  title: string;
  /** Distinctive optional prop: the completion plant looks for THIS name.
   *  `title` alone would be satisfiable by HTML's global `title` attribute. */
  epilogueText?: string;
}>();
</script>

<template>
  <h1>{{ title }}</h1>
</template>
