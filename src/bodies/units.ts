export const AU_KM = 149_597_870.7;
export const J2000 = 2451545.0;
export const DEG = Math.PI / 180;
/** Obliquity of the ecliptic at J2000 (deg) */
export const OBLIQUITY_J2000 = 23.4392911;

/** kilometres → AU */
export const km = (v: number): number => v / AU_KM;
