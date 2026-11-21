import type { BodySpec } from '../types';
import { J2000, km } from '../units';
import { URANUS_POLE } from './uranus';

export const umbriel: BodySpec = {
  id: 'umbriel',
  name: 'Umbriel',
  kind: 'moon',
  parent: 'uranus',
  radiusKm: 584.7,
  color: '#8f9196',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(265986.0),
      e: 0.004,
      i: 0.1,
      L: 251.2,
      varpi: 358.2,
      Omega: 174.8,
      periodDays: 4.144177,
    },
    referencePlane: { kind: 'equatorOf', ...URANUS_POLE }, // uranus's equator
  },
  source: 'JPL SSD planetary satellite mean elements (URA182, equatorial frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
