import test from 'node:test';
import assert from 'node:assert/strict';

import { computeLiveWayfinder } from '../src/engine/pathfinder-coach.js';
import { getLevelById } from '../src/levels/index.js';

test('computeLiveWayfinder computes shortest path from empty program and adapts mid-solution', () => {
  const lvl1 = getLevelById('w1-1');

  // Empty program -> recommends move_right toward crystal
  const r0 = computeLiveWayfinder(lvl1, { main: [] });
  assert.equal(r0.found, true);
  assert.equal(r0.alreadyWon, false);
  assert.equal(r0.nextBlockType, 'move_right');
  assert.ok(r0.path.length >= 2);
  assert.ok(r0.explored.length >= 2);

  // After moving right onto the crystal -> recommends collect!
  const r1 = computeLiveWayfinder(lvl1, { main: [{ id: 'a', type: 'move_right' }] });
  assert.equal(r1.found, true);
  assert.equal(r1.nextBlockType, 'collect');

  // After collecting the crystal -> recommends move_right to Goal ★!
  const r2 = computeLiveWayfinder(lvl1, {
    main: [
      { id: 'a', type: 'move_right' },
      { id: 'b', type: 'collect' },
    ],
  });
  assert.equal(r2.found, true);
  assert.equal(r2.nextBlockType, 'move_right');

  // Complete winning solution -> alreadyWon = true
  const r3 = computeLiveWayfinder(lvl1, lvl1.referenceSolution);
  assert.equal(r3.alreadyWon, true);
});
