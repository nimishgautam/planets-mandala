import type { BodySpec } from '../types';
import { J2000 } from '../units';

export const mercury: BodySpec = {
  id: 'mercury',
  name: 'Mercury',
  kind: 'planet',
  parent: 'sun',
  radiusKm: 2439.7,
  color: '#b9b2a8',
  orbit: {
    elements: {
      epochJD: J2000,
      a: 0.38709927,
      e: 0.20563593,
      i: 7.00497902,
      L: 252.25032350,
      varpi: 77.45779628,
      Omega: 48.33076593,
      rates: { a: 0.00000037, e: 0.00001906, i: -0.00594749, L: 149472.67411175, varpi: 0.16047689, Omega: -0.12534081 },
    },
  },
  source: 'JPL "Approximate Positions of the Planets" (E.M. Standish), Table 1, valid 1800–2050',
};
