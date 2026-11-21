import type { BodySpec } from '../types';
import { J2000, km } from '../units';

export const mimas: BodySpec = {
  id: 'mimas',
  name: 'Mimas',
  kind: 'moon',
  parent: 'saturn',
  radiusKm: 198.2,
  color: '#d0d0d6',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(186000.0),
      e: 0.02,
      i: 1.6,
      L: 141.9,
      varpi: 226.6,
      Omega: 66.2,
      periodDays: 0.942422,
    },
    referencePlane: { kind: 'equatorOf', poleRA: 40.6, poleDec: 83.5 }, // local Laplace plane
  },
  source: 'JPL SSD planetary satellite mean elements (SAT441, Laplace frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
