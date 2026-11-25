/**
 * AstroBit Endless Arcade Mode ("⚡ Corrida Espacial") — 100% pure, deterministic, DOM-free.
 * Infinite escalating puzzles across all 7 worlds with 3 shields, first-try combo multipliers
 * (x1 -> x5), score calculation, and personal best tracking.
 */

const MOVE_DIRS = [
  { type: 'move_right', dx: 1, dy: 0 },
  { type: 'move_left', dx: -1, dy: 0 },
  { type: 'up', dx: 0, dy: -1 },
  { type: 'down', dx: 0, dy: 1 },
];

export const ARCADE_MAX_SHIELDS = 3;

function hashArcadeSeed(seed, round) {
  let h = (2166136261 ^ (Number(seed) >>> 0)) >>> 0;
  const tag = `arcade-${round}`;
  for (let i = 0; i < tag.length; i++) {
    h ^= tag.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function compressMovesToBlocks(moves, prefix = 'arc') {
  const blocks = [];
  let i = 0;
  let idCounter = 1;
  while (i < moves.length) {
    const cur = moves[i];
    if (cur !== 'collect') {
      let run = 1;
      while (i + run < moves.length && moves[i + run] === cur) {
        run += 1;
      }
      if (run >= 3) {
        blocks.push({
          id: `${prefix}-${idCounter++}`,
          type: 'repeat',
          times: run,
          body: [{ id: `${prefix}-${idCounter++}`, type: cur }],
        });
        i += run;
        continue;
      }
    }
    blocks.push({ id: `${prefix}-${idCounter++}`, type: cur });
    i += 1;
  }
  return blocks;
}

function countBlocks(blocks) {
  let total = 0;
  for (const b of blocks) {
    total += 1;
    if (b.type === 'repeat') total += countBlocks(b.body || []);
  }
  return total;
}

export function computeComboMultiplier(streak = 0) {
  const s = Math.max(0, Math.floor(Number(streak) || 0));
  return Math.min(5, 1 + s);
}

export function createArcadeRun(seed = Date.now()) {
  return {
    active: true,
    seed: Number(seed) >>> 0,
    round: 1,
    shields: ARCADE_MAX_SHIELDS,
    streak: 0,
    multiplier: 1,
    score: 0,
    attemptsThisRound: 0,
    gameOver: false,
    lastPoints: 0,
  };
}

/**
 * Applies a run outcome (win or fail) to an arcade session immutably.
 */
export function applyArcadeOutcome(run, { won, stars = 1 } = {}) {
  if (!run || !run.active || run.gameOver) return run;
  if (won) {
    const cleanFirstTry = run.attemptsThisRound === 0;
    const nextStreak = cleanFirstTry ? run.streak + 1 : 0;
    const mult = computeComboMultiplier(nextStreak);
    const safeStars = Math.max(1, Math.min(3, Math.floor(Number(stars) || 1)));
    const earned = (100 + safeStars * 50) * mult;
    return {
      ...run,
      streak: nextStreak,
      multiplier: mult,
      score: run.score + earned,
      lastPoints: earned,
      round: run.round + 1,
      attemptsThisRound: 0,
      gameOver: false,
    };
  }

  const nextShields = Math.max(0, run.shields - 1);
  return {
    ...run,
    shields: nextShields,
    streak: 0,
    multiplier: 1,
    lastPoints: 0,
    attemptsThisRound: run.attemptsThisRound + 1,
    gameOver: nextShields === 0,
  };
}

/**
 * Generates a guaranteed 3★-solvable Arcade level for the given round & seed.
 * Difficulty scales smoothly from 6-step paths (round 1) up to 11-step mazes across all 7 worlds.
 */
export function generateArcadeLevel(round = 1, seed = 20261124) {
  const safeRound = Math.max(1, Math.floor(Number(round) || 1));
  const h = hashArcadeSeed(seed, safeRound);
  const rand = mulberry32(h);

  const W = safeRound >= 5 ? 9 : 8;
  const H = safeRound >= 4 ? 6 : 5;
  const world = ((safeRound - 1) % 7) + 1;
  const minSteps = Math.min(10, 5 + Math.floor(safeRound / 2));
  const maxSteps = Math.min(13, minSteps + 3);

  let bestPath = null;
  let bestMoves = null;

  for (let attempt = 0; attempt < 28; attempt++) {
    const startX = 1 + Math.floor(rand() * 2);
    const startY = 1 + Math.floor(rand() * (H - 2));
    const path = [{ x: startX, y: startY }];
    const moves = [];
    const visited = new Set([`${startX},${startY}`]);
    const targetSteps = minSteps + Math.floor(rand() * (maxSteps - minSteps + 1));

    for (let s = 0; s < targetSteps; s++) {
      const cur = path[path.length - 1];
      const candidates = MOVE_DIRS.filter((d) => {
        const nx = cur.x + d.dx;
        const ny = cur.y + d.dy;
        return nx >= 1 && nx <= W - 2 && ny >= 1 && ny <= H - 2 && !visited.has(`${nx},${ny}`);
      });
      if (candidates.length === 0) break;
      const pick = candidates[Math.floor(rand() * candidates.length)];
      const next = { x: cur.x + pick.dx, y: cur.y + pick.dy };
      path.push(next);
      moves.push(pick.type);
      visited.add(`${next.x},${next.y}`);
    }

    if (!bestPath || path.length > bestPath.length) {
      bestPath = path;
      bestMoves = moves;
    }
    if (path.length >= minSteps + 1) break;
  }

  if (!bestPath || bestPath.length < 4) {
    bestPath = [
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
      { x: 6, y: 2 },
    ];
    bestMoves = ['move_right', 'move_right', 'move_right', 'move_right', 'move_right'];
  }

  const grid = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => {
      const border = y === 0 || y === H - 1 || x === 0 || x === W - 1;
      return border ? '#' : '.';
    })
  );

  const pathSet = new Set(bestPath.map((p) => `${p.x},${p.y}`));
  const wallDensity = Math.min(0.52, 0.34 + safeRound * 0.02);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (!pathSet.has(`${x},${y}`) && rand() < wallDensity) {
        grid[y][x] = '#';
      }
    }
  }

  const start = bestPath[0];
  const goal = bestPath[bestPath.length - 1];
  grid[start.y][start.x] = '>';
  grid[goal.y][goal.x] = 'G';

  const interiorIndices = [];
  for (let i = 1; i < bestPath.length - 1; i++) {
    interiorIndices.push(i);
  }
  const crystalCount = Math.min(
    interiorIndices.length,
    safeRound >= 3 ? 3 : 2
  );
  const chosenIndices = new Set();
  for (let c = 0; c < crystalCount; c++) {
    const pickIdx = Math.floor(((c + 0.5) / crystalCount) * interiorIndices.length);
    const chosen = interiorIndices[Math.min(interiorIndices.length - 1, pickIdx)];
    chosenIndices.add(chosen);
    const pos = bestPath[chosen];
    grid[pos.y][pos.x] = '*';
  }

  const fullActions = [];
  for (let i = 0; i < bestMoves.length; i++) {
    fullActions.push(bestMoves[i]);
    if (chosenIndices.has(i + 1)) {
      fullActions.push('collect');
    }
  }

  const referenceSolution = compressMovesToBlocks(fullActions, `arc${safeRound}`);
  const parBlocks = countBlocks(referenceSolution);

  return {
    id: `arcade-r${safeRound}-${seed}`,
    world,
    index: safeRound,
    isArcade: true,
    arcadeRound: safeRound,
    titlePt: `⚡ Arcade · Fase #${safeRound}`,
    titleEn: `⚡ Arcade · Stage #${safeRound}`,
    hintPt: `Corrida Espacial #${safeRound}! Passe de primeira para multiplicar seu Combo (até ×5) e proteger seus 3 escudos!`,
    hintEn: `Space Run #${safeRound}! Clear on your first try to stack your Combo (up to ×5) and protect your 3 shields!`,
    firstBlockHint: referenceSolution[0]?.type || 'move_right',
    allowedBlocks: ['up', 'down', 'move_left', 'move_right', 'collect', 'repeat', 'call_f1'],
    rows: grid.map((r) => r.join('')),
    starThresholds: {
      parBlocks,
      goodBlocks: parBlocks + 3,
    },
    referenceSolution,
  };
}
