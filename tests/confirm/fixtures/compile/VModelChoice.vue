<script setup>
import { ref } from "vue";

// The compiler must select the right runtime model directive per element:
// vModelCheckbox (array binding), vModelRadio, vModelSelect.
const picks = ref(["b"]);
const tone = ref("low");
const city = ref("york");
</script>

<template>
  <div class="v-model-choice">
    <input type="checkbox" value="a" v-model="picks" data-testid="check-a" />
    <input type="checkbox" value="b" v-model="picks" data-testid="check-b" />
    <span data-testid="picks">{{ picks.slice().sort().join(",") }}</span>

    <input type="radio" value="low" v-model="tone" data-testid="radio-low" />
    <input type="radio" value="high" v-model="tone" data-testid="radio-high" />
    <span data-testid="tone">{{ tone }}</span>

    <select v-model="city" data-testid="select">
      <option value="york">york</option>
      <option value="leeds">leeds</option>
    </select>
    <span data-testid="city">{{ city }}</span>
  </div>
</template>
