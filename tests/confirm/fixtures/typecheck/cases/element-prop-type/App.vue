<script setup lang="ts">
const notAHandler = 123;
const disabledFlag: string = "yes";
</script>

<template>
  <!-- plant: @click expects a function; :disabled expects boolean -->
  <button type="button" :disabled="disabledFlag" @click="notAHandler">go</button>
</template>
