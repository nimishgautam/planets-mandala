import type { BodySpec } from '../types';
import { J2000 } from '../units';

export const saturn: BodySpec = {
  id: 'saturn',
  name: 'Saturn',
  kind: 'planet',
  parent: 'sun',
  radiusKm: 58232,
  color: '#e9d7a5',
  orbit: {
    elements: {
      epochJD: J2000,
      a: 9.53667594,
      e: 0.05386179,
      i: 2.48599187,
      L: 49.95424423,
      varpi: 92.59887831,
      Omega: 113.66242448,
      rates: { a: -0.00125060, e: -0.00050991, i: 0.00193609, L: 1222.49362201, varpi: -0.41897216, Omega: -0.28867794 },
    },
  },
  source: 'JPL "Approximate Positions of the Planets" (E.M. Standish), Table 1, valid 1800–2050',
};