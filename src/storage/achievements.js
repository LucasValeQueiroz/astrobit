/**
 * AstroBit Space Achievements & Badges System (100% pure, DOM-free).
 * Tracks 12 unlockable space medals with gamified notifications.
 */

import { getTotalStars } from './progress.js?v=4.0';

export const SPACE_BADGES = [
  {
    id: 'first-flight',
    icon: '🚀',
    namePt: 'Primeiro Voo',
    nameEn: 'First Flight',
    descPt: 'Complete sua primeira missão espacial',
    descEn: 'Complete your first space mission',
  },
  {
    id: 'star-collector',
    icon: '⭐',
    namePt: 'Caçador de Estrelas',
    nameEn: 'Star Collector',
    descPt: 'Acumule 15 estrelas na campanha',
    descEn: 'Earn 15 stars across the campaign',
  },
  {
    id: 'loop-master',
    icon: '🔁',
    namePt: 'Mestre dos Loops',
    nameEn: 'Loop Master',
    descPt: 'Vença uma fase usando o bloco Repetir',
    descEn: 'Win a level using a Repeat block',
  },
  {
    id: 'portal-jumper',
    icon: '🌀',
    namePt: 'Salto Quântico',
    nameEn: 'Quantum Jumper',
    descPt: 'Atravesse um portal espacial em uma missão',
    descEn: 'Teleport through a space portal in a mission',
  },
  {
    id: 'sensor-brain',
    icon: '🔎',
    namePt: 'Cérebro Robótico',
    nameEn: 'Robot Brain',
    descPt: 'Vença uma fase usando o sensor Se',
    descEn: 'Win a level using an If sensor block',
  },
  {
    id: 'chip-architect',
    icon: '⚡',
    namePt: 'Arquiteto de Chips',
    nameEn: 'Chip Architect',
    descPt: 'Vença uma fase usando Super-Chips F1/F2',
    descEn: 'Win a level using F1/F2 Super-Chips',
  },
  {
    id: 'bug-hunter',
    icon: '🐛',
    namePt: 'Caçador de Bugs',
    nameEn: 'Bug Hunter',
    descPt: 'Conserte uma fase "Caça ao Bug!"',
    descEn: 'Fix a "Bug Hunt!" debugging level',
  },
  {
    id: 'perfectionist',
    icon: '💎',
    namePt: 'Perfeccionista 3★',
    nameEn: '3★ Perfectionist',
    descPt: 'Conquiste 3 estrelas em 10 fases',
    descEn: 'Earn 3 stars on 10 different levels',
  },
  {
    id: 'workshop-creator',
    icon: '🛠️',
    namePt: 'Criador Galáctico',
    nameEn: 'Galactic Creator',
    descPt: 'Crie e salve uma fase na Oficina Criadora',
    descEn: 'Create and save a level in the Workshop',
  },
  {
    id: 'daily-hero',
    icon: '🔥',
    namePt: 'Piloto Diário',
    nameEn: 'Daily Pilot',
    descPt: 'Complete uma Missão Diária espacial',
    descEn: 'Complete a Daily Space Mission',
  },
  {
    id: 'earth-savior',
    icon: '🌍',
    namePt: 'Herói da Terra',
    nameEn: 'Savior of Earth',
    descPt: 'Religue o Farol Solar e salve a humanidade (Fase 5-6)',
    descEn: 'Reignite the Solar Beacon and save Earth (Level 5-6)',
  },
  {
    id: 'wormhole-legend',
    icon: '👑',
    namePt: 'Lenda Quântica',
    nameEn: 'Quantum Legend',
    descPt: 'Domine o Mundo 6 Bônus: Buraco de Minhoca (Fase 6-6)',
    descEn: 'Conquer Bonus World 6: Wormhole Dimension (Level 6-6)',
  },
  {
    id: 'aaa-engineer',
    icon: '🧪',
    namePt: 'Engenheiro de Games AAA',
    nameEn: 'AAA Game Engineer',
    descPt: 'Domine todos os 7 segredos no Laboratório de Games AAA',
    descEn: 'Master all 7 secrets in the AAA Game Engineering Lab',
  },
];

function programHasType(blocks = [], targetType) {
  if (!Array.isArray(blocks)) return false;
  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue;
    if (b.type === targetType) return true;
    if (b.type === 'repeat' && programHasType(b.body, targetType)) return true;
    if (b.type === 'if' && (programHasType(b.then, targetType) || programHasType(b.else, targetType))) {
      return true;
    }
  }
  return false;
}

/**
 * Evaluates all badge conditions from current progress + optional latest win context.
 * Returns updated `unlockedBadges` list and `newlyUnlocked` badge objects for toast popups.
 */
export function evaluateBadges(progress, context = {}) {
  const already = new Set(Array.isArray(progress?.unlockedBadges) ? progress.unlockedBadges : []);
  const newlyUnlocked = [];

  const grant = (id) => {
    if (already.has(id)) return;
    const badge = SPACE_BADGES.find((b) => b.id === id);
    if (badge) {
      already.add(id);
      newlyUnlocked.push(badge);
    }
  };

  const starsMap = progress?.starsByLevel || {};
  const completedCount = Object.values(starsMap).filter((s) => Number(s) > 0).length;
  const threeStarCount = Object.values(starsMap).filter((s) => Number(s) >= 3).length;
  const totalStars = getTotalStars(progress);

  if (completedCount >= 1 || context.won) grant('first-flight');
  if (totalStars >= 15) grant('star-collector');
  if (threeStarCount >= 10) grant('perfectionist');
  if (Array.isArray(progress?.customLevels) && progress.customLevels.length >= 1) {
    grant('workshop-creator');
  }
  if (Array.isArray(progress?.dailyCompletedDates) && progress.dailyCompletedDates.length >= 1) {
    grant('daily-hero');
  }
  if (Number(starsMap['w5-6'] || 0) > 0) grant('earth-savior');
  if (Number(starsMap['w6-6'] || 0) > 0) grant('wormhole-legend');
  if (Array.isArray(progress?.labMasteredTopics) && progress.labMasteredTopics.length >= 7) {
    grant('aaa-engineer');
  }

  if (context.won) {
    const main = context.program?.main || [];
    const f1 = context.program?.functions?.F1 || [];
    const f2 = context.program?.functions?.F2 || [];
    if (programHasType(main, 'repeat') || programHasType(f1, 'repeat') || programHasType(f2, 'repeat')) {
      grant('loop-master');
    }
    if (programHasType(main, 'if') || programHasType(f1, 'if') || programHasType(f2, 'if')) {
      grant('sensor-brain');
    }
    if (programHasType(main, 'call') || f1.length > 0 || f2.length > 0) {
      grant('chip-architect');
    }
    if (Array.isArray(context.events) && context.events.some((e) => e.type === 'teleport')) {
      grant('portal-jumper');
    }
    if (context.level?.isBugHunt) {
      grant('bug-hunter');
    }
    if (context.level?.isDaily) {
      grant('daily-hero');
    }
  }

  return {
    unlockedBadges: [...already],
    newlyUnlocked,
  };
}
