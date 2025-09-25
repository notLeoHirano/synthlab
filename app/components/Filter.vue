<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import * as Tone from "tone";
import Knob from "./Knob.vue";

type FilterProps = {
  enabled: boolean;
  type: BiquadFilterType;
  freq: number;
  Q: number;
};

const props = defineProps<{ modelValue: FilterProps }>();
const emit = defineEmits(["update:modelValue"]);

// Local Tone.js instance for calculating frequency response without affecting the main audio chain
const visualizerFilter = new Tone.Filter();
const fftSize = 2048;
const frequencyResponse = ref<Float32Array>(new Float32Array(fftSize / 2));

const svgWidth = 280;
const svgHeight = 150;
const isDragging = ref(false);

const updateResponse = () => {
  visualizerFilter.set({
    type: props.modelValue.type,
    frequency: props.modelValue.freq,
    Q: props.modelValue.Q,
  });
  frequencyResponse.value = visualizerFilter.getFrequencyResponse(fftSize);
};

watch(() => props.modelValue, updateResponse, { deep: true, immediate: true });

// Convert frequency (logarithmic) to X coordinate (linear)
const freqToX = (freq: number) => {
  const minFreq = 20;
  const maxFreq = 20000;
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  const logFreq = Math.log10(freq);
  return ((logFreq - logMin) / (logMax - logMin)) * svgWidth;
};

// Convert X coordinate (linear) to frequency (logarithmic)
const xToFreq = (x: number) => {
  const minFreq = 20;
  const maxFreq = 20000;
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  const logRange = logMax - logMin;
  return Math.pow(10, (x / svgWidth) * logRange + logMin);
};

const filterPathD = computed(() => {
  if (!frequencyResponse.value || frequencyResponse.value.length === 0)
    return "";
  const path = ["M 0", svgHeight / 2];
  for (let i = 0; i < frequencyResponse.value.length; i++) {
    const freq =
      (i / frequencyResponse.value.length) * (Tone.getContext().sampleRate / 2);
    if (freq > 20000) break;
    const x = freqToX(freq);
    const db = Tone.gainToDb(frequencyResponse.value[i] || 0);
    // Map dB range (-40 to 40) to svg height
    const y = svgHeight - ((db + 40) / 80) * svgHeight;
    path.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return path.join(" ");
});

const controlPoint = computed(() => ({
  cx: freqToX(props.modelValue.freq),
  cy:
    svgHeight -
    ((Tone.gainToDb(
      visualizerFilter.getFrequencyResponse(props.modelValue.freq)[0] || 0
    ) +
      40) /
      80) *
      svgHeight,
}));

const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true;
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
  handleMouseMove(e); // Handle initial click
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const svg = (e.currentTarget as SVGElement).closest("svg");
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const x = Math.max(0, Math.min(svgWidth, e.clientX - rect.left));
  const y = Math.max(0, Math.min(svgHeight, e.clientY - rect.top));

  const newFreq = Math.round(xToFreq(x));
  // Map Y position to Q. Inverted, so dragging up increases Q.
  const newQ = Math.max(0.1, ((svgHeight - y) / svgHeight) * 29.9 + 0.1);

  emit("update:modelValue", { ...props.modelValue, freq: newFreq, Q: newQ });
};

const handleMouseUp = () => {
  isDragging.value = false;
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
};

onBeforeUnmount(() => {
  visualizerFilter.dispose();
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
});

const onValueChange = (field: keyof FilterProps, value: any) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};
</script>

<template>
  <div class="bg-gray-800 p-4 rounded-lg flex flex-col space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold uppercase tracking-wider text-gray-400">
        Filter
      </h3>
      <input
        type="checkbox"
        :checked="modelValue.enabled"
        @change="
          onValueChange('enabled', ($event.target as HTMLInputElement).checked)
        "
        class="accent-emerald-500 w-5 h-5"
      />
    </div>
    <div
      :class="!modelValue.enabled ? 'opacity-50 pointer-events-none' : ''"
      class="transition-opacity"
    >
      <svg
        :width="svgWidth"
        :height="svgHeight"
        class="bg-gray-900 rounded-md cursor-crosshair"
        @mousedown="handleMouseDown"
      >
        <!-- Grid lines -->
        <line
          v-for="i in 7"
          :key="`v-${i}`"
          :x1="i * (svgWidth / 8)"
          :y1="0"
          :x2="i * (svgWidth / 8)"
          :y2="svgHeight"
          stroke="#374151"
          stroke-width="0.5"
        />
        <line
          v-for="i in 4"
          :key="`h-${i}`"
          :x1="0"
          :y1="i * (svgHeight / 5)"
          :x2="svgWidth"
          :y2="i * (svgHeight / 5)"
          stroke="#374151"
          stroke-width="0.5"
        />

        <path
          :d="filterPathD"
          stroke="#10b981"
          stroke-width="2"
          fill="rgba(16, 185, 129, 0.2)"
        />
        <circle
          :cx="controlPoint.cx"
          :cy="controlPoint.cy"
          r="6"
          fill="#10b981"
          class="cursor-pointer"
        />
        <circle
          :cx="controlPoint.cx"
          :cy="controlPoint.cy"
          r="10"
          fill="transparent"
          stroke="#10b981"
          stroke-width="2"
          stroke-dasharray="2 2"
        />
      </svg>
      <div class="flex justify-around items-center mt-3">
        <select
          :value="modelValue.type"
          @change="
            onValueChange('type', ($event.target as HTMLSelectElement).value)
          "
          class="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm mr-4"
        >
          <option value="lowpass">Low Pass</option>
          <option value="highpass">High Pass</option>
          <option value="bandpass">Band Pass</option>
          <option value="notch">Notch</option>
        </select>
        <Knob
          :modelValue="modelValue.freq"
          @update:modelValue="onValueChange('freq', $event)"
          :min="20"
          :max="20000"
          :step="1"
          label="Freq"
          unit="Hz"
        />
        <Knob
          :modelValue="modelValue.Q"
          @update:modelValue="onValueChange('Q', $event)"
          :min="0.1"
          :max="30"
          :step="0.1"
          label="Reso"
          unit=""
        />
      </div>
    </div>
  </div>
</template>
