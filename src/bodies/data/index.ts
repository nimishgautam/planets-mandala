import type { BodySpec } from '../types';
import { BodyRegistry } from '../registry';
import { sun } from './sun';
import { mercury } from './mercury';
import { venus } from './venus';
import { earth } from './earth';
import { moon } from './moon';
import { mars } from './mars';
import { phobos } from './phobos';
import { deimos } from './deimos';
import { ceres } from './ceres';
import { jupiter } from './jupiter';
import { io } from './io';
import { europa } from './europa';
import { ganymede } from './ganymede';
import { callisto } from './callisto';
import { saturn } from './saturn';
import { mimas } from './mimas';
import { enceladus } from './enceladus';
import { tethys } from './tethys';
import { dione } from './dione';
import { titan } from './titan';
import { hyperion } from './hyperion';
import { uranus } from './uranus';
import { miranda } from './miranda';
import { ariel } from './ariel';
import { umbriel } from './umbriel';
import { titania } from './titania';
import { oberon } from './oberon';
import { neptune } from './neptune';
import { triton } from './triton';
import { pluto } from './pluto';
import { halley } from './halley';
import { cruithne } from './cruithne';
import { kamooalewa } from './kamooalewa';

/** The library. To add a body: create a file next to this one and list it here. */
export const BODY_SPECS: BodySpec[] = [
  sun, mercury, venus, earth, moon, mars, phobos, deimos, ceres, jupiter, io, europa, ganymede, callisto, saturn, mimas, enceladus, tethys, dione, titan, hyperion, uranus, miranda, ariel, umbriel, titania, oberon, neptune, triton, pluto, halley, cruithne, kamooalewa,
];

export const bodies = new BodyRegistry(BODY_SPECS);
