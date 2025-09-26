<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps<{
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  unit?: string;
  color?: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const min = props.min ?? 0;
const max = props.max ?? 100;
const step = props.step ?? props.unit === "%" ? 0.01 : 0.1;
const color = props.color ?? "#10b981"; // Default to emerald-500

const isDragging = ref(false);
const startY = ref(0);
const startValue = ref(0);

const normalizedValue = computed(() => (props.modelValue - min) / (max - min));

const rotation = computed(() => {
  return normalizedValue.value * 270 - 135;
});

const arcPath = computed(() => {
  const startAngle = -135;
  const endAngle = startAngle + normalizedValue.value * 270;

  const start = polarToCartesian(50, 50, 45, endAngle);
  const end = polarToCartesian(50, 50, 45, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    45,
    45,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
});

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true;
  startY.value = e.clientY;
  startValue.value = props.modelValue;
  document.body.style.cursor = "ns-resize";
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const deltaY = startY.value - e.clientY;
  const range = max - min;
  // Sensitivity: 200px drag for full range
  const newValue = startValue.value + (deltaY / 200) * range;
  let clampedValue = Math.max(min, Math.min(max, newValue));

  // Snap to step
  clampedValue = Math.round(clampedValue / step) * step;

  emit("update:modelValue", clampedValue);
};

const handleMouseUp = () => {
  isDragging.value = false;
  document.body.style.cursor = "default";
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
};

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center select-none w-12"
  >
    <div
      class="relative w-full aspect-square cursor-ns-resize"
      @mousedown="handleMouseDown"
    >
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#374151"
          stroke-width="8"
        />
        <path
          :d="arcPath"
          fill="none"
          :stroke="color"
          stroke-width="8"
          stroke-linecap="round"
        />
        <circle cx="50" cy="50" r="38" fill="#1f2937" />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          :stroke="color"
          stroke-width="5"
          stroke-linecap="round"
          :transform="`rotate(${rotation}, 50, 50)`"
        />
      </svg>
    </div>
    <div class="mt-1">
      <div class="text-xs font-bold uppercase tracking-wider text-gray-400">
        {{ label }}
      </div>
      <div class="text-sm text-white">
        {{
          (props.unit == "%" ? modelValue * 100 : modelValue).toFixed(
            unit === "%" || unit === "Hz" ? 0 : 1
          )
        }}{{ unit }}
      </div>
    </div>
  </div>
</template>
