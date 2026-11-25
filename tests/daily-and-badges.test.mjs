import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDailyLevel,
  computeDailyStreak,
  recordDailyCompletion,
} from '../src/engine/daily-challenge.js';
import { validateLevel } from '../src/engine/validator.js';
import { SPACE_BADGES, evaluateBadges } from '../src/storage/achievements.js';
import { createDefaultProgress } from '../src/storage/progress.js';

test('generateDailyLevel produces valid, deterministic, 3-star solvable levels across 100 consecutive days', () => {
  const start = new Date(Date.UTC(2026, 0, 1));
  for (let i = 0; i < 100; i++) {
    const dt = new Date(start.getTime() + i * 86400_000);
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    const levelA = generateDailyLevel(key);
    const levelB = generateDailyLevel(key);
    assert.deepEqual(levelA, levelB, `Daily level for ${key} must be deterministic`);

    const report = validateLevel(levelA);
    assert.equal(report.valid, true, `Daily level ${key} failed: ${report.errors.join('; ')}`);
    assert.equal(report.referenceRun?.stars, 3, `Daily level ${key} must solve with 3★`);
  }
});

test('computeDailyStreak tracks consecutive days and resets on gaps', () => {
  let progress = createDefaultProgress();
  progress = recordDailyCompletion(progress, '2026-11-18');
  progress = recordDailyCompletion(progress, '2026-11-19');
  progress = recordDailyCompletion(progress, '2026-11-20');
  assert.equal(computeDailyStreak(progress.dailyCompletedDates, '2026-11-20'), 3);
  assert.equal(computeDailyStreak(progress.dailyCompletedDates, '2026-11-21'), 3);
  assert.equal(computeDailyStreak(progress.dailyCompletedDates, '2026-11-22'), 0);
});

test('evaluateBadges unlocks space medals accurately and avoids duplicates', () => {
  assert.equal(SPACE_BADGES.length, 14);
  let progress = createDefaultProgress();
  progress.starsByLevel = { 'w1-1': 3, 'w5-6': 3 };
  progress.dailyCompletedDates = ['2026-11-20'];
  progress.labMasteredTopics = ['culling', 'lod', 'streaming', 'ai_lod', 'fluids', 'raytracing', 'upscaling'];

  const first = evaluateBadges(progress, {
    won: true,
    level: { id: 'w5-6', isBugHunt: true },
    program: { main: [{ type: 'repeat', times: 2, body: [] }, { type: 'if', sensor: 'path_clear', then: [] }], functions: { F1: [{ type: 'move_right' }], F2: [] } },
    events: [{ type: 'teleport' }],
  });

  const ids = new Set(first.newlyUnlocked.map((b) => b.id));
  assert.ok(ids.has('first-flight'));
  assert.ok(ids.has('loop-master'));
  assert.ok(ids.has('portal-jumper'));
  assert.ok(ids.has('sensor-brain'));
  assert.ok(ids.has('chip-architect'));
  assert.ok(ids.has('bug-hunter'));
  assert.ok(ids.has('daily-hero'));
  assert.ok(ids.has('earth-savior'));
  assert.ok(ids.has('aaa-engineer'));

  // Calling again with updated progress should not re-trigger already unlocked badges
  progress.unlockedBadges = first.unlockedBadges;
  const second = evaluateBadges(progress, { won: true });
  assert.equal(second.newlyUnlocked.length, 0);
});
