<script setup lang="ts">
const notAHandler = 123;
const disabledFlag: string = "yes";
</script>

<template>
  <!-- plant: :disabled expects boolean, gets string -->
  <!-- @plant-error -->
  <button type="button" :disabled="disabledFlag">go</button>
  <!-- plant: @click expects a function, gets a number -->
  <!-- @plant-error -->
  <button type="button" @click="notAHandler">go</button>
</template>
