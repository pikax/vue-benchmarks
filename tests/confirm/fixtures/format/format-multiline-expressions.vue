<script setup>
import { ref } from "vue";

const isActive = ref(true);
const hasError = ref(false);
const fontSize = ref(14);
const count = ref(0);

function report(reason, payload) {
  console.log(reason, payload);
}
</script>

<template>
  <div
    :class="{ active: isActive, 'has-error': hasError, 'is-wide-layout-with-a-really-long-name': isActive && !hasError }"
    :style="{ fontSize: fontSize + 'px', '--custom-gap': fontSize / 2 + 'px', backgroundColor: hasError ? 'crimson' : 'transparent' }"
    @click="count++; report('clicked-with-a-fairly-long-reason-string', { count: count, active: isActive })"
  >
    MULTILINE_ATTR_PLANT {{ count }}
  </div>
</template>
