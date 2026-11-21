import type { BodySpec } from '../types';
import { J2000 } from '../units';

export const uranus: BodySpec = {
  id: 'uranus',
  name: 'Uranus',
  kind: 'planet',
  parent: 'sun',
  radiusKm: 25362,
  color: '#9fe3e6',
  orbit: {
    elements: {
      epochJD: J2000,
      a: 19.18916464,
      e: 0.04725744,
      i: 0.77263783,
      L: 313.23810451,
      varpi: 170.95427630,
      Omega: 74.01692503,
      rates: { a: -0.00196176, e: -0.00004397, i: -0.00242939, L: 428.48202785, varpi: 0.40805281, Omega: 0.04240589 },
    },
  },
  source: 'JPL "Approximate Positions of the Planets" (E.M. Standish), Table 1, valid 1800–2050',
};

/** IAU pole of Uranus (ICRF, J2000; IAU WGCCRE) — reference plane for its moons' elements. */
export const URANUS_POLE = { poleRA: 257.311, poleDec: -15.175 };
