/**
 * AstroBit Companion Drones & Progressive Smart Hints — 100% pure, DOM-free.
 * 5 collectible floating companion drones (unlocked via Space Medals) and a 2-tier
 * anti-frustration progressive hint engine for kids.
 */

import { normalizeProgram } from './interpreter.js';

export const COMPANION_DRONES = [
  {
    id: 'spark',
    icon: '✨',
    badgesRequired: 0,
    color: '#38bdf8',
    glow: '#7dd3fc',
    namePt: 'Drone Faísca',
    nameEn: 'Spark Drone',
  },
  {
    id: 'nebula-cat',
    icon: '🐱',
    badgesRequired: 3,
    color: '#f472b6',
    glow: '#fbcfe8',
    namePt: 'Gato Nebulosa',
    nameEn: 'Nebula Cat',
  },
  {
    id: 'mini-probe',
    icon: '🛸',
    badgesRequired: 6,
    color: '#34d399',
    glow: '#a7f3d0',
    namePt: 'Mini-Sonda',
    nameEn: 'Mini Probe',
  },
  {
    id: 'comet-owl',
    icon: '🦉',
    badgesRequired: 9,
    color: '#fbbf24',
    glow: '#fde68a',
    namePt: 'Coruja Cometa',
    nameEn: 'Comet Owl',
  },
  {
    id: 'quantum-fox',
    icon: '🦊',
    badgesRequired: 12,
    color: '#c084fc',
    glow: '#e9d5ff',
    namePt: 'Raposa Quântica',
    nameEn: 'Quantum Fox',
  },
];

export function getDroneById(id) {
  return COMPANION_DRONES.find((d) => d.id === id) || COMPANION_DRONES[0];
}

export function getUnlockedDrones(badgeCount = 0) {
  const count = Math.max(0, Math.floor(Number(badgeCount) || 0));
  return COMPANION_DRONES.filter((d) => count >= d.badgesRequired);
}

export function shouldOfferSmartHint(failCount = 0) {
  return Number(failCount) >= 2;
}

function programContainsType(blocks = [], targetType) {
  if (!Array.isArray(blocks)) return false;
  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue;
    if (b.type === targetType) return true;
    if (b.type === 'repeat' && programContainsType(b.body, targetType)) return true;
    if (b.type === 'if' && (programContainsType(b.then, targetType) || programContainsType(b.else, targetType))) {
      return true;
    }
  }
  return false;
}

/**
 * Computes a 2-tier progressive hint:
 *  - Tier 1 (conceptual, spoiler-free): encourages the key CS pattern (loops, sensors, F1, ice/crates).
 *  - Tier 2 (concrete next piece): highlights the exact next recommended block in gold.
 */
export function computeProgressiveHint(level, program, tier = 1, lang = 'pt') {
  const isEn = lang === 'en';
  if (!level) {
    return { tier: 1, message: '', highlightBlockType: null };
  }

  const normRef = normalizeProgram(level.referenceSolution);
  const normUser = normalizeProgram(program);
  const safeTier = tier >= 2 ? 2 : 1;

  // Determine concrete next block from referenceSolution
  const nextIdx = Math.min(normUser.main.length, Math.max(0, normRef.main.length - 1));
  const nextRef = normRef.main[nextIdx];
  let highlightBlockType = level.firstBlockHint || 'move_right';
  if (nextRef) {
    highlightBlockType =
      nextRef.type === 'call' ? (nextRef.fn === 'F2' ? 'call_f2' : 'call_f1') : nextRef.type;
  }

  if (safeTier === 1) {
    const refUsesRepeat = programContainsType(normRef.main, 'repeat');
    const userUsesRepeat = programContainsType(normUser.main, 'repeat');
    const refUsesIf = programContainsType(normRef.main, 'if');
    const userUsesIf = programContainsType(normUser.main, 'if');
    const refUsesCall = programContainsType(normRef.main, 'call');
    const userUsesCall = programContainsType(normUser.main, 'call');

    let conceptTip = isEn ? level.hintEn : level.hintPt;
    if (refUsesCall && !userUsesCall) {
      conceptTip = isEn
        ? '💡 Companion Tip (1/2): Spot the repeating combo and build it inside ⚡ F1 first!'
        : '💡 Pista do Drone (1/2): Repare na sequência que se repete e monte ela dentro de ⚡ F1!';
    } else if (refUsesIf && !userUsesIf) {
      conceptTip = isEn
        ? '💡 Companion Tip (1/2): Use the 🔎 If sensor so AstroBit checks the path before acting!'
        : '💡 Pista do Drone (1/2): Use o sensor 🔎 Se para o AstroBit checar o caminho antes de agir!';
    } else if (refUsesRepeat && !userUsesRepeat) {
      conceptTip = isEn
        ? '💡 Companion Tip (1/2): Look for repeated moves — wrapping them in 🔁 Repeat saves pieces!'
        : '💡 Pista do Drone (1/2): Procure movimentos repetidos — um bloco 🔁 Repetir economiza várias peças!';
    } else {
      conceptTip = isEn
        ? `💡 Companion Tip (1/2): ${conceptTip}`
        : `💡 Pista do Drone (1/2): ${conceptTip}`;
    }

    return {
      tier: 1,
      message: conceptTip,
      highlightBlockType: null,
    };
  }

  // Tier 2: concrete next piece highlighted in gold!
  const msg = isEn
    ? `✨ Companion Tip (2/2): Try snapping the glowing golden piece next! (${level.hintEn})`
    : `✨ Pista do Drone (2/2): Tente encaixar agora a peça brilhando em dourado! (${level.hintPt})`;

  return {
    tier: 2,
    message: msg,
    highlightBlockType,
  };
}
