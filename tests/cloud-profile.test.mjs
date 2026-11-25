import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_HISTORY_ENTRIES,
  appendHistoryEntry,
  mergeProgressSnapshots,
  exportProgressBackup,
  parseProgressBackup,
} from '../src/storage/cloud-profile.js';

test('appendHistoryEntry prepends newest missions and caps history length cleanly', () => {
  let prog = { matchHistory: [] };
  for (let i = 1; i <= MAX_HISTORY_ENTRIES + 5; i++) {
    prog = appendHistoryEntry(prog, {
      levelId: `w1-${(i % 6) + 1}`,
      title: `Mission ${i}`,
      stars: 3,
      blocks: 4,
      xpGained: 120,
      timestamp: `2026-11-25T00:${String(i).padStart(2, '0')}:00.000Z`,
    });
  }
  assert.equal(prog.matchHistory.length, MAX_HISTORY_ENTRIES);
  assert.equal(prog.matchHistory[0].title, `Mission ${MAX_HISTORY_ENTRIES + 5}`);
});

test('mergeProgressSnapshots performs conflict-free union preserving best stars, XP, ghosts, and history', () => {
  const local = {
    pilotName: 'Lucas',
    starsByLevel: { 'w1-1': 3, 'w1-2': 2 },
    xp: 240,
    arcadeBestScore: 800,
    unlockedBadges: ['first-flight'],
    ghostsByLevel: { 'w1-1': { blocks: 4, steps: 5, frames: [] } },
    matchHistory: [
      { levelId: 'w1-1', blocks: 4, stars: 3, timestamp: '2026-11-24T10:00:00.000Z' },
    ],
  };
  const remote = {
    pilotName: 'Lucas Cloud',
    starsByLevel: { 'w1-1': 2, 'w1-2': 3, 'w7-6': 3 },
    xp: 450,
    arcadeBestScore: 1500,
    unlockedBadges: ['first-flight', 'frost-master'],
    ghostsByLevel: { 'w1-1': { blocks: 3, steps: 4, frames: [] } },
    matchHistory: [
      { levelId: 'w1-1', blocks: 4, stars: 3, timestamp: '2026-11-24T10:00:00.000Z' },
      { levelId: 'w7-6', blocks: 10, stars: 3, timestamp: '2026-11-25T10:00:00.000Z' },
    ],
  };

  const merged = mergeProgressSnapshots(local, remote);
  assert.equal(merged.starsByLevel['w1-1'], 3);
  assert.equal(merged.starsByLevel['w1-2'], 3);
  assert.equal(merged.starsByLevel['w7-6'], 3);
  assert.equal(merged.xp, 450);
  assert.equal(merged.arcadeBestScore, 1500);
  assert.equal(merged.unlockedBadges.length, 2);
  assert.equal(merged.ghostsByLevel['w1-1'].blocks, 3);
  assert.equal(merged.matchHistory.length, 2);
  assert.equal(merged.matchHistory[0].levelId, 'w7-6');
});

test('exportProgressBackup and parseProgressBackup round-trip safely and reject invalid JSON', () => {
  const sample = { starsByLevel: { 'w1-1': 3 }, xp: 160, pilotName: 'Lucas' };
  const json = exportProgressBackup(sample);
  const parsed = parseProgressBackup(json);
  assert.deepEqual(parsed, sample);

  assert.equal(parseProgressBackup('not json'), null);
  assert.equal(parseProgressBackup('{}'), null);
});
