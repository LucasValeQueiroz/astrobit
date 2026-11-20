import test from 'node:test';
import assert from 'node:assert/strict';
import {
  turnLeft,
  turnRight,
  stepCoords,
  parseAsciiGrid,
  createWorldState,
  classifyTileStep,
  findPortalExit,
  evaluateSensor,
  isWinState,
  coordKey,
} from '../src/engine/grid.js';

test('direction helpers rotate and step cleanly', () => {
  assert.equal(turnLeft('N'), 'W');
  assert.equal(turnLeft('W'), 'S');
  assert.equal(turnRight('N'), 'E');
  assert.equal(turnRight('W'), 'N');
  assert.deepEqual(stepCoords(2, 3, 'N'), { x: 2, y: 2 });
  assert.deepEqual(stepCoords(2, 3, 'E'), { x: 3, y: 3 });
});

test('parseAsciiGrid & createWorldState parse crystals, switches, lasers, bridges, and portals', () => {
  const level = {
    rows: [
      '#####',
      '#>a=G',
      '#1A*1',
      '#####',
    ],
  };

  const state = createWorldState(level);
  assert.equal(state.width, 5);
  assert.equal(state.height, 4);
  assert.deepEqual(state.robot, { x: 1, y: 1, dir: 'E' });
  assert.equal(state.totalCrystals, 1);
  assert.equal(state.crystals.has(coordKey(3, 2)), true);
  assert.deepEqual(state.goal, { x: 4, y: 1 });

  // Before toggling channel A: bridge at (3,1) is inactive (void), laser at (2,2) is active
  assert.equal(classifyTileStep(state, 3, 1), 'fell_off');
  assert.equal(classifyTileStep(state, 2, 2), 'hit_laser');
  assert.equal(classifyTileStep(state, 0, 0), 'hit_wall');

  // Toggle channel A: bridge activates, laser deactivates!
  state.channels.A = true;
  assert.equal(classifyTileStep(state, 3, 1), 'ok');
  assert.equal(classifyTileStep(state, 2, 2), 'ok');

  // Portal pair 1 connects (1,2) <-> (4,2)
  assert.deepEqual(findPortalExit(state, 1, 2), { x: 4, y: 2, portalId: '1' });
  assert.deepEqual(findPortalExit(state, 4, 2), { x: 1, y: 2, portalId: '1' });
  assert.equal(findPortalExit(state, 1, 1), null);
});

test('evaluateSensor reports path, crystal, laser, and button conditions accurately', () => {
  const state = createWorldState({
    rows: [
      '#*A',
      '#>a',
    ],
  });

  // Robot at (1,1) facing East -> (2,1) is button 'a' (walkable)
  assert.equal(evaluateSensor(state, 'path_clear'), true);
  assert.equal(evaluateSensor(state, 'path_blocked'), false);
  assert.equal(evaluateSensor(state, 'button_here'), false);

  // Turn North -> (1,0) is crystal '*'
  state.robot.dir = 'N';
  assert.equal(evaluateSensor(state, 'crystal_ahead'), true);
  assert.equal(evaluateSensor(state, 'laser_ahead'), false);

  // Move to (2,1) facing North -> button_here true, laser_ahead true at (2,0)
  state.robot = { x: 2, y: 1, dir: 'N' };
  assert.equal(evaluateSensor(state, 'button_here'), true);
  assert.equal(evaluateSensor(state, 'laser_ahead'), true);
  assert.equal(evaluateSensor(state, 'path_blocked'), true);
});

test('isWinState requires all crystals collected and standing on Goal if present', () => {
  const state = createWorldState({ rows: ['>*G'] });
  assert.equal(isWinState(state), false);

  state.crystals.clear();
  assert.equal(isWinState(state), false); // Not yet on G

  state.robot.x = 2;
  assert.equal(isWinState(state), true);
});
