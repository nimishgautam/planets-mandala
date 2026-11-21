import type { BodySpec } from '../types';
import { J2000, km } from '../units';
import { URANUS_POLE } from './uranus';

export const miranda: BodySpec = {
  id: 'miranda',
  name: 'Miranda',
  kind: 'moon',
  parent: 'uranus',
  radiusKm: 235.8,
  color: '#c8ccd2',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(129846.0),
      e: 0.001,
      i: 4.4,
      L: 328.7,
      varpi: 255.7,
      Omega: 100.9,
      periodDays: 1.413479,
    },
    referencePlane: { kind: 'equatorOf', ...URANUS_POLE }, // uranus's equator
  },
  source: 'JPL SSD planetary satellite mean elements (URA182, equatorial frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
