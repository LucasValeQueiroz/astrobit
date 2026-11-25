import test from 'node:test';
import assert from 'node:assert/strict';

import { createWorldState, isIceTile, hasCrateAt } from '../src/engine/grid.js';
import { executeProgram } from '../src/engine/interpreter.js';
import { WORLD_7_LEVELS } from '../src/levels/world7-gelo.js';
import { validateLevel } from '../src/engine/validator.js';
import { evaluateBadges } from '../src/storage/achievements.js';
import { encodeCustomLevel, decodeCustomLevel, validateWorkshopDraft } from '../src/engine/custom-level.js';

test('robot slides cleanly across slippery ice tiles and stops safely before walls', () => {
  const level = {
    rows: [
      '#######',
      '#>~~~.#',
      '#######',
    ],
  };
  const world = createWorldState(level);
  assert.equal(isIceTile(world, 2, 1), true);
  assert.equal(isIceTile(world, 5, 1), false);

  const res = executeProgram(level, [{ id: 'b1', type: 'move_right' }]);
  assert.equal(res.finalState.x, 5);
  assert.equal(res.finalState.y, 1);
  assert.equal(res.events.filter((e) => e.type === 'slide').length, 3);
});

test('pushing an energy crate onto ice curls it onto a button and toggles the laser channel', () => {
  const level = {
    rows: [
      '########',
      '#>O~~~a#',
      '#....A*#',
      '########',
    ],
  };
  const world = createWorldState(level);
  assert.equal(hasCrateAt(world, 2, 1), true);

  const res = executeProgram(level, [{ id: 'b1', type: 'move_right' }]);
  assert.equal(res.status, 'incomplete');
  assert.equal(res.finalState.x, 2);
  assert.equal(res.finalState.channels.A, true);
  const pushEv = res.events.find((e) => e.type === 'push_crate');
  assert.ok(pushEv);
  assert.equal(pushEv.toX, 6);
  assert.equal(pushEv.toY, 1);
  assert.equal(pushEv.slid, true);
});

test('pushing a crate into a wall fails cleanly with crate_blocked', () => {
  const level = {
    rows: [
      '#####',
      '#>O##',
      '#####',
    ],
  };
  const res = executeProgram(level, [{ id: 'b1', type: 'move_right' }]);
  assert.equal(res.status, 'failed');
  assert.equal(res.failureReason, 'crate_blocked');
  assert.equal(res.failedBlockId, 'b1');
});

test('all 6 World 7 Frozen Planet levels are mathematically proven 3-star solvable and unlock frost-master badge', () => {
  assert.equal(WORLD_7_LEVELS.length, 6);
  for (const level of WORLD_7_LEVELS) {
    const check = validateLevel(level);
    assert.equal(check.valid, true, `Level ${level.id} failed validation: ${check.errors?.join(', ')}`);
    assert.equal(check.referenceRun?.stars, 3, `Level ${level.id} should earn 3 stars with referenceSolution`);
  }

  const badgeResult = evaluateBadges({ starsByLevel: { 'w7-6': 3 }, unlockedBadges: [] });
  assert.ok(badgeResult.unlockedBadges.includes('frost-master'));
});

test('workshop supports ice (~) and energy crate (O) tiles in validation and URL encoding', () => {
  const draft = {
    title: 'Pista Polar Teste',
    world: 7,
    parBlocks: 6,
    extras: ['repeat'],
    rows: [
      '########',
      '#>O~~a.#',
      '#...A*G#',
      '########',
    ],
  };
  const v = validateWorkshopDraft(draft);
  assert.equal(v.valid, true);
  const encoded = encodeCustomLevel(draft);
  const decoded = decodeCustomLevel(encoded);
  assert.ok(decoded);
  assert.deepEqual(decoded.rows, draft.rows);
});
