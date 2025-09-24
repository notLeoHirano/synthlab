<template>
  <div>
    <Modulator
      v-for="mod in modulators"
      :key="mod.id"
      :mod="mod"
      @update="onUpdateMod"
    />
    <button @click="addLFO">+ Add LFO</button>
  </div>
</template>

<script setup lang="ts">
import Modulator from "./Modulator.vue";
const props = defineProps<{ modulators: any[] }>();
const emit = defineEmits<{ (e: "update", mods: any[]): void }>();

const addLFO = () => {
  const newLFO = {
    id: crypto.randomUUID(),
    type: "LFO",
    targetParam: "filterFrequency",
    settings: { frequency: 5, depth: 0.5 },
  };
  emit("update", [...props.modulators, newLFO]);
};

const onUpdateMod = (updatedMod) => {
  emit(
    "update",
    props.modulators.map((m) => (m.id === updatedMod.id ? updatedMod : m))
  );
};
</script>
