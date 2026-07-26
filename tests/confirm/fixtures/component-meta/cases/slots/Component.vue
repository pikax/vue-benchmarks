<script setup lang="ts">
defineProps<{ heading: string }>();

defineSlots<{
  default(props: { open: boolean }): any;
  icon(): any;
  footer(props: { id: number }): any;
}>();
</script>

<template>
  <section>
    <h2>{{ heading }}</h2>
    <slot name="icon" />
    <slot :open="true">body</slot>
    <slot name="footer" :id="1" />
  </section>
</template>
