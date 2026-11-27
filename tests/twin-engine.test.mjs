import test from 'node:test';
import assert from 'node:assert/strict';

import {
  executeTwinProgram,
  extractTwinPreviewPaths,
  validateTwinLevel,
  createTwinWorld,
  isTwinWin,
  otherTwin,
  TWIN_IDS,
} from '../src/engine/twin-engine.js';
import { WORLD_8_LEVELS } from '../src/levels/world8-gemeos.js';

const byId = (id) => WORLD_8_LEVELS.find((l) => l.id === id);

test('all 6 World 8 Cosmic Twins levels are valid and mathematically proven 3-star solvable', () => {
  assert.equal(WORLD_8_LEVELS.length, 6);
  const seen = new Set();
  for (const level of WORLD_8_LEVELS) {
    assert.equal(seen.has(level.id), false, `duplicate id ${level.id}`);
    seen.add(level.id);
    assert.equal(level.isTwin, true);
    const report = validateTwinLevel(level);
    assert.equal(report.valid, true, `${level.id}: ${report.errors.join('; ')}`);
    assert.equal(report.referenceRun.status, 'won', `${level.id} wins`);
    assert.equal(report.referenceRun.stars, 3, `${level.id} 3 stars`);
  }
});

test('validateTwinLevel catches missing twinStart, wrong goal count, same start tile and bad solutions', () => {
  const base = byId('w8-1');
  assert.equal(validateTwinLevel({ ...base, twinStart: undefined }).valid, false);
  assert.equal(validateTwinLevel({ ...base, twinStart: { x: 1, y: 1, dir: 'E' } }).valid, false);
  assert.equal(
    validateTwinLevel({ ...base, rows: ['######', '#>*G##', '######', '#.*.##', '######'] }).valid,
    false
  );
  assert.equal(
    validateTwinLevel({ ...base, referenceSolution: { astro: [], byte: [] } }).valid,
    false
  );
  assert.equal(validateTwinLevel({ ...base, referenceSolution: [] }).valid, false);
  assert.equal(validateTwinLevel(null).valid, false);
});

test('twins run in lockstep and every event carries who acted plus both poses', () => {
  const level = byId('w8-1');
  const run = executeTwinProgram(level, level.referenceSolution);
  assert.equal(run.status, 'won');
  assert.equal(run.ticks, 3);
  assert.equal(run.blockCount, 6);
  const tick1 = run.events.filter((e) => e.tick === 1);
  assert.deepEqual(tick1.map((e) => e.robot), ['astro', 'byte']);
  assert.deepEqual(tick1[0].astro, { x: 2, y: 1, dir: 'E' });
  assert.deepEqual(tick1[1].byte, { x: 2, y: 3, dir: 'E' });
  assert.deepEqual(run.finalState.astro, { x: 3, y: 1, dir: 'E' });
  assert.deepEqual(run.finalState.byte, { x: 3, y: 3, dir: 'E' });
  assert.equal(run.finalState.crystalsRemaining, 0);
});

test('execution is 100% deterministic', () => {
  for (const level of WORLD_8_LEVELS) {
    const a = executeTwinProgram(level, level.referenceSolution);
    const b = executeTwinProgram(level, level.referenceSolution);
    assert.deepEqual(a, b, level.id);
  }
});

test('without the signal wait AstroByte crashes into the laser (hit_laser)', () => {
  const level = byId('w8-2');
  const sol = level.referenceSolution;
  const run = executeTwinProgram(level, { astro: sol.astro, byte: sol.byte.slice(1) });
  assert.equal(run.status, 'failed');
  assert.equal(run.failureReason, 'hit_laser');
  assert.equal(run.failedRobot, 'byte');
  assert.equal(run.failedBlockId, 'w8-2-b2');
});

test('the signal wait releases exactly when the other twin presses the button', () => {
  const level = byId('w8-2');
  const run = executeTwinProgram(level, level.referenceSolution);
  const start = run.events.find((e) => e.type === 'wait_start');
  const done = run.events.find((e) => e.type === 'wait_done');
  const toggle = run.events.find((e) => e.type === 'toggle_channel');
  assert.equal(start.robot, 'byte');
  assert.equal(start.tick, 1);
  assert.equal(toggle.robot, 'astro');
  assert.equal(done.tick, toggle.tick, 'released in the same tick the button was pressed');
  assert.equal(run.status, 'won');
});

test('two robots can never share a tile: crossing the middle together is a robot_collision', () => {
  const level = byId('w8-4');
  const sol = level.referenceSolution;
  const crash = executeTwinProgram(level, { astro: sol.astro, byte: sol.byte.slice(1) });
  assert.equal(crash.status, 'failed');
  assert.equal(crash.failureReason, 'robot_collision');
  assert.equal(crash.failedRobot, 'byte');
  const ok = executeTwinProgram(level, sol);
  assert.equal(ok.status, 'won');
  assert.equal(ok.blockCount, 5);
});

test('both twins waiting for each other forever is detected as a deadlock (not an infinite loop)', () => {
  const level = byId('w8-3');
  const run = executeTwinProgram(level, {
    astro: [{ id: 'x1', type: 'wait', channel: 'B' }, { id: 'x2', type: 'move_right' }],
    byte: [{ id: 'y1', type: 'wait', channel: 'A' }, { id: 'y2', type: 'move_right' }],
  });
  assert.equal(run.status, 'deadlock');
  assert.equal(run.failureReason, 'deadlock');
  assert.ok(run.ticks <= 2, 'detected immediately, no 160-tick timeout');
  const ev = run.events.at(-1);
  assert.equal(ev.type, 'deadlock');
  assert.deepEqual(ev.waitingRobots, ['astro', 'byte']);
});

test('a twin waiting on a signal nobody will send after the other finished is a deadlock', () => {
  const level = byId('w8-2');
  const run = executeTwinProgram(level, {
    astro: [{ id: 'a', type: 'move_right' }],
    byte: [{ id: 'b', type: 'wait', channel: 'A' }],
  });
  assert.equal(run.status, 'deadlock');
  assert.equal(run.failedRobot, 'byte');
});

test('maxTicks protects against runaway programs', () => {
  const level = byId('w8-1');
  const spin = [{ id: 's', type: 'repeat', times: 99, body: [{ id: 'w', type: 'wait' }] }];
  const run = executeTwinProgram(level, { astro: spin, byte: spin }, { maxTicks: 5 });
  assert.equal(run.status, 'infinite_loop');
  assert.equal(run.ticks, 5);
});

test('incomplete programs finish cleanly with partial progress', () => {
  const level = byId('w8-1');
  const run = executeTwinProgram(level, { astro: [{ id: 'a', type: 'move_right' }], byte: [] });
  assert.equal(run.status, 'incomplete');
  assert.equal(run.stars, 0);
  assert.equal(run.finalState.crystalsRemaining, 2);
});

test('sensors treat the other twin as an obstacle ahead', () => {
  const level = {
    id: 'sensor-twin',
    rows: ['#####', '#>.*#', '#####'],
    twinStart: { x: 2, y: 1, dir: 'W' },
  };
  const run = executeTwinProgram(level, {
    astro: [
      {
        id: 'if1',
        type: 'if',
        sensor: 'path_clear',
        then: [{ id: 't', type: 'move_right' }],
        else: [{ id: 'e', type: 'collect' }],
      },
    ],
    byte: [],
  });
  const check = run.events.find((e) => e.type === 'sensor_check');
  assert.equal(check.result, false);
  assert.equal(run.events.some((e) => e.type === 'noop_action'), true);
});

test('createTwinWorld, isTwinWin and helpers behave', () => {
  const world = createTwinWorld(byId('w8-4'));
  assert.deepEqual(world.robots.astro, { x: 0, y: 2, dir: 'E' });
  assert.deepEqual(world.robots.byte, { x: 2, y: 0, dir: 'S' });
  assert.equal(world.goals.length, 2);
  assert.equal(isTwinWin(world), false);
  world.robots.astro = { x: 4, y: 2, dir: 'E' };
  assert.equal(isTwinWin(world), false, 'only one goal occupied');
  world.robots.byte = { x: 2, y: 4, dir: 'S' };
  assert.equal(isTwinWin(world), true);
  assert.equal(otherTwin('astro'), 'byte');
  assert.deepEqual([...TWIN_IDS], ['astro', 'byte']);
  assert.throws(() => createTwinWorld({ rows: ['#>G#'] }), /twinStart/);
});

test('twin programs support their own F1/F2 functions and call depth protection', () => {
  const level = byId('w8-1');
  const run = executeTwinProgram(level, {
    astro: {
      main: [{ id: 'c', type: 'call', fn: 'F1' }, { id: 'm', type: 'move_right' }],
      functions: { F1: [{ id: 'f1a', type: 'move_right' }, { id: 'f1b', type: 'collect' }], F2: [] },
    },
    byte: [{ id: 'b1', type: 'move_right' }, { id: 'b2', type: 'collect' }, { id: 'b3', type: 'move_right' }],
  });
  assert.equal(run.status, 'won');

  const recursive = {
    main: [{ id: 'r', type: 'call', fn: 'F1' }],
    functions: { F1: [{ id: 'rr', type: 'call', fn: 'F1' }], F2: [] },
  };
  const loop = executeTwinProgram(level, { astro: recursive, byte: [] });
  assert.equal(loop.status, 'infinite_loop');
  assert.equal(loop.failureReason, 'max_call_depth');
});

test('extractTwinPreviewPaths produces simultaneous AstroBit and AstroByte trajectories and flags bumps', () => {
  const level = byId('w8-1');
  const winPreview = extractTwinPreviewPaths(level, level.referenceSolution);
  assert.equal(winPreview.status, 'won');
  assert.ok(winPreview.astro.length >= 3, 'AstroBit path starts at origin and steps forward');
  assert.ok(winPreview.byte.length >= 3, 'AstroByte path starts at twinStart and steps forward');

  const cross = byId('w8-3');
  const collision = extractTwinPreviewPaths(cross, {
    astro: [{ id: 'a1', type: 'move_right' }, { id: 'a2', type: 'move_right' }],
    byte: [{ id: 'b1', type: 'down' }, { id: 'b2', type: 'down' }],
  });
  assert.equal(collision.status, 'failed');
  assert.ok(
    collision.astro.some((p) => p.bumped) || collision.byte.some((p) => p.bumped),
    'collision waypoint is flagged as bumped'
  );
});
