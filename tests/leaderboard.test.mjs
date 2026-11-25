import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLeaderboardEntry, rankLeaderboardEntries } from '../src/engine/leaderboard.js';

test('buildLeaderboardEntry produces privacy-safe public pilot stats without email or PII', () => {
  const entry = buildLeaderboardEntry('uid-123', {
    pilotName: 'Lucas',
    email: 'secret@example.com',
    xp: 350,
    starsByLevel: { 'w1-1': 3, 'w7-6': 3 },
    arcadeBestScore: 1200,
    droneId: 'quantum-fox',
  });

  assert.equal(entry.uid, 'uid-123');
  assert.equal(entry.pilotName, 'Lucas');
  assert.equal(entry.stars, 6);
  assert.equal(entry.xp, 350);
  assert.equal(entry.arcadeBestScore, 1200);
  assert.equal(entry.droneIcon, '🦊');
  assert.equal('email' in entry, false);
});

test('rankLeaderboardEntries sorts by XP -> Stars -> Arcade Best and tags podium medals & isSelf', () => {
  const ranked = rankLeaderboardEntries(
    [
      { uid: 'u2', pilotName: 'Ana', xp: 200, stars: 15, arcadeBestScore: 500 },
      { uid: 'u1', pilotName: 'Lucas', xp: 500, stars: 30, arcadeBestScore: 1500 },
      { uid: 'u3', pilotName: 'Pedro', xp: 200, stars: 24, arcadeBestScore: 400 },
      { uid: 'u4', pilotName: 'Bia', xp: 100, stars: 9, arcadeBestScore: 100 },
    ],
    'u3'
  );

  assert.equal(ranked[0].uid, 'u1');
  assert.equal(ranked[0].medal, '🥇');
  assert.equal(ranked[1].uid, 'u3');
  assert.equal(ranked[1].medal, '🥈');
  assert.equal(ranked[1].isSelf, true);
  assert.equal(ranked[2].uid, 'u2');
  assert.equal(ranked[2].medal, '🥉');
  assert.equal(ranked[3].medal, '#4');
});
