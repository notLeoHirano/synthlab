<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted } from "vue";
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
const visualizerFilter = ref<Tone.Filter | null>(null);
const fftSize = 2048;
const frequencyResponse = ref<Float32Array>(new Float32Array(fftSize / 2));
const svgElement = ref<SVGElement | null>(null);

const svgWidth = 280;
const svgHeight = 150;
const isDragging = ref(false);

// Store mouse event handlers as refs so we can properly remove them
const mouseMoveHandler = ref<((e: MouseEvent) => void) | null>(null);
const mouseUpHandler = ref<(() => void) | null>(null);
const filterPathD = computed(() => {
  const f = props.modelValue.freq;
  const Q = props.modelValue.Q;

  const xStart = 0;
  const xCutoff = freqToX(f);
  const xAfter = freqToX(f * 4);
  const xEnd = svgWidth;

  const yStart = svgHeight * 0.5;
  const bumpHeight = Math.max(0.2, 1 - Q / 30);
  const yCutoff = svgHeight * bumpHeight;
  const yAfter = svgHeight;
  const yEnd = svgHeight;

  // Exponent for pre-cutoff rise
  const preK = 4;

  // Points for pre-cutoff curve
  const xBefore = freqToX(f * 0.5);
  const yBefore = yStart - (yStart - yCutoff) * Math.pow(0.5, preK); // halfway to cutoff

  // Sine-in fall after cutoff
  const cp1x = xCutoff + (xAfter - xCutoff) * 0.2;
  const cp1y = yCutoff;
  const cp2x = xCutoff + (xAfter - xCutoff) * 0.8;
  const cp2y = yAfter;

  return `
    M ${0} ${yStart}
    C ${freqToX(f * 0.25)} ${yStart}, ${freqToX(
    f * 0.25
  )} ${yBefore}, ${xBefore} ${yBefore}
    C ${xBefore + (xCutoff - xBefore) / 2} ${yBefore}, ${
    xCutoff - (xCutoff - xBefore) / 2
  } ${yCutoff}, ${xCutoff} ${yCutoff}
    C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xAfter} ${yAfter}
    L ${xEnd} ${yEnd}
  `;
});

const updateResponse = () => {
  if (!visualizerFilter.value) return;

  try {
    visualizerFilter.value.set({
      type: props.modelValue.type,
      frequency: props.modelValue.freq,
      Q: props.modelValue.Q,
    });
    frequencyResponse.value =
      visualizerFilter.value.getFrequencyResponse(fftSize);
  } catch (error) {
    console.error("Error updating filter response:", error);
  }
};

// Watch for changes and update response
watch(() => props.modelValue, updateResponse, { deep: true, immediate: false });

// --- Filter Math Functions ---

// Convert frequency (logarithmic) to X coordinate (linear)
const freqToX = (freq: number) => {
  const minFreq = 20;
  const maxFreq = 20000;
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  const logFreq = Math.log10(Math.max(minFreq, Math.min(maxFreq, freq)));
  return ((logFreq - logMin) / (logMax - logMin)) * svgWidth;
};

// Convert X coordinate (linear) to frequency (logarithmic)
const xToFreq = (x: number) => {
  const minFreq = 20;
  const maxFreq = 20000;
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  const logRange = logMax - logMin;
  const freq = Math.pow(10, (x / svgWidth) * logRange + logMin);
  return Math.max(minFreq, Math.min(maxFreq, freq));
};

const controlPoint = computed(() => {
  if (!visualizerFilter.value || !frequencyResponse.value) {
    return { cx: freqToX(props.modelValue.freq), cy: svgHeight / 2 };
  }

  try {
    const response = visualizerFilter.value.getFrequencyResponse(
      props.modelValue.freq
    );
    const gain = response[0] || 0;
    const db = gain > 0 ? Tone.gainToDb(gain) : -40;

    return {
      cx: freqToX(props.modelValue.freq),
      cy: Math.max(
        0,
        Math.min(svgHeight, svgHeight - ((db + 40) / 80) * svgHeight)
      ),
    };
  } catch (error) {
    console.error("Error computing control point:", error);
    return { cx: freqToX(props.modelValue.freq), cy: svgHeight / 2 };
  }
});

// --- UI Interaction Handlers ---

const handleMouseDown = (e: MouseEvent) => {
  if (!props.modelValue.enabled) return;

  isDragging.value = true;

  // Create handlers and store them
  mouseMoveHandler.value = (event: MouseEvent) => handleMouseMove(event);
  mouseUpHandler.value = () => handleMouseUp();

  // Add event listeners
  window.addEventListener("mousemove", mouseMoveHandler.value);
  window.addEventListener("mouseup", mouseUpHandler.value);

  // Handle initial click
  handleMouseMove(e);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !svgElement.value) return;

  const rect = svgElement.value.getBoundingClientRect();
  const x = Math.max(0, Math.min(svgWidth, e.clientX - rect.left));
  const y = Math.max(0, Math.min(svgHeight, e.clientY - rect.top));

  const newFreq = Math.round(xToFreq(x));
  // Map Y position to Q. Inverted, so dragging up increases Q.
  const newQ = Math.max(0, Math.min(30, ((svgHeight - y) / svgHeight) * 30));

  // Emit the update without mutating props
  emit("update:modelValue", {
    ...props.modelValue,
    freq: newFreq,
    Q: newQ,
  });
};

const handleMouseUp = () => {
  isDragging.value = false;

  // Remove event listeners using the stored handlers
  if (mouseMoveHandler.value) {
    window.removeEventListener("mousemove", mouseMoveHandler.value);
    mouseMoveHandler.value = null;
  }
  if (mouseUpHandler.value) {
    window.removeEventListener("mouseup", mouseUpHandler.value);
    mouseUpHandler.value = null;
  }
};

// --- Model Value Emitters ---

const onValueChange = (field: keyof FilterProps, value: any) => {
  // Always emit a new object, never mutate props
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
};

const handleTypeChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  onValueChange("type", target.value as BiquadFilterType);
};

// --- Lifecycle Hooks ---

onMounted(async () => {
  try {
    // Ensure Tone is started before creating filter
    if (Tone.getContext().state !== "running") {
      await Tone.start();
    }

    // Create the visualizer filter
    visualizerFilter.value = new Tone.Filter({
      type: props.modelValue.type,
      frequency: props.modelValue.freq,
      Q: props.modelValue.Q,
    });

    // Initial response update after a short delay to ensure everything is initialized
    setTimeout(() => {
      updateResponse();
    }, 10);
  } catch (error) {
    console.error("Error initializing filter:", error);
  }
});

onBeforeUnmount(() => {
  // Clean up event listeners
  if (mouseMoveHandler.value) {
    window.removeEventListener("mousemove", mouseMoveHandler.value);
  }
  if (mouseUpHandler.value) {
    window.removeEventListener("mouseup", mouseUpHandler.value);
  }

  // Dispose of Tone.js resources
  if (visualizerFilter.value) {
    try {
      visualizerFilter.value.dispose();
    } catch (error) {
      console.error("Error disposing filter:", error);
    }
    visualizerFilter.value = null;
  }
});
</script>

<template>
  <div class="bg-gray-800 p-4 rounded-lg flex flex-col space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold uppercase tracking-wider text-gray-400">
        Filter
      </h3>
    </div>
    <div
      :class="!modelValue.enabled ? 'opacity-50 pointer-events-none' : ''"
      class="transition-opacity"
    >
      <svg
        ref="svgElement"
        :width="svgWidth"
        :height="svgHeight"
        class="bg-gray-900 rounded-md cursor-crosshair"
        @mousedown.prevent="handleMouseDown"
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

        <!-- Filter response curve -->
        <path
          :d="filterPathD"
          stroke="#10b981"
          stroke-width="2"
          fill="rgba(16, 185, 129, 0.2)"
        />

        <!-- Control point -->
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

      <!-- Controls -->
      <div class="flex justify-around items-center mt-3">
        <select
          :value="modelValue.type"
          @change="handleTypeChange"
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
          :min="0"
          :max="30"
          :step="0.1"
          label="Reso"
          unit=""
        />
      </div>
    </div>
  </div>
</template>
