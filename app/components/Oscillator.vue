<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, defineExpose } from "vue";
import * as Tone from "tone";
import EffectControl from "./EffectControl.vue";
import EnvelopeControl from "./EnvelopeControls.vue";
import ModulationControl from "./ModulationControl.vue";

const props = defineProps<{ activeNotes?: Set<string> }>();

// state
const oscillatorType = ref("sine");
const envelope = ref({
  attack: 0.1,
  hold: 0.1,
  decay: 0.1,
  sustain: 0.7,
  release: 0.5,
});

// Gain & Panning
const gainValue = ref(0.8);
const panValue = ref(0);
let gainNode: Tone.Gain | null = null;
let panner: Tone.Panner | null = null;

// Metering
const normalized = ref(0);
let meter: Tone.Meter | null = null;

// Reactive objects for each effect group
const filterProps = ref({
  enabled: false,
  type: "lowpass" as BiquadFilterType,
  freq: 2000,
  Q: 0,
});
const distortionProps = ref({ enabled: false, amount: 0.4 });
const bitCrusherProps = ref({ enabled: false, bits: 8 });
const delayProps = ref({ enabled: false, time: 0.25, feedback: 0.3, wet: 0.3 });
const reverbProps = ref({ enabled: false, wet: 0.3, roomSize: 0.7 });
const compressorProps = ref({ enabled: false, threshold: -20, ratio: 4 });

// Modulation states
const chorusProps = ref({ enabled: false, freq: 1, depth: 0.5, wet: 0.5 });
const phaserProps = ref({ enabled: false, freq: 1, depth: 5, wet: 0.5 }); // Phaser depth is mapped to octaves

// UI state
const activeTab = ref<"oscillator" | "effects" | "modulation">("oscillator");

let synth: Tone.PolySynth | null = null;
let filter: Tone.Filter | null = null;
let distortion: Tone.Distortion | null = null;
let bitCrusher: Tone.BitCrusher | null = null;
let delay: Tone.FeedbackDelay | null = null;
let chorus: Tone.Chorus | null = null;
let phaser: Tone.Phaser | null = null;
let reverb: Tone.Reverb | null = null;
let compressor: Tone.Compressor | null = null;

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

const createAudioNodes = () => {
  // Create synth and final output nodes
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: oscillatorType.value },
    envelope: { ...envelope.value },
  });
  panner = new Tone.Panner(panValue.value);
  gainNode = new Tone.Gain(gainValue.value);
  meter = new Tone.Meter({ smoothing: 0.8 });

  // Create all possible effect nodes
  filter = new Tone.Filter(filterProps.value.freq, filterProps.value.type);
  distortion = new Tone.Distortion(distortionProps.value.amount);
  bitCrusher = new Tone.BitCrusher(bitCrusherProps.value.bits);
  delay = new Tone.FeedbackDelay(
    delayProps.value.time,
    delayProps.value.feedback
  );
  chorus = new Tone.Chorus(
    chorusProps.value.freq,
    chorusProps.value.depth,
    0.5
  );
  phaser = new Tone.Phaser({
    frequency: phaserProps.value.freq,
    octaves: phaserProps.value.depth,
    baseFrequency: 1000,
  });
  reverb = new Tone.Reverb(reverbProps.value.roomSize);
  compressor = new Tone.Compressor(
    compressorProps.value.threshold,
    compressorProps.value.ratio
  );

  // Set initial wet values
  if (delay) delay.wet.value = delayProps.value.wet;
  if (chorus) chorus.wet.value = chorusProps.value.wet;
  if (phaser) phaser.wet.value = phaserProps.value.wet;
  if (reverb) reverb.wet.value = reverbProps.value.wet;
};

const updateAudioChain = () => {
  if (!synth || !panner || !gainNode) return;

  // Disconnect everything first
  synth.disconnect();
  [filter, distortion, bitCrusher, delay, chorus, phaser, reverb, compressor]
    .filter(Boolean)
    .forEach((node) => node?.disconnect());

  panner.disconnect();
  gainNode.disconnect();

  // Build the active effects chain
  const activeEffects = [];
  if (filterProps.value.enabled && filter) activeEffects.push(filter);
  if (distortionProps.value.enabled && distortion)
    activeEffects.push(distortion);
  if (bitCrusherProps.value.enabled && bitCrusher)
    activeEffects.push(bitCrusher);
  if (delayProps.value.enabled && delay) activeEffects.push(delay);
  if (chorusProps.value.enabled && chorus) activeEffects.push(chorus);
  if (phaserProps.value.enabled && phaser) activeEffects.push(phaser);
  if (reverbProps.value.enabled && reverb) activeEffects.push(reverb);
  if (compressorProps.value.enabled && compressor)
    activeEffects.push(compressor);

  // Connect the chain
  const chain = [synth, ...activeEffects, panner, gainNode];
  Tone.connectSeries(...chain);

  // Connect to meter and destination
  gainNode.connect(meter!);
  gainNode.toDestination();
};

//  Lifecycle
onMounted(() => {
  createAudioNodes();
  updateAudioChain();

  setInterval(() => {
    const val = meter?.getValue() as number;
    normalized.value = val === -Infinity ? 0 : Tone.dbToGain(val);
  }, 50);
});

onBeforeUnmount(() => {
  [
    synth,
    filter,
    distortion,
    bitCrusher,
    delay,
    chorus,
    phaser,
    reverb,
    compressor,
    panner,
    gainNode,
    meter,
  ].forEach((node) => node?.dispose());
});

// Watch for any effect being enabled/disabled - only update chain, don't recreate nodes
watch(
  () => [
    filterProps.value.enabled,
    distortionProps.value.enabled,
    bitCrusherProps.value.enabled,
    delayProps.value.enabled,
    chorusProps.value.enabled,
    phaserProps.value.enabled,
    reverbProps.value.enabled,
    compressorProps.value.enabled,
  ],
  () => updateAudioChain()
);

// Watch for oscillator envelope, gain, pan changes
watch(oscillatorType, (newVal) => synth?.set({ oscillator: { type: newVal } }));
watch(envelope, (newEnv) => synth?.set({ envelope: { ...newEnv } }), {
  deep: true,
});
watch(gainValue, (val) => gainNode && (gainNode.gain.value = val));
watch(panValue, (val) => panner && (panner.pan.value = val));

// Consolidated watchers for effect parameters
watch(
  filterProps,
  (val) => {
    if (filter) {
      filter.frequency.value = val.freq;
      filter.Q.value = val.Q;
      filter.type = val.type;
    }
  },
  { deep: true }
);

watch(
  distortionProps,
  (val) => {
    if (distortion) distortion.distortion = val.amount;
  },
  { deep: true }
);
watch(
  bitCrusherProps,
  (val) => {
    if (bitCrusher) bitCrusher.bits.value = val.bits;
  },
  { deep: true }
);

watch(
  delayProps,
  (val) => {
    if (delay) {
      delay.delayTime.value = val.time;
      delay.feedback.value = val.feedback;
      delay.wet.value = val.wet;
    }
  },
  { deep: true }
);

watch(
  reverbProps,
  (val) => {
    if (reverb) {
      reverb.decay = val.roomSize;
      reverb.wet.value = val.wet;
    }
  },
  { deep: true }
);

watch(
  compressorProps,
  (val) => {
    if (compressor) {
      compressor.threshold.value = val.threshold;
      compressor.ratio.value = val.ratio;
    }
  },
  { deep: true }
);

watch(
  chorusProps,
  (val) => {
    if (chorus) {
      chorus.frequency.value = val.freq;
      chorus.depth = val.depth;
      chorus.wet.value = val.wet;
    }
  },
  { deep: true }
);

watch(
  phaserProps,
  (val) => {
    if (phaser) {
      phaser.frequency.value = val.freq;
      phaser.octaves = val.depth;
      phaser.wet.value = val.wet;
    }
  },
  { deep: true }
);

// note control
const noteOn = async (note: string) => {
  await Tone.start();
  synth?.triggerAttack(note);
};
const noteOff = (note: string) => synth?.triggerRelease(note);

defineExpose({ noteOn, noteOff });
</script>

<template>
  <div
    class="bg-gray-900 text-white rounded-lg w-full mx-auto select-none overflow-auto scrollbar-hide"
    style="min-width: 300px"
  >
    <div
      class="flex flex-col sm:flex-row sticky top-0 z-20 bg-gray-900 sm:space-x-2 mb-6 border-b border-gray-700"
    >
      <div class="flex mb-4 sm:mb-0">
        <button
          v-for="tab in ['oscillator', 'effects', 'modulation']"
          :key="tab"
          @click="activeTab = tab"
          :class="[
            activeTab === tab
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
              : 'bg-gray-800 text-gray-400 border-transparent hover:text-white',
            'px-2 py-1 text-sm rounded-t-lg border-b-2 capitalize transition-all flex-shrink-0',
          ]"
        >
          {{ tab }}
        </button>
      </div>

      <div class="sm:ml-auto flex w-full sm:w-auto justify-end">
        <div
          class="bg-gray-800 px-2 p-0 rounded-lg flex items-center space-x-4 w-full sm:w-auto"
        >
          <div class="flex items-center">
            <span class="text-xs text-gray-400 w-full text-right">
              {{ Tone.gainToDb(gainValue).toFixed(1) }} dB
            </span>
          </div>
          <div
            class="relative bg-gray-700 rounded overflow-hidden items-center w-24 h-4 flex-shrink-0"
          >
            <div
              class="absolute top-0 left-0 h-full transition-all duration-50 z-10"
              :class="
                normalized > 0.8
                  ? 'bg-red-500'
                  : normalized > 0.7
                  ? 'bg-yellow-500'
                  : 'bg-emerald-500'
              "
              :style="{ width: normalized * 100 + '%' }"
            ></div>
            <input
              v-model.number="gainValue"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="absolute w-full h-full top-0 left-0 cursor-pointer z-20 appearance-none bg-transparent accent-transparent"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-show="activeTab === 'oscillator'"
      class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
    >
      <div>
        <div class="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <button
            v-for="wave in waveTypes"
            :key="wave.type"
            @click="oscillatorType = wave.type"
            :class="[
              oscillatorType === wave.type
                ? 'border-emerald-500 bg-emerald-500/20'
                : 'border-gray-600 bg-gray-800 hover:border-gray-500',
              'p-3 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02]',
            ]"
          >
            <svg viewBox="0 0 100 50" class="p-1 w-full h-8 sm:h-12">
              <path
                :d="wave.path"
                fill="none"
                :stroke="oscillatorType === wave.type ? '#10b981' : '#9ca3af'"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span class="text-xs mt-1 block">{{ wave.name }}</span>
          </button>
        </div>

        <div>
          <div class="bg-gray-800 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-xs">L</span
              ><input
                v-model.number="panValue"
                type="range"
                min="-1"
                max="1"
                step="0.01"
                class="w-full m-2 accent-emerald-500"
              /><span class="text-xs">R</span>
            </div>
          </div>
        </div>
      </div>

      <div><EnvelopeControl :envelope="envelope" /></div>
    </div>

    <div v-show="activeTab === 'effects'">
      <EffectControl
        v-model:filter="filterProps"
        v-model:distortion="distortionProps"
        v-model:bitCrusher="bitCrusherProps"
        v-model:delay="delayProps"
        v-model:reverb="reverbProps"
        v-model:compressor="compressorProps"
      />
    </div>

    <div v-show="activeTab === 'modulation'">
      <ModulationControl
        v-model:chorus="chorusProps"
        v-model:phaser="phaserProps"
      />
    </div>
  </div>
</template>
