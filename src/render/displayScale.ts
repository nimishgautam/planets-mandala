import type { Body } from '../bodies/registry';
import { AU_KM } from '../bodies/units';
import type { Vec3 } from '../engine/kepler';

/**
 * Picker-only scaling. Real proportions would make every planet a sub-pixel
 * dot next to a huge Sun, so distances and radii are compressed separately.
 * Distances are compressed *per point* (not per orbit), so eccentric orbits
 * such as Halley's keep their place relative to the planets' rings.
 * All constants are live-tunable from the "Picker scaling" GUI folder.
 */
export const displayScale = {
  /** heliocentric distance: kDist · r(AU)^distPow */
  kDist: 70,
  distPow: 0.4,
  /** body radius: kRadius · R(km)^radiusPow */
  kRadius: 0.045,
  radiusPow: 0.4,
  /** moons drawn a bit smaller than the formula */
  moonRadiusFactor: 0.85,
  minRadius: 0.35,
  sunMaxRadius: 9,
  /** moon distance: parentR · (moonBase + kMoon · ln(r / R_parent)) */
  moonBase: 1.3,
  kMoon: 0.7,
};

export function displayRadius(b: Body): number {
  const s = displayScale;
  let r = s.kRadius * Math.pow(b.radiusKm, s.radiusPow);
  if (b.kind === 'moon') r *= s.moonRadiusFactor;
  if (b.kind === 'star') r = Math.min(r, s.sunMaxRadius);
  r *= b.display?.radiusScale ?? 1;
  return Math.max(s.minRadius, r);
}

/** Scaled display distance for a true distance `rAU` of `b` from `parent`. */
export function displayDistanceAt(b: Body, parent: Body, rAU: number): number {
  const s = displayScale;
  let d: number;
  if (parent.kind === 'star') {
    d = s.kDist * Math.pow(rAU, s.distPow);
  } else {
    const ratio = (rAU * AU_KM) / parent.radiusKm;
    d = displayRadius(parent) * (s.moonBase + s.kMoon * Math.log(Math.max(1.0001, ratio)));
  }
  return d * (b.display?.distanceScale ?? 1);
}

/** Compress a true offset (AU, ecliptic) from the parent into display units, in place. */
export function scaleOffset(b: Body, parent: Body, v: Vec3): Vec3 {
  const r = Math.hypot(v[0], v[1], v[2]);
  if (r === 0) return v;
  const f = displayDistanceAt(b, parent, r) / r;
  v[0] *= f;
  v[1] *= f;
  v[2] *= f;
  return v;
}
