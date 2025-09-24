import * as Tone from "tone";

export interface Envelope {
  attack: number;
  hold: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface FilterSettings {
  type: string;
  frequency: number;
  Q: number;
}

export interface Modulator {
  id: string;
  type: "LFO" | "Envelope";
  targetParam: string;
  settings: Record<string, number>;
}

export interface SynthData {
  id: string;
  synth: Tone.PolySynth;
  oscillator: { type: Tone.ToneOscillatorType };
  envelope: Envelope;
  filter?: FilterSettings;
  modulators: Modulator[];
}
