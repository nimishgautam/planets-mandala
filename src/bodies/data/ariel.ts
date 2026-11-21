import type { BodySpec } from '../types';
import { J2000, km } from '../units';
import { URANUS_POLE } from './uranus';

export const ariel: BodySpec = {
  id: 'ariel',
  name: 'Ariel',
  kind: 'moon',
  parent: 'uranus',
  radiusKm: 578.9,
  color: '#d8dde3',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(190929.0),
      e: 0.001,
      i: 0.0,
      L: 203.1,
      varpi: 9.6,
      Omega: 0.0,
      periodDays: 2.520379,
    },
    referencePlane: { kind: 'equatorOf', ...URANUS_POLE }, // uranus's equator
  },
  source: 'JPL SSD planetary satellite mean elements (URA182, equatorial frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
