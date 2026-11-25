/**
 * AstroBit 60fps Planet Biome Background & Orbital Entry/Exit Cinema Renderer.
 * Renders a unique animated landscape for each of the 7 worlds behind the planet route SVG,
 * plus atmospheric re-entry descent (LOD 3 -> LOD 0) and orbital liftoff (LOD 0 -> LOD 3)!
 */

import { getPlanetBiome, computeOrbitalTransitionState } from '../story/planet-biomes.js?v=6.1';

function drawGear(ctx, cx, cy, outerR, teeth, rot, fill, stroke) {
  const innerR = outerR * 0.78;
  const step = (Math.PI * 2) / teeth;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.25;
    const a2 = a0 + step * 0.5;
    const a3 = a0 + step * 0.75;
    if (i === 0) ctx.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    else ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
    ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    ctx.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, outerR * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export class PlanetBiomeRenderer {
  constructor(canvas, worldNumber = 1, { telemetryEl = null, lang = 'pt' } = {}) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d') || null;
    this.worldNumber = worldNumber;
    this.biome = getPlanetBiome(worldNumber);
    this.telemetryEl = telemetryEl;
    this.lang = lang;
    this._rafId = null;
    this._elapsed = 0;
    this._lastTs = 0;
    this._cssW = 760;
    this._cssH = 270;
    this._transition = null; // { phase: 'descent' | 'liftoff', elapsed, duration, onDone }

    // Pre-seed snow/stardust particles deterministically
    this._flakes = Array.from({ length: 44 }, (_, i) => ({
      x: ((i * 73.1) % 1),
      y: ((i * 41.7) % 1),
      r: 1.2 + (i % 3) * 0.9,
      vy: 0.08 + (i % 5) * 0.035,
      vx: ((i % 7) - 3) * 0.012,
    }));
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(240, Math.floor(rect.width || 760));
    const h = Math.max(120, Math.floor(rect.height || 270));
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    if (this.canvas.width !== Math.floor(w * dpr) || this.canvas.height !== Math.floor(h * dpr)) {
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
    }
    this._cssW = w;
    this._cssH = h;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  playOrbitalTransition(phase = 'descent', duration = 0.72, onDone = null) {
    this._transition = { phase, elapsed: 0, duration, onDone };
    this._updateTelemetry(phase, 0);
  }

  _updateTelemetry(phase, progress) {
    if (!this.telemetryEl) return;
    const st = computeOrbitalTransitionState(phase, progress);
    const isEn = this.lang === 'en';
    if (phase === 'surface') {
      this.telemetryEl.textContent = isEn ? this.biome.aaaTipEn : this.biome.aaaTipPt;
      return;
    }
    const label =
      phase === 'liftoff'
        ? isEn
          ? `🚀 ORBITAL LIFTOFF · ${st.lodTier} · Alt ${st.altitudeKm} km · Unloading chunks (${st.chunksLoaded}/6)`
          : `🚀 DECOLAGEM ORBITAL · ${st.lodTier} · Alt ${st.altitudeKm} km · Liberando regiões (${st.chunksLoaded}/6)`
        : isEn
        ? `☄️ ATMOSPHERIC ENTRY · ${st.lodTier} · Alt ${st.altitudeKm} km · Streaming ${st.chunksLoaded}/6 regions`
        : `☄️ ENTRADA ATMOSFÉRICA · ${st.lodTier} · Alt ${st.altitudeKm} km · Carregando ${st.chunksLoaded}/6 regiões`;
    this.telemetryEl.textContent = label;
  }

  start() {
    if (this._rafId !== null || !this.ctx || typeof requestAnimationFrame !== 'function') return;
    this.resize();
    this._lastTs = performance.now();
    this._updateTelemetry('surface', 1);

    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this._lastTs) / 1000));
      this._lastTs = now;
      this._elapsed += dt;

      if (this._transition) {
        this._transition.elapsed += dt;
        const p = Math.min(1, this._transition.elapsed / this._transition.duration);
        this._updateTelemetry(this._transition.phase, p);
        if (p >= 1) {
          const doneCb = this._transition.onDone;
          const finishedPhase = this._transition.phase;
          this._transition = null;
          if (finishedPhase === 'descent') {
            this._updateTelemetry('surface', 1);
          }
          doneCb?.();
        }
      }

      this._draw(dt);
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  destroy() {
    if (this._rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _draw(dt) {
    const ctx = this.ctx;
    const w = this._cssW;
    const h = this._cssH;
    const t = this._elapsed;
    ctx.clearRect(0, 0, w, h);

    // Subtle zoom/altitude scale during orbital entry or liftoff!
    ctx.save();
    if (this._transition) {
      const p = Math.min(1, this._transition.elapsed / this._transition.duration);
      const scale =
        this._transition.phase === 'descent'
          ? 0.86 + 0.14 * p
          : 1.0 - 0.16 * p;
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -h / 2);
    }

    switch (this.biome.kind) {
      case 'earth-orbit':
        this._drawEarthOrbit(ctx, w, h, t);
        break;
      case 'clockwork-gears':
        this._drawClockworkGears(ctx, w, h, t);
        break;
      case 'laser-belt':
        this._drawLaserBelt(ctx, w, h, t);
        break;
      case 'function-station':
        this._drawFunctionStation(ctx, w, h, t);
        break;
      case 'engineer-nebula':
        this._drawEngineerNebula(ctx, w, h, t);
        break;
      case 'wormhole-vortex':
        this._drawWormholeVortex(ctx, w, h, t);
        break;
      case 'frozen-aurora':
        this._drawFrozenAurora(ctx, w, h, t, dt);
        break;
      default:
        this._drawEarthOrbit(ctx, w, h, t);
    }
    ctx.restore();

    // Draw atmospheric re-entry / liftoff plasma streaks overlay
    if (this._transition) {
      this._drawOrbitalFx(ctx, w, h, this._transition);
    }
  }

  _drawEarthOrbit(ctx, w, h, t) {
    // Glowing blue Earth atmospheric horizon + stylized world continents (Brazil -> USA -> Europe -> Africa -> China -> Japan)
    const oceanGrad = ctx.createRadialGradient(w * 0.5, h * 1.12, h * 0.15, w * 0.5, h * 1.12, w * 0.72);
    oceanGrad.addColorStop(0, 'rgba(29, 78, 216, 0.55)');
    oceanGrad.addColorStop(0.65, 'rgba(14, 165, 233, 0.25)');
    oceanGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // Stylized glowing continent silhouettes aligned with the 6 global hubs
    const continents = [
      // South America / Brazil (left-bottom)
      { cx: w * 0.13, cy: h * 0.72, rx: w * 0.065, ry: h * 0.17, rot: 0.2 },
      // North America / USA (upper-left)
      { cx: w * 0.24, cy: h * 0.44, rx: w * 0.085, ry: h * 0.13, rot: -0.15 },
      // Europe (center-top)
      { cx: w * 0.44, cy: h * 0.42, rx: w * 0.07, ry: h * 0.1, rot: 0.1 },
      // Africa (center-bottom)
      { cx: w * 0.52, cy: h * 0.68, rx: w * 0.075, ry: h * 0.16, rot: -0.05 },
      // China / Asia (right)
      { cx: w * 0.74, cy: h * 0.48, rx: w * 0.11, ry: h * 0.15, rot: 0.08 },
      // Japan / Pacific Arc (far right)
      { cx: w * 0.89, cy: h * 0.58, rx: w * 0.032, ry: h * 0.11, rot: 0.35 },
    ];

    ctx.save();
    for (const c of continents) {
      ctx.save();
      ctx.translate(c.cx, c.cy);
      ctx.rotate(c.rot);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.24)';
      ctx.strokeStyle = 'rgba(134, 239, 172, 0.38)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Drifting translucent clouds
    ctx.fillStyle = 'rgba(224, 242, 254, 0.12)';
    for (let i = 0; i < 6; i++) {
      const cx = (((i * 170 + t * (10 + i * 2)) % (w + 140)) - 70);
      const cy = h * (0.28 + (i % 3) * 0.22);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 46 + (i % 2) * 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crescent Moon shining in upper-right sky
    ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
    ctx.beginPath();
    ctx.arc(w * 0.9, h * 0.17, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawClockworkGears(ctx, w, h, t) {
    drawGear(ctx, w * 0.16, h * 0.68, 56, 12, t * 0.45, 'rgba(217, 119, 6, 0.22)', 'rgba(251, 191, 36, 0.38)');
    drawGear(ctx, w * 0.31, h * 0.5, 42, 10, -t * 0.6, 'rgba(180, 83, 9, 0.22)', 'rgba(253, 224, 71, 0.34)');
    drawGear(ctx, w * 0.56, h * 0.7, 64, 14, t * 0.35, 'rgba(146, 64, 14, 0.25)', 'rgba(251, 191, 36, 0.36)');
    drawGear(ctx, w * 0.79, h * 0.44, 48, 11, -t * 0.52, 'rgba(217, 119, 6, 0.22)', 'rgba(251, 191, 36, 0.38)');
  }

  _drawLaserBelt(ctx, w, h, t) {
    // Sweeping neon laser beams
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const yBase = h * (0.2 + i * 0.22);
      const wave = Math.sin(t * 1.4 + i * 1.7) * 28;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(244, 114, 182, 0.28)' : 'rgba(34, 211, 238, 0.26)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, yBase + wave);
      ctx.lineTo(w, yBase - wave);
      ctx.stroke();
    }
    // Floating asteroids
    for (let i = 0; i < 7; i++) {
      const ax = w * (0.1 + i * 0.13);
      const ay = h * (0.25 + ((i * 37) % 55) / 100) + Math.sin(t * 1.5 + i) * 6;
      const ar = 10 + (i % 3) * 6;
      ctx.fillStyle = 'rgba(71, 85, 105, 0.45)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ax, ay, ar, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawFunctionStation(ctx, w, h, t) {
    // Blueprint orbital grid + pulsing data packets
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 44) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Rotating orbital station ring
    ctx.translate(w * 0.5, h * 0.52);
    ctx.rotate(t * 0.12);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.28)';
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 10]);
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.36, h * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawEngineerNebula(ctx, w, h, t) {
    // Pulsing cosmic nebula clouds + Solar Beacon rays
    const clouds = [
      { x: w * 0.22, y: h * 0.45, r: 120, col: 'rgba(168, 85, 247, 0.22)' },
      { x: w * 0.55, y: h * 0.55, r: 145, col: 'rgba(236, 72, 153, 0.18)' },
      { x: w * 0.84, y: h * 0.36, r: 115, col: 'rgba(250, 204, 21, 0.22)' },
    ];
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const pulse = 1 + 0.08 * Math.sin(t * 1.6 + i * 2);
      const g = ctx.createRadialGradient(c.x, c.y, 8, c.x, c.y, c.r * pulse);
      g.addColorStop(0, c.col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawWormholeVortex(ctx, w, h, t) {
    const centers = [
      { x: w * 0.22, y: h * 0.52, col: '#c084fc' },
      { x: w * 0.52, y: h * 0.48, col: '#38bdf8' },
      { x: w * 0.8, y: h * 0.52, col: '#f472b6' },
    ];
    for (let i = 0; i < centers.length; i++) {
      const c = centers[i];
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((i % 2 === 0 ? 1 : -1) * t * 0.9);
      for (let r = 24; r <= 72; r += 22) {
        ctx.strokeStyle = `${c.col}44`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 1.45);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawFrozenAurora(ctx, w, h, t, dt) {
    // Shimmering Aurora Borealis waves
    ctx.save();
    for (let band = 0; band < 3; band++) {
      ctx.beginPath();
      const baseY = h * (0.2 + band * 0.14);
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= w; x += 28) {
        const y = baseY + Math.sin(x * 0.012 + t * (1.2 + band * 0.3) + band) * 18;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle =
        band === 0
          ? 'rgba(52, 211, 153, 0.28)'
          : band === 1
          ? 'rgba(56, 189, 248, 0.25)'
          : 'rgba(167, 139, 250, 0.22)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Gentle falling snow particles
    ctx.fillStyle = 'rgba(224, 242, 254, 0.72)';
    for (const f of this._flakes) {
      f.y = (f.y + f.vy * dt) % 1;
      f.x = (f.x + f.vx * dt + 1) % 1;
      ctx.beginPath();
      ctx.arc(f.x * w, f.y * h, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawOrbitalFx(ctx, w, h, tr) {
    const p = Math.min(1, tr.elapsed / tr.duration);
    const alpha = Math.sin(p * Math.PI);
    const isDescent = tr.phase === 'descent';

    ctx.save();
    // Atmospheric glow ring at top/bottom edge
    const edgeGrad = ctx.createLinearGradient(0, isDescent ? 0 : h, 0, isDescent ? h * 0.55 : h * 0.45);
    edgeGrad.addColorStop(0, `${this.biome.reentryColor}66`);
    edgeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, w, h);

    // High-speed atmospheric wind streaks
    ctx.strokeStyle = isDescent ? this.biome.reentryColor : '#7dd3fc';
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 97) % w);
      const sy = ((i * 53 + p * h * (isDescent ? 1.8 : -1.8)) % h + h) % h;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy + (isDescent ? 28 : -28));
      ctx.stroke();
    }
    ctx.restore();
  }
}
