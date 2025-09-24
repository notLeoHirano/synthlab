<template>
  <div class="synth-list">
    <Synth
      v-for="s in synths"
      :key="s.id"
      :synthData="s"
      @update="onUpdateSynth"
    />
    <button @click="addSynth">+ Add Synth</button>
  </div>
</template>

<script setup lang="ts">
import Synth from "./Synth.vue";
import { defineProps, defineEmits } from "vue";

const props = defineProps<{ synths: any[] }>();
const emit = defineEmits<{ (e: "updateSynth", synth: any): void }>();

const addSynth = () => {
  const newSynth = createSynth();
  emit("updateSynth", newSynth);
};

const onUpdateSynth = (synth) => emit("updateSynth", synth);
</script>
