import { describe, expect, it } from 'vitest';
import { bellFrequency, computeHarmony, cosmicTone, nearestFraction, PENTATONIC } from '../src/audio/harmony';
import { bodies } from '../src/bodies/data';
import { J2000 } from '../src/bodies/units';
import { buildPattern } from '../src/engine/pattern';

const tone = (id: string) => bodies.get(id).tonePeriod;

describe('harmony', () => {
  it("Earth's year gives Cousto's 136.1 Hz", () => {
    expect(cosmicTone(tone('earth'))).toBeCloseTo(136.1, 0);
  });

  it('Earth→Venus: true ratio is the 13:8 resonance, snapped to a minor sixth', () => {
    const h = computeHarmony(tone('earth'), tone('venus'));
    expect(nearestFraction(h.trueRatio)).toEqual([13, 8]);
    expect(h.snapped.label).toBe('8:5');
    expect(Math.abs(h.errorCents)).toBeLessThan(35);
  });

  it('Earth→Jupiter is (nearly) a pure fourth', () => {
    const h = computeHarmony(tone('earth'), tone('jupiter'));
    expect(h.snapped.label).toBe('4:3');
    expect(Math.abs(h.errorCents)).toBeLessThan(25);
  });

  it('every pairing lands on a consonance, with calm shimmer', () => {
    const ids = bodies.all().map((b) => b.id);
    for (const a of ids) for (const b of ids) {
      if (a === b) continue;
      const h = computeHarmony(tone(a), tone(b));
      expect(h.root).toBeGreaterThanOrEqual(96);
      expect(h.root).toBeLessThan(192);
      expect(Math.abs(h.errorCents)).toBeLessThanOrEqual(160); // never more than ~half the widest gap
      expect(h.beatHz).toBeLessThanOrEqual(0.6);
    }
  });

  it('Venus conjunction bells play a 5-note star-order phrase', () => {
    const p = buildPattern(bodies, {
      observer: 'earth', target: 'venus', type: 'path', frame: 'inertial', model: 'idealized',
      startJD: J2000, durationDays: 8 * 365.25, samples: 8000, chords: 10,
    });
    expect(p.approaches.length).toBe(5);
    const root = 100;
    const degrees = p.approaches.map((e) => PENTATONIC.indexOf(bellFrequency(root, e.angle, p.approaches[0].angle, 0) / root));
    expect(new Set(degrees).size).toBe(5); // all five degrees, each once
    const steps = degrees.slice(1).map((d, i) => (d - degrees[i] + 5) % 5);
    expect(new Set(steps).size).toBe(1); // a constant skip — the pentagram's order
  });
});
