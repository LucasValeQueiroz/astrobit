/**
 * AstroBit 60fps HTML5 Canvas 2D Space Renderer.
 * Renders planets, animated crystals/lasers/bridges/portals, expressive robot skins,
 * directional heading arrows for kids, and particle feedback.
 */

import { coordKey, isLaserActive, isBridgeActive } from '../engine/grid.js';
import { getSkinById, getWorldPalette, CHANNEL_COLORS, PORTAL_COLORS } from './robot-skins.js';
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
    this.mood = 'happy'; // 'happy' | 'excited' | 'oops' | 'thinking' | 'giggle'
    this.bumpTimer = 0;
    this.hopTimer = 0;
    this.winDanceTimer = 0;
    this.previewPath = [];
    this.hoveredTile = null;

    // Interpolated robot visual state
    this.renderX = 0;
    this.renderY = 0;
    this.renderAngle = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.targetAngle = 0;

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

  setMood(mood) {
    this.mood = mood || 'happy';
  }

  setPreviewPath(points = [], hoveredTile = null) {
    this.previewPath = Array.isArray(points) ? points : [];
    this.hoveredTile = hoveredTile;
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
    this._recomputeLayout();
  }

  /**
   * Updates robot target smoothly and emits visual effects for an interpreter trace event.
   */
  applyTraceEvent(event) {
    if (!this.worldState || !event) return;
    this.worldState.robot.x = event.x;
    this.worldState.robot.y = event.y;
    this.worldState.robot.dir = event.dir;
    this.worldState.channels = { ...event.channels };

    this.targetX = event.x;
    this.targetY = event.y;
    this.targetAngle = DIR_ANGLES[event.dir] ?? 0;

    const px = this.tileCenterX(event.x);
    const py = this.tileCenterY(event.y);

    if (event.type === 'collect') {
      this.worldState.crystals.delete(coordKey(event.crystalX, event.crystalY));
      const pal = getWorldPalette(this.worldNumber);
      this.particles.emitSparkles(px, py, pal.crystalGlow, 22);
      this.mood = 'happy';
    } else if (event.type === 'toggle_channel') {
      const col = CHANNEL_COLORS[event.channel] || '#22d3ee';
      this.particles.emitSparkles(px, py, col, 18);
    } else if (event.type === 'teleport') {
      const col = PORTAL_COLORS[event.portalId] || '#c084fc';
      this.particles.emitTeleport(this.tileCenterX(event.fromX), this.tileCenterY(event.fromY), col);
      // Snap visual coordinates straight to exit portal so robot doesn't fly across the board
      this.renderX = event.x;
      this.renderY = event.y;
      this.particles.emitTeleport(px, py, col);
    } else if (event.type === 'bump') {
      this.mood = 'oops';
      this.bumpTimer = 0.45;
      this.particles.emitBump(px, py);
    } else if (event.type === 'sensor_check') {
      this.mood = 'thinking';
    } else if (event.type === 'win') {
      this.mood = 'excited';
      this.winDanceTimer = 2.0;
      this.particles.emitConfetti(this.cssWidth, this.cssHeight, 72);
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
    const availH = Math.max(120, this.cssHeight - pad * 2);
    this.tileSize = Math.floor(
      Math.min(availW / this.worldState.width, availH / this.worldState.height, 84)
    );
    const boardW = this.tileSize * this.worldState.width;
    const boardH = this.tileSize * this.worldState.height;
    this.originX = Math.floor((this.cssWidth - boardW) / 2);
    this.originY = Math.floor((this.cssHeight - boardH) / 2);
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

    // 2. Grid tiles
    const ts = this.tileSize;
    for (let y = 0; y < this.worldState.height; y++) {
      for (let x = 0; x < this.worldState.width; x++) {
        const tile = this.worldState.grid[y][x];
        if (!tile || tile.type === 'void') continue;
        this._drawTile(ctx, tile, x, y, ts, pal);
      }
    }

    // 2.5 Interactive dashed path preview (while building puzzle)
    this._drawPreviewPath(ctx, ts);

    // 3. Expressive AstroBit Robot
    this._drawRobot(ctx, ts);

    // 4. Foreground particles & victory confetti
    this.particles.drawParticles(ctx);
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

    ctx.fillStyle = pal.floor;
    ctx.fill();
    ctx.strokeStyle = pal.floorBorder;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

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

    // Paired space portal
    if (tile.type === 'portal') {
      const col = PORTAL_COLORS[tile.portalId] || '#c084fc';
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this._elapsed * 2.2);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.32, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.rotate(-this._elapsed * 4.4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.18, 0, Math.PI * 1.3);
      ctx.stroke();
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
}
