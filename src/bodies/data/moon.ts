import type { BodySpec } from '../types';
import { J2000, km } from '../units';

export const moon: BodySpec = {
  id: 'moon',
  name: 'Moon',
  kind: 'moon',
  parent: 'earth',
  radiusKm: 1737.4,
  color: '#d8d8e0',
  orbit: {
    elements: {
      epochJD: J2000,
      a: km(384_400),
      e: 0.0549,
      i: 5.145,
      L: 218.3164477,
      varpi: 83.3532465,
      Omega: 125.0445479,
      // perigee advances once per 8.85 yr, node regresses once per 18.6 yr
      rates: { L: 481267.88123421, varpi: 4069.0137287, Omega: -1934.1362891 },
    },
  },
  source: 'Mean lunar elements (Meeus, Astronomical Algorithms ch. 47; Chapront ELP-2000/82 mean arguments)',
};
