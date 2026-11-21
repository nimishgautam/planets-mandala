import type { BodySpec } from '../types';
import { J2000, km } from '../units';

export const callisto: BodySpec = {
  id: 'callisto',
  name: 'Callisto',
  kind: 'moon',
  parent: 'jupiter',
  radiusKm: 2410.3,
  color: '#a0948a',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(1882700.0),
      e: 0.007,
      i: 0.3,
      L: 80.3,
      varpi: 352.9,
      Omega: 309.1,
      // sidereal period: JPL's tabulated P for the Galilean moons is not the mean-longitude rate
      periodDays: 16.6890184,
    },
    referencePlane: { kind: 'equatorOf', poleRA: 268.7, poleDec: 64.8 }, // local Laplace plane
  },
  source: 'JPL SSD planetary satellite mean elements (JUP365, Laplace frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
