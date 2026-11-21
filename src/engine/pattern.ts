import type { BodyRegistry } from '../bodies/registry';
import type { Vec3 } from './kepler';
import { Ephemeris, type OrbitModel } from './ephemeris';
import { tetherCenter, type FrameKind, type PatternType } from './resonance';

export interface PatternParams {
  /** body at the centre of the frame (the "stationary" one) */
  observer: string;
  /** body whose motion is traced */
  target: string;
  type: PatternType;
  frame: FrameKind;
  model: OrbitModel;
  startJD: number;
  durationDays: number;
  /** vertices along each traced curve */
  samples: number;
  /** tether mode: number of chords */
  chords: number;
}

/** A polyline (or segment list) with per-vertex normalized time and speed. */
export interface Track {
  /** xyz, ecliptic axes, scaled so the pattern fits in SCENE_RADIUS */
  positions: Float32Array;
  /** 0..1 along the pattern's duration */
  times: Float32Array;
  /** 0..1, relative speed (path) or closeness (chords) */
  speeds: Float32Array;
  /** how many times the track covers a circle of SCENE_RADIUS — used to normalize brightness */
  overdraw: number;
}

export interface Pattern {
  params: PatternParams;
  /** id of the body at the frame origin */
  center: string;
  /** whether the requested frame could be honoured (co-rotating needs an orbiting observer) */
  frameApplied: FrameKind;
  /** scene units per AU */
  scale: number;
  path?: Track;
  orbitA?: Track;
  orbitB?: Track;
  chords?: Track;
  /** positions of observer (a) and target (b) at normalized time u, in scene units */
  sampleAt(u: number, outA: Vec3, outB: Vec3): void;
  /** true distance between the pair at u, AU */
  distanceAU(u: number): number;
  /** closest approaches: normalized time and direction (rad) of target from observer in the frame */
  approaches: { u: number; angle: number }[];
}

export const SCENE_RADIUS = 10;

export function buildPattern(bodies: BodyRegistry, params: PatternParams): Pattern {
  const eph = new Ephemeris(bodies);
  const { observer, target, type, model, startJD, durationDays } = params;
  const obsBody = bodies.get(observer);
  const frameApplied: FrameKind = params.frame === 'corotating' && obsBody.parent ? 'corotating' : 'inertial';
  const center = type === 'path' ? observer : tetherCenter(bodies, observer, target);

  const loc: Vec3 = [0, 0, 0];
  const pA: Vec3 = [0, 0, 0];
  const pB: Vec3 = [0, 0, 0];

  /** raw positions (AU) of observer & target in the chosen frame */
  const rawAt = (jd: number, outA: Vec3, outB: Vec3) => {
    if (type === 'path') {
      outA[0] = outA[1] = outA[2] = 0;
      eph.relative(target, observer, jd, model, outB);
    } else {
      eph.relative(observer, center, jd, model, outA);
      eph.relative(target, center, jd, model, outB);
    }
    if (frameApplied === 'corotating') {
      // rotate about the ecliptic pole so the observer's parent sits on +x
      eph.local(observer, jd, model, loc);
      const th = Math.atan2(-loc[1], -loc[0]);
      const c = Math.cos(th), s = Math.sin(th);
      for (const v of [outA, outB]) {
        const x = v[0], y = v[1];
        v[0] = c * x + s * y;
        v[1] = -s * x + c * y;
      }
    }
  };

  const jdAt = (u: number) => startJD + u * durationDays;

  const N = Math.max(2, Math.floor(params.samples));
  const rawA = new Float64Array(N * 3);
  const rawB = new Float64Array(N * 3);
  let maxR = 0;
  for (let k = 0; k < N; k++) {
    rawAt(jdAt(k / (N - 1)), pA, pB);
    rawA.set(pA, k * 3);
    rawB.set(pB, k * 3);
    maxR = Math.max(maxR, Math.hypot(pA[0], pA[1], pA[2]), Math.hypot(pB[0], pB[1], pB[2]));
  }
  const scale = maxR > 0 ? SCENE_RADIUS / maxR : 1;

  const toTrack = (raw: Float64Array): Track => {
    const positions = new Float32Array(N * 3);
    const times = new Float32Array(N);
    const speeds = new Float32Array(N);
    let maxSpeed = 0;
    let length = 0;
    for (let k = 0; k < N; k++) {
      positions[k * 3] = raw[k * 3] * scale;
      positions[k * 3 + 1] = raw[k * 3 + 1] * scale;
      positions[k * 3 + 2] = raw[k * 3 + 2] * scale;
      times[k] = k / (N - 1);
      const j = k === 0 ? 1 : k;
      const sp = Math.hypot(raw[j * 3] - raw[j * 3 - 3], raw[j * 3 + 1] - raw[j * 3 - 2], raw[j * 3 + 2] - raw[j * 3 - 1]);
      speeds[k] = sp;
      if (k > 0) length += sp * scale;
      maxSpeed = Math.max(maxSpeed, sp);
    }
    if (maxSpeed > 0) for (let k = 0; k < N; k++) speeds[k] /= maxSpeed;
    return { positions, times, speeds, overdraw: length / (2 * Math.PI * SCENE_RADIUS) };
  };

  const pattern: Pattern = {
    params,
    approaches: findApproaches(rawA, rawB, N),
    center,
    frameApplied,
    scale,
    sampleAt(u, outA, outB) {
      rawAt(jdAt(u), outA, outB);
      for (let i = 0; i < 3; i++) {
        outA[i] *= scale;
        outB[i] *= scale;
      }
    },
    distanceAU(u) {
      eph.relative(target, observer, jdAt(u), model, loc);
      return Math.hypot(loc[0], loc[1], loc[2]);
    },
  };

  if (type === 'path') {
    pattern.path = toTrack(rawB);
    return pattern;
  }

  // tether: two faint orbits + chords between simultaneous positions
  if (center !== observer) pattern.orbitA = toTrack(rawA);
  pattern.orbitB = toTrack(rawB);
  const M = Math.max(1, Math.floor(params.chords));
  const positions = new Float32Array(M * 6);
  const times = new Float32Array(M * 2);
  const lengths = new Float32Array(M);
  let maxLen = 0, minLen = Infinity;
  for (let j = 0; j < M; j++) {
    const u = M === 1 ? 0 : j / (M - 1);
    pattern.sampleAt(u, pA, pB);
    positions.set(pA, j * 6);
    positions.set(pB, j * 6 + 3);
    times[j * 2] = times[j * 2 + 1] = u;
    const len = Math.hypot(pB[0] - pA[0], pB[1] - pA[1], pB[2] - pA[2]);
    lengths[j] = len;
    maxLen = Math.max(maxLen, len);
    minLen = Math.min(minLen, len);
  }
  const speeds = new Float32Array(M * 2);
  const span = maxLen - minLen || 1;
  for (let j = 0; j < M; j++) speeds[j * 2] = speeds[j * 2 + 1] = 1 - (lengths[j] - minLen) / span;
  pattern.chords = { positions, times, speeds, overdraw: 1 };
  return pattern;
}

/** Local minima of the observer–target distance (skipped if the distance is ~constant). */
function findApproaches(rawA: Float64Array, rawB: Float64Array, N: number): { u: number; angle: number }[] {
  const d = new Float64Array(N);
  let min = Infinity, max = 0;
  for (let k = 0; k < N; k++) {
    d[k] = Math.hypot(rawB[k * 3] - rawA[k * 3], rawB[k * 3 + 1] - rawA[k * 3 + 1], rawB[k * 3 + 2] - rawA[k * 3 + 2]);
    min = Math.min(min, d[k]);
    max = Math.max(max, d[k]);
  }
  if (max === 0 || (max - min) / max < 1e-4) return [];
  const out: { u: number; angle: number }[] = [];
  for (let k = 1; k < N - 1; k++) {
    if (d[k] < d[k - 1] && d[k] <= d[k + 1]) {
      const dx = rawB[k * 3] - rawA[k * 3], dy = rawB[k * 3 + 1] - rawA[k * 3 + 1];
      out.push({ u: k / (N - 1), angle: Math.atan2(dy, dx) });
    }
  }
  return out;
}
