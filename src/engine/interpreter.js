/**
 * AstroBit Step-by-Step Block AST Interpreter.
 * 100% deterministic and DOM-free: executes visual block programs into a full
 * animation & debugging event trace with infinite-loop protection and 1-3 star scoring.
 */

import {
  coordKey,
  turnLeft,
  turnRight,
  stepCoords,
  createWorldState,
  getTile,
  classifyTileStep,
  canPushCrateTo,
  isIceTile,
  findPortalExit,
  evaluateSensor,
  isWinState,
} from './grid.js';

export const DEFAULT_MAX_STEPS = 200;
export const DEFAULT_MAX_CALL_DEPTH = 16;

const ABSOLUTE_MOVE_DIRS = {
  up: 'N',
  down: 'S',
  move_left: 'W',
  move_right: 'E',
};

export function countBlockList(blocks = []) {
  if (!Array.isArray(blocks)) return 0;
  let total = 0;
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    total += 1;
    if (block.type === 'repeat') {
      total += countBlockList(block.body);
    } else if (block.type === 'if') {
      total += countBlockList(block.then);
      total += countBlockList(block.else);
    }
  }
  return total;
}

export function normalizeProgram(program) {
  if (Array.isArray(program)) {
    return { main: program, functions: { F1: [], F2: [] } };
  }
  return {
    main: Array.isArray(program?.main) ? program.main : [],
    functions: {
      F1: Array.isArray(program?.functions?.F1) ? program.functions.F1 : [],
      F2: Array.isArray(program?.functions?.F2) ? program.functions.F2 : [],
    },
  };
}

export function countProgramBlocks(program) {
  const norm = normalizeProgram(program);
  return (
    countBlockList(norm.main) +
    countBlockList(norm.functions.F1) +
    countBlockList(norm.functions.F2)
  );
}

/**
 * Computes 0-3 star rating based on level thresholds.
 * 1 star: won | 2 stars: <= goodBlocks | 3 stars: <= parBlocks.
 */
export function computeStars(level, blockCount, won) {
  if (!won) return 0;
  const par = Number(level?.starThresholds?.parBlocks ?? Infinity);
  const good = Number(level?.starThresholds?.goodBlocks ?? Infinity);
  if (blockCount <= par) return 3;
  if (blockCount <= good) return 2;
  return 1;
}

/**
 * Executes a block AST program against a level definition and produces a complete trace.
 * @param {object} level
 * @param {object|Array} program
 * @param {{ maxSteps?: number, maxCallDepth?: number }} [options]
 */
export function executeProgram(level, program, options = {}) {
  const maxSteps = Number(options.maxSteps ?? DEFAULT_MAX_STEPS);
  const maxCallDepth = Number(options.maxCallDepth ?? DEFAULT_MAX_CALL_DEPTH);
  const norm = normalizeProgram(program);
  const state = createWorldState(level);
  const blockCount = countProgramBlocks(norm);
  const autoCollect = Boolean(level?.autoCollect);

  const events = [];
  let steps = 0;
  let status = 'incomplete';
  let failureReason = null;
  let failedBlockId = null;

  const snapshot = (type, blockId, extra = {}) => {
    events.push({
      step: steps,
      type,
      blockId: blockId ?? null,
      x: state.robot.x,
      y: state.robot.y,
      dir: state.robot.dir,
      crystalsRemaining: state.crystals.size,
      channels: { ...state.channels },
      crates: [...state.crates],
      ...extra,
    });
  };

  const checkWin = (blockId) => {
    if (isWinState(state)) {
      status = 'won';
      snapshot('win', blockId);
      return true;
    }
    return false;
  };

  const tryAutoCollect = (blockId) => {
    if (!autoCollect) return;
    const key = coordKey(state.robot.x, state.robot.y);
    if (state.crystals.has(key)) {
      state.crystals.delete(key);
      snapshot('collect', blockId, { crystalX: state.robot.x, crystalY: state.robot.y });
    }
  };

  const consumeStep = (blockId) => {
    if (steps >= maxSteps) {
      status = 'infinite_loop';
      failureReason = 'max_steps';
      failedBlockId = blockId ?? null;
      return false;
    }
    steps += 1;
    return true;
  };

  const runBlocks = (blocks, callDepth) => {
    for (const block of blocks) {
      if (status !== 'incomplete') return;
      if (!block || typeof block !== 'object') continue;
      const blockId = block.id ?? null;

      if (block.type === 'forward' || ABSOLUTE_MOVE_DIRS[block.type]) {
        if (!consumeStep(blockId)) return;
        if (ABSOLUTE_MOVE_DIRS[block.type]) {
          state.robot.dir = ABSOLUTE_MOVE_DIRS[block.type];
        }
        const fromX = state.robot.x;
        const fromY = state.robot.y;
        const next = stepCoords(fromX, fromY, state.robot.dir);
        let outcome = classifyTileStep(state, next.x, next.y);

        // Pushable energy crate physics (supports ice curling + automatic button activation!)
        if (outcome === 'crate') {
          const pushTarget = stepCoords(next.x, next.y, state.robot.dir);
          if (!canPushCrateTo(state, pushTarget.x, pushTarget.y)) {
            status = 'failed';
            failureReason = 'crate_blocked';
            failedBlockId = blockId;
            snapshot('bump', blockId, { reason: 'crate_blocked', targetX: next.x, targetY: next.y });
            return;
          }

          state.crates.delete(coordKey(next.x, next.y));
          const prevCrateTile = getTile(state, next.x, next.y);
          if (prevCrateTile?.type === 'button' && prevCrateTile.channel) {
            state.channels[prevCrateTile.channel] = !state.channels[prevCrateTile.channel];
            snapshot('toggle_channel', blockId, {
              channel: prevCrateTile.channel,
              active: state.channels[prevCrateTile.channel],
            });
          }

          let crateX = pushTarget.x;
          let crateY = pushTarget.y;
          let crateSlides = 0;
          while (isIceTile(state, crateX, crateY) && crateSlides < 24) {
            const slideTo = stepCoords(crateX, crateY, state.robot.dir);
            if (!canPushCrateTo(state, slideTo.x, slideTo.y)) break;
            crateX = slideTo.x;
            crateY = slideTo.y;
            crateSlides += 1;
          }

          state.crates.add(coordKey(crateX, crateY));
          snapshot('push_crate', blockId, {
            fromX: next.x,
            fromY: next.y,
            toX: crateX,
            toY: crateY,
            slid: crateSlides > 0,
          });

          const landedTile = getTile(state, crateX, crateY);
          if (landedTile?.type === 'button' && landedTile.channel) {
            state.channels[landedTile.channel] = !state.channels[landedTile.channel];
            snapshot('toggle_channel', blockId, {
              channel: landedTile.channel,
              active: state.channels[landedTile.channel],
            });
          }
          outcome = 'ok';
        }

        if (outcome !== 'ok') {
          status = 'failed';
          failureReason = outcome;
          failedBlockId = blockId;
          snapshot('bump', blockId, { reason: outcome, targetX: next.x, targetY: next.y });
          return;
        }

        state.robot.x = next.x;
        state.robot.y = next.y;
        snapshot('move', blockId, { fromX, fromY });
        tryAutoCollect(blockId);

        const tryPortalAtRobot = () => {
          const portalExit = findPortalExit(state, state.robot.x, state.robot.y);
          if (!portalExit) return false;
          const pFromX = state.robot.x;
          const pFromY = state.robot.y;
          state.robot.x = portalExit.x;
          state.robot.y = portalExit.y;
          snapshot('teleport', blockId, {
            fromX: pFromX,
            fromY: pFromY,
            portalId: portalExit.portalId,
          });
          tryAutoCollect(blockId);
          return true;
        };

        let teleported = tryPortalAtRobot();
        if (checkWin(blockId)) return;

        // Slippery ice sliding physics: robot glides until solid ground or safe stop before obstacle
        if (!teleported) {
          let slideCount = 0;
          while (isIceTile(state, state.robot.x, state.robot.y) && slideCount < 24) {
            const slideNext = stepCoords(state.robot.x, state.robot.y, state.robot.dir);
            if (classifyTileStep(state, slideNext.x, slideNext.y) !== 'ok') {
              break;
            }
            const sFromX = state.robot.x;
            const sFromY = state.robot.y;
            state.robot.x = slideNext.x;
            state.robot.y = slideNext.y;
            slideCount += 1;
            snapshot('slide', blockId, { fromX: sFromX, fromY: sFromY });
            tryAutoCollect(blockId);
            const warped = tryPortalAtRobot();
            if (checkWin(blockId)) return;
            if (warped) break;
          }
        }
      } else if (block.type === 'left' || block.type === 'right') {
        if (!consumeStep(blockId)) return;
        const fromDir = state.robot.dir;
        state.robot.dir = block.type === 'left' ? turnLeft(fromDir) : turnRight(fromDir);
        snapshot('turn', blockId, { fromDir, turn: block.type });
      } else if (block.type === 'collect') {
        if (!consumeStep(blockId)) return;
        const { x, y } = state.robot;
        const key = coordKey(x, y);
        const tile = getTile(state, x, y);
        let acted = false;

        if (state.crystals.has(key)) {
          state.crystals.delete(key);
          snapshot('collect', blockId, { crystalX: x, crystalY: y });
          acted = true;
        }

        if (tile?.type === 'button' && tile.channel) {
          state.channels[tile.channel] = !state.channels[tile.channel];
          snapshot('toggle_channel', blockId, {
            channel: tile.channel,
            active: state.channels[tile.channel],
          });
          acted = true;
        }

        if (!acted) {
          snapshot('noop_action', blockId);
        }

        if (checkWin(blockId)) return;
      } else if (block.type === 'repeat') {
        const times = Math.max(0, Math.min(99, Math.floor(Number(block.times) || 0)));
        const body = Array.isArray(block.body) ? block.body : [];
        for (let i = 0; i < times; i++) {
          if (status !== 'incomplete') return;
          if (body.length === 0) break;
          runBlocks(body, callDepth);
        }
      } else if (block.type === 'if') {
        if (!consumeStep(blockId)) return;
        const matched = evaluateSensor(state, block.sensor);
        snapshot('sensor_check', blockId, { sensor: block.sensor, result: matched });
        const branch = matched ? block.then : block.else;
        if (Array.isArray(branch) && branch.length > 0) {
          runBlocks(branch, callDepth);
        }
      } else if (block.type === 'call') {
        if (callDepth >= maxCallDepth) {
          status = 'infinite_loop';
          failureReason = 'max_call_depth';
          failedBlockId = blockId;
          return;
        }
        const fnName = block.fn;
        const fnBody = norm.functions[fnName];
        if (!Array.isArray(fnBody)) {
          throw new Error(`Unknown function: ${fnName}`);
        }
        if (!consumeStep(blockId)) return;
        snapshot('call_enter', blockId, { fn: fnName });
        runBlocks(fnBody, callDepth + 1);
      } else {
        throw new Error(`Unknown block type: ${block.type}`);
      }
    }
  };

  runBlocks(norm.main, 0);

  return {
    status,
    failureReason,
    failedBlockId,
    steps,
    blockCount,
    stars: computeStars(level, blockCount, status === 'won'),
    events,
    finalState: {
      x: state.robot.x,
      y: state.robot.y,
      dir: state.robot.dir,
      crystalsRemaining: state.crystals.size,
      channels: { ...state.channels },
    },
  };
}
