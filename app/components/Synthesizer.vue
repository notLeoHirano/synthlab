<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import Keyboard from "./Keyboard.vue";
import Oscillator from "./Oscillator.vue";
const { isMobile } = useDevice();

const activeNotes = ref(new Set<string>());
const osc1 = ref<any>(null);
const osc2 = ref<any>(null);

const noteOn = (note: string) => {
  activeNotes.value.add(note);
  osc1.value?.noteOn(note);
  osc2.value?.noteOn(note);
};

const noteOff = (note: string) => {
  activeNotes.value.delete(note);
  osc1.value?.noteOff(note);
  osc2.value?.noteOff(note);
};

// Keyboard props based on breakpoint
const responsiveOctaves = computed(() => (isMobile ? 2 : 4));
const responsiveStartOctave = computed(() => (isMobile ? 4 : 3));
</script>

<template>
  <div class="h-screen w-full flex flex-col bg-gray-900">
    <!-- Oscillators container -->
    <div class="flex-1 w-full h-full flex relative overflow-hidden">
      <!-- Desktop Layout -->
      <div v-if="!isMobile" class="flex gap-4 m-4 w-full">
        <div class="flex-1 overflow-hidden">
          <Oscillator
            ref="osc1"
            :activeNotes="activeNotes"
            class="w-full h-full"
          />
        </div>
        <div class="flex-1 overflow-hidden">
          <Oscillator
            ref="osc2"
            :activeNotes="activeNotes"
            class="w-full h-full"
          />
        </div>
      </div>

      <!-- Mobile Layout - Always render both, but in swipe container -->
      <div
        v-if="isMobile"
        class="h-full w-full overflow-x-auto snap-x snap-mandatory flex"
      >
        <div class="flex-shrink-0 w-full h-full snap-center overflow-hidden">
          <Oscillator
            ref="osc1"
            :activeNotes="activeNotes"
            class="w-full h-full"
          />
        </div>
        <div class="flex-shrink-0 w-full h-full snap-center overflow-hidden">
          <Oscillator
            ref="osc2"
            :activeNotes="activeNotes"
            class="w-full h-full"
          />
        </div>
      </div>
    </div>

    <!-- Keyboard fixed at bottom -->
    <div
      class="flex-shrink-0 flex items-center justify-center mx-4 pb-4 bg-gray-900"
    >
      <div class="w-full max-w-6xl">
        <Keyboard
          :activeNotes="activeNotes"
          :octaves="responsiveOctaves"
          :startOctave="responsiveStartOctave"
          @noteOn="noteOn"
          @noteOff="noteOff"
          class="w-full"
        />
      </div>
    </div>
  </div>
</template>
