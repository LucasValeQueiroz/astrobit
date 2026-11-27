/**
 * AstroBit Cosmic Twins Engine — deterministic two-robot parallel interpreter.
 * 100% pure and DOM-free. AstroBit and AstroByte each run their OWN program at the same time,
 * in lockstep "ticks" (1 action per robot per tick, AstroBit resolved first), sharing one world.
 *
 * Teaches real concurrency to kids: synchronization (`wait` for a button signal), timing
 * (`wait` 1 tick), collisions (two robots can never share a tile) and deadlock detection
 * (both robots waiting forever) with a friendly failure reason.
 */

import {
  coordKey,
  DIRECTIONS,
  turnLeft,
  turnRight,
  stepCoords,
  createWorldState,
  getTile,
  classifyTileStep,
  evaluateSensor,
} from './grid.js';
import { normalizeProgram, countProgramBlocks, computeStars } from './interpreter.js';

export const TWIN_IDS = Object.freeze(['astro', 'byte']);
export const DEFAULT_MAX_TICKS = 160;
export const DEFAULT_MAX_CALL_DEPTH = 16;

const ABSOLUTE_MOVE_DIRS = {
  up: 'N',
  down: 'S',
  move_left: 'W',
  move_right: 'E',
};

const ACTED = 'acted';
const WAITING = 'waiting';

export function otherTwin(id) {
  return id === 'astro' ? 'byte' : 'astro';
}

/**
 * Creates a fresh shared world for a twin level: a normal world state (robot = AstroBit)
 * plus `robots` (both poses) and the list of `goals` that BOTH robots must occupy to win.
 */
export function createTwinWorld(level) {
  const world = createWorldState(level);
  const ts = level?.twinStart;
  if (!ts || !DIRECTIONS.includes(ts.dir) || !Number.isInteger(ts.x) || !Number.isInteger(ts.y)) {
    throw new Error('Twin level must define a valid `twinStart` { x, y, dir }.');
  }
  const goals = [];
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      if (world.grid[y][x].type === 'goal') goals.push({ x, y });
    }
  }
  world.goals = goals;
  world.robots = {
    astro: { x: world.robot.x, y: world.robot.y, dir: world.robot.dir },
    byte: { x: ts.x, y: ts.y, dir: ts.dir },
  };
  return world;
}

/** True when every crystal is collected and every goal tile is occupied by a twin. */
export function isTwinWin(world) {
  if (world.crystals.size > 0) return false;
  if (world.goals.length > 0) {
    return world.goals.every((g) =>
      TWIN_IDS.some((id) => world.robots[id].x === g.x && world.robots[id].y === g.y)
    );
  }
  return world.totalCrystals > 0;
}

/**
 * Executes both programs in parallel and returns a full event trace.
 * @param {object} level  Twin level (rows + twinStart).
 * @param {{ astro?: object|Array, byte?: object|Array }} programs
 * @param {{ maxTicks?: number, maxCallDepth?: number }} [options]
 */
export function executeTwinProgram(level, programs = {}, options = {}) {
  const maxTicks = Number(options.maxTicks ?? DEFAULT_MAX_TICKS);
  const maxCallDepth = Number(options.maxCallDepth ?? DEFAULT_MAX_CALL_DEPTH);
  const norm = {
    astro: normalizeProgram(programs.astro),
    byte: normalizeProgram(programs.byte),
  };
  const world = createTwinWorld(level);
  const blockCount = countProgramBlocks(norm.astro) + countProgramBlocks(norm.byte);
  const autoCollect = Boolean(level?.autoCollect);

  const events = [];
  let tick = 0;
  let status = 'incomplete';
  let failureReason = null;
  let failedBlockId = null;
  let failedRobot = null;

  const snapshot = (robot, type, blockId, extra = {}) => {
    const me = world.robots[robot];
    events.push({
      tick,
      robot,
      type,
      blockId: blockId ?? null,
      x: me.x,
      y: me.y,
      dir: me.dir,
      astro: { ...world.robots.astro },
      byte: { ...world.robots.byte },
      crystalsRemaining: world.crystals.size,
      channels: { ...world.channels },
      crates: [],
      ...extra,
    });
  };

  const fail = (robot, reason, blockId, kind = 'failed') => {
    status = kind;
    failureReason = reason;
    failedBlockId = blockId ?? null;
    failedRobot = robot;
  };

  const checkWin = (robot, blockId) => {
    if (isTwinWin(world)) {
      status = 'won';
      snapshot(robot, 'win', blockId);
      return true;
    }
    return false;
  };

  const collectAt = (robot, blockId) => {
    const me = world.robots[robot];
    const key = coordKey(me.x, me.y);
    if (world.crystals.has(key)) {
      world.crystals.delete(key);
      snapshot(robot, 'collect', blockId, { crystalX: me.x, crystalY: me.y });
      return true;
    }
    return false;
  };

  /** Sensors from the twin's point of view (the other robot counts as an obstacle ahead). */
  const sense = (robot, sensor) => {
    const me = world.robots[robot];
    const view = { ...world, robot: me };
    const result = evaluateSensor(view, sensor);
    if (sensor === 'path_clear' || sensor === 'path_blocked') {
      const ahead = stepCoords(me.x, me.y, me.dir);
      const other = world.robots[otherTwin(robot)];
      const blockedByTwin = other.x === ahead.x && other.y === ahead.y;
      const clear = evaluateSensor(view, 'path_clear') && !blockedByTwin;
      return sensor === 'path_clear' ? clear : !clear;
    }
    return result;
  };

  function* runBlocks(robot, blocks, depth) {
    for (const block of blocks) {
      if (status !== 'incomplete') return;
      if (!block || typeof block !== 'object') continue;
      const blockId = block.id ?? null;
      const me = world.robots[robot];

      if (block.type === 'forward' || ABSOLUTE_MOVE_DIRS[block.type]) {
        if (ABSOLUTE_MOVE_DIRS[block.type]) me.dir = ABSOLUTE_MOVE_DIRS[block.type];
        const next = stepCoords(me.x, me.y, me.dir);
        let outcome = classifyTileStep(world, next.x, next.y);
        if (outcome === 'crate') outcome = 'hit_wall'; // crates are not part of twin worlds
        const other = world.robots[otherTwin(robot)];
        if (outcome === 'ok' && other.x === next.x && other.y === next.y) {
          outcome = 'robot_collision';
        }
        if (outcome !== 'ok') {
          fail(robot, outcome, blockId);
          snapshot(robot, 'bump', blockId, { reason: outcome, targetX: next.x, targetY: next.y });
          return;
        }
        const fromX = me.x;
        const fromY = me.y;
        me.x = next.x;
        me.y = next.y;
        snapshot(robot, 'move', blockId, { fromX, fromY });
        if (autoCollect) collectAt(robot, blockId);
        if (checkWin(robot, blockId)) return;
        yield ACTED;
      } else if (block.type === 'left' || block.type === 'right') {
        const fromDir = me.dir;
        me.dir = block.type === 'left' ? turnLeft(fromDir) : turnRight(fromDir);
        snapshot(robot, 'turn', blockId, { fromDir, turn: block.type });
        yield ACTED;
      } else if (block.type === 'collect') {
        let acted = collectAt(robot, blockId);
        const tile = getTile(world, me.x, me.y);
        if (tile?.type === 'button' && tile.channel) {
          world.channels[tile.channel] = !world.channels[tile.channel];
          snapshot(robot, 'toggle_channel', blockId, {
            channel: tile.channel,
            active: world.channels[tile.channel],
          });
          acted = true;
        }
        if (!acted) snapshot(robot, 'noop_action', blockId);
        if (checkWin(robot, blockId)) return;
        yield ACTED;
      } else if (block.type === 'wait') {
        const channel = block.channel;
        if (channel) {
          if (!world.channels[channel]) {
            snapshot(robot, 'wait_start', blockId, { channel });
            while (!world.channels[channel]) {
              yield WAITING;
              if (status !== 'incomplete') return;
            }
          }
          snapshot(robot, 'wait_done', blockId, { channel });
        } else {
          snapshot(robot, 'wait', blockId);
        }
        yield ACTED;
      } else if (block.type === 'repeat') {
        const times = Math.max(0, Math.min(99, Math.floor(Number(block.times) || 0)));
        const body = Array.isArray(block.body) ? block.body : [];
        for (let i = 0; i < times; i++) {
          if (status !== 'incomplete') return;
          if (body.length === 0) break;
          yield* runBlocks(robot, body, depth);
        }
      } else if (block.type === 'if') {
        const matched = sense(robot, block.sensor);
        snapshot(robot, 'sensor_check', blockId, { sensor: block.sensor, result: matched });
        yield ACTED;
        const branch = matched ? block.then : block.else;
        if (Array.isArray(branch) && branch.length > 0) {
          yield* runBlocks(robot, branch, depth);
        }
      } else if (block.type === 'call') {
        if (depth >= maxCallDepth) {
          fail(robot, 'max_call_depth', blockId, 'infinite_loop');
          return;
        }
        const fnBody = norm[robot].functions[block.fn];
        if (!Array.isArray(fnBody)) {
          throw new Error(`Unknown function: ${block.fn}`);
        }
        snapshot(robot, 'call_enter', blockId, { fn: block.fn });
        yield ACTED;
        yield* runBlocks(robot, fnBody, depth + 1);
      } else {
        throw new Error(`Unknown block type: ${block.type}`);
      }
    }
  }

  const gens = {
    astro: runBlocks('astro', norm.astro.main, 0),
    byte: runBlocks('byte', norm.byte.main, 0),
  };
  const finished = { astro: false, byte: false };

  while (status === 'incomplete') {
    if (finished.astro && finished.byte) break;
    if (tick >= maxTicks) {
      fail(null, 'max_steps', null, 'infinite_loop');
      break;
    }
    tick += 1;

    let acted = false;
    let waiting = null;
    for (const robot of TWIN_IDS) {
      if (finished[robot] || status !== 'incomplete') continue;
      const step = gens[robot].next();
      if (step.done) {
        finished[robot] = true;
      } else if (step.value === ACTED) {
        acted = true;
      } else if (step.value === WAITING) {
        waiting = waiting || robot;
      }
    }

    // Nobody can ever change the world again while someone still waits: deadlock!
    if (status === 'incomplete' && !acted && waiting) {
      const waitingRobots = TWIN_IDS.filter((r) => !finished[r]);
      fail(waiting, 'deadlock', null, 'deadlock');
      snapshot(waiting, 'deadlock', null, { waitingRobots });
    }
  }

  return {
    status,
    failureReason,
    failedBlockId,
    failedRobot,
    ticks: tick,
    steps: tick,
    blockCount,
    stars: computeStars(level, blockCount, status === 'won'),
    events,
    finalState: {
      astro: { ...world.robots.astro },
      byte: { ...world.robots.byte },
      crystalsRemaining: world.crystals.size,
      channels: { ...world.channels },
    },
  };
}

/**
 * Validates a twin level: structure, twin start, exactly 2 goals, and a verified 3-star
 * `referenceSolution` of shape `{ astro: [...], byte: [...] }`.
 */
export function validateTwinLevel(level) {
  const errors = [];
  if (!level || typeof level !== 'object') {
    return { valid: false, errors: ['Level must be an object.'], referenceRun: null };
  }
  if (!level.id) errors.push('Level must define an `id`.');

  let world = null;
  try {
    world = createTwinWorld(level);
  } catch (err) {
    errors.push(`Invalid twin world: ${err.message}`);
  }

  if (world) {
    const { astro, byte } = world.robots;
    if (astro.x === byte.x && astro.y === byte.y) {
      errors.push('AstroBit and AstroByte must start on different tiles.');
    }
    const bt = getTile(world, byte.x, byte.y);
    if (!bt || bt.type === 'wall' || bt.type === 'void') {
      errors.push('AstroByte must start on a walkable tile.');
    }
    if (world.goals.length !== 2) {
      errors.push(`Twin level needs exactly 2 goal tiles (found ${world.goals.length}).`);
    }
  }

  const sol = level.referenceSolution;
  if (!sol || !Array.isArray(sol.astro) || !Array.isArray(sol.byte)) {
    errors.push('Twin level must define referenceSolution { astro: [...], byte: [...] }.');
    return { valid: false, errors, referenceRun: null };
  }

  let referenceRun = null;
  if (world) {
    referenceRun = executeTwinProgram(level, sol);
    if (referenceRun.status !== 'won') {
      errors.push(`referenceSolution does not win (status: ${referenceRun.status}).`);
    } else if (referenceRun.stars !== 3) {
      errors.push(`referenceSolution must score 3 stars (got ${referenceRun.stars}).`);
    }
  }

  return { valid: errors.length === 0, errors, referenceRun };
}

/**
 * Simulates both twin programs and extracts separate dashed preview paths
 * for AstroBit and AstroByte (flagging collisions/bumps) while editing.
 */
export function extractTwinPreviewPaths(level, programs = {}) {
  const fresh = createTwinWorld(level);
  const sim = executeTwinProgram(level, programs);
  const astro = [{ x: fresh.robots.astro.x, y: fresh.robots.astro.y, blockId: null }];
  const byte = [{ x: fresh.robots.byte.x, y: fresh.robots.byte.y, blockId: null }];

  for (const ev of sim.events) {
    const target = ev.robot === 'byte' ? byte : astro;
    if (ev.type === 'move' || ev.type === 'slide' || ev.type === 'teleport') {
      target.push({ x: ev.x, y: ev.y, blockId: ev.blockId, teleported: ev.type === 'teleport' });
    } else if (ev.type === 'bump' || ev.type === 'deadlock') {
      target.push({ x: ev.x, y: ev.y, blockId: ev.blockId, bumped: true });
    }
  }

  return { astro, byte, status: sim.status };
}
