<script setup lang="ts">
defineSlots<{
  default(props: { submit: (id: number) => void }): unknown;
}>();

function submit(id: number) {
  console.log(id);
}
</script>

<template>
  <div>
    <slot :submit="submit" />
  </div>
</template>
