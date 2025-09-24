<script setup lang="ts">
definePageMeta({ ssr: false });
import Synth from "~/components/Synth.vue";

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
    <h1 class="text-2xl mb-6">Synth Playground</h1>
    <Synth />
  </div>
</template>
