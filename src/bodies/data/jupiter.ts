import type { BodySpec } from '../types';
import { J2000 } from '../units';

export const jupiter: BodySpec = {
  id: 'jupiter',
  name: 'Jupiter',
  kind: 'planet',
  parent: 'sun',
  radiusKm: 69_911,
  color: '#e8b98a',
  orbit: {
    elements: {
      epochJD: J2000,
      a: 5.20288700,
      e: 0.04838624,
      i: 1.30439695,
      L: 34.39644051,
      varpi: 14.72847983,
      Omega: 100.47390909,
      rates: { a: -0.00011607, e: -0.00013253, i: -0.00183714, L: 3034.74612775, varpi: 0.21252668, Omega: 0.20469106 },
    },
  },
  source: 'JPL "Approximate Positions of the Planets" (E.M. Standish), Table 1, valid 1800–2050',
};

/** IAU pole of Jupiter (ICRF, J2000) — the reference plane for its regular moons. */
export const JUPITER_POLE = { poleRA: 268.056595, poleDec: 64.495303 };
