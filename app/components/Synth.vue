<script setup lang="ts">
import { ref, onMounted, watch, computed, onBeforeUnmount } from "vue";
import * as Tone from "tone";
import Keyboard from "./Keyboard.vue"; // <-- your piano keyboard component

// Reactive data
const oscillatorType = ref("sine");
const envelope = ref({
  attack: 0.1,
  hold: 0.1,
  decay: 0.1,
  sustain: 0.7,
  release: 0.5,
});

const isDragging = ref(false);
const dragPoint = ref<string | null>(null);
const svg = ref<SVGElement | null>(null);
const activeNotes = ref<Set<string>>(new Set());

const svgWidth = ref(400);
const svgHeight = ref(300);

let synth: Tone.PolySynth | null = null;

// ===== Envelope curve calculations =====
const totalTime = computed(
  () =>
    envelope.value.attack +
    envelope.value.hold +
    envelope.value.decay +
    1 + // sustain constant
    envelope.value.release
);

const attackPoint = computed(() => ({
  x: (envelope.value.attack / totalTime.value) * svgWidth.value,
  y: 0,
}));

const holdPoint = computed(() => ({
  x:
    ((envelope.value.attack + envelope.value.hold) / totalTime.value) *
    svgWidth.value,
  y: 0,
}));

const decayPoint = computed(() => ({
  x:
    ((envelope.value.attack + envelope.value.hold + envelope.value.decay) /
      totalTime.value) *
    svgWidth.value,
  y: svgHeight.value - envelope.value.sustain * svgHeight.value,
}));

const sustainPoint = computed(() => ({
  x:
    ((envelope.value.attack + envelope.value.hold + envelope.value.decay + 1) /
      totalTime.value) *
    svgWidth.value,
  y: svgHeight.value - envelope.value.sustain * svgHeight.value,
}));

const envelopePath = computed(
  () =>
    `M 0 ${svgHeight.value}
   L ${attackPoint.value.x} ${attackPoint.value.y}
   L ${holdPoint.value.x} ${holdPoint.value.y}
   C ${(holdPoint.value.x + decayPoint.value.x) / 2} ${holdPoint.value.y},
     ${(holdPoint.value.x + decayPoint.value.x) / 2} ${decayPoint.value.y},
     ${decayPoint.value.x} ${decayPoint.value.y}
   L ${sustainPoint.value.x} ${sustainPoint.value.y}
   L ${svgWidth.value} ${svgHeight.value}`
);

// ===== Wave types =====
const waveTypes = [
  { type: "sine", name: "Sine", path: "M0,25 Q25,0 50,25 Q75,50 100,25" },
  {
    type: "square",
    name: "Square",
    path: "M0,25 L0,0 L50,0 L50,50 L100,50 L100,25",
  },
  { type: "sawtooth", name: "Saw", path: "M0,25 L50,0 L50,50 L100,25" },
  {
    type: "triangle",
    name: "Triangle",
    path: "M0,25 L25,50 L50,25 L75,0 L100,25",
  },
];

// ===== Initialize synth =====
onMounted(() => {
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: oscillatorType.value },
    envelope: { ...envelope.value },
  }).toDestination();

  if (svg.value) {
    const resizeObserver = new ResizeObserver(() => {
      svgWidth.value = svg.value!.clientWidth;
      svgHeight.value = svg.value!.clientHeight;
    });
    resizeObserver.observe(svg.value);
  }
});

// ===== Watchers =====
watch(oscillatorType, (newVal) => {
  synth?.set({ oscillator: { type: newVal } });
});

watch(
  envelope,
  (newEnv) => {
    synth?.set({ envelope: { ...newEnv } });
  },
  { deep: true }
);

// ===== Drag handling for envelope editor =====
const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as SVGElement;
  const pointType = target.getAttribute("data-point");
  if (pointType) {
    isDragging.value = true;
    dragPoint.value = pointType;
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
  dragPoint.value = null;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !dragPoint.value || !svg.value) return;

  const rect = svg.value.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * svgWidth.value;
  const y = ((e.clientY - rect.top) / rect.height) * svgHeight.value;

  const normalizedX = Math.max(0, Math.min(1, x / svgWidth.value));
  const normalizedY = Math.max(0, Math.min(1, 1 - y / svgHeight.value));

  if (dragPoint.value === "attack") {
    envelope.value.attack = Math.max(0.01, normalizedX * 2);
  } else if (dragPoint.value === "hold") {
    envelope.value.hold = Math.max(0.01, normalizedX * 2);
  } else if (dragPoint.value === "decay") {
    envelope.value.decay = Math.max(0.01, normalizedX * 2);
  } else if (dragPoint.value === "sustain") {
    envelope.value.sustain = normalizedY;
    // sustain X movement stretches/shrinks decay length
    const sustainNormalizedX = normalizedX * 2;
    envelope.value.decay = Math.max(
      0.01,
      sustainNormalizedX - envelope.value.attack - envelope.value.hold
    );
  }
};

// ===== Piano controls =====
const noteOn = async (note: string) => {
  await Tone.start();
  activeNotes.value.add(note);
  synth?.triggerAttack(note);
};

const noteOff = (note: string) => {
  activeNotes.value.delete(note);
  synth?.triggerRelease(note);
};

// ===== Knob rotation =====
const getKnobRotation = (value: number, min: number, max: number) => {
  const percentage = (value - min) / (max - min);
  return percentage * 270 - 135;
};

// ===== Cleanup =====
onBeforeUnmount(() => {
  synth?.dispose();
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});
</script>

<template>
  <div
    class="p-6 bg-gray-900 text-white rounded-lg w-full max-w-2xl mx-auto select-none"
  >
    <h2 class="mb-6 text-2xl font-bold text-center"></h2>

    <!-- Oscillator Selector -->
    <div class="mb-6">
      <label class="block mb-3 text-sm font-medium">Oscillator Type</label>
      <div class="grid grid-cols-4 gap-3">
        <button
          v-for="wave in waveTypes"
          :key="wave.type"
          @click="oscillatorType = wave.type"
          :class="[
            'p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105',
            oscillatorType === wave.type
              ? 'border-green-500 bg-green-500/20'
              : 'border-gray-600 bg-gray-800 hover:border-gray-500',
          ]"
        >
          <svg viewBox="0 0 100 50" class="p-1 w-full h-3/4">
            <path
              :d="wave.path"
              fill="none"
              :stroke="oscillatorType === wave.type ? '#10b981' : '#9ca3af'"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="text-xs">{{ wave.name }}</span>
        </button>
      </div>
    </div>

    <!-- Envelope Editor -->
    <div class="mb-6">
      <label class="block mb-2 text-sm font-medium">Envelope</label>
      <div class="w-full max-w-2xl mx-auto" style="aspect-ratio: 4/3">
        <svg
          ref="svg"
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          class="w-full h-full border border-gray-600 rounded cursor-crosshair bg-gray-900"
          @mousedown="handleMouseDown"
        >
          <path
            :d="envelopePath"
            fill="none"
            stroke="#00ff88"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <circle
            :cx="attackPoint.x"
            :cy="attackPoint.y"
            r="3"
            fill="#00ff88"
            stroke="#fff"
            stroke-width="1"
            data-point="attack"
          />
          <circle
            :cx="holdPoint.x"
            :cy="holdPoint.y"
            r="3"
            fill="#00ff88"
            stroke="#fff"
            stroke-width="1"
            data-point="hold"
          />

          <circle
            :cx="decayPoint.x"
            :cy="decayPoint.y"
            r="3"
            fill="#00ff88"
            stroke="#fff"
            stroke-width="1"
            data-point="decay"
          />
          <circle
            :cx="sustainPoint.x"
            :cy="sustainPoint.y"
            r="3"
            fill="#00ff88"
            stroke="#fff"
            stroke-width="1"
            data-point="sustain"
          />
        </svg>
      </div>
    </div>

    <!-- Knobs -->
    <div class="mb-6 grid grid-cols-5 gap-4">
      <div
        v-for="param in ['attack', 'hold', 'decay', 'sustain', 'release']"
        :key="param"
        class="text-center"
      >
        <label class="block text-xs mb-2 font-medium capitalize">{{
          param
        }}</label>
        <div class="relative mx-auto w-8 h-8">
          <svg viewBox="0 0 100 100" class="w-full h-full">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="#374151"
              stroke="#6b7280"
              stroke-width="8"
            />
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="15"
              stroke="#10b981"
              stroke-width="8"
              stroke-linecap="round"
              :transform="`rotate(${getKnobRotation(
                envelope[param],
                param === 'sustain' ? 0 : 0.01,
                param === 'attack' || param === 'decay'
                  ? 2
                  : param === 'release'
                  ? 3
                  : 1
              )} 50 50)`"
            />
            <circle cx="50" cy="50" r="10" fill="#6b7280" />
          </svg>
          <input
            v-model.number="envelope[param]"
            type="range"
            :min="param === 'sustain' ? 0 : 0.01"
            :max="
              param === 'attack' || param === 'decay'
                ? 2
                : param === 'release'
                ? 3
                : 1
            "
            step="0.01"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span class="text-xs text-gray-400">
          {{ envelope[param].toFixed(2) }}{{ param === "sustain" ? "" : "s" }}
        </span>
      </div>
    </div>

    <!-- Piano -->
    <Keyboard
      :synth="synth"
      :activeNotes="activeNotes"
      :octaves="2"
      :startOctave="4"
      @noteOn="noteOn"
      @noteOff="noteOff"
    />
  </div>
</template>
