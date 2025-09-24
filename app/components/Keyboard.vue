<script setup lang="ts">
import * as Tone from "tone";

const props = defineProps<{
  synth: Tone.Synth | null;
  activeNotes: Set<string>;
  octaves?: number;
  startOctave?: number;
}>();

const emit = defineEmits<{
  (e: "noteOn", note: string): void;
  (e: "noteOff", note: string): void;
}>();

// Defaults
const OCTAVES = props.octaves ?? 2;
const START_OCTAVE = props.startOctave ?? 4;

const WHITE_KEY_WIDTH = 32;
const WHITE_KEY_HEIGHT = 160;
const BLACK_KEY_WIDTH = 24;
const BLACK_KEY_HEIGHT = 100;

// Template for one octave
const octaveTemplate = [
  { note: "C", type: "white" },
  { note: "C#", type: "black", position: 0.7 },
  { note: "D", type: "white" },
  { note: "D#", type: "black", position: 1.7 },
  { note: "E", type: "white" },
  { note: "F", type: "white" },
  { note: "F#", type: "black", position: 3.7 },
  { note: "G", type: "white" },
  { note: "G#", type: "black", position: 4.7 },
  { note: "A", type: "white" },
  { note: "A#", type: "black", position: 5.7 },
  { note: "B", type: "white" },
];

// Generate all keys
const pianoKeys = Array.from({ length: OCTAVES }, (_, o) => {
  const octaveNumber = START_OCTAVE + o;
  return octaveTemplate.map((k) => ({
    ...k,
    note: `${k.note}${octaveNumber}`,
    position: k.position != null ? k.position + o * 7 : undefined,
  }));
}).flat();

const whiteKeys = pianoKeys.filter((k) => k.type === "white");
const blackKeys = pianoKeys.filter((k) => k.type === "black");

// Play handlers
const startNote = async (note: string) => {
  if (props.activeNotes.has(note)) return;
  await Tone.start();
  props.synth?.triggerAttack(note);
  emit("noteOn", note);
};

const endNote = (note: string) => {
  if (!props.activeNotes.has(note)) return;
  props.synth?.triggerRelease(note);
  emit("noteOff", note);
};
</script>

<template>
  <div class="relative inline-block">
    <!-- White Keys -->
    <div class="flex">
      <button
        v-for="key in whiteKeys"
        :key="key.note"
        :style="{
          width: WHITE_KEY_WIDTH + 'px',
          height: WHITE_KEY_HEIGHT + 'px',
        }"
        :class="[
          'bg-white border border-gray-400 rounded-b font-mono text-xs font-bold transition-all duration-100 hover:bg-gray-100',
          props.activeNotes.has(key.note) ? 'bg-gray-300 scale-95' : '',
        ]"
        @mousedown="startNote(key.note)"
        @mouseup="endNote(key.note)"
        @mouseleave="endNote(key.note)"
        @touchstart.prevent="startNote(key.note)"
        @touchend.prevent="endNote(key.note)"
      >
        {{ key.note.replace("#", "♯") }}
      </button>
    </div>

    <!-- Black Keys -->
    <div class="absolute top-0 left-0 h-0">
      <button
        v-for="key in blackKeys"
        :key="key.note"
        :style="{
          position: 'absolute',
          left: (key.position ?? 0) * WHITE_KEY_WIDTH + 'px',
          width: BLACK_KEY_WIDTH + 'px',
          height: BLACK_KEY_HEIGHT + 'px',
        }"
        :class="[
          'bg-black text-white rounded-b font-mono text-xs font-bold transition-all duration-100 hover:bg-gray-800 shadow',
          props.activeNotes.has(key.note) ? 'bg-gray-700 scale-95' : '',
        ]"
        @mousedown="startNote(key.note)"
        @mouseup="endNote(key.note)"
        @mouseleave="endNote(key.note)"
        @touchstart.prevent="startNote(key.note)"
        @touchend.prevent="endNote(key.note)"
      >
        {{ key.note.replace("#", "♯") }}
      </button>
    </div>
  </div>
</template>
