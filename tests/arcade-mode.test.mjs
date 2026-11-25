import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ARCADE_MAX_SHIELDS,
  createArcadeRun,
  applyArcadeOutcome,
  computeComboMultiplier,
  generateArcadeLevel,
} from '../src/engine/arcade-mode.js';
import { validateLevel } from '../src/engine/validator.js';
import { evaluateBadges } from '../src/storage/achievements.js';

test('generateArcadeLevel produces valid 3-star solvable levels across 30 escalating rounds', () => {
  const seed = 424242;
  for (let round = 1; round <= 30; round++) {
    const level = generateArcadeLevel(round, seed);
    assert.equal(level.isArcade, true);
    assert.equal(level.arcadeRound, round);
    assert.ok(level.world >= 1 && level.world <= 7);
    const report = validateLevel(level);
    assert.equal(report.valid, true, `Arcade round ${round} invalid: ${report.errors?.join(', ')}`);
    assert.equal(report.referenceRun?.stars, 3, `Arcade round ${round} must earn 3★`);
  }
});

test('arcade combo multipliers escalate cleanly up to x5 and shields trigger game over at 0', () => {
  assert.equal(computeComboMultiplier(0), 1);
  assert.equal(computeComboMultiplier(1), 2);
  assert.equal(computeComboMultiplier(4), 5);
  assert.equal(computeComboMultiplier(99), 5);

  let run = createArcadeRun(12345);
  assert.equal(run.shields, ARCADE_MAX_SHIELDS);
  assert.equal(run.round, 1);

  // Win 1st try -> streak 1 -> x2 multiplier -> (100 + 150) * 2 = 500
  run = applyArcadeOutcome(run, { won: true, stars: 3 });
  assert.equal(run.round, 2);
  assert.equal(run.streak, 1);
  assert.equal(run.multiplier, 2);
  assert.equal(run.score, 500);

  // Fail once -> loses 1 shield, resets streak & multiplier
  run = applyArcadeOutcome(run, { won: false });
  assert.equal(run.shields, 2);
  assert.equal(run.streak, 0);
  assert.equal(run.multiplier, 1);
  assert.equal(run.gameOver, false);

  // Lose remaining 2 shields -> game over
  run = applyArcadeOutcome(run, { won: false });
  assert.equal(run.shields, 1);
  run = applyArcadeOutcome(run, { won: false });
  assert.equal(run.shields, 0);
  assert.equal(run.gameOver, true);
});

test('arcade-ace space medal unlocks at round 3+ or 1000+ points', () => {
  const res1 = evaluateBadges({ arcadeBestRound: 3, arcadeBestScore: 600, unlockedBadges: [] });
  assert.ok(res1.unlockedBadges.includes('arcade-ace'));

  const res2 = evaluateBadges({ arcadeBestRound: 1, arcadeBestScore: 1050, unlockedBadges: [] });
  assert.ok(res2.unlockedBadges.includes('arcade-ace'));
});
