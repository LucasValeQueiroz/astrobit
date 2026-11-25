/**
 * AstroBit Modals — Planet Star Map, Robot Garage, and Victory Celebration Overlay.
 */

import { CAMPAIGN_WORLDS } from '../levels/index.js?v=5.8';
import { ROBOT_SKINS } from '../renderer/robot-skins.js?v=5.8';
import { getTotalStars } from '../storage/progress.js?v=5.8';
import { COMPANION_DRONES } from '../engine/companions-and-hints.js?v=5.9';
import { SPACE_QUESTS, computeXpLevel } from '../engine/xp-and-quests.js?v=6.7';
import { exportProgressBackup } from '../storage/cloud-profile.js?v=6.8';
import { buildLeaderboardEntry, rankLeaderboardEntries } from '../engine/leaderboard.js?v=7.0';

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

/**
 * Renders the 3-Tab Pilot Center Modal: Space Quests | Mission History | Profile & Cloud Sync.
 */
export function renderQuestsModal(
  container,
  progress,
  {
    lang = 'pt',
    initialTab = 'quests',
    googleConfigured = false,
    googleUser = null,
    onGoogleSignIn,
    onGoogleSignOut,
    onImportBackup,
    onFetchLeaderboard,
    onClose,
  } = {}
) {
  if (!container) return;
  const isEn = lang === 'en';
  let activeTab = initialTab;
  let leaderboardRows = null;
  let leaderboardLoading = false;

  const ensureLeaderboardLoaded = async () => {
    if (leaderboardRows !== null || leaderboardLoading) return;
    leaderboardLoading = true;
    paint();
    try {
      const remote = (await onFetchLeaderboard?.()) || [];
      const selfUid = googleUser?.uid || 'local-pilot';
      const selfEntry = buildLeaderboardEntry(selfUid, progress, lang);
      const hasSelf = remote.some((r) => r.uid === selfUid);
      const combined = hasSelf ? remote : [...remote, selfEntry];
      leaderboardRows = rankLeaderboardEntries(combined, selfUid);
    } catch {
      const selfEntry = buildLeaderboardEntry('local-pilot', progress, lang);
      leaderboardRows = rankLeaderboardEntries([selfEntry], 'local-pilot');
    } finally {
      leaderboardLoading = false;
      if (activeTab === 'ranking') paint();
    }
  };

  const paint = () => {
    const lvl = computeXpLevel(progress?.xp || 0);
    const completedSet = new Set(Array.isArray(progress?.completedQuests) ? progress.completedQuests : []);
    const qProg = progress?.questProgress || {};
    const history = Array.isArray(progress?.matchHistory) ? progress.matchHistory : [];

    const questsHtml = SPACE_QUESTS.map((q) => {
      const done = completedSet.has(q.id);
      const cur = done ? q.target : Math.min(q.target, Number(qProg[q.id]) || 0);
      const pct = Math.round((cur / q.target) * 100);
      const title = isEn ? q.titleEn : q.titlePt;
      return `
        <div class="quest-card ${done ? 'done' : ''}">
          <div class="quest-top">
            <span class="quest-title">${q.icon} ${escapeHtml(title)}</span>
            <span class="quest-reward">${done ? '✅' : `+${q.xpReward} XP`}</span>
          </div>
          <div class="quest-bar-row">
            <div class="garage-bar-track"><div class="garage-bar-fill" style="width:${pct}%"></div></div>
            <span class="quest-count">${cur}/${q.target}</span>
          </div>
        </div>
      `;
    }).join('');

    const historyHtml =
      history.length === 0
        ? `<p class="muted small history-empty">${
            isEn
              ? 'No completed missions recorded yet — beat any level to start your Flight Logbook!'
              : 'Nenhuma missão registrada ainda — vença qualquer fase para começar seu Diário de Bordo!'
          }</p>`
        : `<div class="history-list">${history
            .slice(0, 20)
            .map((h) => {
              const stars = '★'.repeat(h.stars) + '☆'.repeat(Math.max(0, 3 - h.stars));
              const modeIcon =
                h.mode === 'arcade' ? '🕹️' : h.mode === 'daily' ? '🔥' : h.mode === 'custom' ? '🛠️' : '🚀';
              const dateLabel = String(h.timestamp || '').slice(0, 10);
              return `
                <div class="history-row">
                  <span class="history-title">${modeIcon} ${escapeHtml(h.title)}</span>
                  <span class="history-stars">${stars}</span>
                  <span class="history-meta">${h.blocks}p · +${h.xpGained} XP · ${escapeHtml(dateLabel)}</span>
                </div>
              `;
            })
            .join('')}</div>`;

    const cloudCardHtml = googleUser
      ? `
        <div class="cloud-status-card connected">
          <div>
            <strong>🔵 ${escapeHtml(googleUser.displayName || googleUser.email || 'Google Pilot')}</strong>
            <p class="small muted">${isEn ? 'Cloud Sync Active (Google Firestore)' : 'Sincronização em Nuvem Ativa (Google Firestore)'}</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" data-google-signout="true">
            ${isEn ? 'Sign Out' : 'Sair'}
          </button>
        </div>
      `
      : `
        <div class="cloud-status-card">
          <div>
            <strong>☁️ ${isEn ? 'Google Profile Cloud Sync (Firebase)' : 'Perfil Google na Nuvem (Firebase)'}</strong>
            <p class="small muted">
              ${
                googleConfigured
                  ? isEn
                    ? 'Sign in with Google to sync your stars, XP, medals, and match history across devices!'
                    : 'Entre com sua conta Google para sincronizar estrelas, XP, medalhas e histórico entre dispositivos!'
                  : isEn
                  ? 'Local cache active (localStorage). Add your Firebase Web Config in src/storage/firebase-config.js to activate 1-click Google Sign-In!'
                  : 'Cache local ativo (localStorage). Cole seu Firebase Web Config em src/storage/firebase-config.js para ativar o Login com Google em 1 clique!'
              }
            </p>
          </div>
          <button
            type="button"
            class="btn btn-run btn-sm"
            data-google-signin="true"
            ${googleConfigured ? '' : 'disabled'}
          >
            🔵 ${isEn ? 'Sign in with Google' : 'Entrar com Google'}
          </button>
        </div>
      `;

    const profileTabHtml = `
      <div class="profile-cloud-panel">
        ${cloudCardHtml}
        <div class="backup-card">
          <div>
            <strong>💾 ${isEn ? 'Portable Backup (.json)' : 'Backup Portátil (.json)'}</strong>
            <p class="small muted">${
              isEn
                ? 'Export your stars, XP, quests, and history to transfer between PC, tablet, or school!'
                : 'Exporte suas estrelas, XP, quests e histórico para transferir entre PC, tablet ou escola!'
            }</p>
          </div>
          <div class="backup-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-export-backup="true">
              ⬇️ ${isEn ? 'Export JSON' : 'Baixar Backup'}
            </button>
            <label class="btn btn-secondary btn-sm backup-import-label">
              ⬆️ ${isEn ? 'Restore JSON' : 'Restaurar'}
              <input type="file" accept="application/json,.json" data-import-backup="true" hidden />
            </label>
          </div>
        </div>
      </div>
    `;

    const rankingHtml = leaderboardLoading
      ? `<p class="muted small history-empty">🌌 ${isEn ? 'Loading Galaxy Hall of Fame...' : 'Carregando Hall da Fama da Galáxia...'}</p>`
      : `<div class="history-list">${(leaderboardRows || [])
          .map(
            (r) => `
              <div class="history-row ${r.isSelf ? 'leaderboard-self' : ''}">
                <span class="history-title">
                  <strong class="lb-medal">${escapeHtml(r.medal)}</strong>
                  ${r.droneIcon || '✨'} ${escapeHtml(r.pilotName)}${r.isSelf ? (isEn ? ' (You)' : ' (Você)') : ''}
                </span>
                <span class="history-stars">Lv.${r.level} · ⭐ ${r.stars}</span>
                <span class="history-meta">${r.xp} XP · 🕹️ ${r.arcadeBestScore}</span>
              </div>
            `
          )
          .join('')}</div>`;

    const bodyHtml =
      activeTab === 'quests'
        ? `<div class="quests-list">${questsHtml}</div>`
        : activeTab === 'ranking'
        ? rankingHtml
        : activeTab === 'history'
        ? historyHtml
        : profileTabHtml;

    container.innerHTML = `
      <div class="modal-card modal-wide quests-modal">
        <div class="modal-head">
          <div>
            <h2>⚡ ${isEn ? `Pilot Level ${lvl.level} · Command Logbook` : `Piloto Nível ${lvl.level} · Central do Piloto`}</h2>
            <p class="modal-sub">
              ${
                lvl.isMax
                  ? isEn
                    ? `MAX LEVEL REACHED! (${lvl.totalXp} Total XP)`
                    : `NÍVEL MÁXIMO ALCANÇADO! (${lvl.totalXp} XP Total)`
                  : isEn
                  ? `${lvl.currentLevelXp} / ${lvl.nextLevelXp} XP to Level ${lvl.level + 1} (${lvl.totalXp} Total XP)`
                  : `${lvl.currentLevelXp} / ${lvl.nextLevelXp} XP para o Nível ${lvl.level + 1} (${lvl.totalXp} XP Total)`
              }
            </p>
          </div>
          <button type="button" class="icon-btn" data-close="true" aria-label="Close">✕</button>
        </div>
        <div class="garage-progress">
          <div class="garage-bar-track">
            <div class="garage-bar-fill" style="width:${lvl.pct}%"></div>
          </div>
        </div>
        <div class="pilot-tabs" role="tablist">
          <button type="button" class="pilot-tab ${activeTab === 'quests' ? 'active' : ''}" data-pilot-tab="quests">
            📋 ${isEn ? 'Quests' : 'Missões'}
          </button>
          <button type="button" class="pilot-tab ${activeTab === 'ranking' ? 'active' : ''}" data-pilot-tab="ranking">
            🏆 ${isEn ? 'Ranking' : 'Ranking'}
          </button>
          <button type="button" class="pilot-tab ${activeTab === 'history' ? 'active' : ''}" data-pilot-tab="history">
            📜 ${isEn ? `History (${history.length})` : `Histórico (${history.length})`}
          </button>
          <button type="button" class="pilot-tab ${activeTab === 'profile' ? 'active' : ''}" data-pilot-tab="profile">
            ☁️ ${isEn ? 'Google & Backup' : 'Google & Backup'}
          </button>
        </div>
        ${bodyHtml}
      </div>
    `;

    const fileInput = container.querySelector('[data-import-backup]');
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const text = await file.text();
      const updated = await onImportBackup?.(text);
      if (updated) {
        progress = updated;
        paint();
      }
    });
  };

  paint();
  container.classList.remove('hidden');

  container.onclick = async (event) => {
    const tabBtn = event.target.closest('[data-pilot-tab]');
    if (tabBtn) {
      activeTab = tabBtn.dataset.pilotTab;
      if (activeTab === 'ranking') {
        ensureLeaderboardLoaded();
      } else {
        paint();
      }
      return;
    }
    if (event.target.closest('[data-export-backup]')) {
      const blob = new Blob([exportProgressBackup(progress)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'astrobit-pilot-backup.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    if (event.target.closest('[data-google-signin]')) {
      const updated = await onGoogleSignIn?.();
      if (updated) {
        progress = updated;
        paint();
      }
      return;
    }
    if (event.target.closest('[data-google-signout]')) {
      await onGoogleSignOut?.();
      googleUser = null;
      paint();
      return;
    }
    if (event.target === container || event.target.closest('[data-close]')) {
      container.classList.add('hidden');
      onClose?.();
    }
  };
}
