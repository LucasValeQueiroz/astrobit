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
} from '../engine/engine-lab-sim.js?v=5.2';

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
    }
    rafId = requestAnimationFrame(loop);
  };

  renderShell();
  rafId = requestAnimationFrame(loop);
}
