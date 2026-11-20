/**
 * AstroBit Creative Workshop UI ("🛠️ Oficina Criadora de Fases").
 * Lets kids and parents paint custom space puzzles, test them immediately on the live stage,
 * save a local library of family levels, and share playable `?custom=...` URLs with zero backend!
 */

import {
  WORKSHOP_TEMPLATES,
  createBlankWorkshopDraft,
  resizeDraftRows,
  validateWorkshopDraft,
  normalizeCustomLevel,
  encodeCustomLevel,
} from '../engine/custom-level.js?v=4.0';
import { WORLD_PALETTES } from '../renderer/robot-skins.js?v=4.0';

const BRUSHES = [
  { char: '.', icon: '🟦', pt: 'Piso', en: 'Floor' },
  { char: '#', icon: '🪨', pt: 'Rocha', en: 'Rock' },
  { char: ' ', icon: '🌌', pt: 'Espaço', en: 'Void' },
  { char: '>', icon: '🤖', pt: 'Robô', en: 'Robot' },
  { char: '*', icon: '💎', pt: 'Cristal', en: 'Crystal' },
  { char: 'G', icon: '★', pt: 'Estrela', en: 'Goal' },
  { char: 'a', icon: '🔵', pt: 'Botão A', en: 'Switch A' },
  { char: 'A', icon: '⚡', pt: 'Laser A', en: 'Laser A' },
  { char: '=', icon: '🌉', pt: 'Ponte', en: 'Bridge' },
  { char: '1', icon: '🟣', pt: 'Portal 1', en: 'Portal 1' },
  { char: '2', icon: '🔷', pt: 'Portal 2', en: 'Portal 2' },
];

const WORLD_ICONS = [
  { num: 1, icon: '🌙' },
  { num: 2, icon: '⚙️' },
  { num: 3, icon: '⚡' },
  { num: 4, icon: '🛰️' },
  { num: 5, icon: '🌌' },
];

const EXTRA_TOGGLES = [
  { key: 'repeat', icon: '🔁', pt: 'Repetir', en: 'Repeat' },
  { key: 'if', icon: '🔎', pt: 'Se', en: 'If' },
  { key: 'call_f1', icon: '⚡', pt: 'F1', en: 'F1' },
  { key: 'call_f2', icon: '🌟', pt: 'F2', en: 'F2' },
];

const GRID_PRESETS = [
  { w: 6, h: 4, label: '6×4' },
  { w: 8, h: 5, label: '8×5' },
  { w: 10, h: 6, label: '10×6' },
];

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function tileGlyph(ch) {
  switch (ch) {
    case '>':
    case '^':
    case 'v':
    case '<':
      return '🤖';
    case '*':
      return '💎';
    case 'G':
      return '★';
    case '#':
      return '🪨';
    case ' ':
      return '';
    case 'a':
      return 'A';
    case 'b':
      return 'B';
    case 'A':
      return '⚡';
    case 'B':
      return '⚡';
    case '=':
      return '══';
    case '1':
      return '🌀1';
    case '2':
      return '🌀2';
    default:
      return '';
  }
}

function tileClass(ch) {
  if (ch === '#') return 'wt-wall';
  if (ch === ' ') return 'wt-void';
  if (ch === 'G') return 'wt-goal';
  if (ch === '*') return 'wt-crystal';
  if (ch === '>' || ch === '^' || ch === 'v' || ch === '<') return 'wt-robot';
  if (ch === 'a' || ch === 'b') return 'wt-button';
  if (ch === 'A' || ch === 'B') return 'wt-laser';
  if (ch === '=') return 'wt-bridge';
  if (ch === '1') return 'wt-portal1';
  if (ch === '2') return 'wt-portal2';
  return 'wt-floor';
}

function formatIssue(issue, lang) {
  const isEn = lang === 'en';
  switch (issue.code) {
    case 'missing_robot':
      return isEn ? 'Place 🤖 AstroBit on the board!' : 'Coloque o 🤖 AstroBit no tabuleiro!';
    case 'multiple_robots':
      return isEn ? 'Keep only 1 🤖 AstroBit on the board.' : 'Deixe apenas 1 🤖 AstroBit no tabuleiro.';
    case 'missing_objective':
      return isEn ? 'Place at least 1 💎 Crystal or ★ Goal!' : 'Coloque pelo menos 1 💎 Cristal ou ★ Estrela!';
    case 'unpaired_portal':
      return isEn
        ? `Portal ${issue.portalId} needs exactly 2 spots (found ${issue.count})!`
        : `O Portal ${issue.portalId} precisa de exatamente 2 pontos (há ${issue.count})!`;
    default:
      return isEn ? 'Check your board tiles.' : 'Confira as peças do tabuleiro.';
  }
}

/**
 * Renders the interactive Creative Level Workshop inside the modal backdrop.
 */
export function renderWorkshopModal(
  container,
  {
    initialDraft = null,
    savedLevels = [],
    lang = 'pt',
    t,
    synth = null,
    onPlayCustom,
    onSaveCustom,
    onDeleteSaved,
    onClose,
  }
) {
  if (!container) return;

  let draft = initialDraft
    ? JSON.parse(JSON.stringify(initialDraft))
    : createBlankWorkshopDraft(8, 5);
  let activeBrush = '*';
  let isPainting = false;
  let toastMessage = '';
  let localSaved = [...savedLevels];

  const paintCell = (x, y) => {
    const rows = draft.rows.map((r) => r.split(''));
    if (!rows[y] || x < 0 || x >= rows[y].length) return false;
    const prev = rows[y][x];
    if (prev === activeBrush) return false;

    // Ensure unique Robot start
    if (activeBrush === '>') {
      for (let ry = 0; ry < rows.length; ry++) {
        for (let rx = 0; rx < rows[ry].length; rx++) {
          if ('^>v<'.includes(rows[ry][rx])) rows[ry][rx] = '.';
        }
      }
    }

    // Ensure unique Goal tile
    if (activeBrush === 'G') {
      for (let ry = 0; ry < rows.length; ry++) {
        for (let rx = 0; rx < rows[ry].length; rx++) {
          if (rows[ry][rx] === 'G') rows[ry][rx] = '.';
        }
      }
    }

    // Cap paired portals cleanly at 2
    if (activeBrush === '1' || activeBrush === '2') {
      const existing = [];
      for (let ry = 0; ry < rows.length; ry++) {
        for (let rx = 0; rx < rows[ry].length; rx++) {
          if (rows[ry][rx] === activeBrush) existing.push({ rx, ry });
        }
      }
      if (existing.length >= 2) {
        rows[existing[0].ry][existing[0].rx] = '.';
      }
    }

    rows[y][x] = activeBrush;
    draft.rows = rows.map((r) => r.join(''));
    return true;
  };

  const render = () => {
    const check = validateWorkshopDraft(draft);
    const pal = WORLD_PALETTES[draft.world] || WORLD_PALETTES[1];
    const gridH = draft.rows.length;
    const gridW = draft.rows[0]?.length || 8;

    const brushesHtml = BRUSHES.map((b) => {
      const label = lang === 'en' ? b.en : b.pt;
      const active = activeBrush === b.char ? 'active' : '';
      return `
        <button type="button" class="brush-btn ${active}" data-brush="${escapeHtml(b.char)}">
          <span>${b.icon}</span>
          <span>${escapeHtml(label)}</span>
        </button>
      `;
    }).join('');

    const cellsHtml = draft.rows
      .map((rowStr, y) =>
        rowStr
          .split('')
          .map((ch, x) => {
            const cls = tileClass(ch);
            const glyph = tileGlyph(ch);
            return `<button type="button" class="ws-cell ${cls}" data-cx="${x}" data-cy="${y}" aria-label="${x},${y}">${glyph}</button>`;
          })
          .join('')
      )
      .join('');

    const worldBtnsHtml = WORLD_ICONS.map(
      (w) => `
        <button type="button" class="ws-chip ${draft.world === w.num ? 'active' : ''}" data-ws-world="${w.num}">
          ${w.icon}
        </button>
      `
    ).join('');

    const sizeBtnsHtml = GRID_PRESETS.map(
      (sz) => `
        <button type="button" class="ws-chip ${gridW === sz.w && gridH === sz.h ? 'active' : ''}" data-ws-size="${sz.w}x${sz.h}">
          ${sz.label}
        </button>
      `
    ).join('');

    const templateBtnsHtml = WORKSHOP_TEMPLATES.map(
      (tpl) => `
        <button type="button" class="ws-chip" data-ws-tpl="${tpl.id}">
          🎲 ${escapeHtml(lang === 'en' ? tpl.nameEn : tpl.namePt)}
        </button>
      `
    ).join('');

    const extrasHtml = EXTRA_TOGGLES.map((ex) => {
      const on = (draft.extras || []).includes(ex.key);
      return `
        <button type="button" class="ws-chip ${on ? 'active' : ''}" data-ws-extra="${ex.key}">
          ${ex.icon} ${escapeHtml(lang === 'en' ? ex.en : ex.pt)}
        </button>
      `;
    }).join('');

    const savedHtml =
      localSaved.length > 0
        ? `
          <div class="ws-saved-strip">
            <span class="ws-saved-label">💾 ${escapeHtml(t(lang, 'workshop.savedLabel'))}:</span>
            <div class="ws-saved-list">
              ${localSaved
                .map(
                  (item, idx) => `
                    <div class="ws-saved-chip">
                      <button type="button" class="ws-saved-open" data-load-saved="${idx}">${escapeHtml(item.title)}</button>
                      <button type="button" class="ws-saved-del" data-del-saved="${idx}" title="✕">✕</button>
                    </div>
                  `
                )
                .join('')}
            </div>
          </div>
        `
        : '';

    const statusHtml = toastMessage
      ? `<span class="ws-status good">${escapeHtml(toastMessage)}</span>`
      : check.valid
      ? `<span class="ws-status good">✅ ${escapeHtml(t(lang, 'workshop.ready'))}</span>`
      : `<span class="ws-status warn">⚠️ ${escapeHtml(formatIssue(check.issues[0], lang))}</span>`;

    container.innerHTML = `
      <div class="modal-card workshop-modal">
        <div class="modal-head journey-head">
          <div>
            <h3>🛠️ ${escapeHtml(t(lang, 'workshop.title'))}</h3>
            <p class="small muted">${escapeHtml(t(lang, 'workshop.sub'))}</p>
          </div>
          <button type="button" class="icon-btn" data-close-modal="true" aria-label="${escapeHtml(t(lang, 'close'))}">✕</button>
        </div>

        <div class="ws-body">
          <!-- Settings Row -->
          <div class="ws-toolbar">
            <input
              id="ws-title-input"
              class="ws-title-input"
              type="text"
              maxlength="42"
              value="${escapeHtml(draft.title)}"
              placeholder="${escapeHtml(t(lang, 'workshop.titlePlaceholder'))}"
            />
            <div class="ws-group" title="Planeta">${worldBtnsHtml}</div>
            <div class="ws-group" title="Tamanho">${sizeBtnsHtml}</div>
            <div class="ws-group">${templateBtnsHtml}</div>
          </div>

          <!-- Brush Palette -->
          <div class="ws-brushes" role="radiogroup">${brushesHtml}</div>

          <!-- Interactive Paintable Space Grid -->
          <div
            class="ws-grid-stage"
            style="--ws-bg-top:${pal.bgTop}; --ws-bg-bot:${pal.bgBottom}; --ws-floor:${pal.floor}; --ws-floor-border:${pal.floorBorder}; --ws-wall:${pal.wallTop};"
          >
            <div class="ws-grid" style="grid-template-columns: repeat(${gridW}, 1fr);">
              ${cellsHtml}
            </div>
          </div>

          <!-- Extra Pieces & Par Target -->
          <div class="ws-options-row">
            <div class="ws-group">
              <span class="ws-opt-label">${escapeHtml(t(lang, 'workshop.piecesLabel'))}:</span>
              ${extrasHtml}
            </div>
            <div class="ws-group">
              <span class="ws-opt-label">⭐ 3★ ≤</span>
              <button type="button" class="step-pill-btn" data-ws-par="-1">−</button>
              <strong class="ws-par-val">${draft.parBlocks}</strong>
              <button type="button" class="step-pill-btn" data-ws-par="1">+</button>
            </div>
          </div>

          ${savedHtml}
        </div>

        <!-- Bottom Action Bar -->
        <div class="ws-footer">
          ${statusHtml}
          <div class="ws-footer-btns">
            <button type="button" class="btn btn-secondary btn-sm" data-ws-save="true" ${check.valid ? '' : 'disabled'}>
              💾 ${escapeHtml(t(lang, 'workshop.btnSave'))}
            </button>
            <button type="button" class="btn btn-step btn-sm" data-ws-share="true" ${check.valid ? '' : 'disabled'}>
              🔗 ${escapeHtml(t(lang, 'workshop.btnShare'))}
            </button>
            <button type="button" class="btn btn-run" data-ws-play="true" ${check.valid ? '' : 'disabled'}>
              ▶️ ${escapeHtml(t(lang, 'workshop.btnPlay'))}
            </button>
          </div>
        </div>
      </div>
    `;
    container.classList.remove('hidden');

    const titleInput = container.querySelector('#ws-title-input');
    if (titleInput) {
      titleInput.oninput = () => {
        draft.title = titleInput.value;
      };
    }
  };

  render();

  container.onpointerdown = (event) => {
    const cell = event.target.closest('.ws-cell');
    if (!cell) return;
    isPainting = true;
    toastMessage = '';
    const x = Number(cell.dataset.cx);
    const y = Number(cell.dataset.cy);
    if (paintCell(x, y)) {
      synth?.playSnap?.();
      render();
    }
  };

  container.onpointerover = (event) => {
    if (!isPainting) return;
    const cell = event.target.closest('.ws-cell');
    if (!cell) return;
    const x = Number(cell.dataset.cx);
    const y = Number(cell.dataset.cy);
    if (paintCell(x, y)) {
      render();
    }
  };

  const stopPaint = () => {
    isPainting = false;
  };
  globalThis.addEventListener('pointerup', stopPaint, { passive: true });

  container.onclick = async (event) => {
    if (event.target === container || event.target.closest('[data-close-modal]')) {
      globalThis.removeEventListener('pointerup', stopPaint);
      container.onpointerdown = null;
      container.onpointerover = null;
      container.classList.add('hidden');
      onClose?.();
      return;
    }

    const brushBtn = event.target.closest('[data-brush]');
    if (brushBtn) {
      activeBrush = brushBtn.dataset.brush;
      toastMessage = '';
      synth?.playClick?.();
      render();
      return;
    }

    const worldBtn = event.target.closest('[data-ws-world]');
    if (worldBtn) {
      draft.world = Number(worldBtn.dataset.wsWorld);
      synth?.playClick?.();
      render();
      return;
    }

    const sizeBtn = event.target.closest('[data-ws-size]');
    if (sizeBtn) {
      const [w, h] = sizeBtn.dataset.wsSize.split('x').map(Number);
      draft.rows = resizeDraftRows(draft.rows, w, h);
      synth?.playClick?.();
      render();
      return;
    }

    const tplBtn = event.target.closest('[data-ws-tpl]');
    if (tplBtn) {
      const tpl = WORKSHOP_TEMPLATES.find((x) => x.id === tplBtn.dataset.wsTpl);
      if (tpl) {
        draft = {
          title: lang === 'en' ? tpl.nameEn : tpl.namePt,
          world: tpl.world,
          rows: [...tpl.rows],
          parBlocks: tpl.parBlocks,
          extras: [...tpl.extras],
          bridges: {},
        };
        toastMessage = '';
        synth?.playSnap?.();
        render();
      }
      return;
    }

    const extraBtn = event.target.closest('[data-ws-extra]');
    if (extraBtn) {
      const key = extraBtn.dataset.wsExtra;
      const set = new Set(draft.extras || []);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      draft.extras = [...set];
      synth?.playClick?.();
      render();
      return;
    }

    const parBtn = event.target.closest('[data-ws-par]');
    if (parBtn) {
      const delta = Number(parBtn.dataset.wsPar);
      draft.parBlocks = Math.max(2, Math.min(30, (Number(draft.parBlocks) || 8) + delta));
      synth?.playClick?.();
      render();
      return;
    }

    const loadSavedBtn = event.target.closest('[data-load-saved]');
    if (loadSavedBtn) {
      const idx = Number(loadSavedBtn.dataset.loadSaved);
      if (localSaved[idx]) {
        draft = JSON.parse(JSON.stringify(localSaved[idx]));
        toastMessage = '';
        synth?.playClick?.();
        render();
      }
      return;
    }

    const delSavedBtn = event.target.closest('[data-del-saved]');
    if (delSavedBtn) {
      const idx = Number(delSavedBtn.dataset.delSaved);
      localSaved.splice(idx, 1);
      onDeleteSaved?.(idx);
      synth?.playRemove?.();
      render();
      return;
    }

    if (event.target.closest('[data-ws-save]')) {
      const check = validateWorkshopDraft(draft);
      if (!check.valid) return;
      const copy = JSON.parse(JSON.stringify(normalizeCustomLevel(draft).workshopDraft));
      const existingIdx = localSaved.findIndex((s) => s.title === copy.title);
      if (existingIdx >= 0) localSaved[existingIdx] = copy;
      else localSaved.unshift(copy);
      localSaved = localSaved.slice(0, 10);
      onSaveCustom?.(copy);
      toastMessage = `💾 ${t(lang, 'workshop.savedToast')}`;
      synth?.playCollect?.();
      render();
      return;
    }

    if (event.target.closest('[data-ws-share]')) {
      const check = validateWorkshopDraft(draft);
      if (!check.valid) return;
      const encoded = encodeCustomLevel(draft);
      const baseUrl = `${globalThis.location.origin}${globalThis.location.pathname}`;
      const shareUrl = `${baseUrl}?custom=${encoded}`;
      try {
        if (globalThis.navigator?.clipboard?.writeText) {
          await globalThis.navigator.clipboard.writeText(shareUrl);
        }
        toastMessage = `🔗 ${t(lang, 'workshop.copiedToast')}`;
      } catch {
        globalThis.prompt?.('Copie o link da sua fase:', shareUrl);
        toastMessage = `🔗 ${t(lang, 'workshop.copiedToast')}`;
      }
      synth?.playCollect?.();
      render();
      return;
    }

    if (event.target.closest('[data-ws-play]')) {
      const check = validateWorkshopDraft(draft);
      if (!check.valid) return;
      const customLevel = normalizeCustomLevel(draft);
      globalThis.removeEventListener('pointerup', stopPaint);
      container.onpointerdown = null;
      container.onpointerover = null;
      container.classList.add('hidden');
      synth?.playRocketLaunch?.();
      onPlayCustom?.(customLevel);
    }
  };
}
