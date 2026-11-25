/**
 * AstroBit Modals — Planet Star Map, Robot Garage, and Victory Celebration Overlay.
 */

import { CAMPAIGN_WORLDS } from '../levels/index.js?v=5.8';
import { ROBOT_SKINS } from '../renderer/robot-skins.js?v=5.8';
import { getTotalStars } from '../storage/progress.js?v=5.8';
import { COMPANION_DRONES } from '../engine/companions-and-hints.js?v=5.9';

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

export function renderGarageModal(container, progress, { lang, t, onSelectSkin, onSelectDrone, onClose }) {
  if (!container) return;
  const totalStars = getTotalStars(progress);
  const badgeCount = Array.isArray(progress?.unlockedBadges) ? progress.unlockedBadges.length : 0;

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

  const nextLocked = ROBOT_SKINS.find((s) => totalStars < s.starsRequired) || null;
  const progressHtml = nextLocked
    ? (() => {
        const pct = Math.min(100, Math.round((totalStars / nextLocked.starsRequired) * 100));
        const nextName = lang === 'en' ? nextLocked.nameEn : nextLocked.namePt;
        return `
          <div class="garage-progress">
            <div class="garage-progress-top">
              <span>${escapeHtml(t(lang, 'garageNext', { name: nextName }))}</span>
              <strong>⭐ ${totalStars} / ${nextLocked.starsRequired}</strong>
            </div>
            <div class="garage-bar-track">
              <div class="garage-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>
        `;
      })()
    : `<div class="garage-progress all-unlocked">🏆 ${escapeHtml(t(lang, 'garageAllUnlocked'))}</div>`;

  const droneCards = COMPANION_DRONES.map((drone) => {
    const unlocked = badgeCount >= drone.badgesRequired;
    const equipped = (progress.droneId || 'spark') === drone.id;
    const name = lang === 'en' ? drone.nameEn : drone.namePt;
    const need = Math.max(0, drone.badgesRequired - badgeCount);
    return `
      <div class="skin-card drone-card ${equipped ? 'equipped' : ''} ${unlocked ? '' : 'locked'}">
        <div class="drone-avatar" style="background:${drone.color}33; border-color:${drone.color}">
          <span>${drone.icon}</span>
        </div>
        <strong>${escapeHtml(name)}</strong>
        <button
          type="button"
          class="btn btn-sm ${equipped ? 'btn-success' : unlocked ? 'btn-primary' : ''}"
          data-drone-id="${drone.id}"
          ${unlocked ? '' : 'disabled'}
        >
          ${
            equipped
              ? escapeHtml(t(lang, 'garageEquipped'))
              : unlocked
              ? escapeHtml(lang === 'en' ? 'Equip Drone' : 'Usar Drone')
              : `🔒 ${need} 🏆`
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
        ${progressHtml}
        <div class="skin-grid">${cards}</div>
        <div class="drone-section-head">
          <h4>🐾 ${escapeHtml(lang === 'en' ? 'Companion Drones (Unlocked by Space Medals)' : 'Drones Companheiros (Desbloqueados por Medalhas)')}</h4>
          <span class="concept-pill">🏆 ${badgeCount}</span>
        </div>
        <div class="skin-grid drone-grid">${droneCards}</div>
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
    const skinBtn = event.target.closest('[data-skin-id]');
    if (skinBtn && !skinBtn.disabled) {
      onSelectSkin(skinBtn.dataset.skinId);
      renderGarageModal(
        container,
        { ...progress, skinId: skinBtn.dataset.skinId },
        { lang, t, onSelectSkin, onSelectDrone, onClose }
      );
      return;
    }
    const droneBtn = event.target.closest('[data-drone-id]');
    if (droneBtn && !droneBtn.disabled) {
      onSelectDrone?.(droneBtn.dataset.droneId);
      renderGarageModal(
        container,
        { ...progress, droneId: droneBtn.dataset.droneId },
        { lang, t, onSelectSkin, onSelectDrone, onClose }
      );
    }
  };
}

/**
 * Renders the Space Medals / Achievements modal (12 unlockable badges + Daily Streak banner).
 */
export function renderBadgesModal(
  container,
  progress,
  badges,
  dailyStreak,
  { lang = 'pt', onOpenPassport, onClose }
) {
  const unlockedSet = new Set(Array.isArray(progress?.unlockedBadges) ? progress.unlockedBadges : []);
  const count = unlockedSet.size;
  const total = badges.length;
  const isEn = lang === 'en';
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  const cardsHtml = badges
    .map((b) => {
      const unlocked = unlockedSet.has(b.id);
      const name = isEn ? b.nameEn : b.namePt;
      const desc = isEn ? b.descEn : b.descPt;
      return `
        <div class="badge-card ${unlocked ? 'unlocked' : 'locked'}">
          <div class="badge-icon" aria-hidden="true">${unlocked ? b.icon : '🔒'}</div>
          <div class="badge-info">
            <strong>${name}</strong>
            <span>${desc}</span>
          </div>
          ${unlocked ? '<span class="badge-check">✓</span>' : ''}
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="modal-card modal-wide badges-modal">
      <div class="modal-head">
        <div>
          <h2>🏆 ${isEn ? 'Space Medals & Logbook' : 'Medalhas Espaciais'}</h2>
          <p class="modal-sub">
            ${
              isEn
                ? `${count} of ${total} medals unlocked · 🔥 Daily Streak: ${dailyStreak} day(s)`
                : `${count} de ${total} medalhas desbloqueadas · 🔥 Sequência Diária: ${dailyStreak} dia(s)`
            }
          </p>
        </div>
        <div class="modal-head-actions">
          <button type="button" class="btn btn-run btn-sm" data-open-passport="true">
            🪪 ${isEn ? 'Export Passport PNG' : 'Passaporte PNG'}
          </button>
          <button type="button" class="icon-btn" data-close="true" aria-label="Close">✕</button>
        </div>
      </div>
      <div class="garage-progress">
        <div class="garage-progress-bar">
          <span class="garage-progress-fill" style="width:${pct}%"></span>
        </div>
      </div>
      <div class="badges-grid">${cardsHtml}</div>
    </div>
  `;

  container.classList.remove('hidden');
  container.onclick = (event) => {
    if (event.target.closest('[data-open-passport]')) {
      onOpenPassport?.();
      return;
    }
    if (event.target === container || event.target.closest('[data-close]')) {
      container.classList.add('hidden');
      onClose?.();
    }
  };
}
