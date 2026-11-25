/**
 * AstroBit 60fps Planet Biome Landscape & 3-Act AAA Orbital Cinema Renderer.
 * - Renders rich, unique 60fps scenery for all 7 planets (recognizable Earth continents
 *   with twinkling city lights & orbiting satellite on World 1, clockwork foundry on World 2,
 *   laser canyon on World 3, data-stream orbital ring on World 4, Solar Beacon nebula on World 5,
 *   quantum wormhole arcs on World 6, and crystalline mountains + Aurora Borealis + snow on World 7).
 * - Renders true 3-Act Orbital Transitions:
 *   1. Liftoff: surface shrinks into a spinning 3D planet globe (LOD 0 -> LOD 3).
 *   2. 3D Globe Approach & Atmospheric Re-entry: distant planet grows into view (LOD 3 -> LOD 1)
 *      with glowing 1,650 °C plasma heat-shield arc and speed streaks, then reveals LOD 0 surface!
 */

import { getPlanetBiome, computeOrbitalTransitionState } from '../story/planet-biomes.js?v=6.2';

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
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPolygon(ctx, pts, w, h) {
  ctx.beginPath();
  pts.forEach(([nx, ny], idx) => {
    const px = nx * w;
    const py = ny * h;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
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

    this._flakes = Array.from({ length: 48 }, (_, i) => ({
      x: (i * 73.1) % 1,
      y: (i * 41.7) % 1,
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

  playOrbitalTransition(phase = 'descent', duration = 1.05, onDone = null) {
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
          ? `🚀 ORBITAL LIFTOFF · ${st.lodTier} · Alt ${st.altitudeKm} km · Chunks ${st.chunksLoaded}/6`
          : `🚀 DECOLAGEM ORBITAL · ${st.lodTier} · Alt ${st.altitudeKm} km · Regiões ${st.chunksLoaded}/6`
        : isEn
        ? `☄️ RE-ENTRY · ${st.lodTier} · Alt ${st.altitudeKm} km · 🔥 Shield ${st.shieldTempC}°C · Chunks ${st.chunksLoaded}/6`
        : `☄️ REENTRADA · ${st.lodTier} · Alt ${st.altitudeKm} km · 🔥 Escudo ${st.shieldTempC}°C · Regiões ${st.chunksLoaded}/6`;
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

    // Draw full planet biome surface (fading in/out smoothly during 3D globe transition)
    let surfaceAlpha = 1;
    let surfaceScale = 1;
    if (this._transition) {
      const p = Math.min(1, this._transition.elapsed / this._transition.duration);
      if (this._transition.phase === 'descent') {
        surfaceAlpha = Math.max(0, Math.min(1, (p - 0.35) / 0.55));
        surfaceScale = 0.8 + 0.2 * p;
      } else {
        surfaceAlpha = Math.max(0, Math.min(1, 1 - p * 1.4));
        surfaceScale = 1 - 0.22 * p;
      }
    }

    if (surfaceAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = surfaceAlpha;
      if (surfaceScale !== 1) {
        ctx.translate(w / 2, h / 2);
        ctx.scale(surfaceScale, surfaceScale);
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
    }

    // 3D Planet Globe Approach + Thermal Plasma Re-entry Shield!
    if (this._transition) {
      this._drawOrbitalGlobeCinema(ctx, w, h, this._transition, t);
    }
  }

  _drawEarthOrbit(ctx, w, h, t) {
    // Deep ocean glow + atmospheric limb
    const oceanGrad = ctx.createRadialGradient(w * 0.5, h * 1.15, h * 0.15, w * 0.5, h * 1.15, w * 0.78);
    oceanGrad.addColorStop(0, 'rgba(29, 78, 216, 0.62)');
    oceanGrad.addColorStop(0.62, 'rgba(14, 165, 233, 0.26)');
    oceanGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // Recognizable stylized world continent polygons!
    const continentPolys = [
      // South America (Brazil!)
      [[0.07, 0.58], [0.14, 0.53], [0.19, 0.62], [0.17, 0.77], [0.12, 0.92], [0.09, 0.78]],
      // North America (USA!)
      [[0.14, 0.22], [0.28, 0.18], [0.33, 0.34], [0.27, 0.48], [0.19, 0.45], [0.13, 0.34]],
      // Europe
      [[0.38, 0.22], [0.49, 0.2], [0.53, 0.34], [0.46, 0.42], [0.39, 0.38]],
      // Africa
      [[0.42, 0.48], [0.54, 0.47], [0.59, 0.6], [0.54, 0.85], [0.47, 0.86], [0.43, 0.65]],
      // Asia / China
      [[0.57, 0.22], [0.78, 0.2], [0.84, 0.38], [0.78, 0.58], [0.64, 0.56], [0.57, 0.4]],
      // Japan archipelago
      [[0.86, 0.36], [0.91, 0.34], [0.93, 0.48], [0.89, 0.57], [0.85, 0.49]],
    ];

    ctx.save();
    for (const poly of continentPolys) {
      drawPolygon(ctx, poly, w, h);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.26)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(134, 239, 172, 0.44)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // Twinkling golden city lights across Brazil, USA, Europe, Africa, China & Japan
    const cities = [
      [0.13, 0.69], [0.15, 0.64], [0.23, 0.36], [0.27, 0.39],
      [0.44, 0.32], [0.48, 0.35], [0.51, 0.56], [0.52, 0.72],
      [0.72, 0.42], [0.76, 0.47], [0.89, 0.45], [0.88, 0.51],
    ];
    cities.forEach(([cx, cy], idx) => {
      const pulse = 0.45 + 0.55 * Math.sin(t * 3.2 + idx * 1.4);
      ctx.fillStyle = `rgba(253, 224, 71, ${pulse})`;
      ctx.beginPath();
      ctx.arc(cx * w, cy * h, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Orbiting mini-satellite gliding across upper orbit
    const satX = ((t * 34) % (w + 60)) - 30;
    const satY = h * 0.14 + Math.sin(satX * 0.01) * 8;
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(satX - 3, satY - 2, 6, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(satX - 10, satY - 1.5, 6, 3);
    ctx.fillRect(satX + 4, satY - 1.5, 6, 3);

    // Drifting translucent clouds
    ctx.fillStyle = 'rgba(224, 242, 254, 0.13)';
    for (let i = 0; i < 6; i++) {
      const cx = (((i * 170 + t * (10 + i * 2)) % (w + 140)) - 70);
      const cy = h * (0.26 + (i % 3) * 0.22);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 48 + (i % 2) * 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing Moon in upper-right sky
    const moonGrad = ctx.createRadialGradient(w * 0.92, h * 0.16, 4, w * 0.92, h * 0.16, 28);
    moonGrad.addColorStop(0, 'rgba(254, 249, 195, 0.48)');
    moonGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(w * 0.92, h * 0.16, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawClockworkGears(ctx, w, h, t) {
    // Steampunk foundry horizon silhouette
    ctx.fillStyle = 'rgba(69, 26, 3, 0.35)';
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
    drawGear(ctx, w * 0.15, h * 0.68, 58, 12, t * 0.45, 'rgba(217, 119, 6, 0.24)', 'rgba(251, 191, 36, 0.42)');
    drawGear(ctx, w * 0.31, h * 0.5, 44, 10, -t * 0.62, 'rgba(180, 83, 9, 0.24)', 'rgba(253, 224, 71, 0.36)');
    drawGear(ctx, w * 0.56, h * 0.72, 66, 14, t * 0.36, 'rgba(146, 64, 14, 0.28)', 'rgba(251, 191, 36, 0.4)');
    drawGear(ctx, w * 0.8, h * 0.46, 50, 11, -t * 0.54, 'rgba(217, 119, 6, 0.24)', 'rgba(251, 191, 36, 0.42)');
  }

  _drawLaserBelt(ctx, w, h, t) {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const yBase = h * (0.2 + i * 0.22);
      const wave = Math.sin(t * 1.5 + i * 1.7) * 28;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(244, 114, 182, 0.32)' : 'rgba(34, 211, 238, 0.28)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, yBase + wave);
      ctx.lineTo(w, yBase - wave);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const ax = w * (0.08 + i * 0.12);
      const ay = h * (0.24 + ((i * 37) % 55) / 100) + Math.sin(t * 1.6 + i) * 6;
      const ar = 10 + (i % 3) * 6;
      ctx.fillStyle = 'rgba(71, 85, 105, 0.48)';
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.38)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ax, ay, ar, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawFunctionStation(ctx, w, h, t) {
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.13)';
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
    // Glowing data packets moving along horizontal rails
    for (let i = 0; i < 5; i++) {
      const px = ((t * (70 + i * 18) + i * 150) % (w + 40)) - 20;
      const py = 44 * (i + 1);
      ctx.fillStyle = 'rgba(52, 211, 153, 0.65)';
      ctx.fillRect(px, py - 2, 16, 4);
    }
    ctx.translate(w * 0.5, h * 0.52);
    ctx.rotate(t * 0.14);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.32)';
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 10]);
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.36, h * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawEngineerNebula(ctx, w, h, t) {
    const clouds = [
      { x: w * 0.22, y: h * 0.45, r: 125, col: 'rgba(168, 85, 247, 0.24)' },
      { x: w * 0.54, y: h * 0.55, r: 150, col: 'rgba(236, 72, 153, 0.2)' },
      { x: w * 0.88, y: h * 0.34, r: 130, col: 'rgba(250, 204, 21, 0.28)' },
    ];
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const pulse = 1 + 0.09 * Math.sin(t * 1.7 + i * 2);
      const g = ctx.createRadialGradient(c.x, c.y, 8, c.x, c.y, c.r * pulse);
      g.addColorStop(0, c.col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    // Rotating Solar Beacon volumetric beam from right
    ctx.save();
    ctx.translate(w * 0.9, h * 0.36);
    ctx.rotate(Math.sin(t * 0.7) * 0.32 - 0.15);
    const beam = ctx.createLinearGradient(0, 0, -w * 0.55, 0);
    beam.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
    beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-w * 0.55, -62);
    ctx.lineTo(-w * 0.55, 62);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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
      ctx.rotate((i % 2 === 0 ? 1 : -1) * t * 0.95);
      for (let r = 24; r <= 74; r += 22) {
        ctx.strokeStyle = `${c.col}4c`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 1.45);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawFrozenAurora(ctx, w, h, t, dt) {
    ctx.save();
    // 3-layer Aurora Borealis
    for (let band = 0; band < 3; band++) {
      ctx.beginPath();
      const baseY = h * (0.18 + band * 0.13);
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= w; x += 26) {
        const y = baseY + Math.sin(x * 0.012 + t * (1.2 + band * 0.3) + band) * 18;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle =
        band === 0
          ? 'rgba(52, 211, 153, 0.3)'
          : band === 1
          ? 'rgba(56, 189, 248, 0.28)'
          : 'rgba(167, 139, 250, 0.24)';
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Crystalline glacier mountain range along lower horizon
    drawPolygon(
      ctx,
      [[0, 1], [0, 0.8], [0.14, 0.66], [0.27, 0.82], [0.43, 0.62], [0.6, 0.8], [0.76, 0.64], [0.9, 0.78], [1, 0.7], [1, 1]],
      w,
      h
    );
    ctx.fillStyle = 'rgba(125, 211, 252, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Gentle falling snow particles
    ctx.fillStyle = 'rgba(224, 242, 254, 0.78)';
    for (const f of this._flakes) {
      f.y = (f.y + f.vy * dt) % 1;
      f.x = (f.x + f.vx * dt + 1) % 1;
      ctx.beginPath();
      ctx.arc(f.x * w, f.y * h, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Draws a 3D spinning planet globe (shrinking on liftoff, growing on descent)
   * + fiery plasma re-entry heat-shield arc and high-speed atmospheric wind streaks!
   */
  _drawOrbitalGlobeCinema(ctx, w, h, tr, t) {
    const p = Math.min(1, tr.elapsed / tr.duration);
    const st = computeOrbitalTransitionState(tr.phase, p);
    const isDescent = tr.phase === 'descent';
    const cx = w * 0.5;
    const cy = h * 0.5;

    // 1. 3D Planet Globe (visible mostly during early descent / late liftoff)
    const globeAlpha = isDescent
      ? Math.max(0, Math.min(1, 1 - (p - 0.55) / 0.38))
      : Math.max(0, Math.min(1, (p - 0.12) / 0.4));

    if (globeAlpha > 0.02) {
      const r = Math.max(22, Math.min(w, h) * 0.44 * st.globeRadiusFactor);
      ctx.save();
      ctx.globalAlpha = globeAlpha;

      // Outer atmospheric halo
      const halo = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r * 1.45);
      halo.addColorStop(0, `${this.biome.atmosphereColor}88`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
      ctx.fill();

      // Shaded 3D sphere body
      const sphereGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      sphereGrad.addColorStop(0, this.biome.planetRim || this.biome.atmosphereColor);
      sphereGrad.addColorStop(0.65, this.biome.planetCore || '#1d4ed8');
      sphereGrad.addColorStop(1, '#050816');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Rotating latitude/cloud band inside clipped sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      const spinOffset = ((t * 55) % (r * 2)) - r;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.ellipse(cx + spinOffset, cy - r * 0.25, r * 0.65, r * 0.16, -0.12, 0, Math.PI * 2);
      ctx.ellipse(cx - spinOffset * 0.8, cy + r * 0.28, r * 0.55, r * 0.14, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // LOD wireframe ring showing AAA Engine LOD tier visually!
      ctx.strokeStyle = `${this.biome.atmosphereColor}aa`;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 2. Fiery Plasma Heat-Shield Arc during Atmospheric Re-entry!
    const fxAlpha = Math.sin(p * Math.PI);
    ctx.save();
    ctx.globalAlpha = fxAlpha;
    if (isDescent) {
      const shieldGrad = ctx.createRadialGradient(cx, h * 0.92, 10, cx, h * 0.92, w * 0.48);
      shieldGrad.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
      shieldGrad.addColorStop(0.45, `${this.biome.reentryColor}66`);
      shieldGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shieldGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // High-speed atmospheric wind streaks
    ctx.strokeStyle = isDescent ? this.biome.reentryColor : '#7dd3fc';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 22; i++) {
      const sx = (i * 89) % w;
      const sy = (((i * 53 + p * h * (isDescent ? 2.1 : -2.1)) % h) + h) % h;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy + (isDescent ? 34 : -34));
      ctx.stroke();
    }
    ctx.restore();
  }
}
