/**
 * The body specification — the "standard" every entry in the library follows.
 * See docs/ADDING_BODIES.md for a walkthrough.
 */

export type BodyKind = 'star' | 'planet' | 'moon' | 'dwarf' | 'asteroid' | 'comet' | 'other';

/** Linear rates of change, per Julian century (36525 days). */
export interface ElementRates {
  a?: number; // AU / century
  e?: number;
  i?: number; // deg / century
  L?: number; // deg / century (this IS the mean motion)
  varpi?: number;
  Omega?: number;
}

/**
 * Classical mean orbital elements, relative to the body's parent, in the
 * style of JPL's "Approximate Positions of the Planets" (Standish).
 * Angles in degrees, distance in AU.
 */
export interface KeplerianElements {
  /** Julian Date of the elements. J2000.0 = 2451545.0 */
  epochJD: number;
  /** semi-major axis (AU). Use km() from bodies/units for moons. */
  a: number;
  /** eccentricity, 0 <= e < 1 */
  e: number;
  /** inclination to the reference plane (deg) */
  i: number;
  /** mean longitude at epoch (deg) */
  L: number;
  /** longitude of periapsis ϖ = Ω + ω (deg) */
  varpi: number;
  /** longitude of the ascending node (deg) */
  Omega: number;
  /** optional secular rates per Julian century */
  rates?: ElementRates;
  /** sidereal period in days — used for the mean motion when rates.L is absent */
  periodDays?: number;
}

/**
 * Plane the elements are referenced to.
 *  - 'ecliptic': J2000 ecliptic (planets, our Moon)
 *  - 'equatorOf': a plane given by its pole in ICRF equatorial coordinates
 *    (e.g. a planet's equator, a good stand-in for the Laplace plane of
 *    close-in regular moons). The node is measured from where that plane
 *    crosses the ecliptic — an approximation that is fine for visuals.
 */
export type ReferencePlane =
  | { kind: 'ecliptic' }
  | { kind: 'equatorOf'; poleRA: number; poleDec: number };

export interface OrbitSpec {
  elements: KeplerianElements;
  referencePlane?: ReferencePlane;
  /** Overrides for the idealized (circular, coplanar) model. Usually derived. */
  idealized?: { a?: number; periodDays?: number };
}

export interface BodySpec {
  /** unique, lowercase, kebab-case */
  id: string;
  name: string;
  kind: BodyKind;
  /** id of the body this one orbits; null only for the root (the Sun) */
  parent: string | null;
  /** mean radius in km */
  radiusKm: number;
  /** base colour, hex '#rrggbb' — used for the mesh, markers and trails */
  color: string;
  orbit?: OrbitSpec;
  /** per-body tweaks to the picker's display scaling */
  display?: { radiusScale?: number; distanceScale?: number };
  /**
   * Period (days) used for the body's musical tone. Defaults to the orbital period;
   * the Sun has no orbit here, so it uses its equatorial rotation instead.
   */
  tonePeriodDays?: number;
  /** where the numbers came from */
  source?: string;
}
