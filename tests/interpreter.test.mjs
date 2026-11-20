import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countProgramBlocks,
  executeProgram,
} from '../src/engine/interpreter.js';

test('executes sequence, collects crystal, reaches goal, and awards 3 stars', () => {
  const level = {
    rows: ['>.*G'],
    starThresholds: { parBlocks: 4, goodBlocks: 6 },
  };
  const program = [
    { id: 'b1', type: 'forward' },
    { id: 'b2', type: 'forward' },
    { id: 'b3', type: 'collect' },
    { id: 'b4', type: 'forward' },
  ];

  const res = executeProgram(level, program);
  assert.equal(res.status, 'won');
  assert.equal(res.stars, 3);
  assert.equal(res.blockCount, 4);
  assert.equal(res.finalState.crystalsRemaining, 0);
  assert.equal(res.events.at(-1).type, 'win');
});

test('identifies exact failedBlockId when bumping into a wall or active laser', () => {
  const level = {
    rows: [
      '###',
      '#>A',
      '###',
    ],
  };

  const res = executeProgram(level, [
    { id: 'b1', type: 'left' },
    { id: 'b2', type: 'forward' },
  ]);
  assert.equal(res.status, 'failed');
  assert.equal(res.failureReason, 'hit_wall');
  assert.equal(res.failedBlockId, 'b2');

  const laserRes = executeProgram(level, [{ id: 'b-laser', type: 'forward' }]);
  assert.equal(laserRes.status, 'failed');
  assert.equal(laserRes.failureReason, 'hit_laser');
  assert.equal(laserRes.failedBlockId, 'b-laser');
});

test('supports loops, switches disabling lasers, retractable bridges, and paired portals', () => {
  const level = {
    rows: [
      '#>a=1',
      '1A*G#',
    ],
    starThresholds: { parBlocks: 6, goodBlocks: 9 },
  };

  // Start (1,0) E -> forward to button 'a' (2,0), collect toggles channel A (bridge '=' ON, laser 'A' OFF),
  // forward across bridge (3,0), forward into portal '1' (4,0) -> teleports to (0,1),
  // forward through disabled laser 'A' (1,1), forward to crystal '*' (2,1), collect, forward to 'G' (3,1)
  const program = {
    main: [
      { id: 'm1', type: 'forward' },
      { id: 'm2', type: 'collect' },
      {
        id: 'm3',
        type: 'repeat',
        times: 4,
        body: [{ id: 'm4', type: 'forward' }],
      },
      { id: 'm5', type: 'collect' },
      { id: 'm6', type: 'forward' },
    ],
  };

  const res = executeProgram(level, program);
  assert.equal(res.status, 'won');
  assert.equal(res.stars, 3);
  assert.ok(res.events.some((e) => e.type === 'toggle_channel' && e.channel === 'A'));
  assert.ok(res.events.some((e) => e.type === 'teleport' && e.portalId === '1' && e.x === 0 && e.y === 1));
});

test('supports conditional sensors (if/else) and reusable functions (F1)', () => {
  const level = {
    rows: ['>.*.*G'],
    starThresholds: { parBlocks: 6, goodBlocks: 9 },
  };

  const program = {
    main: [
      {
        id: 'r1',
        type: 'repeat',
        times: 5,
        body: [{ id: 'c1', type: 'call', fn: 'F1' }],
      },
    ],
    functions: {
      F1: [
        { id: 'f1', type: 'forward' },
        {
          id: 'f2',
          type: 'if',
          sensor: 'crystal_here',
          then: [{ id: 'f3', type: 'collect' }],
        },
      ],
    },
  };

  assert.equal(countProgramBlocks(program), 5);
  const res = executeProgram(level, program);
  assert.equal(res.status, 'won');
  assert.equal(res.stars, 3);
  assert.ok(res.events.some((e) => e.type === 'sensor_check' && e.sensor === 'crystal_here'));
  assert.ok(res.events.some((e) => e.type === 'call_enter' && e.fn === 'F1'));
});

test('prevents infinite recursion and excessive step counts safely', () => {
  const level = { rows: ['>..G'] };
  const recursiveProgram = {
    main: [{ id: 'm1', type: 'call', fn: 'F1' }],
    functions: {
      F1: [{ id: 'f1', type: 'call', fn: 'F1' }],
    },
  };

  const res = executeProgram(level, recursiveProgram, { maxCallDepth: 8 });
  assert.equal(res.status, 'infinite_loop');
  assert.equal(res.failureReason, 'max_call_depth');
  assert.equal(res.failedBlockId, 'f1');

  const spinProgram = [
    { id: 'r1', type: 'repeat', times: 99, body: [{ id: 'l1', type: 'left' }] },
  ];
  const stepLimited = executeProgram(level, spinProgram, { maxSteps: 20 });
  assert.equal(stepLimited.status, 'infinite_loop');
  assert.equal(stepLimited.failureReason, 'max_steps');
});
