import { describe, expect, it } from 'vitest';
import { bodies, BODY_SPECS } from '../src/bodies/data';
import { validateSpecs } from '../src/bodies/registry';
import { J2000 } from '../src/bodies/units';
import { Ephemeris } from '../src/engine/ephemeris';
import { solveKepler } from '../src/engine/kepler';
import { buildPattern } from '../src/engine/pattern';
import { findClosure, involvedPeriods, maxDaysForBudget, samplesFor } from '../src/engine/resonance';
import { isoToJD } from '../src/engine/time';

const eph = new Ephemeris(bodies);
const lonDeg = (v: number[]) => ((Math.atan2(v[1], v[0]) * 180) / Math.PI + 360) % 360;
const angDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('kepler', () => {
  it('solves Kepler’s equation for a range of eccentricities', () => {
    for (const e of [0, 0.1, 0.5, 0.9, 0.97]) {
      for (let M = -3; M <= 3; M += 0.25) {
        const E = solveKepler(M, e);
        expect(E - e * Math.sin(E)).toBeCloseTo(M, 10);
      }
    }
  });
});

describe('body library', () => {
  it('is valid', () => {
    expect(validateSpecs(BODY_SPECS)).toEqual([]);
  });
  it('rejects bad specs', () => {
    const bad = [
      ...BODY_SPECS,
      { id: 'Bad Id', name: '', kind: 'moon', parent: 'nowhere', radiusKm: -1, color: 'red' } as never,
    ];
    const errors = validateSpecs(bad);
    expect(errors.length).toBeGreaterThanOrEqual(4);
    expect(errors.join('\n')).toMatch(/unknown parent 'nowhere'/);
  });
  it('orders bodies depth-first', () => {
    const order = bodies.all().map((b) => b.id);
    expect(order.slice(0, 6)).toEqual(['sun', 'mercury', 'venus', 'cruithne', 'earth', 'moon']);
    expect(order.indexOf('io')).toBe(order.indexOf('jupiter') + 1);
    expect(order.indexOf('triton')).toBe(order.indexOf('neptune') + 1);
    expect(order.length).toBe(33);
    expect(bodies.lca('io', 'moon')).toBe('sun');
    expect(bodies.lca('io', 'europa')).toBe('jupiter');
  });
  it('Galilean moons satisfy the Laplace resonance λ1 − 3λ2 + 2λ3 ≈ 180°', () => {
    const L = (id: string, jd: number) => {
      const b = bodies.get(id);
      return b.orbit!.elements.L + b.meanMotion! * (jd - J2000);
    };
    for (const jd of [J2000, J2000 + 5000]) {
      const lap = (((L('io', jd) - 3 * L('europa', jd) + 2 * L('ganymede', jd)) % 360) + 360) % 360;
      expect(angDiff(lap, 180)).toBeLessThan(1);
    }
  });
});

describe('ephemeris (keplerian)', () => {
  it('Earth heliocentric longitude at J2000 ≈ 100.4°', () => {
    expect(angDiff(lonDeg(eph.heliocentric('earth', J2000, 'keplerian')), 100.37)).toBeLessThan(0.3);
  });

  const elongation = (id: string, iso: string) => {
    const jd = isoToJD(iso)!;
    const sun = eph.relative('sun', 'earth', jd, 'keplerian');
    const p = eph.relative(id, 'earth', jd, 'keplerian');
    return angDiff(lonDeg(sun), lonDeg(p));
  };
  it('Venus inferior conjunction ~2026-10-24', () => expect(elongation('venus', '2026-10-24')).toBeLessThan(3));
  it('Jupiter opposition ~2026-01-10', () => expect(elongation('jupiter', '2026-01-10')).toBeGreaterThan(178));
  it('Mars opposition ~2027-02-19', () => expect(elongation('mars', '2027-02-19')).toBeGreaterThan(176));
  it('Moon ~384,000 km from Earth', () => {
    const r = Math.hypot(...eph.relative('moon', 'earth', J2000 + 1234, 'keplerian')) * 149597870.7;
    expect(r).toBeGreaterThan(356_000);
    expect(r).toBeLessThan(407_000);
  });
});

describe('patterns', () => {
  const base = {
    observer: 'earth', target: 'venus', type: 'path' as const, frame: 'inertial' as const,
    model: 'idealized' as const, startJD: J2000, samples: 6000, chords: 400,
  };

  it('auto duration for Earth–Venus is 8 years (13 Venus orbits)', () => {
    const c = findClosure(involvedPeriods(bodies, 'earth', 'venus', 'path', 'inertial'));
    expect(c.days / 365.25).toBeCloseTo(8, 1);
    expect(c.closed).toBe(true);
    expect(Math.round(c.cycles.find((x) => x.id === 'venus')!.count)).toBe(13);
  });

  it('the Earth→Venus path nearly closes after 8 years', () => {
    const p = buildPattern(bodies, { ...base, model: 'keplerian', durationDays: 8 * 365.25 });
    const pos = p.path!.positions;
    const n = pos.length;
    const gap = Math.hypot(pos[0] - pos[n - 3], pos[1] - pos[n - 2], pos[2] - pos[n - 1]) / p.scale;
    expect(gap).toBeLessThan(0.04); // AU
  });

  it('idealized Earth→Venus has 5-fold symmetry (closest approaches 72° apart)', () => {
    const p = buildPattern(bodies, { ...base, durationDays: 8 * 365.25 });
    const pos = p.path!.positions;
    const r = (k: number) => Math.hypot(pos[k * 3], pos[k * 3 + 1]);
    const angles: number[] = [];
    for (let k = 1; k < base.samples - 1; k++) {
      if (r(k) < r(k - 1) && r(k) < r(k + 1)) angles.push(lonDeg([pos[k * 3], pos[k * 3 + 1]]));
    }
    expect(angles.length).toBe(5);
    angles.sort((a, b) => a - b);
    for (let i = 0; i < 5; i++) {
      // the 13:8 ratio is not exact, so the star drifts ~2.4° per 8 years
      expect(Math.abs(angDiff(angles[(i + 1) % 5], angles[i]) - 72)).toBeLessThan(2.5);
    }
  });

  it('co-rotating frame keeps the Sun fixed on +x for an Earth observer', () => {
    const p = buildPattern(bodies, { ...base, target: 'sun', frame: 'corotating', model: 'keplerian', durationDays: 365 });
    const pos = p.path!.positions;
    for (let k = 0; k < pos.length; k += 300) {
      expect(Math.abs(Math.atan2(pos[k + 1], pos[k]))).toBeLessThan(1e-3);
    }
  });

  it('tether frame centre lifts above the pair (Earth–Moon → Sun)', () => {
    const p = buildPattern(bodies, { ...base, target: 'moon', type: 'tether', durationDays: 30 });
    expect(p.center).toBe('sun');
    expect(p.chords!.positions.length).toBe(400 * 6);
  });
});

describe('extended library vs. real events', () => {
  const sep = (a: string, b: string, iso: string) => {
    const jd = isoToJD(iso)!;
    const pa = eph.relative(a, 'earth', jd, 'keplerian');
    const pb = eph.relative(b, 'earth', jd, 'keplerian');
    const dot = pa[0] * pb[0] + pa[1] * pb[1] + pa[2] * pb[2];
    return (Math.acos(dot / Math.hypot(...pa) / Math.hypot(...pb)) * 180) / Math.PI;
  };
  const rSun = (id: string, iso: string) => Math.hypot(...eph.heliocentric(id, isoToJD(iso)!, 'keplerian'));

  it('Great Conjunction of Jupiter and Saturn, 2020-12-21 (≈0.1° apart)', () => {
    expect(sep('jupiter', 'saturn', '2020-12-21')).toBeLessThan(0.6);
    expect(sep('jupiter', 'saturn', '2021-12-21')).toBeGreaterThan(5);
  });
  it("Halley's perihelion 1986-02-09 at ≈0.587 AU", () => {
    // SBDB's 1974 osculating elements give q = a(1−e) = 0.575 AU; within 2% of the real 0.587
    expect(Math.abs(rSun('halley', '1986-02-09') - 0.587)).toBeLessThan(0.015);
    expect(rSun('halley', '1986-06-01')).toBeGreaterThan(1.5);
  });
  it('Pluto perihelion ~1989-09 (≈29.7 AU)', () => {
    expect(rSun('pluto', '1989-09-05')).toBeCloseTo(29.66, 0);
  });
  it('Titan sits ≈1.22 million km from Saturn', () => {
    const r = Math.hypot(...eph.relative('titan', 'saturn', J2000 + 100, 'keplerian')) * 149597870.7;
    expect(r).toBeGreaterThan(1.18e6);
    expect(r).toBeLessThan(1.26e6);
  });
  it('Uranus moons orbit nearly perpendicular to the ecliptic', () => {
    let zMax = 0;
    for (let d = 0; d < 9; d += 0.25) zMax = Math.max(zMax, Math.abs(eph.relative('titania', 'uranus', J2000 + d, 'keplerian')[2]));
    expect(zMax / bodies.get('titania').orbit!.elements.a).toBeGreaterThan(0.9);
  });
  it('Triton is retrograde in idealized mode too', () => {
    const a = eph.relative('triton', 'neptune', J2000, 'idealized');
    const b = eph.relative('triton', 'neptune', J2000 + 0.5, 'idealized');
    expect(a[0] * b[1] - a[1] * b[0]).toBeLessThan(0);
  });
  it('Neptune–Pluto closes on their 3:2 resonance (~495 years)', () => {
    const periods = involvedPeriods(bodies, 'neptune', 'pluto', 'tether', 'inertial');
    const c = findClosure(periods, { maxDays: maxDaysForBudget(periods) });
    expect(c.days / 365.25).toBeGreaterThan(480);
    expect(c.days / 365.25).toBeLessThan(510);
  });
  it('Earth–Saturn falls back to a near-closure instead of centuries', () => {
    const periods = involvedPeriods(bodies, 'earth', 'saturn', 'path', 'inertial');
    const c = findClosure(periods, { maxDays: maxDaysForBudget(periods) });
    expect(c.days / 365.25).toBeLessThan(60);
  });
  it("Halley's samples resolve perihelion (eccentric sampling)", () => {
    const periods = involvedPeriods(bodies, 'sun', 'halley', 'path', 'inertial');
    expect(samplesFor(periods, bodies.get('halley').periodDays!)).toBeGreaterThan(20_000);
  });
});

describe('visual relevance', () => {
  it('ignores sub-pixel orbits when choosing duration (Earth→Titania follows Uranus, not Titania)', () => {
    const ids = involvedPeriods(bodies, 'earth', 'titania', 'path', 'inertial').map((p) => p.id);
    expect(ids).toContain('uranus');
    expect(ids).not.toContain('titania');
  });
  it('keeps moon orbits that are the whole story (Jupiter→Io, Sun→Moon)', () => {
    expect(involvedPeriods(bodies, 'jupiter', 'io', 'path', 'inertial').map((p) => p.id)).toEqual(['io']);
    expect(involvedPeriods(bodies, 'sun', 'moon', 'path', 'inertial').map((p) => p.id)).toContain('moon');
  });
});
