<script setup lang="ts">
function onClick(e: MouseEvent) {
  console.log(e.button);
}
</script>

<template>
  <!-- plant: key modifier does not turn KeyboardEvent into MouseEvent -->
  <!-- @plant-error -->
  <input @keyup.enter="onClick" />
</template>
