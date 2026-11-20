import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_LEVELS } from '../src/levels/index.js';
import { validateLevel } from '../src/engine/validator.js';

test('every campaign level is structurally valid and mathematically proven to win with 3 stars', () => {
  assert.ok(ALL_LEVELS.length >= 12);
  const seenIds = new Set();

  for (const level of ALL_LEVELS) {
    assert.equal(seenIds.has(level.id), false, `Duplicate level id: ${level.id}`);
    seenIds.add(level.id);

    const report = validateLevel(level);
    assert.equal(
      report.valid,
      true,
      `Level ${level.id} failed validation: ${report.errors.join('; ')}`
    );
    assert.equal(report.referenceRun?.stars, 3, `Level ${level.id} referenceSolution must score 3★`);
  }
});
