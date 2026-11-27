import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SPACE_QUESTS,
  computeXpLevel,
  computeWinXp,
  applyGameplayRewards,
} from '../src/engine/xp-and-quests.js';

test('computeXpLevel scales smoothly from Lv.1 to Lv.25 with accurate percentages', () => {
  const l1 = computeXpLevel(0);
  assert.equal(l1.level, 1);
  assert.equal(l1.nextLevelXp, 120);
  assert.equal(l1.pct, 0);

  const l2 = computeXpLevel(120);
  assert.equal(l2.level, 2);
  assert.equal(l2.currentLevelXp, 0);
  assert.equal(l2.nextLevelXp, 165);

  const max = computeXpLevel(999999);
  assert.equal(max.level, 25);
  assert.equal(max.isMax, true);
});

test('applyGameplayRewards tracks quests, awards quest bonus XP, and detects Level Up', () => {
  assert.equal(SPACE_QUESTS.length, 8);
  const winXp = computeWinXp({ stars: 3, firstTry: true });
  assert.equal(winXp, 160);

  let prog = { xp: 0, questProgress: {}, completedQuests: [] };

  // Toggling X-Ray completes quest-xray-inspect (+80 XP)
  const r1 = applyGameplayRewards(prog, { type: 'xray_toggle' });
  assert.equal(r1.completedQuests.length, 1);
  assert.equal(r1.completedQuests[0].id, 'quest-xray-inspect');
  assert.equal(r1.xpGained, 80);
  assert.equal(r1.leveledUp, false);
  prog = r1.progress;

  // Winning a 3-star loop level with ice slide triggers Level Up + completes loop & ice quests!
  const r2 = applyGameplayRewards(prog, {
    type: 'level_win',
    baseXp: winXp,
    stars: 3,
    program: { main: [{ type: 'repeat', times: 2, body: [] }], functions: { F1: [], F2: [] } },
    events: [{ type: 'collect' }, { type: 'slide' }],
  });
  assert.equal(r2.leveledUp, true);
  assert.ok(r2.newLevel >= 3);
  assert.ok(r2.completedQuests.some((q) => q.id === 'quest-loop-win'));
  assert.ok(r2.completedQuests.some((q) => q.id === 'quest-ice-physics'));
});

test('World 8 twin win and Time Machine rewind unlock their dedicated Space Quests', () => {
  let prog = { xp: 0, questProgress: {}, completedQuests: [] };

  const rew = applyGameplayRewards(prog, { type: 'time_travel' });
  assert.ok(rew.completedQuests.some((q) => q.id === 'quest-time-travel'));
  assert.equal(rew.xpGained, 90);
  prog = rew.progress;

  const twin = applyGameplayRewards(prog, {
    type: 'level_win',
    baseXp: 120,
    stars: 3,
    isTwin: true,
    events: [],
  });
  assert.ok(twin.completedQuests.some((q) => q.id === 'quest-twin-sync'));
  assert.equal(twin.xpGained, 240);
});
