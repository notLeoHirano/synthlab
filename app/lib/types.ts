import * as Tone from "tone";
export interface SynthModule {
  id: string;
  name: string;
  node: Tone.ToneAudioNode;
  params: Record<string, any>;
}
