<template>
  <div class="synth-app">
    <SynthList :synths="synths" @updateSynth="updateSynth" />
    <GlobalEffects :effects="effects" @updateEffect="updateEffect" />
    <Keyboard :activeNotes="activeNotes" @noteOn="noteOn" @noteOff="noteOff" />
    <Visualizer :synths="synths" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SynthList from "./SynthList.vue";
import GlobalEffects from "./GlobalEffects.vue";
import Keyboard from "./Keyboard.vue";
import Visualizer from "./Visualizer.vue";

import { useAudioGraph } from "@/composables/useAudioGraph";

const {
  synths,
  activeNotes,
  effects,
  createSynth,
  updateSynth,
  updateEffect,
  noteOn,
  noteOff,
} = useAudioGraph();
</script>
