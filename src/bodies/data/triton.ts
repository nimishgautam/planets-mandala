import type { BodySpec } from '../types';
import { J2000, km } from '../units';
import { NEPTUNE_POLE } from './neptune';

export const triton: BodySpec = {
  id: 'triton',
  name: 'Triton',
  kind: 'moon',
  parent: 'neptune',
  radiusKm: 1353.4,
  color: '#d9c7cf',
  orbit: {
    // L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: J2000,
      a: km(354800.0),
      e: 0.0,
      i: 157.3,
      L: 240.7,
      varpi: 177.7,
      Omega: 177.7,
      periodDays: 5.8792,
    },
    referencePlane: { kind: 'equatorOf', ...NEPTUNE_POLE }, // neptune's equator
  },
  source: 'JPL SSD planetary satellite mean elements (NEP098, equatorial frame, epoch 2000-01-01.5; fetched 2026-11-20)',
};
