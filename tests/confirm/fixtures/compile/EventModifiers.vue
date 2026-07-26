<script setup>
import { ref } from "vue";

const outer = ref(0);
const inner = ref(0);
const enterCount = ref(0);
const prevented = ref("no");

function onOuter() {
  outer.value++;
}

function onInner() {
  inner.value++;
}

function onSubmit(event) {
  prevented.value = event.defaultPrevented ? "yes" : "no";
}
</script>

<template>
  <div class="event-modifiers">
    <div data-testid="outer" @click="onOuter">
      <button type="button" data-testid="inner" @click.stop="onInner">i</button>
    </div>
    <span data-testid="outer-count">{{ outer }}</span>
    <span data-testid="inner-count">{{ inner }}</span>

    <form data-testid="form" @submit.prevent="onSubmit">
      <button type="submit">s</button>
    </form>
    <span data-testid="prevented">{{ prevented }}</span>

    <input data-testid="key" @keyup.enter="enterCount++" />
    <span data-testid="enter-count">{{ enterCount }}</span>
  </div>
</template>
