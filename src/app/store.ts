import type { OrbitModel } from '../engine/ephemeris';
import type { FrameKind, PatternType } from '../engine/resonance';

export type View = 'picker' | 'pattern';
export type DrawMode = 'full' | 'trace' | 'fleeting';
export type ColorMode = 'solid' | 'time' | 'speed';

export interface AppState {
  view: View;
  /** observer — the stationary body at the centre */
  a: string;
  /** target — the body whose motion is traced */
  b: string;
  type: PatternType;
  frame: FrameKind;
  model: OrbitModel;
  draw: DrawMode;
  color: ColorMode;
  autoDuration: boolean;
  years: number;
  /** start date, 'YYYY-MM-DD' */
  start: string;
  chords: number;
  /** seconds for one full pass through the pattern */
  cycleSeconds: number;
  /** fleeting-mode trail length, as a fraction of the whole pattern */
  fade: number;
  intensity: number;
  hueCycles: number;
  zScale: number;
  closureTolerance: number;
  playing: boolean;
  audio: boolean;
  /** turn the snapping error into slow beating (off = pure consonance) */
  shimmer: boolean;
  /** ring a bell at each closest approach */
  bells: boolean;
}

export const DEFAULT_STATE: AppState = {
  view: 'picker',
  a: 'earth',
  b: 'venus',
  type: 'path',
  frame: 'inertial',
  model: 'keplerian',
  draw: 'fleeting',
  color: 'time',
  autoDuration: true,
  years: 8,
  start: new Date().toISOString().slice(0, 10),
  chords: 720,
  cycleSeconds: 60,
  fade: 0.18,
  intensity: 0.7,
  hueCycles: 1,
  zScale: 1,
  closureTolerance: 0.012,
  playing: true,
  audio: false,
  shimmer: true,
  bells: true,
};

type Listener = (state: AppState, changed: Set<keyof AppState>) => void;

export class Store {
  private state: AppState;
  private listeners = new Set<Listener>();

  constructor(initial: AppState) {
    this.state = { ...initial };
  }

  get(): Readonly<AppState> {
    return this.state;
  }

  set(patch: Partial<AppState>): void {
    const changed = new Set<keyof AppState>();
    for (const k of Object.keys(patch) as (keyof AppState)[]) {
      if (patch[k] !== undefined && patch[k] !== this.state[k]) changed.add(k);
    }
    if (!changed.size) return;
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.state, changed);
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}

/** Changing any of these requires recomputing the pattern geometry. */
export const GEOMETRY_KEYS: (keyof AppState)[] = [
  'a', 'b', 'type', 'frame', 'model', 'autoDuration', 'years', 'start', 'chords', 'closureTolerance',
];
