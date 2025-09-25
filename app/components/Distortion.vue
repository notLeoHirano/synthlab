<script setup lang="ts">
import { computed } from "vue";
import Slider from "./Slider.vue";

type DistortionProps = { enabled: boolean; amount: number };

const props = defineProps<{ modelValue: DistortionProps }>();
const emit = defineEmits(["update:modelValue"]);

// Computed property to handle conversion for the slider
// The slider will operate on a 0-100 scale for the percentage
const amountPercent = computed({
  get: () => props.modelValue.amount * 100,
  set: (newValue) => {
    emit("update:modelValue", { ...props.modelValue, amount: newValue / 100 });
  },
});

const onEnabledChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", { ...props.modelValue, enabled: target.checked });
};
</script>

<template>
  <div class="bg-gray-800 p-4 rounded-lg flex flex-col space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold uppercase tracking-wider text-gray-400">
        Distortion
      </h3>
      <input
        type="checkbox"
        :checked="modelValue.enabled"
        @change="onEnabledChange"
        class="accent-orange-500 w-5 h-5"
      />
    </div>
    <div
      :class="!modelValue.enabled ? 'opacity-50 pointer-events-none' : ''"
      class="flex justify-center items-center h-full transition-opacity pt-4"
    >
      <Slider
        v-model:value="amountPercent"
        label="Drive"
        :min="0"
        :max="100"
        :step="1"
        unit="%"
        :disabled="!modelValue.enabled"
      />
    </div>
  </div>
</template>
