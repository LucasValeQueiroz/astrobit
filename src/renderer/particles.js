/**
 * Lightweight space particle & starfield system for 60fps Canvas 2D feedback.
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.stars = [];
    this.starWidth = 0;
    this.starHeight = 0;
  }

  ensureStarfield(width, height, count = 48) {
    if (this.starWidth === width && this.starHeight === height && this.stars.length > 0) {
      return;
    }
    this.starWidth = width;
    this.starHeight = height;
    this.stars = [];
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random distribution so starfield never flickers on resize
      const seed = (i + 1) * 9301 + 49297;
      const rx = ((seed * 17) % 1000) / 1000;
      const ry = ((seed * 31) % 1000) / 1000;
      this.stars.push({
        x: rx * width,
        y: ry * height,
        radius: 0.9 + ((i * 7) % 15) * 0.12,
        phase: (i * 0.73) % (Math.PI * 2),
        speed: 1.2 + (i % 4) * 0.6,
      });
    }
  }

  emitSparkles(x, y, color = '#7dd3fc', count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const speed = 55 + Math.random() * 115;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.3,
        gravity: 40,
        shape: 'star',
      });
    }
  }

  emitTeleport(x, y, color = '#c084fc') {
    this.emitSparkles(x, y, color, 20);
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 12,
      maxSize: 52,
      color,
      life: 0,
      maxLife: 0.42,
      gravity: 0,
      shape: 'ring',
    });
  }

  emitBump(x, y) {
    this.emitSparkles(x, y, '#fde047', 10);
  }

  emitConfetti(width, height, count = 64) {
    const colors = ['#38bdf8', '#fbbf24', '#34d399', '#f472b6', '#c084fc', '#fb7185'];
    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0;
      this.particles.push({
        x: fromLeft ? width * 0.2 : width * 0.8,
        y: height * 0.75,
        vx: (fromLeft ? 1 : -1) * (80 + Math.random() * 220),
        vy: -(180 + Math.random() * 260),
        size: 5 + Math.random() * 5,
        color: colors[i % colors.length],
        life: 0,
        maxLife: 1.1 + Math.random() * 0.7,
        gravity: 340,
        shape: 'confetti',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
      });
    }
  }

  update(dt) {
    const safeDt = Math.min(0.05, Math.max(0, dt));
    const alive = [];
    for (const p of this.particles) {
      p.life += safeDt;
      if (p.life >= p.maxLife) continue;
      p.vy += (p.gravity || 0) * safeDt;
      p.x += p.vx * safeDt;
      p.y += p.vy * safeDt;
      if (p.rotation !== undefined) {
        p.rotation += p.vRot * safeDt;
      }
      alive.push(p);
    }
    this.particles = alive;
  }

  drawStars(ctx, timeSec) {
    ctx.save();
    for (const s of this.stars) {
      const alpha = 0.28 + 0.55 * (0.5 + 0.5 * Math.sin(timeSec * s.speed + s.phase));
      ctx.fillStyle = `rgba(226, 232, 240, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      const alpha = Math.max(0, 1 - progress);
      ctx.globalAlpha = alpha;

      if (p.shape === 'ring') {
        const radius = p.size + (p.maxSize - p.size) * progress;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * (1 - progress) + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * (1 - progress * 0.6)), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
