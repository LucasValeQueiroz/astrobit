import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlock,
  appendBlockToTarget,
  insertBlockRelative,
  removeBlockById,
  moveBlockInList,
  updateRepeatTimes,
  findContainerExists,
} from '../src/ui/workspace.js';

test('workspace AST helpers append into nested repeat blocks, insert relatively, reorder, and remove', () => {
  let blocks = [];
  const rep = createBlock('repeat');
  const right = createBlock('move_right');
  const col = createBlock('collect');
  const down = createBlock('down');

  blocks = appendBlockToTarget(blocks, null, rep);
  blocks = appendBlockToTarget(blocks, rep.id, right);
  blocks = appendBlockToTarget(blocks, rep.id, col);
  blocks = insertBlockRelative(blocks, col.id, down, 'before');

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].body.length, 3);
  assert.equal(blocks[0].body[1].id, down.id);
  assert.equal(findContainerExists(blocks, rep.id), true);

  // Reorder inside repeat body
  blocks = moveBlockInList(blocks, col.id, -1);
  assert.equal(blocks[0].body[1].id, col.id);

  // Increment and clamp repeat count
  blocks = updateRepeatTimes(blocks, rep.id, 10);
  assert.equal(blocks[0].times, 9);
  blocks = updateRepeatTimes(blocks, rep.id, -20);
  assert.equal(blocks[0].times, 2);

  // Remove child block
  blocks = removeBlockById(blocks, right.id);
  assert.equal(blocks[0].body.length, 2);
});
