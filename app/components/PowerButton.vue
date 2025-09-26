<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();
</script>

<template>
  <button
    @click="emit('update:modelValue', !modelValue)"
    class="relative w-full h-8 px-2 rounded-md border-2 text-xs font-bold uppercase transition-all duration-150"
    :class="
      modelValue
        ? 'bg-red-700 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.7)]'
        : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800'
    "
  >
    <slot />
  </button>
</template>
