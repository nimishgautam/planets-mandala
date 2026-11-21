import type { BodySpec } from '../types';
import { J2000 } from '../units';

export const earth: BodySpec = {
  id: 'earth',
  name: 'Earth',
  kind: 'planet',
  parent: 'sun',
  radiusKm: 6371.0,
  color: '#7fb5ff',
  orbit: {
    elements: {
      epochJD: J2000,
      a: 1.00000261,
      e: 0.01671123,
      i: -0.00001531,
      L: 100.46457166,
      varpi: 102.93768193,
      Omega: 0.0,
      rates: { a: 0.00000562, e: -0.00004392, i: -0.01294668, L: 35999.37244981, varpi: 0.32327364, Omega: 0.0 },
    },
  },
  source:
    'JPL "Approximate Positions of the Planets" (E.M. Standish), Table 1, valid 1800–2050. Earth uses the Earth–Moon barycentre elements.',
};
