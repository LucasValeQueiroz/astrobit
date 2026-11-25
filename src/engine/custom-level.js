/**
 * AstroBit Custom Level Workshop Engine — 100% pure, DOM-free.
 * Handles draft creation, starter templates, real-time validation,
 * and compact URL-safe Base64 encoding/decoding (`?custom=...`) with zero backend.
 */

import { parseAsciiGrid } from './grid.js';

export const MIN_GRID_W = 3;
export const MAX_GRID_W = 12;
export const MIN_GRID_H = 3;
export const MAX_GRID_H = 9;

export const BASE_CUSTOM_BLOCKS = ['up', 'down', 'move_left', 'move_right', 'collect'];

const ALLOWED_TILE_CHARS = new Set([
  '.', '#', ' ', '*', 'G', '^', '>', 'v', '<',
  'a', 'b', 'c', 'd', 'A', 'B', 'C', 'D', '=', '1', '2', '3', '4', '~', 'O',
]);

export const WORKSHOP_TEMPLATES = [
  {
    id: 'starter',
    namePt: 'Base Simples',
    nameEn: 'Simple Base',
    world: 1,
    parBlocks: 6,
    extras: ['repeat'],
    rows: [
      '########',
      '#>.**..#',
      '####..G#',
      '########',
    ],
  },
  {
    id: 'portal-laser',
    namePt: 'Portal & Laser',
    nameEn: 'Portal & Laser',
    world: 3,
    parBlocks: 10,
    extras: ['repeat', 'if'],
    rows: [
      '########',
      '#>*a1#.#',
      '#####=A#',
      '###1.*G#',
      '########',
    ],
  },
  {
    id: 'staircase',
    namePt: 'Escada Espacial',
    nameEn: 'Space Stairs',
    world: 2,
    parBlocks: 6,
    extras: ['repeat', 'call_f1'],
    rows: [
      '#######',
      '>*#####',
      '#.*####',
      '##.*###',
      '###.*G#',
      '#######',
    ],
  },
  {
    id: 'wormhole',
    namePt: 'Buraco de Minhoca',
    nameEn: 'Wormhole',
    world: 6,
    parBlocks: 6,
    extras: ['repeat', 'call_f1'],
    rows: [
      '         ',
      '>*1  1*2 ',
      '     2*G ',
    ],
  },
  {
    id: 'frozen-rink',
    namePt: 'Pista Polar',
    nameEn: 'Polar Rink',
    world: 7,
    parBlocks: 8,
    extras: ['repeat'],
    rows: [
      '#########',
      '#>O~~~~a#',
      '#..###..#',
      '#..A.*G.#',
      '#########',
    ],
  },
];

/**
 * Creates a clean playable blank workshop draft of given dimensions.
 */
export function createBlankWorkshopDraft(width = 8, height = 5) {
  const w = Math.max(MIN_GRID_W, Math.min(MAX_GRID_W, Math.floor(width)));
  const h = Math.max(MIN_GRID_H, Math.min(MAX_GRID_H, Math.floor(height)));
  const rows = [];

  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const border = y === 0 || y === h - 1 || x === 0 || x === w - 1;
      row += border ? '#' : '.';
    }
    rows.push(row);
  }

  const midY = Math.floor(h / 2);
  const chars = rows[midY].split('');
  chars[1] = '>';
  if (w >= 5) chars[Math.floor(w / 2)] = '*';
  chars[w - 2] = 'G';
  rows[midY] = chars.join('');

  return {
    title: 'Minha Missão Espacial',
    world: 1,
    rows,
    parBlocks: 8,
    extras: ['repeat'],
    bridges: {},
  };
}

/**
 * Resizes an existing grid rows array while preserving painted interior tiles where possible.
 */
export function resizeDraftRows(rows = [], newW = 8, newH = 5) {
  const w = Math.max(MIN_GRID_W, Math.min(MAX_GRID_W, Math.floor(newW)));
  const h = Math.max(MIN_GRID_H, Math.min(MAX_GRID_H, Math.floor(newH)));
  const out = [];

  for (let y = 0; y < h; y++) {
    let line = '';
    for (let x = 0; x < w; x++) {
      const existing = rows[y]?.[x];
      if (existing && ALLOWED_TILE_CHARS.has(existing)) {
        line += existing;
      } else {
        const border = y === 0 || y === h - 1 || x === 0 || x === w - 1;
        line += border ? '#' : '.';
      }
    }
    out.push(line);
  }
  return out;
}

/**
 * Validates a workshop draft and returns structured validation error codes for friendly UI feedback.
 */
export function validateWorkshopDraft(draft) {
  const issues = [];
  if (!draft || !Array.isArray(draft.rows) || draft.rows.length < MIN_GRID_H || draft.rows.length > MAX_GRID_H) {
    return { valid: false, issues: [{ code: 'invalid_size' }] };
  }

  const height = draft.rows.length;
  const width = Math.max(...draft.rows.map((r) => String(r ?? '').length));
  if (width < MIN_GRID_W || width > MAX_GRID_W) {
    return { valid: false, issues: [{ code: 'invalid_size' }] };
  }

  let startCount = 0;
  let crystalCount = 0;
  let goalCount = 0;
  const portalCounts = {};

  for (let y = 0; y < height; y++) {
    const rowStr = String(draft.rows[y] ?? '');
    for (let x = 0; x < width; x++) {
      const ch = rowStr[x] ?? ' ';
      if (!ALLOWED_TILE_CHARS.has(ch)) {
        issues.push({ code: 'invalid_tile', tile: ch });
        continue;
      }
      if (ch === '^' || ch === '>' || ch === 'v' || ch === '<') startCount += 1;
      if (ch === '*') crystalCount += 1;
      if (ch === 'G') goalCount += 1;
      if (ch >= '1' && ch <= '4') {
        portalCounts[ch] = (portalCounts[ch] || 0) + 1;
      }
    }
  }

  if (startCount === 0) issues.push({ code: 'missing_robot' });
  if (startCount > 1) issues.push({ code: 'multiple_robots' });
  if (crystalCount === 0 && goalCount === 0) issues.push({ code: 'missing_objective' });

  for (const [portalId, count] of Object.entries(portalCounts)) {
    if (count !== 2) {
      issues.push({ code: 'unpaired_portal', portalId, count });
    }
  }

  if (issues.length === 0) {
    try {
      parseAsciiGrid(draft.rows, { bridges: draft.bridges || {} });
    } catch {
      issues.push({ code: 'invalid_grid' });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    stats: { width, height, crystalCount, goalCount },
  };
}

/**
 * Converts a validated workshop draft into a full playable AstroBit level object.
 */
export function normalizeCustomLevel(draft, idOverride = null) {
  const title = String(draft?.title || 'Missão da Oficina').trim().slice(0, 48) || 'Missão da Oficina';
  const world = Math.max(1, Math.min(6, Math.floor(Number(draft?.world) || 1)));
  const parBlocks = Math.max(1, Math.min(40, Math.floor(Number(draft?.parBlocks) || 8)));
  const goodBlocks = Math.max(parBlocks + 2, Math.floor(Number(draft?.goodBlocks) || parBlocks + 4));

  const validExtras = ['repeat', 'if', 'call_f1', 'call_f2'];
  const rawExtras = Array.isArray(draft?.extras) ? draft.extras : ['repeat'];
  const extras = rawExtras.filter((b) => validExtras.includes(b));
  const allowedBlocks = [...BASE_CUSTOM_BLOCKS, ...new Set(extras)];

  const rows = Array.isArray(draft?.rows) ? draft.rows.map((r) => String(r)) : createBlankWorkshopDraft().rows;
  const bridges = draft?.bridges && typeof draft.bridges === 'object' ? { ...draft.bridges } : {};

  return {
    id: idOverride || draft?.id || `custom-${Date.now().toString(36)}`,
    isCustom: true,
    world,
    index: 0,
    titlePt: title,
    titleEn: title,
    hintPt: '🛠️ Missão especial da Oficina Criadora! Monte o quebra-cabeça para pegar os cristais e chegar em ★!',
    hintEn: '🛠️ Special Creative Workshop mission! Snap your puzzle pieces to grab the crystals and reach ★!',
    firstBlockHint: 'move_right',
    allowedBlocks,
    rows,
    bridges,
    starThresholds: { parBlocks, goodBlocks },
    workshopDraft: {
      title,
      world,
      rows,
      parBlocks,
      extras,
      bridges,
    },
  };
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 =
    typeof globalThis.btoa === 'function'
      ? globalThis.btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return b64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function base64UrlToBytes(str) {
  const padded = str.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (str.length % 4)) % 4);
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

/**
 * Encodes a workshop draft into a compact URL-safe string for `?custom=<encoded>`.
 */
export function encodeCustomLevel(draft) {
  const check = validateWorkshopDraft(draft);
  if (!check.valid) {
    throw new Error(`Cannot encode invalid custom level: ${check.issues.map((i) => i.code).join(', ')}`);
  }

  const norm = normalizeCustomLevel(draft);
  const compact = {
    v: 1,
    t: norm.workshopDraft.title,
    w: norm.workshopDraft.world,
    r: norm.workshopDraft.rows,
    p: norm.workshopDraft.parBlocks,
    e: norm.workshopDraft.extras,
  };
  if (Object.keys(norm.workshopDraft.bridges).length > 0) {
    compact.br = norm.workshopDraft.bridges;
  }

  const json = JSON.stringify(compact);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

/**
 * Decodes a `?custom=<encoded>` string into a validated, playable AstroBit level object (or null if invalid).
 */
export function decodeCustomLevel(encoded) {
  if (!encoded || typeof encoded !== 'string' || encoded.length > 4096) {
    return null;
  }
  try {
    const bytes = base64UrlToBytes(encoded.trim());
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.r)) {
      return null;
    }

    const draft = {
      title: typeof parsed.t === 'string' ? parsed.t : 'Missão Compartilhada',
      world: Number(parsed.w) || 1,
      rows: parsed.r.map((row) => String(row)),
      parBlocks: Number(parsed.p) || 8,
      extras: Array.isArray(parsed.e) ? parsed.e : ['repeat'],
      bridges: parsed.br && typeof parsed.br === 'object' ? parsed.br : {},
    };

    const check = validateWorkshopDraft(draft);
    if (!check.valid) return null;

    return normalizeCustomLevel(draft, 'custom-shared');
  } catch {
    return null;
  }
}
