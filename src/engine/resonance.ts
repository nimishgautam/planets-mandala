import type { BodyRegistry } from '../bodies/registry';
import { DAYS_PER_YEAR } from './time';

export type PatternType = 'path' | 'tether';
export type FrameKind = 'inertial' | 'corotating';

export interface Closure {
  days: number;
  /** worst phase mismatch at the end, in cycles (0 = perfect repeat) */
  error: number;
  /** how many orbits each involved body completes */
  cycles: { id: string; count: number }[];
  /** true if `error` is under the tolerance */
  closed: boolean;
}

/** Centre of the tether frame: common ancestor, lifted one level if it is one of the pair. */
export function tetherCenter(bodies: BodyRegistry, a: string, b: string): string {
  const c = bodies.lca(a, b);
  if (c === a || c === b) return bodies.get(c).parent ?? c;
  return c;
}

/** Orbital periods (days) whose phases determine whether the pattern repeats. */
export function involvedPeriods(
  bodies: BodyRegistry,
  observer: string,
  target: string,
  type: PatternType,
  frame: FrameKind,
): PeriodInfo[] {
  const center = type === 'path' ? bodies.lca(observer, target) : tetherCenter(bodies, observer, target);
  const ids = new Set([...bodies.chainTo(observer, center), ...bodies.chainTo(target, center)]);
  if (frame === 'corotating' && bodies.get(observer).parent) ids.add(observer);
  // Orbits far too small to see at the pattern's scale (Titania's wiggle as seen from Earth)
  // would otherwise dictate sample density and closure — skip them.
  const radius = (id: string) => bodies.get(id).orbit?.elements.a ?? 0;
  const maxA = Math.max(...[...ids].map(radius), 0);
  for (const id of [...ids]) if (radius(id) < maxA * VISIBLE_ORBIT_FRACTION) ids.delete(id);
  return [...ids]
    .map((id) => {
      const b = bodies.get(id);
      const e = b.orbit?.elements.e ?? 0;
      // near periapsis a body moves sqrt(1+e)/(1-e)^1.5 times faster than average
      const speedup = Math.sqrt(1 + e) / Math.pow(1 - e, 1.5);
      return { id, periodDays: b.periodDays!, samplingPeriod: b.periodDays! / speedup };
    })
    .filter((p) => p.periodDays > 0);
}

/** Orbits smaller than this fraction of the largest involved orbit are visually negligible. */
export const VISIBLE_ORBIT_FRACTION = 1e-3;

export interface PeriodInfo {
  id: string;
  periodDays: number;
  /** period shortened for eccentric orbits, so sampling resolves fast periapsis passages */
  samplingPeriod: number;
}

export interface ClosureOptions {
  /** acceptable leftover phase, in cycles */
  tolerance?: number;
  maxDays?: number;
  /** fallback: accept the shortest span under this looser tolerance before taking the best */
  looseTolerance?: number;
}

const phaseErr = (x: number) => Math.abs(x - Math.round(x));

/**
 * Find the shortest span T after which every involved body has completed a
 * near-integer number of orbits, so the pattern (nearly) closes on itself.
 * Candidates are integer multiples of each period; e.g. Earth–Venus → 8 yr (8:13).
 */
export function findClosure(
  periods: { id: string; periodDays: number }[],
  opts: ClosureOptions = {},
): Closure {
  const tol = opts.tolerance ?? 0.012;
  const loose = opts.looseTolerance ?? 0.05;
  const maxDays = opts.maxDays ?? 250 * DAYS_PER_YEAR;
  if (periods.length === 0) return { days: DAYS_PER_YEAR, error: 0, cycles: [], closed: true };

  const evaluate = (T: number) => {
    let err = 0;
    for (const p of periods) {
      const n = T / p.periodDays;
      if (Math.round(n) < 1) return Infinity;
      err = Math.max(err, phaseErr(n));
    }
    return err;
  };

  const candidates: number[] = [];
  for (const p of periods) {
    for (let k = 1; k * p.periodDays <= maxDays; k++) candidates.push(k * p.periodDays);
  }
  if (candidates.length === 0) {
    // even one orbit of the slowest body exceeds the budget; draw what we can
    candidates.push(maxDays);
  }
  candidates.sort((x, y) => x - y);

  // 1) shortest span that closes within tolerance; 2) else shortest that nearly closes;
  // 3) else the best we can find
  let best = candidates[candidates.length - 1];
  let bestErr = Infinity;
  let firstLoose: { T: number; err: number } | null = null;
  for (const T of candidates) {
    const err = evaluate(T);
    if (err < tol) {
      best = T;
      bestErr = err;
      firstLoose = null;
      break;
    }
    if (!firstLoose && err < loose) firstLoose = { T, err };
    if (err < bestErr - 1e-9) {
      best = T;
      bestErr = err;
    }
  }
  if (firstLoose && bestErr >= tol) {
    best = firstLoose.T;
    bestErr = firstLoose.err;
  }
  return {
    days: best,
    error: bestErr,
    closed: bestErr < tol,
    cycles: periods.map((p) => ({ id: p.id, count: best / p.periodDays })),
  };
}

/** Samples per orbit of the fastest involved body, and an overall vertex budget. */
export const SAMPLES_PER_FASTEST_ORBIT = 160;
export const SAMPLE_BUDGET = 400_000;
export const MIN_SAMPLES = 4000;

/**
 * Longest span worth searching: at least 250 years, or 4 orbits of the slowest body
 * (Neptune–Pluto needs ~495 yr), but never more than the sample budget allows.
 */
export function maxDaysForBudget(periods: PeriodInfo[]): number {
  const pMin = Math.min(...periods.map((p) => p.samplingPeriod), Infinity);
  const pMax = Math.max(...periods.map((p) => p.periodDays), 0);
  const byBudget = Number.isFinite(pMin) ? (SAMPLE_BUDGET / SAMPLES_PER_FASTEST_ORBIT) * pMin : Infinity;
  return Math.min(Math.max(250 * DAYS_PER_YEAR, 4 * pMax), byBudget);
}

export function samplesFor(periods: PeriodInfo[], days: number): number {
  const pMin = Math.min(...periods.map((p) => p.samplingPeriod), Infinity);
  const n = Number.isFinite(pMin) ? (days / pMin) * SAMPLES_PER_FASTEST_ORBIT : MIN_SAMPLES;
  return Math.round(Math.min(SAMPLE_BUDGET, Math.max(MIN_SAMPLES, n)));
}
