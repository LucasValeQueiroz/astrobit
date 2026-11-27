/**
 * AstroBit Time Machine — Time-Travel Debugger Engine.
 * 100% pure, deterministic and DOM-free: turns an interpreter trace into an
 * immutable timeline of full world snapshots (Redux DevTools style), so kids can
 * scrub back and forth through their program, see every footprint, and compare a
 * "new timeline" against the previous one to find exactly where history changed.
 */

import { createWorldState, coordKey } from './grid.js';
import { createTwinWorld } from './twin-engine.js';

/** Event types that deserve an emoji marker on the timeline scrubber. */
export const TIMELINE_MARKER_ICONS = Object.freeze({
  collect: '💎',
  toggle_channel: '🔓',
  teleport: '🌀',
  push_crate: '📦',
  wait_start: '⏳',
  deadlock: '🔒',
  bump: '💥',
  win: '🏁',
});

const FRAME_LABELS = {
  pt: {
    start: '🚀 Início',
    move: '👣 Andou',
    turn: '↪️ Girou',
    slide: '❄️ Escorregou',
    collect: '💎 Pegou cristal',
    toggle_channel: '🔓 Apertou botão',
    teleport: '🌀 Teletransporte',
    push_crate: '📦 Empurrou bateria',
    wait: '⏳ Esperou 1 tick',
    wait_start: '⏳ Aguardando sinal',
    wait_done: '✅ Sinal recebido!',
    deadlock: '🔒 Deadlock!',
    bump: '💥 Bateu!',
    win: '🏁 Chegou!',
    sensor_yes: '❓ Sensor: SIM',
    sensor_no: '❓ Sensor: NÃO',
    call_enter: '🧩 Chamou',
    noop_action: '✋ Nada aqui',
    step: 'Passo',
  },
  en: {
    start: '🚀 Start',
    move: '👣 Moved',
    turn: '↪️ Turned',
    slide: '❄️ Slid',
    collect: '💎 Got crystal',
    toggle_channel: '🔓 Pressed button',
    teleport: '🌀 Teleported',
    push_crate: '📦 Pushed battery',
    wait: '⏳ Waited 1 tick',
    wait_start: '⏳ Waiting signal',
    wait_done: '✅ Signal received!',
    deadlock: '🔒 Deadlock!',
    bump: '💥 Bumped!',
    win: '🏁 Arrived!',
    sensor_yes: '❓ Sensor: YES',
    sensor_no: '❓ Sensor: NO',
    call_enter: '🧩 Called',
    noop_action: '✋ Nothing here',
    step: 'Step',
  },
};

/**
 * Builds an immutable timeline from a level and an `executeProgram` / `executeTwinProgram` run.
 * Frame 0 is the initial world; frame i is the world right after trace event i-1.
 * Footprints are stored once in `timeline.path`; each frame keeps `pathLength`.
 * @param {object} level
 * @param {{ status?: string, events?: Array<object> }} run
 */
export function buildTimeline(level, run) {
  const isTwin = Boolean(level?.isTwin);
  const world = isTwin ? createTwinWorld(level) : createWorldState(level);
  const crystals = new Set(world.crystals);
  const events = Array.isArray(run?.events) ? run.events : [];

  const path = [{ x: world.robot.x, y: world.robot.y, teleported: false }];
  const frames = [
    Object.freeze({
      index: 0,
      eventIndex: -1,
      type: 'start',
      robot: null,
      blockId: null,
      x: world.robot.x,
      y: world.robot.y,
      dir: world.robot.dir,
      astro: isTwin ? Object.freeze({ ...world.robots.astro }) : null,
      byte: isTwin ? Object.freeze({ ...world.robots.byte }) : null,
      crystals: Object.freeze([...crystals]),
      channels: Object.freeze({ ...world.channels }),
      crates: Object.freeze([...world.crates]),
      pathLength: 1,
      extra: null,
    }),
  ];

  events.forEach((ev, i) => {
    if (ev.type === 'collect' && Number.isFinite(ev.crystalX)) {
      crystals.delete(coordKey(ev.crystalX, ev.crystalY));
    }
    const astroPose = isTwin && ev.astro ? Object.freeze({ ...ev.astro }) : null;
    const bytePose = isTwin && ev.byte ? Object.freeze({ ...ev.byte }) : null;
    const trailX = astroPose ? astroPose.x : ev.x;
    const trailY = astroPose ? astroPose.y : ev.y;
    const last = path[path.length - 1];
    if (trailX !== last.x || trailY !== last.y) {
      path.push({ x: trailX, y: trailY, teleported: ev.type === 'teleport' });
    }
    frames.push(
      Object.freeze({
        index: i + 1,
        eventIndex: i,
        type: ev.type,
        robot: ev.robot ?? null,
        blockId: ev.blockId ?? null,
        x: astroPose ? astroPose.x : ev.x,
        y: astroPose ? astroPose.y : ev.y,
        dir: astroPose ? astroPose.dir : ev.dir,
        astro: astroPose,
        byte: bytePose,
        crystals: Object.freeze([...crystals]),
        channels: Object.freeze({ ...(ev.channels || world.channels) }),
        crates: Object.freeze(Array.isArray(ev.crates) ? [...ev.crates] : [...world.crates]),
        pathLength: path.length,
        extra:
          ev.type === 'sensor_check'
            ? { result: Boolean(ev.result) }
            : ev.type === 'call_enter'
            ? { fn: ev.fn }
            : ev.channel
            ? { channel: ev.channel }
            : null,
      })
    );
  });

  return Object.freeze({
    levelId: level?.id ?? null,
    isTwin,
    status: run?.status ?? 'incomplete',
    frames: Object.freeze(frames),
    path: Object.freeze(path.map((p) => Object.freeze(p))),
    lastIndex: frames.length - 1,
  });
}

/** Clamps any requested frame index into the timeline's valid range. */
export function clampFrameIndex(timeline, index) {
  if (!timeline?.frames?.length) return 0;
  const n = Math.floor(Number(index));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(timeline.lastIndex, n));
}

/** Returns the frame at `index` (clamped), or null for an empty timeline. */
export function getFrame(timeline, index) {
  if (!timeline?.frames?.length) return null;
  return timeline.frames[clampFrameIndex(timeline, index)];
}

/** Footprint trail walked up to (and including) the given frame. */
export function getTrailUntil(timeline, index) {
  const frame = getFrame(timeline, index);
  if (!frame) return [];
  return timeline.path.slice(0, frame.pathLength);
}

/**
 * Re-creates a fresh, mutable world state exactly as it was at `frame`
 * (crystals restored, buttons/lasers, crates and robot pose), ready for the renderer.
 */
export function materializeWorldState(level, frame) {
  const isTwin = Boolean(level?.isTwin);
  const world = isTwin ? createTwinWorld(level) : createWorldState(level);
  if (!frame) return world;
  if (isTwin && frame.astro && frame.byte) {
    world.robot = { ...frame.astro };
    world.robots = {
      astro: { ...frame.astro },
      byte: { ...frame.byte },
    };
  } else {
    world.robot = { x: frame.x, y: frame.y, dir: frame.dir };
  }
  world.crystals = new Set(frame.crystals);
  world.channels = { ...frame.channels };
  world.crates = new Set(frame.crates);
  return world;
}

/** Emoji markers for key moments, positioned in percent along the scrubber. */
export function getTimelineMarkers(timeline) {
  if (!timeline?.frames?.length || timeline.lastIndex === 0) return [];
  const markers = [];
  for (const frame of timeline.frames) {
    const icon = TIMELINE_MARKER_ICONS[frame.type];
    if (!icon) continue;
    markers.push({
      index: frame.index,
      type: frame.type,
      icon,
      pct: Math.round((frame.index / timeline.lastIndex) * 1000) / 10,
    });
  }
  return markers;
}

/**
 * Finds the first frame where two timelines diverge ("the moment history changed").
 * Compares robot pose, collected crystals and pushed crates.
 * Returns -1 when both timelines are identical.
 */
export function findTimelineDivergence(prevTimeline, nextTimeline) {
  const a = prevTimeline?.frames || [];
  const b = nextTimeline?.frames || [];
  const shared = Math.min(a.length, b.length);
  for (let i = 0; i < shared; i++) {
    const fa = a[i];
    const fb = b[i];
    if (
      fa.x !== fb.x ||
      fa.y !== fb.y ||
      fa.dir !== fb.dir ||
      fa.byte?.x !== fb.byte?.x ||
      fa.byte?.y !== fb.byte?.y ||
      fa.byte?.dir !== fb.byte?.dir ||
      fa.crystals.length !== fb.crystals.length ||
      fa.crates.join('|') !== fb.crates.join('|')
    ) {
      return i;
    }
  }
  return a.length === b.length ? -1 : shared;
}

/** Kid-friendly bilingual caption for the frame under the scrubber. */
export function describeFrame(frame, lastIndex = 0, lang = 'pt') {
  const L = FRAME_LABELS[lang === 'en' ? 'en' : 'pt'];
  if (!frame) return L.start;
  let label;
  if (frame.type === 'sensor_check') {
    label = frame.extra?.result ? L.sensor_yes : L.sensor_no;
  } else if (frame.type === 'call_enter') {
    label = `${L.call_enter} ${frame.extra?.fn || ''}`.trim();
  } else {
    label = L[frame.type] || L.move;
  }
  const robotTag = frame.robot === 'byte' ? '🩷 ' : frame.robot === 'astro' ? '🤖 ' : '';
  return `⏳ ${L.step} ${frame.index}/${Math.max(0, lastIndex)} · ${robotTag}${label}`;
}
