import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GALAXY_PLANETS,
  getGalaxyPlanet,
  sampleGalaxyFlight,
} from '../src/story/galaxy-flight.js';

test('GALAXY_PLANETS defines all 7 worlds in normalized space coordinates', () => {
  assert.equal(GALAXY_PLANETS.length, 7);
  for (let w = 1; w <= 7; w++) {
    const p = getGalaxyPlanet(w);
    assert.equal(p.world, w);
    assert.ok(p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1);
  }
});

test('sampleGalaxyFlight flies from origin to destination and zooms smoothly on approach', () => {
  const start = sampleGalaxyFlight(1, 7, 0);
  const mid = sampleGalaxyFlight(1, 7, 0.35);
  const approach = sampleGalaxyFlight(1, 7, 0.85);
  const end = sampleGalaxyFlight(1, 7, 1);

  assert.equal(start.stage, 'cruise');
  assert.equal(start.lodTier, 'LOD 3');
  assert.ok(Math.abs(start.shipX - start.origin.x) < 0.001);
  assert.ok(start.distanceKm > 50000);

  assert.equal(mid.stage, 'cruise');
  assert.ok(mid.distanceKm < start.distanceKm);
  assert.equal(mid.cameraZoom, 1);

  assert.equal(approach.stage, 'approach');
  assert.ok(approach.cameraZoom > 1.5);

  assert.equal(end.stage, 'approach');
  assert.equal(end.lodTier, 'LOD 1');
  assert.equal(end.distanceKm, 0);
  assert.ok(end.cameraZoom >= 4.3);
  assert.ok(Math.abs(end.shipX - end.dest.x) < 0.001);
});
