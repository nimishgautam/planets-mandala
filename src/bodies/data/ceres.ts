import type { BodySpec } from '../types';

export const ceres: BodySpec = {
  id: 'ceres',
  name: 'Ceres',
  kind: 'dwarf',
  parent: 'sun',
  radiusKm: 469.7,
  color: '#b3ada3',
  orbit: {
    // osculating elements; L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: 2461200.5,
      a: 2.765552595,
      e: 0.0796922951,
      i: 10.5880278018,
      L: 427.9621877268,
      varpi: 153.5428413506,
      Omega: 80.2486268204,
      periodDays: 1679.853119759,
    },
  },
  source: 'JPL Small-Body Database, 1 Ceres (A801 AA) (osculating elements, ecliptic J2000; fetched 2026-11-20)',
};
