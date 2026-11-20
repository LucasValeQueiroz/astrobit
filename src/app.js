/**
 * AstroBit Main Application Controller.
 * Connects the deterministic engine, 60fps Canvas renderer, Web Audio synthesizer,
 * touch/mouse block editor, step-by-step debugger, live JS/Python code peek, and progress store.
 */

import { createWorldState } from './engine/grid.js';
import { executeProgram, countBlockList } from './engine/interpreter.js';
import { transpileProgram } from './engine/transpiler.js';
import { ALL_LEVELS, getLevelById, getNextLevel } from './levels/index.js';
import { SpaceCanvasRenderer } from './renderer/canvas-renderer.js';
import { SpaceSoundSynth } from './audio/sound-synth.js';
import {
  loadProgress,
  saveProgress,
  recordLevelCompletion,
  getTotalStars,
} from './storage/progress.js';
import {
  createBlock,
  cloneBlocks,
  appendBlockToTarget,
  removeBlockById,
  moveBlockInList,
  updateRepeatTimes,
  findContainerExists,
  renderPalette,
  renderWorkspace,
} from './ui/workspace.js';
import { renderLevelsModal, renderGarageModal } from './ui/modals.js';
import { t } from './ui/i18n.js';

const SPEED_CONFIG = {
  slow: { ms: 540, next: 'normal', labelKey: 'speedSlow' },
  normal: { ms: 300, next: 'fast', labelKey: 'speedNormal' },
  fast: { ms: 140, next: 'slow', labelKey: 'speedFast' },
};

const els = {
  canvas: document.getElementById('game-canvas'),
  levelBadge: document.getElementById('level-badge'),
  totalStarsPill: document.getElementById('total-stars-pill'),
  missionTitle: document.getElementById('mission-title'),
  missionHint: document.getElementById('mission-hint'),
  crystalsPill: document.getElementById('crystals-pill'),
  blocksCounter: document.getElementById('blocks-counter'),
  feedbackBanner: document.getElementById('feedback-banner'),
  palette: document.getElementById('block-palette'),
  workspace: document.getElementById('block-workspace'),
  codePeekPanel: document.getElementById('code-peek-panel'),
  codePeekLines: document.getElementById('code-peek-lines'),
  winOverlay: document.getElementById('win-overlay'),
  winStars: document.getElementById('win-stars'),
  winTitle: document.getElementById('win-title'),
  winSub: document.getElementById('win-sub'),
  winReplayBtn: document.getElementById('win-replay-btn'),
  winNextBtn: document.getElementById('win-next-btn'),
  btnRun: document.getElementById('btn-run'),
  btnStep: document.getElementById('btn-step'),
  btnReset: document.getElementById('btn-reset'),
  btnSpeed: document.getElementById('btn-speed'),
  btnUndo: document.getElementById('btn-undo'),
  btnClear: document.getElementById('btn-clear'),
  btnLevels: document.getElementById('btn-levels'),
  btnGarage: document.getElementById('btn-garage'),
  btnCodeToggle: document.getElementById('btn-code-toggle'),
  btnSound: document.getElementById('btn-sound'),
  btnLang: document.getElementById('btn-lang'),
  modalBackdrop: document.getElementById('modal-backdrop'),
};

const synth = new SpaceSoundSynth();
const renderer = new SpaceCanvasRenderer(els.canvas);

const state = {
  progress: loadProgress(),
  level: null,
  blocks: [],
  undoStack: [],
  activeContainerId: null,
  codePeekOpen: false,
  // Playback / Stepper state
  isRunning: false,
  timerId: null,
  traceRun: null,
  traceIndex: 0,
  runningBlockId: null,
  failedBlockId: null,
};

function lang() {
  return state.progress.lang || 'pt';
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function setFeedback(message, tone = '') {
  els.feedbackBanner.textContent = message;
  els.feedbackBanner.className = `feedback-banner ${tone}`.trim();
}

function updateCrystalsHud(remaining, total) {
  const collected = Math.max(0, total - remaining);
  els.crystalsPill.textContent = `💎 ${collected}/${total}`;
}

function updateTopbar() {
  const maxStars = ALL_LEVELS.length * 3;
  const totalStars = getTotalStars(state.progress);
  els.totalStarsPill.textContent = `⭐ ${totalStars} / ${maxStars}`;
  els.btnSound.textContent = synth.isMuted() ? '🔇' : '🔊';
  els.btnSound.title = t(lang(), synth.isMuted() ? 'navSoundOff' : 'navSoundOn');
  els.btnLang.textContent = lang().toUpperCase();
  els.btnCodeToggle.classList.toggle('active', state.codePeekOpen);

  const speedCfg = SPEED_CONFIG[state.progress.speed] || SPEED_CONFIG.normal;
  els.btnSpeed.textContent = t(lang(), speedCfg.labelKey);

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(lang(), key);
  });

  if (state.level) {
    els.levelBadge.textContent = t(lang(), 'levelLabel', {
      world: state.level.world,
      index: state.level.index,
    });
    els.missionTitle.textContent = lang() === 'en' ? state.level.titleEn : state.level.titlePt;
    els.missionHint.textContent = lang() === 'en' ? state.level.hintEn : state.level.hintPt;
  }
}

function renderCodePeek() {
  els.codePeekPanel.classList.toggle('hidden', !state.codePeekOpen);
  if (!state.codePeekOpen) return;

  const codeLang = state.progress.codeLang || 'js';
  document.querySelectorAll('[data-code-lang]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.codeLang === codeLang);
  });

  const transpiled = transpileProgram({ main: state.blocks }, { lang: codeLang });
  const highlightId = state.failedBlockId || state.runningBlockId;
  const activeLine = highlightId ? transpiled.blockToLine[highlightId] : null;

  els.codePeekLines.innerHTML = transpiled.lines
    .map((line, i) => {
      const ln = i + 1;
      const cls = ln === activeLine ? 'code-line active-line' : 'code-line';
      return `<div class="${cls}"><span class="code-ln">${ln}</span><span>${escapeHtml(line)}</span></div>`;
    })
    .join('');
}

function updateRunButton() {
  els.btnRun.classList.toggle('stopping', state.isRunning);
  els.btnRun.innerHTML = state.isRunning
    ? `⏹️ <span>${escapeHtml(t(lang(), 'btnStop'))}</span>`
    : `▶️ <span>${escapeHtml(t(lang(), 'btnRun'))}</span>`;
}

function renderEditor() {
  if (!state.level) return;
  if (!findContainerExists(state.blocks, state.activeContainerId)) {
    state.activeContainerId = null;
  }

  const used = countBlockList(state.blocks);
  els.blocksCounter.textContent = t(lang(), 'blocksCounter', {
    used,
    par: state.level.starThresholds.parBlocks,
  });
  els.btnUndo.disabled = state.undoStack.length === 0;

  renderPalette(els.palette, state.level.allowedBlocks, {
    lang: lang(),
    t,
    onAddBlock: (type) => {
      if (state.isRunning) stopExecution(true);
      pushUndo();
      const block = createBlock(type);
      state.blocks = appendBlockToTarget(state.blocks, state.activeContainerId, block);
      // Auto-focus newly created Repeat block so a child can immediately tap blocks inside it!
      if (type === 'repeat') {
        state.activeContainerId = block.id;
      }
      synth.playClick();
      resetBoardOnly();
      renderEditor();
    },
  });

  renderWorkspace(els.workspace, state.blocks, {
    lang: lang(),
    t,
    activeContainerId: state.activeContainerId,
    runningBlockId: state.runningBlockId,
    failedBlockId: state.failedBlockId,
    onSelectContainer: (cid) => {
      state.activeContainerId = cid;
      synth.playClick();
      renderEditor();
    },
    onMoveBlock: (id, delta) => {
      if (state.isRunning) stopExecution(true);
      pushUndo();
      state.blocks = moveBlockInList(state.blocks, id, delta);
      synth.playClick();
      resetBoardOnly();
      renderEditor();
    },
    onRemoveBlock: (id) => {
      if (state.isRunning) stopExecution(true);
      pushUndo();
      state.blocks = removeBlockById(state.blocks, id);
      synth.playClick();
      resetBoardOnly();
      renderEditor();
    },
    onChangeRepeat: (id, delta) => {
      if (state.isRunning) stopExecution(true);
      pushUndo();
      state.blocks = updateRepeatTimes(state.blocks, id, delta);
      synth.playClick();
      resetBoardOnly();
      renderEditor();
    },
    onDropIntoContainer: (blockId, targetId) => {
      if (state.isRunning) stopExecution(true);
      const findBlock = (list) => {
        for (const b of list) {
          if (b.id === blockId) return b;
          if (b.type === 'repeat' && b.body) {
            const found = findBlock(b.body);
            if (found) return found;
          }
        }
        return null;
      };
      const dragged = findBlock(state.blocks);
      if (!dragged) return;
      // Avoid dropping a repeat container inside itself
      if (dragged.type === 'repeat' && targetId && findContainerExists([dragged], targetId)) {
        return;
      }
      pushUndo();
      const without = removeBlockById(state.blocks, blockId);
      state.blocks = appendBlockToTarget(without, targetId, dragged);
      synth.playClick();
      resetBoardOnly();
      renderEditor();
    },
  });

  renderCodePeek();
}

function pushUndo() {
  state.undoStack.push(cloneBlocks(state.blocks));
  if (state.undoStack.length > 30) state.undoStack.shift();
}

function stopExecution(clearHighlight = false) {
  if (state.timerId !== null) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }
  state.isRunning = false;
  if (clearHighlight) {
    state.runningBlockId = null;
    state.failedBlockId = null;
  }
  updateRunButton();
}

function resetBoardOnly() {
  stopExecution(true);
  state.traceRun = null;
  state.traceIndex = 0;
  els.winOverlay.classList.add('hidden');
  if (state.level) {
    const fresh = createWorldState(state.level);
    renderer.setWorld(fresh, state.level.world);
    updateCrystalsHud(fresh.crystals.size, fresh.totalCrystals);
    setFeedback(t(lang(), 'feedback.ready'));
  }
}

function loadLevel(levelId) {
  stopExecution(true);
  state.level = getLevelById(levelId);
  state.progress.currentLevelId = state.level.id;
  saveProgress(state.progress);

  state.blocks = state.level.starterProgram ? cloneBlocks(state.level.starterProgram) : [];
  state.undoStack = [];
  state.activeContainerId = null;
  state.traceRun = null;
  state.traceIndex = 0;
  els.winOverlay.classList.add('hidden');

  const fresh = createWorldState(state.level);
  renderer.setSkin(state.progress.skinId);
  renderer.setWorld(fresh, state.level.world);
  updateCrystalsHud(fresh.crystals.size, fresh.totalCrystals);
  updateTopbar();
  setFeedback(t(lang(), 'feedback.ready'));
  renderEditor();
}

function playEventSound(ev) {
  if (ev.type === 'move') synth.playStep();
  else if (ev.type === 'turn') synth.playTurn();
  else if (ev.type === 'collect') synth.playCollect();
  else if (ev.type === 'toggle_channel') synth.playToggle();
  else if (ev.type === 'teleport') synth.playTeleport();
  else if (ev.type === 'bump') synth.playBump();
  else if (ev.type === 'win') synth.playWin();
}

function showWinOverlay(run) {
  state.progress = recordLevelCompletion(state.progress, state.level.id, run.stars);
  saveProgress(state.progress);
  updateTopbar();

  const starsHtml = [1, 2, 3]
    .map((n) => `<span class="star-icon ${n <= run.stars ? 'earned' : 'empty'}">★</span>`)
    .join('');
  els.winStars.innerHTML = starsHtml;
  els.winTitle.textContent = t(lang(), `win.title${run.stars}`);
  els.winSub.textContent = t(lang(), `win.sub${run.stars}`, {
    blocks: run.blockCount,
    par: state.level.starThresholds.parBlocks,
  });

  const nextLevel = getNextLevel(state.level.id);
  els.winReplayBtn.textContent = `🔄 ${t(lang(), 'win.btnReplay')}`;
  if (nextLevel) {
    els.winNextBtn.classList.remove('hidden');
    els.winNextBtn.textContent = t(lang(), 'win.btnNext');
  } else {
    els.winNextBtn.classList.add('hidden');
    els.winSub.textContent = t(lang(), 'win.allDone');
  }

  setFeedback(t(lang(), `win.title${run.stars}`), 'good');
  els.winOverlay.classList.remove('hidden');
}

function finishTrace(run) {
  stopExecution(false);
  if (run.status === 'won') {
    showWinOverlay(run);
  } else if (run.status === 'failed') {
    state.failedBlockId = run.failedBlockId;
    const key = `feedback.${run.failureReason || 'hit_wall'}`;
    setFeedback(t(lang(), key), 'warn');
  } else if (run.status === 'infinite_loop') {
    state.failedBlockId = run.failedBlockId;
    setFeedback(t(lang(), 'feedback.infinite_loop'), 'warn');
  } else {
    const remaining = run.finalState.crystalsRemaining;
    if (remaining > 0) {
      setFeedback(t(lang(), 'feedback.incomplete_crystals', { remaining }), 'warn');
    } else {
      setFeedback(t(lang(), 'feedback.incomplete_goal'), 'warn');
    }
  }
  renderEditor();
}

function applyNextTraceEvent() {
  const run = state.traceRun;
  if (!run) return false;
  if (state.traceIndex >= run.events.length) {
    finishTrace(run);
    return false;
  }

  const ev = run.events[state.traceIndex++];
  state.runningBlockId = ev.blockId;
  state.failedBlockId = ev.type === 'bump' ? ev.blockId : null;
  renderer.applyTraceEvent(ev);
  playEventSound(ev);
  updateCrystalsHud(ev.crystalsRemaining, renderer.worldState.totalCrystals);
  renderEditor();

  if (state.traceIndex >= run.events.length) {
    finishTrace(run);
    return false;
  }
  return true;
}

function prepareTrace() {
  if (state.blocks.length === 0) {
    setFeedback(t(lang(), 'feedback.empty_program'), 'warn');
    synth.playBump();
    return false;
  }
  const fresh = createWorldState(state.level);
  renderer.setWorld(fresh, state.level.world);
  updateCrystalsHud(fresh.crystals.size, fresh.totalCrystals);
  els.winOverlay.classList.add('hidden');

  state.traceRun = executeProgram(state.level, { main: state.blocks });
  state.traceIndex = 0;
  state.runningBlockId = null;
  state.failedBlockId = null;
  return true;
}

function startRun() {
  if (state.isRunning) {
    stopExecution(false);
    return;
  }
  if (!prepareTrace()) return;

  state.isRunning = true;
  updateRunButton();
  setFeedback(t(lang(), 'feedback.running'));

  const tick = () => {
    if (!state.isRunning) return;
    const more = applyNextTraceEvent();
    if (more && state.isRunning) {
      const delay = (SPEED_CONFIG[state.progress.speed] || SPEED_CONFIG.normal).ms;
      state.timerId = setTimeout(tick, delay);
    }
  };
  tick();
}

function stepOnce() {
  if (state.isRunning) stopExecution(false);
  if (!state.traceRun || state.traceIndex >= state.traceRun.events.length) {
    if (!prepareTrace()) return;
  }
  setFeedback(t(lang(), 'feedback.stepping'));
  applyNextTraceEvent();
}

// Event Listeners
els.btnRun.addEventListener('click', startRun);
els.btnStep.addEventListener('click', stepOnce);
els.btnReset.addEventListener('click', () => {
  synth.playClick();
  resetBoardOnly();
  renderEditor();
});

els.btnSpeed.addEventListener('click', () => {
  const cur = SPEED_CONFIG[state.progress.speed] || SPEED_CONFIG.normal;
  state.progress.speed = cur.next;
  saveProgress(state.progress);
  synth.playClick();
  updateTopbar();
});

els.btnUndo.addEventListener('click', () => {
  if (state.undoStack.length === 0) return;
  if (state.isRunning) stopExecution(true);
  state.blocks = state.undoStack.pop();
  synth.playClick();
  resetBoardOnly();
  renderEditor();
});

els.btnClear.addEventListener('click', () => {
  if (state.blocks.length === 0) return;
  if (state.isRunning) stopExecution(true);
  pushUndo();
  state.blocks = [];
  state.activeContainerId = null;
  synth.playClick();
  resetBoardOnly();
  renderEditor();
});

els.btnSound.addEventListener('click', () => {
  synth.toggleMute();
  if (!synth.isMuted()) synth.playClick();
  updateTopbar();
});

els.btnLang.addEventListener('click', () => {
  state.progress.lang = lang() === 'pt' ? 'en' : 'pt';
  saveProgress(state.progress);
  synth.playClick();
  updateTopbar();
  setFeedback(t(lang(), 'feedback.ready'));
  renderEditor();
});

els.btnCodeToggle.addEventListener('click', () => {
  state.codePeekOpen = !state.codePeekOpen;
  synth.playClick();
  updateTopbar();
  renderCodePeek();
});

document.querySelectorAll('[data-code-lang]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.progress.codeLang = btn.dataset.codeLang;
    saveProgress(state.progress);
    synth.playClick();
    renderCodePeek();
  });
});

els.btnLevels.addEventListener('click', () => {
  synth.playClick();
  renderLevelsModal(els.modalBackdrop, state.progress, state.level?.id, {
    lang: lang(),
    t,
    onSelectLevel: (id) => loadLevel(id),
  });
});

els.btnGarage.addEventListener('click', () => {
  synth.playClick();
  renderGarageModal(els.modalBackdrop, state.progress, {
    lang: lang(),
    t,
    onSelectSkin: (skinId) => {
      state.progress.skinId = skinId;
      saveProgress(state.progress);
      renderer.setSkin(skinId);
      synth.playCollect();
    },
  });
});

els.winReplayBtn.addEventListener('click', () => {
  synth.playClick();
  resetBoardOnly();
  renderEditor();
});

els.winNextBtn.addEventListener('click', () => {
  synth.playClick();
  const next = getNextLevel(state.level.id);
  if (next) loadLevel(next.id);
});

window.addEventListener('resize', () => renderer.resize());
window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    els.btnUndo.click();
  }
});

// Boot AstroBit!
renderer.start();
loadLevel(state.progress.currentLevelId || 'w1-1');
