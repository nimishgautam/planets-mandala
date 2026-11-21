import type { Harmony } from './harmony';

/**
 * Generative drone + bells. All pitches come from `Harmony` (see harmony.ts):
 *  - root: the observer's cosmic tone, with a sub-octave
 *  - target: the snapped consonant interval above it
 *  - shimmer: a quiet partner a fraction of a hertz off the target, so the
 *    snapping error is heard as slow beating (can be switched off)
 *  - bells: soft struck tones at closest approaches
 */

interface Voice {
  oscs: OscillatorNode[];
  gain: GainNode;
}

const MIN_BELL_GAP = 1.6; // seconds — keeps dense patterns calm

export class Drone {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private filter!: BiquadFilterNode;
  private bellBus!: GainNode;
  private voices: Voice[] = [];
  private shimmerVoice: Voice | null = null;
  private shimmerLevel = 0;
  private shimmerOn = true;
  private lastBell = -Infinity;

  async start(): Promise<void> {
    if (!this.ctx) this.init();
    await this.ctx!.resume();
    this.master.gain.cancelScheduledValues(this.ctx!.currentTime);
    this.master.gain.setTargetAtTime(0.32, this.ctx!.currentTime, 1.5);
  }

  stop(): void {
    if (!this.ctx) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.6);
  }

  private init(): void {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 700;
    this.filter.Q.value = 0.7;

    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(6);
    const wet = ctx.createGain();
    wet.gain.value = 0.75;
    const dry = ctx.createGain();
    dry.gain.value = 0.35;

    this.filter.connect(dry).connect(this.master);
    this.filter.connect(reverb);
    reverb.connect(wet).connect(this.master);

    // bells skip the drone's low-pass so they stay clear, but share the reverb
    this.bellBus = ctx.createGain();
    this.bellBus.gain.value = 0.5;
    const bellDry = ctx.createGain();
    bellDry.gain.value = 0.4;
    this.bellBus.connect(bellDry).connect(this.master);
    this.bellBus.connect(reverb);

    this.master.connect(ctx.destination);

    // slow breathing on the filter
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(this.filter.frequency);
    lfo.start();
  }

  private impulse(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  }

  /** Crossfade to a new chord. */
  setHarmony(h: Harmony): void {
    if (!this.ctx) this.init();
    const now = this.ctx!.currentTime;
    for (const v of [...this.voices, ...(this.shimmerVoice ? [this.shimmerVoice] : [])]) {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setTargetAtTime(0, now, 0.9);
      v.oscs.forEach((o) => o.stop(now + 5));
    }
    this.voices = [
      this.voice(h.root / 2, 0.2, ['sine']),            // sub
      this.voice(h.root, 0.12, ['sine', 'triangle']),    // root
      this.voice(h.target, 0.14, ['sine', 'triangle']),  // snapped target
      this.voice(h.target * 2, 0.035, ['sine']),         // airy octave
    ];
    // shimmer partner: a hair off the target → |beatHz| beats per second
    this.shimmerLevel = 0.12 * h.shimmerDepth;
    this.shimmerVoice = this.voice(h.target + h.beatHz, this.shimmerOn ? this.shimmerLevel : 0, ['sine']);
  }

  setShimmer(on: boolean): void {
    this.shimmerOn = on;
    if (!this.ctx || !this.shimmerVoice) return;
    this.shimmerVoice.gain.gain.setTargetAtTime(on ? this.shimmerLevel : 0, this.ctx.currentTime, 1.2);
  }

  private voice(freq: number, level: number, types: OscillatorType[]): Voice {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(level, ctx.currentTime, 2.0);
    gain.connect(this.filter);
    const oscs = types.map((type, i) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = i === 0 ? 0 : 3; // tiny chorus on the second layer
      o.connect(gain);
      o.start();
      return o;
    });
    return { oscs, gain };
  }

  /** A soft struck bell. Rate-limited so dense patterns stay calm. Returns true if it rang. */
  bell(freq: number, level = 0.22): boolean {
    if (!this.ctx || this.ctx.state !== 'running') return false;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    if (now - this.lastBell < MIN_BELL_GAP) return false;
    this.lastBell = now;
    // fundamental + gentle inharmonic partials (bell-like, but soft)
    const partials = [
      { mult: 1, amp: 1, decay: 4.5 },
      { mult: 2.0, amp: 0.25, decay: 2.5 },
      { mult: 2.76, amp: 0.12, decay: 1.6 },
    ];
    for (const p of partials) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * p.mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(level * p.amp, now + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
      o.connect(g).connect(this.bellBus);
      o.start(now);
      o.stop(now + p.decay + 0.1);
    }
    return true;
  }

  /** closeness 0 (far) … 1 (closest approach): opens the filter. */
  setCloseness(c: number): void {
    if (!this.ctx) return;
    this.filter.frequency.setTargetAtTime(380 + 1500 * c * c, this.ctx.currentTime, 0.4);
  }
}
