import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractGhostReplay,
  getGhostFrameAt,
  recordBestGhost,
  encodeGhostReplay,
  decodeGhostReplay,
} from '../src/engine/ghost-replay.js';
import { executeProgram } from '../src/engine/interpreter.js';

const SAMPLE_LEVEL = {
  id: 'w1-1',
  rows: [
    '#####',
    '#>*G#',
    '#####',
  ],
  starThresholds: { parBlocks: 3, goodBlocks: 4 },
};

test('extractGhostReplay builds compact frames from a winning run and clamps frame lookups', () => {
  const prog = [
    { id: '1', type: 'move_right' },
    { id: '2', type: 'collect' },
    { id: '3', type: 'move_right' },
  ];
  const run = executeProgram(SAMPLE_LEVEL, prog);
  assert.equal(run.status, 'won');

  const ghost = extractGhostReplay(SAMPLE_LEVEL, run);
  assert.ok(ghost);
  assert.equal(ghost.blocks, 3);
  assert.equal(ghost.frames.length, 3); // start + 2 moves
  assert.deepEqual(getGhostFrameAt(ghost, 0), { x: 1, y: 1, dir: 'E' });
  assert.deepEqual(getGhostFrameAt(ghost, 99), { x: 3, y: 1, dir: 'E' });
});

test('encodeGhostReplay and decodeGhostReplay round-trip cleanly and reject corrupted tokens', () => {
  const ghost = {
    blocks: 4,
    steps: 6,
    frames: [
      { x: 1, y: 1, dir: 'E' },
      { x: 2, y: 1, dir: 'E' },
      { x: 2, y: 2, dir: 'S' },
    ],
  };
  const token = encodeGhostReplay(ghost);
  assert.ok(token.length > 0);
  const decoded = decodeGhostReplay(token);
  assert.deepEqual(decoded, ghost);

  assert.equal(decodeGhostReplay(''), null);
  assert.equal(decodeGhostReplay('!!!not-valid-base64!!!'), null);
});

test('recordBestGhost only overwrites when fewer blocks (or fewer steps on tie) are achieved', () => {
  const g1 = { blocks: 6, steps: 8, frames: [{ x: 1, y: 1, dir: 'E' }] };
  const g2 = { blocks: 8, steps: 6, frames: [{ x: 1, y: 1, dir: 'E' }] };
  const g3 = { blocks: 4, steps: 8, frames: [{ x: 1, y: 1, dir: 'E' }] };

  let state = { ghostsByLevel: {} };
  let r1 = recordBestGhost(state, 'w1-1', g1);
  assert.equal(r1.beatRecord, false);
  assert.equal(r1.progress.ghostsByLevel['w1-1'].blocks, 6);

  let r2 = recordBestGhost(r1.progress, 'w1-1', g2);
  assert.equal(r2.beatRecord, false);
  assert.equal(r2.progress.ghostsByLevel['w1-1'].blocks, 6);

  let r3 = recordBestGhost(r2.progress, 'w1-1', g3);
  assert.equal(r3.beatRecord, true);
  assert.equal(r3.progress.ghostsByLevel['w1-1'].blocks, 4);
});
