import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlankWorkshopDraft,
  resizeDraftRows,
  validateWorkshopDraft,
  encodeCustomLevel,
  decodeCustomLevel,
  WORKSHOP_TEMPLATES,
} from '../src/engine/custom-level.js';
import { executeProgram } from '../src/engine/interpreter.js';

test('workshop blank draft and all starter templates pass validation cleanly', () => {
  const blank = createBlankWorkshopDraft(8, 5);
  assert.equal(validateWorkshopDraft(blank).valid, true);

  for (const tpl of WORKSHOP_TEMPLATES) {
    const check = validateWorkshopDraft(tpl);
    assert.equal(check.valid, true, `Template ${tpl.id} failed validation: ${JSON.stringify(check.issues)}`);
  }
});

test('validateWorkshopDraft catches missing robot, multiple robots, unpaired portals, and empty goals', () => {
  const noRobot = { rows: ['####', '#.*#', '####'] };
  assert.equal(validateWorkshopDraft(noRobot).issues[0].code, 'missing_robot');

  const twoRobots = { rows: ['####', '#>>#', '#*G#'] };
  assert.equal(validateWorkshopDraft(twoRobots).issues[0].code, 'multiple_robots');

  const unpairedPortal = { rows: ['#####', '#>1G#', '#####'] };
  const portalRes = validateWorkshopDraft(unpairedPortal);
  assert.equal(portalRes.valid, false);
  assert.equal(portalRes.issues[0].code, 'unpaired_portal');
  assert.equal(portalRes.issues[0].portalId, '1');

  const noObj = { rows: ['####', '#>.#', '####'] };
  assert.equal(validateWorkshopDraft(noObj).issues[0].code, 'missing_objective');
});

test('encodeCustomLevel and decodeCustomLevel preserve Unicode titles, portals, bridges, and playability', () => {
  const draft = {
    title: 'Missão do Davi 🚀',
    world: 3,
    parBlocks: 6,
    extras: ['repeat', 'if', 'call_f1'],
    bridges: { '3,1': 'A' },
    rows: [
      '#######',
      '#>a=1.#',
      '####1G#',
      '#######',
    ],
  };

  const encoded = encodeCustomLevel(draft);
  assert.ok(/^[A-Za-z0-9_-]+$/.test(encoded), 'Encoded string must be URL-safe Base64');

  const decoded = decodeCustomLevel(encoded);
  assert.ok(decoded);
  assert.equal(decoded.isCustom, true);
  assert.equal(decoded.titlePt, 'Missão do Davi 🚀');
  assert.equal(decoded.world, 3);
  assert.equal(decoded.starThresholds.parBlocks, 6);
  assert.ok(decoded.allowedBlocks.includes('call_f1'));

  const run = executeProgram(decoded, [
    { id: 'b1', type: 'move_right' },
    { id: 'b2', type: 'collect' },
    { id: 'b3', type: 'move_right' },
    { id: 'b4', type: 'move_right' },
    { id: 'b5', type: 'move_right' },
  ]);
  assert.equal(run.status, 'won');
  assert.equal(run.stars, 3);
});

test('decodeCustomLevel safely rejects corrupted or invalid strings and resizeDraftRows preserves tiles', () => {
  assert.equal(decodeCustomLevel(''), null);
  assert.equal(decodeCustomLevel('%%%not-valid-base64%%%'), null);
  assert.equal(decodeCustomLevel('e30'), null);

  const resized = resizeDraftRows(['#####', '#>*G#', '#####'], 7, 4);
  assert.equal(resized.length, 4);
  assert.equal(resized[0].length, 7);
  assert.equal(resized[1][1], '>');
  assert.equal(resized[1][2], '*');
});
