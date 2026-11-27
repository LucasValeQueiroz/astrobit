import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTimeline,
  clampFrameIndex,
  getFrame,
  getTrailUntil,
  materializeWorldState,
  getTimelineMarkers,
  findTimelineDivergence,
  describeFrame,
} from '../src/engine/time-machine.js';
import { executeProgram } from '../src/engine/interpreter.js';
import { ALL_LEVELS } from '../src/levels/index.js';

const SAMPLE_LEVEL = {
  id: 'tm-sample',
  rows: ['#####', '#>*G#', '#####'],
  starThresholds: { parBlocks: 3, goodBlocks: 4 },
};

const WIN_PROGRAM = [
  { id: 'a', type: 'move_right' },
  { id: 'b', type: 'collect' },
  { id: 'c', type: 'move_right' },
];

test('buildTimeline creates frame 0 + one frame per trace event and restores crystals when rewinding', () => {
  const run = executeProgram(SAMPLE_LEVEL, WIN_PROGRAM);
  const tl = buildTimeline(SAMPLE_LEVEL, run);

  assert.equal(tl.status, 'won');
  assert.equal(tl.frames.length, run.events.length + 1);
  assert.equal(tl.lastIndex, run.events.length);

  const start = getFrame(tl, 0);
  assert.equal(start.type, 'start');
  assert.deepEqual([start.x, start.y, start.dir], [1, 1, 'E']);
  assert.equal(start.crystals.length, 1, 'crystal is back on the board at frame 0');

  const end = getFrame(tl, tl.lastIndex);
  assert.equal(end.type, 'win');
  assert.equal(end.crystals.length, 0);
  assert.equal(end.blockId, 'c');

  assert.ok(Object.isFrozen(tl.frames) && Object.isFrozen(start), 'timeline frames are immutable');
});

test('clampFrameIndex / getTrailUntil keep scrubbing safe and footprints grow step by step', () => {
  const tl = buildTimeline(SAMPLE_LEVEL, executeProgram(SAMPLE_LEVEL, WIN_PROGRAM));
  assert.equal(clampFrameIndex(tl, -5), 0);
  assert.equal(clampFrameIndex(tl, 999), tl.lastIndex);
  assert.equal(clampFrameIndex(tl, 'abc'), 0);
  assert.equal(clampFrameIndex(null, 3), 0);

  assert.deepEqual(getTrailUntil(tl, 0).map((p) => p.x), [1]);
  assert.deepEqual(getTrailUntil(tl, tl.lastIndex).map((p) => p.x), [1, 2, 3]);
  assert.deepEqual(getTrailUntil(null, 2), []);
});

test('materializeWorldState rebuilds a fresh mutable world identical to the frame snapshot', () => {
  const tl = buildTimeline(SAMPLE_LEVEL, executeProgram(SAMPLE_LEVEL, WIN_PROGRAM));
  const mid = getFrame(tl, 1);
  const world = materializeWorldState(SAMPLE_LEVEL, mid);
  assert.deepEqual(world.robot, { x: 2, y: 1, dir: 'E' });
  assert.equal(world.crystals.size, 1);
  world.crystals.clear();
  assert.equal(getFrame(tl, 1).crystals.length, 1, 'mutating the world never corrupts history');
});

test('getTimelineMarkers places emoji markers on key moments (crystal, bump, win)', () => {
  const tl = buildTimeline(SAMPLE_LEVEL, executeProgram(SAMPLE_LEVEL, WIN_PROGRAM));
  const markers = getTimelineMarkers(tl);
  assert.deepEqual(markers.map((m) => m.icon), ['💎', '🏁']);
  assert.equal(markers.at(-1).pct, 100);

  const bumpRun = executeProgram(SAMPLE_LEVEL, [{ id: 'x', type: 'up' }]);
  const bumpTl = buildTimeline(SAMPLE_LEVEL, bumpRun);
  assert.equal(bumpTl.status, 'failed');
  assert.deepEqual(getTimelineMarkers(bumpTl).map((m) => m.type), ['bump']);
});

test('findTimelineDivergence detects exactly where a new timeline changed history', () => {
  const a = buildTimeline(SAMPLE_LEVEL, executeProgram(SAMPLE_LEVEL, WIN_PROGRAM));
  const same = buildTimeline(SAMPLE_LEVEL, executeProgram(SAMPLE_LEVEL, WIN_PROGRAM));
  assert.equal(findTimelineDivergence(a, same), -1, 'deterministic: same program = same history');

  const forgotCollect = buildTimeline(
    SAMPLE_LEVEL,
    executeProgram(SAMPLE_LEVEL, [WIN_PROGRAM[0], WIN_PROGRAM[2]])
  );
  assert.equal(findTimelineDivergence(a, forgotCollect), 2);

  const shorter = buildTimeline(SAMPLE_LEVEL, executeProgram(SAMPLE_LEVEL, [WIN_PROGRAM[0]]));
  assert.equal(findTimelineDivergence(a, shorter), 2);
});

test('describeFrame produces bilingual kid-friendly captions', () => {
  const tl = buildTimeline(SAMPLE_LEVEL, executeProgram(SAMPLE_LEVEL, WIN_PROGRAM));
  assert.equal(describeFrame(getFrame(tl, 0), tl.lastIndex, 'pt'), '⏳ Passo 0/4 · 🚀 Início');
  assert.equal(describeFrame(getFrame(tl, 2), tl.lastIndex, 'en'), '⏳ Step 2/4 · 💎 Got crystal');
  assert.match(describeFrame(null, 0, 'en'), /Start/);
});

test('every single-robot campaign reference solution rewinds and fast-forwards losslessly (time-travel invariant)', () => {
  for (const level of ALL_LEVELS) {
    if (level.isTwin) continue;
    const run = executeProgram(level, level.referenceSolution);
    const tl = buildTimeline(level, run);
    const end = getFrame(tl, tl.lastIndex);
    assert.equal(end.x, run.finalState.x, `${level.id} final x`);
    assert.equal(end.y, run.finalState.y, `${level.id} final y`);
    assert.equal(end.dir, run.finalState.dir, `${level.id} final dir`);
    assert.equal(end.crystals.length, run.finalState.crystalsRemaining, `${level.id} crystals`);
    assert.deepEqual({ ...end.channels }, run.finalState.channels, `${level.id} channels`);

    const fresh = materializeWorldState(level, getFrame(tl, 0));
    const initial = materializeWorldState(level, null);
    assert.deepEqual([...fresh.crystals].sort(), [...initial.crystals].sort(), `${level.id} rewind to start`);
  }
});
