<script setup lang="ts">
defineSlots<{ row(props: { item: { id: number } }): any }>();
</script>
<template><slot name="row" :item="{ id: 1 }" /></template>
