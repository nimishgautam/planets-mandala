# Planet Mandalas

Pick any two bodies in the solar system and watch the pattern one traces relative to the
other. The classic example is the five-petalled rose Venus draws around Earth over 8 years.

**Try it live: <https://nimishgautam.github.io/planets-mandala/>.** It runs entirely in the
browser, so there's nothing to install. The URL keeps your current settings, so you can copy it
to share a particular mandala. The site redeploys automatically from `main` through GitHub
Actions (`.github/workflows/deploy.yml`).

To run it locally:

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine unit tests
npm run build
```

## Using it

- **Picker:** click a body to set the **observer** (it stays still), then click another for the
  **target**. The dropdowns do the same thing. Then click *Draw the mandala* (or press Enter, or
  double-click a body).
- **Pattern view:**
  - *Path:* the target's position in a frame centred on the observer.
  - *Tether:* lines drawn between the two bodies as both orbit their common centre (the "dance
    of Venus").
  - *Draw modes:*
    - *Full* shows the whole pattern at once.
    - *Trace* draws it, holds, fades out and redraws.
    - *Fleeting* moves the body with a fading trail.
  - *Frame:*
    - *Inertial* keeps the axes fixed against the stars.
    - *Co-rotating* spins the frame so the observer's parent (e.g. the Sun for Earth) stays in
      one direction.
  - *Orbits:* *Real* uses Keplerian elements. *Ideal* uses circular, coplanar orbits.
  - *Colour:* by body, by time (the hue drifts along the path), or by speed.
  - The transport bar has play/pause (Space), scrubbing, and ♪ for sound (see *Music of the
    spheres* below).
  - Escape returns to the picker.
- **Settings** (top right):
  - duration and closure tolerance
  - start date
  - chord count
  - out-of-plane exaggeration
  - fade length, intensity, hue cycles and bloom
  - live-tunable picker scaling constants
- **Sharing:** the URL hash holds the full state, e.g.
  `#a=earth&b=venus&view=pattern&type=tether&draw=fleeting`.

## The library (33 bodies)

- **Sun and planets:** Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
- **Moons:**
  - Moon
  - Phobos, Deimos
  - Io, Europa, Ganymede, Callisto
  - Mimas, Enceladus, Tethys, Dione, Titan, Hyperion
  - Miranda, Ariel, Umbriel, Titania, Oberon
  - Triton
- **Dwarf planets and small bodies:** Ceres, Pluto, Halley's Comet, and two of Earth's
  companions, Cruithne and Kamoʻoalewa

Pairs worth trying:

| Pair | What you'll see |
|---|---|
| Jupiter–Saturn tether | Kepler's "Great Trigon", a slowly turning trefoil |
| Neptune–Pluto tether | A heart drawn by their 3:2 resonance over ~494 years |
| Earth→Cruithne or Earth→Kamoʻoalewa, co-rotating | The bean and the quasi-moon loop |
| Mimas→Tethys, Io→Europa | Resonances that play as octaves |
| Earth→Titania (raise *out-of-plane ×*) | Uranus's sideways moon system |

## Performance

| | cost |
|---|---|
| Picker, per frame | ~0.03 ms of JS for all 33 bodies; ~100 draw calls / ~95k triangles |
| Pattern build | 4–40 ms for typical pairs |
| Pattern geometry | at most 400k line vertices |

Three things keep pattern builds cheap:

- Orbits under 0.1% of the pattern's largest orbit are ignored when choosing duration and
  sampling. Titania's wiggle as seen from Earth would otherwise demand 400k samples for
  nothing.
- Eccentric orbits get proportionally denser sampling, so Halley's perihelion is resolved.
- The picker slows fast moons so none orbits quicker than about 14 seconds.

## How it works

```
src/bodies/   BodySpec standard, validated registry, one file per body
src/engine/   pure TS: Kepler solver, ephemeris, frames, pattern sampling, auto-duration
src/render/   three.js: shared stage + bloom, pattern view, solar-system picker, display scaling
src/ui/       overlay controls + lil-gui settings
src/audio/    Web Audio drone
```

- **Auto duration:** the app looks for the shortest span after which every involved orbit
  (observer, target, and their parents up to the common ancestor) has completed a
  near-integer number of turns. Earth–Venus gives 8 years (8 : 13) and Earth–Jupiter 12
  years. If no span closes within the tolerance, the caption says it *never quite repeats*.
- **One geometry, three draw modes:** each vertex carries its normalized time, and a shader
  decides visibility and fading from a `uNow` uniform. Playback costs nothing beyond updating
  uniforms.
- **Brightness** is normalized by how many times a curve retraces itself, so additive blending
  doesn't white out (for example, Io circling Jupiter 2,400 times).
- The picker uses compressed scales (`src/render/displayScale.ts`): distances ∝ a^0.5, radii ∝
  R^0.4, a capped Sun, and moons placed logarithmically outside their inflated planet. Pattern
  views always use true geometry.

## Music of the spheres

Every pairing gets its own drone, built from the bodies' real periods but held to a few rules
that keep it consonant:

1. **Cosmic octave tones** (after Hans Cousto, 1978): each body's orbital frequency is doubled
   until it's audible. Earth's year becomes 136.1 Hz. The Sun uses its 25.38-day rotation.
2. **The observer sets the key.** Its tone is the root, with a sub-octave below it.
3. **The target snaps to a consonance.** Its true interval above the root is moved to the
   nearest of 1:1, 6:5, 5:4, 4:3, 3:2, 8:5, 5:3 or 2:1, tuned in just intonation.
   Earth→Venus is truly 13:8 (the same resonance that draws the pentagram) and plays as an
   8:5 minor sixth.
4. **Shimmer:** the snapping error becomes a quiet partner tone that beats slowly
   (0.07–0.6 Hz). Big compromises shimmer more; you can switch this off under
   Settings → Sound.
5. **Approach bells:** each closest approach rings a soft bell on a just pentatonic scale.
   Where the encounter happens around the circle picks the note, so Venus's five
   conjunctions play a five-note phrase in the pentagram's skipping order. Bells are spaced at
   least 1.6 s apart.
6. The filter opens as the pair draws closer.

The caption shows the maths, e.g. `♪ Earth 136.1 Hz · Venus 221.2 Hz · 13:8 → 8:5 minor sixth (−27¢)`.

To add more bodies, see [docs/ADDING_BODIES.md](docs/ADDING_BODIES.md).
