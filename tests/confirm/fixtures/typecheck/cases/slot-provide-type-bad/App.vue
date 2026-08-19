<script setup lang="ts">
defineSlots<{
  default(props: { msg: string }): unknown;
}>();
</script>

<template>
  <div>
    <!-- plant: msg is string, 1 is a number -->
    <!-- @plant-error -->
    <slot :msg="1" />
  </div>
</template>
