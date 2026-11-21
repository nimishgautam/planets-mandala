import * as THREE from 'three';
import type { AppState } from '../app/store';
import type { BodyRegistry } from '../bodies/registry';
import type { Vec3 } from '../engine/kepler';
import type { Pattern, Track } from '../engine/pattern';
import { createStarfield, eclToScene, glowSprite, swizzleToScene } from './common';
import { COLOR_MODE_INDEX, DRAW_MODE_INDEX, createTrailMaterial } from './trailMaterial';

type Phase = 'run' | 'hold' | 'fadeout';
const HOLD_SECONDS = 2.5;
const FADEOUT_SECONDS = 2.5;
const FADEIN_SECONDS = 1.4;

interface TrailObject {
  obj: THREE.Line | THREE.LineSegments;
  material: THREE.ShaderMaterial;
  /** intensity multiplier relative to the user's setting */
  gain: number;
  overdraw: number;
}

export class PatternView {
  readonly scene = new THREE.Scene();
  private root = new THREE.Group();
  private trails: TrailObject[] = [];
  private markerA = new THREE.Group();
  private markerB = new THREE.Group();
  private link: THREE.Line;
  private pattern: Pattern | null = null;

  /** normalized time 0..1 */
  progress = 0;
  private phase: Phase = 'run';
  private phaseTime = 0;
  private fadeIn = 0;
  private a: Vec3 = [0, 0, 0];
  private b: Vec3 = [0, 0, 0];

  constructor(private bodies: BodyRegistry) {
    this.scene.add(createStarfield());
    this.scene.add(this.root);
    this.scene.add(this.markerA, this.markerB);
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    this.link = new THREE.Line(
      linkGeo,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.scene.add(this.link);
  }

  get current(): Pattern | null {
    return this.pattern;
  }

  build(pattern: Pattern, state: AppState): void {
    this.clear();
    this.pattern = pattern;
    const { observer, target, type } = pattern.params;
    const colA = new THREE.Color(this.bodies.get(observer).color);
    const colB = new THREE.Color(this.bodies.get(target).color);

    const addTrack = (track: Track, segments: boolean, gain: number, colorB: THREE.Color) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(swizzleToScene(track.positions), 3));
      geo.setAttribute('aTime', new THREE.BufferAttribute(track.times, 1));
      geo.setAttribute('aSpeed', new THREE.BufferAttribute(track.speeds, 1));
      const material = createTrailMaterial();
      material.uniforms.uColorA.value.copy(colA);
      material.uniforms.uColorB.value.copy(colorB);
      const obj = segments ? new THREE.LineSegments(geo, material) : new THREE.Line(geo, material);
      obj.frustumCulled = false;
      this.root.add(obj);
      this.trails.push({ obj, material, gain, overdraw: track.overdraw });
    };

    if (type === 'path' && pattern.path) {
      addTrack(pattern.path, false, 1, colB);
    } else {
      if (pattern.orbitA) addTrack(pattern.orbitA, false, 0.35, colA);
      if (pattern.orbitB) addTrack(pattern.orbitB, false, 0.35, colB);
      if (pattern.chords) addTrack(pattern.chords, true, Math.min(0.3, 85 / pattern.params.chords), colB);
    }

    const markerFor = (group: THREE.Group, color: THREE.Color, size: number) => {
      group.clear();
      group.add(glowSprite(color, size * 2.2, 0.55));
      group.add(glowSprite(0xffffff, size * 0.5, 0.9));
    };
    markerFor(this.markerA, colA, type === 'path' ? 0.9 : 0.6);
    markerFor(this.markerB, colB, 0.6);
    this.link.visible = true;

    this.progress = 0;
    this.phase = 'run';
    this.phaseTime = 0;
    this.fadeIn = 0;
    this.applyUniforms(state, 0);
  }

  clear(): void {
    for (const t of this.trails) {
      t.obj.geometry.dispose();
      t.material.dispose();
      this.root.remove(t.obj);
    }
    this.trails = [];
    this.pattern = null;
  }

  /** Jump to a normalized time (scrubbing). */
  seek(u: number): void {
    this.progress = Math.min(1, Math.max(0, u));
    this.phase = 'run';
    this.phaseTime = 0;
  }

  update(dt: number, state: AppState): void {
    if (!this.pattern) return;
    this.fadeIn = Math.min(1, this.fadeIn + dt / FADEIN_SECONDS);
    let global = 1;

    if (state.playing) {
      const du = dt / Math.max(1, state.cycleSeconds);
      if (state.draw === 'trace') {
        if (this.phase === 'run') {
          this.progress += du;
          if (this.progress >= 1) {
            this.progress = 1;
            this.phase = 'hold';
            this.phaseTime = 0;
          }
        } else {
          this.phaseTime += dt;
          if (this.phase === 'hold' && this.phaseTime > HOLD_SECONDS) {
            this.phase = 'fadeout';
            this.phaseTime = 0;
          } else if (this.phase === 'fadeout' && this.phaseTime > FADEOUT_SECONDS) {
            this.phase = 'run';
            this.progress = 0;
            this.phaseTime = 0;
          }
        }
      } else {
        this.progress = (this.progress + du) % 1;
        this.phase = 'run';
      }
    }
    if (state.draw === 'trace' && this.phase === 'fadeout') global = 1 - this.phaseTime / FADEOUT_SECONDS;

    this.applyUniforms(state, global * this.fadeIn);
    this.updateMarkers(state);
  }

  private applyUniforms(state: AppState, global: number): void {
    for (const t of this.trails) {
      const u = t.material.uniforms;
      u.uNow.value = this.progress;
      u.uFade.value = state.fade;
      // a curve that retraces itself hundreds of times would saturate under additive blending;
      // scale by how much of it is visible at once
      const visible = t.overdraw * (state.draw === 'fleeting' ? Math.min(1, state.fade * 1.5) : 1);
      const density = Math.min(1, Math.max(0.0003, 3 / Math.max(1, visible)));
      u.uIntensity.value = state.intensity * t.gain * density;
      u.uGlobal.value = global;
      u.uHueCycles.value = state.hueCycles;
      u.uDrawMode.value = DRAW_MODE_INDEX[state.draw];
      u.uColorMode.value = COLOR_MODE_INDEX[state.color];
      u.uLoop.value = state.draw === 'fleeting';
      u.uZScale.value = state.zScale;
    }
  }

  private updateMarkers(state: AppState): void {
    const p = this.pattern!;
    p.sampleAt(this.progress, this.a, this.b);
    eclToScene(this.a[0], this.a[1], this.a[2] * state.zScale, this.markerA.position);
    eclToScene(this.b[0], this.b[1], this.b[2] * state.zScale, this.markerB.position);
    const pos = this.link.geometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(0, this.markerA.position.x, this.markerA.position.y, this.markerA.position.z);
    pos.setXYZ(1, this.markerB.position.x, this.markerB.position.y, this.markerB.position.z);
    pos.needsUpdate = true;
    // subtle breathing of the target marker
    const s = 1 + 0.08 * Math.sin(performance.now() / 700);
    this.markerB.scale.setScalar(s);
  }

  /** JD at the current progress. */
  currentJD(): number {
    const p = this.pattern;
    return p ? p.params.startJD + this.progress * p.params.durationDays : 0;
  }
}
