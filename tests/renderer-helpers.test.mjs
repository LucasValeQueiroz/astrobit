import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROBOT_SKINS,
  getSkinById,
  getUnlockedSkins,
  getWorldPalette,
} from '../src/renderer/robot-skins.js';
import { ParticleSystem } from '../src/renderer/particles.js';
import { shortestAngleLerp } from '../src/renderer/canvas-renderer.js';

test('robot skins unlock progressively by stars earned and fall back safely', () => {
  assert.equal(ROBOT_SKINS.length, 8);
  assert.equal(getSkinById('unknown').id, 'explorer');
  assert.equal(getSkinById('nova').accessory, 'cape');

  assert.equal(getUnlockedSkins(0).length, 1);
  assert.equal(getUnlockedSkins(12).length, 3);
  assert.equal(getUnlockedSkins(60).length, 6);
  assert.equal(getUnlockedSkins(80).length, 7);
  assert.equal(getUnlockedSkins(100).length, 8);
  assert.equal(getWorldPalette(7).nameEn, 'Frozen Planet');
  assert.equal(getWorldPalette(99).nameEn, 'Moon of Crystals');
});

test('ParticleSystem spawns, ages, and expires particles cleanly', () => {
  const ps = new ParticleSystem();
  ps.ensureStarfield(600, 400, 20);
  assert.equal(ps.stars.length, 20);

  ps.emitSparkles(100, 100, '#7dd3fc', 10);
  ps.emitTeleport(200, 200, '#c084fc');
  assert.ok(ps.particles.length >= 30);

  for (let i = 0; i < 40; i++) {
    ps.update(0.05);
  }
  assert.equal(ps.particles.length, 0);
});

test('shortestAngleLerp rotates across -PI/+PI boundary cleanly', () => {
  const next = shortestAngleLerp(Math.PI, -Math.PI / 2, 0.5);
  assert.ok(next > Math.PI && next < Math.PI * 1.5);
});
