import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizePilotName,
  computePilotRank,
  buildPassportSummary,
} from '../src/engine/space-passport.js';

test('sanitizePilotName trims, caps length, and provides friendly bilingual fallback', () => {
  assert.equal(sanitizePilotName('', 'pt'), 'Explorador Espacial');
  assert.equal(sanitizePilotName('   ', 'en'), 'Space Explorer');
  assert.equal(sanitizePilotName('  Lucas\nVale  ', 'pt'), 'Lucas Vale');
  assert.equal(sanitizePilotName('A'.repeat(50), 'en').length, 28);
});

test('computePilotRank progresses through all 5 ranks up to AAA Universe Legend', () => {
  assert.equal(computePilotRank({ stars: 0, badges: 0, labMastered: 0 }).id, 'space-cadet');
  assert.equal(computePilotRank({ stars: 20, badges: 2, labMastered: 0 }).id, 'orbit-pilot');
  assert.equal(computePilotRank({ stars: 60, badges: 5, labMastered: 2 }).id, 'quantum-engineer');
  assert.equal(computePilotRank({ stars: 95, badges: 10, labMastered: 5 }).id, 'galaxy-commander');
  assert.equal(computePilotRank({ stars: 120, badges: 15, labMastered: 7 }).id, 'aaa-legend');
});

test('buildPassportSummary aggregates stars, medals, arcade record, skin, drone, and AAA seal', () => {
  const progress = {
    pilotName: 'Lucas',
    skinId: 'frost',
    droneId: 'quantum-fox',
    starsByLevel: { 'w1-1': 3, 'w7-6': 3 },
    unlockedBadges: ['first-flight', 'frost-master', 'arcade-ace'],
    labMasteredTopics: ['culling', 'lod', 'streaming', 'ai_lod', 'fluids', 'raytracing', 'upscaling'],
    arcadeBestScore: 2450,
    arcadeBestRound: 6,
  };
  const summary = buildPassportSummary(progress, { lang: 'pt', dailyStreak: 5 });
  assert.equal(summary.pilotName, 'Lucas');
  assert.equal(summary.stars, 6);
  assert.equal(summary.badges, 3);
  assert.equal(summary.isAaaCertified, true);
  assert.equal(summary.arcadeBestScore, 2450);
  assert.equal(summary.dailyStreak, 5);
  assert.equal(summary.skin.id, 'frost');
  assert.equal(summary.drone.id, 'quantum-fox');
});
