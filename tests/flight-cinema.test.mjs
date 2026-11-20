import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSegmentControlPoint,
  sampleQuadraticBezier,
  generateHyperspaceStars,
} from '../src/ui/flight-cinema.js';

test('sampleQuadraticBezier traces exact start, curved midpoint, end, and heading angle', () => {
  const p0 = { x: 85, y: 195 };
  const p2 = { x: 195, y: 120 };
  const ctrl = computeSegmentControlPoint(p0, p2, 1);

  const start = sampleQuadraticBezier(p0, ctrl, p2, 0);
  const mid = sampleQuadraticBezier(p0, ctrl, p2, 0.5);
  const end = sampleQuadraticBezier(p0, ctrl, p2, 1);

  assert.equal(Math.round(start.x), p0.x);
  assert.equal(Math.round(start.y), p0.y);
  assert.equal(Math.round(end.x), p2.x);
  assert.equal(Math.round(end.y), p2.y);
  // Curved midpoint should differ from linear midpoint by half the bend
  assert.notEqual(Math.round(mid.y), Math.round((p0.y + p2.y) / 2));
  assert.ok(Number.isFinite(mid.angleDeg));
});

test('generateHyperspaceStars creates valid radial warp streak descriptors', () => {
  const stars = generateHyperspaceStars(40);
  assert.equal(stars.length, 40);
  for (const s of stars) {
    assert.ok(s.speed > 0);
    assert.ok(s.width > 0);
    assert.ok(typeof s.color === 'string' && s.color.startsWith('#'));
  }
});
