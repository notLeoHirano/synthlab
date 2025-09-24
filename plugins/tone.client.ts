import { defineNuxtPlugin } from "nuxt/app";
import * as Tone from "tone";

export default defineNuxtPlugin((nuxtApp) => {
  console.log("Tone.js version:", Tone.version);
  nuxtApp.provide("tone", Tone);
});
