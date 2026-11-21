import type { BodySpec } from '../types';

export const pluto: BodySpec = {
  id: 'pluto',
  name: 'Pluto',
  kind: 'dwarf',
  parent: 'sun',
  radiusKm: 1188.3,
  color: '#d9b99b',
  orbit: {
    // osculating elements; L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: 2457588.5,
      a: 39.5886293852,
      e: 0.2518378779,
      i: 17.14771141,
      L: 262.6850490433,
      varpi: 224.0013855702,
      Omega: 110.2923840543,
      periodDays: 90981.7164771835,
    },
  },
  source: 'JPL Small-Body Database, 134340 Pluto (1930 BM) (osculating elements, ecliptic J2000; fetched 2026-11-20)',
};
