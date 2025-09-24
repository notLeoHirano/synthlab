import { ref } from "vue";
import * as Tone from "tone";
import { SynthData } from "../types";

export const synths = ref<SynthData[]>([]);
export const activeNotes = ref<Set<string>>(new Set());

export function createSynth(): SynthData {
  const synth = new Tone.PolySynth(Tone.Synth).toDestination();
  const id = crypto.randomUUID();

  const synthData: SynthData = {
    id,
    synth,
    oscillator: { type: "sine" },
    envelope: { attack: 0.1, hold: 0, decay: 0.1, sustain: 0.7, release: 0.5 },
    modulators: [],
  };

  synths.value.push(synthData);
  return synthData;
}

export function updateSynth(updatedSynth: SynthData) {
  synths.value = synths.value.map((s) =>
    s.id === updatedSynth.id ? updatedSynth : s
  );
}

export function noteOn(note: string) {
  synths.value.forEach((s) => s.synth.triggerAttack(note));
  activeNotes.value.add(note);
}

export function noteOff(note: string) {
  synths.value.forEach((s) => s.synth.triggerRelease(note));
  activeNotes.value.delete(note);
}
