import type { BodySpec } from '../types';
import { J2000, km } from '../units';
import { URANUS_POLE } from './uranus';

export const titania: BodySpec = {
  id: 'titania',
  name: 'Titania',
  kind: 'moon',
  parent: 'uranus',
  radiusKm: 788.4,
  color: '#cfc7c0',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(436298.0),
      e: 0.002,
      i: 0.1,
      L: 281.6,
      varpi: 213.5,
      Omega: 29.5,
      periodDays: 8.705869,
    },
    referencePlane: { kind: 'equatorOf', ...URANUS_POLE }, // uranus's equator
  },
  source: 'JPL SSD planetary satellite mean elements (URA182, equatorial frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
