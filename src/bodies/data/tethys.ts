import type { BodySpec } from '../types';
import { J2000, km } from '../units';

export const tethys: BodySpec = {
  id: 'tethys',
  name: 'Tethys',
  kind: 'moon',
  parent: 'saturn',
  radiusKm: 531.1,
  color: '#e3e1dc',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(295000.0),
      e: 0.001,
      i: 1.1,
      L: 248.3,
      varpi: 248.3,
      Omega: 273.0,
      periodDays: 1.887802,
    },
    referencePlane: { kind: 'equatorOf', poleRA: 40.6, poleDec: 83.5 }, // local Laplace plane
  },
  source: 'JPL SSD planetary satellite mean elements (SAT441, Laplace frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
