<script setup lang="ts">
import { ref } from "vue";
import Keyboard from "./Keyboard.vue";
import Oscillator from "./Oscillator.vue";

const activeNotes = ref(new Set<string>());
const osc1 = ref<any>(null);
const osc2 = ref<any>(null);

const noteOn = (note: string) => {
  activeNotes.value.add(note);
  osc1.value?.noteOn(note);
  osc2.value?.noteOn(note);
};

const noteOff = (note: string) => {
  activeNotes.value.delete(note);
  osc1.value?.noteOff(note);
  osc2.value?.noteOff(note);
};
</script>

<template>
  <Oscillator ref="osc1" :activeNotes="activeNotes" />
  <Oscillator ref="osc2" :activeNotes="activeNotes" />
  <Keyboard
    :activeNotes="activeNotes"
    :octaves="4"
    :startOctave="3"
    @noteOn="noteOn"
    @noteOff="noteOff"
  />
</template>
