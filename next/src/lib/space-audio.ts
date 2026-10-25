/** Original, generative ambient score. No recordings or network requests. */
export class SpaceAudio {
  private context: AudioContext;
  private master: GainNode;
  private reverb: ConvolverNode;
  private timer: ReturnType<typeof setInterval>;
  private nextChord = 0;
  private chord = 0;
  private enabled = false;

  constructor() {
    this.context = new AudioContext();
    const ctx = this.context;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.ratio.value = 6;
    this.master.connect(limiter).connect(ctx.destination);
    this.reverb = ctx.createConvolver();
    const impulse = ctx.createBuffer(2, ctx.sampleRate * 5, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    this.reverb.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.65;
    this.reverb.connect(wet).connect(this.master);
    this.timer = setInterval(() => this.schedule(), 1000);
    document.addEventListener("visibilitychange", this.visibility);
  }

  private note(
    midi: number,
    at: number,
    duration: number,
    volume: number,
    pan: number,
  ) {
    const ctx = this.context;
    const voice = ctx.createGain();
    const stereo = ctx.createStereoPanner();
    stereo.pan.value = pan;
    voice.gain.setValueAtTime(0, at);
    voice.gain.linearRampToValueAtTime(volume, at + Math.min(3, duration / 3));
    voice.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    voice.connect(stereo);
    stereo.connect(this.master);
    stereo.connect(this.reverb);
    const oscillators = [-3, 3].map((detune) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      oscillator.detune.value = detune;
      oscillator.connect(voice);
      oscillator.start(at);
      oscillator.stop(at + duration);
      return oscillator;
    });
    oscillators[1].onended = () => {
      oscillators.forEach((oscillator) => oscillator.disconnect());
      voice.disconnect();
      stereo.disconnect();
    };
  }

  private schedule() {
    const ctx = this.context;
    if (
      !this.enabled ||
      ctx.state !== "running" ||
      this.nextChord > ctx.currentTime + 2
    )
      return;
    const at = Math.max(ctx.currentTime + 0.05, this.nextChord);
    // D minor(add9), Bbmaj7, Fmaj9, Csus2: slow, overlapping pads.
    const chords = [
      [38, 50, 57, 64, 65],
      [34, 50, 57, 60, 65],
      [41, 53, 57, 64, 67],
      [36, 50, 55, 60, 62],
    ];
    const notes = chords[this.chord++ % chords.length];
    notes.forEach((midi, i) =>
      this.note(midi, at, 18, i === 0 ? 0.07 : 0.025, (i - 2) * 0.25),
    );
    for (let i = 0; i < 4; i++)
      this.note(
        notes[1 + (i % 4)] + 12,
        at + 2 + i * 2.8,
        6,
        0.013,
        i % 2 ? 0.65 : -0.65,
      );
    this.nextChord = at + 12;
  }

  private visibility = () => {
    if (document.hidden) void this.context.suspend().catch(() => {});
    else if (this.enabled) void this.context.resume().catch(() => {});
  };

  async setEnabled(enabled: boolean) {
    if (enabled) await this.context.resume();
    this.enabled = enabled;
    const gain = this.master.gain;
    gain.cancelScheduledValues(this.context.currentTime);
    gain.setTargetAtTime(enabled ? 0.55 : 0, this.context.currentTime, 0.3);
    if (enabled) this.schedule();
  }

  dispose() {
    clearInterval(this.timer);
    document.removeEventListener("visibilitychange", this.visibility);
    void this.context.close();
  }
}
