import * as THREE from 'three';
import { DEFAULT_STATE, GEOMETRY_KEYS, Store, type AppState, type View } from './app/store';
import { parseHash, syncUrl } from './app/urlState';
import { Drone } from './audio/drone';
import { bellFrequency, computeHarmony, describeHarmony } from './audio/harmony';
import { bodies } from './bodies/data';
import { buildPattern, type Pattern } from './engine/pattern';
import { findClosure, involvedPeriods, maxDaysForBudget, samplesFor } from './engine/resonance';
import { DAYS_PER_YEAR, dateToJD, isoToJD, jdToISO } from './engine/time';
import { easeInOut } from './render/common';
import { PatternView } from './render/patternView';
import { PickerView } from './render/pickerView';
import { Stage } from './render/renderer';
import { createAdvancedGui } from './ui/advancedGui';
import { Overlay } from './ui/overlay';

const store = new Store({ ...DEFAULT_STATE, ...parseHash(location.hash, bodies), playing: true, audio: false });
const stage = new Stage(document.getElementById('stage')!);
const picker = new PickerView(bodies, dateToJD(new Date()));
const patternView = new PatternView(bodies);
const drone = new Drone();

picker.model = store.get().model;
picker.rebuildRings();

// ---------------------------------------------------------------- camera
const PICKER_CAM = { pos: new THREE.Vector3(0, 280, 400), target: new THREE.Vector3(0, 0, 0) };
const PATTERN_CAM = { pos: new THREE.Vector3(0, 31, 0.01), target: new THREE.Vector3(0, 0, 0) };

let tween: { from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; t: number; dur: number } | null = null;
function flyTo(pos: THREE.Vector3, target: THREE.Vector3, from: THREE.Vector3, dur = 2.2) {
  stage.camera.position.copy(from);
  tween = { from: from.clone(), to: pos.clone(), tFrom: stage.controls.target.clone(), tTo: target.clone(), t: 0, dur };
}

// ---------------------------------------------------------------- pattern
let distRange = { min: 0, max: 1 };

function describeDuration(days: number): string {
  if (days < 60) return `${days.toFixed(days < 10 ? 2 : 1)} days`;
  return `${(days / DAYS_PER_YEAR).toFixed(days < 3 * DAYS_PER_YEAR ? 2 : 1)} years`;
}

function rebuild(): void {
  const s = store.get();
  const periods = involvedPeriods(bodies, s.a, s.b, s.type, s.frame);
  let days = s.years * DAYS_PER_YEAR;
  let closureNote = '';
  let cycles: { id: string; count: number }[] = periods.map((p) => ({ id: p.id, count: days / p.periodDays }));
  if (s.autoDuration) {
    const c = findClosure(periods, { tolerance: s.closureTolerance, maxDays: maxDaysForBudget(periods) });
    days = c.days;
    cycles = c.cycles;
    if (!c.closed) closureNote = ' · never quite repeats';
  }
  const startJD = isoToJD(s.start) ?? dateToJD(new Date());
  const pattern: Pattern = buildPattern(bodies, {
    observer: s.a,
    target: s.b,
    type: s.type,
    frame: s.frame,
    model: s.model,
    startJD,
    durationDays: days,
    samples: samplesFor(periods, days),
    chords: s.chords,
  });
  patternView.build(pattern, s);

  distRange = { min: Infinity, max: 0 };
  for (let k = 0; k <= 256; k++) {
    const d = pattern.distanceAU(k / 256);
    distRange.min = Math.min(distRange.min, d);
    distRange.max = Math.max(distRange.max, d);
  }

  const A = bodies.get(s.a).name;
  const B = bodies.get(s.b).name;
  const title = s.type === 'path' ? `${B}, as seen from ${A}` : `The dance of ${A} & ${B}`;
  const cyc = cycles
    .map((c) => {
      const n = Math.abs(c.count - Math.round(c.count)) < 0.02 ? String(Math.round(c.count)) : c.count.toFixed(2);
      return `${bodies.get(c.id).name} ×${n}`;
    })
    .join(' · ');
  const frame = pattern.frameApplied === 'corotating' ? ' · co-rotating' : '';
  const model = s.model === 'idealized' ? ' · idealized orbits' : '';
  overlay.setCaption(title, `${describeDuration(days)}${cyc ? ' · ' + cyc : ''}${closureNote}${frame}${model}`);

  if (s.autoDuration) store.set({ years: +(days / DAYS_PER_YEAR).toFixed(4) });
}

let rebuildTimer = 0;
const scheduleRebuild = () => {
  clearTimeout(rebuildTimer);
  rebuildTimer = window.setTimeout(rebuild, 90);
};

// ---------------------------------------------------------------- views
const fadeEl = document.getElementById('fade')!;
let switching = false;

function setView(view: View): void {
  if (switching || store.get().view === view) return;
  switching = true;
  fadeEl.classList.add('on');
  setTimeout(() => {
    store.set({ view });
    if (view === 'pattern') {
      rebuild();
      stage.setScene(patternView.scene);
      stage.controls.autoRotate = true;
      flyTo(PATTERN_CAM.pos, PATTERN_CAM.target, new THREE.Vector3(0, 46, 22));
    } else {
      stage.setScene(picker.scene);
      stage.controls.autoRotate = false;
      flyTo(PICKER_CAM.pos, PICKER_CAM.target, PICKER_CAM.pos.clone().multiplyScalar(1.35));
    }
    fadeEl.classList.remove('on');
    switching = false;
  }, 700);
}

// ---------------------------------------------------------------- UI
const overlay = new Overlay(store, bodies, {
  onGo: () => setView('pattern'),
  onBack: () => setView('picker'),
  onSeek: (u) => patternView.seek(u),
  onAudio: () => store.set({ audio: !store.get().audio }),
});

createAdvancedGui(store, stage, {
  onScaleChange: () => picker.buildBodies(),
  getPickerSpeed: () => picker.daysPerSecond,
  setPickerSpeed: (v) => (picker.daysPerSecond = v),
});

const harmonyFor = (s: AppState) => computeHarmony(bodies.get(s.a).tonePeriod, bodies.get(s.b).tonePeriod);

function syncAudio(s: AppState) {
  overlay.setSoundCaption(s.audio ? describeHarmony(harmonyFor(s), bodies.get(s.a).name, bodies.get(s.b).name) : '');
  if (s.audio) {
    drone.setHarmony(harmonyFor(s));
    drone.setShimmer(s.shimmer);
    void drone.start();
  } else drone.stop();
}

store.subscribe((s, changed) => {
  overlay.setFrameAvailable(!!bodies.get(s.a).parent);
  const geometryChanged = GEOMETRY_KEYS.some((k) => changed.has(k));
  const onlyAutoYears = changed.size === 1 && changed.has('years') && s.autoDuration;
  if (s.view === 'pattern' && geometryChanged && !onlyAutoYears && !switching) scheduleRebuild();
  if (changed.has('model')) {
    picker.model = s.model;
    picker.rebuildRings();
  }
  if (changed.has('audio') || (s.audio && (changed.has('a') || changed.has('b')))) syncAudio(s);
  if (changed.has('shimmer')) drone.setShimmer(s.shimmer);
});
overlay.setFrameAvailable(!!bodies.get(store.get().a).parent);
syncUrl(store);
window.addEventListener('hashchange', () => {
  const patch = parseHash(location.hash, bodies);
  const { view, ...rest } = patch;
  store.set(rest);
  if (view) setView(view);
});

// ---------------------------------------------------------------- picking
const canvas = stage.renderer.domElement;
let down: { x: number; y: number } | null = null;
canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
canvas.addEventListener('pointermove', (e) => {
  if (store.get().view !== 'picker') return;
  picker.hovered = picker.pick(e.clientX, e.clientY, stage.camera, canvas);
  document.body.classList.toggle('hovering', !!picker.hovered);
});
canvas.addEventListener('pointerup', (e) => {
  if (!down || store.get().view !== 'picker') return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved > 5) return;
  const id = picker.pick(e.clientX, e.clientY, stage.camera, canvas);
  if (id) overlay.pickFromScene(id);
});
canvas.addEventListener('dblclick', () => {
  if (store.get().view === 'picker' && picker.hovered) setView('pattern');
});

// ---------------------------------------------------------------- boot
if (store.get().view === 'pattern') {
  rebuild();
  stage.setScene(patternView.scene);
  stage.controls.autoRotate = true;
  flyTo(PATTERN_CAM.pos, PATTERN_CAM.target, new THREE.Vector3(0, 46, 22), 2.6);
} else {
  stage.setScene(picker.scene);
  flyTo(PICKER_CAM.pos, PICKER_CAM.target, PICKER_CAM.pos.clone().multiplyScalar(1.5), 3);
}

/** Ring bells for closest approaches crossed between two progress values. */
let prevProgress = 0;
function ringApproaches(p: Pattern, from: number, to: number, s: AppState) {
  const ev = p.approaches;
  if (!ev.length || !s.audio || !s.bells || !s.playing) return;
  const wrapped = to < from;
  if (!wrapped && to - from > 0.1) return; // a scrub jump, not playback
  if (wrapped && to + 1 - from > 0.1) return;
  const hit = ev.find((e) => (wrapped ? e.u > from || e.u <= to : e.u > from && e.u <= to));
  if (hit) drone.bell(bellFrequency(harmonyFor(s).root, hit.angle, ev[0].angle));
}

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const s = store.get();

  if (tween) {
    tween.t = Math.min(1, tween.t + dt / tween.dur);
    const k = easeInOut(tween.t);
    stage.camera.position.lerpVectors(tween.from, tween.to, k);
    stage.controls.target.lerpVectors(tween.tFrom, tween.tTo, k);
    if (tween.t >= 1) tween = null;
  }

  if (s.view === 'pattern') {
    patternView.update(dt, s);
    const p = patternView.current;
    if (p) {
      ringApproaches(p, prevProgress, patternView.progress, s);
      prevProgress = patternView.progress;
      const jd = patternView.currentJD();
      const elapsed = jd - p.params.startJD;
      const span = elapsed < 60 && p.params.durationDays < 120 ? `day ${elapsed.toFixed(1)}` : `year ${(elapsed / DAYS_PER_YEAR).toFixed(2)}`;
      overlay.setTransport(patternView.progress, `${jdToISO(jd)} · ${span}`);
      if (s.audio) {
        const d = p.distanceAU(patternView.progress);
        const span2 = distRange.max - distRange.min || 1;
        drone.setCloseness(1 - (d - distRange.min) / span2);
      }
    }
  } else {
    picker.update(dt, s.a, s.b, stage.camera);
  }

  stage.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// dev-only handle for debugging / automated checks
if (import.meta.env.DEV) Object.assign(window, { __app: { store, stage, picker, patternView, bodies, drone } });
