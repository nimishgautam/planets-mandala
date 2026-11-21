import type { BodySpec } from '../types';

export const kamooalewa: BodySpec = {
  id: 'kamooalewa',
  name: 'Kamoʻoalewa',
  kind: 'asteroid',
  parent: 'sun',
  radiusKm: 0.03,
  color: '#d2a48c',
  orbit: {
    // osculating elements; L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: 2461200.5,
      a: 1.0008104617,
      e: 0.1022388435,
      i: 7.8026143688,
      L: 613.3435990143,
      varpi: 369.9564547814,
      Omega: 65.5932419951,
      periodDays: 365.7010283505,
    },
  },
  source: 'JPL Small-Body Database, 469219 Kamo`oalewa (2016 HO3) (osculating elements, ecliptic J2000; fetched 2026-11-20)',
};
