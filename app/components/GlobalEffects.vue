<template>
  <div>
    <EffectControl
      v-for="effect in effects"
      :key="effect.id"
      :effect="effect"
      @update="updateEffect"
    />
  </div>
</template>
