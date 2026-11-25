/**
 * AstroBit Real-Time BFS/A* Pathfinder Coach — 100% pure, DOM-free AAA Game AI.
 * Computes the shortest walkable path from the robot's current simulated position
 * to the nearest uncollected crystal (or Goal ★ once all crystals are collected),
 * returning both visual Wayfinder breadcrumbs for the Canvas and the exact next block
 * to recommend to kids!
 */

import { coordKey, stepCoords, classifyTileStep, createWorldState } from './grid.js';
import { executeProgram } from './interpreter.js';

const CARDINAL_MOVES = [
  { dir: 'E', blockType: 'move_right' },
  { dir: 'W', blockType: 'move_left' },
  { dir: 'N', blockType: 'up' },
  { dir: 'S', blockType: 'down' },
];

/**
 * Finds the shortest path from `(startX, startY)` to any target coordinate in `targetKeys`
 * using Breadth-First Search (exact shortest path on uniform grid) while recording
 * `exploredCount` for the AAA Engine X-Ray overlay!
 */
export function findShortestPathToTargets(worldState, startX, startY, targetKeys) {
  if (!worldState || !targetKeys || targetKeys.size === 0) {
    return { found: false, path: [], firstBlockType: null, explored: [] };
  }

  const startKey = coordKey(startX, startY);
  if (targetKeys.has(startKey)) {
    return {
      found: true,
      path: [{ x: startX, y: startY }],
      firstBlockType: worldState.crystals.has(startKey) ? 'collect' : null,
      explored: [{ x: startX, y: startY }],
    };
  }

  const queue = [{ x: startX, y: startY, path: [{ x: startX, y: startY }], firstBlockType: null }];
  const visited = new Set([startKey]);
  const explored = [{ x: startX, y: startY }];

  while (queue.length > 0 && explored.length < 180) {
    const cur = queue.shift();
    for (const mv of CARDINAL_MOVES) {
      const nxt = stepCoords(cur.x, cur.y, mv.dir);
      const key = coordKey(nxt.x, nxt.y);
      if (visited.has(key)) continue;
      if (classifyTileStep(worldState, nxt.x, nxt.y) !== 'ok') continue;

      visited.add(key);
      explored.push({ x: nxt.x, y: nxt.y });
      const nextPath = [...cur.path, { x: nxt.x, y: nxt.y }];
      const firstBlock = cur.firstBlockType || mv.blockType;

      if (targetKeys.has(key)) {
        return { found: true, path: nextPath, firstBlockType: firstBlock, explored };
      }
      queue.push({ x: nxt.x, y: nxt.y, path: nextPath, firstBlockType: firstBlock });
    }
  }

  return { found: false, path: [], firstBlockType: null, explored };
}

/**
 * Simulates the player's current program and runs the live Pathfinder from wherever
 * AstroBit currently ends up — so hints & holographic Wayfinder breadcrumbs always
 * adapt intelligently to the child's actual puzzle!
 */
export function computeLiveWayfinder(level, program) {
  if (!level) {
    return { found: false, path: [], nextBlockType: null, explored: [], alreadyWon: false };
  }

  const world = createWorldState(level);
  const sim = executeProgram(level, program);
  if (sim.status === 'won') {
    return { found: true, path: [], nextBlockType: null, explored: [], alreadyWon: true };
  }

  // Apply simulated progress onto a fresh world state so crystals & channels match!
  world.robot.x = sim.finalState.x;
  world.robot.y = sim.finalState.y;
  world.robot.dir = sim.finalState.dir;
  world.channels = { ...sim.finalState.channels };
  for (const ev of sim.events) {
    if (ev.type === 'collect') {
      world.crystals.delete(coordKey(ev.crystalX, ev.crystalY));
    }
    if (Array.isArray(ev.crates)) {
      world.crates = new Set(ev.crates);
    }
  }

  // If standing right on an uncollected crystal, immediately recommend 'collect'!
  const hereKey = coordKey(world.robot.x, world.robot.y);
  if (world.crystals.has(hereKey)) {
    return {
      found: true,
      path: [{ x: world.robot.x, y: world.robot.y }],
      nextBlockType: 'collect',
      explored: [{ x: world.robot.x, y: world.robot.y }],
      alreadyWon: false,
    };
  }

  // Target nearest uncollected crystal first, or Goal ★ when all crystals are collected
  const targets = new Set();
  if (world.crystals.size > 0) {
    for (const cKey of world.crystals) targets.add(cKey);
  } else if (world.goal) {
    targets.add(coordKey(world.goal.x, world.goal.y));
  }

  const res = findShortestPathToTargets(world, world.robot.x, world.robot.y, targets);
  return {
    found: res.found,
    path: res.path,
    nextBlockType: res.firstBlockType,
    explored: res.explored,
    alreadyWon: false,
  };
}
