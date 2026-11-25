/**
 * AstroBit Main Application Controller.
 * Supports 4-direction jigsaw puzzle pieces, C-shaped Repeat & If-Sensor clamps,
 * F1/F2 reusable Function stacks, Bug Hunt pre-filled levels, living mascot, and live path preview.
 */

import { createWorldState } from './engine/grid.js?v=4.0';
import { executeProgram, countProgramBlocks, normalizeProgram } from './engine/interpreter.js?v=4.0';
import { transpileProgram } from './engine/transpiler.js?v=4.0';
import { decodeCustomLevel, encodeCustomLevel } from './engine/custom-level.js?v=5.8';
import {
  generateDailyLevel,
  getTodayDateKey,
  computeDailyStreak,
  recordDailyCompletion,
} from './engine/daily-challenge.js?v=5.0';
import {
  createArcadeRun,
  applyArcadeOutcome,
  generateArcadeLevel,
  ARCADE_MAX_SHIELDS,
} from './engine/arcade-mode.js?v=5.7';
import {
  extractGhostReplay,
  getGhostFrameAt,
  recordBestGhost,
  encodeGhostReplay,
  decodeGhostReplay,
} from './engine/ghost-replay.js?v=5.8';
import {
  computeProgressiveHint,
  shouldOfferSmartHint,
} from './engine/companions-and-hints.js?v=5.9';
import { computeGuidedTutorialStep } from './engine/guided-tutorial.js?v=6.6';
import { computeLiveWayfinder } from './engine/pathfinder-coach.js?v=6.6';
import { computeXpLevel, computeWinXp, applyGameplayRewards } from './engine/xp-and-quests.js?v=6.7';
import { ALL_LEVELS, CAMPAIGN_WORLDS, getLevelById, getNextLevel } from './levels/index.js?v=5.7';
import { SpaceCanvasRenderer } from './renderer/canvas-renderer.js?v=6.6';
import { SpaceSoundSynth } from './audio/sound-synth.js?v=6.4';
import { SpaceMusicEngine } from './audio/music-engine.js?v=5.7';
import {
  loadProgress,
  saveProgress,
  recordLevelCompletion,
  getTotalStars,
} from './storage/progress.js?v=6.8';
import {
  appendHistoryEntry,
  mergeProgressSnapshots,
  parseProgressBackup,
} from './storage/cloud-profile.js?v=6.8';
import {
  isGoogleCloudConfigured,
  getCurrentGoogleUser,
  signInWithGoogle,
  signOutGoogle,
  loadCloudProgress,
  saveCloudProgress,
} from './storage/google-cloud-sync.js?v=6.8';
import { SPACE_BADGES, evaluateBadges } from './storage/achievements.js?v=5.7';
import {
  createBlock,
  cloneBlocks,
  appendBlockToTarget,
  insertBlockRelative,
  removeBlockById,
  updateRepeatTimes,
  updateIfSensor,
  findBlockById,
  findContainerExists,
  renderPalette,
  renderWorkspace,
} from './ui/workspace.js?v=4.0';
import { renderGarageModal, renderBadgesModal, renderQuestsModal } from './ui/modals.js?v=6.8';
import { renderPassportModal } from './ui/passport-modal.js?v=6.0';
import { renderEngineLabModal } from './ui/engine-lab.js?v=5.6';
import { installTactilePointerDnD } from './ui/touch-dnd.js?v=5.0';
import { renderStoryCinematic, renderWorldArrivalModal, renderGalaxyJourneyMap } from './ui/story-map.js?v=6.3';
import { renderWorkshopModal } from './ui/workshop.js?v=5.0';
import { getLevelStory } from './story/campaign-story.js?v=5.0';
import { t } from './ui/i18n.js?v=5.1';

const SPEED_CONFIG = {
  slow: { ms: 540, next: 'normal', labelKey: 'speedSlow' },
  normal: { ms: 300, next: 'fast', labelKey: 'speedNormal' },
  fast: { ms: 140, next: 'slow', labelKey: 'speedFast' },
};

const els = {
  canvasFrame: document.getElementById('canvas-frame'),
  canvas: document.getElementById('game-canvas'),
  levelBadge: document.getElementById('level-badge'),
  totalStarsPill: document.getElementById('total-stars-pill'),
  missionTitle: document.getElementById('mission-title'),
  mascotAvatarBtn: document.getElementById('mascot-avatar-btn'),
  mascotBubble: document.getElementById('mascot-bubble'),
  crystalsPill: document.getElementById('crystals-pill'),
  btnXpQuests: document.getElementById('btn-xp-quests'),
  xpLevelLabel: document.getElementById('xp-level-label'),
  xpMiniFill: document.getElementById('xp-mini-fill'),
  blocksCounter: document.getElementById('blocks-counter'),
  palette: document.getElementById('block-palette'),
  workspace: document.getElementById('block-workspace'),
  codePeekPanel: document.getElementById('code-peek-panel'),
  codePeekLines: document.getElementById('code-peek-lines'),
  winOverlay: document.getElementById('win-overlay'),
  winStars: document.getElementById('win-stars'),
  winTitle: document.getElementById('win-title'),
  winStoryNote: document.getElementById('win-story-note'),
  winSub: document.getElementById('win-sub'),
  winReplayBtn: document.getElementById('win-replay-btn'),
  winChallengeBtn: document.getElementById('win-challenge-btn'),
  winNextBtn: document.getElementById('win-next-btn'),
  btnRun: document.getElementById('btn-run'),
  btnStep: document.getElementById('btn-step'),
  btnHint: document.getElementById('btn-hint'),
  guidedTutorialBar: document.getElementById('guided-tutorial-bar'),
  tutorialIcon: document.getElementById('tutorial-icon'),
  tutorialDots: document.getElementById('tutorial-dots'),
  tutorialMsg: document.getElementById('tutorial-msg'),
  btnTutorialDismiss: document.getElementById('btn-tutorial-dismiss'),
  btnGhost: document.getElementById('btn-ghost'),
  ghostBtnLabel: document.getElementById('ghost-btn-label'),
  btnXray: document.getElementById('btn-xray'),
  xrayBtnLabel: document.getElementById('xray-btn-label'),
  btnReset: document.getElementById('btn-reset'),
  btnSpeed: document.getElementById('btn-speed'),
  btnUndo: document.getElementById('btn-undo'),
  btnClear: document.getElementById('btn-clear'),
  btnStory: document.getElementById('btn-story'),
  btnArcade: document.getElementById('btn-arcade'),
  arcadeHudBar: document.getElementById('arcade-hud-bar'),
  arcadeShields: document.getElementById('arcade-shields'),
  arcadeRound: document.getElementById('arcade-round'),
  arcadeCombo: document.getElementById('arcade-combo'),
  arcadeScore: document.getElementById('arcade-score'),
  btnArcadeExit: document.getElementById('btn-arcade-exit'),
  btnDaily: document.getElementById('btn-daily'),
  btnEngineLab: document.getElementById('btn-engine-lab'),
  dailyBtnLabel: document.getElementById('daily-btn-label'),
  btnBadges: document.getElementById('btn-badges'),
  badgesCount: document.getElementById('badges-count'),
  btnLevels: document.getElementById('btn-levels'),
  btnWorkshop: document.getElementById('btn-workshop'),
  btnGarage: document.getElementById('btn-garage'),
  btnCodeToggle: document.getElementById('btn-code-toggle'),
  btnMusic: document.getElementById('btn-music'),
  btnSound: document.getElementById('btn-sound'),
  btnLang: document.getElementById('btn-lang'),
  modalBackdrop: document.getElementById('modal-backdrop'),
  toastStack: document.getElementById('achievement-toast-stack'),
};

const synth = new SpaceSoundSynth();
const renderer = new SpaceCanvasRenderer(els.canvas);
let music = null;

function createEmptyProgram() {
  return { main: [], functions: { F1: [], F2: [] } };
}

function cloneProgram(prog) {
  return {
    main: cloneBlocks(prog?.main || []),
    functions: {
      F1: cloneBlocks(prog?.functions?.F1 || []),
      F2: cloneBlocks(prog?.functions?.F2 || []),
    },
  };
}

const state = {
  progress: loadProgress(),
  level: null,
  program: createEmptyProgram(),
  undoStack: [],
  activeScope: 'main',
  activeContainerId: null,
  codePeekOpen: false,
  hintBlockType: null,
  newlyAddedId: null,
  hoveredBlockId: null,
  pokeCount: 0,
  isRunning: false,
  timerId: null,
  traceRun: null,
  traceIndex: 0,
  crystalStreak: 0,
  runningBlockId: null,
  failedBlockId: null,
  arcadeRun: null,
  ghostEnabled: false,
  ghostStep: 0,
  lastWinningGhost: null,
  levelFailCount: 0,
  hintTier: 0,
  tutorialDismissed: false,
  xrayEnabled: false,
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

function getScopeList(prog, scope) {
  if (scope === 'F1') return prog.functions.F1;
  if (scope === 'F2') return prog.functions.F2;
  return prog.main;
}

function setScopeList(prog, scope, newList) {
  if (scope === 'F1') prog.functions.F1 = newList;
  else if (scope === 'F2') prog.functions.F2 = newList;
  else prog.main = newList;
}

function getVisibleFunctions(level) {
  const allowed = level?.allowedBlocks || [];
  const fns = [];
  if (allowed.includes('call_f1')) fns.push('F1');
  if (allowed.includes('call_f2')) fns.push('F2');
  return fns;
}

function setMascotSay(message, tone = '') {
  els.mascotBubble.textContent = message;
  els.mascotBubble.className = `mascot-bubble ${tone}`.trim();
}

function updateCrystalsHud(remaining, total) {
  const collected = Math.max(0, total - remaining);
  els.crystalsPill.textContent = `💎 ${collected}/${total}`;
}

function updateTopbar() {
  const maxStars = ALL_LEVELS.length * 3;
  const totalStars = getTotalStars(state.progress);
  els.totalStarsPill.textContent = `⭐ ${totalStars} / ${maxStars}`;
  if (els.badgesCount) {
    const unlockedCount = Array.isArray(state.progress.unlockedBadges)
      ? state.progress.unlockedBadges.length
      : 0;
    els.badgesCount.textContent = `${unlockedCount}/${SPACE_BADGES.length}`;
  }
  if (els.dailyBtnLabel) {
    const streak = computeDailyStreak(state.progress.dailyCompletedDates);
    const baseLabel = lang() === 'en' ? 'Daily' : 'Diária';
    els.dailyBtnLabel.textContent = streak > 0 ? `${baseLabel} ×${streak}` : baseLabel;
  }
  els.btnSound.textContent = synth.isMuted() ? '🔇' : '🔊';
  els.btnSound.title = t(lang(), synth.isMuted() ? 'navSoundOff' : 'navSoundOn');
  if (els.btnMusic && music) {
    els.btnMusic.textContent = music.isMuted() ? '🔕' : '🎵';
    els.btnMusic.classList.toggle('active', !music.isMuted());
  }
  els.btnLang.textContent = lang().toUpperCase();
  els.btnCodeToggle.classList.toggle('active', state.codePeekOpen);

  const speedCfg = SPEED_CONFIG[state.progress.speed] || SPEED_CONFIG.normal;
  els.btnSpeed.textContent = t(lang(), speedCfg.labelKey);

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(lang(), key);
  });

  if (state.level) {
    music?.setWorld(state.level.world || 1);
    music?.setTempoState({
      turbo: state.progress.speed === 'fast',
      running: state.isRunning,
    });
    els.levelBadge.textContent = state.level.isDaily
      ? lang() === 'en'
        ? '🔥 Daily'
        : '🔥 Diária'
      : state.level.isCustom
      ? t(lang(), 'customBadge')
      : t(lang(), 'levelLabel', {
          world: state.level.world,
          index: state.level.index,
        });
    const title = lang() === 'en' ? state.level.titleEn : state.level.titlePt;
    els.missionTitle.textContent = state.level.isBugHunt
      ? `${t(lang(), 'bugHuntBadge')} ${title}`
      : title;
  }
}

function refreshPreviewPath() {
  if (!state.level || state.isRunning || state.traceRun) {
    renderer.setPreviewPath([], null);
    return;
  }
  if (state.program.main.length === 0) {
    renderer.setPreviewPath([], null);
    return;
  }

  const fresh = createWorldState(state.level);
  const sim = executeProgram(state.level, state.program);
  const points = [{ x: fresh.robot.x, y: fresh.robot.y, blockId: null }];
  let hoveredTile = null;

  for (const ev of sim.events) {
    if (ev.type === 'move' || ev.type === 'slide' || ev.type === 'teleport') {
      points.push({ x: ev.x, y: ev.y, blockId: ev.blockId, teleported: ev.type === 'teleport' });
    } else if (ev.type === 'bump') {
      points.push({ x: ev.x, y: ev.y, blockId: ev.blockId, bumped: true });
    }
    if (state.hoveredBlockId && ev.blockId === state.hoveredBlockId) {
      hoveredTile = { x: ev.x, y: ev.y };
    }
  }

  renderer.setPreviewPath(points, hoveredTile);
}

function renderCodePeek() {
  els.codePeekPanel.classList.toggle('hidden', !state.codePeekOpen);
  if (!state.codePeekOpen) return;

  const codeLang = state.progress.codeLang || 'js';
  document.querySelectorAll('[data-code-lang]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.codeLang === codeLang);
  });

  const transpiled = transpileProgram(state.program, { lang: codeLang });
  const highlightId = state.failedBlockId || state.runningBlockId || state.hoveredBlockId;
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

function afterProgramMutated(newBlockId = null, sayMsg = null) {
  state.newlyAddedId = newBlockId;
  state.hintBlockType = null;
  resetBoardOnly(false);
  if (sayMsg) setMascotSay(sayMsg);
  renderEditor();
  refreshPreviewPath();
}

function handleDropNewFromPalette(type, dropMeta) {
  if (state.isRunning) stopExecution(true);
  pushUndo();
  const block = createBlock(type);
  const targetList = getScopeList(state.program, dropMeta.scope);
  const updated =
    dropMeta.mode === 'relative' && dropMeta.anchorId
      ? insertBlockRelative(targetList, dropMeta.anchorId, block, dropMeta.position)
      : appendBlockToTarget(targetList, dropMeta.containerId, block);
  setScopeList(state.program, dropMeta.scope, updated);
  state.activeScope = dropMeta.scope;
  if (type === 'repeat' || type === 'if') state.activeContainerId = block.id;
  synth.playSnap();
  afterProgramMutated(block.id, t(lang(), 'mascot.snapFirst'));
}

function handleDropExisting(existing, dropMeta) {
  if (state.isRunning) stopExecution(true);
  const srcList = getScopeList(state.program, existing.scope);
  const dragged = findBlockById(srcList, existing.id);
  if (!dragged) return;
  if (
    existing.scope === dropMeta.scope &&
    (dragged.type === 'repeat' || dragged.type === 'if')
  ) {
    if (dropMeta.containerId && findContainerExists([dragged], dropMeta.containerId)) return;
    if (dropMeta.anchorId && findBlockById([dragged], dropMeta.anchorId)) return;
  }
  pushUndo();
  setScopeList(state.program, existing.scope, removeBlockById(srcList, existing.id));
  const destList = getScopeList(state.program, dropMeta.scope);
  const updated =
    dropMeta.mode === 'relative' && dropMeta.anchorId
      ? insertBlockRelative(destList, dropMeta.anchorId, dragged, dropMeta.position)
      : appendBlockToTarget(destList, dropMeta.containerId, dragged);
  setScopeList(state.program, dropMeta.scope, updated);
  synth.playSnap();
  afterProgramMutated(dragged.id, null);
}

function renderGuidedTutorial() {
  if (!els.guidedTutorialBar || !state.level) return null;
  const alreadyCompleted = Number(state.progress?.starsByLevel?.[state.level.id] || 0) > 0;
  const step = computeGuidedTutorialStep(state.level, state.program, {
    lang: lang(),
    isRunning: state.isRunning,
    dismissed: state.tutorialDismissed,
    alreadyCompleted,
  });

  if (!step) {
    els.guidedTutorialBar.classList.add('hidden');
    els.btnRun?.classList.remove('tutorial-pulse-run');
    return null;
  }

  els.guidedTutorialBar.classList.remove('hidden');
  if (els.tutorialIcon) els.tutorialIcon.textContent = step.icon;
  if (els.tutorialMsg) els.tutorialMsg.textContent = step.message;
  if (els.tutorialDots) {
    els.tutorialDots.innerHTML = Array.from({ length: step.totalSteps }, (_, idx) => {
      const n = idx + 1;
      const cls = n < step.step ? 'done' : n === step.step ? 'active' : '';
      return `<span class="tut-dot ${cls}"></span>`;
    }).join('');
  }
  els.btnRun?.classList.toggle('tutorial-pulse-run', step.target === 'run');
  return step;
}

function refreshAaaWayfinder(tutorialStep = null) {
  if (!state.level) {
    renderer.setWayfinder(null);
    return;
  }
  const showBreadcrumbs = Boolean(tutorialStep && tutorialStep.mode === 'walkthrough' && tutorialStep.step < 3);
  if (state.xrayEnabled || showBreadcrumbs) {
    const wf = tutorialStep?.wayfinder || computeLiveWayfinder(state.level, state.program);
    renderer.setWayfinder({ ...wf, showBreadcrumbs });
  } else {
    renderer.setWayfinder(null);
  }
}

function renderEditor() {
  if (!state.level) return;
  const tutorialStep = renderGuidedTutorial();
  refreshAaaWayfinder(tutorialStep);
  const visibleFns = getVisibleFunctions(state.level);
  if (state.activeScope !== 'main' && !visibleFns.includes(state.activeScope)) {
    state.activeScope = 'main';
    state.activeContainerId = null;
  }
  const activeList = getScopeList(state.program, state.activeScope);
  if (!findContainerExists(activeList, state.activeContainerId)) {
    state.activeContainerId = null;
  }

  const used = countProgramBlocks(state.program);
  els.blocksCounter.textContent = t(lang(), 'blocksCounter', {
    used,
    par: state.level.starThresholds.parBlocks,
  });
  els.btnUndo.disabled = state.undoStack.length === 0;

  renderPalette(els.palette, state.level.allowedBlocks, {
    lang: lang(),
    t,
    hintBlockType: state.hintBlockType || tutorialStep?.highlightBlockType || null,
    onAddBlock: (type) => {
      if (state.isRunning) stopExecution(true);
      pushUndo();
      const wasEmpty = used === 0;
      const block = createBlock(type);
      const curList = getScopeList(state.program, state.activeScope);
      setScopeList(state.program, state.activeScope, appendBlockToTarget(curList, state.activeContainerId, block));
      if (type === 'repeat' || type === 'if') {
        state.activeContainerId = block.id;
      }
      synth.playSnap();
      const msg =
        type === 'repeat'
          ? t(lang(), 'mascot.snapRepeat')
          : type === 'if'
          ? t(lang(), 'mascot.snapIf')
          : type === 'call_f1' || type === 'call_f2'
          ? t(lang(), 'mascot.snapCall')
          : wasEmpty
          ? t(lang(), 'mascot.snapFirst')
          : null;
      afterProgramMutated(block.id, msg);
    },
  });

  const prevBoard = els.workspace.querySelector('.puzzle-board');
  const prevScrollTop = prevBoard ? prevBoard.scrollTop : 0;

  renderWorkspace(els.workspace, state.program, {
    lang: lang(),
    t,
    showFunctions: visibleFns,
    activeScope: state.activeScope,
    activeContainerId: state.activeContainerId,
    runningBlockId: state.runningBlockId,
    failedBlockId: state.failedBlockId,
    newlyAddedId: state.newlyAddedId,
    onSelectTarget: (scope, cid) => {
      state.activeScope = scope || 'main';
      state.activeContainerId = cid;
      state.newlyAddedId = null;
      synth.playClick();
      renderEditor();
    },
    onRemoveBlock: (scope, id) => {
      if (state.isRunning) stopExecution(true);
      pushUndo();
      setScopeList(state.program, scope, removeBlockById(getScopeList(state.program, scope), id));
      synth.playRemove();
      afterProgramMutated(null, null);
    },
    onChangeRepeat: (scope, id, delta) => {
      if (state.isRunning) stopExecution(true);
      pushUndo();
      setScopeList(state.program, scope, updateRepeatTimes(getScopeList(state.program, scope), id, delta));
      synth.playClick();
      afterProgramMutated(null, null);
    },
    onChangeSensor: (scope, id, sensor) => {
      if (state.isRunning) stopExecution(true);
      pushUndo();
      setScopeList(state.program, scope, updateIfSensor(getScopeList(state.program, scope), id, sensor));
      synth.playClick();
      afterProgramMutated(null, null);
    },
    onDropNewFromPalette: handleDropNewFromPalette,
    onDropExisting: handleDropExisting,
    onHoverBlock: (blockId) => {
      if (state.hoveredBlockId === blockId) return;
      state.hoveredBlockId = blockId;
      refreshPreviewPath();
      renderCodePeek();
    },
  });

  const nextBoard = els.workspace.querySelector('.puzzle-board');
  if (nextBoard && prevScrollTop > 0) {
    nextBoard.scrollTop = prevScrollTop;
  }

  state.newlyAddedId = null;
  renderCodePeek();
}

function pushUndo() {
  state.undoStack.push(cloneProgram(state.program));
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

function getActiveGhost() {
  if (!state.level) return null;
  return state.level.challengeGhost || state.progress.ghostsByLevel?.[state.level.id] || null;
}

function updateGhostUi() {
  const ghost = getActiveGhost();
  if (!els.btnGhost) return;
  if (!ghost) {
    els.btnGhost.classList.add('hidden');
    renderer.setGhostPose(null);
    return;
  }
  els.btnGhost.classList.remove('hidden');
  els.btnGhost.classList.toggle('active', Boolean(state.ghostEnabled));
  const isEn = lang() === 'en';
  if (els.ghostBtnLabel) {
    els.ghostBtnLabel.textContent = state.ghostEnabled
      ? isEn
        ? `Ghost ON (${ghost.blocks}p)`
        : `Fantasma ON (${ghost.blocks}p)`
      : isEn
        ? `Ghost (${ghost.blocks}p)`
        : `Fantasma (${ghost.blocks}p)`;
  }
  if (state.ghostEnabled) {
    renderer.setGhostPose(getGhostFrameAt(ghost, state.ghostStep), state.ghostStep === 0);
  } else {
    renderer.setGhostPose(null);
  }
}

function resetBoardOnly(resetMessage = true) {
  stopExecution(true);
  state.traceRun = null;
  state.traceIndex = 0;
  state.ghostStep = 0;
  els.winOverlay.classList.add('hidden');
  if (state.level) {
    const fresh = createWorldState(state.level);
    renderer.setWorld(fresh, state.level.world);
    updateGhostUi();
    updateCrystalsHud(fresh.crystals.size, fresh.totalCrystals);
    if (resetMessage) {
      setMascotSay(
        state.level.isBugHunt
          ? t(lang(), 'mascot.bugHuntIntro')
          : lang() === 'en'
          ? state.level.hintEn
          : state.level.hintPt
      );
    }
    refreshPreviewPath();
  }
}

function openStoryModal(mode = 'intro', { openMapAfter = false } = {}) {
  renderStoryCinematic(els.modalBackdrop, {
    mode,
    lang: lang(),
    t,
    totalStars: getTotalStars(state.progress),
    synth,
    onComplete: () => {
      if (mode === 'intro' && !state.progress.seenIntro) {
        state.progress.seenIntro = true;
        saveProgress(state.progress);
      }
      if (mode === 'ending') {
        state.progress.seenEnding = true;
        saveProgress(state.progress);
      }
      if (openMapAfter) {
        openJourneyMap({ initialWorld: state.level?.world || 1 });
      }
    },
  });
}

function openJourneyMap({
  initialWorld = null,
  flyFromLevelId = null,
  flyToLevelId = null,
  warpToWorld = false,
} = {}) {
  renderGalaxyJourneyMap(els.modalBackdrop, state.progress, state.level?.id, {
    lang: lang(),
    t,
    synth,
    initialWorld,
    flyFromLevelId,
    flyToLevelId,
    warpToWorld,
    onLaunchLevel: (id) => loadLevel(id, { showArrivalIfNew: true }),
    onReplayStory: (mode) => openStoryModal(mode, { openMapAfter: true }),
  });
}

function openWorkshop(initialDraft = null) {
  renderWorkshopModal(els.modalBackdrop, {
    initialDraft: initialDraft || state.level?.workshopDraft || null,
    savedLevels: state.progress.customLevels || [],
    lang: lang(),
    t,
    synth,
    onPlayCustom: (customLevel) => loadCustomLevel(customLevel),
    onSaveCustom: (draftCopy) => {
      const list = Array.isArray(state.progress.customLevels) ? [...state.progress.customLevels] : [];
      const idx = list.findIndex((item) => item.title === draftCopy.title);
      if (idx >= 0) list[idx] = draftCopy;
      else list.unshift(draftCopy);
      state.progress.customLevels = list.slice(0, 10);
      saveProgress(state.progress);
    },
    onDeleteSaved: (idx) => {
      if (!Array.isArray(state.progress.customLevels)) return;
      state.progress.customLevels.splice(idx, 1);
      saveProgress(state.progress);
    },
  });
}

function loadCustomLevel(customLevel) {
  stopExecution(true);
  state.level = customLevel;
  state.program = createEmptyProgram();
  state.undoStack = [];
  state.activeScope = 'main';
  state.activeContainerId = null;
  state.hintBlockType = null;
  state.hoveredBlockId = null;
  state.traceRun = null;
  state.traceIndex = 0;
  els.winOverlay.classList.add('hidden');

  const fresh = createWorldState(state.level);
  renderer.setSkin(state.progress.skinId);
  renderer.setDrone(state.progress.droneId);
  renderer.setWorld(fresh, state.level.world);
  state.ghostStep = 0;
  state.levelFailCount = 0;
  state.hintTier = 0;
  els.btnHint?.classList.remove('hint-nudge');
  updateGhostUi();
  updateCrystalsHud(fresh.crystals.size, fresh.totalCrystals);
  updateXpHud();
  updateTopbar();
  setMascotSay(lang() === 'en' ? state.level.hintEn : state.level.hintPt, 'good');
  renderEditor();
  refreshPreviewPath();
}

function loadLevel(levelId, { showArrivalIfNew = false } = {}) {
  stopExecution(true);
  state.arcadeRun = null;
  renderArcadeHud();
  state.level = getLevelById(levelId);
  state.progress.currentLevelId = state.level.id;
  saveProgress(state.progress);

  state.program = state.level.starterProgram
    ? cloneProgram(normalizeProgram(state.level.starterProgram))
    : createEmptyProgram();
  state.undoStack = [];
  state.activeScope = 'main';
  state.activeContainerId = null;
  state.hintBlockType = null;
  state.hoveredBlockId = null;
  state.traceRun = null;
  state.traceIndex = 0;
  state.ghostStep = 0;
  els.winOverlay.classList.add('hidden');

  const fresh = createWorldState(state.level);
  renderer.setSkin(state.progress.skinId);
  renderer.setDrone(state.progress.droneId);
  renderer.setWorld(fresh, state.level.world);
  state.levelFailCount = 0;
  state.hintTier = 0;
  els.btnHint?.classList.remove('hint-nudge');
  updateGhostUi();
  updateCrystalsHud(fresh.crystals.size, fresh.totalCrystals);
  updateXpHud();
  updateTopbar();
  setMascotSay(
    state.level.isBugHunt
      ? t(lang(), 'mascot.bugHuntIntro')
      : lang() === 'en'
      ? state.level.hintEn
      : state.level.hintPt
  );
  renderEditor();
  refreshPreviewPath();

  if (showArrivalIfNew && state.progress.seenIntro && !state.progress.seenWorlds?.[state.level.world]) {
    state.progress.seenWorlds = {
      ...(state.progress.seenWorlds || {}),
      [state.level.world]: true,
    };
    saveProgress(state.progress);
    const worldObj = CAMPAIGN_WORLDS.find((w) => w.world === state.level.world);
    if (worldObj) {
      renderWorldArrivalModal(els.modalBackdrop, worldObj, {
        lang: lang(),
        t,
        synth,
        onBegin: () => {},
        onOpenMap: (wNum) => openJourneyMap({ initialWorld: wNum }),
      });
    }
  }
}

function playEventSound(ev) {
  if (ev.type === 'move') synth.playStep();
  else if (ev.type === 'slide') synth.playIceSlide();
  else if (ev.type === 'push_crate') synth.playCratePush(Boolean(ev.slid));
  else if (ev.type === 'turn') synth.playTurn();
  else if (ev.type === 'collect') synth.playCollect(state.crystalStreak);
  else if (ev.type === 'toggle_channel') synth.playToggle();
  else if (ev.type === 'teleport') synth.playTeleport();
  else if (ev.type === 'bump') synth.playBump();
  else if (ev.type === 'win') synth.playWin();
}

function showBadgeToast(badge) {
  if (!els.toastStack || !badge) return;
  const isEn = lang() === 'en';
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${badge.icon}</span>
    <div class="toast-body">
      <span class="toast-kicker">${isEn ? '🏆 Medal Unlocked!' : '🏆 Medalha Desbloqueada!'}</span>
      <strong>${escapeHtml(isEn ? badge.nameEn : badge.namePt)}</strong>
    </div>
  `;
  els.toastStack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 350);
  }, 4200);
}

function updateXpHud() {
  const info = computeXpLevel(state.progress?.xp || 0);
  if (els.xpLevelLabel) {
    els.xpLevelLabel.textContent = `⚡ Lv.${info.level}`;
  }
  if (els.xpMiniFill) {
    els.xpMiniFill.style.width = `${info.pct}%`;
  }
}

function awardXpAndQuests(rewardEvent) {
  const res = applyGameplayRewards(state.progress, rewardEvent);
  if (res.xpGained > 0 || res.completedQuests.length > 0) {
    state.progress = res.progress;
    saveProgress(state.progress);
    updateXpHud();

    res.completedQuests.forEach((q, idx) => {
      setTimeout(() => {
        showBadgeToast({
          icon: q.icon,
          namePt: `${q.titlePt} (+${q.xpReward} XP)`,
          nameEn: `${q.titleEn} (+${q.xpReward} XP)`,
        });
      }, idx * 450);
    });

    if (res.leveledUp) {
      synth.playNewRecord();
      setTimeout(() => {
        showBadgeToast({
          icon: '🎉',
          namePt: `LEVEL UP! Piloto Nível ${res.newLevel}!`,
          nameEn: `LEVEL UP! Pilot Level ${res.newLevel}!`,
        });
      }, res.completedQuests.length * 450 + 200);
    }
  }
  return res;
}

function checkAndAwardBadges(context = {}) {
  const { unlockedBadges, newlyUnlocked } = evaluateBadges(state.progress, context);
  if (newlyUnlocked.length > 0) {
    state.progress = { ...state.progress, unlockedBadges };
    saveProgress(state.progress);
    synth.playFanfare();
    newlyUnlocked.forEach((badge, idx) => {
      setTimeout(() => showBadgeToast(badge), idx * 450);
    });
  }
}

function showWinOverlay(run) {
  if (state.level.isDaily) {
    state.progress = recordDailyCompletion(state.progress, state.level.dailyDateKey || getTodayDateKey());
    saveProgress(state.progress);
  } else if (state.level.isArcade) {
    // Arcade progress is saved inside the arcade branch below
  } else if (!state.level.isCustom) {
    state.progress = recordLevelCompletion(state.progress, state.level.id, run.stars);
    const ghost = extractGhostReplay(state.level, run);
    state.lastWinningGhost = ghost;
    if (ghost) {
      const updated = recordBestGhost(state.progress, state.level.id, ghost);
      state.progress = updated.progress;
      if (updated.beatRecord) synth.playNewRecord();
    }
    saveProgress(state.progress);
  } else {
    state.lastWinningGhost = extractGhostReplay(state.level, run);
  }
  updateGhostUi();
  if (els.winChallengeBtn) {
    const canShareGhost = Boolean(state.level?.isCustom && state.level?.workshopDraft && state.lastWinningGhost);
    els.winChallengeBtn.classList.toggle('hidden', !canShareGhost);
    els.winChallengeBtn.textContent =
      lang() === 'en' ? '👻 Challenge Friend' : '👻 Desafiar Amigo';
  }
  checkAndAwardBadges({
    won: true,
    level: state.level,
    program: state.program,
    events: run.events,
  });
  const baseXp = computeWinXp({
    stars: run.stars,
    firstTry: state.levelFailCount === 0,
    isDaily: Boolean(state.level?.isDaily),
    isArcade: Boolean(state.level?.isArcade),
    arcadeMultiplier: state.arcadeRun?.multiplier || 1,
  });
  const rewardRes = awardXpAndQuests({
    type: 'level_win',
    baseXp,
    stars: run.stars,
    isArcade: Boolean(state.level?.isArcade),
    program: state.program,
    events: run.events,
  });
  state.progress = appendHistoryEntry(state.progress, {
    levelId: state.level.id,
    mode: state.level.isArcade
      ? 'arcade'
      : state.level.isDaily
      ? 'daily'
      : state.level.isCustom
      ? 'custom'
      : 'campaign',
    title: lang() === 'en' ? state.level.titleEn : state.level.titlePt,
    world: state.level.world || 1,
    stars: run.stars,
    blocks: run.blockCount,
    xpGained: rewardRes.xpGained || baseXp,
  });
  saveProgress(state.progress);
  const gUser = getCurrentGoogleUser();
  if (gUser?.uid) {
    saveCloudProgress(gUser.uid, state.progress).catch(() => {});
  }
  updateTopbar();

  const starsHtml = [1, 2, 3]
    .map((n) => `<span class="star-icon ${n <= run.stars ? 'earned' : 'empty'}">★</span>`)
    .join('');
  els.winStars.innerHTML = starsHtml;
  els.winTitle.textContent = t(lang(), `win.title${run.stars}`);

  if (state.level.isArcade && state.arcadeRun?.active) {
    const completedRound = state.arcadeRun.round;
    state.arcadeRun = applyArcadeOutcome(state.arcadeRun, { won: true, stars: run.stars });
    const isNewBest = state.arcadeRun.score > (state.progress.arcadeBestScore || 0);
    if (isNewBest || completedRound > (state.progress.arcadeBestRound || 0)) {
      state.progress = {
        ...state.progress,
        arcadeBestScore: Math.max(state.progress.arcadeBestScore || 0, state.arcadeRun.score),
        arcadeBestRound: Math.max(state.progress.arcadeBestRound || 0, completedRound),
      };
      saveProgress(state.progress);
      checkAndAwardBadges({ won: true, level: state.level, program: state.program, events: run.events });
    }
    renderArcadeHud();
    const isEn = lang() === 'en';
    const note = isEn
      ? `⚡ Stage #${completedRound} cleared! +${state.arcadeRun.lastPoints} pts (Combo ×${state.arcadeRun.multiplier})${isNewBest ? ' · 🏆 NEW RECORD!' : ''}`
      : `⚡ Fase #${completedRound} vencida! +${state.arcadeRun.lastPoints} pts (Combo ×${state.arcadeRun.multiplier})${isNewBest ? ' · 🏆 NOVO RECORDE!' : ''}`;
    if (els.winStoryNote) els.winStoryNote.textContent = note;
    els.winSub.textContent = isEn
      ? `Score: ${state.arcadeRun.score} pts · Record: ${state.progress.arcadeBestScore} pts`
      : `Pontuação: ${state.arcadeRun.score} pts · Recorde: ${state.progress.arcadeBestScore} pts`;
    els.winReplayBtn.textContent = isEn ? '🚪 Exit Arcade' : '🚪 Sair do Arcade';
    els.winNextBtn.classList.remove('hidden');
    els.winNextBtn.textContent = isEn
      ? `⚡ Next Stage (#${state.arcadeRun.round})`
      : `⚡ Próxima Fase (#${state.arcadeRun.round})`;
    setMascotSay(note, 'good');
    els.winOverlay.classList.remove('hidden');
    return;
  }

  if (state.level.isDaily) {
    const streak = computeDailyStreak(state.progress.dailyCompletedDates);
    const dailyNote =
      lang() === 'en'
        ? `🔥 Daily Mission complete! Your Streak is now ${streak} day(s)! Come back tomorrow for a brand-new space puzzle!`
        : `🔥 Missão Diária concluída! Sua sequência está em ${streak} dia(s)! Volte amanhã para um novo desafio espacial!`;
    if (els.winStoryNote) els.winStoryNote.textContent = dailyNote;
    els.winSub.textContent = t(lang(), `win.sub${run.stars}`, {
      blocks: run.blockCount,
      par: state.level.starThresholds.parBlocks,
    });
    els.winReplayBtn.textContent = `🔄 ${t(lang(), 'win.btnReplay')}`;
    els.winNextBtn.classList.remove('hidden');
    els.winNextBtn.textContent = lang() === 'en' ? '🗺️ Back to Galaxy Map' : '🗺️ Voltar ao Mapa';
    setMascotSay(dailyNote, 'good');
    els.winOverlay.classList.remove('hidden');
    return;
  }

  if (state.level.isCustom) {
    const customNote = t(lang(), 'workshop.winCustomNote');
    if (els.winStoryNote) els.winStoryNote.textContent = customNote;
    els.winSub.textContent = t(lang(), `win.sub${run.stars}`, {
      blocks: run.blockCount,
      par: state.level.starThresholds.parBlocks,
    });
    els.winReplayBtn.textContent = `🔄 ${t(lang(), 'win.btnReplay')}`;
    els.winNextBtn.classList.remove('hidden');
    els.winNextBtn.textContent = t(lang(), 'workshop.btnBackWorkshop');
    setMascotSay(customNote, 'good');
    els.winOverlay.classList.remove('hidden');
    return;
  }

  const lvlStory = getLevelStory(state.level.id);
  if (els.winStoryNote) {
    els.winStoryNote.textContent = lang() === 'en' ? lvlStory.winEn : lvlStory.winPt;
  }
  els.winSub.textContent = t(lang(), `win.sub${run.stars}`, {
    blocks: run.blockCount,
    par: state.level.starThresholds.parBlocks,
  });

  const nextLevel = getNextLevel(state.level.id);
  els.winReplayBtn.textContent = `🔄 ${t(lang(), 'win.btnReplay')}`;
  els.winNextBtn.classList.remove('hidden');
  if (nextLevel) {
    els.winNextBtn.textContent = t(lang(), 'story.btnFlyNext', {
      world: nextLevel.world,
      index: nextLevel.index,
    });
  } else {
    els.winNextBtn.textContent = t(lang(), 'story.btnViewEnding');
    els.winSub.textContent = t(lang(), 'win.allDone');
    synth.playFanfare();
  }

  setMascotSay(lang() === 'en' ? lvlStory.winEn : lvlStory.winPt, 'good');
  els.winOverlay.classList.remove('hidden');
}

function renderArcadeHud() {
  if (!els.arcadeHudBar) return;
  const run = state.arcadeRun;
  if (!run || !run.active || !state.level?.isArcade) {
    els.arcadeHudBar.classList.add('hidden');
    return;
  }
  els.arcadeHudBar.classList.remove('hidden');
  const isEn = lang() === 'en';
  const hearts = '❤️'.repeat(run.shields) + '🖤'.repeat(Math.max(0, ARCADE_MAX_SHIELDS - run.shields));
  if (els.arcadeShields) els.arcadeShields.textContent = hearts;
  if (els.arcadeRound) els.arcadeRound.textContent = isEn ? `⚡ Stage #${run.round}` : `⚡ Fase #${run.round}`;
  if (els.arcadeCombo) els.arcadeCombo.textContent = `🔥 ×${run.multiplier}`;
  if (els.arcadeScore) {
    const best = Math.max(state.progress.arcadeBestScore || 0, run.score);
    els.arcadeScore.textContent = isEn
      ? `🏆 ${run.score} pts (Best: ${best})`
      : `🏆 ${run.score} pts (Recorde: ${best})`;
  }
  if (els.btnArcadeExit) els.btnArcadeExit.textContent = isEn ? '✕ Exit' : '✕ Sair';
}

function startArcadeMode() {
  state.arcadeRun = createArcadeRun(Date.now());
  const lvl = generateArcadeLevel(state.arcadeRun.round, state.arcadeRun.seed);
  loadCustomLevel(lvl);
  renderArcadeHud();
}

function exitArcadeMode() {
  state.arcadeRun = null;
  renderArcadeHud();
  els.winOverlay.classList.add('hidden');
  loadLevel(state.progress.currentLevelId || 'w1-1');
}

function showArcadeGameOver() {
  const run = state.arcadeRun;
  const isEn = lang() === 'en';
  els.winStars.innerHTML = '<span class="star-icon earned">🕹️</span>';
  els.winTitle.textContent = isEn ? 'SHIELD DEPLETED! GAME OVER' : 'ESCUDOS ESGOTADOS! FIM DE CORRIDA';
  if (els.winStoryNote) {
    els.winStoryNote.textContent = isEn
      ? `You reached Stage #${run.round} with ${run.score} pts! Personal Best: ${state.progress.arcadeBestScore} pts.`
      : `Você chegou na Fase #${run.round} com ${run.score} pts! Recorde pessoal: ${state.progress.arcadeBestScore} pts.`;
  }
  els.winSub.textContent = isEn
    ? 'Ready for another Endless Space Run?'
    : 'Pronto para outra Corrida Espacial Infinita?';
  els.winReplayBtn.textContent = isEn ? '🚪 Exit Arcade' : '🚪 Sair do Arcade';
  els.winNextBtn.classList.remove('hidden');
  els.winNextBtn.textContent = isEn ? '🔄 New Arcade Run' : '🔄 Nova Corrida Arcade';
  els.winOverlay.classList.remove('hidden');
}

function finishTrace(run) {
  stopExecution(false);
  if (run.status === 'won') {
    showWinOverlay(run);
  } else {
    if (run.status === 'failed') {
      state.failedBlockId = run.failedBlockId;
      const key = `feedback.${run.failureReason || 'hit_wall'}`;
      setMascotSay(t(lang(), key), 'warn');
    } else if (run.status === 'infinite_loop') {
      state.failedBlockId = run.failedBlockId;
      setMascotSay(t(lang(), 'feedback.infinite_loop'), 'warn');
    } else {
      const remaining = run.finalState.crystalsRemaining;
      if (remaining > 0) {
        setMascotSay(t(lang(), 'feedback.incomplete_crystals', { remaining }), 'warn');
      } else {
        setMascotSay(t(lang(), 'feedback.incomplete_goal'), 'warn');
      }
    }

    state.levelFailCount += 1;
    if (shouldOfferSmartHint(state.levelFailCount)) {
      els.btnHint?.classList.add('hint-nudge');
    }

    if (state.level?.isArcade && state.arcadeRun?.active) {
      state.arcadeRun = applyArcadeOutcome(state.arcadeRun, { won: false });
      renderArcadeHud();
      if (state.arcadeRun.gameOver) {
        showArcadeGameOver();
      }
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
  if (
    state.ghostEnabled &&
    (ev.type === 'move' || ev.type === 'slide' || ev.type === 'teleport' || ev.type === 'turn')
  ) {
    const ghost = getActiveGhost();
    if (ghost) {
      state.ghostStep += 1;
      renderer.setGhostPose(getGhostFrameAt(ghost, state.ghostStep));
    }
  }
  if (ev.type === 'collect') {
    state.crystalStreak += 1;
  }
  playEventSound(ev);
  if (ev.type === 'collect') {
    const comboSuffix = state.crystalStreak >= 2 ? ` 🔥 ×${state.crystalStreak} COMBO!` : '';
    setMascotSay(`${t(lang(), 'mascot.crystal')}${comboSuffix}`, 'good');
  } else if (ev.type === 'toggle_channel') {
    setMascotSay(t(lang(), 'mascot.toggle', { channel: ev.channel }), 'good');
  } else if (ev.type === 'teleport') {
    setMascotSay(t(lang(), 'mascot.teleport'), 'good');
  }
  updateCrystalsHud(ev.crystalsRemaining, renderer.worldState.totalCrystals);
  renderEditor();

  if (state.traceIndex >= run.events.length) {
    finishTrace(run);
    return false;
  }
  return true;
}

function prepareTrace() {
  if (state.program.main.length === 0) {
    setMascotSay(t(lang(), 'feedback.empty_program'), 'warn');
    synth.playBump();
    return false;
  }
  const fresh = createWorldState(state.level);
  renderer.setWorld(fresh, state.level.world);
  renderer.setPreviewPath([], null);
  updateCrystalsHud(fresh.crystals.size, fresh.totalCrystals);
  els.winOverlay.classList.add('hidden');

  state.traceRun = executeProgram(state.level, state.program);
  state.traceIndex = 0;
  state.crystalStreak = 0;
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
  music?.setTempoState({ turbo: state.progress.speed === 'fast', running: true });
  updateRunButton();
  setMascotSay(t(lang(), 'feedback.running'));

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
  setMascotSay(t(lang(), 'feedback.stepping'));
  applyNextTraceEvent();
}

function triggerMascotGiggle() {
  state.pokeCount += 1;
  const idx = ((state.pokeCount - 1) % 4) + 1;
  synth.playGiggle();
  setMascotSay(t(lang(), `mascot.poke${idx}`), 'good');
}

// Event Listeners
els.canvas.addEventListener('click', (event) => {
  const rect = els.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (renderer.tryPokeRobot(x, y)) {
    triggerMascotGiggle();
  }
});

els.mascotAvatarBtn.addEventListener('click', () => {
  renderer.tryPokeRobot(
    renderer.tileCenterX(renderer.renderX),
    renderer.tileCenterY(renderer.renderY)
  );
  triggerMascotGiggle();
});

els.btnHint.addEventListener('click', () => {
  if (!state.level) return;
  state.hintTier = state.hintTier >= 2 ? 2 : state.hintTier + 1;
  els.btnHint?.classList.remove('hint-nudge');
  const hint = computeProgressiveHint(state.level, state.program, state.hintTier, lang());
  state.hintBlockType = hint.highlightBlockType;
  synth.playClick();
  setMascotSay(hint.message, 'good');
  renderEditor();
});

els.btnTutorialDismiss?.addEventListener('click', () => {
  state.tutorialDismissed = true;
  synth.playClick();
  renderEditor();
});

els.btnXray?.addEventListener('click', () => {
  state.xrayEnabled = !state.xrayEnabled;
  renderer.setXrayEnabled(state.xrayEnabled);
  els.btnXray.classList.toggle('active', state.xrayEnabled);
  if (els.xrayBtnLabel) {
    els.xrayBtnLabel.textContent = state.xrayEnabled
      ? lang() === 'en'
        ? 'X-Ray ON'
        : 'Raio-X ON'
      : lang() === 'en'
      ? 'X-Ray'
      : 'Raio-X';
  }
  if (state.xrayEnabled) {
    awardXpAndQuests({ type: 'xray_toggle' });
  }
  synth.playClick();
  renderEditor();
});

els.btnXpQuests?.addEventListener('click', () => {
  synth.playClick();
  renderQuestsModal(els.modalBackdrop, state.progress, {
    lang: lang(),
    googleConfigured: isGoogleCloudConfigured(),
    googleUser: getCurrentGoogleUser(),
    onGoogleSignIn: async () => {
      try {
        const res = await signInWithGoogle();
        if (!res.ok || !res.user) return null;
        const remote = await loadCloudProgress(res.user.uid);
        state.progress = mergeProgressSnapshots(state.progress, remote);
        if (!state.progress.pilotName && res.user.displayName) {
          state.progress.pilotName = res.user.displayName;
        }
        saveProgress(state.progress);
        await saveCloudProgress(res.user.uid, state.progress);
        updateTopbar();
        updateXpHud();
        synth.playNewRecord();
        return state.progress;
      } catch {
        return null;
      }
    },
    onGoogleSignOut: async () => {
      await signOutGoogle();
      synth.playClick();
    },
    onImportBackup: (rawText) => {
      const imported = parseProgressBackup(rawText);
      if (!imported) return null;
      state.progress = mergeProgressSnapshots(state.progress, imported);
      saveProgress(state.progress);
      updateTopbar();
      updateXpHud();
      synth.playNewRecord();
      return state.progress;
    },
  });
});

els.btnGhost?.addEventListener('click', () => {
  if (!getActiveGhost()) return;
  state.ghostEnabled = !state.ghostEnabled;
  state.ghostStep = 0;
  synth.playClick();
  updateGhostUi();
});

els.btnRun.addEventListener('click', startRun);
els.btnStep.addEventListener('click', stepOnce);
els.btnReset.addEventListener('click', () => {
  synth.playClick();
  resetBoardOnly(true);
  renderEditor();
});

els.btnSpeed.addEventListener('click', () => {
  const cur = SPEED_CONFIG[state.progress.speed] || SPEED_CONFIG.normal;
  state.progress.speed = cur.next;
  saveProgress(state.progress);
  music?.setTempoState({ turbo: state.progress.speed === 'fast', running: state.isRunning });
  synth.playClick();
  updateTopbar();
});

els.btnMusic?.addEventListener('click', () => {
  if (!music) return;
  const muted = music.toggleMute();
  state.progress.musicMuted = muted;
  saveProgress(state.progress);
  synth.playClick();
  updateTopbar();
});

els.btnUndo.addEventListener('click', () => {
  if (state.undoStack.length === 0) return;
  if (state.isRunning) stopExecution(true);
  state.program = state.undoStack.pop();
  synth.playRemove();
  afterProgramMutated(null, null);
});

els.btnClear.addEventListener('click', () => {
  if (countProgramBlocks(state.program) === 0) return;
  if (state.isRunning) stopExecution(true);
  pushUndo();
  state.program = createEmptyProgram();
  state.activeScope = 'main';
  state.activeContainerId = null;
  synth.playRemove();
  afterProgramMutated(null, lang() === 'en' ? state.level.hintEn : state.level.hintPt);
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
  setMascotSay(lang() === 'en' ? state.level.hintEn : state.level.hintPt);
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

els.btnStory?.addEventListener('click', () => {
  synth.playClick();
  openStoryModal('intro', { openMapAfter: false });
});

els.btnLevels.addEventListener('click', () => {
  synth.playClick();
  openJourneyMap({ initialWorld: state.level?.world || 1 });
});

els.btnWorkshop?.addEventListener('click', () => {
  synth.playClick();
  openWorkshop();
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
    onSelectDrone: (droneId) => {
      state.progress.droneId = droneId;
      saveProgress(state.progress);
      renderer.setDrone(droneId);
      synth.playCollect();
    },
  });
});

els.btnArcade?.addEventListener('click', () => {
  synth.playRocketLaunch();
  startArcadeMode();
});

els.btnArcadeExit?.addEventListener('click', () => {
  synth.playClick();
  exitArcadeMode();
});

els.btnDaily?.addEventListener('click', () => {
  state.arcadeRun = null;
  renderArcadeHud();
  synth.playRocketLaunch();
  const dailyLvl = generateDailyLevel(getTodayDateKey());
  loadCustomLevel(dailyLvl);
});

els.btnEngineLab?.addEventListener('click', () => {
  synth.playClick();
  renderEngineLabModal(els.modalBackdrop, {
    lang: lang(),
    synth,
    masteredTopics: state.progress.labMasteredTopics || [],
    onTopicMastered: (topicId) => {
      const prev = new Set(state.progress.labMasteredTopics || []);
      if (!prev.has(topicId)) {
        prev.add(topicId);
        state.progress = { ...state.progress, labMasteredTopics: [...prev] };
        saveProgress(state.progress);
        checkAndAwardBadges();
        updateTopbar();
      }
    },
  });
});

els.btnBadges?.addEventListener('click', () => {
  synth.playClick();
  const streak = computeDailyStreak(state.progress.dailyCompletedDates);
  renderBadgesModal(els.modalBackdrop, state.progress, SPACE_BADGES, streak, {
    lang: lang(),
    onOpenPassport: () => {
      synth.playFanfare();
      renderPassportModal(els.modalBackdrop, state.progress, {
        lang: lang(),
        totalMaxStars: ALL_LEVELS.length * 3,
        totalBadges: SPACE_BADGES.length,
        dailyStreak: streak,
        onSavePilotName: (name) => {
          state.progress = { ...state.progress, pilotName: name };
          saveProgress(state.progress);
        },
      });
    },
  });
});

els.winChallengeBtn?.addEventListener('click', async () => {
  if (!state.level?.workshopDraft || !state.lastWinningGhost) return;
  const customToken = encodeCustomLevel(state.level.workshopDraft);
  const ghostToken = encodeGhostReplay(state.lastWinningGhost);
  const baseUrl = `${globalThis.location.origin}${globalThis.location.pathname}`;
  const url = `${baseUrl}?custom=${customToken}&ghost=${ghostToken}`;
  synth.playNewRecord();
  try {
    await navigator.clipboard?.writeText?.(url);
    els.winChallengeBtn.textContent =
      lang() === 'en'
        ? `✅ Link Copied (${state.lastWinningGhost.blocks}p)!`
        : `✅ Link Copiado (${state.lastWinningGhost.blocks}p)!`;
  } catch {
    els.winChallengeBtn.textContent =
      lang() === 'en' ? '🔗 Ready!' : '🔗 Pronto!';
  }
});

els.winReplayBtn.addEventListener('click', () => {
  synth.playClick();
  if (state.level?.isArcade) {
    exitArcadeMode();
    return;
  }
  resetBoardOnly(true);
  renderEditor();
});

els.winNextBtn.addEventListener('click', () => {
  els.winOverlay.classList.add('hidden');
  if (state.level?.isArcade && state.arcadeRun) {
    synth.playRocketLaunch();
    if (state.arcadeRun.gameOver) {
      startArcadeMode();
      return;
    }
    const nextArcade = generateArcadeLevel(state.arcadeRun.round, state.arcadeRun.seed);
    loadCustomLevel(nextArcade);
    renderArcadeHud();
    return;
  }

  if (state.level.isDaily) {
    synth.playClick();
    openJourneyMap();
    return;
  }
  if (state.level.isCustom) {
    synth.playClick();
    openWorkshop(state.level.workshopDraft);
    return;
  }
  const next = getNextLevel(state.level.id);
  if (next) {
    synth.playRocketLaunch();
    if (next.world !== state.level.world) {
      // Crossed into a brand-new planet! Trigger Hyperspace Warp jump to the new planet!
      openJourneyMap({ initialWorld: next.world, flyToLevelId: next.id, warpToWorld: true });
    } else {
      // Same planet: watch Starship Estrela-1 fly smoothly from Base N -> Base N+1!
      openJourneyMap({
        initialWorld: next.world,
        flyFromLevelId: state.level.id,
        flyToLevelId: next.id,
      });
    }
  } else {
    // Beat Level 5-6 — Grand Finale! Humanity is Saved!
    openStoryModal('ending', { openMapAfter: true });
  }
});

window.addEventListener('resize', () => renderer.resize());
if (typeof ResizeObserver !== 'undefined' && els.canvasFrame) {
  const ro = new ResizeObserver(() => renderer.resize());
  ro.observe(els.canvasFrame);
}

window.addEventListener('keydown', (event) => {
  const tag = event.target?.tagName;
  const isFormControl = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

  if (event.key === 'Escape' && !els.modalBackdrop.classList.contains('hidden')) {
    els.modalBackdrop.classList.add('hidden');
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    els.btnUndo.click();
    return;
  }

  if (isFormControl || !els.modalBackdrop.classList.contains('hidden')) return;

  if (event.key === ' ' && tag !== 'BUTTON') {
    event.preventDefault();
    startRun();
  } else if (event.key.toLowerCase() === 's' && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    stepOnce();
  } else if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    els.btnReset.click();
  }
});

// Retroactively unlock any earned Space Medals for returning players
{
  const retro = evaluateBadges(state.progress);
  if (retro.newlyUnlocked.length > 0) {
    state.progress = { ...state.progress, unlockedBadges: retro.unlockedBadges };
    saveProgress(state.progress);
  }
}

music = new SpaceMusicEngine(state.progress.musicMuted);
// Start procedural space soundtrack gently on first user click/tap when unmuted
window.addEventListener(
  'pointerdown',
  () => {
    if (music && !music.isMuted()) music.unlockAndStart();
  },
  { once: true }
);

renderer.start();
installTactilePointerDnD({
  paletteEl: els.palette,
  workspaceEl: els.workspace,
  onDropNewFromPalette: handleDropNewFromPalette,
  onDropExisting: handleDropExisting,
});

// Support instant shared Creative Workshop links (`?custom=...` + optional `&ghost=...`)!
const urlParams = new URLSearchParams(globalThis.location?.search || '');
const sharedCustomParam = urlParams.get('custom');
const sharedGhostParam = urlParams.get('ghost');
const sharedCustomLevel = sharedCustomParam ? decodeCustomLevel(sharedCustomParam) : null;

if (sharedCustomLevel) {
  const challengeGhost = sharedGhostParam ? decodeGhostReplay(sharedGhostParam) : null;
  if (challengeGhost) {
    sharedCustomLevel.challengeGhost = challengeGhost;
    state.ghostEnabled = true;
  }
  loadCustomLevel(sharedCustomLevel);
} else {
  loadLevel(state.progress.currentLevelId || 'w1-1', { showArrivalIfNew: false });

  // First-time players start with the "Operação: Luz da Terra!" intro cinematic -> Animated Galaxy Map!
  if (!state.progress.seenIntro) {
    openStoryModal('intro', { openMapAfter: true });
  }
}
