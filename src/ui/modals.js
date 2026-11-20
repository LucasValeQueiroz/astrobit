/**
 * AstroBit Modals — Planet Star Map, Robot Garage, and Victory Celebration Overlay.
 */

import { CAMPAIGN_WORLDS } from '../levels/index.js';
import { ROBOT_SKINS } from '../renderer/robot-skins.js';
import { getTotalStars } from '../storage/progress.js';

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderStarsBadge(stars) {
  return [1, 2, 3]
    .map((n) => `<span class="star-icon ${n <= stars ? 'earned' : 'empty'}">★</span>`)
    .join('');
}

export function renderLevelsModal(container, progress, currentLevelId, { lang, t, onSelectLevel, onClose }) {
  if (!container) return;
  const worldsHtml = CAMPAIGN_WORLDS.map((w) => {
    const worldName = lang === 'en' ? w.nameEn : w.namePt;
    const concept = lang === 'en' ? w.conceptEn : w.conceptPt;
    const cards = w.levels
      .map((lvl) => {
        const earned = Number(progress.starsByLevel?.[lvl.id] || 0);
        const title = lang === 'en' ? lvl.titleEn : lvl.titlePt;
        const isCurrent = lvl.id === currentLevelId;
        return `
          <button type="button" class="level-tile ${isCurrent ? 'current' : ''} ${earned > 0 ? 'completed' : ''}" data-level-id="${lvl.id}">
            <span class="level-num">${lvl.world}-${lvl.index}</span>
            <span class="level-title">${lvl.isBugHunt ? '🐛 ' : ''}${escapeHtml(title)}</span>
            <span class="level-stars">${renderStarsBadge(earned)}</span>
          </button>
        `;
      })
      .join('');

    return `
      <section class="world-section">
        <div class="world-header">
          <h4>${w.icon} ${escapeHtml(t(lang, 'worldLabel', { num: w.world }))}: ${escapeHtml(worldName)}</h4>
          <span class="concept-pill">${escapeHtml(concept)}</span>
        </div>
        <div class="level-grid">${cards}</div>
      </section>
    `;
  }).join('');

  container.innerHTML = `
    <div class="modal-card">
      <div class="modal-head">
        <h3>${escapeHtml(t(lang, 'modalLevelsTitle'))}</h3>
        <button type="button" class="icon-btn" data-close-modal="true" aria-label="${escapeHtml(t(lang, 'close'))}">✕</button>
      </div>
      <div class="modal-body">${worldsHtml}</div>
    </div>
  `;
  container.classList.remove('hidden');

  container.onclick = (event) => {
    if (event.target === container || event.target.closest('[data-close-modal]')) {
      container.classList.add('hidden');
      onClose?.();
      return;
    }
    const tile = event.target.closest('[data-level-id]');
    if (tile) {
      container.classList.add('hidden');
      onSelectLevel(tile.dataset.levelId);
    }
  };
}

export function renderGarageModal(container, progress, { lang, t, onSelectSkin, onClose }) {
  if (!container) return;
  const totalStars = getTotalStars(progress);

  const accessoryEmoji = (acc) =>
    acc === 'crown' ? '👑' : acc === 'cape' ? '🦸' : acc === 'dual-antenna' ? '📡' : '🤖';

  const cards = ROBOT_SKINS.map((skin) => {
    const unlocked = totalStars >= skin.starsRequired;
    const equipped = progress.skinId === skin.id;
    const name = lang === 'en' ? skin.nameEn : skin.namePt;
    const need = Math.max(0, skin.starsRequired - totalStars);

    return `
      <div class="skin-card ${equipped ? 'equipped' : ''} ${unlocked ? '' : 'locked'}">
        <div class="skin-avatar" style="background:${skin.body}; border-color:${skin.bodyDark}">
          <span class="skin-visor" style="background:${skin.visor}; color:${skin.eye}">● ●</span>
          <span class="skin-acc">${accessoryEmoji(skin.accessory)}</span>
        </div>
        <strong>${escapeHtml(name)}</strong>
        <button
          type="button"
          class="btn btn-sm ${equipped ? 'btn-success' : unlocked ? 'btn-primary' : ''}"
          data-skin-id="${skin.id}"
          ${unlocked ? '' : 'disabled'}
        >
          ${
            equipped
              ? escapeHtml(t(lang, 'garageEquipped'))
              : unlocked
              ? escapeHtml(t(lang, 'garageEquip'))
              : `🔒 ${escapeHtml(t(lang, 'garageLocked', { need }))}`
          }
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="modal-card">
      <div class="modal-head">
        <div>
          <h3>${escapeHtml(t(lang, 'modalGarageTitle'))}</h3>
          <p class="small muted">${escapeHtml(t(lang, 'garageStars', { stars: totalStars }))}</p>
        </div>
        <button type="button" class="icon-btn" data-close-modal="true" aria-label="${escapeHtml(t(lang, 'close'))}">✕</button>
      </div>
      <div class="modal-body">
        <div class="skin-grid">${cards}</div>
      </div>
    </div>
  `;
  container.classList.remove('hidden');

  container.onclick = (event) => {
    if (event.target === container || event.target.closest('[data-close-modal]')) {
      container.classList.add('hidden');
      onClose?.();
      return;
    }
    const btn = event.target.closest('[data-skin-id]');
    if (btn && !btn.disabled) {
      onSelectSkin(btn.dataset.skinId);
      renderGarageModal(container, { ...progress, skinId: btn.dataset.skinId }, { lang, t, onSelectSkin, onClose });
    }
  };
}
