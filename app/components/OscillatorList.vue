<script setup lang="ts">
import {
  ref,
  computed,
  defineProps,
  defineEmits,
  onMounted,
  defineExpose,
  onBeforeUnmount,
  watch,
} from "vue";
import * as Tone from "tone";

interface OscillatorConfig {
  id: number;
  waveform: OscillatorType;
  envelope: {
    attack: number;
    hold: number;
    decay: number;
    sustain: number;
    release: number;
  };
  volume: number;
}

const props = defineProps<{ oscillator: OscillatorConfig }>();
const emit = defineEmits<{ (e: "update", osc: OscillatorConfig): void }>();

// === Local reactive state ===
const envelope = ref({
  attack: props.oscillator.envelope.attack ?? 0.01,
  hold: props.oscillator.envelope.hold ?? 0.1,
  decay: props.oscillator.envelope.decay ?? 0.1,
  sustain: props.oscillator.envelope.sustain ?? 0.8,
  release: props.oscillator.envelope.release ?? 1,
});
const oscillatorType = ref(props.oscillator.waveform);
const volume = ref(props.oscillator.volume);

watch(
  [oscillatorType, envelope, volume],
  () => {
    emit("update", {
      ...props.oscillator,
      waveform: oscillatorType.value,
      envelope: { ...envelope.value },
      volume: volume.value,
    });
  },
  { deep: true }
);

const activeNotes = new Set<string>();

const startSynth = async () => {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscillatorType.value },
      envelope: { ...envelope.value },
    }).toDestination();
  }
  if (Tone.context.state !== "running") await Tone.start();
};

const triggerNote = async (note: string) => {
  await startSynth();
  if (!synth || !enabled) return;
  synth.triggerAttack(note);
  activeNotes.add(note); // track which notes are pressed
};

const releaseNote = (note: string) => {
  if (!synth || !enabled) return;
  if (activeNotes.has(note)) {
    synth.triggerRelease(note);
    activeNotes.delete(note);
  }
};
// === SVG Envelope Editor ===
const svg = ref<SVGElement | null>(null);
const svgWidth = ref(400);
const svgHeight = ref(200);
const isDragging = ref(false);
const dragPoint = ref<string | null>(null);

const totalTime = computed(
  () =>
    envelope.value.attack +
    envelope.value.hold +
    envelope.value.decay +
    1 +
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
  }
};
const handleMouseUp = () => {
  isDragging.value = false;
  dragPoint.value = null;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
};

// === Knob Rotation ===
const getKnobRotation = (value: number, min: number, max: number) => {
  const percentage = (value - min) / (max - min);
  return percentage * 270 - 135;
};

// === Waveform Icons ===
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

let synth: Tone.PolySynth | null = null;
let enabled = true;

onMounted(() => {
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: oscillatorType.value },
    envelope: { ...envelope.value },
  }).toDestination();
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});
</script>

<template>
  <div class="p-4 border rounded bg-gray-800 space-y-4">
    <h3 class="font-semibold">Oscillator {{ props.oscillator.id }}</h3>
    <button
      @click="enabled = !enabled"
      :class="
        enabled ? 'bg-green-500 px-2 rounded' : 'bg-gray-500 px-2 rounded'
      "
    >
      {{ enabled ? "On" : "Off" }}
    </button>
    <!-- Waveform Selector -->
    <div>
      <label class="block mb-2 text-sm">Waveform</label>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="wave in waveTypes"
          :key="wave.type"
          @click="oscillatorType = wave.type"
          :class="[
            'p-2 rounded-lg border-2',
            oscillatorType === wave.type
              ? 'border-green-500 bg-green-500/20'
              : 'border-gray-600 bg-gray-800 hover:border-gray-500',
          ]"
        >
          <svg viewBox="0 0 100 50" class="w-full h-12">
            <path
              :d="wave.path"
              fill="none"
              :stroke="oscillatorType === wave.type ? '#10b981' : '#9ca3af'"
              stroke-width="2"
            />
          </svg>
          <span class="text-xs">{{ wave.name }}</span>
        </button>
      </div>
    </div>

    <!-- Envelope Editor -->
    <div>
      <label class="block mb-2 text-sm">Envelope</label>
      <svg
        ref="svg"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="w-full h-40 border border-gray-600 rounded bg-gray-900 cursor-crosshair"
        @mousedown="handleMouseDown"
      >
        <path :d="envelopePath" fill="none" stroke="#00ff88" stroke-width="2" />
        <circle
          :cx="attackPoint.x"
          :cy="attackPoint.y"
          r="4"
          fill="#00ff88"
          stroke="#fff"
          data-point="attack"
        />
        <circle
          :cx="holdPoint.x"
          :cy="holdPoint.y"
          r="4"
          fill="#00ff88"
          stroke="#fff"
          data-point="hold"
        />
        <circle
          :cx="decayPoint.x"
          :cy="decayPoint.y"
          r="4"
          fill="#00ff88"
          stroke="#fff"
          data-point="decay"
        />
        <circle
          :cx="sustainPoint.x"
          :cy="sustainPoint.y"
          r="4"
          fill="#00ff88"
          stroke="#fff"
          data-point="sustain"
        />
      </svg>
    </div>

    <!-- Envelope Knobs -->
    <div class="grid grid-cols-5 gap-3">
      <div
        v-for="param in ['attack', 'hold', 'decay', 'sustain', 'release']"
        :key="param"
        class="text-center"
      >
        <label class="text-xs block mb-1 capitalize">{{ param }}</label>
        <div class="relative mx-auto w-10 h-10">
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
              stroke-width="6"
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

    <!-- Volume -->
    <div>
      <label class="block mb-1 text-sm">Volume</label>
      <input
        type="range"
        min="-30"
        max="0"
        step="1"
        v-model.number="volume"
        class="w-full"
      />
    </div>
  </div>
</template>
