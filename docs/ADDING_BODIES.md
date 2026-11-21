# Adding a body

Each body is one TypeScript file in `src/bodies/data/` that exports a `BodySpec`
(defined in `src/bodies/types.ts`). Adding a body takes two steps:

1. Create `src/bodies/data/<id>.ts`.
2. Import it in `src/bodies/data/index.ts` and add it to `BODY_SPECS`.

That's it. The new body shows up in the dropdowns, in the 3D picker (with an orbit ring and
scaled position), and works with every pattern mode. The registry validates the library at
startup and `npm test` checks it too. A bad spec fails loudly with a list of problems.

## Example: Saturn

```ts
import type { BodySpec } from '../types';
import { J2000 } from '../units';

export const saturn: BodySpec = {
  id: 'saturn',               // lowercase kebab-case, unique
  name: 'Saturn',
  kind: 'planet',             // 'star' | 'planet' | 'moon' | 'dwarf' | 'asteroid' | 'comet' | 'other'
  parent: 'sun',              // id of the body it orbits
  radiusKm: 58_232,
  color: '#e9d7a5',           // used for the mesh, the markers and 'solid' trails
  orbit: {
    elements: {
      epochJD: J2000,
      a: 9.53667594,          // AU
      e: 0.05386179,
      i: 2.48599187,          // deg
      L: 49.95424423,         // mean longitude, deg
      varpi: 92.59887831,     // longitude of perihelion, deg
      Omega: 113.66242448,    // longitude of ascending node, deg
      rates: {                // per Julian century (optional except for L/periodDays)
        a: -0.0012506, e: -0.00050991, i: 0.00193609,
        L: 1222.49362201, varpi: -0.41897216, Omega: -0.28867794,
      },
    },
  },
  source: 'JPL "Approximate Positions of the Planets", Table 1',
};
```

## Fields

| field | notes |
|---|---|
| `orbit.elements` | Classical mean elements **relative to the parent**. Angles are in degrees and `a` is in AU (use `km()` from `bodies/units` for moons). |
| `L` | Mean longitude = Ω + ω + M. If your source gives ω (argument of periapsis) and M (mean anomaly), use `varpi = Omega + omega` and `L = varpi + M`. |
| mean motion | Supply **either** `rates.L` (deg/century) **or** `periodDays` (sidereal). |
| `referencePlane` | Defaults to the J2000 ecliptic. For regular moons whose elements are given relative to their planet's equator or Laplace plane, use `{ kind: 'equatorOf', poleRA, poleDec }` with the planet's IAU pole (see `JUPITER_POLE` in `jupiter.ts`). |
| `orbit.idealized` | Optional overrides for the circular/coplanar model (`a`, `periodDays`). Normally derived from the elements. |
| `tonePeriodDays` | Optional. The period (days) that sets the body's musical tone. Defaults to the orbital period; the Sun uses its rotation. |
| `display.radiusScale` / `display.distanceScale` | Multipliers on the picker's compressed scaling, for bodies that look crowded. |

## Recipes by data source

**JPL SBDB (asteroids, comets, dwarf planets).** Query
`https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=<name>&full-prec=1` and map the fields:

| SBDB | spec |
|---|---|
| `epoch` | `epochJD` |
| `a`, `e`, `i` | `a`, `e`, `i` |
| `om` | `Omega` |
| `om + w` | `varpi` |
| `om + w + ma` | `L` |
| `per` | `periodDays` |

The elements are already heliocentric, ecliptic J2000. See `halley.ts` and `pluto.ts`.

**JPL satellite mean elements** (`https://ssd.jpl.nasa.gov/sats/elem/`).

| table column | spec |
|---|---|
| `a` (km) | `a: km(...)` |
| `node` | `Omega` |
| `node + ω` | `varpi` |
| `node + ω + M` | `L` |
| `P` | `periodDays` |

- **Reference plane.** For *Laplace*-frame rows, use the row's own pole:
  `referencePlane: { kind: 'equatorOf', poleRA, poleDec }`. For *equatorial*-frame rows, use
  the planet's IAU pole (see `URANUS_POLE` in `uranus.ts`).
- **Watch out for the Galilean moons.** JPL's `P` column for them is *not* the mean-longitude
  rate. Using it breaks their 1:2:4 resonance by about 1.5°/day, so their files use the
  sidereal periods. Check any moon in a resonance against its partner.

## Where to find numbers

- **Planets:** JPL SSD, "Approximate Positions of the Planets" (Table 1, 1800–2050).
- **Moons:** JPL SSD "Planetary Satellite Mean Elements". These give a, e, ω, M, i, node and
  period, relative to the local Laplace plane at epoch 2000-01-01.5.
- **Poles:** the IAU WGCCRE report (right ascension and declination of each planet's north pole).

## Accuracy notes

- Positions use two-body Kepler orbits with linearly drifting elements. That's very good for the
  planets over centuries, and fine for the shapes of moon patterns, but it isn't an ephemeris
  (there's no perturbation theory).
- Earth uses the Earth–Moon barycentre elements, which puts it about 4,700 km off. That's
  invisible at these scales.
- Small bodies use *osculating* elements: a snapshot that drifts over decades. For example,
  Halley's 1974 elements put its 1986 perihelion at 0.575 AU instead of 0.587.
- For `equatorOf` planes, the node is measured from where that plane crosses the ecliptic,
  which is a constant phase offset. Patterns among sibling moons are unaffected.
