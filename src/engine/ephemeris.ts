import type { Body, BodyRegistry } from '../bodies/registry';
import { DEG } from '../bodies/units';
import { elementsToPosition, type Vec3 } from './kepler';

/**
 *  - keplerian: real eccentricity/inclination + secular drift of the elements
 *  - idealized: circular, coplanar (ecliptic) orbits with the same period and phase
 */
export type OrbitModel = 'keplerian' | 'idealized';

const tmp: Vec3 = [0, 0, 0];

/** Position of `body` relative to its parent, J2000 ecliptic frame, AU. */
export function localPosition(body: Body, jd: number, model: OrbitModel, out: Vec3): Vec3 {
  const orbit = body.orbit;
  if (!orbit) {
    out[0] = out[1] = out[2] = 0;
    return out;
  }
  const el = orbit.elements;
  const dt = jd - el.epochJD;

  if (model === 'idealized') {
    const a = orbit.idealized?.a ?? el.a;
    const n = orbit.idealized?.periodDays ? 360 / orbit.idealized.periodDays : body.meanMotion!;
    // keep retrograde bodies (i > 90°, e.g. Triton, Halley) moving backwards
    const dir = Math.cos(el.i * DEG) < 0 ? -1 : 1;
    const ang = (el.L + dir * n * dt) * DEG;
    out[0] = a * Math.cos(ang);
    out[1] = a * Math.sin(ang);
    out[2] = 0;
    return out;
  }

  const T = dt / 36525;
  const r = el.rates ?? {};
  elementsToPosition(
    el.a + (r.a ?? 0) * T,
    el.e + (r.e ?? 0) * T,
    el.i + (r.i ?? 0) * T,
    el.L + body.meanMotion! * dt,
    el.varpi + (r.varpi ?? 0) * T,
    el.Omega + (r.Omega ?? 0) * T,
    tmp,
  );
  const M = body.planeBasis;
  if (M) {
    const [x, y, z] = tmp;
    out[0] = M[0] * x + M[1] * y + M[2] * z;
    out[1] = M[3] * x + M[4] * y + M[5] * z;
    out[2] = M[6] * x + M[7] * y + M[8] * z;
  } else {
    out[0] = tmp[0];
    out[1] = tmp[1];
    out[2] = tmp[2];
  }
  return out;
}

export class Ephemeris {
  private scratch: Vec3 = [0, 0, 0];
  private tA: Vec3 = [0, 0, 0];
  private tC: Vec3 = [0, 0, 0];
  constructor(readonly bodies: BodyRegistry) {}

  /** Sum of local positions from `id` up to (excluding) `ancestor`. */
  private chainSum(id: string, ancestor: string, jd: number, model: OrbitModel, out: Vec3): Vec3 {
    out[0] = out[1] = out[2] = 0;
    for (const c of this.bodies.chainTo(id, ancestor)) {
      localPosition(this.bodies.get(c), jd, model, this.scratch);
      out[0] += this.scratch[0];
      out[1] += this.scratch[1];
      out[2] += this.scratch[2];
    }
    return out;
  }

  /**
   * Position of `target` relative to `center` (AU, ecliptic J2000).
   * Computed through their common ancestor so nearby moons stay precise.
   */
  relative(target: string, center: string, jd: number, model: OrbitModel, out: Vec3 = [0, 0, 0]): Vec3 {
    const anc = this.bodies.lca(target, center);
    const t = this.chainSum(target, anc, jd, model, this.tA);
    const c = this.chainSum(center, anc, jd, model, this.tC);
    out[0] = t[0] - c[0];
    out[1] = t[1] - c[1];
    out[2] = t[2] - c[2];
    return out;
  }

  heliocentric(id: string, jd: number, model: OrbitModel, out: Vec3 = [0, 0, 0]): Vec3 {
    return this.chainSum(id, this.bodies.rootId, jd, model, out);
  }

  local(id: string, jd: number, model: OrbitModel, out: Vec3 = [0, 0, 0]): Vec3 {
    return localPosition(this.bodies.get(id), jd, model, out);
  }
}
