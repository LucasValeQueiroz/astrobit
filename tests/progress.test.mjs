import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultProgress,
  loadProgress,
  saveProgress,
  recordLevelCompletion,
  getTotalStars,
} from '../src/storage/progress.js';
import { t } from '../src/ui/i18n.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test('progress store preserves highest star score per level and computes total stars', () => {
  const storage = createMemoryStorage();
  let prog = createDefaultProgress();

  prog = recordLevelCompletion(prog, 'w1-1', 3);
  prog = recordLevelCompletion(prog, 'w1-1', 1); // Should never downgrade 3 -> 1!
  prog = recordLevelCompletion(prog, 'w1-2', 2);
  prog.seenIntro = true;
  prog.seenWorlds[1] = true;
  saveProgress(prog, storage);

  const loaded = loadProgress(storage);
  assert.equal(loaded.starsByLevel['w1-1'], 3);
  assert.equal(loaded.starsByLevel['w1-2'], 2);
  assert.equal(loaded.seenIntro, true);
  assert.equal(loaded.seenWorlds[1], true);
  assert.equal(getTotalStars(loaded), 5);
});

test('i18n translates nested keys and interpolates parameters in PT and EN', () => {
  assert.equal(t('pt', 'blocksCounter', { used: 4, par: 3 }), '4 peças · meta 3★: ≤ 3');
  assert.equal(t('en', 'blocks.repeat'), 'Repeat');
  assert.equal(t('pt', 'blocks.move_right'), 'Direita');
});
