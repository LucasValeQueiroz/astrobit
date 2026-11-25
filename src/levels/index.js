/**
 * AstroBit Campaign Levels Index.
 */

import { WORLD_1_LEVELS } from './world1-sequencia.js?v=4.0';
import { WORLD_2_LEVELS } from './world2-loops.js?v=4.0';
import { WORLD_3_LEVELS } from './world3-sensores.js?v=4.0';
import { WORLD_4_LEVELS } from './world4-funcoes.js?v=4.0';
import { WORLD_5_LEVELS } from './world5-desafios.js?v=4.0';
import { WORLD_6_LEVELS } from './world6-portais.js?v=5.0';
import { WORLD_7_LEVELS } from './world7-gelo.js?v=5.5';

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
  {
    world: 4,
    icon: '🛰️',
    namePt: 'Estação das Funções',
    nameEn: 'Function Station',
    conceptPt: 'Funções Reutilizáveis (F1/F2)',
    conceptEn: 'Reusable Functions (F1/F2)',
    levels: WORLD_4_LEVELS,
  },
  {
    world: 5,
    icon: '🌌',
    namePt: 'Nebulosa do Engenheiro',
    nameEn: 'Engineer Nebula',
    conceptPt: 'Caça ao Bug & Desafio Final',
    conceptEn: 'Bug Hunt & Grand Finale',
    levels: WORLD_5_LEVELS,
  },
  {
    world: 6,
    icon: '🌀',
    namePt: 'Buraco de Minhoca',
    nameEn: 'Wormhole Dimension',
    conceptPt: 'Mundo Bônus · Cadeias de Portais',
    conceptEn: 'Bonus World · Portal Chains',
    levels: WORLD_6_LEVELS,
  },
  {
    world: 7,
    icon: '🧊',
    namePt: 'Planeta Congelado',
    nameEn: 'Frozen Planet',
    conceptPt: 'Física Polar · Gelo & Baterias',
    conceptEn: 'Polar Physics · Ice & Energy Crates',
    levels: WORLD_7_LEVELS,
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
