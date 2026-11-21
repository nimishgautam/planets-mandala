import type { BodySpec } from '../types';
import { J2000 } from '../units';

export const mars: BodySpec = {
  id: 'mars',
  name: 'Mars',
  kind: 'planet',
  parent: 'sun',
  radiusKm: 3389.5,
  color: '#ff8a65',
  orbit: {
    elements: {
      epochJD: J2000,
      a: 1.52371034,
      e: 0.09339410,
      i: 1.84969142,
      L: -4.55343205,
      varpi: -23.94362959,
      Omega: 49.55953891,
      rates: { a: 0.00001847, e: 0.00007882, i: -0.00813131, L: 19140.30268499, varpi: 0.44441088, Omega: -0.29257343 },
    },
  },
  source: 'JPL "Approximate Positions of the Planets" (E.M. Standish), Table 1, valid 1800–2050',
};
