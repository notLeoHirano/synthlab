<script setup lang="ts">
definePageMeta({ ssr: false });
import Synth from "~/components/Synthesizer.vue";

import { onMounted } from "vue";
import * as Tone from "tone";

let synth: any;

onMounted(() => {
  synth = new Tone.Synth().toDestination();
});

function playNote(note: string) {
  Tone.start();
  synth?.triggerAttackRelease(note, "8n");
}
</script>

<template>
  <div
    class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center"
  >
    <Synthesizer />
  </div>
</template>
