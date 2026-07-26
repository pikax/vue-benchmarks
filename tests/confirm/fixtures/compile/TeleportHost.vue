<script setup>
import { ref } from "vue";
const msg = ref("teleported");
</script>

<template>
  <div class="teleport-host" data-testid="host">
    <Teleport to="#confirm-teleport-target">
      <span data-testid="ported">{{ msg }}</span>
    </Teleport>
    <span data-testid="local">local</span>
  </div>
</template>
