/**
 * Turning orbits into consonant music.
 *
 *  1. Every body gets a "cosmic octave" tone (Hans Cousto, 1978): its orbital
 *     frequency doubled until audible. Earth's year → 136.1 Hz.
 *  2. The observer's tone is the root (the key of the piece).
 *  3. The target's true interval above the root is snapped to the nearest
 *     consonant just-intonation ratio. The leftover error is not discarded:
 *     it becomes a slow beating "shimmer" — dissonance turned into motion.
 *  4. Closest approaches ring bells on a just pentatonic scale over the root.
 */

/** Octave band the root is folded into (Hz). Earth's 136.1 Hz lands in it unchanged. */
export const ROOT_LOW = 96;
export const ROOT_HIGH = 192;

/** Consonant intervals the target may sit on (no seconds, sevenths or tritones). */
export const CONSONANT_RATIOS: { ratio: number; name: string; label: string }[] = [
  { ratio: 1, name: 'unison', label: '1:1' },
  { ratio: 6 / 5, name: 'minor third', label: '6:5' },
  { ratio: 5 / 4, name: 'major third', label: '5:4' },
  { ratio: 4 / 3, name: 'fourth', label: '4:3' },
  { ratio: 3 / 2, name: 'fifth', label: '3:2' },
  { ratio: 8 / 5, name: 'minor sixth', label: '8:5' },
  { ratio: 5 / 3, name: 'major sixth', label: '5:3' },
  { ratio: 2, name: 'octave', label: '2:1' },
];

/** Just major pentatonic over the root — used for the bells. */
export const PENTATONIC = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];

const cents = (r: number) => 1200 * Math.log2(r);

/** Cousto tone: orbital (or rotational) frequency raised by octaves into [lo, hi). */
export function cosmicTone(periodDays: number, lo = ROOT_LOW, hi = ROOT_HIGH): number {
  let f = 1 / (periodDays * 86400);
  while (f < lo) f *= 2;
  while (f >= hi) f /= 2;
  return f;
}

/** Fold a ratio into [1, 2). */
export function octaveReduce(r: number): number {
  while (r < 1) r *= 2;
  while (r >= 2) r /= 2;
  return r;
}

/** Nearest small-integer fraction (continued fractions), for the readout: 1.6255 → 13/8. */
export function nearestFraction(x: number, maxDen = 16): [number, number] {
  let best: [number, number] = [Math.round(x), 1];
  let bestErr = Math.abs(x - best[0]);
  for (let d = 2; d <= maxDen; d++) {
    const n = Math.round(x * d);
    const err = Math.abs(x - n / d);
    if (err < bestErr - 1e-12) {
      best = [n, d];
      bestErr = err;
    }
  }
  return best;
}

export interface Harmony {
  /** observer's tone (Hz) — the root */
  root: number;
  /** target's raw cosmic tone, octave-placed just above the root (Hz) */
  targetRaw: number;
  /** true interval, in [1, 2) */
  trueRatio: number;
  /** the consonance it was snapped to */
  snapped: (typeof CONSONANT_RATIOS)[number];
  /** snapped − true, in cents (signed) */
  errorCents: number;
  /** target voice frequency (snapped), Hz */
  target: number;
  /** shimmer: beat rate (Hz) and depth (0..1), both growing with the snapping error */
  beatHz: number;
  shimmerDepth: number;
}

export function computeHarmony(observerTonePeriod: number, targetTonePeriod: number): Harmony {
  const root = cosmicTone(observerTonePeriod);
  const trueRatio = octaveReduce(cosmicTone(targetTonePeriod) / root);
  let snapped = CONSONANT_RATIOS[0];
  for (const c of CONSONANT_RATIOS) {
    if (Math.abs(cents(trueRatio / c.ratio)) < Math.abs(cents(trueRatio / snapped.ratio))) snapped = c;
  }
  const errorCents = cents(snapped.ratio / trueRatio);
  const severity = Math.min(1, Math.abs(errorCents) / 60);
  return {
    root,
    targetRaw: root * trueRatio,
    trueRatio,
    snapped,
    errorCents,
    target: root * snapped.ratio * (snapped.ratio === 1 ? 2 : 1), // keep a unison off the root
    // slow, breathing beats — never faster than ~0.6 Hz
    beatHz: 0.07 + 0.5 * severity,
    shimmerDepth: 0.15 + 0.85 * severity,
  };
}

/**
 * Bell pitch for a closest approach. The direction of the encounter around the
 * frame picks the pentatonic degree, so a 5-fold star (Venus) plays a 5-note
 * phrase in the same skipping order the star is drawn.
 */
export function bellFrequency(root: number, angle: number, referenceAngle: number, octave = 2): number {
  const sector = (2 * Math.PI) / PENTATONIC.length;
  const deg = ((Math.round((angle - referenceAngle) / sector) % 5) + 5) % 5;
  return root * PENTATONIC[deg] * 2 ** octave;
}

export function describeHarmony(h: Harmony, nameA: string, nameB: string): string {
  const [n, d] = nearestFraction(h.trueRatio);
  const sign = h.errorCents >= 0 ? '+' : '−';
  return (
    `♪ ${nameA} ${h.root.toFixed(1)} Hz · ${nameB} ${h.targetRaw.toFixed(1)} Hz · ` +
    `${n}:${d} → ${h.snapped.label} ${h.snapped.name} (${sign}${Math.abs(h.errorCents).toFixed(0)}¢)`
  );
}
