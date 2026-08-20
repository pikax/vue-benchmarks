<script setup>
import { reactive } from "vue";

const extras = reactive({ "data-x": "1", title: "first", class: "from-obj" });

function change() {
  extras.title = "second";
  delete extras["data-x"];
  extras["data-y"] = "2";
}
</script>

<template>
  <div class="v-bind-object">
    <span class="static" v-bind="extras" data-testid="target">t</span>
    <button type="button" data-testid="change" @click="change">c</button>
  </div>
</template>
