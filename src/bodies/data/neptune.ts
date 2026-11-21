import type { BodySpec } from '../types';
import { J2000 } from '../units';

export const neptune: BodySpec = {
  id: 'neptune',
  name: 'Neptune',
  kind: 'planet',
  parent: 'sun',
  radiusKm: 24622,
  color: '#7f9cff',
  orbit: {
    elements: {
      epochJD: J2000,
      a: 30.06992276,
      e: 0.00859048,
      i: 1.77004347,
      L: -55.12002969,
      varpi: 44.96476227,
      Omega: 131.78422574,
      rates: { a: 0.00026291, e: 0.00005105, i: 0.00035372, L: 218.45945325, varpi: -0.32241464, Omega: -0.00508664 },
    },
  },
  source: 'JPL "Approximate Positions of the Planets" (E.M. Standish), Table 1, valid 1800–2050',
};

/** IAU pole of Neptune (ICRF, J2000; IAU WGCCRE) — reference plane for its moons' elements. */
export const NEPTUNE_POLE = { poleRA: 299.36, poleDec: 43.46 };
