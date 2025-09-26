<script setup lang="ts">
import { computed } from "vue";
import Knob from "./Knob.vue";
import PowerButton from "./PowerButton.vue";

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

// Helper functions for updating each modulation effect's state
const updateChorus = <K extends keyof Modulation>(
  field: K,
  value: Modulation[K]
) => emit("update:chorus", { ...props.chorus, [field]: value });

const updatePhaser = <K extends keyof Modulation>(
  field: K,
  value: Modulation[K]
) => emit("update:phaser", { ...props.phaser, [field]: value });
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 bg-gray-900/50 rounded-lg border border-gray-700"
  >
    <!-- Chorus -->
    <div
      class="flex flex-col items-center p-2 bg-black/20 rounded-lg border border-gray-700 space-y-4 min-h-[120px]"
    >
      <PowerButton
        :model-value="props.chorus.enabled"
        @update:model-value="updateChorus('enabled', $event)"
      >
        Chorus
      </PowerButton>

      <div
        class="flex flex-col items-center space-y-4"
        :class="{ 'opacity-40 pointer-events-none': !props.chorus.enabled }"
      >
        <div class="flex items-start justify-center gap-4">
          <Knob
            label="Freq"
            :model-value="props.chorus.freq"
            @update:model-value="updateChorus('freq', $event)"
            :min="0.1"
            :max="10"
            :step="0.1"
            unit="Hz"
          />
          <Knob
            label="Depth"
            :model-value="props.chorus.depth"
            @update:model-value="updateChorus('depth', $event)"
            :min="0"
            :max="1"
            :step="0.01"
            unit="%"
          />
        </div>
        <Knob
          label="Mix"
          :model-value="props.chorus.wet"
          @update:model-value="updateChorus('wet', $event)"
          :min="0"
          :max="1"
          :step="0.01"
          unit="%"
        />
      </div>
    </div>

    <!-- Phaser -->
    <div
      class="flex flex-col items-center p-2 bg-black/20 rounded-lg border border-gray-700 space-y-4 min-h-[120px]"
    >
      <PowerButton
        :model-value="props.phaser.enabled"
        @update:model-value="updatePhaser('enabled', $event)"
      >
        Phaser
      </PowerButton>

      <div
        class="flex flex-col items-center space-y-4"
        :class="{ 'opacity-40 pointer-events-none': !props.phaser.enabled }"
      >
        <div class="flex items-start justify-center gap-4">
          <Knob
            label="Freq"
            :model-value="props.phaser.freq"
            @update:model-value="updatePhaser('freq', $event)"
            :min="0.1"
            :max="10"
            :step="0.1"
            unit="Hz"
          />
          <Knob
            label="Depth"
            :model-value="props.phaser.depth"
            @update:model-value="updatePhaser('depth', $event)"
            :min="0"
            :max="1"
            :step="0.01"
            unit="%"
          />
        </div>
        <Knob
          label="Mix"
          :model-value="props.phaser.wet"
          @update:model-value="updatePhaser('wet', $event)"
          :min="0"
          :max="1"
          :step="0.01"
          unit="%"
        />
      </div>
    </div>
  </div>
</template>
