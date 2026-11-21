import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { Body, BodyRegistry } from '../bodies/registry';
import { Ephemeris, type OrbitModel } from '../engine/ephemeris';
import type { Vec3 } from '../engine/kepler';
import { createStarfield, eclToScene, glowSprite } from './common';
import { displayRadius, scaleOffset } from './displayScale';

/** Fast moons are slowed in the picker so none completes an orbit quicker than this. */
const MIN_ORBIT_SECONDS = 14;
/** Small bodies (asteroids, comets) only get labels when the camera is this close, or on hover. */
const SMALL_LABEL_DISTANCE = 90;

const OBSERVER_COLOR = new THREE.Color('#8fd8ff');
const TARGET_COLOR = new THREE.Color('#ffb3d1');

interface BodyNode {
  body: Body;
  group: THREE.Group;          // positioned at the body's display location
  mesh: THREE.Mesh;
  halo: THREE.Sprite;
  ring?: THREE.LineLoop;       // orbit about the parent, lives in the parent's group frame
  ringHolder?: THREE.Group;
  label: CSS2DObject;
  radius: number;
}

/** The "pick two bodies" solar system, with compressed display scaling. */
export class PickerView {
  readonly scene = new THREE.Scene();
  private nodes = new Map<string, BodyNode>();
  private eph: Ephemeris;
  private link: THREE.Line;
  private selA: THREE.Sprite;
  private selB: THREE.Sprite;
  private local: Vec3 = [0, 0, 0];
  private tmp = new THREE.Vector3();
  hovered: string | null = null;
  /** date the picker opened on; each body runs at its own (possibly slowed) pace from here */
  readonly jd0: number;
  private elapsedDays = 0;
  daysPerSecond = 0.25;
  model: OrbitModel = 'keplerian';

  constructor(private bodies: BodyRegistry, jd: number) {
    this.eph = new Ephemeris(bodies);
    this.jd0 = jd;
    this.scene.add(createStarfield());
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.14));
    const sunLight = new THREE.PointLight(0xfff1dd, 2.2, 0, 0);
    this.scene.add(sunLight);

    this.selA = glowSprite(OBSERVER_COLOR, 1, 0.9);
    this.selB = glowSprite(TARGET_COLOR, 1, 0.9);
    this.scene.add(this.selA, this.selB);

    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    this.link = new THREE.Line(
      linkGeo,
      new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.8, gapSize: 0.6, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    this.scene.add(this.link);

    this.buildBodies();
  }

  /** (Re)create meshes — call after changing display scaling constants. */
  buildBodies(): void {
    for (const n of this.nodes.values()) {
      n.group.removeFromParent();
      n.ringHolder?.removeFromParent();
      n.label.element.remove();
      n.mesh.geometry.dispose();
    }
    this.nodes.clear();

    for (const body of this.bodies.all()) {
      const radius = displayRadius(body);
      const group = new THREE.Group();
      const isStar = body.kind === 'star';
      const color = new THREE.Color(body.color);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 48, 32),
        isStar
          ? new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(1.6) })
          : new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, emissive: color, emissiveIntensity: 0.06 }),
      );
      group.add(mesh);
      const halo = glowSprite(color, radius * (isStar ? 5 : 3.2), isStar ? 0.9 : 0.22);
      group.add(halo);

      const el = document.createElement('div');
      el.className = 'body-label';
      el.textContent = body.name;
      const label = new CSS2DObject(el);
      label.position.set(0, radius + 0.6, 0);
      label.center.set(0.5, 1);
      group.add(label);

      this.scene.add(group);
      const node: BodyNode = { body, group, mesh, halo, label, radius };

      if (body.parent) {
        const holder = new THREE.Group();
        const ring = this.makeRing(body);
        holder.add(ring);
        this.scene.add(holder);
        node.ring = ring;
        node.ringHolder = holder;
      }
      this.nodes.set(body.id, node);
    }
    this.layout();
  }

  /** Days since jd0 for this body, slowed down for fast orbiters. */
  private bodyJD(body: Body): number {
    const P = body.periodDays ?? Infinity;
    const slow = Math.min(1, P / (Math.max(1e-9, this.daysPerSecond) * MIN_ORBIT_SECONDS));
    return this.jd0 + this.elapsedDays * slow;
  }

  private makeRing(body: Body): THREE.LineLoop {
    const parent = this.bodies.get(body.parent!);
    const P = body.periodDays!;
    const e = body.orbit!.elements.e;
    // eccentric orbits need many more points to resolve the periapsis swing
    const N = 256 * Math.ceil(1 + 30 * e ** 3);
    const pts = new Float32Array(N * 3);
    for (let k = 0; k < N; k++) {
      this.eph.local(body.id, this.jd0 + (k / N) * P, this.model, this.local);
      scaleOffset(body, parent, this.local);
      eclToScene(this.local[0], this.local[1], this.local[2], this.tmp);
      pts.set([this.tmp.x, this.tmp.y, this.tmp.z], k * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const ring = new THREE.LineLoop(
      geo,
      new THREE.LineBasicMaterial({ color: body.color, transparent: true, opacity: body.kind === 'moon' ? 0.18 : body.kind === 'asteroid' || body.kind === 'comet' ? 0.11 : 0.22, depthWrite: false }),
    );
    return ring;
  }

  /** Position every body at its scaled location for the current JD. */
  private layout(): void {
    for (const body of this.bodies.all()) {
      const node = this.nodes.get(body.id)!;
      if (!body.parent) {
        node.group.position.set(0, 0, 0);
        continue;
      }
      const parentNode = this.nodes.get(body.parent)!;
      this.eph.local(body.id, this.bodyJD(body), this.model, this.local);
      scaleOffset(body, parentNode.body, this.local);
      eclToScene(this.local[0], this.local[1], this.local[2], this.tmp);
      node.group.position.copy(parentNode.group.position).add(this.tmp);
      node.ringHolder!.position.copy(parentNode.group.position);
    }
  }

  rebuildRings(): void {
    for (const n of this.nodes.values()) {
      if (!n.ring || !n.ringHolder) continue;
      n.ring.geometry.dispose();
      n.ringHolder.remove(n.ring);
      n.ring = this.makeRing(n.body);
      n.ringHolder.add(n.ring);
    }
  }

  update(dt: number, a: string, b: string, camera: THREE.Camera): void {
    this.elapsedDays += dt * this.daysPerSecond;
    this.layout();

    const t = performance.now() / 1000;
    const place = (sprite: THREE.Sprite, id: string, phase: number) => {
      const n = this.nodes.get(id);
      sprite.visible = !!n;
      if (!n) return;
      sprite.position.copy(n.group.position);
      sprite.scale.setScalar(n.radius * (4.2 + 0.4 * Math.sin(t * 1.6 + phase)) + 1.2);
    };
    place(this.selA, a, 0);
    place(this.selB, b, Math.PI);

    const na = this.nodes.get(a), nb = this.nodes.get(b);
    if (na && nb) {
      const pos = this.link.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, na.group.position.x, na.group.position.y, na.group.position.z);
      pos.setXYZ(1, nb.group.position.x, nb.group.position.y, nb.group.position.z);
      pos.needsUpdate = true;
      this.link.computeLineDistances();
      this.link.geometry.computeBoundingSphere();
    }

    for (const [id, n] of this.nodes) {
      const cls = n.label.element.classList;
      cls.toggle('is-a', id === a);
      cls.toggle('is-b', id === b);
      cls.toggle('is-hover', id === this.hovered);
      const chosen = id === a || id === b || id === this.hovered;
      if (n.body.kind === 'moon') {
        // moons crowd their planet when seen from afar: label only when close, hovered or chosen
        const parentPos = this.nodes.get(n.body.parent!)!.group.position;
        n.label.visible = chosen || camera.position.distanceTo(parentPos) < 70;
      } else if (n.body.kind === 'asteroid' || n.body.kind === 'comet') {
        n.label.visible = chosen || camera.position.distanceTo(n.group.position) < SMALL_LABEL_DISTANCE;
      }
      n.halo.material.opacity = (n.body.kind === 'star' ? 0.9 : 0.22) * (id === this.hovered ? 2.2 : 1);
    }
  }

  /** Screen-space picking: nearest body centre within a forgiving radius. */
  pick(clientX: number, clientY: number, camera: THREE.PerspectiveCamera, el: HTMLElement): string | null {
    const rect = el.getBoundingClientRect();
    const halfH = rect.height / 2;
    const focal = halfH / Math.tan((camera.fov * Math.PI) / 360);
    let best: string | null = null;
    let bestScore = Infinity;
    for (const [id, n] of this.nodes) {
      this.tmp.copy(n.group.position).project(camera);
      if (this.tmp.z > 1) continue;
      const sx = rect.left + (this.tmp.x * 0.5 + 0.5) * rect.width;
      const sy = rect.top + (-this.tmp.y * 0.5 + 0.5) * rect.height;
      const d = Math.hypot(sx - clientX, sy - clientY);
      const pxRadius = (n.radius * focal) / camera.position.distanceTo(n.group.position);
      const reach = Math.max(16, pxRadius + 8);
      if (d < reach) {
        // prefer the body whose edge is closest (helps moons hugging a big parent)
        const score = d - pxRadius * 0.5;
        if (score < bestScore) {
          bestScore = score;
          best = id;
        }
      }
    }
    return best;
  }

  /** World position of a body (for camera focusing). */
  positionOf(id: string): THREE.Vector3 | null {
    return this.nodes.get(id)?.group.position ?? null;
  }

  setLabelsVisible(v: boolean): void {
    for (const n of this.nodes.values()) n.label.visible = v;
  }
}
