import type { BodySpec } from '../types';

export const sun: BodySpec = {
  id: 'sun',
  name: 'Sun',
  kind: 'star',
  parent: null,
  radiusKm: 695_700,
  color: '#ffd27a',
  // sidereal equatorial rotation (Carrington) — gives the Sun its drone tone (~122 Hz)
  tonePeriodDays: 25.38,
};
