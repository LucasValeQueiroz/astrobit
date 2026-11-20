/**
 * AstroBit Daily Space Challenge Generator — 100% pure, deterministic, DOM-free.
 * Every calendar date (YYYY-MM-DD) yields the same solvable space puzzle for everyone,
 * with a mathematically guaranteed 3★ referenceSolution and Daily Streak tracking.
 */

const MOVE_DIRS = [
  { type: 'move_right', dx: 1, dy: 0 },
  { type: 'move_left', dx: -1, dy: 0 },
  { type: 'up', dx: 0, dy: -1 },
  { type: 'down', dx: 0, dy: 1 },
];

export function getTodayDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function hashDateKey(dateKey) {
  let h = 2166136261 >>> 0;
  const str = String(dateKey || '2026-01-01');
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
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

function compressMovesToBlocks(moves) {
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
          id: `dc-${idCounter++}`,
          type: 'repeat',
          times: run,
          body: [{ id: `dc-${idCounter++}`, type: cur }],
        });
        i += run;
        continue;
      }
    }
    blocks.push({ id: `dc-${idCounter++}`, type: cur });
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

/**
 * Generates a deterministic, guaranteed-solvable Daily Space Mission for `dateKey` (`YYYY-MM-DD`).
 */
export function generateDailyLevel(dateKey = getTodayDateKey()) {
  const seed = hashDateKey(dateKey);
  const rand = mulberry32(seed);
  const W = 8;
  const H = 5;
  const world = (seed % 6) + 1;

  // Build a guaranteed self-avoiding path inside interior [1..W-2, 1..H-2]
  let bestPath = null;
  let bestMoves = null;

  for (let attempt = 0; attempt < 24; attempt++) {
    const startX = 1 + Math.floor(rand() * 2);
    const startY = 1 + Math.floor(rand() * (H - 2));
    const path = [{ x: startX, y: startY }];
    const moves = [];
    const visited = new Set([`${startX},${startY}`]);
    const targetSteps = 6 + Math.floor(rand() * 4); // 6..9 steps

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
    if (path.length >= 7) break;
  }

  // Fallback deterministic L-path if random walk ever fell short
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

  // Sprinkle decorative rock walls on non-path interior tiles so the maze feels rich
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (!pathSet.has(`${x},${y}`) && rand() < 0.42) {
        grid[y][x] = '#';
      }
    }
  }

  // Place robot start & goal
  const start = bestPath[0];
  const goal = bestPath[bestPath.length - 1];
  grid[start.y][start.x] = '>';
  grid[goal.y][goal.x] = 'G';

  // Pick 2 or 3 crystal indices strictly between start and goal
  const interiorIndices = [];
  for (let i = 1; i < bestPath.length - 1; i++) interiorIndices.push(i);
  const crystalCount = Math.min(interiorIndices.length, rand() < 0.5 ? 2 : 3);
  const crystalIndices = new Set();
  for (let c = 0; c < crystalCount; c++) {
    const idx = Math.floor(((c + 1) * interiorIndices.length) / (crystalCount + 1));
    const chosen = interiorIndices[Math.min(interiorIndices.length - 1, idx)];
    crystalIndices.add(chosen);
  }
  for (const idx of crystalIndices) {
    const pt = bestPath[idx];
    grid[pt.y][pt.x] = '*';
  }

  // Build exact solution trace with collect on crystal tiles
  const rawSteps = [];
  for (let i = 0; i < bestMoves.length; i++) {
    rawSteps.push(bestMoves[i]);
    if (crystalIndices.has(i + 1)) {
      rawSteps.push('collect');
    }
  }

  const referenceSolution = compressMovesToBlocks(rawSteps);
  const parBlocks = countBlocks(referenceSolution);

  return {
    id: `daily-${dateKey}`,
    isDaily: true,
    dailyDateKey: dateKey,
    world,
    index: 0,
    titlePt: `🔥 Missão Diária (${dateKey})`,
    titleEn: `🔥 Daily Mission (${dateKey})`,
    hintPt:
      '🌟 Desafio Diário exclusivo de hoje! Colete todos os cristais até ★ para manter sua sequência (Streak 🔥)!',
    hintEn:
      '🌟 Today’s exclusive Daily Challenge! Collect all crystals and reach ★ to keep your Daily Streak 🔥 alive!',
    firstBlockHint: referenceSolution[0]?.type || 'move_right',
    allowedBlocks: ['up', 'down', 'move_left', 'move_right', 'collect', 'repeat', 'if', 'call_f1'],
    rows: grid.map((row) => row.join('')),
    starThresholds: { parBlocks, goodBlocks: parBlocks + 3 },
    referenceSolution,
  };
}

function previousDateKey(dateKey) {
  const [y, m, d] = String(dateKey).split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Computes the active daily streak ending on `todayKey` (or yesterday if today isn't completed yet).
 */
export function computeDailyStreak(completedDates = [], todayKey = getTodayDateKey()) {
  const set = new Set(Array.isArray(completedDates) ? completedDates : []);
  let cursor = set.has(todayKey) ? todayKey : previousDateKey(todayKey);
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = previousDateKey(cursor);
  }
  return streak;
}

/**
 * Records a completed daily challenge date and returns updated progress fields.
 */
export function recordDailyCompletion(progress, dateKey = getTodayDateKey()) {
  const prevDates = Array.isArray(progress?.dailyCompletedDates) ? progress.dailyCompletedDates : [];
  const nextSet = new Set(prevDates);
  nextSet.add(dateKey);
  const sorted = [...nextSet].sort();
  return {
    ...progress,
    dailyCompletedDates: sorted,
  };
}
