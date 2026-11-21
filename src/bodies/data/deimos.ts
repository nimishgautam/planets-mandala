import type { BodySpec } from '../types';
import { J2000, km } from '../units';

export const deimos: BodySpec = {
  id: 'deimos',
  name: 'Deimos',
  kind: 'moon',
  parent: 'mars',
  radiusKm: 6.2,
  color: '#c9bba8',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(23457.0),
      e: 0.0,
      i: 1.8,
      L: 259.3,
      varpi: 54.3,
      Omega: 54.3,
      periodDays: 1.2625,
    },
    referencePlane: { kind: 'equatorOf', poleRA: 316.6, poleDec: 53.5 }, // local Laplace plane
  },
  source: 'JPL SSD planetary satellite mean elements (MAR099, Laplace frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
