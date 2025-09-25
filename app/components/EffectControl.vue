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

const filterTypes = ["lowpass", "highpass", "bandpass", "notch"] as const;

// Use a logarithmic scale for the filter frequency knob for more intuitive control
const filterFreqLog = computed({
  get: () => Math.log10(props.filter.freq),
  set: (val) => updateFilter("freq", Math.pow(10, val)),
});
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2 bg-gray-900/50 rounded-lg border border-gray-700"
  >
    <div
      v-for="i in 6"
      :key="i"
      class="flex flex-col items-center p-4 bg-black/20 rounded-lg border border-gray-700 space-y-4 min-h-[260px]"
    >
      <template v-if="i === 1">
        <Filter
          :modelValue="props.filter"
          @update:modelValue="$emit('update:filter', $event)"
        />
      </template>

      <template v-if="i === 2">
        <PowerButton
          :model-value="props.distortion.enabled"
          @update:model-value="updateDistortion('enabled', $event)"
          >Distortion</PowerButton
        >
        <div
          class="flex-grow flex items-center justify-center"
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
      </template>

      <template v-if="i === 3">
        <PowerButton
          :model-value="props.bitCrusher.enabled"
          @update:model-value="updateBitCrusher('enabled', $event)"
          >Bit Crush</PowerButton
        >
        <div
          class="flex-grow flex items-center justify-center"
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
      </template>

      <template v-if="i === 4">
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
              :min="0.01"
              :max="1"
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
      </template>

      <template v-if="i === 5">
        <PowerButton
          :model-value="props.reverb.enabled"
          @update:model-value="updateReverb('enabled', $event)"
          >Reverb</PowerButton
        >
        <div
          class="flex items-start justify-center pt-8 gap-4"
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
      </template>

      <template v-if="i === 6">
        <PowerButton
          :model-value="props.compressor.enabled"
          @update:model-value="updateCompressor('enabled', $event)"
          >Compressor</PowerButton
        >
        <div
          class="flex items-start justify-center pt-8 gap-4"
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
      </template>
    </div>
  </div>
</template>
