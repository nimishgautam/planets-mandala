import type { BodySpec } from '../types';
import { J2000, km } from '../units';
import { JUPITER_POLE } from './jupiter';

export const europa: BodySpec = {
  id: 'europa',
  name: 'Europa',
  kind: 'moon',
  parent: 'jupiter',
  radiusKm: 1560.8,
  color: '#c9e3f0',
  orbit: {
    elements: {
      epochJD: J2000,
      a: km(671_100),
      e: 0.009,
      i: 0.466,
      L: 214.4,
      varpi: 229.0,
      Omega: 184.0,
      periodDays: 3.551181041,
    },
    referencePlane: { kind: 'equatorOf', ...JUPITER_POLE },
  },
  source: 'JPL SSD planetary satellite mean elements (Laplace plane, epoch 2000-01-01.5); L = Ω + ω + M',
};
