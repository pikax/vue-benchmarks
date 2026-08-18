<script setup lang="ts">
defineSlots<{
  default(props: { msg: string }): unknown;
  header(props: { title: string }): unknown;
}>();
</script>

<template>
  <div>
    <slot name="header" :title="'Hi'" />
    <slot :msg="'body'" />
  </div>
</template>
