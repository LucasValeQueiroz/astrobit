import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlock,
  appendBlockToTarget,
  insertBlockRelative,
  removeBlockById,
  moveBlockInList,
  updateRepeatTimes,
  updateIfSensor,
  findContainerExists,
} from '../src/ui/workspace.js';

test('workspace AST helpers append into nested repeat and if-sensor blocks, update sensors, reorder, and remove', () => {
  let blocks = [];
  const rep = createBlock('repeat');
  const cond = createBlock('if');
  const right = createBlock('move_right');
  const col = createBlock('collect');
  const down = createBlock('down');

  blocks = appendBlockToTarget(blocks, null, rep);
  blocks = appendBlockToTarget(blocks, rep.id, right);
  blocks = appendBlockToTarget(blocks, rep.id, cond);
  blocks = appendBlockToTarget(blocks, cond.id, col);
  blocks = insertBlockRelative(blocks, cond.id, down, 'before');

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].body.length, 3);
  assert.equal(blocks[0].body[1].id, down.id);
  assert.equal(blocks[0].body[2].then.length, 1);
  assert.equal(findContainerExists(blocks, cond.id), true);

  blocks = updateIfSensor(blocks, cond.id, 'laser_ahead');
  assert.equal(blocks[0].body[2].sensor, 'laser_ahead');

  // Reorder inside repeat body
  blocks = moveBlockInList(blocks, down.id, -1);
  assert.equal(blocks[0].body[0].id, down.id);

  // Increment and clamp repeat count
  blocks = updateRepeatTimes(blocks, rep.id, 10);
  assert.equal(blocks[0].times, 9);
  blocks = updateRepeatTimes(blocks, rep.id, -20);
  assert.equal(blocks[0].times, 2);

  // Remove child block inside If
  blocks = removeBlockById(blocks, col.id);
  assert.equal(blocks[0].body[2].then.length, 0);

  // Function call factory
  const call1 = createBlock('call_f1');
  const call2 = createBlock('call_f2');
  assert.deepEqual({ type: call1.type, fn: call1.fn }, { type: 'call', fn: 'F1' });
  assert.deepEqual({ type: call2.type, fn: call2.fn }, { type: 'call', fn: 'F2' });
});
