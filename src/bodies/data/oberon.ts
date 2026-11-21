import type { BodySpec } from '../types';
import { J2000, km } from '../units';
import { URANUS_POLE } from './uranus';

export const oberon: BodySpec = {
  id: 'oberon',
  name: 'Oberon',
  kind: 'moon',
  parent: 'uranus',
  radiusKm: 761.4,
  color: '#b9aea6',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(583511.0),
      e: 0.002,
      i: 0.1,
      L: 352.6,
      varpi: 209.0,
      Omega: 76.8,
      periodDays: 13.463237,
    },
    referencePlane: { kind: 'equatorOf', ...URANUS_POLE }, // uranus's equator
  },
  source: 'JPL SSD planetary satellite mean elements (URA182, equatorial frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
