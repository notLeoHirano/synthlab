<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import Keyboard from "./Keyboard.vue";
import Oscillator from "./Oscillator.vue";

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

// Tailwind md breakpoint = 768px
const isMobile = ref(window ? window.innerWidth < 768 : true);

const updateBreakpoint = () => {
  isMobile.value = window.matchMedia("(max-width: 767px)").matches;
};

onMounted(() => {
  updateBreakpoint();
  window.addEventListener("resize", updateBreakpoint);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateBreakpoint);
});

// Keyboard props based on breakpoint
const responsiveOctaves = computed(() => (isMobile.value ? 2 : 4));
const responsiveStartOctave = computed(() => (isMobile.value ? 4 : 3));
</script>

<template>
  <div class="h-screen w-full flex flex-col bg-gray-900">
    <!-- Oscillators container -->
    <div class="flex-1 w-full h-full flex relative overflow-hidden">
      <!-- Desktop: 2-column flex -->
      <div class="hidden md:flex md:gap-4 md:m-4 md:w-full">
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

      <!-- Mobile: 1 oscillator at a time with pagination -->
      <div
        class="flex md:hidden h-full w-full overflow-x-auto snap-x snap-mandatory"
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
