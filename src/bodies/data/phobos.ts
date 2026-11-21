import type { BodySpec } from '../types';
import { J2000, km } from '../units';

export const phobos: BodySpec = {
  id: 'phobos',
  name: 'Phobos',
  kind: 'moon',
  parent: 'mars',
  radiusKm: 11.08,
  color: '#b8a89a',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(9375.0),
      e: 0.015,
      i: 1.1,
      L: 215.2,
      varpi: 25.5,
      Omega: 169.2,
      periodDays: 0.3187,
    },
    referencePlane: { kind: 'equatorOf', poleRA: 317.7, poleDec: 52.9 }, // local Laplace plane
  },
  source: 'JPL SSD planetary satellite mean elements (MAR099, Laplace frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
