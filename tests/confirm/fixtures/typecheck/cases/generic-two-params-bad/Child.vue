<script setup lang="ts" generic="K extends string, V">
defineProps<{
  keyName: K;
  value: V;
}>();
defineSlots<{
  default(props: { value: V }): unknown;
}>();
</script>

<template>
  <span>
    <slot :value="value">{{ keyName }}</slot>
  </span>
</template>
