/**
 * AstroBit AAA Game Engineering Lab — Interactive 60fps Canvas Modal.
 * Lets kids and curious minds experiment directly with real blockbuster game-engine
 * optimizations (Culling, LOD, Open-World Streaming, AI LOD, Hybrid Fluids, Ray Tracing, AI Upscaling).
 */

import {
  ENGINE_LAB_TOPICS,
  evaluateFrustumAndOcclusion,
  selectLodTier,
  computeStreamingChunks,
  evaluateAiLodAgents,
  evaluateHybridFluidWave,
  evaluateRayTracingBvh,
  evaluateAiUpscaling,
} from '../engine/engine-lab-sim.js?v=5.4';

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderEngineLabModal(container, { lang = 'pt', synth = null, onTopicExplored, onClose } = {}) {
  if (!container) return;
  const isEn = lang === 'en';

  let activeTopicId = ENGINE_LAB_TOPICS[0].id;
  let trickEnabled = true;
  let rafId = null;
  let elapsed = 0;
  let lastTs = 0;

  // Interactive pointer states per demo
  const pointer = { x: 0.72, y: 0.45, vx: 1, vy: 0 };
  let lodDist = 0.25;
  let shipPos = { x: 0.5, y: 0.5, vx: 0.25, vy: 0.05 };

  // Deterministic asteroid field for Demo 1 (Culling)
  const asteroids = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.17;
    const dist = 85 + ((i * 53) % 210);
    return {
      id: i,
      x: 270 + Math.cos(angle) * dist,
      y: 155 + Math.sin(angle) * (dist * 0.58),
      r: 7 + (i % 4) * 2.5,
    };
  });

  // Deterministic space-bot swarm for Demo 4 (AI LOD)
  const aiBots = Array.from({ length: 26 }, (_, i) => ({
    id: i,
    baseX: 48 + ((i * 79) % 444),
    baseY: 42 + ((i * 53) % 226),
    phase: i * 0.7,
  }));

  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const getTopic = () => ENGINE_LAB_TOPICS.find((t) => t.id === activeTopicId) || ENGINE_LAB_TOPICS[0];

  const renderShell = () => {
    const topic = getTopic();
    const tabsHtml = ENGINE_LAB_TOPICS.map(
      (tp) => `
        <button
          type="button"
          class="lab-tab ${tp.id === activeTopicId ? 'active' : ''}"
          data-lab-topic="${tp.id}"
        >
          <span>${tp.icon}</span>
          <span>${tp.num}. ${escapeHtml(isEn ? tp.titleEn : tp.titlePt)}</span>
        </button>
      `
    ).join('');

    container.innerHTML = `
      <div class="modal-card modal-wide engine-lab-modal">
        <div class="modal-head">
          <div>
            <h2>🧪 ${isEn ? 'AAA Game Engineering Lab' : 'Laboratório de Games AAA'}</h2>
            <p class="modal-sub">
              ${
                isEn
                  ? 'Play with the real tricks blockbuster games use to run fast on limited memory, CPU/GPU, and battery!'
                  : 'Brinque com os segredos reais que os grandes jogos usam para rodar rápido dentro dos limites de memória, CPU/GPU e energia!'
              }
            </p>
          </div>
          <button type="button" class="icon-btn" data-lab-close="true" aria-label="Close">✕</button>
        </div>

        <div class="lab-tabs">${tabsHtml}</div>

        <div class="lab-body">
          <div class="lab-stage-wrap">
            <canvas id="engine-lab-canvas" class="engine-lab-canvas" width="540" height="310"></canvas>
            <div class="lab-tip">${escapeHtml(isEn ? topic.tipEn : topic.tipPt)}</div>
          </div>

          <div class="lab-sidebar">
            <span class="lab-term-pill">⚙️ ${escapeHtml(topic.term)}</span>
            <h3 class="lab-topic-title">${topic.icon} ${escapeHtml(isEn ? topic.titleEn : topic.titlePt)}</h3>
            <p class="lab-kid-copy">${escapeHtml(isEn ? topic.kidEn : topic.kidPt)}</p>
            <p class="lab-pro-copy">💡 ${escapeHtml(isEn ? topic.proEn : topic.proPt)}</p>

            <button
              type="button"
              id="lab-toggle-trick"
              class="btn ${trickEnabled ? 'btn-run' : 'btn-secondary'} lab-toggle-btn"
            >
              ${
                trickEnabled
                  ? isEn
                    ? '⚡ Optimization: ON'
                    : '⚡ Truque AAA: LIGADO'
                  : isEn
                  ? '🐢 Optimization: OFF'
                  : '🐢 Truque AAA: DESLIGADO'
              }
            </button>

            <div class="lab-meters" id="lab-meters">
              <div class="lab-meter">
                <span>⚡ FPS</span>
                <strong id="lab-fps-val">60</strong>
              </div>
              <div class="lab-meter">
                <span id="lab-mem-label">🧠 GPU / VRAM</span>
                <strong id="lab-mem-val">24%</strong>
              </div>
              <div class="lab-meter">
                <span>🔋 ${isEn ? 'Energy' : 'Energia'}</span>
                <strong id="lab-energy-val">26%</strong>
              </div>
            </div>
            <div class="lab-extra-stat" id="lab-extra-stat"></div>
          </div>
        </div>
      </div>
    `;

    container.classList.remove('hidden');
    onTopicExplored?.(activeTopicId);

    const canvas = container.querySelector('#engine-lab-canvas');
    const updatePointerFromEvent = (ev) => {
      const rect = canvas.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (ev.clientX - rect.left) / Math.max(1, rect.width)));
      const ny = Math.max(0, Math.min(1, (ev.clientY - rect.top) / Math.max(1, rect.height)));
      pointer.vx = nx - pointer.x;
      pointer.vy = ny - pointer.y;
      pointer.x = nx;
      pointer.y = ny;
      if (activeTopicId === 'lod') {
        lodDist = nx;
      } else if (activeTopicId === 'streaming') {
        shipPos.vx = nx - shipPos.x;
        shipPos.vy = ny - shipPos.y;
        shipPos.x = nx;
        shipPos.y = ny;
      }
    };

    canvas.addEventListener('pointermove', updatePointerFromEvent);
    canvas.addEventListener('pointerdown', updatePointerFromEvent);

    container.onclick = (event) => {
      if (event.target === container || event.target.closest('[data-lab-close]')) {
        stopLoop();
        container.classList.add('hidden');
        onClose?.();
        return;
      }
      const tab = event.target.closest('[data-lab-topic]');
      if (tab) {
        synth?.playClick?.();
        activeTopicId = tab.dataset.labTopic;
        renderShell();
        return;
      }
      if (event.target.closest('#lab-toggle-trick')) {
        trickEnabled = !trickEnabled;
        synth?.playSnap?.();
        renderShell();
      }
    };
  };

  const updateMeters = ({ fps, memLabel, memVal, energyPct, extra }) => {
    const fpsEl = container.querySelector('#lab-fps-val');
    const memLblEl = container.querySelector('#lab-mem-label');
    const memEl = container.querySelector('#lab-mem-val');
    const engEl = container.querySelector('#lab-energy-val');
    const extraEl = container.querySelector('#lab-extra-stat');
    if (fpsEl) {
      fpsEl.textContent = `${fps} FPS`;
      fpsEl.style.color = fps >= 50 ? '#4ade80' : '#fb7185';
    }
    if (memLblEl && memLabel) memLblEl.textContent = memLabel;
    if (memEl) {
      memEl.textContent = memVal;
      memEl.style.color = trickEnabled ? '#38bdf8' : '#fb923c';
    }
    if (engEl) {
      engEl.textContent = `${energyPct}%`;
      engEl.style.color = energyPct <= 55 ? '#4ade80' : '#f43f5e';
    }
    if (extraEl) extraEl.textContent = extra || '';
  };

  const drawCulling = (ctx, w, h) => {
    const camX = 72;
    const camY = h / 2;
    const targetX = pointer.x * w;
    const targetY = pointer.y * h;
    const camAngle = Math.atan2(targetY - camY, Math.max(30, targetX - camX));
    const fov = Math.PI / 2.7;
    const maxDist = 420;
    const occluder = { x: 255, y: h / 2, r: 42 };

    const res = evaluateFrustumAndOcclusion({
      camX,
      camY,
      camAngle,
      fovRad: fov,
      maxDist,
      occluder,
      entities: asteroids,
      cullingEnabled: trickEnabled,
    });

    // Camera frustum cone
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(camX, camY);
    ctx.arc(camX, camY, maxDist, camAngle - fov / 2, camAngle + fov / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Occlusion shadow behind the Moon
    const occAngle = Math.atan2(occluder.y - camY, occluder.x - camX);
    const occDist = Math.hypot(occluder.x - camX, occluder.y - camY);
    const occSpan = Math.asin(Math.min(0.95, occluder.r / occDist));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.beginPath();
    ctx.moveTo(occluder.x, occluder.y);
    ctx.arc(camX, camY, maxDist, occAngle - occSpan, occAngle + occSpan);
    ctx.closePath();
    ctx.fill();

    // Draw entities
    for (const a of res.entities) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      if (a.status === 'visible') {
        ctx.fillStyle = '#fde047';
        ctx.fill();
      } else if (!trickEnabled) {
        ctx.fillStyle = '#fb7185';
        ctx.fill();
      } else {
        ctx.strokeStyle = a.status === 'occluded' ? 'rgba(244, 114, 182, 0.45)' : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Moon occluder
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(occluder.x, occluder.y, occluder.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isEn ? 'MOON' : 'LUA', occluder.x, occluder.y + 4);

    // Camera ship
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(camX, camY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('🚀', camX, camY + 5);
    ctx.restore();

    updateMeters({
      fps: res.stats.fps,
      memLabel: '🧠 GPU',
      memVal: `${res.stats.gpuPct}%`,
      energyPct: res.stats.energyPct,
      extra: isEn
        ? `Drawn: ${res.stats.drawn}/${res.stats.total} · Frustum cut: ${res.stats.frustumCulled} · Occluded: ${res.stats.occluded}`
        : `Desenhados: ${res.stats.drawn}/${res.stats.total} · Fora do cone: ${res.stats.frustumCulled} · Atrás da lua: ${res.stats.occluded}`,
    });
  };

  const drawLod = (ctx, w, h) => {
    const lod = selectLodTier(lodDist, trickEnabled);
    const px = 90 + lodDist * (w - 170);
    const py = h / 2;
    const radius = Math.max(16, 76 - lodDist * 56);

    // Distance ruler
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(60, h - 42);
    ctx.lineTo(w - 50, h - 42);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText(isEn ? '📷 CLOSE' : '📷 PERTO', 48, h - 22);
    ctx.fillText(isEn ? 'FAR 🌌' : 'LONGE 🌌', w - 92, h - 22);

    // Draw polygon planet with `lod.sides` vertices
    ctx.translate(px, py);
    ctx.rotate(elapsed * 0.5);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = lod.tier === 'LOD0' ? '#38bdf8' : lod.tier === 'LOD1' ? '#a78bfa' : '#4ade80';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= lod.sides; i++) {
      const a = (i / lod.sides) * Math.PI * 2;
      const vx = Math.cos(a) * radius;
      const vy = Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw wireframe spokes to visualize polygon density!
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    const step = Math.max(1, Math.floor(lod.sides / 16));
    for (let i = 0; i < lod.sides; i += step) {
      const a = (i / lod.sides) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      ctx.stroke();
    }

    if (lod.hasRingsDetail) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.45, radius * 0.36, 0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${lod.tier} (${lod.sides} ${isEn ? 'sides' : 'lados'})`, px, py - radius - 14);

    updateMeters({
      fps: lod.fps,
      memLabel: '🔺 GPU',
      memVal: `${lod.gpuPct}%`,
      energyPct: lod.energyPct,
      extra: isEn
        ? `Active level: ${lod.tier} · ~${lod.triangles.toLocaleString()} triangles drawn`
        : `Nível ativo: ${lod.tier} · ~${lod.triangles.toLocaleString()} triângulos desenhados`,
    });
  };

  const drawStreaming = (ctx, w, h) => {
    const cols = 7;
    const rows = 5;
    const padX = 32;
    const padY = 24;
    const cellW = (w - padX * 2) / cols;
    const cellH = (h - padY * 2) / rows;
    const shipCol = Math.max(0, Math.min(cols - 1, Math.floor(shipPos.x * cols)));
    const shipRow = Math.max(0, Math.min(rows - 1, Math.floor(shipPos.y * rows)));

    const res = computeStreamingChunks({
      cols,
      rows,
      shipCol,
      shipRow,
      velX: shipPos.vx,
      velY: shipPos.vy,
      streamingEnabled: trickEnabled,
    });

    for (const cell of res.cells) {
      const x = padX + cell.col * cellW;
      const y = padY + cell.row * cellH;
      if (cell.state === 'loaded') {
        ctx.fillStyle = trickEnabled ? 'rgba(52, 211, 153, 0.28)' : 'rgba(244, 63, 94, 0.30)';
        ctx.strokeStyle = trickEnabled ? '#34d399' : '#fb7185';
      } else if (cell.state === 'prefetch') {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
        ctx.strokeStyle = '#facc15';
      } else {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      }
      ctx.lineWidth = 1.5;
      ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
      ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

      ctx.fillStyle = cell.state === 'unloaded' ? '#475569' : '#f8fafc';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const lbl = cell.state === 'loaded' ? 'VRAM' : cell.state === 'prefetch' ? 'SSD→' : 'DISK';
      ctx.fillText(lbl, x + cellW / 2, y + cellH / 2 + 4);
    }

    const sx = padX + (shipCol + 0.5) * cellW;
    const sy = padY + (shipRow + 0.5) * cellH;
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚀', sx, sy + 7);

    updateMeters({
      fps: res.stats.fps,
      memLabel: '📦 VRAM',
      memVal: `${res.stats.vramPct}%`,
      energyPct: res.stats.energyPct,
      extra: isEn
        ? `Loaded: ${res.stats.loadedCount}/${res.stats.totalChunks} sectors · Prefetching: ${res.stats.prefetchCount}`
        : `Na VRAM: ${res.stats.loadedCount}/${res.stats.totalChunks} setores · Pré-carregando: ${res.stats.prefetchCount}`,
    });
  };

  const drawAiLod = (ctx, w, h) => {
    const px = pointer.x * w;
    const py = pointer.y * h;
    const nearRadius = 112;

    const movedBots = aiBots.map((b) => ({
      ...b,
      x: (b.baseX + Math.sin(elapsed * 0.9 + b.phase) * 24 + w) % w,
      y: (b.baseY + Math.cos(elapsed * 0.8 + b.phase) * 18 + h) % h,
    }));

    const res = evaluateAiLodAgents({
      playerX: px,
      playerY: py,
      nearRadius,
      agents: movedBots,
      aiLodEnabled: trickEnabled,
    });

    // Near AI zone ring
    ctx.save();
    ctx.strokeStyle = trickEnabled ? 'rgba(56, 189, 248, 0.75)' : 'rgba(244, 63, 94, 0.65)';
    ctx.fillStyle = trickEnabled ? 'rgba(56, 189, 248, 0.10)' : 'rgba(244, 63, 94, 0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(px, py, nearRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    for (const bot of res.agents) {
      if (bot.tier === 'full') {
        // Draw A* path vector line toward/around player
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(bot.x, bot.y);
        ctx.lineTo(bot.x + (px - bot.x) * 0.28, bot.y + (py - bot.y) * 0.28);
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 8px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('A*', bot.x, bot.y + 3);
      } else {
        // Lightweight crowd boid dot
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.font = '22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🤖', px, py + 8);
    ctx.restore();

    updateMeters({
      fps: res.stats.fps,
      memLabel: '🧠 CPU',
      memVal: `${res.stats.cpuPct}%`,
      energyPct: res.stats.energyPct,
      extra: isEn
        ? `Full AI (A*): ${res.stats.fullAiCount} · Lightweight Boids: ${res.stats.crowdCount}`
        : `IA Completa (A*): ${res.stats.fullAiCount} · Bando Leve (Boids): ${res.stats.crowdCount}`,
    });
  };

  const drawFluids = (ctx, w, h) => {
    const boatX = Math.max(46, Math.min(w - 46, pointer.x * w));
    const localRadius = 78;
    const baseY = h * 0.58;

    const res = evaluateHybridFluidWave({
      samples: 46,
      width: w,
      boatX,
      localRadius,
      time: elapsed,
      hybridEnabled: trickEnabled,
    });

    // Local physics zone highlight
    ctx.save();
    ctx.fillStyle = trickEnabled ? 'rgba(56, 189, 248, 0.14)' : 'rgba(244, 63, 94, 0.14)';
    if (trickEnabled) {
      ctx.fillRect(boatX - localRadius, 36, localRadius * 2, h - 52);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.6)';
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(boatX - localRadius, 36, localRadius * 2, h - 52);
      ctx.setLineDash([]);
    } else {
      ctx.fillRect(0, 36, w, h - 52);
    }

    // Ocean fill
    const waterGrad = ctx.createLinearGradient(0, baseY - 25, 0, h);
    waterGrad.addColorStop(0, 'rgba(14, 165, 233, 0.65)');
    waterGrad.addColorStop(1, 'rgba(30, 58, 138, 0.92)');
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (const pt of res.points) {
      ctx.lineTo(pt.x, baseY + pt.yOffset);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Highlight active physics vertices + foam droplets near boat
    for (const pt of res.points) {
      ctx.fillStyle = pt.isPhysicsSample ? '#fde047' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(pt.x, baseY + pt.yOffset, pt.isPhysicsSample ? 3.2 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Foam splash particles around boat hull
    for (let i = 0; i < 10; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const spread = 14 + ((i * 11 + elapsed * 45) % 42);
      const lift = Math.abs(Math.sin(elapsed * 6 + i)) * 18;
      ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
      ctx.beginPath();
      ctx.arc(boatX + side * spread, baseY - 6 - lift, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Space boat on wave crest
    const nearest = res.points.reduce((best, p) => (Math.abs(p.x - boatX) < Math.abs(best.x - boatX) ? p : best), res.points[0]);
    ctx.font = '28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚤', boatX, baseY + nearest.yOffset - 8);
    ctx.restore();

    updateMeters({
      fps: res.stats.fps,
      memLabel: '🌊 CPU',
      memVal: `${res.stats.cpuPct}%`,
      energyPct: res.stats.energyPct,
      extra: isEn
        ? `Local physics nodes: ${res.stats.localPhysCount}/${res.stats.samples} · Light FFT wave nodes: ${res.stats.macroOnlyCount}`
        : `Nós com física real: ${res.stats.localPhysCount}/${res.stats.samples} · Nós onda leve (FFT): ${res.stats.macroOnlyCount}`,
    });
  };

  const drawRayTracing = (ctx, w, h) => {
    const ox = 58;
    const oy = h / 2;
    const rayAngle = Math.atan2(pointer.y * h - oy, Math.max(24, pointer.x * w - ox));
    const boxes = [
      { id: 'BVH-A', x: 185, y: 26, w: 120, h: 74, triangles: 1200 },
      { id: 'BVH-B', x: 325, y: 112, w: 135, h: 86, triangles: 1600 },
      { id: 'BVH-C', x: 195, y: 208, w: 125, h: 74, triangles: 1400 },
    ];

    const res = evaluateRayTracingBvh({
      originX: ox,
      originY: oy,
      rayAngle,
      boxes,
      bvhEnabled: trickEnabled,
    });

    ctx.save();
    // Draw BVH bounding boxes
    for (const b of res.boxes) {
      const tested = b.hit || !trickEnabled;
      ctx.fillStyle = b.hit
        ? 'rgba(56, 189, 248, 0.24)'
        : tested
        ? 'rgba(244, 63, 94, 0.18)'
        : 'rgba(30, 41, 59, 0.42)';
      ctx.strokeStyle = b.hit ? '#38bdf8' : tested ? '#fb7185' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = b.hit ? 2.5 : 1.5;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Crystal mirror inside box
      ctx.fillStyle = b.hit ? '#e0f2fe' : '#64748b';
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = b.hit ? '#7dd3fc' : tested ? '#fda4af' : '#64748b';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${b.id} (${b.hit ? 'HIT' : trickEnabled ? 'SKIP' : 'TEST'})`,
        b.x + 6,
        b.y + 14
      );
    }

    // Primary light ray + specular reflection bounce
    const endX = res.closestHit ? res.closestHit.x : ox + Math.cos(rayAngle) * 520;
    const endY = res.closestHit ? res.closestHit.y : oy + Math.sin(rayAngle) * 520;
    ctx.strokeStyle = '#fde047';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    if (res.closestHit) {
      const bounceAngle = -rayAngle + Math.PI * 0.85;
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX + Math.cos(bounceAngle) * 140, endY + Math.sin(bounceAngle) * 140);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☀️', ox, oy + 7);
    ctx.restore();

    updateMeters({
      fps: res.stats.fps,
      memLabel: '✨ GPU',
      memVal: `${res.stats.gpuPct}%`,
      energyPct: res.stats.energyPct,
      extra: isEn
        ? `Triangle tests: ${res.stats.triangleTests.toLocaleString()} / ${res.stats.totalTriangles.toLocaleString()} · BVH boxes hit: ${res.stats.boxesHit}/${res.stats.boxesTotal}`
        : `Testes de triângulos: ${res.stats.triangleTests.toLocaleString()} / ${res.stats.totalTriangles.toLocaleString()} · Caixas BVH atingidas: ${res.stats.boxesHit}/${res.stats.boxesTotal}`,
    });
  };

  const drawUpscaling = (ctx, w, h) => {
    const splitX = Math.max(70, Math.min(w - 70, pointer.x * w));
    const stats = evaluateAiUpscaling({ upscalingEnabled: trickEnabled });
    const planetX = w * 0.5 + Math.sin(elapsed * 1.1) * 18;
    const planetY = h * 0.5 + Math.cos(elapsed * 0.8) * 10;

    // LEFT HALF: Low-Res pixelated internal render + Motion Vectors
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, h);
    ctx.clip();

    const block = 12;
    for (let y = 0; y < h; y += block) {
      for (let x = 0; x < splitX; x += block) {
        const d = Math.hypot(x + block / 2 - planetX, y + block / 2 - planetY);
        if (d < 66) {
          ctx.fillStyle = d < 32 ? '#38bdf8' : '#1d4ed8';
          ctx.fillRect(x, y, block - 1, block - 1);
        } else if (Math.abs(d - 88) < 9) {
          ctx.fillStyle = '#eab308';
          ctx.fillRect(x, y, block - 1, block - 1);
        }
      }
    }

    // Motion Vector arrows showing temporal history fed to AI
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
    ctx.lineWidth = 1.6;
    const mvX = Math.cos(elapsed * 1.1) * 16;
    const mvY = -Math.sin(elapsed * 0.8) * 10;
    for (let i = -1; i <= 1; i++) {
      const ax = planetX - 28;
      const ay = planetY + i * 28;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + mvX, ay + mvY);
      ctx.stroke();
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.fillText(isEn ? 'INTERNAL 1080p + MOTION VECTORS' : 'INTERNO 1080p + VETORES', 14, 24);
    ctx.restore();

    // RIGHT HALF: Crisp AI-Reconstructed 4K Output (or Native 4K)
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, w - splitX, h);
    ctx.clip();

    const pGrad = ctx.createRadialGradient(planetX - 20, planetY - 20, 8, planetX, planetY, 68);
    pGrad.addColorStop(0, '#7dd3fc');
    pGrad.addColorStop(0.55, '#2563eb');
    pGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 66, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 96, 26, 0.24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = trickEnabled ? '#4ade80' : '#fb7185';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      trickEnabled
        ? isEn
          ? 'AI RECONSTRUCTED 4K (DLSS/FSR)'
          : 'RECONSTRUÇÃO IA 4K (DLSS/FSR)'
        : isEn
        ? 'NATIVE 4K (HEAVY GPU)'
        : '4K NATIVO (GPU PESADA)',
      w - 14,
      24
    );
    ctx.restore();

    // Split slider handle
    ctx.save();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(splitX, h / 2, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⇄', splitX, h / 2 + 4);
    ctx.restore();

    updateMeters({
      fps: stats.fps,
      memLabel: '🤖 GPU',
      memVal: `${stats.gpuPct}%`,
      energyPct: stats.energyPct,
      extra: isEn
        ? `${stats.internalRes} → ${stats.outputRes} · ${stats.shadedMillions}M pixels shaded/frame`
        : `${stats.internalRes} → ${stats.outputRes} · ${stats.shadedMillions}M pixels calculados/quadro`,
    });
  };

  const loop = (ts) => {
    const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
    lastTs = ts;
    elapsed += dt;

    const canvas = container.querySelector('#engine-lab-canvas');
    if (canvas && !container.classList.contains('hidden')) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#090f24';
      ctx.fillRect(0, 0, w, h);

      if (activeTopicId === 'culling') drawCulling(ctx, w, h);
      else if (activeTopicId === 'lod') drawLod(ctx, w, h);
      else if (activeTopicId === 'streaming') drawStreaming(ctx, w, h);
      else if (activeTopicId === 'ai_lod') drawAiLod(ctx, w, h);
      else if (activeTopicId === 'fluids') drawFluids(ctx, w, h);
      else if (activeTopicId === 'raytracing') drawRayTracing(ctx, w, h);
      else if (activeTopicId === 'upscaling') drawUpscaling(ctx, w, h);
    }
    rafId = requestAnimationFrame(loop);
  };

  renderShell();
  rafId = requestAnimationFrame(loop);
}
