import type { BodySpec } from '../types';
import { J2000, km } from '../units';

export const enceladus: BodySpec = {
  id: 'enceladus',
  name: 'Enceladus',
  kind: 'moon',
  parent: 'saturn',
  radiusKm: 252.1,
  color: '#f2f8ff',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(238400.0),
      e: 0.005,
      i: 0.0,
      L: 176.5,
      varpi: 119.5,
      Omega: 0.0,
      periodDays: 1.370218,
    },
    referencePlane: { kind: 'equatorOf', poleRA: 40.6, poleDec: 83.5 }, // local Laplace plane
  },
  source: 'JPL SSD planetary satellite mean elements (SAT441, Laplace frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
