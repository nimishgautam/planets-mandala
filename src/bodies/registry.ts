import type { BodySpec } from './types';
import { DEG, OBLIQUITY_J2000 } from './units';

/** A registered body: the spec plus derived data the engine needs. */
export interface Body extends BodySpec {
  children: string[];
  depth: number;
  /** sidereal period (days) of the orbit about its parent; null for the root */
  periodDays: number | null;
  /** mean motion, deg/day; null for the root */
  meanMotion: number | null;
  /** 3x3 row-major basis taking reference-plane coords → ecliptic; null = identity */
  planeBasis: number[] | null;
  /** period that sets the body's musical tone (tonePeriodDays ?? orbital period) */
  tonePeriod: number;
}

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Returns a list of human-readable problems; empty means valid. */
export function validateSpecs(specs: BodySpec[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const fin = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

  for (const s of specs) {
    const tag = `[${s.id ?? '?'}]`;
    if (!s.id || !ID_RE.test(s.id)) errors.push(`${tag} id must be lowercase kebab-case`);
    if (ids.has(s.id)) errors.push(`${tag} duplicate id`);
    ids.add(s.id);
    if (!s.name) errors.push(`${tag} missing name`);
    if (!fin(s.radiusKm) || s.radiusKm <= 0) errors.push(`${tag} radiusKm must be > 0`);
    if (!HEX_RE.test(s.color ?? '')) errors.push(`${tag} color must be #rrggbb`);

    if (s.tonePeriodDays !== undefined && !(fin(s.tonePeriodDays) && s.tonePeriodDays > 0))
      errors.push(`${tag} tonePeriodDays must be > 0`);
    if (s.parent === null) {
      if (s.orbit) errors.push(`${tag} root body cannot have an orbit`);
      continue;
    }
    if (!s.orbit) {
      errors.push(`${tag} non-root body needs an orbit`);
      continue;
    }
    const el = s.orbit.elements;
    for (const k of ['epochJD', 'a', 'e', 'i', 'L', 'varpi', 'Omega'] as const) {
      if (!fin(el[k])) errors.push(`${tag} elements.${k} must be a finite number`);
    }
    if (!(el.a > 0)) errors.push(`${tag} elements.a must be > 0`);
    if (!(el.e >= 0 && el.e < 1)) errors.push(`${tag} elements.e must be in [0, 1)`);
    const hasRate = fin(el.rates?.L) && el.rates!.L !== 0;
    const hasPeriod = fin(el.periodDays) && el.periodDays! > 0;
    if (!hasRate && !hasPeriod) errors.push(`${tag} needs rates.L or periodDays for its mean motion`);
  }

  const byId = new Map(specs.map((s) => [s.id, s]));
  const roots = specs.filter((s) => s.parent === null);
  if (roots.length !== 1) errors.push(`expected exactly one root body, found ${roots.length}`);
  for (const s of specs) {
    if (s.parent !== null && !byId.has(s.parent)) errors.push(`[${s.id}] unknown parent '${s.parent}'`);
    // cycle check
    const seen = new Set<string>();
    let cur: BodySpec | undefined = s;
    while (cur && cur.parent !== null) {
      if (seen.has(cur.id)) {
        errors.push(`[${s.id}] parent chain has a cycle`);
        break;
      }
      seen.add(cur.id);
      cur = byId.get(cur.parent);
    }
  }
  return errors;
}

function planeBasisFor(spec: BodySpec): number[] | null {
  const rp = spec.orbit?.referencePlane;
  if (!rp || rp.kind === 'ecliptic') return null;
  // pole in equatorial → ecliptic
  const ra = rp.poleRA * DEG;
  const dec = rp.poleDec * DEG;
  const eps = OBLIQUITY_J2000 * DEG;
  const xe = Math.cos(dec) * Math.cos(ra);
  const ye = Math.cos(dec) * Math.sin(ra);
  const ze = Math.sin(dec);
  const n = [xe, Math.cos(eps) * ye + Math.sin(eps) * ze, -Math.sin(eps) * ye + Math.cos(eps) * ze];
  // ascending node of the plane on the ecliptic: ẑ × n
  let X = [-n[1], n[0], 0];
  const len = Math.hypot(X[0], X[1]);
  X = len < 1e-12 ? [1, 0, 0] : [X[0] / len, X[1] / len, 0];
  // Y = n × X
  const Y = [n[1] * X[2] - n[2] * X[1], n[2] * X[0] - n[0] * X[2], n[0] * X[1] - n[1] * X[0]];
  // columns X, Y, n  → row-major matrix M so that v_ecl = M · v_plane
  return [X[0], Y[0], n[0], X[1], Y[1], n[1], X[2], Y[2], n[2]];
}

export class BodyRegistry {
  private map = new Map<string, Body>();
  private order: string[] = [];
  private ancestorCache = new Map<string, string[]>();
  rootId = '';

  constructor(specs: BodySpec[]) {
    const errors = validateSpecs(specs);
    if (errors.length) throw new Error('Invalid body library:\n  ' + errors.join('\n  '));

    for (const s of specs) {
      const el = s.orbit?.elements;
      let meanMotion: number | null = null;
      if (el) meanMotion = el.rates?.L ? el.rates.L / 36525 : 360 / el.periodDays!;
      this.map.set(s.id, {
        ...s,
        children: [],
        depth: 0,
        meanMotion,
        periodDays: meanMotion ? 360 / meanMotion : null,
        planeBasis: planeBasisFor(s),
        tonePeriod: s.tonePeriodDays ?? (meanMotion ? 360 / meanMotion : 365.25),
      });
    }
    for (const b of this.map.values()) {
      if (b.parent) this.map.get(b.parent)!.children.push(b.id);
      else this.rootId = b.id;
    }
    // depth-first order, children sorted by distance from parent
    const visit = (id: string, depth: number) => {
      const b = this.map.get(id)!;
      b.depth = depth;
      this.order.push(id);
      b.children.sort((x, y) => this.map.get(x)!.orbit!.elements.a - this.map.get(y)!.orbit!.elements.a);
      for (const c of b.children) visit(c, depth + 1);
    };
    visit(this.rootId, 0);
  }

  get(id: string): Body {
    const b = this.map.get(id);
    if (!b) throw new Error(`Unknown body '${id}'`);
    return b;
  }

  has(id: string): boolean {
    return this.map.has(id);
  }

  /** All bodies, depth-first (Sun, Mercury, …, Earth, Moon, Mars, …). */
  all(): Body[] {
    return this.order.map((id) => this.map.get(id)!);
  }

  /** [id, parent, grandparent, …, root] */
  ancestors(id: string): string[] {
    let chain = this.ancestorCache.get(id);
    if (!chain) {
      chain = [];
      let cur: string | null = id;
      while (cur) {
        chain.push(cur);
        cur = this.get(cur).parent;
      }
      this.ancestorCache.set(id, chain);
    }
    return chain;
  }

  /** Lowest common ancestor (a body counts as its own ancestor). */
  lca(a: string, b: string): string {
    const setA = new Set(this.ancestors(a));
    for (const id of this.ancestors(b)) if (setA.has(id)) return id;
    return this.rootId;
  }

  /** Chain from `id` up to (but excluding) `ancestor`. */
  chainTo(id: string, ancestor: string): string[] {
    const out: string[] = [];
    for (const c of this.ancestors(id)) {
      if (c === ancestor) return out;
      out.push(c);
    }
    throw new Error(`${ancestor} is not an ancestor of ${id}`);
  }
}
