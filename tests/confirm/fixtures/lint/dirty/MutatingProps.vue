<script setup>
const props = defineProps({
  count: { type: Number, default: 0 },
});

function bump() {
  props.count += 1;
}
</script>

<template>
  <button type="button" @click="bump">{{ count }}</button>
</template>
