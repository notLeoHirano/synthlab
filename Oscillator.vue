<script setup lang="ts">
import {
  ref,
  onMounted,
  watch,
  computed,
  onBeforeUnmount,
  defineExpose,
} from "vue";
import * as Tone from "tone";
import EnvelopeControls from "./EnvelopeControls.vue";

const props = defineProps<{ activeNotes?: Set<string> }>();

// ===== State =====
const oscillatorType = ref("sine");
const envelope = ref({
  attack: 0.1,
  hold: 0.1,
  decay: 0.1,
  sustain: 0.7,
  release: 0.5,
});

// Gain control
const gainValue = ref(0.8);
let gainNode: Tone.Gain | null = null;
const normalized = ref(0);

// Panning control
const panValue = ref(0); // -1 to 1 (left to right)
let panner: Tone.Panner | null = null;

// Filter controls
const filterEnabled = ref(false);
const filterType = ref<BiquadFilterType>("lowpass");
const filterFreq = ref(2000);
const filterQ = ref(1);
let filter: Tone.Filter | null = null;

// Distortion
const distortionEnabled = ref(false);
const distortionAmount = ref(0.4);
let distortion: Tone.Distortion | null = null;

// Reverb
const reverbEnabled = ref(false);
const reverbWet = ref(0.3);
const reverbRoomSize = ref(0.7);
let reverb: Tone.Reverb | null = null;

// Delay
const delayEnabled = ref(false);
const delayTime = ref(0.25);
const delayFeedback = ref(0.3);
const delayWet = ref(0.3);
let delay: Tone.FeedbackDelay | null = null;

// Chorus
const chorusEnabled = ref(false);
const chorusFreq = ref(4);
const chorusDepth = ref(0.5);
const chorusWet = ref(0.5);
let chorus: Tone.Chorus | null = null;

// Phaser
const phaserEnabled = ref(false);
const phaserFreq = ref(0.5);
const phaserDepth = ref(10);
const phaserWet = ref(0.5);
let phaser: Tone.Phaser | null = null;

// BitCrusher
const bitCrusherEnabled = ref(false);
const bitCrusherBits = ref(8);
const bitCrusherWet = ref(0.5);
let bitCrusher: Tone.BitCrusher | null = null;

// Compressor
const compressorEnabled = ref(false);
const compressorThreshold = ref(-20);
const compressorRatio = ref(4);
let compressor: Tone.Compressor | null = null;

// Metering
let meter: Tone.Meter | null = null;
const meterLevel = ref(0);

// ===== Envelope Editor state =====
const isDragging = ref(false);
const dragPoint = ref<string | null>(null);
const svg = ref<SVGElement | null>(null);
const svgWidth = ref(400);
const svgHeight = ref(300);

// UI state
const activeTab = ref<"oscillator" | "envelope" | "effects" | "modulation">(
  "oscillator"
);

let synth: Tone.PolySynth | null = null;

// ===== Envelope calculations =====
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

const filterTypes = ["lowpass", "highpass", "bandpass", "notch"] as const;

// ===== Initialize audio chain =====
const initializeAudioChain = () => {
  // Clean up existing nodes
  synth?.dispose();
  filter?.dispose();
  distortion?.dispose();
  bitCrusher?.dispose();
  delay?.dispose();
  chorus?.dispose();
  phaser?.dispose();
  reverb?.dispose();
  compressor?.dispose();
  panner?.dispose();
  gainNode?.dispose();
  meter?.dispose();

  // Create synth
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: oscillatorType.value },
    envelope: { ...envelope.value },
  });

  // Create effects chain
  filter = new Tone.Filter(filterFreq.value, filterType.value);
  distortion = new Tone.Distortion(distortionAmount.value);
  bitCrusher = new Tone.BitCrusher(bitCrusherBits.value);
  delay = new Tone.FeedbackDelay(delayTime.value, delayFeedback.value);
  chorus = new Tone.Chorus(chorusFreq.value, chorusDepth.value, 0.5);
  phaser = new Tone.Phaser({
    frequency: phaserFreq.value,
    baseFrequency: 1000,
  });
  reverb = new Tone.Reverb(reverbRoomSize.value);
  compressor = new Tone.Compressor(
    compressorThreshold.value,
    compressorRatio.value
  );
  panner = new Tone.Panner(panValue.value);
  gainNode = new Tone.Gain(gainValue.value);
  meter = new Tone.Meter({ smoothing: 0.8 });

  // Connect chain
  let currentNode: Tone.ToneAudioNode = synth;

  // Effects chain (order matters!)
  if (filterEnabled.value) {
    currentNode.connect(filter);
    currentNode = filter;
  }

  if (distortionEnabled.value) {
    currentNode.connect(distortion);
    currentNode = distortion;
  }

  if (bitCrusherEnabled.value) {
    currentNode.connect(bitCrusher);
    currentNode = bitCrusher;
  }

  if (delayEnabled.value) {
    delay.wet.value = delayWet.value;
    currentNode.connect(delay);
    currentNode = delay;
  }

  if (chorusEnabled.value) {
    chorus.wet.value = chorusWet.value;
    currentNode.connect(chorus);
    currentNode = chorus;
  }

  if (phaserEnabled.value) {
    phaser.wet.value = phaserWet.value;
    currentNode.connect(phaser);
    currentNode = phaser;
  }

  if (reverbEnabled.value) {
    reverb.wet.value = reverbWet.value;
    currentNode.connect(reverb);
    currentNode = reverb;
  }

  if (compressorEnabled.value) {
    currentNode.connect(compressor);
    currentNode = compressor;
  }

  // Final chain: panning -> gain -> meter -> destination
  currentNode.connect(panner);
  panner.connect(gainNode);
  gainNode.connect(meter);
  gainNode.toDestination();
};

// ===== Initialize =====
onMounted(() => {
  initializeAudioChain();

  if (svg.value) {
    const resizeObserver = new ResizeObserver(() => {
      svgWidth.value = svg.value!.clientWidth;
      svgHeight.value = svg.value!.clientHeight;
    });
    resizeObserver.observe(svg.value);
  }

  setInterval(() => {
    const val = meter?.getValue() as number;
    normalized.value = val === -Infinity ? 0 : Tone.dbToGain(val);
  }, 50);
});

// ===== Watchers for live updates =====
watch(oscillatorType, (newVal) => synth?.set({ oscillator: { type: newVal } }));
watch(envelope, (newEnv) => synth?.set({ envelope: { ...newEnv } }), {
  deep: true,
});
watch(gainValue, (val) => {
  if (gainNode) gainNode.gain.value = val;
});
watch(panValue, (val) => {
  if (panner) panner.pan.value = val;
});

// Filter watchers
watch(filterFreq, (val) => {
  if (filter) filter.frequency.value = val;
});
watch(filterQ, (val) => {
  if (filter) filter.Q.value = val;
});
watch(filterType, (val) => {
  if (filter) filter.type = val;
});

// Effect parameter watchers
watch(distortionAmount, (val) => {
  if (distortion) distortion.distortion = val;
});
watch(bitCrusherBits, (val) => {
  if (bitCrusher) bitCrusher.bits.value = val;
});
watch(delayTime, (val) => {
  if (delay) delay.delayTime.value = val;
});
watch(delayFeedback, (val) => {
  if (delay) delay.feedback.value = val;
});
watch(delayWet, (val) => {
  if (delay) delay.wet.value = val;
});
watch(chorusFreq, (val) => {
  if (chorus) chorus.frequency.value = val;
});
watch(chorusDepth, (val) => {
  if (chorus) chorus.depth = val;
});
watch(chorusWet, (val) => {
  if (chorus) chorus.wet.value = val;
});
watch(phaserFreq, (val) => {
  if (phaser) phaser.frequency.value = val;
});
watch(phaserWet, (val) => {
  if (phaser) phaser.wet.value = val;
});
watch(reverbWet, (val) => {
  if (reverb) reverb.wet.value = val;
});
watch(compressorThreshold, (val) => {
  if (compressor) compressor.threshold.value = val;
});
watch(compressorRatio, (val) => {
  if (compressor) compressor.ratio.value = val;
});

// Watch for effect enable/disable
watch(
  [
    filterEnabled,
    distortionEnabled,
    bitCrusherEnabled,
    delayEnabled,
    chorusEnabled,
    phaserEnabled,
    reverbEnabled,
    compressorEnabled,
  ],
  () => {
    initializeAudioChain();
  }
);

// ===== Drag handling =====
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
  console.log(svgWidth.value);
  const normalizedX = Math.max(0, Math.min(1, x / svgWidth.value));
  const normalizedY = Math.max(0, Math.min(1, 1 - y / svgHeight.value));

  if (dragPoint.value === "attack")
    envelope.value.attack = Math.max(0.01, normalizedX * 2);
  else if (dragPoint.value === "hold")
    envelope.value.hold = Math.max(0.01, normalizedX * 2);
  else if (dragPoint.value === "decay")
    envelope.value.decay = Math.max(0.01, normalizedX * 2);
  else if (dragPoint.value === "sustain") {
    envelope.value.sustain = normalizedY;
    const sustainNormalizedX = normalizedX * 2;
    envelope.value.decay = Math.max(
      0.01,
      sustainNormalizedX - envelope.value.attack - envelope.value.hold
    );
  }
};

// ===== Note control =====
const noteOn = async (note: string) => {
  await Tone.start();
  props.activeNotes?.add(note);
  synth?.triggerAttack(note);
};

const noteOff = (note: string) => {
  props.activeNotes?.delete(note);
  synth?.triggerRelease(note);
};

// ===== Knob rotation =====
const getKnobRotation = (value: number, min: number, max: number) =>
  ((value - min) / (max - min)) * 270 - 135;

// ===== Cleanup =====
onBeforeUnmount(() => {
  synth?.dispose();
  filter?.dispose();
  distortion?.dispose();
  bitCrusher?.dispose();
  delay?.dispose();
  chorus?.dispose();
  phaser?.dispose();
  reverb?.dispose();
  compressor?.dispose();
  panner?.dispose();
  gainNode?.dispose();
  meter?.dispose();
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});

defineExpose({ noteOn, noteOff });
</script>

<template>
  <div
    class="p-6 bg-gray-900 text-white rounded-lg w-full max-w-6xl mx-auto select-none"
  >
    <!-- Tab Navigation -->
    <div class="flex space-x-2 mb-6 border-b border-gray-700">
      <button
        v-for="tab in ['oscillator', 'envelope', 'effects', 'modulation']"
        :key="tab"
        @click="activeTab = tab"
        :class="[
          activeTab === tab
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
            : 'bg-gray-800 text-gray-400 border-transparent hover:text-white',
          'px-4 py-2 rounded-t-lg border-b-2 capitalize transition-all',
        ]"
      >
        {{ tab }}
      </button>
      <div class="ml-auto flex flex-col items-end">
        <div class="bg-gray-800 p-4 rounded-lg flex items-center space-x-4">
          <div class="flex items-center w-xl">
            <!-- dB value on the left -->
            <span class="text-sm text-gray-400 w-full text-right">
              {{ Tone.gainToDb(gainValue).toFixed(1) }} dB</span
            >
          </div>
          <div
            class="relative bg-gray-700 rounded overflow-hidden items-center"
          >
            <input
              v-model.number="gainValue"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="w-full h-full mt-1.25 inset-0 cursor-pointer z-20 appearance-none accent-transparent bg-transparent"
            />
            <div
              class="absolute bottom-0 h-full transition-all duration-50"
              :class="
                (normalized * 1000).toFixed(0) > 80
                  ? 'bg-red-500'
                  : (normalized * 1000).toFixed(0) > 70
                  ? 'bg-yellow-500'
                  : 'bg-emerald-500'
              "
              :style="{ width: (normalized * 1000).toFixed(0) + '%' }"
            ></div>
          </div>
          <!-- VU Meter -->
        </div>
      </div>
    </div>

    <!-- Oscillator Tab -->
    <div v-show="activeTab === 'oscillator'" class="grid grid-cols-3 gap-6">
      <!-- Wave Type Selector -->
      <div>
        <h3 class="text-sm font-medium mb-3 text-gray-400">Waveform</h3>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="wave in waveTypes"
            :key="wave.type"
            @click="oscillatorType = wave.type"
            :class="[
              oscillatorType === wave.type
                ? 'border-emerald-500 bg-emerald-500/20'
                : 'border-gray-600 bg-gray-800 hover:border-gray-500',
              'p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105',
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

      <!-- Pan Control -->
      <div>
        <h3 class="text-sm font-medium mb-3 text-gray-400">Stereo Pan</h3>
        <div class="bg-gray-800 p-4 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs">L</span>
            <span class="text-xs">C</span>
            <span class="text-xs">R</span>
          </div>
          <input
            v-model.number="panValue"
            type="range"
            min="-1"
            max="1"
            step="0.01"
            class="w-full accent-emerald-500"
          />
          <div class="text-center mt-2">
            <span class="text-sm">{{ (panValue * 100).toFixed(0) }}%</span>
            <span class="text-xs text-gray-500 ml-1">
              {{ panValue < 0 ? "L" : panValue > 0 ? "R" : "C" }}
            </span>
          </div>
        </div>
      </div>

      <!-- Master Volume -->
    </div>

    <!-- Envelope Tab -->
    <div v-show="activeTab === 'envelope'">
      <!-- Envelope Visualizer -->
      <EnvelopeControls :envelope="envelope" />
    </div>

    <!-- Effects Tab -->
    <div v-show="activeTab === 'effects'" class="grid grid-cols-3 gap-4">
      <!-- Filter -->
      <div class="bg-gray-800 p-4 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium">Filter</h3>
          <input
            type="checkbox"
            v-model="filterEnabled"
            class="accent-emerald-500"
          />
        </div>
        <div :class="!filterEnabled ? 'opacity-50 pointer-events-none' : ''">
          <select
            v-model="filterType"
            class="w-full mb-2 bg-gray-700 text-white rounded px-2 py-1 text-sm"
          >
            <option v-for="type in filterTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
          <label class="text-xs">Frequency</label>
          <input
            v-model.number="filterFreq"
            type="range"
            min="20"
            max="20000"
            step="1"
            class="w-full accent-emerald-500 mb-2"
          />
          <span class="text-xs text-gray-400">{{ filterFreq }} Hz</span>

          <label class="text-xs block mt-2">Resonance</label>
          <input
            v-model.number="filterQ"
            type="range"
            min="0.1"
            max="30"
            step="0.1"
            class="w-full accent-emerald-500"
          />
          <span class="text-xs text-gray-400">{{ filterQ.toFixed(1) }}</span>
        </div>
      </div>

      <!-- Distortion -->
      <div class="bg-gray-800 p-4 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium">Distortion</h3>
          <input
            type="checkbox"
            v-model="distortionEnabled"
            class="accent-emerald-500"
          />
        </div>
        <div
          :class="!distortionEnabled ? 'opacity-50 pointer-events-none' : ''"
        >
          <label class="text-xs">Amount</label>
          <input
            v-model.number="distortionAmount"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-full accent-emerald-500"
          />
          <span class="text-xs text-gray-400"
            >{{ (distortionAmount * 100).toFixed(0) }}%</span
          >
        </div>
      </div>

      <!-- BitCrusher -->
      <div class="bg-gray-800 p-4 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium">Bit Crusher</h3>
          <input
            type="checkbox"
            v-model="bitCrusherEnabled"
            class="accent-emerald-500"
          />
        </div>
        <div
          :class="!bitCrusherEnabled ? 'opacity-50 pointer-events-none' : ''"
        >
          <label class="text-xs">Bits</label>
          <input
            v-model.number="bitCrusherBits"
            type="range"
            min="1"
            max="16"
            step="1"
            class="w-full accent-emerald-500"
          />
          <span class="text-xs text-gray-400">{{ bitCrusherBits }} bits</span>
        </div>
      </div>

      <!-- Delay -->
      <div class="bg-gray-800 p-4 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium">Delay</h3>
          <input
            type="checkbox"
            v-model="delayEnabled"
            class="accent-emerald-500"
          />
        </div>
        <div :class="!delayEnabled ? 'opacity-50 pointer-events-none' : ''">
          <label class="text-xs">Time</label>
          <input
            v-model.number="delayTime"
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            class="w-full accent-emerald-500"
          />
          <span class="text-xs text-gray-400"
            >{{ (delayTime * 1000).toFixed(0) }} ms</span
          >

          <label class="text-xs block mt-2">Feedback</label>
          <input
            v-model.number="delayFeedback"
            type="range"
            min="0"
            max="0.95"
            step="0.01"
            class="w-full accent-emerald-500"
          />
          <span class="text-xs text-gray-400"
            >{{ (delayFeedback * 100).toFixed(0) }}%</span
          >

          <label class="text-xs block mt-2">Mix</label>
          <input
            v-model.number="delayWet"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-full accent-emerald-500"
          />
          <span class="text-xs text-gray-400"
            >{{ (delayWet * 100).toFixed(0) }}%</span
          >
        </div>
      </div>

      <!-- Reverb -->
      <div class="bg-gray-800 p-4 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium">Reverb</h3>
          <input
            type="checkbox"
            v-model="reverbEnabled"
            class="accent-emerald-500"
          />
        </div>
        <div :class="!reverbEnabled ? 'opacity-50 pointer-events-none' : ''">
          <label class="text-xs">Room Size</label>
          <input
            v-model.number="reverbRoomSize"
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            class="w-full accent-emerald-500"
          />
          <span class="text-xs text-gray-400"
            >{{ reverbRoomSize.toFixed(1) }}s</span
          >

          <label class="text-xs block mt-2">Mix</label>
          <input
            v-model.number="reverbWet"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-full accent-emerald-500"
          />
          <span class="text-xs text-gray-400"
            >{{ (reverbWet * 100).toFixed(0) }}%</span
          >
        </div>
      </div>

      <!-- Compressor -->
      <div class="bg-gray-800 p-4 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium">Compressor</h3>
          <input
            type="checkbox"
            v-model="compressorEnabled"
            class="accent-emerald-500"
          />
        </div>
        <div
          :class="!compressorEnabled ? 'opacity-50 pointer-events-none' : ''"
        >
          <label class="text-xs">Threshold</label>
          <input
            v-model.number="compressorThreshold"
            type="range"
            min="-60"
            max="0"
            step="1"
            class="w-full accent-emerald-500"
          />
          <span class="text-xs text-gray-400"
            >{{ compressorThreshold }} dB</span
          >

          <label class="text-xs block mt-2">Ratio</label>
          <input
            v-model.number="compressorRatio"
            type="range"
            min="1"
            max="20"
            step="0.5"
            class="w-full accent-emerald-500"
          />
          <span class="text-xs text-gray-400">{{ compressorRatio }}:1</span>
        </div>
      </div>
    </div>

    <!-- Modulation Tab -->
    <div v-show="activeTab === 'modulation'" class="grid grid-cols-2 gap-4">
      <ModulationControl />
    </div>
  </div>
</template>
