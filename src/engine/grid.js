/**
 * AstroBit Core Grid Model — 100% pure, DOM-free deterministic world model.
 * Handles directions, ASCII map parsing, switches/channels, lasers, bridges, portals, and sensors.
 */

export const DIRECTIONS = ['N', 'E', 'S', 'W'];

export const DIR_DELTAS = {
  N: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  S: { dx: 0, dy: 1 },
  W: { dx: -1, dy: 0 },
};

const START_CHAR_TO_DIR = {
  '^': 'N',
  '>': 'E',
  v: 'S',
  '<': 'W',
};

export function coordKey(x, y) {
  return `${x},${y}`;
}

export function turnLeft(dir) {
  const idx = DIRECTIONS.indexOf(dir);
  if (idx === -1) throw new Error(`Invalid direction: ${dir}`);
  return DIRECTIONS[(idx + 3) % 4];
}

export function turnRight(dir) {
  const idx = DIRECTIONS.indexOf(dir);
  if (idx === -1) throw new Error(`Invalid direction: ${dir}`);
  return DIRECTIONS[(idx + 1) % 4];
}

export function stepCoords(x, y, dir) {
  const delta = DIR_DELTAS[dir];
  if (!delta) throw new Error(`Invalid direction: ${dir}`);
  return { x: x + delta.dx, y: y + delta.dy };
}

/**
 * Parses a readable ASCII grid definition into normalized tiles and start position.
 * Legend:
 *  '.' floor | '#' wall | ' ' void | '*' crystal | 'G' goal
 *  '^' '>' 'v' '<' robot start facing N/E/S/W
 *  'a'..'d' button on channel A..D
 *  'A'..'D' laser on channel A..D (active by default)
 *  '=' retractable bridge (inactive by default, channel 'A' unless overridden)
 *  '1'..'4' paired portals
 *
 * @param {string[]} rows
 * @param {{ bridges?: Record<string, string>, tileOverrides?: Record<string, object> }} [extras]
 */
export function parseAsciiGrid(rows, extras = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Grid rows must be a non-empty array of strings.');
  }

  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  if (width === 0) {
    throw new Error('Grid width must be greater than 0.');
  }

  let start = null;
  const grid = [];

  for (let y = 0; y < height; y++) {
    const rowStr = rows[y];
    const rowTiles = [];
    for (let x = 0; x < width; x++) {
      const ch = rowStr[x] ?? ' ';
      const key = coordKey(x, y);
      let tile = { type: 'void' };

      if (ch === '.') {
        tile = { type: 'floor' };
      } else if (ch === '#') {
        tile = { type: 'wall' };
      } else if (ch === ' ') {
        tile = { type: 'void' };
      } else if (ch === '*') {
        tile = { type: 'floor', hasCrystal: true };
      } else if (ch === 'G') {
        tile = { type: 'goal' };
      } else if (START_CHAR_TO_DIR[ch]) {
        tile = { type: 'floor' };
        start = { x, y, dir: START_CHAR_TO_DIR[ch] };
      } else if (ch >= 'a' && ch <= 'd') {
        tile = { type: 'button', channel: ch.toUpperCase() };
      } else if (ch >= 'A' && ch <= 'D') {
        tile = { type: 'laser', channel: ch, activeByDefault: true };
      } else if (ch === '=') {
        const channel = extras.bridges?.[key] || 'A';
        tile = { type: 'bridge', channel, activeByDefault: false };
      } else if (ch >= '1' && ch <= '4') {
        tile = { type: 'portal', portalId: ch };
      } else {
        throw new Error(`Unsupported ASCII tile "${ch}" at (${x}, ${y}).`);
      }

      if (extras.tileOverrides?.[key]) {
        tile = { ...tile, ...extras.tileOverrides[key] };
      }
      rowTiles.push(tile);
    }
    grid.push(rowTiles);
  }

  return { width, height, grid, start };
}

/**
 * Creates a fresh mutable world state from a level definition.
 * Accepts either `level.rows` (ASCII) or pre-parsed `level.grid` + `level.start`.
 * @param {object} level
 */
export function createWorldState(level) {
  let parsed;
  if (Array.isArray(level.rows)) {
    parsed = parseAsciiGrid(level.rows, {
      bridges: level.bridges,
      tileOverrides: level.tileOverrides,
    });
  } else if (Array.isArray(level.grid)) {
    parsed = {
      width: level.grid[0]?.length || 0,
      height: level.grid.length,
      grid: level.grid.map((row) => row.map((cell) => ({ ...cell }))),
      start: level.start ? { ...level.start } : null,
    };
  } else {
    throw new Error('Level must define either `rows` (ASCII) or `grid`.');
  }

  const start = level.start ? { ...level.start } : parsed.start;
  if (!start || !DIRECTIONS.includes(start.dir)) {
    throw new Error('Level must define a valid robot start position and direction.');
  }

  const crystals = new Set();
  const channels = {};
  const portals = new Map();
  let goal = null;

  for (let y = 0; y < parsed.height; y++) {
    for (let x = 0; x < parsed.width; x++) {
      const tile = parsed.grid[y][x];
      if (tile.hasCrystal) {
        crystals.add(coordKey(x, y));
      }
      if (tile.type === 'goal') {
        goal = { x, y };
      }
      if (tile.channel && !(tile.channel in channels)) {
        channels[tile.channel] = false;
      }
      if (tile.type === 'portal' && tile.portalId) {
        const list = portals.get(tile.portalId) || [];
        list.push({ x, y });
        portals.set(tile.portalId, list);
      }
    }
  }

  return {
    width: parsed.width,
    height: parsed.height,
    grid: parsed.grid,
    robot: { x: start.x, y: start.y, dir: start.dir },
    crystals,
    totalCrystals: crystals.size,
    hasGoal: Boolean(goal),
    goal,
    channels,
    portals,
  };
}

export function getTile(state, x, y) {
  if (y < 0 || y >= state.height || x < 0 || x >= state.width) {
    return null;
  }
  return state.grid[y][x];
}

export function isLaserActive(tile, channels) {
  if (!tile || tile.type !== 'laser') return false;
  const toggled = Boolean(channels?.[tile.channel]);
  const defaultActive = tile.activeByDefault !== false;
  return defaultActive ? !toggled : toggled;
}

export function isBridgeActive(tile, channels) {
  if (!tile || tile.type !== 'bridge') return false;
  const toggled = Boolean(channels?.[tile.channel]);
  const defaultActive = tile.activeByDefault === true;
  return defaultActive ? !toggled : toggled;
}

/**
 * Classifies what happens if the robot attempts to step into (x, y).
 * @returns {'ok' | 'hit_wall' | 'fell_off' | 'hit_laser'}
 */
export function classifyTileStep(state, x, y) {
  const tile = getTile(state, x, y);
  if (!tile || tile.type === 'void') {
    return 'fell_off';
  }
  if (tile.type === 'wall') {
    return 'hit_wall';
  }
  if (tile.type === 'laser') {
    return isLaserActive(tile, state.channels) ? 'hit_laser' : 'ok';
  }
  if (tile.type === 'bridge') {
    return isBridgeActive(tile, state.channels) ? 'ok' : 'fell_off';
  }
  return 'ok';
}

/**
 * Finds the paired exit coordinates for a portal tile at (x, y), or null if none.
 */
export function findPortalExit(state, x, y) {
  const tile = getTile(state, x, y);
  if (!tile || tile.type !== 'portal' || !tile.portalId) return null;
  const pair = state.portals.get(tile.portalId);
  if (!pair || pair.length !== 2) return null;
  const [first, second] = pair;
  if (first.x === x && first.y === y) {
    return { x: second.x, y: second.y, portalId: tile.portalId };
  }
  return { x: first.x, y: first.y, portalId: tile.portalId };
}

/**
 * Evaluates a conditional sensor relative to the robot's current position and heading.
 */
export function evaluateSensor(state, sensor) {
  const { x, y, dir } = state.robot;
  const ahead = stepCoords(x, y, dir);
  const aheadResult = classifyTileStep(state, ahead.x, ahead.y);

  switch (sensor) {
    case 'path_clear':
      return aheadResult === 'ok';
    case 'path_blocked':
      return aheadResult !== 'ok';
    case 'crystal_here':
      return state.crystals.has(coordKey(x, y));
    case 'crystal_ahead':
      return state.crystals.has(coordKey(ahead.x, ahead.y));
    case 'laser_ahead':
      return aheadResult === 'hit_laser';
    case 'button_here': {
      const tile = getTile(state, x, y);
      return tile?.type === 'button';
    }
    default:
      throw new Error(`Unknown sensor: ${sensor}`);
  }
}

/**
 * Returns true when all crystals have been collected and (if the level has a Goal tile)
 * the robot is standing on the Goal tile.
 */
export function isWinState(state) {
  if (state.crystals.size > 0) return false;
  if (state.hasGoal && state.goal) {
    return state.robot.x === state.goal.x && state.robot.y === state.goal.y;
  }
  return state.totalCrystals > 0;
}
