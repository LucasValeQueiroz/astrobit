import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlock,
  appendBlockToTarget,
  removeBlockById,
  moveBlockInList,
  updateRepeatTimes,
  findContainerExists,
} from '../src/ui/workspace.js';

test('workspace AST helpers append into nested repeat blocks, reorder, update times, and remove', () => {
  let blocks = [];
  const rep = createBlock('repeat');
  const fwd = createBlock('forward');
  const col = createBlock('collect');

  blocks = appendBlockToTarget(blocks, null, rep);
  blocks = appendBlockToTarget(blocks, rep.id, fwd);
  blocks = appendBlockToTarget(blocks, rep.id, col);

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].body.length, 2);
  assert.equal(findContainerExists(blocks, rep.id), true);

  // Move collect above forward inside the repeat body
  blocks = moveBlockInList(blocks, col.id, -1);
  assert.equal(blocks[0].body[0].id, col.id);
  assert.equal(blocks[0].body[1].id, fwd.id);

  // Increment and clamp repeat count
  blocks = updateRepeatTimes(blocks, rep.id, 10);
  assert.equal(blocks[0].times, 9);
  blocks = updateRepeatTimes(blocks, rep.id, -20);
  assert.equal(blocks[0].times, 2);

  // Remove child block
  blocks = removeBlockById(blocks, fwd.id);
  assert.equal(blocks[0].body.length, 1);
});
