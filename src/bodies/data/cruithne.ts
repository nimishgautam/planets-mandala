import type { BodySpec } from '../types';

export const cruithne: BodySpec = {
  id: 'cruithne',
  name: 'Cruithne',
  kind: 'asteroid',
  parent: 'sun',
  radiusKm: 1.04,
  color: '#c2b59b',
  orbit: {
    // osculating elements; L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: 2461200.5,
      a: 0.9977971735,
      e: 0.5149036012,
      i: 19.8023813356,
      L: 352.2041515386,
      varpi: 170.071707609,
      Omega: 126.1886918392,
      periodDays: 364.0506668675,
    },
  },
  source: 'JPL Small-Body Database, 3753 Cruithne (1986 TO) (osculating elements, ecliptic J2000; fetched 2026-11-20)',
};
