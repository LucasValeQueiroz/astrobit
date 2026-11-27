import test from 'node:test';
import assert from 'node:assert/strict';

import { computeGuidedTutorialStep } from '../src/engine/guided-tutorial.js';
import { getLevelById } from '../src/levels/index.js';

test('guided tutorial walks kids through Steps 1 -> 2 -> 3 on Level 1-1 dynamically', () => {
  const lvl1 = getLevelById('w1-1');

  // Step 1: empty program -> highlight first block
  const s1 = computeGuidedTutorialStep(lvl1, { main: [] }, { lang: 'pt' });
  assert.equal(s1.step, 1);
  assert.equal(s1.totalSteps, 3);
  assert.equal(s1.target, 'palette');
  assert.equal(s1.highlightBlockType, 'move_right');

  // Step 2: 1 block placed -> guide next block
  const s2 = computeGuidedTutorialStep(
    lvl1,
    { main: [{ id: 'a', type: 'move_right' }] },
    { lang: 'pt' }
  );
  assert.equal(s2.step, 2);
  assert.equal(s2.target, 'palette');
  assert.ok(s2.highlightBlockType);

  // Step 3: full winning program -> highlight green Run button!
  const s3 = computeGuidedTutorialStep(lvl1, lvl1.referenceSolution, { lang: 'en' });
  assert.equal(s3.step, 3);
  assert.equal(s3.target, 'run');
  assert.equal(s3.highlightBlockType, null);
  assert.match(s3.message, /Run/);

  // Dismissed or already completed -> returns null
  assert.equal(computeGuidedTutorialStep(lvl1, { main: [] }, { dismissed: true }), null);
  assert.equal(computeGuidedTutorialStep(lvl1, { main: [] }, { alreadyCompleted: true }), null);
});

test('guided tutorial shows friendly concept tips on milestone levels w2-1, w3-1, w4-1, w7-1, and w8-1', () => {
  for (const id of ['w2-1', 'w3-1', 'w4-1', 'w7-1', 'w8-1']) {
    const lvl = getLevelById(id);
    const tipPt = computeGuidedTutorialStep(lvl, { main: [] }, { lang: 'pt' });
    const tipEn = computeGuidedTutorialStep(lvl, { main: [] }, { lang: 'en' });
    assert.ok(tipPt && tipPt.mode === 'concept', `Expected concept tip for ${id}`);
    assert.ok(tipEn && tipEn.highlightBlockType);
  }
});
