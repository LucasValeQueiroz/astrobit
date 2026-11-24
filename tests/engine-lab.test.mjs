import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENGINE_LAB_TOPICS,
  evaluateFrustumAndOcclusion,
  selectLodTier,
  computeStreamingChunks,
} from '../src/engine/engine-lab-sim.js';

test('evaluateFrustumAndOcclusion culls out-of-cone and moon-occluded entities cleanly', () => {
  const entities = [
    { id: 1, x: 160, y: 150 }, // clearly visible in front
    { id: 2, x: 340, y: 150 }, // directly behind occluder at (230, 150)
    { id: 3, x: 50, y: 20 },   // behind camera / outside frustum
  ];
  const on = evaluateFrustumAndOcclusion({
    camX: 80,
    camY: 150,
    camAngle: 0,
    fovRad: Math.PI / 3,
    maxDist: 360,
    occluder: { x: 230, y: 150, r: 35 },
    entities,
    cullingEnabled: true,
  });
  assert.equal(on.stats.visible, 1);
  assert.equal(on.stats.occluded, 1);
  assert.equal(on.stats.frustumCulled, 1);
  assert.equal(on.stats.drawn, 1);

  const off = evaluateFrustumAndOcclusion({
    camX: 80,
    camY: 150,
    camAngle: 0,
    fovRad: Math.PI / 3,
    maxDist: 360,
    occluder: { x: 230, y: 150, r: 35 },
    entities,
    cullingEnabled: false,
  });
  assert.equal(off.stats.drawn, 3);
  assert.ok(on.stats.fps > off.stats.fps);
});

test('selectLodTier reduces polygon count and GPU load with distance when enabled', () => {
  const close = selectLodTier(0.1, true);
  const mid = selectLodTier(0.5, true);
  const far = selectLodTier(0.9, true);
  const noLod = selectLodTier(0.9, false);

  assert.equal(close.tier, 'LOD0');
  assert.equal(mid.tier, 'LOD1');
  assert.equal(far.tier, 'LOD2');
  assert.ok(far.triangles < mid.triangles && mid.triangles < close.triangles);
  assert.ok(far.gpuPct < noLod.gpuPct);
});

test('computeStreamingChunks keeps VRAM bounded and prefetches in velocity direction', () => {
  const on = computeStreamingChunks({ cols: 7, rows: 5, shipCol: 2, shipRow: 2, velX: 1, velY: 0, streamingEnabled: true });
  const off = computeStreamingChunks({ cols: 7, rows: 5, shipCol: 2, shipRow: 2, velX: 1, velY: 0, streamingEnabled: false });

  assert.equal(on.stats.loadedCount, 9);
  assert.ok(on.stats.prefetchCount > 0);
  assert.ok(on.stats.vramPct < off.stats.vramPct);
  assert.equal(off.stats.vramPct, 100);
  assert.ok(ENGINE_LAB_TOPICS.length >= 3);
});
