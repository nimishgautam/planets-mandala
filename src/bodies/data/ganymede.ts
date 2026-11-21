import type { BodySpec } from '../types';
import { J2000, km } from '../units';
import { JUPITER_POLE } from './jupiter';

export const ganymede: BodySpec = {
  id: 'ganymede',
  name: 'Ganymede',
  kind: 'moon',
  parent: 'jupiter',
  radiusKm: 2634.1,
  color: '#a8a0c8',
  orbit: {
    elements: {
      epochJD: J2000,
      a: km(1_070_400),
      e: 0.0013,
      i: 0.177,
      L: 221.6,
      varpi: 256.8,
      Omega: 58.5,
      periodDays: 7.15455296,
    },
    referencePlane: { kind: 'equatorOf', ...JUPITER_POLE },
  },
  source: 'JPL SSD planetary satellite mean elements (Laplace plane, epoch 2000-01-01.5); L = Ω + ω + M',
};
