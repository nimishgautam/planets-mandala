import type { BodyRegistry } from '../bodies/registry';
import { isoToJD } from '../engine/time';
import { DEFAULT_STATE, type AppState, type Store } from './store';

/** Keys persisted in the URL hash (playback/audio are session-only). */
const ENUMS: Partial<Record<keyof AppState, readonly string[]>> = {
  view: ['picker', 'pattern'],
  type: ['path', 'tether'],
  frame: ['inertial', 'corotating'],
  model: ['keplerian', 'idealized'],
  draw: ['full', 'trace', 'fleeting'],
  color: ['solid', 'time', 'speed'],
};
const NUMBERS: (keyof AppState)[] = ['chords', 'cycleSeconds', 'fade', 'intensity', 'hueCycles', 'zScale'];

export function parseHash(hash: string, bodies: BodyRegistry): Partial<AppState> {
  const q = new URLSearchParams(hash.replace(/^#/, ''));
  const out: Partial<AppState> = {};
  const set = <K extends keyof AppState>(k: K, v: AppState[K]) => (out[k] = v);

  for (const k of ['a', 'b'] as const) {
    const v = q.get(k);
    if (v && bodies.has(v)) set(k, v);
  }
  for (const [k, allowed] of Object.entries(ENUMS) as [keyof AppState, readonly string[]][]) {
    const v = q.get(k);
    if (v && allowed.includes(v)) (out as Record<string, unknown>)[k] = v;
  }
  for (const k of NUMBERS) {
    const v = q.get(k);
    if (v !== null && v !== '' && Number.isFinite(+v)) (out as Record<string, unknown>)[k] = +v;
  }
  const years = q.get('years');
  if (years === 'auto') set('autoDuration', true);
  else if (years && +years > 0) {
    set('autoDuration', false);
    set('years', +years);
  }
  const start = q.get('start');
  if (start && isoToJD(start) !== null) set('start', start);
  if (out.a && out.a === (out.b ?? DEFAULT_STATE.b)) delete out.b;
  return out;
}

export function serialize(s: AppState): string {
  const q = new URLSearchParams();
  q.set('a', s.a);
  q.set('b', s.b);
  q.set('view', s.view);
  q.set('type', s.type);
  q.set('frame', s.frame);
  q.set('model', s.model);
  q.set('draw', s.draw);
  q.set('color', s.color);
  q.set('years', s.autoDuration ? 'auto' : String(+s.years.toFixed(4)));
  q.set('start', s.start);
  for (const k of NUMBERS) {
    if (s[k] !== DEFAULT_STATE[k]) q.set(k, String(s[k]));
  }
  return '#' + q.toString();
}

export function syncUrl(store: Store): void {
  let timer = 0;
  store.subscribe((s) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => history.replaceState(null, '', serialize(s)), 250);
  });
}
