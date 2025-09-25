<script setup lang="ts">
import { ref, computed, watch, defineProps } from "vue";
import Slider from "./Slider.vue";

const props = defineProps<{
  envelope: {
    attack: number;
    hold: number;
    decay: number;
    sustain: number;
    release: number;
  };
}>();

const svgWidth = 400;
const svgHeight = 300;

const totalTime = computed(
  () =>
    props.envelope.attack +
    props.envelope.hold +
    props.envelope.decay +
    1 +
    props.envelope.release
);

const attackPoint = computed(() => ({
  x: (props.envelope.attack / totalTime.value) * svgWidth,
  y: 0,
}));
const holdPoint = computed(() => ({
  x:
    ((props.envelope.attack + props.envelope.hold) / totalTime.value) *
    svgWidth,
  y: 0,
}));
const decayPoint = computed(() => ({
  x:
    ((props.envelope.attack + props.envelope.hold + props.envelope.decay) /
      totalTime.value) *
    svgWidth,
  y: svgHeight - props.envelope.sustain * svgHeight,
}));
const sustainPoint = computed(() => ({
  x:
    ((props.envelope.attack + props.envelope.hold + props.envelope.decay + 1) /
      totalTime.value) *
    svgWidth,
  y: svgHeight - props.envelope.sustain * svgHeight,
}));

const envelopePath = computed(
  () =>
    `M 0 ${svgHeight} L ${attackPoint.value.x} ${attackPoint.value.y} L ${
      holdPoint.value.x
    } ${holdPoint.value.y} 
     C ${(holdPoint.value.x + decayPoint.value.x) / 2} ${holdPoint.value.y}, ${
      (holdPoint.value.x + decayPoint.value.x) / 2
    } ${decayPoint.value.y}, ${decayPoint.value.x} ${decayPoint.value.y}
     L ${sustainPoint.value.x} ${
      sustainPoint.value.y
    } L ${svgWidth} ${svgHeight}`
);

const draggingPoint = ref<string | null>(null);

const handleMouseDown = (event: MouseEvent) => {
  const target = (event.target as SVGCircleElement).dataset.point;
  if (target) draggingPoint.value = target;
};

const handleMouseMove = (event: MouseEvent) => {
  if (!draggingPoint.value) return;
  const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
  const y = event.clientY - rect.top;
  const value = 1 - Math.max(0, Math.min(y / svgHeight, 1));

  if (draggingPoint.value === "sustain") props.envelope.sustain = value;
};

const handleMouseUp = () => {
  draggingPoint.value = null;
};
</script>

<template>
  <div class="gap-6">
    <!-- Envelope Visualizer -->
    <div>
      <div class="bg-gray-800 p-4 rounded-lg">
        <svg
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          class="w-full border border-gray-600 rounded cursor-crosshair bg-gray-900"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        >
          <path
            :d="envelopePath"
            fill="url(#envelopeGradient)"
            fill-opacity="0.3"
            stroke="#00ff88"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <defs>
            <linearGradient
              id="envelopeGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style="stop-color: #00ff88; stop-opacity: 0.5"
              />
              <stop
                offset="100%"
                style="stop-color: #00ff88; stop-opacity: 0"
              />
            </linearGradient>
          </defs>

          <!-- Points -->
          <circle
            :cx="attackPoint.x"
            :cy="attackPoint.y"
            r="5"
            fill="#00ff88"
            stroke="#fff"
            stroke-width="2"
            data-point="attack"
            class="cursor-pointer"
          />
          <circle
            :cx="holdPoint.x"
            :cy="holdPoint.y"
            r="5"
            fill="#00ff88"
            stroke="#fff"
            stroke-width="2"
            data-point="hold"
            class="cursor-pointer"
          />
          <circle
            :cx="decayPoint.x"
            :cy="decayPoint.y"
            r="5"
            fill="#00ff88"
            stroke="#fff"
            stroke-width="2"
            data-point="decay"
            class="cursor-pointer"
          />
          <circle
            :cx="sustainPoint.x"
            :cy="sustainPoint.y"
            r="5"
            fill="#00ff88"
            stroke="#fff"
            stroke-width="2"
            data-point="sustain"
            class="cursor-pointer"
          />
        </svg>
        <div class="grid grid-cols-5 gap-4 pt-2">
          <Slider
            v-for="param in ['attack', 'hold', 'decay', 'sustain', 'release']"
            :key="param"
            v-model:value="props.envelope[param]"
            :min="param === 'sustain' ? 0 : 0.01"
            :max="
              param === 'attack' || param === 'decay'
                ? 2
                : param === 'release'
                ? 3
                : 1
            "
            :label="param"
            :unit="param === 'sustain' ? '' : 's'"
          />
        </div>
      </div>
    </div>
  </div>
</template>
