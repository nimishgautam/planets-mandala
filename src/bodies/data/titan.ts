import type { BodySpec } from '../types';
import { J2000, km } from '../units';

export const titan: BodySpec = {
  id: 'titan',
  name: 'Titan',
  kind: 'moon',
  parent: 'saturn',
  radiusKm: 2574.7,
  color: '#e8b46a',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(1221900.0),
      e: 0.029,
      i: 0.3,
      L: 168.6,
      varpi: 156.9,
      Omega: 78.6,
      periodDays: 15.945448,
    },
    referencePlane: { kind: 'equatorOf', poleRA: 36.4, poleDec: 84.0 }, // local Laplace plane
  },
  source: 'JPL SSD planetary satellite mean elements (SAT441, Laplace frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
