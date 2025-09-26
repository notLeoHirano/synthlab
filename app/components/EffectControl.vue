<script setup lang="ts">
import { computed } from "vue";
import Knob from "./Knob.vue";
import PowerButton from "./PowerButton.vue";
import Filter from "./Filter.vue";

// Props and types remain the same as your previous version
type FilterProps = {
  enabled: boolean;
  type: BiquadFilterType;
  freq: number;
  Q: number;
};
type DistortionProps = { enabled: boolean; amount: number };
type BitCrusherProps = { enabled: boolean; bits: number };
type DelayProps = {
  enabled: boolean;
  time: number;
  feedback: number;
  wet: number;
};
type ReverbProps = { enabled: boolean; roomSize: number; wet: number };
type CompressorProps = { enabled: boolean; threshold: number; ratio: number };

const props = defineProps<{
  filter: FilterProps;
  distortion: DistortionProps;
  bitCrusher: BitCrusherProps;
  delay: DelayProps;
  reverb: ReverbProps;
  compressor: CompressorProps;
}>();

const emit = defineEmits<{
  (e: "update:filter", value: FilterProps): void;
  (e: "update:distortion", value: DistortionProps): void;
  (e: "update:bitCrusher", value: BitCrusherProps): void;
  (e: "update:delay", value: DelayProps): void;
  (e: "update:reverb", value: ReverbProps): void;
  (e: "update:compressor", value: CompressorProps): void;
}>();

// Helper functions for updating each effect's state
const updateFilter = <K extends keyof FilterProps>(
  field: K,
  value: FilterProps[K]
) => emit("update:filter", { ...props.filter, [field]: value });
const updateDistortion = <K extends keyof DistortionProps>(
  field: K,
  value: DistortionProps[K]
) => emit("update:distortion", { ...props.distortion, [field]: value });
const updateBitCrusher = <K extends keyof BitCrusherProps>(
  field: K,
  value: BitCrusherProps[K]
) => emit("update:bitCrusher", { ...props.bitCrusher, [field]: value });
const updateDelay = <K extends keyof DelayProps>(
  field: K,
  value: DelayProps[K]
) => emit("update:delay", { ...props.delay, [field]: value });
const updateReverb = <K extends keyof ReverbProps>(
  field: K,
  value: ReverbProps[K]
) => emit("update:reverb", { ...props.reverb, [field]: value });
const updateCompressor = <K extends keyof CompressorProps>(
  field: K,
  value: CompressorProps[K]
) => emit("update:compressor", { ...props.compressor, [field]: value });
</script>

<template>
  <div
    class="overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2 bg-gray-900/50 rounded-lg border border-gray-700"
  >
    <!-- Row 1, Column 1: Reverb -->
    <div
      class="flex flex-col items-center p-2 bg-black/20 rounded-lg border border-gray-700 space-y-4 min-h-[120px]"
    >
      <PowerButton
        :model-value="props.reverb.enabled"
        @update:model-value="updateReverb('enabled', $event)"
        >Reverb</PowerButton
      >
      <div
        class="flex items-start justify-center gap-4"
        :class="{ 'opacity-40 pointer-events-none': !props.reverb.enabled }"
      >
        <Knob
          label="Size"
          :model-value="props.reverb.roomSize"
          @update:model-value="updateReverb('roomSize', $event)"
          :min="0.1"
          :max="10"
          unit="s"
        />
        <Knob
          label="Mix"
          :model-value="props.reverb.wet"
          @update:model-value="updateReverb('wet', $event)"
          :min="0"
          :max="1"
          unit="%"
        />
      </div>
    </div>

    <!-- Row 1, Column 3: Compressor -->
    <div
      class="flex flex-col items-center p-2 bg-black/20 rounded-lg border border-gray-700 space-y-4 min-h-[120px]"
    >
      <PowerButton
        :model-value="props.compressor.enabled"
        @update:model-value="updateCompressor('enabled', $event)"
        >Compressor</PowerButton
      >
      <div
        class="flex items-start justify-center gap-4"
        :class="{
          'opacity-40 pointer-events-none': !props.compressor.enabled,
        }"
      >
        <Knob
          label="Thresh"
          :model-value="props.compressor.threshold"
          @update:model-value="updateCompressor('threshold', $event)"
          :min="-60"
          :max="0"
          unit="dB"
        />
        <Knob
          label="Ratio"
          :model-value="props.compressor.ratio"
          @update:model-value="updateCompressor('ratio', $event)"
          :min="1"
          :max="20"
          unit=":1"
        />
      </div>
    </div>

    <!-- Row 2, Columns 1 & 2: Distortion & Bit Crush -->
    <div
      class="md:col-span-1 lg:col-span-1 flex flex-col items-center p-2 bg-black/20 rounded-lg border border-gray-700 space-y-2 min-h-[120px]"
    >
      <div class="flex w-full space-x-2">
        <!-- Distortion -->
        <div class="flex flex-1 flex-col items-center justify-center">
          <PowerButton
            :model-value="props.distortion.enabled"
            @update:model-value="updateDistortion('enabled', $event)"
            >Distort</PowerButton
          >
          <div
            class="flex-grow flex items-center mt-5 justify-center"
            :class="{
              'opacity-40 pointer-events-none': !props.distortion.enabled,
            }"
          >
            <Knob
              label="Drive"
              :model-value="props.distortion.amount"
              @update:model-value="updateDistortion('amount', $event)"
              :min="0"
              :max="1"
              unit="%"
            />
          </div>
        </div>

        <!-- Bit Crush -->
        <div class="flex flex-1 flex-col items-center justify-center h-full">
          <PowerButton
            :model-value="props.bitCrusher.enabled"
            @update:model-value="updateBitCrusher('enabled', $event)"
            >Crush</PowerButton
          >
          <div
            class="flex-grow flex mt-5 items-center justify-center"
            :class="{
              'opacity-40 pointer-events-none': !props.bitCrusher.enabled,
            }"
          >
            <Knob
              label="Bits"
              :model-value="props.bitCrusher.bits"
              @update:model-value="updateBitCrusher('bits', $event)"
              :min="1"
              :max="16"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- Row 1, Column 2: Delay -->
    <div
      class="flex flex-col items-center p-2 bg-black/20 rounded-lg border border-gray-700 space-y-4 min-h-[120px]"
    >
      <PowerButton
        :model-value="props.delay.enabled"
        @update:model-value="updateDelay('enabled', $event)"
        >Delay</PowerButton
      >
      <div
        class="flex flex-col items-center space-y-4"
        :class="{ 'opacity-40 pointer-events-none': !props.delay.enabled }"
      >
        <div class="flex items-start justify-center gap-4">
          <Knob
            label="Time"
            :model-value="props.delay.time"
            @update:model-value="updateDelay('time', $event)"
            :min="0.001"
            :max="1"
            :step="0.001"
            unit="s"
          />
          <Knob
            label="Fdbk"
            :model-value="props.delay.feedback"
            @update:model-value="updateDelay('feedback', $event)"
            :min="0"
            :max="0.95"
            unit="%"
          />
        </div>
        <Knob
          label="Mix"
          :model-value="props.delay.wet"
          @update:model-value="updateDelay('wet', $event)"
          :min="0"
          :max="1"
          unit="%"
        />
      </div>
    </div>

    <!-- Row 2, Column 3: Filter -->
    <div
      class="md:col-span-2 lg:col-span-2 flex flex-col items-center p-2 bg-black/20 rounded-lg border border-gray-700 space-y-4 min-h-[120px]"
    >
      <PowerButton
        :model-value="props.filter.enabled"
        @update:model-value="updateFilter('enabled', $event)"
        >Filter</PowerButton
      >
      <Filter
        class="w-full h-full"
        :modelValue="props.filter"
        @update:modelValue="$emit('update:filter', $event)"
      />
    </div>
  </div>
</template>
