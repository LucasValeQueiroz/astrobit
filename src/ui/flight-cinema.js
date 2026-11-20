/**
 * AstroBit 60fps Flight Cinema Engine — Curved Bezier rocket flights with live plasma exhaust,
 * interactive Turbo Boost sparks, shockwave landing rings, and interplanetary Hyperspace Warp!
 */

export const ROUTE_VIEW_W = 760;
export const ROUTE_VIEW_H = 270;

/**
 * Computes the quadratic Bezier control point matching `buildSmoothRoutePath`.
 */
export function computeSegmentControlPoint(from, to, segmentIndex = 1) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const bend = segmentIndex % 2 === 0 ? -26 : 26;
  return { x: mx, y: my + bend };
}

/**
 * Samples position and tangent heading angle (in degrees) along a quadratic Bezier curve at t in [0, 1].
 */
export function sampleQuadraticBezier(p0, p1, p2, t) {
  const u = Math.max(0, Math.min(1, t));
  const inv = 1 - u;

  const x = inv * inv * p0.x + 2 * inv * u * p1.x + u * u * p2.x;
  const y = inv * inv * p0.y + 2 * inv * u * p1.y + u * u * p2.y;

  const dx = 2 * inv * (p1.x - p0.x) + 2 * u * (p2.x - p1.x);
  const dy = 2 * inv * (p1.y - p0.y) + 2 * u * (p2.y - p1.y);
  const angleDeg = Math.hypot(dx, dy) > 0.001 ? (Math.atan2(dy, dx) * 180) / Math.PI : 0;

  return { x, y, angleDeg };
}

/**
 * Generates deterministic-friendly radial hyperspace star streak descriptors.
 */
export function generateHyperspaceStars(count = 72) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + ((i * 19) % 10) * 0.04;
    const speed = 260 + ((i * 53) % 340);
    const radius = 12 + ((i * 29) % 60);
    const colors = ['#ffffff', '#7dd3fc', '#fde047', '#c084fc', '#38bdf8'];
    stars.push({
      angle,
      speed,
      radius,
      color: colors[i % colors.length],
      width: 1.5 + (i % 3) * 0.8,
    });
  }
  return stars;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Live 60fps Canvas overlay controller for the Planet Flight Map.
 */
export class FlightCinemaController {
  constructor(canvas, shipEl) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d') || null;
    this.shipEl = shipEl || null;
    this.particles = [];
    this.rings = [];
    this.activeFlight = null;
    this.warp = null;
    this._rafId = null;
    this._lastTs = 0;
    this._cssW = ROUTE_VIEW_W;
    this._cssH = ROUTE_VIEW_H;
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(200, Math.floor(rect.width || ROUTE_VIEW_W));
    const h = Math.max(100, Math.floor(rect.height || ROUTE_VIEW_H));
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    if (this.canvas.width !== Math.floor(w * dpr) || this.canvas.height !== Math.floor(h * dpr)) {
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
    }
    this._cssW = w;
    this._cssH = h;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _toPx(pt) {
    return {
      x: (pt.x / ROUTE_VIEW_W) * this._cssW,
      y: (pt.y / ROUTE_VIEW_H) * this._cssH,
    };
  }

  _ensureLoop() {
    if (this._rafId !== null || typeof requestAnimationFrame !== 'function') return;
    this.resize();
    this._lastTs = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this._lastTs) / 1000));
      this._lastTs = now;
      this._step(dt);
      this._draw();
      if (this.activeFlight || this.warp || this.particles.length > 0 || this.rings.length > 0) {
        this._rafId = requestAnimationFrame(tick);
      } else {
        this._rafId = null;
      }
    };
    this._rafId = requestAnimationFrame(tick);
  }

  emitBurst(svgPt, colors = ['#facc15', '#38bdf8', '#f97316'], count = 18) {
    const px = this._toPx(svgPt);
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 145;
      this.particles.push({
        x: px.x,
        y: px.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 2.5 + Math.random() * 4,
        life: 0.45 + Math.random() * 0.4,
        maxLife: 0.85,
        color: colors[i % colors.length],
        glow: true,
      });
    }
    this._ensureLoop();
  }

  emitRing(svgPt, color = '#38bdf8') {
    const px = this._toPx(svgPt);
    this.rings.push({
      x: px.x,
      y: px.y,
      r: 8,
      maxR: Math.max(38, this._cssW * 0.068),
      life: 0.55,
      maxLife: 0.55,
      color,
    });
    this._ensureLoop();
  }

  /**
   * Triggers a playful interactive Turbo Boost burst mid-flight when a kid taps the sky!
   */
  triggerTurboBoost() {
    if (!this.activeFlight) return false;
    this.activeFlight.turbo = Math.min(1, (this.activeFlight.turbo || 0) + 0.65);
    const pos = this.activeFlight.currentPos;
    if (pos) {
      this.emitBurst(pos, ['#facc15', '#f472b6', '#38bdf8', '#34d399', '#ffffff'], 24);
      this.emitRing(pos, '#facc15');
    }
    return true;
  }

  /**
   * Animates Starship Estrela-1 along the curved Bezier path with ignition, plasma trail, and touchdown!
   */
  flyBetweenBases({ from, to, segmentIndex = 1, accentColor = '#38bdf8', onArrive = null }) {
    if (!from || !to) return;
    const ctrl = computeSegmentControlPoint(from, to, segmentIndex);
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const duration = Math.max(0.68, Math.min(1.25, dist / 260));

    this.activeFlight = {
      from,
      ctrl,
      to,
      elapsed: 0,
      ignition: 0.14,
      duration,
      turbo: 0,
      accentColor,
      currentPos: { ...from },
      onArrive,
    };

    if (this.shipEl) {
      this.shipEl.classList.add('ship-flying');
      this.shipEl.classList.remove('ship-landing');
    }
    this.emitBurst(from, ['#fef08a', '#f97316', '#38bdf8'], 16);
    this.emitRing(from, '#f97316');
    this._ensureLoop();
  }

  /**
   * Plays an exciting 0.85s Star-Wars / Mario-Galaxy radial Hyperspace Warp tunnel!
   */
  playHyperspaceWarp({ accentColor = '#38bdf8', onDone = null } = {}) {
    this.warp = {
      elapsed: 0,
      duration: 0.82,
      accentColor,
      stars: generateHyperspaceStars(76),
      onDone,
    };
    this._ensureLoop();
  }

  _step(dt) {
    // 1. Update active curved flight
    if (this.activeFlight) {
      const fl = this.activeFlight;
      const speedMult = 1 + (fl.turbo || 0) * 0.75;
      fl.turbo = Math.max(0, (fl.turbo || 0) - dt * 1.4);
      fl.elapsed += dt * speedMult;

      if (fl.elapsed < fl.ignition) {
        // Ignition rumble on pad
        const jitterX = (Math.random() - 0.5) * 4;
        const jitterY = (Math.random() - 0.5) * 4;
        this._positionShip(fl.from.x + jitterX, fl.from.y - 26 + jitterY, -18);
      } else {
        const rawT = Math.min(1, (fl.elapsed - fl.ignition) / fl.duration);
        const eased = easeInOutCubic(rawT);
        const sample = sampleQuadraticBezier(fl.from, fl.ctrl, fl.to, eased);
        // Hover arc slightly above the base pad
        const arcLift = Math.sin(rawT * Math.PI) * 18;
        const drawY = sample.y - 24 - arcLift;
        fl.currentPos = { x: sample.x, y: drawY };
        this._positionShip(sample.x, drawY, sample.angleDeg);

        // Emit plasma exhaust puffs behind the rocket tail
        const rad = (sample.angleDeg * Math.PI) / 180;
        const tailX = sample.x - Math.cos(rad) * 20;
        const tailY = drawY - Math.sin(rad) * 20;
        const px = this._toPx({ x: tailX, y: tailY });
        const exhaustColors =
          fl.turbo > 0.1
            ? ['#facc15', '#f472b6', '#38bdf8', '#34d399']
            : ['#fef08a', '#f97316', fl.accentColor, '#ffffff'];

        for (let i = 0; i < (fl.turbo > 0.1 ? 4 : 2); i++) {
          const spread = (Math.random() - 0.5) * 0.7;
          const spd = 28 + Math.random() * 55;
          this.particles.push({
            x: px.x + (Math.random() - 0.5) * 4,
            y: px.y + (Math.random() - 0.5) * 4,
            vx: -Math.cos(rad + spread) * spd,
            vy: -Math.sin(rad + spread) * spd,
            size: 2.2 + Math.random() * 3.8,
            life: 0.34 + Math.random() * 0.25,
            maxLife: 0.58,
            color: exhaustColors[Math.floor(Math.random() * exhaustColors.length)],
            glow: true,
          });
        }

        if (rawT >= 1) {
          this._positionShip(fl.to.x, fl.to.y - 30, 0);
          if (this.shipEl) {
            this.shipEl.classList.remove('ship-flying');
          }
          this.emitRing(fl.to, '#34d399');
          this.emitBurst(fl.to, ['#facc15', '#34d399', '#38bdf8', '#ffffff'], 22);
          const doneCb = fl.onArrive;
          this.activeFlight = null;
          doneCb?.();
        }
      }
    }

    // 2. Update hyperspace warp
    if (this.warp) {
      this.warp.elapsed += dt;
      if (this.warp.elapsed >= this.warp.duration) {
        const doneCb = this.warp.onDone;
        this.warp = null;
        doneCb?.();
      }
    }

    // 3. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // 4. Update shockwave rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      const pct = 1 - Math.max(0, r.life) / r.maxLife;
      r.r = 8 + (r.maxR - 8) * pct;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
  }

  _positionShip(svgX, svgY, angleDeg) {
    if (!this.shipEl) return;
    this.shipEl.style.left = `${(svgX / ROUTE_VIEW_W) * 100}%`;
    this.shipEl.style.top = `${(svgY / ROUTE_VIEW_H) * 100}%`;
    this.shipEl.style.setProperty('--ship-rot', `${Math.round(angleDeg)}deg`);
  }

  _draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this._cssW, this._cssH);

    // Draw hyperspace tunnel overlay if active
    if (this.warp) {
      const w = this.warp;
      const t = w.elapsed / w.duration;
      const fade = t < 0.72 ? 1 : Math.max(0, (1 - t) / 0.28);
      const cx = this._cssW / 2;
      const cy = this._cssH / 2;

      ctx.save();
      ctx.fillStyle = `rgba(6, 11, 30, ${0.84 * fade})`;
      ctx.fillRect(0, 0, this._cssW, this._cssH);

      for (const s of w.stars) {
        const dist0 = s.radius + t * s.speed * 0.9;
        const streakLen = 18 + t * 92;
        const x1 = cx + Math.cos(s.angle) * dist0;
        const y1 = cy + Math.sin(s.angle) * dist0;
        const x2 = cx + Math.cos(s.angle) * (dist0 + streakLen);
        const y2 = cy + Math.sin(s.angle) * (dist0 + streakLen);
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = fade * 0.92;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Bright warp flash glow at center
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 85);
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.75 * fade})`);
      grad.addColorStop(0.45, `rgba(56, 189, 248, ${0.4 * fade})`);
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 85, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw expanding landing shockwave rings
    for (const r of this.rings) {
      const alpha = Math.max(0, r.life / r.maxLife);
      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = alpha * 0.9;
      ctx.lineWidth = 3 * alpha + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw glowing thruster particles & sparks
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size * alpha), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  destroy() {
    if (this._rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.activeFlight = null;
    this.warp = null;
    this.particles = [];
    this.rings = [];
  }
}
