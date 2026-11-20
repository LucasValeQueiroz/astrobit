import test from 'node:test';
import assert from 'node:assert/strict';
import { transpileProgram } from '../src/engine/transpiler.js';
import { validateLevel } from '../src/engine/validator.js';

test('transpileProgram generates clean JS and Python with accurate blockToLine maps', () => {
  const program = {
    main: [
      {
        id: 'r1',
        type: 'repeat',
        times: 3,
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

  const js = transpileProgram(program, { lang: 'js' });
  assert.match(js.code, /function f1\(\) \{/);
  assert.match(js.code, /for \(let i = 0; i < 3; i\+\+\) \{/);
  assert.match(js.code, /if \(robot\.hasCrystalHere\(\)\) \{/);
  assert.equal(js.lines[js.blockToLine.f1 - 1].trim(), 'robot.moveForward();');
  assert.equal(js.lines[js.blockToLine.c1 - 1].trim(), 'f1();');

  const py = transpileProgram(program, { lang: 'python' });
  assert.match(py.code, /def f1\(\):/);
  assert.match(py.code, /for _ in range\(3\):/);
  assert.match(py.code, /if robot\.has_crystal_here\(\):/);
  assert.equal(py.lines[py.blockToLine.f3 - 1].trim(), 'robot.collect_or_activate()');
});

test('validateLevel proves valid 3-star levels and catches broken levels or unpaired portals', () => {
  const goodLevel = {
    id: 'w1-1',
    world: 1,
    rows: ['>.*G'],
    starThresholds: { parBlocks: 4, goodBlocks: 6 },
    referenceSolution: [
      { id: '1', type: 'forward' },
      { id: '2', type: 'forward' },
      { id: '3', type: 'collect' },
      { id: '4', type: 'forward' },
    ],
  };

  const ok = validateLevel(goodLevel);
  assert.equal(ok.valid, true);
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.referenceRun.stars, 3);

  const badPortalLevel = {
    ...goodLevel,
    rows: ['>1*G'], // single portal '1' without exit!
  };
  const bad = validateLevel(badPortalLevel);
  assert.equal(bad.valid, false);
  assert.match(bad.errors.join(' '), /Portal "1" must have exactly 2 endpoints/);

  const alreadyWinningBugHunt = {
    ...goodLevel,
    starterProgram: goodLevel.referenceSolution,
  };
  const badBugHunt = validateLevel(alreadyWinningBugHunt);
  assert.equal(badBugHunt.valid, false);
  assert.match(badBugHunt.errors.join(' '), /starterProgram already wins/);
});
