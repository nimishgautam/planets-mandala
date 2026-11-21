import { DEG } from '../bodies/units';

export type Vec3 = [number, number, number];

const TAU = Math.PI * 2;

/** Wrap an angle (radians) to (−π, π]. */
export function wrapPi(x: number): number {
  x = x % TAU;
  if (x > Math.PI) x -= TAU;
  else if (x <= -Math.PI) x += TAU;
  return x;
}

/** Solve Kepler's equation M = E − e·sin E for E (radians). */
export function solveKepler(M: number, e: number): number {
  M = wrapPi(M);
  let E = e < 0.8 ? M : Math.PI * Math.sign(M || 1);
  for (let k = 0; k < 50; k++) {
    const f = E - e * Math.sin(E) - M;
    const dE = f / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-13) break;
  }
  return E;
}

/**
 * Position in the reference frame from classical elements (Standish's procedure).
 * Angles in degrees; a in AU. Writes into `out`.
 */
export function elementsToPosition(
  a: number,
  e: number,
  iDeg: number,
  LDeg: number,
  varpiDeg: number,
  OmegaDeg: number,
  out: Vec3,
): Vec3 {
  const omega = (varpiDeg - OmegaDeg) * DEG;
  const Omega = OmegaDeg * DEG;
  const I = iDeg * DEG;
  const M = (LDeg - varpiDeg) * DEG;
  const E = solveKepler(M, e);
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const cw = Math.cos(omega), sw = Math.sin(omega);
  const cO = Math.cos(Omega), sO = Math.sin(Omega);
  const cI = Math.cos(I), sI = Math.sin(I);

  out[0] = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
  out[1] = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
  out[2] = sw * sI * xp + cw * sI * yp;
  return out;
}
