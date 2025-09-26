<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from "vue";

const props = defineProps<{
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:value", val: number): void;
}>();

// drag state
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const startValue = ref(0);

function onMouseDown(e: MouseEvent) {
  if (props.disabled) return;
  isDragging.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;
  startValue.value = props.value;

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;

  const dx = e.clientX - startX.value;
  const dy = startY.value - e.clientY; // up = positive
  const delta = dx + dy;

  const sensitivity = (props.max - props.min) / 400; // 400px of mouse travel for the full range
  let newValue = startValue.value + delta * sensitivity;

  const step = props.step ?? 0.01;
  newValue = Math.round(newValue / step) * step;

  newValue = Math.min(props.max, Math.max(props.min, newValue));
  emit("update:value", newValue);
}

function onMouseUp() {
  isDragging.value = false;
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
}

const rotation = computed(() => {
  const ratio = (props.value - props.min) / (props.max - props.min);
  return -135 + ratio * 270; // Rotates from -135deg to +135deg
});
</script>

<template>
  <div
    class="flex flex-col items-center select-none w-12"
    :class="disabled ? 'opacity-50 pointer-events-none' : ''"
  >
    <label
      v-if="label"
      class="text-xs mb-1 uppercase font-bold tracking-wider text-gray-400"
      >{{ label }}</label
    >

    <svg viewBox="0 0 72 72" @mousedown="onMouseDown" class="cursor-ns-resize">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2"
            flood-color="#000"
            flood-opacity="0.5"
          />
        </filter>
      </defs>

      <!-- Knob body -->
      <circle
        cx="36"
        cy="36"
        r="28"
        fill="url(#knobFace)"
        filter="url(#shadow)"
      />

      <!-- Outer track for visual reference -->
      <circle
        cx="36"
        cy="36"
        r="24"
        fill="#333"
        stroke="#1a202c"
        stroke-width="4"
      />

      <!-- Pointer line, rotated using transform for accuracy -->
      <line
        x1="36"
        y1="16"
        x2="36"
        y2="28"
        stroke="#f97316"
        stroke-width="3"
        stroke-linecap="round"
        :transform="`rotate(${rotation} 36 36)`"
      />
    </svg>

    <div class="text-xs text-gray-300 mt-1 text-center w-16">
      {{ value.toFixed(unit === "%" ? 0 : 2) }}{{ unit || "" }}
    </div>
  </div>
</template>
