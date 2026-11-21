import type { BodySpec } from '../types';
import { J2000, km } from '../units';

export const dione: BodySpec = {
  id: 'dione',
  name: 'Dione',
  kind: 'moon',
  parent: 'saturn',
  radiusKm: 561.4,
  color: '#d6d2cc',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(377700.0),
      e: 0.002,
      i: 0.0,
      L: 328.0,
      varpi: 116.0,
      Omega: 0.0,
      periodDays: 2.736916,
    },
    referencePlane: { kind: 'equatorOf', poleRA: 40.6, poleDec: 83.5 }, // local Laplace plane
  },
  source: 'JPL SSD planetary satellite mean elements (SAT441, Laplace frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
