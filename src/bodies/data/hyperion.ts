import type { BodySpec } from '../types';
import { J2000, km } from '../units';

export const hyperion: BodySpec = {
  id: 'hyperion',
  name: 'Hyperion',
  kind: 'moon',
  parent: 'saturn',
  radiusKm: 135.0,
  color: '#c4a98c',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(1481500.0),
      e: 0.105,
      i: 0.6,
      L: 64.0,
      varpi: 301.1,
      Omega: 87.1,
      periodDays: 21.276658,
    },
    referencePlane: { kind: 'equatorOf', poleRA: 40.2, poleDec: 83.6 }, // local Laplace plane
  },
  source: 'JPL SSD planetary satellite mean elements (SAT441, Laplace frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
