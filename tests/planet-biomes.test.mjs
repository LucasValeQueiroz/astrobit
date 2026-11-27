import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLANET_BIOMES,
  getPlanetBiome,
  getRegionForLevel,
  computeOrbitalTransitionState,
} from '../src/story/planet-biomes.js';
import { WORLD_STORIES } from '../src/story/campaign-story.js';

test('all 8 planets have unique biome kinds and 6 named bilingual regions (48 total hubs)', () => {
  const worlds = [1, 2, 3, 4, 5, 6, 7, 8];
  const kinds = new Set();
  let totalRegions = 0;

  for (const w of worlds) {
    const biome = getPlanetBiome(w);
    assert.equal(biome.world, w);
    assert.ok(biome.kind && !kinds.has(biome.kind), `World ${w} biome kind must be unique`);
    kinds.add(biome.kind);
    assert.equal(biome.regions.length, 6);
    for (const r of biome.regions) {
      assert.ok(r.flag && r.landmark && r.shortPt && r.shortEn && r.hubPt && r.hubEn && r.factPt && r.factEn);
      totalRegions += 1;
    }
  }
  assert.equal(totalRegions, 48);
  assert.equal(PLANET_BIOMES[1].regions[0].shortPt, 'Brasil');
  assert.equal(PLANET_BIOMES[1].regions[1].shortPt, 'EUA');
  assert.equal(PLANET_BIOMES[1].regions[2].shortPt, 'Europa');
  assert.equal(PLANET_BIOMES[1].regions[3].shortPt, 'África');
  assert.equal(PLANET_BIOMES[1].regions[4].shortPt, 'China');
  assert.equal(PLANET_BIOMES[1].regions[5].shortPt, 'Japão');
  assert.equal(getRegionForLevel(1, 'w1-1').flag, '🇧🇷');
});

test('computeOrbitalTransitionState models AAA LOD 0 <-> LOD 3 streaming across liftoff and descent', () => {
  const liftoffStart = computeOrbitalTransitionState('liftoff', 0);
  const liftoffEnd = computeOrbitalTransitionState('liftoff', 1);
  assert.equal(liftoffStart.lodTier, 'LOD 0');
  assert.equal(liftoffStart.altitudeKm, 0);
  assert.equal(liftoffEnd.lodTier, 'LOD 3');
  assert.equal(liftoffEnd.altitudeKm, 420);

  const descentStart = computeOrbitalTransitionState('descent', 0);
  const descentMid = computeOrbitalTransitionState('descent', 0.5);
  const descentEnd = computeOrbitalTransitionState('descent', 1);
  assert.equal(descentStart.lodTier, 'LOD 3');
  assert.equal(descentMid.lodTier, 'LOD 2');
  assert.ok(descentMid.shieldTempC >= 1500, 'Re-entry mid-atmosphere should peak thermal shield');
  assert.equal(descentEnd.lodTier, 'LOD 0');
  assert.equal(descentEnd.chunksLoaded, 6);
  assert.equal(descentEnd.altitudeKm, 0);
  assert.equal(descentEnd.shieldTempC, 24);
});

test('World 1 Earth map baseCoords align geographically with continents (Brazil, USA, Europe, Africa, China, Japan)', () => {
  const [brazil, usa, europe, africa, china, japan] = WORLD_STORIES[1].baseCoords;
  // West-to-east progression
  assert.ok(brazil.x < usa.x && usa.x < europe.x && europe.x < africa.x && africa.x < china.x && china.x < japan.x);
  // Hemisphere alignment: USA north of Brazil; Europe north of Africa; China north of Africa
  assert.ok(usa.y < brazil.y, 'USA must be north of Brazil');
  assert.ok(europe.y < africa.y, 'Europe must be north of Africa');
  assert.ok(china.y < africa.y, 'China must be north of Africa');
});
