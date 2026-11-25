/**
 * AstroBit Ghost Replay Engine — 100% pure, DOM-free.
 * Extracts compact position/heading frames from winning runs, tracks per-level
 * optimal block-count records, and encodes/decodes shareable `?ghost=...` payloads.
 */

import { createWorldState } from './grid.js';

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function fromBase64Url(token) {
  const padded = String(token || '')
    .replaceAll('-', '+')
    .replaceAll('_', '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(padLen));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/**
 * Builds a compact Ghost Replay descriptor from a winning interpreter run.
 */
export function extractGhostReplay(level, run) {
  if (!level || !run || run.status !== 'won') return null;
  const startState = createWorldState(level);
  const frames = [{ x: startState.robot.x, y: startState.robot.y, dir: startState.robot.dir }];

  for (const ev of run.events || []) {
    if (ev.type === 'move' || ev.type === 'slide' || ev.type === 'teleport' || ev.type === 'turn') {
      frames.push({ x: ev.x, y: ev.y, dir: ev.dir });
    }
  }

  return {
    blocks: Number(run.blockCount) || 0,
    steps: Number(run.steps) || frames.length - 1,
    frames,
  };
}

/**
 * Returns the ghost pose at a given trace event index (clamped to final frame).
 */
export function getGhostFrameAt(ghost, index = 0) {
  if (!ghost || !Array.isArray(ghost.frames) || ghost.frames.length === 0) return null;
  const idx = Math.max(0, Math.min(ghost.frames.length - 1, Math.floor(Number(index) || 0)));
  return ghost.frames[idx];
}

/**
 * Updates `progress.ghostsByLevel[levelId]` only if the new ghost uses fewer blocks
 * (or ties on blocks with fewer steps). Returns `{ progress, beatRecord }`.
 */
export function recordBestGhost(progress, levelId, ghost) {
  if (!levelId || !ghost || !Array.isArray(ghost.frames) || ghost.frames.length === 0) {
    return { progress, beatRecord: false };
  }
  const existing = progress?.ghostsByLevel?.[levelId];
  const isBetter =
    !existing ||
    ghost.blocks < existing.blocks ||
    (ghost.blocks === existing.blocks && ghost.steps < existing.steps);

  if (!isBetter) {
    return { progress, beatRecord: false };
  }

  return {
    beatRecord: Boolean(existing),
    progress: {
      ...progress,
      ghostsByLevel: {
        ...(progress?.ghostsByLevel || {}),
        [levelId]: ghost,
      },
    },
  };
}

/**
 * Encodes a Ghost Replay into a compact URL-safe token for `?custom=...&ghost=...` links.
 */
export function encodeGhostReplay(ghost) {
  if (!ghost || !Array.isArray(ghost.frames) || ghost.frames.length === 0) return '';
  const compact = {
    b: Number(ghost.blocks) || 0,
    s: Number(ghost.steps) || 0,
    f: ghost.frames.slice(0, 120).map((pt) => [pt.x, pt.y, pt.dir]),
  };
  return toBase64Url(JSON.stringify(compact));
}

/**
 * Safely decodes a `?ghost=...` token back into `{ blocks, steps, frames }`, or null if invalid.
 */
export function decodeGhostReplay(token) {
  if (!token || typeof token !== 'string' || token.length > 4096) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(token));
    if (!parsed || !Array.isArray(parsed.f) || parsed.f.length === 0 || parsed.f.length > 120) {
      return null;
    }
    const validDirs = new Set(['N', 'E', 'S', 'W']);
    const frames = [];
    for (const item of parsed.f) {
      if (!Array.isArray(item) || item.length !== 3) return null;
      const [x, y, dir] = item;
      if (!Number.isInteger(x) || !Number.isInteger(y) || !validDirs.has(dir)) return null;
      frames.push({ x, y, dir });
    }
    return {
      blocks: Math.max(0, Math.floor(Number(parsed.b) || 0)),
      steps: Math.max(0, Math.floor(Number(parsed.s) || frames.length - 1)),
      frames,
    };
  } catch {
    return null;
  }
}
