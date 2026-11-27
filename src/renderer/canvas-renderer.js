/**
 * AstroBit 60fps HTML5 Canvas 2D Space Renderer.
 * Renders planets, animated crystals/lasers/bridges/portals, expressive robot skins,
 * directional heading arrows for kids, and particle feedback.
 */

import { coordKey, isLaserActive, isBridgeActive } from '../engine/grid.js';
import { getSkinById, getWorldPalette, CHANNEL_COLORS, PORTAL_COLORS } from './robot-skins.js';
import { getDroneById } from '../engine/companions-and-hints.js';
import { ParticleSystem } from './particles.js';

const DIR_ANGLES = {
  N: -Math.PI / 2,
  E: 0,
  S: Math.PI / 2,
  W: Math.PI,
};

export function shortestAngleLerp(current, target, t) {
  let diff = ((target - current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return current + diff * t;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export class SpaceCanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = new ParticleSystem();
    this.worldState = null;
    this.worldNumber = 1;
    this.skin = getSkinById('explorer');
    this.drone = getDroneById('spark');
    this.mood = 'happy'; // 'happy' | 'excited' | 'oops' | 'thinking' | 'giggle'
    this.bumpTimer = 0;
    this.hopTimer = 0;
    this.winDanceTimer = 0;
    this.trauma = 0; // AAA camera trauma screen-shake [0..1]
    this.popups = []; // Floating world-space feedback labels (+💎, ❄️ SLIDE!, etc.)
    this.xrayEnabled = false;
    this.wayfinder = null; // Live BFS/A* wayfinder result { path, explored }
    this._fpsEstimate = 60;
    this.previewPath = [];
    this.hoveredTile = null;
    this.timeTrail = []; // ⏪ Time Machine footprints of the current timeline
    this.echoTrail = []; // 🔀 Echo of the previous timeline (for "history changed" comparison)
    this.bottomInset = 0; // Reserved px at the bottom of the board (Time Machine scrubber)
    this.rewindFx = 0; // VHS-style rewind flash timer

    // Interpolated robot visual state
    this.renderX = 0;
    this.renderY = 0;
    this.renderAngle = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.targetAngle = 0;

    // Interpolated Cosmic Twin (AstroByte) visual state for World 8
    this.hasTwin = false;
    this.byteRenderX = 0;
    this.byteRenderY = 0;
    this.byteRenderAngle = 0;
    this.byteTargetX = 0;
    this.byteTargetY = 0;
    this.byteTargetAngle = 0;

    // Holographic Ghost Replay visual state
    this.ghostPose = null;
    this.ghostRenderX = 0;
    this.ghostRenderY = 0;
    this.ghostRenderAngle = 0;

    // Layout metrics
    this.cssWidth = 560;
    this.cssHeight = 420;
    this.tileSize = 64;
    this.originX = 0;
    this.originY = 0;

    this._rafId = null;
    this._lastTime = 0;
    this._elapsed = 0;
  }

  setSkin(skinId) {
    this.skin = getSkinById(skinId);
  }

  setDrone(droneId) {
    this.drone = getDroneById(droneId);
  }

  setMood(mood) {
    this.mood = mood || 'happy';
  }

  setPreviewPath(points = [], hoveredTile = null) {
    this.previewPath = Array.isArray(points) ? points : [];
    this.hoveredTile = hoveredTile;
  }

  setXrayEnabled(enabled) {
    this.xrayEnabled = Boolean(enabled);
  }

  setWayfinder(wayfinder = null) {
    this.wayfinder = wayfinder;
  }

  /**
   * ⏪ Time Machine: footprints walked so far in the current timeline + echo of the previous one.
   */
  setTimeTrail(trail = [], echo = []) {
    this.timeTrail = Array.isArray(trail) ? trail : [];
    this.echoTrail = Array.isArray(echo) ? echo : [];
  }

  /** Reserves vertical space at the bottom of the board (e.g. for the timeline scrubber). */
  setBottomInset(px = 0) {
    const next = Math.max(0, Math.floor(Number(px) || 0));
    if (next === this.bottomInset) return;
    this.bottomInset = next;
    this._recomputeLayout();
  }

  /**
   * Swaps the displayed world for a time-travel snapshot WITHOUT snapping the robot,
   * so scrubbing glides smoothly; rewinding triggers a playful VHS rewind flash.
   */
  showTimeFrame(worldState, { direction = 1, type = 'move' } = {}) {
    if (!worldState?.robot) return;
    this.worldState = worldState;
    this.targetX = worldState.robot.x;
    this.targetY = worldState.robot.y;
    this.targetAngle = DIR_ANGLES[worldState.robot.dir] ?? 0;
    this.winDanceTimer = 0;
    this.bumpTimer = type === 'bump' ? 0.3 : 0;
    this.mood = type === 'bump' ? 'oops' : type === 'win' ? 'excited' : 'thinking';
    if (direction < 0) this.rewindFx = 0.38;
  }

  spawnPopup(gx, gy, text, color = '#facc15') {
    this.popups.push({
      x: this.tileCenterX(gx),
      y: this.tileCenterY(gy) - this.tileSize * 0.25,
      text,
      color,
      life: 0.95,
      maxLife: 0.95,
    });
  }

  setGhostPose(pose = null, snap = false) {
    if (!pose) {
      this.ghostPose = null;
      return;
    }
    const ang = DIR_ANGLES[pose.dir] ?? 0;
    if (!this.ghostPose || snap) {
      this.ghostRenderX = pose.x;
      this.ghostRenderY = pose.y;
      this.ghostRenderAngle = ang;
    }
    this.ghostPose = { x: pose.x, y: pose.y, dir: pose.dir, angle: ang };
  }

  /**
   * Returns true if a canvas-relative CSS coordinate hits the robot sprite,
   * and triggers a playful hop + sparkle burst!
   */
  tryPokeRobot(cssX, cssY) {
    if (!this.worldState) return false;
    const rx = this.tileCenterX(this.renderX);
    const ry = this.tileCenterY(this.renderY);
    const dist = Math.hypot(cssX - rx, cssY - ry);
    if (dist <= this.tileSize * 0.65) {
      this.hopTimer = 0.5;
      this.mood = 'giggle';
      this.particles.emitSparkles(rx, ry - this.tileSize * 0.25, '#f472b6', 14);
      this.particles.emitSparkles(rx, ry - this.tileSize * 0.25, '#facc15', 10);
      return true;
    }
    return false;
  }

  /**
   * Loads or resets the displayed world state (snapping robot immediately).
   */
  setWorld(worldState, worldNumber = 1) {
    this.worldState = worldState;
    this.worldNumber = worldNumber;
    this.mood = 'happy';
    this.bumpTimer = 0;
    if (worldState?.robot) {
      this.renderX = worldState.robot.x;
      this.renderY = worldState.robot.y;
      this.targetX = worldState.robot.x;
      this.targetY = worldState.robot.y;
      const ang = DIR_ANGLES[worldState.robot.dir] ?? 0;
      this.renderAngle = ang;
      this.targetAngle = ang;
    }
    if (worldState?.robots?.byte) {
      this.hasTwin = true;
      const b = worldState.robots.byte;
      this.byteRenderX = b.x;
      this.byteRenderY = b.y;
      this.byteTargetX = b.x;
      this.byteTargetY = b.y;
      const bAng = DIR_ANGLES[b.dir] ?? 0;
      this.byteRenderAngle = bAng;
      this.byteTargetAngle = bAng;
    } else {
      this.hasTwin = false;
    }
    this._recomputeLayout();
  }

  /**
   * Updates robot target smoothly and emits visual effects for an interpreter trace event.
   */
  applyTraceEvent(event) {
    if (!this.worldState || !event) return;
    if (event.astro && event.byte) {
      this.hasTwin = true;
      this.worldState.robot.x = event.astro.x;
      this.worldState.robot.y = event.astro.y;
      this.worldState.robot.dir = event.astro.dir;
      if (this.worldState.robots) {
        this.worldState.robots.astro = { ...event.astro };
        this.worldState.robots.byte = { ...event.byte };
      }
      this.targetX = event.astro.x;
      this.targetY = event.astro.y;
      this.targetAngle = DIR_ANGLES[event.astro.dir] ?? 0;
      this.byteTargetX = event.byte.x;
      this.byteTargetY = event.byte.y;
      this.byteTargetAngle = DIR_ANGLES[event.byte.dir] ?? 0;
    } else {
      this.worldState.robot.x = event.x;
      this.worldState.robot.y = event.y;
      this.worldState.robot.dir = event.dir;
      this.targetX = event.x;
      this.targetY = event.y;
      this.targetAngle = DIR_ANGLES[event.dir] ?? 0;
    }
    this.worldState.channels = { ...event.channels };
    if (Array.isArray(event.crates)) {
      this.worldState.crates = new Set(event.crates);
    }

    const px = this.tileCenterX(event.x);
    const py = this.tileCenterY(event.y);

    if (event.type === 'collect') {
      this.worldState.crystals.delete(coordKey(event.crystalX, event.crystalY));
      const pal = getWorldPalette(this.worldNumber);
      this.particles.emitSparkles(px, py, pal.crystalGlow, 22);
      this.spawnPopup(event.x, event.y, '+💎', '#7dd3fc');
      this.hopTimer = 0.25;
      this.mood = 'happy';
    } else if (event.type === 'slide') {
      this.particles.emitSparkles(px, py, '#bae6fd', 8);
      this.spawnPopup(event.x, event.y, '❄️', '#bae6fd');
      this.mood = 'excited';
    } else if (event.type === 'push_crate') {
      const cx = this.tileCenterX(event.toX);
      const cy = this.tileCenterY(event.toY);
      this.particles.emitSparkles(cx, cy, event.slid ? '#7dd3fc' : '#fbbf24', 16);
      this.trauma = Math.min(1, this.trauma + 0.32);
      this.spawnPopup(event.toX, event.toY, event.slid ? '🥌 CURL!' : '📦 PUSH!', '#fbbf24');
      this.mood = 'excited';
    } else if (event.type === 'toggle_channel') {
      const col = CHANNEL_COLORS[event.channel] || '#22d3ee';
      this.particles.emitSparkles(px, py, col, 18);
      this.spawnPopup(event.x, event.y, `🔓 ${event.channel}!`, col);
    } else if (event.type === 'teleport') {
      const col = PORTAL_COLORS[event.portalId] || '#c084fc';
      const fx = this.tileCenterX(event.fromX);
      const fy = this.tileCenterY(event.fromY);
      this.particles.emitTeleport(fx, fy, col);
      // Snap visual coordinates straight to exit portal so robot doesn't fly across the board
      this.renderX = event.x;
      this.renderY = event.y;
      this.particles.emitTeleport(px, py, col);
      this._warpBeam = { x1: fx, y1: fy, x2: px, y2: py, color: col, ttl: 0.42, maxTtl: 0.42 };
      this.trauma = Math.min(1, this.trauma + 0.38);
      this.spawnPopup(event.x, event.y, '🌀 WARP!', col);
      this.mood = 'excited';
    } else if (event.type === 'bump') {
      this.mood = 'oops';
      this.bumpTimer = 0.45;
      this.trauma = Math.min(1, this.trauma + 0.65);
      this.particles.emitBump(px, py);
      this.spawnPopup(event.x, event.y, 'BOING!', '#fb923c');
    } else if (event.type === 'wait_start') {
      this.mood = 'thinking';
      this.spawnPopup(event.x, event.y, `⏳ ${event.channel}`, CHANNEL_COLORS[event.channel] || '#facc15');
    } else if (event.type === 'wait_done') {
      this.mood = 'excited';
      this.spawnPopup(event.x, event.y, `✅ ${event.channel}!`, CHANNEL_COLORS[event.channel] || '#34d399');
    } else if (event.type === 'wait') {
      this.spawnPopup(event.x, event.y, '⏳', '#cbd5e1');
    } else if (event.type === 'deadlock') {
      this.mood = 'oops';
      this.bumpTimer = 0.5;
      this.trauma = Math.min(1, this.trauma + 0.5);
      this.spawnPopup(event.x, event.y, '🔒 DEADLOCK', '#fb7185');
    } else if (event.type === 'sensor_check') {
      this.mood = 'thinking';
    } else if (event.type === 'win') {
      this.mood = 'excited';
      this.winDanceTimer = 2.0;
      this.particles.emitConfetti(this.cssWidth, this.cssHeight, 72);
      this.spawnPopup(event.x, event.y, '🌟 3★!', '#facc15');
    } else {
      this.mood = 'happy';
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(260, Math.floor(rect.width || 560));
    const cssH = Math.max(220, Math.floor(rect.height || 400));
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);

    if (this.canvas.width !== Math.floor(cssW * dpr) || this.canvas.height !== Math.floor(cssH * dpr)) {
      this.canvas.width = Math.floor(cssW * dpr);
      this.canvas.height = Math.floor(cssH * dpr);
    }
    this.cssWidth = cssW;
    this.cssHeight = cssH;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.particles.ensureStarfield(cssW, cssH, 54);
    this._recomputeLayout();
  }

  _recomputeLayout() {
    if (!this.worldState) return;
    const pad = 28;
    const availW = Math.max(120, this.cssWidth - pad * 2);
    const usableH = Math.max(160, this.cssHeight - this.bottomInset);
    const availH = Math.max(120, usableH - pad * 2);
    this.tileSize = Math.floor(
      Math.min(availW / this.worldState.width, availH / this.worldState.height, 84)
    );
    const boardW = this.tileSize * this.worldState.width;
    const boardH = this.tileSize * this.worldState.height;
    this.originX = Math.floor((this.cssWidth - boardW) / 2);
    this.originY = Math.floor((usableH - boardH) / 2);
  }

  tileCenterX(gx) {
    return this.originX + (gx + 0.5) * this.tileSize;
  }

  tileCenterY(gy) {
    return this.originY + (gy + 0.5) * this.tileSize;
  }

  start() {
    if (this._rafId !== null) return;
    this.resize();
    this._lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - this._lastTime) / 1000);
      this._lastTime = now;
      this._elapsed += dt;
      this._update(dt);
      this.draw();
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _update(dt) {
    const smooth = 1 - Math.exp(-14 * dt);
    this.renderX += (this.targetX - this.renderX) * smooth;
    this.renderY += (this.targetY - this.renderY) * smooth;
    this.renderAngle = shortestAngleLerp(this.renderAngle, this.targetAngle, smooth);
    if (this.hasTwin) {
      this.byteRenderX += (this.byteTargetX - this.byteRenderX) * smooth;
      this.byteRenderY += (this.byteTargetY - this.byteRenderY) * smooth;
      this.byteRenderAngle = shortestAngleLerp(this.byteRenderAngle, this.byteTargetAngle, smooth);
    }
    if (this.ghostPose) {
      this.ghostRenderX += (this.ghostPose.x - this.ghostRenderX) * smooth;
      this.ghostRenderY += (this.ghostPose.y - this.ghostRenderY) * smooth;
      this.ghostRenderAngle = shortestAngleLerp(this.ghostRenderAngle, this.ghostPose.angle, smooth);
    }
    if (this.bumpTimer > 0) {
      this.bumpTimer = Math.max(0, this.bumpTimer - dt);
    }
    if (this.hopTimer > 0) {
      this.hopTimer = Math.max(0, this.hopTimer - dt);
      if (this.hopTimer === 0 && this.mood === 'giggle') {
        this.mood = 'happy';
      }
    }
    if (this.winDanceTimer > 0) {
      this.winDanceTimer = Math.max(0, this.winDanceTimer - dt);
    }
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 1.9);
    }
    if (this.rewindFx > 0) {
      this.rewindFx = Math.max(0, this.rewindFx - dt);
    }
    if (dt > 0.001) {
      this._fpsEstimate = this._fpsEstimate * 0.9 + Math.min(60, 1 / dt) * 0.1;
    }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.life -= dt;
      pop.y -= 28 * dt;
      if (pop.life <= 0) this.popups.splice(i, 1);
    }
    this.particles.update(dt);
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const pal = getWorldPalette(this.worldNumber);

    // 1. Deep space backdrop
    const grad = ctx.createLinearGradient(0, 0, 0, this.cssHeight);
    grad.addColorStop(0, pal.bgTop);
    grad.addColorStop(1, pal.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
    this.particles.drawStars(ctx, this._elapsed);

    if (!this.worldState) return;

    // AAA Camera Trauma Screen-Shake (respects prefers-reduced-motion accessibility setting!)
    const prefersReducedMotion =
      typeof globalThis.matchMedia === 'function' &&
      globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shakeMag = prefersReducedMotion ? 0 : this.trauma * this.trauma * 8;
    const shakeX = shakeMag > 0.05 ? Math.sin(this._elapsed * 65) * shakeMag : 0;
    const shakeY = shakeMag > 0.05 ? Math.cos(this._elapsed * 78) * shakeMag : 0;

    ctx.save();
    if (shakeMag > 0.05) {
      ctx.translate(shakeX, shakeY);
    }

    // 2. Grid tiles
    const ts = this.tileSize;
    for (let y = 0; y < this.worldState.height; y++) {
      for (let x = 0; x < this.worldState.width; x++) {
        const tile = this.worldState.grid[y][x];
        if (!tile || tile.type === 'void') continue;
        this._drawTile(ctx, tile, x, y, ts, pal);
      }
    }

    // 2.25 AAA Live A* Wayfinder Breadcrumbs & X-Ray Debug Overlay
    if (this.xrayEnabled || this.wayfinder?.showBreadcrumbs) {
      this._drawAaaOverlay(ctx, ts);
    }

    // 2.5 Interactive dashed path preview (while building puzzle)
    this._drawPreviewPath(ctx, ts);

    // 2.6 ⏪ Time Machine footprints (current timeline) + 🔀 echo of the previous timeline
    this._drawTimeTrails(ctx, ts);

    // 2.75 Holographic Ghost Replay Robot (if active)
    if (this.ghostPose) {
      this._drawGhostRobot(ctx, ts);
    }

    // 3. Expressive AstroBit Robot (+ Cosmic Twin AstroByte on World 8) + Floating Companion Drone
    this._drawRobot(ctx, ts);
    if (this.hasTwin) {
      this._drawTwinByte(ctx, ts);
    }
    this._drawCompanionDrone(ctx, ts);

    // 3.5 Quantum warp beam flash when teleporting through portals
    if (this._warpBeam && this._warpBeam.ttl > 0) {
      const b = this._warpBeam;
      const alpha = Math.max(0, b.ttl / b.maxTtl);
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 16;
      ctx.lineWidth = Math.max(3, ts * 0.1 * alpha);
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, ts * 0.04 * alpha);
      ctx.stroke();
      ctx.restore();
      b.ttl -= 1 / 60;
      if (b.ttl <= 0) this._warpBeam = null;
    }

    // 4. Foreground particles, floating popups & victory confetti
    this.particles.drawParticles(ctx);
    this._drawPopups(ctx);
    ctx.restore();

    // 5. VHS-style rewind flash while time-traveling backwards
    if (this.rewindFx > 0) {
      this._drawRewindFx(ctx);
    }
  }

  _drawTimeTrails(ctx, ts) {
    const strokeTrail = (trail, color, width, dash) => {
      if (trail.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      trail.forEach((pt, idx) => {
        const px = this.tileCenterX(pt.x);
        const py = this.tileCenterY(pt.y);
        if (idx === 0 || pt.teleported) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };

    if (!this.timeTrail.length && !this.echoTrail.length) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Echo of the previous timeline: faint magenta dashes
    if (this.echoTrail.length >= 2) {
      ctx.globalAlpha = 0.55;
      strokeTrail(this.echoTrail, '#e879f9', Math.max(2, ts * 0.045), [3, 7]);
      ctx.globalAlpha = 1;
    }

    // Current timeline: glowing cyan path with fading footprints (older = dimmer)
    if (this.timeTrail.length >= 2) {
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      strokeTrail(this.timeTrail, 'rgba(34, 211, 238, 0.7)', Math.max(3, ts * 0.07), []);
      ctx.shadowBlur = 0;
    }
    const n = this.timeTrail.length;
    this.timeTrail.forEach((pt, idx) => {
      const age = n > 1 ? idx / (n - 1) : 1;
      ctx.globalAlpha = 0.35 + 0.65 * age;
      ctx.fillStyle = idx === 0 ? '#facc15' : '#a5f3fc';
      ctx.beginPath();
      ctx.arc(this.tileCenterX(pt.x), this.tileCenterY(pt.y), Math.max(3, ts * (idx === 0 ? 0.09 : 0.065)), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  _drawRewindFx(ctx) {
    const alpha = Math.min(1, this.rewindFx / 0.38);
    ctx.save();
    ctx.globalAlpha = alpha * 0.18;
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
    ctx.globalAlpha = alpha * 0.22;
    ctx.fillStyle = '#0f172a';
    const offset = (this._elapsed * 120) % 6;
    for (let y = offset; y < this.cssHeight; y += 6) {
      ctx.fillRect(0, y, this.cssWidth, 2);
    }
    ctx.globalAlpha = alpha;
    ctx.font = '900 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#f5d0fe';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;
    ctx.fillText('⏪ REWIND', this.cssWidth - 14, 12);
    ctx.restore();
  }

  _drawPopups(ctx) {
    if (!this.popups.length) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 14px system-ui, -apple-system, sans-serif';
    for (const pop of this.popups) {
      const alpha = Math.max(0, pop.life / pop.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0f172a';
      ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.restore();
  }

  _drawAaaOverlay(ctx, ts) {
    const wf = this.wayfinder;
    ctx.save();

    if (this.xrayEnabled) {
      // 1. BFS/A* Explored Search Frontier Heatmap
      if (wf?.explored?.length) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        for (const cell of wf.explored) {
          ctx.fillRect(
            this.originX + cell.x * ts + 4,
            this.originY + cell.y * ts + 4,
            ts - 8,
            ts - 8
          );
        }
      }

      // 2. AABB Physics Colliders (red = solid wall/laser, amber = dynamic crate)
      ctx.lineWidth = 1.5;
      for (let y = 0; y < this.worldState.height; y++) {
        for (let x = 0; x < this.worldState.width; x++) {
          const tile = this.worldState.grid[y][x];
          const px = this.originX + x * ts + 2;
          const py = this.originY + y * ts + 2;
          if (tile?.type === 'wall' || (tile?.type === 'laser' && isLaserActive(tile, this.worldState.channels))) {
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
            ctx.strokeRect(px, py, ts - 4, ts - 4);
          } else if (this.worldState.crates?.has(coordKey(x, y))) {
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
            ctx.strokeRect(px, py, ts - 4, ts - 4);
          }
        }
      }
    }

    // 3. Holographic A* Wayfinder Path Breadcrumbs
    if (wf?.path?.length >= 2) {
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
      ctx.lineWidth = Math.max(2.5, ts * 0.055);
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -this._elapsed * 22;
      ctx.beginPath();
      wf.path.forEach((pt, idx) => {
        const cx = this.tileCenterX(pt.x);
        const cy = this.tileCenterY(pt.y);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Live AAA Engine X-Ray Telemetry Pill
    if (this.xrayEnabled) {
      const fps = Math.round(this._fpsEstimate || 60);
      const nodes = wf?.explored?.length || 0;
      const label = `⚡ AAA X-RAY · ${fps} FPS · A* ${nodes} nodes · Colliders ON`;
      ctx.font = '700 11px monospace';
      const tw = ctx.measureText(label).width + 16;
      roundRectPath(ctx, 10, 10, tw, 24, 12);
      ctx.fillStyle = 'rgba(7, 11, 30, 0.82)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#a7f3d0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 18, 22);
    }

    ctx.restore();
  }

  _drawPreviewPath(ctx, ts) {
    if (!this.previewPath || this.previewPath.length < 2) {
      if (this.hoveredTile) {
        this._drawHoveredHighlight(ctx, this.hoveredTile.x, this.hoveredTile.y, ts);
      }
      return;
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
    ctx.lineWidth = Math.max(3, ts * 0.06);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([7, 7]);
    ctx.lineDashOffset = -this._elapsed * 18;
    ctx.beginPath();
    this.previewPath.forEach((pt, idx) => {
      const px = this.tileCenterX(pt.x);
      const py = this.tileCenterY(pt.y);
      if (idx === 0 || pt.teleported) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.stroke();

    // Small numbered waypoint dots
    ctx.setLineDash([]);
    for (let i = 1; i < this.previewPath.length; i++) {
      const pt = this.previewPath[i];
      const px = this.tileCenterX(pt.x);
      const py = this.tileCenterY(pt.y);
      ctx.fillStyle = pt.bumped ? 'rgba(249, 115, 22, 0.9)' : 'rgba(250, 204, 21, 0.85)';
      ctx.beginPath();
      ctx.arc(px, py, pt.bumped ? 7 : 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (this.hoveredTile) {
      this._drawHoveredHighlight(ctx, this.hoveredTile.x, this.hoveredTile.y, ts);
    }
  }

  _drawCompanionDrone(ctx, ts) {
    if (!this.drone) return;
    const rx = this.tileCenterX(this.renderX);
    const ry = this.tileCenterY(this.renderY);
    const orbitAngle = this._elapsed * 2.1;
    const orbitR = ts * 0.44;
    const dx = rx + Math.cos(orbitAngle) * orbitR;
    const dy = ry - ts * 0.28 + Math.sin(orbitAngle * 1.4) * (ts * 0.14);
    const r = Math.max(7, ts * 0.16);

    ctx.save();
    // Soft glowing aura
    const aura = ctx.createRadialGradient(dx, dy, 1, dx, dy, r * 1.8);
    aura.addColorStop(0, `${this.drone.glow}cc`);
    aura.addColorStop(1, `${this.drone.color}00`);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(dx, dy, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Drone pod
    ctx.fillStyle = this.drone.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pet icon inside pod
    ctx.font = `${Math.max(10, Math.round(r * 1.25))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.drone.icon, dx, dy + 0.5);
    ctx.restore();
  }

  _drawGhostRobot(ctx, ts) {
    const cx = this.tileCenterX(this.ghostRenderX);
    const cy = this.tileCenterY(this.ghostRenderY);
    const bob = Math.sin(this._elapsed * 5.2) * 2.5;
    const r = ts * 0.31;

    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.globalAlpha = 0.52 + 0.12 * Math.sin(this._elapsed * 6);

    // Hologram dashed aura
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Translucent cyan chassis
    roundRectPath(ctx, -r * 0.85, -r * 0.85, r * 1.7, r * 1.7, r * 0.45);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.38)';
    ctx.fill();
    ctx.strokeStyle = '#a5f3fc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing ghost eyes
    ctx.fillStyle = '#ecfeff';
    ctx.beginPath();
    ctx.arc(-r * 0.28, -r * 0.1, Math.max(2, r * 0.14), 0, Math.PI * 2);
    ctx.arc(r * 0.28, -r * 0.1, Math.max(2, r * 0.14), 0, Math.PI * 2);
    ctx.fill();

    // Tiny ghost crown tag
    ctx.globalAlpha = 0.9;
    ctx.font = `${Math.max(10, Math.round(ts * 0.2))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👻', 0, -r * 1.25);
    ctx.restore();
  }

  _drawHoveredHighlight(ctx, gx, gy, ts) {
    const cx = this.tileCenterX(gx);
    const cy = this.tileCenterY(gy);
    const pulse = 0.92 + 0.08 * Math.sin(this._elapsed * 8);
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, ts * 0.42 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawTile(ctx, tile, gx, gy, ts, pal) {
    const px = this.originX + gx * ts;
    const py = this.originY + gy * ts;
    const inset = Math.max(2, Math.floor(ts * 0.05));
    const size = ts - inset * 2;
    const rx = px + inset;
    const ry = py + inset;
    const cx = px + ts / 2;
    const cy = py + ts / 2;

    if (tile.type === 'bridge') {
      const active = isBridgeActive(tile, this.worldState.channels);
      const chColor = CHANNEL_COLORS[tile.channel] || '#22d3ee';
      ctx.save();
      roundRectPath(ctx, rx, ry, size, size, 10);
      if (active) {
        ctx.fillStyle = `${chColor}33`;
        ctx.fill();
        ctx.strokeStyle = chColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Energy slats
        ctx.fillStyle = `${chColor}88`;
        for (let i = 1; i <= 3; i++) {
          ctx.fillRect(rx + 6, ry + (size / 4) * i - 2, size - 12, 4);
        }
      } else {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = `${chColor}66`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // Base walkable / solid tile surface
    ctx.save();
    roundRectPath(ctx, rx, ry, size, size, 10);
    if (tile.type === 'wall') {
      ctx.fillStyle = pal.wall;
      ctx.fill();
      roundRectPath(ctx, rx + 3, ry + 3, size - 6, size - 9, 8);
      ctx.fillStyle = pal.wallTop;
      ctx.fill();
      // Cute moon craters
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.arc(cx - size * 0.16, cy - size * 0.1, size * 0.13, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.18, cy + size * 0.14, size * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (tile.type === 'ice') {
      const iceGrad = ctx.createLinearGradient(rx, ry, rx + size, ry + size);
      iceGrad.addColorStop(0, '#7dd3fc');
      iceGrad.addColorStop(0.5, '#38bdf8');
      iceGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = iceGrad;
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Diagonal crystalline specular streaks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(rx + size * 0.2, ry + size * 0.42);
      ctx.lineTo(rx + size * 0.44, ry + size * 0.18);
      ctx.moveTo(rx + size * 0.46, ry + size * 0.78);
      ctx.lineTo(rx + size * 0.78, ry + size * 0.46);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = pal.floor;
      ctx.fill();
      ctx.strokeStyle = pal.floorBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Goal teleporter pad
    if (tile.type === 'goal') {
      const ready = this.worldState.crystals.size === 0;
      const glow = ready ? '#34d399' : '#64748b';
      const pulse = 0.88 + 0.12 * Math.sin(this._elapsed * 4.5);
      ctx.save();
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.34 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ready ? 'rgba(52, 211, 153, 0.28)' : 'rgba(148, 163, 184, 0.15)';
      ctx.fill();
      ctx.fillStyle = ready ? '#ecfdf5' : '#cbd5e1';
      ctx.font = `bold ${Math.floor(ts * 0.3)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', cx, cy + 1);
      ctx.restore();
    }

    // Channel switch button
    if (tile.type === 'button') {
      const col = CHANNEL_COLORS[tile.channel] || '#22d3ee';
      const pressed = Boolean(this.worldState.channels[tile.channel]);
      ctx.save();
      ctx.fillStyle = pressed ? col : `${col}44`;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pressed ? '#0f172a' : '#f8fafc';
      ctx.font = `bold ${Math.floor(ts * 0.25)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tile.channel, cx, cy + 1);
      ctx.restore();
    }

    // Channel laser barrier
    if (tile.type === 'laser') {
      const active = isLaserActive(tile, this.worldState.channels);
      const col = CHANNEL_COLORS[tile.channel] || '#fb7185';
      ctx.save();
      // Emitter sockets
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(rx + 4, cy - 5, 6, 10);
      ctx.fillRect(rx + size - 10, cy - 5, 6, 10);
      if (active) {
        const flicker = 0.75 + 0.25 * Math.sin(this._elapsed * 18);
        ctx.strokeStyle = col;
        ctx.globalAlpha = flicker;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(rx + 9, cy);
        ctx.lineTo(rx + size - 9, cy);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Paired space portal (hypnotic multi-ring wormhole vortex)
    if (tile.type === 'portal') {
      const col = PORTAL_COLORS[tile.portalId] || '#c084fc';
      const pulse = 0.88 + Math.sin(this._elapsed * 4.5 + gx + gy) * 0.12;
      ctx.save();
      ctx.translate(cx, cy);
      // Soft glowing wormhole aura
      const aura = ctx.createRadialGradient(0, 0, size * 0.04, 0, 0, size * 0.42 * pulse);
      aura.addColorStop(0, `${col}cc`);
      aura.addColorStop(0.55, `${col}44`);
      aura.addColorStop(1, `${col}00`);
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.42 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Outer swirling vortex ring
      ctx.save();
      ctx.rotate(this._elapsed * 2.4);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.34, 0, Math.PI * 1.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.34, Math.PI * 1.65, Math.PI * 1.9);
      ctx.stroke();
      ctx.restore();

      // Inner counter-rotating ring
      ctx.save();
      ctx.rotate(-this._elapsed * 3.8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.21, 0, Math.PI * 1.35);
      ctx.stroke();
      ctx.restore();

      // Portal pair number badge so kids immediately spot matching pairs
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${Math.max(10, Math.round(size * 0.21))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(tile.portalId), 0, 1);
      ctx.restore();
    }

    // Pushable energy crate ('O')
    if (this.worldState.crates?.has(coordKey(gx, gy))) {
      const padC = Math.max(4, Math.floor(size * 0.12));
      const cSize = size - padC * 2;
      const cx0 = rx + padC;
      const cy0 = ry + padC;
      const pulse = 0.7 + 0.3 * Math.sin(this._elapsed * 4.2 + gx + gy);
      ctx.save();
      roundRectPath(ctx, cx0, cy0, cSize, cSize, 7);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      // Inner metallic frame
      roundRectPath(ctx, cx0 + 4, cy0 + 4, cSize - 8, cSize - 8, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      // Glowing power core
      ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy, cSize * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(cx, cy, cSize * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating crystal gem
    if (this.worldState.crystals.has(coordKey(gx, gy))) {
      const bob = Math.sin(this._elapsed * 3.5 + gx + gy) * 3;
      const r = size * 0.26;
      ctx.save();
      ctx.translate(cx, cy + bob);
      ctx.fillStyle = pal.crystal;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.78, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.78, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = pal.crystalGlow;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.38, -r * 0.1);
      ctx.lineTo(0, r * 0.15);
      ctx.lineTo(-r * 0.38, -r * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  _drawRobot(ctx, ts) {
    const cx = this.tileCenterX(this.renderX);
    const cy = this.tileCenterY(this.renderY);
    const bob = Math.sin(this._elapsed * 4) * 2.2;
    const hop = this.hopTimer > 0 ? -Math.sin((this.hopTimer / 0.5) * Math.PI) * 18 : 0;
    const dance = this.winDanceTimer > 0 ? -Math.abs(Math.sin(this._elapsed * 11)) * 16 : 0;
    const wobble = this.bumpTimer > 0 ? Math.sin(this._elapsed * 50) * 5 : 0;
    const r = ts * 0.34;
    const skin = this.skin;

    ctx.save();
    ctx.translate(cx + wobble, cy + bob + hop + dance);

    // 1. Directional heading arrow in front of the robot (helps 5yo spatial orientation!)
    const arrowDist = r * 1.32;
    const ax = Math.cos(this.renderAngle) * arrowDist;
    const ay = Math.sin(this.renderAngle) * arrowDist;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(this.renderAngle);
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-4, -5.5);
    ctx.lineTo(-4, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Optional Space Cape behind body
    if (skin.accessory === 'cape') {
      const capeAngle = this.renderAngle + Math.PI;
      ctx.save();
      ctx.rotate(capeAngle);
      ctx.fillStyle = skin.accent;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.45);
      ctx.lineTo(r * 1.1, -r * 0.7);
      ctx.lineTo(r * 1.1, r * 0.7);
      ctx.lineTo(0, r * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Soft shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.95 - bob * 0.5, r * 0.72, r * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Antenna or Crown on top
    if (skin.accessory === 'crown') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.75);
      ctx.lineTo(-r * 0.32, -r * 1.18);
      ctx.lineTo(0, -r * 0.92);
      ctx.lineTo(r * 0.32, -r * 1.18);
      ctx.lineTo(r * 0.45, -r * 0.75);
      ctx.closePath();
      ctx.fill();
    } else {
      const stems = skin.accessory === 'dual-antenna' ? [-r * 0.32, r * 0.32] : [0];
      for (const sx of stems) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, -r * 0.72);
        ctx.lineTo(sx, -r * 1.08);
        ctx.stroke();
        ctx.fillStyle = skin.accent;
        ctx.beginPath();
        ctx.arc(sx, -r * 1.12, 3.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Rounded robot body
    roundRectPath(ctx, -r * 0.85, -r * 0.8, r * 1.7, r * 1.6, r * 0.48);
    ctx.fillStyle = skin.body;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = skin.bodyDark;
    ctx.stroke();

    // 6. Visor screen shifted slightly toward facing direction
    const lookX = Math.cos(this.renderAngle) * (r * 0.18);
    const lookY = Math.sin(this.renderAngle) * (r * 0.14);
    roundRectPath(ctx, -r * 0.58 + lookX, -r * 0.42 + lookY, r * 1.16, r * 0.74, r * 0.28);
    ctx.fillStyle = skin.visor;
    ctx.fill();

    // 7. Expressive glowing eyes
    const leftEyeX = -r * 0.24 + lookX;
    const rightEyeX = r * 0.24 + lookX;
    const eyeY = -r * 0.05 + lookY;
    ctx.fillStyle = skin.eye;
    ctx.strokeStyle = skin.eye;
    ctx.lineWidth = 2.2;

    if (this.mood === 'oops') {
      // Cute dizzy X eyes
      for (const ex of [leftEyeX, rightEyeX]) {
        ctx.beginPath();
        ctx.moveTo(ex - 4, eyeY - 4);
        ctx.lineTo(ex + 4, eyeY + 4);
        ctx.moveTo(ex + 4, eyeY - 4);
        ctx.lineTo(ex - 4, eyeY + 4);
        ctx.stroke();
      }
    } else if (this.mood === 'excited' || this.mood === 'giggle') {
      // Happy arc eyes ^ ^
      for (const ex of [leftEyeX, rightEyeX]) {
        ctx.beginPath();
        ctx.arc(ex, eyeY + 2, 4.5, Math.PI, 0);
        ctx.stroke();
      }
    } else {
      // Cute blinking round eyes
      const blink = Math.sin(this._elapsed * 1.7) > 0.97;
      const eyH = blink ? 1.2 : 4.2;
      for (const ex of [leftEyeX, rightEyeX]) {
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, 3.8, eyH, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  _drawTwinByte(ctx, ts) {
    const cx = this.tileCenterX(this.byteRenderX);
    const cy = this.tileCenterY(this.byteRenderY);
    const bob = Math.sin(this._elapsed * 4.4 + 1.2) * 2.2;
    const dance = this.winDanceTimer > 0 ? -Math.abs(Math.sin(this._elapsed * 11 + 0.8)) * 16 : 0;
    const wobble = this.bumpTimer > 0 ? Math.sin(this._elapsed * 50) * 5 : 0;
    const r = ts * 0.34;

    ctx.save();
    ctx.translate(cx + wobble, cy + bob + dance);

    // Directional heading arrow
    const arrowDist = r * 1.32;
    const ax = Math.cos(this.byteRenderAngle) * arrowDist;
    const ay = Math.sin(this.byteRenderAngle) * arrowDist;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(this.byteRenderAngle);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-4, -5.5);
    ctx.lineTo(-4, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Soft shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.95 - bob * 0.5, r * 0.72, r * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dual cute twin antennas
    for (const sx of [-r * 0.3, r * 0.3]) {
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(sx, -r * 0.72);
      ctx.lineTo(sx, -r * 1.08);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(sx, -r * 1.12, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rounded magenta chassis
    roundRectPath(ctx, -r * 0.85, -r * 0.8, r * 1.7, r * 1.6, r * 0.48);
    ctx.fillStyle = '#f472b6';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#be185d';
    ctx.stroke();

    // Visor
    const lookX = Math.cos(this.byteRenderAngle) * (r * 0.18);
    const lookY = Math.sin(this.byteRenderAngle) * (r * 0.14);
    roundRectPath(ctx, -r * 0.58 + lookX, -r * 0.42 + lookY, r * 1.16, r * 0.74, r * 0.28);
    ctx.fillStyle = '#1e1b4b';
    ctx.fill();

    // Glowing yellow eyes
    const leftEyeX = -r * 0.24 + lookX;
    const rightEyeX = r * 0.24 + lookX;
    const eyeY = -r * 0.05 + lookY;
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.2;
    if (this.mood === 'oops') {
      for (const ex of [leftEyeX, rightEyeX]) {
        ctx.beginPath();
        ctx.moveTo(ex - 4, eyeY - 4);
        ctx.lineTo(ex + 4, eyeY + 4);
        ctx.moveTo(ex + 4, eyeY - 4);
        ctx.lineTo(ex - 4, eyeY + 4);
        ctx.stroke();
      }
    } else if (this.mood === 'excited') {
      for (const ex of [leftEyeX, rightEyeX]) {
        ctx.beginPath();
        ctx.arc(ex, eyeY + 2, 4.5, Math.PI, 0);
        ctx.stroke();
      }
    } else {
      const blink = Math.sin(this._elapsed * 1.9 + 1.1) > 0.97;
      const eyH = blink ? 1.2 : 4.2;
      for (const ex of [leftEyeX, rightEyeX]) {
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, 3.8, eyH, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Tiny 'B' badge on chest so kids distinguish AstroByte immediately
    ctx.fillStyle = '#fdf2f8';
    ctx.font = `900 ${Math.max(9, Math.round(r * 0.44))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', 0, r * 0.54);

    ctx.restore();
  }
}
