/**
 * AstroBit Exportable Space Passport & Certificate Modal (100% client-side Canvas 2D PNG).
 * Renders a crisp 900x520 collectible Space Engineer Passport with pilot name, equipped skin & drone,
 * campaign stars, Space Medals, Arcade record, Daily Streak, and AAA Lab Certified seal.
 */

import { buildPassportSummary } from '../engine/space-passport.js?v=6.0';

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawPassportCard(canvas, summary, lang = 'pt') {
  if (!canvas) return;
  const W = 900;
  const H = 520;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const isEn = lang === 'en';

  // 1. Deep galaxy gradient backdrop
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#070b1e');
  bg.addColorStop(0.55, '#131d47');
  bg.addColorStop(1, '#1e113d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Decorative deterministic starfield
  for (let i = 0; i < 65; i++) {
    const sx = ((i * 137.5) % 1) * W;
    const sy = ((i * 293.3) % 1) * H;
    const sr = (i % 3 === 0 ? 2.1 : 1.2);
    ctx.fillStyle = i % 5 === 0 ? 'rgba(250,204,21,0.7)' : 'rgba(226,232,240,0.45)';
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer holographic border
  roundRect(ctx, 18, 18, W - 36, H - 36, 26);
  const borderGrad = ctx.createLinearGradient(18, 18, W - 18, H - 18);
  borderGrad.addColorStop(0, '#38bdf8');
  borderGrad.addColorStop(0.5, '#c084fc');
  borderGrad.addColorStop(1, '#facc15');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner subtle frame
  roundRect(ctx, 30, 30, W - 60, H - 60, 20);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Header band
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 17px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    isEn ? 'ASTROBIT · OFFICIAL SPACE ENGINEER PASSPORT' : 'ASTROBIT · PASSAPORTE OFICIAL DE ENGENHEIRO ESPACIAL',
    54,
    72
  );

  // AAA Lab seal if certified
  if (summary.isAaaCertified) {
    roundRect(ctx, W - 270, 46, 214, 38, 19);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#a7f3d0';
    ctx.font = '800 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isEn ? '🧪 AAA LAB CERTIFIED ✓' : '🧪 CERTIFICADO LAB AAA ✓', W - 163, 70);
    ctx.textAlign = 'left';
  }

  // Left Robot Avatar Card
  roundRect(ctx, 54, 102, 210, 240, 20);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.fill();
  ctx.strokeStyle = summary.skin.body;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw equipped robot mini-portrait
  const rx = 159;
  const ry = 196;
  roundRect(ctx, rx - 46, ry - 44, 92, 88, 22);
  ctx.fillStyle = summary.skin.body;
  ctx.fill();
  ctx.strokeStyle = summary.skin.bodyDark;
  ctx.lineWidth = 4;
  ctx.stroke();
  roundRect(ctx, rx - 34, ry - 22, 68, 34, 12);
  ctx.fillStyle = summary.skin.visor;
  ctx.fill();
  ctx.fillStyle = summary.skin.eye;
  ctx.beginPath();
  ctx.arc(rx - 14, ry - 5, 6.5, 0, Math.PI * 2);
  ctx.arc(rx + 14, ry - 5, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Equipped companion drone badge on corner of avatar
  ctx.beginPath();
  ctx.arc(rx + 52, ry - 48, 22, 0, Math.PI * 2);
  ctx.fillStyle = summary.drone.color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = '22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(summary.drone.icon, rx + 52, ry - 40);

  // Skin + drone captions
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText(isEn ? summary.skin.nameEn : summary.skin.namePt, rx, 294);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText(`${summary.drone.icon} ${isEn ? summary.drone.nameEn : summary.drone.namePt}`, rx, 318);
  ctx.textAlign = 'left';

  // Right Pilot Info
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillText(isEn ? 'PILOT NAME' : 'NOME DO PILOTO', 296, 126);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 38px system-ui, -apple-system, sans-serif';
  ctx.fillText(summary.pilotName, 296, 170);

  // Rank pill
  const rankLabel = `${summary.rank.icon}  ${isEn ? summary.rank.titleEn : summary.rank.titlePt}`;
  roundRect(ctx, 296, 188, 340, 40, 20);
  ctx.fillStyle = `${summary.rank.color}28`;
  ctx.fill();
  ctx.strokeStyle = summary.rank.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 18px system-ui, sans-serif';
  ctx.fillText(rankLabel, 314, 214);

  // 4 Stats Cards
  const stats = [
    {
      icon: '⭐',
      label: isEn ? 'Campaign Stars' : 'Estrelas da Campanha',
      val: `${summary.stars} / ${summary.totalMaxStars}`,
      col: '#facc15',
    },
    {
      icon: '🏆',
      label: isEn ? 'Space Medals' : 'Medalhas Espaciais',
      val: `${summary.badges} / ${summary.totalBadges}`,
      col: '#c084fc',
    },
    {
      icon: '🕹️',
      label: isEn ? 'Arcade Record' : 'Recorde Arcade',
      val: `${summary.arcadeBestScore} pts`,
      col: '#f472b6',
    },
    {
      icon: '🧪',
      label: isEn ? 'AAA Lab + Streak' : 'Lab AAA + Streak',
      val: `${summary.labMastered}/7 · 🔥${summary.dailyStreak}d`,
      col: '#34d399',
    },
  ];

  stats.forEach((st, idx) => {
    const colIdx = idx % 2;
    const rowIdx = Math.floor(idx / 2);
    const sx = 296 + colIdx * 282;
    const sy = 248 + rowIdx * 96;
    roundRect(ctx, sx, sy, 266, 82, 16);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fill();
    ctx.strokeStyle = `${st.col}66`;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText(`${st.icon} ${st.label}`, sx + 16, sy + 28);

    ctx.fillStyle = st.col;
    ctx.font = '900 26px system-ui, sans-serif';
    ctx.fillText(st.val, sx + 16, sy + 64);
  });

  // Footer signature
  ctx.fillStyle = '#64748b';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText('lucasvalequeiroz.github.io/astrobit', 54, H - 46);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(new Date().toISOString().slice(0, 10), W - 54, H - 46);
  ctx.textAlign = 'left';
}

export function renderPassportModal(
  container,
  progress,
  { lang = 'pt', totalMaxStars = 126, totalBadges = 15, dailyStreak = 0, onSavePilotName, onClose }
) {
  if (!container) return;
  const isEn = lang === 'en';
  let currentName = progress?.pilotName || '';

  container.innerHTML = `
    <div class="modal-card modal-wide passport-modal">
      <div class="modal-head">
        <div>
          <h2>🪪 ${isEn ? 'Space Engineer Passport & Certificate' : 'Passaporte & Certificado Espacial'}</h2>
          <p class="modal-sub">
            ${isEn ? 'Customize your pilot name and download your collectible PNG card!' : 'Personalize o nome do piloto e baixe seu cartão colecionável em PNG!'}
          </p>
        </div>
        <button type="button" class="icon-btn" data-close="true" aria-label="Close">✕</button>
      </div>
      <div class="passport-controls">
        <input
          id="passport-name-input"
          type="text"
          maxlength="28"
          class="passport-input"
          value="${escapeHtml(currentName)}"
          placeholder="${isEn ? 'Type your pilot name...' : 'Digite seu nome de piloto...'}"
        />
        <button id="btn-passport-download" type="button" class="btn btn-run">
          ⬇️ ${isEn ? 'Download PNG' : 'Baixar Certificado PNG'}
        </button>
      </div>
      <div class="passport-canvas-wrap">
        <canvas id="passport-canvas" class="passport-canvas"></canvas>
      </div>
    </div>
  `;

  container.classList.remove('hidden');

  const canvas = container.querySelector('#passport-canvas');
  const input = container.querySelector('#passport-name-input');
  const downloadBtn = container.querySelector('#btn-passport-download');

  const redraw = () => {
    const summary = buildPassportSummary(
      { ...progress, pilotName: currentName },
      { lang, totalMaxStars, totalBadges, dailyStreak }
    );
    drawPassportCard(canvas, summary, lang);
  };

  redraw();

  input?.addEventListener('input', () => {
    currentName = input.value;
    onSavePilotName?.(currentName);
    redraw();
  });

  downloadBtn?.addEventListener('click', () => {
    redraw();
    const link = document.createElement('a');
    link.download = 'astrobit-space-passport.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  container.onclick = (event) => {
    if (event.target === container || event.target.closest('[data-close]')) {
      container.classList.add('hidden');
      onClose?.();
    }
  };
}
