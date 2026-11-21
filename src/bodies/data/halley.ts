import type { BodySpec } from '../types';

export const halley: BodySpec = {
  id: 'halley',
  name: "Halley's Comet",
  kind: 'comet',
  parent: 'sun',
  radiusKm: 5.5,
  color: '#b8f0ff',
  orbit: {
    // osculating elements; L = Ω + ω + M, ϖ = Ω + ω
    elements: {
      epochJD: 2439875.5,
      a: 17.9286350486,
      e: 0.9679359957,
      i: 162.1905300439,
      L: 445.7227158066,
      varpi: 171.3403786699,
      Omega: 59.0989472061,
      periodDays: 27728.0460879042,
    },
  },
  source: 'JPL Small-Body Database, 1P/Halley (osculating elements, ecliptic J2000; fetched 2026-11-20)',
};
