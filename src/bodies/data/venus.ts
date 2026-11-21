import type { BodySpec } from '../types';
import { J2000 } from '../units';

export const venus: BodySpec = {
  id: 'venus',
  name: 'Venus',
  kind: 'planet',
  parent: 'sun',
  radiusKm: 6051.8,
  color: '#f3d9a4',
  orbit: {
    elements: {
      epochJD: J2000,
      a: 0.72333566,
      e: 0.00677672,
      i: 3.39467605,
      L: 181.97909950,
      varpi: 131.60246718,
      Omega: 76.67984255,
      rates: { a: 0.00000390, e: -0.00004107, i: -0.00078890, L: 58517.81538729, varpi: 0.00268329, Omega: -0.27769418 },
    },
  },
  source: 'JPL "Approximate Positions of the Planets" (E.M. Standish), Table 1, valid 1800–2050',
};
