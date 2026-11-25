import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLANET_BIOMES,
  getPlanetBiome,
  getRegionForLevel,
  computeOrbitalTransitionState,
} from '../src/story/planet-biomes.js';

test('all 7 planets have unique biome kinds and 6 named bilingual regions (42 total hubs)', () => {
  const worlds = [1, 2, 3, 4, 5, 6, 7];
  const kinds = new Set();
  let totalRegions = 0;

  for (const w of worlds) {
    const biome = getPlanetBiome(w);
    assert.equal(biome.world, w);
    assert.ok(biome.kind && !kinds.has(biome.kind), `World ${w} biome kind must be unique`);
    kinds.add(biome.kind);
    assert.equal(biome.regions.length, 6);
    for (const r of biome.regions) {
      assert.ok(r.flag && r.shortPt && r.shortEn && r.hubPt && r.hubEn);
      totalRegions += 1;
    }
  }
  assert.equal(totalRegions, 42);
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
  assert.equal(descentMid.lodTier, 'LOD 1');
  assert.equal(descentEnd.lodTier, 'LOD 0');
  assert.equal(descentEnd.chunksLoaded, 6);
  assert.equal(descentEnd.altitudeKm, 0);
});
