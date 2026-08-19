<script setup lang="ts">
defineSlots<{
  header(props: { title: string }): any;
}>();
</script>

<template>
  <div>
    <slot name="header" :title="'Hi'" />
  </div>
</template>
