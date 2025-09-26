<script setup lang="ts">
import Synthesizer from "../components/Synthesizer.vue";

definePageMeta({ ssr: false });
</script>

<template>
  <div class="min-h-screen bg-gray-900 items-center justify-center">
    <Synthesizer />
  </div>
</template>
