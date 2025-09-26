<script setup lang="ts">
import * as Tone from "tone";
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  activeNotes: Set<string>;
  octaves?: number;
  startOctave?: number;
}>();

const emit = defineEmits<{
  (e: "noteOn", note: string): void;
  (e: "noteOff", note: string): void;
}>();

const showPiano = ref(true);

const OCTAVES = props.octaves ?? 2;
const START_OCTAVE = props.startOctave ?? 4;

const WHITE_KEY_WIDTH = 32;
const WHITE_KEY_HEIGHT = 160;
const BLACK_KEY_WIDTH = 24;
const BLACK_KEY_HEIGHT = 100;

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

const totalWhiteKeys = OCTAVES * 7;
const whiteKeyWidthPercent = 100 / totalWhiteKeys; // width in %

const pianoKeys = Array.from({ length: OCTAVES }, (_, o) => {
  const octaveNumber = START_OCTAVE + o;
  return octaveTemplate.map((k, i) => ({
    ...k,
    note: `${k.note}${octaveNumber}`,
    // calculate position as index in white keys (for black keys)
    position: k.type === "black" ? o * 7 + (k.position ?? i) : undefined,
  }));
}).flat();

const whiteKeys = pianoKeys.filter((k) => k.type === "white");
const blackKeys = pianoKeys.filter((k) => k.type === "black");

const startNote = async (note: string) => emit("noteOn", note);
const endNote = (note: string) => emit("noteOff", note);

const whiteKeyRows = [
  "zxcvbnm,./", // row 1 (lower)
  "qwertyuiop[]", // row 2 (upper)
];
const blackKeyRows = [
  "sdghjl;", // row 1 (lower)
  "2346790-", // row 2 (upper)
];

const whiteKeyNotes = whiteKeys.map((k) => k.note);
const blackKeyNotes = blackKeys.map((k) => k.note);

const keyMap: Record<string, string> = {};

// Map white keys
let wIndex = 0;
for (const row of whiteKeyRows) {
  for (const char of row) {
    if (wIndex >= whiteKeyNotes.length) break;
    keyMap[char] = whiteKeyNotes[wIndex];
    wIndex++;
  }
}

// Map black keys
let bIndex = 0;
for (const row of blackKeyRows) {
  for (const char of row) {
    if (bIndex >= blackKeyNotes.length) break;
    keyMap[char] = blackKeyNotes[bIndex];
    bIndex++;
  }
}

const activeKeys = new Set<string>();

const handleKeyDown = (e: KeyboardEvent) => {
  const note = keyMap[e.key];
  if (note && !activeKeys.has(note)) {
    activeKeys.add(note);
    startNote(note);
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  const note = keyMap[e.key];
  if (note) {
    activeKeys.delete(note);
    endNote(note);
  }
};
const noteToKey: Record<string, string> = {};
for (const [char, note] of Object.entries(keyMap)) {
  noteToKey[note] = char.toUpperCase(); // show uppercase for clarity
}
onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
});
</script>

<template>
  <div class="relative inline-block justify-center">
    <button
      class="mb-2 px-3 py-1 rounded bg-emerald-500 text-xs font-mono hover:bg-gray-300"
      @click="showPiano = !showPiano"
    >
      {{ showPiano ? "Hide" : "Show" }}
    </button>
    <div v-if="showPiano" class="w-full relative inline-block justify-center">
      <!-- White Keys -->
      <div class="">
        <button
          v-for="key in whiteKeys"
          :key="key.note"
          class="relative group bg-white border border-gray-400 rounded-b font-mono text-xs font-bold transition-all duration-100 hover:bg-gray-100"
          :class="props.activeNotes.has(key.note) ? 'bg-gray-300 scale-95' : ''"
          :style="{
            width: whiteKeyWidthPercent + '%',
            height: WHITE_KEY_HEIGHT + 'px',
          }"
          @mousedown="startNote(key.note)"
          @mouseup="endNote(key.note)"
          @mouseleave="endNote(key.note)"
          @touchstart.prevent="startNote(key.note)"
          @touchend.prevent="endNote(key.note)"
        >
          <span
            v-if="noteToKey[key.note]"
            class="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {{ noteToKey[key.note] }}
          </span>
        </button>
      </div>

      <!-- Black Keys -->
      <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
        <button
          v-for="key in blackKeys"
          :key="key.note"
          :style="{
            position: 'absolute',
            left: `calc(${((key.position ?? 0) / totalWhiteKeys) * 100}% )`,
            width: `calc(${whiteKeyWidthPercent * 0.7}%)`, // black keys narrower
            height: BLACK_KEY_HEIGHT + 'px',
            pointerEvents: 'auto',
          }"
          class="bg-black text-white rounded-b font-mono text-xs font-bold transition-all duration-100 hover:bg-gray-800 shadow"
          :class="props.activeNotes.has(key.note) ? 'bg-gray-700 scale-95' : ''"
          @mousedown="startNote(key.note)"
          @mouseup="endNote(key.note)"
          @mouseleave="endNote(key.note)"
          @touchstart.prevent="startNote(key.note)"
          @touchend.prevent="endNote(key.note)"
        >
          <span
            v-if="noteToKey[key.note]"
            class="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {{ noteToKey[key.note] }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
