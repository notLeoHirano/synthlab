<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();
</script>

<template>
  <button
    @click="emit('update:modelValue', !modelValue)"
    class="relative w-full h-8 px-4 rounded-md border text-xs font-bold uppercase transition-all duration-150"
    :class="
      modelValue
        ? 'bg-red-700 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.7)]'
        : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800'
    "
  >
    <slot />
    <div
      class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full transition-colors"
      :class="modelValue ? 'bg-red-400' : 'bg-gray-600'"
    ></div>
  </button>
</template>
