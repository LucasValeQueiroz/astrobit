/**
 * AstroBit Campaign Levels Index.
 */

import { WORLD_1_LEVELS } from './world1-sequencia.js';
import { WORLD_2_LEVELS } from './world2-loops.js';
import { WORLD_3_LEVELS } from './world3-sensores.js';

export const CAMPAIGN_WORLDS = [
  {
    world: 1,
    icon: '🌙',
    namePt: 'Lua dos Cristais',
    nameEn: 'Moon of Crystals',
    conceptPt: 'Sequência & Curvas',
    conceptEn: 'Sequences & Turns',
    levels: WORLD_1_LEVELS,
  },
  {
    world: 2,
    icon: '⚙️',
    namePt: 'Planeta das Engrenagens',
    nameEn: 'Gear Planet',
    conceptPt: 'Loops (Repetir)',
    conceptEn: 'Loops (Repeat)',
    levels: WORLD_2_LEVELS,
  },
  {
    world: 3,
    icon: '⚡',
    namePt: 'Cinturão de Lasers',
    nameEn: 'Laser Belt',
    conceptPt: 'Sensores, Portais & Lasers',
    conceptEn: 'Sensors, Portals & Lasers',
    levels: WORLD_3_LEVELS,
  },
];

export const ALL_LEVELS = CAMPAIGN_WORLDS.flatMap((w) => w.levels);

export function getLevelById(id) {
  return ALL_LEVELS.find((lvl) => lvl.id === id) || ALL_LEVELS[0];
}

export function getNextLevel(currentId) {
  const idx = ALL_LEVELS.findIndex((lvl) => lvl.id === currentId);
  if (idx === -1 || idx + 1 >= ALL_LEVELS.length) return null;
  return ALL_LEVELS[idx + 1];
}
