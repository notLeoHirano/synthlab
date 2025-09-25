<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

type Modulation = {
  enabled: boolean;
  freq: number;
  depth: number;
  wet: number;
};

const props = defineProps<{
  chorus: Modulation;
  phaser: Modulation;
}>();

const emit = defineEmits<{
  (e: "update:chorus", value: Modulation): void;
  (e: "update:phaser", value: Modulation): void;
}>();

type ModulationField = keyof Modulation;

function onChorusChange(field: ModulationField, e: Event) {
  const target = e.target as HTMLInputElement;
  const value = field === "enabled" ? target.checked : +target.value;
  emit("update:chorus", { ...props.chorus, [field]: value });
}

function onPhaserChange(field: ModulationField, e: Event) {
  const target = e.target as HTMLInputElement;
  const value = field === "enabled" ? target.checked : +target.value;
  emit("update:phaser", { ...props.phaser, [field]: value });
}
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <!-- Chorus -->
    <div class="bg-gray-800 p-4 rounded-lg">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium">Chorus</h3>
        <input
          type="checkbox"
          :checked="props.chorus.enabled"
          @change="onChorusChange('enabled', $event)"
          class="accent-green-500"
        />
      </div>
      <div
        :class="!props.chorus.enabled ? 'opacity-50 pointer-events-none' : ''"
      >
        <label class="text-xs">Frequency</label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          :value="props.chorus.freq"
          @input="onChorusChange('freq', $event)"
          class="w-full accent-green-500"
        />
        <span class="text-xs text-gray-400"
          >{{ props.chorus.freq.toFixed(1) }} Hz</span
        >

        <label class="text-xs block mt-2">Depth</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="props.chorus.depth"
          @input="onChorusChange('depth', $event)"
          class="w-full accent-green-500"
        />
        <span class="text-xs text-gray-400"
          >{{ (props.chorus.depth * 100).toFixed(0) }}%</span
        >

        <label class="text-xs block mt-2">Mix</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="props.chorus.wet"
          @input="onChorusChange('wet', $event)"
          class="w-full accent-green-500"
        />
        <span class="text-xs text-gray-400"
          >{{ (props.chorus.wet * 100).toFixed(0) }}%</span
        >
      </div>
    </div>

    <!-- Phaser -->
    <div class="bg-gray-800 p-4 rounded-lg">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium">Phaser</h3>
        <input
          type="checkbox"
          :checked="props.phaser.enabled"
          @change="onPhaserChange('enabled', $event)"
          class="accent-purple-500"
        />
      </div>
      <div
        :class="!props.phaser.enabled ? 'opacity-50 pointer-events-none' : ''"
      >
        <label class="text-xs">Frequency</label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          :value="props.phaser.freq"
          @input="onPhaserChange('freq', $event)"
          class="w-full accent-purple-500"
        />
        <span class="text-xs text-gray-400"
          >{{ props.phaser.freq.toFixed(1) }} Hz</span
        >

        <label class="text-xs block mt-2">Depth</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="props.phaser.depth"
          @input="onPhaserChange('depth', $event)"
          class="w-full accent-purple-500"
        />
        <span class="text-xs text-gray-400"
          >{{ (props.phaser.depth * 100).toFixed(0) }}%</span
        >

        <label class="text-xs block mt-2">Mix</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="props.phaser.wet"
          @input="onPhaserChange('wet', $event)"
          class="w-full accent-purple-500"
        />
        <span class="text-xs text-gray-400"
          >{{ (props.phaser.wet * 100).toFixed(0) }}%</span
        >
      </div>
    </div>
  </div>
</template>
