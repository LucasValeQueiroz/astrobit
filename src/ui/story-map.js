/**
 * AstroBit Story Cinematics & Animated Galaxy/Planet Journey Map.
 * Renders the "Operação: Luz da Terra!" intro & ending cutscenes, planet arrival cards,
 * and the interactive Galaxy -> Planet Base Flight Map where Starship Estrela-1 flies
 * smoothly between bases and worlds!
 */

import { CAMPAIGN_WORLDS } from '../levels/index.js?v=8.1';
import { WORLD_PALETTES } from '../renderer/robot-skins.js?v=8.1';
import {
  INTRO_SCENES,
  ENDING_SCENES,
  getWorldStory,
  getLevelStory,
} from '../story/campaign-story.js?v=8.1';
import { getTotalStars } from '../storage/progress.js?v=8.1';
import { FlightCinemaController } from './flight-cinema.js?v=8.1';
import { getPlanetBiome, getRegionForLevel } from '../story/planet-biomes.js?v=8.1';
import { PlanetBiomeRenderer } from './planet-biome-canvas.js?v=8.1';

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Generates a smooth quadratic Bezier SVG path connecting an ordered list of {x, y} coordinates.
 */
export function buildSmoothRoutePath(coords = []) {
  if (!Array.isArray(coords) || coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const cur = coords[i];
    const mx = Math.round((prev.x + cur.x) / 2);
    const my = Math.round((prev.y + cur.y) / 2);
    const ctrlY = i % 2 === 0 ? my - 26 : my + 26;
    d += ` Q ${mx} ${ctrlY} ${cur.x} ${cur.y}`;
  }
  return d;
}

/**
 * Animated Starship Estrela-1 SVG sprite (with glowing viewport and flickering thruster flame).
 */
function renderStarshipSvg(size = 56) {
  return `
    <svg class="starship-svg" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="shipBodyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="60%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
        <linearGradient id="shipFlameGrad" x1="1" y1="0.5" x2="0" y2="0.5">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="55%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Flickering Plasma Flame -->
      <path class="ship-flame" d="M 18 26 Q 4 32 18 38 Q 10 32 18 26 Z" fill="url(#shipFlameGrad)"/>
      <ellipse class="ship-flame-core" cx="17" cy="32" rx="6" ry="3.4" fill="#fef08a"/>
      <!-- Wings -->
      <path d="M 22 22 L 14 11 L 31 20 Z" fill="#f43f5e"/>
      <path d="M 22 42 L 14 53 L 31 44 Z" fill="#f43f5e"/>
      <!-- Fuselage -->
      <path d="M 18 24 C 28 16 46 18 58 32 C 46 46 28 48 18 40 Z" fill="url(#shipBodyGrad)" stroke="#e0f2fe" stroke-width="1.8"/>
      <!-- Cockpit Window with AstroBit -->
      <circle cx="38" cy="32" r="7.5" fill="#0f172a" stroke="#7dd3fc" stroke-width="2"/>
      <circle cx="36.2" cy="31.2" r="1.8" fill="#38bdf8"/>
      <circle cx="40.5" cy="31.2" r="1.8" fill="#38bdf8"/>
      <!-- Nose Stripe -->
      <path d="M 49 25.5 C 53 27.8 55.8 30 58 32 C 55.8 34 53 36.2 49 38.5 Z" fill="#facc15"/>
    </svg>
  `;
}

/**
 * Custom animated SVG story scene artwork (zero external images!).
 */
function renderSceneArtwork(visual, totalStars = 0) {
  if (visual === 'earth-alert') {
    return `
      <svg class="story-art-svg" viewBox="0 0 420 180" aria-hidden="true">
        <defs>
          <radialGradient id="earthGrad" cx="38%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="65%" stop-color="#1d4ed8"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </radialGradient>
        </defs>
        <!-- Starfield -->
        <circle cx="42" cy="28" r="2" fill="#e2e8f0" opacity="0.7"/>
        <circle cx="110" cy="48" r="1.6" fill="#93c5fd" opacity="0.8"/>
        <circle cx="350" cy="34" r="2.2" fill="#fde047" opacity="0.8"/>
        <circle cx="380" cy="130" r="1.8" fill="#e2e8f0" opacity="0.7"/>
        <circle cx="66" cy="142" r="1.5" fill="#c084fc" opacity="0.7"/>
        <!-- Pulsing Alert Rings around Earth -->
        <circle class="art-pulse" cx="155" cy="96" r="56" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-dasharray="6 6"/>
        <!-- Earth -->
        <circle cx="155" cy="96" r="46" fill="url(#earthGrad)" stroke="#7dd3fc" stroke-width="2"/>
        <path d="M 132 74 Q 148 68 156 80 Q 150 96 134 94 Z" fill="#22c55e" opacity="0.85"/>
        <path d="M 164 88 Q 182 86 188 104 Q 174 120 160 112 Z" fill="#16a34a" opacity="0.85"/>
        <path d="M 135 112 Q 148 118 154 130 Q 138 134 128 122 Z" fill="#22c55e" opacity="0.8"/>
        <!-- Dimmed Solar Beacon -->
        <g transform="translate(278, 72)">
          <circle cx="0" cy="0" r="24" fill="#1e293b" stroke="#64748b" stroke-width="2.5" stroke-dasharray="5 4"/>
          <text x="0" y="7" text-anchor="middle" font-size="22">💡</text>
          <text x="0" y="39" text-anchor="middle" fill="#fda4af" font-size="11" font-weight="700">OFFLINE</text>
        </g>
        <!-- Falling Meteors -->
        <g class="art-meteor">
          <line x1="340" y1="18" x2="298" y2="54" stroke="#fb923c" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="298" cy="54" r="5" fill="#fde047"/>
        </g>
        <g class="art-meteor" style="animation-delay:0.45s">
          <line x1="395" y1="62" x2="352" y2="96" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>
          <circle cx="352" cy="96" r="4.5" fill="#fbbf24"/>
        </g>
      </svg>
    `;
  }

  if (visual === 'ship-ready') {
    return `
      <svg class="story-art-svg" viewBox="0 0 420 180" aria-hidden="true">
        <circle cx="55" cy="34" r="2" fill="#e2e8f0" opacity="0.8"/>
        <circle cx="360" cy="40" r="2.2" fill="#fde047" opacity="0.85"/>
        <circle cx="315" cy="144" r="1.8" fill="#7dd3fc" opacity="0.8"/>
        <circle cx="95" cy="145" r="2" fill="#c084fc" opacity="0.7"/>
        <!-- Launch Energy Rings -->
        <ellipse cx="210" cy="138" rx="95" ry="18" fill="rgba(56,189,248,0.14)" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6 5"/>
        <!-- Floating Starship + AstroBit -->
        <g class="art-float" transform="translate(150, 32) scale(1.7)">
          <path class="ship-flame" d="M 18 26 Q 3 32 18 38 Q 10 32 18 26 Z" fill="#f97316"/>
          <ellipse cx="17" cy="32" rx="6" ry="3.2" fill="#fef08a"/>
          <path d="M 22 22 L 14 11 L 31 20 Z" fill="#f43f5e"/>
          <path d="M 22 42 L 14 53 L 31 44 Z" fill="#f43f5e"/>
          <path d="M 18 24 C 28 16 46 18 58 32 C 46 46 28 48 18 40 Z" fill="#38bdf8" stroke="#e0f2fe" stroke-width="1.5"/>
          <circle cx="38" cy="32" r="7.5" fill="#0f172a" stroke="#7dd3fc" stroke-width="1.8"/>
          <circle cx="36" cy="31" r="1.8" fill="#7dd3fc"/>
          <circle cx="40.5" cy="31" r="1.8" fill="#7dd3fc"/>
          <path d="M 49 25.5 C 53 27.8 55.8 30 58 32 C 55.8 34 53 36.2 49 38.5 Z" fill="#facc15"/>
        </g>
        <!-- Floating Puzzle Sparkles -->
        <text x="90" y="88" font-size="24">🧩</text>
        <text x="312" y="84" font-size="24">💎</text>
      </svg>
    `;
  }

  if (visual === 'galaxy-route') {
    return `
      <svg class="story-art-svg" viewBox="0 0 420 180" aria-hidden="true">
        <path d="M 42 125 Q 110 42 175 102 T 310 74 T 382 96" fill="none" stroke="#facc15" stroke-width="3" stroke-dasharray="7 6" opacity="0.8"/>
        <circle cx="42" cy="125" r="18" fill="#1d4ed8" stroke="#7dd3fc" stroke-width="2"/>
        <text x="42" y="131" text-anchor="middle" font-size="18">🌍</text>
        <circle cx="115" cy="74" r="14" fill="#0284c7" stroke="#bae6fd" stroke-width="1.8"/>
        <text x="115" y="79" text-anchor="middle" font-size="14">🌙</text>
        <circle cx="182" cy="106" r="14" fill="#d97706" stroke="#fde68a" stroke-width="1.8"/>
        <text x="182" y="111" text-anchor="middle" font-size="14">⚙️</text>
        <circle cx="248" cy="70" r="14" fill="#db2777" stroke="#fbcfe8" stroke-width="1.8"/>
        <text x="248" y="75" text-anchor="middle" font-size="14">⚡</text>
        <circle cx="310" cy="76" r="14" fill="#059669" stroke="#a7f3d0" stroke-width="1.8"/>
        <text x="310" y="81" text-anchor="middle" font-size="14">🛰️</text>
        <circle class="art-pulse" cx="378" cy="96" r="22" fill="rgba(250,204,21,0.22)" stroke="#facc15" stroke-width="2.5"/>
        <text x="378" y="103" text-anchor="middle" font-size="22">☀️</text>
        <text class="art-float" x="140" y="48" font-size="24">🚀</text>
      </svg>
    `;
  }

  if (visual === 'beacon-lit') {
    return `
      <svg class="story-art-svg" viewBox="0 0 420 180" aria-hidden="true">
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="45%" stop-color="#facc15" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#facc15" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect x="0" y="76" width="420" height="28" fill="url(#sunGlow)" opacity="0.55"/>
        <circle class="art-pulse" cx="210" cy="90" r="68" fill="url(#sunGlow)"/>
        <circle cx="210" cy="90" r="32" fill="#facc15" stroke="#fef9c3" stroke-width="3"/>
        <text x="210" y="100" text-anchor="middle" font-size="30">☀️</text>
        <text x="86" y="54" font-size="22">✨</text>
        <text x="320" y="58" font-size="22">✨</text>
        <text x="108" y="142" font-size="20">💎</text>
        <text x="302" y="142" font-size="20">🚀</text>
      </svg>
    `;
  }

  if (visual === 'earth-saved') {
    return `
      <svg class="story-art-svg" viewBox="0 0 420 180" aria-hidden="true">
        <defs>
          <radialGradient id="savedAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle class="art-pulse" cx="210" cy="92" r="76" fill="url(#savedAura)"/>
        <circle cx="210" cy="92" r="50" fill="#2563eb" stroke="#fde047" stroke-width="3"/>
        <path d="M 184 70 Q 204 64 212 78 Q 204 96 186 94 Z" fill="#22c55e"/>
        <path d="M 218 84 Q 238 82 246 104 Q 232 122 214 114 Z" fill="#16a34a"/>
        <path d="M 188 112 Q 204 118 210 132 Q 192 136 180 124 Z" fill="#4ade80"/>
        <text class="art-float" x="115" y="64" font-size="26">🚀</text>
        <text x="286" y="62" font-size="24">🎉</text>
        <text x="112" y="140" font-size="22">🌟</text>
        <text x="292" y="140" font-size="24">🤖</text>
      </svg>
    `;
  }

  // engineer-medal
  return `
    <svg class="story-art-svg" viewBox="0 0 420 180" aria-hidden="true">
      <circle class="art-pulse" cx="210" cy="84" r="64" fill="rgba(250,204,21,0.16)" stroke="#facc15" stroke-width="2" stroke-dasharray="6 5"/>
      <polygon points="186,120 176,166 202,152 210,166 218,152 244,166 234,120" fill="#e11d48"/>
      <circle cx="210" cy="82" r="44" fill="#eab308" stroke="#fef08a" stroke-width="4"/>
      <circle cx="210" cy="82" r="35" fill="#ca8a04" stroke="#fde047" stroke-width="1.5"/>
      <text x="210" y="92" text-anchor="middle" font-size="34">🏆</text>
      <text x="210" y="174" text-anchor="middle" fill="#fef08a" font-size="13" font-weight="800">⭐ ${totalStars} / 108</text>
      <text x="96" y="70" font-size="24">✨</text>
      <text x="306" y="70" font-size="24">✨</text>
    </svg>
  `;
}

/**
 * Renders the 3-scene Intro ("Operação: Luz da Terra!") or Grand Finale Ending cinematic.
 */
export function renderStoryCinematic(
  container,
  { mode = 'intro', lang = 'pt', t, totalStars = 0, synth = null, onComplete, onClose }
) {
  if (!container) return;
  const scenes = mode === 'ending' ? ENDING_SCENES : INTRO_SCENES;
  let index = 0;

  if (mode === 'ending') {
    synth?.playFanfare?.();
  }

  const paint = () => {
    const sc = scenes[index];
    const isLast = index === scenes.length - 1;
    const badge = lang === 'en' ? sc.badgeEn : sc.badgePt;
    const title = lang === 'en' ? sc.titleEn : sc.titlePt;
    const text = lang === 'en' ? sc.textEn : sc.textPt;

    const dots = scenes
      .map((_, i) => `<span class="story-dot ${i === index ? 'active' : i < index ? 'done' : ''}"></span>`)
      .join('');

    const ctaText = isLast
      ? mode === 'ending'
        ? t(lang, 'story.btnCelebrateDone')
        : t(lang, 'story.btnLaunchShip')
      : t(lang, 'story.btnNextScene');

    container.innerHTML = `
      <div class="modal-card story-modal ${mode === 'ending' ? 'story-ending' : ''}">
        <div class="story-top">
          <span class="story-badge">${escapeHtml(badge)}</span>
          <button type="button" class="mini-text-btn" data-story-skip="true">
            ${escapeHtml(t(lang, mode === 'ending' ? 'close' : 'story.btnSkip'))}
          </button>
        </div>

        <div class="story-stage">
          ${renderSceneArtwork(sc.visual, totalStars)}
        </div>

        <div class="story-copy">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(text)}</p>
        </div>

        <div class="story-footer">
          <div class="story-dots">${dots}</div>
          <div class="story-nav-btns">
            ${
              index > 0
                ? `<button type="button" class="btn btn-secondary btn-sm" data-story-prev="true">⬅️ ${escapeHtml(
                    t(lang, 'story.btnPrevScene')
                  )}</button>`
                : ''
            }
            <button type="button" class="btn btn-run" data-story-next="true">${escapeHtml(ctaText)}</button>
          </div>
        </div>
      </div>
    `;
    container.classList.remove('hidden');
  };

  paint();

  container.onclick = (event) => {
    if (event.target === container || event.target.closest('[data-story-skip]')) {
      container.classList.add('hidden');
      onComplete?.();
      onClose?.();
      return;
    }
    if (event.target.closest('[data-story-prev]')) {
      synth?.playClick?.();
      index = Math.max(0, index - 1);
      paint();
      return;
    }
    if (event.target.closest('[data-story-next]')) {
      if (index < scenes.length - 1) {
        synth?.playClick?.();
        index += 1;
        paint();
      } else {
        synth?.playRocketLaunch?.();
        container.classList.add('hidden');
        onComplete?.();
      }
    }
  };
}

/**
 * Renders the Planet Arrival Briefing Card when arriving at a new World for the first time.
 */
export function renderWorldArrivalModal(
  container,
  worldObj,
  { lang = 'pt', t, synth = null, onBegin, onOpenMap }
) {
  if (!container || !worldObj) return;
  const wStory = getWorldStory(worldObj.world);
  const worldName = lang === 'en' ? worldObj.nameEn : worldObj.namePt;
  const act = lang === 'en' ? wStory.actEn : wStory.actPt;
  const sector = lang === 'en' ? wStory.sectorEn : wStory.sectorPt;
  const arrival = lang === 'en' ? wStory.arrivalEn : wStory.arrivalPt;
  const upgrade = lang === 'en' ? wStory.upgradeEn : wStory.upgradePt;

  synth?.playFanfare?.();

  container.innerHTML = `
    <div class="modal-card story-modal arrival-modal">
      <div class="story-top">
        <span class="story-badge">${escapeHtml(act)} · ${escapeHtml(sector)}</span>
        <button type="button" class="icon-btn" data-arrival-begin="true" aria-label="${escapeHtml(t(lang, 'close'))}">✕</button>
      </div>

      <div class="arrival-hero">
        <div class="arrival-orb" style="background: radial-gradient(circle at 30% 30%, ${wStory.planetColor}, ${wStory.planetDark}); box-shadow: 0 0 38px ${wStory.planetColor}55;">
          <span class="arrival-orb-icon">${worldObj.icon}</span>
          <div class="arrival-ship-orbit">${renderStarshipSvg(46)}</div>
        </div>
        <h2>${escapeHtml(t(lang, 'worldLabel', { num: worldObj.world }))}: ${escapeHtml(worldName)}</h2>
        <span class="upgrade-pill">${escapeHtml(upgrade)}</span>
      </div>

      <div class="arrival-bubble">
        <span class="arrival-avatar" aria-hidden="true">🤖</span>
        <p>${escapeHtml(arrival)}</p>
      </div>

      <div class="story-footer arrival-footer">
        <button type="button" class="btn btn-secondary" data-arrival-map="true">🗺️ ${escapeHtml(t(lang, 'story.btnViewMap'))}</button>
        <button type="button" class="btn btn-run" data-arrival-begin="true">🚀 ${escapeHtml(t(lang, 'story.btnStartWorld'))}</button>
      </div>
    </div>
  `;
  container.classList.remove('hidden');

  container.onclick = (event) => {
    if (event.target.closest('[data-arrival-map]')) {
      synth?.playClick?.();
      container.classList.add('hidden');
      onOpenMap?.(worldObj.world);
      return;
    }
    if (event.target === container || event.target.closest('[data-arrival-begin]')) {
      synth?.playRocketLaunch?.();
      container.classList.add('hidden');
      onBegin?.();
    }
  };
}

/**
 * Renders the full Interactive Galaxy + Animated Planet Base Map with Flying Starship Estrela-1!
 */
export function renderGalaxyJourneyMap(
  container,
  progress,
  currentLevelId,
  {
    lang = 'pt',
    t,
    synth = null,
    initialWorld = null,
    flyFromLevelId = null,
    flyToLevelId = null,
    warpToWorld = false,
    onLaunchLevel,
    onReplayStory,
    onClose,
  }
) {
  if (!container) return;

  const findWorldOfLevel = (lvlId) => {
    for (const w of CAMPAIGN_WORLDS) {
      if (w.levels.some((l) => l.id === lvlId)) return w.world;
    }
    return 1;
  };

  let activeWorldNum =
    initialWorld ||
    (flyToLevelId ? findWorldOfLevel(flyToLevelId) : findWorldOfLevel(currentLevelId));
  let selectedLevelId = flyToLevelId || currentLevelId || 'w1-1';
  let shipLevelId = flyFromLevelId || selectedLevelId;
  let shipAngle = 0;
  let cinema = null;
  let biomeRenderer = null;
  let statusTimer = null;

  const showFlightPill = (text, tone = '') => {
    const pill = container.querySelector('#flight-status-pill');
    if (!pill) return;
    if (statusTimer) clearTimeout(statusTimer);
    pill.textContent = text;
    pill.className = `flight-status-pill ${tone}`.trim();
    statusTimer = setTimeout(() => {
      pill.classList.add('hidden');
    }, 1500);
  };

  const earthSaved = Number(progress?.starsByLevel?.['w5-6'] || 0) > 0;
  const totalStars = getTotalStars(progress);

  const getCoordForLevel = (worldObj, lvlId) => {
    const wStory = getWorldStory(worldObj.world);
    const idx = Math.max(0, worldObj.levels.findIndex((l) => l.id === lvlId));
    return wStory.baseCoords[idx] || wStory.baseCoords[0];
  };

  const renderFullMap = () => {
    const worldObj = CAMPAIGN_WORLDS.find((w) => w.world === activeWorldNum) || CAMPAIGN_WORLDS[0];
    const wStory = getWorldStory(worldObj.world);
    const pal = WORLD_PALETTES[worldObj.world] || WORLD_PALETTES[1];

    if (!worldObj.levels.some((l) => l.id === selectedLevelId)) {
      // Pick first uncompleted level in this world, or its first level
      const nextUnbeaten = worldObj.levels.find((l) => !progress.starsByLevel?.[l.id]);
      selectedLevelId = (nextUnbeaten || worldObj.levels[0]).id;
    }
    if (!worldObj.levels.some((l) => l.id === shipLevelId)) {
      shipLevelId = worldObj.levels[0].id;
    }

    const selLevel = worldObj.levels.find((l) => l.id === selectedLevelId) || worldObj.levels[0];
    const selStory = getLevelStory(selLevel.id);
    const selTitle = lang === 'en' ? selLevel.titleEn : selLevel.titlePt;
    const selBrief = lang === 'en' ? selStory.briefEn : selStory.briefPt;
    const worldName = lang === 'en' ? worldObj.nameEn : worldObj.namePt;
    const actTitle = lang === 'en' ? wStory.actEn : wStory.actPt;
    const upgrade = lang === 'en' ? wStory.upgradeEn : wStory.upgradePt;

    // 1. Galaxy Route Ribbon (Earth -> 5 Worlds -> Solar Beacon)
    const currentShipWorld = findWorldOfLevel(currentLevelId);
    const planetsHtml = CAMPAIGN_WORLDS.map((w) => {
      const ws = getWorldStory(w.world);
      const starsInW = w.levels.reduce((s, l) => s + Number(progress.starsByLevel?.[l.id] || 0), 0);
      const completedCount = w.levels.filter((l) => Number(progress.starsByLevel?.[l.id] || 0) > 0).length;
      const isSelected = w.world === activeWorldNum;
      const isShipHere = w.world === currentShipWorld;
      const isDone = completedCount === w.levels.length;
      const name = lang === 'en' ? w.nameEn : w.namePt;

      return `
        <button
          type="button"
          class="galaxy-node ${isSelected ? 'selected' : ''} ${isDone ? 'world-done' : ''}"
          data-map-world="${w.world}"
          title="${escapeHtml(name)}"
        >
          ${isShipHere ? '<span class="galaxy-ship-pin" aria-hidden="true">🚀</span>' : ''}
          <span
            class="galaxy-orb"
            style="background: radial-gradient(circle at 30% 30%, ${ws.planetColor}, ${ws.planetDark});"
          >
            ${w.icon}
          </span>
          <span class="galaxy-node-label">${escapeHtml(t(lang, 'worldLabel', { num: w.world }))}</span>
          <span class="galaxy-node-stars">⭐ ${starsInW}/18</span>
        </button>
      `;
    }).join('<span class="galaxy-link" aria-hidden="true"></span>');

    // 2. Planet Surface Base Flight SVG
    const routePath = buildSmoothRoutePath(wStory.baseCoords);
    const shipCoord = getCoordForLevel(worldObj, shipLevelId);

    const baseNodesHtml = worldObj.levels
      .map((lvl, idx) => {
        const pt = wStory.baseCoords[idx];
        const earned = Number(progress.starsByLevel?.[lvl.id] || 0);
        const isSel = lvl.id === selectedLevelId;
        const isCurrent = lvl.id === currentLevelId;
        const isBoss = idx === worldObj.levels.length - 1;
        const shortTitle = lang === 'en' ? lvl.titleEn : lvl.titlePt;
        const region = getRegionForLevel(worldObj.world, lvl.id, idx);
        const regionLabel = `${region.flag} ${lang === 'en' ? region.shortEn : region.shortPt}`;
        const starsStr = [1, 2, 3].map((n) => (n <= earned ? '★' : '☆')).join('');
        const iconText = lvl.isBugHunt ? '🐛' : isBoss ? '👑' : String(lvl.index);

        return `
          <g
            class="map-base-node ${isSel ? 'is-selected' : ''} ${earned > 0 ? 'is-cleared' : ''} ${isCurrent ? 'is-current' : ''}"
            data-map-level="${lvl.id}"
            transform="translate(${pt.x}, ${pt.y})"
            style="--node-delay:${idx * 95}ms;"
            role="button"
            tabindex="0"
          >
            ${
              isSel
                ? `<circle class="base-radar-ring" cx="0" cy="0" r="30" fill="none" stroke="#facc15" stroke-width="2.5" stroke-dasharray="6 4"/>`
                : ''
            }
            <circle
              class="base-pad-outer"
              cx="0"
              cy="0"
              r="22"
              fill="${earned > 0 ? '#065f46' : '#1e293b'}"
              stroke="${isSel ? '#facc15' : earned > 0 ? '#34d399' : wStory.planetColor}"
              stroke-width="${isSel ? '3.5' : '2.5'}"
            />
            <circle cx="0" cy="0" r="15" fill="${earned > 0 ? '#10b981' : '#0f172a'}" opacity="0.88"/>
            <text x="0" y="5" text-anchor="middle" fill="#ffffff" font-size="${lvl.isBugHunt || isBoss ? '15' : '14'}" font-weight="800">${iconText}</text>
            <text x="0" y="-28" text-anchor="middle" fill="${earned > 0 ? '#facc15' : '#475569'}" font-size="13" font-weight="800">${starsStr}</text>
            <text x="0" y="43" text-anchor="middle" fill="#f8fafc" font-size="11.5" font-weight="800">${escapeHtml(regionLabel)}</text>
            <title>${escapeHtml(shortTitle)} — ${escapeHtml(lang === 'en' ? region.hubEn : region.hubPt)}</title>
          </g>
        `;
      })
      .join('');

    container.innerHTML = `
      <div class="modal-card journey-modal">
        <div class="modal-head journey-head">
          <div>
            <h3>🗺️ ${escapeHtml(t(lang, 'story.mapTitle'))}</h3>
            <p class="small muted">${escapeHtml(t(lang, 'story.mapSub', { stars: totalStars }))}</p>
          </div>
          <div class="head-actions">
            <button type="button" class="mini-text-btn" data-replay-story="intro">📖 ${escapeHtml(t(lang, 'story.btnReplayIntro'))}</button>
            ${
              earthSaved
                ? `<button type="button" class="mini-text-btn" data-replay-story="ending">🏆 ${escapeHtml(
                    t(lang, 'story.btnReplayEnding')
                  )}</button>`
                : ''
            }
            <button type="button" class="icon-btn" data-close-modal="true" aria-label="${escapeHtml(t(lang, 'close'))}">✕</button>
          </div>
        </div>

        <!-- GALAXY ROUTE RIBBON -->
        <div class="galaxy-ribbon">
          <div class="galaxy-endpoint ${earthSaved ? 'earth-saved' : ''}" title="Terra">
            <span class="endpoint-icon">🌍</span>
            <span class="endpoint-label">${escapeHtml(t(lang, 'story.earthLabel'))}</span>
          </div>
          <span class="galaxy-link" aria-hidden="true"></span>
          ${planetsHtml}
          <span class="galaxy-link" aria-hidden="true"></span>
          <div class="galaxy-endpoint ${earthSaved ? 'beacon-lit' : ''}" title="Farol Solar">
            <span class="endpoint-icon">${earthSaved ? '☀️' : '💡'}</span>
            <span class="endpoint-label">${escapeHtml(t(lang, 'story.beaconLabel'))}</span>
          </div>
        </div>

        <!-- ANIMATED PLANET FLIGHT MAP -->
        <div
          class="planet-flight-stage"
          style="background: linear-gradient(180deg, ${pal.bgTop}, ${pal.bgBottom});"
        >
          <div class="planet-stage-bar">
            <span class="act-pill">${worldObj.icon} ${escapeHtml(actTitle)} — ${escapeHtml(worldName)}</span>
            <div class="planet-stage-actions">
              <button type="button" class="mini-text-btn replay-orbital-btn" data-replay-orbital="true">
                🎬 ${escapeHtml(lang === 'en' ? 'Re-entry' : 'Reentrada')}
              </button>
              <span class="upgrade-pill-sm">${escapeHtml(upgrade)}</span>
            </div>
          </div>

          <div class="flight-svg-wrap">
            <!-- 60fps UNIQUE PLANET BIOME LANDSCAPE + ORBITAL ENTRY/EXIT FX -->
            <canvas id="planet-biome-canvas" class="planet-biome-canvas" aria-hidden="true"></canvas>

            <svg class="planet-route-svg" viewBox="0 0 760 270" preserveAspectRatio="xMidYMid meet">
              <!-- Twinkling Starfield -->
              <circle cx="52" cy="36" r="1.8" fill="#ffffff" opacity="0.65"/>
              <circle cx="145" cy="54" r="1.4" fill="#bae6fd" opacity="0.7"/>
              <circle cx="255" cy="34" r="2" fill="#fef08a" opacity="0.75"/>
              <circle cx="385" cy="48" r="1.5" fill="#ffffff" opacity="0.6"/>
              <circle cx="510" cy="36" r="2.2" fill="#e9d5ff" opacity="0.75"/>
              <circle cx="645" cy="44" r="1.6" fill="#ffffff" opacity="0.7"/>
              <circle cx="718" cy="68" r="1.8" fill="#fde047" opacity="0.7"/>
              <!-- Glowing Constellation Flight Path -->
              <path d="${routePath}" fill="none" stroke="${wStory.planetColor}" stroke-width="8" stroke-opacity="0.18" stroke-linecap="round"/>
              <path class="flight-route-dash" d="${routePath}" fill="none" stroke="${wStory.ringColor}" stroke-width="3.2" stroke-dasharray="9 7" stroke-linecap="round"/>
              <!-- 6 Planetary Base Nodes -->
              ${baseNodesHtml}
            </svg>

            <!-- 60fps PLASMA EXHAUST, SHOCKWAVE & HYPERSPACE FX CANVAS -->
            <canvas id="flight-fx-canvas" class="flight-fx-canvas" aria-hidden="true"></canvas>

            <!-- LIVE FLIGHT STATUS / TURBO BOOST BANNER -->
            <div id="flight-status-pill" class="flight-status-pill hidden" aria-live="polite"></div>

            <!-- AAA ENGINE LIVE LOD & STREAMING TELEMETRY BAR -->
            <div id="planet-aaa-telemetry" class="planet-aaa-telemetry" aria-live="polite"></div>

            <!-- FLYING STARSHIP ESTRELA-1 OVERLAY (CURVED 60FPS BEZIER FLIGHT!) -->
            <div
              id="flying-starship"
              class="flying-starship"
              style="left:${(shipCoord.x / 760) * 100}%; top:${((shipCoord.y - 44) / 270) * 100}%; --ship-rot:${shipAngle}deg;"
            >
              ${renderStarshipSvg(54)}
            </div>
          </div>
        </div>

        <!-- SELECTED MISSION BRIEFING DECK -->
        <div class="mission-deck">
          <div class="mission-deck-info">
            <div class="mission-deck-top">
              <span class="level-pill">${escapeHtml(t(lang, 'levelLabel', { world: selLevel.world, index: selLevel.index }))}</span>
              <span class="region-hub-pill">${escapeHtml(
                `${getRegionForLevel(selLevel.world, selLevel.id, selLevel.index - 1).flag} ${
                  lang === 'en'
                    ? getRegionForLevel(selLevel.world, selLevel.id, selLevel.index - 1).hubEn
                    : getRegionForLevel(selLevel.world, selLevel.id, selLevel.index - 1).hubPt
                }`
              )}</span>
              <strong>${selLevel.isBugHunt ? '🐛 ' : ''}${escapeHtml(selTitle)}</strong>
            </div>
            <p class="mission-deck-story">🤖 ${escapeHtml(selBrief)}</p>
            <p class="mission-deck-fact">✨ ${escapeHtml(
              lang === 'en'
                ? getRegionForLevel(selLevel.world, selLevel.id, selLevel.index - 1).factEn
                : getRegionForLevel(selLevel.world, selLevel.id, selLevel.index - 1).factPt
            )}</p>
          </div>
          <button type="button" class="btn btn-run mission-launch-btn" data-launch-level="${selLevel.id}">
            🚀 ${escapeHtml(t(lang, 'story.btnLandBase', { world: selLevel.world, index: selLevel.index }))}
          </button>
        </div>
      </div>
    `;
    container.classList.remove('hidden');

    cinema?.destroy();
    biomeRenderer?.destroy();
    const biomeCanvas = container.querySelector('#planet-biome-canvas');
    const telemetryEl = container.querySelector('#planet-aaa-telemetry');
    biomeRenderer = new PlanetBiomeRenderer(biomeCanvas, activeWorldNum, { telemetryEl, lang });
    biomeRenderer.start();

    const fxCanvas = container.querySelector('#flight-fx-canvas');
    const shipEl = container.querySelector('#flying-starship');
    cinema = new FlightCinemaController(fxCanvas, shipEl);
    cinema.resize();
  };

  const flyShipTo = (targetLevelId) => {
    const worldObj = CAMPAIGN_WORLDS.find((w) => w.world === activeWorldNum) || CAMPAIGN_WORLDS[0];
    const wStory = getWorldStory(worldObj.world);
    const fromRegion = getRegionForLevel(worldObj.world, shipLevelId, 0);
    const toRegion = getRegionForLevel(worldObj.world, targetLevelId, 0);
    const fromCoord = getCoordForLevel(worldObj, shipLevelId);
    const toCoord = getCoordForLevel(worldObj, targetLevelId);
    const toIdx = Math.max(1, worldObj.levels.findIndex((l) => l.id === targetLevelId));
    shipLevelId = targetLevelId;

    if (cinema && Math.hypot(toCoord.x - fromCoord.x, toCoord.y - fromCoord.y) > 4) {
      const fromName = `${fromRegion.flag} ${lang === 'en' ? fromRegion.shortEn : fromRegion.shortPt}`;
      const toName = `${toRegion.flag} ${lang === 'en' ? toRegion.shortEn : toRegion.shortPt}`;
      showFlightPill(
        lang === 'en'
          ? `🚀 ${fromName} → ${toName} · Tap sky for ⚡ Turbo!`
          : `🚀 ${fromName} → ${toName} · Toque no céu p/ ⚡ Turbo!`
      );
      cinema.flyBetweenBases({
        from: fromCoord,
        to: toCoord,
        segmentIndex: toIdx,
        accentColor: wStory.planetColor,
        onArrive: () => {
          synth?.playSnap?.();
          showFlightPill(
            lang === 'en' ? `✨ Landed at ${toName}!` : `✨ Pousou em ${toName}!`,
            'good'
          );
        },
      });
    }
  };

  const triggerWorldWarp = (nextWorldNum) => {
    const prevWorldNum = activeWorldNum;
    const targetWorldObj = CAMPAIGN_WORLDS.find((w) => w.world === nextWorldNum) || CAMPAIGN_WORLDS[0];
    const wStory = getWorldStory(targetWorldObj.world);
    const wName = lang === 'en' ? targetWorldObj.nameEn : targetWorldObj.namePt;
    synth?.playRocketLaunch?.();
    showFlightPill(
      lang === 'en'
        ? `🚀 LIFTOFF → 🌌 GALAXY FLIGHT → ${targetWorldObj.icon} ${wName}!`
        : `🚀 DECOLAGEM → 🌌 VOO NA GALÁXIA → ${targetWorldObj.icon} ${wName}!`,
      'warp'
    );

    // Act 3 & 4: Atmospheric Re-entry -> Touchdown -> Staggered Level Reveal (6/6 Chunks)!
    const enterNewPlanet = () => {
      activeWorldNum = nextWorldNum;
      const newWorld = CAMPAIGN_WORLDS.find((w) => w.world === activeWorldNum) || CAMPAIGN_WORLDS[0];
      selectedLevelId = newWorld.levels[0]?.id || selectedLevelId;
      shipLevelId = selectedLevelId;
      shipAngle = 0;
      renderFullMap();
      const svgEl = container.querySelector('.planet-route-svg');
      svgEl?.classList.add('streaming-chunks');
      setTimeout(() => svgEl?.classList.remove('streaming-chunks'), 1100);
      showFlightPill(
        lang === 'en'
          ? `☄️ ENTERING ${targetWorldObj.icon} ${wName} · Opening 6 Stages!`
          : `☄️ ENTRANDO EM ${targetWorldObj.icon} ${wName} · Abrindo 6 Fases!`,
        'good'
      );
      synth?.playReentry?.();
      biomeRenderer?.playOrbitalTransition('descent', 0.95, () => {
        const destCoord = getCoordForLevel(newWorld, selectedLevelId);
        synth?.playSnap?.();
        cinema?.emitRing(destCoord, wStory.planetColor);
        cinema?.emitBurst(destCoord, ['#facc15', wStory.planetColor, '#ffffff'], 24);
      });
    };

    // Act 2: Full 60fps Interplanetary Galaxy Flight + 4.4x Camera Zoom into Destination Planet!
    const runGalaxyCruise = () => {
      const wrapEl = container.querySelector('.flight-svg-wrap');
      wrapEl?.classList.add('galaxy-transit');
      showFlightPill(
        lang === 'en'
          ? `🌌 Flying across the Galaxy → ${targetWorldObj.icon} ${wName}!`
          : `🌌 Voando pela Galáxia → ${targetWorldObj.icon} ${wName}!`,
        'warp'
      );
      if (biomeRenderer) {
        biomeRenderer.playGalaxyFlight(prevWorldNum, nextWorldNum, 1.65, () => {
          wrapEl?.classList.remove('galaxy-transit');
          enterNewPlanet();
        });
      } else {
        wrapEl?.classList.remove('galaxy-transit');
        enterNewPlanet();
      }
    };

    // Act 1: Vertical rocket liftoff from current base with golden plasma burst!
    const shipEl = container.querySelector('#flying-starship');
    if (shipEl) {
      shipEl.classList.add('ship-liftoff');
    }
    const curWorld = CAMPAIGN_WORLDS.find((w) => w.world === activeWorldNum) || CAMPAIGN_WORLDS[0];
    cinema?.emitBurst(getCoordForLevel(curWorld, shipLevelId), ['#facc15', '#f97316', '#ffffff'], 20);

    if (biomeRenderer) {
      biomeRenderer.playOrbitalTransition('liftoff', 0.52, runGalaxyCruise);
    } else {
      runGalaxyCruise();
    }
  };

  renderFullMap();

  // If opened with an interplanetary warp or automatic base-to-base flight!
  if (warpToWorld) {
    const worldObj = CAMPAIGN_WORLDS.find((w) => w.world === activeWorldNum) || CAMPAIGN_WORLDS[0];
    const wStory = getWorldStory(worldObj.world);
    const wName = lang === 'en' ? worldObj.nameEn : worldObj.namePt;
    setTimeout(() => {
      synth?.playRocketLaunch?.();
      showFlightPill(
        `${worldObj.icon} ${lang === 'en' ? 'HYPERSPACE JUMP' : 'SALTO NO HIPERESPAÇO'} → ${wName}!`,
        'warp'
      );
      cinema?.playHyperspaceWarp({
        accentColor: wStory.planetColor,
        onDone: () => {
          const destCoord = getCoordForLevel(worldObj, selectedLevelId);
          cinema?.emitRing(destCoord, '#34d399');
          cinema?.emitBurst(destCoord, ['#facc15', wStory.planetColor, '#ffffff'], 22);
        },
      });
    }, 100);
  } else if (flyFromLevelId && flyToLevelId && flyFromLevelId !== flyToLevelId) {
    setTimeout(() => {
      synth?.playRocketLaunch?.();
      flyShipTo(flyToLevelId);
    }, 160);
  }

  container.onclick = (event) => {
    if (event.target === container || event.target.closest('[data-close-modal]')) {
      cinema?.destroy();
      biomeRenderer?.destroy();
      container.classList.add('hidden');
      onClose?.();
      return;
    }

    const replayBtn = event.target.closest('[data-replay-story]');
    if (replayBtn) {
      cinema?.destroy();
      biomeRenderer?.destroy();
      synth?.playClick?.();
      onReplayStory?.(replayBtn.dataset.replayStory);
      return;
    }

    const replayOrbitalBtn = event.target.closest('[data-replay-orbital]');
    if (replayOrbitalBtn) {
      triggerWorldWarp(activeWorldNum);
      return;
    }

    const worldBtn = event.target.closest('[data-map-world]');
    if (worldBtn) {
      const nextWorld = Number(worldBtn.dataset.mapWorld);
      if (nextWorld !== activeWorldNum) {
        triggerWorldWarp(nextWorld);
      }
      return;
    }

    const baseNode = event.target.closest('[data-map-level]');
    if (baseNode) {
      const lvlId = baseNode.dataset.mapLevel;
      if (lvlId !== selectedLevelId) {
        const prevShip = shipLevelId;
        selectedLevelId = lvlId;
        synth?.playRocketLaunch?.();
        // Keep ship at previous base during re-render, then fly along the curved Bezier path!
        shipLevelId = prevShip;
        renderFullMap();
        requestAnimationFrame(() => flyShipTo(lvlId));
      } else {
        // Clicking the already-selected base again launches straight in!
        cinema?.destroy();
        biomeRenderer?.destroy();
        synth?.playRocketLaunch?.();
        container.classList.add('hidden');
        onLaunchLevel?.(lvlId);
      }
      return;
    }

    // Interactive Turbo Boost when tapping the sky during planetary or galaxy flight!
    if (event.target.closest('.flight-svg-wrap')) {
      if (cinema?.triggerTurboBoost() || biomeRenderer?.triggerGalaxyTurbo()) {
        synth?.playGiggle?.();
        showFlightPill(lang === 'en' ? '⚡ SPACE TURBO BOOST!!' : '⚡ TURBO ESPACIAL!!', 'turbo');
      }
      return;
    }

    const launchBtn = event.target.closest('[data-launch-level]');
    if (launchBtn) {
      const targetId = launchBtn.dataset.launchLevel;
      const shipEl = container.querySelector('#flying-starship');
      synth?.playRocketLaunch?.();
      if (shipEl) {
        shipEl.classList.add('ship-landing');
        setTimeout(() => {
          cinema?.destroy();
          container.classList.add('hidden');
          onLaunchLevel?.(targetId);
        }, 280);
      } else {
        cinema?.destroy();
        container.classList.add('hidden');
        onLaunchLevel?.(targetId);
      }
    }
  };
}
