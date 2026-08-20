<script setup>
import { ref } from "vue";

const attrName = ref("data-a");
const evtName = ref("click");
const hits = ref(0);

function rename() {
  attrName.value = "data-b";
  evtName.value = "dblclick";
}
</script>

<template>
  <div class="dynamic-args">
    <span :[attrName]="'v'" data-testid="target">t</span>
    <button type="button" data-testid="hit" @[evtName]="hits++">h</button>
    <span data-testid="hits">{{ hits }}</span>
    <button type="button" data-testid="rename" @click="rename">r</button>
  </div>
</template>
