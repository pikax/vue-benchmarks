<template>
  <div    class="card"   :title="title"  >
    <h1>{{   title }}</h1>
    <ul>
      <li   v-for="(row, i) in rows"   :key="i"  >{{ row }}</li>
    </ul>
    <button   type="button"   @click="inc"  >{{ count }}</button>
  </div>
</template>

<script setup>
import {ref} from 'vue'
const title=  'Format plant'
const count =ref( 0 )
const rows=[ 'a',  'b','c' ]
function inc(){count.value++}
</script>

<style>
.card{ padding:8px;  color:#111 }
h1 {font-size:  18px;}
</style>
