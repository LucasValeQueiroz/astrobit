import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COMPANION_DRONES,
  getDroneById,
  getUnlockedDrones,
  shouldOfferSmartHint,
  computeProgressiveHint,
} from '../src/engine/companions-and-hints.js';

test('companion drones unlock progressively by space medal count and fall back safely', () => {
  assert.equal(COMPANION_DRONES.length, 5);
  assert.equal(getDroneById('unknown').id, 'spark');
  assert.equal(getDroneById('quantum-fox').icon, '🦊');

  assert.equal(getUnlockedDrones(0).length, 1);
  assert.equal(getUnlockedDrones(3).length, 2);
  assert.equal(getUnlockedDrones(6).length, 3);
  assert.equal(getUnlockedDrones(9).length, 4);
  assert.equal(getUnlockedDrones(12).length, 5);
});

test('progressive smart hints give spoiler-free conceptual tip on tier 1 and concrete block on tier 2', () => {
  assert.equal(shouldOfferSmartHint(0), false);
  assert.equal(shouldOfferSmartHint(1), false);
  assert.equal(shouldOfferSmartHint(2), true);

  const loopLevel = {
    hintPt: 'Use um loop!',
    hintEn: 'Use a loop!',
    firstBlockHint: 'repeat',
    referenceSolution: [
      { id: 'r1', type: 'repeat', times: 3, body: [{ id: 'r2', type: 'move_right' }] },
    ],
  };

  const tier1 = computeProgressiveHint(loopLevel, { main: [] }, 1, 'pt');
  assert.equal(tier1.tier, 1);
  assert.equal(tier1.highlightBlockType, null);
  assert.match(tier1.message, /Repetir/);

  const tier2 = computeProgressiveHint(loopLevel, { main: [] }, 2, 'en');
  assert.equal(tier2.tier, 2);
  assert.equal(tier2.highlightBlockType, 'repeat');
  assert.match(tier2.message, /2\/2/);
});
