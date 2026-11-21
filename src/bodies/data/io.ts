import type { BodySpec } from '../types';
import { J2000, km } from '../units';
import { JUPITER_POLE } from './jupiter';

export const io: BodySpec = {
  id: 'io',
  name: 'Io',
  kind: 'moon',
  parent: 'jupiter',
  radiusKm: 1821.6,
  color: '#f5e27a',
  orbit: {
    elements: {
      epochJD: J2000,
      a: km(421_800),
      e: 0.0041,
      i: 0.036,
      L: 20.0,
      varpi: 49.1,
      Omega: 0.0,
      periodDays: 1.769137786,
    },
    referencePlane: { kind: 'equatorOf', ...JUPITER_POLE },
  },
  source: 'JPL SSD planetary satellite mean elements (Laplace plane, epoch 2000-01-01.5); L = Ω + ω + M',
};
