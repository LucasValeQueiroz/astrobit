import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_LEVELS, CAMPAIGN_WORLDS } from '../src/levels/index.js';
import { validateLevel } from '../src/engine/validator.js';

test('every campaign level across all 6 worlds (36 levels) is valid and mathematically proven to win with 3 stars', () => {
  assert.equal(CAMPAIGN_WORLDS.length, 6);
  assert.equal(ALL_LEVELS.length, 36);

  const seenIds = new Set();
  let bugHuntCount = 0;

  for (const level of ALL_LEVELS) {
    assert.equal(seenIds.has(level.id), false, `Duplicate level id: ${level.id}`);
    seenIds.add(level.id);

    if (level.isBugHunt) {
      assert.ok(level.starterProgram, `Bug Hunt level ${level.id} must include starterProgram`);
      bugHuntCount += 1;
    }

    const report = validateLevel(level);
    assert.equal(
      report.valid,
      true,
      `Level ${level.id} failed validation: ${report.errors.join('; ')}`
    );
    assert.equal(report.referenceRun?.stars, 3, `Level ${level.id} referenceSolution must score 3★`);
  }

  assert.equal(bugHuntCount, 3, 'Campaign should include 3 Bug Hunt debugging levels');
});
