/**
 * AstroBit Interactive Step-by-Step Kids Guided Tutorial — 100% pure, DOM-free.
 * Reacts live to the child's actual puzzle pieces on Level 1-1 (Steps 1 -> 2 -> 3)
 * and provides friendly 1-line visual onboarding tips when first meeting Loops,
 * Sensors, Functions, and Frozen Planet ice physics.
 */

import { executeProgram, normalizeProgram } from './interpreter.js';
import { computeLiveWayfinder } from './pathfinder-coach.js';

const CONCEPT_INTRO_TIPS = {
  'w2-1': {
    icon: '🔁',
    highlightBlockType: 'repeat',
    pt: 'Novo poder: 🔁 Repetir! Toque nele e encaixe peças dentro do abraço para economizar blocos!',
    en: 'New power: 🔁 Repeat! Tap it and snap pieces inside its clamp to save blocks!',
  },
  'w3-1': {
    icon: '🔎',
    highlightBlockType: 'if',
    pt: 'Novo poder: 🔎 Se! O AstroBit olha o caminho antes de decidir o que fazer!',
    en: 'New power: 🔎 If! AstroBit checks the path ahead before deciding what to do!',
  },
  'w4-1': {
    icon: '⚡',
    highlightBlockType: 'call_f1',
    pt: 'Novo poder: ⚡ F1! Monte um combo na aba ⚡ F1 e chame ele no programa Principal!',
    en: 'New power: ⚡ F1! Build a combo inside the ⚡ F1 tab and call it from Main!',
  },
  'w7-1': {
    icon: '🧊',
    highlightBlockType: 'move_right',
    pt: 'Novo planeta: 🧊 Gelo! Com apenas 1 passo ➡️ o AstroBit desliza até pisar em chão firme!',
    en: 'New planet: 🧊 Ice! Just 1 step ➡️ lets AstroBit glide all the way to solid ground!',
  },
};

/**
 * Computes the live step-by-step guided tutorial banner state for the current level & program.
 * Returns `null` when the tutorial is dismissed, running, already won, or not needed.
 */
export function computeGuidedTutorialStep(
  level,
  program,
  { lang = 'pt', isRunning = false, dismissed = false, alreadyCompleted = false } = {}
) {
  if (!level || isRunning || dismissed) return null;
  const isEn = lang === 'en';

  // Full 3-step interactive walkthrough on Level 1-1 until the child beats it!
  if (level.id === 'w1-1' && !alreadyCompleted) {
    const norm = normalizeProgram(program);
    const main = norm.main;

    // Check if the child's current program already wins Level 1-1!
    if (main.length > 0) {
      const sim = executeProgram(level, norm);
      if (sim.status === 'won') {
        return {
          mode: 'walkthrough',
          step: 3,
          totalSteps: 3,
          icon: '▶️',
          target: 'run',
          highlightBlockType: null,
          message: isEn
            ? 'Step 3/3: AWESOME!! Now press the green ▶️ Run button to launch AstroBit!'
            : 'Passo 3/3: SHOW!! Agora aperte o botão verde ▶️ Rodar para o AstroBit decolar!',
        };
      }
    }

    // Step 1: empty program -> invite child to tap the very first glowing block
    if (main.length === 0) {
      return {
        mode: 'walkthrough',
        step: 1,
        totalSteps: 3,
        icon: '👆',
        target: 'palette',
        highlightBlockType: level.firstBlockHint || 'move_right',
        message: isEn
          ? 'Step 1/3: Tap the glowing golden ➡️ Right piece to snap your first command!'
          : 'Passo 1/3: Toque na peça dourada ➡️ Direita para encaixar seu primeiro comando!',
      };
    }

    // Step 2: run real-time AAA Pathfinder from wherever AstroBit currently stops!
    const wf = computeLiveWayfinder(level, norm);
    const normRef = normalizeProgram(level.referenceSolution);
    const nextRef = normRef.main[Math.min(main.length, Math.max(0, normRef.main.length - 1))];
    const nextType = wf.nextBlockType || nextRef?.type || 'collect';
    const nextNamePt =
      nextType === 'collect'
        ? '💎 Coletar'
        : nextType === 'move_right'
        ? '➡️ Direita'
        : nextType === 'up'
        ? '⬆️ Cima'
        : nextType === 'down'
        ? '⬇️ Baixo'
        : '⬅️ Esquerda';
    const nextNameEn =
      nextType === 'collect'
        ? '💎 Collect'
        : nextType === 'move_right'
        ? '➡️ Right'
        : nextType === 'up'
        ? '⬆️ Up'
        : nextType === 'down'
        ? '⬇️ Down'
        : '⬅️ Left';

    return {
      mode: 'walkthrough',
      step: 2,
      totalSteps: 3,
      icon: '🧩',
      target: 'palette',
      highlightBlockType: nextType,
      wayfinder: wf,
      message: isEn
        ? `Step 2/3: Nice!! Now tap ${nextNameEn} (glowing gold) to keep building your path!`
        : `Passo 2/3: Boa!! Agora toque em ${nextNamePt} (brilhando em dourado) para continuar!`,
    };
  }

  // Friendly 1-step concept intro banner when entering key milestone worlds for the first time
  const concept = CONCEPT_INTRO_TIPS[level.id];
  if (concept && !alreadyCompleted) {
    const norm = normalizeProgram(program);
    if (norm.main.length === 0) {
      return {
        mode: 'concept',
        step: 1,
        totalSteps: 1,
        icon: concept.icon,
        target: 'palette',
        highlightBlockType: concept.highlightBlockType,
        message: isEn ? concept.en : concept.pt,
      };
    }
  }

  return null;
}
